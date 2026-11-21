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
// TEXT RULE (measured on the Previewer): fillText(x, y) takes y as
// the TOP of the text, not the baseline as on the web. So a text of
// font size f centred in a box of height h starting at boxTop needs
// yTop = boxTop + (h - f) / 2. Always draw text through drawTextTop
// below, never call fillText directly, so the rule stays in one place.

import mapThemeColors from './map-theme-colors.js';

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
// metresPerPixel is 2 on the S1 map page, 1 on the nav screen.
// mapOriginX/mapOriginY is the map point shown at that screen
// position (0, 0 on the map page; the moving user position on the
// nav screen, so the whole map shifts as the user drives).
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

function drawPolyline(abs, ctx, cosH, sinH, originX, originY, metresPerPixel, mapOriginX, mapOriginY) {
    var i, sx, sy, prevSx, prevSy;
    var needMove = true;
    if (mapOriginX === undefined) { mapOriginX = 0; }
    if (mapOriginY === undefined) { mapOriginY = 0; }
    ctx.beginPath();
    for (i = 0; i < abs.length; i += 2) {
        projectInto(abs[i] - mapOriginX, abs[i + 1] - mapOriginY, cosH, sinH,
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

// Draw text with y as the TOP edge of the text (the lite rule above).
// Sets the font as well, so callers never set ctx.font for text.
function drawTextTop(ctx, text, x, yTop, fontPx) {
    ctx.font = fontPx + 'px sans-serif';
    ctx.fillText(text, x, yTop);
}

// Compass bearing of the vector (x1, y1) -> (x2, y2), in map metres
// (x east, y north): 0 = north, 90 = east, 180 = south, 270 = west.
function bearingDeg(x1, y1, x2, y2) {
    var deg = Math.atan2(x2 - x1, y2 - y1) * 180 / Math.PI;
    return deg < 0 ? deg + 360 : deg;
}

function normDeg(d) {
    d = d % 360;
    return d < 0 ? d + 360 : d;
}

// Shortest signed turn from one bearing to another,
// in (-180, 180]: positive = right, negative = left.
function turnDiffDeg(from, to) {
    var d = normDeg(to - from);
    return d > 180 ? d - 360 : d;
}

// Draw every road twice: borders of all roads first, then cores,
// so junctions stay smooth. Each style is [border color, border
// width, core color, core width]; originX/originY is the screen
// position of the map origin, mapOriginX/mapOriginY the map point
// shown there.
// indices is the list of road indexes to draw (null = all roads).
// majorStyle/minorStyle default to the map theme when not given.
function drawRoads(roads, levels, indices, ctx, cosH, sinH, originX, originY,
    metresPerPixel, mapOriginX, mapOriginY, majorStyle, minorStyle) {
    var i, k, style;
    if (majorStyle === null || majorStyle === undefined) { majorStyle = mapThemeColors.MAJOR_ROAD; }
    if (minorStyle === null || minorStyle === undefined) { minorStyle = mapThemeColors.MINOR_ROAD; }
    for (k = 0; k < (indices === null ? roads.length : indices.length); k++) {
        i = indices === null ? k : indices[k];
        style = levels[i] === 'major' ? majorStyle : minorStyle;
        ctx.strokeStyle = style[0]; ctx.lineWidth = style[1];
        drawPolyline(roads[i], ctx, cosH, sinH, originX, originY,
            metresPerPixel, mapOriginX, mapOriginY);
    }
    for (k = 0; k < (indices === null ? roads.length : indices.length); k++) {
        i = indices === null ? k : indices[k];
        style = levels[i] === 'major' ? majorStyle : minorStyle;
        ctx.strokeStyle = style[2]; ctx.lineWidth = style[3];
        drawPolyline(roads[i], ctx, cosH, sinH, originX, originY,
            metresPerPixel, mapOriginX, mapOriginY);
    }
}

// Bounding box of each road as a flat array [minX, minY, maxX, maxY]
// per road, built once at init so the per-frame filter is cheap.
function buildRoadBboxes(roads) {
    var out = [];
    var i, j, minX, minY, maxX, maxY;
    for (i = 0; i < roads.length; i++) {
        minX = roads[i][0]; minY = roads[i][1];
        maxX = roads[i][0]; maxY = roads[i][1];
        for (j = 2; j < roads[i].length; j += 2) {
            if (roads[i][j] < minX) { minX = roads[i][j]; }
            if (roads[i][j] > maxX) { maxX = roads[i][j]; }
            if (roads[i][j + 1] < minY) { minY = roads[i][j + 1]; }
            if (roads[i][j + 1] > maxY) { maxY = roads[i][j + 1]; }
        }
        out.push(minX, minY, maxX, maxY);
    }
    return out;
}

// Fill out[] with the indexes of roads whose bbox is within radius
// metres of (posX, posY); returns the count. out is reused per frame.
function filterVisibleRoads(bboxes, roadCount, posX, posY, radius, out) {
    var i, b, n = 0;
    for (i = 0; i < roadCount; i++) {
        b = i * 4;
        if (bboxes[b + 2] < posX - radius || bboxes[b] > posX + radius ||
            bboxes[b + 3] < posY - radius || bboxes[b + 1] > posY + radius) {
            continue;
        }
        out[n++] = i;
    }
    out.length = n;
    return n;
}

export default {
    sameSideOutside: sameSideOutside,
    projectInto: projectInto,
    drawPolyline: drawPolyline,
    drawDisc: drawDisc,
    drawTextTop: drawTextTop,
    bearingDeg: bearingDeg,
    normDeg: normDeg,
    turnDiffDeg: turnDiffDeg,
    drawRoads: drawRoads,
    buildRoadBboxes: buildRoadBboxes,
    filterVisibleRoads: filterVisibleRoads
};
