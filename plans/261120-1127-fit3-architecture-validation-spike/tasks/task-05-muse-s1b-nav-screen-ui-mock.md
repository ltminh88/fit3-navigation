Bạn làm việc trong repo https://github.com/ltminh88/fit3-navigation (nhánh main đã có spike S1 merge xong).
Nhiệm vụ: spike S1b — dựng MÀN HÌNH DẪN ĐƯỜNG mẫu trên Fit 3 với dữ liệu giả, để chủ repo đánh giá giao diện.
Giữ nguyên ràng buộc của brief gốc tasks/task-01-muse-s1-watch-canvas-map-spike.md
(ES5 var/function, không npm, mỗi file < 200 dòng, tên kebab-case, không commit cert/khoá).

JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/

## Sự thật đã đo trên Previewer liteWearable (DevEco 6.1.1) — BẮT BUỘC tuân theo
- Chạy: beginPath, moveTo, lineTo, stroke, closePath, lineWidth, strokeStyle, fillStyle, lineCap, lineJoin, arc (stroke), fillRect, fillText, font.
- KHÔNG có: clearRect (TypeError), drawImage (not a function). fill() gọi được nhưng KHÔNG vẽ gì.
  → Hình tròn đặc: vẽ bằng arc + stroke với lineWidth lớn (vd. arc bán kính r/2, lineWidth = r) — KHÔNG dùng fill().
  → Xoá khung: fillRect màu nền.
- Đường dày 8 px ở góc chéo bị vỡ thành chuỗi chấm; 4–6 px liền nét → tuyến chính 6 px, đường phụ <= 6 px.
- <text> mặc định chữ TRẮNG → mọi <text>/<input> phải đặt color tường minh.
- Router: chỉ router.replace. Thẻ hợp lệ: div, stack, canvas, text, input(type=button), image, list... KHÔNG có button.
- Màn hình Fit 3: chữ nhật 480x408. Previewer hiện mặt tròn 454x454 (bị cắt góc) — thiết kế cho 480x408,
  nhưng giữ chữ quan trọng cách mép >= 40 px.

## Bố cục (tham khảo phong cách màn hình đồng hồ của các app dẫn đường phổ biến; KHÔNG chép logo/tên/ảnh của app nào)
Trang mới pages/nav-screen/ (hml/css/js), gốc là <stack> 480x408:
1. Vùng bản đồ (canvas 480x408 phủ toàn màn hình, phần dưới bị khung đen che):
   - Nền be nhạt #F2EFE9 (fillRect mỗi khung).
   - MỤC TIÊU THẨM MỸ: chủ repo muốn giao diện đẹp ngang các app dẫn đường thương mại, không phải bản thử tạm.
     Ưu tiên màu sắc, phân cấp đường, độ rõ chữ, khoảng cách lề đều nhau.
   - Phân cấp đường (mỗi đường vẽ 2 lớp: viền trước, lõi sau; vẽ hết viền của mọi đường rồi mới vẽ lõi,
     để chỗ giao nhau liền mạch):
     · Đường lớn: viền #E8A33D 6 px, lõi #F9D56E 4 px.
     · Đường nhỏ: viền #CFCFCF 6 px, lõi #FFFFFF 4 px.
     Mở rộng fixture: trong common/fixture-route.js thêm (không phá dữ liệu cũ) cấp đường cho 8 đường phụ
     (3 đường lớn, 5 đường nhỏ) và thêm 4–6 đường nhỏ nữa cho bản đồ đỡ trống; đường phụ được phép 2–6 điểm.
   - Tuyến chính vẽ SAU cùng, đè lên mọi đường: viền trắng #FFFFFF 8 px? KHÔNG (8 px vỡ nét) → chỉ lõi #2F7CF6 6 px.
   - Tuyến chính: #2F7CF6, 6 px, lineCap/lineJoin round.
   - Vị trí người dùng ở (240, 200): đĩa xanh #2F7CF6 bán kính 9 + viền trắng 3 px (vẽ bằng arc stroke dày, xem trên).
   - Heading-up, tỉ lệ 1 px = 2 m, tái dùng drawPolyline/cách cắt đoạn của pages/map/map.js — TÁCH phần dùng chung
     sang common/map-draw-helpers.js (chiếu toạ độ, cắt đoạn cùng phía, vẽ polyline, vẽ đĩa tròn) và cho map.js import lại,
     không copy code (DRY). map.js phải vẫn chạy như cũ.
   - Tên đường: fillText màu #555555 ngang (không xoay chữ) ở góc trên phải, vd. "Phạm Văn Đồng".
2. Góc trên giữa: giờ "HH:MM" (<text>, màu #333333, cập nhật mỗi phút từ Date).
3. Góc trên trái: biển giới hạn tốc độ — vòng tròn viền đỏ #E53935 dày 5 px, nền trắng (đĩa trắng bằng arc stroke dày),
   số đen ở giữa (fillText). Dưới biển: ô đen bo nhẹ (fillRect) chữ trắng = tốc độ hiện tại, và ô thứ hai "300 m"
   = khoảng cách tới biển kế tiếp.
4. Khung dưới: <div> nền #000000, cao 130 px, sát đáy:
   - Dòng 1: icon rẽ (vẽ trên canvas nhỏ 56x56 riêng trong khung, nét trắng 6 px: rẽ trái/rẽ phải/đi thẳng/quay đầu)
     + "150 m" màu vàng #FFD400, chữ to nhất có thể (thử font-size 38px; nếu lite không nhận thì giảm, ghi chú lại).
   - Dòng 2: "Rẽ trái vào Lê Thánh Tôn" màu trắng, ~26px, text-align center, overflow cắt gọn.
   - Ghi chú trong code + báo cáo: đây là phép thử font lite có hiện dấu tiếng Việt không.
5. Dữ liệu giả common/fixture-guidance.js: một mảng 5 bước hướng dẫn
   { maneuver: 'left'|'right'|'straight'|'uturn', distanceM, streetName, speedLimit, currentSpeed, nextLimitDistanceM }
   (tên đường tiếng Việt có dấu). Dùng lại tuyến trong common/fixture-route.js.
   Mỗi 3 giây chuyển sang bước tiếp theo (vòng lại), distanceM giảm dần mỗi giây để thấy số chạy.
   Heading vẫn xoay chậm 10°/giây như spike S1.
6. Nút về trang chủ: chạm 1 lần vào khung đen dưới → router.replace về pages/index/index
   (không chiếm chỗ trên màn hình). Ghi chú cách thoát trong README.
7. Trang index thêm nút thứ 3 "Dan duong" mở nav-screen. Khai báo trang mới trong config.json.

## Kiểm chứng
- Build bằng hvigorw nếu có; không có thì ghi rõ, chủ repo sẽ build.
- Không khung nào được dùng fill(), clearRect, drawImage.

## Git
- Branch spike/s1b-nav-screen-mock từ main, conventional commits, push, mở PR vào main. Không nhắc AI.
- Mô tả PR: ảnh minh hoạ bố cục bằng ASCII, danh sách giả định về font/size lite.

## Báo cáo khi xong
- Link PR, file tạo/sửa, giả định (nhất là font-size lite và dấu tiếng Việt), trạng thái DONE / DONE_WITH_CONCERNS / BLOCKED.
