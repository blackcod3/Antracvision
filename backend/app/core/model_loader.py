from ultralytics import YOLO
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "models", "yolov8_cls_best.pt")

model = YOLO(MODEL_PATH)