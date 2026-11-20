Bạn làm việc trong repo https://github.com/ltminh88/fit3-navigation, branch spike/s1b-nav-screen-mock (PR #2).
Nhiệm vụ: thay kịch bản "bản đồ quay vòng 10°/giây" ở trang nav-screen bằng mô phỏng ĐI DỌC TUYẾN giống app thật.
Giữ nguyên ràng buộc của tasks/task-05 và task-06 (không fill/clearRect/drawImage, đường <= 6 px, fillText y = đỉnh chữ,
ES5, file < 200 dòng). Trang map (S1) KHÔNG đổi.

JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/

## Kết quả Previewer (video 22 s)
- ĐẠT: chữ đã căn giữa ô đen và biển tốc độ; lưới phố + đường lớn vàng trông như khu phố; 0–1 ms/khung.
- VẤN ĐỀ: bản đồ quay vòng liên tục, không khớp lời dẫn (ghi "Rẽ phải 220 m" nhưng tuyến chĩa chéo, không có chỗ rẽ).
  Chủ repo đang đánh giá độ đẹp của giao diện, nên mô phỏng phải giống chuyển động thật.

## Việc cần làm
1. Mô phỏng vị trí chạy dọc tuyến chính (common/fixture-route.js, đã decode):
   - Tốc độ giả 10 m/giây (36 km/h). Cập nhật 1 lần/giây (giữ nhịp 1 Hz như spike S1).
   - Vị trí người dùng = điểm nội suy trên polyline theo quãng đường đã đi. Hết tuyến thì quay lại đầu.
   - Heading = hướng của đoạn tuyến đang đi (atan2 theo x Đông, y Bắc) → bản đồ heading-up: tuyến phía trước luôn chĩa LÊN.
     Ở khúc cua, làm mượt heading: mỗi giây chỉ xoay tối đa 30° về hướng mới.
   - Bản đồ vẽ với gốc = vị trí hiện tại (dịch toàn bộ toạ độ trước khi xoay). Chỉ vẽ phần tuyến CHƯA đi
     (từ vị trí hiện tại trở đi) màu #2F7CF6; phần đã đi không vẽ.
   - Không tạo object trong vòng vẽ; tái dùng mảng (như map.js).
2. Lời dẫn sinh TỪ tuyến, không dùng 5 bước cố định nữa:
   - Tính sẵn (một lần, lúc onInit) danh sách điểm rẽ của tuyến: tại mỗi đỉnh mà hướng đổi > 30°, loại rẽ = 'left'/'right'
     theo dấu tích có hướng; đoạn cong liên tục (đổi hướng nhỏ từng bước) gộp thành 1 điểm rẽ ở cuối đoạn cong.
   - Khung dưới hiển thị điểm rẽ kế tiếp: icon theo loại rẽ, khoảng cách = quãng đường còn lại tới điểm đó
     (làm tròn 10 m; dưới 100 m làm tròn 5 m), tên đường lấy từ common/fixture-guidance.js theo thứ tự (vòng lại nếu thiếu).
   - Khi không còn điểm rẽ: icon đi thẳng + "Đến nơi" + khoảng cách tới cuối tuyến.
   - Giới hạn tốc độ / tốc độ hiện tại / khoảng cách tới biển kế tiếp: giữ từ fixture-guidance, tốc độ hiện tại hiển thị 36.
3. Giữ: khung đen, giờ, icon rẽ, màu, lưới phố, tỉ lệ 1 px = 1 m, vị trí chấm (240, 200), số ms góc dưới trái.
4. Nếu nav-screen.js vượt 200 dòng: tách logic mô phỏng sang common/route-follow-simulator.js
   và tính điểm rẽ sang common/route-maneuver-extractor.js (tên kebab-case).

## Kiểm chứng
- Test Node với mock canvas: heading-up (đoạn đang đi luôn hướng lên trên màn hình sau khi xoay), số điểm rẽ của fixture,
  khoảng cách giảm 10 m/giây, đổi lời dẫn khi qua điểm rẽ, quay lại đầu tuyến khi hết.
- Không gọi fill()/clearRect/drawImage. Build bằng hvigorw nếu có; không có thì ghi rõ.

## Git
- Commit thẳng vào spike/s1b-nav-screen-mock (conventional commits), push. Không mở PR mới. Không nhắc AI.

## Báo cáo khi xong
- Danh sách commit, mục 1–4 đã làm gì, số điểm rẽ tìm được trên tuyến fixture, giả định mới,
  trạng thái DONE / DONE_WITH_CONCERNS / BLOCKED.
