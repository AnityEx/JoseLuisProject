const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const token = '8305739458:AAHzOd_jbPr8gvzZ3kovxoQspXmpoSZWnSU';

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Sospechas de algun fraude? puedo ayudarte!');
});


bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;


    switch (text) {
        case '/start':
            // No hacer nada
            break;
        case '/info':
            bot.sendMessage(chatId, `/info\nLista de comandos:\n---------------------------------------------------------------\n/texto - Revisaré mensajes sospechosos \n/captura - Envia una imagen y lo analizaré`);
            break;
        case '/texto':
            bot.sendMessage(chatId, `Necesitas ayuda? Pon el mensaje de texto que te han enviado en el siguiente chat`);
            break;
        case '/captura':
            bot.sendMessage(chatId, `Necesitas ayuda? Pon la captura que sobre lo que te han enviado en el siguiente chat`)
            break;
        default:
            bot.sendMessage(chatId, `"${text}" no es un comando, usa /info para la lista de comandos`);

            break;
    }


});
