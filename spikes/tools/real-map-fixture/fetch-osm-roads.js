// Fetch OSM ways (with geometry) in a bbox from the Overpass API.
// One call per run. Returns [{ highway, points: [[lat, lon], ...] }].
// Only drivable road types are requested; service roads, footways,
// paths, cycleways, steps and tracks are excluded by the query.
import { OVERPASS_URL, USER_AGENT, FETCH_TIMEOUT_MS, HIGHWAY_REGEX } from './constants.js';

export async function fetchOsmRoads(bbox) {
  const query =
    '[out:json][timeout:90];' +
    `way["highway"~"${HIGHWAY_REGEX}"]` +
    `(${bbox.south},${bbox.west},${bbox.north},${bbox.east});out geom;`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT },
    body: 'data=' + encodeURIComponent(query),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Overpass: HTTP ${res.status}`);
  }
  const json = await res.json();
  const ways = [];
  for (const el of json.elements ?? []) {
    if (el.type !== 'way' || !Array.isArray(el.geometry) || el.geometry.length < 2) {
      continue;
    }
    const highway = el.tags?.highway;
    if (typeof highway !== 'string') {
      continue;
    }
    ways.push({ highway, points: el.geometry.map((g) => [g.lat, g.lon]) });
  }
  return ways;
}
