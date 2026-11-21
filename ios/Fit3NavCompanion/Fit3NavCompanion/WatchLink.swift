// WatchLink.swift
// Transport abstraction for sending P2P messages to the watch
// (docs/p2p-protocol.md). The app talks only to this protocol, so the
// real Huawei transport can replace the loopback without touching the
// UI or the encoder.
import Foundation

protocol WatchLink: AnyObject {
    /// Send one encoded message to the watch. `data` is the wire
    /// bytes: the UTF-8 bytes of the base64 string (base64 encoding).
    func send(_ data: Data) async
    /// Called with every message received from the watch (ACKs,
    /// RESEND_REQUESTs). Set by the owner of the link.
    var onReceive: ((Data) -> Void)? { get set }
}

// TEST IMPLEMENTATION ONLY — not a simulation of real results.
// LoopbackWatchLink decodes each sent message immediately with the
// Swift port of the watch decoder (P2PDecoder) and compares the
// decoded trip data with what was encoded. It proves the frames are
// well-formed and round-trip correctly. It does NOT simulate
// Bluetooth, timing, packet loss, the real watch, or Huawei Health —
// none of those behaviours can be verified without the real transport
// and a real Fit 3. "Gửi thử" in the UI uses this link.
final class LoopbackWatchLink: WatchLink {
    var onReceive: ((Data) -> Void)?
    private let decoder = P2PDecoder()
    private var expectedTrip: TripData?
    private var expectedVehicle: Vehicle = .motorScooter

    struct CheckResult: Equatable {
        var messagesReceived: Int
        var routeMatches: Bool
        var roadsMatch: Bool
        var maneuversMatch: Bool
        var error: String?
        var allMatch: Bool { routeMatches && roadsMatch && maneuversMatch && error == nil }
    }

    private(set) var messagesReceived = 0

    func arm(trip: TripData, vehicle: Vehicle) {
        expectedTrip = trip
        expectedVehicle = vehicle
        messagesReceived = 0
    }

    func send(_ data: Data) async {
        guard let base64 = String(data: data, encoding: .utf8) else { return }
        messagesReceived += 1
        _ = decoder.feed(base64)
    }

    // Compare what the decoder reassembled against the encoded trip.
    // Returns nil until the decoder has the full trip.
    func check() -> CheckResult? {
        guard let trip = expectedTrip else { return nil }
        guard decoder.isComplete(.routeChunk), decoder.isComplete(.roadsChunk),
            decoder.isComplete(.maneuvers) else { return nil }
        let route = trip.routes[expectedVehicle.routeKey]!
        let roads = decoder.getRoads()
        return CheckResult(
            messagesReceived: messagesReceived,
            routeMatches: decoder.getRouteDelta() == route.routeDelta,
            roadsMatch: roads?.major == trip.roadsMajorDelta && roads?.minor == trip.roadsMinorDelta,
            maneuversMatch: decoder.getManeuvers() == route.maneuvers,
            error: decoder.lastError.isEmpty ? nil : decoder.lastError)
    }

    // Acknowledge the last received chunk type, the way the real watch
    // would (ACK is cumulative per type). Used by the UI to show the
    // ACK path working end to end through the encoder.
    func acknowledge(type: P2PEncoder.MessageType, seq: UInt16, sessionId: UInt16) {
        let ack = P2PEncoder.encodeAck(sessionId: sessionId, ackedType: type.rawValue, ackedSeq: seq)
        onReceive?(ack.wireData)
    }
}
