// import * as Two from "two.js";
// import * as SimplexNoise from "simplex-noise";

import * as THREE from "three";
import { BufferGeometry } from "three";

//@ts-ignore
const { SVGRenderer } = require("./vendor/SVGRenderer");

// declare var require: any;
// require('three/examples/js/shaders/CopyShader.js');

const app = document.getElementById("app") as HTMLElement;

const OUTPUT_WIDTH = 724;
const OUTPUT_HEIGHT = 512;
const ASPECT = OUTPUT_WIDTH / OUTPUT_HEIGHT;

const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x000000);
const camera = new THREE.OrthographicCamera(
  -0.5,
  0.5,
  -0.5 / ASPECT,
  0.5 / ASPECT,
  0.01,
  10000
);
camera.position.set(0, 0, -1);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new SVGRenderer();
renderer.setClearColor(new THREE.Color(), 0);
renderer.setSize(OUTPUT_WIDTH, OUTPUT_HEIGHT);

app.appendChild(renderer.domElement);

let i = 0;
for (let x = -0.4; x <= 0.4; x += 0.05) {
  for (let y = -0.3; y <= 0.3; y += 0.05) {
    const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    const edges = new THREE.EdgesGeometry(geometry as any, 75);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x0 })
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0x0,
      wireframe: true
    });
    const cube = new THREE.Mesh(geometry, material);
    // const x = Math.random() * 0.8 - 0.4;
    // const y = Math.random() * 0.6 - 0.3;

    line.rotateX(x * Math.PI * 1.0);
    line.rotateY(y * Math.PI * 1.0);
    line.rotateZ(i / 1000 * Math.PI);
    line.position.set(x, y, i * 10);

    scene.add(line);

    ++i;
  }
}

renderer.render(scene, camera);

// const noise = new SimplexNoise();
// function gradientDir(pos: typeof Two.Vector) {
//   const EPS = 0.01;
//   const SCALE = 0.003;
//   const SPEED = 50;

//   const l = noise.noise2D(SCALE * pos.x - EPS, SCALE * pos.y);
//   const r = noise.noise2D(SCALE * pos.x + EPS, SCALE * pos.y);
//   const u = noise.noise2D(SCALE * pos.x, SCALE * pos.y + EPS);
//   const d = noise.noise2D(SCALE * pos.x, SCALE * pos.y - EPS);

//   return new Two.Vector(-(r - l) * SPEED, (u - d) * SPEED);
// }

// const allPoints: typeof two.Anchor[][] = [];
// for (let i = 0; i < 5000; ++i) {
//   const x = Math.random() * two.width;
//   const y = Math.random() * two.height;

//   let pos = new Two.Vector(x, y);

//   const points = [new Two.Anchor(pos.x, pos.y)];
//   for (let j = 0; j < 7; ++j) {
//     pos.addSelf(gradientDir(pos));
//     // pos.addSelf(new Two.Vector(Math.random(), Math.random()).multiplyScalar(2.0));
//     points.push(new Two.Anchor(pos.x, pos.y));
//   }
//   allPoints.push(points);
// }

// allPoints.sort((a: typeof two.Anchor[], b: typeof two.Anchor[]) => {
//   const aColumn = Math.floor(a[0].x / 10.0) * 10.0;
//   const bColumn = Math.floor(b[0].x / 10.0) * 10.0;
//   const yDiff = a[0].y - b[0].y;

//   if (aColumn < bColumn) {
//     return 1;
//   } else if (aColumn > bColumn) {
//     return -1;
//   } else {
//     return yDiff;
//   }
// });

// const paths: typeof Two.Path[] = [];
// for (const points of allPoints) {
//   const path = two.makeCurve(points, true);
//   path.stroke = "#222";
//   path.linewidth = 1;
//   path.noFill();

//   paths.push(path);
// }
// two.update();
