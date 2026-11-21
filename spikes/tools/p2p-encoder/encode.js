// encode.js
// Phone-side encoder for the P2P protocol v1 (docs/p2p-protocol.md).
// Node, ES2020. Builds binary frames (big-endian), then encodes them
// for the wire: base64 by default (Wear Engine payloads are strings),
// or raw binary with encoding 'binary' for a future bytes-capable
// transport. Every wire message is <= 1000 chars/bytes.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const PROTOCOL_VERSION = 1;
export const HEADER_LEN = 8;
export const CHUNK_PAYLOAD = 700; // frame 708 bytes -> 944 base64 chars
export const MAX_WIRE = 1000;
export const TYPES = {
    HELLO: 1, ROUTE_CHUNK: 2, ROADS_CHUNK: 3, MANEUVERS: 4,
    GUIDANCE: 5, ACK: 6, RESEND_REQUEST: 7, END: 8
};
export const TURN_CODES = { straight: 0, left: 1, right: 2, uturn: 3, arrive: 4 };
export const VEHICLE_CODES = { motor_scooter: 0, auto: 1 };

function buildFrame({ type, sessionId, seq, total, payload }) {
    const frame = Buffer.alloc(HEADER_LEN + payload.length);
    frame[0] = PROTOCOL_VERSION;
    frame[1] = type;
    frame.writeUInt16BE(sessionId, 2);
    frame.writeUInt16BE(seq, 4);
    frame.writeUInt16BE(total, 6);
    payload.copy(frame, HEADER_LEN);
    return frame;
}

function toWire(frame, encoding, typeName, sessionId, seq, total) {
    const wire = encoding === 'binary' ? frame : frame.toString('base64');
    const msg = { type: TYPES[typeName], typeName, sessionId, seq, total,
        wire, wireLength: wire.length, binaryLength: frame.length };
    if (wire.length > MAX_WIRE) {
        throw new Error(typeName + ' seq ' + seq + ' exceeds ' + MAX_WIRE + ' (' + wire.length + ')');
    }
    return msg;
}

function chunkPayload(bytes, { type, sessionId, encoding, typeName }) {
    const total = Math.max(1, Math.ceil(bytes.length / CHUNK_PAYLOAD));
    const out = [];
    for (let seq = 0; seq < total; seq++) {
        const slice = bytes.subarray(seq * CHUNK_PAYLOAD, (seq + 1) * CHUNK_PAYLOAD);
        out.push(toWire(buildFrame({ type, sessionId, seq, total, payload: slice }),
            encoding, typeName, sessionId, seq, total));
    }
    return out;
}

function int16Bytes(values) {
    const buf = Buffer.alloc(values.length * 2);
    values.forEach((v, i) => buf.writeInt16BE(v, i * 2));
    return buf;
}

export function encodeHello({ sessionId, vehicle, name = 'Xe máy', encoding = 'base64' }) {
    const nameBuf = Buffer.from(name, 'utf8');
    if (nameBuf.length > 32) throw new Error('HELLO name too long');
    const payload = Buffer.concat([Buffer.from([PROTOCOL_VERSION, VEHICLE_CODES[vehicle], nameBuf.length]), nameBuf]);
    const frame = buildFrame({ type: TYPES.HELLO, sessionId, seq: 0, total: 1, payload });
    return toWire(frame, encoding, 'HELLO', sessionId, 0, 1);
}

export function encodeRouteChunks({ sessionId, routeDelta, encoding = 'base64' }) {
    return chunkPayload(int16Bytes(routeDelta),
        { type: TYPES.ROUTE_CHUNK, sessionId, encoding, typeName: 'ROUTE_CHUNK' });
}

export function encodeRoadsChunks({ sessionId, roadsMajorDelta, roadsMinorDelta, encoding = 'base64' }) {
    const parts = [];
    for (const [level, list] of [[1, roadsMajorDelta], [0, roadsMinorDelta]]) {
        for (const road of list) {
            const header = Buffer.alloc(3);
            header[0] = level;
            header.writeUInt16BE(road.length / 2, 1);
            parts.push(header, int16Bytes(road));
        }
    }
    return chunkPayload(Buffer.concat(parts),
        { type: TYPES.ROADS_CHUNK, sessionId, encoding, typeName: 'ROADS_CHUNK' });
}

export function encodeManeuvers({ sessionId, maneuvers, encoding = 'base64' }) {
    if (maneuvers.length > 32) throw new Error('too many maneuvers');
    const parts = [Buffer.from([maneuvers.length])];
    for (const m of maneuvers) {
        const nameBuf = Buffer.from(m.streetName, 'utf8');
        if (nameBuf.length > 64) throw new Error('street name too long: ' + m.streetName);
        const head = Buffer.alloc(4);
        head.writeUInt16BE(m.distanceM, 0);
        head[2] = TURN_CODES[m.maneuver];
        head[3] = nameBuf.length;
        parts.push(head, nameBuf);
    }
    const frame = buildFrame({ type: TYPES.MANEUVERS, sessionId, seq: 0, total: 1,
        payload: Buffer.concat(parts) });
    return toWire(frame, encoding, 'MANEUVERS', sessionId, 0, 1);
}

export function encodeGuidance({ sessionId, x, y, heading, distToTurnM, maneuverIndex, speedKmh, speedLimitKmh, encoding = 'base64' }) {
    const payload = Buffer.alloc(11);
    payload.writeInt16BE(x, 0);
    payload.writeInt16BE(y, 2);
    payload.writeUInt16BE(heading, 4);
    payload.writeUInt16BE(distToTurnM, 6);
    payload[8] = maneuverIndex;
    payload[9] = speedKmh;
    payload[10] = speedLimitKmh;
    const frame = buildFrame({ type: TYPES.GUIDANCE, sessionId, seq: 0, total: 1, payload });
    return toWire(frame, encoding, 'GUIDANCE', sessionId, 0, 1);
}

export function encodeAck({ sessionId, ackedType, ackedSeq, encoding = 'base64' }) {
    const payload = Buffer.alloc(3);
    payload[0] = ackedType;
    payload.writeUInt16BE(ackedSeq, 1);
    const frame = buildFrame({ type: TYPES.ACK, sessionId, seq: 0, total: 1, payload });
    return toWire(frame, encoding, 'ACK', sessionId, 0, 1);
}

export function encodeResendRequest({ sessionId, reqType, seqs, encoding = 'base64' }) {
    const payload = Buffer.alloc(2 + seqs.length * 2);
    payload[0] = reqType;
    payload[1] = seqs.length;
    seqs.forEach((s, i) => payload.writeUInt16BE(s, 2 + i * 2));
    const frame = buildFrame({ type: TYPES.RESEND_REQUEST, sessionId, seq: 0, total: 1, payload });
    return toWire(frame, encoding, 'RESEND_REQUEST', sessionId, 0, 1);
}

export function encodeEnd({ sessionId, reason, encoding = 'base64' }) {
    const frame = buildFrame({ type: TYPES.END, sessionId, seq: 0, total: 1,
        payload: Buffer.from([reason]) });
    return toWire(frame, encoding, 'END', sessionId, 0, 1);
}

// Encode the whole trip-start sequence for one vehicle:
// HELLO, ROUTE_CHUNKs, ROADS_CHUNKs, MANEUVERS (send order, spec §4).
export function encodeTrip(fixture, { vehicle = 'motorbike', sessionId = 1, encoding = 'base64' } = {}) {
    const route = fixture.routes[vehicle === 'car' ? 'car' : 'motorbike'];
    const vehicleKey = vehicle === 'car' ? 'auto' : 'motor_scooter';
    const name = vehicle === 'car' ? 'Ô tô' : 'Xe máy';
    const messages = [
        encodeHello({ sessionId, vehicle: vehicleKey, name, encoding }),
        ...encodeRouteChunks({ sessionId, routeDelta: route.routeDelta, encoding }),
        ...encodeRoadsChunks({ sessionId, roadsMajorDelta: fixture.roadsMajorDelta,
            roadsMinorDelta: fixture.roadsMinorDelta, encoding }),
        encodeManeuvers({ sessionId, maneuvers: route.maneuvers, encoding })
    ];
    return { messages, stats: summarise(messages) };
}

export function summarise(messages) {
    const perType = {};
    let totalBytes = 0;
    for (const m of messages) {
        perType[m.typeName] = perType[m.typeName] || { count: 0, bytes: 0 };
        perType[m.typeName].count++;
        perType[m.typeName].bytes += m.wireLength;
        totalBytes += m.wireLength;
    }
    return { perType, totalMessages: messages.length, totalBytes,
        secondsAt5PerSec: messages.length / 5, secondsAt2PerSec: messages.length / 2 };
}

export function printTable(stats) {
    const lines = ['Loại tin | Số tin | Tổng byte', '--- | ---: | ---:'];
    for (const [name, s] of Object.entries(stats.perType)) {
        lines.push(name + ' | ' + s.count + ' | ' + s.bytes);
    }
    lines.push('**Tổng** | **' + stats.totalMessages + '** | **' + stats.totalBytes + '**');
    lines.push('');
    lines.push('Thời gian gửi ước lượng: ' + stats.secondsAt5PerSec.toFixed(1) +
        ' s ở 5 tin/giây; ' + stats.secondsAt2PerSec.toFixed(1) + ' s ở 2 tin/giây.');
    return lines.join('\n');
}

// CLI: node encode.js [motorbike|car] [sessionId] — prints the table and
// writes messages.json (wire messages for the trip start) next to this file.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const here = dirname(fileURLToPath(import.meta.url));
    const fixturePath = join(here, '..', '..', 'watch-lite-app', 'entry', 'src', 'main', 'js', 'MainAbility', 'common', 'fixture-real-map.js');
    const fixture = (await import(fixturePath)).default;
    const vehicle = process.argv[2] === 'car' ? 'car' : 'motorbike';
    const sessionId = Number(process.argv[3] || 1);
    const { messages, stats } = encodeTrip(fixture, { vehicle, sessionId });
    const outPath = join(here, 'messages.json');
    writeFileSync(outPath, JSON.stringify({ vehicle, sessionId, messages }, null, 2) + '\n');
    console.log('vehicle: ' + vehicle + '  sessionId: ' + sessionId);
    console.log(printTable(stats));
    console.log('wrote ' + outPath);
}
