// Build the S1c real-map fixture: fetch Valhalla routes (motorbike +
// car) and OSM roads, project + simplify, and write the generated
// fixture files + the byte-size stats.
//
// Run from the repo root:
//   node spikes/tools/real-map-fixture/build-real-map-fixture.js
// Needs network (Valhalla + Overpass, one call each per run) and
// Node >= 18. No npm packages, no secrets.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routeCodec from '../../watch-lite-app/entry/src/main/js/MainAbility/common/route-codec.js';
import {
  START, END, MAJOR_HIGHWAYS,
  ROUTE_TOLERANCE_M, ROAD_TOLERANCE_M, BBOX_MARGIN_M,
} from './constants.js';
import { fetchValhallaRoute } from './fetch-valhalla-route.js';
import { fetchOsmRoads } from './fetch-osm-roads.js';
import {
  project, projectPoints, simplify, mapManeuver,
  maneuverDistance, polylineLength,
} from './project-and-simplify.js';
import { writeFixtureFiles } from './format-fixture.js';
import { writeStats } from './write-stats.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const JS_ROOT = path.resolve(HERE, '../../watch-lite-app/entry/src/main/js/MainAbility/common');
const RESULTS = path.resolve(HERE, '../../results/s1c-real-map-data-size.md');
const TODAY = new Date().toISOString().slice(0, 10);

async function fetchRouteWithFallback(key, costings) {
  let lastError = null;
  for (const costing of costings) {
    try {
      const result = await fetchValhallaRoute(costing);
      console.log(`Valhalla ${key}: costing ${costing} OK (${result.shape.length} points, ${result.maneuvers.length} maneuvers, ${result.lengthKm} km)`);
      return result;
    } catch (e) {
      lastError = e;
      console.log(`Valhalla ${key}: costing ${costing} failed: ${e.message}`);
    }
  }
  throw new Error(`No Valhalla route for ${key}: ${lastError.message}`);
}

function bboxOfRoutes(routes) {
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  for (const route of Object.values(routes)) {
    for (const [lat, lon] of route.shape) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }
  }
  const marginLat = BBOX_MARGIN_M / 111320;
  const marginLon = BBOX_MARGIN_M / (111320 * Math.cos(START.lat * Math.PI / 180));
  return {
    south: minLat - marginLat,
    west: minLon - marginLon,
    north: maxLat + marginLat,
    east: maxLon + marginLon,
  };
}

async function main() {
  const routes = {
    motorbike: await fetchRouteWithFallback('motorbike', ['motor_scooter', 'motorcycle']),
    car: await fetchRouteWithFallback('car', ['auto']),
  };
  const bbox = bboxOfRoutes(routes);
  console.log(`Overpass bbox: ${bbox.south.toFixed(5)},${bbox.west.toFixed(5)},${bbox.north.toFixed(5)},${bbox.east.toFixed(5)}`);
  const ways = await fetchOsmRoads(bbox);
  console.log(`Overpass: ${ways.length} ways`);

  const outRoutes = {};
  const routeStats = {};
  for (const key of ['motorbike', 'car']) {
    const projected = projectPoints(routes[key].shape);
    const { points, kept } = simplify(projected, ROUTE_TOLERANCE_M);
    const flat = points.flat();
    const delta = routeCodec.encode(flat);
    if (!delta) {
      throw new Error(`Route ${key} does not fit int16`);
    }
    const maneuvers = routes[key].maneuvers.map((m) => ({
      distanceM: maneuverDistance(points, kept, m.begin_shape_index),
      maneuver: mapManeuver(m.instruction),
      streetName: (m.street_names && m.street_names[0]) || '',
    }));
    const lengthM = Math.round(polylineLength(points));
    outRoutes[key] = { routeDelta: delta, maneuvers, lengthM };
    routeStats[key] = {
      pointsBefore: projected.length,
      pointsAfter: points.length,
      bytes: points.length * 4,
      maneuvers: maneuvers.length,
      lengthM,
      valhallaKm: routes[key].lengthKm,
    };
  }

  const major = [];
  const minor = [];
  let roadPointsBefore = 0;
  let roadPointsAfter = 0;
  let skipped = 0;
  for (const way of ways) {
    const projected = projectPoints(way.points);
    roadPointsBefore += projected.length;
    const { points } = simplify(projected, ROAD_TOLERANCE_M);
    if (points.length < 2) {
      skipped++;
      continue;
    }
    roadPointsAfter += points.length;
    const delta = routeCodec.encode(points.flat());
    if (!delta) {
      skipped++;
      continue;
    }
    (MAJOR_HIGHWAYS.has(way.highway) ? major : minor).push(delta);
  }
  console.log(`Roads: ${major.length} major, ${minor.length} minor, ${skipped} skipped, ${roadPointsBefore} -> ${roadPointsAfter} points`);

  const stats = {
    created: TODAY,
    endProjected: project(END.lat, END.lon),
    waysMajor: major.length,
    waysMinor: minor.length,
    roadPointsBefore,
    roadPointsAfter,
    roadBytes: roadPointsAfter * 4,
    roadMessages1k: Math.ceil((roadPointsAfter * 4) / 1024),
    routeStats,
    routesIdentical: JSON.stringify(outRoutes.motorbike.routeDelta) === JSON.stringify(outRoutes.car.routeDelta),
  };
  writeFixtureFiles(JS_ROOT, TODAY, outRoutes, major, minor);
  writeStats(RESULTS, stats);

  console.log('--- STATS ---');
  console.log(`roads: ${stats.waysMajor} major + ${stats.waysMinor} minor ways, ${stats.roadPointsBefore} -> ${stats.roadPointsAfter} points, ${stats.roadBytes} bytes int16 = ${stats.roadMessages1k} x 1KB messages`);
  for (const key of ['motorbike', 'car']) {
    const s = routeStats[key];
    console.log(`${key}: ${s.lengthM} m, ${s.maneuvers} maneuvers, ${s.pointsBefore} -> ${s.pointsAfter} points, ${s.bytes} bytes = ${Math.ceil(s.bytes / 1024)} x 1KB`);
  }
  console.log(`routes identical: ${stats.routesIdentical}`);
  console.log('Wrote fixture-real-map.js, fixture-real-map-roads.js, s1c-real-map-data-size.md');
}

main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
