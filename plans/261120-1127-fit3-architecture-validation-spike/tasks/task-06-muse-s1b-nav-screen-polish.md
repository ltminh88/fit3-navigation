Bạn làm việc trong repo https://github.com/ltminh88/fit3-navigation, branch spike/s1b-nav-screen-mock (PR #2).
Nhiệm vụ: sửa và làm đẹp trang nav-screen theo kết quả chạy Previewer. Giữ nguyên ràng buộc của brief
tasks/task-05-muse-s1b-nav-screen-ui-mock.md (không fill/clearRect/drawImage, đường tối đa 6 px, ES5, file < 200 dòng).

JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/

## Kết quả Previewer (video 32 s, DevEco 6.1.1)
- ĐẠT: dấu tiếng Việt hiện đúng cả trong <text> lẫn canvas fillText; "150 m" 38 px vàng hiện rõ; icon rẽ sắc nét;
  phân cấp đường vàng/trắng + tuyến xanh + đĩa vị trí đúng; khoảng cách giảm mỗi giây, đổi bước mỗi 3 giây.
- LỖI 1: hai ô đen dưới biển tốc độ ("42", "300 m") chữ chỉ lòi nửa trên ở mép dưới ô, phần còn lại bị mất;
  số trong biển tốc độ cũng lệch xuống đáy vòng tròn.
  Kết luận: trên canvas lite, fillText(x, y) lấy y là ĐỈNH chữ (top), không phải baseline như web.
- LỖI 2: bản đồ thưa — quanh vị trí chỉ thấy 2–3 đường, chưa giống bản đồ thành phố.

## Việc cần làm
1. Thêm vào common/map-draw-helpers.js hàm drawTextTop(ctx, text, x, yTop) (hoặc tương đương) và sửa MỌI chỗ
   fillText ở nav-screen để căn theo đỉnh chữ: chữ trong ô đen nằm giữa ô theo chiều dọc; số trong biển tốc độ nằm
   giữa vòng tròn. Ghi chú quy tắc "y = top" vào comment đầu file helpers và vào spikes/results/s1-canvas-map.md
   (mục Ghi chú khác). Ô đen phải đủ rộng chứa "300 m" (đo bằng mắt, không có measureText).
2. Bản đồ dày hơn, giống thành phố:
   - Đổi tỉ lệ nav-screen sang 1 px = 1 m (chỉ nav-screen; trang map giữ 1 px = 2 m).
   - Thêm lưới phố quanh tuyến trong common/fixture-route.js: khoảng 25–35 đường nhỏ (2–4 điểm) tạo các ô phố
     cạnh 80–150 m, 4–5 đường lớn dài; sinh tất định (không random), vẫn mã hoá bằng route-codec.
     Nếu fixture-route.js vượt 200 dòng thì tách lưới phố ra common/fixture-street-grid.js.
   - Đường lớn: viền #E8A33D 6 px + lõi #F9D56E 4 px (giữ). Đường nhỏ: viền #DADADA 5 px + lõi #FFFFFF 3 px.
   - Đo thời gian vẽ một khung với lưới mới (Date.now()) và hiển thị nhỏ ở góc dưới trái vùng bản đồ dạng "<ms>ms"
     màu #999999 cỡ nhỏ nhất đọc được, để chủ repo biết lưới dày có làm chậm không. Ghi chú: sẽ bỏ ở bản thật.
3. Không đổi: khung đen dưới, giờ, icon rẽ, màu sắc tuyến, kịch bản dữ liệu giả.

## Kiểm chứng
- Không gọi fill()/clearRect/drawImage. Build bằng hvigorw nếu có; không có thì ghi rõ.

## Git
- Commit thẳng vào spike/s1b-nav-screen-mock (conventional commits), push. Không mở PR mới. Không nhắc AI.

## Báo cáo khi xong
- Danh sách commit, mục 1–2 đã làm gì, số đường trong lưới, giả định mới, trạng thái DONE / DONE_WITH_CONCERNS / BLOCKED.
