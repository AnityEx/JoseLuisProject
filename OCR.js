'use strict';

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

async function LectorImagen(imagen) {
    const form = new FormData();
    form.append('image_file', fs.createReadStream('./image.png'))

    try {
        const response = await axios.post('http://localhost:9003/ocr', form, {
            headers: form.getHeaders(),
            timeout: 10000,
        })
        console.log('OCR RESULT' + response.data)
    } catch (err) {
        console.error('failed ocr');

    }
}

LectorImagen()