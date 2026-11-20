// real-map-loader.js
// Decode the S1c real-map fixture once, at init: both routes
// (motorbike + car), all roads with their hierarchy level, and a
// flat bbox array per road for the per-frame visibility filter.
// Returns { routeAbs, sideAbsList, sideLevels, roadBboxes }, or null
// when any delta array fails to decode (the page then stays blank).

import routeCodec from './route-codec.js';
import fixtureRealMap from './fixture-real-map.js';
import mapDrawHelpers from './map-draw-helpers.js';

function load() {
    var data = { routeAbs: {}, sideAbsList: [], sideLevels: [], roadBboxes: [] };
    var i, decoded;
    for (i = 0; i < 2; i++) {
        decoded = [];
        if (routeCodec.decodeInto(fixtureRealMap.routes[i === 0 ? 'motorbike' : 'car'].routeDelta, decoded) < 0) {
            return null;
        }
        data.routeAbs[i === 0 ? 'motorbike' : 'car'] = decoded;
    }
    for (i = 0; i < fixtureRealMap.roadsMajorDelta.length; i++) {
        decoded = [];
        if (routeCodec.decodeInto(fixtureRealMap.roadsMajorDelta[i], decoded) < 0) {
            return null;
        }
        data.sideAbsList.push(decoded);
        data.sideLevels.push('major');
    }
    for (i = 0; i < fixtureRealMap.roadsMinorDelta.length; i++) {
        decoded = [];
        if (routeCodec.decodeInto(fixtureRealMap.roadsMinorDelta[i], decoded) < 0) {
            return null;
        }
        data.sideAbsList.push(decoded);
        data.sideLevels.push('minor');
    }
    data.roadBboxes = mapDrawHelpers.buildRoadBboxes(data.sideAbsList);
    return data;
}

export default {
    load: load
};
