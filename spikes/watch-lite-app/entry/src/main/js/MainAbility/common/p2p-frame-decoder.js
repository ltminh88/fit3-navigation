// p2p-frame-decoder.js: watch-side decoder for the P2P protocol v1
// (docs/p2p-protocol.md). ES5 only. Decodes base64 itself (atob is not
// verified on lite wearable) and reassembles chunks into a
// fixture-real-map-shaped structure. Scratch arrays are reused;
// feed() returns the reused missing-seq array, or null on error.
var PROTOCOL_VERSION = 1, HEADER_LEN = 8;
var TYPE_HELLO = 1, TYPE_ROUTE_CHUNK = 2, TYPE_ROADS_CHUNK = 3, TYPE_MANEUVERS = 4;
var TYPE_GUIDANCE = 5, TYPE_ACK = 6, TYPE_RESEND_REQUEST = 7, TYPE_END = 8;
var MAX_ROUTE_POINTS = 64, MAX_ROADS = 400, MAX_ROAD_POINTS = 1024, MAX_MANEUVERS = 32;
var TURN_NAMES = ['straight', 'left', 'right', 'uturn', 'arrive'];
var B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
var B64_REV = {};
(function () { var i; for (i = 0; i < 64; i++) { B64_REV[B64_ALPHABET.charAt(i)] = i; } })();

// Decode a base64 string into out (bytes 0..255); returns byte count, or -1 on bad input.
function base64Decode(str, out) {
    var i, n = 0, a, b, c, d, pad2, pad3;
    if (!str || typeof str !== 'string' || str.length % 4 !== 0) { return -1; }
    out.length = 0;
    for (i = 0; i < str.length; i += 4) {
        a = B64_REV[str.charAt(i)]; b = B64_REV[str.charAt(i + 1)];
        pad2 = str.charAt(i + 2) === '='; pad3 = str.charAt(i + 3) === '=';
        c = pad2 ? 0 : B64_REV[str.charAt(i + 2)];
        d = pad3 ? 0 : B64_REV[str.charAt(i + 3)];
        if (a === undefined || b === undefined || c === undefined || d === undefined) { out.length = 0; return -1; }
        out[n++] = (a << 2) | (b >> 4);
        if (!pad2) { out[n++] = ((b & 15) << 4) | (c >> 2); }
        if (!pad3) { out[n++] = ((c & 3) << 6) | d; }
    }
    return n;
}

// Decode UTF-8 bytes into a JS string. Handles 1-3 byte sequences
// (enough for Vietnamese). Bad bytes become '?'.
function utf8Decode(bytes, off, len) {
    var s = '', end = off + len, i = off, c, c2, c3;
    while (i < end) {
        c = bytes[i];
        if (c < 128) { s += String.fromCharCode(c); i++; }
        else if ((c & 224) === 192 && i + 1 < end) { c2 = bytes[i + 1]; s += String.fromCharCode(((c & 31) << 6) | (c2 & 63)); i += 2; }
        else if ((c & 240) === 224 && i + 2 < end) { c2 = bytes[i + 1]; c3 = bytes[i + 2]; s += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)); i += 3; }
        else { s += '?'; i++; }
    }
    return s;
}

function u16be(bytes, off) { return (bytes[off] << 8) | bytes[off + 1]; }
function i16be(bytes, off) { var v = u16be(bytes, off); return v >= 32768 ? v - 65536 : v; }

function createDecoder() {
    var state = {
        sessionId: -1, hello: null, routeTotal: 0, routeSlots: [], routeReceived: 0,
        roadsTotal: 0, roadsSlots: [], roadsReceived: 0, maneuversBytes: null,
        guidance: { x: 0, y: 0, heading: 0, distToTurnM: 0, maneuverIndex: 0, speedKmh: 0, speedLimitKmh: 0 },
        lastError: '', bytes: [], missing: [], routeDelta: [], roadsMajorDelta: [], roadsMinorDelta: [], maneuvers: []
    };

    function resetSession(sessionId) {
        state.sessionId = sessionId; state.hello = null; state.maneuversBytes = null;
        state.routeTotal = 0; state.routeSlots = []; state.routeReceived = 0;
        state.roadsTotal = 0; state.roadsSlots = []; state.roadsReceived = 0;
    }

    function storeChunk(type, seq, total, payload) {
        var isRoute = type === TYPE_ROUTE_CHUNK, slots, i;
        if (seq >= total || total <= 0 || total > 512) { return false; }
        if (isRoute ? state.routeTotal !== total : state.roadsTotal !== total) {
            slots = []; for (i = 0; i < total; i++) { slots.push(null); }
            if (isRoute) { state.routeTotal = total; state.routeSlots = slots; state.routeReceived = 0; }
            else { state.roadsTotal = total; state.roadsSlots = slots; state.roadsReceived = 0; }
        }
        slots = isRoute ? state.routeSlots : state.roadsSlots;
        if (slots[seq] !== null) { return true; } // duplicate chunk: ignore
        slots[seq] = payload;
        if (isRoute) { state.routeReceived++; } else { state.roadsReceived++; }
        return true;
    }

    function isComplete(type) {
        if (type === TYPE_HELLO) { return state.hello !== null; }
        if (type === TYPE_ROUTE_CHUNK) { return state.routeTotal > 0 && state.routeReceived === state.routeTotal; }
        if (type === TYPE_ROADS_CHUNK) { return state.roadsTotal > 0 && state.roadsReceived === state.roadsTotal; }
        if (type === TYPE_MANEUVERS) { return state.maneuversBytes !== null; }
        return false;
    }

    function getMissing(type) {
        var slots = type === TYPE_ROUTE_CHUNK ? state.routeSlots : type === TYPE_ROADS_CHUNK ? state.roadsSlots : null;
        var i, missing = state.missing; missing.length = 0;
        if (slots === null) { return missing; }
        for (i = 0; i < slots.length; i++) { if (slots[i] === null) { missing.push(i); } }
        return missing;
    }

    function concatChunks(slots, out) {
        var i, j, chunk;
        out.length = 0;
        for (i = 0; i < slots.length; i++) { chunk = slots[i]; for (j = 0; j < chunk.length; j++) { out.push(chunk[j]); } }
        return out;
    }

    function getRoute() {
        var bytes = [], i;
        if (!isComplete(TYPE_ROUTE_CHUNK)) { return null; }
        concatChunks(state.routeSlots, bytes);
        if (bytes.length % 2 !== 0 || bytes.length / 2 > MAX_ROUTE_POINTS) { return null; }
        state.routeDelta.length = bytes.length / 2;
        for (i = 0; i < state.routeDelta.length; i++) { state.routeDelta[i] = i16be(bytes, i * 2); }
        return state.routeDelta;
    }

    function getRoads() {
        var bytes = [], off = 0, level, count, values, j, totalPoints = 0, roadCount = 0;
        if (!isComplete(TYPE_ROADS_CHUNK)) { return null; }
        concatChunks(state.roadsSlots, bytes);
        state.roadsMajorDelta.length = 0; state.roadsMinorDelta.length = 0;
        while (off + 3 <= bytes.length) {
            level = bytes[off]; count = u16be(bytes, off + 1); off += 3;
            if (count <= 0 || off + count * 4 > bytes.length) { return null; }
            totalPoints += count; roadCount++;
            if (totalPoints > MAX_ROAD_POINTS || roadCount > MAX_ROADS) { return null; }
            values = [];
            for (j = 0; j < count * 2; j++) { values.push(i16be(bytes, off + j * 2)); }
            off += count * 4;
            if (level === 1) { state.roadsMajorDelta.push(values); } else { state.roadsMinorDelta.push(values); }
        }
        if (off !== bytes.length) { return null; }
        return { roadsMajorDelta: state.roadsMajorDelta, roadsMinorDelta: state.roadsMinorDelta };
    }

    function getManeuvers() {
        var bytes = state.maneuversBytes, count, off = 1, i, dist, turn, nameLen;
        if (bytes === null) { return null; }
        count = bytes[0]; if (count > MAX_MANEUVERS) { return null; }
        state.maneuvers.length = 0;
        for (i = 0; i < count; i++) {
            if (off + 4 > bytes.length) { return null; }
            dist = u16be(bytes, off); turn = bytes[off + 2]; nameLen = bytes[off + 3]; off += 4;
            if (turn >= TURN_NAMES.length || off + nameLen > bytes.length) { return null; }
            state.maneuvers.push({ distanceM: dist, maneuver: TURN_NAMES[turn], streetName: utf8Decode(bytes, off, nameLen) });
            off += nameLen;
        }
        if (off !== bytes.length) { return null; }
        return state.maneuvers;
    }

    // Feed one base64 frame. Returns the reused missing-seq array
    // (empty when complete / for non-chunk types), or null on error.
    function feed(b64) {
        var n, version, type, sessionId, seq, total, payloadLen, g = state.guidance;
        state.missing.length = 0;
        n = base64Decode(b64, state.bytes);
        if (n < HEADER_LEN) { state.lastError = 'short frame'; return null; }
        version = state.bytes[0];
        if (version !== PROTOCOL_VERSION) { state.lastError = 'version'; return null; }
        type = state.bytes[1]; sessionId = u16be(state.bytes, 2);
        seq = u16be(state.bytes, 4); total = u16be(state.bytes, 6); payloadLen = n - HEADER_LEN;
        if (sessionId !== state.sessionId) { resetSession(sessionId); }
        if (type === TYPE_HELLO) {
            if (payloadLen < 3 || state.bytes[HEADER_LEN] !== 1 || state.bytes[HEADER_LEN + 2] > payloadLen - 3) { state.lastError = 'bad hello'; return null; }
            state.hello = { vehicle: state.bytes[HEADER_LEN + 1], name: utf8Decode(state.bytes, HEADER_LEN + 3, state.bytes[HEADER_LEN + 2]) };
            return state.missing;
        }
        if (type === TYPE_ROUTE_CHUNK || type === TYPE_ROADS_CHUNK) {
            if (!storeChunk(type, seq, total, state.bytes.slice(HEADER_LEN))) { state.lastError = 'bad chunk'; return null; }
            return getMissing(type);
        }
        if (type === TYPE_MANEUVERS) {
            if (seq !== 0 || total !== 1) { state.lastError = 'bad maneuvers'; return null; }
            state.maneuversBytes = state.bytes.slice(HEADER_LEN);
            return state.missing;
        }
        if (type === TYPE_GUIDANCE) {
            if (payloadLen !== 11) { state.lastError = 'bad guidance'; return null; }
            g.x = i16be(state.bytes, HEADER_LEN); g.y = i16be(state.bytes, HEADER_LEN + 2);
            g.heading = u16be(state.bytes, HEADER_LEN + 4); g.distToTurnM = u16be(state.bytes, HEADER_LEN + 6);
            g.maneuverIndex = state.bytes[HEADER_LEN + 8]; g.speedKmh = state.bytes[HEADER_LEN + 9];
            g.speedLimitKmh = state.bytes[HEADER_LEN + 10];
            return state.missing;
        }
        if (type === TYPE_ACK || type === TYPE_RESEND_REQUEST || type === TYPE_END) { return state.missing; }
        state.lastError = 'unknown type';
        return null;
    }

    return {
        feed: feed, isComplete: isComplete, getMissing: getMissing, getRoute: getRoute,
        getRoads: getRoads, getManeuvers: getManeuvers, getHello: function () { return state.hello; },
        getGuidance: function () { return state.guidance; }, getLastError: function () { return state.lastError; }
    };
}

export default {
    createDecoder: createDecoder, PROTOCOL_VERSION: PROTOCOL_VERSION,
    TYPE_HELLO: TYPE_HELLO, TYPE_ROUTE_CHUNK: TYPE_ROUTE_CHUNK, TYPE_ROADS_CHUNK: TYPE_ROADS_CHUNK,
    TYPE_MANEUVERS: TYPE_MANEUVERS, TYPE_GUIDANCE: TYPE_GUIDANCE, TYPE_ACK: TYPE_ACK,
    TYPE_RESEND_REQUEST: TYPE_RESEND_REQUEST, TYPE_END: TYPE_END
};
