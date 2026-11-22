# LixiLearn

LixiLearn là ứng dụng học tiếng Anh đa nền tảng cho đồ án DACN2, kết hợp flashcard theo chủ đề, lịch ôn SM-2, gợi ý học từ dịch vụ Random Forest (FastAPI), luyện nói qua nhận dạng giọng nói và gamification.

## Yêu cầu

- Node.js tương thích với Expo SDK 58
- Python 3.11 nếu chạy AI tests hoặc huấn luyện model trực tiếp ngoài Docker
- Docker Desktop để chạy AI service
- Thiết bị hoặc máy ảo Android/iOS để kiểm tra nhận dạng giọng nói native

## Khởi chạy AI service

Từ thư mục gốc:

```powershell
docker compose up -d ai-service
docker compose ps
docker compose logs -f ai-service
```

AI service mặc định chạy tại `http://localhost:8000`; trạng thái container hiển thị `healthy` khi endpoint gốc phản hồi. Tài liệu OpenAPI ở `/docs`. Model, dataset và báo cáo huấn luyện nằm trong `ai-service/`.

### Cấu hình triển khai AI service

Compose mặc định dành cho phát triển: bật `--reload`, mount source code và cho phép CORS wildcard (không cho phép credentials). Khi triển khai AI service độc lập, chỉ định chính xác origin của web app; không dùng wildcard:

```powershell
$env:AI_ALLOWED_ORIGINS = "https://app.example.com"
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
```

Compose triển khai không mount source và không bật `--reload`; container chạy read-only, bỏ Linux capabilities và chặn privilege escalation. `AI_ALLOWED_ORIGINS` là cấu hình bắt buộc. HTTPS, reverse proxy, domain, secrets và nơi triển khai vẫn cần được cấu hình theo hạ tầng thực tế.

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

## Kiểm tra tự động

GitHub Actions chạy mobile tests, TypeScript, web export và AI service unit tests trên mỗi push/pull request. Có thể chạy cục bộ:

```powershell
cd mobile
npm ci
npm test
npx tsc --noEmit
npx expo export --platform web
cd ..\ai-service
python -m unittest discover -s tests -v
```

## Các bước cần phối hợp thủ công

### Firebase (chưa tích hợp vào ứng dụng)

Khi sẵn sàng làm Auth/Firestore, bạn cần tạo Firebase project, chọn region của Firestore, bật phương thức đăng nhập muốn dùng và đăng ký ứng dụng. Trước khi kết nối, cần chốt schema người dùng/tiến độ, quy tắc bảo mật và cách phân quyền leaderboard. Firebase client config không phải service-account secret; **không gửi service-account JSON hay private key**. Hiện source chưa dùng Firebase nên chưa cần thêm credentials vào repo.

### Kiểm thử Android thật

1. Cài Android Studio/Android SDK và driver thiết bị; bật USB debugging hoặc dùng emulator.
2. Khởi chạy AI service; với điện thoại thật, đặt `EXPO_PUBLIC_AI_SERVICE_URL` trong `mobile/.env.local` thành IP LAN của máy phát triển (không dùng `localhost`), ví dụ `http://192.168.1.20:8000`. Cho phép kết nối cổng này trên mạng riêng nếu firewall chặn.
3. Từ `mobile/`, tạo/chạy development build bằng `npx expo run:android --device`; cấp quyền microphone và thử các màn hình, lưu tiến độ và nhận dạng giọng nói.

Expo Go không chứa native speech-recognition module. iOS native build cần macOS và Xcode; môi trường Windows hiện tại chỉ tự kiểm tra được web/Android. Nhận dạng còn phụ thuộc dịch vụ ngôn ngữ có trên thiết bị; điểm hiện tại chỉ so khớp transcript, chưa chấm âm vị.

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
