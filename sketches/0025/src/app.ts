import { makeNoise3D } from 'open-simplex-noise';
import {
  CatmullRomCurve3,
  Color,
  CylinderBufferGeometry,
  DoubleSide,
  Material,
  Mesh,
  MeshBasicMaterial,
  Path,
  Quaternion,
  SplineCurve,
  Vector2,
  Vector3,
} from 'three';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { Runner } from './boilerplate';
import { ASPECT, HEIGHT, WIDTH, RECORDING_FPS } from './constants';
import { DepthPass } from './DepthPass';
import { DynamicTubeBufferGeometry } from './DynamicTubeGeometry';

const noise3D = makeNoise3D(12);

// https://stackoverflow.com/questions/15316127/three-js-line-vector-to-cylinder
function cylindricalSegment(A: Vector3, B: Vector3, radius: number, material: Material): Mesh {
  const vec = B.clone();
  vec.sub(A);
  const h = vec.length();
  vec.normalize();
  const quaternion = new Quaternion();
  quaternion.setFromUnitVectors(new Vector3(0, 1, 0), vec);
  const geometry = new CylinderBufferGeometry(radius, radius, h, 32);
  geometry.translate(0, h / 2, 0);
  const cylinder = new Mesh(geometry, material);
  cylinder.applyQuaternion(quaternion);
  cylinder.position.set(A.x, A.y, A.z);
  return cylinder;
}

const vecFromTime = (time: number, offset = 0): Vector3 =>
  new Vector3(noise3D(0, offset, time), noise3D(5, offset, time), noise3D(10, offset, time));

export class App extends Runner {
  setup(): void {
    const renderPass = new RenderPass(this.scene, this.camera);
    renderPass.renderToScreen = false;
    // renderPass.needsSwap = false;
    this.composer.addPass(renderPass);

    // const smaaPass = new SMAAPass(WIDTH, HEIGHT);
    // smaaPass.renderToScreen = false;
    // this.composer.addPass(smaaPass);

    const depthPass = new DepthPass(this.scene, this.camera, WIDTH, HEIGHT, {
      fgColor: new Color(0xff616b),
      bgColor: new Color(0xfaed8f),
      bgColor2: new Color(0x3400a3),
      fgColor2: new Color(0xb5ffc2),
      screenColor: new Color(0x0d213c),
    });
    depthPass.renderToScreen = false;
    depthPass.needsSwap = true;
    this.composer.addPass(depthPass);

    const smaaPass = new SMAAPass(WIDTH, HEIGHT);
    smaaPass.renderToScreen = true;
    this.composer.addPass(smaaPass);

    // const renderPass = new RenderPass(this.scene, this.camera);
    // renderPass.renderToScreen = true;
    // // renderPass.needsSwap = false;
    // this.composer.addPass(renderPass);

    this.camera.position.z = 4;
    // this.camera.far = 10000;

    const buildTube = (color: number, offset = 0) => {
      const points: Vector3[] = [];
      const radii: number[] = [];
      const mat = new MeshBasicMaterial({ color, side: DoubleSide });
      let prevMesh: Mesh | undefined;
      let prevStart: Mesh | undefined;
      let prevEnd: Mesh | undefined;

      const SPEED = (1 / 1000) * 1;
      const SIZE_SPEED = (1 / 1000) * 1;

      return (time: number): void => {
        const currPos = vecFromTime(time * SPEED, offset);
        let radius = noise3D(0, offset, time * SIZE_SPEED) * 0.5 + 0.5;
        radius *= 0.5 + 0.5;
        radius *= 0.09;

        currPos.y *= 1 / ASPECT;

        points.push(currPos);
        radii.push(radius);

        while (points.length > 200) {
          points.shift();
          radii.shift();
        }

        for (const [i, point] of points.entries()) {
          point.z = -200 * (1 - i / points.length);
        }
        // console.log(points[0].z);

        if (points.length < 2) {
          return;
        }

        const splinePoints: Vector2[] = radii.map((v, i) => new Vector2(i / (radii.length - 1), v));

        const path = new CatmullRomCurve3(points);
        const radiusPath = new SplineCurve(splinePoints);
        const geom = new DynamicTubeBufferGeometry(
          path,
          128,
          (radiusPath as unknown) as Path,
          12,
          false,
          true
        );

        const mesh = new Mesh(geom, mat);
        if (prevMesh) {
          this.scene.remove(prevMesh);
        }
        prevMesh = mesh;
        this.scene.add(mesh);

        const startCapMesh = new Mesh(geom.startCap, mat);
        if (prevStart) {
          this.scene.remove(prevStart);
        }
        prevStart = startCapMesh;
        this.scene.add(startCapMesh);

        const endCapMesh = new Mesh(geom.endCap, mat);
        if (prevEnd) {
          this.scene.remove(prevEnd);
        }
        prevEnd = endCapMesh;
        this.scene.add(endCapMesh);
      };
    };

    const onFrame1 = buildTube(0xff0000, 0);
    const onFrame2 = buildTube(0x00ff00, 5);

    this.onFrame = (_, elapsed): void => {
      onFrame1(elapsed);
      onFrame2(elapsed);
    };
  }
}
