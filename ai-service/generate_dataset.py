import numpy as np
import pandas as pd
import os

def generate_learning_dataset(n_samples=5000, random_state=42):
    """
    Sinh tập dữ liệu mô phỏng hành vi học tập của sinh viên:
    - difficulty_level: 1 (Dễ), 2 (Trung bình), 3 (Khó)
    - recent_accuracy: tỷ lệ làm đúng gần đây (0.0 -> 1.0)
    - avg_response_time_ms: thời gian phản xạ (800ms -> 12000ms)
    - consecutive_correct: số lần đúng liên tiếp (0 -> 10)
    - streak: chuỗi học liên tiếp hiện tại của sinh viên (0 -> 30)
    - review_count: số lần thẻ đã từng được ôn tập trước đó (1 -> 15)
    
    Target:
    - success_outcome: 1 (Nắm vững tốt, hoàn thành mục tiêu), 0 (Cần ôn lại ngay)
    """
    np.random.seed(random_state)
    
    # 1. Sinh các đặc trưng hành vi
    difficulty_level = np.random.choice([1, 2, 3], size=n_samples, p=[0.3, 0.45, 0.25])
    recent_accuracy = np.clip(np.random.beta(a=5, b=2, size=n_samples), 0.1, 1.0)
    
    # Thời gian phản hồi: người học nhanh ~1.5s - 3s, người phân vân ~4s - 8s
    base_response_time = np.random.gamma(shape=3.0, scale=1000.0, size=n_samples) + 800
    avg_response_time_ms = np.clip(base_response_time, 800, 10000)
    
    consecutive_correct = np.random.poisson(lam=2.5, size=n_samples)
    consecutive_correct = np.clip(consecutive_correct, 0, 10)
    
    streak = np.random.exponential(scale=5.0, size=n_samples).astype(int)
    streak = np.clip(streak, 0, 30)
    
    review_count = np.random.randint(1, 16, size=n_samples)
    
    # 2. Xây dựng logic sinh Ground Truth thực tế (có nhiễu thực nghiệm ngẫu nhiên)
    # Xác suất thành công phụ thuộc chính vào accuracy, tốc độ phản xạ và độ khó thẻ
    logit = (
        3.5 * recent_accuracy
        - 0.00035 * avg_response_time_ms
        + 0.25 * consecutive_correct
        - 0.65 * (difficulty_level - 1)
        + 0.04 * np.log1p(streak)
        + 0.08 * np.log1p(review_count)
        - 1.5 # Bias
    )
    
    # Biến đổi qua hàm sigmoid
    prob = 1.0 / (1.0 + np.exp(-logit))
    
    # Thêm nhiễu ngẫu nhiên thực nghiệm (noise)
    noisy_prob = np.clip(prob + np.random.normal(0, 0.05, size=n_samples), 0.0, 1.0)
    success_outcome = (noisy_prob >= 0.5).astype(int)
    
    df = pd.DataFrame({
        'difficulty_level': difficulty_level,
        'recent_accuracy': np.round(recent_accuracy, 3),
        'avg_response_time_ms': np.round(avg_response_time_ms, 1),
        'consecutive_correct': consecutive_correct,
        'streak': streak,
        'review_count': review_count,
        'success_outcome': success_outcome
    })
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, 'dataset.csv')
    df.to_csv(output_path, index=False)
    print(f"✅ Đã tạo thành công tập dữ liệu {n_samples} mẫu tại: {output_path}")
    print(f"Tỷ lệ phân phối nhãn (Class distribution):\n{df['success_outcome'].value_counts(normalize=True)}")
    return df

if __name__ == '__main__':
    generate_learning_dataset()

