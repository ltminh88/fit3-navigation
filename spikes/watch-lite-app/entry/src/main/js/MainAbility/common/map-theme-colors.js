// map-theme-colors.js
// All map colours in one place, so contrast can be tuned without
// touching the drawing code. Used by the nav screen (and by
// map-draw-helpers.js as the default road styles).
// Road style format: [border colour, border width, core colour, core width].
// History: minor border was #DADADA (too pale on the beige background,
// S1d); major border/core were #E8A33D/#F9D56E.

var BG = '#F2EFE9';
var ROUTE_BLUE = '#2F7CF6';
var MAJOR_ROAD = ['#D98E2B', 6, '#F7C948', 4];
var MINOR_ROAD = ['#B9B4AA', 5, '#FFFFFF', 3];
var STREET_NAME = '#555555';
var MS_TEXT = '#999999';

export default {
    BG: BG,
    ROUTE_BLUE: ROUTE_BLUE,
    MAJOR_ROAD: MAJOR_ROAD,
    MINOR_ROAD: MINOR_ROAD,
    STREET_NAME: STREET_NAME,
    MS_TEXT: MS_TEXT
};
