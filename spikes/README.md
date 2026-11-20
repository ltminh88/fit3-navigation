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
- Trang `index` có hai nút mở hai trang trên.

Lưu ý về số đo thời gian: số ms ở trang Map đo bằng `Date.now()`
chỉ là thời gian JS gửi lệnh vẽ; lite có thể vẽ thật sau khi hàm
trả về, nên phải đánh giá thêm bằng mắt (xoay có giật/xé hình không).

Kết quả điền vào `results/s1-canvas-map.md`.

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
