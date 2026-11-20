// fixture-guidance.js
// Fake guidance steps for the S1b navigation screen mock.
// No routing, no GPS: the nav-screen page cycles through these 5
// steps (3 seconds each) and counts the distance down every second.
// Street names are Vietnamese with diacritics on purpose: the page
// is also the test for whether lite renders them (see nav-screen.js).

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
