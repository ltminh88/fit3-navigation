# Phase 01 – Chuẩn bị tài khoản & công cụ (S5)

## Context Links
- [Nền tảng Fit 3 – mục quyền & phân phối](../reports/researcher-261120-1116-watch-fit3-platform-capabilities.md)
- [Nghiên cứu ký số + Wear Engine P2P (2026-11-20)](../reports/researcher-261120-huawei-signing-and-wear-engine-p2p.md)
- Wear Engine intro: https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585

## Overview
- Ưu tiên: P0. Trạng thái: pending.
- Lập tài khoản, ký số, công cụ và **nộp đơn xin quyền Wear Engine ngay ngày 0**, vì Huawei duyệt mất 1–2 tuần.

## Key Insights
- Mâu thuẫn 2 trang Huawei về quyền P2P cá nhân đã giải quyết
  (2026-11-20): P2P nằm trong "basic device information" (DEVICE_MANAGER)
  mà cá nhân được xin — tick DEVICE_MANAGER là có P2P. G Navigation (dev
  cá nhân VN) có vẻ đã làm được. Rủi ro lớn nhất: cài HAP debug cần điện
  thoại Android (DevEco Assistant không có bản iOS) — xem báo cáo nghiên cứu.
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

Chi tiết đầy đủ (nguồn + độ tin cậy từng điểm): xem
`plans/reports/researcher-261120-huawei-signing-and-wear-engine-p2p.md`.

1. Xác thực tài khoản HUAWEI Developer cá nhân: chuẩn bị hộ chiếu /
   CCCD / bằng lái xe (họ tên bằng tiếng Anh, bản scan rõ) + giấy tờ ngân
   hàng (thẻ, sổ tiết kiệm, sao kê — họ tên đầy đủ bằng tiếng Anh, còn
   hiệu lực ít nhất 6 tháng). Nộp trên console developer.huawei.com;
   duyệt **1–2 ngày làm việc**, báo qua email. Danh sách giấy tờ chính
   xác theo màn hình console khi chọn Việt Nam. Không cần mã DUNS.
2. Tạo project trên AppGallery Connect: app HarmonyOS cho đồng hồ
   (package `com.ltminh88.fitnav`, ≤ 28 ký tự) + ứng dụng Wear Engine
   (iOS) theo bundle ID → lấy Client ID, Client Secret, Scheme Secret;
   cấu hình URL scheme cho callback OAuth trong Info.plist.
3. Nộp đơn quyền Wear Engine **ngay ngày 0** (duyệt 1–2 tuần): Console →
   App services > Development > Wear Engine → "Apply for Wear Engine",
   đồng ý thỏa thuận → chọn Android app → tick **DEVICE_MANAGER**
   (mang P2P) + **NOTIFY** nếu muốn gửi notification. **Không** tick
   WEAR_USER_STATUS / DEVICE_SN (chỉ doanh nghiệp). Chuẩn bị trước:
   mô tả quyền dữ liệu + cách dùng (mỗi quyền một dòng) và ảnh chụp màn
   hình đường dẫn ủy quyền của người dùng. Chỉ xin quyền cho app điện
   thoại; mặc định không cần xin cho app đồng hồ. Chụp màn hình form,
   ghi ngày nộp.
4. Cài DevEco Studio. Đã kiểm tra bản 6.1.1 (SDK API 24): có template
   **"[Lite]Empty Ability"** (FA model, JS, deviceType `liteWearable`),
   và có previewer liteWearable.
   - **Không chọn "Wearable"**: đó là ArkTS/Stage, chỉ dành cho đồng hồ
     cao cấp, Fit 3 không chạy được.
   - **Đường dẫn project không được có dấu cách.**
5. Lấy UDID của Fit 3 — **cần điện thoại Android**: cài Huawei Health,
   ghép đôi đồng hồ → cài **HUAWEI DevEco Assistant** từ AppGallery →
   tab **Lite Wearable** → **Connect** → UDID hiện trên màn hình →
   **Copy** → AppGallery Connect: Certificates, app IDs & profiles →
   Devices → Add device, dán UDID. (Lệnh `hdc shell bm get --udid`
   không dùng cho lite.)
6. Cert/profile debug (đường làm tay): DevEco Build → Generate Key and
   CSR → tạo keystore (.p12 + mật khẩu) + key alias, lưu .csr →
   AGC Certificates → New certificate → loại **debug** → upload .csr →
   tải **.cer** → Profiles → Add → loại **debug** → chọn certificate +
   thiết bị đã đăng ký → tải **.p7b** → DevEco File → Project Structure
   → Signing Configs → nhập mật khẩu keystore/key alias, upload
   .p12 + .cer + .p7b → Build → Build Hap(s) → HAP đã ký
   `entry-default-signed.hap` trong `entry\build\default\outputs\default`.
   (Checkbox "Automatically generate signature" chưa xác minh cho lite —
   thử được, lỗi thì làm tay.)
7. Cài HAP debug lên Fit 3 — **cần điện thoại Android**: chép
   `entry-default-signed.hap` vào thư mục **`haps`** trên bộ nhớ điện
   thoại → DevEco Assistant → **Apps** → Install → kiểm tra đồng hồ.
   Xem log bằng "View Logs" trong DevEco Assistant (lite không có
   hdc/hilog). Điều kiện: đồng hồ đã ghép đôi trong Huawei Health,
   Huawei Health đang chạy.
   - ⚠️ **iPhone: chưa xác minh là cài được, nhiều khả năng là không
     được** — không tìm thấy DevEco Assistant bản iOS; mọi hướng dẫn đều
     ghi điện thoại Android. Mượn/mua một điện thoại Android rẻ cho vòng
     lặp dev; đồng hồ chỉ ghép đôi một điện thoại tại một thời điểm nên
     đổi điện thoại nghĩa là ghép đôi lại.
8. Cài Xcode, tải Wear Engine iOS SDK **1.0.0.305**
   (`iOS_WearEngineSDK_1.0.0.305.zip`) từ trang thư viện SDK của Huawei
   (link tải trên trang
   `developer.huawei.com/consumer/en/doc/connectivity-Library/phone-sdk-cn-0000001656844234`),
   đọc sample
   `github.com/Explore-In-HMOS/wear-engine-ios-to-watch-file-message`.
   Lưu ý: tối đa **1 KB/tin**, không gửi file, `ping` chỉ phone → watch.
9. Tải **wearengine.js** (WearEngine-LiteWearable **5.0.2.306**) từ trang
   thư viện SDK lite
   (`developer.huawei.com/consumer/en/doc/connectivity-Library/litewearable-sdk-cn-0000001705004353`),
   chép vào project đồng hồ rồi import — file này **không có trong
   DevEco SDK** (DevEco chỉ có `@hms.health.WearEngineLite.d.ts` theo
   dõi trạng thái kết nối).
10. Ghi toàn bộ vào `spikes/results/s5-account-and-permission.md`: thời
    gian từng bước, chỗ vướng, trạng thái đơn.

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
