// index.js
// S1 spike home page: two buttons, one per probe page.
// Navigation uses router.replace, the Lite-capable API in
// @system.router (push/back are SystemCapability.ArkUI.Full only).
// The page URIs match the entries in entry/src/main/config.json
// (module.js[0].pages).

import router from '@system.router';

export default {
    data: {
        title: 'Fit3 Nav Spike'
    },
    openProbe() {
        router.replace({
            uri: 'pages/api-probe/api-probe'
        });
    },
    openMap() {
        router.replace({
            uri: 'pages/map/map'
        });
    }
};
