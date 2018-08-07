const Config = require('../config/Config');
const Renderable2D = require('../renderable/Renderable2D');

class Base2DTest {

    _objs = [];
    _context = null;

    canvas = null;

    _frames = 0;

    _paused = false;

    _finished = false;

    constructor(canvas, config) {
        this.canvas = canvas;
        this._config = config;
        for (let i = 0; i < this._config.particles2d; i++) this._objs.push(new Renderable2D(canvas.width, canvas.height));
        this._context = canvas.getContext("2d");
        this._context.fillStyle = this._config.debug ? "rgba(0, 0.3, 0.3, 0.5)" : "rgba(0, 0, 0, 0)";
    }

    run() {
        return new Promise((resolve) => this._render(resolve));
    }

    pause() {
        this._paused = true;
    }

    stop() {
        this._finished = true;
    }

    _clear() {
        this._context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _render(resolve) {
      if(this._finished) return resolve(this._frames)
      if(this._paused) return this._render(resolve);

        this._clear();
        this._objs.forEach((obj) => {
            obj.move(this.canvas.width, this.canvas.height);
            obj.draw(this._context);
        });
        this._frames++;

        window.requestAnimationFrame(()=>this._render(resolve));
    }
}

module.exports = Base2DTest;