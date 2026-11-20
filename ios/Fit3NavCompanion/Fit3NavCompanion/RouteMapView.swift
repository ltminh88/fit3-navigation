// RouteMapView.swift
// MapKit route map for iOS 16. SwiftUI's Map with polylines needs iOS
// 17, so this wraps MKMapView (UIViewRepresentable) and draws the
// route as an MKPolyline overlay with start/end pins.
import SwiftUI
import MapKit

struct RouteMapView: UIViewRepresentable {
    var coordinates: [CLLocationCoordinate2D]

    func makeUIView(context: Context) -> MKMapView {
        let map = MKMapView()
        map.delegate = context.coordinator
        map.showsUserLocation = false
        return map
    }

    func updateUIView(_ map: MKMapView, context: Context) {
        map.removeOverlays(map.overlays)
        map.removeAnnotations(map.annotations)
        guard coordinates.count >= 2 else { return }
        let polyline = coordinates.withUnsafeBufferPointer { buffer in
            MKPolyline(coordinates: buffer.baseAddress!, count: coordinates.count)
        }
        map.addOverlay(polyline)
        let startPin = MKPointAnnotation()
        startPin.coordinate = coordinates.first!
        startPin.title = "Điểm đi"
        let endPin = MKPointAnnotation()
        endPin.coordinate = coordinates.last!
        endPin.title = "Điểm đến"
        map.addAnnotations([startPin, endPin])
        map.setVisibleMapRect(polyline.boundingMapRect,
            edgePadding: UIEdgeInsets(top: 40, left: 40, bottom: 40, right: 40), animated: true)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, MKMapViewDelegate {
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            guard let polyline = overlay as? MKPolyline else {
                return MKOverlayRenderer(overlay: overlay)
            }
            let renderer = MKPolylineRenderer(polyline: polyline)
            renderer.strokeColor = UIColor(red: 0x2F / 255.0, green: 0x7C / 255.0, blue: 0xF6 / 255.0, alpha: 1)
            renderer.lineWidth = 5
            return renderer
        }
    }
}
