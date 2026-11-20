// route-follow-simulator.js
// Simulates driving along a decoded route polyline at 10 m/s
// (36 km/h) by default, updated once per second like the S1 spike.
// Position is interpolated along the polyline by distance travelled.
// Heading is the compass bearing of the segment being driven,
// smoothed: the displayed heading turns at most 30 degrees per step
// toward the segment bearing, so the map swings round gradually at
// corners.
// State is created once by create() and reused; no object is created
// per step. The cumulative distances are measured once, in create().
// speedMPerS is set by the caller (the nav screen drives at 8 m/s on
// a motorbike, 10 m/s in a car). When wrap is false, travel stops at
// the end of the route instead of looping (the caller holds the
// arrival screen and calls reset() to start again).

import mapDrawHelpers from './map-draw-helpers.js';

var SPEED_M_PER_S = 10;
var MAX_TURN_DEG_PER_S = 30;

function create(abs, wrap) {
    var state = {
        abs: abs,
        wrap: wrap === undefined ? true : wrap,
        speedMPerS: SPEED_M_PER_S,
        cumDist: [],
        totalLength: 0,
        travelled: 0,
        segIndex: 0,
        posX: abs.length > 0 ? abs[0] : 0,
        posY: abs.length > 1 ? abs[1] : 0,
        segHeading: 0,
        heading: 0
    };
    var i, dx, dy;
    state.cumDist.push(0);
    for (i = 2; i < abs.length; i += 2) {
        dx = abs[i] - abs[i - 2];
        dy = abs[i + 1] - abs[i - 1];
        state.totalLength += Math.sqrt(dx * dx + dy * dy);
        state.cumDist.push(state.totalLength);
    }
    if (abs.length >= 4) {
        state.segHeading = mapDrawHelpers.bearingDeg(
            abs[0], abs[1], abs[2], abs[3]);
        state.heading = state.segHeading;
    }
    return state;
}

// Back to the start of the route (after the arrival hold, or when
// the vehicle changes).
function reset(state) {
    state.travelled = 0;
    state.segIndex = 0;
    state.posX = state.abs.length > 0 ? state.abs[0] : 0;
    state.posY = state.abs.length > 1 ? state.abs[1] : 0;
    if (state.abs.length >= 4) {
        state.segHeading = mapDrawHelpers.bearingDeg(
            state.abs[0], state.abs[1], state.abs[2], state.abs[3]);
    }
    state.heading = state.segHeading;
}

function step(state, dtSeconds) {
    var segStart, segLen, frac, diff, x1, y1, x2, y2;
    state.travelled += state.speedMPerS * dtSeconds;
    if (state.travelled >= state.totalLength) {
        if (state.wrap) {
            state.travelled -= state.totalLength;
            state.segIndex = 0;
        } else {
            state.travelled = state.totalLength;
            state.segIndex = state.cumDist.length - 2;
        }
    }
    while (state.segIndex < state.cumDist.length - 2 &&
        state.travelled > state.cumDist[state.segIndex + 1]) {
        state.segIndex++;
    }
    segStart = state.cumDist[state.segIndex];
    segLen = state.cumDist[state.segIndex + 1] - segStart;
    frac = segLen > 0 ? (state.travelled - segStart) / segLen : 0;
    x1 = state.abs[state.segIndex * 2];
    y1 = state.abs[state.segIndex * 2 + 1];
    x2 = state.abs[state.segIndex * 2 + 2];
    y2 = state.abs[state.segIndex * 2 + 3];
    state.posX = x1 + (x2 - x1) * frac;
    state.posY = y1 + (y2 - y1) * frac;
    state.segHeading = mapDrawHelpers.bearingDeg(x1, y1, x2, y2);
    diff = mapDrawHelpers.turnDiffDeg(state.heading, state.segHeading);
    if (diff > MAX_TURN_DEG_PER_S) {
        state.heading = mapDrawHelpers.normDeg(
            state.heading + MAX_TURN_DEG_PER_S);
    } else if (diff < -MAX_TURN_DEG_PER_S) {
        state.heading = mapDrawHelpers.normDeg(
            state.heading - MAX_TURN_DEG_PER_S);
    } else {
        state.heading = state.segHeading;
    }
}

// Fill out[] with [posX, posY, ...points from segIndex + 1 onward]:
// the not-yet-driven part of the route. out is reused every frame,
// so no array is created while drawing.
function remainingAbs(state, out) {
    var i, k = 0;
    out[k++] = state.posX;
    out[k++] = state.posY;
    for (i = state.segIndex + 1; i < state.abs.length / 2; i++) {
        out[k++] = state.abs[i * 2];
        out[k++] = state.abs[i * 2 + 1];
    }
    out.length = k;
    return out;
}

export default {
    create: create,
    step: step,
    reset: reset,
    remainingAbs: remainingAbs,
    speedMPerS: SPEED_M_PER_S,
    maxTurnDegPerS: MAX_TURN_DEG_PER_S
};
