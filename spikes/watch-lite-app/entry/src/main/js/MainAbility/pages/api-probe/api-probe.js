// api-probe.js
// Probes each canvas API used by the S1 map spike, one at a time,
// in try/catch, and prints the result on screen ("name: OK" or
// "name: FAIL <error>") because the lite wearable has no usable log.
// Results are shown in a scrollable <list>, one <text> per line;
// the "OK x/N" summary stays at the top. 21 APIs are probed in total.
//
// Property probes (lineWidth, strokeStyle, fillStyle, lineCap,
// lineJoin, font): if setting the value does not throw but reading it
// back gives a different value (for example '#FF0000' instead of
// '#ff0000'), the result is "OK (readback=<value>)" rather than FAIL,
// so a harmless normalisation is not misread as a missing API.
//
// Assumptions (not verified on the real watch yet):
// - The canvas element is reachable as this.$refs.probeCanvas
//   (fallback: this.$element('probeCanvas')).
// - drawImage is only checked for presence (typeof === 'function'):
//   no image asset is passed to it here, so this probe does NOT prove
//   that drawing an image actually works on lite wearable.

import router from '@system.router';

export default {
    data: {
        summaryText: 'Dang kiem tra...',
        results: []
    },
    onShow() {
        this.runProbe();
    },
    runProbe() {
        var results = [];
        var okCount = 0;
        var canvas = null;
        var ctx = null;
        var errorText;

        function record(name, ok, error) {
            if (ok) {
                results.push(name + ': OK');
                okCount++;
            } else {
                errorText = error === undefined || error === null ?
                    'unknown' : String(error);
                results.push(name + ': FAIL ' + errorText);
            }
        }

        function tryCall(name, fn) {
            try {
                fn();
                record(name, true);
            } catch (e) {
                record(name, false, e && e.message ? e.message : e);
            }
        }

        function tryProperty(name, setFn, getFn, isExpected) {
            var actual;
            try {
                setFn();
                actual = getFn();
            } catch (e) {
                record(name, false, e && e.message ? e.message : e);
                return;
            }
            if (isExpected(actual)) {
                record(name, true);
            } else {
                results.push(name + ': OK (readback=' + actual + ')');
                okCount++;
            }
        }

        try {
            if (this.$refs && this.$refs.probeCanvas) {
                canvas = this.$refs.probeCanvas;
            }
        } catch (e) {
            canvas = null;
        }
        if (canvas === null) {
            try {
                canvas = this.$element('probeCanvas');
            } catch (e2) {
                canvas = null;
            }
        }
        if (canvas === null) {
            record('getContext(\'2d\')', false, 'no canvas element');
            this.summaryText = 'OK 0/21';
            this.results = results;
            return;
        }

        try {
            ctx = canvas.getContext('2d');
            record('getContext(\'2d\')', ctx !== null && ctx !== undefined,
                'null context');
        } catch (e3) {
            record('getContext(\'2d\')', false,
                e3 && e3.message ? e3.message : e3);
        }
        if (ctx === null || ctx === undefined) {
            this.summaryText = 'OK ' + okCount + '/21';
            this.results = results;
            return;
        }

        tryCall('beginPath', function () { ctx.beginPath(); });
        tryCall('moveTo', function () {
            ctx.beginPath();
            ctx.moveTo(10, 10);
        });
        tryCall('lineTo', function () {
            ctx.beginPath();
            ctx.moveTo(10, 10);
            ctx.lineTo(100, 10);
        });
        tryCall('stroke', function () {
            ctx.beginPath();
            ctx.moveTo(10, 30);
            ctx.lineTo(100, 30);
            ctx.stroke();
        });
        tryCall('closePath', function () {
            ctx.beginPath();
            ctx.moveTo(10, 50);
            ctx.lineTo(60, 50);
            ctx.lineTo(60, 80);
            ctx.closePath();
            ctx.stroke();
        });
        tryProperty('lineWidth', function () { ctx.lineWidth = 5; },
            function () { return ctx.lineWidth; }, function (v) { return v === 5; });
        tryProperty('strokeStyle', function () { ctx.strokeStyle = '#ff0000'; },
            function () { return ctx.strokeStyle; },
            function (v) { return String(v).toLowerCase() === '#ff0000'; });
        tryProperty('fillStyle', function () { ctx.fillStyle = '#00ff00'; },
            function () { return ctx.fillStyle; },
            function (v) { return String(v).toLowerCase() === '#00ff00'; });
        tryProperty('lineCap', function () { ctx.lineCap = 'round'; },
            function () { return ctx.lineCap; }, function (v) { return v === 'round'; });
        tryProperty('lineJoin', function () { ctx.lineJoin = 'round'; },
            function () { return ctx.lineJoin; }, function (v) { return v === 'round'; });
        tryCall('arc', function () {
            ctx.beginPath();
            ctx.arc(150, 40, 25, 0, Math.PI * 2);
            ctx.stroke();
        });
        tryCall('fill', function () {
            ctx.beginPath();
            ctx.arc(200, 40, 15, 0, Math.PI * 2);
            ctx.fill();
        });
        tryCall('fillRect', function () { ctx.fillRect(230, 20, 50, 30); });
        tryCall('clearRect', function () { ctx.clearRect(0, 0, 10, 10); });
        tryCall('fillText', function () { ctx.fillText('A', 300, 45); });
        tryProperty('font', function () { ctx.font = '20px sans-serif'; },
            function () { return ctx.font; },
            function (v) { return String(v).indexOf('20') >= 0; });
        tryCall('save/restore', function () {
            ctx.save();
            ctx.restore();
        });
        tryCall('translate', function () {
            ctx.save();
            ctx.translate(5, 5);
            ctx.restore();
        });
        tryCall('rotate', function () {
            ctx.save();
            ctx.rotate(0.1);
            ctx.restore();
        });
        // Presence check only (see header comment): no image is drawn.
        record('drawImage', typeof ctx.drawImage === 'function',
            'not a function');

        this.summaryText = 'OK ' + okCount + '/' + results.length;
        this.results = results;
    },
    goBack() {
        // router.replace is the Lite-capable navigation API; push/back
        // are SystemCapability.ArkUI.Full only, so they are not used.
        router.replace({
            uri: 'pages/index/index'
        });
    }
};
