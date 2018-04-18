import * as THREE from "three";
import * as CCapture from "ccapture.js";

// @ts-ignore
import glsl = require("glslify");

const OUTPUT_SIZE = 1080;
const BG_COLOR = 0x4f6d7a;

const vertexShader = glsl.file("./shaders/tri.vert.glsl");
const fragmentShader = glsl.file("./shaders/tri.frag.glsl");

const recorder = new CCapture({
  name: "Sketch",
  format: "png",
  framerate: 60,
  autoSaveTime: 1
});
const canvas = document.getElementById("app") as HTMLCanvasElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG_COLOR);
const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 1000);
camera.position.set(0, 0, -5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas
});
renderer.setSize(OUTPUT_SIZE, OUTPUT_SIZE);

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

  update(time, delta);
  renderer.render(scene, camera);

  if (recording) {
    recorder.capture(canvas);
  }
}

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

// CODE HERE

const ballGeom = new THREE.SphereBufferGeometry(0.25, 512, 512);

const ballMat = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide,
  vertexColors: THREE.VertexColors,
  uniforms: {
    time: { value: 0 }
  }
});
const mesh = new THREE.Mesh(ballGeom, ballMat);
mesh.rotation.y = 10;
scene.add(mesh);

// let frame = 0;
// let trailingDelta = 0.01;
function update(time: number, delta: number) {
  // frame++;
  // trailingDelta = trailingDelta * 0.9 + delta * 0.1;
  // if (frame % 10 == 0) {
  //   console.log(1 / trailingDelta);
  // }

  ballMat.uniforms.time.value = time;
}

// GO!
loop();
