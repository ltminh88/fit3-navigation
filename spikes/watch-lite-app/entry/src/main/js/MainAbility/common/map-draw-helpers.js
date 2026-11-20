// map-draw-helpers.js
// Shared canvas drawing helpers for the S1 map page and the S1b
// navigation screen. ES5 only. These use ONLY canvas APIs measured
// working on the Previewer liteWearable: beginPath, moveTo, lineTo,
// stroke, arc (stroke), fillRect, fillText, lineWidth, strokeStyle,
// fillStyle, lineCap, lineJoin, font. They never call fill(),
// clearRect or drawImage (fill() draws nothing; clearRect and
// drawImage do not exist on lite).
// A solid disc is drawn with arc + stroke: arc radius r/2 with
// lineWidth r paints a solid disc of radius r.

var SCREEN_WIDTH = 480;
var SCREEN_HEIGHT = 408;

// True only when both points are off screen on the same side.
function sameSideOutside(ax, ay, bx, by) {
    return (ax < 0 && bx < 0) || (ax > SCREEN_WIDTH && bx > SCREEN_WIDTH) ||
        (ay < 0 && by < 0) || (ay > SCREEN_HEIGHT && by > SCREEN_HEIGHT);
}

// Project a map point (metres, north = -y on screen) to screen
// pixels with heading-up rotation, writing into out[0]/out[1].
// originX/originY is the screen position of the map origin;
// metresPerPixel is 2 on both pages (1 px = 2 m).
function projectInto(x, y, cosH, sinH, originX, originY, metresPerPixel, out) {
    out[0] = originX + (x * cosH - y * sinH) / metresPerPixel;
    out[1] = originY - (x * sinH + y * cosH) / metresPerPixel;
}

// Draw a polyline of absolute map points [x, y, x, y, ...].
// A segment is skipped only when both ends are off screen on the
// SAME side; a segment entering the screen moves to the previous
// (off-screen) point first, so the entering part is not lost.
// No object is created per point (one scratch array is reused).
var SCRATCH = [0, 0];

function drawPolyline(abs, ctx, cosH, sinH, originX, originY, metresPerPixel) {
    var i, sx, sy, prevSx, prevSy;
    var needMove = true;
    ctx.beginPath();
    for (i = 0; i < abs.length; i += 2) {
        projectInto(abs[i], abs[i + 1], cosH, sinH,
            originX, originY, metresPerPixel, SCRATCH);
        sx = SCRATCH[0];
        sy = SCRATCH[1];
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

// Solid disc of the given radius and color, drawn with arc + stroke
// (fill() does not draw on lite, so it is never used here).
function drawDisc(ctx, cx, cy, radius, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius / 2, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = radius;
    ctx.stroke();
}

export default {
    sameSideOutside: sameSideOutside,
    projectInto: projectInto,
    drawPolyline: drawPolyline,
    drawDisc: drawDisc
};
