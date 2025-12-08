export function evaluarNivelRiesgo(palabrasDetectadas = [], palabrasDB = [], linksMaliciosos = []) {
    let riesgoAlto = 0;
    let riesgoMedio = 0;
    let riesgoBajo = 0;

    // Evaluar nivel de riesgo por palabra clave detectada
    for (const detectada of palabrasDetectadas) {
        // detectada: 
        const partes = detectada.split('≈');
        const palabraEncontrada = partes[1]?.trim().split(' ')[0]; // Extrae "click aquí"

        // Buscar nivel de esa palabra en la DB
        const palabraEnDB = palabrasDB.find(p => p.palabra === palabraEncontrada);
        const nivel = palabraEnDB?.nivel_riesgo?.toLowerCase();

        if (nivel === 'alto') riesgoAlto++;
        else if (nivel === 'medio') riesgoMedio++;
        else if (nivel === 'bajo') riesgoBajo++;
    }

    // Evaluar links maliciosos
    const hayLinksMaliciosos = linksMaliciosos.length > 0;

    // Lógica para determinar nivel general
    let nivelFinal = '';
    let mensaje = '';

    if (riesgoAlto >= 3 || (hayLinksMaliciosos)) {
        nivelFinal = 'alto';
        mensaje = `🚨 Este mensaje es peligroso. Se detectaron múltiples palabras de alto riesgo y/o enlaces maliciosos.`;
    } else if (riesgoMedio >= 2 || riesgoAlto >= 1) {
        nivelFinal = 'medio';
        mensaje = `⚠️ Este mensaje es moderadamente sospechoso. Ten precaución antes de interactuar con él.`;
    } else if (riesgoBajo > 0 || palabrasDetectadas.length > 0) {
        nivelFinal = 'bajo';
        mensaje = `🟡 Este mensaje contiene algunas palabras de riesgo. No parece peligroso, pero se recomienda cuidado.`;
    } else {
        nivelFinal = 'ninguno';
        mensaje = `✅ El mensaje no parece sospechososo.`;
    }

    return {
        nivel: nivelFinal,
        mensaje: mensaje,
        conteo: {
            alto: riesgoAlto,
            medio: riesgoMedio,
            bajo: riesgoBajo,
            maliciosos: linksMaliciosos.length
        }
    };
}
