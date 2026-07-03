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

const normalizeDegrees = (degrees) => {
    return ((degrees % 360) + 360) % 360;
}

const evaluatePolynomial = (coefficients, value) => {
    return coefficients.reduce((sum, coefficient, index) => sum + coefficient * (value ** index), 0);
}

const evaluateTrigSeries = (coefficients = [], phases = [], trigFn) => {
    let sum = 0;
    const count = Math.min(coefficients.length, phases.length);
    for (let i = 0; i < count; i++) {
        sum += coefficients[i] * trigFn(phases[i]);
    }
    return sum;
}

const getPlanetRotationElements = (name, date) => {
    const model = planetData[name]?.rotation;
    if (!model) {
        return null;
    }

    const JD = julianDate(date);
    const d = JD - planetData.common.J2000;
    const T = d / planetData.common.DAYS_PER_CENTURY;
    const phaseSource = model.nutationAngles ? planetData.rotationAngles[model.nutationAngles] : [];
    const phases = phaseSource.map((phase) => degreesToRadians(evaluatePolynomial(phase, T)));

    const poleRa = evaluatePolynomial(model.poleRa, T) + evaluateTrigSeries(model.raSin, phases, Math.sin);
    const poleDec = evaluatePolynomial(model.poleDec, T) + evaluateTrigSeries(model.decCos, phases, Math.cos);
    const primeMeridian = evaluatePolynomial(model.primeMeridian, d) + evaluateTrigSeries(model.pmSin, phases, Math.sin);

    return {
        poleRa: normalizeDegrees(poleRa),
        poleDec,
        primeMeridian: normalizeDegrees(primeMeridian)
    };
}

const equatorialToScene = (vector) => {
    const obliquity = degreesToRadians(planetData.common.J2000_OBLIQUITY);
    const cosObliquity = Math.cos(obliquity);
    const sinObliquity = Math.sin(obliquity);

    const eclipticX = vector.x;
    const eclipticY = cosObliquity * vector.y + sinObliquity * vector.z;
    const eclipticZ = -sinObliquity * vector.y + cosObliquity * vector.z;

    return new THREE.Vector3(eclipticY, eclipticZ, eclipticX).normalize();
}

const getPlanetOrientation = (name, date) => {
    const elements = getPlanetRotationElements(name, date);
    if (!elements) {
        return null;
    }

    const poleRa = degreesToRadians(elements.poleRa);
    const poleDec = degreesToRadians(elements.poleDec);
    const primeMeridian = degreesToRadians(elements.primeMeridian);

    const bodyToEquatorial = new THREE.Matrix4().makeRotationZ(Math.PI / 2 + poleRa);
    bodyToEquatorial.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 - poleDec));
    bodyToEquatorial.multiply(new THREE.Matrix4().makeRotationZ(primeMeridian));

    // THREE.SphereGeometry is Y-up; IAU body frames are Z-up.
    bodyToEquatorial.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

    const xAxis = equatorialToScene(new THREE.Vector3(1, 0, 0).applyMatrix4(bodyToEquatorial));
    const yAxis = equatorialToScene(new THREE.Vector3(0, 1, 0).applyMatrix4(bodyToEquatorial));
    const zAxis = equatorialToScene(new THREE.Vector3(0, 0, 1).applyMatrix4(bodyToEquatorial));
    const sceneBasis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

    return new THREE.Quaternion().setFromRotationMatrix(sceneBasis);
}

const setPlanetOrientation = (group, name, date) => {
    const orientation = getPlanetOrientation(name, date);
    if (orientation) {
        group.quaternion.copy(orientation);
    }
}

const configureRingShadowMaterial = (material, planetRadius) => {
    const uniforms = {
        uPlanetRadius: { value: planetRadius },
        uShadowSoftness: { value: planetRadius * 0.08 },
        uShadowStrength: { value: 0.7 },
        uShadowLightDirection: { value: new THREE.Vector3(1, 0, 0) }
    };

    material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);

        shader.vertexShader = shader.vertexShader
            .replace(
                '#include <common>',
                '#include <common>\nvarying vec3 vRingLocalPosition;'
            )
            .replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\nvRingLocalPosition = position;'
            );

        shader.fragmentShader = shader.fragmentShader
            .replace(
                '#include <common>',
                [
                    '#include <common>',
                    'uniform vec3 uShadowLightDirection;',
                    'uniform float uPlanetRadius;',
                    'uniform float uShadowSoftness;',
                    'uniform float uShadowStrength;',
                    'varying vec3 vRingLocalPosition;'
                ].join('\n')
            )
            .replace(
                '#include <opaque_fragment>',
                [
                    '#include <opaque_fragment>',
                    'vec3 shadowDirection = normalize(uShadowLightDirection);',
                    'float shadowAlong = dot(vRingLocalPosition, shadowDirection);',
                    'vec3 closestShadowAxisPoint = vRingLocalPosition - shadowDirection * shadowAlong;',
                    'float shadowDistance = length(closestShadowAxisPoint);',
                    'float shadowEdge = 1.0 - smoothstep(uPlanetRadius - uShadowSoftness, uPlanetRadius + uShadowSoftness, shadowDistance);',
                    'float planetShadow = step(0.0, shadowAlong) * shadowEdge * uShadowStrength;',
                    'gl_FragColor.rgb *= 1.0 - planetShadow;'
                ].join('\n')
            );
    };
    material.customProgramCacheKey = () => 'planet-ring-shadow-v1';

    return uniforms;
}

const ringShadowPlanetPosition = new THREE.Vector3();
const ringShadowSunPosition = new THREE.Vector3();
const ringShadowWorldDirection = new THREE.Vector3();
const ringShadowLocalDirection = new THREE.Vector3();
const ringShadowWorldQuaternion = new THREE.Quaternion();

const updateRingShadow = (ring, planetGroup, sunPosition = ringShadowSunPosition) => {
    const uniforms = ring.userData.ringShadowUniforms;
    if (!uniforms) {
        return;
    }

    planetGroup.getWorldPosition(ringShadowPlanetPosition);
    ringShadowWorldDirection.copy(ringShadowPlanetPosition).sub(sunPosition);
    if (ringShadowWorldDirection.lengthSq() === 0) {
        return;
    }

    ringShadowWorldDirection.normalize();
    ring.getWorldQuaternion(ringShadowWorldQuaternion).invert();
    ringShadowLocalDirection.copy(ringShadowWorldDirection).applyQuaternion(ringShadowWorldQuaternion).normalize();
    uniforms.uShadowLightDirection.value.copy(ringShadowLocalDirection);
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

    const group = new THREE.Group();
    group.add(mesh);

    setPlanetOrientation(group, name, new Date());

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

const createRing = (name, innerRadius, outerRadius, planetRadius) => {
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
    const ringShadowUniforms = configureRingShadowMaterial(ringMaterial, planetRadius);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.userData.ringShadowUniforms = ringShadowUniforms;

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

export { getPlanetPosition, getPlanetRotationElements, setPlanetOrientation, updateRingShadow, createOrbit, createSprite, createSun, createPlanet, createUniverse, createRing, createGroup };
