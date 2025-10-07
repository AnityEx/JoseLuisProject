
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




    for (let url in urlMap) {
        console.log(urlMap[url] ? `🔴 LINK MALCIOSO ${url} ` : `🟢 link seguro ${url}`);
    }



        function ExtractorDeLinks(texto) {
        //magia negra para extraer links de un texto a base de comparar texto con "regex" funca para todo https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
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
            }
        } catch (err) {
            console.log('Something went wrong.');
            console.log(err);
        }
    }
const urlMap = await checklinks();
