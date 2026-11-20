Bạn làm việc trong repo https://github.com/ltminh88/fit3-navigation (monorepo, license MIT, repo PUBLIC).
Nhiệm vụ: viết spike S1, kiểm tra canvas JS trên Huawei Watch Fit 3 có vẽ được bản đồ vector không.

## Bối cảnh
- Fit 3 là thiết bị HarmonyOS "lite wearable": app viết bằng JS + HML + CSS, màn hình 480x408 px, RAM rất ít, khó xem log.
- Câu hỏi cần trả lời: canvas có vẽ được polyline (moveTo/lineTo/stroke) đủ nhanh để hiện bản đồ dẫn đường xoay theo hướng đi không?
- Đọc trước:
  - plans/261120-1127-fit3-architecture-validation-spike/plan.md
  - plans/261120-1127-fit3-architecture-validation-spike/phase-02-watch-canvas-vector-map-rendering.md

## Điều kiện tiên quyết
Chủ repo đã tạo sẵn project DevEco Studio kiểu Lite Wearable (JS) tại spikes/watch-lite-app/.
- Template "[Lite]Empty Ability", FA model, deviceType liteWearable, bundle com.ltminh88.fitnav.
- Cấu hình ở spikes/watch-lite-app/entry/src/main/config.json; code JS ở spikes/watch-lite-app/entry/src/main/js/MainAbility/ (đã có app.js và pages/index/).
- Mọi đường dẫn common/... và pages/... bên dưới đều tính từ thư mục JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/.
- Trang mới phải khai báo vào mảng module.js[0].pages trong config.json.
- Nếu không có config.json hoặc deviceType không phải liteWearable: DỪNG, báo lại. Không tự dựng project.
- Không sửa file build/cấu hình khác của DevEco (build-profile.json5, hvigor*, oh-package*).

## Việc cần làm (branch: spike/s1-canvas-map)
1. common/route-codec.js
   - Định dạng: mảng số nguyên [x0, y0, dx1, dy1, dx2, dy2, ...], đơn vị mét.
   - Hệ toạ độ phẳng lấy vị trí người dùng làm gốc: x hướng Đông, y hướng Bắc.
   - Mỗi giá trị phải nằm trong khoảng int16.
   - Viết decodeInto(deltaArr, outArr): giải mã sang toạ độ tuyệt đối [x, y, x, y, ...], tái dùng outArr, không tạo object cho từng điểm.
   - Viết encode(absArr): chiều ngược lại. Hàm này để sau này điện thoại dùng.
2. common/fixture-route.js
   - Một tuyến giả lập khoảng 200 điểm, dài 2–3 km, có vài khúc rẽ 90° và một đoạn cong.
   - Thêm 8 đường phụ cắt ngang, mỗi đường 2–6 điểm.
   - Dữ liệu viết cứng hoặc sinh tất định (không random), đã mã hoá bằng định dạng ở bước 1.
3. pages/api-probe/ (hml/css/js)
   - Gọi lần lượt từng API trong try/catch: getContext('2d'), beginPath, moveTo, lineTo, stroke, closePath, lineWidth, strokeStyle, lineCap, lineJoin, arc, fill, fillRect, fillText, font, save/restore, translate, rotate, drawImage.
   - In kết quả lên màn hình dạng "tên: OK" hoặc "tên: FAIL <lỗi>", vì không có log.
4. pages/map/ (hml/css/js)
   - Canvas 480x408.
   - Chấm vị trí người dùng đặt ở (240, 290) để thấy được phần đường phía trước.
   - Tỉ lệ cố định 1 px = 2 m.
   - Xoay theo hướng đi (heading-up): tự xoay toạ độ bằng sin/cos trong JS trước khi vẽ. KHÔNG dựa vào ctx.rotate.
   - Bỏ qua đoạn nào có cả hai đầu nằm ngoài màn hình.
   - Thứ tự vẽ: đường phụ (xám, 3 px) → tuyến chính (màu nổi, 8 px) → chấm vị trí.
   - Animate heading tăng 10° mỗi giây bằng setInterval. Dừng interval ở onDestroy.
   - Góc màn hình in 3 số: thời gian vẽ khung gần nhất (ms), thời gian vẽ lớn nhất (ms), tổng số khung đã vẽ.
5. pages/index (sửa trang có sẵn): hai nút mở api-probe và map.
6. spikes/README.md: spike là gì, cách mở project trong DevEco, cách chạy trên simulator và trên đồng hồ thật.
7. spikes/results/s1-canvas-map.md: mẫu để chủ repo điền.
   - Bảng API probe (simulator | máy thật).
   - Số đo thời gian vẽ.
   - Kết quả chạy 10 phút có crash không.
   - Chỗ dán ảnh chụp.
   - Kết luận theo tiêu chí: Pass nếu vẽ 200 điểm dưới 100 ms, xoay mượt ở 1 Hz, chạy 10 phút không crash.

## Ràng buộc
- Viết JavaScript kiểu ES5 (var, function, không dùng arrow/class/template string/let/const) vì runtime lite rất hạn chế.
- Không dùng thư viện npm.
- Tiết kiệm bộ nhớ: dùng mảng số phẳng, tái sử dụng mảng, không tạo object trong vòng lặp vẽ.
- Mỗi file dưới 200 dòng. Tên file kebab-case, đặt tên nói rõ chức năng.
- Repo public: KHÔNG commit cert, .p12, .p7b, .cer, .csr, agconnect-services.*, khoá, token hay thông tin cá nhân. .gitignore đã chặn các file này, đừng sửa để bỏ chặn.
- Ngoài phạm vi: kết nối điện thoại (Wear Engine/P2P), GPS, routing thật, UI hoàn chỉnh.
- Chỗ nào không chắc API lite có hỗ trợ không: vẫn viết, bọc try/catch, ghi chú rõ trong code. Không được bịa API.

## Git
- Commit theo conventional commits (feat:, docs:, ...). Không nhắc đến AI trong commit message.
- Push branch spike/s1-canvas-map, mở PR vào main.
- Mô tả PR gồm:
  - đã làm gì;
  - cách chạy;
  - checklist chủ repo cần thử trên máy thật;
  - các giả định hoặc điểm chưa chắc về API.

## Báo cáo khi xong
Trả lời ngắn gồm:
- link PR;
- danh sách file tạo/sửa;
- các giả định;
- API nào bạn nghi ngờ không chạy trên lite wearable;
- trạng thái: DONE / DONE_WITH_CONCERNS / BLOCKED.
