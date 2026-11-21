// GeoProjectionTests.swift
// The Swift projection + simplification pipeline, fed with the same
// Valhalla shape as the JS fixture builder, must reproduce the JS
// fixture (routeDelta, maneuvers, length) within 1 m per point.
import XCTest
@testable import Fit3NavCompanion

final class GeoProjectionTests: XCTestCase {
    private var valhalla: FixtureLoader.ValhallaFixture!
    private var trip: TripData!

    override func setUpWithError() throws {
        #if SWIFT_PACKAGE
        let bundle = Bundle.module
        #else
        let bundle = Bundle(for: Self.self)
        #endif
        valhalla = try JSONDecoder().decode(FixtureLoader.ValhallaFixture.self,
            from: FixtureLoader.data(named: "valhalla-motor-scooter", in: bundle))
        trip = try TripData.fromJSON(FixtureLoader.data(named: "fixture-real-map", in: bundle))
    }

    func testPolyline6KnownExample() {
        // Canonical Google polyline example (precision 5).
        let points = Polyline6.decode("_p~iF~ps|U_ulLnnqC_mqNvxq`@", precision: 5)
        XCTAssertEqual(points.count, 3)
        XCTAssertEqual(points[0].lat, 38.5, accuracy: 1e-6)
        XCTAssertEqual(points[0].lon, -120.2, accuracy: 1e-6)
        XCTAssertEqual(points[1].lat, 40.7, accuracy: 1e-6)
        XCTAssertEqual(points[1].lon, -120.95, accuracy: 1e-6)
        XCTAssertEqual(points[2].lat, 43.252, accuracy: 1e-6)
        XCTAssertEqual(points[2].lon, -126.453, accuracy: 1e-6)
    }

    func testPolyline6Precision6RealShape() {
        // First 3 points of the real Valhalla shape, polyline6-encoded
        // (precision 6, the Valhalla default).
        let points = Polyline6.decode("qpnpSerhojEi]zPiFhC")
        XCTAssertEqual(points.count, 3)
        XCTAssertEqual(points[0].lat, 10.772249, accuracy: 1e-6)
        XCTAssertEqual(points[0].lon, 106.697523, accuracy: 1e-6)
        XCTAssertEqual(points[1].lat, 10.772734, accuracy: 1e-6)
        XCTAssertEqual(points[1].lon, 106.697237, accuracy: 1e-6)
        XCTAssertEqual(points[2].lat, 10.772851, accuracy: 1e-6)
        XCTAssertEqual(points[2].lon, 106.697168, accuracy: 1e-6)
    }

    func testProjectStartIsOrigin() {
        let origin = GeoProjection.project(GeoProjection.start)
        XCTAssertEqual(origin.x, 0)
        XCTAssertEqual(origin.y, 0)
        let dest = GeoProjection.project(GeoProjection.end)
        XCTAssertLessThanOrEqual(abs(dest.x - 111), 1)
        XCTAssertLessThanOrEqual(abs(dest.y - 807), 1)
    }

    func testSimplifyMatchesJSFixtureWithinOneMetre() throws {
        let shape = valhalla.shape.map { LatLon(lat: $0[0], lon: $0[1]) }
        XCTAssertEqual(shape.count, 70)
        let projected = GeoProjection.projectPoints(shape)
        let (points, kept) = GeoProjection.simplify(projected, tolerance: 1.0)
        let expected = try XCTUnwrap(trip.routes["motorbike"])
        let expectedAbs = try XCTUnwrap(RouteCodec.decode(expected.routeDelta))
        XCTAssertEqual(points.count, expectedAbs.count / 2, "simplified point count must match the JS fixture")
        for i in 0..<points.count {
            XCTAssertLessThanOrEqual(abs(points[i].x - expectedAbs[i * 2]), 1,
                "point \(i) x differs by more than 1 m")
            XCTAssertLessThanOrEqual(abs(points[i].y - expectedAbs[i * 2 + 1]), 1,
                "point \(i) y differs by more than 1 m")
        }
        // Maneuvers from the same pipeline must match the fixture.
        let maneuvers = valhalla.maneuvers.map { m in
            Maneuver(
                distanceM: GeoProjection.maneuverDistance(simplified: points, kept: kept,
                    beginIndex: m.beginShapeIndex),
                maneuver: GeoProjection.mapManeuver(m.instruction),
                streetName: m.streetNames?.first ?? "")
        }
        XCTAssertEqual(maneuvers.count, expected.maneuvers.count)
        for (got, want) in zip(maneuvers, expected.maneuvers) {
            XCTAssertLessThanOrEqual(abs(got.distanceM - want.distanceM), 1)
            XCTAssertEqual(got.maneuver, want.maneuver)
            XCTAssertEqual(got.streetName, want.streetName)
        }
        XCTAssertLessThanOrEqual(
            abs(GeoProjection.jsRound(GeoProjection.polylineLength(points)) - expected.lengthM), 1)
    }

    func testMapManeuverOrdering() {
        // "đến" must win over "trái": the arrival instruction mentions
        // the left side ("Đến nơi, điểm đến ở phía bên trái").
        XCTAssertEqual(GeoProjection.mapManeuver("Đến nơi, điểm đến ở phía bên trái"), .arrive)
        XCTAssertEqual(GeoProjection.mapManeuver("Rẽ trái vào đường Lê Thánh Tôn"), .left)
        XCTAssertEqual(GeoProjection.mapManeuver("Rẽ phải vào đường Trương Định"), .right)
        XCTAssertEqual(GeoProjection.mapManeuver("Quay đầu xe"), .uturn)
        XCTAssertEqual(GeoProjection.mapManeuver("Đi thẳng qua vòng xuyến"), .straight)
        XCTAssertEqual(GeoProjection.mapManeuver("Tiếp tục đi thẳng"), .straight)
    }

    func testRouteCodecRoundTrip() {
        let abs = [-52, -30, -39, 67, -127, -84]
        let delta = RouteCodec.encode(abs)
        XCTAssertNotNil(delta)
        XCTAssertEqual(RouteCodec.decode(delta!), abs)
        XCTAssertNil(RouteCodec.encode([0, 0, 40_000, 0]), "delta outside Int16 must fail")
        XCTAssertNil(RouteCodec.decode([0]), "odd length must fail")
    }
}
