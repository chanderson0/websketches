import * as THREE from "three";
import { MeshLine, MeshLineMaterial } from "three.meshline";
import * as Color from "color";
import * as CCapture from "ccapture.js";

const OUTPUT_SIZE = 1080;
const REAL_WIDTH = 512;
const REAL_HEIGHT = 512;
const BG_COLOR = 0xffd54f;
const FG_COLOR = 0x3e3b74;

const kFGColor = new THREE.Color(FG_COLOR);

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

const loader = new THREE.ImageLoader();
const scene = new THREE.Scene();
const postScene = new THREE.Scene();
scene.background = new THREE.Color(BG_COLOR);
const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.001, 1000);
camera.position.set(0, 0, 3);
// camera.lookAt(new THREE.Vector3(0, 0, 0));
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas
});
renderer.setSize(OUTPUT_SIZE, OUTPUT_SIZE);

// SETUP
const NUM = 7;
const DETAIL = 100;
const lines: Array<{
  line: typeof MeshLine;
  geo: THREE.Geometry;
  mat: THREE.RawShaderMaterial;
}> = [];
for (let i = 0; i < NUM; ++i) {
  const geo = new THREE.Geometry();
  for (let j = 0; j < DETAIL; ++j) {
    var v = new THREE.Vector3();
    geo.vertices.push(v);
  }
  const line = new MeshLine();
  line.setGeometry(geo);
  const mat = new MeshLineMaterial({
    color: new THREE.Color(FG_COLOR)
  });
  lines.push({ line, geo, mat });

  const mesh = new THREE.Mesh(line.geometry, mat);
  scene.add(mesh);
}

const lines2: Array<{
  line: typeof MeshLine;
  geo: THREE.Geometry;
  mat: THREE.RawShaderMaterial;
}> = [];
for (let i = 0; i < NUM; ++i) {
  const geo = new THREE.Geometry();
  for (let j = 0; j < DETAIL; ++j) {
    var v = new THREE.Vector3();
    geo.vertices.push(v);
  }
  const line = new MeshLine();
  line.setGeometry(geo);
  const mat = new MeshLineMaterial({
    color: new THREE.Color(FG_COLOR)
  });
  lines2.push({ line, geo, mat });

  const mesh = new THREE.Mesh(line.geometry, mat);
  scene.add(mesh);
}

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

  // UPDATE

  const LEN = 0.4;
  const MAX_WIDTH = 0.2;
  for (let i = 0; i < NUM; ++i) {
    const { line, geo, mat } = lines[i];
    const { line: line2, geo: geo2, mat: mat2 } = lines2[i];

    const frac = i / NUM;
    const angle = frac * Math.PI * 2.0;

    for (let j = 0; j < DETAIL; ++j) {
      let ptFrac = j / DETAIL - 0.5;
      const sign = ptFrac > 0 ? 1 : -1;
      ptFrac = Math.abs(ptFrac) * 2.0;

      const pos = new THREE.Vector3(
        Math.cos(angle * sign) * ptFrac * sign * LEN,
        Math.sin(angle * sign) * ptFrac * sign * LEN,
        0.0
      );
      pos.applyAxisAngle(
        new THREE.Vector3(0, 0, 1),
        Math.cos(ptFrac * 5 + time * sign) * 0.3 * (1.0 - ptFrac)
      );
      geo.vertices[j].copy(pos);
      geo2.vertices[j].copy(pos.multiplyScalar(1.0));
      geo2.vertices[j].z = 1.0;
    }
    (mat.uniforms.color.value as THREE.Color).copy(
      kFGColor.clone().offsetHSL(0, 0, (Math.sin(time) + 1.0) * 0.07)
    );
    (mat2.uniforms.color.value as THREE.Color).set(BG_COLOR);
    line.setGeometry(geo, (p: number) => {
      p = Math.abs(p - 0.5) * 2.0;
      p = Math.pow(p, 0.8);
      p = MAX_WIDTH * (1.0 - p);

      return p;
    });
    line2.setGeometry(geo2, (p: number) => {
      p = Math.abs(p - 0.5) * 2.0;
      p = Math.pow(p, 0.8);
      p = MAX_WIDTH * 0.1 * (1.0 - p);

      return p;
    });
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
