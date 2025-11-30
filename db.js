const { MongoClient } = require('mongodb');
require('dotenv').config(); // Asegúrate de que tu archivo .env esté bien configurado

// Obtén la URI desde el archivo .env
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, { });

// Función para conectar a MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log("Conectado a MongoDB Atlas");
    } catch (error) {
        console.error("Error al conectar a MongoDB:", error);
    }
}

// Función para obtener palabras clave de la base de datos
async function obtenerPalabrasClave() {
    const collection = client.db('detectorEstafas').collection('palabras_clave');
    return await collection.find({ "activo": true }).toArray();  // Obtén las palabras activas
}

// Función para agregar una palabra clave
async function agregarPalabra(palabra, nivel_riesgo) {
    const collection = client.db('detectorEstafas').collection('palabras_clave');
    await collection.insertOne({ palabra, nivel_riesgo, activo: true });
}

// Función para eliminar una palabra clave
async function eliminarPalabra(palabra) {
    const collection = client.db('detectorEstafas').collection('palabras_clave');
    await collection.deleteOne({ palabra });
}

// Función para actualizar el nivel de riesgo de una palabra clave
async function actualizarPalabra(palabra, nuevoNivel) {
    const collection = client.db('detectorEstafas').collection('palabras_clave');
    await collection.updateOne({ palabra }, { $set: { nivel_riesgo: nuevoNivel } });
}

module.exports = { connectDB, obtenerPalabrasClave, agregarPalabra, eliminarPalabra, actualizarPalabra };
