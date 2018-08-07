const Config = require('../config/Config');
const EventEmitter = require('eventemitter3');
const Renderable2D = require('../renderable/Renderable2D');

class MaxObjects2DTest extends EventEmitter {

    _objs = [];
    _context = null;

    canvas = null;

    _frames = 0;

    _paused = false;

    _limit = 200; // todo add to config

    _wasSlowFrame = false;


    constructor(canvas, particleCount) {
        super();
        this.canvas = canvas;
        for (let i = 0; i < 20000; i++) this._objs.push(new Renderable2D(canvas.width, canvas.height));
        this._context = canvas.getContext("2d");
        this._context.fillStyle = Config.debug ? "rgba(0, 0.3, 0.3, 0.5)" : "rgba(0, 0, 0, 0)";

        this._renderBound = this._render.bind(this);
    }

    run() {
        return new Promise((resolve) => this._render(resolve));
    }

    pause() {
        this._paused = true;
    }

    resume() {
      this._paused = false;
    }

    stop() {
        this._paused = true;
    }

    _clear() {
        this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _render(resolve) {
        if(this._paused) return this._render(resolve);

        this._clear();
        const start = Date.now();
        for (var i = 0; i < this._limit; i++) {
          const obj = this._objs[i];
          obj.move(this.canvas.width, this.canvas.height);
          obj.draw(this._context);
        }
        const time = Date.now() - start;
        const ms = 1000 / 60;
        const isSlow = time > ms;
        const isFirstSlow = this._slowFrames === 0;
        this._slowFrames = (this._wasSlowFrame && !isFirstSlow && isSlow) || (!this._wasSlowFrame && isFirstSlow && isSlow) ? this._slowFrames + 1 : 0;
        if(this._slowFrames > 2) {
          return resolve({objects: this._limit, frames: this._frames});
        } else {
          this._limit += isSlow ? 0 : this._frames * 50;
          this._wasSlowFrame = isSlow;
          this._frames++;
          window.requestAnimationFrame(this._render.bind(this, resolve));
        }
    }
}

module.exports = MaxObjects2DTest;