Bạn làm việc trong repo https://github.com/ltminh88/fit3-navigation, branch spike/s1-canvas-map (PR #1).
Nhiệm vụ: sửa phần hiển thị kết quả trang API Probe. Giữ nguyên ràng buộc của brief gốc
plans/261120-1127-fit3-architecture-validation-spike/tasks/task-01-muse-s1-watch-canvas-map-spike.md
(ES5, không npm, mỗi file < 200 dòng).

JS_ROOT = spikes/watch-lite-app/entry/src/main/js/MainAbility/

## Kết quả chạy Previewer liteWearable (DevEco 6.1.1)
- Canvas probe vẽ ĐƯỢC: đường kẻ, tam giác (closePath), vòng tròn đỏ (arc + strokeStyle), hình chữ nhật xanh (fillRect), chữ "A" (fillText).
- Hình tròn tô kín (arc + fill ở x=200) KHÔNG hiện → nghi fill() không chạy hoặc là no-op.
- Vùng <list> kết quả: nền ĐEN, chữ bị vỡ/chồng lên nhau thành vệt nhiễu, không đọc được, không cuộn được.
- Tiêu đề "API Probe" và dòng "OK x/N" không thấy (Previewer giả lập mặt tròn, mép trên bị cắt).

## Việc cần làm
1. Bỏ <list> ở api-probe. Hiển thị kết quả theo TRANG: mỗi trang tối đa 6 dòng, mỗi dòng là một <text> riêng
   có width/height cố định (vd. width 400px, height 30px, font-size 22px, color #000000), nền trắng.
   Dùng 6 phần tử <text> cố định gắn với data line0..line5 (không dùng for), cập nhật bằng JS.
2. Thêm 2 nút <input type="button">: "Truoc" và "Sau" để lật trang; hiển thị "Trang a/b".
3. Dòng tóm tắt "OK x/N" + "Trang a/b" đặt ở giữa màn hình theo chiều dọc phía trên danh sách,
   không sát mép trên. Toàn bộ nội dung chữ nằm trong vùng an toàn: lề trái/phải >= 50px,
   lề trên >= 50px, để đọc được cả trên Previewer mặt tròn lẫn Fit 3 chữ nhật 480x408.
4. Thu nhỏ canvas probe còn cao 80px và đặt ở dưới cùng, để chữ kết quả là phần chính.
5. Sắp xếp kết quả: các dòng FAIL lên đầu, sau đó OK (readback=...), cuối cùng OK.
6. Probe fill: sau khi gọi fill(), vẽ thêm một hình kiểm chứng rõ ràng (vòng tròn tô ở vị trí riêng có nhãn chữ "F"
   vẽ bằng fillText bên cạnh), và ghi chú trong results/s1-canvas-map.md: "fill: kiểm bằng mắt — có hình tròn
   tô kín cạnh chữ F hay không", vì fill() có thể không ném lỗi nhưng không vẽ gì.
7. Trang map: chấm vị trí hiện vẽ bằng arc + fill. Thêm dự phòng: vẽ chấm bằng fillRect 16x16 căn giữa (240, 290)
   TRƯỚC, rồi mới thử arc + fill phủ lên, để chấm luôn hiện kể cả khi fill() là no-op.
   Kiểm tra thanh số đo trên trang map cũng nằm trong vùng an toàn của mục 3 (dời xuống, thu hẹp nếu cần).

## Kiểm chứng trước khi push
- Build phải qua: trong spikes/watch-lite-app chạy hvigorw assembleHap (DevEco 6.1.1), hoặc nêu rõ không chạy được.

## Git
- Commit thẳng vào spike/s1-canvas-map (conventional commits), push. Không mở PR mới. Không nhắc AI.

## Báo cáo khi xong
- Danh sách commit, từng mục 1–7 đã làm gì (1 dòng), giả định mới, trạng thái DONE / DONE_WITH_CONCERNS / BLOCKED.
