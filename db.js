//se crea el cliente de momgodb oficial 
const { MongoClient } = require('mongodb');
//da paso al requerimiento de utilizar la uri en el .env
require('dotenv').config();

//secrea la constante que almacena la uri  del .env
const uri = process.env.MONGODB_URI;

//se utiliza el cliente de momgo db para dar accesos 
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let db; // archivo que se esta trabajando actualmente 
let cachePalabras = []; // cache en memoria

async function connectDB() {
    try {
        //conecxion con el client de mongo db 
        await client.connect();
        //se accede especificamente  a la base de datos 
        db = client.db('detectorEstafas');

        console.log(" Conectado a MongoDB Atlas");

        // Cargar palabras clave una vez al inicio
        await cargarPalabrasClaveEnCache();

    } catch (err) {
        console.error("Error al conectar a MongoDB:", err);
    }
}

//funcion para solo cargar las palabras una vez y utilizar el cache almacenado 
async function cargarPalabrasClaveEnCache() {
    if (!db) throw new Error("Base de datos no conectada.");

    try {
        //se accede a la coleccion donde se almacenan las palabras 
        const collection = db.collection('palabras_clave');
        //se crea el array donde se estara almacenando las plabras para la posterior comparacion 
        cachePalabras = await collection.find({}).toArray();
        console.log(" Palabras clave cargadas en caché:", cachePalabras.length);
    } catch (err) {
        console.error(" Error al cargar palabras clave:", err);
    }
}

// Esta función solo devuelve el cache actual
function obtenerPalabrasClave() {
    return cachePalabras;
}

//permite exportar nuestra funcion en el bot.js 
module.exports = {
    connectDB,
    obtenerPalabrasClave,
    cargarPalabrasClaveEnCache, // opcional, si quieres recargar cache en algún momento
};
