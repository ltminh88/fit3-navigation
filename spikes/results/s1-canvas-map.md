# S1 — Canvas vẽ bản đồ vector trên Watch Fit 3

Mẫu kết quả để chủ repo điền sau khi chạy spike trên simulator và trên
đồng hồ thật. Code spike: `spikes/watch-lite-app/`
(trang `api-probe` và `map`, xem `spikes/README.md` để biết cách chạy).

- Ngày chạy: simulator 2026-11-20; máy thật: (chưa chạy)
- DevEco / SDK: DevEco Studio 6.1.1, SDK API 24, Previewer liteWearable (mặt tròn, không phải khung chữ nhật của Fit 3)
- Đồng hồ: Huawei Watch Fit 3, UDID đã đăng ký cert debug: (có / không)

## Bảng API probe

Điền `OK` hoặc `FAIL <lỗi>` theo đúng chữ hiện trên màn hình trang
API Probe (trang này tự in kết quả, vì lite wearable khó xem log).

| API | Simulator | Máy thật |
| --- | --- | --- |
| getContext('2d') | OK | |
| beginPath | OK | |
| moveTo | OK | |
| lineTo | OK | |
| stroke | OK | |
| closePath | OK | |
| lineWidth | OK | |
| strokeStyle | OK | |
| fillStyle | OK | |
| lineCap | OK | |
| lineJoin | OK | |
| arc | OK | |
| fill | OK (gọi được, nhưng KHÔNG vẽ gì: không thấy hình tròn tô kín) | |
| fillRect | OK | |
| clearRect | FAIL TypeError | |
| fillText | OK | |
| font | OK | |
| save/restore | OK | |
| translate | OK | |
| rotate | OK | |
| drawImage (chỉ kiểm tra có hàm, không vẽ ảnh thật) | FAIL not a function | |

Tổng OK: simulator 19/21, máy thật __/21.

Lưu ý: một số probe thuộc tính có thể hiện `OK (readback=<giá trị>)`
khi gán không ném lỗi nhưng đọc lại ra giá trị khác (vd. `#FF0000`
thay vì `#ff0000`) — đó vẫn tính là OK, không phải FAIL.

Lưu ý về fill: kiểm bằng mắt — có hình tròn tô kín cạnh chữ F hay
không. Trên Previewer, hình tròn tô kín (arc + fill ở x=200) đã
không hiện dù `fill()` không ném lỗi, nên dòng `fill: OK` chỉ có
nghĩa là gọi được, chưa chứng minh là vẽ được; nhìn hình tròn cạnh
chữ F trên canvas ở cuối trang mới biết fill có vẽ thật không.

## Số đo thời gian vẽ (trang Map)

Đọc 3 số ở góc màn hình sau khi trang Map đã chạy một lúc. Vẽ 200 điểm
(tuyến chính) + 8 đường phụ, heading tăng 10° mỗi giây.

Lưu ý: số ms đo bằng `Date.now()` chỉ là thời gian JS gửi lệnh vẽ;
lite có thể vẽ thật sau khi hàm trả về, nên phải đánh giá thêm bằng
mắt (xoay có giật/xé hình không) — số ms thấp không đủ để kết luận
mượt nếu mắt thấy giật.

| Số đo | Simulator | Máy thật |
| --- | --- | --- |
| Thời gian vẽ khung gần nhất (ms) | 0–1 ms (CPU Mac, không đại diện cho đồng hồ) | |
| Thời gian vẽ lớn nhất (ms) | 1 ms | |
| Tổng số khung đã vẽ | 169 khung liên tục (~3 phút), đếm đúng 1 khung/giây | |
| Xoay có mượt ở 1 Hz không? (có / không, mô tả) | Có xoay đúng 10°/giây. Tuyến xanh 8 px ở góc chéo bị vẽ thành chuỗi chấm tròn (răng cưa); ở góc ngang/dọc thì liền nét | |
| Đọc rõ khi giơ tay xem không? (có / không) | | |

## Độ dày tuyến chính

Bấm nút "W" trên thanh số đo của trang Map để đổi độ dày tuyến chính
theo vòng 8 → 6 → 4 → 2 → 8 (mỗi lần đổi, max ms được reset về 0 để
đo riêng cho từng độ dày). Ghi lại xem tuyến có liền nét ở góc chéo
không, và max ms đo được trên máy thật.

| lineWidth | Liền nét ở góc chéo? (simulator) | Liền nét ở góc chéo? (máy thật) | max ms (máy thật) |
| --- | --- | --- | --- |
| 8 | Không: góc chéo thành chuỗi chấm rời | | |
| 6 | Có (chỉ xem được 1 khung, cần xem thêm) | | |
| 4 | Có, liền nét ở mọi góc (12 khung) | | |
| 2 | Chưa thử | | |

## Chạy 10 phút có crash không

- Simulator: không crash trong ~3 phút (169 khung). Quay lại trang chủ rồi mở lại bản đồ: bộ đếm về #1, tức interval cũ đã dừng đúng ở onDestroy. Chưa chạy đủ 10 phút.
- Máy thật: (không crash / crash sau __ phút, mô tả)
- Có dấu hiệu rò bộ nhớ / chậm dần không? (mô tả)

## Ảnh chụp

- API Probe trên simulator:
- API Probe trên máy thật:
- Map trên simulator: video quay Previewer 2026-11-20 (38 s, giữ ở máy chủ repo, không commit)
- Map trên máy thật:

(Dán ảnh vào đây, hoặc ghi đường dẫn file ảnh trong repo.)

## Kết luận

Tiêu chí Pass (M1): vẽ 200 điểm dưới 100 ms, xoay mượt ở 1 Hz,
chạy 10 phút không crash.

- Kết quả: (Pass / Pass một phần / Fail)
- Nếu chỉ M2 (bản đồ dạng ảnh) mới chạy được thì ghi rõ ở đây.
- Ghi chú khác:
  - Simulator (2026-11-20): API vẽ đường đủ cho M1. `clearRect` không có (map dùng fillRect trắng thay thế).
    `drawImage` không có → không làm được M2 (bản đồ ảnh) bằng canvas. `fill()` không vẽ gì → hình tô kín
    phải dùng fillRect.
  - Đường dày ở góc chéo bị vỡ thành chuỗi chấm trên simulator; cần xem trên máy thật.
  - Canvas lite: `fillText(x, y)` lấy y là ĐỈNH chữ (top), không phải baseline như web — chữ trong ô đen/biển tốc độ ở trang nav-screen từng lệch xuống/mất nửa vì hiểu nhầm quy tắc này. Căn chữ giữa ô/vòng tròn phải tính `yTop = giữa - cỡ chữ/2` (xem `drawTextTop` trong `common/map-draw-helpers.js`).
