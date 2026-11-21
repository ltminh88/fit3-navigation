// ValhallaClient.swift
// Fetches one route from the public Valhalla demo server, mirroring
// spikes/tools/real-map-fixture/fetch-valhalla-route.js: POST with
// locations, costing and language vi-VN, User-Agent
// "fit3-navigation-spike", 120 s timeout. Sends only the two
// coordinates the user entered — no personal information.
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking // URLSession lives here on Linux
#endif

struct ValhallaManeuver: Decodable {
    var beginShapeIndex: Int
    var instruction: String
    var streetNames: [String]?

    enum CodingKeys: String, CodingKey {
        case beginShapeIndex = "begin_shape_index"
        case instruction
        case streetNames = "street_names"
    }
}

struct ValhallaRoute {
    var costing: String
    var shape: [LatLon]
    var maneuvers: [ValhallaManeuver]
    var lengthKm: Double?
    var timeS: Double?
}

enum ValhallaError: Error, LocalizedError {
    case http(Int)
    case api(String)
    case noShape
    case decode(Error)

    var errorDescription: String? {
        switch self {
        case .http(let code): return "Valhalla: HTTP \(code)"
        case .api(let msg): return "Valhalla: \(msg)"
        case .noShape: return "Valhalla: no shape in response"
        case .decode(let e): return "Valhalla: cannot parse response (\(e.localizedDescription))"
        }
    }
}

enum ValhallaClient {
    static let url = URL(string: "https://valhalla1.openstreetmap.de/route")!
    static let userAgent = "fit3-navigation-spike"
    static let timeout: TimeInterval = 120

    private struct Response: Decodable {
        struct Trip: Decodable {
            struct Leg: Decodable {
                var shape: String?
                var maneuvers: [ValhallaManeuver]?
            }
            struct Summary: Decodable {
                var length: Double?
                var time: Double?
            }
            var legs: [Leg]?
            var summary: Summary?
        }
        var trip: Trip?
        var error: String?
    }

    static func fetchRoute(costing: String, start: LatLon, end: LatLon) async throws -> ValhallaRoute {
        var request = URLRequest(url: url, timeoutInterval: timeout)
        request.httpMethod = "POST"
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = [
            "locations": [
                ["lat": start.lat, "lon": start.lon],
                ["lat": end.lat, "lon": end.lon]
            ],
            "costing": costing,
            "language": "vi-VN"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw ValhallaError.http(-1)
        }
        guard http.statusCode == 200 else {
            throw ValhallaError.http(http.statusCode)
        }
        let decoded: Response
        do {
            decoded = try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw ValhallaError.decode(error)
        }
        if let apiError = decoded.error {
            throw ValhallaError.api(apiError)
        }
        guard let shapeString = decoded.trip?.legs?.first?.shape else {
            throw ValhallaError.noShape
        }
        return ValhallaRoute(
            costing: costing,
            shape: Polyline6.decode(shapeString),
            maneuvers: decoded.trip?.legs?.first?.maneuvers ?? [],
            lengthKm: decoded.trip?.summary?.length,
            timeS: decoded.trip?.summary?.time)
    }
}
