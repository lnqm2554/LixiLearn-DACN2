# LixiLearn

LixiLearn là ứng dụng học tiếng Anh đa nền tảng cho đồ án DACN2, kết hợp flashcard theo chủ đề, lịch ôn SM-2, gợi ý học từ dịch vụ Random Forest (FastAPI), luyện nói qua nhận dạng giọng nói và gamification.

## Yêu cầu

- Node.js tương thích với Expo SDK 58
- Docker Desktop để chạy AI service
- Thiết bị hoặc máy ảo Android/iOS để kiểm tra nhận dạng giọng nói native

## Khởi chạy AI service

Từ thư mục gốc:

```powershell
docker compose up -d ai-service
docker compose logs -f ai-service
```

Service mặc định chạy tại `http://localhost:8000`; tài liệu OpenAPI ở `/docs`. Model, dataset và báo cáo huấn luyện nằm trong `ai-service/`.

## Khởi chạy ứng dụng mobile

```powershell
cd mobile
npm install
npx expo start
```

Web mặc định dùng `http://localhost:8000`; Android Emulator dùng `http://10.0.2.2:8000`. Khi dùng thiết bị thật hoặc một địa chỉ service khác, đặt `EXPO_PUBLIC_AI_SERVICE_URL` trong `mobile/.env.local`. Ví dụ điện thoại và máy phát triển cùng Wi-Fi:

```dotenv
EXPO_PUBLIC_AI_SERVICE_URL=http://192.168.1.20:8000
```

Biến `EXPO_PUBLIC_` sẽ được đóng gói công khai vào ứng dụng — không đặt secret ở đây. iOS cần cấu hình URL tường minh.

### Nhận dạng giọng nói native

App dùng `expo-speech-recognition` để nhận dạng lời nói thật. Đây là native module, **không có trong Expo Go**. Sau khi cài dependencies, tạo development build:

```powershell
npx expo run:android
# Trên macOS có Xcode:
npx expo run:ios
```

Nhận dạng phụ thuộc quyền thiết bị và dịch vụ speech recognition có sẵn trên nền tảng. Điểm hiện tại so khớp văn bản nhận dạng với từ mục tiêu, chưa phân tích âm vị từ tín hiệu âm thanh.

## Kiểm tra

Chạy tại `mobile/`:

```powershell
npm test
npx tsc --noEmit
npx expo export --platform web
docker exec lixilearn-ai-service python -m unittest discover -s /app/tests -v
```

The final command runs the AI service's built-in unit tests in the running container.
Tiến độ học được lưu cục bộ bằng AsyncStorage. Dữ liệu học viên khác trên bảng xếp hạng chỉ là minh họa, chưa đồng bộ server. Firebase Auth/Firestore và leaderboard production chưa được cấu hình. Random Forest hiện huấn luyện trên dữ liệu mô phỏng; các metric không đại diện cho hiệu năng trên người học thật.

## Cấu trúc hiện tại

```text
ai-service/       FastAPI prediction service, training scripts, generated data/model
mobile/src/
  navigation/     React Navigation tabs
  screens/        Home, study, speaking, leaderboard, profile
  services/       AI REST client
  store/          Persisted Zustand learner state
  utils/          SM-2, speech-text evaluation, study recommendations, streaks
server/src/       Dành cho backend tương lai; hiện chưa có triển khai
```
