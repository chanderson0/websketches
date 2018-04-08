// import * as Two from "two.js";
// import * as SimplexNoise from "simplex-noise";

import * as THREE from "three";
import { BufferGeometry } from "three";

//@ts-ignore
const { SVGRenderer } = require("./vendor/SVGRenderer");

// declare var require: any;
// require('three/examples/js/shaders/CopyShader.js');

const app = document.getElementById("app") as HTMLElement;

const OUTPUT_WIDTH = 724;
const OUTPUT_HEIGHT = 512;
const ASPECT = OUTPUT_WIDTH / OUTPUT_HEIGHT;

const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x000000);
const camera = new THREE.OrthographicCamera(
  -0.5,
  0.5,
  -0.5 / ASPECT,
  0.5 / ASPECT,
  0.01,
  10000
);
camera.position.set(0, 0, -1);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new SVGRenderer();
renderer.setClearColor(new THREE.Color(), 0);
renderer.setSize(OUTPUT_WIDTH, OUTPUT_HEIGHT);

app.appendChild(renderer.domElement);

let i = 0;
for (let x = -0.4; x <= 0.4; x += 0.05) {
  for (let y = -0.3; y <= 0.3; y += 0.05) {
    const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    const edges = new THREE.EdgesGeometry(geometry as any, 75);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x0 })
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0x0,
      wireframe: true
    });
    const cube = new THREE.Mesh(geometry, material);

    line.rotateX(x * Math.PI * 1.0);
    line.rotateY(y * Math.PI * 1.0);
    line.rotateZ(i / 1000 * Math.PI);
    line.position.set(x, y, i * 10);

    scene.add(line);

    ++i;
  }
}

renderer.render(scene, camera);

function downloadData(data: string, filename: string) {
  const link = document.createElement("a");
  link.href = data;
  link.download = filename;
  link.click();
}

function downloadSVG() {
  const svg = renderer.domElement;
  svg.setAttribute("version", "1.1");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const blob = new Blob([svg.outerHTML], {type:"image/svg+xml;charset=utf-8"});
  const data = URL.createObjectURL(blob);
  downloadData(data, 'capture.svg');
}

function downloadPNG() {
  const svgData = new XMLSerializer().serializeToString(renderer.domElement);
  const canvas = document.createElement("canvas");
  var svgSize = renderer.domElement.getBoundingClientRect();
  canvas.width = svgSize.width;
  canvas.height = svgSize.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = document.createElement("img");
  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));

  img.onload = function() {
    ctx.drawImage(img, 0, 0);

    downloadData(canvas.toDataURL("image/png"), "capture.png");
  };
}

window.addEventListener("keypress", e => {
  if (e.key == "s") {
    downloadSVG();
  } else if (e.key == "p") {
    downloadPNG();
  }
});
