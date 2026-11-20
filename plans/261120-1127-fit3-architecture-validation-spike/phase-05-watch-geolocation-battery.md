# Phase 05 – GPS trên đồng hồ (S4, tuỳ chọn)

## Context Links
- [Nền tảng Fit 3 – GPS](../reports/researcher-261120-1116-watch-fit3-platform-capabilities.md)

## Overview
- Ưu tiên: P2. Trạng thái: pending. Không cần Wear Engine, chạy song song với Phase 03 được.
- Mục đích: biết phương án B (đồng hồ tự định vị) có đáng làm sau này không. Không chặn quyết định chính.

## Key Insights
- `@system.geolocation` bị OpenHarmony đánh dấu deprecated từ API 9. Trên lite có thể vẫn là API duy nhất.

## Requirements
- Thử `getLocation` và `subscribe`: có chạy không, cần quyền gì, mất bao lâu để có fix đầu tiên, tần suất fix, độ chính xác.
- Pin: 30 phút `subscribe` + màn hình sáng so với chỉ màn hình sáng (đã đo ở Phase 04).

## Architecture
Trang `pages/gps/` hiện lat/lon/accuracy/thời gian giữa 2 fix, kèm đếm số fix.

## Related Code Files
- Tạo: `spikes/watch-lite-app/pages/gps/`, `spikes/results/s4-watch-gps.md`.

## Implementation Steps
1. Khai báo quyền vị trí trong `config.json`, gọi `getLocation`.
2. `subscribe` 30 phút ngoài trời. Ghi thời gian có fix đầu tiên, khoảng cách trung bình giữa 2 fix, accuracy.
3. So với GPS của iPhone cùng thời điểm (ghi tay 5 điểm).
4. Đo pin.

## Todo List
- [ ] getLocation chạy / không chạy
- [ ] subscribe 30 phút: TTFF, tần suất, accuracy
- [ ] so với iPhone
- [ ] pin
- [ ] ghi `s4-watch-gps.md`

## Success Criteria
- **Pass:** fix đều ≤ 2 s, sai số ≤ 15 m, pin thêm ≤ 10%/giờ → giữ phương án B trong lộ trình.
- **Fail:** bỏ B, đồng hồ chỉ hiển thị.

## Risk Assessment
- Quyền vị trí cho app bên thứ ba có thể bị chặn → kết quả đó cũng là câu trả lời.

## Security Considerations
Dữ liệu vị trí chỉ hiện trên màn hình, không lưu.

## Next Steps
Phase 06.
