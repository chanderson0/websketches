import * as THREE from "three";
import * as Color from "color";
import * as CCapture from "ccapture.js";
// @ts-ignore
import glsl = require("glslify");

const OUTPUT_SIZE = 1080;
const REAL_WIDTH = 512;
const REAL_HEIGHT = 512;
const BG_COLOR = 0x02273a;
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
const mousePos = new THREE.Vector2();

const sceneOutput = new THREE.WebGLRenderTarget(OUTPUT_SIZE, OUTPUT_SIZE, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter
});
const buffer1 = new THREE.WebGLRenderTarget(OUTPUT_SIZE, OUTPUT_SIZE, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter
});
const buffer2 = new THREE.WebGLRenderTarget(OUTPUT_SIZE, OUTPUT_SIZE, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter
});
let drawBuffer = buffer1;

const pass1Mat = new THREE.ShaderMaterial({
  vertexShader: glsl.file("./shaders/pass1.vert"),
  fragmentShader: glsl.file("./shaders/pass1.frag"),
  uniforms: {
    prevFrame: { value: buffer1.texture },
    scene: { value: sceneOutput.texture },
    time: { value: 0 }
  },
  side: THREE.DoubleSide
});
const colorizerMat = new THREE.ShaderMaterial({
  vertexShader: glsl.file("./shaders/colorizer.vert"),
  fragmentShader: glsl.file("./shaders/colorizer.frag"),
  uniforms: {
    tex: { value: buffer2.texture },
    colorScale: { value: new THREE.TextureLoader().load("images/sky-07.png") }
  },
  side: THREE.DoubleSide
});

const NUM = 256;
const SCALE = 0.03;
const balls: Array<THREE.Mesh> = [];
for (let i = 0; i < NUM; ++i) {
  const ball = new THREE.Mesh(
    new THREE.SphereBufferGeometry(SCALE, 8, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff
    })
  );
  balls.push(ball);
  scene.add(ball);
}

const quadGeom = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
const quad = new THREE.Mesh(quadGeom, pass1Mat);
postScene.add(quad);

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

  // UPDATE
  const speed = 1.0;
  for (let i = 0; i < NUM; ++i) {
    const ball = balls[i];
    const frac = i / NUM;
    const pos = new THREE.Vector3(
      Math.cos(frac * Math.PI * 1.0 + time * speed) * 0.25,
      Math.sin(frac * Math.PI * 0.5 + time * speed) * 0.1,
      0
    );
    pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), frac * Math.PI * 2.0);
    ball.position.copy(pos);
  }
  renderer.render(scene, camera, sceneOutput);

  quad.material = pass1Mat;
  pass1Mat.uniforms.time.value = time;
  pass1Mat.uniforms.prevFrame.value = drawBuffer;
  drawBuffer = drawBuffer === buffer1 ? buffer2 : buffer1;
  renderer.render(postScene, camera, drawBuffer);

  quad.material = colorizerMat;
  colorizerMat.uniforms.tex.value = drawBuffer;
  renderer.render(postScene, camera);

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

canvas.addEventListener("mousemove", e => {
  mousePos.set(e.pageX - canvas.offsetLeft, e.pageY - canvas.offsetTop);
  mousePos.divide(new THREE.Vector2(REAL_WIDTH, REAL_HEIGHT));
  mousePos.y = 1.0 - mousePos.y;
});

window.addEventListener("keypress", e => {
  if (e.key == "r") {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
});
