// Local flat projection (equirectangular, origin = start point),
// Douglas-Peucker simplification keeping original indices, and the
// Valhalla maneuver -> watch maneuver mapping.
import { START } from './constants.js';

const EARTH_R_M = 6371000;
const DEG = Math.PI / 180;
const METRES_PER_DEG_LAT = EARTH_R_M * DEG;
const METRES_PER_DEG_LON = EARTH_R_M * DEG * Math.cos(START.lat * DEG);

// Project (lat, lon) to integer metres: x east, y north from START.
export function project(lat, lon) {
  return [
    Math.round((lon - START.lon) * METRES_PER_DEG_LON),
    Math.round((lat - START.lat) * METRES_PER_DEG_LAT),
  ];
}

export function projectPoints(latLonPoints) {
  return latLonPoints.map(([lat, lon]) => project(lat, lon));
}

export function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return total;
}

function pointSegmentDistance(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    return Math.hypot(p[0] - a[0], p[1] - a[1]);
  }
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

// Douglas-Peucker. Returns { points, kept } where kept[i] is the
// original index of simplified point i. Endpoints are always kept.
export function simplify(points, toleranceM) {
  const n = points.length;
  if (n <= 2) {
    return { points: points.slice(), kept: points.map((_, i) => i) };
  }
  const keep = new Array(n).fill(false);
  keep[0] = true;
  keep[n - 1] = true;
  const stack = [[0, n - 1]];
  while (stack.length > 0) {
    const [a, b] = stack.pop();
    let maxDist = 0;
    let maxIndex = -1;
    for (let i = a + 1; i < b; i++) {
      const d = pointSegmentDistance(points[i], points[a], points[b]);
      if (d > maxDist) {
        maxDist = d;
        maxIndex = i;
      }
    }
    if (maxDist > toleranceM && maxIndex >= 0) {
      keep[maxIndex] = true;
      stack.push([a, maxIndex], [maxIndex, b]);
    }
  }
  const simplified = [];
  const kept = [];
  for (let i = 0; i < n; i++) {
    if (keep[i]) {
      simplified.push(points[i]);
      kept.push(i);
    }
  }
  return { points: simplified, kept };
}

// Distance (metres) along the SIMPLIFIED polyline to the maneuver at
// original shape index beginIndex: use the last kept point at or
// before beginIndex, so the distance matches what the watch drives
// (the error is at most the simplify tolerance).
export function maneuverDistance(simplified, kept, beginIndex) {
  let k = 0;
  while (k + 1 < kept.length && kept[k + 1] <= beginIndex) {
    k++;
  }
  let d = 0;
  for (let i = 1; i <= k; i++) {
    d += Math.hypot(simplified[i][0] - simplified[i - 1][0], simplified[i][1] - simplified[i - 1][1]);
  }
  return Math.round(d);
}

// Valhalla instruction (vi-VN) -> watch maneuver type.
// Sharp/slight turns both map to left/right; roundabouts map to
// straight for now (the watch has no roundabout icon yet); the
// destination maps to 'arrive'. The "đến" check must come before
// "trái"/"phải": the arrival instruction mentions the left side.
export function mapManeuver(instruction) {
  const s = (instruction || '').toLowerCase();
  if (s.includes('quay đầu')) return 'uturn';
  if (s.includes('đến') || s.includes('đích')) return 'arrive';
  if (s.includes('vòng xuyến') || s.includes('vòng xoay')) return 'straight';
  if (s.includes('trái')) return 'left';
  if (s.includes('phải')) return 'right';
  return 'straight';
}
