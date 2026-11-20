Bạn làm việc trong repo https://github.com/ltminh88/fit3-navigation, branch spike/s1-canvas-map (PR #1).
Trước khi làm: git pull branch này (chủ repo vừa push commit ghi kết quả simulator vào spikes/results/s1-canvas-map.md;
KHÔNG sửa các ô kết quả đã điền trong file đó).
Giữ nguyên ràng buộc của brief gốc tasks/task-01-muse-s1-watch-canvas-map-spike.md (ES5, không npm, file < 200 dòng).

JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/

## Kết quả Previewer liteWearable trên trang map
- Bản đồ vẽ đúng và xoay 10°/giây. Chấm vị trí hiện.
- Thanh số đo KHÔNG thấy chữ, chỉ thấy nút "Quay lai". Nguyên nhân: `.stats` trong map.css không đặt `color`;
  chữ mặc định trên lite là màu trắng, nền trắng → không đọc được. (api-probe.css có color #000000 nên đọc được.)
- Tuyến chính lineWidth 8 ở góc chéo bị vẽ thành chuỗi chấm tròn rời nhau; ở góc ngang/dọc thì liền nét.

## Việc cần làm
1. map.css: `.stats` thêm `color: #000000;`. Thanh `.stats-bar` thêm nền trắng rõ ràng (`background-color: #ffffff`).
   Kiểm mọi <text> và <input type="button"> còn lại trong 3 trang đều có color tường minh.
2. Thêm thử nghiệm độ dày đường trên trang map: thêm một nút <input type="button"> "W" trong thanh số đo,
   mỗi lần bấm đổi lineWidth tuyến chính theo vòng 8 → 6 → 4 → 2 → 8. Thanh số đo hiển thị thêm "w<giá trị>".
   Khi đổi độ dày: reset maxMs về 0 để số max đo riêng cho từng độ dày. Giữ map.js < 200 dòng
   (được tách hằng/hàm phụ sang file common mới nếu cần, tên kebab-case).
3. Cập nhật spikes/results/s1-canvas-map.md: thêm một bảng NHỎ, MỚI tên "Độ dày tuyến chính" với cột
   | lineWidth | Liền nét ở góc chéo? (simulator) | Liền nét ở góc chéo? (máy thật) | max ms (máy thật) |
   và 4 hàng 8, 6, 4, 2 để trống. Không sửa các ô đã điền.

## Kiểm chứng
- Build bằng hvigorw nếu có; không có thì ghi rõ, chủ repo sẽ build.

## Git
- Commit thẳng vào spike/s1-canvas-map (conventional commits), push. Không mở PR mới. Không nhắc AI.

## Báo cáo khi xong
- Danh sách commit, mục 1–3 đã làm gì (1 dòng mỗi mục), giả định mới, trạng thái DONE / DONE_WITH_CONCERNS / BLOCKED.
