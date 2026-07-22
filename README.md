# 3D Solar System Model

An interactive 3D solar system model built with Vite, Three.js, and dat.GUI. The app renders the Sun, the eight major planets, orbital paths, planet labels, ring systems, star background, and camera controls for exploring the scene in the browser.

## Features

- Real-time 3D scene powered by Three.js and WebGL.
- Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.
- Planet textures, Earth normal/specular maps, and a star-field universe sphere.
- Saturn, Uranus, and Neptune ring meshes with dynamic ring-shadow shading.
- Approximate planetary orbital positions based on NASA JPL orbital elements.
- Planet orientation/rotation model using per-body rotation parameters.
- Colored orbit paths for each planet.
- CSS2D labels that can be clicked to move the camera to a planet.
- Search box for jumping directly to a planet by name.
- OrbitControls for mouse/touch navigation.
- dat.GUI toggles for labels and accelerated revolution/rotation.

## Tech Stack

- [Vite](https://vitejs.dev/) - frontend build tool and dev server
- [Three.js](https://threejs.org/) - 3D rendering
- [dat.GUI](https://github.com/dataarts/dat.gui) - runtime control panel

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

### Build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Controls

- Drag: orbit around the scene.
- Scroll/pinch: zoom in and out.
- Search input: enter an exact planet name such as `earth`, `mars`, or `saturn`.
- Planet labels: click a label to focus the camera on that body.
- GUI panel:
  - `LabelVisible`: show or hide labels.
  - `BoostRevolution`: speed up orbital motion.
  - `BoostRotation`: speed up planet rotation.

## Project Structure

```text
.
|-- index.html              # App shell and search input
|-- public/assets/          # Planet, ring, sun, and star textures
|-- src/
|   |-- main.js             # Scene setup, camera, controls, GUI, animation loop
|   |-- dats.js             # Planet constants, orbital elements, rotation data
|   `-- utils.js            # Position/orbit/mesh/ring helper functions
|-- package.json
`-- README.md
```

## Notes

This project is designed as an educational and visual 3D model. Planet sizes, distances, and motion are scaled for interactive browsing, so the scene is not a strict scientific simulator. Orbital position logic references NASA JPL's approximate planetary position formulas.
