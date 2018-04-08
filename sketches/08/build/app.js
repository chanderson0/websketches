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
    height: 512,
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

},{"simplex-noise":1,"two.js":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc2ltcGxleC1ub2lzZS9zaW1wbGV4LW5vaXNlLmpzIiwibm9kZV9tb2R1bGVzL3R3by5qcy9idWlsZC90d28uanMiLCJzcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ3BnVUEsNEJBQThCO0FBQzlCLDRDQUE4QztBQUU5QyxJQUFNLElBQUksR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVDLElBQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDO0lBQ2xCLEtBQUssRUFBRSxHQUFHO0lBQ1YsTUFBTSxFQUFFLEdBQUc7Q0FDWixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBRWxCLElBQU0sS0FBSyxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7QUFDakMscUJBQXFCLEdBQXNCO0lBQ3pDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQztJQUNqQixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDcEIsSUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBRWpCLElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUQsSUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RCxJQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQzVELElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFFNUQsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsSUFBTSxLQUFLLEdBQXNCLEVBQUUsQ0FBQztBQUNwQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzlCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO0lBQ3BDLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBRXJDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFL0IsSUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQzNCLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDOUIsaUZBQWlGO1FBQ2pGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUNELElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUVkLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkIsQ0FBQztBQUNELEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICogQSBmYXN0IGphdmFzY3JpcHQgaW1wbGVtZW50YXRpb24gb2Ygc2ltcGxleCBub2lzZSBieSBKb25hcyBXYWduZXJcblxuQmFzZWQgb24gYSBzcGVlZC1pbXByb3ZlZCBzaW1wbGV4IG5vaXNlIGFsZ29yaXRobSBmb3IgMkQsIDNEIGFuZCA0RCBpbiBKYXZhLlxuV2hpY2ggaXMgYmFzZWQgb24gZXhhbXBsZSBjb2RlIGJ5IFN0ZWZhbiBHdXN0YXZzb24gKHN0ZWd1QGl0bi5saXUuc2UpLlxuV2l0aCBPcHRpbWlzYXRpb25zIGJ5IFBldGVyIEVhc3RtYW4gKHBlYXN0bWFuQGRyaXp6bGUuc3RhbmZvcmQuZWR1KS5cbkJldHRlciByYW5rIG9yZGVyaW5nIG1ldGhvZCBieSBTdGVmYW4gR3VzdGF2c29uIGluIDIwMTIuXG5cblxuIENvcHlyaWdodCAoYykgMjAxOCBKb25hcyBXYWduZXJcblxuIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuIFNPRlRXQVJFLlxuICovXG4oZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgRjIgPSAwLjUgKiAoTWF0aC5zcXJ0KDMuMCkgLSAxLjApO1xuICB2YXIgRzIgPSAoMy4wIC0gTWF0aC5zcXJ0KDMuMCkpIC8gNi4wO1xuICB2YXIgRjMgPSAxLjAgLyAzLjA7XG4gIHZhciBHMyA9IDEuMCAvIDYuMDtcbiAgdmFyIEY0ID0gKE1hdGguc3FydCg1LjApIC0gMS4wKSAvIDQuMDtcbiAgdmFyIEc0ID0gKDUuMCAtIE1hdGguc3FydCg1LjApKSAvIDIwLjA7XG5cbiAgZnVuY3Rpb24gU2ltcGxleE5vaXNlKHJhbmRvbU9yU2VlZCkge1xuICAgIHZhciByYW5kb207XG4gICAgaWYgKHR5cGVvZiByYW5kb21PclNlZWQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmFuZG9tID0gcmFuZG9tT3JTZWVkO1xuICAgIH1cbiAgICBlbHNlIGlmIChyYW5kb21PclNlZWQpIHtcbiAgICAgIHJhbmRvbSA9IGFsZWEocmFuZG9tT3JTZWVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmFuZG9tID0gTWF0aC5yYW5kb207XG4gICAgfVxuICAgIHRoaXMucCA9IGJ1aWxkUGVybXV0YXRpb25UYWJsZShyYW5kb20pO1xuICAgIHRoaXMucGVybSA9IG5ldyBVaW50OEFycmF5KDUxMik7XG4gICAgdGhpcy5wZXJtTW9kMTIgPSBuZXcgVWludDhBcnJheSg1MTIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNTEyOyBpKyspIHtcbiAgICAgIHRoaXMucGVybVtpXSA9IHRoaXMucFtpICYgMjU1XTtcbiAgICAgIHRoaXMucGVybU1vZDEyW2ldID0gdGhpcy5wZXJtW2ldICUgMTI7XG4gICAgfVxuXG4gIH1cbiAgU2ltcGxleE5vaXNlLnByb3RvdHlwZSA9IHtcbiAgICBncmFkMzogbmV3IEZsb2F0MzJBcnJheShbMSwgMSwgMCxcbiAgICAgIC0xLCAxLCAwLFxuICAgICAgMSwgLTEsIDAsXG5cbiAgICAgIC0xLCAtMSwgMCxcbiAgICAgIDEsIDAsIDEsXG4gICAgICAtMSwgMCwgMSxcblxuICAgICAgMSwgMCwgLTEsXG4gICAgICAtMSwgMCwgLTEsXG4gICAgICAwLCAxLCAxLFxuXG4gICAgICAwLCAtMSwgMSxcbiAgICAgIDAsIDEsIC0xLFxuICAgICAgMCwgLTEsIC0xXSksXG4gICAgZ3JhZDQ6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDEsIDEsIDEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgMSwgMCwgMSwgLTEsIC0xLFxuICAgICAgMCwgLTEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLFxuICAgICAgMSwgMCwgMSwgMSwgMSwgMCwgMSwgLTEsIDEsIDAsIC0xLCAxLCAxLCAwLCAtMSwgLTEsXG4gICAgICAtMSwgMCwgMSwgMSwgLTEsIDAsIDEsIC0xLCAtMSwgMCwgLTEsIDEsIC0xLCAwLCAtMSwgLTEsXG4gICAgICAxLCAxLCAwLCAxLCAxLCAxLCAwLCAtMSwgMSwgLTEsIDAsIDEsIDEsIC0xLCAwLCAtMSxcbiAgICAgIC0xLCAxLCAwLCAxLCAtMSwgMSwgMCwgLTEsIC0xLCAtMSwgMCwgMSwgLTEsIC0xLCAwLCAtMSxcbiAgICAgIDEsIDEsIDEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgMSwgMCwgMSwgLTEsIC0xLCAwLFxuICAgICAgLTEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLCAwXSksXG4gICAgbm9pc2UyRDogZnVuY3Rpb24oeGluLCB5aW4pIHtcbiAgICAgIHZhciBwZXJtTW9kMTIgPSB0aGlzLnBlcm1Nb2QxMjtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQzID0gdGhpcy5ncmFkMztcbiAgICAgIHZhciBuMCA9IDA7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgdmFyIG4xID0gMDtcbiAgICAgIHZhciBuMiA9IDA7XG4gICAgICAvLyBTa2V3IHRoZSBpbnB1dCBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggc2ltcGxleCBjZWxsIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4aW4gKyB5aW4pICogRjI7IC8vIEhhaXJ5IGZhY3RvciBmb3IgMkRcbiAgICAgIHZhciBpID0gTWF0aC5mbG9vcih4aW4gKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5aW4gKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqKSAqIEcyO1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgeDAgPSB4aW4gLSBYMDsgLy8gVGhlIHgseSBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHlpbiAtIFkwO1xuICAgICAgLy8gRm9yIHRoZSAyRCBjYXNlLCB0aGUgc2ltcGxleCBzaGFwZSBpcyBhbiBlcXVpbGF0ZXJhbCB0cmlhbmdsZS5cbiAgICAgIC8vIERldGVybWluZSB3aGljaCBzaW1wbGV4IHdlIGFyZSBpbi5cbiAgICAgIHZhciBpMSwgajE7IC8vIE9mZnNldHMgZm9yIHNlY29uZCAobWlkZGxlKSBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqKSBjb29yZHNcbiAgICAgIGlmICh4MCA+IHkwKSB7XG4gICAgICAgIGkxID0gMTtcbiAgICAgICAgajEgPSAwO1xuICAgICAgfSAvLyBsb3dlciB0cmlhbmdsZSwgWFkgb3JkZXI6ICgwLDApLT4oMSwwKS0+KDEsMSlcbiAgICAgIGVsc2Uge1xuICAgICAgICBpMSA9IDA7XG4gICAgICAgIGoxID0gMTtcbiAgICAgIH0gLy8gdXBwZXIgdHJpYW5nbGUsIFlYIG9yZGVyOiAoMCwwKS0+KDAsMSktPigxLDEpXG4gICAgICAvLyBBIHN0ZXAgb2YgKDEsMCkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgxLWMsLWMpIGluICh4LHkpLCBhbmRcbiAgICAgIC8vIGEgc3RlcCBvZiAoMCwxKSBpbiAoaSxqKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYykgaW4gKHgseSksIHdoZXJlXG4gICAgICAvLyBjID0gKDMtc3FydCgzKSkvNlxuICAgICAgdmFyIHgxID0geDAgLSBpMSArIEcyOyAvLyBPZmZzZXRzIGZvciBtaWRkbGUgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEcyO1xuICAgICAgdmFyIHgyID0geDAgLSAxLjAgKyAyLjAgKiBHMjsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSkgdW5za2V3ZWQgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIDEuMCArIDIuMCAqIEcyO1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSB0aHJlZSBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjb250cmlidXRpb24gZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC41IC0geDAgKiB4MCAtIHkwICogeTA7XG4gICAgICBpZiAodDAgPj0gMCkge1xuICAgICAgICB2YXIgZ2kwID0gcGVybU1vZDEyW2lpICsgcGVybVtqal1dICogMztcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkM1tnaTBdICogeDAgKyBncmFkM1tnaTAgKyAxXSAqIHkwKTsgLy8gKHgseSkgb2YgZ3JhZDMgdXNlZCBmb3IgMkQgZ3JhZGllbnRcbiAgICAgIH1cbiAgICAgIHZhciB0MSA9IDAuNSAtIHgxICogeDEgLSB5MSAqIHkxO1xuICAgICAgaWYgKHQxID49IDApIHtcbiAgICAgICAgdmFyIGdpMSA9IHBlcm1Nb2QxMltpaSArIGkxICsgcGVybVtqaiArIGoxXV0gKiAzO1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQzW2dpMV0gKiB4MSArIGdyYWQzW2dpMSArIDFdICogeTEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC41IC0geDIgKiB4MiAtIHkyICogeTI7XG4gICAgICBpZiAodDIgPj0gMCkge1xuICAgICAgICB2YXIgZ2kyID0gcGVybU1vZDEyW2lpICsgMSArIHBlcm1bamogKyAxXV0gKiAzO1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKGdyYWQzW2dpMl0gKiB4MiArIGdyYWQzW2dpMiArIDFdICogeTIpO1xuICAgICAgfVxuICAgICAgLy8gQWRkIGNvbnRyaWJ1dGlvbnMgZnJvbSBlYWNoIGNvcm5lciB0byBnZXQgdGhlIGZpbmFsIG5vaXNlIHZhbHVlLlxuICAgICAgLy8gVGhlIHJlc3VsdCBpcyBzY2FsZWQgdG8gcmV0dXJuIHZhbHVlcyBpbiB0aGUgaW50ZXJ2YWwgWy0xLDFdLlxuICAgICAgcmV0dXJuIDcwLjAgKiAobjAgKyBuMSArIG4yKTtcbiAgICB9LFxuICAgIC8vIDNEIHNpbXBsZXggbm9pc2VcbiAgICBub2lzZTNEOiBmdW5jdGlvbih4aW4sIHlpbiwgemluKSB7XG4gICAgICB2YXIgcGVybU1vZDEyID0gdGhpcy5wZXJtTW9kMTI7XG4gICAgICB2YXIgcGVybSA9IHRoaXMucGVybTtcbiAgICAgIHZhciBncmFkMyA9IHRoaXMuZ3JhZDM7XG4gICAgICB2YXIgbjAsIG4xLCBuMiwgbjM7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgZm91ciBjb3JuZXJzXG4gICAgICAvLyBTa2V3IHRoZSBpbnB1dCBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggc2ltcGxleCBjZWxsIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4aW4gKyB5aW4gKyB6aW4pICogRjM7IC8vIFZlcnkgbmljZSBhbmQgc2ltcGxlIHNrZXcgZmFjdG9yIGZvciAzRFxuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHhpbiArIHMpO1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKHlpbiArIHMpO1xuICAgICAgdmFyIGsgPSBNYXRoLmZsb29yKHppbiArIHMpO1xuICAgICAgdmFyIHQgPSAoaSArIGogKyBrKSAqIEczO1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5LHopIHNwYWNlXG4gICAgICB2YXIgWTAgPSBqIC0gdDtcbiAgICAgIHZhciBaMCA9IGsgLSB0O1xuICAgICAgdmFyIHgwID0geGluIC0gWDA7IC8vIFRoZSB4LHkseiBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHlpbiAtIFkwO1xuICAgICAgdmFyIHowID0gemluIC0gWjA7XG4gICAgICAvLyBGb3IgdGhlIDNEIGNhc2UsIHRoZSBzaW1wbGV4IHNoYXBlIGlzIGEgc2xpZ2h0bHkgaXJyZWd1bGFyIHRldHJhaGVkcm9uLlxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggd2UgYXJlIGluLlxuICAgICAgdmFyIGkxLCBqMSwgazE7IC8vIE9mZnNldHMgZm9yIHNlY29uZCBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqLGspIGNvb3Jkc1xuICAgICAgdmFyIGkyLCBqMiwgazI7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBvZiBzaW1wbGV4IGluIChpLGosaykgY29vcmRzXG4gICAgICBpZiAoeDAgPj0geTApIHtcbiAgICAgICAgaWYgKHkwID49IHowKSB7XG4gICAgICAgICAgaTEgPSAxO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDA7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDA7XG4gICAgICAgIH0gLy8gWCBZIFogb3JkZXJcbiAgICAgICAgZWxzZSBpZiAoeDAgPj0gejApIHtcbiAgICAgICAgICBpMSA9IDE7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAwO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBYIFogWSBvcmRlclxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMTtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAwO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBaIFggWSBvcmRlclxuICAgICAgfVxuICAgICAgZWxzZSB7IC8vIHgwPHkwXG4gICAgICAgIGlmICh5MCA8IHowKSB7XG4gICAgICAgICAgaTEgPSAwO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDE7XG4gICAgICAgICAgaTIgPSAwO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWiBZIFggb3JkZXJcbiAgICAgICAgZWxzZSBpZiAoeDAgPCB6MCkge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDE7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMDtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAxO1xuICAgICAgICB9IC8vIFkgWiBYIG9yZGVyXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDE7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMTtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAwO1xuICAgICAgICB9IC8vIFkgWCBaIG9yZGVyXG4gICAgICB9XG4gICAgICAvLyBBIHN0ZXAgb2YgKDEsMCwwKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoMS1jLC1jLC1jKSBpbiAoeCx5LHopLFxuICAgICAgLy8gYSBzdGVwIG9mICgwLDEsMCkgaW4gKGksaixrKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYywtYykgaW4gKHgseSx6KSwgYW5kXG4gICAgICAvLyBhIHN0ZXAgb2YgKDAsMCwxKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoLWMsLWMsMS1jKSBpbiAoeCx5LHopLCB3aGVyZVxuICAgICAgLy8gYyA9IDEvNi5cbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHMzsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBpbiAoeCx5LHopIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEczO1xuICAgICAgdmFyIHoxID0gejAgLSBrMSArIEczO1xuICAgICAgdmFyIHgyID0geDAgLSBpMiArIDIuMCAqIEczOyAvLyBPZmZzZXRzIGZvciB0aGlyZCBjb3JuZXIgaW4gKHgseSx6KSBjb29yZHNcbiAgICAgIHZhciB5MiA9IHkwIC0gajIgKyAyLjAgKiBHMztcbiAgICAgIHZhciB6MiA9IHowIC0gazIgKyAyLjAgKiBHMztcbiAgICAgIHZhciB4MyA9IHgwIC0gMS4wICsgMy4wICogRzM7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkseikgY29vcmRzXG4gICAgICB2YXIgeTMgPSB5MCAtIDEuMCArIDMuMCAqIEczO1xuICAgICAgdmFyIHozID0gejAgLSAxLjAgKyAzLjAgKiBHMztcbiAgICAgIC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgZm91ciBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgdmFyIGtrID0gayAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIGZvdXIgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC42IC0geDAgKiB4MCAtIHkwICogeTAgLSB6MCAqIHowO1xuICAgICAgaWYgKHQwIDwgMCkgbjAgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMCA9IHBlcm1Nb2QxMltpaSArIHBlcm1bamogKyBwZXJtW2trXV1dICogMztcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkM1tnaTBdICogeDAgKyBncmFkM1tnaTAgKyAxXSAqIHkwICsgZ3JhZDNbZ2kwICsgMl0gKiB6MCk7XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjYgLSB4MSAqIHgxIC0geTEgKiB5MSAtIHoxICogejE7XG4gICAgICBpZiAodDEgPCAwKSBuMSA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kxID0gcGVybU1vZDEyW2lpICsgaTEgKyBwZXJtW2pqICsgajEgKyBwZXJtW2trICsgazFdXV0gKiAzO1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQzW2dpMV0gKiB4MSArIGdyYWQzW2dpMSArIDFdICogeTEgKyBncmFkM1tnaTEgKyAyXSAqIHoxKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MiA9IDAuNiAtIHgyICogeDIgLSB5MiAqIHkyIC0gejIgKiB6MjtcbiAgICAgIGlmICh0MiA8IDApIG4yID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTIgPSBwZXJtTW9kMTJbaWkgKyBpMiArIHBlcm1bamogKyBqMiArIHBlcm1ba2sgKyBrMl1dXSAqIDM7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDNbZ2kyXSAqIHgyICsgZ3JhZDNbZ2kyICsgMV0gKiB5MiArIGdyYWQzW2dpMiArIDJdICogejIpO1xuICAgICAgfVxuICAgICAgdmFyIHQzID0gMC42IC0geDMgKiB4MyAtIHkzICogeTMgLSB6MyAqIHozO1xuICAgICAgaWYgKHQzIDwgMCkgbjMgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMyA9IHBlcm1Nb2QxMltpaSArIDEgKyBwZXJtW2pqICsgMSArIHBlcm1ba2sgKyAxXV1dICogMztcbiAgICAgICAgdDMgKj0gdDM7XG4gICAgICAgIG4zID0gdDMgKiB0MyAqIChncmFkM1tnaTNdICogeDMgKyBncmFkM1tnaTMgKyAxXSAqIHkzICsgZ3JhZDNbZ2kzICsgMl0gKiB6Myk7XG4gICAgICB9XG4gICAgICAvLyBBZGQgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggY29ybmVyIHRvIGdldCB0aGUgZmluYWwgbm9pc2UgdmFsdWUuXG4gICAgICAvLyBUaGUgcmVzdWx0IGlzIHNjYWxlZCB0byBzdGF5IGp1c3QgaW5zaWRlIFstMSwxXVxuICAgICAgcmV0dXJuIDMyLjAgKiAobjAgKyBuMSArIG4yICsgbjMpO1xuICAgIH0sXG4gICAgLy8gNEQgc2ltcGxleCBub2lzZSwgYmV0dGVyIHNpbXBsZXggcmFuayBvcmRlcmluZyBtZXRob2QgMjAxMi0wMy0wOVxuICAgIG5vaXNlNEQ6IGZ1bmN0aW9uKHgsIHksIHosIHcpIHtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQ0ID0gdGhpcy5ncmFkNDtcblxuICAgICAgdmFyIG4wLCBuMSwgbjIsIG4zLCBuNDsgLy8gTm9pc2UgY29udHJpYnV0aW9ucyBmcm9tIHRoZSBmaXZlIGNvcm5lcnNcbiAgICAgIC8vIFNrZXcgdGhlICh4LHkseix3KSBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggY2VsbCBvZiAyNCBzaW1wbGljZXMgd2UncmUgaW5cbiAgICAgIHZhciBzID0gKHggKyB5ICsgeiArIHcpICogRjQ7IC8vIEZhY3RvciBmb3IgNEQgc2tld2luZ1xuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHggKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5ICsgcyk7XG4gICAgICB2YXIgayA9IE1hdGguZmxvb3IoeiArIHMpO1xuICAgICAgdmFyIGwgPSBNYXRoLmZsb29yKHcgKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqICsgayArIGwpICogRzQ7IC8vIEZhY3RvciBmb3IgNEQgdW5za2V3aW5nXG4gICAgICB2YXIgWDAgPSBpIC0gdDsgLy8gVW5za2V3IHRoZSBjZWxsIG9yaWdpbiBiYWNrIHRvICh4LHkseix3KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgWjAgPSBrIC0gdDtcbiAgICAgIHZhciBXMCA9IGwgLSB0O1xuICAgICAgdmFyIHgwID0geCAtIFgwOyAvLyBUaGUgeCx5LHosdyBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHkgLSBZMDtcbiAgICAgIHZhciB6MCA9IHogLSBaMDtcbiAgICAgIHZhciB3MCA9IHcgLSBXMDtcbiAgICAgIC8vIEZvciB0aGUgNEQgY2FzZSwgdGhlIHNpbXBsZXggaXMgYSA0RCBzaGFwZSBJIHdvbid0IGV2ZW4gdHJ5IHRvIGRlc2NyaWJlLlxuICAgICAgLy8gVG8gZmluZCBvdXQgd2hpY2ggb2YgdGhlIDI0IHBvc3NpYmxlIHNpbXBsaWNlcyB3ZSdyZSBpbiwgd2UgbmVlZCB0b1xuICAgICAgLy8gZGV0ZXJtaW5lIHRoZSBtYWduaXR1ZGUgb3JkZXJpbmcgb2YgeDAsIHkwLCB6MCBhbmQgdzAuXG4gICAgICAvLyBTaXggcGFpci13aXNlIGNvbXBhcmlzb25zIGFyZSBwZXJmb3JtZWQgYmV0d2VlbiBlYWNoIHBvc3NpYmxlIHBhaXJcbiAgICAgIC8vIG9mIHRoZSBmb3VyIGNvb3JkaW5hdGVzLCBhbmQgdGhlIHJlc3VsdHMgYXJlIHVzZWQgdG8gcmFuayB0aGUgbnVtYmVycy5cbiAgICAgIHZhciByYW5reCA9IDA7XG4gICAgICB2YXIgcmFua3kgPSAwO1xuICAgICAgdmFyIHJhbmt6ID0gMDtcbiAgICAgIHZhciByYW5rdyA9IDA7XG4gICAgICBpZiAoeDAgPiB5MCkgcmFua3grKztcbiAgICAgIGVsc2UgcmFua3krKztcbiAgICAgIGlmICh4MCA+IHowKSByYW5reCsrO1xuICAgICAgZWxzZSByYW5reisrO1xuICAgICAgaWYgKHgwID4gdzApIHJhbmt4Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICBpZiAoeTAgPiB6MCkgcmFua3krKztcbiAgICAgIGVsc2UgcmFua3orKztcbiAgICAgIGlmICh5MCA+IHcwKSByYW5reSsrO1xuICAgICAgZWxzZSByYW5rdysrO1xuICAgICAgaWYgKHowID4gdzApIHJhbmt6Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICB2YXIgaTEsIGoxLCBrMSwgbDE7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSBzZWNvbmQgc2ltcGxleCBjb3JuZXJcbiAgICAgIHZhciBpMiwgajIsIGsyLCBsMjsgLy8gVGhlIGludGVnZXIgb2Zmc2V0cyBmb3IgdGhlIHRoaXJkIHNpbXBsZXggY29ybmVyXG4gICAgICB2YXIgaTMsIGozLCBrMywgbDM7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSBmb3VydGggc2ltcGxleCBjb3JuZXJcbiAgICAgIC8vIHNpbXBsZXhbY10gaXMgYSA0LXZlY3RvciB3aXRoIHRoZSBudW1iZXJzIDAsIDEsIDIgYW5kIDMgaW4gc29tZSBvcmRlci5cbiAgICAgIC8vIE1hbnkgdmFsdWVzIG9mIGMgd2lsbCBuZXZlciBvY2N1ciwgc2luY2UgZS5nLiB4Pnk+ej53IG1ha2VzIHg8eiwgeTx3IGFuZCB4PHdcbiAgICAgIC8vIGltcG9zc2libGUuIE9ubHkgdGhlIDI0IGluZGljZXMgd2hpY2ggaGF2ZSBub24temVybyBlbnRyaWVzIG1ha2UgYW55IHNlbnNlLlxuICAgICAgLy8gV2UgdXNlIGEgdGhyZXNob2xkaW5nIHRvIHNldCB0aGUgY29vcmRpbmF0ZXMgaW4gdHVybiBmcm9tIHRoZSBsYXJnZXN0IG1hZ25pdHVkZS5cbiAgICAgIC8vIFJhbmsgMyBkZW5vdGVzIHRoZSBsYXJnZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMSA9IHJhbmt4ID49IDMgPyAxIDogMDtcbiAgICAgIGoxID0gcmFua3kgPj0gMyA/IDEgOiAwO1xuICAgICAgazEgPSByYW5reiA+PSAzID8gMSA6IDA7XG4gICAgICBsMSA9IHJhbmt3ID49IDMgPyAxIDogMDtcbiAgICAgIC8vIFJhbmsgMiBkZW5vdGVzIHRoZSBzZWNvbmQgbGFyZ2VzdCBjb29yZGluYXRlLlxuICAgICAgaTIgPSByYW5reCA+PSAyID8gMSA6IDA7XG4gICAgICBqMiA9IHJhbmt5ID49IDIgPyAxIDogMDtcbiAgICAgIGsyID0gcmFua3ogPj0gMiA/IDEgOiAwO1xuICAgICAgbDIgPSByYW5rdyA+PSAyID8gMSA6IDA7XG4gICAgICAvLyBSYW5rIDEgZGVub3RlcyB0aGUgc2Vjb25kIHNtYWxsZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMyA9IHJhbmt4ID49IDEgPyAxIDogMDtcbiAgICAgIGozID0gcmFua3kgPj0gMSA/IDEgOiAwO1xuICAgICAgazMgPSByYW5reiA+PSAxID8gMSA6IDA7XG4gICAgICBsMyA9IHJhbmt3ID49IDEgPyAxIDogMDtcbiAgICAgIC8vIFRoZSBmaWZ0aCBjb3JuZXIgaGFzIGFsbCBjb29yZGluYXRlIG9mZnNldHMgPSAxLCBzbyBubyBuZWVkIHRvIGNvbXB1dGUgdGhhdC5cbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHNDsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTEgPSB5MCAtIGoxICsgRzQ7XG4gICAgICB2YXIgejEgPSB6MCAtIGsxICsgRzQ7XG4gICAgICB2YXIgdzEgPSB3MCAtIGwxICsgRzQ7XG4gICAgICB2YXIgeDIgPSB4MCAtIGkyICsgMi4wICogRzQ7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIGoyICsgMi4wICogRzQ7XG4gICAgICB2YXIgejIgPSB6MCAtIGsyICsgMi4wICogRzQ7XG4gICAgICB2YXIgdzIgPSB3MCAtIGwyICsgMi4wICogRzQ7XG4gICAgICB2YXIgeDMgPSB4MCAtIGkzICsgMy4wICogRzQ7IC8vIE9mZnNldHMgZm9yIGZvdXJ0aCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHkzID0geTAgLSBqMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHozID0gejAgLSBrMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHczID0gdzAgLSBsMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHg0ID0geDAgLSAxLjAgKyA0LjAgKiBHNDsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHk0ID0geTAgLSAxLjAgKyA0LjAgKiBHNDtcbiAgICAgIHZhciB6NCA9IHowIC0gMS4wICsgNC4wICogRzQ7XG4gICAgICB2YXIgdzQgPSB3MCAtIDEuMCArIDQuMCAqIEc0O1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSBmaXZlIHNpbXBsZXggY29ybmVyc1xuICAgICAgdmFyIGlpID0gaSAmIDI1NTtcbiAgICAgIHZhciBqaiA9IGogJiAyNTU7XG4gICAgICB2YXIga2sgPSBrICYgMjU1O1xuICAgICAgdmFyIGxsID0gbCAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIGZpdmUgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC42IC0geDAgKiB4MCAtIHkwICogeTAgLSB6MCAqIHowIC0gdzAgKiB3MDtcbiAgICAgIGlmICh0MCA8IDApIG4wID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTAgPSAocGVybVtpaSArIHBlcm1bamogKyBwZXJtW2trICsgcGVybVtsbF1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MCAqPSB0MDtcbiAgICAgICAgbjAgPSB0MCAqIHQwICogKGdyYWQ0W2dpMF0gKiB4MCArIGdyYWQ0W2dpMCArIDFdICogeTAgKyBncmFkNFtnaTAgKyAyXSAqIHowICsgZ3JhZDRbZ2kwICsgM10gKiB3MCk7XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjYgLSB4MSAqIHgxIC0geTEgKiB5MSAtIHoxICogejEgLSB3MSAqIHcxO1xuICAgICAgaWYgKHQxIDwgMCkgbjEgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMSA9IChwZXJtW2lpICsgaTEgKyBwZXJtW2pqICsgajEgKyBwZXJtW2trICsgazEgKyBwZXJtW2xsICsgbDFdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDEgKj0gdDE7XG4gICAgICAgIG4xID0gdDEgKiB0MSAqIChncmFkNFtnaTFdICogeDEgKyBncmFkNFtnaTEgKyAxXSAqIHkxICsgZ3JhZDRbZ2kxICsgMl0gKiB6MSArIGdyYWQ0W2dpMSArIDNdICogdzEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC42IC0geDIgKiB4MiAtIHkyICogeTIgLSB6MiAqIHoyIC0gdzIgKiB3MjtcbiAgICAgIGlmICh0MiA8IDApIG4yID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTIgPSAocGVybVtpaSArIGkyICsgcGVybVtqaiArIGoyICsgcGVybVtrayArIGsyICsgcGVybVtsbCArIGwyXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDRbZ2kyXSAqIHgyICsgZ3JhZDRbZ2kyICsgMV0gKiB5MiArIGdyYWQ0W2dpMiArIDJdICogejIgKyBncmFkNFtnaTIgKyAzXSAqIHcyKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MyA9IDAuNiAtIHgzICogeDMgLSB5MyAqIHkzIC0gejMgKiB6MyAtIHczICogdzM7XG4gICAgICBpZiAodDMgPCAwKSBuMyA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kzID0gKHBlcm1baWkgKyBpMyArIHBlcm1bamogKyBqMyArIHBlcm1ba2sgKyBrMyArIHBlcm1bbGwgKyBsM11dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MyAqPSB0MztcbiAgICAgICAgbjMgPSB0MyAqIHQzICogKGdyYWQ0W2dpM10gKiB4MyArIGdyYWQ0W2dpMyArIDFdICogeTMgKyBncmFkNFtnaTMgKyAyXSAqIHozICsgZ3JhZDRbZ2kzICsgM10gKiB3Myk7XG4gICAgICB9XG4gICAgICB2YXIgdDQgPSAwLjYgLSB4NCAqIHg0IC0geTQgKiB5NCAtIHo0ICogejQgLSB3NCAqIHc0O1xuICAgICAgaWYgKHQ0IDwgMCkgbjQgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpNCA9IChwZXJtW2lpICsgMSArIHBlcm1bamogKyAxICsgcGVybVtrayArIDEgKyBwZXJtW2xsICsgMV1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0NCAqPSB0NDtcbiAgICAgICAgbjQgPSB0NCAqIHQ0ICogKGdyYWQ0W2dpNF0gKiB4NCArIGdyYWQ0W2dpNCArIDFdICogeTQgKyBncmFkNFtnaTQgKyAyXSAqIHo0ICsgZ3JhZDRbZ2k0ICsgM10gKiB3NCk7XG4gICAgICB9XG4gICAgICAvLyBTdW0gdXAgYW5kIHNjYWxlIHRoZSByZXN1bHQgdG8gY292ZXIgdGhlIHJhbmdlIFstMSwxXVxuICAgICAgcmV0dXJuIDI3LjAgKiAobjAgKyBuMSArIG4yICsgbjMgKyBuNCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGJ1aWxkUGVybXV0YXRpb25UYWJsZShyYW5kb20pIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgcCA9IG5ldyBVaW50OEFycmF5KDI1Nik7XG4gICAgZm9yIChpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgICBwW2ldID0gaTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IDI1NTsgaSsrKSB7XG4gICAgICB2YXIgciA9IGkgKyB+fihyYW5kb20oKSAqICgyNTYgLSBpKSk7XG4gICAgICB2YXIgYXV4ID0gcFtpXTtcbiAgICAgIHBbaV0gPSBwW3JdO1xuICAgICAgcFtyXSA9IGF1eDtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgU2ltcGxleE5vaXNlLl9idWlsZFBlcm11dGF0aW9uVGFibGUgPSBidWlsZFBlcm11dGF0aW9uVGFibGU7XG5cbiAgZnVuY3Rpb24gYWxlYSgpIHtcbiAgICAvLyBKb2hhbm5lcyBCYWFnw7hlIDxiYWFnb2VAYmFhZ29lLmNvbT4sIDIwMTBcbiAgICB2YXIgczAgPSAwO1xuICAgIHZhciBzMSA9IDA7XG4gICAgdmFyIHMyID0gMDtcbiAgICB2YXIgYyA9IDE7XG5cbiAgICB2YXIgbWFzaCA9IG1hc2hlcigpO1xuICAgIHMwID0gbWFzaCgnICcpO1xuICAgIHMxID0gbWFzaCgnICcpO1xuICAgIHMyID0gbWFzaCgnICcpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHMwIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMCA8IDApIHtcbiAgICAgICAgczAgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMxIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMSA8IDApIHtcbiAgICAgICAgczEgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMyIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMiA8IDApIHtcbiAgICAgICAgczIgKz0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgbWFzaCA9IG51bGw7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHQgPSAyMDkxNjM5ICogczAgKyBjICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgICAgIHMwID0gczE7XG4gICAgICBzMSA9IHMyO1xuICAgICAgcmV0dXJuIHMyID0gdCAtIChjID0gdCB8IDApO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gbWFzaGVyKCkge1xuICAgIHZhciBuID0gMHhlZmM4MjQ5ZDtcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgZGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICBuICs9IGRhdGEuY2hhckNvZGVBdChpKTtcbiAgICAgICAgdmFyIGggPSAwLjAyNTE5NjAzMjgyNDE2OTM4ICogbjtcbiAgICAgICAgbiA9IGggPj4+IDA7XG4gICAgICAgIGggLT0gbjtcbiAgICAgICAgaCAqPSBuO1xuICAgICAgICBuID0gaCA+Pj4gMDtcbiAgICAgICAgaCAtPSBuO1xuICAgICAgICBuICs9IGggKiAweDEwMDAwMDAwMDsgLy8gMl4zMlxuICAgICAgfVxuICAgICAgcmV0dXJuIChuID4+PiAwKSAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgfTtcbiAgfVxuXG4gIC8vIGFtZFxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiBTaW1wbGV4Tm9pc2U7fSk7XG4gIC8vIGNvbW1vbiBqc1xuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSBleHBvcnRzLlNpbXBsZXhOb2lzZSA9IFNpbXBsZXhOb2lzZTtcbiAgLy8gYnJvd3NlclxuICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgd2luZG93LlNpbXBsZXhOb2lzZSA9IFNpbXBsZXhOb2lzZTtcbiAgLy8gbm9kZWpzXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gU2ltcGxleE5vaXNlO1xuICB9XG5cbn0pKCk7XG4iLCIvKipcclxuICogdHdvLmpzXHJcbiAqIGEgdHdvLWRpbWVuc2lvbmFsIGRyYXdpbmcgYXBpIG1lYW50IGZvciBtb2Rlcm4gYnJvd3NlcnMuIEl0IGlzIHJlbmRlcmVyXHJcbiAqIGFnbm9zdGljIGVuYWJsaW5nIHRoZSBzYW1lIGFwaSBmb3IgcmVuZGVyaW5nIGluIG11bHRpcGxlIGNvbnRleHRzOiB3ZWJnbCxcclxuICogY2FudmFzMmQsIGFuZCBzdmcuXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxMiAtIDIwMTcgam9ub2JyMSAvIGh0dHA6Ly9qb25vYnIxLmNvbVxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxyXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcclxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcclxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxyXG4gKiBUSEUgU09GVFdBUkUuXHJcbiAqXHJcbiAqL1xyXG5cclxudGhpcy5Ud28gPSAoZnVuY3Rpb24ocHJldmlvdXNUd28pIHtcclxuXHJcbiAgdmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IG51bGw7XHJcbiAgdmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcclxuICB2YXIgXyA9IHtcclxuICAgIC8vIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnLyDigKIgMS44LjNcclxuICAgIF9pbmRleEFtb3VudDogMCxcclxuICAgIG5hdHVyYWw6IHtcclxuICAgICAgc2xpY2U6IEFycmF5LnByb3RvdHlwZS5zbGljZSxcclxuICAgICAgaW5kZXhPZjogQXJyYXkucHJvdG90eXBlLmluZGV4T2YsXHJcbiAgICAgIGtleXM6IE9iamVjdC5rZXlzLFxyXG4gICAgICBiaW5kOiBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCxcclxuICAgICAgY3JlYXRlOiBPYmplY3QuY3JlYXRlXHJcbiAgICB9LFxyXG4gICAgaWRlbnRpdHk6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH0sXHJcbiAgICBpc0FyZ3VtZW50czogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xyXG4gICAgfSxcclxuICAgIGlzRnVuY3Rpb246IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xyXG4gICAgfSxcclxuICAgIGlzU3RyaW5nOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XHJcbiAgICB9LFxyXG4gICAgaXNOdW1iZXI6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBOdW1iZXJdJztcclxuICAgIH0sXHJcbiAgICBpc0RhdGU6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBEYXRlXSc7XHJcbiAgICB9LFxyXG4gICAgaXNSZWdFeHA6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBSZWdFeHBdJztcclxuICAgIH0sXHJcbiAgICBpc0Vycm9yOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRXJyb3JdJztcclxuICAgIH0sXHJcbiAgICBpc0Zpbml0ZTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xyXG4gICAgfSxcclxuICAgIGlzTmFOOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT09ICtvYmo7XHJcbiAgICB9LFxyXG4gICAgaXNCb29sZWFuOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xyXG4gICAgfSxcclxuICAgIGlzTnVsbDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiBvYmogPT09IG51bGw7XHJcbiAgICB9LFxyXG4gICAgaXNVbmRlZmluZWQ6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XHJcbiAgICB9LFxyXG4gICAgaXNFbXB0eTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XHJcbiAgICAgIGlmIChpc0FycmF5TGlrZSAmJiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc1N0cmluZyhvYmopIHx8IF8uaXNBcmd1bWVudHMob2JqKSkpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xyXG4gICAgICByZXR1cm4gXy5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xyXG4gICAgfSxcclxuICAgIGlzRWxlbWVudDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcclxuICAgIH0sXHJcbiAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xyXG4gICAgfSxcclxuICAgIGlzT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqO1xyXG4gICAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcclxuICAgIH0sXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgaWYgKCFvYmopIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF8uaXNBcnJheShvYmopKSB7XHJcbiAgICAgICAgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoaXNBcnJheUxpa2Uob2JqKSkge1xyXG4gICAgICAgIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xyXG4gICAgfSxcclxuICAgIHJhbmdlOiBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xyXG4gICAgICBpZiAoc3RvcCA9PSBudWxsKSB7XHJcbiAgICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XHJcbiAgICAgICAgc3RhcnQgPSAwO1xyXG4gICAgICB9XHJcbiAgICAgIHN0ZXAgPSBzdGVwIHx8IDE7XHJcblxyXG4gICAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xyXG4gICAgICB2YXIgcmFuZ2UgPSBBcnJheShsZW5ndGgpO1xyXG5cclxuICAgICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgbGVuZ3RoOyBpZHgrKywgc3RhcnQgKz0gc3RlcCkge1xyXG4gICAgICAgIHJhbmdlW2lkeF0gPSBzdGFydDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHJhbmdlO1xyXG4gICAgfSxcclxuICAgIGluZGV4T2Y6IGZ1bmN0aW9uKGxpc3QsIGl0ZW0pIHtcclxuICAgICAgaWYgKCEhXy5uYXR1cmFsLmluZGV4T2YpIHtcclxuICAgICAgICByZXR1cm4gXy5uYXR1cmFsLmluZGV4T2YuY2FsbChsaXN0LCBpdGVtKTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAobGlzdFtpXSA9PT0gaXRlbSkge1xyXG4gICAgICAgICAgcmV0dXJuIGk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAtMTtcclxuICAgIH0sXHJcbiAgICBoYXM6IGZ1bmN0aW9uKG9iaiwga2V5KSB7XHJcbiAgICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcclxuICAgIH0sXHJcbiAgICBiaW5kOiBmdW5jdGlvbihmdW5jLCBjdHgpIHtcclxuICAgICAgdmFyIG5hdHVyYWwgPSBfLm5hdHVyYWwuYmluZDtcclxuICAgICAgaWYgKG5hdHVyYWwgJiYgZnVuYy5iaW5kID09PSBuYXR1cmFsKSB7XHJcbiAgICAgICAgcmV0dXJuIG5hdHVyYWwuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcclxuICAgICAgfVxyXG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGZ1bmMuYXBwbHkoY3R4LCBhcmdzKTtcclxuICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBleHRlbmQ6IGZ1bmN0aW9uKGJhc2UpIHtcclxuICAgICAgdmFyIHNvdXJjZXMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBvYmogPSBzb3VyY2VzW2ldO1xyXG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XHJcbiAgICAgICAgICBiYXNlW2tdID0gb2JqW2tdO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYmFzZTtcclxuICAgIH0sXHJcbiAgICBkZWZhdWx0czogZnVuY3Rpb24oYmFzZSkge1xyXG4gICAgICB2YXIgc291cmNlcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIG9iaiA9IHNvdXJjZXNbaV07XHJcbiAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcclxuICAgICAgICAgIGlmIChiYXNlW2tdID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgYmFzZVtrXSA9IG9ialtrXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGJhc2U7XHJcbiAgICB9LFxyXG4gICAga2V5czogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIGlmICghXy5pc09iamVjdChvYmopKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChfLm5hdHVyYWwua2V5cykge1xyXG4gICAgICAgIHJldHVybiBfLm5hdHVyYWwua2V5cyhvYmopO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBrZXlzID0gW107XHJcbiAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XHJcbiAgICAgICAgaWYgKF8uaGFzKG9iaiwgaykpIHtcclxuICAgICAgICAgIGtleXMucHVzaChrKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGtleXM7XHJcbiAgICB9LFxyXG4gICAgdmFsdWVzOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcclxuICAgICAgdmFyIHZhbHVlcyA9IFtdO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgayA9IGtleXNbaV07XHJcbiAgICAgICAgdmFsdWVzLnB1c2gob2JqW2tdKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgfSxcclxuICAgIGVhY2g6IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcclxuICAgICAgdmFyIGN0eCA9IGNvbnRleHQgfHwgdGhpcztcclxuICAgICAgdmFyIGtleXMgPSAhaXNBcnJheUxpa2Uob2JqKSAmJiBfLmtleXMob2JqKTtcclxuICAgICAgdmFyIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGsgPSBrZXlzID8ga2V5c1tpXSA6IGk7XHJcbiAgICAgICAgaXRlcmF0ZWUuY2FsbChjdHgsIG9ialtrXSwgaywgb2JqKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gb2JqO1xyXG4gICAgfSxcclxuICAgIG1hcDogZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xyXG4gICAgICB2YXIgY3R4ID0gY29udGV4dCB8fCB0aGlzO1xyXG4gICAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopO1xyXG4gICAgICB2YXIgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGg7XHJcbiAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBrID0ga2V5cyA/IGtleXNbaV0gOiBpO1xyXG4gICAgICAgIHJlc3VsdFtpXSA9IGl0ZXJhdGVlLmNhbGwoY3R4LCBvYmpba10sIGssIG9iaik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcbiAgICBvbmNlOiBmdW5jdGlvbihmdW5jKSB7XHJcbiAgICAgIHZhciBpbml0ID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoISFpbml0KSB7XHJcbiAgICAgICAgICByZXR1cm4gZnVuYztcclxuICAgICAgICB9XHJcbiAgICAgICAgaW5pdCA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGFmdGVyOiBmdW5jdGlvbih0aW1lcywgZnVuYykge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgd2hpbGUgKC0tdGltZXMgPCAxKSB7XHJcbiAgICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHVuaXF1ZUlkOiBmdW5jdGlvbihwcmVmaXgpIHtcclxuICAgICAgdmFyIGlkID0gKytfLl9pbmRleEFtb3VudCArICcnO1xyXG4gICAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDb25zdGFudHNcclxuICAgKi9cclxuXHJcbiAgdmFyIHNpbiA9IE1hdGguc2luLFxyXG4gICAgY29zID0gTWF0aC5jb3MsXHJcbiAgICBhdGFuMiA9IE1hdGguYXRhbjIsXHJcbiAgICBzcXJ0ID0gTWF0aC5zcXJ0LFxyXG4gICAgcm91bmQgPSBNYXRoLnJvdW5kLFxyXG4gICAgYWJzID0gTWF0aC5hYnMsXHJcbiAgICBQSSA9IE1hdGguUEksXHJcbiAgICBUV09fUEkgPSBQSSAqIDIsXHJcbiAgICBIQUxGX1BJID0gUEkgLyAyLFxyXG4gICAgcG93ID0gTWF0aC5wb3csXHJcbiAgICBtaW4gPSBNYXRoLm1pbixcclxuICAgIG1heCA9IE1hdGgubWF4O1xyXG5cclxuICAvKipcclxuICAgKiBMb2NhbGl6ZWQgdmFyaWFibGVzXHJcbiAgICovXHJcblxyXG4gIHZhciBjb3VudCA9IDA7XHJcbiAgdmFyIHNsaWNlID0gXy5uYXR1cmFsLnNsaWNlO1xyXG4gIHZhciBwZXJmID0gKChyb290LnBlcmZvcm1hbmNlICYmIHJvb3QucGVyZm9ybWFuY2Uubm93KSA/IHJvb3QucGVyZm9ybWFuY2UgOiBEYXRlKTtcclxuICB2YXIgTUFYX0FSUkFZX0lOREVYID0gTWF0aC5wb3coMiwgNTMpIC0gMTtcclxuICB2YXIgZ2V0TGVuZ3RoID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICByZXR1cm4gb2JqID09IG51bGwgPyB2b2lkIDAgOiBvYmpbJ2xlbmd0aCddO1xyXG4gIH07XHJcbiAgdmFyIGlzQXJyYXlMaWtlID0gZnVuY3Rpb24oY29sbGVjdGlvbikge1xyXG4gICAgdmFyIGxlbmd0aCA9IGdldExlbmd0aChjb2xsZWN0aW9uKTtcclxuICAgIHJldHVybiB0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInICYmIGxlbmd0aCA+PSAwICYmIGxlbmd0aCA8PSBNQVhfQVJSQVlfSU5ERVg7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3Jvc3MgYnJvd3NlciBkb20gZXZlbnRzLlxyXG4gICAqL1xyXG4gIHZhciBkb20gPSB7XHJcblxyXG4gICAgdGVtcDogKHJvb3QuZG9jdW1lbnQgPyByb290LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpIDoge30pLFxyXG5cclxuICAgIGhhc0V2ZW50TGlzdGVuZXJzOiBfLmlzRnVuY3Rpb24ocm9vdC5hZGRFdmVudExpc3RlbmVyKSxcclxuXHJcbiAgICBiaW5kOiBmdW5jdGlvbihlbGVtLCBldmVudCwgZnVuYywgYm9vbCkge1xyXG4gICAgICBpZiAodGhpcy5oYXNFdmVudExpc3RlbmVycykge1xyXG4gICAgICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZnVuYywgISFib29sKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuYyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGRvbTtcclxuICAgIH0sXHJcblxyXG4gICAgdW5iaW5kOiBmdW5jdGlvbihlbGVtLCBldmVudCwgZnVuYywgYm9vbCkge1xyXG4gICAgICBpZiAoZG9tLmhhc0V2ZW50TGlzdGVuZXJzKSB7XHJcbiAgICAgICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVycyhldmVudCwgZnVuYywgISFib29sKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBlbGVtLmRldGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuYyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGRvbTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UmVxdWVzdEFuaW1hdGlvbkZyYW1lOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBsYXN0VGltZSA9IDA7XHJcbiAgICAgIHZhciB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcclxuICAgICAgdmFyIHJlcXVlc3QgPSByb290LnJlcXVlc3RBbmltYXRpb25GcmFtZSwgY2FuY2VsO1xyXG5cclxuICAgICAgaWYoIXJlcXVlc3QpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHJlcXVlc3QgPSByb290W3ZlbmRvcnNbaV0gKyAnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10gfHwgcmVxdWVzdDtcclxuICAgICAgICAgIGNhbmNlbCA9IHJvb3RbdmVuZG9yc1tpXSArICdDYW5jZWxBbmltYXRpb25GcmFtZSddXHJcbiAgICAgICAgICAgIHx8IHJvb3RbdmVuZG9yc1tpXSArICdDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSB8fCBjYW5jZWw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXF1ZXN0ID0gcmVxdWVzdCB8fCBmdW5jdGlvbihjYWxsYmFjaywgZWxlbWVudCkge1xyXG4gICAgICAgICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICB2YXIgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKTtcclxuICAgICAgICAgIHZhciBpZCA9IHJvb3Quc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSwgdGltZVRvQ2FsbCk7XHJcbiAgICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcclxuICAgICAgICAgIHJldHVybiBpZDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIGNhbmNlbCA9IGNhbmNlbCB8fCBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgIC8vICAgY2xlYXJUaW1lb3V0KGlkKTtcclxuICAgICAgICAvLyB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXF1ZXN0LmluaXQgPSBfLm9uY2UobG9vcCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVxdWVzdDtcclxuXHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBjbGFzc1xyXG4gICAqL1xyXG4gIHZhciBUd28gPSByb290LlR3byA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgd2hhdCBSZW5kZXJlciB0byB1c2UgYW5kIHNldHVwIGEgc2NlbmUuXHJcblxyXG4gICAgdmFyIHBhcmFtcyA9IF8uZGVmYXVsdHMob3B0aW9ucyB8fCB7fSwge1xyXG4gICAgICBmdWxsc2NyZWVuOiBmYWxzZSxcclxuICAgICAgd2lkdGg6IDY0MCxcclxuICAgICAgaGVpZ2h0OiA0ODAsXHJcbiAgICAgIHR5cGU6IFR3by5UeXBlcy5zdmcsXHJcbiAgICAgIGF1dG9zdGFydDogZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIF8uZWFjaChwYXJhbXMsIGZ1bmN0aW9uKHYsIGspIHtcclxuICAgICAgaWYgKGsgPT09ICdmdWxsc2NyZWVuJyB8fCBrID09PSAnYXV0b3N0YXJ0Jykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB0aGlzW2tdID0gdjtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIC8vIFNwZWNpZmllZCBkb21FbGVtZW50IG92ZXJyaWRlcyB0eXBlIGRlY2xhcmF0aW9uIG9ubHkgaWYgdGhlIGVsZW1lbnQgZG9lcyBub3Qgc3VwcG9ydCBkZWNsYXJlZCByZW5kZXJlciB0eXBlLlxyXG4gICAgaWYgKF8uaXNFbGVtZW50KHBhcmFtcy5kb21FbGVtZW50KSkge1xyXG4gICAgICB2YXIgdGFnTmFtZSA9IHBhcmFtcy5kb21FbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgLy8gVE9ETzogUmVjb25zaWRlciB0aGlzIGlmIHN0YXRlbWVudCdzIGxvZ2ljLlxyXG4gICAgICBpZiAoIS9eKENhbnZhc1JlbmRlcmVyLWNhbnZhc3xXZWJHTFJlbmRlcmVyLWNhbnZhc3xTVkdSZW5kZXJlci1zdmcpJC8udGVzdCh0aGlzLnR5cGUrJy0nK3RhZ05hbWUpKSB7XHJcbiAgICAgICAgdGhpcy50eXBlID0gVHdvLlR5cGVzW3RhZ05hbWVdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yZW5kZXJlciA9IG5ldyBUd29bdGhpcy50eXBlXSh0aGlzKTtcclxuICAgIFR3by5VdGlscy5zZXRQbGF5aW5nLmNhbGwodGhpcywgcGFyYW1zLmF1dG9zdGFydCk7XHJcbiAgICB0aGlzLmZyYW1lQ291bnQgPSAwO1xyXG5cclxuICAgIGlmIChwYXJhbXMuZnVsbHNjcmVlbikge1xyXG5cclxuICAgICAgdmFyIGZpdHRlZCA9IF8uYmluZChmaXRUb1dpbmRvdywgdGhpcyk7XHJcbiAgICAgIF8uZXh0ZW5kKGRvY3VtZW50LmJvZHkuc3R5bGUsIHtcclxuICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXHJcbiAgICAgICAgbWFyZ2luOiAwLFxyXG4gICAgICAgIHBhZGRpbmc6IDAsXHJcbiAgICAgICAgdG9wOiAwLFxyXG4gICAgICAgIGxlZnQ6IDAsXHJcbiAgICAgICAgcmlnaHQ6IDAsXHJcbiAgICAgICAgYm90dG9tOiAwLFxyXG4gICAgICAgIHBvc2l0aW9uOiAnZml4ZWQnXHJcbiAgICAgIH0pO1xyXG4gICAgICBfLmV4dGVuZCh0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQuc3R5bGUsIHtcclxuICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxyXG4gICAgICAgIHRvcDogMCxcclxuICAgICAgICBsZWZ0OiAwLFxyXG4gICAgICAgIHJpZ2h0OiAwLFxyXG4gICAgICAgIGJvdHRvbTogMCxcclxuICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJ1xyXG4gICAgICB9KTtcclxuICAgICAgZG9tLmJpbmQocm9vdCwgJ3Jlc2l6ZScsIGZpdHRlZCk7XHJcbiAgICAgIGZpdHRlZCgpO1xyXG5cclxuXHJcbiAgICB9IGVsc2UgaWYgKCFfLmlzRWxlbWVudChwYXJhbXMuZG9tRWxlbWVudCkpIHtcclxuXHJcbiAgICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZShwYXJhbXMud2lkdGgsIHBhcmFtcy5oZWlnaHQsIHRoaXMucmF0aW8pO1xyXG4gICAgICB0aGlzLndpZHRoID0gcGFyYW1zLndpZHRoO1xyXG4gICAgICB0aGlzLmhlaWdodCA9IHBhcmFtcy5oZWlnaHQ7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2NlbmUgPSB0aGlzLnJlbmRlcmVyLnNjZW5lO1xyXG5cclxuICAgIFR3by5JbnN0YW5jZXMucHVzaCh0aGlzKTtcclxuICAgIHJhZi5pbml0KCk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFR3bywge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWNjZXNzIHRvIHJvb3QgaW4gb3RoZXIgZmlsZXMuXHJcbiAgICAgKi9cclxuXHJcbiAgICByb290OiByb290LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUHJpbWl0aXZlXHJcbiAgICAgKi9cclxuXHJcbiAgICBBcnJheTogcm9vdC5GbG9hdDMyQXJyYXkgfHwgQXJyYXksXHJcblxyXG4gICAgVHlwZXM6IHtcclxuICAgICAgd2ViZ2w6ICdXZWJHTFJlbmRlcmVyJyxcclxuICAgICAgc3ZnOiAnU1ZHUmVuZGVyZXInLFxyXG4gICAgICBjYW52YXM6ICdDYW52YXNSZW5kZXJlcidcclxuICAgIH0sXHJcblxyXG4gICAgVmVyc2lvbjogJ3YwLjcuMC1hbHBoYS4xJyxcclxuXHJcbiAgICBJZGVudGlmaWVyOiAndHdvXycsXHJcblxyXG4gICAgUHJvcGVydGllczoge1xyXG4gICAgICBoaWVyYXJjaHk6ICdoaWVyYXJjaHknLFxyXG4gICAgICBkZW1vdGlvbjogJ2RlbW90aW9uJ1xyXG4gICAgfSxcclxuXHJcbiAgICBFdmVudHM6IHtcclxuICAgICAgcGxheTogJ3BsYXknLFxyXG4gICAgICBwYXVzZTogJ3BhdXNlJyxcclxuICAgICAgdXBkYXRlOiAndXBkYXRlJyxcclxuICAgICAgcmVuZGVyOiAncmVuZGVyJyxcclxuICAgICAgcmVzaXplOiAncmVzaXplJyxcclxuICAgICAgY2hhbmdlOiAnY2hhbmdlJyxcclxuICAgICAgcmVtb3ZlOiAncmVtb3ZlJyxcclxuICAgICAgaW5zZXJ0OiAnaW5zZXJ0JyxcclxuICAgICAgb3JkZXI6ICdvcmRlcicsXHJcbiAgICAgIGxvYWQ6ICdsb2FkJ1xyXG4gICAgfSxcclxuXHJcbiAgICBDb21tYW5kczoge1xyXG4gICAgICBtb3ZlOiAnTScsXHJcbiAgICAgIGxpbmU6ICdMJyxcclxuICAgICAgY3VydmU6ICdDJyxcclxuICAgICAgY2xvc2U6ICdaJ1xyXG4gICAgfSxcclxuXHJcbiAgICBSZXNvbHV0aW9uOiA4LFxyXG5cclxuICAgIEluc3RhbmNlczogW10sXHJcblxyXG4gICAgbm9Db25mbGljdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJvb3QuVHdvID0gcHJldmlvdXNUd287XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICB1bmlxdWVJZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBpZCA9IGNvdW50O1xyXG4gICAgICBjb3VudCsrO1xyXG4gICAgICByZXR1cm4gaWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIFV0aWxzOiBfLmV4dGVuZChfLCB7XHJcblxyXG4gICAgICBwZXJmb3JtYW5jZTogcGVyZixcclxuXHJcbiAgICAgIGRlZmluZVByb3BlcnR5OiBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG5cclxuICAgICAgICB2YXIgb2JqZWN0ID0gdGhpcztcclxuICAgICAgICB2YXIgc2VjcmV0ID0gJ18nICsgcHJvcGVydHk7XHJcbiAgICAgICAgdmFyIGZsYWcgPSAnX2ZsYWcnICsgcHJvcGVydHkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wZXJ0eS5zbGljZSgxKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgcHJvcGVydHksIHtcclxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1tzZWNyZXRdO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgICB0aGlzW3NlY3JldF0gPSB2O1xyXG4gICAgICAgICAgICB0aGlzW2ZsYWddID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmVsZWFzZSBhbiBhcmJpdHJhcnkgY2xhc3MnIGV2ZW50cyBmcm9tIHRoZSB0d28uanMgY29ycHVzIGFuZCByZWN1cnNlXHJcbiAgICAgICAqIHRocm91Z2ggaXRzIGNoaWxkcmVuIGFuZCBvciB2ZXJ0aWNlcy5cclxuICAgICAgICovXHJcbiAgICAgIHJlbGVhc2U6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmoudW5iaW5kKSkge1xyXG4gICAgICAgICAgb2JqLnVuYmluZCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9iai52ZXJ0aWNlcykge1xyXG4gICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmoudmVydGljZXMudW5iaW5kKSkge1xyXG4gICAgICAgICAgICBvYmoudmVydGljZXMudW5iaW5kKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBfLmVhY2gob2JqLnZlcnRpY2VzLCBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odi51bmJpbmQpKSB7XHJcbiAgICAgICAgICAgICAgdi51bmJpbmQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob2JqLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICBfLmVhY2gob2JqLmNoaWxkcmVuLCBmdW5jdGlvbihvYmopIHtcclxuICAgICAgICAgICAgVHdvLlV0aWxzLnJlbGVhc2Uob2JqKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICB4aHI6IGZ1bmN0aW9uKHBhdGgsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICB4aHIub3BlbignR0VUJywgcGF0aCk7XHJcblxyXG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCAmJiB4aHIuc3RhdHVzID09PSAyMDApIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soeGhyLnJlc3BvbnNlVGV4dCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgeGhyLnNlbmQoKTtcclxuICAgICAgICByZXR1cm4geGhyO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIEN1cnZlOiB7XHJcblxyXG4gICAgICAgIENvbGxpbmVhcml0eUVwc2lsb246IHBvdygxMCwgLTMwKSxcclxuXHJcbiAgICAgICAgUmVjdXJzaW9uTGltaXQ6IDE2LFxyXG5cclxuICAgICAgICBDdXNwTGltaXQ6IDAsXHJcblxyXG4gICAgICAgIFRvbGVyYW5jZToge1xyXG4gICAgICAgICAgZGlzdGFuY2U6IDAuMjUsXHJcbiAgICAgICAgICBhbmdsZTogMCxcclxuICAgICAgICAgIGVwc2lsb246IDAuMDFcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvLyBMb29rdXAgdGFibGVzIGZvciBhYnNjaXNzYXMgYW5kIHdlaWdodHMgd2l0aCB2YWx1ZXMgZm9yIG4gPSAyIC4uIDE2LlxyXG4gICAgICAgIC8vIEFzIHZhbHVlcyBhcmUgc3ltbWV0cmljLCBvbmx5IHN0b3JlIGhhbGYgb2YgdGhlbSBhbmQgYWRhcHQgYWxnb3JpdGhtXHJcbiAgICAgICAgLy8gdG8gZmFjdG9yIGluIHN5bW1ldHJ5LlxyXG4gICAgICAgIGFic2Npc3NhczogW1xyXG4gICAgICAgICAgWyAgMC41NzczNTAyNjkxODk2MjU3NjQ1MDkxNDg4XSxcclxuICAgICAgICAgIFswLDAuNzc0NTk2NjY5MjQxNDgzMzc3MDM1ODUzMV0sXHJcbiAgICAgICAgICBbICAwLjMzOTk4MTA0MzU4NDg1NjI2NDgwMjY2NTgsMC44NjExMzYzMTE1OTQwNTI1NzUyMjM5NDY1XSxcclxuICAgICAgICAgIFswLDAuNTM4NDY5MzEwMTA1NjgzMDkxMDM2MzE0NCwwLjkwNjE3OTg0NTkzODY2Mzk5Mjc5NzYyNjldLFxyXG4gICAgICAgICAgWyAgMC4yMzg2MTkxODYwODMxOTY5MDg2MzA1MDE3LDAuNjYxMjA5Mzg2NDY2MjY0NTEzNjYxMzk5NiwwLjkzMjQ2OTUxNDIwMzE1MjAyNzgxMjMwMTZdLFxyXG4gICAgICAgICAgWzAsMC40MDU4NDUxNTEzNzczOTcxNjY5MDY2MDY0LDAuNzQxNTMxMTg1NTk5Mzk0NDM5ODYzODY0OCwwLjk0OTEwNzkxMjM0Mjc1ODUyNDUyNjE4OTddLFxyXG4gICAgICAgICAgWyAgMC4xODM0MzQ2NDI0OTU2NDk4MDQ5Mzk0NzYxLDAuNTI1NTMyNDA5OTE2MzI4OTg1ODE3NzM5MCwwLjc5NjY2NjQ3NzQxMzYyNjczOTU5MTU1MzksMC45NjAyODk4NTY0OTc1MzYyMzE2ODM1NjA5XSxcclxuICAgICAgICAgIFswLDAuMzI0MjUzNDIzNDAzODA4OTI5MDM4NTM4MCwwLjYxMzM3MTQzMjcwMDU5MDM5NzMwODcwMjAsMC44MzYwMzExMDczMjY2MzU3OTQyOTk0Mjk4LDAuOTY4MTYwMjM5NTA3NjI2MDg5ODM1NTc2Ml0sXHJcbiAgICAgICAgICBbICAwLjE0ODg3NDMzODk4MTYzMTIxMDg4NDgyNjAsMC40MzMzOTUzOTQxMjkyNDcxOTA3OTkyNjU5LDAuNjc5NDA5NTY4Mjk5MDI0NDA2MjM0MzI3NCwwLjg2NTA2MzM2NjY4ODk4NDUxMDczMjA5NjcsMC45NzM5MDY1Mjg1MTcxNzE3MjAwNzc5NjQwXSxcclxuICAgICAgICAgIFswLDAuMjY5NTQzMTU1OTUyMzQ0OTcyMzMxNTMyMCwwLjUxOTA5NjEyOTIwNjgxMTgxNTkyNTcyNTcsMC43MzAxNTIwMDU1NzQwNDkzMjQwOTM0MTYzLDAuODg3MDYyNTk5NzY4MDk1Mjk5MDc1MTU3OCwwLjk3ODIyODY1ODE0NjA1Njk5MjgwMzkzODBdLFxyXG4gICAgICAgICAgWyAgMC4xMjUyMzM0MDg1MTE0Njg5MTU0NzI0NDE0LDAuMzY3ODMxNDk4OTk4MTgwMTkzNzUyNjkxNSwwLjU4NzMxNzk1NDI4NjYxNzQ0NzI5NjcwMjQsMC43Njk5MDI2NzQxOTQzMDQ2ODcwMzY4OTM4LDAuOTA0MTE3MjU2MzcwNDc0ODU2Njc4NDY1OSwwLjk4MTU2MDYzNDI0NjcxOTI1MDY5MDU0OTFdLFxyXG4gICAgICAgICAgWzAsMC4yMzA0NTgzMTU5NTUxMzQ3OTQwNjU1MjgxLDAuNDQ4NDkyNzUxMDM2NDQ2ODUyODc3OTEyOSwwLjY0MjM0OTMzOTQ0MDM0MDIyMDY0Mzk4NDYsMC44MDE1NzgwOTA3MzMzMDk5MTI3OTQyMDY1LDAuOTE3NTk4Mzk5MjIyOTc3OTY1MjA2NTQ3OCwwLjk4NDE4MzA1NDcxODU4ODE0OTQ3MjgyOTRdLFxyXG4gICAgICAgICAgWyAgMC4xMDgwNTQ5NDg3MDczNDM2NjIwNjYyNDQ3LDAuMzE5MTEyMzY4OTI3ODg5NzYwNDM1NjcxOCwwLjUxNTI0ODYzNjM1ODE1NDA5MTk2NTI5MDcsMC42ODcyOTI5MDQ4MTE2ODU0NzAxNDgwMTk4LDAuODI3MjAxMzE1MDY5NzY0OTkzMTg5Nzk0NywwLjkyODQzNDg4MzY2MzU3MzUxNzMzNjM5MTEsMC45ODYyODM4MDg2OTY4MTIzMzg4NDE1OTczXSxcclxuICAgICAgICAgIFswLDAuMjAxMTk0MDkzOTk3NDM0NTIyMzAwNjI4MywwLjM5NDE1MTM0NzA3NzU2MzM2OTg5NzIwNzQsMC41NzA5NzIxNzI2MDg1Mzg4NDc1MzcyMjY3LDAuNzI0NDE3NzMxMzYwMTcwMDQ3NDE2MTg2MSwwLjg0ODIwNjU4MzQxMDQyNzIxNjIwMDY0ODMsMC45MzcyNzMzOTI0MDA3MDU5MDQzMDc3NTg5LDAuOTg3OTkyNTE4MDIwNDg1NDI4NDg5NTY1N10sXHJcbiAgICAgICAgICBbICAwLjA5NTAxMjUwOTgzNzYzNzQ0MDE4NTMxOTMsMC4yODE2MDM1NTA3NzkyNTg5MTMyMzA0NjA1LDAuNDU4MDE2Nzc3NjU3MjI3Mzg2MzQyNDE5NCwwLjYxNzg3NjI0NDQwMjY0Mzc0ODQ0NjY3MTgsMC43NTU0MDQ0MDgzNTUwMDMwMzM4OTUxMDEyLDAuODY1NjMxMjAyMzg3ODMxNzQzODgwNDY3OSwwLjk0NDU3NTAyMzA3MzIzMjU3NjA3Nzk4ODQsMC45ODk0MDA5MzQ5OTE2NDk5MzI1OTYxNTQyXVxyXG4gICAgICAgIF0sXHJcblxyXG4gICAgICAgIHdlaWdodHM6IFtcclxuICAgICAgICAgIFsxXSxcclxuICAgICAgICAgIFswLjg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODksMC41NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU2XSxcclxuICAgICAgICAgIFswLjY1MjE0NTE1NDg2MjU0NjE0MjYyNjkzNjEsMC4zNDc4NTQ4NDUxMzc0NTM4NTczNzMwNjM5XSxcclxuICAgICAgICAgIFswLjU2ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODksMC40Nzg2Mjg2NzA0OTkzNjY0NjgwNDEyOTE1LDAuMjM2OTI2ODg1MDU2MTg5MDg3NTE0MjY0MF0sXHJcbiAgICAgICAgICBbMC40Njc5MTM5MzQ1NzI2OTEwNDczODk4NzAzLDAuMzYwNzYxNTczMDQ4MTM4NjA3NTY5ODMzNSwwLjE3MTMyNDQ5MjM3OTE3MDM0NTA0MDI5NjFdLFxyXG4gICAgICAgICAgWzAuNDE3OTU5MTgzNjczNDY5Mzg3NzU1MTAyMCwwLjM4MTgzMDA1MDUwNTExODk0NDk1MDM2OTgsMC4yNzk3MDUzOTE0ODkyNzY2Njc5MDE0Njc4LDAuMTI5NDg0OTY2MTY4ODY5NjkzMjcwNjExNF0sXHJcbiAgICAgICAgICBbMC4zNjI2ODM3ODMzNzgzNjE5ODI5NjUxNTA0LDAuMzEzNzA2NjQ1ODc3ODg3Mjg3MzM3OTYyMiwwLjIyMjM4MTAzNDQ1MzM3NDQ3MDU0NDM1NjAsMC4xMDEyMjg1MzYyOTAzNzYyNTkxNTI1MzE0XSxcclxuICAgICAgICAgIFswLjMzMDIzOTM1NTAwMTI1OTc2MzE2NDUyNTEsMC4zMTIzNDcwNzcwNDAwMDI4NDAwNjg2MzA0LDAuMjYwNjEwNjk2NDAyOTM1NDYyMzE4NzQyOSwwLjE4MDY0ODE2MDY5NDg1NzQwNDA1ODQ3MjAsMC4wODEyNzQzODgzNjE1NzQ0MTE5NzE4OTIyXSxcclxuICAgICAgICAgIFswLjI5NTUyNDIyNDcxNDc1Mjg3MDE3Mzg5MzAsMC4yNjkyNjY3MTkzMDk5OTYzNTUwOTEyMjY5LDAuMjE5MDg2MzYyNTE1OTgyMDQzOTk1NTM0OSwwLjE0OTQ1MTM0OTE1MDU4MDU5MzE0NTc3NjMsMC4wNjY2NzEzNDQzMDg2ODgxMzc1OTM1Njg4XSxcclxuICAgICAgICAgIFswLjI3MjkyNTA4Njc3NzkwMDYzMDcxNDQ4MzUsMC4yNjI4MDQ1NDQ1MTAyNDY2NjIxODA2ODg5LDAuMjMzMTkzNzY0NTkxOTkwNDc5OTE4NTIzNywwLjE4NjI5MDIxMDkyNzczNDI1MTQyNjA5NzYsMC4xMjU1ODAzNjk0NjQ5MDQ2MjQ2MzQ2OTQzLDAuMDU1NjY4NTY3MTE2MTczNjY2NDgyNzUzN10sXHJcbiAgICAgICAgICBbMC4yNDkxNDcwNDU4MTM0MDI3ODUwMDA1NjI0LDAuMjMzNDkyNTM2NTM4MzU0ODA4NzYwODQ5OSwwLjIwMzE2NzQyNjcyMzA2NTkyMTc0OTA2NDUsMC4xNjAwNzgzMjg1NDMzNDYyMjYzMzQ2NTI1LDAuMTA2OTM5MzI1OTk1MzE4NDMwOTYwMjU0NywwLjA0NzE3NTMzNjM4NjUxMTgyNzE5NDYxNjBdLFxyXG4gICAgICAgICAgWzAuMjMyNTUxNTUzMjMwODczOTEwMTk0NTg5NSwwLjIyNjI4MzE4MDI2Mjg5NzIzODQxMjA5MDIsMC4yMDc4MTYwNDc1MzY4ODg1MDIzMTI1MjMyLDAuMTc4MTQ1OTgwNzYxOTQ1NzM4MjgwMDQ2NywwLjEzODg3MzUxMDIxOTc4NzIzODQ2MzYwMTgsMC4wOTIxMjE0OTk4Mzc3Mjg0NDc5MTQ0MjE4LDAuMDQwNDg0MDA0NzY1MzE1ODc5NTIwMDIxNl0sXHJcbiAgICAgICAgICBbMC4yMTUyNjM4NTM0NjMxNTc3OTAxOTU4NzY0LDAuMjA1MTk4NDYzNzIxMjk1NjAzOTY1OTI0MSwwLjE4NTUzODM5NzQ3NzkzNzgxMzc0MTcxNjYsMC4xNTcyMDMxNjcxNTgxOTM1MzQ1Njk2MDE5LDAuMTIxNTE4NTcwNjg3OTAzMTg0Njg5NDE0OCwwLjA4MDE1ODA4NzE1OTc2MDIwOTgwNTYzMzMsMC4wMzUxMTk0NjAzMzE3NTE4NjMwMzE4MzI5XSxcclxuICAgICAgICAgIFswLjIwMjU3ODI0MTkyNTU2MTI3Mjg4MDYyMDIsMC4xOTg0MzE0ODUzMjcxMTE1NzY0NTYxMTgzLDAuMTg2MTYxMDAwMDE1NTYyMjExMDI2ODAwNiwwLjE2NjI2OTIwNTgxNjk5MzkzMzU1MzIwMDksMC4xMzk1NzA2Nzc5MjYxNTQzMTQ0NDc4MDQ4LDAuMTA3MTU5MjIwNDY3MTcxOTM1MDExODY5NSwwLjA3MDM2NjA0NzQ4ODEwODEyNDcwOTI2NzQsMC4wMzA3NTMyNDE5OTYxMTcyNjgzNTQ2Mjg0XSxcclxuICAgICAgICAgIFswLjE4OTQ1MDYxMDQ1NTA2ODQ5NjI4NTM5NjcsMC4xODI2MDM0MTUwNDQ5MjM1ODg4NjY3NjM3LDAuMTY5MTU2NTE5Mzk1MDAyNTM4MTg5MzEyMSwwLjE0OTU5NTk4ODgxNjU3NjczMjA4MTUwMTcsMC4xMjQ2Mjg5NzEyNTU1MzM4NzIwNTI0NzYzLDAuMDk1MTU4NTExNjgyNDkyNzg0ODA5OTI1MSwwLjA2MjI1MzUyMzkzODY0Nzg5Mjg2Mjg0MzgsMC4wMjcxNTI0NTk0MTE3NTQwOTQ4NTE3ODA2XVxyXG4gICAgICAgIF1cclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQWNjb3VudCBmb3IgaGlnaCBkcGkgcmVuZGVyaW5nLlxyXG4gICAgICAgKiBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9jYW52YXMvaGlkcGkvXHJcbiAgICAgICAqL1xyXG5cclxuICAgICAgZGV2aWNlUGl4ZWxSYXRpbzogcm9vdC5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXHJcblxyXG4gICAgICBnZXRCYWNraW5nU3RvcmVSYXRpbzogZnVuY3Rpb24oY3R4KSB7XHJcbiAgICAgICAgcmV0dXJuIGN0eC53ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICBjdHgubW96QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxyXG4gICAgICAgICAgY3R4Lm1zQmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fFxyXG4gICAgICAgICAgY3R4Lm9CYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICBjdHguYmFja2luZ1N0b3JlUGl4ZWxSYXRpbyB8fCAxO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgZ2V0UmF0aW86IGZ1bmN0aW9uKGN0eCkge1xyXG4gICAgICAgIHJldHVybiBUd28uVXRpbHMuZGV2aWNlUGl4ZWxSYXRpbyAvIGdldEJhY2tpbmdTdG9yZVJhdGlvKGN0eCk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUHJvcGVybHkgZGVmZXIgcGxheSBjYWxsaW5nIHVudGlsIGFmdGVyIGFsbCBvYmplY3RzXHJcbiAgICAgICAqIGhhdmUgYmVlbiB1cGRhdGVkIHdpdGggdGhlaXIgbmV3ZXN0IHN0eWxlcy5cclxuICAgICAgICovXHJcbiAgICAgIHNldFBsYXlpbmc6IGZ1bmN0aW9uKGIpIHtcclxuXHJcbiAgICAgICAgdGhpcy5wbGF5aW5nID0gISFiO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBSZXR1cm4gdGhlIGNvbXB1dGVkIG1hdHJpeCBvZiBhIG5lc3RlZCBvYmplY3QuXHJcbiAgICAgICAqIFRPRE86IE9wdGltaXplIHRyYXZlcnNhbC5cclxuICAgICAgICovXHJcbiAgICAgIGdldENvbXB1dGVkTWF0cml4OiBmdW5jdGlvbihvYmplY3QsIG1hdHJpeCkge1xyXG5cclxuICAgICAgICBtYXRyaXggPSAobWF0cml4ICYmIG1hdHJpeC5pZGVudGl0eSgpKSB8fCBuZXcgVHdvLk1hdHJpeCgpO1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBvYmplY3QsIG1hdHJpY2VzID0gW107XHJcblxyXG4gICAgICAgIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50Ll9tYXRyaXgpIHtcclxuICAgICAgICAgIG1hdHJpY2VzLnB1c2gocGFyZW50Ll9tYXRyaXgpO1xyXG4gICAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hdHJpY2VzLnJldmVyc2UoKTtcclxuXHJcbiAgICAgICAgXy5lYWNoKG1hdHJpY2VzLCBmdW5jdGlvbihtKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGUgPSBtLmVsZW1lbnRzO1xyXG4gICAgICAgICAgbWF0cml4Lm11bHRpcGx5KFxyXG4gICAgICAgICAgICBlWzBdLCBlWzFdLCBlWzJdLCBlWzNdLCBlWzRdLCBlWzVdLCBlWzZdLCBlWzddLCBlWzhdLCBlWzldKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBtYXRyaXg7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgZGVsdGFUcmFuc2Zvcm1Qb2ludDogZnVuY3Rpb24obWF0cml4LCB4LCB5KSB7XHJcblxyXG4gICAgICAgIHZhciBkeCA9IHggKiBtYXRyaXguYSArIHkgKiBtYXRyaXguYyArIDA7XHJcbiAgICAgICAgdmFyIGR5ID0geCAqIG1hdHJpeC5iICsgeSAqIG1hdHJpeC5kICsgMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBUd28uVmVjdG9yKGR4LCBkeSk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tLzIwNTIyNDdcclxuICAgICAgICovXHJcbiAgICAgIGRlY29tcG9zZU1hdHJpeDogZnVuY3Rpb24obWF0cml4KSB7XHJcblxyXG4gICAgICAgIC8vIGNhbGN1bGF0ZSBkZWx0YSB0cmFuc2Zvcm0gcG9pbnRcclxuICAgICAgICB2YXIgcHggPSBUd28uVXRpbHMuZGVsdGFUcmFuc2Zvcm1Qb2ludChtYXRyaXgsIDAsIDEpO1xyXG4gICAgICAgIHZhciBweSA9IFR3by5VdGlscy5kZWx0YVRyYW5zZm9ybVBvaW50KG1hdHJpeCwgMSwgMCk7XHJcblxyXG4gICAgICAgIC8vIGNhbGN1bGF0ZSBza2V3XHJcbiAgICAgICAgdmFyIHNrZXdYID0gKCgxODAgLyBNYXRoLlBJKSAqIE1hdGguYXRhbjIocHgueSwgcHgueCkgLSA5MCk7XHJcbiAgICAgICAgdmFyIHNrZXdZID0gKCgxODAgLyBNYXRoLlBJKSAqIE1hdGguYXRhbjIocHkueSwgcHkueCkpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0cmFuc2xhdGVYOiBtYXRyaXguZSxcclxuICAgICAgICAgICAgdHJhbnNsYXRlWTogbWF0cml4LmYsXHJcbiAgICAgICAgICAgIHNjYWxlWDogTWF0aC5zcXJ0KG1hdHJpeC5hICogbWF0cml4LmEgKyBtYXRyaXguYiAqIG1hdHJpeC5iKSxcclxuICAgICAgICAgICAgc2NhbGVZOiBNYXRoLnNxcnQobWF0cml4LmMgKiBtYXRyaXguYyArIG1hdHJpeC5kICogbWF0cml4LmQpLFxyXG4gICAgICAgICAgICBza2V3WDogc2tld1gsXHJcbiAgICAgICAgICAgIHNrZXdZOiBza2V3WSxcclxuICAgICAgICAgICAgcm90YXRpb246IHNrZXdYIC8vIHJvdGF0aW9uIGlzIHRoZSBzYW1lIGFzIHNrZXcgeFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFdhbGsgdGhyb3VnaCBpdGVtIHByb3BlcnRpZXMgYW5kIHBpY2sgdGhlIG9uZXMgb2YgaW50ZXJlc3QuXHJcbiAgICAgICAqIFdpbGwgdHJ5IHRvIHJlc29sdmUgc3R5bGVzIGFwcGxpZWQgdmlhIENTU1xyXG4gICAgICAgKlxyXG4gICAgICAgKiBUT0RPOiBSZXZlcnNlIGNhbGN1bGF0ZSBgVHdvLkdyYWRpZW50YHMgZm9yIGZpbGwgLyBzdHJva2VcclxuICAgICAgICogb2YgYW55IGdpdmVuIHBhdGguXHJcbiAgICAgICAqL1xyXG4gICAgICBhcHBseVN2Z0F0dHJpYnV0ZXM6IGZ1bmN0aW9uKG5vZGUsIGVsZW0pIHtcclxuXHJcbiAgICAgICAgdmFyIGF0dHJpYnV0ZXMgPSB7fSwgc3R5bGVzID0ge30sIGksIGtleSwgdmFsdWUsIGF0dHI7XHJcblxyXG4gICAgICAgIC8vIE5vdCBhdmFpbGFibGUgaW4gbm9uIGJyb3dzZXIgZW52aXJvbm1lbnRzXHJcbiAgICAgICAgaWYgKGdldENvbXB1dGVkU3R5bGUpIHtcclxuICAgICAgICAgIC8vIENvbnZlcnQgQ1NTU3R5bGVEZWNsYXJhdGlvbiB0byBhIG5vcm1hbCBvYmplY3RcclxuICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlcyA9IGdldENvbXB1dGVkU3R5bGUobm9kZSk7XHJcbiAgICAgICAgICBpID0gY29tcHV0ZWRTdHlsZXMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAga2V5ID0gY29tcHV0ZWRTdHlsZXNbaV07XHJcbiAgICAgICAgICAgIHZhbHVlID0gY29tcHV0ZWRTdHlsZXNba2V5XTtcclxuICAgICAgICAgICAgLy8gR2Vja28gcmV0dXJucyB1bmRlZmluZWQgZm9yIHVuc2V0IHByb3BlcnRpZXNcclxuICAgICAgICAgICAgLy8gV2Via2l0IHJldHVybnMgdGhlIGRlZmF1bHQgdmFsdWVcclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBzdHlsZXNba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb252ZXJ0IE5vZGVNYXAgdG8gYSBub3JtYWwgb2JqZWN0XHJcbiAgICAgICAgaSA9IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgYXR0ciA9IG5vZGUuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgIGF0dHJpYnV0ZXNbYXR0ci5ub2RlTmFtZV0gPSBhdHRyLnZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2V0dGluZyB0aGUgY29ycmVjdCBvcGFjaXR5IGlzIGEgYml0IHRyaWNreSwgc2luY2UgU1ZHIHBhdGggZWxlbWVudHMgZG9uJ3RcclxuICAgICAgICAvLyBzdXBwb3J0IG9wYWNpdHkgYXMgYW4gYXR0cmlidXRlLCBidXQgeW91IGNhbiBhcHBseSBpdCB2aWEgQ1NTLlxyXG4gICAgICAgIC8vIFNvIHdlIHRha2UgdGhlIG9wYWNpdHkgYW5kIHNldCAoc3Ryb2tlL2ZpbGwpLW9wYWNpdHkgdG8gdGhlIHNhbWUgdmFsdWUuXHJcbiAgICAgICAgaWYgKCFfLmlzVW5kZWZpbmVkKHN0eWxlcy5vcGFjaXR5KSkge1xyXG4gICAgICAgICAgc3R5bGVzWydzdHJva2Utb3BhY2l0eSddID0gc3R5bGVzLm9wYWNpdHk7XHJcbiAgICAgICAgICBzdHlsZXNbJ2ZpbGwtb3BhY2l0eSddID0gc3R5bGVzLm9wYWNpdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBNZXJnZSBhdHRyaWJ1dGVzIGFuZCBhcHBsaWVkIHN0eWxlcyAoYXR0cmlidXRlcyB0YWtlIHByZWNlZGVuY2UpXHJcbiAgICAgICAgXy5leHRlbmQoc3R5bGVzLCBhdHRyaWJ1dGVzKTtcclxuXHJcbiAgICAgICAgLy8gU2ltaWxhcmx5IHZpc2liaWxpdHkgaXMgaW5mbHVlbmNlZCBieSB0aGUgdmFsdWUgb2YgYm90aCBkaXNwbGF5IGFuZCB2aXNpYmlsaXR5LlxyXG4gICAgICAgIC8vIENhbGN1bGF0ZSBhIHVuaWZpZWQgdmFsdWUgaGVyZSB3aGljaCBkZWZhdWx0cyB0byBgdHJ1ZWAuXHJcbiAgICAgICAgc3R5bGVzLnZpc2libGUgPSAhKF8uaXNVbmRlZmluZWQoc3R5bGVzLmRpc3BsYXkpICYmIHN0eWxlcy5kaXNwbGF5ID09PSAnbm9uZScpXHJcbiAgICAgICAgICB8fCAoXy5pc1VuZGVmaW5lZChzdHlsZXMudmlzaWJpbGl0eSkgJiYgc3R5bGVzLnZpc2liaWxpdHkgPT09ICdoaWRkZW4nKTtcclxuXHJcbiAgICAgICAgLy8gTm93IGl0ZXJhdGUgdGhlIHdob2xlIHRoaW5nXHJcbiAgICAgICAgZm9yIChrZXkgaW4gc3R5bGVzKSB7XHJcbiAgICAgICAgICB2YWx1ZSA9IHN0eWxlc1trZXldO1xyXG5cclxuICAgICAgICAgIHN3aXRjaCAoa2V5KSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3RyYW5zZm9ybSc6XHJcbiAgICAgICAgICAgICAgLy8gVE9ETzogQ2hlY2sgdGhpcyBvdXQgaHR0cHM6Ly9naXRodWIuY29tL3BhcGVyanMvcGFwZXIuanMvYmxvYi9tYXN0ZXIvc3JjL3N2Zy9TVkdJbXBvcnQuanMjTDMxM1xyXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ25vbmUnKSBicmVhaztcclxuICAgICAgICAgICAgICB2YXIgbSA9IG5vZGUuZ2V0Q1RNID8gbm9kZS5nZXRDVE0oKSA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgIC8vIE1pZ2h0IGhhcHBlbiB3aGVuIHRyYW5zZm9ybSBzdHJpbmcgaXMgZW1wdHkgb3Igbm90IHZhbGlkLlxyXG4gICAgICAgICAgICAgIGlmIChtID09PSBudWxsKSBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgLy8gLy8gT3B0aW9uIDE6IGVkaXQgdGhlIHVuZGVybHlpbmcgbWF0cml4IGFuZCBkb24ndCBmb3JjZSBhbiBhdXRvIGNhbGMuXHJcbiAgICAgICAgICAgICAgLy8gdmFyIG0gPSBub2RlLmdldENUTSgpO1xyXG4gICAgICAgICAgICAgIC8vIGVsZW0uX21hdHJpeC5tYW51YWwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIC8vIGVsZW0uX21hdHJpeC5zZXQobS5hLCBtLmIsIG0uYywgbS5kLCBtLmUsIG0uZik7XHJcblxyXG4gICAgICAgICAgICAgIC8vIE9wdGlvbiAyOiBEZWNvbXBvc2UgYW5kIGluZmVyIFR3by5qcyByZWxhdGVkIHByb3BlcnRpZXMuXHJcbiAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybXMgPSBUd28uVXRpbHMuZGVjb21wb3NlTWF0cml4KG5vZGUuZ2V0Q1RNKCkpO1xyXG5cclxuICAgICAgICAgICAgICBlbGVtLnRyYW5zbGF0aW9uLnNldCh0cmFuc2Zvcm1zLnRyYW5zbGF0ZVgsIHRyYW5zZm9ybXMudHJhbnNsYXRlWSk7XHJcbiAgICAgICAgICAgICAgZWxlbS5yb3RhdGlvbiA9IHRyYW5zZm9ybXMucm90YXRpb247XHJcbiAgICAgICAgICAgICAgLy8gV2FybmluZzogVHdvLmpzIGVsZW1lbnRzIG9ubHkgc3VwcG9ydCB1bmlmb3JtIHNjYWxhcnMuLi5cclxuICAgICAgICAgICAgICBlbGVtLnNjYWxlID0gdHJhbnNmb3Jtcy5zY2FsZVg7XHJcblxyXG4gICAgICAgICAgICAgIHZhciB4ID0gcGFyc2VGbG9hdCgoc3R5bGVzLnggKyAnJykucmVwbGFjZSgncHgnKSk7XHJcbiAgICAgICAgICAgICAgdmFyIHkgPSBwYXJzZUZsb2F0KChzdHlsZXMueSArICcnKS5yZXBsYWNlKCdweCcpKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gT3ZlcnJpZGUgYmFzZWQgb24gYXR0cmlidXRlcy5cclxuICAgICAgICAgICAgICBpZiAoeCkge1xyXG4gICAgICAgICAgICAgICAgZWxlbS50cmFuc2xhdGlvbi54ID0geDtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmICh5KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnRyYW5zbGF0aW9uLnkgPSB5O1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3Zpc2libGUnOlxyXG4gICAgICAgICAgICAgIGVsZW0udmlzaWJsZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdzdHJva2UtbGluZWNhcCc6XHJcbiAgICAgICAgICAgICAgZWxlbS5jYXAgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnc3Ryb2tlLWxpbmVqb2luJzpcclxuICAgICAgICAgICAgICBlbGVtLmpvaW4gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnc3Ryb2tlLW1pdGVybGltaXQnOlxyXG4gICAgICAgICAgICAgIGVsZW0ubWl0ZXIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnc3Ryb2tlLXdpZHRoJzpcclxuICAgICAgICAgICAgICBlbGVtLmxpbmV3aWR0aCA9IHBhcnNlRmxvYXQodmFsdWUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdzdHJva2Utb3BhY2l0eSc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2ZpbGwtb3BhY2l0eSc6XHJcbiAgICAgICAgICAgIGNhc2UgJ29wYWNpdHknOlxyXG4gICAgICAgICAgICAgIGVsZW0ub3BhY2l0eSA9IHBhcnNlRmxvYXQodmFsdWUpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdmaWxsJzpcclxuICAgICAgICAgICAgY2FzZSAnc3Ryb2tlJzpcclxuICAgICAgICAgICAgICBpZiAoL3VybFxcKFxcIy4qXFwpL2kudGVzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1ba2V5XSA9IHRoaXMuZ2V0QnlJZChcclxuICAgICAgICAgICAgICAgICAgdmFsdWUucmVwbGFjZSgvdXJsXFwoXFwjKC4qKVxcKS9pLCAnJDEnKSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVsZW1ba2V5XSA9ICh2YWx1ZSA9PT0gJ25vbmUnKSA/ICd0cmFuc3BhcmVudCcgOiB2YWx1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2lkJzpcclxuICAgICAgICAgICAgICBlbGVtLmlkID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2NsYXNzJzpcclxuICAgICAgICAgICAgICBlbGVtLmNsYXNzTGlzdCA9IHZhbHVlLnNwbGl0KCcgJyk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmVhZCBhbnkgbnVtYmVyIG9mIFNWRyBub2RlIHR5cGVzIGFuZCBjcmVhdGUgVHdvIGVxdWl2YWxlbnRzIG9mIHRoZW0uXHJcbiAgICAgICAqL1xyXG4gICAgICByZWFkOiB7XHJcblxyXG4gICAgICAgIHN2ZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLnJlYWQuZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGc6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgZ3JvdXAgPSBuZXcgVHdvLkdyb3VwKCk7XHJcblxyXG4gICAgICAgICAgLy8gU3dpdGNoZWQgdXAgb3JkZXIgdG8gaW5oZXJpdCBtb3JlIHNwZWNpZmljIHN0eWxlc1xyXG4gICAgICAgICAgVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIGdyb3VwKTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIG4gPSBub2RlLmNoaWxkTm9kZXNbaV07XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuLm5vZGVOYW1lO1xyXG4gICAgICAgICAgICBpZiAoIXRhZykgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSB0YWcucmVwbGFjZSgvc3ZnXFw6L2lnLCAnJykudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0YWdOYW1lIGluIFR3by5VdGlscy5yZWFkKSB7XHJcbiAgICAgICAgICAgICAgdmFyIG8gPSBUd28uVXRpbHMucmVhZFt0YWdOYW1lXS5jYWxsKGdyb3VwLCBuKTtcclxuICAgICAgICAgICAgICBncm91cC5hZGQobyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gZ3JvdXA7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHBvbHlnb246IGZ1bmN0aW9uKG5vZGUsIG9wZW4pIHtcclxuXHJcbiAgICAgICAgICB2YXIgcG9pbnRzID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ3BvaW50cycpO1xyXG5cclxuICAgICAgICAgIHZhciB2ZXJ0cyA9IFtdO1xyXG4gICAgICAgICAgcG9pbnRzLnJlcGxhY2UoLygtP1tcXGRcXC4/XSspWyx8XFxzXSgtP1tcXGRcXC4/XSspL2csIGZ1bmN0aW9uKG1hdGNoLCBwMSwgcDIpIHtcclxuICAgICAgICAgICAgdmVydHMucHVzaChuZXcgVHdvLkFuY2hvcihwYXJzZUZsb2F0KHAxKSwgcGFyc2VGbG9hdChwMikpKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHZhciBwb2x5ID0gbmV3IFR3by5QYXRoKHZlcnRzLCAhb3Blbikubm9TdHJva2UoKTtcclxuICAgICAgICAgIHBvbHkuZmlsbCA9ICdibGFjayc7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCBwb2x5KTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcG9seWxpbmU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMucmVhZC5wb2x5Z29uLmNhbGwodGhpcywgbm9kZSwgdHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcGF0aDogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICAgIHZhciBwYXRoID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2QnKTtcclxuXHJcbiAgICAgICAgICAvLyBDcmVhdGUgYSBUd28uUGF0aCBmcm9tIHRoZSBwYXRocy5cclxuXHJcbiAgICAgICAgICB2YXIgY29vcmQgPSBuZXcgVHdvLkFuY2hvcigpO1xyXG4gICAgICAgICAgdmFyIGNvbnRyb2wsIGNvb3JkcztcclxuICAgICAgICAgIHZhciBjbG9zZWQgPSBmYWxzZSwgcmVsYXRpdmUgPSBmYWxzZTtcclxuICAgICAgICAgIHZhciBjb21tYW5kcyA9IHBhdGgubWF0Y2goL1thLWRmLXpdW15hLWRmLXpdKi9pZyk7XHJcbiAgICAgICAgICB2YXIgbGFzdCA9IGNvbW1hbmRzLmxlbmd0aCAtIDE7XHJcblxyXG4gICAgICAgICAgLy8gU3BsaXQgdXAgcG9seWJlemllcnNcclxuXHJcbiAgICAgICAgICBfLmVhY2goY29tbWFuZHMuc2xpY2UoMCksIGZ1bmN0aW9uKGNvbW1hbmQsIGkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gY29tbWFuZFswXTtcclxuICAgICAgICAgICAgdmFyIGxvd2VyID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICB2YXIgaXRlbXMgPSBjb21tYW5kLnNsaWNlKDEpLnRyaW0oKS5zcGxpdCgvW1xccyxdK3woPz1cXHM/WytcXC1dKS8pO1xyXG4gICAgICAgICAgICB2YXIgcHJlLCBwb3N0LCByZXN1bHQgPSBbXSwgYmluO1xyXG5cclxuICAgICAgICAgICAgaWYgKGkgPD0gMCkge1xyXG4gICAgICAgICAgICAgIGNvbW1hbmRzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAobG93ZXIpIHtcclxuICAgICAgICAgICAgICBjYXNlICdoJzpcclxuICAgICAgICAgICAgICBjYXNlICd2JzpcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIGJpbiA9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICBjYXNlICdsJzpcclxuICAgICAgICAgICAgICBjYXNlICd0JzpcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAgICAgICAgICAgIGJpbiA9IDI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICBjYXNlICdzJzpcclxuICAgICAgICAgICAgICBjYXNlICdxJzpcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiA0KSB7XHJcbiAgICAgICAgICAgICAgICAgIGJpbiA9IDQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICBjYXNlICdjJzpcclxuICAgICAgICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiA2KSB7XHJcbiAgICAgICAgICAgICAgICAgIGJpbiA9IDY7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICBjYXNlICdhJzpcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IEhhbmRsZSBFbGxpcHNlc1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChiaW4pIHtcclxuXHJcbiAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGwgPSBpdGVtcy5sZW5ndGgsIHRpbWVzID0gMDsgaiA8IGw7IGorPWJpbikge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjdCA9IHR5cGU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGltZXMgPiAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICAgICAgICAgIGN0ID0gJ2wnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnTSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICBjdCA9ICdMJztcclxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKFtjdF0uY29uY2F0KGl0ZW1zLnNsaWNlKGosIGogKyBiaW4pKS5qb2luKCcgJykpO1xyXG4gICAgICAgICAgICAgICAgdGltZXMrKztcclxuXHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjb21tYW5kcyA9IEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoY29tbWFuZHMsIHJlc3VsdCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICBjb21tYW5kcy5wdXNoKGNvbW1hbmQpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIC8vIENyZWF0ZSB0aGUgdmVydGljZXMgZm9yIG91ciBUd28uUGF0aFxyXG5cclxuICAgICAgICAgIHZhciBwb2ludHMgPSBbXTtcclxuICAgICAgICAgIF8uZWFjaChjb21tYW5kcywgZnVuY3Rpb24oY29tbWFuZCwgaSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlc3VsdCwgeCwgeTtcclxuICAgICAgICAgICAgdmFyIHR5cGUgPSBjb21tYW5kWzBdO1xyXG4gICAgICAgICAgICB2YXIgbG93ZXIgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBjb29yZHMgPSBjb21tYW5kLnNsaWNlKDEpLnRyaW0oKTtcclxuICAgICAgICAgICAgY29vcmRzID0gY29vcmRzLnJlcGxhY2UoLygtP1xcZCsoPzpcXC5cXGQqKT8pW2VFXShbK1xcLV0/XFxkKykvZywgZnVuY3Rpb24obWF0Y2gsIG4xLCBuMikge1xyXG4gICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KG4xKSAqIHBvdygxMCwgbjIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29vcmRzID0gY29vcmRzLnNwbGl0KC9bXFxzLF0rfCg/PVxccz9bK1xcLV0pLyk7XHJcbiAgICAgICAgICAgIHJlbGF0aXZlID0gdHlwZSA9PT0gbG93ZXI7XHJcblxyXG4gICAgICAgICAgICB2YXIgeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCByZWZsZWN0aW9uO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChsb3dlcikge1xyXG5cclxuICAgICAgICAgICAgICBjYXNlICd6JzpcclxuICAgICAgICAgICAgICAgIGlmIChpID49IGxhc3QpIHtcclxuICAgICAgICAgICAgICAgICAgY2xvc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHggPSBjb29yZC54O1xyXG4gICAgICAgICAgICAgICAgICB5ID0gY29vcmQueTtcclxuICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IFR3by5BbmNob3IoXHJcbiAgICAgICAgICAgICAgICAgICAgeCwgeSxcclxuICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBUd28uQ29tbWFuZHMuY2xvc2VcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICBjYXNlICdtJzpcclxuICAgICAgICAgICAgICBjYXNlICdsJzpcclxuXHJcbiAgICAgICAgICAgICAgICB4ID0gcGFyc2VGbG9hdChjb29yZHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgeSA9IHBhcnNlRmxvYXQoY29vcmRzWzFdKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgVHdvLkFuY2hvcihcclxuICAgICAgICAgICAgICAgICAgeCwgeSxcclxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICBsb3dlciA9PT0gJ20nID8gVHdvLkNvbW1hbmRzLm1vdmUgOiBUd28uQ29tbWFuZHMubGluZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgcmVzdWx0LmFkZFNlbGYoY29vcmQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHJlc3VsdC5jb250cm9scy5sZWZ0LmNvcHkocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIC8vIHJlc3VsdC5jb250cm9scy5yaWdodC5jb3B5KHJlc3VsdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29vcmQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgY2FzZSAnaCc6XHJcbiAgICAgICAgICAgICAgY2FzZSAndic6XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBsb3dlciA9PT0gJ2gnID8gJ3gnIDogJ3knO1xyXG4gICAgICAgICAgICAgICAgdmFyIGIgPSBhID09PSAneCcgPyAneScgOiAneCc7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3IFR3by5BbmNob3IoXHJcbiAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgIFR3by5Db21tYW5kcy5saW5lXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W2FdID0gcGFyc2VGbG9hdChjb29yZHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W2JdID0gY29vcmRbYl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJlc3VsdFthXSArPSBjb29yZFthXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyByZXN1bHQuY29udHJvbHMubGVmdC5jb3B5KHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAvLyByZXN1bHQuY29udHJvbHMucmlnaHQuY29weShyZXN1bHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvb3JkID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ2MnOlxyXG4gICAgICAgICAgICAgIGNhc2UgJ3MnOlxyXG5cclxuICAgICAgICAgICAgICAgIHgxID0gY29vcmQueDtcclxuICAgICAgICAgICAgICAgIHkxID0gY29vcmQueTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRyb2wpIHtcclxuICAgICAgICAgICAgICAgICAgY29udHJvbCA9IG5ldyBUd28uVmVjdG9yKCk7Ly8uY29weShjb29yZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxvd2VyID09PSAnYycpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgIHgyID0gcGFyc2VGbG9hdChjb29yZHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICB5MiA9IHBhcnNlRmxvYXQoY29vcmRzWzFdKTtcclxuICAgICAgICAgICAgICAgICAgeDMgPSBwYXJzZUZsb2F0KGNvb3Jkc1syXSk7XHJcbiAgICAgICAgICAgICAgICAgIHkzID0gcGFyc2VGbG9hdChjb29yZHNbM10pO1xyXG4gICAgICAgICAgICAgICAgICB4NCA9IHBhcnNlRmxvYXQoY29vcmRzWzRdKTtcclxuICAgICAgICAgICAgICAgICAgeTQgPSBwYXJzZUZsb2F0KGNvb3Jkc1s1XSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSByZWZsZWN0aW9uIGNvbnRyb2wgcG9pbnQgZm9yIHByb3BlciB4MiwgeTJcclxuICAgICAgICAgICAgICAgICAgLy8gaW5jbHVzaW9uLlxyXG5cclxuICAgICAgICAgICAgICAgICAgcmVmbGVjdGlvbiA9IGdldFJlZmxlY3Rpb24oY29vcmQsIGNvbnRyb2wsIHJlbGF0aXZlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIHgyID0gcmVmbGVjdGlvbi54O1xyXG4gICAgICAgICAgICAgICAgICB5MiA9IHJlZmxlY3Rpb24ueTtcclxuICAgICAgICAgICAgICAgICAgeDMgPSBwYXJzZUZsb2F0KGNvb3Jkc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgIHkzID0gcGFyc2VGbG9hdChjb29yZHNbMV0pO1xyXG4gICAgICAgICAgICAgICAgICB4NCA9IHBhcnNlRmxvYXQoY29vcmRzWzJdKTtcclxuICAgICAgICAgICAgICAgICAgeTQgPSBwYXJzZUZsb2F0KGNvb3Jkc1szXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICB4MiArPSB4MTtcclxuICAgICAgICAgICAgICAgICAgeTIgKz0geTE7XHJcbiAgICAgICAgICAgICAgICAgIHgzICs9IHgxO1xyXG4gICAgICAgICAgICAgICAgICB5MyArPSB5MTtcclxuICAgICAgICAgICAgICAgICAgeDQgKz0geDE7XHJcbiAgICAgICAgICAgICAgICAgIHk0ICs9IHkxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghXy5pc09iamVjdChjb29yZC5jb250cm9scykpIHtcclxuICAgICAgICAgICAgICAgICAgVHdvLkFuY2hvci5BcHBlbmRDdXJ2ZVByb3BlcnRpZXMoY29vcmQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvb3JkLmNvbnRyb2xzLnJpZ2h0LnNldCh4MiAtIGNvb3JkLngsIHkyIC0gY29vcmQueSk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgVHdvLkFuY2hvcihcclxuICAgICAgICAgICAgICAgICAgeDQsIHk0LFxyXG4gICAgICAgICAgICAgICAgICB4MyAtIHg0LCB5MyAtIHk0LFxyXG4gICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgVHdvLkNvbW1hbmRzLmN1cnZlXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvb3JkID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IHJlc3VsdC5jb250cm9scy5sZWZ0O1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICBjYXNlICd0JzpcclxuICAgICAgICAgICAgICBjYXNlICdxJzpcclxuXHJcbiAgICAgICAgICAgICAgICB4MSA9IGNvb3JkLng7XHJcbiAgICAgICAgICAgICAgICB5MSA9IGNvb3JkLnk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFjb250cm9sKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRyb2wgPSBuZXcgVHdvLlZlY3RvcigpOy8vLmNvcHkoY29vcmQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjb250cm9sLmlzWmVybygpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHgyID0geDE7XHJcbiAgICAgICAgICAgICAgICAgIHkyID0geTE7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB4MiA9IGNvbnRyb2wueDtcclxuICAgICAgICAgICAgICAgICAgeTEgPSBjb250cm9sLnk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxvd2VyID09PSAncScpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgIHgzID0gcGFyc2VGbG9hdChjb29yZHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICB5MyA9IHBhcnNlRmxvYXQoY29vcmRzWzFdKTtcclxuICAgICAgICAgICAgICAgICAgeDQgPSBwYXJzZUZsb2F0KGNvb3Jkc1sxXSk7XHJcbiAgICAgICAgICAgICAgICAgIHk0ID0gcGFyc2VGbG9hdChjb29yZHNbMl0pO1xyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICByZWZsZWN0aW9uID0gZ2V0UmVmbGVjdGlvbihjb29yZCwgY29udHJvbCwgcmVsYXRpdmUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgeDMgPSByZWZsZWN0aW9uLng7XHJcbiAgICAgICAgICAgICAgICAgIHkzID0gcmVmbGVjdGlvbi55O1xyXG4gICAgICAgICAgICAgICAgICB4NCA9IHBhcnNlRmxvYXQoY29vcmRzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgeTQgPSBwYXJzZUZsb2F0KGNvb3Jkc1sxXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICB4MiArPSB4MTtcclxuICAgICAgICAgICAgICAgICAgeTIgKz0geTE7XHJcbiAgICAgICAgICAgICAgICAgIHgzICs9IHgxO1xyXG4gICAgICAgICAgICAgICAgICB5MyArPSB5MTtcclxuICAgICAgICAgICAgICAgICAgeDQgKz0geDE7XHJcbiAgICAgICAgICAgICAgICAgIHk0ICs9IHkxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICghXy5pc09iamVjdChjb29yZC5jb250cm9scykpIHtcclxuICAgICAgICAgICAgICAgICAgVHdvLkFuY2hvci5BcHBlbmRDdXJ2ZVByb3BlcnRpZXMoY29vcmQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvb3JkLmNvbnRyb2xzLnJpZ2h0LnNldCh4MiAtIGNvb3JkLngsIHkyIC0gY29vcmQueSk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgVHdvLkFuY2hvcihcclxuICAgICAgICAgICAgICAgICAgeDQsIHk0LFxyXG4gICAgICAgICAgICAgICAgICB4MyAtIHg0LCB5MyAtIHk0LFxyXG4gICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgVHdvLkNvbW1hbmRzLmN1cnZlXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvb3JkID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IHJlc3VsdC5jb250cm9scy5sZWZ0O1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICBjYXNlICdhJzpcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB0aHJvdyBuZXcgVHdvLlV0aWxzLkVycm9yKCdub3QgeWV0IGFibGUgdG8gaW50ZXJwcmV0IEVsbGlwdGljYWwgQXJjcy4nKTtcclxuICAgICAgICAgICAgICAgIHgxID0gY29vcmQueDtcclxuICAgICAgICAgICAgICAgIHkxID0gY29vcmQueTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcnggPSBwYXJzZUZsb2F0KGNvb3Jkc1swXSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcnkgPSBwYXJzZUZsb2F0KGNvb3Jkc1sxXSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgeEF4aXNSb3RhdGlvbiA9IHBhcnNlRmxvYXQoY29vcmRzWzJdKSAqIE1hdGguUEkgLyAxODA7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGFyZ2VBcmNGbGFnID0gcGFyc2VGbG9hdChjb29yZHNbM10pO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN3ZWVwRmxhZyA9IHBhcnNlRmxvYXQoY29vcmRzWzRdKTtcclxuXHJcbiAgICAgICAgICAgICAgICB4NCA9IHBhcnNlRmxvYXQoY29vcmRzWzVdKTtcclxuICAgICAgICAgICAgICAgIHk0ID0gcGFyc2VGbG9hdChjb29yZHNbNl0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICB4NCArPSB4MTtcclxuICAgICAgICAgICAgICAgICAgeTQgKz0geTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHL2ltcGxub3RlLmh0bWwjQXJjQ29udmVyc2lvbkVuZHBvaW50VG9DZW50ZXJcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgbWlkcG9pbnQgbXggbXlcclxuICAgICAgICAgICAgICAgIHZhciBteCA9ICh4NCAtIHgxKSAvIDI7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXkgPSAoeTQgLSB5MSkgLyAyO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB4MScgeTEnIEYuNi41LjFcclxuICAgICAgICAgICAgICAgIHZhciBfeCA9IG14ICogTWF0aC5jb3MoeEF4aXNSb3RhdGlvbikgKyBteSAqIE1hdGguc2luKHhBeGlzUm90YXRpb24pO1xyXG4gICAgICAgICAgICAgICAgdmFyIF95ID0gLSBteCAqIE1hdGguc2luKHhBeGlzUm90YXRpb24pICsgbXkgKiBNYXRoLmNvcyh4QXhpc1JvdGF0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcngyID0gcnggKiByeDtcclxuICAgICAgICAgICAgICAgIHZhciByeTIgPSByeSAqIHJ5O1xyXG4gICAgICAgICAgICAgICAgdmFyIF94MiA9IF94ICogX3g7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3kyID0gX3kgKiBfeTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBhZGp1c3QgcmFkaWlcclxuICAgICAgICAgICAgICAgIHZhciBsID0gX3gyIC8gcngyICsgX3kyIC8gcnkyO1xyXG4gICAgICAgICAgICAgICAgaWYgKGwgPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJ4ICo9IE1hdGguc3FydChsKTtcclxuICAgICAgICAgICAgICAgICAgcnkgKj0gTWF0aC5zcXJ0KGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBhbXAgPSBNYXRoLnNxcnQoKHJ4MiAqIHJ5MiAtIHJ4MiAqIF95MiAtIHJ5MiAqIF94MikgLyAocngyICogX3kyICsgcnkyICogX3gyKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNOYU4oYW1wKSkge1xyXG4gICAgICAgICAgICAgICAgICBhbXAgPSAwO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXJnZUFyY0ZsYWcgIT0gc3dlZXBGbGFnICYmIGFtcCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgYW1wICo9IC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBjeCcgY3knIEYuNi41LjJcclxuICAgICAgICAgICAgICAgIHZhciBfY3ggPSBhbXAgKiByeCAqIF95IC8gcnk7XHJcbiAgICAgICAgICAgICAgICB2YXIgX2N5ID0gLSBhbXAgKiByeSAqIF94IC8gcng7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGN4IGN5IEYuNi41LjNcclxuICAgICAgICAgICAgICAgIHZhciBjeCA9IF9jeCAqIE1hdGguY29zKHhBeGlzUm90YXRpb24pIC0gX2N5ICogTWF0aC5zaW4oeEF4aXNSb3RhdGlvbikgKyAoeDEgKyB4NCkgLyAyO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN5ID0gX2N4ICogTWF0aC5zaW4oeEF4aXNSb3RhdGlvbikgKyBfY3kgKiBNYXRoLmNvcyh4QXhpc1JvdGF0aW9uKSArICh5MSArIHk0KSAvIDI7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdmVjdG9yIG1hZ25pdHVkZVxyXG4gICAgICAgICAgICAgICAgdmFyIG0gPSBmdW5jdGlvbih2KSB7IHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codlswXSwgMikgKyBNYXRoLnBvdyh2WzFdLCAyKSk7IH1cclxuICAgICAgICAgICAgICAgIC8vIHJhdGlvIGJldHdlZW4gdHdvIHZlY3RvcnNcclxuICAgICAgICAgICAgICAgIHZhciByID0gZnVuY3Rpb24odSwgdikgeyByZXR1cm4gKHVbMF0gKiB2WzBdICsgdVsxXSAqIHZbMV0pIC8gKG0odSkgKiBtKHYpKSB9XHJcbiAgICAgICAgICAgICAgICAvLyBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzXHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGZ1bmN0aW9uKHUsIHYpIHsgcmV0dXJuICh1WzBdICogdlsxXSA8IHVbMV0gKiB2WzBdID8gLSAxIDogMSkgKiBNYXRoLmFjb3Mocih1LHYpKTsgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aGV0YTEgYW5kIGRlbHRhIHRoZXRhIEYuNi41LjQgKyBGLjYuNS41XHJcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSBhKFsxLCAwXSwgWyhfeCAtIF9jeCkgLyByeCwgKF95IC0gX2N5KSAvIHJ5XSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgdSA9IFsoX3ggLSBfY3gpIC8gcngsIChfeSAtIF9jeSkgLyByeV07XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IFsoIC0gX3ggLSBfY3gpIC8gcngsICggLSBfeSAtIF9jeSkgLyByeV07XHJcbiAgICAgICAgICAgICAgICB2YXIgZHQgPSBhKHUsIHYpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyKHUsIHYpIDw9IC0xKSBkdCA9IE1hdGguUEk7XHJcbiAgICAgICAgICAgICAgICBpZiAocih1LCB2KSA+PSAxKSBkdCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRi42LjUuNlxyXG4gICAgICAgICAgICAgICAgaWYgKGxhcmdlQXJjRmxhZykgIHtcclxuICAgICAgICAgICAgICAgICAgZHQgPSBtb2QoZHQsIE1hdGguUEkgKiAyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3dlZXBGbGFnICYmIGR0ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICBkdCAtPSBNYXRoLlBJICogMjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gVHdvLlJlc29sdXRpb247XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSBhIHByb2plY3Rpb24gb2Ygb3VyIHJvdGF0aW9uIGFuZCB0cmFuc2xhdGlvbiB0byBhcHBseVxyXG4gICAgICAgICAgICAgICAgLy8gdG8gdGhlIHNldCBvZiBwb2ludHMuXHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvamVjdGlvbiA9IG5ldyBUd28uTWF0cml4KClcclxuICAgICAgICAgICAgICAgICAgLnRyYW5zbGF0ZShjeCwgY3kpXHJcbiAgICAgICAgICAgICAgICAgIC5yb3RhdGUoeEF4aXNSb3RhdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgcmVzdWx0aW5nIGFycmF5IG9mIFR3by5BbmNob3IncyB0byBleHBvcnQgdG8gdGhlXHJcbiAgICAgICAgICAgICAgICAvLyB0aGUgcGF0aC5cclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IF8ubWFwKF8ucmFuZ2UobGVuZ3RoKSwgZnVuY3Rpb24oaSkge1xyXG4gICAgICAgICAgICAgICAgICB2YXIgcGN0ID0gMSAtIChpIC8gKGxlbmd0aCAtIDEpKTtcclxuICAgICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gcGN0ICogZHQgKyB0MTtcclxuICAgICAgICAgICAgICAgICAgdmFyIHggPSByeCAqIE1hdGguY29zKHRoZXRhKTtcclxuICAgICAgICAgICAgICAgICAgdmFyIHkgPSByeSAqIE1hdGguc2luKHRoZXRhKTtcclxuICAgICAgICAgICAgICAgICAgdmFyIHByb2plY3RlZCA9IHByb2plY3Rpb24ubXVsdGlwbHkoeCwgeSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVHdvLkFuY2hvcihwcm9qZWN0ZWQueCwgcHJvamVjdGVkLnksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBUd28uQ29tbWFuZHMubGluZSk7O1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFR3by5BbmNob3IoeDQsIHk0LCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgVHdvLkNvbW1hbmRzLmxpbmUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb29yZCA9IHJlc3VsdFtyZXN1bHQubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgICAgICBjb250cm9sID0gY29vcmQuY29udHJvbHMubGVmdDtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICBpZiAoXy5pc0FycmF5KHJlc3VsdCkpIHtcclxuICAgICAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5jb25jYXQocmVzdWx0KTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcG9pbnRzLnB1c2gocmVzdWx0KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBpZiAocG9pbnRzLmxlbmd0aCA8PSAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgcGF0aCA9IG5ldyBUd28uUGF0aChwb2ludHMsIGNsb3NlZCwgdW5kZWZpbmVkLCB0cnVlKS5ub1N0cm9rZSgpO1xyXG4gICAgICAgICAgcGF0aC5maWxsID0gJ2JsYWNrJztcclxuXHJcbiAgICAgICAgICB2YXIgcmVjdCA9IHBhdGguZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRydWUpO1xyXG5cclxuICAgICAgICAgIC8vIENlbnRlciBvYmplY3RzIHRvIHN0YXkgY29uc2lzdGVudFxyXG4gICAgICAgICAgLy8gd2l0aCB0aGUgcmVzdCBvZiB0aGUgVHdvLmpzIEFQSS5cclxuICAgICAgICAgIHJlY3QuY2VudHJvaWQgPSB7XHJcbiAgICAgICAgICAgIHg6IHJlY3QubGVmdCArIHJlY3Qud2lkdGggLyAyLFxyXG4gICAgICAgICAgICB5OiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMlxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBfLmVhY2gocGF0aC52ZXJ0aWNlcywgZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgICB2LnN1YlNlbGYocmVjdC5jZW50cm9pZCk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBwYXRoLnRyYW5zbGF0aW9uLmFkZFNlbGYocmVjdC5jZW50cm9pZCk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCBwYXRoKTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgY2lyY2xlOiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHggPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdjeCcpKTtcclxuICAgICAgICAgIHZhciB5ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnY3knKSk7XHJcbiAgICAgICAgICB2YXIgciA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3InKSk7XHJcblxyXG4gICAgICAgICAgdmFyIGNpcmNsZSA9IG5ldyBUd28uQ2lyY2xlKHgsIHksIHIpLm5vU3Ryb2tlKCk7XHJcbiAgICAgICAgICBjaXJjbGUuZmlsbCA9ICdibGFjayc7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCBjaXJjbGUpO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBlbGxpcHNlOiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHggPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdjeCcpKTtcclxuICAgICAgICAgIHZhciB5ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnY3knKSk7XHJcbiAgICAgICAgICB2YXIgd2lkdGggPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdyeCcpKTtcclxuICAgICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdyeScpKTtcclxuXHJcbiAgICAgICAgICB2YXIgZWxsaXBzZSA9IG5ldyBUd28uRWxsaXBzZSh4LCB5LCB3aWR0aCwgaGVpZ2h0KS5ub1N0cm9rZSgpO1xyXG4gICAgICAgICAgZWxsaXBzZS5maWxsID0gJ2JsYWNrJztcclxuXHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIGVsbGlwc2UpO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICByZWN0OiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHggPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd4JykpIHx8IDA7XHJcbiAgICAgICAgICB2YXIgeSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3knKSkgfHwgMDtcclxuICAgICAgICAgIHZhciB3aWR0aCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3dpZHRoJykpO1xyXG4gICAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2hlaWdodCcpKTtcclxuXHJcbiAgICAgICAgICB2YXIgdzIgPSB3aWR0aCAvIDI7XHJcbiAgICAgICAgICB2YXIgaDIgPSBoZWlnaHQgLyAyO1xyXG5cclxuICAgICAgICAgIHZhciByZWN0ID0gbmV3IFR3by5SZWN0YW5nbGUoeCArIHcyLCB5ICsgaDIsIHdpZHRoLCBoZWlnaHQpXHJcbiAgICAgICAgICAgIC5ub1N0cm9rZSgpO1xyXG4gICAgICAgICAgcmVjdC5maWxsID0gJ2JsYWNrJztcclxuXHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIHJlY3QpO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsaW5lOiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHgxID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneDEnKSk7XHJcbiAgICAgICAgICB2YXIgeTEgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd5MScpKTtcclxuICAgICAgICAgIHZhciB4MiA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3gyJykpO1xyXG4gICAgICAgICAgdmFyIHkyID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneTInKSk7XHJcblxyXG4gICAgICAgICAgdmFyIGxpbmUgPSBuZXcgVHdvLkxpbmUoeDEsIHkxLCB4MiwgeTIpLm5vRmlsbCgpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgbGluZSk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxpbmVhcmdyYWRpZW50OiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHgxID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneDEnKSk7XHJcbiAgICAgICAgICB2YXIgeTEgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd5MScpKTtcclxuICAgICAgICAgIHZhciB4MiA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3gyJykpO1xyXG4gICAgICAgICAgdmFyIHkyID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneTInKSk7XHJcblxyXG4gICAgICAgICAgdmFyIG94ID0gKHgyICsgeDEpIC8gMjtcclxuICAgICAgICAgIHZhciBveSA9ICh5MiArIHkxKSAvIDI7XHJcblxyXG4gICAgICAgICAgdmFyIHN0b3BzID0gW107XHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XHJcblxyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gcGFyc2VGbG9hdChjaGlsZC5nZXRBdHRyaWJ1dGUoJ29mZnNldCcpKTtcclxuICAgICAgICAgICAgdmFyIGNvbG9yID0gY2hpbGQuZ2V0QXR0cmlidXRlKCdzdG9wLWNvbG9yJyk7XHJcbiAgICAgICAgICAgIHZhciBvcGFjaXR5ID0gY2hpbGQuZ2V0QXR0cmlidXRlKCdzdG9wLW9wYWNpdHknKTtcclxuICAgICAgICAgICAgdmFyIHN0eWxlID0gY2hpbGQuZ2V0QXR0cmlidXRlKCdzdHlsZScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNOdWxsKGNvbG9yKSkge1xyXG4gICAgICAgICAgICAgIHZhciBtYXRjaGVzID0gc3R5bGUgPyBzdHlsZS5tYXRjaCgvc3RvcFxcLWNvbG9yXFw6XFxzPyhbXFwjYS1mQS1GMC05XSopLykgOiBmYWxzZTtcclxuICAgICAgICAgICAgICBjb2xvciA9IG1hdGNoZXMgJiYgbWF0Y2hlcy5sZW5ndGggPiAxID8gbWF0Y2hlc1sxXSA6IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNOdWxsKG9wYWNpdHkpKSB7XHJcbiAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBzdHlsZSA/IHN0eWxlLm1hdGNoKC9zdG9wXFwtb3BhY2l0eVxcOlxccz8oWzAtOVxcLlxcLV0qKS8pIDogZmFsc2U7XHJcbiAgICAgICAgICAgICAgb3BhY2l0eSA9IG1hdGNoZXMgJiYgbWF0Y2hlcy5sZW5ndGggPiAxID8gcGFyc2VGbG9hdChtYXRjaGVzWzFdKSA6IDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN0b3BzLnB1c2gobmV3IFR3by5HcmFkaWVudC5TdG9wKG9mZnNldCwgY29sb3IsIG9wYWNpdHkpKTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIGdyYWRpZW50ID0gbmV3IFR3by5MaW5lYXJHcmFkaWVudCh4MSAtIG94LCB5MSAtIG95LCB4MiAtIG94LFxyXG4gICAgICAgICAgICB5MiAtIG95LCBzdG9wcyk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCBncmFkaWVudCk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJhZGlhbGdyYWRpZW50OiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGN4ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnY3gnKSkgfHwgMDtcclxuICAgICAgICAgIHZhciBjeSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2N5JykpIHx8IDA7XHJcbiAgICAgICAgICB2YXIgciA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3InKSk7XHJcblxyXG4gICAgICAgICAgdmFyIGZ4ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnZngnKSk7XHJcbiAgICAgICAgICB2YXIgZnkgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdmeScpKTtcclxuXHJcbiAgICAgICAgICBpZiAoXy5pc05hTihmeCkpIHtcclxuICAgICAgICAgICAgZnggPSBjeDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoXy5pc05hTihmeSkpIHtcclxuICAgICAgICAgICAgZnkgPSBjeTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgb3ggPSBNYXRoLmFicyhjeCArIGZ4KSAvIDI7XHJcbiAgICAgICAgICB2YXIgb3kgPSBNYXRoLmFicyhjeSArIGZ5KSAvIDI7XHJcblxyXG4gICAgICAgICAgdmFyIHN0b3BzID0gW107XHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XHJcblxyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gcGFyc2VGbG9hdChjaGlsZC5nZXRBdHRyaWJ1dGUoJ29mZnNldCcpKTtcclxuICAgICAgICAgICAgdmFyIGNvbG9yID0gY2hpbGQuZ2V0QXR0cmlidXRlKCdzdG9wLWNvbG9yJyk7XHJcbiAgICAgICAgICAgIHZhciBvcGFjaXR5ID0gY2hpbGQuZ2V0QXR0cmlidXRlKCdzdG9wLW9wYWNpdHknKTtcclxuICAgICAgICAgICAgdmFyIHN0eWxlID0gY2hpbGQuZ2V0QXR0cmlidXRlKCdzdHlsZScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNOdWxsKGNvbG9yKSkge1xyXG4gICAgICAgICAgICAgIHZhciBtYXRjaGVzID0gc3R5bGUgPyBzdHlsZS5tYXRjaCgvc3RvcFxcLWNvbG9yXFw6XFxzPyhbXFwjYS1mQS1GMC05XSopLykgOiBmYWxzZTtcclxuICAgICAgICAgICAgICBjb2xvciA9IG1hdGNoZXMgJiYgbWF0Y2hlcy5sZW5ndGggPiAxID8gbWF0Y2hlc1sxXSA6IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKF8uaXNOdWxsKG9wYWNpdHkpKSB7XHJcbiAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBzdHlsZSA/IHN0eWxlLm1hdGNoKC9zdG9wXFwtb3BhY2l0eVxcOlxccz8oWzAtOVxcLlxcLV0qKS8pIDogZmFsc2U7XHJcbiAgICAgICAgICAgICAgb3BhY2l0eSA9IG1hdGNoZXMgJiYgbWF0Y2hlcy5sZW5ndGggPiAxID8gcGFyc2VGbG9hdChtYXRjaGVzWzFdKSA6IDE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN0b3BzLnB1c2gobmV3IFR3by5HcmFkaWVudC5TdG9wKG9mZnNldCwgY29sb3IsIG9wYWNpdHkpKTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIGdyYWRpZW50ID0gbmV3IFR3by5SYWRpYWxHcmFkaWVudChjeCAtIG94LCBjeSAtIG95LCByLFxyXG4gICAgICAgICAgICBzdG9wcywgZnggLSBveCwgZnkgLSBveSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCBncmFkaWVudCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogR2l2ZW4gMiBwb2ludHMgKGEsIGIpIGFuZCBjb3JyZXNwb25kaW5nIGNvbnRyb2wgcG9pbnQgZm9yIGVhY2hcclxuICAgICAgICogcmV0dXJuIGFuIGFycmF5IG9mIHBvaW50cyB0aGF0IHJlcHJlc2VudCBwb2ludHMgcGxvdHRlZCBhbG9uZ1xyXG4gICAgICAgKiB0aGUgY3VydmUuIE51bWJlciBwb2ludHMgZGV0ZXJtaW5lZCBieSBsaW1pdC5cclxuICAgICAgICovXHJcbiAgICAgIHN1YmRpdmlkZTogZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCBsaW1pdCkge1xyXG5cclxuICAgICAgICBsaW1pdCA9IGxpbWl0IHx8IFR3by5VdGlscy5DdXJ2ZS5SZWN1cnNpb25MaW1pdDtcclxuICAgICAgICB2YXIgYW1vdW50ID0gbGltaXQgKyAxO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBJc3N1ZSA3M1xyXG4gICAgICAgIC8vIERvbid0IHJlY3Vyc2UgaWYgdGhlIGVuZCBwb2ludHMgYXJlIGlkZW50aWNhbFxyXG4gICAgICAgIGlmICh4MSA9PT0geDQgJiYgeTEgPT09IHk0KSB7XHJcbiAgICAgICAgICByZXR1cm4gW25ldyBUd28uQW5jaG9yKHg0LCB5NCldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKF8ucmFuZ2UoMCwgYW1vdW50KSwgZnVuY3Rpb24oaSkge1xyXG5cclxuICAgICAgICAgIHZhciB0ID0gaSAvIGFtb3VudDtcclxuICAgICAgICAgIHZhciB4ID0gZ2V0UG9pbnRPbkN1YmljQmV6aWVyKHQsIHgxLCB4MiwgeDMsIHg0KTtcclxuICAgICAgICAgIHZhciB5ID0gZ2V0UG9pbnRPbkN1YmljQmV6aWVyKHQsIHkxLCB5MiwgeTMsIHk0KTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gbmV3IFR3by5BbmNob3IoeCwgeSk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGdldFBvaW50T25DdWJpY0JlemllcjogZnVuY3Rpb24odCwgYSwgYiwgYywgZCkge1xyXG4gICAgICAgIHZhciBrID0gMSAtIHQ7XHJcbiAgICAgICAgcmV0dXJuIChrICogayAqIGsgKiBhKSArICgzICogayAqIGsgKiB0ICogYikgKyAoMyAqIGsgKiB0ICogdCAqIGMpICtcclxuICAgICAgICAgICAodCAqIHQgKiB0ICogZCk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogR2l2ZW4gMiBwb2ludHMgKGEsIGIpIGFuZCBjb3JyZXNwb25kaW5nIGNvbnRyb2wgcG9pbnQgZm9yIGVhY2hcclxuICAgICAgICogcmV0dXJuIGEgZmxvYXQgdGhhdCByZXByZXNlbnRzIHRoZSBsZW5ndGggb2YgdGhlIGN1cnZlIHVzaW5nXHJcbiAgICAgICAqIEdhdXNzLUxlZ2VuZHJlIGFsZ29yaXRobS4gTGltaXQgaXRlcmF0aW9ucyBvZiBjYWxjdWxhdGlvbiBieSBgbGltaXRgLlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0Q3VydmVMZW5ndGg6IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgbGltaXQpIHtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQmV0dGVyIC8gZnV6emllciBlcXVhbGl0eSBjaGVja1xyXG4gICAgICAgIC8vIExpbmVhciBjYWxjdWxhdGlvblxyXG4gICAgICAgIGlmICh4MSA9PT0geDIgJiYgeTEgPT09IHkyICYmIHgzID09PSB4NCAmJiB5MyA9PT0geTQpIHtcclxuICAgICAgICAgIHZhciBkeCA9IHg0IC0geDE7XHJcbiAgICAgICAgICB2YXIgZHkgPSB5NCAtIHkxO1xyXG4gICAgICAgICAgcmV0dXJuIHNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjb2VmZmljaWVudHMgb2YgYSBCZXppZXIgZGVyaXZhdGl2ZS5cclxuICAgICAgICB2YXIgYXggPSA5ICogKHgyIC0geDMpICsgMyAqICh4NCAtIHgxKSxcclxuICAgICAgICAgIGJ4ID0gNiAqICh4MSArIHgzKSAtIDEyICogeDIsXHJcbiAgICAgICAgICBjeCA9IDMgKiAoeDIgLSB4MSksXHJcblxyXG4gICAgICAgICAgYXkgPSA5ICogKHkyIC0geTMpICsgMyAqICh5NCAtIHkxKSxcclxuICAgICAgICAgIGJ5ID0gNiAqICh5MSArIHkzKSAtIDEyICogeTIsXHJcbiAgICAgICAgICBjeSA9IDMgKiAoeTIgLSB5MSk7XHJcblxyXG4gICAgICAgIHZhciBpbnRlZ3JhbmQgPSBmdW5jdGlvbih0KSB7XHJcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgcXVhZHJhdGljIGVxdWF0aW9ucyBvZiBkZXJpdmF0aXZlcyBmb3IgeCBhbmQgeVxyXG4gICAgICAgICAgdmFyIGR4ID0gKGF4ICogdCArIGJ4KSAqIHQgKyBjeCxcclxuICAgICAgICAgICAgZHkgPSAoYXkgKiB0ICsgYnkpICogdCArIGN5O1xyXG4gICAgICAgICAgcmV0dXJuIHNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBpbnRlZ3JhdGUoXHJcbiAgICAgICAgICBpbnRlZ3JhbmQsIDAsIDEsIGxpbWl0IHx8IFR3by5VdGlscy5DdXJ2ZS5SZWN1cnNpb25MaW1pdFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEludGVncmF0aW9uIGZvciBgZ2V0Q3VydmVMZW5ndGhgIGNhbGN1bGF0aW9ucy4gUmVmZXJlbmNlZCBmcm9tXHJcbiAgICAgICAqIFBhcGVyLmpzOiBodHRwczovL2dpdGh1Yi5jb20vcGFwZXJqcy9wYXBlci5qcy9ibG9iL21hc3Rlci9zcmMvdXRpbC9OdW1lcmljYWwuanMjTDEwMVxyXG4gICAgICAgKi9cclxuICAgICAgaW50ZWdyYXRlOiBmdW5jdGlvbihmLCBhLCBiLCBuKSB7XHJcbiAgICAgICAgdmFyIHggPSBUd28uVXRpbHMuQ3VydmUuYWJzY2lzc2FzW24gLSAyXSxcclxuICAgICAgICAgIHcgPSBUd28uVXRpbHMuQ3VydmUud2VpZ2h0c1tuIC0gMl0sXHJcbiAgICAgICAgICBBID0gMC41ICogKGIgLSBhKSxcclxuICAgICAgICAgIEIgPSBBICsgYSxcclxuICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgbSA9IChuICsgMSkgPj4gMSxcclxuICAgICAgICAgIHN1bSA9IG4gJiAxID8gd1tpKytdICogZihCKSA6IDA7IC8vIEhhbmRsZSBvZGQgblxyXG4gICAgICAgIHdoaWxlIChpIDwgbSkge1xyXG4gICAgICAgICAgdmFyIEF4ID0gQSAqIHhbaV07XHJcbiAgICAgICAgICBzdW0gKz0gd1tpKytdICogKGYoQiArIEF4KSArIGYoQiAtIEF4KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBBICogc3VtO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIENyZWF0ZXMgYSBzZXQgb2YgcG9pbnRzIHRoYXQgaGF2ZSB1LCB2IHZhbHVlcyBmb3IgYW5jaG9yIHBvc2l0aW9uc1xyXG4gICAgICAgKi9cclxuICAgICAgZ2V0Q3VydmVGcm9tUG9pbnRzOiBmdW5jdGlvbihwb2ludHMsIGNsb3NlZCkge1xyXG5cclxuICAgICAgICB2YXIgbCA9IHBvaW50cy5sZW5ndGgsIGxhc3QgPSBsIC0gMTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcclxuXHJcbiAgICAgICAgICB2YXIgcG9pbnQgPSBwb2ludHNbaV07XHJcblxyXG4gICAgICAgICAgaWYgKCFfLmlzT2JqZWN0KHBvaW50LmNvbnRyb2xzKSkge1xyXG4gICAgICAgICAgICBUd28uQW5jaG9yLkFwcGVuZEN1cnZlUHJvcGVydGllcyhwb2ludCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIHByZXYgPSBjbG9zZWQgPyBtb2QoaSAtIDEsIGwpIDogbWF4KGkgLSAxLCAwKTtcclxuICAgICAgICAgIHZhciBuZXh0ID0gY2xvc2VkID8gbW9kKGkgKyAxLCBsKSA6IG1pbihpICsgMSwgbGFzdCk7XHJcblxyXG4gICAgICAgICAgdmFyIGEgPSBwb2ludHNbcHJldl07XHJcbiAgICAgICAgICB2YXIgYiA9IHBvaW50O1xyXG4gICAgICAgICAgdmFyIGMgPSBwb2ludHNbbmV4dF07XHJcbiAgICAgICAgICBnZXRDb250cm9sUG9pbnRzKGEsIGIsIGMpO1xyXG5cclxuICAgICAgICAgIGIuX2NvbW1hbmQgPSBpID09PSAwID8gVHdvLkNvbW1hbmRzLm1vdmUgOiBUd28uQ29tbWFuZHMuY3VydmU7XHJcblxyXG4gICAgICAgICAgYi5jb250cm9scy5sZWZ0LnggPSBfLmlzTnVtYmVyKGIuY29udHJvbHMubGVmdC54KSA/IGIuY29udHJvbHMubGVmdC54IDogYi54O1xyXG4gICAgICAgICAgYi5jb250cm9scy5sZWZ0LnkgPSBfLmlzTnVtYmVyKGIuY29udHJvbHMubGVmdC55KSA/IGIuY29udHJvbHMubGVmdC55IDogYi55O1xyXG5cclxuICAgICAgICAgIGIuY29udHJvbHMucmlnaHQueCA9IF8uaXNOdW1iZXIoYi5jb250cm9scy5yaWdodC54KSA/IGIuY29udHJvbHMucmlnaHQueCA6IGIueDtcclxuICAgICAgICAgIGIuY29udHJvbHMucmlnaHQueSA9IF8uaXNOdW1iZXIoYi5jb250cm9scy5yaWdodC55KSA/IGIuY29udHJvbHMucmlnaHQueSA6IGIueTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHaXZlbiB0aHJlZSBjb29yZGluYXRlcyByZXR1cm4gdGhlIGNvbnRyb2wgcG9pbnRzIGZvciB0aGUgbWlkZGxlLCBiLFxyXG4gICAgICAgKiB2ZXJ0ZXguXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXRDb250cm9sUG9pbnRzOiBmdW5jdGlvbihhLCBiLCBjKSB7XHJcblxyXG4gICAgICAgIHZhciBhMSA9IGFuZ2xlQmV0d2VlbihhLCBiKTtcclxuICAgICAgICB2YXIgYTIgPSBhbmdsZUJldHdlZW4oYywgYik7XHJcblxyXG4gICAgICAgIHZhciBkMSA9IGRpc3RhbmNlQmV0d2VlbihhLCBiKTtcclxuICAgICAgICB2YXIgZDIgPSBkaXN0YW5jZUJldHdlZW4oYywgYik7XHJcblxyXG4gICAgICAgIHZhciBtaWQgPSAoYTEgKyBhMikgLyAyO1xyXG5cclxuICAgICAgICAvLyBTbyB3ZSBrbm93IHdoaWNoIGFuZ2xlIGNvcnJlc3BvbmRzIHRvIHdoaWNoIHNpZGUuXHJcblxyXG4gICAgICAgIGIudSA9IF8uaXNPYmplY3QoYi5jb250cm9scy5sZWZ0KSA/IGIuY29udHJvbHMubGVmdCA6IG5ldyBUd28uVmVjdG9yKDAsIDApO1xyXG4gICAgICAgIGIudiA9IF8uaXNPYmplY3QoYi5jb250cm9scy5yaWdodCkgPyBiLmNvbnRyb2xzLnJpZ2h0IDogbmV3IFR3by5WZWN0b3IoMCwgMCk7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IElzc3VlIDczXHJcbiAgICAgICAgaWYgKGQxIDwgMC4wMDAxIHx8IGQyIDwgMC4wMDAxKSB7XHJcbiAgICAgICAgICBpZiAoIWIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgIGIuY29udHJvbHMubGVmdC5jb3B5KGIpO1xyXG4gICAgICAgICAgICBiLmNvbnRyb2xzLnJpZ2h0LmNvcHkoYik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGQxICo9IDAuMzM7IC8vIFdoeSAwLjMzP1xyXG4gICAgICAgIGQyICo9IDAuMzM7XHJcblxyXG4gICAgICAgIGlmIChhMiA8IGExKSB7XHJcbiAgICAgICAgICBtaWQgKz0gSEFMRl9QSTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbWlkIC09IEhBTEZfUEk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBiLmNvbnRyb2xzLmxlZnQueCA9IGNvcyhtaWQpICogZDE7XHJcbiAgICAgICAgYi5jb250cm9scy5sZWZ0LnkgPSBzaW4obWlkKSAqIGQxO1xyXG5cclxuICAgICAgICBtaWQgLT0gUEk7XHJcblxyXG4gICAgICAgIGIuY29udHJvbHMucmlnaHQueCA9IGNvcyhtaWQpICogZDI7XHJcbiAgICAgICAgYi5jb250cm9scy5yaWdodC55ID0gc2luKG1pZCkgKiBkMjtcclxuXHJcbiAgICAgICAgaWYgKCFiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgYi5jb250cm9scy5sZWZ0LnggKz0gYi54O1xyXG4gICAgICAgICAgYi5jb250cm9scy5sZWZ0LnkgKz0gYi55O1xyXG4gICAgICAgICAgYi5jb250cm9scy5yaWdodC54ICs9IGIueDtcclxuICAgICAgICAgIGIuY29udHJvbHMucmlnaHQueSArPSBiLnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYjtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogR2V0IHRoZSByZWZsZWN0aW9uIG9mIGEgcG9pbnQgXCJiXCIgYWJvdXQgcG9pbnQgXCJhXCIuIFdoZXJlIFwiYVwiIGlzIGluXHJcbiAgICAgICAqIGFic29sdXRlIHNwYWNlIGFuZCBcImJcIiBpcyByZWxhdGl2ZSB0byBcImFcIi5cclxuICAgICAgICpcclxuICAgICAgICogaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvaW1wbG5vdGUuaHRtbCNQYXRoRWxlbWVudEltcGxlbWVudGF0aW9uTm90ZXNcclxuICAgICAgICovXHJcbiAgICAgIGdldFJlZmxlY3Rpb246IGZ1bmN0aW9uKGEsIGIsIHJlbGF0aXZlKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgVHdvLlZlY3RvcihcclxuICAgICAgICAgIDIgKiBhLnggLSAoYi54ICsgYS54KSAtIChyZWxhdGl2ZSA/IGEueCA6IDApLFxyXG4gICAgICAgICAgMiAqIGEueSAtIChiLnkgKyBhLnkpIC0gKHJlbGF0aXZlID8gYS55IDogMClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGdldEFuY2hvcnNGcm9tQXJjRGF0YTogZnVuY3Rpb24oY2VudGVyLCB4QXhpc1JvdGF0aW9uLCByeCwgcnksIHRzLCB0ZCwgY2N3KSB7XHJcblxyXG4gICAgICAgIHZhciBtYXRyaXggPSBuZXcgVHdvLk1hdHJpeCgpXHJcbiAgICAgICAgICAudHJhbnNsYXRlKGNlbnRlci54LCBjZW50ZXIueSlcclxuICAgICAgICAgIC5yb3RhdGUoeEF4aXNSb3RhdGlvbik7XHJcblxyXG4gICAgICAgIHZhciBsID0gVHdvLlJlc29sdXRpb247XHJcblxyXG4gICAgICAgIHJldHVybiBfLm1hcChfLnJhbmdlKGwpLCBmdW5jdGlvbihpKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHBjdCA9IChpICsgMSkgLyBsO1xyXG4gICAgICAgICAgaWYgKCEhY2N3KSB7XHJcbiAgICAgICAgICAgIHBjdCA9IDEgLSBwY3Q7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIHRoZXRhID0gcGN0ICogdGQgKyB0cztcclxuICAgICAgICAgIHZhciB4ID0gcnggKiBNYXRoLmNvcyh0aGV0YSk7XHJcbiAgICAgICAgICB2YXIgeSA9IHJ5ICogTWF0aC5zaW4odGhldGEpO1xyXG5cclxuICAgICAgICAgIC8vIHggKz0gY2VudGVyLng7XHJcbiAgICAgICAgICAvLyB5ICs9IGNlbnRlci55O1xyXG5cclxuICAgICAgICAgIHZhciBhbmNob3IgPSBuZXcgVHdvLkFuY2hvcih4LCB5KTtcclxuICAgICAgICAgIFR3by5BbmNob3IuQXBwZW5kQ3VydmVQcm9wZXJ0aWVzKGFuY2hvcik7XHJcbiAgICAgICAgICBhbmNob3IuY29tbWFuZCA9IFR3by5Db21tYW5kcy5saW5lO1xyXG5cclxuICAgICAgICAgIC8vIFRPRE86IENhbGN1bGF0ZSBjb250cm9sIHBvaW50cyBoZXJlLi4uXHJcblxyXG4gICAgICAgICAgcmV0dXJuIGFuY2hvcjtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmF0aW9CZXR3ZWVuOiBmdW5jdGlvbihBLCBCKSB7XHJcblxyXG4gICAgICAgIHJldHVybiAoQS54ICogQi54ICsgQS55ICogQi55KSAvIChBLmxlbmd0aCgpICogQi5sZW5ndGgoKSk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgYW5nbGVCZXR3ZWVuOiBmdW5jdGlvbihBLCBCKSB7XHJcblxyXG4gICAgICAgIHZhciBkeCwgZHk7XHJcblxyXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIHtcclxuXHJcbiAgICAgICAgICBkeCA9IGFyZ3VtZW50c1swXSAtIGFyZ3VtZW50c1syXTtcclxuICAgICAgICAgIGR5ID0gYXJndW1lbnRzWzFdIC0gYXJndW1lbnRzWzNdO1xyXG5cclxuICAgICAgICAgIHJldHVybiBhdGFuMihkeSwgZHgpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGR4ID0gQS54IC0gQi54O1xyXG4gICAgICAgIGR5ID0gQS55IC0gQi55O1xyXG5cclxuICAgICAgICByZXR1cm4gYXRhbjIoZHksIGR4KTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBkaXN0YW5jZUJldHdlZW5TcXVhcmVkOiBmdW5jdGlvbihwMSwgcDIpIHtcclxuXHJcbiAgICAgICAgdmFyIGR4ID0gcDEueCAtIHAyLng7XHJcbiAgICAgICAgdmFyIGR5ID0gcDEueSAtIHAyLnk7XHJcblxyXG4gICAgICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBkaXN0YW5jZUJldHdlZW46IGZ1bmN0aW9uKHAxLCBwMikge1xyXG5cclxuICAgICAgICByZXR1cm4gc3FydChkaXN0YW5jZUJldHdlZW5TcXVhcmVkKHAxLCBwMikpO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGxlcnA6IGZ1bmN0aW9uKGEsIGIsIHQpIHtcclxuICAgICAgICByZXR1cm4gdCAqIChiIC0gYSkgKyBhO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQSBwcmV0dHkgZmFzdCB0b0ZpeGVkKDMpIGFsdGVybmF0aXZlXHJcbiAgICAgIC8vIFNlZSBodHRwOi8vanNwZXJmLmNvbS9wYXJzZWZsb2F0LXRvZml4ZWQtdnMtbWF0aC1yb3VuZC8xOFxyXG4gICAgICB0b0ZpeGVkOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IodiAqIDEwMDApIC8gMTAwMDtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIG1vZDogZnVuY3Rpb24odiwgbCkge1xyXG5cclxuICAgICAgICB3aGlsZSAodiA8IDApIHtcclxuICAgICAgICAgIHYgKz0gbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB2ICUgbDtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQXJyYXkgbGlrZSBjb2xsZWN0aW9uIHRoYXQgdHJpZ2dlcnMgaW5zZXJ0ZWQgYW5kIHJlbW92ZWQgZXZlbnRzXHJcbiAgICAgICAqIHJlbW92ZWQgOiBwb3AgLyBzaGlmdCAvIHNwbGljZVxyXG4gICAgICAgKiBpbnNlcnRlZCA6IHB1c2ggLyB1bnNoaWZ0IC8gc3BsaWNlICh3aXRoID4gMiBhcmd1bWVudHMpXHJcbiAgICAgICAqL1xyXG4gICAgICBDb2xsZWN0aW9uOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgQXJyYXkuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzWzBdICYmIEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKSkge1xyXG4gICAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkodGhpcywgYXJndW1lbnRzWzBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLy8gQ3VzdG9tIEVycm9yIFRocm93aW5nIGZvciBUd28uanNcclxuXHJcbiAgICAgIEVycm9yOiBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gJ3R3by5qcyc7XHJcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIEV2ZW50czoge1xyXG5cclxuICAgICAgICBvbjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgICB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcclxuICAgICAgICAgIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW25hbWVdIHx8ICh0aGlzLl9ldmVudHNbbmFtZV0gPSBbXSk7XHJcblxyXG4gICAgICAgICAgbGlzdC5wdXNoKGNhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgb2ZmOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICAgIGlmICghdGhpcy5fZXZlbnRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKCFuYW1lICYmICFjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIG5hbWVzID0gbmFtZSA/IFtuYW1lXSA6IF8ua2V5cyh0aGlzLl9ldmVudHMpO1xyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XHJcbiAgICAgICAgICAgIHZhciBsaXN0ID0gdGhpcy5fZXZlbnRzW25hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEhbGlzdCkge1xyXG4gICAgICAgICAgICAgIHZhciBldmVudHMgPSBbXTtcclxuICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gbGlzdC5sZW5ndGg7IGogPCBrOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgdmFyIGV2ID0gbGlzdFtqXTtcclxuICAgICAgICAgICAgICAgICAgZXYgPSBldi5jYWxsYmFjayA/IGV2LmNhbGxiYWNrIDogZXY7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYpIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudHMucHVzaChldik7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdID0gZXZlbnRzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XHJcbiAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdO1xyXG4gICAgICAgICAgaWYgKGV2ZW50cykgdHJpZ2dlcih0aGlzLCBldmVudHMsIGFyZ3MpO1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbGlzdGVuOiBmdW5jdGlvbiAob2JqLCBuYW1lLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICAgIHZhciBib3VuZCA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgaWYgKG9iaikge1xyXG4gICAgICAgICAgICB2YXIgZXYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkoYm91bmQsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBhZGQgcmVmZXJlbmNlcyBhYm91dCB0aGUgb2JqZWN0IHRoYXQgYXNzaWduZWQgdGhpcyBsaXN0ZW5lclxyXG4gICAgICAgICAgICBldi5vYmogPSBvYmo7XHJcbiAgICAgICAgICAgIGV2Lm5hbWUgPSBuYW1lO1xyXG4gICAgICAgICAgICBldi5jYWxsYmFjayA9IGNhbGxiYWNrO1xyXG5cclxuICAgICAgICAgICAgb2JqLm9uKG5hbWUsIGV2KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgaWdub3JlOiBmdW5jdGlvbiAob2JqLCBuYW1lLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICAgIG9iai5vZmYobmFtZSwgY2FsbGJhY2spO1xyXG5cclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSlcclxuXHJcbiAgfSk7XHJcblxyXG4gIFR3by5VdGlscy5FdmVudHMuYmluZCA9IFR3by5VdGlscy5FdmVudHMub247XHJcbiAgVHdvLlV0aWxzLkV2ZW50cy51bmJpbmQgPSBUd28uVXRpbHMuRXZlbnRzLm9mZjtcclxuXHJcbiAgdmFyIHRyaWdnZXIgPSBmdW5jdGlvbihvYmosIGV2ZW50cywgYXJncykge1xyXG4gICAgdmFyIG1ldGhvZDtcclxuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcclxuICAgIGNhc2UgMDpcclxuICAgICAgbWV0aG9kID0gZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGV2ZW50c1tpXS5jYWxsKG9iaiwgYXJnc1swXSk7XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAxOlxyXG4gICAgICBtZXRob2QgPSBmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgZXZlbnRzW2ldLmNhbGwob2JqLCBhcmdzWzBdLCBhcmdzWzFdKTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDI6XHJcbiAgICAgIG1ldGhvZCA9IGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBldmVudHNbaV0uY2FsbChvYmosIGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0pO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgMzpcclxuICAgICAgbWV0aG9kID0gZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGV2ZW50c1tpXS5jYWxsKG9iaiwgYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSwgYXJnc1szXSk7XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgbWV0aG9kID0gZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGV2ZW50c1tpXS5hcHBseShvYmosIGFyZ3MpO1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldmVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgbWV0aG9kKGkpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIFR3by5VdGlscy5FcnJvci5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcclxuICBUd28uVXRpbHMuRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHdvLlV0aWxzLkVycm9yO1xyXG5cclxuICBUd28uVXRpbHMuQ29sbGVjdGlvbi5wcm90b3R5cGUgPSBuZXcgQXJyYXkoKTtcclxuICBUd28uVXRpbHMuQ29sbGVjdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUd28uVXRpbHMuQ29sbGVjdGlvbjtcclxuXHJcbiAgXy5leHRlbmQoVHdvLlV0aWxzLkNvbGxlY3Rpb24ucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgcG9wOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHBvcHBlZCA9IEFycmF5LnByb3RvdHlwZS5wb3AuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMucmVtb3ZlLCBbcG9wcGVkXSk7XHJcbiAgICAgIHJldHVybiBwb3BwZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNoaWZ0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHNoaWZ0ZWQgPSBBcnJheS5wcm90b3R5cGUuc2hpZnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMucmVtb3ZlLCBbc2hpZnRlZF0pO1xyXG4gICAgICByZXR1cm4gc2hpZnRlZDtcclxuICAgIH0sXHJcblxyXG4gICAgcHVzaDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBwdXNoZWQgPSBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5pbnNlcnQsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHJldHVybiBwdXNoZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHVuc2hpZnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgdW5zaGlmdGVkID0gQXJyYXkucHJvdG90eXBlLnVuc2hpZnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuaW5zZXJ0LCBhcmd1bWVudHMpO1xyXG4gICAgICByZXR1cm4gdW5zaGlmdGVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzcGxpY2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgc3BsaWNlZCA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgdmFyIGluc2VydGVkO1xyXG5cclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMucmVtb3ZlLCBzcGxpY2VkKTtcclxuXHJcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xyXG4gICAgICAgIGluc2VydGVkID0gdGhpcy5zbGljZShhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1swXSArIGFyZ3VtZW50cy5sZW5ndGggLSAyKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5pbnNlcnQsIGluc2VydGVkKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5vcmRlcik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHNwbGljZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNvcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBBcnJheS5wcm90b3R5cGUuc29ydC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5vcmRlcik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXZlcnNlOiBmdW5jdGlvbigpIHtcclxuICAgICAgQXJyYXkucHJvdG90eXBlLnJldmVyc2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMub3JkZXIpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIC8vIExvY2FsaXplIHV0aWxzXHJcblxyXG4gIHZhciBkaXN0YW5jZUJldHdlZW4gPSBUd28uVXRpbHMuZGlzdGFuY2VCZXR3ZWVuLFxyXG4gICAgZ2V0QW5jaG9yc0Zyb21BcmNEYXRhID0gVHdvLlV0aWxzLmdldEFuY2hvcnNGcm9tQXJjRGF0YSxcclxuICAgIGRpc3RhbmNlQmV0d2VlblNxdWFyZWQgPSBUd28uVXRpbHMuZGlzdGFuY2VCZXR3ZWVuU3F1YXJlZCxcclxuICAgIHJhdGlvQmV0d2VlbiA9IFR3by5VdGlscy5yYXRpb0JldHdlZW4sXHJcbiAgICBhbmdsZUJldHdlZW4gPSBUd28uVXRpbHMuYW5nbGVCZXR3ZWVuLFxyXG4gICAgZ2V0Q29udHJvbFBvaW50cyA9IFR3by5VdGlscy5nZXRDb250cm9sUG9pbnRzLFxyXG4gICAgZ2V0Q3VydmVGcm9tUG9pbnRzID0gVHdvLlV0aWxzLmdldEN1cnZlRnJvbVBvaW50cyxcclxuICAgIHNvbHZlU2VnbWVudEludGVyc2VjdGlvbiA9IFR3by5VdGlscy5zb2x2ZVNlZ21lbnRJbnRlcnNlY3Rpb24sXHJcbiAgICBkZWNvdXBsZVNoYXBlcyA9IFR3by5VdGlscy5kZWNvdXBsZVNoYXBlcyxcclxuICAgIG1vZCA9IFR3by5VdGlscy5tb2QsXHJcbiAgICBnZXRCYWNraW5nU3RvcmVSYXRpbyA9IFR3by5VdGlscy5nZXRCYWNraW5nU3RvcmVSYXRpbyxcclxuICAgIGdldFBvaW50T25DdWJpY0JlemllciA9IFR3by5VdGlscy5nZXRQb2ludE9uQ3ViaWNCZXppZXIsXHJcbiAgICBnZXRDdXJ2ZUxlbmd0aCA9IFR3by5VdGlscy5nZXRDdXJ2ZUxlbmd0aCxcclxuICAgIGludGVncmF0ZSA9IFR3by5VdGlscy5pbnRlZ3JhdGUsXHJcbiAgICBnZXRSZWZsZWN0aW9uID0gVHdvLlV0aWxzLmdldFJlZmxlY3Rpb247XHJcblxyXG4gIF8uZXh0ZW5kKFR3by5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICBhcHBlbmRUbzogZnVuY3Rpb24oZWxlbSkge1xyXG5cclxuICAgICAgZWxlbS5hcHBlbmRDaGlsZCh0aGlzLnJlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHBsYXk6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgVHdvLlV0aWxzLnNldFBsYXlpbmcuY2FsbCh0aGlzLCB0cnVlKTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLnBsYXkpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcGF1c2U6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5wbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5wYXVzZSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZSBwb3NpdGlvbnMgYW5kIGNhbGN1bGF0aW9ucyBpbiBvbmUgcGFzcyBiZWZvcmUgcmVuZGVyaW5nLlxyXG4gICAgICovXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGFuaW1hdGVkID0gISF0aGlzLl9sYXN0RnJhbWU7XHJcbiAgICAgIHZhciBub3cgPSBwZXJmLm5vdygpO1xyXG5cclxuICAgICAgdGhpcy5mcmFtZUNvdW50Kys7XHJcblxyXG4gICAgICBpZiAoYW5pbWF0ZWQpIHtcclxuICAgICAgICB0aGlzLnRpbWVEZWx0YSA9IHBhcnNlRmxvYXQoKG5vdyAtIHRoaXMuX2xhc3RGcmFtZSkudG9GaXhlZCgzKSk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5fbGFzdEZyYW1lID0gbm93O1xyXG5cclxuICAgICAgdmFyIHdpZHRoID0gdGhpcy53aWR0aDtcclxuICAgICAgdmFyIGhlaWdodCA9IHRoaXMuaGVpZ2h0O1xyXG4gICAgICB2YXIgcmVuZGVyZXIgPSB0aGlzLnJlbmRlcmVyO1xyXG5cclxuICAgICAgLy8gVXBkYXRlIHdpZHRoIC8gaGVpZ2h0IGZvciB0aGUgcmVuZGVyZXJcclxuICAgICAgaWYgKHdpZHRoICE9PSByZW5kZXJlci53aWR0aCB8fCBoZWlnaHQgIT09IHJlbmRlcmVyLmhlaWdodCkge1xyXG4gICAgICAgIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCwgdGhpcy5yYXRpbyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLnVwZGF0ZSwgdGhpcy5mcmFtZUNvdW50LCB0aGlzLnRpbWVEZWx0YSk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXIoKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVuZGVyIGFsbCBkcmF3YWJsZSAtIHZpc2libGUgb2JqZWN0cyBvZiB0aGUgc2NlbmUuXHJcbiAgICAgKi9cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcigpO1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMucmVuZGVyLCB0aGlzLmZyYW1lQ291bnQpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZW5pZW5jZSBNZXRob2RzXHJcbiAgICAgKi9cclxuXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKG8pIHtcclxuXHJcbiAgICAgIHZhciBvYmplY3RzID0gbztcclxuICAgICAgaWYgKCEob2JqZWN0cyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgIG9iamVjdHMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zY2VuZS5hZGQob2JqZWN0cyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihvKSB7XHJcblxyXG4gICAgICB2YXIgb2JqZWN0cyA9IG87XHJcbiAgICAgIGlmICghKG9iamVjdHMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICBvYmplY3RzID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuc2NlbmUucmVtb3ZlKG9iamVjdHMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLnNjZW5lLnJlbW92ZShfLnRvQXJyYXkodGhpcy5zY2VuZS5jaGlsZHJlbikpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VMaW5lOiBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xyXG5cclxuICAgICAgdmFyIGxpbmUgPSBuZXcgVHdvLkxpbmUoeDEsIHkxLCB4MiwgeTIpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChsaW5lKTtcclxuXHJcbiAgICAgIHJldHVybiBsaW5lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVJlY3RhbmdsZTogZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCkge1xyXG5cclxuICAgICAgdmFyIHJlY3QgPSBuZXcgVHdvLlJlY3RhbmdsZSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQocmVjdCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVjdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VSb3VuZGVkUmVjdGFuZ2xlOiBmdW5jdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBzaWRlcykge1xyXG5cclxuICAgICAgdmFyIHJlY3QgPSBuZXcgVHdvLlJvdW5kZWRSZWN0YW5nbGUoeCwgeSwgd2lkdGgsIGhlaWdodCwgc2lkZXMpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChyZWN0KTtcclxuXHJcbiAgICAgIHJldHVybiByZWN0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUNpcmNsZTogZnVuY3Rpb24ob3gsIG95LCByKSB7XHJcblxyXG4gICAgICB2YXIgY2lyY2xlID0gbmV3IFR3by5DaXJjbGUob3gsIG95LCByKTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQoY2lyY2xlKTtcclxuXHJcbiAgICAgIHJldHVybiBjaXJjbGU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlRWxsaXBzZTogZnVuY3Rpb24ob3gsIG95LCByeCwgcnkpIHtcclxuXHJcbiAgICAgIHZhciBlbGxpcHNlID0gbmV3IFR3by5FbGxpcHNlKG94LCBveSwgcngsIHJ5KTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQoZWxsaXBzZSk7XHJcblxyXG4gICAgICByZXR1cm4gZWxsaXBzZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VTdGFyOiBmdW5jdGlvbihveCwgb3ksIG9yLCBpciwgc2lkZXMpIHtcclxuXHJcbiAgICAgIHZhciBzdGFyID0gbmV3IFR3by5TdGFyKG94LCBveSwgb3IsIGlyLCBzaWRlcyk7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHN0YXIpO1xyXG5cclxuICAgICAgcmV0dXJuIHN0YXI7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlQ3VydmU6IGZ1bmN0aW9uKHApIHtcclxuXHJcbiAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aCwgcG9pbnRzID0gcDtcclxuICAgICAgaWYgKCFfLmlzQXJyYXkocCkpIHtcclxuICAgICAgICBwb2ludHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrPTIpIHtcclxuICAgICAgICAgIHZhciB4ID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgaWYgKCFfLmlzTnVtYmVyKHgpKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdmFyIHkgPSBhcmd1bWVudHNbaSArIDFdO1xyXG4gICAgICAgICAgcG9pbnRzLnB1c2gobmV3IFR3by5BbmNob3IoeCwgeSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGxhc3QgPSBhcmd1bWVudHNbbCAtIDFdO1xyXG4gICAgICB2YXIgY3VydmUgPSBuZXcgVHdvLlBhdGgocG9pbnRzLCAhKF8uaXNCb29sZWFuKGxhc3QpID8gbGFzdCA6IHVuZGVmaW5lZCksIHRydWUpO1xyXG4gICAgICB2YXIgcmVjdCA9IGN1cnZlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICBjdXJ2ZS5jZW50ZXIoKS50cmFuc2xhdGlvblxyXG4gICAgICAgIC5zZXQocmVjdC5sZWZ0ICsgcmVjdC53aWR0aCAvIDIsIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgLyAyKTtcclxuXHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGN1cnZlKTtcclxuXHJcbiAgICAgIHJldHVybiBjdXJ2ZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VQb2x5Z29uOiBmdW5jdGlvbihveCwgb3ksIHIsIHNpZGVzKSB7XHJcblxyXG4gICAgICB2YXIgcG9seSA9IG5ldyBUd28uUG9seWdvbihveCwgb3ksIHIsIHNpZGVzKTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQocG9seSk7XHJcblxyXG4gICAgICByZXR1cm4gcG9seTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qXHJcbiAgICAqIE1ha2UgYW4gQXJjIFNlZ21lbnRcclxuICAgICovXHJcblxyXG4gICAgbWFrZUFyY1NlZ21lbnQ6IGZ1bmN0aW9uKG94LCBveSwgaXIsIG9yLCBzYSwgZWEsIHJlcykge1xyXG4gICAgICB2YXIgYXJjU2VnbWVudCA9IG5ldyBUd28uQXJjU2VnbWVudChveCwgb3ksIGlyLCBvciwgc2EsIGVhLCByZXMpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChhcmNTZWdtZW50KTtcclxuICAgICAgcmV0dXJuIGFyY1NlZ21lbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIG1ha2UgYW5kIGRyYXcgYSBUd28uUGF0aC5cclxuICAgICAqL1xyXG4gICAgbWFrZVBhdGg6IGZ1bmN0aW9uKHApIHtcclxuXHJcbiAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aCwgcG9pbnRzID0gcDtcclxuICAgICAgaWYgKCFfLmlzQXJyYXkocCkpIHtcclxuICAgICAgICBwb2ludHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrPTIpIHtcclxuICAgICAgICAgIHZhciB4ID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgaWYgKCFfLmlzTnVtYmVyKHgpKSB7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdmFyIHkgPSBhcmd1bWVudHNbaSArIDFdO1xyXG4gICAgICAgICAgcG9pbnRzLnB1c2gobmV3IFR3by5BbmNob3IoeCwgeSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGxhc3QgPSBhcmd1bWVudHNbbCAtIDFdO1xyXG4gICAgICB2YXIgcGF0aCA9IG5ldyBUd28uUGF0aChwb2ludHMsICEoXy5pc0Jvb2xlYW4obGFzdCkgPyBsYXN0IDogdW5kZWZpbmVkKSk7XHJcbiAgICAgIHZhciByZWN0ID0gcGF0aC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgcGF0aC5jZW50ZXIoKS50cmFuc2xhdGlvblxyXG4gICAgICAgIC5zZXQocmVjdC5sZWZ0ICsgcmVjdC53aWR0aCAvIDIsIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgLyAyKTtcclxuXHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHBhdGgpO1xyXG5cclxuICAgICAgcmV0dXJuIHBhdGg7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlbmllbmNlIG1ldGhvZCB0byBtYWtlIGFuZCBhZGQgYSBUd28uVGV4dC5cclxuICAgICAqL1xyXG4gICAgbWFrZVRleHQ6IGZ1bmN0aW9uKG1lc3NhZ2UsIHgsIHksIHN0eWxlcykge1xyXG4gICAgICB2YXIgdGV4dCA9IG5ldyBUd28uVGV4dChtZXNzYWdlLCB4LCB5LCBzdHlsZXMpO1xyXG4gICAgICB0aGlzLmFkZCh0ZXh0KTtcclxuICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIG1ha2UgYW5kIGFkZCBhIFR3by5MaW5lYXJHcmFkaWVudC5cclxuICAgICAqL1xyXG4gICAgbWFrZUxpbmVhckdyYWRpZW50OiBmdW5jdGlvbih4MSwgeTEsIHgyLCB5MiAvKiBzdG9wcyAqLykge1xyXG5cclxuICAgICAgdmFyIHN0b3BzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDQpO1xyXG4gICAgICB2YXIgZ3JhZGllbnQgPSBuZXcgVHdvLkxpbmVhckdyYWRpZW50KHgxLCB5MSwgeDIsIHkyLCBzdG9wcyk7XHJcblxyXG4gICAgICB0aGlzLmFkZChncmFkaWVudCk7XHJcblxyXG4gICAgICByZXR1cm4gZ3JhZGllbnQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlbmllbmNlIG1ldGhvZCB0byBtYWtlIGFuZCBhZGQgYSBUd28uUmFkaWFsR3JhZGllbnQuXHJcbiAgICAgKi9cclxuICAgIG1ha2VSYWRpYWxHcmFkaWVudDogZnVuY3Rpb24oeDEsIHkxLCByIC8qIHN0b3BzICovKSB7XHJcblxyXG4gICAgICB2YXIgc3RvcHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMyk7XHJcbiAgICAgIHZhciBncmFkaWVudCA9IG5ldyBUd28uUmFkaWFsR3JhZGllbnQoeDEsIHkxLCByLCBzdG9wcyk7XHJcblxyXG4gICAgICB0aGlzLmFkZChncmFkaWVudCk7XHJcblxyXG4gICAgICByZXR1cm4gZ3JhZGllbnQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlU3ByaXRlOiBmdW5jdGlvbihwYXRoLCB4LCB5LCBjb2xzLCByb3dzLCBmcmFtZVJhdGUsIGF1dG9zdGFydCkge1xyXG5cclxuICAgICAgdmFyIHNwcml0ZSA9IG5ldyBUd28uU3ByaXRlKHBhdGgsIHgsIHksIGNvbHMsIHJvd3MsIGZyYW1lUmF0ZSk7XHJcbiAgICAgIGlmICghIWF1dG9zdGFydCkge1xyXG4gICAgICAgIHNwcml0ZS5wbGF5KCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5hZGQoc3ByaXRlKTtcclxuXHJcbiAgICAgIHJldHVybiBzcHJpdGU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlSW1hZ2VTZXF1ZW5jZTogZnVuY3Rpb24ocGF0aHMsIHgsIHksIGZyYW1lUmF0ZSwgYXV0b3N0YXJ0KSB7XHJcblxyXG4gICAgICB2YXIgaW1hZ2VTZXF1ZW5jZSA9IG5ldyBUd28uSW1hZ2VTZXF1ZW5jZShwYXRocywgeCwgeSwgZnJhbWVSYXRlKTtcclxuICAgICAgaWYgKCEhYXV0b3N0YXJ0KSB7XHJcbiAgICAgICAgaW1hZ2VTZXF1ZW5jZS5wbGF5KCk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5hZGQoaW1hZ2VTZXF1ZW5jZSk7XHJcblxyXG4gICAgICByZXR1cm4gaW1hZ2VTZXF1ZW5jZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VUZXh0dXJlOiBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgdmFyIHRleHR1cmUgPSBuZXcgVHdvLlRleHR1cmUocGF0aCwgY2FsbGJhY2spO1xyXG4gICAgICByZXR1cm4gdGV4dHVyZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VHcm91cDogZnVuY3Rpb24obykge1xyXG5cclxuICAgICAgdmFyIG9iamVjdHMgPSBvO1xyXG4gICAgICBpZiAoIShvYmplY3RzIGluc3RhbmNlb2YgQXJyYXkpKSB7XHJcbiAgICAgICAgb2JqZWN0cyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgZ3JvdXAgPSBuZXcgVHdvLkdyb3VwKCk7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGdyb3VwKTtcclxuICAgICAgZ3JvdXAuYWRkKG9iamVjdHMpO1xyXG5cclxuICAgICAgcmV0dXJuIGdyb3VwO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnRlcnByZXQgYW4gU1ZHIE5vZGUgYW5kIGFkZCBpdCB0byB0aGlzIGluc3RhbmNlJ3Mgc2NlbmUuIFRoZVxyXG4gICAgICogZGlzdGluY3Rpb24gc2hvdWxkIGJlIG1hZGUgdGhhdCB0aGlzIGRvZXNuJ3QgYGltcG9ydGAgc3ZnJ3MsIGl0IHNvbGVseVxyXG4gICAgICogaW50ZXJwcmV0cyB0aGVtIGludG8gc29tZXRoaW5nIGNvbXBhdGlibGUgZm9yIFR3by5qcyDigJTCoHRoaXMgaXMgc2xpZ2h0bHlcclxuICAgICAqIGRpZmZlcmVudCB0aGFuIGEgZGlyZWN0IHRyYW5zY3JpcHRpb24uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHN2Z05vZGUgLSBUaGUgbm9kZSB0byBiZSBwYXJzZWRcclxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gc2hhbGxvdyAtIERvbid0IGNyZWF0ZSBhIHRvcC1tb3N0IGdyb3VwIGJ1dFxyXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBlbmQgYWxsIGNvbnRlbnRzIGRpcmVjdGx5XHJcbiAgICAgKi9cclxuICAgIGludGVycHJldDogZnVuY3Rpb24oc3ZnTm9kZSwgc2hhbGxvdykge1xyXG5cclxuICAgICAgdmFyIHRhZyA9IHN2Z05vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgaWYgKCEodGFnIGluIFR3by5VdGlscy5yZWFkKSkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgbm9kZSA9IFR3by5VdGlscy5yZWFkW3RhZ10uY2FsbCh0aGlzLCBzdmdOb2RlKTtcclxuXHJcbiAgICAgIGlmIChzaGFsbG93ICYmIG5vZGUgaW5zdGFuY2VvZiBUd28uR3JvdXApIHtcclxuICAgICAgICB0aGlzLmFkZChub2RlLmNoaWxkcmVuKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmFkZChub2RlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5vZGU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIExvYWQgYW4gU1ZHIGZpbGUgLyB0ZXh0IGFuZCBpbnRlcnByZXQuXHJcbiAgICAgKi9cclxuICAgIGxvYWQ6IGZ1bmN0aW9uKHRleHQsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICB2YXIgbm9kZXMgPSBbXSwgZWxlbSwgaTtcclxuXHJcbiAgICAgIGlmICgvLipcXC5zdmcvaWcudGVzdCh0ZXh0KSkge1xyXG5cclxuICAgICAgICBUd28uVXRpbHMueGhyKHRleHQsIF8uYmluZChmdW5jdGlvbihkYXRhKSB7XHJcblxyXG4gICAgICAgICAgZG9tLnRlbXAuaW5uZXJIVE1MID0gZGF0YTtcclxuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkb20udGVtcC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBlbGVtID0gZG9tLnRlbXAuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgIG5vZGVzLnB1c2godGhpcy5pbnRlcnByZXQoZWxlbSkpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNhbGxiYWNrKG5vZGVzLmxlbmd0aCA8PSAxID8gbm9kZXNbMF0gOiBub2RlcyxcclxuICAgICAgICAgICAgZG9tLnRlbXAuY2hpbGRyZW4ubGVuZ3RoIDw9IDEgPyBkb20udGVtcC5jaGlsZHJlblswXSA6IGRvbS50ZW1wLmNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgfSwgdGhpcykpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRvbS50ZW1wLmlubmVySFRNTCA9IHRleHQ7XHJcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBkb20udGVtcC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGVsZW0gPSBkb20udGVtcC5jaGlsZHJlbltpXTtcclxuICAgICAgICBub2Rlcy5wdXNoKHRoaXMuaW50ZXJwcmV0KGVsZW0pKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY2FsbGJhY2sobm9kZXMubGVuZ3RoIDw9IDEgPyBub2Rlc1swXSA6IG5vZGVzLFxyXG4gICAgICAgIGRvbS50ZW1wLmNoaWxkcmVuLmxlbmd0aCA8PSAxID8gZG9tLnRlbXAuY2hpbGRyZW5bMF0gOiBkb20udGVtcC5jaGlsZHJlbik7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBmdW5jdGlvbiBmaXRUb1dpbmRvdygpIHtcclxuXHJcbiAgICB2YXIgd3IgPSBkb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cclxuICAgIHZhciB3aWR0aCA9IHRoaXMud2lkdGggPSB3ci53aWR0aDtcclxuICAgIHZhciBoZWlnaHQgPSB0aGlzLmhlaWdodCA9IHdyLmhlaWdodDtcclxuXHJcbiAgICB0aGlzLnJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCwgdGhpcy5yYXRpbyk7XHJcbiAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5yZXNpemUsIHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICB9XHJcblxyXG4gIC8vIFJlcXVlc3QgQW5pbWF0aW9uIEZyYW1lXHJcblxyXG4gIHZhciByYWYgPSBkb20uZ2V0UmVxdWVzdEFuaW1hdGlvbkZyYW1lKCk7XHJcblxyXG4gIGZ1bmN0aW9uIGxvb3AoKSB7XHJcblxyXG4gICAgcmFmKGxvb3ApO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgVHdvLkluc3RhbmNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIgdCA9IFR3by5JbnN0YW5jZXNbaV07XHJcbiAgICAgIGlmICh0LnBsYXlpbmcpIHtcclxuICAgICAgICB0LnVwZGF0ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgZGVmaW5lKCd0d28nLCBbXSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBUd287XHJcbiAgICB9KTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVHdvO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFR3bztcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgUmVnaXN0cnkgPSBUd28uUmVnaXN0cnkgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB0aGlzLm1hcCA9IHt9O1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChSZWdpc3RyeSwge1xyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUmVnaXN0cnkucHJvdG90eXBlLCB7XHJcblxyXG4gICAgYWRkOiBmdW5jdGlvbihpZCwgb2JqKSB7XHJcbiAgICAgIHRoaXMubWFwW2lkXSA9IG9iajtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZTogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgZGVsZXRlIHRoaXMubWFwW2lkXTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubWFwW2lkXTtcclxuICAgIH0sXHJcblxyXG4gICAgY29udGFpbnM6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgIHJldHVybiBpZCBpbiB0aGlzLm1hcDtcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFZlY3RvciA9IFR3by5WZWN0b3IgPSBmdW5jdGlvbih4LCB5KSB7XHJcblxyXG4gICAgdGhpcy54ID0geCB8fCAwO1xyXG4gICAgdGhpcy55ID0geSB8fCAwO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChWZWN0b3IsIHtcclxuXHJcbiAgICB6ZXJvOiBuZXcgVHdvLlZlY3RvcigpXHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChWZWN0b3IucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgc2V0OiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIHRoaXMueCA9IHg7XHJcbiAgICAgIHRoaXMueSA9IHk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb3B5OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMueCA9IHYueDtcclxuICAgICAgdGhpcy55ID0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnggPSAwO1xyXG4gICAgICB0aGlzLnkgPSAwO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLngsIHRoaXMueSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZDogZnVuY3Rpb24odjEsIHYyKSB7XHJcbiAgICAgIHRoaXMueCA9IHYxLnggKyB2Mi54O1xyXG4gICAgICB0aGlzLnkgPSB2MS55ICsgdjIueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZFNlbGY6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy54ICs9IHYueDtcclxuICAgICAgdGhpcy55ICs9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHN1YjogZnVuY3Rpb24odjEsIHYyKSB7XHJcbiAgICAgIHRoaXMueCA9IHYxLnggLSB2Mi54O1xyXG4gICAgICB0aGlzLnkgPSB2MS55IC0gdjIueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHN1YlNlbGY6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy54IC09IHYueDtcclxuICAgICAgdGhpcy55IC09IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG11bHRpcGx5U2VsZjogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLnggKj0gdi54O1xyXG4gICAgICB0aGlzLnkgKj0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgbXVsdGlwbHlTY2FsYXI6IGZ1bmN0aW9uKHMpIHtcclxuICAgICAgdGhpcy54ICo9IHM7XHJcbiAgICAgIHRoaXMueSAqPSBzO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZGl2aWRlU2NhbGFyOiBmdW5jdGlvbihzKSB7XHJcbiAgICAgIGlmIChzKSB7XHJcbiAgICAgICAgdGhpcy54IC89IHM7XHJcbiAgICAgICAgdGhpcy55IC89IHM7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zZXQoMCwgMCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG5lZ2F0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKC0xKTtcclxuICAgIH0sXHJcblxyXG4gICAgZG90OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2Lnk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxlbmd0aFNxdWFyZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xyXG4gICAgfSxcclxuXHJcbiAgICBsZW5ndGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubGVuZ3RoU3F1YXJlZCgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgbm9ybWFsaXplOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGl2aWRlU2NhbGFyKHRoaXMubGVuZ3RoKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkaXN0YW5jZVRvOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5kaXN0YW5jZVRvU3F1YXJlZCh2KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRpc3RhbmNlVG9TcXVhcmVkOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHZhciBkeCA9IHRoaXMueCAtIHYueCxcclxuICAgICAgICAgIGR5ID0gdGhpcy55IC0gdi55O1xyXG4gICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldExlbmd0aDogZnVuY3Rpb24obCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5ub3JtYWxpemUoKS5tdWx0aXBseVNjYWxhcihsKTtcclxuICAgIH0sXHJcblxyXG4gICAgZXF1YWxzOiBmdW5jdGlvbih2LCBlcHMpIHtcclxuICAgICAgZXBzID0gKHR5cGVvZiBlcHMgPT09ICd1bmRlZmluZWQnKSA/ICAwLjAwMDEgOiBlcHM7XHJcbiAgICAgIHJldHVybiAodGhpcy5kaXN0YW5jZVRvKHYpIDwgZXBzKTtcclxuICAgIH0sXHJcblxyXG4gICAgbGVycDogZnVuY3Rpb24odiwgdCkge1xyXG4gICAgICB2YXIgeCA9ICh2LnggLSB0aGlzLngpICogdCArIHRoaXMueDtcclxuICAgICAgdmFyIHkgPSAodi55IC0gdGhpcy55KSAqIHQgKyB0aGlzLnk7XHJcbiAgICAgIHJldHVybiB0aGlzLnNldCh4LCB5KTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNaZXJvOiBmdW5jdGlvbihlcHMpIHtcclxuICAgICAgZXBzID0gKHR5cGVvZiBlcHMgPT09ICd1bmRlZmluZWQnKSA/ICAwLjAwMDEgOiBlcHM7XHJcbiAgICAgIHJldHVybiAodGhpcy5sZW5ndGgoKSA8IGVwcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMueCArICcsICcgKyB0aGlzLnk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHsgeDogdGhpcy54LCB5OiB0aGlzLnkgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcm90YXRlOiBmdW5jdGlvbiAocmFkaWFucykge1xyXG4gICAgICB2YXIgY29zID0gTWF0aC5jb3MocmFkaWFucyk7XHJcbiAgICAgIHZhciBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKTtcclxuICAgICAgdGhpcy54ID0gdGhpcy54ICogY29zIC0gdGhpcy55ICogc2luO1xyXG4gICAgICB0aGlzLnkgPSB0aGlzLnggKiBzaW4gKyB0aGlzLnkgKiBjb3M7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgdmFyIEJvdW5kUHJvdG8gPSB7XHJcblxyXG4gICAgc2V0OiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIHRoaXMuX3ggPSB4O1xyXG4gICAgICB0aGlzLl95ID0geTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHk6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy5feCA9IHYueDtcclxuICAgICAgdGhpcy5feSA9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5feCA9IDA7XHJcbiAgICAgIHRoaXMuX3kgPSAwO1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLl94LCB0aGlzLl95KTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkOiBmdW5jdGlvbih2MSwgdjIpIHtcclxuICAgICAgdGhpcy5feCA9IHYxLnggKyB2Mi54O1xyXG4gICAgICB0aGlzLl95ID0gdjEueSArIHYyLnk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGRTZWxmOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMuX3ggKz0gdi54O1xyXG4gICAgICB0aGlzLl95ICs9IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN1YjogZnVuY3Rpb24odjEsIHYyKSB7XHJcbiAgICAgIHRoaXMuX3ggPSB2MS54IC0gdjIueDtcclxuICAgICAgdGhpcy5feSA9IHYxLnkgLSB2Mi55O1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3ViU2VsZjogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLl94IC09IHYueDtcclxuICAgICAgdGhpcy5feSAtPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtdWx0aXBseVNlbGY6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy5feCAqPSB2Lng7XHJcbiAgICAgIHRoaXMuX3kgKj0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbXVsdGlwbHlTY2FsYXI6IGZ1bmN0aW9uKHMpIHtcclxuICAgICAgdGhpcy5feCAqPSBzO1xyXG4gICAgICB0aGlzLl95ICo9IHM7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkaXZpZGVTY2FsYXI6IGZ1bmN0aW9uKHMpIHtcclxuICAgICAgaWYgKHMpIHtcclxuICAgICAgICB0aGlzLl94IC89IHM7XHJcbiAgICAgICAgdGhpcy5feSAvPSBzO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLmNsZWFyKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIG5lZ2F0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKC0xKTtcclxuICAgIH0sXHJcblxyXG4gICAgZG90OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl94ICogdi54ICsgdGhpcy5feSAqIHYueTtcclxuICAgIH0sXHJcblxyXG4gICAgbGVuZ3RoU3F1YXJlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl94ICogdGhpcy5feCArIHRoaXMuX3kgKiB0aGlzLl95O1xyXG4gICAgfSxcclxuXHJcbiAgICBsZW5ndGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMubGVuZ3RoU3F1YXJlZCgpKTtcclxuICAgIH0sXHJcblxyXG4gICAgbm9ybWFsaXplOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGl2aWRlU2NhbGFyKHRoaXMubGVuZ3RoKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkaXN0YW5jZVRvOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5kaXN0YW5jZVRvU3F1YXJlZCh2KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRpc3RhbmNlVG9TcXVhcmVkOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHZhciBkeCA9IHRoaXMuX3ggLSB2LngsXHJcbiAgICAgICAgICBkeSA9IHRoaXMuX3kgLSB2Lnk7XHJcbiAgICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0TGVuZ3RoOiBmdW5jdGlvbihsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZSgpLm11bHRpcGx5U2NhbGFyKGwpO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcXVhbHM6IGZ1bmN0aW9uKHYsIGVwcykge1xyXG4gICAgICBlcHMgPSAodHlwZW9mIGVwcyA9PT0gJ3VuZGVmaW5lZCcpID8gIDAuMDAwMSA6IGVwcztcclxuICAgICAgcmV0dXJuICh0aGlzLmRpc3RhbmNlVG8odikgPCBlcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsZXJwOiBmdW5jdGlvbih2LCB0KSB7XHJcbiAgICAgIHZhciB4ID0gKHYueCAtIHRoaXMuX3gpICogdCArIHRoaXMuX3g7XHJcbiAgICAgIHZhciB5ID0gKHYueSAtIHRoaXMuX3kpICogdCArIHRoaXMuX3k7XHJcbiAgICAgIHJldHVybiB0aGlzLnNldCh4LCB5KTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNaZXJvOiBmdW5jdGlvbihlcHMpIHtcclxuICAgICAgZXBzID0gKHR5cGVvZiBlcHMgPT09ICd1bmRlZmluZWQnKSA/ICAwLjAwMDEgOiBlcHM7XHJcbiAgICAgIHJldHVybiAodGhpcy5sZW5ndGgoKSA8IGVwcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3ggKyAnLCAnICsgdGhpcy5feTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4geyB4OiB0aGlzLl94LCB5OiB0aGlzLl95IH07XHJcbiAgICB9LFxyXG5cclxuICAgIHJvdGF0ZTogZnVuY3Rpb24gKHJhZGlhbnMpIHtcclxuICAgICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpO1xyXG4gICAgICB2YXIgc2luID0gTWF0aC5zaW4ocmFkaWFucyk7XHJcbiAgICAgIHRoaXMuX3ggPSB0aGlzLl94ICogY29zIC0gdGhpcy5feSAqIHNpbjtcclxuICAgICAgdGhpcy5feSA9IHRoaXMuX3ggKiBzaW4gKyB0aGlzLl95ICogY29zO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgdmFyIHhncyA9IHtcclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5feDtcclxuICAgIH0sXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy5feCA9IHY7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSwgJ3gnKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB2YXIgeWdzID0ge1xyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl95O1xyXG4gICAgfSxcclxuICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLl95ID0gdjtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlLCAneScpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIE92ZXJyaWRlIEJhY2tib25lIGJpbmQgLyBvbiBpbiBvcmRlciB0byBhZGQgcHJvcGVybHkgYnJvYWRjYXN0aW5nLlxyXG4gICAqIFRoaXMgYWxsb3dzIFR3by5WZWN0b3IgdG8gbm90IGJyb2FkY2FzdCBldmVudHMgdW5sZXNzIGV2ZW50IGxpc3RlbmVyc1xyXG4gICAqIGFyZSBleHBsaWNpdHkgYm91bmQgdG8gaXQuXHJcbiAgICovXHJcblxyXG4gIFR3by5WZWN0b3IucHJvdG90eXBlLmJpbmQgPSBUd28uVmVjdG9yLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIGlmICghdGhpcy5fYm91bmQpIHtcclxuICAgICAgdGhpcy5feCA9IHRoaXMueDtcclxuICAgICAgdGhpcy5feSA9IHRoaXMueTtcclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICd4JywgeGdzKTtcclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICd5JywgeWdzKTtcclxuICAgICAgXy5leHRlbmQodGhpcywgQm91bmRQcm90byk7XHJcbiAgICAgIHRoaXMuX2JvdW5kID0gdHJ1ZTsgLy8gUmVzZXJ2ZWQgZm9yIGV2ZW50IGluaXRpYWxpemF0aW9uIGNoZWNrXHJcbiAgICB9XHJcblxyXG4gICAgVHdvLlV0aWxzLkV2ZW50cy5iaW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gIH07XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICAvLyBMb2NhbGl6ZWQgdmFyaWFibGVzXHJcbiAgdmFyIGNvbW1hbmRzID0gVHdvLkNvbW1hbmRzO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICAvKipcclxuICAgKiBBbiBvYmplY3QgdGhhdCBob2xkcyAzIGBUd28uVmVjdG9yYHMsIHRoZSBhbmNob3IgcG9pbnQgYW5kIGl0c1xyXG4gICAqIGNvcnJlc3BvbmRpbmcgaGFuZGxlczogYGxlZnRgIGFuZCBgcmlnaHRgLlxyXG4gICAqL1xyXG4gIHZhciBBbmNob3IgPSBUd28uQW5jaG9yID0gZnVuY3Rpb24oeCwgeSwgdXgsIHV5LCB2eCwgdnksIGNvbW1hbmQpIHtcclxuXHJcbiAgICBUd28uVmVjdG9yLmNhbGwodGhpcywgeCwgeSk7XHJcblxyXG4gICAgdGhpcy5fYnJvYWRjYXN0ID0gXy5iaW5kKGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5fY29tbWFuZCA9IGNvbW1hbmQgfHwgY29tbWFuZHMubW92ZTtcclxuICAgIHRoaXMuX3JlbGF0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAoIWNvbW1hbmQpIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgQW5jaG9yLkFwcGVuZEN1cnZlUHJvcGVydGllcyh0aGlzKTtcclxuXHJcbiAgICBpZiAoXy5pc051bWJlcih1eCkpIHtcclxuICAgICAgdGhpcy5jb250cm9scy5sZWZ0LnggPSB1eDtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKHV5KSkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xzLmxlZnQueSA9IHV5O1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIodngpKSB7XHJcbiAgICAgIHRoaXMuY29udHJvbHMucmlnaHQueCA9IHZ4O1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIodnkpKSB7XHJcbiAgICAgIHRoaXMuY29udHJvbHMucmlnaHQueSA9IHZ5O1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChBbmNob3IsIHtcclxuXHJcbiAgICBBcHBlbmRDdXJ2ZVByb3BlcnRpZXM6IGZ1bmN0aW9uKGFuY2hvcikge1xyXG4gICAgICBhbmNob3IuY29udHJvbHMgPSB7XHJcbiAgICAgICAgbGVmdDogbmV3IFR3by5WZWN0b3IoMCwgMCksXHJcbiAgICAgICAgcmlnaHQ6IG5ldyBUd28uVmVjdG9yKDAsIDApXHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICB2YXIgQW5jaG9yUHJvdG8gPSB7XHJcblxyXG4gICAgbGlzdGVuOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICghXy5pc09iamVjdCh0aGlzLmNvbnRyb2xzKSkge1xyXG4gICAgICAgIEFuY2hvci5BcHBlbmRDdXJ2ZVByb3BlcnRpZXModGhpcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuY29udHJvbHMubGVmdC5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9icm9hZGNhc3QpO1xyXG4gICAgICB0aGlzLmNvbnRyb2xzLnJpZ2h0LmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX2Jyb2FkY2FzdCk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGlnbm9yZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLmNvbnRyb2xzLmxlZnQudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9icm9hZGNhc3QpO1xyXG4gICAgICB0aGlzLmNvbnRyb2xzLnJpZ2h0LnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fYnJvYWRjYXN0KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGNvbnRyb2xzID0gdGhpcy5jb250cm9scztcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBUd28uQW5jaG9yKFxyXG4gICAgICAgIHRoaXMueCxcclxuICAgICAgICB0aGlzLnksXHJcbiAgICAgICAgY29udHJvbHMgJiYgY29udHJvbHMubGVmdC54LFxyXG4gICAgICAgIGNvbnRyb2xzICYmIGNvbnRyb2xzLmxlZnQueSxcclxuICAgICAgICBjb250cm9scyAmJiBjb250cm9scy5yaWdodC54LFxyXG4gICAgICAgIGNvbnRyb2xzICYmIGNvbnRyb2xzLnJpZ2h0LnksXHJcbiAgICAgICAgdGhpcy5jb21tYW5kXHJcbiAgICAgICk7XHJcbiAgICAgIGNsb25lLnJlbGF0aXZlID0gdGhpcy5fcmVsYXRpdmU7XHJcbiAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIG8gPSB7XHJcbiAgICAgICAgeDogdGhpcy54LFxyXG4gICAgICAgIHk6IHRoaXMueVxyXG4gICAgICB9O1xyXG4gICAgICBpZiAodGhpcy5fY29tbWFuZCkge1xyXG4gICAgICAgIG8uY29tbWFuZCA9IHRoaXMuX2NvbW1hbmQ7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgby5yZWxhdGl2ZSA9IHRoaXMuX3JlbGF0aXZlO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLmNvbnRyb2xzKSB7XHJcbiAgICAgICAgby5jb250cm9scyA9IHtcclxuICAgICAgICAgIGxlZnQ6IHRoaXMuY29udHJvbHMubGVmdC50b09iamVjdCgpLFxyXG4gICAgICAgICAgcmlnaHQ6IHRoaXMuY29udHJvbHMucmlnaHQudG9PYmplY3QoKVxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG87XHJcbiAgICB9LFxyXG5cclxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKCF0aGlzLmNvbnRyb2xzKSB7XHJcbiAgICAgICAgcmV0dXJuIFt0aGlzLl94LCB0aGlzLl95XS5qb2luKCcsICcpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBbdGhpcy5feCwgdGhpcy5feSwgdGhpcy5jb250cm9scy5sZWZ0LngsIHRoaXMuY29udHJvbHMubGVmdC55LFxyXG4gICAgICAgIHRoaXMuY29udHJvbHMucmlnaHQueCwgdGhpcy5jb250cm9scy5yaWdodC55XS5qb2luKCcsICcpO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQW5jaG9yLnByb3RvdHlwZSwgJ2NvbW1hbmQnLCB7XHJcblxyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5fY29tbWFuZDtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0OiBmdW5jdGlvbihjKSB7XHJcbiAgICAgIHRoaXMuX2NvbW1hbmQgPSBjO1xyXG4gICAgICBpZiAodGhpcy5fY29tbWFuZCA9PT0gY29tbWFuZHMuY3VydmUgJiYgIV8uaXNPYmplY3QodGhpcy5jb250cm9scykpIHtcclxuICAgICAgICBBbmNob3IuQXBwZW5kQ3VydmVQcm9wZXJ0aWVzKHRoaXMpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFuY2hvci5wcm90b3R5cGUsICdyZWxhdGl2ZScsIHtcclxuXHJcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9yZWxhdGl2ZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0OiBmdW5jdGlvbihiKSB7XHJcbiAgICAgIGlmICh0aGlzLl9yZWxhdGl2ZSA9PSBiKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5fcmVsYXRpdmUgPSAhIWI7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoQW5jaG9yLnByb3RvdHlwZSwgVHdvLlZlY3Rvci5wcm90b3R5cGUsIEFuY2hvclByb3RvKTtcclxuXHJcbiAgLy8gTWFrZSBpdCBwb3NzaWJsZSB0byBiaW5kIGFuZCBzdGlsbCBoYXZlIHRoZSBBbmNob3Igc3BlY2lmaWNcclxuICAvLyBpbmhlcml0YW5jZSBmcm9tIFR3by5WZWN0b3JcclxuICBUd28uQW5jaG9yLnByb3RvdHlwZS5iaW5kID0gVHdvLkFuY2hvci5wcm90b3R5cGUub24gPSBmdW5jdGlvbigpIHtcclxuICAgIFR3by5WZWN0b3IucHJvdG90eXBlLmJpbmQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICAgIF8uZXh0ZW5kKHRoaXMsIEFuY2hvclByb3RvKTtcclxuICB9O1xyXG5cclxuICBUd28uQW5jaG9yLnByb3RvdHlwZS51bmJpbmQgPSBUd28uQW5jaG9yLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbigpIHtcclxuICAgIFR3by5WZWN0b3IucHJvdG90eXBlLnVuYmluZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXy5leHRlbmQodGhpcywgQW5jaG9yUHJvdG8pO1xyXG4gIH07XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICAvKipcclxuICAgKiBDb25zdGFudHNcclxuICAgKi9cclxuICB2YXIgY29zID0gTWF0aC5jb3MsIHNpbiA9IE1hdGguc2luLCB0YW4gPSBNYXRoLnRhbjtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgLyoqXHJcbiAgICogVHdvLk1hdHJpeCBjb250YWlucyBhbiBhcnJheSBvZiBlbGVtZW50cyB0aGF0IHJlcHJlc2VudFxyXG4gICAqIHRoZSB0d28gZGltZW5zaW9uYWwgMyB4IDMgbWF0cml4IGFzIGlsbHVzdHJhdGVkIGJlbG93OlxyXG4gICAqXHJcbiAgICogPT09PT1cclxuICAgKiBhIGIgY1xyXG4gICAqIGQgZSBmXHJcbiAgICogZyBoIGkgIC8vIHRoaXMgcm93IGlzIG5vdCByZWFsbHkgdXNlZCBpbiAyZCB0cmFuc2Zvcm1hdGlvbnNcclxuICAgKiA9PT09PVxyXG4gICAqXHJcbiAgICogU3RyaW5nIG9yZGVyIGlzIGZvciB0cmFuc2Zvcm0gc3RyaW5nczogYSwgZCwgYiwgZSwgYywgZlxyXG4gICAqXHJcbiAgICogQGNsYXNzXHJcbiAgICovXHJcbiAgdmFyIE1hdHJpeCA9IFR3by5NYXRyaXggPSBmdW5jdGlvbihhLCBiLCBjLCBkLCBlLCBmKSB7XHJcblxyXG4gICAgdGhpcy5lbGVtZW50cyA9IG5ldyBUd28uQXJyYXkoOSk7XHJcblxyXG4gICAgdmFyIGVsZW1lbnRzID0gYTtcclxuICAgIGlmICghXy5pc0FycmF5KGVsZW1lbnRzKSkge1xyXG4gICAgICBlbGVtZW50cyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGluaXRpYWxpemUgdGhlIGVsZW1lbnRzIHdpdGggZGVmYXVsdCB2YWx1ZXMuXHJcblxyXG4gICAgdGhpcy5pZGVudGl0eSgpLnNldChlbGVtZW50cyk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKE1hdHJpeCwge1xyXG5cclxuICAgIElkZW50aXR5OiBbXHJcbiAgICAgIDEsIDAsIDAsXHJcbiAgICAgIDAsIDEsIDAsXHJcbiAgICAgIDAsIDAsIDFcclxuICAgIF0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBNdWx0aXBseSB0d28gbWF0cml4IDN4MyBhcnJheXNcclxuICAgICAqL1xyXG4gICAgTXVsdGlwbHk6IGZ1bmN0aW9uKEEsIEIsIEMpIHtcclxuXHJcbiAgICAgIGlmIChCLmxlbmd0aCA8PSAzKSB7IC8vIE11bHRpcGx5IFZlY3RvclxyXG5cclxuICAgICAgICB2YXIgeCwgeSwgeiwgZSA9IEE7XHJcblxyXG4gICAgICAgIHZhciBhID0gQlswXSB8fCAwLFxyXG4gICAgICAgICAgICBiID0gQlsxXSB8fCAwLFxyXG4gICAgICAgICAgICBjID0gQlsyXSB8fCAwO1xyXG5cclxuICAgICAgICAvLyBHbyBkb3duIHJvd3MgZmlyc3RcclxuICAgICAgICAvLyBhLCBkLCBnLCBiLCBlLCBoLCBjLCBmLCBpXHJcblxyXG4gICAgICAgIHggPSBlWzBdICogYSArIGVbMV0gKiBiICsgZVsyXSAqIGM7XHJcbiAgICAgICAgeSA9IGVbM10gKiBhICsgZVs0XSAqIGIgKyBlWzVdICogYztcclxuICAgICAgICB6ID0gZVs2XSAqIGEgKyBlWzddICogYiArIGVbOF0gKiBjO1xyXG5cclxuICAgICAgICByZXR1cm4geyB4OiB4LCB5OiB5LCB6OiB6IH07XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgQTAgPSBBWzBdLCBBMSA9IEFbMV0sIEEyID0gQVsyXTtcclxuICAgICAgdmFyIEEzID0gQVszXSwgQTQgPSBBWzRdLCBBNSA9IEFbNV07XHJcbiAgICAgIHZhciBBNiA9IEFbNl0sIEE3ID0gQVs3XSwgQTggPSBBWzhdO1xyXG5cclxuICAgICAgdmFyIEIwID0gQlswXSwgQjEgPSBCWzFdLCBCMiA9IEJbMl07XHJcbiAgICAgIHZhciBCMyA9IEJbM10sIEI0ID0gQls0XSwgQjUgPSBCWzVdO1xyXG4gICAgICB2YXIgQjYgPSBCWzZdLCBCNyA9IEJbN10sIEI4ID0gQls4XTtcclxuXHJcbiAgICAgIEMgPSBDIHx8IG5ldyBUd28uQXJyYXkoOSk7XHJcblxyXG4gICAgICBDWzBdID0gQTAgKiBCMCArIEExICogQjMgKyBBMiAqIEI2O1xyXG4gICAgICBDWzFdID0gQTAgKiBCMSArIEExICogQjQgKyBBMiAqIEI3O1xyXG4gICAgICBDWzJdID0gQTAgKiBCMiArIEExICogQjUgKyBBMiAqIEI4O1xyXG4gICAgICBDWzNdID0gQTMgKiBCMCArIEE0ICogQjMgKyBBNSAqIEI2O1xyXG4gICAgICBDWzRdID0gQTMgKiBCMSArIEE0ICogQjQgKyBBNSAqIEI3O1xyXG4gICAgICBDWzVdID0gQTMgKiBCMiArIEE0ICogQjUgKyBBNSAqIEI4O1xyXG4gICAgICBDWzZdID0gQTYgKiBCMCArIEE3ICogQjMgKyBBOCAqIEI2O1xyXG4gICAgICBDWzddID0gQTYgKiBCMSArIEE3ICogQjQgKyBBOCAqIEI3O1xyXG4gICAgICBDWzhdID0gQTYgKiBCMiArIEE3ICogQjUgKyBBOCAqIEI4O1xyXG5cclxuICAgICAgcmV0dXJuIEM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoTWF0cml4LnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFrZXMgYW4gYXJyYXkgb2YgZWxlbWVudHMgb3IgdGhlIGFyZ3VtZW50cyBsaXN0IGl0c2VsZiB0b1xyXG4gICAgICogc2V0IGFuZCB1cGRhdGUgdGhlIGN1cnJlbnQgbWF0cml4J3MgZWxlbWVudHMuIE9ubHkgdXBkYXRlc1xyXG4gICAgICogc3BlY2lmaWVkIHZhbHVlcy5cclxuICAgICAqL1xyXG4gICAgc2V0OiBmdW5jdGlvbihhKSB7XHJcblxyXG4gICAgICB2YXIgZWxlbWVudHMgPSBhO1xyXG4gICAgICBpZiAoIV8uaXNBcnJheShlbGVtZW50cykpIHtcclxuICAgICAgICBlbGVtZW50cyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBfLmV4dGVuZCh0aGlzLmVsZW1lbnRzLCBlbGVtZW50cyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHVybiBtYXRyaXggdG8gaWRlbnRpdHksIGxpa2UgcmVzZXR0aW5nLlxyXG4gICAgICovXHJcbiAgICBpZGVudGl0eTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLnNldChNYXRyaXguSWRlbnRpdHkpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE11bHRpcGx5IHNjYWxhciBvciBtdWx0aXBseSBieSBhbm90aGVyIG1hdHJpeC5cclxuICAgICAqL1xyXG4gICAgbXVsdGlwbHk6IGZ1bmN0aW9uKGEsIGIsIGMsIGQsIGUsIGYsIGcsIGgsIGkpIHtcclxuXHJcbiAgICAgIHZhciBlbGVtZW50cyA9IGFyZ3VtZW50cywgbCA9IGVsZW1lbnRzLmxlbmd0aDtcclxuXHJcbiAgICAgIC8vIE11bHRpcGx5IHNjYWxhclxyXG5cclxuICAgICAgaWYgKGwgPD0gMSkge1xyXG5cclxuICAgICAgICBfLmVhY2godGhpcy5lbGVtZW50cywgZnVuY3Rpb24odiwgaSkge1xyXG4gICAgICAgICAgdGhpcy5lbGVtZW50c1tpXSA9IHYgKiBhO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChsIDw9IDMpIHsgLy8gTXVsdGlwbHkgVmVjdG9yXHJcblxyXG4gICAgICAgIHZhciB4LCB5LCB6O1xyXG4gICAgICAgIGEgPSBhIHx8IDA7XHJcbiAgICAgICAgYiA9IGIgfHwgMDtcclxuICAgICAgICBjID0gYyB8fCAwO1xyXG4gICAgICAgIGUgPSB0aGlzLmVsZW1lbnRzO1xyXG5cclxuICAgICAgICAvLyBHbyBkb3duIHJvd3MgZmlyc3RcclxuICAgICAgICAvLyBhLCBkLCBnLCBiLCBlLCBoLCBjLCBmLCBpXHJcblxyXG4gICAgICAgIHggPSBlWzBdICogYSArIGVbMV0gKiBiICsgZVsyXSAqIGM7XHJcbiAgICAgICAgeSA9IGVbM10gKiBhICsgZVs0XSAqIGIgKyBlWzVdICogYztcclxuICAgICAgICB6ID0gZVs2XSAqIGEgKyBlWzddICogYiArIGVbOF0gKiBjO1xyXG5cclxuICAgICAgICByZXR1cm4geyB4OiB4LCB5OiB5LCB6OiB6IH07XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBNdWx0aXBsZSBtYXRyaXhcclxuXHJcbiAgICAgIHZhciBBID0gdGhpcy5lbGVtZW50cztcclxuICAgICAgdmFyIEIgPSBlbGVtZW50cztcclxuXHJcbiAgICAgIHZhciBBMCA9IEFbMF0sIEExID0gQVsxXSwgQTIgPSBBWzJdO1xyXG4gICAgICB2YXIgQTMgPSBBWzNdLCBBNCA9IEFbNF0sIEE1ID0gQVs1XTtcclxuICAgICAgdmFyIEE2ID0gQVs2XSwgQTcgPSBBWzddLCBBOCA9IEFbOF07XHJcblxyXG4gICAgICB2YXIgQjAgPSBCWzBdLCBCMSA9IEJbMV0sIEIyID0gQlsyXTtcclxuICAgICAgdmFyIEIzID0gQlszXSwgQjQgPSBCWzRdLCBCNSA9IEJbNV07XHJcbiAgICAgIHZhciBCNiA9IEJbNl0sIEI3ID0gQls3XSwgQjggPSBCWzhdO1xyXG5cclxuICAgICAgdGhpcy5lbGVtZW50c1swXSA9IEEwICogQjAgKyBBMSAqIEIzICsgQTIgKiBCNjtcclxuICAgICAgdGhpcy5lbGVtZW50c1sxXSA9IEEwICogQjEgKyBBMSAqIEI0ICsgQTIgKiBCNztcclxuICAgICAgdGhpcy5lbGVtZW50c1syXSA9IEEwICogQjIgKyBBMSAqIEI1ICsgQTIgKiBCODtcclxuXHJcbiAgICAgIHRoaXMuZWxlbWVudHNbM10gPSBBMyAqIEIwICsgQTQgKiBCMyArIEE1ICogQjY7XHJcbiAgICAgIHRoaXMuZWxlbWVudHNbNF0gPSBBMyAqIEIxICsgQTQgKiBCNCArIEE1ICogQjc7XHJcbiAgICAgIHRoaXMuZWxlbWVudHNbNV0gPSBBMyAqIEIyICsgQTQgKiBCNSArIEE1ICogQjg7XHJcblxyXG4gICAgICB0aGlzLmVsZW1lbnRzWzZdID0gQTYgKiBCMCArIEE3ICogQjMgKyBBOCAqIEI2O1xyXG4gICAgICB0aGlzLmVsZW1lbnRzWzddID0gQTYgKiBCMSArIEE3ICogQjQgKyBBOCAqIEI3O1xyXG4gICAgICB0aGlzLmVsZW1lbnRzWzhdID0gQTYgKiBCMiArIEE3ICogQjUgKyBBOCAqIEI4O1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBpbnZlcnNlOiBmdW5jdGlvbihvdXQpIHtcclxuXHJcbiAgICAgIHZhciBhID0gdGhpcy5lbGVtZW50cztcclxuICAgICAgb3V0ID0gb3V0IHx8IG5ldyBUd28uTWF0cml4KCk7XHJcblxyXG4gICAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXTtcclxuICAgICAgdmFyIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV07XHJcbiAgICAgIHZhciBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdO1xyXG5cclxuICAgICAgdmFyIGIwMSA9IGEyMiAqIGExMSAtIGExMiAqIGEyMTtcclxuICAgICAgdmFyIGIxMSA9IC1hMjIgKiBhMTAgKyBhMTIgKiBhMjA7XHJcbiAgICAgIHZhciBiMjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjA7XHJcblxyXG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XHJcbiAgICAgIHZhciBkZXQgPSBhMDAgKiBiMDEgKyBhMDEgKiBiMTEgKyBhMDIgKiBiMjE7XHJcblxyXG4gICAgICBpZiAoIWRldCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBkZXQgPSAxLjAgLyBkZXQ7XHJcblxyXG4gICAgICBvdXQuZWxlbWVudHNbMF0gPSBiMDEgKiBkZXQ7XHJcbiAgICAgIG91dC5lbGVtZW50c1sxXSA9ICgtYTIyICogYTAxICsgYTAyICogYTIxKSAqIGRldDtcclxuICAgICAgb3V0LmVsZW1lbnRzWzJdID0gKGExMiAqIGEwMSAtIGEwMiAqIGExMSkgKiBkZXQ7XHJcbiAgICAgIG91dC5lbGVtZW50c1szXSA9IGIxMSAqIGRldDtcclxuICAgICAgb3V0LmVsZW1lbnRzWzRdID0gKGEyMiAqIGEwMCAtIGEwMiAqIGEyMCkgKiBkZXQ7XHJcbiAgICAgIG91dC5lbGVtZW50c1s1XSA9ICgtYTEyICogYTAwICsgYTAyICogYTEwKSAqIGRldDtcclxuICAgICAgb3V0LmVsZW1lbnRzWzZdID0gYjIxICogZGV0O1xyXG4gICAgICBvdXQuZWxlbWVudHNbN10gPSAoLWEyMSAqIGEwMCArIGEwMSAqIGEyMCkgKiBkZXQ7XHJcbiAgICAgIG91dC5lbGVtZW50c1s4XSA9IChhMTEgKiBhMDAgLSBhMDEgKiBhMTApICogZGV0O1xyXG5cclxuICAgICAgcmV0dXJuIG91dDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IGEgc2NhbGFyIG9udG8gdGhlIG1hdHJpeC5cclxuICAgICAqL1xyXG4gICAgc2NhbGU6IGZ1bmN0aW9uKHN4LCBzeSkge1xyXG5cclxuICAgICAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoO1xyXG4gICAgICBpZiAobCA8PSAxKSB7XHJcbiAgICAgICAgc3kgPSBzeDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkoc3gsIDAsIDAsIDAsIHN5LCAwLCAwLCAwLCAxKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUm90YXRlIHRoZSBtYXRyaXguXHJcbiAgICAgKi9cclxuICAgIHJvdGF0ZTogZnVuY3Rpb24ocmFkaWFucykge1xyXG5cclxuICAgICAgdmFyIGMgPSBjb3MocmFkaWFucyk7XHJcbiAgICAgIHZhciBzID0gc2luKHJhZGlhbnMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkoYywgLXMsIDAsIHMsIGMsIDAsIDAsIDAsIDEpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFuc2xhdGUgdGhlIG1hdHJpeC5cclxuICAgICAqL1xyXG4gICAgdHJhbnNsYXRlOiBmdW5jdGlvbih4LCB5KSB7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5tdWx0aXBseSgxLCAwLCB4LCAwLCAxLCB5LCAwLCAwLCAxKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBTa2V3IHRoZSBtYXRyaXggYnkgYW4gYW5nbGUgaW4gdGhlIHggYXhpcyBkaXJlY3Rpb24uXHJcbiAgICAgKi9cclxuICAgIHNrZXdYOiBmdW5jdGlvbihyYWRpYW5zKSB7XHJcblxyXG4gICAgICB2YXIgYSA9IHRhbihyYWRpYW5zKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KDEsIGEsIDAsIDAsIDEsIDAsIDAsIDAsIDEpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLypcclxuICAgICAqIFNrZXcgdGhlIG1hdHJpeCBieSBhbiBhbmdsZSBpbiB0aGUgeSBheGlzIGRpcmVjdGlvbi5cclxuICAgICAqL1xyXG4gICAgc2tld1k6IGZ1bmN0aW9uKHJhZGlhbnMpIHtcclxuXHJcbiAgICAgIHZhciBhID0gdGFuKHJhZGlhbnMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkoMSwgMCwgMCwgYSwgMSwgMCwgMCwgMCwgMSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIHRyYW5zZm9ybSBzdHJpbmcgdG8gYmUgdXNlZCB3aXRoIHJlbmRlcmluZyBhcGlzLlxyXG4gICAgICovXHJcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oZnVsbE1hdHJpeCkge1xyXG4gICAgICB2YXIgdGVtcCA9IFtdO1xyXG5cclxuICAgICAgdGhpcy50b0FycmF5KGZ1bGxNYXRyaXgsIHRlbXApO1xyXG5cclxuICAgICAgcmV0dXJuIHRlbXAuam9pbignICcpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSB0cmFuc2Zvcm0gYXJyYXkgdG8gYmUgdXNlZCB3aXRoIHJlbmRlcmluZyBhcGlzLlxyXG4gICAgICovXHJcbiAgICB0b0FycmF5OiBmdW5jdGlvbihmdWxsTWF0cml4LCBvdXRwdXQpIHtcclxuXHJcbiAgICAgdmFyIGVsZW1lbnRzID0gdGhpcy5lbGVtZW50cztcclxuICAgICB2YXIgaGFzT3V0cHV0ID0gISFvdXRwdXQ7XHJcblxyXG4gICAgIHZhciBhID0gcGFyc2VGbG9hdChlbGVtZW50c1swXS50b0ZpeGVkKDMpKTtcclxuICAgICB2YXIgYiA9IHBhcnNlRmxvYXQoZWxlbWVudHNbMV0udG9GaXhlZCgzKSk7XHJcbiAgICAgdmFyIGMgPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzJdLnRvRml4ZWQoMykpO1xyXG4gICAgIHZhciBkID0gcGFyc2VGbG9hdChlbGVtZW50c1szXS50b0ZpeGVkKDMpKTtcclxuICAgICB2YXIgZSA9IHBhcnNlRmxvYXQoZWxlbWVudHNbNF0udG9GaXhlZCgzKSk7XHJcbiAgICAgdmFyIGYgPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzVdLnRvRml4ZWQoMykpO1xyXG5cclxuICAgICAgaWYgKCEhZnVsbE1hdHJpeCkge1xyXG5cclxuICAgICAgICB2YXIgZyA9IHBhcnNlRmxvYXQoZWxlbWVudHNbNl0udG9GaXhlZCgzKSk7XHJcbiAgICAgICAgdmFyIGggPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzddLnRvRml4ZWQoMykpO1xyXG4gICAgICAgIHZhciBpID0gcGFyc2VGbG9hdChlbGVtZW50c1s4XS50b0ZpeGVkKDMpKTtcclxuXHJcbiAgICAgICAgaWYgKGhhc091dHB1dCkge1xyXG4gICAgICAgICAgb3V0cHV0WzBdID0gYTtcclxuICAgICAgICAgIG91dHB1dFsxXSA9IGQ7XHJcbiAgICAgICAgICBvdXRwdXRbMl0gPSBnO1xyXG4gICAgICAgICAgb3V0cHV0WzNdID0gYjtcclxuICAgICAgICAgIG91dHB1dFs0XSA9IGU7XHJcbiAgICAgICAgICBvdXRwdXRbNV0gPSBoO1xyXG4gICAgICAgICAgb3V0cHV0WzZdID0gYztcclxuICAgICAgICAgIG91dHB1dFs3XSA9IGY7XHJcbiAgICAgICAgICBvdXRwdXRbOF0gPSBpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIGEsIGQsIGcsIGIsIGUsIGgsIGMsIGYsIGlcclxuICAgICAgICBdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoaGFzT3V0cHV0KSB7XHJcbiAgICAgICAgb3V0cHV0WzBdID0gYTtcclxuICAgICAgICBvdXRwdXRbMV0gPSBkO1xyXG4gICAgICAgIG91dHB1dFsyXSA9IGI7XHJcbiAgICAgICAgb3V0cHV0WzNdID0gZTtcclxuICAgICAgICBvdXRwdXRbNF0gPSBjO1xyXG4gICAgICAgIG91dHB1dFs1XSA9IGY7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gW1xyXG4gICAgICAgIGEsIGQsIGIsIGUsIGMsIGYgIC8vIFNwZWNpZmljIGZvcm1hdCBzZWUgTE46MTlcclxuICAgICAgXTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2xvbmUgdGhlIGN1cnJlbnQgbWF0cml4LlxyXG4gICAgICovXHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBhLCBiLCBjLCBkLCBlLCBmLCBnLCBoLCBpO1xyXG5cclxuICAgICAgYSA9IHRoaXMuZWxlbWVudHNbMF07XHJcbiAgICAgIGIgPSB0aGlzLmVsZW1lbnRzWzFdO1xyXG4gICAgICBjID0gdGhpcy5lbGVtZW50c1syXTtcclxuICAgICAgZCA9IHRoaXMuZWxlbWVudHNbM107XHJcbiAgICAgIGUgPSB0aGlzLmVsZW1lbnRzWzRdO1xyXG4gICAgICBmID0gdGhpcy5lbGVtZW50c1s1XTtcclxuICAgICAgZyA9IHRoaXMuZWxlbWVudHNbNl07XHJcbiAgICAgIGggPSB0aGlzLmVsZW1lbnRzWzddO1xyXG4gICAgICBpID0gdGhpcy5lbGVtZW50c1s4XTtcclxuXHJcbiAgICAgIHJldHVybiBuZXcgVHdvLk1hdHJpeChhLCBiLCBjLCBkLCBlLCBmLCBnLCBoLCBpKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgLy8gTG9jYWxpemUgdmFyaWFibGVzXHJcbiAgdmFyIG1vZCA9IFR3by5VdGlscy5tb2QsIHRvRml4ZWQgPSBUd28uVXRpbHMudG9GaXhlZDtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIHN2ZyA9IHtcclxuXHJcbiAgICB2ZXJzaW9uOiAxLjEsXHJcblxyXG4gICAgbnM6ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsXHJcbiAgICB4bGluazogJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLFxyXG5cclxuICAgIGFsaWdubWVudHM6IHtcclxuICAgICAgbGVmdDogJ3N0YXJ0JyxcclxuICAgICAgY2VudGVyOiAnbWlkZGxlJyxcclxuICAgICAgcmlnaHQ6ICdlbmQnXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGFuIHN2ZyBuYW1lc3BhY2VkIGVsZW1lbnQuXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZUVsZW1lbnQ6IGZ1bmN0aW9uKG5hbWUsIGF0dHJzKSB7XHJcbiAgICAgIHZhciB0YWcgPSBuYW1lO1xyXG4gICAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhzdmcubnMsIHRhZyk7XHJcbiAgICAgIGlmICh0YWcgPT09ICdzdmcnKSB7XHJcbiAgICAgICAgYXR0cnMgPSBfLmRlZmF1bHRzKGF0dHJzIHx8IHt9LCB7XHJcbiAgICAgICAgICB2ZXJzaW9uOiBzdmcudmVyc2lvblxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghXy5pc0VtcHR5KGF0dHJzKSkge1xyXG4gICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKGVsZW0sIGF0dHJzKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZWxlbTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgYXR0cmlidXRlcyBmcm9tIGFuIHN2ZyBlbGVtZW50LlxyXG4gICAgICovXHJcbiAgICBzZXRBdHRyaWJ1dGVzOiBmdW5jdGlvbihlbGVtLCBhdHRycykge1xyXG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGF0dHJzKTtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKC9ocmVmLy50ZXN0KGtleXNbaV0pKSB7XHJcbiAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZU5TKHN2Zy54bGluaywga2V5c1tpXSwgYXR0cnNba2V5c1tpXV0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShrZXlzW2ldLCBhdHRyc1trZXlzW2ldXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhdHRyaWJ1dGVzIGZyb20gYW4gc3ZnIGVsZW1lbnQuXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZUF0dHJpYnV0ZXM6IGZ1bmN0aW9uKGVsZW0sIGF0dHJzKSB7XHJcbiAgICAgIGZvciAodmFyIGtleSBpbiBhdHRycykge1xyXG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKGtleSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHVybiBhIHNldCBvZiB2ZXJ0aWNlcyBpbnRvIGEgc3RyaW5nIGZvciB0aGUgZCBwcm9wZXJ0eSBvZiBhIHBhdGhcclxuICAgICAqIGVsZW1lbnQuIEl0IGlzIGltcGVyYXRpdmUgdGhhdCB0aGUgc3RyaW5nIGNvbGxhdGlvbiBpcyBhcyBmYXN0IGFzXHJcbiAgICAgKiBwb3NzaWJsZSwgYmVjYXVzZSB0aGlzIGNhbGwgd2lsbCBiZSBoYXBwZW5pbmcgbXVsdGlwbGUgdGltZXMgYVxyXG4gICAgICogc2Vjb25kLlxyXG4gICAgICovXHJcbiAgICB0b1N0cmluZzogZnVuY3Rpb24ocG9pbnRzLCBjbG9zZWQpIHtcclxuXHJcbiAgICAgIHZhciBsID0gcG9pbnRzLmxlbmd0aCxcclxuICAgICAgICBsYXN0ID0gbCAtIDEsXHJcbiAgICAgICAgZCwgLy8gVGhlIGVsdXNpdmUgbGFzdCBUd28uQ29tbWFuZHMubW92ZSBwb2ludFxyXG4gICAgICAgIHJldCA9ICcnO1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB2YXIgYiA9IHBvaW50c1tpXTtcclxuICAgICAgICB2YXIgY29tbWFuZDtcclxuICAgICAgICB2YXIgcHJldiA9IGNsb3NlZCA/IG1vZChpIC0gMSwgbCkgOiBNYXRoLm1heChpIC0gMSwgMCk7XHJcbiAgICAgICAgdmFyIG5leHQgPSBjbG9zZWQgPyBtb2QoaSArIDEsIGwpIDogTWF0aC5taW4oaSArIDEsIGxhc3QpO1xyXG5cclxuICAgICAgICB2YXIgYSA9IHBvaW50c1twcmV2XTtcclxuICAgICAgICB2YXIgYyA9IHBvaW50c1tuZXh0XTtcclxuXHJcbiAgICAgICAgdmFyIHZ4LCB2eSwgdXgsIHV5LCBhciwgYmwsIGJyLCBjbDtcclxuXHJcbiAgICAgICAgLy8gQWNjZXNzIHggYW5kIHkgZGlyZWN0bHksXHJcbiAgICAgICAgLy8gYnlwYXNzaW5nIHRoZSBnZXR0ZXJcclxuICAgICAgICB2YXIgeCA9IHRvRml4ZWQoYi5feCk7XHJcbiAgICAgICAgdmFyIHkgPSB0b0ZpeGVkKGIuX3kpO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKGIuX2NvbW1hbmQpIHtcclxuXHJcbiAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5jbG9zZTpcclxuICAgICAgICAgICAgY29tbWFuZCA9IFR3by5Db21tYW5kcy5jbG9zZTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMuY3VydmU6XHJcblxyXG4gICAgICAgICAgICBhciA9IChhLmNvbnRyb2xzICYmIGEuY29udHJvbHMucmlnaHQpIHx8IFR3by5WZWN0b3IuemVybztcclxuICAgICAgICAgICAgYmwgPSAoYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLmxlZnQpIHx8IFR3by5WZWN0b3IuemVybztcclxuXHJcbiAgICAgICAgICAgIGlmIChhLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZCgoYXIueCArIGEueCkpO1xyXG4gICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZCgoYXIueSArIGEueSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZChhci54KTtcclxuICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoYXIueSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgIHV4ID0gdG9GaXhlZCgoYmwueCArIGIueCkpO1xyXG4gICAgICAgICAgICAgIHV5ID0gdG9GaXhlZCgoYmwueSArIGIueSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHV4ID0gdG9GaXhlZChibC54KTtcclxuICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoYmwueSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSAoKGkgPT09IDApID8gVHdvLkNvbW1hbmRzLm1vdmUgOiBUd28uQ29tbWFuZHMuY3VydmUpICtcclxuICAgICAgICAgICAgICAnICcgKyB2eCArICcgJyArIHZ5ICsgJyAnICsgdXggKyAnICcgKyB1eSArICcgJyArIHggKyAnICcgKyB5O1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5tb3ZlOlxyXG4gICAgICAgICAgICBkID0gYjtcclxuICAgICAgICAgICAgY29tbWFuZCA9IFR3by5Db21tYW5kcy5tb3ZlICsgJyAnICsgeCArICcgJyArIHk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSBiLl9jb21tYW5kICsgJyAnICsgeCArICcgJyArIHk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQWRkIGEgZmluYWwgcG9pbnQgYW5kIGNsb3NlIGl0IG9mZlxyXG5cclxuICAgICAgICBpZiAoaSA+PSBsYXN0ICYmIGNsb3NlZCkge1xyXG5cclxuICAgICAgICAgIGlmIChiLl9jb21tYW5kID09PSBUd28uQ29tbWFuZHMuY3VydmUpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBjbG9zZSB0byB0aGUgbW9zdCBwcmV2aW91cyBUd28uQ29tbWFuZHMubW92ZVxyXG4gICAgICAgICAgICBjID0gZDtcclxuXHJcbiAgICAgICAgICAgIGJyID0gKGIuY29udHJvbHMgJiYgYi5jb250cm9scy5yaWdodCkgfHwgYjtcclxuICAgICAgICAgICAgY2wgPSAoYy5jb250cm9scyAmJiBjLmNvbnRyb2xzLmxlZnQpIHx8IGM7XHJcblxyXG4gICAgICAgICAgICBpZiAoYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoKGJyLnggKyBiLngpKTtcclxuICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoKGJyLnkgKyBiLnkpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoYnIueCk7XHJcbiAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKGJyLnkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYy5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoKGNsLnggKyBjLngpKTtcclxuICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoKGNsLnkgKyBjLnkpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoY2wueCk7XHJcbiAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKGNsLnkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB4ID0gdG9GaXhlZChjLngpO1xyXG4gICAgICAgICAgICB5ID0gdG9GaXhlZChjLnkpO1xyXG5cclxuICAgICAgICAgICAgY29tbWFuZCArPVxyXG4gICAgICAgICAgICAgICcgQyAnICsgdnggKyAnICcgKyB2eSArICcgJyArIHV4ICsgJyAnICsgdXkgKyAnICcgKyB4ICsgJyAnICsgeTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjb21tYW5kICs9ICcgWic7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0ICs9IGNvbW1hbmQgKyAnICc7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmV0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0Q2xpcDogZnVuY3Rpb24oc2hhcGUpIHtcclxuXHJcbiAgICAgIHZhciBjbGlwID0gc2hhcGUuX3JlbmRlcmVyLmNsaXA7XHJcblxyXG4gICAgICBpZiAoIWNsaXApIHtcclxuXHJcbiAgICAgICAgdmFyIHJvb3QgPSBzaGFwZTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHJvb3QucGFyZW50KSB7XHJcbiAgICAgICAgICByb290ID0gcm9vdC5wYXJlbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjbGlwID0gc2hhcGUuX3JlbmRlcmVyLmNsaXAgPSBzdmcuY3JlYXRlRWxlbWVudCgnY2xpcFBhdGgnKTtcclxuICAgICAgICByb290LmRlZnMuYXBwZW5kQ2hpbGQoY2xpcCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gY2xpcDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGdyb3VwOiB7XHJcblxyXG4gICAgICAvLyBUT0RPOiBDYW4gc3BlZWQgdXAuXHJcbiAgICAgIC8vIFRPRE86IEhvdyBkb2VzIHRoaXMgZWZmZWN0IGEgZlxyXG4gICAgICBhcHBlbmRDaGlsZDogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICAgIHZhciBlbGVtID0gb2JqZWN0Ll9yZW5kZXJlci5lbGVtO1xyXG5cclxuICAgICAgICBpZiAoIWVsZW0pIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0YWcgPSBlbGVtLm5vZGVOYW1lO1xyXG5cclxuICAgICAgICBpZiAoIXRhZyB8fCAvKHJhZGlhbHxsaW5lYXIpZ3JhZGllbnQvaS50ZXN0KHRhZykgfHwgb2JqZWN0Ll9jbGlwKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmVsZW0uYXBwZW5kQ2hpbGQoZWxlbSk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVtb3ZlQ2hpbGQ6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgICB2YXIgZWxlbSA9IG9iamVjdC5fcmVuZGVyZXIuZWxlbTtcclxuXHJcbiAgICAgICAgaWYgKCFlbGVtIHx8IGVsZW0ucGFyZW50Tm9kZSAhPSB0aGlzLmVsZW0pIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0YWcgPSBlbGVtLm5vZGVOYW1lO1xyXG5cclxuICAgICAgICBpZiAoIXRhZykge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGVmZXIgc3VidHJhY3Rpb25zIHdoaWxlIGNsaXBwaW5nLlxyXG4gICAgICAgIGlmIChvYmplY3QuX2NsaXApIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZWxlbS5yZW1vdmVDaGlsZChlbGVtKTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBvcmRlckNoaWxkOiBmdW5jdGlvbihvYmplY3QpIHtcclxuICAgICAgICB0aGlzLmVsZW0uYXBwZW5kQ2hpbGQob2JqZWN0Ll9yZW5kZXJlci5lbGVtKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlbmRlckNoaWxkOiBmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIHN2Z1tjaGlsZC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoY2hpbGQsIHRoaXMpO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihkb21FbGVtZW50KSB7XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICAvLyBTaG9ydGN1dCBmb3IgaGlkZGVuIG9iamVjdHMuXHJcbiAgICAgICAgLy8gRG9lc24ndCByZXNldCB0aGUgZmxhZ3MsIHNvIGNoYW5nZXMgYXJlIHN0b3JlZCBhbmRcclxuICAgICAgICAvLyBhcHBsaWVkIG9uY2UgdGhlIG9iamVjdCBpcyB2aXNpYmxlIGFnYWluXHJcbiAgICAgICAgaWYgKHRoaXMuX29wYWNpdHkgPT09IDAgJiYgIXRoaXMuX2ZsYWdPcGFjaXR5KSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWxlbSkge1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbSA9IHN2Zy5jcmVhdGVFbGVtZW50KCdnJywge1xyXG4gICAgICAgICAgICBpZDogdGhpcy5pZFxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBkb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLmVsZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gX1VwZGF0ZSBzdHlsZXMgZm9yIHRoZSA8Zz5cclxuICAgICAgICB2YXIgZmxhZ01hdHJpeCA9IHRoaXMuX21hdHJpeC5tYW51YWwgfHwgdGhpcy5fZmxhZ01hdHJpeDtcclxuICAgICAgICB2YXIgY29udGV4dCA9IHtcclxuICAgICAgICAgIGRvbUVsZW1lbnQ6IGRvbUVsZW1lbnQsXHJcbiAgICAgICAgICBlbGVtOiB0aGlzLl9yZW5kZXJlci5lbGVtXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKGZsYWdNYXRyaXgpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0uc2V0QXR0cmlidXRlKCd0cmFuc2Zvcm0nLCAnbWF0cml4KCcgKyB0aGlzLl9tYXRyaXgudG9TdHJpbmcoKSArICcpJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICBzdmdbY2hpbGQuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGNoaWxkLCBkb21FbGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnT3BhY2l0eSkge1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5zZXRBdHRyaWJ1dGUoJ29wYWNpdHknLCB0aGlzLl9vcGFjaXR5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnQWRkaXRpb25zKSB7XHJcbiAgICAgICAgICB0aGlzLmFkZGl0aW9ucy5mb3JFYWNoKHN2Zy5ncm91cC5hcHBlbmRDaGlsZCwgY29udGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1N1YnRyYWN0aW9ucykge1xyXG4gICAgICAgICAgdGhpcy5zdWJ0cmFjdGlvbnMuZm9yRWFjaChzdmcuZ3JvdXAucmVtb3ZlQ2hpbGQsIGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdPcmRlcikge1xyXG4gICAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKHN2Zy5ncm91cC5vcmRlckNoaWxkLCBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENvbW1lbnRlZCB0d28td2F5IGZ1bmN0aW9uYWxpdHkgb2YgY2xpcHMgLyBtYXNrcyB3aXRoIGdyb3VwcyBhbmRcclxuICAgICAgICAgKiBwb2x5Z29ucy4gVW5jb21tZW50IHdoZW4gdGhpcyBidWcgaXMgZml4ZWQ6XHJcbiAgICAgICAgICogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM3MDk1MVxyXG4gICAgICAgICAqL1xyXG5cclxuICAgICAgICAvLyBpZiAodGhpcy5fZmxhZ0NsaXApIHtcclxuXHJcbiAgICAgICAgLy8gICBjbGlwID0gc3ZnLmdldENsaXAodGhpcyk7XHJcbiAgICAgICAgLy8gICBlbGVtID0gdGhpcy5fcmVuZGVyZXIuZWxlbTtcclxuXHJcbiAgICAgICAgLy8gICBpZiAodGhpcy5fY2xpcCkge1xyXG4gICAgICAgIC8vICAgICBlbGVtLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcclxuICAgICAgICAvLyAgICAgY2xpcC5zZXRBdHRyaWJ1dGUoJ2lkJywgdGhpcy5pZCk7XHJcbiAgICAgICAgLy8gICAgIGNsaXAuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgLy8gICB9IGVsc2Uge1xyXG4gICAgICAgIC8vICAgICBjbGlwLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcclxuICAgICAgICAvLyAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2lkJywgdGhpcy5pZCk7XHJcbiAgICAgICAgLy8gICAgIHRoaXMucGFyZW50Ll9yZW5kZXJlci5lbGVtLmFwcGVuZENoaWxkKGVsZW0pOyAvLyBUT0RPOiBzaG91bGQgYmUgaW5zZXJ0QmVmb3JlXHJcbiAgICAgICAgLy8gICB9XHJcblxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdNYXNrKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5fbWFzaykge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLnNldEF0dHJpYnV0ZSgnY2xpcC1wYXRoJywgJ3VybCgjJyArIHRoaXMuX21hc2suaWQgKyAnKScpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2NsaXAtcGF0aCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBwYXRoOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGRvbUVsZW1lbnQpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIC8vIFNob3J0Y3V0IGZvciBoaWRkZW4gb2JqZWN0cy5cclxuICAgICAgICAvLyBEb2Vzbid0IHJlc2V0IHRoZSBmbGFncywgc28gY2hhbmdlcyBhcmUgc3RvcmVkIGFuZFxyXG4gICAgICAgIC8vIGFwcGxpZWQgb25jZSB0aGUgb2JqZWN0IGlzIHZpc2libGUgYWdhaW5cclxuICAgICAgICBpZiAodGhpcy5fb3BhY2l0eSA9PT0gMCAmJiAhdGhpcy5fZmxhZ09wYWNpdHkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ29sbGVjdCBhbnkgYXR0cmlidXRlIHRoYXQgbmVlZHMgdG8gYmUgY2hhbmdlZCBoZXJlXHJcbiAgICAgICAgdmFyIGNoYW5nZWQgPSB7fTtcclxuXHJcbiAgICAgICAgdmFyIGZsYWdNYXRyaXggPSB0aGlzLl9tYXRyaXgubWFudWFsIHx8IHRoaXMuX2ZsYWdNYXRyaXg7XHJcblxyXG4gICAgICAgIGlmIChmbGFnTWF0cml4KSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnRyYW5zZm9ybSA9ICdtYXRyaXgoJyArIHRoaXMuX21hdHJpeC50b1N0cmluZygpICsgJyknO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdWZXJ0aWNlcykge1xyXG4gICAgICAgICAgdmFyIHZlcnRpY2VzID0gc3ZnLnRvU3RyaW5nKHRoaXMuX3ZlcnRpY2VzLCB0aGlzLl9jbG9zZWQpO1xyXG4gICAgICAgICAgY2hhbmdlZC5kID0gdmVydGljZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmlsbCAmJiB0aGlzLl9maWxsLl9yZW5kZXJlcikge1xyXG4gICAgICAgICAgdGhpcy5fZmlsbC5fdXBkYXRlKCk7XHJcbiAgICAgICAgICBzdmdbdGhpcy5fZmlsbC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwodGhpcy5fZmlsbCwgZG9tRWxlbWVudCwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0ZpbGwpIHtcclxuICAgICAgICAgIGNoYW5nZWQuZmlsbCA9IHRoaXMuX2ZpbGwgJiYgdGhpcy5fZmlsbC5pZFxyXG4gICAgICAgICAgICA/ICd1cmwoIycgKyB0aGlzLl9maWxsLmlkICsgJyknIDogdGhpcy5fZmlsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9zdHJva2UgJiYgdGhpcy5fc3Ryb2tlLl9yZW5kZXJlcikge1xyXG4gICAgICAgICAgdGhpcy5fc3Ryb2tlLl91cGRhdGUoKTtcclxuICAgICAgICAgIHN2Z1t0aGlzLl9zdHJva2UuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHRoaXMuX3N0cm9rZSwgZG9tRWxlbWVudCwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1N0cm9rZSkge1xyXG4gICAgICAgICAgY2hhbmdlZC5zdHJva2UgPSB0aGlzLl9zdHJva2UgJiYgdGhpcy5fc3Ryb2tlLmlkXHJcbiAgICAgICAgICAgID8gJ3VybCgjJyArIHRoaXMuX3N0cm9rZS5pZCArICcpJyA6IHRoaXMuX3N0cm9rZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnTGluZXdpZHRoKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydzdHJva2Utd2lkdGgnXSA9IHRoaXMuX2xpbmV3aWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnT3BhY2l0eSkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnc3Ryb2tlLW9wYWNpdHknXSA9IHRoaXMuX29wYWNpdHk7XHJcbiAgICAgICAgICBjaGFuZ2VkWydmaWxsLW9wYWNpdHknXSA9IHRoaXMuX29wYWNpdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1Zpc2libGUpIHtcclxuICAgICAgICAgIGNoYW5nZWQudmlzaWJpbGl0eSA9IHRoaXMuX3Zpc2libGUgPyAndmlzaWJsZScgOiAnaGlkZGVuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnQ2FwKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydzdHJva2UtbGluZWNhcCddID0gdGhpcy5fY2FwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdKb2luKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydzdHJva2UtbGluZWpvaW4nXSA9IHRoaXMuX2pvaW47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ01pdGVyKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydzdHJva2UtbWl0ZXJsaW1pdCddID0gdGhpcy5fbWl0ZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBhdHRhY2hlZCBET00gZWxlbWVudCB5ZXQsXHJcbiAgICAgICAgLy8gY3JlYXRlIGl0IHdpdGggYWxsIG5lY2Vzc2FyeSBhdHRyaWJ1dGVzLlxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWxlbSkge1xyXG5cclxuICAgICAgICAgIGNoYW5nZWQuaWQgPSB0aGlzLmlkO1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbSA9IHN2Zy5jcmVhdGVFbGVtZW50KCdwYXRoJywgY2hhbmdlZCk7XHJcbiAgICAgICAgICBkb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLmVsZW0pO1xyXG5cclxuICAgICAgICAvLyBPdGhlcndpc2UgYXBwbHkgYWxsIHBlbmRpbmcgYXR0cmlidXRlc1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyh0aGlzLl9yZW5kZXJlci5lbGVtLCBjaGFuZ2VkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnQ2xpcCkge1xyXG5cclxuICAgICAgICAgIHZhciBjbGlwID0gc3ZnLmdldENsaXAodGhpcyk7XHJcbiAgICAgICAgICB2YXIgZWxlbSA9IHRoaXMuX3JlbmRlcmVyLmVsZW07XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2NsaXApIHtcclxuICAgICAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7XHJcbiAgICAgICAgICAgIGNsaXAuc2V0QXR0cmlidXRlKCdpZCcsIHRoaXMuaWQpO1xyXG4gICAgICAgICAgICBjbGlwLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2xpcC5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7XHJcbiAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdpZCcsIHRoaXMuaWQpO1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudC5fcmVuZGVyZXIuZWxlbS5hcHBlbmRDaGlsZChlbGVtKTsgLy8gVE9ETzogc2hvdWxkIGJlIGluc2VydEJlZm9yZVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENvbW1lbnRlZCB0d28td2F5IGZ1bmN0aW9uYWxpdHkgb2YgY2xpcHMgLyBtYXNrcyB3aXRoIGdyb3VwcyBhbmRcclxuICAgICAgICAgKiBwb2x5Z29ucy4gVW5jb21tZW50IHdoZW4gdGhpcyBidWcgaXMgZml4ZWQ6XHJcbiAgICAgICAgICogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM3MDk1MVxyXG4gICAgICAgICAqL1xyXG5cclxuICAgICAgICAvLyBpZiAodGhpcy5fZmxhZ01hc2spIHtcclxuICAgICAgICAvLyAgIGlmICh0aGlzLl9tYXNrKSB7XHJcbiAgICAgICAgLy8gICAgIGVsZW0uc2V0QXR0cmlidXRlKCdjbGlwLXBhdGgnLCAndXJsKCMnICsgdGhpcy5fbWFzay5pZCArICcpJyk7XHJcbiAgICAgICAgLy8gICB9IGVsc2Uge1xyXG4gICAgICAgIC8vICAgICBlbGVtLnJlbW92ZUF0dHJpYnV0ZSgnY2xpcC1wYXRoJyk7XHJcbiAgICAgICAgLy8gICB9XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRleHQ6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZG9tRWxlbWVudCkge1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgdmFyIGNoYW5nZWQgPSB7fTtcclxuXHJcbiAgICAgICAgdmFyIGZsYWdNYXRyaXggPSB0aGlzLl9tYXRyaXgubWFudWFsIHx8IHRoaXMuX2ZsYWdNYXRyaXg7XHJcblxyXG4gICAgICAgIGlmIChmbGFnTWF0cml4KSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnRyYW5zZm9ybSA9ICdtYXRyaXgoJyArIHRoaXMuX21hdHJpeC50b1N0cmluZygpICsgJyknO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdGYW1pbHkpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ2ZvbnQtZmFtaWx5J10gPSB0aGlzLl9mYW1pbHk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU2l6ZSkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnZm9udC1zaXplJ10gPSB0aGlzLl9zaXplO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0xlYWRpbmcpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ2xpbmUtaGVpZ2h0J10gPSB0aGlzLl9sZWFkaW5nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0FsaWdubWVudCkge1xyXG4gICAgICAgICAgY2hhbmdlZFsndGV4dC1hbmNob3InXSA9IHN2Zy5hbGlnbm1lbnRzW3RoaXMuX2FsaWdubWVudF0gfHwgdGhpcy5fYWxpZ25tZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0Jhc2VsaW5lKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydhbGlnbm1lbnQtYmFzZWxpbmUnXSA9IGNoYW5nZWRbJ2RvbWluYW50LWJhc2VsaW5lJ10gPSB0aGlzLl9iYXNlbGluZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTdHlsZSkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnZm9udC1zdHlsZSddID0gdGhpcy5fc3R5bGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnV2VpZ2h0KSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydmb250LXdlaWdodCddID0gdGhpcy5fd2VpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0RlY29yYXRpb24pIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ3RleHQtZGVjb3JhdGlvbiddID0gdGhpcy5fZGVjb3JhdGlvbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZpbGwgJiYgdGhpcy5fZmlsbC5fcmVuZGVyZXIpIHtcclxuICAgICAgICAgIHRoaXMuX2ZpbGwuX3VwZGF0ZSgpO1xyXG4gICAgICAgICAgc3ZnW3RoaXMuX2ZpbGwuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHRoaXMuX2ZpbGwsIGRvbUVsZW1lbnQsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0ZpbGwpIHtcclxuICAgICAgICAgIGNoYW5nZWQuZmlsbCA9IHRoaXMuX2ZpbGwgJiYgdGhpcy5fZmlsbC5pZFxyXG4gICAgICAgICAgICA/ICd1cmwoIycgKyB0aGlzLl9maWxsLmlkICsgJyknIDogdGhpcy5fZmlsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX3N0cm9rZSAmJiB0aGlzLl9zdHJva2UuX3JlbmRlcmVyKSB7XHJcbiAgICAgICAgICB0aGlzLl9zdHJva2UuX3VwZGF0ZSgpO1xyXG4gICAgICAgICAgc3ZnW3RoaXMuX3N0cm9rZS5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwodGhpcy5fc3Ryb2tlLCBkb21FbGVtZW50LCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTdHJva2UpIHtcclxuICAgICAgICAgIGNoYW5nZWQuc3Ryb2tlID0gdGhpcy5fc3Ryb2tlICYmIHRoaXMuX3N0cm9rZS5pZFxyXG4gICAgICAgICAgICA/ICd1cmwoIycgKyB0aGlzLl9zdHJva2UuaWQgKyAnKScgOiB0aGlzLl9zdHJva2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnTGluZXdpZHRoKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydzdHJva2Utd2lkdGgnXSA9IHRoaXMuX2xpbmV3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdPcGFjaXR5KSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLm9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1Zpc2libGUpIHtcclxuICAgICAgICAgIGNoYW5nZWQudmlzaWJpbGl0eSA9IHRoaXMuX3Zpc2libGUgPyAndmlzaWJsZScgOiAnaGlkZGVuJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWxlbSkge1xyXG5cclxuICAgICAgICAgIGNoYW5nZWQuaWQgPSB0aGlzLmlkO1xyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0gPSBzdmcuY3JlYXRlRWxlbWVudCgndGV4dCcsIGNoYW5nZWQpO1xyXG4gICAgICAgICAgZG9tRWxlbWVudC5kZWZzLmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLmVsZW0pO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHRoaXMuX3JlbmRlcmVyLmVsZW0sIGNoYW5nZWQpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnQ2xpcCkge1xyXG5cclxuICAgICAgICAgIHZhciBjbGlwID0gc3ZnLmdldENsaXAodGhpcyk7XHJcbiAgICAgICAgICB2YXIgZWxlbSA9IHRoaXMuX3JlbmRlcmVyLmVsZW07XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2NsaXApIHtcclxuICAgICAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7XHJcbiAgICAgICAgICAgIGNsaXAuc2V0QXR0cmlidXRlKCdpZCcsIHRoaXMuaWQpO1xyXG4gICAgICAgICAgICBjbGlwLmFwcGVuZENoaWxkKGVsZW0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2xpcC5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7XHJcbiAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKCdpZCcsIHRoaXMuaWQpO1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudC5fcmVuZGVyZXIuZWxlbS5hcHBlbmRDaGlsZChlbGVtKTsgLy8gVE9ETzogc2hvdWxkIGJlIGluc2VydEJlZm9yZVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnVmFsdWUpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0udGV4dENvbnRlbnQgPSB0aGlzLl92YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgJ2xpbmVhci1ncmFkaWVudCc6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZG9tRWxlbWVudCwgc2lsZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghc2lsZW50KSB7XHJcbiAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjaGFuZ2VkID0ge307XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnRW5kUG9pbnRzKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLngxID0gdGhpcy5sZWZ0Ll94O1xyXG4gICAgICAgICAgY2hhbmdlZC55MSA9IHRoaXMubGVmdC5feTtcclxuICAgICAgICAgIGNoYW5nZWQueDIgPSB0aGlzLnJpZ2h0Ll94O1xyXG4gICAgICAgICAgY2hhbmdlZC55MiA9IHRoaXMucmlnaHQuX3k7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1NwcmVhZCkge1xyXG4gICAgICAgICAgY2hhbmdlZC5zcHJlYWRNZXRob2QgPSB0aGlzLl9zcHJlYWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBhdHRhY2hlZCBET00gZWxlbWVudCB5ZXQsXHJcbiAgICAgICAgLy8gY3JlYXRlIGl0IHdpdGggYWxsIG5lY2Vzc2FyeSBhdHRyaWJ1dGVzLlxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWxlbSkge1xyXG5cclxuICAgICAgICAgIGNoYW5nZWQuaWQgPSB0aGlzLmlkO1xyXG4gICAgICAgICAgY2hhbmdlZC5ncmFkaWVudFVuaXRzID0gJ3VzZXJTcGFjZU9uVXNlJztcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0gPSBzdmcuY3JlYXRlRWxlbWVudCgnbGluZWFyR3JhZGllbnQnLCBjaGFuZ2VkKTtcclxuICAgICAgICAgIGRvbUVsZW1lbnQuZGVmcy5hcHBlbmRDaGlsZCh0aGlzLl9yZW5kZXJlci5lbGVtKTtcclxuXHJcbiAgICAgICAgLy8gT3RoZXJ3aXNlIGFwcGx5IGFsbCBwZW5kaW5nIGF0dHJpYnV0ZXNcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHRoaXMuX3JlbmRlcmVyLmVsZW0sIGNoYW5nZWQpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3RvcHMpIHtcclxuXHJcbiAgICAgICAgICB2YXIgbGVuZ3RoQ2hhbmdlZCA9IHRoaXMuX3JlbmRlcmVyLmVsZW0uY2hpbGROb2Rlcy5sZW5ndGhcclxuICAgICAgICAgICAgIT09IHRoaXMuc3RvcHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgIGlmIChsZW5ndGhDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0uY2hpbGROb2Rlcy5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdG9wcy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHN0b3AgPSB0aGlzLnN0b3BzW2ldO1xyXG4gICAgICAgICAgICB2YXIgYXR0cnMgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdG9wLl9mbGFnT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgYXR0cnMub2Zmc2V0ID0gMTAwICogc3RvcC5fb2Zmc2V0ICsgJyUnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdG9wLl9mbGFnQ29sb3IpIHtcclxuICAgICAgICAgICAgICBhdHRyc1snc3RvcC1jb2xvciddID0gc3RvcC5fY29sb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN0b3AuX2ZsYWdPcGFjaXR5KSB7XHJcbiAgICAgICAgICAgICAgYXR0cnNbJ3N0b3Atb3BhY2l0eSddID0gc3RvcC5fb3BhY2l0eTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFzdG9wLl9yZW5kZXJlci5lbGVtKSB7XHJcbiAgICAgICAgICAgICAgc3RvcC5fcmVuZGVyZXIuZWxlbSA9IHN2Zy5jcmVhdGVFbGVtZW50KCdzdG9wJywgYXR0cnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHN0b3AuX3JlbmRlcmVyLmVsZW0sIGF0dHJzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGxlbmd0aENoYW5nZWQpIHtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLmFwcGVuZENoaWxkKHN0b3AuX3JlbmRlcmVyLmVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0b3AuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgJ3JhZGlhbC1ncmFkaWVudCc6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZG9tRWxlbWVudCwgc2lsZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghc2lsZW50KSB7XHJcbiAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjaGFuZ2VkID0ge307XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnQ2VudGVyKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLmN4ID0gdGhpcy5jZW50ZXIuX3g7XHJcbiAgICAgICAgICBjaGFuZ2VkLmN5ID0gdGhpcy5jZW50ZXIuX3k7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnRm9jYWwpIHtcclxuICAgICAgICAgIGNoYW5nZWQuZnggPSB0aGlzLmZvY2FsLl94O1xyXG4gICAgICAgICAgY2hhbmdlZC5meSA9IHRoaXMuZm9jYWwuX3k7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1JhZGl1cykge1xyXG4gICAgICAgICAgY2hhbmdlZC5yID0gdGhpcy5fcmFkaXVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTcHJlYWQpIHtcclxuICAgICAgICAgIGNoYW5nZWQuc3ByZWFkTWV0aG9kID0gdGhpcy5fc3ByZWFkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gYXR0YWNoZWQgRE9NIGVsZW1lbnQgeWV0LFxyXG4gICAgICAgIC8vIGNyZWF0ZSBpdCB3aXRoIGFsbCBuZWNlc3NhcnkgYXR0cmlidXRlcy5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVsZW0pIHtcclxuXHJcbiAgICAgICAgICBjaGFuZ2VkLmlkID0gdGhpcy5pZDtcclxuICAgICAgICAgIGNoYW5nZWQuZ3JhZGllbnRVbml0cyA9ICd1c2VyU3BhY2VPblVzZSc7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ3JhZGlhbEdyYWRpZW50JywgY2hhbmdlZCk7XHJcbiAgICAgICAgICBkb21FbGVtZW50LmRlZnMuYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyZXIuZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIE90aGVyd2lzZSBhcHBseSBhbGwgcGVuZGluZyBhdHRyaWJ1dGVzXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyh0aGlzLl9yZW5kZXJlci5lbGVtLCBjaGFuZ2VkKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1N0b3BzKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGxlbmd0aENoYW5nZWQgPSB0aGlzLl9yZW5kZXJlci5lbGVtLmNoaWxkTm9kZXMubGVuZ3RoXHJcbiAgICAgICAgICAgICE9PSB0aGlzLnN0b3BzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICBpZiAobGVuZ3RoQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLmNoaWxkTm9kZXMubGVuZ3RoID0gMDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3RvcHMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdG9wID0gdGhpcy5zdG9wc1tpXTtcclxuICAgICAgICAgICAgdmFyIGF0dHJzID0ge307XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RvcC5fZmxhZ09mZnNldCkge1xyXG4gICAgICAgICAgICAgIGF0dHJzLm9mZnNldCA9IDEwMCAqIHN0b3AuX29mZnNldCArICclJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3RvcC5fZmxhZ0NvbG9yKSB7XHJcbiAgICAgICAgICAgICAgYXR0cnNbJ3N0b3AtY29sb3InXSA9IHN0b3AuX2NvbG9yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdG9wLl9mbGFnT3BhY2l0eSkge1xyXG4gICAgICAgICAgICAgIGF0dHJzWydzdG9wLW9wYWNpdHknXSA9IHN0b3AuX29wYWNpdHk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghc3RvcC5fcmVuZGVyZXIuZWxlbSkge1xyXG4gICAgICAgICAgICAgIHN0b3AuX3JlbmRlcmVyLmVsZW0gPSBzdmcuY3JlYXRlRWxlbWVudCgnc3RvcCcsIGF0dHJzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyhzdG9wLl9yZW5kZXJlci5lbGVtLCBhdHRycyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChsZW5ndGhDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5hcHBlbmRDaGlsZChzdG9wLl9yZW5kZXJlci5lbGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzdG9wLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRleHR1cmU6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZG9tRWxlbWVudCwgc2lsZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghc2lsZW50KSB7XHJcbiAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjaGFuZ2VkID0ge307XHJcbiAgICAgICAgdmFyIHN0eWxlcyA9IHsgeDogMCwgeTogMCB9O1xyXG4gICAgICAgIHZhciBpbWFnZSA9IHRoaXMuaW1hZ2U7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnTG9hZGVkICYmIHRoaXMubG9hZGVkKSB7XHJcblxyXG4gICAgICAgICAgc3dpdGNoIChpbWFnZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdjYW52YXMnOlxyXG4gICAgICAgICAgICAgIHN0eWxlcy5ocmVmID0gc3R5bGVzWyd4bGluazpocmVmJ10gPSBpbWFnZS50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdpbWcnOlxyXG4gICAgICAgICAgICBjYXNlICdpbWFnZSc6XHJcbiAgICAgICAgICAgICAgc3R5bGVzLmhyZWYgPSBzdHlsZXNbJ3hsaW5rOmhyZWYnXSA9IHRoaXMuc3JjO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ09mZnNldCB8fCB0aGlzLl9mbGFnTG9hZGVkIHx8IHRoaXMuX2ZsYWdTY2FsZSkge1xyXG5cclxuICAgICAgICAgIGNoYW5nZWQueCA9IHRoaXMuX29mZnNldC54O1xyXG4gICAgICAgICAgY2hhbmdlZC55ID0gdGhpcy5fb2Zmc2V0Lnk7XHJcblxyXG4gICAgICAgICAgaWYgKGltYWdlKSB7XHJcblxyXG4gICAgICAgICAgICBjaGFuZ2VkLnggLT0gaW1hZ2Uud2lkdGggLyAyO1xyXG4gICAgICAgICAgICBjaGFuZ2VkLnkgLT0gaW1hZ2UuaGVpZ2h0IC8gMjtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgICBjaGFuZ2VkLnggKj0gdGhpcy5fc2NhbGUueDtcclxuICAgICAgICAgICAgICBjaGFuZ2VkLnkgKj0gdGhpcy5fc2NhbGUueTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjaGFuZ2VkLnggKj0gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgICAgICAgY2hhbmdlZC55ICo9IHRoaXMuX3NjYWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKGNoYW5nZWQueCA+IDApIHtcclxuICAgICAgICAgICAgY2hhbmdlZC54ICo9IC0gMTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChjaGFuZ2VkLnkgPiAwKSB7XHJcbiAgICAgICAgICAgIGNoYW5nZWQueSAqPSAtIDE7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTY2FsZSB8fCB0aGlzLl9mbGFnTG9hZGVkIHx8IHRoaXMuX2ZsYWdSZXBlYXQpIHtcclxuXHJcbiAgICAgICAgICBjaGFuZ2VkLndpZHRoID0gMDtcclxuICAgICAgICAgIGNoYW5nZWQuaGVpZ2h0ID0gMDtcclxuXHJcbiAgICAgICAgICBpZiAoaW1hZ2UpIHtcclxuXHJcbiAgICAgICAgICAgIHN0eWxlcy53aWR0aCA9IGNoYW5nZWQud2lkdGggPSBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgc3R5bGVzLmhlaWdodCA9IGNoYW5nZWQuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETzogSGFjayAvIEJhbmRhaWRcclxuICAgICAgICAgICAgc3dpdGNoICh0aGlzLl9yZXBlYXQpIHtcclxuICAgICAgICAgICAgICBjYXNlICduby1yZXBlYXQnOlxyXG4gICAgICAgICAgICAgICAgY2hhbmdlZC53aWR0aCArPSAxO1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlZC5oZWlnaHQgKz0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgY2hhbmdlZC53aWR0aCAqPSB0aGlzLl9zY2FsZS54O1xyXG4gICAgICAgICAgICAgIGNoYW5nZWQuaGVpZ2h0ICo9IHRoaXMuX3NjYWxlLnk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY2hhbmdlZC53aWR0aCAqPSB0aGlzLl9zY2FsZTtcclxuICAgICAgICAgICAgICBjaGFuZ2VkLmhlaWdodCAqPSB0aGlzLl9zY2FsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU2NhbGUgfHwgdGhpcy5fZmxhZ0xvYWRlZCkge1xyXG4gICAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5pbWFnZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5pbWFnZSA9IHN2Zy5jcmVhdGVFbGVtZW50KCdpbWFnZScsIHN0eWxlcyk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKCFfLmlzRW1wdHkoc3R5bGVzKSkge1xyXG4gICAgICAgICAgICBzdmcuc2V0QXR0cmlidXRlcyh0aGlzLl9yZW5kZXJlci5pbWFnZSwgc3R5bGVzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWxlbSkge1xyXG5cclxuICAgICAgICAgIGNoYW5nZWQuaWQgPSB0aGlzLmlkO1xyXG4gICAgICAgICAgY2hhbmdlZC5wYXR0ZXJuVW5pdHMgPSAndXNlclNwYWNlT25Vc2UnO1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbSA9IHN2Zy5jcmVhdGVFbGVtZW50KCdwYXR0ZXJuJywgY2hhbmdlZCk7XHJcbiAgICAgICAgICBkb21FbGVtZW50LmRlZnMuYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyZXIuZWxlbSk7XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoIV8uaXNFbXB0eShjaGFuZ2VkKSkge1xyXG5cclxuICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHRoaXMuX3JlbmRlcmVyLmVsZW0sIGNoYW5nZWQpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJlci5lbGVtICYmIHRoaXMuX3JlbmRlcmVyLmltYWdlICYmICF0aGlzLl9yZW5kZXJlci5hcHBlbmRlZCkge1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5hcHBlbmRDaGlsZCh0aGlzLl9yZW5kZXJlci5pbWFnZSk7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5hcHBlbmRlZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBjbGFzc1xyXG4gICAqL1xyXG4gIHZhciBSZW5kZXJlciA9IFR3b1tUd28uVHlwZXMuc3ZnXSA9IGZ1bmN0aW9uKHBhcmFtcykge1xyXG5cclxuICAgIHRoaXMuZG9tRWxlbWVudCA9IHBhcmFtcy5kb21FbGVtZW50IHx8IHN2Zy5jcmVhdGVFbGVtZW50KCdzdmcnKTtcclxuXHJcbiAgICB0aGlzLnNjZW5lID0gbmV3IFR3by5Hcm91cCgpO1xyXG4gICAgdGhpcy5zY2VuZS5wYXJlbnQgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuZGVmcyA9IHN2Zy5jcmVhdGVFbGVtZW50KCdkZWZzJyk7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5kZWZzKTtcclxuICAgIHRoaXMuZG9tRWxlbWVudC5kZWZzID0gdGhpcy5kZWZzO1xyXG4gICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFJlbmRlcmVyLCB7XHJcblxyXG4gICAgVXRpbHM6IHN2Z1xyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUmVuZGVyZXIucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgc2V0U2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG5cclxuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHRoaXMuZG9tRWxlbWVudCwge1xyXG4gICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICBoZWlnaHQ6IGhlaWdodFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHN2Zy5ncm91cC5yZW5kZXIuY2FsbCh0aGlzLnNjZW5lLCB0aGlzLmRvbUVsZW1lbnQpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0YW50c1xyXG4gICAqL1xyXG4gIHZhciBtb2QgPSBUd28uVXRpbHMubW9kLCB0b0ZpeGVkID0gVHdvLlV0aWxzLnRvRml4ZWQ7XHJcbiAgdmFyIGdldFJhdGlvID0gVHdvLlV0aWxzLmdldFJhdGlvO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICAvLyBSZXR1cm5zIHRydWUgaWYgdGhpcyBpcyBhIG5vbi10cmFuc2Zvcm1pbmcgbWF0cml4XHJcbiAgdmFyIGlzRGVmYXVsdE1hdHJpeCA9IGZ1bmN0aW9uIChtKSB7XHJcbiAgICByZXR1cm4gKG1bMF0gPT0gMSAmJiBtWzNdID09IDAgJiYgbVsxXSA9PSAwICYmIG1bNF0gPT0gMSAmJiBtWzJdID09IDAgJiYgbVs1XSA9PSAwKTtcclxuICB9O1xyXG5cclxuICB2YXIgY2FudmFzID0ge1xyXG5cclxuICAgIGlzSGlkZGVuOiAvKG5vbmV8dHJhbnNwYXJlbnQpL2ksXHJcblxyXG4gICAgYWxpZ25tZW50czoge1xyXG4gICAgICBsZWZ0OiAnc3RhcnQnLFxyXG4gICAgICBtaWRkbGU6ICdjZW50ZXInLFxyXG4gICAgICByaWdodDogJ2VuZCdcclxuICAgIH0sXHJcblxyXG4gICAgc2hpbTogZnVuY3Rpb24oZWxlbSkge1xyXG4gICAgICBlbGVtLnRhZ05hbWUgPSAnY2FudmFzJztcclxuICAgICAgZWxlbS5ub2RlVHlwZSA9IDE7XHJcbiAgICAgIHJldHVybiBlbGVtO1xyXG4gICAgfSxcclxuXHJcbiAgICBncm91cDoge1xyXG5cclxuICAgICAgcmVuZGVyQ2hpbGQ6IGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2FudmFzW2NoaWxkLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChjaGlsZCwgdGhpcy5jdHgsIHRydWUsIHRoaXMuY2xpcCk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCkge1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBBZGQgYSBjaGVjayBoZXJlIHRvIG9ubHkgaW52b2tlIF91cGRhdGUgaWYgbmVlZCBiZS5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMuX21hdHJpeC5lbGVtZW50cztcclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XHJcbiAgICAgICAgdGhpcy5fcmVuZGVyZXIub3BhY2l0eSA9IHRoaXMuX29wYWNpdHkgKiAocGFyZW50ICYmIHBhcmVudC5fcmVuZGVyZXIgPyBwYXJlbnQuX3JlbmRlcmVyLm9wYWNpdHkgOiAxKTtcclxuXHJcbiAgICAgICAgdmFyIGRlZmF1bHRNYXRyaXggPSBpc0RlZmF1bHRNYXRyaXgobWF0cml4KTtcclxuXHJcbiAgICAgICAgdmFyIG1hc2sgPSB0aGlzLl9tYXNrO1xyXG4gICAgICAgIC8vIHZhciBjbGlwID0gdGhpcy5fY2xpcDtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5jb250ZXh0KSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5jb250ZXh0ID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9yZW5kZXJlci5jb250ZXh0LmN0eCA9IGN0eDtcclxuICAgICAgICAvLyB0aGlzLl9yZW5kZXJlci5jb250ZXh0LmNsaXAgPSBjbGlwO1xyXG5cclxuICAgICAgICBpZiAoIWRlZmF1bHRNYXRyaXgpIHtcclxuICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICBjdHgudHJhbnNmb3JtKG1hdHJpeFswXSwgbWF0cml4WzNdLCBtYXRyaXhbMV0sIG1hdHJpeFs0XSwgbWF0cml4WzJdLCBtYXRyaXhbNV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1hc2spIHtcclxuICAgICAgICAgIGNhbnZhc1ttYXNrLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChtYXNrLCBjdHgsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3BhY2l0eSA+IDAgJiYgdGhpcy5zY2FsZSAhPT0gMCkge1xyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IHRoaXMuY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgIGNhbnZhc1tjaGlsZC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoY2hpbGQsIGN0eCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWRlZmF1bHRNYXRyaXgpIHtcclxuICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgIC8qKlxyXG4gICAgICAgICAqIENvbW1lbnRlZCB0d28td2F5IGZ1bmN0aW9uYWxpdHkgb2YgY2xpcHMgLyBtYXNrcyB3aXRoIGdyb3VwcyBhbmRcclxuICAgICAgICAgKiBwb2x5Z29ucy4gVW5jb21tZW50IHdoZW4gdGhpcyBidWcgaXMgZml4ZWQ6XHJcbiAgICAgICAgICogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM3MDk1MVxyXG4gICAgICAgICAqL1xyXG5cclxuICAgICAgICAvLyBpZiAoY2xpcCkge1xyXG4gICAgICAgIC8vICAgY3R4LmNsaXAoKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcGF0aDoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIGZvcmNlZCwgcGFyZW50Q2xpcHBlZCkge1xyXG5cclxuICAgICAgICB2YXIgbWF0cml4LCBzdHJva2UsIGxpbmV3aWR0aCwgZmlsbCwgb3BhY2l0eSwgdmlzaWJsZSwgY2FwLCBqb2luLCBtaXRlcixcclxuICAgICAgICAgICAgY2xvc2VkLCBjb21tYW5kcywgbGVuZ3RoLCBsYXN0LCBuZXh0LCBwcmV2LCBhLCBiLCBjLCBkLCB1eCwgdXksIHZ4LCB2eSxcclxuICAgICAgICAgICAgYXIsIGJsLCBiciwgY2wsIHgsIHksIG1hc2ssIGNsaXAsIGRlZmF1bHRNYXRyaXgsIGlzT2Zmc2V0O1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBBZGQgYSBjaGVjayBoZXJlIHRvIG9ubHkgaW52b2tlIF91cGRhdGUgaWYgbmVlZCBiZS5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgbWF0cml4ID0gdGhpcy5fbWF0cml4LmVsZW1lbnRzO1xyXG4gICAgICAgIHN0cm9rZSA9IHRoaXMuX3N0cm9rZTtcclxuICAgICAgICBsaW5ld2lkdGggPSB0aGlzLl9saW5ld2lkdGg7XHJcbiAgICAgICAgZmlsbCA9IHRoaXMuX2ZpbGw7XHJcbiAgICAgICAgb3BhY2l0eSA9IHRoaXMuX29wYWNpdHkgKiB0aGlzLnBhcmVudC5fcmVuZGVyZXIub3BhY2l0eTtcclxuICAgICAgICB2aXNpYmxlID0gdGhpcy5fdmlzaWJsZTtcclxuICAgICAgICBjYXAgPSB0aGlzLl9jYXA7XHJcbiAgICAgICAgam9pbiA9IHRoaXMuX2pvaW47XHJcbiAgICAgICAgbWl0ZXIgPSB0aGlzLl9taXRlcjtcclxuICAgICAgICBjbG9zZWQgPSB0aGlzLl9jbG9zZWQ7XHJcbiAgICAgICAgY29tbWFuZHMgPSB0aGlzLl92ZXJ0aWNlczsgLy8gQ29tbWFuZHNcclxuICAgICAgICBsZW5ndGggPSBjb21tYW5kcy5sZW5ndGg7XHJcbiAgICAgICAgbGFzdCA9IGxlbmd0aCAtIDE7XHJcbiAgICAgICAgZGVmYXVsdE1hdHJpeCA9IGlzRGVmYXVsdE1hdHJpeChtYXRyaXgpO1xyXG5cclxuICAgICAgICAvLyBtYXNrID0gdGhpcy5fbWFzaztcclxuICAgICAgICBjbGlwID0gdGhpcy5fY2xpcDtcclxuXHJcbiAgICAgICAgaWYgKCFmb3JjZWQgJiYgKCF2aXNpYmxlIHx8IGNsaXApKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRyYW5zZm9ybVxyXG4gICAgICAgIGlmICghZGVmYXVsdE1hdHJpeCkge1xyXG4gICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgIGN0eC50cmFuc2Zvcm0obWF0cml4WzBdLCBtYXRyaXhbM10sIG1hdHJpeFsxXSwgbWF0cml4WzRdLCBtYXRyaXhbMl0sIG1hdHJpeFs1XSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgIC8qKlxyXG4gICAgICAgICAqIENvbW1lbnRlZCB0d28td2F5IGZ1bmN0aW9uYWxpdHkgb2YgY2xpcHMgLyBtYXNrcyB3aXRoIGdyb3VwcyBhbmRcclxuICAgICAgICAgKiBwb2x5Z29ucy4gVW5jb21tZW50IHdoZW4gdGhpcyBidWcgaXMgZml4ZWQ6XHJcbiAgICAgICAgICogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM3MDk1MVxyXG4gICAgICAgICAqL1xyXG5cclxuICAgICAgICAvLyBpZiAobWFzaykge1xyXG4gICAgICAgIC8vICAgY2FudmFzW21hc2suX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKG1hc2ssIGN0eCwgdHJ1ZSk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAvLyBTdHlsZXNcclxuICAgICAgICBpZiAoZmlsbCkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoZmlsbCkpIHtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGZpbGw7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjYW52YXNbZmlsbC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoZmlsbCwgY3R4KTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGZpbGwuX3JlbmRlcmVyLmVmZmVjdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN0cm9rZSkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoc3Ryb2tlKSkge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2U7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjYW52YXNbc3Ryb2tlLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChzdHJva2UsIGN0eCk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZS5fcmVuZGVyZXIuZWZmZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGluZXdpZHRoKSB7XHJcbiAgICAgICAgICBjdHgubGluZVdpZHRoID0gbGluZXdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobWl0ZXIpIHtcclxuICAgICAgICAgIGN0eC5taXRlckxpbWl0ID0gbWl0ZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChqb2luKSB7XHJcbiAgICAgICAgICBjdHgubGluZUpvaW4gPSBqb2luO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY2FwKSB7XHJcbiAgICAgICAgICBjdHgubGluZUNhcCA9IGNhcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNOdW1iZXIob3BhY2l0eSkpIHtcclxuICAgICAgICAgIGN0eC5nbG9iYWxBbHBoYSA9IG9wYWNpdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29tbWFuZHMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICBiID0gY29tbWFuZHNbaV07XHJcblxyXG4gICAgICAgICAgeCA9IHRvRml4ZWQoYi5feCk7XHJcbiAgICAgICAgICB5ID0gdG9GaXhlZChiLl95KTtcclxuXHJcbiAgICAgICAgICBzd2l0Y2ggKGIuX2NvbW1hbmQpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLmNsb3NlOlxyXG4gICAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLmN1cnZlOlxyXG5cclxuICAgICAgICAgICAgICBwcmV2ID0gY2xvc2VkID8gbW9kKGkgLSAxLCBsZW5ndGgpIDogTWF0aC5tYXgoaSAtIDEsIDApO1xyXG4gICAgICAgICAgICAgIG5leHQgPSBjbG9zZWQgPyBtb2QoaSArIDEsIGxlbmd0aCkgOiBNYXRoLm1pbihpICsgMSwgbGFzdCk7XHJcblxyXG4gICAgICAgICAgICAgIGEgPSBjb21tYW5kc1twcmV2XTtcclxuICAgICAgICAgICAgICBjID0gY29tbWFuZHNbbmV4dF07XHJcbiAgICAgICAgICAgICAgYXIgPSAoYS5jb250cm9scyAmJiBhLmNvbnRyb2xzLnJpZ2h0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcbiAgICAgICAgICAgICAgYmwgPSAoYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLmxlZnQpIHx8IFR3by5WZWN0b3IuemVybztcclxuXHJcbiAgICAgICAgICAgICAgaWYgKGEuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICB2eCA9IChhci54ICsgdG9GaXhlZChhLl94KSk7XHJcbiAgICAgICAgICAgICAgICB2eSA9IChhci55ICsgdG9GaXhlZChhLl95KSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZChhci54KTtcclxuICAgICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZChhci55KTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgdXggPSAoYmwueCArIHRvRml4ZWQoYi5feCkpO1xyXG4gICAgICAgICAgICAgICAgdXkgPSAoYmwueSArIHRvRml4ZWQoYi5feSkpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoYmwueCk7XHJcbiAgICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoYmwueSk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2eCwgdnksIHV4LCB1eSwgeCwgeSk7XHJcblxyXG4gICAgICAgICAgICAgIGlmIChpID49IGxhc3QgJiYgY2xvc2VkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgYyA9IGQ7XHJcblxyXG4gICAgICAgICAgICAgICAgYnIgPSAoYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLnJpZ2h0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcbiAgICAgICAgICAgICAgICBjbCA9IChjLmNvbnRyb2xzICYmIGMuY29udHJvbHMubGVmdCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICB2eCA9IChici54ICsgdG9GaXhlZChiLl94KSk7XHJcbiAgICAgICAgICAgICAgICAgIHZ5ID0gKGJyLnkgKyB0b0ZpeGVkKGIuX3kpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZChici54KTtcclxuICAgICAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKGJyLnkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICB1eCA9IChjbC54ICsgdG9GaXhlZChjLl94KSk7XHJcbiAgICAgICAgICAgICAgICAgIHV5ID0gKGNsLnkgKyB0b0ZpeGVkKGMuX3kpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHV4ID0gdG9GaXhlZChjbC54KTtcclxuICAgICAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKGNsLnkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHggPSB0b0ZpeGVkKGMuX3gpO1xyXG4gICAgICAgICAgICAgICAgeSA9IHRvRml4ZWQoYy5feSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odngsIHZ5LCB1eCwgdXksIHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMubGluZTpcclxuICAgICAgICAgICAgICBjdHgubGluZVRvKHgsIHkpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMubW92ZTpcclxuICAgICAgICAgICAgICBkID0gYjtcclxuICAgICAgICAgICAgICBjdHgubW92ZVRvKHgsIHkpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIExvb3NlIGVuZHNcclxuXHJcbiAgICAgICAgaWYgKGNsb3NlZCkge1xyXG4gICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFjbGlwICYmICFwYXJlbnRDbGlwcGVkKSB7XHJcbiAgICAgICAgICBpZiAoIWNhbnZhcy5pc0hpZGRlbi50ZXN0KGZpbGwpKSB7XHJcbiAgICAgICAgICAgIGlzT2Zmc2V0ID0gZmlsbC5fcmVuZGVyZXIgJiYgZmlsbC5fcmVuZGVyZXIub2Zmc2V0XHJcbiAgICAgICAgICAgIGlmIChpc09mZnNldCkge1xyXG4gICAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShcclxuICAgICAgICAgICAgICAgIC0gZmlsbC5fcmVuZGVyZXIub2Zmc2V0LngsIC0gZmlsbC5fcmVuZGVyZXIub2Zmc2V0LnkpO1xyXG4gICAgICAgICAgICAgIGN0eC5zY2FsZShmaWxsLl9yZW5kZXJlci5zY2FsZS54LCBmaWxsLl9yZW5kZXJlci5zY2FsZS55KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgICBpZiAoaXNPZmZzZXQpIHtcclxuICAgICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoIWNhbnZhcy5pc0hpZGRlbi50ZXN0KHN0cm9rZSkpIHtcclxuICAgICAgICAgICAgaXNPZmZzZXQgPSBzdHJva2UuX3JlbmRlcmVyICYmIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0O1xyXG4gICAgICAgICAgICBpZiAoaXNPZmZzZXQpIHtcclxuICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoXHJcbiAgICAgICAgICAgICAgICAtIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LngsIC0gc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueSk7XHJcbiAgICAgICAgICAgICAgY3R4LnNjYWxlKHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueCwgc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55KTtcclxuICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gbGluZXdpZHRoIC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICAgICAgaWYgKGlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFkZWZhdWx0TWF0cml4KSB7XHJcbiAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNsaXAgJiYgIXBhcmVudENsaXBwZWQpIHtcclxuICAgICAgICAgIGN0eC5jbGlwKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRleHQ6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4LCBmb3JjZWQsIHBhcmVudENsaXBwZWQpIHtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQWRkIGEgY2hlY2sgaGVyZSB0byBvbmx5IGludm9rZSBfdXBkYXRlIGlmIG5lZWQgYmUuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIHZhciBtYXRyaXggPSB0aGlzLl9tYXRyaXguZWxlbWVudHM7XHJcbiAgICAgICAgdmFyIHN0cm9rZSA9IHRoaXMuX3N0cm9rZTtcclxuICAgICAgICB2YXIgbGluZXdpZHRoID0gdGhpcy5fbGluZXdpZHRoO1xyXG4gICAgICAgIHZhciBmaWxsID0gdGhpcy5fZmlsbDtcclxuICAgICAgICB2YXIgb3BhY2l0eSA9IHRoaXMuX29wYWNpdHkgKiB0aGlzLnBhcmVudC5fcmVuZGVyZXIub3BhY2l0eTtcclxuICAgICAgICB2YXIgdmlzaWJsZSA9IHRoaXMuX3Zpc2libGU7XHJcbiAgICAgICAgdmFyIGRlZmF1bHRNYXRyaXggPSBpc0RlZmF1bHRNYXRyaXgobWF0cml4KTtcclxuICAgICAgICB2YXIgaXNPZmZzZXQgPSBmaWxsLl9yZW5kZXJlciAmJiBmaWxsLl9yZW5kZXJlci5vZmZzZXRcclxuICAgICAgICAgICYmIHN0cm9rZS5fcmVuZGVyZXIgJiYgc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQ7XHJcblxyXG4gICAgICAgIHZhciBhLCBiLCBjLCBkLCBlLCBzeCwgc3k7XHJcblxyXG4gICAgICAgIC8vIG1hc2sgPSB0aGlzLl9tYXNrO1xyXG4gICAgICAgIHZhciBjbGlwID0gdGhpcy5fY2xpcDtcclxuXHJcbiAgICAgICAgaWYgKCFmb3JjZWQgJiYgKCF2aXNpYmxlIHx8IGNsaXApKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRyYW5zZm9ybVxyXG4gICAgICAgIGlmICghZGVmYXVsdE1hdHJpeCkge1xyXG4gICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgIGN0eC50cmFuc2Zvcm0obWF0cml4WzBdLCBtYXRyaXhbM10sIG1hdHJpeFsxXSwgbWF0cml4WzRdLCBtYXRyaXhbMl0sIG1hdHJpeFs1XSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgIC8qKlxyXG4gICAgICAgICAqIENvbW1lbnRlZCB0d28td2F5IGZ1bmN0aW9uYWxpdHkgb2YgY2xpcHMgLyBtYXNrcyB3aXRoIGdyb3VwcyBhbmRcclxuICAgICAgICAgKiBwb2x5Z29ucy4gVW5jb21tZW50IHdoZW4gdGhpcyBidWcgaXMgZml4ZWQ6XHJcbiAgICAgICAgICogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTM3MDk1MVxyXG4gICAgICAgICAqL1xyXG5cclxuICAgICAgICAvLyBpZiAobWFzaykge1xyXG4gICAgICAgIC8vICAgY2FudmFzW21hc2suX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKG1hc2ssIGN0eCwgdHJ1ZSk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpZiAoIWlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICBjdHguZm9udCA9IFt0aGlzLl9zdHlsZSwgdGhpcy5fd2VpZ2h0LCB0aGlzLl9zaXplICsgJ3B4LycgK1xyXG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nICsgJ3B4JywgdGhpcy5fZmFtaWx5XS5qb2luKCcgJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHgudGV4dEFsaWduID0gY2FudmFzLmFsaWdubWVudHNbdGhpcy5fYWxpZ25tZW50XSB8fCB0aGlzLl9hbGlnbm1lbnQ7XHJcbiAgICAgICAgY3R4LnRleHRCYXNlbGluZSA9IHRoaXMuX2Jhc2VsaW5lO1xyXG5cclxuICAgICAgICAvLyBTdHlsZXNcclxuICAgICAgICBpZiAoZmlsbCkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoZmlsbCkpIHtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGZpbGw7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjYW52YXNbZmlsbC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoZmlsbCwgY3R4KTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGZpbGwuX3JlbmRlcmVyLmVmZmVjdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN0cm9rZSkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoc3Ryb2tlKSkge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2U7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjYW52YXNbc3Ryb2tlLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChzdHJva2UsIGN0eCk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZS5fcmVuZGVyZXIuZWZmZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGluZXdpZHRoKSB7XHJcbiAgICAgICAgICBjdHgubGluZVdpZHRoID0gbGluZXdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc051bWJlcihvcGFjaXR5KSkge1xyXG4gICAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gb3BhY2l0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghY2xpcCAmJiAhcGFyZW50Q2xpcHBlZCkge1xyXG5cclxuICAgICAgICAgIGlmICghY2FudmFzLmlzSGlkZGVuLnRlc3QoZmlsbCkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChmaWxsLl9yZW5kZXJlciAmJiBmaWxsLl9yZW5kZXJlci5vZmZzZXQpIHtcclxuXHJcbiAgICAgICAgICAgICAgc3ggPSB0b0ZpeGVkKGZpbGwuX3JlbmRlcmVyLnNjYWxlLngpO1xyXG4gICAgICAgICAgICAgIHN5ID0gdG9GaXhlZChmaWxsLl9yZW5kZXJlci5zY2FsZS55KTtcclxuXHJcbiAgICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKCAtIHRvRml4ZWQoZmlsbC5fcmVuZGVyZXIub2Zmc2V0LngpLFxyXG4gICAgICAgICAgICAgICAgLSB0b0ZpeGVkKGZpbGwuX3JlbmRlcmVyLm9mZnNldC55KSk7XHJcbiAgICAgICAgICAgICAgY3R4LnNjYWxlKHN4LCBzeSk7XHJcblxyXG4gICAgICAgICAgICAgIGEgPSB0aGlzLl9zaXplIC8gZmlsbC5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgICBiID0gdGhpcy5fbGVhZGluZyAvIGZpbGwuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgICAgY3R4LmZvbnQgPSBbdGhpcy5fc3R5bGUsIHRoaXMuX3dlaWdodCwgdG9GaXhlZChhKSArICdweC8nLFxyXG4gICAgICAgICAgICAgICAgdG9GaXhlZChiKSArICdweCcsIHRoaXMuX2ZhbWlseV0uam9pbignICcpO1xyXG5cclxuICAgICAgICAgICAgICBjID0gZmlsbC5fcmVuZGVyZXIub2Zmc2V0LnggLyBmaWxsLl9yZW5kZXJlci5zY2FsZS54O1xyXG4gICAgICAgICAgICAgIGQgPSBmaWxsLl9yZW5kZXJlci5vZmZzZXQueSAvIGZpbGwuX3JlbmRlcmVyLnNjYWxlLnk7XHJcblxyXG4gICAgICAgICAgICAgIGN0eC5maWxsVGV4dCh0aGlzLnZhbHVlLCB0b0ZpeGVkKGMpLCB0b0ZpeGVkKGQpKTtcclxuICAgICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjdHguZmlsbFRleHQodGhpcy52YWx1ZSwgMCwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCFjYW52YXMuaXNIaWRkZW4udGVzdChzdHJva2UpKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3Ryb2tlLl9yZW5kZXJlciAmJiBzdHJva2UuX3JlbmRlcmVyLm9mZnNldCkge1xyXG5cclxuICAgICAgICAgICAgICBzeCA9IHRvRml4ZWQoc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54KTtcclxuICAgICAgICAgICAgICBzeSA9IHRvRml4ZWQoc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55KTtcclxuXHJcbiAgICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKC0gdG9GaXhlZChzdHJva2UuX3JlbmRlcmVyLm9mZnNldC54KSxcclxuICAgICAgICAgICAgICAgIC0gdG9GaXhlZChzdHJva2UuX3JlbmRlcmVyLm9mZnNldC55KSk7XHJcbiAgICAgICAgICAgICAgY3R4LnNjYWxlKHN4LCBzeSk7XHJcblxyXG4gICAgICAgICAgICAgIGEgPSB0aGlzLl9zaXplIC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICAgIGIgPSB0aGlzLl9sZWFkaW5nIC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICAgIGN0eC5mb250ID0gW3RoaXMuX3N0eWxlLCB0aGlzLl93ZWlnaHQsIHRvRml4ZWQoYSkgKyAncHgvJyxcclxuICAgICAgICAgICAgICAgIHRvRml4ZWQoYikgKyAncHgnLCB0aGlzLl9mYW1pbHldLmpvaW4oJyAnKTtcclxuXHJcbiAgICAgICAgICAgICAgYyA9IHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LnggLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLng7XHJcbiAgICAgICAgICAgICAgZCA9IHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LnkgLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgICAgZSA9IGxpbmV3aWR0aCAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueDtcclxuXHJcbiAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRvRml4ZWQoZSk7XHJcbiAgICAgICAgICAgICAgY3R4LnN0cm9rZVRleHQodGhpcy52YWx1ZSwgdG9GaXhlZChjKSwgdG9GaXhlZChkKSk7XHJcbiAgICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgY3R4LnN0cm9rZVRleHQodGhpcy52YWx1ZSwgMCwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZGVmYXVsdE1hdHJpeCkge1xyXG4gICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE86IFRlc3QgZm9yIHRleHRcclxuICAgICAgICBpZiAoY2xpcCAmJiAhcGFyZW50Q2xpcHBlZCkge1xyXG4gICAgICAgICAgY3R4LmNsaXAoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgJ2xpbmVhci1ncmFkaWVudCc6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4KSB7XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVmZmVjdCB8fCB0aGlzLl9mbGFnRW5kUG9pbnRzIHx8IHRoaXMuX2ZsYWdTdG9wcykge1xyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudChcclxuICAgICAgICAgICAgdGhpcy5sZWZ0Ll94LCB0aGlzLmxlZnQuX3ksXHJcbiAgICAgICAgICAgIHRoaXMucmlnaHQuX3gsIHRoaXMucmlnaHQuX3lcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0b3BzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzdG9wID0gdGhpcy5zdG9wc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0LmFkZENvbG9yU3RvcChzdG9wLl9vZmZzZXQsIHN0b3AuX2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgICdyYWRpYWwtZ3JhZGllbnQnOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCkge1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lZmZlY3QgfHwgdGhpcy5fZmxhZ0NlbnRlciB8fCB0aGlzLl9mbGFnRm9jYWxcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmxhZ1JhZGl1cyB8fCB0aGlzLl9mbGFnU3RvcHMpIHtcclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoXHJcbiAgICAgICAgICAgIHRoaXMuY2VudGVyLl94LCB0aGlzLmNlbnRlci5feSwgMCxcclxuICAgICAgICAgICAgdGhpcy5mb2NhbC5feCwgdGhpcy5mb2NhbC5feSwgdGhpcy5fcmFkaXVzXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdG9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgc3RvcCA9IHRoaXMuc3RvcHNbaV07XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdC5hZGRDb2xvclN0b3Aoc3RvcC5fb2Zmc2V0LCBzdG9wLl9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0dXJlOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCkge1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgdmFyIGltYWdlID0gdGhpcy5pbWFnZTtcclxuICAgICAgICB2YXIgcmVwZWF0O1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVmZmVjdCB8fCAoKHRoaXMuX2ZsYWdMb2FkZWQgfHwgdGhpcy5fZmxhZ0ltYWdlIHx8IHRoaXMuX2ZsYWdWaWRlbyB8fCB0aGlzLl9mbGFnUmVwZWF0KSAmJiB0aGlzLmxvYWRlZCkpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdCA9IGN0eC5jcmVhdGVQYXR0ZXJuKHRoaXMuaW1hZ2UsIHRoaXMuX3JlcGVhdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ09mZnNldCB8fCB0aGlzLl9mbGFnTG9hZGVkIHx8IHRoaXMuX2ZsYWdTY2FsZSkge1xyXG5cclxuICAgICAgICAgIGlmICghKHRoaXMuX3JlbmRlcmVyLm9mZnNldCBpbnN0YW5jZW9mIFR3by5WZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldCA9IG5ldyBUd28uVmVjdG9yKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnggPSAtIHRoaXMuX29mZnNldC54O1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnkgPSAtIHRoaXMuX29mZnNldC55O1xyXG5cclxuICAgICAgICAgIGlmIChpbWFnZSkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnggKz0gaW1hZ2Uud2lkdGggLyAyO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueSArPSBpbWFnZS5oZWlnaHQgLyAyO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC54ICo9IHRoaXMuX3NjYWxlLng7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnkgKj0gdGhpcy5fc2NhbGUueTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueCAqPSB0aGlzLl9zY2FsZTtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueSAqPSB0aGlzLl9zY2FsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU2NhbGUgfHwgdGhpcy5fZmxhZ0xvYWRlZCkge1xyXG5cclxuICAgICAgICAgIGlmICghKHRoaXMuX3JlbmRlcmVyLnNjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3RvcikpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUgPSBuZXcgVHdvLlZlY3RvcigpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUuY29weSh0aGlzLl9zY2FsZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZS5zZXQodGhpcy5fc2NhbGUsIHRoaXMuX3NjYWxlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIHZhciBSZW5kZXJlciA9IFR3b1tUd28uVHlwZXMuY2FudmFzXSA9IGZ1bmN0aW9uKHBhcmFtcykge1xyXG4gICAgLy8gU21vb3RoaW5nIHByb3BlcnR5LiBEZWZhdWx0cyB0byB0cnVlXHJcbiAgICAvLyBTZXQgaXQgdG8gZmFsc2Ugd2hlbiB3b3JraW5nIHdpdGggcGl4ZWwgYXJ0LlxyXG4gICAgLy8gZmFsc2UgY2FuIGxlYWQgdG8gYmV0dGVyIHBlcmZvcm1hbmNlLCBzaW5jZSBpdCB3b3VsZCB1c2UgYSBjaGVhcGVyIGludGVycG9sYXRpb24gYWxnb3JpdGhtLlxyXG4gICAgLy8gSXQgbWlnaHQgbm90IG1ha2UgYSBiaWcgZGlmZmVyZW5jZSBvbiBHUFUgYmFja2VkIGNhbnZhc2VzLlxyXG4gICAgdmFyIHNtb290aGluZyA9IChwYXJhbXMuc21vb3RoaW5nICE9PSBmYWxzZSk7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBwYXJhbXMuZG9tRWxlbWVudCB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgIHRoaXMuY3R4ID0gdGhpcy5kb21FbGVtZW50LmdldENvbnRleHQoJzJkJyk7XHJcbiAgICB0aGlzLm92ZXJkcmF3ID0gcGFyYW1zLm92ZXJkcmF3IHx8IGZhbHNlO1xyXG5cclxuICAgIGlmICghXy5pc1VuZGVmaW5lZCh0aGlzLmN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQpKSB7XHJcbiAgICAgIHRoaXMuY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IHNtb290aGluZztcclxuICAgIH1cclxuXHJcbiAgICAvLyBFdmVyeXRoaW5nIGRyYXduIG9uIHRoZSBjYW52YXMgbmVlZHMgdG8gYmUgYWRkZWQgdG8gdGhlIHNjZW5lLlxyXG4gICAgdGhpcy5zY2VuZSA9IG5ldyBUd28uR3JvdXAoKTtcclxuICAgIHRoaXMuc2NlbmUucGFyZW50ID0gdGhpcztcclxuICB9O1xyXG5cclxuXHJcbiAgXy5leHRlbmQoUmVuZGVyZXIsIHtcclxuXHJcbiAgICBVdGlsczogY2FudmFzXHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChSZW5kZXJlci5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICBzZXRTaXplOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCByYXRpbykge1xyXG5cclxuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgIHRoaXMucmF0aW8gPSBfLmlzVW5kZWZpbmVkKHJhdGlvKSA/IGdldFJhdGlvKHRoaXMuY3R4KSA6IHJhdGlvO1xyXG5cclxuICAgICAgdGhpcy5kb21FbGVtZW50LndpZHRoID0gd2lkdGggKiB0aGlzLnJhdGlvO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuaGVpZ2h0ID0gaGVpZ2h0ICogdGhpcy5yYXRpbztcclxuXHJcbiAgICAgIGlmICh0aGlzLmRvbUVsZW1lbnQuc3R5bGUpIHtcclxuICAgICAgICBfLmV4dGVuZCh0aGlzLmRvbUVsZW1lbnQuc3R5bGUsIHtcclxuICAgICAgICAgIHdpZHRoOiB3aWR0aCArICdweCcsXHJcbiAgICAgICAgICBoZWlnaHQ6IGhlaWdodCArICdweCdcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGlzT25lID0gdGhpcy5yYXRpbyA9PT0gMTtcclxuXHJcbiAgICAgIGlmICghaXNPbmUpIHtcclxuICAgICAgICB0aGlzLmN0eC5zYXZlKCk7XHJcbiAgICAgICAgdGhpcy5jdHguc2NhbGUodGhpcy5yYXRpbywgdGhpcy5yYXRpbyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghdGhpcy5vdmVyZHJhdykge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNhbnZhcy5ncm91cC5yZW5kZXIuY2FsbCh0aGlzLnNjZW5lLCB0aGlzLmN0eCk7XHJcblxyXG4gICAgICBpZiAoIWlzT25lKSB7XHJcbiAgICAgICAgdGhpcy5jdHgucmVzdG9yZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBmdW5jdGlvbiByZXNldFRyYW5zZm9ybShjdHgpIHtcclxuICAgIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcbiAgfVxyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RhbnRzXHJcbiAgICovXHJcblxyXG4gIHZhciByb290ID0gVHdvLnJvb3QsXHJcbiAgICBtdWx0aXBseU1hdHJpeCA9IFR3by5NYXRyaXguTXVsdGlwbHksXHJcbiAgICBtb2QgPSBUd28uVXRpbHMubW9kLFxyXG4gICAgaWRlbnRpdHkgPSBbMSwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMV0sXHJcbiAgICB0cmFuc2Zvcm1hdGlvbiA9IG5ldyBUd28uQXJyYXkoOSksXHJcbiAgICBnZXRSYXRpbyA9IFR3by5VdGlscy5nZXRSYXRpbyxcclxuICAgIGdldENvbXB1dGVkTWF0cml4ID0gVHdvLlV0aWxzLmdldENvbXB1dGVkTWF0cml4LFxyXG4gICAgdG9GaXhlZCA9IFR3by5VdGlscy50b0ZpeGVkLFxyXG4gICAgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIHdlYmdsID0ge1xyXG5cclxuICAgIGlzSGlkZGVuOiAvKG5vbmV8dHJhbnNwYXJlbnQpL2ksXHJcblxyXG4gICAgY2FudmFzOiAocm9vdC5kb2N1bWVudCA/IHJvb3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykgOiB7IGdldENvbnRleHQ6IF8uaWRlbnRpdHkgfSksXHJcblxyXG4gICAgYWxpZ25tZW50czoge1xyXG4gICAgICBsZWZ0OiAnc3RhcnQnLFxyXG4gICAgICBtaWRkbGU6ICdjZW50ZXInLFxyXG4gICAgICByaWdodDogJ2VuZCdcclxuICAgIH0sXHJcblxyXG4gICAgbWF0cml4OiBuZXcgVHdvLk1hdHJpeCgpLFxyXG5cclxuICAgIHV2OiBuZXcgVHdvLkFycmF5KFtcclxuICAgICAgMCwgMCxcclxuICAgICAgMSwgMCxcclxuICAgICAgMCwgMSxcclxuICAgICAgMCwgMSxcclxuICAgICAgMSwgMCxcclxuICAgICAgMSwgMVxyXG4gICAgXSksXHJcblxyXG4gICAgZ3JvdXA6IHtcclxuXHJcbiAgICAgIHJlbW92ZUNoaWxkOiBmdW5jdGlvbihjaGlsZCwgZ2wpIHtcclxuICAgICAgICBpZiAoY2hpbGQuY2hpbGRyZW4pIHtcclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGQuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgd2ViZ2wuZ3JvdXAucmVtb3ZlQ2hpbGQoY2hpbGQuY2hpbGRyZW5baV0sIGdsKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRGVhbGxvY2F0ZSB0ZXh0dXJlIHRvIGZyZWUgdXAgZ2wgbWVtb3J5LlxyXG4gICAgICAgIGdsLmRlbGV0ZVRleHR1cmUoY2hpbGQuX3JlbmRlcmVyLnRleHR1cmUpO1xyXG4gICAgICAgIGRlbGV0ZSBjaGlsZC5fcmVuZGVyZXIudGV4dHVyZTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlbmRlckNoaWxkOiBmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIHdlYmdsW2NoaWxkLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChjaGlsZCwgdGhpcy5nbCwgdGhpcy5wcm9ncmFtKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZ2wsIHByb2dyYW0pIHtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudDtcclxuICAgICAgICB2YXIgZmxhZ1BhcmVudE1hdHJpeCA9IChwYXJlbnQuX21hdHJpeCAmJiBwYXJlbnQuX21hdHJpeC5tYW51YWwpIHx8IHBhcmVudC5fZmxhZ01hdHJpeDtcclxuICAgICAgICB2YXIgZmxhZ01hdHJpeCA9IHRoaXMuX21hdHJpeC5tYW51YWwgfHwgdGhpcy5fZmxhZ01hdHJpeDtcclxuXHJcbiAgICAgICAgaWYgKGZsYWdQYXJlbnRNYXRyaXggfHwgZmxhZ01hdHJpeCkge1xyXG5cclxuICAgICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIubWF0cml4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm1hdHJpeCA9IG5ldyBUd28uQXJyYXkoOSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVkdWNlIGFtb3VudCBvZiBvYmplY3QgLyBhcnJheSBjcmVhdGlvbiAvIGRlbGV0aW9uXHJcbiAgICAgICAgICB0aGlzLl9tYXRyaXgudG9BcnJheSh0cnVlLCB0cmFuc2Zvcm1hdGlvbik7XHJcblxyXG4gICAgICAgICAgbXVsdGlwbHlNYXRyaXgodHJhbnNmb3JtYXRpb24sIHBhcmVudC5fcmVuZGVyZXIubWF0cml4LCB0aGlzLl9yZW5kZXJlci5tYXRyaXgpO1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUgPSB0aGlzLl9zY2FsZSAqIHBhcmVudC5fcmVuZGVyZXIuc2NhbGU7XHJcblxyXG4gICAgICAgICAgaWYgKGZsYWdQYXJlbnRNYXRyaXgpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmxhZ01hdHJpeCA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX21hc2spIHtcclxuXHJcbiAgICAgICAgICBnbC5lbmFibGUoZ2wuU1RFTkNJTF9URVNUKTtcclxuICAgICAgICAgIGdsLnN0ZW5jaWxGdW5jKGdsLkFMV0FZUywgMSwgMSk7XHJcblxyXG4gICAgICAgICAgZ2wuY29sb3JNYXNrKGZhbHNlLCBmYWxzZSwgZmFsc2UsIHRydWUpO1xyXG4gICAgICAgICAgZ2wuc3RlbmNpbE9wKGdsLktFRVAsIGdsLktFRVAsIGdsLklOQ1IpO1xyXG5cclxuICAgICAgICAgIHdlYmdsW3RoaXMuX21hc2suX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHRoaXMuX21hc2ssIGdsLCBwcm9ncmFtLCB0aGlzKTtcclxuXHJcbiAgICAgICAgICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBnbC5zdGVuY2lsRnVuYyhnbC5OT1RFUVVBTCwgMCwgMSk7XHJcbiAgICAgICAgICBnbC5zdGVuY2lsT3AoZ2wuS0VFUCwgZ2wuS0VFUCwgZ2wuS0VFUCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fZmxhZ09wYWNpdHkgPSBwYXJlbnQuX2ZsYWdPcGFjaXR5IHx8IHRoaXMuX2ZsYWdPcGFjaXR5O1xyXG5cclxuICAgICAgICB0aGlzLl9yZW5kZXJlci5vcGFjaXR5ID0gdGhpcy5fb3BhY2l0eVxyXG4gICAgICAgICAgKiAocGFyZW50ICYmIHBhcmVudC5fcmVuZGVyZXIgPyBwYXJlbnQuX3JlbmRlcmVyLm9wYWNpdHkgOiAxKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTdWJ0cmFjdGlvbnMpIHtcclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJ0cmFjdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgd2ViZ2wuZ3JvdXAucmVtb3ZlQ2hpbGQodGhpcy5zdWJ0cmFjdGlvbnNbaV0sIGdsKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaCh3ZWJnbC5ncm91cC5yZW5kZXJDaGlsZCwge1xyXG4gICAgICAgICAgZ2w6IGdsLFxyXG4gICAgICAgICAgcHJvZ3JhbTogcHJvZ3JhbVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fbWFzaykge1xyXG5cclxuICAgICAgICAgIGdsLmNvbG9yTWFzayhmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgICBnbC5zdGVuY2lsT3AoZ2wuS0VFUCwgZ2wuS0VFUCwgZ2wuREVDUik7XHJcblxyXG4gICAgICAgICAgd2ViZ2xbdGhpcy5fbWFzay5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwodGhpcy5fbWFzaywgZ2wsIHByb2dyYW0sIHRoaXMpO1xyXG5cclxuICAgICAgICAgIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGdsLnN0ZW5jaWxGdW5jKGdsLk5PVEVRVUFMLCAwLCAxKTtcclxuICAgICAgICAgIGdsLnN0ZW5jaWxPcChnbC5LRUVQLCBnbC5LRUVQLCBnbC5LRUVQKTtcclxuXHJcbiAgICAgICAgICBnbC5kaXNhYmxlKGdsLlNURU5DSUxfVEVTVCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBwYXRoOiB7XHJcblxyXG4gICAgICB1cGRhdGVDYW52YXM6IGZ1bmN0aW9uKGVsZW0pIHtcclxuXHJcbiAgICAgICAgdmFyIG5leHQsIHByZXYsIGEsIGMsIHV4LCB1eSwgdngsIHZ5LCBhciwgYmwsIGJyLCBjbCwgeCwgeTtcclxuICAgICAgICB2YXIgaXNPZmZzZXQ7XHJcblxyXG4gICAgICAgIHZhciBjb21tYW5kcyA9IGVsZW0uX3ZlcnRpY2VzO1xyXG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcztcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5jdHg7XHJcblxyXG4gICAgICAgIC8vIFN0eWxlc1xyXG4gICAgICAgIHZhciBzY2FsZSA9IGVsZW0uX3JlbmRlcmVyLnNjYWxlO1xyXG4gICAgICAgIHZhciBzdHJva2UgPSBlbGVtLl9zdHJva2U7XHJcbiAgICAgICAgdmFyIGxpbmV3aWR0aCA9IGVsZW0uX2xpbmV3aWR0aDtcclxuICAgICAgICB2YXIgZmlsbCA9IGVsZW0uX2ZpbGw7XHJcbiAgICAgICAgdmFyIG9wYWNpdHkgPSBlbGVtLl9yZW5kZXJlci5vcGFjaXR5IHx8IGVsZW0uX29wYWNpdHk7XHJcbiAgICAgICAgdmFyIGNhcCA9IGVsZW0uX2NhcDtcclxuICAgICAgICB2YXIgam9pbiA9IGVsZW0uX2pvaW47XHJcbiAgICAgICAgdmFyIG1pdGVyID0gZWxlbS5fbWl0ZXI7XHJcbiAgICAgICAgdmFyIGNsb3NlZCA9IGVsZW0uX2Nsb3NlZDtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gY29tbWFuZHMubGVuZ3RoO1xyXG4gICAgICAgIHZhciBsYXN0ID0gbGVuZ3RoIC0gMTtcclxuXHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gTWF0aC5tYXgoTWF0aC5jZWlsKGVsZW0uX3JlbmRlcmVyLnJlY3Qud2lkdGggKiBzY2FsZSksIDEpO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBNYXRoLm1heChNYXRoLmNlaWwoZWxlbS5fcmVuZGVyZXIucmVjdC5oZWlnaHQgKiBzY2FsZSksIDEpO1xyXG5cclxuICAgICAgICB2YXIgY2VudHJvaWQgPSBlbGVtLl9yZW5kZXJlci5yZWN0LmNlbnRyb2lkO1xyXG4gICAgICAgIHZhciBjeCA9IGNlbnRyb2lkLng7XHJcbiAgICAgICAgdmFyIGN5ID0gY2VudHJvaWQueTtcclxuXHJcbiAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG5cclxuICAgICAgICBpZiAoZmlsbCkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoZmlsbCkpIHtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGZpbGw7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3ZWJnbFtmaWxsLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChmaWxsLCBjdHgsIGVsZW0pO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZmlsbC5fcmVuZGVyZXIuZWZmZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3Ryb2tlKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyhzdHJva2UpKSB7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdlYmdsW3N0cm9rZS5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoc3Ryb2tlLCBjdHgsIGVsZW0pO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2UuX3JlbmRlcmVyLmVmZmVjdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxpbmV3aWR0aCkge1xyXG4gICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGxpbmV3aWR0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1pdGVyKSB7XHJcbiAgICAgICAgICBjdHgubWl0ZXJMaW1pdCA9IG1pdGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoam9pbikge1xyXG4gICAgICAgICAgY3R4LmxpbmVKb2luID0gam9pbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNhcCkge1xyXG4gICAgICAgICAgY3R4LmxpbmVDYXAgPSBjYXA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzTnVtYmVyKG9wYWNpdHkpKSB7XHJcbiAgICAgICAgICBjdHguZ2xvYmFsQWxwaGEgPSBvcGFjaXR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGQ7XHJcbiAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICBjdHguc2NhbGUoc2NhbGUsIHNjYWxlKTtcclxuICAgICAgICBjdHgudHJhbnNsYXRlKGN4LCBjeSk7XHJcblxyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbW1hbmRzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgYiA9IGNvbW1hbmRzW2ldO1xyXG5cclxuICAgICAgICAgIHggPSB0b0ZpeGVkKGIuX3gpO1xyXG4gICAgICAgICAgeSA9IHRvRml4ZWQoYi5feSk7XHJcblxyXG4gICAgICAgICAgc3dpdGNoIChiLl9jb21tYW5kKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5jbG9zZTpcclxuICAgICAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5jdXJ2ZTpcclxuXHJcbiAgICAgICAgICAgICAgcHJldiA9IGNsb3NlZCA/IG1vZChpIC0gMSwgbGVuZ3RoKSA6IE1hdGgubWF4KGkgLSAxLCAwKTtcclxuICAgICAgICAgICAgICBuZXh0ID0gY2xvc2VkID8gbW9kKGkgKyAxLCBsZW5ndGgpIDogTWF0aC5taW4oaSArIDEsIGxhc3QpO1xyXG5cclxuICAgICAgICAgICAgICBhID0gY29tbWFuZHNbcHJldl07XHJcbiAgICAgICAgICAgICAgYyA9IGNvbW1hbmRzW25leHRdO1xyXG4gICAgICAgICAgICAgIGFyID0gKGEuY29udHJvbHMgJiYgYS5jb250cm9scy5yaWdodCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG4gICAgICAgICAgICAgIGJsID0gKGIuY29udHJvbHMgJiYgYi5jb250cm9scy5sZWZ0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcblxyXG4gICAgICAgICAgICAgIGlmIChhLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKChhci54ICsgYS5feCkpO1xyXG4gICAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKChhci55ICsgYS5feSkpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoYXIueCk7XHJcbiAgICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoYXIueSk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiAoYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgIHV4ID0gdG9GaXhlZCgoYmwueCArIGIuX3gpKTtcclxuICAgICAgICAgICAgICAgIHV5ID0gdG9GaXhlZCgoYmwueSArIGIuX3kpKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKGJsLngpO1xyXG4gICAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKGJsLnkpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odngsIHZ5LCB1eCwgdXksIHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoaSA+PSBsYXN0ICYmIGNsb3NlZCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGMgPSBkO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyID0gKGIuY29udHJvbHMgJiYgYi5jb250cm9scy5yaWdodCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG4gICAgICAgICAgICAgICAgY2wgPSAoYy5jb250cm9scyAmJiBjLmNvbnRyb2xzLmxlZnQpIHx8IFR3by5WZWN0b3IuemVybztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKChici54ICsgYi5feCkpO1xyXG4gICAgICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoKGJyLnkgKyBiLl95KSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoYnIueCk7XHJcbiAgICAgICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZChici55KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYy5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKChjbC54ICsgYy5feCkpO1xyXG4gICAgICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoKGNsLnkgKyBjLl95KSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoY2wueCk7XHJcbiAgICAgICAgICAgICAgICAgIHV5ID0gdG9GaXhlZChjbC55KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB4ID0gdG9GaXhlZChjLl94KTtcclxuICAgICAgICAgICAgICAgIHkgPSB0b0ZpeGVkKGMuX3kpO1xyXG5cclxuICAgICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZ4LCB2eSwgdXgsIHV5LCB4LCB5KTtcclxuXHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLmxpbmU6XHJcbiAgICAgICAgICAgICAgY3R4LmxpbmVUbyh4LCB5KTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLm1vdmU6XHJcbiAgICAgICAgICAgICAgZCA9IGI7XHJcbiAgICAgICAgICAgICAgY3R4Lm1vdmVUbyh4LCB5KTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTG9vc2UgZW5kc1xyXG5cclxuICAgICAgICBpZiAoY2xvc2VkKSB7XHJcbiAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXdlYmdsLmlzSGlkZGVuLnRlc3QoZmlsbCkpIHtcclxuICAgICAgICAgIGlzT2Zmc2V0ID0gZmlsbC5fcmVuZGVyZXIgJiYgZmlsbC5fcmVuZGVyZXIub2Zmc2V0XHJcbiAgICAgICAgICBpZiAoaXNPZmZzZXQpIHtcclxuICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShcclxuICAgICAgICAgICAgICAtIGZpbGwuX3JlbmRlcmVyLm9mZnNldC54LCAtIGZpbGwuX3JlbmRlcmVyLm9mZnNldC55KTtcclxuICAgICAgICAgICAgY3R4LnNjYWxlKGZpbGwuX3JlbmRlcmVyLnNjYWxlLngsIGZpbGwuX3JlbmRlcmVyLnNjYWxlLnkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICAgIGlmIChpc09mZnNldCkge1xyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF3ZWJnbC5pc0hpZGRlbi50ZXN0KHN0cm9rZSkpIHtcclxuICAgICAgICAgIGlzT2Zmc2V0ID0gc3Ryb2tlLl9yZW5kZXJlciAmJiBzdHJva2UuX3JlbmRlcmVyLm9mZnNldDtcclxuICAgICAgICAgIGlmIChpc09mZnNldCkge1xyXG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKFxyXG4gICAgICAgICAgICAgIC0gc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueCwgLSBzdHJva2UuX3JlbmRlcmVyLm9mZnNldC55KTtcclxuICAgICAgICAgICAgY3R4LnNjYWxlKHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueCwgc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55KTtcclxuICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IGxpbmV3aWR0aCAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICAgIGlmIChpc09mZnNldCkge1xyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogUmV0dXJucyB0aGUgcmVjdCBvZiBhIHNldCBvZiB2ZXJ0cy4gVHlwaWNhbGx5IHRha2VzIHZlcnRpY2VzIHRoYXQgYXJlXHJcbiAgICAgICAqIFwiY2VudGVyZWRcIiBhcm91bmQgMCBhbmQgcmV0dXJucyB0aGVtIHRvIGJlIGFuY2hvcmVkIHVwcGVyLWxlZnQuXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IGZ1bmN0aW9uKHZlcnRpY2VzLCBib3JkZXIsIHJlY3QpIHtcclxuXHJcbiAgICAgICAgdmFyIGxlZnQgPSBJbmZpbml0eSwgcmlnaHQgPSAtSW5maW5pdHksXHJcbiAgICAgICAgICAgIHRvcCA9IEluZmluaXR5LCBib3R0b20gPSAtSW5maW5pdHksXHJcbiAgICAgICAgICAgIHdpZHRoLCBoZWlnaHQ7XHJcblxyXG4gICAgICAgIHZlcnRpY2VzLmZvckVhY2goZnVuY3Rpb24odikge1xyXG5cclxuICAgICAgICAgIHZhciB4ID0gdi54LCB5ID0gdi55LCBjb250cm9scyA9IHYuY29udHJvbHM7XHJcbiAgICAgICAgICB2YXIgYSwgYiwgYywgZCwgY2wsIGNyO1xyXG5cclxuICAgICAgICAgIHRvcCA9IE1hdGgubWluKHksIHRvcCk7XHJcbiAgICAgICAgICBsZWZ0ID0gTWF0aC5taW4oeCwgbGVmdCk7XHJcbiAgICAgICAgICByaWdodCA9IE1hdGgubWF4KHgsIHJpZ2h0KTtcclxuICAgICAgICAgIGJvdHRvbSA9IE1hdGgubWF4KHksIGJvdHRvbSk7XHJcblxyXG4gICAgICAgICAgaWYgKCF2LmNvbnRyb2xzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjbCA9IGNvbnRyb2xzLmxlZnQ7XHJcbiAgICAgICAgICBjciA9IGNvbnRyb2xzLnJpZ2h0O1xyXG5cclxuICAgICAgICAgIGlmICghY2wgfHwgIWNyKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBhID0gdi5fcmVsYXRpdmUgPyBjbC54ICsgeCA6IGNsLng7XHJcbiAgICAgICAgICBiID0gdi5fcmVsYXRpdmUgPyBjbC55ICsgeSA6IGNsLnk7XHJcbiAgICAgICAgICBjID0gdi5fcmVsYXRpdmUgPyBjci54ICsgeCA6IGNyLng7XHJcbiAgICAgICAgICBkID0gdi5fcmVsYXRpdmUgPyBjci55ICsgeSA6IGNyLnk7XHJcblxyXG4gICAgICAgICAgaWYgKCFhIHx8ICFiIHx8ICFjIHx8ICFkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0b3AgPSBNYXRoLm1pbihiLCBkLCB0b3ApO1xyXG4gICAgICAgICAgbGVmdCA9IE1hdGgubWluKGEsIGMsIGxlZnQpO1xyXG4gICAgICAgICAgcmlnaHQgPSBNYXRoLm1heChhLCBjLCByaWdodCk7XHJcbiAgICAgICAgICBib3R0b20gPSBNYXRoLm1heChiLCBkLCBib3R0b20pO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gRXhwYW5kIGJvcmRlcnNcclxuXHJcbiAgICAgICAgaWYgKF8uaXNOdW1iZXIoYm9yZGVyKSkge1xyXG4gICAgICAgICAgdG9wIC09IGJvcmRlcjtcclxuICAgICAgICAgIGxlZnQgLT0gYm9yZGVyO1xyXG4gICAgICAgICAgcmlnaHQgKz0gYm9yZGVyO1xyXG4gICAgICAgICAgYm90dG9tICs9IGJvcmRlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdpZHRoID0gcmlnaHQgLSBsZWZ0O1xyXG4gICAgICAgIGhlaWdodCA9IGJvdHRvbSAtIHRvcDtcclxuXHJcbiAgICAgICAgcmVjdC50b3AgPSB0b3A7XHJcbiAgICAgICAgcmVjdC5sZWZ0ID0gbGVmdDtcclxuICAgICAgICByZWN0LnJpZ2h0ID0gcmlnaHQ7XHJcbiAgICAgICAgcmVjdC5ib3R0b20gPSBib3R0b207XHJcbiAgICAgICAgcmVjdC53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHJlY3QuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgICBpZiAoIXJlY3QuY2VudHJvaWQpIHtcclxuICAgICAgICAgIHJlY3QuY2VudHJvaWQgPSB7fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlY3QuY2VudHJvaWQueCA9IC0gbGVmdDtcclxuICAgICAgICByZWN0LmNlbnRyb2lkLnkgPSAtIHRvcDtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGdsLCBwcm9ncmFtLCBmb3JjZWRQYXJlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl92aXNpYmxlIHx8ICF0aGlzLl9vcGFjaXR5KSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICAvLyBDYWxjdWxhdGUgd2hhdCBjaGFuZ2VkXHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudDtcclxuICAgICAgICB2YXIgZmxhZ1BhcmVudE1hdHJpeCA9IHBhcmVudC5fbWF0cml4Lm1hbnVhbCB8fCBwYXJlbnQuX2ZsYWdNYXRyaXg7XHJcbiAgICAgICAgdmFyIGZsYWdNYXRyaXggPSB0aGlzLl9tYXRyaXgubWFudWFsIHx8IHRoaXMuX2ZsYWdNYXRyaXg7XHJcbiAgICAgICAgdmFyIGZsYWdUZXh0dXJlID0gdGhpcy5fZmxhZ1ZlcnRpY2VzIHx8IHRoaXMuX2ZsYWdGaWxsXHJcbiAgICAgICAgICB8fCAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudCAmJiAodGhpcy5fZmlsbC5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9maWxsLl9mbGFnU3RvcHMgfHwgdGhpcy5fZmlsbC5fZmxhZ0VuZFBvaW50cykpXHJcbiAgICAgICAgICB8fCAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudCAmJiAodGhpcy5fZmlsbC5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9maWxsLl9mbGFnU3RvcHMgfHwgdGhpcy5fZmlsbC5fZmxhZ1JhZGl1cyB8fCB0aGlzLl9maWxsLl9mbGFnQ2VudGVyIHx8IHRoaXMuX2ZpbGwuX2ZsYWdGb2NhbCkpXHJcbiAgICAgICAgICB8fCAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5UZXh0dXJlICYmICh0aGlzLl9maWxsLl9mbGFnTG9hZGVkICYmIHRoaXMuX2ZpbGwubG9hZGVkIHx8IHRoaXMuX2ZpbGwuX2ZsYWdPZmZzZXQgfHwgdGhpcy5fZmlsbC5fZmxhZ1NjYWxlKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnQgJiYgKHRoaXMuX3N0cm9rZS5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9zdHJva2UuX2ZsYWdTdG9wcyB8fCB0aGlzLl9zdHJva2UuX2ZsYWdFbmRQb2ludHMpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudCAmJiAodGhpcy5fc3Ryb2tlLl9mbGFnU3ByZWFkIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ1N0b3BzIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ1JhZGl1cyB8fCB0aGlzLl9zdHJva2UuX2ZsYWdDZW50ZXIgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnRm9jYWwpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5UZXh0dXJlICYmICh0aGlzLl9zdHJva2UuX2ZsYWdMb2FkZWQgJiYgdGhpcy5fc3Ryb2tlLmxvYWRlZCB8fCB0aGlzLl9zdHJva2UuX2ZsYWdPZmZzZXQgfHwgdGhpcy5fZmlsbC5fZmxhZ1NjYWxlKSlcclxuICAgICAgICAgIHx8IHRoaXMuX2ZsYWdTdHJva2UgfHwgdGhpcy5fZmxhZ0xpbmV3aWR0aCB8fCB0aGlzLl9mbGFnT3BhY2l0eVxyXG4gICAgICAgICAgfHwgcGFyZW50Ll9mbGFnT3BhY2l0eSB8fCB0aGlzLl9mbGFnVmlzaWJsZSB8fCB0aGlzLl9mbGFnQ2FwXHJcbiAgICAgICAgICB8fCB0aGlzLl9mbGFnSm9pbiB8fCB0aGlzLl9mbGFnTWl0ZXIgfHwgdGhpcy5fZmxhZ1NjYWxlXHJcbiAgICAgICAgICB8fCAhdGhpcy5fcmVuZGVyZXIudGV4dHVyZTtcclxuXHJcbiAgICAgICAgaWYgKGZsYWdQYXJlbnRNYXRyaXggfHwgZmxhZ01hdHJpeCkge1xyXG5cclxuICAgICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIubWF0cml4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm1hdHJpeCA9IG5ldyBUd28uQXJyYXkoOSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVkdWNlIGFtb3VudCBvZiBvYmplY3QgLyBhcnJheSBjcmVhdGlvbiAvIGRlbGV0aW9uXHJcblxyXG4gICAgICAgICAgdGhpcy5fbWF0cml4LnRvQXJyYXkodHJ1ZSwgdHJhbnNmb3JtYXRpb24pO1xyXG5cclxuICAgICAgICAgIG11bHRpcGx5TWF0cml4KHRyYW5zZm9ybWF0aW9uLCBwYXJlbnQuX3JlbmRlcmVyLm1hdHJpeCwgdGhpcy5fcmVuZGVyZXIubWF0cml4KTtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlID0gdGhpcy5fc2NhbGUgKiBwYXJlbnQuX3JlbmRlcmVyLnNjYWxlO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmbGFnVGV4dHVyZSkge1xyXG5cclxuICAgICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIucmVjdCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5yZWN0ID0ge307XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci50cmlhbmdsZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIudHJpYW5nbGVzID0gbmV3IFR3by5BcnJheSgxMik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIub3BhY2l0eSA9IHRoaXMuX29wYWNpdHkgKiBwYXJlbnQuX3JlbmRlcmVyLm9wYWNpdHk7XHJcblxyXG4gICAgICAgICAgd2ViZ2wucGF0aC5nZXRCb3VuZGluZ0NsaWVudFJlY3QodGhpcy5fdmVydGljZXMsIHRoaXMuX2xpbmV3aWR0aCwgdGhpcy5fcmVuZGVyZXIucmVjdCk7XHJcbiAgICAgICAgICB3ZWJnbC5nZXRUcmlhbmdsZXModGhpcy5fcmVuZGVyZXIucmVjdCwgdGhpcy5fcmVuZGVyZXIudHJpYW5nbGVzKTtcclxuXHJcbiAgICAgICAgICB3ZWJnbC51cGRhdGVCdWZmZXIuY2FsbCh3ZWJnbCwgZ2wsIHRoaXMsIHByb2dyYW0pO1xyXG4gICAgICAgICAgd2ViZ2wudXBkYXRlVGV4dHVyZS5jYWxsKHdlYmdsLCBnbCwgdGhpcyk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgKHRoaXMuX21hc2spIHtcclxuICAgICAgICAvLyAgIHdlYmdsW3RoaXMuX21hc2suX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKG1hc2ssIGdsLCBwcm9ncmFtLCB0aGlzKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jbGlwICYmICFmb3JjZWRQYXJlbnQpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIERyYXcgVGV4dHVyZVxyXG5cclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5fcmVuZGVyZXIudGV4dHVyZUNvb3Jkc0J1ZmZlcik7XHJcblxyXG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocHJvZ3JhbS50ZXh0dXJlQ29vcmRzLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLl9yZW5kZXJlci50ZXh0dXJlKTtcclxuXHJcblxyXG4gICAgICAgIC8vIERyYXcgUmVjdFxyXG5cclxuICAgICAgICBnbC51bmlmb3JtTWF0cml4M2Z2KHByb2dyYW0ubWF0cml4LCBmYWxzZSwgdGhpcy5fcmVuZGVyZXIubWF0cml4KTtcclxuXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuX3JlbmRlcmVyLmJ1ZmZlcik7XHJcblxyXG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocHJvZ3JhbS5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuXHJcbiAgICAgICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIDYpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRleHQ6IHtcclxuXHJcbiAgICAgIHVwZGF0ZUNhbnZhczogZnVuY3Rpb24oZWxlbSkge1xyXG5cclxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5jYW52YXM7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuY3R4O1xyXG5cclxuICAgICAgICAvLyBTdHlsZXNcclxuICAgICAgICB2YXIgc2NhbGUgPSBlbGVtLl9yZW5kZXJlci5zY2FsZTtcclxuICAgICAgICB2YXIgc3Ryb2tlID0gZWxlbS5fc3Ryb2tlO1xyXG4gICAgICAgIHZhciBsaW5ld2lkdGggPSBlbGVtLl9saW5ld2lkdGggKiBzY2FsZTtcclxuICAgICAgICB2YXIgZmlsbCA9IGVsZW0uX2ZpbGw7XHJcbiAgICAgICAgdmFyIG9wYWNpdHkgPSBlbGVtLl9yZW5kZXJlci5vcGFjaXR5IHx8IGVsZW0uX29wYWNpdHk7XHJcblxyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IE1hdGgubWF4KE1hdGguY2VpbChlbGVtLl9yZW5kZXJlci5yZWN0LndpZHRoICogc2NhbGUpLCAxKTtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gTWF0aC5tYXgoTWF0aC5jZWlsKGVsZW0uX3JlbmRlcmVyLnJlY3QuaGVpZ2h0ICogc2NhbGUpLCAxKTtcclxuXHJcbiAgICAgICAgdmFyIGNlbnRyb2lkID0gZWxlbS5fcmVuZGVyZXIucmVjdC5jZW50cm9pZDtcclxuICAgICAgICB2YXIgY3ggPSBjZW50cm9pZC54O1xyXG4gICAgICAgIHZhciBjeSA9IGNlbnRyb2lkLnk7XHJcblxyXG4gICAgICAgIHZhciBhLCBiLCBjLCBkLCBlLCBzeCwgc3k7XHJcbiAgICAgICAgdmFyIGlzT2Zmc2V0ID0gZmlsbC5fcmVuZGVyZXIgJiYgZmlsbC5fcmVuZGVyZXIub2Zmc2V0XHJcbiAgICAgICAgICAmJiBzdHJva2UuX3JlbmRlcmVyICYmIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0O1xyXG5cclxuICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcblxyXG4gICAgICAgIGlmICghaXNPZmZzZXQpIHtcclxuICAgICAgICAgIGN0eC5mb250ID0gW2VsZW0uX3N0eWxlLCBlbGVtLl93ZWlnaHQsIGVsZW0uX3NpemUgKyAncHgvJyArXHJcbiAgICAgICAgICAgIGVsZW0uX2xlYWRpbmcgKyAncHgnLCBlbGVtLl9mYW1pbHldLmpvaW4oJyAnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcclxuICAgICAgICBjdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XHJcblxyXG4gICAgICAgIC8vIFN0eWxlc1xyXG4gICAgICAgIGlmIChmaWxsKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyhmaWxsKSkge1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZmlsbDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdlYmdsW2ZpbGwuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGZpbGwsIGN0eCwgZWxlbSk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsLl9yZW5kZXJlci5lZmZlY3Q7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzdHJva2UpIHtcclxuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKHN0cm9rZSkpIHtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2ViZ2xbc3Ryb2tlLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChzdHJva2UsIGN0eCwgZWxlbSk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZS5fcmVuZGVyZXIuZWZmZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGluZXdpZHRoKSB7XHJcbiAgICAgICAgICBjdHgubGluZVdpZHRoID0gbGluZXdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc051bWJlcihvcGFjaXR5KSkge1xyXG4gICAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gb3BhY2l0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgY3R4LnNjYWxlKHNjYWxlLCBzY2FsZSk7XHJcbiAgICAgICAgY3R4LnRyYW5zbGF0ZShjeCwgY3kpO1xyXG5cclxuICAgICAgICBpZiAoIXdlYmdsLmlzSGlkZGVuLnRlc3QoZmlsbCkpIHtcclxuXHJcbiAgICAgICAgICBpZiAoZmlsbC5fcmVuZGVyZXIgJiYgZmlsbC5fcmVuZGVyZXIub2Zmc2V0KSB7XHJcblxyXG4gICAgICAgICAgICBzeCA9IHRvRml4ZWQoZmlsbC5fcmVuZGVyZXIuc2NhbGUueCk7XHJcbiAgICAgICAgICAgIHN5ID0gdG9GaXhlZChmaWxsLl9yZW5kZXJlci5zY2FsZS55KTtcclxuXHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoIC0gdG9GaXhlZChmaWxsLl9yZW5kZXJlci5vZmZzZXQueCksXHJcbiAgICAgICAgICAgICAgLSB0b0ZpeGVkKGZpbGwuX3JlbmRlcmVyLm9mZnNldC55KSk7XHJcbiAgICAgICAgICAgIGN0eC5zY2FsZShzeCwgc3kpO1xyXG5cclxuICAgICAgICAgICAgYSA9IGVsZW0uX3NpemUgLyBmaWxsLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICBiID0gZWxlbS5fbGVhZGluZyAvIGZpbGwuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgIGN0eC5mb250ID0gW2VsZW0uX3N0eWxlLCBlbGVtLl93ZWlnaHQsIHRvRml4ZWQoYSkgKyAncHgvJyxcclxuICAgICAgICAgICAgICB0b0ZpeGVkKGIpICsgJ3B4JywgZWxlbS5fZmFtaWx5XS5qb2luKCcgJyk7XHJcblxyXG4gICAgICAgICAgICBjID0gZmlsbC5fcmVuZGVyZXIub2Zmc2V0LnggLyBmaWxsLl9yZW5kZXJlci5zY2FsZS54O1xyXG4gICAgICAgICAgICBkID0gZmlsbC5fcmVuZGVyZXIub2Zmc2V0LnkgLyBmaWxsLl9yZW5kZXJlci5zY2FsZS55O1xyXG5cclxuICAgICAgICAgICAgY3R4LmZpbGxUZXh0KGVsZW0udmFsdWUsIHRvRml4ZWQoYyksIHRvRml4ZWQoZCkpO1xyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0eC5maWxsVGV4dChlbGVtLnZhbHVlLCAwLCAwKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXdlYmdsLmlzSGlkZGVuLnRlc3Qoc3Ryb2tlKSkge1xyXG5cclxuICAgICAgICAgIGlmIChzdHJva2UuX3JlbmRlcmVyICYmIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0KSB7XHJcblxyXG4gICAgICAgICAgICBzeCA9IHRvRml4ZWQoc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54KTtcclxuICAgICAgICAgICAgc3kgPSB0b0ZpeGVkKHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueSk7XHJcblxyXG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKC0gdG9GaXhlZChzdHJva2UuX3JlbmRlcmVyLm9mZnNldC54KSxcclxuICAgICAgICAgICAgICAtIHRvRml4ZWQoc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueSkpO1xyXG4gICAgICAgICAgICBjdHguc2NhbGUoc3gsIHN5KTtcclxuXHJcbiAgICAgICAgICAgIGEgPSBlbGVtLl9zaXplIC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICBiID0gZWxlbS5fbGVhZGluZyAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgY3R4LmZvbnQgPSBbZWxlbS5fc3R5bGUsIGVsZW0uX3dlaWdodCwgdG9GaXhlZChhKSArICdweC8nLFxyXG4gICAgICAgICAgICAgIHRvRml4ZWQoYikgKyAncHgnLCBlbGVtLl9mYW1pbHldLmpvaW4oJyAnKTtcclxuXHJcbiAgICAgICAgICAgIGMgPSBzdHJva2UuX3JlbmRlcmVyLm9mZnNldC54IC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54O1xyXG4gICAgICAgICAgICBkID0gc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueSAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgZSA9IGxpbmV3aWR0aCAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueDtcclxuXHJcbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0b0ZpeGVkKGUpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlVGV4dChlbGVtLnZhbHVlLCB0b0ZpeGVkKGMpLCB0b0ZpeGVkKGQpKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuXHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlVGV4dChlbGVtLnZhbHVlLCAwLCAwKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogZnVuY3Rpb24oZWxlbSwgcmVjdCkge1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0gd2ViZ2wuY3R4O1xyXG5cclxuICAgICAgICBjdHguZm9udCA9IFtlbGVtLl9zdHlsZSwgZWxlbS5fd2VpZ2h0LCBlbGVtLl9zaXplICsgJ3B4LycgK1xyXG4gICAgICAgICAgZWxlbS5fbGVhZGluZyArICdweCcsIGVsZW0uX2ZhbWlseV0uam9pbignICcpO1xyXG5cclxuICAgICAgICBjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XHJcbiAgICAgICAgY3R4LnRleHRCYXNlbGluZSA9IGVsZW0uX2Jhc2VsaW5lO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBFc3RpbWF0ZSB0aGlzIGJldHRlclxyXG4gICAgICAgIHZhciB3aWR0aCA9IGN0eC5tZWFzdXJlVGV4dChlbGVtLl92YWx1ZSkud2lkdGg7XHJcbiAgICAgICAgdmFyIGhlaWdodCA9IE1hdGgubWF4KGVsZW0uX3NpemUgfHwgZWxlbS5fbGVhZGluZyk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9saW5ld2lkdGggJiYgIXdlYmdsLmlzSGlkZGVuLnRlc3QodGhpcy5fc3Ryb2tlKSkge1xyXG4gICAgICAgICAgLy8gd2lkdGggKz0gdGhpcy5fbGluZXdpZHRoOyAvLyBUT0RPOiBOb3Qgc3VyZSBpZiB0aGUgYG1lYXN1cmVgIGNhbGNzIHRoaXMuXHJcbiAgICAgICAgICBoZWlnaHQgKz0gdGhpcy5fbGluZXdpZHRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHcgPSB3aWR0aCAvIDI7XHJcbiAgICAgICAgdmFyIGggPSBoZWlnaHQgLyAyO1xyXG5cclxuICAgICAgICBzd2l0Y2ggKHdlYmdsLmFsaWdubWVudHNbZWxlbS5fYWxpZ25tZW50XSB8fCBlbGVtLl9hbGlnbm1lbnQpIHtcclxuXHJcbiAgICAgICAgICBjYXNlIHdlYmdsLmFsaWdubWVudHMubGVmdDpcclxuICAgICAgICAgICAgcmVjdC5sZWZ0ID0gMDtcclxuICAgICAgICAgICAgcmVjdC5yaWdodCA9IHdpZHRoO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2Ugd2ViZ2wuYWxpZ25tZW50cy5yaWdodDpcclxuICAgICAgICAgICAgcmVjdC5sZWZ0ID0gLSB3aWR0aDtcclxuICAgICAgICAgICAgcmVjdC5yaWdodCA9IDA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmVjdC5sZWZ0ID0gLSB3O1xyXG4gICAgICAgICAgICByZWN0LnJpZ2h0ID0gdztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEdyYWRpZW50cyBhcmVuJ3QgaW5oZXJpdGVkLi4uXHJcbiAgICAgICAgc3dpdGNoIChlbGVtLl9iYXNlbGluZSkge1xyXG4gICAgICAgICAgY2FzZSAnYm90dG9tJzpcclxuICAgICAgICAgICAgcmVjdC50b3AgPSAtIGhlaWdodDtcclxuICAgICAgICAgICAgcmVjdC5ib3R0b20gPSAwO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGNhc2UgJ3RvcCc6XHJcbiAgICAgICAgICAgIHJlY3QudG9wID0gMDtcclxuICAgICAgICAgICAgcmVjdC5ib3R0b20gPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmVjdC50b3AgPSAtIGg7XHJcbiAgICAgICAgICAgIHJlY3QuYm90dG9tID0gaDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlY3Qud2lkdGggPSB3aWR0aDtcclxuICAgICAgICByZWN0LmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgICAgaWYgKCFyZWN0LmNlbnRyb2lkKSB7XHJcbiAgICAgICAgICByZWN0LmNlbnRyb2lkID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUT0RPOlxyXG4gICAgICAgIHJlY3QuY2VudHJvaWQueCA9IHc7XHJcbiAgICAgICAgcmVjdC5jZW50cm9pZC55ID0gaDtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGdsLCBwcm9ncmFtLCBmb3JjZWRQYXJlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl92aXNpYmxlIHx8ICF0aGlzLl9vcGFjaXR5KSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICAvLyBDYWxjdWxhdGUgd2hhdCBjaGFuZ2VkXHJcblxyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudDtcclxuICAgICAgICB2YXIgZmxhZ1BhcmVudE1hdHJpeCA9IHBhcmVudC5fbWF0cml4Lm1hbnVhbCB8fCBwYXJlbnQuX2ZsYWdNYXRyaXg7XHJcbiAgICAgICAgdmFyIGZsYWdNYXRyaXggPSB0aGlzLl9tYXRyaXgubWFudWFsIHx8IHRoaXMuX2ZsYWdNYXRyaXg7XHJcbiAgICAgICAgdmFyIGZsYWdUZXh0dXJlID0gdGhpcy5fZmxhZ1ZlcnRpY2VzIHx8IHRoaXMuX2ZsYWdGaWxsXHJcbiAgICAgICAgICB8fCAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudCAmJiAodGhpcy5fZmlsbC5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9maWxsLl9mbGFnU3RvcHMgfHwgdGhpcy5fZmlsbC5fZmxhZ0VuZFBvaW50cykpXHJcbiAgICAgICAgICB8fCAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudCAmJiAodGhpcy5fZmlsbC5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9maWxsLl9mbGFnU3RvcHMgfHwgdGhpcy5fZmlsbC5fZmxhZ1JhZGl1cyB8fCB0aGlzLl9maWxsLl9mbGFnQ2VudGVyIHx8IHRoaXMuX2ZpbGwuX2ZsYWdGb2NhbCkpXHJcbiAgICAgICAgICB8fCAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5UZXh0dXJlICYmICh0aGlzLl9maWxsLl9mbGFnTG9hZGVkICYmIHRoaXMuX2ZpbGwubG9hZGVkKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnQgJiYgKHRoaXMuX3N0cm9rZS5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9zdHJva2UuX2ZsYWdTdG9wcyB8fCB0aGlzLl9zdHJva2UuX2ZsYWdFbmRQb2ludHMpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudCAmJiAodGhpcy5fc3Ryb2tlLl9mbGFnU3ByZWFkIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ1N0b3BzIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ1JhZGl1cyB8fCB0aGlzLl9zdHJva2UuX2ZsYWdDZW50ZXIgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnRm9jYWwpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX3RleHR1cmUgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSAmJiAodGhpcy5fdGV4dHVyZS5fZmxhZ0xvYWRlZCAmJiB0aGlzLl90ZXh0dXJlLmxvYWRlZCkpXHJcbiAgICAgICAgICB8fCB0aGlzLl9mbGFnU3Ryb2tlIHx8IHRoaXMuX2ZsYWdMaW5ld2lkdGggfHwgdGhpcy5fZmxhZ09wYWNpdHlcclxuICAgICAgICAgIHx8IHBhcmVudC5fZmxhZ09wYWNpdHkgfHwgdGhpcy5fZmxhZ1Zpc2libGUgfHwgdGhpcy5fZmxhZ1NjYWxlXHJcbiAgICAgICAgICB8fCB0aGlzLl9mbGFnVmFsdWUgfHwgdGhpcy5fZmxhZ0ZhbWlseSB8fCB0aGlzLl9mbGFnU2l6ZVxyXG4gICAgICAgICAgfHwgdGhpcy5fZmxhZ0xlYWRpbmcgfHwgdGhpcy5fZmxhZ0FsaWdubWVudCB8fCB0aGlzLl9mbGFnQmFzZWxpbmVcclxuICAgICAgICAgIHx8IHRoaXMuX2ZsYWdTdHlsZSB8fCB0aGlzLl9mbGFnV2VpZ2h0IHx8IHRoaXMuX2ZsYWdEZWNvcmF0aW9uXHJcbiAgICAgICAgICB8fCAhdGhpcy5fcmVuZGVyZXIudGV4dHVyZTtcclxuXHJcbiAgICAgICAgaWYgKGZsYWdQYXJlbnRNYXRyaXggfHwgZmxhZ01hdHJpeCkge1xyXG5cclxuICAgICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIubWF0cml4KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm1hdHJpeCA9IG5ldyBUd28uQXJyYXkoOSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVkdWNlIGFtb3VudCBvZiBvYmplY3QgLyBhcnJheSBjcmVhdGlvbiAvIGRlbGV0aW9uXHJcblxyXG4gICAgICAgICAgdGhpcy5fbWF0cml4LnRvQXJyYXkodHJ1ZSwgdHJhbnNmb3JtYXRpb24pO1xyXG5cclxuICAgICAgICAgIG11bHRpcGx5TWF0cml4KHRyYW5zZm9ybWF0aW9uLCBwYXJlbnQuX3JlbmRlcmVyLm1hdHJpeCwgdGhpcy5fcmVuZGVyZXIubWF0cml4KTtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlID0gdGhpcy5fc2NhbGUgKiBwYXJlbnQuX3JlbmRlcmVyLnNjYWxlO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmbGFnVGV4dHVyZSkge1xyXG5cclxuICAgICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIucmVjdCkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5yZWN0ID0ge307XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci50cmlhbmdsZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIudHJpYW5nbGVzID0gbmV3IFR3by5BcnJheSgxMik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIub3BhY2l0eSA9IHRoaXMuX29wYWNpdHkgKiBwYXJlbnQuX3JlbmRlcmVyLm9wYWNpdHk7XHJcblxyXG4gICAgICAgICAgd2ViZ2wudGV4dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QodGhpcywgdGhpcy5fcmVuZGVyZXIucmVjdCk7XHJcbiAgICAgICAgICB3ZWJnbC5nZXRUcmlhbmdsZXModGhpcy5fcmVuZGVyZXIucmVjdCwgdGhpcy5fcmVuZGVyZXIudHJpYW5nbGVzKTtcclxuXHJcbiAgICAgICAgICB3ZWJnbC51cGRhdGVCdWZmZXIuY2FsbCh3ZWJnbCwgZ2wsIHRoaXMsIHByb2dyYW0pO1xyXG4gICAgICAgICAgd2ViZ2wudXBkYXRlVGV4dHVyZS5jYWxsKHdlYmdsLCBnbCwgdGhpcyk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgKHRoaXMuX21hc2spIHtcclxuICAgICAgICAvLyAgIHdlYmdsW3RoaXMuX21hc2suX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKG1hc2ssIGdsLCBwcm9ncmFtLCB0aGlzKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9jbGlwICYmICFmb3JjZWRQYXJlbnQpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIERyYXcgVGV4dHVyZVxyXG5cclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5fcmVuZGVyZXIudGV4dHVyZUNvb3Jkc0J1ZmZlcik7XHJcblxyXG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocHJvZ3JhbS50ZXh0dXJlQ29vcmRzLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLl9yZW5kZXJlci50ZXh0dXJlKTtcclxuXHJcblxyXG4gICAgICAgIC8vIERyYXcgUmVjdFxyXG5cclxuICAgICAgICBnbC51bmlmb3JtTWF0cml4M2Z2KHByb2dyYW0ubWF0cml4LCBmYWxzZSwgdGhpcy5fcmVuZGVyZXIubWF0cml4KTtcclxuXHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuX3JlbmRlcmVyLmJ1ZmZlcik7XHJcblxyXG4gICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocHJvZ3JhbS5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuXHJcbiAgICAgICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIDYpO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgICdsaW5lYXItZ3JhZGllbnQnOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgZWxlbSkge1xyXG5cclxuICAgICAgICBpZiAoIWN0eC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWZmZWN0IHx8IHRoaXMuX2ZsYWdFbmRQb2ludHMgfHwgdGhpcy5fZmxhZ1N0b3BzKSB7XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0ID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQuX3gsIHRoaXMubGVmdC5feSxcclxuICAgICAgICAgICAgdGhpcy5yaWdodC5feCwgdGhpcy5yaWdodC5feVxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3RvcHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHN0b3AgPSB0aGlzLnN0b3BzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QuYWRkQ29sb3JTdG9wKHN0b3AuX29mZnNldCwgc3RvcC5fY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgJ3JhZGlhbC1ncmFkaWVudCc6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4LCBlbGVtKSB7XHJcblxyXG4gICAgICAgIGlmICghY3R4LmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lZmZlY3QgfHwgdGhpcy5fZmxhZ0NlbnRlciB8fCB0aGlzLl9mbGFnRm9jYWxcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmxhZ1JhZGl1cyB8fCB0aGlzLl9mbGFnU3RvcHMpIHtcclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoXHJcbiAgICAgICAgICAgIHRoaXMuY2VudGVyLl94LCB0aGlzLmNlbnRlci5feSwgMCxcclxuICAgICAgICAgICAgdGhpcy5mb2NhbC5feCwgdGhpcy5mb2NhbC5feSwgdGhpcy5fcmFkaXVzXHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdG9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgc3RvcCA9IHRoaXMuc3RvcHNbaV07XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdC5hZGRDb2xvclN0b3Aoc3RvcC5fb2Zmc2V0LCBzdG9wLl9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXh0dXJlOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgZWxlbSkge1xyXG5cclxuICAgICAgICBpZiAoIWN0eC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIHZhciBpbWFnZSA9IHRoaXMuaW1hZ2U7XHJcbiAgICAgICAgdmFyIHJlcGVhdDtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lZmZlY3QgfHwgKCh0aGlzLl9mbGFnTG9hZGVkIHx8IHRoaXMuX2ZsYWdSZXBlYXQpICYmIHRoaXMubG9hZGVkKSkge1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0ID0gY3R4LmNyZWF0ZVBhdHRlcm4oaW1hZ2UsIHRoaXMuX3JlcGVhdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ09mZnNldCB8fCB0aGlzLl9mbGFnTG9hZGVkIHx8IHRoaXMuX2ZsYWdTY2FsZSkge1xyXG5cclxuICAgICAgICAgIGlmICghKHRoaXMuX3JlbmRlcmVyLm9mZnNldCBpbnN0YW5jZW9mIFR3by5WZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldCA9IG5ldyBUd28uVmVjdG9yKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnggPSB0aGlzLl9vZmZzZXQueDtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC55ID0gdGhpcy5fb2Zmc2V0Lnk7XHJcblxyXG4gICAgICAgICAgaWYgKGltYWdlKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueCAtPSBpbWFnZS53aWR0aCAvIDI7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC55ICs9IGltYWdlLmhlaWdodCAvIDI7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnggKj0gdGhpcy5fc2NhbGUueDtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueSAqPSB0aGlzLl9zY2FsZS55O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC54ICo9IHRoaXMuX3NjYWxlO1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC55ICo9IHRoaXMuX3NjYWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTY2FsZSB8fCB0aGlzLl9mbGFnTG9hZGVkKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCEodGhpcy5fcmVuZGVyZXIuc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZSA9IG5ldyBUd28uVmVjdG9yKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZS5jb3B5KHRoaXMuX3NjYWxlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlLnNldCh0aGlzLl9zY2FsZSwgdGhpcy5fc2NhbGUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0VHJpYW5nbGVzOiBmdW5jdGlvbihyZWN0LCB0cmlhbmdsZXMpIHtcclxuXHJcbiAgICAgIHZhciB0b3AgPSByZWN0LnRvcCxcclxuICAgICAgICAgIGxlZnQgPSByZWN0LmxlZnQsXHJcbiAgICAgICAgICByaWdodCA9IHJlY3QucmlnaHQsXHJcbiAgICAgICAgICBib3R0b20gPSByZWN0LmJvdHRvbTtcclxuXHJcbiAgICAgIC8vIEZpcnN0IFRyaWFuZ2xlXHJcblxyXG4gICAgICB0cmlhbmdsZXNbMF0gPSBsZWZ0O1xyXG4gICAgICB0cmlhbmdsZXNbMV0gPSB0b3A7XHJcblxyXG4gICAgICB0cmlhbmdsZXNbMl0gPSByaWdodDtcclxuICAgICAgdHJpYW5nbGVzWzNdID0gdG9wO1xyXG5cclxuICAgICAgdHJpYW5nbGVzWzRdID0gbGVmdDtcclxuICAgICAgdHJpYW5nbGVzWzVdID0gYm90dG9tO1xyXG5cclxuICAgICAgLy8gU2Vjb25kIFRyaWFuZ2xlXHJcblxyXG4gICAgICB0cmlhbmdsZXNbNl0gPSBsZWZ0O1xyXG4gICAgICB0cmlhbmdsZXNbN10gPSBib3R0b207XHJcblxyXG4gICAgICB0cmlhbmdsZXNbOF0gPSByaWdodDtcclxuICAgICAgdHJpYW5nbGVzWzldID0gdG9wO1xyXG5cclxuICAgICAgdHJpYW5nbGVzWzEwXSA9IHJpZ2h0O1xyXG4gICAgICB0cmlhbmdsZXNbMTFdID0gYm90dG9tO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlVGV4dHVyZTogZnVuY3Rpb24oZ2wsIGVsZW0pIHtcclxuXHJcbiAgICAgIHRoaXNbZWxlbS5fcmVuZGVyZXIudHlwZV0udXBkYXRlQ2FudmFzLmNhbGwod2ViZ2wsIGVsZW0pO1xyXG5cclxuICAgICAgaWYgKGVsZW0uX3JlbmRlcmVyLnRleHR1cmUpIHtcclxuICAgICAgICBnbC5kZWxldGVUZXh0dXJlKGVsZW0uX3JlbmRlcmVyLnRleHR1cmUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgZWxlbS5fcmVuZGVyZXIudGV4dHVyZUNvb3Jkc0J1ZmZlcik7XHJcblxyXG4gICAgICAvLyBUT0RPOiBJcyB0aGlzIG5lY2Vzc2FyeSBldmVyeSB0aW1lIG9yIGNhbiB3ZSBkbyBvbmNlP1xyXG4gICAgICAvLyBUT0RPOiBDcmVhdGUgYSByZWdpc3RyeSBmb3IgdGV4dHVyZXNcclxuICAgICAgZWxlbS5fcmVuZGVyZXIudGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgZWxlbS5fcmVuZGVyZXIudGV4dHVyZSk7XHJcblxyXG4gICAgICAvLyBTZXQgdGhlIHBhcmFtZXRlcnMgc28gd2UgY2FuIHJlbmRlciBhbnkgc2l6ZSBpbWFnZS5cclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgICAgLy8gZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XHJcbiAgICAgIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5ORUFSRVNUKTtcclxuICAgICAgLy8gZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG5cclxuICAgICAgaWYgKHRoaXMuY2FudmFzLndpZHRoIDw9IDAgfHwgdGhpcy5jYW52YXMuaGVpZ2h0IDw9IDApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFVwbG9hZCB0aGUgaW1hZ2UgaW50byB0aGUgdGV4dHVyZS5cclxuICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCB0aGlzLmNhbnZhcyk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGVCdWZmZXI6IGZ1bmN0aW9uKGdsLCBlbGVtLCBwcm9ncmFtKSB7XHJcblxyXG4gICAgICBpZiAoXy5pc09iamVjdChlbGVtLl9yZW5kZXJlci5idWZmZXIpKSB7XHJcbiAgICAgICAgZ2wuZGVsZXRlQnVmZmVyKGVsZW0uX3JlbmRlcmVyLmJ1ZmZlcik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGVsZW0uX3JlbmRlcmVyLmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGVsZW0uX3JlbmRlcmVyLmJ1ZmZlcik7XHJcbiAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHByb2dyYW0ucG9zaXRpb24pO1xyXG5cclxuICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGVsZW0uX3JlbmRlcmVyLnRyaWFuZ2xlcywgZ2wuU1RBVElDX0RSQVcpO1xyXG5cclxuICAgICAgaWYgKF8uaXNPYmplY3QoZWxlbS5fcmVuZGVyZXIudGV4dHVyZUNvb3Jkc0J1ZmZlcikpIHtcclxuICAgICAgICBnbC5kZWxldGVCdWZmZXIoZWxlbS5fcmVuZGVyZXIudGV4dHVyZUNvb3Jkc0J1ZmZlcik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGVsZW0uX3JlbmRlcmVyLnRleHR1cmVDb29yZHNCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBlbGVtLl9yZW5kZXJlci50ZXh0dXJlQ29vcmRzQnVmZmVyKTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkocHJvZ3JhbS50ZXh0dXJlQ29vcmRzKTtcclxuXHJcbiAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnV2LCBnbC5TVEFUSUNfRFJBVyk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBwcm9ncmFtOiB7XHJcblxyXG4gICAgICBjcmVhdGU6IGZ1bmN0aW9uKGdsLCBzaGFkZXJzKSB7XHJcbiAgICAgICAgdmFyIHByb2dyYW0sIGxpbmtlZCwgZXJyb3I7XHJcbiAgICAgICAgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgICAgICBfLmVhY2goc2hhZGVycywgZnVuY3Rpb24ocykge1xyXG4gICAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgICAgICBsaW5rZWQgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKTtcclxuICAgICAgICBpZiAoIWxpbmtlZCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKTtcclxuICAgICAgICAgIGdsLmRlbGV0ZVByb2dyYW0ocHJvZ3JhbSk7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgVHdvLlV0aWxzLkVycm9yKCd1bmFibGUgdG8gbGluayBwcm9ncmFtOiAnICsgZXJyb3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2dyYW07XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBzaGFkZXJzOiB7XHJcblxyXG4gICAgICBjcmVhdGU6IGZ1bmN0aW9uKGdsLCBzb3VyY2UsIHR5cGUpIHtcclxuICAgICAgICB2YXIgc2hhZGVyLCBjb21waWxlZCwgZXJyb3I7XHJcbiAgICAgICAgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsW3R5cGVdKTtcclxuICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xyXG4gICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKTtcclxuXHJcbiAgICAgICAgY29tcGlsZWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyk7XHJcbiAgICAgICAgaWYgKCFjb21waWxlZCkge1xyXG4gICAgICAgICAgZXJyb3IgPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcik7XHJcbiAgICAgICAgICBnbC5kZWxldGVTaGFkZXIoc2hhZGVyKTtcclxuICAgICAgICAgIHRocm93IG5ldyBUd28uVXRpbHMuRXJyb3IoJ3VuYWJsZSB0byBjb21waWxlIHNoYWRlciAnICsgc2hhZGVyICsgJzogJyArIGVycm9yKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaGFkZXI7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgdHlwZXM6IHtcclxuICAgICAgICB2ZXJ0ZXg6ICdWRVJURVhfU0hBREVSJyxcclxuICAgICAgICBmcmFnbWVudDogJ0ZSQUdNRU5UX1NIQURFUidcclxuICAgICAgfSxcclxuXHJcbiAgICAgIHZlcnRleDogW1xyXG4gICAgICAgICdhdHRyaWJ1dGUgdmVjMiBhX3Bvc2l0aW9uOycsXHJcbiAgICAgICAgJ2F0dHJpYnV0ZSB2ZWMyIGFfdGV4dHVyZUNvb3JkczsnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICd1bmlmb3JtIG1hdDMgdV9tYXRyaXg7JyxcclxuICAgICAgICAndW5pZm9ybSB2ZWMyIHVfcmVzb2x1dGlvbjsnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICd2YXJ5aW5nIHZlYzIgdl90ZXh0dXJlQ29vcmRzOycsXHJcbiAgICAgICAgJycsXHJcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxyXG4gICAgICAgICcgICB2ZWMyIHByb2plY3RlZCA9ICh1X21hdHJpeCAqIHZlYzMoYV9wb3NpdGlvbiwgMS4wKSkueHk7JyxcclxuICAgICAgICAnICAgdmVjMiBub3JtYWwgPSBwcm9qZWN0ZWQgLyB1X3Jlc29sdXRpb247JyxcclxuICAgICAgICAnICAgdmVjMiBjbGlwc3BhY2UgPSAobm9ybWFsICogMi4wKSAtIDEuMDsnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICcgICBnbF9Qb3NpdGlvbiA9IHZlYzQoY2xpcHNwYWNlICogdmVjMigxLjAsIC0xLjApLCAwLjAsIDEuMCk7JyxcclxuICAgICAgICAnICAgdl90ZXh0dXJlQ29vcmRzID0gYV90ZXh0dXJlQ29vcmRzOycsXHJcbiAgICAgICAgJ30nXHJcbiAgICAgIF0uam9pbignXFxuJyksXHJcblxyXG4gICAgICBmcmFnbWVudDogW1xyXG4gICAgICAgICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDsnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICd1bmlmb3JtIHNhbXBsZXIyRCB1X2ltYWdlOycsXHJcbiAgICAgICAgJ3ZhcnlpbmcgdmVjMiB2X3RleHR1cmVDb29yZHM7JyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAndm9pZCBtYWluKCkgeycsXHJcbiAgICAgICAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVfaW1hZ2UsIHZfdGV4dHVyZUNvb3Jkcyk7JyxcclxuICAgICAgICAnfSdcclxuICAgICAgXS5qb2luKCdcXG4nKVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgVGV4dHVyZVJlZ2lzdHJ5OiBuZXcgVHdvLlJlZ2lzdHJ5KClcclxuXHJcbiAgfTtcclxuXHJcbiAgd2ViZ2wuY3R4ID0gd2ViZ2wuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gIHZhciBSZW5kZXJlciA9IFR3b1tUd28uVHlwZXMud2ViZ2xdID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cclxuICAgIHZhciBwYXJhbXMsIGdsLCB2cywgZnM7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBvcHRpb25zLmRvbUVsZW1lbnQgfHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcblxyXG4gICAgLy8gRXZlcnl0aGluZyBkcmF3biBvbiB0aGUgY2FudmFzIG5lZWRzIHRvIGNvbWUgZnJvbSB0aGUgc3RhZ2UuXHJcbiAgICB0aGlzLnNjZW5lID0gbmV3IFR3by5Hcm91cCgpO1xyXG4gICAgdGhpcy5zY2VuZS5wYXJlbnQgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyID0ge1xyXG4gICAgICBtYXRyaXg6IG5ldyBUd28uQXJyYXkoaWRlbnRpdHkpLFxyXG4gICAgICBzY2FsZTogMSxcclxuICAgICAgb3BhY2l0eTogMVxyXG4gICAgfTtcclxuICAgIHRoaXMuX2ZsYWdNYXRyaXggPSB0cnVlO1xyXG5cclxuICAgIC8vIGh0dHA6Ly9nYW1lcy5ncmVnZ21hbi5jb20vZ2FtZS93ZWJnbC1hbmQtYWxwaGEvXHJcbiAgICAvLyBodHRwOi8vd3d3Lmtocm9ub3Mub3JnL3JlZ2lzdHJ5L3dlYmdsL3NwZWNzL2xhdGVzdC8jNS4yXHJcbiAgICBwYXJhbXMgPSBfLmRlZmF1bHRzKG9wdGlvbnMgfHwge30sIHtcclxuICAgICAgYW50aWFsaWFzOiBmYWxzZSxcclxuICAgICAgYWxwaGE6IHRydWUsXHJcbiAgICAgIHByZW11bHRpcGxpZWRBbHBoYTogdHJ1ZSxcclxuICAgICAgc3RlbmNpbDogdHJ1ZSxcclxuICAgICAgcHJlc2VydmVEcmF3aW5nQnVmZmVyOiB0cnVlLFxyXG4gICAgICBvdmVyZHJhdzogZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMub3ZlcmRyYXcgPSBwYXJhbXMub3ZlcmRyYXc7XHJcblxyXG4gICAgZ2wgPSB0aGlzLmN0eCA9IHRoaXMuZG9tRWxlbWVudC5nZXRDb250ZXh0KCd3ZWJnbCcsIHBhcmFtcykgfHxcclxuICAgICAgdGhpcy5kb21FbGVtZW50LmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIHBhcmFtcyk7XHJcblxyXG4gICAgaWYgKCF0aGlzLmN0eCkge1xyXG4gICAgICB0aHJvdyBuZXcgVHdvLlV0aWxzLkVycm9yKFxyXG4gICAgICAgICd1bmFibGUgdG8gY3JlYXRlIGEgd2ViZ2wgY29udGV4dC4gVHJ5IHVzaW5nIGFub3RoZXIgcmVuZGVyZXIuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ29tcGlsZSBCYXNlIFNoYWRlcnMgdG8gZHJhdyBpbiBwaXhlbCBzcGFjZS5cclxuICAgIHZzID0gd2ViZ2wuc2hhZGVycy5jcmVhdGUoXHJcbiAgICAgIGdsLCB3ZWJnbC5zaGFkZXJzLnZlcnRleCwgd2ViZ2wuc2hhZGVycy50eXBlcy52ZXJ0ZXgpO1xyXG4gICAgZnMgPSB3ZWJnbC5zaGFkZXJzLmNyZWF0ZShcclxuICAgICAgZ2wsIHdlYmdsLnNoYWRlcnMuZnJhZ21lbnQsIHdlYmdsLnNoYWRlcnMudHlwZXMuZnJhZ21lbnQpO1xyXG5cclxuICAgIHRoaXMucHJvZ3JhbSA9IHdlYmdsLnByb2dyYW0uY3JlYXRlKGdsLCBbdnMsIGZzXSk7XHJcbiAgICBnbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuZCBiaW5kIHRoZSBkcmF3aW5nIGJ1ZmZlclxyXG5cclxuICAgIC8vIGxvb2sgdXAgd2hlcmUgdGhlIHZlcnRleCBkYXRhIG5lZWRzIHRvIGdvLlxyXG4gICAgdGhpcy5wcm9ncmFtLnBvc2l0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5wcm9ncmFtLCAnYV9wb3NpdGlvbicpO1xyXG4gICAgdGhpcy5wcm9ncmFtLm1hdHJpeCA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sICd1X21hdHJpeCcpO1xyXG4gICAgdGhpcy5wcm9ncmFtLnRleHR1cmVDb29yZHMgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnByb2dyYW0sICdhX3RleHR1cmVDb29yZHMnKTtcclxuXHJcbiAgICAvLyBDb3BpZWQgZnJvbSBUaHJlZS5qcyBXZWJHTFJlbmRlcmVyXHJcbiAgICBnbC5kaXNhYmxlKGdsLkRFUFRIX1RFU1QpO1xyXG5cclxuICAgIC8vIFNldHVwIHNvbWUgaW5pdGlhbCBzdGF0ZW1lbnRzIG9mIHRoZSBnbCBjb250ZXh0XHJcbiAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xyXG5cclxuICAgIC8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0zMTYzOTNcclxuICAgIC8vIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZ2wuVFJVRSk7XHJcblxyXG4gICAgZ2wuYmxlbmRFcXVhdGlvblNlcGFyYXRlKGdsLkZVTkNfQURELCBnbC5GVU5DX0FERCk7XHJcbiAgICBnbC5ibGVuZEZ1bmNTZXBhcmF0ZShnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEsXHJcbiAgICAgIGdsLk9ORSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSApO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChSZW5kZXJlciwge1xyXG5cclxuICAgIFV0aWxzOiB3ZWJnbFxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUmVuZGVyZXIucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgc2V0U2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgcmF0aW8pIHtcclxuXHJcbiAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICB0aGlzLnJhdGlvID0gXy5pc1VuZGVmaW5lZChyYXRpbykgPyBnZXRSYXRpbyh0aGlzLmN0eCkgOiByYXRpbztcclxuXHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC53aWR0aCA9IHdpZHRoICogdGhpcy5yYXRpbztcclxuICAgICAgdGhpcy5kb21FbGVtZW50LmhlaWdodCA9IGhlaWdodCAqIHRoaXMucmF0aW87XHJcblxyXG4gICAgICBfLmV4dGVuZCh0aGlzLmRvbUVsZW1lbnQuc3R5bGUsIHtcclxuICAgICAgICB3aWR0aDogd2lkdGggKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogaGVpZ2h0ICsgJ3B4J1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHdpZHRoICo9IHRoaXMucmF0aW87XHJcbiAgICAgIGhlaWdodCAqPSB0aGlzLnJhdGlvO1xyXG5cclxuICAgICAgLy8gU2V0IGZvciB0aGlzLnN0YWdlIHBhcmVudCBzY2FsaW5nIHRvIGFjY291bnQgZm9yIEhEUElcclxuICAgICAgdGhpcy5fcmVuZGVyZXIubWF0cml4WzBdID0gdGhpcy5fcmVuZGVyZXIubWF0cml4WzRdID0gdGhpcy5fcmVuZGVyZXIuc2NhbGUgPSB0aGlzLnJhdGlvO1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ01hdHJpeCA9IHRydWU7XHJcblxyXG4gICAgICB0aGlzLmN0eC52aWV3cG9ydCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuXHJcbiAgICAgIHZhciByZXNvbHV0aW9uTG9jYXRpb24gPSB0aGlzLmN0eC5nZXRVbmlmb3JtTG9jYXRpb24oXHJcbiAgICAgICAgdGhpcy5wcm9ncmFtLCAndV9yZXNvbHV0aW9uJyk7XHJcbiAgICAgIHRoaXMuY3R4LnVuaWZvcm0yZihyZXNvbHV0aW9uTG9jYXRpb24sIHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGdsID0gdGhpcy5jdHg7XHJcblxyXG4gICAgICBpZiAoIXRoaXMub3ZlcmRyYXcpIHtcclxuICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHdlYmdsLmdyb3VwLnJlbmRlci5jYWxsKHRoaXMuc2NlbmUsIGdsLCB0aGlzLnByb2dyYW0pO1xyXG4gICAgICB0aGlzLl9mbGFnTWF0cml4ID0gZmFsc2U7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBTaGFwZSA9IFR3by5TaGFwZSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIC8vIFByaXZhdGUgb2JqZWN0IGZvciByZW5kZXJlciBzcGVjaWZpYyB2YXJpYWJsZXMuXHJcbiAgICB0aGlzLl9yZW5kZXJlciA9IHt9O1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ01hdHJpeCA9IF8uYmluZChTaGFwZS5GbGFnTWF0cml4LCB0aGlzKTtcclxuICAgIHRoaXMuaXNTaGFwZSA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5pZCA9IFR3by5JZGVudGlmaWVyICsgVHdvLnVuaXF1ZUlkKCk7XHJcbiAgICB0aGlzLmNsYXNzTGlzdCA9IFtdO1xyXG5cclxuICAgIC8vIERlZmluZSBtYXRyaXggcHJvcGVydGllcyB3aGljaCBhbGwgaW5oZXJpdGVkXHJcbiAgICAvLyBvYmplY3RzIG9mIFNoYXBlIGhhdmUuXHJcblxyXG4gICAgdGhpcy5fbWF0cml4ID0gbmV3IFR3by5NYXRyaXgoKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uID0gbmV3IFR3by5WZWN0b3IoKTtcclxuICAgIHRoaXMucm90YXRpb24gPSAwO1xyXG4gICAgdGhpcy5zY2FsZSA9IDE7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFNoYXBlLCB7XHJcblxyXG4gICAgRmxhZ01hdHJpeDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdNYXRyaXggPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAndHJhbnNsYXRpb24nLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3RyYW5zbGF0aW9uO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5fdHJhbnNsYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5fdHJhbnNsYXRpb24udW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnTWF0cml4KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMuX3RyYW5zbGF0aW9uID0gdjtcclxuICAgICAgICAgIHRoaXMuX3RyYW5zbGF0aW9uLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdNYXRyaXgpO1xyXG4gICAgICAgICAgU2hhcGUuRmxhZ01hdHJpeC5jYWxsKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAncm90YXRpb24nLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3JvdGF0aW9uO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzLl9yb3RhdGlvbiA9IHY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnTWF0cml4ID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ3NjYWxlJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9zY2FsZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2NhbGUudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnTWF0cml4KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9zY2FsZSA9IHY7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9zY2FsZS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnTWF0cml4KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9mbGFnTWF0cml4ID0gdHJ1ZTtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdTY2FsZSA9IHRydWU7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoU2hhcGUucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgLy8gRmxhZ3NcclxuXHJcbiAgICBfZmxhZ01hdHJpeDogdHJ1ZSxcclxuICAgIF9mbGFnU2NhbGU6IGZhbHNlLFxyXG5cclxuICAgIC8vIF9mbGFnTWFzazogZmFsc2UsXHJcbiAgICAvLyBfZmxhZ0NsaXA6IGZhbHNlLFxyXG5cclxuICAgIC8vIFVuZGVybHlpbmcgUHJvcGVydGllc1xyXG5cclxuICAgIF9yb3RhdGlvbjogMCxcclxuICAgIF9zY2FsZTogMSxcclxuICAgIF90cmFuc2xhdGlvbjogbnVsbCxcclxuXHJcbiAgICAvLyBfbWFzazogbnVsbCxcclxuICAgIC8vIF9jbGlwOiBmYWxzZSxcclxuXHJcbiAgICBhZGRUbzogZnVuY3Rpb24oZ3JvdXApIHtcclxuICAgICAgZ3JvdXAuYWRkKHRoaXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgU2hhcGUoKTtcclxuICAgICAgY2xvbmUudHJhbnNsYXRpb24uY29weSh0aGlzLnRyYW5zbGF0aW9uKTtcclxuICAgICAgY2xvbmUucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uO1xyXG4gICAgICBjbG9uZS5zY2FsZSA9IHRoaXMuc2NhbGU7XHJcbiAgICAgIF8uZWFjaChTaGFwZS5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgY2xvbmVba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuICAgICAgcmV0dXJuIGNsb25lLl91cGRhdGUoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUbyBiZSBjYWxsZWQgYmVmb3JlIHJlbmRlciB0aGF0IGNhbGN1bGF0ZXMgYW5kIGNvbGxhdGVzIGFsbCBpbmZvcm1hdGlvblxyXG4gICAgICogdG8gYmUgYXMgdXAtdG8tZGF0ZSBhcyBwb3NzaWJsZSBmb3IgdGhlIHJlbmRlci4gQ2FsbGVkIG9uY2UgYSBmcmFtZS5cclxuICAgICAqL1xyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oZGVlcCkge1xyXG5cclxuICAgICAgaWYgKCF0aGlzLl9tYXRyaXgubWFudWFsICYmIHRoaXMuX2ZsYWdNYXRyaXgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fbWF0cml4XHJcbiAgICAgICAgICAuaWRlbnRpdHkoKVxyXG4gICAgICAgICAgLnRyYW5zbGF0ZSh0aGlzLnRyYW5zbGF0aW9uLngsIHRoaXMudHJhbnNsYXRpb24ueSk7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9tYXRyaXguc2NhbGUodGhpcy5fc2NhbGUueCwgdGhpcy5fc2NhbGUueSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9tYXRyaXguc2NhbGUodGhpcy5fc2NhbGUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX21hdHJpeC5yb3RhdGUodGhpcy5yb3RhdGlvbik7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGVlcCkge1xyXG4gICAgICAgIC8vIEJ1YmJsZSB1cCB0byBwYXJlbnRzIG1haW5seSBmb3IgYGdldEJvdW5kaW5nQ2xpZW50UmVjdGAgbWV0aG9kLlxyXG4gICAgICAgIGlmICh0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC5fdXBkYXRlKSB7XHJcbiAgICAgICAgICB0aGlzLnBhcmVudC5fdXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnTWF0cml4ID0gdGhpcy5fZmxhZ1NjYWxlID0gZmFsc2U7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBTaGFwZS5NYWtlT2JzZXJ2YWJsZShTaGFwZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RhbnRzXHJcbiAgICovXHJcblxyXG4gIHZhciBtaW4gPSBNYXRoLm1pbiwgbWF4ID0gTWF0aC5tYXgsIHJvdW5kID0gTWF0aC5yb3VuZCxcclxuICAgIGdldENvbXB1dGVkTWF0cml4ID0gVHdvLlV0aWxzLmdldENvbXB1dGVkTWF0cml4O1xyXG5cclxuICB2YXIgY29tbWFuZHMgPSB7fTtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgXy5lYWNoKFR3by5Db21tYW5kcywgZnVuY3Rpb24odiwgaykge1xyXG4gICAgY29tbWFuZHNba10gPSBuZXcgUmVnRXhwKHYpO1xyXG4gIH0pO1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoID0gZnVuY3Rpb24odmVydGljZXMsIGNsb3NlZCwgY3VydmVkLCBtYW51YWwpIHtcclxuXHJcbiAgICBUd28uU2hhcGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlci50eXBlID0gJ3BhdGgnO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1ZlcnRpY2VzID0gXy5iaW5kKFBhdGguRmxhZ1ZlcnRpY2VzLCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLmJpbmRWZXJ0aWNlcyA9IF8uYmluZChQYXRoLkJpbmRWZXJ0aWNlcywgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci51bmJpbmRWZXJ0aWNlcyA9IF8uYmluZChQYXRoLlVuYmluZFZlcnRpY2VzLCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnRmlsbCA9IF8uYmluZChQYXRoLkZsYWdGaWxsLCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdTdHJva2UgPSBfLmJpbmQoUGF0aC5GbGFnU3Ryb2tlLCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLl9jbG9zZWQgPSAhIWNsb3NlZDtcclxuICAgIHRoaXMuX2N1cnZlZCA9ICEhY3VydmVkO1xyXG5cclxuICAgIHRoaXMuYmVnaW5uaW5nID0gMDtcclxuICAgIHRoaXMuZW5kaW5nID0gMTtcclxuXHJcbiAgICAvLyBTdHlsZSBwcm9wZXJ0aWVzXHJcblxyXG4gICAgdGhpcy5maWxsID0gJyNmZmYnO1xyXG4gICAgdGhpcy5zdHJva2UgPSAnIzAwMCc7XHJcbiAgICB0aGlzLmxpbmV3aWR0aCA9IDEuMDtcclxuICAgIHRoaXMub3BhY2l0eSA9IDEuMDtcclxuICAgIHRoaXMudmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgdGhpcy5jYXAgPSAnYnV0dCc7ICAgICAgLy8gRGVmYXVsdCBvZiBBZG9iZSBJbGx1c3RyYXRvclxyXG4gICAgdGhpcy5qb2luID0gJ21pdGVyJzsgICAgLy8gRGVmYXVsdCBvZiBBZG9iZSBJbGx1c3RyYXRvclxyXG4gICAgdGhpcy5taXRlciA9IDQ7ICAgICAgICAgLy8gRGVmYXVsdCBvZiBBZG9iZSBJbGx1c3RyYXRvclxyXG5cclxuICAgIHRoaXMuX3ZlcnRpY2VzID0gW107XHJcbiAgICB0aGlzLnZlcnRpY2VzID0gdmVydGljZXM7XHJcblxyXG4gICAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0d28uanMgc2hvdWxkIGNhbGN1bGF0ZSBjdXJ2ZXMsIGxpbmVzLCBhbmRcclxuICAgIC8vIGNvbW1hbmRzIGF1dG9tYXRpY2FsbHkgZm9yIHlvdSBvciB0byBsZXQgdGhlIGRldmVsb3BlciBtYW5pcHVsYXRlIHRoZW1cclxuICAgIC8vIGZvciB0aGVtc2VsdmVzLlxyXG4gICAgdGhpcy5hdXRvbWF0aWMgPSAhbWFudWFsO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChQYXRoLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogW1xyXG4gICAgICAnZmlsbCcsXHJcbiAgICAgICdzdHJva2UnLFxyXG4gICAgICAnbGluZXdpZHRoJyxcclxuICAgICAgJ29wYWNpdHknLFxyXG4gICAgICAndmlzaWJsZScsXHJcbiAgICAgICdjYXAnLFxyXG4gICAgICAnam9pbicsXHJcbiAgICAgICdtaXRlcicsXHJcblxyXG4gICAgICAnY2xvc2VkJyxcclxuICAgICAgJ2N1cnZlZCcsXHJcbiAgICAgICdhdXRvbWF0aWMnLFxyXG4gICAgICAnYmVnaW5uaW5nJyxcclxuICAgICAgJ2VuZGluZydcclxuICAgIF0sXHJcblxyXG4gICAgRmxhZ1ZlcnRpY2VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ1ZlcnRpY2VzID0gdHJ1ZTtcclxuICAgICAgdGhpcy5fZmxhZ0xlbmd0aCA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIEJpbmRWZXJ0aWNlczogZnVuY3Rpb24oaXRlbXMpIHtcclxuXHJcbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGEgbG90XHJcbiAgICAgIC8vIHdoZW4gaW1wb3J0aW5nIGEgbGFyZ2UgU1ZHXHJcbiAgICAgIHZhciBpID0gaXRlbXMubGVuZ3RoO1xyXG4gICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgaXRlbXNbaV0uYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1ZlcnRpY2VzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1ZlcnRpY2VzKCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBVbmJpbmRWZXJ0aWNlczogZnVuY3Rpb24oaXRlbXMpIHtcclxuXHJcbiAgICAgIHZhciBpID0gaXRlbXMubGVuZ3RoO1xyXG4gICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgaXRlbXNbaV0udW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnVmVydGljZXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9yZW5kZXJlci5mbGFnVmVydGljZXMoKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIEZsYWdGaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ0ZpbGwgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBGbGFnU3Ryb2tlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ1N0cm9rZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgIFR3by5TaGFwZS5NYWtlT2JzZXJ2YWJsZShvYmplY3QpO1xyXG5cclxuICAgICAgLy8gT25seSB0aGUgNiBkZWZpbmVkIHByb3BlcnRpZXMgYXJlIGZsYWdnZWQgbGlrZSB0aGlzLiBUaGUgc3Vic2VxdWVudFxyXG4gICAgICAvLyBwcm9wZXJ0aWVzIGJlaGF2ZSBkaWZmZXJlbnRseSBhbmQgbmVlZCB0byBiZSBoYW5kIHdyaXR0ZW4uXHJcbiAgICAgIF8uZWFjaChQYXRoLlByb3BlcnRpZXMuc2xpY2UoMiwgOCksIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqZWN0KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdmaWxsJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9maWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihmKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9maWxsLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ0ZpbGwpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX2ZpbGwgPSBmO1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ0ZpbGwgPSB0cnVlO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmlsbC5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnRmlsbCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnc3Ryb2tlJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9zdHJva2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGYpIHtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3Ryb2tlLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0cm9rZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fc3Ryb2tlID0gZjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdTdHJva2UgPSB0cnVlO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdHJva2UuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0cm9rZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnbGVuZ3RoJywge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5fZmxhZ0xlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLl91cGRhdGVMZW5ndGgoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiB0aGlzLl9sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdjbG9zZWQnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlZDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpcy5fY2xvc2VkID0gISF2O1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ1ZlcnRpY2VzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2N1cnZlZCcsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY3VydmVkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzLl9jdXJ2ZWQgPSAhIXY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnVmVydGljZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnYXV0b21hdGljJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9hdXRvbWF0aWM7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIGlmICh2ID09PSB0aGlzLl9hdXRvbWF0aWMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy5fYXV0b21hdGljID0gISF2O1xyXG4gICAgICAgICAgdmFyIG1ldGhvZCA9IHRoaXMuX2F1dG9tYXRpYyA/ICdpZ25vcmUnIDogJ2xpc3Rlbic7XHJcbiAgICAgICAgICBfLmVhY2godGhpcy52ZXJ0aWNlcywgZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgICB2W21ldGhvZF0oKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnYmVnaW5uaW5nJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9iZWdpbm5pbmc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXMuX2JlZ2lubmluZyA9IHY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnVmVydGljZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnZW5kaW5nJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9lbmRpbmc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXMuX2VuZGluZyA9IHY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnVmVydGljZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAndmVydGljZXMnLCB7XHJcblxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY29sbGVjdGlvbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZlcnRpY2VzKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHVwZGF0ZVZlcnRpY2VzID0gdGhpcy5fcmVuZGVyZXIuZmxhZ1ZlcnRpY2VzO1xyXG4gICAgICAgICAgdmFyIGJpbmRWZXJ0aWNlcyA9IHRoaXMuX3JlbmRlcmVyLmJpbmRWZXJ0aWNlcztcclxuICAgICAgICAgIHZhciB1bmJpbmRWZXJ0aWNlcyA9IHRoaXMuX3JlbmRlcmVyLnVuYmluZFZlcnRpY2VzO1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSBwcmV2aW91cyBsaXN0ZW5lcnNcclxuICAgICAgICAgIGlmICh0aGlzLl9jb2xsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbGxlY3Rpb25cclxuICAgICAgICAgICAgICAudW5iaW5kKFR3by5FdmVudHMuaW5zZXJ0LCBiaW5kVmVydGljZXMpXHJcbiAgICAgICAgICAgICAgLnVuYmluZChUd28uRXZlbnRzLnJlbW92ZSwgdW5iaW5kVmVydGljZXMpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIENyZWF0ZSBuZXcgQ29sbGVjdGlvbiB3aXRoIGNvcHkgb2YgdmVydGljZXNcclxuICAgICAgICAgIHRoaXMuX2NvbGxlY3Rpb24gPSBuZXcgVHdvLlV0aWxzLkNvbGxlY3Rpb24oKHZlcnRpY2VzIHx8IFtdKS5zbGljZSgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gTGlzdGVuIGZvciBDb2xsZWN0aW9uIGNoYW5nZXMgYW5kIGJpbmQgLyB1bmJpbmRcclxuICAgICAgICAgIHRoaXMuX2NvbGxlY3Rpb25cclxuICAgICAgICAgICAgLmJpbmQoVHdvLkV2ZW50cy5pbnNlcnQsIGJpbmRWZXJ0aWNlcylcclxuICAgICAgICAgICAgLmJpbmQoVHdvLkV2ZW50cy5yZW1vdmUsIHVuYmluZFZlcnRpY2VzKTtcclxuXHJcbiAgICAgICAgICAvLyBCaW5kIEluaXRpYWwgVmVydGljZXNcclxuICAgICAgICAgIGJpbmRWZXJ0aWNlcyh0aGlzLl9jb2xsZWN0aW9uKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnY2xpcCcsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY2xpcDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpcy5fY2xpcCA9IHY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnQ2xpcCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChQYXRoLnByb3RvdHlwZSwgVHdvLlNoYXBlLnByb3RvdHlwZSwge1xyXG5cclxuICAgIC8vIEZsYWdzXHJcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0ZsYWdcclxuXHJcbiAgICBfZmxhZ1ZlcnRpY2VzOiB0cnVlLFxyXG4gICAgX2ZsYWdMZW5ndGg6IHRydWUsXHJcblxyXG4gICAgX2ZsYWdGaWxsOiB0cnVlLFxyXG4gICAgX2ZsYWdTdHJva2U6IHRydWUsXHJcbiAgICBfZmxhZ0xpbmV3aWR0aDogdHJ1ZSxcclxuICAgIF9mbGFnT3BhY2l0eTogdHJ1ZSxcclxuICAgIF9mbGFnVmlzaWJsZTogdHJ1ZSxcclxuXHJcbiAgICBfZmxhZ0NhcDogdHJ1ZSxcclxuICAgIF9mbGFnSm9pbjogdHJ1ZSxcclxuICAgIF9mbGFnTWl0ZXI6IHRydWUsXHJcblxyXG4gICAgX2ZsYWdDbGlwOiBmYWxzZSxcclxuXHJcbiAgICAvLyBVbmRlcmx5aW5nIFByb3BlcnRpZXNcclxuXHJcbiAgICBfbGVuZ3RoOiAwLFxyXG5cclxuICAgIF9maWxsOiAnI2ZmZicsXHJcbiAgICBfc3Ryb2tlOiAnIzAwMCcsXHJcbiAgICBfbGluZXdpZHRoOiAxLjAsXHJcbiAgICBfb3BhY2l0eTogMS4wLFxyXG4gICAgX3Zpc2libGU6IHRydWUsXHJcblxyXG4gICAgX2NhcDogJ3JvdW5kJyxcclxuICAgIF9qb2luOiAncm91bmQnLFxyXG4gICAgX21pdGVyOiA0LFxyXG5cclxuICAgIF9jbG9zZWQ6IHRydWUsXHJcbiAgICBfY3VydmVkOiBmYWxzZSxcclxuICAgIF9hdXRvbWF0aWM6IHRydWUsXHJcbiAgICBfYmVnaW5uaW5nOiAwLFxyXG4gICAgX2VuZGluZzogMS4wLFxyXG5cclxuICAgIF9jbGlwOiBmYWxzZSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24ocGFyZW50KSB7XHJcblxyXG4gICAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICB2YXIgcG9pbnRzID0gXy5tYXAodGhpcy52ZXJ0aWNlcywgZnVuY3Rpb24odikge1xyXG4gICAgICAgIHJldHVybiB2LmNsb25lKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IFBhdGgocG9pbnRzLCB0aGlzLmNsb3NlZCwgdGhpcy5jdXJ2ZWQsICF0aGlzLmF1dG9tYXRpYyk7XHJcblxyXG4gICAgICBfLmVhY2goVHdvLlBhdGguUHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIGNsb25lW2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICBjbG9uZS50cmFuc2xhdGlvbi5jb3B5KHRoaXMudHJhbnNsYXRpb24pO1xyXG4gICAgICBjbG9uZS5yb3RhdGlvbiA9IHRoaXMucm90YXRpb247XHJcbiAgICAgIGNsb25lLnNjYWxlID0gdGhpcy5zY2FsZTtcclxuXHJcbiAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICBwYXJlbnQuYWRkKGNsb25lKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICB2ZXJ0aWNlczogXy5tYXAodGhpcy52ZXJ0aWNlcywgZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgcmV0dXJuIHYudG9PYmplY3QoKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgXy5lYWNoKFR3by5TaGFwZS5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgcmVzdWx0W2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICByZXN1bHQudHJhbnNsYXRpb24gPSB0aGlzLnRyYW5zbGF0aW9uLnRvT2JqZWN0O1xyXG4gICAgICByZXN1bHQucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uO1xyXG4gICAgICByZXN1bHQuc2NhbGUgPSB0aGlzLnNjYWxlO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG5vRmlsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuZmlsbCA9ICd0cmFuc3BhcmVudCc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBub1N0cm9rZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuc3Ryb2tlID0gJ3RyYW5zcGFyZW50JztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3JpZW50IHRoZSB2ZXJ0aWNlcyBvZiB0aGUgc2hhcGUgdG8gdGhlIHVwcGVyIGxlZnRoYW5kXHJcbiAgICAgKiBjb3JuZXIgb2YgdGhlIHBhdGguXHJcbiAgICAgKi9cclxuICAgIGNvcm5lcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVjdCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRydWUpO1xyXG5cclxuICAgICAgcmVjdC5jZW50cm9pZCA9IHtcclxuICAgICAgICB4OiByZWN0LmxlZnQgKyByZWN0LndpZHRoIC8gMixcclxuICAgICAgICB5OiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMlxyXG4gICAgICB9O1xyXG5cclxuICAgICAgXy5lYWNoKHRoaXMudmVydGljZXMsIGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICB2LmFkZFNlbGYocmVjdC5jZW50cm9pZCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9yaWVudCB0aGUgdmVydGljZXMgb2YgdGhlIHNoYXBlIHRvIHRoZSBjZW50ZXIgb2YgdGhlXHJcbiAgICAgKiBwYXRoLlxyXG4gICAgICovXHJcbiAgICBjZW50ZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlY3QgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCh0cnVlKTtcclxuXHJcbiAgICAgIHJlY3QuY2VudHJvaWQgPSB7XHJcbiAgICAgICAgeDogcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCAvIDIsXHJcbiAgICAgICAgeTogcmVjdC50b3AgKyByZWN0LmhlaWdodCAvIDJcclxuICAgICAgfTtcclxuXHJcbiAgICAgIF8uZWFjaCh0aGlzLnZlcnRpY2VzLCBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgdi5zdWJTZWxmKHJlY3QuY2VudHJvaWQpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIHRoaXMudHJhbnNsYXRpb24uYWRkU2VsZihyZWN0LmNlbnRyb2lkKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgc2VsZiBmcm9tIHRoZSBzY2VuZSAvIHBhcmVudC5cclxuICAgICAqL1xyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICghdGhpcy5wYXJlbnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5wYXJlbnQucmVtb3ZlKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBhbiBvYmplY3Qgd2l0aCB0b3AsIGxlZnQsIHJpZ2h0LCBib3R0b20sIHdpZHRoLCBhbmQgaGVpZ2h0XHJcbiAgICAgKiBwYXJhbWV0ZXJzIG9mIHRoZSBncm91cC5cclxuICAgICAqL1xyXG4gICAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiBmdW5jdGlvbihzaGFsbG93KSB7XHJcbiAgICAgIHZhciBtYXRyaXgsIGJvcmRlciwgbCwgeCwgeSwgaSwgdjtcclxuXHJcbiAgICAgIHZhciBsZWZ0ID0gSW5maW5pdHksIHJpZ2h0ID0gLUluZmluaXR5LFxyXG4gICAgICAgICAgdG9wID0gSW5maW5pdHksIGJvdHRvbSA9IC1JbmZpbml0eTtcclxuXHJcbiAgICAgIC8vIFRPRE86IFVwZGF0ZSB0aGlzIHRvIG5vdCBfX2Fsd2F5c19fIHVwZGF0ZS4gSnVzdCB3aGVuIGl0IG5lZWRzIHRvLlxyXG4gICAgICB0aGlzLl91cGRhdGUodHJ1ZSk7XHJcblxyXG4gICAgICBtYXRyaXggPSAhIXNoYWxsb3cgPyB0aGlzLl9tYXRyaXggOiBnZXRDb21wdXRlZE1hdHJpeCh0aGlzKTtcclxuXHJcbiAgICAgIGJvcmRlciA9IHRoaXMubGluZXdpZHRoIC8gMjtcclxuICAgICAgbCA9IHRoaXMuX3ZlcnRpY2VzLmxlbmd0aDtcclxuXHJcbiAgICAgIGlmIChsIDw9IDApIHtcclxuICAgICAgICB2ID0gbWF0cml4Lm11bHRpcGx5KDAsIDAsIDEpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICB0b3A6IHYueSxcclxuICAgICAgICAgIGxlZnQ6IHYueCxcclxuICAgICAgICAgIHJpZ2h0OiB2LngsXHJcbiAgICAgICAgICBib3R0b206IHYueSxcclxuICAgICAgICAgIHdpZHRoOiAwLFxyXG4gICAgICAgICAgaGVpZ2h0OiAwXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHYgPSB0aGlzLl92ZXJ0aWNlc1tpXTtcclxuXHJcbiAgICAgICAgeCA9IHYueDtcclxuICAgICAgICB5ID0gdi55O1xyXG5cclxuICAgICAgICB2ID0gbWF0cml4Lm11bHRpcGx5KHgsIHksIDEpO1xyXG4gICAgICAgIHRvcCA9IG1pbih2LnkgLSBib3JkZXIsIHRvcCk7XHJcbiAgICAgICAgbGVmdCA9IG1pbih2LnggLSBib3JkZXIsIGxlZnQpO1xyXG4gICAgICAgIHJpZ2h0ID0gbWF4KHYueCArIGJvcmRlciwgcmlnaHQpO1xyXG4gICAgICAgIGJvdHRvbSA9IG1heCh2LnkgKyBib3JkZXIsIGJvdHRvbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiB0b3AsXHJcbiAgICAgICAgbGVmdDogbGVmdCxcclxuICAgICAgICByaWdodDogcmlnaHQsXHJcbiAgICAgICAgYm90dG9tOiBib3R0b20sXHJcbiAgICAgICAgd2lkdGg6IHJpZ2h0IC0gbGVmdCxcclxuICAgICAgICBoZWlnaHQ6IGJvdHRvbSAtIHRvcFxyXG4gICAgICB9O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHaXZlbiBhIGZsb2F0IGB0YCBmcm9tIDAgdG8gMSwgcmV0dXJuIGEgcG9pbnQgb3IgYXNzaWduIGEgcGFzc2VkIGBvYmpgJ3NcclxuICAgICAqIGNvb3JkaW5hdGVzIHRvIHRoYXQgcGVyY2VudGFnZSBvbiB0aGlzIFR3by5QYXRoJ3MgY3VydmUuXHJcbiAgICAgKi9cclxuICAgIGdldFBvaW50QXQ6IGZ1bmN0aW9uKHQsIG9iaikge1xyXG4gICAgICB2YXIgaWEsIGliO1xyXG4gICAgICB2YXIgeCwgeDEsIHgyLCB4MywgeDQsIHksIHkxLCB5MiwgeTMsIHk0LCBsZWZ0LCByaWdodDtcclxuICAgICAgdmFyIHRhcmdldCA9IHRoaXMubGVuZ3RoICogTWF0aC5taW4oTWF0aC5tYXgodCwgMCksIDEpO1xyXG4gICAgICB2YXIgbGVuZ3RoID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgICAgIHZhciBsYXN0ID0gbGVuZ3RoIC0gMTtcclxuXHJcbiAgICAgIHZhciBhID0gbnVsbDtcclxuICAgICAgdmFyIGIgPSBudWxsO1xyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9sZW5ndGhzLmxlbmd0aCwgc3VtID0gMDsgaSA8IGw7IGkrKykge1xyXG5cclxuICAgICAgICBpZiAoc3VtICsgdGhpcy5fbGVuZ3Roc1tpXSA+PSB0YXJnZXQpIHtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIGlhID0gVHdvLlV0aWxzLm1vZChpLCBsZW5ndGgpO1xyXG4gICAgICAgICAgICBpYiA9IFR3by5VdGlscy5tb2QoaSAtIDEsIGxlbmd0aCk7XHJcbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgaWEgPSBpYjtcclxuICAgICAgICAgICAgICBpYiA9IGk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlhID0gaTtcclxuICAgICAgICAgICAgaWIgPSBNYXRoLm1pbihNYXRoLm1heChpIC0gMSwgMCksIGxhc3QpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGEgPSB0aGlzLnZlcnRpY2VzW2lhXTtcclxuICAgICAgICAgIGIgPSB0aGlzLnZlcnRpY2VzW2liXTtcclxuICAgICAgICAgIHRhcmdldCAtPSBzdW07XHJcbiAgICAgICAgICBpZiAodGhpcy5fbGVuZ3Roc1tpXSAhPT0gMCkge1xyXG4gICAgICAgICAgICB0ID0gdGFyZ2V0IC8gdGhpcy5fbGVuZ3Roc1tpXTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdW0gKz0gdGhpcy5fbGVuZ3Roc1tpXTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKHN1bSwgYS5jb21tYW5kLCBiLmNvbW1hbmQpO1xyXG5cclxuICAgICAgaWYgKF8uaXNOdWxsKGEpIHx8IF8uaXNOdWxsKGIpKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJpZ2h0ID0gYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLnJpZ2h0O1xyXG4gICAgICBsZWZ0ID0gYS5jb250cm9scyAmJiBhLmNvbnRyb2xzLmxlZnQ7XHJcblxyXG4gICAgICB4MSA9IGIueDtcclxuICAgICAgeTEgPSBiLnk7XHJcbiAgICAgIHgyID0gKHJpZ2h0IHx8IGIpLng7XHJcbiAgICAgIHkyID0gKHJpZ2h0IHx8IGIpLnk7XHJcbiAgICAgIHgzID0gKGxlZnQgfHwgYSkueDtcclxuICAgICAgeTMgPSAobGVmdCB8fCBhKS55O1xyXG4gICAgICB4NCA9IGEueDtcclxuICAgICAgeTQgPSBhLnk7XHJcblxyXG4gICAgICBpZiAocmlnaHQgJiYgYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICB4MiArPSBiLng7XHJcbiAgICAgICAgeTIgKz0gYi55O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAobGVmdCAmJiBhLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgIHgzICs9IGEueDtcclxuICAgICAgICB5MyArPSBhLnk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHggPSBUd28uVXRpbHMuZ2V0UG9pbnRPbkN1YmljQmV6aWVyKHQsIHgxLCB4MiwgeDMsIHg0KTtcclxuICAgICAgeSA9IFR3by5VdGlscy5nZXRQb2ludE9uQ3ViaWNCZXppZXIodCwgeTEsIHkyLCB5MywgeTQpO1xyXG5cclxuICAgICAgaWYgKF8uaXNPYmplY3Qob2JqKSkge1xyXG4gICAgICAgIG9iai54ID0geDtcclxuICAgICAgICBvYmoueSA9IHk7XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5ldyBUd28uVmVjdG9yKHgsIHkpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCYXNlZCBvbiBjbG9zZWQgLyBjdXJ2ZWQgYW5kIHNvcnRpbmcgb2YgdmVydGljZXMgcGxvdCB3aGVyZSBhbGwgcG9pbnRzXHJcbiAgICAgKiBzaG91bGQgYmUgYW5kIHdoZXJlIHRoZSByZXNwZWN0aXZlIGhhbmRsZXMgc2hvdWxkIGJlIHRvby5cclxuICAgICAqL1xyXG4gICAgcGxvdDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5jdXJ2ZWQpIHtcclxuICAgICAgICBUd28uVXRpbHMuZ2V0Q3VydmVGcm9tUG9pbnRzKHRoaXMuX3ZlcnRpY2VzLCB0aGlzLmNsb3NlZCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fdmVydGljZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB0aGlzLl92ZXJ0aWNlc1tpXS5fY29tbWFuZCA9IGkgPT09IDAgPyBUd28uQ29tbWFuZHMubW92ZSA6IFR3by5Db21tYW5kcy5saW5lO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHN1YmRpdmlkZTogZnVuY3Rpb24obGltaXQpIHtcclxuICAgICAgLy9UT0RPOiBEUlluZXNzIChmdW5jdGlvbiBiZWxvdylcclxuICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICB2YXIgbGFzdCA9IHRoaXMudmVydGljZXMubGVuZ3RoIC0gMTtcclxuICAgICAgdmFyIGIgPSB0aGlzLnZlcnRpY2VzW2xhc3RdO1xyXG4gICAgICB2YXIgY2xvc2VkID0gdGhpcy5fY2xvc2VkIHx8IHRoaXMudmVydGljZXNbbGFzdF0uX2NvbW1hbmQgPT09IFR3by5Db21tYW5kcy5jbG9zZTtcclxuICAgICAgdmFyIHBvaW50cyA9IFtdO1xyXG4gICAgICBfLmVhY2godGhpcy52ZXJ0aWNlcywgZnVuY3Rpb24oYSwgaSkge1xyXG5cclxuICAgICAgICBpZiAoaSA8PSAwICYmICFjbG9zZWQpIHtcclxuICAgICAgICAgIGIgPSBhO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGEuY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLm1vdmUpIHtcclxuICAgICAgICAgIHBvaW50cy5wdXNoKG5ldyBUd28uQW5jaG9yKGIueCwgYi55KSk7XHJcbiAgICAgICAgICBpZiAoaSA+IDApIHtcclxuICAgICAgICAgICAgcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXS5jb21tYW5kID0gVHdvLkNvbW1hbmRzLmxpbmU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBiID0gYTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB2ZXJ0cyA9IGdldFN1YmRpdmlzaW9ucyhhLCBiLCBsaW1pdCk7XHJcbiAgICAgICAgcG9pbnRzID0gcG9pbnRzLmNvbmNhdCh2ZXJ0cyk7XHJcblxyXG4gICAgICAgIC8vIEFzc2lnbiBjb21tYW5kcyB0byBhbGwgdGhlIHZlcnRzXHJcbiAgICAgICAgXy5lYWNoKHZlcnRzLCBmdW5jdGlvbih2LCBpKSB7XHJcbiAgICAgICAgICBpZiAoaSA8PSAwICYmIGIuY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLm1vdmUpIHtcclxuICAgICAgICAgICAgdi5jb21tYW5kID0gVHdvLkNvbW1hbmRzLm1vdmU7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2LmNvbW1hbmQgPSBUd28uQ29tbWFuZHMubGluZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGkgPj0gbGFzdCkge1xyXG5cclxuICAgICAgICAgIC8vIFRPRE86IEFkZCBjaGVjayBpZiB0aGUgdHdvIHZlY3RvcnMgaW4gcXVlc3Rpb24gYXJlIHRoZSBzYW1lIHZhbHVlcy5cclxuICAgICAgICAgIGlmICh0aGlzLl9jbG9zZWQgJiYgdGhpcy5fYXV0b21hdGljKSB7XHJcblxyXG4gICAgICAgICAgICBiID0gYTtcclxuXHJcbiAgICAgICAgICAgIHZlcnRzID0gZ2V0U3ViZGl2aXNpb25zKGEsIGIsIGxpbWl0KTtcclxuICAgICAgICAgICAgcG9pbnRzID0gcG9pbnRzLmNvbmNhdCh2ZXJ0cyk7XHJcblxyXG4gICAgICAgICAgICAvLyBBc3NpZ24gY29tbWFuZHMgdG8gYWxsIHRoZSB2ZXJ0c1xyXG4gICAgICAgICAgICBfLmVhY2godmVydHMsIGZ1bmN0aW9uKHYsIGkpIHtcclxuICAgICAgICAgICAgICBpZiAoaSA8PSAwICYmIGIuY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLm1vdmUpIHtcclxuICAgICAgICAgICAgICAgIHYuY29tbWFuZCA9IFR3by5Db21tYW5kcy5tb3ZlO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2LmNvbW1hbmQgPSBUd28uQ29tbWFuZHMubGluZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSBpZiAoY2xvc2VkKSB7XHJcbiAgICAgICAgICAgIHBvaW50cy5wdXNoKG5ldyBUd28uQW5jaG9yKGEueCwgYS55KSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXS5jb21tYW5kID0gY2xvc2VkID8gVHdvLkNvbW1hbmRzLmNsb3NlIDogVHdvLkNvbW1hbmRzLmxpbmU7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYiA9IGE7XHJcblxyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHRoaXMuX2F1dG9tYXRpYyA9IGZhbHNlO1xyXG4gICAgICB0aGlzLl9jdXJ2ZWQgPSBmYWxzZTtcclxuICAgICAgdGhpcy52ZXJ0aWNlcyA9IHBvaW50cztcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgX3VwZGF0ZUxlbmd0aDogZnVuY3Rpb24obGltaXQpIHtcclxuICAgICAgLy9UT0RPOiBEUlluZXNzIChmdW5jdGlvbiBhYm92ZSlcclxuICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICB2YXIgbGVuZ3RoID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgICAgIHZhciBsYXN0ID0gbGVuZ3RoIC0gMTtcclxuICAgICAgdmFyIGIgPSB0aGlzLnZlcnRpY2VzW2xhc3RdO1xyXG4gICAgICB2YXIgY2xvc2VkID0gdGhpcy5fY2xvc2VkIHx8IHRoaXMudmVydGljZXNbbGFzdF0uX2NvbW1hbmQgPT09IFR3by5Db21tYW5kcy5jbG9zZTtcclxuICAgICAgdmFyIHN1bSA9IDA7XHJcblxyXG4gICAgICBpZiAoXy5pc1VuZGVmaW5lZCh0aGlzLl9sZW5ndGhzKSkge1xyXG4gICAgICAgIHRoaXMuX2xlbmd0aHMgPSBbXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgXy5lYWNoKHRoaXMudmVydGljZXMsIGZ1bmN0aW9uKGEsIGkpIHtcclxuXHJcbiAgICAgICAgaWYgKChpIDw9IDAgJiYgIWNsb3NlZCkgfHwgYS5jb21tYW5kID09PSBUd28uQ29tbWFuZHMubW92ZSkge1xyXG4gICAgICAgICAgYiA9IGE7XHJcbiAgICAgICAgICB0aGlzLl9sZW5ndGhzW2ldID0gMDtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2xlbmd0aHNbaV0gPSBnZXRDdXJ2ZUxlbmd0aChhLCBiLCBsaW1pdCk7XHJcbiAgICAgICAgc3VtICs9IHRoaXMuX2xlbmd0aHNbaV07XHJcblxyXG4gICAgICAgIGlmIChpID49IGxhc3QgJiYgY2xvc2VkKSB7XHJcblxyXG4gICAgICAgICAgYiA9IHRoaXMudmVydGljZXNbKGkgKyAxKSAlIGxlbmd0aF07XHJcblxyXG4gICAgICAgICAgdGhpcy5fbGVuZ3Roc1tpICsgMV0gPSBnZXRDdXJ2ZUxlbmd0aChhLCBiLCBsaW1pdCk7XHJcbiAgICAgICAgICBzdW0gKz0gdGhpcy5fbGVuZ3Roc1tpICsgMV07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYiA9IGE7XHJcblxyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHRoaXMuX2xlbmd0aCA9IHN1bTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1ZlcnRpY2VzKSB7XHJcblxyXG4gICAgICAgIHZhciBsID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGxhc3QgPSBsIC0gMSwgdjtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogU2hvdWxkIGNsYW1wIHRoaXMgc28gdGhhdCBgaWFgIGFuZCBgaWJgXHJcbiAgICAgICAgLy8gY2Fubm90IHNlbGVjdCBub24tdmVydHMuXHJcbiAgICAgICAgdmFyIGlhID0gcm91bmQoKHRoaXMuX2JlZ2lubmluZykgKiBsYXN0KTtcclxuICAgICAgICB2YXIgaWIgPSByb3VuZCgodGhpcy5fZW5kaW5nKSAqIGxhc3QpO1xyXG5cclxuICAgICAgICB0aGlzLl92ZXJ0aWNlcy5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gaWE7IGkgPCBpYiArIDE7IGkrKykge1xyXG4gICAgICAgICAgdiA9IHRoaXMudmVydGljZXNbaV07XHJcbiAgICAgICAgICB0aGlzLl92ZXJ0aWNlcy5wdXNoKHYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2F1dG9tYXRpYykge1xyXG4gICAgICAgICAgdGhpcy5wbG90KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgVHdvLlNoYXBlLnByb3RvdHlwZS5fdXBkYXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnVmVydGljZXMgPSAgdGhpcy5fZmxhZ0ZpbGwgPSAgdGhpcy5fZmxhZ1N0cm9rZSA9XHJcbiAgICAgICAgIHRoaXMuX2ZsYWdMaW5ld2lkdGggPSB0aGlzLl9mbGFnT3BhY2l0eSA9IHRoaXMuX2ZsYWdWaXNpYmxlID1cclxuICAgICAgICAgdGhpcy5fZmxhZ0NhcCA9IHRoaXMuX2ZsYWdKb2luID0gdGhpcy5fZmxhZ01pdGVyID1cclxuICAgICAgICAgdGhpcy5fZmxhZ0NsaXAgPSBmYWxzZTtcclxuXHJcbiAgICAgIFR3by5TaGFwZS5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBQYXRoLk1ha2VPYnNlcnZhYmxlKFBhdGgucHJvdG90eXBlKTtcclxuXHJcbiAgLyoqXHJcbiAgICogVXRpbGl0eSBmdW5jdGlvbnNcclxuICAgKi9cclxuXHJcbiAgZnVuY3Rpb24gZ2V0Q3VydmVMZW5ndGgoYSwgYiwgbGltaXQpIHtcclxuICAgIC8vIFRPRE86IERSWW5lc3NcclxuICAgIHZhciB4MSwgeDIsIHgzLCB4NCwgeTEsIHkyLCB5MywgeTQ7XHJcblxyXG4gICAgdmFyIHJpZ2h0ID0gYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLnJpZ2h0O1xyXG4gICAgdmFyIGxlZnQgPSBhLmNvbnRyb2xzICYmIGEuY29udHJvbHMubGVmdDtcclxuXHJcbiAgICB4MSA9IGIueDtcclxuICAgIHkxID0gYi55O1xyXG4gICAgeDIgPSAocmlnaHQgfHwgYikueDtcclxuICAgIHkyID0gKHJpZ2h0IHx8IGIpLnk7XHJcbiAgICB4MyA9IChsZWZ0IHx8IGEpLng7XHJcbiAgICB5MyA9IChsZWZ0IHx8IGEpLnk7XHJcbiAgICB4NCA9IGEueDtcclxuICAgIHk0ID0gYS55O1xyXG5cclxuICAgIGlmIChyaWdodCAmJiBiLl9yZWxhdGl2ZSkge1xyXG4gICAgICB4MiArPSBiLng7XHJcbiAgICAgIHkyICs9IGIueTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobGVmdCAmJiBhLl9yZWxhdGl2ZSkge1xyXG4gICAgICB4MyArPSBhLng7XHJcbiAgICAgIHkzICs9IGEueTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gVHdvLlV0aWxzLmdldEN1cnZlTGVuZ3RoKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgbGltaXQpO1xyXG5cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdldFN1YmRpdmlzaW9ucyhhLCBiLCBsaW1pdCkge1xyXG4gICAgLy8gVE9ETzogRFJZbmVzc1xyXG4gICAgdmFyIHgxLCB4MiwgeDMsIHg0LCB5MSwgeTIsIHkzLCB5NDtcclxuXHJcbiAgICB2YXIgcmlnaHQgPSBiLmNvbnRyb2xzICYmIGIuY29udHJvbHMucmlnaHQ7XHJcbiAgICB2YXIgbGVmdCA9IGEuY29udHJvbHMgJiYgYS5jb250cm9scy5sZWZ0O1xyXG5cclxuICAgIHgxID0gYi54O1xyXG4gICAgeTEgPSBiLnk7XHJcbiAgICB4MiA9IChyaWdodCB8fCBiKS54O1xyXG4gICAgeTIgPSAocmlnaHQgfHwgYikueTtcclxuICAgIHgzID0gKGxlZnQgfHwgYSkueDtcclxuICAgIHkzID0gKGxlZnQgfHwgYSkueTtcclxuICAgIHg0ID0gYS54O1xyXG4gICAgeTQgPSBhLnk7XHJcblxyXG4gICAgaWYgKHJpZ2h0ICYmIGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgIHgyICs9IGIueDtcclxuICAgICAgeTIgKz0gYi55O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChsZWZ0ICYmIGEuX3JlbGF0aXZlKSB7XHJcbiAgICAgIHgzICs9IGEueDtcclxuICAgICAgeTMgKz0gYS55O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBUd28uVXRpbHMuc3ViZGl2aWRlKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgbGltaXQpO1xyXG5cclxuICB9XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgTGluZSA9IFR3by5MaW5lID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcclxuXHJcbiAgICB2YXIgd2lkdGggPSB4MiAtIHgxO1xyXG4gICAgdmFyIGhlaWdodCA9IHkyIC0geTE7XHJcblxyXG4gICAgdmFyIHcyID0gd2lkdGggLyAyO1xyXG4gICAgdmFyIGgyID0gaGVpZ2h0IC8gMjtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgW1xyXG4gICAgICAgIG5ldyBUd28uQW5jaG9yKC0gdzIsIC0gaDIpLFxyXG4gICAgICAgIG5ldyBUd28uQW5jaG9yKHcyLCBoMilcclxuICAgIF0pO1xyXG5cclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KHgxICsgdzIsIHkxICsgaDIpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChMaW5lLnByb3RvdHlwZSwgUGF0aC5wcm90b3R5cGUpO1xyXG5cclxuICBQYXRoLk1ha2VPYnNlcnZhYmxlKExpbmUucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGg7XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBSZWN0YW5nbGUgPSBUd28uUmVjdGFuZ2xlID0gZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCkge1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBbXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKCksXHJcbiAgICAgIG5ldyBUd28uQW5jaG9yKClcclxuICAgIF0sIHRydWUpO1xyXG5cclxuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQoeCwgeSk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFJlY3RhbmdsZSwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFsnd2lkdGgnLCAnaGVpZ2h0J10sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICBQYXRoLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChSZWN0YW5nbGUuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUmVjdGFuZ2xlLnByb3RvdHlwZSwgUGF0aC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfd2lkdGg6IDAsXHJcbiAgICBfaGVpZ2h0OiAwLFxyXG5cclxuICAgIF9mbGFnV2lkdGg6IDAsXHJcbiAgICBfZmxhZ0hlaWdodDogMCxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnV2lkdGggfHwgdGhpcy5fZmxhZ0hlaWdodCkge1xyXG5cclxuICAgICAgICB2YXIgeHIgPSB0aGlzLl93aWR0aCAvIDI7XHJcbiAgICAgICAgdmFyIHlyID0gdGhpcy5faGVpZ2h0IC8gMjtcclxuXHJcbiAgICAgICAgdGhpcy52ZXJ0aWNlc1swXS5zZXQoLXhyLCAteXIpO1xyXG4gICAgICAgIHRoaXMudmVydGljZXNbMV0uc2V0KHhyLCAteXIpO1xyXG4gICAgICAgIHRoaXMudmVydGljZXNbMl0uc2V0KHhyLCB5cik7XHJcbiAgICAgICAgdGhpcy52ZXJ0aWNlc1szXS5zZXQoLXhyLCB5cik7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnV2lkdGggPSB0aGlzLl9mbGFnSGVpZ2h0ID0gZmFsc2U7XHJcbiAgICAgIFBhdGgucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgUmVjdGFuZ2xlLk1ha2VPYnNlcnZhYmxlKFJlY3RhbmdsZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aCwgVFdPX1BJID0gTWF0aC5QSSAqIDIsIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbjtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIEVsbGlwc2UgPSBUd28uRWxsaXBzZSA9IGZ1bmN0aW9uKG94LCBveSwgcngsIHJ5KSB7XHJcblxyXG4gICAgaWYgKCFfLmlzTnVtYmVyKHJ5KSkge1xyXG4gICAgICByeSA9IHJ4O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhbW91bnQgPSBUd28uUmVzb2x1dGlvbjtcclxuXHJcbiAgICB2YXIgcG9pbnRzID0gXy5tYXAoXy5yYW5nZShhbW91bnQpLCBmdW5jdGlvbihpKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdvLkFuY2hvcigpO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIHBvaW50cywgdHJ1ZSwgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy53aWR0aCA9IHJ4ICogMjtcclxuICAgIHRoaXMuaGVpZ2h0ID0gcnkgKiAyO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQob3gsIG95KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoRWxsaXBzZSwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFsnd2lkdGgnLCAnaGVpZ2h0J10sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgUGF0aC5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goRWxsaXBzZS5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoRWxsaXBzZS5wcm90b3R5cGUsIFBhdGgucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX3dpZHRoOiAwLFxyXG4gICAgX2hlaWdodDogMCxcclxuXHJcbiAgICBfZmxhZ1dpZHRoOiBmYWxzZSxcclxuICAgIF9mbGFnSGVpZ2h0OiBmYWxzZSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnV2lkdGggfHwgdGhpcy5fZmxhZ0hlaWdodCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgIHZhciBwY3QgPSBpIC8gbDtcclxuICAgICAgICAgIHZhciB0aGV0YSA9IHBjdCAqIFRXT19QSTtcclxuICAgICAgICAgIHZhciB4ID0gdGhpcy5fd2lkdGggKiBjb3ModGhldGEpIC8gMjtcclxuICAgICAgICAgIHZhciB5ID0gdGhpcy5faGVpZ2h0ICogc2luKHRoZXRhKSAvIDI7XHJcbiAgICAgICAgICB0aGlzLnZlcnRpY2VzW2ldLnNldCh4LCB5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1dpZHRoID0gdGhpcy5fZmxhZ0hlaWdodCA9IGZhbHNlO1xyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIEVsbGlwc2UuTWFrZU9ic2VydmFibGUoRWxsaXBzZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aCwgVFdPX1BJID0gTWF0aC5QSSAqIDIsIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbjtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIENpcmNsZSA9IFR3by5DaXJjbGUgPSBmdW5jdGlvbihveCwgb3ksIHIpIHtcclxuXHJcbiAgICB2YXIgYW1vdW50ID0gVHdvLlJlc29sdXRpb247XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IF8ubWFwKF8ucmFuZ2UoYW1vdW50KSwgZnVuY3Rpb24oaSkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3by5BbmNob3IoKTtcclxuICAgIH0sIHRoaXMpO1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBwb2ludHMsIHRydWUsIHRydWUpO1xyXG5cclxuICAgIHRoaXMucmFkaXVzID0gcjtcclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KG94LCBveSk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKENpcmNsZSwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFsncmFkaXVzJ10sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgUGF0aC5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goQ2lyY2xlLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChDaXJjbGUucHJvdG90eXBlLCBQYXRoLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF9yYWRpdXM6IDAsXHJcbiAgICBfZmxhZ1JhZGl1czogZmFsc2UsXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1JhZGl1cykge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgIHZhciBwY3QgPSBpIC8gbDtcclxuICAgICAgICAgIHZhciB0aGV0YSA9IHBjdCAqIFRXT19QSTtcclxuICAgICAgICAgIHZhciB4ID0gdGhpcy5fcmFkaXVzICogY29zKHRoZXRhKTtcclxuICAgICAgICAgIHZhciB5ID0gdGhpcy5fcmFkaXVzICogc2luKHRoZXRhKTtcclxuICAgICAgICAgIHRoaXMudmVydGljZXNbaV0uc2V0KHgsIHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnUmFkaXVzID0gZmFsc2U7XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgQ2lyY2xlLk1ha2VPYnNlcnZhYmxlKENpcmNsZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aCwgVFdPX1BJID0gTWF0aC5QSSAqIDIsIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbjtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFBvbHlnb24gPSBUd28uUG9seWdvbiA9IGZ1bmN0aW9uKG94LCBveSwgciwgc2lkZXMpIHtcclxuXHJcbiAgICBzaWRlcyA9IE1hdGgubWF4KHNpZGVzIHx8IDAsIDMpO1xyXG5cclxuICAgIHZhciBwb2ludHMgPSBfLm1hcChfLnJhbmdlKHNpZGVzKSwgZnVuY3Rpb24oaSkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3by5BbmNob3IoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBwb2ludHMsIHRydWUpO1xyXG5cclxuICAgIHRoaXMud2lkdGggPSByICogMjtcclxuICAgIHRoaXMuaGVpZ2h0ID0gciAqIDI7XHJcbiAgICB0aGlzLnNpZGVzID0gc2lkZXM7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldChveCwgb3kpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChQb2x5Z29uLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogWyd3aWR0aCcsICdoZWlnaHQnLCAnc2lkZXMnXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICBQYXRoLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChQb2x5Z29uLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChQb2x5Z29uLnByb3RvdHlwZSwgUGF0aC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfd2lkdGg6IDAsXHJcbiAgICBfaGVpZ2h0OiAwLFxyXG4gICAgX3NpZGVzOiAwLFxyXG5cclxuICAgIF9mbGFnV2lkdGg6IGZhbHNlLFxyXG4gICAgX2ZsYWdIZWlnaHQ6IGZhbHNlLFxyXG4gICAgX2ZsYWdTaWRlczogZmFsc2UsXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1dpZHRoIHx8IHRoaXMuX2ZsYWdIZWlnaHQgfHwgdGhpcy5fZmxhZ1NpZGVzKSB7XHJcblxyXG4gICAgICAgIHZhciBzaWRlcyA9IHRoaXMuX3NpZGVzO1xyXG4gICAgICAgIHZhciBhbW91bnQgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKGFtb3VudCA+IHNpZGVzKSB7XHJcbiAgICAgICAgICB0aGlzLnZlcnRpY2VzLnNwbGljZShzaWRlcyAtIDEsIGFtb3VudCAtIHNpZGVzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2lkZXM7IGkrKykge1xyXG5cclxuICAgICAgICAgIHZhciBwY3QgPSAoaSArIDAuNSkgLyBzaWRlcztcclxuICAgICAgICAgIHZhciB0aGV0YSA9IFRXT19QSSAqIHBjdCArIE1hdGguUEkgLyAyO1xyXG4gICAgICAgICAgdmFyIHggPSB0aGlzLl93aWR0aCAqIGNvcyh0aGV0YSk7XHJcbiAgICAgICAgICB2YXIgeSA9IHRoaXMuX2hlaWdodCAqIHNpbih0aGV0YSk7XHJcblxyXG4gICAgICAgICAgaWYgKGkgPj0gYW1vdW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGljZXMucHVzaChuZXcgVHdvLkFuY2hvcih4LCB5KSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2VzW2ldLnNldCh4LCB5KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnV2lkdGggPSB0aGlzLl9mbGFnSGVpZ2h0ID0gdGhpcy5fZmxhZ1NpZGVzID0gZmFsc2U7XHJcbiAgICAgIFBhdGgucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgUG9seWdvbi5NYWtlT2JzZXJ2YWJsZShQb2x5Z29uLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoLCBQSSA9IE1hdGguUEksIFRXT19QSSA9IE1hdGguUEkgKiAyLCBIQUxGX1BJID0gTWF0aC5QSSAvIDIsXHJcbiAgICBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW4sIGFicyA9IE1hdGguYWJzLCBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgQXJjU2VnbWVudCA9IFR3by5BcmNTZWdtZW50ID0gZnVuY3Rpb24ob3gsIG95LCBpciwgb3IsIHNhLCBlYSwgcmVzKSB7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IF8ubWFwKF8ucmFuZ2UocmVzIHx8IChUd28uUmVzb2x1dGlvbiAqIDMpKSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdvLkFuY2hvcigpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIHBvaW50cywgZmFsc2UsIGZhbHNlLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLmlubmVyUmFkaXVzID0gaXI7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzID0gb3I7XHJcblxyXG4gICAgdGhpcy5zdGFydEFuZ2xlID0gc2E7XHJcbiAgICB0aGlzLmVuZEFuZ2xlID0gZWE7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldChveCwgb3kpO1xyXG5cclxuICB9XHJcblxyXG4gIF8uZXh0ZW5kKEFyY1NlZ21lbnQsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbJ3N0YXJ0QW5nbGUnLCAnZW5kQW5nbGUnLCAnaW5uZXJSYWRpdXMnLCAnb3V0ZXJSYWRpdXMnXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICBQYXRoLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChBcmNTZWdtZW50LlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChBcmNTZWdtZW50LnByb3RvdHlwZSwgUGF0aC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfZmxhZ1N0YXJ0QW5nbGU6IGZhbHNlLFxyXG4gICAgX2ZsYWdFbmRBbmdsZTogZmFsc2UsXHJcbiAgICBfZmxhZ0lubmVyUmFkaXVzOiBmYWxzZSxcclxuICAgIF9mbGFnT3V0ZXJSYWRpdXM6IGZhbHNlLFxyXG5cclxuICAgIF9zdGFydEFuZ2xlOiAwLFxyXG4gICAgX2VuZEFuZ2xlOiBUV09fUEksXHJcbiAgICBfaW5uZXJSYWRpdXM6IDAsXHJcbiAgICBfb3V0ZXJSYWRpdXM6IDAsXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1N0YXJ0QW5nbGUgfHwgdGhpcy5fZmxhZ0VuZEFuZ2xlIHx8IHRoaXMuX2ZsYWdJbm5lclJhZGl1c1xyXG4gICAgICAgIHx8IHRoaXMuX2ZsYWdPdXRlclJhZGl1cykge1xyXG5cclxuICAgICAgICB2YXIgc2EgPSB0aGlzLl9zdGFydEFuZ2xlO1xyXG4gICAgICAgIHZhciBlYSA9IHRoaXMuX2VuZEFuZ2xlO1xyXG5cclxuICAgICAgICB2YXIgaXIgPSB0aGlzLl9pbm5lclJhZGl1cztcclxuICAgICAgICB2YXIgb3IgPSB0aGlzLl9vdXRlclJhZGl1cztcclxuXHJcbiAgICAgICAgdmFyIGNvbm5lY3RlZCA9IG1vZChzYSwgVFdPX1BJKSA9PT0gbW9kKGVhLCBUV09fUEkpO1xyXG4gICAgICAgIHZhciBwdW5jdHVyZWQgPSBpciA+IDA7XHJcblxyXG4gICAgICAgIHZhciB2ZXJ0aWNlcyA9IHRoaXMudmVydGljZXM7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IChwdW5jdHVyZWQgPyB2ZXJ0aWNlcy5sZW5ndGggLyAyIDogdmVydGljZXMubGVuZ3RoKTtcclxuICAgICAgICB2YXIgY29tbWFuZCwgaWQgPSAwO1xyXG5cclxuICAgICAgICBpZiAoY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICBsZW5ndGgtLTtcclxuICAgICAgICB9IGVsc2UgaWYgKCFwdW5jdHVyZWQpIHtcclxuICAgICAgICAgIGxlbmd0aCAtPSAyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogT3V0ZXIgQ2lyY2xlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxhc3QgPSBsZW5ndGggLSAxOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICB2YXIgcGN0ID0gaSAvIGxhc3Q7XHJcbiAgICAgICAgICB2YXIgdiA9IHZlcnRpY2VzW2lkXTtcclxuICAgICAgICAgIHZhciB0aGV0YSA9IHBjdCAqIChlYSAtIHNhKSArIHNhO1xyXG4gICAgICAgICAgdmFyIHN0ZXAgPSAoZWEgLSBzYSkgLyBsZW5ndGg7XHJcblxyXG4gICAgICAgICAgdmFyIHggPSBvciAqIE1hdGguY29zKHRoZXRhKTtcclxuICAgICAgICAgIHZhciB5ID0gb3IgKiBNYXRoLnNpbih0aGV0YSk7XHJcblxyXG4gICAgICAgICAgc3dpdGNoIChpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgMDpcclxuICAgICAgICAgICAgICBjb21tYW5kID0gVHdvLkNvbW1hbmRzLm1vdmU7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgY29tbWFuZCA9IFR3by5Db21tYW5kcy5jdXJ2ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2LmNvbW1hbmQgPSBjb21tYW5kO1xyXG4gICAgICAgICAgdi54ID0geDtcclxuICAgICAgICAgIHYueSA9IHk7XHJcbiAgICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuICAgICAgICAgIHYuY29udHJvbHMucmlnaHQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICBpZiAodi5jb21tYW5kID09PSBUd28uQ29tbWFuZHMuY3VydmUpIHtcclxuICAgICAgICAgICAgdmFyIGFtcCA9IG9yICogc3RlcCAvIE1hdGguUEk7XHJcbiAgICAgICAgICAgIHYuY29udHJvbHMubGVmdC54ID0gYW1wICogTWF0aC5jb3ModGhldGEgLSBIQUxGX1BJKTtcclxuICAgICAgICAgICAgdi5jb250cm9scy5sZWZ0LnkgPSBhbXAgKiBNYXRoLnNpbih0aGV0YSAtIEhBTEZfUEkpO1xyXG4gICAgICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnggPSBhbXAgKiBNYXRoLmNvcyh0aGV0YSArIEhBTEZfUEkpO1xyXG4gICAgICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnkgPSBhbXAgKiBNYXRoLnNpbih0aGV0YSArIEhBTEZfUEkpO1xyXG4gICAgICAgICAgICBpZiAoaSA9PT0gMSkge1xyXG4gICAgICAgICAgICAgIHYuY29udHJvbHMubGVmdC5tdWx0aXBseVNjYWxhcigyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaSA9PT0gbGFzdCkge1xyXG4gICAgICAgICAgICAgIHYuY29udHJvbHMucmlnaHQubXVsdGlwbHlTY2FsYXIoMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZCsrO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwdW5jdHVyZWQpIHtcclxuXHJcbiAgICAgICAgICBpZiAoY29ubmVjdGVkKSB7XHJcbiAgICAgICAgICAgIHZlcnRpY2VzW2lkXS5jb21tYW5kID0gVHdvLkNvbW1hbmRzLmNsb3NlO1xyXG4gICAgICAgICAgICBpZCsrO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGVuZ3RoLS07XHJcbiAgICAgICAgICAgIGxhc3QgPSBsZW5ndGggLSAxO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICogSW5uZXIgQ2lyY2xlXHJcbiAgICAgICAgICAgKi9cclxuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgcGN0ID0gaSAvIGxhc3Q7XHJcbiAgICAgICAgICAgIHYgPSB2ZXJ0aWNlc1tpZF07XHJcbiAgICAgICAgICAgIHRoZXRhID0gKDEgLSBwY3QpICogKGVhIC0gc2EpICsgc2E7XHJcbiAgICAgICAgICAgIHN0ZXAgPSAoZWEgLSBzYSkgLyBsZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB4ID0gaXIgKiBNYXRoLmNvcyh0aGV0YSk7XHJcbiAgICAgICAgICAgIHkgPSBpciAqIE1hdGguc2luKHRoZXRhKTtcclxuICAgICAgICAgICAgY29tbWFuZCA9IFR3by5Db21tYW5kcy5jdXJ2ZTtcclxuICAgICAgICAgICAgaWYgKGkgPD0gMCkge1xyXG4gICAgICAgICAgICAgIGNvbW1hbmQgPSBjb25uZWN0ZWQgPyBUd28uQ29tbWFuZHMubW92ZSA6IFR3by5Db21tYW5kcy5saW5lO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2LmNvbW1hbmQgPSBjb21tYW5kO1xyXG4gICAgICAgICAgICB2LnggPSB4O1xyXG4gICAgICAgICAgICB2LnkgPSB5O1xyXG4gICAgICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuICAgICAgICAgICAgdi5jb250cm9scy5yaWdodC5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHYuY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLmN1cnZlKSB7XHJcbiAgICAgICAgICAgICAgYW1wID0gaXIgKiBzdGVwIC8gTWF0aC5QSTtcclxuICAgICAgICAgICAgICB2LmNvbnRyb2xzLmxlZnQueCA9IGFtcCAqIE1hdGguY29zKHRoZXRhICsgSEFMRl9QSSk7XHJcbiAgICAgICAgICAgICAgdi5jb250cm9scy5sZWZ0LnkgPSBhbXAgKiBNYXRoLnNpbih0aGV0YSArIEhBTEZfUEkpO1xyXG4gICAgICAgICAgICAgIHYuY29udHJvbHMucmlnaHQueCA9IGFtcCAqIE1hdGguY29zKHRoZXRhIC0gSEFMRl9QSSk7XHJcbiAgICAgICAgICAgICAgdi5jb250cm9scy5yaWdodC55ID0gYW1wICogTWF0aC5zaW4odGhldGEgLSBIQUxGX1BJKTtcclxuICAgICAgICAgICAgICBpZiAoaSA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdi5jb250cm9scy5sZWZ0Lm11bHRpcGx5U2NhbGFyKDIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAoaSA9PT0gbGFzdCkge1xyXG4gICAgICAgICAgICAgICAgdi5jb250cm9scy5yaWdodC5tdWx0aXBseVNjYWxhcigyKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlkKys7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKCFjb25uZWN0ZWQpIHtcclxuXHJcbiAgICAgICAgICB2ZXJ0aWNlc1tpZF0uY29tbWFuZCA9IFR3by5Db21tYW5kcy5saW5lO1xyXG4gICAgICAgICAgdmVydGljZXNbaWRdLnggPSAwO1xyXG4gICAgICAgICAgdmVydGljZXNbaWRdLnkgPSAwO1xyXG4gICAgICAgICAgaWQrKztcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBGaW5hbCBQb2ludFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZlcnRpY2VzW2lkXS5jb21tYW5kID0gVHdvLkNvbW1hbmRzLmNsb3NlO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnU3RhcnRBbmdsZSA9IHRoaXMuX2ZsYWdFbmRBbmdsZVxyXG4gICAgICAgID0gdGhpcy5fZmxhZ0lubmVyUmFkaXVzID0gdGhpcy5fZmxhZ091dGVyUmFkaXVzID0gZmFsc2U7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBBcmNTZWdtZW50Lk1ha2VPYnNlcnZhYmxlKEFyY1NlZ21lbnQucHJvdG90eXBlKTtcclxuXHJcbiAgZnVuY3Rpb24gbW9kKHYsIGwpIHtcclxuICAgIHdoaWxlICh2IDwgMCkge1xyXG4gICAgICB2ICs9IGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdiAlIGw7XHJcbiAgfVxyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aCwgVFdPX1BJID0gTWF0aC5QSSAqIDIsIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbjtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFN0YXIgPSBUd28uU3RhciA9IGZ1bmN0aW9uKG94LCBveSwgb3IsIGlyLCBzaWRlcykge1xyXG5cclxuICAgIGlmICghXy5pc051bWJlcihpcikpIHtcclxuICAgICAgaXIgPSBvciAvIDI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFfLmlzTnVtYmVyKHNpZGVzKSB8fCBzaWRlcyA8PSAwKSB7XHJcbiAgICAgIHNpZGVzID0gNTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbGVuZ3RoID0gc2lkZXMgKiAyO1xyXG5cclxuICAgIHZhciBwb2ludHMgPSBfLm1hcChfLnJhbmdlKGxlbmd0aCksIGZ1bmN0aW9uKGkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd28uQW5jaG9yKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgcG9pbnRzLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLmlubmVyUmFkaXVzID0gaXI7XHJcbiAgICB0aGlzLm91dGVyUmFkaXVzID0gb3I7XHJcbiAgICB0aGlzLnNpZGVzID0gc2lkZXM7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldChveCwgb3kpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChTdGFyLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogWydpbm5lclJhZGl1cycsICdvdXRlclJhZGl1cycsICdzaWRlcyddLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgIFBhdGguTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKFN0YXIuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFN0YXIucHJvdG90eXBlLCBQYXRoLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF9pbm5lclJhZGl1czogMCxcclxuICAgIF9vdXRlclJhZGl1czogMCxcclxuICAgIF9zaWRlczogMCxcclxuXHJcbiAgICBfZmxhZ0lubmVyUmFkaXVzOiBmYWxzZSxcclxuICAgIF9mbGFnT3V0ZXJSYWRpdXM6IGZhbHNlLFxyXG4gICAgX2ZsYWdTaWRlczogZmFsc2UsXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ0lubmVyUmFkaXVzIHx8IHRoaXMuX2ZsYWdPdXRlclJhZGl1cyB8fCB0aGlzLl9mbGFnU2lkZXMpIHtcclxuXHJcbiAgICAgICAgdmFyIHNpZGVzID0gdGhpcy5fc2lkZXMgKiAyO1xyXG4gICAgICAgIHZhciBhbW91bnQgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKGFtb3VudCA+IHNpZGVzKSB7XHJcbiAgICAgICAgICB0aGlzLnZlcnRpY2VzLnNwbGljZShzaWRlcyAtIDEsIGFtb3VudCAtIHNpZGVzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2lkZXM7IGkrKykge1xyXG5cclxuICAgICAgICAgIHZhciBwY3QgPSAoaSArIDAuNSkgLyBzaWRlcztcclxuICAgICAgICAgIHZhciB0aGV0YSA9IFRXT19QSSAqIHBjdDtcclxuICAgICAgICAgIHZhciByID0gKGkgJSAyID8gdGhpcy5faW5uZXJSYWRpdXMgOiB0aGlzLl9vdXRlclJhZGl1cyk7XHJcbiAgICAgICAgICB2YXIgeCA9IHIgKiBjb3ModGhldGEpO1xyXG4gICAgICAgICAgdmFyIHkgPSByICogc2luKHRoZXRhKTtcclxuXHJcbiAgICAgICAgICBpZiAoaSA+PSBhbW91bnQpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNlcy5wdXNoKG5ldyBUd28uQW5jaG9yKHgsIHkpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGljZXNbaV0uc2V0KHgsIHkpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnSW5uZXJSYWRpdXMgPSB0aGlzLl9mbGFnT3V0ZXJSYWRpdXMgPSB0aGlzLl9mbGFnU2lkZXMgPSBmYWxzZTtcclxuICAgICAgUGF0aC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBTdGFyLk1ha2VPYnNlcnZhYmxlKFN0YXIucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGg7XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBSb3VuZGVkUmVjdGFuZ2xlID0gVHdvLlJvdW5kZWRSZWN0YW5nbGUgPSBmdW5jdGlvbihveCwgb3ksIHdpZHRoLCBoZWlnaHQsIHJhZGl1cykge1xyXG5cclxuICAgIGlmICghXy5pc051bWJlcihyYWRpdXMpKSB7XHJcbiAgICAgIHJhZGl1cyA9IE1hdGguZmxvb3IoTWF0aC5taW4od2lkdGgsIGhlaWdodCkgLyAxMik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFtb3VudCA9IDEwO1xyXG5cclxuICAgIHZhciBwb2ludHMgPSBfLm1hcChfLnJhbmdlKGFtb3VudCksIGZ1bmN0aW9uKGkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd28uQW5jaG9yKDAsIDAsIDAsIDAsIDAsIDAsXHJcbiAgICAgICAgaSA9PT0gMCA/IFR3by5Db21tYW5kcy5tb3ZlIDogVHdvLkNvbW1hbmRzLmN1cnZlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV0uY29tbWFuZCA9IFR3by5Db21tYW5kcy5jbG9zZTtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgcG9pbnRzLCBmYWxzZSwgZmFsc2UsIHRydWUpO1xyXG5cclxuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXM7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldChveCwgb3kpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChSb3VuZGVkUmVjdGFuZ2xlLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogWyd3aWR0aCcsICdoZWlnaHQnLCAncmFkaXVzJ10sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgUGF0aC5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goUm91bmRlZFJlY3RhbmdsZS5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoUm91bmRlZFJlY3RhbmdsZS5wcm90b3R5cGUsIFBhdGgucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX3dpZHRoOiAwLFxyXG4gICAgX2hlaWdodDogMCxcclxuICAgIF9yYWRpdXM6IDAsXHJcblxyXG4gICAgX2ZsYWdXaWR0aDogZmFsc2UsXHJcbiAgICBfZmxhZ0hlaWdodDogZmFsc2UsXHJcbiAgICBfZmxhZ1JhZGl1czogZmFsc2UsXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1dpZHRoIHx8IHRoaXMuX2ZsYWdIZWlnaHQgfHwgdGhpcy5fZmxhZ1JhZGl1cykge1xyXG5cclxuICAgICAgICB2YXIgd2lkdGggPSB0aGlzLl93aWR0aDtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xyXG4gICAgICAgIHZhciByYWRpdXMgPSBNYXRoLm1pbihNYXRoLm1heCh0aGlzLl9yYWRpdXMsIDApLFxyXG4gICAgICAgICAgTWF0aC5taW4od2lkdGgsIGhlaWdodCkpO1xyXG5cclxuICAgICAgICB2YXIgdjtcclxuICAgICAgICB2YXIgdyA9IHdpZHRoIC8gMjtcclxuICAgICAgICB2YXIgaCA9IGhlaWdodCAvIDI7XHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzBdO1xyXG4gICAgICAgIHYueCA9IC0gKHcgLSByYWRpdXMpO1xyXG4gICAgICAgIHYueSA9IC0gaDtcclxuXHJcbiAgICAgICAgLy8gVXBwZXIgUmlnaHQgQ29ybmVyXHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzFdO1xyXG4gICAgICAgIHYueCA9ICh3IC0gcmFkaXVzKTtcclxuICAgICAgICB2LnkgPSAtIGg7XHJcbiAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC54ID0gcmFkaXVzO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQueSA9IDA7XHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzJdO1xyXG4gICAgICAgIHYueCA9IHc7XHJcbiAgICAgICAgdi55ID0gLSAoaCAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC5jbGVhcigpO1xyXG4gICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG5cclxuICAgICAgICAvLyBCb3R0b20gUmlnaHQgQ29ybmVyXHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzNdO1xyXG4gICAgICAgIHYueCA9IHc7XHJcbiAgICAgICAgdi55ID0gKGggLSByYWRpdXMpO1xyXG4gICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQueCA9IDA7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC55ID0gcmFkaXVzO1xyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1s0XTtcclxuICAgICAgICB2LnggPSAodyAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi55ID0gaDtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LmNsZWFyKCk7XHJcbiAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcblxyXG4gICAgICAgIC8vIEJvdHRvbSBMZWZ0IENvcm5lclxyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1s1XTtcclxuICAgICAgICB2LnggPSAtICh3IC0gcmFkaXVzKTtcclxuICAgICAgICB2LnkgPSBoO1xyXG4gICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQueCA9IC0gcmFkaXVzO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQueSA9IDA7XHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzZdO1xyXG4gICAgICAgIHYueCA9IC0gdztcclxuICAgICAgICB2LnkgPSAoaCAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC5jbGVhcigpO1xyXG5cclxuICAgICAgICAvLyBVcHBlciBMZWZ0IENvcm5lclxyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1s3XTtcclxuICAgICAgICB2LnggPSAtIHc7XHJcbiAgICAgICAgdi55ID0gLSAoaCAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC54ID0gMDtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnkgPSAtIHJhZGl1cztcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbOF07XHJcbiAgICAgICAgdi54ID0gLSAodyAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi55ID0gLSBoO1xyXG4gICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbOV07XHJcbiAgICAgICAgdi5jb3B5KHRoaXMudmVydGljZXNbOF0pO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1dpZHRoID0gdGhpcy5fZmxhZ0hlaWdodCA9IHRoaXMuX2ZsYWdSYWRpdXMgPSBmYWxzZTtcclxuICAgICAgUGF0aC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBSb3VuZGVkUmVjdGFuZ2xlLk1ha2VPYnNlcnZhYmxlKFJvdW5kZWRSZWN0YW5nbGUucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciByb290ID0gVHdvLnJvb3Q7XHJcbiAgdmFyIGdldENvbXB1dGVkTWF0cml4ID0gVHdvLlV0aWxzLmdldENvbXB1dGVkTWF0cml4O1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgY2FudmFzID0gKHJvb3QuZG9jdW1lbnQgPyByb290LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpIDogeyBnZXRDb250ZXh0OiBfLmlkZW50aXR5IH0pO1xyXG4gIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgdmFyIFRleHQgPSBUd28uVGV4dCA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHgsIHksIHN0eWxlcykge1xyXG5cclxuICAgIFR3by5TaGFwZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyLnR5cGUgPSAndGV4dCc7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnRmlsbCA9IF8uYmluZChUZXh0LkZsYWdGaWxsLCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdTdHJva2UgPSBfLmJpbmQoVGV4dC5GbGFnU3Ryb2tlLCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLnZhbHVlID0gbWVzc2FnZTtcclxuXHJcbiAgICBpZiAoXy5pc051bWJlcih4KSkge1xyXG4gICAgICAgIHRoaXMudHJhbnNsYXRpb24ueCA9IHg7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcih5KSkge1xyXG4gICAgICAgIHRoaXMudHJhbnNsYXRpb24ueSA9IHk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFfLmlzT2JqZWN0KHN0eWxlcykpIHtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgXy5lYWNoKFR3by5UZXh0LlByb3BlcnRpZXMsIGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcblxyXG4gICAgICBpZiAocHJvcGVydHkgaW4gc3R5bGVzKSB7XHJcbiAgICAgICAgdGhpc1twcm9wZXJ0eV0gPSBzdHlsZXNbcHJvcGVydHldO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFR3by5UZXh0LCB7XHJcblxyXG4gICAgUHJvcGVydGllczogW1xyXG4gICAgICAndmFsdWUnLCAnZmFtaWx5JywgJ3NpemUnLCAnbGVhZGluZycsICdhbGlnbm1lbnQnLCAnbGluZXdpZHRoJywgJ3N0eWxlJyxcclxuICAgICAgJ3dlaWdodCcsICdkZWNvcmF0aW9uJywgJ2Jhc2VsaW5lJywgJ29wYWNpdHknLCAndmlzaWJsZScsICdmaWxsJywgJ3N0cm9rZSdcclxuICAgIF0sXHJcblxyXG4gICAgRmxhZ0ZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnRmlsbCA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIEZsYWdTdHJva2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnU3Ryb2tlID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgVHdvLlNoYXBlLk1ha2VPYnNlcnZhYmxlKG9iamVjdCk7XHJcblxyXG4gICAgICBfLmVhY2goVHdvLlRleHQuUHJvcGVydGllcy5zbGljZSgwLCAxMiksIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqZWN0KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdmaWxsJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9maWxsO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihmKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9maWxsLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ0ZpbGwpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX2ZpbGwgPSBmO1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ0ZpbGwgPSB0cnVlO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmlsbC5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnRmlsbCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnc3Ryb2tlJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9zdHJva2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGYpIHtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3Ryb2tlLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0cm9rZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fc3Ryb2tlID0gZjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdTdHJva2UgPSB0cnVlO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdHJva2UuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0cm9rZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnY2xpcCcsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY2xpcDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpcy5fY2xpcCA9IHY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnQ2xpcCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChUd28uVGV4dC5wcm90b3R5cGUsIFR3by5TaGFwZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAvLyBGbGFnc1xyXG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GbGFnXHJcblxyXG4gICAgX2ZsYWdWYWx1ZTogdHJ1ZSxcclxuICAgIF9mbGFnRmFtaWx5OiB0cnVlLFxyXG4gICAgX2ZsYWdTaXplOiB0cnVlLFxyXG4gICAgX2ZsYWdMZWFkaW5nOiB0cnVlLFxyXG4gICAgX2ZsYWdBbGlnbm1lbnQ6IHRydWUsXHJcbiAgICBfZmxhZ0Jhc2VsaW5lOiB0cnVlLFxyXG4gICAgX2ZsYWdTdHlsZTogdHJ1ZSxcclxuICAgIF9mbGFnV2VpZ2h0OiB0cnVlLFxyXG4gICAgX2ZsYWdEZWNvcmF0aW9uOiB0cnVlLFxyXG5cclxuICAgIF9mbGFnRmlsbDogdHJ1ZSxcclxuICAgIF9mbGFnU3Ryb2tlOiB0cnVlLFxyXG4gICAgX2ZsYWdMaW5ld2lkdGg6IHRydWUsXHJcbiAgICBfZmxhZ09wYWNpdHk6IHRydWUsXHJcbiAgICBfZmxhZ1Zpc2libGU6IHRydWUsXHJcblxyXG4gICAgX2ZsYWdDbGlwOiBmYWxzZSxcclxuXHJcbiAgICAvLyBVbmRlcmx5aW5nIFByb3BlcnRpZXNcclxuXHJcbiAgICBfdmFsdWU6ICcnLFxyXG4gICAgX2ZhbWlseTogJ3NhbnMtc2VyaWYnLFxyXG4gICAgX3NpemU6IDEzLFxyXG4gICAgX2xlYWRpbmc6IDE3LFxyXG4gICAgX2FsaWdubWVudDogJ2NlbnRlcicsXHJcbiAgICBfYmFzZWxpbmU6ICdtaWRkbGUnLFxyXG4gICAgX3N0eWxlOiAnbm9ybWFsJyxcclxuICAgIF93ZWlnaHQ6IDUwMCxcclxuICAgIF9kZWNvcmF0aW9uOiAnbm9uZScsXHJcblxyXG4gICAgX2ZpbGw6ICcjMDAwJyxcclxuICAgIF9zdHJva2U6ICd0cmFuc3BhcmVudCcsXHJcbiAgICBfbGluZXdpZHRoOiAxLFxyXG4gICAgX29wYWNpdHk6IDEsXHJcbiAgICBfdmlzaWJsZTogdHJ1ZSxcclxuXHJcbiAgICBfY2xpcDogZmFsc2UsXHJcblxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICghdGhpcy5wYXJlbnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5wYXJlbnQucmVtb3ZlKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24ocGFyZW50KSB7XHJcblxyXG4gICAgICB2YXIgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IFR3by5UZXh0KHRoaXMudmFsdWUpO1xyXG4gICAgICBjbG9uZS50cmFuc2xhdGlvbi5jb3B5KHRoaXMudHJhbnNsYXRpb24pO1xyXG4gICAgICBjbG9uZS5yb3RhdGlvbiA9IHRoaXMucm90YXRpb247XHJcbiAgICAgIGNsb25lLnNjYWxlID0gdGhpcy5zY2FsZTtcclxuXHJcbiAgICAgIF8uZWFjaChUd28uVGV4dC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgIGNsb25lW3Byb3BlcnR5XSA9IHRoaXNbcHJvcGVydHldO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICBwYXJlbnQuYWRkKGNsb25lKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICB0cmFuc2xhdGlvbjogdGhpcy50cmFuc2xhdGlvbi50b09iamVjdCgpLFxyXG4gICAgICAgIHJvdGF0aW9uOiB0aGlzLnJvdGF0aW9uLFxyXG4gICAgICAgIHNjYWxlOiB0aGlzLnNjYWxlXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBfLmVhY2goVHdvLlRleHQuUHJvcGVydGllcywgZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuICAgICAgICByZXN1bHRbcHJvcGVydHldID0gdGhpc1twcm9wZXJ0eV07XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG5vU3Ryb2tlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zdHJva2UgPSAndHJhbnNwYXJlbnQnO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgbm9GaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5maWxsID0gJ3RyYW5zcGFyZW50JztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQSBzaGltIHRvIG5vdCBicmVhayBgZ2V0Qm91bmRpbmdDbGllbnRSZWN0YCBjYWxscy4gVE9ETzogSW1wbGVtZW50IGFcclxuICAgICAqIHdheSB0byBjYWxjdWxhdGUgcHJvcGVyIGJvdW5kaW5nIGJveGVzIG9mIGBUd28uVGV4dGAuXHJcbiAgICAgKi9cclxuICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogZnVuY3Rpb24oc2hhbGxvdykge1xyXG5cclxuICAgICAgdmFyIG1hdHJpeCwgYm9yZGVyLCBsLCB4LCB5LCBpLCB2O1xyXG5cclxuICAgICAgdmFyIGxlZnQgPSBJbmZpbml0eSwgcmlnaHQgPSAtSW5maW5pdHksXHJcbiAgICAgICAgICB0b3AgPSBJbmZpbml0eSwgYm90dG9tID0gLUluZmluaXR5O1xyXG5cclxuICAgICAgLy8gVE9ETzogVXBkYXRlIHRoaXMgdG8gbm90IF9fYWx3YXlzX18gdXBkYXRlLiBKdXN0IHdoZW4gaXQgbmVlZHMgdG8uXHJcbiAgICAgIHRoaXMuX3VwZGF0ZSh0cnVlKTtcclxuXHJcbiAgICAgIG1hdHJpeCA9ICEhc2hhbGxvdyA/IHRoaXMuX21hdHJpeCA6IGdldENvbXB1dGVkTWF0cml4KHRoaXMpO1xyXG5cclxuICAgICAgdiA9IG1hdHJpeC5tdWx0aXBseSgwLCAwLCAxKTtcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdG9wOiB2LngsXHJcbiAgICAgICAgbGVmdDogdi55LFxyXG4gICAgICAgIHJpZ2h0OiB2LngsXHJcbiAgICAgICAgYm90dG9tOiB2LnksXHJcbiAgICAgICAgd2lkdGg6IDAsXHJcbiAgICAgICAgaGVpZ2h0OiAwXHJcbiAgICAgIH07XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1ZhbHVlID0gdGhpcy5fZmxhZ0ZhbWlseSA9IHRoaXMuX2ZsYWdTaXplID1cclxuICAgICAgICB0aGlzLl9mbGFnTGVhZGluZyA9IHRoaXMuX2ZsYWdBbGlnbm1lbnQgPSB0aGlzLl9mbGFnRmlsbCA9XHJcbiAgICAgICAgdGhpcy5fZmxhZ1N0cm9rZSA9IHRoaXMuX2ZsYWdMaW5ld2lkdGggPSB0aGlzLl9mbGFnT3BhaWN0eSA9XHJcbiAgICAgICAgdGhpcy5fZmxhZ1Zpc2libGUgPSB0aGlzLl9mbGFnQ2xpcCA9IHRoaXMuX2ZsYWdEZWNvcmF0aW9uID1cclxuICAgICAgICB0aGlzLl9mbGFnQmFzZWxpbmUgPSBmYWxzZTtcclxuXHJcbiAgICAgIFR3by5TaGFwZS5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBUd28uVGV4dC5NYWtlT2JzZXJ2YWJsZShUd28uVGV4dC5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBTdG9wID0gVHdvLlN0b3AgPSBmdW5jdGlvbihvZmZzZXQsIGNvbG9yLCBvcGFjaXR5KSB7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIgPSB7fTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLnR5cGUgPSAnc3RvcCc7XHJcblxyXG4gICAgdGhpcy5vZmZzZXQgPSBfLmlzTnVtYmVyKG9mZnNldCkgPyBvZmZzZXRcclxuICAgICAgOiBTdG9wLkluZGV4IDw9IDAgPyAwIDogMTtcclxuXHJcbiAgICB0aGlzLm9wYWNpdHkgPSBfLmlzTnVtYmVyKG9wYWNpdHkpID8gb3BhY2l0eSA6IDE7XHJcblxyXG4gICAgdGhpcy5jb2xvciA9IF8uaXNTdHJpbmcoY29sb3IpID8gY29sb3JcclxuICAgICAgOiBTdG9wLkluZGV4IDw9IDAgPyAnI2ZmZicgOiAnIzAwMCc7XHJcblxyXG4gICAgU3RvcC5JbmRleCA9IChTdG9wLkluZGV4ICsgMSkgJSAyO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChTdG9wLCB7XHJcblxyXG4gICAgSW5kZXg6IDAsXHJcblxyXG4gICAgUHJvcGVydGllczogW1xyXG4gICAgICAnb2Zmc2V0JyxcclxuICAgICAgJ29wYWNpdHknLFxyXG4gICAgICAnY29sb3InXHJcbiAgICBdLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgIF8uZWFjaChTdG9wLlByb3BlcnRpZXMsIGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcblxyXG4gICAgICAgIHZhciBvYmplY3QgPSB0aGlzO1xyXG4gICAgICAgIHZhciBzZWNyZXQgPSAnXycgKyBwcm9wZXJ0eTtcclxuICAgICAgICB2YXIgZmxhZyA9ICdfZmxhZycgKyBwcm9wZXJ0eS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnNsaWNlKDEpO1xyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCBwcm9wZXJ0eSwge1xyXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3NlY3JldF07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICAgIHRoaXNbc2VjcmV0XSA9IHY7XHJcbiAgICAgICAgICAgIHRoaXNbZmxhZ10gPSB0cnVlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHtcclxuICAgICAgICAgICAgICB0aGlzLnBhcmVudC5fZmxhZ1N0b3BzID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfSwgb2JqZWN0KTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChTdG9wLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBTdG9wKCk7XHJcblxyXG4gICAgICBfLmVhY2goU3RvcC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgIGNsb25lW3Byb3BlcnR5XSA9IHRoaXNbcHJvcGVydHldO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcclxuXHJcbiAgICAgIF8uZWFjaChTdG9wLlByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICByZXN1bHRba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ09mZnNldCA9IHRoaXMuX2ZsYWdDb2xvciA9IHRoaXMuX2ZsYWdPcGFjaXR5ID0gZmFsc2U7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBTdG9wLk1ha2VPYnNlcnZhYmxlKFN0b3AucHJvdG90eXBlKTtcclxuXHJcbiAgdmFyIEdyYWRpZW50ID0gVHdvLkdyYWRpZW50ID0gZnVuY3Rpb24oc3RvcHMpIHtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlciA9IHt9O1xyXG4gICAgdGhpcy5fcmVuZGVyZXIudHlwZSA9ICdncmFkaWVudCc7XHJcblxyXG4gICAgdGhpcy5pZCA9IFR3by5JZGVudGlmaWVyICsgVHdvLnVuaXF1ZUlkKCk7XHJcbiAgICB0aGlzLmNsYXNzTGlzdCA9IFtdO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdTdG9wcyA9IF8uYmluZChHcmFkaWVudC5GbGFnU3RvcHMsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuYmluZFN0b3BzID0gXy5iaW5kKEdyYWRpZW50LkJpbmRTdG9wcywgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci51bmJpbmRTdG9wcyA9IF8uYmluZChHcmFkaWVudC5VbmJpbmRTdG9wcywgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5zcHJlYWQgPSAncGFkJztcclxuXHJcbiAgICB0aGlzLnN0b3BzID0gc3RvcHM7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKEdyYWRpZW50LCB7XHJcblxyXG4gICAgU3RvcDogU3RvcCxcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbXHJcbiAgICAgICdzcHJlYWQnXHJcbiAgICBdLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgIF8uZWFjaChHcmFkaWVudC5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iamVjdCk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnc3RvcHMnLCB7XHJcblxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fc3RvcHM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihzdG9wcykge1xyXG5cclxuICAgICAgICAgIHZhciB1cGRhdGVTdG9wcyA9IHRoaXMuX3JlbmRlcmVyLmZsYWdTdG9wcztcclxuICAgICAgICAgIHZhciBiaW5kU3RvcHMgPSB0aGlzLl9yZW5kZXJlci5iaW5kU3RvcHM7XHJcbiAgICAgICAgICB2YXIgdW5iaW5kU3RvcHMgPSB0aGlzLl9yZW5kZXJlci51bmJpbmRTdG9wcztcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgcHJldmlvdXMgbGlzdGVuZXJzXHJcbiAgICAgICAgICBpZiAodGhpcy5fc3RvcHMpIHtcclxuICAgICAgICAgICAgdGhpcy5fc3RvcHNcclxuICAgICAgICAgICAgICAudW5iaW5kKFR3by5FdmVudHMuaW5zZXJ0LCBiaW5kU3RvcHMpXHJcbiAgICAgICAgICAgICAgLnVuYmluZChUd28uRXZlbnRzLnJlbW92ZSwgdW5iaW5kU3RvcHMpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIENyZWF0ZSBuZXcgQ29sbGVjdGlvbiB3aXRoIGNvcHkgb2YgU3RvcHNcclxuICAgICAgICAgIHRoaXMuX3N0b3BzID0gbmV3IFR3by5VdGlscy5Db2xsZWN0aW9uKChzdG9wcyB8fCBbXSkuc2xpY2UoMCkpO1xyXG5cclxuICAgICAgICAgIC8vIExpc3RlbiBmb3IgQ29sbGVjdGlvbiBjaGFuZ2VzIGFuZCBiaW5kIC8gdW5iaW5kXHJcbiAgICAgICAgICB0aGlzLl9zdG9wc1xyXG4gICAgICAgICAgICAuYmluZChUd28uRXZlbnRzLmluc2VydCwgYmluZFN0b3BzKVxyXG4gICAgICAgICAgICAuYmluZChUd28uRXZlbnRzLnJlbW92ZSwgdW5iaW5kU3RvcHMpO1xyXG5cclxuICAgICAgICAgIC8vIEJpbmQgSW5pdGlhbCBTdG9wc1xyXG4gICAgICAgICAgYmluZFN0b3BzKHRoaXMuX3N0b3BzKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBGbGFnU3RvcHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnU3RvcHMgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBCaW5kU3RvcHM6IGZ1bmN0aW9uKGl0ZW1zKSB7XHJcblxyXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIGxvdFxyXG4gICAgICAvLyB3aGVuIGltcG9ydGluZyBhIGxhcmdlIFNWR1xyXG4gICAgICB2YXIgaSA9IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgd2hpbGUoaS0tKSB7XHJcbiAgICAgICAgaXRlbXNbaV0uYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0b3BzKTtcclxuICAgICAgICBpdGVtc1tpXS5wYXJlbnQgPSB0aGlzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9yZW5kZXJlci5mbGFnU3RvcHMoKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIFVuYmluZFN0b3BzOiBmdW5jdGlvbihpdGVtcykge1xyXG5cclxuICAgICAgdmFyIGkgPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgIHdoaWxlKGktLSkge1xyXG4gICAgICAgIGl0ZW1zW2ldLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0b3BzKTtcclxuICAgICAgICBkZWxldGUgaXRlbXNbaV0ucGFyZW50O1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9yZW5kZXJlci5mbGFnU3RvcHMoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChHcmFkaWVudC5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICBfZmxhZ1N0b3BzOiBmYWxzZSxcclxuICAgIF9mbGFnU3ByZWFkOiBmYWxzZSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24ocGFyZW50KSB7XHJcblxyXG4gICAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICB2YXIgc3RvcHMgPSBfLm1hcCh0aGlzLnN0b3BzLCBmdW5jdGlvbihzKSB7XHJcbiAgICAgICAgcmV0dXJuIHMuY2xvbmUoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgR3JhZGllbnQoc3RvcHMpO1xyXG5cclxuICAgICAgXy5lYWNoKFR3by5HcmFkaWVudC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgY2xvbmVba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICBwYXJlbnQuYWRkKGNsb25lKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICBzdG9wczogXy5tYXAodGhpcy5zdG9wcywgZnVuY3Rpb24ocykge1xyXG4gICAgICAgICAgcmV0dXJuIHMudG9PYmplY3QoKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgXy5lYWNoKEdyYWRpZW50LlByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICByZXN1bHRba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnU3ByZWFkIHx8IHRoaXMuX2ZsYWdTdG9wcykge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdTcHJlYWQgPSB0aGlzLl9mbGFnU3RvcHMgPSBmYWxzZTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIEdyYWRpZW50Lk1ha2VPYnNlcnZhYmxlKEdyYWRpZW50LnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIExpbmVhckdyYWRpZW50ID0gVHdvLkxpbmVhckdyYWRpZW50ID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHN0b3BzKSB7XHJcblxyXG4gICAgVHdvLkdyYWRpZW50LmNhbGwodGhpcywgc3RvcHMpO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyLnR5cGUgPSAnbGluZWFyLWdyYWRpZW50JztcclxuXHJcbiAgICB2YXIgZmxhZ0VuZFBvaW50cyA9IF8uYmluZChMaW5lYXJHcmFkaWVudC5GbGFnRW5kUG9pbnRzLCB0aGlzKTtcclxuICAgIHRoaXMubGVmdCA9IG5ldyBUd28uVmVjdG9yKCkuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgZmxhZ0VuZFBvaW50cyk7XHJcbiAgICB0aGlzLnJpZ2h0ID0gbmV3IFR3by5WZWN0b3IoKS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCBmbGFnRW5kUG9pbnRzKTtcclxuXHJcbiAgICBpZiAoXy5pc051bWJlcih4MSkpIHtcclxuICAgICAgdGhpcy5sZWZ0LnggPSB4MTtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKHkxKSkge1xyXG4gICAgICB0aGlzLmxlZnQueSA9IHkxO1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIoeDIpKSB7XHJcbiAgICAgIHRoaXMucmlnaHQueCA9IHgyO1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIoeTIpKSB7XHJcbiAgICAgIHRoaXMucmlnaHQueSA9IHkyO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChMaW5lYXJHcmFkaWVudCwge1xyXG5cclxuICAgIFN0b3A6IFR3by5HcmFkaWVudC5TdG9wLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuICAgICAgVHdvLkdyYWRpZW50Lk1ha2VPYnNlcnZhYmxlKG9iamVjdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIEZsYWdFbmRQb2ludHM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnRW5kUG9pbnRzID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKExpbmVhckdyYWRpZW50LnByb3RvdHlwZSwgVHdvLkdyYWRpZW50LnByb3RvdHlwZSwge1xyXG5cclxuICAgIF9mbGFnRW5kUG9pbnRzOiBmYWxzZSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24ocGFyZW50KSB7XHJcblxyXG4gICAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICB2YXIgc3RvcHMgPSBfLm1hcCh0aGlzLnN0b3BzLCBmdW5jdGlvbihzdG9wKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0b3AuY2xvbmUoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgTGluZWFyR3JhZGllbnQodGhpcy5sZWZ0Ll94LCB0aGlzLmxlZnQuX3ksXHJcbiAgICAgICAgdGhpcy5yaWdodC5feCwgdGhpcy5yaWdodC5feSwgc3RvcHMpO1xyXG5cclxuICAgICAgXy5lYWNoKFR3by5HcmFkaWVudC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgY2xvbmVba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICBwYXJlbnQuYWRkKGNsb25lKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlc3VsdCA9IFR3by5HcmFkaWVudC5wcm90b3R5cGUudG9PYmplY3QuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJlc3VsdC5sZWZ0ID0gdGhpcy5sZWZ0LnRvT2JqZWN0KCk7XHJcbiAgICAgIHJlc3VsdC5yaWdodCA9IHRoaXMucmlnaHQudG9PYmplY3QoKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnRW5kUG9pbnRzIHx8IHRoaXMuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fZmxhZ1N0b3BzKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ0VuZFBvaW50cyA9IGZhbHNlO1xyXG5cclxuICAgICAgVHdvLkdyYWRpZW50LnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIExpbmVhckdyYWRpZW50Lk1ha2VPYnNlcnZhYmxlKExpbmVhckdyYWRpZW50LnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFJhZGlhbEdyYWRpZW50ID0gVHdvLlJhZGlhbEdyYWRpZW50ID0gZnVuY3Rpb24oY3gsIGN5LCByLCBzdG9wcywgZngsIGZ5KSB7XHJcblxyXG4gICAgVHdvLkdyYWRpZW50LmNhbGwodGhpcywgc3RvcHMpO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyLnR5cGUgPSAncmFkaWFsLWdyYWRpZW50JztcclxuXHJcbiAgICB0aGlzLmNlbnRlciA9IG5ldyBUd28uVmVjdG9yKClcclxuICAgICAgLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIF8uYmluZChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLl9mbGFnQ2VudGVyID0gdHJ1ZTtcclxuICAgICAgfSwgdGhpcykpO1xyXG5cclxuICAgIHRoaXMucmFkaXVzID0gXy5pc051bWJlcihyKSA/IHIgOiAyMDtcclxuXHJcbiAgICB0aGlzLmZvY2FsID0gbmV3IFR3by5WZWN0b3IoKVxyXG4gICAgICAuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgXy5iaW5kKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuX2ZsYWdGb2NhbCA9IHRydWU7XHJcbiAgICAgIH0sIHRoaXMpKTtcclxuXHJcbiAgICBpZiAoXy5pc051bWJlcihjeCkpIHtcclxuICAgICAgdGhpcy5jZW50ZXIueCA9IGN4O1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIoY3kpKSB7XHJcbiAgICAgIHRoaXMuY2VudGVyLnkgPSBjeTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmZvY2FsLmNvcHkodGhpcy5jZW50ZXIpO1xyXG5cclxuICAgIGlmIChfLmlzTnVtYmVyKGZ4KSkge1xyXG4gICAgICB0aGlzLmZvY2FsLnggPSBmeDtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKGZ5KSkge1xyXG4gICAgICB0aGlzLmZvY2FsLnkgPSBmeTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoUmFkaWFsR3JhZGllbnQsIHtcclxuXHJcbiAgICBTdG9wOiBUd28uR3JhZGllbnQuU3RvcCxcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbXHJcbiAgICAgICdyYWRpdXMnXHJcbiAgICBdLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgIFR3by5HcmFkaWVudC5NYWtlT2JzZXJ2YWJsZShvYmplY3QpO1xyXG5cclxuICAgICAgXy5lYWNoKFJhZGlhbEdyYWRpZW50LlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqZWN0KTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChSYWRpYWxHcmFkaWVudC5wcm90b3R5cGUsIFR3by5HcmFkaWVudC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfZmxhZ1JhZGl1czogZmFsc2UsXHJcbiAgICBfZmxhZ0NlbnRlcjogZmFsc2UsXHJcbiAgICBfZmxhZ0ZvY2FsOiBmYWxzZSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24ocGFyZW50KSB7XHJcblxyXG4gICAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICB2YXIgc3RvcHMgPSBfLm1hcCh0aGlzLnN0b3BzLCBmdW5jdGlvbihzdG9wKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0b3AuY2xvbmUoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgUmFkaWFsR3JhZGllbnQodGhpcy5jZW50ZXIuX3gsIHRoaXMuY2VudGVyLl95LFxyXG4gICAgICAgICAgdGhpcy5fcmFkaXVzLCBzdG9wcywgdGhpcy5mb2NhbC5feCwgdGhpcy5mb2NhbC5feSk7XHJcblxyXG4gICAgICBfLmVhY2goVHdvLkdyYWRpZW50LlByb3BlcnRpZXMuY29uY2F0KFJhZGlhbEdyYWRpZW50LlByb3BlcnRpZXMpLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgY2xvbmVba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICBwYXJlbnQuYWRkKGNsb25lKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlc3VsdCA9IFR3by5HcmFkaWVudC5wcm90b3R5cGUudG9PYmplY3QuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIF8uZWFjaChSYWRpYWxHcmFkaWVudC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgcmVzdWx0W2tdID0gdGhpc1trXTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICByZXN1bHQuY2VudGVyID0gdGhpcy5jZW50ZXIudG9PYmplY3QoKTtcclxuICAgICAgcmVzdWx0LmZvY2FsID0gdGhpcy5mb2NhbC50b09iamVjdCgpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdSYWRpdXMgfHwgdGhpcy5fZmxhdENlbnRlciB8fCB0aGlzLl9mbGFnRm9jYWxcclxuICAgICAgICB8fCB0aGlzLl9mbGFnU3ByZWFkIHx8IHRoaXMuX2ZsYWdTdG9wcykge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdSYWRpdXMgPSB0aGlzLl9mbGFnQ2VudGVyID0gdGhpcy5fZmxhZ0ZvY2FsID0gZmFsc2U7XHJcblxyXG4gICAgICBUd28uR3JhZGllbnQucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgUmFkaWFsR3JhZGllbnQuTWFrZU9ic2VydmFibGUoUmFkaWFsR3JhZGllbnQucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG4gIHZhciBhbmNob3I7XHJcbiAgdmFyIHJlZ2V4ID0ge1xyXG4gICAgdmlkZW86IC9cXC4obXA0fHdlYm0pJC9pLFxyXG4gICAgaW1hZ2U6IC9cXC4oanBlP2d8cG5nfGdpZnx0aWZmKSQvaVxyXG4gIH07XHJcblxyXG4gIGlmICh0aGlzLmRvY3VtZW50KSB7XHJcbiAgICBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgfVxyXG5cclxuICB2YXIgVGV4dHVyZSA9IFR3by5UZXh0dXJlID0gZnVuY3Rpb24oc3JjLCBjYWxsYmFjaykge1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyID0ge307XHJcbiAgICB0aGlzLl9yZW5kZXJlci50eXBlID0gJ3RleHR1cmUnO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ09mZnNldCA9IF8uYmluZChUZXh0dXJlLkZsYWdPZmZzZXQsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1NjYWxlID0gXy5iaW5kKFRleHR1cmUuRmxhZ1NjYWxlLCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLmlkID0gVHdvLklkZW50aWZpZXIgKyBUd28udW5pcXVlSWQoKTtcclxuICAgIHRoaXMuY2xhc3NMaXN0ID0gW107XHJcblxyXG4gICAgdGhpcy5vZmZzZXQgPSBuZXcgVHdvLlZlY3RvcigpO1xyXG5cclxuICAgIGlmIChfLmlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XHJcbiAgICAgIHZhciBsb2FkZWQgPSBfLmJpbmQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy51bmJpbmQoVHdvLkV2ZW50cy5sb2FkLCBsb2FkZWQpO1xyXG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICAgIHRoaXMuYmluZChUd28uRXZlbnRzLmxvYWQsIGxvYWRlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF8uaXNTdHJpbmcoc3JjKSkge1xyXG4gICAgICB0aGlzLnNyYyA9IHNyYztcclxuICAgIH0gZWxzZSBpZiAoXy5pc0VsZW1lbnQoc3JjKSkge1xyXG4gICAgICB0aGlzLmltYWdlID0gc3JjO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChUZXh0dXJlLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogW1xyXG4gICAgICAnc3JjJyxcclxuICAgICAgJ2xvYWRlZCcsXHJcbiAgICAgICdyZXBlYXQnXHJcbiAgICBdLFxyXG5cclxuICAgIEltYWdlUmVnaXN0cnk6IG5ldyBUd28uUmVnaXN0cnkoKSxcclxuXHJcbiAgICBnZXRBYnNvbHV0ZVVSTDogZnVuY3Rpb24ocGF0aCkge1xyXG4gICAgICBpZiAoIWFuY2hvcikge1xyXG4gICAgICAgIC8vIFRPRE86IEZpeCBmb3IgaGVhZGxlc3MgZW52aXJvbm1lbnRcclxuICAgICAgICByZXR1cm4gcGF0aDtcclxuICAgICAgfVxyXG4gICAgICBhbmNob3IuaHJlZiA9IHBhdGg7XHJcbiAgICAgIHJldHVybiBhbmNob3IuaHJlZjtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW1hZ2U6IGZ1bmN0aW9uKHNyYykge1xyXG5cclxuICAgICAgdmFyIGFic29sdXRlU3JjID0gVGV4dHVyZS5nZXRBYnNvbHV0ZVVSTChzcmMpO1xyXG5cclxuICAgICAgaWYgKFRleHR1cmUuSW1hZ2VSZWdpc3RyeS5jb250YWlucyhhYnNvbHV0ZVNyYykpIHtcclxuICAgICAgICByZXR1cm4gVGV4dHVyZS5JbWFnZVJlZ2lzdHJ5LmdldChhYnNvbHV0ZVNyYyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBpbWFnZTtcclxuXHJcbiAgICAgIGlmIChyZWdleC52aWRlby50ZXN0KGFic29sdXRlU3JjKSkge1xyXG4gICAgICAgIGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpbWFnZS5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xyXG5cclxuICAgICAgcmV0dXJuIGltYWdlO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgUmVnaXN0ZXI6IHtcclxuICAgICAgY2FudmFzOiBmdW5jdGlvbih0ZXh0dXJlLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHRleHR1cmUuX3NyYyA9ICcjJyArIHRleHR1cmUuaWQ7XHJcbiAgICAgICAgVGV4dHVyZS5JbWFnZVJlZ2lzdHJ5LmFkZCh0ZXh0dXJlLnNyYywgdGV4dHVyZS5pbWFnZSk7XHJcbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBpbWc6IGZ1bmN0aW9uKHRleHR1cmUsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgIHZhciBsb2FkZWQgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBsb2FkZWQsIGZhbHNlKTtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlcnJvciwgZmFsc2UpO1xyXG4gICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIGxvYWRlZCwgZmFsc2UpO1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yLCBmYWxzZSk7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgVHdvLlV0aWxzLkVycm9yKCd1bmFibGUgdG8gbG9hZCAnICsgdGV4dHVyZS5zcmMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmIChfLmlzTnVtYmVyKHRleHR1cmUuaW1hZ2Uud2lkdGgpICYmIHRleHR1cmUuaW1hZ2Uud2lkdGggPiAwXHJcbiAgICAgICAgICAmJiBfLmlzTnVtYmVyKHRleHR1cmUuaW1hZ2UuaGVpZ2h0KSAmJiB0ZXh0dXJlLmltYWdlLmhlaWdodCA+IDApIHtcclxuICAgICAgICAgICAgbG9hZGVkKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGxvYWRlZCwgZmFsc2UpO1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0ZXh0dXJlLl9zcmMgPSBUZXh0dXJlLmdldEFic29sdXRlVVJMKHRleHR1cmUuX3NyYyk7XHJcblxyXG4gICAgICAgIGlmICh0ZXh0dXJlLmltYWdlICYmIHRleHR1cmUuaW1hZ2UuZ2V0QXR0cmlidXRlKCd0d28tc3JjJykpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRleHR1cmUuaW1hZ2Uuc2V0QXR0cmlidXRlKCd0d28tc3JjJywgdGV4dHVyZS5zcmMpO1xyXG4gICAgICAgIFRleHR1cmUuSW1hZ2VSZWdpc3RyeS5hZGQodGV4dHVyZS5zcmMsIHRleHR1cmUuaW1hZ2UpO1xyXG4gICAgICAgIHRleHR1cmUuaW1hZ2Uuc3JjID0gdGV4dHVyZS5zcmM7XHJcblxyXG4gICAgICB9LFxyXG4gICAgICB2aWRlbzogZnVuY3Rpb24odGV4dHVyZSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgdmFyIGxvYWRlZCA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIGxvYWRlZCwgZmFsc2UpO1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yLCBmYWxzZSk7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLndpZHRoID0gdGV4dHVyZS5pbWFnZS52aWRlb1dpZHRoO1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5oZWlnaHQgPSB0ZXh0dXJlLmltYWdlLnZpZGVvSGVpZ2h0O1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5wbGF5KCk7XHJcbiAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgbG9hZGVkLCBmYWxzZSk7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZXJyb3IsIGZhbHNlKTtcclxuICAgICAgICAgIHRocm93IG5ldyBUd28uVXRpbHMuRXJyb3IoJ3VuYWJsZSB0byBsb2FkICcgKyB0ZXh0dXJlLnNyYyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGV4dHVyZS5fc3JjID0gVGV4dHVyZS5nZXRBYnNvbHV0ZVVSTCh0ZXh0dXJlLl9zcmMpO1xyXG4gICAgICAgIHRleHR1cmUuaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2FucGxheXRocm91Z2gnLCBsb2FkZWQsIGZhbHNlKTtcclxuICAgICAgICB0ZXh0dXJlLmltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZXJyb3IsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgaWYgKHRleHR1cmUuaW1hZ2UgJiYgdGV4dHVyZS5pbWFnZS5nZXRBdHRyaWJ1dGUoJ3R3by1zcmMnKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dHVyZS5pbWFnZS5zZXRBdHRyaWJ1dGUoJ3R3by1zcmMnLCB0ZXh0dXJlLnNyYyk7XHJcbiAgICAgICAgVGV4dHVyZS5JbWFnZVJlZ2lzdHJ5LmFkZCh0ZXh0dXJlLnNyYywgdGV4dHVyZS5pbWFnZSk7XHJcbiAgICAgICAgdGV4dHVyZS5pbWFnZS5zcmMgPSB0ZXh0dXJlLnNyYztcclxuICAgICAgICB0ZXh0dXJlLmltYWdlLmxvb3AgPSB0cnVlO1xyXG4gICAgICAgIHRleHR1cmUuaW1hZ2UubG9hZCgpO1xyXG5cclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkOiBmdW5jdGlvbih0ZXh0dXJlLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgdmFyIHNyYyA9IHRleHR1cmUuc3JjO1xyXG4gICAgICB2YXIgaW1hZ2UgPSB0ZXh0dXJlLmltYWdlO1xyXG4gICAgICB2YXIgdGFnID0gaW1hZ2UgJiYgaW1hZ2Uubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgIGlmICh0ZXh0dXJlLl9mbGFnSW1hZ2UpIHtcclxuICAgICAgICBpZiAoL2NhbnZhcy9pLnRlc3QodGFnKSkge1xyXG4gICAgICAgICAgVGV4dHVyZS5SZWdpc3Rlci5jYW52YXModGV4dHVyZSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0ZXh0dXJlLl9zcmMgPSBpbWFnZS5nZXRBdHRyaWJ1dGUoJ3R3by1zcmMnKSB8fCBpbWFnZS5zcmM7XHJcbiAgICAgICAgICBUZXh0dXJlLlJlZ2lzdGVyW3RhZ10odGV4dHVyZSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRleHR1cmUuX2ZsYWdTcmMpIHtcclxuICAgICAgICBpZiAoIWltYWdlKSB7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlID0gVGV4dHVyZS5nZXRJbWFnZSh0ZXh0dXJlLnNyYyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRhZyA9IHRleHR1cmUuaW1hZ2Uubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBUZXh0dXJlLlJlZ2lzdGVyW3RhZ10odGV4dHVyZSwgY2FsbGJhY2spO1xyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBGbGFnT2Zmc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ09mZnNldCA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIEZsYWdTY2FsZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdTY2FsZSA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgIF8uZWFjaChUZXh0dXJlLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqZWN0KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdpbWFnZScsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5faW1hZ2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGltYWdlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHRhZyA9IGltYWdlICYmIGltYWdlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICB2YXIgaW5kZXg7XHJcblxyXG4gICAgICAgICAgc3dpdGNoICh0YWcpIHtcclxuICAgICAgICAgICAgY2FzZSAnY2FudmFzJzpcclxuICAgICAgICAgICAgICBpbmRleCA9ICcjJyArIGltYWdlLmlkO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgIGluZGV4ID0gaW1hZ2Uuc3JjO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChUZXh0dXJlLkltYWdlUmVnaXN0cnkuY29udGFpbnMoaW5kZXgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ltYWdlID0gVGV4dHVyZS5JbWFnZVJlZ2lzdHJ5LmdldChpbWFnZS5zcmMpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5faW1hZ2UgPSBpbWFnZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9mbGFnSW1hZ2UgPSB0cnVlO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdvZmZzZXQnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX29mZnNldDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgaWYgKHRoaXMuX29mZnNldCkge1xyXG4gICAgICAgICAgICB0aGlzLl9vZmZzZXQudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnT2Zmc2V0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHRoaXMuX29mZnNldCA9IHY7XHJcbiAgICAgICAgICB0aGlzLl9vZmZzZXQuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ09mZnNldCk7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnT2Zmc2V0ID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ3NjYWxlJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9zY2FsZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2NhbGUudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnU2NhbGUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX3NjYWxlID0gdjtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NjYWxlLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdTY2FsZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fZmxhZ1NjYWxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChUZXh0dXJlLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywgVHdvLlNoYXBlLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF9mbGFnU3JjOiBmYWxzZSxcclxuICAgIF9mbGFnSW1hZ2U6IGZhbHNlLFxyXG4gICAgX2ZsYWdWaWRlbzogZmFsc2UsXHJcbiAgICBfZmxhZ0xvYWRlZDogZmFsc2UsXHJcbiAgICBfZmxhZ1JlcGVhdDogZmFsc2UsXHJcblxyXG4gICAgX2ZsYWdPZmZzZXQ6IGZhbHNlLFxyXG4gICAgX2ZsYWdTY2FsZTogZmFsc2UsXHJcblxyXG4gICAgX3NyYzogJycsXHJcbiAgICBfaW1hZ2U6IG51bGwsXHJcbiAgICBfbG9hZGVkOiBmYWxzZSxcclxuICAgIF9yZXBlYXQ6ICduby1yZXBlYXQnLFxyXG5cclxuICAgIF9zY2FsZTogMSxcclxuICAgIF9vZmZzZXQ6IG51bGwsXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFRleHR1cmUodGhpcy5zcmMpO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgc3JjOiB0aGlzLnNyYyxcclxuICAgICAgICBpbWFnZTogdGhpcy5pbWFnZVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdTcmMgfHwgdGhpcy5fZmxhZ0ltYWdlIHx8IHRoaXMuX2ZsYWdWaWRlbykge1xyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1NyYyB8fCB0aGlzLl9mbGFnSW1hZ2UpIHtcclxuICAgICAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgICBUZXh0dXJlLmxvYWQodGhpcywgXy5iaW5kKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXNcclxuICAgICAgICAgICAgICAudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSlcclxuICAgICAgICAgICAgICAudHJpZ2dlcihUd28uRXZlbnRzLmxvYWQpO1xyXG4gICAgICAgICAgfSwgdGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9pbWFnZSAmJiB0aGlzLl9pbWFnZS5yZWFkeVN0YXRlID49IDQpIHtcclxuICAgICAgICB0aGlzLl9mbGFnVmlkZW8gPSB0cnVlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnU3JjID0gdGhpcy5fZmxhZ0ltYWdlID0gdGhpcy5fZmxhZ0xvYWRlZFxyXG4gICAgICAgID0gdGhpcy5fZmxhZ1ZpZGVvID0gdGhpcy5fZmxhZ1NjYWxlID0gdGhpcy5fZmxhZ09mZnNldCA9IGZhbHNlO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgVGV4dHVyZS5NYWtlT2JzZXJ2YWJsZShUZXh0dXJlLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuICB2YXIgUGF0aCA9IFR3by5QYXRoO1xyXG4gIHZhciBSZWN0YW5nbGUgPSBUd28uUmVjdGFuZ2xlO1xyXG5cclxuICB2YXIgU3ByaXRlID0gVHdvLlNwcml0ZSA9IGZ1bmN0aW9uKHBhdGgsIG94LCBveSwgY29scywgcm93cywgZnJhbWVSYXRlKSB7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIFtcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKVxyXG4gICAgXSwgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5ub1N0cm9rZSgpO1xyXG4gICAgdGhpcy5ub0ZpbGwoKTtcclxuXHJcbiAgICBpZiAocGF0aCBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgIHRoaXMudGV4dHVyZSA9IHBhdGg7XHJcbiAgICB9IGVsc2UgaWYgKF8uaXNTdHJpbmcocGF0aCkpIHtcclxuICAgICAgdGhpcy50ZXh0dXJlID0gbmV3IFR3by5UZXh0dXJlKHBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQob3ggfHwgMCwgb3kgfHwgMCk7XHJcblxyXG4gICAgaWYgKF8uaXNOdW1iZXIoY29scykpIHtcclxuICAgICAgdGhpcy5jb2x1bW5zID0gY29scztcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKHJvd3MpKSB7XHJcbiAgICAgIHRoaXMucm93cyA9IHJvd3M7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcihmcmFtZVJhdGUpKSB7XHJcbiAgICAgIHRoaXMuZnJhbWVSYXRlID0gZnJhbWVSYXRlO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChTcHJpdGUsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbXHJcbiAgICAgICd0ZXh0dXJlJywgJ2NvbHVtbnMnLCAncm93cycsICdmcmFtZVJhdGUnLCAnaW5kZXgnXHJcbiAgICBdLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgIFJlY3RhbmdsZS5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goU3ByaXRlLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pXHJcblxyXG4gIF8uZXh0ZW5kKFNwcml0ZS5wcm90b3R5cGUsIFJlY3RhbmdsZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfZmxhZ1RleHR1cmU6IGZhbHNlLFxyXG4gICAgX2ZsYWdDb2x1bW5zOiBmYWxzZSxcclxuICAgIF9mbGFnUm93czogZmFsc2UsXHJcbiAgICBfZmxhZ0ZyYW1lUmF0ZTogZmFsc2UsXHJcbiAgICBmbGFnSW5kZXg6IGZhbHNlLFxyXG5cclxuICAgIC8vIFByaXZhdGUgdmFyaWFibGVzXHJcbiAgICBfYW1vdW50OiAxLFxyXG4gICAgX2R1cmF0aW9uOiAwLFxyXG4gICAgX3N0YXJ0VGltZTogMCxcclxuICAgIF9wbGF5aW5nOiBmYWxzZSxcclxuICAgIF9maXJzdEZyYW1lOiAwLFxyXG4gICAgX2xhc3RGcmFtZTogMCxcclxuICAgIF9sb29wOiB0cnVlLFxyXG5cclxuICAgIC8vIEV4cG9zZWQgdGhyb3VnaCBnZXR0ZXItc2V0dGVyXHJcbiAgICBfdGV4dHVyZTogbnVsbCxcclxuICAgIF9jb2x1bW5zOiAxLFxyXG4gICAgX3Jvd3M6IDEsXHJcbiAgICBfZnJhbWVSYXRlOiAwLFxyXG4gICAgX2luZGV4OiAwLFxyXG5cclxuICAgIHBsYXk6IGZ1bmN0aW9uKGZpcnN0RnJhbWUsIGxhc3RGcmFtZSwgb25MYXN0RnJhbWUpIHtcclxuXHJcbiAgICAgIHRoaXMuX3BsYXlpbmcgPSB0cnVlO1xyXG4gICAgICB0aGlzLl9maXJzdEZyYW1lID0gMDtcclxuICAgICAgdGhpcy5fbGFzdEZyYW1lID0gdGhpcy5hbW91bnQgLSAxO1xyXG4gICAgICB0aGlzLl9zdGFydFRpbWUgPSBfLnBlcmZvcm1hbmNlLm5vdygpO1xyXG5cclxuICAgICAgaWYgKF8uaXNOdW1iZXIoZmlyc3RGcmFtZSkpIHtcclxuICAgICAgICB0aGlzLl9maXJzdEZyYW1lID0gZmlyc3RGcmFtZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoXy5pc051bWJlcihsYXN0RnJhbWUpKSB7XHJcbiAgICAgICAgdGhpcy5fbGFzdEZyYW1lID0gbGFzdEZyYW1lO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob25MYXN0RnJhbWUpKSB7XHJcbiAgICAgICAgdGhpcy5fb25MYXN0RnJhbWUgPSBvbkxhc3RGcmFtZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5fb25MYXN0RnJhbWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9pbmRleCAhPT0gdGhpcy5fZmlyc3RGcmFtZSkge1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZSAtPSAxMDAwICogTWF0aC5hYnModGhpcy5faW5kZXggLSB0aGlzLl9maXJzdEZyYW1lKVxyXG4gICAgICAgICAgLyB0aGlzLl9mcmFtZVJhdGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcGF1c2U6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fcGxheWluZyA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fcGxheWluZyA9IGZhbHNlO1xyXG4gICAgICB0aGlzLl9pbmRleCA9IDA7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuXHJcbiAgICAgIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBTcHJpdGUoXHJcbiAgICAgICAgdGhpcy50ZXh0dXJlLCB0aGlzLnRyYW5zbGF0aW9uLngsIHRoaXMudHJhbnNsYXRpb24ueSxcclxuICAgICAgICB0aGlzLmNvbHVtbnMsIHRoaXMucm93cywgdGhpcy5mcmFtZVJhdGVcclxuICAgICAgKTtcclxuXHJcbiAgICAgIGlmICh0aGlzLnBsYXlpbmcpIHtcclxuICAgICAgICBjbG9uZS5wbGF5KHRoaXMuX2ZpcnN0RnJhbWUsIHRoaXMuX2xhc3RGcmFtZSk7XHJcbiAgICAgICAgY2xvbmUuX2xvb3AgPSB0aGlzLl9sb29wO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LmFkZChjbG9uZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGVmZmVjdCA9IHRoaXMuX3RleHR1cmU7XHJcbiAgICAgIHZhciBjb2xzID0gdGhpcy5fY29sdW1ucztcclxuICAgICAgdmFyIHJvd3MgPSB0aGlzLl9yb3dzO1xyXG5cclxuICAgICAgdmFyIHdpZHRoLCBoZWlnaHQsIGVsYXBzZWQsIGFtb3VudCwgZHVyYXRpb247XHJcbiAgICAgIHZhciBpbmRleCwgaXcsIGloLCBpc1JhbmdlLCBmcmFtZXM7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ0NvbHVtbnMgfHwgdGhpcy5fZmxhZ1Jvd3MpIHtcclxuICAgICAgICB0aGlzLl9hbW91bnQgPSB0aGlzLl9jb2x1bW5zICogdGhpcy5fcm93cztcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdGcmFtZVJhdGUpIHtcclxuICAgICAgICB0aGlzLl9kdXJhdGlvbiA9IDEwMDAgKiB0aGlzLl9hbW91bnQgLyB0aGlzLl9mcmFtZVJhdGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnVGV4dHVyZSkge1xyXG4gICAgICAgIHRoaXMuZmlsbCA9IHRoaXMuX3RleHR1cmU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl90ZXh0dXJlLmxvYWRlZCkge1xyXG5cclxuICAgICAgICBpdyA9IGVmZmVjdC5pbWFnZS53aWR0aDtcclxuICAgICAgICBpaCA9IGVmZmVjdC5pbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgIHdpZHRoID0gaXcgLyBjb2xzO1xyXG4gICAgICAgIGhlaWdodCA9IGloIC8gcm93cztcclxuICAgICAgICBhbW91bnQgPSB0aGlzLl9hbW91bnQ7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLndpZHRoICE9PSB3aWR0aCkge1xyXG4gICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5oZWlnaHQgIT09IGhlaWdodCkge1xyXG4gICAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fcGxheWluZyAmJiB0aGlzLl9mcmFtZVJhdGUgPiAwKSB7XHJcblxyXG4gICAgICAgICAgaWYgKF8uaXNOYU4odGhpcy5fbGFzdEZyYW1lKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0RnJhbWUgPSBhbW91bnQgLSAxO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFRPRE86IE9mZmxvYWQgcGVyZiBsb2dpYyB0byBpbnN0YW5jZSBvZiBgVHdvYC5cclxuICAgICAgICAgIGVsYXBzZWQgPSBfLnBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5fc3RhcnRUaW1lO1xyXG4gICAgICAgICAgZnJhbWVzID0gdGhpcy5fbGFzdEZyYW1lICsgMTtcclxuICAgICAgICAgIGR1cmF0aW9uID0gMTAwMCAqIChmcmFtZXMgLSB0aGlzLl9maXJzdEZyYW1lKSAvIHRoaXMuX2ZyYW1lUmF0ZTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fbG9vcCkge1xyXG4gICAgICAgICAgICBlbGFwc2VkID0gZWxhcHNlZCAlIGR1cmF0aW9uO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWxhcHNlZCA9IE1hdGgubWluKGVsYXBzZWQsIGR1cmF0aW9uKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpbmRleCA9IF8ubGVycCh0aGlzLl9maXJzdEZyYW1lLCBmcmFtZXMsIGVsYXBzZWQgLyBkdXJhdGlvbik7XHJcbiAgICAgICAgICBpbmRleCA9IE1hdGguZmxvb3IoaW5kZXgpO1xyXG5cclxuICAgICAgICAgIGlmIChpbmRleCAhPT0gdGhpcy5faW5kZXgpIHtcclxuICAgICAgICAgICAgdGhpcy5faW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgaWYgKGluZGV4ID49IHRoaXMuX2xhc3RGcmFtZSAtIDEgJiYgdGhpcy5fb25MYXN0RnJhbWUpIHtcclxuICAgICAgICAgICAgICB0aGlzLl9vbkxhc3RGcmFtZSgpOyAgLy8gU2hvcnRjdXQgZm9yIGNoYWluYWJsZSBzcHJpdGUgYW5pbWF0aW9uc1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNvbCA9IHRoaXMuX2luZGV4ICUgY29scztcclxuICAgICAgICB2YXIgcm93ID0gTWF0aC5mbG9vcih0aGlzLl9pbmRleCAvIGNvbHMpO1xyXG5cclxuICAgICAgICB2YXIgb3ggPSAtIHdpZHRoICogY29sICsgKGl3IC0gd2lkdGgpIC8gMjtcclxuICAgICAgICB2YXIgb3kgPSAtIGhlaWdodCAqIHJvdyArIChpaCAtIGhlaWdodCkgLyAyO1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBJbXByb3ZlIHBlcmZvcm1hbmNlXHJcbiAgICAgICAgaWYgKG94ICE9PSBlZmZlY3Qub2Zmc2V0LngpIHtcclxuICAgICAgICAgIGVmZmVjdC5vZmZzZXQueCA9IG94O1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3kgIT09IGVmZmVjdC5vZmZzZXQueSkge1xyXG4gICAgICAgICAgZWZmZWN0Lm9mZnNldC55ID0gb3k7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnVGV4dHVyZSA9IHRoaXMuX2ZsYWdDb2x1bW5zID0gdGhpcy5fZmxhZ1Jvd3NcclxuICAgICAgICA9IHRoaXMuX2ZsYWdGcmFtZVJhdGUgPSBmYWxzZTtcclxuXHJcbiAgICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcblxyXG4gIH0pO1xyXG5cclxuICBTcHJpdGUuTWFrZU9ic2VydmFibGUoU3ByaXRlLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuICB2YXIgUGF0aCA9IFR3by5QYXRoO1xyXG4gIHZhciBSZWN0YW5nbGUgPSBUd28uUmVjdGFuZ2xlO1xyXG5cclxuICB2YXIgSW1hZ2VTZXF1ZW5jZSA9IFR3by5JbWFnZVNlcXVlbmNlID0gZnVuY3Rpb24ocGF0aHMsIG94LCBveSwgZnJhbWVSYXRlKSB7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIFtcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKVxyXG4gICAgXSwgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1RleHR1cmVzID0gXy5iaW5kKEltYWdlU2VxdWVuY2UuRmxhZ1RleHR1cmVzLCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLmJpbmRUZXh0dXJlcyA9IF8uYmluZChJbWFnZVNlcXVlbmNlLkJpbmRUZXh0dXJlcywgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci51bmJpbmRUZXh0dXJlcyA9IF8uYmluZChJbWFnZVNlcXVlbmNlLlVuYmluZFRleHR1cmVzLCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLm5vU3Ryb2tlKCk7XHJcbiAgICB0aGlzLm5vRmlsbCgpO1xyXG5cclxuICAgIHRoaXMudGV4dHVyZXMgPSBfLm1hcChwYXRocywgSW1hZ2VTZXF1ZW5jZS5HZW5lcmF0ZVRleHR1cmUsIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQob3ggfHwgMCwgb3kgfHwgMCk7XHJcblxyXG4gICAgaWYgKF8uaXNOdW1iZXIoZnJhbWVSYXRlKSkge1xyXG4gICAgICB0aGlzLmZyYW1lUmF0ZSA9IGZyYW1lUmF0ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZnJhbWVSYXRlID0gSW1hZ2VTZXF1ZW5jZS5EZWZhdWx0RnJhbWVSYXRlO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChJbWFnZVNlcXVlbmNlLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogW1xyXG4gICAgICAnZnJhbWVSYXRlJyxcclxuICAgICAgJ2luZGV4J1xyXG4gICAgXSxcclxuXHJcbiAgICBEZWZhdWx0RnJhbWVSYXRlOiAzMCxcclxuXHJcbiAgICBGbGFnVGV4dHVyZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnVGV4dHVyZXMgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBCaW5kVGV4dHVyZXM6IGZ1bmN0aW9uKGl0ZW1zKSB7XHJcblxyXG4gICAgICB2YXIgaSA9IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgIGl0ZW1zW2ldLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdUZXh0dXJlcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdUZXh0dXJlcygpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgVW5iaW5kVGV4dHVyZXM6IGZ1bmN0aW9uKGl0ZW1zKSB7XHJcblxyXG4gICAgICB2YXIgaSA9IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgIGl0ZW1zW2ldLnVuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1RleHR1cmVzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1RleHR1cmVzKCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICBSZWN0YW5nbGUuTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKEltYWdlU2VxdWVuY2UuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgJ3RleHR1cmVzJywge1xyXG5cclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3RleHR1cmVzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odGV4dHVyZXMpIHtcclxuXHJcbiAgICAgICAgICB2YXIgdXBkYXRlVGV4dHVyZXMgPSB0aGlzLl9yZW5kZXJlci5mbGFnVGV4dHVyZXM7XHJcbiAgICAgICAgICB2YXIgYmluZFRleHR1cmVzID0gdGhpcy5fcmVuZGVyZXIuYmluZFRleHR1cmVzO1xyXG4gICAgICAgICAgdmFyIHVuYmluZFRleHR1cmVzID0gdGhpcy5fcmVuZGVyZXIudW5iaW5kVGV4dHVyZXM7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIHByZXZpb3VzIGxpc3RlbmVyc1xyXG4gICAgICAgICAgaWYgKHRoaXMuX3RleHR1cmVzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3RleHR1cmVzXHJcbiAgICAgICAgICAgICAgLnVuYmluZChUd28uRXZlbnRzLmluc2VydCwgYmluZFRleHR1cmVzKVxyXG4gICAgICAgICAgICAgIC51bmJpbmQoVHdvLkV2ZW50cy5yZW1vdmUsIHVuYmluZFRleHR1cmVzKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDcmVhdGUgbmV3IENvbGxlY3Rpb24gd2l0aCBjb3B5IG9mIHZlcnRpY2VzXHJcbiAgICAgICAgICB0aGlzLl90ZXh0dXJlcyA9IG5ldyBUd28uVXRpbHMuQ29sbGVjdGlvbigodGV4dHVyZXMgfHwgW10pLnNsaWNlKDApKTtcclxuXHJcbiAgICAgICAgICAvLyBMaXN0ZW4gZm9yIENvbGxlY3Rpb24gY2hhbmdlcyBhbmQgYmluZCAvIHVuYmluZFxyXG4gICAgICAgICAgdGhpcy5fdGV4dHVyZXNcclxuICAgICAgICAgICAgLmJpbmQoVHdvLkV2ZW50cy5pbnNlcnQsIGJpbmRUZXh0dXJlcylcclxuICAgICAgICAgICAgLmJpbmQoVHdvLkV2ZW50cy5yZW1vdmUsIHVuYmluZFRleHR1cmVzKTtcclxuXHJcbiAgICAgICAgICAvLyBCaW5kIEluaXRpYWwgVGV4dHVyZXNcclxuICAgICAgICAgIGJpbmRUZXh0dXJlcyh0aGlzLl90ZXh0dXJlcyk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgR2VuZXJhdGVUZXh0dXJlOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgcmV0dXJuIG9iajtcclxuICAgICAgfSBlbHNlIGlmIChfLmlzU3RyaW5nKG9iaikpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFR3by5UZXh0dXJlKG9iaik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKEltYWdlU2VxdWVuY2UucHJvdG90eXBlLCBSZWN0YW5nbGUucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX2ZsYWdUZXh0dXJlczogZmFsc2UsXHJcbiAgICBfZmxhZ0ZyYW1lUmF0ZTogZmFsc2UsXHJcbiAgICBfZmxhZ0luZGV4OiBmYWxzZSxcclxuXHJcbiAgICAvLyBQcml2YXRlIHZhcmlhYmxlc1xyXG4gICAgX2Ftb3VudDogMSxcclxuICAgIF9kdXJhdGlvbjogMCxcclxuICAgIF9pbmRleDogMCxcclxuICAgIF9zdGFydFRpbWU6IDAsXHJcbiAgICBfcGxheWluZzogZmFsc2UsXHJcbiAgICBfZmlyc3RGcmFtZTogMCxcclxuICAgIF9sYXN0RnJhbWU6IDAsXHJcbiAgICBfbG9vcDogdHJ1ZSxcclxuXHJcbiAgICAvLyBFeHBvc2VkIHRocm91Z2ggZ2V0dGVyLXNldHRlclxyXG4gICAgX3RleHR1cmVzOiBudWxsLFxyXG4gICAgX2ZyYW1lUmF0ZTogMCxcclxuXHJcbiAgICBwbGF5OiBmdW5jdGlvbihmaXJzdEZyYW1lLCBsYXN0RnJhbWUsIG9uTGFzdEZyYW1lKSB7XHJcblxyXG4gICAgICB0aGlzLl9wbGF5aW5nID0gdHJ1ZTtcclxuICAgICAgdGhpcy5fZmlyc3RGcmFtZSA9IDA7XHJcbiAgICAgIHRoaXMuX2xhc3RGcmFtZSA9IHRoaXMuYW1vdW50IC0gMTtcclxuICAgICAgdGhpcy5fc3RhcnRUaW1lID0gXy5wZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICAgIGlmIChfLmlzTnVtYmVyKGZpcnN0RnJhbWUpKSB7XHJcbiAgICAgICAgdGhpcy5fZmlyc3RGcmFtZSA9IGZpcnN0RnJhbWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF8uaXNOdW1iZXIobGFzdEZyYW1lKSkge1xyXG4gICAgICAgIHRoaXMuX2xhc3RGcmFtZSA9IGxhc3RGcmFtZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9uTGFzdEZyYW1lKSkge1xyXG4gICAgICAgIHRoaXMuX29uTGFzdEZyYW1lID0gb25MYXN0RnJhbWU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuX29uTGFzdEZyYW1lO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5faW5kZXggIT09IHRoaXMuX2ZpcnN0RnJhbWUpIHtcclxuICAgICAgICB0aGlzLl9zdGFydFRpbWUgLT0gMTAwMCAqIE1hdGguYWJzKHRoaXMuX2luZGV4IC0gdGhpcy5fZmlyc3RGcmFtZSlcclxuICAgICAgICAgIC8gdGhpcy5fZnJhbWVSYXRlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHBhdXNlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX3BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX3BsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgdGhpcy5faW5kZXggPSAwO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24ocGFyZW50KSB7XHJcblxyXG4gICAgICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgSW1hZ2VTZXF1ZW5jZSh0aGlzLnRleHR1cmVzLCB0aGlzLnRyYW5zbGF0aW9uLngsXHJcbiAgICAgICAgdGhpcy50cmFuc2xhdGlvbi55LCB0aGlzLmZyYW1lUmF0ZSlcclxuXHJcbiAgICAgICAgY2xvbmUuX2xvb3AgPSB0aGlzLl9sb29wO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fcGxheWluZykge1xyXG4gICAgICAgICAgY2xvbmUucGxheSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgICAgcGFyZW50LmFkZChjbG9uZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBlZmZlY3RzID0gdGhpcy5fdGV4dHVyZXM7XHJcbiAgICAgIHZhciB3aWR0aCwgaGVpZ2h0LCBlbGFwc2VkLCBhbW91bnQsIGR1cmF0aW9uLCB0ZXh0dXJlO1xyXG4gICAgICB2YXIgaW5kZXgsIGZyYW1lcztcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnVGV4dHVyZXMpIHtcclxuICAgICAgICB0aGlzLl9hbW91bnQgPSBlZmZlY3RzLmxlbmd0aDtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdGcmFtZVJhdGUpIHtcclxuICAgICAgICB0aGlzLl9kdXJhdGlvbiA9IDEwMDAgKiB0aGlzLl9hbW91bnQgLyB0aGlzLl9mcmFtZVJhdGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9wbGF5aW5nICYmIHRoaXMuX2ZyYW1lUmF0ZSA+IDApIHtcclxuXHJcbiAgICAgICAgYW1vdW50ID0gdGhpcy5fYW1vdW50O1xyXG5cclxuICAgICAgICBpZiAoXy5pc05hTih0aGlzLl9sYXN0RnJhbWUpKSB7XHJcbiAgICAgICAgICB0aGlzLl9sYXN0RnJhbWUgPSBhbW91bnQgLSAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVE9ETzogT2ZmbG9hZCBwZXJmIGxvZ2ljIHRvIGluc3RhbmNlIG9mIGBUd29gLlxyXG4gICAgICAgIGVsYXBzZWQgPSBfLnBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5fc3RhcnRUaW1lO1xyXG4gICAgICAgIGZyYW1lcyA9IHRoaXMuX2xhc3RGcmFtZSArIDE7XHJcbiAgICAgICAgZHVyYXRpb24gPSAxMDAwICogKGZyYW1lcyAtIHRoaXMuX2ZpcnN0RnJhbWUpIC8gdGhpcy5fZnJhbWVSYXRlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fbG9vcCkge1xyXG4gICAgICAgICAgZWxhcHNlZCA9IGVsYXBzZWQgJSBkdXJhdGlvbjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZWxhcHNlZCA9IE1hdGgubWluKGVsYXBzZWQsIGR1cmF0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluZGV4ID0gXy5sZXJwKHRoaXMuX2ZpcnN0RnJhbWUsIGZyYW1lcywgZWxhcHNlZCAvIGR1cmF0aW9uKTtcclxuICAgICAgICBpbmRleCA9IE1hdGguZmxvb3IoaW5kZXgpO1xyXG5cclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMuX2luZGV4KSB7XHJcblxyXG4gICAgICAgICAgdGhpcy5faW5kZXggPSBpbmRleDtcclxuICAgICAgICAgIHRleHR1cmUgPSBlZmZlY3RzW3RoaXMuX2luZGV4XTtcclxuXHJcbiAgICAgICAgICBpZiAodGV4dHVyZS5sb2FkZWQpIHtcclxuXHJcbiAgICAgICAgICAgIHdpZHRoID0gdGV4dHVyZS5pbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgaGVpZ2h0ID0gdGV4dHVyZS5pbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy53aWR0aCAhPT0gd2lkdGgpIHtcclxuICAgICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuaGVpZ2h0ICE9PSBoZWlnaHQpIHtcclxuICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5maWxsID0gdGV4dHVyZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSB0aGlzLl9sYXN0RnJhbWUgLSAxICYmIHRoaXMuX29uTGFzdEZyYW1lKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fb25MYXN0RnJhbWUoKTsgIC8vIFNob3J0Y3V0IGZvciBjaGFpbmFibGUgc3ByaXRlIGFuaW1hdGlvbnNcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9mbGFnSW5kZXggfHwgISh0aGlzLmZpbGwgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkpIHtcclxuXHJcbiAgICAgICAgdGV4dHVyZSA9IGVmZmVjdHNbdGhpcy5faW5kZXhdO1xyXG5cclxuICAgICAgICBpZiAodGV4dHVyZS5sb2FkZWQpIHtcclxuXHJcbiAgICAgICAgICB3aWR0aCA9IHRleHR1cmUuaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICBoZWlnaHQgPSB0ZXh0dXJlLmltYWdlLmhlaWdodDtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy53aWR0aCAhPT0gd2lkdGgpIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHRoaXMuaGVpZ2h0ICE9PSBoZWlnaHQpIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5maWxsID0gdGV4dHVyZTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1RleHR1cmVzID0gdGhpcy5fZmxhZ0ZyYW1lUmF0ZSA9IGZhbHNlO1xyXG4gICAgICBSZWN0YW5nbGUucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgSW1hZ2VTZXF1ZW5jZS5NYWtlT2JzZXJ2YWJsZShJbWFnZVNlcXVlbmNlLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICAvKipcclxuICAgKiBDb25zdGFudHNcclxuICAgKi9cclxuICB2YXIgbWluID0gTWF0aC5taW4sIG1heCA9IE1hdGgubWF4O1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICAvKipcclxuICAgKiBBIGNoaWxkcmVuIGNvbGxlY3Rpb24gd2hpY2ggaXMgYWNjZXNpYmxlIGJvdGggYnkgaW5kZXggYW5kIGJ5IG9iamVjdCBpZFxyXG4gICAqIEBjb25zdHJ1Y3RvclxyXG4gICAqL1xyXG4gIHZhciBDaGlsZHJlbiA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIFR3by5VdGlscy5Db2xsZWN0aW9uLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdfZXZlbnRzJywge1xyXG4gICAgICB2YWx1ZSA6IHt9LFxyXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5pZHMgPSB7fTtcclxuXHJcbiAgICB0aGlzLm9uKFR3by5FdmVudHMuaW5zZXJ0LCB0aGlzLmF0dGFjaCk7XHJcbiAgICB0aGlzLm9uKFR3by5FdmVudHMucmVtb3ZlLCB0aGlzLmRldGFjaCk7XHJcbiAgICBDaGlsZHJlbi5wcm90b3R5cGUuYXR0YWNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblxyXG4gIH07XHJcblxyXG4gIENoaWxkcmVuLnByb3RvdHlwZSA9IG5ldyBUd28uVXRpbHMuQ29sbGVjdGlvbigpO1xyXG4gIENoaWxkcmVuLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENoaWxkcmVuO1xyXG5cclxuICBfLmV4dGVuZChDaGlsZHJlbi5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBhdHRhY2g6IGZ1bmN0aW9uKGNoaWxkcmVuKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB0aGlzLmlkc1tjaGlsZHJlbltpXS5pZF0gPSBjaGlsZHJlbltpXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZGV0YWNoOiBmdW5jdGlvbihjaGlsZHJlbikge1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMuaWRzW2NoaWxkcmVuW2ldLmlkXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIHZhciBHcm91cCA9IFR3by5Hcm91cCA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIFR3by5TaGFwZS5jYWxsKHRoaXMsIHRydWUpO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyLnR5cGUgPSAnZ3JvdXAnO1xyXG5cclxuICAgIHRoaXMuYWRkaXRpb25zID0gW107XHJcbiAgICB0aGlzLnN1YnRyYWN0aW9ucyA9IFtdO1xyXG5cclxuICAgIHRoaXMuY2hpbGRyZW4gPSBhcmd1bWVudHM7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKEdyb3VwLCB7XHJcblxyXG4gICAgQ2hpbGRyZW46IENoaWxkcmVuLFxyXG5cclxuICAgIEluc2VydENoaWxkcmVuOiBmdW5jdGlvbihjaGlsZHJlbikge1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgcmVwbGFjZVBhcmVudC5jYWxsKHRoaXMsIGNoaWxkcmVuW2ldLCB0aGlzKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBSZW1vdmVDaGlsZHJlbjogZnVuY3Rpb24oY2hpbGRyZW4pIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHJlcGxhY2VQYXJlbnQuY2FsbCh0aGlzLCBjaGlsZHJlbltpXSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgT3JkZXJDaGlsZHJlbjogZnVuY3Rpb24oY2hpbGRyZW4pIHtcclxuICAgICAgdGhpcy5fZmxhZ09yZGVyID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgdmFyIHByb3BlcnRpZXMgPSBUd28uUGF0aC5Qcm9wZXJ0aWVzLnNsaWNlKDApO1xyXG4gICAgICB2YXIgb2kgPSBfLmluZGV4T2YocHJvcGVydGllcywgJ29wYWNpdHknKTtcclxuXHJcbiAgICAgIGlmIChvaSA+PSAwKSB7XHJcblxyXG4gICAgICAgIHByb3BlcnRpZXMuc3BsaWNlKG9pLCAxKTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ29wYWNpdHknLCB7XHJcblxyXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fb3BhY2l0eTtcclxuICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgc2V0IGZsYWcgaWYgdGhlcmUgaXMgYW4gYWN0dWFsIGRpZmZlcmVuY2VcclxuICAgICAgICAgICAgdGhpcy5fZmxhZ09wYWNpdHkgPSAodGhpcy5fb3BhY2l0eSAhPSB2KTtcclxuICAgICAgICAgICAgdGhpcy5fb3BhY2l0eSA9IHY7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgVHdvLlNoYXBlLk1ha2VPYnNlcnZhYmxlKG9iamVjdCk7XHJcbiAgICAgIEdyb3VwLk1ha2VHZXR0ZXJTZXR0ZXJzKG9iamVjdCwgcHJvcGVydGllcyk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnY2hpbGRyZW4nLCB7XHJcblxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihjaGlsZHJlbikge1xyXG5cclxuICAgICAgICAgIHZhciBpbnNlcnRDaGlsZHJlbiA9IF8uYmluZChHcm91cC5JbnNlcnRDaGlsZHJlbiwgdGhpcyk7XHJcbiAgICAgICAgICB2YXIgcmVtb3ZlQ2hpbGRyZW4gPSBfLmJpbmQoR3JvdXAuUmVtb3ZlQ2hpbGRyZW4sIHRoaXMpO1xyXG4gICAgICAgICAgdmFyIG9yZGVyQ2hpbGRyZW4gPSBfLmJpbmQoR3JvdXAuT3JkZXJDaGlsZHJlbiwgdGhpcyk7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2NoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkcmVuLnVuYmluZCgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX2NoaWxkcmVuID0gbmV3IENoaWxkcmVuKGNoaWxkcmVuKTtcclxuICAgICAgICAgIHRoaXMuX2NoaWxkcmVuLmJpbmQoVHdvLkV2ZW50cy5pbnNlcnQsIGluc2VydENoaWxkcmVuKTtcclxuICAgICAgICAgIHRoaXMuX2NoaWxkcmVuLmJpbmQoVHdvLkV2ZW50cy5yZW1vdmUsIHJlbW92ZUNoaWxkcmVuKTtcclxuICAgICAgICAgIHRoaXMuX2NoaWxkcmVuLmJpbmQoVHdvLkV2ZW50cy5vcmRlciwgb3JkZXJDaGlsZHJlbik7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ21hc2snLCB7XHJcblxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fbWFzaztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXMuX21hc2sgPSB2O1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ01hc2sgPSB0cnVlO1xyXG4gICAgICAgICAgaWYgKCF2LmNsaXApIHtcclxuICAgICAgICAgICAgdi5jbGlwID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIE1ha2VHZXR0ZXJTZXR0ZXJzOiBmdW5jdGlvbihncm91cCwgcHJvcGVydGllcykge1xyXG5cclxuICAgICAgaWYgKCFfLmlzQXJyYXkocHJvcGVydGllcykpIHtcclxuICAgICAgICBwcm9wZXJ0aWVzID0gW3Byb3BlcnRpZXNdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBfLmVhY2gocHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIEdyb3VwLk1ha2VHZXR0ZXJTZXR0ZXIoZ3JvdXAsIGspO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIE1ha2VHZXR0ZXJTZXR0ZXI6IGZ1bmN0aW9uKGdyb3VwLCBrKSB7XHJcblxyXG4gICAgICB2YXIgc2VjcmV0ID0gJ18nICsgaztcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShncm91cCwgaywge1xyXG5cclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXNbc2VjcmV0XTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXNbc2VjcmV0XSA9IHY7XHJcbiAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHsgLy8gVHJpY2tsZSBkb3duIHN0eWxlc1xyXG4gICAgICAgICAgICBjaGlsZFtrXSA9IHY7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChHcm91cC5wcm90b3R5cGUsIFR3by5TaGFwZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICAvLyBGbGFnc1xyXG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GbGFnXHJcblxyXG4gICAgX2ZsYWdBZGRpdGlvbnM6IGZhbHNlLFxyXG4gICAgX2ZsYWdTdWJ0cmFjdGlvbnM6IGZhbHNlLFxyXG4gICAgX2ZsYWdPcmRlcjogZmFsc2UsXHJcbiAgICBfZmxhZ09wYWNpdHk6IHRydWUsXHJcblxyXG4gICAgX2ZsYWdNYXNrOiBmYWxzZSxcclxuXHJcbiAgICAvLyBVbmRlcmx5aW5nIFByb3BlcnRpZXNcclxuXHJcbiAgICBfZmlsbDogJyNmZmYnLFxyXG4gICAgX3N0cm9rZTogJyMwMDAnLFxyXG4gICAgX2xpbmV3aWR0aDogMS4wLFxyXG4gICAgX29wYWNpdHk6IDEuMCxcclxuICAgIF92aXNpYmxlOiB0cnVlLFxyXG5cclxuICAgIF9jYXA6ICdyb3VuZCcsXHJcbiAgICBfam9pbjogJ3JvdW5kJyxcclxuICAgIF9taXRlcjogNCxcclxuXHJcbiAgICBfY2xvc2VkOiB0cnVlLFxyXG4gICAgX2N1cnZlZDogZmFsc2UsXHJcbiAgICBfYXV0b21hdGljOiB0cnVlLFxyXG4gICAgX2JlZ2lubmluZzogMCxcclxuICAgIF9lbmRpbmc6IDEuMCxcclxuXHJcbiAgICBfbWFzazogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRPRE86IEdyb3VwIGhhcyBhIGdvdGNoYSBpbiB0aGF0IGl0J3MgYXQgdGhlIG1vbWVudCByZXF1aXJlZCB0byBiZSBib3VuZCB0b1xyXG4gICAgICogYW4gaW5zdGFuY2Ugb2YgdHdvIGluIG9yZGVyIHRvIGFkZCBlbGVtZW50cyBjb3JyZWN0bHkuIFRoaXMgbmVlZHMgdG9cclxuICAgICAqIGJlIHJldGhvdWdodCBhbmQgZml4ZWQuXHJcbiAgICAgKi9cclxuICAgIGNsb25lOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuXHJcbiAgICAgIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIHZhciBncm91cCA9IG5ldyBHcm91cCgpO1xyXG4gICAgICB2YXIgY2hpbGRyZW4gPSBfLm1hcCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIHJldHVybiBjaGlsZC5jbG9uZShncm91cCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgZ3JvdXAuYWRkKGNoaWxkcmVuKTtcclxuXHJcbiAgICAgIGdyb3VwLm9wYWNpdHkgPSB0aGlzLm9wYWNpdHk7XHJcblxyXG4gICAgICBpZiAodGhpcy5tYXNrKSB7XHJcbiAgICAgICAgZ3JvdXAubWFzayA9IHRoaXMubWFzaztcclxuICAgICAgfVxyXG5cclxuICAgICAgZ3JvdXAudHJhbnNsYXRpb24uY29weSh0aGlzLnRyYW5zbGF0aW9uKTtcclxuICAgICAgZ3JvdXAucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uO1xyXG4gICAgICBncm91cC5zY2FsZSA9IHRoaXMuc2NhbGU7XHJcblxyXG4gICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50LmFkZChncm91cCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBncm91cDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhwb3J0IHRoZSBkYXRhIGZyb20gdGhlIGluc3RhbmNlIG9mIFR3by5Hcm91cCBpbnRvIGEgcGxhaW4gSmF2YVNjcmlwdFxyXG4gICAgICogb2JqZWN0LiBUaGlzIGFsc28gbWFrZXMgYWxsIGNoaWxkcmVuIHBsYWluIEphdmFTY3JpcHQgb2JqZWN0cy4gR3JlYXRcclxuICAgICAqIGZvciB0dXJuaW5nIGludG8gSlNPTiBhbmQgc3RvcmluZyBpbiBhIGRhdGFiYXNlLlxyXG4gICAgICovXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgIGNoaWxkcmVuOiBbXSxcclxuICAgICAgICB0cmFuc2xhdGlvbjogdGhpcy50cmFuc2xhdGlvbi50b09iamVjdCgpLFxyXG4gICAgICAgIHJvdGF0aW9uOiB0aGlzLnJvdGF0aW9uLFxyXG4gICAgICAgIHNjYWxlOiB0aGlzLnNjYWxlLFxyXG4gICAgICAgIG9wYWNpdHk6IHRoaXMub3BhY2l0eSxcclxuICAgICAgICBtYXNrOiAodGhpcy5tYXNrID8gdGhpcy5tYXNrLnRvT2JqZWN0KCkgOiBudWxsKVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkLCBpKSB7XHJcbiAgICAgICAgcmVzdWx0LmNoaWxkcmVuW2ldID0gY2hpbGQudG9PYmplY3QoKTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBbmNob3IgYWxsIGNoaWxkcmVuIHRvIHRoZSB1cHBlciBsZWZ0IGhhbmQgY29ybmVyXHJcbiAgICAgKiBvZiB0aGUgZ3JvdXAuXHJcbiAgICAgKi9cclxuICAgIGNvcm5lcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVjdCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRydWUpLFxyXG4gICAgICAgY29ybmVyID0geyB4OiByZWN0LmxlZnQsIHk6IHJlY3QudG9wIH07XHJcblxyXG4gICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBjaGlsZC50cmFuc2xhdGlvbi5zdWJTZWxmKGNvcm5lcik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFuY2hvcnMgYWxsIGNoaWxkcmVuIGFyb3VuZCB0aGUgY2VudGVyIG9mIHRoZSBncm91cCxcclxuICAgICAqIGVmZmVjdGl2ZWx5IHBsYWNpbmcgdGhlIHNoYXBlIGFyb3VuZCB0aGUgdW5pdCBjaXJjbGUuXHJcbiAgICAgKi9cclxuICAgIGNlbnRlcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVjdCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRydWUpO1xyXG5cclxuICAgICAgcmVjdC5jZW50cm9pZCA9IHtcclxuICAgICAgICB4OiByZWN0LmxlZnQgKyByZWN0LndpZHRoIC8gMixcclxuICAgICAgICB5OiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMlxyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgaWYgKGNoaWxkLmlzU2hhcGUpIHtcclxuICAgICAgICAgIGNoaWxkLnRyYW5zbGF0aW9uLnN1YlNlbGYocmVjdC5jZW50cm9pZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIHRoaXMudHJhbnNsYXRpb24uY29weShyZWN0LmNlbnRyb2lkKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWN1cnNpdmVseSBzZWFyY2ggZm9yIGlkLiBSZXR1cm5zIHRoZSBmaXJzdCBlbGVtZW50IGZvdW5kLlxyXG4gICAgICogUmV0dXJucyBudWxsIGlmIG5vbmUgZm91bmQuXHJcbiAgICAgKi9cclxuICAgIGdldEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xyXG4gICAgICB2YXIgc2VhcmNoID0gZnVuY3Rpb24gKG5vZGUsIGlkKSB7XHJcbiAgICAgICAgaWYgKG5vZGUuaWQgPT09IGlkKSB7XHJcbiAgICAgICAgICByZXR1cm4gbm9kZTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgIHZhciBpID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBmb3VuZCA9IHNlYXJjaChub2RlLmNoaWxkcmVuW2ldLCBpZCk7XHJcbiAgICAgICAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiBzZWFyY2godGhpcywgaWQpIHx8IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVjdXJzaXZlbHkgc2VhcmNoIGZvciBjbGFzc2VzLiBSZXR1cm5zIGFuIGFycmF5IG9mIG1hdGNoaW5nIGVsZW1lbnRzLlxyXG4gICAgICogRW1wdHkgYXJyYXkgaWYgbm9uZSBmb3VuZC5cclxuICAgICAqL1xyXG4gICAgZ2V0QnlDbGFzc05hbWU6IGZ1bmN0aW9uIChjbCkge1xyXG4gICAgICB2YXIgZm91bmQgPSBbXTtcclxuICAgICAgdmFyIHNlYXJjaCA9IGZ1bmN0aW9uIChub2RlLCBjbCkge1xyXG4gICAgICAgIGlmIChub2RlLmNsYXNzTGlzdC5pbmRleE9mKGNsKSAhPSAtMSkge1xyXG4gICAgICAgICAgZm91bmQucHVzaChub2RlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcclxuICAgICAgICAgICAgc2VhcmNoKGNoaWxkLCBjbCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZvdW5kO1xyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4gc2VhcmNoKHRoaXMsIGNsKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWN1cnNpdmVseSBzZWFyY2ggZm9yIGNoaWxkcmVuIG9mIGEgc3BlY2lmaWMgdHlwZSxcclxuICAgICAqIGUuZy4gVHdvLlBvbHlnb24uIFBhc3MgYSByZWZlcmVuY2UgdG8gdGhpcyB0eXBlIGFzIHRoZSBwYXJhbS5cclxuICAgICAqIFJldHVybnMgYW4gZW1wdHkgYXJyYXkgaWYgbm9uZSBmb3VuZC5cclxuICAgICAqL1xyXG4gICAgZ2V0QnlUeXBlOiBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgIHZhciBmb3VuZCA9IFtdO1xyXG4gICAgICB2YXIgc2VhcmNoID0gZnVuY3Rpb24gKG5vZGUsIHR5cGUpIHtcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiBub2RlLmNoaWxkcmVuKSB7XHJcbiAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbltpZF0gaW5zdGFuY2VvZiB0eXBlKSB7XHJcbiAgICAgICAgICAgIGZvdW5kLnB1c2gobm9kZS5jaGlsZHJlbltpZF0pO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChub2RlLmNoaWxkcmVuW2lkXSBpbnN0YW5jZW9mIFR3by5Hcm91cCkge1xyXG4gICAgICAgICAgICBzZWFyY2gobm9kZS5jaGlsZHJlbltpZF0sIHR5cGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZm91bmQ7XHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiBzZWFyY2godGhpcywgdHlwZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIG9iamVjdHMgdG8gdGhlIGdyb3VwLlxyXG4gICAgICovXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKG9iamVjdHMpIHtcclxuXHJcbiAgICAgIC8vIEFsbG93IHRvIHBhc3MgbXVsdGlwbGUgb2JqZWN0cyBlaXRoZXIgYXMgYXJyYXkgb3IgYXMgbXVsdGlwbGUgYXJndW1lbnRzXHJcbiAgICAgIC8vIElmIGl0J3MgYW4gYXJyYXkgYWxzbyBjcmVhdGUgY29weSBvZiBpdCBpbiBjYXNlIHdlJ3JlIGdldHRpbmcgcGFzc2VkXHJcbiAgICAgIC8vIGEgY2hpbGRyZW5zIGFycmF5IGRpcmVjdGx5LlxyXG4gICAgICBpZiAoIShvYmplY3RzIGluc3RhbmNlb2YgQXJyYXkpKSB7XHJcbiAgICAgICAgb2JqZWN0cyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG9iamVjdHMgPSBvYmplY3RzLnNsaWNlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFkZCB0aGUgb2JqZWN0c1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAoIShvYmplY3RzW2ldICYmIG9iamVjdHNbaV0uaWQpKSBjb250aW51ZTtcclxuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2gob2JqZWN0c1tpXSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgb2JqZWN0cyBmcm9tIHRoZSBncm91cC5cclxuICAgICAqL1xyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihvYmplY3RzKSB7XHJcblxyXG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGgsXHJcbiAgICAgICAgZ3JhbmRwYXJlbnQgPSB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIC8vIEFsbG93IHRvIGNhbGwgcmVtb3ZlIHdpdGhvdXQgYXJndW1lbnRzXHJcbiAgICAgIC8vIFRoaXMgd2lsbCBkZXRhY2ggdGhlIG9iamVjdCBmcm9tIHRoZSBzY2VuZS5cclxuICAgICAgaWYgKGwgPD0gMCAmJiBncmFuZHBhcmVudCkge1xyXG4gICAgICAgIGdyYW5kcGFyZW50LnJlbW92ZSh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQWxsb3cgdG8gcGFzcyBtdWx0aXBsZSBvYmplY3RzIGVpdGhlciBhcyBhcnJheSBvciBhcyBtdWx0aXBsZSBhcmd1bWVudHNcclxuICAgICAgLy8gSWYgaXQncyBhbiBhcnJheSBhbHNvIGNyZWF0ZSBjb3B5IG9mIGl0IGluIGNhc2Ugd2UncmUgZ2V0dGluZyBwYXNzZWRcclxuICAgICAgLy8gYSBjaGlsZHJlbnMgYXJyYXkgZGlyZWN0bHkuXHJcbiAgICAgIGlmICghKG9iamVjdHMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICBvYmplY3RzID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgb2JqZWN0cyA9IG9iamVjdHMuc2xpY2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gUmVtb3ZlIHRoZSBvYmplY3RzXHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICghb2JqZWN0c1tpXSB8fCAhKHRoaXMuY2hpbGRyZW4uaWRzW29iamVjdHNbaV0uaWRdKSkgY29udGludWU7XHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoXy5pbmRleE9mKHRoaXMuY2hpbGRyZW4sIG9iamVjdHNbaV0pLCAxKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBhbiBvYmplY3Qgd2l0aCB0b3AsIGxlZnQsIHJpZ2h0LCBib3R0b20sIHdpZHRoLCBhbmQgaGVpZ2h0XHJcbiAgICAgKiBwYXJhbWV0ZXJzIG9mIHRoZSBncm91cC5cclxuICAgICAqL1xyXG4gICAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiBmdW5jdGlvbihzaGFsbG93KSB7XHJcbiAgICAgIHZhciByZWN0O1xyXG5cclxuICAgICAgLy8gVE9ETzogVXBkYXRlIHRoaXMgdG8gbm90IF9fYWx3YXlzX18gdXBkYXRlLiBKdXN0IHdoZW4gaXQgbmVlZHMgdG8uXHJcbiAgICAgIHRoaXMuX3VwZGF0ZSh0cnVlKTtcclxuXHJcbiAgICAgIC8vIFZhcmlhYmxlcyBuZWVkIHRvIGJlIGRlZmluZWQgaGVyZSwgYmVjYXVzZSBvZiBuZXN0ZWQgbmF0dXJlIG9mIGdyb3Vwcy5cclxuICAgICAgdmFyIGxlZnQgPSBJbmZpbml0eSwgcmlnaHQgPSAtSW5maW5pdHksXHJcbiAgICAgICAgICB0b3AgPSBJbmZpbml0eSwgYm90dG9tID0gLUluZmluaXR5O1xyXG5cclxuICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XHJcblxyXG4gICAgICAgIGlmICgvKGxpbmVhci1ncmFkaWVudHxyYWRpYWwtZ3JhZGllbnR8Z3JhZGllbnQpLy50ZXN0KGNoaWxkLl9yZW5kZXJlci50eXBlKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVjdCA9IGNoaWxkLmdldEJvdW5kaW5nQ2xpZW50UmVjdChzaGFsbG93KTtcclxuXHJcbiAgICAgICAgaWYgKCFfLmlzTnVtYmVyKHJlY3QudG9wKSAgIHx8ICFfLmlzTnVtYmVyKHJlY3QubGVmdCkgICB8fFxyXG4gICAgICAgICAgICAhXy5pc051bWJlcihyZWN0LnJpZ2h0KSB8fCAhXy5pc051bWJlcihyZWN0LmJvdHRvbSkpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvcCA9IG1pbihyZWN0LnRvcCwgdG9wKTtcclxuICAgICAgICBsZWZ0ID0gbWluKHJlY3QubGVmdCwgbGVmdCk7XHJcbiAgICAgICAgcmlnaHQgPSBtYXgocmVjdC5yaWdodCwgcmlnaHQpO1xyXG4gICAgICAgIGJvdHRvbSA9IG1heChyZWN0LmJvdHRvbSwgYm90dG9tKTtcclxuXHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IHRvcCxcclxuICAgICAgICBsZWZ0OiBsZWZ0LFxyXG4gICAgICAgIHJpZ2h0OiByaWdodCxcclxuICAgICAgICBib3R0b206IGJvdHRvbSxcclxuICAgICAgICB3aWR0aDogcmlnaHQgLSBsZWZ0LFxyXG4gICAgICAgIGhlaWdodDogYm90dG9tIC0gdG9wXHJcbiAgICAgIH07XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyaWNrbGUgZG93biBvZiBub0ZpbGxcclxuICAgICAqL1xyXG4gICAgbm9GaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2hpbGQubm9GaWxsKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmlja2xlIGRvd24gb2Ygbm9TdHJva2VcclxuICAgICAqL1xyXG4gICAgbm9TdHJva2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBjaGlsZC5ub1N0cm9rZSgpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJpY2tsZSBkb3duIHN1YmRpdmlkZVxyXG4gICAgICovXHJcbiAgICBzdWJkaXZpZGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgY2hpbGQuc3ViZGl2aWRlLmFwcGx5KGNoaWxkLCBhcmdzKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdBZGRpdGlvbnMpIHtcclxuICAgICAgICB0aGlzLmFkZGl0aW9ucy5sZW5ndGggPSAwO1xyXG4gICAgICAgIHRoaXMuX2ZsYWdBZGRpdGlvbnMgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdTdWJ0cmFjdGlvbnMpIHtcclxuICAgICAgICB0aGlzLnN1YnRyYWN0aW9ucy5sZW5ndGggPSAwO1xyXG4gICAgICAgIHRoaXMuX2ZsYWdTdWJ0cmFjdGlvbnMgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fZmxhZ09yZGVyID0gdGhpcy5fZmxhZ01hc2sgPSB0aGlzLl9mbGFnT3BhY2l0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgVHdvLlNoYXBlLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIEdyb3VwLk1ha2VPYnNlcnZhYmxlKEdyb3VwLnByb3RvdHlwZSk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB1c2VkIHRvIHN5bmMgcGFyZW50LWNoaWxkIHJlbGF0aW9uc2hpcCB3aXRoaW4gdGhlXHJcbiAgICogYFR3by5Hcm91cC5jaGlsZHJlbmAgb2JqZWN0LlxyXG4gICAqXHJcbiAgICogU2V0IHRoZSBwYXJlbnQgb2YgdGhlIHBhc3NlZCBvYmplY3QgdG8gYW5vdGhlciBvYmplY3RcclxuICAgKiBhbmQgdXBkYXRlcyBwYXJlbnQtY2hpbGQgcmVsYXRpb25zaGlwc1xyXG4gICAqIENhbGxpbmcgd2l0aCBvbmUgYXJndW1lbnRzIHdpbGwgc2ltcGx5IHJlbW92ZSB0aGUgcGFyZW50aW5nXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcmVwbGFjZVBhcmVudChjaGlsZCwgbmV3UGFyZW50KSB7XHJcblxyXG4gICAgdmFyIHBhcmVudCA9IGNoaWxkLnBhcmVudDtcclxuICAgIHZhciBpbmRleDtcclxuXHJcbiAgICBpZiAocGFyZW50ID09PSBuZXdQYXJlbnQpIHtcclxuICAgICAgdGhpcy5hZGRpdGlvbnMucHVzaChjaGlsZCk7XHJcbiAgICAgIHRoaXMuX2ZsYWdBZGRpdGlvbnMgPSB0cnVlO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHBhcmVudCAmJiBwYXJlbnQuY2hpbGRyZW4uaWRzW2NoaWxkLmlkXSkge1xyXG5cclxuICAgICAgaW5kZXggPSBfLmluZGV4T2YocGFyZW50LmNoaWxkcmVuLCBjaGlsZCk7XHJcbiAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cclxuICAgICAgLy8gSWYgd2UncmUgcGFzc2luZyBmcm9tIG9uZSBwYXJlbnQgdG8gYW5vdGhlci4uLlxyXG4gICAgICBpbmRleCA9IF8uaW5kZXhPZihwYXJlbnQuYWRkaXRpb25zLCBjaGlsZCk7XHJcblxyXG4gICAgICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgICAgIHBhcmVudC5hZGRpdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXJlbnQuc3VidHJhY3Rpb25zLnB1c2goY2hpbGQpO1xyXG4gICAgICAgIHBhcmVudC5fZmxhZ1N1YnRyYWN0aW9ucyA9IHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG5ld1BhcmVudCkge1xyXG4gICAgICBjaGlsZC5wYXJlbnQgPSBuZXdQYXJlbnQ7XHJcbiAgICAgIHRoaXMuYWRkaXRpb25zLnB1c2goY2hpbGQpO1xyXG4gICAgICB0aGlzLl9mbGFnQWRkaXRpb25zID0gdHJ1ZTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIHdlJ3JlIHBhc3NpbmcgZnJvbSBvbmUgcGFyZW50IHRvIGFub3RoZXIuLi5cclxuICAgIGluZGV4ID0gXy5pbmRleE9mKHRoaXMuYWRkaXRpb25zLCBjaGlsZCk7XHJcblxyXG4gICAgaWYgKGluZGV4ID49IDApIHtcclxuICAgICAgdGhpcy5hZGRpdGlvbnMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuc3VidHJhY3Rpb25zLnB1c2goY2hpbGQpO1xyXG4gICAgICB0aGlzLl9mbGFnU3VidHJhY3Rpb25zID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBkZWxldGUgY2hpbGQucGFyZW50O1xyXG5cclxuICB9XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG4iLCJpbXBvcnQgKiBhcyBUd28gZnJvbSBcInR3by5qc1wiO1xuaW1wb3J0ICogYXMgU2ltcGxleE5vaXNlIGZyb20gXCJzaW1wbGV4LW5vaXNlXCI7XG5cbmNvbnN0IGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFwcFwiKTtcbmNvbnN0IHR3byA9IG5ldyBUd28oe1xuICB3aWR0aDogNzI0LFxuICBoZWlnaHQ6IDUxMixcbn0pLmFwcGVuZFRvKGVsZW0pO1xuXG5jb25zdCBub2lzZSA9IG5ldyBTaW1wbGV4Tm9pc2UoKTtcbmZ1bmN0aW9uIGdyYWRpZW50RGlyKHBvczogdHlwZW9mIFR3by5WZWN0b3IpIHtcbiAgY29uc3QgRVBTID0gMC4wMTtcbiAgY29uc3QgU0NBTEUgPSAwLjAwMztcbiAgY29uc3QgU1BFRUQgPSA1MDtcblxuICBjb25zdCBsID0gbm9pc2Uubm9pc2UyRChTQ0FMRSAqIHBvcy54IC0gRVBTLCBTQ0FMRSAqIHBvcy55KTtcbiAgY29uc3QgciA9IG5vaXNlLm5vaXNlMkQoU0NBTEUgKiBwb3MueCArIEVQUywgU0NBTEUgKiBwb3MueSk7XG4gIGNvbnN0IHUgPSBub2lzZS5ub2lzZTJEKFNDQUxFICogcG9zLngsIFNDQUxFICogcG9zLnkgKyBFUFMpO1xuICBjb25zdCBkID0gbm9pc2Uubm9pc2UyRChTQ0FMRSAqIHBvcy54LCBTQ0FMRSAqIHBvcy55IC0gRVBTKTtcblxuICByZXR1cm4gbmV3IFR3by5WZWN0b3IoLShyIC0gbCkgKiBTUEVFRCwgKHUgLSBkKSAqIFNQRUVEKTtcbn1cblxuY29uc3QgcGF0aHM6IHR5cGVvZiBUd28uUGF0aFtdID0gW107XG5mb3IgKGxldCBpID0gMDsgaSA8IDUwMDA7ICsraSkge1xuICBjb25zdCB4ID0gTWF0aC5yYW5kb20oKSAqIHR3by53aWR0aDtcbiAgY29uc3QgeSA9IE1hdGgucmFuZG9tKCkgKiB0d28uaGVpZ2h0O1xuXG4gIGxldCBwb3MgPSBuZXcgVHdvLlZlY3Rvcih4LCB5KTtcblxuICBjb25zdCBwb2ludHMgPSBbbmV3IFR3by5BbmNob3IocG9zLngsIHBvcy55KV07XG4gIGZvciAobGV0IGogPSAwOyBqIDwgNzsgKytqKSB7XG4gICAgcG9zLmFkZFNlbGYoZ3JhZGllbnREaXIocG9zKSk7XG4gICAgLy8gcG9zLmFkZFNlbGYobmV3IFR3by5WZWN0b3IoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSkubXVsdGlwbHlTY2FsYXIoMi4wKSk7XG4gICAgcG9pbnRzLnB1c2gobmV3IFR3by5BbmNob3IocG9zLngsIHBvcy55KSk7XG4gIH1cbiAgY29uc3QgcGF0aCA9IHR3by5tYWtlQ3VydmUocG9pbnRzLCB0cnVlKTtcbiAgcGF0aC5zdHJva2UgPSBcIiMyMjJcIjtcbiAgcGF0aC5saW5ld2lkdGggPSAxO1xuICBwYXRoLm5vRmlsbCgpO1xuXG4gIHBhdGhzLnB1c2gocGF0aCk7XG59XG50d28udXBkYXRlKCk7XG4iXX0=
