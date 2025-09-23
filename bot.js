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

// Umbral de detección que tan similar son los mensajes a las sospechas
const similar_fuzzy = -20;


bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const texto = (msg.text || '').toLowerCase();

    console.log(`📩 Mensaje recibido: "${texto}"`);

    const coincidencias = [];

    sospechas.forEach(keyword => {
        const result = fuzzysort.single(keyword, texto);
        if (result) {
            console.log(`🔍 Palabra: "${keyword}" → Score: ${result.score}`);
            if (result.score <= similar_fuzzy) {
                coincidencias.push(keyword);
            }
        } else {
            console.log(`🔍 Palabra: "${keyword}" → No coincidencia`);
        }
    });

    if (coincidencias.length > 0) {
        bot.sendMessage(chatId, `⚠️ Este mensaje es probablemente fraudulento.\nCoincidencias: ${coincidencias.join(', ')}`);
    } else {
        bot.sendMessage(chatId, '✅ El mensaje no parece fraudulento.');
    }
});