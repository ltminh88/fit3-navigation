// fixture-route.js
// Deterministic simulated route for the S1 canvas spike.
// No random numbers: the same build always produces the same arrays,
// so a timing run on the simulator and on the real watch are comparable.
//
// Main route: 200 points, about 2.92 km, starting at the user's
// position (0, 0). It has several 90-degree turns and one quarter-circle
// curve (radius 150 m). Legs are built from straight segments of 15 m
// per step plus the curve; see MAIN_LEGS below.
//   (0,0) -> north 360 -> east 300 -> north 285 -> curve east/north
//   150/150 -> east 360 -> south 315 -> east 240 -> north 390
//   -> west 195 -> north 240, ending at (855, 1110).
// Side roads: 13 roads crossing the main route, given as absolute
// coordinates and encoded with route-codec.js. Each road has a level
// ('major' or 'minor') in SIDE_ROAD_LEVELS, same order as
// SIDE_ROADS_ABS; the S1b nav screen draws the road hierarchy from
// it, the S1 map page ignores it (all side roads grey, 3 px).
// All data is stored in the delta format of route-codec.js.

import routeCodec from './route-codec.js';

var CURVE_RADIUS = 150;
var CURVE_STEPS = 20;

// [dxTotal, dyTotal, steps]; every leg divides into exact 15 m steps.
var MAIN_LEGS = [
    [0, 360, 24],
    [300, 0, 20],
    [0, 285, 19],
    [360, 0, 24],
    [0, -315, 21],
    [240, 0, 16],
    [0, 390, 26],
    [-195, 0, 13],
    [0, 240, 16]
];

// Absolute coordinates of the side roads (flat [x, y, x, y, ...]);
// The first 8 are the original S1 roads; the last 5 were added for
// S1b so the map looks less empty. Side roads may have 2-6 points.
var SIDE_ROADS_ABS = [
    [-120, 180, 120, 180],
    [150, 240, 150, 480],
    [180, 500, 420, 500],
    [300, 720, 600, 720],
    [600, 675, 600, 915],
    [690, 650, 930, 650],
    [1050, 360, 1050, 600],
    [930, 750, 930, 990],
    [-240, 60, -60, 60, 60, 60],
    [240, 120, 240, 300, 360, 300],
    [480, 840, 720, 840, 720, 1020],
    [840, 420, 840, 540],
    [60, 900, 300, 900]
];

// 3 major roads, 10 minor roads (same order as SIDE_ROADS_ABS).
var SIDE_ROAD_LEVELS = [
    'major', 'minor', 'major', 'minor', 'minor', 'major',
    'minor', 'minor', 'minor', 'minor', 'minor', 'minor', 'minor'
];

function buildMainRoute() {
    var delta = [0, 0];
    var legIndex;
    var step;
    var stepX;
    var stepY;
    var theta;
    var prevX;
    var prevY;
    var cumX;
    var cumY;
    for (legIndex = 0; legIndex < MAIN_LEGS.length; legIndex++) {
        if (legIndex === 3) {
            // Quarter-circle curve, northbound turning east.
            // Centre is CURVE_RADIUS east of the curve start; the angle
            // runs from PI (west of centre) to PI/2 (north of centre).
            prevX = 0;
            prevY = 0;
            for (step = 1; step <= CURVE_STEPS; step++) {
                theta = Math.PI - (step / CURVE_STEPS) * (Math.PI / 2);
                cumX = Math.round(CURVE_RADIUS +
                    CURVE_RADIUS * Math.cos(theta));
                cumY = Math.round(CURVE_RADIUS * Math.sin(theta));
                delta.push(cumX - prevX);
                delta.push(cumY - prevY);
                prevX = cumX;
                prevY = cumY;
            }
        }
        stepX = MAIN_LEGS[legIndex][0] / MAIN_LEGS[legIndex][2];
        stepY = MAIN_LEGS[legIndex][1] / MAIN_LEGS[legIndex][2];
        for (step = 0; step < MAIN_LEGS[legIndex][2]; step++) {
            delta.push(stepX);
            delta.push(stepY);
        }
    }
    return delta;
}

function buildSideRoads() {
    var roads = [];
    var i;
    var encoded;
    for (i = 0; i < SIDE_ROADS_ABS.length; i++) {
        encoded = routeCodec.encode(SIDE_ROADS_ABS[i]);
        // encode returns null only for invalid input; the hard-coded
        // roads above are all valid, so this is a safety net, not a
        // normal path.
        roads.push(encoded === null ? [] : encoded);
    }
    return roads;
}

var mainRouteDelta = buildMainRoute();
var sideRoadsDelta = buildSideRoads();

export default {
    mainRouteDelta: mainRouteDelta,
    sideRoadsDelta: sideRoadsDelta,
    sideRoadLevels: SIDE_ROAD_LEVELS,
    // 200 points: 1 start point + 199 steps (179 straight + 20 curve).
    mainPointCount: mainRouteDelta.length / 2,
    // Approximate total length in metres (straight legs 2685 m +
    // quarter-circle arc PI/2 * 150 m, about 236 m).
    routeLengthMetres: 2921
};
