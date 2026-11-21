# Ngân sách tin P2P (S2)

Ngày: 2026-11-20. Tuyến mẫu: Chợ Bến Thành → Nhà thờ Đức Bà (1772 m, 15 điểm, 10 maneuver,
363 đường / 836 điểm). Xe máy, sessionId 1. Sinh bởi `spikes/tools/p2p-encoder/test-p2p.mjs`.

## Tin lúc bắt đầu chuyến

Loại tin | Số tin | Tổng byte
--- | ---: | ---:
HELLO | 1 | 24
ROUTE_CHUNK | 1 | 92
ROADS_CHUNK | 7 | 5988
MANEUVERS | 1 | 272
**Tổng** | **10** | **6376**

Thời gian gửi ước lượng: 2.0 s ở 5 tin/giây; 5.0 s ở 2 tin/giây.

## Tin trong chuyến

- GUIDANCE: 19 byte nhị phân / 28 ký tự base64 mỗi tin, gửi 1 Hz trong suốt chuyến đi.
- ACK: 11 byte nhị phân / 16 ký tự base64, đồng hồ gửi sau mỗi chunk.
- RESEND_REQUEST: 10 + 2 × (số seq thiếu) byte nhị phân, chỉ gửi khi thiếu chunk.
- END: 9 byte nhị phân / 12 ký tự base64, một tin cuối chuyến.

## Giả định

- Payload Wear Engine là string nên toàn bộ khung đi base64 (overhead 33%); giới hạn 1 KB/tin
  của iOS được giữ bằng chunk payload 700 byte (khung 708 byte → 944 ký tự base64).
- Tốc độ 5 tin/giây và 2 tin/giây chỉ là giả định để ước lượng — thông lượng thực tế của
  Wear Engine P2P chưa xác minh được (xem C9 trong báo cáo task-10).
- GUIDANCE không tính vào bảng trên (gửi liên tục 1 Hz, 28 ký tự/tin).
