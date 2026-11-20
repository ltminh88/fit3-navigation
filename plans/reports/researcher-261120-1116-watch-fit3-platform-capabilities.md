# Huawei Watch Fit 3 - nền tảng cho app dẫn đường bên thứ ba

Ngày: 2026-11-20. Độ sâu: cao. Phương pháp: WebSearch + WebFetch trên developer.huawei.com, consumer.huawei.com, mẫu GitHub/Medium của Huawei dev.
Skill: `tkm:help`, `tkm:research` đã kích hoạt (không có payload riêng).

Giới hạn truy cập: trang docs developer.huawei.com là SPA, nhiều trang trả 503/404 hoặc rỗng (trang lite wearable JS API, geolocation, background, quy định package size không đọc được trực tiếp). Phần đó ghi "chưa xác minh".

Thang xác minh: **A** = trang chính thức Huawei đọc trực tiếp; **B** = trang chính thức Huawei qua snippet tìm kiếm / chính thức gián tiếp (OpenHarmony, consumer support); **C** = thứ cấp (review, Medium, dev.to, GitHub cộng đồng); **chưa xác minh**.

## 1. Kết luận nhanh

- Fit 3 có AppGallery trên đồng hồ, cài app từ Huawei Health > Devices > AppGallery (A). Có app bên thứ ba cài được: khả thi về nguyên tắc.
- Wear Engine hỗ trợ "WATCH FIT 1 and later" (A) => bao gồm Fit 3 theo bảng, nhưng Fit 3 không được nêu tên.
- Fit 3 thuộc nhóm lite wearable (LiteOS, JS/HML/CSS) là suy luận hợp lý (C): ra mắt HarmonyOS 4.2, sau lên 5.0.0.x. Docs dev không nêu tên Fit 3 => chưa xác minh chính thức.
- Phía iOS: có Wear Engine iOS SDK (1.0.0.305, A) nhưng chỉ P2P message <=1 KB/gói, KHÔNG file transfer, iOS app chỉ ping được để mở watch app, bắt buộc máy thật. Petal Maps collaborative nav của chính Huawei KHÔNG hỗ trợ iOS (A).
- Rủi ro lớn nhất, chưa xác minh được: (1) app lite JS chạy nền / tắt màn hình có nhận GPS & message không; (2) quy trình cài/ký cho user cuối khi chưa lên AppGallery; (3) cá nhân VN publish app đồng hồ lên AppGallery.
- Tiền lệ: Petal Maps trên Fit 3 chỉ có "collaborative navigation" (điện thoại tính đường, đồng hồ hiển thị), không có independent navigation (A).

## 2. Ma trận khả năng

| Khả năng | Có/Không/Hạn chế | Chi tiết | Nguồn chính thức | Mức xác minh |
|---|---|---|---|---|
| App bên thứ ba trên Fit 3 | Có | Cài qua Huawei Health > Devices > AppGallery; Fit 3 nằm trong danh sách model áp dụng. Không hỗ trợ GT 2/GT 2e. Với iPhone, mục AppGallery phải hiện trong Huawei Health | https://consumer.huawei.com/uk/support/content/en-gb16066729 | A |
| Fit 3 trong danh sách Wear Engine | Có (gián tiếp) | Bảng: "WATCH FIT series: HUAWEI WATCH FIT 1 and later" | https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585 | A (không nêu tên Fit 3) |
| OS | Hạn chế | Ra mắt HarmonyOS 4.2 (PhoneArena/Stuff); firmware 4.2.0.169 có Petal Maps; 5.0.0.12+ yêu cầu cho WeChat (Huawei support). Lite wearable 5.0 = API 12, OpenHarmony 3.2 lite/LiteOS kernel (Wikipedia). Không phải HarmonyOS NEXT đầy đủ / "smart wearable" ArkTS | https://consumer.huawei.com/cn/support/content/zh-cn15903440/ | C/B |
| Mô hình app | Hạn chế | Lite wearable: chỉ JavaScript, UI HML + CSS (Huawei Developers Medium). ArkTS wearable (DevEco 5.1, Stage model) dành cho Watch 5 loại smart; không có bằng chứng cho Fit 3 | https://developer.huawei.com/consumer/en/multidevice/wearables/get-started/ (đọc không ra nội dung) | C; ArkTS trên Fit 3: chưa xác minh |
| Màn hình | Có | 1.82" AMOLED, 480x408, 347 PPI, cảm ứng, 5ATM, BT 5.2, 9-axis IMU, PPG, ánh sáng | https://consumer.huawei.com/mm/wearables/watch-fit3/specs/ | A |
| GPS tích hợp | Có | Có GPS riêng (các review; Huawei dùng Fit 3 workout có GPS). Dual-band: không tìm thấy | specs page chỉ nhắc GPS trong điều kiện pin | C; dual-band: chưa xác minh |
| Truy cập vị trí từ app JS | Hạn chế | `@system.geolocation` / `@ohos.geolocation` có mẫu cho Lite Wearable (SDK 4.0.0 API 10, 5.0.0 API 12). d.ts OpenHarmony: `@system.geolocation` deprecated từ API 9, ghi chú default 180000 cho lite wearable. Chưa rõ độ chính xác, tần suất, pin | https://github.com/Explore-In-HMOS/sportwatch-how-to-show-user-location | C/B; accuracy/power: chưa xác minh |
| Chạy nền / giữ sáng màn hình | Chưa rõ | OpenHarmony: `OnForeground()` không dùng được trên lite device (B). `@system.brightness` `setKeepScreenOn` được duy trì cho Lite Wearable, gọi ở `onShow()` (doc CN, B). Không tìm thấy tài liệu chạy nền cho lite JS. Background mode `location` trong config là của Java/smart watch (C) | gitcode openharmony/docs js-apis-system-brightness.md | B; background lite: chưa xác minh |
| Rung | Có | `@system.vibrator`, `vibrator.vibrate({mode:'long'/'short'})`, cần `ohos.permission.VIBRATE` | gitcode openharmony/docs js-apis-system-vibrate.md | B |
| Thông báo từ phone | Có | Template notification từ phone app qua Wear Engine; cá nhân & doanh nghiệp được; package name watch app <=28 ký tự | service-introduction (bảng 2) + dev-process | A |
| Lưu trữ | Có (chi tiết thiếu) | Data Storage (key/value) + File Storage (`internal://app/`) | Huawei Medium; P2P doc | C; giới hạn dung lượng: chưa xác minh |
| Kích thước gói app | Chưa xác minh | 4 GB là trần AppGallery chung, không phải giới hạn lite | - | chưa xác minh |
| Health Kit đọc GPS real-time | Không khả thi cho nhu cầu này | REST/phone-side, user cấp quyền, "Location" là loại data, real-time trễ tùy giữ màn hình/nền; yêu cầu qualification, chi tiết chưa đọc được. Wear Engine quyền wear status/SN chỉ enterprise | https://developer.huawei.com/consumer/en/doc/HMSCore-Guides/overview-0000001177423513 | B; individual quyền: chưa xác minh |
| Phát hành AppGallery | Có (điều kiện chưa rõ) | Gửi release trong AppGallery Connect, app lite cần HAP ký release. Cá nhân vs doanh nghiệp cho app đồng hồ, giới hạn Việt Nam: chưa xác minh | dev-process: bước 8 "Release" | A (quy trình) / chưa xác minh (VN) |
| Sideload cho user cuối | Hạn chế | Chỉ có đường dev: debug cert + provision profile + UDID đăng ký (tối đa số thiết bị: chưa xác minh) rồi chuyển HAP phone -> watch bằng DevEco Assistant + Huawei Health. Không có kênh chính thức cho user thường | https://github.com/mariusbalanuca/harmonyOs-litewearable-qrcode | C |

## 3. IDE, simulator, debug trên máy thật

- DevEco Studio có Huawei Lite Wearable Simulator (mẫu SDK 2.2.0/API 6, 3.0.0/API 7; sample mới SDK 4.0.0/API 10 với DevEco 5.1.0.842) (C).
- Profile độ phân giải Fit 3 trong simulator: chưa xác minh. Dùng thử 480x408 tuỳ chọn tùy biến nếu simulator cho phép.
- Simulator không lấy hết thông tin cảm biến/vị trí; khuyên test máy thật (C).
- Máy thật (C, mẫu cộng đồng, khớp quy trình chuẩn AGC):
  1. DevEco: Build > Generate Key and CSR.
  2. AGC: tạo app Harmony; Users and Permissions > Device Management > Add Device (UDID lấy từ HUAWEI DevEco Assistant trên điện thoại, tab Lite Wearable, ghép đồng hồ qua Huawei Health).
  3. Certificate Management: upload CSR lấy .cer; HAP Provision Profile (debug) lấy .p7b.
  4. Signing Configs trong DevEco, Build HAP, chuyển HAP phone -> watch.
- Qiita (C): trên lite wearable thật không bắt được log; debug bằng simulator. Cần xác nhận lại.
- Cài từ AppGallery/Wear Engine ping yêu cầu app ID, package name khớp.

## 4. Wear Engine

Nguồn chính: https://developer.huawei.com/consumer/en/doc/connectivity-Guides/dev-process-0000001051058039 , service-introduction-0000000000018585, applying-wearengine-0000001050777982, P2P lite: https://developer.huawei.com/consumer/en/doc/connectivity-References/point-to-point-message-0000001052164296

- Phone SDK: Android (Maven). iOS SDK 1.0.0.305 (A, trang SDK). Trang giới thiệu hms/huawei-wearengine ghi "Android only" => lỗi thời / mâu thuẫn với trang iOS (A, mâu thuẫn).
- Điều kiện: đăng ký developer + xác minh danh tính, tạo app ID (HUAWEI ID service), xin dịch vụ Wear Engine (1-2 tuần duyệt; thiếu quyền => debug lỗi). Phone Huawei: EMUI 4.1 / HarmonyOS 2.0+; điện thoại khác Android 6.0-14.0 + Huawei Health đăng nhập HUAWEI ID + cho phép popup nền (A).
- Quyền: DEVICE_MANAGER và NOTIFY cho cá nhân; P2P app-to-app: bảng chính thức ghi cá nhân + doanh nghiệp đều được (A); trang apply ghi cá nhân "chỉ basic device info + notification" => mâu thuẫn nội bộ, cần thử thực tế. WEAR_USER_STATUS, DEVICE_SN: chỉ doanh nghiệp (A).
- Watch-side lite API (A): `P2pClient`: `setPeerPkgName`, `setPeerFingerPrint` (lite <10.1.3.28 khai báo `supportLists` trong config.json, <=255 ký tự), `ping` (204 chưa cài, 205 đã cài), `send` (text/file), `registerReceiver`, `unregisterReceiver`. File: `internal://app/...`. Code 208 = watch quá cũ.
- Giới hạn message: iOS 1 KB/gói, tách gói (A). Android: chưa đọc được con số chính thức; thứ cấp: file 100 MB phone->watch, 4 MB watch->phone (C, chưa xác minh).
- Foreground: trang CN (qua snippet, B) nói app đối tác và app watch phải cùng đang chạy; iOS: ping chỉ mở watch app từ phone; watch app phải đăng ký listener trước khi nhận (A).
- Sensor/monitor (kết nối, đeo, pin, nhịp tim): có trong phone SDK (A), phần lớn cần quyền, status cần enterprise.

## 5. Android vs iOS

| Tiêu chí | Android | iOS |
|---|---|---|
| Wear Engine phone SDK | Có (Maven) | Có (framework/SPM, 1.0.0.305) |
| Huawei Health | Cần, đăng nhập HUAWEI ID, cho popup nền với phone non-Huawei | Cần cài và ghép đôi |
| P2P message | Có | Có, tối đa 1 KB/gói, dùng `sendLongMessage` chia gói (C sample) |
| File transfer | Có | Không |
| Ping | Hai chiều | Chỉ phone -> mở watch app; watch không mở được phone app |
| Notification template từ phone app | Có (cá nhân được) | Không thấy tài liệu (chưa xác minh) |
| Xác thực | package name + signature fingerprint | bundle name + chuỗi bất kỳ làm fingerprint, OAuth qua AGC (Client ID/Secret, URL scheme) |
| Test | Máy thật | Chỉ máy thật, simulator không hỗ trợ |
| Nhận message khi app nền | Phụ thuộc phone vendor kill nền (Huawei khuyên thêm protected apps) (B) | iOS suspend app nền: chưa xác minh, rủi ro cao cho hướng watch->phone |
| Petal Maps collaborative nav | Có (Android 7+, Health 11.0.9.516+) | Không hỗ trợ |
| AppGallery watch | Có | Có nếu mục AppGallery hiện trong Huawei Health |

## 6. Tiền lệ

- Petal Maps: Fit 3 chỉ collaborative navigation (A: https://consumer.huawei.com/ph/support/content/en-us15954950/); independent chỉ Watch 3/4/5/Ultimate 2. Notebookcheck: firmware 4.2.0.169 thêm tính năng, không dùng được với phone OS bên thứ ba (C).
- Komoot/Strava: tích hợp qua Huawei Health, import route (review, C), không phải watch app tự do.
- Không tìm thấy app dẫn đường bên thứ ba cài từ AppGallery cho Fit 3 (chưa xác minh sự vắng mặt).
- Mẫu cộng đồng lite wearable geolocation: https://github.com/Explore-In-HMOS/sportwatch-how-to-show-user-location , https://github.com/Explore-In-HMOS/sportwatch-gmaps-calculate .

## 7. Hệ quả cho kiến trúc

| Tiêu chí | A: Phone tính tuyến, push manoeuvre qua P2P | B: Hybrid offline: phone push route (GPX/polyline file) 1 lần, watch tự khớp GPS | C: Không watch app, chỉ template notification từ phone app |
|---|---|---|---|
| Phụ thuộc | Wear Engine, Huawei Health, kết nối BT liên tục | Wear Engine file + geolocation JS lite | Wear Engine NOTIFY (Android) |
| Độ khả thi hiện biết | Cao (API P2P lite chính thức) | Trung bình (geolocation/lite bg chưa xác minh; file chỉ Android) | Cao nhưng UX kém (không UI tùy biến) |
| Phức tạp | Thấp | Cao (matching, memory, pin) | Rất thấp |
| Pin watch | Tốt (không bật GPS) | Xấu (GPS + màn hình bật) | Tốt |
| iOS | 1 KB/gói, không file, rủi ro nền | Không file => không khả thi | Chưa rõ |
| Rủi ro chính | Watch app phải foreground/đang chạy; phone kill nền | Foreground-only, không bg location đã biết | Hạn chế template, trễ |

Xếp hạng:
1. **A (khuyến nghị)**: phone tính đường (GPS điện thoại, engine route), watch JS lite là màn hình mỏng: gửi dạng JSON nhỏ (<1 KB): hướng rẽ, khoảng cách, tên đường rút gọn; watch vẽ mũi tên + `vibrator`. Dùng `ping` trước khi gửi, `setKeepScreenOn` ở `onShow`. Android trước, iOS sau.
2. **B**: chỉ làm nếu spike chứng minh watch app lite chạy được `geolocation` ổn định khi màn hình bật; dùng như fallback mất kết nối.
3. **C**: chạy song song như fallback rẻ, hoặc MVP đo trễ trước khi viết app watch (phù hợp YAGNI).

Spike bắt buộc (làm trước khi chốt, 1-2 ngày, trên máy Fit 3 thật):
- S1: "hello" lite JS app ký debug, cài lên Fit 3, nhận P2P message từ Android app.
- S2: đo tần suất/độ trễ message, hành vi khi tắt màn hình/ app ẩn, và khi phone kill nền.
- S3: `geolocation.getLocation/subscribe` trên Fit 3, tần suất fix, pin 1 giờ.
- S4: xác nhận AppGallery Connect cho phép cá nhân tại VN phát hành HAP đồng hồ + thời gian duyệt Wear Engine.
- S5 (iOS): sample iOS ping + send; thử khi iOS app ở nền.

## 8. Giới hạn nghiên cứu

- Không đọc được docs lite wearable JS (components, canvas, image formats, bộ nhớ, timeouts, package size, lifecycle) do trang SPA; mục 10, 11 trong yêu cầu chỉ có dữ liệu spec màn hình, JS-only, còn lại chưa xác minh.
- Fit 3 có phím cạnh/crown: chưa xác minh.
- Quyền Wear Engine cá nhân cho P2P: hai trang chính thức mâu thuẫn.
- Nhiều nguồn là Medium/dev.to/GitHub cộng đồng, có thể cũ (2021-2022).

## 9. Câu hỏi chưa giải quyết

1. Fit 3 có đúng là lite wearable với JS app model và API level nào (API 10/12)? Simulator có profile Fit 3 không?
2. App lite JS có nhận GPS/message khi màn hình tắt hoặc app bị ẩn không; thời hạn tối đa app sống?
3. Cá nhân tại Việt Nam có xin được Wear Engine P2P và publish app đồng hồ lên AppGallery không; thời gian duyệt?
4. Giới hạn message Android (byte) và file cho lite wearable chính thức?
5. Fit 3 dual-band GPS? độ chính xác `@system.geolocation`?
6. iOS: Wear Engine P2P với lite wearable có chạy thật không; khi iOS app ở nền có nhận được watch->phone?
7. Giới hạn dung lượng gói HAP, storage, canvas, ảnh trên lite?
8. User cuối cài bản chưa duyệt (beta) bằng cách nào ngoài debug UDID?

**Status:** DONE_WITH_CONCERNS
**Summary:** Fit 3 hỗ trợ app bên thứ ba qua AppGallery và Wear Engine (FIT 1 trở lên); khuyến nghị kiến trúc A (phone tính tuyến, watch hiển thị qua P2P) sau spike.
**Concerns/Blockers:** docs lite JS (background, geolocation, giới hạn gói) không đọc được; quyền cá nhân/VN chưa xác minh; iOS bị giới hạn 1 KB, không file.
