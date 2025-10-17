import axios from 'axios';
import FormData from 'form-data';

export async function LectorImagen(imagen = '') {
    try {
        let fileStream;
        let mimeType;
        let filename;

        if (imagen.startsWith('http')) {
            console.log('DESCARGANDO IMAGEN');
            const response = await axios.get(imagen, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            filename = 'temp_image';
            fileStream = Buffer.from(response.data);
            mimeType = response.headers['content-type'] || 'application/octet-stream';
        } else {
            throw new Error('Invalid image URL');
        }

        // Create FormData for OCR request
        const form = new FormData();
        form.append('image_file', fileStream, { filename, contentType: mimeType });
        form.append('language', language);  // Pass only one language

        console.log('ENVIANDO IMAGEN AL SERVIDOR OCR');
        const ocrResponse = await axios.post('http://localhost:9003/ocr', form, {
            headers: form.getHeaders(),
            timeout: 10000,
        });

        console.log('✅ IMAGEN LEIDA:', ocrResponse.data);

        let extractedText = [];
        for (const key in ocrResponse.data) {
            if (ocrResponse.data[key].rec_txt) {
                extractedText.push(ocrResponse.data[key].rec_txt);
            }
        }

        console.log('Texto extraído:', extractedText.join(' '));
        return extractedText.join(' ');
    } catch (err) {
        console.error('❌ Error:', err.message);

        if (err.response) {
            console.error('Código de estado:', err.response.status);
            console.error('Datos de respuesta:', err.response.data);
        }

        throw err;
    }
}
