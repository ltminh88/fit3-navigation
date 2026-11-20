Repo https://github.com/ltminh88/fit3-navigation. LÀM SAU task-10 (dùng kết quả câu 7–8 về payload string/bytes).
Tạo branch spike/s2-p2p-protocol từ main (sau khi PR task-10 đã có trên main hoặc rebase lên branch của nó), mở PR vào main.
Nhiệm vụ: đặc tả giao thức iPhone → Fit 3 và viết bộ mã hoá/giải mã JS, kiểm bằng Node với dữ liệu thật đã có.

## Ràng buộc
- Mỗi tin <= 1000 byte SAU khi mã hoá để gửi (chừa biên dưới 1 KB của iOS). Không gửi file.
- Nếu task-10 kết luận payload là string: đóng gói nhị phân rồi base64 (ghi rõ overhead 33%); nếu bytes: gửi nhị phân thẳng.
  Nếu task-10 chưa chắc: hỗ trợ cả hai qua một tham số, mặc định base64.
- Dữ liệu dùng định dạng đã có: toạ độ int16 delta theo route-codec.js, x Đông y Bắc mét, gốc = điểm xuất phát.
- Phía đồng hồ: ES5, không tạo object trong vòng lặp nóng, tái dùng mảng, file < 200 dòng.

## Đặc tả (docs/p2p-protocol.md)
Khung tin: version(1B) | type(1B) | sessionId(2B) | seq(2B) | total(2B) | payload.
Loại tin tối thiểu: HELLO (phiên bản, tên phương tiện), ROUTE_CHUNK, ROADS_CHUNK (kèm cấp đường lớn/nhỏ),
MANEUVERS (distanceM, loại rẽ, tên đường UTF-8), GUIDANCE 1 Hz (x, y, heading, khoảng cách tới điểm rẽ,
chỉ số maneuver, tốc độ hiện tại, giới hạn tốc độ — mục tiêu < 40 byte), ACK, RESEND_REQUEST(seq còn thiếu), END.
Mô tả: thứ tự gửi khi bắt đầu chuyến, xử lý mất/lặp/đảo thứ tự tin, đổi tuyến giữa chừng (sessionId mới),
giới hạn bộ nhớ đồng hồ (tối đa bao nhiêu điểm đường phố giữ trong RAM).

## Code
- spikes/watch-lite-app/.../common/p2p-frame-decoder.js (đồng hồ, ES5): nhận payload, ráp các chunk thành cấu trúc
  giống fixture-real-map (routes/roads/maneuvers), trả trạng thái thiếu seq nào.
- spikes/tools/p2p-encoder/ (Node, ES2020): đọc fixture-real-map hiện có → sinh danh sách tin theo đặc tả.
- Test Node: encode → decode khớp 100% với fixture; mọi tin <= 1000 byte; mô phỏng mất 10% tin + đảo thứ tự
  → RESEND_REQUEST đúng; in bảng: số tin mỗi loại, tổng byte, ước lượng thời gian gửi nếu 5 tin/giây và 2 tin/giây.
- Ghi bảng đó vào spikes/results/s2-p2p-message-budget.md.
Commit conventional, không nhắc AI. Báo cáo: link PR, số tin để gửi tuyến Bến Thành → Đức Bà, kích thước GUIDANCE,
giả định, trạng thái.
