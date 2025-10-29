# -*- encoding: utf-8 -*-
# @Author: SWHL
# @Contact: liekkaskono@163.com
import argparse
import base64
import io
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import uvicorn
from fastapi import FastAPI, Form, UploadFile
from PIL import Image
from rapidocr import RapidOCR
import yaml


class OCRAPIUtils:
    def __init__(self, config_path: Path) -> None:
        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)

        det_model_path = config.get("det_model_path")
        cls_model_path = config.get("cls_model_path")
        rec_model_path = config.get("rec_model_path")

        if not det_model_path or not cls_model_path or not rec_model_path:
            self.ocr = RapidOCR()
        else:
            self.ocr = RapidOCR(
                params={
                    "Det.model_path": det_model_path,
                    "Cls.model_path": cls_model_path,
                    "Rec.model_path": rec_model_path,
                }
            )

    def __call__(
        self, ori_img: Image.Image, use_det=None, use_cls=None, use_rec=None, **kwargs
    ) -> Dict:
        img = np.array(ori_img)
        ocr_res = self.ocr(
            img, use_det=use_det, use_cls=use_cls, use_rec=use_rec, **kwargs
        )

        if ocr_res.boxes is None or ocr_res.txts is None or ocr_res.scores is None:
            return {}

        out_dict = {}
        for i, (boxes, txt, score) in enumerate(
            zip(ocr_res.boxes, ocr_res.txts, ocr_res.scores)
        ):
            out_dict[i] = {"rec_txt": txt, "dt_boxes": boxes.tolist(), "score": score}
        return out_dict


app = FastAPI()

config_file_path = Path("API/ocr_models.yaml")
processor = OCRAPIUtils(config_file_path)


@app.get("/")
def root():
    return {"message": "Welcome to RapidOCR API Server!"}


@app.post("/ocr")
def ocr(
    image_file: Optional[UploadFile] = None,
    image_data: str = Form(None),
    use_det: bool = Form(None),
    use_cls: bool = Form(None),
    use_rec: bool = Form(None),
):
    if image_file:
        img = Image.open(image_file.file)
    elif image_data:
        img_bytes = str.encode(image_data)
        img_b64decode = base64.b64decode(img_bytes)
        img = Image.open(io.BytesIO(img_b64decode))
    else:
        raise ValueError(
            "When sending a post request, data or files must have a value."
        )
    ocr_res = processor(img, use_det=use_det, use_cls=False, use_rec=use_rec)

    return ocr_res


def main():
    parser = argparse.ArgumentParser("rapidocr_api")
    parser.add_argument("-ip", "--ip", type=str, default="0.0.0.0", help="IP Address")
    parser.add_argument("-p", "--port", type=int, default=9003, help="IP port")
    parser.add_argument(
        "-workers", "--workers", type=int, default=1, help="number of worker process"
    )
    args = parser.parse_args()

    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["access"]["fmt"] = "%(asctime)s %(levelname)s %(message)s"
    log_config["formatters"]["default"]["fmt"] = "%(asctime)s %(levelname)s %(message)s"

    uvicorn.run(
        __name__ + ":app",
        host=args.ip,
        port=args.port,
        reload=False,
        workers=args.workers,
        log_config=log_config,
    )


if __name__ == "__main__":
    main()
