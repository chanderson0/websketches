#include <packing>

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;

// const mat3 sobelKernelX = mat3(1.0, 0.0, -1.0,
// 							                 2.0, 0.0, -2.0,
// 							                 1.0, 0.0, -1.0);

// const mat3 sobelKernelY = mat3(-1.0, -2.0, -1.0,
// 							                 0.0, 0.0, 0.0,
// 							                 1.0, 2.0, 1.0);

// float convolve(mat3 kernel, mat3 image) {
// 	float result = 0.0;
// 	for (int i = 0; i < 3; i++) {
// 		for (int j = 0; j < 3; j++) {
// 			result += kernel[i][j]*image[i][j];
// 		}
// 	}
// 	return result;
// }

float readDepth( sampler2D depthSampler, vec2 coord ) {
  float fragCoordZ = texture2D( depthSampler, coord ).x;
  // return (2.0 * cameraNear) / (cameraFar + cameraNear - fragCoordZ * (cameraFar - cameraNear));
  return fragCoordZ;
}

// void make_kernel(float n[9], sampler2D tex, vec2 coord)
// {
// 	float w = 0.0;//1.0 / width;
// 	float h = 0.0;//1.0 / height;

// 	n[0] = readDepth(tex, coord + vec2( -w, -h));
// 	n[1] = readDepth(tex, coord + vec2(0.0, -h));
// 	n[2] = readDepth(tex, coord + vec2(  w, -h));
// 	n[3] = readDepth(tex, coord + vec2( -w, 0.0));
// 	n[4] = readDepth(tex, coord);
// 	n[5] = readDepth(tex, coord + vec2(  w, 0.0));
// 	n[6] = readDepth(tex, coord + vec2( -w, h));
// 	n[7] = readDepth(tex, coord + vec2(0.0, h));
// 	n[8] = readDepth(tex, coord + vec2(  w, h));
// }

void main() {
  // float n[9];
  // make_kernel( n, tDepth, vUv );
  // float sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
  // float sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
  // float sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
	// gl_FragColor = vec4( 1.0 - vec3(sobel), 1.0 );

  // float depth = readDepth( tDepth, vUv );
  // // if (depth < 0.99) {
  // //   float frac = fract(depth / 0.001);
  // //   depth = frac > 0.5 ? 0.0 : 1.0;
  // // }
  // gl_FragColor.rgb = 1.0 - vec3( depth );
  // gl_FragColor.a = 1.0;

  vec3 c = texture2D(tDiffuse, vUv).rgb;
  if (c.r > 0.0001 || c.b > 0.0001 || c.g > 0.0001) {
    c.b = 1.0 - c.r;
  }
  gl_FragColor = vec4(c, 1.0);
}
