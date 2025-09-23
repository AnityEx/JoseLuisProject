/* LIBRERIAS NECESARIAS INSTALA COMO NPM */
const TelegramBot = require('node-telegram-bot-api');
const fuzzysort = require('fuzzysort');

/* TOKEN Y BOT DE TELEGRAM */
const token = '8305739458:AAHzOd_jbPr8gvzZ3kovxoQspXmpoSZWnSU'
const bot = new TelegramBot(token, { polling: true });

/* PALABRAS CLAVE A DETECTAR CON FUZZYSORT */
const sospechas = [
    'urgente',
    'actualice',
    'datos',
    'bloqueada',
    'verifique',
    'identidad',
];

// Umbral de detección que tan similar son los mensajes a las sospechas (0 poco) (1 mucho)
const similar_fuzzy = 0.30;


bot.on('message', (msg) => {
    const chatId = msg.chat.id
    // la variable texto solo se activa si el mensaje contiene texto, sino queda vacio y resulta en nada
    const texto = (msg.text || '').toLowerCase();

    console.log(`Mensaje recibido: "${texto}"`);

    //arreglo donde se guardaran las palabras sospechosas
    const coincidencias = [];

    //si el resultado de la busqueda de sospechas por palabra es 
    sospechas.forEach(palabra => {
        const result = fuzzysort.single(palabra, texto);
        if (result) {
            console.log(`🔍 Palabra: "${palabra}" → Score: ${result.score}`);
            if (result.score >= similar_fuzzy) {
                coincidencias.push(palabra);
            }
        } else {
            console.log(`🔍 Palabra: "${palabra}" → No coincidencia`);
        }


    });

    if (coincidencias.length > 0) {
        bot.sendMessage(chatId, `⚠️ Este mensaje es probablemente fraudulento.\nCoincidencias: ${coincidencias.join(', ')}`);
    } else {
        bot.sendMessage(chatId, '✅ El mensaje no parece fraudulento.');
    }
});