Repo https://github.com/ltminh88/fit3-navigation. Tạo branch spike/s2-watch-p2p-replay từ origin/spike/s2-p2p-protocol
(PR #5, chưa merge — nếu lúc bạn làm PR #5 đã vào main thì tạo từ main). Mở PR vào main.
Giữ mọi ràng buộc lite của task-05..09 (không fill/clearRect/drawImage, đường <= 6 px, fillText y = đỉnh chữ,
ES5, file < 200 dòng, không tạo object trong vòng lặp nóng, router.replace, thẻ hợp lệ lite).

JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/

## Vì sao
common/p2p-frame-decoder.js (PR #5) chưa được trang nào import → bộ build lite chưa từng biên dịch nó, chưa biết
chạy được trên runtime lite không, tốn bao nhiêu RAM. Cần ghép vào đường chạy thật trước khi có quyền Wear Engine.

## Việc cần làm
1. Nguồn tin thay thế cho Wear Engine: common/p2p-replay-source.js — nhúng sẵn danh sách tin base64 sinh từ
   spikes/tools/p2p-encoder (file dữ liệu sinh tự động, được phép > 200 dòng, ghi "generated, do not edit"; thêm lệnh
   sinh lại vào README tool). Phát lại 5 tin/giây bằng setInterval, theo đúng thứ tự giao thức
   HELLO → ROUTE → ROADS → MANEUVERS → (ACK) → GUIDANCE 1 Hz → END.
   Có tuỳ chọn mô phỏng mất 10% tin + đảo thứ tự (bật/tắt bằng hằng số) để thấy RESEND_REQUEST hoạt động:
   khi decoder báo thiếu seq, nguồn phát lại tin đó.
2. Giao diện nguồn tin trừu tượng: common/watch-link.js với các hàm start(onMessage), stop(), sendToPhone(payload).
   Cài đặt hiện tại dùng p2p-replay-source. Ghi chú rõ chỗ sẽ thay bằng P2pClient của Wear Engine lite SDK
   (theo plans/reports/researcher-261120-huawei-signing-and-wear-engine-p2p.md mục C7) — KHÔNG viết code gọi API Huawei.
3. Trang nav-screen: thêm chế độ dữ liệu "p2p" bên cạnh fixture hiện tại. Ở chế độ p2p:
   - Màn hình chờ "Dang nhan du lieu... x/y" (đếm tin đã ráp / tổng) cho tới khi đủ ROUTE + ROADS + MANEUVERS.
   - Sau đó vẽ bản đồ + lời dẫn từ dữ liệu ĐÃ GIẢI MÃ (không đọc fixture-real-map trực tiếp).
   - Vị trí/heading/khoảng cách lấy từ tin GUIDANCE (không tự mô phỏng trên đồng hồ nữa ở chế độ này).
   - Mất GUIDANCE > 3 giây: hiện chấm vị trí màu xám + chữ nhỏ "Mat ket noi" ở khung trên.
   Chuyển chế độ: trang index thêm nút "P2P demo" mở nav-screen ở chế độ p2p (truyền tham số qua router.replace params).
4. Đo bộ nhớ gần đúng: đếm tổng số phần tử mảng số mà decoder giữ sau khi ráp xong, hiện ở góc dưới trái
   cùng chỗ số ms, dạng "<ms>ms <n>r <k>k" (k = nghìn phần tử).
5. Nếu nav-screen.js vượt 200 dòng: tách phần chế độ p2p sang common/nav-p2p-controller.js.

## Kiểm chứng
- Test Node: phát lại toàn bộ tin qua decoder → dữ liệu ráp xong khớp 100% fixture-real-map; với mất 10% + đảo thứ tự
  vẫn ráp đủ nhờ RESEND_REQUEST; GUIDANCE cập nhật vị trí đúng; quá 3 giây không có GUIDANCE → cờ mất kết nối.
- Không fill()/clearRect/drawImage, ES5 sạch. Build hvigorw nếu có; không có thì ghi rõ (chủ repo sẽ build).
Commit conventional, không nhắc AI. Báo cáo: link PR, file tạo/sửa, số tin + thời gian ráp xong ở 5 tin/giây,
số phần tử mảng decoder giữ, giả định, trạng thái DONE / DONE_WITH_CONCERNS / BLOCKED.
