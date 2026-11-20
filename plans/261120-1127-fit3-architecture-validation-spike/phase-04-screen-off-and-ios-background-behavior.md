# Phase 04 – Màn hình tắt & iOS chạy nền (S3)

## Context Links
- [Phase 03](phase-03-ios-watch-p2p-protocol.md) · [Synthesis](../reports/researcher-261120-1116-fit3-navigation-research-synthesis.md)

## Overview
- Ưu tiên: P1. Trạng thái: pending. Phụ thuộc Phase 03.
- Tình huống thật khi đi xe máy: iPhone khoá màn hình trong túi, màn hình đồng hồ tự tắt. Hướng dẫn có còn đến không?

## Key Insights
- Docs: `setKeepScreenOn` vẫn có trên lite (B). `OnForeground()` không dùng được trên lite. Hành vi khi app bị ẩn: chưa xác minh.
- iOS cần `UIBackgroundModes: location` + quyền "Always" / "While Using" kèm chỉ báo xanh để tiếp tục chạy khi khoá máy. G Navigation có làm được.

## Requirements
Ma trận thử (mỗi ô 5 phút, 1 gói/s, đo % gói nhận được):

| | Đồng hồ sáng (keepScreenOn) | Đồng hồ tự tắt màn hình | Đồng hồ thoát app |
|---|---|---|---|
| iPhone mở app | | | |
| iPhone khoá máy | | | |
| iPhone ở app khác (Google Maps) | | | |

## Architecture
- iOS: `CLLocationManager` (background location) giữ app sống, timer gửi gói. Thay vì GPS thật, dùng GPX giả trong Xcode.
- Đồng hồ: đếm gói nhận được, lưu bằng `@system.storage` để xem lại sau khi bật màn hình.

## Related Code Files
- Sửa: `spikes/ios-companion/` (Info.plist background modes, location manager), `spikes/watch-lite-app/pages/` (bộ đếm, keepScreenOn on/off).
- Tạo: `spikes/results/s3-background.md`.

## Implementation Steps
1. Bật background location trên iOS, xác nhận app còn gửi khi khoá máy 30 phút.
2. Điền ma trận trên.
3. Đo pin đồng hồ trong 30 phút keepScreenOn (% pin trước/sau).
4. Thử rung (`@system.vibrator`) khi có gói "sắp rẽ" lúc màn hình tắt: có rung không, có tự bật màn hình không.
5. Thử chạy thật 15 phút trên đường bằng GPS thật.

## Todo List
- [ ] background location iOS 30 phút
- [ ] ma trận 9 ô
- [ ] pin keepScreenOn 30 phút
- [ ] rung khi màn hình tắt
- [ ] chạy thật 15 phút
- [ ] ghi `s3-background.md`

## Success Criteria
- **Pass:** iPhone khoá máy + đồng hồ keepScreenOn nhận ≥ 98% gói. Pin đồng hồ ≤ 15%/giờ (ngưỡng sẽ được anh chốt lại).
- **Kết quả nào cũng có giá trị:** ma trận này quyết định UX (giữ sáng màn hình, hay rung để gọi người dùng nhìn).

## Risk Assessment
- Apple review khắt khe với background location → app thật phải là dẫn đường thật (đúng mục đích, rủi ro thấp).
- Huawei Health bị iOS kill → ghi nhận, khuyên người dùng không tắt app Health.

## Security Considerations
- Chỉ dùng vị trí trên máy, không gửi lên server trong spike.

## Next Steps
Đầu vào cho Phase 06: chiến lược giữ màn hình / rung / heartbeat.
