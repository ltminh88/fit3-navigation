// RouteCodec.swift
// Swift port of the watch's route-codec.js (delta int16 codec).
// Format: flat array [x0, y0, dx1, dy1, ...] in metres, origin = trip
// start, x east, y north. Every value must fit in Int16.
import Foundation

enum RouteCodec {
    static func isInt16(_ value: Int) -> Bool {
        value >= -32_768 && value <= 32_767
    }

    // Decode a delta array into absolute coordinates [x, y, x, y, ...].
    // Returns nil on invalid input (odd length, fewer than 2 values,
    // a value outside Int16, or a cumulative coordinate outside Int16).
    static func decode(_ delta: [Int]) -> [Int]? {
        guard delta.count >= 2, delta.count % 2 == 0,
            delta.allSatisfy(isInt16) else { return nil }
        var out = [Int](repeating: 0, count: delta.count)
        var x = delta[0]
        var y = delta[1]
        out[0] = x
        out[1] = y
        for i in stride(from: 2, to: delta.count, by: 2) {
            x += delta[i]
            y += delta[i + 1]
            guard isInt16(x), isInt16(y) else { return nil }
            out[i] = x
            out[i + 1] = y
        }
        return out
    }

    // Encode absolute coordinates into the delta format. Returns nil
    // on invalid input (same rules as decode).
    static func encode(_ abs: [Int]) -> [Int]? {
        guard abs.count >= 2, abs.count % 2 == 0,
            abs.allSatisfy(isInt16) else { return nil }
        var out = [Int](repeating: 0, count: abs.count)
        out[0] = abs[0]
        out[1] = abs[1]
        var prevX = abs[0]
        var prevY = abs[1]
        for i in stride(from: 2, to: abs.count, by: 2) {
            let dx = abs[i] - prevX
            let dy = abs[i + 1] - prevY
            guard isInt16(dx), isInt16(dy) else { return nil }
            out[i] = dx
            out[i + 1] = dy
            prevX = abs[i]
            prevY = abs[i + 1]
        }
        return out
    }

    // Flat absolute points -> big-endian Int16 bytes (for P2P frames).
    static func int16Bytes(_ values: [Int]) -> [UInt8] {
        var bytes: [UInt8] = []
        bytes.reserveCapacity(values.count * 2)
        for v in values {
            let u = UInt16(bitPattern: Int16(v))
            bytes.append(UInt8(u >> 8))
            bytes.append(UInt8(u & 0xFF))
        }
        return bytes
    }

    static func flatPoints(_ points: [ProjectedPoint]) -> [Int] {
        var flat: [Int] = []
        flat.reserveCapacity(points.count * 2)
        for p in points {
            flat.append(p.x)
            flat.append(p.y)
        }
        return flat
    }
}
