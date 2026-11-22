# AGENTS.md - Context & Architecture Guide for AI Agents

> **Mục đích tài liệu:** File này cung cấp ngữ cảnh toàn diện, chi tiết và chuẩn hóa về dự án để bất kỳ AI Agent nào (Antigravity, Claude Code, Cursor, Copilot, ChatGPT, Codex, v.v.) khi tiếp quản dự án đều hiểu ngay lập tức cấu trúc, mục tiêu học thuật, tiến độ hiện tại và các quy chuẩn kỹ thuật cần tuân thủ.

---

## 1. Thông Tin Đồ Án (Project Metadata)
* **Tên đồ án:** XÂY DỰNG HỆ THỐNG HỌC TIẾNG ANH CÁ NHÂN HÓA SỬ DỤNG MÔ HÌNH AI
* **Tên ứng dụng:** **LixiLearn** (LixiLearn AI)
* **Cấp độ môn học:** Đồ án Chuyên ngành 2 (DACN2)
* **Đơn vị đào tạo:** Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)
* **Thông tin cá nhân:** Được lược khỏi bản mã nguồn công khai; xem đề cương nội bộ để biết thông tin chính thức.

---

## 2. Mục Tiêu & Các Trụ Cột Cốt Lõi (Core Pillars)

Hệ thống kết hợp 3 trụ cột kỹ thuật - nghiệp vụ chính:

1. **Phương pháp Micro-learning & Flashcard thông minh:**
   * Giúp người dùng học từ vựng/mẫu câu theo các bài học ngắn (3 - 5 phút/ngày).
   * Game hóa (Gamification): Streak ngày liên tiếp, điểm kinh nghiệm (XP), cấp độ (Level), bảng xếp hạng để duy trì động lực.
2. **Thuật toán Lặp lại ngắt quãng (Spaced Repetition System - SRS):**
   * Dựa trên đường cong quên của Ebbinghaus.
   * Áp dụng thuật toán **SuperMemo SM-2** để tính chu kỳ ôn tập (`interval`), hệ số dễ (`easeFactor`), số lần ôn (`repetition`), và ngày đến hạn (`dueDate`) tối ưu theo mức đánh giá của người học (chất lượng từ 0 - 5).
3. **Mô hình Học máy Cá nhân hóa (Machine Learning - Random Forest):**
   * Sử dụng **Random Forest** (thư viện `scikit-learn` trên Python).
   * **Nhiệm vụ:** Dự đoán xác suất hoàn thành tốt nội dung học tập (`success_probability`) dựa trên hành vi: tỷ lệ làm đúng gần đây (`recent_accuracy`), thời gian phản hồi trung bình (`avg_response_time_ms`), số câu đúng liên tiếp (`consecutive_correct`), độ khó thẻ (`difficulty_level`), độ dài streak, v.v.
   * **Đề xuất hành động:** Phân loại và gợi ý bài học:
     - `review_now`: Ôn tập lại ngay nếu xác suất nắm vững thấp.
     - `normal_schedule`: Theo lịch trình SRS thông thường.
     - `challenge_mode`: Đẩy nhanh bài nâng cao nếu người dùng tiếp thu rất nhanh.
   * Yêu cầu học thuật: Có mô hình Baseline $\rightarrow$ Feature Engineering $\rightarrow$ Hyperparameter Tuning (GridSearchCV/RandomizedSearchCV) $\rightarrow$ Đánh giá bằng Accuracy, Precision, Recall, F1-score, ROC-AUC và Feature Importance.
4. **Nhận dạng giọng nói và đánh giá phát âm (định hướng):**
   * Mục tiêu đề cương là tích hợp dịch vụ speech recognition/NLP để đánh giá phát âm; bản hiện tại chỉ so khớp transcript, chưa phân tích âm vị.

---

## 3. Kiến Trúc Hệ Thống & Tech Stack

```text
[ React Native / Expo Mobile App (TypeScript) ]
         │
         ├── REST API (HTTP) ──> [ AI Service Container (FastAPI + Random Forest) : Port 8000 ]
         │
         └── (Chưa triển khai) ──> [ Firebase / Node.js Server (Auth, Firestore) ]
```

### Chi tiết Tech Stack:
* **Mobile Frontend:**
  * Framework: React Native với **Expo SDK 58 (React 19, TypeScript)**.
  * Navigation: `@react-navigation/native`, `@react-navigation/native-stack`.
  * State Management: `zustand` (nhẹ, module hóa cao).
  * Storage: `@react-native-async-storage/async-storage` qua Zustand persist.
  * Icons & UI: `lucide-react-native`, `react-native-svg`.
  * Speech: `expo-speech` phát âm mẫu; `expo-speech-recognition` nhận dạng lời nói trên web/native.
  * Networking: `axios`.
* **AI Microservice:**
  * Framework: **FastAPI** + **Uvicorn** (Python 3.11).
  * ML Framework: **Scikit-learn**, **Pandas**, **Numpy**.
  * Định dạng dữ liệu: JSON RESTful API.
* **Môi trường & Triển khai (DevOps):**
  * **Docker** & **Docker Compose** điều phối toàn bộ dịch vụ.
  * AI Service đóng gói trong container `lixilearn-ai-service` map ra cổng `8000`.

---

## 4. Cấu Trúc Thư Mục Dự Án Hiện Tại

```text
DACN2_Project/
├── AGENTS.md                    # Tài liệu định hướng và ngữ cảnh dành cho AI Agents (File này)
├── README.md                    # Hướng dẫn chạy và sử dụng cho con người
├── docker-compose.yml           # Khai báo dịch vụ Docker (ai-service, mobile-web)
├── docker-compose.prod.yml      # Compose production cho AI service
├── .github/workflows/ci.yml     # Kiểm thử mobile và AI service trên GitHub Actions
├── De_cuong_DACN2.docx          # Bản word đề cương chính thức nộp khoa
├── ai-service/                  # Dịch vụ Python AI Microservice
│   ├── Dockerfile               # Python 3.11-slim container build
│   ├── requirements.txt         # fastapi, uvicorn, scikit-learn, pandas, numpy, pydantic
│   └── main.py                  # Điểm khởi chạy FastAPI: /health, /predict
├── mobile/                      # Ứng dụng di động React Native (Expo)
│   ├── App.tsx                  # Màn hình demo Flashcard SM-2 + Gamification Header
│   ├── Dockerfile & .dockerignore
│   ├── package.json             # Danh sách dependencies đã cài
│   └── src/
│       ├── types/index.ts       # Type definitions (User, Flashcard, PredictionPayload)
│       ├── utils/srs.ts         # Thuật toán SuperMemo SM-2 chuẩn
│       ├── store/useUserStore.ts# Zustand store quản lý user streak, xp và cards
│       ├── components/          # Reusable UI widgets
│       ├── screens/             # Màn hình ứng dụng (Home, Learn, Review, Profile,...)
│       ├── services/            # Axios API client gọi AI service
│       ├── navigation/          # React Navigation Stacks & Tabs
│       ├── utils/tabBarLayout.ts # Layout tab bar theo safe-area/viewport
│       └── hooks/               # Custom React hooks
│   └── tests/                   # Kiểm thử SM-2, store, AI và UI layout
└── server/src/                  # Chưa có triển khai backend (Firebase/Node.js)
```

---

## 5. Tiến Độ Hiện Tại & Những Việc Đã Hoàn Thành (Current State)
1. Đã phân tích toàn bộ yêu cầu trong `De_cuong_DACN2.docx`.
2. Đã khởi tạo hoàn chỉnh source code React Native bằng Expo SDK (TypeScript) trong `mobile/`.
3. Các thư viện chính hiện có: React Navigation, Zustand, Axios, Lucide Icons, Async Storage, React-Native-Web, expo-speech và expo-speech-recognition.
4. Đã tách và module hóa cấu trúc giao diện hoàn chỉnh (`src/screens/HomeScreen.tsx`, `src/screens/StudyScreen.tsx`, `src/screens/ProfileScreen.tsx`, `src/navigation/RootNavigator.tsx`) với phong cách **Warm Vanilla & Terracotta** dịu mắt.
5. Đã lập trình thuật toán SuperMemo SM-2 tại `mobile/src/utils/srs.ts` và tích hợp vào màn hình ôn tập `StudyScreen`.
6. **Mô hình Học máy Machine Learning:**
   * Đã sinh tập dữ liệu 5,000 mẫu (`ai-service/generate_dataset.py`).
   * Đã xây dựng pipeline huấn luyện hoàn chỉnh (`ai-service/train.py`): Baseline $\rightarrow$ Feature Engineering (10 đặc trưng) $\rightarrow$ Hyperparameter Tuning (GridSearchCV 5-folds).
   * Báo cáo trên dữ liệu mô phỏng ghi nhận Accuracy 92.5%, F1-Score 92.2%, ROC-AUC 98.42%; chưa đại diện cho hiệu năng trên người học thật.
   * Đã phân tích Feature Importance (đặc trưng `accuracy_per_second` và `difficulty_challenge` giữ vai trò chi phối).
   * Đã lưu mô hình `ai-service/model.pkl` và xuất báo cáo `evaluation_report.json`.
7. Đã tích hợp mô hình máy học đã tối ưu trực tiếp vào FastAPI `ai-service/main.py`, test thành công qua Docker ở cổng `8000`.
8. **Đã hoàn thiện Cầu nối Tích hợp AI Khép kín (App $\leftrightarrow$ AI Microservice):**
   * Đã xây dựng client `mobile/src/services/aiService.ts` kết nối tới AI container.
   * `StudyScreen` tự động đo lường thời gian phản xạ (`avg_response_time_ms`), độ chính xác thực nghiệm, và gửi lên mô hình Random Forest.
   * Hiển thị thẻ phân tích AI trực quan với tỷ lệ độ chắc chắn (%) và tự động đề xuất lộ trình (`challenge_mode`, `review_now`, hoặc `normal_schedule`).
9. **Đã tích hợp Module luyện nói và nhận dạng transcript:**
   * `expo-speech` phát âm mẫu và `expo-speech-recognition` nhận dạng lời nói trên web/native.
   * So sánh transcript với từ mục tiêu bằng Levenshtein; đây chưa phải phân tích âm vị/phát âm từ tín hiệu âm thanh.
   * Native speech recognition cần development build và quyền micro/nhận dạng; không chạy trên Expo Go.
   * Đưa tab **"Luyện nói"** vào thanh điều hướng chính `RootNavigator.tsx`.
10. **Đã hoàn thiện giao diện Gamification & Bảng Xếp Hạng minh họa:**
    * Tạo màn hình `LeaderboardScreen.tsx` với bục vinh danh Top 3 (Vàng 🥇, Bạc 🥈, Đồng 🥉) cho dữ liệu minh họa.
    * Tự động hiển thị thứ hạng cá nhân (`currentUserRank`), điểm XP tích lũy và chuỗi Streak ngày.
    * Đưa tab **"Bảng vàng"** vào thanh điều hướng chính `RootNavigator.tsx`.
    * Người học mẫu trên bảng chưa được lấy từ backend; UI thông báo đây là dữ liệu minh họa.
11. **Đã phát triển Kho Từ Vựng Micro-learning Đa Chủ Đề & Bộ Lọc Tương Tác:**
    * Xây dựng kho từ vựng mở rộng [mockCards.ts](file:///C:/Users/lengu/Documents/DACN2_Project/mobile/src/constants/mockCards.ts) với 4 chủ đề cốt lõi: *Công nghệ thông tin (IT), Giao tiếp hàng ngày, Học thuật & Nghiên cứu, Môi trường làm việc*.
    * Bổ sung thanh chọn chủ đề ngang (Topic Filter Pills) trên `StudyScreen`, tự động cập nhật số lượng thẻ và tương thích với thuật toán SM-2 lẫn AI Random Forest.
12. SM-2 đồng bộ repetition/reset đúng khi trả lời sai; state học, XP và lịch sử XP được persist cục bộ.
13. Gợi ý AI ảnh hưởng thứ tự thẻ tiếp theo; fallback được đánh dấu riêng. URL AI cấu hình qua `EXPO_PUBLIC_AI_SERVICE_URL`.
14. Luyện nói dùng native/web speech recognition thật; XP chỉ thưởng khi transcript thật đạt ngưỡng. Phần chấm hiện so khớp văn bản, chưa phân tích âm vị.
15. Streak tăng tối đa một lần mỗi ngày. Bảng xếp hạng tuần/toàn thời gian khác nhau; dữ liệu người học khác vẫn là mẫu.
16. Đã thêm kiểm thử cho SM-2, store persistence, AI client/API validation, transcript matching, weekly XP và daily streak.
17. Tab bar dùng safe-area inset, nhãn rút gọn ở màn hình hẹp, có accessibility labels và kiểm thử layout; xác minh web ở viewport 320px. Thiết bị thật vẫn cần kiểm tra thủ công.
18. Compose phát triển có healthcheck và CORS qua môi trường; `docker-compose.prod.yml` chạy AI API không bật reload, read-only, bỏ capabilities và yêu cầu allowlist CORS.
19. GitHub Actions kiểm tra mobile và AI service; phiên bản Expo được đồng bộ với SDK. `minimatch` của Expo Fingerprint được override sang bản đã vá bảo mật.

---

## 6. Hướng Dẫn Vận Hành Dành Cho AI Agent

### Khởi động và kiểm tra AI Service:
```bash
# Kiểm tra container đang chạy:
docker ps

# Chạy AI service (nếu chưa bật):
docker compose up -d ai-service

# Kiểm tra log AI service:
docker compose logs -f ai-service

# Kiểm tra endpoint kiểm tra sức khỏe qua PowerShell:
Invoke-RestMethod -Uri http://localhost:8000/ -Method Get

# Thử nghiệm endpoint dự đoán:
$body = @{
  user_id = "user_001"; card_id = "card_1"; difficulty_level = 2;
  recent_accuracy = 0.85; avg_response_time_ms = 2200;
  consecutive_correct = 3; streak = 5; review_count = 4
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/predict -Method Post -Body $body -ContentType "application/json"
```

### Khởi động Mobile App:
```bash
cd mobile
npx expo start
# Nhấn 'w' để test trên web. Native speech recognition cần development build, không chạy trong Expo Go.
```

---

## 7. Các Nhiệm Vụ Còn Lại (Roadmap / Next Steps)

Khi nhận tiếp công việc từ người dùng, Agent hãy ưu tiên thực hiện theo lộ trình:

1. **Firebase / Backend:** triển khai Authentication và đồng bộ Firestore; cần Firebase project, cấu hình môi trường và Firestore security rules.
2. **Leaderboard thật:** thay dữ liệu sinh viên mẫu bằng dữ liệu backend, xác định cách tính XP theo tuần/toàn khóa và quyền riêng tư.
3. **AI thực nghiệm:** thay hoặc bổ sung dataset mô phỏng bằng dữ liệu benchmark/ẩn danh có nguồn gốc; đánh giá mô hình trên tập độc lập trước khi dùng metric như kết quả thực tế.
4. **Đánh giá phát âm:** transcript matching hiện không đánh giá âm vị; cần mô hình/dịch vụ pronunciation assessment nếu đề tài yêu cầu phân tích phát âm ở mức âm thanh.
5. **Native release:** tạo development/release build và xác minh quyền mic, speech service, lưu trữ trên thiết bị thật Android/iOS. Không thể xác minh luồng native chỉ bằng web export.
6. **Hoàn thiện vận hành:** cấu hình hạ tầng production thật, HTTPS/reverse proxy, logging/monitoring và quy trình phát hành.

---

## 8. Quy Tắc Ứng Xử Dành Cho AI Agent (Agent Rules of Engagement)
* **Giữ gìn ngữ cảnh:** Khi thêm file hay refactor mã nguồn, luôn cập nhật các thay đổi lớn vào `AGENTS.md` để các session sau không bị đứt đoạn.
* **Tận dụng Docker:** Luôn ưu tiên chạy các dịch vụ bổ trợ (AI model, mock database, server) qua `docker-compose.yml` để đảm bảo tính cô lập và nhất quán trên máy của người dùng.
* **Ngôn ngữ phản hồi:** Trả lời người dùng bằng tiếng Việt thân thiện, rõ ràng, tập trung vào giải pháp kỹ thuật thực tế cho đề tài sinh viên VKU.
