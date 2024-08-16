import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm//controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import * as dat from 'dat.gui'

import { getPlanetPosition, createOrbit, createSprite, createSun, createPlanet, createUniverse, createRing } from './utils';
import { planetData } from './dats';


// 初始化

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 1000000000);

const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // 启用阴影映射
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.maxDistance = 200000000; // 设置摄像机的最大距离
controls.update();

camera.position.set(139.2 * 100, 69.6 * 100, 139.2 * 100);

//


// 添加光源并启用阴影

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 8, 0, 0.1); // 设置半天......
pointLight.position.set(0, 0, 0);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
scene.add(pointLight);

//


// 添加天体

let planets = {};

const universe = createUniverse(planetData.universe.name, planetData.universe.radius);
const saturnRing = createRing(planetData.saturn.ringName, planetData.saturn.innerRing, planetData.saturn.outerRing);
const uranusRing = createRing(planetData.uranus.ringName, planetData.uranus.innerRing, planetData.uranus.outerRing);
const neptuneRing = createRing(planetData.neptune.ringName, planetData.neptune.innerRing, planetData.neptune.outerRing);
const sun = createSun(planetData.sun.name, planetData.sun.radius);
const sunHalo = createSprite('sun-glow');
//console.log(sunHalo);
sun.add(sunHalo);

const mercury = createPlanet(planetData.mercury.name, planetData.mercury.radius);
const venus = createPlanet(planetData.venus.name, planetData.venus.radius);
const earth = createPlanet(planetData.earth.name, planetData.earth.radius);
const mars = createPlanet(planetData.mars.name, planetData.mars.radius);
const jupiter = createPlanet(planetData.jupiter.name, planetData.jupiter.radius);
const saturn = createPlanet(planetData.saturn.name, planetData.saturn.radius);
const uranus = createPlanet(planetData.uranus.name, planetData.uranus.radius);
const neptune = createPlanet(planetData.neptune.name, planetData.neptune.radius);

planets.mercury = mercury;
planets.venus = venus;
planets.earth = earth;
planets.mars = mars;
planets.jupiter = jupiter;
planets.saturn = saturn;
planets.uranus = uranus;
planets.neptune = neptune;

saturn.add(saturnRing);
uranus.add(uranusRing);
neptune.add(neptuneRing);
const planetGroup = new THREE.Group();
planetGroup.add(mercury, venus, earth, mars, jupiter, saturn, uranus, neptune);
scene.add(universe, sun, planetGroup);

//


// 添加轨道

const orbitMercury = createOrbit(planetData.mercury.name);
const orbitVenus = createOrbit(planetData.venus.name);
const orbitEarth = createOrbit(planetData.earth.name);
const orbitMars = createOrbit(planetData.mars.name);
const orbitJupiter = createOrbit(planetData.jupiter.name);
const orbitSaturn = createOrbit(planetData.saturn.name);
const orbitUranus = createOrbit(planetData.uranus.name);
const orbitNeptune = createOrbit(planetData.neptune.name);

const orbitGroup = new THREE.Group();
orbitGroup.add(orbitMercury, orbitVenus, orbitEarth, orbitMars, orbitJupiter, orbitSaturn, orbitUranus, orbitNeptune);
scene.add(orbitGroup);
//


// 搜索天体

const list = [
    { name: 'sun', mesh: sun, offset: planetData.sun.radius },
    { name: 'mercury', mesh: mercury, offset: planetData.mercury.radius },
    { name: 'venus', mesh: venus, offset: planetData.venus.radius },
    { name: 'earth', mesh: earth, offset: planetData.earth.radius },
    { name: 'mars', mesh: mars, offset: planetData.mars.radius },
    { name: 'jupiter', mesh: jupiter, offset: planetData.jupiter.radius },
    { name: 'saturn', mesh: saturn, offset: planetData.saturn.radius },
    { name: 'uranus', mesh: uranus, offset: planetData.uranus.radius },
    { name: 'neptune', mesh: neptune, offset: planetData.neptune.radius },
];

const searchInput = document.getElementById('search-input');
searchInput.addEventListener('change', onSearch);

function onSearch(event) {
    const query = event.target.value.toLowerCase();
    const planet = list.find(p => p.name.toLowerCase() === query);

    if (planet) {
        const targetPosition = new THREE.Vector3();
        planet.mesh.getWorldPosition(targetPosition);
        const offset = new THREE.Vector3(planet.offset * 2, planet.offset, planet.offset * 2);

        //camera.lookAt(planet.mesh.position);
        camera.position.copy(targetPosition).add(offset);
        controls.target.copy(targetPosition); // 更新控制器的目标位置
        //controls.target = planet.mesh.position;
        controls.update();
    }
}

//


// 添加星球图标，轨道高亮和点击跳跃事件

function addIcon(group, orbit, size) {
    let mesh = group.children[0];
    const iconDiv = document.createElement('div');
    iconDiv.className = 'label';
    iconDiv.textContent = mesh.name.toUpperCase();

    iconDiv.style.pointerEvents = "stroke"; // 太坑人了这个

    iconDiv.addEventListener('click', () => {
        const targetPosition = new THREE.Vector3();
        mesh.getWorldPosition(targetPosition);
        const offset = new THREE.Vector3(size * 2, size, size * 2);
        camera.position.copy(targetPosition).add(offset);
        controls.target.copy(targetPosition); // 更新控制器的目标位置
        controls.update();
    });

    if (mesh.name != 'sun') {
        iconDiv.style.borderColor = orbit.material.color.getStyle();
        iconDiv.addEventListener('mouseover', () => {
            orbit.material.color.addScalar(-0.4);
            iconDiv.style.backgroundColor = orbit.material.color.getStyle();
        });

        iconDiv.addEventListener('mouseout', () => {
            orbit.material.color.addScalar(0.4);
            iconDiv.style.backgroundColor = 'rgba(0,0,0,0)';
        });
    }
    else {
        iconDiv.addEventListener('mouseover', () => {
            iconDiv.style.backgroundColor = 'rgba(255,255,255,0.5)';
        });

        iconDiv.addEventListener('mouseout', () => {
            iconDiv.style.backgroundColor = 'rgba(0,0,0,0)';
        });
    };


    const iconLabel = new CSS2DObject(iconDiv);
    iconLabel.position.set(0, size * 1.2, 0);
    iconLabel.layers.set(1);
    camera.layers.toggle(1);

    //console.log(mesh);

    mesh.add(iconLabel);
};

addIcon(sun, orbitMercury, planetData.sun.radius); // 太阳没轨道来着，反正随便传一个参数
addIcon(mercury, orbitMercury, planetData.mercury.radius);
addIcon(venus, orbitVenus, planetData.venus.radius);
addIcon(earth, orbitEarth, planetData.earth.radius);
addIcon(mars, orbitMars, planetData.mars.radius);
addIcon(jupiter, orbitJupiter, planetData.jupiter.radius);
addIcon(saturn, orbitSaturn, planetData.saturn.radius);
addIcon(uranus, orbitUranus, planetData.uranus.radius);
addIcon(neptune, orbitNeptune, planetData.neptune.radius);

//


// 添加DAT控件

const options = {
    LabelVisible: true,
    BoostRevolution: false,
    BoostRotation: false,
    SpeedRevolution: 1.0,
    SpeedRotation: 1.0
};

const gui = new dat.GUI();
gui.domElement.style = 'position:absolute;top:10px;right:-5px;';
gui.add(options, 'LabelVisible').onFinishChange(() => {
    camera.layers.toggle(1);
});
gui.add(options, 'BoostRevolution').onFinishChange((bool) => {
    options.SpeedRevolution = bool ? 864000 : 1;
});
gui.add(options, 'BoostRotation').onFinishChange((bool) => {
    options.SpeedRotation = bool ? 1000 : 1;
});

//


// 更新渲染

function updateVisibility(list) {
    for (let i = 1; i < 9; i++) {
        const distance = camera.position.distanceTo(list[i].mesh.position);
        if (distance < planetData[list[i].name].a[0] * 200000) {
            list[i].mesh.visible = true;
        }
        else if (distance >= planetData[list[i].name].a[0] * 200000) {
            list[i].mesh.visible = false;
        };

    };

};

function updateSpriteSize(sprite) {
    const distance = camera.position.distanceTo(sprite.position);
    //console.log(sun);
    if (distance > 1000) {
        sprite.visible = true;
    }
    else if (distance <= 1000) {
        sprite.visible = false;
    };
    if (distance > 10000000) {
        sun.children[0].children[0].visible = false;
    }
    else if (distance < 10000000) {
        sun.children[0].children[0].visible = true;
    };
    const fov = camera.fov * (Math.PI / 180); // 将角度转换为弧度
    const height = 2 * Math.tan(fov / 2) * distance; // 视锥体的高度
    const width = height * camera.aspect; // 视锥体的宽度

    const widthInWorldUnits = (100 / window.innerWidth) * width;
    const heightInWorldUnits = (100 / window.innerHeight) * height;

    sprite.scale.set(widthInWorldUnits, heightInWorldUnits, 1);
}

let simulatedDate = new Date();
let rotationSpeeds = {};

const updatePlanets = (delta, speed) => {
    for (const name in planets) {
        const position = getPlanetPosition(name, simulatedDate);
        planets[name].position.copy(position);

        // 自转速度
        rotationSpeeds[name] = (2 * Math.PI) / (planetData[name].day * 3600) * speed;
        planets[name].children[0].rotation.y += rotationSpeeds[name] * delta;
    };
}


const clock = new THREE.Clock();
const animate = () => {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    simulatedDate = new Date(simulatedDate.getTime() + options.SpeedRevolution);
    updatePlanets(delta, options.SpeedRotation);
    updateSpriteSize(sunHalo);
    updateVisibility(list);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();

//


// 浏览器窗口自适应

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    updateSpriteSize(sunHalo);
});

//