// route-codec.js
// Delta codec for a navigation route, shared by the watch spike (S1)
// and later by the phone side (Phase 03, P2P payload).
//
// Format: a flat array of integers, in metres, in a flat plane whose
// origin is the user's position: x points East, y points North.
//   [x0, y0, dx1, dy1, dx2, dy2, ...]
// where (x0, y0) is the first absolute point and every following pair
// is the delta from the previous point. Every value must fit in int16
// (-32768..32767); a route longer than that in one axis must be split
// before encoding (not handled here).
//
// Memory: decodeInto reuses the caller's outArr and creates no object
// per point. encode allocates one flat array (phone side only).

var INT16_MIN = -32768;
var INT16_MAX = 32767;

function isInt16(value) {
    return typeof value === 'number' && isFinite(value) &&
        Math.floor(value) === value &&
        value >= INT16_MIN && value <= INT16_MAX;
}

function isFlatIntArray(arr) {
    var i;
    if (!arr || typeof arr.length !== 'number') {
        return false;
    }
    for (i = 0; i < arr.length; i++) {
        if (!isInt16(arr[i])) {
            return false;
        }
    }
    return true;
}

// Decode a delta array into absolute coordinates:
//   [x, y, x, y, ...]
// Reuses outArr (its length is set to the decoded length) and returns
// the number of values written, or -1 when the input is invalid
// (odd length, fewer than 2 values, a value outside int16, or a
// cumulative coordinate outside int16). No object is created.
function decodeInto(deltaArr, outArr) {
    var i;
    var x;
    var y;
    if (!deltaArr || !outArr || deltaArr.length < 2 ||
            deltaArr.length % 2 !== 0) {
        return -1;
    }
    if (!isFlatIntArray(deltaArr)) {
        return -1;
    }
    outArr.length = deltaArr.length;
    x = deltaArr[0];
    y = deltaArr[1];
    outArr[0] = x;
    outArr[1] = y;
    for (i = 2; i < deltaArr.length; i += 2) {
        x += deltaArr[i];
        y += deltaArr[i + 1];
        if (x < INT16_MIN || x > INT16_MAX ||
                y < INT16_MIN || y > INT16_MAX) {
            outArr.length = 0;
            return -1;
        }
        outArr[i] = x;
        outArr[i + 1] = y;
    }
    return outArr.length;
}

// Encode absolute coordinates [x, y, x, y, ...] into the delta format
// above. Returns a new flat array, or null when the input is invalid
// (odd length, fewer than 2 values, a value outside int16, or a delta
// outside int16). Intended for the phone side; the watch only decodes.
function encode(absArr) {
    var out;
    var i;
    var prevX;
    var prevY;
    var dx;
    var dy;
    if (!absArr || absArr.length < 2 || absArr.length % 2 !== 0) {
        return null;
    }
    if (!isFlatIntArray(absArr)) {
        return null;
    }
    out = [];
    out.length = absArr.length;
    out[0] = absArr[0];
    out[1] = absArr[1];
    prevX = absArr[0];
    prevY = absArr[1];
    for (i = 2; i < absArr.length; i += 2) {
        dx = absArr[i] - prevX;
        dy = absArr[i + 1] - prevY;
        if (dx < INT16_MIN || dx > INT16_MAX ||
                dy < INT16_MIN || dy > INT16_MAX) {
            return null;
        }
        out[i] = dx;
        out[i + 1] = dy;
        prevX = absArr[i];
        prevY = absArr[i + 1];
    }
    return out;
}

export default {
    decodeInto: decodeInto,
    encode: encode
};
