import axios from 'axios';

export async function Clasificador(texto = '', url = 'http://localhost:9003/predict') {
    try {
        const payload = { text: texto };
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };
        const response = await axios.post(url, payload, { headers });
        return response.data;


    } catch (err) {
        if (axios.isAxiosError(err)) {
            const { status, data } = err.response || {};
            if (status === 422 && data?.detail) {
                console.error('Validación fallida:', JSON.stringify(data.detail, null, 2));
            } else {
                console.error(`HTTP ${status}:`, err.message);
                console.error('Datos de respuesta:', data);
            }
        } else {
            console.error('Error', err);
        }
        throw err;
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