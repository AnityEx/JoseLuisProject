from fastapi import FastAPI, UploadFile, File
from rapidocr_onnxruntime import RapidOCR
import uvicorn
from io import BytesIO
from PIL import Image

# Inicializa RapidOCR con las rutas correctas de tus modelos
ocr = RapidOCR(
    params={
        "Det.model_path": "./models/detection/v5/det.onnx",
        "Rec.model_path": "./models/languages/latin/rec.onnx",
        "Rec.keys_path": "./models/languages/latin/dict.txt"
    }
)

app = FastAPI()

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(BytesIO(image_bytes))
    result, _ = ocr(image)
    return {"result": result}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9003)
