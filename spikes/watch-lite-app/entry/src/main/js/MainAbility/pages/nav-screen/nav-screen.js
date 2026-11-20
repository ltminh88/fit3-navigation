// nav-screen.js
// S1b navigation screen mock for the Fit 3 (480x408, lite wearable).
// Simulates DRIVING along the fixture route at 10 m/s (36 km/h),
// 1 Hz, 1 px = 1 m, heading-up: the road ahead always points up,
// origin = moving user position, only the not-yet-driven part of
// the route is drawn. Guidance comes from the route itself
// (route-maneuver-extractor); street names, speed limits and
// next-sign distances come from fixture-guidance in order, cycling.
// With no turn left, the bar shows "Đến nơi" + distance to the end.
// Exit: tap the black bar (router.replace to the index page). Draw
// time is shown small at the bottom left ("<ms>ms", grey, 16 px);
// removed in the real app. Canvas rules (measured on the Previewer):
// NO fill(), clearRect or drawImage. Background is repainted with
// fillRect each frame; solid discs are arc + stroke; text goes
// through drawTextTop (lite takes fillText y as the TOP of the text).

import routeCodec from '../../common/route-codec.js';
import fixtureRoute from '../../common/fixture-route.js';
import fixtureGuidance from '../../common/fixture-guidance.js';
import mapDrawHelpers from '../../common/map-draw-helpers.js';
import routeFollowSimulator from '../../common/route-follow-simulator.js';
import routeManeuverExtractor from '../../common/route-maneuver-extractor.js';
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
var VERBS = { left: 'Rẽ trái vào ', right: 'Rẽ phải vào ' };

function pad(n) { return n < 10 ? '0' + n : '' + n; }

// Distance to the next turn, as shown: nearest 10 m, or nearest 5 m
// under 100 m.
function roundDistance(d) {
    if (d >= 100) { return Math.round(d / 10) * 10; }
    return Math.round(d / 5) * 5;
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
        this.lastMs = 0;
        this.lastMinute = -1;
        this.timer = null;
        this.ctx = null;
        this.turnCtx = null;
        this.maneuverIndex = 0;
        this.currentStep = fixtureGuidance.steps[0];
        this.remainingAbs = [];
        if (routeCodec.decodeInto(fixtureRoute.mainRouteDelta, this.mainAbs) < 0) { return; }
        for (i = 0; i < fixtureRoute.sideRoadsDelta.length; i++) {
            decoded = [];
            if (routeCodec.decodeInto(fixtureRoute.sideRoadsDelta[i], decoded) < 0) { return; }
            this.sideAbsList.push(decoded);
        }
        this.sim = routeFollowSimulator.create(this.mainAbs);
        this.maneuvers = routeManeuverExtractor.extract(this.mainAbs);
        this.updateGuidance();
    },
    updateGuidance() {
        var step, dist;
        if (this.maneuverIndex < this.maneuvers.length) {
            step = fixtureGuidance.steps[this.maneuverIndex % fixtureGuidance.steps.length];
            dist = this.maneuvers[this.maneuverIndex].distance - this.sim.travelled;
            this.instructionText = (VERBS[this.maneuvers[this.maneuverIndex].type] || 'Đi thẳng vào ') + step.streetName;
        } else {
            step = fixtureGuidance.steps[(this.maneuvers.length - 1) % fixtureGuidance.steps.length];
            dist = this.sim.totalLength - this.sim.travelled;
            this.instructionText = 'Đến nơi';
        }
        this.currentStep = step;
        this.distanceText = roundDistance(dist) + ' m';
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
        var now, prevIndex;
        prevIndex = this.maneuverIndex;
        routeFollowSimulator.step(this.sim, 1);
        this.maneuverIndex = 0;
        while (this.maneuverIndex < this.maneuvers.length &&
            this.sim.travelled >= this.maneuvers[this.maneuverIndex].distance) {
            this.maneuverIndex++;
        }
        this.updateGuidance();
        if (this.maneuverIndex !== prevIndex) { this.drawTurnIcon(); }
        now = new Date();
        if (now.getMinutes() !== this.lastMinute) {
            this.lastMinute = now.getMinutes();
            this.clockText = pad(now.getHours()) + ':' + pad(now.getMinutes());
        }
        this.drawFrame();
    },
    drawFrame() {
        var ctx = this.ctx;
        var rad, cosH, sinH, startMs;
        if (ctx === null || ctx === undefined) { return; }
        startMs = Date.now();
        try {
            ctx.fillStyle = BG;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            rad = this.sim.heading * Math.PI / 180;
            cosH = Math.cos(rad); sinH = Math.sin(rad);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            mapDrawHelpers.drawRoads(this.sideAbsList, fixtureRoute.sideRoadLevels, ctx, cosH, sinH,
                USER_X, USER_Y, METRES_PER_PIXEL, this.sim.posX, this.sim.posY, MAJOR_ROAD, MINOR_ROAD);
            // Remaining route only, starting at the current position.
            routeFollowSimulator.remainingAbs(this.sim, this.remainingAbs);
            ctx.strokeStyle = ROUTE_BLUE; ctx.lineWidth = 6;
            mapDrawHelpers.drawPolyline(this.remainingAbs, ctx, cosH, sinH, USER_X, USER_Y, METRES_PER_PIXEL, this.sim.posX, this.sim.posY);
            mapDrawHelpers.drawDisc(ctx, USER_X, USER_Y, 12, '#FFFFFF');
            mapDrawHelpers.drawDisc(ctx, USER_X, USER_Y, 9, ROUTE_BLUE);
            ctx.fillStyle = '#555555';
            mapDrawHelpers.drawTextTop(ctx, 'Phạm Văn Đồng', 300, 60, 20);
            this.drawSpeedSign(ctx);
            this.lastMs = Date.now() - startMs;
            ctx.fillStyle = '#999999'; mapDrawHelpers.drawTextTop(ctx, this.lastMs + 'ms', 44, 252, 16);
        } catch (e) {
            // A failed draw keeps the previous frame; nothing to show.
        }
    },
    drawSpeedSign(ctx) {
        var step = this.currentStep;
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
        // Current speed shows the simulated 36 km/h, not the fixture value.
        ctx.fillStyle = '#000000';
        ctx.fillRect(44, 148, 80, 40); ctx.fillRect(44, 196, 80, 40);
        ctx.fillStyle = '#FFFFFF';
        mapDrawHelpers.drawTextTop(ctx, '36', 70, 155, 26);
        mapDrawHelpers.drawTextTop(ctx, step.nextLimitDistanceM + ' m', 56, 205, 22);
    },
    drawTurnIcon() {
        var ctx = this.turnCtx;
        var type;
        if (ctx === null || ctx === undefined) { return; }
        type = this.maneuverIndex < this.maneuvers.length ?
            this.maneuvers[this.maneuverIndex].type : 'straight';
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 56, 56);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        if (type === 'left') {
            ctx.moveTo(46, 28); ctx.lineTo(16, 28); ctx.moveTo(28, 16); ctx.lineTo(16, 28); ctx.lineTo(28, 40);
        } else if (type === 'right') {
            ctx.moveTo(10, 28); ctx.lineTo(40, 28); ctx.moveTo(28, 16); ctx.lineTo(40, 28); ctx.lineTo(28, 40);
        } else {
            ctx.moveTo(28, 46); ctx.lineTo(28, 16); ctx.moveTo(16, 28); ctx.lineTo(28, 16); ctx.lineTo(40, 28);
        }
        ctx.stroke();
    },
    goHome() { router.replace({ uri: 'pages/index/index' }); }
};
