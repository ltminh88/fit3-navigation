// P2PEncoder.swift
// Phone-side encoder for the P2P protocol v1 (docs/p2p-protocol.md),
// Swift port of spikes/tools/p2p-encoder/encode.js. Builds binary
// frames (big-endian), then encodes them for the wire: base64 by
// default (Wear Engine payloads are strings), or raw binary with
// encoding "binary". Every wire message is <= 1000 bytes.
import Foundation

enum P2PEncoder {
    static let protocolVersion: UInt8 = 1
    static let headerLength = 8
    static let chunkPayload = 700 // frame 708 bytes -> 944 base64 chars
    static let maxWire = 1000

    enum MessageType: UInt8 {
        case hello = 1, routeChunk = 2, roadsChunk = 3, maneuvers = 4
        case guidance = 5, ack = 6, resendRequest = 7, end = 8
        var name: String {
            switch self {
            case .hello: return "HELLO"
            case .routeChunk: return "ROUTE_CHUNK"
            case .roadsChunk: return "ROADS_CHUNK"
            case .maneuvers: return "MANEUVERS"
            case .guidance: return "GUIDANCE"
            case .ack: return "ACK"
            case .resendRequest: return "RESEND_REQUEST"
            case .end: return "END"
            }
        }
    }

    private static func appendUInt16BE(_ value: UInt16, to data: inout Data) {
        data.append(UInt8(value >> 8))
        data.append(UInt8(value & 0xFF))
    }

    private static func appendInt16BE(_ value: Int, to data: inout Data) {
        let u = UInt16(bitPattern: Int16(value))
        appendUInt16BE(u, to: &data)
    }

    private static func buildFrame(type: MessageType, sessionId: UInt16,
        seq: UInt16, total: UInt16, payload: Data) -> Data {
        var frame = Data()
        frame.reserveCapacity(headerLength + payload.count)
        frame.append(protocolVersion)
        frame.append(type.rawValue)
        appendUInt16BE(sessionId, to: &frame)
        appendUInt16BE(seq, to: &frame)
        appendUInt16BE(total, to: &frame)
        frame.append(payload)
        return frame
    }

    private static func toWire(frame: Data, type: MessageType, sessionId: UInt16,
        seq: UInt16, total: UInt16, encoding: P2PEncoding) -> P2PMessage {
        let wireData: Data
        switch encoding {
        case .base64:
            wireData = frame.base64EncodedData()
        case .binary:
            wireData = frame
        }
        precondition(wireData.count <= maxWire,
            "\(type.name) seq \(seq) exceeds \(maxWire) (\(wireData.count))")
        return P2PMessage(type: type.rawValue, typeName: type.name,
            sessionId: sessionId, seq: seq, total: total,
            wireData: wireData, binaryLength: frame.count)
    }

    private static func chunkPayload(_ bytes: Data, type: MessageType,
        sessionId: UInt16, encoding: P2PEncoding) -> [P2PMessage] {
        let total = max(1, (bytes.count + chunkPayload - 1) / chunkPayload)
        var out: [P2PMessage] = []
        for seq in 0..<total {
            let slice = bytes.subdata(in: (seq * chunkPayload)..<min((seq + 1) * chunkPayload, bytes.count))
            out.append(toWire(frame: buildFrame(type: type, sessionId: sessionId,
                seq: UInt16(seq), total: UInt16(total), payload: slice),
                type: type, sessionId: sessionId, seq: UInt16(seq),
                total: UInt16(total), encoding: encoding))
        }
        return out
    }

    static func encodeHello(sessionId: UInt16, vehicle: Vehicle,
        encoding: P2PEncoding = .base64) -> P2PMessage {
        let name = vehicle.displayName
        let nameData = name.data(using: .utf8) ?? Data()
        precondition(nameData.count <= 32, "HELLO name too long")
        var payload = Data()
        payload.append(protocolVersion)
        payload.append(vehicle == .motorScooter ? 0 : 1)
        payload.append(UInt8(nameData.count))
        payload.append(nameData)
        let frame = buildFrame(type: .hello, sessionId: sessionId, seq: 0, total: 1, payload: payload)
        return toWire(frame: frame, type: .hello, sessionId: sessionId, seq: 0, total: 1, encoding: encoding)
    }

    static func encodeRouteChunks(sessionId: UInt16, routeDelta: [Int],
        encoding: P2PEncoding = .base64) -> [P2PMessage] {
        chunkPayload(Data(RouteCodec.int16Bytes(routeDelta)),
            type: .routeChunk, sessionId: sessionId, encoding: encoding)
    }

    static func encodeRoadsChunks(sessionId: UInt16, roadsMajorDelta: [[Int]],
        roadsMinorDelta: [[Int]], encoding: P2PEncoding = .base64) -> [P2PMessage] {
        var bytes = Data()
        for (level, list) in [(1, roadsMajorDelta), (0, roadsMinorDelta)] {
            for road in list {
                var header = Data()
                header.append(UInt8(level))
                appendUInt16BE(UInt16(road.count / 2), to: &header)
                bytes.append(header)
                bytes.append(contentsOf: RouteCodec.int16Bytes(road))
            }
        }
        return chunkPayload(bytes, type: .roadsChunk, sessionId: sessionId, encoding: encoding)
    }

    static func encodeManeuvers(sessionId: UInt16, maneuvers: [Maneuver],
        encoding: P2PEncoding = .base64) -> P2PMessage {
        precondition(maneuvers.count <= 32, "too many maneuvers")
        var payload = Data()
        payload.append(UInt8(maneuvers.count))
        for m in maneuvers {
            let nameData = m.streetName.data(using: .utf8) ?? Data()
            precondition(nameData.count <= 64, "street name too long: \(m.streetName)")
            appendUInt16BE(UInt16(m.distanceM), to: &payload)
            payload.append(m.maneuver.code)
            payload.append(UInt8(nameData.count))
            payload.append(nameData)
        }
        let frame = buildFrame(type: .maneuvers, sessionId: sessionId, seq: 0, total: 1, payload: payload)
        return toWire(frame: frame, type: .maneuvers, sessionId: sessionId, seq: 0, total: 1, encoding: encoding)
    }

    static func encodeGuidance(sessionId: UInt16, x: Int, y: Int, heading: Int,
        distToTurnM: Int, maneuverIndex: Int, speedKmh: Int, speedLimitKmh: Int,
        encoding: P2PEncoding = .base64) -> P2PMessage {
        var payload = Data()
        appendInt16BE(x, to: &payload)
        appendInt16BE(y, to: &payload)
        appendUInt16BE(UInt16(heading), to: &payload)
        appendUInt16BE(UInt16(distToTurnM), to: &payload)
        payload.append(UInt8(maneuverIndex))
        payload.append(UInt8(speedKmh))
        payload.append(UInt8(speedLimitKmh))
        let frame = buildFrame(type: .guidance, sessionId: sessionId, seq: 0, total: 1, payload: payload)
        return toWire(frame: frame, type: .guidance, sessionId: sessionId, seq: 0, total: 1, encoding: encoding)
    }

    static func encodeAck(sessionId: UInt16, ackedType: UInt8, ackedSeq: UInt16,
        encoding: P2PEncoding = .base64) -> P2PMessage {
        var payload = Data()
        payload.append(ackedType)
        appendUInt16BE(ackedSeq, to: &payload)
        let frame = buildFrame(type: .ack, sessionId: sessionId, seq: 0, total: 1, payload: payload)
        return toWire(frame: frame, type: .ack, sessionId: sessionId, seq: 0, total: 1, encoding: encoding)
    }

    static func encodeResendRequest(sessionId: UInt16, reqType: UInt8, seqs: [UInt16],
        encoding: P2PEncoding = .base64) -> P2PMessage {
        var payload = Data()
        payload.append(reqType)
        payload.append(UInt8(seqs.count))
        for s in seqs {
            appendUInt16BE(s, to: &payload)
        }
        let frame = buildFrame(type: .resendRequest, sessionId: sessionId, seq: 0, total: 1, payload: payload)
        return toWire(frame: frame, type: .resendRequest, sessionId: sessionId, seq: 0, total: 1, encoding: encoding)
    }

    static func encodeEnd(sessionId: UInt16, reason: UInt8,
        encoding: P2PEncoding = .base64) -> P2PMessage {
        let frame = buildFrame(type: .end, sessionId: sessionId, seq: 0, total: 1,
            payload: Data([reason]))
        return toWire(frame: frame, type: .end, sessionId: sessionId, seq: 0, total: 1, encoding: encoding)
    }

    // Encode the whole trip-start sequence for one vehicle: HELLO,
    // ROUTE_CHUNKs, ROADS_CHUNKs, MANEUVERS (send order, spec §4).
    static func encodeTrip(_ trip: TripData, vehicle: Vehicle, sessionId: UInt16,
        encoding: P2PEncoding = .base64) -> [P2PMessage] {
        let route = trip.routes[vehicle.routeKey]!
        return [encodeHello(sessionId: sessionId, vehicle: vehicle, encoding: encoding)]
            + encodeRouteChunks(sessionId: sessionId, routeDelta: route.routeDelta, encoding: encoding)
            + encodeRoadsChunks(sessionId: sessionId, roadsMajorDelta: trip.roadsMajorDelta,
                roadsMinorDelta: trip.roadsMinorDelta, encoding: encoding)
            + [encodeManeuvers(sessionId: sessionId, maneuvers: route.maneuvers, encoding: encoding)]
    }
}
