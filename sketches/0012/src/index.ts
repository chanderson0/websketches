import * as THREE from "three";
import * as Color from "color";
import * as CCapture from "ccapture.js";
import glsl = require("glslify");
import * as SimplexNoise from "simplex-noise";

const vertexShader = glsl.file("./instance.vert");
const fragmentShader = glsl.file("./instance.frag");

const noise = new SimplexNoise();
const OUTPUT_SIZE = 1080;

const recorder = new CCapture({
  name: "Sketch",
  format: "png",
  framerate: 60,
  autoSaveTime: 1
});
const canvas = document.getElementById("app") as HTMLCanvasElement;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFF7043);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
camera.position.set(0, 0, -3);
camera.lookAt(new THREE.Vector3(0, 0, 0));
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas
});
renderer.setSize(OUTPUT_SIZE, OUTPUT_SIZE);

const balls: THREE.Mesh[] = [];
const outlines: THREE.Mesh[] = [];

const ballGeom = new THREE.SphereBufferGeometry(0.01, 8, 8);
const instanceGeom = new THREE.InstancedBufferGeometry();
instanceGeom.index = ballGeom.index;
instanceGeom.addAttribute("position", ballGeom.getAttribute("position"));
instanceGeom.addAttribute("uv", ballGeom.getAttribute("uv"));

const offsets = [];
const centers: THREE.Vector3[] = [];
const colors = [];
const orientations = [];
const pairs: number[] = [];

const TOTAL = 800;
const R = 1.0;
for (let i = 0; i < TOTAL; ++i) {
  const s = Math.random() * Math.PI * 2.0;
  const t = Math.random() * Math.PI * 2.0;

  const center = new THREE.Vector3(
    R * Math.cos(s) * Math.sin(t),
    R * Math.sin(s) * Math.sin(t),
    R * Math.cos(t)
  );
  centers.push(center);

  const pos = center
    .clone()
    .add(
      new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).multiplyScalar(2.0 * R * 0.03)
    );
  offsets.push(pos.x, pos.y, pos.z);

  const color = Color(0x182048);
  colors.push(color.red(), color.green(), color.blue(), color.alpha());
}

const offsetAttribute = new THREE.InstancedBufferAttribute(
  new Float32Array(offsets),
  3
);
const colorAttribute = new THREE.InstancedBufferAttribute(
  new Float32Array(colors),
  4
);

instanceGeom.addAttribute("offset", offsetAttribute);
instanceGeom.addAttribute("color", colorAttribute);

const material = new THREE.RawShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true
});

const mesh = new THREE.Mesh(instanceGeom, material);
scene.add(mesh);

const lineData: number[] = [];
for (let i = 0; i < TOTAL; ++i) {
  let minDist = 10000;
  let j = -1;
  for (let candidateIdx = 0; candidateIdx < TOTAL; ++candidateIdx) {
    if (i === candidateIdx) continue;

    const dist = centers[i].distanceToSquared(centers[candidateIdx]);
    if (dist < minDist) {
      minDist = dist;
      j = candidateIdx;
    }
  }
  pairs[i] = j;

  lineData.push(offsets[i * 3], offsets[i * 3 + 1], offsets[i * 3 + 2]);
  lineData.push(offsets[j * 3], offsets[j * 3 + 1], offsets[j * 3 + 2]);
}

const linesGeom = new THREE.BufferGeometry();
const lineVertAttr = new THREE.BufferAttribute(new Float32Array(lineData), 3);
linesGeom.addAttribute("position", lineVertAttr);
const linesMat = new THREE.LineBasicMaterial({
  color: 0xffffff,
  opacity: 0.6,
  linewidth: 3.0,
  transparent: true
});
const lines = new THREE.LineSegments(linesGeom, linesMat);
scene.add(lines);

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
  const pos = new THREE.Vector3();
  for (let i = 0; i < TOTAL; ++i) {
    const center = centers[i];

    const pos = center
      .clone()
      .add(
        new THREE.Vector3(
          noise.noise4D(
            center.x * 10,
            center.y * 10,
            center.z * 10,
            lastFrame / 1000
          ),
          noise.noise4D(
            center.x * 10,
            center.y * 10,
            center.z * 10 + 7,
            lastFrame / 1000
          ),
          noise.noise4D(
            center.x * 10,
            center.y * 10,
            center.z * 10 + 13,
            lastFrame / 1000
          )
        ).multiplyScalar(0.02)
      );

    offsetAttribute.setXYZ(i, pos.x, pos.y, pos.z);
  }
  offsetAttribute.needsUpdate = true;

  for (let i = 0; i < TOTAL; ++i) {
    const j = pairs[i];
    {
      pos.fromArray(offsetAttribute.array as number[], i * 3);
      lineVertAttr.setXYZ(i * 2, pos.x, pos.y, pos.z);
    }
    {
      pos.fromArray(offsetAttribute.array as number[], j * 3);
      lineVertAttr.setXYZ(i * 2 + 1, pos.x, pos.y, pos.z);
    }
  }
  lineVertAttr.needsUpdate = true;

  mesh.rotation.x += 0.09 * delta;
  mesh.rotation.z += 0.05 * delta;
  lines.rotation.x = mesh.rotation.x;
  lines.rotation.z = mesh.rotation.z;

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
