# p2p-encoder

Bộ mã hóa phía điện thoại cho giao thức P2P v1 (xem `docs/p2p-protocol.md`).
Node, ES2020, không cần thư viện ngoài.

- `encode.js` — thư viện mã hóa + CLI. Hàm chính: `encodeTrip(fixture, opts)`
  sinh toàn bộ tin lúc bắt đầu chuyến (HELLO, ROUTE_CHUNK, ROADS_CHUNK,
  MANEUVERS) theo đúng thứ tự gửi; `encodeGuidance` / `encodeAck` /
  `encodeResendRequest` / `encodeEnd` cho các tin còn lại. Mặc định mã
  base64 (payload Wear Engine là string); `encoding: 'binary'` trả khung
  nhị phân thô cho đường truyền hỗ trợ bytes trong tương lai.
- `test-p2p.mjs` — test: encode → decode bằng bộ giải mã thật của đồng hồ
  (`common/p2p-frame-decoder.js`) phải khớp 100% với fixture; mọi tin
  ≤ 1000 byte sau base64; mô phỏng mất 10% tin + đảo thứ tự → RESEND_REQUEST
  đúng. Chạy: `node test-p2p.mjs`. Test cũng ghi bảng ngân sách tin vào
  `spikes/results/s2-p2p-message-budget.md`.
- `messages.json` — tin đã mã cho tuyến mẫu (xe máy, sessionId 1), sinh bởi
  `node encode.js motorbike 1`. Dùng làm đối chiếu byte-for-byte cho bản
  Swift ở task-12.

Chạy CLI: `node encode.js [motorbike|car] [sessionId]`
