// HuaweiWearEngineWatchLink.swift
// SKELETON ONLY — the real Wear Engine transport, not implemented yet.
//
// TODO: implement this with the real Huawei Wear Engine iOS SDK once
// the Wear Engine permission is approved. See the task-10 report
// (plans/reports/researcher-261120-huawei-signing-and-wear-engine-p2p.md,
// section C8) for what is verified and what is not:
//
// - SDK: iOS_WearEngineSDK_1.0.0.305.zip, from the Huawei SDK library
//   page (connectivity-Library/phone-sdk-cn-0000001656844234).
// - Entry point: HiWear.getP2PClient -> WESP2PClient; send / ping /
//   registerReceiver. Identity via WESIdentityInfo (phone bundle name
//   + fingerprint — any text; watch bundle name + fingerprint).
// - Limits: 1 KB per message (verified), NO file transfer on iOS
//   (verified). The send callback reports WESErrorCodeCommSuccess on
//   success — a send result, not an end-to-end acknowledgement.
// - iPhone locked / app backgrounded behaviour: NOT verified anywhere.
//   Must be tested on a real phone once the channel works.
//
// Do NOT invent Huawei API calls here: the exact WESP2PClient method
// signatures are unverified (the official class page returns no
// readable content), and the sample wrapper names sendMessage /
// sendLongMessage are unverified as official names. Fill this file in
// from the real SDK headers after downloading the SDK, not from memory.
import Foundation

final class HuaweiWearEngineWatchLink: WatchLink {
    var onReceive: ((Data) -> Void)?

    func send(_ data: Data) async {
        // TODO: implement after the Wear Engine permission is approved
        // and the iOS SDK is integrated. See the header comment.
    }
}
