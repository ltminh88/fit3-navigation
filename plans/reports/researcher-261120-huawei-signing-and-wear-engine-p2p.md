# Nghiên cứu: ký số Huawei + Wear Engine P2P (Phase 01)

Ngày: 2026-11-20. Mục đích: để chủ repo làm Phase 01 và thiết kế P2P (Phase 03). Đối tượng: tài khoản HUAWEI Developer
cá nhân tại Việt Nam, app đồng hồ `com.ltminh88.fitnav` (lite wearable JS, Fit 3) + app iPhone. Phương pháp: đọc trực
tiếp trang developer.huawei.com + nguồn cộng đồng (GitHub, Medium). Độ tin cậy: **cao** = trang chính thức Huawei đọc
trực tiếp; **trung bình** = chính thức gián tiếp hoặc cộng đồng nhất quán; **thấp** = một nguồn thứ cấp. Chỗ nào không
có nguồn thì ghi "chưa xác minh", không bịa.

## Kết luận nhanh

- **Cá nhân xin được P2P.** Mâu thuẫn 2 trang Huawei đã giải quyết: P2P
nằm trong quyền "basic device information" (DEVICE_MANAGER) mà cá nhân được xin. Tick DEVICE_MANAGER (+ NOTIFY nếu
muốn), duyệt 1–2 tuần.
- **Rủi ro lớn nhất: cài HAP debug với iPhone.** Đường duy nhất có tài
liệu là qua DevEco Assistant trên điện thoại **Android**. Không tìm thấy DevEco Assistant bản iOS. Cần mượn máy
Android cho vòng lặp dev.
- **Payload là string, không phải bytes.** Đồng hồ lite nhận `text`
(string); iOS gửi tối đa **1 KB/tin**, không gửi file, có callback báo kết quả gửi (không phải ack đã nhận ở đầu đồng
hồ).

## A1. Xác thực tài khoản cá nhân tại Việt Nam — trung bình

Giấy tờ: (1) giấy tờ tùy thân — hộ chiếu, CMND/CCCD hoặc bằng lái xe (họ tên bằng tiếng Anh, bản scan/ảnh rõ); (2)
giấy tờ ngân hàng — thẻ ngân hàng, sổ tiết kiệm, giấy xác nhận mở tài khoản, sao kê hoặc giấy tờ khác do ngân hàng
cấp, có họ tên đầy đủ bằng tiếng Anh, còn hiệu lực ít nhất 6 tháng. Không cần mã DUNS (chỉ dành cho doanh nghiệp).
Thời gian duyệt: Huawei ghi **1–2 ngày làm việc**, báo qua email (một nguồn thứ cấp nói 1–3 ngày).
Nguồn: https://developer.huawei.com/consumer/en/devservice/term ·
https://developer.huawei.com/consumer/en/doc/start/atpopb-0000001062836624 ·
https://capawesome.io/blog/how-to-publish-a-capacitor-app-on-huawei-appgallery/
Chưa xác minh: danh sách giấy tờ riêng
cho Việt Nam (trang Huawei ghi chung chung — danh sách trên console mới là căn cứ).

## A2. Xin quyền Wear Engine — cao (điểm chính), trung bình (chi tiết form)

**Cá nhân xin được P2P — đã giải quyết mâu thuẫn.** Trang đăng ký ghi "Individual developers can only apply for basic
device information and message notification permissions." Nhưng Bảng 1 cùng trang, mục Basic device information
(DEVICE_MANAGER) → Communications management, liệt kê rõ "Sending P2P messages or files" và "Receiving P2P messages or
files". Trang Service Introduction chỉ để trống ô "Applicable Scope" của mục P2P — mơ hồ, không phải từ chối. Trang
tiếng Trung nói tương tự. Cá nhân thật sự không được: wearable user status (WEAR_USER_STATUS), device SN (DEVICE_SN),
cảm biến. Quyền cần tick: **DEVICE_MANAGER** (mang P2P) + **NOTIFY** nếu muốn gửi notification theo template. Không
tick WEAR_USER_STATUS / DEVICE_SN. Đường dẫn: không có URL form công khai. Sau khi đăng nhập console: App services >
Development > Wear Engine → "Apply for Wear Engine", đồng ý thỏa thuận → màn hình đăng ký quyền. Trước đó phải hoàn
thành "Registering a HUAWEI ID and Applying for the HUAWEI ID Service" (tạo app phía điện thoại, điền package name +
certificate fingerprint, lấy App ID). Lưu ý: "You need to apply for the permissions for the app on the phone. By
default, you do not need to apply for permissions for the wearable app." Tài liệu phải nộp: (a) mô tả quyền dữ liệu +
cách dùng — mỗi quyền một dòng, ghi yêu cầu/kịch bản/mục đích + cách dùng dữ liệu, kèm ảnh chụp màn hình kịch bản dùng
quyền (tùy chọn); (b) mô tả đường dẫn ủy quyền của người dùng — ảnh chụp màn hình ủy quyền + mô tả bằng chữ các bước
thao tác; chọn có hiện logo HUAWEI trên màn hình ủy quyền không. Huawei có file mẫu (".xlsx" ví dụ cho individual
developer). Thời gian duyệt: **1–2 tuần**. Lưu ý: trạng thái quyền được cache, cập nhật mỗi 24 giờ — nếu API lỗi ngay
sau khi duyệt, xóa dữ liệu Huawei Health.
Nguồn: https://developer.huawei.com/consumer/en/doc/connectivity-Guides/applying-wearengine-0000001050777982 ·
https://developer.huawei.com/consumer/en/doc/development/connectivity-Guides/service-introduction-0000000000018585 ·
https://developer.huawei.com/consumer/cn/doc/doccenter-capabilities/wearengine_apply
Chưa xác minh: nội dung trang
đăng ký bản iOS
(https://developer.huawei.com/consumer/en/doc/connectivity-Guides/applying-wearengine-ios-0000001935664117 — trang này
tải timeout, chưa đọc được).

## A3. Cần tạo app trên AppGallery Connect cho cả iOS lẫn đồng hồ? — trung bình

Có — cả hai đầu đều phải đăng ký trong AppGallery Connect, cùng tài khoản / project: phía iPhone tạo ứng dụng Wear
Engine (iOS) theo bundle ID → lấy Client ID, Client Secret, Scheme Secret; cấu hình URL scheme cho callback OAuth
trong Info.plist. Phía đồng hồ tạo app HarmonyOS trong cùng project (package `com.ltminh88.fitnav`); cert/profile
debug cấp cho app này. Hai đầu nhận nhau bằng **tên package/bundle + fingerprint**: iOS → đồng hồ dùng
`WESIdentityInfo` người gửi (bundle name + fingerprint iPhone) và người nhận (bundle name + fingerprint đồng hồ); phía
đồng hồ gọi `P2pClient.setPeerPkgName` (tên package app iPhone) và `setPeerFingerPrint` (fingerprint app iPhone).
**iPhone không có fingerprint**: "iOS apps do not have fingerprint information. You can enter any text as the
fingerprint." — fingerprint phía iOS là chuỗi tùy ý hai bên thống nhất, phía đồng hồ set `setPeerFingerPrint` bằng
đúng chuỗi đó. Quy tắc chung (FAQ Huawei): package name, app ID và certificate fingerprint phải khớp với lúc đăng ký
HUAWEI ID service.
Nguồn: https://developer.huawei.com/consumer/en/doc/connectivity-Guides/phone-send-message-ios-0000001875158886 ·
https://developer.huawei.com/consumer/en/doc/development/connectivity-References/point-to-point-message-0000001052164296
· https://github.com/Explore-In-HMOS/wear-engine-ios-to-watch-file-message ·
https://developer.huawei.com/consumer/en/doc/connectivity-Guides/faq-0000001050818031
Chưa xác minh: cách tính/lấy
fingerprint của app đồng hồ Fit 3 từ chứng chỉ ký (.cer/.p12).

## B4. Tạo cert + profile debug cho lite wearable — trung bình (làm tay), thấp (auto-sign)

Đường làm tay (có tài liệu cho lite):
1. DevEco Studio: Build → Generate Key and CSR → tạo keystore (.p12, mật
khẩu) + key alias, lưu file .csr.
2. AppGallery Connect: tạo app HarmonyOS (nếu chưa có), đăng ký UDID đồng
hồ trước (xem B5): Certificates, app IDs & profiles → Devices → Add device.
3. Certificates → New certificate → loại **debug** → upload .csr → submit →
tải **.cer**.
4. Profiles → Add → loại **debug** → chọn certificate + thiết bị đã đăng ký
→ submit → tải **.p7b**.
5. DevEco Studio: File → Project Structure → Signing Configs → nhập mật khẩu
keystore/key alias, upload .p12 + .cer + .p7b (thông tin ký lưu trong `build-profile.json5`).
6. Build → Build Hap(s)/APP(s) → Build Hap(s); HAP đã ký là
`entry-default-signed.hap` trong `entry\build\default\outputs\default`. Auto-sign: DevEco có checkbox "Automatically
generate signature" trong Signing Configs, nhưng mọi hướng dẫn cho lite đều dùng đường làm tay; auto-sign chỉ được mô
tả cho app HarmonyOS Next (Stage model). Thử auto-sign được, nếu lỗi hoặc profile không gồm đồng hồ thì quay lại làm
tay.
Nguồn: https://medium.com/huawei-developers/running-lite-wearable-apps-on-huawei-gt-devices-d4d26db1251c ·
https://github.com/megaacheyounes/harmonyos-dev-guide/blob/HEAD/signing_config.md ·
https://github.com/mariusbalanuca/harmonyos-litewearable-qrcode/blob/HEAD/README.MD
Chưa xác minh: auto-sign có chạy
cho project lite wearable FA/JS (API 24) không.

## B5. Lấy UDID của Huawei Watch Fit 3 — trung bình-cao (quy trình), trung bình (riêng Fit 3)

Các bước (từ hướng dẫn lite):
1. Cài **Huawei Health** trên điện thoại **Android**, ghép đôi đồng hồ.
2. Cài **HUAWEI DevEco Assistant** trên cùng điện thoại từ AppGallery (tìm
"HUAWEI DevEco Assistant"; nếu không thấy, cộng đồng dẫn mirror APK v1.1.3.641 / v1.2.1.900 — nguồn không chính thức,
dùng cẩn thận).
3. Mở DevEco Assistant → tab **Lite Wearable** → **Connect**. App mở Huawei
Health; Devices → Add → Smart Watch → chọn mẫu đồng hồ → PAIR, làm theo hướng dẫn.
4. Màn hình DevEco Assistant hiện tên mẫu đồng hồ và **UDID** → chạm **Copy**
để sao chép.
5. AppGallery Connect: Certificates, app IDs & profiles → Devices → Add
device, điền tên/loại, dán UDID, submit. Lưu ý: lệnh `hdc shell bm get --udid` chỉ dùng cho đồng hồ HarmonyOS đầy đủ
(ví dụ Watch 4), không áp dụng cho lite. Không có cách đọc UDID từ giao diện đồng hồ hay từ Huawei Health trên iPhone.
Nguồn: https://github.com/mariusbalanuca/harmonyos-litewearable-qrcode/blob/HEAD/README.MD ·
https://medium.com/huawei-developers/running-lite-wearable-apps-on-huawei-gt-devices-d4d26db1251c ·
https://github.com/megaacheyounes/harmonyos-dev-guide/blob/HEAD/signing_config.md
Chưa xác minh: quy trình riêng cho
Fit 3 (hướng dẫn ghi chung cho dòng GT/Fit/D/Ultimate, không nêu tên Fit 3).

## B6. Cài HAP debug lên Fit 3 thật — cao (đường Android-only), trung bình-cao (iPhone bị chặn)

Đường duy nhất có tài liệu (cần điện thoại **Android**):
1. Build HAP debug đã ký trong DevEco (xem B4).
2. Chép `entry-default-signed.hap` sang điện thoại, đặt trong thư mục
**`haps`** trên bộ nhớ điện thoại.
3. Mở **DevEco Assistant → Apps**, cài file .hap; kiểm tra đồng hồ — app
xuất hiện trong danh sách app trên đồng hồ. Xem log bằng "View Logs" trong DevEco Assistant (lite không có hdc/hilog).
Điều kiện suốt quá trình: đồng hồ đã ghép đôi trong Huawei Health, Huawei Health đang chạy. Không có tài liệu cho: cài
trực tiếp từ DevEco sang đồng hồ (lite không có USB/HDC); cài qua Huawei Health (Health chỉ cài app trên AppGallery,
không sideload HAP); kênh test track/internal-testing trên AppGallery cho HAP debug. **Rủi ro lớn — iPhone:** với
iPhone làm điện thoại ghép đôi, cài HAP debug **chưa xác minh là làm được, và nhiều khả năng là không được.** Mọi
hướng dẫn đều ghi điện thoại Android; DevEco Assistant phát hành dạng APK Android qua AppGallery, **không tìm thấy bản
iOS trên App Store**. Không có DevEco Assistant thì không có cách nào có tài liệu để (a) đọc UDID của Fit 3 (B5) hay
(b) đẩy HAP đã ký lên đồng hồ. Thêm nữa: DevEco Assistant có thể không có sẵn trên mọi máy Android (diễn đàn Huawei
2026 báo không thấy app trên điện thoại Samsung). Hệ quả thực tế: mượn/mua một điện thoại Android rẻ cho vòng lặp dev
(UDID → ký → cài → xem log), dùng iPhone chỉ cho phía app companion / P2P. Lưu ý đồng hồ chỉ ghép đôi một điện thoại
tại một thời điểm, nên đổi điện thoại nghĩa là ghép đôi lại (chưa xác minh HAP debug có còn sau khi ghép lại không —
cần thử). Đường phát hành không bị ảnh hưởng: app trên AppGallery cài được trên đồng hồ ghép iPhone qua Huawei Health
→ Devices → AppGallery → INSTALL (theo hướng dẫn sử dụng Fit 3). Tiền lệ G Navigation (dev cá nhân VN đưa được dữ liệu
iPhone → Fit 3) cho thấy tác giả đã giải quyết được khâu phân phối bằng cách nào đó, nhưng không có nguồn nào giải
thích cách làm — không được giả định là có quy trình debug chỉ-dùng-iPhone.
Nguồn: https://medium.com/huawei-developers/running-lite-wearable-apps-on-huawei-gt-devices-d4d26db1251c ·
https://github.com/gentslava/home-assistant-harmonyos-next/blob/HEAD/apps/watch-lite/README.md ·
https://forums.developer.huawei.com/forumPortal/en/topic/0201227776876038071
Chưa xác minh: HAP debug có còn sau khi
ghép đôi lại đồng hồ với điện thoại khác không; có kênh test track nào cho HAP debug lite không.

## C7. SDK Wear Engine phía đồng hồ lite — cao (gói/API), chưa xác minh (giới hạn tin)

- Gói/file: SDK là một file JS duy nhất **`wearengine.js`**, gói
**WearEngine-LiteWearable**, bản mới nhất liệt kê **5.0.2.306** (2022-02-09), SHA-256 `64130a34…59a1b56`. Tải từ trang
thư viện SDK của Huawei (link tải nằm trên trang, không trích được URL .zip trực tiếp):
https://developer.huawei.com/consumer/en/doc/connectivity-Library/litewearable-sdk-cn-0000001705004353
- Nhúng: tải file về, giải nén lấy `wearengine.js`, chép vào thư mục code của
project (`\entry\src\main\js\default\pages` theo tài liệu; mẫu cộng đồng đặt ở
`\entry\src\main\js\MainAbility\wearengine`) rồi import. Đây là file tải riêng — **không có trong DevEco SDK** (DevEco
chỉ có `@hms.health.WearEngineLite.d.ts` theo dõi trạng thái kết nối).
- API gửi/nhận (JS, `P2pClient`): `setPeerPkgName(string)` — tên package app
điện thoại; `setPeerFingerPrint(string)` — fingerprint app điện thoại (bản lite trước 10.1.3.28 không gọi được hàm
này, khai báo trong config.json); `ping(Object)` — kiểm tra app điện thoại đã cài chưa (204 = chưa cài, 205 = đã cài);
`send(Object)` — `message.builder.text` (string) cho tin nhắn, `message.builder.fileObject` cho file, callback
`onSuccess` / `onFailure` / `onSendResult` / `onSendProgress`; `registerReceiver(Object)` — `onReceiveMessage`: `data`
là **string**; file đến dưới dạng object (`isFileType`, `name` dạng `internal://app/...`), lưu trong thư mục riêng
`internal://app/`; `unregisterReceiver(Object)` — nên gọi trong/trước `onDestroy`.
- Payload: tin nhắn là **string**; file là file object. Không có tài liệu về
payload nhị phân/bytes cho API JS lite.
- Giới hạn kích thước mỗi tin phía lite: **chưa xác minh** (tài liệu tham chiếu
lite không ghi giới hạn; 1 KB chỉ được ghi ở phía iOS — xem C8). Thiết kế tạm lấy 1 KB làm giới hạn cả hai đầu.
- File: có — hỗ trợ cả hai chiều về nguyên tắc (5.0.0.300 thêm P2P message +
file từ app điện thoại sang app lite; 5.0.2.300 thêm đường dẫn tương đối `internal://app/`). Lưu ý phía iOS không gửi
được file (C8), nên chuyển file sang đồng hồ chỉ làm được từ app Android.
- Foreground: có, thực tế là bắt buộc. App đồng hồ phải đang chạy và đã đăng
ký receiver: điện thoại có thể `ping` để mở app đồng hồ, nhưng tin gửi khi app đồng hồ chưa chạy sẽ không được nhận
(không có tài liệu về hàng đợi). App lite không chạy nền.
Nguồn: https://developer.huawei.com/consumer/en/doc/development/connectivity-References/point-to-point-message-0000001052164296 ·
https://developer.huawei.com/consumer/en/doc/connectivity-Guides/integrating-fitnesstwatch-sdk-0000001052859174 ·
https://developer.huawei.com/consumer/en/doc/connectivity-Library/litewearable-sdk-cn-0000001705004353 ·
https://github.com/Explore-In-HMOS/sportwatch-wear-engine-lite-wearable-to-mobile/blob/HEAD/README.md

## C8. SDK Wear Engine iOS — cao (bản/giới hạn/file), chưa xác minh (nền/khóa màn hình)

- Bản mới nhất: **1.0.0.305**, file `iOS_WearEngineSDK_1.0.0.305.zip`, SHA-256
`5f3da987…7732f1`. Trang tải (link nằm trên trang, không trích được URL .zip trực tiếp):
https://developer.huawei.com/consumer/en/doc/connectivity-Library/phone-sdk-cn-0000001656844234
- API: `HiWear.getP2PClient` → **`WESP2PClient`** ("Client for P2P
communication"). Luồng gửi: tạo `WESIdentityInfo` người gửi (bundle name + fingerprint iPhone — chuỗi tùy ý) và người
nhận (bundle name + fingerprint đồng hồ); tạo `WESP2PMessage` (+ `WESP2PData`/TLV qua `TLVDataCmm` nếu dùng định dạng
TLV); gọi `send` trên P2PClient. Nhận: `getP2pClient` + `registerReceiver`; dừng bằng `unRegisterReceiver`. `ping` chỉ
chạy phone → watch, và có thể mở app đồng hồ.
- Giới hạn **1 KB/tin — đã xác minh**: "The maximum size of a message is 1 KB.
If the length of a message exceeds the limit, divide the message into several packets."
- Callback xác nhận gửi: có — callback trả về kết quả gửi,
`WESErrorCodeCommSuccess` là thành công, mã khác là lỗi. Đây là kết quả gửi tới dịch vụ Wear Engine, **không** được
ghi là ack đầu-cuối rằng app đồng hồ đã xử lý tin.
- File: **không**. "The iOS Wear Engine SDK only supports P2P message
communications between the phone and the watch, but not file transfers."
- iPhone khóa màn hình / app ở nền: **chưa xác minh** trong bất kỳ nguồn nào.
Chỉ biết: phải cài Huawei Health trên iPhone (iOS 13+); ủy quyền nhảy sang app Huawei Health rồi quay lại qua URL
scheme; mã lỗi 9 (`WESErrorCodeUserUnauthorizedWearEngine`) là chưa/không còn ủy quyền; iOS Simulator không hỗ trợ kết
nối Wear Engine. Phải thử thực tế (app nền có gửi được theo timer/cập nhật vị trí không, tin watch → phone có đánh
thức app không).
Nguồn: https://developer.huawei.com/consumer/en/doc/connectivity-Guides/phone-send-message-ios-0000001875158886 ·
https://developer.huawei.com/consumer/en/doc/connectivity-Library/phone-sdk-cn-0000001656844234 ·
https://developer.huawei.com/consumer/en/doc/connectivity-References/we-ios-wesp2pclient-overview-0000001937678949 ·
https://github.com/Explore-In-HMOS/wear-engine-ios-to-watch-file-message
Chưa xác minh: chữ ký phương thức chính xác
của `WESP2PClient` (trang class chính thức là SPA không đọc được nội dung; tên wrapper `sendMessage` /
`sendLongMessage` trong mẫu cộng đồng chưa xác minh có phải tên phương thức chính thức không).

## C9. Thông lượng thực tế — chưa xác minh

Không tìm thấy con số nào về thông lượng (tin/giây) hay độ trễ (ms) cho P2P Wear Engine trong tài liệu Huawei hay
nguồn cộng đồng đã tìm. Chỉ có một dữ kiện về đường truyền: giao tiếp phone ↔ đồng hồ đi qua **Bluetooth (giao thức
độc quyền)** qua app Huawei Health. Vì vậy thiết kế chỉ dựa được vào giới hạn 1 KB/tin và nhu cầu chia gói: gửi tin
nhỏ, không thường xuyên (mỗi điểm rẽ một tin gọn, không stream liên tục), đo độ trễ/thông lượng thực tế khi kênh P2P
chạy được. Không được giả định bất kỳ con số thông lượng nào.
Nguồn: https://developer.huawei.com/consumer/en/doc/development/connectivity-Guides/service-introduction-0000000000018585

## Câu hỏi chưa trả lời được

1. Danh sách giấy tờ xác thực riêng cho Việt Nam (chỉ có yêu cầu chung của
Huawei; danh sách trên console mới là căn cứ).
2. Nội dung trang đăng ký Wear Engine bản iOS (tải timeout, chưa đọc được).
3. Chữ ký phương thức chính xác của `WESP2PClient` (trang class là SPA trống;
tên `sendMessage`/`sendLongMessage` trong mẫu chưa xác minh).
4. Cách tính/lấy fingerprint của app đồng hồ Fit 3 từ chứng chỉ ký.
5. DevEco "Automatically generate signature" có chạy cho project lite
wearable FA/JS không.
6. Quy trình lấy UDID riêng cho Fit 3 (hướng dẫn ghi chung dòng GT/Fit).
7. Cài HAP debug chỉ với iPhone có được không; HAP debug có còn sau khi ghép
đôi lại đồng hồ với điện thoại khác không.
8. Giới hạn kích thước mỗi tin phía đồng hồ lite (1 KB chỉ ghi ở phía iOS).
9. Hành vi khi iPhone khóa màn hình / app companion ở nền.
10. Thông lượng/độ trễ thực tế của P2P Wear Engine (tin/giây, ms).
11. Tiền lệ G Navigation: không tìm thấy nguồn web nào trong lần nghiên cứu
này (lấy theo lời chủ repo).
12. URL .zip trực tiếp của hai SDK và URL form đăng ký Wear Engine (đều nằm
trong trang/console đã đăng nhập, không trích được).

