# Arcane Chess (Expo Go trên Android)

Ứng dụng Android dùng Expo SDK 50 trên React Native 0.73 trong `mobile/`; backend NestJS nằm trong `backend/`.
Chế độ chơi với bot dùng luật cờ `chess.js` ngay trên điện thoại và không cần mạng.
PvP dùng Socket.IO với backend; địa chỉ máy chủ được nhập trong tab **Cài đặt**.

## Chạy bằng Expo Go, không cần Java/Gradle

Trên điện thoại Android, cài **Expo Go dành cho SDK 50** từ [expo.dev/go](https://expo.dev/go) (chọn Android và SDK 50); bản Expo Go mới nhất trên Play Store có thể không mở được dự án SDK 50. Máy tính và điện thoại cần cùng Wi-Fi tin cậy. Với Git Bash trên máy này, chạy:

```bash
cd /f/code/Chess2/Mobile/chess-mobile-app/mobile
npm ci
npm exec --yes --package=node@22 -- expo start --go --lan
```

Quét QR bằng Expo Go. Không cần tài khoản Expo, JDK, Android SDK hoặc emulator. Metro phục vụ bundle JavaScript cho các thiết bị trong LAN; chỉ dùng trên mạng tin cậy và nhấn `Ctrl+C` sau khi demo. PvP vẫn cần backend Docker và địa chỉ IP LAN ở mục **Cài đặt**. RevenueCat cho phép xem trước màn cửa hàng trong Expo Go, nhưng **không thể thực hiện giao dịch Google Play thật trong Expo Go**; luồng mua thật cần Development Build bên dưới.

## Build Android qua Expo/EAS (khi cần APK riêng)

Development Build là lựa chọn nếu sau này app dùng thêm thư viện native ngoài Expo Go. Máy chủ EAS vẫn dùng Gradle để tạo APK, nhưng máy phát triển không cần JDK hoặc Android SDK. Cần tài khoản Expo:

```powershell
npm exec --yes --package=eas-cli@26 -- eas login
npm exec --yes --package=eas-cli@26 -- eas init
npm run build:android:dev
```

Cài APK từ liên kết EAS lên điện thoại. Để chạy app trong bản development và cập nhật JavaScript qua Wi-Fi, chạy Metro bằng Node 22 rồi quét mã QR trong development build:

```powershell
npm exec --yes --package=node@22 -- expo start --dev-client --lan
```

Để tạo APK demo chạy độc lập không cần Metro, dùng `npm run build:android:cloud` (profile `preview`). File APK cũ trong `mobile/android/app/build/outputs/apk/release/` được build **trước** khi chuyển sang Expo, không chứa các thay đổi Expo mới. EAS cần đăng nhập tài khoản trước khi build; không đưa mật khẩu hoặc token vào repository. Cấu hình EAS nằm trong `mobile/eas.json`.

Expo SDK 50 được chọn để tương thích với React Native 0.73 hiện tại. Đây là SDK cũ; cần lên kế hoạch nâng React Native/Expo trước khi phát hành công khai. Phạm vi chuyển đổi và kiểm tra hiện tại là Android; phần iOS native chưa được tích hợp Expo.

## In-App Purchase trên Android

Luồng mua dùng RevenueCat SDK trên mobile, RevenueCat REST API ở backend và bảng `iap_transactions` trên Supabase. Mobile không gửi số vàng/kim cương cần cộng. Backend lấy lịch sử giao dịch từ RevenueCat, ánh xạ product ID sang phần thưởng cố định và gọi hàm database nguyên tử; cùng một giao dịch Google Play chỉ được cộng một lần.

1. Trong Google Play Console, tạo bốn **one-time products**: `arcane_chess_gold_1000`, `arcane_chess_gems_100`, `arcane_chess_starter_bundle`, `arcane_chess_pro_bundle`.
2. Tạo ứng dụng Android tương ứng trong RevenueCat, kết nối Google Play service credentials và import bốn product trên.
3. Đổi Android application ID mẫu `com.helloworld` sang package name đã đăng ký trong Play Console trước khi phát hành. Không đổi package name sau khi đã phát hành.
4. Điền `REVENUECAT_SECRET_API_KEY` vào `.env` cạnh `docker-compose.yml`. Tạo `mobile/.env` từ `mobile/.env.example` và điền `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`; secret chỉ được đưa vào backend Docker, còn key `goog_...` là SDK key công khai được nhúng vào app.
5. Build bằng `npm run build:android:dev`, cài APK lên thiết bị Android, rồi chạy Metro với `npm run start:dev-client`. Tài khoản tester phải được thêm vào Play Console và bản app phải được phân phối qua một testing track để kiểm thử Billing thật.

Sau khi mua, app gọi `POST /iap/sync`; nút **Đồng bộ giao dịch** có thể khôi phục phần thưởng nếu thanh toán thành công nhưng mạng bị ngắt trước khi backend ghi nhận. Các gói hiện chỉ cấp đúng số vàng/kim cương hiển thị, không cấp thẻ ngẫu nhiên.

## Tạo APK cục bộ (tùy chọn, cần JDK/Gradle)

Yêu cầu Node.js 22, JDK 17 và Android SDK có API 34, Build Tools 34.0.0, NDK 25.1.8937393. Đặt `ANDROID_HOME` trỏ đến SDK trên máy. `mobile/android/local.properties` là cấu hình riêng của máy và không được commit.

```powershell
cd mobile
npm ci
cd android
.\gradlew.bat assembleRelease
```

APK nằm tại `mobile/android/app/build/outputs/apk/release/app-release.apk`. Chép file APK vào điện thoại Android và mở để cài; có thể cần cho phép cài ứng dụng từ nguồn này trong Cài đặt Android. Bản release hiện được ký bằng debug keystore của dự án, chỉ dùng để kiểm thử, không dùng để phát hành lên Play Store.

Không cần Android emulator hoặc Metro khi cài APK release. Để cài qua USB, bật USB debugging trên điện thoại rồi chạy:

```powershell
adb devices
adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
```

## Kết nối Supabase (tài khoản và lịch sử PvP)

1. Project `S.A.N.D` đã được nối qua MCP. Hai migration đã áp dụng và được lưu trong [supabase/migrations](supabase/migrations): migration đầu tiên căn chỉnh backend với `matches`, `match_players`, `match_moves`, thêm RLS/index; migration sau loại bỏ index trùng. Không chạy các file cũ trong `database/migrations/` lên project này.
2. `.env` cục bộ đã có URL và publishable key. Thêm `SUPABASE_SECRET_KEY` từ Supabase Dashboard → Settings → API Keys trước khi chạy backend. Backend cũng nhận tên biến cũ `SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` khi chạy trực tiếp. **Không đặt secret/service-role key trong mobile hoặc commit `.env`.**
3. Chạy `docker compose up --build -d backend`. Kiểm tra `http://localhost:8080/health/database`: phải trả `{"status":"connected"}`. Endpoint `/health` chỉ kiểm tra tiến trình backend, không xác nhận Supabase.
4. Trong app Expo Go, vào **Cài đặt**, lưu URL backend qua IP LAN (không dùng `localhost` trên điện thoại), bấm **Kiểm tra Supabase**. Ở **Hồ sơ**, chọn **Đăng nhập / Đăng ký**. Nếu Supabase bật xác nhận email, mở email xác nhận rồi đăng nhập. Lịch sử ván của tài khoản nằm ở **Lịch sử → Tải lịch sử online**.

Backend xử lý đăng ký/đăng nhập bằng Supabase Auth; hồ sơ được đọc/cập nhật qua `GET/PUT /player/profile` với Bearer token và chính sách RLS theo `auth.uid()`. `POST /auth/refresh` làm mới phiên. `GET /matches/history` chỉ trả ván có player ID khớp tài khoản đã xác thực. Refresh token được giữ bằng Expo SecureStore; khóa Supabase đặc quyền chỉ dùng ở backend để lưu `matches`, `match_players` và `match_moves`.

MCP đã xác nhận database và luồng ghi `matches` thật bằng transaction rollback. Phần PvP hiện vẫn dùng trạng thái ván trong bộ nhớ để xử lý thời gian thực; Supabase lưu lịch sử, **chưa khôi phục ván đang chơi sau khi backend khởi động lại**. Socket.IO hiện yêu cầu Supabase access token và kiểm tra người dùng cho từng sự kiện PvP. Cần thêm `SUPABASE_SECRET_KEY` cục bộ để backend có thể ghi ván thật; dữ liệu PvE/cửa hàng/thẻ vẫn cục bộ.

## Kết nối PvP

Để chạy backend bằng Docker trên máy cùng mạng Wi-Fi với điện thoại (không cần Gradle):

```powershell
docker compose up --build -d backend
docker compose ps
Invoke-WebRequest http://localhost:8080/health
```

Lệnh trên chỉ khởi động backend production ở cổng 8080. Redis được giữ trong profile `scaling` nhưng **chưa được backend sử dụng**, nên không cần chạy để demo. Xem lỗi bằng `docker compose logs -f backend`; dừng bằng `docker compose down` (không dùng `-v` nếu muốn giữ dữ liệu volume). Chạy các lệnh tại thư mục chứa file `docker-compose.yml`.

Nếu không dùng Docker, có thể khởi động backend trực tiếp:

```powershell
cd backend
npm ci
npm run build
npm run start:prod
```

Trong app, mở **Cài đặt** và nhập `http://<IP-LAN-của-máy-chủ>:8080`, sau đó chọn **Lưu và kiểm tra kết nối**. `localhost` trên điện thoại là chính điện thoại, không phải máy tính. Nếu kiểm tra kết nối không đạt, kiểm tra Windows Firewall và bảo đảm backend lắng nghe trên giao diện LAN.

Docker chỉ chạy backend, không chạy giao diện React Native. Cài APK trên điện thoại như hướng dẫn phía trên. Endpoint `/health` chỉ xác nhận backend đang chạy; cần thử ghép trận bằng hai điện thoại để xác nhận luồng PvP thực tế.

## Kiểm tra mã mobile

```powershell
cd mobile
npm test -- --runInBand
npx tsc --noEmit --jsx react-native --esModuleInterop --skipLibCheck --target es2020 --moduleResolution node --module commonjs App.tsx
```

Giá tiền thật trong cửa hàng được tải từ Google Play qua RevenueCat; vật phẩm mua bằng vàng/kim cương và thẻ vẫn dùng dữ liệu cục bộ. Lịch sử PvE lưu cục bộ; lịch sử PvP của tài khoản được tải từ Supabase khi người dùng chọn tải.
