// Shared constants for the S1c real-map fixture builder.
// Route: Chợ Bến Thành -> Nhà thờ Đức Bà, Ho Chi Minh City.
export const START = { lat: 10.77252, lon: 106.698 };
export const END = { lat: 10.77978, lon: 106.69902 };

export const VALHALLA_URL = 'https://valhalla1.openstreetmap.de/route';
export const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
export const USER_AGENT = 'fit3-navigation-spike';

export const ROUTE_TOLERANCE_M = 1;
export const ROAD_TOLERANCE_M = 2;
export const BBOX_MARGIN_M = 400;
export const FETCH_TIMEOUT_MS = 120000;

// Major roads (drawn with the orange/yellow hierarchy on the watch).
export const MAJOR_HIGHWAYS = new Set([
  'trunk', 'primary', 'secondary',
  'trunk_link', 'primary_link', 'secondary_link',
]);
// Minor roads (grey/white). Everything else in the Overpass query
// (tertiary, residential, unclassified, living_street, tertiary_link)
// is minor; service/footway/path/cycleway/steps/track are not fetched.
export const MINOR_HIGHWAYS = new Set([
  'tertiary', 'residential', 'unclassified', 'living_street',
  'tertiary_link',
]);

export const HIGHWAY_REGEX =
  '^(trunk|primary|secondary|tertiary|residential|unclassified|' +
  'living_street|trunk_link|primary_link|secondary_link|tertiary_link)$';
