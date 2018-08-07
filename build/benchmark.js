(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

window.CanvasBenchmark = require('./src/CanvasBenchmark');
window.MaxObjectsBenchmark = require('./src/MaxObjectsBenchmark');

},{"./src/CanvasBenchmark":3,"./src/MaxObjectsBenchmark":4}],2:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var Config = require('./config/Config');
var TwoDTest = require('./tests/TwoDTest');
var ThreeDTest = require('./tests/ThreeDTest');

/**
 * main
 */

var CanvasBenchmark = function (_EventEmitter) {
    _inherits(CanvasBenchmark, _EventEmitter);

    function CanvasBenchmark() {
        _classCallCheck(this, CanvasBenchmark);

        var _this = _possibleConstructorReturn(this, (CanvasBenchmark.__proto__ || Object.getPrototypeOf(CanvasBenchmark)).call(this));

        _this._width = 0;
        _this._height = 0;
        _this._test = null;
        _this._canvas = null;


        _this._width = Math.round(window.innerWidth * 0.99);
        _this._height = Math.round(window.innerHeight * 0.99);

        _this._canvas = document.createElement('canvas');
        _this._canvas.width = _this._width;
        _this._canvas.height = _this._height;

        _this._canvas.style.zIndex = 9999;
        _this._canvas.style.position = 'absolute';
        _this._canvas.style.left = 0;
        _this._canvas.style.top = 0;

        _this._deltaFrameTime = 0;
        _this._startTimestamp = 0;

        _this._totalTimeLapsed = 0;
        _this.isPaused = false;

        if (_this._isWebGLSupported()) {
            console.info("WEB GL TEST");
            _this._test = new ThreeDTest(_this._canvas, Config.particles.threeD);
        } else {
            console.info("2D TEST");
            _this._test = new TwoDTest(_this._canvas, Config.particles.twoD);
        }

        document.body.appendChild(_this._canvas);

        _this._pageVisibilityListener = _this._onPageVisibility.bind(_this);
        document.addEventListener('visibilitychange', _this._pageVisibilityListener);
        if (document.__isHidden === true) _this.pause();

        _this._test.on('runCompleted', _this._finished.bind(_this));

        return _this;
    }

    /**
     * @param {Number | undefined} duration
     */


    _createClass(CanvasBenchmark, [{
        key: 'start',
        value: function start() {
            var duration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Config.duration;

            this._startTimestamp = performance.now();
            this._test.run(duration);
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._test.stop();
        }
    }, {
        key: 'pause',
        value: function pause() {
            if (this.isPaused) return;
            this.isPaused = true;
            this._totalTimeLapsed += performance.now() - this._startTimestamp;
            this._test.pause();

            console.info('# Benchmark paused');
        }
    }, {
        key: 'resume',
        value: function resume() {
            if (!this.isPaused) return;
            this.isPaused = false;

            this._startTimestamp = performance.now();
            this._test.run();

            console.info('# Benchmark resumed');
        }
    }, {
        key: '_onPageVisibility',
        value: function _onPageVisibility() {
            if (document.visibilityState === 'hidden') {
                this.pause();
            } else if (document.visibilityState === 'visible') {
                this.resume();
            }
        }
    }, {
        key: '_isWebGLSupported',
        value: function _isWebGLSupported() {
            var contextOptions = { stencil: true, failIfMajorPerformanceCaveat: true };
            try {
                if (!window.WebGLRenderingContext) return false;

                var canvas = document.createElement('canvas');
                var gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

                var success = !!(gl && gl.getContextAttributes().stencil);
                if (gl) {
                    var loseContext = gl.getExtension('WEBGL_lose_context');
                    if (loseContext) loseContext.loseContext();
                }

                gl = null;
                return success;
            } catch (e) {
                return false;
            }
        }
    }, {
        key: '_finished',
        value: function _finished(frames) {
            console.info("Frames accomplished", frames);
            document.removeEventListener('visibilitychange', this._pageVisibilityListener);
            this._canvas.parentNode.removeChild(this._canvas);
            this._totalTimeLapsed += performance.now() - this._startTimestamp;
            var maxFrames = this._totalTimeLapsed / 1000 * 60;
            this.emit(CanvasBenchmark.EVENTS.FINISH, frames / maxFrames);
        }
    }]);

    return CanvasBenchmark;
}(EventEmitter);

CanvasBenchmark.EVENTS = {
    FINISH: 'finish'
};


module.exports = CanvasBenchmark;

},{"./config/Config":5,"./tests/ThreeDTest":10,"./tests/TwoDTest":11,"eventemitter3":2}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var Config = require('./config/Config');
var MaxObjects2DTest = require('./tests/MaxObjects2DTest');
var MaxObjects3DTest = require('./tests/MaxObjects3DTest');

/**
 * main
 */

var MaxObjectsBenchmark = function (_EventEmitter) {
    _inherits(MaxObjectsBenchmark, _EventEmitter);

    function MaxObjectsBenchmark() {
        _classCallCheck(this, MaxObjectsBenchmark);

        var _this = _possibleConstructorReturn(this, (MaxObjectsBenchmark.__proto__ || Object.getPrototypeOf(MaxObjectsBenchmark)).call(this));

        _this._width = 0;
        _this._height = 0;
        _this._test = null;
        _this._canvas = null;


        _this._width = Math.round(window.innerWidth * 0.99);
        _this._height = Math.round(window.innerHeight * 0.99);

        _this._canvas = document.createElement('canvas');
        _this._canvas.width = _this._width;
        _this._canvas.height = _this._height;

        _this._canvas.style.zIndex = 9999;
        _this._canvas.style.position = 'absolute';
        _this._canvas.style.left = 0;
        _this._canvas.style.top = 0;

        _this._deltaFrameTime = 0;
        _this._startTimestamp = 0;

        _this._totalTimeLapsed = 0;
        _this.isPaused = false;

        if (_this._isWebGLSupported()) {
            console.info("WEB GL TEST");
            _this._test = new MaxObjects3DTest(_this._canvas, Config.particles.threeD); // todo
        } else {
            console.info("2D TEST");
            _this._test = new MaxObjects2DTest(_this._canvas, Config.particles.twoD);
        }

        document.body.appendChild(_this._canvas);

        _this._pageVisibilityListener = _this._onPageVisibility.bind(_this);
        document.addEventListener('visibilitychange', _this._pageVisibilityListener);
        if (document.__isHidden === true) _this.pause();
        return _this;
    }

    /**
     * @param {Number | undefined} duration
     */


    _createClass(MaxObjectsBenchmark, [{
        key: 'start',
        value: function start() {
            var _this2 = this;

            var duration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Config.duration;

            console.log('START Counting Max Drawing Objects');
            this._test.run(duration).then(function (data) {
                return _this2.emit(MaxObjectsBenchmark.EVENTS.FINISH, data);
            });
        }
    }, {
        key: 'pause',
        value: function pause() {
            if (this.isPaused) return;

            this.isPaused = true;
            this._test.pause();

            console.info('# PAUSE Counting Max Drawing Objects');
        }
    }, {
        key: 'resume',
        value: function resume() {
            if (!this.isPaused) return;
            this.isPaused = false;

            this._test.resume();

            console.info('# RESUME Counting Max Drawing Objects');
        }
    }, {
        key: '_onPageVisibility',
        value: function _onPageVisibility() {
            if (document.visibilityState === 'hidden') {
                this.pause();
            } else if (document.visibilityState === 'visible') {
                this.resume();
            }
        }
    }, {
        key: '_isWebGLSupported',
        value: function _isWebGLSupported() {
            var contextOptions = { stencil: true, failIfMajorPerformanceCaveat: true };
            try {
                if (!window.WebGLRenderingContext) return false;

                var canvas = document.createElement('canvas');
                var gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

                var success = !!(gl && gl.getContextAttributes().stencil);
                if (gl) {
                    var loseContext = gl.getExtension('WEBGL_lose_context');
                    if (loseContext) loseContext.loseContext();
                }

                gl = null;
                return success;
            } catch (e) {
                return false;
            }
        }
    }]);

    return MaxObjectsBenchmark;
}(EventEmitter);

MaxObjectsBenchmark.EVENTS = {
    FINISH: 'finish'
};


module.exports = MaxObjectsBenchmark;

},{"./config/Config":5,"./tests/MaxObjects2DTest":8,"./tests/MaxObjects3DTest":9,"eventemitter3":2}],5:[function(require,module,exports){
"use strict";

module.exports = {

    // visualise tests
    debug: false,

    // seconds, 0 for unlimited i.e. test stop has to be called
    duration: 5,

    // number of particles to draw
    particles: {
        twoD: 1500,
        threeD: 1000
    }
};

},{}],6:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Renderable2D = function () {
    function Renderable2D(cW, cH) {
        _classCallCheck(this, Renderable2D);

        this.x = Math.round(Math.random() * cW);
        this.y = Math.round(Math.random() * cH);
        this.width = Math.round(cW / 50);
        this.height = Math.round(cH / 50);
        this.velocity = this._generateRandomVelocity();
    }

    _createClass(Renderable2D, [{
        key: "_generateRandomVelocity",
        value: function _generateRandomVelocity() {
            return {
                x: 3 - Math.round(Math.random() * 6),
                y: 3 - Math.round(Math.random() * 6)
            };
        }
    }, {
        key: "move",
        value: function move(maxX, maxY) {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            if (this.x < 1 || this.x > maxX) this.velocity.x = -this.velocity.x;
            if (this.y < 1 || this.y > maxY) this.velocity.y = -this.velocity.y;
        }
    }, {
        key: "draw",
        value: function draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x + 0, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
    }]);

    return Renderable2D;
}();

module.exports = Renderable2D;

},{}],7:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Renderable3D = function () {
    function Renderable3D(cW, cH, gl) {
        _classCallCheck(this, Renderable3D);

        this.x = 0.95 - Math.random() * 195 / 100;
        this.y = 0.95 - Math.random() * 195 / 100;
        this.width = 0.05;
        this.height = 0.05;
        this.velocity = this._generateRandomVelocity();

        this.vertices = new Float32Array([this.x + this.width, this.y + this.height, this.x, this.y + this.height, this.x + this.width, this.y, this.x, this.y]);

        this.vbuffer = gl.createBuffer();

        this.itemSize = 2;
        this.numItems = this.vertices.length / this.itemSize;
    }

    _createClass(Renderable3D, [{
        key: "_generateRandomVelocity",
        value: function _generateRandomVelocity() {
            return {
                x: 0.03 - Math.random() * 6 / 100,
                y: 0.03 - Math.random() * 6 / 100
            };
        }
    }, {
        key: "move",
        value: function move() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            if (this.x <= -1 || this.x > 0.95) this.velocity.x = -this.velocity.x;
            if (this.y <= -1 || this.y > 0.95) this.velocity.y = -this.velocity.y;

            this.vertices = new Float32Array([this.x + this.width, this.y + this.height, this.x, this.y + this.height, this.x + this.width, this.y, this.x, this.y]);
        }
    }, {
        key: "draw",
        value: function draw(gl, shaderProgram) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
            shaderProgram.aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.aVertexPosition);
            gl.vertexAttribPointer(shaderProgram.aVertexPosition, this.itemSize, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numItems);
        }
    }]);

    return Renderable3D;
}();

module.exports = Renderable3D;

},{}],8:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Config = require('../config/Config');
var EventEmitter = require('eventemitter3');
var Renderable2D = require('../renderable/Renderable2D');

var MaxObjects2DTest = function (_EventEmitter) {
    _inherits(MaxObjects2DTest, _EventEmitter);

    function MaxObjects2DTest(canvas, particleCount) {
        _classCallCheck(this, MaxObjects2DTest);

        var _this = _possibleConstructorReturn(this, (MaxObjects2DTest.__proto__ || Object.getPrototypeOf(MaxObjects2DTest)).call(this));

        _this._objs = [];
        _this._context = null;
        _this.canvas = null;
        _this._frames = 0;
        _this._paused = false;
        _this._limit = 200;
        _this._wasSlowFrame = false;

        _this.canvas = canvas;
        for (var i = 0; i < 20000; i++) {
            _this._objs.push(new Renderable2D(canvas.width, canvas.height));
        }_this._context = canvas.getContext("2d");
        _this._context.fillStyle = Config.debug ? "rgba(0, 0.3, 0.3, 0.5)" : "rgba(0, 0, 0, 0)";

        _this._renderBound = _this._render.bind(_this);
        return _this;
    } // todo add to config

    _createClass(MaxObjects2DTest, [{
        key: 'run',
        value: function run() {
            var _this2 = this;

            return new Promise(function (resolve) {
                return _this2._render(resolve);
            });
        }
    }, {
        key: 'pause',
        value: function pause() {
            this._paused = true;
        }
    }, {
        key: 'resume',
        value: function resume() {
            this._paused = false;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._paused = true;
        }
    }, {
        key: '_clear',
        value: function _clear() {
            this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, {
        key: '_render',
        value: function _render(resolve) {
            if (this._paused) return this._render(resolve);

            this._clear();
            var start = Date.now();
            for (var i = 0; i < this._limit; i++) {
                var obj = this._objs[i];
                obj.move(this.canvas.width, this.canvas.height);
                obj.draw(this._context);
            }
            var time = Date.now() - start;
            var ms = 1000 / 60;
            var isSlow = time > ms;
            var isFirstSlow = this._slowFrames === 0;
            this._slowFrames = this._wasSlowFrame && !isFirstSlow && isSlow || !this._wasSlowFrame && isFirstSlow && isSlow ? this._slowFrames + 1 : 0;
            if (this._slowFrames > 2) {
                return resolve({ objects: this._limit, frames: this._frames });
            } else {
                this._limit += isSlow ? 0 : this._frames * 50;
                this._wasSlowFrame = isSlow;
                this._frames++;
                window.requestAnimationFrame(this._render.bind(this, resolve));
            }
        }
    }]);

    return MaxObjects2DTest;
}(EventEmitter);

module.exports = MaxObjects2DTest;

},{"../config/Config":5,"../renderable/Renderable2D":6,"eventemitter3":2}],9:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Config = require('../config/Config');
// const EventEmitter = require('eventemitter3');
var Renderable3D = require('../renderable/Renderable3D');

// TODO literals not compatible with IE
var vertex = '\n    attribute vec2 aVertexPosition;\n\n    void main() {\n        gl_Position = vec4(aVertexPosition, 0.0, 1.0);\n    }\n';

var fragment = '\n    #ifdef GL_ES\n        precision highp float;\n    #endif\n\n    uniform vec4 uColor;\n\n    void main() {\n        gl_FragColor = uColor;\n    }\n';

var ThreeDTest = function () {
    function ThreeDTest(canvas, particleCount) {
        _classCallCheck(this, ThreeDTest);

        this._objs = [];
        this._gl = null;
        this._frames = 0;
        this._paused = false;
        this._limit = 200;
        this._wasSlowFrame = false;
        this.canvas = null;
        this.shaderProgram = null;

        this.canvas = canvas;
        this._slowFrames = 0;
        this._wasSlowFrame = false;
        this._gl = canvas.getContext("experimental-webgl");
        this._gl.viewportWidth = canvas.width;
        this._gl.viewportHeight = canvas.height;
        this._gl.clearColor(0, 0, 0, 0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);

        var vs = this._gl.createShader(this._gl.VERTEX_SHADER);
        this._gl.shaderSource(vs, vertex);
        this._gl.compileShader(vs);

        var fs = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        this._gl.shaderSource(fs, fragment);
        this._gl.compileShader(fs);

        this.shaderProgram = this._gl.createProgram();
        this._gl.attachShader(this.shaderProgram, vs);
        this._gl.attachShader(this.shaderProgram, fs);
        this._gl.linkProgram(this.shaderProgram);

        if (!this._gl.getShaderParameter(vs, this._gl.COMPILE_STATUS)) console.log(this._gl.getShaderInfoLog(vs));
        if (!this._gl.getShaderParameter(fs, this._gl.COMPILE_STATUS)) console.log(this._gl.getShaderInfoLog(fs));
        if (!this._gl.getProgramParameter(this.shaderProgram, this._gl.LINK_STATUS)) console.log(this._gl.getProgramInfoLog(this.shaderProgram));

        this._gl.useProgram(this.shaderProgram);

        this.shaderProgram.uColor = this._gl.getUniformLocation(this.shaderProgram, "uColor");

        var colors = Config.debug ? [0.0, 0.3, 0.3, 0.5] : [0.0, 0.0, 0.0, 0.0];
        this._gl.uniform4fv(this.shaderProgram.uColor, colors);

        for (var j = 0; j < 10000; j++) {
            this._objs.push(new Renderable3D(this.canvas.width, this.canvas.height, this._gl));
        }
    } // todo add to config


    _createClass(ThreeDTest, [{
        key: 'run',
        value: function run() {
            var _this = this;

            return new Promise(function (resolve) {
                return _this._render(resolve);
            });
        }
    }, {
        key: 'pause',
        value: function pause() {
            this._paused = true;
        }
    }, {
        key: 'resume',
        value: function resume() {
            this._paused = false;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._paused = true;
        }
    }, {
        key: '_clear',
        value: function _clear() {
            this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
            this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        }
    }, {
        key: '_render',
        value: function _render(resolve) {
            if (this._paused) return this._render(resolve);

            this._clear();
            var start = Date.now();
            for (var i = 0; i < this._limit; i++) {
                var obj = this._objs[i];
                obj.move(this.canvas.width, this.canvas.height);
                obj.draw(this._gl, this.shaderProgram);
            }
            var time = Date.now() - start;
            var ms = 1000 / 60;
            var isSlow = time > ms;
            var isFirstSlow = this._slowFrames === 0;
            this._slowFrames = this._wasSlowFrame && !isFirstSlow && isSlow || !this._wasSlowFrame && isFirstSlow && isSlow ? this._slowFrames + 1 : 0;
            if (this._slowFrames > 2) {
                return resolve({ objects: this._limit, frames: this._frames });
            } else {
                this._limit += isSlow ? 0 : this._frames * 50;
                this._wasSlowFrame = isSlow;
                this._frames++;
                window.requestAnimationFrame(this._render.bind(this, resolve));
            }
        }
    }]);

    return ThreeDTest;
}();

module.exports = ThreeDTest;

},{"../config/Config":5,"../renderable/Renderable3D":7}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Config = require('../config/Config');
var EventEmitter = require('eventemitter3');
var Renderable3D = require('../renderable/Renderable3D');

// TODO literals not compatible with IE
var vertex = '\n    attribute vec2 aVertexPosition;\n\n    void main() {\n        gl_Position = vec4(aVertexPosition, 0.0, 1.0);\n    }\n';

var fragment = '\n    #ifdef GL_ES\n        precision highp float;\n    #endif\n\n    uniform vec4 uColor;\n\n    void main() {\n        gl_FragColor = uColor;\n    }\n';

var ThreeDTest = function (_EventEmitter) {
    _inherits(ThreeDTest, _EventEmitter);

    function ThreeDTest(canvas, particleCount) {
        _classCallCheck(this, ThreeDTest);

        var _this = _possibleConstructorReturn(this, (ThreeDTest.__proto__ || Object.getPrototypeOf(ThreeDTest)).call(this));

        _this._objs = [];
        _this._gl = null;
        _this._frames = 0;
        _this._paused = false;
        _this.canvas = null;
        _this.shaderProgram = null;


        _this.canvas = canvas;

        _this._gl = canvas.getContext("experimental-webgl");
        _this._gl.viewportWidth = canvas.width;
        _this._gl.viewportHeight = canvas.height;
        _this._gl.clearColor(0, 0, 0, 0);
        _this._gl.clear(_this._gl.COLOR_BUFFER_BIT);

        var vs = _this._gl.createShader(_this._gl.VERTEX_SHADER);
        _this._gl.shaderSource(vs, vertex);
        _this._gl.compileShader(vs);

        var fs = _this._gl.createShader(_this._gl.FRAGMENT_SHADER);
        _this._gl.shaderSource(fs, fragment);
        _this._gl.compileShader(fs);

        _this.shaderProgram = _this._gl.createProgram();
        _this._gl.attachShader(_this.shaderProgram, vs);
        _this._gl.attachShader(_this.shaderProgram, fs);
        _this._gl.linkProgram(_this.shaderProgram);

        if (!_this._gl.getShaderParameter(vs, _this._gl.COMPILE_STATUS)) console.log(_this._gl.getShaderInfoLog(vs));
        if (!_this._gl.getShaderParameter(fs, _this._gl.COMPILE_STATUS)) console.log(_this._gl.getShaderInfoLog(fs));
        if (!_this._gl.getProgramParameter(_this.shaderProgram, _this._gl.LINK_STATUS)) console.log(_this._gl.getProgramInfoLog(_this.shaderProgram));

        for (var i = 0; i < particleCount; i++) {
            _this._objs.push(new Renderable3D(canvas.width, canvas.height, _this._gl));
        }

        _this._gl.useProgram(_this.shaderProgram);

        _this.shaderProgram.uColor = _this._gl.getUniformLocation(_this.shaderProgram, "uColor");
        if (Config.debug) {
            _this._gl.uniform4fv(_this.shaderProgram.uColor, [0.0, 0.3, 0.3, 0.5]);
        } else {
            _this._gl.uniform4fv(_this.shaderProgram.uColor, [0.0, 0.0, 0.0, 0.0]);
        }

        _this._renderBound = _this._render.bind(_this);
        return _this;
    }

    _createClass(ThreeDTest, [{
        key: 'run',
        value: function run() {
            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: 'pause',
        value: function pause() {
            this._paused = true;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._paused = true;
            this._finish();
        }
    }, {
        key: '_clear',
        value: function _clear() {
            this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
            this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        }
    }, {
        key: '_render',
        value: function _render() {
            var _this2 = this;

            if (this._paused) return;

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this2.canvas.width, _this2.canvas.height);
                obj.draw(_this2._gl, _this2.shaderProgram);
            });
            this._frames++;

            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: '_finish',
        value: function _finish() {
            this.emit('runCompleted', this._frames);
        }
    }]);

    return ThreeDTest;
}(EventEmitter);

module.exports = ThreeDTest;

},{"../config/Config":5,"../renderable/Renderable3D":7,"eventemitter3":2}],11:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Config = require('../config/Config');
var EventEmitter = require('eventemitter3');
var Renderable2D = require('../renderable/Renderable2D');

var TwoDTest = function (_EventEmitter) {
    _inherits(TwoDTest, _EventEmitter);

    function TwoDTest(canvas, particleCount) {
        _classCallCheck(this, TwoDTest);

        var _this = _possibleConstructorReturn(this, (TwoDTest.__proto__ || Object.getPrototypeOf(TwoDTest)).call(this));

        _this._objs = [];
        _this._context = null;
        _this.canvas = null;
        _this._frames = 0;
        _this._paused = false;

        _this.canvas = canvas;
        for (var i = 0; i < particleCount; i++) {
            _this._objs.push(new Renderable2D(canvas.width, canvas.height));
        }_this._context = canvas.getContext("2d");
        if (Config.debug) {
            _this._context.fillStyle = "rgba(0, 0.3, 0.3, 0.5)";
        } else {
            _this._context.fillStyle = "rgba(0, 0, 0, 0)";
        }
        _this._renderBound = _this._render.bind(_this);
        return _this;
    }

    _createClass(TwoDTest, [{
        key: 'run',
        value: function run() {
            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: 'pause',
        value: function pause() {
            this._paused = true;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this._paused = true;
            this._finish();
        }
    }, {
        key: '_clear',
        value: function _clear() {
            this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, {
        key: '_render',
        value: function _render() {
            var _this2 = this;

            if (this._paused) return;

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this2.canvas.width, _this2.canvas.height);
                obj.draw(_this2._context);
            });
            this._frames++;

            window.requestAnimationFrame(this._renderBound);
        }
    }, {
        key: '_finish',
        value: function _finish() {
            this.emit('runCompleted', this._frames);
        }
    }]);

    return TwoDTest;
}(EventEmitter);

module.exports = TwoDTest;

},{"../config/Config":5,"../renderable/Renderable2D":6,"eventemitter3":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJzcmMvQ2FudmFzQmVuY2htYXJrLmpzIiwic3JjL01heE9iamVjdHNCZW5jaG1hcmsuanMiLCJzcmMvY29uZmlnL0NvbmZpZy5qcyIsInNyYy9yZW5kZXJhYmxlL1JlbmRlcmFibGUyRC5qcyIsInNyYy9yZW5kZXJhYmxlL1JlbmRlcmFibGUzRC5qcyIsInNyYy90ZXN0cy9NYXhPYmplY3RzMkRUZXN0LmpzIiwic3JjL3Rlc3RzL01heE9iamVjdHMzRFRlc3QuanMiLCJzcmMvdGVzdHMvVGhyZWVEVGVzdC5qcyIsInNyYy90ZXN0cy9Ud29EVGVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsT0FBTyxlQUFQLEdBQXlCLFFBQVEsdUJBQVIsQ0FBekI7QUFDQSxPQUFPLG1CQUFQLEdBQTZCLFFBQVEsMkJBQVIsQ0FBN0I7OztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QTBCLHdCQUExQjtBQUNILFNBRkQsTUFFTztBQUNILGtCQUFLLFFBQUwsQ0FBYyxTQUFkLEdBQTBCLGtCQUExQjtBQUNIO0FBQ0QsY0FBSyxZQUFMLEdBQW9CLE1BQUssT0FBTCxDQUFhLElBQWIsT0FBcEI7QUFWK0I7QUFXbEM7Ozs7OEJBRUs7QUFDRixtQkFBTyxxQkFBUCxDQUE2QixLQUFLLFlBQWxDO0FBQ0g7OztnQ0FFTztBQUNKLGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0g7OzsrQkFFTTtBQUNILGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0EsaUJBQUssT0FBTDtBQUNIOzs7aUNBRVE7QUFDTCxpQkFBSyxRQUFMLENBQWMsU0FBZCxDQUF3QixDQUF4QixFQUEyQixDQUEzQixFQUE4QixLQUFLLE1BQUwsQ0FBWSxLQUExQyxFQUFpRCxLQUFLLE1BQUwsQ0FBWSxNQUE3RDtBQUNIOzs7a0NBRVM7QUFBQTs7QUFDTixnQkFBRyxLQUFLLE9BQVIsRUFBaUI7O0FBRWpCLGlCQUFLLE1BQUw7QUFDQSxpQkFBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixVQUFDLEdBQUQsRUFBUztBQUN4QixvQkFBSSxJQUFKLENBQVMsT0FBSyxNQUFMLENBQVksS0FBckIsRUFBNEIsT0FBSyxNQUFMLENBQVksTUFBeEM7QUFDQSxvQkFBSSxJQUFKLENBQVMsT0FBSyxRQUFkO0FBQ0gsYUFIRDtBQUlBLGlCQUFLLE9BQUw7O0FBRUEsbUJBQU8scUJBQVAsQ0FBNkIsS0FBSyxZQUFsQztBQUNIOzs7a0NBRVM7QUFDTixpQkFBSyxJQUFMLENBQVUsY0FBVixFQUEwQixLQUFLLE9BQS9CO0FBQ0g7Ozs7RUF4RGtCLFk7O0FBMkR2QixPQUFPLE9BQVAsR0FBaUIsUUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ3aW5kb3cuQ2FudmFzQmVuY2htYXJrID0gcmVxdWlyZSgnLi9zcmMvQ2FudmFzQmVuY2htYXJrJyk7XHJcbndpbmRvdy5NYXhPYmplY3RzQmVuY2htYXJrID0gcmVxdWlyZSgnLi9zcmMvTWF4T2JqZWN0c0JlbmNobWFyaycpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBwcmVmaXggPSAnfic7XG5cbi8qKlxuICogQ29uc3RydWN0b3IgdG8gY3JlYXRlIGEgc3RvcmFnZSBmb3Igb3VyIGBFRWAgb2JqZWN0cy5cbiAqIEFuIGBFdmVudHNgIGluc3RhbmNlIGlzIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xufVxuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgT25seSBjaGVjayBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBlbHNlIGBmYWxzZWAuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBjYXNlIDQ6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIsIGEzKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgbGlzdGVuZXJzIG9mIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgaGF2ZSB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25lLXRpbWUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcbiAgaWYgKCFmbikge1xuICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm5cbiAgICAgICYmICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSlcbiAgICAgICYmICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IFtldmVudF0gVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEFsbG93IGBFdmVudEVtaXR0ZXJgIHRvIGJlIGltcG9ydGVkIGFzIG1vZHVsZSBuYW1lc3BhY2UuXG4vL1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcvQ29uZmlnJyk7XHJcbmNvbnN0IFR3b0RUZXN0ID0gcmVxdWlyZSgnLi90ZXN0cy9Ud29EVGVzdCcpO1xyXG5jb25zdCBUaHJlZURUZXN0ID0gcmVxdWlyZSgnLi90ZXN0cy9UaHJlZURUZXN0Jyk7XHJcblxyXG4vKipcclxuICogbWFpblxyXG4gKi9cclxuY2xhc3MgQ2FudmFzQmVuY2htYXJrIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBzdGF0aWMgRVZFTlRTID0ge1xyXG4gICAgICAgIEZJTklTSDogJ2ZpbmlzaCdcclxuICAgIH07XHJcblxyXG4gICAgX3dpZHRoID0gMDtcclxuICAgIF9oZWlnaHQgPSAwO1xyXG5cclxuICAgIF90ZXN0ID0gbnVsbDtcclxuXHJcbiAgICBfY2FudmFzID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLl93aWR0aCA9IE1hdGgucm91bmQod2luZG93LmlubmVyV2lkdGggKiAwLjk5KTtcclxuICAgICAgICB0aGlzLl9oZWlnaHQgPSBNYXRoLnJvdW5kKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuOTkpO1xyXG5cclxuICAgICAgICB0aGlzLl9jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICB0aGlzLl9jYW52YXMud2lkdGggPSB0aGlzLl93aWR0aDtcclxuICAgICAgICB0aGlzLl9jYW52YXMuaGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xyXG5cclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUuekluZGV4ID0gOTk5OTtcclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5sZWZ0ID0gMDtcclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUudG9wID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5fZGVsdGFGcmFtZVRpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZXN0YW1wID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5fdG90YWxUaW1lTGFwc2VkID0gMDtcclxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9pc1dlYkdMU3VwcG9ydGVkKCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiV0VCIEdMIFRFU1RcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3Rlc3QgPSBuZXcgVGhyZWVEVGVzdCh0aGlzLl9jYW52YXMsIENvbmZpZy5wYXJ0aWNsZXMudGhyZWVEKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCIyRCBURVNUXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl90ZXN0ID0gbmV3IFR3b0RUZXN0KHRoaXMuX2NhbnZhcywgQ29uZmlnLnBhcnRpY2xlcy50d29EKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5fY2FudmFzKTtcclxuXHJcbiAgICAgICAgdGhpcy5fcGFnZVZpc2liaWxpdHlMaXN0ZW5lciA9IHRoaXMuX29uUGFnZVZpc2liaWxpdHkuYmluZCh0aGlzKTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgdGhpcy5fcGFnZVZpc2liaWxpdHlMaXN0ZW5lcik7XHJcbiAgICAgICAgaWYoZG9jdW1lbnQuX19pc0hpZGRlbiA9PT0gdHJ1ZSkgdGhpcy5wYXVzZSgpO1xyXG5cclxuICAgICAgICB0aGlzLl90ZXN0Lm9uKCdydW5Db21wbGV0ZWQnLCB0aGlzLl9maW5pc2hlZC5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge051bWJlciB8IHVuZGVmaW5lZH0gZHVyYXRpb25cclxuICAgICAqL1xyXG4gICAgc3RhcnQoZHVyYXRpb24gPSBDb25maWcuZHVyYXRpb24pIHtcclxuICAgICAgICB0aGlzLl9zdGFydFRpbWVzdGFtcCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICAgIHRoaXMuX3Rlc3QucnVuKGR1cmF0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIHRoaXMuX3Rlc3Quc3RvcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHBhdXNlKCkge1xyXG4gICAgICAgIGlmKHRoaXMuaXNQYXVzZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl90b3RhbFRpbWVMYXBzZWQgKz0gcGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLl9zdGFydFRpbWVzdGFtcDtcclxuICAgICAgICB0aGlzLl90ZXN0LnBhdXNlKCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbygnIyBCZW5jaG1hcmsgcGF1c2VkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdW1lKCkge1xyXG4gICAgICAgIGlmKCF0aGlzLmlzUGF1c2VkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLl9zdGFydFRpbWVzdGFtcCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICAgIHRoaXMuX3Rlc3QucnVuKCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbygnIyBCZW5jaG1hcmsgcmVzdW1lZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIF9vblBhZ2VWaXNpYmlsaXR5KCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICdoaWRkZW4nKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICB9IGVsc2UgaWYoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZScpe1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfaXNXZWJHTFN1cHBvcnRlZCgpIHtcclxuICAgICAgICBsZXQgY29udGV4dE9wdGlvbnMgPSB7IHN0ZW5jaWw6IHRydWUsIGZhaWxJZk1ham9yUGVyZm9ybWFuY2VDYXZlYXQ6IHRydWUgfTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICAgICAgbGV0IGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgY29udGV4dE9wdGlvbnMpIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBjb250ZXh0T3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9ICEhKGdsICYmIGdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCkuc3RlbmNpbCk7XHJcbiAgICAgICAgICAgIGlmIChnbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxvc2VDb250ZXh0ID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9sb3NlX2NvbnRleHQnKTtcclxuICAgICAgICAgICAgICAgIGlmKGxvc2VDb250ZXh0KSBsb3NlQ29udGV4dC5sb3NlQ29udGV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnbCA9IG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZmluaXNoZWQoZnJhbWVzKSB7XHJcbiAgICAgICAgY29uc29sZS5pbmZvKFwiRnJhbWVzIGFjY29tcGxpc2hlZFwiLCBmcmFtZXMpO1xyXG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyKTtcclxuICAgICAgICB0aGlzLl9jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jYW52YXMpO1xyXG4gICAgICAgIHRoaXMuX3RvdGFsVGltZUxhcHNlZCArPSBwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMuX3N0YXJ0VGltZXN0YW1wO1xyXG4gICAgICAgIGxldCBtYXhGcmFtZXMgPSAodGhpcy5fdG90YWxUaW1lTGFwc2VkIC8gMTAwMCkgKiA2MDtcclxuICAgICAgICB0aGlzLmVtaXQoQ2FudmFzQmVuY2htYXJrLkVWRU5UUy5GSU5JU0gsIGZyYW1lcyAvIG1heEZyYW1lcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzQmVuY2htYXJrOyIsImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcvQ29uZmlnJyk7XHJcbmNvbnN0IE1heE9iamVjdHMyRFRlc3QgPSByZXF1aXJlKCcuL3Rlc3RzL01heE9iamVjdHMyRFRlc3QnKTtcclxuY29uc3QgTWF4T2JqZWN0czNEVGVzdCA9IHJlcXVpcmUoJy4vdGVzdHMvTWF4T2JqZWN0czNEVGVzdCcpO1xyXG5cclxuLyoqXHJcbiAqIG1haW5cclxuICovXHJcbmNsYXNzIE1heE9iamVjdHNCZW5jaG1hcmsgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIHN0YXRpYyBFVkVOVFMgPSB7XHJcbiAgICAgICAgRklOSVNIOiAnZmluaXNoJ1xyXG4gICAgfTtcclxuXHJcbiAgICBfd2lkdGggPSAwO1xyXG4gICAgX2hlaWdodCA9IDA7XHJcblxyXG4gICAgX3Rlc3QgPSBudWxsO1xyXG5cclxuICAgIF9jYW52YXMgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX3dpZHRoID0gTWF0aC5yb3VuZCh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuOTkpO1xyXG4gICAgICAgIHRoaXMuX2hlaWdodCA9IE1hdGgucm91bmQod2luZG93LmlubmVySGVpZ2h0ICogMC45OSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy53aWR0aCA9IHRoaXMuX3dpZHRoO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5oZWlnaHQgPSB0aGlzLl9oZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS56SW5kZXggPSA5OTk5O1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzLnN0eWxlLmxlZnQgPSAwO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS50b3AgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9kZWx0YUZyYW1lVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lc3RhbXAgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl90b3RhbFRpbWVMYXBzZWQgPSAwO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2lzV2ViR0xTdXBwb3J0ZWQoKSAgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIldFQiBHTCBURVNUXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl90ZXN0ID0gbmV3IE1heE9iamVjdHMzRFRlc3QodGhpcy5fY2FudmFzLCBDb25maWcucGFydGljbGVzLnRocmVlRCk7IC8vIHRvZG9cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCIyRCBURVNUXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl90ZXN0ID0gbmV3IE1heE9iamVjdHMyRFRlc3QodGhpcy5fY2FudmFzLCBDb25maWcucGFydGljbGVzLnR3b0QpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLl9jYW52YXMpO1xyXG5cclxuICAgICAgICB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyID0gdGhpcy5fb25QYWdlVmlzaWJpbGl0eS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyKTtcclxuICAgICAgICBpZihkb2N1bWVudC5fX2lzSGlkZGVuID09PSB0cnVlKSB0aGlzLnBhdXNlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge051bWJlciB8IHVuZGVmaW5lZH0gZHVyYXRpb25cclxuICAgICAqL1xyXG4gICAgc3RhcnQoZHVyYXRpb24gPSBDb25maWcuZHVyYXRpb24pIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnU1RBUlQgQ291bnRpbmcgTWF4IERyYXdpbmcgT2JqZWN0cycpO1xyXG4gICAgICAgIHRoaXMuX3Rlc3QucnVuKGR1cmF0aW9uKVxyXG4gICAgICAgICAgLnRoZW4oKGRhdGEpPT50aGlzLmVtaXQoTWF4T2JqZWN0c0JlbmNobWFyay5FVkVOVFMuRklOSVNILCBkYXRhKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcGF1c2UoKSB7XHJcbiAgICAgICAgaWYodGhpcy5pc1BhdXNlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLl90ZXN0LnBhdXNlKCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbygnIyBQQVVTRSBDb3VudGluZyBNYXggRHJhd2luZyBPYmplY3RzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdW1lKCkge1xyXG4gICAgICAgIGlmKCF0aGlzLmlzUGF1c2VkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLl90ZXN0LnJlc3VtZSgpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oJyMgUkVTVU1FIENvdW50aW5nIE1heCBEcmF3aW5nIE9iamVjdHMnKTtcclxuICAgIH1cclxuXHJcbiAgICBfb25QYWdlVmlzaWJpbGl0eSgpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAnaGlkZGVuJykge1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKXtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2lzV2ViR0xTdXBwb3J0ZWQoKSB7XHJcbiAgICAgICAgbGV0IGNvbnRleHRPcHRpb25zID0geyBzdGVuY2lsOiB0cnVlLCBmYWlsSWZNYWpvclBlcmZvcm1hbmNlQ2F2ZWF0OiB0cnVlIH07XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKCF3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0KSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgICAgIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcsIGNvbnRleHRPcHRpb25zKSB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgY29udGV4dE9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHN1Y2Nlc3MgPSAhIShnbCAmJiBnbC5nZXRDb250ZXh0QXR0cmlidXRlcygpLnN0ZW5jaWwpO1xyXG4gICAgICAgICAgICBpZiAoZ2wpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsb3NlQ29udGV4dCA9IGdsLmdldEV4dGVuc2lvbignV0VCR0xfbG9zZV9jb250ZXh0Jyk7XHJcbiAgICAgICAgICAgICAgICBpZihsb3NlQ29udGV4dCkgbG9zZUNvbnRleHQubG9zZUNvbnRleHQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2wgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcztcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWF4T2JqZWN0c0JlbmNobWFyazsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgICAvLyB2aXN1YWxpc2UgdGVzdHNcclxuICAgIGRlYnVnOiBmYWxzZSxcclxuXHJcbiAgICAvLyBzZWNvbmRzLCAwIGZvciB1bmxpbWl0ZWQgaS5lLiB0ZXN0IHN0b3AgaGFzIHRvIGJlIGNhbGxlZFxyXG4gICAgZHVyYXRpb246IDUsXHJcblxyXG4gICAgLy8gbnVtYmVyIG9mIHBhcnRpY2xlcyB0byBkcmF3XHJcbiAgICBwYXJ0aWNsZXM6IHtcclxuICAgICAgICB0d29EOiAxNTAwLFxyXG4gICAgICAgIHRocmVlRDogMTAwMCxcclxuICAgIH0sXHJcbn07IiwiY2xhc3MgUmVuZGVyYWJsZTJEIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjVywgY0gpIHtcclxuICAgICAgICB0aGlzLnggPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBjVyk7XHJcbiAgICAgICAgdGhpcy55ID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogY0gpO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLnJvdW5kKGNXIC8gNTApO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gTWF0aC5yb3VuZChjSC8gNTApO1xyXG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB0aGlzLl9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgX2dlbmVyYXRlUmFuZG9tVmVsb2NpdHkoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogMyAtIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDYpLFxyXG4gICAgICAgICAgICB5OiAzIC0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogNilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZShtYXhYLCBtYXhZKSB7XHJcbiAgICAgICAgdGhpcy54ICs9IHRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICB0aGlzLnkgKz0gdGhpcy52ZWxvY2l0eS55O1xyXG4gICAgICAgIGlmICh0aGlzLnggPCAxIHx8IHRoaXMueCA+IG1heFgpIHRoaXMudmVsb2NpdHkueCA9IC10aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgaWYgKHRoaXMueSA8IDEgfHwgdGhpcy55ID4gbWF4WSkgdGhpcy52ZWxvY2l0eS55ID0gLXRoaXMudmVsb2NpdHkueTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGN0eCkge1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHgubW92ZVRvKHRoaXMueCwgdGhpcy55KTtcclxuICAgICAgICBjdHgubGluZVRvKHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnggKyB0aGlzLndpZHRoLCB0aGlzLnkgKyB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnggKyAwLCB0aGlzLnkgKyB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyYWJsZTJEOyIsIlxyXG5cclxuY2xhc3MgUmVuZGVyYWJsZTNEIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjVywgY0gsIGdsKSB7XHJcbiAgICAgICAgdGhpcy54ID0gMC45NSAtIE1hdGgucmFuZG9tKCkgKiAxOTUgLyAxMDA7XHJcbiAgICAgICAgdGhpcy55ID0gMC45NSAtIE1hdGgucmFuZG9tKCkgKiAxOTUgLyAxMDA7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IDAuMDU7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSAwLjA1O1xyXG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB0aGlzLl9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCk7XHJcblxyXG4gICAgICAgIHRoaXMudmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgIHRoaXMueSArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLngsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgdGhpcy55LFxyXG4gICAgICAgICAgICB0aGlzLngsIHRoaXMueVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgICAgICB0aGlzLnZidWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5pdGVtU2l6ZSA9IDI7XHJcbiAgICAgICAgdGhpcy5udW1JdGVtcyA9IHRoaXMudmVydGljZXMubGVuZ3RoIC8gdGhpcy5pdGVtU2l6ZTtcclxuICAgIH1cclxuXHJcbiAgICBfZ2VuZXJhdGVSYW5kb21WZWxvY2l0eSgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiAwLjAzIC0gTWF0aC5yYW5kb20oKSAqIDYgLyAxMDAsXHJcbiAgICAgICAgICAgIHk6IDAuMDMgLSBNYXRoLnJhbmRvbSgpICogNiAvIDEwMFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlKCkge1xyXG4gICAgICAgIHRoaXMueCArPSB0aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgdGhpcy55ICs9IHRoaXMudmVsb2NpdHkueTtcclxuICAgICAgICBpZiAodGhpcy54IDw9IC0xIHx8IHRoaXMueCA+IDAuOTUpIHRoaXMudmVsb2NpdHkueCA9IC10aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgaWYgKHRoaXMueSA8PSAtMSB8fCB0aGlzLnkgPiAwLjk1KSB0aGlzLnZlbG9jaXR5LnkgPSAtdGhpcy52ZWxvY2l0eS55O1xyXG5cclxuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgICAgICAgICAgIHRoaXMueCArIHRoaXMud2lkdGgsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54LCAgdGhpcy55ICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSxcclxuICAgICAgICAgICAgdGhpcy54LCB0aGlzLnlcclxuICAgICAgICBdKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhnbCwgc2hhZGVyUHJvZ3JhbSkge1xyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZidWZmZXIpO1xyXG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgc2hhZGVyUHJvZ3JhbS5hVmVydGV4UG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcclxuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbik7XHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbiwgdGhpcy5pdGVtU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuICAgICAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCAwLCB0aGlzLm51bUl0ZW1zKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJhYmxlM0Q7IiwiY29uc3QgQ29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnL0NvbmZpZycpO1xyXG5jb25zdCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJyk7XHJcbmNvbnN0IFJlbmRlcmFibGUyRCA9IHJlcXVpcmUoJy4uL3JlbmRlcmFibGUvUmVuZGVyYWJsZTJEJyk7XHJcblxyXG5jbGFzcyBNYXhPYmplY3RzMkRUZXN0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBfb2JqcyA9IFtdO1xyXG4gICAgX2NvbnRleHQgPSBudWxsO1xyXG5cclxuICAgIGNhbnZhcyA9IG51bGw7XHJcblxyXG4gICAgX2ZyYW1lcyA9IDA7XHJcblxyXG4gICAgX3BhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgIF9saW1pdCA9IDIwMDsgLy8gdG9kbyBhZGQgdG8gY29uZmlnXHJcblxyXG4gICAgX3dhc1Nsb3dGcmFtZSA9IGZhbHNlO1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIHBhcnRpY2xlQ291bnQpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjAwMDA7IGkrKykgdGhpcy5fb2Jqcy5wdXNoKG5ldyBSZW5kZXJhYmxlMkQoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSk7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dC5maWxsU3R5bGUgPSBDb25maWcuZGVidWcgPyBcInJnYmEoMCwgMC4zLCAwLjMsIDAuNSlcIiA6IFwicmdiYSgwLCAwLCAwLCAwKVwiO1xyXG5cclxuICAgICAgICB0aGlzLl9yZW5kZXJCb3VuZCA9IHRoaXMuX3JlbmRlci5iaW5kKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJ1bigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuX3JlbmRlcihyZXNvbHZlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcGF1c2UoKSB7XHJcbiAgICAgICAgdGhpcy5fcGF1c2VkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bWUoKSB7XHJcbiAgICAgIHRoaXMuX3BhdXNlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fcGF1c2VkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBfY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgX3JlbmRlcihyZXNvbHZlKSB7XHJcbiAgICAgICAgaWYodGhpcy5fcGF1c2VkKSByZXR1cm4gdGhpcy5fcmVuZGVyKHJlc29sdmUpO1xyXG5cclxuICAgICAgICB0aGlzLl9jbGVhcigpO1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xpbWl0OyBpKyspIHtcclxuICAgICAgICAgIGNvbnN0IG9iaiA9IHRoaXMuX29ianNbaV07XHJcbiAgICAgICAgICBvYmoubW92ZSh0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgIG9iai5kcmF3KHRoaXMuX2NvbnRleHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB0aW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0O1xyXG4gICAgICAgIGNvbnN0IG1zID0gMTAwMCAvIDYwO1xyXG4gICAgICAgIGNvbnN0IGlzU2xvdyA9IHRpbWUgPiBtcztcclxuICAgICAgICBjb25zdCBpc0ZpcnN0U2xvdyA9IHRoaXMuX3Nsb3dGcmFtZXMgPT09IDA7XHJcbiAgICAgICAgdGhpcy5fc2xvd0ZyYW1lcyA9ICh0aGlzLl93YXNTbG93RnJhbWUgJiYgIWlzRmlyc3RTbG93ICYmIGlzU2xvdykgfHwgKCF0aGlzLl93YXNTbG93RnJhbWUgJiYgaXNGaXJzdFNsb3cgJiYgaXNTbG93KSA/IHRoaXMuX3Nsb3dGcmFtZXMgKyAxIDogMDtcclxuICAgICAgICBpZih0aGlzLl9zbG93RnJhbWVzID4gMikge1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoe29iamVjdHM6IHRoaXMuX2xpbWl0LCBmcmFtZXM6IHRoaXMuX2ZyYW1lc30pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLl9saW1pdCArPSBpc1Nsb3cgPyAwIDogdGhpcy5fZnJhbWVzICogNTA7XHJcbiAgICAgICAgICB0aGlzLl93YXNTbG93RnJhbWUgPSBpc1Nsb3c7XHJcbiAgICAgICAgICB0aGlzLl9mcmFtZXMrKztcclxuICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fcmVuZGVyLmJpbmQodGhpcywgcmVzb2x2ZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXhPYmplY3RzMkRUZXN0OyIsImNvbnN0IENvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy9Db25maWcnKTtcclxuLy8gY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xyXG5jb25zdCBSZW5kZXJhYmxlM0QgPSByZXF1aXJlKCcuLi9yZW5kZXJhYmxlL1JlbmRlcmFibGUzRCcpO1xyXG5cclxuLy8gVE9ETyBsaXRlcmFscyBub3QgY29tcGF0aWJsZSB3aXRoIElFXHJcbmNvbnN0IHZlcnRleCA9IGBcclxuICAgIGF0dHJpYnV0ZSB2ZWMyIGFWZXJ0ZXhQb3NpdGlvbjtcclxuXHJcbiAgICB2b2lkIG1haW4oKSB7XHJcbiAgICAgICAgZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMC4wLCAxLjApO1xyXG4gICAgfVxyXG5gO1xyXG5cclxuY29uc3QgZnJhZ21lbnQgPSBgXHJcbiAgICAjaWZkZWYgR0xfRVNcclxuICAgICAgICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XHJcbiAgICAjZW5kaWZcclxuXHJcbiAgICB1bmlmb3JtIHZlYzQgdUNvbG9yO1xyXG5cclxuICAgIHZvaWQgbWFpbigpIHtcclxuICAgICAgICBnbF9GcmFnQ29sb3IgPSB1Q29sb3I7XHJcbiAgICB9XHJcbmA7XHJcblxyXG5jbGFzcyBUaHJlZURUZXN0IHtcclxuXHJcbiAgICBfb2JqcyA9IFtdO1xyXG4gICAgX2dsID0gbnVsbDtcclxuICAgIF9mcmFtZXMgPSAwO1xyXG5cclxuICAgIF9wYXVzZWQgPSBmYWxzZTtcclxuICAgIF9saW1pdCA9IDIwMDsgLy8gdG9kbyBhZGQgdG8gY29uZmlnXHJcbiAgICBfd2FzU2xvd0ZyYW1lID0gZmFsc2U7XHJcbiAgICBjYW52YXMgPSBudWxsO1xyXG4gICAgc2hhZGVyUHJvZ3JhbSA9IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzLCBwYXJ0aWNsZUNvdW50KSB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgdGhpcy5fc2xvd0ZyYW1lcyA9IDA7XHJcbiAgICAgICAgdGhpcy5fd2FzU2xvd0ZyYW1lID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5fZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcclxuICAgICAgICB0aGlzLl9nbC52aWV3cG9ydFdpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLl9nbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICB2YXIgdnMgPSB0aGlzLl9nbC5jcmVhdGVTaGFkZXIodGhpcy5fZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICAgICAgdGhpcy5fZ2wuc2hhZGVyU291cmNlKHZzLCB2ZXJ0ZXgpO1xyXG4gICAgICAgIHRoaXMuX2dsLmNvbXBpbGVTaGFkZXIodnMpO1xyXG5cclxuICAgICAgICB2YXIgZnMgPSB0aGlzLl9nbC5jcmVhdGVTaGFkZXIodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSKTtcclxuICAgICAgICB0aGlzLl9nbC5zaGFkZXJTb3VyY2UoZnMsIGZyYWdtZW50KTtcclxuICAgICAgICB0aGlzLl9nbC5jb21waWxlU2hhZGVyKGZzKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaGFkZXJQcm9ncmFtID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgICAgIHRoaXMuX2dsLmF0dGFjaFNoYWRlcih0aGlzLnNoYWRlclByb2dyYW0sIHZzKTtcclxuICAgICAgICB0aGlzLl9nbC5hdHRhY2hTaGFkZXIodGhpcy5zaGFkZXJQcm9ncmFtLCBmcyk7XHJcbiAgICAgICAgdGhpcy5fZ2wubGlua1Byb2dyYW0odGhpcy5zaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9nbC5nZXRTaGFkZXJQYXJhbWV0ZXIodnMsIHRoaXMuX2dsLkNPTVBJTEVfU1RBVFVTKSkgY29uc29sZS5sb2codGhpcy5fZ2wuZ2V0U2hhZGVySW5mb0xvZyh2cykpO1xyXG4gICAgICAgIGlmICghdGhpcy5fZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKGZzLCB0aGlzLl9nbC5DT01QSUxFX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFNoYWRlckluZm9Mb2coZnMpKTtcclxuICAgICAgICBpZiAoIXRoaXMuX2dsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5zaGFkZXJQcm9ncmFtLCB0aGlzLl9nbC5MSU5LX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFByb2dyYW1JbmZvTG9nKHRoaXMuc2hhZGVyUHJvZ3JhbSkpO1xyXG5cclxuICAgICAgICB0aGlzLl9nbC51c2VQcm9ncmFtKHRoaXMuc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hhZGVyUHJvZ3JhbS51Q29sb3IgPSB0aGlzLl9nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5zaGFkZXJQcm9ncmFtLCBcInVDb2xvclwiKTtcclxuXHJcbiAgICAgICAgY29uc3QgY29sb3JzID0gQ29uZmlnLmRlYnVnID8gWzAuMCwgMC4zLCAwLjMsIDAuNV0gOiBbMC4wLCAwLjAsIDAuMCwgMC4wXTtcclxuICAgICAgICB0aGlzLl9nbC51bmlmb3JtNGZ2KHRoaXMuc2hhZGVyUHJvZ3JhbS51Q29sb3IsIGNvbG9ycyk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMTAwMDA7IGorKyl7XHJcbiAgICAgICAgICB0aGlzLl9vYmpzLnB1c2gobmV3IFJlbmRlcmFibGUzRCh0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0LCB0aGlzLl9nbCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBydW4oKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLl9yZW5kZXIocmVzb2x2ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHBhdXNlKCkge1xyXG4gICAgICAgIHRoaXMuX3BhdXNlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdW1lKCkge1xyXG4gICAgICB0aGlzLl9wYXVzZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIHRoaXMuX3BhdXNlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgX2NsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0KDAsIDAsIHRoaXMuX2dsLnZpZXdwb3J0V2lkdGgsIHRoaXMuX2dsLnZpZXdwb3J0SGVpZ2h0KTtcclxuICAgICAgICB0aGlzLl9nbC5jbGVhcih0aGlzLl9nbC5DT0xPUl9CVUZGRVJfQklUIHwgdGhpcy5fZ2wuREVQVEhfQlVGRkVSX0JJVCk7XHJcbiAgICB9XHJcblxyXG4gICAgX3JlbmRlcihyZXNvbHZlKSB7XHJcbiAgICAgICAgaWYodGhpcy5fcGF1c2VkKSByZXR1cm4gdGhpcy5fcmVuZGVyKHJlc29sdmUpO1xyXG5cclxuICAgICAgICB0aGlzLl9jbGVhcigpO1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xpbWl0OyBpKyspIHtcclxuICAgICAgICAgIGNvbnN0IG9iaiA9IHRoaXMuX29ianNbaV07XHJcbiAgICAgICAgICBvYmoubW92ZSh0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgIG9iai5kcmF3KHRoaXMuX2dsLCB0aGlzLnNoYWRlclByb2dyYW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB0aW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0O1xyXG4gICAgICAgIGNvbnN0IG1zID0gMTAwMCAvIDYwO1xyXG4gICAgICAgIGNvbnN0IGlzU2xvdyA9IHRpbWUgPiBtcztcclxuICAgICAgICBjb25zdCBpc0ZpcnN0U2xvdyA9IHRoaXMuX3Nsb3dGcmFtZXMgPT09IDA7XHJcbiAgICAgICAgdGhpcy5fc2xvd0ZyYW1lcyA9ICh0aGlzLl93YXNTbG93RnJhbWUgJiYgIWlzRmlyc3RTbG93ICYmIGlzU2xvdykgfHwgKCF0aGlzLl93YXNTbG93RnJhbWUgJiYgaXNGaXJzdFNsb3cgJiYgaXNTbG93KSA/IHRoaXMuX3Nsb3dGcmFtZXMgKyAxIDogMDtcclxuICAgICAgICBpZih0aGlzLl9zbG93RnJhbWVzID4gMikge1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoe29iamVjdHM6IHRoaXMuX2xpbWl0LCBmcmFtZXM6IHRoaXMuX2ZyYW1lc30pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLl9saW1pdCArPSBpc1Nsb3cgPyAwIDogdGhpcy5fZnJhbWVzICogNTA7XHJcbiAgICAgICAgICB0aGlzLl93YXNTbG93RnJhbWUgPSBpc1Nsb3c7XHJcbiAgICAgICAgICB0aGlzLl9mcmFtZXMrKztcclxuICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fcmVuZGVyLmJpbmQodGhpcywgcmVzb2x2ZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaHJlZURUZXN0OyIsImNvbnN0IENvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy9Db25maWcnKTtcclxuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xyXG5jb25zdCBSZW5kZXJhYmxlM0QgPSByZXF1aXJlKCcuLi9yZW5kZXJhYmxlL1JlbmRlcmFibGUzRCcpO1xyXG5cclxuLy8gVE9ETyBsaXRlcmFscyBub3QgY29tcGF0aWJsZSB3aXRoIElFXHJcbmNvbnN0IHZlcnRleCA9IGBcclxuICAgIGF0dHJpYnV0ZSB2ZWMyIGFWZXJ0ZXhQb3NpdGlvbjtcclxuXHJcbiAgICB2b2lkIG1haW4oKSB7XHJcbiAgICAgICAgZ2xfUG9zaXRpb24gPSB2ZWM0KGFWZXJ0ZXhQb3NpdGlvbiwgMC4wLCAxLjApO1xyXG4gICAgfVxyXG5gO1xyXG5cclxuY29uc3QgZnJhZ21lbnQgPSBgXHJcbiAgICAjaWZkZWYgR0xfRVNcclxuICAgICAgICBwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XHJcbiAgICAjZW5kaWZcclxuXHJcbiAgICB1bmlmb3JtIHZlYzQgdUNvbG9yO1xyXG5cclxuICAgIHZvaWQgbWFpbigpIHtcclxuICAgICAgICBnbF9GcmFnQ29sb3IgPSB1Q29sb3I7XHJcbiAgICB9XHJcbmA7XHJcblxyXG5jbGFzcyBUaHJlZURUZXN0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBfb2JqcyA9IFtdO1xyXG4gICAgX2dsID0gbnVsbDtcclxuICAgIF9mcmFtZXMgPSAwO1xyXG5cclxuICAgIF9wYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICBjYW52YXMgPSBudWxsO1xyXG4gICAgc2hhZGVyUHJvZ3JhbSA9IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzLCBwYXJ0aWNsZUNvdW50KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcblxyXG4gICAgICAgIHRoaXMuX2dsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XHJcbiAgICAgICAgdGhpcy5fZ2wudmlld3BvcnRXaWR0aCA9IGNhbnZhcy53aWR0aDtcclxuICAgICAgICB0aGlzLl9nbC52aWV3cG9ydEhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5fZ2wuY2xlYXJDb2xvcigwLCAwLCAwLCAwKTtcclxuICAgICAgICB0aGlzLl9nbC5jbGVhcih0aGlzLl9nbC5DT0xPUl9CVUZGRVJfQklUKTtcclxuXHJcbiAgICAgICAgdmFyIHZzID0gdGhpcy5fZ2wuY3JlYXRlU2hhZGVyKHRoaXMuX2dsLlZFUlRFWF9TSEFERVIpO1xyXG4gICAgICAgIHRoaXMuX2dsLnNoYWRlclNvdXJjZSh2cywgdmVydGV4KTtcclxuICAgICAgICB0aGlzLl9nbC5jb21waWxlU2hhZGVyKHZzKTtcclxuXHJcbiAgICAgICAgdmFyIGZzID0gdGhpcy5fZ2wuY3JlYXRlU2hhZGVyKHRoaXMuX2dsLkZSQUdNRU5UX1NIQURFUik7XHJcbiAgICAgICAgdGhpcy5fZ2wuc2hhZGVyU291cmNlKGZzLCBmcmFnbWVudCk7XHJcbiAgICAgICAgdGhpcy5fZ2wuY29tcGlsZVNoYWRlcihmcyk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hhZGVyUHJvZ3JhbSA9IHRoaXMuX2dsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgICAgICB0aGlzLl9nbC5hdHRhY2hTaGFkZXIodGhpcy5zaGFkZXJQcm9ncmFtLCB2cyk7XHJcbiAgICAgICAgdGhpcy5fZ2wuYXR0YWNoU2hhZGVyKHRoaXMuc2hhZGVyUHJvZ3JhbSwgZnMpO1xyXG4gICAgICAgIHRoaXMuX2dsLmxpbmtQcm9ncmFtKHRoaXMuc2hhZGVyUHJvZ3JhbSk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5fZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHZzLCB0aGlzLl9nbC5DT01QSUxFX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFNoYWRlckluZm9Mb2codnMpKTtcclxuICAgICAgICBpZiAoIXRoaXMuX2dsLmdldFNoYWRlclBhcmFtZXRlcihmcywgdGhpcy5fZ2wuQ09NUElMRV9TVEFUVVMpKSBjb25zb2xlLmxvZyh0aGlzLl9nbC5nZXRTaGFkZXJJbmZvTG9nKGZzKSk7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9nbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuc2hhZGVyUHJvZ3JhbSwgdGhpcy5fZ2wuTElOS19TVEFUVVMpKSBjb25zb2xlLmxvZyh0aGlzLl9nbC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLnNoYWRlclByb2dyYW0pKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0aWNsZUNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5fb2Jqcy5wdXNoKG5ldyBSZW5kZXJhYmxlM0QoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0LCB0aGlzLl9nbCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fZ2wudXNlUHJvZ3JhbSh0aGlzLnNoYWRlclByb2dyYW0pO1xyXG5cclxuICAgICAgICB0aGlzLnNoYWRlclByb2dyYW0udUNvbG9yID0gdGhpcy5fZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuc2hhZGVyUHJvZ3JhbSwgXCJ1Q29sb3JcIik7XHJcbiAgICAgICAgaWYgKENvbmZpZy5kZWJ1Zykge1xyXG4gICAgICAgICAgICB0aGlzLl9nbC51bmlmb3JtNGZ2KHRoaXMuc2hhZGVyUHJvZ3JhbS51Q29sb3IsIFswLjAsIDAuMywgMC4zLCAwLjVdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9nbC51bmlmb3JtNGZ2KHRoaXMuc2hhZGVyUHJvZ3JhbS51Q29sb3IsIFswLjAsIDAuMCwgMC4wLCAwLjBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX3JlbmRlckJvdW5kID0gdGhpcy5fcmVuZGVyLmJpbmQodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcnVuKCkge1xyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fcmVuZGVyQm91bmQpO1xyXG4gICAgfVxyXG5cclxuICAgIHBhdXNlKCkge1xyXG4gICAgICAgIHRoaXMuX3BhdXNlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcCgpIHtcclxuICAgICAgICB0aGlzLl9wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX2ZpbmlzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIF9jbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9nbC52aWV3cG9ydCgwLCAwLCB0aGlzLl9nbC52aWV3cG9ydFdpZHRoLCB0aGlzLl9nbC52aWV3cG9ydEhlaWdodCk7XHJcbiAgICAgICAgdGhpcy5fZ2wuY2xlYXIodGhpcy5fZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IHRoaXMuX2dsLkRFUFRIX0JVRkZFUl9CSVQpO1xyXG4gICAgfVxyXG5cclxuICAgIF9yZW5kZXIoKSB7XHJcbiAgICAgICAgaWYodGhpcy5fcGF1c2VkKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuX2NsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5fb2Jqcy5mb3JFYWNoKChvYmopID0+IHtcclxuICAgICAgICAgICAgb2JqLm1vdmUodGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgICAgIG9iai5kcmF3KHRoaXMuX2dsLCB0aGlzLnNoYWRlclByb2dyYW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lcysrO1xyXG5cclxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3JlbmRlckJvdW5kKTtcclxuICAgIH1cclxuXHJcbiAgICBfZmluaXNoKCkge1xyXG4gICAgICAgIHRoaXMuZW1pdCgncnVuQ29tcGxldGVkJywgdGhpcy5fZnJhbWVzKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUaHJlZURUZXN0OyIsImNvbnN0IENvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy9Db25maWcnKTtcclxuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xyXG5jb25zdCBSZW5kZXJhYmxlMkQgPSByZXF1aXJlKCcuLi9yZW5kZXJhYmxlL1JlbmRlcmFibGUyRCcpO1xyXG5cclxuY2xhc3MgVHdvRFRlc3QgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIF9vYmpzID0gW107XHJcbiAgICBfY29udGV4dCA9IG51bGw7XHJcblxyXG4gICAgY2FudmFzID0gbnVsbDtcclxuXHJcbiAgICBfZnJhbWVzID0gMDtcclxuXHJcbiAgICBfcGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FudmFzLCBwYXJ0aWNsZUNvdW50KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRpY2xlQ291bnQ7IGkrKykgdGhpcy5fb2Jqcy5wdXNoKG5ldyBSZW5kZXJhYmxlMkQoY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KSk7XHJcbiAgICAgICAgdGhpcy5fY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICAgICAgaWYgKENvbmZpZy5kZWJ1Zykge1xyXG4gICAgICAgICAgICB0aGlzLl9jb250ZXh0LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLjMsIDAuMywgMC41KVwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NvbnRleHQuZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3JlbmRlckJvdW5kID0gdGhpcy5fcmVuZGVyLmJpbmQodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcnVuKCkge1xyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fcmVuZGVyQm91bmQpO1xyXG4gICAgfVxyXG5cclxuICAgIHBhdXNlKCkge1xyXG4gICAgICAgIHRoaXMuX3BhdXNlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcCgpIHtcclxuICAgICAgICB0aGlzLl9wYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX2ZpbmlzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIF9jbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBfcmVuZGVyKCkge1xyXG4gICAgICAgIGlmKHRoaXMuX3BhdXNlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICB0aGlzLl9jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX29ianMuZm9yRWFjaCgob2JqKSA9PiB7XHJcbiAgICAgICAgICAgIG9iai5tb3ZlKHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBvYmouZHJhdyh0aGlzLl9jb250ZXh0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9mcmFtZXMrKztcclxuXHJcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLl9yZW5kZXJCb3VuZCk7XHJcbiAgICB9XHJcblxyXG4gICAgX2ZpbmlzaCgpIHtcclxuICAgICAgICB0aGlzLmVtaXQoJ3J1bkNvbXBsZXRlZCcsIHRoaXMuX2ZyYW1lcyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHdvRFRlc3Q7Il19
