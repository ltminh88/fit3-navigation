// TripViewModel.swift
// State for the main screen: coordinate inputs, trip loading (Valhalla
// + Overpass), P2P encoding, and the loopback test send. All network
// work is async; errors surface as human-readable messages.
import Foundation
import MapKit

@MainActor
final class TripViewModel: ObservableObject {
    @Published var originLat = "10.77252"
    @Published var originLon = "106.69800"
    @Published var destLat = "10.77978"
    @Published var destLon = "106.69902"
    @Published var vehicle: Vehicle = .motorScooter
    @Published var status = "Chưa tải tuyến"
    @Published var isLoading = false
    @Published var trip: TripData?
    @Published var messages: [P2PMessage] = []
    @Published var loopbackResult: LoopbackWatchLink.CheckResult?
    @Published var ackInfo: String?
    @Published var errorMessage: String?

    private let link = LoopbackWatchLink()
    private var sessionId: UInt16 = 1

    var totalBytes: Int { messages.reduce(0) { $0 + $1.wireLength } }

    // Route as map coordinates, for the selected vehicle.
    var routeCoordinates: [CLLocationCoordinate2D] {
        guard let trip = trip, let route = trip.routes[vehicle.routeKey],
            let abs = RouteCodec.decode(route.routeDelta) else { return [] }
        var coords: [CLLocationCoordinate2D] = []
        for i in stride(from: 0, to: abs.count, by: 2) {
            let ll = GeoProjection.unproject(ProjectedPoint(x: abs[i], y: abs[i + 1]))
            coords.append(CLLocationCoordinate2D(latitude: ll.lat, longitude: ll.lon))
        }
        return coords
    }

    init() {
        link.onReceive = { [weak self] data in
            Task { @MainActor in
                self?.ackInfo = "Nhận \(data.count) byte từ đồng hồ (ACK)"
            }
        }
    }

    func loadTrip() async {
        guard let start = parseLatLon(latText: originLat, lonText: originLon),
            let end = parseLatLon(latText: destLat, lonText: destLon) else {
            errorMessage = "Tọa độ không hợp lệ (dùng số thập phân, ví dụ 10.77252)"
            return
        }
        isLoading = true
        errorMessage = nil
        loopbackResult = nil
        ackInfo = nil
        status = "Đang tải tuyến từ Valhalla + Overpass…"
        do {
            let trip = try await TripBuilder.buildTrip(start: start, end: end)
            self.trip = trip
            let msgs = P2PEncoder.encodeTrip(trip, vehicle: vehicle, sessionId: sessionId)
            sessionId = sessionId &+ 1
            messages = msgs
            status = "Đã tải tuyến: \(trip.routes[vehicle.routeKey]?.lengthM ?? 0) m, " +
                "\(msgs.count) tin, \(totalBytes) byte"
        } catch {
            errorMessage = error.localizedDescription
            status = "Tải tuyến thất bại"
        }
        isLoading = false
    }

    // "Gửi thử": sends every encoded message through the loopback link
    // and compares the decoded trip with the encoded one. This verifies
    // the frames only — it is NOT a test of real Bluetooth sending.
    func sendTest() async {
        guard let trip = trip, !messages.isEmpty else { return }
        isLoading = true
        loopbackResult = nil
        status = "Đang gửi thử qua loopback…"
        link.arm(trip: trip, vehicle: vehicle)
        for m in messages {
            await link.send(m.wireData)
        }
        if let result = link.check() {
            loopbackResult = result
            status = result.allMatch ? "Gửi thử: giải mã khớp 100%" : "Gửi thử: KHÔNG khớp"
            if result.allMatch, let last = messages.last(where: { $0.typeName == "ROADS_CHUNK" }) {
                link.acknowledge(type: .roadsChunk, seq: last.seq, sessionId: last.sessionId)
            }
        } else {
            status = "Gửi thử: đồng hồ loopback chưa nhận đủ tin"
        }
        isLoading = false
    }

    private func parseLatLon(latText: String, lonText: String) -> LatLon? {
        guard let lat = Double(latText.replacingOccurrences(of: ",", with: ".")),
            let lon = Double(lonText.replacingOccurrences(of: ",", with: ".")),
            (-90...90).contains(lat), (-180...180).contains(lon) else { return nil }
        return LatLon(lat: lat, lon: lon)
    }
}
