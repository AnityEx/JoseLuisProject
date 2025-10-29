'use strict';
import TelegramBot from 'node-telegram-bot-api';
import stringSimilarity from 'string-similarity';
import db from './db.js';
import SafeBrowsingLookup from './libraries/SafeBrowsingLookup.js'; const safeApi = SafeBrowsingLookup({ apiKey: 'AIzaSyCjSUgyjlIEvVLTo_LLopPMtI3ybSLhrj4' });

const token = '8305739458:AAHzOd_jbPr8gvzZ3kovxoQspXmpoSZWnSU';// TOKEN Y BOT DE TELEGRAM (usa el tuyo desde .env si prefieres)
const bot = new TelegramBot(token, { polling: true });

const similaridad = 0.65;// Umbral de detección

let mensajesDetectados = 0;// Estadísticas

let cachePalabras = [];// Caché local de palabras clave

const estados = {};// Estado temporal por chat

const contadorMensajes = [];

const ADMIN_IDS = [
    8423246471, //id German
    7280579876, //id Lana
    5951322472 //id Alisson 
];

//funcion de admins 
function esAdmin(userId) {
    return ADMIN_IDS.includes(userId);
}

//-----------------------------------------------------------------------------------------------------------------------------

(async () => {// Iniciar conexión y cargar palabras clave en caché al arrancar el bot
    try {
        await db.connectDB();// Se conecta a MongoDB Atlas
        await cargarPalabras();// Precarga las palabras en caché
        console.log("✅ Bot listo y caché inicializada.");
    } catch (err) {
        console.error("❌ Error al iniciar el bot:", err);
    }
})();

async function cargarPalabras() {// Función para cargar palabras clave de la base de datos
    try {
        cachePalabras = await db.obtenerPalabrasClave();
        return cachePalabras;
    } catch (err) {
        console.error("Error al cargar palabras clave:", err);
        return [];
    }
}

//----------------------------------------------------------------------
//importe de funcion para evaluar el riesgo 
import { evaluarNivelRiesgo } from './detectar_Nivel.js';
//----------------------------------------------------------------------

async function analizarMensaje(msg) {// Función para manejar el análisis de cada mensaje
    const arregloPalabras = cachePalabras;
    const coincidencias = [];
    const texto = (msg.text || '').toLowerCase();
    const chatId = msg.chat.id;
    const mensaje = texto.split(/\s+/);// separa el mensaje por espacios
    console.log("Mensaje recibido:", msg.text);
    if (arregloPalabras.length === 0) {
        bot.sendMessage(chatId, '❌ No se pueden detectar fraudes. No hay palabras clave cargadas.');
        return;
    }
    for (const palabrasMensaje of mensaje) {
        for (const palabraClave of arregloPalabras) {
            const sim = stringSimilarity.compareTwoStrings(palabrasMensaje, palabraClave.palabra);
            if (sim >= similaridad) {
                coincidencias.push(`${palabrasMensaje} ≈ ${palabraClave.palabra} (${(sim * 100).toFixed(1)}%)`);
            }
        }
    }

    const LinksSospechosos = ExtractorDeLinks(msg.text || '');//array de links

    async function checklinks() {
        try {
            const urlMap = await safeApi.checkMulti(LinksSospechosos);
            for (let url in urlMap) {
                console.log(urlMap[url] ? `🔴 LINK MALCIOSO ${url} ` : `🟡 link seguro ${url}`);
            }
            return urlMap || [];

        } catch (err) {
            console.log('Something went wrong.');
            console.log(err);
            return [];
        }
    }
    const urlMap = await checklinks();
    const linksMaliciosos = Object.entries(urlMap)
        .filter(([_, esMalicioso]) => esMalicioso)
        .map(([url]) => url);
    const resultadoRiesgo = evaluarNivelRiesgo(coincidencias, cachePalabras, linksMaliciosos);



    {
        const LinksOrdenados = Object.entries(urlMap)
            .map(([url, malicioso]) => `${malicioso ? '🔴 MALICIOSO' : '🟡 Parece Seguro'} → ${url}`);

        const resumen = `
🔍 *Resultado del análisis:*
- Palabras clave detectadas: ${coincidencias.length}
- Riesgo ALTO: ${resultadoRiesgo.conteo.alto}
- Riesgo MEDIO: ${resultadoRiesgo.conteo.medio}
- Riesgo BAJO: ${resultadoRiesgo.conteo.bajo}
- Enlaces maliciosos: ${resultadoRiesgo.conteo.maliciosos > 0 ? '🔴 Sí' : '🟢 No'}

${resultadoRiesgo.mensaje}

${coincidencias.length > 0 ? `\n🔑 *Coincidencias encontradas:* \n${coincidencias.join('\n')}` : ''}
${LinksOrdenados.length > 0 ? `\n🔗 *Enlaces analizados:* \n${LinksOrdenados.join('\n')}` : ''}
`;

        bot.sendMessage(chatId, resumen, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '⬅️ Menu', callback_data: 'start_menu' },
                        { text: '🔄 Reintentar', callback_data: 'detect_fraud' }
                    ]
                ]
            }
        });

    }

    // contador incremento 
    if (!contadorMensajes[chatId]) {
        contadorMensajes[chatId] = 1;
    } else {
        contadorMensajes[chatId]++;
    }
    // segundo condicionaiento 
    if (contadorMensajes[chatId] === 3) {
        bot.sendMessage(chatId, '🤖 ¿Esta herramienta te fue útil?', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '👍 Sí, fue útil', callback_data: 'feedback_positivo' },
                        { text: '👎 No me ayudó', callback_data: 'feedback_negativo' }
                    ]
                ]
            }
        });
    }
}

const menuOptions = (chatId) => {
    const isAdmin = esAdmin(chatId);
    const menu = [
        [
            { text: '🔍 Detectar fraude', callback_data: 'detect_fraud' }

        ],
        [

            { text: '📜 Ayuda', callback_data: 'help' }
        ],
    ];

    if (isAdmin) {
        menu[0].push({ text: '➕ Agregar palabra clave', callback_data: 'add_keyword' });
        menu.push(
            [
                { text: '🗑️ Eliminar palabra clave', callback_data: 'remove_keyword' },
                { text: '⚙️ Actualizar palabra clave', callback_data: 'update_keyword' },
                { text: '🔄 Ver palabras clave', callback_data: 'view_keywords' },
            ]
        );
    }

    return {
        reply_markup: {
            inline_keyboard: menu
        }
    };


}

function generarMenu(chatId) {// Menú inline
    bot.sendMessage(
        chatId,
        '👋 ¡Hola! Soy tu bot de **detección de fraude**.\n\nElige una opción:',
        { ...menuOptions(chatId), parse_mode: "Markdown" }
    );
}

//---------------------------------------------------------------------
import { LectorImagen } from './OCR.js';  // IMPORTA LA FUNCION OCR
//---------------------------------------------------------------------
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo;
    const fileId = photo[photo.length - 1].file_id;  // Obtener el ID de la foto con mejor calidad

    try {
        const LinkImagen = await bot.getFileLink(fileId);  // Obtener el enlace de la imagen
        console.log("IMAGEN RECIBIDA:", LinkImagen);
        bot.sendMessage(chatId, 'Procesando Imagen...');// Obtener el texto de la imagen usando la función LectorImagen

        const textoOCR = await LectorImagen(LinkImagen);

        if (textoOCR === undefined) {
            console.log(textoOCR);
            throw new Error('OCR result is undefined');
        }



        /*         bot.sendMessage(chatId, `${textoOCR}`);// Aquí, enviamos el resultado del OCR como respuesta*/
        await analizarMensaje({ ...msg, text: textoOCR });


    } catch (error) {
        console.error("Error al procesar la foto:", error);
        bot.sendMessage(chatId, 'Hubo un problema al procesar la imagen.');
    }
});
//---------------------------------------------------------------------


bot.onText(/\/start/, (msg) => {// /start
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
        if (!esAdmin(chatId)) return bot.sendMessage(chatId, '❌ No tienes permiso para usar esta opción.');
        bot.sendMessage(chatId, '➕ Envía en este formato:\n/agregar [palabra] [nivel_riesgo]');
    }
    else if (action === 'remove_keyword') {
        if (!esAdmin(chatId)) return bot.sendMessage(chatId, '❌ No tienes permiso para usar esta opción.');
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
        if (!esAdmin(chatId)) return bot.sendMessage(chatId, '❌ No tienes permiso para usar esta opción.');
        bot.sendMessage(chatId, '🔄 Envía en este formato:\n/actualizar [palabra] [nuevo_nivel_riesgo]');
    } else if (action === 'help') {
        bot.sendMessage(chatId, '📝 Comandos disponibles:\n/start\n/detectar [mensaje]');
    }
    else if (action === 'start_menu') {
        bot.sendMessage(chatId, 'Menú principal.', menuOptions(chatId));
    }
    bot.answerCallbackQuery(query.id);

    //encuesta de satisfaccion 
    if (action === 'feedback_positivo') {
        bot.sendMessage(chatId, '😊 ¡Gracias por tu respuesta! Nos alegra saberlo.');
    } else if (action === 'feedback_negativo') {
        bot.sendMessage(chatId, '😟 Gracias por tu comentario. ¡Trabajaremos en mejorarlo!');
    }
});

// --- funcionalidad inmediata ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    //ignorara mensaje de botones 
    if (msg.data) return;

    // Si no hay texto (por ejemplo stickers, audios), ignorar
    if (!msg.text) return;

    const texto = msg.text.trim();
    const palabras = texto.split(/\s+/);

    console.log(`Mensaje recibido: "${texto}" con ${palabras.length} palabras`);

    // 📌 SI ES MENSAJE CORTO → SALUDO
    if (palabras.length <= 2) {
        bot.sendMessage(chatId,
            `👋 ¡Hola! Bienvenido al bot de *deteccion de estafas *.\n\nEnvíame el mensaje que sospeches de fraude y lo analizaré.`,
            { parse_mode: "Markdown" }
        );
        return;
    }

    // 📌 SI ES MENSAJE LARGO → ANALIZAR AUTOMÁTICAMENTE
    bot.sendMessage(chatId,
        `🤖 Gracias por tu mensaje.\n🔍 *Estoy analizando el contenido...*`,
        { parse_mode: "Markdown" }
    );

    await analizarMensaje(msg);
});
// ----------------------------- COMANDOS ------------------------------

bot.onText(/\/detectar (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const texto = match[1];
    await analizarMensaje({ text: texto, chat: { id: chatId } });
});



bot.onText(/\/agregar (\w+) (\w+)/, async (msg, match) => {
    console.log("Se recibió comando /agregar:", match);
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    //verificar si el usuario es admin 
    if (!esAdmin(userId)) {
        return bot.sendMessage(chatId, ' No tienes permiso para usar este comando ');
    }
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
    const userId = msg.from.id;

    if (!esAdmin(userId)) {
        return bot.sendMessage(chatId, '❌  No tienes permiso para usar este comando.');
    }

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
    const userId = msg.from.id;

    if (!esAdmin(userId)) {
        return bot.sendMessage(chatId, '❌  No tienes permiso para usar este comando');
    }
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
    const userId = msg.from.id;

    if (!esAdmin(userId)) {
        return bot.sendMessage(chatId, '❌ No tienes permiso para usar este comando.');
    }
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



//------------------------------------funciones e utilidades independientes ------------------------------------------
function ExtractorDeLinks(texto) {
    //magia negra para extraer links de un texto a base de comparar texto con "regex" funca para todo
    const urlRegex = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,63}(?::\d{1,5})?(?:\/[^\s"'<>]*)?)/gi;
    const link = texto.match(urlRegex);
    console.log(link);
    return link || []; // Nunca devolver null, siempre array
}