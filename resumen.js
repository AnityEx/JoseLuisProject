const resumen = `
        
🔍 Resultado del análisis:
- Intuición : ${IntuyeJoseLuisBERTo?.prediction?.[0]}



- Palabras clave detectadas: ${coincidencias.length}
- Riesgo ALTO: ${resultadoRiesgo.conteo.alto}
- Riesgo MEDIO: ${resultadoRiesgo.conteo.medio}
- Riesgo BAJO: ${resultadoRiesgo.conteo.bajo}
- Enlaces maliciosos: ${resultadoRiesgo.conteo.maliciosos > 0 ? '🔴 Sí' : '🟢 No'}

${resultadoRiesgo.mensaje}

${coincidencias.length > 0 ? `\n🔑 *Coincidencias encontradas:* \n${coincidencias.join('\n')}` : ''}
${LinksOrdenados.length > 0 ? `\n🔗 *Enlaces analizados:* \n${LinksOrdenados.join('\n')}` : ''}
`;




🔍 *Resultado del análisis:*
- - Intuición: 92% Malicioso 
- Palabras clave detectadas: 0
- Riesgo ALTO: 0
- Riesgo MEDIO: 0
- Riesgo BAJO: 0
- Enlaces maliciosos: 🟢 No

✅ El mensaje no contiene elementos sospechosos ni enlaces maliciosos.


🔍 *Resultado del análisis:*
- - Intuición: 92% Malicioso 
- Palabras clave detectadas: 0
- Riesgo ALTO: 0
- Riesgo MEDIO: 0
- Riesgo BAJO: 0
- Enlaces maliciosos: 🟢 No

✅ El mensaje no contiene elementos sospechosos ni enlaces maliciosos.



🔗 *Enlaces analizados:* 
🟡 Parece Seguro → fangamer.com