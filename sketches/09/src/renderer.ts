// /**
//  * @author mrdoob / http://mrdoob.com/
//  */

// import * as THREE from "three";

// export class SVGObject extends THREE.Object3D {
//   node: any;

//   constructor(node: any) {
//     super();
//     this.node = node;
//   }
// }

// export default class SVGRenderer {
//   // Public properties
//   domElement: Element;
//   info: {
//     render: {
//       faces: number;
//       vertices: number;
//     };
//   };

//   // Options
//   autoClear: boolean;
//   sortObjects: boolean;
//   sortElements: boolean;

//   // Internal
//   svg: SVGElement;
//   pathCount: number = 0;
//   quality: "high" | "low";

//   clearColor: THREE.Color = new THREE.Color();
//   clearAlpha: number = 1;
//   precision: number | null = 1;

//   svgWidth: number = 0;
//   svgWidthHalf: number = 0;
//   svgHeight: number = 0;
//   svgHeightHalf: number = 0;
//   clipBox: THREE.Box2 = new THREE.Box2();

//   projector: THREE.Projector = new THREE.Projector();
//   viewProjectionMatrix: THREE.Matrix4 = new THREE.Matrix4();
//   normalViewMatrix: THREE.Matrix3 = new THREE.Matrix3();

//   constructor(svg?: SVGElement) {
//     this.svg =
//       svg || document.createElementNS("http://www.w3.org/2000/svg", "svg");
//     this.domElement = this.svg;

//     // _v1,
//     // _v2,
//     // _v3,
//     // _v4,
//     // _clipBox = new THREE.Box2(),
//     // _elemBox = new THREE.Box2(),
//     // _color = new THREE.Color(),
//     // _diffuseColor = new THREE.Color(),
//     // _ambientLight = new THREE.Color(),
//     // _directionalLights = new THREE.Color(),
//     // _pointLights = new THREE.Color(),
//     // _clearColor = new THREE.Color(),
//     // _clearAlpha = 1,
//     // _vector3 = new THREE.Vector3(), // Needed for PointLight
//     // _centroid = new THREE.Vector3(),
//     // _normal = new THREE.Vector3(),
//     // _normalViewMatrix = new THREE.Matrix3(),
//     // _viewMatrix = new THREE.Matrix4(),
//     // _viewProjectionMatrix = new THREE.Matrix4(),
//     // _svgPathPool = [],
//     // _svgNode,
//     // _pathCount = 0,
//     // _currentPath,
//     // _currentStyle,
//     // _quality = 1,
//     // _precision = null;

//     //   this.domElement = _svg;

//     //   this.autoClear = true;
//     //   this.sortObjects = true;
//     //   this.sortElements = true;

//     //   this.info = {
//     //     render: {
//     //       vertices: 0,
//     //       faces: 0
//     //     }
//     //   };
//   }

//   setQuality(quality: "high" | "low") {
//     this.quality = quality;
//   }

//   // WebGLRenderer compatibility
//   supportsVertexTextures() {}
//   setFaceCulling() {}

//   setClearColor(color: THREE.Color, alpha?: number) {
//     this.clearColor.set(color);
//     this.clearAlpha = alpha !== undefined ? alpha : 1;
//   }

//   setPixelRatio = function() {};

//   setSize(width: number, height: number) {
//     this.svgWidth = width;
//     this.svgHeight = height;
//     this.svgWidthHalf = width / 2;
//     this.svgHeightHalf = height / 2;

//     this.svg.setAttribute(
//       "viewBox",
//       [
//         -this.svgWidthHalf,
//         -this.svgHeightHalf,
//         this.svgWidthHalf,
//         this.svgHeightHalf
//       ].join(" ")
//     );
//     this.svg.setAttribute("width", width.toFixed(0));
//     this.svg.setAttribute("height", height.toFixed(0));

//     this.clipBox.min.set(-this.svgWidthHalf, -this.svgHeightHalf);
//     this.clipBox.max.set(this.svgWidthHalf, this.svgHeightHalf);
//   }

//   setPrecision(precision: number | null) {
//     this.precision = precision;
//   }

//   clear() {
//     this.removeChildNodes();
//     this.svg.style.backgroundColor = this.getSvgColor(
//       this.clearColor,
//       this.clearAlpha
//     );
//   }

//   protected removeChildNodes() {
//     this.pathCount = 0;

//     while (this.svg.childNodes.length > 0) {
//       this.svg.removeChild(this.svg.childNodes[0]);
//     }
//   }

//   protected getSvgColor(color: THREE.Color, opacity?: number) {
//     const triplet = `${Math.floor(color.r * 255)},${Math.floor(
//       color.g * 255
//     )},${Math.floor(color.b * 255)}`;
//     if (opacity === undefined || opacity === 1) {
//       return `rgb(${triplet})`;
//     }
//     return `rgb(${triplet}); fill-opacity: ${opacity}`;
//   }

//   protected convert(c: number) {
//     return this.precision !== null ? c.toFixed(this.precision) : c;
//   }

//   render(scene: THREE.Scene, camera: THREE.Camera) {
//     if (camera instanceof THREE.Camera === false) {
//       console.error(
//         "THREE.SVGRenderer.render: camera is not an instance of THREE.Camera."
//       );
//       return;
//     }

//     const background = scene.background;

//     if (background && background.isColor) {
//       this.removeChildNodes();
//       this.svg.style.backgroundColor = this.getSvgColor(background);
//     } else if (this.autoClear === true) {
//       this.clear();
//     }

//     this.info.render.vertices = 0;
//     this.info.render.faces = 0;

//     this.viewProjectionMatrix.multiplyMatrices(
//       camera.projectionMatrix,
//       camera.matrixWorldInverse
//     );

//     const { elements, lights } = this.projector.projectScene(
//       scene,
//       camera,
//       this.sortObjects,
//       this.sortElements
//     );

//     this.normalViewMatrix.getNormalMatrix(camera.matrixWorldInverse);

//     this.calculateLights(lights);

//     // reset accumulated path
//     let currentPath = "";
//     let currentStyle = "";

//     for (var e = 0, el = elements.length; e < el; e++) {
//       var element = elements[e];
//       var material = element.material;

//       if (material === undefined || material.opacity === 0) continue;

//       _elemBox.makeEmpty();

//       if (element instanceof THREE.RenderableSprite) {
//         _v1 = element;
//         _v1.x *= _svgWidthHalf;
//         _v1.y *= -_svgHeightHalf;

//         renderSprite(_v1, element, material);
//       } else if (element instanceof THREE.RenderableLine) {
//         _v1 = element.v1;
//         _v2 = element.v2;

//         _v1.positionScreen.x *= _svgWidthHalf;
//         _v1.positionScreen.y *= -_svgHeightHalf;
//         _v2.positionScreen.x *= _svgWidthHalf;
//         _v2.positionScreen.y *= -_svgHeightHalf;

//         _elemBox.setFromPoints([_v1.positionScreen, _v2.positionScreen]);

//         if (_clipBox.intersectsBox(_elemBox) === true) {
//           renderLine(_v1, _v2, element, material);
//         }
//       } else if (element instanceof THREE.RenderableFace) {
//         _v1 = element.v1;
//         _v2 = element.v2;
//         _v3 = element.v3;

//         if (_v1.positionScreen.z < -1 || _v1.positionScreen.z > 1) continue;
//         if (_v2.positionScreen.z < -1 || _v2.positionScreen.z > 1) continue;
//         if (_v3.positionScreen.z < -1 || _v3.positionScreen.z > 1) continue;

//         _v1.positionScreen.x *= _svgWidthHalf;
//         _v1.positionScreen.y *= -_svgHeightHalf;
//         _v2.positionScreen.x *= _svgWidthHalf;
//         _v2.positionScreen.y *= -_svgHeightHalf;
//         _v3.positionScreen.x *= _svgWidthHalf;
//         _v3.positionScreen.y *= -_svgHeightHalf;

//         _elemBox.setFromPoints([
//           _v1.positionScreen,
//           _v2.positionScreen,
//           _v3.positionScreen
//         ]);

//         if (_clipBox.intersectsBox(_elemBox) === true) {
//           renderFace3(_v1, _v2, _v3, element, material);
//         }
//       }
//     }

//     flushPath(); // just to flush last svg:path

//     scene.traverseVisible(function(object) {
//       if (object instanceof THREE.SVGObject) {
//         _vector3.setFromMatrixPosition(object.matrixWorld);
//         _vector3.applyMatrix4(_viewProjectionMatrix);

//         var x = _vector3.x * _svgWidthHalf;
//         var y = -_vector3.y * _svgHeightHalf;

//         var node = object.node;
//         node.setAttribute("transform", "translate(" + x + "," + y + ")");

//         _svg.appendChild(node);
//       }
//     });
//   }

//   calculateLights(lights) {
//     _ambientLight.setRGB(0, 0, 0);
//     _directionalLights.setRGB(0, 0, 0);
//     _pointLights.setRGB(0, 0, 0);

//     for (var l = 0, ll = lights.length; l < ll; l++) {
//       var light = lights[l];
//       var lightColor = light.color;

//       if (light instanceof THREE.AmbientLight) {
//         _ambientLight.r += lightColor.r;
//         _ambientLight.g += lightColor.g;
//         _ambientLight.b += lightColor.b;
//       } else if (light instanceof THREE.DirectionalLight) {
//         _directionalLights.r += lightColor.r;
//         _directionalLights.g += lightColor.g;
//         _directionalLights.b += lightColor.b;
//       } else if (light instanceof THREE.PointLight) {
//         _pointLights.r += lightColor.r;
//         _pointLights.g += lightColor.g;
//         _pointLights.b += lightColor.b;
//       }
//     }
//   }

//   calculateLight(lights, position, normal, color) {
//     for (var l = 0, ll = lights.length; l < ll; l++) {
//       var light = lights[l];
//       var lightColor = light.color;

//       if (light instanceof THREE.DirectionalLight) {
//         var lightPosition = _vector3
//           .setFromMatrixPosition(light.matrixWorld)
//           .normalize();

//         var amount = normal.dot(lightPosition);

//         if (amount <= 0) continue;

//         amount *= light.intensity;

//         color.r += lightColor.r * amount;
//         color.g += lightColor.g * amount;
//         color.b += lightColor.b * amount;
//       } else if (light instanceof THREE.PointLight) {
//         var lightPosition = _vector3.setFromMatrixPosition(light.matrixWorld);

//         var amount = normal.dot(
//           _vector3.subVectors(lightPosition, position).normalize()
//         );

//         if (amount <= 0) continue;

//         amount *=
//           light.distance == 0
//             ? 1
//             : 1 -
//               Math.min(position.distanceTo(lightPosition) / light.distance, 1);

//         if (amount == 0) continue;

//         amount *= light.intensity;

//         color.r += lightColor.r * amount;
//         color.g += lightColor.g * amount;
//         color.b += lightColor.b * amount;
//       }
//     }
//   }

//   renderSprite(v1, element, material) {
//     var scaleX = element.scale.x * _svgWidthHalf;
//     var scaleY = element.scale.y * _svgHeightHalf;

//     if (material.isPointsMaterial) {
//       scaleX *= material.size;
//       scaleY *= material.size;
//     }

//     var path =
//       "M" +
//       convert(v1.x - scaleX * 0.5) +
//       "," +
//       convert(v1.y - scaleY * 0.5) +
//       "h" +
//       convert(scaleX) +
//       "v" +
//       convert(scaleY) +
//       "h" +
//       convert(-scaleX) +
//       "z";
//     var style = "";

//     if (material.isSpriteMaterial || material.isPointsMaterial) {
//       style = "fill:" + getSvgColor(material.color, material.opacity);
//     }

//     addPath(style, path);
//   }

//   renderLine(v1, v2, element, material) {
//     var path =
//       "M" +
//       convert(v1.positionScreen.x) +
//       "," +
//       convert(v1.positionScreen.y) +
//       "L" +
//       convert(v2.positionScreen.x) +
//       "," +
//       convert(v2.positionScreen.y);

//     if (material.isLineBasicMaterial) {
//       var style =
//         "fill:none;stroke:" +
//         getSvgColor(material.color, material.opacity) +
//         ";stroke-width:" +
//         material.linewidth +
//         ";stroke-linecap:" +
//         material.linecap;

//       if (material.isLineDashedMaterial) {
//         style =
//           style +
//           ";stroke-dasharray:" +
//           material.dashSize +
//           "," +
//           material.gapSize;
//       }

//       addPath(style, path);
//     }
//   }

//   renderFace3(v1, v2, v3, element, material) {
//     _this.info.render.vertices += 3;
//     _this.info.render.faces++;

//     var path =
//       "M" +
//       convert(v1.positionScreen.x) +
//       "," +
//       convert(v1.positionScreen.y) +
//       "L" +
//       convert(v2.positionScreen.x) +
//       "," +
//       convert(v2.positionScreen.y) +
//       "L" +
//       convert(v3.positionScreen.x) +
//       "," +
//       convert(v3.positionScreen.y) +
//       "z";
//     var style = "";

//     if (material instanceof THREE.MeshBasicMaterial) {
//       _color.copy(material.color);

//       if (material.vertexColors === THREE.FaceColors) {
//         _color.multiply(element.color);
//       }
//     } else if (
//       material instanceof THREE.MeshLambertMaterial ||
//       material instanceof THREE.MeshPhongMaterial
//     ) {
//       _diffuseColor.copy(material.color);

//       if (material.vertexColors === THREE.FaceColors) {
//         _diffuseColor.multiply(element.color);
//       }

//       _color.copy(_ambientLight);

//       _centroid
//         .copy(v1.positionWorld)
//         .add(v2.positionWorld)
//         .add(v3.positionWorld)
//         .divideScalar(3);

//       calculateLight(_lights, _centroid, element.normalModel, _color);

//       _color.multiply(_diffuseColor).add(material.emissive);
//     } else if (material instanceof THREE.MeshNormalMaterial) {
//       _normal.copy(element.normalModel).applyMatrix3(_normalViewMatrix);

//       _color
//         .setRGB(_normal.x, _normal.y, _normal.z)
//         .multiplyScalar(0.5)
//         .addScalar(0.5);
//     }

//     if (material.wireframe) {
//       style =
//         "fill:none;stroke:" +
//         getSvgColor(_color, material.opacity) +
//         ";stroke-width:" +
//         material.wireframeLinewidth +
//         ";stroke-linecap:" +
//         material.wireframeLinecap +
//         ";stroke-linejoin:" +
//         material.wireframeLinejoin;
//     } else {
//       style = "fill:" + getSvgColor(_color, material.opacity);
//     }

//     addPath(style, path);
//   }

//   addPath(style, path) {
//     if (_currentStyle === style) {
//       _currentPath += path;
//     } else {
//       this.flushPath();

//       _currentStyle = style;
//       _currentPath = path;
//     }
//   }

//   flushPath() {
//     if (_currentPath) {
//       _svgNode = getPathNode(_pathCount++);
//       _svgNode.setAttribute("d", _currentPath);
//       _svgNode.setAttribute("style", _currentStyle);
//       _svg.appendChild(_svgNode);
//     }

//     _currentPath = "";
//     _currentStyle = "";
//   }

//   getPathNode(id) {
//     if (_svgPathPool[id] == null) {
//       _svgPathPool[id] = document.createElementNS(
//         "http://www.w3.org/2000/svg",
//         "path"
//       );

//       if (_quality == 0) {
//         _svgPathPool[id].setAttribute("shape-rendering", "crispEdges"); //optimizeSpeed
//       }

//       return _svgPathPool[id];
//     }

//     return _svgPathPool[id];
//   }
// }
