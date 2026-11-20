# Fit3NavCompanion — khung app iPhone (SwiftUI, iOS 16+)

App companion cho spike S2: tải tuyến từ Valhalla + đường phố từ
Overpass, mã hóa thành tin P2P theo `docs/p2p-protocol.md`, hiện lên
bản đồ MapKit. Mọi phần **trừ việc gửi thật qua Wear Engine** — quyền
Wear Engine vẫn đang chờ Huawei duyệt (xem báo cáo task-10).

## Mở bằng Xcode

- Cần Xcode 16+, iOS 16+ (deployment target 16.0).
- Mở `Fit3NavCompanion.xcodeproj`, chọn scheme **Fit3NavCompanion**,
  chạy trên iPhone thật (Wear Engine không chạy trên Simulator; bản
  thân app này thì chạy được trên Simulator vì chưa dùng Wear Engine).
- Bundle ID mặc định: `com.ltminh88.fitnav-companion`. Khi đăng ký app
  iOS trên AppGallery Connect (xem A3 trong báo cáo task-10), đổi
  bundle ID nếu cần — nhớ cập nhật cả phía đồng hồ (`setPeerPkgName`).
- Signing: Automatic, chưa gắn Development Team — Xcode sẽ hỏi team
  khi build lần đầu. **Không commit Team ID, provisioning, file
  agconnect hay khóa nào** (đã chặn trong `.gitignore` gốc của repo).

## Cấu trúc

```
Fit3NavCompanion/              (app target)
  Fit3NavCompanionApp.swift    entry point SwiftUI
  ContentView.swift            màn hình chính: nhập tọa độ, bản đồ, danh sách tin, nút "Gửi thử"
  RouteMapView.swift           MKMapView (iOS 16) vẽ tuyến + ghim đi/đến
  TripViewModel.swift          state: tải tuyến, mã hóa, gửi thử
  RouteData.swift              model dùng chung (Codable)
  GeoProjection.swift          chiếu tọa độ + Douglas-Peucker + map maneuver (port từ JS)
  Polyline6.swift              giải mã polyline6 của Valhalla
  RouteCodec.swift             codec int16 delta (port từ route-codec.js)
  ValhallaClient.swift         POST valhalla1.openstreetmap.de/route
  OverpassClient.swift         POST overpass-api.de/api/interpreter
  TripBuilder.swift            ráp tuyến + đường thành TripData
  P2PMessage.swift / P2PEncoder.swift   mã hóa theo docs/p2p-protocol.md
  P2PDecoder.swift             port bộ giải mã của đồng hồ, dùng cho loopback
  WatchLink.swift              protocol WatchLink + LoopbackWatchLink (CHỈ ĐỂ THỬ)
  HuaweiWearEngineWatchLink.swift      khung + TODO (chưa implement)
Fit3NavCompanionTests/         (test target, @testable import)
  GeoProjectionTests.swift     chiếu + simplify khớp fixture JS (lệch ≤ 1 m)
  P2PEncoderTests.swift        encode Swift khớp byte-for-byte với encoder Node
  FixtureLoader.swift          nạp fixture trong bundle test
  Fixtures/
    valhalla-motor-scooter.json  response Valhalla thật, lấy ngày 2026-11-20 (đã đông cứng)
    fixture-real-map.json        fixture JS (tuyến + đường) dạng JSON
    messages.json                output encoder Node task-11 (bản sao)
```

Mỗi file Swift < 200 dòng, tên PascalCase.

## Chạy test

Product → Test (⌘U). Hai nhóm kiểm chứng theo brief task-12:

- `GeoProjectionTests`: dùng cùng shape Valhalla 70 điểm như lúc build
  fixture JS — project + simplify (1 m) phải khớp `routeDelta` của
  fixture trong 1 m mỗi điểm; maneuver (distanceM, loại rẽ, tên đường)
  và độ dài tuyến phải khớp.
- `P2PEncoderTests`: encode Swift trên cùng fixture phải khớp
  byte-for-byte với `messages.json` của encoder Node (10 tin, mỗi tin
  ≤ 1000 byte); loopback decode phải ráp lại đúng tuyến/đường/maneuver.

## "Gửi thử" làm gì (và không làm gì)

Nút **Gửi thử** gửi từng tin đã mã qua `LoopbackWatchLink`: giải mã
ngay trên máy bằng `P2PDecoder` rồi so khớp với dữ liệu đã mã. Nó chứng
minh khung tin đúng định dạng và round-trip được. Nó **không** giả lập
Bluetooth, độ trễ, mất gói, đồng hồ thật hay Huawei Health — không được
đọc kết quả "Gửi thử" như bằng chứng gửi thật thành công.

## Gửi thật (khi có quyền)

1. Đọc C8 trong `plans/reports/researcher-261120-huawei-signing-and-wear-engine-p2p.md`
   (SDK iOS 1.0.0.305, giới hạn 1 KB/tin, không gửi file).
2. Tải SDK từ trang thư viện Huawei, thêm framework vào project.
3. Implement `HuaweiWearEngineWatchLink` theo header thật của SDK
   (không bịa tên hàm — chữ ký `WESP2PClient` chưa xác minh được).
4. Đổi `TripViewModel` sang dùng `HuaweiWearEngineWatchLink` thay cho
   `LoopbackWatchLink`.

## Regenerate fixture test

- `messages.json`: chạy `node spikes/tools/p2p-encoder/encode.js motorbike 1`
  từ gốc repo rồi chép `spikes/tools/p2p-encoder/messages.json` vào
  `Fit3NavCompanionTests/Fixtures/`.
- `fixture-real-map.json`: build lại từ `fixture-real-map.js` (xem
  `spikes/tools/real-map-fixture/`).
- `valhalla-motor-scooter.json`: response thật đã đông cứng — chỉ thay
  khi tuyến mẫu đổi, và phải kiểm tra lại `GeoProjectionTests`.

## Trạng thái build

- Logic thuần (chiếu tọa độ, codec, encoder/decoder, test) đã chạy qua
  `swift test` trên Linux bằng Swift 6.2 — xem báo cáo PR.
- Build Xcode / chạy trên iPhone thật: **BLOCKED** trên máy này (không
  có macOS/Xcode) — chủ repo build giúp.
