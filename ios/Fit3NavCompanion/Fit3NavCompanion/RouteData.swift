// RouteData.swift
// Shared model types for the companion app. Coordinates use the same
// flat local projection as the watch (x east, y north, metres from the
// trip start). All types are Codable so the test target can load the
// JS fixture (fixture-real-map.json) and compare against it.
import Foundation

struct LatLon: Equatable, Codable {
    var lat: Double
    var lon: Double
}

struct ProjectedPoint: Equatable {
    var x: Int // metres east of the trip start
    var y: Int // metres north of the trip start
}

enum Turn: String, Equatable, Codable {
    case straight, left, right, uturn, arrive
    var code: UInt8 {
        switch self {
        case .straight: return 0
        case .left: return 1
        case .right: return 2
        case .uturn: return 3
        case .arrive: return 4
        }
    }
}

enum Vehicle: String, Equatable, CaseIterable {
    case motorScooter = "motor_scooter"
    case auto = "auto"
    var displayName: String {
        switch self {
        case .motorScooter: return "Xe máy"
        case .auto: return "Ô tô"
        }
    }
    var routeKey: String {
        switch self {
        case .motorScooter: return "motorbike"
        case .auto: return "car"
        }
    }
}

struct Maneuver: Equatable, Codable {
    var distanceM: Int
    var maneuver: Turn
    var streetName: String
}

struct RouteData: Equatable, Codable {
    var routeDelta: [Int] // flat int16 delta array, as in route-codec.js
    var maneuvers: [Maneuver]
    var lengthM: Int
}

struct TripData: Equatable, Codable {
    var routes: [String: RouteData] // "motorbike" / "car"
    var roadsMajorDelta: [[Int]]
    var roadsMinorDelta: [[Int]]

    static func fromJSON(_ data: Data) throws -> TripData {
        let raw = try JSONDecoder().decode(RawTripData.self, from: data)
        return TripData(routes: raw.routes, roadsMajorDelta: raw.roadsMajorDelta,
            roadsMinorDelta: raw.roadsMinorDelta)
    }

    private struct RawTripData: Decodable {
        var routes: [String: RouteData]
        var roadsMajorDelta: [[Int]]
        var roadsMinorDelta: [[Int]]
    }
}
