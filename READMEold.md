# JoseLuisProject
Bot de Telegram

dependencias LA INTUICION NO SIRVE SIN EL ARCHIVO "model.safetensors" dentro de la carpeta API/berto, NO USAR A MENOS QUE SE DESCARGUE https://drive.google.com/file/d/1piID6BVnf0MRg99FYZ9OhpxNnmw8O271/view?usp=sharing

-una vez clonado desde vscode vete a la terminal y escribe

npm install
npm install ioredis

esto hará que se instalen todas las librerias npm que se usan

INSTALA PYTHON PARA USAR EL LECTOR DE IMAGENES y EL CLASIFICADOR INTELIGENTE BERTO
(ESTO solo linux)
curl -fsSL https://pyenv.run | bash 
pyenv install 3.11.14
pyenv local 3.11.14

si tienes python 3.11.14 local o global entonces pon cada linea una por una en el terminal 

(linux)
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
instalo pip de torchvision torch y transformers 


(windows)
python -m venv venv
.\venv\Scripts\activate
pip install -r .\requirements.txt


primero corre el server api

python .\API\custom_rapidocr_api.py --workers 2

luego instala docker y corre estos para que funcione el limite de mensajes por persona

docker run --name redis-bot -p 6379:6379 -d redis
docker start redis-bot


para correr el bot usa
nodemon bot.js


node bot.js
[dotenv@17.2.2] injecting env (1) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
(node:197808) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///home/lana/Escritorio/JoseLuisProject/bot.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /home/lana/Escritorio/JoseLuisProject/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:197808) [MONGODB DRIVER] Warning: useUnifiedTopology is a deprecated option: useUnifiedTopology has no effect since Node.js Driver version 4.0.0 and will be removed in the next major version
Conectado a MongoDB Atlas