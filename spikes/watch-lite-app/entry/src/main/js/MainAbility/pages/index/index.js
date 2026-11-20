// index.js
// S1 spike home page: two buttons, one per probe page.
// Navigation uses @system.router; the page URIs match the entries
// in entry/src/main/config.json (module.js[0].pages).

import router from '@system.router';

export default {
    data: {
        title: 'Fit3 Nav Spike'
    },
    openProbe() {
        router.push({
            uri: 'pages/api-probe/api-probe'
        });
    },
    openMap() {
        router.push({
            uri: 'pages/map/map'
        });
    }
};
