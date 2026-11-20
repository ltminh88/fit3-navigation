// Fetch one Valhalla route (shape + maneuvers) for a costing.
// Uses the public Valhalla demo server; one call per costing per run.
import { decodePolyline6 } from './polyline6.js';
import {
  VALHALLA_URL, USER_AGENT, FETCH_TIMEOUT_MS, START, END,
} from './constants.js';

export async function fetchValhallaRoute(costing) {
  const body = {
    locations: [START, END],
    costing,
    language: 'vi-VN',
  };
  const res = await fetch(VALHALLA_URL, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Valhalla ${costing}: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Valhalla ${costing}: ${JSON.stringify(json.error)}`);
  }
  const leg = json.trip?.legs?.[0];
  if (!leg || typeof leg.shape !== 'string') {
    throw new Error(`Valhalla ${costing}: no shape in response`);
  }
  return {
    costing,
    shape: decodePolyline6(leg.shape),
    maneuvers: leg.maneuvers ?? [],
    lengthKm: json.trip?.summary?.length ?? null,
    timeS: json.trip?.summary?.time ?? null,
  };
}
