console.log(">>> Analizando links:", msg.text);
const LinksSospechosos = ExtractorDeLinks(msg.text || '');

function ExtractorDeLinks(texto) {
    //magia negra para extraer links de un texto a base de comparar texto con "regex" funca para todo
    const urlRegex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi
    const link = texto.match(urlRegex);
    console.log(link);
    return link || []; // Nunca devolver null, siempre array
}


safeApi.checkMulti(LinksSospechosos)
    .then(urlMap => {
        for (let url in urlMap) {
            console.log(urlMap[url] ? `🔴 LINK MALCIOSO ${url} ` : `🟢 link seguro ${url}`);
        }
    })
    .catch(err => {
        console.log('Something went wrong.');
        console.log(err);
    });


if (urlMap.length > 0) {
    bot.sendMessage(chatId, `⚠️ **Este link es probablemente fraudulento**.\nCoincidencias:\n${urlMap.join('\n')}`, { parse_mode: "Markdown" });
    mensajesDetectados++;
} else {
    bot.sendMessage(chatId, '✅ El link **no** parece fraudulento.', { parse_mode: "Markdown" });
}

