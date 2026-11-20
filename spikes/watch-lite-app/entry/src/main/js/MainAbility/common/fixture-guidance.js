// fixture-guidance.js
// Fake guidance data for the S1b navigation screen mock. The turn
// points themselves come from the route (route-maneuver-extractor);
// these steps supply, in order and cycling, the street name, speed
// limit and next-sign distance paired with each turn. The current
// speed shown on screen is the simulated 36 km/h, not the
// currentSpeed value here (kept for reference). Street names are
// Vietnamese with diacritics on purpose: the page is also the test
// for whether lite renders them (see nav-screen.js).

export default {
    steps: [
        {
            maneuver: 'left',
            distanceM: 150,
            streetName: 'Lê Thánh Tôn',
            speedLimit: 50,
            currentSpeed: 42,
            nextLimitDistanceM: 300
        },
        {
            maneuver: 'right',
            distanceM: 220,
            streetName: 'Nguyễn Huệ',
            speedLimit: 50,
            currentSpeed: 48,
            nextLimitDistanceM: 450
        },
        {
            maneuver: 'straight',
            distanceM: 80,
            streetName: 'Đồng Khởi',
            speedLimit: 40,
            currentSpeed: 35,
            nextLimitDistanceM: 120
        },
        {
            maneuver: 'uturn',
            distanceM: 500,
            streetName: 'Lê Lợi',
            speedLimit: 50,
            currentSpeed: 40,
            nextLimitDistanceM: 600
        },
        {
            maneuver: 'right',
            distanceM: 350,
            streetName: 'Hai Bà Trưng',
            speedLimit: 60,
            currentSpeed: 55,
            nextLimitDistanceM: 800
        }
    ]
};
