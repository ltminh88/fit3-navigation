// nav-screen.js
// S1c navigation screen for the Fit 3 (480x408, lite wearable).
// REAL data: OpenStreetMap roads + a real Valhalla route, Chợ Bến
// Thành -> Nhà thờ Đức Bà (fixture-real-map.js, © OpenStreetMap
// contributors). Driving at 8 m/s (motorbike) or 10 m/s (car), 1 Hz,
// 1 px = 1 m, heading-up, origin = moving user position, only the
// not-yet-driven part of the route is drawn. Guidance comes from the
// route's own maneuvers; the street name top right is the street
// being driven. Tap the clock to switch motorbike <-> car (restarts
// the route). At the end, "Đến nơi" holds for 3 s, then the route
// restarts. Exit: tap the black bar. Draw time + roads drawn are
// shown small at the bottom left ("<ms>ms <n>r"); removed in the
// real app. Canvas rules (measured on the Previewer): NO fill(),
// clearRect or drawImage; text via drawTextTop (lite takes fillText
// y as the TOP of the text). The speed-limit sign and the two black
// boxes still show FAKE data (fixture-guidance).

import fixtureRealMap from '../../common/fixture-real-map.js';
import mapThemeColors from '../../common/map-theme-colors.js';
import fixtureGuidance from '../../common/fixture-guidance.js';
import mapDrawHelpers from '../../common/map-draw-helpers.js';
import routeFollowSimulator from '../../common/route-follow-simulator.js';
import realMapLoader from '../../common/real-map-loader.js';
import navHud from '../../common/nav-hud.js';
import router from '@system.router';

var USER_X = 240;
var USER_Y = 200;
var SCREEN_WIDTH = 480;
var SCREEN_HEIGHT = 408;
// Nav-screen scale: 1 px = 1 m (the S1 map page keeps 1 px = 2 m).
var METRES_PER_PIXEL = 1;
// Map colours live in common/map-theme-colors.js (S1d contrast fix:
// minor border #B9B4AA, major border #D98E2B / core #F7C948).
var VERBS = { left: 'Rẽ trái vào ', right: 'Rẽ phải vào ', uturn: 'Quay đầu vào ' };
var BIKE_SPEED_MPS = 8;
var CAR_SPEED_MPS = 10;
var FILTER_RADIUS_M = 450;
var ARRIVAL_HOLD_S = 3;

function pad(n) { return n < 10 ? '0' + n : '' + n; }

// Distance to the next turn, as shown: nearest 10 m, or nearest 5 m
// under 100 m.
function roundDistance(d) {
    if (d >= 100) { return Math.round(d / 10) * 10; }
    return Math.round(d / 5) * 5;
}

export default {
    data: { clockText: '--:--', vehicleText: 'XM', distanceText: '', instructionText: '' },
    onInit() {
        var mapData = realMapLoader.load();
        if (mapData === null) { return; }
        this.routeAbs = mapData.routeAbs;
        this.sideAbsList = mapData.sideAbsList;
        this.sideLevels = mapData.sideLevels;
        this.roadBboxes = mapData.roadBboxes;
        this.lastMs = 0; this.drawnRoads = 0; this.lastMinute = -1;
        this.timer = null; this.ctx = null; this.turnCtx = null;
        this.maneuverIndex = 0; this.arrivalSeconds = 0;
        this.currentStep = fixtureGuidance.steps[0];
        this.currentStreetName = '';
        this.remainingAbs = []; this.visibleRoads = [];
        this.loadVehicle('motorbike');
    },
    loadVehicle(vehicle) {
        var route = fixtureRealMap.routes[vehicle];
        this.vehicle = vehicle;
        this.sim = routeFollowSimulator.create(this.routeAbs[vehicle], false);
        this.sim.speedMPerS = vehicle === 'motorbike' ? BIKE_SPEED_MPS : CAR_SPEED_MPS;
        this.speedKmh = vehicle === 'motorbike' ? 29 : 36;
        this.maneuvers = route.maneuvers;
        this.maneuverIndex = 0; this.arrivalSeconds = 0;
        this.vehicleText = vehicle === 'motorbike' ? 'XM' : 'OTO';
        this.currentStreetName = this.maneuvers.length > 0 ? this.maneuvers[0].streetName : '';
        this.updateGuidance();
    },
    toggleVehicle() {
        this.loadVehicle(this.vehicle === 'motorbike' ? 'car' : 'motorbike');
        this.redrawTurnIcon(); this.drawFrame();
    },
    updateGuidance() {
        var step, dist, type, name;
        if (this.maneuverIndex < this.maneuvers.length) {
            type = this.maneuvers[this.maneuverIndex].maneuver;
            dist = this.maneuvers[this.maneuverIndex].distanceM - this.sim.travelled;
            this.instructionText = type === 'arrive' ? 'Đến nơi' :
                (VERBS[type] || 'Đi thẳng vào ') + this.maneuvers[this.maneuverIndex].streetName;
        } else {
            dist = this.sim.totalLength - this.sim.travelled;
            this.instructionText = 'Đến nơi';
        }
        // Street being driven: the street of the maneuver just passed.
        if (this.maneuverIndex > 0) {
            name = this.maneuvers[this.maneuverIndex - 1].streetName;
            if (name) { this.currentStreetName = name; }
        }
        // FAKE speed data (see the file header): the limit and the
        // next-sign distance come from fixture-guidance, paired with
        // the maneuver index; only the current speed is simulated.
        step = fixtureGuidance.steps[this.maneuverIndex % fixtureGuidance.steps.length];
        this.currentStep = step;
        this.distanceText = roundDistance(dist) + ' m';
    },
    getCanvas(refName) {
        var canvas = null;
        try { canvas = this.$refs[refName]; } catch (e) { canvas = null; }
        if (canvas === null || canvas === undefined) { try { canvas = this.$element(refName); } catch (e2) { canvas = null; } }
        if (canvas === null || canvas === undefined) { return null; }
        try { return canvas.getContext('2d'); } catch (e3) { return null; }
    },
    onShow() {
        var self = this;
        this.ctx = this.getCanvas('mapCanvas');
        this.turnCtx = this.getCanvas('turnCanvas');
        if (this.ctx === null) { return; }
        this.drawFrame(); this.redrawTurnIcon();
        this.timer = setInterval(function () { self.tick(); }, 1000);
    },
    onDestroy() { if (this.timer !== null) { clearInterval(this.timer); this.timer = null; } },
    tick() {
        var now, prevIndex;
        prevIndex = this.maneuverIndex;
        if (this.sim.travelled >= this.sim.totalLength) {
            this.arrivalSeconds++;
            if (this.arrivalSeconds >= ARRIVAL_HOLD_S) {
                routeFollowSimulator.reset(this.sim);
                this.maneuverIndex = 0; this.arrivalSeconds = 0;
                this.currentStreetName = this.maneuvers.length > 0 ? this.maneuvers[0].streetName : '';
                this.updateGuidance(); this.redrawTurnIcon();
            }
        } else {
            routeFollowSimulator.step(this.sim, 1);
            this.maneuverIndex = 0;
            while (this.maneuverIndex < this.maneuvers.length &&
                this.sim.travelled >= this.maneuvers[this.maneuverIndex].distanceM) {
                this.maneuverIndex++;
            }
            this.updateGuidance();
            if (this.maneuverIndex !== prevIndex) { this.redrawTurnIcon(); }
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
        var rad, cosH, sinH, name, nameX, startMs;
        if (ctx === null || ctx === undefined) { return; }
        startMs = Date.now();
        try {
            ctx.fillStyle = mapThemeColors.BG;
            ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            rad = this.sim.heading * Math.PI / 180;
            cosH = Math.cos(rad); sinH = Math.sin(rad);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            // Only roads near the user are drawn (bbox filter, 450 m).
            this.drawnRoads = mapDrawHelpers.filterVisibleRoads(this.roadBboxes,
                this.sideAbsList.length, this.sim.posX, this.sim.posY,
                FILTER_RADIUS_M, this.visibleRoads);
            mapDrawHelpers.drawRoads(this.sideAbsList, this.sideLevels, this.visibleRoads, ctx, cosH, sinH,
                USER_X, USER_Y, METRES_PER_PIXEL, this.sim.posX, this.sim.posY);
            // Remaining route only, starting at the current position.
            routeFollowSimulator.remainingAbs(this.sim, this.remainingAbs);
            ctx.strokeStyle = mapThemeColors.ROUTE_BLUE; ctx.lineWidth = 6;
            mapDrawHelpers.drawPolyline(this.remainingAbs, ctx, cosH, sinH, USER_X, USER_Y, METRES_PER_PIXEL, this.sim.posX, this.sim.posY);
            mapDrawHelpers.drawDisc(ctx, USER_X, USER_Y, 12, '#FFFFFF');
            mapDrawHelpers.drawDisc(ctx, USER_X, USER_Y, 9, mapThemeColors.ROUTE_BLUE);
            // Current street, top right, below the clock: right-aligned
            // by estimated width (~11 px per character at 20 px, no
            // measureText on lite), never past the 44 px safe margin.
            ctx.fillStyle = mapThemeColors.STREET_NAME;
            name = this.currentStreetName;
            nameX = 440 - name.length * 11;
            if (nameX < 44) { nameX = 44; }
            mapDrawHelpers.drawTextTop(ctx, name, nameX, 92, 20);
            navHud.drawSpeedSign(ctx, this.currentStep.speedLimit, this.speedKmh, this.currentStep.nextLimitDistanceM);
            this.lastMs = Date.now() - startMs;
            ctx.fillStyle = mapThemeColors.MS_TEXT; mapDrawHelpers.drawTextTop(ctx, this.lastMs + 'ms ' + this.drawnRoads + 'r', 44, 252, 16);
        } catch (e) {
            // A failed draw keeps the previous frame; nothing to show.
        }
    },
    redrawTurnIcon() {
        var ctx = this.turnCtx;
        var type;
        if (ctx === null || ctx === undefined) { return; }
        type = this.maneuverIndex < this.maneuvers.length ? this.maneuvers[this.maneuverIndex].maneuver : 'straight';
        navHud.drawTurnIcon(ctx, type);
    },
    goHome() { router.replace({ uri: 'pages/index/index' }); }
};
