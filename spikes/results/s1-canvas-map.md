# S1 — Canvas vẽ bản đồ vector trên Watch Fit 3

Mẫu kết quả để chủ repo điền sau khi chạy spike trên simulator và trên
đồng hồ thật. Code spike: `spikes/watch-lite-app/`
(trang `api-probe` và `map`, xem `spikes/README.md` để biết cách chạy).

- Ngày chạy:
- DevEco / SDK:
- Đồng hồ: Huawei Watch Fit 3, UDID đã đăng ký cert debug: (có / không)

## Bảng API probe

Điền `OK` hoặc `FAIL <lỗi>` theo đúng chữ hiện trên màn hình trang
API Probe (trang này tự in kết quả, vì lite wearable khó xem log).

| API | Simulator | Máy thật |
| --- | --- | --- |
| getContext('2d') | | |
| beginPath | | |
| moveTo | | |
| lineTo | | |
| stroke | | |
| closePath | | |
| lineWidth | | |
| strokeStyle | | |
| fillStyle | | |
| lineCap | | |
| lineJoin | | |
| arc | | |
| fill | | |
| fillRect | | |
| clearRect | | |
| fillText | | |
| font | | |
| save/restore | | |
| translate | | |
| rotate | | |
| drawImage (chỉ kiểm tra có hàm, không vẽ ảnh thật) | | |

Tổng OK: simulator __/21, máy thật __/21.

Lưu ý: một số probe thuộc tính có thể hiện `OK (readback=<giá trị>)`
khi gán không ném lỗi nhưng đọc lại ra giá trị khác (vd. `#FF0000`
thay vì `#ff0000`) — đó vẫn tính là OK, không phải FAIL.

## Số đo thời gian vẽ (trang Map)

Đọc 3 số ở góc màn hình sau khi trang Map đã chạy một lúc. Vẽ 200 điểm
(tuyến chính) + 8 đường phụ, heading tăng 10° mỗi giây.

Lưu ý: số ms đo bằng `Date.now()` chỉ là thời gian JS gửi lệnh vẽ;
lite có thể vẽ thật sau khi hàm trả về, nên phải đánh giá thêm bằng
mắt (xoay có giật/xé hình không) — số ms thấp không đủ để kết luận
mượt nếu mắt thấy giật.

| Số đo | Simulator | Máy thật |
| --- | --- | --- |
| Thời gian vẽ khung gần nhất (ms) | | |
| Thời gian vẽ lớn nhất (ms) | | |
| Tổng số khung đã vẽ | | |
| Xoay có mượt ở 1 Hz không? (có / không, mô tả) | | |
| Đọc rõ khi giơ tay xem không? (có / không) | | |

## Chạy 10 phút có crash không

- Simulator: (không crash / crash sau __ phút, mô tả)
- Máy thật: (không crash / crash sau __ phút, mô tả)
- Có dấu hiệu rò bộ nhớ / chậm dần không? (mô tả)

## Ảnh chụp

- API Probe trên simulator:
- API Probe trên máy thật:
- Map trên simulator:
- Map trên máy thật:

(Dán ảnh vào đây, hoặc ghi đường dẫn file ảnh trong repo.)

## Kết luận

Tiêu chí Pass (M1): vẽ 200 điểm dưới 100 ms, xoay mượt ở 1 Hz,
chạy 10 phút không crash.

- Kết quả: (Pass / Pass một phần / Fail)
- Nếu chỉ M2 (bản đồ dạng ảnh) mới chạy được thì ghi rõ ở đây.
- Ghi chú khác:
