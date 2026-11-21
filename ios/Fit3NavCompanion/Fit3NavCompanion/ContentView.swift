// ContentView.swift
// Main screen: origin/destination inputs, vehicle picker, route map,
// encoded-message list, total bytes, and the "Gửi thử" button.
// Sending goes through the loopback link only — the real Wear Engine
// transport is not implemented yet (see HuaweiWearEngineWatchLink).
import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = TripViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    inputSection
                    mapSection
                    messagesSection
                    sendSection
                }
                .padding()
            }
            .navigationTitle("Fit3 Nav Companion")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var inputSection: some View {
        GroupBox("Điểm đi / Điểm đến") {
            VStack(spacing: 8) {
                coordinateRow(label: "Đi", lat: $viewModel.originLat, lon: $viewModel.originLon)
                coordinateRow(label: "Đến", lat: $viewModel.destLat, lon: $viewModel.destLon)
                Picker("Phương tiện", selection: $viewModel.vehicle) {
                    ForEach(Vehicle.allCases, id: \.self) { v in
                        Text(v.displayName).tag(v)
                    }
                }
                .pickerStyle(.segmented)
                Button("Tải tuyến") {
                    Task { await viewModel.loadTrip() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isLoading)
                Text(viewModel.status)
                    .font(.footnote)
                    .foregroundColor(.secondary)
                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundColor(.red)
                }
            }
        }
    }

    private func coordinateRow(label: String, lat: Binding<String>, lon: Binding<String>) -> some View {
        HStack {
            Text(label).frame(width: 36, alignment: .leading)
            TextField("Vĩ độ", text: lat)
                .keyboardType(.decimalPad)
                .textFieldStyle(.roundedBorder)
            TextField("Kinh độ", text: lon)
                .keyboardType(.decimalPad)
                .textFieldStyle(.roundedBorder)
        }
    }

    private var mapSection: some View {
        GroupBox("Bản đồ") {
            RouteMapView(coordinates: viewModel.routeCoordinates)
                .frame(height: 260)
                .cornerRadius(8)
            if let length = viewModel.trip?.routes[viewModel.vehicle.routeKey]?.lengthM {
                Text("Dài \(length) m · \(viewModel.routeCoordinates.count) điểm")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
        }
    }

    private var messagesSection: some View {
        GroupBox("Tin nhắn P2P (\(viewModel.messages.count) tin · \(viewModel.totalBytes) byte)") {
            if viewModel.messages.isEmpty {
                Text("Chưa có tin nhắn — bấm “Tải tuyến”.")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            } else {
                ForEach(Array(viewModel.messages.enumerated()), id: \.offset) { _, message in
                    HStack {
                        Text(message.typeName)
                            .font(.system(.body, design: .monospaced))
                        Spacer()
                        Text("seq \(message.seq)/\(message.total)")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                        Text("\(message.wireLength) B")
                            .font(.footnote)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }

    private var sendSection: some View {
        GroupBox("Gửi thử (loopback)") {
            VStack(alignment: .leading, spacing: 8) {
                Text("Giải mã ngay trên máy bằng bộ decoder Swift để kiểm tra khung tin. " +
                    "Đây KHÔNG phải gửi thật qua Bluetooth / Wear Engine.")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                Button("Gửi thử") {
                    Task { await viewModel.sendTest() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.isLoading || viewModel.messages.isEmpty)
                if let result = viewModel.loopbackResult {
                    Text(result.allMatch
                        ? "Khớp 100%: tuyến, đường, maneuver đã giải mã đúng."
                        : "Không khớp — xem lỗi: \(result.error ?? "?")")
                        .font(.footnote)
                        .foregroundColor(result.allMatch ? .green : .red)
                }
                if let ack = viewModel.ackInfo {
                    Text(ack)
                        .font(.footnote)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}
