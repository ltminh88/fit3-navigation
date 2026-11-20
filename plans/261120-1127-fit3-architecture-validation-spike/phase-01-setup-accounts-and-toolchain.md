# Phase 01 – Chuẩn bị tài khoản & công cụ (S5)

## Context Links
- [Nền tảng Fit 3 – mục quyền & phân phối](../reports/researcher-261120-1116-watch-fit3-platform-capabilities.md)
- Wear Engine intro: https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585

## Overview
- Ưu tiên: P0. Trạng thái: pending.
- Lập tài khoản, ký số, công cụ và **nộp đơn xin quyền Wear Engine ngay ngày 0**, vì Huawei duyệt mất 1–2 tuần.

## Key Insights
- Hai trang Huawei mâu thuẫn nhau: một trang nói cá nhân xin được P2P, trang kia nói chỉ được device info + notification. G Navigation (dev cá nhân VN) có vẻ đã làm được → khả năng cao là được.
- Package name của app đồng hồ phải ≤ 28 ký tự.
- Wear Engine trên iOS cần OAuth qua AppGallery Connect, và chỉ test được trên máy thật.

## Requirements
- Tài khoản HUAWEI Developer cá nhân đã xác thực danh tính (Việt Nam).
- Project + app (đồng hồ, iOS) trên AppGallery Connect. Đơn xin quyền Wear Engine (P2P + device info) đã nộp.
- DevEco Studio có hỗ trợ lite wearable. Xcode + Apple Developer account (miễn phí đủ cho spike, nhưng background modes có thể cần bản trả phí; kiểm tra).
- Cert debug (.cer + .p7b) đã đăng ký UDID của Fit 3.

## Architecture
Không có. Đây là phase hành chính và công cụ.

## Related Code Files
- Tạo: `.gitignore` (thêm `*.p12`, `*.p7b`, `*.cer`, `*.csr`, `agconnect-services.*`), `spikes/README.md`, `spikes/results/s5-account-and-permission.md`.

## Implementation Steps
1. Đăng ký / xác thực HUAWEI Developer cá nhân. Ghi lại thời gian xác thực.
2. Tạo project trên AppGallery Connect. Đặt package đồng hồ ngắn (ví dụ `com.ltminh88.fitnav`), bundle iOS tương ứng.
3. Nộp đơn quyền Wear Engine: chọn P2P message + device info. Chụp màn hình form, ghi ngày nộp.
4. Cài DevEco Studio. Đã kiểm tra bản 6.1.1 (SDK API 24): có template **"[Lite]Empty Ability"** (FA model, JS, deviceType `liteWearable`), và có previewer liteWearable.
   - **Không chọn "Wearable"**: đó là ArkTS/Stage, chỉ dành cho đồng hồ cao cấp, Fit 3 không chạy được.
   - **Đường dẫn project không được có dấu cách.**
5. Tạo CSR → .cer + .p7b. Lấy UDID của Fit 3 (DevEco Assistant / Huawei Health), đăng ký vào profile debug.
6. Cài Xcode, tải Wear Engine iOS SDK (1.0.0.305 hoặc mới hơn), đọc sample.
7. Ghi toàn bộ vào `spikes/results/s5-account-and-permission.md`: thời gian từng bước, chỗ vướng, trạng thái đơn.

## Todo List
- [ ] Tài khoản dev cá nhân xác thực xong
- [ ] Project AGC + package ≤ 28 ký tự
- [ ] Đơn Wear Engine đã nộp (ghi ngày)
- [ ] DevEco Studio + template lite wearable
- [ ] Cert/profile debug có UDID của Fit 3
- [ ] Xcode + Wear Engine iOS SDK
- [ ] `.gitignore` chặn file ký số

## Success Criteria
- **Pass:** cài được 1 app "hello" ký debug lên Fit 3 thật, và đơn Wear Engine ở trạng thái đã nộp.
- **Fail / dừng:** tài khoản cá nhân VN bị từ chối quyền P2P → báo anh, cân nhắc tài khoản doanh nghiệp.

## Risk Assessment
- Chờ duyệt lâu → làm Phase 02 trước, vì nó không cần quyền này.
- Không cài được HAP debug lên đồng hồ (mẫu cộng đồng nói phải chuyển qua phone) → ghi lại đúng quy trình làm được, đây là tài liệu quý cho việc bảo trì về sau.

## Security Considerations
- Không commit cert, khoá, client secret. Lưu ngoài repo hoặc trong Keychain.

## Next Steps
- Phase 02 bắt đầu ngay khi có cert debug. Phase 03 bắt đầu khi quyền được duyệt.
