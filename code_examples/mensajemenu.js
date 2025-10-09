function generarMenu(chatId) {
    const menuOptions = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '⬅️Menu', callback_data: 'detect_fraud' },
                    { text: '🔄Reintentar', callback_data: 'detect_fraud' }
                ],
            ]
        }
    };
    bot.sendMessage(
        chatId,
        '👋 ¡Hola! Soy tu bot de **detección de fraude**.\n\nElige una opción:',
        { ...menuOptions, parse_mode: "Markdown" }
    );
}


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
