# Phase 03 – P2P iPhone ↔ đồng hồ + giao thức (S2)

## Context Links
- P2P lite (watch): https://developer.huawei.com/consumer/en/doc/connectivity-References/point-to-point-message-0000001052164296
- [Nền tảng Fit 3 – Android vs iOS](../reports/researcher-261120-1116-watch-fit3-platform-capabilities.md)

## Overview
- Ưu tiên: P0. Trạng thái: pending. Cần quyền Wear Engine đã duyệt (Phase 01).
- Chứng minh iPhone gửi được dữ liệu dẫn đường sang Fit 3 một cách ổn định. Đây là thứ G Navigation làm chưa tốt.

## Key Insights
- iOS: tối đa 1 KB mỗi gói, không gửi file, chỉ phone `ping` mở được app đồng hồ.
- Lite watch cũ hơn 10.1.3.28 cần khai báo fingerprint trong `config.json`.

## Requirements
Giao thức thử nghiệm v0, JSON gọn, mỗi gói ≤ 1 KB:
```
{"v":1,"seq":123,"t":"nav","m":"L","d":120,"s":"Ng.Trai","eta":"14:32"}
{"v":1,"seq":124,"t":"map","p":"<base64 delta int16>"}   // tuỳ kết quả Phase 02
{"v":1,"t":"hb"}  /  {"v":1,"t":"hello","app":"0.0.1"}
```
- **Gửi trạng thái đầy đủ:** mỗi gói `nav` tự đủ thông tin, mất gói không sao.
- **Phiên bản giao thức:** đồng hồ nhận `v` khác với `v` mình hỗ trợ → hiện "Cần cập nhật app", không crash.
- Heartbeat: đồng hồ không nhận gì trong N giây → hiện "Mất kết nối". Phone `ping` lại.

## Architecture
```
iOS app (Swift, Wear Engine iOS SDK)          Fit 3 (lite JS)
 GPX giả / timer ──► encode ≤1KB ──P2P──► registerReceiver ─► decode ─► render (Phase 02)
          ◄────────── ack {seq, tWatch} ◄──── send ack
```
Độ trễ: phone ghi `tSend`, đồng hồ trả `ack` cùng `seq`, phone tính RTT/2. Không cần đồng bộ đồng hồ thời gian.

## Related Code Files
- Tạo: `spikes/ios-companion/` (Xcode project SwiftUI tối giản), `spikes/watch-lite-app/common/protocol.js`, `spikes/results/s2-p2p.md`.
- Sửa: `spikes/watch-lite-app/config.json` (quyền, fingerprint).

## Implementation Steps
1. iOS: OAuth AGC → lấy device → `ping` → mở app đồng hồ.
2. Đồng hồ: `P2pClient.registerReceiver`, hiện nội dung gói lên màn hình.
3. Gửi 1 gói/s trong 10 phút, đo RTT p50/p95, tỉ lệ mất gói.
4. Thử gói 900 B, 1000 B, 1100 B để tìm giới hạn thật.
5. Gửi `map` payload từ fixture Phase 02, kiểm tra vẽ được.
6. Thử lệch phiên bản (`v:2`) → đồng hồ báo đúng.
7. Ngắt Bluetooth 30 s rồi bật lại → đo thời gian tự phục hồi.

## Todo List
- [ ] ping mở app đồng hồ từ iPhone
- [ ] nhận/hiện gói trên đồng hồ
- [ ] 10 phút 1 Hz: RTT p50/p95, % mất gói
- [ ] giới hạn kích thước thật
- [ ] payload map qua P2P
- [ ] lệch phiên bản xử lý đúng
- [ ] phục hồi sau mất Bluetooth
- [ ] ghi `s2-p2p.md`

## Success Criteria
- **Pass:** RTT p95 < 1 s, mất gói < 2%, tự phục hồi < 10 s sau khi có lại Bluetooth, 1 KB đúng như docs.
- **Fail:** không gửi được từ iOS, hoặc p95 > 3 s → báo anh, xem phương án Android / thông báo template.

## Risk Assessment
- Quyền chưa duyệt → chặn cả phase. Làm Phase 02 / 05 trong lúc chờ.
- Huawei Health trên iOS bị hệ điều hành kill → ghi nhận, đưa sang Phase 04.

## Security Considerations
- Client ID / secret AGC để trong file config bị gitignore. Payload không chứa dữ liệu cá nhân ngoài vị trí.

## Next Steps
Phase 04 dùng lại app này để thử màn hình tắt và chạy nền.
