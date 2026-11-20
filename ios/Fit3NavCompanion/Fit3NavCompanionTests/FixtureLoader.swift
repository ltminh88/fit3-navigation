// FixtureLoader.swift
// Helpers for loading the test fixtures bundled with this test target:
// - valhalla-motor-scooter.json: raw Valhalla response for the sample
//   trip (shape + maneuvers), fetched live once and frozen so the test
//   does not depend on the network.
// - fixture-real-map.json: the JS fixture (routes + roads) as JSON.
// - messages.json: the Node P2P encoder output for the same fixture
//   (spikes/tools/p2p-encoder/messages.json, copied here).
import Foundation

enum FixtureLoader {
    static func data(named name: String, in bundle: Bundle) throws -> Data {
        // Xcode puts test resources at the bundle root; SwiftPM keeps
        // them in the copied Fixtures subdirectory. Try both.
        if let url = bundle.url(forResource: name, withExtension: "json") {
            return try Data(contentsOf: url)
        }
        if let url = bundle.url(forResource: name, withExtension: "json", subdirectory: "Fixtures") {
            return try Data(contentsOf: url)
        }
        throw NSError(domain: "FixtureLoader", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "missing fixture \(name).json"])
    }

    struct ValhallaFixture: Decodable {
        struct Maneuver: Decodable {
            var beginShapeIndex: Int
            var instruction: String
            var streetNames: [String]?

            enum CodingKeys: String, CodingKey {
                case beginShapeIndex = "begin_shape_index"
                case instruction
                case streetNames = "street_names"
            }
        }
        var shape: [[Double]] // [lat, lon] pairs
        var maneuvers: [Maneuver]
    }

    struct ExpectedMessages: Decodable {
        struct Message: Decodable {
            var type: UInt8
            var typeName: String
            var sessionId: UInt16
            var seq: UInt16
            var total: UInt16
            var wire: String
            var wireLength: Int
            var binaryLength: Int
        }
        var vehicle: String
        var sessionId: UInt16
        var messages: [Message]
    }
}
