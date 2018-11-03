import * as THREE from "three";
import { MeshLine, MeshLineMaterial } from "three.meshline";
import * as Color from "color";
import * as CCapture from "ccapture.js";
import * as OrbitControls from "orbit-controls-es6";

const OUTPUT_SIZE = 1080;
const REAL_WIDTH = 512;
const REAL_HEIGHT = 512;
const BG_COLOR = 0x6c57de;
const FG_COLOR = 0xffffff;

const kFGColor = new THREE.Color(FG_COLOR);
const kUp = new THREE.Vector3(0, 0, 1);

const recorder = new CCapture({
  name: "Sketch",
  format: "png",
  framerate: 60,
  autoSaveTime: 1
});
const canvas = document.getElementById("app") as HTMLCanvasElement;

// const body = document.getElementsByTagName("body")[0];
// const c = Color(BG_COLOR);
// body.setAttribute("style", `background-color:${c.hex()}`);

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG_COLOR);
const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 1000);
camera.position.set(0, 0, 3);
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas
});
renderer.setSize(OUTPUT_SIZE, OUTPUT_SIZE);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = true;

// SETUP

const DETAIL = 20;
const LAYERS = 1;
const CIRCLES = [
  {
    r: 0.07,
    n: 3
  },
  {
    r: 0.07 + 0.11 * 1,
    n: 5
  },
  {
    r: 0.07 + 0.11 * 2,
    n: 7
  },
  {
    r: 0.07 + 0.11 * 3 + 0.01,
    n: 9
  }
];
const NUM = CIRCLES.reduce((m, c) => m + c.n, 0);
const lines: Array<
  Array<{
    line: typeof MeshLine;
    geo: THREE.Geometry;
    mat: THREE.RawShaderMaterial;
    circleIdx: number;
    circleFrac: number;
  }>
> = [];
for (let i = 0; i < NUM; ++i) {
  const frac = i / (NUM - 1);

  const lineBundle = [];
  for (let k = 0; k < LAYERS; ++k) {
    const layerFrac = k / (LAYERS - 1);
    const geo = new THREE.Geometry();
    for (let j = 0; j < DETAIL; ++j) {
      var v = new THREE.Vector3();
      geo.vertices.push(v);
    }
    const line = new MeshLine();
    line.setGeometry(geo);

    const mat = new MeshLineMaterial({
      color: new THREE.Color(FG_COLOR),
      useMap: false,
      opacity: 1.0 - k / LAYERS,
      resolution: new THREE.Vector2(OUTPUT_SIZE, OUTPUT_SIZE),
      sizeAttenuation: false,
      near: camera.near,
      far: camera.far,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      lineWidth: 1,
      transparent: true
    });

    const start = new THREE.Vector3((i % 5) / 4, Math.floor(i / 5), 0);
    const target = start.clone().add(new THREE.Vector3(0.01, 0, 0));
    const delta = target.clone().sub(start);
    const len = 1.6;

    const ortho = delta
      .clone()
      .normalize()
      .applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2.0);
    // if (i == 0) {
    //   console.log(offsetTime, repeatingTime, center.x);
    // }
    for (let j = 0; j < DETAIL; ++j) {
      const ptFrac = j / (DETAIL - 1);
      const ptFracCenter = ptFrac * 2.0 - 1.0;
      const pos = new THREE.Vector3().add(
        delta
          .clone()
          .normalize()
          .multiplyScalar(ptFracCenter * 0.1 * len)
      );
      geo.vertices[j].copy(pos);
    }
    line.setGeometry(geo, (p: number) => {
      return 200;
    });

    let circleI = i;
    let circleIdx = -1;
    let circleFrac = -1;
    for (let c = 0; c < CIRCLES.length; ++c) {
      if (circleI < CIRCLES[c].n) {
        circleIdx = c;
        circleFrac = circleI / CIRCLES[c].n;
        break;
      }
      circleI -= CIRCLES[c].n;
    }

    const mesh = new THREE.Mesh(line.geometry, mat);
    lineBundle.push({
      line,
      geo,
      mat,
      circleIdx,
      circleFrac
    });

    scene.add(mesh);
  }
  lines.push(lineBundle);
}
renderer.render(scene, camera);

let recording = false;
const RECORDING_FPS = 60;
let time = 0;
let lastFrame = +new Date();

let frame = 0;
let trailingDelta = 0.01;
function loop() {
  frame++;
  requestAnimationFrame(loop);

  let delta = 0;
  if (recording) {
    delta = 1.0 / RECORDING_FPS;
  } else {
    delta = (+new Date() - lastFrame) / 1000;
  }
  time += delta;
  lastFrame = +new Date();

  trailingDelta = trailingDelta * 0.9 + delta * 0.1;
  // if (frame % 60 == 0) {
  //   console.log(`FPS: ${1 / trailingDelta}`);
  // }

  const cycleLength = 20.0;
  const cycleFrac = time / cycleLength;

  // UPDATE
  for (let i = 0; i < NUM; ++i) {
    for (let j = 0; j < LAYERS; ++j) {
      const { line, geo, circleIdx, circleFrac } = lines[i][j];

      const cFrac = circleIdx / (CIRCLES.length - 1);
      const cRFrac = 1 + cFrac / 2;

      const center = new THREE.Vector3(
        CIRCLES[circleIdx].r,
        0,
        0
      ).applyAxisAngle(
        kUp,
        (circleFrac - j * 0.01 + cycleFrac * cRFrac) * Math.PI * -2.0
      );
      const dir = center.clone().applyAxisAngle(kUp, Math.PI / 2.0);

      const ortho = dir.clone().applyAxisAngle(kUp, Math.PI / 2.0);
      const len = 0.075 + cFrac * 0.025;
      const waveAmplitude = 0.0008;
      const waveFreq = 3 + cFrac * 2;
      const waveSpeed = 50 + cFrac * 25;
      const thickness = 150 + cFrac * 50;

      for (let j = 0; j < DETAIL; ++j) {
        const ptFrac = j / (DETAIL - 1);
        const ptFracCenter = ptFrac * 2.0 - 1.0;
        const pos = center
          .clone()
          .add(
            dir
              .clone()
              .normalize()
              .multiplyScalar(ptFracCenter * len * -1)
          )
          .add(
            ortho
              .clone()
              .normalize()
              .multiplyScalar(
                Math.sin(cycleFrac * waveSpeed + ptFracCenter * waveFreq) *
                  waveAmplitude *
                  (1.0 / len)
              )
          );
        geo.vertices[j].copy(pos);
      }

      line.setGeometry(geo, (p: number) => {
        p = Math.abs(p - 0.5) * 2.0;
        p = Math.cos(p * Math.PI) / 2.0 + 0.5;
        p = Math.pow(p, 0.5);

        // Move to pixel values
        return p * thickness;
      });
    }
  }

  renderer.render(scene, camera);

  if (recording) {
    recorder.capture(canvas);
  }
}
loop();

const startRecording = () => {
  recording = true;
  recorder.start();
};

const stopRecording = () => {
  recording = false;
  recorder.stop();
  recorder.save();
};

window.addEventListener("keypress", e => {
  if (e.key == "r") {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
});
