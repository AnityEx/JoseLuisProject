'use strict';
import TelegramBot from 'node-telegram-bot-api';
import stringSimilarity from 'string-similarity';
import db from './db.js';
import SafeBrowsingLookup from './libraries/SafeBrowsingLookup.js'; const safeApi = SafeBrowsingLookup({ apiKey: process.env.googleapi });
import { Limiter } from '@mediv0/rate-limit';
import Redis from 'ioredis';
import { Clasificador } from './BERTo.js';
import { obtenerWhiteList } from './db.js';


//puerto de redis
const redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
})
/*redis.set("test", "hola redis!");
const value = await redis.get("test");
console.log("🔹 Redis dice:", value);*/

const token = process.env.Telegram_token;// TOKEN Y BOT DE TELEGRAM
const bot = new TelegramBot(token, { polling: true });


const similaridad = 0.85;// Umbral de detección

let mensajesDetectados = 0;// Estadísticas

let cachePalabras = [];// Caché local de palabras clave

const estados = {};// Estado temporal por chat

const contadorMensajes = [];

const ADMIN_IDS = [
    8423246471, //id German
    /*     7280579876, //id Lana*/
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

//cargar la whitelist 
let urlsSeguras = [];

async function cargarWhiteList() {
    const whiteList = await obtenerWhiteList();

    urlsSeguras = whiteList.map(item => item.url);
    console.log("WhiteList cargada:", urlsSeguras);
}

cargarWhiteList();  // 🚀 La cargamos al inicio


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
    const chatId = msg.chat.id;
    const texto = (msg.text || '').toLowerCase();
    const ArregloTexto = texto.split(/\s+/);// separa el mensaje por espacios

    /* ---------- 1. Palabras clave ---------- */
    if (cachePalabras.length === 0) {
        bot.sendMessage(chatId, '❌ Error. No hay palabras clave cargadas.');
        return;
    }

    const coincidencias = [];

    for (const palabrasMensaje of ArregloTexto) {
        for (const palabraClave of cachePalabras) {
            const sim = stringSimilarity.compareTwoStrings(palabrasMensaje, palabraClave.palabra);
            if (sim >= similaridad) {
                coincidencias.push(`${palabrasMensaje} ≈ ${palabraClave.palabra} (${(sim * 100).toFixed(1)}%)`);
            }
        }
    }

    /* ---------- 1.5 clasificador BERTo ---------- */
    let IntuicionBETO;
    async function BERToClasifier() {
        IntuicionBETO = await Clasificador(texto);
        console.log("➡️ Intuición:", IntuicionBETO);
        return
    }

    // Llamas a la función aquí
    //se cambio para evitar que se rompa el resumen del analicis ya que
    //  berto se tarda uno o dos milisegundos en enviar lo datos cuando es mensaje largo 
    await BERToClasifier();


    /* ---------- 2. Enlaces ---------- */
    const LinksSospechosos = ExtractorDeLinks(msg.text || '');//array de links

    //verificacion de links primero por la whitelist 
    //luego para a safebrowsing
    // --- VALIDAR SI ALGÚN LINK ES OFICIAL (WhiteList) ---
    const linksOficiales = LinksSospechosos.filter(url => urlsSeguras.includes(url));

    if (linksOficiales.length > 0) {
        // Si detectamos un link oficial  mensaje seguro de una vez
        console.log("🟢 Enlace oficial detectado:", linksOficiales);

        bot.sendMessage(chatId, `
🔐 Enlace oficial detectado:
${linksOficiales.join("\n")}

El mensaje parece legítimo porque contiene enlaces verificados.
    `, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '⬅️ Menu', callback_data: 'start_menu' },
                        { text: '🔄 Analizar otro', callback_data: 'detect_fraud' }
                    ]
                ]
            }
        });

        return; // 🚀 No seguimos analizando (se detiene aquí)
    }


    async function checklinks() {
        try {
            const urlMap = await safeApi.checkMulti(LinksSospechosos);
            for (let url in urlMap) {
                console.log(urlMap[url] ? `🔴 MALCIOSO ${url} ` : `🟡 Seguro ${url}`);
            }
            return urlMap || [];
        } catch (err) {
            console.error('Error al comprobar enlaces', err);
            return [];
        }
    }
    const urlMap = await checklinks();

    const linksMaliciosos = Object.entries(urlMap)
        .filter(([_, esMalicioso]) => esMalicioso)
        .map(([url]) => url);



    /* ---------- 3. Nivel de riesgo ---------- */
    const resultadoRiesgo = evaluarNivelRiesgo(

        coincidencias,
        cachePalabras,
        linksMaliciosos);
    /* ---------- 4. Resumen a enviar ---------- */

    const LinksOrdenados = Object.entries(urlMap).map(([url, malicioso]) => `${malicioso ? '🔴 MALICIOSO' : '🟡 Parece Seguro'} → ${url}`);

    //valores de intuicion
    /*     const label = IntuicionBETO?.prediction?.[0]?.label ?? "⚠️ Sin datos";
        const scoreP = IntuicionBETO?.prediction?.[0]?.score;
        const percent = scoreP !== undefined ? `${Math.round(scoreP * 100)}%` : ""; */
    //aqui se agrega una validacion para evitar un valor vacio y que esto active el catch del limitador

    /*         - Riesgo ALTO: ${resultadoRiesgo.conteo.alto}
    - Riesgo MEDIO: ${resultadoRiesgo.conteo.medio}
    - Riesgo BAJO: ${resultadoRiesgo.conteo.bajo} 
    ${coincidencias.length > 0 ? `\n🔑 *Coincidencias encontradas:* \n${coincidencias.join('\n')}` : ''}
    */
    /*     const resumen = `
            
    🔍 *Resultado del análisis:*
    - Intuición: ${percent} ${label}
    - Palabras Peligrosas: ${coincidencias.length}
    - Enlaces maliciosos: ${resultadoRiesgo.conteo.maliciosos > 0 ? '🔴 Sí' : '🟢 No'}
        /*         - Riesgo ALTO: ${resultadoRiesgo.conteo.alto}
        - Riesgo MEDIO: ${resultadoRiesgo.conteo.medio}
        - Riesgo BAJO: ${resultadoRiesgo.conteo.bajo} 
        ${coincidencias.length > 0 ? `\n🔑 *Coincidencias encontradas:* \n${coincidencias.join('\n')}` : ''}
        
    ${resultadoRiesgo.mensaje}
    
    ${LinksOrdenados.length > 0 ? `\n🔗 *Enlaces analizados:* \n${LinksOrdenados.join('\n')}` : ''}
    `;
    */
    function riesgoTotal(resultadoRiesgo, coincidencias, intuicionBETO) {
        let riesgo = 0;

        // 1. Enlaces maliciosos
        if (resultadoRiesgo.conteo.maliciosos > 0) {
            riesgo += 2;
        }

        // 2. Palabras peligrosas
        riesgo += coincidencias.length * 0.1;

        // 3. Multiplicador por riesgo
        if (resultadoRiesgo.conteo.alto > 0) {
            riesgo *= 1.8;
        } else if (resultadoRiesgo.conteo.medio > 0) {
            riesgo *= 1.2;
        }

        // 4. BETO
        const prediction = intuicionBETO?.prediction?.[0];
        const score = prediction?.score ?? 0;
        const label = prediction?.label ?? "Desconocido";

        if (score >= 0.7) {
            if (label === "Malicioso") {
                riesgo += 0.3;
            } else if (label === "Seguro") {
                riesgo -= 0.2;
            }
        }

        // Limitar riesgo entre 0 y 1
        riesgo = Math.max(0, Math.min(riesgo, 1));

        // Preparar percent
        const percent = score ? `${Math.round(score * 100)}%` : "⚠️ Sin datos";

        // Preparar resumen (igual que tu código viejo)
        const LinksOrdenados = Object.entries(resultadoRiesgo.urlMap ?? {}).map(
            ([url, malicioso]) => `${malicioso ? '🔴 MALICIOSO' : '🟡 no levanta sospecha'} → ${url}`
        );

        //OVERRIDE POR SI HAY URL MALAS
        let percentFinal = percent;
        let labelFinal = label;
        const hayLinksMaliciosos = (resultadoRiesgo.conteo.maliciosos ?? 0) > 0;

        if (hayLinksMaliciosos) { // tu condición de override
            percentFinal = '100%';
            labelFinal = 'Malicioso';
        }
        const resumen = `
🔍 Resultado del análisis:
- Intuición: ${percentFinal} ${labelFinal}
- Palabras sospechosas: ${coincidencias.length}
- Enlaces maliciosos: ${resultadoRiesgo.conteo.maliciosos > 0 ? '🔴 Sí' : '🟢 No'}

- RIESGO TOTAL: ${Math.round(riesgo * 100)}%

${resultadoRiesgo.mensaje}

${LinksOrdenados.length > 0 ? `\n🔗 *Enlaces analizados:* \n${LinksOrdenados.join('\n')}` : ''}
`;

        return resumen;
    }
    const resumen = riesgoTotal(resultadoRiesgo, coincidencias, IntuicionBETO);


    bot.sendMessage(chatId, resumen, {
        parse_mode: "HTML", //se cambio el Markdow ya que este delimitaba los caracteres especiales 
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📜 Ayuda', callback_data: 'help' },
/*                         { text: '⬅️ Menu', callback_data: 'start_menu' },
 */                        { text: '🔄 Reintentar', callback_data: 'detect_fraud' }
                ]
            ]
        }
    });


    /* ---------- 5. Contador de mensajes por chat ---------- */
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
        /*         [
                    { text: '🔍 Detectar fraude', callback_data: 'detect_fraud' }
                ], */
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
        '🔍 Escribe un mensaje y lo analizaré para ver si es fraudulento.',
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


        /*bot.sendMessage(chatId, `${textoOCR}`);// Aquí, enviamos el resultado del OCR como respuesta*/
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
        bot.sendMessage(chatId, '👋 ¡Hola! Bienvenido a D.A.L.A \n\nVisita nuestra pagina web para informarte sobre como lidiar con estafas!\n\nhttps://dala-ajm.pages.dev/ \n(sitio interino)\n\n📝 Comandos disponibles:\n/start\n');
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

// ---- delimitacion de cantidad de mensajes ----
const Max_MSGS = 5; //maximo de mensajes 
const interval = 10; //segundos


// --- funcionalidad inmediata ---
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const texto = (msg.text || '').trim();
    const now = Math.floor(Date.now() / 1000); //tiempo 

    const key = `rate_limit:${chatId}`;

    try {
        // verifica si el usuario excedió el límite
        const count = await redis.incr(key);

        if (count === 1) {
            //Primera solicitud 
            await redis.expire(key, interval);
        }

        if (count > Max_MSGS) {
            const ttl = await redis.ttl(key);
            return bot.sendMessage(
                chatId,
                `🕒 Has superado el límite de mensajes.\nPor favor espera *${ttl} segundos* antes de volver a intentarlo.`,
                { parse_mode: "Markdown" }
            );
        }



        // Ignorar si es un comando 
        if (msg.text && msg.text.startsWith('/')) return;

        //ignorara mensaje de botones 
        if (msg.data) return;

        // Si no hay texto (por ejemplo stickers, audios), ignorar
        if (!msg.text) return;


        const palabras = texto.split(/\s+/);

        console.log(`Mensaje recibido: "${texto}" con ${palabras.length} palabras`);

        // EXTRAER LINKS ANTES DE HACER CUALQUIER OTRA COSA
        const linksDetectados = ExtractorDeLinks(texto);

        if (linksDetectados.length > 0) {
            bot.sendMessage(
                chatId,
                `🔍 Detecté un enlace en tu mensaje.\nEstoy analizándolo...`
            );
            await analizarMensaje(msg);
            return;
        }
        //  SI ES MENSAJE CORTO → SALUDO
        if (palabras.length <= 2) {
            bot.sendMessage(chatId,
                '🔍 Escribe un mensaje y lo analizaré para ver si es fraudulento.',
                { parse_mode: "Markdown" }
            );
            return;
        }

        //  SI ES MENSAJE LARGO → ANALIZAR AUTOMÁTICAMENTE
        bot.sendMessage(chatId,
            `🤖 Gracias por tu mensaje.\n🔍 *Estoy analizando el contenido...*`,
            { parse_mode: "Markdown" }
        );

        await analizarMensaje(msg);

    } catch (error) {
        console.error("Error en redis o limitador:", error);
        bot.sendMessage(chatId, "⚠️ Ocurrió un error con el limitador. Intenta de nuevo más tarde.");
    }
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

    //validacion d entrada 

    const regexPalabra = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]+$/;
    const nivelesPermitidos = ['bajo', 'medio', 'alto'];
    if (!regexPalabra.test(palabra) || !nivelesPermitidos.includes(nivelRiesgo.toLowerCase())) {
        return bot.sendMessage(chatId, '⚠️ Formato inválido o nivel de riesgo no permitido. Usa: /agregar palabra [bajo|medio|alto]');
    }


    try {
        await db.agregarPalabra(palabra, nivelRiesgo);
        await cargarPalabras(); // Actualiza caché
        bot.sendMessage(chatId, `✅ La palabra "${palabra}" con nivel "${nivelRiesgo}" ha sido agregada.`);
    } catch (error) {
        console.error("Error al agregar palabra:", error);
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


    //validacion d entrada 

    const regexPalabra = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9_]+$/;
    const nivelesPermitidos = ['bajo', 'medio', 'alto'];
    if (!regexPalabra.test(palabra) || !nivelesPermitidos.includes(nuevoNivel.toLowerCase())) {
        return bot.sendMessage(chatId, '⚠️ Formato inválido o nivel de riesgo no permitido. Usa: /agregar palabra [bajo|medio|alto]');
    }

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
    const urlRegexSimple = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,63})\b/gi;
    const link = texto.match(urlRegex);
    console.log(link);
    return link || []; // Nunca devolver null, siempre array
}