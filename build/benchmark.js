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
var Base2DTest = require('./tests/Base2DTest');
var Base3DTest = require('./tests/Base3DTest');

/**
 * main
 */

var CanvasBenchmark = function (_EventEmitter) {
    _inherits(CanvasBenchmark, _EventEmitter);

    function CanvasBenchmark() {
        var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, CanvasBenchmark);

        var _this = _possibleConstructorReturn(this, (CanvasBenchmark.__proto__ || Object.getPrototypeOf(CanvasBenchmark)).call(this));

        _this._width = 0;
        _this._height = 0;
        _this._test = null;
        _this._canvas = null;

        var _config = Object.assign({}, Config.baseTest, config);
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
            _this._test = new Base3DTest(_this._canvas, _config);
        } else {
            console.info("2D TEST");
            _this._test = new Base2DTest(_this._canvas, _config);
        }

        document.body.appendChild(_this._canvas);

        _this._pageVisibilityListener = _this._onPageVisibility.bind(_this);
        document.addEventListener('visibilitychange', _this._pageVisibilityListener);
        if (document.__isHidden === true) _this.pause();

        // this._test.on('runCompleted', this._finished.bind(this));

        return _this;
    }

    /**
     * @param {Number | undefined} duration
     */


    _createClass(CanvasBenchmark, [{
        key: 'start',
        value: function start() {
            var _this2 = this;

            this._startTimestamp = performance.now();
            this._test.run().then(function (frames) {
                console.info("Frames accomplished", frames);
                document.removeEventListener('visibilitychange', _this2._pageVisibilityListener);
                _this2._canvas.parentNode.removeChild(_this2._canvas);
                _this2._totalTimeLapsed += performance.now() - _this2._startTimestamp;
                var maxFrames = _this2._totalTimeLapsed / 1000 * 60;
                _this2.emit(CanvasBenchmark.EVENTS.FINISH, frames / maxFrames);
            });
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
    }]);

    return CanvasBenchmark;
}(EventEmitter);

CanvasBenchmark.EVENTS = {
    FINISH: 'finish'
};


module.exports = CanvasBenchmark;

},{"./config/Config":5,"./tests/Base2DTest":8,"./tests/Base3DTest":9,"eventemitter3":2}],4:[function(require,module,exports){
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
        var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, MaxObjectsBenchmark);

        var _this = _possibleConstructorReturn(this, (MaxObjectsBenchmark.__proto__ || Object.getPrototypeOf(MaxObjectsBenchmark)).call(this));

        _this._width = 0;
        _this._height = 0;
        _this._test = null;
        _this._canvas = null;

        var _config = Object.assign({}, Config.maxObjectsTest, config);
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
            _this._test = new MaxObjects3DTest(_this._canvas, _config);
        } else {
            console.info("2D TEST");
            _this._test = new MaxObjects2DTest(_this._canvas, _config);
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

},{"./config/Config":5,"./tests/MaxObjects2DTest":10,"./tests/MaxObjects3DTest":11,"eventemitter3":2}],5:[function(require,module,exports){
"use strict";

module.exports = {
  baseTest: {
    debug: false,
    particles2d: 1500,
    particles3d: 1000
  },
  maxObjectsTest: {
    debug: false,
    targetFPS: 60,
    maxSlowFrames: 2,
    startingCount: 200,
    countStep: 50,
    particles2d: 20000,
    particles3d: 10000
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

var Config = require('../config/Config');
var Renderable2D = require('../renderable/Renderable2D');

var Base2DTest = function () {
    function Base2DTest(canvas, config) {
        _classCallCheck(this, Base2DTest);

        this._objs = [];
        this._context = null;
        this.canvas = null;
        this._frames = 0;
        this._paused = false;
        this._finished = false;

        this.canvas = canvas;
        this._config = config;
        for (var i = 0; i < this._config.particles2d; i++) {
            this._objs.push(new Renderable2D(canvas.width, canvas.height));
        }this._context = canvas.getContext("2d");
        this._context.fillStyle = this._config.debug ? "rgba(0, 0.3, 0.3, 0.5)" : "rgba(0, 0, 0, 0)";
    }

    _createClass(Base2DTest, [{
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
        key: 'stop',
        value: function stop() {
            this._finished = true;
        }
    }, {
        key: '_clear',
        value: function _clear() {
            this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }, {
        key: '_render',
        value: function _render(resolve) {
            var _this2 = this;

            if (this._finished) return resolve(this._frames);
            if (this._paused) return this._render(resolve);

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this2.canvas.width, _this2.canvas.height);
                obj.draw(_this2._context);
            });
            this._frames++;

            window.requestAnimationFrame(function () {
                return _this2._render(resolve);
            });
        }
    }]);

    return Base2DTest;
}();

module.exports = Base2DTest;

},{"../config/Config":5,"../renderable/Renderable2D":6}],9:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Renderable3D = require('../renderable/Renderable3D');

// TODO literals not compatible with IE
var vertex = "\n    attribute vec2 aVertexPosition;\n\n    void main() {\n        gl_Position = vec4(aVertexPosition, 0.0, 1.0);\n    }\n";

var fragment = "\n    #ifdef GL_ES\n        precision highp float;\n    #endif\n\n    uniform vec4 uColor;\n\n    void main() {\n        gl_FragColor = uColor;\n    }\n";

var Base3DTest = function () {
    function Base3DTest(canvas, config) {
        _classCallCheck(this, Base3DTest);

        this._objs = [];
        this._gl = null;
        this._frames = 0;
        this._paused = false;
        this._finished = false;
        this.canvas = null;
        this.shaderProgram = null;

        this.canvas = canvas;
        this._config = config;

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

        for (var i = 0; i < this._config.particles3d; i++) {
            this._objs.push(new Renderable3D(canvas.width, canvas.height, this._gl));
        }

        this._gl.useProgram(this.shaderProgram);

        this.shaderProgram.uColor = this._gl.getUniformLocation(this.shaderProgram, "uColor");
        var colors = this._config.debug ? [0.0, 0.3, 0.3, 0.5] : [0.0, 0.0, 0.0, 0.0];
        this._gl.uniform4fv(this.shaderProgram.uColor, colors);
    }

    _createClass(Base3DTest, [{
        key: "run",
        value: function run() {
            var _this = this;

            return new Promise(function (resolve) {
                return _this._render(resolve);
            });
        }
    }, {
        key: "pause",
        value: function pause() {
            this._paused = true;
        }
    }, {
        key: "stop",
        value: function stop() {
            this._finished = true;
        }
    }, {
        key: "_clear",
        value: function _clear() {
            this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
            this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        }
    }, {
        key: "_render",
        value: function _render(resolve) {
            var _this2 = this;

            if (this._finished) return resolve(this._frames);
            if (this._paused) return this._render(resolve);

            this._clear();
            this._objs.forEach(function (obj) {
                obj.move(_this2.canvas.width, _this2.canvas.height);
                obj.draw(_this2._gl, _this2.shaderProgram);
            });
            this._frames++;

            window.requestAnimationFrame(function () {
                return _this2._render(resolve);
            });
        }
    }]);

    return Base3DTest;
}();

module.exports = Base3DTest;

},{"../renderable/Renderable3D":7}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Config = require('../config/Config');
var Renderable2D = require('../renderable/Renderable2D');
var Base2DTest = require('./Base2DTest');

var MaxObjects2DTest = function (_Base2DTest) {
    _inherits(MaxObjects2DTest, _Base2DTest);

    function MaxObjects2DTest(canvas, config) {
        _classCallCheck(this, MaxObjects2DTest);

        var _this = _possibleConstructorReturn(this, (MaxObjects2DTest.__proto__ || Object.getPrototypeOf(MaxObjects2DTest)).call(this, canvas, config));

        _this._limit = 0;
        _this._wasSlowFrame = false;

        _this._limit = config.startingCount;
        return _this;
    }

    _createClass(MaxObjects2DTest, [{
        key: '_render',
        value: function _render(resolve) {
            if (this._paused) return this._render(resolve);

            this._clear();
            var start = Date.now();
            var config = this._config;
            for (var i = 0; i < this._limit; i++) {
                var obj = this._objs[i];
                obj.move(this.canvas.width, this.canvas.height);
                obj.draw(this._context);
            }
            var time = Date.now() - start;
            var ms = 1000 / config.targetFPS;
            var isSlow = time > ms;
            var isFirstSlow = this._slowFrames === 0;
            this._slowFrames = this._wasSlowFrame && !isFirstSlow && isSlow || !this._wasSlowFrame && isFirstSlow && isSlow ? this._slowFrames + 1 : 0;
            if (this._slowFrames > config.maxSlowFrames) {
                return resolve({ objects: this._limit, frames: this._frames });
            } else {
                this._limit += isSlow ? 0 : this._frames * config.countStep;
                this._wasSlowFrame = isSlow;
                this._frames++;
                window.requestAnimationFrame(this._render.bind(this, resolve));
            }
        }
    }]);

    return MaxObjects2DTest;
}(Base2DTest);

module.exports = MaxObjects2DTest;

},{"../config/Config":5,"../renderable/Renderable2D":6,"./Base2DTest":8}],11:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Config = require('../config/Config');
var Renderable3D = require('../renderable/Renderable3D');
var Base3DTest = require('./Base3DTest');

var MaxObjects3DTest = function (_Base3DTest) {
    _inherits(MaxObjects3DTest, _Base3DTest);

    function MaxObjects3DTest(canvas, config) {
        _classCallCheck(this, MaxObjects3DTest);

        var _this = _possibleConstructorReturn(this, (MaxObjects3DTest.__proto__ || Object.getPrototypeOf(MaxObjects3DTest)).call(this, canvas, config));

        _this._limit = 0;
        _this._wasSlowFrame = false;

        _this._limit = config.startingCount;
        return _this;
    }

    _createClass(MaxObjects3DTest, [{
        key: '_render',
        value: function _render(resolve) {
            if (this._paused) return this._render(resolve);

            this._clear();
            var start = Date.now();
            var config = this._config;
            for (var i = 0; i < this._limit; i++) {
                var obj = this._objs[i];
                obj.move(this.canvas.width, this.canvas.height);
                obj.draw(this._gl, this.shaderProgram);
            }
            var time = Date.now() - start;
            var ms = 1000 / config.targetFPS;
            var isSlow = time > ms;
            var isFirstSlow = this._slowFrames === 0;
            this._slowFrames = this._wasSlowFrame && !isFirstSlow && isSlow || !this._wasSlowFrame && isFirstSlow && isSlow ? this._slowFrames + 1 : 0;
            if (this._slowFrames > config.maxSlowFrames) {
                return resolve({ objects: this._limit, frames: this._frames });
            } else {
                this._limit += isSlow ? 0 : this._frames * config.countStep;
                this._wasSlowFrame = isSlow;
                this._frames++;

                window.requestAnimationFrame(this._render.bind(this, resolve));
            }
        }
    }]);

    return MaxObjects3DTest;
}(Base3DTest);

module.exports = MaxObjects3DTest;

},{"../config/Config":5,"../renderable/Renderable3D":7,"./Base3DTest":9}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjMvaW5kZXguanMiLCJzcmMvQ2FudmFzQmVuY2htYXJrLmpzIiwic3JjL01heE9iamVjdHNCZW5jaG1hcmsuanMiLCJzcmMvY29uZmlnL0NvbmZpZy5qcyIsInNyYy9yZW5kZXJhYmxlL1JlbmRlcmFibGUyRC5qcyIsInNyYy9yZW5kZXJhYmxlL1JlbmRlcmFibGUzRC5qcyIsInNyYy90ZXN0cy9CYXNlMkRUZXN0LmpzIiwic3JjL3Rlc3RzL0Jhc2UzRFRlc3QuanMiLCJzcmMvdGVzdHMvTWF4T2JqZWN0czJEVGVzdC5qcyIsInNyYy90ZXN0cy9NYXhPYmplY3RzM0RUZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFPLGVBQVAsR0FBeUIsUUFBUSx1QkFBUixDQUF6QjtBQUNBLE9BQU8sbUJBQVAsR0FBNkIsUUFBUSwyQkFBUixDQUE3Qjs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN2VEEsSUFBTSxlQUFlLFFBQVEsZUFBUixDQUFyQjtBQUNBLElBQU0sU0FBUyxRQUFRLGlCQUFSLENBQWY7QUFDQSxJQUFNLGFBQWEsUUFBUSxvQkFBUixDQUFuQjtBQUNBLElBQU0sYUFBYSxRQUFRLG9CQUFSLENBQW5COztBQUVBOzs7O0lBR00sZTs7O0FBYUYsK0JBQXlCO0FBQUEsWUFBYixNQUFhLHVFQUFKLEVBQUk7O0FBQUE7O0FBQUE7O0FBQUEsY0FQekIsTUFPeUIsR0FQaEIsQ0FPZ0I7QUFBQSxjQU56QixPQU15QixHQU5mLENBTWU7QUFBQSxjQUp6QixLQUl5QixHQUpqQixJQUlpQjtBQUFBLGNBRnpCLE9BRXlCLEdBRmYsSUFFZTs7QUFFckIsWUFBTSxVQUFVLE9BQU8sTUFBUCxDQUFjLEVBQWQsRUFBa0IsT0FBTyxRQUF6QixFQUFtQyxNQUFuQyxDQUFoQjtBQUNBLGNBQUssTUFBTCxHQUFjLEtBQUssS0FBTCxDQUFXLE9BQU8sVUFBUCxHQUFvQixJQUEvQixDQUFkO0FBQ0EsY0FBSyxPQUFMLEdBQWUsS0FBSyxLQUFMLENBQVcsT0FBTyxXQUFQLEdBQXFCLElBQWhDLENBQWY7O0FBRUEsY0FBSyxPQUFMLEdBQWUsU0FBUyxhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQSxjQUFLLE9BQUwsQ0FBYSxLQUFiLEdBQXFCLE1BQUssTUFBMUI7QUFDQSxjQUFLLE9BQUwsQ0FBYSxNQUFiLEdBQXNCLE1BQUssT0FBM0I7O0FBRUEsY0FBSyxPQUFMLENBQWEsS0FBYixDQUFtQixNQUFuQixHQUE0QixJQUE1QjtBQUNBLGNBQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsUUFBbkIsR0FBOEIsVUFBOUI7QUFDQSxjQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW1CLElBQW5CLEdBQTBCLENBQTFCO0FBQ0EsY0FBSyxPQUFMLENBQWEsS0FBYixDQUFtQixHQUFuQixHQUF5QixDQUF6Qjs7QUFFQSxjQUFLLGVBQUwsR0FBdUIsQ0FBdkI7QUFDQSxjQUFLLGVBQUwsR0FBdUIsQ0FBdkI7O0FBRUEsY0FBSyxnQkFBTCxHQUF3QixDQUF4QjtBQUNBLGNBQUssUUFBTCxHQUFnQixLQUFoQjs7QUFFQSxZQUFJLE1BQUssaUJBQUwsRUFBSixFQUE4QjtBQUMxQixvQkFBUSxJQUFSLENBQWEsYUFBYjtBQUNBLGtCQUFLLEtBQUwsR0FBYSxJQUFJLFVBQUosQ0FBZSxNQUFLLE9BQXBCLEVBQTZCLE9BQTdCLENBQWI7QUFDSCxTQUhELE1BR087QUFDSCxvQkFBUSxJQUFSLENBQWEsU0FBYjtBQUNBLGtCQUFLLEtBQUwsR0FBYSxJQUFJLFVBQUosQ0FBZSxNQUFLLE9BQXBCLEVBQTZCLE9BQTdCLENBQWI7QUFDSDs7QUFFRCxpQkFBUyxJQUFULENBQWMsV0FBZCxDQUEwQixNQUFLLE9BQS9COztBQUVBLGNBQUssdUJBQUwsR0FBK0IsTUFBSyxpQkFBTCxDQUF1QixJQUF2QixPQUEvQjtBQUNBLGlCQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxNQUFLLHVCQUFuRDtBQUNBLFlBQUcsU0FBUyxVQUFULEtBQXdCLElBQTNCLEVBQWlDLE1BQUssS0FBTDs7QUFFakM7O0FBbkNxQjtBQXFDeEI7O0FBRUQ7Ozs7Ozs7Z0NBR1E7QUFBQTs7QUFDSixpQkFBSyxlQUFMLEdBQXVCLFlBQVksR0FBWixFQUF2QjtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxHQUFYLEdBQ0csSUFESCxDQUNRLFVBQUMsTUFBRCxFQUFXO0FBQ2Ysd0JBQVEsSUFBUixDQUFhLHFCQUFiLEVBQW9DLE1BQXBDO0FBQ0EseUJBQVMsbUJBQVQsQ0FBNkIsa0JBQTdCLEVBQWlELE9BQUssdUJBQXREO0FBQ0EsdUJBQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0IsV0FBeEIsQ0FBb0MsT0FBSyxPQUF6QztBQUNBLHVCQUFLLGdCQUFMLElBQXlCLFlBQVksR0FBWixLQUFvQixPQUFLLGVBQWxEO0FBQ0Esb0JBQUksWUFBYSxPQUFLLGdCQUFMLEdBQXdCLElBQXpCLEdBQWlDLEVBQWpEO0FBQ0EsdUJBQUssSUFBTCxDQUFVLGdCQUFnQixNQUFoQixDQUF1QixNQUFqQyxFQUF5QyxTQUFTLFNBQWxEO0FBQ0QsYUFSSDtBQVNIOzs7K0JBRU07QUFDSCxpQkFBSyxLQUFMLENBQVcsSUFBWDtBQUNIOzs7Z0NBRU87QUFDSixnQkFBRyxLQUFLLFFBQVIsRUFBa0I7QUFDbEIsaUJBQUssUUFBTCxHQUFnQixJQUFoQjtBQUNBLGlCQUFLLGdCQUFMLElBQXlCLFlBQVksR0FBWixLQUFvQixLQUFLLGVBQWxEO0FBQ0EsaUJBQUssS0FBTCxDQUFXLEtBQVg7O0FBRUEsb0JBQVEsSUFBUixDQUFhLG9CQUFiO0FBQ0g7OztpQ0FFUTtBQUNMLGdCQUFHLENBQUMsS0FBSyxRQUFULEVBQW1CO0FBQ25CLGlCQUFLLFFBQUwsR0FBZ0IsS0FBaEI7O0FBRUEsaUJBQUssZUFBTCxHQUF1QixZQUFZLEdBQVosRUFBdkI7QUFDQSxpQkFBSyxLQUFMLENBQVcsR0FBWDs7QUFFQSxvQkFBUSxJQUFSLENBQWEscUJBQWI7QUFDSDs7OzRDQUVtQjtBQUNoQixnQkFBSSxTQUFTLGVBQVQsS0FBNkIsUUFBakMsRUFBMkM7QUFDdkMscUJBQUssS0FBTDtBQUNILGFBRkQsTUFFTyxJQUFHLFNBQVMsZUFBVCxLQUE2QixTQUFoQyxFQUEwQztBQUM3QyxxQkFBSyxNQUFMO0FBQ0g7QUFDSjs7OzRDQUVtQjtBQUNoQixnQkFBSSxpQkFBaUIsRUFBRSxTQUFTLElBQVgsRUFBaUIsOEJBQThCLElBQS9DLEVBQXJCO0FBQ0EsZ0JBQUk7QUFDQSxvQkFBSSxDQUFDLE9BQU8scUJBQVosRUFBbUMsT0FBTyxLQUFQOztBQUVuQyxvQkFBSSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFiO0FBQ0Esb0JBQUksS0FBSyxPQUFPLFVBQVAsQ0FBa0IsT0FBbEIsRUFBMkIsY0FBM0IsS0FBOEMsT0FBTyxVQUFQLENBQWtCLG9CQUFsQixFQUF3QyxjQUF4QyxDQUF2RDs7QUFFQSxvQkFBSSxVQUFVLENBQUMsRUFBRSxNQUFNLEdBQUcsb0JBQUgsR0FBMEIsT0FBbEMsQ0FBZjtBQUNBLG9CQUFJLEVBQUosRUFBUTtBQUNKLHdCQUFJLGNBQWMsR0FBRyxZQUFILENBQWdCLG9CQUFoQixDQUFsQjtBQUNBLHdCQUFHLFdBQUgsRUFBZ0IsWUFBWSxXQUFaO0FBQ25COztBQUVELHFCQUFLLElBQUw7QUFDQSx1QkFBTyxPQUFQO0FBQ0gsYUFkRCxDQWNFLE9BQU8sQ0FBUCxFQUFVO0FBQ1IsdUJBQU8sS0FBUDtBQUNIO0FBQ0o7Ozs7RUF0SHlCLFk7O0FBQXhCLGUsQ0FFSyxNLEdBQVM7QUFDWixZQUFRO0FBREksQzs7O0FBdUhwQixPQUFPLE9BQVAsR0FBaUIsZUFBakI7Ozs7Ozs7Ozs7Ozs7QUNqSUEsSUFBTSxlQUFlLFFBQVEsZUFBUixDQUFyQjtBQUNBLElBQU0sU0FBUyxRQUFRLGlCQUFSLENBQWY7QUFDQSxJQUFNLG1CQUFtQixRQUFRLDBCQUFSLENBQXpCO0FBQ0EsSUFBTSxtQkFBbUIsUUFBUSwwQkFBUixDQUF6Qjs7QUFFQTs7OztJQUdNLG1COzs7QUFhRixtQ0FBeUI7QUFBQSxZQUFiLE1BQWEsdUVBQUosRUFBSTs7QUFBQTs7QUFBQTs7QUFBQSxjQVB6QixNQU95QixHQVBoQixDQU9nQjtBQUFBLGNBTnpCLE9BTXlCLEdBTmYsQ0FNZTtBQUFBLGNBSnpCLEtBSXlCLEdBSmpCLElBSWlCO0FBQUEsY0FGekIsT0FFeUIsR0FGZixJQUVlOztBQUVyQixZQUFNLFVBQVUsT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixPQUFPLGNBQXpCLEVBQXlDLE1BQXpDLENBQWhCO0FBQ0EsY0FBSyxNQUFMLEdBQWMsS0FBSyxLQUFMLENBQVcsT0FBTyxVQUFQLEdBQW9CLElBQS9CLENBQWQ7QUFDQSxjQUFLLE9BQUwsR0FBZSxLQUFLLEtBQUwsQ0FBVyxPQUFPLFdBQVAsR0FBcUIsSUFBaEMsQ0FBZjs7QUFFQSxjQUFLLE9BQUwsR0FBZSxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBLGNBQUssT0FBTCxDQUFhLEtBQWIsR0FBcUIsTUFBSyxNQUExQjtBQUNBLGNBQUssT0FBTCxDQUFhLE1BQWIsR0FBc0IsTUFBSyxPQUEzQjs7QUFFQSxjQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW1CLE1BQW5CLEdBQTRCLElBQTVCO0FBQ0EsY0FBSyxPQUFMLENBQWEsS0FBYixDQUFtQixRQUFuQixHQUE4QixVQUE5QjtBQUNBLGNBQUssT0FBTCxDQUFhLEtBQWIsQ0FBbUIsSUFBbkIsR0FBMEIsQ0FBMUI7QUFDQSxjQUFLLE9BQUwsQ0FBYSxLQUFiLENBQW1CLEdBQW5CLEdBQXlCLENBQXpCOztBQUVBLGNBQUssZUFBTCxHQUF1QixDQUF2QjtBQUNBLGNBQUssZUFBTCxHQUF1QixDQUF2Qjs7QUFFQSxjQUFLLGdCQUFMLEdBQXdCLENBQXhCO0FBQ0EsY0FBSyxRQUFMLEdBQWdCLEtBQWhCOztBQUVBLFlBQUksTUFBSyxpQkFBTCxFQUFKLEVBQThCO0FBQzFCLG9CQUFRLElBQVIsQ0FBYSxhQUFiO0FBQ0Esa0JBQUssS0FBTCxHQUFhLElBQUksZ0JBQUosQ0FBcUIsTUFBSyxPQUExQixFQUFtQyxPQUFuQyxDQUFiO0FBQ0gsU0FIRCxNQUdPO0FBQ0gsb0JBQVEsSUFBUixDQUFhLFNBQWI7QUFDQSxrQkFBSyxLQUFMLEdBQWEsSUFBSSxnQkFBSixDQUFxQixNQUFLLE9BQTFCLEVBQW1DLE9BQW5DLENBQWI7QUFDSDs7QUFFRCxpQkFBUyxJQUFULENBQWMsV0FBZCxDQUEwQixNQUFLLE9BQS9COztBQUVBLGNBQUssdUJBQUwsR0FBK0IsTUFBSyxpQkFBTCxDQUF1QixJQUF2QixPQUEvQjtBQUNBLGlCQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxNQUFLLHVCQUFuRDtBQUNBLFlBQUcsU0FBUyxVQUFULEtBQXdCLElBQTNCLEVBQWlDLE1BQUssS0FBTDtBQWpDWjtBQWtDeEI7O0FBRUQ7Ozs7Ozs7Z0NBR2tDO0FBQUE7O0FBQUEsZ0JBQTVCLFFBQTRCLHVFQUFqQixPQUFPLFFBQVU7O0FBQzlCLG9CQUFRLEdBQVIsQ0FBWSxvQ0FBWjtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsUUFBZixFQUNHLElBREgsQ0FDUSxVQUFDLElBQUQ7QUFBQSx1QkFBUSxPQUFLLElBQUwsQ0FBVSxvQkFBb0IsTUFBcEIsQ0FBMkIsTUFBckMsRUFBNkMsSUFBN0MsQ0FBUjtBQUFBLGFBRFI7QUFFSDs7O2dDQUVPO0FBQ0osZ0JBQUcsS0FBSyxRQUFSLEVBQWtCOztBQUVsQixpQkFBSyxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsaUJBQUssS0FBTCxDQUFXLEtBQVg7O0FBRUEsb0JBQVEsSUFBUixDQUFhLHNDQUFiO0FBQ0g7OztpQ0FFUTtBQUNMLGdCQUFHLENBQUMsS0FBSyxRQUFULEVBQW1CO0FBQ25CLGlCQUFLLFFBQUwsR0FBZ0IsS0FBaEI7O0FBRUEsaUJBQUssS0FBTCxDQUFXLE1BQVg7O0FBRUEsb0JBQVEsSUFBUixDQUFhLHVDQUFiO0FBQ0g7Ozs0Q0FFbUI7QUFDaEIsZ0JBQUksU0FBUyxlQUFULEtBQTZCLFFBQWpDLEVBQTJDO0FBQ3ZDLHFCQUFLLEtBQUw7QUFDSCxhQUZELE1BRU8sSUFBRyxTQUFTLGVBQVQsS0FBNkIsU0FBaEMsRUFBMEM7QUFDN0MscUJBQUssTUFBTDtBQUNIO0FBQ0o7Ozs0Q0FFbUI7QUFDaEIsZ0JBQUksaUJBQWlCLEVBQUUsU0FBUyxJQUFYLEVBQWlCLDhCQUE4QixJQUEvQyxFQUFyQjtBQUNBLGdCQUFJO0FBQ0Esb0JBQUksQ0FBQyxPQUFPLHFCQUFaLEVBQW1DLE9BQU8sS0FBUDs7QUFFbkMsb0JBQUksU0FBUyxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBYjtBQUNBLG9CQUFJLEtBQUssT0FBTyxVQUFQLENBQWtCLE9BQWxCLEVBQTJCLGNBQTNCLEtBQThDLE9BQU8sVUFBUCxDQUFrQixvQkFBbEIsRUFBd0MsY0FBeEMsQ0FBdkQ7O0FBRUEsb0JBQUksVUFBVSxDQUFDLEVBQUUsTUFBTSxHQUFHLG9CQUFILEdBQTBCLE9BQWxDLENBQWY7QUFDQSxvQkFBSSxFQUFKLEVBQVE7QUFDSix3QkFBSSxjQUFjLEdBQUcsWUFBSCxDQUFnQixvQkFBaEIsQ0FBbEI7QUFDQSx3QkFBRyxXQUFILEVBQWdCLFlBQVksV0FBWjtBQUNuQjs7QUFFRCxxQkFBSyxJQUFMO0FBQ0EsdUJBQU8sT0FBUDtBQUNILGFBZEQsQ0FjRSxPQUFPLENBQVAsRUFBVTtBQUNSLHVCQUFPLEtBQVA7QUFDSDtBQUNKOzs7O0VBdkc2QixZOztBQUE1QixtQixDQUVLLE0sR0FBUztBQUNaLFlBQVE7QUFESSxDOzs7QUF3R3BCLE9BQU8sT0FBUCxHQUFpQixtQkFBakI7Ozs7O0FDbEhBLE9BQU8sT0FBUCxHQUFpQjtBQUNiLFlBQVU7QUFDUixXQUFPLEtBREM7QUFFUixpQkFBYSxJQUZMO0FBR1IsaUJBQWE7QUFITCxHQURHO0FBTWIsa0JBQWdCO0FBQ2QsV0FBTyxLQURPO0FBRWQsZUFBVyxFQUZHO0FBR2QsbUJBQWUsQ0FIRDtBQUlkLG1CQUFlLEdBSkQ7QUFLZCxlQUFXLEVBTEc7QUFNZCxpQkFBYSxLQU5DO0FBT2QsaUJBQWE7QUFQQztBQU5ILENBQWpCOzs7Ozs7Ozs7SUNBTSxZO0FBRUYsMEJBQVksRUFBWixFQUFnQixFQUFoQixFQUFvQjtBQUFBOztBQUNoQixhQUFLLENBQUwsR0FBUyxLQUFLLEtBQUwsQ0FBVyxLQUFLLE1BQUwsS0FBZ0IsRUFBM0IsQ0FBVDtBQUNBLGFBQUssQ0FBTCxHQUFTLEtBQUssS0FBTCxDQUFXLEtBQUssTUFBTCxLQUFnQixFQUEzQixDQUFUO0FBQ0EsYUFBSyxLQUFMLEdBQWEsS0FBSyxLQUFMLENBQVcsS0FBSyxFQUFoQixDQUFiO0FBQ0EsYUFBSyxNQUFMLEdBQWMsS0FBSyxLQUFMLENBQVcsS0FBSSxFQUFmLENBQWQ7QUFDQSxhQUFLLFFBQUwsR0FBZ0IsS0FBSyx1QkFBTCxFQUFoQjtBQUNIOzs7O2tEQUV5QjtBQUN0QixtQkFBTztBQUNILG1CQUFHLElBQUksS0FBSyxLQUFMLENBQVcsS0FBSyxNQUFMLEtBQWdCLENBQTNCLENBREo7QUFFSCxtQkFBRyxJQUFJLEtBQUssS0FBTCxDQUFXLEtBQUssTUFBTCxLQUFnQixDQUEzQjtBQUZKLGFBQVA7QUFJSDs7OzZCQUVJLEksRUFBTSxJLEVBQU07QUFDYixpQkFBSyxDQUFMLElBQVUsS0FBSyxRQUFMLENBQWMsQ0FBeEI7QUFDQSxpQkFBSyxDQUFMLElBQVUsS0FBSyxRQUFMLENBQWMsQ0FBeEI7QUFDQSxnQkFBSSxLQUFLLENBQUwsR0FBUyxDQUFULElBQWMsS0FBSyxDQUFMLEdBQVMsSUFBM0IsRUFBaUMsS0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixDQUFDLEtBQUssUUFBTCxDQUFjLENBQWpDO0FBQ2pDLGdCQUFJLEtBQUssQ0FBTCxHQUFTLENBQVQsSUFBYyxLQUFLLENBQUwsR0FBUyxJQUEzQixFQUFpQyxLQUFLLFFBQUwsQ0FBYyxDQUFkLEdBQWtCLENBQUMsS0FBSyxRQUFMLENBQWMsQ0FBakM7QUFDcEM7Ozs2QkFFSSxHLEVBQUs7QUFDTixnQkFBSSxTQUFKO0FBQ0EsZ0JBQUksTUFBSixDQUFXLEtBQUssQ0FBaEIsRUFBbUIsS0FBSyxDQUF4QjtBQUNBLGdCQUFJLE1BQUosQ0FBVyxLQUFLLENBQUwsR0FBUyxLQUFLLEtBQXpCLEVBQWdDLEtBQUssQ0FBckM7QUFDQSxnQkFBSSxNQUFKLENBQVcsS0FBSyxDQUFMLEdBQVMsS0FBSyxLQUF6QixFQUFnQyxLQUFLLENBQUwsR0FBUyxLQUFLLE1BQTlDO0FBQ0EsZ0JBQUksTUFBSixDQUFXLEtBQUssQ0FBTCxHQUFTLENBQXBCLEVBQXVCLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFBckM7QUFDQSxnQkFBSSxTQUFKO0FBQ0EsZ0JBQUksSUFBSjtBQUNIOzs7Ozs7QUFHTCxPQUFPLE9BQVAsR0FBaUIsWUFBakI7Ozs7Ozs7OztJQ2pDTSxZO0FBRUYsMEJBQVksRUFBWixFQUFnQixFQUFoQixFQUFvQixFQUFwQixFQUF3QjtBQUFBOztBQUNwQixhQUFLLENBQUwsR0FBUyxPQUFPLEtBQUssTUFBTCxLQUFnQixHQUFoQixHQUFzQixHQUF0QztBQUNBLGFBQUssQ0FBTCxHQUFTLE9BQU8sS0FBSyxNQUFMLEtBQWdCLEdBQWhCLEdBQXNCLEdBQXRDO0FBQ0EsYUFBSyxLQUFMLEdBQWEsSUFBYjtBQUNBLGFBQUssTUFBTCxHQUFjLElBQWQ7QUFDQSxhQUFLLFFBQUwsR0FBZ0IsS0FBSyx1QkFBTCxFQUFoQjs7QUFFQSxhQUFLLFFBQUwsR0FBZ0IsSUFBSSxZQUFKLENBQWlCLENBQzdCLEtBQUssQ0FBTCxHQUFTLEtBQUssS0FEZSxFQUNQLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFEUCxFQUU3QixLQUFLLENBRndCLEVBRXBCLEtBQUssQ0FBTCxHQUFTLEtBQUssTUFGTSxFQUc3QixLQUFLLENBQUwsR0FBUyxLQUFLLEtBSGUsRUFHUixLQUFLLENBSEcsRUFJN0IsS0FBSyxDQUp3QixFQUlyQixLQUFLLENBSmdCLENBQWpCLENBQWhCOztBQU9BLGFBQUssT0FBTCxHQUFlLEdBQUcsWUFBSCxFQUFmOztBQUVBLGFBQUssUUFBTCxHQUFnQixDQUFoQjtBQUNBLGFBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsQ0FBYyxNQUFkLEdBQXVCLEtBQUssUUFBNUM7QUFDSDs7OztrREFFeUI7QUFDdEIsbUJBQU87QUFDSCxtQkFBRyxPQUFPLEtBQUssTUFBTCxLQUFnQixDQUFoQixHQUFvQixHQUQzQjtBQUVILG1CQUFHLE9BQU8sS0FBSyxNQUFMLEtBQWdCLENBQWhCLEdBQW9CO0FBRjNCLGFBQVA7QUFJSDs7OytCQUVNO0FBQ0gsaUJBQUssQ0FBTCxJQUFVLEtBQUssUUFBTCxDQUFjLENBQXhCO0FBQ0EsaUJBQUssQ0FBTCxJQUFVLEtBQUssUUFBTCxDQUFjLENBQXhCO0FBQ0EsZ0JBQUksS0FBSyxDQUFMLElBQVUsQ0FBQyxDQUFYLElBQWdCLEtBQUssQ0FBTCxHQUFTLElBQTdCLEVBQW1DLEtBQUssUUFBTCxDQUFjLENBQWQsR0FBa0IsQ0FBQyxLQUFLLFFBQUwsQ0FBYyxDQUFqQztBQUNuQyxnQkFBSSxLQUFLLENBQUwsSUFBVSxDQUFDLENBQVgsSUFBZ0IsS0FBSyxDQUFMLEdBQVMsSUFBN0IsRUFBbUMsS0FBSyxRQUFMLENBQWMsQ0FBZCxHQUFrQixDQUFDLEtBQUssUUFBTCxDQUFjLENBQWpDOztBQUVuQyxpQkFBSyxRQUFMLEdBQWdCLElBQUksWUFBSixDQUFpQixDQUM3QixLQUFLLENBQUwsR0FBUyxLQUFLLEtBRGUsRUFDUCxLQUFLLENBQUwsR0FBUyxLQUFLLE1BRFAsRUFFN0IsS0FBSyxDQUZ3QixFQUVwQixLQUFLLENBQUwsR0FBUyxLQUFLLE1BRk0sRUFHN0IsS0FBSyxDQUFMLEdBQVMsS0FBSyxLQUhlLEVBR1IsS0FBSyxDQUhHLEVBSTdCLEtBQUssQ0FKd0IsRUFJckIsS0FBSyxDQUpnQixDQUFqQixDQUFoQjtBQU9IOzs7NkJBRUksRSxFQUFJLGEsRUFBZTtBQUNwQixlQUFHLFVBQUgsQ0FBYyxHQUFHLFlBQWpCLEVBQStCLEtBQUssT0FBcEM7QUFDQSxlQUFHLFVBQUgsQ0FBYyxHQUFHLFlBQWpCLEVBQStCLEtBQUssUUFBcEMsRUFBOEMsR0FBRyxXQUFqRDtBQUNBLDBCQUFjLGVBQWQsR0FBZ0MsR0FBRyxpQkFBSCxDQUFxQixhQUFyQixFQUFvQyxpQkFBcEMsQ0FBaEM7QUFDQSxlQUFHLHVCQUFILENBQTJCLGNBQWMsZUFBekM7QUFDQSxlQUFHLG1CQUFILENBQXVCLGNBQWMsZUFBckMsRUFBc0QsS0FBSyxRQUEzRCxFQUFxRSxHQUFHLEtBQXhFLEVBQStFLEtBQS9FLEVBQXNGLENBQXRGLEVBQXlGLENBQXpGO0FBQ0EsZUFBRyxVQUFILENBQWMsR0FBRyxjQUFqQixFQUFpQyxDQUFqQyxFQUFvQyxLQUFLLFFBQXpDO0FBQ0g7Ozs7OztBQUdMLE9BQU8sT0FBUCxHQUFpQixZQUFqQjs7Ozs7Ozs7O0FDeERBLElBQU0sU0FBUyxRQUFRLGtCQUFSLENBQWY7QUFDQSxJQUFNLGVBQWUsUUFBUSw0QkFBUixDQUFyQjs7SUFFTSxVO0FBYUYsd0JBQVksTUFBWixFQUFvQixNQUFwQixFQUE0QjtBQUFBOztBQUFBLGFBWDVCLEtBVzRCLEdBWHBCLEVBV29CO0FBQUEsYUFWNUIsUUFVNEIsR0FWakIsSUFVaUI7QUFBQSxhQVI1QixNQVE0QixHQVJuQixJQVFtQjtBQUFBLGFBTjVCLE9BTTRCLEdBTmxCLENBTWtCO0FBQUEsYUFKNUIsT0FJNEIsR0FKbEIsS0FJa0I7QUFBQSxhQUY1QixTQUU0QixHQUZoQixLQUVnQjs7QUFDeEIsYUFBSyxNQUFMLEdBQWMsTUFBZDtBQUNBLGFBQUssT0FBTCxHQUFlLE1BQWY7QUFDQSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxPQUFMLENBQWEsV0FBakMsRUFBOEMsR0FBOUM7QUFBbUQsaUJBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsSUFBSSxZQUFKLENBQWlCLE9BQU8sS0FBeEIsRUFBK0IsT0FBTyxNQUF0QyxDQUFoQjtBQUFuRCxTQUNBLEtBQUssUUFBTCxHQUFnQixPQUFPLFVBQVAsQ0FBa0IsSUFBbEIsQ0FBaEI7QUFDQSxhQUFLLFFBQUwsQ0FBYyxTQUFkLEdBQTBCLEtBQUssT0FBTCxDQUFhLEtBQWIsR0FBcUIsd0JBQXJCLEdBQWdELGtCQUExRTtBQUNIOzs7OzhCQUVLO0FBQUE7O0FBQ0YsbUJBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFEO0FBQUEsdUJBQWEsTUFBSyxPQUFMLENBQWEsT0FBYixDQUFiO0FBQUEsYUFBWixDQUFQO0FBQ0g7OztnQ0FFTztBQUNKLGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0g7OzsrQkFFTTtBQUNILGlCQUFLLFNBQUwsR0FBaUIsSUFBakI7QUFDSDs7O2lDQUVRO0FBQ0wsaUJBQUssUUFBTCxDQUFjLFNBQWQsQ0FBd0IsQ0FBeEIsRUFBMkIsQ0FBM0IsRUFBOEIsS0FBSyxNQUFMLENBQVksS0FBMUMsRUFBaUQsS0FBSyxNQUFMLENBQVksTUFBN0Q7QUFDSDs7O2dDQUVPLE8sRUFBUztBQUFBOztBQUNmLGdCQUFHLEtBQUssU0FBUixFQUFtQixPQUFPLFFBQVEsS0FBSyxPQUFiLENBQVA7QUFDbkIsZ0JBQUcsS0FBSyxPQUFSLEVBQWlCLE9BQU8sS0FBSyxPQUFMLENBQWEsT0FBYixDQUFQOztBQUVmLGlCQUFLLE1BQUw7QUFDQSxpQkFBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixVQUFDLEdBQUQsRUFBUztBQUN4QixvQkFBSSxJQUFKLENBQVMsT0FBSyxNQUFMLENBQVksS0FBckIsRUFBNEIsT0FBSyxNQUFMLENBQVksTUFBeEM7QUFDQSxvQkFBSSxJQUFKLENBQVMsT0FBSyxRQUFkO0FBQ0gsYUFIRDtBQUlBLGlCQUFLLE9BQUw7O0FBRUEsbUJBQU8scUJBQVAsQ0FBNkI7QUFBQSx1QkFBSSxPQUFLLE9BQUwsQ0FBYSxPQUFiLENBQUo7QUFBQSxhQUE3QjtBQUNIOzs7Ozs7QUFHTCxPQUFPLE9BQVAsR0FBaUIsVUFBakI7Ozs7Ozs7OztBQ3ZEQSxJQUFNLGVBQWUsUUFBUSw0QkFBUixDQUFyQjs7QUFFQTtBQUNBLElBQU0sc0lBQU47O0FBUUEsSUFBTSxxS0FBTjs7SUFZTSxVO0FBZ0JGLHdCQUFZLE1BQVosRUFBb0IsTUFBcEIsRUFBNEI7QUFBQTs7QUFBQSxhQWQ1QixLQWM0QixHQWRwQixFQWNvQjtBQUFBLGFBWjVCLEdBWTRCLEdBWnRCLElBWXNCO0FBQUEsYUFWNUIsT0FVNEIsR0FWbEIsQ0FVa0I7QUFBQSxhQVI1QixPQVE0QixHQVJsQixLQVFrQjtBQUFBLGFBTjVCLFNBTTRCLEdBTmhCLEtBTWdCO0FBQUEsYUFKNUIsTUFJNEIsR0FKbkIsSUFJbUI7QUFBQSxhQUY1QixhQUU0QixHQUZaLElBRVk7O0FBQ3hCLGFBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxhQUFLLE9BQUwsR0FBZSxNQUFmOztBQUVBLGFBQUssR0FBTCxHQUFXLE9BQU8sVUFBUCxDQUFrQixvQkFBbEIsQ0FBWDtBQUNBLGFBQUssR0FBTCxDQUFTLGFBQVQsR0FBeUIsT0FBTyxLQUFoQztBQUNBLGFBQUssR0FBTCxDQUFTLGNBQVQsR0FBMEIsT0FBTyxNQUFqQztBQUNBLGFBQUssR0FBTCxDQUFTLFVBQVQsQ0FBb0IsQ0FBcEIsRUFBdUIsQ0FBdkIsRUFBMEIsQ0FBMUIsRUFBNkIsQ0FBN0I7QUFDQSxhQUFLLEdBQUwsQ0FBUyxLQUFULENBQWUsS0FBSyxHQUFMLENBQVMsZ0JBQXhCOztBQUVBLFlBQUksS0FBSyxLQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLEtBQUssR0FBTCxDQUFTLGFBQS9CLENBQVQ7QUFDQSxhQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLEVBQXRCLEVBQTBCLE1BQTFCO0FBQ0EsYUFBSyxHQUFMLENBQVMsYUFBVCxDQUF1QixFQUF2Qjs7QUFFQSxZQUFJLEtBQUssS0FBSyxHQUFMLENBQVMsWUFBVCxDQUFzQixLQUFLLEdBQUwsQ0FBUyxlQUEvQixDQUFUO0FBQ0EsYUFBSyxHQUFMLENBQVMsWUFBVCxDQUFzQixFQUF0QixFQUEwQixRQUExQjtBQUNBLGFBQUssR0FBTCxDQUFTLGFBQVQsQ0FBdUIsRUFBdkI7O0FBRUEsYUFBSyxhQUFMLEdBQXFCLEtBQUssR0FBTCxDQUFTLGFBQVQsRUFBckI7QUFDQSxhQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLEtBQUssYUFBM0IsRUFBMEMsRUFBMUM7QUFDQSxhQUFLLEdBQUwsQ0FBUyxZQUFULENBQXNCLEtBQUssYUFBM0IsRUFBMEMsRUFBMUM7QUFDQSxhQUFLLEdBQUwsQ0FBUyxXQUFULENBQXFCLEtBQUssYUFBMUI7O0FBRUEsWUFBSSxDQUFDLEtBQUssR0FBTCxDQUFTLGtCQUFULENBQTRCLEVBQTVCLEVBQWdDLEtBQUssR0FBTCxDQUFTLGNBQXpDLENBQUwsRUFBK0QsUUFBUSxHQUFSLENBQVksS0FBSyxHQUFMLENBQVMsZ0JBQVQsQ0FBMEIsRUFBMUIsQ0FBWjtBQUMvRCxZQUFJLENBQUMsS0FBSyxHQUFMLENBQVMsa0JBQVQsQ0FBNEIsRUFBNUIsRUFBZ0MsS0FBSyxHQUFMLENBQVMsY0FBekMsQ0FBTCxFQUErRCxRQUFRLEdBQVIsQ0FBWSxLQUFLLEdBQUwsQ0FBUyxnQkFBVCxDQUEwQixFQUExQixDQUFaO0FBQy9ELFlBQUksQ0FBQyxLQUFLLEdBQUwsQ0FBUyxtQkFBVCxDQUE2QixLQUFLLGFBQWxDLEVBQWlELEtBQUssR0FBTCxDQUFTLFdBQTFELENBQUwsRUFBNkUsUUFBUSxHQUFSLENBQVksS0FBSyxHQUFMLENBQVMsaUJBQVQsQ0FBMkIsS0FBSyxhQUFoQyxDQUFaOztBQUU3RSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxPQUFMLENBQWEsV0FBakMsRUFBOEMsR0FBOUMsRUFBbUQ7QUFDL0MsaUJBQUssS0FBTCxDQUFXLElBQVgsQ0FBZ0IsSUFBSSxZQUFKLENBQWlCLE9BQU8sS0FBeEIsRUFBK0IsT0FBTyxNQUF0QyxFQUE4QyxLQUFLLEdBQW5ELENBQWhCO0FBQ0g7O0FBRUQsYUFBSyxHQUFMLENBQVMsVUFBVCxDQUFvQixLQUFLLGFBQXpCOztBQUVBLGFBQUssYUFBTCxDQUFtQixNQUFuQixHQUE0QixLQUFLLEdBQUwsQ0FBUyxrQkFBVCxDQUE0QixLQUFLLGFBQWpDLEVBQWdELFFBQWhELENBQTVCO0FBQ0EsWUFBTSxTQUFTLEtBQUssT0FBTCxDQUFhLEtBQWIsR0FBcUIsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsRUFBZ0IsR0FBaEIsQ0FBckIsR0FBNEMsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsRUFBZ0IsR0FBaEIsQ0FBM0Q7QUFDQSxhQUFLLEdBQUwsQ0FBUyxVQUFULENBQW9CLEtBQUssYUFBTCxDQUFtQixNQUF2QyxFQUErQyxNQUEvQztBQUNIOzs7OzhCQUVLO0FBQUE7O0FBQ0YsbUJBQU8sSUFBSSxPQUFKLENBQVksVUFBQyxPQUFEO0FBQUEsdUJBQWEsTUFBSyxPQUFMLENBQWEsT0FBYixDQUFiO0FBQUEsYUFBWixDQUFQO0FBQ0g7OztnQ0FFTztBQUNKLGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0g7OzsrQkFFTTtBQUNILGlCQUFLLFNBQUwsR0FBaUIsSUFBakI7QUFDSDs7O2lDQUVRO0FBQ0wsaUJBQUssR0FBTCxDQUFTLFFBQVQsQ0FBa0IsQ0FBbEIsRUFBcUIsQ0FBckIsRUFBd0IsS0FBSyxHQUFMLENBQVMsYUFBakMsRUFBZ0QsS0FBSyxHQUFMLENBQVMsY0FBekQ7QUFDQSxpQkFBSyxHQUFMLENBQVMsS0FBVCxDQUFlLEtBQUssR0FBTCxDQUFTLGdCQUFULEdBQTRCLEtBQUssR0FBTCxDQUFTLGdCQUFwRDtBQUNIOzs7Z0NBRU8sTyxFQUFTO0FBQUE7O0FBQ2IsZ0JBQUcsS0FBSyxTQUFSLEVBQW1CLE9BQU8sUUFBUSxLQUFLLE9BQWIsQ0FBUDtBQUNuQixnQkFBRyxLQUFLLE9BQVIsRUFBaUIsT0FBTyxLQUFLLE9BQUwsQ0FBYSxPQUFiLENBQVA7O0FBRWpCLGlCQUFLLE1BQUw7QUFDQSxpQkFBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixVQUFDLEdBQUQsRUFBUztBQUN4QixvQkFBSSxJQUFKLENBQVMsT0FBSyxNQUFMLENBQVksS0FBckIsRUFBNEIsT0FBSyxNQUFMLENBQVksTUFBeEM7QUFDQSxvQkFBSSxJQUFKLENBQVMsT0FBSyxHQUFkLEVBQW1CLE9BQUssYUFBeEI7QUFDSCxhQUhEO0FBSUEsaUJBQUssT0FBTDs7QUFFQSxtQkFBTyxxQkFBUCxDQUE2QjtBQUFBLHVCQUFLLE9BQUssT0FBTCxDQUFhLE9BQWIsQ0FBTDtBQUFBLGFBQTdCO0FBQ0g7Ozs7OztBQUdMLE9BQU8sT0FBUCxHQUFpQixVQUFqQjs7Ozs7Ozs7Ozs7OztBQzdHQSxJQUFNLFNBQVMsUUFBUSxrQkFBUixDQUFmO0FBQ0EsSUFBTSxlQUFlLFFBQVEsNEJBQVIsQ0FBckI7QUFDQSxJQUFNLGFBQWEsUUFBUSxjQUFSLENBQW5COztJQUVNLGdCOzs7QUFLRiw4QkFBWSxNQUFaLEVBQW9CLE1BQXBCLEVBQTRCO0FBQUE7O0FBQUEsd0lBQ2xCLE1BRGtCLEVBQ1YsTUFEVTs7QUFBQSxjQUo1QixNQUk0QixHQUpuQixDQUltQjtBQUFBLGNBRjVCLGFBRTRCLEdBRlosS0FFWTs7QUFFeEIsY0FBSyxNQUFMLEdBQWMsT0FBTyxhQUFyQjtBQUZ3QjtBQUczQjs7OztnQ0FFTyxPLEVBQVM7QUFDYixnQkFBRyxLQUFLLE9BQVIsRUFBaUIsT0FBTyxLQUFLLE9BQUwsQ0FBYSxPQUFiLENBQVA7O0FBRWpCLGlCQUFLLE1BQUw7QUFDQSxnQkFBTSxRQUFRLEtBQUssR0FBTCxFQUFkO0FBQ0EsZ0JBQU0sU0FBUyxLQUFLLE9BQXBCO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLE1BQXpCLEVBQWlDLEdBQWpDLEVBQXNDO0FBQ3BDLG9CQUFNLE1BQU0sS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFaO0FBQ0Esb0JBQUksSUFBSixDQUFTLEtBQUssTUFBTCxDQUFZLEtBQXJCLEVBQTRCLEtBQUssTUFBTCxDQUFZLE1BQXhDO0FBQ0Esb0JBQUksSUFBSixDQUFTLEtBQUssUUFBZDtBQUNEO0FBQ0QsZ0JBQU0sT0FBTyxLQUFLLEdBQUwsS0FBYSxLQUExQjtBQUNBLGdCQUFNLEtBQUssT0FBTyxPQUFPLFNBQXpCO0FBQ0EsZ0JBQU0sU0FBUyxPQUFPLEVBQXRCO0FBQ0EsZ0JBQU0sY0FBYyxLQUFLLFdBQUwsS0FBcUIsQ0FBekM7QUFDQSxpQkFBSyxXQUFMLEdBQW9CLEtBQUssYUFBTCxJQUFzQixDQUFDLFdBQXZCLElBQXNDLE1BQXZDLElBQW1ELENBQUMsS0FBSyxhQUFOLElBQXVCLFdBQXZCLElBQXNDLE1BQXpGLEdBQW1HLEtBQUssV0FBTCxHQUFtQixDQUF0SCxHQUEwSCxDQUE3STtBQUNBLGdCQUFHLEtBQUssV0FBTCxHQUFtQixPQUFPLGFBQTdCLEVBQTRDO0FBQzFDLHVCQUFPLFFBQVEsRUFBQyxTQUFTLEtBQUssTUFBZixFQUF1QixRQUFRLEtBQUssT0FBcEMsRUFBUixDQUFQO0FBQ0QsYUFGRCxNQUVPO0FBQ0wscUJBQUssTUFBTCxJQUFlLFNBQVMsQ0FBVCxHQUFhLEtBQUssT0FBTCxHQUFlLE9BQU8sU0FBbEQ7QUFDQSxxQkFBSyxhQUFMLEdBQXFCLE1BQXJCO0FBQ0EscUJBQUssT0FBTDtBQUNBLHVCQUFPLHFCQUFQLENBQTZCLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0IsT0FBeEIsQ0FBN0I7QUFDRDtBQUNKOzs7O0VBbEMwQixVOztBQXFDL0IsT0FBTyxPQUFQLEdBQWlCLGdCQUFqQjs7Ozs7Ozs7Ozs7OztBQ3pDQSxJQUFNLFNBQVMsUUFBUSxrQkFBUixDQUFmO0FBQ0EsSUFBTSxlQUFlLFFBQVEsNEJBQVIsQ0FBckI7QUFDQSxJQUFNLGFBQWEsUUFBUSxjQUFSLENBQW5COztJQUVNLGdCOzs7QUFNRiw4QkFBWSxNQUFaLEVBQW9CLE1BQXBCLEVBQTRCO0FBQUE7O0FBQUEsd0lBQ3BCLE1BRG9CLEVBQ1osTUFEWTs7QUFBQSxjQUo1QixNQUk0QixHQUpuQixDQUltQjtBQUFBLGNBRjVCLGFBRTRCLEdBRlosS0FFWTs7QUFFMUIsY0FBSyxNQUFMLEdBQWMsT0FBTyxhQUFyQjtBQUYwQjtBQUczQjs7OztnQ0FFTyxPLEVBQVM7QUFDYixnQkFBRyxLQUFLLE9BQVIsRUFBaUIsT0FBTyxLQUFLLE9BQUwsQ0FBYSxPQUFiLENBQVA7O0FBRWpCLGlCQUFLLE1BQUw7QUFDQSxnQkFBTSxRQUFRLEtBQUssR0FBTCxFQUFkO0FBQ0EsZ0JBQU0sU0FBUyxLQUFLLE9BQXBCO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLE1BQXpCLEVBQWlDLEdBQWpDLEVBQXNDO0FBQ3BDLG9CQUFNLE1BQU0sS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFaO0FBQ0Esb0JBQUksSUFBSixDQUFTLEtBQUssTUFBTCxDQUFZLEtBQXJCLEVBQTRCLEtBQUssTUFBTCxDQUFZLE1BQXhDO0FBQ0Esb0JBQUksSUFBSixDQUFTLEtBQUssR0FBZCxFQUFtQixLQUFLLGFBQXhCO0FBQ0Q7QUFDRCxnQkFBTSxPQUFPLEtBQUssR0FBTCxLQUFhLEtBQTFCO0FBQ0EsZ0JBQU0sS0FBSyxPQUFPLE9BQU8sU0FBekI7QUFDQSxnQkFBTSxTQUFTLE9BQU8sRUFBdEI7QUFDQSxnQkFBTSxjQUFjLEtBQUssV0FBTCxLQUFxQixDQUF6QztBQUNBLGlCQUFLLFdBQUwsR0FBb0IsS0FBSyxhQUFMLElBQXNCLENBQUMsV0FBdkIsSUFBc0MsTUFBdkMsSUFBbUQsQ0FBQyxLQUFLLGFBQU4sSUFBdUIsV0FBdkIsSUFBc0MsTUFBekYsR0FBbUcsS0FBSyxXQUFMLEdBQW1CLENBQXRILEdBQTBILENBQTdJO0FBQ0EsZ0JBQUcsS0FBSyxXQUFMLEdBQW1CLE9BQU8sYUFBN0IsRUFBNEM7QUFDMUMsdUJBQU8sUUFBUSxFQUFDLFNBQVMsS0FBSyxNQUFmLEVBQXVCLFFBQVEsS0FBSyxPQUFwQyxFQUFSLENBQVA7QUFDRCxhQUZELE1BRU87QUFDTCxxQkFBSyxNQUFMLElBQWUsU0FBUyxDQUFULEdBQWEsS0FBSyxPQUFMLEdBQWUsT0FBTyxTQUFsRDtBQUNBLHFCQUFLLGFBQUwsR0FBcUIsTUFBckI7QUFDQSxxQkFBSyxPQUFMOztBQUVBLHVCQUFPLHFCQUFQLENBQTZCLEtBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0IsT0FBeEIsQ0FBN0I7QUFDRDtBQUNKOzs7O0VBcEMwQixVOztBQXVDL0IsT0FBTyxPQUFQLEdBQWlCLGdCQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIndpbmRvdy5DYW52YXNCZW5jaG1hcmsgPSByZXF1aXJlKCcuL3NyYy9DYW52YXNCZW5jaG1hcmsnKTtcclxud2luZG93Lk1heE9iamVjdHNCZW5jaG1hcmsgPSByZXF1aXJlKCcuL3NyYy9NYXhPYmplY3RzQmVuY2htYXJrJyk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIHByZWZpeCA9ICd+JztcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBzdG9yYWdlIGZvciBvdXIgYEVFYCBvYmplY3RzLlxuICogQW4gYEV2ZW50c2AgaW5zdGFuY2UgaXMgYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRXZlbnRzKCkge31cblxuLy9cbi8vIFdlIHRyeSB0byBub3QgaW5oZXJpdCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC4gSW4gc29tZSBlbmdpbmVzIGNyZWF0aW5nIGFuXG4vLyBpbnN0YW5jZSBpbiB0aGlzIHdheSBpcyBmYXN0ZXIgdGhhbiBjYWxsaW5nIGBPYmplY3QuY3JlYXRlKG51bGwpYCBkaXJlY3RseS5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBjaGFyYWN0ZXIgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Rcbi8vIG92ZXJyaWRkZW4gb3IgdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy9cbmlmIChPYmplY3QuY3JlYXRlKSB7XG4gIEV2ZW50cy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIC8vXG4gIC8vIFRoaXMgaGFjayBpcyBuZWVkZWQgYmVjYXVzZSB0aGUgYF9fcHJvdG9fX2AgcHJvcGVydHkgaXMgc3RpbGwgaW5oZXJpdGVkIGluXG4gIC8vIHNvbWUgb2xkIGJyb3dzZXJzIGxpa2UgQW5kcm9pZCA0LCBpUGhvbmUgNS4xLCBPcGVyYSAxMSBhbmQgU2FmYXJpIDUuXG4gIC8vXG4gIGlmICghbmV3IEV2ZW50cygpLl9fcHJvdG9fXykgcHJlZml4ID0gZmFsc2U7XG59XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgZXZlbnQgbGlzdGVuZXIuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBTcGVjaWZ5IGlmIHRoZSBsaXN0ZW5lciBpcyBhIG9uZS10aW1lIGxpc3RlbmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgbmFtZXMgPSBbXVxuICAgICwgZXZlbnRzXG4gICAgLCBuYW1lO1xuXG4gIGlmICh0aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiAoZXZlbnRzID0gdGhpcy5fZXZlbnRzKSkge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBPbmx5IGNoZWNrIGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGVsc2UgYGZhbHNlYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgNDogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMiwgYTMpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgdGhpcy5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFt0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYSBvbmUtdGltZSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBsaXN0ZW5lcnMgb2YgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gT25seSByZW1vdmUgdGhlIGxpc3RlbmVycyB0aGF0IG1hdGNoIHRoaXMgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBoYXZlIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmUtdGltZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuICBpZiAoIWZuKSB7XG4gICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKFxuICAgICAgICAgbGlzdGVuZXJzLmZuID09PSBmblxuICAgICAgJiYgKCFvbmNlIHx8IGxpc3RlbmVycy5vbmNlKVxuICAgICAgJiYgKCFjb250ZXh0IHx8IGxpc3RlbmVycy5jb250ZXh0ID09PSBjb250ZXh0KVxuICAgICkge1xuICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnRzID0gW10sIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgICAvL1xuICAgIGlmIChldmVudHMubGVuZ3RoKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gICAgZWxzZSBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gW2V2ZW50XSBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIHZhciBldnQ7XG5cbiAgaWYgKGV2ZW50KSB7XG4gICAgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcbiAgICBpZiAodGhpcy5fZXZlbnRzW2V2dF0pIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gQWxsb3cgYEV2ZW50RW1pdHRlcmAgdG8gYmUgaW1wb3J0ZWQgYXMgbW9kdWxlIG5hbWVzcGFjZS5cbi8vXG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xyXG5jb25zdCBDb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy9Db25maWcnKTtcclxuY29uc3QgQmFzZTJEVGVzdCA9IHJlcXVpcmUoJy4vdGVzdHMvQmFzZTJEVGVzdCcpO1xyXG5jb25zdCBCYXNlM0RUZXN0ID0gcmVxdWlyZSgnLi90ZXN0cy9CYXNlM0RUZXN0Jyk7XHJcblxyXG4vKipcclxuICogbWFpblxyXG4gKi9cclxuY2xhc3MgQ2FudmFzQmVuY2htYXJrIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcclxuXHJcbiAgICBzdGF0aWMgRVZFTlRTID0ge1xyXG4gICAgICAgIEZJTklTSDogJ2ZpbmlzaCdcclxuICAgIH07XHJcblxyXG4gICAgX3dpZHRoID0gMDtcclxuICAgIF9oZWlnaHQgPSAwO1xyXG5cclxuICAgIF90ZXN0ID0gbnVsbDtcclxuXHJcbiAgICBfY2FudmFzID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcgPSB7fSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgY29uc3QgX2NvbmZpZyA9IE9iamVjdC5hc3NpZ24oe30sIENvbmZpZy5iYXNlVGVzdCwgY29uZmlnKTtcclxuICAgICAgICB0aGlzLl93aWR0aCA9IE1hdGgucm91bmQod2luZG93LmlubmVyV2lkdGggKiAwLjk5KTtcclxuICAgICAgICB0aGlzLl9oZWlnaHQgPSBNYXRoLnJvdW5kKHdpbmRvdy5pbm5lckhlaWdodCAqIDAuOTkpO1xyXG5cclxuICAgICAgICB0aGlzLl9jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICB0aGlzLl9jYW52YXMud2lkdGggPSB0aGlzLl93aWR0aDtcclxuICAgICAgICB0aGlzLl9jYW52YXMuaGVpZ2h0ID0gdGhpcy5faGVpZ2h0O1xyXG5cclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUuekluZGV4ID0gOTk5OTtcclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5sZWZ0ID0gMDtcclxuICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUudG9wID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5fZGVsdGFGcmFtZVRpbWUgPSAwO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZXN0YW1wID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5fdG90YWxUaW1lTGFwc2VkID0gMDtcclxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9pc1dlYkdMU3VwcG9ydGVkKCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiV0VCIEdMIFRFU1RcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3Rlc3QgPSBuZXcgQmFzZTNEVGVzdCh0aGlzLl9jYW52YXMsIF9jb25maWcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIjJEIFRFU1RcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3Rlc3QgPSBuZXcgQmFzZTJEVGVzdCh0aGlzLl9jYW52YXMsIF9jb25maWcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLl9jYW52YXMpO1xyXG5cclxuICAgICAgICB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyID0gdGhpcy5fb25QYWdlVmlzaWJpbGl0eS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyKTtcclxuICAgICAgICBpZihkb2N1bWVudC5fX2lzSGlkZGVuID09PSB0cnVlKSB0aGlzLnBhdXNlKCk7XHJcblxyXG4gICAgICAgIC8vIHRoaXMuX3Rlc3Qub24oJ3J1bkNvbXBsZXRlZCcsIHRoaXMuX2ZpbmlzaGVkLmJpbmQodGhpcykpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7TnVtYmVyIHwgdW5kZWZpbmVkfSBkdXJhdGlvblxyXG4gICAgICovXHJcbiAgICBzdGFydCgpIHtcclxuICAgICAgICB0aGlzLl9zdGFydFRpbWVzdGFtcCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICAgIHRoaXMuX3Rlc3QucnVuKClcclxuICAgICAgICAgIC50aGVuKChmcmFtZXMpPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJGcmFtZXMgYWNjb21wbGlzaGVkXCIsIGZyYW1lcyk7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCB0aGlzLl9wYWdlVmlzaWJpbGl0eUxpc3RlbmVyKTtcclxuICAgICAgICAgICAgdGhpcy5fY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fY2FudmFzKTtcclxuICAgICAgICAgICAgdGhpcy5fdG90YWxUaW1lTGFwc2VkICs9IHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5fc3RhcnRUaW1lc3RhbXA7XHJcbiAgICAgICAgICAgIGxldCBtYXhGcmFtZXMgPSAodGhpcy5fdG90YWxUaW1lTGFwc2VkIC8gMTAwMCkgKiA2MDtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KENhbnZhc0JlbmNobWFyay5FVkVOVFMuRklOSVNILCBmcmFtZXMgLyBtYXhGcmFtZXMpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcCgpIHtcclxuICAgICAgICB0aGlzLl90ZXN0LnN0b3AoKTtcclxuICAgIH1cclxuXHJcbiAgICBwYXVzZSgpIHtcclxuICAgICAgICBpZih0aGlzLmlzUGF1c2VkKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5fdG90YWxUaW1lTGFwc2VkICs9IHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy5fc3RhcnRUaW1lc3RhbXA7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5wYXVzZSgpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oJyMgQmVuY2htYXJrIHBhdXNlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3VtZSgpIHtcclxuICAgICAgICBpZighdGhpcy5pc1BhdXNlZCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lc3RhbXAgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgICB0aGlzLl90ZXN0LnJ1bigpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmluZm8oJyMgQmVuY2htYXJrIHJlc3VtZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICBfb25QYWdlVmlzaWJpbGl0eSgpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAnaGlkZGVuJykge1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmKGRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZSA9PT0gJ3Zpc2libGUnKXtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2lzV2ViR0xTdXBwb3J0ZWQoKSB7XHJcbiAgICAgICAgbGV0IGNvbnRleHRPcHRpb25zID0geyBzdGVuY2lsOiB0cnVlLCBmYWlsSWZNYWpvclBlcmZvcm1hbmNlQ2F2ZWF0OiB0cnVlIH07XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKCF3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0KSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgICAgIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcsIGNvbnRleHRPcHRpb25zKSB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgY29udGV4dE9wdGlvbnMpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHN1Y2Nlc3MgPSAhIShnbCAmJiBnbC5nZXRDb250ZXh0QXR0cmlidXRlcygpLnN0ZW5jaWwpO1xyXG4gICAgICAgICAgICBpZiAoZ2wpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsb3NlQ29udGV4dCA9IGdsLmdldEV4dGVuc2lvbignV0VCR0xfbG9zZV9jb250ZXh0Jyk7XHJcbiAgICAgICAgICAgICAgICBpZihsb3NlQ29udGV4dCkgbG9zZUNvbnRleHQubG9zZUNvbnRleHQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ2wgPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm4gc3VjY2VzcztcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzQmVuY2htYXJrOyIsImNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcclxuY29uc3QgQ29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcvQ29uZmlnJyk7XHJcbmNvbnN0IE1heE9iamVjdHMyRFRlc3QgPSByZXF1aXJlKCcuL3Rlc3RzL01heE9iamVjdHMyRFRlc3QnKTtcclxuY29uc3QgTWF4T2JqZWN0czNEVGVzdCA9IHJlcXVpcmUoJy4vdGVzdHMvTWF4T2JqZWN0czNEVGVzdCcpO1xyXG5cclxuLyoqXHJcbiAqIG1haW5cclxuICovXHJcbmNsYXNzIE1heE9iamVjdHNCZW5jaG1hcmsgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG5cclxuICAgIHN0YXRpYyBFVkVOVFMgPSB7XHJcbiAgICAgICAgRklOSVNIOiAnZmluaXNoJ1xyXG4gICAgfTtcclxuXHJcbiAgICBfd2lkdGggPSAwO1xyXG4gICAgX2hlaWdodCA9IDA7XHJcblxyXG4gICAgX3Rlc3QgPSBudWxsO1xyXG5cclxuICAgIF9jYW52YXMgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZyA9IHt9KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBjb25zdCBfY29uZmlnID0gT2JqZWN0LmFzc2lnbih7fSwgQ29uZmlnLm1heE9iamVjdHNUZXN0LCBjb25maWcpO1xyXG4gICAgICAgIHRoaXMuX3dpZHRoID0gTWF0aC5yb3VuZCh3aW5kb3cuaW5uZXJXaWR0aCAqIDAuOTkpO1xyXG4gICAgICAgIHRoaXMuX2hlaWdodCA9IE1hdGgucm91bmQod2luZG93LmlubmVySGVpZ2h0ICogMC45OSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy53aWR0aCA9IHRoaXMuX3dpZHRoO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5oZWlnaHQgPSB0aGlzLl9oZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS56SW5kZXggPSA5OTk5O1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgdGhpcy5fY2FudmFzLnN0eWxlLmxlZnQgPSAwO1xyXG4gICAgICAgIHRoaXMuX2NhbnZhcy5zdHlsZS50b3AgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl9kZWx0YUZyYW1lVGltZSA9IDA7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lc3RhbXAgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLl90b3RhbFRpbWVMYXBzZWQgPSAwO1xyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2lzV2ViR0xTdXBwb3J0ZWQoKSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJXRUIgR0wgVEVTVFwiKTtcclxuICAgICAgICAgICAgdGhpcy5fdGVzdCA9IG5ldyBNYXhPYmplY3RzM0RUZXN0KHRoaXMuX2NhbnZhcywgX2NvbmZpZyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiMkQgVEVTVFwiKTtcclxuICAgICAgICAgICAgdGhpcy5fdGVzdCA9IG5ldyBNYXhPYmplY3RzMkRUZXN0KHRoaXMuX2NhbnZhcywgX2NvbmZpZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuX2NhbnZhcyk7XHJcblxyXG4gICAgICAgIHRoaXMuX3BhZ2VWaXNpYmlsaXR5TGlzdGVuZXIgPSB0aGlzLl9vblBhZ2VWaXNpYmlsaXR5LmJpbmQodGhpcyk7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHRoaXMuX3BhZ2VWaXNpYmlsaXR5TGlzdGVuZXIpO1xyXG4gICAgICAgIGlmKGRvY3VtZW50Ll9faXNIaWRkZW4gPT09IHRydWUpIHRoaXMucGF1c2UoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7TnVtYmVyIHwgdW5kZWZpbmVkfSBkdXJhdGlvblxyXG4gICAgICovXHJcbiAgICBzdGFydChkdXJhdGlvbiA9IENvbmZpZy5kdXJhdGlvbikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdTVEFSVCBDb3VudGluZyBNYXggRHJhd2luZyBPYmplY3RzJyk7XHJcbiAgICAgICAgdGhpcy5fdGVzdC5ydW4oZHVyYXRpb24pXHJcbiAgICAgICAgICAudGhlbigoZGF0YSk9PnRoaXMuZW1pdChNYXhPYmplY3RzQmVuY2htYXJrLkVWRU5UUy5GSU5JU0gsIGRhdGEpKTtcclxuICAgIH1cclxuXHJcbiAgICBwYXVzZSgpIHtcclxuICAgICAgICBpZih0aGlzLmlzUGF1c2VkKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuX3Rlc3QucGF1c2UoKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5pbmZvKCcjIFBBVVNFIENvdW50aW5nIE1heCBEcmF3aW5nIE9iamVjdHMnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXN1bWUoKSB7XHJcbiAgICAgICAgaWYoIXRoaXMuaXNQYXVzZWQpIHJldHVybjtcclxuICAgICAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuX3Rlc3QucmVzdW1lKCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbygnIyBSRVNVTUUgQ291bnRpbmcgTWF4IERyYXdpbmcgT2JqZWN0cycpO1xyXG4gICAgfVxyXG5cclxuICAgIF9vblBhZ2VWaXNpYmlsaXR5KCkge1xyXG4gICAgICAgIGlmIChkb2N1bWVudC52aXNpYmlsaXR5U3RhdGUgPT09ICdoaWRkZW4nKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICB9IGVsc2UgaWYoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAndmlzaWJsZScpe1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfaXNXZWJHTFN1cHBvcnRlZCgpIHtcclxuICAgICAgICBsZXQgY29udGV4dE9wdGlvbnMgPSB7IHN0ZW5jaWw6IHRydWUsIGZhaWxJZk1ham9yUGVyZm9ybWFuY2VDYXZlYXQ6IHRydWUgfTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5XZWJHTFJlbmRlcmluZ0NvbnRleHQpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICAgICAgbGV0IGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgY29udGV4dE9wdGlvbnMpIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBjb250ZXh0T3B0aW9ucyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3VjY2VzcyA9ICEhKGdsICYmIGdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCkuc3RlbmNpbCk7XHJcbiAgICAgICAgICAgIGlmIChnbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxvc2VDb250ZXh0ID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9sb3NlX2NvbnRleHQnKTtcclxuICAgICAgICAgICAgICAgIGlmKGxvc2VDb250ZXh0KSBsb3NlQ29udGV4dC5sb3NlQ29udGV4dCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnbCA9IG51bGw7XHJcbiAgICAgICAgICAgIHJldHVybiBzdWNjZXNzO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXhPYmplY3RzQmVuY2htYXJrOyIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYmFzZVRlc3Q6IHtcclxuICAgICAgZGVidWc6IGZhbHNlLFxyXG4gICAgICBwYXJ0aWNsZXMyZDogMTUwMCxcclxuICAgICAgcGFydGljbGVzM2Q6IDEwMDAsXHJcbiAgICB9LFxyXG4gICAgbWF4T2JqZWN0c1Rlc3Q6IHtcclxuICAgICAgZGVidWc6IGZhbHNlLFxyXG4gICAgICB0YXJnZXRGUFM6IDYwLFxyXG4gICAgICBtYXhTbG93RnJhbWVzOiAyLFxyXG4gICAgICBzdGFydGluZ0NvdW50OiAyMDAsXHJcbiAgICAgIGNvdW50U3RlcDogNTAsXHJcbiAgICAgIHBhcnRpY2xlczJkOiAyMDAwMCxcclxuICAgICAgcGFydGljbGVzM2Q6IDEwMDAwXHJcbiAgICB9XHJcbn07IiwiY2xhc3MgUmVuZGVyYWJsZTJEIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjVywgY0gpIHtcclxuICAgICAgICB0aGlzLnggPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBjVyk7XHJcbiAgICAgICAgdGhpcy55ID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogY0gpO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBNYXRoLnJvdW5kKGNXIC8gNTApO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gTWF0aC5yb3VuZChjSC8gNTApO1xyXG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB0aGlzLl9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgX2dlbmVyYXRlUmFuZG9tVmVsb2NpdHkoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogMyAtIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDYpLFxyXG4gICAgICAgICAgICB5OiAzIC0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogNilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZShtYXhYLCBtYXhZKSB7XHJcbiAgICAgICAgdGhpcy54ICs9IHRoaXMudmVsb2NpdHkueDtcclxuICAgICAgICB0aGlzLnkgKz0gdGhpcy52ZWxvY2l0eS55O1xyXG4gICAgICAgIGlmICh0aGlzLnggPCAxIHx8IHRoaXMueCA+IG1heFgpIHRoaXMudmVsb2NpdHkueCA9IC10aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgaWYgKHRoaXMueSA8IDEgfHwgdGhpcy55ID4gbWF4WSkgdGhpcy52ZWxvY2l0eS55ID0gLXRoaXMudmVsb2NpdHkueTtcclxuICAgIH1cclxuXHJcbiAgICBkcmF3KGN0eCkge1xyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjdHgubW92ZVRvKHRoaXMueCwgdGhpcy55KTtcclxuICAgICAgICBjdHgubGluZVRvKHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnggKyB0aGlzLndpZHRoLCB0aGlzLnkgKyB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnggKyAwLCB0aGlzLnkgKyB0aGlzLmhlaWdodCk7XHJcbiAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgIGN0eC5maWxsKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyYWJsZTJEOyIsIlxyXG5cclxuY2xhc3MgUmVuZGVyYWJsZTNEIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjVywgY0gsIGdsKSB7XHJcbiAgICAgICAgdGhpcy54ID0gMC45NSAtIE1hdGgucmFuZG9tKCkgKiAxOTUgLyAxMDA7XHJcbiAgICAgICAgdGhpcy55ID0gMC45NSAtIE1hdGgucmFuZG9tKCkgKiAxOTUgLyAxMDA7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IDAuMDU7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSAwLjA1O1xyXG4gICAgICAgIHRoaXMudmVsb2NpdHkgPSB0aGlzLl9nZW5lcmF0ZVJhbmRvbVZlbG9jaXR5KCk7XHJcblxyXG4gICAgICAgIHRoaXMudmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgIHRoaXMueSArIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLngsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54ICsgdGhpcy53aWR0aCwgdGhpcy55LFxyXG4gICAgICAgICAgICB0aGlzLngsIHRoaXMueVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgICAgICB0aGlzLnZidWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5pdGVtU2l6ZSA9IDI7XHJcbiAgICAgICAgdGhpcy5udW1JdGVtcyA9IHRoaXMudmVydGljZXMubGVuZ3RoIC8gdGhpcy5pdGVtU2l6ZTtcclxuICAgIH1cclxuXHJcbiAgICBfZ2VuZXJhdGVSYW5kb21WZWxvY2l0eSgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiAwLjAzIC0gTWF0aC5yYW5kb20oKSAqIDYgLyAxMDAsXHJcbiAgICAgICAgICAgIHk6IDAuMDMgLSBNYXRoLnJhbmRvbSgpICogNiAvIDEwMFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlKCkge1xyXG4gICAgICAgIHRoaXMueCArPSB0aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgdGhpcy55ICs9IHRoaXMudmVsb2NpdHkueTtcclxuICAgICAgICBpZiAodGhpcy54IDw9IC0xIHx8IHRoaXMueCA+IDAuOTUpIHRoaXMudmVsb2NpdHkueCA9IC10aGlzLnZlbG9jaXR5Lng7XHJcbiAgICAgICAgaWYgKHRoaXMueSA8PSAtMSB8fCB0aGlzLnkgPiAwLjk1KSB0aGlzLnZlbG9jaXR5LnkgPSAtdGhpcy52ZWxvY2l0eS55O1xyXG5cclxuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgICAgICAgICAgIHRoaXMueCArIHRoaXMud2lkdGgsICB0aGlzLnkgKyB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy54LCAgdGhpcy55ICsgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgIHRoaXMueCArIHRoaXMud2lkdGgsIHRoaXMueSxcclxuICAgICAgICAgICAgdGhpcy54LCB0aGlzLnlcclxuICAgICAgICBdKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZHJhdyhnbCwgc2hhZGVyUHJvZ3JhbSkge1xyXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZidWZmZXIpO1xyXG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgc2hhZGVyUHJvZ3JhbS5hVmVydGV4UG9zaXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcclxuICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbik7XHJcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLmFWZXJ0ZXhQb3NpdGlvbiwgdGhpcy5pdGVtU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuICAgICAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCAwLCB0aGlzLm51bUl0ZW1zKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJhYmxlM0Q7IiwiY29uc3QgQ29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnL0NvbmZpZycpO1xyXG5jb25zdCBSZW5kZXJhYmxlMkQgPSByZXF1aXJlKCcuLi9yZW5kZXJhYmxlL1JlbmRlcmFibGUyRCcpO1xyXG5cclxuY2xhc3MgQmFzZTJEVGVzdCB7XHJcblxyXG4gICAgX29ianMgPSBbXTtcclxuICAgIF9jb250ZXh0ID0gbnVsbDtcclxuXHJcbiAgICBjYW52YXMgPSBudWxsO1xyXG5cclxuICAgIF9mcmFtZXMgPSAwO1xyXG5cclxuICAgIF9wYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICBfZmluaXNoZWQgPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIGNvbmZpZykge1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2NvbmZpZy5wYXJ0aWNsZXMyZDsgaSsrKSB0aGlzLl9vYmpzLnB1c2gobmV3IFJlbmRlcmFibGUyRChjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpKTtcclxuICAgICAgICB0aGlzLl9jb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcclxuICAgICAgICB0aGlzLl9jb250ZXh0LmZpbGxTdHlsZSA9IHRoaXMuX2NvbmZpZy5kZWJ1ZyA/IFwicmdiYSgwLCAwLjMsIDAuMywgMC41KVwiIDogXCJyZ2JhKDAsIDAsIDAsIDApXCI7XHJcbiAgICB9XHJcblxyXG4gICAgcnVuKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5fcmVuZGVyKHJlc29sdmUpKTtcclxuICAgIH1cclxuXHJcbiAgICBwYXVzZSgpIHtcclxuICAgICAgICB0aGlzLl9wYXVzZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHN0b3AoKSB7XHJcbiAgICAgICAgdGhpcy5fZmluaXNoZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIF9jbGVhcigpIHtcclxuICAgICAgICB0aGlzLl9jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBfcmVuZGVyKHJlc29sdmUpIHtcclxuICAgICAgaWYodGhpcy5fZmluaXNoZWQpIHJldHVybiByZXNvbHZlKHRoaXMuX2ZyYW1lcylcclxuICAgICAgaWYodGhpcy5fcGF1c2VkKSByZXR1cm4gdGhpcy5fcmVuZGVyKHJlc29sdmUpO1xyXG5cclxuICAgICAgICB0aGlzLl9jbGVhcigpO1xyXG4gICAgICAgIHRoaXMuX29ianMuZm9yRWFjaCgob2JqKSA9PiB7XHJcbiAgICAgICAgICAgIG9iai5tb3ZlKHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBvYmouZHJhdyh0aGlzLl9jb250ZXh0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLl9mcmFtZXMrKztcclxuXHJcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKT0+dGhpcy5fcmVuZGVyKHJlc29sdmUpKTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCYXNlMkRUZXN0OyIsImNvbnN0IFJlbmRlcmFibGUzRCA9IHJlcXVpcmUoJy4uL3JlbmRlcmFibGUvUmVuZGVyYWJsZTNEJyk7XHJcblxyXG4vLyBUT0RPIGxpdGVyYWxzIG5vdCBjb21wYXRpYmxlIHdpdGggSUVcclxuY29uc3QgdmVydGV4ID0gYFxyXG4gICAgYXR0cmlidXRlIHZlYzIgYVZlcnRleFBvc2l0aW9uO1xyXG5cclxuICAgIHZvaWQgbWFpbigpIHtcclxuICAgICAgICBnbF9Qb3NpdGlvbiA9IHZlYzQoYVZlcnRleFBvc2l0aW9uLCAwLjAsIDEuMCk7XHJcbiAgICB9XHJcbmA7XHJcblxyXG5jb25zdCBmcmFnbWVudCA9IGBcclxuICAgICNpZmRlZiBHTF9FU1xyXG4gICAgICAgIHByZWNpc2lvbiBoaWdocCBmbG9hdDtcclxuICAgICNlbmRpZlxyXG5cclxuICAgIHVuaWZvcm0gdmVjNCB1Q29sb3I7XHJcblxyXG4gICAgdm9pZCBtYWluKCkge1xyXG4gICAgICAgIGdsX0ZyYWdDb2xvciA9IHVDb2xvcjtcclxuICAgIH1cclxuYDtcclxuXHJcbmNsYXNzIEJhc2UzRFRlc3Qge1xyXG5cclxuICAgIF9vYmpzID0gW107XHJcblxyXG4gICAgX2dsID0gbnVsbDtcclxuXHJcbiAgICBfZnJhbWVzID0gMDtcclxuXHJcbiAgICBfcGF1c2VkID0gZmFsc2U7XHJcblxyXG4gICAgX2ZpbmlzaGVkID0gZmFsc2U7XHJcblxyXG4gICAgY2FudmFzID0gbnVsbDtcclxuXHJcbiAgICBzaGFkZXJQcm9ncmFtID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIGNvbmZpZykge1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcclxuXHJcbiAgICAgICAgdGhpcy5fZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKTtcclxuICAgICAgICB0aGlzLl9nbC52aWV3cG9ydFdpZHRoID0gY2FudmFzLndpZHRoO1xyXG4gICAgICAgIHRoaXMuX2dsLnZpZXdwb3J0SGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcclxuICAgICAgICB0aGlzLl9nbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICAgICAgICB2YXIgdnMgPSB0aGlzLl9nbC5jcmVhdGVTaGFkZXIodGhpcy5fZ2wuVkVSVEVYX1NIQURFUik7XHJcbiAgICAgICAgdGhpcy5fZ2wuc2hhZGVyU291cmNlKHZzLCB2ZXJ0ZXgpO1xyXG4gICAgICAgIHRoaXMuX2dsLmNvbXBpbGVTaGFkZXIodnMpO1xyXG5cclxuICAgICAgICB2YXIgZnMgPSB0aGlzLl9nbC5jcmVhdGVTaGFkZXIodGhpcy5fZ2wuRlJBR01FTlRfU0hBREVSKTtcclxuICAgICAgICB0aGlzLl9nbC5zaGFkZXJTb3VyY2UoZnMsIGZyYWdtZW50KTtcclxuICAgICAgICB0aGlzLl9nbC5jb21waWxlU2hhZGVyKGZzKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaGFkZXJQcm9ncmFtID0gdGhpcy5fZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgICAgIHRoaXMuX2dsLmF0dGFjaFNoYWRlcih0aGlzLnNoYWRlclByb2dyYW0sIHZzKTtcclxuICAgICAgICB0aGlzLl9nbC5hdHRhY2hTaGFkZXIodGhpcy5zaGFkZXJQcm9ncmFtLCBmcyk7XHJcbiAgICAgICAgdGhpcy5fZ2wubGlua1Byb2dyYW0odGhpcy5zaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLl9nbC5nZXRTaGFkZXJQYXJhbWV0ZXIodnMsIHRoaXMuX2dsLkNPTVBJTEVfU1RBVFVTKSkgY29uc29sZS5sb2codGhpcy5fZ2wuZ2V0U2hhZGVySW5mb0xvZyh2cykpO1xyXG4gICAgICAgIGlmICghdGhpcy5fZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKGZzLCB0aGlzLl9nbC5DT01QSUxFX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFNoYWRlckluZm9Mb2coZnMpKTtcclxuICAgICAgICBpZiAoIXRoaXMuX2dsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5zaGFkZXJQcm9ncmFtLCB0aGlzLl9nbC5MSU5LX1NUQVRVUykpIGNvbnNvbGUubG9nKHRoaXMuX2dsLmdldFByb2dyYW1JbmZvTG9nKHRoaXMuc2hhZGVyUHJvZ3JhbSkpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2NvbmZpZy5wYXJ0aWNsZXMzZDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX29ianMucHVzaChuZXcgUmVuZGVyYWJsZTNEKGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCwgdGhpcy5fZ2wpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2dsLnVzZVByb2dyYW0odGhpcy5zaGFkZXJQcm9ncmFtKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaGFkZXJQcm9ncmFtLnVDb2xvciA9IHRoaXMuX2dsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnNoYWRlclByb2dyYW0sIFwidUNvbG9yXCIpO1xyXG4gICAgICAgIGNvbnN0IGNvbG9ycyA9IHRoaXMuX2NvbmZpZy5kZWJ1ZyA/IFswLjAsIDAuMywgMC4zLCAwLjVdIDogWzAuMCwgMC4wLCAwLjAsIDAuMF07XHJcbiAgICAgICAgdGhpcy5fZ2wudW5pZm9ybTRmdih0aGlzLnNoYWRlclByb2dyYW0udUNvbG9yLCBjb2xvcnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHJ1bigpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuX3JlbmRlcihyZXNvbHZlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcGF1c2UoKSB7XHJcbiAgICAgICAgdGhpcy5fcGF1c2VkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9wKCkge1xyXG4gICAgICAgIHRoaXMuX2ZpbmlzaGVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBfY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5fZ2wudmlld3BvcnQoMCwgMCwgdGhpcy5fZ2wudmlld3BvcnRXaWR0aCwgdGhpcy5fZ2wudmlld3BvcnRIZWlnaHQpO1xyXG4gICAgICAgIHRoaXMuX2dsLmNsZWFyKHRoaXMuX2dsLkNPTE9SX0JVRkZFUl9CSVQgfCB0aGlzLl9nbC5ERVBUSF9CVUZGRVJfQklUKTtcclxuICAgIH1cclxuXHJcbiAgICBfcmVuZGVyKHJlc29sdmUpIHtcclxuICAgICAgICBpZih0aGlzLl9maW5pc2hlZCkgcmV0dXJuIHJlc29sdmUodGhpcy5fZnJhbWVzKVxyXG4gICAgICAgIGlmKHRoaXMuX3BhdXNlZCkgcmV0dXJuIHRoaXMuX3JlbmRlcihyZXNvbHZlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY2xlYXIoKTtcclxuICAgICAgICB0aGlzLl9vYmpzLmZvckVhY2goKG9iaikgPT4ge1xyXG4gICAgICAgICAgICBvYmoubW92ZSh0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgb2JqLmRyYXcodGhpcy5fZ2wsIHRoaXMuc2hhZGVyUHJvZ3JhbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5fZnJhbWVzKys7XHJcblxyXG4gICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCk9PiB0aGlzLl9yZW5kZXIocmVzb2x2ZSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2UzRFRlc3Q7IiwiY29uc3QgQ29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnL0NvbmZpZycpO1xyXG5jb25zdCBSZW5kZXJhYmxlMkQgPSByZXF1aXJlKCcuLi9yZW5kZXJhYmxlL1JlbmRlcmFibGUyRCcpO1xyXG5jb25zdCBCYXNlMkRUZXN0ID0gcmVxdWlyZSgnLi9CYXNlMkRUZXN0Jyk7XHJcblxyXG5jbGFzcyBNYXhPYmplY3RzMkRUZXN0IGV4dGVuZHMgQmFzZTJEVGVzdCB7XHJcbiAgICBfbGltaXQgPSAwO1xyXG5cclxuICAgIF93YXNTbG93RnJhbWUgPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIGNvbmZpZykge1xyXG4gICAgICAgIHN1cGVyKGNhbnZhcywgY29uZmlnKTtcclxuICAgICAgICB0aGlzLl9saW1pdCA9IGNvbmZpZy5zdGFydGluZ0NvdW50O1xyXG4gICAgfVxyXG5cclxuICAgIF9yZW5kZXIocmVzb2x2ZSkge1xyXG4gICAgICAgIGlmKHRoaXMuX3BhdXNlZCkgcmV0dXJuIHRoaXMuX3JlbmRlcihyZXNvbHZlKTtcclxuXHJcbiAgICAgICAgdGhpcy5fY2xlYXIoKTtcclxuICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5fY29uZmlnO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fbGltaXQ7IGkrKykge1xyXG4gICAgICAgICAgY29uc3Qgb2JqID0gdGhpcy5fb2Jqc1tpXTtcclxuICAgICAgICAgIG9iai5tb3ZlKHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgb2JqLmRyYXcodGhpcy5fY29udGV4dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnQ7XHJcbiAgICAgICAgY29uc3QgbXMgPSAxMDAwIC8gY29uZmlnLnRhcmdldEZQUztcclxuICAgICAgICBjb25zdCBpc1Nsb3cgPSB0aW1lID4gbXM7XHJcbiAgICAgICAgY29uc3QgaXNGaXJzdFNsb3cgPSB0aGlzLl9zbG93RnJhbWVzID09PSAwO1xyXG4gICAgICAgIHRoaXMuX3Nsb3dGcmFtZXMgPSAodGhpcy5fd2FzU2xvd0ZyYW1lICYmICFpc0ZpcnN0U2xvdyAmJiBpc1Nsb3cpIHx8ICghdGhpcy5fd2FzU2xvd0ZyYW1lICYmIGlzRmlyc3RTbG93ICYmIGlzU2xvdykgPyB0aGlzLl9zbG93RnJhbWVzICsgMSA6IDA7XHJcbiAgICAgICAgaWYodGhpcy5fc2xvd0ZyYW1lcyA+IGNvbmZpZy5tYXhTbG93RnJhbWVzKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZSh7b2JqZWN0czogdGhpcy5fbGltaXQsIGZyYW1lczogdGhpcy5fZnJhbWVzfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuX2xpbWl0ICs9IGlzU2xvdyA/IDAgOiB0aGlzLl9mcmFtZXMgKiBjb25maWcuY291bnRTdGVwO1xyXG4gICAgICAgICAgdGhpcy5fd2FzU2xvd0ZyYW1lID0gaXNTbG93O1xyXG4gICAgICAgICAgdGhpcy5fZnJhbWVzKys7XHJcbiAgICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX3JlbmRlci5iaW5kKHRoaXMsIHJlc29sdmUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWF4T2JqZWN0czJEVGVzdDsiLCJjb25zdCBDb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcvQ29uZmlnJyk7XHJcbmNvbnN0IFJlbmRlcmFibGUzRCA9IHJlcXVpcmUoJy4uL3JlbmRlcmFibGUvUmVuZGVyYWJsZTNEJyk7XHJcbmNvbnN0IEJhc2UzRFRlc3QgPSByZXF1aXJlKCcuL0Jhc2UzRFRlc3QnKTtcclxuXHJcbmNsYXNzIE1heE9iamVjdHMzRFRlc3QgZXh0ZW5kcyBCYXNlM0RUZXN0IHtcclxuXHJcbiAgICBfbGltaXQgPSAwO1xyXG5cclxuICAgIF93YXNTbG93RnJhbWUgPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihjYW52YXMsIGNvbmZpZykge1xyXG4gICAgICBzdXBlcihjYW52YXMsIGNvbmZpZylcclxuICAgICAgdGhpcy5fbGltaXQgPSBjb25maWcuc3RhcnRpbmdDb3VudDtcclxuICAgIH1cclxuXHJcbiAgICBfcmVuZGVyKHJlc29sdmUpIHtcclxuICAgICAgICBpZih0aGlzLl9wYXVzZWQpIHJldHVybiB0aGlzLl9yZW5kZXIocmVzb2x2ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuX2NsZWFyKCk7XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuX2NvbmZpZztcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xpbWl0OyBpKyspIHtcclxuICAgICAgICAgIGNvbnN0IG9iaiA9IHRoaXMuX29ianNbaV07XHJcbiAgICAgICAgICBvYmoubW92ZSh0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgIG9iai5kcmF3KHRoaXMuX2dsLCB0aGlzLnNoYWRlclByb2dyYW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB0aW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0O1xyXG4gICAgICAgIGNvbnN0IG1zID0gMTAwMCAvIGNvbmZpZy50YXJnZXRGUFM7XHJcbiAgICAgICAgY29uc3QgaXNTbG93ID0gdGltZSA+IG1zO1xyXG4gICAgICAgIGNvbnN0IGlzRmlyc3RTbG93ID0gdGhpcy5fc2xvd0ZyYW1lcyA9PT0gMDtcclxuICAgICAgICB0aGlzLl9zbG93RnJhbWVzID0gKHRoaXMuX3dhc1Nsb3dGcmFtZSAmJiAhaXNGaXJzdFNsb3cgJiYgaXNTbG93KSB8fCAoIXRoaXMuX3dhc1Nsb3dGcmFtZSAmJiBpc0ZpcnN0U2xvdyAmJiBpc1Nsb3cpID8gdGhpcy5fc2xvd0ZyYW1lcyArIDEgOiAwO1xyXG4gICAgICAgIGlmKHRoaXMuX3Nsb3dGcmFtZXMgPiBjb25maWcubWF4U2xvd0ZyYW1lcykge1xyXG4gICAgICAgICAgcmV0dXJuIHJlc29sdmUoe29iamVjdHM6IHRoaXMuX2xpbWl0LCBmcmFtZXM6IHRoaXMuX2ZyYW1lc30pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLl9saW1pdCArPSBpc1Nsb3cgPyAwIDogdGhpcy5fZnJhbWVzICogY29uZmlnLmNvdW50U3RlcDtcclxuICAgICAgICAgIHRoaXMuX3dhc1Nsb3dGcmFtZSA9IGlzU2xvdztcclxuICAgICAgICAgIHRoaXMuX2ZyYW1lcysrO1xyXG5cclxuICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fcmVuZGVyLmJpbmQodGhpcywgcmVzb2x2ZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNYXhPYmplY3RzM0RUZXN0OyJdfQ==
