import * as THREE from "three";
import * as Color from "color";
import * as CCapture from "ccapture.js";
import glsl = require("glslify");

const vertexShader = glsl.file("./instance.vert");
const fragmentShader = glsl.file("./instance.frag");

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

const balls: THREE.Mesh[] = [];
const outlines: THREE.Mesh[] = [];

const ballGeom = new THREE.SphereBufferGeometry(0.05, 16, 16);
const instanceGeom = new THREE.InstancedBufferGeometry();
instanceGeom.index = ballGeom.index;
instanceGeom.addAttribute("position", ballGeom.getAttribute("position"));
instanceGeom.addAttribute("uv", ballGeom.getAttribute("uv"));

const offsets = [];
const colors = [];
const orientations = [];
const velocities: THREE.Vector3[] = [];

const TOTAL = 500;
for (let i = 0; i < TOTAL; ++i) {
  // const c = Color(0x182048).lighten(3.0);
  // const geometry = new THREE.SphereGeometry(0.1, 64, 64);
  // const material = new THREE.MeshBasicMaterial({
  //   color: Color(0x182048)
  //     .lighten(0.8)
  //     .rgbNumber(),
  //   transparent: true,
  //   opacity: 0.9
  //   // color: c.rgbNumber()
  //   // wireframe: true
  // });
  // const ball = new THREE.Mesh(geometry, material);

  const f = i / TOTAL * 2.0 * Math.PI;
  offsets.push(Math.sin(f) * 0.2, Math.cos(f) * 0.2, i);

  const color = Color(0x182048).lighten(0.8);
  color.fade(0.5);
  // color.darken((i % 10) / 1);
  colors.push(color.red(), color.green(), color.blue(), color.alpha());

  const velocity = new THREE.Vector3(
    Math.sin(f + Math.PI / 2.0) * 4.0,
    Math.cos(f + Math.PI / 2.0) * 1.0,
    0
  );
  velocities.push(velocity);

  // ball.position.set(Math.sin(f) * 0.2, Math.cos(f) * 0.2, i);
  // ball.userData = {
  //   velocity: new THREE.Vector3(
  //     Math.sin(f + Math.PI / 2.0) * 10.0,
  //     Math.cos(f + Math.PI / 2.0) * 1.0,
  //     0
  //   )
  // };

  // scene.add(ball);
  // balls.push(ball);

  // const outlineMaterial = new THREE.MeshBasicMaterial({
  //   color: c.rgbNumber()
  //   // side: THREE.BackSide
  // });
  // const outline = new THREE.Mesh(geometry, outlineMaterial);
  // outlines.push(outline);
  // // scene.add(outline);
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
  transparent: true,
});

const mesh = new THREE.Mesh(instanceGeom, material);
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

  const speed = 0.2;
  const pos = new THREE.Vector3();
  for (let i = 0; i < TOTAL; ++i) {
    const velocity = velocities[i];
    
    pos.fromArray(offsetAttribute.array as number[], i*3);

    const pos2d = pos.clone();
    const oldX = pos2d.z;
    pos2d.z = 0;

    {
      // const dist = pos2d.length();
      const dist = pos2d.distanceTo(new THREE.Vector3(0, 0, 0));
      const x = Math.sqrt(dist);
      velocity.add(pos2d.multiplyScalar(-1 * x * 0.2));
    }
    // {
    //   const dist = pos2d.distanceTo(new THREE.Vector3(0.25, 0, 0));
    //   const x = Math.sqrt(dist);
    //   velocity.add(pos2d.multiplyScalar(-1 * x * 0.2));
    // }

    pos.add(velocity.clone().multiplyScalar(delta * 0.05));
    // ball.position.z = 0.0;//(i + Math.floor(time * 10)) % TOTAL;

    offsetAttribute.setXYZ(i, pos.x, pos.y, pos.z);

    // outline.rotation.copy(ball.rotation);
    // outline.scale.copy(ball.scale);
    // outline.scale.multiplyScalar(1.04);
    // outline.position.copy(ball.position);
  }
  offsetAttribute.needsUpdate = true;

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
