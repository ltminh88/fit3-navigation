# real-map-fixture

Tạo dữ liệu thật cho spike S1c: tuyến Chợ Bến Thành → Nhà thờ Đức Bà
(TP.HCM) cho xe máy + ô tô (Valhalla) và đường phố xung quanh (Overpass).

## Chạy

Từ gốc repo, cần mạng và Node >= 18 (không npm ngoài):

```sh
node spikes/tools/real-map-fixture/build-real-map-fixture.js
```

Script gọi mỗi API đúng 1 lần mỗi lần chạy, header
`User-Agent: fit3-navigation-spike`, timeout 120 giây.

## Kết quả

- `spikes/watch-lite-app/entry/src/main/js/MainAbility/common/fixture-real-map.js`
  (tuyến + maneuver 2 phương tiện; file sinh tự động, không sửa tay)
- `.../common/fixture-real-map-roads.js`
  (đường phố lớn/nhỏ, mã hoá delta int16; file sinh tự động, dài hơn
  200 dòng là bình thường)
- `spikes/results/s1c-real-map-data-size.md`
  (bảng thống kê byte: số way, số điểm, byte int16, số tin 1 KB)

## Chi tiết

- Chiếu phẳng cục bộ (equirectangular), gốc = điểm xuất phát, x Đông,
  y Bắc, đơn vị mét, làm tròn số nguyên (vừa int16).
- Đơn giản hoá Douglas–Peucker: tuyến 1 m, đường phố 2 m.
- Khoảng cách maneuver tính trên tuyến ĐÃ đơn giản hoá (giữ ánh xạ
  chỉ số sau khi simplify).
- Loại rẽ map từ câu hướng dẫn tiếng Việt của Valhalla: "quay đầu" →
  uturn, "đến"/"đích" → arrive, "vòng xuyến" → straight (tạm thời),
  "trái" → left, "phải" → right, còn lại straight.

## File

- `constants.js` — toạ độ, URL, cấp đường, dung sai.
- `polyline6.js` — giải mã shape polyline6 của Valhalla.
- `fetch-valhalla-route.js` — lấy 1 tuyến theo costing.
- `fetch-osm-roads.js` — lấy way đường phố từ Overpass.
- `project-and-simplify.js` — chiếu toạ độ, simplify, map maneuver.
- `build-real-map-fixture.js` — điểm vào, ghi file + thống kê.
