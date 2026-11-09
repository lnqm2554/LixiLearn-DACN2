import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report

def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Tạo các đặc trưng mới (Feature Engineering):
    1. speed_accuracy_ratio: Sự kết hợp giữa độ chính xác và tốc độ phản xạ
    2. difficulty_normalized: Độ khó quy đổi về tỷ lệ [0, 1]
    3. retention_factor: Tương quan giữa số lần ôn và chuỗi streak
    4. mastery_score: Điểm tổng hợp phản xạ đúng liên tục trên thời gian
    """
    df_feat = df.copy()
    
    # 1. Tốc độ làm bài hiệu quả: Điểm chính xác trên 1 giây phản xạ
    df_feat['accuracy_per_second'] = df_feat['recent_accuracy'] / (df_feat['avg_response_time_ms'] / 1000.0)
    
    # 2. Hệ số củng cố trí nhớ (Retention index): ôn nhiều lần kết hợp streak dài
    df_feat['retention_momentum'] = np.log1p(df_feat['streak']) * np.log1p(df_feat['review_count'])
    
    # 3. Chỉ số tự tin (Confidence score): chuỗi đúng liên tiếp kết hợp độ chính xác
    df_feat['confidence_index'] = df_feat['consecutive_correct'] * df_feat['recent_accuracy']
    
    # 4. Trọng số độ khó điều chỉnh theo độ chính xác
    df_feat['difficulty_challenge'] = df_feat['difficulty_level'] / (df_feat['recent_accuracy'] + 0.1)

    return df_feat

def train_and_evaluate():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, 'dataset.csv')
    
    if not os.path.exists(dataset_path):
        from generate_dataset import generate_learning_dataset
        generate_learning_dataset()
        
    raw_df = pd.read_csv(dataset_path)
    print(f"🔹 Dữ liệu gốc: {raw_df.shape[0]} dòng, {raw_df.shape[1]} cột")
    
    # Feature Engineering
    df_engineered = feature_engineering(raw_df)
    print(f"🔹 Dữ liệu sau Feature Engineering: {df_engineered.shape[1] - 1} đặc trưng")
    
    X = df_engineered.drop(columns=['success_outcome'])
    y = df_engineered['success_outcome']
    feature_names = list(X.columns)
    
    # Chia tập train/test (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # -------------------------------------------------------------
    # GIAI ĐOẠN 1: MÔ HÌNH BASELINE RANDOM FOREST
    # -------------------------------------------------------------
    print("\n" + "="*50)
    print("🌲 GIAI ĐOẠN 1: HUẤN LUYỆN MÔ HÌNH BASELINE")
    print("="*50)
    baseline_rf = RandomForestClassifier(n_estimators=50, random_state=42)
    baseline_rf.fit(X_train, y_train)
    
    y_pred_base = baseline_rf.predict(X_test)
    y_prob_base = baseline_rf.predict_proba(X_test)[:, 1]
    
    metrics_baseline = {
        "Accuracy": float(accuracy_score(y_test, y_pred_base)),
        "Precision": float(precision_score(y_test, y_pred_base)),
        "Recall": float(recall_score(y_test, y_pred_base)),
        "F1-Score": float(f1_score(y_test, y_pred_base)),
        "ROC-AUC": float(roc_auc_score(y_test, y_prob_base))
    }
    for k, v in metrics_baseline.items():
        print(f"• {k:10}: {v:.4f}")
        
    # -------------------------------------------------------------
    # GIAI ĐOẠN 2: HYPERPARAMETER TUNING VỚI GRID SEARCH CV
    # -------------------------------------------------------------
    print("\n" + "="*50)
    print("🔍 GIAI ĐOẠN 2: TỐI ƯU SIÊU THAM SỐ (GRID SEARCH CV)")
    print("="*50)
    
    param_grid = {
        'n_estimators': [100, 150],
        'max_depth': [6, 10, 14],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 3],
        'max_features': ['sqrt', 'log2']
    }
    
    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(
        estimator=rf,
        param_grid=param_grid,
        cv=5,
        scoring='f1',
        n_jobs=-1,
        verbose=1
    )
    grid_search.fit(X_train, y_train)
    
    best_rf = grid_search.best_estimator_
    print(f"\n✅ Tham số tối ưu nhất tìm được:")
    for param, val in grid_search.best_params_.items():
        print(f"  - {param}: {val}")
        
    y_pred_opt = best_rf.predict(X_test)
    y_prob_opt = best_rf.predict_proba(X_test)[:, 1]
    
    metrics_optimized = {
        "Accuracy": float(accuracy_score(y_test, y_pred_opt)),
        "Precision": float(precision_score(y_test, y_pred_opt)),
        "Recall": float(recall_score(y_test, y_pred_opt)),
        "F1-Score": float(f1_score(y_test, y_pred_opt)),
        "ROC-AUC": float(roc_auc_score(y_test, y_prob_opt))
    }
    
    # -------------------------------------------------------------
    # BẢNG SO SÁNH KẾT QUẢ ĐỒ ÁN (TRƯỚC VÀ SAU TỐI ƯU)
    # -------------------------------------------------------------
    comparison_df = pd.DataFrame({
        'Chỉ số (Metric)': list(metrics_baseline.keys()),
        'Baseline': [f"{v:.4f}" for v in metrics_baseline.values()],
        'Tối ưu (Optimized)': [f"{v:.4f}" for v in metrics_optimized.values()],
        'Mức cải thiện': [f"+{(metrics_optimized[k] - metrics_baseline[k])*100:.2f}%" for k in metrics_baseline.keys()]
    })
    
    print("\n" + "="*50)
    print("📊 BẢNG SO SÁNH HIỆU NĂNG MÔ HÌNH HỌC MÁY ĐỒ ÁN DACN2")
    print("="*50)
    print(comparison_df.to_string(index=False))
    
    # -------------------------------------------------------------
    # FEATURE IMPORTANCE (ĐẶC TRƯNG ẢNH HƯỞNG NHIỀU NHẤT)
    # -------------------------------------------------------------
    importances = best_rf.feature_importances_
    feat_importances = pd.DataFrame({
        'Feature': feature_names,
        'Importance': importances
    }).sort_values(by='Importance', ascending=False)
    
    print("\n" + "="*50)
    print("🌟 ĐỘ QUAN TRỌNG CỦA CÁC ĐẶC TRƯNG (FEATURE IMPORTANCE)")
    print("="*50)
    print(feat_importances.to_string(index=False))
    
    # -------------------------------------------------------------
    # LƯU MODEL & METRICS ĐỂ PHỤC VỤ API & BÁO CÁO
    # -------------------------------------------------------------
    model_output_path = os.path.join(current_dir, 'model.pkl')
    report_output_path = os.path.join(current_dir, 'evaluation_report.json')
    
    # Lưu pipeline đóng gói gồm model và danh sách feature
    pipeline = {
        'model': best_rf,
        'feature_names': feature_names,
        'best_params': grid_search.best_params_,
        'metrics': {
            'baseline': metrics_baseline,
            'optimized': metrics_optimized
        }
    }
    joblib.dump(pipeline, model_output_path)
    
    with open(report_output_path, 'w', encoding='utf-8') as f:
        json.dump({
            'metrics_comparison': comparison_df.to_dict(orient='records'),
            'feature_importance': feat_importances.to_dict(orient='records'),
            'best_params': grid_search.best_params_
        }, f, ensure_ascii=False, indent=2)
        
    print(f"\n💾 Đã lưu mô hình tối ưu vào: {model_output_path}")
    print(f"📄 Đã lưu báo cáo khoa học vào: {report_output_path}")

if __name__ == '__main__':
    train_and_evaluate()

