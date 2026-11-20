# Phase 02 – Canvas vẽ bản đồ vector trên Fit 3 (S1)

## Context Links
- [Synthesis – mục 4b](../reports/researcher-261120-1116-fit3-navigation-research-synthesis.md)
- OpenHarmony JS canvas: https://gitcode.com/openharmony/docs/blob/OpenHarmony-4.0-Release/en/application-dev/reference/arkui-js/js-components-canvas-canvasrenderingcontext2d.md

## Overview
- Ưu tiên: P0. Trạng thái: pending. Không cần quyền Wear Engine.
- Trả lời câu hỏi quan trọng nhất của anh: **Fit 3 có hiện được bản đồ không?**

## Key Insights
- Docs JS canvas có `moveTo/lineTo/stroke`, nhưng không ghi thiết bị lite có hỗ trợ không.
- G Navigation chỉ hiện mũi tên trên Fit 3: có thể do nền tảng không cho, có thể do dev không làm.

## Requirements
- Vẽ polyline trên 480×408: tuyến chính (dày, màu nổi) + 5–10 đường phụ (mảnh, xám) + chấm vị trí.
- Xoay theo hướng đi (heading-up): xoay toạ độ bằng JS trước khi vẽ, không phụ thuộc `rotate()` của canvas.
- Dữ liệu cứng nhúng trong app: một đoạn tuyến thật ở Hà Nội / TP.HCM, khoảng 200 điểm, mã hoá delta int16.

## Architecture
```
fixture (delta int16, ~1 KB) → decode → project về pixel → rotate(heading) → clip → canvas.stroke
```
Cùng một hàm decode sẽ dùng lại ở Phase 03 khi dữ liệu đến qua P2P.

## Related Code Files
- Tạo: `spikes/watch-lite-app/` (project DevEco lite wearable), trang `pages/map/` (hml/css/js), `common/route-codec.js`, `common/fixture-route.js`.
- Tạo: `spikes/results/s1-canvas-map.md` (ảnh chụp, số đo).

## Implementation Steps
1. Trang canvas 480×408, vẽ 1 đường thẳng → chạy được trên simulator **và** trên máy thật.
2. Thử lần lượt từng API, ghi bảng có/không: `beginPath`, `moveTo`, `lineTo`, `stroke`, `lineWidth`, `lineCap/lineJoin`, `arc`, `fillText`, `rotate/translate`, `drawImage`.
3. Vẽ fixture 200 điểm + đường phụ. Đo thời gian 1 lần vẽ (Date.now trước/sau).
4. Animate heading 0→360° mỗi 1 s để xem có giật không, có rò bộ nhớ không (chạy 10 phút).
5. Nếu path không được: thử M2. Ghép ảnh PNG nhỏ (ví dụ 240×204, 16 màu) có sẵn trong app, hiện bằng `<image>`, xem có load từ `internal://app/` được không.
6. Chụp ảnh màn hình đồng hồ thật (hoặc chụp bằng điện thoại) bỏ vào kết quả.

## Todo List
- [ ] Đường thẳng đầu tiên chạy trên máy thật
- [ ] Bảng API canvas có/không
- [ ] Vẽ fixture 200 điểm + đo thời gian
- [ ] Heading-up 10 phút, không crash
- [ ] (nếu cần) Thử M2 với ảnh
- [ ] Ghi `s1-canvas-map.md`

## Success Criteria
- **Pass (M1):** vẽ 200 điểm < 100 ms, xoay mượt ở 1 Hz, chạy 10 phút không crash, đọc rõ khi giơ tay.
- **Pass một phần:** chỉ M2 chạy → bản đồ dạng ảnh, cập nhật thưa.
- **Fail:** cả hai không chạy → báo anh rằng Fit 3 chỉ hiện được mũi tên.

## Risk Assessment
- Simulator chạy mà máy thật không chạy → **chỉ tin kết quả trên máy thật**.
- Lite wearable khó lấy log → in số đo ngay lên màn hình bằng `<text>`.
- Bộ nhớ JS lite rất nhỏ → giữ mảng số nguyên, không tạo object cho từng điểm.

## Security Considerations
Không có.

## Next Steps
`route-codec.js` được dùng lại ở Phase 03. Kết quả quyết định định dạng payload bản đồ.
