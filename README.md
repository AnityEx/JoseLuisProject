# JoseLuisProject 
Bot de Telegram para leer mensajes y verificar si son estafas

## Tecnologias utilizadas
-Python v3.11
-Node.js v22.20
-FastAPI v0.120.0
-Docker v28.5.1
-MongoDB v8.0.16

### Base de datos 
Se aloja en MongoDB Atlas

-Cluster Cluster0Joseluis
-Proveedor Microsoft Azure
-Region California(Westus)
-Tipo de cluster Replica set(3 nodos)

## PASOS PARA CORRER EL BOT

### Dependencias
 LA INTUICION NO SIRVE SIN EL ARCHIVO "model.safetensors" dentro de la carpeta API/berto/, NO USAR A MENOS QUE SE DESCARGUE 

https://drive.google.com/file/d/1V7aohPJOSO23YyUoNmg2R0xfMAZKDGWU/view?usp=sharing

## VSCode
- Clona el repositorio


- instala python 3.11

- inicia el environment e instala las dependencias
```
(linux)
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```
```
(windows)
python -m venv venv
.\venv\Scripts\activate

pip install -r .\requirements.txt
```

- instala las dependencias javascript
```
npm install
```

- instala docker

https://www.docker.com/

- corre en cualquier terminal:
```
docker run --name redis-bot -p 6379:6379 -d redis
docker start redis-bot
```
- corre el server api
```
python .\API\toda_api.py --workers 2
```



- corre el bot
```
node bot.js
```
