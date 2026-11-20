Bạn làm việc trong repo https://github.com/ltminh88/fit3-navigation, trên branch spike/s1-canvas-map (PR #1).
Nhiệm vụ: sửa PR #1 theo kết quả review bên dưới. Giữ nguyên mọi ràng buộc của brief gốc
plans/261120-1127-fit3-architecture-validation-spike/tasks/task-01-muse-s1-watch-canvas-map-spike.md
(ES5, không npm, mỗi file < 200 dòng, không commit cert/khoá).

JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/

## Bằng chứng tham chiếu (đã kiểm trong DevEco 6.1.1 SDK)
- Danh sách thẻ hợp lệ cho liteWearable: sdk/default/openharmony/js/build-tools/ace-loader/lib/templater/lite_component_map.js
  Có: div, stack, canvas, list, list-item, text, input(type=button|checkbox|...), image, swiper, ... KHÔNG có `button`.
- sdk/default/openharmony/js/api/@system.router.d.ts: push() và back() là SystemCapability.ArkUI.Full;
  chỉ replace() là ArkUI.Lite. Mẫu lite chính thức (ace-loader/sample/lite) cũng chỉ dùng router.replace.

## Phải sửa (chặn build hoặc chạy sai)
1. Thẻ `<button>` không tồn tại trên lite → đổi tất cả sang `<input type="button" value="..." onclick="...">`
   (pages/index, pages/api-probe, pages/map). Cập nhật CSS selector tương ứng.
2. Điều hướng: thay router.push bằng router.replace; thay router.back() bằng
   router.replace({ uri: 'pages/index/index' }). Sửa comment giả định cho đúng.
3. Lỗi cắt đoạn trong map.js drawPolyline:
   a. Khi điểm trước nằm ngoài, điểm hiện tại nằm trong, code đang moveTo(điểm hiện tại) → mất đoạn đi vào màn hình.
      Đúng phải là moveTo(prevSx, prevSy) rồi lineTo(sx, sy). (prevSx/prevSy đang khai báo mà không dùng.)
   b. Đổi luật bỏ đoạn: chỉ bỏ khi CẢ HAI đầu cùng nằm ngoài về MỘT phía
      (cả hai x < 0, hoặc cả hai x > 480, hoặc cả hai y < 0, hoặc cả hai y > 408).
      Lý do: đường phụ chỉ có 2 điểm dài 240–300 m, hai đầu thường nằm ngoài màn hình nhưng thân đường cắt ngang qua;
      luật cũ (của brief gốc, brief sai) làm biến mất gần hết đường phụ.
4. drawFrame không có try/catch: nếu arc/fill/... ném lỗi thì interval vẫn chạy nhưng không đo được gì,
   màn hình kẹt ở "Dang ve...". Bọc toàn bộ phần vẽ trong try/catch; khi lỗi, ghi statsText = 'draw FAIL: <message>'
   và vẫn giữ số khung đã vẽ thành công trước đó. Phần chấm vị trí (arc + fill + stroke) bọc try/catch riêng,
   để nếu fill/arc không có thì tuyến đường vẫn được vẽ và đo.
5. api-probe hiện 19 dòng trong một <text> cao 190 px, cỡ chữ 18 → bị tràn, và không chắc lite hiểu '\n'.
   Đổi sang `<list>` + `<list-item for="{{results}}">` với một <text> mỗi dòng để cuộn được.
   Dòng tóm tắt "OK x/N" giữ ở trên cùng.
6. Lớp phủ số đo trên trang map: lite không đảm bảo `position: absolute`. Đổi gốc trang thành `<stack>`:
   canvas là con đầu tiên, thanh số đo (div có text + nút quay lại) là con thứ hai. Bỏ position/left/top trong CSS.

## Nên sửa
7. Các probe kiểu thuộc tính (lineWidth, strokeStyle, lineCap, lineJoin, font): nếu gán không ném lỗi nhưng đọc lại
   ra giá trị khác (vd. '#FF0000' hoặc số), ghi "OK (readback=<giá trị>)" thay vì FAIL, để không đọc nhầm kết quả.
8. Thêm probe clearRect và fillStyle (map.js đang dùng cả hai). Cập nhật tổng số API và bảng trong
   spikes/results/s1-canvas-map.md cho khớp.
9. README + file kết quả: ghi chú rằng số ms đo bằng Date.now() chỉ là thời gian JS gửi lệnh vẽ; lite có thể vẽ thật
   sau khi hàm trả về, nên phải đánh giá thêm bằng mắt (xoay có giật/xé hình không).

## Không đổi
- route-codec.js và fixture-route.js: đã review, đúng (200 điểm, bước 15 m nguyên, 2921 m). Không sửa.
- Không sửa build-profile.json5, hvigor*, oh-package*.

## Git
- Commit thẳng vào branch spike/s1-canvas-map (conventional commits, ví dụ `fix: use lite-supported button and router`), push.
  Không mở PR mới. Không nhắc AI trong commit message.

## Báo cáo khi xong
- Danh sách commit mới.
- Với từng mục 1–9: đã sửa thế nào (1 dòng), hoặc lý do không sửa.
- Bất kỳ giả định mới nào về API lite.
- Trạng thái: DONE / DONE_WITH_CONCERNS / BLOCKED.
