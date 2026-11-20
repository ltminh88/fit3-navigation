# Spikes

Thư mục này chứa code thử nghiệm kiểm chứng kiến trúc, **không dùng cho
bản chính thức**. Mỗi spike trả lời một câu hỏi bằng thực nghiệm rồi bị
bỏ đi sau khi có kết quả. Kế hoạch spike:
`plans/261120-1127-fit3-architecture-validation-spike/plan.md`.

## S1 — Canvas vẽ bản đồ vector trên Watch Fit 3

Câu hỏi: canvas JS trên Fit 3 (lite wearable) có vẽ được polyline
(`moveTo`/`lineTo`/`stroke`) đủ nhanh để hiện bản đồ dẫn đường xoay
theo hướng đi không?

Code nằm trong project DevEco có sẵn ở `watch-lite-app/`:

- `entry/src/main/js/MainAbility/common/route-codec.js` — codec delta
  int16 cho tuyến đường (định dạng dùng lại ở Phase 03 cho payload P2P).
- `entry/src/main/js/MainAbility/common/fixture-route.js` — tuyến giả
  lập 200 điểm (~2,92 km, vài khúc rẽ 90° và một đoạn cong) + 8 đường phụ.
- `entry/src/main/js/MainAbility/pages/api-probe/` — gọi lần lượt từng
  API canvas trong `try/catch`, in `tên: OK` / `tên: FAIL <lỗi>` lên màn hình.
- `entry/src/main/js/MainAbility/pages/map/` — canvas 480×408, chấm vị
  trí ở (240, 290), tỉ lệ 1 px = 2 m, xoay heading-up bằng sin/cos trong
  JS (không dùng `ctx.rotate`), heading tăng 10° mỗi giây, góc màn hình
  in thời gian vẽ khung gần nhất, lớn nhất và tổng số khung.
- Trang `index` có ba nút mở ba trang trên.

Lưu ý về số đo thời gian: số ms ở trang Map đo bằng `Date.now()`
chỉ là thời gian JS gửi lệnh vẽ; lite có thể vẽ thật sau khi hàm
trả về, nên phải đánh giá thêm bằng mắt (xoay có giật/xé hình không).

Kết quả điền vào `results/s1-canvas-map.md`.

## S1b — Màn hình dẫn đường mẫu (trang nav-screen)

Câu hỏi: với các API canvas đã đo được trên Previewer (không `fill()`,
không `clearRect`, không `drawImage`, đường tối đa 6 px), màn hình dẫn
đường trên Fit 3 có thể đẹp ngang app dẫn đường thương mại không?

Code thêm trong spike S1b:

- `common/map-draw-helpers.js` — phần vẽ dùng chung tách ra từ trang
  Map (chiếu toạ độ, cắt đoạn cùng phía, vẽ polyline, vẽ đĩa tròn
  bằng arc + stroke); trang Map import lại, không copy code.
- `common/fixture-route.js` — 41 đường phụ (5 đường lớn, 36 đường nhỏ)
  với cấp đường `sideRoadLevels`, gồm lưới phố đều 120 m quanh tuyến;
  tuyến chính giữ nguyên 200 điểm.
- `common/fixture-guidance.js` — 5 bước hướng dẫn giả (tên đường tiếng
  Việt có dấu, tốc độ giới hạn, tốc độ hiện tại, khoảng cách tới biển
  kế tiếp); chỉ còn dùng cho biển tốc độ giả ở S1c (xem dưới).
- `common/route-follow-simulator.js` — mô phỏng đi dọc tuyến,
  nội suy vị trí theo quãng đường đã đi, heading là hướng đoạn đang
  đi làm mượt tối đa 30°/giây; tốc độ và chế độ quay lại đầu tuyến
  đặt được theo phương tiện (xe máy 8 m/s, ô tô 10 m/s, dừng ở cuối
  tuyến thay vì quay lại ngay).
- `common/route-maneuver-extractor.js` — tính sẵn điểm rẽ của tuyến
  giả (hướng đổi > 30°, trái/phải theo dấu tích có hướng; đoạn cong gộp
  thành 1 điểm rẽ ở cuối đoạn cong): 8 điểm rẽ trên tuyến fixture.
  Trang nav-screen không dùng nữa từ S1c (lời dẫn lấy từ fixture thật).
- `pages/nav-screen/` — canvas 480×408, tỉ lệ 1 px = 1 m: nền be `#F2EFE9`, đường lớn
  viền cam `#E8A33D` lõi vàng `#F9D56E`, đường nhỏ viền `#DADADA` lõi trắng,
  tuyến chính xanh `#2F7CF6` 6 px, chấm vị trí xanh viền trắng ở
  (240, 200), tên đường góc trên phải, giờ `HH:MM` + `XM`/`OTO`
  góc trên giữa (chạm vào giờ để đổi phương tiện), biển tốc độ góc
  trên trái, khung đen 130 px dưới đáy với icon rẽ (canvas 56×56
  riêng), khoảng cách vàng 38 px và tên đường chỉ dẫn trắng 26 px.
  Số ms vẽ một khung + số đường đã vẽ hiện nhỏ ở góc dưới trái vùng
  bản đồ (`<ms>ms <n>r`, sẽ bỏ ở bản thật).

## S1c — Bản đồ thật (OpenStreetMap) + tuyến thật (Valhalla)

Câu hỏi: giao diện nav-screen có còn đúng khi dùng dữ liệu thật
không — tuyến chạy đúng trên đường thật, lời dẫn và tên đường thật,
và dữ liệu nặng bao nhiêu byte (đầu vào thiết kế P2P iPhone → đồng
hồ, mỗi tin <= 1 KB)?

- `tools/real-map-fixture/` — script Node (không npm ngoài) tải tuyến
  Chợ Bến Thành → Nhà thờ Đức Bà từ Valhalla (xe máy `motor_scooter`,
  ô tô `auto`) và đường phố từ Overpass, chiếu phẳng cục bộ, đơn giản
  hoá Douglas–Peucker (tuyến 1 m, đường 2 m), xuất fixture + thống kê
  byte. Chạy: `node spikes/tools/real-map-fixture/build-real-map-fixture.js`.
- `common/fixture-real-map.js` + `common/fixture-real-map-roads.js` —
  file sinh tự động (không sửa tay): 2 tuyến (mỗi tuyến 1772 m,
  10 maneuver), 193 đường lớn + 170 đường nhỏ (836 điểm sau đơn giản
  hoá, 3344 byte int16 = 4 tin 1 KB). Bản đồ: © OpenStreetMap
  contributors (ODbL).
- `common/real-map-loader.js` — giải mã fixture thật lúc onInit.
- `common/nav-hud.js` — vẽ biển tốc độ + icon rẽ của trang nav-screen.
- Trang nav-screen dùng fixture thật thay tuyến giả/lưới giả (file cũ
  giữ lại cho trang Map). Biển tốc độ và 2 ô đen vẫn là dữ liệu giả
  (chưa có giới hạn tốc độ thật trong fixture).

Thoát trang nav-screen: **chạm 1 lần vào khung đen dưới đáy** (không
có nút riêng) — trang sẽ về trang chủ. Trang này cũng là phép thử
font của lite: xem dấu tiếng Việt và cỡ chữ 38/26 px có hiện đúng
không trên Previewer/máy thật.

## Mở project trong DevEco Studio

1. Cài DevEco Studio 6.1.1 (SDK API 24) — bản đã kiểm tra có template
   `[Lite]Empty Ability` (FA model, JS, deviceType `liteWearable`) và
   previewer liteWearable. Không chọn template `Wearable` (ArkTS/Stage,
   chỉ dành cho đồng hồ cao cấp, Fit 3 không chạy được).
2. Mở thư mục `spikes/watch-lite-app/` bằng DevEco Studio (Open).
   Đường dẫn project **không được có dấu cách**.
3. Bundle của app là `com.ltminh88.fitnav`
   (`entry/src/main/config.json`). Không commit cert, `.p12`, `.p7b`,
   `.cer`, `.csr` hay `agconnect-services.*` — `.gitignore` đã chặn.

## Chạy trên simulator

1. Trong DevEco, mở Previewer, chọn thiết bị liteWearable (màn hình
   480×408) rồi Run.
2. Mở trang **API Probe** trước: ghi lại bảng OK/FAIL trên màn hình.
3. Mở trang **Ban do**: xem tuyến chính, đường phụ và chấm vị trí có
   vẽ được không, heading có xoay không, đọc 3 số thời gian ở góc màn hình.
4. Lưu ý: **simulator chạy được không có nghĩa là máy thật chạy được** —
   chỉ tin kết quả trên máy thật.

## Chạy trên đồng hồ thật (Fit 3)

1. Cần cert debug đã đăng ký UDID của Fit 3 (lấy UDID qua DevEco
   Assistant / Huawei Health), theo Phase 01.
2. Kết nối Fit 3, chọn thiết bị thật trong DevEco, Run để cài app debug.
3. Chạy lại đúng hai trang như trên simulator, ghi kết quả vào
   `results/s1-canvas-map.md` (bảng API, số đo thời gian, 10 phút
   có crash không, ảnh chụp màn hình).
4. Tiêu chí Pass (M1): vẽ 200 điểm dưới 100 ms, xoay mượt ở 1 Hz,
   chạy 10 phút không crash, đọc rõ khi giơ tay xem.

## Ngoài phạm vi của spike này

Kết nối điện thoại (Wear Engine/P2P), GPS, routing thật, UI hoàn chỉnh.
