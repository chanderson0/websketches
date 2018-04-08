import * as THREE from "three";
import * as Color from "color";
import * as CCapture from "ccapture.js";

// From https://gist.github.com/wteuber/6241786
const fmod = (a: number, b: number) =>
  Number((a - Math.floor(a / b) * b).toPrecision(8));

const normSin = (a: number) => Math.sin(a) * 0.5 + 0.5;
const lerp = (v0: number, v1: number, t: number) => v0 * (1 - t) + v1 * t;

const OUTPUT_SIZE = 1080;

const recorder = new CCapture({
  name: "Sketch",
  format: "png",
  framerate: 60,
  autoSaveTime: 1
});
const canvas = document.getElementById("app") as HTMLCanvasElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x182048);
const camera = new THREE.OrthographicCamera(-0.5, 0.5, -0.5, 0.5, 0.01, 10000);
camera.position.set(0, 0, -5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas
});
renderer.setSize(OUTPUT_SIZE, OUTPUT_SIZE);

const N_BOXES = 9;
const BOX_SIZE = 0.055;
const boxes: THREE.Mesh[] = [];
const outlines: THREE.Mesh[] = [];

for (let i = 0; i < N_BOXES; ++i) {
  for (let j = 0; j < N_BOXES; ++j) {
    const c = Color(0x182048).lighten(3.0);
    const geometry = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
    const material = new THREE.MeshBasicMaterial({
      color: Color(0x182048).lighten(0.17).rgbNumber()
      // color: c.rgbNumber()
      // wireframe: true
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(
      (i / (N_BOXES - 1) - 0.5) * 0.8,
      (j / (N_BOXES - 1) - 0.5) * 0.8,
      0, //(i + j)
    );
    scene.add(cube);
    boxes.push(cube);

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: c.rgbNumber()
      // side: THREE.BackSide
    });
    const outline = new THREE.Mesh(geometry, outlineMaterial);
    outline.position.copy(cube.position);
    outlines.push(outline);
    scene.add(outline);
  }
}

let recording = false;
const RECORDING_FPS = 60;
let time = 0;
let lastFrame = +new Date();
function loop() {
  requestAnimationFrame(loop);

  let delta = 0;
  if (recording) {
    delta = 1.0 / RECORDING_FPS;
  } else {
    delta = (+new Date() - lastFrame) / 1000;
  }
  time += delta;
  lastFrame = +new Date();

  const speed = 0.2;
  for (let i = 0; i < boxes.length; ++i) {
    const cube = boxes[i];
    const outline = outlines[i];
    const dist = new THREE.Vector2(cube.position.x, cube.position.y).length();

    cube.rotation.x = Math.sin(time * speed + dist * 0.3) * 2.0 * Math.PI;
    cube.rotation.z = Math.sin(time * speed + dist * 0.3) * 2.0 * Math.PI;
    // cube.scale.x = Math.cos(time + i) * 0.5 + 1.0;

    outline.rotation.copy(cube.rotation);
    outline.scale.copy(cube.scale);
    outline.scale.multiplyScalar(1.04);
    outline.position.copy(cube.position);
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
