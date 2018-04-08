import * as THREE from "three";
import * as Color from "color";
import * as CCapture from "ccapture.js";
import glsl = require("glslify");

const vertexShader = glsl.file("./shader.vert");
const fragmentShader = glsl.file("./shader.frag");

const OUTPUT_SIZE = 1080;

const recorder = new CCapture({
  name: "Sketch",
  format: "png",
  framerate: 60,
  autoSaveTime: 1
});
const canvas = document.getElementById("app") as HTMLCanvasElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.OrthographicCamera(-0.5, 0.5, -0.5, 0.5, 0.01, 10000);
camera.position.set(0, 0, -1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
const renderer = new THREE.WebGLRenderer({
  alpha: false,
  antialias: false,
  canvas
});
renderer.setSize(OUTPUT_SIZE, OUTPUT_SIZE);

const geom = new THREE.PlaneGeometry(1, 1, 1, 1);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(OUTPUT_SIZE, OUTPUT_SIZE) },
  }
});

const mesh = new THREE.Mesh(geom, material);
scene.add(mesh);

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

  material.uniforms.time.value = time;

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
