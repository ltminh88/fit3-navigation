Repo https://github.com/ltminh88/fit3-navigation, tạo branch spike/s1d-map-contrast từ main, mở PR vào main.
Nhiệm vụ nhỏ: đường nhỏ trên trang nav-screen quá nhạt trên nền be (chủ repo nhận xét sau khi xem video bản đồ thật Q1).
Giữ mọi ràng buộc lite của task-05..08 (không fill/clearRect/drawImage, đường <= 6 px, ES5, file < 200 dòng).

1. Đường nhỏ: viền #B9B4AA 5 px + lõi #FFFFFF 3 px (thay #DADADA). Nền giữ #F2EFE9.
2. Đường lớn: viền #D98E2B 6 px + lõi #F7C948 4 px (đậm hơn một chút).
3. Đặt các màu bản đồ thành hằng số một chỗ (common/map-theme-colors.js) cho dễ chỉnh sau, nav-screen và helpers import từ đó.
4. Không đổi gì khác. Build hvigorw nếu có, không có thì ghi rõ.
Commit conventional, không nhắc AI. Báo cáo: link PR, file đổi, trạng thái DONE / DONE_WITH_CONCERNS / BLOCKED.
