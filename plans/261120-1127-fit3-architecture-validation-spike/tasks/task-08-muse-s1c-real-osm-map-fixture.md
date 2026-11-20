Bạn làm việc trong repo https://github.com/ltminh88/fit3-navigation, branch spike/s1b-nav-screen-mock (PR #2).
Nhiệm vụ: spike S1c — thay dữ liệu giả của trang nav-screen bằng BẢN ĐỒ THẬT (OpenStreetMap) và TUYẾN THẬT
Chợ Bến Thành → Nhà thờ Đức Bà (TP.HCM), cho 2 phương tiện: xe máy và ô tô.
Giữ ràng buộc trên đồng hồ của task-05/06/07 (không fill/clearRect/drawImage, đường <= 6 px, fillText y = đỉnh chữ,
ES5, file < 200 dòng, không tạo object trong vòng vẽ). Trang map (S1) không đổi.

JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/

## Vì sao
Chủ repo xem video: tuyến giả cắt xuyên qua ô phố vì lưới phố sinh độc lập với tuyến → không giống dẫn đường.
Cần dữ liệu thật để: (a) đánh giá giao diện đúng, (b) đo mật độ đường thật khi vẽ trên Fit 3,
(c) biết dữ liệu nặng bao nhiêu byte (đầu vào thiết kế P2P iPhone → đồng hồ, mỗi tin <= 1 KB).

## Phần 1 — Script tạo dữ liệu (chạy trên máy dev, Node >= 18, KHÔNG chạy trên đồng hồ)
Thư mục spikes/tools/real-map-fixture/ (được dùng ES2020 ở đây, không npm ngoài; dùng fetch có sẵn của Node).
Chia file < 200 dòng, tên kebab-case, ví dụ: fetch-valhalla-route.js, fetch-osm-roads.js, project-and-simplify.js,
build-real-map-fixture.js (điểm vào). README ngắn cách chạy.
1. Điểm: Chợ Bến Thành (10.77252, 106.69800) → Nhà thờ Đức Bà (10.77978, 106.69902). Ghi toạ độ thành hằng số.
2. Tuyến: Valhalla công khai https://valhalla1.openstreetmap.de/route, polyline6, language "vi-VN",
   costing "motor_scooter" (xe máy) và "auto" (ô tô). Lấy shape + maneuvers (type, street_names, begin_shape_index,
   length). Nếu motor_scooter bị từ chối: thử "motorcycle"; vẫn lỗi thì ghi rõ trong báo cáo, KHÔNG đoán tuyến.
3. Đường phố: Overpass API https://overpass-api.de/api/interpreter, bbox = bbox của cả 2 tuyến nới thêm 400 m.
   Lấy way highway in (trunk, primary, secondary, tertiary, residential, unclassified, living_street, *_link).
   Bỏ service, footway, path, cycleway, steps, track. Phân cấp: trunk/primary/secondary = lớn; còn lại = nhỏ.
4. Chiếu toạ độ: phẳng cục bộ (equirectangular) gốc = điểm xuất phát, x Đông, y Bắc, đơn vị mét, làm tròn số nguyên,
   đảm bảo int16. Đơn giản hoá Douglas–Peucker dung sai 2 m (đường phố) và 1 m (tuyến).
5. Maneuver → loại rẽ của đồng hồ: left/right/straight/uturn (+ 'arrive'); map từ type Valhalla
   (sharp/slight gộp vào left/right; roundabout ghi chú, tạm map 'straight'). Tên đường = street_names[0] hoặc "" .
   Khoảng cách: tính theo chỉ số điểm trên tuyến ĐÃ đơn giản hoá (giữ ánh xạ chỉ số sau khi simplify).
6. Xuất JS_ROOT/common/fixture-real-map.js (ES5, export default) gồm: routes.motorbike / routes.car
   (mỗi cái: routeDelta mã hoá bằng route-codec, maneuvers [{distanceM, maneuver, streetName}], lengthM),
   roadsMajorDelta[], roadsMinorDelta[]. Đầu file: chú thích "© OpenStreetMap contributors (ODbL)", ngày tạo,
   nguồn Valhalla/Overpass, lệnh tái tạo. Nếu file > 200 dòng thì tách roads ra fixture-real-map-roads.js
   (file dữ liệu sinh tự động được phép dài hơn 200 dòng — ghi chú rõ là generated, không sửa tay).
7. Script in ra bảng thống kê và ghi vào spikes/results/s1c-real-map-data-size.md:
   số way lớn/nhỏ, tổng số điểm, số byte nếu mã hoá int16 nhị phân (2 byte/giá trị), số tin 1 KB tương ứng,
   số điểm và byte của mỗi tuyến, số maneuver mỗi tuyến, độ dài mỗi tuyến.
8. Lịch sự với dịch vụ công khai: gọi mỗi API đúng 1 lần mỗi lần chạy, header User-Agent "fit3-navigation-spike"
   (KHÔNG đưa tên/email cá nhân), có timeout, báo lỗi rõ. Không cache key/secret nào (không cần).
   Nếu máy bạn không có mạng: viết xong script, ghi BLOCKED phần chạy, chủ repo sẽ chạy rồi commit file sinh ra.

## Phần 2 — Đồng hồ (nav-screen)
1. nav-screen dùng fixture-real-map thay fixture-route/fixture-guidance/lưới giả (giữ các file cũ cho trang map).
2. Mô phỏng đi dọc tuyến thật giữ nguyên cơ chế task-07 (heading-up, làm mượt 30°/giây, chỉ vẽ phần chưa đi).
   Tốc độ giả: xe máy 8 m/s, ô tô 10 m/s. Hết tuyến: dừng 3 s ở màn hình "Đến nơi" rồi lặp lại.
3. Lời dẫn lấy từ maneuvers thật (không dùng route-maneuver-extractor nữa cho nav-screen; giữ file).
   Tên đường góc trên phải = tên đường của đoạn đang đi (streetName của maneuver vừa qua), thay cho chữ cố định.
4. Chuyển phương tiện: chạm vào giờ ở trên cùng để đổi xe máy ↔ ô tô (reset về đầu tuyến), hiện "XM"/"OTO"
   nhỏ cạnh giờ.
5. Hiệu năng: lọc trước — mỗi đường có bbox tính sẵn lúc onInit (mảng số phẳng), mỗi khung bỏ qua đường có bbox
   cách vị trí hiện tại > 450 m. Giữ số ms ở góc dưới trái; thêm số đường đã vẽ trong khung, dạng "<ms>ms <n>r".
6. Bỏ biển tốc độ giả? KHÔNG — giữ biển tốc độ và 2 ô đen như cũ (dữ liệu giả), chỉ ghi chú là giả.

## Kiểm chứng
- Test Node: script chạy ra file hợp lệ (decode được bằng route-codec, int16, maneuvers tăng dần theo distanceM),
  tuyến bắt đầu gần (0,0) và kết thúc gần toạ độ Nhà thờ Đức Bà đã chiếu.
- Đồng hồ: không fill()/clearRect/drawImage, ES5 sạch. Build hvigorw nếu có; không có thì ghi rõ.

## Git
- Commit thẳng vào spike/s1b-nav-screen-mock (conventional commits), push. Không mở PR mới. Không nhắc AI.
- README spikes: thêm mục S1c + ghi nguồn "© OpenStreetMap contributors".

## Báo cáo khi xong
- Danh sách commit; costing nào chạy được; độ dài + số maneuver mỗi tuyến; bảng thống kê byte;
  2 tuyến xe máy/ô tô có khác nhau không (vì đường một chiều); giả định mới;
  trạng thái DONE / DONE_WITH_CONCERNS / BLOCKED.
