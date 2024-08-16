import * as THREE from 'three';

import { planetData } from './dats';


// from NASA JPL: https://ssd.jpl.nasa.gov/planets/approx_pos.html

const julianDate = (date) => {
    return (date / 86400000) + 2440587.5;
}

const centuriesSinceJ2000 = (JD) => {
    return (JD - 2451545.0) / 36525.0;
}

const degreesToRadians = (degrees) => {
    return degrees * (Math.PI / 180);
}

const keplerEquationSolver = (M, e) => {
    let E = M + e * Math.sin(M) * (1.0 + e * Math.cos(M));
    let E0;
    do {
        E0 = E;
        E = E0 - (E0 - e * Math.sin(E0) - M) / (1 - e * Math.cos(E0));
    } while (Math.abs(E - E0) > 1e-6);
    return E;
}

const getPlanetPosition = (str, date) => {
    const data = planetData[str];
    const JD = julianDate(date);
    const T = centuriesSinceJ2000(JD);

    var a = data.a[0] + data.a[1] * T;
    a *= planetData.common.AU;
    const e = data.e[0] + data.e[1] * T;
    const I = degreesToRadians(data.I[0] + data.I[1] * T);
    const L = degreesToRadians(data.L[0] + data.L[1] * T);
    const longPeri = degreesToRadians(data.longPeri[0] + data.longPeri[1] * T);
    const longNode = degreesToRadians(data.longNode[0] + data.longNode[1] * T);

    const w = longPeri - longNode;
    const M = L - longPeri;
    const E = keplerEquationSolver(M, e);

    const x = a * (Math.cos(E) - e);
    const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const r = Math.sqrt(x * x + y * y);
    const v = Math.atan2(y, x);

    const heliocentricZ = r * (Math.cos(longNode) * Math.cos(v + w) - Math.sin(longNode) * Math.sin(v + w) * Math.cos(I));
    const heliocentricY = r * (Math.sin(v + w) * Math.sin(I));
    const heliocentricX = r * (Math.sin(longNode) * Math.cos(v + w) + Math.cos(longNode) * Math.sin(v + w) * Math.cos(I));

    return new THREE.Vector3(heliocentricX, heliocentricY, heliocentricZ);
}

//

function createOrbit(str) {
    const points = [];
    const planet = planetData[str];
    const JD = julianDate(new Date());
    const T = centuriesSinceJ2000(JD);

    // 轨道参数
    let a = planet.a[0] + planet.a[1] * T;
    a *= planetData.common.AU;
    const e = planet.e[0] + planet.e[1] * T;
    const I = degreesToRadians(planet.I[0] + planet.I[1] * T);
    const longPeri = degreesToRadians(planet.longPeri[0] + planet.longPeri[1] * T);
    const longNode = degreesToRadians(planet.longNode[0] + planet.longNode[1] * T);
    const w = longPeri - longNode;

    for (let i = 0; i < 10000; i++) {
        const M = 2 * Math.PI * i / 10000;
        const E = keplerEquationSolver(M, e);

        const x = a * (Math.cos(E) - e);
        const y = a * Math.sqrt(1 - e * e) * Math.sin(E);

        const r = Math.sqrt(x * x + y * y);
        const v = Math.atan2(y, x);

        const heliocentricZ = r * (Math.cos(longNode) * Math.cos(v + w) - Math.sin(longNode) * Math.sin(v + w) * Math.cos(I));
        const heliocentricX = r * (Math.sin(longNode) * Math.cos(v + w) + Math.cos(longNode) * Math.sin(v + w) * Math.cos(I));
        const heliocentricY = r * (Math.sin(v + w) * Math.sin(I));

        points.push(new THREE.Vector3(heliocentricX, heliocentricY, heliocentricZ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: planet.color });
    const orbit = new THREE.Line(geometry, material);

    return orbit;
}

const createSprite = (name) => {
    const texture = new THREE.TextureLoader().load(`/assets/${name}.png`);
    texture.colorSpace = THREE.SRGBColorSpace;// 不然颜色会泛白
    const material = new THREE.SpriteMaterial({ map: texture, color: 0xFFB900 });
    const mesh = new THREE.Sprite(material);
    mesh.name = name;

    return mesh;
};

const createSun = (name, radius) => {
    const texture = new THREE.TextureLoader().load(`/assets/${name}.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffff00 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    const group = new THREE.Group(); //这样方便使用局部坐标系来自转
    group.add(mesh);

    return group;
};

const createPlanet = (name, radius) => {
    let texture1, texture2, material;
    const texture = new THREE.TextureLoader().load(`/assets/${name}.jpg`);
    if(name == 'earth') {
        texture1 = new THREE.TextureLoader().load(`/assets/earth_normal_map.png`);
        texture2 = new THREE.TextureLoader().load(`/assets/earth_specular_map.png`);
        material = new THREE.MeshPhongMaterial({ map: texture, normalMap: texture1, specularMap: texture2 });
    }
    else {
        
        material = new THREE.MeshStandardMaterial({ map: texture });
    };

    texture.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // 自转轴倾角指向
    const group = new THREE.Group(); // 这样方便使用局部坐标系来自转
    group.add(mesh);

    const axialTilt = THREE.MathUtils.degToRad(planetData[name].inc);
    const axialDir = THREE.MathUtils.degToRad(planetData[name].dir);
    group.rotation.z = -axialTilt;
    group.rotation.x = axialDir;

    // 获取当前UTC时间并计算当前自转角度，微调参数保证准确
    const now = new Date();
    const secondsSinceMidnight = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds() - 3600 * planetData[name].hoursLapse;
    const rotationAngle = (secondsSinceMidnight / (planetData[name].day * 3600)) * 2 * Math.PI;
    mesh.rotation.y = rotationAngle; // 设置初始自转角度，使得当前时间对应的地点正对太阳

    return group;
};

const createUniverse = (name, radius) => {
    const texture = new THREE.TextureLoader().load(`/assets/${name}.jpg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;

    return mesh;
};

const createRing = (name, innerRadius, outerRadius) => {
    const ringTextureLoader = new THREE.TextureLoader();
    const ringTexture = ringTextureLoader.load(`/assets/${name}.png`);
    ringTexture.colorSpace = THREE.SRGBColorSpace;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);

    // from THREE.js forum: https://discourse.threejs.org/t/applying-a-texture-to-a-ringgeometry/9990

    var pos = ringGeometry.attributes.position;
    var v3 = new THREE.Vector3();
    var center = (innerRadius + outerRadius) * 0.5;
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        ringGeometry.attributes.uv.setXY(i, v3.length() < center ? 0 : 1, 1);
    }

    //

    const ringMaterial = new THREE.MeshStandardMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);

    ring.castShadow = true;
    ring.receiveShadow = true;

    ring.rotation.x = Math.PI / 2;

    return ring;
};

const createGroup = (body) => {
    const group = new THREE.Group();
    group.add(body);

    return group;
};

export { getPlanetPosition, createOrbit, createSprite, createSun, createPlanet, createUniverse, createRing, createGroup };