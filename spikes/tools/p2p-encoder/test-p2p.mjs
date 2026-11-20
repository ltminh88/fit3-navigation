// test-p2p.mjs
// Node tests for the P2P protocol v1 (docs/p2p-protocol.md):
// encode -> decode matches the real-map fixture 100%; every message
// <= 1000 bytes after base64; 10% loss + reordering -> RESEND_REQUEST
// lists exactly the missing seqs; GUIDANCE < 40 bytes. Writes the
// message-budget table to spikes/results/s2-p2p-message-budget.md.
// Run: node spikes/tools/p2p-encoder/test-p2p.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { encodeTrip, encodeGuidance, encodeAck, encodeResendRequest, encodeEnd,
    TYPES, HEADER_LEN, printTable } from './encode.js';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const common = join(repo, 'spikes', 'watch-lite-app', 'entry', 'src', 'main', 'js', 'MainAbility', 'common');
const fixture = (await import(join(common, 'fixture-real-map.js'))).default;

// Load the watch decoder (ES5, `export default`) without imports.
const decoderSrc = readFileSync(join(common, 'p2p-frame-decoder.js'), 'utf8')
    .replace('export default {', 'return {');
const decoderMod = new Function(decoderSrc)();

let passed = 0, failed = 0;
function check(name, cond, extra = '') {
    if (cond) { passed++; }
    else { failed++; console.log('FAIL: ' + name + (extra ? ' — ' + extra : '')); }
}
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
// Deterministic PRNG so the loss simulation is repeatable.
function mulberry32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const route = fixture.routes.motorbike;

// 1. Encode the trip start, check sizes.
const { messages, stats } = encodeTrip(fixture, { vehicle: 'motorbike', sessionId: 1 });
check('trip-start message count is 10', messages.length === 10, 'got ' + messages.length);
check('every message <= 1000 chars after base64',
    messages.every((m) => m.wireLength <= 1000),
    'max ' + Math.max(...messages.map((m) => m.wireLength)));
check('send order is HELLO, ROUTE, ROADS, MANEUVERS',
    messages[0].typeName === 'HELLO' && messages[1].typeName === 'ROUTE_CHUNK' &&
    messages[messages.length - 1].typeName === 'MANEUVERS');

// 2. In-order decode matches the fixture 100%.
const dec = decoderMod.createDecoder();
for (const m of messages) {
    const missing = dec.feed(m.wire);
    check('feed ' + m.typeName + ' seq ' + m.seq + ' ok', missing !== null, dec.getLastError());
}
check('HELLO complete', dec.isComplete(TYPES.HELLO));
check('ROUTE complete', dec.isComplete(TYPES.ROUTE_CHUNK));
check('ROADS complete', dec.isComplete(TYPES.ROADS_CHUNK));
check('MANEUVERS complete', dec.isComplete(TYPES.MANEUVERS));
check('hello vehicle + name', eq(dec.getHello(), { vehicle: 0, name: 'Xe máy' }));
check('routeDelta matches fixture 100%', eq(dec.getRoute(), route.routeDelta));
const roads = dec.getRoads();
check('roadsMajorDelta matches fixture 100%', eq(roads.roadsMajorDelta, fixture.roadsMajorDelta));
check('roadsMinorDelta matches fixture 100%', eq(roads.roadsMinorDelta, fixture.roadsMinorDelta));
check('maneuvers match fixture 100%', eq(dec.getManeuvers(), route.maneuvers));

// 3. GUIDANCE size and fields.
const g = encodeGuidance({ sessionId: 1, x: -52, y: -30, heading: 900,
    distToTurnM: 78, maneuverIndex: 1, speedKmh: 29, speedLimitKmh: 50 });
check('GUIDANCE binary frame is 19 bytes (< 40)', g.binaryLength === 19, 'got ' + g.binaryLength);
check('GUIDANCE base64 is 28 chars', g.wireLength === 28, 'got ' + g.wireLength);
const decG = decoderMod.createDecoder();
decG.feed(encodeTrip(fixture, { vehicle: 'motorbike', sessionId: 1 }).messages[0].wire);
check('GUIDANCE feed ok', decG.feed(g.wire) !== null);
check('GUIDANCE fields round-trip', eq(decG.getGuidance(),
    { x: -52, y: -30, heading: 900, distToTurnM: 78, maneuverIndex: 1, speedKmh: 29, speedLimitKmh: 50 }));

// 4. Control frames are accepted; wrong version is rejected; duplicates ignored.
const decC = decoderMod.createDecoder();
check('ACK feed ok', decC.feed(encodeAck({ sessionId: 1, ackedType: TYPES.ROADS_CHUNK, ackedSeq: 6 }).wire) !== null);
check('END feed ok', decC.feed(encodeEnd({ sessionId: 1, reason: 0 }).wire) !== null);
const badVersion = Buffer.from(messages[0].wire, 'base64');
badVersion[0] = 2;
check('version 2 frame rejected',
    decC.feed(badVersion.toString('base64')) === null && decC.getLastError() === 'version');
const decD = decoderMod.createDecoder();
decD.feed(messages[1].wire);
decD.feed(messages[1].wire); // same ROUTE chunk twice
check('duplicate chunk ignored, still complete', decD.isComplete(TYPES.ROUTE_CHUNK));

// 5. Loss (10%) + reordering -> RESEND_REQUEST lists exactly the missing seqs.
const rand = mulberry32(42);
const shuffled = [...messages];
for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
const dropped = shuffled.filter(() => rand() < 0.10);
const kept = shuffled.filter((m) => !dropped.includes(m));
const decL = decoderMod.createDecoder();
for (const m of kept) { decL.feed(m.wire); }
const missingRoute = [...decL.getMissing(TYPES.ROUTE_CHUNK)];
const missingRoads = [...decL.getMissing(TYPES.ROADS_CHUNK)];
const droppedRoute = dropped.filter((m) => m.typeName === 'ROUTE_CHUNK').map((m) => m.seq).sort((a, b) => a - b);
const droppedRoads = dropped.filter((m) => m.typeName === 'ROADS_CHUNK').map((m) => m.seq).sort((a, b) => a - b);
check('loss sim dropped some chunks', dropped.length > 0, 'dropped ' + dropped.length);
check('missing ROUTE seqs equal dropped seqs', eq(missingRoute, droppedRoute),
    'missing ' + missingRoute + ' dropped ' + droppedRoute);
check('missing ROADS seqs equal dropped seqs', eq(missingRoads, droppedRoads),
    'missing ' + missingRoads + ' dropped ' + droppedRoads);
// RESEND_REQUEST for the missing ROADS chunks carries exactly those seqs.
const resend = encodeResendRequest({ sessionId: 1, reqType: TYPES.ROADS_CHUNK, seqs: missingRoads });
const resendBytes = Buffer.from(resend.wire, 'base64');
const resendSeqs = [];
for (let i = 0; i < resendBytes[HEADER_LEN + 1]; i++) {
    resendSeqs.push(resendBytes.readUInt16BE(HEADER_LEN + 2 + i * 2));
}
check('RESEND_REQUEST lists exactly the missing ROADS seqs', eq(resendSeqs, missingRoads));
check('RESEND_REQUEST type byte', resendBytes[HEADER_LEN] === TYPES.ROADS_CHUNK);
// Re-feed the dropped messages -> complete, data still matches 100%.
for (const m of dropped) { decL.feed(m.wire); }
check('after resend ROUTE complete', decL.isComplete(TYPES.ROUTE_CHUNK));
check('after resend ROADS complete', decL.isComplete(TYPES.ROADS_CHUNK));
check('after resend route matches fixture', eq(decL.getRoute(), route.routeDelta));
check('after resend roads match fixture',
    eq(decL.getRoads().roadsMajorDelta, fixture.roadsMajorDelta) &&
    eq(decL.getRoads().roadsMinorDelta, fixture.roadsMinorDelta));
check('after resend maneuvers match fixture', eq(decL.getManeuvers(), route.maneuvers));

// 6. New sessionId resets the old session; binary encoding matches base64.
const decS = decoderMod.createDecoder();
decS.feed(messages[1].wire);
decS.feed(encodeTrip(fixture, { vehicle: 'motorbike', sessionId: 2 }).messages[0].wire);
check('new session resets ROUTE', !decS.isComplete(TYPES.ROUTE_CHUNK));
const bin = encodeTrip(fixture, { vehicle: 'motorbike', sessionId: 1, encoding: 'binary' });
check('binary encoding: wire is the frame bytes',
    bin.messages.every((m) => Buffer.isBuffer(m.wire) && m.wire.length === m.binaryLength));
check('binary frames equal base64-decoded frames',
    bin.messages.every((m, i) => Buffer.from(messages[i].wire, 'base64').equals(m.wire)));

// 7. Write the budget file.
const budget = [
    '# Ngân sách tin P2P (S2)',
    '',
    'Ngày: 2026-11-20. Tuyến mẫu: Chợ Bến Thành → Nhà thờ Đức Bà (1772 m, 15 điểm, 10 maneuver,',
    '363 đường / 836 điểm). Xe máy, sessionId 1. Sinh bởi `spikes/tools/p2p-encoder/test-p2p.mjs`.',
    '',
    '## Tin lúc bắt đầu chuyến',
    '',
    printTable(stats),
    '',
    '## Tin trong chuyến',
    '',
    '- GUIDANCE: 19 byte nhị phân / 28 ký tự base64 mỗi tin, gửi 1 Hz trong suốt chuyến đi.',
    '- ACK: 11 byte nhị phân / 16 ký tự base64, đồng hồ gửi sau mỗi chunk.',
    '- RESEND_REQUEST: 10 + 2 × (số seq thiếu) byte nhị phân, chỉ gửi khi thiếu chunk.',
    '- END: 9 byte nhị phân / 12 ký tự base64, một tin cuối chuyến.',
    '',
    '## Giả định',
    '',
    '- Payload Wear Engine là string nên toàn bộ khung đi base64 (overhead 33%); giới hạn 1 KB/tin',
    '  của iOS được giữ bằng chunk payload 700 byte (khung 708 byte → 944 ký tự base64).',
    '- Tốc độ 5 tin/giây và 2 tin/giây chỉ là giả định để ước lượng — thông lượng thực tế của',
    '  Wear Engine P2P chưa xác minh được (xem C9 trong báo cáo task-10).',
    '- GUIDANCE không tính vào bảng trên (gửi liên tục 1 Hz, 28 ký tự/tin).',
    ''
].join('\n');
writeFileSync(join(repo, 'spikes', 'results', 's2-p2p-message-budget.md'), budget);

console.log('test-p2p: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
