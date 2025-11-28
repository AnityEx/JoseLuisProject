# JoseLuisProject 
Bot de Telegram para leer mensajes y verificar si son estafas

## PASOS PARA CORRER EL BOT

### Dependencias
 LA INTUICION NO SIRVE SIN EL ARCHIVO "model.safetensors" dentro de la carpeta API/berto/, NO USAR A MENOS QUE SE DESCARGUE https://drive.google.com/file/d/1piID6BVnf0MRg99FYZ9OhpxNnmw8O271/view?usp=sharing

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
