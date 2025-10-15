'use strict';

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

async function LectorImagen(imagen = './image.png') {
    try {
        let fileStream;
        let mimeType;
        let filename;

        // Check if the input is a URL or a local path
        if (imagen.startsWith('http')) {
            // 🛰️ Download image from URL
            console.log('Downloading image from URL...');
            const response = await axios.get(imagen, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            // Save to temp file
            filename = 'temp_image';
            const tempPath = path.join(__dirname, `${filename}.jpg`);
            fs.writeFileSync(tempPath, response.data);
            fileStream = fs.createReadStream(tempPath);
            mimeType = response.headers['content-type'] || 'application/octet-stream';
        } else {
            // 📂 Use local image
            const imgPath = path.resolve(imagen);
            fileStream = fs.createReadStream(imgPath);
            mimeType = mime.lookup(imgPath) || 'application/octet-stream';
            filename = path.basename(imgPath);
        }

        // 📤 Prepare the form for OCR
        const form = new FormData();
        form.append('image_file', fileStream, {
            filename,
            contentType: mimeType
        });

        console.log('Sending image to OCR server...');
        const ocrResponse = await axios.post('http://localhost:9003/ocr', form, {
            headers: form.getHeaders(),
            timeout: 10000,
        });

        console.log('✅ OCR RESULT:', ocrResponse.data);
    } catch (err) {
        if (err.response) {
            console.error('❌ OCR request failed:', err.response.status, err.response.data);
        } else {
            console.error('❌ Error:', err.message);
        }
    }
}

LectorImagen('https://www.olyfed.com/wp-content/uploads/2023/10/TextScam-768x521.jpg');
// Or: LectorImagen('./image.png');