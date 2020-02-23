#include <packing>

#pragma glslify: map = require(glsl-map)

varying vec2 vUv;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;

uniform vec3 tBgColor;
uniform vec3 tFgColor;
uniform vec3 tBgColor2;
uniform vec3 tFgColor2;
uniform vec3 tScreenColor;

float readDepth( sampler2D depthSampler, vec2 coord ) {
  float fragCoordZ = texture2D( depthSampler, coord ).x;
  // return (2.0 * cameraNear) / (cameraFar + cameraNear - fragCoordZ * (cameraFar - cameraNear));
  return fragCoordZ;
}

void main() {
  vec3 bgColor;
  vec3 fgColor;

  // vec3 tBgColor = vec3(0.0, 0.0, 0.0);
  // vec3 tFgColor = vec3(1.0, 1.0, 1.0);
  // vec3 tScreenColor = vec3(0.0, 0.0, 0.0);

  float depth = readDepth( tDepth, vUv );
  vec4 color = texture2D( tColor, vUv );
  if (color.r > 0.5) {
    bgColor = tBgColor;
    fgColor = tFgColor;
  } else if (color.g > 0.5) {
    bgColor = tBgColor2;
    fgColor = tFgColor2;
  } else {
    gl_FragColor = vec4(tScreenColor, 1.0);
    return;
  }

// gl_FragColor.rgb = vec3(depth) ;
//   return;

  float truedepth = depth;

  // float drawDepth = map(depth, 0.0, 1.0, 0.0, 1.0);

  float pixelDepth = map(depth, 0.0, 1.0, cameraNear, cameraFar);
  float drawDepth = map(pixelDepth, 0., 190.0, 0.0, 1.0);

  drawDepth = clamp(drawDepth, 0.0, 1.0);
  drawDepth = 1.0 - drawDepth;
  // drawDepth = pow(drawDepth, 2.0);

  // gl_FragColor.rgb = vec3(drawDepth);
  // return;
  
  // drawDepth = pow(drawDepth, 0.5);

  float gamma = 1.0;
  float numColors = 7.0;

  float a = pow(drawDepth, gamma);
  a = a * numColors;
  a = floor(a);
  a = a / numColors;
  a = pow(a, 1.0/gamma);
  
  vec3 outColor = map(vec3(a), vec3(0.0), vec3(1.0), bgColor, fgColor);

  gl_FragColor.rgb = outColor;
  
  // if (truedepth > 0.99999) {
  //   gl_FragColor = vec4(tScreenColor, 1.0);
  // }
}
