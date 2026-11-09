from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import os
import joblib
import numpy as np
import pandas as pd

app = FastAPI(
    title="LixiLearn AI Personalization Service",
    description="Microservice dự đoán khả năng hoàn thành bài học và gợi ý lộ trình bằng Random Forest (Đã tối ưu)",
    version="2.0.0"
)

# Kích hoạt CORS để Web / Mobile App gọi API không bị chặn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đường dẫn model đã train
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.pkl")
pipeline_bundle = None

def load_ai_model():
    global pipeline_bundle
    if os.path.exists(MODEL_PATH):
        try:
            pipeline_bundle = joblib.load(MODEL_PATH)
            print("🌲 Model Random Forest (Optimized) đã được nạp thành công vào bộ nhớ!")
        except Exception as e:
            print(f"⚠️ Lỗi khi nạp model: {e}")
    else:
        print("⚠️ Chưa tìm thấy file model.pkl, API sẽ dùng fallback heuristic.")

@app.on_event("startup")
def startup_event():
    load_ai_model()

class FeatureInput(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    card_id: str = Field(min_length=1, max_length=128)
    difficulty_level: int = Field(ge=1, le=3)  # 1: Easy, 2: Medium, 3: Hard
    recent_accuracy: float = Field(ge=0, le=1)
    avg_response_time_ms: float = Field(gt=0, le=60000)
    consecutive_correct: int = Field(ge=0)
    streak: int = Field(ge=0)
    review_count: int = Field(ge=1)

class PredictionOutput(BaseModel):
    card_id: str
    success_probability: float = Field(ge=0, le=1)
    predicted_outcome: Literal[0, 1]  # 1: Nắm vững, 0: Cần củng cố
    recommended_action: Literal['review_now', 'normal_schedule', 'challenge_mode']
    model_version: str
    key_factor: str

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "LixiLearn AI Service",
        "model_loaded": pipeline_bundle is not None,
        "model_type": "Tuned Random Forest (GridSearchCV)",
        "features_count": len(pipeline_bundle['feature_names']) if pipeline_bundle else 0
    }

@app.post("/predict", response_model=PredictionOutput)
def predict_learning_performance(payload: FeatureInput):
    global pipeline_bundle
    
    # 1. Feature Engineering cho mẫu đơn lẻ giống như lúc huấn luyện
    accuracy_per_second = payload.recent_accuracy / (max(payload.avg_response_time_ms, 100.0) / 1000.0)
    retention_momentum = np.log1p(payload.streak) * np.log1p(payload.review_count)
    confidence_index = payload.consecutive_correct * payload.recent_accuracy
    difficulty_challenge = payload.difficulty_level / (payload.recent_accuracy + 0.1)

    if pipeline_bundle and 'model' in pipeline_bundle:
        rf_model = pipeline_bundle['model']
        feature_names = pipeline_bundle['feature_names']
        
        sample_dict = {
            'difficulty_level': payload.difficulty_level,
            'recent_accuracy': payload.recent_accuracy,
            'avg_response_time_ms': payload.avg_response_time_ms,
            'consecutive_correct': payload.consecutive_correct,
            'streak': payload.streak,
            'review_count': payload.review_count,
            'accuracy_per_second': accuracy_per_second,
            'retention_momentum': retention_momentum,
            'confidence_index': confidence_index,
            'difficulty_challenge': difficulty_challenge
        }
        
        # Sắp xếp đúng thứ tự cột của mô hình
        df_sample = pd.DataFrame([sample_dict])[feature_names]
        
        # Dự đoán xác suất
        prob_success = float(rf_model.predict_proba(df_sample)[0][1])
        predicted_class = int(rf_model.predict(df_sample)[0])
        model_ver = "RandomForest-Tuned-v2.0"
    else:
        # Fallback Heuristic
        score = (
            payload.recent_accuracy * 0.4 +
            (1.0 - min(payload.avg_response_time_ms, 10000) / 10000) * 0.2 +
            min(payload.consecutive_correct / 5.0, 1.0) * 0.2 +
            (1.0 - (payload.difficulty_level - 1) * 0.2) * 0.2
        )
        prob_success = round(max(0.05, min(0.98, score)), 2)
        predicted_class = 1 if prob_success >= 0.6 else 0
        model_ver = "Heuristic-Fallback"

    # 2. Đề xuất hành động cá nhân hóa lộ trình
    if prob_success < 0.50:
        action = "review_now"
        factor = "Tốc độ phản xạ còn chậm hoặc tỷ lệ chính xác chưa cao"
    elif prob_success >= 0.85:
        action = "challenge_mode"
        factor = "Phản xạ rất nhanh và độ chính xác ổn định"
    else:
        action = "normal_schedule"
        factor = "Tiến độ học phù hợp với chu kỳ SRS chuẩn"

    return PredictionOutput(
        card_id=payload.card_id,
        success_probability=round(prob_success, 4),
        predicted_outcome=predicted_class,
        recommended_action=action,
        model_version=model_ver,
        key_factor=factor
    )
