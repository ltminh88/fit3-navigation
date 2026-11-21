// P2PDecoder.swift
// Swift port of the watch decoder
// (spikes/watch-lite-app/.../common/p2p-frame-decoder.js), used by the
// loopback link to verify locally that what the encoder produced can
// be decoded back into the same trip data. It is NOT a simulation of
// the real watch or of Bluetooth behaviour — only of the frame format.
import Foundation

final class P2PDecoder {
    private var sessionId: UInt16?
    private var hello: (vehicle: UInt8, name: String)?
    private var routeTotal = 0
    private var routeSlots: [Data?] = []
    private var routeReceived = 0
    private var roadsTotal = 0
    private var roadsSlots: [Data?] = []
    private var roadsReceived = 0
    private var maneuversData: Data?
    private(set) var guidance: (x: Int, y: Int, heading: Int, distToTurnM: Int,
        maneuverIndex: Int, speedKmh: Int, speedLimitKmh: Int)?
    private(set) var lastError = ""

    private func resetSession(_ sessionId: UInt16) {
        self.sessionId = sessionId
        hello = nil
        routeTotal = 0; routeSlots = []; routeReceived = 0
        roadsTotal = 0; roadsSlots = []; roadsReceived = 0
        maneuversData = nil
    }

    private func storeChunk(type: UInt8, seq: Int, total: Int, payload: Data) -> Bool {
        guard seq < total, total > 0, total <= 512 else { return false }
        let isRoute = type == P2PEncoder.MessageType.routeChunk.rawValue
        if isRoute ? routeTotal != total : roadsTotal != total {
            let slots = [Data?](repeating: nil, count: total)
            if isRoute { routeTotal = total; routeSlots = slots; routeReceived = 0 }
            else { roadsTotal = total; roadsSlots = slots; roadsReceived = 0 }
        }
        if isRoute {
            if routeSlots[seq] != nil { return true } // duplicate: ignore
            routeSlots[seq] = payload
            routeReceived += 1
        } else {
            if roadsSlots[seq] != nil { return true }
            roadsSlots[seq] = payload
            roadsReceived += 1
        }
        return true
    }

    func isComplete(_ type: P2PEncoder.MessageType) -> Bool {
        switch type {
        case .hello: return hello != nil
        case .routeChunk: return routeTotal > 0 && routeReceived == routeTotal
        case .roadsChunk: return roadsTotal > 0 && roadsReceived == roadsTotal
        case .maneuvers: return maneuversData != nil
        default: return false
        }
    }

    func missingSeqs(_ type: P2PEncoder.MessageType) -> [Int] {
        let slots: [Data?]
        switch type {
        case .routeChunk: slots = routeSlots
        case .roadsChunk: slots = roadsSlots
        default: return []
        }
        return slots.enumerated().compactMap { $0.element == nil ? $0.offset : nil }
    }

    // Feed one base64 frame string. Returns the missing seqs for chunk
    // types (empty when complete), [] for other types, nil on error.
    func feed(_ base64: String) -> [Int]? {
        guard let bytes = Data(base64Encoded: base64), bytes.count >= 8 else {
            lastError = "short frame"; return nil
        }
        guard bytes[0] == P2PEncoder.protocolVersion else {
            lastError = "version"; return nil
        }
        let type = bytes[1]
        let session = UInt16(bytes[2]) << 8 | UInt16(bytes[3])
        let seq = Int(UInt16(bytes[4]) << 8 | UInt16(bytes[5]))
        let total = Int(UInt16(bytes[6]) << 8 | UInt16(bytes[7]))
        let payload = bytes.subdata(in: 8..<bytes.count)
        if session != sessionId {
            resetSession(session)
        }
        switch type {
        case P2PEncoder.MessageType.hello.rawValue:
            guard payload.count >= 3, payload[0] == 1,
                payload[2] <= payload.count - 3 else { lastError = "bad hello"; return nil }
            hello = (payload[1], String(decoding: payload.subdata(in: 3..<(3 + Int(payload[2]))), as: UTF8.self))
            return []
        case P2PEncoder.MessageType.routeChunk.rawValue,
            P2PEncoder.MessageType.roadsChunk.rawValue:
            guard storeChunk(type: type, seq: seq, total: total, payload: payload) else {
                lastError = "bad chunk"; return nil
            }
            return missingSeqs(type == P2PEncoder.MessageType.routeChunk.rawValue ? .routeChunk : .roadsChunk)
        case P2PEncoder.MessageType.maneuvers.rawValue:
            guard seq == 0, total == 1 else { lastError = "bad maneuvers"; return nil }
            maneuversData = payload
            return []
        case P2PEncoder.MessageType.guidance.rawValue:
            guard payload.count == 11 else { lastError = "bad guidance"; return nil }
            let x = Int(Int16(bitPattern: UInt16(payload[0]) << 8 | UInt16(payload[1])))
            let y = Int(Int16(bitPattern: UInt16(payload[2]) << 8 | UInt16(payload[3])))
            guidance = (x, y,
                Int(UInt16(payload[4]) << 8 | UInt16(payload[5])),
                Int(UInt16(payload[6]) << 8 | UInt16(payload[7])),
                Int(payload[8]), Int(payload[9]), Int(payload[10]))
            return []
        case P2PEncoder.MessageType.ack.rawValue,
            P2PEncoder.MessageType.resendRequest.rawValue,
            P2PEncoder.MessageType.end.rawValue:
            return []
        default:
            lastError = "unknown type"; return nil
        }
    }

    func getRouteDelta() -> [Int]? {
        guard isComplete(.routeChunk) else { return nil }
        var bytes = Data()
        for slot in routeSlots { bytes.append(slot!) }
        guard bytes.count % 2 == 0, bytes.count / 2 <= 64 else { return nil }
        var out: [Int] = []
        for i in stride(from: 0, to: bytes.count, by: 2) {
            out.append(Int(Int16(bitPattern: UInt16(bytes[i]) << 8 | UInt16(bytes[i + 1]))))
        }
        return out
    }

    func getRoads() -> (major: [[Int]], minor: [[Int]])? {
        guard isComplete(.roadsChunk) else { return nil }
        var bytes = Data()
        for slot in roadsSlots { bytes.append(slot!) }
        var major: [[Int]] = []
        var minor: [[Int]] = []
        var off = 0
        var totalPoints = 0
        var roadCount = 0
        while off + 3 <= bytes.count {
            let level = bytes[off]
            let count = Int(UInt16(bytes[off + 1]) << 8 | UInt16(bytes[off + 2]))
            off += 3
            guard count > 0, off + count * 4 <= bytes.count else { return nil }
            totalPoints += count
            roadCount += 1
            guard totalPoints <= 1024, roadCount <= 400 else { return nil }
            var values: [Int] = []
            for j in 0..<(count * 2) {
                values.append(Int(Int16(bitPattern: UInt16(bytes[off + j * 2]) << 8 | UInt16(bytes[off + j * 2 + 1]))))
            }
            off += count * 4
            if level == 1 { major.append(values) } else { minor.append(values) }
        }
        guard off == bytes.count else { return nil }
        return (major, minor)
    }

    func getManeuvers() -> [Maneuver]? {
        guard let bytes = maneuversData else { return nil }
        let count = Int(bytes[0])
        guard count <= 32 else { return nil }
        var out: [Maneuver] = []
        var off = 1
        for _ in 0..<count {
            guard off + 4 <= bytes.count else { return nil }
            let dist = Int(UInt16(bytes[off]) << 8 | UInt16(bytes[off + 1]))
            let turnCode = bytes[off + 2]
            let nameLen = Int(bytes[off + 3])
            off += 4
            guard turnCode <= 4, off + nameLen <= bytes.count else { return nil }
            let name = String(decoding: bytes.subdata(in: off..<(off + nameLen)), as: UTF8.self)
            let turn: Turn
            switch turnCode {
            case 1: turn = .left
            case 2: turn = .right
            case 3: turn = .uturn
            case 4: turn = .arrive
            default: turn = .straight
            }
            out.append(Maneuver(distanceM: dist, maneuver: turn, streetName: name))
            off += nameLen
        }
        guard off == bytes.count else { return nil }
        return out
    }
}
