Repo https://github.com/ltminh88/fit3-navigation, tạo branch docs/huawei-setup-research từ main, mở PR vào main.
Nhiệm vụ: NGHIÊN CỨU (không viết code app), viết báo cáo tiếng Việt có dẫn nguồn để chủ repo làm Phase 01 và để thiết kế P2P.
Đọc trước: plans/261120-1127-fit3-architecture-validation-spike/phase-01-setup-accounts-and-toolchain.md,
phase-03-ios-watch-p2p-protocol.md, plans/reports/researcher-261120-1116-watch-fit3-platform-capabilities.md.

## Sự thật đã biết (chủ repo kiểm trong DevEco 6.1.1 SDK)
- Bundle đồng hồ: com.ltminh88.fitnav, project lite wearable FA/JS (template [Lite]Empty Ability), API 24.
- SDK DevEco chỉ có @hms.health.WearEngineLite.d.ts với onConnectionStateChange/offConnectionStateChange
  (theo dõi trạng thái kết nối). KHÔNG có API gửi/nhận P2P → P2P phía đồng hồ lite phải dùng SDK JS Wear Engine
  tải riêng từ Huawei (cần xác minh tên file, phiên bản, cách nhúng vào project FA/JS).
- Thực tế: app G Navigation (dev cá nhân) gửi được dữ liệu iPhone → app trên Fit 3 → quyền P2P iOS ↔ lite là có thật.

## Câu hỏi phải trả lời (mỗi câu: câu trả lời, nguồn URL, độ tin cậy cao/trung bình/thấp)
A. Tài khoản & quyền
 1. Xác thực developer cá nhân ở Việt Nam: giấy tờ cần, thời gian duyệt.
 2. Xin quyền Wear Engine: đường dẫn trang đăng ký, các quyền cần tick cho P2P + device info, tài liệu phải nộp,
    dev cá nhân có được P2P không (đối chiếu 2 nguồn Huawei mâu thuẫn trong báo cáo cũ), thời gian duyệt.
 3. Cần tạo app trên AppGallery Connect cho cả iOS lẫn đồng hồ không; fingerprint/chứng chỉ nào phải khai báo để P2P
    hai đầu nhận nhau (peer package name, fingerprint của app đồng hồ, bundle id iOS...).
B. Ký số & cài lên Fit 3 thật
 4. Cách tạo cert + profile debug cho lite wearable (DevEco auto-sign có hỗ trợ lite không, hay phải làm tay trên AGC).
 5. Cách lấy UDID của Huawei Watch Fit 3 (chính xác từng bước).
 6. Cách cài HAP debug lên Fit 3: qua DevEco trực tiếp, qua điện thoại + Huawei Health, hay chỉ qua AppGallery
    (test track)? Với iPhone (không phải Android) có cài debug được không — đây là điểm rủi ro lớn, nêu rõ.
C. P2P
 7. SDK Wear Engine phía đồng hồ lite: tên gói/file, link tải, API gửi/nhận (lớp, hàm), payload là string hay bytes,
    kích thước tối đa mỗi tin, có gửi file được không, có cần đồng hồ ở foreground không.
 8. SDK Wear Engine iOS: phiên bản mới nhất, link tải, API gửi/nhận, giới hạn 1 KB/tin (xác minh), có callback
    xác nhận đã nhận, hành vi khi iPhone khoá màn hình / app ở nền.
 9. Thông lượng thực tế cộng đồng báo (tin/giây, độ trễ) nếu có.

## Đầu ra
- plans/reports/researcher-261120-huawei-signing-and-wear-engine-p2p.md (dưới 250 dòng), cuối file có mục
  "Câu hỏi chưa trả lời được".
- plans/261120-1127-fit3-architecture-validation-spike/phase-01-setup-accounts-and-toolchain.md: cập nhật mục
  Implementation Steps thành hướng dẫn từng bước cụ thể cho chủ repo (đường dẫn trang, nút bấm), dựa trên kết quả.
- Không bịa: chỗ nào không tìm được nguồn thì ghi "chưa xác minh".
Commit conventional, không nhắc AI. Báo cáo: link PR, tóm tắt 9 câu (1 dòng mỗi câu + độ tin cậy), trạng thái.
