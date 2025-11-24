from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from huggingface_hub import login
import uvicorn

# Hugging Face login
TOKEN = "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"
login(token=TOKEN)

# Load model and tokenizer once
local_model_path = "./berto-bankscam-classifier-teacher-final"
classifier = pipeline(
    "text-classification",
    model=AutoModelForSequenceClassification.from_pretrained(local_model_path),
    tokenizer=AutoTokenizer.from_pretrained(local_model_path),
    device=-1  # CPU; change to 0 if you want GPU
)

# FastAPI app
app = FastAPI(title="BERT Text Classifier API")

class TextRequest(BaseModel):
    text: str

@app.post("/predict")
def predict(req: TextRequest):
    prediction = classifier(req.text)
    return {"text": req.text, "prediction": prediction}

@app.get("/")
def root():
    return {"message": "BERT Classifier API is running!"}

# -----------------------------
# Run with python api.py
# -----------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
