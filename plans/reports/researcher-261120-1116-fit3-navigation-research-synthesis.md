# Tổng hợp nghiên cứu: App dẫn đường cho Huawei Watch Fit 3

Ngày: 2026-11-20 · Mức: high · Báo cáo chi tiết:
- [G Navigation – kiểm kê tính năng](researcher-261120-1116-g-navigation-feature-inventory.md)
- [Watch Fit 3 – năng lực nền tảng](researcher-261120-1116-watch-fit3-platform-capabilities.md)

Mức xác minh: **A** = trang chính thức đọc trực tiếp · **B** = chính thức qua snippet · **C** = nguồn thứ cấp · **chưa xác minh**.

## 0. Bằng chứng thực địa từ chủ sản phẩm (2026-11-20)

Chủ sản phẩm đã dùng G Navigation thật trên **Fit 3 + iPhone**:
- Cài app iPhone và app đồng hồ Gnavi (từ AppGallery). Đồng hồ kết nối điện thoại qua Huawei Health.
- Luồng dùng: tìm điểm đi và điểm đến trên Google Maps → share cho app Gnavi trên iPhone → iPhone gửi hướng dẫn sang đồng hồ.
- Còn nhiều lỗi riêng trên Fit 3 mà dev không sửa. Đây chính là lý do làm app riêng.

Câu hỏi được giải quyết nhờ bằng chứng này:
- Fit 3 được hỗ trợ: **có**.
- Wear Engine P2P chạy được giữa iOS và Fit 3 (lite): **có**.
- Một dev bên thứ ba publish được app đồng hồ lên AppGallery: **có**.

Hệ quả: **iOS là nền tảng chính**, đảo lại khuyến nghị "Android trước" ở mục 5. Giới hạn 1 KB mỗi message và không có file transfer trên iOS trở thành ràng buộc thiết kế cứng.

### Lỗi của G Navigation trên Fit 3 và quyết định của chủ sản phẩm

| Lỗi thấy được | Cách thiết kế xử lý |
|---|---|
| Kết nối không ổn định | Mỗi message mang **toàn bộ trạng thái** hiện tại (idempotent), không gửi phần chênh lệch, nên mất một gói thì gói sau tự sửa. Thêm heartbeat bằng `ping`. Đồng hồ báo rõ "mất kết nối", tự kết nối lại. |
| Lên bản mới thì Fit 3 lỗi, dòng khác vẫn chạy | Bản app chỉ nhắm Fit 3. Có **số phiên bản giao thức** trong lúc bắt tay, nên phiên bản lệch nhau thì báo lỗi rõ ràng chứ không chết im. Có checklist kiểm thử trên máy Fit 3 thật trước mỗi bản. |
| Dòng khác có bản đồ, Fit 3 chỉ có mũi tên | **Yêu cầu bắt buộc: hiện bản đồ trên Fit 3.** Xem mục 4b. |

Quyết định:
- Phương tiện: **nhiều loại** (gồm xe máy).
- Nhập điểm đến: **share từ Google Maps**.

### 4b. Hiện bản đồ trên Fit 3 (lite wearable + iOS 1 KB): các hướng

- **M1 – Bản đồ vector (khuyến nghị):**
  - Điện thoại cắt đoạn tuyến và các đường quanh vị trí hiện tại.
  - Mã hoá toạ độ dạng delta int16, mỗi gói 1 KB chứa khoảng 200 điểm.
  - Đồng hồ vẽ bằng `canvas` (moveTo/lineTo/stroke), xoay theo hướng đi.
  - Nhẹ, cập nhật nhanh, vừa với giới hạn iOS.
  - Phụ thuộc: canvas JS trên lite wearable có hỗ trợ vẽ path không. **Chưa xác minh.** Docs OpenHarmony JS canvas có các API này, nhưng không ghi rõ chúng chạy trên thiết bị lite.
- **M2 – Ảnh raster:**
  - Điện thoại chụp bản đồ (`MKMapSnapshotter`), nén ảnh nhỏ, cắt thành nhiều gói 1 KB.
  - Đồng hồ ghép lại, ghi file, hiện bằng `<image>`.
  - Mỗi lần cập nhật cần 10–40 gói, nên chậm và tốn pin. Chỉ dùng làm dự phòng.
- Nhận định: G Navigation chỉ hiện mũi tên trên Fit 3, có thể vì giới hạn nền tảng, cũng có thể vì dev không làm. **Spike phải trả lời câu này đầu tiên.**

### Định tuyến cho "nhiều loại" phương tiện (cần quyết định)

- **Apple MapKit `MKDirections`:** miễn phí, nhưng **không có chế độ xe máy**.
- **Valhalla** (mã nguồn mở, dữ liệu OSM): có `motor_scooter`, `motorcycle`, `bicycle`, `pedestrian`, `auto`. Tự host bằng extract OSM Việt Nam trên VPS nhỏ, hoặc dùng dịch vụ hosted. Giá và hạn mức: chưa xác minh.
- **Đánh giá OSM (2026-11-20):** OSM là **dữ liệu**, không phải engine. Valhalla/GraphHopper/OSRM đều chạy trên OSM, nên "dùng OSM" chính là hướng Valhalla.
  - Điểm mạnh 1: có dữ liệu hình học đường xung quanh để vẽ bản đồ vector M1 trên đồng hồ. MapKit chỉ trả về polyline của tuyến.
  - Điểm mạnh 2: giấy phép ODbL miễn phí, chỉ cần ghi nguồn.
  - Rủi ro: dữ liệu VN về cấm xe máy và đường một chiều có thể thiếu tag. Cần chạy thử vài tuyến quen để đối chiếu.
- **Google Routes API:** có `TWO_WHEELER` ở một số nước. Điều khoản Google Maps Platform có thể hạn chế dùng cho dẫn đường real-time. **Phải đọc kỹ điều khoản** trước khi dùng.

## 1. Kết luận nhanh

1. Fit 3 **cài được app bên thứ ba** qua Huawei Health > Thiết bị > AppGallery (A).
2. Wear Engine liệt kê "WATCH FIT series: FIT 1 and later" (A). Watch Fit 3 không được nêu đích danh.
3. Fit 3 gần như chắc là **lite wearable**, app viết bằng JS + HML + CSS. Kết luận này đến từ suy luận và nguồn C. Chưa có bằng chứng Fit 3 chạy ArkTS.
4. Mô hình khả thi nhất: **điện thoại lấy GPS và tính tuyến, đồng hồ chỉ hiển thị**. Có 2 tiền lệ đi theo đúng mô hình này:
   - Petal Maps trên Fit 3 chỉ có "collaborative navigation" và không hỗ trợ iOS (A).
   - G Navigation cũng làm vậy (fact từ trang guide của dev).
5. Rủi ro lớn nhất chưa xác minh:
   - Dev cá nhân ở Việt Nam có xin được quyền Wear Engine P2P không. Hai trang chính thức nói khác nhau.
   - App lite JS còn sống khi màn hình tắt không.

## 2. Tính năng G Navigation (tóm tắt)

| Nhóm | Hiện trạng ở G Navigation | Dòng đồng hồ | Mức |
|---|---|---|---|
| Ngã rẽ kế tiếp, khoảng cách, tên đường, ETA | Có, hiện trên đồng hồ | Huawei (app Gnavi), Amazfit Zepp OS | A (listing) |
| Rung trước khi rẽ | Có, chỉnh được kiểu rung | như trên | A |
| Bản đồ xoay theo hướng đi | Chỉ trên "supported watches", model khác chỉ có chữ | không rõ model nào | chưa xác minh |
| Tính tuyến, tự tính lại khi lệch, tối đa 5 điểm dừng | Làm trên iPhone | – | A |
| Giọng nói | Thêm ở v1.2, có vẻ phát trên điện thoại | trên đồng hồ: chưa xác minh | B |
| GPS | GPS của điện thoại | – | suy luận mạnh |
| Ngoại tuyến | Không có bằng chứng, routing/tiles đều gọi server | – | suy luận |
| Tuỳ biến | Cỡ chữ, màu, kiểu rung, các dòng thông tin | – | A |
| Pin | Không có số liệu công khai | – | – |
| Hỗ trợ Fit 3 | Không nêu đích danh | – | **chưa xác minh** |
| Giá | Free, thử 7 ngày, Premium 89.000đ mua một lần | – | A |

## 3. Năng lực và giới hạn của Fit 3

| Khả năng | Kết luận | Mức |
|---|---|---|
| Màn hình | 1.82" AMOLED, 480×408, cảm ứng | A |
| GPS trên đồng hồ | Có (dual-band chưa rõ); app bên thứ ba truy cập qua `@system.geolocation` thì chưa xác minh | C |
| P2P đồng hồ ↔ điện thoại | `P2pClient` (`ping`, `send`, `registerReceiver`) | A |
| Rung | `@system.vibrator` | B |
| Giữ sáng màn hình | `setKeepScreenOn` | B |
| Chạy nền / nhận message khi tắt màn hình | Không rõ, rủi ro cao | chưa xác minh |
| Thông báo template từ app điện thoại | Có, cá nhân dùng được | A |
| Health Kit | Không dùng được để đọc GPS real-time | B |
| Phân phối | AppGallery, duyệt quyền Wear Engine 1–2 tuần | A/B |
| Dev cá nhân ở Việt Nam publish được | chưa xác minh | – |

### Android và iOS

| | Android | iOS |
|---|---|---|
| Wear Engine SDK | Có (Android 6–14 + Huawei Health) | Có (1.0.0.305) |
| Kích thước message | Chưa có số chính thức | **1 KB/gói** |
| Truyền file | Có | Không |
| Ping mở app đồng hồ | 2 chiều | Chỉ từ điện thoại |
| Petal Maps dẫn đường trên đồng hồ | Có | Không |

## 4. So sánh các phương án kiến trúc

| | A. Điện thoại tính, đồng hồ hiển thị | B. Hybrid: đồng hồ tự định vị | C. Chỉ dùng thông báo |
|---|---|---|---|
| Trải nghiệm | Tốt, giống G Navigation | Tốt, dùng được khi rời điện thoại | Kém |
| Pin đồng hồ | Thấp (chỉ nhận message, vẽ màn hình) | Cao (GPS liên tục) | Thấp nhất |
| Rủi ro kỹ thuật | Trung bình (quyền P2P, vòng đời app) | Cao (geolocation, foreground) | Thấp |
| Chạy trên iOS | Được, nếu payload dưới 1 KB | Khó (không truyền file) | Được |
| Công sức 1 người | Vừa | Lớn | Nhỏ |

## 5. Khuyến nghị

**Chọn A**, làm Android trước:
- Đồng hồ là màn hình mỏng, nhận JSON dưới 1 KB gồm `{maneuver, distance, street, eta}`, vẽ mũi tên và rung.
- Điện thoại lo GPS, tính tuyến và tính lại khi lệch tuyến.
- C là phương án dự phòng nếu không xin được quyền P2P.
- B để sau, chỉ làm khi spike chứng minh geolocation trên đồng hồ ổn định.

**Trước khi thiết kế, chạy spike 1–2 ngày trên Fit 3 thật:**
- S1: cài app JS lite đã ký debug, nhận P2P từ app Android.
- S2: đo độ trễ, hành vi khi tắt màn hình, khi điện thoại kill app nền.
- S3: thử `@system.geolocation` (tần suất fix, pin trong 1 giờ).
- S4: nộp xin quyền Wear Engine P2P với tài khoản cá nhân Việt Nam, ghi lại thời gian duyệt.
- S5: iOS ping/send, khi app iOS ở nền.

Mẹo kiểm chứng rẻ nhất: cài G Navigation + Gnavi lên một Fit 3 thật để xem Fit 3 có được hỗ trợ không, và đồng hồ hiện bản đồ hay chỉ chữ.

## 6. Câu hỏi chưa giải quyết

1. Fit 3 là lite wearable ở API level nào? Simulator trong DevEco có profile Fit 3 không?
2. App lite JS có nhận GPS/message khi tắt màn hình hoặc bị ẩn không?
3. Dev cá nhân ở Việt Nam có xin được Wear Engine P2P và publish app đồng hồ không? Mất bao lâu?
4. Giới hạn message/file chính thức phía Android cho lite wearable là bao nhiêu?
5. GPS của Fit 3 có dual-band không? Độ chính xác của `@system.geolocation` ra sao?
6. iOS P2P với lite wearable có chạy thật không, kể cả khi app iOS ở nền?
7. Giới hạn dung lượng HAP, storage, canvas, định dạng ảnh?
8. Người dùng cuối cài bản chưa duyệt bằng cách nào (ngoài debug theo UDID)?
9. G Navigation dùng provider bản đồ/routing nào, có hỗ trợ Fit 3 không, hiện bản đồ hay chỉ chữ?
10. Phạm vi sản phẩm (cần anh quyết): có bắt buộc hỗ trợ iOS ngay từ MVP không? Loại phương tiện nào (đi bộ, xe máy, ô tô)? Nguồn routing/bản đồ (OSM/OSRM, GraphHopper, Google…)?
