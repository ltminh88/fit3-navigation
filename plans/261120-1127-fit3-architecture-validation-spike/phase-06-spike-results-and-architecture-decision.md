# Phase 06 – Tổng kết & quyết định go/no-go

## Context Links
- `spikes/results/s1..s5-*.md` · [plan.md](plan.md)

## Overview
- Ưu tiên: P0. Trạng thái: pending. Phụ thuộc Phase 02–05 (05 là tuỳ chọn).
- Gom kết quả thành một quyết định kiến trúc để anh duyệt.

## Requirements
Báo cáo `plans/reports/spike-{date}-fit3-architecture-results.md` trả lời:
1. Hiện bản đồ: M1 vector / M2 ảnh / chỉ mũi tên. Kèm ảnh chụp thật.
2. Kênh truyền: iOS P2P đạt hay không (RTT, % mất gói, phục hồi), giới hạn kích thước thật.
3. Giao thức v1: định dạng `nav`, `map`, `hb`, `hello` đã kiểm chứng. Quy tắc phiên bản.
4. Chiến lược màn hình / rung / chạy nền, dựa trên ma trận Phase 04.
5. Phương án B (GPS đồng hồ): giữ hay bỏ.
6. Tình trạng tài khoản / quyền / thời gian duyệt. Rủi ro phân phối.
7. Danh sách "bài học Fit 3" để làm checklist kiểm thử trước mỗi bản phát hành (xử lý lỗi "lên bản mới thì Fit 3 hỏng").

## Implementation Steps
1. Điền bảng câu hỏi then chốt trong `plan.md` bằng kết quả thật.
2. Viết báo cáo, đánh dấu pass/fail từng spike.
3. Cập nhật synthesis report (mục câu hỏi chưa giải quyết).
4. Trình anh duyệt → tiếp theo là `/tkm:create-plan` cho bản thiết kế chính thức (iOS app + watch app + routing Valhalla + share link Google Maps).

## Todo List
- [ ] báo cáo kết quả spike
- [ ] cập nhật synthesis
- [ ] anh duyệt quyết định

## Success Criteria
Anh chọn được kiến trúc dựa trên số đo thật, không phải giả định.

## Risk Assessment
- Spike chỉ đạt một phần → ghi rõ phần nào còn là giả định, đừng làm tròn thành "pass".

## Next Steps
Plan triển khai chính thức. Thư mục `spikes/` giữ lại làm tham khảo, không đưa vào code chính.
