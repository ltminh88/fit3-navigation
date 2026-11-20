// Write the S1c byte-size stats markdown.
import fs from 'node:fs';

export function writeStats(filePath, stats) {
  const s = stats.routeStats;
  const md = [
    '# S1c \u2014 K\u00edch th\u01b0\u1edb c d\u1eef li\u1ec7 u b\u1ea3 n \u0111\u1ed3 th\u1ead t',
    '',
    `Ng\u00e0y t\u1ea1 o: ${stats.created}. Ngu\u1ed3 n: Valhalla (valhalla1.openstreetmap.de) + Overpass API (overpass-api.de).`,
    'B\u1ea3 n \u0111\u1ed3 : \u00a9 OpenStreetMap contributors (ODbL).',
    'Ch\u1ee3 B\u1ebf n Th\u00e0nh (10.77252, 106.69800) \u2192 Nh\u00e0 th\u1edd \u0110\u1ee9 c B\u00e0 (10.77978, 106.69902).',
    `\u0110 i\u1ec3 m \u0111\u00edch \u0111\u00e3 chi\u1ebf u (g\u1ed1 c = \u0111 i\u1ec3 m xu\u1ea5 t ph\u00e1t, x \u0110\u00f4ng, y B\u1eaf c): (${stats.endProjected[0]}, ${stats.endProjected[1]}) m.`,
    '',
    '## \u0110\u01b0\u1edd ng ph\u1ed1 (Overpass, bbox = bbox 2 tuy\u1ebf n + 400 m)',
    '',
    '| | S\u1ed1 l\u01b0\u1ee3 ng |',
    '|---|---|',
    `| Way l\u1edbn (trunk/primary/secondary + link) | ${stats.waysMajor} |`,
    `| Way nh\u1ecf (tertiary/residential/unclassified/living_street) | ${stats.waysMinor} |`,
    `| T\u1ed5 ng s\u1ed1 \u0111 i\u1ec3 m tr\u01b0\u1edb c \u0111\u01a1 n gi\u1ea3 n ho\u00e1 (2 m) | ${stats.roadPointsBefore} |`,
    `| T\u1ed5 ng s\u1ed1 \u0111 i\u1ec3 m sau \u0111\u01a1 n gi\u1ea3 n ho\u00e1 | ${stats.roadPointsAfter} |`,
    `| S\u1ed1 byte n\u1ebf u m\u00e3 ho\u00e1 int16 nh\u1ecb ph\u00e2n (4 byte/\u0111 i\u1ec3 m) | ${stats.roadBytes} |`,
    `| S\u1ed1 tin 1 KB t\u01b0\u01a1 ng \u1ee9 ng | ${stats.roadMessages1k} |`,
    '',
    '## Tuy\u1ebf n (Valhalla, \u0111\u01a1 n gi\u1ea3 n ho\u00e1 1 m)',
    '',
    '| | Xe m\u00e1y (motor_scooter) | \u00d4 t\u00f4 (auto) |',
    '|---|---|---|',
    `| \u0110\u1ed9 d\u00e0i Valhalla | ${s.motorbike.valhallaKm} km | ${s.car.valhallaKm} km |`,
    `| \u0110\u1ed9 d\u00e0i sau \u0111\u01a1 n gi\u1ea3 n ho\u00e1 | ${s.motorbike.lengthM} m | ${s.car.lengthM} m |`,
    `| S\u1ed1 \u0111 i\u1ec3 m tr\u01b0\u1edb c / sau \u0111\u01a1 n gi\u1ea3 n ho\u00e1 | ${s.motorbike.pointsBefore} / ${s.motorbike.pointsAfter} | ${s.car.pointsBefore} / ${s.car.pointsAfter} |`,
    `| S\u1ed1 byte int16 (4 byte/\u0111 i\u1ec3 m) | ${s.motorbike.bytes} | ${s.car.bytes} |`,
    `| S\u1ed1 tin 1 KB t\u01b0\u01a1 ng \u1ee9 ng | ${Math.ceil(s.motorbike.bytes / 1024)} | ${Math.ceil(s.car.bytes / 1024)} |`,
    `| S\u1ed1 maneuver | ${s.motorbike.maneuvers} | ${s.car.maneuvers} |`,
    '',
    `Hai tuy\u1ebf n xe m\u00e1y v\u00e0 \u00f4 t\u00f4 ${stats.routesIdentical ? 'GI\u1ed0 NG NHAU (c\u00f9ng shape, c\u00f9ng maneuver \u2014 ch\u1ec9 kh\u00e1c th\u1eddi gian di chuy\u1ec3 n Valhalla)' : 'KH\u00c1C NHAU'}.`,
    '',
    'T\u00e1i t\u1ea1 o: `node spikes/tools/real-map-fixture/build-real-map-fixture.js`',
    '',
  ].join('\n');
  fs.writeFileSync(filePath, md);
}
