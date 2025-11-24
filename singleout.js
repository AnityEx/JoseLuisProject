async function analizarMensaje(msg) {// Función para manejar el análisis de cada mensaje
    const arregloPalabras = cachePalabras;
    const coincidencias = [];
    const texto = (msg.text || '').toLowerCase();
    const chatId = msg.chat.id;
    const mensaje = texto.split(/\s+/);// separa el mensaje por espacios
    console.log("Mensaje recibido:", msg.text);
    if (arregloPalabras.length === 0) {
        bot.sendMessage(chatId, '❌ No se pueden detectar fraudes. No hay palabras clave cargadas.');
        return;
    }
    for (const palabrasMensaje of mensaje) {
        for (const palabraClave of arregloPalabras) {
            const sim = stringSimilarity.compareTwoStrings(palabrasMensaje, palabraClave.palabra);
            if (sim >= similaridad) {
                coincidencias.push(`${palabrasMensaje} ≈ ${palabraClave.palabra} (${(sim * 100).toFixed(1)}%)`);
            }
        }
    }

    const LinksSospechosos = ExtractorDeLinks(msg.text || '');//array de links

    async function checklinks() {
        try {
            const urlMap = await safeApi.checkMulti(LinksSospechosos);
            for (let url in urlMap) {
                console.log(urlMap[url] ? `🔴 LINK MALCIOSO ${url} ` : `🟡 link seguro ${url}`);
            }
            return urlMap || [];

        } catch (err) {
            console.log('Something went wrong.');
            console.log(err);
            return [];
        }
    }
    const urlMap = await checklinks();
    const linksMaliciosos = Object.entries(urlMap)
        .filter(([_, esMalicioso]) => esMalicioso)
        .map(([url]) => url);
    const resultadoRiesgo = evaluarNivelRiesgo(coincidencias, cachePalabras, linksMaliciosos);



    {
        const LinksOrdenados = Object.entries(urlMap)
            .map(([url, malicioso]) => `${malicioso ? '🔴 MALICIOSO' : '🟡 Parece Seguro'} → ${url}`);

        const resumen = `
🔍 *Resultado del análisis:*
- Palabras clave detectadas: ${coincidencias.length}
- Riesgo ALTO: ${resultadoRiesgo.conteo.alto}
- Riesgo MEDIO: ${resultadoRiesgo.conteo.medio}
- Riesgo BAJO: ${resultadoRiesgo.conteo.bajo}
- Enlaces maliciosos: ${resultadoRiesgo.conteo.maliciosos > 0 ? '🔴 Sí' : '🟢 No'}

${resultadoRiesgo.mensaje}

${coincidencias.length > 0 ? `\n🔑 *Coincidencias encontradas:* \n${coincidencias.join('\n')}` : ''}
${LinksOrdenados.length > 0 ? `\n🔗 *Enlaces analizados:* \n${LinksOrdenados.join('\n')}` : ''}
`;

        bot.sendMessage(chatId, resumen, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '⬅️ Menu', callback_data: 'start_menu' },
                        { text: '🔄 Reintentar', callback_data: 'detect_fraud' }
                    ]
                ]
            }
        });

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




(async () => {
    try {
        const texto = 'Hola, mundo!';
        const resultado = await Clasificador(texto);
        console.log('Resultado de la API:', resultado);   // → string devuelto por el backend
    } catch (e) {
        console.error('La llamada falló', e);
    }
})();




async function analizarMensaje(msg) {
    const chatId = msg.chat.id;
    const texto = (msg.text || '').toLowerCase();          // Normalizamos a minúsculas
    const palabrasMsg = texto.split(/\s+/);                // Separar en tokens



    /* ---------- 1. Palabras clave ---------- */
    if (!cachePalabras.length) {
        bot.sendMessage(chatId, '❌ No se pueden detectar fraudes. No hay palabras clave cargadas.');
        return;
    }

    const coincidencias = [];
    for (const token of palabrasMsg) {
        for (const { palabra } of cachePalabras) {
            const sim = stringSimilarity.compareTwoStrings(token, palabra);
            if (sim >= similaridad) {
                coincidencias.push(`${token} ≈ ${palabra} (${(sim * 100).toFixed(1)}%)`);
            }
        }
    }

    /* ---------- 2. Enlaces ---------- */
    const links = ExtractorDeLinks(msg.text || '');
    let urlMap;
    try {
        urlMap = await safeApi.checkMulti(links);          // {url: true/false}
    } catch (e) {
        console.error('Error al comprobar enlaces', e);
        urlMap = {};
    }




    const linksMaliciosos = Object.entries(urlMap)
        .filter(([, esMal]) => esMal)
        .map(([u]) => u);

    /* ---------- 3. Nivel de riesgo ---------- */
    const resultadoRiesgo = evaluarNivelRiesgo(
        coincidencias,
        cachePalabras,
        linksMaliciosos
    );

    /* ---------- 4. Resumen a enviar ---------- */
    const enlacesOrdenados = Object.entries(urlMap)
        .map(([u, mal]) => `${mal ? '🔴 MALICIOSO' : '🟡 Seguro'} → ${u}`);

    const resumen = `
🔍 *Resultado del análisis:*
- Palabras clave detectadas: ${coincidencias.length}
- Riesgo ALTO: ${resultadoRiesgo.conteo.alto}
- Riesgo MEDIO: ${resultadoRiesgo.conteo.medio}
- Riesgo BAJO: ${resultadoRiesgo.conteo.bajo}
- Enlaces maliciosos: ${resultadoRiesgo.conteo.maliciosos > 0 ? '🔴 Sí' : '🟢 No'}

${resultadoRiesgo.mensaje}

${coincidencias.length ? `\n🔑 *Coincidencias encontradas:* \n${coincidencias.join('\n')}` : ''}
${enlacesOrdenados.length ? `\n🔗 *Enlaces analizados:* \n${enlacesOrdenados.join('\n')}` : ''}
`;

    bot.sendMessage(chatId, resumen.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '⬅️ Menu', callback_data: 'start_menu' }],
                [{ text: '🔄 Reintentar', callback_data: 'detect_fraud' }]
            ]
        }
    });

    /* ---------- 5. Contador de mensajes por chat ---------- */
    contadorMensajes[chatId] = (contadorMensajes[chatId] || 0) + 1;

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
