import * as Two from "two.js";
import * as SimplexNoise from "simplex-noise";

const elem = document.getElementById("app");
const two = new Two({
  width: 724,
  height: 512
}).appendTo(elem);

function normSin(v: number) {
  return Math.sin(v) * 0.5 + 0.5;
}

for (let x = 0; x < two.width; x += 10) {
  for (let y = 0; y < two.height; y += 10) {
    const dist = new Two.Vector(x, y).distanceTo(
      new Two.Vector(two.width / 2, two.height / 2)
    );
    const normDist = dist / (Math.max(two.width, two.height) / 2.0);
    if (Math.pow(normDist, 2.0) > 0.4) {
      continue;
    }
    const r = normSin(
      Math.pow(Math.abs(x - two.width / 2.0) / 10, 3.1) +
      Math.pow(Math.abs(y - two.height / 2.0) / 10, 3.1)
    ) * 10;

    if (r < 3) {
      continue;
    }
    const rect = two.makeCircle(
      x,
      y,
      r
    ); //, normSin(x - y) * 10);
    // rect.rotation = normSin(x * Math.sqrt(y)) * Math.PI * 2.0;
    rect.stroke = "#222";
    rect.linewidth = 1;
    rect.noFill();
  }
}
two.update();

// const noise = new SimplexNoise();
// function gradientDir(pos: typeof Two.Vector) {
//   const EPS = 0.01;
//   const SCALE = 0.003;
//   const SPEED = 50;

//   const l = noise.noise2D(SCALE * pos.x - EPS, SCALE * pos.y);
//   const r = noise.noise2D(SCALE * pos.x + EPS, SCALE * pos.y);
//   const u = noise.noise2D(SCALE * pos.x, SCALE * pos.y + EPS);
//   const d = noise.noise2D(SCALE * pos.x, SCALE * pos.y - EPS);

//   return new Two.Vector(-(r - l) * SPEED, (u - d) * SPEED);
// }

// const paths: typeof Two.Path[] = [];
// for (let i = 0; i < 5000; ++i) {
//   const x = Math.random() * two.width;
//   const y = Math.random() * two.height;

//   let pos = new Two.Vector(x, y);

//   const points = [new Two.Anchor(pos.x, pos.y)];
//   for (let j = 0; j < 7; ++j) {
//     pos.addSelf(gradientDir(pos));
//     // pos.addSelf(new Two.Vector(Math.random(), Math.random()).multiplyScalar(2.0));
//     points.push(new Two.Anchor(pos.x, pos.y));
//   }
//   const path = two.makeCurve(points, true);
//   path.stroke = "#222";
//   path.linewidth = 1;
//   path.noFill();

//   paths.push(path);
// }
// two.update();

function downloadData(data: string, filename: string) {
  const link = document.createElement("a");
  link.href = data;
  link.download = filename;
  link.click();
}

function downloadSVG() {
  if (!elem) return;

  const svg = elem.children[0];
  svg.setAttribute("version", "1.1");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const blob = new Blob([svg.outerHTML], {type:"image/svg+xml;charset=utf-8"});
  const data = URL.createObjectURL(blob);
  downloadData(data, 'capture.svg');
}

function downloadPNG() {
  if (!elem) return;

  const svgData = new XMLSerializer().serializeToString(elem.children[0]);
  const canvas = document.createElement("canvas");
  var svgSize = elem.getBoundingClientRect();
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
