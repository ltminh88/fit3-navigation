# Giao thức P2P iPhone → Fit 3 (S2, v1)

Đặc tả này định nghĩa mọi tin nhắn giữa app iPhone (companion) và app
đồng hồ Fit 3 (lite wearable JS) qua Huawei Wear Engine P2P. Dựa trên
kết quả task-10
(`plans/reports/researcher-261120-huawei-signing-and-wear-engine-p2p.md`):
payload Wear Engine là **string** ở cả hai đầu, iOS gửi tối đa **1 KB/tin**
và không gửi file — vì vậy khung nhị phân được mã base64 trước khi gửi.

## 1. Khung tin (frame)

Mọi tin là một khung nhị phân, big-endian, rồi mã base64 thành string:

```
version(1B) | type(1B) | sessionId(2B) | seq(2B) | total(2B) | payload
```

- `version`: 1. Đồng hồ từ chối khung có version khác (xem §6).
- `type`: xem §2.
- `sessionId`: số phiên của chuyến đi (uint16, tăng mỗi lần đổi tuyến,
  quấn vòng 65536). Một sessionId mới nghĩa là tuyến mới — đồng hồ hủy
  toàn bộ trạng thái của phiên cũ.
- `seq`: số thứ tự chunk trong loại tin đó, bắt đầu từ 0.
- `total`: tổng số chunk của loại tin đó trong phiên. Tin không chia
  chunk có `seq = 0, total = 1`.
- `payload`: theo từng loại tin (§3).

Giới hạn kích thước: **mỗi tin sau base64 ≤ 1000 ký tự** (chừa biên dưới
giới hạn 1 KB của iOS). Khung nhị phân tối đa 750 byte (750 byte →
1000 ký tự base64). Chunk dữ liệu dùng payload tối đa **700 byte**
(khung 708 byte → 944 ký tự base64). Base64 tốn thêm 33% so với nhị
phân — chi phí này đã tính trong ngân sách tin (§7).

## 2. Loại tin

| Mã | Tên | Hướng | Chia chunk |
|----|-----|-------|------------|
| 0x01 | HELLO | phone → watch | không |
| 0x02 | ROUTE_CHUNK | phone → watch | có |
| 0x03 | ROADS_CHUNK | phone → watch | có |
| 0x04 | MANEUVERS | phone → watch | không |
| 0x05 | GUIDANCE | phone → watch | không |
| 0x06 | ACK | watch → phone | không |
| 0x07 | RESEND_REQUEST | watch → phone | không |
| 0x08 | END | phone → watch | không |

## 3. Payload từng loại

### HELLO — bắt đầu phiên

```
protoVersion(1B) | vehicle(1B) | nameLen(1B) | name (UTF-8)
```

- `protoVersion`: 1 (bằng version khung).
- `vehicle`: 0 = motor_scooter (xe máy), 1 = auto (ô tô).
- `name`: tên phương tiện để hiển thị, ví dụ "Xe máy" (UTF-8,
  `nameLen` ≤ 32 byte).

### ROUTE_CHUNK — tuyến đường

Payload là một lát (slice) của tuyến đã mã int16 delta theo
`route-codec.js`: mỗi điểm 2 giá trị int16 big-endian (x Đông, y Bắc,
mét, gốc = điểm xuất phát), điểm đầu tuyệt đối, các điểm sau là delta.
Tuyến Bến Thành → Đức Bà: 15 điểm = 60 byte → 1 chunk.

### ROADS_CHUNK — đường phố

Payload là một lát của luồng record đường phố nối tiếp nhau. Mỗi record:

```
level(1B) | pointCount(2B) | điểm (pointCount × 2 × int16 big-endian)
```

- `level`: 0 = minor (đường nhỏ), 1 = major (đường lớn).
- Điểm dùng cùng định dạng int16 delta như ROUTE_CHUNK (điểm đầu tuyệt
  đối theo gốc chuyến đi, các điểm sau là delta). Luồng record được cắt
  thành chunk 700 byte — một record có thể bị cắt đôi giữa hai chunk;
  phía đồng hồ ráp đủ chunk rồi mới parse record.

### MANEUVERS — các điểm rẽ

```
count(1B) | mỗi maneuver: distanceM(2B) | turn(1B) | nameLen(1B) | name (UTF-8)
```

- `distanceM`: khoảng cách từ điểm xuất phát tới điểm rẽ (mét).
- `turn`: 0 = straight, 1 = left, 2 = right, 3 = uturn, 4 = arrive.
- `name`: tên đường tại điểm rẽ (UTF-8, `nameLen` ≤ 64 byte).
- Tối đa 32 maneuver trong một tin.

### GUIDANCE — dẫn đường 1 Hz

```
x(2B int16) | y(2B int16) | heading(2B) | distToTurnM(2B) |
maneuverIndex(1B) | speedKmh(1B) | speedLimitKmh(1B)
```

11 byte payload, khung 19 byte → base64 28 ký tự (mục tiêu < 40 byte:
đạt). `heading` tính bằng 0,1 độ (0–3599, 0 = Bắc, tăng theo chiều kim
đồng hồ). `maneuverIndex` là chỉ số trong danh sách MANEUVERS (điểm rẽ
sắp tới). `speedKmh` là tốc độ hiện tại, `speedLimitKmh` là giới hạn tốc
độ (0 = không rõ).

### ACK — xác nhận đã nhận

```
ackedType(1B) | ackedSeq(2B)
```

ACK cộng dồn theo từng loại tin: "đã nhận đủ mọi seq ≤ ackedSeq của
loại ackedType". Đồng hồ gửi ACK sau mỗi chunk nhận được.

### RESEND_REQUEST — xin gửi lại

```
reqType(1B) | count(1B) | seqs (count × 2B)
```

Đồng hồ liệt kê các seq còn thiếu của loại tin `reqType`. Điện thoại
gửi lại đúng các chunk đó (cùng sessionId, seq, total như cũ).

### END — kết thúc phiên

```
reason(1B)
```

0 = đi hết tuyến, 1 = đổi tuyến (phiên mới sẽ theo sau), 2 = hủy/lỗi.

## 4. Thứ tự gửi khi bắt đầu chuyến

```
phone → HELLO
phone → ROUTE_CHUNK (0..n)
phone → ROADS_CHUNK (0..m)
phone → MANEUVERS
watch → ACK (sau mỗi chunk; cộng dồn theo loại)
phone → (gửi lại chunk thiếu nếu có RESEND_REQUEST hoặc hết timeout 2 s)
phone → GUIDANCE, 1 Hz, trong suốt chuyến đi
phone → END (khi đến nơi / đổi tuyến / hủy)
```

Điện thoại chỉ bắt đầu gửi GUIDANCE khi đã nhận ACK đủ cho ROUTE_CHUNK,
ROADS_CHUNK và MANEUVERS. Trước đó đồng hồ hiện màn hình chờ (do app
đồng hồ quyết định, không thuộc đặc tả này).

## 5. Mất / lặp / đảo thứ tự tin

- Mỗi chunk được định danh bằng (sessionId, type, seq). Đồng hồ lưu
  chunk theo seq, **bỏ qua chunk trùng** (cùng sessionId, type, seq đã
  nhận) và **chấp nhận chunk đến sai thứ tự**.
- Đồng hồ phát hiện thiếu chunk khi nhận được chunk có seq lớn hơn seq
  liên tục lớn nhất đã nhận, hoặc khi nhận MANEUVERS mà còn thiếu chunk
  ROUTE/ROADS → gửi RESEND_REQUEST liệt kê các seq thiếu.
- Điện thoại gửi lại chunk thiếu (giữ nguyên sessionId, seq, total).
  Nếu sau 2 s chưa nhận đủ ACK cho một loại tin, điện thoại tự gửi lại
  toàn bộ chunk chưa được ACK của loại đó.
- Tin GUIDANCE không cần ACK: mỗi tin tự đủ thông tin (vị trí, hướng,
  điểm rẽ sắp tới). Tin GUIDANCE cũ hơn tin đã nhận (so bằng thời gian
  đến, không có số thứ tự riêng) thì đồng hồ bỏ qua — thực tế tin đến
  sau luôn mới hơn vì chỉ có một luồng gửi 1 Hz.
- Tin thuộc sessionId cũ (sau khi đã thấy sessionId mới) bị bỏ qua.

## 6. Đổi tuyến giữa chừng và phiên bản

- Đổi tuyến: điện thoại tăng `sessionId` (uint16, quấn vòng), gửi END
  (reason = 1) cho phiên cũ (best-effort), rồi gửi lại từ HELLO với
  sessionId mới. Đồng hồ thấy sessionId mới thì hủy toàn bộ trạng thái
  phiên cũ ngay, kể cả khi chưa nhận END.
- Phiên bản: đồng hồ kiểm tra `version` khung và `protoVersion` trong
  HELLO. Khác 1 → bỏ khung, không crash; app đồng hồ hiện "Cần cập nhật
  app" (do app đồng hồ quyết định). Điện thoại cũng kiểm tra version của
  ACK/RESEND_REQUEST từ đồng hồ và bỏ qua khung khác version.

## 7. Giới hạn bộ nhớ đồng hồ

Đồng hồ lite giữ trong RAM tối đa:

| Dữ liệu | Giới hạn | Tuyến mẫu (Bến Thành → Đức Bà) |
|---------|----------|-------------------------------|
| Điểm tuyến | 64 điểm | 15 điểm |
| Đường phố | 400 đường, 1024 điểm | 363 đường, 836 điểm |
| Maneuver | 32 | 10 |
| Chunk đang ráp | theo `total` từng loại | ROUTE 1, ROADS 7 |

Điện thoại (bộ mã hóa) **không được gửi vượt giới hạn trên**. Nếu tuyến
tương lai vượt giới hạn (ví dụ đường phố quá nhiều), điện thoại phải lọc
đường theo bbox quanh tuyến trước khi mã hóa — giống bộ lọc 450 m mà
nav-screen đang dùng khi vẽ.

## 8. Ngân sách tin (tuyến mẫu)

Xem `spikes/results/s2-p2p-message-budget.md` (sinh bởi test
`spikes/tools/p2p-encoder/test-p2p.mjs`). Tóm tắt: 10 tin lúc bắt đầu
chuyến (HELLO 1, ROUTE_CHUNK 1, ROADS_CHUNK 7, MANEUVERS 1), tổng
khoảng 6,4 KB base64; GUIDANCE 28 ký tự/tin, 1 Hz.

## 9. File liên quan

- Bộ giải mã phía đồng hồ (ES5): `spikes/watch-lite-app/entry/src/main/js/MainAbility/common/p2p-frame-decoder.js`
- Bộ mã hóa phía điện thoại (Node, ES2020): `spikes/tools/p2p-encoder/encode.js`
- Test (Node): `spikes/tools/p2p-encoder/test-p2p.mjs`
- Dữ liệu tuyến mẫu: `spikes/watch-lite-app/entry/src/main/js/MainAbility/common/fixture-real-map.js`
- Định dạng int16 delta: `spikes/watch-lite-app/entry/src/main/js/MainAbility/common/route-codec.js`
