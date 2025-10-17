from huggingface_hub import snapshot_download

# Descarga todos los modelos de detección y los modelos para idiomas latinos
snapshot_download(
    repo_id="monkt/paddleocr-onnx",
    allow_patterns=["detection/v5/*", "languages/latin/*"],
    local_dir="./models",
    local_dir_use_symlinks=False  # para evitar problemas con symlinks
)
