# G Navigation (iOS id6814844336) - Kiểm kê tính năng

Ngày: 2026-11-20. Mục tiêu: tham chiếu cho app điều hướng độc lập chỉ cho Huawei Watch Fit 3.
Skill: tkm:help + tkm:research đã kích hoạt; không có docs-seeker riêng, dùng WebFetch/WebSearch.

## 0. Tóm tắt hồ sơ app

| Mục | Giá trị | Nguồn |
|---|---|---|
| Dev | Dev cá nhân tại VN (artistId 6814844338) | iTunes lookup |
| Bundle | com.gnavigation.mobile | iTunes lookup |
| Phát hành | 2026-11-09; v1.2 cập nhật 2026-11-19 (app rất mới, ~11 ngày) | iTunes lookup |
| Rating | VN 4.5/52 lượt; US 4.0/1 lượt | iTunes lookup |
| Giá | Free + trial 7 ngày; "G Navigation Premium" 89.000đ mua một lần | App Store VN (WebFetch) |
| Nền tảng phone | iPhone iOS 16+ (App Store); Android qua Google Play + AppGallery; iPhone qua TestFlight được nhắc ở web dev (xung đột: App Store đã có) | gnavigation.men, /guide/ |
| Ngôn ngữ | 16 (EN FR DE HI ID IT JA KO PT RU ZH-x2 ES TH TR VI) | iTunes lookup |
| Web dev | https://gnavigation.men/ (trang rất tối giản, không liệt kê model) | WebFetch |
| Hỗ trợ | support@gnavigation.men | /guide/ |

Phát hiện quan trọng: mô tả App Store chỉ nêu **Huawei (app đồng hồ "Gnavi")** và **Amazfit Zepp OS**. Không nêu Garmin, Apple Watch, Xiaomi (review: user hỏi Xiaomi S4 "đang chờ" => chưa hỗ trợ). apkcombo (bị chặn, không đọc được) theo kết quả search nhắc Mi Fitness - chưa xác minh.

## 1. Bảng tính năng

Cột "Dòng đồng hồ": Huawei = đồng hồ ghép qua Huawei Health; Amazfit = Zepp OS. **Không có trang nào liệt kê model cụ thể** (kể cả Fit 3). Mọi dòng Huawei đều "chưa xác minh cho Fit 3".

| Tính năng | Mô tả & trải nghiệm | Dòng đồng hồ hỗ trợ | Nguồn | Mức xác minh |
|---|---|---|---|---|
| Tuyến đường xe máy / ô tô | Chọn xe máy hoặc ô tô; tự tính lại khi lệch tuyến | Phone (mọi); watch: Huawei, Amazfit | App Store desc | Xác minh (text listing); chưa test thực tế |
| Nhà cung cấp bản đồ/routing | Không nêu tên; privacy: "map service" nhận vùng nhìn thấy, "search & routing service" nhận origin/destination/vehicle | n/a | /privacy/ios/ | Xác minh là không công khai; tên provider chưa xác minh |
| Tối đa 5 điểm dừng | Thêm waypoint, kể cả khi đang chạy | Phone | Version history 1.1 | Xác minh (changelog) |
| Chỉ dẫn rẽ (turn-by-turn) | Hướng rẽ kế tiếp + tên đường + giờ đến (ETA) | Huawei, Amazfit | App Store desc | Xác minh (listing) |
| Khoảng cách tới ngã rẽ | Có hiển thị | Huawei, Amazfit | App Store desc; gnavigation.men | Xác minh (listing) |
| Chỉ báo hướng (compass/arrow) | Listing không nói riêng. Có "map xoay theo hướng đi" trên đồng hồ hỗ trợ; mũi tên rẽ ngầm hiểu | Map: "supported watches" | App Store desc | Map xoay: xác minh listing; la bàn/mũi tên riêng: chưa xác minh |
| Bản đồ trên đồng hồ | "Map that turns with you on supported watches; other watches get text directions". Web: chữ HOẶC bản đồ tùy model, OS, version app. v1.1: "smoother map on Amazfit and Huawei watches"; v1.2: "better map performance on Huawei watches". Review: user khen bản đồ trên watch, "rất chính xác" | Map: một số model Huawei/Amazfit (không nêu); còn lại text | App Store desc, version history, reviews | Xác minh có 2 chế độ; **model nào map/text: chưa xác minh** |
| Bản đồ phone | Map rõ, chế độ ngày/đêm | iPhone | App Store desc | Xác minh listing |
| GPS | Privacy: quyền "While Using" only, cập nhật location khi khoá màn hình trong chuyến đi. Nguồn GPS là của **phone** (suy luận từ "location on iPhone"; không thấy nói dùng GPS đồng hồ). v1.1: "steadier GPS" | Phone | /privacy/ios/, version history | GPS phone: suy luận mạnh; GPS watch: chưa xác minh (không có bằng chứng) |
| Rung trước mỗi ngã rẽ | "vibration before each turn"; chỉnh được kiểu rung | Huawei, Amazfit | App Store desc | Xác minh listing; chi tiết pattern chưa xác minh |
| Voice guidance (đọc to) | Thêm ở v1.2 (2026-11-19). Phát qua phone (listing "Spoken directions" thuộc mục ON YOUR IPHONE) | Phone; trên watch chưa xác minh | Version 1.2, desc | Xác minh trên phone; watch: chưa xác minh |
| Lock Screen / Dynamic Island | Chỉ dẫn hiện trên màn hình khoá và Dynamic Island (Live Activity) | iPhone | App Store desc | Xác minh listing |
| Tìm kiếm | Theo tên; 1 chạm tìm trạm xăng, trạm sạc, đổi pin, café, ATM, bãi đỗ, bệnh viện, nhà thuốc | Phone | App Store desc | Xác minh listing |
| Mở link Google Maps | Mở chỉ đường/địa điểm chia sẻ từ Google Maps (v1.1) | Phone | Version 1.1 | Xác minh changelog |
| Chọn Phone hay Watch khi Start | v1.1: nút "Phone or Watch" dưới Start | Phone | Version 1.1 | Xác minh changelog |
| Giới hạn tốc độ & camera | Hiển thị dọc tuyến, cảnh báo quá tốc | Phone; trên watch chưa xác minh | App Store desc | Xác minh listing; độ phủ VN chưa xác minh |
| Báo sự cố cộng đồng | Xem/báo kẹt xe, tai nạn, ngập; cần đăng nhập Apple/Google để đóng góp; ảnh bị xoá metadata; sự cố tự hết hạn (vài giờ) | Phone | App Store desc, /privacy/ios/ | Xác minh |
| Chia sẻ địa điểm (short link) | Lưu toạ độ/tên/địa chỉ, link sống 2 năm | Phone | /privacy/ios/ | Xác minh |
| Tuỳ biến hiển thị watch | Cỡ chữ, màu chữ, kiểu rung, các dòng thông tin | Huawei, Amazfit (không rõ model) | App Store desc | Xác minh listing; cấu hình trên phone hay watch: chưa xác minh |
| Đơn vị | Hỗ trợ miles (v1.1); km mặc định | Phone | Version 1.1 | Xác minh |
| Offline | Không có bằng chứng offline map/route. Privacy: mọi request routing/search/tiles gửi server, "answered and not kept" => cần mạng | - | /privacy/ios/ | **Suy luận: không offline**; chưa xác minh chính thức |
| Pin | Không có số liệu công khai, không review nào đề cập | - | - | chưa xác minh |
| Giá | Trial 7 ngày, sau đó 89.000đ một lần (VN); không quảng cáo | - | App Store VN | Xác minh |
| Bán tại | Cùng listing ở US/VN; web nêu Google Play, AppGallery, TestFlight | - | iTunes, web | Xác minh |

## 2. Cơ chế kết nối phone <-> watch (verified từ /guide/)

Huawei:
1. Đồng hồ ghép trong **Huawei Health**; bật Bluetooth; Huawei Health chạy nền.
2. Cài app đồng hồ qua Huawei Health > Thiết bị > chọn đồng hồ > **AppGallery** > tìm "Gnavi/G Navigation". Lỗi "không thấy app" => kiểm tra model, phiên bản Huawei OS **và vùng tài khoản** (account region).
3. Trong app phone chọn Huawei > chọn đồng hồ > cấp quyền > Start.
4. Privacy: dữ liệu hướng dẫn + bản đồ đi qua **Bluetooth và app watch của hãng**, không qua server của dev.

Amazfit: Zepp app + app store trong Zepp, cần mở app G Navigation trên watch; iPhone có nút "Mở Zepp" nếu guidance không tới (gợi ý hạn chế nền iOS).

## 3. Suy luận kỹ thuật (INFERENCE, không phải fact)

- **Fact**: có app đồng hồ riêng tên "Gnavi" cài từ AppGallery trên Huawei Health; phone gửi guidance qua Bluetooth tới app đó; app phải tương thích model/OS/vùng.
- **Suy luận (cao)**: cơ chế = watch-side app + **Wear Engine P2P** (phone SDK <-> watch app), phone là nguồn tính route + GPS, watch chỉ render. Lý do: không có server relay (privacy), cần cài app từ AppGallery, quyền "run in background" cho Huawei Health (Wear Engine bridge qua Health). Không phải notification mirroring vì có app riêng + map render.
- **Suy luận (cao)**: bản đồ trên watch là render từ phone: vector/ảnh tile đẩy qua P2P ("smoother map" thuộc changelog). Dung lượng Bluetooth hạn chế -> "text-only fallback" cho model yếu.
- **Suy luận (trung bình)**: map/text phụ thuộc loại app: Huawei full HarmonyOS (ArkTS) có thể vẽ map; lite wearable (JS, như dòng Fit/Band) khả năng text/đơn giản. Listing không xác nhận.
- Huawei Wear Engine doc (developer.huawei.com): phone app xin quyền (cá nhân chỉ được basic info + message notification, duyệt 1-2 tuần); doc liệt kê dòng WATCH FIT từ Fit 1 trở lên (theo search summary, chưa đọc trực tiếp bảng). Ghi chú: cá nhân dev chỉ xin được quyền hạn chế => P2P device-to-phone có thể cần tư cách công ty; **chưa xác minh**, cần kiểm tra trước khi thiết kế.
- iOS không có Huawei Health SDK trực tiếp cho phone app? G Navigation iOS lại nói chuyện được => có Wear Engine iOS SDK hoặc kênh khác: chưa xác minh.

## 4. Giới hạn theo model (quan trọng cho Fit 3)

- Không nguồn nào xác nhận Huawei Watch Fit 3 chạy G Navigation. **Chưa xác minh.**
- Huawei hỗ trợ riêng "collaborative navigation" của Petal Maps (phone khởi chạy, watch hiển thị, rung báo rẽ). Trang support (ca) trong fetch chỉ liệt kê Watch 3/3 Pro, không có Fit 3; kết quả search khác từng nói Fit 3 nằm trong danh sách (Health >= 11.0.9.516, Petal Maps >= 1.10.0.300) nhưng fetch trực tiếp không đọc ra => **mâu thuẫn, chưa xác minh**.
- Offline map của Huawei: danh sách model có GT 5, không có Fit 3 (theo search). Fit 3 vì vậy khó dựa vào offline native.
- Review hạn chế app thứ ba trên Fit 3 ("very limited" third-party apps - stuff.tv, qua search summary): chưa xác minh ở trang gốc.

## 5. Độ tin cậy nguồn

Cao: iTunes lookup, App Store listing (dev tự khai), /guide/ và /privacy/ chính chủ. Trung bình: review (4 review, 52 rating, app mới). Thấp: search-summary các trang Huawei (có điểm mâu thuẫn). Không tìm thấy: Reddit/YouTube/báo chí bàn về G Navigation (app quá mới; search không ra kết quả). Google Play/AppGallery listing: chỉ biết có link từ web dev, không đọc được (apkcombo bị Cloudflare Access chặn).

## 6. Khuyến nghị cho app Fit 3 (ngắn)

1. Học: UX tối giản rẽ + khoảng cách + tên đường + ETA + rung trước rẽ; trial + mua một lần; phone là nguồn GPS/route (đơn giản, tiết kiệm pin watch).
2. Làm sau: map xoay, voice, tuỳ biến, waypoint (YAGNI v1).
3. Rủi ro số 1: xác minh Fit 3 có chạy được app bên thứ ba + Wear Engine P2P, và điều kiện cấp quyền cho dev cá nhân, TRƯỚC khi chốt kiến trúc.
4. Thử trực tiếp: cài G Navigation + Gnavi trên Fit 3 thật nếu có (nguồn xác minh tốt nhất).

## Câu hỏi chưa giải quyết

- Fit 3 có trong danh sách Gnavi AppGallery? Có map hay chỉ text?
- Provider bản đồ/routing là gì (OSM/Valhalla/GraphHopper/Goong/khác)?
- Voice guidance phát trên phone hay watch? Có rung khác nhau theo hướng rẽ?
- Wear Engine: dev cá nhân gửi được P2P tới watch app không; Fit 3 thuộc lite wearable hay nền tảng hỗ trợ ArkTS?
- Ảnh hưởng pin watch/phone chưa có số liệu.
- Màn hình khoá iPhone: nền iOS giữ guidance liên tục ra sao (Amazfit cần "Mở Zepp")?
- Khác biệt Android vs iOS phone (listing nêu Android + TestFlight).

**Status:** DONE_WITH_CONCERNS
**Summary:** Kiểm kê từ iTunes API, App Store, web dev, /guide/, /privacy/. Cơ chế watch-app + Bluetooth xác minh; Wear Engine P2P là suy luận.
**Concerns/Blockers:** Không nguồn nào xác nhận Fit 3 hỗ trợ; model nào map/text chưa rõ; không có review ngoài; apkcombo/Play/AppGallery không đọc được; vài số liệu Huawei từ search summary mâu thuẫn.
