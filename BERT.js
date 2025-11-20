import axios from 'axios';
import FormData from 'form-data';

export async function AnalizarTexto(texto) {
    const r = await fetch("http://127.0.0.1:8000/classify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "accept": "application/json"
        },
        body: `text=${encodeURIComponent(texto)}`
    });

    return await r.json();
}



const result = await AnalizarTexto("Estimado usuario hemos cambiado de sucursales...");
console.log(result);
