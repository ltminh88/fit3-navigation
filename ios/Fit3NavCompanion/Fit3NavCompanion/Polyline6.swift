// Polyline6.swift
// Swift port of spikes/tools/real-map-fixture/polyline6.js.
// Decodes a Valhalla polyline6 string into [LatLon]. Precision 6
// (1e-6 degrees). Classic Google polyline algorithm: each coordinate
// delta is a variable-length base-64 number with the sign in the
// lowest bit. Int32 arithmetic mirrors the JS bitwise ops exactly.
import Foundation

enum Polyline6 {
    static func decode(_ str: String, precision: Int = 6) -> [LatLon] {
        let factor = pow(10.0, Double(precision))
        var points: [LatLon] = []
        let bytes = Array(str.utf8)
        var index = 0
        var lat: Int32 = 0
        var lon: Int32 = 0
        while index < bytes.count {
            var shift: Int32 = 0
            var result: Int32 = 0
            var b: Int32 = 0
            repeat {
                b = Int32(bytes[index]) - 63
                index += 1
                result |= (b & 0x1f) << shift
                shift += 5
            } while b >= 0x20
            lat += (result & 1) != 0 ? ~(result >> 1) : (result >> 1)
            shift = 0
            result = 0
            repeat {
                b = Int32(bytes[index]) - 63
                index += 1
                result |= (b & 0x1f) << shift
                shift += 5
            } while b >= 0x20
            lon += (result & 1) != 0 ? ~(result >> 1) : (result >> 1)
            points.append(LatLon(lat: Double(lat) / factor, lon: Double(lon) / factor))
        }
        return points
    }
}
