// GeoProjection.swift
// Swift port of spikes/tools/real-map-fixture/project-and-simplify.js.
// Local flat projection (equirectangular, origin = trip start),
// Douglas-Peucker simplification keeping original indices, and the
// Valhalla maneuver -> watch maneuver mapping. Rounding matches JS
// Math.round exactly (floor(x + 0.5)) so projected metres agree.
import Foundation

enum GeoProjection {
    static let start = LatLon(lat: 10.77252, lon: 106.698)
    static let end = LatLon(lat: 10.77978, lon: 106.69902)

    private static let earthRadiusM = 6_371_000.0
    private static let metresPerDegLat = earthRadiusM * Double.pi / 180.0
    private static let metresPerDegLon = metresPerDegLat * cos(start.lat * Double.pi / 180.0)

    // JS Math.round: rounds half up (toward +infinity). Swift's
    // .rounded() rounds half away from zero, which differs for
    // negative .5 values, so do it the JS way.
    static func jsRound(_ value: Double) -> Int {
        Int(floor(value + 0.5))
    }

    static func project(_ point: LatLon) -> ProjectedPoint {
        ProjectedPoint(
            x: jsRound((point.lon - start.lon) * metresPerDegLon),
            y: jsRound((point.lat - start.lat) * metresPerDegLat))
    }

    // Inverse of project, for drawing the route on a map. Approximate
    // to ~1 m, which is the projection's own rounding.
    static func unproject(_ point: ProjectedPoint) -> LatLon {
        LatLon(
            lat: start.lat + Double(point.y) / metresPerDegLat,
            lon: start.lon + Double(point.x) / metresPerDegLon)
    }

    static func projectPoints(_ points: [LatLon]) -> [ProjectedPoint] {
        points.map { project($0) }
    }

    static func polylineLength(_ points: [ProjectedPoint]) -> Double {
        var total = 0.0
        for i in 1..<points.count {
            total += hypot(Double(points[i].x - points[i - 1].x),
                Double(points[i].y - points[i - 1].y))
        }
        return total
    }

    private static func pointSegmentDistance(_ p: ProjectedPoint, _ a: ProjectedPoint, _ b: ProjectedPoint) -> Double {
        let dx = Double(b.x - a.x)
        let dy = Double(b.y - a.y)
        let len2 = dx * dx + dy * dy
        if len2 == 0 {
            return hypot(Double(p.x - a.x), Double(p.y - a.y))
        }
        var t = (Double(p.x - a.x) * dx + Double(p.y - a.y) * dy) / len2
        t = max(0, min(1, t))
        return hypot(Double(p.x) - (Double(a.x) + t * dx), Double(p.y) - (Double(a.y) + t * dy))
    }

    // Douglas-Peucker. Returns the simplified points plus `kept`, where
    // kept[i] is the original index of simplified point i. Endpoints
    // are always kept. Strict `>` comparison matches the JS version,
    // so ties keep the first (lowest-index) point.
    static func simplify(_ points: [ProjectedPoint], tolerance: Double) -> (points: [ProjectedPoint], kept: [Int]) {
        let n = points.count
        if n <= 2 {
            return (points, Array(0..<n))
        }
        var keep = [Bool](repeating: false, count: n)
        keep[0] = true
        keep[n - 1] = true
        var stack: [(Int, Int)] = [(0, n - 1)]
        while let (a, b) = stack.popLast() {
            var maxDist = 0.0
            var maxIndex = -1
            for i in (a + 1)..<b {
                let d = pointSegmentDistance(points[i], points[a], points[b])
                if d > maxDist {
                    maxDist = d
                    maxIndex = i
                }
            }
            if maxDist > tolerance && maxIndex >= 0 {
                keep[maxIndex] = true
                stack.append((a, maxIndex))
                stack.append((maxIndex, b))
            }
        }
        var simplified: [ProjectedPoint] = []
        var kept: [Int] = []
        for i in 0..<n where keep[i] {
            simplified.append(points[i])
            kept.append(i)
        }
        return (simplified, kept)
    }

    // Distance (metres) along the SIMPLIFIED polyline to the maneuver at
    // original shape index beginIndex: use the last kept point at or
    // before beginIndex, so the distance matches what the watch drives.
    static func maneuverDistance(simplified: [ProjectedPoint], kept: [Int], beginIndex: Int) -> Int {
        var k = 0
        while k + 1 < kept.count && kept[k + 1] <= beginIndex {
            k += 1
        }
        var d = 0.0
        for i in 1..<(k + 1) {
            d += hypot(Double(simplified[i].x - simplified[i - 1].x),
                Double(simplified[i].y - simplified[i - 1].y))
        }
        return jsRound(d)
    }

    // Valhalla instruction (vi-VN) -> watch maneuver type. The "đến"
    // check must come before "trái"/"phải": the arrival instruction
    // mentions the left side.
    static func mapManeuver(_ instruction: String) -> Turn {
        let s = instruction.lowercased()
        if s.contains("quay đầu") { return .uturn }
        if s.contains("đến") || s.contains("đích") { return .arrive }
        if s.contains("vòng xuyến") || s.contains("vòng xoay") { return .straight }
        if s.contains("trái") { return .left }
        if s.contains("phải") { return .right }
        return .straight
    }
}
