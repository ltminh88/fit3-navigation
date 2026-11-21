// P2PMessage.swift
// One encoded P2P message (docs/p2p-protocol.md). `wireData` holds the
// exact bytes that go over Wear Engine: the UTF-8 bytes of the base64
// string by default (payloads are strings), or the raw frame bytes
// with encoding "binary" (a future bytes-capable transport).
import Foundation

enum P2PEncoding {
    case base64 // default: Wear Engine string payload
    case binary // future bytes-capable transport
}

struct P2PMessage: Equatable {
    var type: UInt8
    var typeName: String
    var sessionId: UInt16
    var seq: UInt16
    var total: UInt16
    var wireData: Data
    var binaryLength: Int // frame length before base64

    var wireLength: Int { wireData.count }
    // The base64 string, when encoding is base64; nil for binary.
    var wireString: String? { String(data: wireData, encoding: .utf8) }
}
