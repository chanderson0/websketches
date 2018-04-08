(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Two = require("two.js");
var elem = document.getElementById("app");
var two = new Two({
    width: 724,
    height: 512
}).appendTo(elem);
function normSin(v) {
    return Math.sin(v) * 0.5 + 0.5;
}
for (var x = 0; x < two.width; x += 10) {
    for (var y = 0; y < two.height; y += 10) {
        var dist = new Two.Vector(x, y).distanceTo(new Two.Vector(two.width / 2, two.height / 2));
        var normDist = dist / (Math.max(two.width, two.height) / 2.0);
        if (Math.pow(normDist, 2.0) > 0.4) {
            continue;
        }
        var r = normSin(Math.pow(Math.abs(x - two.width / 2.0) / 10, 3.1) +
            Math.pow(Math.abs(y - two.height / 2.0) / 10, 3.1)) * 10;
        if (r < 3) {
            continue;
        }
        var rect = two.makeCircle(x, y, r); //, normSin(x - y) * 10);
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

},{"two.js":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvdHdvLmpzL2J1aWxkL3R3by5qcyIsInNyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ3BnVUEsNEJBQThCO0FBRzlCLElBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUMsSUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDbEIsS0FBSyxFQUFFLEdBQUc7SUFDVixNQUFNLEVBQUUsR0FBRztDQUNaLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFbEIsaUJBQWlCLENBQVM7SUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztBQUNqQyxDQUFDO0FBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztJQUN2QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQ3hDLElBQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUMxQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FDOUMsQ0FBQztRQUNGLElBQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDaEUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNsQyxRQUFRLENBQUM7UUFDWCxDQUFDO1FBQ0QsSUFBTSxDQUFDLEdBQUcsT0FBTyxDQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDO1lBQ2pELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQ25ELEdBQUcsRUFBRSxDQUFDO1FBRVAsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDVixRQUFRLENBQUM7UUFDWCxDQUFDO1FBQ0QsSUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FDekIsQ0FBQyxFQUNELENBQUMsRUFDRCxDQUFDLENBQ0YsQ0FBQyxDQUFDLHlCQUF5QjtRQUM1Qiw2REFBNkQ7UUFDN0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2hCLENBQUM7QUFDSCxDQUFDO0FBQ0QsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRWIsb0NBQW9DO0FBQ3BDLGlEQUFpRDtBQUNqRCxzQkFBc0I7QUFDdEIseUJBQXlCO0FBQ3pCLHNCQUFzQjtBQUV0QixpRUFBaUU7QUFDakUsaUVBQWlFO0FBQ2pFLGlFQUFpRTtBQUNqRSxpRUFBaUU7QUFFakUsOERBQThEO0FBQzlELElBQUk7QUFFSix1Q0FBdUM7QUFDdkMsbUNBQW1DO0FBQ25DLHlDQUF5QztBQUN6QywwQ0FBMEM7QUFFMUMsb0NBQW9DO0FBRXBDLG1EQUFtRDtBQUNuRCxrQ0FBa0M7QUFDbEMscUNBQXFDO0FBQ3JDLHdGQUF3RjtBQUN4RixpREFBaUQ7QUFDakQsTUFBTTtBQUNOLDhDQUE4QztBQUM5QywwQkFBMEI7QUFDMUIsd0JBQXdCO0FBQ3hCLG1CQUFtQjtBQUVuQixzQkFBc0I7QUFDdEIsSUFBSTtBQUNKLGdCQUFnQjtBQUVoQixzQkFBc0IsSUFBWSxFQUFFLFFBQWdCO0lBQ2xELElBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDekIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2YsQ0FBQztBQUVEO0lBQ0UsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFBQyxNQUFNLENBQUM7SUFFbEIsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3QixHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNuQyxHQUFHLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBRXhELElBQU0sSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUMsSUFBSSxFQUFDLDZCQUE2QixFQUFDLENBQUMsQ0FBQztJQUM3RSxJQUFNLElBQUksR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLFlBQVksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQUVEO0lBQ0UsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFBQyxNQUFNLENBQUM7SUFFbEIsSUFBTSxPQUFPLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEUsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUMzQyxNQUFNLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDN0IsTUFBTSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBRS9CLElBQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7UUFBQyxNQUFNLENBQUM7SUFFakIsSUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSw0QkFBNEIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUV0RSxHQUFHLENBQUMsTUFBTSxHQUFHO1FBQ1gsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXpCLFlBQVksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQzdELENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFVBQUEsQ0FBQztJQUNuQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakIsV0FBVyxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEIsV0FBVyxFQUFFLENBQUM7SUFDaEIsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxyXG4gKiB0d28uanNcclxuICogYSB0d28tZGltZW5zaW9uYWwgZHJhd2luZyBhcGkgbWVhbnQgZm9yIG1vZGVybiBicm93c2Vycy4gSXQgaXMgcmVuZGVyZXJcclxuICogYWdub3N0aWMgZW5hYmxpbmcgdGhlIHNhbWUgYXBpIGZvciByZW5kZXJpbmcgaW4gbXVsdGlwbGUgY29udGV4dHM6IHdlYmdsLFxyXG4gKiBjYW52YXMyZCwgYW5kIHN2Zy5cclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDEyIC0gMjAxNyBqb25vYnIxIC8gaHR0cDovL2pvbm9icjEuY29tXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXHJcbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXHJcbiAqIFRIRSBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG50aGlzLlR3byA9IChmdW5jdGlvbihwcmV2aW91c1R3bykge1xyXG5cclxuICB2YXIgcm9vdCA9IHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0eXBlb2YgZ2xvYmFsICE9ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogbnVsbDtcclxuICB2YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xyXG4gIHZhciBfID0ge1xyXG4gICAgLy8gaHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvIOKAoiAxLjguM1xyXG4gICAgX2luZGV4QW1vdW50OiAwLFxyXG4gICAgbmF0dXJhbDoge1xyXG4gICAgICBzbGljZTogQXJyYXkucHJvdG90eXBlLnNsaWNlLFxyXG4gICAgICBpbmRleE9mOiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZixcclxuICAgICAga2V5czogT2JqZWN0LmtleXMsXHJcbiAgICAgIGJpbmQ6IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLFxyXG4gICAgICBjcmVhdGU6IE9iamVjdC5jcmVhdGVcclxuICAgIH0sXHJcbiAgICBpZGVudGl0eTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfSxcclxuICAgIGlzQXJndW1lbnRzOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XHJcbiAgICB9LFxyXG4gICAgaXNGdW5jdGlvbjogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XHJcbiAgICB9LFxyXG4gICAgaXNTdHJpbmc6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBTdHJpbmddJztcclxuICAgIH0sXHJcbiAgICBpc051bWJlcjogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE51bWJlcl0nO1xyXG4gICAgfSxcclxuICAgIGlzRGF0ZTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IERhdGVdJztcclxuICAgIH0sXHJcbiAgICBpc1JlZ0V4cDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xyXG4gICAgfSxcclxuICAgIGlzRXJyb3I6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBFcnJvcl0nO1xyXG4gICAgfSxcclxuICAgIGlzRmluaXRlOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XHJcbiAgICB9LFxyXG4gICAgaXNOYU46IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gXy5pc051bWJlcihvYmopICYmIG9iaiAhPT0gK29iajtcclxuICAgIH0sXHJcbiAgICBpc0Jvb2xlYW46IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBCb29sZWFuXSc7XHJcbiAgICB9LFxyXG4gICAgaXNOdWxsOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcclxuICAgIH0sXHJcbiAgICBpc1VuZGVmaW5lZDogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcclxuICAgIH0sXHJcbiAgICBpc0VtcHR5OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgaWYgKGlzQXJyYXlMaWtlICYmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikgfHwgXy5pc0FyZ3VtZW50cyhvYmopKSkgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XHJcbiAgICAgIHJldHVybiBfLmtleXMob2JqKS5sZW5ndGggPT09IDA7XHJcbiAgICB9LFxyXG4gICAgaXNFbGVtZW50OiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xyXG4gICAgfSxcclxuICAgIGlzQXJyYXk6IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XHJcbiAgICB9LFxyXG4gICAgaXNPYmplY3Q6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmo7XHJcbiAgICAgIHJldHVybiB0eXBlID09PSAnZnVuY3Rpb24nIHx8IHR5cGUgPT09ICdvYmplY3QnICYmICEhb2JqO1xyXG4gICAgfSxcclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICBpZiAoIW9iaikge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoXy5pc0FycmF5KG9iaikpIHtcclxuICAgICAgICByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChpc0FycmF5TGlrZShvYmopKSB7XHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XHJcbiAgICB9LFxyXG4gICAgcmFuZ2U6IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XHJcbiAgICAgIGlmIChzdG9wID09IG51bGwpIHtcclxuICAgICAgICBzdG9wID0gc3RhcnQgfHwgMDtcclxuICAgICAgICBzdGFydCA9IDA7XHJcbiAgICAgIH1cclxuICAgICAgc3RlcCA9IHN0ZXAgfHwgMTtcclxuXHJcbiAgICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKSwgMCk7XHJcbiAgICAgIHZhciByYW5nZSA9IEFycmF5KGxlbmd0aCk7XHJcblxyXG4gICAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCBsZW5ndGg7IGlkeCsrLCBzdGFydCArPSBzdGVwKSB7XHJcbiAgICAgICAgcmFuZ2VbaWR4XSA9IHN0YXJ0O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcmFuZ2U7XHJcbiAgICB9LFxyXG4gICAgaW5kZXhPZjogZnVuY3Rpb24obGlzdCwgaXRlbSkge1xyXG4gICAgICBpZiAoISFfLm5hdHVyYWwuaW5kZXhPZikge1xyXG4gICAgICAgIHJldHVybiBfLm5hdHVyYWwuaW5kZXhPZi5jYWxsKGxpc3QsIGl0ZW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChsaXN0W2ldID09PSBpdGVtKSB7XHJcbiAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIC0xO1xyXG4gICAgfSxcclxuICAgIGhhczogZnVuY3Rpb24ob2JqLCBrZXkpIHtcclxuICAgICAgcmV0dXJuIG9iaiAhPSBudWxsICYmIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xyXG4gICAgfSxcclxuICAgIGJpbmQ6IGZ1bmN0aW9uKGZ1bmMsIGN0eCkge1xyXG4gICAgICB2YXIgbmF0dXJhbCA9IF8ubmF0dXJhbC5iaW5kO1xyXG4gICAgICBpZiAobmF0dXJhbCAmJiBmdW5jLmJpbmQgPT09IG5hdHVyYWwpIHtcclxuICAgICAgICByZXR1cm4gbmF0dXJhbC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgZnVuYy5hcHBseShjdHgsIGFyZ3MpO1xyXG4gICAgICB9O1xyXG4gICAgfSxcclxuICAgIGV4dGVuZDogZnVuY3Rpb24oYmFzZSkge1xyXG4gICAgICB2YXIgc291cmNlcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3VyY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIG9iaiA9IHNvdXJjZXNbaV07XHJcbiAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcclxuICAgICAgICAgIGJhc2Vba10gPSBvYmpba107XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBiYXNlO1xyXG4gICAgfSxcclxuICAgIGRlZmF1bHRzOiBmdW5jdGlvbihiYXNlKSB7XHJcbiAgICAgIHZhciBzb3VyY2VzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgb2JqID0gc291cmNlc1tpXTtcclxuICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xyXG4gICAgICAgICAgaWYgKGJhc2Vba10gPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICBiYXNlW2tdID0gb2JqW2tdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYmFzZTtcclxuICAgIH0sXHJcbiAgICBrZXlzOiBmdW5jdGlvbihvYmopIHtcclxuICAgICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF8ubmF0dXJhbC5rZXlzKSB7XHJcbiAgICAgICAgcmV0dXJuIF8ubmF0dXJhbC5rZXlzKG9iaik7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIGtleXMgPSBbXTtcclxuICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcclxuICAgICAgICBpZiAoXy5oYXMob2JqLCBrKSkge1xyXG4gICAgICAgICAga2V5cy5wdXNoKGspO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ga2V5cztcclxuICAgIH0sXHJcbiAgICB2YWx1ZXM6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xyXG4gICAgICB2YXIgdmFsdWVzID0gW107XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBrID0ga2V5c1tpXTtcclxuICAgICAgICB2YWx1ZXMucHVzaChvYmpba10pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB2YWx1ZXM7XHJcbiAgICB9LFxyXG4gICAgZWFjaDogZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xyXG4gICAgICB2YXIgY3R4ID0gY29udGV4dCB8fCB0aGlzO1xyXG4gICAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopO1xyXG4gICAgICB2YXIgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGg7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgayA9IGtleXMgPyBrZXlzW2ldIDogaTtcclxuICAgICAgICBpdGVyYXRlZS5jYWxsKGN0eCwgb2JqW2tdLCBrLCBvYmopO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9LFxyXG4gICAgbWFwOiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XHJcbiAgICAgIHZhciBjdHggPSBjb250ZXh0IHx8IHRoaXM7XHJcbiAgICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaik7XHJcbiAgICAgIHZhciBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aDtcclxuICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGsgPSBrZXlzID8ga2V5c1tpXSA6IGk7XHJcbiAgICAgICAgcmVzdWx0W2ldID0gaXRlcmF0ZWUuY2FsbChjdHgsIG9ialtrXSwgaywgb2JqKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSxcclxuICAgIG9uY2U6IGZ1bmN0aW9uKGZ1bmMpIHtcclxuICAgICAgdmFyIGluaXQgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICghIWluaXQpIHtcclxuICAgICAgICAgIHJldHVybiBmdW5jO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbml0ID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICB3aGlsZSAoLS10aW1lcyA8IDEpIHtcclxuICAgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgdW5pcXVlSWQ6IGZ1bmN0aW9uKHByZWZpeCkge1xyXG4gICAgICB2YXIgaWQgPSArK18uX2luZGV4QW1vdW50ICsgJyc7XHJcbiAgICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0YW50c1xyXG4gICAqL1xyXG5cclxuICB2YXIgc2luID0gTWF0aC5zaW4sXHJcbiAgICBjb3MgPSBNYXRoLmNvcyxcclxuICAgIGF0YW4yID0gTWF0aC5hdGFuMixcclxuICAgIHNxcnQgPSBNYXRoLnNxcnQsXHJcbiAgICByb3VuZCA9IE1hdGgucm91bmQsXHJcbiAgICBhYnMgPSBNYXRoLmFicyxcclxuICAgIFBJID0gTWF0aC5QSSxcclxuICAgIFRXT19QSSA9IFBJICogMixcclxuICAgIEhBTEZfUEkgPSBQSSAvIDIsXHJcbiAgICBwb3cgPSBNYXRoLnBvdyxcclxuICAgIG1pbiA9IE1hdGgubWluLFxyXG4gICAgbWF4ID0gTWF0aC5tYXg7XHJcblxyXG4gIC8qKlxyXG4gICAqIExvY2FsaXplZCB2YXJpYWJsZXNcclxuICAgKi9cclxuXHJcbiAgdmFyIGNvdW50ID0gMDtcclxuICB2YXIgc2xpY2UgPSBfLm5hdHVyYWwuc2xpY2U7XHJcbiAgdmFyIHBlcmYgPSAoKHJvb3QucGVyZm9ybWFuY2UgJiYgcm9vdC5wZXJmb3JtYW5jZS5ub3cpID8gcm9vdC5wZXJmb3JtYW5jZSA6IERhdGUpO1xyXG4gIHZhciBNQVhfQVJSQVlfSU5ERVggPSBNYXRoLnBvdygyLCA1MykgLSAxO1xyXG4gIHZhciBnZXRMZW5ndGggPSBmdW5jdGlvbihvYmopIHtcclxuICAgIHJldHVybiBvYmogPT0gbnVsbCA/IHZvaWQgMCA6IG9ialsnbGVuZ3RoJ107XHJcbiAgfTtcclxuICB2YXIgaXNBcnJheUxpa2UgPSBmdW5jdGlvbihjb2xsZWN0aW9uKSB7XHJcbiAgICB2YXIgbGVuZ3RoID0gZ2V0TGVuZ3RoKGNvbGxlY3Rpb24pO1xyXG4gICAgcmV0dXJuIHR5cGVvZiBsZW5ndGggPT0gJ251bWJlcicgJiYgbGVuZ3RoID49IDAgJiYgbGVuZ3RoIDw9IE1BWF9BUlJBWV9JTkRFWDtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDcm9zcyBicm93c2VyIGRvbSBldmVudHMuXHJcbiAgICovXHJcbiAgdmFyIGRvbSA9IHtcclxuXHJcbiAgICB0ZW1wOiAocm9vdC5kb2N1bWVudCA/IHJvb3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykgOiB7fSksXHJcblxyXG4gICAgaGFzRXZlbnRMaXN0ZW5lcnM6IF8uaXNGdW5jdGlvbihyb290LmFkZEV2ZW50TGlzdGVuZXIpLFxyXG5cclxuICAgIGJpbmQ6IGZ1bmN0aW9uKGVsZW0sIGV2ZW50LCBmdW5jLCBib29sKSB7XHJcbiAgICAgIGlmICh0aGlzLmhhc0V2ZW50TGlzdGVuZXJzKSB7XHJcbiAgICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jLCAhIWJvb2wpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0uYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBmdW5jKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZG9tO1xyXG4gICAgfSxcclxuXHJcbiAgICB1bmJpbmQ6IGZ1bmN0aW9uKGVsZW0sIGV2ZW50LCBmdW5jLCBib29sKSB7XHJcbiAgICAgIGlmIChkb20uaGFzRXZlbnRMaXN0ZW5lcnMpIHtcclxuICAgICAgICBlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXJzKGV2ZW50LCBmdW5jLCAhIWJvb2wpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGVsZW0uZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBmdW5jKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZG9tO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGxhc3RUaW1lID0gMDtcclxuICAgICAgdmFyIHZlbmRvcnMgPSBbJ21zJywgJ21veicsICd3ZWJraXQnLCAnbyddO1xyXG4gICAgICB2YXIgcmVxdWVzdCA9IHJvb3QucmVxdWVzdEFuaW1hdGlvbkZyYW1lLCBjYW5jZWw7XHJcblxyXG4gICAgICBpZighcmVxdWVzdCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmVuZG9ycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgcmVxdWVzdCA9IHJvb3RbdmVuZG9yc1tpXSArICdSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSB8fCByZXF1ZXN0O1xyXG4gICAgICAgICAgY2FuY2VsID0gcm9vdFt2ZW5kb3JzW2ldICsgJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cclxuICAgICAgICAgICAgfHwgcm9vdFt2ZW5kb3JzW2ldICsgJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddIHx8IGNhbmNlbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlcXVlc3QgPSByZXF1ZXN0IHx8IGZ1bmN0aW9uKGNhbGxiYWNrLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xyXG4gICAgICAgICAgdmFyIGlkID0gcm9vdC5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayhjdXJyVGltZSArIHRpbWVUb0NhbGwpOyB9LCB0aW1lVG9DYWxsKTtcclxuICAgICAgICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xyXG4gICAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy8gY2FuY2VsID0gY2FuY2VsIHx8IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgLy8gICBjbGVhclRpbWVvdXQoaWQpO1xyXG4gICAgICAgIC8vIH07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJlcXVlc3QuaW5pdCA9IF8ub25jZShsb29wKTtcclxuXHJcbiAgICAgIHJldHVybiByZXF1ZXN0O1xyXG5cclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQGNsYXNzXHJcbiAgICovXHJcbiAgdmFyIFR3byA9IHJvb3QuVHdvID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG5cclxuICAgIC8vIERldGVybWluZSB3aGF0IFJlbmRlcmVyIHRvIHVzZSBhbmQgc2V0dXAgYSBzY2VuZS5cclxuXHJcbiAgICB2YXIgcGFyYW1zID0gXy5kZWZhdWx0cyhvcHRpb25zIHx8IHt9LCB7XHJcbiAgICAgIGZ1bGxzY3JlZW46IGZhbHNlLFxyXG4gICAgICB3aWR0aDogNjQwLFxyXG4gICAgICBoZWlnaHQ6IDQ4MCxcclxuICAgICAgdHlwZTogVHdvLlR5cGVzLnN2ZyxcclxuICAgICAgYXV0b3N0YXJ0OiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgXy5lYWNoKHBhcmFtcywgZnVuY3Rpb24odiwgaykge1xyXG4gICAgICBpZiAoayA9PT0gJ2Z1bGxzY3JlZW4nIHx8IGsgPT09ICdhdXRvc3RhcnQnKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXNba10gPSB2O1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgLy8gU3BlY2lmaWVkIGRvbUVsZW1lbnQgb3ZlcnJpZGVzIHR5cGUgZGVjbGFyYXRpb24gb25seSBpZiB0aGUgZWxlbWVudCBkb2VzIG5vdCBzdXBwb3J0IGRlY2xhcmVkIHJlbmRlcmVyIHR5cGUuXHJcbiAgICBpZiAoXy5pc0VsZW1lbnQocGFyYW1zLmRvbUVsZW1lbnQpKSB7XHJcbiAgICAgIHZhciB0YWdOYW1lID0gcGFyYW1zLmRvbUVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAvLyBUT0RPOiBSZWNvbnNpZGVyIHRoaXMgaWYgc3RhdGVtZW50J3MgbG9naWMuXHJcbiAgICAgIGlmICghL14oQ2FudmFzUmVuZGVyZXItY2FudmFzfFdlYkdMUmVuZGVyZXItY2FudmFzfFNWR1JlbmRlcmVyLXN2ZykkLy50ZXN0KHRoaXMudHlwZSsnLScrdGFnTmFtZSkpIHtcclxuICAgICAgICB0aGlzLnR5cGUgPSBUd28uVHlwZXNbdGFnTmFtZV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFR3b1t0aGlzLnR5cGVdKHRoaXMpO1xyXG4gICAgVHdvLlV0aWxzLnNldFBsYXlpbmcuY2FsbCh0aGlzLCBwYXJhbXMuYXV0b3N0YXJ0KTtcclxuICAgIHRoaXMuZnJhbWVDb3VudCA9IDA7XHJcblxyXG4gICAgaWYgKHBhcmFtcy5mdWxsc2NyZWVuKSB7XHJcblxyXG4gICAgICB2YXIgZml0dGVkID0gXy5iaW5kKGZpdFRvV2luZG93LCB0aGlzKTtcclxuICAgICAgXy5leHRlbmQoZG9jdW1lbnQuYm9keS5zdHlsZSwge1xyXG4gICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcclxuICAgICAgICBtYXJnaW46IDAsXHJcbiAgICAgICAgcGFkZGluZzogMCxcclxuICAgICAgICB0b3A6IDAsXHJcbiAgICAgICAgbGVmdDogMCxcclxuICAgICAgICByaWdodDogMCxcclxuICAgICAgICBib3R0b206IDAsXHJcbiAgICAgICAgcG9zaXRpb246ICdmaXhlZCdcclxuICAgICAgfSk7XHJcbiAgICAgIF8uZXh0ZW5kKHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudC5zdHlsZSwge1xyXG4gICAgICAgIGRpc3BsYXk6ICdibG9jaycsXHJcbiAgICAgICAgdG9wOiAwLFxyXG4gICAgICAgIGxlZnQ6IDAsXHJcbiAgICAgICAgcmlnaHQ6IDAsXHJcbiAgICAgICAgYm90dG9tOiAwLFxyXG4gICAgICAgIHBvc2l0aW9uOiAnZml4ZWQnXHJcbiAgICAgIH0pO1xyXG4gICAgICBkb20uYmluZChyb290LCAncmVzaXplJywgZml0dGVkKTtcclxuICAgICAgZml0dGVkKCk7XHJcblxyXG5cclxuICAgIH0gZWxzZSBpZiAoIV8uaXNFbGVtZW50KHBhcmFtcy5kb21FbGVtZW50KSkge1xyXG5cclxuICAgICAgdGhpcy5yZW5kZXJlci5zZXRTaXplKHBhcmFtcy53aWR0aCwgcGFyYW1zLmhlaWdodCwgdGhpcy5yYXRpbyk7XHJcbiAgICAgIHRoaXMud2lkdGggPSBwYXJhbXMud2lkdGg7XHJcbiAgICAgIHRoaXMuaGVpZ2h0ID0gcGFyYW1zLmhlaWdodDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zY2VuZSA9IHRoaXMucmVuZGVyZXIuc2NlbmU7XHJcblxyXG4gICAgVHdvLkluc3RhbmNlcy5wdXNoKHRoaXMpO1xyXG4gICAgcmFmLmluaXQoKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoVHdvLCB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBY2Nlc3MgdG8gcm9vdCBpbiBvdGhlciBmaWxlcy5cclxuICAgICAqL1xyXG5cclxuICAgIHJvb3Q6IHJvb3QsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQcmltaXRpdmVcclxuICAgICAqL1xyXG5cclxuICAgIEFycmF5OiByb290LkZsb2F0MzJBcnJheSB8fCBBcnJheSxcclxuXHJcbiAgICBUeXBlczoge1xyXG4gICAgICB3ZWJnbDogJ1dlYkdMUmVuZGVyZXInLFxyXG4gICAgICBzdmc6ICdTVkdSZW5kZXJlcicsXHJcbiAgICAgIGNhbnZhczogJ0NhbnZhc1JlbmRlcmVyJ1xyXG4gICAgfSxcclxuXHJcbiAgICBWZXJzaW9uOiAndjAuNy4wLWFscGhhLjEnLFxyXG5cclxuICAgIElkZW50aWZpZXI6ICd0d29fJyxcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiB7XHJcbiAgICAgIGhpZXJhcmNoeTogJ2hpZXJhcmNoeScsXHJcbiAgICAgIGRlbW90aW9uOiAnZGVtb3Rpb24nXHJcbiAgICB9LFxyXG5cclxuICAgIEV2ZW50czoge1xyXG4gICAgICBwbGF5OiAncGxheScsXHJcbiAgICAgIHBhdXNlOiAncGF1c2UnLFxyXG4gICAgICB1cGRhdGU6ICd1cGRhdGUnLFxyXG4gICAgICByZW5kZXI6ICdyZW5kZXInLFxyXG4gICAgICByZXNpemU6ICdyZXNpemUnLFxyXG4gICAgICBjaGFuZ2U6ICdjaGFuZ2UnLFxyXG4gICAgICByZW1vdmU6ICdyZW1vdmUnLFxyXG4gICAgICBpbnNlcnQ6ICdpbnNlcnQnLFxyXG4gICAgICBvcmRlcjogJ29yZGVyJyxcclxuICAgICAgbG9hZDogJ2xvYWQnXHJcbiAgICB9LFxyXG5cclxuICAgIENvbW1hbmRzOiB7XHJcbiAgICAgIG1vdmU6ICdNJyxcclxuICAgICAgbGluZTogJ0wnLFxyXG4gICAgICBjdXJ2ZTogJ0MnLFxyXG4gICAgICBjbG9zZTogJ1onXHJcbiAgICB9LFxyXG5cclxuICAgIFJlc29sdXRpb246IDgsXHJcblxyXG4gICAgSW5zdGFuY2VzOiBbXSxcclxuXHJcbiAgICBub0NvbmZsaWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcm9vdC5Ud28gPSBwcmV2aW91c1R3bztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHVuaXF1ZUlkOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGlkID0gY291bnQ7XHJcbiAgICAgIGNvdW50Kys7XHJcbiAgICAgIHJldHVybiBpZDtcclxuICAgIH0sXHJcblxyXG4gICAgVXRpbHM6IF8uZXh0ZW5kKF8sIHtcclxuXHJcbiAgICAgIHBlcmZvcm1hbmNlOiBwZXJmLFxyXG5cclxuICAgICAgZGVmaW5lUHJvcGVydHk6IGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcblxyXG4gICAgICAgIHZhciBvYmplY3QgPSB0aGlzO1xyXG4gICAgICAgIHZhciBzZWNyZXQgPSAnXycgKyBwcm9wZXJ0eTtcclxuICAgICAgICB2YXIgZmxhZyA9ICdfZmxhZycgKyBwcm9wZXJ0eS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnNsaWNlKDEpO1xyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCBwcm9wZXJ0eSwge1xyXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3NlY3JldF07XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICAgIHRoaXNbc2VjcmV0XSA9IHY7XHJcbiAgICAgICAgICAgIHRoaXNbZmxhZ10gPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBSZWxlYXNlIGFuIGFyYml0cmFyeSBjbGFzcycgZXZlbnRzIGZyb20gdGhlIHR3by5qcyBjb3JwdXMgYW5kIHJlY3Vyc2VcclxuICAgICAgICogdGhyb3VnaCBpdHMgY2hpbGRyZW4gYW5kIG9yIHZlcnRpY2VzLlxyXG4gICAgICAgKi9cclxuICAgICAgcmVsZWFzZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICAgIGlmICghXy5pc09iamVjdChvYmopKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9iai51bmJpbmQpKSB7XHJcbiAgICAgICAgICBvYmoudW5iaW5kKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob2JqLnZlcnRpY2VzKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9iai52ZXJ0aWNlcy51bmJpbmQpKSB7XHJcbiAgICAgICAgICAgIG9iai52ZXJ0aWNlcy51bmJpbmQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIF8uZWFjaChvYmoudmVydGljZXMsIGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih2LnVuYmluZCkpIHtcclxuICAgICAgICAgICAgICB2LnVuYmluZCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvYmouY2hpbGRyZW4pIHtcclxuICAgICAgICAgIF8uZWFjaChvYmouY2hpbGRyZW4sIGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgICAgICBUd28uVXRpbHMucmVsZWFzZShvYmopO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIHhocjogZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgIHhoci5vcGVuKCdHRVQnLCBwYXRoKTtcclxuXHJcbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0ICYmIHhoci5zdGF0dXMgPT09IDIwMCkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayh4aHIucmVzcG9uc2VUZXh0KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB4aHIuc2VuZCgpO1xyXG4gICAgICAgIHJldHVybiB4aHI7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgQ3VydmU6IHtcclxuXHJcbiAgICAgICAgQ29sbGluZWFyaXR5RXBzaWxvbjogcG93KDEwLCAtMzApLFxyXG5cclxuICAgICAgICBSZWN1cnNpb25MaW1pdDogMTYsXHJcblxyXG4gICAgICAgIEN1c3BMaW1pdDogMCxcclxuXHJcbiAgICAgICAgVG9sZXJhbmNlOiB7XHJcbiAgICAgICAgICBkaXN0YW5jZTogMC4yNSxcclxuICAgICAgICAgIGFuZ2xlOiAwLFxyXG4gICAgICAgICAgZXBzaWxvbjogMC4wMVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIExvb2t1cCB0YWJsZXMgZm9yIGFic2Npc3NhcyBhbmQgd2VpZ2h0cyB3aXRoIHZhbHVlcyBmb3IgbiA9IDIgLi4gMTYuXHJcbiAgICAgICAgLy8gQXMgdmFsdWVzIGFyZSBzeW1tZXRyaWMsIG9ubHkgc3RvcmUgaGFsZiBvZiB0aGVtIGFuZCBhZGFwdCBhbGdvcml0aG1cclxuICAgICAgICAvLyB0byBmYWN0b3IgaW4gc3ltbWV0cnkuXHJcbiAgICAgICAgYWJzY2lzc2FzOiBbXHJcbiAgICAgICAgICBbICAwLjU3NzM1MDI2OTE4OTYyNTc2NDUwOTE0ODhdLFxyXG4gICAgICAgICAgWzAsMC43NzQ1OTY2NjkyNDE0ODMzNzcwMzU4NTMxXSxcclxuICAgICAgICAgIFsgIDAuMzM5OTgxMDQzNTg0ODU2MjY0ODAyNjY1OCwwLjg2MTEzNjMxMTU5NDA1MjU3NTIyMzk0NjVdLFxyXG4gICAgICAgICAgWzAsMC41Mzg0NjkzMTAxMDU2ODMwOTEwMzYzMTQ0LDAuOTA2MTc5ODQ1OTM4NjYzOTkyNzk3NjI2OV0sXHJcbiAgICAgICAgICBbICAwLjIzODYxOTE4NjA4MzE5NjkwODYzMDUwMTcsMC42NjEyMDkzODY0NjYyNjQ1MTM2NjEzOTk2LDAuOTMyNDY5NTE0MjAzMTUyMDI3ODEyMzAxNl0sXHJcbiAgICAgICAgICBbMCwwLjQwNTg0NTE1MTM3NzM5NzE2NjkwNjYwNjQsMC43NDE1MzExODU1OTkzOTQ0Mzk4NjM4NjQ4LDAuOTQ5MTA3OTEyMzQyNzU4NTI0NTI2MTg5N10sXHJcbiAgICAgICAgICBbICAwLjE4MzQzNDY0MjQ5NTY0OTgwNDkzOTQ3NjEsMC41MjU1MzI0MDk5MTYzMjg5ODU4MTc3MzkwLDAuNzk2NjY2NDc3NDEzNjI2NzM5NTkxNTUzOSwwLjk2MDI4OTg1NjQ5NzUzNjIzMTY4MzU2MDldLFxyXG4gICAgICAgICAgWzAsMC4zMjQyNTM0MjM0MDM4MDg5MjkwMzg1MzgwLDAuNjEzMzcxNDMyNzAwNTkwMzk3MzA4NzAyMCwwLjgzNjAzMTEwNzMyNjYzNTc5NDI5OTQyOTgsMC45NjgxNjAyMzk1MDc2MjYwODk4MzU1NzYyXSxcclxuICAgICAgICAgIFsgIDAuMTQ4ODc0MzM4OTgxNjMxMjEwODg0ODI2MCwwLjQzMzM5NTM5NDEyOTI0NzE5MDc5OTI2NTksMC42Nzk0MDk1NjgyOTkwMjQ0MDYyMzQzMjc0LDAuODY1MDYzMzY2Njg4OTg0NTEwNzMyMDk2NywwLjk3MzkwNjUyODUxNzE3MTcyMDA3Nzk2NDBdLFxyXG4gICAgICAgICAgWzAsMC4yNjk1NDMxNTU5NTIzNDQ5NzIzMzE1MzIwLDAuNTE5MDk2MTI5MjA2ODExODE1OTI1NzI1NywwLjczMDE1MjAwNTU3NDA0OTMyNDA5MzQxNjMsMC44ODcwNjI1OTk3NjgwOTUyOTkwNzUxNTc4LDAuOTc4MjI4NjU4MTQ2MDU2OTkyODAzOTM4MF0sXHJcbiAgICAgICAgICBbICAwLjEyNTIzMzQwODUxMTQ2ODkxNTQ3MjQ0MTQsMC4zNjc4MzE0OTg5OTgxODAxOTM3NTI2OTE1LDAuNTg3MzE3OTU0Mjg2NjE3NDQ3Mjk2NzAyNCwwLjc2OTkwMjY3NDE5NDMwNDY4NzAzNjg5MzgsMC45MDQxMTcyNTYzNzA0NzQ4NTY2Nzg0NjU5LDAuOTgxNTYwNjM0MjQ2NzE5MjUwNjkwNTQ5MV0sXHJcbiAgICAgICAgICBbMCwwLjIzMDQ1ODMxNTk1NTEzNDc5NDA2NTUyODEsMC40NDg0OTI3NTEwMzY0NDY4NTI4Nzc5MTI5LDAuNjQyMzQ5MzM5NDQwMzQwMjIwNjQzOTg0NiwwLjgwMTU3ODA5MDczMzMwOTkxMjc5NDIwNjUsMC45MTc1OTgzOTkyMjI5Nzc5NjUyMDY1NDc4LDAuOTg0MTgzMDU0NzE4NTg4MTQ5NDcyODI5NF0sXHJcbiAgICAgICAgICBbICAwLjEwODA1NDk0ODcwNzM0MzY2MjA2NjI0NDcsMC4zMTkxMTIzNjg5Mjc4ODk3NjA0MzU2NzE4LDAuNTE1MjQ4NjM2MzU4MTU0MDkxOTY1MjkwNywwLjY4NzI5MjkwNDgxMTY4NTQ3MDE0ODAxOTgsMC44MjcyMDEzMTUwNjk3NjQ5OTMxODk3OTQ3LDAuOTI4NDM0ODgzNjYzNTczNTE3MzM2MzkxMSwwLjk4NjI4MzgwODY5NjgxMjMzODg0MTU5NzNdLFxyXG4gICAgICAgICAgWzAsMC4yMDExOTQwOTM5OTc0MzQ1MjIzMDA2MjgzLDAuMzk0MTUxMzQ3MDc3NTYzMzY5ODk3MjA3NCwwLjU3MDk3MjE3MjYwODUzODg0NzUzNzIyNjcsMC43MjQ0MTc3MzEzNjAxNzAwNDc0MTYxODYxLDAuODQ4MjA2NTgzNDEwNDI3MjE2MjAwNjQ4MywwLjkzNzI3MzM5MjQwMDcwNTkwNDMwNzc1ODksMC45ODc5OTI1MTgwMjA0ODU0Mjg0ODk1NjU3XSxcclxuICAgICAgICAgIFsgIDAuMDk1MDEyNTA5ODM3NjM3NDQwMTg1MzE5MywwLjI4MTYwMzU1MDc3OTI1ODkxMzIzMDQ2MDUsMC40NTgwMTY3Nzc2NTcyMjczODYzNDI0MTk0LDAuNjE3ODc2MjQ0NDAyNjQzNzQ4NDQ2NjcxOCwwLjc1NTQwNDQwODM1NTAwMzAzMzg5NTEwMTIsMC44NjU2MzEyMDIzODc4MzE3NDM4ODA0Njc5LDAuOTQ0NTc1MDIzMDczMjMyNTc2MDc3OTg4NCwwLjk4OTQwMDkzNDk5MTY0OTkzMjU5NjE1NDJdXHJcbiAgICAgICAgXSxcclxuXHJcbiAgICAgICAgd2VpZ2h0czogW1xyXG4gICAgICAgICAgWzFdLFxyXG4gICAgICAgICAgWzAuODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4OSwwLjU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTZdLFxyXG4gICAgICAgICAgWzAuNjUyMTQ1MTU0ODYyNTQ2MTQyNjI2OTM2MSwwLjM0Nzg1NDg0NTEzNzQ1Mzg1NzM3MzA2MzldLFxyXG4gICAgICAgICAgWzAuNTY4ODg4ODg4ODg4ODg4ODg4ODg4ODg4OSwwLjQ3ODYyODY3MDQ5OTM2NjQ2ODA0MTI5MTUsMC4yMzY5MjY4ODUwNTYxODkwODc1MTQyNjQwXSxcclxuICAgICAgICAgIFswLjQ2NzkxMzkzNDU3MjY5MTA0NzM4OTg3MDMsMC4zNjA3NjE1NzMwNDgxMzg2MDc1Njk4MzM1LDAuMTcxMzI0NDkyMzc5MTcwMzQ1MDQwMjk2MV0sXHJcbiAgICAgICAgICBbMC40MTc5NTkxODM2NzM0NjkzODc3NTUxMDIwLDAuMzgxODMwMDUwNTA1MTE4OTQ0OTUwMzY5OCwwLjI3OTcwNTM5MTQ4OTI3NjY2NzkwMTQ2NzgsMC4xMjk0ODQ5NjYxNjg4Njk2OTMyNzA2MTE0XSxcclxuICAgICAgICAgIFswLjM2MjY4Mzc4MzM3ODM2MTk4Mjk2NTE1MDQsMC4zMTM3MDY2NDU4Nzc4ODcyODczMzc5NjIyLDAuMjIyMzgxMDM0NDUzMzc0NDcwNTQ0MzU2MCwwLjEwMTIyODUzNjI5MDM3NjI1OTE1MjUzMTRdLFxyXG4gICAgICAgICAgWzAuMzMwMjM5MzU1MDAxMjU5NzYzMTY0NTI1MSwwLjMxMjM0NzA3NzA0MDAwMjg0MDA2ODYzMDQsMC4yNjA2MTA2OTY0MDI5MzU0NjIzMTg3NDI5LDAuMTgwNjQ4MTYwNjk0ODU3NDA0MDU4NDcyMCwwLjA4MTI3NDM4ODM2MTU3NDQxMTk3MTg5MjJdLFxyXG4gICAgICAgICAgWzAuMjk1NTI0MjI0NzE0NzUyODcwMTczODkzMCwwLjI2OTI2NjcxOTMwOTk5NjM1NTA5MTIyNjksMC4yMTkwODYzNjI1MTU5ODIwNDM5OTU1MzQ5LDAuMTQ5NDUxMzQ5MTUwNTgwNTkzMTQ1Nzc2MywwLjA2NjY3MTM0NDMwODY4ODEzNzU5MzU2ODhdLFxyXG4gICAgICAgICAgWzAuMjcyOTI1MDg2Nzc3OTAwNjMwNzE0NDgzNSwwLjI2MjgwNDU0NDUxMDI0NjY2MjE4MDY4ODksMC4yMzMxOTM3NjQ1OTE5OTA0Nzk5MTg1MjM3LDAuMTg2MjkwMjEwOTI3NzM0MjUxNDI2MDk3NiwwLjEyNTU4MDM2OTQ2NDkwNDYyNDYzNDY5NDMsMC4wNTU2Njg1NjcxMTYxNzM2NjY0ODI3NTM3XSxcclxuICAgICAgICAgIFswLjI0OTE0NzA0NTgxMzQwMjc4NTAwMDU2MjQsMC4yMzM0OTI1MzY1MzgzNTQ4MDg3NjA4NDk5LDAuMjAzMTY3NDI2NzIzMDY1OTIxNzQ5MDY0NSwwLjE2MDA3ODMyODU0MzM0NjIyNjMzNDY1MjUsMC4xMDY5MzkzMjU5OTUzMTg0MzA5NjAyNTQ3LDAuMDQ3MTc1MzM2Mzg2NTExODI3MTk0NjE2MF0sXHJcbiAgICAgICAgICBbMC4yMzI1NTE1NTMyMzA4NzM5MTAxOTQ1ODk1LDAuMjI2MjgzMTgwMjYyODk3MjM4NDEyMDkwMiwwLjIwNzgxNjA0NzUzNjg4ODUwMjMxMjUyMzIsMC4xNzgxNDU5ODA3NjE5NDU3MzgyODAwNDY3LDAuMTM4ODczNTEwMjE5Nzg3MjM4NDYzNjAxOCwwLjA5MjEyMTQ5OTgzNzcyODQ0NzkxNDQyMTgsMC4wNDA0ODQwMDQ3NjUzMTU4Nzk1MjAwMjE2XSxcclxuICAgICAgICAgIFswLjIxNTI2Mzg1MzQ2MzE1Nzc5MDE5NTg3NjQsMC4yMDUxOTg0NjM3MjEyOTU2MDM5NjU5MjQxLDAuMTg1NTM4Mzk3NDc3OTM3ODEzNzQxNzE2NiwwLjE1NzIwMzE2NzE1ODE5MzUzNDU2OTYwMTksMC4xMjE1MTg1NzA2ODc5MDMxODQ2ODk0MTQ4LDAuMDgwMTU4MDg3MTU5NzYwMjA5ODA1NjMzMywwLjAzNTExOTQ2MDMzMTc1MTg2MzAzMTgzMjldLFxyXG4gICAgICAgICAgWzAuMjAyNTc4MjQxOTI1NTYxMjcyODgwNjIwMiwwLjE5ODQzMTQ4NTMyNzExMTU3NjQ1NjExODMsMC4xODYxNjEwMDAwMTU1NjIyMTEwMjY4MDA2LDAuMTY2MjY5MjA1ODE2OTkzOTMzNTUzMjAwOSwwLjEzOTU3MDY3NzkyNjE1NDMxNDQ0NzgwNDgsMC4xMDcxNTkyMjA0NjcxNzE5MzUwMTE4Njk1LDAuMDcwMzY2MDQ3NDg4MTA4MTI0NzA5MjY3NCwwLjAzMDc1MzI0MTk5NjExNzI2ODM1NDYyODRdLFxyXG4gICAgICAgICAgWzAuMTg5NDUwNjEwNDU1MDY4NDk2Mjg1Mzk2NywwLjE4MjYwMzQxNTA0NDkyMzU4ODg2Njc2MzcsMC4xNjkxNTY1MTkzOTUwMDI1MzgxODkzMTIxLDAuMTQ5NTk1OTg4ODE2NTc2NzMyMDgxNTAxNywwLjEyNDYyODk3MTI1NTUzMzg3MjA1MjQ3NjMsMC4wOTUxNTg1MTE2ODI0OTI3ODQ4MDk5MjUxLDAuMDYyMjUzNTIzOTM4NjQ3ODkyODYyODQzOCwwLjAyNzE1MjQ1OTQxMTc1NDA5NDg1MTc4MDZdXHJcbiAgICAgICAgXVxyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBBY2NvdW50IGZvciBoaWdoIGRwaSByZW5kZXJpbmcuXHJcbiAgICAgICAqIGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL2NhbnZhcy9oaWRwaS9cclxuICAgICAgICovXHJcblxyXG4gICAgICBkZXZpY2VQaXhlbFJhdGlvOiByb290LmRldmljZVBpeGVsUmF0aW8gfHwgMSxcclxuXHJcbiAgICAgIGdldEJhY2tpbmdTdG9yZVJhdGlvOiBmdW5jdGlvbihjdHgpIHtcclxuICAgICAgICByZXR1cm4gY3R4LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcclxuICAgICAgICAgIGN0eC5tb3pCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICBjdHgubXNCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgICBjdHgub0JhY2tpbmdTdG9yZVBpeGVsUmF0aW8gfHxcclxuICAgICAgICAgIGN0eC5iYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8IDE7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBnZXRSYXRpbzogZnVuY3Rpb24oY3R4KSB7XHJcbiAgICAgICAgcmV0dXJuIFR3by5VdGlscy5kZXZpY2VQaXhlbFJhdGlvIC8gZ2V0QmFja2luZ1N0b3JlUmF0aW8oY3R4KTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBQcm9wZXJseSBkZWZlciBwbGF5IGNhbGxpbmcgdW50aWwgYWZ0ZXIgYWxsIG9iamVjdHNcclxuICAgICAgICogaGF2ZSBiZWVuIHVwZGF0ZWQgd2l0aCB0aGVpciBuZXdlc3Qgc3R5bGVzLlxyXG4gICAgICAgKi9cclxuICAgICAgc2V0UGxheWluZzogZnVuY3Rpb24oYikge1xyXG5cclxuICAgICAgICB0aGlzLnBsYXlpbmcgPSAhIWI7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIFJldHVybiB0aGUgY29tcHV0ZWQgbWF0cml4IG9mIGEgbmVzdGVkIG9iamVjdC5cclxuICAgICAgICogVE9ETzogT3B0aW1pemUgdHJhdmVyc2FsLlxyXG4gICAgICAgKi9cclxuICAgICAgZ2V0Q29tcHV0ZWRNYXRyaXg6IGZ1bmN0aW9uKG9iamVjdCwgbWF0cml4KSB7XHJcblxyXG4gICAgICAgIG1hdHJpeCA9IChtYXRyaXggJiYgbWF0cml4LmlkZW50aXR5KCkpIHx8IG5ldyBUd28uTWF0cml4KCk7XHJcbiAgICAgICAgdmFyIHBhcmVudCA9IG9iamVjdCwgbWF0cmljZXMgPSBbXTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHBhcmVudCAmJiBwYXJlbnQuX21hdHJpeCkge1xyXG4gICAgICAgICAgbWF0cmljZXMucHVzaChwYXJlbnQuX21hdHJpeCk7XHJcbiAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWF0cmljZXMucmV2ZXJzZSgpO1xyXG5cclxuICAgICAgICBfLmVhY2gobWF0cmljZXMsIGZ1bmN0aW9uKG0pIHtcclxuXHJcbiAgICAgICAgICB2YXIgZSA9IG0uZWxlbWVudHM7XHJcbiAgICAgICAgICBtYXRyaXgubXVsdGlwbHkoXHJcbiAgICAgICAgICAgIGVbMF0sIGVbMV0sIGVbMl0sIGVbM10sIGVbNF0sIGVbNV0sIGVbNl0sIGVbN10sIGVbOF0sIGVbOV0pO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1hdHJpeDtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBkZWx0YVRyYW5zZm9ybVBvaW50OiBmdW5jdGlvbihtYXRyaXgsIHgsIHkpIHtcclxuXHJcbiAgICAgICAgdmFyIGR4ID0geCAqIG1hdHJpeC5hICsgeSAqIG1hdHJpeC5jICsgMDtcclxuICAgICAgICB2YXIgZHkgPSB4ICogbWF0cml4LmIgKyB5ICogbWF0cml4LmQgKyAwO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFR3by5WZWN0b3IoZHgsIGR5KTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vMjA1MjI0N1xyXG4gICAgICAgKi9cclxuICAgICAgZGVjb21wb3NlTWF0cml4OiBmdW5jdGlvbihtYXRyaXgpIHtcclxuXHJcbiAgICAgICAgLy8gY2FsY3VsYXRlIGRlbHRhIHRyYW5zZm9ybSBwb2ludFxyXG4gICAgICAgIHZhciBweCA9IFR3by5VdGlscy5kZWx0YVRyYW5zZm9ybVBvaW50KG1hdHJpeCwgMCwgMSk7XHJcbiAgICAgICAgdmFyIHB5ID0gVHdvLlV0aWxzLmRlbHRhVHJhbnNmb3JtUG9pbnQobWF0cml4LCAxLCAwKTtcclxuXHJcbiAgICAgICAgLy8gY2FsY3VsYXRlIHNrZXdcclxuICAgICAgICB2YXIgc2tld1ggPSAoKDE4MCAvIE1hdGguUEkpICogTWF0aC5hdGFuMihweC55LCBweC54KSAtIDkwKTtcclxuICAgICAgICB2YXIgc2tld1kgPSAoKDE4MCAvIE1hdGguUEkpICogTWF0aC5hdGFuMihweS55LCBweS54KSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRyYW5zbGF0ZVg6IG1hdHJpeC5lLFxyXG4gICAgICAgICAgICB0cmFuc2xhdGVZOiBtYXRyaXguZixcclxuICAgICAgICAgICAgc2NhbGVYOiBNYXRoLnNxcnQobWF0cml4LmEgKiBtYXRyaXguYSArIG1hdHJpeC5iICogbWF0cml4LmIpLFxyXG4gICAgICAgICAgICBzY2FsZVk6IE1hdGguc3FydChtYXRyaXguYyAqIG1hdHJpeC5jICsgbWF0cml4LmQgKiBtYXRyaXguZCksXHJcbiAgICAgICAgICAgIHNrZXdYOiBza2V3WCxcclxuICAgICAgICAgICAgc2tld1k6IHNrZXdZLFxyXG4gICAgICAgICAgICByb3RhdGlvbjogc2tld1ggLy8gcm90YXRpb24gaXMgdGhlIHNhbWUgYXMgc2tldyB4XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogV2FsayB0aHJvdWdoIGl0ZW0gcHJvcGVydGllcyBhbmQgcGljayB0aGUgb25lcyBvZiBpbnRlcmVzdC5cclxuICAgICAgICogV2lsbCB0cnkgdG8gcmVzb2x2ZSBzdHlsZXMgYXBwbGllZCB2aWEgQ1NTXHJcbiAgICAgICAqXHJcbiAgICAgICAqIFRPRE86IFJldmVyc2UgY2FsY3VsYXRlIGBUd28uR3JhZGllbnRgcyBmb3IgZmlsbCAvIHN0cm9rZVxyXG4gICAgICAgKiBvZiBhbnkgZ2l2ZW4gcGF0aC5cclxuICAgICAgICovXHJcbiAgICAgIGFwcGx5U3ZnQXR0cmlidXRlczogZnVuY3Rpb24obm9kZSwgZWxlbSkge1xyXG5cclxuICAgICAgICB2YXIgYXR0cmlidXRlcyA9IHt9LCBzdHlsZXMgPSB7fSwgaSwga2V5LCB2YWx1ZSwgYXR0cjtcclxuXHJcbiAgICAgICAgLy8gTm90IGF2YWlsYWJsZSBpbiBub24gYnJvd3NlciBlbnZpcm9ubWVudHNcclxuICAgICAgICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZSkge1xyXG4gICAgICAgICAgLy8gQ29udmVydCBDU1NTdHlsZURlY2xhcmF0aW9uIHRvIGEgbm9ybWFsIG9iamVjdFxyXG4gICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGVzID0gZ2V0Q29tcHV0ZWRTdHlsZShub2RlKTtcclxuICAgICAgICAgIGkgPSBjb21wdXRlZFN0eWxlcy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICBrZXkgPSBjb21wdXRlZFN0eWxlc1tpXTtcclxuICAgICAgICAgICAgdmFsdWUgPSBjb21wdXRlZFN0eWxlc1trZXldO1xyXG4gICAgICAgICAgICAvLyBHZWNrbyByZXR1cm5zIHVuZGVmaW5lZCBmb3IgdW5zZXQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAvLyBXZWJraXQgcmV0dXJucyB0aGUgZGVmYXVsdCB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIHN0eWxlc1trZXldID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvbnZlcnQgTm9kZU1hcCB0byBhIG5vcm1hbCBvYmplY3RcclxuICAgICAgICBpID0gbm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICBhdHRyID0gbm9kZS5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgYXR0cmlidXRlc1thdHRyLm5vZGVOYW1lXSA9IGF0dHIudmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHZXR0aW5nIHRoZSBjb3JyZWN0IG9wYWNpdHkgaXMgYSBiaXQgdHJpY2t5LCBzaW5jZSBTVkcgcGF0aCBlbGVtZW50cyBkb24ndFxyXG4gICAgICAgIC8vIHN1cHBvcnQgb3BhY2l0eSBhcyBhbiBhdHRyaWJ1dGUsIGJ1dCB5b3UgY2FuIGFwcGx5IGl0IHZpYSBDU1MuXHJcbiAgICAgICAgLy8gU28gd2UgdGFrZSB0aGUgb3BhY2l0eSBhbmQgc2V0IChzdHJva2UvZmlsbCktb3BhY2l0eSB0byB0aGUgc2FtZSB2YWx1ZS5cclxuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQoc3R5bGVzLm9wYWNpdHkpKSB7XHJcbiAgICAgICAgICBzdHlsZXNbJ3N0cm9rZS1vcGFjaXR5J10gPSBzdHlsZXMub3BhY2l0eTtcclxuICAgICAgICAgIHN0eWxlc1snZmlsbC1vcGFjaXR5J10gPSBzdHlsZXMub3BhY2l0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1lcmdlIGF0dHJpYnV0ZXMgYW5kIGFwcGxpZWQgc3R5bGVzIChhdHRyaWJ1dGVzIHRha2UgcHJlY2VkZW5jZSlcclxuICAgICAgICBfLmV4dGVuZChzdHlsZXMsIGF0dHJpYnV0ZXMpO1xyXG5cclxuICAgICAgICAvLyBTaW1pbGFybHkgdmlzaWJpbGl0eSBpcyBpbmZsdWVuY2VkIGJ5IHRoZSB2YWx1ZSBvZiBib3RoIGRpc3BsYXkgYW5kIHZpc2liaWxpdHkuXHJcbiAgICAgICAgLy8gQ2FsY3VsYXRlIGEgdW5pZmllZCB2YWx1ZSBoZXJlIHdoaWNoIGRlZmF1bHRzIHRvIGB0cnVlYC5cclxuICAgICAgICBzdHlsZXMudmlzaWJsZSA9ICEoXy5pc1VuZGVmaW5lZChzdHlsZXMuZGlzcGxheSkgJiYgc3R5bGVzLmRpc3BsYXkgPT09ICdub25lJylcclxuICAgICAgICAgIHx8IChfLmlzVW5kZWZpbmVkKHN0eWxlcy52aXNpYmlsaXR5KSAmJiBzdHlsZXMudmlzaWJpbGl0eSA9PT0gJ2hpZGRlbicpO1xyXG5cclxuICAgICAgICAvLyBOb3cgaXRlcmF0ZSB0aGUgd2hvbGUgdGhpbmdcclxuICAgICAgICBmb3IgKGtleSBpbiBzdHlsZXMpIHtcclxuICAgICAgICAgIHZhbHVlID0gc3R5bGVzW2tleV07XHJcblxyXG4gICAgICAgICAgc3dpdGNoIChrZXkpIHtcclxuICAgICAgICAgICAgY2FzZSAndHJhbnNmb3JtJzpcclxuICAgICAgICAgICAgICAvLyBUT0RPOiBDaGVjayB0aGlzIG91dCBodHRwczovL2dpdGh1Yi5jb20vcGFwZXJqcy9wYXBlci5qcy9ibG9iL21hc3Rlci9zcmMvc3ZnL1NWR0ltcG9ydC5qcyNMMzEzXHJcbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnbm9uZScpIGJyZWFrO1xyXG4gICAgICAgICAgICAgIHZhciBtID0gbm9kZS5nZXRDVE0gPyBub2RlLmdldENUTSgpIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgLy8gTWlnaHQgaGFwcGVuIHdoZW4gdHJhbnNmb3JtIHN0cmluZyBpcyBlbXB0eSBvciBub3QgdmFsaWQuXHJcbiAgICAgICAgICAgICAgaWYgKG0gPT09IG51bGwpIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAvLyAvLyBPcHRpb24gMTogZWRpdCB0aGUgdW5kZXJseWluZyBtYXRyaXggYW5kIGRvbid0IGZvcmNlIGFuIGF1dG8gY2FsYy5cclxuICAgICAgICAgICAgICAvLyB2YXIgbSA9IG5vZGUuZ2V0Q1RNKCk7XHJcbiAgICAgICAgICAgICAgLy8gZWxlbS5fbWF0cml4Lm1hbnVhbCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgLy8gZWxlbS5fbWF0cml4LnNldChtLmEsIG0uYiwgbS5jLCBtLmQsIG0uZSwgbS5mKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gT3B0aW9uIDI6IERlY29tcG9zZSBhbmQgaW5mZXIgVHdvLmpzIHJlbGF0ZWQgcHJvcGVydGllcy5cclxuICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtcyA9IFR3by5VdGlscy5kZWNvbXBvc2VNYXRyaXgobm9kZS5nZXRDVE0oKSk7XHJcblxyXG4gICAgICAgICAgICAgIGVsZW0udHJhbnNsYXRpb24uc2V0KHRyYW5zZm9ybXMudHJhbnNsYXRlWCwgdHJhbnNmb3Jtcy50cmFuc2xhdGVZKTtcclxuICAgICAgICAgICAgICBlbGVtLnJvdGF0aW9uID0gdHJhbnNmb3Jtcy5yb3RhdGlvbjtcclxuICAgICAgICAgICAgICAvLyBXYXJuaW5nOiBUd28uanMgZWxlbWVudHMgb25seSBzdXBwb3J0IHVuaWZvcm0gc2NhbGFycy4uLlxyXG4gICAgICAgICAgICAgIGVsZW0uc2NhbGUgPSB0cmFuc2Zvcm1zLnNjYWxlWDtcclxuXHJcbiAgICAgICAgICAgICAgdmFyIHggPSBwYXJzZUZsb2F0KChzdHlsZXMueCArICcnKS5yZXBsYWNlKCdweCcpKTtcclxuICAgICAgICAgICAgICB2YXIgeSA9IHBhcnNlRmxvYXQoKHN0eWxlcy55ICsgJycpLnJlcGxhY2UoJ3B4JykpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBPdmVycmlkZSBiYXNlZCBvbiBhdHRyaWJ1dGVzLlxyXG4gICAgICAgICAgICAgIGlmICh4KSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtLnRyYW5zbGF0aW9uLnggPSB4O1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgaWYgKHkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW0udHJhbnNsYXRpb24ueSA9IHk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAndmlzaWJsZSc6XHJcbiAgICAgICAgICAgICAgZWxlbS52aXNpYmxlID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0cm9rZS1saW5lY2FwJzpcclxuICAgICAgICAgICAgICBlbGVtLmNhcCA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdzdHJva2UtbGluZWpvaW4nOlxyXG4gICAgICAgICAgICAgIGVsZW0uam9pbiA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdzdHJva2UtbWl0ZXJsaW1pdCc6XHJcbiAgICAgICAgICAgICAgZWxlbS5taXRlciA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdzdHJva2Utd2lkdGgnOlxyXG4gICAgICAgICAgICAgIGVsZW0ubGluZXdpZHRoID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0cm9rZS1vcGFjaXR5JzpcclxuICAgICAgICAgICAgY2FzZSAnZmlsbC1vcGFjaXR5JzpcclxuICAgICAgICAgICAgY2FzZSAnb3BhY2l0eSc6XHJcbiAgICAgICAgICAgICAgZWxlbS5vcGFjaXR5ID0gcGFyc2VGbG9hdCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2ZpbGwnOlxyXG4gICAgICAgICAgICBjYXNlICdzdHJva2UnOlxyXG4gICAgICAgICAgICAgIGlmICgvdXJsXFwoXFwjLipcXCkvaS50ZXN0KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbVtrZXldID0gdGhpcy5nZXRCeUlkKFxyXG4gICAgICAgICAgICAgICAgICB2YWx1ZS5yZXBsYWNlKC91cmxcXChcXCMoLiopXFwpL2ksICckMScpKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZWxlbVtrZXldID0gKHZhbHVlID09PSAnbm9uZScpID8gJ3RyYW5zcGFyZW50JyA6IHZhbHVlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnaWQnOlxyXG4gICAgICAgICAgICAgIGVsZW0uaWQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnY2xhc3MnOlxyXG4gICAgICAgICAgICAgIGVsZW0uY2xhc3NMaXN0ID0gdmFsdWUuc3BsaXQoJyAnKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBSZWFkIGFueSBudW1iZXIgb2YgU1ZHIG5vZGUgdHlwZXMgYW5kIGNyZWF0ZSBUd28gZXF1aXZhbGVudHMgb2YgdGhlbS5cclxuICAgICAgICovXHJcbiAgICAgIHJlYWQ6IHtcclxuXHJcbiAgICAgICAgc3ZnOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMucmVhZC5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgZzogZnVuY3Rpb24obm9kZSkge1xyXG5cclxuICAgICAgICAgIHZhciBncm91cCA9IG5ldyBUd28uR3JvdXAoKTtcclxuXHJcbiAgICAgICAgICAvLyBTd2l0Y2hlZCB1cCBvcmRlciB0byBpbmhlcml0IG1vcmUgc3BlY2lmaWMgc3R5bGVzXHJcbiAgICAgICAgICBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgZ3JvdXApO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbm9kZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgbiA9IG5vZGUuY2hpbGROb2Rlc1tpXTtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG4ubm9kZU5hbWU7XHJcbiAgICAgICAgICAgIGlmICghdGFnKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFnTmFtZSA9IHRhZy5yZXBsYWNlKC9zdmdcXDovaWcsICcnKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRhZ05hbWUgaW4gVHdvLlV0aWxzLnJlYWQpIHtcclxuICAgICAgICAgICAgICB2YXIgbyA9IFR3by5VdGlscy5yZWFkW3RhZ05hbWVdLmNhbGwoZ3JvdXAsIG4pO1xyXG4gICAgICAgICAgICAgIGdyb3VwLmFkZChvKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiBncm91cDtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcG9seWdvbjogZnVuY3Rpb24obm9kZSwgb3Blbikge1xyXG5cclxuICAgICAgICAgIHZhciBwb2ludHMgPSBub2RlLmdldEF0dHJpYnV0ZSgncG9pbnRzJyk7XHJcblxyXG4gICAgICAgICAgdmFyIHZlcnRzID0gW107XHJcbiAgICAgICAgICBwb2ludHMucmVwbGFjZSgvKC0/W1xcZFxcLj9dKylbLHxcXHNdKC0/W1xcZFxcLj9dKykvZywgZnVuY3Rpb24obWF0Y2gsIHAxLCBwMikge1xyXG4gICAgICAgICAgICB2ZXJ0cy5wdXNoKG5ldyBUd28uQW5jaG9yKHBhcnNlRmxvYXQocDEpLCBwYXJzZUZsb2F0KHAyKSkpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgdmFyIHBvbHkgPSBuZXcgVHdvLlBhdGgodmVydHMsICFvcGVuKS5ub1N0cm9rZSgpO1xyXG4gICAgICAgICAgcG9seS5maWxsID0gJ2JsYWNrJztcclxuXHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIHBvbHkpO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwb2x5bGluZTogZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5yZWFkLnBvbHlnb24uY2FsbCh0aGlzLCBub2RlLCB0cnVlKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBwYXRoOiBmdW5jdGlvbihub2RlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHBhdGggPSBub2RlLmdldEF0dHJpYnV0ZSgnZCcpO1xyXG5cclxuICAgICAgICAgIC8vIENyZWF0ZSBhIFR3by5QYXRoIGZyb20gdGhlIHBhdGhzLlxyXG5cclxuICAgICAgICAgIHZhciBjb29yZCA9IG5ldyBUd28uQW5jaG9yKCk7XHJcbiAgICAgICAgICB2YXIgY29udHJvbCwgY29vcmRzO1xyXG4gICAgICAgICAgdmFyIGNsb3NlZCA9IGZhbHNlLCByZWxhdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgdmFyIGNvbW1hbmRzID0gcGF0aC5tYXRjaCgvW2EtZGYtel1bXmEtZGYtel0qL2lnKTtcclxuICAgICAgICAgIHZhciBsYXN0ID0gY29tbWFuZHMubGVuZ3RoIC0gMTtcclxuXHJcbiAgICAgICAgICAvLyBTcGxpdCB1cCBwb2x5YmV6aWVyc1xyXG5cclxuICAgICAgICAgIF8uZWFjaChjb21tYW5kcy5zbGljZSgwKSwgZnVuY3Rpb24oY29tbWFuZCwgaSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIHR5cGUgPSBjb21tYW5kWzBdO1xyXG4gICAgICAgICAgICB2YXIgbG93ZXIgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIHZhciBpdGVtcyA9IGNvbW1hbmQuc2xpY2UoMSkudHJpbSgpLnNwbGl0KC9bXFxzLF0rfCg/PVxccz9bK1xcLV0pLyk7XHJcbiAgICAgICAgICAgIHZhciBwcmUsIHBvc3QsIHJlc3VsdCA9IFtdLCBiaW47XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgY29tbWFuZHMgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChsb3dlcikge1xyXG4gICAgICAgICAgICAgIGNhc2UgJ2gnOlxyXG4gICAgICAgICAgICAgIGNhc2UgJ3YnOlxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgYmluID0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIGNhc2UgJ20nOlxyXG4gICAgICAgICAgICAgIGNhc2UgJ2wnOlxyXG4gICAgICAgICAgICAgIGNhc2UgJ3QnOlxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICAgICAgICAgICAgYmluID0gMjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIGNhc2UgJ3MnOlxyXG4gICAgICAgICAgICAgIGNhc2UgJ3EnOlxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDQpIHtcclxuICAgICAgICAgICAgICAgICAgYmluID0gNDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIGNhc2UgJ2MnOlxyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDYpIHtcclxuICAgICAgICAgICAgICAgICAgYmluID0gNjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIGNhc2UgJ2EnOlxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogSGFuZGxlIEVsbGlwc2VzXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGJpbikge1xyXG5cclxuICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgbCA9IGl0ZW1zLmxlbmd0aCwgdGltZXMgPSAwOyBqIDwgbDsgais9YmluKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGN0ID0gdHlwZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lcyA+IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ20nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgY3QgPSAnbCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdNJzpcclxuICAgICAgICAgICAgICAgICAgICAgIGN0ID0gJ0wnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goW2N0XS5jb25jYXQoaXRlbXMuc2xpY2UoaiwgaiArIGJpbikpLmpvaW4oJyAnKSk7XHJcbiAgICAgICAgICAgICAgICB0aW1lcysrO1xyXG5cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGNvbW1hbmRzID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShjb21tYW5kcywgcmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgIGNvbW1hbmRzLnB1c2goY29tbWFuZCk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSB2ZXJ0aWNlcyBmb3Igb3VyIFR3by5QYXRoXHJcblxyXG4gICAgICAgICAgdmFyIHBvaW50cyA9IFtdO1xyXG4gICAgICAgICAgXy5lYWNoKGNvbW1hbmRzLCBmdW5jdGlvbihjb21tYW5kLCBpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVzdWx0LCB4LCB5O1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IGNvbW1hbmRbMF07XHJcbiAgICAgICAgICAgIHZhciBsb3dlciA9IHR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGNvb3JkcyA9IGNvbW1hbmQuc2xpY2UoMSkudHJpbSgpO1xyXG4gICAgICAgICAgICBjb29yZHMgPSBjb29yZHMucmVwbGFjZSgvKC0/XFxkKyg/OlxcLlxcZCopPylbZUVdKFsrXFwtXT9cXGQrKS9nLCBmdW5jdGlvbihtYXRjaCwgbjEsIG4yKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQobjEpICogcG93KDEwLCBuMik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjb29yZHMgPSBjb29yZHMuc3BsaXQoL1tcXHMsXSt8KD89XFxzP1srXFwtXSkvKTtcclxuICAgICAgICAgICAgcmVsYXRpdmUgPSB0eXBlID09PSBsb3dlcjtcclxuXHJcbiAgICAgICAgICAgIHZhciB4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIHJlZmxlY3Rpb247XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKGxvd2VyKSB7XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ3onOlxyXG4gICAgICAgICAgICAgICAgaWYgKGkgPj0gbGFzdCkge1xyXG4gICAgICAgICAgICAgICAgICBjbG9zZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgeCA9IGNvb3JkLng7XHJcbiAgICAgICAgICAgICAgICAgIHkgPSBjb29yZC55O1xyXG4gICAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgVHdvLkFuY2hvcihcclxuICAgICAgICAgICAgICAgICAgICB4LCB5LFxyXG4gICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIFR3by5Db21tYW5kcy5jbG9zZVxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ20nOlxyXG4gICAgICAgICAgICAgIGNhc2UgJ2wnOlxyXG5cclxuICAgICAgICAgICAgICAgIHggPSBwYXJzZUZsb2F0KGNvb3Jkc1swXSk7XHJcbiAgICAgICAgICAgICAgICB5ID0gcGFyc2VGbG9hdChjb29yZHNbMV0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBUd28uQW5jaG9yKFxyXG4gICAgICAgICAgICAgICAgICB4LCB5LFxyXG4gICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgIGxvd2VyID09PSAnbScgPyBUd28uQ29tbWFuZHMubW92ZSA6IFR3by5Db21tYW5kcy5saW5lXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICByZXN1bHQuYWRkU2VsZihjb29yZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmVzdWx0LmNvbnRyb2xzLmxlZnQuY29weShyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVzdWx0LmNvbnRyb2xzLnJpZ2h0LmNvcHkocmVzdWx0KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb29yZCA9IHJlc3VsdDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICBjYXNlICdoJzpcclxuICAgICAgICAgICAgICBjYXNlICd2JzpcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgYSA9IGxvd2VyID09PSAnaCcgPyAneCcgOiAneSc7XHJcbiAgICAgICAgICAgICAgICB2YXIgYiA9IGEgPT09ICd4JyA/ICd5JyA6ICd4JztcclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBuZXcgVHdvLkFuY2hvcihcclxuICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICB1bmRlZmluZWQsIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgVHdvLkNvbW1hbmRzLmxpbmVcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbYV0gPSBwYXJzZUZsb2F0KGNvb3Jkc1swXSk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRbYl0gPSBjb29yZFtiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgcmVzdWx0W2FdICs9IGNvb3JkW2FdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHJlc3VsdC5jb250cm9scy5sZWZ0LmNvcHkocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIC8vIHJlc3VsdC5jb250cm9scy5yaWdodC5jb3B5KHJlc3VsdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29vcmQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgY2FzZSAnYyc6XHJcbiAgICAgICAgICAgICAgY2FzZSAncyc6XHJcblxyXG4gICAgICAgICAgICAgICAgeDEgPSBjb29yZC54O1xyXG4gICAgICAgICAgICAgICAgeTEgPSBjb29yZC55O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghY29udHJvbCkge1xyXG4gICAgICAgICAgICAgICAgICBjb250cm9sID0gbmV3IFR3by5WZWN0b3IoKTsvLy5jb3B5KGNvb3JkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobG93ZXIgPT09ICdjJykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgeDIgPSBwYXJzZUZsb2F0KGNvb3Jkc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgIHkyID0gcGFyc2VGbG9hdChjb29yZHNbMV0pO1xyXG4gICAgICAgICAgICAgICAgICB4MyA9IHBhcnNlRmxvYXQoY29vcmRzWzJdKTtcclxuICAgICAgICAgICAgICAgICAgeTMgPSBwYXJzZUZsb2F0KGNvb3Jkc1szXSk7XHJcbiAgICAgICAgICAgICAgICAgIHg0ID0gcGFyc2VGbG9hdChjb29yZHNbNF0pO1xyXG4gICAgICAgICAgICAgICAgICB5NCA9IHBhcnNlRmxvYXQoY29vcmRzWzVdKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHJlZmxlY3Rpb24gY29udHJvbCBwb2ludCBmb3IgcHJvcGVyIHgyLCB5MlxyXG4gICAgICAgICAgICAgICAgICAvLyBpbmNsdXNpb24uXHJcblxyXG4gICAgICAgICAgICAgICAgICByZWZsZWN0aW9uID0gZ2V0UmVmbGVjdGlvbihjb29yZCwgY29udHJvbCwgcmVsYXRpdmUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgeDIgPSByZWZsZWN0aW9uLng7XHJcbiAgICAgICAgICAgICAgICAgIHkyID0gcmVmbGVjdGlvbi55O1xyXG4gICAgICAgICAgICAgICAgICB4MyA9IHBhcnNlRmxvYXQoY29vcmRzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgeTMgPSBwYXJzZUZsb2F0KGNvb3Jkc1sxXSk7XHJcbiAgICAgICAgICAgICAgICAgIHg0ID0gcGFyc2VGbG9hdChjb29yZHNbMl0pO1xyXG4gICAgICAgICAgICAgICAgICB5NCA9IHBhcnNlRmxvYXQoY29vcmRzWzNdKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHgyICs9IHgxO1xyXG4gICAgICAgICAgICAgICAgICB5MiArPSB5MTtcclxuICAgICAgICAgICAgICAgICAgeDMgKz0geDE7XHJcbiAgICAgICAgICAgICAgICAgIHkzICs9IHkxO1xyXG4gICAgICAgICAgICAgICAgICB4NCArPSB4MTtcclxuICAgICAgICAgICAgICAgICAgeTQgKz0geTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFfLmlzT2JqZWN0KGNvb3JkLmNvbnRyb2xzKSkge1xyXG4gICAgICAgICAgICAgICAgICBUd28uQW5jaG9yLkFwcGVuZEN1cnZlUHJvcGVydGllcyhjb29yZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29vcmQuY29udHJvbHMucmlnaHQuc2V0KHgyIC0gY29vcmQueCwgeTIgLSBjb29yZC55KTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBUd28uQW5jaG9yKFxyXG4gICAgICAgICAgICAgICAgICB4NCwgeTQsXHJcbiAgICAgICAgICAgICAgICAgIHgzIC0geDQsIHkzIC0geTQsXHJcbiAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICBUd28uQ29tbWFuZHMuY3VydmVcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29vcmQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICBjb250cm9sID0gcmVzdWx0LmNvbnRyb2xzLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ3QnOlxyXG4gICAgICAgICAgICAgIGNhc2UgJ3EnOlxyXG5cclxuICAgICAgICAgICAgICAgIHgxID0gY29vcmQueDtcclxuICAgICAgICAgICAgICAgIHkxID0gY29vcmQueTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWNvbnRyb2wpIHtcclxuICAgICAgICAgICAgICAgICAgY29udHJvbCA9IG5ldyBUd28uVmVjdG9yKCk7Ly8uY29weShjb29yZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRyb2wuaXNaZXJvKCkpIHtcclxuICAgICAgICAgICAgICAgICAgeDIgPSB4MTtcclxuICAgICAgICAgICAgICAgICAgeTIgPSB5MTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHgyID0gY29udHJvbC54O1xyXG4gICAgICAgICAgICAgICAgICB5MSA9IGNvbnRyb2wueTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobG93ZXIgPT09ICdxJykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgeDMgPSBwYXJzZUZsb2F0KGNvb3Jkc1swXSk7XHJcbiAgICAgICAgICAgICAgICAgIHkzID0gcGFyc2VGbG9hdChjb29yZHNbMV0pO1xyXG4gICAgICAgICAgICAgICAgICB4NCA9IHBhcnNlRmxvYXQoY29vcmRzWzFdKTtcclxuICAgICAgICAgICAgICAgICAgeTQgPSBwYXJzZUZsb2F0KGNvb3Jkc1syXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgIHJlZmxlY3Rpb24gPSBnZXRSZWZsZWN0aW9uKGNvb3JkLCBjb250cm9sLCByZWxhdGl2ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICB4MyA9IHJlZmxlY3Rpb24ueDtcclxuICAgICAgICAgICAgICAgICAgeTMgPSByZWZsZWN0aW9uLnk7XHJcbiAgICAgICAgICAgICAgICAgIHg0ID0gcGFyc2VGbG9hdChjb29yZHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgICB5NCA9IHBhcnNlRmxvYXQoY29vcmRzWzFdKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHgyICs9IHgxO1xyXG4gICAgICAgICAgICAgICAgICB5MiArPSB5MTtcclxuICAgICAgICAgICAgICAgICAgeDMgKz0geDE7XHJcbiAgICAgICAgICAgICAgICAgIHkzICs9IHkxO1xyXG4gICAgICAgICAgICAgICAgICB4NCArPSB4MTtcclxuICAgICAgICAgICAgICAgICAgeTQgKz0geTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFfLmlzT2JqZWN0KGNvb3JkLmNvbnRyb2xzKSkge1xyXG4gICAgICAgICAgICAgICAgICBUd28uQW5jaG9yLkFwcGVuZEN1cnZlUHJvcGVydGllcyhjb29yZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29vcmQuY29udHJvbHMucmlnaHQuc2V0KHgyIC0gY29vcmQueCwgeTIgLSBjb29yZC55KTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5ldyBUd28uQW5jaG9yKFxyXG4gICAgICAgICAgICAgICAgICB4NCwgeTQsXHJcbiAgICAgICAgICAgICAgICAgIHgzIC0geDQsIHkzIC0geTQsXHJcbiAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICBUd28uQ29tbWFuZHMuY3VydmVcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29vcmQgPSByZXN1bHQ7XHJcbiAgICAgICAgICAgICAgICBjb250cm9sID0gcmVzdWx0LmNvbnRyb2xzLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ2EnOlxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHRocm93IG5ldyBUd28uVXRpbHMuRXJyb3IoJ25vdCB5ZXQgYWJsZSB0byBpbnRlcnByZXQgRWxsaXB0aWNhbCBBcmNzLicpO1xyXG4gICAgICAgICAgICAgICAgeDEgPSBjb29yZC54O1xyXG4gICAgICAgICAgICAgICAgeTEgPSBjb29yZC55O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByeCA9IHBhcnNlRmxvYXQoY29vcmRzWzBdKTtcclxuICAgICAgICAgICAgICAgIHZhciByeSA9IHBhcnNlRmxvYXQoY29vcmRzWzFdKTtcclxuICAgICAgICAgICAgICAgIHZhciB4QXhpc1JvdGF0aW9uID0gcGFyc2VGbG9hdChjb29yZHNbMl0pICogTWF0aC5QSSAvIDE4MDtcclxuICAgICAgICAgICAgICAgIHZhciBsYXJnZUFyY0ZsYWcgPSBwYXJzZUZsb2F0KGNvb3Jkc1szXSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3dlZXBGbGFnID0gcGFyc2VGbG9hdChjb29yZHNbNF0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHg0ID0gcGFyc2VGbG9hdChjb29yZHNbNV0pO1xyXG4gICAgICAgICAgICAgICAgeTQgPSBwYXJzZUZsb2F0KGNvb3Jkc1s2XSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHg0ICs9IHgxO1xyXG4gICAgICAgICAgICAgICAgICB5NCArPSB5MTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcvaW1wbG5vdGUuaHRtbCNBcmNDb252ZXJzaW9uRW5kcG9pbnRUb0NlbnRlclxyXG5cclxuICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBtaWRwb2ludCBteCBteVxyXG4gICAgICAgICAgICAgICAgdmFyIG14ID0gKHg0IC0geDEpIC8gMjtcclxuICAgICAgICAgICAgICAgIHZhciBteSA9ICh5NCAtIHkxKSAvIDI7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHgxJyB5MScgRi42LjUuMVxyXG4gICAgICAgICAgICAgICAgdmFyIF94ID0gbXggKiBNYXRoLmNvcyh4QXhpc1JvdGF0aW9uKSArIG15ICogTWF0aC5zaW4oeEF4aXNSb3RhdGlvbik7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3kgPSAtIG14ICogTWF0aC5zaW4oeEF4aXNSb3RhdGlvbikgKyBteSAqIE1hdGguY29zKHhBeGlzUm90YXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByeDIgPSByeCAqIHJ4O1xyXG4gICAgICAgICAgICAgICAgdmFyIHJ5MiA9IHJ5ICogcnk7XHJcbiAgICAgICAgICAgICAgICB2YXIgX3gyID0gX3ggKiBfeDtcclxuICAgICAgICAgICAgICAgIHZhciBfeTIgPSBfeSAqIF95O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGFkanVzdCByYWRpaVxyXG4gICAgICAgICAgICAgICAgdmFyIGwgPSBfeDIgLyByeDIgKyBfeTIgLyByeTI7XHJcbiAgICAgICAgICAgICAgICBpZiAobCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgcnggKj0gTWF0aC5zcXJ0KGwpO1xyXG4gICAgICAgICAgICAgICAgICByeSAqPSBNYXRoLnNxcnQobCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGFtcCA9IE1hdGguc3FydCgocngyICogcnkyIC0gcngyICogX3kyIC0gcnkyICogX3gyKSAvIChyeDIgKiBfeTIgKyByeTIgKiBfeDIpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoXy5pc05hTihhbXApKSB7XHJcbiAgICAgICAgICAgICAgICAgIGFtcCA9IDA7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhcmdlQXJjRmxhZyAhPSBzd2VlcEZsYWcgJiYgYW1wID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICBhbXAgKj0gLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGN4JyBjeScgRi42LjUuMlxyXG4gICAgICAgICAgICAgICAgdmFyIF9jeCA9IGFtcCAqIHJ4ICogX3kgLyByeTtcclxuICAgICAgICAgICAgICAgIHZhciBfY3kgPSAtIGFtcCAqIHJ5ICogX3ggLyByeDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgY3ggY3kgRi42LjUuM1xyXG4gICAgICAgICAgICAgICAgdmFyIGN4ID0gX2N4ICogTWF0aC5jb3MoeEF4aXNSb3RhdGlvbikgLSBfY3kgKiBNYXRoLnNpbih4QXhpc1JvdGF0aW9uKSArICh4MSArIHg0KSAvIDI7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3kgPSBfY3ggKiBNYXRoLnNpbih4QXhpc1JvdGF0aW9uKSArIF9jeSAqIE1hdGguY29zKHhBeGlzUm90YXRpb24pICsgKHkxICsgeTQpIC8gMjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyB2ZWN0b3IgbWFnbml0dWRlXHJcbiAgICAgICAgICAgICAgICB2YXIgbSA9IGZ1bmN0aW9uKHYpIHsgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh2WzBdLCAyKSArIE1hdGgucG93KHZbMV0sIDIpKTsgfVxyXG4gICAgICAgICAgICAgICAgLy8gcmF0aW8gYmV0d2VlbiB0d28gdmVjdG9yc1xyXG4gICAgICAgICAgICAgICAgdmFyIHIgPSBmdW5jdGlvbih1LCB2KSB7IHJldHVybiAodVswXSAqIHZbMF0gKyB1WzFdICogdlsxXSkgLyAobSh1KSAqIG0odikpIH1cclxuICAgICAgICAgICAgICAgIC8vIGFuZ2xlIGJldHdlZW4gdHdvIHZlY3RvcnNcclxuICAgICAgICAgICAgICAgIHZhciBhID0gZnVuY3Rpb24odSwgdikgeyByZXR1cm4gKHVbMF0gKiB2WzFdIDwgdVsxXSAqIHZbMF0gPyAtIDEgOiAxKSAqIE1hdGguYWNvcyhyKHUsdikpOyB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZXRhMSBhbmQgZGVsdGEgdGhldGEgRi42LjUuNCArIEYuNi41LjVcclxuICAgICAgICAgICAgICAgIHZhciB0MSA9IGEoWzEsIDBdLCBbKF94IC0gX2N4KSAvIHJ4LCAoX3kgLSBfY3kpIC8gcnldKTtcclxuICAgICAgICAgICAgICAgIHZhciB1ID0gWyhfeCAtIF9jeCkgLyByeCwgKF95IC0gX2N5KSAvIHJ5XTtcclxuICAgICAgICAgICAgICAgIHZhciB2ID0gWyggLSBfeCAtIF9jeCkgLyByeCwgKCAtIF95IC0gX2N5KSAvIHJ5XTtcclxuICAgICAgICAgICAgICAgIHZhciBkdCA9IGEodSwgdik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHIodSwgdikgPD0gLTEpIGR0ID0gTWF0aC5QSTtcclxuICAgICAgICAgICAgICAgIGlmIChyKHUsIHYpID49IDEpIGR0ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGLjYuNS42XHJcbiAgICAgICAgICAgICAgICBpZiAobGFyZ2VBcmNGbGFnKSAge1xyXG4gICAgICAgICAgICAgICAgICBkdCA9IG1vZChkdCwgTWF0aC5QSSAqIDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzd2VlcEZsYWcgJiYgZHQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIGR0IC09IE1hdGguUEkgKiAyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBUd28uUmVzb2x1dGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTYXZlIGEgcHJvamVjdGlvbiBvZiBvdXIgcm90YXRpb24gYW5kIHRyYW5zbGF0aW9uIHRvIGFwcGx5XHJcbiAgICAgICAgICAgICAgICAvLyB0byB0aGUgc2V0IG9mIHBvaW50cy5cclxuICAgICAgICAgICAgICAgIHZhciBwcm9qZWN0aW9uID0gbmV3IFR3by5NYXRyaXgoKVxyXG4gICAgICAgICAgICAgICAgICAudHJhbnNsYXRlKGN4LCBjeSlcclxuICAgICAgICAgICAgICAgICAgLnJvdGF0ZSh4QXhpc1JvdGF0aW9uKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSByZXN1bHRpbmcgYXJyYXkgb2YgVHdvLkFuY2hvcidzIHRvIGV4cG9ydCB0byB0aGVcclxuICAgICAgICAgICAgICAgIC8vIHRoZSBwYXRoLlxyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gXy5tYXAoXy5yYW5nZShsZW5ndGgpLCBmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBwY3QgPSAxIC0gKGkgLyAobGVuZ3RoIC0gMSkpO1xyXG4gICAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBwY3QgKiBkdCArIHQxO1xyXG4gICAgICAgICAgICAgICAgICB2YXIgeCA9IHJ4ICogTWF0aC5jb3ModGhldGEpO1xyXG4gICAgICAgICAgICAgICAgICB2YXIgeSA9IHJ5ICogTWF0aC5zaW4odGhldGEpO1xyXG4gICAgICAgICAgICAgICAgICB2YXIgcHJvamVjdGVkID0gcHJvamVjdGlvbi5tdWx0aXBseSh4LCB5LCAxKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUd28uQW5jaG9yKHByb2plY3RlZC54LCBwcm9qZWN0ZWQueSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIFR3by5Db21tYW5kcy5saW5lKTs7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVHdvLkFuY2hvcih4NCwgeTQsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBUd28uQ29tbWFuZHMubGluZSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvb3JkID0gcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgIGNvbnRyb2wgPSBjb29yZC5jb250cm9scy5sZWZ0O1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgIGlmIChfLmlzQXJyYXkocmVzdWx0KSkge1xyXG4gICAgICAgICAgICAgICAgcG9pbnRzID0gcG9pbnRzLmNvbmNhdChyZXN1bHQpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwb2ludHMucHVzaChyZXN1bHQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGlmIChwb2ludHMubGVuZ3RoIDw9IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBwYXRoID0gbmV3IFR3by5QYXRoKHBvaW50cywgY2xvc2VkLCB1bmRlZmluZWQsIHRydWUpLm5vU3Ryb2tlKCk7XHJcbiAgICAgICAgICBwYXRoLmZpbGwgPSAnYmxhY2snO1xyXG5cclxuICAgICAgICAgIHZhciByZWN0ID0gcGF0aC5nZXRCb3VuZGluZ0NsaWVudFJlY3QodHJ1ZSk7XHJcblxyXG4gICAgICAgICAgLy8gQ2VudGVyIG9iamVjdHMgdG8gc3RheSBjb25zaXN0ZW50XHJcbiAgICAgICAgICAvLyB3aXRoIHRoZSByZXN0IG9mIHRoZSBUd28uanMgQVBJLlxyXG4gICAgICAgICAgcmVjdC5jZW50cm9pZCA9IHtcclxuICAgICAgICAgICAgeDogcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCAvIDIsXHJcbiAgICAgICAgICAgIHk6IHJlY3QudG9wICsgcmVjdC5oZWlnaHQgLyAyXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIF8uZWFjaChwYXRoLnZlcnRpY2VzLCBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICAgIHYuc3ViU2VsZihyZWN0LmNlbnRyb2lkKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHBhdGgudHJhbnNsYXRpb24uYWRkU2VsZihyZWN0LmNlbnRyb2lkKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIHBhdGgpO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBjaXJjbGU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgeCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2N4JykpO1xyXG4gICAgICAgICAgdmFyIHkgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdjeScpKTtcclxuICAgICAgICAgIHZhciByID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgncicpKTtcclxuXHJcbiAgICAgICAgICB2YXIgY2lyY2xlID0gbmV3IFR3by5DaXJjbGUoeCwgeSwgcikubm9TdHJva2UoKTtcclxuICAgICAgICAgIGNpcmNsZS5maWxsID0gJ2JsYWNrJztcclxuXHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIGNpcmNsZSk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGVsbGlwc2U6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgeCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2N4JykpO1xyXG4gICAgICAgICAgdmFyIHkgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdjeScpKTtcclxuICAgICAgICAgIHZhciB3aWR0aCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3J4JykpO1xyXG4gICAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3J5JykpO1xyXG5cclxuICAgICAgICAgIHZhciBlbGxpcHNlID0gbmV3IFR3by5FbGxpcHNlKHgsIHksIHdpZHRoLCBoZWlnaHQpLm5vU3Ryb2tlKCk7XHJcbiAgICAgICAgICBlbGxpcHNlLmZpbGwgPSAnYmxhY2snO1xyXG5cclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgZWxsaXBzZSk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHJlY3Q6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgeCA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3gnKSkgfHwgMDtcclxuICAgICAgICAgIHZhciB5ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneScpKSB8fCAwO1xyXG4gICAgICAgICAgdmFyIHdpZHRoID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnd2lkdGgnKSk7XHJcbiAgICAgICAgICB2YXIgaGVpZ2h0ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnaGVpZ2h0JykpO1xyXG5cclxuICAgICAgICAgIHZhciB3MiA9IHdpZHRoIC8gMjtcclxuICAgICAgICAgIHZhciBoMiA9IGhlaWdodCAvIDI7XHJcblxyXG4gICAgICAgICAgdmFyIHJlY3QgPSBuZXcgVHdvLlJlY3RhbmdsZSh4ICsgdzIsIHkgKyBoMiwgd2lkdGgsIGhlaWdodClcclxuICAgICAgICAgICAgLm5vU3Ryb2tlKCk7XHJcbiAgICAgICAgICByZWN0LmZpbGwgPSAnYmxhY2snO1xyXG5cclxuICAgICAgICAgIHJldHVybiBUd28uVXRpbHMuYXBwbHlTdmdBdHRyaWJ1dGVzLmNhbGwodGhpcywgbm9kZSwgcmVjdCk7XHJcblxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGxpbmU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgeDEgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd4MScpKTtcclxuICAgICAgICAgIHZhciB5MSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3kxJykpO1xyXG4gICAgICAgICAgdmFyIHgyID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneDInKSk7XHJcbiAgICAgICAgICB2YXIgeTIgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd5MicpKTtcclxuXHJcbiAgICAgICAgICB2YXIgbGluZSA9IG5ldyBUd28uTGluZSh4MSwgeTEsIHgyLCB5Mikubm9GaWxsKCk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIFR3by5VdGlscy5hcHBseVN2Z0F0dHJpYnV0ZXMuY2FsbCh0aGlzLCBub2RlLCBsaW5lKTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgbGluZWFyZ3JhZGllbnQ6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgeDEgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd4MScpKTtcclxuICAgICAgICAgIHZhciB5MSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ3kxJykpO1xyXG4gICAgICAgICAgdmFyIHgyID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgneDInKSk7XHJcbiAgICAgICAgICB2YXIgeTIgPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCd5MicpKTtcclxuXHJcbiAgICAgICAgICB2YXIgb3ggPSAoeDIgKyB4MSkgLyAyO1xyXG4gICAgICAgICAgdmFyIG95ID0gKHkyICsgeTEpIC8gMjtcclxuXHJcbiAgICAgICAgICB2YXIgc3RvcHMgPSBbXTtcclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXTtcclxuXHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSBwYXJzZUZsb2F0KGNoaWxkLmdldEF0dHJpYnV0ZSgnb2Zmc2V0JykpO1xyXG4gICAgICAgICAgICB2YXIgY29sb3IgPSBjaGlsZC5nZXRBdHRyaWJ1dGUoJ3N0b3AtY29sb3InKTtcclxuICAgICAgICAgICAgdmFyIG9wYWNpdHkgPSBjaGlsZC5nZXRBdHRyaWJ1dGUoJ3N0b3Atb3BhY2l0eScpO1xyXG4gICAgICAgICAgICB2YXIgc3R5bGUgPSBjaGlsZC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc051bGwoY29sb3IpKSB7XHJcbiAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBzdHlsZSA/IHN0eWxlLm1hdGNoKC9zdG9wXFwtY29sb3JcXDpcXHM/KFtcXCNhLWZBLUYwLTldKikvKSA6IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGNvbG9yID0gbWF0Y2hlcyAmJiBtYXRjaGVzLmxlbmd0aCA+IDEgPyBtYXRjaGVzWzFdIDogdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc051bGwob3BhY2l0eSkpIHtcclxuICAgICAgICAgICAgICB2YXIgbWF0Y2hlcyA9IHN0eWxlID8gc3R5bGUubWF0Y2goL3N0b3BcXC1vcGFjaXR5XFw6XFxzPyhbMC05XFwuXFwtXSopLykgOiBmYWxzZTtcclxuICAgICAgICAgICAgICBvcGFjaXR5ID0gbWF0Y2hlcyAmJiBtYXRjaGVzLmxlbmd0aCA+IDEgPyBwYXJzZUZsb2F0KG1hdGNoZXNbMV0pIDogMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3RvcHMucHVzaChuZXcgVHdvLkdyYWRpZW50LlN0b3Aob2Zmc2V0LCBjb2xvciwgb3BhY2l0eSkpO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgZ3JhZGllbnQgPSBuZXcgVHdvLkxpbmVhckdyYWRpZW50KHgxIC0gb3gsIHkxIC0gb3ksIHgyIC0gb3gsXHJcbiAgICAgICAgICAgIHkyIC0gb3ksIHN0b3BzKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIGdyYWRpZW50KTtcclxuXHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgcmFkaWFsZ3JhZGllbnQ6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgY3ggPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdjeCcpKSB8fCAwO1xyXG4gICAgICAgICAgdmFyIGN5ID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgnY3knKSkgfHwgMDtcclxuICAgICAgICAgIHZhciByID0gcGFyc2VGbG9hdChub2RlLmdldEF0dHJpYnV0ZSgncicpKTtcclxuXHJcbiAgICAgICAgICB2YXIgZnggPSBwYXJzZUZsb2F0KG5vZGUuZ2V0QXR0cmlidXRlKCdmeCcpKTtcclxuICAgICAgICAgIHZhciBmeSA9IHBhcnNlRmxvYXQobm9kZS5nZXRBdHRyaWJ1dGUoJ2Z5JykpO1xyXG5cclxuICAgICAgICAgIGlmIChfLmlzTmFOKGZ4KSkge1xyXG4gICAgICAgICAgICBmeCA9IGN4O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChfLmlzTmFOKGZ5KSkge1xyXG4gICAgICAgICAgICBmeSA9IGN5O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBveCA9IE1hdGguYWJzKGN4ICsgZngpIC8gMjtcclxuICAgICAgICAgIHZhciBveSA9IE1hdGguYWJzKGN5ICsgZnkpIC8gMjtcclxuXHJcbiAgICAgICAgICB2YXIgc3RvcHMgPSBbXTtcclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXTtcclxuXHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSBwYXJzZUZsb2F0KGNoaWxkLmdldEF0dHJpYnV0ZSgnb2Zmc2V0JykpO1xyXG4gICAgICAgICAgICB2YXIgY29sb3IgPSBjaGlsZC5nZXRBdHRyaWJ1dGUoJ3N0b3AtY29sb3InKTtcclxuICAgICAgICAgICAgdmFyIG9wYWNpdHkgPSBjaGlsZC5nZXRBdHRyaWJ1dGUoJ3N0b3Atb3BhY2l0eScpO1xyXG4gICAgICAgICAgICB2YXIgc3R5bGUgPSBjaGlsZC5nZXRBdHRyaWJ1dGUoJ3N0eWxlJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc051bGwoY29sb3IpKSB7XHJcbiAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBzdHlsZSA/IHN0eWxlLm1hdGNoKC9zdG9wXFwtY29sb3JcXDpcXHM/KFtcXCNhLWZBLUYwLTldKikvKSA6IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGNvbG9yID0gbWF0Y2hlcyAmJiBtYXRjaGVzLmxlbmd0aCA+IDEgPyBtYXRjaGVzWzFdIDogdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoXy5pc051bGwob3BhY2l0eSkpIHtcclxuICAgICAgICAgICAgICB2YXIgbWF0Y2hlcyA9IHN0eWxlID8gc3R5bGUubWF0Y2goL3N0b3BcXC1vcGFjaXR5XFw6XFxzPyhbMC05XFwuXFwtXSopLykgOiBmYWxzZTtcclxuICAgICAgICAgICAgICBvcGFjaXR5ID0gbWF0Y2hlcyAmJiBtYXRjaGVzLmxlbmd0aCA+IDEgPyBwYXJzZUZsb2F0KG1hdGNoZXNbMV0pIDogMTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3RvcHMucHVzaChuZXcgVHdvLkdyYWRpZW50LlN0b3Aob2Zmc2V0LCBjb2xvciwgb3BhY2l0eSkpO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgZ3JhZGllbnQgPSBuZXcgVHdvLlJhZGlhbEdyYWRpZW50KGN4IC0gb3gsIGN5IC0gb3ksIHIsXHJcbiAgICAgICAgICAgIHN0b3BzLCBmeCAtIG94LCBmeSAtIG95KTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gVHdvLlV0aWxzLmFwcGx5U3ZnQXR0cmlidXRlcy5jYWxsKHRoaXMsIG5vZGUsIGdyYWRpZW50KTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHaXZlbiAyIHBvaW50cyAoYSwgYikgYW5kIGNvcnJlc3BvbmRpbmcgY29udHJvbCBwb2ludCBmb3IgZWFjaFxyXG4gICAgICAgKiByZXR1cm4gYW4gYXJyYXkgb2YgcG9pbnRzIHRoYXQgcmVwcmVzZW50IHBvaW50cyBwbG90dGVkIGFsb25nXHJcbiAgICAgICAqIHRoZSBjdXJ2ZS4gTnVtYmVyIHBvaW50cyBkZXRlcm1pbmVkIGJ5IGxpbWl0LlxyXG4gICAgICAgKi9cclxuICAgICAgc3ViZGl2aWRlOiBmdW5jdGlvbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIGxpbWl0KSB7XHJcblxyXG4gICAgICAgIGxpbWl0ID0gbGltaXQgfHwgVHdvLlV0aWxzLkN1cnZlLlJlY3Vyc2lvbkxpbWl0O1xyXG4gICAgICAgIHZhciBhbW91bnQgPSBsaW1pdCArIDE7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IElzc3VlIDczXHJcbiAgICAgICAgLy8gRG9uJ3QgcmVjdXJzZSBpZiB0aGUgZW5kIHBvaW50cyBhcmUgaWRlbnRpY2FsXHJcbiAgICAgICAgaWYgKHgxID09PSB4NCAmJiB5MSA9PT0geTQpIHtcclxuICAgICAgICAgIHJldHVybiBbbmV3IFR3by5BbmNob3IoeDQsIHk0KV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gXy5tYXAoXy5yYW5nZSgwLCBhbW91bnQpLCBmdW5jdGlvbihpKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHQgPSBpIC8gYW1vdW50O1xyXG4gICAgICAgICAgdmFyIHggPSBnZXRQb2ludE9uQ3ViaWNCZXppZXIodCwgeDEsIHgyLCB4MywgeDQpO1xyXG4gICAgICAgICAgdmFyIHkgPSBnZXRQb2ludE9uQ3ViaWNCZXppZXIodCwgeTEsIHkyLCB5MywgeTQpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBuZXcgVHdvLkFuY2hvcih4LCB5KTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgZ2V0UG9pbnRPbkN1YmljQmV6aWVyOiBmdW5jdGlvbih0LCBhLCBiLCBjLCBkKSB7XHJcbiAgICAgICAgdmFyIGsgPSAxIC0gdDtcclxuICAgICAgICByZXR1cm4gKGsgKiBrICogayAqIGEpICsgKDMgKiBrICogayAqIHQgKiBiKSArICgzICogayAqIHQgKiB0ICogYykgK1xyXG4gICAgICAgICAgICh0ICogdCAqIHQgKiBkKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHaXZlbiAyIHBvaW50cyAoYSwgYikgYW5kIGNvcnJlc3BvbmRpbmcgY29udHJvbCBwb2ludCBmb3IgZWFjaFxyXG4gICAgICAgKiByZXR1cm4gYSBmbG9hdCB0aGF0IHJlcHJlc2VudHMgdGhlIGxlbmd0aCBvZiB0aGUgY3VydmUgdXNpbmdcclxuICAgICAgICogR2F1c3MtTGVnZW5kcmUgYWxnb3JpdGhtLiBMaW1pdCBpdGVyYXRpb25zIG9mIGNhbGN1bGF0aW9uIGJ5IGBsaW1pdGAuXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXRDdXJ2ZUxlbmd0aDogZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCBsaW1pdCkge1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBCZXR0ZXIgLyBmdXp6aWVyIGVxdWFsaXR5IGNoZWNrXHJcbiAgICAgICAgLy8gTGluZWFyIGNhbGN1bGF0aW9uXHJcbiAgICAgICAgaWYgKHgxID09PSB4MiAmJiB5MSA9PT0geTIgJiYgeDMgPT09IHg0ICYmIHkzID09PSB5NCkge1xyXG4gICAgICAgICAgdmFyIGR4ID0geDQgLSB4MTtcclxuICAgICAgICAgIHZhciBkeSA9IHk0IC0geTE7XHJcbiAgICAgICAgICByZXR1cm4gc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGNvZWZmaWNpZW50cyBvZiBhIEJlemllciBkZXJpdmF0aXZlLlxyXG4gICAgICAgIHZhciBheCA9IDkgKiAoeDIgLSB4MykgKyAzICogKHg0IC0geDEpLFxyXG4gICAgICAgICAgYnggPSA2ICogKHgxICsgeDMpIC0gMTIgKiB4MixcclxuICAgICAgICAgIGN4ID0gMyAqICh4MiAtIHgxKSxcclxuXHJcbiAgICAgICAgICBheSA9IDkgKiAoeTIgLSB5MykgKyAzICogKHk0IC0geTEpLFxyXG4gICAgICAgICAgYnkgPSA2ICogKHkxICsgeTMpIC0gMTIgKiB5MixcclxuICAgICAgICAgIGN5ID0gMyAqICh5MiAtIHkxKTtcclxuXHJcbiAgICAgICAgdmFyIGludGVncmFuZCA9IGZ1bmN0aW9uKHQpIHtcclxuICAgICAgICAgIC8vIENhbGN1bGF0ZSBxdWFkcmF0aWMgZXF1YXRpb25zIG9mIGRlcml2YXRpdmVzIGZvciB4IGFuZCB5XHJcbiAgICAgICAgICB2YXIgZHggPSAoYXggKiB0ICsgYngpICogdCArIGN4LFxyXG4gICAgICAgICAgICBkeSA9IChheSAqIHQgKyBieSkgKiB0ICsgY3k7XHJcbiAgICAgICAgICByZXR1cm4gc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGludGVncmF0ZShcclxuICAgICAgICAgIGludGVncmFuZCwgMCwgMSwgbGltaXQgfHwgVHdvLlV0aWxzLkN1cnZlLlJlY3Vyc2lvbkxpbWl0XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogSW50ZWdyYXRpb24gZm9yIGBnZXRDdXJ2ZUxlbmd0aGAgY2FsY3VsYXRpb25zLiBSZWZlcmVuY2VkIGZyb21cclxuICAgICAgICogUGFwZXIuanM6IGh0dHBzOi8vZ2l0aHViLmNvbS9wYXBlcmpzL3BhcGVyLmpzL2Jsb2IvbWFzdGVyL3NyYy91dGlsL051bWVyaWNhbC5qcyNMMTAxXHJcbiAgICAgICAqL1xyXG4gICAgICBpbnRlZ3JhdGU6IGZ1bmN0aW9uKGYsIGEsIGIsIG4pIHtcclxuICAgICAgICB2YXIgeCA9IFR3by5VdGlscy5DdXJ2ZS5hYnNjaXNzYXNbbiAtIDJdLFxyXG4gICAgICAgICAgdyA9IFR3by5VdGlscy5DdXJ2ZS53ZWlnaHRzW24gLSAyXSxcclxuICAgICAgICAgIEEgPSAwLjUgKiAoYiAtIGEpLFxyXG4gICAgICAgICAgQiA9IEEgKyBhLFxyXG4gICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICBtID0gKG4gKyAxKSA+PiAxLFxyXG4gICAgICAgICAgc3VtID0gbiAmIDEgPyB3W2krK10gKiBmKEIpIDogMDsgLy8gSGFuZGxlIG9kZCBuXHJcbiAgICAgICAgd2hpbGUgKGkgPCBtKSB7XHJcbiAgICAgICAgICB2YXIgQXggPSBBICogeFtpXTtcclxuICAgICAgICAgIHN1bSArPSB3W2krK10gKiAoZihCICsgQXgpICsgZihCIC0gQXgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIEEgKiBzdW07XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvKipcclxuICAgICAgICogQ3JlYXRlcyBhIHNldCBvZiBwb2ludHMgdGhhdCBoYXZlIHUsIHYgdmFsdWVzIGZvciBhbmNob3IgcG9zaXRpb25zXHJcbiAgICAgICAqL1xyXG4gICAgICBnZXRDdXJ2ZUZyb21Qb2ludHM6IGZ1bmN0aW9uKHBvaW50cywgY2xvc2VkKSB7XHJcblxyXG4gICAgICAgIHZhciBsID0gcG9pbnRzLmxlbmd0aCwgbGFzdCA9IGwgLSAxO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xyXG5cclxuICAgICAgICAgIHZhciBwb2ludCA9IHBvaW50c1tpXTtcclxuXHJcbiAgICAgICAgICBpZiAoIV8uaXNPYmplY3QocG9pbnQuY29udHJvbHMpKSB7XHJcbiAgICAgICAgICAgIFR3by5BbmNob3IuQXBwZW5kQ3VydmVQcm9wZXJ0aWVzKHBvaW50KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgcHJldiA9IGNsb3NlZCA/IG1vZChpIC0gMSwgbCkgOiBtYXgoaSAtIDEsIDApO1xyXG4gICAgICAgICAgdmFyIG5leHQgPSBjbG9zZWQgPyBtb2QoaSArIDEsIGwpIDogbWluKGkgKyAxLCBsYXN0KTtcclxuXHJcbiAgICAgICAgICB2YXIgYSA9IHBvaW50c1twcmV2XTtcclxuICAgICAgICAgIHZhciBiID0gcG9pbnQ7XHJcbiAgICAgICAgICB2YXIgYyA9IHBvaW50c1tuZXh0XTtcclxuICAgICAgICAgIGdldENvbnRyb2xQb2ludHMoYSwgYiwgYyk7XHJcblxyXG4gICAgICAgICAgYi5fY29tbWFuZCA9IGkgPT09IDAgPyBUd28uQ29tbWFuZHMubW92ZSA6IFR3by5Db21tYW5kcy5jdXJ2ZTtcclxuXHJcbiAgICAgICAgICBiLmNvbnRyb2xzLmxlZnQueCA9IF8uaXNOdW1iZXIoYi5jb250cm9scy5sZWZ0LngpID8gYi5jb250cm9scy5sZWZ0LnggOiBiLng7XHJcbiAgICAgICAgICBiLmNvbnRyb2xzLmxlZnQueSA9IF8uaXNOdW1iZXIoYi5jb250cm9scy5sZWZ0LnkpID8gYi5jb250cm9scy5sZWZ0LnkgOiBiLnk7XHJcblxyXG4gICAgICAgICAgYi5jb250cm9scy5yaWdodC54ID0gXy5pc051bWJlcihiLmNvbnRyb2xzLnJpZ2h0LngpID8gYi5jb250cm9scy5yaWdodC54IDogYi54O1xyXG4gICAgICAgICAgYi5jb250cm9scy5yaWdodC55ID0gXy5pc051bWJlcihiLmNvbnRyb2xzLnJpZ2h0LnkpID8gYi5jb250cm9scy5yaWdodC55IDogYi55O1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgLyoqXHJcbiAgICAgICAqIEdpdmVuIHRocmVlIGNvb3JkaW5hdGVzIHJldHVybiB0aGUgY29udHJvbCBwb2ludHMgZm9yIHRoZSBtaWRkbGUsIGIsXHJcbiAgICAgICAqIHZlcnRleC5cclxuICAgICAgICovXHJcbiAgICAgIGdldENvbnRyb2xQb2ludHM6IGZ1bmN0aW9uKGEsIGIsIGMpIHtcclxuXHJcbiAgICAgICAgdmFyIGExID0gYW5nbGVCZXR3ZWVuKGEsIGIpO1xyXG4gICAgICAgIHZhciBhMiA9IGFuZ2xlQmV0d2VlbihjLCBiKTtcclxuXHJcbiAgICAgICAgdmFyIGQxID0gZGlzdGFuY2VCZXR3ZWVuKGEsIGIpO1xyXG4gICAgICAgIHZhciBkMiA9IGRpc3RhbmNlQmV0d2VlbihjLCBiKTtcclxuXHJcbiAgICAgICAgdmFyIG1pZCA9IChhMSArIGEyKSAvIDI7XHJcblxyXG4gICAgICAgIC8vIFNvIHdlIGtub3cgd2hpY2ggYW5nbGUgY29ycmVzcG9uZHMgdG8gd2hpY2ggc2lkZS5cclxuXHJcbiAgICAgICAgYi51ID0gXy5pc09iamVjdChiLmNvbnRyb2xzLmxlZnQpID8gYi5jb250cm9scy5sZWZ0IDogbmV3IFR3by5WZWN0b3IoMCwgMCk7XHJcbiAgICAgICAgYi52ID0gXy5pc09iamVjdChiLmNvbnRyb2xzLnJpZ2h0KSA/IGIuY29udHJvbHMucmlnaHQgOiBuZXcgVHdvLlZlY3RvcigwLCAwKTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogSXNzdWUgNzNcclxuICAgICAgICBpZiAoZDEgPCAwLjAwMDEgfHwgZDIgPCAwLjAwMDEpIHtcclxuICAgICAgICAgIGlmICghYi5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgYi5jb250cm9scy5sZWZ0LmNvcHkoYik7XHJcbiAgICAgICAgICAgIGIuY29udHJvbHMucmlnaHQuY29weShiKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZDEgKj0gMC4zMzsgLy8gV2h5IDAuMzM/XHJcbiAgICAgICAgZDIgKj0gMC4zMztcclxuXHJcbiAgICAgICAgaWYgKGEyIDwgYTEpIHtcclxuICAgICAgICAgIG1pZCArPSBIQUxGX1BJO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBtaWQgLT0gSEFMRl9QSTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGIuY29udHJvbHMubGVmdC54ID0gY29zKG1pZCkgKiBkMTtcclxuICAgICAgICBiLmNvbnRyb2xzLmxlZnQueSA9IHNpbihtaWQpICogZDE7XHJcblxyXG4gICAgICAgIG1pZCAtPSBQSTtcclxuXHJcbiAgICAgICAgYi5jb250cm9scy5yaWdodC54ID0gY29zKG1pZCkgKiBkMjtcclxuICAgICAgICBiLmNvbnRyb2xzLnJpZ2h0LnkgPSBzaW4obWlkKSAqIGQyO1xyXG5cclxuICAgICAgICBpZiAoIWIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICBiLmNvbnRyb2xzLmxlZnQueCArPSBiLng7XHJcbiAgICAgICAgICBiLmNvbnRyb2xzLmxlZnQueSArPSBiLnk7XHJcbiAgICAgICAgICBiLmNvbnRyb2xzLnJpZ2h0LnggKz0gYi54O1xyXG4gICAgICAgICAgYi5jb250cm9scy5yaWdodC55ICs9IGIueTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBiO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBHZXQgdGhlIHJlZmxlY3Rpb24gb2YgYSBwb2ludCBcImJcIiBhYm91dCBwb2ludCBcImFcIi4gV2hlcmUgXCJhXCIgaXMgaW5cclxuICAgICAgICogYWJzb2x1dGUgc3BhY2UgYW5kIFwiYlwiIGlzIHJlbGF0aXZlIHRvIFwiYVwiLlxyXG4gICAgICAgKlxyXG4gICAgICAgKiBodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9pbXBsbm90ZS5odG1sI1BhdGhFbGVtZW50SW1wbGVtZW50YXRpb25Ob3Rlc1xyXG4gICAgICAgKi9cclxuICAgICAgZ2V0UmVmbGVjdGlvbjogZnVuY3Rpb24oYSwgYiwgcmVsYXRpdmUpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBUd28uVmVjdG9yKFxyXG4gICAgICAgICAgMiAqIGEueCAtIChiLnggKyBhLngpIC0gKHJlbGF0aXZlID8gYS54IDogMCksXHJcbiAgICAgICAgICAyICogYS55IC0gKGIueSArIGEueSkgLSAocmVsYXRpdmUgPyBhLnkgOiAwKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgZ2V0QW5jaG9yc0Zyb21BcmNEYXRhOiBmdW5jdGlvbihjZW50ZXIsIHhBeGlzUm90YXRpb24sIHJ4LCByeSwgdHMsIHRkLCBjY3cpIHtcclxuXHJcbiAgICAgICAgdmFyIG1hdHJpeCA9IG5ldyBUd28uTWF0cml4KClcclxuICAgICAgICAgIC50cmFuc2xhdGUoY2VudGVyLngsIGNlbnRlci55KVxyXG4gICAgICAgICAgLnJvdGF0ZSh4QXhpc1JvdGF0aW9uKTtcclxuXHJcbiAgICAgICAgdmFyIGwgPSBUd28uUmVzb2x1dGlvbjtcclxuXHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKF8ucmFuZ2UobCksIGZ1bmN0aW9uKGkpIHtcclxuXHJcbiAgICAgICAgICB2YXIgcGN0ID0gKGkgKyAxKSAvIGw7XHJcbiAgICAgICAgICBpZiAoISFjY3cpIHtcclxuICAgICAgICAgICAgcGN0ID0gMSAtIHBjdDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgdGhldGEgPSBwY3QgKiB0ZCArIHRzO1xyXG4gICAgICAgICAgdmFyIHggPSByeCAqIE1hdGguY29zKHRoZXRhKTtcclxuICAgICAgICAgIHZhciB5ID0gcnkgKiBNYXRoLnNpbih0aGV0YSk7XHJcblxyXG4gICAgICAgICAgLy8geCArPSBjZW50ZXIueDtcclxuICAgICAgICAgIC8vIHkgKz0gY2VudGVyLnk7XHJcblxyXG4gICAgICAgICAgdmFyIGFuY2hvciA9IG5ldyBUd28uQW5jaG9yKHgsIHkpO1xyXG4gICAgICAgICAgVHdvLkFuY2hvci5BcHBlbmRDdXJ2ZVByb3BlcnRpZXMoYW5jaG9yKTtcclxuICAgICAgICAgIGFuY2hvci5jb21tYW5kID0gVHdvLkNvbW1hbmRzLmxpbmU7XHJcblxyXG4gICAgICAgICAgLy8gVE9ETzogQ2FsY3VsYXRlIGNvbnRyb2wgcG9pbnRzIGhlcmUuLi5cclxuXHJcbiAgICAgICAgICByZXR1cm4gYW5jaG9yO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByYXRpb0JldHdlZW46IGZ1bmN0aW9uKEEsIEIpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIChBLnggKiBCLnggKyBBLnkgKiBCLnkpIC8gKEEubGVuZ3RoKCkgKiBCLmxlbmd0aCgpKTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBhbmdsZUJldHdlZW46IGZ1bmN0aW9uKEEsIEIpIHtcclxuXHJcbiAgICAgICAgdmFyIGR4LCBkeTtcclxuXHJcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkge1xyXG5cclxuICAgICAgICAgIGR4ID0gYXJndW1lbnRzWzBdIC0gYXJndW1lbnRzWzJdO1xyXG4gICAgICAgICAgZHkgPSBhcmd1bWVudHNbMV0gLSBhcmd1bWVudHNbM107XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGF0YW4yKGR5LCBkeCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZHggPSBBLnggLSBCLng7XHJcbiAgICAgICAgZHkgPSBBLnkgLSBCLnk7XHJcblxyXG4gICAgICAgIHJldHVybiBhdGFuMihkeSwgZHgpO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGRpc3RhbmNlQmV0d2VlblNxdWFyZWQ6IGZ1bmN0aW9uKHAxLCBwMikge1xyXG5cclxuICAgICAgICB2YXIgZHggPSBwMS54IC0gcDIueDtcclxuICAgICAgICB2YXIgZHkgPSBwMS55IC0gcDIueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIGRpc3RhbmNlQmV0d2VlbjogZnVuY3Rpb24ocDEsIHAyKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBzcXJ0KGRpc3RhbmNlQmV0d2VlblNxdWFyZWQocDEsIHAyKSk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgbGVycDogZnVuY3Rpb24oYSwgYiwgdCkge1xyXG4gICAgICAgIHJldHVybiB0ICogKGIgLSBhKSArIGE7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBBIHByZXR0eSBmYXN0IHRvRml4ZWQoMykgYWx0ZXJuYXRpdmVcclxuICAgICAgLy8gU2VlIGh0dHA6Ly9qc3BlcmYuY29tL3BhcnNlZmxvYXQtdG9maXhlZC12cy1tYXRoLXJvdW5kLzE4XHJcbiAgICAgIHRvRml4ZWQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih2ICogMTAwMCkgLyAxMDAwO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgbW9kOiBmdW5jdGlvbih2LCBsKSB7XHJcblxyXG4gICAgICAgIHdoaWxlICh2IDwgMCkge1xyXG4gICAgICAgICAgdiArPSBsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHYgJSBsO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBBcnJheSBsaWtlIGNvbGxlY3Rpb24gdGhhdCB0cmlnZ2VycyBpbnNlcnRlZCBhbmQgcmVtb3ZlZCBldmVudHNcclxuICAgICAgICogcmVtb3ZlZCA6IHBvcCAvIHNoaWZ0IC8gc3BsaWNlXHJcbiAgICAgICAqIGluc2VydGVkIDogcHVzaCAvIHVuc2hpZnQgLyBzcGxpY2UgKHdpdGggPiAyIGFyZ3VtZW50cylcclxuICAgICAgICovXHJcbiAgICAgIENvbGxlY3Rpb246IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICBBcnJheS5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHNbMF0gJiYgQXJyYXkuaXNBcnJheShhcmd1bWVudHNbMF0pKSB7XHJcbiAgICAgICAgICBBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLCBhcmd1bWVudHNbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBDdXN0b20gRXJyb3IgVGhyb3dpbmcgZm9yIFR3by5qc1xyXG5cclxuICAgICAgRXJyb3I6IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSAndHdvLmpzJztcclxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgRXZlbnRzOiB7XHJcblxyXG4gICAgICAgIG9uOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICAgIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xyXG4gICAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9ldmVudHNbbmFtZV0gfHwgKHRoaXMuX2V2ZW50c1tuYW1lXSA9IFtdKTtcclxuXHJcbiAgICAgICAgICBsaXN0LnB1c2goY2FsbGJhY2spO1xyXG5cclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvZmY6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoIW5hbWUgJiYgIWNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgbmFtZXMgPSBuYW1lID8gW25hbWVdIDogXy5rZXlzKHRoaXMuX2V2ZW50cyk7XHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcclxuICAgICAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9ldmVudHNbbmFtZV07XHJcblxyXG4gICAgICAgICAgICBpZiAoISFsaXN0KSB7XHJcbiAgICAgICAgICAgICAgdmFyIGV2ZW50cyA9IFtdO1xyXG4gICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGsgPSBsaXN0Lmxlbmd0aDsgaiA8IGs7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICB2YXIgZXYgPSBsaXN0W2pdO1xyXG4gICAgICAgICAgICAgICAgICBldiA9IGV2LmNhbGxiYWNrID8gZXYuY2FsbGJhY2sgOiBldjtcclxuICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldikge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50cy5wdXNoKGV2KTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSBldmVudHM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICAgICAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV07XHJcbiAgICAgICAgICBpZiAoZXZlbnRzKSB0cmlnZ2VyKHRoaXMsIGV2ZW50cywgYXJncyk7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBsaXN0ZW46IGZ1bmN0aW9uIChvYmosIG5hbWUsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGJvdW5kID0gdGhpcztcclxuXHJcbiAgICAgICAgICBpZiAob2JqKSB7XHJcbiAgICAgICAgICAgIHZhciBldiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseShib3VuZCwgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIGFkZCByZWZlcmVuY2VzIGFib3V0IHRoZSBvYmplY3QgdGhhdCBhc3NpZ25lZCB0aGlzIGxpc3RlbmVyXHJcbiAgICAgICAgICAgIGV2Lm9iaiA9IG9iajtcclxuICAgICAgICAgICAgZXYubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgICAgIGV2LmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcblxyXG4gICAgICAgICAgICBvYmoub24obmFtZSwgZXYpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBpZ25vcmU6IGZ1bmN0aW9uIChvYmosIG5hbWUsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgICAgb2JqLm9mZihuYW1lLCBjYWxsYmFjayk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9KVxyXG5cclxuICB9KTtcclxuXHJcbiAgVHdvLlV0aWxzLkV2ZW50cy5iaW5kID0gVHdvLlV0aWxzLkV2ZW50cy5vbjtcclxuICBUd28uVXRpbHMuRXZlbnRzLnVuYmluZCA9IFR3by5VdGlscy5FdmVudHMub2ZmO1xyXG5cclxuICB2YXIgdHJpZ2dlciA9IGZ1bmN0aW9uKG9iaiwgZXZlbnRzLCBhcmdzKSB7XHJcbiAgICB2YXIgbWV0aG9kO1xyXG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xyXG4gICAgY2FzZSAwOlxyXG4gICAgICBtZXRob2QgPSBmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgZXZlbnRzW2ldLmNhbGwob2JqLCBhcmdzWzBdKTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDE6XHJcbiAgICAgIG1ldGhvZCA9IGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBldmVudHNbaV0uY2FsbChvYmosIGFyZ3NbMF0sIGFyZ3NbMV0pO1xyXG4gICAgICB9O1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgMjpcclxuICAgICAgbWV0aG9kID0gZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGV2ZW50c1tpXS5jYWxsKG9iaiwgYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSk7XHJcbiAgICAgIH07XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAzOlxyXG4gICAgICBtZXRob2QgPSBmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgZXZlbnRzW2ldLmNhbGwob2JqLCBhcmdzWzBdLCBhcmdzWzFdLCBhcmdzWzJdLCBhcmdzWzNdKTtcclxuICAgICAgfTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICBtZXRob2QgPSBmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgZXZlbnRzW2ldLmFwcGx5KG9iaiwgYXJncyk7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBtZXRob2QoaSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgVHdvLlV0aWxzLkVycm9yLnByb3RvdHlwZSA9IG5ldyBFcnJvcigpO1xyXG4gIFR3by5VdGlscy5FcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUd28uVXRpbHMuRXJyb3I7XHJcblxyXG4gIFR3by5VdGlscy5Db2xsZWN0aW9uLnByb3RvdHlwZSA9IG5ldyBBcnJheSgpO1xyXG4gIFR3by5VdGlscy5Db2xsZWN0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFR3by5VdGlscy5Db2xsZWN0aW9uO1xyXG5cclxuICBfLmV4dGVuZChUd28uVXRpbHMuQ29sbGVjdGlvbi5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICBwb3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgcG9wcGVkID0gQXJyYXkucHJvdG90eXBlLnBvcC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5yZW1vdmUsIFtwb3BwZWRdKTtcclxuICAgICAgcmV0dXJuIHBvcHBlZDtcclxuICAgIH0sXHJcblxyXG4gICAgc2hpZnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgc2hpZnRlZCA9IEFycmF5LnByb3RvdHlwZS5zaGlmdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5yZW1vdmUsIFtzaGlmdGVkXSk7XHJcbiAgICAgIHJldHVybiBzaGlmdGVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBwdXNoOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHB1c2hlZCA9IEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmluc2VydCwgYXJndW1lbnRzKTtcclxuICAgICAgcmV0dXJuIHB1c2hlZDtcclxuICAgIH0sXHJcblxyXG4gICAgdW5zaGlmdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciB1bnNoaWZ0ZWQgPSBBcnJheS5wcm90b3R5cGUudW5zaGlmdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5pbnNlcnQsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHJldHVybiB1bnNoaWZ0ZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNwbGljZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBzcGxpY2VkID0gQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICB2YXIgaW5zZXJ0ZWQ7XHJcblxyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5yZW1vdmUsIHNwbGljZWQpO1xyXG5cclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XHJcbiAgICAgICAgaW5zZXJ0ZWQgPSB0aGlzLnNsaWNlKGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzBdICsgYXJndW1lbnRzLmxlbmd0aCAtIDIpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmluc2VydCwgaW5zZXJ0ZWQpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLm9yZGVyKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3BsaWNlZDtcclxuICAgIH0sXHJcblxyXG4gICAgc29ydDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIEFycmF5LnByb3RvdHlwZS5zb3J0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLm9yZGVyKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIHJldmVyc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBBcnJheS5wcm90b3R5cGUucmV2ZXJzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5vcmRlcik7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgLy8gTG9jYWxpemUgdXRpbHNcclxuXHJcbiAgdmFyIGRpc3RhbmNlQmV0d2VlbiA9IFR3by5VdGlscy5kaXN0YW5jZUJldHdlZW4sXHJcbiAgICBnZXRBbmNob3JzRnJvbUFyY0RhdGEgPSBUd28uVXRpbHMuZ2V0QW5jaG9yc0Zyb21BcmNEYXRhLFxyXG4gICAgZGlzdGFuY2VCZXR3ZWVuU3F1YXJlZCA9IFR3by5VdGlscy5kaXN0YW5jZUJldHdlZW5TcXVhcmVkLFxyXG4gICAgcmF0aW9CZXR3ZWVuID0gVHdvLlV0aWxzLnJhdGlvQmV0d2VlbixcclxuICAgIGFuZ2xlQmV0d2VlbiA9IFR3by5VdGlscy5hbmdsZUJldHdlZW4sXHJcbiAgICBnZXRDb250cm9sUG9pbnRzID0gVHdvLlV0aWxzLmdldENvbnRyb2xQb2ludHMsXHJcbiAgICBnZXRDdXJ2ZUZyb21Qb2ludHMgPSBUd28uVXRpbHMuZ2V0Q3VydmVGcm9tUG9pbnRzLFxyXG4gICAgc29sdmVTZWdtZW50SW50ZXJzZWN0aW9uID0gVHdvLlV0aWxzLnNvbHZlU2VnbWVudEludGVyc2VjdGlvbixcclxuICAgIGRlY291cGxlU2hhcGVzID0gVHdvLlV0aWxzLmRlY291cGxlU2hhcGVzLFxyXG4gICAgbW9kID0gVHdvLlV0aWxzLm1vZCxcclxuICAgIGdldEJhY2tpbmdTdG9yZVJhdGlvID0gVHdvLlV0aWxzLmdldEJhY2tpbmdTdG9yZVJhdGlvLFxyXG4gICAgZ2V0UG9pbnRPbkN1YmljQmV6aWVyID0gVHdvLlV0aWxzLmdldFBvaW50T25DdWJpY0JlemllcixcclxuICAgIGdldEN1cnZlTGVuZ3RoID0gVHdvLlV0aWxzLmdldEN1cnZlTGVuZ3RoLFxyXG4gICAgaW50ZWdyYXRlID0gVHdvLlV0aWxzLmludGVncmF0ZSxcclxuICAgIGdldFJlZmxlY3Rpb24gPSBUd28uVXRpbHMuZ2V0UmVmbGVjdGlvbjtcclxuXHJcbiAgXy5leHRlbmQoVHdvLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIGFwcGVuZFRvOiBmdW5jdGlvbihlbGVtKSB7XHJcblxyXG4gICAgICBlbGVtLmFwcGVuZENoaWxkKHRoaXMucmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcGxheTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBUd28uVXRpbHMuc2V0UGxheWluZy5jYWxsKHRoaXMsIHRydWUpO1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMucGxheSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBwYXVzZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLnBsYXlpbmcgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLnBhdXNlKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXBkYXRlIHBvc2l0aW9ucyBhbmQgY2FsY3VsYXRpb25zIGluIG9uZSBwYXNzIGJlZm9yZSByZW5kZXJpbmcuXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgYW5pbWF0ZWQgPSAhIXRoaXMuX2xhc3RGcmFtZTtcclxuICAgICAgdmFyIG5vdyA9IHBlcmYubm93KCk7XHJcblxyXG4gICAgICB0aGlzLmZyYW1lQ291bnQrKztcclxuXHJcbiAgICAgIGlmIChhbmltYXRlZCkge1xyXG4gICAgICAgIHRoaXMudGltZURlbHRhID0gcGFyc2VGbG9hdCgobm93IC0gdGhpcy5fbGFzdEZyYW1lKS50b0ZpeGVkKDMpKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLl9sYXN0RnJhbWUgPSBub3c7XHJcblxyXG4gICAgICB2YXIgd2lkdGggPSB0aGlzLndpZHRoO1xyXG4gICAgICB2YXIgaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XHJcbiAgICAgIHZhciByZW5kZXJlciA9IHRoaXMucmVuZGVyZXI7XHJcblxyXG4gICAgICAvLyBVcGRhdGUgd2lkdGggLyBoZWlnaHQgZm9yIHRoZSByZW5kZXJlclxyXG4gICAgICBpZiAod2lkdGggIT09IHJlbmRlcmVyLndpZHRoIHx8IGhlaWdodCAhPT0gcmVuZGVyZXIuaGVpZ2h0KSB7XHJcbiAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0LCB0aGlzLnJhdGlvKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMudXBkYXRlLCB0aGlzLmZyYW1lQ291bnQsIHRoaXMudGltZURlbHRhKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlcigpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW5kZXIgYWxsIGRyYXdhYmxlIC0gdmlzaWJsZSBvYmplY3RzIG9mIHRoZSBzY2VuZS5cclxuICAgICAqL1xyXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKCk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5yZW5kZXIsIHRoaXMuZnJhbWVDb3VudCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlbmllbmNlIE1ldGhvZHNcclxuICAgICAqL1xyXG5cclxuICAgIGFkZDogZnVuY3Rpb24obykge1xyXG5cclxuICAgICAgdmFyIG9iamVjdHMgPSBvO1xyXG4gICAgICBpZiAoIShvYmplY3RzIGluc3RhbmNlb2YgQXJyYXkpKSB7XHJcbiAgICAgICAgb2JqZWN0cyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnNjZW5lLmFkZChvYmplY3RzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKG8pIHtcclxuXHJcbiAgICAgIHZhciBvYmplY3RzID0gbztcclxuICAgICAgaWYgKCEob2JqZWN0cyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgIG9iamVjdHMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zY2VuZS5yZW1vdmUob2JqZWN0cyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuc2NlbmUucmVtb3ZlKF8udG9BcnJheSh0aGlzLnNjZW5lLmNoaWxkcmVuKSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUxpbmU6IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyKSB7XHJcblxyXG4gICAgICB2YXIgbGluZSA9IG5ldyBUd28uTGluZSh4MSwgeTEsIHgyLCB5Mik7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGxpbmUpO1xyXG5cclxuICAgICAgcmV0dXJuIGxpbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlUmVjdGFuZ2xlOiBmdW5jdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XHJcblxyXG4gICAgICB2YXIgcmVjdCA9IG5ldyBUd28uUmVjdGFuZ2xlKHgsIHksIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChyZWN0KTtcclxuXHJcbiAgICAgIHJldHVybiByZWN0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVJvdW5kZWRSZWN0YW5nbGU6IGZ1bmN0aW9uKHgsIHksIHdpZHRoLCBoZWlnaHQsIHNpZGVzKSB7XHJcblxyXG4gICAgICB2YXIgcmVjdCA9IG5ldyBUd28uUm91bmRlZFJlY3RhbmdsZSh4LCB5LCB3aWR0aCwgaGVpZ2h0LCBzaWRlcyk7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHJlY3QpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlY3Q7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBtYWtlQ2lyY2xlOiBmdW5jdGlvbihveCwgb3ksIHIpIHtcclxuXHJcbiAgICAgIHZhciBjaXJjbGUgPSBuZXcgVHdvLkNpcmNsZShveCwgb3ksIHIpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChjaXJjbGUpO1xyXG5cclxuICAgICAgcmV0dXJuIGNpcmNsZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VFbGxpcHNlOiBmdW5jdGlvbihveCwgb3ksIHJ4LCByeSkge1xyXG5cclxuICAgICAgdmFyIGVsbGlwc2UgPSBuZXcgVHdvLkVsbGlwc2Uob3gsIG95LCByeCwgcnkpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChlbGxpcHNlKTtcclxuXHJcbiAgICAgIHJldHVybiBlbGxpcHNlO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVN0YXI6IGZ1bmN0aW9uKG94LCBveSwgb3IsIGlyLCBzaWRlcykge1xyXG5cclxuICAgICAgdmFyIHN0YXIgPSBuZXcgVHdvLlN0YXIob3gsIG95LCBvciwgaXIsIHNpZGVzKTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQoc3Rhcik7XHJcblxyXG4gICAgICByZXR1cm4gc3RhcjtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VDdXJ2ZTogZnVuY3Rpb24ocCkge1xyXG5cclxuICAgICAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoLCBwb2ludHMgPSBwO1xyXG4gICAgICBpZiAoIV8uaXNBcnJheShwKSkge1xyXG4gICAgICAgIHBvaW50cyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSs9Mikge1xyXG4gICAgICAgICAgdmFyIHggPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICBpZiAoIV8uaXNOdW1iZXIoeCkpIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB2YXIgeSA9IGFyZ3VtZW50c1tpICsgMV07XHJcbiAgICAgICAgICBwb2ludHMucHVzaChuZXcgVHdvLkFuY2hvcih4LCB5KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgbGFzdCA9IGFyZ3VtZW50c1tsIC0gMV07XHJcbiAgICAgIHZhciBjdXJ2ZSA9IG5ldyBUd28uUGF0aChwb2ludHMsICEoXy5pc0Jvb2xlYW4obGFzdCkgPyBsYXN0IDogdW5kZWZpbmVkKSwgdHJ1ZSk7XHJcbiAgICAgIHZhciByZWN0ID0gY3VydmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgIGN1cnZlLmNlbnRlcigpLnRyYW5zbGF0aW9uXHJcbiAgICAgICAgLnNldChyZWN0LmxlZnQgKyByZWN0LndpZHRoIC8gMiwgcmVjdC50b3AgKyByZWN0LmhlaWdodCAvIDIpO1xyXG5cclxuICAgICAgdGhpcy5zY2VuZS5hZGQoY3VydmUpO1xyXG5cclxuICAgICAgcmV0dXJuIGN1cnZlO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVBvbHlnb246IGZ1bmN0aW9uKG94LCBveSwgciwgc2lkZXMpIHtcclxuXHJcbiAgICAgIHZhciBwb2x5ID0gbmV3IFR3by5Qb2x5Z29uKG94LCBveSwgciwgc2lkZXMpO1xyXG4gICAgICB0aGlzLnNjZW5lLmFkZChwb2x5KTtcclxuXHJcbiAgICAgIHJldHVybiBwb2x5O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLypcclxuICAgICogTWFrZSBhbiBBcmMgU2VnbWVudFxyXG4gICAgKi9cclxuXHJcbiAgICBtYWtlQXJjU2VnbWVudDogZnVuY3Rpb24ob3gsIG95LCBpciwgb3IsIHNhLCBlYSwgcmVzKSB7XHJcbiAgICAgIHZhciBhcmNTZWdtZW50ID0gbmV3IFR3by5BcmNTZWdtZW50KG94LCBveSwgaXIsIG9yLCBzYSwgZWEsIHJlcyk7XHJcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGFyY1NlZ21lbnQpO1xyXG4gICAgICByZXR1cm4gYXJjU2VnbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gbWFrZSBhbmQgZHJhdyBhIFR3by5QYXRoLlxyXG4gICAgICovXHJcbiAgICBtYWtlUGF0aDogZnVuY3Rpb24ocCkge1xyXG5cclxuICAgICAgdmFyIGwgPSBhcmd1bWVudHMubGVuZ3RoLCBwb2ludHMgPSBwO1xyXG4gICAgICBpZiAoIV8uaXNBcnJheShwKSkge1xyXG4gICAgICAgIHBvaW50cyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSs9Mikge1xyXG4gICAgICAgICAgdmFyIHggPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICBpZiAoIV8uaXNOdW1iZXIoeCkpIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB2YXIgeSA9IGFyZ3VtZW50c1tpICsgMV07XHJcbiAgICAgICAgICBwb2ludHMucHVzaChuZXcgVHdvLkFuY2hvcih4LCB5KSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgbGFzdCA9IGFyZ3VtZW50c1tsIC0gMV07XHJcbiAgICAgIHZhciBwYXRoID0gbmV3IFR3by5QYXRoKHBvaW50cywgIShfLmlzQm9vbGVhbihsYXN0KSA/IGxhc3QgOiB1bmRlZmluZWQpKTtcclxuICAgICAgdmFyIHJlY3QgPSBwYXRoLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICBwYXRoLmNlbnRlcigpLnRyYW5zbGF0aW9uXHJcbiAgICAgICAgLnNldChyZWN0LmxlZnQgKyByZWN0LndpZHRoIC8gMiwgcmVjdC50b3AgKyByZWN0LmhlaWdodCAvIDIpO1xyXG5cclxuICAgICAgdGhpcy5zY2VuZS5hZGQocGF0aCk7XHJcblxyXG4gICAgICByZXR1cm4gcGF0aDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIG1ha2UgYW5kIGFkZCBhIFR3by5UZXh0LlxyXG4gICAgICovXHJcbiAgICBtYWtlVGV4dDogZnVuY3Rpb24obWVzc2FnZSwgeCwgeSwgc3R5bGVzKSB7XHJcbiAgICAgIHZhciB0ZXh0ID0gbmV3IFR3by5UZXh0KG1lc3NhZ2UsIHgsIHksIHN0eWxlcyk7XHJcbiAgICAgIHRoaXMuYWRkKHRleHQpO1xyXG4gICAgICByZXR1cm4gdGV4dDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gbWFrZSBhbmQgYWRkIGEgVHdvLkxpbmVhckdyYWRpZW50LlxyXG4gICAgICovXHJcbiAgICBtYWtlTGluZWFyR3JhZGllbnQ6IGZ1bmN0aW9uKHgxLCB5MSwgeDIsIHkyIC8qIHN0b3BzICovKSB7XHJcblxyXG4gICAgICB2YXIgc3RvcHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgNCk7XHJcbiAgICAgIHZhciBncmFkaWVudCA9IG5ldyBUd28uTGluZWFyR3JhZGllbnQoeDEsIHkxLCB4MiwgeTIsIHN0b3BzKTtcclxuXHJcbiAgICAgIHRoaXMuYWRkKGdyYWRpZW50KTtcclxuXHJcbiAgICAgIHJldHVybiBncmFkaWVudDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIG1ha2UgYW5kIGFkZCBhIFR3by5SYWRpYWxHcmFkaWVudC5cclxuICAgICAqL1xyXG4gICAgbWFrZVJhZGlhbEdyYWRpZW50OiBmdW5jdGlvbih4MSwgeTEsIHIgLyogc3RvcHMgKi8pIHtcclxuXHJcbiAgICAgIHZhciBzdG9wcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAzKTtcclxuICAgICAgdmFyIGdyYWRpZW50ID0gbmV3IFR3by5SYWRpYWxHcmFkaWVudCh4MSwgeTEsIHIsIHN0b3BzKTtcclxuXHJcbiAgICAgIHRoaXMuYWRkKGdyYWRpZW50KTtcclxuXHJcbiAgICAgIHJldHVybiBncmFkaWVudDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VTcHJpdGU6IGZ1bmN0aW9uKHBhdGgsIHgsIHksIGNvbHMsIHJvd3MsIGZyYW1lUmF0ZSwgYXV0b3N0YXJ0KSB7XHJcblxyXG4gICAgICB2YXIgc3ByaXRlID0gbmV3IFR3by5TcHJpdGUocGF0aCwgeCwgeSwgY29scywgcm93cywgZnJhbWVSYXRlKTtcclxuICAgICAgaWYgKCEhYXV0b3N0YXJ0KSB7XHJcbiAgICAgICAgc3ByaXRlLnBsYXkoKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmFkZChzcHJpdGUpO1xyXG5cclxuICAgICAgcmV0dXJuIHNwcml0ZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIG1ha2VJbWFnZVNlcXVlbmNlOiBmdW5jdGlvbihwYXRocywgeCwgeSwgZnJhbWVSYXRlLCBhdXRvc3RhcnQpIHtcclxuXHJcbiAgICAgIHZhciBpbWFnZVNlcXVlbmNlID0gbmV3IFR3by5JbWFnZVNlcXVlbmNlKHBhdGhzLCB4LCB5LCBmcmFtZVJhdGUpO1xyXG4gICAgICBpZiAoISFhdXRvc3RhcnQpIHtcclxuICAgICAgICBpbWFnZVNlcXVlbmNlLnBsYXkoKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmFkZChpbWFnZVNlcXVlbmNlKTtcclxuXHJcbiAgICAgIHJldHVybiBpbWFnZVNlcXVlbmNlO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZVRleHR1cmU6IGZ1bmN0aW9uKHBhdGgsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICB2YXIgdGV4dHVyZSA9IG5ldyBUd28uVGV4dHVyZShwYXRoLCBjYWxsYmFjayk7XHJcbiAgICAgIHJldHVybiB0ZXh0dXJlO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbWFrZUdyb3VwOiBmdW5jdGlvbihvKSB7XHJcblxyXG4gICAgICB2YXIgb2JqZWN0cyA9IG87XHJcbiAgICAgIGlmICghKG9iamVjdHMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICBvYmplY3RzID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBncm91cCA9IG5ldyBUd28uR3JvdXAoKTtcclxuICAgICAgdGhpcy5zY2VuZS5hZGQoZ3JvdXApO1xyXG4gICAgICBncm91cC5hZGQob2JqZWN0cyk7XHJcblxyXG4gICAgICByZXR1cm4gZ3JvdXA7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEludGVycHJldCBhbiBTVkcgTm9kZSBhbmQgYWRkIGl0IHRvIHRoaXMgaW5zdGFuY2UncyBzY2VuZS4gVGhlXHJcbiAgICAgKiBkaXN0aW5jdGlvbiBzaG91bGQgYmUgbWFkZSB0aGF0IHRoaXMgZG9lc24ndCBgaW1wb3J0YCBzdmcncywgaXQgc29sZWx5XHJcbiAgICAgKiBpbnRlcnByZXRzIHRoZW0gaW50byBzb21ldGhpbmcgY29tcGF0aWJsZSBmb3IgVHdvLmpzIOKAlMKgdGhpcyBpcyBzbGlnaHRseVxyXG4gICAgICogZGlmZmVyZW50IHRoYW4gYSBkaXJlY3QgdHJhbnNjcmlwdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3ZnTm9kZSAtIFRoZSBub2RlIHRvIGJlIHBhcnNlZFxyXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBzaGFsbG93IC0gRG9uJ3QgY3JlYXRlIGEgdG9wLW1vc3QgZ3JvdXAgYnV0XHJcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcGVuZCBhbGwgY29udGVudHMgZGlyZWN0bHlcclxuICAgICAqL1xyXG4gICAgaW50ZXJwcmV0OiBmdW5jdGlvbihzdmdOb2RlLCBzaGFsbG93KSB7XHJcblxyXG4gICAgICB2YXIgdGFnID0gc3ZnTm9kZS50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICBpZiAoISh0YWcgaW4gVHdvLlV0aWxzLnJlYWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBub2RlID0gVHdvLlV0aWxzLnJlYWRbdGFnXS5jYWxsKHRoaXMsIHN2Z05vZGUpO1xyXG5cclxuICAgICAgaWYgKHNoYWxsb3cgJiYgbm9kZSBpbnN0YW5jZW9mIFR3by5Hcm91cCkge1xyXG4gICAgICAgIHRoaXMuYWRkKG5vZGUuY2hpbGRyZW4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuYWRkKG5vZGUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbm9kZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTG9hZCBhbiBTVkcgZmlsZSAvIHRleHQgYW5kIGludGVycHJldC5cclxuICAgICAqL1xyXG4gICAgbG9hZDogZnVuY3Rpb24odGV4dCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgIHZhciBub2RlcyA9IFtdLCBlbGVtLCBpO1xyXG5cclxuICAgICAgaWYgKC8uKlxcLnN2Zy9pZy50ZXN0KHRleHQpKSB7XHJcblxyXG4gICAgICAgIFR3by5VdGlscy54aHIodGV4dCwgXy5iaW5kKGZ1bmN0aW9uKGRhdGEpIHtcclxuXHJcbiAgICAgICAgICBkb20udGVtcC5pbm5lckhUTUwgPSBkYXRhO1xyXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGRvbS50ZW1wLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGVsZW0gPSBkb20udGVtcC5jaGlsZHJlbltpXTtcclxuICAgICAgICAgICAgbm9kZXMucHVzaCh0aGlzLmludGVycHJldChlbGVtKSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY2FsbGJhY2sobm9kZXMubGVuZ3RoIDw9IDEgPyBub2Rlc1swXSA6IG5vZGVzLFxyXG4gICAgICAgICAgICBkb20udGVtcC5jaGlsZHJlbi5sZW5ndGggPD0gMSA/IGRvbS50ZW1wLmNoaWxkcmVuWzBdIDogZG9tLnRlbXAuY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICB9LCB0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgZG9tLnRlbXAuaW5uZXJIVE1MID0gdGV4dDtcclxuICAgICAgZm9yIChpID0gMDsgaSA8IGRvbS50ZW1wLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgZWxlbSA9IGRvbS50ZW1wLmNoaWxkcmVuW2ldO1xyXG4gICAgICAgIG5vZGVzLnB1c2godGhpcy5pbnRlcnByZXQoZWxlbSkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjYWxsYmFjayhub2Rlcy5sZW5ndGggPD0gMSA/IG5vZGVzWzBdIDogbm9kZXMsXHJcbiAgICAgICAgZG9tLnRlbXAuY2hpbGRyZW4ubGVuZ3RoIDw9IDEgPyBkb20udGVtcC5jaGlsZHJlblswXSA6IGRvbS50ZW1wLmNoaWxkcmVuKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIGZpdFRvV2luZG93KCkge1xyXG5cclxuICAgIHZhciB3ciA9IGRvY3VtZW50LmJvZHkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgdmFyIHdpZHRoID0gdGhpcy53aWR0aCA9IHdyLndpZHRoO1xyXG4gICAgdmFyIGhlaWdodCA9IHRoaXMuaGVpZ2h0ID0gd3IuaGVpZ2h0O1xyXG5cclxuICAgIHRoaXMucmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0LCB0aGlzLnJhdGlvKTtcclxuICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLnJlc2l6ZSwgd2lkdGgsIGhlaWdodCk7XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gUmVxdWVzdCBBbmltYXRpb24gRnJhbWVcclxuXHJcbiAgdmFyIHJhZiA9IGRvbS5nZXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKTtcclxuXHJcbiAgZnVuY3Rpb24gbG9vcCgpIHtcclxuXHJcbiAgICByYWYobG9vcCk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUd28uSW5zdGFuY2VzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciB0ID0gVHdvLkluc3RhbmNlc1tpXTtcclxuICAgICAgaWYgKHQucGxheWluZykge1xyXG4gICAgICAgIHQudXBkYXRlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICBkZWZpbmUoJ3R3bycsIFtdLCBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIFR3bztcclxuICAgIH0pO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUd287XHJcbiAgfVxyXG5cclxuICByZXR1cm4gVHdvO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBSZWdpc3RyeSA9IFR3by5SZWdpc3RyeSA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHRoaXMubWFwID0ge307XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFJlZ2lzdHJ5LCB7XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChSZWdpc3RyeS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKGlkLCBvYmopIHtcclxuICAgICAgdGhpcy5tYXBbaWRdID0gb2JqO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICBkZWxldGUgdGhpcy5tYXBbaWRdO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0OiBmdW5jdGlvbihpZCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5tYXBbaWRdO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb250YWluczogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgcmV0dXJuIGlkIGluIHRoaXMubWFwO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgVmVjdG9yID0gVHdvLlZlY3RvciA9IGZ1bmN0aW9uKHgsIHkpIHtcclxuXHJcbiAgICB0aGlzLnggPSB4IHx8IDA7XHJcbiAgICB0aGlzLnkgPSB5IHx8IDA7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFZlY3Rvciwge1xyXG5cclxuICAgIHplcm86IG5ldyBUd28uVmVjdG9yKClcclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFZlY3Rvci5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgdGhpcy54ID0geDtcclxuICAgICAgdGhpcy55ID0geTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHk6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy54ID0gdi54O1xyXG4gICAgICB0aGlzLnkgPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMueCA9IDA7XHJcbiAgICAgIHRoaXMueSA9IDA7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMueCwgdGhpcy55KTtcclxuICAgIH0sXHJcblxyXG4gICAgYWRkOiBmdW5jdGlvbih2MSwgdjIpIHtcclxuICAgICAgdGhpcy54ID0gdjEueCArIHYyLng7XHJcbiAgICAgIHRoaXMueSA9IHYxLnkgKyB2Mi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgYWRkU2VsZjogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLnggKz0gdi54O1xyXG4gICAgICB0aGlzLnkgKz0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgc3ViOiBmdW5jdGlvbih2MSwgdjIpIHtcclxuICAgICAgdGhpcy54ID0gdjEueCAtIHYyLng7XHJcbiAgICAgIHRoaXMueSA9IHYxLnkgLSB2Mi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgc3ViU2VsZjogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLnggLT0gdi54O1xyXG4gICAgICB0aGlzLnkgLT0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgbXVsdGlwbHlTZWxmOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMueCAqPSB2Lng7XHJcbiAgICAgIHRoaXMueSAqPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBtdWx0aXBseVNjYWxhcjogZnVuY3Rpb24ocykge1xyXG4gICAgICB0aGlzLnggKj0gcztcclxuICAgICAgdGhpcy55ICo9IHM7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBkaXZpZGVTY2FsYXI6IGZ1bmN0aW9uKHMpIHtcclxuICAgICAgaWYgKHMpIHtcclxuICAgICAgICB0aGlzLnggLz0gcztcclxuICAgICAgICB0aGlzLnkgLz0gcztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLnNldCgwLCAwKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgbmVnYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHlTY2FsYXIoLTEpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb3Q6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcclxuICAgIH0sXHJcblxyXG4gICAgbGVuZ3RoU3F1YXJlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5sZW5ndGhTcXVhcmVkKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3JtYWxpemU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5kaXZpZGVTY2FsYXIodGhpcy5sZW5ndGgoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRpc3RhbmNlVG86IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmRpc3RhbmNlVG9TcXVhcmVkKHYpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGlzdGFuY2VUb1NxdWFyZWQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdmFyIGR4ID0gdGhpcy54IC0gdi54LFxyXG4gICAgICAgICAgZHkgPSB0aGlzLnkgLSB2Lnk7XHJcbiAgICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0TGVuZ3RoOiBmdW5jdGlvbihsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm5vcm1hbGl6ZSgpLm11bHRpcGx5U2NhbGFyKGwpO1xyXG4gICAgfSxcclxuXHJcbiAgICBlcXVhbHM6IGZ1bmN0aW9uKHYsIGVwcykge1xyXG4gICAgICBlcHMgPSAodHlwZW9mIGVwcyA9PT0gJ3VuZGVmaW5lZCcpID8gIDAuMDAwMSA6IGVwcztcclxuICAgICAgcmV0dXJuICh0aGlzLmRpc3RhbmNlVG8odikgPCBlcHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsZXJwOiBmdW5jdGlvbih2LCB0KSB7XHJcbiAgICAgIHZhciB4ID0gKHYueCAtIHRoaXMueCkgKiB0ICsgdGhpcy54O1xyXG4gICAgICB2YXIgeSA9ICh2LnkgLSB0aGlzLnkpICogdCArIHRoaXMueTtcclxuICAgICAgcmV0dXJuIHRoaXMuc2V0KHgsIHkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc1plcm86IGZ1bmN0aW9uKGVwcykge1xyXG4gICAgICBlcHMgPSAodHlwZW9mIGVwcyA9PT0gJ3VuZGVmaW5lZCcpID8gIDAuMDAwMSA6IGVwcztcclxuICAgICAgcmV0dXJuICh0aGlzLmxlbmd0aCgpIDwgZXBzKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy54ICsgJywgJyArIHRoaXMueTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4geyB4OiB0aGlzLngsIHk6IHRoaXMueSB9O1xyXG4gICAgfSxcclxuXHJcbiAgICByb3RhdGU6IGZ1bmN0aW9uIChyYWRpYW5zKSB7XHJcbiAgICAgIHZhciBjb3MgPSBNYXRoLmNvcyhyYWRpYW5zKTtcclxuICAgICAgdmFyIHNpbiA9IE1hdGguc2luKHJhZGlhbnMpO1xyXG4gICAgICB0aGlzLnggPSB0aGlzLnggKiBjb3MgLSB0aGlzLnkgKiBzaW47XHJcbiAgICAgIHRoaXMueSA9IHRoaXMueCAqIHNpbiArIHRoaXMueSAqIGNvcztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICB2YXIgQm91bmRQcm90byA9IHtcclxuXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgdGhpcy5feCA9IHg7XHJcbiAgICAgIHRoaXMuX3kgPSB5O1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY29weTogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLl94ID0gdi54O1xyXG4gICAgICB0aGlzLl95ID0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl94ID0gMDtcclxuICAgICAgdGhpcy5feSA9IDA7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVmVjdG9yKHRoaXMuX3gsIHRoaXMuX3kpO1xyXG4gICAgfSxcclxuXHJcbiAgICBhZGQ6IGZ1bmN0aW9uKHYxLCB2Mikge1xyXG4gICAgICB0aGlzLl94ID0gdjEueCArIHYyLng7XHJcbiAgICAgIHRoaXMuX3kgPSB2MS55ICsgdjIueTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZFNlbGY6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdGhpcy5feCArPSB2Lng7XHJcbiAgICAgIHRoaXMuX3kgKz0gdi55O1xyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3ViOiBmdW5jdGlvbih2MSwgdjIpIHtcclxuICAgICAgdGhpcy5feCA9IHYxLnggLSB2Mi54O1xyXG4gICAgICB0aGlzLl95ID0gdjEueSAtIHYyLnk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdWJTZWxmOiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMuX3ggLT0gdi54O1xyXG4gICAgICB0aGlzLl95IC09IHYueTtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG11bHRpcGx5U2VsZjogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLl94ICo9IHYueDtcclxuICAgICAgdGhpcy5feSAqPSB2Lnk7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtdWx0aXBseVNjYWxhcjogZnVuY3Rpb24ocykge1xyXG4gICAgICB0aGlzLl94ICo9IHM7XHJcbiAgICAgIHRoaXMuX3kgKj0gcztcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRpdmlkZVNjYWxhcjogZnVuY3Rpb24ocykge1xyXG4gICAgICBpZiAocykge1xyXG4gICAgICAgIHRoaXMuX3ggLz0gcztcclxuICAgICAgICB0aGlzLl95IC89IHM7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuY2xlYXIoKTtcclxuICAgIH0sXHJcblxyXG4gICAgbmVnYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHlTY2FsYXIoLTEpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkb3Q6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3ggKiB2LnggKyB0aGlzLl95ICogdi55O1xyXG4gICAgfSxcclxuXHJcbiAgICBsZW5ndGhTcXVhcmVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3ggKiB0aGlzLl94ICsgdGhpcy5feSAqIHRoaXMuX3k7XHJcbiAgICB9LFxyXG5cclxuICAgIGxlbmd0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5sZW5ndGhTcXVhcmVkKCkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBub3JtYWxpemU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5kaXZpZGVTY2FsYXIodGhpcy5sZW5ndGgoKSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRpc3RhbmNlVG86IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmRpc3RhbmNlVG9TcXVhcmVkKHYpKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGlzdGFuY2VUb1NxdWFyZWQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgdmFyIGR4ID0gdGhpcy5feCAtIHYueCxcclxuICAgICAgICAgIGR5ID0gdGhpcy5feSAtIHYueTtcclxuICAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRMZW5ndGg6IGZ1bmN0aW9uKGwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubm9ybWFsaXplKCkubXVsdGlwbHlTY2FsYXIobCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGVxdWFsczogZnVuY3Rpb24odiwgZXBzKSB7XHJcbiAgICAgIGVwcyA9ICh0eXBlb2YgZXBzID09PSAndW5kZWZpbmVkJykgPyAgMC4wMDAxIDogZXBzO1xyXG4gICAgICByZXR1cm4gKHRoaXMuZGlzdGFuY2VUbyh2KSA8IGVwcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxlcnA6IGZ1bmN0aW9uKHYsIHQpIHtcclxuICAgICAgdmFyIHggPSAodi54IC0gdGhpcy5feCkgKiB0ICsgdGhpcy5feDtcclxuICAgICAgdmFyIHkgPSAodi55IC0gdGhpcy5feSkgKiB0ICsgdGhpcy5feTtcclxuICAgICAgcmV0dXJuIHRoaXMuc2V0KHgsIHkpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc1plcm86IGZ1bmN0aW9uKGVwcykge1xyXG4gICAgICBlcHMgPSAodHlwZW9mIGVwcyA9PT0gJ3VuZGVmaW5lZCcpID8gIDAuMDAwMSA6IGVwcztcclxuICAgICAgcmV0dXJuICh0aGlzLmxlbmd0aCgpIDwgZXBzKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5feCArICcsICcgKyB0aGlzLl95O1xyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB7IHg6IHRoaXMuX3gsIHk6IHRoaXMuX3kgfTtcclxuICAgIH0sXHJcblxyXG4gICAgcm90YXRlOiBmdW5jdGlvbiAocmFkaWFucykge1xyXG4gICAgICB2YXIgY29zID0gTWF0aC5jb3MocmFkaWFucyk7XHJcbiAgICAgIHZhciBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKTtcclxuICAgICAgdGhpcy5feCA9IHRoaXMuX3ggKiBjb3MgLSB0aGlzLl95ICogc2luO1xyXG4gICAgICB0aGlzLl95ID0gdGhpcy5feCAqIHNpbiArIHRoaXMuX3kgKiBjb3M7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICB2YXIgeGdzID0ge1xyXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl94O1xyXG4gICAgfSxcclxuICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICB0aGlzLl94ID0gdjtcclxuICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlLCAneCcpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHZhciB5Z3MgPSB7XHJcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3k7XHJcbiAgICB9LFxyXG4gICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgIHRoaXMuX3kgPSB2O1xyXG4gICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UsICd5Jyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogT3ZlcnJpZGUgQmFja2JvbmUgYmluZCAvIG9uIGluIG9yZGVyIHRvIGFkZCBwcm9wZXJseSBicm9hZGNhc3RpbmcuXHJcbiAgICogVGhpcyBhbGxvd3MgVHdvLlZlY3RvciB0byBub3QgYnJvYWRjYXN0IGV2ZW50cyB1bmxlc3MgZXZlbnQgbGlzdGVuZXJzXHJcbiAgICogYXJlIGV4cGxpY2l0eSBib3VuZCB0byBpdC5cclxuICAgKi9cclxuXHJcbiAgVHdvLlZlY3Rvci5wcm90b3R5cGUuYmluZCA9IFR3by5WZWN0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgaWYgKCF0aGlzLl9ib3VuZCkge1xyXG4gICAgICB0aGlzLl94ID0gdGhpcy54O1xyXG4gICAgICB0aGlzLl95ID0gdGhpcy55O1xyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3gnLCB4Z3MpO1xyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3knLCB5Z3MpO1xyXG4gICAgICBfLmV4dGVuZCh0aGlzLCBCb3VuZFByb3RvKTtcclxuICAgICAgdGhpcy5fYm91bmQgPSB0cnVlOyAvLyBSZXNlcnZlZCBmb3IgZXZlbnQgaW5pdGlhbGl6YXRpb24gY2hlY2tcclxuICAgIH1cclxuXHJcbiAgICBUd28uVXRpbHMuRXZlbnRzLmJpbmQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgfTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIC8vIExvY2FsaXplZCB2YXJpYWJsZXNcclxuICB2YXIgY29tbWFuZHMgPSBUd28uQ29tbWFuZHM7XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIC8qKlxyXG4gICAqIEFuIG9iamVjdCB0aGF0IGhvbGRzIDMgYFR3by5WZWN0b3JgcywgdGhlIGFuY2hvciBwb2ludCBhbmQgaXRzXHJcbiAgICogY29ycmVzcG9uZGluZyBoYW5kbGVzOiBgbGVmdGAgYW5kIGByaWdodGAuXHJcbiAgICovXHJcbiAgdmFyIEFuY2hvciA9IFR3by5BbmNob3IgPSBmdW5jdGlvbih4LCB5LCB1eCwgdXksIHZ4LCB2eSwgY29tbWFuZCkge1xyXG5cclxuICAgIFR3by5WZWN0b3IuY2FsbCh0aGlzLCB4LCB5KTtcclxuXHJcbiAgICB0aGlzLl9icm9hZGNhc3QgPSBfLmJpbmQoZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLl9jb21tYW5kID0gY29tbWFuZCB8fCBjb21tYW5kcy5tb3ZlO1xyXG4gICAgdGhpcy5fcmVsYXRpdmUgPSB0cnVlO1xyXG5cclxuICAgIGlmICghY29tbWFuZCkge1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBBbmNob3IuQXBwZW5kQ3VydmVQcm9wZXJ0aWVzKHRoaXMpO1xyXG5cclxuICAgIGlmIChfLmlzTnVtYmVyKHV4KSkge1xyXG4gICAgICB0aGlzLmNvbnRyb2xzLmxlZnQueCA9IHV4O1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIodXkpKSB7XHJcbiAgICAgIHRoaXMuY29udHJvbHMubGVmdC55ID0gdXk7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcih2eCkpIHtcclxuICAgICAgdGhpcy5jb250cm9scy5yaWdodC54ID0gdng7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcih2eSkpIHtcclxuICAgICAgdGhpcy5jb250cm9scy5yaWdodC55ID0gdnk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKEFuY2hvciwge1xyXG5cclxuICAgIEFwcGVuZEN1cnZlUHJvcGVydGllczogZnVuY3Rpb24oYW5jaG9yKSB7XHJcbiAgICAgIGFuY2hvci5jb250cm9scyA9IHtcclxuICAgICAgICBsZWZ0OiBuZXcgVHdvLlZlY3RvcigwLCAwKSxcclxuICAgICAgICByaWdodDogbmV3IFR3by5WZWN0b3IoMCwgMClcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIHZhciBBbmNob3JQcm90byA9IHtcclxuXHJcbiAgICBsaXN0ZW46IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKCFfLmlzT2JqZWN0KHRoaXMuY29udHJvbHMpKSB7XHJcbiAgICAgICAgQW5jaG9yLkFwcGVuZEN1cnZlUHJvcGVydGllcyh0aGlzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5jb250cm9scy5sZWZ0LmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX2Jyb2FkY2FzdCk7XHJcbiAgICAgIHRoaXMuY29udHJvbHMucmlnaHQuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fYnJvYWRjYXN0KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgaWdub3JlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuY29udHJvbHMubGVmdC51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX2Jyb2FkY2FzdCk7XHJcbiAgICAgIHRoaXMuY29udHJvbHMucmlnaHQudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9icm9hZGNhc3QpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgY29udHJvbHMgPSB0aGlzLmNvbnRyb2xzO1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IFR3by5BbmNob3IoXHJcbiAgICAgICAgdGhpcy54LFxyXG4gICAgICAgIHRoaXMueSxcclxuICAgICAgICBjb250cm9scyAmJiBjb250cm9scy5sZWZ0LngsXHJcbiAgICAgICAgY29udHJvbHMgJiYgY29udHJvbHMubGVmdC55LFxyXG4gICAgICAgIGNvbnRyb2xzICYmIGNvbnRyb2xzLnJpZ2h0LngsXHJcbiAgICAgICAgY29udHJvbHMgJiYgY29udHJvbHMucmlnaHQueSxcclxuICAgICAgICB0aGlzLmNvbW1hbmRcclxuICAgICAgKTtcclxuICAgICAgY2xvbmUucmVsYXRpdmUgPSB0aGlzLl9yZWxhdGl2ZTtcclxuICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgbyA9IHtcclxuICAgICAgICB4OiB0aGlzLngsXHJcbiAgICAgICAgeTogdGhpcy55XHJcbiAgICAgIH07XHJcbiAgICAgIGlmICh0aGlzLl9jb21tYW5kKSB7XHJcbiAgICAgICAgby5jb21tYW5kID0gdGhpcy5fY29tbWFuZDtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5fcmVsYXRpdmUpIHtcclxuICAgICAgICBvLnJlbGF0aXZlID0gdGhpcy5fcmVsYXRpdmU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHRoaXMuY29udHJvbHMpIHtcclxuICAgICAgICBvLmNvbnRyb2xzID0ge1xyXG4gICAgICAgICAgbGVmdDogdGhpcy5jb250cm9scy5sZWZ0LnRvT2JqZWN0KCksXHJcbiAgICAgICAgICByaWdodDogdGhpcy5jb250cm9scy5yaWdodC50b09iamVjdCgpXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbztcclxuICAgIH0sXHJcblxyXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAoIXRoaXMuY29udHJvbHMpIHtcclxuICAgICAgICByZXR1cm4gW3RoaXMuX3gsIHRoaXMuX3ldLmpvaW4oJywgJyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIFt0aGlzLl94LCB0aGlzLl95LCB0aGlzLmNvbnRyb2xzLmxlZnQueCwgdGhpcy5jb250cm9scy5sZWZ0LnksXHJcbiAgICAgICAgdGhpcy5jb250cm9scy5yaWdodC54LCB0aGlzLmNvbnRyb2xzLnJpZ2h0LnldLmpvaW4oJywgJyk7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBbmNob3IucHJvdG90eXBlLCAnY29tbWFuZCcsIHtcclxuXHJcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9jb21tYW5kO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKGMpIHtcclxuICAgICAgdGhpcy5fY29tbWFuZCA9IGM7XHJcbiAgICAgIGlmICh0aGlzLl9jb21tYW5kID09PSBjb21tYW5kcy5jdXJ2ZSAmJiAhXy5pc09iamVjdCh0aGlzLmNvbnRyb2xzKSkge1xyXG4gICAgICAgIEFuY2hvci5BcHBlbmRDdXJ2ZVByb3BlcnRpZXModGhpcyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQW5jaG9yLnByb3RvdHlwZSwgJ3JlbGF0aXZlJywge1xyXG5cclxuICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3JlbGF0aXZlO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKGIpIHtcclxuICAgICAgaWYgKHRoaXMuX3JlbGF0aXZlID09IGIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG4gICAgICB0aGlzLl9yZWxhdGl2ZSA9ICEhYjtcclxuICAgICAgcmV0dXJuIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChBbmNob3IucHJvdG90eXBlLCBUd28uVmVjdG9yLnByb3RvdHlwZSwgQW5jaG9yUHJvdG8pO1xyXG5cclxuICAvLyBNYWtlIGl0IHBvc3NpYmxlIHRvIGJpbmQgYW5kIHN0aWxsIGhhdmUgdGhlIEFuY2hvciBzcGVjaWZpY1xyXG4gIC8vIGluaGVyaXRhbmNlIGZyb20gVHdvLlZlY3RvclxyXG4gIFR3by5BbmNob3IucHJvdG90eXBlLmJpbmQgPSBUd28uQW5jaG9yLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgVHdvLlZlY3Rvci5wcm90b3R5cGUuYmluZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgXy5leHRlbmQodGhpcywgQW5jaG9yUHJvdG8pO1xyXG4gIH07XHJcblxyXG4gIFR3by5BbmNob3IucHJvdG90eXBlLnVuYmluZCA9IFR3by5BbmNob3IucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgVHdvLlZlY3Rvci5wcm90b3R5cGUudW5iaW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICBfLmV4dGVuZCh0aGlzLCBBbmNob3JQcm90byk7XHJcbiAgfTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0YW50c1xyXG4gICAqL1xyXG4gIHZhciBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW4sIHRhbiA9IE1hdGgudGFuO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICAvKipcclxuICAgKiBUd28uTWF0cml4IGNvbnRhaW5zIGFuIGFycmF5IG9mIGVsZW1lbnRzIHRoYXQgcmVwcmVzZW50XHJcbiAgICogdGhlIHR3byBkaW1lbnNpb25hbCAzIHggMyBtYXRyaXggYXMgaWxsdXN0cmF0ZWQgYmVsb3c6XHJcbiAgICpcclxuICAgKiA9PT09PVxyXG4gICAqIGEgYiBjXHJcbiAgICogZCBlIGZcclxuICAgKiBnIGggaSAgLy8gdGhpcyByb3cgaXMgbm90IHJlYWxseSB1c2VkIGluIDJkIHRyYW5zZm9ybWF0aW9uc1xyXG4gICAqID09PT09XHJcbiAgICpcclxuICAgKiBTdHJpbmcgb3JkZXIgaXMgZm9yIHRyYW5zZm9ybSBzdHJpbmdzOiBhLCBkLCBiLCBlLCBjLCBmXHJcbiAgICpcclxuICAgKiBAY2xhc3NcclxuICAgKi9cclxuICB2YXIgTWF0cml4ID0gVHdvLk1hdHJpeCA9IGZ1bmN0aW9uKGEsIGIsIGMsIGQsIGUsIGYpIHtcclxuXHJcbiAgICB0aGlzLmVsZW1lbnRzID0gbmV3IFR3by5BcnJheSg5KTtcclxuXHJcbiAgICB2YXIgZWxlbWVudHMgPSBhO1xyXG4gICAgaWYgKCFfLmlzQXJyYXkoZWxlbWVudHMpKSB7XHJcbiAgICAgIGVsZW1lbnRzID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gaW5pdGlhbGl6ZSB0aGUgZWxlbWVudHMgd2l0aCBkZWZhdWx0IHZhbHVlcy5cclxuXHJcbiAgICB0aGlzLmlkZW50aXR5KCkuc2V0KGVsZW1lbnRzKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoTWF0cml4LCB7XHJcblxyXG4gICAgSWRlbnRpdHk6IFtcclxuICAgICAgMSwgMCwgMCxcclxuICAgICAgMCwgMSwgMCxcclxuICAgICAgMCwgMCwgMVxyXG4gICAgXSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE11bHRpcGx5IHR3byBtYXRyaXggM3gzIGFycmF5c1xyXG4gICAgICovXHJcbiAgICBNdWx0aXBseTogZnVuY3Rpb24oQSwgQiwgQykge1xyXG5cclxuICAgICAgaWYgKEIubGVuZ3RoIDw9IDMpIHsgLy8gTXVsdGlwbHkgVmVjdG9yXHJcblxyXG4gICAgICAgIHZhciB4LCB5LCB6LCBlID0gQTtcclxuXHJcbiAgICAgICAgdmFyIGEgPSBCWzBdIHx8IDAsXHJcbiAgICAgICAgICAgIGIgPSBCWzFdIHx8IDAsXHJcbiAgICAgICAgICAgIGMgPSBCWzJdIHx8IDA7XHJcblxyXG4gICAgICAgIC8vIEdvIGRvd24gcm93cyBmaXJzdFxyXG4gICAgICAgIC8vIGEsIGQsIGcsIGIsIGUsIGgsIGMsIGYsIGlcclxuXHJcbiAgICAgICAgeCA9IGVbMF0gKiBhICsgZVsxXSAqIGIgKyBlWzJdICogYztcclxuICAgICAgICB5ID0gZVszXSAqIGEgKyBlWzRdICogYiArIGVbNV0gKiBjO1xyXG4gICAgICAgIHogPSBlWzZdICogYSArIGVbN10gKiBiICsgZVs4XSAqIGM7XHJcblxyXG4gICAgICAgIHJldHVybiB7IHg6IHgsIHk6IHksIHo6IHogfTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBBMCA9IEFbMF0sIEExID0gQVsxXSwgQTIgPSBBWzJdO1xyXG4gICAgICB2YXIgQTMgPSBBWzNdLCBBNCA9IEFbNF0sIEE1ID0gQVs1XTtcclxuICAgICAgdmFyIEE2ID0gQVs2XSwgQTcgPSBBWzddLCBBOCA9IEFbOF07XHJcblxyXG4gICAgICB2YXIgQjAgPSBCWzBdLCBCMSA9IEJbMV0sIEIyID0gQlsyXTtcclxuICAgICAgdmFyIEIzID0gQlszXSwgQjQgPSBCWzRdLCBCNSA9IEJbNV07XHJcbiAgICAgIHZhciBCNiA9IEJbNl0sIEI3ID0gQls3XSwgQjggPSBCWzhdO1xyXG5cclxuICAgICAgQyA9IEMgfHwgbmV3IFR3by5BcnJheSg5KTtcclxuXHJcbiAgICAgIENbMF0gPSBBMCAqIEIwICsgQTEgKiBCMyArIEEyICogQjY7XHJcbiAgICAgIENbMV0gPSBBMCAqIEIxICsgQTEgKiBCNCArIEEyICogQjc7XHJcbiAgICAgIENbMl0gPSBBMCAqIEIyICsgQTEgKiBCNSArIEEyICogQjg7XHJcbiAgICAgIENbM10gPSBBMyAqIEIwICsgQTQgKiBCMyArIEE1ICogQjY7XHJcbiAgICAgIENbNF0gPSBBMyAqIEIxICsgQTQgKiBCNCArIEE1ICogQjc7XHJcbiAgICAgIENbNV0gPSBBMyAqIEIyICsgQTQgKiBCNSArIEE1ICogQjg7XHJcbiAgICAgIENbNl0gPSBBNiAqIEIwICsgQTcgKiBCMyArIEE4ICogQjY7XHJcbiAgICAgIENbN10gPSBBNiAqIEIxICsgQTcgKiBCNCArIEE4ICogQjc7XHJcbiAgICAgIENbOF0gPSBBNiAqIEIyICsgQTcgKiBCNSArIEE4ICogQjg7XHJcblxyXG4gICAgICByZXR1cm4gQztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChNYXRyaXgucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUYWtlcyBhbiBhcnJheSBvZiBlbGVtZW50cyBvciB0aGUgYXJndW1lbnRzIGxpc3QgaXRzZWxmIHRvXHJcbiAgICAgKiBzZXQgYW5kIHVwZGF0ZSB0aGUgY3VycmVudCBtYXRyaXgncyBlbGVtZW50cy4gT25seSB1cGRhdGVzXHJcbiAgICAgKiBzcGVjaWZpZWQgdmFsdWVzLlxyXG4gICAgICovXHJcbiAgICBzZXQ6IGZ1bmN0aW9uKGEpIHtcclxuXHJcbiAgICAgIHZhciBlbGVtZW50cyA9IGE7XHJcbiAgICAgIGlmICghXy5pc0FycmF5KGVsZW1lbnRzKSkge1xyXG4gICAgICAgIGVsZW1lbnRzID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIF8uZXh0ZW5kKHRoaXMuZWxlbWVudHMsIGVsZW1lbnRzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUdXJuIG1hdHJpeCB0byBpZGVudGl0eSwgbGlrZSByZXNldHRpbmcuXHJcbiAgICAgKi9cclxuICAgIGlkZW50aXR5OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuc2V0KE1hdHJpeC5JZGVudGl0eSk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTXVsdGlwbHkgc2NhbGFyIG9yIG11bHRpcGx5IGJ5IGFub3RoZXIgbWF0cml4LlxyXG4gICAgICovXHJcbiAgICBtdWx0aXBseTogZnVuY3Rpb24oYSwgYiwgYywgZCwgZSwgZiwgZywgaCwgaSkge1xyXG5cclxuICAgICAgdmFyIGVsZW1lbnRzID0gYXJndW1lbnRzLCBsID0gZWxlbWVudHMubGVuZ3RoO1xyXG5cclxuICAgICAgLy8gTXVsdGlwbHkgc2NhbGFyXHJcblxyXG4gICAgICBpZiAobCA8PSAxKSB7XHJcblxyXG4gICAgICAgIF8uZWFjaCh0aGlzLmVsZW1lbnRzLCBmdW5jdGlvbih2LCBpKSB7XHJcbiAgICAgICAgICB0aGlzLmVsZW1lbnRzW2ldID0gdiAqIGE7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGwgPD0gMykgeyAvLyBNdWx0aXBseSBWZWN0b3JcclxuXHJcbiAgICAgICAgdmFyIHgsIHksIHo7XHJcbiAgICAgICAgYSA9IGEgfHwgMDtcclxuICAgICAgICBiID0gYiB8fCAwO1xyXG4gICAgICAgIGMgPSBjIHx8IDA7XHJcbiAgICAgICAgZSA9IHRoaXMuZWxlbWVudHM7XHJcblxyXG4gICAgICAgIC8vIEdvIGRvd24gcm93cyBmaXJzdFxyXG4gICAgICAgIC8vIGEsIGQsIGcsIGIsIGUsIGgsIGMsIGYsIGlcclxuXHJcbiAgICAgICAgeCA9IGVbMF0gKiBhICsgZVsxXSAqIGIgKyBlWzJdICogYztcclxuICAgICAgICB5ID0gZVszXSAqIGEgKyBlWzRdICogYiArIGVbNV0gKiBjO1xyXG4gICAgICAgIHogPSBlWzZdICogYSArIGVbN10gKiBiICsgZVs4XSAqIGM7XHJcblxyXG4gICAgICAgIHJldHVybiB7IHg6IHgsIHk6IHksIHo6IHogfTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIE11bHRpcGxlIG1hdHJpeFxyXG5cclxuICAgICAgdmFyIEEgPSB0aGlzLmVsZW1lbnRzO1xyXG4gICAgICB2YXIgQiA9IGVsZW1lbnRzO1xyXG5cclxuICAgICAgdmFyIEEwID0gQVswXSwgQTEgPSBBWzFdLCBBMiA9IEFbMl07XHJcbiAgICAgIHZhciBBMyA9IEFbM10sIEE0ID0gQVs0XSwgQTUgPSBBWzVdO1xyXG4gICAgICB2YXIgQTYgPSBBWzZdLCBBNyA9IEFbN10sIEE4ID0gQVs4XTtcclxuXHJcbiAgICAgIHZhciBCMCA9IEJbMF0sIEIxID0gQlsxXSwgQjIgPSBCWzJdO1xyXG4gICAgICB2YXIgQjMgPSBCWzNdLCBCNCA9IEJbNF0sIEI1ID0gQls1XTtcclxuICAgICAgdmFyIEI2ID0gQls2XSwgQjcgPSBCWzddLCBCOCA9IEJbOF07XHJcblxyXG4gICAgICB0aGlzLmVsZW1lbnRzWzBdID0gQTAgKiBCMCArIEExICogQjMgKyBBMiAqIEI2O1xyXG4gICAgICB0aGlzLmVsZW1lbnRzWzFdID0gQTAgKiBCMSArIEExICogQjQgKyBBMiAqIEI3O1xyXG4gICAgICB0aGlzLmVsZW1lbnRzWzJdID0gQTAgKiBCMiArIEExICogQjUgKyBBMiAqIEI4O1xyXG5cclxuICAgICAgdGhpcy5lbGVtZW50c1szXSA9IEEzICogQjAgKyBBNCAqIEIzICsgQTUgKiBCNjtcclxuICAgICAgdGhpcy5lbGVtZW50c1s0XSA9IEEzICogQjEgKyBBNCAqIEI0ICsgQTUgKiBCNztcclxuICAgICAgdGhpcy5lbGVtZW50c1s1XSA9IEEzICogQjIgKyBBNCAqIEI1ICsgQTUgKiBCODtcclxuXHJcbiAgICAgIHRoaXMuZWxlbWVudHNbNl0gPSBBNiAqIEIwICsgQTcgKiBCMyArIEE4ICogQjY7XHJcbiAgICAgIHRoaXMuZWxlbWVudHNbN10gPSBBNiAqIEIxICsgQTcgKiBCNCArIEE4ICogQjc7XHJcbiAgICAgIHRoaXMuZWxlbWVudHNbOF0gPSBBNiAqIEIyICsgQTcgKiBCNSArIEE4ICogQjg7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGludmVyc2U6IGZ1bmN0aW9uKG91dCkge1xyXG5cclxuICAgICAgdmFyIGEgPSB0aGlzLmVsZW1lbnRzO1xyXG4gICAgICBvdXQgPSBvdXQgfHwgbmV3IFR3by5NYXRyaXgoKTtcclxuXHJcbiAgICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdO1xyXG4gICAgICB2YXIgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XTtcclxuICAgICAgdmFyIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF07XHJcblxyXG4gICAgICB2YXIgYjAxID0gYTIyICogYTExIC0gYTEyICogYTIxO1xyXG4gICAgICB2YXIgYjExID0gLWEyMiAqIGExMCArIGExMiAqIGEyMDtcclxuICAgICAgdmFyIGIyMSA9IGEyMSAqIGExMCAtIGExMSAqIGEyMDtcclxuXHJcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcclxuICAgICAgdmFyIGRldCA9IGEwMCAqIGIwMSArIGEwMSAqIGIxMSArIGEwMiAqIGIyMTtcclxuXHJcbiAgICAgIGlmICghZGV0KSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGRldCA9IDEuMCAvIGRldDtcclxuXHJcbiAgICAgIG91dC5lbGVtZW50c1swXSA9IGIwMSAqIGRldDtcclxuICAgICAgb3V0LmVsZW1lbnRzWzFdID0gKC1hMjIgKiBhMDEgKyBhMDIgKiBhMjEpICogZGV0O1xyXG4gICAgICBvdXQuZWxlbWVudHNbMl0gPSAoYTEyICogYTAxIC0gYTAyICogYTExKSAqIGRldDtcclxuICAgICAgb3V0LmVsZW1lbnRzWzNdID0gYjExICogZGV0O1xyXG4gICAgICBvdXQuZWxlbWVudHNbNF0gPSAoYTIyICogYTAwIC0gYTAyICogYTIwKSAqIGRldDtcclxuICAgICAgb3V0LmVsZW1lbnRzWzVdID0gKC1hMTIgKiBhMDAgKyBhMDIgKiBhMTApICogZGV0O1xyXG4gICAgICBvdXQuZWxlbWVudHNbNl0gPSBiMjEgKiBkZXQ7XHJcbiAgICAgIG91dC5lbGVtZW50c1s3XSA9ICgtYTIxICogYTAwICsgYTAxICogYTIwKSAqIGRldDtcclxuICAgICAgb3V0LmVsZW1lbnRzWzhdID0gKGExMSAqIGEwMCAtIGEwMSAqIGExMCkgKiBkZXQ7XHJcblxyXG4gICAgICByZXR1cm4gb3V0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgYSBzY2FsYXIgb250byB0aGUgbWF0cml4LlxyXG4gICAgICovXHJcbiAgICBzY2FsZTogZnVuY3Rpb24oc3gsIHN5KSB7XHJcblxyXG4gICAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcbiAgICAgIGlmIChsIDw9IDEpIHtcclxuICAgICAgICBzeSA9IHN4O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5tdWx0aXBseShzeCwgMCwgMCwgMCwgc3ksIDAsIDAsIDAsIDEpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSb3RhdGUgdGhlIG1hdHJpeC5cclxuICAgICAqL1xyXG4gICAgcm90YXRlOiBmdW5jdGlvbihyYWRpYW5zKSB7XHJcblxyXG4gICAgICB2YXIgYyA9IGNvcyhyYWRpYW5zKTtcclxuICAgICAgdmFyIHMgPSBzaW4ocmFkaWFucyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5tdWx0aXBseShjLCAtcywgMCwgcywgYywgMCwgMCwgMCwgMSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYW5zbGF0ZSB0aGUgbWF0cml4LlxyXG4gICAgICovXHJcbiAgICB0cmFuc2xhdGU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLm11bHRpcGx5KDEsIDAsIHgsIDAsIDEsIHksIDAsIDAsIDEpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLypcclxuICAgICAqIFNrZXcgdGhlIG1hdHJpeCBieSBhbiBhbmdsZSBpbiB0aGUgeCBheGlzIGRpcmVjdGlvbi5cclxuICAgICAqL1xyXG4gICAgc2tld1g6IGZ1bmN0aW9uKHJhZGlhbnMpIHtcclxuXHJcbiAgICAgIHZhciBhID0gdGFuKHJhZGlhbnMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHkoMSwgYSwgMCwgMCwgMSwgMCwgMCwgMCwgMSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKlxyXG4gICAgICogU2tldyB0aGUgbWF0cml4IGJ5IGFuIGFuZ2xlIGluIHRoZSB5IGF4aXMgZGlyZWN0aW9uLlxyXG4gICAgICovXHJcbiAgICBza2V3WTogZnVuY3Rpb24ocmFkaWFucykge1xyXG5cclxuICAgICAgdmFyIGEgPSB0YW4ocmFkaWFucyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5tdWx0aXBseSgxLCAwLCAwLCBhLCAxLCAwLCAwLCAwLCAxKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGEgdHJhbnNmb3JtIHN0cmluZyB0byBiZSB1c2VkIHdpdGggcmVuZGVyaW5nIGFwaXMuXHJcbiAgICAgKi9cclxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbihmdWxsTWF0cml4KSB7XHJcbiAgICAgIHZhciB0ZW1wID0gW107XHJcblxyXG4gICAgICB0aGlzLnRvQXJyYXkoZnVsbE1hdHJpeCwgdGVtcCk7XHJcblxyXG4gICAgICByZXR1cm4gdGVtcC5qb2luKCcgJyk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIHRyYW5zZm9ybSBhcnJheSB0byBiZSB1c2VkIHdpdGggcmVuZGVyaW5nIGFwaXMuXHJcbiAgICAgKi9cclxuICAgIHRvQXJyYXk6IGZ1bmN0aW9uKGZ1bGxNYXRyaXgsIG91dHB1dCkge1xyXG5cclxuICAgICB2YXIgZWxlbWVudHMgPSB0aGlzLmVsZW1lbnRzO1xyXG4gICAgIHZhciBoYXNPdXRwdXQgPSAhIW91dHB1dDtcclxuXHJcbiAgICAgdmFyIGEgPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzBdLnRvRml4ZWQoMykpO1xyXG4gICAgIHZhciBiID0gcGFyc2VGbG9hdChlbGVtZW50c1sxXS50b0ZpeGVkKDMpKTtcclxuICAgICB2YXIgYyA9IHBhcnNlRmxvYXQoZWxlbWVudHNbMl0udG9GaXhlZCgzKSk7XHJcbiAgICAgdmFyIGQgPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzNdLnRvRml4ZWQoMykpO1xyXG4gICAgIHZhciBlID0gcGFyc2VGbG9hdChlbGVtZW50c1s0XS50b0ZpeGVkKDMpKTtcclxuICAgICB2YXIgZiA9IHBhcnNlRmxvYXQoZWxlbWVudHNbNV0udG9GaXhlZCgzKSk7XHJcblxyXG4gICAgICBpZiAoISFmdWxsTWF0cml4KSB7XHJcblxyXG4gICAgICAgIHZhciBnID0gcGFyc2VGbG9hdChlbGVtZW50c1s2XS50b0ZpeGVkKDMpKTtcclxuICAgICAgICB2YXIgaCA9IHBhcnNlRmxvYXQoZWxlbWVudHNbN10udG9GaXhlZCgzKSk7XHJcbiAgICAgICAgdmFyIGkgPSBwYXJzZUZsb2F0KGVsZW1lbnRzWzhdLnRvRml4ZWQoMykpO1xyXG5cclxuICAgICAgICBpZiAoaGFzT3V0cHV0KSB7XHJcbiAgICAgICAgICBvdXRwdXRbMF0gPSBhO1xyXG4gICAgICAgICAgb3V0cHV0WzFdID0gZDtcclxuICAgICAgICAgIG91dHB1dFsyXSA9IGc7XHJcbiAgICAgICAgICBvdXRwdXRbM10gPSBiO1xyXG4gICAgICAgICAgb3V0cHV0WzRdID0gZTtcclxuICAgICAgICAgIG91dHB1dFs1XSA9IGg7XHJcbiAgICAgICAgICBvdXRwdXRbNl0gPSBjO1xyXG4gICAgICAgICAgb3V0cHV0WzddID0gZjtcclxuICAgICAgICAgIG91dHB1dFs4XSA9IGk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgYSwgZCwgZywgYiwgZSwgaCwgYywgZiwgaVxyXG4gICAgICAgIF07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChoYXNPdXRwdXQpIHtcclxuICAgICAgICBvdXRwdXRbMF0gPSBhO1xyXG4gICAgICAgIG91dHB1dFsxXSA9IGQ7XHJcbiAgICAgICAgb3V0cHV0WzJdID0gYjtcclxuICAgICAgICBvdXRwdXRbM10gPSBlO1xyXG4gICAgICAgIG91dHB1dFs0XSA9IGM7XHJcbiAgICAgICAgb3V0cHV0WzVdID0gZjtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBbXHJcbiAgICAgICAgYSwgZCwgYiwgZSwgYywgZiAgLy8gU3BlY2lmaWMgZm9ybWF0IHNlZSBMTjoxOVxyXG4gICAgICBdO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbG9uZSB0aGUgY3VycmVudCBtYXRyaXguXHJcbiAgICAgKi9cclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGEsIGIsIGMsIGQsIGUsIGYsIGcsIGgsIGk7XHJcblxyXG4gICAgICBhID0gdGhpcy5lbGVtZW50c1swXTtcclxuICAgICAgYiA9IHRoaXMuZWxlbWVudHNbMV07XHJcbiAgICAgIGMgPSB0aGlzLmVsZW1lbnRzWzJdO1xyXG4gICAgICBkID0gdGhpcy5lbGVtZW50c1szXTtcclxuICAgICAgZSA9IHRoaXMuZWxlbWVudHNbNF07XHJcbiAgICAgIGYgPSB0aGlzLmVsZW1lbnRzWzVdO1xyXG4gICAgICBnID0gdGhpcy5lbGVtZW50c1s2XTtcclxuICAgICAgaCA9IHRoaXMuZWxlbWVudHNbN107XHJcbiAgICAgIGkgPSB0aGlzLmVsZW1lbnRzWzhdO1xyXG5cclxuICAgICAgcmV0dXJuIG5ldyBUd28uTWF0cml4KGEsIGIsIGMsIGQsIGUsIGYsIGcsIGgsIGkpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICAvLyBMb2NhbGl6ZSB2YXJpYWJsZXNcclxuICB2YXIgbW9kID0gVHdvLlV0aWxzLm1vZCwgdG9GaXhlZCA9IFR3by5VdGlscy50b0ZpeGVkO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgc3ZnID0ge1xyXG5cclxuICAgIHZlcnNpb246IDEuMSxcclxuXHJcbiAgICBuczogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJyxcclxuICAgIHhsaW5rOiAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsXHJcblxyXG4gICAgYWxpZ25tZW50czoge1xyXG4gICAgICBsZWZ0OiAnc3RhcnQnLFxyXG4gICAgICBjZW50ZXI6ICdtaWRkbGUnLFxyXG4gICAgICByaWdodDogJ2VuZCdcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYW4gc3ZnIG5hbWVzcGFjZWQgZWxlbWVudC5cclxuICAgICAqL1xyXG4gICAgY3JlYXRlRWxlbWVudDogZnVuY3Rpb24obmFtZSwgYXR0cnMpIHtcclxuICAgICAgdmFyIHRhZyA9IG5hbWU7XHJcbiAgICAgIHZhciBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKHN2Zy5ucywgdGFnKTtcclxuICAgICAgaWYgKHRhZyA9PT0gJ3N2ZycpIHtcclxuICAgICAgICBhdHRycyA9IF8uZGVmYXVsdHMoYXR0cnMgfHwge30sIHtcclxuICAgICAgICAgIHZlcnNpb246IHN2Zy52ZXJzaW9uXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKCFfLmlzRW1wdHkoYXR0cnMpKSB7XHJcbiAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXMoZWxlbSwgYXR0cnMpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBlbGVtO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZCBhdHRyaWJ1dGVzIGZyb20gYW4gc3ZnIGVsZW1lbnQuXHJcbiAgICAgKi9cclxuICAgIHNldEF0dHJpYnV0ZXM6IGZ1bmN0aW9uKGVsZW0sIGF0dHJzKSB7XHJcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYXR0cnMpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAoL2hyZWYvLnRlc3Qoa2V5c1tpXSkpIHtcclxuICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlTlMoc3ZnLnhsaW5rLCBrZXlzW2ldLCBhdHRyc1trZXlzW2ldXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKGtleXNbaV0sIGF0dHJzW2tleXNbaV1dKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGF0dHJpYnV0ZXMgZnJvbSBhbiBzdmcgZWxlbWVudC5cclxuICAgICAqL1xyXG4gICAgcmVtb3ZlQXR0cmlidXRlczogZnVuY3Rpb24oZWxlbSwgYXR0cnMpIHtcclxuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XHJcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUdXJuIGEgc2V0IG9mIHZlcnRpY2VzIGludG8gYSBzdHJpbmcgZm9yIHRoZSBkIHByb3BlcnR5IG9mIGEgcGF0aFxyXG4gICAgICogZWxlbWVudC4gSXQgaXMgaW1wZXJhdGl2ZSB0aGF0IHRoZSBzdHJpbmcgY29sbGF0aW9uIGlzIGFzIGZhc3QgYXNcclxuICAgICAqIHBvc3NpYmxlLCBiZWNhdXNlIHRoaXMgY2FsbCB3aWxsIGJlIGhhcHBlbmluZyBtdWx0aXBsZSB0aW1lcyBhXHJcbiAgICAgKiBzZWNvbmQuXHJcbiAgICAgKi9cclxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbihwb2ludHMsIGNsb3NlZCkge1xyXG5cclxuICAgICAgdmFyIGwgPSBwb2ludHMubGVuZ3RoLFxyXG4gICAgICAgIGxhc3QgPSBsIC0gMSxcclxuICAgICAgICBkLCAvLyBUaGUgZWx1c2l2ZSBsYXN0IFR3by5Db21tYW5kcy5tb3ZlIHBvaW50XHJcbiAgICAgICAgcmV0ID0gJyc7XHJcblxyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHZhciBiID0gcG9pbnRzW2ldO1xyXG4gICAgICAgIHZhciBjb21tYW5kO1xyXG4gICAgICAgIHZhciBwcmV2ID0gY2xvc2VkID8gbW9kKGkgLSAxLCBsKSA6IE1hdGgubWF4KGkgLSAxLCAwKTtcclxuICAgICAgICB2YXIgbmV4dCA9IGNsb3NlZCA/IG1vZChpICsgMSwgbCkgOiBNYXRoLm1pbihpICsgMSwgbGFzdCk7XHJcblxyXG4gICAgICAgIHZhciBhID0gcG9pbnRzW3ByZXZdO1xyXG4gICAgICAgIHZhciBjID0gcG9pbnRzW25leHRdO1xyXG5cclxuICAgICAgICB2YXIgdngsIHZ5LCB1eCwgdXksIGFyLCBibCwgYnIsIGNsO1xyXG5cclxuICAgICAgICAvLyBBY2Nlc3MgeCBhbmQgeSBkaXJlY3RseSxcclxuICAgICAgICAvLyBieXBhc3NpbmcgdGhlIGdldHRlclxyXG4gICAgICAgIHZhciB4ID0gdG9GaXhlZChiLl94KTtcclxuICAgICAgICB2YXIgeSA9IHRvRml4ZWQoYi5feSk7XHJcblxyXG4gICAgICAgIHN3aXRjaCAoYi5fY29tbWFuZCkge1xyXG5cclxuICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLmNsb3NlOlxyXG4gICAgICAgICAgICBjb21tYW5kID0gVHdvLkNvbW1hbmRzLmNsb3NlO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5jdXJ2ZTpcclxuXHJcbiAgICAgICAgICAgIGFyID0gKGEuY29udHJvbHMgJiYgYS5jb250cm9scy5yaWdodCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG4gICAgICAgICAgICBibCA9IChiLmNvbnRyb2xzICYmIGIuY29udHJvbHMubGVmdCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG5cclxuICAgICAgICAgICAgaWYgKGEuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKChhci54ICsgYS54KSk7XHJcbiAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKChhci55ICsgYS55KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKGFyLngpO1xyXG4gICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZChhci55KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKChibC54ICsgYi54KSk7XHJcbiAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKChibC55ICsgYi55KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKGJsLngpO1xyXG4gICAgICAgICAgICAgIHV5ID0gdG9GaXhlZChibC55KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29tbWFuZCA9ICgoaSA9PT0gMCkgPyBUd28uQ29tbWFuZHMubW92ZSA6IFR3by5Db21tYW5kcy5jdXJ2ZSkgK1xyXG4gICAgICAgICAgICAgICcgJyArIHZ4ICsgJyAnICsgdnkgKyAnICcgKyB1eCArICcgJyArIHV5ICsgJyAnICsgeCArICcgJyArIHk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLm1vdmU6XHJcbiAgICAgICAgICAgIGQgPSBiO1xyXG4gICAgICAgICAgICBjb21tYW5kID0gVHdvLkNvbW1hbmRzLm1vdmUgKyAnICcgKyB4ICsgJyAnICsgeTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY29tbWFuZCA9IGIuX2NvbW1hbmQgKyAnICcgKyB4ICsgJyAnICsgeTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBZGQgYSBmaW5hbCBwb2ludCBhbmQgY2xvc2UgaXQgb2ZmXHJcblxyXG4gICAgICAgIGlmIChpID49IGxhc3QgJiYgY2xvc2VkKSB7XHJcblxyXG4gICAgICAgICAgaWYgKGIuX2NvbW1hbmQgPT09IFR3by5Db21tYW5kcy5jdXJ2ZSkge1xyXG5cclxuICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHdlIGNsb3NlIHRvIHRoZSBtb3N0IHByZXZpb3VzIFR3by5Db21tYW5kcy5tb3ZlXHJcbiAgICAgICAgICAgIGMgPSBkO1xyXG5cclxuICAgICAgICAgICAgYnIgPSAoYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLnJpZ2h0KSB8fCBiO1xyXG4gICAgICAgICAgICBjbCA9IChjLmNvbnRyb2xzICYmIGMuY29udHJvbHMubGVmdCkgfHwgYztcclxuXHJcbiAgICAgICAgICAgIGlmIChiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZCgoYnIueCArIGIueCkpO1xyXG4gICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZCgoYnIueSArIGIueSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZChici54KTtcclxuICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoYnIueSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgIHV4ID0gdG9GaXhlZCgoY2wueCArIGMueCkpO1xyXG4gICAgICAgICAgICAgIHV5ID0gdG9GaXhlZCgoY2wueSArIGMueSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHV4ID0gdG9GaXhlZChjbC54KTtcclxuICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoY2wueSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHggPSB0b0ZpeGVkKGMueCk7XHJcbiAgICAgICAgICAgIHkgPSB0b0ZpeGVkKGMueSk7XHJcblxyXG4gICAgICAgICAgICBjb21tYW5kICs9XHJcbiAgICAgICAgICAgICAgJyBDICcgKyB2eCArICcgJyArIHZ5ICsgJyAnICsgdXggKyAnICcgKyB1eSArICcgJyArIHggKyAnICcgKyB5O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNvbW1hbmQgKz0gJyBaJztcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXQgKz0gY29tbWFuZCArICcgJztcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiByZXQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRDbGlwOiBmdW5jdGlvbihzaGFwZSkge1xyXG5cclxuICAgICAgdmFyIGNsaXAgPSBzaGFwZS5fcmVuZGVyZXIuY2xpcDtcclxuXHJcbiAgICAgIGlmICghY2xpcCkge1xyXG5cclxuICAgICAgICB2YXIgcm9vdCA9IHNoYXBlO1xyXG5cclxuICAgICAgICB3aGlsZSAocm9vdC5wYXJlbnQpIHtcclxuICAgICAgICAgIHJvb3QgPSByb290LnBhcmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNsaXAgPSBzaGFwZS5fcmVuZGVyZXIuY2xpcCA9IHN2Zy5jcmVhdGVFbGVtZW50KCdjbGlwUGF0aCcpO1xyXG4gICAgICAgIHJvb3QuZGVmcy5hcHBlbmRDaGlsZChjbGlwKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBjbGlwO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZ3JvdXA6IHtcclxuXHJcbiAgICAgIC8vIFRPRE86IENhbiBzcGVlZCB1cC5cclxuICAgICAgLy8gVE9ETzogSG93IGRvZXMgdGhpcyBlZmZlY3QgYSBmXHJcbiAgICAgIGFwcGVuZENoaWxkOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgICAgdmFyIGVsZW0gPSBvYmplY3QuX3JlbmRlcmVyLmVsZW07XHJcblxyXG4gICAgICAgIGlmICghZWxlbSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRhZyA9IGVsZW0ubm9kZU5hbWU7XHJcblxyXG4gICAgICAgIGlmICghdGFnIHx8IC8ocmFkaWFsfGxpbmVhcilncmFkaWVudC9pLnRlc3QodGFnKSB8fCBvYmplY3QuX2NsaXApIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZWxlbS5hcHBlbmRDaGlsZChlbGVtKTtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZW1vdmVDaGlsZDogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICAgIHZhciBlbGVtID0gb2JqZWN0Ll9yZW5kZXJlci5lbGVtO1xyXG5cclxuICAgICAgICBpZiAoIWVsZW0gfHwgZWxlbS5wYXJlbnROb2RlICE9IHRoaXMuZWxlbSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRhZyA9IGVsZW0ubm9kZU5hbWU7XHJcblxyXG4gICAgICAgIGlmICghdGFnKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZWZlciBzdWJ0cmFjdGlvbnMgd2hpbGUgY2xpcHBpbmcuXHJcbiAgICAgICAgaWYgKG9iamVjdC5fY2xpcCkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5lbGVtLnJlbW92ZUNoaWxkKGVsZW0pO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIG9yZGVyQ2hpbGQ6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG4gICAgICAgIHRoaXMuZWxlbS5hcHBlbmRDaGlsZChvYmplY3QuX3JlbmRlcmVyLmVsZW0pO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVuZGVyQ2hpbGQ6IGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgc3ZnW2NoaWxkLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChjaGlsZCwgdGhpcyk7XHJcbiAgICAgIH0sXHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGRvbUVsZW1lbnQpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIC8vIFNob3J0Y3V0IGZvciBoaWRkZW4gb2JqZWN0cy5cclxuICAgICAgICAvLyBEb2Vzbid0IHJlc2V0IHRoZSBmbGFncywgc28gY2hhbmdlcyBhcmUgc3RvcmVkIGFuZFxyXG4gICAgICAgIC8vIGFwcGxpZWQgb25jZSB0aGUgb2JqZWN0IGlzIHZpc2libGUgYWdhaW5cclxuICAgICAgICBpZiAodGhpcy5fb3BhY2l0eSA9PT0gMCAmJiAhdGhpcy5fZmxhZ09wYWNpdHkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lbGVtKSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ2cnLCB7XHJcbiAgICAgICAgICAgIGlkOiB0aGlzLmlkXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyZXIuZWxlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBfVXBkYXRlIHN0eWxlcyBmb3IgdGhlIDxnPlxyXG4gICAgICAgIHZhciBmbGFnTWF0cml4ID0gdGhpcy5fbWF0cml4Lm1hbnVhbCB8fCB0aGlzLl9mbGFnTWF0cml4O1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0ge1xyXG4gICAgICAgICAgZG9tRWxlbWVudDogZG9tRWxlbWVudCxcclxuICAgICAgICAgIGVsZW06IHRoaXMuX3JlbmRlcmVyLmVsZW1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoZmxhZ01hdHJpeCkge1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5zZXRBdHRyaWJ1dGUoJ3RyYW5zZm9ybScsICdtYXRyaXgoJyArIHRoaXMuX21hdHJpeC50b1N0cmluZygpICsgJyknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcclxuICAgICAgICAgIHN2Z1tjaGlsZC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoY2hpbGQsIGRvbUVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdPcGFjaXR5KSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLnNldEF0dHJpYnV0ZSgnb3BhY2l0eScsIHRoaXMuX29wYWNpdHkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdBZGRpdGlvbnMpIHtcclxuICAgICAgICAgIHRoaXMuYWRkaXRpb25zLmZvckVhY2goc3ZnLmdyb3VwLmFwcGVuZENoaWxkLCBjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3VidHJhY3Rpb25zKSB7XHJcbiAgICAgICAgICB0aGlzLnN1YnRyYWN0aW9ucy5mb3JFYWNoKHN2Zy5ncm91cC5yZW1vdmVDaGlsZCwgY29udGV4dCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ09yZGVyKSB7XHJcbiAgICAgICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goc3ZnLmdyb3VwLm9yZGVyQ2hpbGQsIGNvbnRleHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ29tbWVudGVkIHR3by13YXkgZnVuY3Rpb25hbGl0eSBvZiBjbGlwcyAvIG1hc2tzIHdpdGggZ3JvdXBzIGFuZFxyXG4gICAgICAgICAqIHBvbHlnb25zLiBVbmNvbW1lbnQgd2hlbiB0aGlzIGJ1ZyBpcyBmaXhlZDpcclxuICAgICAgICAgKiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MzcwOTUxXHJcbiAgICAgICAgICovXHJcblxyXG4gICAgICAgIC8vIGlmICh0aGlzLl9mbGFnQ2xpcCkge1xyXG5cclxuICAgICAgICAvLyAgIGNsaXAgPSBzdmcuZ2V0Q2xpcCh0aGlzKTtcclxuICAgICAgICAvLyAgIGVsZW0gPSB0aGlzLl9yZW5kZXJlci5lbGVtO1xyXG5cclxuICAgICAgICAvLyAgIGlmICh0aGlzLl9jbGlwKSB7XHJcbiAgICAgICAgLy8gICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICAgIC8vICAgICBjbGlwLnNldEF0dHJpYnV0ZSgnaWQnLCB0aGlzLmlkKTtcclxuICAgICAgICAvLyAgICAgY2xpcC5hcHBlbmRDaGlsZChlbGVtKTtcclxuICAgICAgICAvLyAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gICAgIGNsaXAucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xyXG4gICAgICAgIC8vICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnaWQnLCB0aGlzLmlkKTtcclxuICAgICAgICAvLyAgICAgdGhpcy5wYXJlbnQuX3JlbmRlcmVyLmVsZW0uYXBwZW5kQ2hpbGQoZWxlbSk7IC8vIFRPRE86IHNob3VsZCBiZSBpbnNlcnRCZWZvcmVcclxuICAgICAgICAvLyAgIH1cclxuXHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ01hc2spIHtcclxuICAgICAgICAgIGlmICh0aGlzLl9tYXNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0uc2V0QXR0cmlidXRlKCdjbGlwLXBhdGgnLCAndXJsKCMnICsgdGhpcy5fbWFzay5pZCArICcpJyk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLnJlbW92ZUF0dHJpYnV0ZSgnY2xpcC1wYXRoJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHBhdGg6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZG9tRWxlbWVudCkge1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgLy8gU2hvcnRjdXQgZm9yIGhpZGRlbiBvYmplY3RzLlxyXG4gICAgICAgIC8vIERvZXNuJ3QgcmVzZXQgdGhlIGZsYWdzLCBzbyBjaGFuZ2VzIGFyZSBzdG9yZWQgYW5kXHJcbiAgICAgICAgLy8gYXBwbGllZCBvbmNlIHRoZSBvYmplY3QgaXMgdmlzaWJsZSBhZ2FpblxyXG4gICAgICAgIGlmICh0aGlzLl9vcGFjaXR5ID09PSAwICYmICF0aGlzLl9mbGFnT3BhY2l0eSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb2xsZWN0IGFueSBhdHRyaWJ1dGUgdGhhdCBuZWVkcyB0byBiZSBjaGFuZ2VkIGhlcmVcclxuICAgICAgICB2YXIgY2hhbmdlZCA9IHt9O1xyXG5cclxuICAgICAgICB2YXIgZmxhZ01hdHJpeCA9IHRoaXMuX21hdHJpeC5tYW51YWwgfHwgdGhpcy5fZmxhZ01hdHJpeDtcclxuXHJcbiAgICAgICAgaWYgKGZsYWdNYXRyaXgpIHtcclxuICAgICAgICAgIGNoYW5nZWQudHJhbnNmb3JtID0gJ21hdHJpeCgnICsgdGhpcy5fbWF0cml4LnRvU3RyaW5nKCkgKyAnKSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1ZlcnRpY2VzKSB7XHJcbiAgICAgICAgICB2YXIgdmVydGljZXMgPSBzdmcudG9TdHJpbmcodGhpcy5fdmVydGljZXMsIHRoaXMuX2Nsb3NlZCk7XHJcbiAgICAgICAgICBjaGFuZ2VkLmQgPSB2ZXJ0aWNlcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9maWxsICYmIHRoaXMuX2ZpbGwuX3JlbmRlcmVyKSB7XHJcbiAgICAgICAgICB0aGlzLl9maWxsLl91cGRhdGUoKTtcclxuICAgICAgICAgIHN2Z1t0aGlzLl9maWxsLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbCh0aGlzLl9maWxsLCBkb21FbGVtZW50LCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnRmlsbCkge1xyXG4gICAgICAgICAgY2hhbmdlZC5maWxsID0gdGhpcy5fZmlsbCAmJiB0aGlzLl9maWxsLmlkXHJcbiAgICAgICAgICAgID8gJ3VybCgjJyArIHRoaXMuX2ZpbGwuaWQgKyAnKScgOiB0aGlzLl9maWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3N0cm9rZSAmJiB0aGlzLl9zdHJva2UuX3JlbmRlcmVyKSB7XHJcbiAgICAgICAgICB0aGlzLl9zdHJva2UuX3VwZGF0ZSgpO1xyXG4gICAgICAgICAgc3ZnW3RoaXMuX3N0cm9rZS5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwodGhpcy5fc3Ryb2tlLCBkb21FbGVtZW50LCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3Ryb2tlKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnN0cm9rZSA9IHRoaXMuX3N0cm9rZSAmJiB0aGlzLl9zdHJva2UuaWRcclxuICAgICAgICAgICAgPyAndXJsKCMnICsgdGhpcy5fc3Ryb2tlLmlkICsgJyknIDogdGhpcy5fc3Ryb2tlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdMaW5ld2lkdGgpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ3N0cm9rZS13aWR0aCddID0gdGhpcy5fbGluZXdpZHRoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdPcGFjaXR5KSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydzdHJva2Utb3BhY2l0eSddID0gdGhpcy5fb3BhY2l0eTtcclxuICAgICAgICAgIGNoYW5nZWRbJ2ZpbGwtb3BhY2l0eSddID0gdGhpcy5fb3BhY2l0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnVmlzaWJsZSkge1xyXG4gICAgICAgICAgY2hhbmdlZC52aXNpYmlsaXR5ID0gdGhpcy5fdmlzaWJsZSA/ICd2aXNpYmxlJyA6ICdoaWRkZW4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdDYXApIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ3N0cm9rZS1saW5lY2FwJ10gPSB0aGlzLl9jYXA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0pvaW4pIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ3N0cm9rZS1saW5lam9pbiddID0gdGhpcy5fam9pbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnTWl0ZXIpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ3N0cm9rZS1taXRlcmxpbWl0J10gPSB0aGlzLl9taXRlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIGF0dGFjaGVkIERPTSBlbGVtZW50IHlldCxcclxuICAgICAgICAvLyBjcmVhdGUgaXQgd2l0aCBhbGwgbmVjZXNzYXJ5IGF0dHJpYnV0ZXMuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lbGVtKSB7XHJcblxyXG4gICAgICAgICAgY2hhbmdlZC5pZCA9IHRoaXMuaWQ7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ3BhdGgnLCBjaGFuZ2VkKTtcclxuICAgICAgICAgIGRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyZXIuZWxlbSk7XHJcblxyXG4gICAgICAgIC8vIE90aGVyd2lzZSBhcHBseSBhbGwgcGVuZGluZyBhdHRyaWJ1dGVzXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHRoaXMuX3JlbmRlcmVyLmVsZW0sIGNoYW5nZWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdDbGlwKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGNsaXAgPSBzdmcuZ2V0Q2xpcCh0aGlzKTtcclxuICAgICAgICAgIHZhciBlbGVtID0gdGhpcy5fcmVuZGVyZXIuZWxlbTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fY2xpcCkge1xyXG4gICAgICAgICAgICBlbGVtLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcclxuICAgICAgICAgICAgY2xpcC5zZXRBdHRyaWJ1dGUoJ2lkJywgdGhpcy5pZCk7XHJcbiAgICAgICAgICAgIGNsaXAuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjbGlwLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcclxuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2lkJywgdGhpcy5pZCk7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50Ll9yZW5kZXJlci5lbGVtLmFwcGVuZENoaWxkKGVsZW0pOyAvLyBUT0RPOiBzaG91bGQgYmUgaW5zZXJ0QmVmb3JlXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ29tbWVudGVkIHR3by13YXkgZnVuY3Rpb25hbGl0eSBvZiBjbGlwcyAvIG1hc2tzIHdpdGggZ3JvdXBzIGFuZFxyXG4gICAgICAgICAqIHBvbHlnb25zLiBVbmNvbW1lbnQgd2hlbiB0aGlzIGJ1ZyBpcyBmaXhlZDpcclxuICAgICAgICAgKiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MzcwOTUxXHJcbiAgICAgICAgICovXHJcblxyXG4gICAgICAgIC8vIGlmICh0aGlzLl9mbGFnTWFzaykge1xyXG4gICAgICAgIC8vICAgaWYgKHRoaXMuX21hc2spIHtcclxuICAgICAgICAvLyAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2NsaXAtcGF0aCcsICd1cmwoIycgKyB0aGlzLl9tYXNrLmlkICsgJyknKTtcclxuICAgICAgICAvLyAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCdjbGlwLXBhdGgnKTtcclxuICAgICAgICAvLyAgIH1cclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdGV4dDoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihkb21FbGVtZW50KSB7XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICB2YXIgY2hhbmdlZCA9IHt9O1xyXG5cclxuICAgICAgICB2YXIgZmxhZ01hdHJpeCA9IHRoaXMuX21hdHJpeC5tYW51YWwgfHwgdGhpcy5fZmxhZ01hdHJpeDtcclxuXHJcbiAgICAgICAgaWYgKGZsYWdNYXRyaXgpIHtcclxuICAgICAgICAgIGNoYW5nZWQudHJhbnNmb3JtID0gJ21hdHJpeCgnICsgdGhpcy5fbWF0cml4LnRvU3RyaW5nKCkgKyAnKSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ0ZhbWlseSkge1xyXG4gICAgICAgICAgY2hhbmdlZFsnZm9udC1mYW1pbHknXSA9IHRoaXMuX2ZhbWlseTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTaXplKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydmb250LXNpemUnXSA9IHRoaXMuX3NpemU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnTGVhZGluZykge1xyXG4gICAgICAgICAgY2hhbmdlZFsnbGluZS1oZWlnaHQnXSA9IHRoaXMuX2xlYWRpbmc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnQWxpZ25tZW50KSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWyd0ZXh0LWFuY2hvciddID0gc3ZnLmFsaWdubWVudHNbdGhpcy5fYWxpZ25tZW50XSB8fCB0aGlzLl9hbGlnbm1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnQmFzZWxpbmUpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ2FsaWdubWVudC1iYXNlbGluZSddID0gY2hhbmdlZFsnZG9taW5hbnQtYmFzZWxpbmUnXSA9IHRoaXMuX2Jhc2VsaW5lO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1N0eWxlKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkWydmb250LXN0eWxlJ10gPSB0aGlzLl9zdHlsZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdXZWlnaHQpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ2ZvbnQtd2VpZ2h0J10gPSB0aGlzLl93ZWlnaHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnRGVjb3JhdGlvbikge1xyXG4gICAgICAgICAgY2hhbmdlZFsndGV4dC1kZWNvcmF0aW9uJ10gPSB0aGlzLl9kZWNvcmF0aW9uO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmlsbCAmJiB0aGlzLl9maWxsLl9yZW5kZXJlcikge1xyXG4gICAgICAgICAgdGhpcy5fZmlsbC5fdXBkYXRlKCk7XHJcbiAgICAgICAgICBzdmdbdGhpcy5fZmlsbC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwodGhpcy5fZmlsbCwgZG9tRWxlbWVudCwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnRmlsbCkge1xyXG4gICAgICAgICAgY2hhbmdlZC5maWxsID0gdGhpcy5fZmlsbCAmJiB0aGlzLl9maWxsLmlkXHJcbiAgICAgICAgICAgID8gJ3VybCgjJyArIHRoaXMuX2ZpbGwuaWQgKyAnKScgOiB0aGlzLl9maWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fc3Ryb2tlICYmIHRoaXMuX3N0cm9rZS5fcmVuZGVyZXIpIHtcclxuICAgICAgICAgIHRoaXMuX3N0cm9rZS5fdXBkYXRlKCk7XHJcbiAgICAgICAgICBzdmdbdGhpcy5fc3Ryb2tlLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbCh0aGlzLl9zdHJva2UsIGRvbUVsZW1lbnQsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1N0cm9rZSkge1xyXG4gICAgICAgICAgY2hhbmdlZC5zdHJva2UgPSB0aGlzLl9zdHJva2UgJiYgdGhpcy5fc3Ryb2tlLmlkXHJcbiAgICAgICAgICAgID8gJ3VybCgjJyArIHRoaXMuX3N0cm9rZS5pZCArICcpJyA6IHRoaXMuX3N0cm9rZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdMaW5ld2lkdGgpIHtcclxuICAgICAgICAgIGNoYW5nZWRbJ3N0cm9rZS13aWR0aCddID0gdGhpcy5fbGluZXdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ09wYWNpdHkpIHtcclxuICAgICAgICAgIGNoYW5nZWQub3BhY2l0eSA9IHRoaXMuX29wYWNpdHk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnVmlzaWJsZSkge1xyXG4gICAgICAgICAgY2hhbmdlZC52aXNpYmlsaXR5ID0gdGhpcy5fdmlzaWJsZSA/ICd2aXNpYmxlJyA6ICdoaWRkZW4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lbGVtKSB7XHJcblxyXG4gICAgICAgICAgY2hhbmdlZC5pZCA9IHRoaXMuaWQ7XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbSA9IHN2Zy5jcmVhdGVFbGVtZW50KCd0ZXh0JywgY2hhbmdlZCk7XHJcbiAgICAgICAgICBkb21FbGVtZW50LmRlZnMuYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyZXIuZWxlbSk7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXModGhpcy5fcmVuZGVyZXIuZWxlbSwgY2hhbmdlZCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdDbGlwKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGNsaXAgPSBzdmcuZ2V0Q2xpcCh0aGlzKTtcclxuICAgICAgICAgIHZhciBlbGVtID0gdGhpcy5fcmVuZGVyZXIuZWxlbTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fY2xpcCkge1xyXG4gICAgICAgICAgICBlbGVtLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcclxuICAgICAgICAgICAgY2xpcC5zZXRBdHRyaWJ1dGUoJ2lkJywgdGhpcy5pZCk7XHJcbiAgICAgICAgICAgIGNsaXAuYXBwZW5kQ2hpbGQoZWxlbSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjbGlwLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcclxuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUoJ2lkJywgdGhpcy5pZCk7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50Ll9yZW5kZXJlci5lbGVtLmFwcGVuZENoaWxkKGVsZW0pOyAvLyBUT0RPOiBzaG91bGQgYmUgaW5zZXJ0QmVmb3JlXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdWYWx1ZSkge1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS50ZXh0Q29udGVudCA9IHRoaXMuX3ZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAnbGluZWFyLWdyYWRpZW50Jzoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihkb21FbGVtZW50LCBzaWxlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFzaWxlbnQpIHtcclxuICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoYW5nZWQgPSB7fTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdFbmRQb2ludHMpIHtcclxuICAgICAgICAgIGNoYW5nZWQueDEgPSB0aGlzLmxlZnQuX3g7XHJcbiAgICAgICAgICBjaGFuZ2VkLnkxID0gdGhpcy5sZWZ0Ll95O1xyXG4gICAgICAgICAgY2hhbmdlZC54MiA9IHRoaXMucmlnaHQuX3g7XHJcbiAgICAgICAgICBjaGFuZ2VkLnkyID0gdGhpcy5yaWdodC5feTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3ByZWFkKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnNwcmVhZE1ldGhvZCA9IHRoaXMuX3NwcmVhZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIGF0dGFjaGVkIERPTSBlbGVtZW50IHlldCxcclxuICAgICAgICAvLyBjcmVhdGUgaXQgd2l0aCBhbGwgbmVjZXNzYXJ5IGF0dHJpYnV0ZXMuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lbGVtKSB7XHJcblxyXG4gICAgICAgICAgY2hhbmdlZC5pZCA9IHRoaXMuaWQ7XHJcbiAgICAgICAgICBjaGFuZ2VkLmdyYWRpZW50VW5pdHMgPSAndXNlclNwYWNlT25Vc2UnO1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbSA9IHN2Zy5jcmVhdGVFbGVtZW50KCdsaW5lYXJHcmFkaWVudCcsIGNoYW5nZWQpO1xyXG4gICAgICAgICAgZG9tRWxlbWVudC5kZWZzLmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLmVsZW0pO1xyXG5cclxuICAgICAgICAvLyBPdGhlcndpc2UgYXBwbHkgYWxsIHBlbmRpbmcgYXR0cmlidXRlc1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXModGhpcy5fcmVuZGVyZXIuZWxlbSwgY2hhbmdlZCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTdG9wcykge1xyXG5cclxuICAgICAgICAgIHZhciBsZW5ndGhDaGFuZ2VkID0gdGhpcy5fcmVuZGVyZXIuZWxlbS5jaGlsZE5vZGVzLmxlbmd0aFxyXG4gICAgICAgICAgICAhPT0gdGhpcy5zdG9wcy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgaWYgKGxlbmd0aENoYW5nZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWxlbS5jaGlsZE5vZGVzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0b3BzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RvcCA9IHRoaXMuc3RvcHNbaV07XHJcbiAgICAgICAgICAgIHZhciBhdHRycyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0b3AuX2ZsYWdPZmZzZXQpIHtcclxuICAgICAgICAgICAgICBhdHRycy5vZmZzZXQgPSAxMDAgKiBzdG9wLl9vZmZzZXQgKyAnJSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN0b3AuX2ZsYWdDb2xvcikge1xyXG4gICAgICAgICAgICAgIGF0dHJzWydzdG9wLWNvbG9yJ10gPSBzdG9wLl9jb2xvcjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3RvcC5fZmxhZ09wYWNpdHkpIHtcclxuICAgICAgICAgICAgICBhdHRyc1snc3RvcC1vcGFjaXR5J10gPSBzdG9wLl9vcGFjaXR5O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXN0b3AuX3JlbmRlcmVyLmVsZW0pIHtcclxuICAgICAgICAgICAgICBzdG9wLl9yZW5kZXJlci5lbGVtID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ3N0b3AnLCBhdHRycyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXMoc3RvcC5fcmVuZGVyZXIuZWxlbSwgYXR0cnMpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobGVuZ3RoQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0uYXBwZW5kQ2hpbGQoc3RvcC5fcmVuZGVyZXIuZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc3RvcC5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAncmFkaWFsLWdyYWRpZW50Jzoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihkb21FbGVtZW50LCBzaWxlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFzaWxlbnQpIHtcclxuICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoYW5nZWQgPSB7fTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdDZW50ZXIpIHtcclxuICAgICAgICAgIGNoYW5nZWQuY3ggPSB0aGlzLmNlbnRlci5feDtcclxuICAgICAgICAgIGNoYW5nZWQuY3kgPSB0aGlzLmNlbnRlci5feTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdGb2NhbCkge1xyXG4gICAgICAgICAgY2hhbmdlZC5meCA9IHRoaXMuZm9jYWwuX3g7XHJcbiAgICAgICAgICBjaGFuZ2VkLmZ5ID0gdGhpcy5mb2NhbC5feTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnUmFkaXVzKSB7XHJcbiAgICAgICAgICBjaGFuZ2VkLnIgPSB0aGlzLl9yYWRpdXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1NwcmVhZCkge1xyXG4gICAgICAgICAgY2hhbmdlZC5zcHJlYWRNZXRob2QgPSB0aGlzLl9zcHJlYWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBhdHRhY2hlZCBET00gZWxlbWVudCB5ZXQsXHJcbiAgICAgICAgLy8gY3JlYXRlIGl0IHdpdGggYWxsIG5lY2Vzc2FyeSBhdHRyaWJ1dGVzLlxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWxlbSkge1xyXG5cclxuICAgICAgICAgIGNoYW5nZWQuaWQgPSB0aGlzLmlkO1xyXG4gICAgICAgICAgY2hhbmdlZC5ncmFkaWVudFVuaXRzID0gJ3VzZXJTcGFjZU9uVXNlJztcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0gPSBzdmcuY3JlYXRlRWxlbWVudCgncmFkaWFsR3JhZGllbnQnLCBjaGFuZ2VkKTtcclxuICAgICAgICAgIGRvbUVsZW1lbnQuZGVmcy5hcHBlbmRDaGlsZCh0aGlzLl9yZW5kZXJlci5lbGVtKTtcclxuXHJcbiAgICAgICAgLy8gT3RoZXJ3aXNlIGFwcGx5IGFsbCBwZW5kaW5nIGF0dHJpYnV0ZXNcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHRoaXMuX3JlbmRlcmVyLmVsZW0sIGNoYW5nZWQpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3RvcHMpIHtcclxuXHJcbiAgICAgICAgICB2YXIgbGVuZ3RoQ2hhbmdlZCA9IHRoaXMuX3JlbmRlcmVyLmVsZW0uY2hpbGROb2Rlcy5sZW5ndGhcclxuICAgICAgICAgICAgIT09IHRoaXMuc3RvcHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgIGlmIChsZW5ndGhDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVsZW0uY2hpbGROb2Rlcy5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdG9wcy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgdmFyIHN0b3AgPSB0aGlzLnN0b3BzW2ldO1xyXG4gICAgICAgICAgICB2YXIgYXR0cnMgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdG9wLl9mbGFnT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgYXR0cnMub2Zmc2V0ID0gMTAwICogc3RvcC5fb2Zmc2V0ICsgJyUnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzdG9wLl9mbGFnQ29sb3IpIHtcclxuICAgICAgICAgICAgICBhdHRyc1snc3RvcC1jb2xvciddID0gc3RvcC5fY29sb3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHN0b3AuX2ZsYWdPcGFjaXR5KSB7XHJcbiAgICAgICAgICAgICAgYXR0cnNbJ3N0b3Atb3BhY2l0eSddID0gc3RvcC5fb3BhY2l0eTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFzdG9wLl9yZW5kZXJlci5lbGVtKSB7XHJcbiAgICAgICAgICAgICAgc3RvcC5fcmVuZGVyZXIuZWxlbSA9IHN2Zy5jcmVhdGVFbGVtZW50KCdzdG9wJywgYXR0cnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHN0b3AuX3JlbmRlcmVyLmVsZW0sIGF0dHJzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGxlbmd0aENoYW5nZWQpIHtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLmFwcGVuZENoaWxkKHN0b3AuX3JlbmRlcmVyLmVsZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0b3AuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdGV4dHVyZToge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihkb21FbGVtZW50LCBzaWxlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFzaWxlbnQpIHtcclxuICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNoYW5nZWQgPSB7fTtcclxuICAgICAgICB2YXIgc3R5bGVzID0geyB4OiAwLCB5OiAwIH07XHJcbiAgICAgICAgdmFyIGltYWdlID0gdGhpcy5pbWFnZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdMb2FkZWQgJiYgdGhpcy5sb2FkZWQpIHtcclxuXHJcbiAgICAgICAgICBzd2l0Y2ggKGltYWdlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2NhbnZhcyc6XHJcbiAgICAgICAgICAgICAgc3R5bGVzLmhyZWYgPSBzdHlsZXNbJ3hsaW5rOmhyZWYnXSA9IGltYWdlLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2ltZyc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2ltYWdlJzpcclxuICAgICAgICAgICAgICBzdHlsZXMuaHJlZiA9IHN0eWxlc1sneGxpbms6aHJlZiddID0gdGhpcy5zcmM7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnT2Zmc2V0IHx8IHRoaXMuX2ZsYWdMb2FkZWQgfHwgdGhpcy5fZmxhZ1NjYWxlKSB7XHJcblxyXG4gICAgICAgICAgY2hhbmdlZC54ID0gdGhpcy5fb2Zmc2V0Lng7XHJcbiAgICAgICAgICBjaGFuZ2VkLnkgPSB0aGlzLl9vZmZzZXQueTtcclxuXHJcbiAgICAgICAgICBpZiAoaW1hZ2UpIHtcclxuXHJcbiAgICAgICAgICAgIGNoYW5nZWQueCAtPSBpbWFnZS53aWR0aCAvIDI7XHJcbiAgICAgICAgICAgIGNoYW5nZWQueSAtPSBpbWFnZS5oZWlnaHQgLyAyO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICAgIGNoYW5nZWQueCAqPSB0aGlzLl9zY2FsZS54O1xyXG4gICAgICAgICAgICAgIGNoYW5nZWQueSAqPSB0aGlzLl9zY2FsZS55O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGNoYW5nZWQueCAqPSB0aGlzLl9zY2FsZTtcclxuICAgICAgICAgICAgICBjaGFuZ2VkLnkgKj0gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoY2hhbmdlZC54ID4gMCkge1xyXG4gICAgICAgICAgICBjaGFuZ2VkLnggKj0gLSAxO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGNoYW5nZWQueSA+IDApIHtcclxuICAgICAgICAgICAgY2hhbmdlZC55ICo9IC0gMTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1NjYWxlIHx8IHRoaXMuX2ZsYWdMb2FkZWQgfHwgdGhpcy5fZmxhZ1JlcGVhdCkge1xyXG5cclxuICAgICAgICAgIGNoYW5nZWQud2lkdGggPSAwO1xyXG4gICAgICAgICAgY2hhbmdlZC5oZWlnaHQgPSAwO1xyXG5cclxuICAgICAgICAgIGlmIChpbWFnZSkge1xyXG5cclxuICAgICAgICAgICAgc3R5bGVzLndpZHRoID0gY2hhbmdlZC53aWR0aCA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICBzdHlsZXMuaGVpZ2h0ID0gY2hhbmdlZC5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAvLyBUT0RPOiBIYWNrIC8gQmFuZGFpZFxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuX3JlcGVhdCkge1xyXG4gICAgICAgICAgICAgIGNhc2UgJ25vLXJlcGVhdCc6XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VkLndpZHRoICs9IDE7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VkLmhlaWdodCArPSAxO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgICBjaGFuZ2VkLndpZHRoICo9IHRoaXMuX3NjYWxlLng7XHJcbiAgICAgICAgICAgICAgY2hhbmdlZC5oZWlnaHQgKj0gdGhpcy5fc2NhbGUueTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjaGFuZ2VkLndpZHRoICo9IHRoaXMuX3NjYWxlO1xyXG4gICAgICAgICAgICAgIGNoYW5nZWQuaGVpZ2h0ICo9IHRoaXMuX3NjYWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTY2FsZSB8fCB0aGlzLl9mbGFnTG9hZGVkKSB7XHJcbiAgICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmltYWdlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmltYWdlID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ2ltYWdlJywgc3R5bGVzKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoIV8uaXNFbXB0eShzdHlsZXMpKSB7XHJcbiAgICAgICAgICAgIHN2Zy5zZXRBdHRyaWJ1dGVzKHRoaXMuX3JlbmRlcmVyLmltYWdlLCBzdHlsZXMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lbGVtKSB7XHJcblxyXG4gICAgICAgICAgY2hhbmdlZC5pZCA9IHRoaXMuaWQ7XHJcbiAgICAgICAgICBjaGFuZ2VkLnBhdHRlcm5Vbml0cyA9ICd1c2VyU3BhY2VPblVzZSc7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ3BhdHRlcm4nLCBjaGFuZ2VkKTtcclxuICAgICAgICAgIGRvbUVsZW1lbnQuZGVmcy5hcHBlbmRDaGlsZCh0aGlzLl9yZW5kZXJlci5lbGVtKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmICghXy5pc0VtcHR5KGNoYW5nZWQpKSB7XHJcblxyXG4gICAgICAgICAgc3ZnLnNldEF0dHJpYnV0ZXModGhpcy5fcmVuZGVyZXIuZWxlbSwgY2hhbmdlZCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3JlbmRlcmVyLmVsZW0gJiYgdGhpcy5fcmVuZGVyZXIuaW1hZ2UgJiYgIXRoaXMuX3JlbmRlcmVyLmFwcGVuZGVkKSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lbGVtLmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLmltYWdlKTtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmFwcGVuZGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQGNsYXNzXHJcbiAgICovXHJcbiAgdmFyIFJlbmRlcmVyID0gVHdvW1R3by5UeXBlcy5zdmddID0gZnVuY3Rpb24ocGFyYW1zKSB7XHJcblxyXG4gICAgdGhpcy5kb21FbGVtZW50ID0gcGFyYW1zLmRvbUVsZW1lbnQgfHwgc3ZnLmNyZWF0ZUVsZW1lbnQoJ3N2ZycpO1xyXG5cclxuICAgIHRoaXMuc2NlbmUgPSBuZXcgVHdvLkdyb3VwKCk7XHJcbiAgICB0aGlzLnNjZW5lLnBhcmVudCA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy5kZWZzID0gc3ZnLmNyZWF0ZUVsZW1lbnQoJ2RlZnMnKTtcclxuICAgIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLmRlZnMpO1xyXG4gICAgdGhpcy5kb21FbGVtZW50LmRlZnMgPSB0aGlzLmRlZnM7XHJcbiAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoUmVuZGVyZXIsIHtcclxuXHJcbiAgICBVdGlsczogc3ZnXHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChSZW5kZXJlci5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICBzZXRTaXplOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XHJcblxyXG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgc3ZnLnNldEF0dHJpYnV0ZXModGhpcy5kb21FbGVtZW50LCB7XHJcbiAgICAgICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgICAgIGhlaWdodDogaGVpZ2h0XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgc3ZnLmdyb3VwLnJlbmRlci5jYWxsKHRoaXMuc2NlbmUsIHRoaXMuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgLyoqXHJcbiAgICogQ29uc3RhbnRzXHJcbiAgICovXHJcbiAgdmFyIG1vZCA9IFR3by5VdGlscy5tb2QsIHRvRml4ZWQgPSBUd28uVXRpbHMudG9GaXhlZDtcclxuICB2YXIgZ2V0UmF0aW8gPSBUd28uVXRpbHMuZ2V0UmF0aW87XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIC8vIFJldHVybnMgdHJ1ZSBpZiB0aGlzIGlzIGEgbm9uLXRyYW5zZm9ybWluZyBtYXRyaXhcclxuICB2YXIgaXNEZWZhdWx0TWF0cml4ID0gZnVuY3Rpb24gKG0pIHtcclxuICAgIHJldHVybiAobVswXSA9PSAxICYmIG1bM10gPT0gMCAmJiBtWzFdID09IDAgJiYgbVs0XSA9PSAxICYmIG1bMl0gPT0gMCAmJiBtWzVdID09IDApO1xyXG4gIH07XHJcblxyXG4gIHZhciBjYW52YXMgPSB7XHJcblxyXG4gICAgaXNIaWRkZW46IC8obm9uZXx0cmFuc3BhcmVudCkvaSxcclxuXHJcbiAgICBhbGlnbm1lbnRzOiB7XHJcbiAgICAgIGxlZnQ6ICdzdGFydCcsXHJcbiAgICAgIG1pZGRsZTogJ2NlbnRlcicsXHJcbiAgICAgIHJpZ2h0OiAnZW5kJ1xyXG4gICAgfSxcclxuXHJcbiAgICBzaGltOiBmdW5jdGlvbihlbGVtKSB7XHJcbiAgICAgIGVsZW0udGFnTmFtZSA9ICdjYW52YXMnO1xyXG4gICAgICBlbGVtLm5vZGVUeXBlID0gMTtcclxuICAgICAgcmV0dXJuIGVsZW07XHJcbiAgICB9LFxyXG5cclxuICAgIGdyb3VwOiB7XHJcblxyXG4gICAgICByZW5kZXJDaGlsZDogZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBjYW52YXNbY2hpbGQuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGNoaWxkLCB0aGlzLmN0eCwgdHJ1ZSwgdGhpcy5jbGlwKTtcclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4KSB7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEFkZCBhIGNoZWNrIGhlcmUgdG8gb25seSBpbnZva2UgX3VwZGF0ZSBpZiBuZWVkIGJlLlxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICB2YXIgbWF0cml4ID0gdGhpcy5fbWF0cml4LmVsZW1lbnRzO1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudDtcclxuICAgICAgICB0aGlzLl9yZW5kZXJlci5vcGFjaXR5ID0gdGhpcy5fb3BhY2l0eSAqIChwYXJlbnQgJiYgcGFyZW50Ll9yZW5kZXJlciA/IHBhcmVudC5fcmVuZGVyZXIub3BhY2l0eSA6IDEpO1xyXG5cclxuICAgICAgICB2YXIgZGVmYXVsdE1hdHJpeCA9IGlzRGVmYXVsdE1hdHJpeChtYXRyaXgpO1xyXG5cclxuICAgICAgICB2YXIgbWFzayA9IHRoaXMuX21hc2s7XHJcbiAgICAgICAgLy8gdmFyIGNsaXAgPSB0aGlzLl9jbGlwO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmNvbnRleHQpIHtcclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmNvbnRleHQgPSB7fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3JlbmRlcmVyLmNvbnRleHQuY3R4ID0gY3R4O1xyXG4gICAgICAgIC8vIHRoaXMuX3JlbmRlcmVyLmNvbnRleHQuY2xpcCA9IGNsaXA7XHJcblxyXG4gICAgICAgIGlmICghZGVmYXVsdE1hdHJpeCkge1xyXG4gICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgIGN0eC50cmFuc2Zvcm0obWF0cml4WzBdLCBtYXRyaXhbM10sIG1hdHJpeFsxXSwgbWF0cml4WzRdLCBtYXRyaXhbMl0sIG1hdHJpeFs1XSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWFzaykge1xyXG4gICAgICAgICAgY2FudmFzW21hc2suX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKG1hc2ssIGN0eCwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcGFjaXR5ID4gMCAmJiB0aGlzLnNjYWxlICE9PSAwKSB7XHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcclxuICAgICAgICAgICAgY2FudmFzW2NoaWxkLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChjaGlsZCwgY3R4KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZGVmYXVsdE1hdHJpeCkge1xyXG4gICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgLyoqXHJcbiAgICAgICAgICogQ29tbWVudGVkIHR3by13YXkgZnVuY3Rpb25hbGl0eSBvZiBjbGlwcyAvIG1hc2tzIHdpdGggZ3JvdXBzIGFuZFxyXG4gICAgICAgICAqIHBvbHlnb25zLiBVbmNvbW1lbnQgd2hlbiB0aGlzIGJ1ZyBpcyBmaXhlZDpcclxuICAgICAgICAgKiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MzcwOTUxXHJcbiAgICAgICAgICovXHJcblxyXG4gICAgICAgIC8vIGlmIChjbGlwKSB7XHJcbiAgICAgICAgLy8gICBjdHguY2xpcCgpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBwYXRoOiB7XHJcblxyXG4gICAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgZm9yY2VkLCBwYXJlbnRDbGlwcGVkKSB7XHJcblxyXG4gICAgICAgIHZhciBtYXRyaXgsIHN0cm9rZSwgbGluZXdpZHRoLCBmaWxsLCBvcGFjaXR5LCB2aXNpYmxlLCBjYXAsIGpvaW4sIG1pdGVyLFxyXG4gICAgICAgICAgICBjbG9zZWQsIGNvbW1hbmRzLCBsZW5ndGgsIGxhc3QsIG5leHQsIHByZXYsIGEsIGIsIGMsIGQsIHV4LCB1eSwgdngsIHZ5LFxyXG4gICAgICAgICAgICBhciwgYmwsIGJyLCBjbCwgeCwgeSwgbWFzaywgY2xpcCwgZGVmYXVsdE1hdHJpeCwgaXNPZmZzZXQ7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEFkZCBhIGNoZWNrIGhlcmUgdG8gb25seSBpbnZva2UgX3VwZGF0ZSBpZiBuZWVkIGJlLlxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICBtYXRyaXggPSB0aGlzLl9tYXRyaXguZWxlbWVudHM7XHJcbiAgICAgICAgc3Ryb2tlID0gdGhpcy5fc3Ryb2tlO1xyXG4gICAgICAgIGxpbmV3aWR0aCA9IHRoaXMuX2xpbmV3aWR0aDtcclxuICAgICAgICBmaWxsID0gdGhpcy5fZmlsbDtcclxuICAgICAgICBvcGFjaXR5ID0gdGhpcy5fb3BhY2l0eSAqIHRoaXMucGFyZW50Ll9yZW5kZXJlci5vcGFjaXR5O1xyXG4gICAgICAgIHZpc2libGUgPSB0aGlzLl92aXNpYmxlO1xyXG4gICAgICAgIGNhcCA9IHRoaXMuX2NhcDtcclxuICAgICAgICBqb2luID0gdGhpcy5fam9pbjtcclxuICAgICAgICBtaXRlciA9IHRoaXMuX21pdGVyO1xyXG4gICAgICAgIGNsb3NlZCA9IHRoaXMuX2Nsb3NlZDtcclxuICAgICAgICBjb21tYW5kcyA9IHRoaXMuX3ZlcnRpY2VzOyAvLyBDb21tYW5kc1xyXG4gICAgICAgIGxlbmd0aCA9IGNvbW1hbmRzLmxlbmd0aDtcclxuICAgICAgICBsYXN0ID0gbGVuZ3RoIC0gMTtcclxuICAgICAgICBkZWZhdWx0TWF0cml4ID0gaXNEZWZhdWx0TWF0cml4KG1hdHJpeCk7XHJcblxyXG4gICAgICAgIC8vIG1hc2sgPSB0aGlzLl9tYXNrO1xyXG4gICAgICAgIGNsaXAgPSB0aGlzLl9jbGlwO1xyXG5cclxuICAgICAgICBpZiAoIWZvcmNlZCAmJiAoIXZpc2libGUgfHwgY2xpcCkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVHJhbnNmb3JtXHJcbiAgICAgICAgaWYgKCFkZWZhdWx0TWF0cml4KSB7XHJcbiAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgY3R4LnRyYW5zZm9ybShtYXRyaXhbMF0sIG1hdHJpeFszXSwgbWF0cml4WzFdLCBtYXRyaXhbNF0sIG1hdHJpeFsyXSwgbWF0cml4WzVdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgLyoqXHJcbiAgICAgICAgICogQ29tbWVudGVkIHR3by13YXkgZnVuY3Rpb25hbGl0eSBvZiBjbGlwcyAvIG1hc2tzIHdpdGggZ3JvdXBzIGFuZFxyXG4gICAgICAgICAqIHBvbHlnb25zLiBVbmNvbW1lbnQgd2hlbiB0aGlzIGJ1ZyBpcyBmaXhlZDpcclxuICAgICAgICAgKiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MzcwOTUxXHJcbiAgICAgICAgICovXHJcblxyXG4gICAgICAgIC8vIGlmIChtYXNrKSB7XHJcbiAgICAgICAgLy8gICBjYW52YXNbbWFzay5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwobWFzaywgY3R4LCB0cnVlKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIC8vIFN0eWxlc1xyXG4gICAgICAgIGlmIChmaWxsKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyhmaWxsKSkge1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZmlsbDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhbnZhc1tmaWxsLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChmaWxsLCBjdHgpO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZmlsbC5fcmVuZGVyZXIuZWZmZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3Ryb2tlKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyhzdHJva2UpKSB7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhbnZhc1tzdHJva2UuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHN0cm9rZSwgY3R4KTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlLl9yZW5kZXJlci5lZmZlY3Q7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsaW5ld2lkdGgpIHtcclxuICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBsaW5ld2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtaXRlcikge1xyXG4gICAgICAgICAgY3R4Lm1pdGVyTGltaXQgPSBtaXRlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGpvaW4pIHtcclxuICAgICAgICAgIGN0eC5saW5lSm9pbiA9IGpvaW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjYXApIHtcclxuICAgICAgICAgIGN0eC5saW5lQ2FwID0gY2FwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoXy5pc051bWJlcihvcGFjaXR5KSkge1xyXG4gICAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gb3BhY2l0eTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb21tYW5kcy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgIGIgPSBjb21tYW5kc1tpXTtcclxuXHJcbiAgICAgICAgICB4ID0gdG9GaXhlZChiLl94KTtcclxuICAgICAgICAgIHkgPSB0b0ZpeGVkKGIuX3kpO1xyXG5cclxuICAgICAgICAgIHN3aXRjaCAoYi5fY29tbWFuZCkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMuY2xvc2U6XHJcbiAgICAgICAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMuY3VydmU6XHJcblxyXG4gICAgICAgICAgICAgIHByZXYgPSBjbG9zZWQgPyBtb2QoaSAtIDEsIGxlbmd0aCkgOiBNYXRoLm1heChpIC0gMSwgMCk7XHJcbiAgICAgICAgICAgICAgbmV4dCA9IGNsb3NlZCA/IG1vZChpICsgMSwgbGVuZ3RoKSA6IE1hdGgubWluKGkgKyAxLCBsYXN0KTtcclxuXHJcbiAgICAgICAgICAgICAgYSA9IGNvbW1hbmRzW3ByZXZdO1xyXG4gICAgICAgICAgICAgIGMgPSBjb21tYW5kc1tuZXh0XTtcclxuICAgICAgICAgICAgICBhciA9IChhLmNvbnRyb2xzICYmIGEuY29udHJvbHMucmlnaHQpIHx8IFR3by5WZWN0b3IuemVybztcclxuICAgICAgICAgICAgICBibCA9IChiLmNvbnRyb2xzICYmIGIuY29udHJvbHMubGVmdCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoYS5fcmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgIHZ4ID0gKGFyLnggKyB0b0ZpeGVkKGEuX3gpKTtcclxuICAgICAgICAgICAgICAgIHZ5ID0gKGFyLnkgKyB0b0ZpeGVkKGEuX3kpKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKGFyLngpO1xyXG4gICAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKGFyLnkpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgaWYgKGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICB1eCA9IChibC54ICsgdG9GaXhlZChiLl94KSk7XHJcbiAgICAgICAgICAgICAgICB1eSA9IChibC55ICsgdG9GaXhlZChiLl95KSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHV4ID0gdG9GaXhlZChibC54KTtcclxuICAgICAgICAgICAgICAgIHV5ID0gdG9GaXhlZChibC55KTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGN0eC5iZXppZXJDdXJ2ZVRvKHZ4LCB2eSwgdXgsIHV5LCB4LCB5KTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKGkgPj0gbGFzdCAmJiBjbG9zZWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjID0gZDtcclxuXHJcbiAgICAgICAgICAgICAgICBiciA9IChiLmNvbnRyb2xzICYmIGIuY29udHJvbHMucmlnaHQpIHx8IFR3by5WZWN0b3IuemVybztcclxuICAgICAgICAgICAgICAgIGNsID0gKGMuY29udHJvbHMgJiYgYy5jb250cm9scy5sZWZ0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHZ4ID0gKGJyLnggKyB0b0ZpeGVkKGIuX3gpKTtcclxuICAgICAgICAgICAgICAgICAgdnkgPSAoYnIueSArIHRvRml4ZWQoYi5feSkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdnggPSB0b0ZpeGVkKGJyLngpO1xyXG4gICAgICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoYnIueSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGMuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgIHV4ID0gKGNsLnggKyB0b0ZpeGVkKGMuX3gpKTtcclxuICAgICAgICAgICAgICAgICAgdXkgPSAoY2wueSArIHRvRml4ZWQoYy5feSkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKGNsLngpO1xyXG4gICAgICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoY2wueSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgeCA9IHRvRml4ZWQoYy5feCk7XHJcbiAgICAgICAgICAgICAgICB5ID0gdG9GaXhlZChjLl95KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2eCwgdnksIHV4LCB1eSwgeCwgeSk7XHJcblxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5saW5lOlxyXG4gICAgICAgICAgICAgIGN0eC5saW5lVG8oeCwgeSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFR3by5Db21tYW5kcy5tb3ZlOlxyXG4gICAgICAgICAgICAgIGQgPSBiO1xyXG4gICAgICAgICAgICAgIGN0eC5tb3ZlVG8oeCwgeSk7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTG9vc2UgZW5kc1xyXG5cclxuICAgICAgICBpZiAoY2xvc2VkKSB7XHJcbiAgICAgICAgICBjdHguY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWNsaXAgJiYgIXBhcmVudENsaXBwZWQpIHtcclxuICAgICAgICAgIGlmICghY2FudmFzLmlzSGlkZGVuLnRlc3QoZmlsbCkpIHtcclxuICAgICAgICAgICAgaXNPZmZzZXQgPSBmaWxsLl9yZW5kZXJlciAmJiBmaWxsLl9yZW5kZXJlci5vZmZzZXRcclxuICAgICAgICAgICAgaWYgKGlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgICBjdHgudHJhbnNsYXRlKFxyXG4gICAgICAgICAgICAgICAgLSBmaWxsLl9yZW5kZXJlci5vZmZzZXQueCwgLSBmaWxsLl9yZW5kZXJlci5vZmZzZXQueSk7XHJcbiAgICAgICAgICAgICAgY3R4LnNjYWxlKGZpbGwuX3JlbmRlcmVyLnNjYWxlLngsIGZpbGwuX3JlbmRlcmVyLnNjYWxlLnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIGlmIChpc09mZnNldCkge1xyXG4gICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICghY2FudmFzLmlzSGlkZGVuLnRlc3Qoc3Ryb2tlKSkge1xyXG4gICAgICAgICAgICBpc09mZnNldCA9IHN0cm9rZS5fcmVuZGVyZXIgJiYgc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQ7XHJcbiAgICAgICAgICAgIGlmIChpc09mZnNldCkge1xyXG4gICAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZShcclxuICAgICAgICAgICAgICAgIC0gc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueCwgLSBzdHJva2UuX3JlbmRlcmVyLm9mZnNldC55KTtcclxuICAgICAgICAgICAgICBjdHguc2NhbGUoc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54LCBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnkpO1xyXG4gICAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBsaW5ld2lkdGggLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLng7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICBpZiAoaXNPZmZzZXQpIHtcclxuICAgICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWRlZmF1bHRNYXRyaXgpIHtcclxuICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY2xpcCAmJiAhcGFyZW50Q2xpcHBlZCkge1xyXG4gICAgICAgICAgY3R4LmNsaXAoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdGV4dDoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIGZvcmNlZCwgcGFyZW50Q2xpcHBlZCkge1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBBZGQgYSBjaGVjayBoZXJlIHRvIG9ubHkgaW52b2tlIF91cGRhdGUgaWYgbmVlZCBiZS5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgdmFyIG1hdHJpeCA9IHRoaXMuX21hdHJpeC5lbGVtZW50cztcclxuICAgICAgICB2YXIgc3Ryb2tlID0gdGhpcy5fc3Ryb2tlO1xyXG4gICAgICAgIHZhciBsaW5ld2lkdGggPSB0aGlzLl9saW5ld2lkdGg7XHJcbiAgICAgICAgdmFyIGZpbGwgPSB0aGlzLl9maWxsO1xyXG4gICAgICAgIHZhciBvcGFjaXR5ID0gdGhpcy5fb3BhY2l0eSAqIHRoaXMucGFyZW50Ll9yZW5kZXJlci5vcGFjaXR5O1xyXG4gICAgICAgIHZhciB2aXNpYmxlID0gdGhpcy5fdmlzaWJsZTtcclxuICAgICAgICB2YXIgZGVmYXVsdE1hdHJpeCA9IGlzRGVmYXVsdE1hdHJpeChtYXRyaXgpO1xyXG4gICAgICAgIHZhciBpc09mZnNldCA9IGZpbGwuX3JlbmRlcmVyICYmIGZpbGwuX3JlbmRlcmVyLm9mZnNldFxyXG4gICAgICAgICAgJiYgc3Ryb2tlLl9yZW5kZXJlciAmJiBzdHJva2UuX3JlbmRlcmVyLm9mZnNldDtcclxuXHJcbiAgICAgICAgdmFyIGEsIGIsIGMsIGQsIGUsIHN4LCBzeTtcclxuXHJcbiAgICAgICAgLy8gbWFzayA9IHRoaXMuX21hc2s7XHJcbiAgICAgICAgdmFyIGNsaXAgPSB0aGlzLl9jbGlwO1xyXG5cclxuICAgICAgICBpZiAoIWZvcmNlZCAmJiAoIXZpc2libGUgfHwgY2xpcCkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVHJhbnNmb3JtXHJcbiAgICAgICAgaWYgKCFkZWZhdWx0TWF0cml4KSB7XHJcbiAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgY3R4LnRyYW5zZm9ybShtYXRyaXhbMF0sIG1hdHJpeFszXSwgbWF0cml4WzFdLCBtYXRyaXhbNF0sIG1hdHJpeFsyXSwgbWF0cml4WzVdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgLyoqXHJcbiAgICAgICAgICogQ29tbWVudGVkIHR3by13YXkgZnVuY3Rpb25hbGl0eSBvZiBjbGlwcyAvIG1hc2tzIHdpdGggZ3JvdXBzIGFuZFxyXG4gICAgICAgICAqIHBvbHlnb25zLiBVbmNvbW1lbnQgd2hlbiB0aGlzIGJ1ZyBpcyBmaXhlZDpcclxuICAgICAgICAgKiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MzcwOTUxXHJcbiAgICAgICAgICovXHJcblxyXG4gICAgICAgIC8vIGlmIChtYXNrKSB7XHJcbiAgICAgICAgLy8gICBjYW52YXNbbWFzay5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwobWFzaywgY3R4LCB0cnVlKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGlmICghaXNPZmZzZXQpIHtcclxuICAgICAgICAgIGN0eC5mb250ID0gW3RoaXMuX3N0eWxlLCB0aGlzLl93ZWlnaHQsIHRoaXMuX3NpemUgKyAncHgvJyArXHJcbiAgICAgICAgICAgIHRoaXMuX2xlYWRpbmcgKyAncHgnLCB0aGlzLl9mYW1pbHldLmpvaW4oJyAnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN0eC50ZXh0QWxpZ24gPSBjYW52YXMuYWxpZ25tZW50c1t0aGlzLl9hbGlnbm1lbnRdIHx8IHRoaXMuX2FsaWdubWVudDtcclxuICAgICAgICBjdHgudGV4dEJhc2VsaW5lID0gdGhpcy5fYmFzZWxpbmU7XHJcblxyXG4gICAgICAgIC8vIFN0eWxlc1xyXG4gICAgICAgIGlmIChmaWxsKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyhmaWxsKSkge1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZmlsbDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhbnZhc1tmaWxsLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChmaWxsLCBjdHgpO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZmlsbC5fcmVuZGVyZXIuZWZmZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3Ryb2tlKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyhzdHJva2UpKSB7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhbnZhc1tzdHJva2UuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHN0cm9rZSwgY3R4KTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlLl9yZW5kZXJlci5lZmZlY3Q7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsaW5ld2lkdGgpIHtcclxuICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBsaW5ld2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzTnVtYmVyKG9wYWNpdHkpKSB7XHJcbiAgICAgICAgICBjdHguZ2xvYmFsQWxwaGEgPSBvcGFjaXR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFjbGlwICYmICFwYXJlbnRDbGlwcGVkKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCFjYW52YXMuaXNIaWRkZW4udGVzdChmaWxsKSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKGZpbGwuX3JlbmRlcmVyICYmIGZpbGwuX3JlbmRlcmVyLm9mZnNldCkge1xyXG5cclxuICAgICAgICAgICAgICBzeCA9IHRvRml4ZWQoZmlsbC5fcmVuZGVyZXIuc2NhbGUueCk7XHJcbiAgICAgICAgICAgICAgc3kgPSB0b0ZpeGVkKGZpbGwuX3JlbmRlcmVyLnNjYWxlLnkpO1xyXG5cclxuICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoIC0gdG9GaXhlZChmaWxsLl9yZW5kZXJlci5vZmZzZXQueCksXHJcbiAgICAgICAgICAgICAgICAtIHRvRml4ZWQoZmlsbC5fcmVuZGVyZXIub2Zmc2V0LnkpKTtcclxuICAgICAgICAgICAgICBjdHguc2NhbGUoc3gsIHN5KTtcclxuXHJcbiAgICAgICAgICAgICAgYSA9IHRoaXMuX3NpemUgLyBmaWxsLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICAgIGIgPSB0aGlzLl9sZWFkaW5nIC8gZmlsbC5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgICBjdHguZm9udCA9IFt0aGlzLl9zdHlsZSwgdGhpcy5fd2VpZ2h0LCB0b0ZpeGVkKGEpICsgJ3B4LycsXHJcbiAgICAgICAgICAgICAgICB0b0ZpeGVkKGIpICsgJ3B4JywgdGhpcy5fZmFtaWx5XS5qb2luKCcgJyk7XHJcblxyXG4gICAgICAgICAgICAgIGMgPSBmaWxsLl9yZW5kZXJlci5vZmZzZXQueCAvIGZpbGwuX3JlbmRlcmVyLnNjYWxlLng7XHJcbiAgICAgICAgICAgICAgZCA9IGZpbGwuX3JlbmRlcmVyLm9mZnNldC55IC8gZmlsbC5fcmVuZGVyZXIuc2NhbGUueTtcclxuXHJcbiAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHRoaXMudmFsdWUsIHRvRml4ZWQoYyksIHRvRml4ZWQoZCkpO1xyXG4gICAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGN0eC5maWxsVGV4dCh0aGlzLnZhbHVlLCAwLCAwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoIWNhbnZhcy5pc0hpZGRlbi50ZXN0KHN0cm9rZSkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdHJva2UuX3JlbmRlcmVyICYmIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0KSB7XHJcblxyXG4gICAgICAgICAgICAgIHN4ID0gdG9GaXhlZChzdHJva2UuX3JlbmRlcmVyLnNjYWxlLngpO1xyXG4gICAgICAgICAgICAgIHN5ID0gdG9GaXhlZChzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnkpO1xyXG5cclxuICAgICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoLSB0b0ZpeGVkKHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LngpLFxyXG4gICAgICAgICAgICAgICAgLSB0b0ZpeGVkKHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LnkpKTtcclxuICAgICAgICAgICAgICBjdHguc2NhbGUoc3gsIHN5KTtcclxuXHJcbiAgICAgICAgICAgICAgYSA9IHRoaXMuX3NpemUgLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgICAgYiA9IHRoaXMuX2xlYWRpbmcgLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgICAgY3R4LmZvbnQgPSBbdGhpcy5fc3R5bGUsIHRoaXMuX3dlaWdodCwgdG9GaXhlZChhKSArICdweC8nLFxyXG4gICAgICAgICAgICAgICAgdG9GaXhlZChiKSArICdweCcsIHRoaXMuX2ZhbWlseV0uam9pbignICcpO1xyXG5cclxuICAgICAgICAgICAgICBjID0gc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueCAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueDtcclxuICAgICAgICAgICAgICBkID0gc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQueSAvIHN0cm9rZS5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgICBlID0gbGluZXdpZHRoIC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54O1xyXG5cclxuICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gdG9GaXhlZChlKTtcclxuICAgICAgICAgICAgICBjdHguc3Ryb2tlVGV4dCh0aGlzLnZhbHVlLCB0b0ZpeGVkKGMpLCB0b0ZpeGVkKGQpKTtcclxuICAgICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjdHguc3Ryb2tlVGV4dCh0aGlzLnZhbHVlLCAwLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFkZWZhdWx0TWF0cml4KSB7XHJcbiAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVE9ETzogVGVzdCBmb3IgdGV4dFxyXG4gICAgICAgIGlmIChjbGlwICYmICFwYXJlbnRDbGlwcGVkKSB7XHJcbiAgICAgICAgICBjdHguY2xpcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAnbGluZWFyLWdyYWRpZW50Jzoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWZmZWN0IHx8IHRoaXMuX2ZsYWdFbmRQb2ludHMgfHwgdGhpcy5fZmxhZ1N0b3BzKSB7XHJcblxyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0ID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KFxyXG4gICAgICAgICAgICB0aGlzLmxlZnQuX3gsIHRoaXMubGVmdC5feSxcclxuICAgICAgICAgICAgdGhpcy5yaWdodC5feCwgdGhpcy5yaWdodC5feVxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3RvcHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIHN0b3AgPSB0aGlzLnN0b3BzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QuYWRkQ29sb3JTdG9wKHN0b3AuX29mZnNldCwgc3RvcC5fY29sb3IpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgJ3JhZGlhbC1ncmFkaWVudCc6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4KSB7XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVmZmVjdCB8fCB0aGlzLl9mbGFnQ2VudGVyIHx8IHRoaXMuX2ZsYWdGb2NhbFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9mbGFnUmFkaXVzIHx8IHRoaXMuX2ZsYWdTdG9wcykge1xyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdCA9IGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudChcclxuICAgICAgICAgICAgdGhpcy5jZW50ZXIuX3gsIHRoaXMuY2VudGVyLl95LCAwLFxyXG4gICAgICAgICAgICB0aGlzLmZvY2FsLl94LCB0aGlzLmZvY2FsLl95LCB0aGlzLl9yYWRpdXNcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0b3BzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzdG9wID0gdGhpcy5zdG9wc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0LmFkZENvbG9yU3RvcChzdG9wLl9vZmZzZXQsIHN0b3AuX2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRleHR1cmU6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4KSB7XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICB2YXIgaW1hZ2UgPSB0aGlzLmltYWdlO1xyXG4gICAgICAgIHZhciByZXBlYXQ7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fcmVuZGVyZXIuZWZmZWN0IHx8ICgodGhpcy5fZmxhZ0xvYWRlZCB8fCB0aGlzLl9mbGFnSW1hZ2UgfHwgdGhpcy5fZmxhZ1ZpZGVvIHx8IHRoaXMuX2ZsYWdSZXBlYXQpICYmIHRoaXMubG9hZGVkKSkge1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0ID0gY3R4LmNyZWF0ZVBhdHRlcm4odGhpcy5pbWFnZSwgdGhpcy5fcmVwZWF0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnT2Zmc2V0IHx8IHRoaXMuX2ZsYWdMb2FkZWQgfHwgdGhpcy5fZmxhZ1NjYWxlKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCEodGhpcy5fcmVuZGVyZXIub2Zmc2V0IGluc3RhbmNlb2YgVHdvLlZlY3RvcikpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0ID0gbmV3IFR3by5WZWN0b3IoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueCA9IC0gdGhpcy5fb2Zmc2V0Lng7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueSA9IC0gdGhpcy5fb2Zmc2V0Lnk7XHJcblxyXG4gICAgICAgICAgaWYgKGltYWdlKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueCArPSBpbWFnZS53aWR0aCAvIDI7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC55ICs9IGltYWdlLmhlaWdodCAvIDI7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnggKj0gdGhpcy5fc2NhbGUueDtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueSAqPSB0aGlzLl9zY2FsZS55O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC54ICo9IHRoaXMuX3NjYWxlO1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC55ICo9IHRoaXMuX3NjYWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZsYWdTY2FsZSB8fCB0aGlzLl9mbGFnTG9hZGVkKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCEodGhpcy5fcmVuZGVyZXIuc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSkge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZSA9IG5ldyBUd28uVmVjdG9yKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZS5jb3B5KHRoaXMuX3NjYWxlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlLnNldCh0aGlzLl9zY2FsZSwgdGhpcy5fc2NhbGUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgfTtcclxuXHJcbiAgdmFyIFJlbmRlcmVyID0gVHdvW1R3by5UeXBlcy5jYW52YXNdID0gZnVuY3Rpb24ocGFyYW1zKSB7XHJcbiAgICAvLyBTbW9vdGhpbmcgcHJvcGVydHkuIERlZmF1bHRzIHRvIHRydWVcclxuICAgIC8vIFNldCBpdCB0byBmYWxzZSB3aGVuIHdvcmtpbmcgd2l0aCBwaXhlbCBhcnQuXHJcbiAgICAvLyBmYWxzZSBjYW4gbGVhZCB0byBiZXR0ZXIgcGVyZm9ybWFuY2UsIHNpbmNlIGl0IHdvdWxkIHVzZSBhIGNoZWFwZXIgaW50ZXJwb2xhdGlvbiBhbGdvcml0aG0uXHJcbiAgICAvLyBJdCBtaWdodCBub3QgbWFrZSBhIGJpZyBkaWZmZXJlbmNlIG9uIEdQVSBiYWNrZWQgY2FudmFzZXMuXHJcbiAgICB2YXIgc21vb3RoaW5nID0gKHBhcmFtcy5zbW9vdGhpbmcgIT09IGZhbHNlKTtcclxuICAgIHRoaXMuZG9tRWxlbWVudCA9IHBhcmFtcy5kb21FbGVtZW50IHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgdGhpcy5jdHggPSB0aGlzLmRvbUVsZW1lbnQuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgIHRoaXMub3ZlcmRyYXcgPSBwYXJhbXMub3ZlcmRyYXcgfHwgZmFsc2U7XHJcblxyXG4gICAgaWYgKCFfLmlzVW5kZWZpbmVkKHRoaXMuY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCkpIHtcclxuICAgICAgdGhpcy5jdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gc21vb3RoaW5nO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEV2ZXJ5dGhpbmcgZHJhd24gb24gdGhlIGNhbnZhcyBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgc2NlbmUuXHJcbiAgICB0aGlzLnNjZW5lID0gbmV3IFR3by5Hcm91cCgpO1xyXG4gICAgdGhpcy5zY2VuZS5wYXJlbnQgPSB0aGlzO1xyXG4gIH07XHJcblxyXG5cclxuICBfLmV4dGVuZChSZW5kZXJlciwge1xyXG5cclxuICAgIFV0aWxzOiBjYW52YXNcclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFJlbmRlcmVyLnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIHNldFNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIHJhdGlvKSB7XHJcblxyXG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgdGhpcy5yYXRpbyA9IF8uaXNVbmRlZmluZWQocmF0aW8pID8gZ2V0UmF0aW8odGhpcy5jdHgpIDogcmF0aW87XHJcblxyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQud2lkdGggPSB3aWR0aCAqIHRoaXMucmF0aW87XHJcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5oZWlnaHQgPSBoZWlnaHQgKiB0aGlzLnJhdGlvO1xyXG5cclxuICAgICAgaWYgKHRoaXMuZG9tRWxlbWVudC5zdHlsZSkge1xyXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMuZG9tRWxlbWVudC5zdHlsZSwge1xyXG4gICAgICAgICAgd2lkdGg6IHdpZHRoICsgJ3B4JyxcclxuICAgICAgICAgIGhlaWdodDogaGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgaXNPbmUgPSB0aGlzLnJhdGlvID09PSAxO1xyXG5cclxuICAgICAgaWYgKCFpc09uZSkge1xyXG4gICAgICAgIHRoaXMuY3R4LnNhdmUoKTtcclxuICAgICAgICB0aGlzLmN0eC5zY2FsZSh0aGlzLnJhdGlvLCB0aGlzLnJhdGlvKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCF0aGlzLm92ZXJkcmF3KSB7XHJcbiAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY2FudmFzLmdyb3VwLnJlbmRlci5jYWxsKHRoaXMuc2NlbmUsIHRoaXMuY3R4KTtcclxuXHJcbiAgICAgIGlmICghaXNPbmUpIHtcclxuICAgICAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIHJlc2V0VHJhbnNmb3JtKGN0eCkge1xyXG4gICAgY3R4LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxuICB9XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICAvKipcclxuICAgKiBDb25zdGFudHNcclxuICAgKi9cclxuXHJcbiAgdmFyIHJvb3QgPSBUd28ucm9vdCxcclxuICAgIG11bHRpcGx5TWF0cml4ID0gVHdvLk1hdHJpeC5NdWx0aXBseSxcclxuICAgIG1vZCA9IFR3by5VdGlscy5tb2QsXHJcbiAgICBpZGVudGl0eSA9IFsxLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAxXSxcclxuICAgIHRyYW5zZm9ybWF0aW9uID0gbmV3IFR3by5BcnJheSg5KSxcclxuICAgIGdldFJhdGlvID0gVHdvLlV0aWxzLmdldFJhdGlvLFxyXG4gICAgZ2V0Q29tcHV0ZWRNYXRyaXggPSBUd28uVXRpbHMuZ2V0Q29tcHV0ZWRNYXRyaXgsXHJcbiAgICB0b0ZpeGVkID0gVHdvLlV0aWxzLnRvRml4ZWQsXHJcbiAgICBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgd2ViZ2wgPSB7XHJcblxyXG4gICAgaXNIaWRkZW46IC8obm9uZXx0cmFuc3BhcmVudCkvaSxcclxuXHJcbiAgICBjYW52YXM6IChyb290LmRvY3VtZW50ID8gcm9vdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSA6IHsgZ2V0Q29udGV4dDogXy5pZGVudGl0eSB9KSxcclxuXHJcbiAgICBhbGlnbm1lbnRzOiB7XHJcbiAgICAgIGxlZnQ6ICdzdGFydCcsXHJcbiAgICAgIG1pZGRsZTogJ2NlbnRlcicsXHJcbiAgICAgIHJpZ2h0OiAnZW5kJ1xyXG4gICAgfSxcclxuXHJcbiAgICBtYXRyaXg6IG5ldyBUd28uTWF0cml4KCksXHJcblxyXG4gICAgdXY6IG5ldyBUd28uQXJyYXkoW1xyXG4gICAgICAwLCAwLFxyXG4gICAgICAxLCAwLFxyXG4gICAgICAwLCAxLFxyXG4gICAgICAwLCAxLFxyXG4gICAgICAxLCAwLFxyXG4gICAgICAxLCAxXHJcbiAgICBdKSxcclxuXHJcbiAgICBncm91cDoge1xyXG5cclxuICAgICAgcmVtb3ZlQ2hpbGQ6IGZ1bmN0aW9uKGNoaWxkLCBnbCkge1xyXG4gICAgICAgIGlmIChjaGlsZC5jaGlsZHJlbikge1xyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB3ZWJnbC5ncm91cC5yZW1vdmVDaGlsZChjaGlsZC5jaGlsZHJlbltpXSwgZ2wpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBEZWFsbG9jYXRlIHRleHR1cmUgdG8gZnJlZSB1cCBnbCBtZW1vcnkuXHJcbiAgICAgICAgZ2wuZGVsZXRlVGV4dHVyZShjaGlsZC5fcmVuZGVyZXIudGV4dHVyZSk7XHJcbiAgICAgICAgZGVsZXRlIGNoaWxkLl9yZW5kZXJlci50ZXh0dXJlO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVuZGVyQ2hpbGQ6IGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgd2ViZ2xbY2hpbGQuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGNoaWxkLCB0aGlzLmdsLCB0aGlzLnByb2dyYW0pO1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihnbCwgcHJvZ3JhbSkge1xyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50O1xyXG4gICAgICAgIHZhciBmbGFnUGFyZW50TWF0cml4ID0gKHBhcmVudC5fbWF0cml4ICYmIHBhcmVudC5fbWF0cml4Lm1hbnVhbCkgfHwgcGFyZW50Ll9mbGFnTWF0cml4O1xyXG4gICAgICAgIHZhciBmbGFnTWF0cml4ID0gdGhpcy5fbWF0cml4Lm1hbnVhbCB8fCB0aGlzLl9mbGFnTWF0cml4O1xyXG5cclxuICAgICAgICBpZiAoZmxhZ1BhcmVudE1hdHJpeCB8fCBmbGFnTWF0cml4KSB7XHJcblxyXG4gICAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5tYXRyaXgpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIubWF0cml4ID0gbmV3IFR3by5BcnJheSg5KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZWR1Y2UgYW1vdW50IG9mIG9iamVjdCAvIGFycmF5IGNyZWF0aW9uIC8gZGVsZXRpb25cclxuICAgICAgICAgIHRoaXMuX21hdHJpeC50b0FycmF5KHRydWUsIHRyYW5zZm9ybWF0aW9uKTtcclxuXHJcbiAgICAgICAgICBtdWx0aXBseU1hdHJpeCh0cmFuc2Zvcm1hdGlvbiwgcGFyZW50Ll9yZW5kZXJlci5tYXRyaXgsIHRoaXMuX3JlbmRlcmVyLm1hdHJpeCk7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5zY2FsZSA9IHRoaXMuX3NjYWxlICogcGFyZW50Ll9yZW5kZXJlci5zY2FsZTtcclxuXHJcbiAgICAgICAgICBpZiAoZmxhZ1BhcmVudE1hdHJpeCkge1xyXG4gICAgICAgICAgICB0aGlzLl9mbGFnTWF0cml4ID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fbWFzaykge1xyXG5cclxuICAgICAgICAgIGdsLmVuYWJsZShnbC5TVEVOQ0lMX1RFU1QpO1xyXG4gICAgICAgICAgZ2wuc3RlbmNpbEZ1bmMoZ2wuQUxXQVlTLCAxLCAxKTtcclxuXHJcbiAgICAgICAgICBnbC5jb2xvck1hc2soZmFsc2UsIGZhbHNlLCBmYWxzZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBnbC5zdGVuY2lsT3AoZ2wuS0VFUCwgZ2wuS0VFUCwgZ2wuSU5DUik7XHJcblxyXG4gICAgICAgICAgd2ViZ2xbdGhpcy5fbWFzay5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwodGhpcy5fbWFzaywgZ2wsIHByb2dyYW0sIHRoaXMpO1xyXG5cclxuICAgICAgICAgIGdsLmNvbG9yTWFzayh0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGdsLnN0ZW5jaWxGdW5jKGdsLk5PVEVRVUFMLCAwLCAxKTtcclxuICAgICAgICAgIGdsLnN0ZW5jaWxPcChnbC5LRUVQLCBnbC5LRUVQLCBnbC5LRUVQKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9mbGFnT3BhY2l0eSA9IHBhcmVudC5fZmxhZ09wYWNpdHkgfHwgdGhpcy5fZmxhZ09wYWNpdHk7XHJcblxyXG4gICAgICAgIHRoaXMuX3JlbmRlcmVyLm9wYWNpdHkgPSB0aGlzLl9vcGFjaXR5XHJcbiAgICAgICAgICAqIChwYXJlbnQgJiYgcGFyZW50Ll9yZW5kZXJlciA/IHBhcmVudC5fcmVuZGVyZXIub3BhY2l0eSA6IDEpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1N1YnRyYWN0aW9ucykge1xyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YnRyYWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB3ZWJnbC5ncm91cC5yZW1vdmVDaGlsZCh0aGlzLnN1YnRyYWN0aW9uc1tpXSwgZ2wpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKHdlYmdsLmdyb3VwLnJlbmRlckNoaWxkLCB7XHJcbiAgICAgICAgICBnbDogZ2wsXHJcbiAgICAgICAgICBwcm9ncmFtOiBwcm9ncmFtXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9tYXNrKSB7XHJcblxyXG4gICAgICAgICAgZ2wuY29sb3JNYXNrKGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgIGdsLnN0ZW5jaWxPcChnbC5LRUVQLCBnbC5LRUVQLCBnbC5ERUNSKTtcclxuXHJcbiAgICAgICAgICB3ZWJnbFt0aGlzLl9tYXNrLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbCh0aGlzLl9tYXNrLCBnbCwgcHJvZ3JhbSwgdGhpcyk7XHJcblxyXG4gICAgICAgICAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgZ2wuc3RlbmNpbEZ1bmMoZ2wuTk9URVFVQUwsIDAsIDEpO1xyXG4gICAgICAgICAgZ2wuc3RlbmNpbE9wKGdsLktFRVAsIGdsLktFRVAsIGdsLktFRVApO1xyXG5cclxuICAgICAgICAgIGdsLmRpc2FibGUoZ2wuU1RFTkNJTF9URVNUKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHBhdGg6IHtcclxuXHJcbiAgICAgIHVwZGF0ZUNhbnZhczogZnVuY3Rpb24oZWxlbSkge1xyXG5cclxuICAgICAgICB2YXIgbmV4dCwgcHJldiwgYSwgYywgdXgsIHV5LCB2eCwgdnksIGFyLCBibCwgYnIsIGNsLCB4LCB5O1xyXG4gICAgICAgIHZhciBpc09mZnNldDtcclxuXHJcbiAgICAgICAgdmFyIGNvbW1hbmRzID0gZWxlbS5fdmVydGljZXM7XHJcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMuY2FudmFzO1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmN0eDtcclxuXHJcbiAgICAgICAgLy8gU3R5bGVzXHJcbiAgICAgICAgdmFyIHNjYWxlID0gZWxlbS5fcmVuZGVyZXIuc2NhbGU7XHJcbiAgICAgICAgdmFyIHN0cm9rZSA9IGVsZW0uX3N0cm9rZTtcclxuICAgICAgICB2YXIgbGluZXdpZHRoID0gZWxlbS5fbGluZXdpZHRoO1xyXG4gICAgICAgIHZhciBmaWxsID0gZWxlbS5fZmlsbDtcclxuICAgICAgICB2YXIgb3BhY2l0eSA9IGVsZW0uX3JlbmRlcmVyLm9wYWNpdHkgfHwgZWxlbS5fb3BhY2l0eTtcclxuICAgICAgICB2YXIgY2FwID0gZWxlbS5fY2FwO1xyXG4gICAgICAgIHZhciBqb2luID0gZWxlbS5fam9pbjtcclxuICAgICAgICB2YXIgbWl0ZXIgPSBlbGVtLl9taXRlcjtcclxuICAgICAgICB2YXIgY2xvc2VkID0gZWxlbS5fY2xvc2VkO1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBjb21tYW5kcy5sZW5ndGg7XHJcbiAgICAgICAgdmFyIGxhc3QgPSBsZW5ndGggLSAxO1xyXG5cclxuICAgICAgICBjYW52YXMud2lkdGggPSBNYXRoLm1heChNYXRoLmNlaWwoZWxlbS5fcmVuZGVyZXIucmVjdC53aWR0aCAqIHNjYWxlKSwgMSk7XHJcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IE1hdGgubWF4KE1hdGguY2VpbChlbGVtLl9yZW5kZXJlci5yZWN0LmhlaWdodCAqIHNjYWxlKSwgMSk7XHJcblxyXG4gICAgICAgIHZhciBjZW50cm9pZCA9IGVsZW0uX3JlbmRlcmVyLnJlY3QuY2VudHJvaWQ7XHJcbiAgICAgICAgdmFyIGN4ID0gY2VudHJvaWQueDtcclxuICAgICAgICB2YXIgY3kgPSBjZW50cm9pZC55O1xyXG5cclxuICAgICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcblxyXG4gICAgICAgIGlmIChmaWxsKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyhmaWxsKSkge1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gZmlsbDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdlYmdsW2ZpbGwuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKGZpbGwsIGN0eCwgZWxlbSk7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsLl9yZW5kZXJlci5lZmZlY3Q7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzdHJva2UpIHtcclxuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKHN0cm9rZSkpIHtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2ViZ2xbc3Ryb2tlLl9yZW5kZXJlci50eXBlXS5yZW5kZXIuY2FsbChzdHJva2UsIGN0eCwgZWxlbSk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0cm9rZS5fcmVuZGVyZXIuZWZmZWN0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGluZXdpZHRoKSB7XHJcbiAgICAgICAgICBjdHgubGluZVdpZHRoID0gbGluZXdpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobWl0ZXIpIHtcclxuICAgICAgICAgIGN0eC5taXRlckxpbWl0ID0gbWl0ZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChqb2luKSB7XHJcbiAgICAgICAgICBjdHgubGluZUpvaW4gPSBqb2luO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY2FwKSB7XHJcbiAgICAgICAgICBjdHgubGluZUNhcCA9IGNhcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKF8uaXNOdW1iZXIob3BhY2l0eSkpIHtcclxuICAgICAgICAgIGN0eC5nbG9iYWxBbHBoYSA9IG9wYWNpdHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZDtcclxuICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgIGN0eC5zY2FsZShzY2FsZSwgc2NhbGUpO1xyXG4gICAgICAgIGN0eC50cmFuc2xhdGUoY3gsIGN5KTtcclxuXHJcbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29tbWFuZHMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICBiID0gY29tbWFuZHNbaV07XHJcblxyXG4gICAgICAgICAgeCA9IHRvRml4ZWQoYi5feCk7XHJcbiAgICAgICAgICB5ID0gdG9GaXhlZChiLl95KTtcclxuXHJcbiAgICAgICAgICBzd2l0Y2ggKGIuX2NvbW1hbmQpIHtcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLmNsb3NlOlxyXG4gICAgICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVHdvLkNvbW1hbmRzLmN1cnZlOlxyXG5cclxuICAgICAgICAgICAgICBwcmV2ID0gY2xvc2VkID8gbW9kKGkgLSAxLCBsZW5ndGgpIDogTWF0aC5tYXgoaSAtIDEsIDApO1xyXG4gICAgICAgICAgICAgIG5leHQgPSBjbG9zZWQgPyBtb2QoaSArIDEsIGxlbmd0aCkgOiBNYXRoLm1pbihpICsgMSwgbGFzdCk7XHJcblxyXG4gICAgICAgICAgICAgIGEgPSBjb21tYW5kc1twcmV2XTtcclxuICAgICAgICAgICAgICBjID0gY29tbWFuZHNbbmV4dF07XHJcbiAgICAgICAgICAgICAgYXIgPSAoYS5jb250cm9scyAmJiBhLmNvbnRyb2xzLnJpZ2h0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcbiAgICAgICAgICAgICAgYmwgPSAoYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLmxlZnQpIHx8IFR3by5WZWN0b3IuemVybztcclxuXHJcbiAgICAgICAgICAgICAgaWYgKGEuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoKGFyLnggKyBhLl94KSk7XHJcbiAgICAgICAgICAgICAgICB2eSA9IHRvRml4ZWQoKGFyLnkgKyBhLl95KSk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZChhci54KTtcclxuICAgICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZChhci55KTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmIChiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgdXggPSB0b0ZpeGVkKChibC54ICsgYi5feCkpO1xyXG4gICAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKChibC55ICsgYi5feSkpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoYmwueCk7XHJcbiAgICAgICAgICAgICAgICB1eSA9IHRvRml4ZWQoYmwueSk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBjdHguYmV6aWVyQ3VydmVUbyh2eCwgdnksIHV4LCB1eSwgeCwgeSk7XHJcblxyXG4gICAgICAgICAgICAgIGlmIChpID49IGxhc3QgJiYgY2xvc2VkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgYyA9IGQ7XHJcblxyXG4gICAgICAgICAgICAgICAgYnIgPSAoYi5jb250cm9scyAmJiBiLmNvbnRyb2xzLnJpZ2h0KSB8fCBUd28uVmVjdG9yLnplcm87XHJcbiAgICAgICAgICAgICAgICBjbCA9IChjLmNvbnRyb2xzICYmIGMuY29udHJvbHMubGVmdCkgfHwgVHdvLlZlY3Rvci56ZXJvO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICB2eCA9IHRvRml4ZWQoKGJyLnggKyBiLl94KSk7XHJcbiAgICAgICAgICAgICAgICAgIHZ5ID0gdG9GaXhlZCgoYnIueSArIGIuX3kpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHZ4ID0gdG9GaXhlZChici54KTtcclxuICAgICAgICAgICAgICAgICAgdnkgPSB0b0ZpeGVkKGJyLnkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICB1eCA9IHRvRml4ZWQoKGNsLnggKyBjLl94KSk7XHJcbiAgICAgICAgICAgICAgICAgIHV5ID0gdG9GaXhlZCgoY2wueSArIGMuX3kpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHV4ID0gdG9GaXhlZChjbC54KTtcclxuICAgICAgICAgICAgICAgICAgdXkgPSB0b0ZpeGVkKGNsLnkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHggPSB0b0ZpeGVkKGMuX3gpO1xyXG4gICAgICAgICAgICAgICAgeSA9IHRvRml4ZWQoYy5feSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY3R4LmJlemllckN1cnZlVG8odngsIHZ5LCB1eCwgdXksIHgsIHkpO1xyXG5cclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMubGluZTpcclxuICAgICAgICAgICAgICBjdHgubGluZVRvKHgsIHkpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUd28uQ29tbWFuZHMubW92ZTpcclxuICAgICAgICAgICAgICBkID0gYjtcclxuICAgICAgICAgICAgICBjdHgubW92ZVRvKHgsIHkpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBMb29zZSBlbmRzXHJcblxyXG4gICAgICAgIGlmIChjbG9zZWQpIHtcclxuICAgICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghd2ViZ2wuaXNIaWRkZW4udGVzdChmaWxsKSkge1xyXG4gICAgICAgICAgaXNPZmZzZXQgPSBmaWxsLl9yZW5kZXJlciAmJiBmaWxsLl9yZW5kZXJlci5vZmZzZXRcclxuICAgICAgICAgIGlmIChpc09mZnNldCkge1xyXG4gICAgICAgICAgICBjdHguc2F2ZSgpO1xyXG4gICAgICAgICAgICBjdHgudHJhbnNsYXRlKFxyXG4gICAgICAgICAgICAgIC0gZmlsbC5fcmVuZGVyZXIub2Zmc2V0LngsIC0gZmlsbC5fcmVuZGVyZXIub2Zmc2V0LnkpO1xyXG4gICAgICAgICAgICBjdHguc2NhbGUoZmlsbC5fcmVuZGVyZXIuc2NhbGUueCwgZmlsbC5fcmVuZGVyZXIuc2NhbGUueSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjdHguZmlsbCgpO1xyXG4gICAgICAgICAgaWYgKGlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXdlYmdsLmlzSGlkZGVuLnRlc3Qoc3Ryb2tlKSkge1xyXG4gICAgICAgICAgaXNPZmZzZXQgPSBzdHJva2UuX3JlbmRlcmVyICYmIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0O1xyXG4gICAgICAgICAgaWYgKGlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoXHJcbiAgICAgICAgICAgICAgLSBzdHJva2UuX3JlbmRlcmVyLm9mZnNldC54LCAtIHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LnkpO1xyXG4gICAgICAgICAgICBjdHguc2NhbGUoc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54LCBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnkpO1xyXG4gICAgICAgICAgICBjdHgubGluZVdpZHRoID0gbGluZXdpZHRoIC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgICAgaWYgKGlzT2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBSZXR1cm5zIHRoZSByZWN0IG9mIGEgc2V0IG9mIHZlcnRzLiBUeXBpY2FsbHkgdGFrZXMgdmVydGljZXMgdGhhdCBhcmVcclxuICAgICAgICogXCJjZW50ZXJlZFwiIGFyb3VuZCAwIGFuZCByZXR1cm5zIHRoZW0gdG8gYmUgYW5jaG9yZWQgdXBwZXItbGVmdC5cclxuICAgICAgICovXHJcbiAgICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogZnVuY3Rpb24odmVydGljZXMsIGJvcmRlciwgcmVjdCkge1xyXG5cclxuICAgICAgICB2YXIgbGVmdCA9IEluZmluaXR5LCByaWdodCA9IC1JbmZpbml0eSxcclxuICAgICAgICAgICAgdG9wID0gSW5maW5pdHksIGJvdHRvbSA9IC1JbmZpbml0eSxcclxuICAgICAgICAgICAgd2lkdGgsIGhlaWdodDtcclxuXHJcbiAgICAgICAgdmVydGljZXMuZm9yRWFjaChmdW5jdGlvbih2KSB7XHJcblxyXG4gICAgICAgICAgdmFyIHggPSB2LngsIHkgPSB2LnksIGNvbnRyb2xzID0gdi5jb250cm9scztcclxuICAgICAgICAgIHZhciBhLCBiLCBjLCBkLCBjbCwgY3I7XHJcblxyXG4gICAgICAgICAgdG9wID0gTWF0aC5taW4oeSwgdG9wKTtcclxuICAgICAgICAgIGxlZnQgPSBNYXRoLm1pbih4LCBsZWZ0KTtcclxuICAgICAgICAgIHJpZ2h0ID0gTWF0aC5tYXgoeCwgcmlnaHQpO1xyXG4gICAgICAgICAgYm90dG9tID0gTWF0aC5tYXgoeSwgYm90dG9tKTtcclxuXHJcbiAgICAgICAgICBpZiAoIXYuY29udHJvbHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNsID0gY29udHJvbHMubGVmdDtcclxuICAgICAgICAgIGNyID0gY29udHJvbHMucmlnaHQ7XHJcblxyXG4gICAgICAgICAgaWYgKCFjbCB8fCAhY3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGEgPSB2Ll9yZWxhdGl2ZSA/IGNsLnggKyB4IDogY2wueDtcclxuICAgICAgICAgIGIgPSB2Ll9yZWxhdGl2ZSA/IGNsLnkgKyB5IDogY2wueTtcclxuICAgICAgICAgIGMgPSB2Ll9yZWxhdGl2ZSA/IGNyLnggKyB4IDogY3IueDtcclxuICAgICAgICAgIGQgPSB2Ll9yZWxhdGl2ZSA/IGNyLnkgKyB5IDogY3IueTtcclxuXHJcbiAgICAgICAgICBpZiAoIWEgfHwgIWIgfHwgIWMgfHwgIWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRvcCA9IE1hdGgubWluKGIsIGQsIHRvcCk7XHJcbiAgICAgICAgICBsZWZ0ID0gTWF0aC5taW4oYSwgYywgbGVmdCk7XHJcbiAgICAgICAgICByaWdodCA9IE1hdGgubWF4KGEsIGMsIHJpZ2h0KTtcclxuICAgICAgICAgIGJvdHRvbSA9IE1hdGgubWF4KGIsIGQsIGJvdHRvbSk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBFeHBhbmQgYm9yZGVyc1xyXG5cclxuICAgICAgICBpZiAoXy5pc051bWJlcihib3JkZXIpKSB7XHJcbiAgICAgICAgICB0b3AgLT0gYm9yZGVyO1xyXG4gICAgICAgICAgbGVmdCAtPSBib3JkZXI7XHJcbiAgICAgICAgICByaWdodCArPSBib3JkZXI7XHJcbiAgICAgICAgICBib3R0b20gKz0gYm9yZGVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2lkdGggPSByaWdodCAtIGxlZnQ7XHJcbiAgICAgICAgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xyXG5cclxuICAgICAgICByZWN0LnRvcCA9IHRvcDtcclxuICAgICAgICByZWN0LmxlZnQgPSBsZWZ0O1xyXG4gICAgICAgIHJlY3QucmlnaHQgPSByaWdodDtcclxuICAgICAgICByZWN0LmJvdHRvbSA9IGJvdHRvbTtcclxuICAgICAgICByZWN0LndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgcmVjdC5oZWlnaHQgPSBoZWlnaHQ7XHJcblxyXG4gICAgICAgIGlmICghcmVjdC5jZW50cm9pZCkge1xyXG4gICAgICAgICAgcmVjdC5jZW50cm9pZCA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVjdC5jZW50cm9pZC54ID0gLSBsZWZ0O1xyXG4gICAgICAgIHJlY3QuY2VudHJvaWQueSA9IC0gdG9wO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZ2wsIHByb2dyYW0sIGZvcmNlZFBhcmVudCkge1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3Zpc2libGUgfHwgIXRoaXMuX29wYWNpdHkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIC8vIENhbGN1bGF0ZSB3aGF0IGNoYW5nZWRcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50O1xyXG4gICAgICAgIHZhciBmbGFnUGFyZW50TWF0cml4ID0gcGFyZW50Ll9tYXRyaXgubWFudWFsIHx8IHBhcmVudC5fZmxhZ01hdHJpeDtcclxuICAgICAgICB2YXIgZmxhZ01hdHJpeCA9IHRoaXMuX21hdHJpeC5tYW51YWwgfHwgdGhpcy5fZmxhZ01hdHJpeDtcclxuICAgICAgICB2YXIgZmxhZ1RleHR1cmUgPSB0aGlzLl9mbGFnVmVydGljZXMgfHwgdGhpcy5fZmxhZ0ZpbGxcclxuICAgICAgICAgIHx8ICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50ICYmICh0aGlzLl9maWxsLl9mbGFnU3ByZWFkIHx8IHRoaXMuX2ZpbGwuX2ZsYWdTdG9wcyB8fCB0aGlzLl9maWxsLl9mbGFnRW5kUG9pbnRzKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50ICYmICh0aGlzLl9maWxsLl9mbGFnU3ByZWFkIHx8IHRoaXMuX2ZpbGwuX2ZsYWdTdG9wcyB8fCB0aGlzLl9maWxsLl9mbGFnUmFkaXVzIHx8IHRoaXMuX2ZpbGwuX2ZsYWdDZW50ZXIgfHwgdGhpcy5fZmlsbC5fZmxhZ0ZvY2FsKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlRleHR1cmUgJiYgKHRoaXMuX2ZpbGwuX2ZsYWdMb2FkZWQgJiYgdGhpcy5fZmlsbC5sb2FkZWQgfHwgdGhpcy5fZmlsbC5fZmxhZ09mZnNldCB8fCB0aGlzLl9maWxsLl9mbGFnU2NhbGUpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudCAmJiAodGhpcy5fc3Ryb2tlLl9mbGFnU3ByZWFkIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ1N0b3BzIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ0VuZFBvaW50cykpXHJcbiAgICAgICAgICB8fCAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50ICYmICh0aGlzLl9zdHJva2UuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnU3RvcHMgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnUmFkaXVzIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ0NlbnRlciB8fCB0aGlzLl9zdHJva2UuX2ZsYWdGb2NhbCkpXHJcbiAgICAgICAgICB8fCAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlRleHR1cmUgJiYgKHRoaXMuX3N0cm9rZS5fZmxhZ0xvYWRlZCAmJiB0aGlzLl9zdHJva2UubG9hZGVkIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ09mZnNldCB8fCB0aGlzLl9maWxsLl9mbGFnU2NhbGUpKVxyXG4gICAgICAgICAgfHwgdGhpcy5fZmxhZ1N0cm9rZSB8fCB0aGlzLl9mbGFnTGluZXdpZHRoIHx8IHRoaXMuX2ZsYWdPcGFjaXR5XHJcbiAgICAgICAgICB8fCBwYXJlbnQuX2ZsYWdPcGFjaXR5IHx8IHRoaXMuX2ZsYWdWaXNpYmxlIHx8IHRoaXMuX2ZsYWdDYXBcclxuICAgICAgICAgIHx8IHRoaXMuX2ZsYWdKb2luIHx8IHRoaXMuX2ZsYWdNaXRlciB8fCB0aGlzLl9mbGFnU2NhbGVcclxuICAgICAgICAgIHx8ICF0aGlzLl9yZW5kZXJlci50ZXh0dXJlO1xyXG5cclxuICAgICAgICBpZiAoZmxhZ1BhcmVudE1hdHJpeCB8fCBmbGFnTWF0cml4KSB7XHJcblxyXG4gICAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5tYXRyaXgpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIubWF0cml4ID0gbmV3IFR3by5BcnJheSg5KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZWR1Y2UgYW1vdW50IG9mIG9iamVjdCAvIGFycmF5IGNyZWF0aW9uIC8gZGVsZXRpb25cclxuXHJcbiAgICAgICAgICB0aGlzLl9tYXRyaXgudG9BcnJheSh0cnVlLCB0cmFuc2Zvcm1hdGlvbik7XHJcblxyXG4gICAgICAgICAgbXVsdGlwbHlNYXRyaXgodHJhbnNmb3JtYXRpb24sIHBhcmVudC5fcmVuZGVyZXIubWF0cml4LCB0aGlzLl9yZW5kZXJlci5tYXRyaXgpO1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUgPSB0aGlzLl9zY2FsZSAqIHBhcmVudC5fcmVuZGVyZXIuc2NhbGU7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGZsYWdUZXh0dXJlKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5yZWN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnJlY3QgPSB7fTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLnRyaWFuZ2xlcykge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci50cmlhbmdsZXMgPSBuZXcgVHdvLkFycmF5KDEyKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vcGFjaXR5ID0gdGhpcy5fb3BhY2l0eSAqIHBhcmVudC5fcmVuZGVyZXIub3BhY2l0eTtcclxuXHJcbiAgICAgICAgICB3ZWJnbC5wYXRoLmdldEJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLl92ZXJ0aWNlcywgdGhpcy5fbGluZXdpZHRoLCB0aGlzLl9yZW5kZXJlci5yZWN0KTtcclxuICAgICAgICAgIHdlYmdsLmdldFRyaWFuZ2xlcyh0aGlzLl9yZW5kZXJlci5yZWN0LCB0aGlzLl9yZW5kZXJlci50cmlhbmdsZXMpO1xyXG5cclxuICAgICAgICAgIHdlYmdsLnVwZGF0ZUJ1ZmZlci5jYWxsKHdlYmdsLCBnbCwgdGhpcywgcHJvZ3JhbSk7XHJcbiAgICAgICAgICB3ZWJnbC51cGRhdGVUZXh0dXJlLmNhbGwod2ViZ2wsIGdsLCB0aGlzKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiAodGhpcy5fbWFzaykge1xyXG4gICAgICAgIC8vICAgd2ViZ2xbdGhpcy5fbWFzay5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwobWFzaywgZ2wsIHByb2dyYW0sIHRoaXMpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2NsaXAgJiYgIWZvcmNlZFBhcmVudCkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRHJhdyBUZXh0dXJlXHJcblxyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLl9yZW5kZXJlci50ZXh0dXJlQ29vcmRzQnVmZmVyKTtcclxuXHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihwcm9ncmFtLnRleHR1cmVDb29yZHMsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuX3JlbmRlcmVyLnRleHR1cmUpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gRHJhdyBSZWN0XHJcblxyXG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXgzZnYocHJvZ3JhbS5tYXRyaXgsIGZhbHNlLCB0aGlzLl9yZW5kZXJlci5tYXRyaXgpO1xyXG5cclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5fcmVuZGVyZXIuYnVmZmVyKTtcclxuXHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihwcm9ncmFtLnBvc2l0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuICAgICAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgNik7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdGV4dDoge1xyXG5cclxuICAgICAgdXBkYXRlQ2FudmFzOiBmdW5jdGlvbihlbGVtKSB7XHJcblxyXG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLmNhbnZhcztcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5jdHg7XHJcblxyXG4gICAgICAgIC8vIFN0eWxlc1xyXG4gICAgICAgIHZhciBzY2FsZSA9IGVsZW0uX3JlbmRlcmVyLnNjYWxlO1xyXG4gICAgICAgIHZhciBzdHJva2UgPSBlbGVtLl9zdHJva2U7XHJcbiAgICAgICAgdmFyIGxpbmV3aWR0aCA9IGVsZW0uX2xpbmV3aWR0aCAqIHNjYWxlO1xyXG4gICAgICAgIHZhciBmaWxsID0gZWxlbS5fZmlsbDtcclxuICAgICAgICB2YXIgb3BhY2l0eSA9IGVsZW0uX3JlbmRlcmVyLm9wYWNpdHkgfHwgZWxlbS5fb3BhY2l0eTtcclxuXHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gTWF0aC5tYXgoTWF0aC5jZWlsKGVsZW0uX3JlbmRlcmVyLnJlY3Qud2lkdGggKiBzY2FsZSksIDEpO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBNYXRoLm1heChNYXRoLmNlaWwoZWxlbS5fcmVuZGVyZXIucmVjdC5oZWlnaHQgKiBzY2FsZSksIDEpO1xyXG5cclxuICAgICAgICB2YXIgY2VudHJvaWQgPSBlbGVtLl9yZW5kZXJlci5yZWN0LmNlbnRyb2lkO1xyXG4gICAgICAgIHZhciBjeCA9IGNlbnRyb2lkLng7XHJcbiAgICAgICAgdmFyIGN5ID0gY2VudHJvaWQueTtcclxuXHJcbiAgICAgICAgdmFyIGEsIGIsIGMsIGQsIGUsIHN4LCBzeTtcclxuICAgICAgICB2YXIgaXNPZmZzZXQgPSBmaWxsLl9yZW5kZXJlciAmJiBmaWxsLl9yZW5kZXJlci5vZmZzZXRcclxuICAgICAgICAgICYmIHN0cm9rZS5fcmVuZGVyZXIgJiYgc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQ7XHJcblxyXG4gICAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgaWYgKCFpc09mZnNldCkge1xyXG4gICAgICAgICAgY3R4LmZvbnQgPSBbZWxlbS5fc3R5bGUsIGVsZW0uX3dlaWdodCwgZWxlbS5fc2l6ZSArICdweC8nICtcclxuICAgICAgICAgICAgZWxlbS5fbGVhZGluZyArICdweCcsIGVsZW0uX2ZhbWlseV0uam9pbignICcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnRleHRBbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuXHJcbiAgICAgICAgLy8gU3R5bGVzXHJcbiAgICAgICAgaWYgKGZpbGwpIHtcclxuICAgICAgICAgIGlmIChfLmlzU3RyaW5nKGZpbGwpKSB7XHJcbiAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2ViZ2xbZmlsbC5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwoZmlsbCwgY3R4LCBlbGVtKTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGZpbGwuX3JlbmRlcmVyLmVmZmVjdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHN0cm9rZSkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoc3Ryb2tlKSkge1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHJva2U7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3ZWJnbFtzdHJva2UuX3JlbmRlcmVyLnR5cGVdLnJlbmRlci5jYWxsKHN0cm9rZSwgY3R4LCBlbGVtKTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gc3Ryb2tlLl9yZW5kZXJlci5lZmZlY3Q7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsaW5ld2lkdGgpIHtcclxuICAgICAgICAgIGN0eC5saW5lV2lkdGggPSBsaW5ld2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmlzTnVtYmVyKG9wYWNpdHkpKSB7XHJcbiAgICAgICAgICBjdHguZ2xvYmFsQWxwaGEgPSBvcGFjaXR5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICBjdHguc2NhbGUoc2NhbGUsIHNjYWxlKTtcclxuICAgICAgICBjdHgudHJhbnNsYXRlKGN4LCBjeSk7XHJcblxyXG4gICAgICAgIGlmICghd2ViZ2wuaXNIaWRkZW4udGVzdChmaWxsKSkge1xyXG5cclxuICAgICAgICAgIGlmIChmaWxsLl9yZW5kZXJlciAmJiBmaWxsLl9yZW5kZXJlci5vZmZzZXQpIHtcclxuXHJcbiAgICAgICAgICAgIHN4ID0gdG9GaXhlZChmaWxsLl9yZW5kZXJlci5zY2FsZS54KTtcclxuICAgICAgICAgICAgc3kgPSB0b0ZpeGVkKGZpbGwuX3JlbmRlcmVyLnNjYWxlLnkpO1xyXG5cclxuICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgY3R4LnRyYW5zbGF0ZSggLSB0b0ZpeGVkKGZpbGwuX3JlbmRlcmVyLm9mZnNldC54KSxcclxuICAgICAgICAgICAgICAtIHRvRml4ZWQoZmlsbC5fcmVuZGVyZXIub2Zmc2V0LnkpKTtcclxuICAgICAgICAgICAgY3R4LnNjYWxlKHN4LCBzeSk7XHJcblxyXG4gICAgICAgICAgICBhID0gZWxlbS5fc2l6ZSAvIGZpbGwuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgIGIgPSBlbGVtLl9sZWFkaW5nIC8gZmlsbC5fcmVuZGVyZXIuc2NhbGUueTtcclxuICAgICAgICAgICAgY3R4LmZvbnQgPSBbZWxlbS5fc3R5bGUsIGVsZW0uX3dlaWdodCwgdG9GaXhlZChhKSArICdweC8nLFxyXG4gICAgICAgICAgICAgIHRvRml4ZWQoYikgKyAncHgnLCBlbGVtLl9mYW1pbHldLmpvaW4oJyAnKTtcclxuXHJcbiAgICAgICAgICAgIGMgPSBmaWxsLl9yZW5kZXJlci5vZmZzZXQueCAvIGZpbGwuX3JlbmRlcmVyLnNjYWxlLng7XHJcbiAgICAgICAgICAgIGQgPSBmaWxsLl9yZW5kZXJlci5vZmZzZXQueSAvIGZpbGwuX3JlbmRlcmVyLnNjYWxlLnk7XHJcblxyXG4gICAgICAgICAgICBjdHguZmlsbFRleHQoZWxlbS52YWx1ZSwgdG9GaXhlZChjKSwgdG9GaXhlZChkKSk7XHJcbiAgICAgICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3R4LmZpbGxUZXh0KGVsZW0udmFsdWUsIDAsIDApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghd2ViZ2wuaXNIaWRkZW4udGVzdChzdHJva2UpKSB7XHJcblxyXG4gICAgICAgICAgaWYgKHN0cm9rZS5fcmVuZGVyZXIgJiYgc3Ryb2tlLl9yZW5kZXJlci5vZmZzZXQpIHtcclxuXHJcbiAgICAgICAgICAgIHN4ID0gdG9GaXhlZChzdHJva2UuX3JlbmRlcmVyLnNjYWxlLngpO1xyXG4gICAgICAgICAgICBzeSA9IHRvRml4ZWQoc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55KTtcclxuXHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGN0eC50cmFuc2xhdGUoLSB0b0ZpeGVkKHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LngpLFxyXG4gICAgICAgICAgICAgIC0gdG9GaXhlZChzdHJva2UuX3JlbmRlcmVyLm9mZnNldC55KSk7XHJcbiAgICAgICAgICAgIGN0eC5zY2FsZShzeCwgc3kpO1xyXG5cclxuICAgICAgICAgICAgYSA9IGVsZW0uX3NpemUgLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLnk7XHJcbiAgICAgICAgICAgIGIgPSBlbGVtLl9sZWFkaW5nIC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICBjdHguZm9udCA9IFtlbGVtLl9zdHlsZSwgZWxlbS5fd2VpZ2h0LCB0b0ZpeGVkKGEpICsgJ3B4LycsXHJcbiAgICAgICAgICAgICAgdG9GaXhlZChiKSArICdweCcsIGVsZW0uX2ZhbWlseV0uam9pbignICcpO1xyXG5cclxuICAgICAgICAgICAgYyA9IHN0cm9rZS5fcmVuZGVyZXIub2Zmc2V0LnggLyBzdHJva2UuX3JlbmRlcmVyLnNjYWxlLng7XHJcbiAgICAgICAgICAgIGQgPSBzdHJva2UuX3JlbmRlcmVyLm9mZnNldC55IC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS55O1xyXG4gICAgICAgICAgICBlID0gbGluZXdpZHRoIC8gc3Ryb2tlLl9yZW5kZXJlci5zY2FsZS54O1xyXG5cclxuICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRvRml4ZWQoZSk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VUZXh0KGVsZW0udmFsdWUsIHRvRml4ZWQoYyksIHRvRml4ZWQoZCkpO1xyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG5cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VUZXh0KGVsZW0udmFsdWUsIDAsIDApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN0eC5yZXN0b3JlKCk7XHJcblxyXG4gICAgICB9LFxyXG5cclxuICAgICAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiBmdW5jdGlvbihlbGVtLCByZWN0KSB7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB3ZWJnbC5jdHg7XHJcblxyXG4gICAgICAgIGN0eC5mb250ID0gW2VsZW0uX3N0eWxlLCBlbGVtLl93ZWlnaHQsIGVsZW0uX3NpemUgKyAncHgvJyArXHJcbiAgICAgICAgICBlbGVtLl9sZWFkaW5nICsgJ3B4JywgZWxlbS5fZmFtaWx5XS5qb2luKCcgJyk7XHJcblxyXG4gICAgICAgIGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcclxuICAgICAgICBjdHgudGV4dEJhc2VsaW5lID0gZWxlbS5fYmFzZWxpbmU7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEVzdGltYXRlIHRoaXMgYmV0dGVyXHJcbiAgICAgICAgdmFyIHdpZHRoID0gY3R4Lm1lYXN1cmVUZXh0KGVsZW0uX3ZhbHVlKS53aWR0aDtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gTWF0aC5tYXgoZWxlbS5fc2l6ZSB8fCBlbGVtLl9sZWFkaW5nKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2xpbmV3aWR0aCAmJiAhd2ViZ2wuaXNIaWRkZW4udGVzdCh0aGlzLl9zdHJva2UpKSB7XHJcbiAgICAgICAgICAvLyB3aWR0aCArPSB0aGlzLl9saW5ld2lkdGg7IC8vIFRPRE86IE5vdCBzdXJlIGlmIHRoZSBgbWVhc3VyZWAgY2FsY3MgdGhpcy5cclxuICAgICAgICAgIGhlaWdodCArPSB0aGlzLl9saW5ld2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdyA9IHdpZHRoIC8gMjtcclxuICAgICAgICB2YXIgaCA9IGhlaWdodCAvIDI7XHJcblxyXG4gICAgICAgIHN3aXRjaCAod2ViZ2wuYWxpZ25tZW50c1tlbGVtLl9hbGlnbm1lbnRdIHx8IGVsZW0uX2FsaWdubWVudCkge1xyXG5cclxuICAgICAgICAgIGNhc2Ugd2ViZ2wuYWxpZ25tZW50cy5sZWZ0OlxyXG4gICAgICAgICAgICByZWN0LmxlZnQgPSAwO1xyXG4gICAgICAgICAgICByZWN0LnJpZ2h0ID0gd2lkdGg7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSB3ZWJnbC5hbGlnbm1lbnRzLnJpZ2h0OlxyXG4gICAgICAgICAgICByZWN0LmxlZnQgPSAtIHdpZHRoO1xyXG4gICAgICAgICAgICByZWN0LnJpZ2h0ID0gMDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZWN0LmxlZnQgPSAtIHc7XHJcbiAgICAgICAgICAgIHJlY3QucmlnaHQgPSB3O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVE9ETzogR3JhZGllbnRzIGFyZW4ndCBpbmhlcml0ZWQuLi5cclxuICAgICAgICBzd2l0Y2ggKGVsZW0uX2Jhc2VsaW5lKSB7XHJcbiAgICAgICAgICBjYXNlICdib3R0b20nOlxyXG4gICAgICAgICAgICByZWN0LnRvcCA9IC0gaGVpZ2h0O1xyXG4gICAgICAgICAgICByZWN0LmJvdHRvbSA9IDA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgY2FzZSAndG9wJzpcclxuICAgICAgICAgICAgcmVjdC50b3AgPSAwO1xyXG4gICAgICAgICAgICByZWN0LmJvdHRvbSA9IGhlaWdodDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZWN0LnRvcCA9IC0gaDtcclxuICAgICAgICAgICAgcmVjdC5ib3R0b20gPSBoO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVjdC53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgIHJlY3QuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuICAgICAgICBpZiAoIXJlY3QuY2VudHJvaWQpIHtcclxuICAgICAgICAgIHJlY3QuY2VudHJvaWQgPSB7fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFRPRE86XHJcbiAgICAgICAgcmVjdC5jZW50cm9pZC54ID0gdztcclxuICAgICAgICByZWN0LmNlbnRyb2lkLnkgPSBoO1xyXG5cclxuICAgICAgfSxcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oZ2wsIHByb2dyYW0sIGZvcmNlZFBhcmVudCkge1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3Zpc2libGUgfHwgIXRoaXMuX29wYWNpdHkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gICAgICAgIC8vIENhbGN1bGF0ZSB3aGF0IGNoYW5nZWRcclxuXHJcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50O1xyXG4gICAgICAgIHZhciBmbGFnUGFyZW50TWF0cml4ID0gcGFyZW50Ll9tYXRyaXgubWFudWFsIHx8IHBhcmVudC5fZmxhZ01hdHJpeDtcclxuICAgICAgICB2YXIgZmxhZ01hdHJpeCA9IHRoaXMuX21hdHJpeC5tYW51YWwgfHwgdGhpcy5fZmxhZ01hdHJpeDtcclxuICAgICAgICB2YXIgZmxhZ1RleHR1cmUgPSB0aGlzLl9mbGFnVmVydGljZXMgfHwgdGhpcy5fZmxhZ0ZpbGxcclxuICAgICAgICAgIHx8ICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50ICYmICh0aGlzLl9maWxsLl9mbGFnU3ByZWFkIHx8IHRoaXMuX2ZpbGwuX2ZsYWdTdG9wcyB8fCB0aGlzLl9maWxsLl9mbGFnRW5kUG9pbnRzKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50ICYmICh0aGlzLl9maWxsLl9mbGFnU3ByZWFkIHx8IHRoaXMuX2ZpbGwuX2ZsYWdTdG9wcyB8fCB0aGlzLl9maWxsLl9mbGFnUmFkaXVzIHx8IHRoaXMuX2ZpbGwuX2ZsYWdDZW50ZXIgfHwgdGhpcy5fZmlsbC5fZmxhZ0ZvY2FsKSlcclxuICAgICAgICAgIHx8ICh0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlRleHR1cmUgJiYgKHRoaXMuX2ZpbGwuX2ZsYWdMb2FkZWQgJiYgdGhpcy5fZmlsbC5sb2FkZWQpKVxyXG4gICAgICAgICAgfHwgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudCAmJiAodGhpcy5fc3Ryb2tlLl9mbGFnU3ByZWFkIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ1N0b3BzIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ0VuZFBvaW50cykpXHJcbiAgICAgICAgICB8fCAodGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50ICYmICh0aGlzLl9zdHJva2UuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnU3RvcHMgfHwgdGhpcy5fc3Ryb2tlLl9mbGFnUmFkaXVzIHx8IHRoaXMuX3N0cm9rZS5fZmxhZ0NlbnRlciB8fCB0aGlzLl9zdHJva2UuX2ZsYWdGb2NhbCkpXHJcbiAgICAgICAgICB8fCAodGhpcy5fdGV4dHVyZSBpbnN0YW5jZW9mIFR3by5UZXh0dXJlICYmICh0aGlzLl90ZXh0dXJlLl9mbGFnTG9hZGVkICYmIHRoaXMuX3RleHR1cmUubG9hZGVkKSlcclxuICAgICAgICAgIHx8IHRoaXMuX2ZsYWdTdHJva2UgfHwgdGhpcy5fZmxhZ0xpbmV3aWR0aCB8fCB0aGlzLl9mbGFnT3BhY2l0eVxyXG4gICAgICAgICAgfHwgcGFyZW50Ll9mbGFnT3BhY2l0eSB8fCB0aGlzLl9mbGFnVmlzaWJsZSB8fCB0aGlzLl9mbGFnU2NhbGVcclxuICAgICAgICAgIHx8IHRoaXMuX2ZsYWdWYWx1ZSB8fCB0aGlzLl9mbGFnRmFtaWx5IHx8IHRoaXMuX2ZsYWdTaXplXHJcbiAgICAgICAgICB8fCB0aGlzLl9mbGFnTGVhZGluZyB8fCB0aGlzLl9mbGFnQWxpZ25tZW50IHx8IHRoaXMuX2ZsYWdCYXNlbGluZVxyXG4gICAgICAgICAgfHwgdGhpcy5fZmxhZ1N0eWxlIHx8IHRoaXMuX2ZsYWdXZWlnaHQgfHwgdGhpcy5fZmxhZ0RlY29yYXRpb25cclxuICAgICAgICAgIHx8ICF0aGlzLl9yZW5kZXJlci50ZXh0dXJlO1xyXG5cclxuICAgICAgICBpZiAoZmxhZ1BhcmVudE1hdHJpeCB8fCBmbGFnTWF0cml4KSB7XHJcblxyXG4gICAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5tYXRyaXgpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIubWF0cml4ID0gbmV3IFR3by5BcnJheSg5KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSZWR1Y2UgYW1vdW50IG9mIG9iamVjdCAvIGFycmF5IGNyZWF0aW9uIC8gZGVsZXRpb25cclxuXHJcbiAgICAgICAgICB0aGlzLl9tYXRyaXgudG9BcnJheSh0cnVlLCB0cmFuc2Zvcm1hdGlvbik7XHJcblxyXG4gICAgICAgICAgbXVsdGlwbHlNYXRyaXgodHJhbnNmb3JtYXRpb24sIHBhcmVudC5fcmVuZGVyZXIubWF0cml4LCB0aGlzLl9yZW5kZXJlci5tYXRyaXgpO1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUgPSB0aGlzLl9zY2FsZSAqIHBhcmVudC5fcmVuZGVyZXIuc2NhbGU7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGZsYWdUZXh0dXJlKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5yZWN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnJlY3QgPSB7fTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLnRyaWFuZ2xlcykge1xyXG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJlci50cmlhbmdsZXMgPSBuZXcgVHdvLkFycmF5KDEyKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vcGFjaXR5ID0gdGhpcy5fb3BhY2l0eSAqIHBhcmVudC5fcmVuZGVyZXIub3BhY2l0eTtcclxuXHJcbiAgICAgICAgICB3ZWJnbC50ZXh0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLCB0aGlzLl9yZW5kZXJlci5yZWN0KTtcclxuICAgICAgICAgIHdlYmdsLmdldFRyaWFuZ2xlcyh0aGlzLl9yZW5kZXJlci5yZWN0LCB0aGlzLl9yZW5kZXJlci50cmlhbmdsZXMpO1xyXG5cclxuICAgICAgICAgIHdlYmdsLnVwZGF0ZUJ1ZmZlci5jYWxsKHdlYmdsLCBnbCwgdGhpcywgcHJvZ3JhbSk7XHJcbiAgICAgICAgICB3ZWJnbC51cGRhdGVUZXh0dXJlLmNhbGwod2ViZ2wsIGdsLCB0aGlzKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiAodGhpcy5fbWFzaykge1xyXG4gICAgICAgIC8vICAgd2ViZ2xbdGhpcy5fbWFzay5fcmVuZGVyZXIudHlwZV0ucmVuZGVyLmNhbGwobWFzaywgZ2wsIHByb2dyYW0sIHRoaXMpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2NsaXAgJiYgIWZvcmNlZFBhcmVudCkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRHJhdyBUZXh0dXJlXHJcblxyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLl9yZW5kZXJlci50ZXh0dXJlQ29vcmRzQnVmZmVyKTtcclxuXHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihwcm9ncmFtLnRleHR1cmVDb29yZHMsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblxyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuX3JlbmRlcmVyLnRleHR1cmUpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gRHJhdyBSZWN0XHJcblxyXG4gICAgICAgIGdsLnVuaWZvcm1NYXRyaXgzZnYocHJvZ3JhbS5tYXRyaXgsIGZhbHNlLCB0aGlzLl9yZW5kZXJlci5tYXRyaXgpO1xyXG5cclxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5fcmVuZGVyZXIuYnVmZmVyKTtcclxuXHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihwcm9ncmFtLnBvc2l0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG5cclxuICAgICAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgNik7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLmZsYWdSZXNldCgpO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgJ2xpbmVhci1ncmFkaWVudCc6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4LCBlbGVtKSB7XHJcblxyXG4gICAgICAgIGlmICghY3R4LmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9yZW5kZXJlci5lZmZlY3QgfHwgdGhpcy5fZmxhZ0VuZFBvaW50cyB8fCB0aGlzLl9mbGFnU3RvcHMpIHtcclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoXHJcbiAgICAgICAgICAgIHRoaXMubGVmdC5feCwgdGhpcy5sZWZ0Ll95LFxyXG4gICAgICAgICAgICB0aGlzLnJpZ2h0Ll94LCB0aGlzLnJpZ2h0Ll95XHJcbiAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdG9wcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgc3RvcCA9IHRoaXMuc3RvcHNbaV07XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdC5hZGRDb2xvclN0b3Aoc3RvcC5fb2Zmc2V0LCBzdG9wLl9jb2xvcik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAncmFkaWFsLWdyYWRpZW50Jzoge1xyXG5cclxuICAgICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIGVsZW0pIHtcclxuXHJcbiAgICAgICAgaWYgKCFjdHguY2FudmFzLmdldENvbnRleHQoJzJkJykpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVmZmVjdCB8fCB0aGlzLl9mbGFnQ2VudGVyIHx8IHRoaXMuX2ZsYWdGb2NhbFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9mbGFnUmFkaXVzIHx8IHRoaXMuX2ZsYWdTdG9wcykge1xyXG5cclxuICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLmVmZmVjdCA9IGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudChcclxuICAgICAgICAgICAgdGhpcy5jZW50ZXIuX3gsIHRoaXMuY2VudGVyLl95LCAwLFxyXG4gICAgICAgICAgICB0aGlzLmZvY2FsLl94LCB0aGlzLmZvY2FsLl95LCB0aGlzLl9yYWRpdXNcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0b3BzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBzdG9wID0gdGhpcy5zdG9wc1tpXTtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuZWZmZWN0LmFkZENvbG9yU3RvcChzdG9wLl9vZmZzZXQsIHN0b3AuX2NvbG9yKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5mbGFnUmVzZXQoKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHRleHR1cmU6IHtcclxuXHJcbiAgICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4LCBlbGVtKSB7XHJcblxyXG4gICAgICAgIGlmICghY3R4LmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgICAgdmFyIGltYWdlID0gdGhpcy5pbWFnZTtcclxuICAgICAgICB2YXIgcmVwZWF0O1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuX3JlbmRlcmVyLmVmZmVjdCB8fCAoKHRoaXMuX2ZsYWdMb2FkZWQgfHwgdGhpcy5fZmxhZ1JlcGVhdCkgJiYgdGhpcy5sb2FkZWQpKSB7XHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5lZmZlY3QgPSBjdHguY3JlYXRlUGF0dGVybihpbWFnZSwgdGhpcy5fcmVwZWF0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnT2Zmc2V0IHx8IHRoaXMuX2ZsYWdMb2FkZWQgfHwgdGhpcy5fZmxhZ1NjYWxlKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCEodGhpcy5fcmVuZGVyZXIub2Zmc2V0IGluc3RhbmNlb2YgVHdvLlZlY3RvcikpIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0ID0gbmV3IFR3by5WZWN0b3IoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueCA9IHRoaXMuX29mZnNldC54O1xyXG4gICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnkgPSB0aGlzLl9vZmZzZXQueTtcclxuXHJcbiAgICAgICAgICBpZiAoaW1hZ2UpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC54IC09IGltYWdlLndpZHRoIC8gMjtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnkgKz0gaW1hZ2UuaGVpZ2h0IC8gMjtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJlci5vZmZzZXQueCAqPSB0aGlzLl9zY2FsZS54O1xyXG4gICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLm9mZnNldC55ICo9IHRoaXMuX3NjYWxlLnk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnggKj0gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIub2Zmc2V0LnkgKj0gdGhpcy5fc2NhbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fZmxhZ1NjYWxlIHx8IHRoaXMuX2ZsYWdMb2FkZWQpIHtcclxuXHJcbiAgICAgICAgICBpZiAoISh0aGlzLl9yZW5kZXJlci5zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlID0gbmV3IFR3by5WZWN0b3IoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmVyLnNjYWxlLmNvcHkodGhpcy5fc2NhbGUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVuZGVyZXIuc2NhbGUuc2V0KHRoaXMuX3NjYWxlLCB0aGlzLl9zY2FsZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxhZ1Jlc2V0KCk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRUcmlhbmdsZXM6IGZ1bmN0aW9uKHJlY3QsIHRyaWFuZ2xlcykge1xyXG5cclxuICAgICAgdmFyIHRvcCA9IHJlY3QudG9wLFxyXG4gICAgICAgICAgbGVmdCA9IHJlY3QubGVmdCxcclxuICAgICAgICAgIHJpZ2h0ID0gcmVjdC5yaWdodCxcclxuICAgICAgICAgIGJvdHRvbSA9IHJlY3QuYm90dG9tO1xyXG5cclxuICAgICAgLy8gRmlyc3QgVHJpYW5nbGVcclxuXHJcbiAgICAgIHRyaWFuZ2xlc1swXSA9IGxlZnQ7XHJcbiAgICAgIHRyaWFuZ2xlc1sxXSA9IHRvcDtcclxuXHJcbiAgICAgIHRyaWFuZ2xlc1syXSA9IHJpZ2h0O1xyXG4gICAgICB0cmlhbmdsZXNbM10gPSB0b3A7XHJcblxyXG4gICAgICB0cmlhbmdsZXNbNF0gPSBsZWZ0O1xyXG4gICAgICB0cmlhbmdsZXNbNV0gPSBib3R0b207XHJcblxyXG4gICAgICAvLyBTZWNvbmQgVHJpYW5nbGVcclxuXHJcbiAgICAgIHRyaWFuZ2xlc1s2XSA9IGxlZnQ7XHJcbiAgICAgIHRyaWFuZ2xlc1s3XSA9IGJvdHRvbTtcclxuXHJcbiAgICAgIHRyaWFuZ2xlc1s4XSA9IHJpZ2h0O1xyXG4gICAgICB0cmlhbmdsZXNbOV0gPSB0b3A7XHJcblxyXG4gICAgICB0cmlhbmdsZXNbMTBdID0gcmlnaHQ7XHJcbiAgICAgIHRyaWFuZ2xlc1sxMV0gPSBib3R0b207XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB1cGRhdGVUZXh0dXJlOiBmdW5jdGlvbihnbCwgZWxlbSkge1xyXG5cclxuICAgICAgdGhpc1tlbGVtLl9yZW5kZXJlci50eXBlXS51cGRhdGVDYW52YXMuY2FsbCh3ZWJnbCwgZWxlbSk7XHJcblxyXG4gICAgICBpZiAoZWxlbS5fcmVuZGVyZXIudGV4dHVyZSkge1xyXG4gICAgICAgIGdsLmRlbGV0ZVRleHR1cmUoZWxlbS5fcmVuZGVyZXIudGV4dHVyZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBlbGVtLl9yZW5kZXJlci50ZXh0dXJlQ29vcmRzQnVmZmVyKTtcclxuXHJcbiAgICAgIC8vIFRPRE86IElzIHRoaXMgbmVjZXNzYXJ5IGV2ZXJ5IHRpbWUgb3IgY2FuIHdlIGRvIG9uY2U/XHJcbiAgICAgIC8vIFRPRE86IENyZWF0ZSBhIHJlZ2lzdHJ5IGZvciB0ZXh0dXJlc1xyXG4gICAgICBlbGVtLl9yZW5kZXJlci50ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBlbGVtLl9yZW5kZXJlci50ZXh0dXJlKTtcclxuXHJcbiAgICAgIC8vIFNldCB0aGUgcGFyYW1ldGVycyBzbyB3ZSBjYW4gcmVuZGVyIGFueSBzaXplIGltYWdlLlxyXG4gICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAvLyBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgICAgLy8gZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLk5FQVJFU1QpO1xyXG4gICAgICAvLyBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTkVBUkVTVCk7XHJcblxyXG4gICAgICBpZiAodGhpcy5jYW52YXMud2lkdGggPD0gMCB8fCB0aGlzLmNhbnZhcy5oZWlnaHQgPD0gMCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVXBsb2FkIHRoZSBpbWFnZSBpbnRvIHRoZSB0ZXh0dXJlLlxyXG4gICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIGdsLlJHQkEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHRoaXMuY2FudmFzKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZUJ1ZmZlcjogZnVuY3Rpb24oZ2wsIGVsZW0sIHByb2dyYW0pIHtcclxuXHJcbiAgICAgIGlmIChfLmlzT2JqZWN0KGVsZW0uX3JlbmRlcmVyLmJ1ZmZlcikpIHtcclxuICAgICAgICBnbC5kZWxldGVCdWZmZXIoZWxlbS5fcmVuZGVyZXIuYnVmZmVyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZWxlbS5fcmVuZGVyZXIuYnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XHJcblxyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgZWxlbS5fcmVuZGVyZXIuYnVmZmVyKTtcclxuICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkocHJvZ3JhbS5wb3NpdGlvbik7XHJcblxyXG4gICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZWxlbS5fcmVuZGVyZXIudHJpYW5nbGVzLCBnbC5TVEFUSUNfRFJBVyk7XHJcblxyXG4gICAgICBpZiAoXy5pc09iamVjdChlbGVtLl9yZW5kZXJlci50ZXh0dXJlQ29vcmRzQnVmZmVyKSkge1xyXG4gICAgICAgIGdsLmRlbGV0ZUJ1ZmZlcihlbGVtLl9yZW5kZXJlci50ZXh0dXJlQ29vcmRzQnVmZmVyKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZWxlbS5fcmVuZGVyZXIudGV4dHVyZUNvb3Jkc0J1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG5cclxuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGVsZW0uX3JlbmRlcmVyLnRleHR1cmVDb29yZHNCdWZmZXIpO1xyXG4gICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShwcm9ncmFtLnRleHR1cmVDb29yZHMpO1xyXG5cclxuICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHRoaXMudXYsIGdsLlNUQVRJQ19EUkFXKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHByb2dyYW06IHtcclxuXHJcbiAgICAgIGNyZWF0ZTogZnVuY3Rpb24oZ2wsIHNoYWRlcnMpIHtcclxuICAgICAgICB2YXIgcHJvZ3JhbSwgbGlua2VkLCBlcnJvcjtcclxuICAgICAgICBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgICAgIF8uZWFjaChzaGFkZXJzLCBmdW5jdGlvbihzKSB7XHJcbiAgICAgICAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xyXG4gICAgICAgIGxpbmtlZCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xyXG4gICAgICAgIGlmICghbGlua2VkKSB7XHJcbiAgICAgICAgICBlcnJvciA9IGdsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pO1xyXG4gICAgICAgICAgZ2wuZGVsZXRlUHJvZ3JhbShwcm9ncmFtKTtcclxuICAgICAgICAgIHRocm93IG5ldyBUd28uVXRpbHMuRXJyb3IoJ3VuYWJsZSB0byBsaW5rIHByb2dyYW06ICcgKyBlcnJvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZ3JhbTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHNoYWRlcnM6IHtcclxuXHJcbiAgICAgIGNyZWF0ZTogZnVuY3Rpb24oZ2wsIHNvdXJjZSwgdHlwZSkge1xyXG4gICAgICAgIHZhciBzaGFkZXIsIGNvbXBpbGVkLCBlcnJvcjtcclxuICAgICAgICBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2xbdHlwZV0pO1xyXG4gICAgICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XHJcbiAgICAgICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xyXG5cclxuICAgICAgICBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIGdsLkNPTVBJTEVfU1RBVFVTKTtcclxuICAgICAgICBpZiAoIWNvbXBpbGVkKSB7XHJcbiAgICAgICAgICBlcnJvciA9IGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKTtcclxuICAgICAgICAgIGdsLmRlbGV0ZVNoYWRlcihzaGFkZXIpO1xyXG4gICAgICAgICAgdGhyb3cgbmV3IFR3by5VdGlscy5FcnJvcigndW5hYmxlIHRvIGNvbXBpbGUgc2hhZGVyICcgKyBzaGFkZXIgKyAnOiAnICsgZXJyb3IpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNoYWRlcjtcclxuXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICB0eXBlczoge1xyXG4gICAgICAgIHZlcnRleDogJ1ZFUlRFWF9TSEFERVInLFxyXG4gICAgICAgIGZyYWdtZW50OiAnRlJBR01FTlRfU0hBREVSJ1xyXG4gICAgICB9LFxyXG5cclxuICAgICAgdmVydGV4OiBbXHJcbiAgICAgICAgJ2F0dHJpYnV0ZSB2ZWMyIGFfcG9zaXRpb247JyxcclxuICAgICAgICAnYXR0cmlidXRlIHZlYzIgYV90ZXh0dXJlQ29vcmRzOycsXHJcbiAgICAgICAgJycsXHJcbiAgICAgICAgJ3VuaWZvcm0gbWF0MyB1X21hdHJpeDsnLFxyXG4gICAgICAgICd1bmlmb3JtIHZlYzIgdV9yZXNvbHV0aW9uOycsXHJcbiAgICAgICAgJycsXHJcbiAgICAgICAgJ3ZhcnlpbmcgdmVjMiB2X3RleHR1cmVDb29yZHM7JyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAndm9pZCBtYWluKCkgeycsXHJcbiAgICAgICAgJyAgIHZlYzIgcHJvamVjdGVkID0gKHVfbWF0cml4ICogdmVjMyhhX3Bvc2l0aW9uLCAxLjApKS54eTsnLFxyXG4gICAgICAgICcgICB2ZWMyIG5vcm1hbCA9IHByb2plY3RlZCAvIHVfcmVzb2x1dGlvbjsnLFxyXG4gICAgICAgICcgICB2ZWMyIGNsaXBzcGFjZSA9IChub3JtYWwgKiAyLjApIC0gMS4wOycsXHJcbiAgICAgICAgJycsXHJcbiAgICAgICAgJyAgIGdsX1Bvc2l0aW9uID0gdmVjNChjbGlwc3BhY2UgKiB2ZWMyKDEuMCwgLTEuMCksIDAuMCwgMS4wKTsnLFxyXG4gICAgICAgICcgICB2X3RleHR1cmVDb29yZHMgPSBhX3RleHR1cmVDb29yZHM7JyxcclxuICAgICAgICAnfSdcclxuICAgICAgXS5qb2luKCdcXG4nKSxcclxuXHJcbiAgICAgIGZyYWdtZW50OiBbXHJcbiAgICAgICAgJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXHJcbiAgICAgICAgJycsXHJcbiAgICAgICAgJ3VuaWZvcm0gc2FtcGxlcjJEIHVfaW1hZ2U7JyxcclxuICAgICAgICAndmFyeWluZyB2ZWMyIHZfdGV4dHVyZUNvb3JkczsnLFxyXG4gICAgICAgICcnLFxyXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcclxuICAgICAgICAnICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodV9pbWFnZSwgdl90ZXh0dXJlQ29vcmRzKTsnLFxyXG4gICAgICAgICd9J1xyXG4gICAgICBdLmpvaW4oJ1xcbicpXHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBUZXh0dXJlUmVnaXN0cnk6IG5ldyBUd28uUmVnaXN0cnkoKVxyXG5cclxuICB9O1xyXG5cclxuICB3ZWJnbC5jdHggPSB3ZWJnbC5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgdmFyIFJlbmRlcmVyID0gVHdvW1R3by5UeXBlcy53ZWJnbF0gPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcblxyXG4gICAgdmFyIHBhcmFtcywgZ2wsIHZzLCBmcztcclxuICAgIHRoaXMuZG9tRWxlbWVudCA9IG9wdGlvbnMuZG9tRWxlbWVudCB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuXHJcbiAgICAvLyBFdmVyeXRoaW5nIGRyYXduIG9uIHRoZSBjYW52YXMgbmVlZHMgdG8gY29tZSBmcm9tIHRoZSBzdGFnZS5cclxuICAgIHRoaXMuc2NlbmUgPSBuZXcgVHdvLkdyb3VwKCk7XHJcbiAgICB0aGlzLnNjZW5lLnBhcmVudCA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIgPSB7XHJcbiAgICAgIG1hdHJpeDogbmV3IFR3by5BcnJheShpZGVudGl0eSksXHJcbiAgICAgIHNjYWxlOiAxLFxyXG4gICAgICBvcGFjaXR5OiAxXHJcbiAgICB9O1xyXG4gICAgdGhpcy5fZmxhZ01hdHJpeCA9IHRydWU7XHJcblxyXG4gICAgLy8gaHR0cDovL2dhbWVzLmdyZWdnbWFuLmNvbS9nYW1lL3dlYmdsLWFuZC1hbHBoYS9cclxuICAgIC8vIGh0dHA6Ly93d3cua2hyb25vcy5vcmcvcmVnaXN0cnkvd2ViZ2wvc3BlY3MvbGF0ZXN0LyM1LjJcclxuICAgIHBhcmFtcyA9IF8uZGVmYXVsdHMob3B0aW9ucyB8fCB7fSwge1xyXG4gICAgICBhbnRpYWxpYXM6IGZhbHNlLFxyXG4gICAgICBhbHBoYTogdHJ1ZSxcclxuICAgICAgcHJlbXVsdGlwbGllZEFscGhhOiB0cnVlLFxyXG4gICAgICBzdGVuY2lsOiB0cnVlLFxyXG4gICAgICBwcmVzZXJ2ZURyYXdpbmdCdWZmZXI6IHRydWUsXHJcbiAgICAgIG92ZXJkcmF3OiBmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5vdmVyZHJhdyA9IHBhcmFtcy5vdmVyZHJhdztcclxuXHJcbiAgICBnbCA9IHRoaXMuY3R4ID0gdGhpcy5kb21FbGVtZW50LmdldENvbnRleHQoJ3dlYmdsJywgcGFyYW1zKSB8fFxyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgcGFyYW1zKTtcclxuXHJcbiAgICBpZiAoIXRoaXMuY3R4KSB7XHJcbiAgICAgIHRocm93IG5ldyBUd28uVXRpbHMuRXJyb3IoXHJcbiAgICAgICAgJ3VuYWJsZSB0byBjcmVhdGUgYSB3ZWJnbCBjb250ZXh0LiBUcnkgdXNpbmcgYW5vdGhlciByZW5kZXJlci4nKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDb21waWxlIEJhc2UgU2hhZGVycyB0byBkcmF3IGluIHBpeGVsIHNwYWNlLlxyXG4gICAgdnMgPSB3ZWJnbC5zaGFkZXJzLmNyZWF0ZShcclxuICAgICAgZ2wsIHdlYmdsLnNoYWRlcnMudmVydGV4LCB3ZWJnbC5zaGFkZXJzLnR5cGVzLnZlcnRleCk7XHJcbiAgICBmcyA9IHdlYmdsLnNoYWRlcnMuY3JlYXRlKFxyXG4gICAgICBnbCwgd2ViZ2wuc2hhZGVycy5mcmFnbWVudCwgd2ViZ2wuc2hhZGVycy50eXBlcy5mcmFnbWVudCk7XHJcblxyXG4gICAgdGhpcy5wcm9ncmFtID0gd2ViZ2wucHJvZ3JhbS5jcmVhdGUoZ2wsIFt2cywgZnNdKTtcclxuICAgIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYW5kIGJpbmQgdGhlIGRyYXdpbmcgYnVmZmVyXHJcblxyXG4gICAgLy8gbG9vayB1cCB3aGVyZSB0aGUgdmVydGV4IGRhdGEgbmVlZHMgdG8gZ28uXHJcbiAgICB0aGlzLnByb2dyYW0ucG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnByb2dyYW0sICdhX3Bvc2l0aW9uJyk7XHJcbiAgICB0aGlzLnByb2dyYW0ubWF0cml4ID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgJ3VfbWF0cml4Jyk7XHJcbiAgICB0aGlzLnByb2dyYW0udGV4dHVyZUNvb3JkcyA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgJ2FfdGV4dHVyZUNvb3JkcycpO1xyXG5cclxuICAgIC8vIENvcGllZCBmcm9tIFRocmVlLmpzIFdlYkdMUmVuZGVyZXJcclxuICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XHJcblxyXG4gICAgLy8gU2V0dXAgc29tZSBpbml0aWFsIHN0YXRlbWVudHMgb2YgdGhlIGdsIGNvbnRleHRcclxuICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XHJcblxyXG4gICAgLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTMxNjM5M1xyXG4gICAgLy8gZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBnbC5UUlVFKTtcclxuXHJcbiAgICBnbC5ibGVuZEVxdWF0aW9uU2VwYXJhdGUoZ2wuRlVOQ19BREQsIGdsLkZVTkNfQUREKTtcclxuICAgIGdsLmJsZW5kRnVuY1NlcGFyYXRlKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSxcclxuICAgICAgZ2wuT05FLCBnbC5PTkVfTUlOVVNfU1JDX0FMUEhBICk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFJlbmRlcmVyLCB7XHJcblxyXG4gICAgVXRpbHM6IHdlYmdsXHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChSZW5kZXJlci5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICBzZXRTaXplOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCByYXRpbykge1xyXG5cclxuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuXHJcbiAgICAgIHRoaXMucmF0aW8gPSBfLmlzVW5kZWZpbmVkKHJhdGlvKSA/IGdldFJhdGlvKHRoaXMuY3R4KSA6IHJhdGlvO1xyXG5cclxuICAgICAgdGhpcy5kb21FbGVtZW50LndpZHRoID0gd2lkdGggKiB0aGlzLnJhdGlvO1xyXG4gICAgICB0aGlzLmRvbUVsZW1lbnQuaGVpZ2h0ID0gaGVpZ2h0ICogdGhpcy5yYXRpbztcclxuXHJcbiAgICAgIF8uZXh0ZW5kKHRoaXMuZG9tRWxlbWVudC5zdHlsZSwge1xyXG4gICAgICAgIHdpZHRoOiB3aWR0aCArICdweCcsXHJcbiAgICAgICAgaGVpZ2h0OiBoZWlnaHQgKyAncHgnXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgd2lkdGggKj0gdGhpcy5yYXRpbztcclxuICAgICAgaGVpZ2h0ICo9IHRoaXMucmF0aW87XHJcblxyXG4gICAgICAvLyBTZXQgZm9yIHRoaXMuc3RhZ2UgcGFyZW50IHNjYWxpbmcgdG8gYWNjb3VudCBmb3IgSERQSVxyXG4gICAgICB0aGlzLl9yZW5kZXJlci5tYXRyaXhbMF0gPSB0aGlzLl9yZW5kZXJlci5tYXRyaXhbNF0gPSB0aGlzLl9yZW5kZXJlci5zY2FsZSA9IHRoaXMucmF0aW87XHJcblxyXG4gICAgICB0aGlzLl9mbGFnTWF0cml4ID0gdHJ1ZTtcclxuXHJcbiAgICAgIHRoaXMuY3R4LnZpZXdwb3J0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG5cclxuICAgICAgdmFyIHJlc29sdXRpb25Mb2NhdGlvbiA9IHRoaXMuY3R4LmdldFVuaWZvcm1Mb2NhdGlvbihcclxuICAgICAgICB0aGlzLnByb2dyYW0sICd1X3Jlc29sdXRpb24nKTtcclxuICAgICAgdGhpcy5jdHgudW5pZm9ybTJmKHJlc29sdXRpb25Mb2NhdGlvbiwgd2lkdGgsIGhlaWdodCk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgZ2wgPSB0aGlzLmN0eDtcclxuXHJcbiAgICAgIGlmICghdGhpcy5vdmVyZHJhdykge1xyXG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgd2ViZ2wuZ3JvdXAucmVuZGVyLmNhbGwodGhpcy5zY2VuZSwgZ2wsIHRoaXMucHJvZ3JhbSk7XHJcbiAgICAgIHRoaXMuX2ZsYWdNYXRyaXggPSBmYWxzZTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFNoYXBlID0gVHdvLlNoYXBlID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gUHJpdmF0ZSBvYmplY3QgZm9yIHJlbmRlcmVyIHNwZWNpZmljIHZhcmlhYmxlcy5cclxuICAgIHRoaXMuX3JlbmRlcmVyID0ge307XHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnTWF0cml4ID0gXy5iaW5kKFNoYXBlLkZsYWdNYXRyaXgsIHRoaXMpO1xyXG4gICAgdGhpcy5pc1NoYXBlID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmlkID0gVHdvLklkZW50aWZpZXIgKyBUd28udW5pcXVlSWQoKTtcclxuICAgIHRoaXMuY2xhc3NMaXN0ID0gW107XHJcblxyXG4gICAgLy8gRGVmaW5lIG1hdHJpeCBwcm9wZXJ0aWVzIHdoaWNoIGFsbCBpbmhlcml0ZWRcclxuICAgIC8vIG9iamVjdHMgb2YgU2hhcGUgaGF2ZS5cclxuXHJcbiAgICB0aGlzLl9tYXRyaXggPSBuZXcgVHdvLk1hdHJpeCgpO1xyXG5cclxuICAgIHRoaXMudHJhbnNsYXRpb24gPSBuZXcgVHdvLlZlY3RvcigpO1xyXG4gICAgdGhpcy5yb3RhdGlvbiA9IDA7XHJcbiAgICB0aGlzLnNjYWxlID0gMTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoU2hhcGUsIHtcclxuXHJcbiAgICBGbGFnTWF0cml4OiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ01hdHJpeCA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmplY3QpIHtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICd0cmFuc2xhdGlvbicsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fdHJhbnNsYXRpb247XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIGlmICh0aGlzLl90cmFuc2xhdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLl90cmFuc2xhdGlvbi51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdNYXRyaXgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy5fdHJhbnNsYXRpb24gPSB2O1xyXG4gICAgICAgICAgdGhpcy5fdHJhbnNsYXRpb24uYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ01hdHJpeCk7XHJcbiAgICAgICAgICBTaGFwZS5GbGFnTWF0cml4LmNhbGwodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdyb3RhdGlvbicsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fcm90YXRpb247XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXMuX3JvdGF0aW9uID0gdjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdNYXRyaXggPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnc2NhbGUnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3NjYWxlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9zY2FsZS51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdNYXRyaXgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX3NjYWxlID0gdjtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3NjYWxlLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdNYXRyaXgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX2ZsYWdNYXRyaXggPSB0cnVlO1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ1NjYWxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChTaGFwZS5wcm90b3R5cGUsIFR3by5VdGlscy5FdmVudHMsIHtcclxuXHJcbiAgICAvLyBGbGFnc1xyXG5cclxuICAgIF9mbGFnTWF0cml4OiB0cnVlLFxyXG4gICAgX2ZsYWdTY2FsZTogZmFsc2UsXHJcblxyXG4gICAgLy8gX2ZsYWdNYXNrOiBmYWxzZSxcclxuICAgIC8vIF9mbGFnQ2xpcDogZmFsc2UsXHJcblxyXG4gICAgLy8gVW5kZXJseWluZyBQcm9wZXJ0aWVzXHJcblxyXG4gICAgX3JvdGF0aW9uOiAwLFxyXG4gICAgX3NjYWxlOiAxLFxyXG4gICAgX3RyYW5zbGF0aW9uOiBudWxsLFxyXG5cclxuICAgIC8vIF9tYXNrOiBudWxsLFxyXG4gICAgLy8gX2NsaXA6IGZhbHNlLFxyXG5cclxuICAgIGFkZFRvOiBmdW5jdGlvbihncm91cCkge1xyXG4gICAgICBncm91cC5hZGQodGhpcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBTaGFwZSgpO1xyXG4gICAgICBjbG9uZS50cmFuc2xhdGlvbi5jb3B5KHRoaXMudHJhbnNsYXRpb24pO1xyXG4gICAgICBjbG9uZS5yb3RhdGlvbiA9IHRoaXMucm90YXRpb247XHJcbiAgICAgIGNsb25lLnNjYWxlID0gdGhpcy5zY2FsZTtcclxuICAgICAgXy5lYWNoKFNoYXBlLlByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICBjbG9uZVtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG4gICAgICByZXR1cm4gY2xvbmUuX3VwZGF0ZSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRvIGJlIGNhbGxlZCBiZWZvcmUgcmVuZGVyIHRoYXQgY2FsY3VsYXRlcyBhbmQgY29sbGF0ZXMgYWxsIGluZm9ybWF0aW9uXHJcbiAgICAgKiB0byBiZSBhcyB1cC10by1kYXRlIGFzIHBvc3NpYmxlIGZvciB0aGUgcmVuZGVyLiBDYWxsZWQgb25jZSBhIGZyYW1lLlxyXG4gICAgICovXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbihkZWVwKSB7XHJcblxyXG4gICAgICBpZiAoIXRoaXMuX21hdHJpeC5tYW51YWwgJiYgdGhpcy5fZmxhZ01hdHJpeCkge1xyXG5cclxuICAgICAgICB0aGlzLl9tYXRyaXhcclxuICAgICAgICAgIC5pZGVudGl0eSgpXHJcbiAgICAgICAgICAudHJhbnNsYXRlKHRoaXMudHJhbnNsYXRpb24ueCwgdGhpcy50cmFuc2xhdGlvbi55KTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fc2NhbGUgaW5zdGFuY2VvZiBUd28uVmVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21hdHJpeC5zY2FsZSh0aGlzLl9zY2FsZS54LCB0aGlzLl9zY2FsZS55KTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21hdHJpeC5zY2FsZSh0aGlzLl9zY2FsZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fbWF0cml4LnJvdGF0ZSh0aGlzLnJvdGF0aW9uKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChkZWVwKSB7XHJcbiAgICAgICAgLy8gQnViYmxlIHVwIHRvIHBhcmVudHMgbWFpbmx5IGZvciBgZ2V0Qm91bmRpbmdDbGllbnRSZWN0YCBtZXRob2QuXHJcbiAgICAgICAgaWYgKHRoaXMucGFyZW50ICYmIHRoaXMucGFyZW50Ll91cGRhdGUpIHtcclxuICAgICAgICAgIHRoaXMucGFyZW50Ll91cGRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdNYXRyaXggPSB0aGlzLl9mbGFnU2NhbGUgPSBmYWxzZTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFNoYXBlLk1ha2VPYnNlcnZhYmxlKFNoYXBlLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICAvKipcclxuICAgKiBDb25zdGFudHNcclxuICAgKi9cclxuXHJcbiAgdmFyIG1pbiA9IE1hdGgubWluLCBtYXggPSBNYXRoLm1heCwgcm91bmQgPSBNYXRoLnJvdW5kLFxyXG4gICAgZ2V0Q29tcHV0ZWRNYXRyaXggPSBUd28uVXRpbHMuZ2V0Q29tcHV0ZWRNYXRyaXg7XHJcblxyXG4gIHZhciBjb21tYW5kcyA9IHt9O1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICBfLmVhY2goVHdvLkNvbW1hbmRzLCBmdW5jdGlvbih2LCBrKSB7XHJcbiAgICBjb21tYW5kc1trXSA9IG5ldyBSZWdFeHAodik7XHJcbiAgfSk7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGggPSBmdW5jdGlvbih2ZXJ0aWNlcywgY2xvc2VkLCBjdXJ2ZWQsIG1hbnVhbCkge1xyXG5cclxuICAgIFR3by5TaGFwZS5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyLnR5cGUgPSAncGF0aCc7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnVmVydGljZXMgPSBfLmJpbmQoUGF0aC5GbGFnVmVydGljZXMsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuYmluZFZlcnRpY2VzID0gXy5iaW5kKFBhdGguQmluZFZlcnRpY2VzLCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLnVuYmluZFZlcnRpY2VzID0gXy5iaW5kKFBhdGguVW5iaW5kVmVydGljZXMsIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdGaWxsID0gXy5iaW5kKFBhdGguRmxhZ0ZpbGwsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0cm9rZSA9IF8uYmluZChQYXRoLkZsYWdTdHJva2UsIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuX2Nsb3NlZCA9ICEhY2xvc2VkO1xyXG4gICAgdGhpcy5fY3VydmVkID0gISFjdXJ2ZWQ7XHJcblxyXG4gICAgdGhpcy5iZWdpbm5pbmcgPSAwO1xyXG4gICAgdGhpcy5lbmRpbmcgPSAxO1xyXG5cclxuICAgIC8vIFN0eWxlIHByb3BlcnRpZXNcclxuXHJcbiAgICB0aGlzLmZpbGwgPSAnI2ZmZic7XHJcbiAgICB0aGlzLnN0cm9rZSA9ICcjMDAwJztcclxuICAgIHRoaXMubGluZXdpZHRoID0gMS4wO1xyXG4gICAgdGhpcy5vcGFjaXR5ID0gMS4wO1xyXG4gICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmNhcCA9ICdidXR0JzsgICAgICAvLyBEZWZhdWx0IG9mIEFkb2JlIElsbHVzdHJhdG9yXHJcbiAgICB0aGlzLmpvaW4gPSAnbWl0ZXInOyAgICAvLyBEZWZhdWx0IG9mIEFkb2JlIElsbHVzdHJhdG9yXHJcbiAgICB0aGlzLm1pdGVyID0gNDsgICAgICAgICAvLyBEZWZhdWx0IG9mIEFkb2JlIElsbHVzdHJhdG9yXHJcblxyXG4gICAgdGhpcy5fdmVydGljZXMgPSBbXTtcclxuICAgIHRoaXMudmVydGljZXMgPSB2ZXJ0aWNlcztcclxuXHJcbiAgICAvLyBEZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IHR3by5qcyBzaG91bGQgY2FsY3VsYXRlIGN1cnZlcywgbGluZXMsIGFuZFxyXG4gICAgLy8gY29tbWFuZHMgYXV0b21hdGljYWxseSBmb3IgeW91IG9yIHRvIGxldCB0aGUgZGV2ZWxvcGVyIG1hbmlwdWxhdGUgdGhlbVxyXG4gICAgLy8gZm9yIHRoZW1zZWx2ZXMuXHJcbiAgICB0aGlzLmF1dG9tYXRpYyA9ICFtYW51YWw7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFBhdGgsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbXHJcbiAgICAgICdmaWxsJyxcclxuICAgICAgJ3N0cm9rZScsXHJcbiAgICAgICdsaW5ld2lkdGgnLFxyXG4gICAgICAnb3BhY2l0eScsXHJcbiAgICAgICd2aXNpYmxlJyxcclxuICAgICAgJ2NhcCcsXHJcbiAgICAgICdqb2luJyxcclxuICAgICAgJ21pdGVyJyxcclxuXHJcbiAgICAgICdjbG9zZWQnLFxyXG4gICAgICAnY3VydmVkJyxcclxuICAgICAgJ2F1dG9tYXRpYycsXHJcbiAgICAgICdiZWdpbm5pbmcnLFxyXG4gICAgICAnZW5kaW5nJ1xyXG4gICAgXSxcclxuXHJcbiAgICBGbGFnVmVydGljZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnVmVydGljZXMgPSB0cnVlO1xyXG4gICAgICB0aGlzLl9mbGFnTGVuZ3RoID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgQmluZFZlcnRpY2VzOiBmdW5jdGlvbihpdGVtcykge1xyXG5cclxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYSBsb3RcclxuICAgICAgLy8gd2hlbiBpbXBvcnRpbmcgYSBsYXJnZSBTVkdcclxuICAgICAgdmFyIGkgPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICBpdGVtc1tpXS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnVmVydGljZXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9yZW5kZXJlci5mbGFnVmVydGljZXMoKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIFVuYmluZFZlcnRpY2VzOiBmdW5jdGlvbihpdGVtcykge1xyXG5cclxuICAgICAgdmFyIGkgPSBpdGVtcy5sZW5ndGg7XHJcbiAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICBpdGVtc1tpXS51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdWZXJ0aWNlcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdWZXJ0aWNlcygpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgRmxhZ0ZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnRmlsbCA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIEZsYWdTdHJva2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnU3Ryb2tlID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgVHdvLlNoYXBlLk1ha2VPYnNlcnZhYmxlKG9iamVjdCk7XHJcblxyXG4gICAgICAvLyBPbmx5IHRoZSA2IGRlZmluZWQgcHJvcGVydGllcyBhcmUgZmxhZ2dlZCBsaWtlIHRoaXMuIFRoZSBzdWJzZXF1ZW50XHJcbiAgICAgIC8vIHByb3BlcnRpZXMgYmVoYXZlIGRpZmZlcmVudGx5IGFuZCBuZWVkIHRvIGJlIGhhbmQgd3JpdHRlbi5cclxuICAgICAgXy5lYWNoKFBhdGguUHJvcGVydGllcy5zbGljZSgyLCA4KSwgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmplY3QpO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2ZpbGwnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGYpIHtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5HcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbGwudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnRmlsbCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fZmlsbCA9IGY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnRmlsbCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9maWxsLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdGaWxsKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdzdHJva2UnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3N0cm9rZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZikge1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdHJva2UudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnU3Ryb2tlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9zdHJva2UgPSBmO1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ1N0cm9rZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5HcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0cm9rZS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnU3Ryb2tlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdsZW5ndGgnLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICh0aGlzLl9mbGFnTGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUxlbmd0aCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2Nsb3NlZCcsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY2xvc2VkO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzLl9jbG9zZWQgPSAhIXY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnVmVydGljZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnY3VydmVkJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jdXJ2ZWQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgIHRoaXMuX2N1cnZlZCA9ICEhdjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdWZXJ0aWNlcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdhdXRvbWF0aWMnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2F1dG9tYXRpYztcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgaWYgKHYgPT09IHRoaXMuX2F1dG9tYXRpYykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICB0aGlzLl9hdXRvbWF0aWMgPSAhIXY7XHJcbiAgICAgICAgICB2YXIgbWV0aG9kID0gdGhpcy5fYXV0b21hdGljID8gJ2lnbm9yZScgOiAnbGlzdGVuJztcclxuICAgICAgICAgIF8uZWFjaCh0aGlzLnZlcnRpY2VzLCBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICAgIHZbbWV0aG9kXSgpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdiZWdpbm5pbmcnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2JlZ2lubmluZztcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpcy5fYmVnaW5uaW5nID0gdjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdWZXJ0aWNlcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdlbmRpbmcnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2VuZGluZztcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpcy5fZW5kaW5nID0gdjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdWZXJ0aWNlcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICd2ZXJ0aWNlcycsIHtcclxuXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jb2xsZWN0aW9uO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odmVydGljZXMpIHtcclxuXHJcbiAgICAgICAgICB2YXIgdXBkYXRlVmVydGljZXMgPSB0aGlzLl9yZW5kZXJlci5mbGFnVmVydGljZXM7XHJcbiAgICAgICAgICB2YXIgYmluZFZlcnRpY2VzID0gdGhpcy5fcmVuZGVyZXIuYmluZFZlcnRpY2VzO1xyXG4gICAgICAgICAgdmFyIHVuYmluZFZlcnRpY2VzID0gdGhpcy5fcmVuZGVyZXIudW5iaW5kVmVydGljZXM7XHJcblxyXG4gICAgICAgICAgLy8gUmVtb3ZlIHByZXZpb3VzIGxpc3RlbmVyc1xyXG4gICAgICAgICAgaWYgKHRoaXMuX2NvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5fY29sbGVjdGlvblxyXG4gICAgICAgICAgICAgIC51bmJpbmQoVHdvLkV2ZW50cy5pbnNlcnQsIGJpbmRWZXJ0aWNlcylcclxuICAgICAgICAgICAgICAudW5iaW5kKFR3by5FdmVudHMucmVtb3ZlLCB1bmJpbmRWZXJ0aWNlcyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ3JlYXRlIG5ldyBDb2xsZWN0aW9uIHdpdGggY29weSBvZiB2ZXJ0aWNlc1xyXG4gICAgICAgICAgdGhpcy5fY29sbGVjdGlvbiA9IG5ldyBUd28uVXRpbHMuQ29sbGVjdGlvbigodmVydGljZXMgfHwgW10pLnNsaWNlKDApKTtcclxuXHJcbiAgICAgICAgICAvLyBMaXN0ZW4gZm9yIENvbGxlY3Rpb24gY2hhbmdlcyBhbmQgYmluZCAvIHVuYmluZFxyXG4gICAgICAgICAgdGhpcy5fY29sbGVjdGlvblxyXG4gICAgICAgICAgICAuYmluZChUd28uRXZlbnRzLmluc2VydCwgYmluZFZlcnRpY2VzKVxyXG4gICAgICAgICAgICAuYmluZChUd28uRXZlbnRzLnJlbW92ZSwgdW5iaW5kVmVydGljZXMpO1xyXG5cclxuICAgICAgICAgIC8vIEJpbmQgSW5pdGlhbCBWZXJ0aWNlc1xyXG4gICAgICAgICAgYmluZFZlcnRpY2VzKHRoaXMuX2NvbGxlY3Rpb24pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdjbGlwJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jbGlwO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzLl9jbGlwID0gdjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdDbGlwID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFBhdGgucHJvdG90eXBlLCBUd28uU2hhcGUucHJvdG90eXBlLCB7XHJcblxyXG4gICAgLy8gRmxhZ3NcclxuICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmxhZ1xyXG5cclxuICAgIF9mbGFnVmVydGljZXM6IHRydWUsXHJcbiAgICBfZmxhZ0xlbmd0aDogdHJ1ZSxcclxuXHJcbiAgICBfZmxhZ0ZpbGw6IHRydWUsXHJcbiAgICBfZmxhZ1N0cm9rZTogdHJ1ZSxcclxuICAgIF9mbGFnTGluZXdpZHRoOiB0cnVlLFxyXG4gICAgX2ZsYWdPcGFjaXR5OiB0cnVlLFxyXG4gICAgX2ZsYWdWaXNpYmxlOiB0cnVlLFxyXG5cclxuICAgIF9mbGFnQ2FwOiB0cnVlLFxyXG4gICAgX2ZsYWdKb2luOiB0cnVlLFxyXG4gICAgX2ZsYWdNaXRlcjogdHJ1ZSxcclxuXHJcbiAgICBfZmxhZ0NsaXA6IGZhbHNlLFxyXG5cclxuICAgIC8vIFVuZGVybHlpbmcgUHJvcGVydGllc1xyXG5cclxuICAgIF9sZW5ndGg6IDAsXHJcblxyXG4gICAgX2ZpbGw6ICcjZmZmJyxcclxuICAgIF9zdHJva2U6ICcjMDAwJyxcclxuICAgIF9saW5ld2lkdGg6IDEuMCxcclxuICAgIF9vcGFjaXR5OiAxLjAsXHJcbiAgICBfdmlzaWJsZTogdHJ1ZSxcclxuXHJcbiAgICBfY2FwOiAncm91bmQnLFxyXG4gICAgX2pvaW46ICdyb3VuZCcsXHJcbiAgICBfbWl0ZXI6IDQsXHJcblxyXG4gICAgX2Nsb3NlZDogdHJ1ZSxcclxuICAgIF9jdXJ2ZWQ6IGZhbHNlLFxyXG4gICAgX2F1dG9tYXRpYzogdHJ1ZSxcclxuICAgIF9iZWdpbm5pbmc6IDAsXHJcbiAgICBfZW5kaW5nOiAxLjAsXHJcblxyXG4gICAgX2NsaXA6IGZhbHNlLFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuXHJcbiAgICAgIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIHZhciBwb2ludHMgPSBfLm1hcCh0aGlzLnZlcnRpY2VzLCBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgcmV0dXJuIHYuY2xvbmUoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgUGF0aChwb2ludHMsIHRoaXMuY2xvc2VkLCB0aGlzLmN1cnZlZCwgIXRoaXMuYXV0b21hdGljKTtcclxuXHJcbiAgICAgIF8uZWFjaChUd28uUGF0aC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgY2xvbmVba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIGNsb25lLnRyYW5zbGF0aW9uLmNvcHkodGhpcy50cmFuc2xhdGlvbik7XHJcbiAgICAgIGNsb25lLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbjtcclxuICAgICAgY2xvbmUuc2NhbGUgPSB0aGlzLnNjYWxlO1xyXG5cclxuICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgIHBhcmVudC5hZGQoY2xvbmUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgIHZlcnRpY2VzOiBfLm1hcCh0aGlzLnZlcnRpY2VzLCBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICByZXR1cm4gdi50b09iamVjdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBfLmVhY2goVHdvLlNoYXBlLlByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICByZXN1bHRba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHJlc3VsdC50cmFuc2xhdGlvbiA9IHRoaXMudHJhbnNsYXRpb24udG9PYmplY3Q7XHJcbiAgICAgIHJlc3VsdC5yb3RhdGlvbiA9IHRoaXMucm90YXRpb247XHJcbiAgICAgIHJlc3VsdC5zY2FsZSA9IHRoaXMuc2NhbGU7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbm9GaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5maWxsID0gJ3RyYW5zcGFyZW50JztcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIG5vU3Ryb2tlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zdHJva2UgPSAndHJhbnNwYXJlbnQnO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcmllbnQgdGhlIHZlcnRpY2VzIG9mIHRoZSBzaGFwZSB0byB0aGUgdXBwZXIgbGVmdGhhbmRcclxuICAgICAqIGNvcm5lciBvZiB0aGUgcGF0aC5cclxuICAgICAqL1xyXG4gICAgY29ybmVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZWN0ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QodHJ1ZSk7XHJcblxyXG4gICAgICByZWN0LmNlbnRyb2lkID0ge1xyXG4gICAgICAgIHg6IHJlY3QubGVmdCArIHJlY3Qud2lkdGggLyAyLFxyXG4gICAgICAgIHk6IHJlY3QudG9wICsgcmVjdC5oZWlnaHQgLyAyXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBfLmVhY2godGhpcy52ZXJ0aWNlcywgZnVuY3Rpb24odikge1xyXG4gICAgICAgIHYuYWRkU2VsZihyZWN0LmNlbnRyb2lkKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3JpZW50IHRoZSB2ZXJ0aWNlcyBvZiB0aGUgc2hhcGUgdG8gdGhlIGNlbnRlciBvZiB0aGVcclxuICAgICAqIHBhdGguXHJcbiAgICAgKi9cclxuICAgIGNlbnRlcjogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVjdCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHRydWUpO1xyXG5cclxuICAgICAgcmVjdC5jZW50cm9pZCA9IHtcclxuICAgICAgICB4OiByZWN0LmxlZnQgKyByZWN0LndpZHRoIC8gMixcclxuICAgICAgICB5OiByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC8gMlxyXG4gICAgICB9O1xyXG5cclxuICAgICAgXy5lYWNoKHRoaXMudmVydGljZXMsIGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICB2LnN1YlNlbGYocmVjdC5jZW50cm9pZCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gdGhpcy50cmFuc2xhdGlvbi5hZGRTZWxmKHJlY3QuY2VudHJvaWQpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBzZWxmIGZyb20gdGhlIHNjZW5lIC8gcGFyZW50LlxyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKCF0aGlzLnBhcmVudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnBhcmVudC5yZW1vdmUodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIGFuIG9iamVjdCB3aXRoIHRvcCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgd2lkdGgsIGFuZCBoZWlnaHRcclxuICAgICAqIHBhcmFtZXRlcnMgb2YgdGhlIGdyb3VwLlxyXG4gICAgICovXHJcbiAgICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IGZ1bmN0aW9uKHNoYWxsb3cpIHtcclxuICAgICAgdmFyIG1hdHJpeCwgYm9yZGVyLCBsLCB4LCB5LCBpLCB2O1xyXG5cclxuICAgICAgdmFyIGxlZnQgPSBJbmZpbml0eSwgcmlnaHQgPSAtSW5maW5pdHksXHJcbiAgICAgICAgICB0b3AgPSBJbmZpbml0eSwgYm90dG9tID0gLUluZmluaXR5O1xyXG5cclxuICAgICAgLy8gVE9ETzogVXBkYXRlIHRoaXMgdG8gbm90IF9fYWx3YXlzX18gdXBkYXRlLiBKdXN0IHdoZW4gaXQgbmVlZHMgdG8uXHJcbiAgICAgIHRoaXMuX3VwZGF0ZSh0cnVlKTtcclxuXHJcbiAgICAgIG1hdHJpeCA9ICEhc2hhbGxvdyA/IHRoaXMuX21hdHJpeCA6IGdldENvbXB1dGVkTWF0cml4KHRoaXMpO1xyXG5cclxuICAgICAgYm9yZGVyID0gdGhpcy5saW5ld2lkdGggLyAyO1xyXG4gICAgICBsID0gdGhpcy5fdmVydGljZXMubGVuZ3RoO1xyXG5cclxuICAgICAgaWYgKGwgPD0gMCkge1xyXG4gICAgICAgIHYgPSBtYXRyaXgubXVsdGlwbHkoMCwgMCwgMSk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHRvcDogdi55LFxyXG4gICAgICAgICAgbGVmdDogdi54LFxyXG4gICAgICAgICAgcmlnaHQ6IHYueCxcclxuICAgICAgICAgIGJvdHRvbTogdi55LFxyXG4gICAgICAgICAgd2lkdGg6IDAsXHJcbiAgICAgICAgICBoZWlnaHQ6IDBcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgdiA9IHRoaXMuX3ZlcnRpY2VzW2ldO1xyXG5cclxuICAgICAgICB4ID0gdi54O1xyXG4gICAgICAgIHkgPSB2Lnk7XHJcblxyXG4gICAgICAgIHYgPSBtYXRyaXgubXVsdGlwbHkoeCwgeSwgMSk7XHJcbiAgICAgICAgdG9wID0gbWluKHYueSAtIGJvcmRlciwgdG9wKTtcclxuICAgICAgICBsZWZ0ID0gbWluKHYueCAtIGJvcmRlciwgbGVmdCk7XHJcbiAgICAgICAgcmlnaHQgPSBtYXgodi54ICsgYm9yZGVyLCByaWdodCk7XHJcbiAgICAgICAgYm90dG9tID0gbWF4KHYueSArIGJvcmRlciwgYm90dG9tKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IHRvcCxcclxuICAgICAgICBsZWZ0OiBsZWZ0LFxyXG4gICAgICAgIHJpZ2h0OiByaWdodCxcclxuICAgICAgICBib3R0b206IGJvdHRvbSxcclxuICAgICAgICB3aWR0aDogcmlnaHQgLSBsZWZ0LFxyXG4gICAgICAgIGhlaWdodDogYm90dG9tIC0gdG9wXHJcbiAgICAgIH07XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIGEgZmxvYXQgYHRgIGZyb20gMCB0byAxLCByZXR1cm4gYSBwb2ludCBvciBhc3NpZ24gYSBwYXNzZWQgYG9iamAnc1xyXG4gICAgICogY29vcmRpbmF0ZXMgdG8gdGhhdCBwZXJjZW50YWdlIG9uIHRoaXMgVHdvLlBhdGgncyBjdXJ2ZS5cclxuICAgICAqL1xyXG4gICAgZ2V0UG9pbnRBdDogZnVuY3Rpb24odCwgb2JqKSB7XHJcbiAgICAgIHZhciBpYSwgaWI7XHJcbiAgICAgIHZhciB4LCB4MSwgeDIsIHgzLCB4NCwgeSwgeTEsIHkyLCB5MywgeTQsIGxlZnQsIHJpZ2h0O1xyXG4gICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5sZW5ndGggKiBNYXRoLm1pbihNYXRoLm1heCh0LCAwKSwgMSk7XHJcbiAgICAgIHZhciBsZW5ndGggPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDtcclxuICAgICAgdmFyIGxhc3QgPSBsZW5ndGggLSAxO1xyXG5cclxuICAgICAgdmFyIGEgPSBudWxsO1xyXG4gICAgICB2YXIgYiA9IG51bGw7XHJcblxyXG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX2xlbmd0aHMubGVuZ3RoLCBzdW0gPSAwOyBpIDwgbDsgaSsrKSB7XHJcblxyXG4gICAgICAgIGlmIChzdW0gKyB0aGlzLl9sZW5ndGhzW2ldID49IHRhcmdldCkge1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9jbG9zZWQpIHtcclxuICAgICAgICAgICAgaWEgPSBUd28uVXRpbHMubW9kKGksIGxlbmd0aCk7XHJcbiAgICAgICAgICAgIGliID0gVHdvLlV0aWxzLm1vZChpIC0gMSwgbGVuZ3RoKTtcclxuICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICAgICAgICBpYSA9IGliO1xyXG4gICAgICAgICAgICAgIGliID0gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWEgPSBpO1xyXG4gICAgICAgICAgICBpYiA9IE1hdGgubWluKE1hdGgubWF4KGkgLSAxLCAwKSwgbGFzdCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgYSA9IHRoaXMudmVydGljZXNbaWFdO1xyXG4gICAgICAgICAgYiA9IHRoaXMudmVydGljZXNbaWJdO1xyXG4gICAgICAgICAgdGFyZ2V0IC09IHN1bTtcclxuICAgICAgICAgIGlmICh0aGlzLl9sZW5ndGhzW2ldICE9PSAwKSB7XHJcbiAgICAgICAgICAgIHQgPSB0YXJnZXQgLyB0aGlzLl9sZW5ndGhzW2ldO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN1bSArPSB0aGlzLl9sZW5ndGhzW2ldO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gY29uc29sZS5sb2coc3VtLCBhLmNvbW1hbmQsIGIuY29tbWFuZCk7XHJcblxyXG4gICAgICBpZiAoXy5pc051bGwoYSkgfHwgXy5pc051bGwoYikpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmlnaHQgPSBiLmNvbnRyb2xzICYmIGIuY29udHJvbHMucmlnaHQ7XHJcbiAgICAgIGxlZnQgPSBhLmNvbnRyb2xzICYmIGEuY29udHJvbHMubGVmdDtcclxuXHJcbiAgICAgIHgxID0gYi54O1xyXG4gICAgICB5MSA9IGIueTtcclxuICAgICAgeDIgPSAocmlnaHQgfHwgYikueDtcclxuICAgICAgeTIgPSAocmlnaHQgfHwgYikueTtcclxuICAgICAgeDMgPSAobGVmdCB8fCBhKS54O1xyXG4gICAgICB5MyA9IChsZWZ0IHx8IGEpLnk7XHJcbiAgICAgIHg0ID0gYS54O1xyXG4gICAgICB5NCA9IGEueTtcclxuXHJcbiAgICAgIGlmIChyaWdodCAmJiBiLl9yZWxhdGl2ZSkge1xyXG4gICAgICAgIHgyICs9IGIueDtcclxuICAgICAgICB5MiArPSBiLnk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChsZWZ0ICYmIGEuX3JlbGF0aXZlKSB7XHJcbiAgICAgICAgeDMgKz0gYS54O1xyXG4gICAgICAgIHkzICs9IGEueTtcclxuICAgICAgfVxyXG5cclxuICAgICAgeCA9IFR3by5VdGlscy5nZXRQb2ludE9uQ3ViaWNCZXppZXIodCwgeDEsIHgyLCB4MywgeDQpO1xyXG4gICAgICB5ID0gVHdvLlV0aWxzLmdldFBvaW50T25DdWJpY0Jlemllcih0LCB5MSwgeTIsIHkzLCB5NCk7XHJcblxyXG4gICAgICBpZiAoXy5pc09iamVjdChvYmopKSB7XHJcbiAgICAgICAgb2JqLnggPSB4O1xyXG4gICAgICAgIG9iai55ID0geTtcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbmV3IFR3by5WZWN0b3IoeCwgeSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJhc2VkIG9uIGNsb3NlZCAvIGN1cnZlZCBhbmQgc29ydGluZyBvZiB2ZXJ0aWNlcyBwbG90IHdoZXJlIGFsbCBwb2ludHNcclxuICAgICAqIHNob3VsZCBiZSBhbmQgd2hlcmUgdGhlIHJlc3BlY3RpdmUgaGFuZGxlcyBzaG91bGQgYmUgdG9vLlxyXG4gICAgICovXHJcbiAgICBwbG90OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLmN1cnZlZCkge1xyXG4gICAgICAgIFR3by5VdGlscy5nZXRDdXJ2ZUZyb21Qb2ludHModGhpcy5fdmVydGljZXMsIHRoaXMuY2xvc2VkKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl92ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRoaXMuX3ZlcnRpY2VzW2ldLl9jb21tYW5kID0gaSA9PT0gMCA/IFR3by5Db21tYW5kcy5tb3ZlIDogVHdvLkNvbW1hbmRzLmxpbmU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgc3ViZGl2aWRlOiBmdW5jdGlvbihsaW1pdCkge1xyXG4gICAgICAvL1RPRE86IERSWW5lc3MgKGZ1bmN0aW9uIGJlbG93KVxyXG4gICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgIHZhciBsYXN0ID0gdGhpcy52ZXJ0aWNlcy5sZW5ndGggLSAxO1xyXG4gICAgICB2YXIgYiA9IHRoaXMudmVydGljZXNbbGFzdF07XHJcbiAgICAgIHZhciBjbG9zZWQgPSB0aGlzLl9jbG9zZWQgfHwgdGhpcy52ZXJ0aWNlc1tsYXN0XS5fY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLmNsb3NlO1xyXG4gICAgICB2YXIgcG9pbnRzID0gW107XHJcbiAgICAgIF8uZWFjaCh0aGlzLnZlcnRpY2VzLCBmdW5jdGlvbihhLCBpKSB7XHJcblxyXG4gICAgICAgIGlmIChpIDw9IDAgJiYgIWNsb3NlZCkge1xyXG4gICAgICAgICAgYiA9IGE7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYS5jb21tYW5kID09PSBUd28uQ29tbWFuZHMubW92ZSkge1xyXG4gICAgICAgICAgcG9pbnRzLnB1c2gobmV3IFR3by5BbmNob3IoYi54LCBiLnkpKTtcclxuICAgICAgICAgIGlmIChpID4gMCkge1xyXG4gICAgICAgICAgICBwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdLmNvbW1hbmQgPSBUd28uQ29tbWFuZHMubGluZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGIgPSBhO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHZlcnRzID0gZ2V0U3ViZGl2aXNpb25zKGEsIGIsIGxpbWl0KTtcclxuICAgICAgICBwb2ludHMgPSBwb2ludHMuY29uY2F0KHZlcnRzKTtcclxuXHJcbiAgICAgICAgLy8gQXNzaWduIGNvbW1hbmRzIHRvIGFsbCB0aGUgdmVydHNcclxuICAgICAgICBfLmVhY2godmVydHMsIGZ1bmN0aW9uKHYsIGkpIHtcclxuICAgICAgICAgIGlmIChpIDw9IDAgJiYgYi5jb21tYW5kID09PSBUd28uQ29tbWFuZHMubW92ZSkge1xyXG4gICAgICAgICAgICB2LmNvbW1hbmQgPSBUd28uQ29tbWFuZHMubW92ZTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHYuY29tbWFuZCA9IFR3by5Db21tYW5kcy5saW5lO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoaSA+PSBsYXN0KSB7XHJcblxyXG4gICAgICAgICAgLy8gVE9ETzogQWRkIGNoZWNrIGlmIHRoZSB0d28gdmVjdG9ycyBpbiBxdWVzdGlvbiBhcmUgdGhlIHNhbWUgdmFsdWVzLlxyXG4gICAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZCAmJiB0aGlzLl9hdXRvbWF0aWMpIHtcclxuXHJcbiAgICAgICAgICAgIGIgPSBhO1xyXG5cclxuICAgICAgICAgICAgdmVydHMgPSBnZXRTdWJkaXZpc2lvbnMoYSwgYiwgbGltaXQpO1xyXG4gICAgICAgICAgICBwb2ludHMgPSBwb2ludHMuY29uY2F0KHZlcnRzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFzc2lnbiBjb21tYW5kcyB0byBhbGwgdGhlIHZlcnRzXHJcbiAgICAgICAgICAgIF8uZWFjaCh2ZXJ0cywgZnVuY3Rpb24odiwgaSkge1xyXG4gICAgICAgICAgICAgIGlmIChpIDw9IDAgJiYgYi5jb21tYW5kID09PSBUd28uQ29tbWFuZHMubW92ZSkge1xyXG4gICAgICAgICAgICAgICAgdi5jb21tYW5kID0gVHdvLkNvbW1hbmRzLm1vdmU7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHYuY29tbWFuZCA9IFR3by5Db21tYW5kcy5saW5lO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgfSBlbHNlIGlmIChjbG9zZWQpIHtcclxuICAgICAgICAgICAgcG9pbnRzLnB1c2gobmV3IFR3by5BbmNob3IoYS54LCBhLnkpKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdLmNvbW1hbmQgPSBjbG9zZWQgPyBUd28uQ29tbWFuZHMuY2xvc2UgOiBUd28uQ29tbWFuZHMubGluZTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBiID0gYTtcclxuXHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgdGhpcy5fYXV0b21hdGljID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuX2N1cnZlZCA9IGZhbHNlO1xyXG4gICAgICB0aGlzLnZlcnRpY2VzID0gcG9pbnRzO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBfdXBkYXRlTGVuZ3RoOiBmdW5jdGlvbihsaW1pdCkge1xyXG4gICAgICAvL1RPRE86IERSWW5lc3MgKGZ1bmN0aW9uIGFib3ZlKVxyXG4gICAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICAgIHZhciBsZW5ndGggPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDtcclxuICAgICAgdmFyIGxhc3QgPSBsZW5ndGggLSAxO1xyXG4gICAgICB2YXIgYiA9IHRoaXMudmVydGljZXNbbGFzdF07XHJcbiAgICAgIHZhciBjbG9zZWQgPSB0aGlzLl9jbG9zZWQgfHwgdGhpcy52ZXJ0aWNlc1tsYXN0XS5fY29tbWFuZCA9PT0gVHdvLkNvbW1hbmRzLmNsb3NlO1xyXG4gICAgICB2YXIgc3VtID0gMDtcclxuXHJcbiAgICAgIGlmIChfLmlzVW5kZWZpbmVkKHRoaXMuX2xlbmd0aHMpKSB7XHJcbiAgICAgICAgdGhpcy5fbGVuZ3RocyA9IFtdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBfLmVhY2godGhpcy52ZXJ0aWNlcywgZnVuY3Rpb24oYSwgaSkge1xyXG5cclxuICAgICAgICBpZiAoKGkgPD0gMCAmJiAhY2xvc2VkKSB8fCBhLmNvbW1hbmQgPT09IFR3by5Db21tYW5kcy5tb3ZlKSB7XHJcbiAgICAgICAgICBiID0gYTtcclxuICAgICAgICAgIHRoaXMuX2xlbmd0aHNbaV0gPSAwO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fbGVuZ3Roc1tpXSA9IGdldEN1cnZlTGVuZ3RoKGEsIGIsIGxpbWl0KTtcclxuICAgICAgICBzdW0gKz0gdGhpcy5fbGVuZ3Roc1tpXTtcclxuXHJcbiAgICAgICAgaWYgKGkgPj0gbGFzdCAmJiBjbG9zZWQpIHtcclxuXHJcbiAgICAgICAgICBiID0gdGhpcy52ZXJ0aWNlc1soaSArIDEpICUgbGVuZ3RoXTtcclxuXHJcbiAgICAgICAgICB0aGlzLl9sZW5ndGhzW2kgKyAxXSA9IGdldEN1cnZlTGVuZ3RoKGEsIGIsIGxpbWl0KTtcclxuICAgICAgICAgIHN1bSArPSB0aGlzLl9sZW5ndGhzW2kgKyAxXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBiID0gYTtcclxuXHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgdGhpcy5fbGVuZ3RoID0gc3VtO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnVmVydGljZXMpIHtcclxuXHJcbiAgICAgICAgdmFyIGwgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDtcclxuICAgICAgICB2YXIgbGFzdCA9IGwgLSAxLCB2O1xyXG5cclxuICAgICAgICAvLyBUT0RPOiBTaG91bGQgY2xhbXAgdGhpcyBzbyB0aGF0IGBpYWAgYW5kIGBpYmBcclxuICAgICAgICAvLyBjYW5ub3Qgc2VsZWN0IG5vbi12ZXJ0cy5cclxuICAgICAgICB2YXIgaWEgPSByb3VuZCgodGhpcy5fYmVnaW5uaW5nKSAqIGxhc3QpO1xyXG4gICAgICAgIHZhciBpYiA9IHJvdW5kKCh0aGlzLl9lbmRpbmcpICogbGFzdCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3ZlcnRpY2VzLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSBpYTsgaSA8IGliICsgMTsgaSsrKSB7XHJcbiAgICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1tpXTtcclxuICAgICAgICAgIHRoaXMuX3ZlcnRpY2VzLnB1c2godik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5fYXV0b21hdGljKSB7XHJcbiAgICAgICAgICB0aGlzLnBsb3QoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBUd28uU2hhcGUucHJvdG90eXBlLl91cGRhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdWZXJ0aWNlcyA9ICB0aGlzLl9mbGFnRmlsbCA9ICB0aGlzLl9mbGFnU3Ryb2tlID1cclxuICAgICAgICAgdGhpcy5fZmxhZ0xpbmV3aWR0aCA9IHRoaXMuX2ZsYWdPcGFjaXR5ID0gdGhpcy5fZmxhZ1Zpc2libGUgPVxyXG4gICAgICAgICB0aGlzLl9mbGFnQ2FwID0gdGhpcy5fZmxhZ0pvaW4gPSB0aGlzLl9mbGFnTWl0ZXIgPVxyXG4gICAgICAgICB0aGlzLl9mbGFnQ2xpcCA9IGZhbHNlO1xyXG5cclxuICAgICAgVHdvLlNoYXBlLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFBhdGguTWFrZU9ic2VydmFibGUoUGF0aC5wcm90b3R5cGUpO1xyXG5cclxuICAvKipcclxuICAgKiBVdGlsaXR5IGZ1bmN0aW9uc1xyXG4gICAqL1xyXG5cclxuICBmdW5jdGlvbiBnZXRDdXJ2ZUxlbmd0aChhLCBiLCBsaW1pdCkge1xyXG4gICAgLy8gVE9ETzogRFJZbmVzc1xyXG4gICAgdmFyIHgxLCB4MiwgeDMsIHg0LCB5MSwgeTIsIHkzLCB5NDtcclxuXHJcbiAgICB2YXIgcmlnaHQgPSBiLmNvbnRyb2xzICYmIGIuY29udHJvbHMucmlnaHQ7XHJcbiAgICB2YXIgbGVmdCA9IGEuY29udHJvbHMgJiYgYS5jb250cm9scy5sZWZ0O1xyXG5cclxuICAgIHgxID0gYi54O1xyXG4gICAgeTEgPSBiLnk7XHJcbiAgICB4MiA9IChyaWdodCB8fCBiKS54O1xyXG4gICAgeTIgPSAocmlnaHQgfHwgYikueTtcclxuICAgIHgzID0gKGxlZnQgfHwgYSkueDtcclxuICAgIHkzID0gKGxlZnQgfHwgYSkueTtcclxuICAgIHg0ID0gYS54O1xyXG4gICAgeTQgPSBhLnk7XHJcblxyXG4gICAgaWYgKHJpZ2h0ICYmIGIuX3JlbGF0aXZlKSB7XHJcbiAgICAgIHgyICs9IGIueDtcclxuICAgICAgeTIgKz0gYi55O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChsZWZ0ICYmIGEuX3JlbGF0aXZlKSB7XHJcbiAgICAgIHgzICs9IGEueDtcclxuICAgICAgeTMgKz0gYS55O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBUd28uVXRpbHMuZ2V0Q3VydmVMZW5ndGgoeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCBsaW1pdCk7XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2V0U3ViZGl2aXNpb25zKGEsIGIsIGxpbWl0KSB7XHJcbiAgICAvLyBUT0RPOiBEUlluZXNzXHJcbiAgICB2YXIgeDEsIHgyLCB4MywgeDQsIHkxLCB5MiwgeTMsIHk0O1xyXG5cclxuICAgIHZhciByaWdodCA9IGIuY29udHJvbHMgJiYgYi5jb250cm9scy5yaWdodDtcclxuICAgIHZhciBsZWZ0ID0gYS5jb250cm9scyAmJiBhLmNvbnRyb2xzLmxlZnQ7XHJcblxyXG4gICAgeDEgPSBiLng7XHJcbiAgICB5MSA9IGIueTtcclxuICAgIHgyID0gKHJpZ2h0IHx8IGIpLng7XHJcbiAgICB5MiA9IChyaWdodCB8fCBiKS55O1xyXG4gICAgeDMgPSAobGVmdCB8fCBhKS54O1xyXG4gICAgeTMgPSAobGVmdCB8fCBhKS55O1xyXG4gICAgeDQgPSBhLng7XHJcbiAgICB5NCA9IGEueTtcclxuXHJcbiAgICBpZiAocmlnaHQgJiYgYi5fcmVsYXRpdmUpIHtcclxuICAgICAgeDIgKz0gYi54O1xyXG4gICAgICB5MiArPSBiLnk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGxlZnQgJiYgYS5fcmVsYXRpdmUpIHtcclxuICAgICAgeDMgKz0gYS54O1xyXG4gICAgICB5MyArPSBhLnk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFR3by5VdGlscy5zdWJkaXZpZGUoeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0LCBsaW1pdCk7XHJcblxyXG4gIH1cclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGg7XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBMaW5lID0gVHdvLkxpbmUgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xyXG5cclxuICAgIHZhciB3aWR0aCA9IHgyIC0geDE7XHJcbiAgICB2YXIgaGVpZ2h0ID0geTIgLSB5MTtcclxuXHJcbiAgICB2YXIgdzIgPSB3aWR0aCAvIDI7XHJcbiAgICB2YXIgaDIgPSBoZWlnaHQgLyAyO1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBbXHJcbiAgICAgICAgbmV3IFR3by5BbmNob3IoLSB3MiwgLSBoMiksXHJcbiAgICAgICAgbmV3IFR3by5BbmNob3IodzIsIGgyKVxyXG4gICAgXSk7XHJcblxyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQoeDEgKyB3MiwgeTEgKyBoMik7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKExpbmUucHJvdG90eXBlLCBQYXRoLnByb3RvdHlwZSk7XHJcblxyXG4gIFBhdGguTWFrZU9ic2VydmFibGUoTGluZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aDtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFJlY3RhbmdsZSA9IFR3by5SZWN0YW5nbGUgPSBmdW5jdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIFtcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKSxcclxuICAgICAgbmV3IFR3by5BbmNob3IoKVxyXG4gICAgXSwgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuXHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldCh4LCB5KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoUmVjdGFuZ2xlLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogWyd3aWR0aCcsICdoZWlnaHQnXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIFBhdGguTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKFJlY3RhbmdsZS5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChSZWN0YW5nbGUucHJvdG90eXBlLCBQYXRoLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF93aWR0aDogMCxcclxuICAgIF9oZWlnaHQ6IDAsXHJcblxyXG4gICAgX2ZsYWdXaWR0aDogMCxcclxuICAgIF9mbGFnSGVpZ2h0OiAwLFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdXaWR0aCB8fCB0aGlzLl9mbGFnSGVpZ2h0KSB7XHJcblxyXG4gICAgICAgIHZhciB4ciA9IHRoaXMuX3dpZHRoIC8gMjtcclxuICAgICAgICB2YXIgeXIgPSB0aGlzLl9oZWlnaHQgLyAyO1xyXG5cclxuICAgICAgICB0aGlzLnZlcnRpY2VzWzBdLnNldCgteHIsIC15cik7XHJcbiAgICAgICAgdGhpcy52ZXJ0aWNlc1sxXS5zZXQoeHIsIC15cik7XHJcbiAgICAgICAgdGhpcy52ZXJ0aWNlc1syXS5zZXQoeHIsIHlyKTtcclxuICAgICAgICB0aGlzLnZlcnRpY2VzWzNdLnNldCgteHIsIHlyKTtcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdXaWR0aCA9IHRoaXMuX2ZsYWdIZWlnaHQgPSBmYWxzZTtcclxuICAgICAgUGF0aC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBSZWN0YW5nbGUuTWFrZU9ic2VydmFibGUoUmVjdGFuZ2xlLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoLCBUV09fUEkgPSBNYXRoLlBJICogMiwgY29zID0gTWF0aC5jb3MsIHNpbiA9IE1hdGguc2luO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgRWxsaXBzZSA9IFR3by5FbGxpcHNlID0gZnVuY3Rpb24ob3gsIG95LCByeCwgcnkpIHtcclxuXHJcbiAgICBpZiAoIV8uaXNOdW1iZXIocnkpKSB7XHJcbiAgICAgIHJ5ID0gcng7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFtb3VudCA9IFR3by5SZXNvbHV0aW9uO1xyXG5cclxuICAgIHZhciBwb2ludHMgPSBfLm1hcChfLnJhbmdlKGFtb3VudCksIGZ1bmN0aW9uKGkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd28uQW5jaG9yKCk7XHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgcG9pbnRzLCB0cnVlLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLndpZHRoID0gcnggKiAyO1xyXG4gICAgdGhpcy5oZWlnaHQgPSByeSAqIDI7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldChveCwgb3kpO1xyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChFbGxpcHNlLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogWyd3aWR0aCcsICdoZWlnaHQnXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICBQYXRoLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChFbGxpcHNlLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChFbGxpcHNlLnByb3RvdHlwZSwgUGF0aC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfd2lkdGg6IDAsXHJcbiAgICBfaGVpZ2h0OiAwLFxyXG5cclxuICAgIF9mbGFnV2lkdGg6IGZhbHNlLFxyXG4gICAgX2ZsYWdIZWlnaHQ6IGZhbHNlLFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdXaWR0aCB8fCB0aGlzLl9mbGFnSGVpZ2h0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgdmFyIHBjdCA9IGkgLyBsO1xyXG4gICAgICAgICAgdmFyIHRoZXRhID0gcGN0ICogVFdPX1BJO1xyXG4gICAgICAgICAgdmFyIHggPSB0aGlzLl93aWR0aCAqIGNvcyh0aGV0YSkgLyAyO1xyXG4gICAgICAgICAgdmFyIHkgPSB0aGlzLl9oZWlnaHQgKiBzaW4odGhldGEpIC8gMjtcclxuICAgICAgICAgIHRoaXMudmVydGljZXNbaV0uc2V0KHgsIHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgUGF0aC5wcm90b3R5cGUuX3VwZGF0ZS5jYWxsKHRoaXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnV2lkdGggPSB0aGlzLl9mbGFnSGVpZ2h0ID0gZmFsc2U7XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgRWxsaXBzZS5NYWtlT2JzZXJ2YWJsZShFbGxpcHNlLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoLCBUV09fUEkgPSBNYXRoLlBJICogMiwgY29zID0gTWF0aC5jb3MsIHNpbiA9IE1hdGguc2luO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgQ2lyY2xlID0gVHdvLkNpcmNsZSA9IGZ1bmN0aW9uKG94LCBveSwgcikge1xyXG5cclxuICAgIHZhciBhbW91bnQgPSBUd28uUmVzb2x1dGlvbjtcclxuXHJcbiAgICB2YXIgcG9pbnRzID0gXy5tYXAoXy5yYW5nZShhbW91bnQpLCBmdW5jdGlvbihpKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdvLkFuY2hvcigpO1xyXG4gICAgfSwgdGhpcyk7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIHBvaW50cywgdHJ1ZSwgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5yYWRpdXMgPSByO1xyXG5cclxuICAgIHRoaXMuX3VwZGF0ZSgpO1xyXG4gICAgdGhpcy50cmFuc2xhdGlvbi5zZXQob3gsIG95KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoQ2lyY2xlLCB7XHJcblxyXG4gICAgUHJvcGVydGllczogWydyYWRpdXMnXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICBQYXRoLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChDaXJjbGUuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKENpcmNsZS5wcm90b3R5cGUsIFBhdGgucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX3JhZGl1czogMCxcclxuICAgIF9mbGFnUmFkaXVzOiBmYWxzZSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnUmFkaXVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgdmFyIHBjdCA9IGkgLyBsO1xyXG4gICAgICAgICAgdmFyIHRoZXRhID0gcGN0ICogVFdPX1BJO1xyXG4gICAgICAgICAgdmFyIHggPSB0aGlzLl9yYWRpdXMgKiBjb3ModGhldGEpO1xyXG4gICAgICAgICAgdmFyIHkgPSB0aGlzLl9yYWRpdXMgKiBzaW4odGhldGEpO1xyXG4gICAgICAgICAgdGhpcy52ZXJ0aWNlc1tpXS5zZXQoeCwgeSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdSYWRpdXMgPSBmYWxzZTtcclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBDaXJjbGUuTWFrZU9ic2VydmFibGUoQ2lyY2xlLnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoLCBUV09fUEkgPSBNYXRoLlBJICogMiwgY29zID0gTWF0aC5jb3MsIHNpbiA9IE1hdGguc2luO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgUG9seWdvbiA9IFR3by5Qb2x5Z29uID0gZnVuY3Rpb24ob3gsIG95LCByLCBzaWRlcykge1xyXG5cclxuICAgIHNpZGVzID0gTWF0aC5tYXgoc2lkZXMgfHwgMCwgMyk7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IF8ubWFwKF8ucmFuZ2Uoc2lkZXMpLCBmdW5jdGlvbihpKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVHdvLkFuY2hvcigpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgUGF0aC5jYWxsKHRoaXMsIHBvaW50cywgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy53aWR0aCA9IHIgKiAyO1xyXG4gICAgdGhpcy5oZWlnaHQgPSByICogMjtcclxuICAgIHRoaXMuc2lkZXMgPSBzaWRlcztcclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KG94LCBveSk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFBvbHlnb24sIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbJ3dpZHRoJywgJ2hlaWdodCcsICdzaWRlcyddLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgIFBhdGguTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKFBvbHlnb24uUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFBvbHlnb24ucHJvdG90eXBlLCBQYXRoLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF93aWR0aDogMCxcclxuICAgIF9oZWlnaHQ6IDAsXHJcbiAgICBfc2lkZXM6IDAsXHJcblxyXG4gICAgX2ZsYWdXaWR0aDogZmFsc2UsXHJcbiAgICBfZmxhZ0hlaWdodDogZmFsc2UsXHJcbiAgICBfZmxhZ1NpZGVzOiBmYWxzZSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnV2lkdGggfHwgdGhpcy5fZmxhZ0hlaWdodCB8fCB0aGlzLl9mbGFnU2lkZXMpIHtcclxuXHJcbiAgICAgICAgdmFyIHNpZGVzID0gdGhpcy5fc2lkZXM7XHJcbiAgICAgICAgdmFyIGFtb3VudCA9IHRoaXMudmVydGljZXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoYW1vdW50ID4gc2lkZXMpIHtcclxuICAgICAgICAgIHRoaXMudmVydGljZXMuc3BsaWNlKHNpZGVzIC0gMSwgYW1vdW50IC0gc2lkZXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaWRlczsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHBjdCA9IChpICsgMC41KSAvIHNpZGVzO1xyXG4gICAgICAgICAgdmFyIHRoZXRhID0gVFdPX1BJICogcGN0ICsgTWF0aC5QSSAvIDI7XHJcbiAgICAgICAgICB2YXIgeCA9IHRoaXMuX3dpZHRoICogY29zKHRoZXRhKTtcclxuICAgICAgICAgIHZhciB5ID0gdGhpcy5faGVpZ2h0ICogc2luKHRoZXRhKTtcclxuXHJcbiAgICAgICAgICBpZiAoaSA+PSBhbW91bnQpIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNlcy5wdXNoKG5ldyBUd28uQW5jaG9yKHgsIHkpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGljZXNbaV0uc2V0KHgsIHkpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdXaWR0aCA9IHRoaXMuX2ZsYWdIZWlnaHQgPSB0aGlzLl9mbGFnU2lkZXMgPSBmYWxzZTtcclxuICAgICAgUGF0aC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBQb2x5Z29uLk1ha2VPYnNlcnZhYmxlKFBvbHlnb24ucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBQYXRoID0gVHdvLlBhdGgsIFBJID0gTWF0aC5QSSwgVFdPX1BJID0gTWF0aC5QSSAqIDIsIEhBTEZfUEkgPSBNYXRoLlBJIC8gMixcclxuICAgIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbiwgYWJzID0gTWF0aC5hYnMsIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBBcmNTZWdtZW50ID0gVHdvLkFyY1NlZ21lbnQgPSBmdW5jdGlvbihveCwgb3ksIGlyLCBvciwgc2EsIGVhLCByZXMpIHtcclxuXHJcbiAgICB2YXIgcG9pbnRzID0gXy5tYXAoXy5yYW5nZShyZXMgfHwgKFR3by5SZXNvbHV0aW9uICogMykpLCBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIG5ldyBUd28uQW5jaG9yKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgcG9pbnRzLCBmYWxzZSwgZmFsc2UsIHRydWUpO1xyXG5cclxuICAgIHRoaXMuaW5uZXJSYWRpdXMgPSBpcjtcclxuICAgIHRoaXMub3V0ZXJSYWRpdXMgPSBvcjtcclxuXHJcbiAgICB0aGlzLnN0YXJ0QW5nbGUgPSBzYTtcclxuICAgIHRoaXMuZW5kQW5nbGUgPSBlYTtcclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KG94LCBveSk7XHJcblxyXG4gIH1cclxuXHJcbiAgXy5leHRlbmQoQXJjU2VnbWVudCwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFsnc3RhcnRBbmdsZScsICdlbmRBbmdsZScsICdpbm5lclJhZGl1cycsICdvdXRlclJhZGl1cyddLFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgIFBhdGguTWFrZU9ic2VydmFibGUob2JqKTtcclxuICAgICAgXy5lYWNoKEFyY1NlZ21lbnQuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKEFyY1NlZ21lbnQucHJvdG90eXBlLCBQYXRoLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF9mbGFnU3RhcnRBbmdsZTogZmFsc2UsXHJcbiAgICBfZmxhZ0VuZEFuZ2xlOiBmYWxzZSxcclxuICAgIF9mbGFnSW5uZXJSYWRpdXM6IGZhbHNlLFxyXG4gICAgX2ZsYWdPdXRlclJhZGl1czogZmFsc2UsXHJcblxyXG4gICAgX3N0YXJ0QW5nbGU6IDAsXHJcbiAgICBfZW5kQW5nbGU6IFRXT19QSSxcclxuICAgIF9pbm5lclJhZGl1czogMCxcclxuICAgIF9vdXRlclJhZGl1czogMCxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnU3RhcnRBbmdsZSB8fCB0aGlzLl9mbGFnRW5kQW5nbGUgfHwgdGhpcy5fZmxhZ0lubmVyUmFkaXVzXHJcbiAgICAgICAgfHwgdGhpcy5fZmxhZ091dGVyUmFkaXVzKSB7XHJcblxyXG4gICAgICAgIHZhciBzYSA9IHRoaXMuX3N0YXJ0QW5nbGU7XHJcbiAgICAgICAgdmFyIGVhID0gdGhpcy5fZW5kQW5nbGU7XHJcblxyXG4gICAgICAgIHZhciBpciA9IHRoaXMuX2lubmVyUmFkaXVzO1xyXG4gICAgICAgIHZhciBvciA9IHRoaXMuX291dGVyUmFkaXVzO1xyXG5cclxuICAgICAgICB2YXIgY29ubmVjdGVkID0gbW9kKHNhLCBUV09fUEkpID09PSBtb2QoZWEsIFRXT19QSSk7XHJcbiAgICAgICAgdmFyIHB1bmN0dXJlZCA9IGlyID4gMDtcclxuXHJcbiAgICAgICAgdmFyIHZlcnRpY2VzID0gdGhpcy52ZXJ0aWNlcztcclxuICAgICAgICB2YXIgbGVuZ3RoID0gKHB1bmN0dXJlZCA/IHZlcnRpY2VzLmxlbmd0aCAvIDIgOiB2ZXJ0aWNlcy5sZW5ndGgpO1xyXG4gICAgICAgIHZhciBjb21tYW5kLCBpZCA9IDA7XHJcblxyXG4gICAgICAgIGlmIChjb25uZWN0ZWQpIHtcclxuICAgICAgICAgIGxlbmd0aC0tO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXB1bmN0dXJlZCkge1xyXG4gICAgICAgICAgbGVuZ3RoIC09IDI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBPdXRlciBDaXJjbGVcclxuICAgICAgICAgKi9cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGFzdCA9IGxlbmd0aCAtIDE7IGkgPCBsZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgIHZhciBwY3QgPSBpIC8gbGFzdDtcclxuICAgICAgICAgIHZhciB2ID0gdmVydGljZXNbaWRdO1xyXG4gICAgICAgICAgdmFyIHRoZXRhID0gcGN0ICogKGVhIC0gc2EpICsgc2E7XHJcbiAgICAgICAgICB2YXIgc3RlcCA9IChlYSAtIHNhKSAvIGxlbmd0aDtcclxuXHJcbiAgICAgICAgICB2YXIgeCA9IG9yICogTWF0aC5jb3ModGhldGEpO1xyXG4gICAgICAgICAgdmFyIHkgPSBvciAqIE1hdGguc2luKHRoZXRhKTtcclxuXHJcbiAgICAgICAgICBzd2l0Y2ggKGkpIHtcclxuICAgICAgICAgICAgY2FzZSAwOlxyXG4gICAgICAgICAgICAgIGNvbW1hbmQgPSBUd28uQ29tbWFuZHMubW92ZTtcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICBjb21tYW5kID0gVHdvLkNvbW1hbmRzLmN1cnZlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHYuY29tbWFuZCA9IGNvbW1hbmQ7XHJcbiAgICAgICAgICB2LnggPSB4O1xyXG4gICAgICAgICAgdi55ID0geTtcclxuICAgICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG4gICAgICAgICAgdi5jb250cm9scy5yaWdodC5jbGVhcigpO1xyXG5cclxuICAgICAgICAgIGlmICh2LmNvbW1hbmQgPT09IFR3by5Db21tYW5kcy5jdXJ2ZSkge1xyXG4gICAgICAgICAgICB2YXIgYW1wID0gb3IgKiBzdGVwIC8gTWF0aC5QSTtcclxuICAgICAgICAgICAgdi5jb250cm9scy5sZWZ0LnggPSBhbXAgKiBNYXRoLmNvcyh0aGV0YSAtIEhBTEZfUEkpO1xyXG4gICAgICAgICAgICB2LmNvbnRyb2xzLmxlZnQueSA9IGFtcCAqIE1hdGguc2luKHRoZXRhIC0gSEFMRl9QSSk7XHJcbiAgICAgICAgICAgIHYuY29udHJvbHMucmlnaHQueCA9IGFtcCAqIE1hdGguY29zKHRoZXRhICsgSEFMRl9QSSk7XHJcbiAgICAgICAgICAgIHYuY29udHJvbHMucmlnaHQueSA9IGFtcCAqIE1hdGguc2luKHRoZXRhICsgSEFMRl9QSSk7XHJcbiAgICAgICAgICAgIGlmIChpID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgdi5jb250cm9scy5sZWZ0Lm11bHRpcGx5U2NhbGFyKDIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpID09PSBsYXN0KSB7XHJcbiAgICAgICAgICAgICAgdi5jb250cm9scy5yaWdodC5tdWx0aXBseVNjYWxhcigyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlkKys7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHB1bmN0dXJlZCkge1xyXG5cclxuICAgICAgICAgIGlmIChjb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgdmVydGljZXNbaWRdLmNvbW1hbmQgPSBUd28uQ29tbWFuZHMuY2xvc2U7XHJcbiAgICAgICAgICAgIGlkKys7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZW5ndGgtLTtcclxuICAgICAgICAgICAgbGFzdCA9IGxlbmd0aCAtIDE7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgKiBJbm5lciBDaXJjbGVcclxuICAgICAgICAgICAqL1xyXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICBwY3QgPSBpIC8gbGFzdDtcclxuICAgICAgICAgICAgdiA9IHZlcnRpY2VzW2lkXTtcclxuICAgICAgICAgICAgdGhldGEgPSAoMSAtIHBjdCkgKiAoZWEgLSBzYSkgKyBzYTtcclxuICAgICAgICAgICAgc3RlcCA9IChlYSAtIHNhKSAvIGxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIHggPSBpciAqIE1hdGguY29zKHRoZXRhKTtcclxuICAgICAgICAgICAgeSA9IGlyICogTWF0aC5zaW4odGhldGEpO1xyXG4gICAgICAgICAgICBjb21tYW5kID0gVHdvLkNvbW1hbmRzLmN1cnZlO1xyXG4gICAgICAgICAgICBpZiAoaSA8PSAwKSB7XHJcbiAgICAgICAgICAgICAgY29tbWFuZCA9IGNvbm5lY3RlZCA/IFR3by5Db21tYW5kcy5tb3ZlIDogVHdvLkNvbW1hbmRzLmxpbmU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHYuY29tbWFuZCA9IGNvbW1hbmQ7XHJcbiAgICAgICAgICAgIHYueCA9IHg7XHJcbiAgICAgICAgICAgIHYueSA9IHk7XHJcbiAgICAgICAgICAgIHYuY29udHJvbHMubGVmdC5jbGVhcigpO1xyXG4gICAgICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodi5jb21tYW5kID09PSBUd28uQ29tbWFuZHMuY3VydmUpIHtcclxuICAgICAgICAgICAgICBhbXAgPSBpciAqIHN0ZXAgLyBNYXRoLlBJO1xyXG4gICAgICAgICAgICAgIHYuY29udHJvbHMubGVmdC54ID0gYW1wICogTWF0aC5jb3ModGhldGEgKyBIQUxGX1BJKTtcclxuICAgICAgICAgICAgICB2LmNvbnRyb2xzLmxlZnQueSA9IGFtcCAqIE1hdGguc2luKHRoZXRhICsgSEFMRl9QSSk7XHJcbiAgICAgICAgICAgICAgdi5jb250cm9scy5yaWdodC54ID0gYW1wICogTWF0aC5jb3ModGhldGEgLSBIQUxGX1BJKTtcclxuICAgICAgICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnkgPSBhbXAgKiBNYXRoLnNpbih0aGV0YSAtIEhBTEZfUEkpO1xyXG4gICAgICAgICAgICAgIGlmIChpID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB2LmNvbnRyb2xzLmxlZnQubXVsdGlwbHlTY2FsYXIoMik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChpID09PSBsYXN0KSB7XHJcbiAgICAgICAgICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0Lm11bHRpcGx5U2NhbGFyKDIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWQrKztcclxuXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoIWNvbm5lY3RlZCkge1xyXG5cclxuICAgICAgICAgIHZlcnRpY2VzW2lkXS5jb21tYW5kID0gVHdvLkNvbW1hbmRzLmxpbmU7XHJcbiAgICAgICAgICB2ZXJ0aWNlc1tpZF0ueCA9IDA7XHJcbiAgICAgICAgICB2ZXJ0aWNlc1tpZF0ueSA9IDA7XHJcbiAgICAgICAgICBpZCsrO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEZpbmFsIFBvaW50XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmVydGljZXNbaWRdLmNvbW1hbmQgPSBUd28uQ29tbWFuZHMuY2xvc2U7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdTdGFydEFuZ2xlID0gdGhpcy5fZmxhZ0VuZEFuZ2xlXHJcbiAgICAgICAgPSB0aGlzLl9mbGFnSW5uZXJSYWRpdXMgPSB0aGlzLl9mbGFnT3V0ZXJSYWRpdXMgPSBmYWxzZTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIEFyY1NlZ21lbnQuTWFrZU9ic2VydmFibGUoQXJjU2VnbWVudC5wcm90b3R5cGUpO1xyXG5cclxuICBmdW5jdGlvbiBtb2QodiwgbCkge1xyXG4gICAgd2hpbGUgKHYgPCAwKSB7XHJcbiAgICAgIHYgKz0gbDtcclxuICAgIH1cclxuICAgIHJldHVybiB2ICUgbDtcclxuICB9XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgUGF0aCA9IFR3by5QYXRoLCBUV09fUEkgPSBNYXRoLlBJICogMiwgY29zID0gTWF0aC5jb3MsIHNpbiA9IE1hdGguc2luO1xyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgU3RhciA9IFR3by5TdGFyID0gZnVuY3Rpb24ob3gsIG95LCBvciwgaXIsIHNpZGVzKSB7XHJcblxyXG4gICAgaWYgKCFfLmlzTnVtYmVyKGlyKSkge1xyXG4gICAgICBpciA9IG9yIC8gMjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIV8uaXNOdW1iZXIoc2lkZXMpIHx8IHNpZGVzIDw9IDApIHtcclxuICAgICAgc2lkZXMgPSA1O1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBsZW5ndGggPSBzaWRlcyAqIDI7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IF8ubWFwKF8ucmFuZ2UobGVuZ3RoKSwgZnVuY3Rpb24oaSkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3by5BbmNob3IoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBwb2ludHMsIHRydWUpO1xyXG5cclxuICAgIHRoaXMuaW5uZXJSYWRpdXMgPSBpcjtcclxuICAgIHRoaXMub3V0ZXJSYWRpdXMgPSBvcjtcclxuICAgIHRoaXMuc2lkZXMgPSBzaWRlcztcclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KG94LCBveSk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFN0YXIsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbJ2lubmVyUmFkaXVzJywgJ291dGVyUmFkaXVzJywgJ3NpZGVzJ10sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgUGF0aC5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goU3Rhci5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoU3Rhci5wcm90b3R5cGUsIFBhdGgucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX2lubmVyUmFkaXVzOiAwLFxyXG4gICAgX291dGVyUmFkaXVzOiAwLFxyXG4gICAgX3NpZGVzOiAwLFxyXG5cclxuICAgIF9mbGFnSW5uZXJSYWRpdXM6IGZhbHNlLFxyXG4gICAgX2ZsYWdPdXRlclJhZGl1czogZmFsc2UsXHJcbiAgICBfZmxhZ1NpZGVzOiBmYWxzZSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnSW5uZXJSYWRpdXMgfHwgdGhpcy5fZmxhZ091dGVyUmFkaXVzIHx8IHRoaXMuX2ZsYWdTaWRlcykge1xyXG5cclxuICAgICAgICB2YXIgc2lkZXMgPSB0aGlzLl9zaWRlcyAqIDI7XHJcbiAgICAgICAgdmFyIGFtb3VudCA9IHRoaXMudmVydGljZXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoYW1vdW50ID4gc2lkZXMpIHtcclxuICAgICAgICAgIHRoaXMudmVydGljZXMuc3BsaWNlKHNpZGVzIC0gMSwgYW1vdW50IC0gc2lkZXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaWRlczsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHBjdCA9IChpICsgMC41KSAvIHNpZGVzO1xyXG4gICAgICAgICAgdmFyIHRoZXRhID0gVFdPX1BJICogcGN0O1xyXG4gICAgICAgICAgdmFyIHIgPSAoaSAlIDIgPyB0aGlzLl9pbm5lclJhZGl1cyA6IHRoaXMuX291dGVyUmFkaXVzKTtcclxuICAgICAgICAgIHZhciB4ID0gciAqIGNvcyh0aGV0YSk7XHJcbiAgICAgICAgICB2YXIgeSA9IHIgKiBzaW4odGhldGEpO1xyXG5cclxuICAgICAgICAgIGlmIChpID49IGFtb3VudCkge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2VzLnB1c2gobmV3IFR3by5BbmNob3IoeCwgeSkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNlc1tpXS5zZXQoeCwgeSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIFBhdGgucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdJbm5lclJhZGl1cyA9IHRoaXMuX2ZsYWdPdXRlclJhZGl1cyA9IHRoaXMuX2ZsYWdTaWRlcyA9IGZhbHNlO1xyXG4gICAgICBQYXRoLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFN0YXIuTWFrZU9ic2VydmFibGUoU3Rhci5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIFBhdGggPSBUd28uUGF0aDtcclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFJvdW5kZWRSZWN0YW5nbGUgPSBUd28uUm91bmRlZFJlY3RhbmdsZSA9IGZ1bmN0aW9uKG94LCBveSwgd2lkdGgsIGhlaWdodCwgcmFkaXVzKSB7XHJcblxyXG4gICAgaWYgKCFfLmlzTnVtYmVyKHJhZGl1cykpIHtcclxuICAgICAgcmFkaXVzID0gTWF0aC5mbG9vcihNYXRoLm1pbih3aWR0aCwgaGVpZ2h0KSAvIDEyKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYW1vdW50ID0gMTA7XHJcblxyXG4gICAgdmFyIHBvaW50cyA9IF8ubWFwKF8ucmFuZ2UoYW1vdW50KSwgZnVuY3Rpb24oaSkge1xyXG4gICAgICByZXR1cm4gbmV3IFR3by5BbmNob3IoMCwgMCwgMCwgMCwgMCwgMCxcclxuICAgICAgICBpID09PSAwID8gVHdvLkNvbW1hbmRzLm1vdmUgOiBUd28uQ29tbWFuZHMuY3VydmUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXS5jb21tYW5kID0gVHdvLkNvbW1hbmRzLmNsb3NlO1xyXG5cclxuICAgIFBhdGguY2FsbCh0aGlzLCBwb2ludHMsIGZhbHNlLCBmYWxzZSwgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1cztcclxuXHJcbiAgICB0aGlzLl91cGRhdGUoKTtcclxuICAgIHRoaXMudHJhbnNsYXRpb24uc2V0KG94LCBveSk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFJvdW5kZWRSZWN0YW5nbGUsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbJ3dpZHRoJywgJ2hlaWdodCcsICdyYWRpdXMnXSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqKSB7XHJcblxyXG4gICAgICBQYXRoLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChSb3VuZGVkUmVjdGFuZ2xlLlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqKTtcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBfLmV4dGVuZChSb3VuZGVkUmVjdGFuZ2xlLnByb3RvdHlwZSwgUGF0aC5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfd2lkdGg6IDAsXHJcbiAgICBfaGVpZ2h0OiAwLFxyXG4gICAgX3JhZGl1czogMCxcclxuXHJcbiAgICBfZmxhZ1dpZHRoOiBmYWxzZSxcclxuICAgIF9mbGFnSGVpZ2h0OiBmYWxzZSxcclxuICAgIF9mbGFnUmFkaXVzOiBmYWxzZSxcclxuXHJcbiAgICBfdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnV2lkdGggfHwgdGhpcy5fZmxhZ0hlaWdodCB8fCB0aGlzLl9mbGFnUmFkaXVzKSB7XHJcblxyXG4gICAgICAgIHZhciB3aWR0aCA9IHRoaXMuX3dpZHRoO1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSB0aGlzLl9oZWlnaHQ7XHJcbiAgICAgICAgdmFyIHJhZGl1cyA9IE1hdGgubWluKE1hdGgubWF4KHRoaXMuX3JhZGl1cywgMCksXHJcbiAgICAgICAgICBNYXRoLm1pbih3aWR0aCwgaGVpZ2h0KSk7XHJcblxyXG4gICAgICAgIHZhciB2O1xyXG4gICAgICAgIHZhciB3ID0gd2lkdGggLyAyO1xyXG4gICAgICAgIHZhciBoID0gaGVpZ2h0IC8gMjtcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbMF07XHJcbiAgICAgICAgdi54ID0gLSAodyAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi55ID0gLSBoO1xyXG5cclxuICAgICAgICAvLyBVcHBlciBSaWdodCBDb3JuZXJcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbMV07XHJcbiAgICAgICAgdi54ID0gKHcgLSByYWRpdXMpO1xyXG4gICAgICAgIHYueSA9IC0gaDtcclxuICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnggPSByYWRpdXM7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC55ID0gMDtcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbMl07XHJcbiAgICAgICAgdi54ID0gdztcclxuICAgICAgICB2LnkgPSAtIChoIC0gcmFkaXVzKTtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LmNsZWFyKCk7XHJcbiAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcblxyXG4gICAgICAgIC8vIEJvdHRvbSBSaWdodCBDb3JuZXJcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbM107XHJcbiAgICAgICAgdi54ID0gdztcclxuICAgICAgICB2LnkgPSAoaCAtIHJhZGl1cyk7XHJcbiAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC54ID0gMDtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnkgPSByYWRpdXM7XHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzRdO1xyXG4gICAgICAgIHYueCA9ICh3IC0gcmFkaXVzKTtcclxuICAgICAgICB2LnkgPSBoO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQuY2xlYXIoKTtcclxuICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgLy8gQm90dG9tIExlZnQgQ29ybmVyXHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzVdO1xyXG4gICAgICAgIHYueCA9IC0gKHcgLSByYWRpdXMpO1xyXG4gICAgICAgIHYueSA9IGg7XHJcbiAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC54ID0gLSByYWRpdXM7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC55ID0gMDtcclxuXHJcbiAgICAgICAgdiA9IHRoaXMudmVydGljZXNbNl07XHJcbiAgICAgICAgdi54ID0gLSB3O1xyXG4gICAgICAgIHYueSA9IChoIC0gcmFkaXVzKTtcclxuICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LmNsZWFyKCk7XHJcblxyXG4gICAgICAgIC8vIFVwcGVyIExlZnQgQ29ybmVyXHJcblxyXG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzWzddO1xyXG4gICAgICAgIHYueCA9IC0gdztcclxuICAgICAgICB2LnkgPSAtIChoIC0gcmFkaXVzKTtcclxuICAgICAgICB2LmNvbnRyb2xzLmxlZnQuY2xlYXIoKTtcclxuICAgICAgICB2LmNvbnRyb2xzLnJpZ2h0LnggPSAwO1xyXG4gICAgICAgIHYuY29udHJvbHMucmlnaHQueSA9IC0gcmFkaXVzO1xyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1s4XTtcclxuICAgICAgICB2LnggPSAtICh3IC0gcmFkaXVzKTtcclxuICAgICAgICB2LnkgPSAtIGg7XHJcbiAgICAgICAgdi5jb250cm9scy5sZWZ0LmNsZWFyKCk7XHJcbiAgICAgICAgdi5jb250cm9scy5yaWdodC5jbGVhcigpO1xyXG5cclxuICAgICAgICB2ID0gdGhpcy52ZXJ0aWNlc1s5XTtcclxuICAgICAgICB2LmNvcHkodGhpcy52ZXJ0aWNlc1s4XSk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBQYXRoLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnV2lkdGggPSB0aGlzLl9mbGFnSGVpZ2h0ID0gdGhpcy5fZmxhZ1JhZGl1cyA9IGZhbHNlO1xyXG4gICAgICBQYXRoLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFJvdW5kZWRSZWN0YW5nbGUuTWFrZU9ic2VydmFibGUoUm91bmRlZFJlY3RhbmdsZS5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIHJvb3QgPSBUd28ucm9vdDtcclxuICB2YXIgZ2V0Q29tcHV0ZWRNYXRyaXggPSBUd28uVXRpbHMuZ2V0Q29tcHV0ZWRNYXRyaXg7XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIHZhciBjYW52YXMgPSAocm9vdC5kb2N1bWVudCA/IHJvb3QuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJykgOiB7IGdldENvbnRleHQ6IF8uaWRlbnRpdHkgfSk7XHJcbiAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG5cclxuICB2YXIgVGV4dCA9IFR3by5UZXh0ID0gZnVuY3Rpb24obWVzc2FnZSwgeCwgeSwgc3R5bGVzKSB7XHJcblxyXG4gICAgVHdvLlNoYXBlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIudHlwZSA9ICd0ZXh0JztcclxuICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdGaWxsID0gXy5iaW5kKFRleHQuRmxhZ0ZpbGwsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0cm9rZSA9IF8uYmluZChUZXh0LkZsYWdTdHJva2UsIHRoaXMpO1xyXG5cclxuICAgIHRoaXMudmFsdWUgPSBtZXNzYWdlO1xyXG5cclxuICAgIGlmIChfLmlzTnVtYmVyKHgpKSB7XHJcbiAgICAgICAgdGhpcy50cmFuc2xhdGlvbi54ID0geDtcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKHkpKSB7XHJcbiAgICAgICAgdGhpcy50cmFuc2xhdGlvbi55ID0geTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIV8uaXNPYmplY3Qoc3R5bGVzKSkge1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBfLmVhY2goVHdvLlRleHQuUHJvcGVydGllcywgZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuXHJcbiAgICAgIGlmIChwcm9wZXJ0eSBpbiBzdHlsZXMpIHtcclxuICAgICAgICB0aGlzW3Byb3BlcnR5XSA9IHN0eWxlc1twcm9wZXJ0eV07XHJcbiAgICAgIH1cclxuXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoVHdvLlRleHQsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbXHJcbiAgICAgICd2YWx1ZScsICdmYW1pbHknLCAnc2l6ZScsICdsZWFkaW5nJywgJ2FsaWdubWVudCcsICdsaW5ld2lkdGgnLCAnc3R5bGUnLFxyXG4gICAgICAnd2VpZ2h0JywgJ2RlY29yYXRpb24nLCAnYmFzZWxpbmUnLCAnb3BhY2l0eScsICd2aXNpYmxlJywgJ2ZpbGwnLCAnc3Ryb2tlJ1xyXG4gICAgXSxcclxuXHJcbiAgICBGbGFnRmlsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdGaWxsID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgRmxhZ1N0cm9rZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdTdHJva2UgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICBUd28uU2hhcGUuTWFrZU9ic2VydmFibGUob2JqZWN0KTtcclxuXHJcbiAgICAgIF8uZWFjaChUd28uVGV4dC5Qcm9wZXJ0aWVzLnNsaWNlKDAsIDEyKSwgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmplY3QpO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2ZpbGwnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGw7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGYpIHtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5HcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uUmFkaWFsR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZpbGwudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnRmlsbCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fZmlsbCA9IGY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnRmlsbCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fZmlsbCBpbnN0YW5jZW9mIFR3by5MaW5lYXJHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9maWxsIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX2ZpbGwgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9maWxsLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdGaWxsKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdzdHJva2UnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3N0cm9rZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oZikge1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLkxpbmVhckdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5SYWRpYWxHcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uVGV4dHVyZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9zdHJva2UudW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnU3Ryb2tlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9zdHJva2UgPSBmO1xyXG4gICAgICAgICAgdGhpcy5fZmxhZ1N0cm9rZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5HcmFkaWVudFxyXG4gICAgICAgICAgICB8fCB0aGlzLl9zdHJva2UgaW5zdGFuY2VvZiBUd28uTGluZWFyR3JhZGllbnRcclxuICAgICAgICAgICAgfHwgdGhpcy5fc3Ryb2tlIGluc3RhbmNlb2YgVHdvLlJhZGlhbEdyYWRpZW50XHJcbiAgICAgICAgICAgIHx8IHRoaXMuX3N0cm9rZSBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3N0cm9rZS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnU3Ryb2tlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdjbGlwJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jbGlwO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICB0aGlzLl9jbGlwID0gdjtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdDbGlwID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFR3by5UZXh0LnByb3RvdHlwZSwgVHdvLlNoYXBlLnByb3RvdHlwZSwge1xyXG5cclxuICAgIC8vIEZsYWdzXHJcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0ZsYWdcclxuXHJcbiAgICBfZmxhZ1ZhbHVlOiB0cnVlLFxyXG4gICAgX2ZsYWdGYW1pbHk6IHRydWUsXHJcbiAgICBfZmxhZ1NpemU6IHRydWUsXHJcbiAgICBfZmxhZ0xlYWRpbmc6IHRydWUsXHJcbiAgICBfZmxhZ0FsaWdubWVudDogdHJ1ZSxcclxuICAgIF9mbGFnQmFzZWxpbmU6IHRydWUsXHJcbiAgICBfZmxhZ1N0eWxlOiB0cnVlLFxyXG4gICAgX2ZsYWdXZWlnaHQ6IHRydWUsXHJcbiAgICBfZmxhZ0RlY29yYXRpb246IHRydWUsXHJcblxyXG4gICAgX2ZsYWdGaWxsOiB0cnVlLFxyXG4gICAgX2ZsYWdTdHJva2U6IHRydWUsXHJcbiAgICBfZmxhZ0xpbmV3aWR0aDogdHJ1ZSxcclxuICAgIF9mbGFnT3BhY2l0eTogdHJ1ZSxcclxuICAgIF9mbGFnVmlzaWJsZTogdHJ1ZSxcclxuXHJcbiAgICBfZmxhZ0NsaXA6IGZhbHNlLFxyXG5cclxuICAgIC8vIFVuZGVybHlpbmcgUHJvcGVydGllc1xyXG5cclxuICAgIF92YWx1ZTogJycsXHJcbiAgICBfZmFtaWx5OiAnc2Fucy1zZXJpZicsXHJcbiAgICBfc2l6ZTogMTMsXHJcbiAgICBfbGVhZGluZzogMTcsXHJcbiAgICBfYWxpZ25tZW50OiAnY2VudGVyJyxcclxuICAgIF9iYXNlbGluZTogJ21pZGRsZScsXHJcbiAgICBfc3R5bGU6ICdub3JtYWwnLFxyXG4gICAgX3dlaWdodDogNTAwLFxyXG4gICAgX2RlY29yYXRpb246ICdub25lJyxcclxuXHJcbiAgICBfZmlsbDogJyMwMDAnLFxyXG4gICAgX3N0cm9rZTogJ3RyYW5zcGFyZW50JyxcclxuICAgIF9saW5ld2lkdGg6IDEsXHJcbiAgICBfb3BhY2l0eTogMSxcclxuICAgIF92aXNpYmxlOiB0cnVlLFxyXG5cclxuICAgIF9jbGlwOiBmYWxzZSxcclxuXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKCF0aGlzLnBhcmVudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnBhcmVudC5yZW1vdmUodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuXHJcbiAgICAgIHZhciBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQ7XHJcblxyXG4gICAgICB2YXIgY2xvbmUgPSBuZXcgVHdvLlRleHQodGhpcy52YWx1ZSk7XHJcbiAgICAgIGNsb25lLnRyYW5zbGF0aW9uLmNvcHkodGhpcy50cmFuc2xhdGlvbik7XHJcbiAgICAgIGNsb25lLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbjtcclxuICAgICAgY2xvbmUuc2NhbGUgPSB0aGlzLnNjYWxlO1xyXG5cclxuICAgICAgXy5lYWNoKFR3by5UZXh0LlByb3BlcnRpZXMsIGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgY2xvbmVbcHJvcGVydHldID0gdGhpc1twcm9wZXJ0eV07XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgIHBhcmVudC5hZGQoY2xvbmUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgIHRyYW5zbGF0aW9uOiB0aGlzLnRyYW5zbGF0aW9uLnRvT2JqZWN0KCksXHJcbiAgICAgICAgcm90YXRpb246IHRoaXMucm90YXRpb24sXHJcbiAgICAgICAgc2NhbGU6IHRoaXMuc2NhbGVcclxuICAgICAgfTtcclxuXHJcbiAgICAgIF8uZWFjaChUd28uVGV4dC5Qcm9wZXJ0aWVzLCBmdW5jdGlvbihwcm9wZXJ0eSkge1xyXG4gICAgICAgIHJlc3VsdFtwcm9wZXJ0eV0gPSB0aGlzW3Byb3BlcnR5XTtcclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgbm9TdHJva2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLnN0cm9rZSA9ICd0cmFuc3BhcmVudCc7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBub0ZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmZpbGwgPSAndHJhbnNwYXJlbnQnO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBIHNoaW0gdG8gbm90IGJyZWFrIGBnZXRCb3VuZGluZ0NsaWVudFJlY3RgIGNhbGxzLiBUT0RPOiBJbXBsZW1lbnQgYVxyXG4gICAgICogd2F5IHRvIGNhbGN1bGF0ZSBwcm9wZXIgYm91bmRpbmcgYm94ZXMgb2YgYFR3by5UZXh0YC5cclxuICAgICAqL1xyXG4gICAgZ2V0Qm91bmRpbmdDbGllbnRSZWN0OiBmdW5jdGlvbihzaGFsbG93KSB7XHJcblxyXG4gICAgICB2YXIgbWF0cml4LCBib3JkZXIsIGwsIHgsIHksIGksIHY7XHJcblxyXG4gICAgICB2YXIgbGVmdCA9IEluZmluaXR5LCByaWdodCA9IC1JbmZpbml0eSxcclxuICAgICAgICAgIHRvcCA9IEluZmluaXR5LCBib3R0b20gPSAtSW5maW5pdHk7XHJcblxyXG4gICAgICAvLyBUT0RPOiBVcGRhdGUgdGhpcyB0byBub3QgX19hbHdheXNfXyB1cGRhdGUuIEp1c3Qgd2hlbiBpdCBuZWVkcyB0by5cclxuICAgICAgdGhpcy5fdXBkYXRlKHRydWUpO1xyXG5cclxuICAgICAgbWF0cml4ID0gISFzaGFsbG93ID8gdGhpcy5fbWF0cml4IDogZ2V0Q29tcHV0ZWRNYXRyaXgodGhpcyk7XHJcblxyXG4gICAgICB2ID0gbWF0cml4Lm11bHRpcGx5KDAsIDAsIDEpO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICB0b3A6IHYueCxcclxuICAgICAgICBsZWZ0OiB2LnksXHJcbiAgICAgICAgcmlnaHQ6IHYueCxcclxuICAgICAgICBib3R0b206IHYueSxcclxuICAgICAgICB3aWR0aDogMCxcclxuICAgICAgICBoZWlnaHQ6IDBcclxuICAgICAgfTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnVmFsdWUgPSB0aGlzLl9mbGFnRmFtaWx5ID0gdGhpcy5fZmxhZ1NpemUgPVxyXG4gICAgICAgIHRoaXMuX2ZsYWdMZWFkaW5nID0gdGhpcy5fZmxhZ0FsaWdubWVudCA9IHRoaXMuX2ZsYWdGaWxsID1cclxuICAgICAgICB0aGlzLl9mbGFnU3Ryb2tlID0gdGhpcy5fZmxhZ0xpbmV3aWR0aCA9IHRoaXMuX2ZsYWdPcGFpY3R5ID1cclxuICAgICAgICB0aGlzLl9mbGFnVmlzaWJsZSA9IHRoaXMuX2ZsYWdDbGlwID0gdGhpcy5fZmxhZ0RlY29yYXRpb24gPVxyXG4gICAgICAgIHRoaXMuX2ZsYWdCYXNlbGluZSA9IGZhbHNlO1xyXG5cclxuICAgICAgVHdvLlNoYXBlLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFR3by5UZXh0Lk1ha2VPYnNlcnZhYmxlKFR3by5UZXh0LnByb3RvdHlwZSk7XHJcblxyXG59KSgodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0aGlzKS5Ud28pO1xyXG5cclxuKGZ1bmN0aW9uKFR3bykge1xyXG5cclxuICB2YXIgXyA9IFR3by5VdGlscztcclxuXHJcbiAgdmFyIFN0b3AgPSBUd28uU3RvcCA9IGZ1bmN0aW9uKG9mZnNldCwgY29sb3IsIG9wYWNpdHkpIHtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlciA9IHt9O1xyXG4gICAgdGhpcy5fcmVuZGVyZXIudHlwZSA9ICdzdG9wJztcclxuXHJcbiAgICB0aGlzLm9mZnNldCA9IF8uaXNOdW1iZXIob2Zmc2V0KSA/IG9mZnNldFxyXG4gICAgICA6IFN0b3AuSW5kZXggPD0gMCA/IDAgOiAxO1xyXG5cclxuICAgIHRoaXMub3BhY2l0eSA9IF8uaXNOdW1iZXIob3BhY2l0eSkgPyBvcGFjaXR5IDogMTtcclxuXHJcbiAgICB0aGlzLmNvbG9yID0gXy5pc1N0cmluZyhjb2xvcikgPyBjb2xvclxyXG4gICAgICA6IFN0b3AuSW5kZXggPD0gMCA/ICcjZmZmJyA6ICcjMDAwJztcclxuXHJcbiAgICBTdG9wLkluZGV4ID0gKFN0b3AuSW5kZXggKyAxKSAlIDI7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFN0b3AsIHtcclxuXHJcbiAgICBJbmRleDogMCxcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbXHJcbiAgICAgICdvZmZzZXQnLFxyXG4gICAgICAnb3BhY2l0eScsXHJcbiAgICAgICdjb2xvcidcclxuICAgIF0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgXy5lYWNoKFN0b3AuUHJvcGVydGllcywgZnVuY3Rpb24ocHJvcGVydHkpIHtcclxuXHJcbiAgICAgICAgdmFyIG9iamVjdCA9IHRoaXM7XHJcbiAgICAgICAgdmFyIHNlY3JldCA9ICdfJyArIHByb3BlcnR5O1xyXG4gICAgICAgIHZhciBmbGFnID0gJ19mbGFnJyArIHByb3BlcnR5LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcHJvcGVydHkuc2xpY2UoMSk7XHJcblxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5LCB7XHJcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbc2VjcmV0XTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgdGhpc1tzZWNyZXRdID0gdjtcclxuICAgICAgICAgICAgdGhpc1tmbGFnXSA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnBhcmVudCkge1xyXG4gICAgICAgICAgICAgIHRoaXMucGFyZW50Ll9mbGFnU3RvcHMgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9LCBvYmplY3QpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFN0b3AucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCB7XHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IFN0b3AoKTtcclxuXHJcbiAgICAgIF8uZWFjaChTdG9wLlByb3BlcnRpZXMsIGZ1bmN0aW9uKHByb3BlcnR5KSB7XHJcbiAgICAgICAgY2xvbmVbcHJvcGVydHldID0gdGhpc1twcm9wZXJ0eV07XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xyXG5cclxuICAgICAgXy5lYWNoKFN0b3AuUHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIHJlc3VsdFtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnT2Zmc2V0ID0gdGhpcy5fZmxhZ0NvbG9yID0gdGhpcy5fZmxhZ09wYWNpdHkgPSBmYWxzZTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIFN0b3AuTWFrZU9ic2VydmFibGUoU3RvcC5wcm90b3R5cGUpO1xyXG5cclxuICB2YXIgR3JhZGllbnQgPSBUd28uR3JhZGllbnQgPSBmdW5jdGlvbihzdG9wcykge1xyXG5cclxuICAgIHRoaXMuX3JlbmRlcmVyID0ge307XHJcbiAgICB0aGlzLl9yZW5kZXJlci50eXBlID0gJ2dyYWRpZW50JztcclxuXHJcbiAgICB0aGlzLmlkID0gVHdvLklkZW50aWZpZXIgKyBUd28udW5pcXVlSWQoKTtcclxuICAgIHRoaXMuY2xhc3NMaXN0ID0gW107XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1N0b3BzID0gXy5iaW5kKEdyYWRpZW50LkZsYWdTdG9wcywgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5iaW5kU3RvcHMgPSBfLmJpbmQoR3JhZGllbnQuQmluZFN0b3BzLCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLnVuYmluZFN0b3BzID0gXy5iaW5kKEdyYWRpZW50LlVuYmluZFN0b3BzLCB0aGlzKTtcclxuXHJcbiAgICB0aGlzLnNwcmVhZCA9ICdwYWQnO1xyXG5cclxuICAgIHRoaXMuc3RvcHMgPSBzdG9wcztcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoR3JhZGllbnQsIHtcclxuXHJcbiAgICBTdG9wOiBTdG9wLFxyXG5cclxuICAgIFByb3BlcnRpZXM6IFtcclxuICAgICAgJ3NwcmVhZCdcclxuICAgIF0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgXy5lYWNoKEdyYWRpZW50LlByb3BlcnRpZXMsIFR3by5VdGlscy5kZWZpbmVQcm9wZXJ0eSwgb2JqZWN0KTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdzdG9wcycsIHtcclxuXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9zdG9wcztcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHN0b3BzKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHVwZGF0ZVN0b3BzID0gdGhpcy5fcmVuZGVyZXIuZmxhZ1N0b3BzO1xyXG4gICAgICAgICAgdmFyIGJpbmRTdG9wcyA9IHRoaXMuX3JlbmRlcmVyLmJpbmRTdG9wcztcclxuICAgICAgICAgIHZhciB1bmJpbmRTdG9wcyA9IHRoaXMuX3JlbmRlcmVyLnVuYmluZFN0b3BzO1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSBwcmV2aW91cyBsaXN0ZW5lcnNcclxuICAgICAgICAgIGlmICh0aGlzLl9zdG9wcykge1xyXG4gICAgICAgICAgICB0aGlzLl9zdG9wc1xyXG4gICAgICAgICAgICAgIC51bmJpbmQoVHdvLkV2ZW50cy5pbnNlcnQsIGJpbmRTdG9wcylcclxuICAgICAgICAgICAgICAudW5iaW5kKFR3by5FdmVudHMucmVtb3ZlLCB1bmJpbmRTdG9wcyk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ3JlYXRlIG5ldyBDb2xsZWN0aW9uIHdpdGggY29weSBvZiBTdG9wc1xyXG4gICAgICAgICAgdGhpcy5fc3RvcHMgPSBuZXcgVHdvLlV0aWxzLkNvbGxlY3Rpb24oKHN0b3BzIHx8IFtdKS5zbGljZSgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gTGlzdGVuIGZvciBDb2xsZWN0aW9uIGNoYW5nZXMgYW5kIGJpbmQgLyB1bmJpbmRcclxuICAgICAgICAgIHRoaXMuX3N0b3BzXHJcbiAgICAgICAgICAgIC5iaW5kKFR3by5FdmVudHMuaW5zZXJ0LCBiaW5kU3RvcHMpXHJcbiAgICAgICAgICAgIC5iaW5kKFR3by5FdmVudHMucmVtb3ZlLCB1bmJpbmRTdG9wcyk7XHJcblxyXG4gICAgICAgICAgLy8gQmluZCBJbml0aWFsIFN0b3BzXHJcbiAgICAgICAgICBiaW5kU3RvcHModGhpcy5fc3RvcHMpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIEZsYWdTdG9wczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdTdG9wcyA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIEJpbmRTdG9wczogZnVuY3Rpb24oaXRlbXMpIHtcclxuXHJcbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGEgbG90XHJcbiAgICAgIC8vIHdoZW4gaW1wb3J0aW5nIGEgbGFyZ2UgU1ZHXHJcbiAgICAgIHZhciBpID0gaXRlbXMubGVuZ3RoO1xyXG4gICAgICB3aGlsZShpLS0pIHtcclxuICAgICAgICBpdGVtc1tpXS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnU3RvcHMpO1xyXG4gICAgICAgIGl0ZW1zW2ldLnBhcmVudCA9IHRoaXM7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdTdG9wcygpO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgVW5iaW5kU3RvcHM6IGZ1bmN0aW9uKGl0ZW1zKSB7XHJcblxyXG4gICAgICB2YXIgaSA9IGl0ZW1zLmxlbmd0aDtcclxuICAgICAgd2hpbGUoaS0tKSB7XHJcbiAgICAgICAgaXRlbXNbaV0udW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnU3RvcHMpO1xyXG4gICAgICAgIGRlbGV0ZSBpdGVtc1tpXS5wYXJlbnQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuX3JlbmRlcmVyLmZsYWdTdG9wcygpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKEdyYWRpZW50LnByb3RvdHlwZSwgVHdvLlV0aWxzLkV2ZW50cywge1xyXG5cclxuICAgIF9mbGFnU3RvcHM6IGZhbHNlLFxyXG4gICAgX2ZsYWdTcHJlYWQ6IGZhbHNlLFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuXHJcbiAgICAgIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIHZhciBzdG9wcyA9IF8ubWFwKHRoaXMuc3RvcHMsIGZ1bmN0aW9uKHMpIHtcclxuICAgICAgICByZXR1cm4gcy5jbG9uZSgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBHcmFkaWVudChzdG9wcyk7XHJcblxyXG4gICAgICBfLmVhY2goVHdvLkdyYWRpZW50LlByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICBjbG9uZVtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgIHBhcmVudC5hZGQoY2xvbmUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgIHN0b3BzOiBfLm1hcCh0aGlzLnN0b3BzLCBmdW5jdGlvbihzKSB7XHJcbiAgICAgICAgICByZXR1cm4gcy50b09iamVjdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBfLmVhY2goR3JhZGllbnQuUHJvcGVydGllcywgZnVuY3Rpb24oaykge1xyXG4gICAgICAgIHJlc3VsdFtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fZmxhZ1N0b3BzKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1NwcmVhZCA9IHRoaXMuX2ZsYWdTdG9wcyA9IGZhbHNlO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgR3JhZGllbnQuTWFrZU9ic2VydmFibGUoR3JhZGllbnQucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgTGluZWFyR3JhZGllbnQgPSBUd28uTGluZWFyR3JhZGllbnQgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Miwgc3RvcHMpIHtcclxuXHJcbiAgICBUd28uR3JhZGllbnQuY2FsbCh0aGlzLCBzdG9wcyk7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIudHlwZSA9ICdsaW5lYXItZ3JhZGllbnQnO1xyXG5cclxuICAgIHZhciBmbGFnRW5kUG9pbnRzID0gXy5iaW5kKExpbmVhckdyYWRpZW50LkZsYWdFbmRQb2ludHMsIHRoaXMpO1xyXG4gICAgdGhpcy5sZWZ0ID0gbmV3IFR3by5WZWN0b3IoKS5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCBmbGFnRW5kUG9pbnRzKTtcclxuICAgIHRoaXMucmlnaHQgPSBuZXcgVHdvLlZlY3RvcigpLmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIGZsYWdFbmRQb2ludHMpO1xyXG5cclxuICAgIGlmIChfLmlzTnVtYmVyKHgxKSkge1xyXG4gICAgICB0aGlzLmxlZnQueCA9IHgxO1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIoeTEpKSB7XHJcbiAgICAgIHRoaXMubGVmdC55ID0geTE7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcih4MikpIHtcclxuICAgICAgdGhpcy5yaWdodC54ID0geDI7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcih5MikpIHtcclxuICAgICAgdGhpcy5yaWdodC55ID0geTI7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKExpbmVhckdyYWRpZW50LCB7XHJcblxyXG4gICAgU3RvcDogVHdvLkdyYWRpZW50LlN0b3AsXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG4gICAgICBUd28uR3JhZGllbnQuTWFrZU9ic2VydmFibGUob2JqZWN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgRmxhZ0VuZFBvaW50czogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdFbmRQb2ludHMgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoTGluZWFyR3JhZGllbnQucHJvdG90eXBlLCBUd28uR3JhZGllbnQucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX2ZsYWdFbmRQb2ludHM6IGZhbHNlLFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuXHJcbiAgICAgIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIHZhciBzdG9wcyA9IF8ubWFwKHRoaXMuc3RvcHMsIGZ1bmN0aW9uKHN0b3ApIHtcclxuICAgICAgICByZXR1cm4gc3RvcC5jbG9uZSgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBMaW5lYXJHcmFkaWVudCh0aGlzLmxlZnQuX3gsIHRoaXMubGVmdC5feSxcclxuICAgICAgICB0aGlzLnJpZ2h0Ll94LCB0aGlzLnJpZ2h0Ll95LCBzdG9wcyk7XHJcblxyXG4gICAgICBfLmVhY2goVHdvLkdyYWRpZW50LlByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICBjbG9uZVtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgIHBhcmVudC5hZGQoY2xvbmUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVzdWx0ID0gVHdvLkdyYWRpZW50LnByb3RvdHlwZS50b09iamVjdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmVzdWx0LmxlZnQgPSB0aGlzLmxlZnQudG9PYmplY3QoKTtcclxuICAgICAgcmVzdWx0LnJpZ2h0ID0gdGhpcy5yaWdodC50b09iamVjdCgpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdFbmRQb2ludHMgfHwgdGhpcy5fZmxhZ1NwcmVhZCB8fCB0aGlzLl9mbGFnU3RvcHMpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoVHdvLkV2ZW50cy5jaGFuZ2UpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnRW5kUG9pbnRzID0gZmFsc2U7XHJcblxyXG4gICAgICBUd28uR3JhZGllbnQucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgTGluZWFyR3JhZGllbnQuTWFrZU9ic2VydmFibGUoTGluZWFyR3JhZGllbnQucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG5cclxuICB2YXIgUmFkaWFsR3JhZGllbnQgPSBUd28uUmFkaWFsR3JhZGllbnQgPSBmdW5jdGlvbihjeCwgY3ksIHIsIHN0b3BzLCBmeCwgZnkpIHtcclxuXHJcbiAgICBUd28uR3JhZGllbnQuY2FsbCh0aGlzLCBzdG9wcyk7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIudHlwZSA9ICdyYWRpYWwtZ3JhZGllbnQnO1xyXG5cclxuICAgIHRoaXMuY2VudGVyID0gbmV3IFR3by5WZWN0b3IoKVxyXG4gICAgICAuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgXy5iaW5kKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuX2ZsYWdDZW50ZXIgPSB0cnVlO1xyXG4gICAgICB9LCB0aGlzKSk7XHJcblxyXG4gICAgdGhpcy5yYWRpdXMgPSBfLmlzTnVtYmVyKHIpID8gciA6IDIwO1xyXG5cclxuICAgIHRoaXMuZm9jYWwgPSBuZXcgVHdvLlZlY3RvcigpXHJcbiAgICAgIC5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCBfLmJpbmQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5fZmxhZ0ZvY2FsID0gdHJ1ZTtcclxuICAgICAgfSwgdGhpcykpO1xyXG5cclxuICAgIGlmIChfLmlzTnVtYmVyKGN4KSkge1xyXG4gICAgICB0aGlzLmNlbnRlci54ID0gY3g7XHJcbiAgICB9XHJcbiAgICBpZiAoXy5pc051bWJlcihjeSkpIHtcclxuICAgICAgdGhpcy5jZW50ZXIueSA9IGN5O1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZm9jYWwuY29weSh0aGlzLmNlbnRlcik7XHJcblxyXG4gICAgaWYgKF8uaXNOdW1iZXIoZngpKSB7XHJcbiAgICAgIHRoaXMuZm9jYWwueCA9IGZ4O1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIoZnkpKSB7XHJcbiAgICAgIHRoaXMuZm9jYWwueSA9IGZ5O1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBfLmV4dGVuZChSYWRpYWxHcmFkaWVudCwge1xyXG5cclxuICAgIFN0b3A6IFR3by5HcmFkaWVudC5TdG9wLFxyXG5cclxuICAgIFByb3BlcnRpZXM6IFtcclxuICAgICAgJ3JhZGl1cydcclxuICAgIF0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgVHdvLkdyYWRpZW50Lk1ha2VPYnNlcnZhYmxlKG9iamVjdCk7XHJcblxyXG4gICAgICBfLmVhY2goUmFkaWFsR3JhZGllbnQuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmplY3QpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFJhZGlhbEdyYWRpZW50LnByb3RvdHlwZSwgVHdvLkdyYWRpZW50LnByb3RvdHlwZSwge1xyXG5cclxuICAgIF9mbGFnUmFkaXVzOiBmYWxzZSxcclxuICAgIF9mbGFnQ2VudGVyOiBmYWxzZSxcclxuICAgIF9mbGFnRm9jYWw6IGZhbHNlLFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuXHJcbiAgICAgIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIHZhciBzdG9wcyA9IF8ubWFwKHRoaXMuc3RvcHMsIGZ1bmN0aW9uKHN0b3ApIHtcclxuICAgICAgICByZXR1cm4gc3RvcC5jbG9uZSgpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBSYWRpYWxHcmFkaWVudCh0aGlzLmNlbnRlci5feCwgdGhpcy5jZW50ZXIuX3ksXHJcbiAgICAgICAgICB0aGlzLl9yYWRpdXMsIHN0b3BzLCB0aGlzLmZvY2FsLl94LCB0aGlzLmZvY2FsLl95KTtcclxuXHJcbiAgICAgIF8uZWFjaChUd28uR3JhZGllbnQuUHJvcGVydGllcy5jb25jYXQoUmFkaWFsR3JhZGllbnQuUHJvcGVydGllcyksIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICBjbG9uZVtrXSA9IHRoaXNba107XHJcbiAgICAgIH0sIHRoaXMpO1xyXG5cclxuICAgICAgaWYgKHBhcmVudCkge1xyXG4gICAgICAgIHBhcmVudC5hZGQoY2xvbmUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gY2xvbmU7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICB0b09iamVjdDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgcmVzdWx0ID0gVHdvLkdyYWRpZW50LnByb3RvdHlwZS50b09iamVjdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgXy5lYWNoKFJhZGlhbEdyYWRpZW50LlByb3BlcnRpZXMsIGZ1bmN0aW9uKGspIHtcclxuICAgICAgICByZXN1bHRba10gPSB0aGlzW2tdO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHJlc3VsdC5jZW50ZXIgPSB0aGlzLmNlbnRlci50b09iamVjdCgpO1xyXG4gICAgICByZXN1bHQuZm9jYWwgPSB0aGlzLmZvY2FsLnRvT2JqZWN0KCk7XHJcblxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1JhZGl1cyB8fCB0aGlzLl9mbGF0Q2VudGVyIHx8IHRoaXMuX2ZsYWdGb2NhbFxyXG4gICAgICAgIHx8IHRoaXMuX2ZsYWdTcHJlYWQgfHwgdGhpcy5fZmxhZ1N0b3BzKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBmbGFnUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fZmxhZ1JhZGl1cyA9IHRoaXMuX2ZsYWdDZW50ZXIgPSB0aGlzLl9mbGFnRm9jYWwgPSBmYWxzZTtcclxuXHJcbiAgICAgIFR3by5HcmFkaWVudC5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBSYWRpYWxHcmFkaWVudC5NYWtlT2JzZXJ2YWJsZShSYWRpYWxHcmFkaWVudC5wcm90b3R5cGUpO1xyXG5cclxufSkoKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdGhpcykuVHdvKTtcclxuXHJcbihmdW5jdGlvbihUd28pIHtcclxuXHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcbiAgdmFyIGFuY2hvcjtcclxuICB2YXIgcmVnZXggPSB7XHJcbiAgICB2aWRlbzogL1xcLihtcDR8d2VibSkkL2ksXHJcbiAgICBpbWFnZTogL1xcLihqcGU/Z3xwbmd8Z2lmfHRpZmYpJC9pXHJcbiAgfTtcclxuXHJcbiAgaWYgKHRoaXMuZG9jdW1lbnQpIHtcclxuICAgIGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICB9XHJcblxyXG4gIHZhciBUZXh0dXJlID0gVHdvLlRleHR1cmUgPSBmdW5jdGlvbihzcmMsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIgPSB7fTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLnR5cGUgPSAndGV4dHVyZSc7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnT2Zmc2V0ID0gXy5iaW5kKFRleHR1cmUuRmxhZ09mZnNldCwgdGhpcyk7XHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnU2NhbGUgPSBfLmJpbmQoVGV4dHVyZS5GbGFnU2NhbGUsIHRoaXMpO1xyXG5cclxuICAgIHRoaXMuaWQgPSBUd28uSWRlbnRpZmllciArIFR3by51bmlxdWVJZCgpO1xyXG4gICAgdGhpcy5jbGFzc0xpc3QgPSBbXTtcclxuXHJcbiAgICB0aGlzLm9mZnNldCA9IG5ldyBUd28uVmVjdG9yKCk7XHJcblxyXG4gICAgaWYgKF8uaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcclxuICAgICAgdmFyIGxvYWRlZCA9IF8uYmluZChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnVuYmluZChUd28uRXZlbnRzLmxvYWQsIGxvYWRlZCk7XHJcbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9LCB0aGlzKTtcclxuICAgICAgdGhpcy5iaW5kKFR3by5FdmVudHMubG9hZCwgbG9hZGVkKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoXy5pc1N0cmluZyhzcmMpKSB7XHJcbiAgICAgIHRoaXMuc3JjID0gc3JjO1xyXG4gICAgfSBlbHNlIGlmIChfLmlzRWxlbWVudChzcmMpKSB7XHJcbiAgICAgIHRoaXMuaW1hZ2UgPSBzcmM7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFRleHR1cmUsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbXHJcbiAgICAgICdzcmMnLFxyXG4gICAgICAnbG9hZGVkJyxcclxuICAgICAgJ3JlcGVhdCdcclxuICAgIF0sXHJcblxyXG4gICAgSW1hZ2VSZWdpc3RyeTogbmV3IFR3by5SZWdpc3RyeSgpLFxyXG5cclxuICAgIGdldEFic29sdXRlVVJMOiBmdW5jdGlvbihwYXRoKSB7XHJcbiAgICAgIGlmICghYW5jaG9yKSB7XHJcbiAgICAgICAgLy8gVE9ETzogRml4IGZvciBoZWFkbGVzcyBlbnZpcm9ubWVudFxyXG4gICAgICAgIHJldHVybiBwYXRoO1xyXG4gICAgICB9XHJcbiAgICAgIGFuY2hvci5ocmVmID0gcGF0aDtcclxuICAgICAgcmV0dXJuIGFuY2hvci5ocmVmO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbWFnZTogZnVuY3Rpb24oc3JjKSB7XHJcblxyXG4gICAgICB2YXIgYWJzb2x1dGVTcmMgPSBUZXh0dXJlLmdldEFic29sdXRlVVJMKHNyYyk7XHJcblxyXG4gICAgICBpZiAoVGV4dHVyZS5JbWFnZVJlZ2lzdHJ5LmNvbnRhaW5zKGFic29sdXRlU3JjKSkge1xyXG4gICAgICAgIHJldHVybiBUZXh0dXJlLkltYWdlUmVnaXN0cnkuZ2V0KGFic29sdXRlU3JjKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGltYWdlO1xyXG5cclxuICAgICAgaWYgKHJlZ2V4LnZpZGVvLnRlc3QoYWJzb2x1dGVTcmMpKSB7XHJcbiAgICAgICAgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGltYWdlLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XHJcblxyXG4gICAgICByZXR1cm4gaW1hZ2U7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBSZWdpc3Rlcjoge1xyXG4gICAgICBjYW52YXM6IGZ1bmN0aW9uKHRleHR1cmUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdGV4dHVyZS5fc3JjID0gJyMnICsgdGV4dHVyZS5pZDtcclxuICAgICAgICBUZXh0dXJlLkltYWdlUmVnaXN0cnkuYWRkKHRleHR1cmUuc3JjLCB0ZXh0dXJlLmltYWdlKTtcclxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGltZzogZnVuY3Rpb24odGV4dHVyZSwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgdmFyIGxvYWRlZCA9IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignbG9hZCcsIGxvYWRlZCwgZmFsc2UpO1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdlcnJvcicsIGVycm9yLCBmYWxzZSk7XHJcbiAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgbG9hZGVkLCBmYWxzZSk7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZXJyb3IsIGZhbHNlKTtcclxuICAgICAgICAgIHRocm93IG5ldyBUd28uVXRpbHMuRXJyb3IoJ3VuYWJsZSB0byBsb2FkICcgKyB0ZXh0dXJlLnNyYyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKF8uaXNOdW1iZXIodGV4dHVyZS5pbWFnZS53aWR0aCkgJiYgdGV4dHVyZS5pbWFnZS53aWR0aCA+IDBcclxuICAgICAgICAgICYmIF8uaXNOdW1iZXIodGV4dHVyZS5pbWFnZS5oZWlnaHQpICYmIHRleHR1cmUuaW1hZ2UuaGVpZ2h0ID4gMCkge1xyXG4gICAgICAgICAgICBsb2FkZWQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgbG9hZGVkLCBmYWxzZSk7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZXJyb3IsIGZhbHNlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRleHR1cmUuX3NyYyA9IFRleHR1cmUuZ2V0QWJzb2x1dGVVUkwodGV4dHVyZS5fc3JjKTtcclxuXHJcbiAgICAgICAgaWYgKHRleHR1cmUuaW1hZ2UgJiYgdGV4dHVyZS5pbWFnZS5nZXRBdHRyaWJ1dGUoJ3R3by1zcmMnKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dHVyZS5pbWFnZS5zZXRBdHRyaWJ1dGUoJ3R3by1zcmMnLCB0ZXh0dXJlLnNyYyk7XHJcbiAgICAgICAgVGV4dHVyZS5JbWFnZVJlZ2lzdHJ5LmFkZCh0ZXh0dXJlLnNyYywgdGV4dHVyZS5pbWFnZSk7XHJcbiAgICAgICAgdGV4dHVyZS5pbWFnZS5zcmMgPSB0ZXh0dXJlLnNyYztcclxuXHJcbiAgICAgIH0sXHJcbiAgICAgIHZpZGVvOiBmdW5jdGlvbih0ZXh0dXJlLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICB2YXIgbG9hZGVkID0gZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgdGV4dHVyZS5pbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgbG9hZGVkLCBmYWxzZSk7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZXJyb3IsIGZhbHNlKTtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2Uud2lkdGggPSB0ZXh0dXJlLmltYWdlLnZpZGVvV2lkdGg7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLmhlaWdodCA9IHRleHR1cmUuaW1hZ2UudmlkZW9IZWlnaHQ7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnBsYXkoKTtcclxuICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICB0ZXh0dXJlLmltYWdlLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBsb2FkZWQsIGZhbHNlKTtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlcnJvciwgZmFsc2UpO1xyXG4gICAgICAgICAgdGhyb3cgbmV3IFR3by5VdGlscy5FcnJvcigndW5hYmxlIHRvIGxvYWQgJyArIHRleHR1cmUuc3JjKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0ZXh0dXJlLl9zcmMgPSBUZXh0dXJlLmdldEFic29sdXRlVVJMKHRleHR1cmUuX3NyYyk7XHJcbiAgICAgICAgdGV4dHVyZS5pbWFnZS5hZGRFdmVudExpc3RlbmVyKCdjYW5wbGF5dGhyb3VnaCcsIGxvYWRlZCwgZmFsc2UpO1xyXG4gICAgICAgIHRleHR1cmUuaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlcnJvciwgZmFsc2UpO1xyXG5cclxuICAgICAgICBpZiAodGV4dHVyZS5pbWFnZSAmJiB0ZXh0dXJlLmltYWdlLmdldEF0dHJpYnV0ZSgndHdvLXNyYycpKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0ZXh0dXJlLmltYWdlLnNldEF0dHJpYnV0ZSgndHdvLXNyYycsIHRleHR1cmUuc3JjKTtcclxuICAgICAgICBUZXh0dXJlLkltYWdlUmVnaXN0cnkuYWRkKHRleHR1cmUuc3JjLCB0ZXh0dXJlLmltYWdlKTtcclxuICAgICAgICB0ZXh0dXJlLmltYWdlLnNyYyA9IHRleHR1cmUuc3JjO1xyXG4gICAgICAgIHRleHR1cmUuaW1hZ2UubG9vcCA9IHRydWU7XHJcbiAgICAgICAgdGV4dHVyZS5pbWFnZS5sb2FkKCk7XHJcblxyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWQ6IGZ1bmN0aW9uKHRleHR1cmUsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICB2YXIgc3JjID0gdGV4dHVyZS5zcmM7XHJcbiAgICAgIHZhciBpbWFnZSA9IHRleHR1cmUuaW1hZ2U7XHJcbiAgICAgIHZhciB0YWcgPSBpbWFnZSAmJiBpbWFnZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgaWYgKHRleHR1cmUuX2ZsYWdJbWFnZSkge1xyXG4gICAgICAgIGlmICgvY2FudmFzL2kudGVzdCh0YWcpKSB7XHJcbiAgICAgICAgICBUZXh0dXJlLlJlZ2lzdGVyLmNhbnZhcyh0ZXh0dXJlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRleHR1cmUuX3NyYyA9IGltYWdlLmdldEF0dHJpYnV0ZSgndHdvLXNyYycpIHx8IGltYWdlLnNyYztcclxuICAgICAgICAgIFRleHR1cmUuUmVnaXN0ZXJbdGFnXSh0ZXh0dXJlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGV4dHVyZS5fZmxhZ1NyYykge1xyXG4gICAgICAgIGlmICghaW1hZ2UpIHtcclxuICAgICAgICAgIHRleHR1cmUuaW1hZ2UgPSBUZXh0dXJlLmdldEltYWdlKHRleHR1cmUuc3JjKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGFnID0gdGV4dHVyZS5pbWFnZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIFRleHR1cmUuUmVnaXN0ZXJbdGFnXSh0ZXh0dXJlLCBjYWxsYmFjayk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIEZsYWdPZmZzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLl9mbGFnT2Zmc2V0ID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgRmxhZ1NjYWxlOiBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5fZmxhZ1NjYWxlID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG5cclxuICAgICAgXy5lYWNoKFRleHR1cmUuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmplY3QpO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ2ltYWdlJywge1xyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9pbWFnZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNldDogZnVuY3Rpb24oaW1hZ2UpIHtcclxuXHJcbiAgICAgICAgICB2YXIgdGFnID0gaW1hZ2UgJiYgaW1hZ2Uubm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgIHZhciBpbmRleDtcclxuXHJcbiAgICAgICAgICBzd2l0Y2ggKHRhZykge1xyXG4gICAgICAgICAgICBjYXNlICdjYW52YXMnOlxyXG4gICAgICAgICAgICAgIGluZGV4ID0gJyMnICsgaW1hZ2UuaWQ7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgaW5kZXggPSBpbWFnZS5zcmM7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKFRleHR1cmUuSW1hZ2VSZWdpc3RyeS5jb250YWlucyhpbmRleCkpIHtcclxuICAgICAgICAgICAgdGhpcy5faW1hZ2UgPSBUZXh0dXJlLkltYWdlUmVnaXN0cnkuZ2V0KGltYWdlLnNyYyk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9pbWFnZSA9IGltYWdlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX2ZsYWdJbWFnZSA9IHRydWU7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ29mZnNldCcsIHtcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fb2Zmc2V0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5fb2Zmc2V0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX29mZnNldC51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdPZmZzZXQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdGhpcy5fb2Zmc2V0ID0gdjtcclxuICAgICAgICAgIHRoaXMuX29mZnNldC5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnT2Zmc2V0KTtcclxuICAgICAgICAgIHRoaXMuX2ZsYWdPZmZzZXQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnc2NhbGUnLCB7XHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3NjYWxlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2KSB7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuX3NjYWxlIGluc3RhbmNlb2YgVHdvLlZlY3Rvcikge1xyXG4gICAgICAgICAgICB0aGlzLl9zY2FsZS51bmJpbmQoVHdvLkV2ZW50cy5jaGFuZ2UsIHRoaXMuX3JlbmRlcmVyLmZsYWdTY2FsZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fc2NhbGUgPSB2O1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9zY2FsZSBpbnN0YW5jZW9mIFR3by5WZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2NhbGUuYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1NjYWxlKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB0aGlzLl9mbGFnU2NhbGUgPSB0cnVlO1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKFRleHR1cmUucHJvdG90eXBlLCBUd28uVXRpbHMuRXZlbnRzLCBUd28uU2hhcGUucHJvdG90eXBlLCB7XHJcblxyXG4gICAgX2ZsYWdTcmM6IGZhbHNlLFxyXG4gICAgX2ZsYWdJbWFnZTogZmFsc2UsXHJcbiAgICBfZmxhZ1ZpZGVvOiBmYWxzZSxcclxuICAgIF9mbGFnTG9hZGVkOiBmYWxzZSxcclxuICAgIF9mbGFnUmVwZWF0OiBmYWxzZSxcclxuXHJcbiAgICBfZmxhZ09mZnNldDogZmFsc2UsXHJcbiAgICBfZmxhZ1NjYWxlOiBmYWxzZSxcclxuXHJcbiAgICBfc3JjOiAnJyxcclxuICAgIF9pbWFnZTogbnVsbCxcclxuICAgIF9sb2FkZWQ6IGZhbHNlLFxyXG4gICAgX3JlcGVhdDogJ25vLXJlcGVhdCcsXHJcblxyXG4gICAgX3NjYWxlOiAxLFxyXG4gICAgX29mZnNldDogbnVsbCxcclxuXHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVGV4dHVyZSh0aGlzLnNyYyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBzcmM6IHRoaXMuc3JjLFxyXG4gICAgICAgIGltYWdlOiB0aGlzLmltYWdlXHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1NyYyB8fCB0aGlzLl9mbGFnSW1hZ2UgfHwgdGhpcy5fZmxhZ1ZpZGVvKSB7XHJcblxyXG4gICAgICAgIHRoaXMudHJpZ2dlcihUd28uRXZlbnRzLmNoYW5nZSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mbGFnU3JjIHx8IHRoaXMuX2ZsYWdJbWFnZSkge1xyXG4gICAgICAgICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcclxuICAgICAgICAgIFRleHR1cmUubG9hZCh0aGlzLCBfLmJpbmQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpc1xyXG4gICAgICAgICAgICAgIC50cmlnZ2VyKFR3by5FdmVudHMuY2hhbmdlKVxyXG4gICAgICAgICAgICAgIC50cmlnZ2VyKFR3by5FdmVudHMubG9hZCk7XHJcbiAgICAgICAgICB9LCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2ltYWdlICYmIHRoaXMuX2ltYWdlLnJlYWR5U3RhdGUgPj0gNCkge1xyXG4gICAgICAgIHRoaXMuX2ZsYWdWaWRlbyA9IHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdTcmMgPSB0aGlzLl9mbGFnSW1hZ2UgPSB0aGlzLl9mbGFnTG9hZGVkXHJcbiAgICAgICAgPSB0aGlzLl9mbGFnVmlkZW8gPSB0aGlzLl9mbGFnU2NhbGUgPSB0aGlzLl9mbGFnT2Zmc2V0ID0gZmFsc2U7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBUZXh0dXJlLk1ha2VPYnNlcnZhYmxlKFRleHR1cmUucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG4gIHZhciBQYXRoID0gVHdvLlBhdGg7XHJcbiAgdmFyIFJlY3RhbmdsZSA9IFR3by5SZWN0YW5nbGU7XHJcblxyXG4gIHZhciBTcHJpdGUgPSBUd28uU3ByaXRlID0gZnVuY3Rpb24ocGF0aCwgb3gsIG95LCBjb2xzLCByb3dzLCBmcmFtZVJhdGUpIHtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgW1xyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpXHJcbiAgICBdLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLm5vU3Ryb2tlKCk7XHJcbiAgICB0aGlzLm5vRmlsbCgpO1xyXG5cclxuICAgIGlmIChwYXRoIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgdGhpcy50ZXh0dXJlID0gcGF0aDtcclxuICAgIH0gZWxzZSBpZiAoXy5pc1N0cmluZyhwYXRoKSkge1xyXG4gICAgICB0aGlzLnRleHR1cmUgPSBuZXcgVHdvLlRleHR1cmUocGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldChveCB8fCAwLCBveSB8fCAwKTtcclxuXHJcbiAgICBpZiAoXy5pc051bWJlcihjb2xzKSkge1xyXG4gICAgICB0aGlzLmNvbHVtbnMgPSBjb2xzO1xyXG4gICAgfVxyXG4gICAgaWYgKF8uaXNOdW1iZXIocm93cykpIHtcclxuICAgICAgdGhpcy5yb3dzID0gcm93cztcclxuICAgIH1cclxuICAgIGlmIChfLmlzTnVtYmVyKGZyYW1lUmF0ZSkpIHtcclxuICAgICAgdGhpcy5mcmFtZVJhdGUgPSBmcmFtZVJhdGU7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKFNwcml0ZSwge1xyXG5cclxuICAgIFByb3BlcnRpZXM6IFtcclxuICAgICAgJ3RleHR1cmUnLCAnY29sdW1ucycsICdyb3dzJywgJ2ZyYW1lUmF0ZScsICdpbmRleCdcclxuICAgIF0sXHJcblxyXG4gICAgTWFrZU9ic2VydmFibGU6IGZ1bmN0aW9uKG9iaikge1xyXG5cclxuICAgICAgUmVjdGFuZ2xlLk1ha2VPYnNlcnZhYmxlKG9iaik7XHJcbiAgICAgIF8uZWFjaChTcHJpdGUuUHJvcGVydGllcywgVHdvLlV0aWxzLmRlZmluZVByb3BlcnR5LCBvYmopO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSlcclxuXHJcbiAgXy5leHRlbmQoU3ByaXRlLnByb3RvdHlwZSwgUmVjdGFuZ2xlLnByb3RvdHlwZSwge1xyXG5cclxuICAgIF9mbGFnVGV4dHVyZTogZmFsc2UsXHJcbiAgICBfZmxhZ0NvbHVtbnM6IGZhbHNlLFxyXG4gICAgX2ZsYWdSb3dzOiBmYWxzZSxcclxuICAgIF9mbGFnRnJhbWVSYXRlOiBmYWxzZSxcclxuICAgIGZsYWdJbmRleDogZmFsc2UsXHJcblxyXG4gICAgLy8gUHJpdmF0ZSB2YXJpYWJsZXNcclxuICAgIF9hbW91bnQ6IDEsXHJcbiAgICBfZHVyYXRpb246IDAsXHJcbiAgICBfc3RhcnRUaW1lOiAwLFxyXG4gICAgX3BsYXlpbmc6IGZhbHNlLFxyXG4gICAgX2ZpcnN0RnJhbWU6IDAsXHJcbiAgICBfbGFzdEZyYW1lOiAwLFxyXG4gICAgX2xvb3A6IHRydWUsXHJcblxyXG4gICAgLy8gRXhwb3NlZCB0aHJvdWdoIGdldHRlci1zZXR0ZXJcclxuICAgIF90ZXh0dXJlOiBudWxsLFxyXG4gICAgX2NvbHVtbnM6IDEsXHJcbiAgICBfcm93czogMSxcclxuICAgIF9mcmFtZVJhdGU6IDAsXHJcbiAgICBfaW5kZXg6IDAsXHJcblxyXG4gICAgcGxheTogZnVuY3Rpb24oZmlyc3RGcmFtZSwgbGFzdEZyYW1lLCBvbkxhc3RGcmFtZSkge1xyXG5cclxuICAgICAgdGhpcy5fcGxheWluZyA9IHRydWU7XHJcbiAgICAgIHRoaXMuX2ZpcnN0RnJhbWUgPSAwO1xyXG4gICAgICB0aGlzLl9sYXN0RnJhbWUgPSB0aGlzLmFtb3VudCAtIDE7XHJcbiAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IF8ucGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4gICAgICBpZiAoXy5pc051bWJlcihmaXJzdEZyYW1lKSkge1xyXG4gICAgICAgIHRoaXMuX2ZpcnN0RnJhbWUgPSBmaXJzdEZyYW1lO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChfLmlzTnVtYmVyKGxhc3RGcmFtZSkpIHtcclxuICAgICAgICB0aGlzLl9sYXN0RnJhbWUgPSBsYXN0RnJhbWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvbkxhc3RGcmFtZSkpIHtcclxuICAgICAgICB0aGlzLl9vbkxhc3RGcmFtZSA9IG9uTGFzdEZyYW1lO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLl9vbkxhc3RGcmFtZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2luZGV4ICE9PSB0aGlzLl9maXJzdEZyYW1lKSB7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lIC09IDEwMDAgKiBNYXRoLmFicyh0aGlzLl9pbmRleCAtIHRoaXMuX2ZpcnN0RnJhbWUpXHJcbiAgICAgICAgICAvIHRoaXMuX2ZyYW1lUmF0ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBwYXVzZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9wbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9wbGF5aW5nID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuX2luZGV4ID0gMDtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG5cclxuICAgICAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgdmFyIGNsb25lID0gbmV3IFNwcml0ZShcclxuICAgICAgICB0aGlzLnRleHR1cmUsIHRoaXMudHJhbnNsYXRpb24ueCwgdGhpcy50cmFuc2xhdGlvbi55LFxyXG4gICAgICAgIHRoaXMuY29sdW1ucywgdGhpcy5yb3dzLCB0aGlzLmZyYW1lUmF0ZVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKHRoaXMucGxheWluZykge1xyXG4gICAgICAgIGNsb25lLnBsYXkodGhpcy5fZmlyc3RGcmFtZSwgdGhpcy5fbGFzdEZyYW1lKTtcclxuICAgICAgICBjbG9uZS5fbG9vcCA9IHRoaXMuX2xvb3A7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICBwYXJlbnQuYWRkKGNsb25lKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGNsb25lO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgX3VwZGF0ZTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgZWZmZWN0ID0gdGhpcy5fdGV4dHVyZTtcclxuICAgICAgdmFyIGNvbHMgPSB0aGlzLl9jb2x1bW5zO1xyXG4gICAgICB2YXIgcm93cyA9IHRoaXMuX3Jvd3M7XHJcblxyXG4gICAgICB2YXIgd2lkdGgsIGhlaWdodCwgZWxhcHNlZCwgYW1vdW50LCBkdXJhdGlvbjtcclxuICAgICAgdmFyIGluZGV4LCBpdywgaWgsIGlzUmFuZ2UsIGZyYW1lcztcclxuXHJcbiAgICAgIGlmICh0aGlzLl9mbGFnQ29sdW1ucyB8fCB0aGlzLl9mbGFnUm93cykge1xyXG4gICAgICAgIHRoaXMuX2Ftb3VudCA9IHRoaXMuX2NvbHVtbnMgKiB0aGlzLl9yb3dzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ0ZyYW1lUmF0ZSkge1xyXG4gICAgICAgIHRoaXMuX2R1cmF0aW9uID0gMTAwMCAqIHRoaXMuX2Ftb3VudCAvIHRoaXMuX2ZyYW1lUmF0ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdUZXh0dXJlKSB7XHJcbiAgICAgICAgdGhpcy5maWxsID0gdGhpcy5fdGV4dHVyZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX3RleHR1cmUubG9hZGVkKSB7XHJcblxyXG4gICAgICAgIGl3ID0gZWZmZWN0LmltYWdlLndpZHRoO1xyXG4gICAgICAgIGloID0gZWZmZWN0LmltYWdlLmhlaWdodDtcclxuXHJcbiAgICAgICAgd2lkdGggPSBpdyAvIGNvbHM7XHJcbiAgICAgICAgaGVpZ2h0ID0gaWggLyByb3dzO1xyXG4gICAgICAgIGFtb3VudCA9IHRoaXMuX2Ftb3VudDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMud2lkdGggIT09IHdpZHRoKSB7XHJcbiAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmhlaWdodCAhPT0gaGVpZ2h0KSB7XHJcbiAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wbGF5aW5nICYmIHRoaXMuX2ZyYW1lUmF0ZSA+IDApIHtcclxuXHJcbiAgICAgICAgICBpZiAoXy5pc05hTih0aGlzLl9sYXN0RnJhbWUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RGcmFtZSA9IGFtb3VudCAtIDE7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gVE9ETzogT2ZmbG9hZCBwZXJmIGxvZ2ljIHRvIGluc3RhbmNlIG9mIGBUd29gLlxyXG4gICAgICAgICAgZWxhcHNlZCA9IF8ucGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9zdGFydFRpbWU7XHJcbiAgICAgICAgICBmcmFtZXMgPSB0aGlzLl9sYXN0RnJhbWUgKyAxO1xyXG4gICAgICAgICAgZHVyYXRpb24gPSAxMDAwICogKGZyYW1lcyAtIHRoaXMuX2ZpcnN0RnJhbWUpIC8gdGhpcy5fZnJhbWVSYXRlO1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLl9sb29wKSB7XHJcbiAgICAgICAgICAgIGVsYXBzZWQgPSBlbGFwc2VkICUgZHVyYXRpb247XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlbGFwc2VkID0gTWF0aC5taW4oZWxhcHNlZCwgZHVyYXRpb24pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGluZGV4ID0gXy5sZXJwKHRoaXMuX2ZpcnN0RnJhbWUsIGZyYW1lcywgZWxhcHNlZCAvIGR1cmF0aW9uKTtcclxuICAgICAgICAgIGluZGV4ID0gTWF0aC5mbG9vcihpbmRleCk7XHJcblxyXG4gICAgICAgICAgaWYgKGluZGV4ICE9PSB0aGlzLl9pbmRleCkge1xyXG4gICAgICAgICAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gdGhpcy5fbGFzdEZyYW1lIC0gMSAmJiB0aGlzLl9vbkxhc3RGcmFtZSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX29uTGFzdEZyYW1lKCk7ICAvLyBTaG9ydGN1dCBmb3IgY2hhaW5hYmxlIHNwcml0ZSBhbmltYXRpb25zXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY29sID0gdGhpcy5faW5kZXggJSBjb2xzO1xyXG4gICAgICAgIHZhciByb3cgPSBNYXRoLmZsb29yKHRoaXMuX2luZGV4IC8gY29scyk7XHJcblxyXG4gICAgICAgIHZhciBveCA9IC0gd2lkdGggKiBjb2wgKyAoaXcgLSB3aWR0aCkgLyAyO1xyXG4gICAgICAgIHZhciBveSA9IC0gaGVpZ2h0ICogcm93ICsgKGloIC0gaGVpZ2h0KSAvIDI7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IEltcHJvdmUgcGVyZm9ybWFuY2VcclxuICAgICAgICBpZiAob3ggIT09IGVmZmVjdC5vZmZzZXQueCkge1xyXG4gICAgICAgICAgZWZmZWN0Lm9mZnNldC54ID0gb3g7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChveSAhPT0gZWZmZWN0Lm9mZnNldC55KSB7XHJcbiAgICAgICAgICBlZmZlY3Qub2Zmc2V0LnkgPSBveTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBSZWN0YW5nbGUucHJvdG90eXBlLl91cGRhdGUuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgZmxhZ1Jlc2V0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHRoaXMuX2ZsYWdUZXh0dXJlID0gdGhpcy5fZmxhZ0NvbHVtbnMgPSB0aGlzLl9mbGFnUm93c1xyXG4gICAgICAgID0gdGhpcy5fZmxhZ0ZyYW1lUmF0ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5mbGFnUmVzZXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgfSk7XHJcblxyXG4gIFNwcml0ZS5NYWtlT2JzZXJ2YWJsZShTcHJpdGUucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIHZhciBfID0gVHdvLlV0aWxzO1xyXG4gIHZhciBQYXRoID0gVHdvLlBhdGg7XHJcbiAgdmFyIFJlY3RhbmdsZSA9IFR3by5SZWN0YW5nbGU7XHJcblxyXG4gIHZhciBJbWFnZVNlcXVlbmNlID0gVHdvLkltYWdlU2VxdWVuY2UgPSBmdW5jdGlvbihwYXRocywgb3gsIG95LCBmcmFtZVJhdGUpIHtcclxuXHJcbiAgICBQYXRoLmNhbGwodGhpcywgW1xyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpLFxyXG4gICAgICBuZXcgVHdvLkFuY2hvcigpXHJcbiAgICBdLCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLl9yZW5kZXJlci5mbGFnVGV4dHVyZXMgPSBfLmJpbmQoSW1hZ2VTZXF1ZW5jZS5GbGFnVGV4dHVyZXMsIHRoaXMpO1xyXG4gICAgdGhpcy5fcmVuZGVyZXIuYmluZFRleHR1cmVzID0gXy5iaW5kKEltYWdlU2VxdWVuY2UuQmluZFRleHR1cmVzLCB0aGlzKTtcclxuICAgIHRoaXMuX3JlbmRlcmVyLnVuYmluZFRleHR1cmVzID0gXy5iaW5kKEltYWdlU2VxdWVuY2UuVW5iaW5kVGV4dHVyZXMsIHRoaXMpO1xyXG5cclxuICAgIHRoaXMubm9TdHJva2UoKTtcclxuICAgIHRoaXMubm9GaWxsKCk7XHJcblxyXG4gICAgdGhpcy50ZXh0dXJlcyA9IF8ubWFwKHBhdGhzLCBJbWFnZVNlcXVlbmNlLkdlbmVyYXRlVGV4dHVyZSwgdGhpcyk7XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlKCk7XHJcbiAgICB0aGlzLnRyYW5zbGF0aW9uLnNldChveCB8fCAwLCBveSB8fCAwKTtcclxuXHJcbiAgICBpZiAoXy5pc051bWJlcihmcmFtZVJhdGUpKSB7XHJcbiAgICAgIHRoaXMuZnJhbWVSYXRlID0gZnJhbWVSYXRlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5mcmFtZVJhdGUgPSBJbWFnZVNlcXVlbmNlLkRlZmF1bHRGcmFtZVJhdGU7XHJcbiAgICB9XHJcblxyXG4gIH07XHJcblxyXG4gIF8uZXh0ZW5kKEltYWdlU2VxdWVuY2UsIHtcclxuXHJcbiAgICBQcm9wZXJ0aWVzOiBbXHJcbiAgICAgICdmcmFtZVJhdGUnLFxyXG4gICAgICAnaW5kZXgnXHJcbiAgICBdLFxyXG5cclxuICAgIERlZmF1bHRGcmFtZVJhdGU6IDMwLFxyXG5cclxuICAgIEZsYWdUZXh0dXJlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuX2ZsYWdUZXh0dXJlcyA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIEJpbmRUZXh0dXJlczogZnVuY3Rpb24oaXRlbXMpIHtcclxuXHJcbiAgICAgIHZhciBpID0gaXRlbXMubGVuZ3RoO1xyXG4gICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgaXRlbXNbaV0uYmluZChUd28uRXZlbnRzLmNoYW5nZSwgdGhpcy5fcmVuZGVyZXIuZmxhZ1RleHR1cmVzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5fcmVuZGVyZXIuZmxhZ1RleHR1cmVzKCk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBVbmJpbmRUZXh0dXJlczogZnVuY3Rpb24oaXRlbXMpIHtcclxuXHJcbiAgICAgIHZhciBpID0gaXRlbXMubGVuZ3RoO1xyXG4gICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgaXRlbXNbaV0udW5iaW5kKFR3by5FdmVudHMuY2hhbmdlLCB0aGlzLl9yZW5kZXJlci5mbGFnVGV4dHVyZXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9yZW5kZXJlci5mbGFnVGV4dHVyZXMoKTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIE1ha2VPYnNlcnZhYmxlOiBmdW5jdGlvbihvYmopIHtcclxuXHJcbiAgICAgIFJlY3RhbmdsZS5NYWtlT2JzZXJ2YWJsZShvYmopO1xyXG4gICAgICBfLmVhY2goSW1hZ2VTZXF1ZW5jZS5Qcm9wZXJ0aWVzLCBUd28uVXRpbHMuZGVmaW5lUHJvcGVydHksIG9iaik7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCAndGV4dHVyZXMnLCB7XHJcblxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5fdGV4dHVyZXM7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih0ZXh0dXJlcykge1xyXG5cclxuICAgICAgICAgIHZhciB1cGRhdGVUZXh0dXJlcyA9IHRoaXMuX3JlbmRlcmVyLmZsYWdUZXh0dXJlcztcclxuICAgICAgICAgIHZhciBiaW5kVGV4dHVyZXMgPSB0aGlzLl9yZW5kZXJlci5iaW5kVGV4dHVyZXM7XHJcbiAgICAgICAgICB2YXIgdW5iaW5kVGV4dHVyZXMgPSB0aGlzLl9yZW5kZXJlci51bmJpbmRUZXh0dXJlcztcclxuXHJcbiAgICAgICAgICAvLyBSZW1vdmUgcHJldmlvdXMgbGlzdGVuZXJzXHJcbiAgICAgICAgICBpZiAodGhpcy5fdGV4dHVyZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5fdGV4dHVyZXNcclxuICAgICAgICAgICAgICAudW5iaW5kKFR3by5FdmVudHMuaW5zZXJ0LCBiaW5kVGV4dHVyZXMpXHJcbiAgICAgICAgICAgICAgLnVuYmluZChUd28uRXZlbnRzLnJlbW92ZSwgdW5iaW5kVGV4dHVyZXMpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIENyZWF0ZSBuZXcgQ29sbGVjdGlvbiB3aXRoIGNvcHkgb2YgdmVydGljZXNcclxuICAgICAgICAgIHRoaXMuX3RleHR1cmVzID0gbmV3IFR3by5VdGlscy5Db2xsZWN0aW9uKCh0ZXh0dXJlcyB8fCBbXSkuc2xpY2UoMCkpO1xyXG5cclxuICAgICAgICAgIC8vIExpc3RlbiBmb3IgQ29sbGVjdGlvbiBjaGFuZ2VzIGFuZCBiaW5kIC8gdW5iaW5kXHJcbiAgICAgICAgICB0aGlzLl90ZXh0dXJlc1xyXG4gICAgICAgICAgICAuYmluZChUd28uRXZlbnRzLmluc2VydCwgYmluZFRleHR1cmVzKVxyXG4gICAgICAgICAgICAuYmluZChUd28uRXZlbnRzLnJlbW92ZSwgdW5iaW5kVGV4dHVyZXMpO1xyXG5cclxuICAgICAgICAgIC8vIEJpbmQgSW5pdGlhbCBUZXh0dXJlc1xyXG4gICAgICAgICAgYmluZFRleHR1cmVzKHRoaXMuX3RleHR1cmVzKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICBHZW5lcmF0ZVRleHR1cmU6IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICBpZiAob2JqIGluc3RhbmNlb2YgVHdvLlRleHR1cmUpIHtcclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgICB9IGVsc2UgaWYgKF8uaXNTdHJpbmcob2JqKSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgVHdvLlRleHR1cmUob2JqKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgXy5leHRlbmQoSW1hZ2VTZXF1ZW5jZS5wcm90b3R5cGUsIFJlY3RhbmdsZS5wcm90b3R5cGUsIHtcclxuXHJcbiAgICBfZmxhZ1RleHR1cmVzOiBmYWxzZSxcclxuICAgIF9mbGFnRnJhbWVSYXRlOiBmYWxzZSxcclxuICAgIF9mbGFnSW5kZXg6IGZhbHNlLFxyXG5cclxuICAgIC8vIFByaXZhdGUgdmFyaWFibGVzXHJcbiAgICBfYW1vdW50OiAxLFxyXG4gICAgX2R1cmF0aW9uOiAwLFxyXG4gICAgX2luZGV4OiAwLFxyXG4gICAgX3N0YXJ0VGltZTogMCxcclxuICAgIF9wbGF5aW5nOiBmYWxzZSxcclxuICAgIF9maXJzdEZyYW1lOiAwLFxyXG4gICAgX2xhc3RGcmFtZTogMCxcclxuICAgIF9sb29wOiB0cnVlLFxyXG5cclxuICAgIC8vIEV4cG9zZWQgdGhyb3VnaCBnZXR0ZXItc2V0dGVyXHJcbiAgICBfdGV4dHVyZXM6IG51bGwsXHJcbiAgICBfZnJhbWVSYXRlOiAwLFxyXG5cclxuICAgIHBsYXk6IGZ1bmN0aW9uKGZpcnN0RnJhbWUsIGxhc3RGcmFtZSwgb25MYXN0RnJhbWUpIHtcclxuXHJcbiAgICAgIHRoaXMuX3BsYXlpbmcgPSB0cnVlO1xyXG4gICAgICB0aGlzLl9maXJzdEZyYW1lID0gMDtcclxuICAgICAgdGhpcy5fbGFzdEZyYW1lID0gdGhpcy5hbW91bnQgLSAxO1xyXG4gICAgICB0aGlzLl9zdGFydFRpbWUgPSBfLnBlcmZvcm1hbmNlLm5vdygpO1xyXG5cclxuICAgICAgaWYgKF8uaXNOdW1iZXIoZmlyc3RGcmFtZSkpIHtcclxuICAgICAgICB0aGlzLl9maXJzdEZyYW1lID0gZmlyc3RGcmFtZTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoXy5pc051bWJlcihsYXN0RnJhbWUpKSB7XHJcbiAgICAgICAgdGhpcy5fbGFzdEZyYW1lID0gbGFzdEZyYW1lO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob25MYXN0RnJhbWUpKSB7XHJcbiAgICAgICAgdGhpcy5fb25MYXN0RnJhbWUgPSBvbkxhc3RGcmFtZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5fb25MYXN0RnJhbWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLl9pbmRleCAhPT0gdGhpcy5fZmlyc3RGcmFtZSkge1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZSAtPSAxMDAwICogTWF0aC5hYnModGhpcy5faW5kZXggLSB0aGlzLl9maXJzdEZyYW1lKVxyXG4gICAgICAgICAgLyB0aGlzLl9mcmFtZVJhdGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgcGF1c2U6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fcGxheWluZyA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdGhpcy5fcGxheWluZyA9IGZhbHNlO1xyXG4gICAgICB0aGlzLl9pbmRleCA9IDA7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuXHJcbiAgICAgIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudDtcclxuXHJcbiAgICAgIHZhciBjbG9uZSA9IG5ldyBJbWFnZVNlcXVlbmNlKHRoaXMudGV4dHVyZXMsIHRoaXMudHJhbnNsYXRpb24ueCxcclxuICAgICAgICB0aGlzLnRyYW5zbGF0aW9uLnksIHRoaXMuZnJhbWVSYXRlKVxyXG5cclxuICAgICAgICBjbG9uZS5fbG9vcCA9IHRoaXMuX2xvb3A7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9wbGF5aW5nKSB7XHJcbiAgICAgICAgICBjbG9uZS5wbGF5KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocGFyZW50KSB7XHJcbiAgICAgICAgICBwYXJlbnQuYWRkKGNsb25lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjbG9uZTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyIGVmZmVjdHMgPSB0aGlzLl90ZXh0dXJlcztcclxuICAgICAgdmFyIHdpZHRoLCBoZWlnaHQsIGVsYXBzZWQsIGFtb3VudCwgZHVyYXRpb24sIHRleHR1cmU7XHJcbiAgICAgIHZhciBpbmRleCwgZnJhbWVzO1xyXG5cclxuICAgICAgaWYgKHRoaXMuX2ZsYWdUZXh0dXJlcykge1xyXG4gICAgICAgIHRoaXMuX2Ftb3VudCA9IGVmZmVjdHMubGVuZ3RoO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ0ZyYW1lUmF0ZSkge1xyXG4gICAgICAgIHRoaXMuX2R1cmF0aW9uID0gMTAwMCAqIHRoaXMuX2Ftb3VudCAvIHRoaXMuX2ZyYW1lUmF0ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMuX3BsYXlpbmcgJiYgdGhpcy5fZnJhbWVSYXRlID4gMCkge1xyXG5cclxuICAgICAgICBhbW91bnQgPSB0aGlzLl9hbW91bnQ7XHJcblxyXG4gICAgICAgIGlmIChfLmlzTmFOKHRoaXMuX2xhc3RGcmFtZSkpIHtcclxuICAgICAgICAgIHRoaXMuX2xhc3RGcmFtZSA9IGFtb3VudCAtIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBUT0RPOiBPZmZsb2FkIHBlcmYgbG9naWMgdG8gaW5zdGFuY2Ugb2YgYFR3b2AuXHJcbiAgICAgICAgZWxhcHNlZCA9IF8ucGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9zdGFydFRpbWU7XHJcbiAgICAgICAgZnJhbWVzID0gdGhpcy5fbGFzdEZyYW1lICsgMTtcclxuICAgICAgICBkdXJhdGlvbiA9IDEwMDAgKiAoZnJhbWVzIC0gdGhpcy5fZmlyc3RGcmFtZSkgLyB0aGlzLl9mcmFtZVJhdGU7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9sb29wKSB7XHJcbiAgICAgICAgICBlbGFwc2VkID0gZWxhcHNlZCAlIGR1cmF0aW9uO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBlbGFwc2VkID0gTWF0aC5taW4oZWxhcHNlZCwgZHVyYXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5kZXggPSBfLmxlcnAodGhpcy5fZmlyc3RGcmFtZSwgZnJhbWVzLCBlbGFwc2VkIC8gZHVyYXRpb24pO1xyXG4gICAgICAgIGluZGV4ID0gTWF0aC5mbG9vcihpbmRleCk7XHJcblxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gdGhpcy5faW5kZXgpIHtcclxuXHJcbiAgICAgICAgICB0aGlzLl9pbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgdGV4dHVyZSA9IGVmZmVjdHNbdGhpcy5faW5kZXhdO1xyXG5cclxuICAgICAgICAgIGlmICh0ZXh0dXJlLmxvYWRlZCkge1xyXG5cclxuICAgICAgICAgICAgd2lkdGggPSB0ZXh0dXJlLmltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICBoZWlnaHQgPSB0ZXh0dXJlLmltYWdlLmhlaWdodDtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLndpZHRoICE9PSB3aWR0aCkge1xyXG4gICAgICAgICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5oZWlnaHQgIT09IGhlaWdodCkge1xyXG4gICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZpbGwgPSB0ZXh0dXJlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGluZGV4ID49IHRoaXMuX2xhc3RGcmFtZSAtIDEgJiYgdGhpcy5fb25MYXN0RnJhbWUpIHtcclxuICAgICAgICAgICAgICB0aGlzLl9vbkxhc3RGcmFtZSgpOyAgLy8gU2hvcnRjdXQgZm9yIGNoYWluYWJsZSBzcHJpdGUgYW5pbWF0aW9uc1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2ZsYWdJbmRleCB8fCAhKHRoaXMuZmlsbCBpbnN0YW5jZW9mIFR3by5UZXh0dXJlKSkge1xyXG5cclxuICAgICAgICB0ZXh0dXJlID0gZWZmZWN0c1t0aGlzLl9pbmRleF07XHJcblxyXG4gICAgICAgIGlmICh0ZXh0dXJlLmxvYWRlZCkge1xyXG5cclxuICAgICAgICAgIHdpZHRoID0gdGV4dHVyZS5pbWFnZS53aWR0aDtcclxuICAgICAgICAgIGhlaWdodCA9IHRleHR1cmUuaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLndpZHRoICE9PSB3aWR0aCkge1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAodGhpcy5oZWlnaHQgIT09IGhlaWdodCkge1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZpbGwgPSB0ZXh0dXJlO1xyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5fdXBkYXRlLmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB0aGlzLl9mbGFnVGV4dHVyZXMgPSB0aGlzLl9mbGFnRnJhbWVSYXRlID0gZmFsc2U7XHJcbiAgICAgIFJlY3RhbmdsZS5wcm90b3R5cGUuZmxhZ1Jlc2V0LmNhbGwodGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9XHJcblxyXG4gIH0pO1xyXG5cclxuICBJbWFnZVNlcXVlbmNlLk1ha2VPYnNlcnZhYmxlKEltYWdlU2VxdWVuY2UucHJvdG90eXBlKTtcclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcblxyXG4oZnVuY3Rpb24oVHdvKSB7XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0YW50c1xyXG4gICAqL1xyXG4gIHZhciBtaW4gPSBNYXRoLm1pbiwgbWF4ID0gTWF0aC5tYXg7XHJcbiAgdmFyIF8gPSBUd28uVXRpbHM7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgY2hpbGRyZW4gY29sbGVjdGlvbiB3aGljaCBpcyBhY2Nlc2libGUgYm90aCBieSBpbmRleCBhbmQgYnkgb2JqZWN0IGlkXHJcbiAgICogQGNvbnN0cnVjdG9yXHJcbiAgICovXHJcbiAgdmFyIENoaWxkcmVuID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgVHdvLlV0aWxzLkNvbGxlY3Rpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ19ldmVudHMnLCB7XHJcbiAgICAgIHZhbHVlIDoge30sXHJcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmlkcyA9IHt9O1xyXG5cclxuICAgIHRoaXMub24oVHdvLkV2ZW50cy5pbnNlcnQsIHRoaXMuYXR0YWNoKTtcclxuICAgIHRoaXMub24oVHdvLkV2ZW50cy5yZW1vdmUsIHRoaXMuZGV0YWNoKTtcclxuICAgIENoaWxkcmVuLnByb3RvdHlwZS5hdHRhY2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgQ2hpbGRyZW4ucHJvdG90eXBlID0gbmV3IFR3by5VdGlscy5Db2xsZWN0aW9uKCk7XHJcbiAgQ2hpbGRyZW4ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ2hpbGRyZW47XHJcblxyXG4gIF8uZXh0ZW5kKENoaWxkcmVuLnByb3RvdHlwZSwge1xyXG5cclxuICAgIGF0dGFjaDogZnVuY3Rpb24oY2hpbGRyZW4pIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRoaXMuaWRzW2NoaWxkcmVuW2ldLmlkXSA9IGNoaWxkcmVuW2ldO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZXRhY2g6IGZ1bmN0aW9uKGNoaWxkcmVuKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBkZWxldGUgdGhpcy5pZHNbY2hpbGRyZW5baV0uaWRdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgdmFyIEdyb3VwID0gVHdvLkdyb3VwID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgVHdvLlNoYXBlLmNhbGwodGhpcywgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5fcmVuZGVyZXIudHlwZSA9ICdncm91cCc7XHJcblxyXG4gICAgdGhpcy5hZGRpdGlvbnMgPSBbXTtcclxuICAgIHRoaXMuc3VidHJhY3Rpb25zID0gW107XHJcblxyXG4gICAgdGhpcy5jaGlsZHJlbiA9IGFyZ3VtZW50cztcclxuXHJcbiAgfTtcclxuXHJcbiAgXy5leHRlbmQoR3JvdXAsIHtcclxuXHJcbiAgICBDaGlsZHJlbjogQ2hpbGRyZW4sXHJcblxyXG4gICAgSW5zZXJ0Q2hpbGRyZW46IGZ1bmN0aW9uKGNoaWxkcmVuKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICByZXBsYWNlUGFyZW50LmNhbGwodGhpcywgY2hpbGRyZW5baV0sIHRoaXMpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIFJlbW92ZUNoaWxkcmVuOiBmdW5jdGlvbihjaGlsZHJlbikge1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgcmVwbGFjZVBhcmVudC5jYWxsKHRoaXMsIGNoaWxkcmVuW2ldKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBPcmRlckNoaWxkcmVuOiBmdW5jdGlvbihjaGlsZHJlbikge1xyXG4gICAgICB0aGlzLl9mbGFnT3JkZXIgPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBNYWtlT2JzZXJ2YWJsZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcblxyXG4gICAgICB2YXIgcHJvcGVydGllcyA9IFR3by5QYXRoLlByb3BlcnRpZXMuc2xpY2UoMCk7XHJcbiAgICAgIHZhciBvaSA9IF8uaW5kZXhPZihwcm9wZXJ0aWVzLCAnb3BhY2l0eScpO1xyXG5cclxuICAgICAgaWYgKG9pID49IDApIHtcclxuXHJcbiAgICAgICAgcHJvcGVydGllcy5zcGxpY2Uob2ksIDEpO1xyXG5cclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnb3BhY2l0eScsIHtcclxuXHJcbiAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG5cclxuICAgICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vcGFjaXR5O1xyXG4gICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgLy8gT25seSBzZXQgZmxhZyBpZiB0aGVyZSBpcyBhbiBhY3R1YWwgZGlmZmVyZW5jZVxyXG4gICAgICAgICAgICB0aGlzLl9mbGFnT3BhY2l0eSA9ICh0aGlzLl9vcGFjaXR5ICE9IHYpO1xyXG4gICAgICAgICAgICB0aGlzLl9vcGFjaXR5ID0gdjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICBUd28uU2hhcGUuTWFrZU9ic2VydmFibGUob2JqZWN0KTtcclxuICAgICAgR3JvdXAuTWFrZUdldHRlclNldHRlcnMob2JqZWN0LCBwcm9wZXJ0aWVzKTtcclxuXHJcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsICdjaGlsZHJlbicsIHtcclxuXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9jaGlsZHJlbjtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKGNoaWxkcmVuKSB7XHJcblxyXG4gICAgICAgICAgdmFyIGluc2VydENoaWxkcmVuID0gXy5iaW5kKEdyb3VwLkluc2VydENoaWxkcmVuLCB0aGlzKTtcclxuICAgICAgICAgIHZhciByZW1vdmVDaGlsZHJlbiA9IF8uYmluZChHcm91cC5SZW1vdmVDaGlsZHJlbiwgdGhpcyk7XHJcbiAgICAgICAgICB2YXIgb3JkZXJDaGlsZHJlbiA9IF8uYmluZChHcm91cC5PcmRlckNoaWxkcmVuLCB0aGlzKTtcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5fY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgdGhpcy5fY2hpbGRyZW4udW5iaW5kKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdGhpcy5fY2hpbGRyZW4gPSBuZXcgQ2hpbGRyZW4oY2hpbGRyZW4pO1xyXG4gICAgICAgICAgdGhpcy5fY2hpbGRyZW4uYmluZChUd28uRXZlbnRzLmluc2VydCwgaW5zZXJ0Q2hpbGRyZW4pO1xyXG4gICAgICAgICAgdGhpcy5fY2hpbGRyZW4uYmluZChUd28uRXZlbnRzLnJlbW92ZSwgcmVtb3ZlQ2hpbGRyZW4pO1xyXG4gICAgICAgICAgdGhpcy5fY2hpbGRyZW4uYmluZChUd28uRXZlbnRzLm9yZGVyLCBvcmRlckNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCAnbWFzaycsIHtcclxuXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLl9tYXNrO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpcy5fbWFzayA9IHY7XHJcbiAgICAgICAgICB0aGlzLl9mbGFnTWFzayA9IHRydWU7XHJcbiAgICAgICAgICBpZiAoIXYuY2xpcCkge1xyXG4gICAgICAgICAgICB2LmNsaXAgPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgTWFrZUdldHRlclNldHRlcnM6IGZ1bmN0aW9uKGdyb3VwLCBwcm9wZXJ0aWVzKSB7XHJcblxyXG4gICAgICBpZiAoIV8uaXNBcnJheShwcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgIHByb3BlcnRpZXMgPSBbcHJvcGVydGllc107XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIF8uZWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbihrKSB7XHJcbiAgICAgICAgR3JvdXAuTWFrZUdldHRlclNldHRlcihncm91cCwgayk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgTWFrZUdldHRlclNldHRlcjogZnVuY3Rpb24oZ3JvdXAsIGspIHtcclxuXHJcbiAgICAgIHZhciBzZWNyZXQgPSAnXycgKyBrO1xyXG5cclxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGdyb3VwLCBrLCB7XHJcblxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcblxyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICByZXR1cm4gdGhpc1tzZWNyZXRdO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIHNldDogZnVuY3Rpb24odikge1xyXG4gICAgICAgICAgdGhpc1tzZWNyZXRdID0gdjtcclxuICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkgeyAvLyBUcmlja2xlIGRvd24gc3R5bGVzXHJcbiAgICAgICAgICAgIGNoaWxkW2tdID0gdjtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfSk7XHJcblxyXG4gIF8uZXh0ZW5kKEdyb3VwLnByb3RvdHlwZSwgVHdvLlNoYXBlLnByb3RvdHlwZSwge1xyXG5cclxuICAgIC8vIEZsYWdzXHJcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0ZsYWdcclxuXHJcbiAgICBfZmxhZ0FkZGl0aW9uczogZmFsc2UsXHJcbiAgICBfZmxhZ1N1YnRyYWN0aW9uczogZmFsc2UsXHJcbiAgICBfZmxhZ09yZGVyOiBmYWxzZSxcclxuICAgIF9mbGFnT3BhY2l0eTogdHJ1ZSxcclxuXHJcbiAgICBfZmxhZ01hc2s6IGZhbHNlLFxyXG5cclxuICAgIC8vIFVuZGVybHlpbmcgUHJvcGVydGllc1xyXG5cclxuICAgIF9maWxsOiAnI2ZmZicsXHJcbiAgICBfc3Ryb2tlOiAnIzAwMCcsXHJcbiAgICBfbGluZXdpZHRoOiAxLjAsXHJcbiAgICBfb3BhY2l0eTogMS4wLFxyXG4gICAgX3Zpc2libGU6IHRydWUsXHJcblxyXG4gICAgX2NhcDogJ3JvdW5kJyxcclxuICAgIF9qb2luOiAncm91bmQnLFxyXG4gICAgX21pdGVyOiA0LFxyXG5cclxuICAgIF9jbG9zZWQ6IHRydWUsXHJcbiAgICBfY3VydmVkOiBmYWxzZSxcclxuICAgIF9hdXRvbWF0aWM6IHRydWUsXHJcbiAgICBfYmVnaW5uaW5nOiAwLFxyXG4gICAgX2VuZGluZzogMS4wLFxyXG5cclxuICAgIF9tYXNrOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVE9ETzogR3JvdXAgaGFzIGEgZ290Y2hhIGluIHRoYXQgaXQncyBhdCB0aGUgbW9tZW50IHJlcXVpcmVkIHRvIGJlIGJvdW5kIHRvXHJcbiAgICAgKiBhbiBpbnN0YW5jZSBvZiB0d28gaW4gb3JkZXIgdG8gYWRkIGVsZW1lbnRzIGNvcnJlY3RseS4gVGhpcyBuZWVkcyB0b1xyXG4gICAgICogYmUgcmV0aG91Z2h0IGFuZCBmaXhlZC5cclxuICAgICAqL1xyXG4gICAgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG5cclxuICAgICAgcGFyZW50ID0gcGFyZW50IHx8IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgdmFyIGdyb3VwID0gbmV3IEdyb3VwKCk7XHJcbiAgICAgIHZhciBjaGlsZHJlbiA9IF8ubWFwKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgcmV0dXJuIGNoaWxkLmNsb25lKGdyb3VwKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBncm91cC5hZGQoY2hpbGRyZW4pO1xyXG5cclxuICAgICAgZ3JvdXAub3BhY2l0eSA9IHRoaXMub3BhY2l0eTtcclxuXHJcbiAgICAgIGlmICh0aGlzLm1hc2spIHtcclxuICAgICAgICBncm91cC5tYXNrID0gdGhpcy5tYXNrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBncm91cC50cmFuc2xhdGlvbi5jb3B5KHRoaXMudHJhbnNsYXRpb24pO1xyXG4gICAgICBncm91cC5yb3RhdGlvbiA9IHRoaXMucm90YXRpb247XHJcbiAgICAgIGdyb3VwLnNjYWxlID0gdGhpcy5zY2FsZTtcclxuXHJcbiAgICAgIGlmIChwYXJlbnQpIHtcclxuICAgICAgICBwYXJlbnQuYWRkKGdyb3VwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGdyb3VwO1xyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeHBvcnQgdGhlIGRhdGEgZnJvbSB0aGUgaW5zdGFuY2Ugb2YgVHdvLkdyb3VwIGludG8gYSBwbGFpbiBKYXZhU2NyaXB0XHJcbiAgICAgKiBvYmplY3QuIFRoaXMgYWxzbyBtYWtlcyBhbGwgY2hpbGRyZW4gcGxhaW4gSmF2YVNjcmlwdCBvYmplY3RzLiBHcmVhdFxyXG4gICAgICogZm9yIHR1cm5pbmcgaW50byBKU09OIGFuZCBzdG9yaW5nIGluIGEgZGF0YWJhc2UuXHJcbiAgICAgKi9cclxuICAgIHRvT2JqZWN0OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgY2hpbGRyZW46IFtdLFxyXG4gICAgICAgIHRyYW5zbGF0aW9uOiB0aGlzLnRyYW5zbGF0aW9uLnRvT2JqZWN0KCksXHJcbiAgICAgICAgcm90YXRpb246IHRoaXMucm90YXRpb24sXHJcbiAgICAgICAgc2NhbGU6IHRoaXMuc2NhbGUsXHJcbiAgICAgICAgb3BhY2l0eTogdGhpcy5vcGFjaXR5LFxyXG4gICAgICAgIG1hc2s6ICh0aGlzLm1hc2sgPyB0aGlzLm1hc2sudG9PYmplY3QoKSA6IG51bGwpXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQsIGkpIHtcclxuICAgICAgICByZXN1bHQuY2hpbGRyZW5baV0gPSBjaGlsZC50b09iamVjdCgpO1xyXG4gICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFuY2hvciBhbGwgY2hpbGRyZW4gdG8gdGhlIHVwcGVyIGxlZnQgaGFuZCBjb3JuZXJcclxuICAgICAqIG9mIHRoZSBncm91cC5cclxuICAgICAqL1xyXG4gICAgY29ybmVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZWN0ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QodHJ1ZSksXHJcbiAgICAgICBjb3JuZXIgPSB7IHg6IHJlY3QubGVmdCwgeTogcmVjdC50b3AgfTtcclxuXHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNoaWxkLnRyYW5zbGF0aW9uLnN1YlNlbGYoY29ybmVyKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQW5jaG9ycyBhbGwgY2hpbGRyZW4gYXJvdW5kIHRoZSBjZW50ZXIgb2YgdGhlIGdyb3VwLFxyXG4gICAgICogZWZmZWN0aXZlbHkgcGxhY2luZyB0aGUgc2hhcGUgYXJvdW5kIHRoZSB1bml0IGNpcmNsZS5cclxuICAgICAqL1xyXG4gICAgY2VudGVyOiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciByZWN0ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QodHJ1ZSk7XHJcblxyXG4gICAgICByZWN0LmNlbnRyb2lkID0ge1xyXG4gICAgICAgIHg6IHJlY3QubGVmdCArIHJlY3Qud2lkdGggLyAyLFxyXG4gICAgICAgIHk6IHJlY3QudG9wICsgcmVjdC5oZWlnaHQgLyAyXHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBpZiAoY2hpbGQuaXNTaGFwZSkge1xyXG4gICAgICAgICAgY2hpbGQudHJhbnNsYXRpb24uc3ViU2VsZihyZWN0LmNlbnRyb2lkKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gdGhpcy50cmFuc2xhdGlvbi5jb3B5KHJlY3QuY2VudHJvaWQpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlY3Vyc2l2ZWx5IHNlYXJjaCBmb3IgaWQuIFJldHVybnMgdGhlIGZpcnN0IGVsZW1lbnQgZm91bmQuXHJcbiAgICAgKiBSZXR1cm5zIG51bGwgaWYgbm9uZSBmb3VuZC5cclxuICAgICAqL1xyXG4gICAgZ2V0QnlJZDogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICAgIHZhciBzZWFyY2ggPSBmdW5jdGlvbiAobm9kZSwgaWQpIHtcclxuICAgICAgICBpZiAobm9kZS5pZCA9PT0gaWQpIHtcclxuICAgICAgICAgIHJldHVybiBub2RlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgdmFyIGkgPSBub2RlLmNoaWxkcmVuLmxlbmd0aDtcclxuICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgdmFyIGZvdW5kID0gc2VhcmNoKG5vZGUuY2hpbGRyZW5baV0sIGlkKTtcclxuICAgICAgICAgICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIHNlYXJjaCh0aGlzLCBpZCkgfHwgbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWN1cnNpdmVseSBzZWFyY2ggZm9yIGNsYXNzZXMuIFJldHVybnMgYW4gYXJyYXkgb2YgbWF0Y2hpbmcgZWxlbWVudHMuXHJcbiAgICAgKiBFbXB0eSBhcnJheSBpZiBub25lIGZvdW5kLlxyXG4gICAgICovXHJcbiAgICBnZXRCeUNsYXNzTmFtZTogZnVuY3Rpb24gKGNsKSB7XHJcbiAgICAgIHZhciBmb3VuZCA9IFtdO1xyXG4gICAgICB2YXIgc2VhcmNoID0gZnVuY3Rpb24gKG5vZGUsIGNsKSB7XHJcbiAgICAgICAgaWYgKG5vZGUuY2xhc3NMaXN0LmluZGV4T2YoY2wpICE9IC0xKSB7XHJcbiAgICAgICAgICBmb3VuZC5wdXNoKG5vZGUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5jaGlsZHJlbikge1xyXG4gICAgICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZCkge1xyXG4gICAgICAgICAgICBzZWFyY2goY2hpbGQsIGNsKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZm91bmQ7XHJcbiAgICAgIH07XHJcbiAgICAgIHJldHVybiBzZWFyY2godGhpcywgY2wpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlY3Vyc2l2ZWx5IHNlYXJjaCBmb3IgY2hpbGRyZW4gb2YgYSBzcGVjaWZpYyB0eXBlLFxyXG4gICAgICogZS5nLiBUd28uUG9seWdvbi4gUGFzcyBhIHJlZmVyZW5jZSB0byB0aGlzIHR5cGUgYXMgdGhlIHBhcmFtLlxyXG4gICAgICogUmV0dXJucyBhbiBlbXB0eSBhcnJheSBpZiBub25lIGZvdW5kLlxyXG4gICAgICovXHJcbiAgICBnZXRCeVR5cGU6IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgdmFyIGZvdW5kID0gW107XHJcbiAgICAgIHZhciBzZWFyY2ggPSBmdW5jdGlvbiAobm9kZSwgdHlwZSkge1xyXG4gICAgICAgIGZvciAodmFyIGlkIGluIG5vZGUuY2hpbGRyZW4pIHtcclxuICAgICAgICAgIGlmIChub2RlLmNoaWxkcmVuW2lkXSBpbnN0YW5jZW9mIHR5cGUpIHtcclxuICAgICAgICAgICAgZm91bmQucHVzaChub2RlLmNoaWxkcmVuW2lkXSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKG5vZGUuY2hpbGRyZW5baWRdIGluc3RhbmNlb2YgVHdvLkdyb3VwKSB7XHJcbiAgICAgICAgICAgIHNlYXJjaChub2RlLmNoaWxkcmVuW2lkXSwgdHlwZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmb3VuZDtcclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIHNlYXJjaCh0aGlzLCB0eXBlKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQgb2JqZWN0cyB0byB0aGUgZ3JvdXAuXHJcbiAgICAgKi9cclxuICAgIGFkZDogZnVuY3Rpb24ob2JqZWN0cykge1xyXG5cclxuICAgICAgLy8gQWxsb3cgdG8gcGFzcyBtdWx0aXBsZSBvYmplY3RzIGVpdGhlciBhcyBhcnJheSBvciBhcyBtdWx0aXBsZSBhcmd1bWVudHNcclxuICAgICAgLy8gSWYgaXQncyBhbiBhcnJheSBhbHNvIGNyZWF0ZSBjb3B5IG9mIGl0IGluIGNhc2Ugd2UncmUgZ2V0dGluZyBwYXNzZWRcclxuICAgICAgLy8gYSBjaGlsZHJlbnMgYXJyYXkgZGlyZWN0bHkuXHJcbiAgICAgIGlmICghKG9iamVjdHMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICBvYmplY3RzID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgb2JqZWN0cyA9IG9iamVjdHMuc2xpY2UoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQWRkIHRoZSBvYmplY3RzXHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqZWN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICghKG9iamVjdHNbaV0gJiYgb2JqZWN0c1tpXS5pZCkpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChvYmplY3RzW2ldKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBvYmplY3RzIGZyb20gdGhlIGdyb3VwLlxyXG4gICAgICovXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKG9iamVjdHMpIHtcclxuXHJcbiAgICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aCxcclxuICAgICAgICBncmFuZHBhcmVudCA9IHRoaXMucGFyZW50O1xyXG5cclxuICAgICAgLy8gQWxsb3cgdG8gY2FsbCByZW1vdmUgd2l0aG91dCBhcmd1bWVudHNcclxuICAgICAgLy8gVGhpcyB3aWxsIGRldGFjaCB0aGUgb2JqZWN0IGZyb20gdGhlIHNjZW5lLlxyXG4gICAgICBpZiAobCA8PSAwICYmIGdyYW5kcGFyZW50KSB7XHJcbiAgICAgICAgZ3JhbmRwYXJlbnQucmVtb3ZlKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBBbGxvdyB0byBwYXNzIG11bHRpcGxlIG9iamVjdHMgZWl0aGVyIGFzIGFycmF5IG9yIGFzIG11bHRpcGxlIGFyZ3VtZW50c1xyXG4gICAgICAvLyBJZiBpdCdzIGFuIGFycmF5IGFsc28gY3JlYXRlIGNvcHkgb2YgaXQgaW4gY2FzZSB3ZSdyZSBnZXR0aW5nIHBhc3NlZFxyXG4gICAgICAvLyBhIGNoaWxkcmVucyBhcnJheSBkaXJlY3RseS5cclxuICAgICAgaWYgKCEob2JqZWN0cyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgIG9iamVjdHMgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvYmplY3RzID0gb2JqZWN0cy5zbGljZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZW1vdmUgdGhlIG9iamVjdHNcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmplY3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKCFvYmplY3RzW2ldIHx8ICEodGhpcy5jaGlsZHJlbi5pZHNbb2JqZWN0c1tpXS5pZF0pKSBjb250aW51ZTtcclxuICAgICAgICB0aGlzLmNoaWxkcmVuLnNwbGljZShfLmluZGV4T2YodGhpcy5jaGlsZHJlbiwgb2JqZWN0c1tpXSksIDEpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcztcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIGFuIG9iamVjdCB3aXRoIHRvcCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgd2lkdGgsIGFuZCBoZWlnaHRcclxuICAgICAqIHBhcmFtZXRlcnMgb2YgdGhlIGdyb3VwLlxyXG4gICAgICovXHJcbiAgICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IGZ1bmN0aW9uKHNoYWxsb3cpIHtcclxuICAgICAgdmFyIHJlY3Q7XHJcblxyXG4gICAgICAvLyBUT0RPOiBVcGRhdGUgdGhpcyB0byBub3QgX19hbHdheXNfXyB1cGRhdGUuIEp1c3Qgd2hlbiBpdCBuZWVkcyB0by5cclxuICAgICAgdGhpcy5fdXBkYXRlKHRydWUpO1xyXG5cclxuICAgICAgLy8gVmFyaWFibGVzIG5lZWQgdG8gYmUgZGVmaW5lZCBoZXJlLCBiZWNhdXNlIG9mIG5lc3RlZCBuYXR1cmUgb2YgZ3JvdXBzLlxyXG4gICAgICB2YXIgbGVmdCA9IEluZmluaXR5LCByaWdodCA9IC1JbmZpbml0eSxcclxuICAgICAgICAgIHRvcCA9IEluZmluaXR5LCBib3R0b20gPSAtSW5maW5pdHk7XHJcblxyXG4gICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcclxuXHJcbiAgICAgICAgaWYgKC8obGluZWFyLWdyYWRpZW50fHJhZGlhbC1ncmFkaWVudHxncmFkaWVudCkvLnRlc3QoY2hpbGQuX3JlbmRlcmVyLnR5cGUpKSB7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWN0ID0gY2hpbGQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHNoYWxsb3cpO1xyXG5cclxuICAgICAgICBpZiAoIV8uaXNOdW1iZXIocmVjdC50b3ApICAgfHwgIV8uaXNOdW1iZXIocmVjdC5sZWZ0KSAgIHx8XHJcbiAgICAgICAgICAgICFfLmlzTnVtYmVyKHJlY3QucmlnaHQpIHx8ICFfLmlzTnVtYmVyKHJlY3QuYm90dG9tKSkge1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9wID0gbWluKHJlY3QudG9wLCB0b3ApO1xyXG4gICAgICAgIGxlZnQgPSBtaW4ocmVjdC5sZWZ0LCBsZWZ0KTtcclxuICAgICAgICByaWdodCA9IG1heChyZWN0LnJpZ2h0LCByaWdodCk7XHJcbiAgICAgICAgYm90dG9tID0gbWF4KHJlY3QuYm90dG9tLCBib3R0b20pO1xyXG5cclxuICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgIGxlZnQ6IGxlZnQsXHJcbiAgICAgICAgcmlnaHQ6IHJpZ2h0LFxyXG4gICAgICAgIGJvdHRvbTogYm90dG9tLFxyXG4gICAgICAgIHdpZHRoOiByaWdodCAtIGxlZnQsXHJcbiAgICAgICAgaGVpZ2h0OiBib3R0b20gLSB0b3BcclxuICAgICAgfTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJpY2tsZSBkb3duIG9mIG5vRmlsbFxyXG4gICAgICovXHJcbiAgICBub0ZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBjaGlsZC5ub0ZpbGwoKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyaWNrbGUgZG93biBvZiBub1N0cm9rZVxyXG4gICAgICovXHJcbiAgICBub1N0cm9rZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xyXG4gICAgICAgIGNoaWxkLm5vU3Ryb2tlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmlja2xlIGRvd24gc3ViZGl2aWRlXHJcbiAgICAgKi9cclxuICAgIHN1YmRpdmlkZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24oY2hpbGQpIHtcclxuICAgICAgICBjaGlsZC5zdWJkaXZpZGUuYXBwbHkoY2hpbGQsIGFyZ3MpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG5cclxuICAgIGZsYWdSZXNldDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ0FkZGl0aW9ucykge1xyXG4gICAgICAgIHRoaXMuYWRkaXRpb25zLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5fZmxhZ0FkZGl0aW9ucyA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5fZmxhZ1N1YnRyYWN0aW9ucykge1xyXG4gICAgICAgIHRoaXMuc3VidHJhY3Rpb25zLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5fZmxhZ1N1YnRyYWN0aW9ucyA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLl9mbGFnT3JkZXIgPSB0aGlzLl9mbGFnTWFzayA9IHRoaXMuX2ZsYWdPcGFjaXR5ID0gZmFsc2U7XHJcblxyXG4gICAgICBUd28uU2hhcGUucHJvdG90eXBlLmZsYWdSZXNldC5jYWxsKHRoaXMpO1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG4gICAgfVxyXG5cclxuICB9KTtcclxuXHJcbiAgR3JvdXAuTWFrZU9ic2VydmFibGUoR3JvdXAucHJvdG90eXBlKTtcclxuXHJcbiAgLyoqXHJcbiAgICogSGVscGVyIGZ1bmN0aW9uIHVzZWQgdG8gc3luYyBwYXJlbnQtY2hpbGQgcmVsYXRpb25zaGlwIHdpdGhpbiB0aGVcclxuICAgKiBgVHdvLkdyb3VwLmNoaWxkcmVuYCBvYmplY3QuXHJcbiAgICpcclxuICAgKiBTZXQgdGhlIHBhcmVudCBvZiB0aGUgcGFzc2VkIG9iamVjdCB0byBhbm90aGVyIG9iamVjdFxyXG4gICAqIGFuZCB1cGRhdGVzIHBhcmVudC1jaGlsZCByZWxhdGlvbnNoaXBzXHJcbiAgICogQ2FsbGluZyB3aXRoIG9uZSBhcmd1bWVudHMgd2lsbCBzaW1wbHkgcmVtb3ZlIHRoZSBwYXJlbnRpbmdcclxuICAgKi9cclxuICBmdW5jdGlvbiByZXBsYWNlUGFyZW50KGNoaWxkLCBuZXdQYXJlbnQpIHtcclxuXHJcbiAgICB2YXIgcGFyZW50ID0gY2hpbGQucGFyZW50O1xyXG4gICAgdmFyIGluZGV4O1xyXG5cclxuICAgIGlmIChwYXJlbnQgPT09IG5ld1BhcmVudCkge1xyXG4gICAgICB0aGlzLmFkZGl0aW9ucy5wdXNoKGNoaWxkKTtcclxuICAgICAgdGhpcy5fZmxhZ0FkZGl0aW9ucyA9IHRydWU7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocGFyZW50ICYmIHBhcmVudC5jaGlsZHJlbi5pZHNbY2hpbGQuaWRdKSB7XHJcblxyXG4gICAgICBpbmRleCA9IF8uaW5kZXhPZihwYXJlbnQuY2hpbGRyZW4sIGNoaWxkKTtcclxuICAgICAgcGFyZW50LmNoaWxkcmVuLnNwbGljZShpbmRleCwgMSk7XHJcblxyXG4gICAgICAvLyBJZiB3ZSdyZSBwYXNzaW5nIGZyb20gb25lIHBhcmVudCB0byBhbm90aGVyLi4uXHJcbiAgICAgIGluZGV4ID0gXy5pbmRleE9mKHBhcmVudC5hZGRpdGlvbnMsIGNoaWxkKTtcclxuXHJcbiAgICAgIGlmIChpbmRleCA+PSAwKSB7XHJcbiAgICAgICAgcGFyZW50LmFkZGl0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBhcmVudC5zdWJ0cmFjdGlvbnMucHVzaChjaGlsZCk7XHJcbiAgICAgICAgcGFyZW50Ll9mbGFnU3VidHJhY3Rpb25zID0gdHJ1ZTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBpZiAobmV3UGFyZW50KSB7XHJcbiAgICAgIGNoaWxkLnBhcmVudCA9IG5ld1BhcmVudDtcclxuICAgICAgdGhpcy5hZGRpdGlvbnMucHVzaChjaGlsZCk7XHJcbiAgICAgIHRoaXMuX2ZsYWdBZGRpdGlvbnMgPSB0cnVlO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgd2UncmUgcGFzc2luZyBmcm9tIG9uZSBwYXJlbnQgdG8gYW5vdGhlci4uLlxyXG4gICAgaW5kZXggPSBfLmluZGV4T2YodGhpcy5hZGRpdGlvbnMsIGNoaWxkKTtcclxuXHJcbiAgICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgICB0aGlzLmFkZGl0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zdWJ0cmFjdGlvbnMucHVzaChjaGlsZCk7XHJcbiAgICAgIHRoaXMuX2ZsYWdTdWJ0cmFjdGlvbnMgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGRlbGV0ZSBjaGlsZC5wYXJlbnQ7XHJcblxyXG4gIH1cclxuXHJcbn0pKCh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpLlR3byk7XHJcbiIsImltcG9ydCAqIGFzIFR3byBmcm9tIFwidHdvLmpzXCI7XG5pbXBvcnQgKiBhcyBTaW1wbGV4Tm9pc2UgZnJvbSBcInNpbXBsZXgtbm9pc2VcIjtcblxuY29uc3QgZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYXBwXCIpO1xuY29uc3QgdHdvID0gbmV3IFR3byh7XG4gIHdpZHRoOiA3MjQsXG4gIGhlaWdodDogNTEyXG59KS5hcHBlbmRUbyhlbGVtKTtcblxuZnVuY3Rpb24gbm9ybVNpbih2OiBudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGguc2luKHYpICogMC41ICsgMC41O1xufVxuXG5mb3IgKGxldCB4ID0gMDsgeCA8IHR3by53aWR0aDsgeCArPSAxMCkge1xuICBmb3IgKGxldCB5ID0gMDsgeSA8IHR3by5oZWlnaHQ7IHkgKz0gMTApIHtcbiAgICBjb25zdCBkaXN0ID0gbmV3IFR3by5WZWN0b3IoeCwgeSkuZGlzdGFuY2VUbyhcbiAgICAgIG5ldyBUd28uVmVjdG9yKHR3by53aWR0aCAvIDIsIHR3by5oZWlnaHQgLyAyKVxuICAgICk7XG4gICAgY29uc3Qgbm9ybURpc3QgPSBkaXN0IC8gKE1hdGgubWF4KHR3by53aWR0aCwgdHdvLmhlaWdodCkgLyAyLjApO1xuICAgIGlmIChNYXRoLnBvdyhub3JtRGlzdCwgMi4wKSA+IDAuNCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHIgPSBub3JtU2luKFxuICAgICAgTWF0aC5wb3coTWF0aC5hYnMoeCAtIHR3by53aWR0aCAvIDIuMCkgLyAxMCwgMy4xKSArXG4gICAgICBNYXRoLnBvdyhNYXRoLmFicyh5IC0gdHdvLmhlaWdodCAvIDIuMCkgLyAxMCwgMy4xKVxuICAgICkgKiAxMDtcblxuICAgIGlmIChyIDwgMykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHJlY3QgPSB0d28ubWFrZUNpcmNsZShcbiAgICAgIHgsXG4gICAgICB5LFxuICAgICAgclxuICAgICk7IC8vLCBub3JtU2luKHggLSB5KSAqIDEwKTtcbiAgICAvLyByZWN0LnJvdGF0aW9uID0gbm9ybVNpbih4ICogTWF0aC5zcXJ0KHkpKSAqIE1hdGguUEkgKiAyLjA7XG4gICAgcmVjdC5zdHJva2UgPSBcIiMyMjJcIjtcbiAgICByZWN0LmxpbmV3aWR0aCA9IDE7XG4gICAgcmVjdC5ub0ZpbGwoKTtcbiAgfVxufVxudHdvLnVwZGF0ZSgpO1xuXG4vLyBjb25zdCBub2lzZSA9IG5ldyBTaW1wbGV4Tm9pc2UoKTtcbi8vIGZ1bmN0aW9uIGdyYWRpZW50RGlyKHBvczogdHlwZW9mIFR3by5WZWN0b3IpIHtcbi8vICAgY29uc3QgRVBTID0gMC4wMTtcbi8vICAgY29uc3QgU0NBTEUgPSAwLjAwMztcbi8vICAgY29uc3QgU1BFRUQgPSA1MDtcblxuLy8gICBjb25zdCBsID0gbm9pc2Uubm9pc2UyRChTQ0FMRSAqIHBvcy54IC0gRVBTLCBTQ0FMRSAqIHBvcy55KTtcbi8vICAgY29uc3QgciA9IG5vaXNlLm5vaXNlMkQoU0NBTEUgKiBwb3MueCArIEVQUywgU0NBTEUgKiBwb3MueSk7XG4vLyAgIGNvbnN0IHUgPSBub2lzZS5ub2lzZTJEKFNDQUxFICogcG9zLngsIFNDQUxFICogcG9zLnkgKyBFUFMpO1xuLy8gICBjb25zdCBkID0gbm9pc2Uubm9pc2UyRChTQ0FMRSAqIHBvcy54LCBTQ0FMRSAqIHBvcy55IC0gRVBTKTtcblxuLy8gICByZXR1cm4gbmV3IFR3by5WZWN0b3IoLShyIC0gbCkgKiBTUEVFRCwgKHUgLSBkKSAqIFNQRUVEKTtcbi8vIH1cblxuLy8gY29uc3QgcGF0aHM6IHR5cGVvZiBUd28uUGF0aFtdID0gW107XG4vLyBmb3IgKGxldCBpID0gMDsgaSA8IDUwMDA7ICsraSkge1xuLy8gICBjb25zdCB4ID0gTWF0aC5yYW5kb20oKSAqIHR3by53aWR0aDtcbi8vICAgY29uc3QgeSA9IE1hdGgucmFuZG9tKCkgKiB0d28uaGVpZ2h0O1xuXG4vLyAgIGxldCBwb3MgPSBuZXcgVHdvLlZlY3Rvcih4LCB5KTtcblxuLy8gICBjb25zdCBwb2ludHMgPSBbbmV3IFR3by5BbmNob3IocG9zLngsIHBvcy55KV07XG4vLyAgIGZvciAobGV0IGogPSAwOyBqIDwgNzsgKytqKSB7XG4vLyAgICAgcG9zLmFkZFNlbGYoZ3JhZGllbnREaXIocG9zKSk7XG4vLyAgICAgLy8gcG9zLmFkZFNlbGYobmV3IFR3by5WZWN0b3IoTWF0aC5yYW5kb20oKSwgTWF0aC5yYW5kb20oKSkubXVsdGlwbHlTY2FsYXIoMi4wKSk7XG4vLyAgICAgcG9pbnRzLnB1c2gobmV3IFR3by5BbmNob3IocG9zLngsIHBvcy55KSk7XG4vLyAgIH1cbi8vICAgY29uc3QgcGF0aCA9IHR3by5tYWtlQ3VydmUocG9pbnRzLCB0cnVlKTtcbi8vICAgcGF0aC5zdHJva2UgPSBcIiMyMjJcIjtcbi8vICAgcGF0aC5saW5ld2lkdGggPSAxO1xuLy8gICBwYXRoLm5vRmlsbCgpO1xuXG4vLyAgIHBhdGhzLnB1c2gocGF0aCk7XG4vLyB9XG4vLyB0d28udXBkYXRlKCk7XG5cbmZ1bmN0aW9uIGRvd25sb2FkRGF0YShkYXRhOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICBsaW5rLmhyZWYgPSBkYXRhO1xuICBsaW5rLmRvd25sb2FkID0gZmlsZW5hbWU7XG4gIGxpbmsuY2xpY2soKTtcbn1cblxuZnVuY3Rpb24gZG93bmxvYWRTVkcoKSB7XG4gIGlmICghZWxlbSkgcmV0dXJuO1xuXG4gIGNvbnN0IHN2ZyA9IGVsZW0uY2hpbGRyZW5bMF07XG4gIHN2Zy5zZXRBdHRyaWJ1dGUoXCJ2ZXJzaW9uXCIsIFwiMS4xXCIpO1xuICBzdmcuc2V0QXR0cmlidXRlKFwieG1sbnNcIiwgXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiKTtcblxuICBjb25zdCBibG9iID0gbmV3IEJsb2IoW3N2Zy5vdXRlckhUTUxdLCB7dHlwZTpcImltYWdlL3N2Zyt4bWw7Y2hhcnNldD11dGYtOFwifSk7XG4gIGNvbnN0IGRhdGEgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICBkb3dubG9hZERhdGEoZGF0YSwgJ2NhcHR1cmUuc3ZnJyk7XG59XG5cbmZ1bmN0aW9uIGRvd25sb2FkUE5HKCkge1xuICBpZiAoIWVsZW0pIHJldHVybjtcblxuICBjb25zdCBzdmdEYXRhID0gbmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhlbGVtLmNoaWxkcmVuWzBdKTtcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgdmFyIHN2Z1NpemUgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBjYW52YXMud2lkdGggPSBzdmdTaXplLndpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gc3ZnU2l6ZS5oZWlnaHQ7XG5cbiAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgaWYgKCFjdHgpIHJldHVybjtcblxuICBjb25zdCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICBpbWcuc2V0QXR0cmlidXRlKFwic3JjXCIsIFwiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxcIiArIGJ0b2Eoc3ZnRGF0YSkpO1xuXG4gIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCk7XG5cbiAgICBkb3dubG9hZERhdGEoY2FudmFzLnRvRGF0YVVSTChcImltYWdlL3BuZ1wiKSwgXCJjYXB0dXJlLnBuZ1wiKTtcbiAgfTtcbn1cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCBlID0+IHtcbiAgaWYgKGUua2V5ID09IFwic1wiKSB7XG4gICAgZG93bmxvYWRTVkcoKTtcbiAgfSBlbHNlIGlmIChlLmtleSA9PSBcInBcIikge1xuICAgIGRvd25sb2FkUE5HKCk7XG4gIH1cbn0pO1xuIl19
