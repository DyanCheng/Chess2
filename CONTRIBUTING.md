# Quy định phối hợp phát triển Chess2

Tài liệu này áp dụng cho mọi thay đổi trong repository. Mục tiêu là giữ `backup_main` luôn tích hợp được, giảm conflict và bảo đảm mọi thay đổi có thể kiểm tra lại.

## 1. Nhánh và môi trường

- `main`: chỉ chứa phiên bản đã được phát hành hoặc chấp thuận phát hành.
- `backup_main`: nhánh tích hợp/staging của sprint. Không push trực tiếp.
- `feature/<sprint>-<chuc-nang>`: phát triển tính năng, ví dụ `feature/s2-matchmaking`.
- `fix/<sprint>-<loi>`: sửa lỗi, ví dụ `fix/s2-socket-reconnect`.
- `chore/<noi-dung>`: hạ tầng, CI/CD hoặc tài liệu.

Mỗi task chỉ có một branch và một mục tiêu. Không gộp refactor lớn, thay đổi database và tính năng UI không liên quan vào cùng một pull request.

Trước khi bắt đầu code và trước khi mở pull request, phải đồng bộ với nhánh tích hợp:

```bash
git fetch origin
git rebase origin/backup_main
```

Không force-push lên nhánh dùng chung. Chỉ force-push có kiểm soát (`--force-with-lease`) lên branch cá nhân sau khi thông báo trên pull request.

## 2. Phân vùng sở hữu

| Thành viên | Phạm vi chính | Reviewer bắt buộc khi thay đổi contract |
|---|---|---|
| Ta | `chess-mobile-app/mobile/**`, giao diện, navigation, socket client | B hoặc T khi sửa API/socket event |
| B | `chess-mobile-app/backend/src/game/**`, gateway, matchmaking, bot | Ta khi sửa socket event; Pa khi đổi dữ liệu trận đấu |
| T | `chess-mobile-app/backend/src/auth/**`, controller, DTO, API, security, backend tests | B khi thay đổi game API; Pa khi đổi schema/RLS |
| Pa | `chess-mobile-app/database/**`, migration, RLS, seed, Supabase | B hoặc T trước khi merge migration |

Các phần dùng chung gồm DTO, event WebSocket, state machine, migration và biến môi trường. Người thay đổi phải cập nhật contract/tài liệu liên quan trong cùng pull request.

## 3. Quy tắc code và dữ liệu

- Không commit `node_modules`, `dist`, `coverage`, `.env`, token, key hoặc thông tin đăng nhập.
- Không sửa migration đã chạy trên môi trường chung. Tạo migration mới có số thứ tự tiếp theo.
- Mỗi migration phải có mô tả, index cần thiết, RLS/policy tương ứng và seed hoặc hướng dẫn kiểm thử nếu cần.
- Backend là nguồn xác thực duy nhất cho luật đi cờ, lượt chơi, card effect, currency và kết quả trận đấu. Client chỉ gửi yêu cầu, không tự quyết định kết quả.
- Mọi API hoặc event mới phải ghi rõ payload, lỗi có thể trả về và quyền truy cập.
- Không dùng `any` cho payload public nếu có thể định nghĩa DTO/type cụ thể.

## 4. Pull request và review

Mỗi pull request phải:

1. Được tạo từ branch task vào `backup_main`.
2. Có tiêu đề theo dạng `feat:`, `fix:`, `ci:`, `docs:` hoặc `chore:`.
3. Mô tả task, phạm vi thay đổi, cách kiểm thử và rủi ro/việc còn lại.
4. Không có file sinh tự động hoặc thay đổi không liên quan.
5. Qua toàn bộ checks bắt buộc: Backend CI, CodeQL và Docker build khi liên quan backend.
6. Có ít nhất một review; thay đổi contract hoặc database phải có reviewer đúng phân vùng sở hữu.

Chỉ squash merge. Người tạo PR là người chịu trách nhiệm rebase, xử lý conflict và trả lời toàn bộ review trước khi merge.

## 5. Xử lý conflict

Khi Git báo conflict:

1. Dừng merge nếu conflict chạm vào DTO, socket event, state machine hoặc migration.
2. Rebase branch lên `origin/backup_main` và xác định owner của file conflict.
3. Owner file và người tạo PR thống nhất kết quả; không chọn `ours` hoặc `theirs` một cách máy móc.
4. Chạy lại build, test liên quan và CI sau khi resolve.
5. Ghi rõ nguyên nhân và cách xử lý conflict trong PR nếu conflict ảnh hưởng contract hoặc dữ liệu.

## 6. Nhịp sprint hằng tuần

Sprint bắt đầu thứ Hai và kết thúc Chủ Nhật.

- Thứ Hai: chốt mục tiêu, task owner, API contract và schema thay đổi.
- Thứ Ba–Thứ Năm: phát triển trên branch task; mở draft PR sớm khi thay đổi contract.
- Thứ Tư: đồng bộ `backup_main` và xử lý conflict sớm.
- Thứ Sáu: code freeze; sau thời điểm này chỉ nhận bug/blocker đã được chấp thuận.
- Thứ Bảy: integration test, review tồn đọng và merge các PR đạt điều kiện.
- Chủ Nhật: demo, kiểm tra CI/CD, cập nhật tiến độ và lập backlog sprint tiếp theo.

Task chưa đạt Definition of Done phải chuyển sang sprint sau với lý do, phần đã hoàn thành và rủi ro còn lại; không đánh dấu hoàn thành chỉ vì đã mở pull request.

## 7. Definition of Done

Một task chỉ hoàn thành khi:

- Code đã được review và merge vào `backup_main`.
- CI bắt buộc pass.
- Có test phù hợp: unit, API, game-rule, WebSocket, integration, security hoặc load tùy phạm vi.
- Không có secret/artifact build được commit.
- Tài liệu API, event, migration hoặc biến môi trường đã được cập nhật nếu thay đổi.
- Có thể demo được trên môi trường dev/staging khi task ảnh hưởng chức năng người dùng.

## 8. Phát hành và xử lý khẩn cấp

- Chỉ merge `backup_main` vào `main` sau UAT, release checklist và chấp thuận của người phụ trách dự án.
- Deploy production phải có approval; không dùng secret production cho local hoặc branch feature.
- Lỗi production xử lý bằng branch `fix/<sprint>-<loi>`, có mô tả tác động, phương án rollback và postmortem ngắn sau khi khắc phục.
- Bất kỳ thay đổi nào có nguy cơ mất dữ liệu, thay đổi RLS hoặc schema production phải được Pa và một backend reviewer chấp thuận trước khi chạy.
