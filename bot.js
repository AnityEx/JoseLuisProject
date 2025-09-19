const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');  // <-- Aquí importas fs

// 🔑 Pega aquí tu token
const token = '8305739458:AAHzOd_jbPr8gvzZ3kovxoQspXmpoSZWnSU';

// ⚙️ Crea el bot (modo polling: escucha mensajes)
const bot = new TelegramBot(token, { polling: true });

// 🤖 Cuando alguien escribe /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '¡Hola! Soy tu bot de Telegram 🤖');
});

// 📝 Cuando recibe cualquier otro mensaje
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    
    if (text === '/secret') {
        bot.sendMessage(chatId, `alav conoces la llave 👀`);
/*         bot.sendDocument(chatId, fs.createReadStream('pdf/Proyect002.pdf'));
 */    }
    else if (text !== '/start') {
        bot.sendMessage(chatId, `Dijiste: "${text}" 👀`);
/*         bot.sendPhoto(chatId, fs.createReadStream('img/kirbo.jpg')); */
    }
});
