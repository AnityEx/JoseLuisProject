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
    function ExtractorDeLinks(texto) {
        //magia negra para extraer links de un texto a base de comparar texto con "regex" funca para todo
        const urlRegex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi
        const link = texto.match(urlRegex);
        console.log(link);
        return link || []; // Nunca devolver null, siempre array
    }

    const LinksSospechosos = ExtractorDeLinks(msg.text || '');

    async function checklinks() {
        try {
            const urlMap = await safeApi.checkMulti(LinksSospechosos);
            for (let url in urlMap) {
                console.log(urlMap[url] ? `🔴 LINK MALCIOSO ${url} ` : `🟢 link seguro ${url}`);
                return urlMap || [];
            }
        } catch (err) {
            console.log('Something went wrong.');
            console.log(err);
            return [];
        }
    }
    const urlMap = await checklinks();
    if (coincidencias.length > 0 || LinksSospechosos.length > 0) {
        bot.sendMessage(chatId, `⚠️ Este mensaje es probablemente fraudulento.\nCoincidencias:\n${coincidencias.join('\n')}\n${Object.keys(urlMap).join('\n')}`, { parse_mode: "HTML" });
        mensajesDetectados++;
    } else {
        bot.sendMessage(chatId, '✅ El mensaje **no** parece fraudulento.', { parse_mode: "Markdown" });
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
export default analizarMensaje; 