// nav-hud.js
// Canvas HUD of the nav screen: the speed-limit sign (top left) and
// the turn icon (56x56 canvas in the black bar). Pure drawing
// functions; the page passes the current values. The speed limit and
// the next-sign distance are still FAKE data (fixture-guidance): real
// speed limits are not in the fixture yet. Only the current speed is
// simulated (29 km/h motorbike, 36 km/h car).

import mapDrawHelpers from './map-draw-helpers.js';

// Speed-limit sign, top left: white disc, red ring, black number;
// two black boxes below with the current speed and the distance to
// the next sign. y = top on lite: the 28 px number is centred in the
// circle (centre 84, 84) with yTop 70; box texts are centred with
// yTop = boxTop + (40 - f) / 2. The 80 px box fits "300 m" at 22 px.
function drawSpeedSign(ctx, speedLimit, speedKmh, nextLimitDistanceM) {
    mapDrawHelpers.drawDisc(ctx, 84, 84, 48, '#FFFFFF');
    ctx.beginPath();
    ctx.arc(84, 84, 45, 0, Math.PI * 2);
    ctx.strokeStyle = '#E53935'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#000000';
    mapDrawHelpers.drawTextTop(ctx, '' + speedLimit, 69, 70, 28);
    ctx.fillStyle = '#000000';
    ctx.fillRect(44, 148, 80, 40); ctx.fillRect(44, 196, 80, 40);
    ctx.fillStyle = '#FFFFFF';
    mapDrawHelpers.drawTextTop(ctx, '' + speedKmh, 70, 155, 26);
    mapDrawHelpers.drawTextTop(ctx, nextLimitDistanceM + ' m', 56, 205, 22);
}

// White turn arrow on a black 56x56 canvas: left, right, uturn,
// or straight ahead (anything else).
function drawTurnIcon(ctx, type) {
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
    } else if (type === 'uturn') {
        ctx.moveTo(38, 50); ctx.lineTo(38, 14); ctx.lineTo(18, 14); ctx.lineTo(18, 38); ctx.moveTo(10, 28); ctx.lineTo(18, 38); ctx.lineTo(26, 28);
    } else {
        ctx.moveTo(28, 46); ctx.lineTo(28, 16); ctx.moveTo(16, 28); ctx.lineTo(28, 16); ctx.lineTo(40, 28);
    }
    ctx.stroke();
}

export default {
    drawSpeedSign: drawSpeedSign,
    drawTurnIcon: drawTurnIcon
};
