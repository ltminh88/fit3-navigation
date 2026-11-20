// OverpassClient.swift
// Fetches OSM ways (with geometry) in a bbox from the Overpass API,
// mirroring spikes/tools/real-map-fixture/fetch-osm-roads.js.
// Only drivable road types are requested; service roads, footways,
// paths, cycleways, steps and tracks are excluded by the query.
// User-Agent "fit3-navigation-spike", 120 s timeout. Sends only the
// bbox coordinates — no personal information.
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking // URLSession lives here on Linux
#endif

struct BBox {
    var south: Double
    var west: Double
    var north: Double
    var east: Double
}

struct OsmWay {
    var highway: String
    var points: [LatLon]
}

enum OverpassError: Error, LocalizedError {
    case http(Int)
    case decode(Error)

    var errorDescription: String? {
        switch self {
        case .http(let code): return "Overpass: HTTP \(code)"
        case .decode(let e): return "Overpass: cannot parse response (\(e.localizedDescription))"
        }
    }
}

enum OverpassClient {
    static let url = URL(string: "https://overpass-api.de/api/interpreter")!
    static let userAgent = "fit3-navigation-spike"
    static let timeout: TimeInterval = 120
    // Same road types as the JS fixture builder (constants.js).
    static let highwayRegex = "^(trunk|primary|secondary|tertiary|residential|unclassified|living_street|trunk_link|primary_link|secondary_link|tertiary_link)$"

    private struct Response: Decodable {
        struct Element: Decodable {
            struct Geometry: Decodable {
                var lat: Double
                var lon: Double
            }
            struct Tags: Decodable {
                var highway: String?
            }
            var type: String?
            var geometry: [Geometry]?
            var tags: Tags?
        }
        var elements: [Element]?
    }

    static func query(bbox: BBox) -> String {
        "[out:json][timeout:90];" +
        "way[\"highway\"~\"\(highwayRegex)\"]" +
        "(\(bbox.south),\(bbox.west),\(bbox.north),\(bbox.east));out geom;"
    }

    // JS encodeURIComponent: leaves A-Z a-z 0-9 - _ . ! ~ * ' ( ) ,
    // percent-encodes everything else (including ; , & =).
    static func jsEncodeURIComponent(_ string: String) -> String {
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-_.!~*'()")
        return string.addingPercentEncoding(withAllowedCharacters: allowed) ?? ""
    }

    static func fetchRoads(bbox: BBox) async throws -> [OsmWay] {
        var request = URLRequest(url: url, timeoutInterval: timeout)
        request.httpMethod = "POST"
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        let bodyString = "data=" + jsEncodeURIComponent(query(bbox: bbox))
        request.httpBody = bodyString.data(using: .utf8)
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw OverpassError.http(-1)
        }
        guard http.statusCode == 200 else {
            throw OverpassError.http(http.statusCode)
        }
        let decoded: Response
        do {
            decoded = try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw OverpassError.decode(error)
        }
        var ways: [OsmWay] = []
        for el in decoded.elements ?? [] {
            guard el.type == "way",
                let geometry = el.geometry, geometry.count >= 2,
                let highway = el.tags?.highway else { continue }
            ways.append(OsmWay(highway: highway,
                points: geometry.map { LatLon(lat: $0.lat, lon: $0.lon) }))
        }
        return ways
    }
}
