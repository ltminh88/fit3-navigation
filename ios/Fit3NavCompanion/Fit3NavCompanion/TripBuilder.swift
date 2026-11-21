// TripBuilder.swift
// Orchestrates a trip build, mirroring
// spikes/tools/real-map-fixture/build-real-map-fixture.js: fetch the
// Valhalla route (motor_scooter, falling back to motorcycle; auto for
// cars), fetch OSM roads in a bbox around the route (+400 m margin),
// project + simplify (1 m route, 2 m roads), encode int16 deltas, map
// maneuvers. Throws TripError with a human-readable message.
import Foundation

enum TripError: Error, LocalizedError {
    case routeFailed(String)
    case routeDoesNotFitInt16
    case roadsFailed(Error)

    var errorDescription: String? {
        switch self {
        case .routeFailed(let msg): return msg
        case .routeDoesNotFitInt16: return "Tuyến đường không vừa int16"
        case .roadsFailed(let e): return e.localizedDescription
        }
    }
}

enum TripBuilder {
    static let routeToleranceM = 1.0
    static let roadToleranceM = 2.0
    static let bboxMarginM = 400.0
    // Same split as the JS fixture builder (constants.js).
    static let majorHighways: Set<String> = [
        "trunk", "primary", "secondary",
        "trunk_link", "primary_link", "secondary_link"
    ]

    static func bboxOfRoutes(_ shapes: [[LatLon]]) -> BBox {
        var minLat = 90.0, maxLat = -90.0, minLon = 180.0, maxLon = -180.0
        for shape in shapes {
            for p in shape {
                minLat = min(minLat, p.lat)
                maxLat = max(maxLat, p.lat)
                minLon = min(minLon, p.lon)
                maxLon = max(maxLon, p.lon)
            }
        }
        let marginLat = bboxMarginM / 111_320
        let marginLon = bboxMarginM / (111_320 * cos(GeoProjection.start.lat * Double.pi / 180.0))
        return BBox(south: minLat - marginLat, west: minLon - marginLon,
            north: maxLat + marginLat, east: maxLon + marginLon)
    }

    static func buildRoute(_ valhalla: ValhallaRoute) throws -> RouteData {
        let projected = GeoProjection.projectPoints(valhalla.shape)
        let (points, kept) = GeoProjection.simplify(projected, tolerance: routeToleranceM)
        guard let delta = RouteCodec.encode(RouteCodec.flatPoints(points)) else {
            throw TripError.routeDoesNotFitInt16
        }
        let maneuvers = valhalla.maneuvers.map { m in
            Maneuver(
                distanceM: GeoProjection.maneuverDistance(simplified: points, kept: kept,
                    beginIndex: m.beginShapeIndex),
                maneuver: GeoProjection.mapManeuver(m.instruction),
                streetName: m.streetNames?.first ?? "")
        }
        return RouteData(routeDelta: delta, maneuvers: maneuvers,
            lengthM: GeoProjection.jsRound(GeoProjection.polylineLength(points)))
    }

    static func buildRoads(_ ways: [OsmWay]) -> (major: [[Int]], minor: [[Int]]) {
        var major: [[Int]] = []
        var minor: [[Int]] = []
        for way in ways {
            let projected = GeoProjection.projectPoints(way.points)
            let (points, _) = GeoProjection.simplify(projected, tolerance: roadToleranceM)
            guard points.count >= 2,
                let delta = RouteCodec.encode(RouteCodec.flatPoints(points)) else { continue }
            if majorHighways.contains(way.highway) {
                major.append(delta)
            } else {
                minor.append(delta)
            }
        }
        return (major, minor)
    }

    // Fetch both costings, then roads, and assemble the TripData.
    // Note: GeoProjection.project uses GeoProjection.start as the
    // origin, so origin/destination inputs only change the fetched
    // route, not the projection origin (same as the JS builder).
    static func buildTrip(start: LatLon, end: LatLon) async throws -> TripData {
        let motorbike = try await fetchRouteWithFallback(key: "motorbike",
            costings: ["motor_scooter", "motorcycle"], start: start, end: end)
        let car = try await ValhallaClient.fetchRoute(costing: "auto", start: start, end: end)
        let bbox = bboxOfRoutes([motorbike.shape, car.shape])
        let ways: [OsmWay]
        do {
            ways = try await OverpassClient.fetchRoads(bbox: bbox)
        } catch {
            throw TripError.roadsFailed(error)
        }
        let roads = buildRoads(ways)
        return TripData(
            routes: [
                "motorbike": try buildRoute(motorbike),
                "car": try buildRoute(car)
            ],
            roadsMajorDelta: roads.major,
            roadsMinorDelta: roads.minor)
    }

    private static func fetchRouteWithFallback(key: String, costings: [String],
        start: LatLon, end: LatLon) async throws -> ValhallaRoute {
        var lastError: Error?
        for costing in costings {
            do {
                return try await ValhallaClient.fetchRoute(costing: costing, start: start, end: end)
            } catch {
                lastError = error
            }
        }
        throw TripError.routeFailed("No Valhalla route for \(key): \(lastError?.localizedDescription ?? "?")")
    }
}
