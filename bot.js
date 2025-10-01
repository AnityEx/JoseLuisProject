/* LIBRERÍAS NECESARIAS INSTALA COMO NPM */
const TelegramBot = require('node-telegram-bot-api');
const stringSimilarity = require('string-similarity');
const db = require('./db'); // Asegúrate de que db.js esté correctamente configurado

// TOKEN Y BOT DE TELEGRAM (usa el tuyo desde .env si prefieres)
const token = '8305739458:AAHzOd_jbPr8gvzZ3kovxoQspXmpoSZWnSU';
const bot = new TelegramBot(token, { polling: true });

// Iniciar conexión y cargar palabras clave en caché al arrancar el bot
(async () => {
    try {
        await db.connectDB();        // Se conecta a MongoDB Atlas
        await cargarPalabras();      // Precarga las palabras en caché
        console.log("✅ Bot listo y caché inicializada.");
    } catch (err) {
        console.error("❌ Error al iniciar el bot:", err);
    }
})();

// Umbral de detección
const similaridad = 0.45;

// Estadísticas
let mensajesDetectados = 0;

// Caché local de palabras clave
let cachePalabras = [];

// Estado temporal por chat
const estados = {};

// Función para cargar palabras clave de la base de datos
async function cargarPalabras() {
    try {
        cachePalabras = await db.obtenerPalabrasClave();
        return cachePalabras;
    } catch (err) {
        console.error("Error al cargar palabras clave:", err);
        return [];
    }
}

// Función para manejar el análisis de cada mensaje
async function analizarMensaje(msg) {
    console.log(">>> Analizando mensaje:", msg.text);
    const texto = (msg.text || '').toLowerCase();
    const chatId = msg.chat.id;

    const arregloPalabras = cachePalabras;

    if (arregloPalabras.length === 0) {
        bot.sendMessage(chatId, '❌ No se pueden detectar fraudes. No hay palabras clave cargadas.');
        return;
    }

    const mensaje = texto.split(/\s+/);
    const coincidencias = [];

    for (const palabraMensaje of mensaje) {
        for (const palabraClave of arregloPalabras) {
            const sim = stringSimilarity.compareTwoStrings(palabraMensaje, palabraClave.palabra);
            if (sim >= similaridad) {
                coincidencias.push(`${palabraMensaje} ≈ ${palabraClave.palabra} (${(sim * 100).toFixed(1)}%)`);
            }
        }
    }

    if (coincidencias.length > 0) {
        bot.sendMessage(chatId, `⚠️ **Este mensaje es probablemente fraudulento**.\nCoincidencias:\n${coincidencias.join('\n')}`, { parse_mode: "Markdown" });
        mensajesDetectados++;
    } else {
        bot.sendMessage(chatId, '✅ El mensaje **no** parece fraudulento.', { parse_mode: "Markdown" });
    }
}

// Menú inline
function generarMenu(chatId) {
    const menuOptions = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🔍 Detectar fraude', callback_data: 'detect_fraud' },
                    { text: '➕ Agregar palabra clave', callback_data: 'add_keyword' }
                ],
                [
                    { text: '🗑️ Eliminar palabra clave', callback_data: 'remove_keyword' },
                    { text: '🔄 Ver palabras clave', callback_data: 'view_keywords' }
                ],
                [
                    { text: '⚙️ Actualizar palabra clave', callback_data: 'update_keyword' },
                    { text: '📜 Ayuda', callback_data: 'help' }
                ]
            ]
        }
    };
    bot.sendMessage(
        chatId,
        '👋 ¡Hola! Soy tu bot de **detección de fraude**.\n\nElige una opción:',
        { ...menuOptions, parse_mode: "Markdown" }
    );
}

// /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    generarMenu(chatId);
});
// --- CALLBACKS ---
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const action = query.data;

    console.log("Callback recibido:", action);

    if (action === 'detect_fraud') {
        console.log("Modo detección activado para:", chatId);
        estados[chatId] = "detectando"; // activar modo detección
        bot.sendMessage(chatId, '🔍 Escribe un mensaje y lo analizaré para ver si es fraudulento.');
    } else if (action === 'add_keyword') {
        bot.sendMessage(chatId, '➕ Envía en este formato:\n/agregar [palabra] [nivel_riesgo]');
    } else if (action === 'remove_keyword') {
        bot.sendMessage(chatId, '🗑️ Envía en este formato:\n/eliminar [palabra]');
    } else if (action === 'view_keywords') {
        const palabras = await db.obtenerPalabrasClave();
        if (palabras.length === 0) {
            bot.sendMessage(chatId, '🚫 No hay palabras clave en la base de datos.');
        } else {
            const palabrasList = palabras.map(p => `${p.palabra} - Nivel: ${p.nivel_riesgo}`).join('\n');
            bot.sendMessage(chatId, `🔑 **Palabras clave**:\n${palabrasList}`, { parse_mode: "Markdown" });
        }
    } else if (action === 'update_keyword') {
        bot.sendMessage(chatId, '🔄 Envía en este formato:\n/actualizar [palabra] [nuevo_nivel_riesgo]');
    } else if (action === 'help') {
        bot.sendMessage(chatId, '📝 Comandos disponibles:\n/start\n/detectar [mensaje]\n/agregar [palabra] [nivel_riesgo]\n/eliminar [palabra]\n/ver_palabras\n/actualizar [palabra] [nivel_riesgo]');
    }

    bot.answerCallbackQuery(query.id);
});

// --- INTERCEPTAR MENSAJES CUANDO ESTÁ EN MODO DETECCIÓN ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Ignorar si el mensaje es un comando (/algo)
    if (msg.text && msg.text.startsWith('/')) return;
console.log("Mensaje recibido (no comando):", msg.text, "estado:", estados[chatId]);

    if (estados[chatId] === "detectando") {
         console.log(">>> Analizando mensaje...");
        await analizarMensaje(msg);
        estados[chatId] = null; // limpiar estado
    }
});
// --- COMANDOS ---

bot.onText(/\/detectar (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const texto = match[1];
    await analizarMensaje({ text: texto, chat: { id: chatId } });
});

bot.onText(/\/agregar (\w+) (\w+)/, async (msg, match) => {
    console.log("Se recibió comando /agregar:", match);
    const chatId = msg.chat.id;
    const palabra = match[1];
    const nivelRiesgo = match[2];
    try {
        await db.agregarPalabra(palabra, nivelRiesgo);
        await cargarPalabras(); // Actualiza caché
        bot.sendMessage(chatId, `✅ La palabra "${palabra}" con nivel "${nivelRiesgo}" ha sido agregada.`);
    } catch {
        bot.sendMessage(chatId, '❌ Error al agregar la palabra.');
    }
});

bot.onText(/\/eliminar (\w+)/, async (msg, match) => {
    console.log("Se recibió comando /eliminar:", match);
    const chatId = msg.chat.id;
    const palabra = match[1];
    try {
        await db.eliminarPalabra(palabra);
        await cargarPalabras(); // Actualiza caché
        bot.sendMessage(chatId, `✅ La palabra "${palabra}" ha sido eliminada.`);
    } catch {
        bot.sendMessage(chatId, '❌ Error al eliminar la palabra.');
    }
});

bot.onText(/\/ver_palabras/, async (msg) => {
    const chatId = msg.chat.id;
    const palabras = await db.obtenerPalabrasClave();
    if (palabras.length === 0) {
        bot.sendMessage(chatId, '🚫 No hay palabras clave en la base de datos.');
    } else {
        const palabrasList = palabras.map(p => `${p.palabra} - Nivel: ${p.nivel_riesgo}`).join('\n');
        bot.sendMessage(chatId, `🔑 **Palabras clave**:\n${palabrasList}`, { parse_mode: "Markdown" });
    }
});

bot.onText(/\/actualizar (\w+) (\w+)/, async (msg, match) => {
    console.log("Se recibió comando /actualizar:", match);
    const chatId = msg.chat.id;
    const palabra = match[1];
    const nuevoNivel = match[2];
    try {
        await db.actualizarPalabra(palabra, nuevoNivel);
        await cargarPalabras(); // Actualiza caché
        bot.sendMessage(chatId, `✅ La palabra "${palabra}" ahora tiene nivel "${nuevoNivel}".`);
    } catch {
        bot.sendMessage(chatId, '❌ Error al actualizar la palabra.');
    }
});



