import axios from 'axios';

export async function Clasificador(texto = '', url = 'http://localhost:9003/predict') {
    try {
        // ---------- Construcción del cuerpo ----------
        const payload = { text: texto };

        // ---------- Encabezados ----------
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',      // asegura que la respuesta sea JSON
        };

        // ---------- Petición POST ----------
        const response = await axios.post(url, payload, { headers });

        // La API devuelve directamente un string (ej. "Hello world")
/*         console.log('✅ Respuesta:', response.data);
 */        return response.data;              // ya es una cadena

    } catch (err) {
        // ---------- Manejo de errores ----------
        if (axios.isAxiosError(err)) {
            const { status, data } = err.response || {};

            // Si la API devuelve un error 422 con detalle
            if (status === 422 && data?.detail) {
                console.error('⚠️ Validación fallida:', JSON.stringify(data.detail, null, 2));
            } else {
                console.error(`❌ HTTP ${status}:`, err.message);
                console.error('Datos de respuesta:', data);
            }
        } else {
            // error inesperado (ej. problema de red)
            console.error('⚠️ Error inesperado:', err);
        }

        throw err;  // Re‑lanza para que el llamador pueda capturarlo
    }
}


/* import { Clasificador } from './BERTo.js';

(async () => {
    try {
        const texto = 'Hola, mundo!';
        const resultado = await Clasificador(texto);
        console.log('Resultado de la API:', resultado);   // → string devuelto por el backend
    } catch (e) {
        console.error('La llamada falló', e);
    }
})();
 */