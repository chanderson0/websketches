import * as THREE from "three";
import * as Color from "color";
import * as CCapture from "ccapture.js";
import * as SimplexNoise from "simplex-noise";

const noise = new SimplexNoise('0');
const OUTPUT_SIZE = 1080;
const BG_COLOR = 0x2196f3;
const FG_COLOR = 0xffffff;

const recorder = new CCapture({
  name: "Sketch",
  format: "png",
  framerate: 60,
  autoSaveTime: 1
});
const canvas = document.getElementById("app") as HTMLCanvasElement;

// const body = document.getElementsByTagName("body")[0];
// const c = Color(BG_COLOR);
// body.setAttribute("style", `background-color:${c.toString()}`)

const scene = new THREE.Scene();
scene.background = new THREE.Color(BG_COLOR);
const camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.001, 1000);
camera.position.set(0, 0, 3);
camera.lookAt(new THREE.Vector3(0, 0, 0));
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  canvas
});
renderer.setSize(OUTPUT_SIZE, OUTPUT_SIZE);

const positions = [];
const colors = [];

const lineData: Array<{
  circleVec: THREE.Vector3;
  startPt: THREE.Vector3;
}> = [];

const CENTER = new THREE.Vector3(0.5, 0.5, 0);
const STEP = 1.0 / 200;
for (let x = 0; x <= 1.0; x += STEP) {
  for (let y = 0; y <= 1.0; y += STEP) {
    const startPt = new THREE.Vector3(x, y, 0);
    if (startPt.distanceTo(CENTER) > 0.449) continue;
    startPt.add(
      new THREE.Vector3(Math.random(), Math.random()).multiplyScalar(0.01)
    );

    const distVec = startPt.clone().sub(CENTER);
    const circleVec = distVec.clone().normalize();

    lineData.push({
      startPt,
      circleVec
    });

    positions.push(startPt.x, startPt.y, 0);
    positions.push(startPt.x + 0.01, startPt.y + 0.01, 0);

    const fgColor = Color(FG_COLOR);
    const bgColor = Color(BG_COLOR);
    colors.push(
      fgColor.red() / 255,
      fgColor.green() / 255,
      fgColor.blue() / 255,
      fgColor.alpha() / 255,
    );
    colors.push(
      bgColor.red() / 255,
      bgColor.green() / 255,
      bgColor.blue() / 255,
      bgColor.alpha() / 255,
    );
  }
}

const positionAttribute = new THREE.BufferAttribute(
  new Float32Array(positions),
  3
);
const colorAttribute = new THREE.BufferAttribute(new Float32Array(colors), 4);

const geometry = new THREE.BufferGeometry();
geometry.addAttribute("position", positionAttribute);
geometry.addAttribute("color", colorAttribute);

const material = new THREE.LineBasicMaterial({
  vertexColors: THREE.VertexColors
});
const mesh = new THREE.LineSegments(geometry, material);
scene.add(mesh);

let recording = false;
const RECORDING_FPS = 60;
let time = 0;
let lastFrame = +new Date();

let frame = 0;
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

  const CIRCLE_RAD = 0.25;
  const SPEED = 0.2;
  const circlePos = new THREE.Vector3(
    noise.noise2D(time * SPEED, 10),
    noise.noise2D(time * SPEED, 17),
    0
  )
    .multiplyScalar(0.05)
    .add(CENTER);

  for (let lineIdx = 0; lineIdx < lineData.length; ++lineIdx) {
    const { startPt, circleVec } = lineData[lineIdx];

    const pos = circlePos
      .clone()
      .add(circleVec.clone().multiplyScalar(CIRCLE_RAD));

    pos.add(
      circleVec
        .clone()
        .multiplyScalar(noise.noise3D(pos.x * 2, pos.y * 2, time * 0.3) * 0.05)
    );

    let dir = new THREE.Vector3(1, 1, 0);
    let mag = noise.noise3D(pos.x, pos.y, time * 0.4) * 0.07;
    let bias = 0.15;
    dir = dir.clone().multiplyScalar(bias).add(dir.clone().multiplyScalar(mag));
    let tail = pos.clone().add(dir);

    positionAttribute.setXYZ(
      lineIdx * 2 + 1,
      tail.x, tail.y,
      0
    );
    positionAttribute.setXYZ(lineIdx * 2, pos.x, pos.y, 1);
  }
  positionAttribute.needsUpdate = true;

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
