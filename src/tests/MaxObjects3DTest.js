const Config = require('../config/Config');
const Renderable3D = require('../renderable/Renderable3D');
const Base3DTest = require('./Base3DTest');

class MaxObjects3DTest extends Base3DTest {

    _limit = 0;

    _wasSlowFrame = false;

    constructor(canvas, config) {
      super(canvas, config)
      this._limit = config.startingCount;
    }

    _render(resolve) {
        if(this._paused) return this._render(resolve);

        this._clear();
        const start = Date.now();
        const config = this._config;
        for (var i = 0; i < this._limit; i++) {
          const obj = this._objs[i];
          obj.move(this.canvas.width, this.canvas.height);
          obj.draw(this._gl, this.shaderProgram);
        }
        const time = Date.now() - start;
        const ms = 1000 / config.targetFPS;
        const isSlow = time > ms;
        const isFirstSlow = this._slowFrames === 0;
        this._slowFrames = (this._wasSlowFrame && !isFirstSlow && isSlow) || (!this._wasSlowFrame && isFirstSlow && isSlow) ? this._slowFrames + 1 : 0;
        if(this._slowFrames > config.maxSlowFrames || this._limit >= this._objs.length) {
          return resolve({objects: this._limit, frames: this._frames});
        } else {
          this._limit += isSlow ? 0 : this._frames * config.countStep;
          this._wasSlowFrame = isSlow;
          this._frames++;

          window.requestAnimationFrame(this._render.bind(this, resolve));
        }
    }
}

module.exports = MaxObjects3DTest;