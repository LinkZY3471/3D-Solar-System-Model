// 单位:
// radius, AU: 10000KM
// a: au, au/Cy
// e: rad, rad/Cy
// L, long.peri., long.node.: deg, deg/Cy
// day: hours

const planetData = {
    common: {
        AU: 14959.7870895
    },
    universe: {
        radius: 100000000000, //足够大就行
        name: 'stars'
    },
    sun: {
        radius: 69.6,
        name: 'sun'
    },
    mercury: {
        a: [0.38709927, 0.00000037],
        e: [0.20563593, 0.00001906],
        I: [7.00497902, -0.00594749],
        L: [252.25032350, 149472.67411175],
        longPeri: [77.45779628, 0.16047689],
        longNode: [48.33076593, -0.12534081],
        radius: 0.2440,
        name: 'mercury',
        color: 0xEB3324,
        day: 1407.6,
        inc: 0.034,
        dir: 0,
        ra: 281,
        dec: 61.414,
        hoursLapse: 800
    },
    venus: {
        a: [0.72333566, 0.00000390],
        e: [0.00677672, -0.00004107],
        I: [3.39467605, -0.00078890],
        L: [181.97909950, 58517.81538729],
        longPeri: [131.60246718, 0.00268329],
        longNode: [76.67984255, -0.27769418],
        radius: 0.6052,
        name: 'venus',
        color: 0xF08650,
        day: -5832.5,
        inc: 177.4,
        dir: 0,
        ra: 272.76,
        dec: 67.16,
        hoursLapse: 3500
    },
    earth: {
        a: [1.00000261, 0.00000562],
        e: [0.01671123, -0.00004392],
        I: [-0.00001531, -0.01294668],
        L: [100.46457166, 35999.37244981],
        longPeri: [102.93768193, 0.32327364],
        longNode: [0.0, 0.0],
        radius: 0.6378,
        name: 'earth',
        color: 0x00F015,
        day: 23.9,
        inc: 23.4,
        dir: 0,
        ra: 0,
        dec: 90,
        hoursLapse: 11
    },
    mars: {
        a: [1.52371034, 0.00001847],
        e: [0.09339410, 0.00007882],
        I: [1.84969142, -0.00813131],
        L: [-4.55343205, 19140.30268499],
        longPeri: [-23.94362959, 0.44441088],
        longNode: [49.55953891, -0.29257343],
        radius: 0.3397,
        name: 'mars',
        color: 0xFFFD55,
        day: 24.6,
        inc: -25.2,
        dir: 25,
        ra: 317.654,
        dec: 52.871,
        hoursLapse: 18.5
    },
    jupiter: {
        a: [5.20288700, -0.00011607],
        e: [0.04838624, -0.00013253],
        I: [1.30439695, -0.00183714],
        L: [34.39644051, 3034.74612775],
        longPeri: [14.72847983, 0.21252668],
        longNode: [100.47390909, 0.20469106],
        radius: 7.1492,
        name: 'jupiter',
        color: 0x73FBFD,
        day: 9.9,
        inc: -3.1,
        dir: 0,
        ra: 268.057,
        dec: 64.496,
        hoursLapse: 2.1
    },
    saturn: {
        a: [9.53667594, -0.00125060],
        e: [0.05386179, -0.00050991],
        I: [2.48599187, 0.00193609],
        L: [49.95424423, 1222.49362201],
        longPeri: [92.59887831, -0.41897216],
        longNode: [113.66242448, -0.28867794],
        radius: 6.0268,
        innerRing: 7.4658,
        outerRing: 13.678,
        name: 'saturn',
        ringName: 'saturn-rings-top',
        color: 0x3282F6,
        day: 10.7,
        inc: 26.7,
        dir: 4,
        ra: 40.580,
        dec: 83.536,
        hoursLapse: 11
    },
    uranus: {
        a: [19.18916464, -0.00196176],
        e: [0.04725744, -0.00004397],
        I: [0.77263783, -0.00242939],
        L: [313.23810451, 428.48202785],
        longPeri: [170.95427630, 0.40805281],
        longNode: [74.01692503, 0.04240589],
        radius: 2.5559,
        innerRing: 4.187,
        outerRing: 5.115,
        name: 'uranus',
        ringName: 'uranus-rings',
        color: 0x732BF5,
        day: -17.2,
        inc: 100,
        dir: -80,
        ra: 257.311,
        dec: -15.175,
        hoursLapse: 11
    },
    neptune: {
        a: [30.06992276, 0.00026291],
        e: [0.00859048, 0.00005105],
        I: [1.77004347, 0.00035372],
        L: [-55.12002969, 218.45945325],
        longPeri: [44.96476227, -0.32241464],
        longNode: [131.78422574, -0.00508664],
        radius: 2.4764,
        innerRing: 4.19,
        outerRing: 6.29,
        name: 'neptune',
        ringName: 'neptune-rings',
        color: 0xEA3FF7,
        day: 16.1,
        inc: 0,
        dir: 15,
        ra: 299.489,
        dec: 42.958,
        hoursLapse: 1.5
    }
};

export { planetData };