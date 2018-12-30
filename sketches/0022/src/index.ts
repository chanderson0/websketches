import * as THREE from "three";

import EffectComposer, {
  RenderPass,
  ShaderPass
} from "three-effectcomposer-es6";
import * as CCapture from "ccapture.js";

const recorder = new CCapture({
  name: "Sketch-0022",
  format: "png",
  framerate: 30,
  autoSaveTime: 1
});

import glsl = require("glslify");
const unpackVert = glsl.file("./shaders/unpack.vert.glsl");
const unpackFrag = glsl.file("./shaders/unpack.frag.glsl");

const SCREEN_BG_COLOR = 0xff985c;
const BG_COLOR = 0xffe66a;
const FG_COLOR = 0xf75916;

const FXAAShader = {
  uniforms: {
    tDiffuse: { type: "t", value: new THREE.Texture() },
    resolution: { type: "v2", value: new THREE.Vector2() }
  },
  vertexShader: glsl.file("./shaders/three-shader-fxaa/vert.glsl"),
  fragmentShader: glsl.file("./shaders/three-shader-fxaa/frag.glsl")
};

const app = document.getElementById("app") as HTMLElement;

const SCALE = 2.0;
const OUTPUT_WIDTH = 724 * SCALE;
const OUTPUT_HEIGHT = 512 * SCALE;
const ASPECT = OUTPUT_WIDTH / OUTPUT_HEIGHT;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.OrthographicCamera(
  -0.5,
  0.5,
  -0.5 / ASPECT,
  0.5 / ASPECT,
  0.01,
  10
);
camera.position.set(0, 0, -5);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
// renderer.setClearColor(new THREE.Color(), 0);
renderer.setSize(OUTPUT_WIDTH, OUTPUT_HEIGHT);
app.appendChild(renderer.domElement);
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";

class OrthoDepthStripes {
  enabled: boolean = true;
  renderToScreen: boolean = false;
  clear: boolean = false;
  needsSwap: boolean = true;
  material: THREE.ShaderMaterial;

  renderTargetDepth: THREE.WebGLRenderTarget;
  depthTexture = new THREE.DepthTexture(
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT,
    THREE.UnsignedShortType,
    THREE.UVMapping,
    THREE.ClampToEdgeWrapping,
    THREE.ClampToEdgeWrapping,
    THREE.NearestFilter,
    THREE.NearestFilter,
    THREE.DepthFormat
  );

  constructor(
    readonly camera: THREE.OrthographicCamera,
    readonly scene: THREE.Scene,
    readonly bgColor: number,
    readonly fgColor: number,
    readonly screenColor: number
  ) {
    this.renderTargetDepth = new THREE.WebGLRenderTarget(
      OUTPUT_WIDTH,
      OUTPUT_HEIGHT
    );
    this.renderTargetDepth.texture.format = THREE.RGBFormat;
    this.renderTargetDepth.texture.minFilter = THREE.NearestFilter;
    this.renderTargetDepth.texture.magFilter = THREE.NearestFilter;
    this.renderTargetDepth.texture.generateMipmaps = false;
    this.renderTargetDepth.stencilBuffer = false;
    this.renderTargetDepth.depthBuffer = true;
    this.renderTargetDepth.depthTexture = this.depthTexture;

    this.material = new THREE.ShaderMaterial({
      vertexShader: unpackVert,
      fragmentShader: unpackFrag,
      uniforms: {
        cameraNear: { value: camera.near },
        cameraFar: { value: camera.far },
        tDepth: { value: this.depthTexture },
        tDiffuse: { value: this.depthTexture },
        tBgColor: { value: new THREE.Color(bgColor) },
        tFgColor: { value: new THREE.Color(fgColor) },
        tScreenColor: { value: new THREE.Color(screenColor) }
      }
    });
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.RenderTarget,
    readBuffer: THREE.RenderTarget,
    delta: number
  ) {
    renderer.render(this.scene, this.camera, this.renderTargetDepth, true);

    this.material.uniforms.tDiffuse.value = (readBuffer as THREE.WebGLRenderTarget).texture;
    EffectComposer.quad.material = this.material;

    if (this.renderToScreen) {
      renderer.render(EffectComposer.scene, EffectComposer.camera);
    } else {
      renderer.render(
        EffectComposer.scene,
        EffectComposer.camera,
        writeBuffer,
        this.clear
      );
    }
  }
}

const target = new THREE.WebGLRenderTarget(OUTPUT_WIDTH, OUTPUT_HEIGHT);
const composer = new EffectComposer(renderer, target);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new OrthoDepthStripes(camera, scene, BG_COLOR, FG_COLOR, SCREEN_BG_COLOR)
);

const effectFXAA = new ShaderPass(FXAAShader);
effectFXAA.uniforms["resolution"].value.set(
  1 / OUTPUT_WIDTH,
  1 / OUTPUT_HEIGHT
);
effectFXAA.renderToScreen = true;
composer.addPass(effectFXAA);

const meshes: THREE.Mesh[] = [];
const NUM = 100;
for (let i = 0; i < NUM; ++i) {
  const geometry = new THREE.TorusGeometry(0.1, 0.05, 50, 100);
  const material = new THREE.MeshNormalMaterial({
    // wireframe: true
    side: THREE.BackSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  const frac = i / (NUM - 1);
  mesh.position.x = (frac - 0.5) * 0.7;
  mesh.rotateX(0.2 * Math.PI + frac * Math.PI);
  mesh.rotateY(0.2 * Math.PI);
  mesh.rotateZ(0.2 * Math.PI);
  scene.add(mesh);
  meshes.push(mesh);
}

let recording = false;
const RECORDING_FPS = 60;

let time = 0;
let lastFrame = +new Date();
let frame = 0;
let trailingDelta = 1.0 / RECORDING_FPS;
let playing = true;
function loop() {
  frame++;
  if (playing) {
    requestAnimationFrame(loop);
  }

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
  for (let i = 0; i < NUM; ++i) {
    const mesh = meshes[i];
    const x = mesh.position.x;

    mesh.rotation.x = ((time * 0.4 + x * 3.0) % 1.0) * Math.PI * 2;
    mesh.scale.setScalar(1.0 - (1.0 - Math.abs(mesh.position.x / 0.7)) / 3.0);
  }

  // Render
  composer.render();

  if (recording) {
    recorder.capture(renderer.domElement);
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

const stop = () => {
  playing = false;
};

window.addEventListener("keypress", e => {
  if (e.key == "r") {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  } else if (e.key == " ") {
    stop();
  }
});
