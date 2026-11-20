Repo https://github.com/ltminh88/fit3-navigation. LÀM SAU task-11 (dùng đặc tả docs/p2p-protocol.md).
Tạo branch spike/s2-ios-companion từ main, mở PR vào main.
Nhiệm vụ: khung app iPhone (SwiftUI, iOS 16+) cho spike S2 — mọi phần TRỪ việc gửi thật qua Wear Engine
(chưa có quyền, Huawei đang duyệt).

## Chức năng
1. Nhập điểm đi/đến bằng toạ độ (mặc định Chợ Bến Thành 10.77252,106.69800 → Nhà thờ Đức Bà 10.77978,106.69902),
   chọn xe máy (motor_scooter) / ô tô (auto).
2. Gọi Valhalla công khai + Overpass như spikes/tools/real-map-fixture (port logic sang Swift: chiếu toạ độ,
   Douglas–Peucker, int16 delta, phân cấp đường, maneuver → left/right/straight/uturn/arrive).
   User-Agent "fit3-navigation-spike", không gửi thông tin cá nhân, có timeout và báo lỗi.
3. Mã hoá theo docs/p2p-protocol.md thành danh sách tin (<= 1000 byte mỗi tin).
4. Giao diện: bản đồ MapKit vẽ tuyến; danh sách tin (loại, seq, byte); tổng byte; nút "Gửi thử".
5. Lớp truyền: protocol WatchLink { send(Data) ; onReceive } với 1 cài đặt LoopbackWatchLink (giải mã ngay bằng
   bộ decoder Swift và so khớp) — ghi rõ đây là cài đặt thử, KHÔNG phải giả lập kết quả thật. Để sẵn file
   HuaweiWearEngineWatchLink.swift chỉ gồm khung + TODO trỏ tới kết quả task-10 (không bịa API Huawei).
6. Bảo đảm: không commit Team ID, provisioning, agconnect, khoá. Thêm vào .gitignore nếu cần.

## Kiểm chứng
- XCTest: chiếu toạ độ + simplify cho cùng input ra kết quả khớp với fixture JS (cho phép lệch 1 m);
  encode Swift khớp byte-for-byte với encoder Node của task-11 trên cùng fixture.
- Build bằng xcodebuild nếu máy có Xcode; nếu không có macOS/Xcode thì ghi BLOCKED phần build, chủ repo sẽ build.
- Mỗi file Swift < 200 dòng, tên PascalCase theo kiểu Swift.
Thư mục: ios/Fit3NavCompanion/. README cách mở bằng Xcode.
Commit conventional, không nhắc AI. Báo cáo: link PR, cấu trúc thư mục, kết quả test, giả định, trạng thái.
