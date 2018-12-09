import * as THREE from "three";
// @ts-ignore
import * as ImageTracer from "./vendor/imagetracer_v1.2.4.js";
import EffectComposer, {
  RenderPass,
  ShaderPass,
  CopyShader
} from "three-effectcomposer-es6";
import * as CCapture from "ccapture.js";
import * as Color from "color";
// @ts-ignore
// import * as FXAAShader from "three-shader-fxaa";

const recorder = new CCapture({
  name: "Sketch-0022",
  format: "png",
  framerate: 30,
  autoSaveTime: 1
});

import glsl = require("glslify");
const unpackVert = glsl.file("./shaders/unpack.vert.glsl");
const unpackFrag = glsl.file("./shaders/unpack.frag.glsl");

const fmod = function(a: number, b: number) {
  return a - Math.floor(a / b) * b;
};

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

const SHADOW = `
<defs>
  <filter id="shadow" x="0" y="0">
    <feOffset result="offOut" in="SourceAlpha" dx="-5" dy="-5" />
    <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
    <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
  </filter>
</defs>
`;

const app = document.getElementById("app") as HTMLElement;
let svgElement: SVGElement | null = null;
let palette: any = undefined;

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
composer.addPass(new OrthoDepthStripes(camera, scene, BG_COLOR, FG_COLOR, SCREEN_BG_COLOR));

// const fxaa = new ShaderPass(FXAAShader);
// console.log(fxaa);
// fxaa.uniforms.resolution = {
//   value: new THREE.Vector2(OUTPUT_WIDTH, OUTPUT_HEIGHT)
// };
// fxaa.renderToScreen = true;
// composer.addPass(fxaa);

const effectFXAA = new ShaderPass(FXAAShader);
effectFXAA.uniforms["resolution"].value.set(
  1 / OUTPUT_WIDTH,
  1 / OUTPUT_HEIGHT
);
effectFXAA.renderToScreen = true;
composer.addPass(effectFXAA);

// let i = 0;
// for (let x = -0.4; x <= 0.4; x += 0.25) {
//   for (let y = -0.3; y <= 0.3; y += 0.25) {
//     const geometry = new THREE.TorusGeometry(0.01, 0.005);
//     // const edges = new THREE.EdgesGeometry(geometry as any, 5);
//     // const line = new THREE.LineSegments(
//     //   edges,
//     //   new THREE.LineBasicMaterial({ color: 0x0 })
//     // );
//     const material = new THREE.MeshBasicMaterial({
//       color: Math.random() * 0xffffff,
//       wireframe: false
//     });
//     const cube = new THREE.Mesh(geometry, material);

//     cube.rotateX(x * Math.PI * 1.0);
//     cube.rotateY(y * Math.PI * 1.0);
//     cube.rotateZ((i / 1000) * Math.PI);
//     cube.position.set(x, y, i * 10);

//     scene.add(cube);

//     ++i;
//   }
// }

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

const webglCanvas = renderer.domElement;
const offscreenCanvas = document.createElement("canvas");
offscreenCanvas.width = webglCanvas.width;
offscreenCanvas.height = webglCanvas.height;
const offscreenCtx = offscreenCanvas.getContext("2d");

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
    // mesh.position.x = (frac - 0.5) * 0.6;
    // mesh.position.y = Math.sin(time + i) * 0.05;

    mesh.rotation.x = ((time * 0.4 + x * 3.0) % 1.0) * Math.PI * 2;
    mesh.scale.setScalar(1.0 - (1.0 - Math.abs(mesh.position.x / 0.7)) / 3.0);
    // mesh.rotation.z = ((time * 0.2 + i * 0.1) % 1.0) * Math.PI * 2;
  }

  // Render
  // renderer.render(scene, camera, target);
  // renderer.render(postScene, postCamera);
  // // renderer.render(scene, camera);
  render();

  // const imgData = ImageTracer.getImgdata(renderer.domElement);
  // const svg = ImageTracer.imagedataToSVG(imgData);

  if (recording) {
    recorder.capture(renderer.domElement);
    // downloadPNG(canvas => {
    //   recorder.capture(canvas);
    // });
  }
}
loop();

function render() {
  // renderer.render(scene, camera, target);
  // renderer.render(postScene, postCamera);

  composer.render();

  const no = false;
  if (no && offscreenCtx) {
    offscreenCtx.drawImage(webglCanvas, 0, 0);
    const imgData = offscreenCtx.getImageData(
      0,
      0,
      offscreenCanvas.width,
      offscreenCanvas.height
    );

    // const out = Potrace.fromImage(offscreenCanvas, {});
    // const svgString = out.toSVG(1.0 / SCALE);
    // console.log(svg);
    // if (!updatedOptions) {
    const options = { colorquantcycles: 3 };
    // }
    if (!palette) {
      palette = ImageTracer.samplepalette2(12, imgData);
      console.log(palette);
    }
    const svgString = ImageTracer.imagedataToSVG(imgData, {
      ...options,
      pal: palette
    });

    const holder = document.createElement("div");
    holder.innerHTML = svgString;
    svgElement = holder.firstChild as SVGElement;

    svgElement.style.width = "100%";
    svgElement.style.height = "100%";
    svgElement.setAttribute("viewBox", `0 0 ${OUTPUT_WIDTH} ${OUTPUT_HEIGHT}`);

    app.innerHTML = "";
    app.appendChild(svgElement);

    postprocessSvg(svgElement);
  }
}

function postprocessSvg(elem: SVGElement) {
  const elemsToRemove: SVGElement[] = [];
  const elemsToKeep = [];
  // elem.setAttribute(
  //   "style",
  //   (elem.getAttribute("style") || "") + ";background:black"
  // );
  for (let i = 0; i < elem.children.length; ++i) {
    const child = elem.children[i];
    if (child instanceof SVGElement) {
      child.setAttribute("stroke", child.getAttribute("fill") as string);
      child.setAttribute("stroke-width", "2");

      const fill = child.getAttribute("fill");
      if (fill) {
        if (fill === "rgb(0,0,0)") {
          elemsToRemove.push(child);
          continue;
        }

        const c = new Color(fill);
        const lightness = c.lightness();
        const newFill = new Color(0xffffff);
        // child.setAttribute("fill");
      }

      // child.setAttribute("stroke", "white");
      // child.setAttribute("stroke-width", "2");

      child.setAttribute("stroke-linejoin", "round");
      child.setAttribute("stroke-miterlimit", "0");
      // child.setAttribute("stroke-alignment", "outer");

      // child.setAttribute("stroke", "black");

      // child.setAttribute("fill", "none");

      const rect = child.getBoundingClientRect();
      const area = rect.width * rect.height;
      // if (area < 100 * SCALE) {
      //   elemsToRemove.push(child);
      //   continue;
      // }
      const d = child.getAttribute("d");
      if (d && d.startsWith("M 0 0")) {
        elemsToRemove.push(child);
        continue;
      }

      elemsToKeep.push(child);
    }
  }

  for (const e of elemsToRemove) {
    elem.removeChild(e);
  }

  // const groupElem = document.createElement("g");
  // for (const e of elemsToKeep) {
  //   groupElem.appendChild(e);
  // }
  // groupElem.setAttribute("filter", "url(#shadow)");
  // elem.innerHTML = SHADOW;
  // elem.innerHTML += '<path fill="black" d="M 0 0"></path>';
  // elem.appendChild(groupElem);
}

function downloadData(data: string, filename: string) {
  const link = document.createElement("a");
  link.href = data;
  link.download = filename;
  link.click();
}

function downloadSVG() {
  if (!svgElement) return;

  svgElement.setAttribute("version", "1.1");
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const viewBox = svgElement.getAttribute("viewBox") || "";
  svgElement.removeAttribute("viewBox");

  const blob = new Blob([svgElement.outerHTML], {
    type: "image/svg+xml;charset=utf-8"
  });
  const data = URL.createObjectURL(blob);
  downloadData(data, "capture.svg");

  svgElement.setAttribute("viewBox", viewBox);
}

function downloadPNG(callback: (c: HTMLCanvasElement) => void) {
  if (!svgElement) return;

  svgElement.setAttribute("version", "1.1");
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // const viewBox = svgElement.getAttribute("viewBox") || "";
  // svgElement.removeAttribute("viewBox");

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement("canvas");
  // const svgSize = svgElement.getBoundingClientRect();
  // const viewBox = svgElement.getAttribute("viewBox") || "";
  // svgElement.removeAttribute("viewBox");

  canvas.width = 724 * 2;
  canvas.height = 512 * 2;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = document.createElement("img");
  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));

  img.onload = function() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    callback(canvas);
  };
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
  } else if (e.key == "s") {
    downloadSVG();
  } else if (e.key == "p") {
    downloadPNG(canvas => {
      downloadData(canvas.toDataURL("image/png"), "capture.png");
    });
  } else if (e.key == " ") {
    stop();
  }
});
