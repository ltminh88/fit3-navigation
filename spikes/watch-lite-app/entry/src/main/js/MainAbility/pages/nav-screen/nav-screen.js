// nav-screen.js
// S1b navigation screen mock for the Fit 3 (480x408, lite wearable).
// Fake data only: the fixture route + 5 guidance steps, heading-up
// at 10 degrees per second, at 1 px = 1 m. Exit: tap the black bar
// at the bottom (router.replace back to the index page); there is
// no other button. The per-frame draw time is shown small at the
// bottom left of the map ("<ms>ms", grey, 16 px) so the dense street
// grid can be judged for slowness; it will be removed in the real app.
// Canvas rules (measured on the Previewer): NO fill(), clearRect or
// drawImage anywhere on this page. Background is repainted with
// fillRect each frame; solid discs are arc + stroke (map-draw-helpers).
// FONT TEST: this page checks whether lite renders Vietnamese
// diacritics and font-size 38/26 px as written — look at "Rẽ trái
// vào Lê Thánh Tôn" and "150 m" on the Previewer and note the result
// in the PR description. The street-name text x is estimated (no
// measureText on lite): "Phạm Văn Đồng" at 20 px is about 140 px
// wide, so it starts at x = 300 (right margin 40 px). All important
// text is at least 40 px from the edges: the round Previewer cuts
// the corners of the 480x408 rectangle.

import routeCodec from '../../common/route-codec.js';
import fixtureRoute from '../../common/fixture-route.js';
import fixtureGuidance from '../../common/fixture-guidance.js';
import mapDrawHelpers from '../../common/map-draw-helpers.js';
import router from '@system.router';

var USER_X = 240;
var USER_Y = 200;
var SCREEN_WIDTH = 480;
var SCREEN_HEIGHT = 408;
// Nav-screen scale: 1 px = 1 m (the S1 map page keeps 1 px = 2 m).
var METRES_PER_PIXEL = 1;
var BG = '#F2EFE9';
var ROUTE_BLUE = '#2F7CF6';
// Road hierarchy: [border color, border width, core color, core width].
var MAJOR_ROAD = ['#E8A33D', 6, '#F9D56E', 4];
var MINOR_ROAD = ['#DADADA', 5, '#FFFFFF', 3];

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function maneuverVerb(m) {
    if (m === 'left') { return 'Rẽ trái vào '; }
    if (m === 'right') { return 'Rẽ phải vào '; }
    if (m === 'uturn') { return 'Quay đầu vào '; }
    return 'Đi thẳng vào ';
}

// Borders of every road first, then cores: junctions stay smooth.
function drawRoads(roads, levels, ctx, cosH, sinH) {
    var i, style;
    for (i = 0; i < roads.length; i++) {
        style = levels[i] === 'major' ? MAJOR_ROAD : MINOR_ROAD;
        ctx.strokeStyle = style[0]; ctx.lineWidth = style[1];
        mapDrawHelpers.drawPolyline(roads[i], ctx, cosH, sinH, USER_X, USER_Y, METRES_PER_PIXEL);
    }
    for (i = 0; i < roads.length; i++) {
        style = levels[i] === 'major' ? MAJOR_ROAD : MINOR_ROAD;
        ctx.strokeStyle = style[2]; ctx.lineWidth = style[3];
        mapDrawHelpers.drawPolyline(roads[i], ctx, cosH, sinH, USER_X, USER_Y, METRES_PER_PIXEL);
    }
}

export default {
    data: {
        clockText: '--:--',
        distanceText: '',
        instructionText: ''
    },
    onInit() {
        var i, decoded;
        this.mainAbs = [];
        this.sideAbsList = [];
        this.heading = 0;
        this.stepIndex = 0; this.lastMs = 0;
        this.stepSeconds = 0;
        this.lastMinute = -1;
        this.timer = null;
        this.ctx = null;
        this.turnCtx = null;
        if (routeCodec.decodeInto(fixtureRoute.mainRouteDelta, this.mainAbs) < 0) { return; }
        for (i = 0; i < fixtureRoute.sideRoadsDelta.length; i++) {
            decoded = [];
            if (routeCodec.decodeInto(fixtureRoute.sideRoadsDelta[i], decoded) < 0) { return; }
            this.sideAbsList.push(decoded);
        }
        this.applyStep();
    },
    applyStep() {
        var step = fixtureGuidance.steps[this.stepIndex];
        this.remainingM = step.distanceM;
        this.stepSeconds = 0;
        this.distanceText = step.distanceM + ' m';
        this.instructionText = maneuverVerb(step.maneuver) + step.streetName;
    },
    getCanvas(refName) {
        var canvas = null;
        try { if (this.$refs && this.$refs[refName]) { canvas = this.$refs[refName]; } } catch (e) { canvas = null; }
        if (canvas === null) { try { canvas = this.$element(refName); } catch (e2) { canvas = null; } }
        if (canvas === null) { return null; }
        try { return canvas.getContext('2d'); } catch (e3) { return null; }
    },
    onShow() {
        var self = this;
        this.ctx = this.getCanvas('mapCanvas');
        this.turnCtx = this.getCanvas('turnCanvas');
        if (this.ctx === null) { return; }
        this.drawFrame(); this.drawTurnIcon();
        this.timer = setInterval(function () { self.tick(); }, 1000);
    },
    onDestroy() {
        if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    },
    tick() {
        var now;
        this.heading = (this.heading + 10) % 360;
        this.remainingM -= 10;
        if (this.remainingM < 0) { this.remainingM = 0; }
        this.stepSeconds++;
        if (this.stepSeconds >= 3) {
            this.stepIndex = (this.stepIndex + 1) % fixtureGuidance.steps.length;
            this.applyStep(); this.drawTurnIcon();
        } else {
            this.distanceText = this.remainingM + ' m';
        }
        now = new Date();
        if (now.getMinutes() !== this.lastMinute) {
            this.lastMinute = now.getMinutes();
            this.clockText = pad(now.getHours()) + ':' + pad(now.getMinutes());
        }
        this.drawFrame();
    },
    drawFrame() {
        var ctx = this.ctx;
        var rad, cosH, sinH, step, startMs;
        if (ctx === null || ctx === undefined) { return; }
        startMs = Date.now();
        try {
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            rad = this.heading * Math.PI / 180;
            cosH = Math.cos(rad); sinH = Math.sin(rad);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            drawRoads(this.sideAbsList, fixtureRoute.sideRoadLevels, ctx, cosH, sinH);
            ctx.strokeStyle = ROUTE_BLUE; ctx.lineWidth = 6;
            mapDrawHelpers.drawPolyline(this.mainAbs, ctx, cosH, sinH, USER_X, USER_Y, METRES_PER_PIXEL);
            mapDrawHelpers.drawDisc(ctx, USER_X, USER_Y, 12, '#FFFFFF');
            mapDrawHelpers.drawDisc(ctx, USER_X, USER_Y, 9, ROUTE_BLUE);
            ctx.fillStyle = '#555555';
            mapDrawHelpers.drawTextTop(ctx, 'Phạm Văn Đồng', 300, 60, 20);
            step = fixtureGuidance.steps[this.stepIndex];
            this.drawSpeedSign(ctx, step);
            this.lastMs = Date.now() - startMs;
            ctx.fillStyle = '#999999'; mapDrawHelpers.drawTextTop(ctx, this.lastMs + 'ms', 44, 252, 16);
        } catch (e) {
            // A failed draw keeps the previous frame; nothing to show.
        }
    },
    drawSpeedSign(ctx, step) {
        // Speed-limit sign, top left: white disc, red ring, black number.
        mapDrawHelpers.drawDisc(ctx, 84, 84, 48, '#FFFFFF');
        ctx.beginPath();
        ctx.arc(84, 84, 45, 0, Math.PI * 2);
        ctx.strokeStyle = '#E53935'; ctx.lineWidth = 5; ctx.stroke();
        ctx.fillStyle = '#000000';
        // y = top on lite: centre the 28 px number (circle centre 84, 84).
        mapDrawHelpers.drawTextTop(ctx, '' + step.speedLimit, 69, 70, 28);
        // Black boxes below (fillRect: square corners, no rounded rect).
        // Text centred vertically: yTop = boxTop + (40 - f) / 2. The 80 px
        // box fits "300 m" at 22 px (about 55 px wide, x 56..111, box ends 124).
        ctx.fillStyle = '#000000';
        ctx.fillRect(44, 148, 80, 40); ctx.fillRect(44, 196, 80, 40);
        ctx.fillStyle = '#FFFFFF';
        mapDrawHelpers.drawTextTop(ctx, '' + step.currentSpeed, 70, 155, 26);
        mapDrawHelpers.drawTextTop(ctx, step.nextLimitDistanceM + ' m', 56, 205, 22);
    },
    drawTurnIcon() {
        var ctx = this.turnCtx;
        var step;
        if (ctx === null || ctx === undefined) { return; }
        step = fixtureGuidance.steps[this.stepIndex];
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 56, 56);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        if (step.maneuver === 'left') {
            ctx.moveTo(46, 28); ctx.lineTo(16, 28); ctx.moveTo(28, 16); ctx.lineTo(16, 28); ctx.lineTo(28, 40);
        } else if (step.maneuver === 'right') {
            ctx.moveTo(10, 28); ctx.lineTo(40, 28); ctx.moveTo(28, 16); ctx.lineTo(40, 28); ctx.lineTo(28, 40);
        } else if (step.maneuver === 'uturn') {
            ctx.moveTo(38, 50); ctx.lineTo(38, 14); ctx.lineTo(18, 14); ctx.lineTo(18, 38); ctx.moveTo(10, 28); ctx.lineTo(18, 38); ctx.lineTo(26, 28);
        } else {
            ctx.moveTo(28, 46); ctx.lineTo(28, 16); ctx.moveTo(16, 28); ctx.lineTo(28, 16); ctx.lineTo(40, 28);
        }
        ctx.stroke();
    },
    goHome() { router.replace({ uri: 'pages/index/index' }); }
};
