/**
 * Depth-of-field post-process with bokeh shader
 */

import {
  ClampToEdgeWrapping,
  Color,
  DepthFormat,
  DepthTexture,
  LinearFilter,
  NearestFilter,
  OrthographicCamera,
  PerspectiveCamera,
  RGBFormat,
  Scene,
  ShaderMaterial,
  UnsignedShortType,
  UVMapping,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { Pass } from 'three/examples/jsm/postprocessing//Pass.js';
import unpackFrag from './shaders/unpack.frag.glsl';
import unpackVert from './shaders/unpack.vert.glsl';

export class DepthPass extends Pass {
  private scene: Scene;
  private camera: PerspectiveCamera | OrthographicCamera;

  private depthTexture: DepthTexture;

  private renderTargetColor: WebGLRenderTarget;
  private renderTargetDepth: WebGLRenderTarget;

  // private materialDepth: MeshDepthMaterial;
  private materialShader: ShaderMaterial;

  private fsQuad: Pass.FullScreenQuad;
  private oldClearColor = new Color();

  public needsSwap = false;

  constructor(
    scene: Scene,
    camera: PerspectiveCamera | OrthographicCamera,
    width: number,
    height: number,
    { bgColor, fgColor, screenColor }: { bgColor: Color; fgColor: Color; screenColor: Color }
  ) {
    super();
    this.scene = scene;
    this.camera = camera;

    this.renderTargetColor = new WebGLRenderTarget(width, height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBFormat,
    });
    this.renderTargetColor.texture.name = 'DepthPass.color';

    this.depthTexture = new DepthTexture(
      width,
      height,
      UnsignedShortType,
      UVMapping,
      ClampToEdgeWrapping,
      ClampToEdgeWrapping,
      NearestFilter,
      NearestFilter,
      DepthFormat
    );
    this.renderTargetDepth = this.renderTargetColor.clone();
    this.renderTargetDepth.texture.name = 'DepthPass.depth';
    this.renderTargetDepth.texture.format = RGBFormat;
    this.renderTargetDepth.texture.minFilter = NearestFilter;
    this.renderTargetDepth.texture.magFilter = NearestFilter;
    this.renderTargetDepth.texture.generateMipmaps = false;
    this.renderTargetDepth.stencilBuffer = false;
    this.renderTargetDepth.depthBuffer = true;
    this.renderTargetDepth.depthTexture = this.depthTexture;

    // this.materialDepth = new MeshDepthMaterial();
    // this.materialDepth.depthPacking = BasicDepthPacking;
    // this.materialDepth.blending = NoBlending;

    this.materialShader = new ShaderMaterial({
      uniforms: {
        tDepth: {},
        tColor: {},
        cameraNear: {},
        cameraFar: {},
        tBgColor: { value: bgColor },
        tFgColor: { value: fgColor },
        tScreenColor: { value: screenColor },
      },
      vertexShader: unpackVert,
      fragmentShader: unpackFrag,
    });
    this.fsQuad = new Pass.FullScreenQuad(this.materialShader);

    this.materialShader.uniforms['tDepth'].value = this.depthTexture;
    this.materialShader.uniforms['cameraNear'].value = camera.near;
    this.materialShader.uniforms['cameraFar'].value = camera.far;
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean
  ): void {
    // this.scene.overrideMaterial = this.materialDepth;

    this.oldClearColor.copy(renderer.getClearColor());
    const oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;

    renderer.setClearColor(0xffffff);
    renderer.setClearAlpha(1.0);
    renderer.setRenderTarget(this.renderTargetDepth);
    renderer.clear();
    renderer.render(this.scene, this.camera);

    this.materialShader.uniforms['tColor'].value = readBuffer.texture;
    this.materialShader.uniforms['cameraNear'].value = this.camera.near;
    this.materialShader.uniforms['cameraFar'].value = this.camera.far;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      renderer.clear();
      this.fsQuad.render(renderer);
    }

    this.scene.overrideMaterial = null;
    renderer.setClearColor(this.oldClearColor);
    renderer.setClearAlpha(oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
}
