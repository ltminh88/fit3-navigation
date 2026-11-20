# fit3-navigation

Ứng dụng dẫn đường mã nguồn mở, tối ưu riêng cho **Huawei Watch Fit 3**: điện thoại (iPhone) lấy GPS và tính tuyến, đồng hồ hiển thị hướng rẽ, khoảng cách và bản đồ rút gọn.

> Trạng thái: **đang spike kiểm chứng kiến trúc** — chưa có bản dùng được.

## Vì sao làm riêng cho Fit 3
Fit 3 là thiết bị *lite wearable* (app JS), giới hạn hơn các dòng Watch cao cấp. Các app dẫn đường hỗ trợ nhiều dòng đồng hồ thường bỏ quên Fit 3: kết nối chập chờn, cập nhật làm hỏng riêng Fit 3, không có bản đồ. Dự án này chỉ nhắm một thiết bị để làm cho tốt.

## Cấu trúc (monorepo)
```
watch-app/   app đồng hồ (DevEco Studio, lite wearable JS)
ios-app/     app iPhone (Swift)
protocol/    đặc tả gói tin điện thoại ↔ đồng hồ (có phiên bản)
routing/     định tuyến dựa trên OpenStreetMap (Valhalla)
spikes/      code thử nghiệm, không dùng cho bản chính thức
docs/        tài liệu
plans/       nghiên cứu và kế hoạch
```

## Tài liệu
- Nghiên cứu: [`plans/reports/`](plans/reports/)
- Kế hoạch spike: [`plans/261120-1127-fit3-architecture-validation-spike/`](plans/261120-1127-fit3-architecture-validation-spike/plan.md)

## Không phải sản phẩm chính thức
Dự án cá nhân, không liên kết với Huawei. "Huawei", "Watch Fit", "AppGallery" là nhãn hiệu của chủ sở hữu tương ứng. Dữ liệu bản đồ © OpenStreetMap contributors (ODbL).

## License
[MIT](LICENSE)
