// route-maneuver-extractor.js
// Finds the turn points of a decoded route polyline, once, at init.
// At each vertex where the direction changes by more than 30 degrees
// the turn is 'left' or 'right' by the sign of the bearing change:
// bearings grow clockwise from north, so a positive change (north
// turning toward east) is a RIGHT turn, a negative change is a LEFT
// turn. A continuous curve (small same-sign changes at
// every step) is merged into ONE turn at the END of the curve run:
// a run of one sharp vertex reports that vertex, a multi-vertex run
// reports the vertex where the run ends. Degenerate (near-zero)
// segments are ignored. Returns [{ distance, type }] with distance
// in metres from the start of the route, in route order.

import mapDrawHelpers from './map-draw-helpers.js';

var TURN_THRESHOLD_DEG = 30;
var MIN_SEGMENT_M = 0.5;

function extract(abs) {
    var maneuvers = [];
    var pointCount = abs.length / 2;
    var cumDist = [0];
    var total = 0;
    var i, dx, dy;
    var runTotal, runSign, runFirst, runLast;
    var b1, b2, delta, sign, posIndex;
    for (i = 2; i < abs.length; i += 2) {
        dx = abs[i] - abs[i - 2];
        dy = abs[i + 1] - abs[i - 1];
        total += Math.sqrt(dx * dx + dy * dy);
        cumDist.push(total);
    }
    runTotal = 0; runSign = 0; runFirst = -1; runLast = -1;
    for (i = 1; i < pointCount - 1; i++) {
        dx = abs[i * 2] - abs[i * 2 - 2];
        dy = abs[i * 2 + 1] - abs[i * 2 - 1];
        if (Math.sqrt(dx * dx + dy * dy) < MIN_SEGMENT_M) { delta = 0; }
        else {
            dx = abs[i * 2 + 2] - abs[i * 2];
            dy = abs[i * 2 + 3] - abs[i * 2 + 1];
            if (Math.sqrt(dx * dx + dy * dy) < MIN_SEGMENT_M) { delta = 0; }
            else {
                b1 = mapDrawHelpers.bearingDeg(
                    abs[i * 2 - 2], abs[i * 2 - 1], abs[i * 2], abs[i * 2 + 1]);
                b2 = mapDrawHelpers.bearingDeg(
                    abs[i * 2], abs[i * 2 + 1], abs[i * 2 + 2], abs[i * 2 + 3]);
                delta = mapDrawHelpers.turnDiffDeg(b1, b2);
            }
        }
        if (delta === 0) {
            if (runSign !== 0) {
                if (Math.abs(runTotal) > TURN_THRESHOLD_DEG) {
                    posIndex = runFirst === runLast ? runLast : i;
                    maneuvers.push({
                        distance: cumDist[posIndex],
                        type: runSign > 0 ? 'right' : 'left'
                    });
                }
                runTotal = 0; runSign = 0; runFirst = -1; runLast = -1;
            }
            continue;
        }
        sign = delta > 0 ? 1 : -1;
        if (runSign === 0) {
            runSign = sign; runTotal = delta; runFirst = i; runLast = i;
        } else if (sign === runSign || Math.abs(delta) <= TURN_THRESHOLD_DEG) {
            // Same direction, or small jitter the other way (the curve
            // points are rounded to integers, so one step can flip
            // sign): keep accumulating instead of splitting the run.
            runTotal += delta; runLast = i;
        } else {
            if (Math.abs(runTotal) > TURN_THRESHOLD_DEG) {
                posIndex = runFirst === runLast ? runLast : i;
                maneuvers.push({
                    distance: cumDist[posIndex],
                    type: runSign > 0 ? 'right' : 'left'
                });
            }
            runSign = sign; runTotal = delta; runFirst = i; runLast = i;
        }
    }
    if (runSign !== 0 && Math.abs(runTotal) > TURN_THRESHOLD_DEG) {
        maneuvers.push({
            distance: cumDist[runLast],
            type: runSign > 0 ? 'right' : 'left'
        });
    }
    return maneuvers;
}

export default {
    extract: extract
};
