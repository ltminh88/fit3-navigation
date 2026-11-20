// map.js
// S1 map spike: fixture route on a 480x408 canvas, heading-up. User
// dot at (240, 290); fixed scale 1 px = 2 m. Coordinates are rotated
// in JS with sin/cos; ctx.rotate is deliberately NOT used (phase 02).
// A segment is skipped only when both ends are off screen on the SAME
// side (both x < 0, both x > 480, both y < 0, or both y > 408); a
// segment entering the screen moves to the previous (off-screen)
// point first, then lines to the current point, so the entering part
// is not lost. Draw order: side roads (grey, 3 px) -> main route
// (blue, 8 px) -> user dot. Heading +10 degrees per second; the
// interval stops in onDestroy. Stats bar: last frame ms, max ms,
// frame count. No object is created in the draw loop; decoded arrays
// are reused. The whole draw is in try/catch ('draw FAIL: <message>'
// in the stats bar, keeping the count of frames drawn so far); the
// user dot has its own try/catch so a missing arc/fill does not stop
// the route from being drawn and measured. Note: Date.now() ms are
// only the time JS takes to issue draw commands; lite may draw for
// real after the function returns, so judge smoothness by eye too.
// Assumptions (not verified on the real watch yet): the canvas is
// reachable as this.$refs.mapCanvas (fallback $element('mapCanvas')).

import routeCodec from '../../common/route-codec.js';
import fixtureRoute from '../../common/fixture-route.js';
import router from '@system.router';

var USER_X = 240;
var USER_Y = 290;
var SCREEN_WIDTH = 480;
var SCREEN_HEIGHT = 408;
// 1 px = 2 m, so metres are halved to get pixels.
var METRES_PER_PIXEL = 2;

// True only when both points are off screen on the same side.
function sameSideOutside(ax, ay, bx, by) {
    return (ax < 0 && bx < 0) || (ax > SCREEN_WIDTH && bx > SCREEN_WIDTH) ||
        (ay < 0 && by < 0) || (ay > SCREEN_HEIGHT && by > SCREEN_HEIGHT);
}

function drawPolyline(abs, ctx, cosH, sinH) {
    var i;
    var x;
    var y;
    var sx;
    var sy;
    var prevSx;
    var prevSy;
    var needMove = true;
    ctx.beginPath();
    for (i = 0; i < abs.length; i += 2) {
        x = abs[i];
        y = abs[i + 1];
        sx = USER_X + (x * cosH - y * sinH) / METRES_PER_PIXEL;
        sy = USER_Y - (x * sinH + y * cosH) / METRES_PER_PIXEL;
        if (i === 0) {
            ctx.moveTo(sx, sy);
            needMove = false;
        } else if (sameSideOutside(prevSx, prevSy, sx, sy)) {
            needMove = true;
        } else if (needMove) {
            ctx.moveTo(prevSx, prevSy); ctx.lineTo(sx, sy); needMove = false;
        } else {
            ctx.lineTo(sx, sy);
        }
        prevSx = sx;
        prevSy = sy;
    }
    ctx.stroke();
}

export default {
    data: {
        statsText: 'Dang ve...'
    },
    onInit() {
        var i;
        var decoded;
        this.mainAbs = [];
        this.sideAbsList = [];
        this.heading = 0;
        this.lastMs = 0;
        this.maxMs = 0;
        this.frameCount = 0;
        this.timer = null;
        this.ctx = null;
        if (routeCodec.decodeInto(fixtureRoute.mainRouteDelta,
                this.mainAbs) < 0) {
            this.statsText = 'decode: FAIL';
            return;
        }
        for (i = 0; i < fixtureRoute.sideRoadsDelta.length; i++) {
            decoded = [];
            if (routeCodec.decodeInto(fixtureRoute.sideRoadsDelta[i],
                    decoded) < 0) {
                this.statsText = 'decode: FAIL';
                return;
            }
            this.sideAbsList.push(decoded);
        }
    },
    onShow() {
        var self = this;
        var canvas = null;
        try {
            if (this.$refs && this.$refs.mapCanvas) {
                canvas = this.$refs.mapCanvas;
            }
        } catch (e) { canvas = null; }
        if (canvas === null) {
            try { canvas = this.$element('mapCanvas'); } catch (e2) { canvas = null; }
        }
        if (canvas === null) {
            this.statsText = 'canvas: FAIL';
            return;
        }
        try { this.ctx = canvas.getContext('2d'); } catch (e3) { this.ctx = null; }
        if (this.ctx === null || this.ctx === undefined) {
            this.statsText = 'canvas: FAIL';
            return;
        }
        this.drawFrame();
        this.timer = setInterval(function () {
            self.heading = (self.heading + 10) % 360;
            self.drawFrame();
        }, 1000);
    },
    onDestroy() {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },
    drawFrame() {
        var ctx = this.ctx;
        var startMs;
        var elapsed;
        var rad;
        var cosH;
        var sinH;
        var i;
        if (ctx === null || ctx === undefined) {
            return;
        }
        startMs = Date.now();
        try {
            try {
                ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            } catch (e) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            }
            rad = this.heading * Math.PI / 180;
            cosH = Math.cos(rad);
            sinH = Math.sin(rad);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 3;
            for (i = 0; i < this.sideAbsList.length; i++) {
                drawPolyline(this.sideAbsList[i], ctx, cosH, sinH);
            }
            ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 8;
            drawPolyline(this.mainAbs, ctx, cosH, sinH);
            try {
                ctx.beginPath();
                ctx.arc(USER_X, USER_Y, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#d32f2f';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            } catch (e2) {
                // User dot failed; the route above still counts.
            }
        } catch (e3) {
            this.statsText = 'draw FAIL: ' +
                (e3 && e3.message ? e3.message : e3);
            return;
        }
        elapsed = Date.now() - startMs;
        this.lastMs = elapsed;
        if (elapsed > this.maxMs) {
            this.maxMs = elapsed;
        }
        this.frameCount++;
        this.statsText = this.lastMs + ' ms | max ' + this.maxMs +
            ' ms | ' + this.frameCount + ' frames';
    },
    goBack() {
        // router.replace is the Lite-capable navigation API; push/back
        // are SystemCapability.ArkUI.Full only, so they are not used.
        router.replace({
            uri: 'pages/index/index'
        });
    }
};
