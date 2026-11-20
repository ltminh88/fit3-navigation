// api-probe.js
// Probes each canvas API used by the S1 map spike, one at a time,
// in try/catch, and prints the result on screen ("name: OK" or
// "name: FAIL <error>") because the lite wearable has no usable log.
// Results are shown PAGED, 6 lines per page, in 6 fixed <text>
// elements (line0..line5, no <list>: on the Previewer the <list>
// rendered black with garbled overlapping text and did not scroll).
// "Truoc"/"Sau" flip pages; the summary line shows "OK x/N" and
// "Trang a/b". Results are sorted FAIL first, then OK (readback),
// then OK, so failures are on page 1. 21 APIs are probed in total.
//
// fill() visual check: on the Previewer the filled circle (arc +
// fill at x=200) did NOT appear, so fill() may be a no-op without
// throwing. A second filled circle is drawn with an 'F' label next
// to it; check by eye whether it is visible (see results file).
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

var LINES_PER_PAGE = 6;

export default {
    data: {
        summaryText: 'Dang kiem tra...',
        line0: '',
        line1: '',
        line2: '',
        line3: '',
        line4: '',
        line5: ''
    },
    onInit() {
        this.allResults = [];
        this.pageIndex = 0;
        this.pageCount = 1;
        this.okText = '';
    },
    onShow() {
        this.runProbe();
    },
    showPage() {
        var start;
        var i;
        if (!this.allResults || this.allResults.length === 0) {
            this.pageCount = 1;
        } else {
            this.pageCount = Math.ceil(this.allResults.length / LINES_PER_PAGE);
        }
        if (this.pageIndex < 0) { this.pageIndex = 0; }
        if (this.pageIndex > this.pageCount - 1) { this.pageIndex = this.pageCount - 1; }
        start = this.pageIndex * LINES_PER_PAGE;
        for (i = 0; i < LINES_PER_PAGE; i++) {
            this['line' + i] = (start + i < this.allResults.length) ?
                this.allResults[start + i] : '';
        }
        this.summaryText = this.okText + ' | Trang ' + (this.pageIndex + 1) + '/' + this.pageCount;
    },
    prevPage() {
        if (this.pageIndex > 0) { this.pageIndex--; this.showPage(); }
    },
    nextPage() {
        if (this.pageIndex < this.pageCount - 1) {
            this.pageIndex++;
            this.showPage();
        }
    },
    runProbe() {
        var results = [];
        var okCount = 0;
        var canvas = null;
        var ctx = null;
        var errorText;

        function record(name, ok, error) {
            if (ok) { results.push(name + ': OK'); okCount++; }
            else {
                errorText = error === undefined || error === null ?
                    'unknown' : String(error);
                results.push(name + ': FAIL ' + errorText);
            }
        }
        function tryCall(name, fn) {
            try { fn(); record(name, true); }
            catch (e) { record(name, false, e && e.message ? e.message : e); }
        }
        function tryProperty(name, setFn, getFn, isExpected) {
            var actual;
            try { setFn(); actual = getFn(); }
            catch (e) { record(name, false, e && e.message ? e.message : e); return; }
            if (isExpected(actual)) { record(name, true); }
            else { results.push(name + ': OK (readback=' + actual + ')'); okCount++; }
        }
        // FAIL first, then OK (readback), then OK; stable within a group.
        function sortResults(list) {
            var fails = [];
            var readbacks = [];
            var oks = [];
            var i;
            for (i = 0; i < list.length; i++) {
                if (list[i].indexOf(': FAIL') >= 0) { fails.push(list[i]); }
                else if (list[i].indexOf(': OK (readback=') >= 0) { readbacks.push(list[i]); }
                else { oks.push(list[i]); }
            }
            return fails.concat(readbacks).concat(oks);
        }

        try {
            if (this.$refs && this.$refs.probeCanvas) {
                canvas = this.$refs.probeCanvas;
            }
        } catch (e) { canvas = null; }
        if (canvas === null) {
            try { canvas = this.$element('probeCanvas'); } catch (e2) { canvas = null; }
        }
        if (canvas === null) {
            record('getContext(\'2d\')', false, 'no canvas element');
            this.okText = 'OK 0/21';
            this.allResults = sortResults(results);
            this.pageIndex = 0;
            this.showPage();
            return;
        }
        try {
            ctx = canvas.getContext('2d');
            record('getContext(\'2d\')', ctx !== null && ctx !== undefined, 'null context');
        } catch (e3) {
            record('getContext(\'2d\')', false, e3 && e3.message ? e3.message : e3);
        }
        if (ctx === null || ctx === undefined) {
            this.okText = 'OK ' + okCount + '/21';
            this.allResults = sortResults(results);
            this.pageIndex = 0;
            this.showPage();
            return;
        }

        tryCall('beginPath', function () { ctx.beginPath(); });
        tryCall('moveTo', function () { ctx.beginPath(); ctx.moveTo(10, 10); });
        tryCall('lineTo', function () { ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(100, 10); });
        tryCall('stroke', function () { ctx.beginPath(); ctx.moveTo(10, 30); ctx.lineTo(100, 30); ctx.stroke(); });
        tryCall('closePath', function () {
            ctx.beginPath(); ctx.moveTo(10, 50); ctx.lineTo(60, 50); ctx.lineTo(60, 75); ctx.closePath(); ctx.stroke();
        });
        tryProperty('lineWidth', function () { ctx.lineWidth = 5; },
            function () { return ctx.lineWidth; }, function (v) { return v === 5; });
        tryProperty('strokeStyle', function () { ctx.strokeStyle = '#ff0000'; },
            function () { return ctx.strokeStyle; }, function (v) { return String(v).toLowerCase() === '#ff0000'; });
        tryProperty('fillStyle', function () { ctx.fillStyle = '#00ff00'; },
            function () { return ctx.fillStyle; }, function (v) { return String(v).toLowerCase() === '#00ff00'; });
        tryProperty('lineCap', function () { ctx.lineCap = 'round'; },
            function () { return ctx.lineCap; }, function (v) { return v === 'round'; });
        tryProperty('lineJoin', function () { ctx.lineJoin = 'round'; },
            function () { return ctx.lineJoin; }, function (v) { return v === 'round'; });
        tryCall('arc', function () { ctx.beginPath(); ctx.arc(150, 40, 25, 0, Math.PI * 2); ctx.stroke(); });
        tryCall('fill', function () { ctx.beginPath(); ctx.arc(200, 40, 15, 0, Math.PI * 2); ctx.fill(); });
        // Visual check for fill() (see header): a filled circle with
        // an 'F' label next to it, at a separate spot on the canvas.
        try {
            ctx.beginPath(); ctx.arc(360, 40, 18, 0, Math.PI * 2);
            ctx.fillStyle = '#0000ff'; ctx.fill();
            ctx.fillStyle = '#000000'; ctx.font = '20px sans-serif';
            ctx.fillText('F', 388, 48);
        } catch (e4) { /* visual check only; the fill probe above stands */ }
        tryCall('fillRect', function () { ctx.fillStyle = '#00ff00'; ctx.fillRect(230, 20, 50, 30); });
        tryCall('clearRect', function () { ctx.clearRect(0, 0, 10, 10); });
        tryCall('fillText', function () { ctx.fillText('A', 300, 45); });
        tryProperty('font', function () { ctx.font = '20px sans-serif'; },
            function () { return ctx.font; }, function (v) { return String(v).indexOf('20') >= 0; });
        tryCall('save/restore', function () { ctx.save(); ctx.restore(); });
        tryCall('translate', function () { ctx.save(); ctx.translate(5, 5); ctx.restore(); });
        tryCall('rotate', function () { ctx.save(); ctx.rotate(0.1); ctx.restore(); });
        // Presence check only (see header comment): no image is drawn.
        record('drawImage', typeof ctx.drawImage === 'function', 'not a function');

        this.okText = 'OK ' + okCount + '/' + results.length;
        this.allResults = sortResults(results);
        this.pageIndex = 0;
        this.showPage();
    },
    goBack() {
        // router.replace is the Lite-capable navigation API; push/back
        // are SystemCapability.ArkUI.Full only, so they are not used.
        router.replace({
            uri: 'pages/index/index'
        });
    }
};
