(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * A fast javascript implementation of simplex noise by Jonas Wagner

Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
Better rank ordering method by Stefan Gustavson in 2012.


 Copyright (c) 2018 Jonas Wagner

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
(function() {
  'use strict';

  var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  var F3 = 1.0 / 3.0;
  var G3 = 1.0 / 6.0;
  var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
  var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

  function SimplexNoise(randomOrSeed) {
    var random;
    if (typeof randomOrSeed == 'function') {
      random = randomOrSeed;
    }
    else if (randomOrSeed) {
      random = alea(randomOrSeed);
    } else {
      random = Math.random;
    }
    this.p = buildPermutationTable(random);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }

  }
  SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
      -1, 1, 0,
      1, -1, 0,

      -1, -1, 0,
      1, 0, 1,
      -1, 0, 1,

      1, 0, -1,
      -1, 0, -1,
      0, 1, 1,

      0, -1, 1,
      0, 1, -1,
      0, -1, -1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1,
      0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1,
      1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1,
      -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1,
      1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1,
      -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1,
      1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0,
      -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]),
    noise2D: function(xin, yin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0 = 0; // Noise contributions from the three corners
      var n1 = 0;
      var n2 = 0;
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin) * F2; // Hairy factor for 2D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var t = (i + j) * G2;
      var X0 = i - t; // Unskew the cell origin back to (x,y) space
      var Y0 = j - t;
      var x0 = xin - X0; // The x,y distances from the cell origin
      var y0 = yin - Y0;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if (x0 > y0) {
        i1 = 1;
        j1 = 0;
      } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      else {
        i1 = 0;
        j1 = 1;
      } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
      var y2 = y0 - 1.0 + 2.0 * G2;
      // Work out the hashed gradient indices of the three simplex corners
      var ii = i & 255;
      var jj = j & 255;
      // Calculate the contribution from the three corners
      var t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        var gi0 = permMod12[ii + perm[jj]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
      }
      var t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function(xin, yin, zin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0, n1, n2, n3; // Noise contributions from the four corners
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var k = Math.floor(zin + s);
      var t = (i + j + k) * G3;
      var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
      var Y0 = j - t;
      var Z0 = k - t;
      var x0 = xin - X0; // The x,y,z distances from the cell origin
      var y0 = yin - Y0;
      var z0 = zin - Z0;
      // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
      // Determine which simplex we are in.
      var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
      var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // X Y Z order
        else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // X Z Y order
        else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // Z X Y order
      }
      else { // x0<y0
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Z Y X order
        else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Y Z X order
        else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // Y X Z order
      }
      // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
      // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
      // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
      // c = 1/6.
      var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
      var y1 = y0 - j1 + G3;
      var z1 = z0 - k1 + G3;
      var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
      var y2 = y0 - j2 + 2.0 * G3;
      var z2 = z0 - k2 + 2.0 * G3;
      var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
      var y3 = y0 - 1.0 + 3.0 * G3;
      var z3 = z0 - 1.0 + 3.0 * G3;
      // Work out the hashed gradient indices of the four simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      // Calculate the contribution from the four corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
        t3 *= t3;
        n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to stay just inside [-1,1]
      return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function(x, y, z, w) {
      var perm = this.perm;
      var grad4 = this.grad4;

      var n0, n1, n2, n3, n4; // Noise contributions from the five corners
      // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
      var s = (x + y + z + w) * F4; // Factor for 4D skewing
      var i = Math.floor(x + s);
      var j = Math.floor(y + s);
      var k = Math.floor(z + s);
      var l = Math.floor(w + s);
      var t = (i + j + k + l) * G4; // Factor for 4D unskewing
      var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
      var Y0 = j - t;
      var Z0 = k - t;
      var W0 = l - t;
      var x0 = x - X0; // The x,y,z,w distances from the cell origin
      var y0 = y - Y0;
      var z0 = z - Z0;
      var w0 = w - W0;
      // For the 4D case, the simplex is a 4D shape I won't even try to describe.
      // To find out which of the 24 possible simplices we're in, we need to
      // determine the magnitude ordering of x0, y0, z0 and w0.
      // Six pair-wise comparisons are performed between each possible pair
      // of the four coordinates, and the results are used to rank the numbers.
      var rankx = 0;
      var ranky = 0;
      var rankz = 0;
      var rankw = 0;
      if (x0 > y0) rankx++;
      else ranky++;
      if (x0 > z0) rankx++;
      else rankz++;
      if (x0 > w0) rankx++;
      else rankw++;
      if (y0 > z0) ranky++;
      else rankz++;
      if (y0 > w0) ranky++;
      else rankw++;
      if (z0 > w0) rankz++;
      else rankw++;
      var i1, j1, k1, l1; // The integer offsets for the second simplex corner
      var i2, j2, k2, l2; // The integer offsets for the third simplex corner
      var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
      // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
      // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
      // impossible. Only the 24 indices which have non-zero entries make any sense.
      // We use a thresholding to set the coordinates in turn from the largest magnitude.
      // Rank 3 denotes the largest coordinate.
      i1 = rankx >= 3 ? 1 : 0;
      j1 = ranky >= 3 ? 1 : 0;
      k1 = rankz >= 3 ? 1 : 0;
      l1 = rankw >= 3 ? 1 : 0;
      // Rank 2 denotes the second largest coordinate.
      i2 = rankx >= 2 ? 1 : 0;
      j2 = ranky >= 2 ? 1 : 0;
      k2 = rankz >= 2 ? 1 : 0;
      l2 = rankw >= 2 ? 1 : 0;
      // Rank 1 denotes the second smallest coordinate.
      i3 = rankx >= 1 ? 1 : 0;
      j3 = ranky >= 1 ? 1 : 0;
      k3 = rankz >= 1 ? 1 : 0;
      l3 = rankw >= 1 ? 1 : 0;
      // The fifth corner has all coordinate offsets = 1, so no need to compute that.
      var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
      var y1 = y0 - j1 + G4;
      var z1 = z0 - k1 + G4;
      var w1 = w0 - l1 + G4;
      var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
      var y2 = y0 - j2 + 2.0 * G4;
      var z2 = z0 - k2 + 2.0 * G4;
      var w2 = w0 - l2 + 2.0 * G4;
      var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
      var y3 = y0 - j3 + 3.0 * G4;
      var z3 = z0 - k3 + 3.0 * G4;
      var w3 = w0 - l3 + 3.0 * G4;
      var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
      var y4 = y0 - 1.0 + 4.0 * G4;
      var z4 = z0 - 1.0 + 4.0 * G4;
      var w4 = w0 - 1.0 + 4.0 * G4;
      // Work out the hashed gradient indices of the five simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      var ll = l & 255;
      // Calculate the contribution from the five corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
        t0 *= t0;
        n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
        t1 *= t1;
        n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
        t2 *= t2;
        n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
        t3 *= t3;
        n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
      }
      var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
      if (t4 < 0) n4 = 0.0;
      else {
        var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
        t4 *= t4;
        n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
      }
      // Sum up and scale the result to cover the range [-1,1]
      return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }
  };

  function buildPermutationTable(random) {
    var i;
    var p = new Uint8Array(256);
    for (i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (i = 0; i < 255; i++) {
      var r = i + ~~(random() * (256 - i));
      var aux = p[i];
      p[i] = p[r];
      p[r] = aux;
    }
    return p;
  }
  SimplexNoise._buildPermutationTable = buildPermutationTable;

  function alea() {
    // Johannes Baagøe <baagoe@baagoe.com>, 2010
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    var mash = masher();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < arguments.length; i++) {
      s0 -= mash(arguments[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(arguments[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(arguments[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;
    return function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
  }
  function masher() {
    var n = 0xefc8249d;
    return function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
  }

  // amd
  if (typeof define !== 'undefined' && define.amd) define(function() {return SimplexNoise;});
  // common js
  if (typeof exports !== 'undefined') exports.SimplexNoise = SimplexNoise;
  // browser
  else if (typeof window !== 'undefined') window.SimplexNoise = SimplexNoise;
  // nodejs
  if (typeof module !== 'undefined') {
    module.exports = SimplexNoise;
  }

})();

},{}],2:[function(require,module,exports){
(function (global){
/**
 * two.js
 * a two-dimensional drawing api meant for modern browsers. It is renderer
 * agnostic enabling the same api for rendering in multiple contexts: webgl,
 * canvas2d, and svg.
 *
 * Copyright (c) 2012 - 2017 jonobr1 / http://jonobr1.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

this.Two = (function(previousTwo) {

  var root = typeof window != 'undefined' ? window : typeof global != 'undefined' ? global : null;
  var toString = Object.prototype.toString;
  var _ = {
    // http://underscorejs.org/ • 1.8.3
    _indexAmount: 0,
    natural: {
      slice: Array.prototype.slice,
      indexOf: Array.prototype.indexOf,
      keys: Object.keys,
      bind: Function.prototype.bind,
      create: Object.create
    },
    identity: function(value) {
      return value;
    },
    isArguments: function(obj) {
      return toString.call(obj) === '[object Arguments]';
    },
    isFunction: function(obj) {
      return toString.call(obj) === '[object Function]';
    },
    isString: function(obj) {
      return toString.call(obj) === '[object String]';
    },
    isNumber: function(obj) {
      return toString.call(obj) === '[object Number]';
    },
    isDate: function(obj) {
      return toString.call(obj) === '[object Date]';
    },
    isRegExp: function(obj) {
      return toString.call(obj) === '[object RegExp]';
    },
    isError: function(obj) {
      return toString.call(obj) === '[object Error]';
    },
    isFinite: function(obj) {
      return isFinite(obj) && !isNaN(parseFloat(obj));
    },
    isNaN: function(obj) {
      return _.isNumber(obj) && obj !== +obj;
    },
    isBoolean: function(obj) {
      return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    },
    isNull: function(obj) {
      return obj === null;
    },
    isUndefined: function(obj) {
      return obj === void 0;
    },
    isEmpty: function(obj) {
      if (obj == null) return true;
      if (isArrayLike && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
      return _.keys(obj).length === 0;
    },
    isElement: function(obj) {
      return !!(obj && obj.nodeType === 1);
    },
    isArray: Array.isArray || function(obj) {
      return toString.call(obj) === '[object Array]';
    },
    isObject: function(obj) {
      var type = typeof obj;
      return type === 'function' || type === 'object' && !!obj;
    },
    toArray: function(obj) {
      if (!obj) {
        return [];
      }
      if (_.isArray(obj)) {
        return slice.call(obj);
      }
      if (isArrayLike(obj)) {
        return _.map(obj, _.identity);
      }
      return _.values(obj);
    },
    range: function(start, stop, step) {
      if (stop == null) {
        stop = start || 0;
        start = 0;
      }
      step = step || 1;

      var length = Math.max(Math.ceil((stop - start) / step), 0);
      var range = Array(length);

      for (var idx = 0; idx < length; idx++, start += step) {
        range[idx] = start;
      }

      return range;
    },
    indexOf: function(list, item) {
      if (!!_.natural.indexOf) {
        return _.natural.indexOf.call(list, item);
      }
      for (var i = 0; i < list.length; i++) {
        if (list[i] === item) {
          return i;
        }
      }
      return -1;
    },
    has: function(obj, key) {
      return obj != null && hasOwnProperty.call(obj, key);
    },
    bind: function(func, ctx) {
      var natural = _.natural.bind;
      if (natural && func.bind === natural) {
        return natural.apply(func, slice.call(arguments, 1));
      }
      var args = slice.call(arguments, 2);
      return function() {
        func.apply(ctx, args);
      };
    },
    extend: function(base) {
      var sources = slice.call(arguments, 1);
      for (var i = 0; i < sources.length; i++) {
        var obj = sources[i];
        for (var k in obj) {
          base[k] = obj[k];
        }
      }
      return base;
    },
    defaults: function(base) {
      var sources = slice.call(arguments, 1);
      for (var i = 0; i < sources.length; i++) {
        var obj = sources[i];
        for (var k in obj) {
          if (base[k] === void 0) {
            base[k] = obj[k];
          }
        }
      }
      return base;
    },
    keys: function(obj) {
      if (!_.isObject(obj)) {
        return [];
      }
      if (_.natural.keys) {
        return _.natural.keys(obj);
      }
      var keys = [];
      for (var k in obj) {
        if (_.has(obj, k)) {
          keys.push(k);
        }
      }
      return keys;
    },
    values: function(obj) {
      var keys = _.keys(obj);
      var values = [];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        values.push(obj[k]);
      }
      return values;
    },
    each: function(obj, iteratee, context) {
      var ctx = context || this;
      var keys = !isArrayLike(obj) && _.keys(obj);
      var length = (keys || obj).length;
      for (var i = 0; i < length; i++) {
        var k = keys ? keys[i] : i;
        iteratee.call(ctx, obj[k], k, obj);
      }
      return obj;
    },
    map: function(obj, iteratee, context) {
      var ctx = context || this;
      var keys = !isArrayLike(obj) && _.keys(obj);
      var length = (keys || obj).length;
      var result = [];
      for (var i = 0; i < length; i++) {
        var k = keys ? keys[i] : i;
        result[i] = iteratee.call(ctx, obj[k], k, obj);
      }
      return result;
    },
    once: function(func) {
      var init = false;
      return function() {
        if (!!init) {
          return func;
        }
        init = true;
        return func.apply(this, arguments);
      }
    },
    after: function(times, func) {
      return function() {
        while (--times < 1) {
          return func.apply(this, arguments);
        }
      }
    },
    uniqueId: function(prefix) {
      var id = ++_._indexAmount + '';
      return prefix ? prefix + id : id;
    }
  };

  /**
   * Constants
   */

  var sin = Math.sin,
    cos = Math.cos,
    atan2 = Math.atan2,
    sqrt = Math.sqrt,
    round = Math.round,
    abs = Math.abs,
    PI = Math.PI,
    TWO_PI = PI * 2,
    HALF_PI = PI / 2,
    pow = Math.pow,
    min = Math.min,
    max = Math.max;

  /**
   * Localized variables
   */

  var count = 0;
  var slice = _.natural.slice;
  var perf = ((root.performance && root.performance.now) ? root.performance : Date);
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = function(obj) {
    return obj == null ? void 0 : obj['length'];
  };
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  /**
   * Cross browser dom events.
   */
  var dom = {

    temp: (root.document ? root.document.createElement('div') : {}),

    hasEventListeners: _.isFunction(root.addEventListener),

    bind: function(elem, event, func, bool) {
      if (this.hasEventListeners) {
        elem.addEventListener(event, func, !!bool);
      } else {
        elem.attachEvent('on' + event, func);
      }
      return dom;
    },

    unbind: function(elem, event, func, bool) {
      if (dom.hasEventListeners) {
        elem.removeEventListeners(event, func, !!bool);
      } else {
        elem.detachEvent('on' + event, func);
      }
      return dom;
    },

    getRequestAnimationFrame: function() {

      var lastTime = 0;
      var vendors = ['ms', 'moz', 'webkit', 'o'];
      var request = root.requestAnimationFrame, cancel;

      if(!request) {
        for (var i = 0; i < vendors.length; i++) {
          request = root[vendors[i] + 'RequestAnimationFrame'] || request;
          cancel = root[vendors[i] + 'CancelAnimationFrame']
            || root[vendors[i] + 'CancelRequestAnimationFrame'] || cancel;
        }

        request = request || function(callback, element) {
          var currTime = new Date().getTime();
          var timeToCall = Math.max(0, 16 - (currTime - lastTime));
          var id = root.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
          lastTime = currTime + timeToCall;
          return id;
        };
        // cancel = cancel || function(id) {
        //   clearTimeout(id);
        // };
      }

      request.init = _.once(loop);

      return request;

    }

  };

  /**
   * @class
   */
  var Two = root.Two = function(options) {

    // Determine what Renderer to use and setup a scene.

    var params = _.defaults(options || {}, {
      fullscreen: false,
      width: 640,
      height: 480,
      type: Two.Types.svg,
      autostart: false
    });

    _.each(params, function(v, k) {
      if (k === 'fullscreen' || k === 'autostart') {
        return;
      }
      this[k] = v;
    }, this);

    // Specified domElement overrides type declaration only if the element does not support declared renderer type.
    if (_.isElement(params.domElement)) {
      var tagName = params.domElement.tagName.toLowerCase();
      // TODO: Reconsider this if statement's logic.
      if (!/^(CanvasRenderer-canvas|WebGLRenderer-canvas|SVGRenderer-svg)$/.test(this.type+'-'+tagName)) {
        this.type = Two.Types[tagName];
      }
    }

    this.renderer = new Two[this.type](this);
    Two.Utils.setPlaying.call(this, params.autostart);
    this.frameCount = 0;

    if (params.fullscreen) {

      var fitted = _.bind(fitToWindow, this);
      _.extend(document.body.style, {
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed'
      });
      _.extend(this.renderer.domElement.style, {
        display: 'block',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed'
      });
      dom.bind(root, 'resize', fitted);
      fitted();


    } else if (!_.isElement(params.domElement)) {

      this.renderer.setSize(params.width, params.height, this.ratio);
      this.width = params.width;
      this.height = params.height;

    }

    this.scene = this.renderer.scene;

    Two.Instances.push(this);
    raf.init();

  };

  _.extend(Two, {

    /**
     * Access to root in other files.
     */

    root: root,

    /**
     * Primitive
     */

    Array: root.Float32Array || Array,

    Types: {
      webgl: 'WebGLRenderer',
      svg: 'SVGRenderer',
      canvas: 'CanvasRenderer'
    },

    Version: 'v0.7.0-alpha.1',

    Identifier: 'two_',

    Properties: {
      hierarchy: 'hierarchy',
      demotion: 'demotion'
    },

    Events: {
      play: 'play',
      pause: 'pause',
      update: 'update',
      render: 'render',
      resize: 'resize',
      change: 'change',
      remove: 'remove',
      insert: 'insert',
      order: 'order',
      load: 'load'
    },

    Commands: {
      move: 'M',
      line: 'L',
      curve: 'C',
      close: 'Z'
    },

    Resolution: 8,

    Instances: [],

    noConflict: function() {
      root.Two = previousTwo;
      return this;
    },

    uniqueId: function() {
      var id = count;
      count++;
      return id;
    },

    Utils: _.extend(_, {

      performance: perf,

      defineProperty: function(property) {

        var object = this;
        var secret = '_' + property;
        var flag = '_flag' + property.charAt(0).toUpperCase() + property.slice(1);

        Object.defineProperty(object, property, {
          enumerable: true,
          get: function() {
            return this[secret];
          },
          set: function(v) {
            this[secret] = v;
            this[flag] = true;
          }
        });

      },

      /**
       * Release an arbitrary class' events from the two.js corpus and recurse
       * through its children and or vertices.
       */
      release: function(obj) {

        if (!_.isObject(obj)) {
          return;
        }

        if (_.isFunction(obj.unbind)) {
          obj.unbind();
        }

        if (obj.vertices) {
          if (_.isFunction(obj.vertices.unbind)) {
            obj.vertices.unbind();
          }
          _.each(obj.vertices, function(v) {
            if (_.isFunction(v.unbind)) {
              v.unbind();
            }
          });
        }

        if (obj.children) {
          _.each(obj.children, function(obj) {
            Two.Utils.release(obj);
          });
        }

      },

      xhr: function(path, callback) {

        var xhr = new XMLHttpRequest();
        xhr.open('GET', path);

        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
          }
        };

        xhr.send();
        return xhr;

      },

      Curve: {

        CollinearityEpsilon: pow(10, -30),

        RecursionLimit: 16,

        CuspLimit: 0,

        Tolerance: {
          distance: 0.25,
          angle: 0,
          epsilon: 0.01
        },

        // Lookup tables for abscissas and weights with values for n = 2 .. 16.
        // As values are symmetric, only store half of them and adapt algorithm
        // to factor in symmetry.
        abscissas: [
          [  0.5773502691896257645091488],
          [0,0.7745966692414833770358531],
          [  0.3399810435848562648026658,0.8611363115940525752239465],
          [0,0.5384693101056830910363144,0.9061798459386639927976269],
          [  0.2386191860831969086305017,0.6612093864662645136613996,0.9324695142031520278123016],
          [0,0.4058451513773971669066064,0.7415311855993944398638648,0.9491079123427585245261897],
          [  0.1834346424956498049394761,0.5255324099163289858177390,0.7966664774136267395915539,0.9602898564975362316835609],
          [0,0.3242534234038089290385380,0.6133714327005903973087020,0.8360311073266357942994298,0.9681602395076260898355762],
          [  0.1488743389816312108848260,0.4333953941292471907992659,0.6794095682990244062343274,0.8650633666889845107320967,0.9739065285171717200779640],
          [0,0.2695431559523449723315320,0.5190961292068118159257257,0.7301520055740493240934163,0.8870625997680952990751578,0.9782286581460569928039380],
          [  0.1252334085114689154724414,0.3678314989981801937526915,0.5873179542866174472967024,0.7699026741943046870368938,0.9041172563704748566784659,0.9815606342467192506905491],
          [0,0.2304583159551347940655281,0.4484927510364468528779129,0.6423493394403402206439846,0.8015780907333099127942065,0.9175983992229779652065478,0.9841830547185881494728294],
          [  0.1080549487073436620662447,0.3191123689278897604356718,0.5152486363581540919652907,0.6872929048116854701480198,0.8272013150697649931897947,0.9284348836635735173363911,0.9862838086968123388415973],
          [0,0.2011940939974345223006283,0.3941513470775633698972074,0.5709721726085388475372267,0.7244177313601700474161861,0.8482065834104272162006483,0.9372733924007059043077589,0.9879925180204854284895657],
          [  0.0950125098376374401853193,0.2816035507792589132304605,0.4580167776572273863424194,0.6178762444026437484466718,0.7554044083550030338951012,0.8656312023878317438804679,0.9445750230732325760779884,0.9894009349916499325961542]
        ],

        weights: [
          [1],
          [0.8888888888888888888888889,0.5555555555555555555555556],
          [0.6521451548625461426269361,0.3478548451374538573730639],
          [0.5688888888888888888888889,0.4786286704993664680412915,0.2369268850561890875142640],
          [0.4679139345726910473898703,0.3607615730481386075698335,0.1713244923791703450402961],
          [0.4179591836734693877551020,0.3818300505051189449503698,0.2797053914892766679014678,0.1294849661688696932706114],
          [0.3626837833783619829651504,0.3137066458778872873379622,0.2223810344533744705443560,0.1012285362903762591525314],
          [0.3302393550012597631645251,0.3123470770400028400686304,0.2606106964029354623187429,0.1806481606948574040584720,0.0812743883615744119718922],
          [0.2955242247147528701738930,0.2692667193099963550912269,0.2190863625159820439955349,0.1494513491505805931457763,0.0666713443086881375935688],
          [0.2729250867779006307144835,0.2628045445102466621806889,0.2331937645919904799185237,0.1862902109277342514260976,0.1255803694649046246346943,0.0556685671161736664827537],
          [0.2491470458134027850005624,0.2334925365383548087608499,0.2031674267230659217490645,0.1600783285433462263346525,0.1069393259953184309602547,0.0471753363865118271946160],
          [0.2325515532308739101945895,0.2262831802628972384120902,0.2078160475368885023125232,0.1781459807619457382800467,0.1388735102197872384636018,0.0921214998377284479144218,0.0404840047653158795200216],
          [0.2152638534631577901958764,0.2051984637212956039659241,0.1855383974779378137417166,0.1572031671581935345696019,0.1215185706879031846894148,0.0801580871597602098056333,0.0351194603317518630318329],
          [0.2025782419255612728806202,0.1984314853271115764561183,0.1861610000155622110268006,0.1662692058169939335532009,0.1395706779261543144478048,0.1071592204671719350118695,0.0703660474881081247092674,0.0307532419961172683546284],
          [0.1894506104550684962853967,0.1826034150449235888667637,0.1691565193950025381893121,0.1495959888165767320815017,0.1246289712555338720524763,0.0951585116824927848099251,0.0622535239386478928628438,0.0271524594117540948517806]
        ]

      },

      /**
       * Account for high dpi rendering.
       * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
       */

      devicePixelRatio: root.devicePixelRatio || 1,

      getBackingStoreRatio: function(ctx) {
        return ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio || 1;
      },

      getRatio: function(ctx) {
        return Two.Utils.devicePixelRatio / getBackingStoreRatio(ctx);
      },

      /**
       * Properly defer play calling until after all objects
       * have been updated with their newest styles.
       */
      setPlaying: function(b) {

        this.playing = !!b;
        return this;

      },

      /**
       * Return the computed matrix of a nested object.
       * TODO: Optimize traversal.
       */
      getComputedMatrix: function(object, matrix) {

        matrix = (matrix && matrix.identity()) || new Two.Matrix();
        var parent = object, matrices = [];

        while (parent && parent._matrix) {
          matrices.push(parent._matrix);
          parent = parent.parent;
        }

        matrices.reverse();

        _.each(matrices, function(m) {

          var e = m.elements;
          matrix.multiply(
            e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], e[9]);

        });

        return matrix;

      },

      deltaTransformPoint: function(matrix, x, y) {

        var dx = x * matrix.a + y * matrix.c + 0;
        var dy = x * matrix.b + y * matrix.d + 0;

        return new Two.Vector(dx, dy);

      },

      /**
       * https://gist.github.com/2052247
       */
      decomposeMatrix: function(matrix) {

        // calculate delta transform point
        var px = Two.Utils.deltaTransformPoint(matrix, 0, 1);
        var py = Two.Utils.deltaTransformPoint(matrix, 1, 0);

        // calculate skew
        var skewX = ((180 / Math.PI) * Math.atan2(px.y, px.x) - 90);
        var skewY = ((180 / Math.PI) * Math.atan2(py.y, py.x));

        return {
            translateX: matrix.e,
            translateY: matrix.f,
            scaleX: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b),
            scaleY: Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d),
            skewX: skewX,
            skewY: skewY,
            rotation: skewX // rotation is the same as skew x
        };

      },

      /**
       * Walk through item properties and pick the ones of interest.
       * Will try to resolve styles applied via CSS
       *
       * TODO: Reverse calculate `Two.Gradient`s for fill / stroke
       * of any given path.
       */
      applySvgAttributes: function(node, elem) {

        var attributes = {}, styles = {}, i, key, value, attr;

        // Not available in non browser environments
        if (getComputedStyle) {
          // Convert CSSStyleDeclaration to a normal object
          var computedStyles = getComputedStyle(node);
          i = computedStyles.length;

          while (i--) {
            key = computedStyles[i];
            value = computedStyles[key];
            // Gecko returns undefined for unset properties
            // Webkit returns the default value
            if (value !== undefined) {
              styles[key] = value;
            }
          }
        }

        // Convert NodeMap to a normal object
        i = node.attributes.length;
        while (i--) {
          attr = node.attributes[i];
          attributes[attr.nodeName] = attr.value;
        }

        // Getting the correct opacity is a bit tricky, since SVG path elements don't
        // support opacity as an attribute, but you can apply it via CSS.
        // So we take the opacity and set (stroke/fill)-opacity to the same value.
        if (!_.isUndefined(styles.opacity)) {
          styles['stroke-opacity'] = styles.opacity;
          styles['fill-opacity'] = styles.opacity;
        }

        // Merge attributes and applied styles (attributes take precedence)
        _.extend(styles, attributes);

        // Similarly visibility is influenced by the value of both display and visibility.
        // Calculate a unified value here which defaults to `true`.
        styles.visible = !(_.isUndefined(styles.display) && styles.display === 'none')
          || (_.isUndefined(styles.visibility) && styles.visibility === 'hidden');

        // Now iterate the whole thing
        for (key in styles) {
          value = styles[key];

          switch (key) {
            case 'transform':
              // TODO: Check this out https://github.com/paperjs/paper.js/blob/master/src/svg/SVGImport.js#L313
              if (value === 'none') break;
              var m = node.getCTM ? node.getCTM() : null;

              // Might happen when transform string is empty or not valid.
              if (m === null) break;

              // // Option 1: edit the underlying matrix and don't force an auto calc.
              // var m = node.getCTM();
              // elem._matrix.manual = true;
              // elem._matrix.set(m.a, m.b, m.c, m.d, m.e, m.f);

              // Option 2: Decompose and infer Two.js related properties.
              var transforms = Two.Utils.decomposeMatrix(node.getCTM());

              elem.translation.set(transforms.translateX, transforms.translateY);
              elem.rotation = transforms.rotation;
              // Warning: Two.js elements only support uniform scalars...
              elem.scale = transforms.scaleX;

              var x = parseFloat((styles.x + '').replace('px'));
              var y = parseFloat((styles.y + '').replace('px'));

              // Override based on attributes.
              if (x) {
                elem.translation.x = x;
              }

              if (y) {
                elem.translation.y = y;
              }

              break;
            case 'visible':
              elem.visible = value;
              break;
            case 'stroke-linecap':
              elem.cap = value;
              break;
            case 'stroke-linejoin':
              elem.join = value;
              break;
            case 'stroke-miterlimit':
              elem.miter = value;
              break;
            case 'stroke-width':
              elem.linewidth = parseFloat(value);
              break;
            case 'stroke-opacity':
            case 'fill-opacity':
            case 'opacity':
              elem.opacity = parseFloat(value);
              break;
            case 'fill':
            case 'stroke':
              if (/url\(\#.*\)/i.test(value)) {
                elem[key] = this.getById(
                  value.replace(/url\(\#(.*)\)/i, '$1'));
              } else {
                elem[key] = (value === 'none') ? 'transparent' : value;
              }
              break;
            case 'id':
              elem.id = value;
              break;
            case 'class':
              elem.classList = value.split(' ');
              break;
          }
        }

        return elem;

      },

      /**
       * Read any number of SVG node types and create Two equivalents of them.
       */
      read: {

        svg: function() {
          return Two.Utils.read.g.apply(this, arguments);
        },

        g: function(node) {

          var group = new Two.Group();

          // Switched up order to inherit more specific styles
          Two.Utils.applySvgAttributes.call(this, node, group);

          for (var i = 0, l = node.childNodes.length; i < l; i++) {
            var n = node.childNodes[i];
            var tag = n.nodeName;
            if (!tag) return;

            var tagName = tag.replace(/svg\:/ig, '').toLowerCase();

            if (tagName in Two.Utils.read) {
              var o = Two.Utils.read[tagName].call(group, n);
              group.add(o);
            }
          }

          return group;

        },

        polygon: function(node, open) {

          var points = node.getAttribute('points');

          var verts = [];
          points.replace(/(-?[\d\.?]+)[,|\s](-?[\d\.?]+)/g, function(match, p1, p2) {
            verts.push(new Two.Anchor(parseFloat(p1), parseFloat(p2)));
          });

          var poly = new Two.Path(verts, !open).noStroke();
          poly.fill = 'black';

          return Two.Utils.applySvgAttributes.call(this, node, poly);

        },

        polyline: function(node) {
          return Two.Utils.read.polygon.call(this, node, true);
        },

        path: function(node) {

          var path = node.getAttribute('d');

          // Create a Two.Path from the paths.

          var coord = new Two.Anchor();
          var control, coords;
          var closed = false, relative = false;
          var commands = path.match(/[a-df-z][^a-df-z]*/ig);
          var last = commands.length - 1;

          // Split up polybeziers

          _.each(commands.slice(0), function(command, i) {

            var type = command[0];
            var lower = type.toLowerCase();
            var items = command.slice(1).trim().split(/[\s,]+|(?=\s?[+\-])/);
            var pre, post, result = [], bin;

            if (i <= 0) {
              commands = [];
            }

            switch (lower) {
              case 'h':
              case 'v':
                if (items.length > 1) {
                  bin = 1;
                }
                break;
              case 'm':
              case 'l':
              case 't':
                if (items.length > 2) {
                  bin = 2;
                }
                break;
              case 's':
              case 'q':
                if (items.length > 4) {
                  bin = 4;
                }
                break;
              case 'c':
                if (items.length > 6) {
                  bin = 6;
                }
                break;
              case 'a':
                // TODO: Handle Ellipses
                break;
            }

            if (bin) {

              for (var j = 0, l = items.length, times = 0; j < l; j+=bin) {

                var ct = type;
                if (times > 0) {

                  switch (type) {
                    case 'm':
                      ct = 'l';
                      break;
                    case 'M':
                      ct = 'L';
                      break;
                  }

                }

                result.push([ct].concat(items.slice(j, j + bin)).join(' '));
                times++;

              }

              commands = Array.prototype.concat.apply(commands, result);

            } else {

              commands.push(command);

            }

          });

          // Create the vertices for our Two.Path

          var points = [];
          _.each(commands, function(command, i) {

            var result, x, y;
            var type = command[0];
            var lower = type.toLowerCase();

            coords = command.slice(1).trim();
            coords = coords.replace(/(-?\d+(?:\.\d*)?)[eE]([+\-]?\d+)/g, function(match, n1, n2) {
              return parseFloat(n1) * pow(10, n2);
            });
            coords = coords.split(/[\s,]+|(?=\s?[+\-])/);
            relative = type === lower;

            var x1, y1, x2, y2, x3, y3, x4, y4, reflection;

            switch (lower) {

              case 'z':
                if (i >= last) {
                  closed = true;
                } else {
                  x = coord.x;
                  y = coord.y;
                  result = new Two.Anchor(
                    x, y,
                    undefined, undefined,
                    undefined, undefined,
                    Two.Commands.close
                  );
                }
                break;

              case 'm':
              case 'l':

                x = parseFloat(coords[0]);
                y = parseFloat(coords[1]);

                result = new Two.Anchor(
                  x, y,
                  undefined, undefined,
                  undefined, undefined,
                  lower === 'm' ? Two.Commands.move : Two.Commands.line
                );

                if (relative) {
                  result.addSelf(coord);
                }

                // result.controls.left.copy(result);
                // result.controls.right.copy(result);

                coord = result;
                break;

              case 'h':
              case 'v':

                var a = lower === 'h' ? 'x' : 'y';
                var b = a === 'x' ? 'y' : 'x';

                result = new Two.Anchor(
                  undefined, undefined,
                  undefined, undefined,
                  undefined, undefined,
                  Two.Commands.line
                );
                result[a] = parseFloat(coords[0]);
                result[b] = coord[b];

                if (relative) {
                  result[a] += coord[a];
                }

                // result.controls.left.copy(result);
                // result.controls.right.copy(result);

                coord = result;
                break;

              case 'c':
              case 's':

                x1 = coord.x;
                y1 = coord.y;

                if (!control) {
                  control = new Two.Vector();//.copy(coord);
                }

                if (lower === 'c') {

                  x2 = parseFloat(coords[0]);
                  y2 = parseFloat(coords[1]);
                  x3 = parseFloat(coords[2]);
                  y3 = parseFloat(coords[3]);
                  x4 = parseFloat(coords[4]);
                  y4 = parseFloat(coords[5]);

                } else {

                  // Calculate reflection control point for proper x2, y2
                  // inclusion.

                  reflection = getReflection(coord, control, relative);

                  x2 = reflection.x;
                  y2 = reflection.y;
                  x3 = parseFloat(coords[0]);
                  y3 = parseFloat(coords[1]);
                  x4 = parseFloat(coords[2]);
                  y4 = parseFloat(coords[3]);

                }

                if (relative) {
                  x2 += x1;
                  y2 += y1;
                  x3 += x1;
                  y3 += y1;
                  x4 += x1;
                  y4 += y1;
                }

                if (!_.isObject(coord.controls)) {
                  Two.Anchor.AppendCurveProperties(coord);
                }

                coord.controls.right.set(x2 - coord.x, y2 - coord.y);
                result = new Two.Anchor(
                  x4, y4,
                  x3 - x4, y3 - y4,
                  undefined, undefined,
                  Two.Commands.curve
                );

                coord = result;
                control = result.controls.left;

                break;

              case 't':
              case 'q':

                x1 = coord.x;
                y1 = coord.y;

                if (!control) {
                  control = new Two.Vector();//.copy(coord);
                }

                if (control.isZero()) {
                  x2 = x1;
                  y2 = y1;
                } else {
                  x2 = control.x;
                  y1 = control.y;
                }

                if (lower === 'q') {

                  x3 = parseFloat(coords[0]);
                  y3 = parseFloat(coords[1]);
                  x4 = parseFloat(coords[1]);
                  y4 = parseFloat(coords[2]);

                } else {

                  reflection = getReflection(coord, control, relative);

                  x3 = reflection.x;
                  y3 = reflection.y;
                  x4 = parseFloat(coords[0]);
                  y4 = parseFloat(coords[1]);

                }

                if (relative) {
                  x2 += x1;
                  y2 += y1;
                  x3 += x1;
                  y3 += y1;
                  x4 += x1;
                  y4 += y1;
                }

                if (!_.isObject(coord.controls)) {
                  Two.Anchor.AppendCurveProperties(coord);
                }

                coord.controls.right.set(x2 - coord.x, y2 - coord.y);
                result = new Two.Anchor(
                  x4, y4,
                  x3 - x4, y3 - y4,
                  undefined, undefined,
                  Two.Commands.curve
                );

                coord = result;
                control = result.controls.left;

                break;

              case 'a':

                // throw new Two.Utils.Error('not yet able to interpret Elliptical Arcs.');
                x1 = coord.x;
                y1 = coord.y;

                var rx = parseFloat(coords[0]);
                var ry = parseFloat(coords[1]);
                var xAxisRotation = parseFloat(coords[2]) * Math.PI / 180;
                var largeArcFlag = parseFloat(coords[3]);
                var sweepFlag = parseFloat(coords[4]);

                x4 = parseFloat(coords[5]);
                y4 = parseFloat(coords[6]);

                if (relative) {
                  x4 += x1;
                  y4 += y1;
                }

                // http://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter

                // Calculate midpoint mx my
                var mx = (x4 - x1) / 2;
                var my = (y4 - y1) / 2;

                // Calculate x1' y1' F.6.5.1
                var _x = mx * Math.cos(xAxisRotation) + my * Math.sin(xAxisRotation);
                var _y = - mx * Math.sin(xAxisRotation) + my * Math.cos(xAxisRotation);

                var rx2 = rx * rx;
                var ry2 = ry * ry;
                var _x2 = _x * _x;
                var _y2 = _y * _y;

                // adjust radii
                var l = _x2 / rx2 + _y2 / ry2;
                if (l > 1) {
                  rx *= Math.sqrt(l);
                  ry *= Math.sqrt(l);
                }

                var amp = Math.sqrt((rx2 * ry2 - rx2 * _y2 - ry2 * _x2) / (rx2 * _y2 + ry2 * _x2));

                if (_.isNaN(amp)) {
                  amp = 0;
                } else if (largeArcFlag != sweepFlag && amp > 0) {
                  amp *= -1;
                }

                // Calculate cx' cy' F.6.5.2
                var _cx = amp * rx * _y / ry;
                var _cy = - amp * ry * _x / rx;

                // Calculate cx cy F.6.5.3
                var cx = _cx * Math.cos(xAxisRotation) - _cy * Math.sin(xAxisRotation) + (x1 + x4) / 2;
                var cy = _cx * Math.sin(xAxisRotation) + _cy * Math.cos(xAxisRotation) + (y1 + y4) / 2;

                // vector magnitude
                var m = function(v) { return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2)); }
                // ratio between two vectors
                var r = function(u, v) { return (u[0] * v[0] + u[1] * v[1]) / (m(u) * m(v)) }
                // angle between two vectors
                var a = function(u, v) { return (u[0] * v[1] < u[1] * v[0] ? - 1 : 1) * Math.acos(r(u,v)); }

                // Calculate theta1 and delta theta F.6.5.4 + F.6.5.5
                var t1 = a([1, 0], [(_x - _cx) / rx, (_y - _cy) / ry]);
                var u = [(_x - _cx) / rx, (_y - _cy) / ry];
                var v = [( - _x - _cx) / rx, ( - _y - _cy) / ry];
                var dt = a(u, v);

                if (r(u, v) <= -1) dt = Math.PI;
                if (r(u, v) >= 1) dt = 0;

                // F.6.5.6
                if (largeArcFlag)  {
                  dt = mod(dt, Math.PI * 2);
                }

                if (sweepFlag && dt > 0) {
                  dt -= Math.PI * 2;
                }

                var length = Two.Resolution;

                // Save a projection of our rotation and translation to apply
                // to the set of points.
                var projection = new Two.Matrix()
                  .translate(cx, cy)
                  .rotate(xAxisRotation);

                // Create a resulting array of Two.Anchor's to export to the
                // the path.
                result = _.map(_.range(length), function(i) {
                  var pct = 1 - (i / (length - 1));
                  var theta = pct * dt + t1;
                  var x = rx * Math.cos(theta);
                  var y = ry * Math.sin(theta);
                  var projected = projection.multiply(x, y, 1);
                  return new Two.Anchor(projected.x, projected.y, false, false, false, false, Two.Commands.line);;
                });

                result.push(new Two.Anchor(x4, y4, false, false, false, false, Two.Commands.line));

                coord = result[result.length - 1];
                control = coord.controls.left;

                break;

            }

            if (result) {
              if (_.isArray(result)) {
                points = points.concat(result);
              } else {
                points.push(result);
              }
            }

          });

          if (points.length <= 1) {
            return;
          }

          var path = new Two.Path(points, closed, undefined, true).noStroke();
          path.fill = 'black';

          var rect = path.getBoundingClientRect(true);

          // Center objects to stay consistent
          // with the rest of the Two.js API.
          rect.centroid = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };

          _.each(path.vertices, function(v) {
            v.subSelf(rect.centroid);
          });

          path.translation.addSelf(rect.centroid);

          return Two.Utils.applySvgAttributes.call(this, node, path);

        },

        circle: function(node) {

          var x = parseFloat(node.getAttribute('cx'));
          var y = parseFloat(node.getAttribute('cy'));
          var r = parseFloat(node.getAttribute('r'));

          var circle = new Two.Circle(x, y, r).noStroke();
          circle.fill = 'black';

          return Two.Utils.applySvgAttributes.call(this, node, circle);

        },

        ellipse: function(node) {

          var x = parseFloat(node.getAttribute('cx'));
          var y = parseFloat(node.getAttribute('cy'));
          var width = parseFloat(node.getAttribute('rx'));
          var height = parseFloat(node.getAttribute('ry'));

          var ellipse = new Two.Ellipse(x, y, width, height).noStroke();
          ellipse.fill = 'black';

          return Two.Utils.applySvgAttributes.call(this, node, ellipse);

        },

        rect: function(node) {

          var x = parseFloat(node.getAttribute('x')) || 0;
          var y = parseFloat(node.getAttribute('y')) || 0;
          var width = parseFloat(node.getAttribute('width'));
          var height = parseFloat(node.getAttribute('height'));

          var w2 = width / 2;
          var h2 = height / 2;

          var rect = new Two.Rectangle(x + w2, y + h2, width, height)
            .noStroke();
          rect.fill = 'black';

          return Two.Utils.applySvgAttributes.call(this, node, rect);

        },

        line: function(node) {

          var x1 = parseFloat(node.getAttribute('x1'));
          var y1 = parseFloat(node.getAttribute('y1'));
          var x2 = parseFloat(node.getAttribute('x2'));
          var y2 = parseFloat(node.getAttribute('y2'));

          var line = new Two.Line(x1, y1, x2, y2).noFill();

          return Two.Utils.applySvgAttributes.call(this, node, line);

        },

        lineargradient: function(node) {

          var x1 = parseFloat(node.getAttribute('x1'));
          var y1 = parseFloat(node.getAttribute('y1'));
          var x2 = parseFloat(node.getAttribute('x2'));
          var y2 = parseFloat(node.getAttribute('y2'));

          var ox = (x2 + x1) / 2;
          var oy = (y2 + y1) / 2;

          var stops = [];
          for (var i = 0; i < node.children.length; i++) {

            var child = node.children[i];

            var offset = parseFloat(child.getAttribute('offset'));
            var color = child.getAttribute('stop-color');
            var opacity = child.getAttribute('stop-opacity');
            var style = child.getAttribute('style');

            if (_.isNull(color)) {
              var matches = style ? style.match(/stop\-color\:\s?([\#a-fA-F0-9]*)/) : false;
              color = matches && matches.length > 1 ? matches[1] : undefined;
            }

            if (_.isNull(opacity)) {
              var matches = style ? style.match(/stop\-opacity\:\s?([0-9\.\-]*)/) : false;
              opacity = matches && matches.length > 1 ? parseFloat(matches[1]) : 1;
            }

            stops.push(new Two.Gradient.Stop(offset, color, opacity));

          }

          var gradient = new Two.LinearGradient(x1 - ox, y1 - oy, x2 - ox,
            y2 - oy, stops);

          return Two.Utils.applySvgAttributes.call(this, node, gradient);

        },

        radialgradient: function(node) {

          var cx = parseFloat(node.getAttribute('cx')) || 0;
          var cy = parseFloat(node.getAttribute('cy')) || 0;
          var r = parseFloat(node.getAttribute('r'));

          var fx = parseFloat(node.getAttribute('fx'));
          var fy = parseFloat(node.getAttribute('fy'));

          if (_.isNaN(fx)) {
            fx = cx;
          }

          if (_.isNaN(fy)) {
            fy = cy;
          }

          var ox = Math.abs(cx + fx) / 2;
          var oy = Math.abs(cy + fy) / 2;

          var stops = [];
          for (var i = 0; i < node.children.length; i++) {

            var child = node.children[i];

            var offset = parseFloat(child.getAttribute('offset'));
            var color = child.getAttribute('stop-color');
            var opacity = child.getAttribute('stop-opacity');
            var style = child.getAttribute('style');

            if (_.isNull(color)) {
              var matches = style ? style.match(/stop\-color\:\s?([\#a-fA-F0-9]*)/) : false;
              color = matches && matches.length > 1 ? matches[1] : undefined;
            }

            if (_.isNull(opacity)) {
              var matches = style ? style.match(/stop\-opacity\:\s?([0-9\.\-]*)/) : false;
              opacity = matches && matches.length > 1 ? parseFloat(matches[1]) : 1;
            }

            stops.push(new Two.Gradient.Stop(offset, color, opacity));

          }

          var gradient = new Two.RadialGradient(cx - ox, cy - oy, r,
            stops, fx - ox, fy - oy);

          return Two.Utils.applySvgAttributes.call(this, node, gradient);

        }

      },

      /**
       * Given 2 points (a, b) and corresponding control point for each
       * return an array of points that represent points plotted along
       * the curve. Number points determined by limit.
       */
      subdivide: function(x1, y1, x2, y2, x3, y3, x4, y4, limit) {

        limit = limit || Two.Utils.Curve.RecursionLimit;
        var amount = limit + 1;

        // TODO: Issue 73
        // Don't recurse if the end points are identical
        if (x1 === x4 && y1 === y4) {
          return [new Two.Anchor(x4, y4)];
        }

        return _.map(_.range(0, amount), function(i) {

          var t = i / amount;
          var x = getPointOnCubicBezier(t, x1, x2, x3, x4);
          var y = getPointOnCubicBezier(t, y1, y2, y3, y4);

          return new Two.Anchor(x, y);

        });

      },

      getPointOnCubicBezier: function(t, a, b, c, d) {
        var k = 1 - t;
        return (k * k * k * a) + (3 * k * k * t * b) + (3 * k * t * t * c) +
           (t * t * t * d);
      },

      /**
       * Given 2 points (a, b) and corresponding control point for each
       * return a float that represents the length of the curve using
       * Gauss-Legendre algorithm. Limit iterations of calculation by `limit`.
       */
      getCurveLength: function(x1, y1, x2, y2, x3, y3, x4, y4, limit) {

        // TODO: Better / fuzzier equality check
        // Linear calculation
        if (x1 === x2 && y1 === y2 && x3 === x4 && y3 === y4) {
          var dx = x4 - x1;
          var dy = y4 - y1;
          return sqrt(dx * dx + dy * dy);
        }

        // Calculate the coefficients of a Bezier derivative.
        var ax = 9 * (x2 - x3) + 3 * (x4 - x1),
          bx = 6 * (x1 + x3) - 12 * x2,
          cx = 3 * (x2 - x1),

          ay = 9 * (y2 - y3) + 3 * (y4 - y1),
          by = 6 * (y1 + y3) - 12 * y2,
          cy = 3 * (y2 - y1);

        var integrand = function(t) {
          // Calculate quadratic equations of derivatives for x and y
          var dx = (ax * t + bx) * t + cx,
            dy = (ay * t + by) * t + cy;
          return sqrt(dx * dx + dy * dy);
        };

        return integrate(
          integrand, 0, 1, limit || Two.Utils.Curve.RecursionLimit
        );

      },

      /**
       * Integration for `getCurveLength` calculations. Referenced from
       * Paper.js: https://github.com/paperjs/paper.js/blob/master/src/util/Numerical.js#L101
       */
      integrate: function(f, a, b, n) {
        var x = Two.Utils.Curve.abscissas[n - 2],
          w = Two.Utils.Curve.weights[n - 2],
          A = 0.5 * (b - a),
          B = A + a,
          i = 0,
          m = (n + 1) >> 1,
          sum = n & 1 ? w[i++] * f(B) : 0; // Handle odd n
        while (i < m) {
          var Ax = A * x[i];
          sum += w[i++] * (f(B + Ax) + f(B - Ax));
        }
        return A * sum;
      },

      /**
       * Creates a set of points that have u, v values for anchor positions
       */
      getCurveFromPoints: function(points, closed) {

        var l = points.length, last = l - 1;

        for (var i = 0; i < l; i++) {

          var point = points[i];

          if (!_.isObject(point.controls)) {
            Two.Anchor.AppendCurveProperties(point);
          }

          var prev = closed ? mod(i - 1, l) : max(i - 1, 0);
          var next = closed ? mod(i + 1, l) : min(i + 1, last);

          var a = points[prev];
          var b = point;
          var c = points[next];
          getControlPoints(a, b, c);

          b._command = i === 0 ? Two.Commands.move : Two.Commands.curve;

          b.controls.left.x = _.isNumber(b.controls.left.x) ? b.controls.left.x : b.x;
          b.controls.left.y = _.isNumber(b.controls.left.y) ? b.controls.left.y : b.y;

          b.controls.right.x = _.isNumber(b.controls.right.x) ? b.controls.right.x : b.x;
          b.controls.right.y = _.isNumber(b.controls.right.y) ? b.controls.right.y : b.y;

        }

      },

      /**
       * Given three coordinates return the control points for the middle, b,
       * vertex.
       */
      getControlPoints: function(a, b, c) {

        var a1 = angleBetween(a, b);
        var a2 = angleBetween(c, b);

        var d1 = distanceBetween(a, b);
        var d2 = distanceBetween(c, b);

        var mid = (a1 + a2) / 2;

        // So we know which angle corresponds to which side.

        b.u = _.isObject(b.controls.left) ? b.controls.left : new Two.Vector(0, 0);
        b.v = _.isObject(b.controls.right) ? b.controls.right : new Two.Vector(0, 0);

        // TODO: Issue 73
        if (d1 < 0.0001 || d2 < 0.0001) {
          if (!b._relative) {
            b.controls.left.copy(b);
            b.controls.right.copy(b);
          }
          return b;
        }

        d1 *= 0.33; // Why 0.33?
        d2 *= 0.33;

        if (a2 < a1) {
          mid += HALF_PI;
        } else {
          mid -= HALF_PI;
        }

        b.controls.left.x = cos(mid) * d1;
        b.controls.left.y = sin(mid) * d1;

        mid -= PI;

        b.controls.right.x = cos(mid) * d2;
        b.controls.right.y = sin(mid) * d2;

        if (!b._relative) {
          b.controls.left.x += b.x;
          b.controls.left.y += b.y;
          b.controls.right.x += b.x;
          b.controls.right.y += b.y;
        }

        return b;

      },

      /**
       * Get the reflection of a point "b" about point "a". Where "a" is in
       * absolute space and "b" is relative to "a".
       *
       * http://www.w3.org/TR/SVG11/implnote.html#PathElementImplementationNotes
       */
      getReflection: function(a, b, relative) {

        return new Two.Vector(
          2 * a.x - (b.x + a.x) - (relative ? a.x : 0),
          2 * a.y - (b.y + a.y) - (relative ? a.y : 0)
        );

      },

      getAnchorsFromArcData: function(center, xAxisRotation, rx, ry, ts, td, ccw) {

        var matrix = new Two.Matrix()
          .translate(center.x, center.y)
          .rotate(xAxisRotation);

        var l = Two.Resolution;

        return _.map(_.range(l), function(i) {

          var pct = (i + 1) / l;
          if (!!ccw) {
            pct = 1 - pct;
          }

          var theta = pct * td + ts;
          var x = rx * Math.cos(theta);
          var y = ry * Math.sin(theta);

          // x += center.x;
          // y += center.y;

          var anchor = new Two.Anchor(x, y);
          Two.Anchor.AppendCurveProperties(anchor);
          anchor.command = Two.Commands.line;

          // TODO: Calculate control points here...

          return anchor;

        });

      },

      ratioBetween: function(A, B) {

        return (A.x * B.x + A.y * B.y) / (A.length() * B.length());

      },

      angleBetween: function(A, B) {

        var dx, dy;

        if (arguments.length >= 4) {

          dx = arguments[0] - arguments[2];
          dy = arguments[1] - arguments[3];

          return atan2(dy, dx);

        }

        dx = A.x - B.x;
        dy = A.y - B.y;

        return atan2(dy, dx);

      },

      distanceBetweenSquared: function(p1, p2) {

        var dx = p1.x - p2.x;
        var dy = p1.y - p2.y;

        return dx * dx + dy * dy;

      },

      distanceBetween: function(p1, p2) {

        return sqrt(distanceBetweenSquared(p1, p2));

      },

      lerp: function(a, b, t) {
        return t * (b - a) + a;
      },

      // A pretty fast toFixed(3) alternative
      // See http://jsperf.com/parsefloat-tofixed-vs-math-round/18
      toFixed: function(v) {
        return Math.floor(v * 1000) / 1000;
      },

      mod: function(v, l) {

        while (v < 0) {
          v += l;
        }

        return v % l;

      },

      /**
       * Array like collection that triggers inserted and removed events
       * removed : pop / shift / splice
       * inserted : push / unshift / splice (with > 2 arguments)
       */
      Collection: function() {

        Array.call(this);

        if (arguments.length > 1) {
          Array.prototype.push.apply(this, arguments);
        } else if (arguments[0] && Array.isArray(arguments[0])) {
          Array.prototype.push.apply(this, arguments[0]);
        }

      },

      // Custom Error Throwing for Two.js

      Error: function(message) {
        this.name = 'two.js';
        this.message = message;
      },

      Events: {

        on: function(name, callback) {

          this._events || (this._events = {});
          var list = this._events[name] || (this._events[name] = []);

          list.push(callback);

          return this;

        },

        off: function(name, callback) {

          if (!this._events) {
            return this;
          }
          if (!name && !callback) {
            this._events = {};
            return this;
          }

          var names = name ? [name] : _.keys(this._events);
          for (var i = 0, l = names.length; i < l; i++) {

            var name = names[i];
            var list = this._events[name];

            if (!!list) {
              var events = [];
              if (callback) {
                for (var j = 0, k = list.length; j < k; j++) {
                  var ev = list[j];
                  ev = ev.callback ? ev.callback : ev;
                  if (callback && callback !== ev) {
                    events.push(ev);
                  }
                }
              }
              this._events[name] = events;
            }
          }

          return this;
        },

        trigger: function(name) {
          if (!this._events) return this;
          var args = slice.call(arguments, 1);
          var events = this._events[name];
          if (events) trigger(this, events, args);
          return this;
        },

        listen: function (obj, name, callback) {

          var bound = this;

          if (obj) {
            var ev = function () {
              callback.apply(bound, arguments);
            };

            // add references about the object that assigned this listener
            ev.obj = obj;
            ev.name = name;
            ev.callback = callback;

            obj.on(name, ev);
          }

          return this;

        },

        ignore: function (obj, name, callback) {

          obj.off(name, callback);

          return this;

        }

      }

    })

  });

  Two.Utils.Events.bind = Two.Utils.Events.on;
  Two.Utils.Events.unbind = Two.Utils.Events.off;

  var trigger = function(obj, events, args) {
    var method;
    switch (args.length) {
    case 0:
      method = function(i) {
        events[i].call(obj, args[0]);
      };
      break;
    case 1:
      method = function(i) {
        events[i].call(obj, args[0], args[1]);
      };
      break;
    case 2:
      method = function(i) {
        events[i].call(obj, args[0], args[1], args[2]);
      };
      break;
    case 3:
      method = function(i) {
        events[i].call(obj, args[0], args[1], args[2], args[3]);
      };
      break;
    default:
      method = function(i) {
        events[i].apply(obj, args);
      };
    }
    for (var i = 0; i < events.length; i++) {
      method(i);
    }
  };

  Two.Utils.Error.prototype = new Error();
  Two.Utils.Error.prototype.constructor = Two.Utils.Error;

  Two.Utils.Collection.prototype = new Array();
  Two.Utils.Collection.prototype.constructor = Two.Utils.Collection;

  _.extend(Two.Utils.Collection.prototype, Two.Utils.Events, {

    pop: function() {
      var popped = Array.prototype.pop.apply(this, arguments);
      this.trigger(Two.Events.remove, [popped]);
      return popped;
    },

    shift: function() {
      var shifted = Array.prototype.shift.apply(this, arguments);
      this.trigger(Two.Events.remove, [shifted]);
      return shifted;
    },

    push: function() {
      var pushed = Array.prototype.push.apply(this, arguments);
      this.trigger(Two.Events.insert, arguments);
      return pushed;
    },

    unshift: function() {
      var unshifted = Array.prototype.unshift.apply(this, arguments);
      this.trigger(Two.Events.insert, arguments);
      return unshifted;
    },

    splice: function() {
      var spliced = Array.prototype.splice.apply(this, arguments);
      var inserted;

      this.trigger(Two.Events.remove, spliced);

      if (arguments.length > 2) {
        inserted = this.slice(arguments[0], arguments[0] + arguments.length - 2);
        this.trigger(Two.Events.insert, inserted);
        this.trigger(Two.Events.order);
      }
      return spliced;
    },

    sort: function() {
      Array.prototype.sort.apply(this, arguments);
      this.trigger(Two.Events.order);
      return this;
    },

    reverse: function() {
      Array.prototype.reverse.apply(this, arguments);
      this.trigger(Two.Events.order);
      return this;
    }

  });

  // Localize utils

  var distanceBetween = Two.Utils.distanceBetween,
    getAnchorsFromArcData = Two.Utils.getAnchorsFromArcData,
    distanceBetweenSquared = Two.Utils.distanceBetweenSquared,
    ratioBetween = Two.Utils.ratioBetween,
    angleBetween = Two.Utils.angleBetween,
    getControlPoints = Two.Utils.getControlPoints,
    getCurveFromPoints = Two.Utils.getCurveFromPoints,
    solveSegmentIntersection = Two.Utils.solveSegmentIntersection,
    decoupleShapes = Two.Utils.decoupleShapes,
    mod = Two.Utils.mod,
    getBackingStoreRatio = Two.Utils.getBackingStoreRatio,
    getPointOnCubicBezier = Two.Utils.getPointOnCubicBezier,
    getCurveLength = Two.Utils.getCurveLength,
    integrate = Two.Utils.integrate,
    getReflection = Two.Utils.getReflection;

  _.extend(Two.prototype, Two.Utils.Events, {

    appendTo: function(elem) {

      elem.appendChild(this.renderer.domElement);
      return this;

    },

    play: function() {

      Two.Utils.setPlaying.call(this, true);
      return this.trigger(Two.Events.play);

    },

    pause: function() {

      this.playing = false;
      return this.trigger(Two.Events.pause);

    },

    /**
     * Update positions and calculations in one pass before rendering.
     */
    update: function() {

      var animated = !!this._lastFrame;
      var now = perf.now();

      this.frameCount++;

      if (animated) {
        this.timeDelta = parseFloat((now - this._lastFrame).toFixed(3));
      }
      this._lastFrame = now;

      var width = this.width;
      var height = this.height;
      var renderer = this.renderer;

      // Update width / height for the renderer
      if (width !== renderer.width || height !== renderer.height) {
        renderer.setSize(width, height, this.ratio);
      }

      this.trigger(Two.Events.update, this.frameCount, this.timeDelta);

      return this.render();

    },

    /**
     * Render all drawable - visible objects of the scene.
     */
    render: function() {

      this.renderer.render();
      return this.trigger(Two.Events.render, this.frameCount);

    },

    /**
     * Convenience Methods
     */

    add: function(o) {

      var objects = o;
      if (!(objects instanceof Array)) {
        objects = _.toArray(arguments);
      }

      this.scene.add(objects);
      return this;

    },

    remove: function(o) {

      var objects = o;
      if (!(objects instanceof Array)) {
        objects = _.toArray(arguments);
      }

      this.scene.remove(objects);

      return this;

    },

    clear: function() {

      this.scene.remove(_.toArray(this.scene.children));
      return this;

    },

    makeLine: function(x1, y1, x2, y2) {

      var line = new Two.Line(x1, y1, x2, y2);
      this.scene.add(line);

      return line;

    },

    makeRectangle: function(x, y, width, height) {

      var rect = new Two.Rectangle(x, y, width, height);
      this.scene.add(rect);

      return rect;

    },

    makeRoundedRectangle: function(x, y, width, height, sides) {

      var rect = new Two.RoundedRectangle(x, y, width, height, sides);
      this.scene.add(rect);

      return rect;

    },

    makeCircle: function(ox, oy, r) {

      var circle = new Two.Circle(ox, oy, r);
      this.scene.add(circle);

      return circle;

    },

    makeEllipse: function(ox, oy, rx, ry) {

      var ellipse = new Two.Ellipse(ox, oy, rx, ry);
      this.scene.add(ellipse);

      return ellipse;

    },

    makeStar: function(ox, oy, or, ir, sides) {

      var star = new Two.Star(ox, oy, or, ir, sides);
      this.scene.add(star);

      return star;

    },

    makeCurve: function(p) {

      var l = arguments.length, points = p;
      if (!_.isArray(p)) {
        points = [];
        for (var i = 0; i < l; i+=2) {
          var x = arguments[i];
          if (!_.isNumber(x)) {
            break;
          }
          var y = arguments[i + 1];
          points.push(new Two.Anchor(x, y));
        }
      }

      var last = arguments[l - 1];
      var curve = new Two.Path(points, !(_.isBoolean(last) ? last : undefined), true);
      var rect = curve.getBoundingClientRect();
      curve.center().translation
        .set(rect.left + rect.width / 2, rect.top + rect.height / 2);

      this.scene.add(curve);

      return curve;

    },

    makePolygon: function(ox, oy, r, sides) {

      var poly = new Two.Polygon(ox, oy, r, sides);
      this.scene.add(poly);

      return poly;

    },

    /*
    * Make an Arc Segment
    */

    makeArcSegment: function(ox, oy, ir, or, sa, ea, res) {
      var arcSegment = new Two.ArcSegment(ox, oy, ir, or, sa, ea, res);
      this.scene.add(arcSegment);
      return arcSegment;
    },

    /**
     * Convenience method to make and draw a Two.Path.
     */
    makePath: function(p) {

      var l = arguments.length, points = p;
      if (!_.isArray(p)) {
        points = [];
        for (var i = 0; i < l; i+=2) {
          var x = arguments[i];
          if (!_.isNumber(x)) {
            break;
          }
          var y = arguments[i + 1];
          points.push(new Two.Anchor(x, y));
        }
      }

      var last = arguments[l - 1];
      var path = new Two.Path(points, !(_.isBoolean(last) ? last : undefined));
      var rect = path.getBoundingClientRect();
      path.center().translation
        .set(rect.left + rect.width / 2, rect.top + rect.height / 2);

      this.scene.add(path);

      return path;

    },

    /**
     * Convenience method to make and add a Two.Text.
     */
    makeText: function(message, x, y, styles) {
      var text = new Two.Text(message, x, y, styles);
      this.add(text);
      return text;
    },

    /**
     * Convenience method to make and add a Two.LinearGradient.
     */
    makeLinearGradient: function(x1, y1, x2, y2 /* stops */) {

      var stops = slice.call(arguments, 4);
      var gradient = new Two.LinearGradient(x1, y1, x2, y2, stops);

      this.add(gradient);

      return gradient;

    },

    /**
     * Convenience method to make and add a Two.RadialGradient.
     */
    makeRadialGradient: function(x1, y1, r /* stops */) {

      var stops = slice.call(arguments, 3);
      var gradient = new Two.RadialGradient(x1, y1, r, stops);

      this.add(gradient);

      return gradient;

    },

    makeSprite: function(path, x, y, cols, rows, frameRate, autostart) {

      var sprite = new Two.Sprite(path, x, y, cols, rows, frameRate);
      if (!!autostart) {
        sprite.play();
      }
      this.add(sprite);

      return sprite;

    },

    makeImageSequence: function(paths, x, y, frameRate, autostart) {

      var imageSequence = new Two.ImageSequence(paths, x, y, frameRate);
      if (!!autostart) {
        imageSequence.play();
      }
      this.add(imageSequence);

      return imageSequence;

    },

    makeTexture: function(path, callback) {

      var texture = new Two.Texture(path, callback);
      return texture;

    },

    makeGroup: function(o) {

      var objects = o;
      if (!(objects instanceof Array)) {
        objects = _.toArray(arguments);
      }

      var group = new Two.Group();
      this.scene.add(group);
      group.add(objects);

      return group;

    },

    /**
     * Interpret an SVG Node and add it to this instance's scene. The
     * distinction should be made that this doesn't `import` svg's, it solely
     * interprets them into something compatible for Two.js — this is slightly
     * different than a direct transcription.
     *
     * @param {Object} svgNode - The node to be parsed
     * @param {Boolean} shallow - Don't create a top-most group but
     *                                    append all contents directly
     */
    interpret: function(svgNode, shallow) {

      var tag = svgNode.tagName.toLowerCase();

      if (!(tag in Two.Utils.read)) {
        return null;
      }

      var node = Two.Utils.read[tag].call(this, svgNode);

      if (shallow && node instanceof Two.Group) {
        this.add(node.children);
      } else {
        this.add(node);
      }

      return node;

    },

    /**
     * Load an SVG file / text and interpret.
     */
    load: function(text, callback) {

      var nodes = [], elem, i;

      if (/.*\.svg/ig.test(text)) {

        Two.Utils.xhr(text, _.bind(function(data) {

          dom.temp.innerHTML = data;
          for (i = 0; i < dom.temp.children.length; i++) {
            elem = dom.temp.children[i];
            nodes.push(this.interpret(elem));
          }

          callback(nodes.length <= 1 ? nodes[0] : nodes,
            dom.temp.children.length <= 1 ? dom.temp.children[0] : dom.temp.children);

        }, this));

        return this;

      }

      dom.temp.innerHTML = text;
      for (i = 0; i < dom.temp.children.length; i++) {
        elem = dom.temp.children[i];
        nodes.push(this.interpret(elem));
      }

      callback(nodes.length <= 1 ? nodes[0] : nodes,
        dom.temp.children.length <= 1 ? dom.temp.children[0] : dom.temp.children);

      return this;

    }

  });

  function fitToWindow() {

    var wr = document.body.getBoundingClientRect();

    var width = this.width = wr.width;
    var height = this.height = wr.height;

    this.renderer.setSize(width, height, this.ratio);
    this.trigger(Two.Events.resize, width, height);

  }

  // Request Animation Frame

  var raf = dom.getRequestAnimationFrame();

  function loop() {

    raf(loop);

    for (var i = 0; i < Two.Instances.length; i++) {
      var t = Two.Instances[i];
      if (t.playing) {
        t.update();
      }
    }

  }

  if (typeof define === 'function' && define.amd) {
    define('two', [], function() {
      return Two;
    });
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = Two;
  }

  return Two;

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;

  var Registry = Two.Registry = function() {

    this.map = {};

  };

  _.extend(Registry, {

  });

  _.extend(Registry.prototype, {

    add: function(id, obj) {
      this.map[id] = obj;
      return this;
    },

    remove: function(id) {
      delete this.map[id];
      return this;
    },

    get: function(id) {
      return this.map[id];
    },

    contains: function(id) {
      return id in this.map;
    }

  });

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;

  var Vector = Two.Vector = function(x, y) {

    this.x = x || 0;
    this.y = y || 0;

  };

  _.extend(Vector, {

    zero: new Two.Vector()

  });

  _.extend(Vector.prototype, Two.Utils.Events, {

    set: function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },

    copy: function(v) {
      this.x = v.x;
      this.y = v.y;
      return this;
    },

    clear: function() {
      this.x = 0;
      this.y = 0;
      return this;
    },

    clone: function() {
      return new Vector(this.x, this.y);
    },

    add: function(v1, v2) {
      this.x = v1.x + v2.x;
      this.y = v1.y + v2.y;
      return this;
    },

    addSelf: function(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    },

    sub: function(v1, v2) {
      this.x = v1.x - v2.x;
      this.y = v1.y - v2.y;
      return this;
    },

    subSelf: function(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    },

    multiplySelf: function(v) {
      this.x *= v.x;
      this.y *= v.y;
      return this;
    },

    multiplyScalar: function(s) {
      this.x *= s;
      this.y *= s;
      return this;
    },

    divideScalar: function(s) {
      if (s) {
        this.x /= s;
        this.y /= s;
      } else {
        this.set(0, 0);
      }
      return this;
    },

    negate: function() {
      return this.multiplyScalar(-1);
    },

    dot: function(v) {
      return this.x * v.x + this.y * v.y;
    },

    lengthSquared: function() {
      return this.x * this.x + this.y * this.y;
    },

    length: function() {
      return Math.sqrt(this.lengthSquared());
    },

    normalize: function() {
      return this.divideScalar(this.length());
    },

    distanceTo: function(v) {
      return Math.sqrt(this.distanceToSquared(v));
    },

    distanceToSquared: function(v) {
      var dx = this.x - v.x,
          dy = this.y - v.y;
      return dx * dx + dy * dy;
    },

    setLength: function(l) {
      return this.normalize().multiplyScalar(l);
    },

    equals: function(v, eps) {
      eps = (typeof eps === 'undefined') ?  0.0001 : eps;
      return (this.distanceTo(v) < eps);
    },

    lerp: function(v, t) {
      var x = (v.x - this.x) * t + this.x;
      var y = (v.y - this.y) * t + this.y;
      return this.set(x, y);
    },

    isZero: function(eps) {
      eps = (typeof eps === 'undefined') ?  0.0001 : eps;
      return (this.length() < eps);
    },

    toString: function() {
      return this.x + ', ' + this.y;
    },

    toObject: function() {
      return { x: this.x, y: this.y };
    },

    rotate: function (radians) {
      var cos = Math.cos(radians);
      var sin = Math.sin(radians);
      this.x = this.x * cos - this.y * sin;
      this.y = this.x * sin + this.y * cos;
      return this;
    }

  });

  var BoundProto = {

    set: function(x, y) {
      this._x = x;
      this._y = y;
      return this.trigger(Two.Events.change);
    },

    copy: function(v) {
      this._x = v.x;
      this._y = v.y;
      return this.trigger(Two.Events.change);
    },

    clear: function() {
      this._x = 0;
      this._y = 0;
      return this.trigger(Two.Events.change);
    },

    clone: function() {
      return new Vector(this._x, this._y);
    },

    add: function(v1, v2) {
      this._x = v1.x + v2.x;
      this._y = v1.y + v2.y;
      return this.trigger(Two.Events.change);
    },

    addSelf: function(v) {
      this._x += v.x;
      this._y += v.y;
      return this.trigger(Two.Events.change);
    },

    sub: function(v1, v2) {
      this._x = v1.x - v2.x;
      this._y = v1.y - v2.y;
      return this.trigger(Two.Events.change);
    },

    subSelf: function(v) {
      this._x -= v.x;
      this._y -= v.y;
      return this.trigger(Two.Events.change);
    },

    multiplySelf: function(v) {
      this._x *= v.x;
      this._y *= v.y;
      return this.trigger(Two.Events.change);
    },

    multiplyScalar: function(s) {
      this._x *= s;
      this._y *= s;
      return this.trigger(Two.Events.change);
    },

    divideScalar: function(s) {
      if (s) {
        this._x /= s;
        this._y /= s;
        return this.trigger(Two.Events.change);
      }
      return this.clear();
    },

    negate: function() {
      return this.multiplyScalar(-1);
    },

    dot: function(v) {
      return this._x * v.x + this._y * v.y;
    },

    lengthSquared: function() {
      return this._x * this._x + this._y * this._y;
    },

    length: function() {
      return Math.sqrt(this.lengthSquared());
    },

    normalize: function() {
      return this.divideScalar(this.length());
    },

    distanceTo: function(v) {
      return Math.sqrt(this.distanceToSquared(v));
    },

    distanceToSquared: function(v) {
      var dx = this._x - v.x,
          dy = this._y - v.y;
      return dx * dx + dy * dy;
    },

    setLength: function(l) {
      return this.normalize().multiplyScalar(l);
    },

    equals: function(v, eps) {
      eps = (typeof eps === 'undefined') ?  0.0001 : eps;
      return (this.distanceTo(v) < eps);
    },

    lerp: function(v, t) {
      var x = (v.x - this._x) * t + this._x;
      var y = (v.y - this._y) * t + this._y;
      return this.set(x, y);
    },

    isZero: function(eps) {
      eps = (typeof eps === 'undefined') ?  0.0001 : eps;
      return (this.length() < eps);
    },

    toString: function() {
      return this._x + ', ' + this._y;
    },

    toObject: function() {
      return { x: this._x, y: this._y };
    },

    rotate: function (radians) {
      var cos = Math.cos(radians);
      var sin = Math.sin(radians);
      this._x = this._x * cos - this._y * sin;
      this._y = this._x * sin + this._y * cos;
      return this;
    }

  };

  var xgs = {
    enumerable: true,
    get: function() {
      return this._x;
    },
    set: function(v) {
      this._x = v;
      this.trigger(Two.Events.change, 'x');
    }
  };

  var ygs = {
    enumerable: true,
    get: function() {
      return this._y;
    },
    set: function(v) {
      this._y = v;
      this.trigger(Two.Events.change, 'y');
    }
  };

  /**
   * Override Backbone bind / on in order to add properly broadcasting.
   * This allows Two.Vector to not broadcast events unless event listeners
   * are explicity bound to it.
   */

  Two.Vector.prototype.bind = Two.Vector.prototype.on = function() {

    if (!this._bound) {
      this._x = this.x;
      this._y = this.y;
      Object.defineProperty(this, 'x', xgs);
      Object.defineProperty(this, 'y', ygs);
      _.extend(this, BoundProto);
      this._bound = true; // Reserved for event initialization check
    }

    Two.Utils.Events.bind.apply(this, arguments);

    return this;

  };

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  // Localized variables
  var commands = Two.Commands;
  var _ = Two.Utils;

  /**
   * An object that holds 3 `Two.Vector`s, the anchor point and its
   * corresponding handles: `left` and `right`.
   */
  var Anchor = Two.Anchor = function(x, y, ux, uy, vx, vy, command) {

    Two.Vector.call(this, x, y);

    this._broadcast = _.bind(function() {
      this.trigger(Two.Events.change);
    }, this);

    this._command = command || commands.move;
    this._relative = true;

    if (!command) {
      return this;
    }

    Anchor.AppendCurveProperties(this);

    if (_.isNumber(ux)) {
      this.controls.left.x = ux;
    }
    if (_.isNumber(uy)) {
      this.controls.left.y = uy;
    }
    if (_.isNumber(vx)) {
      this.controls.right.x = vx;
    }
    if (_.isNumber(vy)) {
      this.controls.right.y = vy;
    }

  };

  _.extend(Anchor, {

    AppendCurveProperties: function(anchor) {
      anchor.controls = {
        left: new Two.Vector(0, 0),
        right: new Two.Vector(0, 0)
      };
    }

  });

  var AnchorProto = {

    listen: function() {

      if (!_.isObject(this.controls)) {
        Anchor.AppendCurveProperties(this);
      }

      this.controls.left.bind(Two.Events.change, this._broadcast);
      this.controls.right.bind(Two.Events.change, this._broadcast);

      return this;

    },

    ignore: function() {

      this.controls.left.unbind(Two.Events.change, this._broadcast);
      this.controls.right.unbind(Two.Events.change, this._broadcast);

      return this;

    },

    clone: function() {

      var controls = this.controls;

      var clone = new Two.Anchor(
        this.x,
        this.y,
        controls && controls.left.x,
        controls && controls.left.y,
        controls && controls.right.x,
        controls && controls.right.y,
        this.command
      );
      clone.relative = this._relative;
      return clone;

    },

    toObject: function() {
      var o = {
        x: this.x,
        y: this.y
      };
      if (this._command) {
        o.command = this._command;
      }
      if (this._relative) {
        o.relative = this._relative;
      }
      if (this.controls) {
        o.controls = {
          left: this.controls.left.toObject(),
          right: this.controls.right.toObject()
        };
      }
      return o;
    },

    toString: function() {
      if (!this.controls) {
        return [this._x, this._y].join(', ');
      }
      return [this._x, this._y, this.controls.left.x, this.controls.left.y,
        this.controls.right.x, this.controls.right.y].join(', ');
    }

  };

  Object.defineProperty(Anchor.prototype, 'command', {

    enumerable: true,

    get: function() {
      return this._command;
    },

    set: function(c) {
      this._command = c;
      if (this._command === commands.curve && !_.isObject(this.controls)) {
        Anchor.AppendCurveProperties(this);
      }
      return this.trigger(Two.Events.change);
    }

  });

  Object.defineProperty(Anchor.prototype, 'relative', {

    enumerable: true,

    get: function() {
      return this._relative;
    },

    set: function(b) {
      if (this._relative == b) {
        return this;
      }
      this._relative = !!b;
      return this.trigger(Two.Events.change);
    }

  });

  _.extend(Anchor.prototype, Two.Vector.prototype, AnchorProto);

  // Make it possible to bind and still have the Anchor specific
  // inheritance from Two.Vector
  Two.Anchor.prototype.bind = Two.Anchor.prototype.on = function() {
    Two.Vector.prototype.bind.apply(this, arguments);
    _.extend(this, AnchorProto);
  };

  Two.Anchor.prototype.unbind = Two.Anchor.prototype.off = function() {
    Two.Vector.prototype.unbind.apply(this, arguments);
    _.extend(this, AnchorProto);
  };

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  /**
   * Constants
   */
  var cos = Math.cos, sin = Math.sin, tan = Math.tan;
  var _ = Two.Utils;

  /**
   * Two.Matrix contains an array of elements that represent
   * the two dimensional 3 x 3 matrix as illustrated below:
   *
   * =====
   * a b c
   * d e f
   * g h i  // this row is not really used in 2d transformations
   * =====
   *
   * String order is for transform strings: a, d, b, e, c, f
   *
   * @class
   */
  var Matrix = Two.Matrix = function(a, b, c, d, e, f) {

    this.elements = new Two.Array(9);

    var elements = a;
    if (!_.isArray(elements)) {
      elements = _.toArray(arguments);
    }

    // initialize the elements with default values.

    this.identity().set(elements);

  };

  _.extend(Matrix, {

    Identity: [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ],

    /**
     * Multiply two matrix 3x3 arrays
     */
    Multiply: function(A, B, C) {

      if (B.length <= 3) { // Multiply Vector

        var x, y, z, e = A;

        var a = B[0] || 0,
            b = B[1] || 0,
            c = B[2] || 0;

        // Go down rows first
        // a, d, g, b, e, h, c, f, i

        x = e[0] * a + e[1] * b + e[2] * c;
        y = e[3] * a + e[4] * b + e[5] * c;
        z = e[6] * a + e[7] * b + e[8] * c;

        return { x: x, y: y, z: z };

      }

      var A0 = A[0], A1 = A[1], A2 = A[2];
      var A3 = A[3], A4 = A[4], A5 = A[5];
      var A6 = A[6], A7 = A[7], A8 = A[8];

      var B0 = B[0], B1 = B[1], B2 = B[2];
      var B3 = B[3], B4 = B[4], B5 = B[5];
      var B6 = B[6], B7 = B[7], B8 = B[8];

      C = C || new Two.Array(9);

      C[0] = A0 * B0 + A1 * B3 + A2 * B6;
      C[1] = A0 * B1 + A1 * B4 + A2 * B7;
      C[2] = A0 * B2 + A1 * B5 + A2 * B8;
      C[3] = A3 * B0 + A4 * B3 + A5 * B6;
      C[4] = A3 * B1 + A4 * B4 + A5 * B7;
      C[5] = A3 * B2 + A4 * B5 + A5 * B8;
      C[6] = A6 * B0 + A7 * B3 + A8 * B6;
      C[7] = A6 * B1 + A7 * B4 + A8 * B7;
      C[8] = A6 * B2 + A7 * B5 + A8 * B8;

      return C;

    }

  });

  _.extend(Matrix.prototype, Two.Utils.Events, {

    /**
     * Takes an array of elements or the arguments list itself to
     * set and update the current matrix's elements. Only updates
     * specified values.
     */
    set: function(a) {

      var elements = a;
      if (!_.isArray(elements)) {
        elements = _.toArray(arguments);
      }

      _.extend(this.elements, elements);

      return this.trigger(Two.Events.change);

    },

    /**
     * Turn matrix to identity, like resetting.
     */
    identity: function() {

      this.set(Matrix.Identity);

      return this;

    },

    /**
     * Multiply scalar or multiply by another matrix.
     */
    multiply: function(a, b, c, d, e, f, g, h, i) {

      var elements = arguments, l = elements.length;

      // Multiply scalar

      if (l <= 1) {

        _.each(this.elements, function(v, i) {
          this.elements[i] = v * a;
        }, this);

        return this.trigger(Two.Events.change);

      }

      if (l <= 3) { // Multiply Vector

        var x, y, z;
        a = a || 0;
        b = b || 0;
        c = c || 0;
        e = this.elements;

        // Go down rows first
        // a, d, g, b, e, h, c, f, i

        x = e[0] * a + e[1] * b + e[2] * c;
        y = e[3] * a + e[4] * b + e[5] * c;
        z = e[6] * a + e[7] * b + e[8] * c;

        return { x: x, y: y, z: z };

      }

      // Multiple matrix

      var A = this.elements;
      var B = elements;

      var A0 = A[0], A1 = A[1], A2 = A[2];
      var A3 = A[3], A4 = A[4], A5 = A[5];
      var A6 = A[6], A7 = A[7], A8 = A[8];

      var B0 = B[0], B1 = B[1], B2 = B[2];
      var B3 = B[3], B4 = B[4], B5 = B[5];
      var B6 = B[6], B7 = B[7], B8 = B[8];

      this.elements[0] = A0 * B0 + A1 * B3 + A2 * B6;
      this.elements[1] = A0 * B1 + A1 * B4 + A2 * B7;
      this.elements[2] = A0 * B2 + A1 * B5 + A2 * B8;

      this.elements[3] = A3 * B0 + A4 * B3 + A5 * B6;
      this.elements[4] = A3 * B1 + A4 * B4 + A5 * B7;
      this.elements[5] = A3 * B2 + A4 * B5 + A5 * B8;

      this.elements[6] = A6 * B0 + A7 * B3 + A8 * B6;
      this.elements[7] = A6 * B1 + A7 * B4 + A8 * B7;
      this.elements[8] = A6 * B2 + A7 * B5 + A8 * B8;

      return this.trigger(Two.Events.change);

    },

    inverse: function(out) {

      var a = this.elements;
      out = out || new Two.Matrix();

      var a00 = a[0], a01 = a[1], a02 = a[2];
      var a10 = a[3], a11 = a[4], a12 = a[5];
      var a20 = a[6], a21 = a[7], a22 = a[8];

      var b01 = a22 * a11 - a12 * a21;
      var b11 = -a22 * a10 + a12 * a20;
      var b21 = a21 * a10 - a11 * a20;

      // Calculate the determinant
      var det = a00 * b01 + a01 * b11 + a02 * b21;

      if (!det) {
        return null;
      }

      det = 1.0 / det;

      out.elements[0] = b01 * det;
      out.elements[1] = (-a22 * a01 + a02 * a21) * det;
      out.elements[2] = (a12 * a01 - a02 * a11) * det;
      out.elements[3] = b11 * det;
      out.elements[4] = (a22 * a00 - a02 * a20) * det;
      out.elements[5] = (-a12 * a00 + a02 * a10) * det;
      out.elements[6] = b21 * det;
      out.elements[7] = (-a21 * a00 + a01 * a20) * det;
      out.elements[8] = (a11 * a00 - a01 * a10) * det;

      return out;

    },

    /**
     * Set a scalar onto the matrix.
     */
    scale: function(sx, sy) {

      var l = arguments.length;
      if (l <= 1) {
        sy = sx;
      }

      return this.multiply(sx, 0, 0, 0, sy, 0, 0, 0, 1);

    },

    /**
     * Rotate the matrix.
     */
    rotate: function(radians) {

      var c = cos(radians);
      var s = sin(radians);

      return this.multiply(c, -s, 0, s, c, 0, 0, 0, 1);

    },

    /**
     * Translate the matrix.
     */
    translate: function(x, y) {

      return this.multiply(1, 0, x, 0, 1, y, 0, 0, 1);

    },

    /*
     * Skew the matrix by an angle in the x axis direction.
     */
    skewX: function(radians) {

      var a = tan(radians);

      return this.multiply(1, a, 0, 0, 1, 0, 0, 0, 1);

    },

    /*
     * Skew the matrix by an angle in the y axis direction.
     */
    skewY: function(radians) {

      var a = tan(radians);

      return this.multiply(1, 0, 0, a, 1, 0, 0, 0, 1);

    },

    /**
     * Create a transform string to be used with rendering apis.
     */
    toString: function(fullMatrix) {
      var temp = [];

      this.toArray(fullMatrix, temp);

      return temp.join(' ');

    },

    /**
     * Create a transform array to be used with rendering apis.
     */
    toArray: function(fullMatrix, output) {

     var elements = this.elements;
     var hasOutput = !!output;

     var a = parseFloat(elements[0].toFixed(3));
     var b = parseFloat(elements[1].toFixed(3));
     var c = parseFloat(elements[2].toFixed(3));
     var d = parseFloat(elements[3].toFixed(3));
     var e = parseFloat(elements[4].toFixed(3));
     var f = parseFloat(elements[5].toFixed(3));

      if (!!fullMatrix) {

        var g = parseFloat(elements[6].toFixed(3));
        var h = parseFloat(elements[7].toFixed(3));
        var i = parseFloat(elements[8].toFixed(3));

        if (hasOutput) {
          output[0] = a;
          output[1] = d;
          output[2] = g;
          output[3] = b;
          output[4] = e;
          output[5] = h;
          output[6] = c;
          output[7] = f;
          output[8] = i;
          return;
        }

        return [
          a, d, g, b, e, h, c, f, i
        ];
      }

      if (hasOutput) {
        output[0] = a;
        output[1] = d;
        output[2] = b;
        output[3] = e;
        output[4] = c;
        output[5] = f;
        return;
      }

      return [
        a, d, b, e, c, f  // Specific format see LN:19
      ];

    },

    /**
     * Clone the current matrix.
     */
    clone: function() {
      var a, b, c, d, e, f, g, h, i;

      a = this.elements[0];
      b = this.elements[1];
      c = this.elements[2];
      d = this.elements[3];
      e = this.elements[4];
      f = this.elements[5];
      g = this.elements[6];
      h = this.elements[7];
      i = this.elements[8];

      return new Two.Matrix(a, b, c, d, e, f, g, h, i);

    }

  });

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  // Localize variables
  var mod = Two.Utils.mod, toFixed = Two.Utils.toFixed;
  var _ = Two.Utils;

  var svg = {

    version: 1.1,

    ns: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink',

    alignments: {
      left: 'start',
      center: 'middle',
      right: 'end'
    },

    /**
     * Create an svg namespaced element.
     */
    createElement: function(name, attrs) {
      var tag = name;
      var elem = document.createElementNS(svg.ns, tag);
      if (tag === 'svg') {
        attrs = _.defaults(attrs || {}, {
          version: svg.version
        });
      }
      if (!_.isEmpty(attrs)) {
        svg.setAttributes(elem, attrs);
      }
      return elem;
    },

    /**
     * Add attributes from an svg element.
     */
    setAttributes: function(elem, attrs) {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) {
        if (/href/.test(keys[i])) {
          elem.setAttributeNS(svg.xlink, keys[i], attrs[keys[i]]);
        } else {
          elem.setAttribute(keys[i], attrs[keys[i]]);
        }
      }
      return this;
    },

    /**
     * Remove attributes from an svg element.
     */
    removeAttributes: function(elem, attrs) {
      for (var key in attrs) {
        elem.removeAttribute(key);
      }
      return this;
    },

    /**
     * Turn a set of vertices into a string for the d property of a path
     * element. It is imperative that the string collation is as fast as
     * possible, because this call will be happening multiple times a
     * second.
     */
    toString: function(points, closed) {

      var l = points.length,
        last = l - 1,
        d, // The elusive last Two.Commands.move point
        ret = '';

      for (var i = 0; i < l; i++) {
        var b = points[i];
        var command;
        var prev = closed ? mod(i - 1, l) : Math.max(i - 1, 0);
        var next = closed ? mod(i + 1, l) : Math.min(i + 1, last);

        var a = points[prev];
        var c = points[next];

        var vx, vy, ux, uy, ar, bl, br, cl;

        // Access x and y directly,
        // bypassing the getter
        var x = toFixed(b._x);
        var y = toFixed(b._y);

        switch (b._command) {

          case Two.Commands.close:
            command = Two.Commands.close;
            break;

          case Two.Commands.curve:

            ar = (a.controls && a.controls.right) || Two.Vector.zero;
            bl = (b.controls && b.controls.left) || Two.Vector.zero;

            if (a._relative) {
              vx = toFixed((ar.x + a.x));
              vy = toFixed((ar.y + a.y));
            } else {
              vx = toFixed(ar.x);
              vy = toFixed(ar.y);
            }

            if (b._relative) {
              ux = toFixed((bl.x + b.x));
              uy = toFixed((bl.y + b.y));
            } else {
              ux = toFixed(bl.x);
              uy = toFixed(bl.y);
            }

            command = ((i === 0) ? Two.Commands.move : Two.Commands.curve) +
              ' ' + vx + ' ' + vy + ' ' + ux + ' ' + uy + ' ' + x + ' ' + y;
            break;

          case Two.Commands.move:
            d = b;
            command = Two.Commands.move + ' ' + x + ' ' + y;
            break;

          default:
            command = b._command + ' ' + x + ' ' + y;

        }

        // Add a final point and close it off

        if (i >= last && closed) {

          if (b._command === Two.Commands.curve) {

            // Make sure we close to the most previous Two.Commands.move
            c = d;

            br = (b.controls && b.controls.right) || b;
            cl = (c.controls && c.controls.left) || c;

            if (b._relative) {
              vx = toFixed((br.x + b.x));
              vy = toFixed((br.y + b.y));
            } else {
              vx = toFixed(br.x);
              vy = toFixed(br.y);
            }

            if (c._relative) {
              ux = toFixed((cl.x + c.x));
              uy = toFixed((cl.y + c.y));
            } else {
              ux = toFixed(cl.x);
              uy = toFixed(cl.y);
            }

            x = toFixed(c.x);
            y = toFixed(c.y);

            command +=
              ' C ' + vx + ' ' + vy + ' ' + ux + ' ' + uy + ' ' + x + ' ' + y;
          }

          command += ' Z';

        }

        ret += command + ' ';

      }

      return ret;

    },

    getClip: function(shape) {

      var clip = shape._renderer.clip;

      if (!clip) {

        var root = shape;

        while (root.parent) {
          root = root.parent;
        }

        clip = shape._renderer.clip = svg.createElement('clipPath');
        root.defs.appendChild(clip);

      }

      return clip;

    },

    group: {

      // TODO: Can speed up.
      // TODO: How does this effect a f
      appendChild: function(object) {

        var elem = object._renderer.elem;

        if (!elem) {
          return;
        }

        var tag = elem.nodeName;

        if (!tag || /(radial|linear)gradient/i.test(tag) || object._clip) {
          return;
        }

        this.elem.appendChild(elem);

      },

      removeChild: function(object) {

        var elem = object._renderer.elem;

        if (!elem || elem.parentNode != this.elem) {
          return;
        }

        var tag = elem.nodeName;

        if (!tag) {
          return;
        }

        // Defer subtractions while clipping.
        if (object._clip) {
          return;
        }

        this.elem.removeChild(elem);

      },

      orderChild: function(object) {
        this.elem.appendChild(object._renderer.elem);
      },

      renderChild: function(child) {
        svg[child._renderer.type].render.call(child, this);
      },

      render: function(domElement) {

        this._update();

        // Shortcut for hidden objects.
        // Doesn't reset the flags, so changes are stored and
        // applied once the object is visible again
        if (this._opacity === 0 && !this._flagOpacity) {
          return this;
        }

        if (!this._renderer.elem) {
          this._renderer.elem = svg.createElement('g', {
            id: this.id
          });
          domElement.appendChild(this._renderer.elem);
        }

        // _Update styles for the <g>
        var flagMatrix = this._matrix.manual || this._flagMatrix;
        var context = {
          domElement: domElement,
          elem: this._renderer.elem
        };

        if (flagMatrix) {
          this._renderer.elem.setAttribute('transform', 'matrix(' + this._matrix.toString() + ')');
        }

        for (var i = 0; i < this.children.length; i++) {
          var child = this.children[i];
          svg[child._renderer.type].render.call(child, domElement);
        }

        if (this._flagOpacity) {
          this._renderer.elem.setAttribute('opacity', this._opacity);
        }

        if (this._flagAdditions) {
          this.additions.forEach(svg.group.appendChild, context);
        }

        if (this._flagSubtractions) {
          this.subtractions.forEach(svg.group.removeChild, context);
        }

        if (this._flagOrder) {
          this.children.forEach(svg.group.orderChild, context);
        }

        /**
         * Commented two-way functionality of clips / masks with groups and
         * polygons. Uncomment when this bug is fixed:
         * https://code.google.com/p/chromium/issues/detail?id=370951
         */

        // if (this._flagClip) {

        //   clip = svg.getClip(this);
        //   elem = this._renderer.elem;

        //   if (this._clip) {
        //     elem.removeAttribute('id');
        //     clip.setAttribute('id', this.id);
        //     clip.appendChild(elem);
        //   } else {
        //     clip.removeAttribute('id');
        //     elem.setAttribute('id', this.id);
        //     this.parent._renderer.elem.appendChild(elem); // TODO: should be insertBefore
        //   }

        // }

        if (this._flagMask) {
          if (this._mask) {
            this._renderer.elem.setAttribute('clip-path', 'url(#' + this._mask.id + ')');
          } else {
            this._renderer.elem.removeAttribute('clip-path');
          }
        }

        return this.flagReset();

      }

    },

    path: {

      render: function(domElement) {

        this._update();

        // Shortcut for hidden objects.
        // Doesn't reset the flags, so changes are stored and
        // applied once the object is visible again
        if (this._opacity === 0 && !this._flagOpacity) {
          return this;
        }

        // Collect any attribute that needs to be changed here
        var changed = {};

        var flagMatrix = this._matrix.manual || this._flagMatrix;

        if (flagMatrix) {
          changed.transform = 'matrix(' + this._matrix.toString() + ')';
        }

        if (this._flagVertices) {
          var vertices = svg.toString(this._vertices, this._closed);
          changed.d = vertices;
        }

        if (this._fill && this._fill._renderer) {
          this._fill._update();
          svg[this._fill._renderer.type].render.call(this._fill, domElement, true);
        }

        if (this._flagFill) {
          changed.fill = this._fill && this._fill.id
            ? 'url(#' + this._fill.id + ')' : this._fill;
        }

        if (this._stroke && this._stroke._renderer) {
          this._stroke._update();
          svg[this._stroke._renderer.type].render.call(this._stroke, domElement, true);
        }

        if (this._flagStroke) {
          changed.stroke = this._stroke && this._stroke.id
            ? 'url(#' + this._stroke.id + ')' : this._stroke;
        }

        if (this._flagLinewidth) {
          changed['stroke-width'] = this._linewidth;
        }

        if (this._flagOpacity) {
          changed['stroke-opacity'] = this._opacity;
          changed['fill-opacity'] = this._opacity;
        }

        if (this._flagVisible) {
          changed.visibility = this._visible ? 'visible' : 'hidden';
        }

        if (this._flagCap) {
          changed['stroke-linecap'] = this._cap;
        }

        if (this._flagJoin) {
          changed['stroke-linejoin'] = this._join;
        }

        if (this._flagMiter) {
          changed['stroke-miterlimit'] = this._miter;
        }

        // If there is no attached DOM element yet,
        // create it with all necessary attributes.
        if (!this._renderer.elem) {

          changed.id = this.id;
          this._renderer.elem = svg.createElement('path', changed);
          domElement.appendChild(this._renderer.elem);

        // Otherwise apply all pending attributes
        } else {
          svg.setAttributes(this._renderer.elem, changed);
        }

        if (this._flagClip) {

          var clip = svg.getClip(this);
          var elem = this._renderer.elem;

          if (this._clip) {
            elem.removeAttribute('id');
            clip.setAttribute('id', this.id);
            clip.appendChild(elem);
          } else {
            clip.removeAttribute('id');
            elem.setAttribute('id', this.id);
            this.parent._renderer.elem.appendChild(elem); // TODO: should be insertBefore
          }

        }

        /**
         * Commented two-way functionality of clips / masks with groups and
         * polygons. Uncomment when this bug is fixed:
         * https://code.google.com/p/chromium/issues/detail?id=370951
         */

        // if (this._flagMask) {
        //   if (this._mask) {
        //     elem.setAttribute('clip-path', 'url(#' + this._mask.id + ')');
        //   } else {
        //     elem.removeAttribute('clip-path');
        //   }
        // }

        return this.flagReset();

      }

    },

    text: {

      render: function(domElement) {

        this._update();

        var changed = {};

        var flagMatrix = this._matrix.manual || this._flagMatrix;

        if (flagMatrix) {
          changed.transform = 'matrix(' + this._matrix.toString() + ')';
        }

        if (this._flagFamily) {
          changed['font-family'] = this._family;
        }
        if (this._flagSize) {
          changed['font-size'] = this._size;
        }
        if (this._flagLeading) {
          changed['line-height'] = this._leading;
        }
        if (this._flagAlignment) {
          changed['text-anchor'] = svg.alignments[this._alignment] || this._alignment;
        }
        if (this._flagBaseline) {
          changed['alignment-baseline'] = changed['dominant-baseline'] = this._baseline;
        }
        if (this._flagStyle) {
          changed['font-style'] = this._style;
        }
        if (this._flagWeight) {
          changed['font-weight'] = this._weight;
        }
        if (this._flagDecoration) {
          changed['text-decoration'] = this._decoration;
        }
        if (this._fill && this._fill._renderer) {
          this._fill._update();
          svg[this._fill._renderer.type].render.call(this._fill, domElement, true);
        }
        if (this._flagFill) {
          changed.fill = this._fill && this._fill.id
            ? 'url(#' + this._fill.id + ')' : this._fill;
        }
        if (this._stroke && this._stroke._renderer) {
          this._stroke._update();
          svg[this._stroke._renderer.type].render.call(this._stroke, domElement, true);
        }
        if (this._flagStroke) {
          changed.stroke = this._stroke && this._stroke.id
            ? 'url(#' + this._stroke.id + ')' : this._stroke;
        }
        if (this._flagLinewidth) {
          changed['stroke-width'] = this._linewidth;
        }
        if (this._flagOpacity) {
          changed.opacity = this._opacity;
        }
        if (this._flagVisible) {
          changed.visibility = this._visible ? 'visible' : 'hidden';
        }

        if (!this._renderer.elem) {

          changed.id = this.id;

          this._renderer.elem = svg.createElement('text', changed);
          domElement.defs.appendChild(this._renderer.elem);

        } else {

          svg.setAttributes(this._renderer.elem, changed);

        }

        if (this._flagClip) {

          var clip = svg.getClip(this);
          var elem = this._renderer.elem;

          if (this._clip) {
            elem.removeAttribute('id');
            clip.setAttribute('id', this.id);
            clip.appendChild(elem);
          } else {
            clip.removeAttribute('id');
            elem.setAttribute('id', this.id);
            this.parent._renderer.elem.appendChild(elem); // TODO: should be insertBefore
          }

        }

        if (this._flagValue) {
          this._renderer.elem.textContent = this._value;
        }

        return this.flagReset();

      }

    },

    'linear-gradient': {

      render: function(domElement, silent) {

        if (!silent) {
          this._update();
        }

        var changed = {};

        if (this._flagEndPoints) {
          changed.x1 = this.left._x;
          changed.y1 = this.left._y;
          changed.x2 = this.right._x;
          changed.y2 = this.right._y;
        }

        if (this._flagSpread) {
          changed.spreadMethod = this._spread;
        }

        // If there is no attached DOM element yet,
        // create it with all necessary attributes.
        if (!this._renderer.elem) {

          changed.id = this.id;
          changed.gradientUnits = 'userSpaceOnUse';
          this._renderer.elem = svg.createElement('linearGradient', changed);
          domElement.defs.appendChild(this._renderer.elem);

        // Otherwise apply all pending attributes
        } else {

          svg.setAttributes(this._renderer.elem, changed);

        }

        if (this._flagStops) {

          var lengthChanged = this._renderer.elem.childNodes.length
            !== this.stops.length;

          if (lengthChanged) {
            this._renderer.elem.childNodes.length = 0;
          }

          for (var i = 0; i < this.stops.length; i++) {

            var stop = this.stops[i];
            var attrs = {};

            if (stop._flagOffset) {
              attrs.offset = 100 * stop._offset + '%';
            }
            if (stop._flagColor) {
              attrs['stop-color'] = stop._color;
            }
            if (stop._flagOpacity) {
              attrs['stop-opacity'] = stop._opacity;
            }

            if (!stop._renderer.elem) {
              stop._renderer.elem = svg.createElement('stop', attrs);
            } else {
              svg.setAttributes(stop._renderer.elem, attrs);
            }

            if (lengthChanged) {
              this._renderer.elem.appendChild(stop._renderer.elem);
            }
            stop.flagReset();

          }

        }

        return this.flagReset();

      }

    },

    'radial-gradient': {

      render: function(domElement, silent) {

        if (!silent) {
          this._update();
        }

        var changed = {};

        if (this._flagCenter) {
          changed.cx = this.center._x;
          changed.cy = this.center._y;
        }
        if (this._flagFocal) {
          changed.fx = this.focal._x;
          changed.fy = this.focal._y;
        }

        if (this._flagRadius) {
          changed.r = this._radius;
        }

        if (this._flagSpread) {
          changed.spreadMethod = this._spread;
        }

        // If there is no attached DOM element yet,
        // create it with all necessary attributes.
        if (!this._renderer.elem) {

          changed.id = this.id;
          changed.gradientUnits = 'userSpaceOnUse';
          this._renderer.elem = svg.createElement('radialGradient', changed);
          domElement.defs.appendChild(this._renderer.elem);

        // Otherwise apply all pending attributes
        } else {

          svg.setAttributes(this._renderer.elem, changed);

        }

        if (this._flagStops) {

          var lengthChanged = this._renderer.elem.childNodes.length
            !== this.stops.length;

          if (lengthChanged) {
            this._renderer.elem.childNodes.length = 0;
          }

          for (var i = 0; i < this.stops.length; i++) {

            var stop = this.stops[i];
            var attrs = {};

            if (stop._flagOffset) {
              attrs.offset = 100 * stop._offset + '%';
            }
            if (stop._flagColor) {
              attrs['stop-color'] = stop._color;
            }
            if (stop._flagOpacity) {
              attrs['stop-opacity'] = stop._opacity;
            }

            if (!stop._renderer.elem) {
              stop._renderer.elem = svg.createElement('stop', attrs);
            } else {
              svg.setAttributes(stop._renderer.elem, attrs);
            }

            if (lengthChanged) {
              this._renderer.elem.appendChild(stop._renderer.elem);
            }
            stop.flagReset();

          }

        }

        return this.flagReset();

      }

    },

    texture: {

      render: function(domElement, silent) {

        if (!silent) {
          this._update();
        }

        var changed = {};
        var styles = { x: 0, y: 0 };
        var image = this.image;

        if (this._flagLoaded && this.loaded) {

          switch (image.nodeName.toLowerCase()) {

            case 'canvas':
              styles.href = styles['xlink:href'] = image.toDataURL('image/png');
              break;
            case 'img':
            case 'image':
              styles.href = styles['xlink:href'] = this.src;
              break;

          }

        }

        if (this._flagOffset || this._flagLoaded || this._flagScale) {

          changed.x = this._offset.x;
          changed.y = this._offset.y;

          if (image) {

            changed.x -= image.width / 2;
            changed.y -= image.height / 2;

            if (this._scale instanceof Two.Vector) {
              changed.x *= this._scale.x;
              changed.y *= this._scale.y;
            } else {
              changed.x *= this._scale;
              changed.y *= this._scale;
            }
          }

          if (changed.x > 0) {
            changed.x *= - 1;
          }
          if (changed.y > 0) {
            changed.y *= - 1;
          }

        }

        if (this._flagScale || this._flagLoaded || this._flagRepeat) {

          changed.width = 0;
          changed.height = 0;

          if (image) {

            styles.width = changed.width = image.width;
            styles.height = changed.height = image.height;

            // TODO: Hack / Bandaid
            switch (this._repeat) {
              case 'no-repeat':
                changed.width += 1;
                changed.height += 1;
                break;
            }

            if (this._scale instanceof Two.Vector) {
              changed.width *= this._scale.x;
              changed.height *= this._scale.y;
            } else {
              changed.width *= this._scale;
              changed.height *= this._scale;
            }
          }

        }

        if (this._flagScale || this._flagLoaded) {
          if (!this._renderer.image) {
            this._renderer.image = svg.createElement('image', styles);
          } else if (!_.isEmpty(styles)) {
            svg.setAttributes(this._renderer.image, styles);
          }
        }

        if (!this._renderer.elem) {

          changed.id = this.id;
          changed.patternUnits = 'userSpaceOnUse';
          this._renderer.elem = svg.createElement('pattern', changed);
          domElement.defs.appendChild(this._renderer.elem);

        } else if (!_.isEmpty(changed)) {

          svg.setAttributes(this._renderer.elem, changed);

        }

        if (this._renderer.elem && this._renderer.image && !this._renderer.appended) {
          this._renderer.elem.appendChild(this._renderer.image);
          this._renderer.appended = true;
        }

        return this.flagReset();

      }

    }

  };

  /**
   * @class
   */
  var Renderer = Two[Two.Types.svg] = function(params) {

    this.domElement = params.domElement || svg.createElement('svg');

    this.scene = new Two.Group();
    this.scene.parent = this;

    this.defs = svg.createElement('defs');
    this.domElement.appendChild(this.defs);
    this.domElement.defs = this.defs;
    this.domElement.style.overflow = 'hidden';

  };

  _.extend(Renderer, {

    Utils: svg

  });

  _.extend(Renderer.prototype, Two.Utils.Events, {

    setSize: function(width, height) {

      this.width = width;
      this.height = height;

      svg.setAttributes(this.domElement, {
        width: width,
        height: height
      });

      return this;

    },

    render: function() {

      svg.group.render.call(this.scene, this.domElement);

      return this;

    }

  });

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  /**
   * Constants
   */
  var mod = Two.Utils.mod, toFixed = Two.Utils.toFixed;
  var getRatio = Two.Utils.getRatio;
  var _ = Two.Utils;

  // Returns true if this is a non-transforming matrix
  var isDefaultMatrix = function (m) {
    return (m[0] == 1 && m[3] == 0 && m[1] == 0 && m[4] == 1 && m[2] == 0 && m[5] == 0);
  };

  var canvas = {

    isHidden: /(none|transparent)/i,

    alignments: {
      left: 'start',
      middle: 'center',
      right: 'end'
    },

    shim: function(elem) {
      elem.tagName = 'canvas';
      elem.nodeType = 1;
      return elem;
    },

    group: {

      renderChild: function(child) {
        canvas[child._renderer.type].render.call(child, this.ctx, true, this.clip);
      },

      render: function(ctx) {

        // TODO: Add a check here to only invoke _update if need be.
        this._update();

        var matrix = this._matrix.elements;
        var parent = this.parent;
        this._renderer.opacity = this._opacity * (parent && parent._renderer ? parent._renderer.opacity : 1);

        var defaultMatrix = isDefaultMatrix(matrix);

        var mask = this._mask;
        // var clip = this._clip;

        if (!this._renderer.context) {
          this._renderer.context = {};
        }

        this._renderer.context.ctx = ctx;
        // this._renderer.context.clip = clip;

        if (!defaultMatrix) {
          ctx.save();
          ctx.transform(matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);
        }

        if (mask) {
          canvas[mask._renderer.type].render.call(mask, ctx, true);
        }

        if (this.opacity > 0 && this.scale !== 0) {
          for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            canvas[child._renderer.type].render.call(child, ctx);
          }
        }

        if (!defaultMatrix) {
          ctx.restore();
        }

       /**
         * Commented two-way functionality of clips / masks with groups and
         * polygons. Uncomment when this bug is fixed:
         * https://code.google.com/p/chromium/issues/detail?id=370951
         */

        // if (clip) {
        //   ctx.clip();
        // }

        return this.flagReset();

      }

    },

    path: {

      render: function(ctx, forced, parentClipped) {

        var matrix, stroke, linewidth, fill, opacity, visible, cap, join, miter,
            closed, commands, length, last, next, prev, a, b, c, d, ux, uy, vx, vy,
            ar, bl, br, cl, x, y, mask, clip, defaultMatrix, isOffset;

        // TODO: Add a check here to only invoke _update if need be.
        this._update();

        matrix = this._matrix.elements;
        stroke = this._stroke;
        linewidth = this._linewidth;
        fill = this._fill;
        opacity = this._opacity * this.parent._renderer.opacity;
        visible = this._visible;
        cap = this._cap;
        join = this._join;
        miter = this._miter;
        closed = this._closed;
        commands = this._vertices; // Commands
        length = commands.length;
        last = length - 1;
        defaultMatrix = isDefaultMatrix(matrix);

        // mask = this._mask;
        clip = this._clip;

        if (!forced && (!visible || clip)) {
          return this;
        }

        // Transform
        if (!defaultMatrix) {
          ctx.save();
          ctx.transform(matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);
        }

       /**
         * Commented two-way functionality of clips / masks with groups and
         * polygons. Uncomment when this bug is fixed:
         * https://code.google.com/p/chromium/issues/detail?id=370951
         */

        // if (mask) {
        //   canvas[mask._renderer.type].render.call(mask, ctx, true);
        // }

        // Styles
        if (fill) {
          if (_.isString(fill)) {
            ctx.fillStyle = fill;
          } else {
            canvas[fill._renderer.type].render.call(fill, ctx);
            ctx.fillStyle = fill._renderer.effect;
          }
        }
        if (stroke) {
          if (_.isString(stroke)) {
            ctx.strokeStyle = stroke;
          } else {
            canvas[stroke._renderer.type].render.call(stroke, ctx);
            ctx.strokeStyle = stroke._renderer.effect;
          }
        }
        if (linewidth) {
          ctx.lineWidth = linewidth;
        }
        if (miter) {
          ctx.miterLimit = miter;
        }
        if (join) {
          ctx.lineJoin = join;
        }
        if (cap) {
          ctx.lineCap = cap;
        }
        if (_.isNumber(opacity)) {
          ctx.globalAlpha = opacity;
        }

        ctx.beginPath();

        for (var i = 0; i < commands.length; i++) {

          b = commands[i];

          x = toFixed(b._x);
          y = toFixed(b._y);

          switch (b._command) {

            case Two.Commands.close:
              ctx.closePath();
              break;

            case Two.Commands.curve:

              prev = closed ? mod(i - 1, length) : Math.max(i - 1, 0);
              next = closed ? mod(i + 1, length) : Math.min(i + 1, last);

              a = commands[prev];
              c = commands[next];
              ar = (a.controls && a.controls.right) || Two.Vector.zero;
              bl = (b.controls && b.controls.left) || Two.Vector.zero;

              if (a._relative) {
                vx = (ar.x + toFixed(a._x));
                vy = (ar.y + toFixed(a._y));
              } else {
                vx = toFixed(ar.x);
                vy = toFixed(ar.y);
              }

              if (b._relative) {
                ux = (bl.x + toFixed(b._x));
                uy = (bl.y + toFixed(b._y));
              } else {
                ux = toFixed(bl.x);
                uy = toFixed(bl.y);
              }

              ctx.bezierCurveTo(vx, vy, ux, uy, x, y);

              if (i >= last && closed) {

                c = d;

                br = (b.controls && b.controls.right) || Two.Vector.zero;
                cl = (c.controls && c.controls.left) || Two.Vector.zero;

                if (b._relative) {
                  vx = (br.x + toFixed(b._x));
                  vy = (br.y + toFixed(b._y));
                } else {
                  vx = toFixed(br.x);
                  vy = toFixed(br.y);
                }

                if (c._relative) {
                  ux = (cl.x + toFixed(c._x));
                  uy = (cl.y + toFixed(c._y));
                } else {
                  ux = toFixed(cl.x);
                  uy = toFixed(cl.y);
                }

                x = toFixed(c._x);
                y = toFixed(c._y);

                ctx.bezierCurveTo(vx, vy, ux, uy, x, y);

              }

              break;

            case Two.Commands.line:
              ctx.lineTo(x, y);
              break;

            case Two.Commands.move:
              d = b;
              ctx.moveTo(x, y);
              break;

          }
        }

        // Loose ends

        if (closed) {
          ctx.closePath();
        }

        if (!clip && !parentClipped) {
          if (!canvas.isHidden.test(fill)) {
            isOffset = fill._renderer && fill._renderer.offset
            if (isOffset) {
              ctx.save();
              ctx.translate(
                - fill._renderer.offset.x, - fill._renderer.offset.y);
              ctx.scale(fill._renderer.scale.x, fill._renderer.scale.y);
            }
            ctx.fill();
            if (isOffset) {
              ctx.restore();
            }
          }
          if (!canvas.isHidden.test(stroke)) {
            isOffset = stroke._renderer && stroke._renderer.offset;
            if (isOffset) {
              ctx.save();
              ctx.translate(
                - stroke._renderer.offset.x, - stroke._renderer.offset.y);
              ctx.scale(stroke._renderer.scale.x, stroke._renderer.scale.y);
              ctx.lineWidth = linewidth / stroke._renderer.scale.x;
            }
            ctx.stroke();
            if (isOffset) {
              ctx.restore();
            }
          }
        }

        if (!defaultMatrix) {
          ctx.restore();
        }

        if (clip && !parentClipped) {
          ctx.clip();
        }

        return this.flagReset();

      }

    },

    text: {

      render: function(ctx, forced, parentClipped) {

        // TODO: Add a check here to only invoke _update if need be.
        this._update();

        var matrix = this._matrix.elements;
        var stroke = this._stroke;
        var linewidth = this._linewidth;
        var fill = this._fill;
        var opacity = this._opacity * this.parent._renderer.opacity;
        var visible = this._visible;
        var defaultMatrix = isDefaultMatrix(matrix);
        var isOffset = fill._renderer && fill._renderer.offset
          && stroke._renderer && stroke._renderer.offset;

        var a, b, c, d, e, sx, sy;

        // mask = this._mask;
        var clip = this._clip;

        if (!forced && (!visible || clip)) {
          return this;
        }

        // Transform
        if (!defaultMatrix) {
          ctx.save();
          ctx.transform(matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);
        }

       /**
         * Commented two-way functionality of clips / masks with groups and
         * polygons. Uncomment when this bug is fixed:
         * https://code.google.com/p/chromium/issues/detail?id=370951
         */

        // if (mask) {
        //   canvas[mask._renderer.type].render.call(mask, ctx, true);
        // }

        if (!isOffset) {
          ctx.font = [this._style, this._weight, this._size + 'px/' +
            this._leading + 'px', this._family].join(' ');
        }

        ctx.textAlign = canvas.alignments[this._alignment] || this._alignment;
        ctx.textBaseline = this._baseline;

        // Styles
        if (fill) {
          if (_.isString(fill)) {
            ctx.fillStyle = fill;
          } else {
            canvas[fill._renderer.type].render.call(fill, ctx);
            ctx.fillStyle = fill._renderer.effect;
          }
        }
        if (stroke) {
          if (_.isString(stroke)) {
            ctx.strokeStyle = stroke;
          } else {
            canvas[stroke._renderer.type].render.call(stroke, ctx);
            ctx.strokeStyle = stroke._renderer.effect;
          }
        }
        if (linewidth) {
          ctx.lineWidth = linewidth;
        }
        if (_.isNumber(opacity)) {
          ctx.globalAlpha = opacity;
        }

        if (!clip && !parentClipped) {

          if (!canvas.isHidden.test(fill)) {

            if (fill._renderer && fill._renderer.offset) {

              sx = toFixed(fill._renderer.scale.x);
              sy = toFixed(fill._renderer.scale.y);

              ctx.save();
              ctx.translate( - toFixed(fill._renderer.offset.x),
                - toFixed(fill._renderer.offset.y));
              ctx.scale(sx, sy);

              a = this._size / fill._renderer.scale.y;
              b = this._leading / fill._renderer.scale.y;
              ctx.font = [this._style, this._weight, toFixed(a) + 'px/',
                toFixed(b) + 'px', this._family].join(' ');

              c = fill._renderer.offset.x / fill._renderer.scale.x;
              d = fill._renderer.offset.y / fill._renderer.scale.y;

              ctx.fillText(this.value, toFixed(c), toFixed(d));
              ctx.restore();

            } else {
              ctx.fillText(this.value, 0, 0);
            }

          }

          if (!canvas.isHidden.test(stroke)) {

            if (stroke._renderer && stroke._renderer.offset) {

              sx = toFixed(stroke._renderer.scale.x);
              sy = toFixed(stroke._renderer.scale.y);

              ctx.save();
              ctx.translate(- toFixed(stroke._renderer.offset.x),
                - toFixed(stroke._renderer.offset.y));
              ctx.scale(sx, sy);

              a = this._size / stroke._renderer.scale.y;
              b = this._leading / stroke._renderer.scale.y;
              ctx.font = [this._style, this._weight, toFixed(a) + 'px/',
                toFixed(b) + 'px', this._family].join(' ');

              c = stroke._renderer.offset.x / stroke._renderer.scale.x;
              d = stroke._renderer.offset.y / stroke._renderer.scale.y;
              e = linewidth / stroke._renderer.scale.x;

              ctx.lineWidth = toFixed(e);
              ctx.strokeText(this.value, toFixed(c), toFixed(d));
              ctx.restore();

            } else {
              ctx.strokeText(this.value, 0, 0);
            }
          }
        }

        if (!defaultMatrix) {
          ctx.restore();
        }

        // TODO: Test for text
        if (clip && !parentClipped) {
          ctx.clip();
        }

        return this.flagReset();

      }

    },

    'linear-gradient': {

      render: function(ctx) {

        this._update();

        if (!this._renderer.effect || this._flagEndPoints || this._flagStops) {

          this._renderer.effect = ctx.createLinearGradient(
            this.left._x, this.left._y,
            this.right._x, this.right._y
          );

          for (var i = 0; i < this.stops.length; i++) {
            var stop = this.stops[i];
            this._renderer.effect.addColorStop(stop._offset, stop._color);
          }

        }

        return this.flagReset();

      }

    },

    'radial-gradient': {

      render: function(ctx) {

        this._update();

        if (!this._renderer.effect || this._flagCenter || this._flagFocal
            || this._flagRadius || this._flagStops) {

          this._renderer.effect = ctx.createRadialGradient(
            this.center._x, this.center._y, 0,
            this.focal._x, this.focal._y, this._radius
          );

          for (var i = 0; i < this.stops.length; i++) {
            var stop = this.stops[i];
            this._renderer.effect.addColorStop(stop._offset, stop._color);
          }

        }

        return this.flagReset();

      }

    },

    texture: {

      render: function(ctx) {

        this._update();

        var image = this.image;
        var repeat;

        if (!this._renderer.effect || ((this._flagLoaded || this._flagImage || this._flagVideo || this._flagRepeat) && this.loaded)) {
          this._renderer.effect = ctx.createPattern(this.image, this._repeat);
        }

        if (this._flagOffset || this._flagLoaded || this._flagScale) {

          if (!(this._renderer.offset instanceof Two.Vector)) {
            this._renderer.offset = new Two.Vector();
          }

          this._renderer.offset.x = - this._offset.x;
          this._renderer.offset.y = - this._offset.y;

          if (image) {

            this._renderer.offset.x += image.width / 2;
            this._renderer.offset.y += image.height / 2;

            if (this._scale instanceof Two.Vector) {
              this._renderer.offset.x *= this._scale.x;
              this._renderer.offset.y *= this._scale.y;
            } else {
              this._renderer.offset.x *= this._scale;
              this._renderer.offset.y *= this._scale;
            }
          }

        }

        if (this._flagScale || this._flagLoaded) {

          if (!(this._renderer.scale instanceof Two.Vector)) {
            this._renderer.scale = new Two.Vector();
          }

          if (this._scale instanceof Two.Vector) {
            this._renderer.scale.copy(this._scale);
          } else {
            this._renderer.scale.set(this._scale, this._scale);
          }

        }

        return this.flagReset();

      }

    }

  };

  var Renderer = Two[Two.Types.canvas] = function(params) {
    // Smoothing property. Defaults to true
    // Set it to false when working with pixel art.
    // false can lead to better performance, since it would use a cheaper interpolation algorithm.
    // It might not make a big difference on GPU backed canvases.
    var smoothing = (params.smoothing !== false);
    this.domElement = params.domElement || document.createElement('canvas');
    this.ctx = this.domElement.getContext('2d');
    this.overdraw = params.overdraw || false;

    if (!_.isUndefined(this.ctx.imageSmoothingEnabled)) {
      this.ctx.imageSmoothingEnabled = smoothing;
    }

    // Everything drawn on the canvas needs to be added to the scene.
    this.scene = new Two.Group();
    this.scene.parent = this;
  };


  _.extend(Renderer, {

    Utils: canvas

  });

  _.extend(Renderer.prototype, Two.Utils.Events, {

    setSize: function(width, height, ratio) {

      this.width = width;
      this.height = height;

      this.ratio = _.isUndefined(ratio) ? getRatio(this.ctx) : ratio;

      this.domElement.width = width * this.ratio;
      this.domElement.height = height * this.ratio;

      if (this.domElement.style) {
        _.extend(this.domElement.style, {
          width: width + 'px',
          height: height + 'px'
        });
      }

      return this;

    },

    render: function() {

      var isOne = this.ratio === 1;

      if (!isOne) {
        this.ctx.save();
        this.ctx.scale(this.ratio, this.ratio);
      }

      if (!this.overdraw) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }

      canvas.group.render.call(this.scene, this.ctx);

      if (!isOne) {
        this.ctx.restore();
      }

      return this;

    }

  });

  function resetTransform(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  /**
   * Constants
   */

  var root = Two.root,
    multiplyMatrix = Two.Matrix.Multiply,
    mod = Two.Utils.mod,
    identity = [1, 0, 0, 0, 1, 0, 0, 0, 1],
    transformation = new Two.Array(9),
    getRatio = Two.Utils.getRatio,
    getComputedMatrix = Two.Utils.getComputedMatrix,
    toFixed = Two.Utils.toFixed,
    _ = Two.Utils;

  var webgl = {

    isHidden: /(none|transparent)/i,

    canvas: (root.document ? root.document.createElement('canvas') : { getContext: _.identity }),

    alignments: {
      left: 'start',
      middle: 'center',
      right: 'end'
    },

    matrix: new Two.Matrix(),

    uv: new Two.Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1
    ]),

    group: {

      removeChild: function(child, gl) {
        if (child.children) {
          for (var i = 0; i < child.children.length; i++) {
            webgl.group.removeChild(child.children[i], gl);
          }
          return;
        }
        // Deallocate texture to free up gl memory.
        gl.deleteTexture(child._renderer.texture);
        delete child._renderer.texture;
      },

      renderChild: function(child) {
        webgl[child._renderer.type].render.call(child, this.gl, this.program);
      },

      render: function(gl, program) {

        this._update();

        var parent = this.parent;
        var flagParentMatrix = (parent._matrix && parent._matrix.manual) || parent._flagMatrix;
        var flagMatrix = this._matrix.manual || this._flagMatrix;

        if (flagParentMatrix || flagMatrix) {

          if (!this._renderer.matrix) {
            this._renderer.matrix = new Two.Array(9);
          }

          // Reduce amount of object / array creation / deletion
          this._matrix.toArray(true, transformation);

          multiplyMatrix(transformation, parent._renderer.matrix, this._renderer.matrix);
          this._renderer.scale = this._scale * parent._renderer.scale;

          if (flagParentMatrix) {
            this._flagMatrix = true;
          }

        }

        if (this._mask) {

          gl.enable(gl.STENCIL_TEST);
          gl.stencilFunc(gl.ALWAYS, 1, 1);

          gl.colorMask(false, false, false, true);
          gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);

          webgl[this._mask._renderer.type].render.call(this._mask, gl, program, this);

          gl.colorMask(true, true, true, true);
          gl.stencilFunc(gl.NOTEQUAL, 0, 1);
          gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

        }

        this._flagOpacity = parent._flagOpacity || this._flagOpacity;

        this._renderer.opacity = this._opacity
          * (parent && parent._renderer ? parent._renderer.opacity : 1);

        if (this._flagSubtractions) {
          for (var i = 0; i < this.subtractions.length; i++) {
            webgl.group.removeChild(this.subtractions[i], gl);
          }
        }

        this.children.forEach(webgl.group.renderChild, {
          gl: gl,
          program: program
        });

        if (this._mask) {

          gl.colorMask(false, false, false, false);
          gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);

          webgl[this._mask._renderer.type].render.call(this._mask, gl, program, this);

          gl.colorMask(true, true, true, true);
          gl.stencilFunc(gl.NOTEQUAL, 0, 1);
          gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

          gl.disable(gl.STENCIL_TEST);

        }

        return this.flagReset();

      }

    },

    path: {

      updateCanvas: function(elem) {

        var next, prev, a, c, ux, uy, vx, vy, ar, bl, br, cl, x, y;
        var isOffset;

        var commands = elem._vertices;
        var canvas = this.canvas;
        var ctx = this.ctx;

        // Styles
        var scale = elem._renderer.scale;
        var stroke = elem._stroke;
        var linewidth = elem._linewidth;
        var fill = elem._fill;
        var opacity = elem._renderer.opacity || elem._opacity;
        var cap = elem._cap;
        var join = elem._join;
        var miter = elem._miter;
        var closed = elem._closed;
        var length = commands.length;
        var last = length - 1;

        canvas.width = Math.max(Math.ceil(elem._renderer.rect.width * scale), 1);
        canvas.height = Math.max(Math.ceil(elem._renderer.rect.height * scale), 1);

        var centroid = elem._renderer.rect.centroid;
        var cx = centroid.x;
        var cy = centroid.y;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (fill) {
          if (_.isString(fill)) {
            ctx.fillStyle = fill;
          } else {
            webgl[fill._renderer.type].render.call(fill, ctx, elem);
            ctx.fillStyle = fill._renderer.effect;
          }
        }
        if (stroke) {
          if (_.isString(stroke)) {
            ctx.strokeStyle = stroke;
          } else {
            webgl[stroke._renderer.type].render.call(stroke, ctx, elem);
            ctx.strokeStyle = stroke._renderer.effect;
          }
        }
        if (linewidth) {
          ctx.lineWidth = linewidth;
        }
        if (miter) {
          ctx.miterLimit = miter;
        }
        if (join) {
          ctx.lineJoin = join;
        }
        if (cap) {
          ctx.lineCap = cap;
        }
        if (_.isNumber(opacity)) {
          ctx.globalAlpha = opacity;
        }

        var d;
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(cx, cy);

        ctx.beginPath();
        for (var i = 0; i < commands.length; i++) {

          b = commands[i];

          x = toFixed(b._x);
          y = toFixed(b._y);

          switch (b._command) {

            case Two.Commands.close:
              ctx.closePath();
              break;

            case Two.Commands.curve:

              prev = closed ? mod(i - 1, length) : Math.max(i - 1, 0);
              next = closed ? mod(i + 1, length) : Math.min(i + 1, last);

              a = commands[prev];
              c = commands[next];
              ar = (a.controls && a.controls.right) || Two.Vector.zero;
              bl = (b.controls && b.controls.left) || Two.Vector.zero;

              if (a._relative) {
                vx = toFixed((ar.x + a._x));
                vy = toFixed((ar.y + a._y));
              } else {
                vx = toFixed(ar.x);
                vy = toFixed(ar.y);
              }

              if (b._relative) {
                ux = toFixed((bl.x + b._x));
                uy = toFixed((bl.y + b._y));
              } else {
                ux = toFixed(bl.x);
                uy = toFixed(bl.y);
              }

              ctx.bezierCurveTo(vx, vy, ux, uy, x, y);

              if (i >= last && closed) {

                c = d;

                br = (b.controls && b.controls.right) || Two.Vector.zero;
                cl = (c.controls && c.controls.left) || Two.Vector.zero;

                if (b._relative) {
                  vx = toFixed((br.x + b._x));
                  vy = toFixed((br.y + b._y));
                } else {
                  vx = toFixed(br.x);
                  vy = toFixed(br.y);
                }

                if (c._relative) {
                  ux = toFixed((cl.x + c._x));
                  uy = toFixed((cl.y + c._y));
                } else {
                  ux = toFixed(cl.x);
                  uy = toFixed(cl.y);
                }

                x = toFixed(c._x);
                y = toFixed(c._y);

                ctx.bezierCurveTo(vx, vy, ux, uy, x, y);

              }

              break;

            case Two.Commands.line:
              ctx.lineTo(x, y);
              break;

            case Two.Commands.move:
              d = b;
              ctx.moveTo(x, y);
              break;

          }

        }

        // Loose ends

        if (closed) {
          ctx.closePath();
        }

        if (!webgl.isHidden.test(fill)) {
          isOffset = fill._renderer && fill._renderer.offset
          if (isOffset) {
            ctx.save();
            ctx.translate(
              - fill._renderer.offset.x, - fill._renderer.offset.y);
            ctx.scale(fill._renderer.scale.x, fill._renderer.scale.y);
          }
          ctx.fill();
          if (isOffset) {
            ctx.restore();
          }
        }

        if (!webgl.isHidden.test(stroke)) {
          isOffset = stroke._renderer && stroke._renderer.offset;
          if (isOffset) {
            ctx.save();
            ctx.translate(
              - stroke._renderer.offset.x, - stroke._renderer.offset.y);
            ctx.scale(stroke._renderer.scale.x, stroke._renderer.scale.y);
            ctx.lineWidth = linewidth / stroke._renderer.scale.x;
          }
          ctx.stroke();
          if (isOffset) {
            ctx.restore();
          }
        }

        ctx.restore();

      },

      /**
       * Returns the rect of a set of verts. Typically takes vertices that are
       * "centered" around 0 and returns them to be anchored upper-left.
       */
      getBoundingClientRect: function(vertices, border, rect) {

        var left = Infinity, right = -Infinity,
            top = Infinity, bottom = -Infinity,
            width, height;

        vertices.forEach(function(v) {

          var x = v.x, y = v.y, controls = v.controls;
          var a, b, c, d, cl, cr;

          top = Math.min(y, top);
          left = Math.min(x, left);
          right = Math.max(x, right);
          bottom = Math.max(y, bottom);

          if (!v.controls) {
            return;
          }

          cl = controls.left;
          cr = controls.right;

          if (!cl || !cr) {
            return;
          }

          a = v._relative ? cl.x + x : cl.x;
          b = v._relative ? cl.y + y : cl.y;
          c = v._relative ? cr.x + x : cr.x;
          d = v._relative ? cr.y + y : cr.y;

          if (!a || !b || !c || !d) {
            return;
          }

          top = Math.min(b, d, top);
          left = Math.min(a, c, left);
          right = Math.max(a, c, right);
          bottom = Math.max(b, d, bottom);

        });

        // Expand borders

        if (_.isNumber(border)) {
          top -= border;
          left -= border;
          right += border;
          bottom += border;
        }

        width = right - left;
        height = bottom - top;

        rect.top = top;
        rect.left = left;
        rect.right = right;
        rect.bottom = bottom;
        rect.width = width;
        rect.height = height;

        if (!rect.centroid) {
          rect.centroid = {};
        }

        rect.centroid.x = - left;
        rect.centroid.y = - top;

      },

      render: function(gl, program, forcedParent) {

        if (!this._visible || !this._opacity) {
          return this;
        }

        this._update();

        // Calculate what changed

        var parent = this.parent;
        var flagParentMatrix = parent._matrix.manual || parent._flagMatrix;
        var flagMatrix = this._matrix.manual || this._flagMatrix;
        var flagTexture = this._flagVertices || this._flagFill
          || (this._fill instanceof Two.LinearGradient && (this._fill._flagSpread || this._fill._flagStops || this._fill._flagEndPoints))
          || (this._fill instanceof Two.RadialGradient && (this._fill._flagSpread || this._fill._flagStops || this._fill._flagRadius || this._fill._flagCenter || this._fill._flagFocal))
          || (this._fill instanceof Two.Texture && (this._fill._flagLoaded && this._fill.loaded || this._fill._flagOffset || this._fill._flagScale))
          || (this._stroke instanceof Two.LinearGradient && (this._stroke._flagSpread || this._stroke._flagStops || this._stroke._flagEndPoints))
          || (this._stroke instanceof Two.RadialGradient && (this._stroke._flagSpread || this._stroke._flagStops || this._stroke._flagRadius || this._stroke._flagCenter || this._stroke._flagFocal))
          || (this._stroke instanceof Two.Texture && (this._stroke._flagLoaded && this._stroke.loaded || this._stroke._flagOffset || this._fill._flagScale))
          || this._flagStroke || this._flagLinewidth || this._flagOpacity
          || parent._flagOpacity || this._flagVisible || this._flagCap
          || this._flagJoin || this._flagMiter || this._flagScale
          || !this._renderer.texture;

        if (flagParentMatrix || flagMatrix) {

          if (!this._renderer.matrix) {
            this._renderer.matrix = new Two.Array(9);
          }

          // Reduce amount of object / array creation / deletion

          this._matrix.toArray(true, transformation);

          multiplyMatrix(transformation, parent._renderer.matrix, this._renderer.matrix);
          this._renderer.scale = this._scale * parent._renderer.scale;

        }

        if (flagTexture) {

          if (!this._renderer.rect) {
            this._renderer.rect = {};
          }

          if (!this._renderer.triangles) {
            this._renderer.triangles = new Two.Array(12);
          }

          this._renderer.opacity = this._opacity * parent._renderer.opacity;

          webgl.path.getBoundingClientRect(this._vertices, this._linewidth, this._renderer.rect);
          webgl.getTriangles(this._renderer.rect, this._renderer.triangles);

          webgl.updateBuffer.call(webgl, gl, this, program);
          webgl.updateTexture.call(webgl, gl, this);

        }

        // if (this._mask) {
        //   webgl[this._mask._renderer.type].render.call(mask, gl, program, this);
        // }

        if (this._clip && !forcedParent) {
          return;
        }

        // Draw Texture

        gl.bindBuffer(gl.ARRAY_BUFFER, this._renderer.textureCoordsBuffer);

        gl.vertexAttribPointer(program.textureCoords, 2, gl.FLOAT, false, 0, 0);

        gl.bindTexture(gl.TEXTURE_2D, this._renderer.texture);


        // Draw Rect

        gl.uniformMatrix3fv(program.matrix, false, this._renderer.matrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._renderer.buffer);

        gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        return this.flagReset();

      }

    },

    text: {

      updateCanvas: function(elem) {

        var canvas = this.canvas;
        var ctx = this.ctx;

        // Styles
        var scale = elem._renderer.scale;
        var stroke = elem._stroke;
        var linewidth = elem._linewidth * scale;
        var fill = elem._fill;
        var opacity = elem._renderer.opacity || elem._opacity;

        canvas.width = Math.max(Math.ceil(elem._renderer.rect.width * scale), 1);
        canvas.height = Math.max(Math.ceil(elem._renderer.rect.height * scale), 1);

        var centroid = elem._renderer.rect.centroid;
        var cx = centroid.x;
        var cy = centroid.y;

        var a, b, c, d, e, sx, sy;
        var isOffset = fill._renderer && fill._renderer.offset
          && stroke._renderer && stroke._renderer.offset;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!isOffset) {
          ctx.font = [elem._style, elem._weight, elem._size + 'px/' +
            elem._leading + 'px', elem._family].join(' ');
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Styles
        if (fill) {
          if (_.isString(fill)) {
            ctx.fillStyle = fill;
          } else {
            webgl[fill._renderer.type].render.call(fill, ctx, elem);
            ctx.fillStyle = fill._renderer.effect;
          }
        }
        if (stroke) {
          if (_.isString(stroke)) {
            ctx.strokeStyle = stroke;
          } else {
            webgl[stroke._renderer.type].render.call(stroke, ctx, elem);
            ctx.strokeStyle = stroke._renderer.effect;
          }
        }
        if (linewidth) {
          ctx.lineWidth = linewidth;
        }
        if (_.isNumber(opacity)) {
          ctx.globalAlpha = opacity;
        }

        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(cx, cy);

        if (!webgl.isHidden.test(fill)) {

          if (fill._renderer && fill._renderer.offset) {

            sx = toFixed(fill._renderer.scale.x);
            sy = toFixed(fill._renderer.scale.y);

            ctx.save();
            ctx.translate( - toFixed(fill._renderer.offset.x),
              - toFixed(fill._renderer.offset.y));
            ctx.scale(sx, sy);

            a = elem._size / fill._renderer.scale.y;
            b = elem._leading / fill._renderer.scale.y;
            ctx.font = [elem._style, elem._weight, toFixed(a) + 'px/',
              toFixed(b) + 'px', elem._family].join(' ');

            c = fill._renderer.offset.x / fill._renderer.scale.x;
            d = fill._renderer.offset.y / fill._renderer.scale.y;

            ctx.fillText(elem.value, toFixed(c), toFixed(d));
            ctx.restore();

          } else {
            ctx.fillText(elem.value, 0, 0);
          }

        }

        if (!webgl.isHidden.test(stroke)) {

          if (stroke._renderer && stroke._renderer.offset) {

            sx = toFixed(stroke._renderer.scale.x);
            sy = toFixed(stroke._renderer.scale.y);

            ctx.save();
            ctx.translate(- toFixed(stroke._renderer.offset.x),
              - toFixed(stroke._renderer.offset.y));
            ctx.scale(sx, sy);

            a = elem._size / stroke._renderer.scale.y;
            b = elem._leading / stroke._renderer.scale.y;
            ctx.font = [elem._style, elem._weight, toFixed(a) + 'px/',
              toFixed(b) + 'px', elem._family].join(' ');

            c = stroke._renderer.offset.x / stroke._renderer.scale.x;
            d = stroke._renderer.offset.y / stroke._renderer.scale.y;
            e = linewidth / stroke._renderer.scale.x;

            ctx.lineWidth = toFixed(e);
            ctx.strokeText(elem.value, toFixed(c), toFixed(d));
            ctx.restore();

          } else {
            ctx.strokeText(elem.value, 0, 0);
          }

        }

        ctx.restore();

      },

      getBoundingClientRect: function(elem, rect) {

        var ctx = webgl.ctx;

        ctx.font = [elem._style, elem._weight, elem._size + 'px/' +
          elem._leading + 'px', elem._family].join(' ');

        ctx.textAlign = 'center';
        ctx.textBaseline = elem._baseline;

        // TODO: Estimate this better
        var width = ctx.measureText(elem._value).width;
        var height = Math.max(elem._size || elem._leading);

        if (this._linewidth && !webgl.isHidden.test(this._stroke)) {
          // width += this._linewidth; // TODO: Not sure if the `measure` calcs this.
          height += this._linewidth;
        }

        var w = width / 2;
        var h = height / 2;

        switch (webgl.alignments[elem._alignment] || elem._alignment) {

          case webgl.alignments.left:
            rect.left = 0;
            rect.right = width;
            break;
          case webgl.alignments.right:
            rect.left = - width;
            rect.right = 0;
            break;
          default:
            rect.left = - w;
            rect.right = w;
        }

        // TODO: Gradients aren't inherited...
        switch (elem._baseline) {
          case 'bottom':
            rect.top = - height;
            rect.bottom = 0;
            break;
          case 'top':
            rect.top = 0;
            rect.bottom = height;
            break;
          default:
            rect.top = - h;
            rect.bottom = h;
        }

        rect.width = width;
        rect.height = height;

        if (!rect.centroid) {
          rect.centroid = {};
        }

        // TODO:
        rect.centroid.x = w;
        rect.centroid.y = h;

      },

      render: function(gl, program, forcedParent) {

        if (!this._visible || !this._opacity) {
          return this;
        }

        this._update();

        // Calculate what changed

        var parent = this.parent;
        var flagParentMatrix = parent._matrix.manual || parent._flagMatrix;
        var flagMatrix = this._matrix.manual || this._flagMatrix;
        var flagTexture = this._flagVertices || this._flagFill
          || (this._fill instanceof Two.LinearGradient && (this._fill._flagSpread || this._fill._flagStops || this._fill._flagEndPoints))
          || (this._fill instanceof Two.RadialGradient && (this._fill._flagSpread || this._fill._flagStops || this._fill._flagRadius || this._fill._flagCenter || this._fill._flagFocal))
          || (this._fill instanceof Two.Texture && (this._fill._flagLoaded && this._fill.loaded))
          || (this._stroke instanceof Two.LinearGradient && (this._stroke._flagSpread || this._stroke._flagStops || this._stroke._flagEndPoints))
          || (this._stroke instanceof Two.RadialGradient && (this._stroke._flagSpread || this._stroke._flagStops || this._stroke._flagRadius || this._stroke._flagCenter || this._stroke._flagFocal))
          || (this._texture instanceof Two.Texture && (this._texture._flagLoaded && this._texture.loaded))
          || this._flagStroke || this._flagLinewidth || this._flagOpacity
          || parent._flagOpacity || this._flagVisible || this._flagScale
          || this._flagValue || this._flagFamily || this._flagSize
          || this._flagLeading || this._flagAlignment || this._flagBaseline
          || this._flagStyle || this._flagWeight || this._flagDecoration
          || !this._renderer.texture;

        if (flagParentMatrix || flagMatrix) {

          if (!this._renderer.matrix) {
            this._renderer.matrix = new Two.Array(9);
          }

          // Reduce amount of object / array creation / deletion

          this._matrix.toArray(true, transformation);

          multiplyMatrix(transformation, parent._renderer.matrix, this._renderer.matrix);
          this._renderer.scale = this._scale * parent._renderer.scale;

        }

        if (flagTexture) {

          if (!this._renderer.rect) {
            this._renderer.rect = {};
          }

          if (!this._renderer.triangles) {
            this._renderer.triangles = new Two.Array(12);
          }

          this._renderer.opacity = this._opacity * parent._renderer.opacity;

          webgl.text.getBoundingClientRect(this, this._renderer.rect);
          webgl.getTriangles(this._renderer.rect, this._renderer.triangles);

          webgl.updateBuffer.call(webgl, gl, this, program);
          webgl.updateTexture.call(webgl, gl, this);

        }

        // if (this._mask) {
        //   webgl[this._mask._renderer.type].render.call(mask, gl, program, this);
        // }

        if (this._clip && !forcedParent) {
          return;
        }

        // Draw Texture

        gl.bindBuffer(gl.ARRAY_BUFFER, this._renderer.textureCoordsBuffer);

        gl.vertexAttribPointer(program.textureCoords, 2, gl.FLOAT, false, 0, 0);

        gl.bindTexture(gl.TEXTURE_2D, this._renderer.texture);


        // Draw Rect

        gl.uniformMatrix3fv(program.matrix, false, this._renderer.matrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._renderer.buffer);

        gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        return this.flagReset();

      }

    },

    'linear-gradient': {

      render: function(ctx, elem) {

        if (!ctx.canvas.getContext('2d')) {
          return;
        }

        this._update();

        if (!this._renderer.effect || this._flagEndPoints || this._flagStops) {

          this._renderer.effect = ctx.createLinearGradient(
            this.left._x, this.left._y,
            this.right._x, this.right._y
          );

          for (var i = 0; i < this.stops.length; i++) {
            var stop = this.stops[i];
            this._renderer.effect.addColorStop(stop._offset, stop._color);
          }

        }

        return this.flagReset();

      }

    },

    'radial-gradient': {

      render: function(ctx, elem) {

        if (!ctx.canvas.getContext('2d')) {
          return;
        }

        this._update();

        if (!this._renderer.effect || this._flagCenter || this._flagFocal
            || this._flagRadius || this._flagStops) {

          this._renderer.effect = ctx.createRadialGradient(
            this.center._x, this.center._y, 0,
            this.focal._x, this.focal._y, this._radius
          );

          for (var i = 0; i < this.stops.length; i++) {
            var stop = this.stops[i];
            this._renderer.effect.addColorStop(stop._offset, stop._color);
          }

        }

        return this.flagReset();

      }

    },

    texture: {

      render: function(ctx, elem) {

        if (!ctx.canvas.getContext('2d')) {
          return;
        }

        this._update();

        var image = this.image;
        var repeat;

        if (!this._renderer.effect || ((this._flagLoaded || this._flagRepeat) && this.loaded)) {
          this._renderer.effect = ctx.createPattern(image, this._repeat);
        }

        if (this._flagOffset || this._flagLoaded || this._flagScale) {

          if (!(this._renderer.offset instanceof Two.Vector)) {
            this._renderer.offset = new Two.Vector();
          }

          this._renderer.offset.x = this._offset.x;
          this._renderer.offset.y = this._offset.y;

          if (image) {

            this._renderer.offset.x -= image.width / 2;
            this._renderer.offset.y += image.height / 2;

            if (this._scale instanceof Two.Vector) {
              this._renderer.offset.x *= this._scale.x;
              this._renderer.offset.y *= this._scale.y;
            } else {
              this._renderer.offset.x *= this._scale;
              this._renderer.offset.y *= this._scale;
            }
          }

        }

        if (this._flagScale || this._flagLoaded) {

          if (!(this._renderer.scale instanceof Two.Vector)) {
            this._renderer.scale = new Two.Vector();
          }

          if (this._scale instanceof Two.Vector) {
            this._renderer.scale.copy(this._scale);
          } else {
            this._renderer.scale.set(this._scale, this._scale);
          }

        }

        return this.flagReset();

      }

    },

    getTriangles: function(rect, triangles) {

      var top = rect.top,
          left = rect.left,
          right = rect.right,
          bottom = rect.bottom;

      // First Triangle

      triangles[0] = left;
      triangles[1] = top;

      triangles[2] = right;
      triangles[3] = top;

      triangles[4] = left;
      triangles[5] = bottom;

      // Second Triangle

      triangles[6] = left;
      triangles[7] = bottom;

      triangles[8] = right;
      triangles[9] = top;

      triangles[10] = right;
      triangles[11] = bottom;

    },

    updateTexture: function(gl, elem) {

      this[elem._renderer.type].updateCanvas.call(webgl, elem);

      if (elem._renderer.texture) {
        gl.deleteTexture(elem._renderer.texture);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, elem._renderer.textureCoordsBuffer);

      // TODO: Is this necessary every time or can we do once?
      // TODO: Create a registry for textures
      elem._renderer.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, elem._renderer.texture);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      if (this.canvas.width <= 0 || this.canvas.height <= 0) {
        return;
      }

      // Upload the image into the texture.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);

    },

    updateBuffer: function(gl, elem, program) {

      if (_.isObject(elem._renderer.buffer)) {
        gl.deleteBuffer(elem._renderer.buffer);
      }

      elem._renderer.buffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, elem._renderer.buffer);
      gl.enableVertexAttribArray(program.position);

      gl.bufferData(gl.ARRAY_BUFFER, elem._renderer.triangles, gl.STATIC_DRAW);

      if (_.isObject(elem._renderer.textureCoordsBuffer)) {
        gl.deleteBuffer(elem._renderer.textureCoordsBuffer);
      }

      elem._renderer.textureCoordsBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, elem._renderer.textureCoordsBuffer);
      gl.enableVertexAttribArray(program.textureCoords);

      gl.bufferData(gl.ARRAY_BUFFER, this.uv, gl.STATIC_DRAW);

    },

    program: {

      create: function(gl, shaders) {
        var program, linked, error;
        program = gl.createProgram();
        _.each(shaders, function(s) {
          gl.attachShader(program, s);
        });

        gl.linkProgram(program);
        linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
          error = gl.getProgramInfoLog(program);
          gl.deleteProgram(program);
          throw new Two.Utils.Error('unable to link program: ' + error);
        }

        return program;

      }

    },

    shaders: {

      create: function(gl, source, type) {
        var shader, compiled, error;
        shader = gl.createShader(gl[type]);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
          error = gl.getShaderInfoLog(shader);
          gl.deleteShader(shader);
          throw new Two.Utils.Error('unable to compile shader ' + shader + ': ' + error);
        }

        return shader;

      },

      types: {
        vertex: 'VERTEX_SHADER',
        fragment: 'FRAGMENT_SHADER'
      },

      vertex: [
        'attribute vec2 a_position;',
        'attribute vec2 a_textureCoords;',
        '',
        'uniform mat3 u_matrix;',
        'uniform vec2 u_resolution;',
        '',
        'varying vec2 v_textureCoords;',
        '',
        'void main() {',
        '   vec2 projected = (u_matrix * vec3(a_position, 1.0)).xy;',
        '   vec2 normal = projected / u_resolution;',
        '   vec2 clipspace = (normal * 2.0) - 1.0;',
        '',
        '   gl_Position = vec4(clipspace * vec2(1.0, -1.0), 0.0, 1.0);',
        '   v_textureCoords = a_textureCoords;',
        '}'
      ].join('\n'),

      fragment: [
        'precision mediump float;',
        '',
        'uniform sampler2D u_image;',
        'varying vec2 v_textureCoords;',
        '',
        'void main() {',
        '  gl_FragColor = texture2D(u_image, v_textureCoords);',
        '}'
      ].join('\n')

    },

    TextureRegistry: new Two.Registry()

  };

  webgl.ctx = webgl.canvas.getContext('2d');

  var Renderer = Two[Two.Types.webgl] = function(options) {

    var params, gl, vs, fs;
    this.domElement = options.domElement || document.createElement('canvas');

    // Everything drawn on the canvas needs to come from the stage.
    this.scene = new Two.Group();
    this.scene.parent = this;

    this._renderer = {
      matrix: new Two.Array(identity),
      scale: 1,
      opacity: 1
    };
    this._flagMatrix = true;

    // http://games.greggman.com/game/webgl-and-alpha/
    // http://www.khronos.org/registry/webgl/specs/latest/#5.2
    params = _.defaults(options || {}, {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      stencil: true,
      preserveDrawingBuffer: true,
      overdraw: false
    });

    this.overdraw = params.overdraw;

    gl = this.ctx = this.domElement.getContext('webgl', params) ||
      this.domElement.getContext('experimental-webgl', params);

    if (!this.ctx) {
      throw new Two.Utils.Error(
        'unable to create a webgl context. Try using another renderer.');
    }

    // Compile Base Shaders to draw in pixel space.
    vs = webgl.shaders.create(
      gl, webgl.shaders.vertex, webgl.shaders.types.vertex);
    fs = webgl.shaders.create(
      gl, webgl.shaders.fragment, webgl.shaders.types.fragment);

    this.program = webgl.program.create(gl, [vs, fs]);
    gl.useProgram(this.program);

    // Create and bind the drawing buffer

    // look up where the vertex data needs to go.
    this.program.position = gl.getAttribLocation(this.program, 'a_position');
    this.program.matrix = gl.getUniformLocation(this.program, 'u_matrix');
    this.program.textureCoords = gl.getAttribLocation(this.program, 'a_textureCoords');

    // Copied from Three.js WebGLRenderer
    gl.disable(gl.DEPTH_TEST);

    // Setup some initial statements of the gl context
    gl.enable(gl.BLEND);

    // https://code.google.com/p/chromium/issues/detail?id=316393
    // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, gl.TRUE);

    gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE, gl.ONE_MINUS_SRC_ALPHA );

  };

  _.extend(Renderer, {

    Utils: webgl

  });

  _.extend(Renderer.prototype, Two.Utils.Events, {

    setSize: function(width, height, ratio) {

      this.width = width;
      this.height = height;

      this.ratio = _.isUndefined(ratio) ? getRatio(this.ctx) : ratio;

      this.domElement.width = width * this.ratio;
      this.domElement.height = height * this.ratio;

      _.extend(this.domElement.style, {
        width: width + 'px',
        height: height + 'px'
      });

      width *= this.ratio;
      height *= this.ratio;

      // Set for this.stage parent scaling to account for HDPI
      this._renderer.matrix[0] = this._renderer.matrix[4] = this._renderer.scale = this.ratio;

      this._flagMatrix = true;

      this.ctx.viewport(0, 0, width, height);

      var resolutionLocation = this.ctx.getUniformLocation(
        this.program, 'u_resolution');
      this.ctx.uniform2f(resolutionLocation, width, height);

      return this;

    },

    render: function() {

      var gl = this.ctx;

      if (!this.overdraw) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      webgl.group.render.call(this.scene, gl, this.program);
      this._flagMatrix = false;

      return this;

    }

  });

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;

  var Shape = Two.Shape = function() {

    // Private object for renderer specific variables.
    this._renderer = {};
    this._renderer.flagMatrix = _.bind(Shape.FlagMatrix, this);
    this.isShape = true;

    this.id = Two.Identifier + Two.uniqueId();
    this.classList = [];

    // Define matrix properties which all inherited
    // objects of Shape have.

    this._matrix = new Two.Matrix();

    this.translation = new Two.Vector();
    this.rotation = 0;
    this.scale = 1;

  };

  _.extend(Shape, {

    FlagMatrix: function() {
      this._flagMatrix = true;
    },

    MakeObservable: function(object) {

      Object.defineProperty(object, 'translation', {
        enumerable: true,
        get: function() {
          return this._translation;
        },
        set: function(v) {
          if (this._translation) {
            this._translation.unbind(Two.Events.change, this._renderer.flagMatrix);
          }
          this._translation = v;
          this._translation.bind(Two.Events.change, this._renderer.flagMatrix);
          Shape.FlagMatrix.call(this);
        }
      });

      Object.defineProperty(object, 'rotation', {
        enumerable: true,
        get: function() {
          return this._rotation;
        },
        set: function(v) {
          this._rotation = v;
          this._flagMatrix = true;
        }
      });

      Object.defineProperty(object, 'scale', {
        enumerable: true,
        get: function() {
          return this._scale;
        },
        set: function(v) {

          if (this._scale instanceof Two.Vector) {
            this._scale.unbind(Two.Events.change, this._renderer.flagMatrix);
          }

          this._scale = v;

          if (this._scale instanceof Two.Vector) {
            this._scale.bind(Two.Events.change, this._renderer.flagMatrix);
          }

          this._flagMatrix = true;
          this._flagScale = true;

        }
      });

    }

  });

  _.extend(Shape.prototype, Two.Utils.Events, {

    // Flags

    _flagMatrix: true,
    _flagScale: false,

    // _flagMask: false,
    // _flagClip: false,

    // Underlying Properties

    _rotation: 0,
    _scale: 1,
    _translation: null,

    // _mask: null,
    // _clip: false,

    addTo: function(group) {
      group.add(this);
      return this;
    },

    clone: function() {
      var clone = new Shape();
      clone.translation.copy(this.translation);
      clone.rotation = this.rotation;
      clone.scale = this.scale;
      _.each(Shape.Properties, function(k) {
        clone[k] = this[k];
      }, this);
      return clone._update();
    },

    /**
     * To be called before render that calculates and collates all information
     * to be as up-to-date as possible for the render. Called once a frame.
     */
    _update: function(deep) {

      if (!this._matrix.manual && this._flagMatrix) {

        this._matrix
          .identity()
          .translate(this.translation.x, this.translation.y);

          if (this._scale instanceof Two.Vector) {
            this._matrix.scale(this._scale.x, this._scale.y);
          } else {
            this._matrix.scale(this._scale);
          }

          this._matrix.rotate(this.rotation);

      }

      if (deep) {
        // Bubble up to parents mainly for `getBoundingClientRect` method.
        if (this.parent && this.parent._update) {
          this.parent._update();
        }
      }

      return this;

    },

    flagReset: function() {

      this._flagMatrix = this._flagScale = false;

      return this;

    }

  });

  Shape.MakeObservable(Shape.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  /**
   * Constants
   */

  var min = Math.min, max = Math.max, round = Math.round,
    getComputedMatrix = Two.Utils.getComputedMatrix;

  var commands = {};
  var _ = Two.Utils;

  _.each(Two.Commands, function(v, k) {
    commands[k] = new RegExp(v);
  });

  var Path = Two.Path = function(vertices, closed, curved, manual) {

    Two.Shape.call(this);

    this._renderer.type = 'path';
    this._renderer.flagVertices = _.bind(Path.FlagVertices, this);
    this._renderer.bindVertices = _.bind(Path.BindVertices, this);
    this._renderer.unbindVertices = _.bind(Path.UnbindVertices, this);

    this._renderer.flagFill = _.bind(Path.FlagFill, this);
    this._renderer.flagStroke = _.bind(Path.FlagStroke, this);

    this._closed = !!closed;
    this._curved = !!curved;

    this.beginning = 0;
    this.ending = 1;

    // Style properties

    this.fill = '#fff';
    this.stroke = '#000';
    this.linewidth = 1.0;
    this.opacity = 1.0;
    this.visible = true;

    this.cap = 'butt';      // Default of Adobe Illustrator
    this.join = 'miter';    // Default of Adobe Illustrator
    this.miter = 4;         // Default of Adobe Illustrator

    this._vertices = [];
    this.vertices = vertices;

    // Determines whether or not two.js should calculate curves, lines, and
    // commands automatically for you or to let the developer manipulate them
    // for themselves.
    this.automatic = !manual;

  };

  _.extend(Path, {

    Properties: [
      'fill',
      'stroke',
      'linewidth',
      'opacity',
      'visible',
      'cap',
      'join',
      'miter',

      'closed',
      'curved',
      'automatic',
      'beginning',
      'ending'
    ],

    FlagVertices: function() {
      this._flagVertices = true;
      this._flagLength = true;
    },

    BindVertices: function(items) {

      // This function is called a lot
      // when importing a large SVG
      var i = items.length;
      while (i--) {
        items[i].bind(Two.Events.change, this._renderer.flagVertices);
      }

      this._renderer.flagVertices();

    },

    UnbindVertices: function(items) {

      var i = items.length;
      while (i--) {
        items[i].unbind(Two.Events.change, this._renderer.flagVertices);
      }

      this._renderer.flagVertices();

    },

    FlagFill: function() {
      this._flagFill = true;
    },

    FlagStroke: function() {
      this._flagStroke = true;
    },

    MakeObservable: function(object) {

      Two.Shape.MakeObservable(object);

      // Only the 6 defined properties are flagged like this. The subsequent
      // properties behave differently and need to be hand written.
      _.each(Path.Properties.slice(2, 8), Two.Utils.defineProperty, object);

      Object.defineProperty(object, 'fill', {
        enumerable: true,
        get: function() {
          return this._fill;
        },
        set: function(f) {

          if (this._fill instanceof Two.Gradient
            || this._fill instanceof Two.LinearGradient
            || this._fill instanceof Two.RadialGradient
            || this._fill instanceof Two.Texture) {
            this._fill.unbind(Two.Events.change, this._renderer.flagFill);
          }

          this._fill = f;
          this._flagFill = true;

          if (this._fill instanceof Two.Gradient
            || this._fill instanceof Two.LinearGradient
            || this._fill instanceof Two.RadialGradient
            || this._fill instanceof Two.Texture) {
            this._fill.bind(Two.Events.change, this._renderer.flagFill);
          }

        }
      });

      Object.defineProperty(object, 'stroke', {
        enumerable: true,
        get: function() {
          return this._stroke;
        },
        set: function(f) {

          if (this._stroke instanceof Two.Gradient
            || this._stroke instanceof Two.LinearGradient
            || this._stroke instanceof Two.RadialGradient
            || this._stroke instanceof Two.Texture) {
            this._stroke.unbind(Two.Events.change, this._renderer.flagStroke);
          }

          this._stroke = f;
          this._flagStroke = true;

          if (this._stroke instanceof Two.Gradient
            || this._stroke instanceof Two.LinearGradient
            || this._stroke instanceof Two.RadialGradient
            || this._stroke instanceof Two.Texture) {
            this._stroke.bind(Two.Events.change, this._renderer.flagStroke);
          }

        }
      });

      Object.defineProperty(object, 'length', {
        get: function() {
          if (this._flagLength) {
            this._updateLength();
          }
          return this._length;
        }
      });

      Object.defineProperty(object, 'closed', {
        enumerable: true,
        get: function() {
          return this._closed;
        },
        set: function(v) {
          this._closed = !!v;
          this._flagVertices = true;
        }
      });

      Object.defineProperty(object, 'curved', {
        enumerable: true,
        get: function() {
          return this._curved;
        },
        set: function(v) {
          this._curved = !!v;
          this._flagVertices = true;
        }
      });

      Object.defineProperty(object, 'automatic', {
        enumerable: true,
        get: function() {
          return this._automatic;
        },
        set: function(v) {
          if (v === this._automatic) {
            return;
          }
          this._automatic = !!v;
          var method = this._automatic ? 'ignore' : 'listen';
          _.each(this.vertices, function(v) {
            v[method]();
          });
        }
      });

      Object.defineProperty(object, 'beginning', {
        enumerable: true,
        get: function() {
          return this._beginning;
        },
        set: function(v) {
          this._beginning = v;
          this._flagVertices = true;
        }
      });

      Object.defineProperty(object, 'ending', {
        enumerable: true,
        get: function() {
          return this._ending;
        },
        set: function(v) {
          this._ending = v;
          this._flagVertices = true;
        }
      });

      Object.defineProperty(object, 'vertices', {

        enumerable: true,

        get: function() {
          return this._collection;
        },

        set: function(vertices) {

          var updateVertices = this._renderer.flagVertices;
          var bindVertices = this._renderer.bindVertices;
          var unbindVertices = this._renderer.unbindVertices;

          // Remove previous listeners
          if (this._collection) {
            this._collection
              .unbind(Two.Events.insert, bindVertices)
              .unbind(Two.Events.remove, unbindVertices);
          }

          // Create new Collection with copy of vertices
          this._collection = new Two.Utils.Collection((vertices || []).slice(0));

          // Listen for Collection changes and bind / unbind
          this._collection
            .bind(Two.Events.insert, bindVertices)
            .bind(Two.Events.remove, unbindVertices);

          // Bind Initial Vertices
          bindVertices(this._collection);

        }

      });

      Object.defineProperty(object, 'clip', {
        enumerable: true,
        get: function() {
          return this._clip;
        },
        set: function(v) {
          this._clip = v;
          this._flagClip = true;
        }
      });

    }

  });

  _.extend(Path.prototype, Two.Shape.prototype, {

    // Flags
    // http://en.wikipedia.org/wiki/Flag

    _flagVertices: true,
    _flagLength: true,

    _flagFill: true,
    _flagStroke: true,
    _flagLinewidth: true,
    _flagOpacity: true,
    _flagVisible: true,

    _flagCap: true,
    _flagJoin: true,
    _flagMiter: true,

    _flagClip: false,

    // Underlying Properties

    _length: 0,

    _fill: '#fff',
    _stroke: '#000',
    _linewidth: 1.0,
    _opacity: 1.0,
    _visible: true,

    _cap: 'round',
    _join: 'round',
    _miter: 4,

    _closed: true,
    _curved: false,
    _automatic: true,
    _beginning: 0,
    _ending: 1.0,

    _clip: false,

    clone: function(parent) {

      parent = parent || this.parent;

      var points = _.map(this.vertices, function(v) {
        return v.clone();
      });

      var clone = new Path(points, this.closed, this.curved, !this.automatic);

      _.each(Two.Path.Properties, function(k) {
        clone[k] = this[k];
      }, this);

      clone.translation.copy(this.translation);
      clone.rotation = this.rotation;
      clone.scale = this.scale;

      if (parent) {
        parent.add(clone);
      }

      return clone;

    },

    toObject: function() {

      var result = {
        vertices: _.map(this.vertices, function(v) {
          return v.toObject();
        })
      };

      _.each(Two.Shape.Properties, function(k) {
        result[k] = this[k];
      }, this);

      result.translation = this.translation.toObject;
      result.rotation = this.rotation;
      result.scale = this.scale;

      return result;

    },

    noFill: function() {
      this.fill = 'transparent';
      return this;
    },

    noStroke: function() {
      this.stroke = 'transparent';
      return this;
    },

    /**
     * Orient the vertices of the shape to the upper lefthand
     * corner of the path.
     */
    corner: function() {

      var rect = this.getBoundingClientRect(true);

      rect.centroid = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      _.each(this.vertices, function(v) {
        v.addSelf(rect.centroid);
      });

      return this;

    },

    /**
     * Orient the vertices of the shape to the center of the
     * path.
     */
    center: function() {

      var rect = this.getBoundingClientRect(true);

      rect.centroid = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      _.each(this.vertices, function(v) {
        v.subSelf(rect.centroid);
      });

      // this.translation.addSelf(rect.centroid);

      return this;

    },

    /**
     * Remove self from the scene / parent.
     */
    remove: function() {

      if (!this.parent) {
        return this;
      }

      this.parent.remove(this);

      return this;

    },

    /**
     * Return an object with top, left, right, bottom, width, and height
     * parameters of the group.
     */
    getBoundingClientRect: function(shallow) {
      var matrix, border, l, x, y, i, v;

      var left = Infinity, right = -Infinity,
          top = Infinity, bottom = -Infinity;

      // TODO: Update this to not __always__ update. Just when it needs to.
      this._update(true);

      matrix = !!shallow ? this._matrix : getComputedMatrix(this);

      border = this.linewidth / 2;
      l = this._vertices.length;

      if (l <= 0) {
        v = matrix.multiply(0, 0, 1);
        return {
          top: v.y,
          left: v.x,
          right: v.x,
          bottom: v.y,
          width: 0,
          height: 0
        };
      }

      for (i = 0; i < l; i++) {
        v = this._vertices[i];

        x = v.x;
        y = v.y;

        v = matrix.multiply(x, y, 1);
        top = min(v.y - border, top);
        left = min(v.x - border, left);
        right = max(v.x + border, right);
        bottom = max(v.y + border, bottom);
      }

      return {
        top: top,
        left: left,
        right: right,
        bottom: bottom,
        width: right - left,
        height: bottom - top
      };

    },

    /**
     * Given a float `t` from 0 to 1, return a point or assign a passed `obj`'s
     * coordinates to that percentage on this Two.Path's curve.
     */
    getPointAt: function(t, obj) {
      var ia, ib;
      var x, x1, x2, x3, x4, y, y1, y2, y3, y4, left, right;
      var target = this.length * Math.min(Math.max(t, 0), 1);
      var length = this.vertices.length;
      var last = length - 1;

      var a = null;
      var b = null;

      for (var i = 0, l = this._lengths.length, sum = 0; i < l; i++) {

        if (sum + this._lengths[i] >= target) {

          if (this._closed) {
            ia = Two.Utils.mod(i, length);
            ib = Two.Utils.mod(i - 1, length);
            if (i === 0) {
              ia = ib;
              ib = i;
            }
          } else {
            ia = i;
            ib = Math.min(Math.max(i - 1, 0), last);
          }

          a = this.vertices[ia];
          b = this.vertices[ib];
          target -= sum;
          if (this._lengths[i] !== 0) {
            t = target / this._lengths[i];
          }

          break;

        }

        sum += this._lengths[i];

      }

      // console.log(sum, a.command, b.command);

      if (_.isNull(a) || _.isNull(b)) {
        return null;
      }

      right = b.controls && b.controls.right;
      left = a.controls && a.controls.left;

      x1 = b.x;
      y1 = b.y;
      x2 = (right || b).x;
      y2 = (right || b).y;
      x3 = (left || a).x;
      y3 = (left || a).y;
      x4 = a.x;
      y4 = a.y;

      if (right && b._relative) {
        x2 += b.x;
        y2 += b.y;
      }

      if (left && a._relative) {
        x3 += a.x;
        y3 += a.y;
      }

      x = Two.Utils.getPointOnCubicBezier(t, x1, x2, x3, x4);
      y = Two.Utils.getPointOnCubicBezier(t, y1, y2, y3, y4);

      if (_.isObject(obj)) {
        obj.x = x;
        obj.y = y;
        return obj;
      }

      return new Two.Vector(x, y);

    },

    /**
     * Based on closed / curved and sorting of vertices plot where all points
     * should be and where the respective handles should be too.
     */
    plot: function() {

      if (this.curved) {
        Two.Utils.getCurveFromPoints(this._vertices, this.closed);
        return this;
      }

      for (var i = 0; i < this._vertices.length; i++) {
        this._vertices[i]._command = i === 0 ? Two.Commands.move : Two.Commands.line;
      }

      return this;

    },

    subdivide: function(limit) {
      //TODO: DRYness (function below)
      this._update();

      var last = this.vertices.length - 1;
      var b = this.vertices[last];
      var closed = this._closed || this.vertices[last]._command === Two.Commands.close;
      var points = [];
      _.each(this.vertices, function(a, i) {

        if (i <= 0 && !closed) {
          b = a;
          return;
        }

        if (a.command === Two.Commands.move) {
          points.push(new Two.Anchor(b.x, b.y));
          if (i > 0) {
            points[points.length - 1].command = Two.Commands.line;
          }
          b = a;
          return;
        }

        var verts = getSubdivisions(a, b, limit);
        points = points.concat(verts);

        // Assign commands to all the verts
        _.each(verts, function(v, i) {
          if (i <= 0 && b.command === Two.Commands.move) {
            v.command = Two.Commands.move;
          } else {
            v.command = Two.Commands.line;
          }
        });

        if (i >= last) {

          // TODO: Add check if the two vectors in question are the same values.
          if (this._closed && this._automatic) {

            b = a;

            verts = getSubdivisions(a, b, limit);
            points = points.concat(verts);

            // Assign commands to all the verts
            _.each(verts, function(v, i) {
              if (i <= 0 && b.command === Two.Commands.move) {
                v.command = Two.Commands.move;
              } else {
                v.command = Two.Commands.line;
              }
            });

          } else if (closed) {
            points.push(new Two.Anchor(a.x, a.y));
          }

          points[points.length - 1].command = closed ? Two.Commands.close : Two.Commands.line;

        }

        b = a;

      }, this);

      this._automatic = false;
      this._curved = false;
      this.vertices = points;

      return this;

    },

    _updateLength: function(limit) {
      //TODO: DRYness (function above)
      this._update();

      var length = this.vertices.length;
      var last = length - 1;
      var b = this.vertices[last];
      var closed = this._closed || this.vertices[last]._command === Two.Commands.close;
      var sum = 0;

      if (_.isUndefined(this._lengths)) {
        this._lengths = [];
      }

      _.each(this.vertices, function(a, i) {

        if ((i <= 0 && !closed) || a.command === Two.Commands.move) {
          b = a;
          this._lengths[i] = 0;
          return;
        }

        this._lengths[i] = getCurveLength(a, b, limit);
        sum += this._lengths[i];

        if (i >= last && closed) {

          b = this.vertices[(i + 1) % length];

          this._lengths[i + 1] = getCurveLength(a, b, limit);
          sum += this._lengths[i + 1];

        }

        b = a;

      }, this);

      this._length = sum;

      return this;

    },

    _update: function() {

      if (this._flagVertices) {

        var l = this.vertices.length;
        var last = l - 1, v;

        // TODO: Should clamp this so that `ia` and `ib`
        // cannot select non-verts.
        var ia = round((this._beginning) * last);
        var ib = round((this._ending) * last);

        this._vertices.length = 0;

        for (var i = ia; i < ib + 1; i++) {
          v = this.vertices[i];
          this._vertices.push(v);
        }

        if (this._automatic) {
          this.plot();
        }

      }

      Two.Shape.prototype._update.apply(this, arguments);

      return this;

    },

    flagReset: function() {

      this._flagVertices =  this._flagFill =  this._flagStroke =
         this._flagLinewidth = this._flagOpacity = this._flagVisible =
         this._flagCap = this._flagJoin = this._flagMiter =
         this._flagClip = false;

      Two.Shape.prototype.flagReset.call(this);

      return this;

    }

  });

  Path.MakeObservable(Path.prototype);

  /**
   * Utility functions
   */

  function getCurveLength(a, b, limit) {
    // TODO: DRYness
    var x1, x2, x3, x4, y1, y2, y3, y4;

    var right = b.controls && b.controls.right;
    var left = a.controls && a.controls.left;

    x1 = b.x;
    y1 = b.y;
    x2 = (right || b).x;
    y2 = (right || b).y;
    x3 = (left || a).x;
    y3 = (left || a).y;
    x4 = a.x;
    y4 = a.y;

    if (right && b._relative) {
      x2 += b.x;
      y2 += b.y;
    }

    if (left && a._relative) {
      x3 += a.x;
      y3 += a.y;
    }

    return Two.Utils.getCurveLength(x1, y1, x2, y2, x3, y3, x4, y4, limit);

  }

  function getSubdivisions(a, b, limit) {
    // TODO: DRYness
    var x1, x2, x3, x4, y1, y2, y3, y4;

    var right = b.controls && b.controls.right;
    var left = a.controls && a.controls.left;

    x1 = b.x;
    y1 = b.y;
    x2 = (right || b).x;
    y2 = (right || b).y;
    x3 = (left || a).x;
    y3 = (left || a).y;
    x4 = a.x;
    y4 = a.y;

    if (right && b._relative) {
      x2 += b.x;
      y2 += b.y;
    }

    if (left && a._relative) {
      x3 += a.x;
      y3 += a.y;
    }

    return Two.Utils.subdivide(x1, y1, x2, y2, x3, y3, x4, y4, limit);

  }

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var Path = Two.Path;
  var _ = Two.Utils;

  var Line = Two.Line = function(x1, y1, x2, y2) {

    var width = x2 - x1;
    var height = y2 - y1;

    var w2 = width / 2;
    var h2 = height / 2;

    Path.call(this, [
        new Two.Anchor(- w2, - h2),
        new Two.Anchor(w2, h2)
    ]);

    this.translation.set(x1 + w2, y1 + h2);

  };

  _.extend(Line.prototype, Path.prototype);

  Path.MakeObservable(Line.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var Path = Two.Path;
  var _ = Two.Utils;

  var Rectangle = Two.Rectangle = function(x, y, width, height) {

    Path.call(this, [
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor()
    ], true);

    this.width = width;
    this.height = height;
    this._update();

    this.translation.set(x, y);

  };

  _.extend(Rectangle, {

    Properties: ['width', 'height'],

    MakeObservable: function(obj) {
      Path.MakeObservable(obj);
      _.each(Rectangle.Properties, Two.Utils.defineProperty, obj);
    }

  });

  _.extend(Rectangle.prototype, Path.prototype, {

    _width: 0,
    _height: 0,

    _flagWidth: 0,
    _flagHeight: 0,

    _update: function() {

      if (this._flagWidth || this._flagHeight) {

        var xr = this._width / 2;
        var yr = this._height / 2;

        this.vertices[0].set(-xr, -yr);
        this.vertices[1].set(xr, -yr);
        this.vertices[2].set(xr, yr);
        this.vertices[3].set(-xr, yr);

      }

      Path.prototype._update.call(this);

      return this;

    },

    flagReset: function() {

      this._flagWidth = this._flagHeight = false;
      Path.prototype.flagReset.call(this);

      return this;

    }

  });

  Rectangle.MakeObservable(Rectangle.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var Path = Two.Path, TWO_PI = Math.PI * 2, cos = Math.cos, sin = Math.sin;
  var _ = Two.Utils;

  var Ellipse = Two.Ellipse = function(ox, oy, rx, ry) {

    if (!_.isNumber(ry)) {
      ry = rx;
    }

    var amount = Two.Resolution;

    var points = _.map(_.range(amount), function(i) {
      return new Two.Anchor();
    }, this);

    Path.call(this, points, true, true);

    this.width = rx * 2;
    this.height = ry * 2;

    this._update();
    this.translation.set(ox, oy);

  };

  _.extend(Ellipse, {

    Properties: ['width', 'height'],

    MakeObservable: function(obj) {

      Path.MakeObservable(obj);
      _.each(Ellipse.Properties, Two.Utils.defineProperty, obj);

    }

  });

  _.extend(Ellipse.prototype, Path.prototype, {

    _width: 0,
    _height: 0,

    _flagWidth: false,
    _flagHeight: false,

    _update: function() {

      if (this._flagWidth || this._flagHeight) {
        for (var i = 0, l = this.vertices.length; i < l; i++) {
          var pct = i / l;
          var theta = pct * TWO_PI;
          var x = this._width * cos(theta) / 2;
          var y = this._height * sin(theta) / 2;
          this.vertices[i].set(x, y);
        }
      }

      Path.prototype._update.call(this);
      return this;

    },

    flagReset: function() {

      this._flagWidth = this._flagHeight = false;

      Path.prototype.flagReset.call(this);
      return this;

    }

  });

  Ellipse.MakeObservable(Ellipse.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var Path = Two.Path, TWO_PI = Math.PI * 2, cos = Math.cos, sin = Math.sin;
  var _ = Two.Utils;

  var Circle = Two.Circle = function(ox, oy, r) {

    var amount = Two.Resolution;

    var points = _.map(_.range(amount), function(i) {
      return new Two.Anchor();
    }, this);

    Path.call(this, points, true, true);

    this.radius = r;

    this._update();
    this.translation.set(ox, oy);

  };

  _.extend(Circle, {

    Properties: ['radius'],

    MakeObservable: function(obj) {

      Path.MakeObservable(obj);
      _.each(Circle.Properties, Two.Utils.defineProperty, obj);

    }

  });

  _.extend(Circle.prototype, Path.prototype, {

    _radius: 0,
    _flagRadius: false,

    _update: function() {

      if (this._flagRadius) {
        for (var i = 0, l = this.vertices.length; i < l; i++) {
          var pct = i / l;
          var theta = pct * TWO_PI;
          var x = this._radius * cos(theta);
          var y = this._radius * sin(theta);
          this.vertices[i].set(x, y);
        }
      }

      Path.prototype._update.call(this);
      return this;

    },

    flagReset: function() {

      this._flagRadius = false;

      Path.prototype.flagReset.call(this);
      return this;

    }

  });

  Circle.MakeObservable(Circle.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var Path = Two.Path, TWO_PI = Math.PI * 2, cos = Math.cos, sin = Math.sin;
  var _ = Two.Utils;

  var Polygon = Two.Polygon = function(ox, oy, r, sides) {

    sides = Math.max(sides || 0, 3);

    var points = _.map(_.range(sides), function(i) {
      return new Two.Anchor();
    });

    Path.call(this, points, true);

    this.width = r * 2;
    this.height = r * 2;
    this.sides = sides;

    this._update();
    this.translation.set(ox, oy);

  };

  _.extend(Polygon, {

    Properties: ['width', 'height', 'sides'],

    MakeObservable: function(obj) {

      Path.MakeObservable(obj);
      _.each(Polygon.Properties, Two.Utils.defineProperty, obj);

    }

  });

  _.extend(Polygon.prototype, Path.prototype, {

    _width: 0,
    _height: 0,
    _sides: 0,

    _flagWidth: false,
    _flagHeight: false,
    _flagSides: false,

    _update: function() {

      if (this._flagWidth || this._flagHeight || this._flagSides) {

        var sides = this._sides;
        var amount = this.vertices.length;

        if (amount > sides) {
          this.vertices.splice(sides - 1, amount - sides);
        }

        for (var i = 0; i < sides; i++) {

          var pct = (i + 0.5) / sides;
          var theta = TWO_PI * pct + Math.PI / 2;
          var x = this._width * cos(theta);
          var y = this._height * sin(theta);

          if (i >= amount) {
            this.vertices.push(new Two.Anchor(x, y));
          } else {
            this.vertices[i].set(x, y);
          }

        }

      }

      Path.prototype._update.call(this);
      return this;

    },

    flagReset: function() {

      this._flagWidth = this._flagHeight = this._flagSides = false;
      Path.prototype.flagReset.call(this);

      return this;

    }

  });

  Polygon.MakeObservable(Polygon.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var Path = Two.Path, PI = Math.PI, TWO_PI = Math.PI * 2, HALF_PI = Math.PI / 2,
    cos = Math.cos, sin = Math.sin, abs = Math.abs, _ = Two.Utils;

  var ArcSegment = Two.ArcSegment = function(ox, oy, ir, or, sa, ea, res) {

    var points = _.map(_.range(res || (Two.Resolution * 3)), function() {
      return new Two.Anchor();
    });

    Path.call(this, points, false, false, true);

    this.innerRadius = ir;
    this.outerRadius = or;

    this.startAngle = sa;
    this.endAngle = ea;

    this._update();
    this.translation.set(ox, oy);

  }

  _.extend(ArcSegment, {

    Properties: ['startAngle', 'endAngle', 'innerRadius', 'outerRadius'],

    MakeObservable: function(obj) {

      Path.MakeObservable(obj);
      _.each(ArcSegment.Properties, Two.Utils.defineProperty, obj);

    }

  });

  _.extend(ArcSegment.prototype, Path.prototype, {

    _flagStartAngle: false,
    _flagEndAngle: false,
    _flagInnerRadius: false,
    _flagOuterRadius: false,

    _startAngle: 0,
    _endAngle: TWO_PI,
    _innerRadius: 0,
    _outerRadius: 0,

    _update: function() {

      if (this._flagStartAngle || this._flagEndAngle || this._flagInnerRadius
        || this._flagOuterRadius) {

        var sa = this._startAngle;
        var ea = this._endAngle;

        var ir = this._innerRadius;
        var or = this._outerRadius;

        var connected = mod(sa, TWO_PI) === mod(ea, TWO_PI);
        var punctured = ir > 0;

        var vertices = this.vertices;
        var length = (punctured ? vertices.length / 2 : vertices.length);
        var command, id = 0;

        if (connected) {
          length--;
        } else if (!punctured) {
          length -= 2;
        }

        /**
         * Outer Circle
         */
        for (var i = 0, last = length - 1; i < length; i++) {

          var pct = i / last;
          var v = vertices[id];
          var theta = pct * (ea - sa) + sa;
          var step = (ea - sa) / length;

          var x = or * Math.cos(theta);
          var y = or * Math.sin(theta);

          switch (i) {
            case 0:
              command = Two.Commands.move;
              break;
            default:
              command = Two.Commands.curve;
          }

          v.command = command;
          v.x = x;
          v.y = y;
          v.controls.left.clear();
          v.controls.right.clear();

          if (v.command === Two.Commands.curve) {
            var amp = or * step / Math.PI;
            v.controls.left.x = amp * Math.cos(theta - HALF_PI);
            v.controls.left.y = amp * Math.sin(theta - HALF_PI);
            v.controls.right.x = amp * Math.cos(theta + HALF_PI);
            v.controls.right.y = amp * Math.sin(theta + HALF_PI);
            if (i === 1) {
              v.controls.left.multiplyScalar(2);
            }
            if (i === last) {
              v.controls.right.multiplyScalar(2);
            }
          }

          id++;

        }

        if (punctured) {

          if (connected) {
            vertices[id].command = Two.Commands.close;
            id++;
          } else {
            length--;
            last = length - 1;
          }

          /**
           * Inner Circle
           */
          for (i = 0; i < length; i++) {

            pct = i / last;
            v = vertices[id];
            theta = (1 - pct) * (ea - sa) + sa;
            step = (ea - sa) / length;

            x = ir * Math.cos(theta);
            y = ir * Math.sin(theta);
            command = Two.Commands.curve;
            if (i <= 0) {
              command = connected ? Two.Commands.move : Two.Commands.line;
            }

            v.command = command;
            v.x = x;
            v.y = y;
            v.controls.left.clear();
            v.controls.right.clear();

            if (v.command === Two.Commands.curve) {
              amp = ir * step / Math.PI;
              v.controls.left.x = amp * Math.cos(theta + HALF_PI);
              v.controls.left.y = amp * Math.sin(theta + HALF_PI);
              v.controls.right.x = amp * Math.cos(theta - HALF_PI);
              v.controls.right.y = amp * Math.sin(theta - HALF_PI);
              if (i === 1) {
                v.controls.left.multiplyScalar(2);
              }
              if (i === last) {
                v.controls.right.multiplyScalar(2);
              }
            }

            id++;

          }

        } else if (!connected) {

          vertices[id].command = Two.Commands.line;
          vertices[id].x = 0;
          vertices[id].y = 0;
          id++;

        }

        /**
         * Final Point
         */
        vertices[id].command = Two.Commands.close;

      }

      Path.prototype._update.call(this);

      return this;

    },

    flagReset: function() {

      Path.prototype.flagReset.call(this);

      this._flagStartAngle = this._flagEndAngle
        = this._flagInnerRadius = this._flagOuterRadius = false;

      return this;

    }

  });

  ArcSegment.MakeObservable(ArcSegment.prototype);

  function mod(v, l) {
    while (v < 0) {
      v += l;
    }
    return v % l;
  }

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var Path = Two.Path, TWO_PI = Math.PI * 2, cos = Math.cos, sin = Math.sin;
  var _ = Two.Utils;

  var Star = Two.Star = function(ox, oy, or, ir, sides) {

    if (!_.isNumber(ir)) {
      ir = or / 2;
    }

    if (!_.isNumber(sides) || sides <= 0) {
      sides = 5;
    }

    var length = sides * 2;

    var points = _.map(_.range(length), function(i) {
      return new Two.Anchor();
    });

    Path.call(this, points, true);

    this.innerRadius = ir;
    this.outerRadius = or;
    this.sides = sides;

    this._update();
    this.translation.set(ox, oy);

  };

  _.extend(Star, {

    Properties: ['innerRadius', 'outerRadius', 'sides'],

    MakeObservable: function(obj) {

      Path.MakeObservable(obj);
      _.each(Star.Properties, Two.Utils.defineProperty, obj);

    }

  });

  _.extend(Star.prototype, Path.prototype, {

    _innerRadius: 0,
    _outerRadius: 0,
    _sides: 0,

    _flagInnerRadius: false,
    _flagOuterRadius: false,
    _flagSides: false,

    _update: function() {

      if (this._flagInnerRadius || this._flagOuterRadius || this._flagSides) {

        var sides = this._sides * 2;
        var amount = this.vertices.length;

        if (amount > sides) {
          this.vertices.splice(sides - 1, amount - sides);
        }

        for (var i = 0; i < sides; i++) {

          var pct = (i + 0.5) / sides;
          var theta = TWO_PI * pct;
          var r = (i % 2 ? this._innerRadius : this._outerRadius);
          var x = r * cos(theta);
          var y = r * sin(theta);

          if (i >= amount) {
            this.vertices.push(new Two.Anchor(x, y));
          } else {
            this.vertices[i].set(x, y);
          }

        }

      }

      Path.prototype._update.call(this);

      return this;

    },

    flagReset: function() {

      this._flagInnerRadius = this._flagOuterRadius = this._flagSides = false;
      Path.prototype.flagReset.call(this);

      return this;

    }

  });

  Star.MakeObservable(Star.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var Path = Two.Path;
  var _ = Two.Utils;

  var RoundedRectangle = Two.RoundedRectangle = function(ox, oy, width, height, radius) {

    if (!_.isNumber(radius)) {
      radius = Math.floor(Math.min(width, height) / 12);
    }

    var amount = 10;

    var points = _.map(_.range(amount), function(i) {
      return new Two.Anchor(0, 0, 0, 0, 0, 0,
        i === 0 ? Two.Commands.move : Two.Commands.curve);
    });

    points[points.length - 1].command = Two.Commands.close;

    Path.call(this, points, false, false, true);

    this.width = width;
    this.height = height;
    this.radius = radius;

    this._update();
    this.translation.set(ox, oy);

  };

  _.extend(RoundedRectangle, {

    Properties: ['width', 'height', 'radius'],

    MakeObservable: function(obj) {

      Path.MakeObservable(obj);
      _.each(RoundedRectangle.Properties, Two.Utils.defineProperty, obj);

    }

  });

  _.extend(RoundedRectangle.prototype, Path.prototype, {

    _width: 0,
    _height: 0,
    _radius: 0,

    _flagWidth: false,
    _flagHeight: false,
    _flagRadius: false,

    _update: function() {

      if (this._flagWidth || this._flagHeight || this._flagRadius) {

        var width = this._width;
        var height = this._height;
        var radius = Math.min(Math.max(this._radius, 0),
          Math.min(width, height));

        var v;
        var w = width / 2;
        var h = height / 2;

        v = this.vertices[0];
        v.x = - (w - radius);
        v.y = - h;

        // Upper Right Corner

        v = this.vertices[1];
        v.x = (w - radius);
        v.y = - h;
        v.controls.left.clear();
        v.controls.right.x = radius;
        v.controls.right.y = 0;

        v = this.vertices[2];
        v.x = w;
        v.y = - (h - radius);
        v.controls.right.clear();
        v.controls.left.clear();

        // Bottom Right Corner

        v = this.vertices[3];
        v.x = w;
        v.y = (h - radius);
        v.controls.left.clear();
        v.controls.right.x = 0;
        v.controls.right.y = radius;

        v = this.vertices[4];
        v.x = (w - radius);
        v.y = h;
        v.controls.right.clear();
        v.controls.left.clear();

        // Bottom Left Corner

        v = this.vertices[5];
        v.x = - (w - radius);
        v.y = h;
        v.controls.left.clear();
        v.controls.right.x = - radius;
        v.controls.right.y = 0;

        v = this.vertices[6];
        v.x = - w;
        v.y = (h - radius);
        v.controls.left.clear();
        v.controls.right.clear();

        // Upper Left Corner

        v = this.vertices[7];
        v.x = - w;
        v.y = - (h - radius);
        v.controls.left.clear();
        v.controls.right.x = 0;
        v.controls.right.y = - radius;

        v = this.vertices[8];
        v.x = - (w - radius);
        v.y = - h;
        v.controls.left.clear();
        v.controls.right.clear();

        v = this.vertices[9];
        v.copy(this.vertices[8]);

      }

      Path.prototype._update.call(this);

      return this;

    },

    flagReset: function() {

      this._flagWidth = this._flagHeight = this._flagRadius = false;
      Path.prototype.flagReset.call(this);

      return this;

    }

  });

  RoundedRectangle.MakeObservable(RoundedRectangle.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var root = Two.root;
  var getComputedMatrix = Two.Utils.getComputedMatrix;
  var _ = Two.Utils;

  var canvas = (root.document ? root.document.createElement('canvas') : { getContext: _.identity });
  var ctx = canvas.getContext('2d');

  var Text = Two.Text = function(message, x, y, styles) {

    Two.Shape.call(this);

    this._renderer.type = 'text';
    this._renderer.flagFill = _.bind(Text.FlagFill, this);
    this._renderer.flagStroke = _.bind(Text.FlagStroke, this);

    this.value = message;

    if (_.isNumber(x)) {
        this.translation.x = x;
    }
    if (_.isNumber(y)) {
        this.translation.y = y;
    }

    if (!_.isObject(styles)) {
      return this;
    }

    _.each(Two.Text.Properties, function(property) {

      if (property in styles) {
        this[property] = styles[property];
      }

    }, this);

  };

  _.extend(Two.Text, {

    Properties: [
      'value', 'family', 'size', 'leading', 'alignment', 'linewidth', 'style',
      'weight', 'decoration', 'baseline', 'opacity', 'visible', 'fill', 'stroke'
    ],

    FlagFill: function() {
      this._flagFill = true;
    },

    FlagStroke: function() {
      this._flagStroke = true;
    },

    MakeObservable: function(object) {

      Two.Shape.MakeObservable(object);

      _.each(Two.Text.Properties.slice(0, 12), Two.Utils.defineProperty, object);

      Object.defineProperty(object, 'fill', {
        enumerable: true,
        get: function() {
          return this._fill;
        },
        set: function(f) {

          if (this._fill instanceof Two.Gradient
            || this._fill instanceof Two.LinearGradient
            || this._fill instanceof Two.RadialGradient
            || this._fill instanceof Two.Texture) {
            this._fill.unbind(Two.Events.change, this._renderer.flagFill);
          }

          this._fill = f;
          this._flagFill = true;

          if (this._fill instanceof Two.Gradient
            || this._fill instanceof Two.LinearGradient
            || this._fill instanceof Two.RadialGradient
            || this._fill instanceof Two.Texture) {
            this._fill.bind(Two.Events.change, this._renderer.flagFill);
          }

        }
      });

      Object.defineProperty(object, 'stroke', {
        enumerable: true,
        get: function() {
          return this._stroke;
        },
        set: function(f) {

          if (this._stroke instanceof Two.Gradient
            || this._stroke instanceof Two.LinearGradient
            || this._stroke instanceof Two.RadialGradient
            || this._stroke instanceof Two.Texture) {
            this._stroke.unbind(Two.Events.change, this._renderer.flagStroke);
          }

          this._stroke = f;
          this._flagStroke = true;

          if (this._stroke instanceof Two.Gradient
            || this._stroke instanceof Two.LinearGradient
            || this._stroke instanceof Two.RadialGradient
            || this._stroke instanceof Two.Texture) {
            this._stroke.bind(Two.Events.change, this._renderer.flagStroke);
          }

        }
      });

      Object.defineProperty(object, 'clip', {
        enumerable: true,
        get: function() {
          return this._clip;
        },
        set: function(v) {
          this._clip = v;
          this._flagClip = true;
        }
      });

    }

  });

  _.extend(Two.Text.prototype, Two.Shape.prototype, {

    // Flags
    // http://en.wikipedia.org/wiki/Flag

    _flagValue: true,
    _flagFamily: true,
    _flagSize: true,
    _flagLeading: true,
    _flagAlignment: true,
    _flagBaseline: true,
    _flagStyle: true,
    _flagWeight: true,
    _flagDecoration: true,

    _flagFill: true,
    _flagStroke: true,
    _flagLinewidth: true,
    _flagOpacity: true,
    _flagVisible: true,

    _flagClip: false,

    // Underlying Properties

    _value: '',
    _family: 'sans-serif',
    _size: 13,
    _leading: 17,
    _alignment: 'center',
    _baseline: 'middle',
    _style: 'normal',
    _weight: 500,
    _decoration: 'none',

    _fill: '#000',
    _stroke: 'transparent',
    _linewidth: 1,
    _opacity: 1,
    _visible: true,

    _clip: false,

    remove: function() {

      if (!this.parent) {
        return this;
      }

      this.parent.remove(this);

      return this;

    },

    clone: function(parent) {

      var parent = parent || this.parent;

      var clone = new Two.Text(this.value);
      clone.translation.copy(this.translation);
      clone.rotation = this.rotation;
      clone.scale = this.scale;

      _.each(Two.Text.Properties, function(property) {
        clone[property] = this[property];
      }, this);

      if (parent) {
        parent.add(clone);
      }

      return clone;

    },

    toObject: function() {

      var result = {
        translation: this.translation.toObject(),
        rotation: this.rotation,
        scale: this.scale
      };

      _.each(Two.Text.Properties, function(property) {
        result[property] = this[property];
      }, this);

      return result;

    },

    noStroke: function() {
      this.stroke = 'transparent';
      return this;
    },

    noFill: function() {
      this.fill = 'transparent';
      return this;
    },

    /**
     * A shim to not break `getBoundingClientRect` calls. TODO: Implement a
     * way to calculate proper bounding boxes of `Two.Text`.
     */
    getBoundingClientRect: function(shallow) {

      var matrix, border, l, x, y, i, v;

      var left = Infinity, right = -Infinity,
          top = Infinity, bottom = -Infinity;

      // TODO: Update this to not __always__ update. Just when it needs to.
      this._update(true);

      matrix = !!shallow ? this._matrix : getComputedMatrix(this);

      v = matrix.multiply(0, 0, 1);

      return {
        top: v.x,
        left: v.y,
        right: v.x,
        bottom: v.y,
        width: 0,
        height: 0
      };

    },

    flagReset: function() {

      this._flagValue = this._flagFamily = this._flagSize =
        this._flagLeading = this._flagAlignment = this._flagFill =
        this._flagStroke = this._flagLinewidth = this._flagOpaicty =
        this._flagVisible = this._flagClip = this._flagDecoration =
        this._flagBaseline = false;

      Two.Shape.prototype.flagReset.call(this);

      return this;

    }

  });

  Two.Text.MakeObservable(Two.Text.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;

  var Stop = Two.Stop = function(offset, color, opacity) {

    this._renderer = {};
    this._renderer.type = 'stop';

    this.offset = _.isNumber(offset) ? offset
      : Stop.Index <= 0 ? 0 : 1;

    this.opacity = _.isNumber(opacity) ? opacity : 1;

    this.color = _.isString(color) ? color
      : Stop.Index <= 0 ? '#fff' : '#000';

    Stop.Index = (Stop.Index + 1) % 2;

  };

  _.extend(Stop, {

    Index: 0,

    Properties: [
      'offset',
      'opacity',
      'color'
    ],

    MakeObservable: function(object) {

      _.each(Stop.Properties, function(property) {

        var object = this;
        var secret = '_' + property;
        var flag = '_flag' + property.charAt(0).toUpperCase() + property.slice(1);

        Object.defineProperty(object, property, {
          enumerable: true,
          get: function() {
            return this[secret];
          },
          set: function(v) {
            this[secret] = v;
            this[flag] = true;
            if (this.parent) {
              this.parent._flagStops = true;
            }
          }
        });

      }, object);

    }

  });

  _.extend(Stop.prototype, Two.Utils.Events, {

    clone: function() {

      var clone = new Stop();

      _.each(Stop.Properties, function(property) {
        clone[property] = this[property];
      }, this);

      return clone;

    },

    toObject: function() {

      var result = {};

      _.each(Stop.Properties, function(k) {
        result[k] = this[k];
      }, this);

      return result;

    },

    flagReset: function() {

      this._flagOffset = this._flagColor = this._flagOpacity = false;

      return this;

    }

  });

  Stop.MakeObservable(Stop.prototype);

  var Gradient = Two.Gradient = function(stops) {

    this._renderer = {};
    this._renderer.type = 'gradient';

    this.id = Two.Identifier + Two.uniqueId();
    this.classList = [];

    this._renderer.flagStops = _.bind(Gradient.FlagStops, this);
    this._renderer.bindStops = _.bind(Gradient.BindStops, this);
    this._renderer.unbindStops = _.bind(Gradient.UnbindStops, this);

    this.spread = 'pad';

    this.stops = stops;

  };

  _.extend(Gradient, {

    Stop: Stop,

    Properties: [
      'spread'
    ],

    MakeObservable: function(object) {

      _.each(Gradient.Properties, Two.Utils.defineProperty, object);

      Object.defineProperty(object, 'stops', {

        enumerable: true,

        get: function() {
          return this._stops;
        },

        set: function(stops) {

          var updateStops = this._renderer.flagStops;
          var bindStops = this._renderer.bindStops;
          var unbindStops = this._renderer.unbindStops;

          // Remove previous listeners
          if (this._stops) {
            this._stops
              .unbind(Two.Events.insert, bindStops)
              .unbind(Two.Events.remove, unbindStops);
          }

          // Create new Collection with copy of Stops
          this._stops = new Two.Utils.Collection((stops || []).slice(0));

          // Listen for Collection changes and bind / unbind
          this._stops
            .bind(Two.Events.insert, bindStops)
            .bind(Two.Events.remove, unbindStops);

          // Bind Initial Stops
          bindStops(this._stops);

        }

      });

    },

    FlagStops: function() {
      this._flagStops = true;
    },

    BindStops: function(items) {

      // This function is called a lot
      // when importing a large SVG
      var i = items.length;
      while(i--) {
        items[i].bind(Two.Events.change, this._renderer.flagStops);
        items[i].parent = this;
      }

      this._renderer.flagStops();

    },

    UnbindStops: function(items) {

      var i = items.length;
      while(i--) {
        items[i].unbind(Two.Events.change, this._renderer.flagStops);
        delete items[i].parent;
      }

      this._renderer.flagStops();

    }

  });

  _.extend(Gradient.prototype, Two.Utils.Events, {

    _flagStops: false,
    _flagSpread: false,

    clone: function(parent) {

      parent = parent || this.parent;

      var stops = _.map(this.stops, function(s) {
        return s.clone();
      });

      var clone = new Gradient(stops);

      _.each(Two.Gradient.Properties, function(k) {
        clone[k] = this[k];
      }, this);

      if (parent) {
        parent.add(clone);
      }

      return clone;

    },

    toObject: function() {

      var result = {
        stops: _.map(this.stops, function(s) {
          return s.toObject();
        })
      };

      _.each(Gradient.Properties, function(k) {
        result[k] = this[k];
      }, this);

      return result;

    },

    _update: function() {

      if (this._flagSpread || this._flagStops) {
        this.trigger(Two.Events.change);
      }

      return this;

    },

    flagReset: function() {

      this._flagSpread = this._flagStops = false;

      return this;

    }

  });

  Gradient.MakeObservable(Gradient.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;

  var LinearGradient = Two.LinearGradient = function(x1, y1, x2, y2, stops) {

    Two.Gradient.call(this, stops);

    this._renderer.type = 'linear-gradient';

    var flagEndPoints = _.bind(LinearGradient.FlagEndPoints, this);
    this.left = new Two.Vector().bind(Two.Events.change, flagEndPoints);
    this.right = new Two.Vector().bind(Two.Events.change, flagEndPoints);

    if (_.isNumber(x1)) {
      this.left.x = x1;
    }
    if (_.isNumber(y1)) {
      this.left.y = y1;
    }
    if (_.isNumber(x2)) {
      this.right.x = x2;
    }
    if (_.isNumber(y2)) {
      this.right.y = y2;
    }

  };

  _.extend(LinearGradient, {

    Stop: Two.Gradient.Stop,

    MakeObservable: function(object) {
      Two.Gradient.MakeObservable(object);
    },

    FlagEndPoints: function() {
      this._flagEndPoints = true;
    }

  });

  _.extend(LinearGradient.prototype, Two.Gradient.prototype, {

    _flagEndPoints: false,

    clone: function(parent) {

      parent = parent || this.parent;

      var stops = _.map(this.stops, function(stop) {
        return stop.clone();
      });

      var clone = new LinearGradient(this.left._x, this.left._y,
        this.right._x, this.right._y, stops);

      _.each(Two.Gradient.Properties, function(k) {
        clone[k] = this[k];
      }, this);

      if (parent) {
        parent.add(clone);
      }

      return clone;

    },

    toObject: function() {

      var result = Two.Gradient.prototype.toObject.call(this);

      result.left = this.left.toObject();
      result.right = this.right.toObject();

      return result;

    },

    _update: function() {

      if (this._flagEndPoints || this._flagSpread || this._flagStops) {
        this.trigger(Two.Events.change);
      }

      return this;

    },

    flagReset: function() {

      this._flagEndPoints = false;

      Two.Gradient.prototype.flagReset.call(this);

      return this;

    }

  });

  LinearGradient.MakeObservable(LinearGradient.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;

  var RadialGradient = Two.RadialGradient = function(cx, cy, r, stops, fx, fy) {

    Two.Gradient.call(this, stops);

    this._renderer.type = 'radial-gradient';

    this.center = new Two.Vector()
      .bind(Two.Events.change, _.bind(function() {
        this._flagCenter = true;
      }, this));

    this.radius = _.isNumber(r) ? r : 20;

    this.focal = new Two.Vector()
      .bind(Two.Events.change, _.bind(function() {
        this._flagFocal = true;
      }, this));

    if (_.isNumber(cx)) {
      this.center.x = cx;
    }
    if (_.isNumber(cy)) {
      this.center.y = cy;
    }

    this.focal.copy(this.center);

    if (_.isNumber(fx)) {
      this.focal.x = fx;
    }
    if (_.isNumber(fy)) {
      this.focal.y = fy;
    }

  };

  _.extend(RadialGradient, {

    Stop: Two.Gradient.Stop,

    Properties: [
      'radius'
    ],

    MakeObservable: function(object) {

      Two.Gradient.MakeObservable(object);

      _.each(RadialGradient.Properties, Two.Utils.defineProperty, object);

    }

  });

  _.extend(RadialGradient.prototype, Two.Gradient.prototype, {

    _flagRadius: false,
    _flagCenter: false,
    _flagFocal: false,

    clone: function(parent) {

      parent = parent || this.parent;

      var stops = _.map(this.stops, function(stop) {
        return stop.clone();
      });

      var clone = new RadialGradient(this.center._x, this.center._y,
          this._radius, stops, this.focal._x, this.focal._y);

      _.each(Two.Gradient.Properties.concat(RadialGradient.Properties), function(k) {
        clone[k] = this[k];
      }, this);

      if (parent) {
        parent.add(clone);
      }

      return clone;

    },

    toObject: function() {

      var result = Two.Gradient.prototype.toObject.call(this);

      _.each(RadialGradient.Properties, function(k) {
        result[k] = this[k];
      }, this);

      result.center = this.center.toObject();
      result.focal = this.focal.toObject();

      return result;

    },

    _update: function() {

      if (this._flagRadius || this._flatCenter || this._flagFocal
        || this._flagSpread || this._flagStops) {
        this.trigger(Two.Events.change);
      }

      return this;

    },

    flagReset: function() {

      this._flagRadius = this._flagCenter = this._flagFocal = false;

      Two.Gradient.prototype.flagReset.call(this);

      return this;

    }

  });

  RadialGradient.MakeObservable(RadialGradient.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;
  var anchor;
  var regex = {
    video: /\.(mp4|webm)$/i,
    image: /\.(jpe?g|png|gif|tiff)$/i
  };

  if (this.document) {
    anchor = document.createElement('a');
  }

  var Texture = Two.Texture = function(src, callback) {

    this._renderer = {};
    this._renderer.type = 'texture';
    this._renderer.flagOffset = _.bind(Texture.FlagOffset, this);
    this._renderer.flagScale = _.bind(Texture.FlagScale, this);

    this.id = Two.Identifier + Two.uniqueId();
    this.classList = [];

    this.offset = new Two.Vector();

    if (_.isFunction(callback)) {
      var loaded = _.bind(function() {
        this.unbind(Two.Events.load, loaded);
        if (_.isFunction(callback)) {
          callback();
        }
      }, this);
      this.bind(Two.Events.load, loaded);
    }

    if (_.isString(src)) {
      this.src = src;
    } else if (_.isElement(src)) {
      this.image = src;
    }

    this._update();

  };

  _.extend(Texture, {

    Properties: [
      'src',
      'loaded',
      'repeat'
    ],

    ImageRegistry: new Two.Registry(),

    getAbsoluteURL: function(path) {
      if (!anchor) {
        // TODO: Fix for headless environment
        return path;
      }
      anchor.href = path;
      return anchor.href;
    },

    getImage: function(src) {

      var absoluteSrc = Texture.getAbsoluteURL(src);

      if (Texture.ImageRegistry.contains(absoluteSrc)) {
        return Texture.ImageRegistry.get(absoluteSrc);
      }

      var image;

      if (regex.video.test(absoluteSrc)) {
        image = document.createElement('video');
      } else {
        image = document.createElement('img');
      }

      image.crossOrigin = 'anonymous';

      return image;

    },

    Register: {
      canvas: function(texture, callback) {
        texture._src = '#' + texture.id;
        Texture.ImageRegistry.add(texture.src, texture.image);
        if (_.isFunction(callback)) {
          callback();
        }
      },
      img: function(texture, callback) {

        var loaded = function(e) {
          texture.image.removeEventListener('load', loaded, false);
          texture.image.removeEventListener('error', error, false);
          if (_.isFunction(callback)) {
            callback();
          }
        };
        var error = function(e) {
          texture.image.removeEventListener('load', loaded, false);
          texture.image.removeEventListener('error', error, false);
          throw new Two.Utils.Error('unable to load ' + texture.src);
        };

        if (_.isNumber(texture.image.width) && texture.image.width > 0
          && _.isNumber(texture.image.height) && texture.image.height > 0) {
            loaded();
        } else {
          texture.image.addEventListener('load', loaded, false);
          texture.image.addEventListener('error', error, false);
        }

        texture._src = Texture.getAbsoluteURL(texture._src);

        if (texture.image && texture.image.getAttribute('two-src')) {
          return;
        }

        texture.image.setAttribute('two-src', texture.src);
        Texture.ImageRegistry.add(texture.src, texture.image);
        texture.image.src = texture.src;

      },
      video: function(texture, callback) {

        var loaded = function(e) {
          texture.image.removeEventListener('load', loaded, false);
          texture.image.removeEventListener('error', error, false);
          texture.image.width = texture.image.videoWidth;
          texture.image.height = texture.image.videoHeight;
          texture.image.play();
          if (_.isFunction(callback)) {
            callback();
          }
        };
        var error = function(e) {
          texture.image.removeEventListener('load', loaded, false);
          texture.image.removeEventListener('error', error, false);
          throw new Two.Utils.Error('unable to load ' + texture.src);
        };

        texture._src = Texture.getAbsoluteURL(texture._src);
        texture.image.addEventListener('canplaythrough', loaded, false);
        texture.image.addEventListener('error', error, false);

        if (texture.image && texture.image.getAttribute('two-src')) {
          return;
        }

        texture.image.setAttribute('two-src', texture.src);
        Texture.ImageRegistry.add(texture.src, texture.image);
        texture.image.src = texture.src;
        texture.image.loop = true;
        texture.image.load();

      }
    },

    load: function(texture, callback) {

      var src = texture.src;
      var image = texture.image;
      var tag = image && image.nodeName.toLowerCase();

      if (texture._flagImage) {
        if (/canvas/i.test(tag)) {
          Texture.Register.canvas(texture, callback);
        } else {
          texture._src = image.getAttribute('two-src') || image.src;
          Texture.Register[tag](texture, callback);
        }
      }

      if (texture._flagSrc) {
        if (!image) {
          texture.image = Texture.getImage(texture.src);
        }
        tag = texture.image.nodeName.toLowerCase();
        Texture.Register[tag](texture, callback);
      }

    },

    FlagOffset: function() {
      this._flagOffset = true;
    },

    FlagScale: function() {
      this._flagScale = true;
    },

    MakeObservable: function(object) {

      _.each(Texture.Properties, Two.Utils.defineProperty, object);

      Object.defineProperty(object, 'image', {
        enumerable: true,
        get: function() {
          return this._image;
        },
        set: function(image) {

          var tag = image && image.nodeName.toLowerCase();
          var index;

          switch (tag) {
            case 'canvas':
              index = '#' + image.id;
              break;
            default:
              index = image.src;
          }

          if (Texture.ImageRegistry.contains(index)) {
            this._image = Texture.ImageRegistry.get(image.src);
          } else {
            this._image = image;
          }

          this._flagImage = true;

        }

      });

      Object.defineProperty(object, 'offset', {
        enumerable: true,
        get: function() {
          return this._offset;
        },
        set: function(v) {
          if (this._offset) {
            this._offset.unbind(Two.Events.change, this._renderer.flagOffset);
          }
          this._offset = v;
          this._offset.bind(Two.Events.change, this._renderer.flagOffset);
          this._flagOffset = true;
        }
      });

      Object.defineProperty(object, 'scale', {
        enumerable: true,
        get: function() {
          return this._scale;
        },
        set: function(v) {

          if (this._scale instanceof Two.Vector) {
            this._scale.unbind(Two.Events.change, this._renderer.flagScale);
          }

          this._scale = v;

          if (this._scale instanceof Two.Vector) {
            this._scale.bind(Two.Events.change, this._renderer.flagScale);
          }

          this._flagScale = true;

        }
      });

    }

  });

  _.extend(Texture.prototype, Two.Utils.Events, Two.Shape.prototype, {

    _flagSrc: false,
    _flagImage: false,
    _flagVideo: false,
    _flagLoaded: false,
    _flagRepeat: false,

    _flagOffset: false,
    _flagScale: false,

    _src: '',
    _image: null,
    _loaded: false,
    _repeat: 'no-repeat',

    _scale: 1,
    _offset: null,

    clone: function() {
      return new Texture(this.src);
    },

    toObject: function() {
      return {
        src: this.src,
        image: this.image
      }
    },

    _update: function() {

      if (this._flagSrc || this._flagImage || this._flagVideo) {

        this.trigger(Two.Events.change);

        if (this._flagSrc || this._flagImage) {
          this.loaded = false;
          Texture.load(this, _.bind(function() {
            this.loaded = true;
            this
              .trigger(Two.Events.change)
              .trigger(Two.Events.load);
          }, this));
        }

      }

      if (this._image && this._image.readyState >= 4) {
        this._flagVideo = true;
      }

      return this;

    },

    flagReset: function() {

      this._flagSrc = this._flagImage = this._flagLoaded
        = this._flagVideo = this._flagScale = this._flagOffset = false;

      return this;

    }

  });

  Texture.MakeObservable(Texture.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;
  var Path = Two.Path;
  var Rectangle = Two.Rectangle;

  var Sprite = Two.Sprite = function(path, ox, oy, cols, rows, frameRate) {

    Path.call(this, [
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor()
    ], true);

    this.noStroke();
    this.noFill();

    if (path instanceof Two.Texture) {
      this.texture = path;
    } else if (_.isString(path)) {
      this.texture = new Two.Texture(path);
    }

    this._update();
    this.translation.set(ox || 0, oy || 0);

    if (_.isNumber(cols)) {
      this.columns = cols;
    }
    if (_.isNumber(rows)) {
      this.rows = rows;
    }
    if (_.isNumber(frameRate)) {
      this.frameRate = frameRate;
    }

  };

  _.extend(Sprite, {

    Properties: [
      'texture', 'columns', 'rows', 'frameRate', 'index'
    ],

    MakeObservable: function(obj) {

      Rectangle.MakeObservable(obj);
      _.each(Sprite.Properties, Two.Utils.defineProperty, obj);

    }

  })

  _.extend(Sprite.prototype, Rectangle.prototype, {

    _flagTexture: false,
    _flagColumns: false,
    _flagRows: false,
    _flagFrameRate: false,
    flagIndex: false,

    // Private variables
    _amount: 1,
    _duration: 0,
    _startTime: 0,
    _playing: false,
    _firstFrame: 0,
    _lastFrame: 0,
    _loop: true,

    // Exposed through getter-setter
    _texture: null,
    _columns: 1,
    _rows: 1,
    _frameRate: 0,
    _index: 0,

    play: function(firstFrame, lastFrame, onLastFrame) {

      this._playing = true;
      this._firstFrame = 0;
      this._lastFrame = this.amount - 1;
      this._startTime = _.performance.now();

      if (_.isNumber(firstFrame)) {
        this._firstFrame = firstFrame;
      }
      if (_.isNumber(lastFrame)) {
        this._lastFrame = lastFrame;
      }
      if (_.isFunction(onLastFrame)) {
        this._onLastFrame = onLastFrame;
      } else {
        delete this._onLastFrame;
      }

      if (this._index !== this._firstFrame) {
        this._startTime -= 1000 * Math.abs(this._index - this._firstFrame)
          / this._frameRate;
      }

      return this;

    },

    pause: function() {

      this._playing = false;
      return this;

    },

    stop: function() {

      this._playing = false;
      this._index = 0;

      return this;

    },

    clone: function(parent) {

      parent = parent || this.parent;

      var clone = new Sprite(
        this.texture, this.translation.x, this.translation.y,
        this.columns, this.rows, this.frameRate
      );

      if (this.playing) {
        clone.play(this._firstFrame, this._lastFrame);
        clone._loop = this._loop;
      }

      if (parent) {
        parent.add(clone);
      }

      return clone;

    },

    _update: function() {

      var effect = this._texture;
      var cols = this._columns;
      var rows = this._rows;

      var width, height, elapsed, amount, duration;
      var index, iw, ih, isRange, frames;

      if (this._flagColumns || this._flagRows) {
        this._amount = this._columns * this._rows;
      }

      if (this._flagFrameRate) {
        this._duration = 1000 * this._amount / this._frameRate;
      }

      if (this._flagTexture) {
        this.fill = this._texture;
      }

      if (this._texture.loaded) {

        iw = effect.image.width;
        ih = effect.image.height;

        width = iw / cols;
        height = ih / rows;
        amount = this._amount;

        if (this.width !== width) {
          this.width = width;
        }
        if (this.height !== height) {
          this.height = height;
        }

        if (this._playing && this._frameRate > 0) {

          if (_.isNaN(this._lastFrame)) {
            this._lastFrame = amount - 1;
          }

          // TODO: Offload perf logic to instance of `Two`.
          elapsed = _.performance.now() - this._startTime;
          frames = this._lastFrame + 1;
          duration = 1000 * (frames - this._firstFrame) / this._frameRate;

          if (this._loop) {
            elapsed = elapsed % duration;
          } else {
            elapsed = Math.min(elapsed, duration);
          }

          index = _.lerp(this._firstFrame, frames, elapsed / duration);
          index = Math.floor(index);

          if (index !== this._index) {
            this._index = index;
            if (index >= this._lastFrame - 1 && this._onLastFrame) {
              this._onLastFrame();  // Shortcut for chainable sprite animations
            }
          }

        }

        var col = this._index % cols;
        var row = Math.floor(this._index / cols);

        var ox = - width * col + (iw - width) / 2;
        var oy = - height * row + (ih - height) / 2;

        // TODO: Improve performance
        if (ox !== effect.offset.x) {
          effect.offset.x = ox;
        }
        if (oy !== effect.offset.y) {
          effect.offset.y = oy;
        }

      }

      Rectangle.prototype._update.call(this);

      return this;

    },

    flagReset: function() {

      this._flagTexture = this._flagColumns = this._flagRows
        = this._flagFrameRate = false;

      Rectangle.prototype.flagReset.call(this);

      return this;
    }


  });

  Sprite.MakeObservable(Sprite.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  var _ = Two.Utils;
  var Path = Two.Path;
  var Rectangle = Two.Rectangle;

  var ImageSequence = Two.ImageSequence = function(paths, ox, oy, frameRate) {

    Path.call(this, [
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor(),
      new Two.Anchor()
    ], true);

    this._renderer.flagTextures = _.bind(ImageSequence.FlagTextures, this);
    this._renderer.bindTextures = _.bind(ImageSequence.BindTextures, this);
    this._renderer.unbindTextures = _.bind(ImageSequence.UnbindTextures, this);

    this.noStroke();
    this.noFill();

    this.textures = _.map(paths, ImageSequence.GenerateTexture, this);

    this._update();
    this.translation.set(ox || 0, oy || 0);

    if (_.isNumber(frameRate)) {
      this.frameRate = frameRate;
    } else {
      this.frameRate = ImageSequence.DefaultFrameRate;
    }

  };

  _.extend(ImageSequence, {

    Properties: [
      'frameRate',
      'index'
    ],

    DefaultFrameRate: 30,

    FlagTextures: function() {
      this._flagTextures = true;
    },

    BindTextures: function(items) {

      var i = items.length;
      while (i--) {
        items[i].bind(Two.Events.change, this._renderer.flagTextures);
      }

      this._renderer.flagTextures();

    },

    UnbindTextures: function(items) {

      var i = items.length;
      while (i--) {
        items[i].unbind(Two.Events.change, this._renderer.flagTextures);
      }

      this._renderer.flagTextures();

    },

    MakeObservable: function(obj) {

      Rectangle.MakeObservable(obj);
      _.each(ImageSequence.Properties, Two.Utils.defineProperty, obj);

      Object.defineProperty(obj, 'textures', {

        enumerable: true,

        get: function() {
          return this._textures;
        },

        set: function(textures) {

          var updateTextures = this._renderer.flagTextures;
          var bindTextures = this._renderer.bindTextures;
          var unbindTextures = this._renderer.unbindTextures;

          // Remove previous listeners
          if (this._textures) {
            this._textures
              .unbind(Two.Events.insert, bindTextures)
              .unbind(Two.Events.remove, unbindTextures);
          }

          // Create new Collection with copy of vertices
          this._textures = new Two.Utils.Collection((textures || []).slice(0));

          // Listen for Collection changes and bind / unbind
          this._textures
            .bind(Two.Events.insert, bindTextures)
            .bind(Two.Events.remove, unbindTextures);

          // Bind Initial Textures
          bindTextures(this._textures);

        }

      });

    },

    GenerateTexture: function(obj) {
      if (obj instanceof Two.Texture) {
        return obj;
      } else if (_.isString(obj)) {
        return new Two.Texture(obj);
      }
    }

  });

  _.extend(ImageSequence.prototype, Rectangle.prototype, {

    _flagTextures: false,
    _flagFrameRate: false,
    _flagIndex: false,

    // Private variables
    _amount: 1,
    _duration: 0,
    _index: 0,
    _startTime: 0,
    _playing: false,
    _firstFrame: 0,
    _lastFrame: 0,
    _loop: true,

    // Exposed through getter-setter
    _textures: null,
    _frameRate: 0,

    play: function(firstFrame, lastFrame, onLastFrame) {

      this._playing = true;
      this._firstFrame = 0;
      this._lastFrame = this.amount - 1;
      this._startTime = _.performance.now();

      if (_.isNumber(firstFrame)) {
        this._firstFrame = firstFrame;
      }
      if (_.isNumber(lastFrame)) {
        this._lastFrame = lastFrame;
      }
      if (_.isFunction(onLastFrame)) {
        this._onLastFrame = onLastFrame;
      } else {
        delete this._onLastFrame;
      }

      if (this._index !== this._firstFrame) {
        this._startTime -= 1000 * Math.abs(this._index - this._firstFrame)
          / this._frameRate;
      }

      return this;

    },

    pause: function() {

      this._playing = false;
      return this;

    },

    stop: function() {

      this._playing = false;
      this._index = 0;

      return this;

    },

    clone: function(parent) {

      parent = parent || this.parent;

      var clone = new ImageSequence(this.textures, this.translation.x,
        this.translation.y, this.frameRate)

        clone._loop = this._loop;

        if (this._playing) {
          clone.play();
        }

        if (parent) {
          parent.add(clone);
        }

        return clone;

    },

    _update: function() {

      var effects = this._textures;
      var width, height, elapsed, amount, duration, texture;
      var index, frames;

      if (this._flagTextures) {
        this._amount = effects.length;
      }

      if (this._flagFrameRate) {
        this._duration = 1000 * this._amount / this._frameRate;
      }

      if (this._playing && this._frameRate > 0) {

        amount = this._amount;

        if (_.isNaN(this._lastFrame)) {
          this._lastFrame = amount - 1;
        }

        // TODO: Offload perf logic to instance of `Two`.
        elapsed = _.performance.now() - this._startTime;
        frames = this._lastFrame + 1;
        duration = 1000 * (frames - this._firstFrame) / this._frameRate;

        if (this._loop) {
          elapsed = elapsed % duration;
        } else {
          elapsed = Math.min(elapsed, duration);
        }

        index = _.lerp(this._firstFrame, frames, elapsed / duration);
        index = Math.floor(index);

        if (index !== this._index) {

          this._index = index;
          texture = effects[this._index];

          if (texture.loaded) {

            width = texture.image.width;
            height = texture.image.height;

            if (this.width !== width) {
              this.width = width;
            }
            if (this.height !== height) {
              this.height = height;
            }

            this.fill = texture;

            if (index >= this._lastFrame - 1 && this._onLastFrame) {
              this._onLastFrame();  // Shortcut for chainable sprite animations
            }

          }

        }

      } else if (this._flagIndex || !(this.fill instanceof Two.Texture)) {

        texture = effects[this._index];

        if (texture.loaded) {

          width = texture.image.width;
          height = texture.image.height;

          if (this.width !== width) {
            this.width = width;
          }
          if (this.height !== height) {
            this.height = height;
          }

        }

        this.fill = texture;

      }

      Rectangle.prototype._update.call(this);

      return this;

    },

    flagReset: function() {

      this._flagTextures = this._flagFrameRate = false;
      Rectangle.prototype.flagReset.call(this);

      return this;

    }

  });

  ImageSequence.MakeObservable(ImageSequence.prototype);

})((typeof global !== 'undefined' ? global : this).Two);

(function(Two) {

  /**
   * Constants
   */
  var min = Math.min, max = Math.max;
  var _ = Two.Utils;

  /**
   * A children collection which is accesible both by index and by object id
   * @constructor
   */
  var Children = function() {

    Two.Utils.Collection.apply(this, arguments);

    Object.defineProperty(this, '_events', {
      value : {},
      enumerable: false
    });

    this.ids = {};

    this.on(Two.Events.insert, this.attach);
    this.on(Two.Events.remove, this.detach);
    Children.prototype.attach.apply(this, arguments);

  };

  Children.prototype = new Two.Utils.Collection();
  Children.prototype.constructor = Children;

  _.extend(Children.prototype, {

    attach: function(children) {
      for (var i = 0; i < children.length; i++) {
        this.ids[children[i].id] = children[i];
      }
      return this;
    },

    detach: function(children) {
      for (var i = 0; i < children.length; i++) {
        delete this.ids[children[i].id];
      }
      return this;
    }

  });

  var Group = Two.Group = function() {

    Two.Shape.call(this, true);

    this._renderer.type = 'group';

    this.additions = [];
    this.subtractions = [];

    this.children = arguments;

  };

  _.extend(Group, {

    Children: Children,

    InsertChildren: function(children) {
      for (var i = 0; i < children.length; i++) {
        replaceParent.call(this, children[i], this);
      }
    },

    RemoveChildren: function(children) {
      for (var i = 0; i < children.length; i++) {
        replaceParent.call(this, children[i]);
      }
    },

    OrderChildren: function(children) {
      this._flagOrder = true;
    },

    MakeObservable: function(object) {

      var properties = Two.Path.Properties.slice(0);
      var oi = _.indexOf(properties, 'opacity');

      if (oi >= 0) {

        properties.splice(oi, 1);

        Object.defineProperty(object, 'opacity', {

          enumerable: true,

          get: function() {
            return this._opacity;
          },

          set: function(v) {
            // Only set flag if there is an actual difference
            this._flagOpacity = (this._opacity != v);
            this._opacity = v;
          }

        });

      }

      Two.Shape.MakeObservable(object);
      Group.MakeGetterSetters(object, properties);

      Object.defineProperty(object, 'children', {

        enumerable: true,

        get: function() {
          return this._children;
        },

        set: function(children) {

          var insertChildren = _.bind(Group.InsertChildren, this);
          var removeChildren = _.bind(Group.RemoveChildren, this);
          var orderChildren = _.bind(Group.OrderChildren, this);

          if (this._children) {
            this._children.unbind();
          }

          this._children = new Children(children);
          this._children.bind(Two.Events.insert, insertChildren);
          this._children.bind(Two.Events.remove, removeChildren);
          this._children.bind(Two.Events.order, orderChildren);

        }

      });

      Object.defineProperty(object, 'mask', {

        enumerable: true,

        get: function() {
          return this._mask;
        },

        set: function(v) {
          this._mask = v;
          this._flagMask = true;
          if (!v.clip) {
            v.clip = true;
          }
        }

      });

    },

    MakeGetterSetters: function(group, properties) {

      if (!_.isArray(properties)) {
        properties = [properties];
      }

      _.each(properties, function(k) {
        Group.MakeGetterSetter(group, k);
      });

    },

    MakeGetterSetter: function(group, k) {

      var secret = '_' + k;

      Object.defineProperty(group, k, {

        enumerable: true,

        get: function() {
          return this[secret];
        },

        set: function(v) {
          this[secret] = v;
          _.each(this.children, function(child) { // Trickle down styles
            child[k] = v;
          });
        }

      });

    }

  });

  _.extend(Group.prototype, Two.Shape.prototype, {

    // Flags
    // http://en.wikipedia.org/wiki/Flag

    _flagAdditions: false,
    _flagSubtractions: false,
    _flagOrder: false,
    _flagOpacity: true,

    _flagMask: false,

    // Underlying Properties

    _fill: '#fff',
    _stroke: '#000',
    _linewidth: 1.0,
    _opacity: 1.0,
    _visible: true,

    _cap: 'round',
    _join: 'round',
    _miter: 4,

    _closed: true,
    _curved: false,
    _automatic: true,
    _beginning: 0,
    _ending: 1.0,

    _mask: null,

    /**
     * TODO: Group has a gotcha in that it's at the moment required to be bound to
     * an instance of two in order to add elements correctly. This needs to
     * be rethought and fixed.
     */
    clone: function(parent) {

      parent = parent || this.parent;

      var group = new Group();
      var children = _.map(this.children, function(child) {
        return child.clone(group);
      });

      group.add(children);

      group.opacity = this.opacity;

      if (this.mask) {
        group.mask = this.mask;
      }

      group.translation.copy(this.translation);
      group.rotation = this.rotation;
      group.scale = this.scale;

      if (parent) {
        parent.add(group);
      }

      return group;

    },

    /**
     * Export the data from the instance of Two.Group into a plain JavaScript
     * object. This also makes all children plain JavaScript objects. Great
     * for turning into JSON and storing in a database.
     */
    toObject: function() {

      var result = {
        children: [],
        translation: this.translation.toObject(),
        rotation: this.rotation,
        scale: this.scale,
        opacity: this.opacity,
        mask: (this.mask ? this.mask.toObject() : null)
      };

      _.each(this.children, function(child, i) {
        result.children[i] = child.toObject();
      }, this);

      return result;

    },

    /**
     * Anchor all children to the upper left hand corner
     * of the group.
     */
    corner: function() {

      var rect = this.getBoundingClientRect(true),
       corner = { x: rect.left, y: rect.top };

      this.children.forEach(function(child) {
        child.translation.subSelf(corner);
      });

      return this;

    },

    /**
     * Anchors all children around the center of the group,
     * effectively placing the shape around the unit circle.
     */
    center: function() {

      var rect = this.getBoundingClientRect(true);

      rect.centroid = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      this.children.forEach(function(child) {
        if (child.isShape) {
          child.translation.subSelf(rect.centroid);
        }
      });

      // this.translation.copy(rect.centroid);

      return this;

    },

    /**
     * Recursively search for id. Returns the first element found.
     * Returns null if none found.
     */
    getById: function (id) {
      var search = function (node, id) {
        if (node.id === id) {
          return node;
        } else if (node.children) {
          var i = node.children.length;
          while (i--) {
            var found = search(node.children[i], id);
            if (found) return found;
          }
        }

      };
      return search(this, id) || null;
    },

    /**
     * Recursively search for classes. Returns an array of matching elements.
     * Empty array if none found.
     */
    getByClassName: function (cl) {
      var found = [];
      var search = function (node, cl) {
        if (node.classList.indexOf(cl) != -1) {
          found.push(node);
        } else if (node.children) {
          node.children.forEach(function (child) {
            search(child, cl);
          });
        }
        return found;
      };
      return search(this, cl);
    },

    /**
     * Recursively search for children of a specific type,
     * e.g. Two.Polygon. Pass a reference to this type as the param.
     * Returns an empty array if none found.
     */
    getByType: function(type) {
      var found = [];
      var search = function (node, type) {
        for (var id in node.children) {
          if (node.children[id] instanceof type) {
            found.push(node.children[id]);
          } else if (node.children[id] instanceof Two.Group) {
            search(node.children[id], type);
          }
        }
        return found;
      };
      return search(this, type);
    },

    /**
     * Add objects to the group.
     */
    add: function(objects) {

      // Allow to pass multiple objects either as array or as multiple arguments
      // If it's an array also create copy of it in case we're getting passed
      // a childrens array directly.
      if (!(objects instanceof Array)) {
        objects = _.toArray(arguments);
      } else {
        objects = objects.slice();
      }

      // Add the objects
      for (var i = 0; i < objects.length; i++) {
        if (!(objects[i] && objects[i].id)) continue;
        this.children.push(objects[i]);
      }

      return this;

    },

    /**
     * Remove objects from the group.
     */
    remove: function(objects) {

      var l = arguments.length,
        grandparent = this.parent;

      // Allow to call remove without arguments
      // This will detach the object from the scene.
      if (l <= 0 && grandparent) {
        grandparent.remove(this);
        return this;
      }

      // Allow to pass multiple objects either as array or as multiple arguments
      // If it's an array also create copy of it in case we're getting passed
      // a childrens array directly.
      if (!(objects instanceof Array)) {
        objects = _.toArray(arguments);
      } else {
        objects = objects.slice();
      }

      // Remove the objects
      for (var i = 0; i < objects.length; i++) {
        if (!objects[i] || !(this.children.ids[objects[i].id])) continue;
        this.children.splice(_.indexOf(this.children, objects[i]), 1);
      }

      return this;

    },

    /**
     * Return an object with top, left, right, bottom, width, and height
     * parameters of the group.
     */
    getBoundingClientRect: function(shallow) {
      var rect;

      // TODO: Update this to not __always__ update. Just when it needs to.
      this._update(true);

      // Variables need to be defined here, because of nested nature of groups.
      var left = Infinity, right = -Infinity,
          top = Infinity, bottom = -Infinity;

      this.children.forEach(function(child) {

        if (/(linear-gradient|radial-gradient|gradient)/.test(child._renderer.type)) {
          return;
        }

        rect = child.getBoundingClientRect(shallow);

        if (!_.isNumber(rect.top)   || !_.isNumber(rect.left)   ||
            !_.isNumber(rect.right) || !_.isNumber(rect.bottom)) {
          return;
        }

        top = min(rect.top, top);
        left = min(rect.left, left);
        right = max(rect.right, right);
        bottom = max(rect.bottom, bottom);

      }, this);

      return {
        top: top,
        left: left,
        right: right,
        bottom: bottom,
        width: right - left,
        height: bottom - top
      };

    },

    /**
     * Trickle down of noFill
     */
    noFill: function() {
      this.children.forEach(function(child) {
        child.noFill();
      });
      return this;
    },

    /**
     * Trickle down of noStroke
     */
    noStroke: function() {
      this.children.forEach(function(child) {
        child.noStroke();
      });
      return this;
    },

    /**
     * Trickle down subdivide
     */
    subdivide: function() {
      var args = arguments;
      this.children.forEach(function(child) {
        child.subdivide.apply(child, args);
      });
      return this;
    },

    flagReset: function() {

      if (this._flagAdditions) {
        this.additions.length = 0;
        this._flagAdditions = false;
      }

      if (this._flagSubtractions) {
        this.subtractions.length = 0;
        this._flagSubtractions = false;
      }

      this._flagOrder = this._flagMask = this._flagOpacity = false;

      Two.Shape.prototype.flagReset.call(this);

      return this;

    }

  });

  Group.MakeObservable(Group.prototype);

  /**
   * Helper function used to sync parent-child relationship within the
   * `Two.Group.children` object.
   *
   * Set the parent of the passed object to another object
   * and updates parent-child relationships
   * Calling with one arguments will simply remove the parenting
   */
  function replaceParent(child, newParent) {

    var parent = child.parent;
    var index;

    if (parent === newParent) {
      this.additions.push(child);
      this._flagAdditions = true;
      return;
    }

    if (parent && parent.children.ids[child.id]) {

      index = _.indexOf(parent.children, child);
      parent.children.splice(index, 1);

      // If we're passing from one parent to another...
      index = _.indexOf(parent.additions, child);

      if (index >= 0) {
        parent.additions.splice(index, 1);
      } else {
        parent.subtractions.push(child);
        parent._flagSubtractions = true;
      }

    }

    if (newParent) {
      child.parent = newParent;
      this.additions.push(child);
      this._flagAdditions = true;
      return;
    }

    // If we're passing from one parent to another...
    index = _.indexOf(this.additions, child);

    if (index >= 0) {
      this.additions.splice(index, 1);
    } else {
      this.subtractions.push(child);
      this._flagSubtractions = true;
    }

    delete child.parent;

  }

})((typeof global !== 'undefined' ? global : this).Two);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Two = require("two.js");
var SimplexNoise = require("simplex-noise");
var elem = document.getElementById("app");
var two = new Two({
    width: 724,
    height: 512
}).appendTo(elem);
var noise = new SimplexNoise();
function gradientDir(pos) {
    var EPS = 0.01;
    var SCALE = 0.003;
    var SPEED = 50;
    var l = noise.noise2D(SCALE * pos.x - EPS, SCALE * pos.y);
    var r = noise.noise2D(SCALE * pos.x + EPS, SCALE * pos.y);
    var u = noise.noise2D(SCALE * pos.x, SCALE * pos.y + EPS);
    var d = noise.noise2D(SCALE * pos.x, SCALE * pos.y - EPS);
    return new Two.Vector(-(r - l) * SPEED, (u - d) * SPEED);
}
var paths = [];
for (var i = 0; i < 5000; ++i) {
    var x = Math.random() * two.width;
    var y = Math.random() * two.height;
    var pos = new Two.Vector(x, y);
    var points = [new Two.Anchor(pos.x, pos.y)];
    for (var j = 0; j < 7; ++j) {
        pos.addSelf(gradientDir(pos));
        // pos.addSelf(new Two.Vector(Math.random(), Math.random()).multiplyScalar(2.0));
        points.push(new Two.Anchor(pos.x, pos.y));
    }
    var path = two.makeCurve(points, true);
    path.stroke = "#222";
    path.linewidth = 1;
    path.noFill();
    paths.push(path);
}
two.update();
function downloadData(data, filename) {
    var link = document.createElement("a");
    link.href = data;
    link.download = filename;
    link.click();
}
function downloadSVG() {
    if (!elem)
        return;
    var svg = elem.children[0];
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var blob = new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" });
    var data = URL.createObjectURL(blob);
    downloadData(data, 'capture.svg');
}
function downloadPNG() {
    if (!elem)
        return;
    var svgData = new XMLSerializer().serializeToString(elem.children[0]);
    var canvas = document.createElement("canvas");
    var svgSize = elem.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    var ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    var img = document.createElement("img");
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        downloadData(canvas.toDataURL("image/png"), "capture.png");
    };
}
window.addEventListener("keypress", function (e) {
    if (e.key == "s") {
        downloadSVG();
    }
    else if (e.key == "p") {
        downloadPNG();
    }
});

},{"simplex-noise":1,"two.js":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc2ltcGxleC1ub2lzZS9zaW1wbGV4LW5vaXNlLmpzIiwibm9kZV9tb2R1bGVzL3R3by5qcy9idWlsZC90d28uanMiLCJzcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ3BnVUEsNEJBQThCO0FBQzlCLDRDQUE4QztBQUU5QyxJQUFNLElBQUksR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVDLElBQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ2xCLEtBQUssRUFBRSxHQUFHO0lBQ1YsTUFBTSxFQUFFLEdBQUc7Q0FDWixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRWxCLElBQU0sS0FBSyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7QUFDakMscUJBQXFCLEdBQXNCO0lBQ3pDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQztJQUNqQixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDcEIsSUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBRWpCLElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUQsSUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RCxJQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQzVELElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFFNUQsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsSUFBTSxLQUFLLEdBQXNCLEVBQUUsQ0FBQztBQUNwQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzlCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO0lBQ3BDLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBRXJDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFL0IsSUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQzNCLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDOUIsaUZBQWlGO1FBQ2pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUVkLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkIsQ0FBQztBQUNELEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUViLHNCQUFzQixJQUFZLEVBQUUsUUFBZ0I7SUFDbEQsSUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN6QyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNqQixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUN6QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDZixDQUFDO0FBRUQ7SUFDRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUVsQixJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdCLEdBQUcsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25DLEdBQUcsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFFeEQsSUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsNkJBQTZCLEVBQUMsQ0FBQyxDQUFDO0lBQzdFLElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsWUFBWSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQ7SUFDRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUVsQixJQUFNLE9BQU8sR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQzNDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztJQUM3QixNQUFNLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFFL0IsSUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUFDLE1BQU0sQ0FBQztJQUVqQixJQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLDRCQUE0QixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRXRFLEdBQUcsQ0FBQyxNQUFNLEdBQUc7UUFDWCxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFekIsWUFBWSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDN0QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsVUFBQSxDQUFDO0lBQ25DLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNqQixXQUFXLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4QixXQUFXLEVBQUUsQ0FBQztJQUNoQixDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcbiAqIEEgZmFzdCBqYXZhc2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHNpbXBsZXggbm9pc2UgYnkgSm9uYXMgV2FnbmVyXG5cbkJhc2VkIG9uIGEgc3BlZWQtaW1wcm92ZWQgc2ltcGxleCBub2lzZSBhbGdvcml0aG0gZm9yIDJELCAzRCBhbmQgNEQgaW4gSmF2YS5cbldoaWNoIGlzIGJhc2VkIG9uIGV4YW1wbGUgY29kZSBieSBTdGVmYW4gR3VzdGF2c29uIChzdGVndUBpdG4ubGl1LnNlKS5cbldpdGggT3B0aW1pc2F0aW9ucyBieSBQZXRlciBFYXN0bWFuIChwZWFzdG1hbkBkcml6emxlLnN0YW5mb3JkLmVkdSkuXG5CZXR0ZXIgcmFuayBvcmRlcmluZyBtZXRob2QgYnkgU3RlZmFuIEd1c3RhdnNvbiBpbiAyMDEyLlxuXG5cbiBDb3B5cmlnaHQgKGMpIDIwMTggSm9uYXMgV2FnbmVyXG5cbiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiBTT0ZUV0FSRS5cbiAqL1xuKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIEYyID0gMC41ICogKE1hdGguc3FydCgzLjApIC0gMS4wKTtcbiAgdmFyIEcyID0gKDMuMCAtIE1hdGguc3FydCgzLjApKSAvIDYuMDtcbiAgdmFyIEYzID0gMS4wIC8gMy4wO1xuICB2YXIgRzMgPSAxLjAgLyA2LjA7XG4gIHZhciBGNCA9IChNYXRoLnNxcnQoNS4wKSAtIDEuMCkgLyA0LjA7XG4gIHZhciBHNCA9ICg1LjAgLSBNYXRoLnNxcnQoNS4wKSkgLyAyMC4wO1xuXG4gIGZ1bmN0aW9uIFNpbXBsZXhOb2lzZShyYW5kb21PclNlZWQpIHtcbiAgICB2YXIgcmFuZG9tO1xuICAgIGlmICh0eXBlb2YgcmFuZG9tT3JTZWVkID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJhbmRvbSA9IHJhbmRvbU9yU2VlZDtcbiAgICB9XG4gICAgZWxzZSBpZiAocmFuZG9tT3JTZWVkKSB7XG4gICAgICByYW5kb20gPSBhbGVhKHJhbmRvbU9yU2VlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmRvbSA9IE1hdGgucmFuZG9tO1xuICAgIH1cbiAgICB0aGlzLnAgPSBidWlsZFBlcm11dGF0aW9uVGFibGUocmFuZG9tKTtcbiAgICB0aGlzLnBlcm0gPSBuZXcgVWludDhBcnJheSg1MTIpO1xuICAgIHRoaXMucGVybU1vZDEyID0gbmV3IFVpbnQ4QXJyYXkoNTEyKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDUxMjsgaSsrKSB7XG4gICAgICB0aGlzLnBlcm1baV0gPSB0aGlzLnBbaSAmIDI1NV07XG4gICAgICB0aGlzLnBlcm1Nb2QxMltpXSA9IHRoaXMucGVybVtpXSAlIDEyO1xuICAgIH1cblxuICB9XG4gIFNpbXBsZXhOb2lzZS5wcm90b3R5cGUgPSB7XG4gICAgZ3JhZDM6IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDEsIDAsXG4gICAgICAtMSwgMSwgMCxcbiAgICAgIDEsIC0xLCAwLFxuXG4gICAgICAtMSwgLTEsIDAsXG4gICAgICAxLCAwLCAxLFxuICAgICAgLTEsIDAsIDEsXG5cbiAgICAgIDEsIDAsIC0xLFxuICAgICAgLTEsIDAsIC0xLFxuICAgICAgMCwgMSwgMSxcblxuICAgICAgMCwgLTEsIDEsXG4gICAgICAwLCAxLCAtMSxcbiAgICAgIDAsIC0xLCAtMV0pLFxuICAgIGdyYWQ0OiBuZXcgRmxvYXQzMkFycmF5KFswLCAxLCAxLCAxLCAwLCAxLCAxLCAtMSwgMCwgMSwgLTEsIDEsIDAsIDEsIC0xLCAtMSxcbiAgICAgIDAsIC0xLCAxLCAxLCAwLCAtMSwgMSwgLTEsIDAsIC0xLCAtMSwgMSwgMCwgLTEsIC0xLCAtMSxcbiAgICAgIDEsIDAsIDEsIDEsIDEsIDAsIDEsIC0xLCAxLCAwLCAtMSwgMSwgMSwgMCwgLTEsIC0xLFxuICAgICAgLTEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgLTEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLFxuICAgICAgMSwgMSwgMCwgMSwgMSwgMSwgMCwgLTEsIDEsIC0xLCAwLCAxLCAxLCAtMSwgMCwgLTEsXG4gICAgICAtMSwgMSwgMCwgMSwgLTEsIDEsIDAsIC0xLCAtMSwgLTEsIDAsIDEsIC0xLCAtMSwgMCwgLTEsXG4gICAgICAxLCAxLCAxLCAwLCAxLCAxLCAtMSwgMCwgMSwgLTEsIDEsIDAsIDEsIC0xLCAtMSwgMCxcbiAgICAgIC0xLCAxLCAxLCAwLCAtMSwgMSwgLTEsIDAsIC0xLCAtMSwgMSwgMCwgLTEsIC0xLCAtMSwgMF0pLFxuICAgIG5vaXNlMkQ6IGZ1bmN0aW9uKHhpbiwgeWluKSB7XG4gICAgICB2YXIgcGVybU1vZDEyID0gdGhpcy5wZXJtTW9kMTI7XG4gICAgICB2YXIgcGVybSA9IHRoaXMucGVybTtcbiAgICAgIHZhciBncmFkMyA9IHRoaXMuZ3JhZDM7XG4gICAgICB2YXIgbjAgPSAwOyAvLyBOb2lzZSBjb250cmlidXRpb25zIGZyb20gdGhlIHRocmVlIGNvcm5lcnNcbiAgICAgIHZhciBuMSA9IDA7XG4gICAgICB2YXIgbjIgPSAwO1xuICAgICAgLy8gU2tldyB0aGUgaW5wdXQgc3BhY2UgdG8gZGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggY2VsbCB3ZSdyZSBpblxuICAgICAgdmFyIHMgPSAoeGluICsgeWluKSAqIEYyOyAvLyBIYWlyeSBmYWN0b3IgZm9yIDJEXG4gICAgICB2YXIgaSA9IE1hdGguZmxvb3IoeGluICsgcyk7XG4gICAgICB2YXIgaiA9IE1hdGguZmxvb3IoeWluICsgcyk7XG4gICAgICB2YXIgdCA9IChpICsgaikgKiBHMjtcbiAgICAgIHZhciBYMCA9IGkgLSB0OyAvLyBVbnNrZXcgdGhlIGNlbGwgb3JpZ2luIGJhY2sgdG8gKHgseSkgc3BhY2VcbiAgICAgIHZhciBZMCA9IGogLSB0O1xuICAgICAgdmFyIHgwID0geGluIC0gWDA7IC8vIFRoZSB4LHkgZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG4gICAgICB2YXIgeTAgPSB5aW4gLSBZMDtcbiAgICAgIC8vIEZvciB0aGUgMkQgY2FzZSwgdGhlIHNpbXBsZXggc2hhcGUgaXMgYW4gZXF1aWxhdGVyYWwgdHJpYW5nbGUuXG4gICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggc2ltcGxleCB3ZSBhcmUgaW4uXG4gICAgICB2YXIgaTEsIGoxOyAvLyBPZmZzZXRzIGZvciBzZWNvbmQgKG1pZGRsZSkgY29ybmVyIG9mIHNpbXBsZXggaW4gKGksaikgY29vcmRzXG4gICAgICBpZiAoeDAgPiB5MCkge1xuICAgICAgICBpMSA9IDE7XG4gICAgICAgIGoxID0gMDtcbiAgICAgIH0gLy8gbG93ZXIgdHJpYW5nbGUsIFhZIG9yZGVyOiAoMCwwKS0+KDEsMCktPigxLDEpXG4gICAgICBlbHNlIHtcbiAgICAgICAgaTEgPSAwO1xuICAgICAgICBqMSA9IDE7XG4gICAgICB9IC8vIHVwcGVyIHRyaWFuZ2xlLCBZWCBvcmRlcjogKDAsMCktPigwLDEpLT4oMSwxKVxuICAgICAgLy8gQSBzdGVwIG9mICgxLDApIGluIChpLGopIG1lYW5zIGEgc3RlcCBvZiAoMS1jLC1jKSBpbiAoeCx5KSwgYW5kXG4gICAgICAvLyBhIHN0ZXAgb2YgKDAsMSkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgtYywxLWMpIGluICh4LHkpLCB3aGVyZVxuICAgICAgLy8gYyA9ICgzLXNxcnQoMykpLzZcbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHMjsgLy8gT2Zmc2V0cyBmb3IgbWlkZGxlIGNvcm5lciBpbiAoeCx5KSB1bnNrZXdlZCBjb29yZHNcbiAgICAgIHZhciB5MSA9IHkwIC0gajEgKyBHMjtcbiAgICAgIHZhciB4MiA9IHgwIC0gMS4wICsgMi4wICogRzI7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuICAgICAgdmFyIHkyID0geTAgLSAxLjAgKyAyLjAgKiBHMjtcbiAgICAgIC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgdGhyZWUgc2ltcGxleCBjb3JuZXJzXG4gICAgICB2YXIgaWkgPSBpICYgMjU1O1xuICAgICAgdmFyIGpqID0gaiAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIHRocmVlIGNvcm5lcnNcbiAgICAgIHZhciB0MCA9IDAuNSAtIHgwICogeDAgLSB5MCAqIHkwO1xuICAgICAgaWYgKHQwID49IDApIHtcbiAgICAgICAgdmFyIGdpMCA9IHBlcm1Nb2QxMltpaSArIHBlcm1bampdXSAqIDM7XG4gICAgICAgIHQwICo9IHQwO1xuICAgICAgICBuMCA9IHQwICogdDAgKiAoZ3JhZDNbZ2kwXSAqIHgwICsgZ3JhZDNbZ2kwICsgMV0gKiB5MCk7IC8vICh4LHkpIG9mIGdyYWQzIHVzZWQgZm9yIDJEIGdyYWRpZW50XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjUgLSB4MSAqIHgxIC0geTEgKiB5MTtcbiAgICAgIGlmICh0MSA+PSAwKSB7XG4gICAgICAgIHZhciBnaTEgPSBwZXJtTW9kMTJbaWkgKyBpMSArIHBlcm1bamogKyBqMV1dICogMztcbiAgICAgICAgdDEgKj0gdDE7XG4gICAgICAgIG4xID0gdDEgKiB0MSAqIChncmFkM1tnaTFdICogeDEgKyBncmFkM1tnaTEgKyAxXSAqIHkxKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MiA9IDAuNSAtIHgyICogeDIgLSB5MiAqIHkyO1xuICAgICAgaWYgKHQyID49IDApIHtcbiAgICAgICAgdmFyIGdpMiA9IHBlcm1Nb2QxMltpaSArIDEgKyBwZXJtW2pqICsgMV1dICogMztcbiAgICAgICAgdDIgKj0gdDI7XG4gICAgICAgIG4yID0gdDIgKiB0MiAqIChncmFkM1tnaTJdICogeDIgKyBncmFkM1tnaTIgKyAxXSAqIHkyKTtcbiAgICAgIH1cbiAgICAgIC8vIEFkZCBjb250cmlidXRpb25zIGZyb20gZWFjaCBjb3JuZXIgdG8gZ2V0IHRoZSBmaW5hbCBub2lzZSB2YWx1ZS5cbiAgICAgIC8vIFRoZSByZXN1bHQgaXMgc2NhbGVkIHRvIHJldHVybiB2YWx1ZXMgaW4gdGhlIGludGVydmFsIFstMSwxXS5cbiAgICAgIHJldHVybiA3MC4wICogKG4wICsgbjEgKyBuMik7XG4gICAgfSxcbiAgICAvLyAzRCBzaW1wbGV4IG5vaXNlXG4gICAgbm9pc2UzRDogZnVuY3Rpb24oeGluLCB5aW4sIHppbikge1xuICAgICAgdmFyIHBlcm1Nb2QxMiA9IHRoaXMucGVybU1vZDEyO1xuICAgICAgdmFyIHBlcm0gPSB0aGlzLnBlcm07XG4gICAgICB2YXIgZ3JhZDMgPSB0aGlzLmdyYWQzO1xuICAgICAgdmFyIG4wLCBuMSwgbjIsIG4zOyAvLyBOb2lzZSBjb250cmlidXRpb25zIGZyb20gdGhlIGZvdXIgY29ybmVyc1xuICAgICAgLy8gU2tldyB0aGUgaW5wdXQgc3BhY2UgdG8gZGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggY2VsbCB3ZSdyZSBpblxuICAgICAgdmFyIHMgPSAoeGluICsgeWluICsgemluKSAqIEYzOyAvLyBWZXJ5IG5pY2UgYW5kIHNpbXBsZSBza2V3IGZhY3RvciBmb3IgM0RcbiAgICAgIHZhciBpID0gTWF0aC5mbG9vcih4aW4gKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5aW4gKyBzKTtcbiAgICAgIHZhciBrID0gTWF0aC5mbG9vcih6aW4gKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqICsgaykgKiBHMztcbiAgICAgIHZhciBYMCA9IGkgLSB0OyAvLyBVbnNrZXcgdGhlIGNlbGwgb3JpZ2luIGJhY2sgdG8gKHgseSx6KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgWjAgPSBrIC0gdDtcbiAgICAgIHZhciB4MCA9IHhpbiAtIFgwOyAvLyBUaGUgeCx5LHogZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG4gICAgICB2YXIgeTAgPSB5aW4gLSBZMDtcbiAgICAgIHZhciB6MCA9IHppbiAtIFowO1xuICAgICAgLy8gRm9yIHRoZSAzRCBjYXNlLCB0aGUgc2ltcGxleCBzaGFwZSBpcyBhIHNsaWdodGx5IGlycmVndWxhciB0ZXRyYWhlZHJvbi5cbiAgICAgIC8vIERldGVybWluZSB3aGljaCBzaW1wbGV4IHdlIGFyZSBpbi5cbiAgICAgIHZhciBpMSwgajEsIGsxOyAvLyBPZmZzZXRzIGZvciBzZWNvbmQgY29ybmVyIG9mIHNpbXBsZXggaW4gKGksaixrKSBjb29yZHNcbiAgICAgIHZhciBpMiwgajIsIGsyOyAvLyBPZmZzZXRzIGZvciB0aGlyZCBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqLGspIGNvb3Jkc1xuICAgICAgaWYgKHgwID49IHkwKSB7XG4gICAgICAgIGlmICh5MCA+PSB6MCkge1xuICAgICAgICAgIGkxID0gMTtcbiAgICAgICAgICBqMSA9IDA7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMTtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAwO1xuICAgICAgICB9IC8vIFggWSBaIG9yZGVyXG4gICAgICAgIGVsc2UgaWYgKHgwID49IHowKSB7XG4gICAgICAgICAgaTEgPSAxO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDA7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMDtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWCBaIFkgb3JkZXJcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaTEgPSAwO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDE7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMDtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWiBYIFkgb3JkZXJcbiAgICAgIH1cbiAgICAgIGVsc2UgeyAvLyB4MDx5MFxuICAgICAgICBpZiAoeTAgPCB6MCkge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDA7XG4gICAgICAgICAgazEgPSAxO1xuICAgICAgICAgIGkyID0gMDtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAxO1xuICAgICAgICB9IC8vIFogWSBYIG9yZGVyXG4gICAgICAgIGVsc2UgaWYgKHgwIDwgejApIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAxO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDA7XG4gICAgICAgICAgajIgPSAxO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBZIFogWCBvcmRlclxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAxO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAxO1xuICAgICAgICAgIGsyID0gMDtcbiAgICAgICAgfSAvLyBZIFggWiBvcmRlclxuICAgICAgfVxuICAgICAgLy8gQSBzdGVwIG9mICgxLDAsMCkgaW4gKGksaixrKSBtZWFucyBhIHN0ZXAgb2YgKDEtYywtYywtYykgaW4gKHgseSx6KSxcbiAgICAgIC8vIGEgc3RlcCBvZiAoMCwxLDApIGluIChpLGosaykgbWVhbnMgYSBzdGVwIG9mICgtYywxLWMsLWMpIGluICh4LHkseiksIGFuZFxuICAgICAgLy8gYSBzdGVwIG9mICgwLDAsMSkgaW4gKGksaixrKSBtZWFucyBhIHN0ZXAgb2YgKC1jLC1jLDEtYykgaW4gKHgseSx6KSwgd2hlcmVcbiAgICAgIC8vIGMgPSAxLzYuXG4gICAgICB2YXIgeDEgPSB4MCAtIGkxICsgRzM7IC8vIE9mZnNldHMgZm9yIHNlY29uZCBjb3JuZXIgaW4gKHgseSx6KSBjb29yZHNcbiAgICAgIHZhciB5MSA9IHkwIC0gajEgKyBHMztcbiAgICAgIHZhciB6MSA9IHowIC0gazEgKyBHMztcbiAgICAgIHZhciB4MiA9IHgwIC0gaTIgKyAyLjAgKiBHMzsgLy8gT2Zmc2V0cyBmb3IgdGhpcmQgY29ybmVyIGluICh4LHkseikgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIGoyICsgMi4wICogRzM7XG4gICAgICB2YXIgejIgPSB6MCAtIGsyICsgMi4wICogRzM7XG4gICAgICB2YXIgeDMgPSB4MCAtIDEuMCArIDMuMCAqIEczOyAvLyBPZmZzZXRzIGZvciBsYXN0IGNvcm5lciBpbiAoeCx5LHopIGNvb3Jkc1xuICAgICAgdmFyIHkzID0geTAgLSAxLjAgKyAzLjAgKiBHMztcbiAgICAgIHZhciB6MyA9IHowIC0gMS4wICsgMy4wICogRzM7XG4gICAgICAvLyBXb3JrIG91dCB0aGUgaGFzaGVkIGdyYWRpZW50IGluZGljZXMgb2YgdGhlIGZvdXIgc2ltcGxleCBjb3JuZXJzXG4gICAgICB2YXIgaWkgPSBpICYgMjU1O1xuICAgICAgdmFyIGpqID0gaiAmIDI1NTtcbiAgICAgIHZhciBrayA9IGsgJiAyNTU7XG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGNvbnRyaWJ1dGlvbiBmcm9tIHRoZSBmb3VyIGNvcm5lcnNcbiAgICAgIHZhciB0MCA9IDAuNiAtIHgwICogeDAgLSB5MCAqIHkwIC0gejAgKiB6MDtcbiAgICAgIGlmICh0MCA8IDApIG4wID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTAgPSBwZXJtTW9kMTJbaWkgKyBwZXJtW2pqICsgcGVybVtra11dXSAqIDM7XG4gICAgICAgIHQwICo9IHQwO1xuICAgICAgICBuMCA9IHQwICogdDAgKiAoZ3JhZDNbZ2kwXSAqIHgwICsgZ3JhZDNbZ2kwICsgMV0gKiB5MCArIGdyYWQzW2dpMCArIDJdICogejApO1xuICAgICAgfVxuICAgICAgdmFyIHQxID0gMC42IC0geDEgKiB4MSAtIHkxICogeTEgLSB6MSAqIHoxO1xuICAgICAgaWYgKHQxIDwgMCkgbjEgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMSA9IHBlcm1Nb2QxMltpaSArIGkxICsgcGVybVtqaiArIGoxICsgcGVybVtrayArIGsxXV1dICogMztcbiAgICAgICAgdDEgKj0gdDE7XG4gICAgICAgIG4xID0gdDEgKiB0MSAqIChncmFkM1tnaTFdICogeDEgKyBncmFkM1tnaTEgKyAxXSAqIHkxICsgZ3JhZDNbZ2kxICsgMl0gKiB6MSk7XG4gICAgICB9XG4gICAgICB2YXIgdDIgPSAwLjYgLSB4MiAqIHgyIC0geTIgKiB5MiAtIHoyICogejI7XG4gICAgICBpZiAodDIgPCAwKSBuMiA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kyID0gcGVybU1vZDEyW2lpICsgaTIgKyBwZXJtW2pqICsgajIgKyBwZXJtW2trICsgazJdXV0gKiAzO1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKGdyYWQzW2dpMl0gKiB4MiArIGdyYWQzW2dpMiArIDFdICogeTIgKyBncmFkM1tnaTIgKyAyXSAqIHoyKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MyA9IDAuNiAtIHgzICogeDMgLSB5MyAqIHkzIC0gejMgKiB6MztcbiAgICAgIGlmICh0MyA8IDApIG4zID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTMgPSBwZXJtTW9kMTJbaWkgKyAxICsgcGVybVtqaiArIDEgKyBwZXJtW2trICsgMV1dXSAqIDM7XG4gICAgICAgIHQzICo9IHQzO1xuICAgICAgICBuMyA9IHQzICogdDMgKiAoZ3JhZDNbZ2kzXSAqIHgzICsgZ3JhZDNbZ2kzICsgMV0gKiB5MyArIGdyYWQzW2dpMyArIDJdICogejMpO1xuICAgICAgfVxuICAgICAgLy8gQWRkIGNvbnRyaWJ1dGlvbnMgZnJvbSBlYWNoIGNvcm5lciB0byBnZXQgdGhlIGZpbmFsIG5vaXNlIHZhbHVlLlxuICAgICAgLy8gVGhlIHJlc3VsdCBpcyBzY2FsZWQgdG8gc3RheSBqdXN0IGluc2lkZSBbLTEsMV1cbiAgICAgIHJldHVybiAzMi4wICogKG4wICsgbjEgKyBuMiArIG4zKTtcbiAgICB9LFxuICAgIC8vIDREIHNpbXBsZXggbm9pc2UsIGJldHRlciBzaW1wbGV4IHJhbmsgb3JkZXJpbmcgbWV0aG9kIDIwMTItMDMtMDlcbiAgICBub2lzZTREOiBmdW5jdGlvbih4LCB5LCB6LCB3KSB7XG4gICAgICB2YXIgcGVybSA9IHRoaXMucGVybTtcbiAgICAgIHZhciBncmFkNCA9IHRoaXMuZ3JhZDQ7XG5cbiAgICAgIHZhciBuMCwgbjEsIG4yLCBuMywgbjQ7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgZml2ZSBjb3JuZXJzXG4gICAgICAvLyBTa2V3IHRoZSAoeCx5LHosdykgc3BhY2UgdG8gZGV0ZXJtaW5lIHdoaWNoIGNlbGwgb2YgMjQgc2ltcGxpY2VzIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4ICsgeSArIHogKyB3KSAqIEY0OyAvLyBGYWN0b3IgZm9yIDREIHNrZXdpbmdcbiAgICAgIHZhciBpID0gTWF0aC5mbG9vcih4ICsgcyk7XG4gICAgICB2YXIgaiA9IE1hdGguZmxvb3IoeSArIHMpO1xuICAgICAgdmFyIGsgPSBNYXRoLmZsb29yKHogKyBzKTtcbiAgICAgIHZhciBsID0gTWF0aC5mbG9vcih3ICsgcyk7XG4gICAgICB2YXIgdCA9IChpICsgaiArIGsgKyBsKSAqIEc0OyAvLyBGYWN0b3IgZm9yIDREIHVuc2tld2luZ1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5LHosdykgc3BhY2VcbiAgICAgIHZhciBZMCA9IGogLSB0O1xuICAgICAgdmFyIFowID0gayAtIHQ7XG4gICAgICB2YXIgVzAgPSBsIC0gdDtcbiAgICAgIHZhciB4MCA9IHggLSBYMDsgLy8gVGhlIHgseSx6LHcgZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG4gICAgICB2YXIgeTAgPSB5IC0gWTA7XG4gICAgICB2YXIgejAgPSB6IC0gWjA7XG4gICAgICB2YXIgdzAgPSB3IC0gVzA7XG4gICAgICAvLyBGb3IgdGhlIDREIGNhc2UsIHRoZSBzaW1wbGV4IGlzIGEgNEQgc2hhcGUgSSB3b24ndCBldmVuIHRyeSB0byBkZXNjcmliZS5cbiAgICAgIC8vIFRvIGZpbmQgb3V0IHdoaWNoIG9mIHRoZSAyNCBwb3NzaWJsZSBzaW1wbGljZXMgd2UncmUgaW4sIHdlIG5lZWQgdG9cbiAgICAgIC8vIGRldGVybWluZSB0aGUgbWFnbml0dWRlIG9yZGVyaW5nIG9mIHgwLCB5MCwgejAgYW5kIHcwLlxuICAgICAgLy8gU2l4IHBhaXItd2lzZSBjb21wYXJpc29ucyBhcmUgcGVyZm9ybWVkIGJldHdlZW4gZWFjaCBwb3NzaWJsZSBwYWlyXG4gICAgICAvLyBvZiB0aGUgZm91ciBjb29yZGluYXRlcywgYW5kIHRoZSByZXN1bHRzIGFyZSB1c2VkIHRvIHJhbmsgdGhlIG51bWJlcnMuXG4gICAgICB2YXIgcmFua3ggPSAwO1xuICAgICAgdmFyIHJhbmt5ID0gMDtcbiAgICAgIHZhciByYW5reiA9IDA7XG4gICAgICB2YXIgcmFua3cgPSAwO1xuICAgICAgaWYgKHgwID4geTApIHJhbmt4Kys7XG4gICAgICBlbHNlIHJhbmt5Kys7XG4gICAgICBpZiAoeDAgPiB6MCkgcmFua3grKztcbiAgICAgIGVsc2UgcmFua3orKztcbiAgICAgIGlmICh4MCA+IHcwKSByYW5reCsrO1xuICAgICAgZWxzZSByYW5rdysrO1xuICAgICAgaWYgKHkwID4gejApIHJhbmt5Kys7XG4gICAgICBlbHNlIHJhbmt6Kys7XG4gICAgICBpZiAoeTAgPiB3MCkgcmFua3krKztcbiAgICAgIGVsc2UgcmFua3crKztcbiAgICAgIGlmICh6MCA+IHcwKSByYW5reisrO1xuICAgICAgZWxzZSByYW5rdysrO1xuICAgICAgdmFyIGkxLCBqMSwgazEsIGwxOyAvLyBUaGUgaW50ZWdlciBvZmZzZXRzIGZvciB0aGUgc2Vjb25kIHNpbXBsZXggY29ybmVyXG4gICAgICB2YXIgaTIsIGoyLCBrMiwgbDI7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSB0aGlyZCBzaW1wbGV4IGNvcm5lclxuICAgICAgdmFyIGkzLCBqMywgazMsIGwzOyAvLyBUaGUgaW50ZWdlciBvZmZzZXRzIGZvciB0aGUgZm91cnRoIHNpbXBsZXggY29ybmVyXG4gICAgICAvLyBzaW1wbGV4W2NdIGlzIGEgNC12ZWN0b3Igd2l0aCB0aGUgbnVtYmVycyAwLCAxLCAyIGFuZCAzIGluIHNvbWUgb3JkZXIuXG4gICAgICAvLyBNYW55IHZhbHVlcyBvZiBjIHdpbGwgbmV2ZXIgb2NjdXIsIHNpbmNlIGUuZy4geD55Pno+dyBtYWtlcyB4PHosIHk8dyBhbmQgeDx3XG4gICAgICAvLyBpbXBvc3NpYmxlLiBPbmx5IHRoZSAyNCBpbmRpY2VzIHdoaWNoIGhhdmUgbm9uLXplcm8gZW50cmllcyBtYWtlIGFueSBzZW5zZS5cbiAgICAgIC8vIFdlIHVzZSBhIHRocmVzaG9sZGluZyB0byBzZXQgdGhlIGNvb3JkaW5hdGVzIGluIHR1cm4gZnJvbSB0aGUgbGFyZ2VzdCBtYWduaXR1ZGUuXG4gICAgICAvLyBSYW5rIDMgZGVub3RlcyB0aGUgbGFyZ2VzdCBjb29yZGluYXRlLlxuICAgICAgaTEgPSByYW5reCA+PSAzID8gMSA6IDA7XG4gICAgICBqMSA9IHJhbmt5ID49IDMgPyAxIDogMDtcbiAgICAgIGsxID0gcmFua3ogPj0gMyA/IDEgOiAwO1xuICAgICAgbDEgPSByYW5rdyA+PSAzID8gMSA6IDA7XG4gICAgICAvLyBSYW5rIDIgZGVub3RlcyB0aGUgc2Vjb25kIGxhcmdlc3QgY29vcmRpbmF0ZS5cbiAgICAgIGkyID0gcmFua3ggPj0gMiA/IDEgOiAwO1xuICAgICAgajIgPSByYW5reSA+PSAyID8gMSA6IDA7XG4gICAgICBrMiA9IHJhbmt6ID49IDIgPyAxIDogMDtcbiAgICAgIGwyID0gcmFua3cgPj0gMiA/IDEgOiAwO1xuICAgICAgLy8gUmFuayAxIGRlbm90ZXMgdGhlIHNlY29uZCBzbWFsbGVzdCBjb29yZGluYXRlLlxuICAgICAgaTMgPSByYW5reCA+PSAxID8gMSA6IDA7XG4gICAgICBqMyA9IHJhbmt5ID49IDEgPyAxIDogMDtcbiAgICAgIGszID0gcmFua3ogPj0gMSA/IDEgOiAwO1xuICAgICAgbDMgPSByYW5rdyA+PSAxID8gMSA6IDA7XG4gICAgICAvLyBUaGUgZmlmdGggY29ybmVyIGhhcyBhbGwgY29vcmRpbmF0ZSBvZmZzZXRzID0gMSwgc28gbm8gbmVlZCB0byBjb21wdXRlIHRoYXQuXG4gICAgICB2YXIgeDEgPSB4MCAtIGkxICsgRzQ7IC8vIE9mZnNldHMgZm9yIHNlY29uZCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEc0O1xuICAgICAgdmFyIHoxID0gejAgLSBrMSArIEc0O1xuICAgICAgdmFyIHcxID0gdzAgLSBsMSArIEc0O1xuICAgICAgdmFyIHgyID0geDAgLSBpMiArIDIuMCAqIEc0OyAvLyBPZmZzZXRzIGZvciB0aGlyZCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHkyID0geTAgLSBqMiArIDIuMCAqIEc0O1xuICAgICAgdmFyIHoyID0gejAgLSBrMiArIDIuMCAqIEc0O1xuICAgICAgdmFyIHcyID0gdzAgLSBsMiArIDIuMCAqIEc0O1xuICAgICAgdmFyIHgzID0geDAgLSBpMyArIDMuMCAqIEc0OyAvLyBPZmZzZXRzIGZvciBmb3VydGggY29ybmVyIGluICh4LHkseix3KSBjb29yZHNcbiAgICAgIHZhciB5MyA9IHkwIC0gajMgKyAzLjAgKiBHNDtcbiAgICAgIHZhciB6MyA9IHowIC0gazMgKyAzLjAgKiBHNDtcbiAgICAgIHZhciB3MyA9IHcwIC0gbDMgKyAzLjAgKiBHNDtcbiAgICAgIHZhciB4NCA9IHgwIC0gMS4wICsgNC4wICogRzQ7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkseix3KSBjb29yZHNcbiAgICAgIHZhciB5NCA9IHkwIC0gMS4wICsgNC4wICogRzQ7XG4gICAgICB2YXIgejQgPSB6MCAtIDEuMCArIDQuMCAqIEc0O1xuICAgICAgdmFyIHc0ID0gdzAgLSAxLjAgKyA0LjAgKiBHNDtcbiAgICAgIC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgZml2ZSBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgdmFyIGtrID0gayAmIDI1NTtcbiAgICAgIHZhciBsbCA9IGwgJiAyNTU7XG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGNvbnRyaWJ1dGlvbiBmcm9tIHRoZSBmaXZlIGNvcm5lcnNcbiAgICAgIHZhciB0MCA9IDAuNiAtIHgwICogeDAgLSB5MCAqIHkwIC0gejAgKiB6MCAtIHcwICogdzA7XG4gICAgICBpZiAodDAgPCAwKSBuMCA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kwID0gKHBlcm1baWkgKyBwZXJtW2pqICsgcGVybVtrayArIHBlcm1bbGxdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkNFtnaTBdICogeDAgKyBncmFkNFtnaTAgKyAxXSAqIHkwICsgZ3JhZDRbZ2kwICsgMl0gKiB6MCArIGdyYWQ0W2dpMCArIDNdICogdzApO1xuICAgICAgfVxuICAgICAgdmFyIHQxID0gMC42IC0geDEgKiB4MSAtIHkxICogeTEgLSB6MSAqIHoxIC0gdzEgKiB3MTtcbiAgICAgIGlmICh0MSA8IDApIG4xID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTEgPSAocGVybVtpaSArIGkxICsgcGVybVtqaiArIGoxICsgcGVybVtrayArIGsxICsgcGVybVtsbCArIGwxXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQxICo9IHQxO1xuICAgICAgICBuMSA9IHQxICogdDEgKiAoZ3JhZDRbZ2kxXSAqIHgxICsgZ3JhZDRbZ2kxICsgMV0gKiB5MSArIGdyYWQ0W2dpMSArIDJdICogejEgKyBncmFkNFtnaTEgKyAzXSAqIHcxKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MiA9IDAuNiAtIHgyICogeDIgLSB5MiAqIHkyIC0gejIgKiB6MiAtIHcyICogdzI7XG4gICAgICBpZiAodDIgPCAwKSBuMiA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kyID0gKHBlcm1baWkgKyBpMiArIHBlcm1bamogKyBqMiArIHBlcm1ba2sgKyBrMiArIHBlcm1bbGwgKyBsMl1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKGdyYWQ0W2dpMl0gKiB4MiArIGdyYWQ0W2dpMiArIDFdICogeTIgKyBncmFkNFtnaTIgKyAyXSAqIHoyICsgZ3JhZDRbZ2kyICsgM10gKiB3Mik7XG4gICAgICB9XG4gICAgICB2YXIgdDMgPSAwLjYgLSB4MyAqIHgzIC0geTMgKiB5MyAtIHozICogejMgLSB3MyAqIHczO1xuICAgICAgaWYgKHQzIDwgMCkgbjMgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMyA9IChwZXJtW2lpICsgaTMgKyBwZXJtW2pqICsgajMgKyBwZXJtW2trICsgazMgKyBwZXJtW2xsICsgbDNdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDMgKj0gdDM7XG4gICAgICAgIG4zID0gdDMgKiB0MyAqIChncmFkNFtnaTNdICogeDMgKyBncmFkNFtnaTMgKyAxXSAqIHkzICsgZ3JhZDRbZ2kzICsgMl0gKiB6MyArIGdyYWQ0W2dpMyArIDNdICogdzMpO1xuICAgICAgfVxuICAgICAgdmFyIHQ0ID0gMC42IC0geDQgKiB4NCAtIHk0ICogeTQgLSB6NCAqIHo0IC0gdzQgKiB3NDtcbiAgICAgIGlmICh0NCA8IDApIG40ID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTQgPSAocGVybVtpaSArIDEgKyBwZXJtW2pqICsgMSArIHBlcm1ba2sgKyAxICsgcGVybVtsbCArIDFdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDQgKj0gdDQ7XG4gICAgICAgIG40ID0gdDQgKiB0NCAqIChncmFkNFtnaTRdICogeDQgKyBncmFkNFtnaTQgKyAxXSAqIHk0ICsgZ3JhZDRbZ2k0ICsgMl0gKiB6NCArIGdyYWQ0W2dpNCArIDNdICogdzQpO1xuICAgICAgfVxuICAgICAgLy8gU3VtIHVwIGFuZCBzY2FsZSB0aGUgcmVzdWx0IHRvIGNvdmVyIHRoZSByYW5nZSBbLTEsMV1cbiAgICAgIHJldHVybiAyNy4wICogKG4wICsgbjEgKyBuMiArIG4zICsgbjQpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBidWlsZFBlcm11dGF0aW9uVGFibGUocmFuZG9tKSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIHAgPSBuZXcgVWludDhBcnJheSgyNTYpO1xuICAgIGZvciAoaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICAgICAgcFtpXSA9IGk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCAyNTU7IGkrKykge1xuICAgICAgdmFyIHIgPSBpICsgfn4ocmFuZG9tKCkgKiAoMjU2IC0gaSkpO1xuICAgICAgdmFyIGF1eCA9IHBbaV07XG4gICAgICBwW2ldID0gcFtyXTtcbiAgICAgIHBbcl0gPSBhdXg7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9XG4gIFNpbXBsZXhOb2lzZS5fYnVpbGRQZXJtdXRhdGlvblRhYmxlID0gYnVpbGRQZXJtdXRhdGlvblRhYmxlO1xuXG4gIGZ1bmN0aW9uIGFsZWEoKSB7XG4gICAgLy8gSm9oYW5uZXMgQmFhZ8O4ZSA8YmFhZ29lQGJhYWdvZS5jb20+LCAyMDEwXG4gICAgdmFyIHMwID0gMDtcbiAgICB2YXIgczEgPSAwO1xuICAgIHZhciBzMiA9IDA7XG4gICAgdmFyIGMgPSAxO1xuXG4gICAgdmFyIG1hc2ggPSBtYXNoZXIoKTtcbiAgICBzMCA9IG1hc2goJyAnKTtcbiAgICBzMSA9IG1hc2goJyAnKTtcbiAgICBzMiA9IG1hc2goJyAnKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzMCAtPSBtYXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICBpZiAoczAgPCAwKSB7XG4gICAgICAgIHMwICs9IDE7XG4gICAgICB9XG4gICAgICBzMSAtPSBtYXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICBpZiAoczEgPCAwKSB7XG4gICAgICAgIHMxICs9IDE7XG4gICAgICB9XG4gICAgICBzMiAtPSBtYXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICBpZiAoczIgPCAwKSB7XG4gICAgICAgIHMyICs9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIG1hc2ggPSBudWxsO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0ID0gMjA5MTYzOSAqIHMwICsgYyAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgICBzMCA9IHMxO1xuICAgICAgczEgPSBzMjtcbiAgICAgIHJldHVybiBzMiA9IHQgLSAoYyA9IHQgfCAwKTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIG1hc2hlcigpIHtcbiAgICB2YXIgbiA9IDB4ZWZjODI0OWQ7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbiArPSBkYXRhLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIHZhciBoID0gMC4wMjUxOTYwMzI4MjQxNjkzOCAqIG47XG4gICAgICAgIG4gPSBoID4+PiAwO1xuICAgICAgICBoIC09IG47XG4gICAgICAgIGggKj0gbjtcbiAgICAgICAgbiA9IGggPj4+IDA7XG4gICAgICAgIGggLT0gbjtcbiAgICAgICAgbiArPSBoICogMHgxMDAwMDAwMDA7IC8vIDJeMzJcbiAgICAgIH1cbiAgICAgIHJldHVybiAobiA+Pj4gMCkgKiAyLjMyODMwNjQzNjUzODY5NjNlLTEwOyAvLyAyXi0zMlxuICAgIH07XG4gIH1cblxuICAvLyBhbWRcbiAgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIGRlZmluZShmdW5jdGlvbigpIHtyZXR1cm4gU2ltcGxleE5vaXNlO30pO1xuICAvLyBjb21tb24ganNcbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykgZXhwb3J0cy5TaW1wbGV4Tm9pc2UgPSBTaW1wbGV4Tm9pc2U7XG4gIC8vIGJyb3dzZXJcbiAgZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHdpbmRvdy5TaW1wbGV4Tm9pc2UgPSBTaW1wbGV4Tm9pc2U7XG4gIC8vIG5vZGVqc1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFNpbXBsZXhOb2lzZTtcbiAgfVxuXG59KSgpO1xuIiwiLyoqXHJcbiAqIHR3by5qc1xyXG4gKiBhIHR3by1kaW1lbnNpb25hbCBkcmF3aW5nIGFwaSBtZWFudCBmb3IgbW9kZXJuIGJyb3dzZXJzLiBJdCBpcyByZW5kZXJlclxyXG4gKiBhZ25vc3RpYyBlbmFibGluZyB0aGUgc2FtZSBhcGkgZm9yIHJlbmRlcmluZyBpbiBtdWx0aXBsZSBjb250ZXh0czogd2ViZ2wsXHJcbiAqIGNhbnZhczJkLCBhbmQgc3ZnLlxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIgLSAyMDE3IGpvbm9icjEgLyBodHRwOi8vam9ub2JyMS5jb21cclxuICpcclxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxyXG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXHJcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcclxuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxyXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcclxuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuICpcclxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cclxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAqXHJcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxyXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXHJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cclxuICogVEhFIFNPRlRXQVJFLlxyXG4gKlxyXG4gKi9cclxuXHJcbnRoaXMuVHdvID0gKGZ1bmN0aW9uKHByZXZpb3VzVHdvKSB7XHJcblxyXG4gIHZhciByb290ID0gdHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiBudWxsO1xyXG4gIHZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XHJcbiAgdmFyIF8gPSB7XHJcbiAgICAvLyBodHRwOi8vdW5kZXJzY29yZWpzLm9yZy8g4oCiIDEuOC4zXHJcbiAgICBfaW5kZXhBbW91bnQ6IDAsXHJcbiAgICBuYXR1cmFsOiB7XHJcbiAgICAgIHNsaWNlOiBBcnJheS5wcm90b3R5cGUuc2xpY2UsXHJcbiAgICAgIGluZGV4T2Y6IEFycmF5LnByb3RvdHlwZS5pbmRleE9mLFxyXG4gICAgICBrZXlzOiBPYmplY3Qua2V5cyxcclxuICAgICAgYmluZDogRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQsXHJcbiAgICAgIGNyZWF0ZTogT2JqZWN0LmNyZWF0ZVxyXG4gICAgfSxcclxuICAgIGlkZW50aXR5OiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9LFxyXG4gICAgaXNBcmd1bWVudHM6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcmd1bWVudHNdJztcclxuICAgIH0sXHJcbiAgICBpc0Z1bmN0aW9uOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcclxuICAgIH0sXHJcbiAgICBpc1N0cmluZzogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nO1xyXG4gICAgfSxcclxuICAgIGlzTnVtYmVyOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgTnVtYmVyXSc7XHJcbiAgICB9LFxyXG4gICAgaXNEYXRlOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xyXG4gICAgfSxcclxuICAgIGlzUmVnRXhwOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XHJcbiAgICB9LFxyXG4gICAgaXNFcnJvcjogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEVycm9yXSc7XHJcbiAgICB9LFxyXG4gICAgaXNGaW5pdGU6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gaXNGaW5pdGUob2JqKSAmJiAhaXNOYU4ocGFyc2VGbG9hdChvYmopKTtcclxuICAgIH0sXHJcbiAgICBpc05hTjogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9PSArb2JqO1xyXG4gICAgfSxcclxuICAgIGlzQm9vbGVhbjogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEJvb2xlYW5dJztcclxuICAgIH0sXHJcbiAgICBpc051bGw6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gb2JqID09PSBudWxsO1xyXG4gICAgfSxcclxuICAgIGlzVW5kZWZpbmVkOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xyXG4gICAgfSxcclxuICAgIGlzRW1wdHk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xyXG4gICAgICBpZiAoaXNBcnJheUxpa2UgJiYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSB8fCBfLmlzQXJndW1lbnRzKG9iaikpKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcclxuICAgICAgcmV0dXJuIF8ua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcclxuICAgIH0sXHJcbiAgICBpc0VsZW1lbnQ6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XHJcbiAgICB9LFxyXG4gICAgaXNBcnJheTogQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcclxuICAgIH0sXHJcbiAgICBpc09iamVjdDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcclxuICAgICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XHJcbiAgICB9LFxyXG4gICAgdG9BcnJheTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIGlmICghb2JqKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChfLmlzQXJyYXkob2JqKSkge1xyXG4gICAgICAgIHJldHVybiBzbGljZS5jYWxsKG9iaik7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGlzQXJyYXlMaWtlKG9iaikpIHtcclxuICAgICAgICByZXR1cm4gXy5tYXAob2JqLCBfLmlkZW50aXR5KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gXy52YWx1ZXMob2JqKTtcclxuICAgIH0sXHJcbiAgICByYW5nZTogZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcclxuICAgICAgaWYgKHN0b3AgPT0gbnVsbCkge1xyXG4gICAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xyXG4gICAgICAgIHN0YXJ0ID0gMDtcclxuICAgICAgfVxyXG4gICAgICBzdGVwID0gc3RlcCB8fCAxO1xyXG5cclxuICAgICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcclxuICAgICAgdmFyIHJhbmdlID0gQXJyYXkobGVuZ3RoKTtcclxuXHJcbiAgICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGxlbmd0aDsgaWR4KyssIHN0YXJ0ICs9IHN0ZXApIHtcclxuICAgICAgICByYW5nZVtpZHhdID0gc3RhcnQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByYW5nZTtcclxuICAgIH0sXHJcbiAgICBpbmRleE9mOiBmdW5jdGlvbihsaXN0LCBpdGVtKSB7XHJcbiAgICAgIGlmICghIV8ubmF0dXJhbC5pbmRleE9mKSB7XHJcbiAgICAgICAgcmV0dXJuIF8ubmF0dXJhbC5pbmRleE9mLmNhbGwobGlzdCwgaXRlbSk7XHJcbiAgICAgIH1cclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGxpc3RbaV0gPT09IGl0ZW0pIHtcclxuICAgICAgICAgIHJldHVybiBpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gLTE7XHJcbiAgICB9LFxyXG4gICAgaGFzOiBmdW5jdGlvbihvYmosIGtleSkge1xyXG4gICAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XHJcbiAgICB9LFxyXG4gICAgYmluZDogZnVuY3Rpb24oZnVuYywgY3R4KSB7XHJcbiAgICAgIHZhciBuYXR1cmFsID0gXy5uYXR1cmFsLmJpbmQ7XHJcbiAgICAgIGlmIChuYXR1cmFsICYmIGZ1bmMuYmluZCA9PT0gbmF0dXJhbCkge1xyXG4gICAgICAgIHJldHVybiBuYXR1cmFsLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICBmdW5jLmFwcGx5KGN0eCwgYXJncyk7XHJcbiAgICAgIH07XHJcbiAgICB9LFxyXG4gICAgZXh0ZW5kOiBmdW5jdGlvbihiYXNlKSB7XHJcbiAgICAgIHZhciBzb3VyY2VzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgb2JqID0gc291cmNlc1tpXTtcclxuICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xyXG4gICAgICAgICAgYmFzZVtrXSA9IG9ialtrXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGJhc2U7XHJcbiAgICB9LFxyXG4gICAgZGVmYXVsdHM6IGZ1bmN0aW9uKGJhc2UpIHtcclxuICAgICAgdmFyIHNvdXJjZXMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBvYmogPSBzb3VyY2VzW2ldO1xyXG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XHJcbiAgICAgICAgICBpZiAoYmFzZVtrXSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgIGJhc2Vba10gPSBvYmpba107XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBiYXNlO1xyXG4gICAgfSxcclxuICAgIGtleXM6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoXy5uYXR1cmFsLmtleXMpIHtcclxuICAgICAgICByZXR1cm4gXy5uYXR1cmFsLmtleXMob2JqKTtcclxuICAgICAgfVxyXG4gICAgICB2YXIga2V5cyA9IFtdO1xyXG4gICAgICBmb3IgKHZhciBrIGluIG9iaikge1xyXG4gICAgICAgIGlmIChfLmhhcyhvYmosIGspKSB7XHJcbiAgICAgICAgICBrZXlzLnB1c2goayk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgfSxcclxuICAgIHZhbHVlczogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XHJcbiAgICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xyXG4gICAgICAgIHZhbHVlcy5wdXNoKG9ialtrXSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgIH0sXHJcbiAgICBlYWNoOiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XHJcbiAgICAgIHZhciBjdHggPSBjb250ZXh0IHx8IHRoaXM7XHJcbiAgICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaik7XHJcbiAgICAgIHZhciBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aDtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBrID0ga2V5cyA/IGtleXNbaV0gOiBpO1xyXG4gICAgICAgIGl0ZXJhdGVlLmNhbGwoY3R4LCBvYmpba10sIGssIG9iaik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG9iajtcclxuICAgIH0sXHJcbiAgICBtYXA6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcclxuICAgICAgdmFyIGN0eCA9IGNvbnRleHQgfHwgdGhpcztcclxuICAgICAgdmFyIGtleXMgPSAhaXNBcnJheUxpa2Uob2JqKSAmJiBfLmtleXMob2JqKTtcclxuICAgICAgdmFyIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoO1xyXG4gICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgayA9IGtleXMgPyBrZXlzW2ldIDogaTtcclxuICAgICAgICByZXN1bHRbaV0gPSBpdGVyYXRlZS5jYWxsKGN0eCwgb2JqW2tdLCBrLCBvYmopO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG4gICAgb25jZTogZnVuY3Rpb24oZnVuYykge1xyXG4gICAgICB2YXIgaW5pdCA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCEhaW5pdCkge1xyXG4gICAgICAgICAgcmV0dXJuIGZ1bmM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGluaXQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBhZnRlcjogZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHdoaWxlICgtLXRpbWVzIDwgMSkge1xyXG4gICAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB1bmlxdWVJZDogZnVuY3Rpb24ocHJlZml4KSB7XHJcbiAgICAgIHZhciBpZCA9ICsrXy5faW5kZXhBbW91bnQgKyAnJztcclxuICAgICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RhbnRzXHJcbiAgICovXHJcblxyXG4gIHZhciBzaW4gPSBNYXRoLnNpbixcclxuICAgIGNvcyA9IE1hdGguY29zLFxyXG4gICAgYXRhbjIgPSBNYXRoLmF0YW4yLFxyXG4gICAgc3FydCA9IE1hdGguc3FydCxcclxuICAgIHJvdW5kID0gTWF0aC5yb3VuZCxcclxuICAgIGFicyA9IE1hdGguYWJzLFxyXG4gICAgUEkgPSBNYXRoLlBJLFxyXG4gICAgVFdPX1BJID0gUEkgKiAyLFxyXG4gICAgSEFMRl9QSSA9IFBJIC8gMixcclxuICAgIHBvdyA9IE1hdGgucG93LFxyXG4gICAgbWluID0gTWF0aC5taW4sXHJcbiAgICBtYXggPSBNYXRoLm1heDtcclxuXHJcbiAgLyoqXHJcbiAgICogTG9jYWxpemVkIHZhcmlhYmxlc1xyXG4gICAqL1xyXG5cclxuICB2YXIgY291bnQgPSAwO1xyXG4gIHZhciBzbGljZSA9IF8ubmF0dXJhbC5zbGljZTtcclxuICB2YXIgcGVyZiA9ICgocm9vdC5wZXJmb3JtYW5jZSAmJiByb290LnBlcmZvcm1hbmNlLm5vdykgPyByb290LnBlcmZvcm1hbmNlIDogRGF0ZSk7XHJcbiAgdmFyIE1BWF9BUlJBWV9JTkRFWCA9IE1hdGgucG93KDIsIDUzKSAtIDE7XHJcbiAgdmFyIGdldExlbmd0aCA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgcmV0dXJuIG9iaiA9PSBudWxsID8gdm9pZCAwIDogb2JqWydsZW5ndGgnXTtcclxuICB9O1xyXG4gIHZhciBpc0FycmF5TGlrZSA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcclxuICAgIHZhciBsZW5ndGggPSBnZXRMZW5ndGgoY29sbGVjdGlvbik7XHJcbiAgICByZXR1cm4gdHlwZW9mIGxlbmd0aCA9PSAnbnVtYmVyJyAmJiBsZW5ndGggPj0gMCAmJiBsZW5ndGggPD0gTUFYX0FSUkFZX0lOREVYO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENyb3NzIGJyb3dzZXIgZG9tIGV2ZW50cy5cclxuICAgKi9cclxuICB2YXIgZG9tID0ge1xyXG5cclxuICAgIHRlbXA6IChyb290LmRvY3VtZW50ID8gcm9vdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSA6IHt9KSxcclxuXHJcbiAgICBoYXNFdmVudExpc3RlbmVyczogXy5pc0Z1bmN0aW9uKHJvb3QuYWRkRXZlbnRMaXN0ZW5lciksXHJcblxyXG4gICAgYmluZDogZnVuY3Rpb24oZWxlbSwgZXZlbnQsIGZ1bmMsIGJvb2wpIHtcclxuICAgICAgaWYgKHRoaXMuaGFzRXZlbnRMaXN0ZW5lcnMpIHtcclxuICAgICAgICBlbGVtLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZ1bmMsICEhYm9vbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbS5hdHRhY2hFdmVudCgnb24nICsgZXZlbnQsIGZ1bmMpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkb207XHJcbiAgICB9LFxyXG5cclxuICAgIHVuYmluZDogZnVuY3Rpb24oZWxlbSwgZXZlbnQsIGZ1bmMsIGJvb2wpIHtcclxuICAgICAgaWYgKGRvbS5oYXNFdmVudExpc3RlbmVycykge1xyXG4gICAgICAgIGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZXZlbnQsIGZ1bmMsICEhYm9vbCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZWxlbS5kZXRhY2hFdmVudCgnb24nICsgZXZlbnQsIGZ1bmMpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkb207XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFJlcXVlc3RBbmltYXRpb25GcmFtZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgbGFzdFRpbWUgPSAwO1xyXG4gICAgICB2YXIgdmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ107XHJcbiAgICAgIHZhciByZXF1ZXN0ID0gcm9vdC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUsIGNhbmNlbDtcclxuXHJcbiAgICAgIGlmKCFyZXF1ZXN0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICByZXF1ZXN0ID0gcm9vdFt2ZW5kb3JzW2ldICsgJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddIHx8IHJlcXVlc3Q7XHJcbiAgICAgICAgICBjYW5jZWwgPSByb290W3ZlbmRvcnNbaV0gKyAnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXVxyXG4gICAgICAgICAgICB8fCByb290W3ZlbmRvcnNbaV0gKyAnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10gfHwgY2FuY2VsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVxdWVzdCA9IHJlcXVlc3QgfHwgZnVuY3Rpb24oY2FsbGJhY2ssIGVsZW1lbnQpIHtcclxuICAgICAgICAgIHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSk7XHJcbiAgICAgICAgICB2YXIgaWQgPSByb290LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7IH0sIHRpbWVUb0NhbGwpO1xyXG4gICAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XHJcbiAgICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBjYW5jZWwgPSBjYW5jZWwgfHwgZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICAvLyAgIGNsZWFyVGltZW91dChpZCk7XHJcbiAgICAgICAgLy8gfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmVxdWVzdC5pbml0ID0gXy5vbmNlKGxvb3ApO1xyXG5cclxuICAgICAgcmV0dXJuIHJlcXVlc3Q7XHJcblxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAY2xhc3NcclxuICAgKi9cclxuICB2YXIgVHdvID0gcm9vdC5Ud28gPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lIHdoYXQgUmVuZGVyZXIgdG8gdXNlIGFuZCBzZXR1cCBhIHNjZW5lLlxyXG5cclxuICAgIHZhciBwYXJhbXMgPSBfLmRlZmF1bHRzKG9wdGlvbnMgfHwge30sIHtcclxuICAgICAgZnVsbHNjcmVlbjogZmFsc2UsXHJcbiAgICAgIHdpZHRoOiA2NDAsXHJcbiAgICAgIGhlaWdodDogNDgwLFxyXG4gICAgICB0eXBlOiBUd28uVHlwZXMuc3ZnLFxyXG4gICAgICBhdXRvc3RhcnQ6IGZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBfLmVhY2gocGFyYW1zLCBmdW5jdGlvbih2LCBrKSB7XHJcbiAgICAgIGlmIChrID09PSAnZnVsbHNjcmVlbicgfHwgayA9PT0gJ2F1dG9zdGFydCcpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdGhpc1trXSA9IHY7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAvLyBTcGVjaWZpZWQgZG9tRWxlbWVudCBvdmVycmlkZXMgdHlwZSBkZWNsYXJhdGlvbiBvbmx5IGlmIHRoZSBlbGVtZW50IGRvZXMgbm90IHN1cHBvcnQgZGVjbGFyZWQgcmVuZGVyZXIgdHlwZS5cclxuICAgIGlmIChfLmlzRWxlbWVudChwYXJhbXMuZG9tRWxlbWVudCkpIHtcclxuICAgICAgdmFyIHRhZ05hbWUgPSBwYXJhbXMuZG9tRWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgIC8vIFRPRE86IFJlY29uc2lkZXIgdGhpcyBpZiBzdGF0ZW1lbnQncyBsb2dpYy5cclxuICAgICAgaWYgKCEvXihDYW52YXNSZW5kZXJlci1jYW52YXN8V2ViR0xSZW5kZXJlci1jYW52YXN8U1ZHUmVuZGVyZXItc3ZnKSQvLnRlc3QodGhpcy50eXBlKyctJyt0YWdOYW1lKSkge1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFR3by5UeXBlc1t0YWdOYW1lXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgVHdvW3RoaXMudHlwZV0odGhpcyk7XHJcbiAgICBUd28uVXRpbHMuc2V0UGxheWluZy5jYWxsKHRoaXMsIHBhcmFtcy5hdXRvc3RhcnQpO1xyXG4gICAgdGhpcy5mcmFtZUNvdW50ID0gMDtcclxuXHJcbiAgICBpZiAocGFyYW1zLmZ1bGxzY3JlZW4pIHtcclxuXHJcbiAgICAgIHZhciBmaXR0ZWQgPSBfLmJpbmQoZml0VG9XaW5kb3csIHRoaXMpO1xyXG4gICAgICBfLmV4dGVuZChkb2N1bWVudC5ib2R5LnN0eWxlLCB7XHJcbiAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICAgIG1hcmdpbjogMCxcclxuICAgICAgICBwYWRkaW5nOiAwLFxyXG4gICAgICAgIHRvcDogMCxcclxuICAgICAgICBsZWZ0OiAwLFxyXG4gICAgICAgIHJpZ2h0OiAwLFxyXG4gICAgICAgIGJvdHRvbTogMCxcclxuICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJ1xyXG4gICAgICB9KTtcclxuICAgICAgXy5leHRlbmQodGhpcy5yZW5kZXJlci5kb21FbGVtZW50LnN0eWxlLCB7XHJcbiAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcclxuICAgICAgICB0b3A6IDAsXHJcbiAgICAgICAgbGVmdDogMCxcclxuICAgICAgICByaWdodDogMCxcclxuICAgICAgICBib3R0b206IDAsXHJcbiAgICAgICAgcG9zaXRpb246ICdmaXhlZCdcclxuICAgICAgfSk7XHJcbiAgICAgIGRvbS5iaW5kKHJvb3QsICdyZXNpemUnLCBmaXR0ZWQpO1xyXG4gICAgICBmaXR0ZWQoKTtcclxuXHJcblxyXG4gICAgfSBlbHNlIGlmICghXy5pc0VsZW1lbnQocGFyYW1zLmRvbUVsZW1lbnQpKSB7XHJcblxyXG4gICAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUocGFyYW1zLndpZHRoLCBwYXJhbXMuaGVpZ2h0LCB0aGlzLnJhdGlvKTtcclxuICAgICAgdGhpcy53aWR0aCA9IHBhcmFtcy53aWR0aDtcclxuICAgICAgdGhpcy5oZWlnaHQgPSBwYXJhbXMuaGVpZ2h0O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNjZW5lID0gdGhpcy5yZW5kZXJlci5zY2VuZTtcclxuXHJcbiAgICBUd28uSW5zdGFuY2VzLnB1c2godGhpcyk7XHJcbiAgICByYWYuaW5pdCgpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChUd28sIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFjY2VzcyB0byByb290IGluIG90aGVyIGZpbGVzLlxyXG4gICAgICovXHJcblxyXG4gICAgcm9vdDogcm9vdCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFByaW1pdGl2ZVxyXG4gICAgICovXHJcblxyXG4gICAgQXJyYXk6IHJvb3QuRmxvYXQzMkFycmF5IHx8IEFycmF5LFxyXG5cclxuICAgIFR5cGVzOiB7XHJcbiAgICAgIHdlYmdsOiAnV2ViR0xSZW5kZXJlcicsXHJcbiAgICAgIHN2ZzogJ1NWR1JlbmRlcmVyJyxcclxuICAgICAgY2FudmFzOiAnQ2FudmFzUmVuZGVyZXInXHJcbiAgICB9LFxyXG5cclxuICAgIFZlcnNpb246ICd2MC43LjAtYWxwaGEuMScsXHJcblxyXG4gICAgSWRlbnRpZmllcjogJ3R3b18nLFxyXG5cclxuICAgIFByb3BlcnRpZXM6IHtcclxuICAgICAgaGllcmFyY2h5OiAnaGllcmFyY2h5JyxcclxuICAgICAgZGVtb3Rpb246ICdkZW1vdGlvbidcclxuICAgIH0sXHJcblxyXG4gICAgRXZlbnRzOiB7XHJcbiAgICAgIHBsYXk6ICdwbGF5JyxcclxuICAgICAgcGF1c2U6ICdwYXVzZScsXHJcbiAgICAgIHVwZGF0ZTogJ3VwZGF0ZScsXHJcbiAgICAgIHJlbmRlcjogJ3JlbmRlcicsXHJcbiAgICAgIHJlc2l6ZTogJ3Jlc2l6ZScsXHJcbiAgICAgIGNoYW5nZTogJ2NoYW5nZScsXHJcbiAgICAgIHJlbW92ZTogJ3JlbW92ZScsXHJcbiAgICAgIGluc2VydDogJ2luc2VydCcsXHJcbiAgICAgIG9yZGVyOiAnb3JkZXInLFxyXG4gICAgICBsb2FkOiAnbG9hZCdcclxuICAgIH0sXHJcblxyXG4gICAgQ29tbWFuZHM6IHtcclxuICAgICAgbW92ZTogJ00nLFxyXG4gICAgICBsaW5lOiAnTCcsXHJcbiAgICAgIGN1cnZlOiAnQycsXHJcbiAgICAgIGNsb3NlOiAnWidcclxuICAgIH0sXHJcblxyXG4gICAgUmVzb2x1dGlvbjogOCxcclxuXHJcbiAgICBJbnN0YW5jZXM6IFtdLFxyXG5cclxuICAgIG5vQ29uZmxpY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByb290LlR3byA9IHByZXZpb3VzVHdvO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgdW5pcXVlSWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaWQgPSBjb3VudDtcclxuICAgICAgY291bnQrKztcclxuICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSxcclxuXHJcbiAgICBVdGlsczogXy5leHRlbmQoXywge1xyXG5cclxuICAgICAgcGVyZm9ybWFuY2U6IHBlcmYsXHJcblxyXG4gICAgICBkZWZpbmVQcm9wZXJ0eTogZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuXHJcbiAgICAgICAgdmFyIG9iamVjdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIHNlY3JldCA9ICdfJyArIHByb3BlcnR5O1xyXG4gICAgICAgIHZhciBmbGFnID0gJ19mbGFnJyArIHByb3BlcnR5LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcGVydHkuc2xpY2UoMSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5LCB7XHJcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbc2VjcmV0XTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgdGhpc1tzZWNyZXRdID0gdjtcclxuICAgICAgICAgICAgdGhpc1tmbGFnXSA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFJlbGVhc2UgYW4gYXJiaXRyYXJ5IGNsYXNzJyBldmVudHMgZnJvbSB0aGUgdHdvLmpzIGNvcnB1cyBhbmQgcmVjdXJzZVxyXG4gICAgICAgKiB0aHJvdWdoIGl0cyBjaGlsZHJlbiBhbmQgb3IgdmVydGljZXMuXHJcbiAgICAgICAqL1xyXG4gICAgICByZWxlYXNlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqLnVuYmluZCkpIHtcclxuICAgICAgICAgIG9iai51bmJpbmQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvYmoudmVydGljZXMpIHtcclxuICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqLnZlcnRpY2VzLnVuYmluZCkpIHtcclxuICAgICAgICAgICAgb2JqLnZlcnRpY2VzLnVuYmluZCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXy5lYWNoKG9iai52ZXJ0aWNlcywgZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHYudW5iaW5kKSkge1xyXG4gICAgICAgICAgICAgIHYudW5iaW5kKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9iai5jaGlsZHJlbikge1xyXG4gICAgICAgICAgXy5lYWNoKG9iai5jaGlsZHJlbiwgZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIFR3by5VdGlscy5yZWxlYXNlKG9iaik7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgeGhyOiBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHBhdGgpO1xyXG5cclxuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQgJiYgeGhyLnN0YXR1cyA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHhoci5yZXNwb25zZVRleHQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHhoci5zZW5kKCk7XHJcbiAgICAgICAgcmV0dXJuIHhocjtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBDdXJ2ZToge1xyXG5cclxuICAgICAgICBDb2xsaW5lYXJpdHlFcHNpbG9uOiBwb3coMTAsIC0zMCksXHJcblxyXG4gICAgICAgIFJlY3Vyc2lvbkxpbWl0OiAxNixcclxuXHJcbiAgICAgICAgQ3VzcExpbWl0OiAwLFxyXG5cclxuICAgICAgICBUb2xlcmFuY2U6IHtcclxuICAgICAgICAgIGRpc3RhbmNlOiAwLjI1LFxyXG4gICAgICAgICAgYW5nbGU6IDAsXHJcbiAgICAgICAgICBlcHNpbG9uOiAwLjAxXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLy8gTG9va3VwIHRhYmxlcyBmb3IgYWJzY2lzc2FzIGFuZCB3ZWlnaHRzIHdpdGggdmFsdWVzIGZvciBuID0gMiAuLiAxNi5cclxuICAgICAgICAvLyBBcyB2YWx1ZXMgYXJlIHN5bW1ldHJpYywgb25seSBzdG9yZSBoYWxmIG9mIHRoZW0gYW5kIGFkYXB0IGFsZ29yaXRobVxyXG4gICAgICAgIC8vIHRvIGZhY3RvciBpbiBzeW1tZXRyeS5cclxuICAgICAgICBhYnNjaXNzYXM6IFtcclxuICAgICAgICAgIFsgIDAuNTc3MzUwMjY5MTg5NjI1NzY0NTA5MTQ4OF0sXHJcbiAgICAgICAgICBbMCwwLjc3NDU5NjY2OTI0MTQ4MzM3NzAzNTg1MzFdLFxyXG4gICAgICAgICAgWyAgMC4zMzk5ODEwNDM1ODQ4NTYyNjQ4MDI2NjU4LDAuODYxMTM2MzExNTk0MDUyNTc1MjIzOTQ2NV0sXHJcbiAgICAgICAgICBbMCwwLjUzODQ2OTMxMDEwNTY4MzA5MTAzNjMxNDQsMC45MDYxNzk4NDU5Mzg2NjM5OTI3OTc2MjY5XSxcclxuICAgICAgICAgIFsgIDAuMjM4NjE5MTg2MDgzMTk2OTA4NjMwNTAxNywwLjY2MTIwOTM4NjQ2NjI2NDUxMzY2MTM5OTYsMC45MzI0Njk1MTQyMDMxNTIwMjc4MTIzMDE2XSxcclxuICAgICAgICAgIFswLDAuNDA1ODQ1MTUxMzc3Mzk3MTY2OTA2NjA2NCwwLjc0MTUzMTE4NTU5OTM5NDQzOTg2Mzg2NDgsMC45NDkxMDc5MTIzNDI3NTg1MjQ1MjYxODk3XSxcclxuICAgICAgICAgIFsgIDAuMTgzNDM0NjQyNDk1NjQ5ODA0OTM5NDc2MSwwLjUyNTUzMjQwOTkxNjMyODk4NTgxNzczOTAsMC43OTY2NjY0Nzc0MTM2MjY3Mzk1OTE1NTM5LDAuOTYwMjg5ODU2NDk3NTM2MjMxNjgzNTYwOV0sXHJcbiAgICAgICAgICBbMCwwLjMyNDI1MzQyMzQwMzgwODkyOTAzODUzODAsMC42MTMzNzE0MzI3MDA1OTAzOTczMDg3MDIwLDAuODM2MDMxMTA3MzI2NjM1Nzk0Mjk5NDI5OCwwLjk2ODE2MDIzOTUwNzYyNjA4OTgzNTU3NjJdLFxyXG4gICAgICAgICAgWyAgMC4xNDg4NzQzMzg5ODE2MzEyMTA4ODQ4MjYwLDAuNDMzMzk1Mzk0MTI5MjQ3MTkwNzk5MjY1OSwwLjY3OTQwOTU2ODI5OTAyNDQwNjIzNDMyNzQsMC44NjUwNjMzNjY2ODg5ODQ1MTA3MzIwOTY3LDAuOTczOTA2NTI4NTE3MTcxNzIwMDc3OTY0MF0sXHJcbiAgICAgICAgICBbMCwwLjI2OTU0MzE1NTk1MjM0NDk3MjMzMTUzMjAsMC41MTkwOTYxMjkyMDY4MTE4MTU5MjU3MjU3LDAuNzMwMTUyMDA1NTc0MDQ5MzI0MDkzNDE2MywwLjg4NzA2MjU5OTc2ODA5NTI5OTA3NTE1NzgsMC45NzgyMjg2NTgxNDYwNTY5OTI4MDM5MzgwXSxcclxuICAgICAgICAgIFsgIDAuMTI1MjMzNDA4NTExNDY4OTE1NDcyNDQxNCwwLjM2NzgzMTQ5ODk5ODE4MDE5Mzc1MjY5MTUsMC41ODczMTc5NTQyODY2MTc0NDcyOTY3MDI0LDAuNzY5OTAyNjc0MTk0MzA0Njg3MDM2ODkzOCwwLjkwNDExNzI1NjM3MDQ3NDg1NjY3ODQ2NTksMC45ODE1NjA2MzQyNDY3MTkyNTA2OTA1NDkxXSxcclxuICAgICAgICAgIFswLDAuMjMwNDU4MzE1OTU1MTM0Nzk0MDY1NTI4MSwwLjQ0ODQ5Mjc1MTAzNjQ0Njg1Mjg3NzkxMjksMC42NDIzNDkzMzk0NDAzNDAyMjA2NDM5ODQ2LDAuODAxNTc4MDkwNzMzMzA5OTEyNzk0MjA2NSwwLjkxNzU5ODM5OTIyMjk3Nzk2NTIwNjU0NzgsMC45ODQxODMwNTQ3MTg1ODgxNDk0NzI4Mjk0XSxcclxuICAgICAgICAgIFsgIDAuMTA4MDU0OTQ4NzA3MzQzNjYyMDY2MjQ0NywwLjMxOTExMjM2ODkyNzg4OTc2MDQzNTY3MTgsMC41MTUyNDg2MzYzNTgxNTQwOTE5NjUyOTA3LDAuNjg3MjkyOTA0ODExNjg1NDcwMTQ4MDE5OCwwLjgyNzIwMTMxNTA2OTc2NDk5MzE4OTc5NDcsMC45Mjg0MzQ4ODM2NjM1NzM1MTczMzYzOTExLDAuOTg2MjgzODA4Njk2ODEyMzM4ODQxNTk3M10sXHJcbiAgICAgICAgICBbMCwwLjIwMTE5NDA5Mzk5NzQzNDUyMjMwMDYyODMsMC4zOTQxNTEzNDcwNzc1NjMzNjk4OTcyMDc0LDAuNTcwOTcyMTcyNjA4NTM4ODQ3NTM3MjI2NywwLjcyNDQxNzczMTM2MDE3MDA0NzQxNjE4NjEsMC44NDgyMDY1ODM0MTA0MjcyMTYyMDA2NDgzLDAuOTM3MjczMzkyNDAwNzA1OTA0MzA3NzU4OSwwLjk4Nzk5MjUxODAyMDQ4NTQyODQ4OTU2NTddLFxyXG4gICAgICAgICAgWyAgMC4wOTUwMTI1MDk4Mzc2Mzc0NDAxODUzMTkzLDAuMjgxNjAzNTUwNzc5MjU4OTEzMjMwNDYwNSwwLjQ1ODAxNjc3NzY1NzIyNzM4NjM0MjQxOTQsMC42MTc4NzYyNDQ0MDI2NDM3NDg0NDY2NzE4LDAuNzU1NDA0NDA4MzU1MDAzMDMzODk1MTAxMiwwLjg2NTYzMTIwMjM4NzgzMTc0Mzg4MDQ2NzksMC45NDQ1NzUwMjMwNzMyMzI1NzYwNzc5ODg0LDAuOTg5NDAwOTM0OTkxNjQ5OTMyNTk2MTU0Ml1cclxuICAgICAgICBdLFxyXG5cclxuICAgICAgICB3ZWlnaHRzOiBbXHJcbiAgICAgICAgICBbMV0sXHJcbiAgICAgICAgICBbMC44ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg5LDAuNTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1Nl0sXHJcbiAgICAgICAgICBbMC42NTIxNDUxNTQ4NjI1NDYxNDI2MjY5MzYxLDAuMzQ3ODU0ODQ1MTM3NDUzODU3MzczMDYzOV0sXHJcbiAgICAgICAgICBbMC41Njg4ODg4ODg4ODg4ODg4ODg4ODg4ODg5LDAuNDc4NjI4NjcwNDk5MzY2NDY4MDQxMjkxNSwwLjIzNjkyNjg4NTA1NjE4OTA4NzUxNDI2NDBdLFxyXG4gICAgICAgICAgWzAuNDY3OTEzOTM0NTcyNjkxMDQ3Mzg5ODcwMywwLjM2MDc2MTU3MzA0ODEzODYwNzU2OTgzMzUsMC4xNzEzMjQ0OTIzNzkxNzAzNDUwNDAyOTYxXSxcclxuICAgICAgICAgIFswLjQxNzk1OTE4MzY3MzQ2OTM4Nzc1NTEwMjAsMC4zODE4MzAwNTA1MDUxMTg5NDQ5NTAzNjk4LDAuMjc5NzA1MzkxNDg5Mjc2NjY3OTAxNDY3OCwwLjEyOTQ4NDk2NjE2ODg2OTY5MzI3MDYxMTRdLFxyXG4gICAgICAgICAgWzAuMzYyNjgzNzgzMzc4MzYxOTgyOTY1MTUwNCwwLjMxMzcwNjY0NTg3Nzg4NzI4NzMzNzk2MjIsMC4yMjIzODEwMzQ0NTMzNzQ0NzA1NDQzNTYwLDAuMTAxMjI4NTM2MjkwMzc2MjU5MTUyNTMxNF0sXHJcbiAgICAgICAgICBbMC4zMzAyMzkzNTUwMDEyNTk3NjMxNjQ1MjUxLDAuMzEyMzQ3MDc3MDQwMDAyODQwMDY4NjMwNCwwLjI2MDYxMDY5NjQwMjkzNTQ2MjMxODc0MjksMC4xODA2NDgxNjA2OTQ4NTc0MDQwNTg0NzIwLDAuMDgxMjc0Mzg4MzYxNTc0NDExOTcxODkyMl0sXHJcbiAgICAgICAgICBbMC4yOTU1MjQyMjQ3MTQ3NTI4NzAxNzM4OTMwLDAuMjY5MjY2NzE5MzA5OTk2MzU1MDkxMjI2OSwwLjIxOTA4NjM2MjUxNTk4MjA0Mzk5NTUzNDksMC4xNDk0NTEzNDkxNTA1ODA1OTMxNDU3NzYzLDAuMDY2NjcxMzQ0MzA4Njg4MTM3NTkzNTY4OF0sXHJcbiAgICAgICAgICBbMC4yNzI5MjUwODY3Nzc5MDA2MzA3MTQ0ODM1LDAuMjYyODA0NTQ0NTEwMjQ2NjYyMTgwNjg4OSwwLjIzMzE5Mzc2NDU5MTk5MDQ3OTkxODUyMzcsMC4xODYyOTAyMTA5Mjc3MzQyNTE0MjYwOTc2LDAuMTI1NTgwMzY5NDY0OTA0NjI0NjM0Njk0MywwLjA1NTY2ODU2NzExNjE3MzY2NjQ4Mjc1MzddLFxyXG4gICAgICAgICAgWzAuMjQ5MTQ3MDQ1ODEzNDAyNzg1MDAwNTYyNCwwLjIzMzQ5MjUzNjUzODM1NDgwODc2MDg0OTksMC4yMDMxNjc0MjY3MjMwNjU5MjE3NDkwNjQ1LDAuMTYwMDc4MzI4NTQzMzQ2MjI2MzM0NjUyNSwwLjEwNjkzOTMyNTk5NTMxODQzMDk2MDI1NDcsMC4wNDcxNzUzMzYzODY1MTE4MjcxOTQ2MTYwXSxcclxuICAgICAgICAgIFswLjIzMjU1MTU1MzIzMDg3MzkxMDE5NDU4OTUsMC4yMjYyODMxODAyNjI4OTcyMzg0MTIwOTAyLDAuMjA3ODE2MDQ3NTM2ODg4NTAyMzEyNTIzMiwwLjE3ODE0NTk4MDc2MTk0NTczODI4MDA0NjcsMC4xMzg4NzM1MTAyMTk3ODcyMzg0NjM2MDE4LDAuMDkyMTIxNDk5ODM3NzI4NDQ3OTE0NDIxOCwwLjA0MDQ4NDAwNDc2NTMxNTg3OTUyMDAyMTZdLFxyXG4gICAgICAgICAgWzAuMjE1MjYzODUzNDYzMTU3NzkwMTk1ODc2NCwwLjIwNTE5ODQ2MzcyMTI5NTYwMzk2NTkyNDEsMC4xODU1MzgzOTc0Nzc5Mzc4MTM3NDE3MTY2LDAuMTU3MjAzMTY3MTU4MTkzNTM0NTY5NjAxOSwwLjEyMTUxODU3MDY4NzkwMzE4NDY4OTQxNDgsMC4wODAxNTgwODcxNTk3NjAyMDk4MDU2MzMzLDAuMDM1MTE5NDYwMzMxNzUxODYzMDMxODMyOV0sXHJcbiAgICAgICAgICBbMC4yMDI1NzgyNDE5MjU1NjEyNzI4ODA2MjAyLDAuMTk4NDMxNDg1MzI3MTExNTc2NDU2MTE4MywwLjE4NjE2MTAwMDAxNTU2MjIxMTAyNjgwMDYsMC4xNjYyNjkyMDU4MTY5OTM5MzM1NTMyMDA5LDAuMTM5NTcwNjc3OTI2MTU0MzE0NDQ3ODA0OCwwLjEwNzE1OTIyMDQ2NzE3MTkzNTAxMTg2OTUsMC4wNzAzNjYwNDc0ODgxMDgxMjQ3MDkyNjc0LDAuMDMwNzUzMjQxOTk2MTE3MjY4MzU0NjI4NF0sXHJcbiAgICAgICAgICBbMC4xODk0NTA2MTA0NTUwNjg0OTYyODUzOTY3LDAuMTgyNjAzNDE1MDQ0OTIzNTg4ODY2NzYzNywwLjE2OTE1NjUxOTM5NTAwMjUzODE4OTMxMjEsMC4xNDk1OTU5ODg4MTY1NzY3MzIwODE1MDE3LDAuMTI0NjI4OTcxMjU1NTMzODcyMDUyNDc2MywwLjA5NTE1ODUxMTY4MjQ5Mjc4NDgwOTkyNTEsMC4wNjIyNTM1MjM5Mzg2NDc4OTI4NjI4NDM4LDAuMDI3MTUyNDU5NDExNzU0MDk0ODUxNzgwNl1cclxuICAgICAgICBdXHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEFjY291bnQgZm9yIGhpZ2ggZHBpIHJlbmRlcmluZy5cclxuICAgICAgICogaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvY2FudmFzL2hpZHBpL1xyXG4gICAgICAgKi9cclxuXHJcbiAgICAgIGRldmljZVBpeGVsUmF0aW86IHJvb3QuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxLFxyXG5cclxuICAgICAgZ2V0QmFja2luZ1N0b3JlUmF0aW86IGZ1bmN0aW9uKGN0eCkge1xyXG4gICAgICAgIHJldHVybiBjdHgud2Via2l0QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxyXG4gICAgICAgICAgY3R4Lm1vekJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcclxuICAgICAgICAgIGN0eC5tc0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcclxuICAgICAgICAgIGN0eC5vQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxyXG4gICAgICAgICAgY3R4LmJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHwgMTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIGdldFJhdGlvOiBmdW5jdGlvbihjdHgpIHtcclxuICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmRldmljZVBpeGVsUmF0aW8gLyBnZXRCYWNraW5nU3RvcmVSYXRpbyhjdHgpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFByb3Blcmx5IGRlZmVyIHBsYXkgY2FsbGluZyB1bnRpbCBhZnRlciBhbGwgb2JqZWN0c1xyXG4gICAgICAgKiBoYXZlIGJlZW4gdXBkYXRlZCB3aXRoIHRoZWlyIG5ld2VzdCBzdHlsZXMuXHJcbiAgICAgICAqL1xyXG4gICAgICBzZXRQbGF5aW5nOiBmdW5jdGlvbihiKSB7XHJcblxyXG4gICAgICAgIHRoaXMucGxheWluZyA9ICEhYjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmV0dXJuIHRoZSBjb21wdXRlZCBtYXRyaXggb2YgYSBuZXN0ZWQgb2JqZWN0LlxyXG4gICAgICAgKiBUT0RPOiBPcHRpbWl6ZSB0cmF2ZXJzYWwuXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXRDb21wdXRlZE1hdHJpeDogZnVuY3Rpb24ob2JqZWN0LCBtYXRyaXgpIHtcclxuXHJcbiAgICAgICAgbWF0cml4ID0gKG1hdHJpeCAmJiBtYXRyaXguaWRlbnRpdHkoKSkgfHwgbmV3IFR3by5NYXRyaXgoKTtcclxuICAgICAgICB2YXIgcGFyZW50ID0gb2JqZWN0LCBtYXRyaWNlcyA9IFtdO1xyXG5cclxuICAgICAgICB3aGlsZSAocGFyZW50ICYmIHBhcmVudC5fbWF0cml4KSB7XHJcbiAgICAgICAgICBtYXRyaWNlcy5wdXNoKHBhcmVudC5fbWF0cml4KTtcclxuICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXRyaWNlcy5yZXZlcnNlKCk7XHJcblxyXG4gICAgICAgIF8uZWFjaChtYXRyaWNlcywgZnVuY3Rpb24obSkge1xyXG5cclxuICAgICAgICAgIHZhciBlID0gbS5lbGVtZW50cztcclxuICAgICAgICAgIG1hdHJpeC5tdWx0aXBseShcclxuICAgICAgICAgICAgZVswXSwgZVsxXSwgZVsyXSwgZVszXSwgZVs0XSwgZVs1XSwgZVs2XSwgZVs3XSwgZVs4XSwgZVs5XSk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbWF0cml4O1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGRlbHRhVHJhbnNmb3JtUG9pbnQ6IGZ1bmN0aW9uKG1hdHJpeCwgeCwgeSkge1xyXG5cclxuICAgICAgICB2YXIgZHggPSB4ICogbWF0cml4LmEgKyB5ICogbWF0cml4LmMgKyAwO1xyXG4gICAgICAgIHZhciBkeSA9IHggKiBtYXRyaXguYiArIHkgKiBtYXRyaXguZCArIDA7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgVHdvLlZlY3RvcihkeCwgZHkpO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS8yMDUyMjQ3XHJcbiAgICAgICAqL1xyXG4gICAgICBkZWNvbXBvc2VNYXRyaXg6IGZ1bmN0aW9uKG1hdHJpeCkge1xyXG5cclxuICAgICAgICAvLyBjYWxjdWxhdGUgZGVsdGEgdHJhbnNmb3JtIHBvaW50XHJcbiAgICAgICAgdmFyIHB4ID0gVHdvLlV0aWxzLmRlbHRhVHJhbnNmb3JtUG9pbnQobWF0cml4LCAwLCAxKTtcclxuICAgICAgICB2YXIgcHkgPSBUd28uVXRpbHMuZGVsdGFUcmFuc2Zvcm1Qb2ludChtYXRyaXgsIDEsIDApO1xyXG5cclxuICAgICAgICAvLyBjYWxjdWxhdGUgc2tld1xyXG4gICAgICAgIHZhciBza2V3WCA9ICgoMTgwIC8gTWF0aC5QSSkgKiBNYXRoLmF0YW4yKHB4LnksIHB4LngpIC0gOTApO1xyXG4gICAgICAgIHZhciBza2V3WSA9ICgoMTgwIC8gTWF0aC5QSSkgKiBNYXRoLmF0YW4yKHB5LnksIHB5LngpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdHJhbnNsYXRlWDogbWF0cml4LmUsXHJcbiAgICAgICAgICAgIHRyYW5zbGF0ZVk6IG1hdHJpeC5mLFxyXG4gICAgICAgICAgICBzY2FsZVg6IE1hdGguc3FydChtYXRyaXguYSAqIG1hdHJpeC5hICsgbWF0cml4LmIgKiBtYXRyaXguYiksXHJcbiAgICAgICAgICAgIHNjYWxlWTogTWF0aC5zcXJ0KG1hdHJpeC5jICogbWF0cml4LmMgKyBtYXRyaXguZCAqIG1hdHJpeC5kKSxcclxuICAgICAgICAgICAgc2tld1g6IHNrZXdYLFxyXG4gICAgICAgICAgICBza2V3WTogc2tld1ksXHJcbiAgICAgICAgICAgIHJvdGF0aW9uOiBza2V3WCAvLyByb3RhdGlvbiBpcyB0aGUgc2FtZSBhcyBza2V3IHhcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBXYWxrIHRocm91Z2ggaXRlbSBwcm9wZXJ0aWVzIGFuZCBwaWNrIHRoZSBvbmVzIG9mIGludGVyZXN0LlxyXG4gICAgICAgKiBXaWxsIHRyeSB0byByZXNvbHZlIHN0eWxlcyBhcHBsaWVkIHZpYSBDU1NcclxuICAgICAgICpcclxuICAgICAgICogVE9ETzogUmV2ZXJzZSBjYWxjdWxhdGUgYFR3by5HcmFkaWVudGBzIGZvciBmaWxsIC8gc3Ryb2tlXHJcbiAgICAgICAqIG9mIGFueSBnaXZlbiBwYXRoLlxyXG4gICAgICAgKi9cclxuICAgICAgYXBwbHlTdmdBdHRyaWJ1dGVzOiBmdW5jdGlvbihub2RlLCBlbGVtKSB7XHJcblxyXG4gICAgICAgIHZhciBhdHRyaWJ1dGVzID0ge30sIHN0eWxlcyA9IHt9LCBpLCBrZXksIHZhbHVlLCBhdHRyO1xyXG5cclxuICAgICAgICAvLyBOb3QgYXZhaWxhYmxlIGluIG5vbiBicm93c2VyIGVudmlyb25tZW50c1xyXG4gICAgICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKSB7XHJcbiAgICAgICAgICAvLyBDb252ZXJ0IENTU1N0eWxlRGVjbGFyYXRpb24gdG8gYSBub3JtYWwgb2JqZWN0XHJcbiAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xyXG4gICAgICAgICAgaSA9IGNvbXB1dGVkU3R5bGVzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgIGtleSA9IGNvbXB1dGVkU3R5bGVzW2ldO1xyXG4gICAgICAgICAgICB2YWx1ZSA9IGNvbXB1dGVkU3R5bGVzW2tleV07XHJcbiAgICAgICAgICAgIC8vIEdlY2tvIHJldHVybnMgdW5kZWZpbmVkIGZvciB1bnNldCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIC8vIFdlYmtpdCByZXR1cm5zIHRoZSBkZWZhdWx0IHZhbHVlXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgc3R5bGVzW2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ29udmVydCBOb2RlTWFwIHRvIGEgbm9ybWFsIG9iamVjdFxyXG4gICAgICAgIGkgPSBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgIGF0dHIgPSBub2RlLmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICBhdHRyaWJ1dGVzW2F0dHIubm9kZU5hbWVdID0gYXR0ci52YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEdldHRpbmcgdGhlIGNvcnJlY3Qgb3BhY2l0eSBpcyBhIGJpdCB0cmlja3ksIHNpbmNlIFNWRyBwYXRoIGVsZW1lbnRzIGRvbid0XHJcbiAgICAgICAgLy8gc3VwcG9ydCBvcGFjaXR5IGFzIGFuIGF0dHJpYnV0ZSwgYnV0IHlvdSBjYW4gYXBwbHkgaXQgdmlhIENTUy5cclxuICAgICAgICAvLyBTbyB3ZSB0YWtlIHRoZSBvcGFjaXR5IGFuZCBzZXQgKHN0cm9rZS9maWxsKS1vcGFjaXR5IHRvIHRoZSBzYW1lIHZhbHVlLlxyXG4gICAgICAgIGlmICghXy5pc1VuZGVmaW5lZChzdHlsZXMub3BhY2l0eSkpIHtcclxuICAgICAgICAgIHN0eWxlc1snc3Ryb2tlLW9wYWNpdHknXSA9IHN0eWxlcy5vcGFjaXR5O1xyXG4gICAgICAgICAgc3R5bGVzWydmaWxsLW9wYWNpdHknXSA9IHN0eWxlcy5vcGFjaXR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTWVyZ2UgYXR0cmlidXRlcyBhbmQgYXBwbGllZCBzdHlsZXMgKGF0dHJpYnV0ZXMgdGFrZSBwcmVjZWRlbmNlKVxyXG4gICAgICAgIF8uZXh0ZW5kKHN0eWxlcywgYXR0cmlidXRlcyk7XHJcblxyXG4gICAgICAgIC8vIFNpbWlsYXJseSB2aXNpYmlsaXR5IGlzIGluZmx1ZW5jZWQgYnkgdGhlIHZhbHVlIG9mIGJvdGggZGlzcGxheSBhbmQgdmlzaWJpbGl0eS5cclxuICAgICAgICAvLyBDYWxjdWxhdGUgYSB1bmlmaWVkIHZhbHVlIGhlcmUgd2hpY2ggZGVmYXVsdHMgdG8gYHRydWVgLlxyXG4gICAgICAgIHN0eWxlcy52aXNpYmxlID0gIShfLmlzVW5kZWZpbmVkKHN0eWxlcy5kaXNwbGF5KSAmJiBzdHlsZXMuZGlzcGxheSA9PT0gJ25vbmUnKVxyXG4gICAgICAgICAgfHwgKF8uaXNVbmRlZmluZWQoc3R5bGVzLnZpc2liaWxpdHkpICYmIHN0eWxlcy52aXNpYmlsaXR5ID09PSAnaGlkZGVuJyk7XHJcblxyXG4gICAgICAgIC8vIE5vdyBpdGVyYXRlIHRoZSB3aG9sZSB0aGluZ1xyXG4gICAgICAgIGZvciAoa2V5IGluIHN0eWxlcykge1xyXG4gICAgICAgICAgdmFsdWUgPSBzdHlsZXNba2V5XTtcclxuXHJcbiAgICAgICAgICBzd2l0Y2ggKGtleSkge1xyXG4gICAgICAgICAgICBjYXNlICd0cmFuc2Zvcm0nOlxyXG4gICAgICAgICAgICAgIC8vIFRPRE86IENoZWNrIHRoaXMgb3V0IGh0dHBzOi8vZ2l0aHViLmNvbS9wYXBlcmpzL3BhcGVyLmpzL2Jsb2IvbWFzdGVyL3NyYy9zdmcvU1ZHSW1wb3J0LmpzI0wzMTNcclxuICAgICAgICAgICAgICBpZiAodmFsdWUgPT09ICdub25lJykgYnJlYWs7XHJcbiAgICAgICAgICAgICAgdmFyIG0gPSBub2RlLmdldENUTSA/IG5vZGUuZ2V0Q1RNKCkgOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAvLyBNaWdodCBoYXBwZW4gd2hlbiB0cmFuc2Zvcm0gc3RyaW5nIGlzIGVtcHR5IG9yIG5vdCB2YWxpZC5cclxuICAgICAgICAgICAgICBpZiAobSA9PT0gbnVsbCkgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIC8vIC8vIE9wdGlvbiAxOiBlZGl0IHRoZSB1bmRlcmx5aW5nIG1hdHJpeCBhbmQgZG9uJ3QgZm9yY2UgYW4gYXV0byBjYWxjLlxyXG4gICAgICAgICAgICAgIC8vIHZhciBtID0gbm9kZS5nZXRDVE0oKTtcclxuICAgICAgICAgICAgICAvLyBlbGVtLl9tYXRyaXgubWFudWFsID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAvLyBlbGVtLl9tYXRyaXguc2V0KG0uYSwgbS5iLCBtLmMsIG0uZCwgbS5lLCBtLmYpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBPcHRpb24gMjogRGVjb21wb3NlIGFuZCBpbmZlciBUd28uanMgcmVsYXRlZCBwcm9wZXJ0aWVzLlxyXG4gICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1zID0gVHdvLlV0aWxzLmRlY29tcG9zZU1hdHJpeChub2RlLmdldENUTSgpKTtcclxuXHJcbiAgICAgICAgICAgICAgZWxlbS50cmFuc2xhdGlvbi5zZXQodHJhbnNmb3Jtcy50cmFuc2xhdGVYLCB0cmFuc2Zvcm1zLnRyYW5zbGF0ZVkpO1xyXG4gICAgICAgICAgICAgIGVsZW0ucm90YXRpb24gPSB0cmFuc2Zvcm1zLnJvdGF0aW9uO1xyXG4gICAgICAgICAgICAgIC8vIFdhcm5pbmc6IFR3by5qcyBlbGVtZW50cyBvbmx5IHN1cHBvcnQgdW5pZm9ybSBzY2FsYXJzLi4uXHJcbiAgICAgICAgICAgICAgZWxlbS5zY2FsZSA9IHRyYW5zZm9ybXMuc2NhbGVYO1xyXG5cclxuICAgICAgICAgICAgICB2YXIgeCA9IHBhcnNlRmxvYXQoKHN0eWxlcy54ICsgJycpLnJlcGxhY2UoJ3B4JykpO1xyXG4gICAgICAgICAgICAgIHZhciB5ID0gcGFyc2VGbG9hdCgoc3R5bGVzLnkgKyAnJykucmVwbGFjZSgncHgnKSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIE92ZXJyaWRlIGJhc2VkIG9uIGF0dHJpYnV0ZXMuXHJcbiAgICAgICAgICAgICAgaWYgKHgpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0udHJhbnNsYXRpb24ueCA9IHg7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiAoeSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS50cmFuc2xhdGlvbi55ID0geTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICd2aXNpYmxlJzpcclxuICAgICAgICAgICAgICBlbGVtLnZpc2libGUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnc3Ryb2tlLWxpbmVjYXAnOlxyXG4gICAgICAgICAgICAgIGVsZW0uY2FwID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0cm9rZS1saW5lam9pbic6XHJcbiAgICAgICAgICAgICAgZWxlbS5qb2luID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0cm9rZS1taXRlcmxpbWl0JzpcclxuICAgICAgICAgICAgICBlbGVtLm1pdGVyID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0cm9rZS13aWR0aCc6XHJcbiAgICAgICAgICAgICAgZWxlbS5saW5ld2lkdGggPSBwYXJzZUZsb2F0KHZhbHVlKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnc3Ryb2tlLW9wYWNpdHknOlxyXG4gICAgICAgICAgICBjYXNlICdmaWxsLW9wYWNpdHknOlxyXG4gICAgICAgICAgICBjYXNlICdvcGFjaXR5JzpcclxuICAgICAgICAgICAgICBlbGVtLm9wYWNpdHkgPSBwYXJzZUZsb2F0KHZhbHVlKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnZmlsbCc6XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0cm9rZSc6XHJcbiAgICAgICAgICAgICAgaWYgKC91cmxcXChcXCMuKlxcKS9pLnRlc3QodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtW2tleV0gPSB0aGlzLmdldEJ5SWQoXHJcbiAgICAgICAgICAgICAgICAgIHZhbHVlLnJlcGxhY2UoL3VybFxcKFxcIyguKilcXCkvaSwgJyQxJykpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtW2tleV0gPSAodmFsdWUgPT09ICdub25lJykgPyAndHJhbnNwYXJlbnQnIDogdmFsdWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdpZCc6XHJcbiAgICAgICAgICAgICAgZWxlbS5pZCA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdjbGFzcyc6XHJcbiAgICAgICAgICAgICAgZWxlbS5jbGFzc0xpc3QgPSB2YWx1ZS5zcGxpdCgnICcpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGVsZW07XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFJlYWQgYW55IG51bWJlciBvZiBTVkcgbm9kZSB0eXBlcyBhbmQgY3JlYXRlIFR3byBlcXVpdmFsZW50cyBvZiB0aGVtLlxyXG4gICAgICAgKi9cclxuICAgICAgcmVhZDoge1xyXG5cclxuICAgICAgICBzdmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5yZWFkLmcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBnOiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGdyb3VwID0gbmV3IFR3by5Hcm91cCgpO1xyXG5cclxuICAgICAgICAgIC8vIFN3aXRjaGVkIHVwIG9yZGVyIHRvIGluaGVyaXQgbW9yZSBzcGVjaWZpYyBzdHlsZXNcclxuICAgICAgICAgIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCBncm91cCk7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBub2RlLmNoaWxkTm9kZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBuID0gbm9kZS5jaGlsZE5vZGVzW2ldO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbi5ub2RlTmFtZTtcclxuICAgICAgICAgICAgaWYgKCF0YWcpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWdOYW1lID0gdGFnLnJlcGxhY2UoL3N2Z1xcOi9pZywgJycpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGFnTmFtZSBpbiBUd28uVXRpbHMucmVhZCkge1xyXG4gICAgICAgICAgICAgIHZhciBvID0gVHdvLlV0aWxzLnJlYWRbdGFnTmFtZV0uY2FsbChncm91cCwgbik7XHJcbiAgICAgICAgICAgICAgZ3JvdXAuYWRkKG8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGdyb3VwO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwb2x5Z29uOiBmdW5jdGlvbihub2RlLCBvcGVuKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHBvaW50cyA9IG5vZGUuZ2V0QXR0cmlidXRlKCdwb2ludHMnKTtcclxuXHJcbiAgICAgICAgICB2YXIgdmVydHMgPSBbXTtcclxuICAgICAgICAgIHBvaW50cy5yZXBsYWNlKC8oLT9bXFxkXFwuP10rKVssfFxcc10oLT9bXFxkXFwuP10rKS9nLCBmdW5jdGlvbihtYXRjaCwgcDEsIHAyKSB7XHJcbiAgICAgICAgICAgIHZlcnRzLnB1c2gobmV3IFR3by5BbmNob3IocGFyc2VGbG9hdChwMSksIHBhcnNlRmxvYXQocDIpKSk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB2YXIgcG9seSA9IG5ldyBUd28uUGF0aCh2ZXJ0cywgIW9wZW4pLm5vU3Ryb2tlKCk7XHJcbiAgICAgICAgICBwb2x5LmZpbGwgPSAnYmxhY2snO1xyXG5cclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgcG9seSk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBvbHlsaW5lOiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLnJlYWQucG9seWdvbi5jYWxsKHRoaXMsIG5vZGUsIHRydWUpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBhdGg6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgcGF0aCA9IG5vZGUuZ2V0QXR0cmlidXRlKCdkJyk7XHJcblxyXG4gICAgICAgICAgLy8gQ3JlYXRlIGEgVHdvLlBhdGggZnJvbSB0aGUgcGF0aHMuXHJcblxyXG4gICAgICAgICAgdmFyIGNvb3JkID0gbmV3IFR3by5BbmNob3IoKTtcclxuICAgICAgICAgIHZhciBjb250cm9sLCBjb29yZHM7XHJcbiAgICAgICAgICB2YXIgY2xvc2VkID0gZmFsc2UsIHJlbGF0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICB2YXIgY29tbWFuZHMgPSBwYXRoLm1hdGNoKC9bYS1kZi16XVteYS1kZi16XSovaWcpO1xyXG4gICAgICAgICAgdmFyIGxhc3QgPSBjb21tYW5kcy5sZW5ndGggLSAxO1xyXG5cclxuICAgICAgICAgIC8vIFNwbGl0IHVwIHBvbHliZXppZXJzXHJcblxyXG4gICAgICAgICAgXy5lYWNoKGNvbW1hbmRzLnNsaWNlKDApLCBmdW5jdGlvbihjb21tYW5kLCBpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IGNvbW1hbmRbMF07XHJcbiAgICAgICAgICAgIHZhciBsb3dlciA9IHR5cGUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgdmFyIGl0ZW1zID0gY29tbWFuZC5zbGljZSgxKS50cmltKCkuc3BsaXQoL1tcXHMsXSt8KD89XFxzP1srXFwtXSkvKTtcclxuICAgICAgICAgICAgdmFyIHByZSwgcG9zdCwgcmVzdWx0ID0gW10sIGJpbjtcclxuXHJcbiAgICAgICAgICAgIGlmIChpIDw9IDApIHtcclxuICAgICAgICAgICAgICBjb21tYW5kcyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKGxvd2VyKSB7XHJcbiAgICAgICAgICAgICAgY2FzZSAnaCc6XHJcbiAgICAgICAgICAgICAgY2FzZSAndic6XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICBiaW4gPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgY2FzZSAnbSc6XHJcbiAgICAgICAgICAgICAgY2FzZSAnbCc6XHJcbiAgICAgICAgICAgICAgY2FzZSAndCc6XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMikge1xyXG4gICAgICAgICAgICAgICAgICBiaW4gPSAyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgY2FzZSAncyc6XHJcbiAgICAgICAgICAgICAgY2FzZSAncSc6XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gNCkge1xyXG4gICAgICAgICAgICAgICAgICBiaW4gPSA0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgY2FzZSAnYyc6XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gNikge1xyXG4gICAgICAgICAgICAgICAgICBiaW4gPSA2O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgY2FzZSAnYSc6XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBIYW5kbGUgRWxsaXBzZXNcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYmluKSB7XHJcblxyXG4gICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBsID0gaXRlbXMubGVuZ3RoLCB0aW1lcyA9IDA7IGogPCBsOyBqKz1iaW4pIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgY3QgPSB0eXBlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWVzID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICBjdCA9ICdsJztcclxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ00nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgY3QgPSAnTCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChbY3RdLmNvbmNhdChpdGVtcy5zbGljZShqLCBqICsgYmluKSkuam9pbignICcpKTtcclxuICAgICAgICAgICAgICAgIHRpbWVzKys7XHJcblxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY29tbWFuZHMgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KGNvbW1hbmRzLCByZXN1bHQpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgY29tbWFuZHMucHVzaChjb21tYW5kKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIHZlcnRpY2VzIGZvciBvdXIgVHdvLlBhdGhcclxuXHJcbiAgICAgICAgICB2YXIgcG9pbnRzID0gW107XHJcbiAgICAgICAgICBfLmVhY2goY29tbWFuZHMsIGZ1bmN0aW9uKGNvbW1hbmQsIGkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXN1bHQsIHgsIHk7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gY29tbWFuZFswXTtcclxuICAgICAgICAgICAgdmFyIGxvd2VyID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgY29vcmRzID0gY29tbWFuZC5zbGljZSgxKS50cmltKCk7XHJcbiAgICAgICAgICAgIGNvb3JkcyA9IGNvb3Jkcy5yZXBsYWNlKC8oLT9cXGQrKD86XFwuXFxkKik/KVtlRV0oWytcXC1dP1xcZCspL2csIGZ1bmN0aW9uKG1hdGNoLCBuMSwgbjIpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChuMSkgKiBwb3coMTAsIG4yKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGNvb3JkcyA9IGNvb3Jkcy5zcGxpdCgvW1xccyxdK3woPz1cXHM/WytcXC1dKS8pO1xyXG4gICAgICAgICAgICByZWxhdGl2ZSA9IHR5cGUgPT09IGxvd2VyO1xyXG5cclxuICAgICAgICAgICAgdmFyIHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgcmVmbGVjdGlvbjtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAobG93ZXIpIHtcclxuXHJcbiAgICAgICAgICAgICAgY2FzZSAneic6XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA+PSBsYXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgIGNsb3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB4ID0gY29vcmQueDtcclxuICAgICAgICAgICAgICAgICAgeSA9IGNvb3JkLnk7XHJcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBUd28uQW5jaG9yKFxyXG4gICAgICAgICAgICAgICAgICAgIHgsIHksXHJcbiAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgVHdvLkNvbW1hbmRzLmNsb3NlXHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgY2FzZSAnbSc6XHJcbiAgICAgICAgICAgICAgY2FzZSAnbCc6XHJcblxyXG4gICAgICAgICAgICAgICAgeCA9IHBhcnNlRmxvYXQoY29vcmRzWzBdKTtcclxuICAgICAgICAgICAgICAgIHkgPSBwYXJzZUZsb2F0KGNvb3Jkc1sxXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IFR3by5BbmNob3IoXHJcbiAgICAgICAgICAgICAgICAgIHgsIHksXHJcbiAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgbG93ZXIgPT09ICdtJyA/IFR3by5Db21tYW5kcy5tb3ZlIDogVHdvLkNvbW1hbmRzLmxpbmVcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJlc3VsdC5hZGRTZWxmKGNvb3JkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyByZXN1bHQuY29udHJvbHMubGVmdC5jb3B5KHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAvLyByZXN1bHQuY29udHJvbHMucmlnaHQuY29weShyZXN1bHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvb3JkID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ2gnOlxyXG4gICAgICAgICAgICAgIGNhc2UgJ3YnOlxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBhID0gbG93ZXIgPT09ICdoJyA/ICd4JyA6ICd5JztcclxuICAgICAgICAgICAgICAgIHZhciBiID0gYSA9PT0gJ3gnID8gJ3knIDogJ3gnO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBUd28uQW5jaG9yKFxyXG4gICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICBUd28uQ29tbWFuZHMubGluZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFthXSA9IHBhcnNlRmxvYXQoY29vcmRzWzBdKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtiXSA9IGNvb3JkW2JdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICByZXN1bHRbYV0gKz0gY29vcmRbYV07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmVzdWx0LmNvbnRyb2xzLmxlZnQuY29weShyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVzdWx0LmNvbnRyb2xzLnJpZ2h0LmNvcHkocmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb29yZCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICBjYXNlICdjJzpcclxuICAgICAgICAgICAgICBjYXNlICdzJzpcclxuXHJcbiAgICAgICAgICAgICAgICB4MSA9IGNvb3JkLng7XHJcbiAgICAgICAgICAgICAgICB5MSA9IGNvb3JkLnk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFjb250cm9sKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRyb2wgPSBuZXcgVHdvLlZlY3RvcigpOy8vLmNvcHkoY29vcmQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsb3dlciA9PT0gJ2MnKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICB4MiA9IHBhcnNlRmxvYXQoY29vcmRzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgeTIgPSBwYXJzZUZsb2F0KGNvb3Jkc1sxXSk7XHJcbiAgICAgICAgICAgICAgICAgIHgzID0gcGFyc2VGbG9hdChjb29yZHNbMl0pO1xyXG4gICAgICAgICAgICAgICAgICB5MyA9IHBhcnNlRmxvYXQoY29vcmRzWzNdKTtcclxuICAgICAgICAgICAgICAgICAgeDQgPSBwYXJzZUZsb2F0KGNvb3Jkc1s0XSk7XHJcbiAgICAgICAgICAgICAgICAgIHk0ID0gcGFyc2VGbG9hdChjb29yZHNbNV0pO1xyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgcmVmbGVjdGlvbiBjb250cm9sIHBvaW50IGZvciBwcm9wZXIgeDIsIHkyXHJcbiAgICAgICAgICAgICAgICAgIC8vIGluY2x1c2lvbi5cclxuXHJcbiAgICAgICAgICAgICAgICAgIHJlZmxlY3Rpb24gPSBnZXRSZWZsZWN0aW9uKGNvb3JkLCBjb250cm9sLCByZWxhdGl2ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICB4MiA9IHJlZmxlY3Rpb24ueDtcclxuICAgICAgICAgICAgICAgICAgeTIgPSByZWZsZWN0aW9uLnk7XHJcbiAgICAgICAgICAgICAgICAgIHgzID0gcGFyc2VGbG9hdChjb29yZHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICB5MyA9IHBhcnNlRmxvYXQoY29vcmRzWzFdKTtcclxuICAgICAgICAgICAgICAgICAgeDQgPSBwYXJzZUZsb2F0KGNvb3Jkc1syXSk7XHJcbiAgICAgICAgICAgICAgICAgIHk0ID0gcGFyc2VGbG9hdChjb29yZHNbM10pO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgeDIgKz0geDE7XHJcbiAgICAgICAgICAgICAgICAgIHkyICs9IHkxO1xyXG4gICAgICAgICAgICAgICAgICB4MyArPSB4MTtcclxuICAgICAgICAgICAgICAgICAgeTMgKz0geTE7XHJcbiAgICAgICAgICAgICAgICAgIHg0ICs9IHgxO1xyXG4gICAgICAgICAgICAgICAgICB5NCArPSB5MTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIV8uaXNPYmplY3QoY29vcmQuY29udHJvbHMpKSB7XHJcbiAgICAgICAgICAgICAgICAgIFR3by5BbmNob3IuQXBwZW5kQ3VydmVQcm9wZXJ0aWVzKGNvb3JkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb29yZC5jb250cm9scy5yaWdodC5zZXQoeDIgLSBjb29yZC54LCB5MiAtIGNvb3JkLnkpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IFR3by5BbmNob3IoXHJcbiAgICAgICAgICAgICAgICAgIHg0LCB5NCxcclxuICAgICAgICAgICAgICAgICAgeDMgLSB4NCwgeTMgLSB5NCxcclxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgIFR3by5Db21tYW5kcy5jdXJ2ZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb29yZCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIGNvbnRyb2wgPSByZXN1bHQuY29udHJvbHMubGVmdDtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgY2FzZSAndCc6XHJcbiAgICAgICAgICAgICAgY2FzZSAncSc6XHJcblxyXG4gICAgICAgICAgICAgICAgeDEgPSBjb29yZC54O1xyXG4gICAgICAgICAgICAgICAgeTEgPSBjb29yZC55O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY29udHJvbCkge1xyXG4gICAgICAgICAgICAgICAgICBjb250cm9sID0gbmV3IFR3by5WZWN0b3IoKTsvLy5jb3B5KGNvb3JkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY29udHJvbC5pc1plcm8oKSkge1xyXG4gICAgICAgICAgICAgICAgICB4MiA9IHgxO1xyXG4gICAgICAgICAgICAgICAgICB5MiA9IHkxO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgeDIgPSBjb250cm9sLng7XHJcbiAgICAgICAgICAgICAgICAgIHkxID0gY29udHJvbC55O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChsb3dlciA9PT0gJ3EnKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICB4MyA9IHBhcnNlRmxvYXQoY29vcmRzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgeTMgPSBwYXJzZUZsb2F0KGNvb3Jkc1sxXSk7XHJcbiAgICAgICAgICAgICAgICAgIHg0ID0gcGFyc2VGbG9hdChjb29yZHNbMV0pO1xyXG4gICAgICAgICAgICAgICAgICB5NCA9IHBhcnNlRmxvYXQoY29vcmRzWzJdKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgcmVmbGVjdGlvbiA9IGdldFJlZmxlY3Rpb24oY29vcmQsIGNvbnRyb2wsIHJlbGF0aXZlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIHgzID0gcmVmbGVjdGlvbi54O1xyXG4gICAgICAgICAgICAgICAgICB5MyA9IHJlZmxlY3Rpb24ueTtcclxuICAgICAgICAgICAgICAgICAgeDQgPSBwYXJzZUZsb2F0KGNvb3Jkc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgIHk0ID0gcGFyc2VGbG9hdChjb29yZHNbMV0pO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgeDIgKz0geDE7XHJcbiAgICAgICAgICAgICAgICAgIHkyICs9IHkxO1xyXG4gICAgICAgICAgICAgICAgICB4MyArPSB4MTtcclxuICAgICAgICAgICAgICAgICAgeTMgKz0geTE7XHJcbiAgICAgICAgICAgICAgICAgIHg0ICs9IHgxO1xyXG4gICAgICAgICAgICAgICAgICB5NCArPSB5MTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIV8uaXNPYmplY3QoY29vcmQuY29udHJvbHMpKSB7XHJcbiAgICAgICAgICAgICAgICAgIFR3by5BbmNob3IuQXBwZW5kQ3VydmVQcm9wZXJ0aWVzKGNvb3JkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBjb29yZC5jb250cm9scy5yaWdodC5zZXQoeDIgLSBjb29yZC54LCB5MiAtIGNvb3JkLnkpO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IFR3by5BbmNob3IoXHJcbiAgICAgICAgICAgICAgICAgIHg0LCB5NCxcclxuICAgICAgICAgICAgICAgICAgeDMgLSB4NCwgeTMgLSB5NCxcclxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgIFR3by5Db21tYW5kcy5jdXJ2ZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb29yZCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIGNvbnRyb2wgPSByZXN1bHQuY29udHJvbHMubGVmdDtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgY2FzZSAnYSc6XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgbmV3IFR3by5VdGlscy5FcnJvcignbm90IHlldCBhYmxlIHRvIGludGVycHJldCBFbGxpcHRpY2FsIEFyY3MuJyk7XHJcbiAgICAgICAgICAgICAgICB4MSA9IGNvb3JkLng7XHJcbiAgICAgICAgICAgICAgICB5MSA9IGNvb3JkLnk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJ4ID0gcGFyc2VGbG9hdChjb29yZHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJ5ID0gcGFyc2VGbG9hdChjb29yZHNbMV0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHhBeGlzUm90YXRpb24gPSBwYXJzZUZsb2F0KGNvb3Jkc1syXSkgKiBNYXRoLlBJIC8gMTgwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGxhcmdlQXJjRmxhZyA9IHBhcnNlRmxvYXQoY29vcmRzWzNdKTtcclxuICAgICAgICAgICAgICAgIHZhciBzd2VlcEZsYWcgPSBwYXJzZUZsb2F0KGNvb3Jkc1s0XSk7XHJcblxyXG4gICAgICAgICAgICAgICAgeDQgPSBwYXJzZUZsb2F0KGNvb3Jkc1s1XSk7XHJcbiAgICAgICAgICAgICAgICB5NCA9IHBhcnNlRmxvYXQoY29vcmRzWzZdKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgeDQgKz0geDE7XHJcbiAgICAgICAgICAgICAgICAgIHk0ICs9IHkxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9pbXBsbm90ZS5odG1sI0FyY0NvbnZlcnNpb25FbmRwb2ludFRvQ2VudGVyXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIG1pZHBvaW50IG14IG15XHJcbiAgICAgICAgICAgICAgICB2YXIgbXggPSAoeDQgLSB4MSkgLyAyO1xyXG4gICAgICAgICAgICAgICAgdmFyIG15ID0gKHk0IC0geTEpIC8gMjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgeDEnIHkxJyBGLjYuNS4xXHJcbiAgICAgICAgICAgICAgICB2YXIgX3ggPSBteCAqIE1hdGguY29zKHhBeGlzUm90YXRpb24pICsgbXkgKiBNYXRoLnNpbih4QXhpc1JvdGF0aW9uKTtcclxuICAgICAgICAgICAgICAgIHZhciBfeSA9IC0gbXggKiBNYXRoLnNpbih4QXhpc1JvdGF0aW9uKSArIG15ICogTWF0aC5jb3MoeEF4aXNSb3RhdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJ4MiA9IHJ4ICogcng7XHJcbiAgICAgICAgICAgICAgICB2YXIgcnkyID0gcnkgKiByeTtcclxuICAgICAgICAgICAgICAgIHZhciBfeDIgPSBfeCAqIF94O1xyXG4gICAgICAgICAgICAgICAgdmFyIF95MiA9IF95ICogX3k7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gYWRqdXN0IHJhZGlpXHJcbiAgICAgICAgICAgICAgICB2YXIgbCA9IF94MiAvIHJ4MiArIF95MiAvIHJ5MjtcclxuICAgICAgICAgICAgICAgIGlmIChsID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICByeCAqPSBNYXRoLnNxcnQobCk7XHJcbiAgICAgICAgICAgICAgICAgIHJ5ICo9IE1hdGguc3FydChsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgYW1wID0gTWF0aC5zcXJ0KChyeDIgKiByeTIgLSByeDIgKiBfeTIgLSByeTIgKiBfeDIpIC8gKHJ4MiAqIF95MiArIHJ5MiAqIF94MikpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmlzTmFOKGFtcCkpIHtcclxuICAgICAgICAgICAgICAgICAgYW1wID0gMDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobGFyZ2VBcmNGbGFnICE9IHN3ZWVwRmxhZyAmJiBhbXAgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFtcCAqPSAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgY3gnIGN5JyBGLjYuNS4yXHJcbiAgICAgICAgICAgICAgICB2YXIgX2N4ID0gYW1wICogcnggKiBfeSAvIHJ5O1xyXG4gICAgICAgICAgICAgICAgdmFyIF9jeSA9IC0gYW1wICogcnkgKiBfeCAvIHJ4O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBjeCBjeSBGLjYuNS4zXHJcbiAgICAgICAgICAgICAgICB2YXIgY3ggPSBfY3ggKiBNYXRoLmNvcyh4QXhpc1JvdGF0aW9uKSAtIF9jeSAqIE1hdGguc2luKHhBeGlzUm90YXRpb24pICsgKHgxICsgeDQpIC8gMjtcclxuICAgICAgICAgICAgICAgIHZhciBjeSA9IF9jeCAqIE1hdGguc2luKHhBeGlzUm90YXRpb24pICsgX2N5ICogTWF0aC5jb3MoeEF4aXNSb3RhdGlvbikgKyAoeTEgKyB5NCkgLyAyO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHZlY3RvciBtYWduaXR1ZGVcclxuICAgICAgICAgICAgICAgIHZhciBtID0gZnVuY3Rpb24odikgeyByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHZbMF0sIDIpICsgTWF0aC5wb3codlsxXSwgMikpOyB9XHJcbiAgICAgICAgICAgICAgICAvLyByYXRpbyBiZXR3ZWVuIHR3byB2ZWN0b3JzXHJcbiAgICAgICAgICAgICAgICB2YXIgciA9IGZ1bmN0aW9uKHUsIHYpIHsgcmV0dXJuICh1WzBdICogdlswXSArIHVbMV0gKiB2WzFdKSAvIChtKHUpICogbSh2KSkgfVxyXG4gICAgICAgICAgICAgICAgLy8gYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9yc1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBmdW5jdGlvbih1LCB2KSB7IHJldHVybiAodVswXSAqIHZbMV0gPCB1WzFdICogdlswXSA/IC0gMSA6IDEpICogTWF0aC5hY29zKHIodSx2KSk7IH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhldGExIGFuZCBkZWx0YSB0aGV0YSBGLjYuNS40ICsgRi42LjUuNVxyXG4gICAgICAgICAgICAgICAgdmFyIHQxID0gYShbMSwgMF0sIFsoX3ggLSBfY3gpIC8gcngsIChfeSAtIF9jeSkgLyByeV0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHUgPSBbKF94IC0gX2N4KSAvIHJ4LCAoX3kgLSBfY3kpIC8gcnldO1xyXG4gICAgICAgICAgICAgICAgdmFyIHYgPSBbKCAtIF94IC0gX2N4KSAvIHJ4LCAoIC0gX3kgLSBfY3kpIC8gcnldO1xyXG4gICAgICAgICAgICAgICAgdmFyIGR0ID0gYSh1LCB2KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocih1LCB2KSA8PSAtMSkgZHQgPSBNYXRoLlBJO1xyXG4gICAgICAgICAgICAgICAgaWYgKHIodSwgdikgPj0gMSkgZHQgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEYuNi41LjZcclxuICAgICAgICAgICAgICAgIGlmIChsYXJnZUFyY0ZsYWcpICB7XHJcbiAgICAgICAgICAgICAgICAgIGR0ID0gbW9kKGR0LCBNYXRoLlBJICogMik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHN3ZWVwRmxhZyAmJiBkdCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgZHQgLT0gTWF0aC5QSSAqIDI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IFR3by5SZXNvbHV0aW9uO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgYSBwcm9qZWN0aW9uIG9mIG91ciByb3RhdGlvbiBhbmQgdHJhbnNsYXRpb24gdG8gYXBwbHlcclxuICAgICAgICAgICAgICAgIC8vIHRvIHRoZSBzZXQgb2YgcG9pbnRzLlxyXG4gICAgICAgICAgICAgICAgdmFyIHByb2plY3Rpb24gPSBuZXcgVHdvLk1hdHJpeCgpXHJcbiAgICAgICAgICAgICAgICAgIC50cmFuc2xhdGUoY3gsIGN5KVxyXG4gICAgICAgICAgICAgICAgICAucm90YXRlKHhBeGlzUm90YXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhIHJlc3VsdGluZyBhcnJheSBvZiBUd28uQW5jaG9yJ3MgdG8gZXhwb3J0IHRvIHRoZVxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIHBhdGguXHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBfLm1hcChfLnJhbmdlKGxlbmd0aCksIGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICAgICAgICAgICAgdmFyIHBjdCA9IDEgLSAoaSAvIChsZW5ndGggLSAxKSk7XHJcbiAgICAgICAgICAgICAgICAgIHZhciB0aGV0YSA9IHBjdCAqIGR0ICsgdDE7XHJcbiAgICAgICAgICAgICAgICAgIHZhciB4ID0gcnggKiBNYXRoLmNvcyh0aGV0YSk7XHJcbiAgICAgICAgICAgICAgICAgIHZhciB5ID0gcnkgKiBNYXRoLnNpbih0aGV0YSk7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBwcm9qZWN0ZWQgPSBwcm9qZWN0aW9uLm11bHRpcGx5KHgsIHksIDEpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFR3by5BbmNob3IocHJvamVjdGVkLngsIHByb2plY3RlZC55LCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgVHdvLkNvbW1hbmRzLmxpbmUpOztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBUd28uQW5jaG9yKHg0LCB5NCwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIFR3by5Db21tYW5kcy5saW5lKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29vcmQgPSByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IGNvb3JkLmNvbnRyb2xzLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgaWYgKF8uaXNBcnJheShyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuY29uY2F0KHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgaWYgKHBvaW50cy5sZW5ndGggPD0gMSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIHBhdGggPSBuZXcgVHdvLlBhdGgocG9pbnRzLCBjbG9zZWQsIHVuZGVmaW5lZCwgdHJ1ZSkubm9TdHJva2UoKTtcclxuICAgICAgICAgIHBhdGguZmlsbCA9ICdibGFjayc7XHJcblxyXG4gICAgICAgICAgdmFyIHJlY3QgPSBwYXRoLmdldEJvdW5kaW5nQ2xpZW50UmVjdCh0cnVlKTtcclxuXHJcbiAgICAgICAgICAvLyBDZW50ZXIgb2JqZWN0cyB0byBzdGF5IGNvbnNpc3RlbnRcclxuICAgICAgICAgIC8vIHdpdGggdGhlIHJlc3Qgb2YgdGhlIFR3by5qcyBBUEkuXHJcbiAgICAgICAgICByZWN0LmNlbnRyb2lkID0ge1xyXG4gICAgICAgICAgICB4OiByZWN0LmxlZnQgKyByZWN0LndpZHRoIC8gMixcclxuICAgICAgICAgICAgeTogcmVjdC50b3AgKyByZWN0LmhlaWdodCAvIDJcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgXy5lYWNoKHBhdGgudmVydGljZXMsIGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgdi5zdWJTZWxmKHJlY3QuY2VudHJvaWQpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgcGF0aC50cmFuc2xhdGlvbi5hZGRTZWxmKHJlY3QuY2VudHJvaWQpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgcGF0aCk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNpcmNsZTogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICAgIHZhciB4ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnY3gnKSk7XHJcbiAgICAgICAgICB2YXIgeSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2N5JykpO1xyXG4gICAgICAgICAgdmFyIHIgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdyJykpO1xyXG5cclxuICAgICAgICAgIHZhciBjaXJjbGUgPSBuZXcgVHdvLkNpcmNsZSh4LCB5LCByKS5ub1N0cm9rZSgpO1xyXG4gICAgICAgICAgY2lyY2xlLmZpbGwgPSAnYmxhY2snO1xyXG5cclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgY2lyY2xlKTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZWxsaXBzZTogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICAgIHZhciB4ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnY3gnKSk7XHJcbiAgICAgICAgICB2YXIgeSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2N5JykpO1xyXG4gICAgICAgICAgdmFyIHdpZHRoID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgncngnKSk7XHJcbiAgICAgICAgICB2YXIgaGVpZ2h0ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgncnknKSk7XHJcblxyXG4gICAgICAgICAgdmFyIGVsbGlwc2UgPSBuZXcgVHdvLkVsbGlwc2UoeCwgeSwgd2lkdGgsIGhlaWdodCkubm9TdHJva2UoKTtcclxuICAgICAgICAgIGVsbGlwc2UuZmlsbCA9ICdibGFjayc7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCBlbGxpcHNlKTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmVjdDogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICAgIHZhciB4ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneCcpKSB8fCAwO1xyXG4gICAgICAgICAgdmFyIHkgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd5JykpIHx8IDA7XHJcbiAgICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd3aWR0aCcpKTtcclxuICAgICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdoZWlnaHQnKSk7XHJcblxyXG4gICAgICAgICAgdmFyIHcyID0gd2lkdGggLyAyO1xyXG4gICAgICAgICAgdmFyIGgyID0gaGVpZ2h0IC8gMjtcclxuXHJcbiAgICAgICAgICB2YXIgcmVjdCA9IG5ldyBUd28uUmVjdGFuZ2xlKHggKyB3MiwgeSArIGgyLCB3aWR0aCwgaGVpZ2h0KVxyXG4gICAgICAgICAgICAubm9TdHJva2UoKTtcclxuICAgICAgICAgIHJlY3QuZmlsbCA9ICdibGFjayc7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCByZWN0KTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbGluZTogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICAgIHZhciB4MSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3gxJykpO1xyXG4gICAgICAgICAgdmFyIHkxID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneTEnKSk7XHJcbiAgICAgICAgICB2YXIgeDIgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd4MicpKTtcclxuICAgICAgICAgIHZhciB5MiA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3kyJykpO1xyXG5cclxuICAgICAgICAgIHZhciBsaW5lID0gbmV3IFR3by5MaW5lKHgxLCB5MSwgeDIsIHkyKS5ub0ZpbGwoKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIGxpbmUpO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsaW5lYXJncmFkaWVudDogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICAgIHZhciB4MSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3gxJykpO1xyXG4gICAgICAgICAgdmFyIHkxID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneTEnKSk7XHJcbiAgICAgICAgICB2YXIgeDIgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd4MicpKTtcclxuICAgICAgICAgIHZhciB5MiA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3kyJykpO1xyXG5cclxuICAgICAgICAgIHZhciBveCA9ICh4MiArIHgxKSAvIDI7XHJcbiAgICAgICAgICB2YXIgb3kgPSAoeTIgKyB5MSkgLyAyO1xyXG5cclxuICAgICAgICAgIHZhciBzdG9wcyA9IFtdO1xyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xyXG5cclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHBhcnNlRmxvYXQoY2hpbGQuZ2V0QXR0cmlidXRlKCdvZmZzZXQnKSk7XHJcbiAgICAgICAgICAgIHZhciBjb2xvciA9IGNoaWxkLmdldEF0dHJpYnV0ZSgnc3RvcC1jb2xvcicpO1xyXG4gICAgICAgICAgICB2YXIgb3BhY2l0eSA9IGNoaWxkLmdldEF0dHJpYnV0ZSgnc3RvcC1vcGFjaXR5Jyk7XHJcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IGNoaWxkLmdldEF0dHJpYnV0ZSgnc3R5bGUnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzTnVsbChjb2xvcikpIHtcclxuICAgICAgICAgICAgICB2YXIgbWF0Y2hlcyA9IHN0eWxlID8gc3R5bGUubWF0Y2goL3N0b3BcXC1jb2xvclxcOlxccz8oW1xcI2EtZkEtRjAtOV0qKS8pIDogZmFsc2U7XHJcbiAgICAgICAgICAgICAgY29sb3IgPSBtYXRjaGVzICYmIG1hdGNoZXMubGVuZ3RoID4gMSA/IG1hdGNoZXNbMV0gOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzTnVsbChvcGFjaXR5KSkge1xyXG4gICAgICAgICAgICAgIHZhciBtYXRjaGVzID0gc3R5bGUgPyBzdHlsZS5tYXRjaCgvc3RvcFxcLW9wYWNpdHlcXDpcXHM/KFswLTlcXC5cXC1dKikvKSA6IGZhbHNlO1xyXG4gICAgICAgICAgICAgIG9wYWNpdHkgPSBtYXRjaGVzICYmIG1hdGNoZXMubGVuZ3RoID4gMSA/IHBhcnNlRmxvYXQobWF0Y2hlc1sxXSkgOiAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdG9wcy5wdXNoKG5ldyBUd28uR3JhZGllbnQuU3RvcChvZmZzZXQsIGNvbG9yLCBvcGFjaXR5KSk7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBncmFkaWVudCA9IG5ldyBUd28uTGluZWFyR3JhZGllbnQoeDEgLSBveCwgeTEgLSBveSwgeDIgLSBveCxcclxuICAgICAgICAgICAgeTIgLSBveSwgc3RvcHMpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgZ3JhZGllbnQpO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByYWRpYWxncmFkaWVudDogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICAgIHZhciBjeCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2N4JykpIHx8IDA7XHJcbiAgICAgICAgICB2YXIgY3kgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdjeScpKSB8fCAwO1xyXG4gICAgICAgICAgdmFyIHIgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdyJykpO1xyXG5cclxuICAgICAgICAgIHZhciBmeCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2Z4JykpO1xyXG4gICAgICAgICAgdmFyIGZ5ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnZnknKSk7XHJcblxyXG4gICAgICAgICAgaWYgKF8uaXNOYU4oZngpKSB7XHJcbiAgICAgICAgICAgIGZ4ID0gY3g7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKF8uaXNOYU4oZnkpKSB7XHJcbiAgICAgICAgICAgIGZ5ID0gY3k7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIG94ID0gTWF0aC5hYnMoY3ggKyBmeCkgLyAyO1xyXG4gICAgICAgICAgdmFyIG95ID0gTWF0aC5hYnMoY3kgKyBmeSkgLyAyO1xyXG5cclxuICAgICAgICAgIHZhciBzdG9wcyA9IFtdO1xyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xyXG5cclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHBhcnNlRmxvYXQoY2hpbGQuZ2V0QXR0cmlidXRlKCdvZmZzZXQnKSk7XHJcbiAgICAgICAgICAgIHZhciBjb2xvciA9IGNoaWxkLmdldEF0dHJpYnV0ZSgnc3RvcC1jb2xvcicpO1xyXG4gICAgICAgICAgICB2YXIgb3BhY2l0eSA9IGNoaWxkLmdldEF0dHJpYnV0ZSgnc3RvcC1vcGFjaXR5Jyk7XHJcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IGNoaWxkLmdldEF0dHJpYnV0ZSgnc3R5bGUnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzTnVsbChjb2xvcikpIHtcclxuICAgICAgICAgICAgICB2YXIgbWF0Y2hlcyA9IHN0eWxlID8gc3R5bGUubWF0Y2goL3N0b3BcXC1jb2xvclxcOlxccz8oW1xcI2EtZkEtRjAtOV0qKS8pIDogZmFsc2U7XHJcbiAgICAgICAgICAgICAgY29sb3IgPSBtYXRjaGVzICYmIG1hdGNoZXMubGVuZ3RoID4gMSA/IG1hdGNoZXNbMV0gOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChfLmlzTnVsbChvcGFjaXR5KSkge1xyXG4gICAgICAgICAgICAgIHZhciBtYXRjaGVzID0gc3R5bGUgPyBzdHlsZS5tYXRjaCgvc3RvcFxcLW9wYWNpdHlcXDpcXHM/KFswLTlcXC5cXC1dKikvKSA6IGZhbHNlO1xyXG4gICAgICAgICAgICAgIG9wYWNpdHkgPSBtYXRjaGVzICYmIG1hdGNoZXMubGVuZ3RoID4gMSA/IHBhcnNlRmxvYXQobWF0Y2hlc1sxXSkgOiAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdG9wcy5wdXNoKG5ldyBUd28uR3JhZGllbnQuU3RvcChvZmZzZXQsIGNvbG9yLCBvcGFjaXR5KSk7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBncmFkaWVudCA9IG5ldyBUd28uUmFkaWFsR3JhZGllbnQoY3ggLSBveCwgY3kgLSBveSwgcixcclxuICAgICAgICAgICAgc3RvcHMsIGZ4IC0gb3gsIGZ5IC0gb3kpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgZ3JhZGllbnQpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdpdmVuIDIgcG9pbnRzIChhLCBiKSBhbmQgY29ycmVzcG9uZGluZyBjb250cm9sIHBvaW50IGZvciBlYWNoXHJcbiAgICAgICAqIHJldHVybiBhbiBhcnJheSBvZiBwb2ludHMgdGhhdCByZXByZXNlbnQgcG9pbnRzIHBsb3R0ZWQgYWxvbmdcclxuICAgICAgICogdGhlIGN1cnZlLiBOdW1iZXIgcG9pbnRzIGRldGVybWluZWQgYnkgbGltaXQuXHJcbiAgICAgICAqL1xyXG4gICAgICBzdWJkaXZpZGU6IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgbGltaXQpIHtcclxuXHJcbiAgICAgICAgbGltaXQgPSBsaW1pdCB8fCBUd28uVXRpbHMuQ3VydmUuUmVjdXJzaW9uTGltaXQ7XHJcbiAgICAgICAgdmFyIGFtb3VudCA9IGxpbWl0ICsgMTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogSXNzdWUgNzNcclxuICAgICAgICAvLyBEb24ndCByZWN1cnNlIGlmIHRoZSBlbmQgcG9pbnRzIGFyZSBpZGVudGljYWxcclxuICAgICAgICBpZiAoeDEgPT09IHg0ICYmIHkxID09PSB5NCkge1xyXG4gICAgICAgICAgcmV0dXJuIFtuZXcgVHdvLkFuY2hvcih4NCwgeTQpXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBfLm1hcChfLnJhbmdlKDAsIGFtb3VudCksIGZ1bmN0aW9uKGkpIHtcclxuXHJcbiAgICAgICAgICB2YXIgdCA9IGkgLyBhbW91bnQ7XHJcbiAgICAgICAgICB2YXIgeCA9IGdldFBvaW50T25DdWJpY0Jlemllcih0LCB4MSwgeDIsIHgzLCB4NCk7XHJcbiAgICAgICAgICB2YXIgeSA9IGdldFBvaW50T25DdWJpY0Jlemllcih0LCB5MSwgeTIsIHkzLCB5NCk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIG5ldyBUd28uQW5jaG9yKHgsIHkpO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBnZXRQb2ludE9uQ3ViaWNCZXppZXI6IGZ1bmN0aW9uKHQsIGEsIGIsIGMsIGQpIHtcclxuICAgICAgICB2YXIgayA9IDEgLSB0O1xyXG4gICAgICAgIHJldHVybiAoayAqIGsgKiBrICogYSkgKyAoMyAqIGsgKiBrICogdCAqIGIpICsgKDMgKiBrICogdCAqIHQgKiBjKSArXHJcbiAgICAgICAgICAgKHQgKiB0ICogdCAqIGQpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdpdmVuIDIgcG9pbnRzIChhLCBiKSBhbmQgY29ycmVzcG9uZGluZyBjb250cm9sIHBvaW50IGZvciBlYWNoXHJcbiAgICAgICAqIHJldHVybiBhIGZsb2F0IHRoYXQgcmVwcmVzZW50cyB0aGUgbGVuZ3RoIG9mIHRoZSBjdXJ2ZSB1c2luZ1xyXG4gICAgICAgKiBHYXVzcy1MZWdlbmRyZSBhbGdvcml0aG0uIExpbWl0IGl0ZXJhdGlvbnMgb2YgY2FsY3VsYXRpb24gYnkgYGxpbWl0YC5cclxuICAgICAgICovXHJcbiAgICAgIGdldEN1cnZlTGVuZ3RoOiBmdW5jdGlvbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIGxpbWl0KSB7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEJldHRlciAvIGZ1enppZXIgZXF1YWxpdHkgY2hlY2tcclxuICAgICAgICAvLyBMaW5lYXIgY2FsY3VsYXRpb25cclxuICAgICAgICBpZiAoeDEgPT09IHgyICYmIHkxID09PSB5MiAmJiB4MyA9PT0geDQgJiYgeTMgPT09IHk0KSB7XHJcbiAgICAgICAgICB2YXIgZHggPSB4NCAtIHgxO1xyXG4gICAgICAgICAgdmFyIGR5ID0geTQgLSB5MTtcclxuICAgICAgICAgIHJldHVybiBzcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29lZmZpY2llbnRzIG9mIGEgQmV6aWVyIGRlcml2YXRpdmUuXHJcbiAgICAgICAgdmFyIGF4ID0gOSAqICh4MiAtIHgzKSArIDMgKiAoeDQgLSB4MSksXHJcbiAgICAgICAgICBieCA9IDYgKiAoeDEgKyB4MykgLSAxMiAqIHgyLFxyXG4gICAgICAgICAgY3ggPSAzICogKHgyIC0geDEpLFxyXG5cclxuICAgICAgICAgIGF5ID0gOSAqICh5MiAtIHkzKSArIDMgKiAoeTQgLSB5MSksXHJcbiAgICAgICAgICBieSA9IDYgKiAoeTEgKyB5MykgLSAxMiAqIHkyLFxyXG4gICAgICAgICAgY3kgPSAzICogKHkyIC0geTEpO1xyXG5cclxuICAgICAgICB2YXIgaW50ZWdyYW5kID0gZnVuY3Rpb24odCkge1xyXG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIHF1YWRyYXRpYyBlcXVhdGlvbnMgb2YgZGVyaXZhdGl2ZXMgZm9yIHggYW5kIHlcclxuICAgICAgICAgIHZhciBkeCA9IChheCAqIHQgKyBieCkgKiB0ICsgY3gsXHJcbiAgICAgICAgICAgIGR5ID0gKGF5ICogdCArIGJ5KSAqIHQgKyBjeTtcclxuICAgICAgICAgIHJldHVybiBzcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gaW50ZWdyYXRlKFxyXG4gICAgICAgICAgaW50ZWdyYW5kLCAwLCAxLCBsaW1pdCB8fCBUd28uVXRpbHMuQ3VydmUuUmVjdXJzaW9uTGltaXRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBJbnRlZ3JhdGlvbiBmb3IgYGdldEN1cnZlTGVuZ3RoYCBjYWxjdWxhdGlvbnMuIFJlZmVyZW5jZWQgZnJvbVxyXG4gICAgICAgKiBQYXBlci5qczogaHR0cHM6Ly9naXRodWIuY29tL3BhcGVyanMvcGFwZXIuanMvYmxvYi9tYXN0ZXIvc3JjL3V0aWwvTnVtZXJpY2FsLmpzI0wxMDFcclxuICAgICAgICovXHJcbiAgICAgIGludGVncmF0ZTogZnVuY3Rpb24oZiwgYSwgYiwgbikge1xyXG4gICAgICAgIHZhciB4ID0gVHdvLlV0aWxzLkN1cnZlLmFic2Npc3Nhc1tuIC0gMl0sXHJcbiAgICAgICAgICB3ID0gVHdvLlV0aWxzLkN1cnZlLndlaWdodHNbbiAtIDJdLFxyXG4gICAgICAgICAgQSA9IDAuNSAqIChiIC0gYSksXHJcbiAgICAgICAgICBCID0gQSArIGEsXHJcbiAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgIG0gPSAobiArIDEpID4+IDEsXHJcbiAgICAgICAgICBzdW0gPSBuICYgMSA/IHdbaSsrXSAqIGYoQikgOiAwOyAvLyBIYW5kbGUgb2RkIG5cclxuICAgICAgICB3aGlsZSAoaSA8IG0pIHtcclxuICAgICAgICAgIHZhciBBeCA9IEEgKiB4W2ldO1xyXG4gICAgICAgICAgc3VtICs9IHdbaSsrXSAqIChmKEIgKyBBeCkgKyBmKEIgLSBBeCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQSAqIHN1bTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBDcmVhdGVzIGEgc2V0IG9mIHBvaW50cyB0aGF0IGhhdmUgdSwgdiB2YWx1ZXMgZm9yIGFuY2hvciBwb3NpdGlvbnNcclxuICAgICAgICovXHJcbiAgICAgIGdldEN1cnZlRnJvbVBvaW50czogZnVuY3Rpb24ocG9pbnRzLCBjbG9zZWQpIHtcclxuXHJcbiAgICAgICAgdmFyIGwgPSBwb2ludHMubGVuZ3RoLCBsYXN0ID0gbCAtIDE7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHBvaW50ID0gcG9pbnRzW2ldO1xyXG5cclxuICAgICAgICAgIGlmICghXy5pc09iamVjdChwb2ludC5jb250cm9scykpIHtcclxuICAgICAgICAgICAgVHdvLkFuY2hvci5BcHBlbmRDdXJ2ZVByb3BlcnRpZXMocG9pbnQpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBwcmV2ID0gY2xvc2VkID8gbW9kKGkgLSAxLCBsKSA6IG1heChpIC0gMSwgMCk7XHJcbiAgICAgICAgICB2YXIgbmV4dCA9IGNsb3NlZCA/IG1vZChpICsgMSwgbCkgOiBtaW4oaSArIDEsIGxhc3QpO1xyXG5cclxuICAgICAgICAgIHZhciBhID0gcG9pbnRzW3ByZXZdO1xyXG4gICAgICAgICAgdmFyIGIgPSBwb2ludDtcclxuICAgICAgICAgIHZhciBjID0gcG9pbnRzW25leHRdO1xyXG4gICAgICAgICAgZ2V0Q29udHJvbFBvaW50cyhhLCBiLCBjKTtcclxuXHJcbiAgICAgICAgICBiLl9jb21tYW5kID0gaSA9PT0gMCA/IFR3by5Db21tYW5kcy5tb3ZlIDogVHdvLkNvbW1hbmRzLmN1cnZlO1xyXG5cclxuICAgICAgICAgIGIuY29udHJvbHMubGVmdC54ID0gXy5pc051bWJlcihiLmNvbnRyb2xzLmxlZnQueCkgPyBiLmNvbnRyb2xzLmxlZnQueCA6IGIueDtcclxuICAgICAgICAgIGIuY29udHJvbHMubGVmdC55ID0gXy5pc051bWJlcihiLmNvbnRyb2xzLmxlZnQueSkgPyBiLmNvbnRyb2xzLmxlZnQueSA6IGIueTtcclxuXHJcbiAgICAgICAgICBiLmNvbnRyb2xzLnJpZ2h0LnggPSBfLmlzTnVtYmVyKGIuY29udHJvbHMucmlnaHQueCkgPyBiLmNvbnRyb2xzLnJpZ2h0LnggOiBiLng7XHJcbiAgICAgICAgICBiLmNvbnRyb2xzLnJpZ2h0LnkgPSBfLmlzTnVtYmVyKGIuY29udHJvbHMucmlnaHQueSkgPyBiLmNvbnRyb2xzLnJpZ2h0LnkgOiBiLnk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogR2l2ZW4gdGhyZWUgY29vcmRpbmF0ZXMgcmV0dXJuIHRoZSBjb250cm9sIHBvaW50cyBmb3IgdGhlIG1pZGRsZSwgYixcclxuICAgICAgICogdmVydGV4LlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0Q29udHJvbFBvaW50czogZnVuY3Rpb24oYSwgYiwgYykge1xyXG5cclxuICAgICAgICB2YXIgYTEgPSBhbmdsZUJldHdlZW4oYSwgYik7XHJcbiAgICAgICAgdmFyIGEyID0gYW5nbGVCZXR3ZWVuKGMsIGIpO1xyXG5cclxuICAgICAgICB2YXIgZDEgPSBkaXN0YW5jZUJldHdlZW4oYSwgYik7XHJcbiAgICAgICAgdmFyIGQyID0gZGlzdGFuY2VCZXR3ZWVuKGMsIGIpO1xyXG5cclxuICAgICAgICB2YXIgbWlkID0gKGExICsgYTIpIC8gMjtcclxuXHJcbiAgICAgICAgLy8gU28gd2Uga25vdyB3aGljaCBhbmdsZSBjb3JyZXNwb25kcyB0byB3aGljaCBzaWRlLlxyXG5cclxuICAgICAgICBiLnUgPSBfLmlzT2JqZWN0KGIuY29udHJvbHMubGVmdCkgPyBiLmNvbnRyb2xzLmxlZnQgOiBuZXcgVHdvLlZlY3RvcigwLCAwKTtcclxuICAgICAgICBiLnYgPSBfLmlzT2JqZWN0KGIuY29udHJvbHMucmlnaHQpID8gYi5jb250cm9scy5yaWdodCA6IG5ldyBUd28uVmVjdG9yKDAsIDApO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBJc3N1ZSA3M1xyXG4gICAgICAgIGlmIChkMSA8IDAuMDAwMSB8fCBkMiA8IDAuMDAwMSkge1xyXG4gICAgICAgICAgaWYgKCFiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICBiLmNvbnRyb2xzLmxlZnQuY29weShiKTtcclxuICAgICAgICAgICAgYi5jb250cm9scy5yaWdodC5jb3B5KGIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkMSAqPSAwLjMzOyAvLyBXaHkgMC4zMz9cclxuICAgICAgICBkMiAqPSAwLjMzO1xyXG5cclxuICAgICAgICBpZiAoYTIgPCBhMSkge1xyXG4gICAgICAgICAgbWlkICs9IEhBTEZfUEk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG1pZCAtPSBIQUxGX1BJO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYi5jb250cm9scy5sZWZ0LnggPSBjb3MobWlkKSAqIGQxO1xyXG4gICAgICAgIGIuY29udHJvbHMubGVmdC55ID0gc2luKG1pZCkgKiBkMTtcclxuXHJcbiAgICAgICAgbWlkIC09IFBJO1xyXG5cclxuICAgICAgICBiLmNvbnRyb2xzLnJpZ2h0LnggPSBjb3MobWlkKSAqIGQyO1xyXG4gICAgICAgIGIuY29udHJvbHMucmlnaHQueSA9IHNpbihtaWQpICogZDI7XHJcblxyXG4gICAgICAgIGlmICghYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgIGIuY29udHJvbHMubGVmdC54ICs9IGIueDtcclxuICAgICAgICAgIGIuY29udHJvbHMubGVmdC55ICs9IGIueTtcclxuICAgICAgICAgIGIuY29udHJvbHMucmlnaHQueCArPSBiLng7XHJcbiAgICAgICAgICBiLmNvbnRyb2xzLnJpZ2h0LnkgKz0gYi55O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGI7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdldCB0aGUgcmVmbGVjdGlvbiBvZiBhIHBvaW50IFwiYlwiIGFib3V0IHBvaW50IFwiYVwiLiBXaGVyZSBcImFcIiBpcyBpblxyXG4gICAgICAgKiBhYnNvbHV0ZSBzcGFjZSBhbmQgXCJiXCIgaXMgcmVsYXRpdmUgdG8gXCJhXCIuXHJcbiAgICAgICAqXHJcbiAgICAgICAqIGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ltcGxub3RlLmh0bWwjUGF0aEVsZW1lbnRJbXBsZW1lbnRhdGlvbk5vdGVzXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXRSZWZsZWN0aW9uOiBmdW5jdGlvbihhLCBiLCByZWxhdGl2ZSkge1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFR3by5WZWN0b3IoXHJcbiAgICAgICAgICAyICogYS54IC0gKGIueCArIGEueCkgLSAocmVsYXRpdmUgPyBhLnggOiAwKSxcclxuICAgICAgICAgIDIgKiBhLnkgLSAoYi55ICsgYS55KSAtIChyZWxhdGl2ZSA/IGEueSA6IDApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBnZXRBbmNob3JzRnJvbUFyY0RhdGE6IGZ1bmN0aW9uKGNlbnRlciwgeEF4aXNSb3RhdGlvbiwgcngsIHJ5LCB0cywgdGQsIGNjdykge1xyXG5cclxuICAgICAgICB2YXIgbWF0cml4ID0gbmV3IFR3by5NYXRyaXgoKVxyXG4gICAgICAgICAgLnRyYW5zbGF0ZShjZW50ZXIueCwgY2VudGVyLnkpXHJcbiAgICAgICAgICAucm90YXRlKHhBeGlzUm90YXRpb24pO1xyXG5cclxuICAgICAgICB2YXIgbCA9IFR3by5SZXNvbHV0aW9uO1xyXG5cclxuICAgICAgICByZXR1cm4gXy5tYXAoXy5yYW5nZShsKSwgZnVuY3Rpb24oaSkge1xyXG5cclxuICAgICAgICAgIHZhciBwY3QgPSAoaSArIDEpIC8gbDtcclxuICAgICAgICAgIGlmICghIWNjdykge1xyXG4gICAgICAgICAgICBwY3QgPSAxIC0gcGN0O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciB0aGV0YSA9IHBjdCAqIHRkICsgdHM7XHJcbiAgICAgICAgICB2YXIgeCA9IHJ4ICogTWF0aC5jb3ModGhldGEpO1xyXG4gICAgICAgICAgdmFyIHkgPSByeSAqIE1hdGguc2luKHRoZXRhKTtcclxuXHJcbiAgICAgICAgICAvLyB4ICs9IGNlbnRlci54O1xyXG4gICAgICAgICAgLy8geSArPSBjZW50ZXIueTtcclxuXHJcbiAgICAgICAgICB2YXIgYW5jaG9yID0gbmV3IFR3by5BbmNob3IoeCwgeSk7XHJcbiAgICAgICAgICBUd28uQW5jaG9yLkFwcGVuZEN1cnZlUHJvcGVydGllcyhhbmNob3IpO1xyXG4gICAgICAgICAgYW5jaG9yLmNvbW1hbmQgPSBUd28uQ29tbWFuZHMubGluZTtcclxuXHJcbiAgICAgICAgICAvLyBUT0RPOiBDYWxjdWxhdGUgY29udHJvbCBwb2ludHMgaGVyZS4uLlxyXG5cclxuICAgICAgICAgIHJldHVybiBhbmNob3I7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJhdGlvQmV0d2VlbjogZnVuY3Rpb24oQSwgQikge1xyXG5cclxuICAgICAgICByZXR1cm4gKEEueCAqIEIueCArIEEueSAqIEIueSkgLyAoQS5sZW5ndGgoKSAqIEIubGVuZ3RoKCkpO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGFuZ2xlQmV0d2VlbjogZnVuY3Rpb24oQSwgQikge1xyXG5cclxuICAgICAgICB2YXIgZHgsIGR5O1xyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSB7XHJcblxyXG4gICAgICAgICAgZHggPSBhcmd1bWVudHNbMF0gLSBhcmd1bWVudHNbMl07XHJcbiAgICAgICAgICBkeSA9IGFyZ3VtZW50c1sxXSAtIGFyZ3VtZW50c1szXTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gYXRhbjIoZHksIGR4KTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkeCA9IEEueCAtIEIueDtcclxuICAgICAgICBkeSA9IEEueSAtIEIueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGF0YW4yKGR5LCBkeCk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgZGlzdGFuY2VCZXR3ZWVuU3F1YXJlZDogZnVuY3Rpb24ocDEsIHAyKSB7XHJcblxyXG4gICAgICAgIHZhciBkeCA9IHAxLnggLSBwMi54O1xyXG4gICAgICAgIHZhciBkeSA9IHAxLnkgLSBwMi55O1xyXG5cclxuICAgICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgZGlzdGFuY2VCZXR3ZWVuOiBmdW5jdGlvbihwMSwgcDIpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHNxcnQoZGlzdGFuY2VCZXR3ZWVuU3F1YXJlZChwMSwgcDIpKTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBsZXJwOiBmdW5jdGlvbihhLCBiLCB0KSB7XHJcbiAgICAgICAgcmV0dXJuIHQgKiAoYiAtIGEpICsgYTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIEEgcHJldHR5IGZhc3QgdG9GaXhlZCgzKSBhbHRlcm5hdGl2ZVxyXG4gICAgICAvLyBTZWUgaHR0cDovL2pzcGVyZi5jb20vcGFyc2VmbG9hdC10b2ZpeGVkLXZzLW1hdGgtcm91bmQvMThcclxuICAgICAgdG9GaXhlZDogZnVuY3Rpb24odikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHYgKiAxMDAwKSAvIDEwMDA7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBtb2Q6IGZ1bmN0aW9uKHYsIGwpIHtcclxuXHJcbiAgICAgICAgd2hpbGUgKHYgPCAwKSB7XHJcbiAgICAgICAgICB2ICs9IGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdiAlIGw7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEFycmF5IGxpa2UgY29sbGVjdGlvbiB0aGF0IHRyaWdnZXJzIGluc2VydGVkIGFuZCByZW1vdmVkIGV2ZW50c1xyXG4gICAgICAgKiByZW1vdmVkIDogcG9wIC8gc2hpZnQgLyBzcGxpY2VcclxuICAgICAgICogaW5zZXJ0ZWQgOiBwdXNoIC8gdW5zaGlmdCAvIHNwbGljZSAod2l0aCA+IDIgYXJndW1lbnRzKVxyXG4gICAgICAgKi9cclxuICAgICAgQ29sbGVjdGlvbjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIEFycmF5LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50c1swXSAmJiBBcnJheS5pc0FycmF5KGFyZ3VtZW50c1swXSkpIHtcclxuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50c1swXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIEN1c3RvbSBFcnJvciBUaHJvd2luZyBmb3IgVHdvLmpzXHJcblxyXG4gICAgICBFcnJvcjogZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgICAgIHRoaXMubmFtZSA9ICd0d28uanMnO1xyXG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBFdmVudHM6IHtcclxuXHJcbiAgICAgICAgb246IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgICAgdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XHJcbiAgICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1tuYW1lXSB8fCAodGhpcy5fZXZlbnRzW25hbWVdID0gW10pO1xyXG5cclxuICAgICAgICAgIGxpc3QucHVzaChjYWxsYmFjayk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9mZjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgICBpZiAoIXRoaXMuX2V2ZW50cykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICghbmFtZSAmJiAhY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0ge307XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBuYW1lcyA9IG5hbWUgPyBbbmFtZV0gOiBfLmtleXModGhpcy5fZXZlbnRzKTtcclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmFtZSA9IG5hbWVzW2ldO1xyXG4gICAgICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1tuYW1lXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIWxpc3QpIHtcclxuICAgICAgICAgICAgICB2YXIgZXZlbnRzID0gW107XHJcbiAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgayA9IGxpc3QubGVuZ3RoOyBqIDwgazsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBldiA9IGxpc3Rbal07XHJcbiAgICAgICAgICAgICAgICAgIGV2ID0gZXYuY2FsbGJhY2sgPyBldi5jYWxsYmFjayA6IGV2O1xyXG4gICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzLnB1c2goZXYpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IGV2ZW50cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICAgIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcclxuICAgICAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xyXG4gICAgICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXTtcclxuICAgICAgICAgIGlmIChldmVudHMpIHRyaWdnZXIodGhpcywgZXZlbnRzLCBhcmdzKTtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxpc3RlbjogZnVuY3Rpb24gKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgICB2YXIgYm91bmQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgIGlmIChvYmopIHtcclxuICAgICAgICAgICAgdmFyIGV2ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KGJvdW5kLCBhcmd1bWVudHMpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gYWRkIHJlZmVyZW5jZXMgYWJvdXQgdGhlIG9iamVjdCB0aGF0IGFzc2lnbmVkIHRoaXMgbGlzdGVuZXJcclxuICAgICAgICAgICAgZXYub2JqID0gb2JqO1xyXG4gICAgICAgICAgICBldi5uYW1lID0gbmFtZTtcclxuICAgICAgICAgICAgZXYuY2FsbGJhY2sgPSBjYWxsYmFjaztcclxuXHJcbiAgICAgICAgICAgIG9iai5vbihuYW1lLCBldik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGlnbm9yZTogZnVuY3Rpb24gKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgICBvYmoub2ZmKG5hbWUsIGNhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0pXHJcblxyXG4gIH0pO1xyXG5cclxuICBUd28uVXRpbHMuRXZlbnRzLmJpbmQgPSBUd28uVXRpbHMuRXZlbnRzLm9uO1xyXG4gIFR3by5VdGlscy5FdmVudHMudW5iaW5kID0gVHdvLlV0aWxzLkV2ZW50cy5vZmY7XHJcblxyXG4gIHZhciB0cmlnZ2VyID0gZnVuY3Rpb24ob2JqLCBldmVudHMsIGFyZ3MpIHtcclxuICAgIHZhciBtZXRob2Q7XHJcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XHJcbiAgICBjYXNlIDA6XHJcbiAgICAgIG1ldGhvZCA9IGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBldmVudHNbaV0uY2FsbChvYmosIGFyZ3NbMF0pO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgMTpcclxuICAgICAgbWV0aG9kID0gZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGV2ZW50c1tpXS5jYWxsKG9iaiwgYXJnc1swXSwgYXJnc1sxXSk7XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAyOlxyXG4gICAgICBtZXRob2QgPSBmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgZXZlbnRzW2ldLmNhbGwob2JqLCBhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdKTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDM6XHJcbiAgICAgIG1ldGhvZCA9IGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBldmVudHNbaV0uY2FsbChvYmosIGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0sIGFyZ3NbM10pO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIG1ldGhvZCA9IGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBldmVudHNbaV0uYXBwbHkob2JqLCBhcmdzKTtcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIG1ldGhvZChpKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBUd28uVXRpbHMuRXJyb3IucHJvdG90eXBlID0gbmV3IEVycm9yKCk7XHJcbiAgVHdvLlV0aWxzLkVycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFR3by5VdGlscy5FcnJvcjtcclxuXHJcbiAgVHdvLlV0aWxzLkNvbGxlY3Rpb24ucHJvdG90eXBlID0gbmV3IEFycmF5KCk7XHJcbiAgVHdvLlV0aWxzLkNvbGxlY3Rpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHdvLlV0aWxzLkNvbGxlY3Rpb247XHJcblxyXG4gIF8uZXh0ZW5kKFR3by5VdGlscy5Db2xsZWN0aW9uLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIHBvcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBwb3BwZWQgPSBBcnJheS5wcm90b3R5cGUucG9wLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLnJlbW92ZSwgW3BvcHBlZF0pO1xyXG4gICAgICByZXR1cm4gcG9wcGVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaGlmdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzaGlmdGVkID0gQXJyYXkucHJvdG90eXBlLnNoaWZ0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLnJlbW92ZSwgW3NoaWZ0ZWRdKTtcclxuICAgICAgcmV0dXJuIHNoaWZ0ZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHB1c2g6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgcHVzaGVkID0gQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuaW5zZXJ0LCBhcmd1bWVudHMpO1xyXG4gICAgICByZXR1cm4gcHVzaGVkO1xyXG4gICAgfSxcclxuXHJcbiAgICB1bnNoaWZ0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHVuc2hpZnRlZCA9IEFycmF5LnByb3RvdHlwZS51bnNoaWZ0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmluc2VydCwgYXJndW1lbnRzKTtcclxuICAgICAgcmV0dXJuIHVuc2hpZnRlZDtcclxuICAgIH0sXHJcblxyXG4gICAgc3BsaWNlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHNwbGljZWQgPSBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHZhciBpbnNlcnRlZDtcclxuXHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLnJlbW92ZSwgc3BsaWNlZCk7XHJcblxyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICBpbnNlcnRlZCA9IHRoaXMuc2xpY2UoYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMF0gKyBhcmd1bWVudHMubGVuZ3RoIC0gMik7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuaW5zZXJ0LCBpbnNlcnRlZCk7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMub3JkZXIpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBzcGxpY2VkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzb3J0OiBmdW5jdGlvbigpIHtcclxuICAgICAgQXJyYXkucHJvdG90eXBlLnNvcnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMub3JkZXIpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmV2ZXJzZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLm9yZGVyKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICAvLyBMb2NhbGl6ZSB1dGlsc1xyXG5cclxuICB2YXIgZGlzdGFuY2VCZXR3ZWVuID0gVHdvLlV0aWxzLmRpc3RhbmNlQmV0d2VlbixcclxuICAgIGdldEFuY2hvcnNGcm9tQXJjRGF0YSA9IFR3by5VdGlscy5nZXRBbmNob3JzRnJvbUFyY0RhdGEsXHJcbiAgICBkaXN0YW5jZUJldHdlZW5TcXVhcmVkID0gVHdvLlV0aWxzLmRpc3RhbmNlQmV0d2VlblNxdWFyZWQsXHJcbiAgICByYXRpb0JldHdlZW4gPSBUd28uVXRpbHMucmF0aW9CZXR3ZWVuLFxyXG4gICAgYW5nbGVCZXR3ZWVuID0gVHdvLlV0aWxzLmFuZ2xlQmV0d2VlbixcclxuICAgIGdldENvbnRyb2xQb2ludHMgPSBUd28uVXRpbHMuZ2V0Q29udHJvbFBvaW50cyxcclxuICAgIGdldEN1cnZlRnJvbVBvaW50cyA9IFR3by5VdGlscy5nZXRDdXJ2ZUZyb21Qb2ludHMsXHJcbiAgICBzb2x2ZVNlZ21lbnRJbnRlcnNlY3Rpb24gPSBUd28uVXRpbHMuc29sdmVTZWdtZW50SW50ZXJzZWN0aW9uLFxyXG4gICAgZGVjb3VwbGVTaGFwZXMgPSBUd28uVXRpbHMuZGVjb3VwbGVTaGFwZXMsXHJcbiAgICBtb2QgPSBUd28uVXRpbHMubW9kLFxyXG4gICAgZ2V0QmFja2luZ1N0b3JlUmF0aW8gPSBUd28uVXRpbHMuZ2V0QmFja2luZ1N0b3JlUmF0aW8sXHJcbiAgICBnZXRQb2ludE9uQ3ViaWNCZXppZXIgPSBUd28uVXRpbHMuZ2V0UG9pbnRPbkN1YmljQmV6aWVyLFxyXG4gICAgZ2V0Q3VydmVMZW5ndGggPSBUd28uVXRpbHMuZ2V0Q3VydmVMZW5ndGgsXHJcbiAgICBpbnRlZ3JhdGUgPSBUd28uVXRpbHMuaW50ZWdyYXRlLFxyXG4gICAgZ2V0UmVmbGVjdGlvbiA9IFR3by5VdGlscy5nZXRSZWZsZWN0aW9uO1xyXG5cclxuICBfLmV4dGVuZChUd28ucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgYXBwZW5kVG86IGZ1bmN0aW9uKGVsZW0pIHtcclxuXHJcbiAgICAgIGVsZW0uYXBwZW5kQ2hpbGQodGhpcy5yZW5kZXJlci5kb21FbGVtZW50KTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBwbGF5OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIFR3by5VdGlscy5zZXRQbGF5aW5nLmNhbGwodGhpcywgdHJ1ZSk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5wbGF5KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMucGxheWluZyA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMucGF1c2UpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgcG9zaXRpb25zIGFuZCBjYWxjdWxhdGlvbnMgaW4gb25lIHBhc3MgYmVmb3JlIHJlbmRlcmluZy5cclxuICAgICAqL1xyXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBhbmltYXRlZCA9ICEhdGhpcy5fbGFzdEZyYW1lO1xyXG4gICAgICB2YXIgbm93ID0gcGVyZi5ub3coKTtcclxuXHJcbiAgICAgIHRoaXMuZnJhbWVDb3VudCsrO1xyXG5cclxuICAgICAgaWYgKGFuaW1hdGVkKSB7XHJcbiAgICAgICAgdGhpcy50aW1lRGVsdGEgPSBwYXJzZUZsb2F0KChub3cgLSB0aGlzLl9sYXN0RnJhbWUpLnRvRml4ZWQoMykpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX2xhc3RGcmFtZSA9IG5vdztcclxuXHJcbiAgICAgIHZhciB3aWR0aCA9IHRoaXMud2lkdGg7XHJcbiAgICAgIHZhciBoZWlnaHQgPSB0aGlzLmhlaWdodDtcclxuICAgICAgdmFyIHJlbmRlcmVyID0gdGhpcy5yZW5kZXJlcjtcclxuXHJcbiAgICAgIC8vIFVwZGF0ZSB3aWR0aCAvIGhlaWdodCBmb3IgdGhlIHJlbmRlcmVyXHJcbiAgICAgIGlmICh3aWR0aCAhPT0gcmVuZGVyZXIud2lkdGggfHwgaGVpZ2h0ICE9PSByZW5kZXJlci5oZWlnaHQpIHtcclxuICAgICAgICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQsIHRoaXMucmF0aW8pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy51cGRhdGUsIHRoaXMuZnJhbWVDb3VudCwgdGhpcy50aW1lRGVsdGEpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyKCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbmRlciBhbGwgZHJhd2FibGUgLSB2aXNpYmxlIG9iamVjdHMgb2YgdGhlIHNjZW5lLlxyXG4gICAgICovXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXIoKTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLnJlbmRlciwgdGhpcy5mcmFtZUNvdW50KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVuaWVuY2UgTWV0aG9kc1xyXG4gICAgICovXHJcblxyXG4gICAgYWRkOiBmdW5jdGlvbihvKSB7XHJcblxyXG4gICAgICB2YXIgb2JqZWN0cyA9IG87XHJcbiAgICAgIGlmICghKG9iamVjdHMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICBvYmplY3RzID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKG9iamVjdHMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZTogZnVuY3Rpb24obykge1xyXG5cclxuICAgICAgdmFyIG9iamVjdHMgPSBvO1xyXG4gICAgICBpZiAoIShvYmplY3RzIGluc3RhbmNlb2YgQXJyYXkpKSB7XHJcbiAgICAgICAgb2JqZWN0cyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnNjZW5lLnJlbW92ZShvYmplY3RzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5zY2VuZS5yZW1vdmUoXy50b0FycmF5KHRoaXMuc2NlbmUuY2hpbGRyZW4pKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlTGluZTogZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcclxuXHJcbiAgICAgIHZhciBsaW5lID0gbmV3IFR3by5MaW5lKHgxLCB5MSwgeDIsIHkyKTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQobGluZSk7XHJcblxyXG4gICAgICByZXR1cm4gbGluZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VSZWN0YW5nbGU6IGZ1bmN0aW9uKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcclxuXHJcbiAgICAgIHZhciByZWN0ID0gbmV3IFR3by5SZWN0YW5nbGUoeCwgeSwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHJlY3QpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlY3Q7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlUm91bmRlZFJlY3RhbmdsZTogZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCwgc2lkZXMpIHtcclxuXHJcbiAgICAgIHZhciByZWN0ID0gbmV3IFR3by5Sb3VuZGVkUmVjdGFuZ2xlKHgsIHksIHdpZHRoLCBoZWlnaHQsIHNpZGVzKTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQocmVjdCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVjdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VDaXJjbGU6IGZ1bmN0aW9uKG94LCBveSwgcikge1xyXG5cclxuICAgICAgdmFyIGNpcmNsZSA9IG5ldyBUd28uQ2lyY2xlKG94LCBveSwgcik7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGNpcmNsZSk7XHJcblxyXG4gICAgICByZXR1cm4gY2lyY2xlO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUVsbGlwc2U6IGZ1bmN0aW9uKG94LCBveSwgcngsIHJ5KSB7XHJcblxyXG4gICAgICB2YXIgZWxsaXBzZSA9IG5ldyBUd28uRWxsaXBzZShveCwgb3ksIHJ4LCByeSk7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGVsbGlwc2UpO1xyXG5cclxuICAgICAgcmV0dXJuIGVsbGlwc2U7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlU3RhcjogZnVuY3Rpb24ob3gsIG95LCBvciwgaXIsIHNpZGVzKSB7XHJcblxyXG4gICAgICB2YXIgc3RhciA9IG5ldyBUd28uU3RhcihveCwgb3ksIG9yLCBpciwgc2lkZXMpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChzdGFyKTtcclxuXHJcbiAgICAgIHJldHVybiBzdGFyO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUN1cnZlOiBmdW5jdGlvbihwKSB7XHJcblxyXG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGgsIHBvaW50cyA9IHA7XHJcbiAgICAgIGlmICghXy5pc0FycmF5KHApKSB7XHJcbiAgICAgICAgcG9pbnRzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKz0yKSB7XHJcbiAgICAgICAgICB2YXIgeCA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgIGlmICghXy5pc051bWJlcih4KSkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHZhciB5ID0gYXJndW1lbnRzW2kgKyAxXTtcclxuICAgICAgICAgIHBvaW50cy5wdXNoKG5ldyBUd28uQW5jaG9yKHgsIHkpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBsYXN0ID0gYXJndW1lbnRzW2wgLSAxXTtcclxuICAgICAgdmFyIGN1cnZlID0gbmV3IFR3by5QYXRoKHBvaW50cywgIShfLmlzQm9vbGVhbihsYXN0KSA/IGxhc3QgOiB1bmRlZmluZWQpLCB0cnVlKTtcclxuICAgICAgdmFyIHJlY3QgPSBjdXJ2ZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgY3VydmUuY2VudGVyKCkudHJhbnNsYXRpb25cclxuICAgICAgICAuc2V0KHJlY3QubGVmdCArIHJlY3Qud2lkdGggLyAyLCByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMik7XHJcblxyXG4gICAgICB0aGlzLnNjZW5lLmFkZChjdXJ2ZSk7XHJcblxyXG4gICAgICByZXR1cm4gY3VydmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlUG9seWdvbjogZnVuY3Rpb24ob3gsIG95LCByLCBzaWRlcykge1xyXG5cclxuICAgICAgdmFyIHBvbHkgPSBuZXcgVHdvLlBvbHlnb24ob3gsIG95LCByLCBzaWRlcyk7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHBvbHkpO1xyXG5cclxuICAgICAgcmV0dXJuIHBvbHk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKlxyXG4gICAgKiBNYWtlIGFuIEFyYyBTZWdtZW50XHJcbiAgICAqL1xyXG5cclxuICAgIG1ha2VBcmNTZWdtZW50OiBmdW5jdGlvbihveCwgb3ksIGlyLCBvciwgc2EsIGVhLCByZXMpIHtcclxuICAgICAgdmFyIGFyY1NlZ21lbnQgPSBuZXcgVHdvLkFyY1NlZ21lbnQob3gsIG95LCBpciwgb3IsIHNhLCBlYSwgcmVzKTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQoYXJjU2VnbWVudCk7XHJcbiAgICAgIHJldHVybiBhcmNTZWdtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlbmllbmNlIG1ldGhvZCB0byBtYWtlIGFuZCBkcmF3IGEgVHdvLlBhdGguXHJcbiAgICAgKi9cclxuICAgIG1ha2VQYXRoOiBmdW5jdGlvbihwKSB7XHJcblxyXG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGgsIHBvaW50cyA9IHA7XHJcbiAgICAgIGlmICghXy5pc0FycmF5KHApKSB7XHJcbiAgICAgICAgcG9pbnRzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKz0yKSB7XHJcbiAgICAgICAgICB2YXIgeCA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgIGlmICghXy5pc051bWJlcih4KSkge1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHZhciB5ID0gYXJndW1lbnRzW2kgKyAxXTtcclxuICAgICAgICAgIHBvaW50cy5wdXNoKG5ldyBUd28uQW5jaG9yKHgsIHkpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBsYXN0ID0gYXJndW1lbnRzW2wgLSAxXTtcclxuICAgICAgdmFyIHBhdGggPSBuZXcgVHdvLlBhdGgocG9pbnRzLCAhKF8uaXNCb29sZWFuKGxhc3QpID8gbGFzdCA6IHVuZGVmaW5lZCkpO1xyXG4gICAgICB2YXIgcmVjdCA9IHBhdGguZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgIHBhdGguY2VudGVyKCkudHJhbnNsYXRpb25cclxuICAgICAgICAuc2V0KHJlY3QubGVmdCArIHJlY3Qud2lkdGggLyAyLCByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMik7XHJcblxyXG4gICAgICB0aGlzLnNjZW5lLmFkZChwYXRoKTtcclxuXHJcbiAgICAgIHJldHVybiBwYXRoO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gbWFrZSBhbmQgYWRkIGEgVHdvLlRleHQuXHJcbiAgICAgKi9cclxuICAgIG1ha2VUZXh0OiBmdW5jdGlvbihtZXNzYWdlLCB4LCB5LCBzdHlsZXMpIHtcclxuICAgICAgdmFyIHRleHQgPSBuZXcgVHdvLlRleHQobWVzc2FnZSwgeCwgeSwgc3R5bGVzKTtcclxuICAgICAgdGhpcy5hZGQodGV4dCk7XHJcbiAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlbmllbmNlIG1ldGhvZCB0byBtYWtlIGFuZCBhZGQgYSBUd28uTGluZWFyR3JhZGllbnQuXHJcbiAgICAgKi9cclxuICAgIG1ha2VMaW5lYXJHcmFkaWVudDogZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIgLyogc3RvcHMgKi8pIHtcclxuXHJcbiAgICAgIHZhciBzdG9wcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCA0KTtcclxuICAgICAgdmFyIGdyYWRpZW50ID0gbmV3IFR3by5MaW5lYXJHcmFkaWVudCh4MSwgeTEsIHgyLCB5Miwgc3RvcHMpO1xyXG5cclxuICAgICAgdGhpcy5hZGQoZ3JhZGllbnQpO1xyXG5cclxuICAgICAgcmV0dXJuIGdyYWRpZW50O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gbWFrZSBhbmQgYWRkIGEgVHdvLlJhZGlhbEdyYWRpZW50LlxyXG4gICAgICovXHJcbiAgICBtYWtlUmFkaWFsR3JhZGllbnQ6IGZ1bmN0aW9uKHgxLCB5MSwgciAvKiBzdG9wcyAqLykge1xyXG5cclxuICAgICAgdmFyIHN0b3BzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDMpO1xyXG4gICAgICB2YXIgZ3JhZGllbnQgPSBuZXcgVHdvLlJhZGlhbEdyYWRpZW50KHgxLCB5MSwgciwgc3RvcHMpO1xyXG5cclxuICAgICAgdGhpcy5hZGQoZ3JhZGllbnQpO1xyXG5cclxuICAgICAgcmV0dXJuIGdyYWRpZW50O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVNwcml0ZTogZnVuY3Rpb24ocGF0aCwgeCwgeSwgY29scywgcm93cywgZnJhbWVSYXRlLCBhdXRvc3RhcnQpIHtcclxuXHJcbiAgICAgIHZhciBzcHJpdGUgPSBuZXcgVHdvLlNwcml0ZShwYXRoLCB4LCB5LCBjb2xzLCByb3dzLCBmcmFtZVJhdGUpO1xyXG4gICAgICBpZiAoISFhdXRvc3RhcnQpIHtcclxuICAgICAgICBzcHJpdGUucGxheSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuYWRkKHNwcml0ZSk7XHJcblxyXG4gICAgICByZXR1cm4gc3ByaXRlO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUltYWdlU2VxdWVuY2U6IGZ1bmN0aW9uKHBhdGhzLCB4LCB5LCBmcmFtZVJhdGUsIGF1dG9zdGFydCkge1xyXG5cclxuICAgICAgdmFyIGltYWdlU2VxdWVuY2UgPSBuZXcgVHdvLkltYWdlU2VxdWVuY2UocGF0aHMsIHgsIHksIGZyYW1lUmF0ZSk7XHJcbiAgICAgIGlmICghIWF1dG9zdGFydCkge1xyXG4gICAgICAgIGltYWdlU2VxdWVuY2UucGxheSgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuYWRkKGltYWdlU2VxdWVuY2UpO1xyXG5cclxuICAgICAgcmV0dXJuIGltYWdlU2VxdWVuY2U7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlVGV4dHVyZTogZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgIHZhciB0ZXh0dXJlID0gbmV3IFR3by5UZXh0dXJlKHBhdGgsIGNhbGxiYWNrKTtcclxuICAgICAgcmV0dXJuIHRleHR1cmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlR3JvdXA6IGZ1bmN0aW9uKG8pIHtcclxuXHJcbiAgICAgIHZhciBvYmplY3RzID0gbztcclxuICAgICAgaWYgKCEob2JqZWN0cyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgIG9iamVjdHMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGdyb3VwID0gbmV3IFR3by5Hcm91cCgpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChncm91cCk7XHJcbiAgICAgIGdyb3VwLmFkZChvYmplY3RzKTtcclxuXHJcbiAgICAgIHJldHVybiBncm91cDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW50ZXJwcmV0IGFuIFNWRyBOb2RlIGFuZCBhZGQgaXQgdG8gdGhpcyBpbnN0YW5jZSdzIHNjZW5lLiBUaGVcclxuICAgICAqIGRpc3RpbmN0aW9uIHNob3VsZCBiZSBtYWRlIHRoYXQgdGhpcyBkb2Vzbid0IGBpbXBvcnRgIHN2ZydzLCBpdCBzb2xlbHlcclxuICAgICAqIGludGVycHJldHMgdGhlbSBpbnRvIHNvbWV0aGluZyBjb21wYXRpYmxlIGZvciBUd28uanMg4oCUwqB0aGlzIGlzIHNsaWdodGx5XHJcbiAgICAgKiBkaWZmZXJlbnQgdGhhbiBhIGRpcmVjdCB0cmFuc2NyaXB0aW9uLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzdmdOb2RlIC0gVGhlIG5vZGUgdG8gYmUgcGFyc2VkXHJcbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IHNoYWxsb3cgLSBEb24ndCBjcmVhdGUgYSB0b3AtbW9zdCBncm91cCBidXRcclxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBwZW5kIGFsbCBjb250ZW50cyBkaXJlY3RseVxyXG4gICAgICovXHJcbiAgICBpbnRlcnByZXQ6IGZ1bmN0aW9uKHN2Z05vZGUsIHNoYWxsb3cpIHtcclxuXHJcbiAgICAgIHZhciB0YWcgPSBzdmdOb2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgIGlmICghKHRhZyBpbiBUd28uVXRpbHMucmVhZCkpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIG5vZGUgPSBUd28uVXRpbHMucmVhZFt0YWddLmNhbGwodGhpcywgc3ZnTm9kZSk7XHJcblxyXG4gICAgICBpZiAoc2hhbGxvdyAmJiBub2RlIGluc3RhbmNlb2YgVHdvLkdyb3VwKSB7XHJcbiAgICAgICAgdGhpcy5hZGQobm9kZS5jaGlsZHJlbik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5hZGQobm9kZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBub2RlO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMb2FkIGFuIFNWRyBmaWxlIC8gdGV4dCBhbmQgaW50ZXJwcmV0LlxyXG4gICAgICovXHJcbiAgICBsb2FkOiBmdW5jdGlvbih0ZXh0LCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgdmFyIG5vZGVzID0gW10sIGVsZW0sIGk7XHJcblxyXG4gICAgICBpZiAoLy4qXFwuc3ZnL2lnLnRlc3QodGV4dCkpIHtcclxuXHJcbiAgICAgICAgVHdvLlV0aWxzLnhocih0ZXh0LCBfLmJpbmQoZnVuY3Rpb24oZGF0YSkge1xyXG5cclxuICAgICAgICAgIGRvbS50ZW1wLmlubmVySFRNTCA9IGRhdGE7XHJcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZG9tLnRlbXAuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgZWxlbSA9IGRvbS50ZW1wLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgICBub2Rlcy5wdXNoKHRoaXMuaW50ZXJwcmV0KGVsZW0pKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjYWxsYmFjayhub2Rlcy5sZW5ndGggPD0gMSA/IG5vZGVzWzBdIDogbm9kZXMsXHJcbiAgICAgICAgICAgIGRvbS50ZW1wLmNoaWxkcmVuLmxlbmd0aCA8PSAxID8gZG9tLnRlbXAuY2hpbGRyZW5bMF0gOiBkb20udGVtcC5jaGlsZHJlbik7XHJcblxyXG4gICAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBkb20udGVtcC5pbm5lckhUTUwgPSB0ZXh0O1xyXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgZG9tLnRlbXAuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBlbGVtID0gZG9tLnRlbXAuY2hpbGRyZW5baV07XHJcbiAgICAgICAgbm9kZXMucHVzaCh0aGlzLmludGVycHJldChlbGVtKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNhbGxiYWNrKG5vZGVzLmxlbmd0aCA8PSAxID8gbm9kZXNbMF0gOiBub2RlcyxcclxuICAgICAgICBkb20udGVtcC5jaGlsZHJlbi5sZW5ndGggPD0gMSA/IGRvbS50ZW1wLmNoaWxkcmVuWzBdIDogZG9tLnRlbXAuY2hpbGRyZW4pO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgZnVuY3Rpb24gZml0VG9XaW5kb3coKSB7XHJcblxyXG4gICAgdmFyIHdyID0gZG9jdW1lbnQuYm9keS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICB2YXIgd2lkdGggPSB0aGlzLndpZHRoID0gd3Iud2lkdGg7XHJcbiAgICB2YXIgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgPSB3ci5oZWlnaHQ7XHJcblxyXG4gICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQsIHRoaXMucmF0aW8pO1xyXG4gICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMucmVzaXplLCB3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgfVxyXG5cclxuICAvLyBSZXF1ZXN0IEFuaW1hdGlvbiBGcmFtZVxyXG5cclxuICB2YXIgcmFmID0gZG9tLmdldFJlcXVlc3RBbmltYXRpb25GcmFtZSgpO1xyXG5cclxuICBmdW5jdGlvbiBsb29wKCkge1xyXG5cclxuICAgIHJhZihsb29wKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IFR3by5JbnN0YW5jZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIHQgPSBUd28uSW5zdGFuY2VzW2ldO1xyXG4gICAgICBpZiAodC5wbGF5aW5nKSB7XHJcbiAgICAgICAgdC51cGRhdGUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZSgndHdvJywgW10sIGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gVHdvO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFR3bztcclxuICB9XHJcblxyXG4gIHJldHVybiBUd287XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFJlZ2lzdHJ5ID0gVHdvLlJlZ2lzdHJ5ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdGhpcy5tYXAgPSB7fTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoUmVnaXN0cnksIHtcclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFJlZ2lzdHJ5LnByb3RvdHlwZSwge1xyXG5cclxuICAgIGFkZDogZnVuY3Rpb24oaWQsIG9iaikge1xyXG4gICAgICB0aGlzLm1hcFtpZF0gPSBvYmo7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLm1hcFtpZF07XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm1hcFtpZF07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICByZXR1cm4gaWQgaW4gdGhpcy5tYXA7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBWZWN0b3IgPSBUd28uVmVjdG9yID0gZnVuY3Rpb24oeCwgeSkge1xyXG5cclxuICAgIHRoaXMueCA9IHggfHwgMDtcclxuICAgIHRoaXMueSA9IHkgfHwgMDtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoVmVjdG9yLCB7XHJcblxyXG4gICAgemVybzogbmV3IFR3by5WZWN0b3IoKVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoVmVjdG9yLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIHNldDogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICB0aGlzLnggPSB4O1xyXG4gICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgY29weTogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLnggPSB2Lng7XHJcbiAgICAgIHRoaXMueSA9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy54ID0gMDtcclxuICAgICAgdGhpcy55ID0gMDtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54LCB0aGlzLnkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKHYxLCB2Mikge1xyXG4gICAgICB0aGlzLnggPSB2MS54ICsgdjIueDtcclxuICAgICAgdGhpcy55ID0gdjEueSArIHYyLnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRTZWxmOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMueCArPSB2Lng7XHJcbiAgICAgIHRoaXMueSArPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdWI6IGZ1bmN0aW9uKHYxLCB2Mikge1xyXG4gICAgICB0aGlzLnggPSB2MS54IC0gdjIueDtcclxuICAgICAgdGhpcy55ID0gdjEueSAtIHYyLnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdWJTZWxmOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMueCAtPSB2Lng7XHJcbiAgICAgIHRoaXMueSAtPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBtdWx0aXBseVNlbGY6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy54ICo9IHYueDtcclxuICAgICAgdGhpcy55ICo9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG11bHRpcGx5U2NhbGFyOiBmdW5jdGlvbihzKSB7XHJcbiAgICAgIHRoaXMueCAqPSBzO1xyXG4gICAgICB0aGlzLnkgKj0gcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGRpdmlkZVNjYWxhcjogZnVuY3Rpb24ocykge1xyXG4gICAgICBpZiAocykge1xyXG4gICAgICAgIHRoaXMueCAvPSBzO1xyXG4gICAgICAgIHRoaXMueSAvPSBzO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuc2V0KDAsIDApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZWdhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5tdWx0aXBseVNjYWxhcigtMSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvdDogZnVuY3Rpb24odikge1xyXG4gICAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55O1xyXG4gICAgfSxcclxuXHJcbiAgICBsZW5ndGhTcXVhcmVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueTtcclxuICAgIH0sXHJcblxyXG4gICAgbGVuZ3RoOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmxlbmd0aFNxdWFyZWQoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vcm1hbGl6ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRpdmlkZVNjYWxhcih0aGlzLmxlbmd0aCgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGlzdGFuY2VUbzogZnVuY3Rpb24odikge1xyXG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZGlzdGFuY2VUb1NxdWFyZWQodikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkaXN0YW5jZVRvU3F1YXJlZDogZnVuY3Rpb24odikge1xyXG4gICAgICB2YXIgZHggPSB0aGlzLnggLSB2LngsXHJcbiAgICAgICAgICBkeSA9IHRoaXMueSAtIHYueTtcclxuICAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRMZW5ndGg6IGZ1bmN0aW9uKGwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKCkubXVsdGlwbHlTY2FsYXIobCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGVxdWFsczogZnVuY3Rpb24odiwgZXBzKSB7XHJcbiAgICAgIGVwcyA9ICh0eXBlb2YgZXBzID09PSAndW5kZWZpbmVkJykgPyAgMC4wMDAxIDogZXBzO1xyXG4gICAgICByZXR1cm4gKHRoaXMuZGlzdGFuY2VUbyh2KSA8IGVwcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxlcnA6IGZ1bmN0aW9uKHYsIHQpIHtcclxuICAgICAgdmFyIHggPSAodi54IC0gdGhpcy54KSAqIHQgKyB0aGlzLng7XHJcbiAgICAgIHZhciB5ID0gKHYueSAtIHRoaXMueSkgKiB0ICsgdGhpcy55O1xyXG4gICAgICByZXR1cm4gdGhpcy5zZXQoeCwgeSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzWmVybzogZnVuY3Rpb24oZXBzKSB7XHJcbiAgICAgIGVwcyA9ICh0eXBlb2YgZXBzID09PSAndW5kZWZpbmVkJykgPyAgMC4wMDAxIDogZXBzO1xyXG4gICAgICByZXR1cm4gKHRoaXMubGVuZ3RoKCkgPCBlcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnggKyAnLCAnICsgdGhpcy55O1xyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7IHg6IHRoaXMueCwgeTogdGhpcy55IH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJvdGF0ZTogZnVuY3Rpb24gKHJhZGlhbnMpIHtcclxuICAgICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpO1xyXG4gICAgICB2YXIgc2luID0gTWF0aC5zaW4ocmFkaWFucyk7XHJcbiAgICAgIHRoaXMueCA9IHRoaXMueCAqIGNvcyAtIHRoaXMueSAqIHNpbjtcclxuICAgICAgdGhpcy55ID0gdGhpcy54ICogc2luICsgdGhpcy55ICogY29zO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIHZhciBCb3VuZFByb3RvID0ge1xyXG5cclxuICAgIHNldDogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICB0aGlzLl94ID0geDtcclxuICAgICAgdGhpcy5feSA9IHk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb3B5OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMuX3ggPSB2Lng7XHJcbiAgICAgIHRoaXMuX3kgPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX3ggPSAwO1xyXG4gICAgICB0aGlzLl95ID0gMDtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy5feCwgdGhpcy5feSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZDogZnVuY3Rpb24odjEsIHYyKSB7XHJcbiAgICAgIHRoaXMuX3ggPSB2MS54ICsgdjIueDtcclxuICAgICAgdGhpcy5feSA9IHYxLnkgKyB2Mi55O1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkU2VsZjogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLl94ICs9IHYueDtcclxuICAgICAgdGhpcy5feSArPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdWI6IGZ1bmN0aW9uKHYxLCB2Mikge1xyXG4gICAgICB0aGlzLl94ID0gdjEueCAtIHYyLng7XHJcbiAgICAgIHRoaXMuX3kgPSB2MS55IC0gdjIueTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN1YlNlbGY6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy5feCAtPSB2Lng7XHJcbiAgICAgIHRoaXMuX3kgLT0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbXVsdGlwbHlTZWxmOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMuX3ggKj0gdi54O1xyXG4gICAgICB0aGlzLl95ICo9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG11bHRpcGx5U2NhbGFyOiBmdW5jdGlvbihzKSB7XHJcbiAgICAgIHRoaXMuX3ggKj0gcztcclxuICAgICAgdGhpcy5feSAqPSBzO1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGl2aWRlU2NhbGFyOiBmdW5jdGlvbihzKSB7XHJcbiAgICAgIGlmIChzKSB7XHJcbiAgICAgICAgdGhpcy5feCAvPSBzO1xyXG4gICAgICAgIHRoaXMuX3kgLz0gcztcclxuICAgICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcy5jbGVhcigpO1xyXG4gICAgfSxcclxuXHJcbiAgICBuZWdhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5tdWx0aXBseVNjYWxhcigtMSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRvdDogZnVuY3Rpb24odikge1xyXG4gICAgICByZXR1cm4gdGhpcy5feCAqIHYueCArIHRoaXMuX3kgKiB2Lnk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxlbmd0aFNxdWFyZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5feCAqIHRoaXMuX3ggKyB0aGlzLl95ICogdGhpcy5feTtcclxuICAgIH0sXHJcblxyXG4gICAgbGVuZ3RoOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmxlbmd0aFNxdWFyZWQoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vcm1hbGl6ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRpdmlkZVNjYWxhcih0aGlzLmxlbmd0aCgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGlzdGFuY2VUbzogZnVuY3Rpb24odikge1xyXG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZGlzdGFuY2VUb1NxdWFyZWQodikpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkaXN0YW5jZVRvU3F1YXJlZDogZnVuY3Rpb24odikge1xyXG4gICAgICB2YXIgZHggPSB0aGlzLl94IC0gdi54LFxyXG4gICAgICAgICAgZHkgPSB0aGlzLl95IC0gdi55O1xyXG4gICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldExlbmd0aDogZnVuY3Rpb24obCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUoKS5tdWx0aXBseVNjYWxhcihsKTtcclxuICAgIH0sXHJcblxyXG4gICAgZXF1YWxzOiBmdW5jdGlvbih2LCBlcHMpIHtcclxuICAgICAgZXBzID0gKHR5cGVvZiBlcHMgPT09ICd1bmRlZmluZWQnKSA/ICAwLjAwMDEgOiBlcHM7XHJcbiAgICAgIHJldHVybiAodGhpcy5kaXN0YW5jZVRvKHYpIDwgZXBzKTtcclxuICAgIH0sXHJcblxyXG4gICAgbGVycDogZnVuY3Rpb24odiwgdCkge1xyXG4gICAgICB2YXIgeCA9ICh2LnggLSB0aGlzLl94KSAqIHQgKyB0aGlzLl94O1xyXG4gICAgICB2YXIgeSA9ICh2LnkgLSB0aGlzLl95KSAqIHQgKyB0aGlzLl95O1xyXG4gICAgICByZXR1cm4gdGhpcy5zZXQoeCwgeSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzWmVybzogZnVuY3Rpb24oZXBzKSB7XHJcbiAgICAgIGVwcyA9ICh0eXBlb2YgZXBzID09PSAndW5kZWZpbmVkJykgPyAgMC4wMDAxIDogZXBzO1xyXG4gICAgICByZXR1cm4gKHRoaXMubGVuZ3RoKCkgPCBlcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl94ICsgJywgJyArIHRoaXMuX3k7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHsgeDogdGhpcy5feCwgeTogdGhpcy5feSB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByb3RhdGU6IGZ1bmN0aW9uIChyYWRpYW5zKSB7XHJcbiAgICAgIHZhciBjb3MgPSBNYXRoLmNvcyhyYWRpYW5zKTtcclxuICAgICAgdmFyIHNpbiA9IE1hdGguc2luKHJhZGlhbnMpO1xyXG4gICAgICB0aGlzLl94ID0gdGhpcy5feCAqIGNvcyAtIHRoaXMuX3kgKiBzaW47XHJcbiAgICAgIHRoaXMuX3kgPSB0aGlzLl94ICogc2luICsgdGhpcy5feSAqIGNvcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIHZhciB4Z3MgPSB7XHJcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3g7XHJcbiAgICB9LFxyXG4gICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMuX3ggPSB2O1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UsICd4Jyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdmFyIHlncyA9IHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5feTtcclxuICAgIH0sXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy5feSA9IHY7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSwgJ3knKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBPdmVycmlkZSBCYWNrYm9uZSBiaW5kIC8gb24gaW4gb3JkZXIgdG8gYWRkIHByb3Blcmx5IGJyb2FkY2FzdGluZy5cclxuICAgKiBUaGlzIGFsbG93cyBUd28uVmVjdG9yIHRvIG5vdCBicm9hZGNhc3QgZXZlbnRzIHVubGVzcyBldmVudCBsaXN0ZW5lcnNcclxuICAgKiBhcmUgZXhwbGljaXR5IGJvdW5kIHRvIGl0LlxyXG4gICAqL1xyXG5cclxuICBUd28uVmVjdG9yLnByb3RvdHlwZS5iaW5kID0gVHdvLlZlY3Rvci5wcm90b3R5cGUub24gPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBpZiAoIXRoaXMuX2JvdW5kKSB7XHJcbiAgICAgIHRoaXMuX3ggPSB0aGlzLng7XHJcbiAgICAgIHRoaXMuX3kgPSB0aGlzLnk7XHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAneCcsIHhncyk7XHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAneScsIHlncyk7XHJcbiAgICAgIF8uZXh0ZW5kKHRoaXMsIEJvdW5kUHJvdG8pO1xyXG4gICAgICB0aGlzLl9ib3VuZCA9IHRydWU7IC8vIFJlc2VydmVkIGZvciBldmVudCBpbml0aWFsaXphdGlvbiBjaGVja1xyXG4gICAgfVxyXG5cclxuICAgIFR3by5VdGlscy5FdmVudHMuYmluZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG5cclxuICB9O1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgLy8gTG9jYWxpemVkIHZhcmlhYmxlc1xyXG4gIHZhciBjb21tYW5kcyA9IFR3by5Db21tYW5kcztcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgLyoqXHJcbiAgICogQW4gb2JqZWN0IHRoYXQgaG9sZHMgMyBgVHdvLlZlY3RvcmBzLCB0aGUgYW5jaG9yIHBvaW50IGFuZCBpdHNcclxuICAgKiBjb3JyZXNwb25kaW5nIGhhbmRsZXM6IGBsZWZ0YCBhbmQgYHJpZ2h0YC5cclxuICAgKi9cclxuICB2YXIgQW5jaG9yID0gVHdvLkFuY2hvciA9IGZ1bmN0aW9uKHgsIHksIHV4LCB1eSwgdngsIHZ5LCBjb21tYW5kKSB7XHJcblxyXG4gICAgVHdvLlZlY3Rvci5jYWxsKHRoaXMsIHgsIHkpO1xyXG5cclxuICAgIHRoaXMuX2Jyb2FkY2FzdCA9IF8uYmluZChmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuX2NvbW1hbmQgPSBjb21tYW5kIHx8IGNvbW1hbmRzLm1vdmU7XHJcbiAgICB0aGlzLl9yZWxhdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgaWYgKCFjb21tYW5kKSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIEFuY2hvci5BcHBlbmRDdXJ2ZVByb3BlcnRpZXModGhpcyk7XHJcblxyXG4gICAgaWYgKF8uaXNOdW1iZXIodXgpKSB7XHJcbiAgICAgIHRoaXMuY29udHJvbHMubGVmdC54ID0gdXg7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcih1eSkpIHtcclxuICAgICAgdGhpcy5jb250cm9scy5sZWZ0LnkgPSB1eTtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKHZ4KSkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xzLnJpZ2h0LnggPSB2eDtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKHZ5KSkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xzLnJpZ2h0LnkgPSB2eTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoQW5jaG9yLCB7XHJcblxyXG4gICAgQXBwZW5kQ3VydmVQcm9wZXJ0aWVzOiBmdW5jdGlvbihhbmNob3IpIHtcclxuICAgICAgYW5jaG9yLmNvbnRyb2xzID0ge1xyXG4gICAgICAgIGxlZnQ6IG5ldyBUd28uVmVjdG9yKDAsIDApLFxyXG4gICAgICAgIHJpZ2h0OiBuZXcgVHdvLlZlY3RvcigwLCAwKVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgdmFyIEFuY2hvclByb3RvID0ge1xyXG5cclxuICAgIGxpc3RlbjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAoIV8uaXNPYmplY3QodGhpcy5jb250cm9scykpIHtcclxuICAgICAgICBBbmNob3IuQXBwZW5kQ3VydmVQcm9wZXJ0aWVzKHRoaXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmNvbnRyb2xzLmxlZnQuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fYnJvYWRjYXN0KTtcclxuICAgICAgdGhpcy5jb250cm9scy5yaWdodC5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9icm9hZGNhc3QpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBpZ25vcmU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5jb250cm9scy5sZWZ0LnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fYnJvYWRjYXN0KTtcclxuICAgICAgdGhpcy5jb250cm9scy5yaWdodC51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX2Jyb2FkY2FzdCk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBjb250cm9scyA9IHRoaXMuY29udHJvbHM7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgVHdvLkFuY2hvcihcclxuICAgICAgICB0aGlzLngsXHJcbiAgICAgICAgdGhpcy55LFxyXG4gICAgICAgIGNvbnRyb2xzICYmIGNvbnRyb2xzLmxlZnQueCxcclxuICAgICAgICBjb250cm9scyAmJiBjb250cm9scy5sZWZ0LnksXHJcbiAgICAgICAgY29udHJvbHMgJiYgY29udHJvbHMucmlnaHQueCxcclxuICAgICAgICBjb250cm9scyAmJiBjb250cm9scy5yaWdodC55LFxyXG4gICAgICAgIHRoaXMuY29tbWFuZFxyXG4gICAgICApO1xyXG4gICAgICBjbG9uZS5yZWxhdGl2ZSA9IHRoaXMuX3JlbGF0aXZlO1xyXG4gICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBvID0ge1xyXG4gICAgICAgIHg6IHRoaXMueCxcclxuICAgICAgICB5OiB0aGlzLnlcclxuICAgICAgfTtcclxuICAgICAgaWYgKHRoaXMuX2NvbW1hbmQpIHtcclxuICAgICAgICBvLmNvbW1hbmQgPSB0aGlzLl9jb21tYW5kO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgIG8ucmVsYXRpdmUgPSB0aGlzLl9yZWxhdGl2ZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5jb250cm9scykge1xyXG4gICAgICAgIG8uY29udHJvbHMgPSB7XHJcbiAgICAgICAgICBsZWZ0OiB0aGlzLmNvbnRyb2xzLmxlZnQudG9PYmplY3QoKSxcclxuICAgICAgICAgIHJpZ2h0OiB0aGlzLmNvbnRyb2xzLnJpZ2h0LnRvT2JqZWN0KClcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICghdGhpcy5jb250cm9scykge1xyXG4gICAgICAgIHJldHVybiBbdGhpcy5feCwgdGhpcy5feV0uam9pbignLCAnKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gW3RoaXMuX3gsIHRoaXMuX3ksIHRoaXMuY29udHJvbHMubGVmdC54LCB0aGlzLmNvbnRyb2xzLmxlZnQueSxcclxuICAgICAgICB0aGlzLmNvbnRyb2xzLnJpZ2h0LngsIHRoaXMuY29udHJvbHMucmlnaHQueV0uam9pbignLCAnKTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFuY2hvci5wcm90b3R5cGUsICdjb21tYW5kJywge1xyXG5cclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2NvbW1hbmQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldDogZnVuY3Rpb24oYykge1xyXG4gICAgICB0aGlzLl9jb21tYW5kID0gYztcclxuICAgICAgaWYgKHRoaXMuX2NvbW1hbmQgPT09IGNvbW1hbmRzLmN1cnZlICYmICFfLmlzT2JqZWN0KHRoaXMuY29udHJvbHMpKSB7XHJcbiAgICAgICAgQW5jaG9yLkFwcGVuZEN1cnZlUHJvcGVydGllcyh0aGlzKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBbmNob3IucHJvdG90eXBlLCAncmVsYXRpdmUnLCB7XHJcblxyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fcmVsYXRpdmU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldDogZnVuY3Rpb24oYikge1xyXG4gICAgICBpZiAodGhpcy5fcmVsYXRpdmUgPT0gYikge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuX3JlbGF0aXZlID0gISFiO1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKEFuY2hvci5wcm90b3R5cGUsIFR3by5WZWN0b3IucHJvdG90eXBlLCBBbmNob3JQcm90byk7XHJcblxyXG4gIC8vIE1ha2UgaXQgcG9zc2libGUgdG8gYmluZCBhbmQgc3RpbGwgaGF2ZSB0aGUgQW5jaG9yIHNwZWNpZmljXHJcbiAgLy8gaW5oZXJpdGFuY2UgZnJvbSBUd28uVmVjdG9yXHJcbiAgVHdvLkFuY2hvci5wcm90b3R5cGUuYmluZCA9IFR3by5BbmNob3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICBUd28uVmVjdG9yLnByb3RvdHlwZS5iaW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBfLmV4dGVuZCh0aGlzLCBBbmNob3JQcm90byk7XHJcbiAgfTtcclxuXHJcbiAgVHdvLkFuY2hvci5wcm90b3R5cGUudW5iaW5kID0gVHdvLkFuY2hvci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oKSB7XHJcbiAgICBUd28uVmVjdG9yLnByb3RvdHlwZS51bmJpbmQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIF8uZXh0ZW5kKHRoaXMsIEFuY2hvclByb3RvKTtcclxuICB9O1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RhbnRzXHJcbiAgICovXHJcbiAgdmFyIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbiwgdGFuID0gTWF0aC50YW47XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIC8qKlxyXG4gICAqIFR3by5NYXRyaXggY29udGFpbnMgYW4gYXJyYXkgb2YgZWxlbWVudHMgdGhhdCByZXByZXNlbnRcclxuICAgKiB0aGUgdHdvIGRpbWVuc2lvbmFsIDMgeCAzIG1hdHJpeCBhcyBpbGx1c3RyYXRlZCBiZWxvdzpcclxuICAgKlxyXG4gICAqID09PT09XHJcbiAgICogYSBiIGNcclxuICAgKiBkIGUgZlxyXG4gICAqIGcgaCBpICAvLyB0aGlzIHJvdyBpcyBub3QgcmVhbGx5IHVzZWQgaW4gMmQgdHJhbnNmb3JtYXRpb25zXHJcbiAgICogPT09PT1cclxuICAgKlxyXG4gICAqIFN0cmluZyBvcmRlciBpcyBmb3IgdHJhbnNmb3JtIHN0cmluZ3M6IGEsIGQsIGIsIGUsIGMsIGZcclxuICAgKlxyXG4gICAqIEBjbGFzc1xyXG4gICAqL1xyXG4gIHZhciBNYXRyaXggPSBUd28uTWF0cml4ID0gZnVuY3Rpb24oYSwgYiwgYywgZCwgZSwgZikge1xyXG5cclxuICAgIHRoaXMuZWxlbWVudHMgPSBuZXcgVHdvLkFycmF5KDkpO1xyXG5cclxuICAgIHZhciBlbGVtZW50cyA9IGE7XHJcbiAgICBpZiAoIV8uaXNBcnJheShlbGVtZW50cykpIHtcclxuICAgICAgZWxlbWVudHMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbml0aWFsaXplIHRoZSBlbGVtZW50cyB3aXRoIGRlZmF1bHQgdmFsdWVzLlxyXG5cclxuICAgIHRoaXMuaWRlbnRpdHkoKS5zZXQoZWxlbWVudHMpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChNYXRyaXgsIHtcclxuXHJcbiAgICBJZGVudGl0eTogW1xyXG4gICAgICAxLCAwLCAwLFxyXG4gICAgICAwLCAxLCAwLFxyXG4gICAgICAwLCAwLCAxXHJcbiAgICBdLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTXVsdGlwbHkgdHdvIG1hdHJpeCAzeDMgYXJyYXlzXHJcbiAgICAgKi9cclxuICAgIE11bHRpcGx5OiBmdW5jdGlvbihBLCBCLCBDKSB7XHJcblxyXG4gICAgICBpZiAoQi5sZW5ndGggPD0gMykgeyAvLyBNdWx0aXBseSBWZWN0b3JcclxuXHJcbiAgICAgICAgdmFyIHgsIHksIHosIGUgPSBBO1xyXG5cclxuICAgICAgICB2YXIgYSA9IEJbMF0gfHwgMCxcclxuICAgICAgICAgICAgYiA9IEJbMV0gfHwgMCxcclxuICAgICAgICAgICAgYyA9IEJbMl0gfHwgMDtcclxuXHJcbiAgICAgICAgLy8gR28gZG93biByb3dzIGZpcnN0XHJcbiAgICAgICAgLy8gYSwgZCwgZywgYiwgZSwgaCwgYywgZiwgaVxyXG5cclxuICAgICAgICB4ID0gZVswXSAqIGEgKyBlWzFdICogYiArIGVbMl0gKiBjO1xyXG4gICAgICAgIHkgPSBlWzNdICogYSArIGVbNF0gKiBiICsgZVs1XSAqIGM7XHJcbiAgICAgICAgeiA9IGVbNl0gKiBhICsgZVs3XSAqIGIgKyBlWzhdICogYztcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgeDogeCwgeTogeSwgejogeiB9O1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIEEwID0gQVswXSwgQTEgPSBBWzFdLCBBMiA9IEFbMl07XHJcbiAgICAgIHZhciBBMyA9IEFbM10sIEE0ID0gQVs0XSwgQTUgPSBBWzVdO1xyXG4gICAgICB2YXIgQTYgPSBBWzZdLCBBNyA9IEFbN10sIEE4ID0gQVs4XTtcclxuXHJcbiAgICAgIHZhciBCMCA9IEJbMF0sIEIxID0gQlsxXSwgQjIgPSBCWzJdO1xyXG4gICAgICB2YXIgQjMgPSBCWzNdLCBCNCA9IEJbNF0sIEI1ID0gQls1XTtcclxuICAgICAgdmFyIEI2ID0gQls2XSwgQjcgPSBCWzddLCBCOCA9IEJbOF07XHJcblxyXG4gICAgICBDID0gQyB8fCBuZXcgVHdvLkFycmF5KDkpO1xyXG5cclxuICAgICAgQ1swXSA9IEEwICogQjAgKyBBMSAqIEIzICsgQTIgKiBCNjtcclxuICAgICAgQ1sxXSA9IEEwICogQjEgKyBBMSAqIEI0ICsgQTIgKiBCNztcclxuICAgICAgQ1syXSA9IEEwICogQjIgKyBBMSAqIEI1ICsgQTIgKiBCODtcclxuICAgICAgQ1szXSA9IEEzICogQjAgKyBBNCAqIEIzICsgQTUgKiBCNjtcclxuICAgICAgQ1s0XSA9IEEzICogQjEgKyBBNCAqIEI0ICsgQTUgKiBCNztcclxuICAgICAgQ1s1XSA9IEEzICogQjIgKyBBNCAqIEI1ICsgQTUgKiBCODtcclxuICAgICAgQ1s2XSA9IEE2ICogQjAgKyBBNyAqIEIzICsgQTggKiBCNjtcclxuICAgICAgQ1s3XSA9IEE2ICogQjEgKyBBNyAqIEI0ICsgQTggKiBCNztcclxuICAgICAgQ1s4XSA9IEE2ICogQjIgKyBBNyAqIEI1ICsgQTggKiBCODtcclxuXHJcbiAgICAgIHJldHVybiBDO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKE1hdHJpeC5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRha2VzIGFuIGFycmF5IG9mIGVsZW1lbnRzIG9yIHRoZSBhcmd1bWVudHMgbGlzdCBpdHNlbGYgdG9cclxuICAgICAqIHNldCBhbmQgdXBkYXRlIHRoZSBjdXJyZW50IG1hdHJpeCdzIGVsZW1lbnRzLiBPbmx5IHVwZGF0ZXNcclxuICAgICAqIHNwZWNpZmllZCB2YWx1ZXMuXHJcbiAgICAgKi9cclxuICAgIHNldDogZnVuY3Rpb24oYSkge1xyXG5cclxuICAgICAgdmFyIGVsZW1lbnRzID0gYTtcclxuICAgICAgaWYgKCFfLmlzQXJyYXkoZWxlbWVudHMpKSB7XHJcbiAgICAgICAgZWxlbWVudHMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgXy5leHRlbmQodGhpcy5lbGVtZW50cywgZWxlbWVudHMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFR1cm4gbWF0cml4IHRvIGlkZW50aXR5LCBsaWtlIHJlc2V0dGluZy5cclxuICAgICAqL1xyXG4gICAgaWRlbnRpdHk6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5zZXQoTWF0cml4LklkZW50aXR5KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNdWx0aXBseSBzY2FsYXIgb3IgbXVsdGlwbHkgYnkgYW5vdGhlciBtYXRyaXguXHJcbiAgICAgKi9cclxuICAgIG11bHRpcGx5OiBmdW5jdGlvbihhLCBiLCBjLCBkLCBlLCBmLCBnLCBoLCBpKSB7XHJcblxyXG4gICAgICB2YXIgZWxlbWVudHMgPSBhcmd1bWVudHMsIGwgPSBlbGVtZW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAvLyBNdWx0aXBseSBzY2FsYXJcclxuXHJcbiAgICAgIGlmIChsIDw9IDEpIHtcclxuXHJcbiAgICAgICAgXy5lYWNoKHRoaXMuZWxlbWVudHMsIGZ1bmN0aW9uKHYsIGkpIHtcclxuICAgICAgICAgIHRoaXMuZWxlbWVudHNbaV0gPSB2ICogYTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobCA8PSAzKSB7IC8vIE11bHRpcGx5IFZlY3RvclxyXG5cclxuICAgICAgICB2YXIgeCwgeSwgejtcclxuICAgICAgICBhID0gYSB8fCAwO1xyXG4gICAgICAgIGIgPSBiIHx8IDA7XHJcbiAgICAgICAgYyA9IGMgfHwgMDtcclxuICAgICAgICBlID0gdGhpcy5lbGVtZW50cztcclxuXHJcbiAgICAgICAgLy8gR28gZG93biByb3dzIGZpcnN0XHJcbiAgICAgICAgLy8gYSwgZCwgZywgYiwgZSwgaCwgYywgZiwgaVxyXG5cclxuICAgICAgICB4ID0gZVswXSAqIGEgKyBlWzFdICogYiArIGVbMl0gKiBjO1xyXG4gICAgICAgIHkgPSBlWzNdICogYSArIGVbNF0gKiBiICsgZVs1XSAqIGM7XHJcbiAgICAgICAgeiA9IGVbNl0gKiBhICsgZVs3XSAqIGIgKyBlWzhdICogYztcclxuXHJcbiAgICAgICAgcmV0dXJuIHsgeDogeCwgeTogeSwgejogeiB9O1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTXVsdGlwbGUgbWF0cml4XHJcblxyXG4gICAgICB2YXIgQSA9IHRoaXMuZWxlbWVudHM7XHJcbiAgICAgIHZhciBCID0gZWxlbWVudHM7XHJcblxyXG4gICAgICB2YXIgQTAgPSBBWzBdLCBBMSA9IEFbMV0sIEEyID0gQVsyXTtcclxuICAgICAgdmFyIEEzID0gQVszXSwgQTQgPSBBWzRdLCBBNSA9IEFbNV07XHJcbiAgICAgIHZhciBBNiA9IEFbNl0sIEE3ID0gQVs3XSwgQTggPSBBWzhdO1xyXG5cclxuICAgICAgdmFyIEIwID0gQlswXSwgQjEgPSBCWzFdLCBCMiA9IEJbMl07XHJcbiAgICAgIHZhciBCMyA9IEJbM10sIEI0ID0gQls0XSwgQjUgPSBCWzVdO1xyXG4gICAgICB2YXIgQjYgPSBCWzZdLCBCNyA9IEJbN10sIEI4ID0gQls4XTtcclxuXHJcbiAgICAgIHRoaXMuZWxlbWVudHNbMF0gPSBBMCAqIEIwICsgQTEgKiBCMyArIEEyICogQjY7XHJcbiAgICAgIHRoaXMuZWxlbWVudHNbMV0gPSBBMCAqIEIxICsgQTEgKiBCNCArIEEyICogQjc7XHJcbiAgICAgIHRoaXMuZWxlbWVudHNbMl0gPSBBMCAqIEIyICsgQTEgKiBCNSArIEEyICogQjg7XHJcblxyXG4gICAgICB0aGlzLmVsZW1lbnRzWzNdID0gQTMgKiBCMCArIEE0ICogQjMgKyBBNSAqIEI2O1xyXG4gICAgICB0aGlzLmVsZW1lbnRzWzRdID0gQTMgKiBCMSArIEE0ICogQjQgKyBBNSAqIEI3O1xyXG4gICAgICB0aGlzLmVsZW1lbnRzWzVdID0gQTMgKiBCMiArIEE0ICogQjUgKyBBNSAqIEI4O1xyXG5cclxuICAgICAgdGhpcy5lbGVtZW50c1s2XSA9IEE2ICogQjAgKyBBNyAqIEIzICsgQTggKiBCNjtcclxuICAgICAgdGhpcy5lbGVtZW50c1s3XSA9IEE2ICogQjEgKyBBNyAqIEI0ICsgQTggKiBCNztcclxuICAgICAgdGhpcy5lbGVtZW50c1s4XSA9IEE2ICogQjIgKyBBNyAqIEI1ICsgQTggKiBCODtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgaW52ZXJzZTogZnVuY3Rpb24ob3V0KSB7XHJcblxyXG4gICAgICB2YXIgYSA9IHRoaXMuZWxlbWVudHM7XHJcbiAgICAgIG91dCA9IG91dCB8fCBuZXcgVHdvLk1hdHJpeCgpO1xyXG5cclxuICAgICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl07XHJcbiAgICAgIHZhciBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdO1xyXG4gICAgICB2YXIgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XTtcclxuXHJcbiAgICAgIHZhciBiMDEgPSBhMjIgKiBhMTEgLSBhMTIgKiBhMjE7XHJcbiAgICAgIHZhciBiMTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xyXG4gICAgICB2YXIgYjIxID0gYTIxICogYTEwIC0gYTExICogYTIwO1xyXG5cclxuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxyXG4gICAgICB2YXIgZGV0ID0gYTAwICogYjAxICsgYTAxICogYjExICsgYTAyICogYjIxO1xyXG5cclxuICAgICAgaWYgKCFkZXQpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgZGV0ID0gMS4wIC8gZGV0O1xyXG5cclxuICAgICAgb3V0LmVsZW1lbnRzWzBdID0gYjAxICogZGV0O1xyXG4gICAgICBvdXQuZWxlbWVudHNbMV0gPSAoLWEyMiAqIGEwMSArIGEwMiAqIGEyMSkgKiBkZXQ7XHJcbiAgICAgIG91dC5lbGVtZW50c1syXSA9IChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpICogZGV0O1xyXG4gICAgICBvdXQuZWxlbWVudHNbM10gPSBiMTEgKiBkZXQ7XHJcbiAgICAgIG91dC5lbGVtZW50c1s0XSA9IChhMjIgKiBhMDAgLSBhMDIgKiBhMjApICogZGV0O1xyXG4gICAgICBvdXQuZWxlbWVudHNbNV0gPSAoLWExMiAqIGEwMCArIGEwMiAqIGExMCkgKiBkZXQ7XHJcbiAgICAgIG91dC5lbGVtZW50c1s2XSA9IGIyMSAqIGRldDtcclxuICAgICAgb3V0LmVsZW1lbnRzWzddID0gKC1hMjEgKiBhMDAgKyBhMDEgKiBhMjApICogZGV0O1xyXG4gICAgICBvdXQuZWxlbWVudHNbOF0gPSAoYTExICogYTAwIC0gYTAxICogYTEwKSAqIGRldDtcclxuXHJcbiAgICAgIHJldHVybiBvdXQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCBhIHNjYWxhciBvbnRvIHRoZSBtYXRyaXguXHJcbiAgICAgKi9cclxuICAgIHNjYWxlOiBmdW5jdGlvbihzeCwgc3kpIHtcclxuXHJcbiAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgICAgaWYgKGwgPD0gMSkge1xyXG4gICAgICAgIHN5ID0gc3g7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KHN4LCAwLCAwLCAwLCBzeSwgMCwgMCwgMCwgMSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJvdGF0ZSB0aGUgbWF0cml4LlxyXG4gICAgICovXHJcbiAgICByb3RhdGU6IGZ1bmN0aW9uKHJhZGlhbnMpIHtcclxuXHJcbiAgICAgIHZhciBjID0gY29zKHJhZGlhbnMpO1xyXG4gICAgICB2YXIgcyA9IHNpbihyYWRpYW5zKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KGMsIC1zLCAwLCBzLCBjLCAwLCAwLCAwLCAxKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhbnNsYXRlIHRoZSBtYXRyaXguXHJcbiAgICAgKi9cclxuICAgIHRyYW5zbGF0ZTogZnVuY3Rpb24oeCwgeSkge1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkoMSwgMCwgeCwgMCwgMSwgeSwgMCwgMCwgMSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKlxyXG4gICAgICogU2tldyB0aGUgbWF0cml4IGJ5IGFuIGFuZ2xlIGluIHRoZSB4IGF4aXMgZGlyZWN0aW9uLlxyXG4gICAgICovXHJcbiAgICBza2V3WDogZnVuY3Rpb24ocmFkaWFucykge1xyXG5cclxuICAgICAgdmFyIGEgPSB0YW4ocmFkaWFucyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5tdWx0aXBseSgxLCBhLCAwLCAwLCAxLCAwLCAwLCAwLCAxKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBTa2V3IHRoZSBtYXRyaXggYnkgYW4gYW5nbGUgaW4gdGhlIHkgYXhpcyBkaXJlY3Rpb24uXHJcbiAgICAgKi9cclxuICAgIHNrZXdZOiBmdW5jdGlvbihyYWRpYW5zKSB7XHJcblxyXG4gICAgICB2YXIgYSA9IHRhbihyYWRpYW5zKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KDEsIDAsIDAsIGEsIDEsIDAsIDAsIDAsIDEpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSB0cmFuc2Zvcm0gc3RyaW5nIHRvIGJlIHVzZWQgd2l0aCByZW5kZXJpbmcgYXBpcy5cclxuICAgICAqL1xyXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKGZ1bGxNYXRyaXgpIHtcclxuICAgICAgdmFyIHRlbXAgPSBbXTtcclxuXHJcbiAgICAgIHRoaXMudG9BcnJheShmdWxsTWF0cml4LCB0ZW1wKTtcclxuXHJcbiAgICAgIHJldHVybiB0ZW1wLmpvaW4oJyAnKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGEgdHJhbnNmb3JtIGFycmF5IHRvIGJlIHVzZWQgd2l0aCByZW5kZXJpbmcgYXBpcy5cclxuICAgICAqL1xyXG4gICAgdG9BcnJheTogZnVuY3Rpb24oZnVsbE1hdHJpeCwgb3V0cHV0KSB7XHJcblxyXG4gICAgIHZhciBlbGVtZW50cyA9IHRoaXMuZWxlbWVudHM7XHJcbiAgICAgdmFyIGhhc091dHB1dCA9ICEhb3V0cHV0O1xyXG5cclxuICAgICB2YXIgYSA9IHBhcnNlRmxvYXQoZWxlbWVudHNbMF0udG9GaXhlZCgzKSk7XHJcbiAgICAgdmFyIGIgPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzFdLnRvRml4ZWQoMykpO1xyXG4gICAgIHZhciBjID0gcGFyc2VGbG9hdChlbGVtZW50c1syXS50b0ZpeGVkKDMpKTtcclxuICAgICB2YXIgZCA9IHBhcnNlRmxvYXQoZWxlbWVudHNbM10udG9GaXhlZCgzKSk7XHJcbiAgICAgdmFyIGUgPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzRdLnRvRml4ZWQoMykpO1xyXG4gICAgIHZhciBmID0gcGFyc2VGbG9hdChlbGVtZW50c1s1XS50b0ZpeGVkKDMpKTtcclxuXHJcbiAgICAgIGlmICghIWZ1bGxNYXRyaXgpIHtcclxuXHJcbiAgICAgICAgdmFyIGcgPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzZdLnRvRml4ZWQoMykpO1xyXG4gICAgICAgIHZhciBoID0gcGFyc2VGbG9hdChlbGVtZW50c1s3XS50b0ZpeGVkKDMpKTtcclxuICAgICAgICB2YXIgaSA9IHBhcnNlRmxvYXQoZWxlbWVudHNbOF0udG9GaXhlZCgzKSk7XHJcblxyXG4gICAgICAgIGlmIChoYXNPdXRwdXQpIHtcclxuICAgICAgICAgIG91dHB1dFswXSA9IGE7XHJcbiAgICAgICAgICBvdXRwdXRbMV0gPSBkO1xyXG4gICAgICAgICAgb3V0cHV0WzJdID0gZztcclxuICAgICAgICAgIG91dHB1dFszXSA9IGI7XHJcbiAgICAgICAgICBvdXRwdXRbNF0gPSBlO1xyXG4gICAgICAgICAgb3V0cHV0WzVdID0gaDtcclxuICAgICAgICAgIG91dHB1dFs2XSA9IGM7XHJcbiAgICAgICAgICBvdXRwdXRbN10gPSBmO1xyXG4gICAgICAgICAgb3V0cHV0WzhdID0gaTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICBhLCBkLCBnLCBiLCBlLCBoLCBjLCBmLCBpXHJcbiAgICAgICAgXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGhhc091dHB1dCkge1xyXG4gICAgICAgIG91dHB1dFswXSA9IGE7XHJcbiAgICAgICAgb3V0cHV0WzFdID0gZDtcclxuICAgICAgICBvdXRwdXRbMl0gPSBiO1xyXG4gICAgICAgIG91dHB1dFszXSA9IGU7XHJcbiAgICAgICAgb3V0cHV0WzRdID0gYztcclxuICAgICAgICBvdXRwdXRbNV0gPSBmO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIFtcclxuICAgICAgICBhLCBkLCBiLCBlLCBjLCBmICAvLyBTcGVjaWZpYyBmb3JtYXQgc2VlIExOOjE5XHJcbiAgICAgIF07XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENsb25lIHRoZSBjdXJyZW50IG1hdHJpeC5cclxuICAgICAqL1xyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYSwgYiwgYywgZCwgZSwgZiwgZywgaCwgaTtcclxuXHJcbiAgICAgIGEgPSB0aGlzLmVsZW1lbnRzWzBdO1xyXG4gICAgICBiID0gdGhpcy5lbGVtZW50c1sxXTtcclxuICAgICAgYyA9IHRoaXMuZWxlbWVudHNbMl07XHJcbiAgICAgIGQgPSB0aGlzLmVsZW1lbnRzWzNdO1xyXG4gICAgICBlID0gdGhpcy5lbGVtZW50c1s0XTtcclxuICAgICAgZiA9IHRoaXMuZWxlbWVudHNbNV07XHJcbiAgICAgIGcgPSB0aGlzLmVsZW1lbnRzWzZdO1xyXG4gICAgICBoID0gdGhpcy5lbGVtZW50c1s3XTtcclxuICAgICAgaSA9IHRoaXMuZWxlbWVudHNbOF07XHJcblxyXG4gICAgICByZXR1cm4gbmV3IFR3by5NYXRyaXgoYSwgYiwgYywgZCwgZSwgZiwgZywgaCwgaSk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIC8vIExvY2FsaXplIHZhcmlhYmxlc1xyXG4gIHZhciBtb2QgPSBUd28uVXRpbHMubW9kLCB0b0ZpeGVkID0gVHdvLlV0aWxzLnRvRml4ZWQ7XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBzdmcgPSB7XHJcblxyXG4gICAgdmVyc2lvbjogMS4xLFxyXG5cclxuICAgIG5zOiAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLFxyXG4gICAgeGxpbms6ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyxcclxuXHJcbiAgICBhbGlnbm1lbnRzOiB7XHJcbiAgICAgIGxlZnQ6ICdzdGFydCcsXHJcbiAgICAgIGNlbnRlcjogJ21pZGRsZScsXHJcbiAgICAgIHJpZ2h0OiAnZW5kJ1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhbiBzdmcgbmFtZXNwYWNlZCBlbGVtZW50LlxyXG4gICAgICovXHJcbiAgICBjcmVhdGVFbGVtZW50OiBmdW5jdGlvbihuYW1lLCBhdHRycykge1xyXG4gICAgICB2YXIgdGFnID0gbmFtZTtcclxuICAgICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoc3ZnLm5zLCB0YWcpO1xyXG4gICAgICBpZiAodGFnID09PSAnc3ZnJykge1xyXG4gICAgICAgIGF0dHJzID0gXy5kZWZhdWx0cyhhdHRycyB8fCB7fSwge1xyXG4gICAgICAgICAgdmVyc2lvbjogc3ZnLnZlcnNpb25cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIV8uaXNFbXB0eShhdHRycykpIHtcclxuICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyhlbGVtLCBhdHRycyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGVsZW07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIGF0dHJpYnV0ZXMgZnJvbSBhbiBzdmcgZWxlbWVudC5cclxuICAgICAqL1xyXG4gICAgc2V0QXR0cmlidXRlczogZnVuY3Rpb24oZWxlbSwgYXR0cnMpIHtcclxuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhdHRycyk7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICgvaHJlZi8udGVzdChrZXlzW2ldKSkge1xyXG4gICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGVOUyhzdmcueGxpbmssIGtleXNbaV0sIGF0dHJzW2tleXNbaV1dKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoa2V5c1tpXSwgYXR0cnNba2V5c1tpXV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgYXR0cmlidXRlcyBmcm9tIGFuIHN2ZyBlbGVtZW50LlxyXG4gICAgICovXHJcbiAgICByZW1vdmVBdHRyaWJ1dGVzOiBmdW5jdGlvbihlbGVtLCBhdHRycykge1xyXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcclxuICAgICAgICBlbGVtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFR1cm4gYSBzZXQgb2YgdmVydGljZXMgaW50byBhIHN0cmluZyBmb3IgdGhlIGQgcHJvcGVydHkgb2YgYSBwYXRoXHJcbiAgICAgKiBlbGVtZW50LiBJdCBpcyBpbXBlcmF0aXZlIHRoYXQgdGhlIHN0cmluZyBjb2xsYXRpb24gaXMgYXMgZmFzdCBhc1xyXG4gICAgICogcG9zc2libGUsIGJlY2F1c2UgdGhpcyBjYWxsIHdpbGwgYmUgaGFwcGVuaW5nIG11bHRpcGxlIHRpbWVzIGFcclxuICAgICAqIHNlY29uZC5cclxuICAgICAqL1xyXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKHBvaW50cywgY2xvc2VkKSB7XHJcblxyXG4gICAgICB2YXIgbCA9IHBvaW50cy5sZW5ndGgsXHJcbiAgICAgICAgbGFzdCA9IGwgLSAxLFxyXG4gICAgICAgIGQsIC8vIFRoZSBlbHVzaXZlIGxhc3QgVHdvLkNvbW1hbmRzLm1vdmUgcG9pbnRcclxuICAgICAgICByZXQgPSAnJztcclxuXHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGIgPSBwb2ludHNbaV07XHJcbiAgICAgICAgdmFyIGNvbW1hbmQ7XHJcbiAgICAgICAgdmFyIHByZXYgPSBjbG9zZWQgPyBtb2QoaSAtIDEsIGwpIDogTWF0aC5tYXgoaSAtIDEsIDApO1xyXG4gICAgICAgIHZhciBuZXh0ID0gY2xvc2VkID8gbW9kKGkgKyAxLCBsKSA6IE1hdGgubWluKGkgKyAxLCBsYXN0KTtcclxuXHJcbiAgICAgICAgdmFyIGEgPSBwb2ludHNbcHJldl07XHJcbiAgICAgICAgdmFyIGMgPSBwb2ludHNbbmV4dF07XHJcblxyXG4gICAgICAgIHZhciB2eCwgdnksIHV4LCB1eSwgYXIsIGJsLCBiciwgY2w7XHJcblxyXG4gICAgICAgIC8vIEFjY2VzcyB4IGFuZCB5IGRpcmVjdGx5LFxyXG4gICAgICAgIC8vIGJ5cGFzc2luZyB0aGUgZ2V0dGVyXHJcbiAgICAgICAgdmFyIHggPSB0b0ZpeGVkKGIuX3gpO1xyXG4gICAgICAgIHZhciB5ID0gdG9GaXhlZChiLl95KTtcclxuXHJcbiAgICAgICAgc3dpdGNoIChiLl9jb21tYW5kKSB7XHJcblxyXG4gICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMuY2xvc2U6XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSBUd28uQ29tbWFuZHMuY2xvc2U7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLmN1cnZlOlxyXG5cclxuICAgICAgICAgICAgYXIgPSAoYS5jb250cm9scyAmJiBhLmNvbnRyb2xzLnJpZ2h0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcbiAgICAgICAgICAgIGJsID0gKGIuY29udHJvbHMgJiYgYi5jb250cm9scy5sZWZ0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcblxyXG4gICAgICAgICAgICBpZiAoYS5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoKGFyLnggKyBhLngpKTtcclxuICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoKGFyLnkgKyBhLnkpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoYXIueCk7XHJcbiAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKGFyLnkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoKGJsLnggKyBiLngpKTtcclxuICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoKGJsLnkgKyBiLnkpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoYmwueCk7XHJcbiAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKGJsLnkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb21tYW5kID0gKChpID09PSAwKSA/IFR3by5Db21tYW5kcy5tb3ZlIDogVHdvLkNvbW1hbmRzLmN1cnZlKSArXHJcbiAgICAgICAgICAgICAgJyAnICsgdnggKyAnICcgKyB2eSArICcgJyArIHV4ICsgJyAnICsgdXkgKyAnICcgKyB4ICsgJyAnICsgeTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMubW92ZTpcclxuICAgICAgICAgICAgZCA9IGI7XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSBUd28uQ29tbWFuZHMubW92ZSArICcgJyArIHggKyAnICcgKyB5O1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjb21tYW5kID0gYi5fY29tbWFuZCArICcgJyArIHggKyAnICcgKyB5O1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFkZCBhIGZpbmFsIHBvaW50IGFuZCBjbG9zZSBpdCBvZmZcclxuXHJcbiAgICAgICAgaWYgKGkgPj0gbGFzdCAmJiBjbG9zZWQpIHtcclxuXHJcbiAgICAgICAgICBpZiAoYi5fY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLmN1cnZlKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBNYWtlIHN1cmUgd2UgY2xvc2UgdG8gdGhlIG1vc3QgcHJldmlvdXMgVHdvLkNvbW1hbmRzLm1vdmVcclxuICAgICAgICAgICAgYyA9IGQ7XHJcblxyXG4gICAgICAgICAgICBiciA9IChiLmNvbnRyb2xzICYmIGIuY29udHJvbHMucmlnaHQpIHx8IGI7XHJcbiAgICAgICAgICAgIGNsID0gKGMuY29udHJvbHMgJiYgYy5jb250cm9scy5sZWZ0KSB8fCBjO1xyXG5cclxuICAgICAgICAgICAgaWYgKGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKChici54ICsgYi54KSk7XHJcbiAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKChici55ICsgYi55KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKGJyLngpO1xyXG4gICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZChici55KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGMuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKChjbC54ICsgYy54KSk7XHJcbiAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKChjbC55ICsgYy55KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKGNsLngpO1xyXG4gICAgICAgICAgICAgIHV5ID0gdG9GaXhlZChjbC55KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgeCA9IHRvRml4ZWQoYy54KTtcclxuICAgICAgICAgICAgeSA9IHRvRml4ZWQoYy55KTtcclxuXHJcbiAgICAgICAgICAgIGNvbW1hbmQgKz1cclxuICAgICAgICAgICAgICAnIEMgJyArIHZ4ICsgJyAnICsgdnkgKyAnICcgKyB1eCArICcgJyArIHV5ICsgJyAnICsgeCArICcgJyArIHk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29tbWFuZCArPSAnIFonO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldCArPSBjb21tYW5kICsgJyAnO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJldDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGdldENsaXA6IGZ1bmN0aW9uKHNoYXBlKSB7XHJcblxyXG4gICAgICB2YXIgY2xpcCA9IHNoYXBlLl9yZW5kZXJlci5jbGlwO1xyXG5cclxuICAgICAgaWYgKCFjbGlwKSB7XHJcblxyXG4gICAgICAgIHZhciByb290ID0gc2hhcGU7XHJcblxyXG4gICAgICAgIHdoaWxlIChyb290LnBhcmVudCkge1xyXG4gICAgICAgICAgcm9vdCA9IHJvb3QucGFyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2xpcCA9IHNoYXBlLl9yZW5kZXJlci5jbGlwID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ2NsaXBQYXRoJyk7XHJcbiAgICAgICAgcm9vdC5kZWZzLmFwcGVuZENoaWxkKGNsaXApO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGNsaXA7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBncm91cDoge1xyXG5cclxuICAgICAgLy8gVE9ETzogQ2FuIHNwZWVkIHVwLlxyXG4gICAgICAvLyBUT0RPOiBIb3cgZG9lcyB0aGlzIGVmZmVjdCBhIGZcclxuICAgICAgYXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgICB2YXIgZWxlbSA9IG9iamVjdC5fcmVuZGVyZXIuZWxlbTtcclxuXHJcbiAgICAgICAgaWYgKCFlbGVtKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGFnID0gZWxlbS5ub2RlTmFtZTtcclxuXHJcbiAgICAgICAgaWYgKCF0YWcgfHwgLyhyYWRpYWx8bGluZWFyKWdyYWRpZW50L2kudGVzdCh0YWcpIHx8IG9iamVjdC5fY2xpcCkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5lbGVtLmFwcGVuZENoaWxkKGVsZW0pO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlbW92ZUNoaWxkOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgICAgdmFyIGVsZW0gPSBvYmplY3QuX3JlbmRlcmVyLmVsZW07XHJcblxyXG4gICAgICAgIGlmICghZWxlbSB8fCBlbGVtLnBhcmVudE5vZGUgIT0gdGhpcy5lbGVtKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGFnID0gZWxlbS5ub2RlTmFtZTtcclxuXHJcbiAgICAgICAgaWYgKCF0YWcpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIERlZmVyIHN1YnRyYWN0aW9ucyB3aGlsZSBjbGlwcGluZy5cclxuICAgICAgICBpZiAob2JqZWN0Ll9jbGlwKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmVsZW0ucmVtb3ZlQ2hpbGQoZWxlbSk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgb3JkZXJDaGlsZDogZnVuY3Rpb24ob2JqZWN0KSB7XHJcbiAgICAgICAgdGhpcy5lbGVtLmFwcGVuZENoaWxkKG9iamVjdC5fcmVuZGVyZXIuZWxlbSk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZW5kZXJDaGlsZDogZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBzdmdbY2hpbGQuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGNoaWxkLCB0aGlzKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZG9tRWxlbWVudCkge1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgLy8gU2hvcnRjdXQgZm9yIGhpZGRlbiBvYmplY3RzLlxyXG4gICAgICAgIC8vIERvZXNuJ3QgcmVzZXQgdGhlIGZsYWdzLCBzbyBjaGFuZ2VzIGFyZSBzdG9yZWQgYW5kXHJcbiAgICAgICAgLy8gYXBwbGllZCBvbmNlIHRoZSBvYmplY3QgaXMgdmlzaWJsZSBhZ2FpblxyXG4gICAgICAgIGlmICh0aGlzLl9vcGFjaXR5ID09PSAwICYmICF0aGlzLl9mbGFnT3BhY2l0eSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVsZW0pIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0gPSBzdmcuY3JlYXRlRWxlbWVudCgnZycsIHtcclxuICAgICAgICAgICAgaWQ6IHRoaXMuaWRcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9yZW5kZXJlci5lbGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIF9VcGRhdGUgc3R5bGVzIGZvciB0aGUgPGc+XHJcbiAgICAgICAgdmFyIGZsYWdNYXRyaXggPSB0aGlzLl9tYXRyaXgubWFudWFsIHx8IHRoaXMuX2ZsYWdNYXRyaXg7XHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB7XHJcbiAgICAgICAgICBkb21FbGVtZW50OiBkb21FbGVtZW50LFxyXG4gICAgICAgICAgZWxlbTogdGhpcy5fcmVuZGVyZXIuZWxlbVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChmbGFnTWF0cml4KSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLnNldEF0dHJpYnV0ZSgndHJhbnNmb3JtJywgJ21hdHJpeCgnICsgdGhpcy5fbWF0cml4LnRvU3RyaW5nKCkgKyAnKScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgc3ZnW2NoaWxkLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChjaGlsZCwgZG9tRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ09wYWNpdHkpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0uc2V0QXR0cmlidXRlKCdvcGFjaXR5JywgdGhpcy5fb3BhY2l0eSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0FkZGl0aW9ucykge1xyXG4gICAgICAgICAgdGhpcy5hZGRpdGlvbnMuZm9yRWFjaChzdmcuZ3JvdXAuYXBwZW5kQ2hpbGQsIGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTdWJ0cmFjdGlvbnMpIHtcclxuICAgICAgICAgIHRoaXMuc3VidHJhY3Rpb25zLmZvckVhY2goc3ZnLmdyb3VwLnJlbW92ZUNoaWxkLCBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnT3JkZXIpIHtcclxuICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChzdmcuZ3JvdXAub3JkZXJDaGlsZCwgY29udGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDb21tZW50ZWQgdHdvLXdheSBmdW5jdGlvbmFsaXR5IG9mIGNsaXBzIC8gbWFza3Mgd2l0aCBncm91cHMgYW5kXHJcbiAgICAgICAgICogcG9seWdvbnMuIFVuY29tbWVudCB3aGVuIHRoaXMgYnVnIGlzIGZpeGVkOlxyXG4gICAgICAgICAqIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNzA5NTFcclxuICAgICAgICAgKi9cclxuXHJcbiAgICAgICAgLy8gaWYgKHRoaXMuX2ZsYWdDbGlwKSB7XHJcblxyXG4gICAgICAgIC8vICAgY2xpcCA9IHN2Zy5nZXRDbGlwKHRoaXMpO1xyXG4gICAgICAgIC8vICAgZWxlbSA9IHRoaXMuX3JlbmRlcmVyLmVsZW07XHJcblxyXG4gICAgICAgIC8vICAgaWYgKHRoaXMuX2NsaXApIHtcclxuICAgICAgICAvLyAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7XHJcbiAgICAgICAgLy8gICAgIGNsaXAuc2V0QXR0cmlidXRlKCdpZCcsIHRoaXMuaWQpO1xyXG4gICAgICAgIC8vICAgICBjbGlwLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgICAgIC8vICAgfSBlbHNlIHtcclxuICAgICAgICAvLyAgICAgY2xpcC5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7XHJcbiAgICAgICAgLy8gICAgIGVsZW0uc2V0QXR0cmlidXRlKCdpZCcsIHRoaXMuaWQpO1xyXG4gICAgICAgIC8vICAgICB0aGlzLnBhcmVudC5fcmVuZGVyZXIuZWxlbS5hcHBlbmRDaGlsZChlbGVtKTsgLy8gVE9ETzogc2hvdWxkIGJlIGluc2VydEJlZm9yZVxyXG4gICAgICAgIC8vICAgfVxyXG5cclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnTWFzaykge1xyXG4gICAgICAgICAgaWYgKHRoaXMuX21hc2spIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5zZXRBdHRyaWJ1dGUoJ2NsaXAtcGF0aCcsICd1cmwoIycgKyB0aGlzLl9tYXNrLmlkICsgJyknKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0ucmVtb3ZlQXR0cmlidXRlKCdjbGlwLXBhdGgnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcGF0aDoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihkb21FbGVtZW50KSB7XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICAvLyBTaG9ydGN1dCBmb3IgaGlkZGVuIG9iamVjdHMuXHJcbiAgICAgICAgLy8gRG9lc24ndCByZXNldCB0aGUgZmxhZ3MsIHNvIGNoYW5nZXMgYXJlIHN0b3JlZCBhbmRcclxuICAgICAgICAvLyBhcHBsaWVkIG9uY2UgdGhlIG9iamVjdCBpcyB2aXNpYmxlIGFnYWluXHJcbiAgICAgICAgaWYgKHRoaXMuX29wYWNpdHkgPT09IDAgJiYgIXRoaXMuX2ZsYWdPcGFjaXR5KSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbGxlY3QgYW55IGF0dHJpYnV0ZSB0aGF0IG5lZWRzIHRvIGJlIGNoYW5nZWQgaGVyZVxyXG4gICAgICAgIHZhciBjaGFuZ2VkID0ge307XHJcblxyXG4gICAgICAgIHZhciBmbGFnTWF0cml4ID0gdGhpcy5fbWF0cml4Lm1hbnVhbCB8fCB0aGlzLl9mbGFnTWF0cml4O1xyXG5cclxuICAgICAgICBpZiAoZmxhZ01hdHJpeCkge1xyXG4gICAgICAgICAgY2hhbmdlZC50cmFuc2Zvcm0gPSAnbWF0cml4KCcgKyB0aGlzLl9tYXRyaXgudG9TdHJpbmcoKSArICcpJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnVmVydGljZXMpIHtcclxuICAgICAgICAgIHZhciB2ZXJ0aWNlcyA9IHN2Zy50b1N0cmluZyh0aGlzLl92ZXJ0aWNlcywgdGhpcy5fY2xvc2VkKTtcclxuICAgICAgICAgIGNoYW5nZWQuZCA9IHZlcnRpY2VzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZpbGwgJiYgdGhpcy5fZmlsbC5fcmVuZGVyZXIpIHtcclxuICAgICAgICAgIHRoaXMuX2ZpbGwuX3VwZGF0ZSgpO1xyXG4gICAgICAgICAgc3ZnW3RoaXMuX2ZpbGwuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHRoaXMuX2ZpbGwsIGRvbUVsZW1lbnQsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdGaWxsKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLmZpbGwgPSB0aGlzLl9maWxsICYmIHRoaXMuX2ZpbGwuaWRcclxuICAgICAgICAgICAgPyAndXJsKCMnICsgdGhpcy5fZmlsbC5pZCArICcpJyA6IHRoaXMuX2ZpbGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fc3Ryb2tlICYmIHRoaXMuX3N0cm9rZS5fcmVuZGVyZXIpIHtcclxuICAgICAgICAgIHRoaXMuX3N0cm9rZS5fdXBkYXRlKCk7XHJcbiAgICAgICAgICBzdmdbdGhpcy5fc3Ryb2tlLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbCh0aGlzLl9zdHJva2UsIGRvbUVsZW1lbnQsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTdHJva2UpIHtcclxuICAgICAgICAgIGNoYW5nZWQuc3Ryb2tlID0gdGhpcy5fc3Ryb2tlICYmIHRoaXMuX3N0cm9rZS5pZFxyXG4gICAgICAgICAgICA/ICd1cmwoIycgKyB0aGlzLl9zdHJva2UuaWQgKyAnKScgOiB0aGlzLl9zdHJva2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0xpbmV3aWR0aCkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnc3Ryb2tlLXdpZHRoJ10gPSB0aGlzLl9saW5ld2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ09wYWNpdHkpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ3N0cm9rZS1vcGFjaXR5J10gPSB0aGlzLl9vcGFjaXR5O1xyXG4gICAgICAgICAgY2hhbmdlZFsnZmlsbC1vcGFjaXR5J10gPSB0aGlzLl9vcGFjaXR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdWaXNpYmxlKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnZpc2liaWxpdHkgPSB0aGlzLl92aXNpYmxlID8gJ3Zpc2libGUnIDogJ2hpZGRlbic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0NhcCkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnc3Ryb2tlLWxpbmVjYXAnXSA9IHRoaXMuX2NhcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnSm9pbikge1xyXG4gICAgICAgICAgY2hhbmdlZFsnc3Ryb2tlLWxpbmVqb2luJ10gPSB0aGlzLl9qb2luO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdNaXRlcikge1xyXG4gICAgICAgICAgY2hhbmdlZFsnc3Ryb2tlLW1pdGVybGltaXQnXSA9IHRoaXMuX21pdGVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gYXR0YWNoZWQgRE9NIGVsZW1lbnQgeWV0LFxyXG4gICAgICAgIC8vIGNyZWF0ZSBpdCB3aXRoIGFsbCBuZWNlc3NhcnkgYXR0cmlidXRlcy5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVsZW0pIHtcclxuXHJcbiAgICAgICAgICBjaGFuZ2VkLmlkID0gdGhpcy5pZDtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0gPSBzdmcuY3JlYXRlRWxlbWVudCgncGF0aCcsIGNoYW5nZWQpO1xyXG4gICAgICAgICAgZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9yZW5kZXJlci5lbGVtKTtcclxuXHJcbiAgICAgICAgLy8gT3RoZXJ3aXNlIGFwcGx5IGFsbCBwZW5kaW5nIGF0dHJpYnV0ZXNcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXModGhpcy5fcmVuZGVyZXIuZWxlbSwgY2hhbmdlZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0NsaXApIHtcclxuXHJcbiAgICAgICAgICB2YXIgY2xpcCA9IHN2Zy5nZXRDbGlwKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGVsZW0gPSB0aGlzLl9yZW5kZXJlci5lbGVtO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9jbGlwKSB7XHJcbiAgICAgICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICAgICAgICBjbGlwLnNldEF0dHJpYnV0ZSgnaWQnLCB0aGlzLmlkKTtcclxuICAgICAgICAgICAgY2xpcC5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNsaXAucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnaWQnLCB0aGlzLmlkKTtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQuX3JlbmRlcmVyLmVsZW0uYXBwZW5kQ2hpbGQoZWxlbSk7IC8vIFRPRE86IHNob3VsZCBiZSBpbnNlcnRCZWZvcmVcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDb21tZW50ZWQgdHdvLXdheSBmdW5jdGlvbmFsaXR5IG9mIGNsaXBzIC8gbWFza3Mgd2l0aCBncm91cHMgYW5kXHJcbiAgICAgICAgICogcG9seWdvbnMuIFVuY29tbWVudCB3aGVuIHRoaXMgYnVnIGlzIGZpeGVkOlxyXG4gICAgICAgICAqIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNzA5NTFcclxuICAgICAgICAgKi9cclxuXHJcbiAgICAgICAgLy8gaWYgKHRoaXMuX2ZsYWdNYXNrKSB7XHJcbiAgICAgICAgLy8gICBpZiAodGhpcy5fbWFzaykge1xyXG4gICAgICAgIC8vICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnY2xpcC1wYXRoJywgJ3VybCgjJyArIHRoaXMuX21hc2suaWQgKyAnKScpO1xyXG4gICAgICAgIC8vICAgfSBlbHNlIHtcclxuICAgICAgICAvLyAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2NsaXAtcGF0aCcpO1xyXG4gICAgICAgIC8vICAgfVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0OiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGRvbUVsZW1lbnQpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIHZhciBjaGFuZ2VkID0ge307XHJcblxyXG4gICAgICAgIHZhciBmbGFnTWF0cml4ID0gdGhpcy5fbWF0cml4Lm1hbnVhbCB8fCB0aGlzLl9mbGFnTWF0cml4O1xyXG5cclxuICAgICAgICBpZiAoZmxhZ01hdHJpeCkge1xyXG4gICAgICAgICAgY2hhbmdlZC50cmFuc2Zvcm0gPSAnbWF0cml4KCcgKyB0aGlzLl9tYXRyaXgudG9TdHJpbmcoKSArICcpJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnRmFtaWx5KSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydmb250LWZhbWlseSddID0gdGhpcy5fZmFtaWx5O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1NpemUpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ2ZvbnQtc2l6ZSddID0gdGhpcy5fc2l6ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdMZWFkaW5nKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydsaW5lLWhlaWdodCddID0gdGhpcy5fbGVhZGluZztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdBbGlnbm1lbnQpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ3RleHQtYW5jaG9yJ10gPSBzdmcuYWxpZ25tZW50c1t0aGlzLl9hbGlnbm1lbnRdIHx8IHRoaXMuX2FsaWdubWVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdCYXNlbGluZSkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnYWxpZ25tZW50LWJhc2VsaW5lJ10gPSBjaGFuZ2VkWydkb21pbmFudC1iYXNlbGluZSddID0gdGhpcy5fYmFzZWxpbmU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3R5bGUpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ2ZvbnQtc3R5bGUnXSA9IHRoaXMuX3N0eWxlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1dlaWdodCkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnZm9udC13ZWlnaHQnXSA9IHRoaXMuX3dlaWdodDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdEZWNvcmF0aW9uKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWyd0ZXh0LWRlY29yYXRpb24nXSA9IHRoaXMuX2RlY29yYXRpb247XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9maWxsICYmIHRoaXMuX2ZpbGwuX3JlbmRlcmVyKSB7XHJcbiAgICAgICAgICB0aGlzLl9maWxsLl91cGRhdGUoKTtcclxuICAgICAgICAgIHN2Z1t0aGlzLl9maWxsLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbCh0aGlzLl9maWxsLCBkb21FbGVtZW50LCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdGaWxsKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLmZpbGwgPSB0aGlzLl9maWxsICYmIHRoaXMuX2ZpbGwuaWRcclxuICAgICAgICAgICAgPyAndXJsKCMnICsgdGhpcy5fZmlsbC5pZCArICcpJyA6IHRoaXMuX2ZpbGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9zdHJva2UgJiYgdGhpcy5fc3Ryb2tlLl9yZW5kZXJlcikge1xyXG4gICAgICAgICAgdGhpcy5fc3Ryb2tlLl91cGRhdGUoKTtcclxuICAgICAgICAgIHN2Z1t0aGlzLl9zdHJva2UuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHRoaXMuX3N0cm9rZSwgZG9tRWxlbWVudCwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3Ryb2tlKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnN0cm9rZSA9IHRoaXMuX3N0cm9rZSAmJiB0aGlzLl9zdHJva2UuaWRcclxuICAgICAgICAgICAgPyAndXJsKCMnICsgdGhpcy5fc3Ryb2tlLmlkICsgJyknIDogdGhpcy5fc3Ryb2tlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0xpbmV3aWR0aCkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnc3Ryb2tlLXdpZHRoJ10gPSB0aGlzLl9saW5ld2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnT3BhY2l0eSkge1xyXG4gICAgICAgICAgY2hhbmdlZC5vcGFjaXR5ID0gdGhpcy5fb3BhY2l0eTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdWaXNpYmxlKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnZpc2liaWxpdHkgPSB0aGlzLl92aXNpYmxlID8gJ3Zpc2libGUnIDogJ2hpZGRlbic7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVsZW0pIHtcclxuXHJcbiAgICAgICAgICBjaGFuZ2VkLmlkID0gdGhpcy5pZDtcclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ3RleHQnLCBjaGFuZ2VkKTtcclxuICAgICAgICAgIGRvbUVsZW1lbnQuZGVmcy5hcHBlbmRDaGlsZCh0aGlzLl9yZW5kZXJlci5lbGVtKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyh0aGlzLl9yZW5kZXJlci5lbGVtLCBjaGFuZ2VkKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0NsaXApIHtcclxuXHJcbiAgICAgICAgICB2YXIgY2xpcCA9IHN2Zy5nZXRDbGlwKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGVsZW0gPSB0aGlzLl9yZW5kZXJlci5lbGVtO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9jbGlwKSB7XHJcbiAgICAgICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICAgICAgICBjbGlwLnNldEF0dHJpYnV0ZSgnaWQnLCB0aGlzLmlkKTtcclxuICAgICAgICAgICAgY2xpcC5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNsaXAucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnaWQnLCB0aGlzLmlkKTtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQuX3JlbmRlcmVyLmVsZW0uYXBwZW5kQ2hpbGQoZWxlbSk7IC8vIFRPRE86IHNob3VsZCBiZSBpbnNlcnRCZWZvcmVcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1ZhbHVlKSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLnRleHRDb250ZW50ID0gdGhpcy5fdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgICdsaW5lYXItZ3JhZGllbnQnOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIHNpbGVudCkge1xyXG5cclxuICAgICAgICBpZiAoIXNpbGVudCkge1xyXG4gICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY2hhbmdlZCA9IHt9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0VuZFBvaW50cykge1xyXG4gICAgICAgICAgY2hhbmdlZC54MSA9IHRoaXMubGVmdC5feDtcclxuICAgICAgICAgIGNoYW5nZWQueTEgPSB0aGlzLmxlZnQuX3k7XHJcbiAgICAgICAgICBjaGFuZ2VkLngyID0gdGhpcy5yaWdodC5feDtcclxuICAgICAgICAgIGNoYW5nZWQueTIgPSB0aGlzLnJpZ2h0Ll95O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTcHJlYWQpIHtcclxuICAgICAgICAgIGNoYW5nZWQuc3ByZWFkTWV0aG9kID0gdGhpcy5fc3ByZWFkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gYXR0YWNoZWQgRE9NIGVsZW1lbnQgeWV0LFxyXG4gICAgICAgIC8vIGNyZWF0ZSBpdCB3aXRoIGFsbCBuZWNlc3NhcnkgYXR0cmlidXRlcy5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVsZW0pIHtcclxuXHJcbiAgICAgICAgICBjaGFuZ2VkLmlkID0gdGhpcy5pZDtcclxuICAgICAgICAgIGNoYW5nZWQuZ3JhZGllbnRVbml0cyA9ICd1c2VyU3BhY2VPblVzZSc7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ2xpbmVhckdyYWRpZW50JywgY2hhbmdlZCk7XHJcbiAgICAgICAgICBkb21FbGVtZW50LmRlZnMuYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyZXIuZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIE90aGVyd2lzZSBhcHBseSBhbGwgcGVuZGluZyBhdHRyaWJ1dGVzXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyh0aGlzLl9yZW5kZXJlci5lbGVtLCBjaGFuZ2VkKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1N0b3BzKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGxlbmd0aENoYW5nZWQgPSB0aGlzLl9yZW5kZXJlci5lbGVtLmNoaWxkTm9kZXMubGVuZ3RoXHJcbiAgICAgICAgICAgICE9PSB0aGlzLnN0b3BzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICBpZiAobGVuZ3RoQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLmNoaWxkTm9kZXMubGVuZ3RoID0gMDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3RvcHMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdG9wID0gdGhpcy5zdG9wc1tpXTtcclxuICAgICAgICAgICAgdmFyIGF0dHJzID0ge307XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RvcC5fZmxhZ09mZnNldCkge1xyXG4gICAgICAgICAgICAgIGF0dHJzLm9mZnNldCA9IDEwMCAqIHN0b3AuX29mZnNldCArICclJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3RvcC5fZmxhZ0NvbG9yKSB7XHJcbiAgICAgICAgICAgICAgYXR0cnNbJ3N0b3AtY29sb3InXSA9IHN0b3AuX2NvbG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdG9wLl9mbGFnT3BhY2l0eSkge1xyXG4gICAgICAgICAgICAgIGF0dHJzWydzdG9wLW9wYWNpdHknXSA9IHN0b3AuX29wYWNpdHk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghc3RvcC5fcmVuZGVyZXIuZWxlbSkge1xyXG4gICAgICAgICAgICAgIHN0b3AuX3JlbmRlcmVyLmVsZW0gPSBzdmcuY3JlYXRlRWxlbWVudCgnc3RvcCcsIGF0dHJzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyhzdG9wLl9yZW5kZXJlci5lbGVtLCBhdHRycyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChsZW5ndGhDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5hcHBlbmRDaGlsZChzdG9wLl9yZW5kZXJlci5lbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdG9wLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgICdyYWRpYWwtZ3JhZGllbnQnOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIHNpbGVudCkge1xyXG5cclxuICAgICAgICBpZiAoIXNpbGVudCkge1xyXG4gICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY2hhbmdlZCA9IHt9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0NlbnRlcikge1xyXG4gICAgICAgICAgY2hhbmdlZC5jeCA9IHRoaXMuY2VudGVyLl94O1xyXG4gICAgICAgICAgY2hhbmdlZC5jeSA9IHRoaXMuY2VudGVyLl95O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0ZvY2FsKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLmZ4ID0gdGhpcy5mb2NhbC5feDtcclxuICAgICAgICAgIGNoYW5nZWQuZnkgPSB0aGlzLmZvY2FsLl95O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdSYWRpdXMpIHtcclxuICAgICAgICAgIGNoYW5nZWQuciA9IHRoaXMuX3JhZGl1cztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3ByZWFkKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnNwcmVhZE1ldGhvZCA9IHRoaXMuX3NwcmVhZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIGF0dGFjaGVkIERPTSBlbGVtZW50IHlldCxcclxuICAgICAgICAvLyBjcmVhdGUgaXQgd2l0aCBhbGwgbmVjZXNzYXJ5IGF0dHJpYnV0ZXMuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lbGVtKSB7XHJcblxyXG4gICAgICAgICAgY2hhbmdlZC5pZCA9IHRoaXMuaWQ7XHJcbiAgICAgICAgICBjaGFuZ2VkLmdyYWRpZW50VW5pdHMgPSAndXNlclNwYWNlT25Vc2UnO1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbSA9IHN2Zy5jcmVhdGVFbGVtZW50KCdyYWRpYWxHcmFkaWVudCcsIGNoYW5nZWQpO1xyXG4gICAgICAgICAgZG9tRWxlbWVudC5kZWZzLmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLmVsZW0pO1xyXG5cclxuICAgICAgICAvLyBPdGhlcndpc2UgYXBwbHkgYWxsIHBlbmRpbmcgYXR0cmlidXRlc1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXModGhpcy5fcmVuZGVyZXIuZWxlbSwgY2hhbmdlZCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTdG9wcykge1xyXG5cclxuICAgICAgICAgIHZhciBsZW5ndGhDaGFuZ2VkID0gdGhpcy5fcmVuZGVyZXIuZWxlbS5jaGlsZE5vZGVzLmxlbmd0aFxyXG4gICAgICAgICAgICAhPT0gdGhpcy5zdG9wcy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgaWYgKGxlbmd0aENoYW5nZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5jaGlsZE5vZGVzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0b3BzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RvcCA9IHRoaXMuc3RvcHNbaV07XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0b3AuX2ZsYWdPZmZzZXQpIHtcclxuICAgICAgICAgICAgICBhdHRycy5vZmZzZXQgPSAxMDAgKiBzdG9wLl9vZmZzZXQgKyAnJSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN0b3AuX2ZsYWdDb2xvcikge1xyXG4gICAgICAgICAgICAgIGF0dHJzWydzdG9wLWNvbG9yJ10gPSBzdG9wLl9jb2xvcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3RvcC5fZmxhZ09wYWNpdHkpIHtcclxuICAgICAgICAgICAgICBhdHRyc1snc3RvcC1vcGFjaXR5J10gPSBzdG9wLl9vcGFjaXR5O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXN0b3AuX3JlbmRlcmVyLmVsZW0pIHtcclxuICAgICAgICAgICAgICBzdG9wLl9yZW5kZXJlci5lbGVtID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ3N0b3AnLCBhdHRycyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXMoc3RvcC5fcmVuZGVyZXIuZWxlbSwgYXR0cnMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobGVuZ3RoQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0uYXBwZW5kQ2hpbGQoc3RvcC5fcmVuZGVyZXIuZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RvcC5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0dXJlOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGRvbUVsZW1lbnQsIHNpbGVudCkge1xyXG5cclxuICAgICAgICBpZiAoIXNpbGVudCkge1xyXG4gICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY2hhbmdlZCA9IHt9O1xyXG4gICAgICAgIHZhciBzdHlsZXMgPSB7IHg6IDAsIHk6IDAgfTtcclxuICAgICAgICB2YXIgaW1hZ2UgPSB0aGlzLmltYWdlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0xvYWRlZCAmJiB0aGlzLmxvYWRlZCkge1xyXG5cclxuICAgICAgICAgIHN3aXRjaCAoaW1hZ2Uubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnY2FudmFzJzpcclxuICAgICAgICAgICAgICBzdHlsZXMuaHJlZiA9IHN0eWxlc1sneGxpbms6aHJlZiddID0gaW1hZ2UudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnaW1nJzpcclxuICAgICAgICAgICAgY2FzZSAnaW1hZ2UnOlxyXG4gICAgICAgICAgICAgIHN0eWxlcy5ocmVmID0gc3R5bGVzWyd4bGluazpocmVmJ10gPSB0aGlzLnNyYztcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdPZmZzZXQgfHwgdGhpcy5fZmxhZ0xvYWRlZCB8fCB0aGlzLl9mbGFnU2NhbGUpIHtcclxuXHJcbiAgICAgICAgICBjaGFuZ2VkLnggPSB0aGlzLl9vZmZzZXQueDtcclxuICAgICAgICAgIGNoYW5nZWQueSA9IHRoaXMuX29mZnNldC55O1xyXG5cclxuICAgICAgICAgIGlmIChpbWFnZSkge1xyXG5cclxuICAgICAgICAgICAgY2hhbmdlZC54IC09IGltYWdlLndpZHRoIC8gMjtcclxuICAgICAgICAgICAgY2hhbmdlZC55IC09IGltYWdlLmhlaWdodCAvIDI7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgY2hhbmdlZC54ICo9IHRoaXMuX3NjYWxlLng7XHJcbiAgICAgICAgICAgICAgY2hhbmdlZC55ICo9IHRoaXMuX3NjYWxlLnk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY2hhbmdlZC54ICo9IHRoaXMuX3NjYWxlO1xyXG4gICAgICAgICAgICAgIGNoYW5nZWQueSAqPSB0aGlzLl9zY2FsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChjaGFuZ2VkLnggPiAwKSB7XHJcbiAgICAgICAgICAgIGNoYW5nZWQueCAqPSAtIDE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoY2hhbmdlZC55ID4gMCkge1xyXG4gICAgICAgICAgICBjaGFuZ2VkLnkgKj0gLSAxO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU2NhbGUgfHwgdGhpcy5fZmxhZ0xvYWRlZCB8fCB0aGlzLl9mbGFnUmVwZWF0KSB7XHJcblxyXG4gICAgICAgICAgY2hhbmdlZC53aWR0aCA9IDA7XHJcbiAgICAgICAgICBjaGFuZ2VkLmhlaWdodCA9IDA7XHJcblxyXG4gICAgICAgICAgaWYgKGltYWdlKSB7XHJcblxyXG4gICAgICAgICAgICBzdHlsZXMud2lkdGggPSBjaGFuZ2VkLndpZHRoID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgIHN0eWxlcy5oZWlnaHQgPSBjaGFuZ2VkLmhlaWdodCA9IGltYWdlLmhlaWdodDtcclxuXHJcbiAgICAgICAgICAgIC8vIFRPRE86IEhhY2sgLyBCYW5kYWlkXHJcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5fcmVwZWF0KSB7XHJcbiAgICAgICAgICAgICAgY2FzZSAnbm8tcmVwZWF0JzpcclxuICAgICAgICAgICAgICAgIGNoYW5nZWQud2lkdGggKz0gMTtcclxuICAgICAgICAgICAgICAgIGNoYW5nZWQuaGVpZ2h0ICs9IDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICAgIGNoYW5nZWQud2lkdGggKj0gdGhpcy5fc2NhbGUueDtcclxuICAgICAgICAgICAgICBjaGFuZ2VkLmhlaWdodCAqPSB0aGlzLl9zY2FsZS55O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNoYW5nZWQud2lkdGggKj0gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgICAgICAgY2hhbmdlZC5oZWlnaHQgKj0gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1NjYWxlIHx8IHRoaXMuX2ZsYWdMb2FkZWQpIHtcclxuICAgICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuaW1hZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuaW1hZ2UgPSBzdmcuY3JlYXRlRWxlbWVudCgnaW1hZ2UnLCBzdHlsZXMpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICghXy5pc0VtcHR5KHN0eWxlcykpIHtcclxuICAgICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXModGhpcy5fcmVuZGVyZXIuaW1hZ2UsIHN0eWxlcyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVsZW0pIHtcclxuXHJcbiAgICAgICAgICBjaGFuZ2VkLmlkID0gdGhpcy5pZDtcclxuICAgICAgICAgIGNoYW5nZWQucGF0dGVyblVuaXRzID0gJ3VzZXJTcGFjZU9uVXNlJztcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0gPSBzdmcuY3JlYXRlRWxlbWVudCgncGF0dGVybicsIGNoYW5nZWQpO1xyXG4gICAgICAgICAgZG9tRWxlbWVudC5kZWZzLmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLmVsZW0pO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKCFfLmlzRW1wdHkoY2hhbmdlZCkpIHtcclxuXHJcbiAgICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyh0aGlzLl9yZW5kZXJlci5lbGVtLCBjaGFuZ2VkKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fcmVuZGVyZXIuZWxlbSAmJiB0aGlzLl9yZW5kZXJlci5pbWFnZSAmJiAhdGhpcy5fcmVuZGVyZXIuYXBwZW5kZWQpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0uYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyZXIuaW1hZ2UpO1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuYXBwZW5kZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAY2xhc3NcclxuICAgKi9cclxuICB2YXIgUmVuZGVyZXIgPSBUd29bVHdvLlR5cGVzLnN2Z10gPSBmdW5jdGlvbihwYXJhbXMpIHtcclxuXHJcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBwYXJhbXMuZG9tRWxlbWVudCB8fCBzdmcuY3JlYXRlRWxlbWVudCgnc3ZnJyk7XHJcblxyXG4gICAgdGhpcy5zY2VuZSA9IG5ldyBUd28uR3JvdXAoKTtcclxuICAgIHRoaXMuc2NlbmUucGFyZW50ID0gdGhpcztcclxuXHJcbiAgICB0aGlzLmRlZnMgPSBzdmcuY3JlYXRlRWxlbWVudCgnZGVmcycpO1xyXG4gICAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZGVmcyk7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQuZGVmcyA9IHRoaXMuZGVmcztcclxuICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChSZW5kZXJlciwge1xyXG5cclxuICAgIFV0aWxzOiBzdmdcclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFJlbmRlcmVyLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIHNldFNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuXHJcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICBzdmcuc2V0QXR0cmlidXRlcyh0aGlzLmRvbUVsZW1lbnQsIHtcclxuICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHRcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBzdmcuZ3JvdXAucmVuZGVyLmNhbGwodGhpcy5zY2VuZSwgdGhpcy5kb21FbGVtZW50KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICAvKipcclxuICAgKiBDb25zdGFudHNcclxuICAgKi9cclxuICB2YXIgbW9kID0gVHdvLlV0aWxzLm1vZCwgdG9GaXhlZCA9IFR3by5VdGlscy50b0ZpeGVkO1xyXG4gIHZhciBnZXRSYXRpbyA9IFR3by5VdGlscy5nZXRSYXRpbztcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgLy8gUmV0dXJucyB0cnVlIGlmIHRoaXMgaXMgYSBub24tdHJhbnNmb3JtaW5nIG1hdHJpeFxyXG4gIHZhciBpc0RlZmF1bHRNYXRyaXggPSBmdW5jdGlvbiAobSkge1xyXG4gICAgcmV0dXJuIChtWzBdID09IDEgJiYgbVszXSA9PSAwICYmIG1bMV0gPT0gMCAmJiBtWzRdID09IDEgJiYgbVsyXSA9PSAwICYmIG1bNV0gPT0gMCk7XHJcbiAgfTtcclxuXHJcbiAgdmFyIGNhbnZhcyA9IHtcclxuXHJcbiAgICBpc0hpZGRlbjogLyhub25lfHRyYW5zcGFyZW50KS9pLFxyXG5cclxuICAgIGFsaWdubWVudHM6IHtcclxuICAgICAgbGVmdDogJ3N0YXJ0JyxcclxuICAgICAgbWlkZGxlOiAnY2VudGVyJyxcclxuICAgICAgcmlnaHQ6ICdlbmQnXHJcbiAgICB9LFxyXG5cclxuICAgIHNoaW06IGZ1bmN0aW9uKGVsZW0pIHtcclxuICAgICAgZWxlbS50YWdOYW1lID0gJ2NhbnZhcyc7XHJcbiAgICAgIGVsZW0ubm9kZVR5cGUgPSAxO1xyXG4gICAgICByZXR1cm4gZWxlbTtcclxuICAgIH0sXHJcblxyXG4gICAgZ3JvdXA6IHtcclxuXHJcbiAgICAgIHJlbmRlckNoaWxkOiBmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNhbnZhc1tjaGlsZC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoY2hpbGQsIHRoaXMuY3R4LCB0cnVlLCB0aGlzLmNsaXApO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgpIHtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQWRkIGEgY2hlY2sgaGVyZSB0byBvbmx5IGludm9rZSBfdXBkYXRlIGlmIG5lZWQgYmUuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLl9tYXRyaXguZWxlbWVudHM7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50O1xyXG4gICAgICAgIHRoaXMuX3JlbmRlcmVyLm9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5ICogKHBhcmVudCAmJiBwYXJlbnQuX3JlbmRlcmVyID8gcGFyZW50Ll9yZW5kZXJlci5vcGFjaXR5IDogMSk7XHJcblxyXG4gICAgICAgIHZhciBkZWZhdWx0TWF0cml4ID0gaXNEZWZhdWx0TWF0cml4KG1hdHJpeCk7XHJcblxyXG4gICAgICAgIHZhciBtYXNrID0gdGhpcy5fbWFzaztcclxuICAgICAgICAvLyB2YXIgY2xpcCA9IHRoaXMuX2NsaXA7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuY29udGV4dCkge1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuY29udGV4dCA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcmVuZGVyZXIuY29udGV4dC5jdHggPSBjdHg7XHJcbiAgICAgICAgLy8gdGhpcy5fcmVuZGVyZXIuY29udGV4dC5jbGlwID0gY2xpcDtcclxuXHJcbiAgICAgICAgaWYgKCFkZWZhdWx0TWF0cml4KSB7XHJcbiAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgY3R4LnRyYW5zZm9ybShtYXRyaXhbMF0sIG1hdHJpeFszXSwgbWF0cml4WzFdLCBtYXRyaXhbNF0sIG1hdHJpeFsyXSwgbWF0cml4WzVdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtYXNrKSB7XHJcbiAgICAgICAgICBjYW52YXNbbWFzay5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwobWFzaywgY3R4LCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wYWNpdHkgPiAwICYmIHRoaXMuc2NhbGUgIT09IDApIHtcclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgICAgICBjYW52YXNbY2hpbGQuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGNoaWxkLCBjdHgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFkZWZhdWx0TWF0cml4KSB7XHJcbiAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAvKipcclxuICAgICAgICAgKiBDb21tZW50ZWQgdHdvLXdheSBmdW5jdGlvbmFsaXR5IG9mIGNsaXBzIC8gbWFza3Mgd2l0aCBncm91cHMgYW5kXHJcbiAgICAgICAgICogcG9seWdvbnMuIFVuY29tbWVudCB3aGVuIHRoaXMgYnVnIGlzIGZpeGVkOlxyXG4gICAgICAgICAqIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNzA5NTFcclxuICAgICAgICAgKi9cclxuXHJcbiAgICAgICAgLy8gaWYgKGNsaXApIHtcclxuICAgICAgICAvLyAgIGN0eC5jbGlwKCk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHBhdGg6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4LCBmb3JjZWQsIHBhcmVudENsaXBwZWQpIHtcclxuXHJcbiAgICAgICAgdmFyIG1hdHJpeCwgc3Ryb2tlLCBsaW5ld2lkdGgsIGZpbGwsIG9wYWNpdHksIHZpc2libGUsIGNhcCwgam9pbiwgbWl0ZXIsXHJcbiAgICAgICAgICAgIGNsb3NlZCwgY29tbWFuZHMsIGxlbmd0aCwgbGFzdCwgbmV4dCwgcHJldiwgYSwgYiwgYywgZCwgdXgsIHV5LCB2eCwgdnksXHJcbiAgICAgICAgICAgIGFyLCBibCwgYnIsIGNsLCB4LCB5LCBtYXNrLCBjbGlwLCBkZWZhdWx0TWF0cml4LCBpc09mZnNldDtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQWRkIGEgY2hlY2sgaGVyZSB0byBvbmx5IGludm9rZSBfdXBkYXRlIGlmIG5lZWQgYmUuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIG1hdHJpeCA9IHRoaXMuX21hdHJpeC5lbGVtZW50cztcclxuICAgICAgICBzdHJva2UgPSB0aGlzLl9zdHJva2U7XHJcbiAgICAgICAgbGluZXdpZHRoID0gdGhpcy5fbGluZXdpZHRoO1xyXG4gICAgICAgIGZpbGwgPSB0aGlzLl9maWxsO1xyXG4gICAgICAgIG9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5ICogdGhpcy5wYXJlbnQuX3JlbmRlcmVyLm9wYWNpdHk7XHJcbiAgICAgICAgdmlzaWJsZSA9IHRoaXMuX3Zpc2libGU7XHJcbiAgICAgICAgY2FwID0gdGhpcy5fY2FwO1xyXG4gICAgICAgIGpvaW4gPSB0aGlzLl9qb2luO1xyXG4gICAgICAgIG1pdGVyID0gdGhpcy5fbWl0ZXI7XHJcbiAgICAgICAgY2xvc2VkID0gdGhpcy5fY2xvc2VkO1xyXG4gICAgICAgIGNvbW1hbmRzID0gdGhpcy5fdmVydGljZXM7IC8vIENvbW1hbmRzXHJcbiAgICAgICAgbGVuZ3RoID0gY29tbWFuZHMubGVuZ3RoO1xyXG4gICAgICAgIGxhc3QgPSBsZW5ndGggLSAxO1xyXG4gICAgICAgIGRlZmF1bHRNYXRyaXggPSBpc0RlZmF1bHRNYXRyaXgobWF0cml4KTtcclxuXHJcbiAgICAgICAgLy8gbWFzayA9IHRoaXMuX21hc2s7XHJcbiAgICAgICAgY2xpcCA9IHRoaXMuX2NsaXA7XHJcblxyXG4gICAgICAgIGlmICghZm9yY2VkICYmICghdmlzaWJsZSB8fCBjbGlwKSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUcmFuc2Zvcm1cclxuICAgICAgICBpZiAoIWRlZmF1bHRNYXRyaXgpIHtcclxuICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICBjdHgudHJhbnNmb3JtKG1hdHJpeFswXSwgbWF0cml4WzNdLCBtYXRyaXhbMV0sIG1hdHJpeFs0XSwgbWF0cml4WzJdLCBtYXRyaXhbNV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAvKipcclxuICAgICAgICAgKiBDb21tZW50ZWQgdHdvLXdheSBmdW5jdGlvbmFsaXR5IG9mIGNsaXBzIC8gbWFza3Mgd2l0aCBncm91cHMgYW5kXHJcbiAgICAgICAgICogcG9seWdvbnMuIFVuY29tbWVudCB3aGVuIHRoaXMgYnVnIGlzIGZpeGVkOlxyXG4gICAgICAgICAqIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNzA5NTFcclxuICAgICAgICAgKi9cclxuXHJcbiAgICAgICAgLy8gaWYgKG1hc2spIHtcclxuICAgICAgICAvLyAgIGNhbnZhc1ttYXNrLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChtYXNrLCBjdHgsIHRydWUpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgLy8gU3R5bGVzXHJcbiAgICAgICAgaWYgKGZpbGwpIHtcclxuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKGZpbGwpKSB7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2FudmFzW2ZpbGwuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGZpbGwsIGN0eCk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsLl9yZW5kZXJlci5lZmZlY3Q7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzdHJva2UpIHtcclxuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKHN0cm9rZSkpIHtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2FudmFzW3N0cm9rZS5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoc3Ryb2tlLCBjdHgpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2UuX3JlbmRlcmVyLmVmZmVjdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxpbmV3aWR0aCkge1xyXG4gICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGxpbmV3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1pdGVyKSB7XHJcbiAgICAgICAgICBjdHgubWl0ZXJMaW1pdCA9IG1pdGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoam9pbikge1xyXG4gICAgICAgICAgY3R4LmxpbmVKb2luID0gam9pbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNhcCkge1xyXG4gICAgICAgICAgY3R4LmxpbmVDYXAgPSBjYXA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzTnVtYmVyKG9wYWNpdHkpKSB7XHJcbiAgICAgICAgICBjdHguZ2xvYmFsQWxwaGEgPSBvcGFjaXR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbW1hbmRzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgYiA9IGNvbW1hbmRzW2ldO1xyXG5cclxuICAgICAgICAgIHggPSB0b0ZpeGVkKGIuX3gpO1xyXG4gICAgICAgICAgeSA9IHRvRml4ZWQoYi5feSk7XHJcblxyXG4gICAgICAgICAgc3dpdGNoIChiLl9jb21tYW5kKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5jbG9zZTpcclxuICAgICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5jdXJ2ZTpcclxuXHJcbiAgICAgICAgICAgICAgcHJldiA9IGNsb3NlZCA/IG1vZChpIC0gMSwgbGVuZ3RoKSA6IE1hdGgubWF4KGkgLSAxLCAwKTtcclxuICAgICAgICAgICAgICBuZXh0ID0gY2xvc2VkID8gbW9kKGkgKyAxLCBsZW5ndGgpIDogTWF0aC5taW4oaSArIDEsIGxhc3QpO1xyXG5cclxuICAgICAgICAgICAgICBhID0gY29tbWFuZHNbcHJldl07XHJcbiAgICAgICAgICAgICAgYyA9IGNvbW1hbmRzW25leHRdO1xyXG4gICAgICAgICAgICAgIGFyID0gKGEuY29udHJvbHMgJiYgYS5jb250cm9scy5yaWdodCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG4gICAgICAgICAgICAgIGJsID0gKGIuY29udHJvbHMgJiYgYi5jb250cm9scy5sZWZ0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcblxyXG4gICAgICAgICAgICAgIGlmIChhLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgdnggPSAoYXIueCArIHRvRml4ZWQoYS5feCkpO1xyXG4gICAgICAgICAgICAgICAgdnkgPSAoYXIueSArIHRvRml4ZWQoYS5feSkpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoYXIueCk7XHJcbiAgICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoYXIueSk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiAoYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgIHV4ID0gKGJsLnggKyB0b0ZpeGVkKGIuX3gpKTtcclxuICAgICAgICAgICAgICAgIHV5ID0gKGJsLnkgKyB0b0ZpeGVkKGIuX3kpKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKGJsLngpO1xyXG4gICAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKGJsLnkpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odngsIHZ5LCB1eCwgdXksIHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoaSA+PSBsYXN0ICYmIGNsb3NlZCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGMgPSBkO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyID0gKGIuY29udHJvbHMgJiYgYi5jb250cm9scy5yaWdodCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG4gICAgICAgICAgICAgICAgY2wgPSAoYy5jb250cm9scyAmJiBjLmNvbnRyb2xzLmxlZnQpIHx8IFR3by5WZWN0b3IuemVybztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgdnggPSAoYnIueCArIHRvRml4ZWQoYi5feCkpO1xyXG4gICAgICAgICAgICAgICAgICB2eSA9IChici55ICsgdG9GaXhlZChiLl95KSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoYnIueCk7XHJcbiAgICAgICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZChici55KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYy5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgdXggPSAoY2wueCArIHRvRml4ZWQoYy5feCkpO1xyXG4gICAgICAgICAgICAgICAgICB1eSA9IChjbC55ICsgdG9GaXhlZChjLl95KSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoY2wueCk7XHJcbiAgICAgICAgICAgICAgICAgIHV5ID0gdG9GaXhlZChjbC55KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB4ID0gdG9GaXhlZChjLl94KTtcclxuICAgICAgICAgICAgICAgIHkgPSB0b0ZpeGVkKGMuX3kpO1xyXG5cclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZ4LCB2eSwgdXgsIHV5LCB4LCB5KTtcclxuXHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLmxpbmU6XHJcbiAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4LCB5KTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLm1vdmU6XHJcbiAgICAgICAgICAgICAgZCA9IGI7XHJcbiAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh4LCB5KTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBMb29zZSBlbmRzXHJcblxyXG4gICAgICAgIGlmIChjbG9zZWQpIHtcclxuICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY2xpcCAmJiAhcGFyZW50Q2xpcHBlZCkge1xyXG4gICAgICAgICAgaWYgKCFjYW52YXMuaXNIaWRkZW4udGVzdChmaWxsKSkge1xyXG4gICAgICAgICAgICBpc09mZnNldCA9IGZpbGwuX3JlbmRlcmVyICYmIGZpbGwuX3JlbmRlcmVyLm9mZnNldFxyXG4gICAgICAgICAgICBpZiAoaXNPZmZzZXQpIHtcclxuICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoXHJcbiAgICAgICAgICAgICAgICAtIGZpbGwuX3JlbmRlcmVyLm9mZnNldC54LCAtIGZpbGwuX3JlbmRlcmVyLm9mZnNldC55KTtcclxuICAgICAgICAgICAgICBjdHguc2NhbGUoZmlsbC5fcmVuZGVyZXIuc2NhbGUueCwgZmlsbC5fcmVuZGVyZXIuc2NhbGUueSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgICAgaWYgKGlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCFjYW52YXMuaXNIaWRkZW4udGVzdChzdHJva2UpKSB7XHJcbiAgICAgICAgICAgIGlzT2Zmc2V0ID0gc3Ryb2tlLl9yZW5kZXJlciAmJiBzdHJva2UuX3JlbmRlcmVyLm9mZnNldDtcclxuICAgICAgICAgICAgaWYgKGlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKFxyXG4gICAgICAgICAgICAgICAgLSBzdHJva2UuX3JlbmRlcmVyLm9mZnNldC54LCAtIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LnkpO1xyXG4gICAgICAgICAgICAgIGN0eC5zY2FsZShzdHJva2UuX3JlbmRlcmVyLnNjYWxlLngsIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueSk7XHJcbiAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGxpbmV3aWR0aCAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgIGlmIChpc09mZnNldCkge1xyXG4gICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZGVmYXVsdE1hdHJpeCkge1xyXG4gICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChjbGlwICYmICFwYXJlbnRDbGlwcGVkKSB7XHJcbiAgICAgICAgICBjdHguY2xpcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0OiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgZm9yY2VkLCBwYXJlbnRDbGlwcGVkKSB7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEFkZCBhIGNoZWNrIGhlcmUgdG8gb25seSBpbnZva2UgX3VwZGF0ZSBpZiBuZWVkIGJlLlxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcy5fbWF0cml4LmVsZW1lbnRzO1xyXG4gICAgICAgIHZhciBzdHJva2UgPSB0aGlzLl9zdHJva2U7XHJcbiAgICAgICAgdmFyIGxpbmV3aWR0aCA9IHRoaXMuX2xpbmV3aWR0aDtcclxuICAgICAgICB2YXIgZmlsbCA9IHRoaXMuX2ZpbGw7XHJcbiAgICAgICAgdmFyIG9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5ICogdGhpcy5wYXJlbnQuX3JlbmRlcmVyLm9wYWNpdHk7XHJcbiAgICAgICAgdmFyIHZpc2libGUgPSB0aGlzLl92aXNpYmxlO1xyXG4gICAgICAgIHZhciBkZWZhdWx0TWF0cml4ID0gaXNEZWZhdWx0TWF0cml4KG1hdHJpeCk7XHJcbiAgICAgICAgdmFyIGlzT2Zmc2V0ID0gZmlsbC5fcmVuZGVyZXIgJiYgZmlsbC5fcmVuZGVyZXIub2Zmc2V0XHJcbiAgICAgICAgICAmJiBzdHJva2UuX3JlbmRlcmVyICYmIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0O1xyXG5cclxuICAgICAgICB2YXIgYSwgYiwgYywgZCwgZSwgc3gsIHN5O1xyXG5cclxuICAgICAgICAvLyBtYXNrID0gdGhpcy5fbWFzaztcclxuICAgICAgICB2YXIgY2xpcCA9IHRoaXMuX2NsaXA7XHJcblxyXG4gICAgICAgIGlmICghZm9yY2VkICYmICghdmlzaWJsZSB8fCBjbGlwKSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUcmFuc2Zvcm1cclxuICAgICAgICBpZiAoIWRlZmF1bHRNYXRyaXgpIHtcclxuICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICBjdHgudHJhbnNmb3JtKG1hdHJpeFswXSwgbWF0cml4WzNdLCBtYXRyaXhbMV0sIG1hdHJpeFs0XSwgbWF0cml4WzJdLCBtYXRyaXhbNV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAvKipcclxuICAgICAgICAgKiBDb21tZW50ZWQgdHdvLXdheSBmdW5jdGlvbmFsaXR5IG9mIGNsaXBzIC8gbWFza3Mgd2l0aCBncm91cHMgYW5kXHJcbiAgICAgICAgICogcG9seWdvbnMuIFVuY29tbWVudCB3aGVuIHRoaXMgYnVnIGlzIGZpeGVkOlxyXG4gICAgICAgICAqIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zNzA5NTFcclxuICAgICAgICAgKi9cclxuXHJcbiAgICAgICAgLy8gaWYgKG1hc2spIHtcclxuICAgICAgICAvLyAgIGNhbnZhc1ttYXNrLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChtYXNrLCBjdHgsIHRydWUpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKCFpc09mZnNldCkge1xyXG4gICAgICAgICAgY3R4LmZvbnQgPSBbdGhpcy5fc3R5bGUsIHRoaXMuX3dlaWdodCwgdGhpcy5fc2l6ZSArICdweC8nICtcclxuICAgICAgICAgICAgdGhpcy5fbGVhZGluZyArICdweCcsIHRoaXMuX2ZhbWlseV0uam9pbignICcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnRleHRBbGlnbiA9IGNhbnZhcy5hbGlnbm1lbnRzW3RoaXMuX2FsaWdubWVudF0gfHwgdGhpcy5fYWxpZ25tZW50O1xyXG4gICAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSB0aGlzLl9iYXNlbGluZTtcclxuXHJcbiAgICAgICAgLy8gU3R5bGVzXHJcbiAgICAgICAgaWYgKGZpbGwpIHtcclxuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKGZpbGwpKSB7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2FudmFzW2ZpbGwuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGZpbGwsIGN0eCk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsLl9yZW5kZXJlci5lZmZlY3Q7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzdHJva2UpIHtcclxuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKHN0cm9rZSkpIHtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2FudmFzW3N0cm9rZS5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoc3Ryb2tlLCBjdHgpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2UuX3JlbmRlcmVyLmVmZmVjdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxpbmV3aWR0aCkge1xyXG4gICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGxpbmV3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNOdW1iZXIob3BhY2l0eSkpIHtcclxuICAgICAgICAgIGN0eC5nbG9iYWxBbHBoYSA9IG9wYWNpdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWNsaXAgJiYgIXBhcmVudENsaXBwZWQpIHtcclxuXHJcbiAgICAgICAgICBpZiAoIWNhbnZhcy5pc0hpZGRlbi50ZXN0KGZpbGwpKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlsbC5fcmVuZGVyZXIgJiYgZmlsbC5fcmVuZGVyZXIub2Zmc2V0KSB7XHJcblxyXG4gICAgICAgICAgICAgIHN4ID0gdG9GaXhlZChmaWxsLl9yZW5kZXJlci5zY2FsZS54KTtcclxuICAgICAgICAgICAgICBzeSA9IHRvRml4ZWQoZmlsbC5fcmVuZGVyZXIuc2NhbGUueSk7XHJcblxyXG4gICAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggLSB0b0ZpeGVkKGZpbGwuX3JlbmRlcmVyLm9mZnNldC54KSxcclxuICAgICAgICAgICAgICAgIC0gdG9GaXhlZChmaWxsLl9yZW5kZXJlci5vZmZzZXQueSkpO1xyXG4gICAgICAgICAgICAgIGN0eC5zY2FsZShzeCwgc3kpO1xyXG5cclxuICAgICAgICAgICAgICBhID0gdGhpcy5fc2l6ZSAvIGZpbGwuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgICAgYiA9IHRoaXMuX2xlYWRpbmcgLyBmaWxsLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICAgIGN0eC5mb250ID0gW3RoaXMuX3N0eWxlLCB0aGlzLl93ZWlnaHQsIHRvRml4ZWQoYSkgKyAncHgvJyxcclxuICAgICAgICAgICAgICAgIHRvRml4ZWQoYikgKyAncHgnLCB0aGlzLl9mYW1pbHldLmpvaW4oJyAnKTtcclxuXHJcbiAgICAgICAgICAgICAgYyA9IGZpbGwuX3JlbmRlcmVyLm9mZnNldC54IC8gZmlsbC5fcmVuZGVyZXIuc2NhbGUueDtcclxuICAgICAgICAgICAgICBkID0gZmlsbC5fcmVuZGVyZXIub2Zmc2V0LnkgLyBmaWxsLl9yZW5kZXJlci5zY2FsZS55O1xyXG5cclxuICAgICAgICAgICAgICBjdHguZmlsbFRleHQodGhpcy52YWx1ZSwgdG9GaXhlZChjKSwgdG9GaXhlZChkKSk7XHJcbiAgICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHRoaXMudmFsdWUsIDAsIDApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICghY2FudmFzLmlzSGlkZGVuLnRlc3Qoc3Ryb2tlKSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0cm9rZS5fcmVuZGVyZXIgJiYgc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQpIHtcclxuXHJcbiAgICAgICAgICAgICAgc3ggPSB0b0ZpeGVkKHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueCk7XHJcbiAgICAgICAgICAgICAgc3kgPSB0b0ZpeGVkKHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueSk7XHJcblxyXG4gICAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSgtIHRvRml4ZWQoc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueCksXHJcbiAgICAgICAgICAgICAgICAtIHRvRml4ZWQoc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueSkpO1xyXG4gICAgICAgICAgICAgIGN0eC5zY2FsZShzeCwgc3kpO1xyXG5cclxuICAgICAgICAgICAgICBhID0gdGhpcy5fc2l6ZSAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgICBiID0gdGhpcy5fbGVhZGluZyAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgICBjdHguZm9udCA9IFt0aGlzLl9zdHlsZSwgdGhpcy5fd2VpZ2h0LCB0b0ZpeGVkKGEpICsgJ3B4LycsXHJcbiAgICAgICAgICAgICAgICB0b0ZpeGVkKGIpICsgJ3B4JywgdGhpcy5fZmFtaWx5XS5qb2luKCcgJyk7XHJcblxyXG4gICAgICAgICAgICAgIGMgPSBzdHJva2UuX3JlbmRlcmVyLm9mZnNldC54IC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54O1xyXG4gICAgICAgICAgICAgIGQgPSBzdHJva2UuX3JlbmRlcmVyLm9mZnNldC55IC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICAgIGUgPSBsaW5ld2lkdGggLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLng7XHJcblxyXG4gICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0b0ZpeGVkKGUpO1xyXG4gICAgICAgICAgICAgIGN0eC5zdHJva2VUZXh0KHRoaXMudmFsdWUsIHRvRml4ZWQoYyksIHRvRml4ZWQoZCkpO1xyXG4gICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGN0eC5zdHJva2VUZXh0KHRoaXMudmFsdWUsIDAsIDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWRlZmF1bHRNYXRyaXgpIHtcclxuICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUT0RPOiBUZXN0IGZvciB0ZXh0XHJcbiAgICAgICAgaWYgKGNsaXAgJiYgIXBhcmVudENsaXBwZWQpIHtcclxuICAgICAgICAgIGN0eC5jbGlwKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgICdsaW5lYXItZ3JhZGllbnQnOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCkge1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lZmZlY3QgfHwgdGhpcy5fZmxhZ0VuZFBvaW50cyB8fCB0aGlzLl9mbGFnU3RvcHMpIHtcclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoXHJcbiAgICAgICAgICAgIHRoaXMubGVmdC5feCwgdGhpcy5sZWZ0Ll95LFxyXG4gICAgICAgICAgICB0aGlzLnJpZ2h0Ll94LCB0aGlzLnJpZ2h0Ll95XHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdG9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgc3RvcCA9IHRoaXMuc3RvcHNbaV07XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdC5hZGRDb2xvclN0b3Aoc3RvcC5fb2Zmc2V0LCBzdG9wLl9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAncmFkaWFsLWdyYWRpZW50Jzoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWZmZWN0IHx8IHRoaXMuX2ZsYWdDZW50ZXIgfHwgdGhpcy5fZmxhZ0ZvY2FsXHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZsYWdSYWRpdXMgfHwgdGhpcy5fZmxhZ1N0b3BzKSB7XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KFxyXG4gICAgICAgICAgICB0aGlzLmNlbnRlci5feCwgdGhpcy5jZW50ZXIuX3ksIDAsXHJcbiAgICAgICAgICAgIHRoaXMuZm9jYWwuX3gsIHRoaXMuZm9jYWwuX3ksIHRoaXMuX3JhZGl1c1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3RvcHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHN0b3AgPSB0aGlzLnN0b3BzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QuYWRkQ29sb3JTdG9wKHN0b3AuX29mZnNldCwgc3RvcC5fY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdGV4dHVyZToge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIHZhciBpbWFnZSA9IHRoaXMuaW1hZ2U7XHJcbiAgICAgICAgdmFyIHJlcGVhdDtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lZmZlY3QgfHwgKCh0aGlzLl9mbGFnTG9hZGVkIHx8IHRoaXMuX2ZsYWdJbWFnZSB8fCB0aGlzLl9mbGFnVmlkZW8gfHwgdGhpcy5fZmxhZ1JlcGVhdCkgJiYgdGhpcy5sb2FkZWQpKSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QgPSBjdHguY3JlYXRlUGF0dGVybih0aGlzLmltYWdlLCB0aGlzLl9yZXBlYXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdPZmZzZXQgfHwgdGhpcy5fZmxhZ0xvYWRlZCB8fCB0aGlzLl9mbGFnU2NhbGUpIHtcclxuXHJcbiAgICAgICAgICBpZiAoISh0aGlzLl9yZW5kZXJlci5vZmZzZXQgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQgPSBuZXcgVHdvLlZlY3RvcigpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC54ID0gLSB0aGlzLl9vZmZzZXQueDtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC55ID0gLSB0aGlzLl9vZmZzZXQueTtcclxuXHJcbiAgICAgICAgICBpZiAoaW1hZ2UpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC54ICs9IGltYWdlLndpZHRoIC8gMjtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnkgKz0gaW1hZ2UuaGVpZ2h0IC8gMjtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueCAqPSB0aGlzLl9zY2FsZS54O1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC55ICo9IHRoaXMuX3NjYWxlLnk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnggKj0gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnkgKj0gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1NjYWxlIHx8IHRoaXMuX2ZsYWdMb2FkZWQpIHtcclxuXHJcbiAgICAgICAgICBpZiAoISh0aGlzLl9yZW5kZXJlci5zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlID0gbmV3IFR3by5WZWN0b3IoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlLmNvcHkodGhpcy5fc2NhbGUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUuc2V0KHRoaXMuX3NjYWxlLCB0aGlzLl9zY2FsZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICB2YXIgUmVuZGVyZXIgPSBUd29bVHdvLlR5cGVzLmNhbnZhc10gPSBmdW5jdGlvbihwYXJhbXMpIHtcclxuICAgIC8vIFNtb290aGluZyBwcm9wZXJ0eS4gRGVmYXVsdHMgdG8gdHJ1ZVxyXG4gICAgLy8gU2V0IGl0IHRvIGZhbHNlIHdoZW4gd29ya2luZyB3aXRoIHBpeGVsIGFydC5cclxuICAgIC8vIGZhbHNlIGNhbiBsZWFkIHRvIGJldHRlciBwZXJmb3JtYW5jZSwgc2luY2UgaXQgd291bGQgdXNlIGEgY2hlYXBlciBpbnRlcnBvbGF0aW9uIGFsZ29yaXRobS5cclxuICAgIC8vIEl0IG1pZ2h0IG5vdCBtYWtlIGEgYmlnIGRpZmZlcmVuY2Ugb24gR1BVIGJhY2tlZCBjYW52YXNlcy5cclxuICAgIHZhciBzbW9vdGhpbmcgPSAocGFyYW1zLnNtb290aGluZyAhPT0gZmFsc2UpO1xyXG4gICAgdGhpcy5kb21FbGVtZW50ID0gcGFyYW1zLmRvbUVsZW1lbnQgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuZG9tRWxlbWVudC5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgdGhpcy5vdmVyZHJhdyA9IHBhcmFtcy5vdmVyZHJhdyB8fCBmYWxzZTtcclxuXHJcbiAgICBpZiAoIV8uaXNVbmRlZmluZWQodGhpcy5jdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkKSkge1xyXG4gICAgICB0aGlzLmN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBzbW9vdGhpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRXZlcnl0aGluZyBkcmF3biBvbiB0aGUgY2FudmFzIG5lZWRzIHRvIGJlIGFkZGVkIHRvIHRoZSBzY2VuZS5cclxuICAgIHRoaXMuc2NlbmUgPSBuZXcgVHdvLkdyb3VwKCk7XHJcbiAgICB0aGlzLnNjZW5lLnBhcmVudCA9IHRoaXM7XHJcbiAgfTtcclxuXHJcblxyXG4gIF8uZXh0ZW5kKFJlbmRlcmVyLCB7XHJcblxyXG4gICAgVXRpbHM6IGNhbnZhc1xyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUmVuZGVyZXIucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgc2V0U2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgcmF0aW8pIHtcclxuXHJcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICB0aGlzLnJhdGlvID0gXy5pc1VuZGVmaW5lZChyYXRpbykgPyBnZXRSYXRpbyh0aGlzLmN0eCkgOiByYXRpbztcclxuXHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC53aWR0aCA9IHdpZHRoICogdGhpcy5yYXRpbztcclxuICAgICAgdGhpcy5kb21FbGVtZW50LmhlaWdodCA9IGhlaWdodCAqIHRoaXMucmF0aW87XHJcblxyXG4gICAgICBpZiAodGhpcy5kb21FbGVtZW50LnN0eWxlKSB7XHJcbiAgICAgICAgXy5leHRlbmQodGhpcy5kb21FbGVtZW50LnN0eWxlLCB7XHJcbiAgICAgICAgICB3aWR0aDogd2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgKyAncHgnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBpc09uZSA9IHRoaXMucmF0aW8gPT09IDE7XHJcblxyXG4gICAgICBpZiAoIWlzT25lKSB7XHJcbiAgICAgICAgdGhpcy5jdHguc2F2ZSgpO1xyXG4gICAgICAgIHRoaXMuY3R4LnNjYWxlKHRoaXMucmF0aW8sIHRoaXMucmF0aW8pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoIXRoaXMub3ZlcmRyYXcpIHtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjYW52YXMuZ3JvdXAucmVuZGVyLmNhbGwodGhpcy5zY2VuZSwgdGhpcy5jdHgpO1xyXG5cclxuICAgICAgaWYgKCFpc09uZSkge1xyXG4gICAgICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgZnVuY3Rpb24gcmVzZXRUcmFuc2Zvcm0oY3R4KSB7XHJcbiAgICBjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG4gIH1cclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0YW50c1xyXG4gICAqL1xyXG5cclxuICB2YXIgcm9vdCA9IFR3by5yb290LFxyXG4gICAgbXVsdGlwbHlNYXRyaXggPSBUd28uTWF0cml4Lk11bHRpcGx5LFxyXG4gICAgbW9kID0gVHdvLlV0aWxzLm1vZCxcclxuICAgIGlkZW50aXR5ID0gWzEsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDFdLFxyXG4gICAgdHJhbnNmb3JtYXRpb24gPSBuZXcgVHdvLkFycmF5KDkpLFxyXG4gICAgZ2V0UmF0aW8gPSBUd28uVXRpbHMuZ2V0UmF0aW8sXHJcbiAgICBnZXRDb21wdXRlZE1hdHJpeCA9IFR3by5VdGlscy5nZXRDb21wdXRlZE1hdHJpeCxcclxuICAgIHRvRml4ZWQgPSBUd28uVXRpbHMudG9GaXhlZCxcclxuICAgIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciB3ZWJnbCA9IHtcclxuXHJcbiAgICBpc0hpZGRlbjogLyhub25lfHRyYW5zcGFyZW50KS9pLFxyXG5cclxuICAgIGNhbnZhczogKHJvb3QuZG9jdW1lbnQgPyByb290LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpIDogeyBnZXRDb250ZXh0OiBfLmlkZW50aXR5IH0pLFxyXG5cclxuICAgIGFsaWdubWVudHM6IHtcclxuICAgICAgbGVmdDogJ3N0YXJ0JyxcclxuICAgICAgbWlkZGxlOiAnY2VudGVyJyxcclxuICAgICAgcmlnaHQ6ICdlbmQnXHJcbiAgICB9LFxyXG5cclxuICAgIG1hdHJpeDogbmV3IFR3by5NYXRyaXgoKSxcclxuXHJcbiAgICB1djogbmV3IFR3by5BcnJheShbXHJcbiAgICAgIDAsIDAsXHJcbiAgICAgIDEsIDAsXHJcbiAgICAgIDAsIDEsXHJcbiAgICAgIDAsIDEsXHJcbiAgICAgIDEsIDAsXHJcbiAgICAgIDEsIDFcclxuICAgIF0pLFxyXG5cclxuICAgIGdyb3VwOiB7XHJcblxyXG4gICAgICByZW1vdmVDaGlsZDogZnVuY3Rpb24oY2hpbGQsIGdsKSB7XHJcbiAgICAgICAgaWYgKGNoaWxkLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHdlYmdsLmdyb3VwLnJlbW92ZUNoaWxkKGNoaWxkLmNoaWxkcmVuW2ldLCBnbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIERlYWxsb2NhdGUgdGV4dHVyZSB0byBmcmVlIHVwIGdsIG1lbW9yeS5cclxuICAgICAgICBnbC5kZWxldGVUZXh0dXJlKGNoaWxkLl9yZW5kZXJlci50ZXh0dXJlKTtcclxuICAgICAgICBkZWxldGUgY2hpbGQuX3JlbmRlcmVyLnRleHR1cmU7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZW5kZXJDaGlsZDogZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICB3ZWJnbFtjaGlsZC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoY2hpbGQsIHRoaXMuZ2wsIHRoaXMucHJvZ3JhbSk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGdsLCBwcm9ncmFtKSB7XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XHJcbiAgICAgICAgdmFyIGZsYWdQYXJlbnRNYXRyaXggPSAocGFyZW50Ll9tYXRyaXggJiYgcGFyZW50Ll9tYXRyaXgubWFudWFsKSB8fCBwYXJlbnQuX2ZsYWdNYXRyaXg7XHJcbiAgICAgICAgdmFyIGZsYWdNYXRyaXggPSB0aGlzLl9tYXRyaXgubWFudWFsIHx8IHRoaXMuX2ZsYWdNYXRyaXg7XHJcblxyXG4gICAgICAgIGlmIChmbGFnUGFyZW50TWF0cml4IHx8IGZsYWdNYXRyaXgpIHtcclxuXHJcbiAgICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLm1hdHJpeCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5tYXRyaXggPSBuZXcgVHdvLkFycmF5KDkpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJlZHVjZSBhbW91bnQgb2Ygb2JqZWN0IC8gYXJyYXkgY3JlYXRpb24gLyBkZWxldGlvblxyXG4gICAgICAgICAgdGhpcy5fbWF0cml4LnRvQXJyYXkodHJ1ZSwgdHJhbnNmb3JtYXRpb24pO1xyXG5cclxuICAgICAgICAgIG11bHRpcGx5TWF0cml4KHRyYW5zZm9ybWF0aW9uLCBwYXJlbnQuX3JlbmRlcmVyLm1hdHJpeCwgdGhpcy5fcmVuZGVyZXIubWF0cml4KTtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlID0gdGhpcy5fc2NhbGUgKiBwYXJlbnQuX3JlbmRlcmVyLnNjYWxlO1xyXG5cclxuICAgICAgICAgIGlmIChmbGFnUGFyZW50TWF0cml4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZsYWdNYXRyaXggPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9tYXNrKSB7XHJcblxyXG4gICAgICAgICAgZ2wuZW5hYmxlKGdsLlNURU5DSUxfVEVTVCk7XHJcbiAgICAgICAgICBnbC5zdGVuY2lsRnVuYyhnbC5BTFdBWVMsIDEsIDEpO1xyXG5cclxuICAgICAgICAgIGdsLmNvbG9yTWFzayhmYWxzZSwgZmFsc2UsIGZhbHNlLCB0cnVlKTtcclxuICAgICAgICAgIGdsLnN0ZW5jaWxPcChnbC5LRUVQLCBnbC5LRUVQLCBnbC5JTkNSKTtcclxuXHJcbiAgICAgICAgICB3ZWJnbFt0aGlzLl9tYXNrLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbCh0aGlzLl9tYXNrLCBnbCwgcHJvZ3JhbSwgdGhpcyk7XHJcblxyXG4gICAgICAgICAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgZ2wuc3RlbmNpbEZ1bmMoZ2wuTk9URVFVQUwsIDAsIDEpO1xyXG4gICAgICAgICAgZ2wuc3RlbmNpbE9wKGdsLktFRVAsIGdsLktFRVAsIGdsLktFRVApO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2ZsYWdPcGFjaXR5ID0gcGFyZW50Ll9mbGFnT3BhY2l0eSB8fCB0aGlzLl9mbGFnT3BhY2l0eTtcclxuXHJcbiAgICAgICAgdGhpcy5fcmVuZGVyZXIub3BhY2l0eSA9IHRoaXMuX29wYWNpdHlcclxuICAgICAgICAgICogKHBhcmVudCAmJiBwYXJlbnQuX3JlbmRlcmVyID8gcGFyZW50Ll9yZW5kZXJlci5vcGFjaXR5IDogMSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3VidHJhY3Rpb25zKSB7XHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3VidHJhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHdlYmdsLmdyb3VwLnJlbW92ZUNoaWxkKHRoaXMuc3VidHJhY3Rpb25zW2ldLCBnbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2god2ViZ2wuZ3JvdXAucmVuZGVyQ2hpbGQsIHtcclxuICAgICAgICAgIGdsOiBnbCxcclxuICAgICAgICAgIHByb2dyYW06IHByb2dyYW1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX21hc2spIHtcclxuXHJcbiAgICAgICAgICBnbC5jb2xvck1hc2soZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgZ2wuc3RlbmNpbE9wKGdsLktFRVAsIGdsLktFRVAsIGdsLkRFQ1IpO1xyXG5cclxuICAgICAgICAgIHdlYmdsW3RoaXMuX21hc2suX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHRoaXMuX21hc2ssIGdsLCBwcm9ncmFtLCB0aGlzKTtcclxuXHJcbiAgICAgICAgICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBnbC5zdGVuY2lsRnVuYyhnbC5OT1RFUVVBTCwgMCwgMSk7XHJcbiAgICAgICAgICBnbC5zdGVuY2lsT3AoZ2wuS0VFUCwgZ2wuS0VFUCwgZ2wuS0VFUCk7XHJcblxyXG4gICAgICAgICAgZ2wuZGlzYWJsZShnbC5TVEVOQ0lMX1RFU1QpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcGF0aDoge1xyXG5cclxuICAgICAgdXBkYXRlQ2FudmFzOiBmdW5jdGlvbihlbGVtKSB7XHJcblxyXG4gICAgICAgIHZhciBuZXh0LCBwcmV2LCBhLCBjLCB1eCwgdXksIHZ4LCB2eSwgYXIsIGJsLCBiciwgY2wsIHgsIHk7XHJcbiAgICAgICAgdmFyIGlzT2Zmc2V0O1xyXG5cclxuICAgICAgICB2YXIgY29tbWFuZHMgPSBlbGVtLl92ZXJ0aWNlcztcclxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXM7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuY3R4O1xyXG5cclxuICAgICAgICAvLyBTdHlsZXNcclxuICAgICAgICB2YXIgc2NhbGUgPSBlbGVtLl9yZW5kZXJlci5zY2FsZTtcclxuICAgICAgICB2YXIgc3Ryb2tlID0gZWxlbS5fc3Ryb2tlO1xyXG4gICAgICAgIHZhciBsaW5ld2lkdGggPSBlbGVtLl9saW5ld2lkdGg7XHJcbiAgICAgICAgdmFyIGZpbGwgPSBlbGVtLl9maWxsO1xyXG4gICAgICAgIHZhciBvcGFjaXR5ID0gZWxlbS5fcmVuZGVyZXIub3BhY2l0eSB8fCBlbGVtLl9vcGFjaXR5O1xyXG4gICAgICAgIHZhciBjYXAgPSBlbGVtLl9jYXA7XHJcbiAgICAgICAgdmFyIGpvaW4gPSBlbGVtLl9qb2luO1xyXG4gICAgICAgIHZhciBtaXRlciA9IGVsZW0uX21pdGVyO1xyXG4gICAgICAgIHZhciBjbG9zZWQgPSBlbGVtLl9jbG9zZWQ7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IGNvbW1hbmRzLmxlbmd0aDtcclxuICAgICAgICB2YXIgbGFzdCA9IGxlbmd0aCAtIDE7XHJcblxyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IE1hdGgubWF4KE1hdGguY2VpbChlbGVtLl9yZW5kZXJlci5yZWN0LndpZHRoICogc2NhbGUpLCAxKTtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gTWF0aC5tYXgoTWF0aC5jZWlsKGVsZW0uX3JlbmRlcmVyLnJlY3QuaGVpZ2h0ICogc2NhbGUpLCAxKTtcclxuXHJcbiAgICAgICAgdmFyIGNlbnRyb2lkID0gZWxlbS5fcmVuZGVyZXIucmVjdC5jZW50cm9pZDtcclxuICAgICAgICB2YXIgY3ggPSBjZW50cm9pZC54O1xyXG4gICAgICAgIHZhciBjeSA9IGNlbnRyb2lkLnk7XHJcblxyXG4gICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgaWYgKGZpbGwpIHtcclxuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKGZpbGwpKSB7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2ViZ2xbZmlsbC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoZmlsbCwgY3R4LCBlbGVtKTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGZpbGwuX3JlbmRlcmVyLmVmZmVjdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN0cm9rZSkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoc3Ryb2tlKSkge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2U7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3ZWJnbFtzdHJva2UuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHN0cm9rZSwgY3R4LCBlbGVtKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlLl9yZW5kZXJlci5lZmZlY3Q7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsaW5ld2lkdGgpIHtcclxuICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBsaW5ld2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtaXRlcikge1xyXG4gICAgICAgICAgY3R4Lm1pdGVyTGltaXQgPSBtaXRlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGpvaW4pIHtcclxuICAgICAgICAgIGN0eC5saW5lSm9pbiA9IGpvaW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjYXApIHtcclxuICAgICAgICAgIGN0eC5saW5lQ2FwID0gY2FwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc051bWJlcihvcGFjaXR5KSkge1xyXG4gICAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gb3BhY2l0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkO1xyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgY3R4LnNjYWxlKHNjYWxlLCBzY2FsZSk7XHJcbiAgICAgICAgY3R4LnRyYW5zbGF0ZShjeCwgY3kpO1xyXG5cclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb21tYW5kcy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgIGIgPSBjb21tYW5kc1tpXTtcclxuXHJcbiAgICAgICAgICB4ID0gdG9GaXhlZChiLl94KTtcclxuICAgICAgICAgIHkgPSB0b0ZpeGVkKGIuX3kpO1xyXG5cclxuICAgICAgICAgIHN3aXRjaCAoYi5fY29tbWFuZCkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMuY2xvc2U6XHJcbiAgICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMuY3VydmU6XHJcblxyXG4gICAgICAgICAgICAgIHByZXYgPSBjbG9zZWQgPyBtb2QoaSAtIDEsIGxlbmd0aCkgOiBNYXRoLm1heChpIC0gMSwgMCk7XHJcbiAgICAgICAgICAgICAgbmV4dCA9IGNsb3NlZCA/IG1vZChpICsgMSwgbGVuZ3RoKSA6IE1hdGgubWluKGkgKyAxLCBsYXN0KTtcclxuXHJcbiAgICAgICAgICAgICAgYSA9IGNvbW1hbmRzW3ByZXZdO1xyXG4gICAgICAgICAgICAgIGMgPSBjb21tYW5kc1tuZXh0XTtcclxuICAgICAgICAgICAgICBhciA9IChhLmNvbnRyb2xzICYmIGEuY29udHJvbHMucmlnaHQpIHx8IFR3by5WZWN0b3IuemVybztcclxuICAgICAgICAgICAgICBibCA9IChiLmNvbnRyb2xzICYmIGIuY29udHJvbHMubGVmdCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoYS5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZCgoYXIueCArIGEuX3gpKTtcclxuICAgICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZCgoYXIueSArIGEuX3kpKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKGFyLngpO1xyXG4gICAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKGFyLnkpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgaWYgKGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoKGJsLnggKyBiLl94KSk7XHJcbiAgICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoKGJsLnkgKyBiLl95KSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHV4ID0gdG9GaXhlZChibC54KTtcclxuICAgICAgICAgICAgICAgIHV5ID0gdG9GaXhlZChibC55KTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZ4LCB2eSwgdXgsIHV5LCB4LCB5KTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKGkgPj0gbGFzdCAmJiBjbG9zZWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjID0gZDtcclxuXHJcbiAgICAgICAgICAgICAgICBiciA9IChiLmNvbnRyb2xzICYmIGIuY29udHJvbHMucmlnaHQpIHx8IFR3by5WZWN0b3IuemVybztcclxuICAgICAgICAgICAgICAgIGNsID0gKGMuY29udHJvbHMgJiYgYy5jb250cm9scy5sZWZ0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZCgoYnIueCArIGIuX3gpKTtcclxuICAgICAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKChici55ICsgYi5feSkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKGJyLngpO1xyXG4gICAgICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoYnIueSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGMuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHV4ID0gdG9GaXhlZCgoY2wueCArIGMuX3gpKTtcclxuICAgICAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKChjbC55ICsgYy5feSkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKGNsLngpO1xyXG4gICAgICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoY2wueSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgeCA9IHRvRml4ZWQoYy5feCk7XHJcbiAgICAgICAgICAgICAgICB5ID0gdG9GaXhlZChjLl95KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2eCwgdnksIHV4LCB1eSwgeCwgeSk7XHJcblxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5saW5lOlxyXG4gICAgICAgICAgICAgIGN0eC5saW5lVG8oeCwgeSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5tb3ZlOlxyXG4gICAgICAgICAgICAgIGQgPSBiO1xyXG4gICAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIExvb3NlIGVuZHNcclxuXHJcbiAgICAgICAgaWYgKGNsb3NlZCkge1xyXG4gICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF3ZWJnbC5pc0hpZGRlbi50ZXN0KGZpbGwpKSB7XHJcbiAgICAgICAgICBpc09mZnNldCA9IGZpbGwuX3JlbmRlcmVyICYmIGZpbGwuX3JlbmRlcmVyLm9mZnNldFxyXG4gICAgICAgICAgaWYgKGlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoXHJcbiAgICAgICAgICAgICAgLSBmaWxsLl9yZW5kZXJlci5vZmZzZXQueCwgLSBmaWxsLl9yZW5kZXJlci5vZmZzZXQueSk7XHJcbiAgICAgICAgICAgIGN0eC5zY2FsZShmaWxsLl9yZW5kZXJlci5zY2FsZS54LCBmaWxsLl9yZW5kZXJlci5zY2FsZS55KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICBpZiAoaXNPZmZzZXQpIHtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghd2ViZ2wuaXNIaWRkZW4udGVzdChzdHJva2UpKSB7XHJcbiAgICAgICAgICBpc09mZnNldCA9IHN0cm9rZS5fcmVuZGVyZXIgJiYgc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQ7XHJcbiAgICAgICAgICBpZiAoaXNPZmZzZXQpIHtcclxuICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShcclxuICAgICAgICAgICAgICAtIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LngsIC0gc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueSk7XHJcbiAgICAgICAgICAgIGN0eC5zY2FsZShzdHJva2UuX3JlbmRlcmVyLnNjYWxlLngsIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueSk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBsaW5ld2lkdGggLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLng7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgICBpZiAoaXNPZmZzZXQpIHtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFJldHVybnMgdGhlIHJlY3Qgb2YgYSBzZXQgb2YgdmVydHMuIFR5cGljYWxseSB0YWtlcyB2ZXJ0aWNlcyB0aGF0IGFyZVxyXG4gICAgICAgKiBcImNlbnRlcmVkXCIgYXJvdW5kIDAgYW5kIHJldHVybnMgdGhlbSB0byBiZSBhbmNob3JlZCB1cHBlci1sZWZ0LlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiBmdW5jdGlvbih2ZXJ0aWNlcywgYm9yZGVyLCByZWN0KSB7XHJcblxyXG4gICAgICAgIHZhciBsZWZ0ID0gSW5maW5pdHksIHJpZ2h0ID0gLUluZmluaXR5LFxyXG4gICAgICAgICAgICB0b3AgPSBJbmZpbml0eSwgYm90dG9tID0gLUluZmluaXR5LFxyXG4gICAgICAgICAgICB3aWR0aCwgaGVpZ2h0O1xyXG5cclxuICAgICAgICB2ZXJ0aWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHYpIHtcclxuXHJcbiAgICAgICAgICB2YXIgeCA9IHYueCwgeSA9IHYueSwgY29udHJvbHMgPSB2LmNvbnRyb2xzO1xyXG4gICAgICAgICAgdmFyIGEsIGIsIGMsIGQsIGNsLCBjcjtcclxuXHJcbiAgICAgICAgICB0b3AgPSBNYXRoLm1pbih5LCB0b3ApO1xyXG4gICAgICAgICAgbGVmdCA9IE1hdGgubWluKHgsIGxlZnQpO1xyXG4gICAgICAgICAgcmlnaHQgPSBNYXRoLm1heCh4LCByaWdodCk7XHJcbiAgICAgICAgICBib3R0b20gPSBNYXRoLm1heCh5LCBib3R0b20pO1xyXG5cclxuICAgICAgICAgIGlmICghdi5jb250cm9scykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY2wgPSBjb250cm9scy5sZWZ0O1xyXG4gICAgICAgICAgY3IgPSBjb250cm9scy5yaWdodDtcclxuXHJcbiAgICAgICAgICBpZiAoIWNsIHx8ICFjcikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgYSA9IHYuX3JlbGF0aXZlID8gY2wueCArIHggOiBjbC54O1xyXG4gICAgICAgICAgYiA9IHYuX3JlbGF0aXZlID8gY2wueSArIHkgOiBjbC55O1xyXG4gICAgICAgICAgYyA9IHYuX3JlbGF0aXZlID8gY3IueCArIHggOiBjci54O1xyXG4gICAgICAgICAgZCA9IHYuX3JlbGF0aXZlID8gY3IueSArIHkgOiBjci55O1xyXG5cclxuICAgICAgICAgIGlmICghYSB8fCAhYiB8fCAhYyB8fCAhZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdG9wID0gTWF0aC5taW4oYiwgZCwgdG9wKTtcclxuICAgICAgICAgIGxlZnQgPSBNYXRoLm1pbihhLCBjLCBsZWZ0KTtcclxuICAgICAgICAgIHJpZ2h0ID0gTWF0aC5tYXgoYSwgYywgcmlnaHQpO1xyXG4gICAgICAgICAgYm90dG9tID0gTWF0aC5tYXgoYiwgZCwgYm90dG9tKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEV4cGFuZCBib3JkZXJzXHJcblxyXG4gICAgICAgIGlmIChfLmlzTnVtYmVyKGJvcmRlcikpIHtcclxuICAgICAgICAgIHRvcCAtPSBib3JkZXI7XHJcbiAgICAgICAgICBsZWZ0IC09IGJvcmRlcjtcclxuICAgICAgICAgIHJpZ2h0ICs9IGJvcmRlcjtcclxuICAgICAgICAgIGJvdHRvbSArPSBib3JkZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcclxuICAgICAgICBoZWlnaHQgPSBib3R0b20gLSB0b3A7XHJcblxyXG4gICAgICAgIHJlY3QudG9wID0gdG9wO1xyXG4gICAgICAgIHJlY3QubGVmdCA9IGxlZnQ7XHJcbiAgICAgICAgcmVjdC5yaWdodCA9IHJpZ2h0O1xyXG4gICAgICAgIHJlY3QuYm90dG9tID0gYm90dG9tO1xyXG4gICAgICAgIHJlY3Qud2lkdGggPSB3aWR0aDtcclxuICAgICAgICByZWN0LmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgICAgaWYgKCFyZWN0LmNlbnRyb2lkKSB7XHJcbiAgICAgICAgICByZWN0LmNlbnRyb2lkID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWN0LmNlbnRyb2lkLnggPSAtIGxlZnQ7XHJcbiAgICAgICAgcmVjdC5jZW50cm9pZC55ID0gLSB0b3A7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihnbCwgcHJvZ3JhbSwgZm9yY2VkUGFyZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fdmlzaWJsZSB8fCAhdGhpcy5fb3BhY2l0eSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHdoYXQgY2hhbmdlZFxyXG5cclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XHJcbiAgICAgICAgdmFyIGZsYWdQYXJlbnRNYXRyaXggPSBwYXJlbnQuX21hdHJpeC5tYW51YWwgfHwgcGFyZW50Ll9mbGFnTWF0cml4O1xyXG4gICAgICAgIHZhciBmbGFnTWF0cml4ID0gdGhpcy5fbWF0cml4Lm1hbnVhbCB8fCB0aGlzLl9mbGFnTWF0cml4O1xyXG4gICAgICAgIHZhciBmbGFnVGV4dHVyZSA9IHRoaXMuX2ZsYWdWZXJ0aWNlcyB8fCB0aGlzLl9mbGFnRmlsbFxyXG4gICAgICAgICAgfHwgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnQgJiYgKHRoaXMuX2ZpbGwuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fZmlsbC5fZmxhZ1N0b3BzIHx8IHRoaXMuX2ZpbGwuX2ZsYWdFbmRQb2ludHMpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnQgJiYgKHRoaXMuX2ZpbGwuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fZmlsbC5fZmxhZ1N0b3BzIHx8IHRoaXMuX2ZpbGwuX2ZsYWdSYWRpdXMgfHwgdGhpcy5fZmlsbC5fZmxhZ0NlbnRlciB8fCB0aGlzLl9maWxsLl9mbGFnRm9jYWwpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSAmJiAodGhpcy5fZmlsbC5fZmxhZ0xvYWRlZCAmJiB0aGlzLl9maWxsLmxvYWRlZCB8fCB0aGlzLl9maWxsLl9mbGFnT2Zmc2V0IHx8IHRoaXMuX2ZpbGwuX2ZsYWdTY2FsZSkpXHJcbiAgICAgICAgICB8fCAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50ICYmICh0aGlzLl9zdHJva2UuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnU3RvcHMgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnRW5kUG9pbnRzKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnQgJiYgKHRoaXMuX3N0cm9rZS5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9zdHJva2UuX2ZsYWdTdG9wcyB8fCB0aGlzLl9zdHJva2UuX2ZsYWdSYWRpdXMgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnQ2VudGVyIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ0ZvY2FsKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSAmJiAodGhpcy5fc3Ryb2tlLl9mbGFnTG9hZGVkICYmIHRoaXMuX3N0cm9rZS5sb2FkZWQgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnT2Zmc2V0IHx8IHRoaXMuX2ZpbGwuX2ZsYWdTY2FsZSkpXHJcbiAgICAgICAgICB8fCB0aGlzLl9mbGFnU3Ryb2tlIHx8IHRoaXMuX2ZsYWdMaW5ld2lkdGggfHwgdGhpcy5fZmxhZ09wYWNpdHlcclxuICAgICAgICAgIHx8IHBhcmVudC5fZmxhZ09wYWNpdHkgfHwgdGhpcy5fZmxhZ1Zpc2libGUgfHwgdGhpcy5fZmxhZ0NhcFxyXG4gICAgICAgICAgfHwgdGhpcy5fZmxhZ0pvaW4gfHwgdGhpcy5fZmxhZ01pdGVyIHx8IHRoaXMuX2ZsYWdTY2FsZVxyXG4gICAgICAgICAgfHwgIXRoaXMuX3JlbmRlcmVyLnRleHR1cmU7XHJcblxyXG4gICAgICAgIGlmIChmbGFnUGFyZW50TWF0cml4IHx8IGZsYWdNYXRyaXgpIHtcclxuXHJcbiAgICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLm1hdHJpeCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5tYXRyaXggPSBuZXcgVHdvLkFycmF5KDkpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJlZHVjZSBhbW91bnQgb2Ygb2JqZWN0IC8gYXJyYXkgY3JlYXRpb24gLyBkZWxldGlvblxyXG5cclxuICAgICAgICAgIHRoaXMuX21hdHJpeC50b0FycmF5KHRydWUsIHRyYW5zZm9ybWF0aW9uKTtcclxuXHJcbiAgICAgICAgICBtdWx0aXBseU1hdHJpeCh0cmFuc2Zvcm1hdGlvbiwgcGFyZW50Ll9yZW5kZXJlci5tYXRyaXgsIHRoaXMuX3JlbmRlcmVyLm1hdHJpeCk7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZSA9IHRoaXMuX3NjYWxlICogcGFyZW50Ll9yZW5kZXJlci5zY2FsZTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZmxhZ1RleHR1cmUpIHtcclxuXHJcbiAgICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLnJlY3QpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIucmVjdCA9IHt9O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIudHJpYW5nbGVzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnRyaWFuZ2xlcyA9IG5ldyBUd28uQXJyYXkoMTIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5ICogcGFyZW50Ll9yZW5kZXJlci5vcGFjaXR5O1xyXG5cclxuICAgICAgICAgIHdlYmdsLnBhdGguZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMuX3ZlcnRpY2VzLCB0aGlzLl9saW5ld2lkdGgsIHRoaXMuX3JlbmRlcmVyLnJlY3QpO1xyXG4gICAgICAgICAgd2ViZ2wuZ2V0VHJpYW5nbGVzKHRoaXMuX3JlbmRlcmVyLnJlY3QsIHRoaXMuX3JlbmRlcmVyLnRyaWFuZ2xlcyk7XHJcblxyXG4gICAgICAgICAgd2ViZ2wudXBkYXRlQnVmZmVyLmNhbGwod2ViZ2wsIGdsLCB0aGlzLCBwcm9ncmFtKTtcclxuICAgICAgICAgIHdlYmdsLnVwZGF0ZVRleHR1cmUuY2FsbCh3ZWJnbCwgZ2wsIHRoaXMpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmICh0aGlzLl9tYXNrKSB7XHJcbiAgICAgICAgLy8gICB3ZWJnbFt0aGlzLl9tYXNrLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChtYXNrLCBnbCwgcHJvZ3JhbSwgdGhpcyk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fY2xpcCAmJiAhZm9yY2VkUGFyZW50KSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEcmF3IFRleHR1cmVcclxuXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuX3JlbmRlcmVyLnRleHR1cmVDb29yZHNCdWZmZXIpO1xyXG5cclxuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHByb2dyYW0udGV4dHVyZUNvb3JkcywgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuXHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5fcmVuZGVyZXIudGV4dHVyZSk7XHJcblxyXG5cclxuICAgICAgICAvLyBEcmF3IFJlY3RcclxuXHJcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDNmdihwcm9ncmFtLm1hdHJpeCwgZmFsc2UsIHRoaXMuX3JlbmRlcmVyLm1hdHJpeCk7XHJcblxyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLl9yZW5kZXJlci5idWZmZXIpO1xyXG5cclxuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHByb2dyYW0ucG9zaXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCA2KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0OiB7XHJcblxyXG4gICAgICB1cGRhdGVDYW52YXM6IGZ1bmN0aW9uKGVsZW0pIHtcclxuXHJcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMuY2FudmFzO1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmN0eDtcclxuXHJcbiAgICAgICAgLy8gU3R5bGVzXHJcbiAgICAgICAgdmFyIHNjYWxlID0gZWxlbS5fcmVuZGVyZXIuc2NhbGU7XHJcbiAgICAgICAgdmFyIHN0cm9rZSA9IGVsZW0uX3N0cm9rZTtcclxuICAgICAgICB2YXIgbGluZXdpZHRoID0gZWxlbS5fbGluZXdpZHRoICogc2NhbGU7XHJcbiAgICAgICAgdmFyIGZpbGwgPSBlbGVtLl9maWxsO1xyXG4gICAgICAgIHZhciBvcGFjaXR5ID0gZWxlbS5fcmVuZGVyZXIub3BhY2l0eSB8fCBlbGVtLl9vcGFjaXR5O1xyXG5cclxuICAgICAgICBjYW52YXMud2lkdGggPSBNYXRoLm1heChNYXRoLmNlaWwoZWxlbS5fcmVuZGVyZXIucmVjdC53aWR0aCAqIHNjYWxlKSwgMSk7XHJcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IE1hdGgubWF4KE1hdGguY2VpbChlbGVtLl9yZW5kZXJlci5yZWN0LmhlaWdodCAqIHNjYWxlKSwgMSk7XHJcblxyXG4gICAgICAgIHZhciBjZW50cm9pZCA9IGVsZW0uX3JlbmRlcmVyLnJlY3QuY2VudHJvaWQ7XHJcbiAgICAgICAgdmFyIGN4ID0gY2VudHJvaWQueDtcclxuICAgICAgICB2YXIgY3kgPSBjZW50cm9pZC55O1xyXG5cclxuICAgICAgICB2YXIgYSwgYiwgYywgZCwgZSwgc3gsIHN5O1xyXG4gICAgICAgIHZhciBpc09mZnNldCA9IGZpbGwuX3JlbmRlcmVyICYmIGZpbGwuX3JlbmRlcmVyLm9mZnNldFxyXG4gICAgICAgICAgJiYgc3Ryb2tlLl9yZW5kZXJlciAmJiBzdHJva2UuX3JlbmRlcmVyLm9mZnNldDtcclxuXHJcbiAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG5cclxuICAgICAgICBpZiAoIWlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICBjdHguZm9udCA9IFtlbGVtLl9zdHlsZSwgZWxlbS5fd2VpZ2h0LCBlbGVtLl9zaXplICsgJ3B4LycgK1xyXG4gICAgICAgICAgICBlbGVtLl9sZWFkaW5nICsgJ3B4JywgZWxlbS5fZmFtaWx5XS5qb2luKCcgJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XHJcbiAgICAgICAgY3R4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xyXG5cclxuICAgICAgICAvLyBTdHlsZXNcclxuICAgICAgICBpZiAoZmlsbCkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoZmlsbCkpIHtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGZpbGw7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3ZWJnbFtmaWxsLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChmaWxsLCBjdHgsIGVsZW0pO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZmlsbC5fcmVuZGVyZXIuZWZmZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3Ryb2tlKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyhzdHJva2UpKSB7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdlYmdsW3N0cm9rZS5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoc3Ryb2tlLCBjdHgsIGVsZW0pO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2UuX3JlbmRlcmVyLmVmZmVjdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxpbmV3aWR0aCkge1xyXG4gICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGxpbmV3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNOdW1iZXIob3BhY2l0eSkpIHtcclxuICAgICAgICAgIGN0eC5nbG9iYWxBbHBoYSA9IG9wYWNpdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgIGN0eC5zY2FsZShzY2FsZSwgc2NhbGUpO1xyXG4gICAgICAgIGN0eC50cmFuc2xhdGUoY3gsIGN5KTtcclxuXHJcbiAgICAgICAgaWYgKCF3ZWJnbC5pc0hpZGRlbi50ZXN0KGZpbGwpKSB7XHJcblxyXG4gICAgICAgICAgaWYgKGZpbGwuX3JlbmRlcmVyICYmIGZpbGwuX3JlbmRlcmVyLm9mZnNldCkge1xyXG5cclxuICAgICAgICAgICAgc3ggPSB0b0ZpeGVkKGZpbGwuX3JlbmRlcmVyLnNjYWxlLngpO1xyXG4gICAgICAgICAgICBzeSA9IHRvRml4ZWQoZmlsbC5fcmVuZGVyZXIuc2NhbGUueSk7XHJcblxyXG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKCAtIHRvRml4ZWQoZmlsbC5fcmVuZGVyZXIub2Zmc2V0LngpLFxyXG4gICAgICAgICAgICAgIC0gdG9GaXhlZChmaWxsLl9yZW5kZXJlci5vZmZzZXQueSkpO1xyXG4gICAgICAgICAgICBjdHguc2NhbGUoc3gsIHN5KTtcclxuXHJcbiAgICAgICAgICAgIGEgPSBlbGVtLl9zaXplIC8gZmlsbC5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgYiA9IGVsZW0uX2xlYWRpbmcgLyBmaWxsLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICBjdHguZm9udCA9IFtlbGVtLl9zdHlsZSwgZWxlbS5fd2VpZ2h0LCB0b0ZpeGVkKGEpICsgJ3B4LycsXHJcbiAgICAgICAgICAgICAgdG9GaXhlZChiKSArICdweCcsIGVsZW0uX2ZhbWlseV0uam9pbignICcpO1xyXG5cclxuICAgICAgICAgICAgYyA9IGZpbGwuX3JlbmRlcmVyLm9mZnNldC54IC8gZmlsbC5fcmVuZGVyZXIuc2NhbGUueDtcclxuICAgICAgICAgICAgZCA9IGZpbGwuX3JlbmRlcmVyLm9mZnNldC55IC8gZmlsbC5fcmVuZGVyZXIuc2NhbGUueTtcclxuXHJcbiAgICAgICAgICAgIGN0eC5maWxsVGV4dChlbGVtLnZhbHVlLCB0b0ZpeGVkKGMpLCB0b0ZpeGVkKGQpKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdHguZmlsbFRleHQoZWxlbS52YWx1ZSwgMCwgMCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF3ZWJnbC5pc0hpZGRlbi50ZXN0KHN0cm9rZSkpIHtcclxuXHJcbiAgICAgICAgICBpZiAoc3Ryb2tlLl9yZW5kZXJlciAmJiBzdHJva2UuX3JlbmRlcmVyLm9mZnNldCkge1xyXG5cclxuICAgICAgICAgICAgc3ggPSB0b0ZpeGVkKHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueCk7XHJcbiAgICAgICAgICAgIHN5ID0gdG9GaXhlZChzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnkpO1xyXG5cclxuICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSgtIHRvRml4ZWQoc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueCksXHJcbiAgICAgICAgICAgICAgLSB0b0ZpeGVkKHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LnkpKTtcclxuICAgICAgICAgICAgY3R4LnNjYWxlKHN4LCBzeSk7XHJcblxyXG4gICAgICAgICAgICBhID0gZWxlbS5fc2l6ZSAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgYiA9IGVsZW0uX2xlYWRpbmcgLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgIGN0eC5mb250ID0gW2VsZW0uX3N0eWxlLCBlbGVtLl93ZWlnaHQsIHRvRml4ZWQoYSkgKyAncHgvJyxcclxuICAgICAgICAgICAgICB0b0ZpeGVkKGIpICsgJ3B4JywgZWxlbS5fZmFtaWx5XS5qb2luKCcgJyk7XHJcblxyXG4gICAgICAgICAgICBjID0gc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueCAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueDtcclxuICAgICAgICAgICAgZCA9IHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LnkgLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgIGUgPSBsaW5ld2lkdGggLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLng7XHJcblxyXG4gICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdG9GaXhlZChlKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVRleHQoZWxlbS52YWx1ZSwgdG9GaXhlZChjKSwgdG9GaXhlZChkKSk7XHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVRleHQoZWxlbS52YWx1ZSwgMCwgMCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IGZ1bmN0aW9uKGVsZW0sIHJlY3QpIHtcclxuXHJcbiAgICAgICAgdmFyIGN0eCA9IHdlYmdsLmN0eDtcclxuXHJcbiAgICAgICAgY3R4LmZvbnQgPSBbZWxlbS5fc3R5bGUsIGVsZW0uX3dlaWdodCwgZWxlbS5fc2l6ZSArICdweC8nICtcclxuICAgICAgICAgIGVsZW0uX2xlYWRpbmcgKyAncHgnLCBlbGVtLl9mYW1pbHldLmpvaW4oJyAnKTtcclxuXHJcbiAgICAgICAgY3R4LnRleHRBbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSBlbGVtLl9iYXNlbGluZTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogRXN0aW1hdGUgdGhpcyBiZXR0ZXJcclxuICAgICAgICB2YXIgd2lkdGggPSBjdHgubWVhc3VyZVRleHQoZWxlbS5fdmFsdWUpLndpZHRoO1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBNYXRoLm1heChlbGVtLl9zaXplIHx8IGVsZW0uX2xlYWRpbmcpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fbGluZXdpZHRoICYmICF3ZWJnbC5pc0hpZGRlbi50ZXN0KHRoaXMuX3N0cm9rZSkpIHtcclxuICAgICAgICAgIC8vIHdpZHRoICs9IHRoaXMuX2xpbmV3aWR0aDsgLy8gVE9ETzogTm90IHN1cmUgaWYgdGhlIGBtZWFzdXJlYCBjYWxjcyB0aGlzLlxyXG4gICAgICAgICAgaGVpZ2h0ICs9IHRoaXMuX2xpbmV3aWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB3ID0gd2lkdGggLyAyO1xyXG4gICAgICAgIHZhciBoID0gaGVpZ2h0IC8gMjtcclxuXHJcbiAgICAgICAgc3dpdGNoICh3ZWJnbC5hbGlnbm1lbnRzW2VsZW0uX2FsaWdubWVudF0gfHwgZWxlbS5fYWxpZ25tZW50KSB7XHJcblxyXG4gICAgICAgICAgY2FzZSB3ZWJnbC5hbGlnbm1lbnRzLmxlZnQ6XHJcbiAgICAgICAgICAgIHJlY3QubGVmdCA9IDA7XHJcbiAgICAgICAgICAgIHJlY3QucmlnaHQgPSB3aWR0aDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlIHdlYmdsLmFsaWdubWVudHMucmlnaHQ6XHJcbiAgICAgICAgICAgIHJlY3QubGVmdCA9IC0gd2lkdGg7XHJcbiAgICAgICAgICAgIHJlY3QucmlnaHQgPSAwO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJlY3QubGVmdCA9IC0gdztcclxuICAgICAgICAgICAgcmVjdC5yaWdodCA9IHc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUT0RPOiBHcmFkaWVudHMgYXJlbid0IGluaGVyaXRlZC4uLlxyXG4gICAgICAgIHN3aXRjaCAoZWxlbS5fYmFzZWxpbmUpIHtcclxuICAgICAgICAgIGNhc2UgJ2JvdHRvbSc6XHJcbiAgICAgICAgICAgIHJlY3QudG9wID0gLSBoZWlnaHQ7XHJcbiAgICAgICAgICAgIHJlY3QuYm90dG9tID0gMDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICd0b3AnOlxyXG4gICAgICAgICAgICByZWN0LnRvcCA9IDA7XHJcbiAgICAgICAgICAgIHJlY3QuYm90dG9tID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJlY3QudG9wID0gLSBoO1xyXG4gICAgICAgICAgICByZWN0LmJvdHRvbSA9IGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWN0LndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgcmVjdC5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICAgIGlmICghcmVjdC5jZW50cm9pZCkge1xyXG4gICAgICAgICAgcmVjdC5jZW50cm9pZCA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVE9ETzpcclxuICAgICAgICByZWN0LmNlbnRyb2lkLnggPSB3O1xyXG4gICAgICAgIHJlY3QuY2VudHJvaWQueSA9IGg7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihnbCwgcHJvZ3JhbSwgZm9yY2VkUGFyZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fdmlzaWJsZSB8fCAhdGhpcy5fb3BhY2l0eSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHdoYXQgY2hhbmdlZFxyXG5cclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XHJcbiAgICAgICAgdmFyIGZsYWdQYXJlbnRNYXRyaXggPSBwYXJlbnQuX21hdHJpeC5tYW51YWwgfHwgcGFyZW50Ll9mbGFnTWF0cml4O1xyXG4gICAgICAgIHZhciBmbGFnTWF0cml4ID0gdGhpcy5fbWF0cml4Lm1hbnVhbCB8fCB0aGlzLl9mbGFnTWF0cml4O1xyXG4gICAgICAgIHZhciBmbGFnVGV4dHVyZSA9IHRoaXMuX2ZsYWdWZXJ0aWNlcyB8fCB0aGlzLl9mbGFnRmlsbFxyXG4gICAgICAgICAgfHwgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnQgJiYgKHRoaXMuX2ZpbGwuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fZmlsbC5fZmxhZ1N0b3BzIHx8IHRoaXMuX2ZpbGwuX2ZsYWdFbmRQb2ludHMpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnQgJiYgKHRoaXMuX2ZpbGwuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fZmlsbC5fZmxhZ1N0b3BzIHx8IHRoaXMuX2ZpbGwuX2ZsYWdSYWRpdXMgfHwgdGhpcy5fZmlsbC5fZmxhZ0NlbnRlciB8fCB0aGlzLl9maWxsLl9mbGFnRm9jYWwpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSAmJiAodGhpcy5fZmlsbC5fZmxhZ0xvYWRlZCAmJiB0aGlzLl9maWxsLmxvYWRlZCkpXHJcbiAgICAgICAgICB8fCAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50ICYmICh0aGlzLl9zdHJva2UuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnU3RvcHMgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnRW5kUG9pbnRzKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnQgJiYgKHRoaXMuX3N0cm9rZS5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9zdHJva2UuX2ZsYWdTdG9wcyB8fCB0aGlzLl9zdHJva2UuX2ZsYWdSYWRpdXMgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnQ2VudGVyIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ0ZvY2FsKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl90ZXh0dXJlIGluc3RhbmNlb2YgVHdvLlRleHR1cmUgJiYgKHRoaXMuX3RleHR1cmUuX2ZsYWdMb2FkZWQgJiYgdGhpcy5fdGV4dHVyZS5sb2FkZWQpKVxyXG4gICAgICAgICAgfHwgdGhpcy5fZmxhZ1N0cm9rZSB8fCB0aGlzLl9mbGFnTGluZXdpZHRoIHx8IHRoaXMuX2ZsYWdPcGFjaXR5XHJcbiAgICAgICAgICB8fCBwYXJlbnQuX2ZsYWdPcGFjaXR5IHx8IHRoaXMuX2ZsYWdWaXNpYmxlIHx8IHRoaXMuX2ZsYWdTY2FsZVxyXG4gICAgICAgICAgfHwgdGhpcy5fZmxhZ1ZhbHVlIHx8IHRoaXMuX2ZsYWdGYW1pbHkgfHwgdGhpcy5fZmxhZ1NpemVcclxuICAgICAgICAgIHx8IHRoaXMuX2ZsYWdMZWFkaW5nIHx8IHRoaXMuX2ZsYWdBbGlnbm1lbnQgfHwgdGhpcy5fZmxhZ0Jhc2VsaW5lXHJcbiAgICAgICAgICB8fCB0aGlzLl9mbGFnU3R5bGUgfHwgdGhpcy5fZmxhZ1dlaWdodCB8fCB0aGlzLl9mbGFnRGVjb3JhdGlvblxyXG4gICAgICAgICAgfHwgIXRoaXMuX3JlbmRlcmVyLnRleHR1cmU7XHJcblxyXG4gICAgICAgIGlmIChmbGFnUGFyZW50TWF0cml4IHx8IGZsYWdNYXRyaXgpIHtcclxuXHJcbiAgICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLm1hdHJpeCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5tYXRyaXggPSBuZXcgVHdvLkFycmF5KDkpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFJlZHVjZSBhbW91bnQgb2Ygb2JqZWN0IC8gYXJyYXkgY3JlYXRpb24gLyBkZWxldGlvblxyXG5cclxuICAgICAgICAgIHRoaXMuX21hdHJpeC50b0FycmF5KHRydWUsIHRyYW5zZm9ybWF0aW9uKTtcclxuXHJcbiAgICAgICAgICBtdWx0aXBseU1hdHJpeCh0cmFuc2Zvcm1hdGlvbiwgcGFyZW50Ll9yZW5kZXJlci5tYXRyaXgsIHRoaXMuX3JlbmRlcmVyLm1hdHJpeCk7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZSA9IHRoaXMuX3NjYWxlICogcGFyZW50Ll9yZW5kZXJlci5zY2FsZTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZmxhZ1RleHR1cmUpIHtcclxuXHJcbiAgICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLnJlY3QpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIucmVjdCA9IHt9O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIudHJpYW5nbGVzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnRyaWFuZ2xlcyA9IG5ldyBUd28uQXJyYXkoMTIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5ICogcGFyZW50Ll9yZW5kZXJlci5vcGFjaXR5O1xyXG5cclxuICAgICAgICAgIHdlYmdsLnRleHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRoaXMsIHRoaXMuX3JlbmRlcmVyLnJlY3QpO1xyXG4gICAgICAgICAgd2ViZ2wuZ2V0VHJpYW5nbGVzKHRoaXMuX3JlbmRlcmVyLnJlY3QsIHRoaXMuX3JlbmRlcmVyLnRyaWFuZ2xlcyk7XHJcblxyXG4gICAgICAgICAgd2ViZ2wudXBkYXRlQnVmZmVyLmNhbGwod2ViZ2wsIGdsLCB0aGlzLCBwcm9ncmFtKTtcclxuICAgICAgICAgIHdlYmdsLnVwZGF0ZVRleHR1cmUuY2FsbCh3ZWJnbCwgZ2wsIHRoaXMpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmICh0aGlzLl9tYXNrKSB7XHJcbiAgICAgICAgLy8gICB3ZWJnbFt0aGlzLl9tYXNrLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChtYXNrLCBnbCwgcHJvZ3JhbSwgdGhpcyk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fY2xpcCAmJiAhZm9yY2VkUGFyZW50KSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEcmF3IFRleHR1cmVcclxuXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuX3JlbmRlcmVyLnRleHR1cmVDb29yZHNCdWZmZXIpO1xyXG5cclxuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHByb2dyYW0udGV4dHVyZUNvb3JkcywgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuXHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5fcmVuZGVyZXIudGV4dHVyZSk7XHJcblxyXG5cclxuICAgICAgICAvLyBEcmF3IFJlY3RcclxuXHJcbiAgICAgICAgZ2wudW5pZm9ybU1hdHJpeDNmdihwcm9ncmFtLm1hdHJpeCwgZmFsc2UsIHRoaXMuX3JlbmRlcmVyLm1hdHJpeCk7XHJcblxyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLl9yZW5kZXJlci5idWZmZXIpO1xyXG5cclxuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHByb2dyYW0ucG9zaXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCA2KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAnbGluZWFyLWdyYWRpZW50Jzoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIGVsZW0pIHtcclxuXHJcbiAgICAgICAgaWYgKCFjdHguY2FudmFzLmdldENvbnRleHQoJzJkJykpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVmZmVjdCB8fCB0aGlzLl9mbGFnRW5kUG9pbnRzIHx8IHRoaXMuX2ZsYWdTdG9wcykge1xyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudChcclxuICAgICAgICAgICAgdGhpcy5sZWZ0Ll94LCB0aGlzLmxlZnQuX3ksXHJcbiAgICAgICAgICAgIHRoaXMucmlnaHQuX3gsIHRoaXMucmlnaHQuX3lcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0b3BzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzdG9wID0gdGhpcy5zdG9wc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0LmFkZENvbG9yU3RvcChzdG9wLl9vZmZzZXQsIHN0b3AuX2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgICdyYWRpYWwtZ3JhZGllbnQnOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgZWxlbSkge1xyXG5cclxuICAgICAgICBpZiAoIWN0eC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWZmZWN0IHx8IHRoaXMuX2ZsYWdDZW50ZXIgfHwgdGhpcy5fZmxhZ0ZvY2FsXHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZsYWdSYWRpdXMgfHwgdGhpcy5fZmxhZ1N0b3BzKSB7XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0ID0gY3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KFxyXG4gICAgICAgICAgICB0aGlzLmNlbnRlci5feCwgdGhpcy5jZW50ZXIuX3ksIDAsXHJcbiAgICAgICAgICAgIHRoaXMuZm9jYWwuX3gsIHRoaXMuZm9jYWwuX3ksIHRoaXMuX3JhZGl1c1xyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3RvcHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHN0b3AgPSB0aGlzLnN0b3BzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QuYWRkQ29sb3JTdG9wKHN0b3AuX29mZnNldCwgc3RvcC5fY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdGV4dHVyZToge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIGVsZW0pIHtcclxuXHJcbiAgICAgICAgaWYgKCFjdHguY2FudmFzLmdldENvbnRleHQoJzJkJykpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICB2YXIgaW1hZ2UgPSB0aGlzLmltYWdlO1xyXG4gICAgICAgIHZhciByZXBlYXQ7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWZmZWN0IHx8ICgodGhpcy5fZmxhZ0xvYWRlZCB8fCB0aGlzLl9mbGFnUmVwZWF0KSAmJiB0aGlzLmxvYWRlZCkpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdCA9IGN0eC5jcmVhdGVQYXR0ZXJuKGltYWdlLCB0aGlzLl9yZXBlYXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdPZmZzZXQgfHwgdGhpcy5fZmxhZ0xvYWRlZCB8fCB0aGlzLl9mbGFnU2NhbGUpIHtcclxuXHJcbiAgICAgICAgICBpZiAoISh0aGlzLl9yZW5kZXJlci5vZmZzZXQgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQgPSBuZXcgVHdvLlZlY3RvcigpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC54ID0gdGhpcy5fb2Zmc2V0Lng7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueSA9IHRoaXMuX29mZnNldC55O1xyXG5cclxuICAgICAgICAgIGlmIChpbWFnZSkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnggLT0gaW1hZ2Uud2lkdGggLyAyO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueSArPSBpbWFnZS5oZWlnaHQgLyAyO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC54ICo9IHRoaXMuX3NjYWxlLng7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnkgKj0gdGhpcy5fc2NhbGUueTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueCAqPSB0aGlzLl9zY2FsZTtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueSAqPSB0aGlzLl9zY2FsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU2NhbGUgfHwgdGhpcy5fZmxhZ0xvYWRlZCkge1xyXG5cclxuICAgICAgICAgIGlmICghKHRoaXMuX3JlbmRlcmVyLnNjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3RvcikpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUgPSBuZXcgVHdvLlZlY3RvcigpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUuY29weSh0aGlzLl9zY2FsZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZS5zZXQodGhpcy5fc2NhbGUsIHRoaXMuX3NjYWxlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGdldFRyaWFuZ2xlczogZnVuY3Rpb24ocmVjdCwgdHJpYW5nbGVzKSB7XHJcblxyXG4gICAgICB2YXIgdG9wID0gcmVjdC50b3AsXHJcbiAgICAgICAgICBsZWZ0ID0gcmVjdC5sZWZ0LFxyXG4gICAgICAgICAgcmlnaHQgPSByZWN0LnJpZ2h0LFxyXG4gICAgICAgICAgYm90dG9tID0gcmVjdC5ib3R0b207XHJcblxyXG4gICAgICAvLyBGaXJzdCBUcmlhbmdsZVxyXG5cclxuICAgICAgdHJpYW5nbGVzWzBdID0gbGVmdDtcclxuICAgICAgdHJpYW5nbGVzWzFdID0gdG9wO1xyXG5cclxuICAgICAgdHJpYW5nbGVzWzJdID0gcmlnaHQ7XHJcbiAgICAgIHRyaWFuZ2xlc1szXSA9IHRvcDtcclxuXHJcbiAgICAgIHRyaWFuZ2xlc1s0XSA9IGxlZnQ7XHJcbiAgICAgIHRyaWFuZ2xlc1s1XSA9IGJvdHRvbTtcclxuXHJcbiAgICAgIC8vIFNlY29uZCBUcmlhbmdsZVxyXG5cclxuICAgICAgdHJpYW5nbGVzWzZdID0gbGVmdDtcclxuICAgICAgdHJpYW5nbGVzWzddID0gYm90dG9tO1xyXG5cclxuICAgICAgdHJpYW5nbGVzWzhdID0gcmlnaHQ7XHJcbiAgICAgIHRyaWFuZ2xlc1s5XSA9IHRvcDtcclxuXHJcbiAgICAgIHRyaWFuZ2xlc1sxMF0gPSByaWdodDtcclxuICAgICAgdHJpYW5nbGVzWzExXSA9IGJvdHRvbTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZVRleHR1cmU6IGZ1bmN0aW9uKGdsLCBlbGVtKSB7XHJcblxyXG4gICAgICB0aGlzW2VsZW0uX3JlbmRlcmVyLnR5cGVdLnVwZGF0ZUNhbnZhcy5jYWxsKHdlYmdsLCBlbGVtKTtcclxuXHJcbiAgICAgIGlmIChlbGVtLl9yZW5kZXJlci50ZXh0dXJlKSB7XHJcbiAgICAgICAgZ2wuZGVsZXRlVGV4dHVyZShlbGVtLl9yZW5kZXJlci50ZXh0dXJlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGVsZW0uX3JlbmRlcmVyLnRleHR1cmVDb29yZHNCdWZmZXIpO1xyXG5cclxuICAgICAgLy8gVE9ETzogSXMgdGhpcyBuZWNlc3NhcnkgZXZlcnkgdGltZSBvciBjYW4gd2UgZG8gb25jZT9cclxuICAgICAgLy8gVE9ETzogQ3JlYXRlIGEgcmVnaXN0cnkgZm9yIHRleHR1cmVzXHJcbiAgICAgIGVsZW0uX3JlbmRlcmVyLnRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGVsZW0uX3JlbmRlcmVyLnRleHR1cmUpO1xyXG5cclxuICAgICAgLy8gU2V0IHRoZSBwYXJhbWV0ZXJzIHNvIHdlIGNhbiByZW5kZXIgYW55IHNpemUgaW1hZ2UuXHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUik7XHJcbiAgICAgIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAvLyBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcbiAgICAgIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLmNhbnZhcy53aWR0aCA8PSAwIHx8IHRoaXMuY2FudmFzLmhlaWdodCA8PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBVcGxvYWQgdGhlIGltYWdlIGludG8gdGhlIHRleHR1cmUuXHJcbiAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgdGhpcy5jYW52YXMpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlQnVmZmVyOiBmdW5jdGlvbihnbCwgZWxlbSwgcHJvZ3JhbSkge1xyXG5cclxuICAgICAgaWYgKF8uaXNPYmplY3QoZWxlbS5fcmVuZGVyZXIuYnVmZmVyKSkge1xyXG4gICAgICAgIGdsLmRlbGV0ZUJ1ZmZlcihlbGVtLl9yZW5kZXJlci5idWZmZXIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBlbGVtLl9yZW5kZXJlci5idWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBlbGVtLl9yZW5kZXJlci5idWZmZXIpO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShwcm9ncmFtLnBvc2l0aW9uKTtcclxuXHJcbiAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBlbGVtLl9yZW5kZXJlci50cmlhbmdsZXMsIGdsLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICAgIGlmIChfLmlzT2JqZWN0KGVsZW0uX3JlbmRlcmVyLnRleHR1cmVDb29yZHNCdWZmZXIpKSB7XHJcbiAgICAgICAgZ2wuZGVsZXRlQnVmZmVyKGVsZW0uX3JlbmRlcmVyLnRleHR1cmVDb29yZHNCdWZmZXIpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBlbGVtLl9yZW5kZXJlci50ZXh0dXJlQ29vcmRzQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcblxyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgZWxlbS5fcmVuZGVyZXIudGV4dHVyZUNvb3Jkc0J1ZmZlcik7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHByb2dyYW0udGV4dHVyZUNvb3Jkcyk7XHJcblxyXG4gICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy51diwgZ2wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcHJvZ3JhbToge1xyXG5cclxuICAgICAgY3JlYXRlOiBmdW5jdGlvbihnbCwgc2hhZGVycykge1xyXG4gICAgICAgIHZhciBwcm9ncmFtLCBsaW5rZWQsIGVycm9yO1xyXG4gICAgICAgIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XHJcbiAgICAgICAgXy5lYWNoKHNoYWRlcnMsIGZ1bmN0aW9uKHMpIHtcclxuICAgICAgICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICAgICAgbGlua2VkID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUyk7XHJcbiAgICAgICAgaWYgKCFsaW5rZWQpIHtcclxuICAgICAgICAgIGVycm9yID0gZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSk7XHJcbiAgICAgICAgICBnbC5kZWxldGVQcm9ncmFtKHByb2dyYW0pO1xyXG4gICAgICAgICAgdGhyb3cgbmV3IFR3by5VdGlscy5FcnJvcigndW5hYmxlIHRvIGxpbmsgcHJvZ3JhbTogJyArIGVycm9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9ncmFtO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgc2hhZGVyczoge1xyXG5cclxuICAgICAgY3JlYXRlOiBmdW5jdGlvbihnbCwgc291cmNlLCB0eXBlKSB7XHJcbiAgICAgICAgdmFyIHNoYWRlciwgY29tcGlsZWQsIGVycm9yO1xyXG4gICAgICAgIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbFt0eXBlXSk7XHJcbiAgICAgICAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG4gICAgICAgIGNvbXBpbGVkID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpO1xyXG4gICAgICAgIGlmICghY29tcGlsZWQpIHtcclxuICAgICAgICAgIGVycm9yID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xyXG4gICAgICAgICAgZ2wuZGVsZXRlU2hhZGVyKHNoYWRlcik7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgVHdvLlV0aWxzLkVycm9yKCd1bmFibGUgdG8gY29tcGlsZSBzaGFkZXIgJyArIHNoYWRlciArICc6ICcgKyBlcnJvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2hhZGVyO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIHR5cGVzOiB7XHJcbiAgICAgICAgdmVydGV4OiAnVkVSVEVYX1NIQURFUicsXHJcbiAgICAgICAgZnJhZ21lbnQ6ICdGUkFHTUVOVF9TSEFERVInXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICB2ZXJ0ZXg6IFtcclxuICAgICAgICAnYXR0cmlidXRlIHZlYzIgYV9wb3NpdGlvbjsnLFxyXG4gICAgICAgICdhdHRyaWJ1dGUgdmVjMiBhX3RleHR1cmVDb29yZHM7JyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAndW5pZm9ybSBtYXQzIHVfbWF0cml4OycsXHJcbiAgICAgICAgJ3VuaWZvcm0gdmVjMiB1X3Jlc29sdXRpb247JyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAndmFyeWluZyB2ZWMyIHZfdGV4dHVyZUNvb3JkczsnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcclxuICAgICAgICAnICAgdmVjMiBwcm9qZWN0ZWQgPSAodV9tYXRyaXggKiB2ZWMzKGFfcG9zaXRpb24sIDEuMCkpLnh5OycsXHJcbiAgICAgICAgJyAgIHZlYzIgbm9ybWFsID0gcHJvamVjdGVkIC8gdV9yZXNvbHV0aW9uOycsXHJcbiAgICAgICAgJyAgIHZlYzIgY2xpcHNwYWNlID0gKG5vcm1hbCAqIDIuMCkgLSAxLjA7JyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAnICAgZ2xfUG9zaXRpb24gPSB2ZWM0KGNsaXBzcGFjZSAqIHZlYzIoMS4wLCAtMS4wKSwgMC4wLCAxLjApOycsXHJcbiAgICAgICAgJyAgIHZfdGV4dHVyZUNvb3JkcyA9IGFfdGV4dHVyZUNvb3JkczsnLFxyXG4gICAgICAgICd9J1xyXG4gICAgICBdLmpvaW4oJ1xcbicpLFxyXG5cclxuICAgICAgZnJhZ21lbnQ6IFtcclxuICAgICAgICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAndW5pZm9ybSBzYW1wbGVyMkQgdV9pbWFnZTsnLFxyXG4gICAgICAgICd2YXJ5aW5nIHZlYzIgdl90ZXh0dXJlQ29vcmRzOycsXHJcbiAgICAgICAgJycsXHJcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxyXG4gICAgICAgICcgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1X2ltYWdlLCB2X3RleHR1cmVDb29yZHMpOycsXHJcbiAgICAgICAgJ30nXHJcbiAgICAgIF0uam9pbignXFxuJylcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIFRleHR1cmVSZWdpc3RyeTogbmV3IFR3by5SZWdpc3RyeSgpXHJcblxyXG4gIH07XHJcblxyXG4gIHdlYmdsLmN0eCA9IHdlYmdsLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICB2YXIgUmVuZGVyZXIgPSBUd29bVHdvLlR5cGVzLndlYmdsXSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuXHJcbiAgICB2YXIgcGFyYW1zLCBnbCwgdnMsIGZzO1xyXG4gICAgdGhpcy5kb21FbGVtZW50ID0gb3B0aW9ucy5kb21FbGVtZW50IHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG5cclxuICAgIC8vIEV2ZXJ5dGhpbmcgZHJhd24gb24gdGhlIGNhbnZhcyBuZWVkcyB0byBjb21lIGZyb20gdGhlIHN0YWdlLlxyXG4gICAgdGhpcy5zY2VuZSA9IG5ldyBUd28uR3JvdXAoKTtcclxuICAgIHRoaXMuc2NlbmUucGFyZW50ID0gdGhpcztcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlciA9IHtcclxuICAgICAgbWF0cml4OiBuZXcgVHdvLkFycmF5KGlkZW50aXR5KSxcclxuICAgICAgc2NhbGU6IDEsXHJcbiAgICAgIG9wYWNpdHk6IDFcclxuICAgIH07XHJcbiAgICB0aGlzLl9mbGFnTWF0cml4ID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBodHRwOi8vZ2FtZXMuZ3JlZ2dtYW4uY29tL2dhbWUvd2ViZ2wtYW5kLWFscGhhL1xyXG4gICAgLy8gaHR0cDovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS93ZWJnbC9zcGVjcy9sYXRlc3QvIzUuMlxyXG4gICAgcGFyYW1zID0gXy5kZWZhdWx0cyhvcHRpb25zIHx8IHt9LCB7XHJcbiAgICAgIGFudGlhbGlhczogZmFsc2UsXHJcbiAgICAgIGFscGhhOiB0cnVlLFxyXG4gICAgICBwcmVtdWx0aXBsaWVkQWxwaGE6IHRydWUsXHJcbiAgICAgIHN0ZW5jaWw6IHRydWUsXHJcbiAgICAgIHByZXNlcnZlRHJhd2luZ0J1ZmZlcjogdHJ1ZSxcclxuICAgICAgb3ZlcmRyYXc6IGZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLm92ZXJkcmF3ID0gcGFyYW1zLm92ZXJkcmF3O1xyXG5cclxuICAgIGdsID0gdGhpcy5jdHggPSB0aGlzLmRvbUVsZW1lbnQuZ2V0Q29udGV4dCgnd2ViZ2wnLCBwYXJhbXMpIHx8XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBwYXJhbXMpO1xyXG5cclxuICAgIGlmICghdGhpcy5jdHgpIHtcclxuICAgICAgdGhyb3cgbmV3IFR3by5VdGlscy5FcnJvcihcclxuICAgICAgICAndW5hYmxlIHRvIGNyZWF0ZSBhIHdlYmdsIGNvbnRleHQuIFRyeSB1c2luZyBhbm90aGVyIHJlbmRlcmVyLicpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENvbXBpbGUgQmFzZSBTaGFkZXJzIHRvIGRyYXcgaW4gcGl4ZWwgc3BhY2UuXHJcbiAgICB2cyA9IHdlYmdsLnNoYWRlcnMuY3JlYXRlKFxyXG4gICAgICBnbCwgd2ViZ2wuc2hhZGVycy52ZXJ0ZXgsIHdlYmdsLnNoYWRlcnMudHlwZXMudmVydGV4KTtcclxuICAgIGZzID0gd2ViZ2wuc2hhZGVycy5jcmVhdGUoXHJcbiAgICAgIGdsLCB3ZWJnbC5zaGFkZXJzLmZyYWdtZW50LCB3ZWJnbC5zaGFkZXJzLnR5cGVzLmZyYWdtZW50KTtcclxuXHJcbiAgICB0aGlzLnByb2dyYW0gPSB3ZWJnbC5wcm9ncmFtLmNyZWF0ZShnbCwgW3ZzLCBmc10pO1xyXG4gICAgZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhbmQgYmluZCB0aGUgZHJhd2luZyBidWZmZXJcclxuXHJcbiAgICAvLyBsb29rIHVwIHdoZXJlIHRoZSB2ZXJ0ZXggZGF0YSBuZWVkcyB0byBnby5cclxuICAgIHRoaXMucHJvZ3JhbS5wb3NpdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgJ2FfcG9zaXRpb24nKTtcclxuICAgIHRoaXMucHJvZ3JhbS5tYXRyaXggPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5wcm9ncmFtLCAndV9tYXRyaXgnKTtcclxuICAgIHRoaXMucHJvZ3JhbS50ZXh0dXJlQ29vcmRzID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5wcm9ncmFtLCAnYV90ZXh0dXJlQ29vcmRzJyk7XHJcblxyXG4gICAgLy8gQ29waWVkIGZyb20gVGhyZWUuanMgV2ViR0xSZW5kZXJlclxyXG4gICAgZ2wuZGlzYWJsZShnbC5ERVBUSF9URVNUKTtcclxuXHJcbiAgICAvLyBTZXR1cCBzb21lIGluaXRpYWwgc3RhdGVtZW50cyBvZiB0aGUgZ2wgY29udGV4dFxyXG4gICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcclxuXHJcbiAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MzE2MzkzXHJcbiAgICAvLyBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGdsLlRSVUUpO1xyXG5cclxuICAgIGdsLmJsZW5kRXF1YXRpb25TZXBhcmF0ZShnbC5GVU5DX0FERCwgZ2wuRlVOQ19BREQpO1xyXG4gICAgZ2wuYmxlbmRGdW5jU2VwYXJhdGUoZ2wuU1JDX0FMUEhBLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBLFxyXG4gICAgICBnbC5PTkUsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEgKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoUmVuZGVyZXIsIHtcclxuXHJcbiAgICBVdGlsczogd2ViZ2xcclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFJlbmRlcmVyLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIHNldFNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIHJhdGlvKSB7XHJcblxyXG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgdGhpcy5yYXRpbyA9IF8uaXNVbmRlZmluZWQocmF0aW8pID8gZ2V0UmF0aW8odGhpcy5jdHgpIDogcmF0aW87XHJcblxyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQud2lkdGggPSB3aWR0aCAqIHRoaXMucmF0aW87XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5oZWlnaHQgPSBoZWlnaHQgKiB0aGlzLnJhdGlvO1xyXG5cclxuICAgICAgXy5leHRlbmQodGhpcy5kb21FbGVtZW50LnN0eWxlLCB7XHJcbiAgICAgICAgd2lkdGg6IHdpZHRoICsgJ3B4JyxcclxuICAgICAgICBoZWlnaHQ6IGhlaWdodCArICdweCdcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB3aWR0aCAqPSB0aGlzLnJhdGlvO1xyXG4gICAgICBoZWlnaHQgKj0gdGhpcy5yYXRpbztcclxuXHJcbiAgICAgIC8vIFNldCBmb3IgdGhpcy5zdGFnZSBwYXJlbnQgc2NhbGluZyB0byBhY2NvdW50IGZvciBIRFBJXHJcbiAgICAgIHRoaXMuX3JlbmRlcmVyLm1hdHJpeFswXSA9IHRoaXMuX3JlbmRlcmVyLm1hdHJpeFs0XSA9IHRoaXMuX3JlbmRlcmVyLnNjYWxlID0gdGhpcy5yYXRpbztcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdNYXRyaXggPSB0cnVlO1xyXG5cclxuICAgICAgdGhpcy5jdHgudmlld3BvcnQoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcblxyXG4gICAgICB2YXIgcmVzb2x1dGlvbkxvY2F0aW9uID0gdGhpcy5jdHguZ2V0VW5pZm9ybUxvY2F0aW9uKFxyXG4gICAgICAgIHRoaXMucHJvZ3JhbSwgJ3VfcmVzb2x1dGlvbicpO1xyXG4gICAgICB0aGlzLmN0eC51bmlmb3JtMmYocmVzb2x1dGlvbkxvY2F0aW9uLCB3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBnbCA9IHRoaXMuY3R4O1xyXG5cclxuICAgICAgaWYgKCF0aGlzLm92ZXJkcmF3KSB7XHJcbiAgICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB3ZWJnbC5ncm91cC5yZW5kZXIuY2FsbCh0aGlzLnNjZW5lLCBnbCwgdGhpcy5wcm9ncmFtKTtcclxuICAgICAgdGhpcy5fZmxhZ01hdHJpeCA9IGZhbHNlO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgU2hhcGUgPSBUd28uU2hhcGUgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBQcml2YXRlIG9iamVjdCBmb3IgcmVuZGVyZXIgc3BlY2lmaWMgdmFyaWFibGVzLlxyXG4gICAgdGhpcy5fcmVuZGVyZXIgPSB7fTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdNYXRyaXggPSBfLmJpbmQoU2hhcGUuRmxhZ01hdHJpeCwgdGhpcyk7XHJcbiAgICB0aGlzLmlzU2hhcGUgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuaWQgPSBUd28uSWRlbnRpZmllciArIFR3by51bmlxdWVJZCgpO1xyXG4gICAgdGhpcy5jbGFzc0xpc3QgPSBbXTtcclxuXHJcbiAgICAvLyBEZWZpbmUgbWF0cml4IHByb3BlcnRpZXMgd2hpY2ggYWxsIGluaGVyaXRlZFxyXG4gICAgLy8gb2JqZWN0cyBvZiBTaGFwZSBoYXZlLlxyXG5cclxuICAgIHRoaXMuX21hdHJpeCA9IG5ldyBUd28uTWF0cml4KCk7XHJcblxyXG4gICAgdGhpcy50cmFuc2xhdGlvbiA9IG5ldyBUd28uVmVjdG9yKCk7XHJcbiAgICB0aGlzLnJvdGF0aW9uID0gMDtcclxuICAgIHRoaXMuc2NhbGUgPSAxO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChTaGFwZSwge1xyXG5cclxuICAgIEZsYWdNYXRyaXg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnTWF0cml4ID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ3RyYW5zbGF0aW9uJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl90cmFuc2xhdGlvbjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgaWYgKHRoaXMuX3RyYW5zbGF0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3RyYW5zbGF0aW9uLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ01hdHJpeCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB0aGlzLl90cmFuc2xhdGlvbiA9IHY7XHJcbiAgICAgICAgICB0aGlzLl90cmFuc2xhdGlvbi5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnTWF0cml4KTtcclxuICAgICAgICAgIFNoYXBlLkZsYWdNYXRyaXguY2FsbCh0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ3JvdGF0aW9uJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9yb3RhdGlvbjtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpcy5fcm90YXRpb24gPSB2O1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ01hdHJpeCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdzY2FsZScsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NjYWxlLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ01hdHJpeCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fc2NhbGUgPSB2O1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2NhbGUuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ01hdHJpeCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fZmxhZ01hdHJpeCA9IHRydWU7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnU2NhbGUgPSB0cnVlO1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFNoYXBlLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIC8vIEZsYWdzXHJcblxyXG4gICAgX2ZsYWdNYXRyaXg6IHRydWUsXHJcbiAgICBfZmxhZ1NjYWxlOiBmYWxzZSxcclxuXHJcbiAgICAvLyBfZmxhZ01hc2s6IGZhbHNlLFxyXG4gICAgLy8gX2ZsYWdDbGlwOiBmYWxzZSxcclxuXHJcbiAgICAvLyBVbmRlcmx5aW5nIFByb3BlcnRpZXNcclxuXHJcbiAgICBfcm90YXRpb246IDAsXHJcbiAgICBfc2NhbGU6IDEsXHJcbiAgICBfdHJhbnNsYXRpb246IG51bGwsXHJcblxyXG4gICAgLy8gX21hc2s6IG51bGwsXHJcbiAgICAvLyBfY2xpcDogZmFsc2UsXHJcblxyXG4gICAgYWRkVG86IGZ1bmN0aW9uKGdyb3VwKSB7XHJcbiAgICAgIGdyb3VwLmFkZCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGNsb25lID0gbmV3IFNoYXBlKCk7XHJcbiAgICAgIGNsb25lLnRyYW5zbGF0aW9uLmNvcHkodGhpcy50cmFuc2xhdGlvbik7XHJcbiAgICAgIGNsb25lLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbjtcclxuICAgICAgY2xvbmUuc2NhbGUgPSB0aGlzLnNjYWxlO1xyXG4gICAgICBfLmVhY2goU2hhcGUuUHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIGNsb25lW2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICAgIHJldHVybiBjbG9uZS5fdXBkYXRlKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVG8gYmUgY2FsbGVkIGJlZm9yZSByZW5kZXIgdGhhdCBjYWxjdWxhdGVzIGFuZCBjb2xsYXRlcyBhbGwgaW5mb3JtYXRpb25cclxuICAgICAqIHRvIGJlIGFzIHVwLXRvLWRhdGUgYXMgcG9zc2libGUgZm9yIHRoZSByZW5kZXIuIENhbGxlZCBvbmNlIGEgZnJhbWUuXHJcbiAgICAgKi9cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKGRlZXApIHtcclxuXHJcbiAgICAgIGlmICghdGhpcy5fbWF0cml4Lm1hbnVhbCAmJiB0aGlzLl9mbGFnTWF0cml4KSB7XHJcblxyXG4gICAgICAgIHRoaXMuX21hdHJpeFxyXG4gICAgICAgICAgLmlkZW50aXR5KClcclxuICAgICAgICAgIC50cmFuc2xhdGUodGhpcy50cmFuc2xhdGlvbi54LCB0aGlzLnRyYW5zbGF0aW9uLnkpO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fbWF0cml4LnNjYWxlKHRoaXMuX3NjYWxlLngsIHRoaXMuX3NjYWxlLnkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fbWF0cml4LnNjYWxlKHRoaXMuX3NjYWxlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9tYXRyaXgucm90YXRlKHRoaXMucm90YXRpb24pO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGRlZXApIHtcclxuICAgICAgICAvLyBCdWJibGUgdXAgdG8gcGFyZW50cyBtYWlubHkgZm9yIGBnZXRCb3VuZGluZ0NsaWVudFJlY3RgIG1ldGhvZC5cclxuICAgICAgICBpZiAodGhpcy5wYXJlbnQgJiYgdGhpcy5wYXJlbnQuX3VwZGF0ZSkge1xyXG4gICAgICAgICAgdGhpcy5wYXJlbnQuX3VwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ01hdHJpeCA9IHRoaXMuX2ZsYWdTY2FsZSA9IGZhbHNlO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgU2hhcGUuTWFrZU9ic2VydmFibGUoU2hhcGUucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0YW50c1xyXG4gICAqL1xyXG5cclxuICB2YXIgbWluID0gTWF0aC5taW4sIG1heCA9IE1hdGgubWF4LCByb3VuZCA9IE1hdGgucm91bmQsXHJcbiAgICBnZXRDb21wdXRlZE1hdHJpeCA9IFR3by5VdGlscy5nZXRDb21wdXRlZE1hdHJpeDtcclxuXHJcbiAgdmFyIGNvbW1hbmRzID0ge307XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIF8uZWFjaChUd28uQ29tbWFuZHMsIGZ1bmN0aW9uKHYsIGspIHtcclxuICAgIGNvbW1hbmRzW2tdID0gbmV3IFJlZ0V4cCh2KTtcclxuICB9KTtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aCA9IGZ1bmN0aW9uKHZlcnRpY2VzLCBjbG9zZWQsIGN1cnZlZCwgbWFudWFsKSB7XHJcblxyXG4gICAgVHdvLlNoYXBlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIudHlwZSA9ICdwYXRoJztcclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdWZXJ0aWNlcyA9IF8uYmluZChQYXRoLkZsYWdWZXJ0aWNlcywgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5iaW5kVmVydGljZXMgPSBfLmJpbmQoUGF0aC5CaW5kVmVydGljZXMsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIudW5iaW5kVmVydGljZXMgPSBfLmJpbmQoUGF0aC5VbmJpbmRWZXJ0aWNlcywgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ0ZpbGwgPSBfLmJpbmQoUGF0aC5GbGFnRmlsbCwgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnU3Ryb2tlID0gXy5iaW5kKFBhdGguRmxhZ1N0cm9rZSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5fY2xvc2VkID0gISFjbG9zZWQ7XHJcbiAgICB0aGlzLl9jdXJ2ZWQgPSAhIWN1cnZlZDtcclxuXHJcbiAgICB0aGlzLmJlZ2lubmluZyA9IDA7XHJcbiAgICB0aGlzLmVuZGluZyA9IDE7XHJcblxyXG4gICAgLy8gU3R5bGUgcHJvcGVydGllc1xyXG5cclxuICAgIHRoaXMuZmlsbCA9ICcjZmZmJztcclxuICAgIHRoaXMuc3Ryb2tlID0gJyMwMDAnO1xyXG4gICAgdGhpcy5saW5ld2lkdGggPSAxLjA7XHJcbiAgICB0aGlzLm9wYWNpdHkgPSAxLjA7XHJcbiAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuY2FwID0gJ2J1dHQnOyAgICAgIC8vIERlZmF1bHQgb2YgQWRvYmUgSWxsdXN0cmF0b3JcclxuICAgIHRoaXMuam9pbiA9ICdtaXRlcic7ICAgIC8vIERlZmF1bHQgb2YgQWRvYmUgSWxsdXN0cmF0b3JcclxuICAgIHRoaXMubWl0ZXIgPSA0OyAgICAgICAgIC8vIERlZmF1bHQgb2YgQWRvYmUgSWxsdXN0cmF0b3JcclxuXHJcbiAgICB0aGlzLl92ZXJ0aWNlcyA9IFtdO1xyXG4gICAgdGhpcy52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xyXG5cclxuICAgIC8vIERldGVybWluZXMgd2hldGhlciBvciBub3QgdHdvLmpzIHNob3VsZCBjYWxjdWxhdGUgY3VydmVzLCBsaW5lcywgYW5kXHJcbiAgICAvLyBjb21tYW5kcyBhdXRvbWF0aWNhbGx5IGZvciB5b3Ugb3IgdG8gbGV0IHRoZSBkZXZlbG9wZXIgbWFuaXB1bGF0ZSB0aGVtXHJcbiAgICAvLyBmb3IgdGhlbXNlbHZlcy5cclxuICAgIHRoaXMuYXV0b21hdGljID0gIW1hbnVhbDtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoUGF0aCwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFtcclxuICAgICAgJ2ZpbGwnLFxyXG4gICAgICAnc3Ryb2tlJyxcclxuICAgICAgJ2xpbmV3aWR0aCcsXHJcbiAgICAgICdvcGFjaXR5JyxcclxuICAgICAgJ3Zpc2libGUnLFxyXG4gICAgICAnY2FwJyxcclxuICAgICAgJ2pvaW4nLFxyXG4gICAgICAnbWl0ZXInLFxyXG5cclxuICAgICAgJ2Nsb3NlZCcsXHJcbiAgICAgICdjdXJ2ZWQnLFxyXG4gICAgICAnYXV0b21hdGljJyxcclxuICAgICAgJ2JlZ2lubmluZycsXHJcbiAgICAgICdlbmRpbmcnXHJcbiAgICBdLFxyXG5cclxuICAgIEZsYWdWZXJ0aWNlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdWZXJ0aWNlcyA9IHRydWU7XHJcbiAgICAgIHRoaXMuX2ZsYWdMZW5ndGggPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBCaW5kVmVydGljZXM6IGZ1bmN0aW9uKGl0ZW1zKSB7XHJcblxyXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIGxvdFxyXG4gICAgICAvLyB3aGVuIGltcG9ydGluZyBhIGxhcmdlIFNWR1xyXG4gICAgICB2YXIgaSA9IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgIGl0ZW1zW2ldLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdWZXJ0aWNlcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdWZXJ0aWNlcygpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgVW5iaW5kVmVydGljZXM6IGZ1bmN0aW9uKGl0ZW1zKSB7XHJcblxyXG4gICAgICB2YXIgaSA9IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgIGl0ZW1zW2ldLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1ZlcnRpY2VzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1ZlcnRpY2VzKCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBGbGFnRmlsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdGaWxsID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgRmxhZ1N0cm9rZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdTdHJva2UgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICBUd28uU2hhcGUuTWFrZU9ic2VydmFibGUob2JqZWN0KTtcclxuXHJcbiAgICAgIC8vIE9ubHkgdGhlIDYgZGVmaW5lZCBwcm9wZXJ0aWVzIGFyZSBmbGFnZ2VkIGxpa2UgdGhpcy4gVGhlIHN1YnNlcXVlbnRcclxuICAgICAgLy8gcHJvcGVydGllcyBiZWhhdmUgZGlmZmVyZW50bHkgYW5kIG5lZWQgdG8gYmUgaGFuZCB3cml0dGVuLlxyXG4gICAgICBfLmVhY2goUGF0aC5Qcm9wZXJ0aWVzLnNsaWNlKDIsIDgpLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iamVjdCk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnZmlsbCcsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZmlsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZikge1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmlsbC51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdGaWxsKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9maWxsID0gZjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdGaWxsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5HcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbGwuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ0ZpbGwpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ3N0cm9rZScsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc3Ryb2tlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihmKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5HcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0cm9rZS51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdTdHJva2UpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX3N0cm9rZSA9IGY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnU3Ryb2tlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3Ryb2tlLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdTdHJva2UpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2xlbmd0aCcsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuX2ZsYWdMZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTGVuZ3RoKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fbGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnY2xvc2VkJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jbG9zZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9ICEhdjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdWZXJ0aWNlcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdjdXJ2ZWQnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnZlZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpcy5fY3VydmVkID0gISF2O1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ1ZlcnRpY2VzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2F1dG9tYXRpYycsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fYXV0b21hdGljO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICBpZiAodiA9PT0gdGhpcy5fYXV0b21hdGljKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMuX2F1dG9tYXRpYyA9ICEhdjtcclxuICAgICAgICAgIHZhciBtZXRob2QgPSB0aGlzLl9hdXRvbWF0aWMgPyAnaWdub3JlJyA6ICdsaXN0ZW4nO1xyXG4gICAgICAgICAgXy5lYWNoKHRoaXMudmVydGljZXMsIGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgdlttZXRob2RdKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2JlZ2lubmluZycsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fYmVnaW5uaW5nO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzLl9iZWdpbm5pbmcgPSB2O1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ1ZlcnRpY2VzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2VuZGluZycsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZW5kaW5nO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzLl9lbmRpbmcgPSB2O1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ1ZlcnRpY2VzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ3ZlcnRpY2VzJywge1xyXG5cclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbGxlY3Rpb247XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2ZXJ0aWNlcykge1xyXG5cclxuICAgICAgICAgIHZhciB1cGRhdGVWZXJ0aWNlcyA9IHRoaXMuX3JlbmRlcmVyLmZsYWdWZXJ0aWNlcztcclxuICAgICAgICAgIHZhciBiaW5kVmVydGljZXMgPSB0aGlzLl9yZW5kZXJlci5iaW5kVmVydGljZXM7XHJcbiAgICAgICAgICB2YXIgdW5iaW5kVmVydGljZXMgPSB0aGlzLl9yZW5kZXJlci51bmJpbmRWZXJ0aWNlcztcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgcHJldmlvdXMgbGlzdGVuZXJzXHJcbiAgICAgICAgICBpZiAodGhpcy5fY29sbGVjdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLl9jb2xsZWN0aW9uXHJcbiAgICAgICAgICAgICAgLnVuYmluZChUd28uRXZlbnRzLmluc2VydCwgYmluZFZlcnRpY2VzKVxyXG4gICAgICAgICAgICAgIC51bmJpbmQoVHdvLkV2ZW50cy5yZW1vdmUsIHVuYmluZFZlcnRpY2VzKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDcmVhdGUgbmV3IENvbGxlY3Rpb24gd2l0aCBjb3B5IG9mIHZlcnRpY2VzXHJcbiAgICAgICAgICB0aGlzLl9jb2xsZWN0aW9uID0gbmV3IFR3by5VdGlscy5Db2xsZWN0aW9uKCh2ZXJ0aWNlcyB8fCBbXSkuc2xpY2UoMCkpO1xyXG5cclxuICAgICAgICAgIC8vIExpc3RlbiBmb3IgQ29sbGVjdGlvbiBjaGFuZ2VzIGFuZCBiaW5kIC8gdW5iaW5kXHJcbiAgICAgICAgICB0aGlzLl9jb2xsZWN0aW9uXHJcbiAgICAgICAgICAgIC5iaW5kKFR3by5FdmVudHMuaW5zZXJ0LCBiaW5kVmVydGljZXMpXHJcbiAgICAgICAgICAgIC5iaW5kKFR3by5FdmVudHMucmVtb3ZlLCB1bmJpbmRWZXJ0aWNlcyk7XHJcblxyXG4gICAgICAgICAgLy8gQmluZCBJbml0aWFsIFZlcnRpY2VzXHJcbiAgICAgICAgICBiaW5kVmVydGljZXModGhpcy5fY29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2NsaXAnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2NsaXA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXMuX2NsaXAgPSB2O1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ0NsaXAgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUGF0aC5wcm90b3R5cGUsIFR3by5TaGFwZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAvLyBGbGFnc1xyXG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GbGFnXHJcblxyXG4gICAgX2ZsYWdWZXJ0aWNlczogdHJ1ZSxcclxuICAgIF9mbGFnTGVuZ3RoOiB0cnVlLFxyXG5cclxuICAgIF9mbGFnRmlsbDogdHJ1ZSxcclxuICAgIF9mbGFnU3Ryb2tlOiB0cnVlLFxyXG4gICAgX2ZsYWdMaW5ld2lkdGg6IHRydWUsXHJcbiAgICBfZmxhZ09wYWNpdHk6IHRydWUsXHJcbiAgICBfZmxhZ1Zpc2libGU6IHRydWUsXHJcblxyXG4gICAgX2ZsYWdDYXA6IHRydWUsXHJcbiAgICBfZmxhZ0pvaW46IHRydWUsXHJcbiAgICBfZmxhZ01pdGVyOiB0cnVlLFxyXG5cclxuICAgIF9mbGFnQ2xpcDogZmFsc2UsXHJcblxyXG4gICAgLy8gVW5kZXJseWluZyBQcm9wZXJ0aWVzXHJcblxyXG4gICAgX2xlbmd0aDogMCxcclxuXHJcbiAgICBfZmlsbDogJyNmZmYnLFxyXG4gICAgX3N0cm9rZTogJyMwMDAnLFxyXG4gICAgX2xpbmV3aWR0aDogMS4wLFxyXG4gICAgX29wYWNpdHk6IDEuMCxcclxuICAgIF92aXNpYmxlOiB0cnVlLFxyXG5cclxuICAgIF9jYXA6ICdyb3VuZCcsXHJcbiAgICBfam9pbjogJ3JvdW5kJyxcclxuICAgIF9taXRlcjogNCxcclxuXHJcbiAgICBfY2xvc2VkOiB0cnVlLFxyXG4gICAgX2N1cnZlZDogZmFsc2UsXHJcbiAgICBfYXV0b21hdGljOiB0cnVlLFxyXG4gICAgX2JlZ2lubmluZzogMCxcclxuICAgIF9lbmRpbmc6IDEuMCxcclxuXHJcbiAgICBfY2xpcDogZmFsc2UsXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG5cclxuICAgICAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgdmFyIHBvaW50cyA9IF8ubWFwKHRoaXMudmVydGljZXMsIGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICByZXR1cm4gdi5jbG9uZSgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBQYXRoKHBvaW50cywgdGhpcy5jbG9zZWQsIHRoaXMuY3VydmVkLCAhdGhpcy5hdXRvbWF0aWMpO1xyXG5cclxuICAgICAgXy5lYWNoKFR3by5QYXRoLlByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICBjbG9uZVtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgY2xvbmUudHJhbnNsYXRpb24uY29weSh0aGlzLnRyYW5zbGF0aW9uKTtcclxuICAgICAgY2xvbmUucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uO1xyXG4gICAgICBjbG9uZS5zY2FsZSA9IHRoaXMuc2NhbGU7XHJcblxyXG4gICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LmFkZChjbG9uZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgdmVydGljZXM6IF8ubWFwKHRoaXMudmVydGljZXMsIGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHJldHVybiB2LnRvT2JqZWN0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgfTtcclxuXHJcbiAgICAgIF8uZWFjaChUd28uU2hhcGUuUHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIHJlc3VsdFtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmVzdWx0LnRyYW5zbGF0aW9uID0gdGhpcy50cmFuc2xhdGlvbi50b09iamVjdDtcclxuICAgICAgcmVzdWx0LnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbjtcclxuICAgICAgcmVzdWx0LnNjYWxlID0gdGhpcy5zY2FsZTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBub0ZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmZpbGwgPSAndHJhbnNwYXJlbnQnO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgbm9TdHJva2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnN0cm9rZSA9ICd0cmFuc3BhcmVudCc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9yaWVudCB0aGUgdmVydGljZXMgb2YgdGhlIHNoYXBlIHRvIHRoZSB1cHBlciBsZWZ0aGFuZFxyXG4gICAgICogY29ybmVyIG9mIHRoZSBwYXRoLlxyXG4gICAgICovXHJcbiAgICBjb3JuZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlY3QgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCh0cnVlKTtcclxuXHJcbiAgICAgIHJlY3QuY2VudHJvaWQgPSB7XHJcbiAgICAgICAgeDogcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCAvIDIsXHJcbiAgICAgICAgeTogcmVjdC50b3AgKyByZWN0LmhlaWdodCAvIDJcclxuICAgICAgfTtcclxuXHJcbiAgICAgIF8uZWFjaCh0aGlzLnZlcnRpY2VzLCBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgdi5hZGRTZWxmKHJlY3QuY2VudHJvaWQpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcmllbnQgdGhlIHZlcnRpY2VzIG9mIHRoZSBzaGFwZSB0byB0aGUgY2VudGVyIG9mIHRoZVxyXG4gICAgICogcGF0aC5cclxuICAgICAqL1xyXG4gICAgY2VudGVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZWN0ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QodHJ1ZSk7XHJcblxyXG4gICAgICByZWN0LmNlbnRyb2lkID0ge1xyXG4gICAgICAgIHg6IHJlY3QubGVmdCArIHJlY3Qud2lkdGggLyAyLFxyXG4gICAgICAgIHk6IHJlY3QudG9wICsgcmVjdC5oZWlnaHQgLyAyXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBfLmVhY2godGhpcy52ZXJ0aWNlcywgZnVuY3Rpb24odikge1xyXG4gICAgICAgIHYuc3ViU2VsZihyZWN0LmNlbnRyb2lkKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyB0aGlzLnRyYW5zbGF0aW9uLmFkZFNlbGYocmVjdC5jZW50cm9pZCk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIHNlbGYgZnJvbSB0aGUgc2NlbmUgLyBwYXJlbnQuXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAoIXRoaXMucGFyZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMucGFyZW50LnJlbW92ZSh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gYW4gb2JqZWN0IHdpdGggdG9wLCBsZWZ0LCByaWdodCwgYm90dG9tLCB3aWR0aCwgYW5kIGhlaWdodFxyXG4gICAgICogcGFyYW1ldGVycyBvZiB0aGUgZ3JvdXAuXHJcbiAgICAgKi9cclxuICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogZnVuY3Rpb24oc2hhbGxvdykge1xyXG4gICAgICB2YXIgbWF0cml4LCBib3JkZXIsIGwsIHgsIHksIGksIHY7XHJcblxyXG4gICAgICB2YXIgbGVmdCA9IEluZmluaXR5LCByaWdodCA9IC1JbmZpbml0eSxcclxuICAgICAgICAgIHRvcCA9IEluZmluaXR5LCBib3R0b20gPSAtSW5maW5pdHk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBVcGRhdGUgdGhpcyB0byBub3QgX19hbHdheXNfXyB1cGRhdGUuIEp1c3Qgd2hlbiBpdCBuZWVkcyB0by5cclxuICAgICAgdGhpcy5fdXBkYXRlKHRydWUpO1xyXG5cclxuICAgICAgbWF0cml4ID0gISFzaGFsbG93ID8gdGhpcy5fbWF0cml4IDogZ2V0Q29tcHV0ZWRNYXRyaXgodGhpcyk7XHJcblxyXG4gICAgICBib3JkZXIgPSB0aGlzLmxpbmV3aWR0aCAvIDI7XHJcbiAgICAgIGwgPSB0aGlzLl92ZXJ0aWNlcy5sZW5ndGg7XHJcblxyXG4gICAgICBpZiAobCA8PSAwKSB7XHJcbiAgICAgICAgdiA9IG1hdHJpeC5tdWx0aXBseSgwLCAwLCAxKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgdG9wOiB2LnksXHJcbiAgICAgICAgICBsZWZ0OiB2LngsXHJcbiAgICAgICAgICByaWdodDogdi54LFxyXG4gICAgICAgICAgYm90dG9tOiB2LnksXHJcbiAgICAgICAgICB3aWR0aDogMCxcclxuICAgICAgICAgIGhlaWdodDogMFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB2ID0gdGhpcy5fdmVydGljZXNbaV07XHJcblxyXG4gICAgICAgIHggPSB2Lng7XHJcbiAgICAgICAgeSA9IHYueTtcclxuXHJcbiAgICAgICAgdiA9IG1hdHJpeC5tdWx0aXBseSh4LCB5LCAxKTtcclxuICAgICAgICB0b3AgPSBtaW4odi55IC0gYm9yZGVyLCB0b3ApO1xyXG4gICAgICAgIGxlZnQgPSBtaW4odi54IC0gYm9yZGVyLCBsZWZ0KTtcclxuICAgICAgICByaWdodCA9IG1heCh2LnggKyBib3JkZXIsIHJpZ2h0KTtcclxuICAgICAgICBib3R0b20gPSBtYXgodi55ICsgYm9yZGVyLCBib3R0b20pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgIGxlZnQ6IGxlZnQsXHJcbiAgICAgICAgcmlnaHQ6IHJpZ2h0LFxyXG4gICAgICAgIGJvdHRvbTogYm90dG9tLFxyXG4gICAgICAgIHdpZHRoOiByaWdodCAtIGxlZnQsXHJcbiAgICAgICAgaGVpZ2h0OiBib3R0b20gLSB0b3BcclxuICAgICAgfTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2l2ZW4gYSBmbG9hdCBgdGAgZnJvbSAwIHRvIDEsIHJldHVybiBhIHBvaW50IG9yIGFzc2lnbiBhIHBhc3NlZCBgb2JqYCdzXHJcbiAgICAgKiBjb29yZGluYXRlcyB0byB0aGF0IHBlcmNlbnRhZ2Ugb24gdGhpcyBUd28uUGF0aCdzIGN1cnZlLlxyXG4gICAgICovXHJcbiAgICBnZXRQb2ludEF0OiBmdW5jdGlvbih0LCBvYmopIHtcclxuICAgICAgdmFyIGlhLCBpYjtcclxuICAgICAgdmFyIHgsIHgxLCB4MiwgeDMsIHg0LCB5LCB5MSwgeTIsIHkzLCB5NCwgbGVmdCwgcmlnaHQ7XHJcbiAgICAgIHZhciB0YXJnZXQgPSB0aGlzLmxlbmd0aCAqIE1hdGgubWluKE1hdGgubWF4KHQsIDApLCAxKTtcclxuICAgICAgdmFyIGxlbmd0aCA9IHRoaXMudmVydGljZXMubGVuZ3RoO1xyXG4gICAgICB2YXIgbGFzdCA9IGxlbmd0aCAtIDE7XHJcblxyXG4gICAgICB2YXIgYSA9IG51bGw7XHJcbiAgICAgIHZhciBiID0gbnVsbDtcclxuXHJcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fbGVuZ3Rocy5sZW5ndGgsIHN1bSA9IDA7IGkgPCBsOyBpKyspIHtcclxuXHJcbiAgICAgICAgaWYgKHN1bSArIHRoaXMuX2xlbmd0aHNbaV0gPj0gdGFyZ2V0KSB7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCkge1xyXG4gICAgICAgICAgICBpYSA9IFR3by5VdGlscy5tb2QoaSwgbGVuZ3RoKTtcclxuICAgICAgICAgICAgaWIgPSBUd28uVXRpbHMubW9kKGkgLSAxLCBsZW5ndGgpO1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGlhID0gaWI7XHJcbiAgICAgICAgICAgICAgaWIgPSBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpYSA9IGk7XHJcbiAgICAgICAgICAgIGliID0gTWF0aC5taW4oTWF0aC5tYXgoaSAtIDEsIDApLCBsYXN0KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBhID0gdGhpcy52ZXJ0aWNlc1tpYV07XHJcbiAgICAgICAgICBiID0gdGhpcy52ZXJ0aWNlc1tpYl07XHJcbiAgICAgICAgICB0YXJnZXQgLT0gc3VtO1xyXG4gICAgICAgICAgaWYgKHRoaXMuX2xlbmd0aHNbaV0gIT09IDApIHtcclxuICAgICAgICAgICAgdCA9IHRhcmdldCAvIHRoaXMuX2xlbmd0aHNbaV07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3VtICs9IHRoaXMuX2xlbmd0aHNbaV07XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBjb25zb2xlLmxvZyhzdW0sIGEuY29tbWFuZCwgYi5jb21tYW5kKTtcclxuXHJcbiAgICAgIGlmIChfLmlzTnVsbChhKSB8fCBfLmlzTnVsbChiKSkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByaWdodCA9IGIuY29udHJvbHMgJiYgYi5jb250cm9scy5yaWdodDtcclxuICAgICAgbGVmdCA9IGEuY29udHJvbHMgJiYgYS5jb250cm9scy5sZWZ0O1xyXG5cclxuICAgICAgeDEgPSBiLng7XHJcbiAgICAgIHkxID0gYi55O1xyXG4gICAgICB4MiA9IChyaWdodCB8fCBiKS54O1xyXG4gICAgICB5MiA9IChyaWdodCB8fCBiKS55O1xyXG4gICAgICB4MyA9IChsZWZ0IHx8IGEpLng7XHJcbiAgICAgIHkzID0gKGxlZnQgfHwgYSkueTtcclxuICAgICAgeDQgPSBhLng7XHJcbiAgICAgIHk0ID0gYS55O1xyXG5cclxuICAgICAgaWYgKHJpZ2h0ICYmIGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgeDIgKz0gYi54O1xyXG4gICAgICAgIHkyICs9IGIueTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGxlZnQgJiYgYS5fcmVsYXRpdmUpIHtcclxuICAgICAgICB4MyArPSBhLng7XHJcbiAgICAgICAgeTMgKz0gYS55O1xyXG4gICAgICB9XHJcblxyXG4gICAgICB4ID0gVHdvLlV0aWxzLmdldFBvaW50T25DdWJpY0Jlemllcih0LCB4MSwgeDIsIHgzLCB4NCk7XHJcbiAgICAgIHkgPSBUd28uVXRpbHMuZ2V0UG9pbnRPbkN1YmljQmV6aWVyKHQsIHkxLCB5MiwgeTMsIHk0KTtcclxuXHJcbiAgICAgIGlmIChfLmlzT2JqZWN0KG9iaikpIHtcclxuICAgICAgICBvYmoueCA9IHg7XHJcbiAgICAgICAgb2JqLnkgPSB5O1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBuZXcgVHdvLlZlY3Rvcih4LCB5KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmFzZWQgb24gY2xvc2VkIC8gY3VydmVkIGFuZCBzb3J0aW5nIG9mIHZlcnRpY2VzIHBsb3Qgd2hlcmUgYWxsIHBvaW50c1xyXG4gICAgICogc2hvdWxkIGJlIGFuZCB3aGVyZSB0aGUgcmVzcGVjdGl2ZSBoYW5kbGVzIHNob3VsZCBiZSB0b28uXHJcbiAgICAgKi9cclxuICAgIHBsb3Q6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuY3VydmVkKSB7XHJcbiAgICAgICAgVHdvLlV0aWxzLmdldEN1cnZlRnJvbVBvaW50cyh0aGlzLl92ZXJ0aWNlcywgdGhpcy5jbG9zZWQpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3ZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5fdmVydGljZXNbaV0uX2NvbW1hbmQgPSBpID09PSAwID8gVHdvLkNvbW1hbmRzLm1vdmUgOiBUd28uQ29tbWFuZHMubGluZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBzdWJkaXZpZGU6IGZ1bmN0aW9uKGxpbWl0KSB7XHJcbiAgICAgIC8vVE9ETzogRFJZbmVzcyAoZnVuY3Rpb24gYmVsb3cpXHJcbiAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgdmFyIGxhc3QgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aCAtIDE7XHJcbiAgICAgIHZhciBiID0gdGhpcy52ZXJ0aWNlc1tsYXN0XTtcclxuICAgICAgdmFyIGNsb3NlZCA9IHRoaXMuX2Nsb3NlZCB8fCB0aGlzLnZlcnRpY2VzW2xhc3RdLl9jb21tYW5kID09PSBUd28uQ29tbWFuZHMuY2xvc2U7XHJcbiAgICAgIHZhciBwb2ludHMgPSBbXTtcclxuICAgICAgXy5lYWNoKHRoaXMudmVydGljZXMsIGZ1bmN0aW9uKGEsIGkpIHtcclxuXHJcbiAgICAgICAgaWYgKGkgPD0gMCAmJiAhY2xvc2VkKSB7XHJcbiAgICAgICAgICBiID0gYTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhLmNvbW1hbmQgPT09IFR3by5Db21tYW5kcy5tb3ZlKSB7XHJcbiAgICAgICAgICBwb2ludHMucHVzaChuZXcgVHdvLkFuY2hvcihiLngsIGIueSkpO1xyXG4gICAgICAgICAgaWYgKGkgPiAwKSB7XHJcbiAgICAgICAgICAgIHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV0uY29tbWFuZCA9IFR3by5Db21tYW5kcy5saW5lO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYiA9IGE7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdmVydHMgPSBnZXRTdWJkaXZpc2lvbnMoYSwgYiwgbGltaXQpO1xyXG4gICAgICAgIHBvaW50cyA9IHBvaW50cy5jb25jYXQodmVydHMpO1xyXG5cclxuICAgICAgICAvLyBBc3NpZ24gY29tbWFuZHMgdG8gYWxsIHRoZSB2ZXJ0c1xyXG4gICAgICAgIF8uZWFjaCh2ZXJ0cywgZnVuY3Rpb24odiwgaSkge1xyXG4gICAgICAgICAgaWYgKGkgPD0gMCAmJiBiLmNvbW1hbmQgPT09IFR3by5Db21tYW5kcy5tb3ZlKSB7XHJcbiAgICAgICAgICAgIHYuY29tbWFuZCA9IFR3by5Db21tYW5kcy5tb3ZlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdi5jb21tYW5kID0gVHdvLkNvbW1hbmRzLmxpbmU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChpID49IGxhc3QpIHtcclxuXHJcbiAgICAgICAgICAvLyBUT0RPOiBBZGQgY2hlY2sgaWYgdGhlIHR3byB2ZWN0b3JzIGluIHF1ZXN0aW9uIGFyZSB0aGUgc2FtZSB2YWx1ZXMuXHJcbiAgICAgICAgICBpZiAodGhpcy5fY2xvc2VkICYmIHRoaXMuX2F1dG9tYXRpYykge1xyXG5cclxuICAgICAgICAgICAgYiA9IGE7XHJcblxyXG4gICAgICAgICAgICB2ZXJ0cyA9IGdldFN1YmRpdmlzaW9ucyhhLCBiLCBsaW1pdCk7XHJcbiAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5jb25jYXQodmVydHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gQXNzaWduIGNvbW1hbmRzIHRvIGFsbCB0aGUgdmVydHNcclxuICAgICAgICAgICAgXy5lYWNoKHZlcnRzLCBmdW5jdGlvbih2LCBpKSB7XHJcbiAgICAgICAgICAgICAgaWYgKGkgPD0gMCAmJiBiLmNvbW1hbmQgPT09IFR3by5Db21tYW5kcy5tb3ZlKSB7XHJcbiAgICAgICAgICAgICAgICB2LmNvbW1hbmQgPSBUd28uQ29tbWFuZHMubW92ZTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdi5jb21tYW5kID0gVHdvLkNvbW1hbmRzLmxpbmU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGNsb3NlZCkge1xyXG4gICAgICAgICAgICBwb2ludHMucHVzaChuZXcgVHdvLkFuY2hvcihhLngsIGEueSkpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV0uY29tbWFuZCA9IGNsb3NlZCA/IFR3by5Db21tYW5kcy5jbG9zZSA6IFR3by5Db21tYW5kcy5saW5lO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGIgPSBhO1xyXG5cclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICB0aGlzLl9hdXRvbWF0aWMgPSBmYWxzZTtcclxuICAgICAgdGhpcy5fY3VydmVkID0gZmFsc2U7XHJcbiAgICAgIHRoaXMudmVydGljZXMgPSBwb2ludHM7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIF91cGRhdGVMZW5ndGg6IGZ1bmN0aW9uKGxpbWl0KSB7XHJcbiAgICAgIC8vVE9ETzogRFJZbmVzcyAoZnVuY3Rpb24gYWJvdmUpXHJcbiAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgdmFyIGxlbmd0aCA9IHRoaXMudmVydGljZXMubGVuZ3RoO1xyXG4gICAgICB2YXIgbGFzdCA9IGxlbmd0aCAtIDE7XHJcbiAgICAgIHZhciBiID0gdGhpcy52ZXJ0aWNlc1tsYXN0XTtcclxuICAgICAgdmFyIGNsb3NlZCA9IHRoaXMuX2Nsb3NlZCB8fCB0aGlzLnZlcnRpY2VzW2xhc3RdLl9jb21tYW5kID09PSBUd28uQ29tbWFuZHMuY2xvc2U7XHJcbiAgICAgIHZhciBzdW0gPSAwO1xyXG5cclxuICAgICAgaWYgKF8uaXNVbmRlZmluZWQodGhpcy5fbGVuZ3RocykpIHtcclxuICAgICAgICB0aGlzLl9sZW5ndGhzID0gW107XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIF8uZWFjaCh0aGlzLnZlcnRpY2VzLCBmdW5jdGlvbihhLCBpKSB7XHJcblxyXG4gICAgICAgIGlmICgoaSA8PSAwICYmICFjbG9zZWQpIHx8IGEuY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLm1vdmUpIHtcclxuICAgICAgICAgIGIgPSBhO1xyXG4gICAgICAgICAgdGhpcy5fbGVuZ3Roc1tpXSA9IDA7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9sZW5ndGhzW2ldID0gZ2V0Q3VydmVMZW5ndGgoYSwgYiwgbGltaXQpO1xyXG4gICAgICAgIHN1bSArPSB0aGlzLl9sZW5ndGhzW2ldO1xyXG5cclxuICAgICAgICBpZiAoaSA+PSBsYXN0ICYmIGNsb3NlZCkge1xyXG5cclxuICAgICAgICAgIGIgPSB0aGlzLnZlcnRpY2VzWyhpICsgMSkgJSBsZW5ndGhdO1xyXG5cclxuICAgICAgICAgIHRoaXMuX2xlbmd0aHNbaSArIDFdID0gZ2V0Q3VydmVMZW5ndGgoYSwgYiwgbGltaXQpO1xyXG4gICAgICAgICAgc3VtICs9IHRoaXMuX2xlbmd0aHNbaSArIDFdO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGIgPSBhO1xyXG5cclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICB0aGlzLl9sZW5ndGggPSBzdW07XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdWZXJ0aWNlcykge1xyXG5cclxuICAgICAgICB2YXIgbCA9IHRoaXMudmVydGljZXMubGVuZ3RoO1xyXG4gICAgICAgIHZhciBsYXN0ID0gbCAtIDEsIHY7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IFNob3VsZCBjbGFtcCB0aGlzIHNvIHRoYXQgYGlhYCBhbmQgYGliYFxyXG4gICAgICAgIC8vIGNhbm5vdCBzZWxlY3Qgbm9uLXZlcnRzLlxyXG4gICAgICAgIHZhciBpYSA9IHJvdW5kKCh0aGlzLl9iZWdpbm5pbmcpICogbGFzdCk7XHJcbiAgICAgICAgdmFyIGliID0gcm91bmQoKHRoaXMuX2VuZGluZykgKiBsYXN0KTtcclxuXHJcbiAgICAgICAgdGhpcy5fdmVydGljZXMubGVuZ3RoID0gMDtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGlhOyBpIDwgaWIgKyAxOyBpKyspIHtcclxuICAgICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzW2ldO1xyXG4gICAgICAgICAgdGhpcy5fdmVydGljZXMucHVzaCh2KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9hdXRvbWF0aWMpIHtcclxuICAgICAgICAgIHRoaXMucGxvdCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFR3by5TaGFwZS5wcm90b3R5cGUuX3VwZGF0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1ZlcnRpY2VzID0gIHRoaXMuX2ZsYWdGaWxsID0gIHRoaXMuX2ZsYWdTdHJva2UgPVxyXG4gICAgICAgICB0aGlzLl9mbGFnTGluZXdpZHRoID0gdGhpcy5fZmxhZ09wYWNpdHkgPSB0aGlzLl9mbGFnVmlzaWJsZSA9XHJcbiAgICAgICAgIHRoaXMuX2ZsYWdDYXAgPSB0aGlzLl9mbGFnSm9pbiA9IHRoaXMuX2ZsYWdNaXRlciA9XHJcbiAgICAgICAgIHRoaXMuX2ZsYWdDbGlwID0gZmFsc2U7XHJcblxyXG4gICAgICBUd28uU2hhcGUucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgUGF0aC5NYWtlT2JzZXJ2YWJsZShQYXRoLnByb3RvdHlwZSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFV0aWxpdHkgZnVuY3Rpb25zXHJcbiAgICovXHJcblxyXG4gIGZ1bmN0aW9uIGdldEN1cnZlTGVuZ3RoKGEsIGIsIGxpbWl0KSB7XHJcbiAgICAvLyBUT0RPOiBEUlluZXNzXHJcbiAgICB2YXIgeDEsIHgyLCB4MywgeDQsIHkxLCB5MiwgeTMsIHk0O1xyXG5cclxuICAgIHZhciByaWdodCA9IGIuY29udHJvbHMgJiYgYi5jb250cm9scy5yaWdodDtcclxuICAgIHZhciBsZWZ0ID0gYS5jb250cm9scyAmJiBhLmNvbnRyb2xzLmxlZnQ7XHJcblxyXG4gICAgeDEgPSBiLng7XHJcbiAgICB5MSA9IGIueTtcclxuICAgIHgyID0gKHJpZ2h0IHx8IGIpLng7XHJcbiAgICB5MiA9IChyaWdodCB8fCBiKS55O1xyXG4gICAgeDMgPSAobGVmdCB8fCBhKS54O1xyXG4gICAgeTMgPSAobGVmdCB8fCBhKS55O1xyXG4gICAgeDQgPSBhLng7XHJcbiAgICB5NCA9IGEueTtcclxuXHJcbiAgICBpZiAocmlnaHQgJiYgYi5fcmVsYXRpdmUpIHtcclxuICAgICAgeDIgKz0gYi54O1xyXG4gICAgICB5MiArPSBiLnk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGxlZnQgJiYgYS5fcmVsYXRpdmUpIHtcclxuICAgICAgeDMgKz0gYS54O1xyXG4gICAgICB5MyArPSBhLnk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFR3by5VdGlscy5nZXRDdXJ2ZUxlbmd0aCh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIGxpbWl0KTtcclxuXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZXRTdWJkaXZpc2lvbnMoYSwgYiwgbGltaXQpIHtcclxuICAgIC8vIFRPRE86IERSWW5lc3NcclxuICAgIHZhciB4MSwgeDIsIHgzLCB4NCwgeTEsIHkyLCB5MywgeTQ7XHJcblxyXG4gICAgdmFyIHJpZ2h0ID0gYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLnJpZ2h0O1xyXG4gICAgdmFyIGxlZnQgPSBhLmNvbnRyb2xzICYmIGEuY29udHJvbHMubGVmdDtcclxuXHJcbiAgICB4MSA9IGIueDtcclxuICAgIHkxID0gYi55O1xyXG4gICAgeDIgPSAocmlnaHQgfHwgYikueDtcclxuICAgIHkyID0gKHJpZ2h0IHx8IGIpLnk7XHJcbiAgICB4MyA9IChsZWZ0IHx8IGEpLng7XHJcbiAgICB5MyA9IChsZWZ0IHx8IGEpLnk7XHJcbiAgICB4NCA9IGEueDtcclxuICAgIHk0ID0gYS55O1xyXG5cclxuICAgIGlmIChyaWdodCAmJiBiLl9yZWxhdGl2ZSkge1xyXG4gICAgICB4MiArPSBiLng7XHJcbiAgICAgIHkyICs9IGIueTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobGVmdCAmJiBhLl9yZWxhdGl2ZSkge1xyXG4gICAgICB4MyArPSBhLng7XHJcbiAgICAgIHkzICs9IGEueTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVHdvLlV0aWxzLnN1YmRpdmlkZSh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIGxpbWl0KTtcclxuXHJcbiAgfVxyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aDtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIExpbmUgPSBUd28uTGluZSA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyKSB7XHJcblxyXG4gICAgdmFyIHdpZHRoID0geDIgLSB4MTtcclxuICAgIHZhciBoZWlnaHQgPSB5MiAtIHkxO1xyXG5cclxuICAgIHZhciB3MiA9IHdpZHRoIC8gMjtcclxuICAgIHZhciBoMiA9IGhlaWdodCAvIDI7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIFtcclxuICAgICAgICBuZXcgVHdvLkFuY2hvcigtIHcyLCAtIGgyKSxcclxuICAgICAgICBuZXcgVHdvLkFuY2hvcih3MiwgaDIpXHJcbiAgICBdKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldCh4MSArIHcyLCB5MSArIGgyKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoTGluZS5wcm90b3R5cGUsIFBhdGgucHJvdG90eXBlKTtcclxuXHJcbiAgUGF0aC5NYWtlT2JzZXJ2YWJsZShMaW5lLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgUmVjdGFuZ2xlID0gVHdvLlJlY3RhbmdsZSA9IGZ1bmN0aW9uKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgW1xyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpXHJcbiAgICBdLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KHgsIHkpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChSZWN0YW5nbGUsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbJ3dpZHRoJywgJ2hlaWdodCddLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgUGF0aC5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goUmVjdGFuZ2xlLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFJlY3RhbmdsZS5wcm90b3R5cGUsIFBhdGgucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX3dpZHRoOiAwLFxyXG4gICAgX2hlaWdodDogMCxcclxuXHJcbiAgICBfZmxhZ1dpZHRoOiAwLFxyXG4gICAgX2ZsYWdIZWlnaHQ6IDAsXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1dpZHRoIHx8IHRoaXMuX2ZsYWdIZWlnaHQpIHtcclxuXHJcbiAgICAgICAgdmFyIHhyID0gdGhpcy5fd2lkdGggLyAyO1xyXG4gICAgICAgIHZhciB5ciA9IHRoaXMuX2hlaWdodCAvIDI7XHJcblxyXG4gICAgICAgIHRoaXMudmVydGljZXNbMF0uc2V0KC14ciwgLXlyKTtcclxuICAgICAgICB0aGlzLnZlcnRpY2VzWzFdLnNldCh4ciwgLXlyKTtcclxuICAgICAgICB0aGlzLnZlcnRpY2VzWzJdLnNldCh4ciwgeXIpO1xyXG4gICAgICAgIHRoaXMudmVydGljZXNbM10uc2V0KC14ciwgeXIpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1dpZHRoID0gdGhpcy5fZmxhZ0hlaWdodCA9IGZhbHNlO1xyXG4gICAgICBQYXRoLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFJlY3RhbmdsZS5NYWtlT2JzZXJ2YWJsZShSZWN0YW5nbGUucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGgsIFRXT19QSSA9IE1hdGguUEkgKiAyLCBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW47XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBFbGxpcHNlID0gVHdvLkVsbGlwc2UgPSBmdW5jdGlvbihveCwgb3ksIHJ4LCByeSkge1xyXG5cclxuICAgIGlmICghXy5pc051bWJlcihyeSkpIHtcclxuICAgICAgcnkgPSByeDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYW1vdW50ID0gVHdvLlJlc29sdXRpb247XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IF8ubWFwKF8ucmFuZ2UoYW1vdW50KSwgZnVuY3Rpb24oaSkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3by5BbmNob3IoKTtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBwb2ludHMsIHRydWUsIHRydWUpO1xyXG5cclxuICAgIHRoaXMud2lkdGggPSByeCAqIDI7XHJcbiAgICB0aGlzLmhlaWdodCA9IHJ5ICogMjtcclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KG94LCBveSk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKEVsbGlwc2UsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbJ3dpZHRoJywgJ2hlaWdodCddLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgIFBhdGguTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKEVsbGlwc2UuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKEVsbGlwc2UucHJvdG90eXBlLCBQYXRoLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF93aWR0aDogMCxcclxuICAgIF9oZWlnaHQ6IDAsXHJcblxyXG4gICAgX2ZsYWdXaWR0aDogZmFsc2UsXHJcbiAgICBfZmxhZ0hlaWdodDogZmFsc2UsXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1dpZHRoIHx8IHRoaXMuX2ZsYWdIZWlnaHQpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMudmVydGljZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICB2YXIgcGN0ID0gaSAvIGw7XHJcbiAgICAgICAgICB2YXIgdGhldGEgPSBwY3QgKiBUV09fUEk7XHJcbiAgICAgICAgICB2YXIgeCA9IHRoaXMuX3dpZHRoICogY29zKHRoZXRhKSAvIDI7XHJcbiAgICAgICAgICB2YXIgeSA9IHRoaXMuX2hlaWdodCAqIHNpbih0aGV0YSkgLyAyO1xyXG4gICAgICAgICAgdGhpcy52ZXJ0aWNlc1tpXS5zZXQoeCwgeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdXaWR0aCA9IHRoaXMuX2ZsYWdIZWlnaHQgPSBmYWxzZTtcclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBFbGxpcHNlLk1ha2VPYnNlcnZhYmxlKEVsbGlwc2UucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGgsIFRXT19QSSA9IE1hdGguUEkgKiAyLCBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW47XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBDaXJjbGUgPSBUd28uQ2lyY2xlID0gZnVuY3Rpb24ob3gsIG95LCByKSB7XHJcblxyXG4gICAgdmFyIGFtb3VudCA9IFR3by5SZXNvbHV0aW9uO1xyXG5cclxuICAgIHZhciBwb2ludHMgPSBfLm1hcChfLnJhbmdlKGFtb3VudCksIGZ1bmN0aW9uKGkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd28uQW5jaG9yKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgcG9pbnRzLCB0cnVlLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLnJhZGl1cyA9IHI7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldChveCwgb3kpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChDaXJjbGUsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbJ3JhZGl1cyddLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgIFBhdGguTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKENpcmNsZS5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoQ2lyY2xlLnByb3RvdHlwZSwgUGF0aC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfcmFkaXVzOiAwLFxyXG4gICAgX2ZsYWdSYWRpdXM6IGZhbHNlLFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdSYWRpdXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMudmVydGljZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICB2YXIgcGN0ID0gaSAvIGw7XHJcbiAgICAgICAgICB2YXIgdGhldGEgPSBwY3QgKiBUV09fUEk7XHJcbiAgICAgICAgICB2YXIgeCA9IHRoaXMuX3JhZGl1cyAqIGNvcyh0aGV0YSk7XHJcbiAgICAgICAgICB2YXIgeSA9IHRoaXMuX3JhZGl1cyAqIHNpbih0aGV0YSk7XHJcbiAgICAgICAgICB0aGlzLnZlcnRpY2VzW2ldLnNldCh4LCB5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1JhZGl1cyA9IGZhbHNlO1xyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIENpcmNsZS5NYWtlT2JzZXJ2YWJsZShDaXJjbGUucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGgsIFRXT19QSSA9IE1hdGguUEkgKiAyLCBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW47XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBQb2x5Z29uID0gVHdvLlBvbHlnb24gPSBmdW5jdGlvbihveCwgb3ksIHIsIHNpZGVzKSB7XHJcblxyXG4gICAgc2lkZXMgPSBNYXRoLm1heChzaWRlcyB8fCAwLCAzKTtcclxuXHJcbiAgICB2YXIgcG9pbnRzID0gXy5tYXAoXy5yYW5nZShzaWRlcyksIGZ1bmN0aW9uKGkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd28uQW5jaG9yKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgcG9pbnRzLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLndpZHRoID0gciAqIDI7XHJcbiAgICB0aGlzLmhlaWdodCA9IHIgKiAyO1xyXG4gICAgdGhpcy5zaWRlcyA9IHNpZGVzO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQob3gsIG95KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoUG9seWdvbiwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFsnd2lkdGgnLCAnaGVpZ2h0JywgJ3NpZGVzJ10sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgUGF0aC5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goUG9seWdvbi5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUG9seWdvbi5wcm90b3R5cGUsIFBhdGgucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX3dpZHRoOiAwLFxyXG4gICAgX2hlaWdodDogMCxcclxuICAgIF9zaWRlczogMCxcclxuXHJcbiAgICBfZmxhZ1dpZHRoOiBmYWxzZSxcclxuICAgIF9mbGFnSGVpZ2h0OiBmYWxzZSxcclxuICAgIF9mbGFnU2lkZXM6IGZhbHNlLFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdXaWR0aCB8fCB0aGlzLl9mbGFnSGVpZ2h0IHx8IHRoaXMuX2ZsYWdTaWRlcykge1xyXG5cclxuICAgICAgICB2YXIgc2lkZXMgPSB0aGlzLl9zaWRlcztcclxuICAgICAgICB2YXIgYW1vdW50ID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmIChhbW91bnQgPiBzaWRlcykge1xyXG4gICAgICAgICAgdGhpcy52ZXJ0aWNlcy5zcGxpY2Uoc2lkZXMgLSAxLCBhbW91bnQgLSBzaWRlcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpZGVzOyBpKyspIHtcclxuXHJcbiAgICAgICAgICB2YXIgcGN0ID0gKGkgKyAwLjUpIC8gc2lkZXM7XHJcbiAgICAgICAgICB2YXIgdGhldGEgPSBUV09fUEkgKiBwY3QgKyBNYXRoLlBJIC8gMjtcclxuICAgICAgICAgIHZhciB4ID0gdGhpcy5fd2lkdGggKiBjb3ModGhldGEpO1xyXG4gICAgICAgICAgdmFyIHkgPSB0aGlzLl9oZWlnaHQgKiBzaW4odGhldGEpO1xyXG5cclxuICAgICAgICAgIGlmIChpID49IGFtb3VudCkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2VzLnB1c2gobmV3IFR3by5BbmNob3IoeCwgeSkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNlc1tpXS5zZXQoeCwgeSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1dpZHRoID0gdGhpcy5fZmxhZ0hlaWdodCA9IHRoaXMuX2ZsYWdTaWRlcyA9IGZhbHNlO1xyXG4gICAgICBQYXRoLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFBvbHlnb24uTWFrZU9ic2VydmFibGUoUG9seWdvbi5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aCwgUEkgPSBNYXRoLlBJLCBUV09fUEkgPSBNYXRoLlBJICogMiwgSEFMRl9QSSA9IE1hdGguUEkgLyAyLFxyXG4gICAgY29zID0gTWF0aC5jb3MsIHNpbiA9IE1hdGguc2luLCBhYnMgPSBNYXRoLmFicywgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIEFyY1NlZ21lbnQgPSBUd28uQXJjU2VnbWVudCA9IGZ1bmN0aW9uKG94LCBveSwgaXIsIG9yLCBzYSwgZWEsIHJlcykge1xyXG5cclxuICAgIHZhciBwb2ludHMgPSBfLm1hcChfLnJhbmdlKHJlcyB8fCAoVHdvLlJlc29sdXRpb24gKiAzKSksIGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3by5BbmNob3IoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBwb2ludHMsIGZhbHNlLCBmYWxzZSwgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5pbm5lclJhZGl1cyA9IGlyO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cyA9IG9yO1xyXG5cclxuICAgIHRoaXMuc3RhcnRBbmdsZSA9IHNhO1xyXG4gICAgdGhpcy5lbmRBbmdsZSA9IGVhO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQob3gsIG95KTtcclxuXHJcbiAgfVxyXG5cclxuICBfLmV4dGVuZChBcmNTZWdtZW50LCB7XHJcblxyXG4gICAgUHJvcGVydGllczogWydzdGFydEFuZ2xlJywgJ2VuZEFuZ2xlJywgJ2lubmVyUmFkaXVzJywgJ291dGVyUmFkaXVzJ10sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgUGF0aC5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goQXJjU2VnbWVudC5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoQXJjU2VnbWVudC5wcm90b3R5cGUsIFBhdGgucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX2ZsYWdTdGFydEFuZ2xlOiBmYWxzZSxcclxuICAgIF9mbGFnRW5kQW5nbGU6IGZhbHNlLFxyXG4gICAgX2ZsYWdJbm5lclJhZGl1czogZmFsc2UsXHJcbiAgICBfZmxhZ091dGVyUmFkaXVzOiBmYWxzZSxcclxuXHJcbiAgICBfc3RhcnRBbmdsZTogMCxcclxuICAgIF9lbmRBbmdsZTogVFdPX1BJLFxyXG4gICAgX2lubmVyUmFkaXVzOiAwLFxyXG4gICAgX291dGVyUmFkaXVzOiAwLFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdTdGFydEFuZ2xlIHx8IHRoaXMuX2ZsYWdFbmRBbmdsZSB8fCB0aGlzLl9mbGFnSW5uZXJSYWRpdXNcclxuICAgICAgICB8fCB0aGlzLl9mbGFnT3V0ZXJSYWRpdXMpIHtcclxuXHJcbiAgICAgICAgdmFyIHNhID0gdGhpcy5fc3RhcnRBbmdsZTtcclxuICAgICAgICB2YXIgZWEgPSB0aGlzLl9lbmRBbmdsZTtcclxuXHJcbiAgICAgICAgdmFyIGlyID0gdGhpcy5faW5uZXJSYWRpdXM7XHJcbiAgICAgICAgdmFyIG9yID0gdGhpcy5fb3V0ZXJSYWRpdXM7XHJcblxyXG4gICAgICAgIHZhciBjb25uZWN0ZWQgPSBtb2Qoc2EsIFRXT19QSSkgPT09IG1vZChlYSwgVFdPX1BJKTtcclxuICAgICAgICB2YXIgcHVuY3R1cmVkID0gaXIgPiAwO1xyXG5cclxuICAgICAgICB2YXIgdmVydGljZXMgPSB0aGlzLnZlcnRpY2VzO1xyXG4gICAgICAgIHZhciBsZW5ndGggPSAocHVuY3R1cmVkID8gdmVydGljZXMubGVuZ3RoIC8gMiA6IHZlcnRpY2VzLmxlbmd0aCk7XHJcbiAgICAgICAgdmFyIGNvbW1hbmQsIGlkID0gMDtcclxuXHJcbiAgICAgICAgaWYgKGNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgbGVuZ3RoLS07XHJcbiAgICAgICAgfSBlbHNlIGlmICghcHVuY3R1cmVkKSB7XHJcbiAgICAgICAgICBsZW5ndGggLT0gMjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIE91dGVyIENpcmNsZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsYXN0ID0gbGVuZ3RoIC0gMTsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHBjdCA9IGkgLyBsYXN0O1xyXG4gICAgICAgICAgdmFyIHYgPSB2ZXJ0aWNlc1tpZF07XHJcbiAgICAgICAgICB2YXIgdGhldGEgPSBwY3QgKiAoZWEgLSBzYSkgKyBzYTtcclxuICAgICAgICAgIHZhciBzdGVwID0gKGVhIC0gc2EpIC8gbGVuZ3RoO1xyXG5cclxuICAgICAgICAgIHZhciB4ID0gb3IgKiBNYXRoLmNvcyh0aGV0YSk7XHJcbiAgICAgICAgICB2YXIgeSA9IG9yICogTWF0aC5zaW4odGhldGEpO1xyXG5cclxuICAgICAgICAgIHN3aXRjaCAoaSkge1xyXG4gICAgICAgICAgICBjYXNlIDA6XHJcbiAgICAgICAgICAgICAgY29tbWFuZCA9IFR3by5Db21tYW5kcy5tb3ZlO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgIGNvbW1hbmQgPSBUd28uQ29tbWFuZHMuY3VydmU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdi5jb21tYW5kID0gY29tbWFuZDtcclxuICAgICAgICAgIHYueCA9IHg7XHJcbiAgICAgICAgICB2LnkgPSB5O1xyXG4gICAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgaWYgKHYuY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLmN1cnZlKSB7XHJcbiAgICAgICAgICAgIHZhciBhbXAgPSBvciAqIHN0ZXAgLyBNYXRoLlBJO1xyXG4gICAgICAgICAgICB2LmNvbnRyb2xzLmxlZnQueCA9IGFtcCAqIE1hdGguY29zKHRoZXRhIC0gSEFMRl9QSSk7XHJcbiAgICAgICAgICAgIHYuY29udHJvbHMubGVmdC55ID0gYW1wICogTWF0aC5zaW4odGhldGEgLSBIQUxGX1BJKTtcclxuICAgICAgICAgICAgdi5jb250cm9scy5yaWdodC54ID0gYW1wICogTWF0aC5jb3ModGhldGEgKyBIQUxGX1BJKTtcclxuICAgICAgICAgICAgdi5jb250cm9scy5yaWdodC55ID0gYW1wICogTWF0aC5zaW4odGhldGEgKyBIQUxGX1BJKTtcclxuICAgICAgICAgICAgaWYgKGkgPT09IDEpIHtcclxuICAgICAgICAgICAgICB2LmNvbnRyb2xzLmxlZnQubXVsdGlwbHlTY2FsYXIoMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGkgPT09IGxhc3QpIHtcclxuICAgICAgICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0Lm11bHRpcGx5U2NhbGFyKDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWQrKztcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocHVuY3R1cmVkKSB7XHJcblxyXG4gICAgICAgICAgaWYgKGNvbm5lY3RlZCkge1xyXG4gICAgICAgICAgICB2ZXJ0aWNlc1tpZF0uY29tbWFuZCA9IFR3by5Db21tYW5kcy5jbG9zZTtcclxuICAgICAgICAgICAgaWQrKztcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxlbmd0aC0tO1xyXG4gICAgICAgICAgICBsYXN0ID0gbGVuZ3RoIC0gMTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvKipcclxuICAgICAgICAgICAqIElubmVyIENpcmNsZVxyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIHBjdCA9IGkgLyBsYXN0O1xyXG4gICAgICAgICAgICB2ID0gdmVydGljZXNbaWRdO1xyXG4gICAgICAgICAgICB0aGV0YSA9ICgxIC0gcGN0KSAqIChlYSAtIHNhKSArIHNhO1xyXG4gICAgICAgICAgICBzdGVwID0gKGVhIC0gc2EpIC8gbGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgeCA9IGlyICogTWF0aC5jb3ModGhldGEpO1xyXG4gICAgICAgICAgICB5ID0gaXIgKiBNYXRoLnNpbih0aGV0YSk7XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSBUd28uQ29tbWFuZHMuY3VydmU7XHJcbiAgICAgICAgICAgIGlmIChpIDw9IDApIHtcclxuICAgICAgICAgICAgICBjb21tYW5kID0gY29ubmVjdGVkID8gVHdvLkNvbW1hbmRzLm1vdmUgOiBUd28uQ29tbWFuZHMubGluZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdi5jb21tYW5kID0gY29tbWFuZDtcclxuICAgICAgICAgICAgdi54ID0geDtcclxuICAgICAgICAgICAgdi55ID0geTtcclxuICAgICAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgICAgIHYuY29udHJvbHMucmlnaHQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2LmNvbW1hbmQgPT09IFR3by5Db21tYW5kcy5jdXJ2ZSkge1xyXG4gICAgICAgICAgICAgIGFtcCA9IGlyICogc3RlcCAvIE1hdGguUEk7XHJcbiAgICAgICAgICAgICAgdi5jb250cm9scy5sZWZ0LnggPSBhbXAgKiBNYXRoLmNvcyh0aGV0YSArIEhBTEZfUEkpO1xyXG4gICAgICAgICAgICAgIHYuY29udHJvbHMubGVmdC55ID0gYW1wICogTWF0aC5zaW4odGhldGEgKyBIQUxGX1BJKTtcclxuICAgICAgICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnggPSBhbXAgKiBNYXRoLmNvcyh0aGV0YSAtIEhBTEZfUEkpO1xyXG4gICAgICAgICAgICAgIHYuY29udHJvbHMucmlnaHQueSA9IGFtcCAqIE1hdGguc2luKHRoZXRhIC0gSEFMRl9QSSk7XHJcbiAgICAgICAgICAgICAgaWYgKGkgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHYuY29udHJvbHMubGVmdC5tdWx0aXBseVNjYWxhcigyKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKGkgPT09IGxhc3QpIHtcclxuICAgICAgICAgICAgICAgIHYuY29udHJvbHMucmlnaHQubXVsdGlwbHlTY2FsYXIoMik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZCsrO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIGlmICghY29ubmVjdGVkKSB7XHJcblxyXG4gICAgICAgICAgdmVydGljZXNbaWRdLmNvbW1hbmQgPSBUd28uQ29tbWFuZHMubGluZTtcclxuICAgICAgICAgIHZlcnRpY2VzW2lkXS54ID0gMDtcclxuICAgICAgICAgIHZlcnRpY2VzW2lkXS55ID0gMDtcclxuICAgICAgICAgIGlkKys7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRmluYWwgUG9pbnRcclxuICAgICAgICAgKi9cclxuICAgICAgICB2ZXJ0aWNlc1tpZF0uY29tbWFuZCA9IFR3by5Db21tYW5kcy5jbG9zZTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1N0YXJ0QW5nbGUgPSB0aGlzLl9mbGFnRW5kQW5nbGVcclxuICAgICAgICA9IHRoaXMuX2ZsYWdJbm5lclJhZGl1cyA9IHRoaXMuX2ZsYWdPdXRlclJhZGl1cyA9IGZhbHNlO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgQXJjU2VnbWVudC5NYWtlT2JzZXJ2YWJsZShBcmNTZWdtZW50LnByb3RvdHlwZSk7XHJcblxyXG4gIGZ1bmN0aW9uIG1vZCh2LCBsKSB7XHJcbiAgICB3aGlsZSAodiA8IDApIHtcclxuICAgICAgdiArPSBsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHYgJSBsO1xyXG4gIH1cclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGgsIFRXT19QSSA9IE1hdGguUEkgKiAyLCBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW47XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBTdGFyID0gVHdvLlN0YXIgPSBmdW5jdGlvbihveCwgb3ksIG9yLCBpciwgc2lkZXMpIHtcclxuXHJcbiAgICBpZiAoIV8uaXNOdW1iZXIoaXIpKSB7XHJcbiAgICAgIGlyID0gb3IgLyAyO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghXy5pc051bWJlcihzaWRlcykgfHwgc2lkZXMgPD0gMCkge1xyXG4gICAgICBzaWRlcyA9IDU7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGxlbmd0aCA9IHNpZGVzICogMjtcclxuXHJcbiAgICB2YXIgcG9pbnRzID0gXy5tYXAoXy5yYW5nZShsZW5ndGgpLCBmdW5jdGlvbihpKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdvLkFuY2hvcigpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIHBvaW50cywgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5pbm5lclJhZGl1cyA9IGlyO1xyXG4gICAgdGhpcy5vdXRlclJhZGl1cyA9IG9yO1xyXG4gICAgdGhpcy5zaWRlcyA9IHNpZGVzO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQob3gsIG95KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoU3Rhciwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFsnaW5uZXJSYWRpdXMnLCAnb3V0ZXJSYWRpdXMnLCAnc2lkZXMnXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICBQYXRoLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChTdGFyLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChTdGFyLnByb3RvdHlwZSwgUGF0aC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfaW5uZXJSYWRpdXM6IDAsXHJcbiAgICBfb3V0ZXJSYWRpdXM6IDAsXHJcbiAgICBfc2lkZXM6IDAsXHJcblxyXG4gICAgX2ZsYWdJbm5lclJhZGl1czogZmFsc2UsXHJcbiAgICBfZmxhZ091dGVyUmFkaXVzOiBmYWxzZSxcclxuICAgIF9mbGFnU2lkZXM6IGZhbHNlLFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdJbm5lclJhZGl1cyB8fCB0aGlzLl9mbGFnT3V0ZXJSYWRpdXMgfHwgdGhpcy5fZmxhZ1NpZGVzKSB7XHJcblxyXG4gICAgICAgIHZhciBzaWRlcyA9IHRoaXMuX3NpZGVzICogMjtcclxuICAgICAgICB2YXIgYW1vdW50ID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmIChhbW91bnQgPiBzaWRlcykge1xyXG4gICAgICAgICAgdGhpcy52ZXJ0aWNlcy5zcGxpY2Uoc2lkZXMgLSAxLCBhbW91bnQgLSBzaWRlcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpZGVzOyBpKyspIHtcclxuXHJcbiAgICAgICAgICB2YXIgcGN0ID0gKGkgKyAwLjUpIC8gc2lkZXM7XHJcbiAgICAgICAgICB2YXIgdGhldGEgPSBUV09fUEkgKiBwY3Q7XHJcbiAgICAgICAgICB2YXIgciA9IChpICUgMiA/IHRoaXMuX2lubmVyUmFkaXVzIDogdGhpcy5fb3V0ZXJSYWRpdXMpO1xyXG4gICAgICAgICAgdmFyIHggPSByICogY29zKHRoZXRhKTtcclxuICAgICAgICAgIHZhciB5ID0gciAqIHNpbih0aGV0YSk7XHJcblxyXG4gICAgICAgICAgaWYgKGkgPj0gYW1vdW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGljZXMucHVzaChuZXcgVHdvLkFuY2hvcih4LCB5KSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2VzW2ldLnNldCh4LCB5KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ0lubmVyUmFkaXVzID0gdGhpcy5fZmxhZ091dGVyUmFkaXVzID0gdGhpcy5fZmxhZ1NpZGVzID0gZmFsc2U7XHJcbiAgICAgIFBhdGgucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgU3Rhci5NYWtlT2JzZXJ2YWJsZShTdGFyLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgUm91bmRlZFJlY3RhbmdsZSA9IFR3by5Sb3VuZGVkUmVjdGFuZ2xlID0gZnVuY3Rpb24ob3gsIG95LCB3aWR0aCwgaGVpZ2h0LCByYWRpdXMpIHtcclxuXHJcbiAgICBpZiAoIV8uaXNOdW1iZXIocmFkaXVzKSkge1xyXG4gICAgICByYWRpdXMgPSBNYXRoLmZsb29yKE1hdGgubWluKHdpZHRoLCBoZWlnaHQpIC8gMTIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhbW91bnQgPSAxMDtcclxuXHJcbiAgICB2YXIgcG9pbnRzID0gXy5tYXAoXy5yYW5nZShhbW91bnQpLCBmdW5jdGlvbihpKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdvLkFuY2hvcigwLCAwLCAwLCAwLCAwLCAwLFxyXG4gICAgICAgIGkgPT09IDAgPyBUd28uQ29tbWFuZHMubW92ZSA6IFR3by5Db21tYW5kcy5jdXJ2ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdLmNvbW1hbmQgPSBUd28uQ29tbWFuZHMuY2xvc2U7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIHBvaW50cywgZmFsc2UsIGZhbHNlLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIHRoaXMucmFkaXVzID0gcmFkaXVzO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQob3gsIG95KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoUm91bmRlZFJlY3RhbmdsZSwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFsnd2lkdGgnLCAnaGVpZ2h0JywgJ3JhZGl1cyddLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgIFBhdGguTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKFJvdW5kZWRSZWN0YW5nbGUuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFJvdW5kZWRSZWN0YW5nbGUucHJvdG90eXBlLCBQYXRoLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF93aWR0aDogMCxcclxuICAgIF9oZWlnaHQ6IDAsXHJcbiAgICBfcmFkaXVzOiAwLFxyXG5cclxuICAgIF9mbGFnV2lkdGg6IGZhbHNlLFxyXG4gICAgX2ZsYWdIZWlnaHQ6IGZhbHNlLFxyXG4gICAgX2ZsYWdSYWRpdXM6IGZhbHNlLFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdXaWR0aCB8fCB0aGlzLl9mbGFnSGVpZ2h0IHx8IHRoaXMuX2ZsYWdSYWRpdXMpIHtcclxuXHJcbiAgICAgICAgdmFyIHdpZHRoID0gdGhpcy5fd2lkdGg7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IHRoaXMuX2hlaWdodDtcclxuICAgICAgICB2YXIgcmFkaXVzID0gTWF0aC5taW4oTWF0aC5tYXgodGhpcy5fcmFkaXVzLCAwKSxcclxuICAgICAgICAgIE1hdGgubWluKHdpZHRoLCBoZWlnaHQpKTtcclxuXHJcbiAgICAgICAgdmFyIHY7XHJcbiAgICAgICAgdmFyIHcgPSB3aWR0aCAvIDI7XHJcbiAgICAgICAgdmFyIGggPSBoZWlnaHQgLyAyO1xyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1swXTtcclxuICAgICAgICB2LnggPSAtICh3IC0gcmFkaXVzKTtcclxuICAgICAgICB2LnkgPSAtIGg7XHJcblxyXG4gICAgICAgIC8vIFVwcGVyIFJpZ2h0IENvcm5lclxyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1sxXTtcclxuICAgICAgICB2LnggPSAodyAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi55ID0gLSBoO1xyXG4gICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQueCA9IHJhZGl1cztcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnkgPSAwO1xyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1syXTtcclxuICAgICAgICB2LnggPSB3O1xyXG4gICAgICAgIHYueSA9IC0gKGggLSByYWRpdXMpO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQuY2xlYXIoKTtcclxuICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgLy8gQm90dG9tIFJpZ2h0IENvcm5lclxyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1szXTtcclxuICAgICAgICB2LnggPSB3O1xyXG4gICAgICAgIHYueSA9IChoIC0gcmFkaXVzKTtcclxuICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnggPSAwO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQueSA9IHJhZGl1cztcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbNF07XHJcbiAgICAgICAgdi54ID0gKHcgLSByYWRpdXMpO1xyXG4gICAgICAgIHYueSA9IGg7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC5jbGVhcigpO1xyXG4gICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG5cclxuICAgICAgICAvLyBCb3R0b20gTGVmdCBDb3JuZXJcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbNV07XHJcbiAgICAgICAgdi54ID0gLSAodyAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi55ID0gaDtcclxuICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnggPSAtIHJhZGl1cztcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnkgPSAwO1xyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1s2XTtcclxuICAgICAgICB2LnggPSAtIHc7XHJcbiAgICAgICAgdi55ID0gKGggLSByYWRpdXMpO1xyXG4gICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgLy8gVXBwZXIgTGVmdCBDb3JuZXJcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbN107XHJcbiAgICAgICAgdi54ID0gLSB3O1xyXG4gICAgICAgIHYueSA9IC0gKGggLSByYWRpdXMpO1xyXG4gICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQueCA9IDA7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC55ID0gLSByYWRpdXM7XHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzhdO1xyXG4gICAgICAgIHYueCA9IC0gKHcgLSByYWRpdXMpO1xyXG4gICAgICAgIHYueSA9IC0gaDtcclxuICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LmNsZWFyKCk7XHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzldO1xyXG4gICAgICAgIHYuY29weSh0aGlzLnZlcnRpY2VzWzhdKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdXaWR0aCA9IHRoaXMuX2ZsYWdIZWlnaHQgPSB0aGlzLl9mbGFnUmFkaXVzID0gZmFsc2U7XHJcbiAgICAgIFBhdGgucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgUm91bmRlZFJlY3RhbmdsZS5NYWtlT2JzZXJ2YWJsZShSb3VuZGVkUmVjdGFuZ2xlLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgcm9vdCA9IFR3by5yb290O1xyXG4gIHZhciBnZXRDb21wdXRlZE1hdHJpeCA9IFR3by5VdGlscy5nZXRDb21wdXRlZE1hdHJpeDtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIGNhbnZhcyA9IChyb290LmRvY3VtZW50ID8gcm9vdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSA6IHsgZ2V0Q29udGV4dDogXy5pZGVudGl0eSB9KTtcclxuICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gIHZhciBUZXh0ID0gVHdvLlRleHQgPSBmdW5jdGlvbihtZXNzYWdlLCB4LCB5LCBzdHlsZXMpIHtcclxuXHJcbiAgICBUd28uU2hhcGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlci50eXBlID0gJ3RleHQnO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ0ZpbGwgPSBfLmJpbmQoVGV4dC5GbGFnRmlsbCwgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnU3Ryb2tlID0gXy5iaW5kKFRleHQuRmxhZ1N0cm9rZSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy52YWx1ZSA9IG1lc3NhZ2U7XHJcblxyXG4gICAgaWYgKF8uaXNOdW1iZXIoeCkpIHtcclxuICAgICAgICB0aGlzLnRyYW5zbGF0aW9uLnggPSB4O1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIoeSkpIHtcclxuICAgICAgICB0aGlzLnRyYW5zbGF0aW9uLnkgPSB5O1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghXy5pc09iamVjdChzdHlsZXMpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIF8uZWFjaChUd28uVGV4dC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG5cclxuICAgICAgaWYgKHByb3BlcnR5IGluIHN0eWxlcykge1xyXG4gICAgICAgIHRoaXNbcHJvcGVydHldID0gc3R5bGVzW3Byb3BlcnR5XTtcclxuICAgICAgfVxyXG5cclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChUd28uVGV4dCwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFtcclxuICAgICAgJ3ZhbHVlJywgJ2ZhbWlseScsICdzaXplJywgJ2xlYWRpbmcnLCAnYWxpZ25tZW50JywgJ2xpbmV3aWR0aCcsICdzdHlsZScsXHJcbiAgICAgICd3ZWlnaHQnLCAnZGVjb3JhdGlvbicsICdiYXNlbGluZScsICdvcGFjaXR5JywgJ3Zpc2libGUnLCAnZmlsbCcsICdzdHJva2UnXHJcbiAgICBdLFxyXG5cclxuICAgIEZsYWdGaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ0ZpbGwgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBGbGFnU3Ryb2tlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ1N0cm9rZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgIFR3by5TaGFwZS5NYWtlT2JzZXJ2YWJsZShvYmplY3QpO1xyXG5cclxuICAgICAgXy5lYWNoKFR3by5UZXh0LlByb3BlcnRpZXMuc2xpY2UoMCwgMTIpLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iamVjdCk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnZmlsbCcsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZmlsbDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZikge1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmlsbC51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdGaWxsKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9maWxsID0gZjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdGaWxsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5HcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbGwuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ0ZpbGwpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ3N0cm9rZScsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc3Ryb2tlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihmKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5HcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0cm9rZS51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdTdHJva2UpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX3N0cm9rZSA9IGY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnU3Ryb2tlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3Ryb2tlLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdTdHJva2UpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2NsaXAnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2NsaXA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXMuX2NsaXAgPSB2O1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ0NsaXAgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoVHdvLlRleHQucHJvdG90eXBlLCBUd28uU2hhcGUucHJvdG90eXBlLCB7XHJcblxyXG4gICAgLy8gRmxhZ3NcclxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmxhZ1xyXG5cclxuICAgIF9mbGFnVmFsdWU6IHRydWUsXHJcbiAgICBfZmxhZ0ZhbWlseTogdHJ1ZSxcclxuICAgIF9mbGFnU2l6ZTogdHJ1ZSxcclxuICAgIF9mbGFnTGVhZGluZzogdHJ1ZSxcclxuICAgIF9mbGFnQWxpZ25tZW50OiB0cnVlLFxyXG4gICAgX2ZsYWdCYXNlbGluZTogdHJ1ZSxcclxuICAgIF9mbGFnU3R5bGU6IHRydWUsXHJcbiAgICBfZmxhZ1dlaWdodDogdHJ1ZSxcclxuICAgIF9mbGFnRGVjb3JhdGlvbjogdHJ1ZSxcclxuXHJcbiAgICBfZmxhZ0ZpbGw6IHRydWUsXHJcbiAgICBfZmxhZ1N0cm9rZTogdHJ1ZSxcclxuICAgIF9mbGFnTGluZXdpZHRoOiB0cnVlLFxyXG4gICAgX2ZsYWdPcGFjaXR5OiB0cnVlLFxyXG4gICAgX2ZsYWdWaXNpYmxlOiB0cnVlLFxyXG5cclxuICAgIF9mbGFnQ2xpcDogZmFsc2UsXHJcblxyXG4gICAgLy8gVW5kZXJseWluZyBQcm9wZXJ0aWVzXHJcblxyXG4gICAgX3ZhbHVlOiAnJyxcclxuICAgIF9mYW1pbHk6ICdzYW5zLXNlcmlmJyxcclxuICAgIF9zaXplOiAxMyxcclxuICAgIF9sZWFkaW5nOiAxNyxcclxuICAgIF9hbGlnbm1lbnQ6ICdjZW50ZXInLFxyXG4gICAgX2Jhc2VsaW5lOiAnbWlkZGxlJyxcclxuICAgIF9zdHlsZTogJ25vcm1hbCcsXHJcbiAgICBfd2VpZ2h0OiA1MDAsXHJcbiAgICBfZGVjb3JhdGlvbjogJ25vbmUnLFxyXG5cclxuICAgIF9maWxsOiAnIzAwMCcsXHJcbiAgICBfc3Ryb2tlOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgX2xpbmV3aWR0aDogMSxcclxuICAgIF9vcGFjaXR5OiAxLFxyXG4gICAgX3Zpc2libGU6IHRydWUsXHJcblxyXG4gICAgX2NsaXA6IGZhbHNlLFxyXG5cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAoIXRoaXMucGFyZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMucGFyZW50LnJlbW92ZSh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG5cclxuICAgICAgdmFyIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBUd28uVGV4dCh0aGlzLnZhbHVlKTtcclxuICAgICAgY2xvbmUudHJhbnNsYXRpb24uY29weSh0aGlzLnRyYW5zbGF0aW9uKTtcclxuICAgICAgY2xvbmUucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uO1xyXG4gICAgICBjbG9uZS5zY2FsZSA9IHRoaXMuc2NhbGU7XHJcblxyXG4gICAgICBfLmVhY2goVHdvLlRleHQuUHJvcGVydGllcywgZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuICAgICAgICBjbG9uZVtwcm9wZXJ0eV0gPSB0aGlzW3Byb3BlcnR5XTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LmFkZChjbG9uZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgdHJhbnNsYXRpb246IHRoaXMudHJhbnNsYXRpb24udG9PYmplY3QoKSxcclxuICAgICAgICByb3RhdGlvbjogdGhpcy5yb3RhdGlvbixcclxuICAgICAgICBzY2FsZTogdGhpcy5zY2FsZVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgXy5lYWNoKFR3by5UZXh0LlByb3BlcnRpZXMsIGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgcmVzdWx0W3Byb3BlcnR5XSA9IHRoaXNbcHJvcGVydHldO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBub1N0cm9rZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc3Ryb2tlID0gJ3RyYW5zcGFyZW50JztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vRmlsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuZmlsbCA9ICd0cmFuc3BhcmVudCc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEEgc2hpbSB0byBub3QgYnJlYWsgYGdldEJvdW5kaW5nQ2xpZW50UmVjdGAgY2FsbHMuIFRPRE86IEltcGxlbWVudCBhXHJcbiAgICAgKiB3YXkgdG8gY2FsY3VsYXRlIHByb3BlciBib3VuZGluZyBib3hlcyBvZiBgVHdvLlRleHRgLlxyXG4gICAgICovXHJcbiAgICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IGZ1bmN0aW9uKHNoYWxsb3cpIHtcclxuXHJcbiAgICAgIHZhciBtYXRyaXgsIGJvcmRlciwgbCwgeCwgeSwgaSwgdjtcclxuXHJcbiAgICAgIHZhciBsZWZ0ID0gSW5maW5pdHksIHJpZ2h0ID0gLUluZmluaXR5LFxyXG4gICAgICAgICAgdG9wID0gSW5maW5pdHksIGJvdHRvbSA9IC1JbmZpbml0eTtcclxuXHJcbiAgICAgIC8vIFRPRE86IFVwZGF0ZSB0aGlzIHRvIG5vdCBfX2Fsd2F5c19fIHVwZGF0ZS4gSnVzdCB3aGVuIGl0IG5lZWRzIHRvLlxyXG4gICAgICB0aGlzLl91cGRhdGUodHJ1ZSk7XHJcblxyXG4gICAgICBtYXRyaXggPSAhIXNoYWxsb3cgPyB0aGlzLl9tYXRyaXggOiBnZXRDb21wdXRlZE1hdHJpeCh0aGlzKTtcclxuXHJcbiAgICAgIHYgPSBtYXRyaXgubXVsdGlwbHkoMCwgMCwgMSk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogdi54LFxyXG4gICAgICAgIGxlZnQ6IHYueSxcclxuICAgICAgICByaWdodDogdi54LFxyXG4gICAgICAgIGJvdHRvbTogdi55LFxyXG4gICAgICAgIHdpZHRoOiAwLFxyXG4gICAgICAgIGhlaWdodDogMFxyXG4gICAgICB9O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdWYWx1ZSA9IHRoaXMuX2ZsYWdGYW1pbHkgPSB0aGlzLl9mbGFnU2l6ZSA9XHJcbiAgICAgICAgdGhpcy5fZmxhZ0xlYWRpbmcgPSB0aGlzLl9mbGFnQWxpZ25tZW50ID0gdGhpcy5fZmxhZ0ZpbGwgPVxyXG4gICAgICAgIHRoaXMuX2ZsYWdTdHJva2UgPSB0aGlzLl9mbGFnTGluZXdpZHRoID0gdGhpcy5fZmxhZ09wYWljdHkgPVxyXG4gICAgICAgIHRoaXMuX2ZsYWdWaXNpYmxlID0gdGhpcy5fZmxhZ0NsaXAgPSB0aGlzLl9mbGFnRGVjb3JhdGlvbiA9XHJcbiAgICAgICAgdGhpcy5fZmxhZ0Jhc2VsaW5lID0gZmFsc2U7XHJcblxyXG4gICAgICBUd28uU2hhcGUucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgVHdvLlRleHQuTWFrZU9ic2VydmFibGUoVHdvLlRleHQucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgU3RvcCA9IFR3by5TdG9wID0gZnVuY3Rpb24ob2Zmc2V0LCBjb2xvciwgb3BhY2l0eSkge1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyID0ge307XHJcbiAgICB0aGlzLl9yZW5kZXJlci50eXBlID0gJ3N0b3AnO1xyXG5cclxuICAgIHRoaXMub2Zmc2V0ID0gXy5pc051bWJlcihvZmZzZXQpID8gb2Zmc2V0XHJcbiAgICAgIDogU3RvcC5JbmRleCA8PSAwID8gMCA6IDE7XHJcblxyXG4gICAgdGhpcy5vcGFjaXR5ID0gXy5pc051bWJlcihvcGFjaXR5KSA/IG9wYWNpdHkgOiAxO1xyXG5cclxuICAgIHRoaXMuY29sb3IgPSBfLmlzU3RyaW5nKGNvbG9yKSA/IGNvbG9yXHJcbiAgICAgIDogU3RvcC5JbmRleCA8PSAwID8gJyNmZmYnIDogJyMwMDAnO1xyXG5cclxuICAgIFN0b3AuSW5kZXggPSAoU3RvcC5JbmRleCArIDEpICUgMjtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoU3RvcCwge1xyXG5cclxuICAgIEluZGV4OiAwLFxyXG5cclxuICAgIFByb3BlcnRpZXM6IFtcclxuICAgICAgJ29mZnNldCcsXHJcbiAgICAgICdvcGFjaXR5JyxcclxuICAgICAgJ2NvbG9yJ1xyXG4gICAgXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICBfLmVhY2goU3RvcC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG5cclxuICAgICAgICB2YXIgb2JqZWN0ID0gdGhpcztcclxuICAgICAgICB2YXIgc2VjcmV0ID0gJ18nICsgcHJvcGVydHk7XHJcbiAgICAgICAgdmFyIGZsYWcgPSAnX2ZsYWcnICsgcHJvcGVydHkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wZXJ0eS5zbGljZSgxKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgcHJvcGVydHksIHtcclxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1tzZWNyZXRdO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgICB0aGlzW3NlY3JldF0gPSB2O1xyXG4gICAgICAgICAgICB0aGlzW2ZsYWddID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5wYXJlbnQuX2ZsYWdTdG9wcyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH0sIG9iamVjdCk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoU3RvcC5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgU3RvcCgpO1xyXG5cclxuICAgICAgXy5lYWNoKFN0b3AuUHJvcGVydGllcywgZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuICAgICAgICBjbG9uZVtwcm9wZXJ0eV0gPSB0aGlzW3Byb3BlcnR5XTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVzdWx0ID0ge307XHJcblxyXG4gICAgICBfLmVhY2goU3RvcC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgcmVzdWx0W2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdPZmZzZXQgPSB0aGlzLl9mbGFnQ29sb3IgPSB0aGlzLl9mbGFnT3BhY2l0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgU3RvcC5NYWtlT2JzZXJ2YWJsZShTdG9wLnByb3RvdHlwZSk7XHJcblxyXG4gIHZhciBHcmFkaWVudCA9IFR3by5HcmFkaWVudCA9IGZ1bmN0aW9uKHN0b3BzKSB7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIgPSB7fTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLnR5cGUgPSAnZ3JhZGllbnQnO1xyXG5cclxuICAgIHRoaXMuaWQgPSBUd28uSWRlbnRpZmllciArIFR3by51bmlxdWVJZCgpO1xyXG4gICAgdGhpcy5jbGFzc0xpc3QgPSBbXTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnU3RvcHMgPSBfLmJpbmQoR3JhZGllbnQuRmxhZ1N0b3BzLCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLmJpbmRTdG9wcyA9IF8uYmluZChHcmFkaWVudC5CaW5kU3RvcHMsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIudW5iaW5kU3RvcHMgPSBfLmJpbmQoR3JhZGllbnQuVW5iaW5kU3RvcHMsIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuc3ByZWFkID0gJ3BhZCc7XHJcblxyXG4gICAgdGhpcy5zdG9wcyA9IHN0b3BzO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChHcmFkaWVudCwge1xyXG5cclxuICAgIFN0b3A6IFN0b3AsXHJcblxyXG4gICAgUHJvcGVydGllczogW1xyXG4gICAgICAnc3ByZWFkJ1xyXG4gICAgXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICBfLmVhY2goR3JhZGllbnQuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmplY3QpO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ3N0b3BzJywge1xyXG5cclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3N0b3BzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oc3RvcHMpIHtcclxuXHJcbiAgICAgICAgICB2YXIgdXBkYXRlU3RvcHMgPSB0aGlzLl9yZW5kZXJlci5mbGFnU3RvcHM7XHJcbiAgICAgICAgICB2YXIgYmluZFN0b3BzID0gdGhpcy5fcmVuZGVyZXIuYmluZFN0b3BzO1xyXG4gICAgICAgICAgdmFyIHVuYmluZFN0b3BzID0gdGhpcy5fcmVuZGVyZXIudW5iaW5kU3RvcHM7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIHByZXZpb3VzIGxpc3RlbmVyc1xyXG4gICAgICAgICAgaWYgKHRoaXMuX3N0b3BzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BzXHJcbiAgICAgICAgICAgICAgLnVuYmluZChUd28uRXZlbnRzLmluc2VydCwgYmluZFN0b3BzKVxyXG4gICAgICAgICAgICAgIC51bmJpbmQoVHdvLkV2ZW50cy5yZW1vdmUsIHVuYmluZFN0b3BzKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDcmVhdGUgbmV3IENvbGxlY3Rpb24gd2l0aCBjb3B5IG9mIFN0b3BzXHJcbiAgICAgICAgICB0aGlzLl9zdG9wcyA9IG5ldyBUd28uVXRpbHMuQ29sbGVjdGlvbigoc3RvcHMgfHwgW10pLnNsaWNlKDApKTtcclxuXHJcbiAgICAgICAgICAvLyBMaXN0ZW4gZm9yIENvbGxlY3Rpb24gY2hhbmdlcyBhbmQgYmluZCAvIHVuYmluZFxyXG4gICAgICAgICAgdGhpcy5fc3RvcHNcclxuICAgICAgICAgICAgLmJpbmQoVHdvLkV2ZW50cy5pbnNlcnQsIGJpbmRTdG9wcylcclxuICAgICAgICAgICAgLmJpbmQoVHdvLkV2ZW50cy5yZW1vdmUsIHVuYmluZFN0b3BzKTtcclxuXHJcbiAgICAgICAgICAvLyBCaW5kIEluaXRpYWwgU3RvcHNcclxuICAgICAgICAgIGJpbmRTdG9wcyh0aGlzLl9zdG9wcyk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgRmxhZ1N0b3BzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ1N0b3BzID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgQmluZFN0b3BzOiBmdW5jdGlvbihpdGVtcykge1xyXG5cclxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYSBsb3RcclxuICAgICAgLy8gd2hlbiBpbXBvcnRpbmcgYSBsYXJnZSBTVkdcclxuICAgICAgdmFyIGkgPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgIHdoaWxlKGktLSkge1xyXG4gICAgICAgIGl0ZW1zW2ldLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdTdG9wcyk7XHJcbiAgICAgICAgaXRlbXNbaV0ucGFyZW50ID0gdGhpcztcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0b3BzKCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBVbmJpbmRTdG9wczogZnVuY3Rpb24oaXRlbXMpIHtcclxuXHJcbiAgICAgIHZhciBpID0gaXRlbXMubGVuZ3RoO1xyXG4gICAgICB3aGlsZShpLS0pIHtcclxuICAgICAgICBpdGVtc1tpXS51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdTdG9wcyk7XHJcbiAgICAgICAgZGVsZXRlIGl0ZW1zW2ldLnBhcmVudDtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0b3BzKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoR3JhZGllbnQucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgX2ZsYWdTdG9wczogZmFsc2UsXHJcbiAgICBfZmxhZ1NwcmVhZDogZmFsc2UsXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG5cclxuICAgICAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgdmFyIHN0b3BzID0gXy5tYXAodGhpcy5zdG9wcywgZnVuY3Rpb24ocykge1xyXG4gICAgICAgIHJldHVybiBzLmNsb25lKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IEdyYWRpZW50KHN0b3BzKTtcclxuXHJcbiAgICAgIF8uZWFjaChUd28uR3JhZGllbnQuUHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIGNsb25lW2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LmFkZChjbG9uZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgc3RvcHM6IF8ubWFwKHRoaXMuc3RvcHMsIGZ1bmN0aW9uKHMpIHtcclxuICAgICAgICAgIHJldHVybiBzLnRvT2JqZWN0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgfTtcclxuXHJcbiAgICAgIF8uZWFjaChHcmFkaWVudC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgcmVzdWx0W2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9mbGFnU3RvcHMpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnU3ByZWFkID0gdGhpcy5fZmxhZ1N0b3BzID0gZmFsc2U7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBHcmFkaWVudC5NYWtlT2JzZXJ2YWJsZShHcmFkaWVudC5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBMaW5lYXJHcmFkaWVudCA9IFR3by5MaW5lYXJHcmFkaWVudCA9IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCBzdG9wcykge1xyXG5cclxuICAgIFR3by5HcmFkaWVudC5jYWxsKHRoaXMsIHN0b3BzKTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlci50eXBlID0gJ2xpbmVhci1ncmFkaWVudCc7XHJcblxyXG4gICAgdmFyIGZsYWdFbmRQb2ludHMgPSBfLmJpbmQoTGluZWFyR3JhZGllbnQuRmxhZ0VuZFBvaW50cywgdGhpcyk7XHJcbiAgICB0aGlzLmxlZnQgPSBuZXcgVHdvLlZlY3RvcigpLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIGZsYWdFbmRQb2ludHMpO1xyXG4gICAgdGhpcy5yaWdodCA9IG5ldyBUd28uVmVjdG9yKCkuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgZmxhZ0VuZFBvaW50cyk7XHJcblxyXG4gICAgaWYgKF8uaXNOdW1iZXIoeDEpKSB7XHJcbiAgICAgIHRoaXMubGVmdC54ID0geDE7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcih5MSkpIHtcclxuICAgICAgdGhpcy5sZWZ0LnkgPSB5MTtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKHgyKSkge1xyXG4gICAgICB0aGlzLnJpZ2h0LnggPSB4MjtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKHkyKSkge1xyXG4gICAgICB0aGlzLnJpZ2h0LnkgPSB5MjtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoTGluZWFyR3JhZGllbnQsIHtcclxuXHJcbiAgICBTdG9wOiBUd28uR3JhZGllbnQuU3RvcCxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcbiAgICAgIFR3by5HcmFkaWVudC5NYWtlT2JzZXJ2YWJsZShvYmplY3QpO1xyXG4gICAgfSxcclxuXHJcbiAgICBGbGFnRW5kUG9pbnRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ0VuZFBvaW50cyA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChMaW5lYXJHcmFkaWVudC5wcm90b3R5cGUsIFR3by5HcmFkaWVudC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfZmxhZ0VuZFBvaW50czogZmFsc2UsXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG5cclxuICAgICAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgdmFyIHN0b3BzID0gXy5tYXAodGhpcy5zdG9wcywgZnVuY3Rpb24oc3RvcCkge1xyXG4gICAgICAgIHJldHVybiBzdG9wLmNsb25lKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IExpbmVhckdyYWRpZW50KHRoaXMubGVmdC5feCwgdGhpcy5sZWZ0Ll95LFxyXG4gICAgICAgIHRoaXMucmlnaHQuX3gsIHRoaXMucmlnaHQuX3ksIHN0b3BzKTtcclxuXHJcbiAgICAgIF8uZWFjaChUd28uR3JhZGllbnQuUHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIGNsb25lW2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LmFkZChjbG9uZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZXN1bHQgPSBUd28uR3JhZGllbnQucHJvdG90eXBlLnRvT2JqZWN0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXN1bHQubGVmdCA9IHRoaXMubGVmdC50b09iamVjdCgpO1xyXG4gICAgICByZXN1bHQucmlnaHQgPSB0aGlzLnJpZ2h0LnRvT2JqZWN0KCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ0VuZFBvaW50cyB8fCB0aGlzLl9mbGFnU3ByZWFkIHx8IHRoaXMuX2ZsYWdTdG9wcykge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdFbmRQb2ludHMgPSBmYWxzZTtcclxuXHJcbiAgICAgIFR3by5HcmFkaWVudC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBMaW5lYXJHcmFkaWVudC5NYWtlT2JzZXJ2YWJsZShMaW5lYXJHcmFkaWVudC5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBSYWRpYWxHcmFkaWVudCA9IFR3by5SYWRpYWxHcmFkaWVudCA9IGZ1bmN0aW9uKGN4LCBjeSwgciwgc3RvcHMsIGZ4LCBmeSkge1xyXG5cclxuICAgIFR3by5HcmFkaWVudC5jYWxsKHRoaXMsIHN0b3BzKTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlci50eXBlID0gJ3JhZGlhbC1ncmFkaWVudCc7XHJcblxyXG4gICAgdGhpcy5jZW50ZXIgPSBuZXcgVHdvLlZlY3RvcigpXHJcbiAgICAgIC5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCBfLmJpbmQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5fZmxhZ0NlbnRlciA9IHRydWU7XHJcbiAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICB0aGlzLnJhZGl1cyA9IF8uaXNOdW1iZXIocikgPyByIDogMjA7XHJcblxyXG4gICAgdGhpcy5mb2NhbCA9IG5ldyBUd28uVmVjdG9yKClcclxuICAgICAgLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIF8uYmluZChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLl9mbGFnRm9jYWwgPSB0cnVlO1xyXG4gICAgICB9LCB0aGlzKSk7XHJcblxyXG4gICAgaWYgKF8uaXNOdW1iZXIoY3gpKSB7XHJcbiAgICAgIHRoaXMuY2VudGVyLnggPSBjeDtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKGN5KSkge1xyXG4gICAgICB0aGlzLmNlbnRlci55ID0gY3k7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5mb2NhbC5jb3B5KHRoaXMuY2VudGVyKTtcclxuXHJcbiAgICBpZiAoXy5pc051bWJlcihmeCkpIHtcclxuICAgICAgdGhpcy5mb2NhbC54ID0gZng7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcihmeSkpIHtcclxuICAgICAgdGhpcy5mb2NhbC55ID0gZnk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFJhZGlhbEdyYWRpZW50LCB7XHJcblxyXG4gICAgU3RvcDogVHdvLkdyYWRpZW50LlN0b3AsXHJcblxyXG4gICAgUHJvcGVydGllczogW1xyXG4gICAgICAncmFkaXVzJ1xyXG4gICAgXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICBUd28uR3JhZGllbnQuTWFrZU9ic2VydmFibGUob2JqZWN0KTtcclxuXHJcbiAgICAgIF8uZWFjaChSYWRpYWxHcmFkaWVudC5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iamVjdCk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUmFkaWFsR3JhZGllbnQucHJvdG90eXBlLCBUd28uR3JhZGllbnQucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX2ZsYWdSYWRpdXM6IGZhbHNlLFxyXG4gICAgX2ZsYWdDZW50ZXI6IGZhbHNlLFxyXG4gICAgX2ZsYWdGb2NhbDogZmFsc2UsXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG5cclxuICAgICAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgdmFyIHN0b3BzID0gXy5tYXAodGhpcy5zdG9wcywgZnVuY3Rpb24oc3RvcCkge1xyXG4gICAgICAgIHJldHVybiBzdG9wLmNsb25lKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IFJhZGlhbEdyYWRpZW50KHRoaXMuY2VudGVyLl94LCB0aGlzLmNlbnRlci5feSxcclxuICAgICAgICAgIHRoaXMuX3JhZGl1cywgc3RvcHMsIHRoaXMuZm9jYWwuX3gsIHRoaXMuZm9jYWwuX3kpO1xyXG5cclxuICAgICAgXy5lYWNoKFR3by5HcmFkaWVudC5Qcm9wZXJ0aWVzLmNvbmNhdChSYWRpYWxHcmFkaWVudC5Qcm9wZXJ0aWVzKSwgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIGNsb25lW2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LmFkZChjbG9uZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZXN1bHQgPSBUd28uR3JhZGllbnQucHJvdG90eXBlLnRvT2JqZWN0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICBfLmVhY2goUmFkaWFsR3JhZGllbnQuUHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIHJlc3VsdFtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmVzdWx0LmNlbnRlciA9IHRoaXMuY2VudGVyLnRvT2JqZWN0KCk7XHJcbiAgICAgIHJlc3VsdC5mb2NhbCA9IHRoaXMuZm9jYWwudG9PYmplY3QoKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnUmFkaXVzIHx8IHRoaXMuX2ZsYXRDZW50ZXIgfHwgdGhpcy5fZmxhZ0ZvY2FsXHJcbiAgICAgICAgfHwgdGhpcy5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9mbGFnU3RvcHMpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnUmFkaXVzID0gdGhpcy5fZmxhZ0NlbnRlciA9IHRoaXMuX2ZsYWdGb2NhbCA9IGZhbHNlO1xyXG5cclxuICAgICAgVHdvLkdyYWRpZW50LnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFJhZGlhbEdyYWRpZW50Lk1ha2VPYnNlcnZhYmxlKFJhZGlhbEdyYWRpZW50LnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuICB2YXIgYW5jaG9yO1xyXG4gIHZhciByZWdleCA9IHtcclxuICAgIHZpZGVvOiAvXFwuKG1wNHx3ZWJtKSQvaSxcclxuICAgIGltYWdlOiAvXFwuKGpwZT9nfHBuZ3xnaWZ8dGlmZikkL2lcclxuICB9O1xyXG5cclxuICBpZiAodGhpcy5kb2N1bWVudCkge1xyXG4gICAgYW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gIH1cclxuXHJcbiAgdmFyIFRleHR1cmUgPSBUd28uVGV4dHVyZSA9IGZ1bmN0aW9uKHNyYywgY2FsbGJhY2spIHtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlciA9IHt9O1xyXG4gICAgdGhpcy5fcmVuZGVyZXIudHlwZSA9ICd0ZXh0dXJlJztcclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdPZmZzZXQgPSBfLmJpbmQoVGV4dHVyZS5GbGFnT2Zmc2V0LCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdTY2FsZSA9IF8uYmluZChUZXh0dXJlLkZsYWdTY2FsZSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5pZCA9IFR3by5JZGVudGlmaWVyICsgVHdvLnVuaXF1ZUlkKCk7XHJcbiAgICB0aGlzLmNsYXNzTGlzdCA9IFtdO1xyXG5cclxuICAgIHRoaXMub2Zmc2V0ID0gbmV3IFR3by5WZWN0b3IoKTtcclxuXHJcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKSkge1xyXG4gICAgICB2YXIgbG9hZGVkID0gXy5iaW5kKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMudW5iaW5kKFR3by5FdmVudHMubG9hZCwgbG9hZGVkKTtcclxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgICB0aGlzLmJpbmQoVHdvLkV2ZW50cy5sb2FkLCBsb2FkZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChfLmlzU3RyaW5nKHNyYykpIHtcclxuICAgICAgdGhpcy5zcmMgPSBzcmM7XHJcbiAgICB9IGVsc2UgaWYgKF8uaXNFbGVtZW50KHNyYykpIHtcclxuICAgICAgdGhpcy5pbWFnZSA9IHNyYztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoVGV4dHVyZSwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFtcclxuICAgICAgJ3NyYycsXHJcbiAgICAgICdsb2FkZWQnLFxyXG4gICAgICAncmVwZWF0J1xyXG4gICAgXSxcclxuXHJcbiAgICBJbWFnZVJlZ2lzdHJ5OiBuZXcgVHdvLlJlZ2lzdHJ5KCksXHJcblxyXG4gICAgZ2V0QWJzb2x1dGVVUkw6IGZ1bmN0aW9uKHBhdGgpIHtcclxuICAgICAgaWYgKCFhbmNob3IpIHtcclxuICAgICAgICAvLyBUT0RPOiBGaXggZm9yIGhlYWRsZXNzIGVudmlyb25tZW50XHJcbiAgICAgICAgcmV0dXJuIHBhdGg7XHJcbiAgICAgIH1cclxuICAgICAgYW5jaG9yLmhyZWYgPSBwYXRoO1xyXG4gICAgICByZXR1cm4gYW5jaG9yLmhyZWY7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEltYWdlOiBmdW5jdGlvbihzcmMpIHtcclxuXHJcbiAgICAgIHZhciBhYnNvbHV0ZVNyYyA9IFRleHR1cmUuZ2V0QWJzb2x1dGVVUkwoc3JjKTtcclxuXHJcbiAgICAgIGlmIChUZXh0dXJlLkltYWdlUmVnaXN0cnkuY29udGFpbnMoYWJzb2x1dGVTcmMpKSB7XHJcbiAgICAgICAgcmV0dXJuIFRleHR1cmUuSW1hZ2VSZWdpc3RyeS5nZXQoYWJzb2x1dGVTcmMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgaW1hZ2U7XHJcblxyXG4gICAgICBpZiAocmVnZXgudmlkZW8udGVzdChhYnNvbHV0ZVNyYykpIHtcclxuICAgICAgICBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaW1hZ2UuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcclxuXHJcbiAgICAgIHJldHVybiBpbWFnZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIFJlZ2lzdGVyOiB7XHJcbiAgICAgIGNhbnZhczogZnVuY3Rpb24odGV4dHVyZSwgY2FsbGJhY2spIHtcclxuICAgICAgICB0ZXh0dXJlLl9zcmMgPSAnIycgKyB0ZXh0dXJlLmlkO1xyXG4gICAgICAgIFRleHR1cmUuSW1hZ2VSZWdpc3RyeS5hZGQodGV4dHVyZS5zcmMsIHRleHR1cmUuaW1hZ2UpO1xyXG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgaW1nOiBmdW5jdGlvbih0ZXh0dXJlLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICB2YXIgbG9hZGVkID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgbG9hZGVkLCBmYWxzZSk7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZXJyb3IsIGZhbHNlKTtcclxuICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBsb2FkZWQsIGZhbHNlKTtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlcnJvciwgZmFsc2UpO1xyXG4gICAgICAgICAgdGhyb3cgbmV3IFR3by5VdGlscy5FcnJvcigndW5hYmxlIHRvIGxvYWQgJyArIHRleHR1cmUuc3JjKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoXy5pc051bWJlcih0ZXh0dXJlLmltYWdlLndpZHRoKSAmJiB0ZXh0dXJlLmltYWdlLndpZHRoID4gMFxyXG4gICAgICAgICAgJiYgXy5pc051bWJlcih0ZXh0dXJlLmltYWdlLmhlaWdodCkgJiYgdGV4dHVyZS5pbWFnZS5oZWlnaHQgPiAwKSB7XHJcbiAgICAgICAgICAgIGxvYWRlZCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBsb2FkZWQsIGZhbHNlKTtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlcnJvciwgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dHVyZS5fc3JjID0gVGV4dHVyZS5nZXRBYnNvbHV0ZVVSTCh0ZXh0dXJlLl9zcmMpO1xyXG5cclxuICAgICAgICBpZiAodGV4dHVyZS5pbWFnZSAmJiB0ZXh0dXJlLmltYWdlLmdldEF0dHJpYnV0ZSgndHdvLXNyYycpKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0ZXh0dXJlLmltYWdlLnNldEF0dHJpYnV0ZSgndHdvLXNyYycsIHRleHR1cmUuc3JjKTtcclxuICAgICAgICBUZXh0dXJlLkltYWdlUmVnaXN0cnkuYWRkKHRleHR1cmUuc3JjLCB0ZXh0dXJlLmltYWdlKTtcclxuICAgICAgICB0ZXh0dXJlLmltYWdlLnNyYyA9IHRleHR1cmUuc3JjO1xyXG5cclxuICAgICAgfSxcclxuICAgICAgdmlkZW86IGZ1bmN0aW9uKHRleHR1cmUsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgIHZhciBsb2FkZWQgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBsb2FkZWQsIGZhbHNlKTtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlcnJvciwgZmFsc2UpO1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS53aWR0aCA9IHRleHR1cmUuaW1hZ2UudmlkZW9XaWR0aDtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UuaGVpZ2h0ID0gdGV4dHVyZS5pbWFnZS52aWRlb0hlaWdodDtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucGxheSgpO1xyXG4gICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIGxvYWRlZCwgZmFsc2UpO1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yLCBmYWxzZSk7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgVHdvLlV0aWxzLkVycm9yKCd1bmFibGUgdG8gbG9hZCAnICsgdGV4dHVyZS5zcmMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRleHR1cmUuX3NyYyA9IFRleHR1cmUuZ2V0QWJzb2x1dGVVUkwodGV4dHVyZS5fc3JjKTtcclxuICAgICAgICB0ZXh0dXJlLmltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2NhbnBsYXl0aHJvdWdoJywgbG9hZGVkLCBmYWxzZSk7XHJcbiAgICAgICAgdGV4dHVyZS5pbWFnZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIGlmICh0ZXh0dXJlLmltYWdlICYmIHRleHR1cmUuaW1hZ2UuZ2V0QXR0cmlidXRlKCd0d28tc3JjJykpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRleHR1cmUuaW1hZ2Uuc2V0QXR0cmlidXRlKCd0d28tc3JjJywgdGV4dHVyZS5zcmMpO1xyXG4gICAgICAgIFRleHR1cmUuSW1hZ2VSZWdpc3RyeS5hZGQodGV4dHVyZS5zcmMsIHRleHR1cmUuaW1hZ2UpO1xyXG4gICAgICAgIHRleHR1cmUuaW1hZ2Uuc3JjID0gdGV4dHVyZS5zcmM7XHJcbiAgICAgICAgdGV4dHVyZS5pbWFnZS5sb29wID0gdHJ1ZTtcclxuICAgICAgICB0ZXh0dXJlLmltYWdlLmxvYWQoKTtcclxuXHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgbG9hZDogZnVuY3Rpb24odGV4dHVyZSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgIHZhciBzcmMgPSB0ZXh0dXJlLnNyYztcclxuICAgICAgdmFyIGltYWdlID0gdGV4dHVyZS5pbWFnZTtcclxuICAgICAgdmFyIHRhZyA9IGltYWdlICYmIGltYWdlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICBpZiAodGV4dHVyZS5fZmxhZ0ltYWdlKSB7XHJcbiAgICAgICAgaWYgKC9jYW52YXMvaS50ZXN0KHRhZykpIHtcclxuICAgICAgICAgIFRleHR1cmUuUmVnaXN0ZXIuY2FudmFzKHRleHR1cmUsIGNhbGxiYWNrKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGV4dHVyZS5fc3JjID0gaW1hZ2UuZ2V0QXR0cmlidXRlKCd0d28tc3JjJykgfHwgaW1hZ2Uuc3JjO1xyXG4gICAgICAgICAgVGV4dHVyZS5SZWdpc3Rlclt0YWddKHRleHR1cmUsIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0ZXh0dXJlLl9mbGFnU3JjKSB7XHJcbiAgICAgICAgaWYgKCFpbWFnZSkge1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZSA9IFRleHR1cmUuZ2V0SW1hZ2UodGV4dHVyZS5zcmMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWcgPSB0ZXh0dXJlLmltYWdlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgVGV4dHVyZS5SZWdpc3Rlclt0YWddKHRleHR1cmUsIGNhbGxiYWNrKTtcclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgRmxhZ09mZnNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdPZmZzZXQgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBGbGFnU2NhbGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnU2NhbGUgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICBfLmVhY2goVGV4dHVyZS5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iamVjdCk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnaW1hZ2UnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2ltYWdlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihpbWFnZSkge1xyXG5cclxuICAgICAgICAgIHZhciB0YWcgPSBpbWFnZSAmJiBpbWFnZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgdmFyIGluZGV4O1xyXG5cclxuICAgICAgICAgIHN3aXRjaCAodGFnKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2NhbnZhcyc6XHJcbiAgICAgICAgICAgICAgaW5kZXggPSAnIycgKyBpbWFnZS5pZDtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICBpbmRleCA9IGltYWdlLnNyYztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoVGV4dHVyZS5JbWFnZVJlZ2lzdHJ5LmNvbnRhaW5zKGluZGV4KSkge1xyXG4gICAgICAgICAgICB0aGlzLl9pbWFnZSA9IFRleHR1cmUuSW1hZ2VSZWdpc3RyeS5nZXQoaW1hZ2Uuc3JjKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ltYWdlID0gaW1hZ2U7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fZmxhZ0ltYWdlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnb2Zmc2V0Jywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9vZmZzZXQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIGlmICh0aGlzLl9vZmZzZXQpIHtcclxuICAgICAgICAgICAgdGhpcy5fb2Zmc2V0LnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ09mZnNldCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB0aGlzLl9vZmZzZXQgPSB2O1xyXG4gICAgICAgICAgdGhpcy5fb2Zmc2V0LmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdPZmZzZXQpO1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ09mZnNldCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdzY2FsZScsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NjYWxlLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1NjYWxlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9zY2FsZSA9IHY7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9zY2FsZS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnU2NhbGUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX2ZsYWdTY2FsZSA9IHRydWU7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoVGV4dHVyZS5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIFR3by5TaGFwZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfZmxhZ1NyYzogZmFsc2UsXHJcbiAgICBfZmxhZ0ltYWdlOiBmYWxzZSxcclxuICAgIF9mbGFnVmlkZW86IGZhbHNlLFxyXG4gICAgX2ZsYWdMb2FkZWQ6IGZhbHNlLFxyXG4gICAgX2ZsYWdSZXBlYXQ6IGZhbHNlLFxyXG5cclxuICAgIF9mbGFnT2Zmc2V0OiBmYWxzZSxcclxuICAgIF9mbGFnU2NhbGU6IGZhbHNlLFxyXG5cclxuICAgIF9zcmM6ICcnLFxyXG4gICAgX2ltYWdlOiBudWxsLFxyXG4gICAgX2xvYWRlZDogZmFsc2UsXHJcbiAgICBfcmVwZWF0OiAnbm8tcmVwZWF0JyxcclxuXHJcbiAgICBfc2NhbGU6IDEsXHJcbiAgICBfb2Zmc2V0OiBudWxsLFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUZXh0dXJlKHRoaXMuc3JjKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHNyYzogdGhpcy5zcmMsXHJcbiAgICAgICAgaW1hZ2U6IHRoaXMuaW1hZ2VcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnU3JjIHx8IHRoaXMuX2ZsYWdJbWFnZSB8fCB0aGlzLl9mbGFnVmlkZW8pIHtcclxuXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTcmMgfHwgdGhpcy5fZmxhZ0ltYWdlKSB7XHJcbiAgICAgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgVGV4dHVyZS5sb2FkKHRoaXMsIF8uYmluZChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzXHJcbiAgICAgICAgICAgICAgLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpXHJcbiAgICAgICAgICAgICAgLnRyaWdnZXIoVHdvLkV2ZW50cy5sb2FkKTtcclxuICAgICAgICAgIH0sIHRoaXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5faW1hZ2UgJiYgdGhpcy5faW1hZ2UucmVhZHlTdGF0ZSA+PSA0KSB7XHJcbiAgICAgICAgdGhpcy5fZmxhZ1ZpZGVvID0gdHJ1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1NyYyA9IHRoaXMuX2ZsYWdJbWFnZSA9IHRoaXMuX2ZsYWdMb2FkZWRcclxuICAgICAgICA9IHRoaXMuX2ZsYWdWaWRlbyA9IHRoaXMuX2ZsYWdTY2FsZSA9IHRoaXMuX2ZsYWdPZmZzZXQgPSBmYWxzZTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFRleHR1cmUuTWFrZU9ic2VydmFibGUoVGV4dHVyZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aDtcclxuICB2YXIgUmVjdGFuZ2xlID0gVHdvLlJlY3RhbmdsZTtcclxuXHJcbiAgdmFyIFNwcml0ZSA9IFR3by5TcHJpdGUgPSBmdW5jdGlvbihwYXRoLCBveCwgb3ksIGNvbHMsIHJvd3MsIGZyYW1lUmF0ZSkge1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBbXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKClcclxuICAgIF0sIHRydWUpO1xyXG5cclxuICAgIHRoaXMubm9TdHJva2UoKTtcclxuICAgIHRoaXMubm9GaWxsKCk7XHJcblxyXG4gICAgaWYgKHBhdGggaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICB0aGlzLnRleHR1cmUgPSBwYXRoO1xyXG4gICAgfSBlbHNlIGlmIChfLmlzU3RyaW5nKHBhdGgpKSB7XHJcbiAgICAgIHRoaXMudGV4dHVyZSA9IG5ldyBUd28uVGV4dHVyZShwYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KG94IHx8IDAsIG95IHx8IDApO1xyXG5cclxuICAgIGlmIChfLmlzTnVtYmVyKGNvbHMpKSB7XHJcbiAgICAgIHRoaXMuY29sdW1ucyA9IGNvbHM7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcihyb3dzKSkge1xyXG4gICAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIoZnJhbWVSYXRlKSkge1xyXG4gICAgICB0aGlzLmZyYW1lUmF0ZSA9IGZyYW1lUmF0ZTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoU3ByaXRlLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogW1xyXG4gICAgICAndGV4dHVyZScsICdjb2x1bW5zJywgJ3Jvd3MnLCAnZnJhbWVSYXRlJywgJ2luZGV4J1xyXG4gICAgXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICBSZWN0YW5nbGUuTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKFNwcml0ZS5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KVxyXG5cclxuICBfLmV4dGVuZChTcHJpdGUucHJvdG90eXBlLCBSZWN0YW5nbGUucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX2ZsYWdUZXh0dXJlOiBmYWxzZSxcclxuICAgIF9mbGFnQ29sdW1uczogZmFsc2UsXHJcbiAgICBfZmxhZ1Jvd3M6IGZhbHNlLFxyXG4gICAgX2ZsYWdGcmFtZVJhdGU6IGZhbHNlLFxyXG4gICAgZmxhZ0luZGV4OiBmYWxzZSxcclxuXHJcbiAgICAvLyBQcml2YXRlIHZhcmlhYmxlc1xyXG4gICAgX2Ftb3VudDogMSxcclxuICAgIF9kdXJhdGlvbjogMCxcclxuICAgIF9zdGFydFRpbWU6IDAsXHJcbiAgICBfcGxheWluZzogZmFsc2UsXHJcbiAgICBfZmlyc3RGcmFtZTogMCxcclxuICAgIF9sYXN0RnJhbWU6IDAsXHJcbiAgICBfbG9vcDogdHJ1ZSxcclxuXHJcbiAgICAvLyBFeHBvc2VkIHRocm91Z2ggZ2V0dGVyLXNldHRlclxyXG4gICAgX3RleHR1cmU6IG51bGwsXHJcbiAgICBfY29sdW1uczogMSxcclxuICAgIF9yb3dzOiAxLFxyXG4gICAgX2ZyYW1lUmF0ZTogMCxcclxuICAgIF9pbmRleDogMCxcclxuXHJcbiAgICBwbGF5OiBmdW5jdGlvbihmaXJzdEZyYW1lLCBsYXN0RnJhbWUsIG9uTGFzdEZyYW1lKSB7XHJcblxyXG4gICAgICB0aGlzLl9wbGF5aW5nID0gdHJ1ZTtcclxuICAgICAgdGhpcy5fZmlyc3RGcmFtZSA9IDA7XHJcbiAgICAgIHRoaXMuX2xhc3RGcmFtZSA9IHRoaXMuYW1vdW50IC0gMTtcclxuICAgICAgdGhpcy5fc3RhcnRUaW1lID0gXy5wZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICAgIGlmIChfLmlzTnVtYmVyKGZpcnN0RnJhbWUpKSB7XHJcbiAgICAgICAgdGhpcy5fZmlyc3RGcmFtZSA9IGZpcnN0RnJhbWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF8uaXNOdW1iZXIobGFzdEZyYW1lKSkge1xyXG4gICAgICAgIHRoaXMuX2xhc3RGcmFtZSA9IGxhc3RGcmFtZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9uTGFzdEZyYW1lKSkge1xyXG4gICAgICAgIHRoaXMuX29uTGFzdEZyYW1lID0gb25MYXN0RnJhbWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX29uTGFzdEZyYW1lO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5faW5kZXggIT09IHRoaXMuX2ZpcnN0RnJhbWUpIHtcclxuICAgICAgICB0aGlzLl9zdGFydFRpbWUgLT0gMTAwMCAqIE1hdGguYWJzKHRoaXMuX2luZGV4IC0gdGhpcy5fZmlyc3RGcmFtZSlcclxuICAgICAgICAgIC8gdGhpcy5fZnJhbWVSYXRlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX3BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX3BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgdGhpcy5faW5kZXggPSAwO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24ocGFyZW50KSB7XHJcblxyXG4gICAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgU3ByaXRlKFxyXG4gICAgICAgIHRoaXMudGV4dHVyZSwgdGhpcy50cmFuc2xhdGlvbi54LCB0aGlzLnRyYW5zbGF0aW9uLnksXHJcbiAgICAgICAgdGhpcy5jb2x1bW5zLCB0aGlzLnJvd3MsIHRoaXMuZnJhbWVSYXRlXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBpZiAodGhpcy5wbGF5aW5nKSB7XHJcbiAgICAgICAgY2xvbmUucGxheSh0aGlzLl9maXJzdEZyYW1lLCB0aGlzLl9sYXN0RnJhbWUpO1xyXG4gICAgICAgIGNsb25lLl9sb29wID0gdGhpcy5fbG9vcDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgIHBhcmVudC5hZGQoY2xvbmUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBlZmZlY3QgPSB0aGlzLl90ZXh0dXJlO1xyXG4gICAgICB2YXIgY29scyA9IHRoaXMuX2NvbHVtbnM7XHJcbiAgICAgIHZhciByb3dzID0gdGhpcy5fcm93cztcclxuXHJcbiAgICAgIHZhciB3aWR0aCwgaGVpZ2h0LCBlbGFwc2VkLCBhbW91bnQsIGR1cmF0aW9uO1xyXG4gICAgICB2YXIgaW5kZXgsIGl3LCBpaCwgaXNSYW5nZSwgZnJhbWVzO1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdDb2x1bW5zIHx8IHRoaXMuX2ZsYWdSb3dzKSB7XHJcbiAgICAgICAgdGhpcy5fYW1vdW50ID0gdGhpcy5fY29sdW1ucyAqIHRoaXMuX3Jvd3M7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnRnJhbWVSYXRlKSB7XHJcbiAgICAgICAgdGhpcy5fZHVyYXRpb24gPSAxMDAwICogdGhpcy5fYW1vdW50IC8gdGhpcy5fZnJhbWVSYXRlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1RleHR1cmUpIHtcclxuICAgICAgICB0aGlzLmZpbGwgPSB0aGlzLl90ZXh0dXJlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5fdGV4dHVyZS5sb2FkZWQpIHtcclxuXHJcbiAgICAgICAgaXcgPSBlZmZlY3QuaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgaWggPSBlZmZlY3QuaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICB3aWR0aCA9IGl3IC8gY29scztcclxuICAgICAgICBoZWlnaHQgPSBpaCAvIHJvd3M7XHJcbiAgICAgICAgYW1vdW50ID0gdGhpcy5fYW1vdW50O1xyXG5cclxuICAgICAgICBpZiAodGhpcy53aWR0aCAhPT0gd2lkdGgpIHtcclxuICAgICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuaGVpZ2h0ICE9PSBoZWlnaHQpIHtcclxuICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3BsYXlpbmcgJiYgdGhpcy5fZnJhbWVSYXRlID4gMCkge1xyXG5cclxuICAgICAgICAgIGlmIChfLmlzTmFOKHRoaXMuX2xhc3RGcmFtZSkpIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdEZyYW1lID0gYW1vdW50IC0gMTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBUT0RPOiBPZmZsb2FkIHBlcmYgbG9naWMgdG8gaW5zdGFuY2Ugb2YgYFR3b2AuXHJcbiAgICAgICAgICBlbGFwc2VkID0gXy5wZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZTtcclxuICAgICAgICAgIGZyYW1lcyA9IHRoaXMuX2xhc3RGcmFtZSArIDE7XHJcbiAgICAgICAgICBkdXJhdGlvbiA9IDEwMDAgKiAoZnJhbWVzIC0gdGhpcy5fZmlyc3RGcmFtZSkgLyB0aGlzLl9mcmFtZVJhdGU7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2xvb3ApIHtcclxuICAgICAgICAgICAgZWxhcHNlZCA9IGVsYXBzZWQgJSBkdXJhdGlvbjtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVsYXBzZWQgPSBNYXRoLm1pbihlbGFwc2VkLCBkdXJhdGlvbik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaW5kZXggPSBfLmxlcnAodGhpcy5fZmlyc3RGcmFtZSwgZnJhbWVzLCBlbGFwc2VkIC8gZHVyYXRpb24pO1xyXG4gICAgICAgICAgaW5kZXggPSBNYXRoLmZsb29yKGluZGV4KTtcclxuXHJcbiAgICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMuX2luZGV4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSB0aGlzLl9sYXN0RnJhbWUgLSAxICYmIHRoaXMuX29uTGFzdEZyYW1lKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fb25MYXN0RnJhbWUoKTsgIC8vIFNob3J0Y3V0IGZvciBjaGFpbmFibGUgc3ByaXRlIGFuaW1hdGlvbnNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjb2wgPSB0aGlzLl9pbmRleCAlIGNvbHM7XHJcbiAgICAgICAgdmFyIHJvdyA9IE1hdGguZmxvb3IodGhpcy5faW5kZXggLyBjb2xzKTtcclxuXHJcbiAgICAgICAgdmFyIG94ID0gLSB3aWR0aCAqIGNvbCArIChpdyAtIHdpZHRoKSAvIDI7XHJcbiAgICAgICAgdmFyIG95ID0gLSBoZWlnaHQgKiByb3cgKyAoaWggLSBoZWlnaHQpIC8gMjtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogSW1wcm92ZSBwZXJmb3JtYW5jZVxyXG4gICAgICAgIGlmIChveCAhPT0gZWZmZWN0Lm9mZnNldC54KSB7XHJcbiAgICAgICAgICBlZmZlY3Qub2Zmc2V0LnggPSBveDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG95ICE9PSBlZmZlY3Qub2Zmc2V0LnkpIHtcclxuICAgICAgICAgIGVmZmVjdC5vZmZzZXQueSA9IG95O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1RleHR1cmUgPSB0aGlzLl9mbGFnQ29sdW1ucyA9IHRoaXMuX2ZsYWdSb3dzXHJcbiAgICAgICAgPSB0aGlzLl9mbGFnRnJhbWVSYXRlID0gZmFsc2U7XHJcblxyXG4gICAgICBSZWN0YW5nbGUucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG5cclxuICB9KTtcclxuXHJcbiAgU3ByaXRlLk1ha2VPYnNlcnZhYmxlKFNwcml0ZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aDtcclxuICB2YXIgUmVjdGFuZ2xlID0gVHdvLlJlY3RhbmdsZTtcclxuXHJcbiAgdmFyIEltYWdlU2VxdWVuY2UgPSBUd28uSW1hZ2VTZXF1ZW5jZSA9IGZ1bmN0aW9uKHBhdGhzLCBveCwgb3ksIGZyYW1lUmF0ZSkge1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBbXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKClcclxuICAgIF0sIHRydWUpO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdUZXh0dXJlcyA9IF8uYmluZChJbWFnZVNlcXVlbmNlLkZsYWdUZXh0dXJlcywgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5iaW5kVGV4dHVyZXMgPSBfLmJpbmQoSW1hZ2VTZXF1ZW5jZS5CaW5kVGV4dHVyZXMsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIudW5iaW5kVGV4dHVyZXMgPSBfLmJpbmQoSW1hZ2VTZXF1ZW5jZS5VbmJpbmRUZXh0dXJlcywgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5ub1N0cm9rZSgpO1xyXG4gICAgdGhpcy5ub0ZpbGwoKTtcclxuXHJcbiAgICB0aGlzLnRleHR1cmVzID0gXy5tYXAocGF0aHMsIEltYWdlU2VxdWVuY2UuR2VuZXJhdGVUZXh0dXJlLCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KG94IHx8IDAsIG95IHx8IDApO1xyXG5cclxuICAgIGlmIChfLmlzTnVtYmVyKGZyYW1lUmF0ZSkpIHtcclxuICAgICAgdGhpcy5mcmFtZVJhdGUgPSBmcmFtZVJhdGU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmZyYW1lUmF0ZSA9IEltYWdlU2VxdWVuY2UuRGVmYXVsdEZyYW1lUmF0ZTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoSW1hZ2VTZXF1ZW5jZSwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFtcclxuICAgICAgJ2ZyYW1lUmF0ZScsXHJcbiAgICAgICdpbmRleCdcclxuICAgIF0sXHJcblxyXG4gICAgRGVmYXVsdEZyYW1lUmF0ZTogMzAsXHJcblxyXG4gICAgRmxhZ1RleHR1cmVzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ1RleHR1cmVzID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgQmluZFRleHR1cmVzOiBmdW5jdGlvbihpdGVtcykge1xyXG5cclxuICAgICAgdmFyIGkgPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICBpdGVtc1tpXS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnVGV4dHVyZXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9yZW5kZXJlci5mbGFnVGV4dHVyZXMoKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIFVuYmluZFRleHR1cmVzOiBmdW5jdGlvbihpdGVtcykge1xyXG5cclxuICAgICAgdmFyIGkgPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICBpdGVtc1tpXS51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdUZXh0dXJlcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdUZXh0dXJlcygpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgUmVjdGFuZ2xlLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChJbWFnZVNlcXVlbmNlLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosICd0ZXh0dXJlcycsIHtcclxuXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl90ZXh0dXJlcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHRleHR1cmVzKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHVwZGF0ZVRleHR1cmVzID0gdGhpcy5fcmVuZGVyZXIuZmxhZ1RleHR1cmVzO1xyXG4gICAgICAgICAgdmFyIGJpbmRUZXh0dXJlcyA9IHRoaXMuX3JlbmRlcmVyLmJpbmRUZXh0dXJlcztcclxuICAgICAgICAgIHZhciB1bmJpbmRUZXh0dXJlcyA9IHRoaXMuX3JlbmRlcmVyLnVuYmluZFRleHR1cmVzO1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSBwcmV2aW91cyBsaXN0ZW5lcnNcclxuICAgICAgICAgIGlmICh0aGlzLl90ZXh0dXJlcykge1xyXG4gICAgICAgICAgICB0aGlzLl90ZXh0dXJlc1xyXG4gICAgICAgICAgICAgIC51bmJpbmQoVHdvLkV2ZW50cy5pbnNlcnQsIGJpbmRUZXh0dXJlcylcclxuICAgICAgICAgICAgICAudW5iaW5kKFR3by5FdmVudHMucmVtb3ZlLCB1bmJpbmRUZXh0dXJlcyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ3JlYXRlIG5ldyBDb2xsZWN0aW9uIHdpdGggY29weSBvZiB2ZXJ0aWNlc1xyXG4gICAgICAgICAgdGhpcy5fdGV4dHVyZXMgPSBuZXcgVHdvLlV0aWxzLkNvbGxlY3Rpb24oKHRleHR1cmVzIHx8IFtdKS5zbGljZSgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gTGlzdGVuIGZvciBDb2xsZWN0aW9uIGNoYW5nZXMgYW5kIGJpbmQgLyB1bmJpbmRcclxuICAgICAgICAgIHRoaXMuX3RleHR1cmVzXHJcbiAgICAgICAgICAgIC5iaW5kKFR3by5FdmVudHMuaW5zZXJ0LCBiaW5kVGV4dHVyZXMpXHJcbiAgICAgICAgICAgIC5iaW5kKFR3by5FdmVudHMucmVtb3ZlLCB1bmJpbmRUZXh0dXJlcyk7XHJcblxyXG4gICAgICAgICAgLy8gQmluZCBJbml0aWFsIFRleHR1cmVzXHJcbiAgICAgICAgICBiaW5kVGV4dHVyZXModGhpcy5fdGV4dHVyZXMpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIEdlbmVyYXRlVGV4dHVyZTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICAgIH0gZWxzZSBpZiAoXy5pc1N0cmluZyhvYmopKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUd28uVGV4dHVyZShvYmopO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChJbWFnZVNlcXVlbmNlLnByb3RvdHlwZSwgUmVjdGFuZ2xlLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF9mbGFnVGV4dHVyZXM6IGZhbHNlLFxyXG4gICAgX2ZsYWdGcmFtZVJhdGU6IGZhbHNlLFxyXG4gICAgX2ZsYWdJbmRleDogZmFsc2UsXHJcblxyXG4gICAgLy8gUHJpdmF0ZSB2YXJpYWJsZXNcclxuICAgIF9hbW91bnQ6IDEsXHJcbiAgICBfZHVyYXRpb246IDAsXHJcbiAgICBfaW5kZXg6IDAsXHJcbiAgICBfc3RhcnRUaW1lOiAwLFxyXG4gICAgX3BsYXlpbmc6IGZhbHNlLFxyXG4gICAgX2ZpcnN0RnJhbWU6IDAsXHJcbiAgICBfbGFzdEZyYW1lOiAwLFxyXG4gICAgX2xvb3A6IHRydWUsXHJcblxyXG4gICAgLy8gRXhwb3NlZCB0aHJvdWdoIGdldHRlci1zZXR0ZXJcclxuICAgIF90ZXh0dXJlczogbnVsbCxcclxuICAgIF9mcmFtZVJhdGU6IDAsXHJcblxyXG4gICAgcGxheTogZnVuY3Rpb24oZmlyc3RGcmFtZSwgbGFzdEZyYW1lLCBvbkxhc3RGcmFtZSkge1xyXG5cclxuICAgICAgdGhpcy5fcGxheWluZyA9IHRydWU7XHJcbiAgICAgIHRoaXMuX2ZpcnN0RnJhbWUgPSAwO1xyXG4gICAgICB0aGlzLl9sYXN0RnJhbWUgPSB0aGlzLmFtb3VudCAtIDE7XHJcbiAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IF8ucGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4gICAgICBpZiAoXy5pc051bWJlcihmaXJzdEZyYW1lKSkge1xyXG4gICAgICAgIHRoaXMuX2ZpcnN0RnJhbWUgPSBmaXJzdEZyYW1lO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChfLmlzTnVtYmVyKGxhc3RGcmFtZSkpIHtcclxuICAgICAgICB0aGlzLl9sYXN0RnJhbWUgPSBsYXN0RnJhbWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvbkxhc3RGcmFtZSkpIHtcclxuICAgICAgICB0aGlzLl9vbkxhc3RGcmFtZSA9IG9uTGFzdEZyYW1lO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLl9vbkxhc3RGcmFtZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2luZGV4ICE9PSB0aGlzLl9maXJzdEZyYW1lKSB7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lIC09IDEwMDAgKiBNYXRoLmFicyh0aGlzLl9pbmRleCAtIHRoaXMuX2ZpcnN0RnJhbWUpXHJcbiAgICAgICAgICAvIHRoaXMuX2ZyYW1lUmF0ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBwYXVzZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9wbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9wbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuX2luZGV4ID0gMDtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG5cclxuICAgICAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IEltYWdlU2VxdWVuY2UodGhpcy50ZXh0dXJlcywgdGhpcy50cmFuc2xhdGlvbi54LFxyXG4gICAgICAgIHRoaXMudHJhbnNsYXRpb24ueSwgdGhpcy5mcmFtZVJhdGUpXHJcblxyXG4gICAgICAgIGNsb25lLl9sb29wID0gdGhpcy5fbG9vcDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3BsYXlpbmcpIHtcclxuICAgICAgICAgIGNsb25lLnBsYXkoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICAgIHBhcmVudC5hZGQoY2xvbmUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgZWZmZWN0cyA9IHRoaXMuX3RleHR1cmVzO1xyXG4gICAgICB2YXIgd2lkdGgsIGhlaWdodCwgZWxhcHNlZCwgYW1vdW50LCBkdXJhdGlvbiwgdGV4dHVyZTtcclxuICAgICAgdmFyIGluZGV4LCBmcmFtZXM7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1RleHR1cmVzKSB7XHJcbiAgICAgICAgdGhpcy5fYW1vdW50ID0gZWZmZWN0cy5sZW5ndGg7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnRnJhbWVSYXRlKSB7XHJcbiAgICAgICAgdGhpcy5fZHVyYXRpb24gPSAxMDAwICogdGhpcy5fYW1vdW50IC8gdGhpcy5fZnJhbWVSYXRlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5fcGxheWluZyAmJiB0aGlzLl9mcmFtZVJhdGUgPiAwKSB7XHJcblxyXG4gICAgICAgIGFtb3VudCA9IHRoaXMuX2Ftb3VudDtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNOYU4odGhpcy5fbGFzdEZyYW1lKSkge1xyXG4gICAgICAgICAgdGhpcy5fbGFzdEZyYW1lID0gYW1vdW50IC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE86IE9mZmxvYWQgcGVyZiBsb2dpYyB0byBpbnN0YW5jZSBvZiBgVHdvYC5cclxuICAgICAgICBlbGFwc2VkID0gXy5wZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZTtcclxuICAgICAgICBmcmFtZXMgPSB0aGlzLl9sYXN0RnJhbWUgKyAxO1xyXG4gICAgICAgIGR1cmF0aW9uID0gMTAwMCAqIChmcmFtZXMgLSB0aGlzLl9maXJzdEZyYW1lKSAvIHRoaXMuX2ZyYW1lUmF0ZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2xvb3ApIHtcclxuICAgICAgICAgIGVsYXBzZWQgPSBlbGFwc2VkICUgZHVyYXRpb247XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGVsYXBzZWQgPSBNYXRoLm1pbihlbGFwc2VkLCBkdXJhdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbmRleCA9IF8ubGVycCh0aGlzLl9maXJzdEZyYW1lLCBmcmFtZXMsIGVsYXBzZWQgLyBkdXJhdGlvbik7XHJcbiAgICAgICAgaW5kZXggPSBNYXRoLmZsb29yKGluZGV4KTtcclxuXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB0aGlzLl9pbmRleCkge1xyXG5cclxuICAgICAgICAgIHRoaXMuX2luZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICB0ZXh0dXJlID0gZWZmZWN0c1t0aGlzLl9pbmRleF07XHJcblxyXG4gICAgICAgICAgaWYgKHRleHR1cmUubG9hZGVkKSB7XHJcblxyXG4gICAgICAgICAgICB3aWR0aCA9IHRleHR1cmUuaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgIGhlaWdodCA9IHRleHR1cmUuaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMud2lkdGggIT09IHdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmhlaWdodCAhPT0gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZmlsbCA9IHRleHR1cmU7XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gdGhpcy5fbGFzdEZyYW1lIC0gMSAmJiB0aGlzLl9vbkxhc3RGcmFtZSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX29uTGFzdEZyYW1lKCk7ICAvLyBTaG9ydGN1dCBmb3IgY2hhaW5hYmxlIHNwcml0ZSBhbmltYXRpb25zXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmxhZ0luZGV4IHx8ICEodGhpcy5maWxsIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpKSB7XHJcblxyXG4gICAgICAgIHRleHR1cmUgPSBlZmZlY3RzW3RoaXMuX2luZGV4XTtcclxuXHJcbiAgICAgICAgaWYgKHRleHR1cmUubG9hZGVkKSB7XHJcblxyXG4gICAgICAgICAgd2lkdGggPSB0ZXh0dXJlLmltYWdlLndpZHRoO1xyXG4gICAgICAgICAgaGVpZ2h0ID0gdGV4dHVyZS5pbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMud2lkdGggIT09IHdpZHRoKSB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICh0aGlzLmhlaWdodCAhPT0gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbCA9IHRleHR1cmU7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBSZWN0YW5nbGUucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdUZXh0dXJlcyA9IHRoaXMuX2ZsYWdGcmFtZVJhdGUgPSBmYWxzZTtcclxuICAgICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIEltYWdlU2VxdWVuY2UuTWFrZU9ic2VydmFibGUoSW1hZ2VTZXF1ZW5jZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RhbnRzXHJcbiAgICovXHJcbiAgdmFyIG1pbiA9IE1hdGgubWluLCBtYXggPSBNYXRoLm1heDtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgLyoqXHJcbiAgICogQSBjaGlsZHJlbiBjb2xsZWN0aW9uIHdoaWNoIGlzIGFjY2VzaWJsZSBib3RoIGJ5IGluZGV4IGFuZCBieSBvYmplY3QgaWRcclxuICAgKiBAY29uc3RydWN0b3JcclxuICAgKi9cclxuICB2YXIgQ2hpbGRyZW4gPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBUd28uVXRpbHMuQ29sbGVjdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnX2V2ZW50cycsIHtcclxuICAgICAgdmFsdWUgOiB7fSxcclxuICAgICAgZW51bWVyYWJsZTogZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuaWRzID0ge307XHJcblxyXG4gICAgdGhpcy5vbihUd28uRXZlbnRzLmluc2VydCwgdGhpcy5hdHRhY2gpO1xyXG4gICAgdGhpcy5vbihUd28uRXZlbnRzLnJlbW92ZSwgdGhpcy5kZXRhY2gpO1xyXG4gICAgQ2hpbGRyZW4ucHJvdG90eXBlLmF0dGFjaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cclxuICB9O1xyXG5cclxuICBDaGlsZHJlbi5wcm90b3R5cGUgPSBuZXcgVHdvLlV0aWxzLkNvbGxlY3Rpb24oKTtcclxuICBDaGlsZHJlbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDaGlsZHJlbjtcclxuXHJcbiAgXy5leHRlbmQoQ2hpbGRyZW4ucHJvdG90eXBlLCB7XHJcblxyXG4gICAgYXR0YWNoOiBmdW5jdGlvbihjaGlsZHJlbikge1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5pZHNbY2hpbGRyZW5baV0uaWRdID0gY2hpbGRyZW5baV07XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGRldGFjaDogZnVuY3Rpb24oY2hpbGRyZW4pIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLmlkc1tjaGlsZHJlbltpXS5pZF07XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICB2YXIgR3JvdXAgPSBUd28uR3JvdXAgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICBUd28uU2hhcGUuY2FsbCh0aGlzLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlci50eXBlID0gJ2dyb3VwJztcclxuXHJcbiAgICB0aGlzLmFkZGl0aW9ucyA9IFtdO1xyXG4gICAgdGhpcy5zdWJ0cmFjdGlvbnMgPSBbXTtcclxuXHJcbiAgICB0aGlzLmNoaWxkcmVuID0gYXJndW1lbnRzO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChHcm91cCwge1xyXG5cclxuICAgIENoaWxkcmVuOiBDaGlsZHJlbixcclxuXHJcbiAgICBJbnNlcnRDaGlsZHJlbjogZnVuY3Rpb24oY2hpbGRyZW4pIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHJlcGxhY2VQYXJlbnQuY2FsbCh0aGlzLCBjaGlsZHJlbltpXSwgdGhpcyk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgUmVtb3ZlQ2hpbGRyZW46IGZ1bmN0aW9uKGNoaWxkcmVuKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICByZXBsYWNlUGFyZW50LmNhbGwodGhpcywgY2hpbGRyZW5baV0pO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIE9yZGVyQ2hpbGRyZW46IGZ1bmN0aW9uKGNoaWxkcmVuKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdPcmRlciA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgIHZhciBwcm9wZXJ0aWVzID0gVHdvLlBhdGguUHJvcGVydGllcy5zbGljZSgwKTtcclxuICAgICAgdmFyIG9pID0gXy5pbmRleE9mKHByb3BlcnRpZXMsICdvcGFjaXR5Jyk7XHJcblxyXG4gICAgICBpZiAob2kgPj0gMCkge1xyXG5cclxuICAgICAgICBwcm9wZXJ0aWVzLnNwbGljZShvaSwgMSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdvcGFjaXR5Jywge1xyXG5cclxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29wYWNpdHk7XHJcbiAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgICAvLyBPbmx5IHNldCBmbGFnIGlmIHRoZXJlIGlzIGFuIGFjdHVhbCBkaWZmZXJlbmNlXHJcbiAgICAgICAgICAgIHRoaXMuX2ZsYWdPcGFjaXR5ID0gKHRoaXMuX29wYWNpdHkgIT0gdik7XHJcbiAgICAgICAgICAgIHRoaXMuX29wYWNpdHkgPSB2O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFR3by5TaGFwZS5NYWtlT2JzZXJ2YWJsZShvYmplY3QpO1xyXG4gICAgICBHcm91cC5NYWtlR2V0dGVyU2V0dGVycyhvYmplY3QsIHByb3BlcnRpZXMpO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2NoaWxkcmVuJywge1xyXG5cclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oY2hpbGRyZW4pIHtcclxuXHJcbiAgICAgICAgICB2YXIgaW5zZXJ0Q2hpbGRyZW4gPSBfLmJpbmQoR3JvdXAuSW5zZXJ0Q2hpbGRyZW4sIHRoaXMpO1xyXG4gICAgICAgICAgdmFyIHJlbW92ZUNoaWxkcmVuID0gXy5iaW5kKEdyb3VwLlJlbW92ZUNoaWxkcmVuLCB0aGlzKTtcclxuICAgICAgICAgIHZhciBvcmRlckNoaWxkcmVuID0gXy5iaW5kKEdyb3VwLk9yZGVyQ2hpbGRyZW4sIHRoaXMpO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9jaGlsZHJlbikge1xyXG4gICAgICAgICAgICB0aGlzLl9jaGlsZHJlbi51bmJpbmQoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9jaGlsZHJlbiA9IG5ldyBDaGlsZHJlbihjaGlsZHJlbik7XHJcbiAgICAgICAgICB0aGlzLl9jaGlsZHJlbi5iaW5kKFR3by5FdmVudHMuaW5zZXJ0LCBpbnNlcnRDaGlsZHJlbik7XHJcbiAgICAgICAgICB0aGlzLl9jaGlsZHJlbi5iaW5kKFR3by5FdmVudHMucmVtb3ZlLCByZW1vdmVDaGlsZHJlbik7XHJcbiAgICAgICAgICB0aGlzLl9jaGlsZHJlbi5iaW5kKFR3by5FdmVudHMub3JkZXIsIG9yZGVyQ2hpbGRyZW4pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdtYXNrJywge1xyXG5cclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX21hc2s7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzLl9tYXNrID0gdjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdNYXNrID0gdHJ1ZTtcclxuICAgICAgICAgIGlmICghdi5jbGlwKSB7XHJcbiAgICAgICAgICAgIHYuY2xpcCA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBNYWtlR2V0dGVyU2V0dGVyczogZnVuY3Rpb24oZ3JvdXAsIHByb3BlcnRpZXMpIHtcclxuXHJcbiAgICAgIGlmICghXy5pc0FycmF5KHByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgcHJvcGVydGllcyA9IFtwcm9wZXJ0aWVzXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgXy5lYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICBHcm91cC5NYWtlR2V0dGVyU2V0dGVyKGdyb3VwLCBrKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBNYWtlR2V0dGVyU2V0dGVyOiBmdW5jdGlvbihncm91cCwgaykge1xyXG5cclxuICAgICAgdmFyIHNlY3JldCA9ICdfJyArIGs7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZ3JvdXAsIGssIHtcclxuXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzW3NlY3JldF07XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzW3NlY3JldF0gPSB2O1xyXG4gICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7IC8vIFRyaWNrbGUgZG93biBzdHlsZXNcclxuICAgICAgICAgICAgY2hpbGRba10gPSB2O1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoR3JvdXAucHJvdG90eXBlLCBUd28uU2hhcGUucHJvdG90eXBlLCB7XHJcblxyXG4gICAgLy8gRmxhZ3NcclxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmxhZ1xyXG5cclxuICAgIF9mbGFnQWRkaXRpb25zOiBmYWxzZSxcclxuICAgIF9mbGFnU3VidHJhY3Rpb25zOiBmYWxzZSxcclxuICAgIF9mbGFnT3JkZXI6IGZhbHNlLFxyXG4gICAgX2ZsYWdPcGFjaXR5OiB0cnVlLFxyXG5cclxuICAgIF9mbGFnTWFzazogZmFsc2UsXHJcblxyXG4gICAgLy8gVW5kZXJseWluZyBQcm9wZXJ0aWVzXHJcblxyXG4gICAgX2ZpbGw6ICcjZmZmJyxcclxuICAgIF9zdHJva2U6ICcjMDAwJyxcclxuICAgIF9saW5ld2lkdGg6IDEuMCxcclxuICAgIF9vcGFjaXR5OiAxLjAsXHJcbiAgICBfdmlzaWJsZTogdHJ1ZSxcclxuXHJcbiAgICBfY2FwOiAncm91bmQnLFxyXG4gICAgX2pvaW46ICdyb3VuZCcsXHJcbiAgICBfbWl0ZXI6IDQsXHJcblxyXG4gICAgX2Nsb3NlZDogdHJ1ZSxcclxuICAgIF9jdXJ2ZWQ6IGZhbHNlLFxyXG4gICAgX2F1dG9tYXRpYzogdHJ1ZSxcclxuICAgIF9iZWdpbm5pbmc6IDAsXHJcbiAgICBfZW5kaW5nOiAxLjAsXHJcblxyXG4gICAgX21hc2s6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUT0RPOiBHcm91cCBoYXMgYSBnb3RjaGEgaW4gdGhhdCBpdCdzIGF0IHRoZSBtb21lbnQgcmVxdWlyZWQgdG8gYmUgYm91bmQgdG9cclxuICAgICAqIGFuIGluc3RhbmNlIG9mIHR3byBpbiBvcmRlciB0byBhZGQgZWxlbWVudHMgY29ycmVjdGx5LiBUaGlzIG5lZWRzIHRvXHJcbiAgICAgKiBiZSByZXRob3VnaHQgYW5kIGZpeGVkLlxyXG4gICAgICovXHJcbiAgICBjbG9uZTogZnVuY3Rpb24ocGFyZW50KSB7XHJcblxyXG4gICAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICB2YXIgZ3JvdXAgPSBuZXcgR3JvdXAoKTtcclxuICAgICAgdmFyIGNoaWxkcmVuID0gXy5tYXAodGhpcy5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICByZXR1cm4gY2hpbGQuY2xvbmUoZ3JvdXApO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGdyb3VwLmFkZChjaGlsZHJlbik7XHJcblxyXG4gICAgICBncm91cC5vcGFjaXR5ID0gdGhpcy5vcGFjaXR5O1xyXG5cclxuICAgICAgaWYgKHRoaXMubWFzaykge1xyXG4gICAgICAgIGdyb3VwLm1hc2sgPSB0aGlzLm1hc2s7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGdyb3VwLnRyYW5zbGF0aW9uLmNvcHkodGhpcy50cmFuc2xhdGlvbik7XHJcbiAgICAgIGdyb3VwLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbjtcclxuICAgICAgZ3JvdXAuc2NhbGUgPSB0aGlzLnNjYWxlO1xyXG5cclxuICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgIHBhcmVudC5hZGQoZ3JvdXApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZ3JvdXA7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4cG9ydCB0aGUgZGF0YSBmcm9tIHRoZSBpbnN0YW5jZSBvZiBUd28uR3JvdXAgaW50byBhIHBsYWluIEphdmFTY3JpcHRcclxuICAgICAqIG9iamVjdC4gVGhpcyBhbHNvIG1ha2VzIGFsbCBjaGlsZHJlbiBwbGFpbiBKYXZhU2NyaXB0IG9iamVjdHMuIEdyZWF0XHJcbiAgICAgKiBmb3IgdHVybmluZyBpbnRvIEpTT04gYW5kIHN0b3JpbmcgaW4gYSBkYXRhYmFzZS5cclxuICAgICAqL1xyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgdHJhbnNsYXRpb246IHRoaXMudHJhbnNsYXRpb24udG9PYmplY3QoKSxcclxuICAgICAgICByb3RhdGlvbjogdGhpcy5yb3RhdGlvbixcclxuICAgICAgICBzY2FsZTogdGhpcy5zY2FsZSxcclxuICAgICAgICBvcGFjaXR5OiB0aGlzLm9wYWNpdHksXHJcbiAgICAgICAgbWFzazogKHRoaXMubWFzayA/IHRoaXMubWFzay50b09iamVjdCgpIDogbnVsbClcclxuICAgICAgfTtcclxuXHJcbiAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCwgaSkge1xyXG4gICAgICAgIHJlc3VsdC5jaGlsZHJlbltpXSA9IGNoaWxkLnRvT2JqZWN0KCk7XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQW5jaG9yIGFsbCBjaGlsZHJlbiB0byB0aGUgdXBwZXIgbGVmdCBoYW5kIGNvcm5lclxyXG4gICAgICogb2YgdGhlIGdyb3VwLlxyXG4gICAgICovXHJcbiAgICBjb3JuZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlY3QgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCh0cnVlKSxcclxuICAgICAgIGNvcm5lciA9IHsgeDogcmVjdC5sZWZ0LCB5OiByZWN0LnRvcCB9O1xyXG5cclxuICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2hpbGQudHJhbnNsYXRpb24uc3ViU2VsZihjb3JuZXIpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbmNob3JzIGFsbCBjaGlsZHJlbiBhcm91bmQgdGhlIGNlbnRlciBvZiB0aGUgZ3JvdXAsXHJcbiAgICAgKiBlZmZlY3RpdmVseSBwbGFjaW5nIHRoZSBzaGFwZSBhcm91bmQgdGhlIHVuaXQgY2lyY2xlLlxyXG4gICAgICovXHJcbiAgICBjZW50ZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlY3QgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCh0cnVlKTtcclxuXHJcbiAgICAgIHJlY3QuY2VudHJvaWQgPSB7XHJcbiAgICAgICAgeDogcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCAvIDIsXHJcbiAgICAgICAgeTogcmVjdC50b3AgKyByZWN0LmhlaWdodCAvIDJcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGlmIChjaGlsZC5pc1NoYXBlKSB7XHJcbiAgICAgICAgICBjaGlsZC50cmFuc2xhdGlvbi5zdWJTZWxmKHJlY3QuY2VudHJvaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyB0aGlzLnRyYW5zbGF0aW9uLmNvcHkocmVjdC5jZW50cm9pZCk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVjdXJzaXZlbHkgc2VhcmNoIGZvciBpZC4gUmV0dXJucyB0aGUgZmlyc3QgZWxlbWVudCBmb3VuZC5cclxuICAgICAqIFJldHVybnMgbnVsbCBpZiBub25lIGZvdW5kLlxyXG4gICAgICovXHJcbiAgICBnZXRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgICAgdmFyIHNlYXJjaCA9IGZ1bmN0aW9uIChub2RlLCBpZCkge1xyXG4gICAgICAgIGlmIChub2RlLmlkID09PSBpZCkge1xyXG4gICAgICAgICAgcmV0dXJuIG5vZGU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICB2YXIgaSA9IG5vZGUuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICB2YXIgZm91bmQgPSBzZWFyY2gobm9kZS5jaGlsZHJlbltpXSwgaWQpO1xyXG4gICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4gc2VhcmNoKHRoaXMsIGlkKSB8fCBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlY3Vyc2l2ZWx5IHNlYXJjaCBmb3IgY2xhc3Nlcy4gUmV0dXJucyBhbiBhcnJheSBvZiBtYXRjaGluZyBlbGVtZW50cy5cclxuICAgICAqIEVtcHR5IGFycmF5IGlmIG5vbmUgZm91bmQuXHJcbiAgICAgKi9cclxuICAgIGdldEJ5Q2xhc3NOYW1lOiBmdW5jdGlvbiAoY2wpIHtcclxuICAgICAgdmFyIGZvdW5kID0gW107XHJcbiAgICAgIHZhciBzZWFyY2ggPSBmdW5jdGlvbiAobm9kZSwgY2wpIHtcclxuICAgICAgICBpZiAobm9kZS5jbGFzc0xpc3QuaW5kZXhPZihjbCkgIT0gLTEpIHtcclxuICAgICAgICAgIGZvdW5kLnB1c2gobm9kZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XHJcbiAgICAgICAgICAgIHNlYXJjaChjaGlsZCwgY2wpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmb3VuZDtcclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIHNlYXJjaCh0aGlzLCBjbCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVjdXJzaXZlbHkgc2VhcmNoIGZvciBjaGlsZHJlbiBvZiBhIHNwZWNpZmljIHR5cGUsXHJcbiAgICAgKiBlLmcuIFR3by5Qb2x5Z29uLiBQYXNzIGEgcmVmZXJlbmNlIHRvIHRoaXMgdHlwZSBhcyB0aGUgcGFyYW0uXHJcbiAgICAgKiBSZXR1cm5zIGFuIGVtcHR5IGFycmF5IGlmIG5vbmUgZm91bmQuXHJcbiAgICAgKi9cclxuICAgIGdldEJ5VHlwZTogZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICB2YXIgZm91bmQgPSBbXTtcclxuICAgICAgdmFyIHNlYXJjaCA9IGZ1bmN0aW9uIChub2RlLCB0eXBlKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gbm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgaWYgKG5vZGUuY2hpbGRyZW5baWRdIGluc3RhbmNlb2YgdHlwZSkge1xyXG4gICAgICAgICAgICBmb3VuZC5wdXNoKG5vZGUuY2hpbGRyZW5baWRdKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5jaGlsZHJlbltpZF0gaW5zdGFuY2VvZiBUd28uR3JvdXApIHtcclxuICAgICAgICAgICAgc2VhcmNoKG5vZGUuY2hpbGRyZW5baWRdLCB0eXBlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZvdW5kO1xyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4gc2VhcmNoKHRoaXMsIHR5cGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBvYmplY3RzIHRvIHRoZSBncm91cC5cclxuICAgICAqL1xyXG4gICAgYWRkOiBmdW5jdGlvbihvYmplY3RzKSB7XHJcblxyXG4gICAgICAvLyBBbGxvdyB0byBwYXNzIG11bHRpcGxlIG9iamVjdHMgZWl0aGVyIGFzIGFycmF5IG9yIGFzIG11bHRpcGxlIGFyZ3VtZW50c1xyXG4gICAgICAvLyBJZiBpdCdzIGFuIGFycmF5IGFsc28gY3JlYXRlIGNvcHkgb2YgaXQgaW4gY2FzZSB3ZSdyZSBnZXR0aW5nIHBhc3NlZFxyXG4gICAgICAvLyBhIGNoaWxkcmVucyBhcnJheSBkaXJlY3RseS5cclxuICAgICAgaWYgKCEob2JqZWN0cyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgIG9iamVjdHMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvYmplY3RzID0gb2JqZWN0cy5zbGljZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBZGQgdGhlIG9iamVjdHNcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmplY3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKCEob2JqZWN0c1tpXSAmJiBvYmplY3RzW2ldLmlkKSkgY29udGludWU7XHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKG9iamVjdHNbaV0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIG9iamVjdHMgZnJvbSB0aGUgZ3JvdXAuXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZTogZnVuY3Rpb24ob2JqZWN0cykge1xyXG5cclxuICAgICAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoLFxyXG4gICAgICAgIGdyYW5kcGFyZW50ID0gdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICAvLyBBbGxvdyB0byBjYWxsIHJlbW92ZSB3aXRob3V0IGFyZ3VtZW50c1xyXG4gICAgICAvLyBUaGlzIHdpbGwgZGV0YWNoIHRoZSBvYmplY3QgZnJvbSB0aGUgc2NlbmUuXHJcbiAgICAgIGlmIChsIDw9IDAgJiYgZ3JhbmRwYXJlbnQpIHtcclxuICAgICAgICBncmFuZHBhcmVudC5yZW1vdmUodGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFsbG93IHRvIHBhc3MgbXVsdGlwbGUgb2JqZWN0cyBlaXRoZXIgYXMgYXJyYXkgb3IgYXMgbXVsdGlwbGUgYXJndW1lbnRzXHJcbiAgICAgIC8vIElmIGl0J3MgYW4gYXJyYXkgYWxzbyBjcmVhdGUgY29weSBvZiBpdCBpbiBjYXNlIHdlJ3JlIGdldHRpbmcgcGFzc2VkXHJcbiAgICAgIC8vIGEgY2hpbGRyZW5zIGFycmF5IGRpcmVjdGx5LlxyXG4gICAgICBpZiAoIShvYmplY3RzIGluc3RhbmNlb2YgQXJyYXkpKSB7XHJcbiAgICAgICAgb2JqZWN0cyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG9iamVjdHMgPSBvYmplY3RzLnNsaWNlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJlbW92ZSB0aGUgb2JqZWN0c1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAoIW9iamVjdHNbaV0gfHwgISh0aGlzLmNoaWxkcmVuLmlkc1tvYmplY3RzW2ldLmlkXSkpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKF8uaW5kZXhPZih0aGlzLmNoaWxkcmVuLCBvYmplY3RzW2ldKSwgMSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gYW4gb2JqZWN0IHdpdGggdG9wLCBsZWZ0LCByaWdodCwgYm90dG9tLCB3aWR0aCwgYW5kIGhlaWdodFxyXG4gICAgICogcGFyYW1ldGVycyBvZiB0aGUgZ3JvdXAuXHJcbiAgICAgKi9cclxuICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogZnVuY3Rpb24oc2hhbGxvdykge1xyXG4gICAgICB2YXIgcmVjdDtcclxuXHJcbiAgICAgIC8vIFRPRE86IFVwZGF0ZSB0aGlzIHRvIG5vdCBfX2Fsd2F5c19fIHVwZGF0ZS4gSnVzdCB3aGVuIGl0IG5lZWRzIHRvLlxyXG4gICAgICB0aGlzLl91cGRhdGUodHJ1ZSk7XHJcblxyXG4gICAgICAvLyBWYXJpYWJsZXMgbmVlZCB0byBiZSBkZWZpbmVkIGhlcmUsIGJlY2F1c2Ugb2YgbmVzdGVkIG5hdHVyZSBvZiBncm91cHMuXHJcbiAgICAgIHZhciBsZWZ0ID0gSW5maW5pdHksIHJpZ2h0ID0gLUluZmluaXR5LFxyXG4gICAgICAgICAgdG9wID0gSW5maW5pdHksIGJvdHRvbSA9IC1JbmZpbml0eTtcclxuXHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xyXG5cclxuICAgICAgICBpZiAoLyhsaW5lYXItZ3JhZGllbnR8cmFkaWFsLWdyYWRpZW50fGdyYWRpZW50KS8udGVzdChjaGlsZC5fcmVuZGVyZXIudHlwZSkpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlY3QgPSBjaGlsZC5nZXRCb3VuZGluZ0NsaWVudFJlY3Qoc2hhbGxvdyk7XHJcblxyXG4gICAgICAgIGlmICghXy5pc051bWJlcihyZWN0LnRvcCkgICB8fCAhXy5pc051bWJlcihyZWN0LmxlZnQpICAgfHxcclxuICAgICAgICAgICAgIV8uaXNOdW1iZXIocmVjdC5yaWdodCkgfHwgIV8uaXNOdW1iZXIocmVjdC5ib3R0b20pKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b3AgPSBtaW4ocmVjdC50b3AsIHRvcCk7XHJcbiAgICAgICAgbGVmdCA9IG1pbihyZWN0LmxlZnQsIGxlZnQpO1xyXG4gICAgICAgIHJpZ2h0ID0gbWF4KHJlY3QucmlnaHQsIHJpZ2h0KTtcclxuICAgICAgICBib3R0b20gPSBtYXgocmVjdC5ib3R0b20sIGJvdHRvbSk7XHJcblxyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiB0b3AsXHJcbiAgICAgICAgbGVmdDogbGVmdCxcclxuICAgICAgICByaWdodDogcmlnaHQsXHJcbiAgICAgICAgYm90dG9tOiBib3R0b20sXHJcbiAgICAgICAgd2lkdGg6IHJpZ2h0IC0gbGVmdCxcclxuICAgICAgICBoZWlnaHQ6IGJvdHRvbSAtIHRvcFxyXG4gICAgICB9O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmlja2xlIGRvd24gb2Ygbm9GaWxsXHJcbiAgICAgKi9cclxuICAgIG5vRmlsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNoaWxkLm5vRmlsbCgpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJpY2tsZSBkb3duIG9mIG5vU3Ryb2tlXHJcbiAgICAgKi9cclxuICAgIG5vU3Ryb2tlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2hpbGQubm9TdHJva2UoKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyaWNrbGUgZG93biBzdWJkaXZpZGVcclxuICAgICAqL1xyXG4gICAgc3ViZGl2aWRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNoaWxkLnN1YmRpdmlkZS5hcHBseShjaGlsZCwgYXJncyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnQWRkaXRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5hZGRpdGlvbnMubGVuZ3RoID0gMDtcclxuICAgICAgICB0aGlzLl9mbGFnQWRkaXRpb25zID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnU3VidHJhY3Rpb25zKSB7XHJcbiAgICAgICAgdGhpcy5zdWJ0cmFjdGlvbnMubGVuZ3RoID0gMDtcclxuICAgICAgICB0aGlzLl9mbGFnU3VidHJhY3Rpb25zID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdPcmRlciA9IHRoaXMuX2ZsYWdNYXNrID0gdGhpcy5fZmxhZ09wYWNpdHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIFR3by5TaGFwZS5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBHcm91cC5NYWtlT2JzZXJ2YWJsZShHcm91cC5wcm90b3R5cGUpO1xyXG5cclxuICAvKipcclxuICAgKiBIZWxwZXIgZnVuY3Rpb24gdXNlZCB0byBzeW5jIHBhcmVudC1jaGlsZCByZWxhdGlvbnNoaXAgd2l0aGluIHRoZVxyXG4gICAqIGBUd28uR3JvdXAuY2hpbGRyZW5gIG9iamVjdC5cclxuICAgKlxyXG4gICAqIFNldCB0aGUgcGFyZW50IG9mIHRoZSBwYXNzZWQgb2JqZWN0IHRvIGFub3RoZXIgb2JqZWN0XHJcbiAgICogYW5kIHVwZGF0ZXMgcGFyZW50LWNoaWxkIHJlbGF0aW9uc2hpcHNcclxuICAgKiBDYWxsaW5nIHdpdGggb25lIGFyZ3VtZW50cyB3aWxsIHNpbXBseSByZW1vdmUgdGhlIHBhcmVudGluZ1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHJlcGxhY2VQYXJlbnQoY2hpbGQsIG5ld1BhcmVudCkge1xyXG5cclxuICAgIHZhciBwYXJlbnQgPSBjaGlsZC5wYXJlbnQ7XHJcbiAgICB2YXIgaW5kZXg7XHJcblxyXG4gICAgaWYgKHBhcmVudCA9PT0gbmV3UGFyZW50KSB7XHJcbiAgICAgIHRoaXMuYWRkaXRpb25zLnB1c2goY2hpbGQpO1xyXG4gICAgICB0aGlzLl9mbGFnQWRkaXRpb25zID0gdHJ1ZTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LmNoaWxkcmVuLmlkc1tjaGlsZC5pZF0pIHtcclxuXHJcbiAgICAgIGluZGV4ID0gXy5pbmRleE9mKHBhcmVudC5jaGlsZHJlbiwgY2hpbGQpO1xyXG4gICAgICBwYXJlbnQuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcclxuXHJcbiAgICAgIC8vIElmIHdlJ3JlIHBhc3NpbmcgZnJvbSBvbmUgcGFyZW50IHRvIGFub3RoZXIuLi5cclxuICAgICAgaW5kZXggPSBfLmluZGV4T2YocGFyZW50LmFkZGl0aW9ucywgY2hpbGQpO1xyXG5cclxuICAgICAgaWYgKGluZGV4ID49IDApIHtcclxuICAgICAgICBwYXJlbnQuYWRkaXRpb25zLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGFyZW50LnN1YnRyYWN0aW9ucy5wdXNoKGNoaWxkKTtcclxuICAgICAgICBwYXJlbnQuX2ZsYWdTdWJ0cmFjdGlvbnMgPSB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlmIChuZXdQYXJlbnQpIHtcclxuICAgICAgY2hpbGQucGFyZW50ID0gbmV3UGFyZW50O1xyXG4gICAgICB0aGlzLmFkZGl0aW9ucy5wdXNoKGNoaWxkKTtcclxuICAgICAgdGhpcy5fZmxhZ0FkZGl0aW9ucyA9IHRydWU7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiB3ZSdyZSBwYXNzaW5nIGZyb20gb25lIHBhcmVudCB0byBhbm90aGVyLi4uXHJcbiAgICBpbmRleCA9IF8uaW5kZXhPZih0aGlzLmFkZGl0aW9ucywgY2hpbGQpO1xyXG5cclxuICAgIGlmIChpbmRleCA+PSAwKSB7XHJcbiAgICAgIHRoaXMuYWRkaXRpb25zLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnN1YnRyYWN0aW9ucy5wdXNoKGNoaWxkKTtcclxuICAgICAgdGhpcy5fZmxhZ1N1YnRyYWN0aW9ucyA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgZGVsZXRlIGNoaWxkLnBhcmVudDtcclxuXHJcbiAgfVxyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuIiwiaW1wb3J0ICogYXMgVHdvIGZyb20gXCJ0d28uanNcIjtcbmltcG9ydCAqIGFzIFNpbXBsZXhOb2lzZSBmcm9tIFwic2ltcGxleC1ub2lzZVwiO1xuXG5jb25zdCBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcHBcIik7XG5jb25zdCB0d28gPSBuZXcgVHdvKHtcbiAgd2lkdGg6IDcyNCxcbiAgaGVpZ2h0OiA1MTJcbn0pLmFwcGVuZFRvKGVsZW0pO1xuXG5jb25zdCBub2lzZSA9IG5ldyBTaW1wbGV4Tm9pc2UoKTtcbmZ1bmN0aW9uIGdyYWRpZW50RGlyKHBvczogdHlwZW9mIFR3by5WZWN0b3IpIHtcbiAgY29uc3QgRVBTID0gMC4wMTtcbiAgY29uc3QgU0NBTEUgPSAwLjAwMztcbiAgY29uc3QgU1BFRUQgPSA1MDtcblxuICBjb25zdCBsID0gbm9pc2Uubm9pc2UyRChTQ0FMRSAqIHBvcy54IC0gRVBTLCBTQ0FMRSAqIHBvcy55KTtcbiAgY29uc3QgciA9IG5vaXNlLm5vaXNlMkQoU0NBTEUgKiBwb3MueCArIEVQUywgU0NBTEUgKiBwb3MueSk7XG4gIGNvbnN0IHUgPSBub2lzZS5ub2lzZTJEKFNDQUxFICogcG9zLngsIFNDQUxFICogcG9zLnkgKyBFUFMpO1xuICBjb25zdCBkID0gbm9pc2Uubm9pc2UyRChTQ0FMRSAqIHBvcy54LCBTQ0FMRSAqIHBvcy55IC0gRVBTKTtcblxuICByZXR1cm4gbmV3IFR3by5WZWN0b3IoLShyIC0gbCkgKiBTUEVFRCwgKHUgLSBkKSAqIFNQRUVEKTtcbn1cblxuY29uc3QgcGF0aHM6IHR5cGVvZiBUd28uUGF0aFtdID0gW107XG5mb3IgKGxldCBpID0gMDsgaSA8IDUwMDA7ICsraSkge1xuICBjb25zdCB4ID0gTWF0aC5yYW5kb20oKSAqIHR3by53aWR0aDtcbiAgY29uc3QgeSA9IE1hdGgucmFuZG9tKCkgKiB0d28uaGVpZ2h0O1xuXG4gIGxldCBwb3MgPSBuZXcgVHdvLlZlY3Rvcih4LCB5KTtcblxuICBjb25zdCBwb2ludHMgPSBbbmV3IFR3by5BbmNob3IocG9zLngsIHBvcy55KV07XG4gIGZvciAobGV0IGogPSAwOyBqIDwgNzsgKytqKSB7XG4gICAgcG9zLmFkZFNlbGYoZ3JhZGllbnREaXIocG9zKSk7XG4gICAgLy8gcG9zLmFkZFNlbGYobmV3IFR3by5WZWN0b3IoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSkubXVsdGlwbHlTY2FsYXIoMi4wKSk7XG4gICAgcG9pbnRzLnB1c2gobmV3IFR3by5BbmNob3IocG9zLngsIHBvcy55KSk7XG4gIH1cbiAgY29uc3QgcGF0aCA9IHR3by5tYWtlQ3VydmUocG9pbnRzLCB0cnVlKTtcbiAgcGF0aC5zdHJva2UgPSBcIiMyMjJcIjtcbiAgcGF0aC5saW5ld2lkdGggPSAxO1xuICBwYXRoLm5vRmlsbCgpO1xuXG4gIHBhdGhzLnB1c2gocGF0aCk7XG59XG50d28udXBkYXRlKCk7XG5cbmZ1bmN0aW9uIGRvd25sb2FkRGF0YShkYXRhOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICBsaW5rLmhyZWYgPSBkYXRhO1xuICBsaW5rLmRvd25sb2FkID0gZmlsZW5hbWU7XG4gIGxpbmsuY2xpY2soKTtcbn1cblxuZnVuY3Rpb24gZG93bmxvYWRTVkcoKSB7XG4gIGlmICghZWxlbSkgcmV0dXJuO1xuXG4gIGNvbnN0IHN2ZyA9IGVsZW0uY2hpbGRyZW5bMF07XG4gIHN2Zy5zZXRBdHRyaWJ1dGUoXCJ2ZXJzaW9uXCIsIFwiMS4xXCIpO1xuICBzdmcuc2V0QXR0cmlidXRlKFwieG1sbnNcIiwgXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiKTtcblxuICBjb25zdCBibG9iID0gbmV3IEJsb2IoW3N2Zy5vdXRlckhUTUxdLCB7dHlwZTpcImltYWdlL3N2Zyt4bWw7Y2hhcnNldD11dGYtOFwifSk7XG4gIGNvbnN0IGRhdGEgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICBkb3dubG9hZERhdGEoZGF0YSwgJ2NhcHR1cmUuc3ZnJyk7XG59XG5cbmZ1bmN0aW9uIGRvd25sb2FkUE5HKCkge1xuICBpZiAoIWVsZW0pIHJldHVybjtcblxuICBjb25zdCBzdmdEYXRhID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhlbGVtLmNoaWxkcmVuWzBdKTtcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgdmFyIHN2Z1NpemUgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBjYW52YXMud2lkdGggPSBzdmdTaXplLndpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gc3ZnU2l6ZS5oZWlnaHQ7XG5cbiAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgaWYgKCFjdHgpIHJldHVybjtcblxuICBjb25zdCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICBpbWcuc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxcIiArIGJ0b2Eoc3ZnRGF0YSkpO1xuXG4gIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCk7XG5cbiAgICBkb3dubG9hZERhdGEoY2FudmFzLnRvRGF0YVVSTChcImltYWdlL3BuZ1wiKSwgXCJjYXB0dXJlLnBuZ1wiKTtcbiAgfTtcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCBlID0+IHtcbiAgaWYgKGUua2V5ID09IFwic1wiKSB7XG4gICAgZG93bmxvYWRTVkcoKTtcbiAgfSBlbHNlIGlmIChlLmtleSA9PSBcInBcIikge1xuICAgIGRvd25sb2FkUE5HKCk7XG4gIH1cbn0pO1xuIl19
