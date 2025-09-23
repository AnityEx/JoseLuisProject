/* LIBRERIAS NECESARIAS INSTALA COMO NPM */
const TelegramBot = require('node-telegram-bot-api');
const stringSimilarity = require('string-similarity');

/* TOKEN Y BOT DE TELEGRAM */
const token = '8305739458:AAHzOd_jbPr8gvzZ3kovxoQspXmpoSZWnSU'
const bot = new TelegramBot(token, { polling: true });

/* PALABRAS CLAVE A DETECTAR CON STRING SIMILARITY */
const arregloPalabras = [
    'urgente',
    'actualice',
    'datos',
    'bloqueada',
    'verifique',
    'identidad',
    'datos',
    'codigo',
    'escriba el codigo',
    'enlace',
    'escriba sus credenciales',
    'login',
];

// Umbral de detección que tan similar son los mensajes a las sospechas (0 poco) (1 mucho)
const similaridad = 0.45;


bot.on('message', (msg) => {
    const chatId = msg.chat.id
    // la variable texto solo se activa si el mensaje contiene texto, sino queda vacio y resulta en nada
    const texto = (msg.text || '').toLowerCase();

    console.log(`Mensaje recibido: "${texto}"`);
    const mensaje = texto.split(/\s+/); // separa el mensaje en palabras

    //arreglo donde se guardaran las palabras sospechosas
    const coincidencias = [];

    //si hay palabras que coinciden entonces va a darles porccentaje de aproximación
    mensaje.forEach(palabraMensaje => {
        arregloPalabras.forEach(palabraClave => {
            const sim = stringSimilarity.compareTwoStrings(palabraMensaje, palabraClave);
            if (sim >= similaridad) {
                coincidencias.push(`${palabraMensaje} ≈ ${palabraClave} (${(sim * 100).toFixed(1)}%)`);
            }
        });
    });

    if (coincidencias.length > 0) {
        bot.sendMessage(chatId, `⚠️ Este mensaje es probablemente fraudulento.\nCoincidencias:\n${coincidencias.join('\n')}`);
    } else {
        bot.sendMessage(chatId, '✅ El mensaje no parece fraudulento.');
    }
});