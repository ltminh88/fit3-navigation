---
title: Spike kiểm chứng kiến trúc app dẫn đường Huawei Watch Fit 3
status: pending
priority: P0
created: 2026-11-20
mode: fast (đã có nghiên cứu)
---

# Spike kiểm chứng kiến trúc – Fit 3 + iPhone

**Mục tiêu:** trả lời bằng thực nghiệm những câu hỏi quyết định kiến trúc, trước khi thiết kế chính thức. Toàn bộ code nằm ở `spikes/` và được bỏ đi sau spike.

**Đầu vào:** [synthesis](../reports/researcher-261120-1116-fit3-navigation-research-synthesis.md) · [nền tảng Fit 3](../reports/researcher-261120-1116-watch-fit3-platform-capabilities.md) · [G Navigation](../reports/researcher-261120-1116-g-navigation-feature-inventory.md)

**Thời lượng:** 1–2 ngày làm việc. Ngoài ra phải **chờ Huawei duyệt quyền Wear Engine** (1–2 tuần), nên nộp đơn ngay ngày 0.

## Các phase

| # | Phase | Spike | Ưu tiên | Phụ thuộc | Trạng thái |
|---|---|---|---|---|---|
| 01 | [Chuẩn bị tài khoản & công cụ](phase-01-setup-accounts-and-toolchain.md) | S5 | P0 | – | pending |
| 02 | [Canvas vẽ bản đồ vector trên Fit 3](phase-02-watch-canvas-vector-map-rendering.md) | S1 | P0 | 01 (cert debug) | pending |
| 03 | [P2P iPhone ↔ đồng hồ + giao thức](phase-03-ios-watch-p2p-protocol.md) | S2 | P0 | 01 (quyền Wear Engine) | pending |
| 04 | [Màn hình tắt & iOS chạy nền](phase-04-screen-off-and-ios-background-behavior.md) | S3 | P1 | 03 | pending |
| 05 | [GPS trên đồng hồ](phase-05-watch-geolocation-battery.md) | S4 | P2 (tuỳ chọn) | 02 | pending |
| 06 | [Tổng kết & quyết định go/no-go](phase-06-spike-results-and-architecture-decision.md) | – | P0 | 02–05 | pending |

Phase 02 chỉ cần cert debug, không cần quyền Wear Engine, nên **làm ngay trong lúc chờ duyệt**. Phase 05 chạy song song với 03 được.

## Câu hỏi then chốt và cách đọc kết quả

| Câu hỏi | Pass thì | Fail thì |
|---|---|---|
| S1: Canvas lite vẽ được path, xoay được? | Bản đồ vector M1 | Thử M2 (ảnh). Fail nữa thì chấp nhận chỉ có mũi tên và báo lại anh |
| S2: iOS gửi P2P ≤1 KB tới Fit 3, độ trễ p95 < 1 s? | Kiến trúc A trên iOS | Xem lại Android / thông báo template (C) |
| S3: Vẫn nhận được khi màn hình tắt / iPhone khoá? | UX giơ tay xem ngay | Thiết kế giữ sáng màn hình + rung để gọi |
| S4: GPS đồng hồ dùng được? | Mở đường cho phương án B sau này | Bỏ B, đồng hồ chỉ hiển thị |
| S5: Dev cá nhân VN được cấp quyền P2P? | Đi tiếp | **Dừng.** Cân nhắc tài khoản doanh nghiệp |

## Ràng buộc
- Chỉ nhắm Fit 3. iOS là nền tảng chính. Một người phát triển.
- Ngoài phạm vi: routing thật (Valhalla), parse link Google Maps, UI hoàn chỉnh.
- Mỗi spike ghi kết quả vào `spikes/results/sN-*.md` (số đo, ảnh chụp, pass/fail).
- Không commit cert, `.p12`, `.p7b`, client secret (thêm vào `.gitignore`).

## Kết quả cuối
`plans/reports/spike-{date}-fit3-architecture-results.md` cùng quyết định: kiến trúc nào, cách hiện bản đồ, chiến lược kết nối. Đây là đầu vào cho `/tkm:brainstorm` hoặc `/tkm:create-plan` của bản thiết kế chính thức.
