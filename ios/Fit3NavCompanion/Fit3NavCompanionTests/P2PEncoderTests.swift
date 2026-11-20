// P2PEncoderTests.swift
// The Swift encoder must match the Node encoder (task-11) byte-for-byte
// on the same fixture: same frames, same base64 strings, same lengths.
// The loopback decoder must then reassemble the same trip data.
import XCTest
@testable import Fit3NavCompanion

final class P2PEncoderTests: XCTestCase {
    private var trip: TripData!
    private var expected: FixtureLoader.ExpectedMessages!

    override func setUpWithError() throws {
        #if SWIFT_PACKAGE
        let bundle = Bundle.module
        #else
        let bundle = Bundle(for: Self.self)
        #endif
        trip = try TripData.fromJSON(FixtureLoader.data(named: "fixture-real-map", in: bundle))
        expected = try JSONDecoder().decode(FixtureLoader.ExpectedMessages.self,
            from: FixtureLoader.data(named: "messages", in: bundle))
    }

    func testEncodeTripMatchesNodeByteForByte() {
        let messages = P2PEncoder.encodeTrip(trip, vehicle: .motorScooter, sessionId: 1)
        XCTAssertEqual(messages.count, expected.messages.count)
        XCTAssertEqual(messages.count, 10)
        for (got, want) in zip(messages, expected.messages) {
            XCTAssertEqual(got.type, want.type, "\(want.typeName) type")
            XCTAssertEqual(got.typeName, want.typeName)
            XCTAssertEqual(got.sessionId, want.sessionId)
            XCTAssertEqual(got.seq, want.seq)
            XCTAssertEqual(got.total, want.total)
            XCTAssertEqual(got.wireString ?? "<nil>", want.wire, "\(want.typeName) seq \(want.seq) base64 differs")
            XCTAssertEqual(got.wireLength, want.wireLength)
            XCTAssertEqual(got.binaryLength, want.binaryLength)
            XCTAssertLessThanOrEqual(got.wireLength, 1000)
        }
    }

    func testEncodeTripBinaryMatchesBase64Frames() {
        let base64 = P2PEncoder.encodeTrip(trip, vehicle: .motorScooter, sessionId: 1)
        let binary = P2PEncoder.encodeTrip(trip, vehicle: .motorScooter, sessionId: 1, encoding: .binary)
        XCTAssertEqual(binary.count, base64.count)
        for (b, g) in zip(binary, base64) {
            XCTAssertEqual(b.wireData, Data(base64Encoded: g.wireString!)!)
            XCTAssertEqual(b.binaryLength, g.binaryLength)
        }
    }

    func testGuidanceSize() {
        let g = P2PEncoder.encodeGuidance(sessionId: 1, x: -52, y: -30, heading: 900,
            distToTurnM: 78, maneuverIndex: 1, speedKmh: 29, speedLimitKmh: 50)
        XCTAssertEqual(g.binaryLength, 19, "GUIDANCE frame must be < 40 bytes")
        XCTAssertEqual(g.wireLength, 28)
    }

    func testLoopbackDecodesToSameTrip() {
        let messages = P2PEncoder.encodeTrip(trip, vehicle: .motorScooter, sessionId: 1)
        let decoder = P2PDecoder()
        for m in messages {
            XCTAssertNotNil(decoder.feed(m.wireString!), "feed \(m.typeName) seq \(m.seq)")
        }
        let route = trip.routes["motorbike"]!
        XCTAssertEqual(decoder.getRouteDelta() ?? [], route.routeDelta)
        let roads = decoder.getRoads()
        XCTAssertEqual(roads?.major ?? [], trip.roadsMajorDelta)
        XCTAssertEqual(roads?.minor ?? [], trip.roadsMinorDelta)
        XCTAssertEqual(decoder.getManeuvers() ?? [], route.maneuvers)
    }

    func testCarRouteIdenticalToMotorbike() {
        let bike = P2PEncoder.encodeTrip(trip, vehicle: .motorScooter, sessionId: 1)
        let car = P2PEncoder.encodeTrip(trip, vehicle: .auto, sessionId: 1)
        XCTAssertEqual(car.count, bike.count)
        // Same shape and maneuvers (Valhalla returned identical routes);
        // only the HELLO vehicle name differs.
        for (b, c) in zip(bike.dropFirst(), car.dropFirst()) {
            XCTAssertEqual(c.wireString, b.wireString, "\(b.typeName) seq \(b.seq)")
        }
    }
}
