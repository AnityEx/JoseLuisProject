from rapidocr_api.main import app
from rapidocr.main import RapidOCR
import uvicorn
import os

params = {
    "engine_name": "onnxruntime",
    "det": {"model_path": "./models/v5/det.onnx"},
    "rec": {"model_path": "./models/latin/rec.onnx"},
    # "cls": {"model_path": "./models/cls.onnx"},
}

ocr = RapidOCR(params)  # or ocr = RapidOCR(config=params)


ocr = RapidOCR("config.yaml")
app.ocr = ocr

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9003)
