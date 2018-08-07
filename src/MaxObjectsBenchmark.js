const EventEmitter = require('eventemitter3');
const Config = require('./config/Config');
const MaxObjects2DTest = require('./tests/MaxObjects2DTest');
const MaxObjects3DTest = require('./tests/MaxObjects3DTest');

/**
 * main
 */
class MaxObjectsBenchmark extends EventEmitter {

    static EVENTS = {
        FINISH: 'finish'
    };

    _width = 0;
    _height = 0;

    _test = null;

    _canvas = null;

    constructor() {
        super();

        this._width = Math.round(window.innerWidth * 0.99);
        this._height = Math.round(window.innerHeight * 0.99);

        this._canvas = document.createElement('canvas');
        this._canvas.width = this._width;
        this._canvas.height = this._height;

        this._canvas.style.zIndex = 9999;
        this._canvas.style.position = 'absolute';
        this._canvas.style.left = 0;
        this._canvas.style.top = 0;

        this._deltaFrameTime = 0;
        this._startTimestamp = 0;

        this._totalTimeLapsed = 0;
        this.isPaused = false;

        if (this._isWebGLSupported()  ) {
            console.info("WEB GL TEST");
            this._test = new MaxObjects3DTest(this._canvas, Config.particles.threeD); // todo
        } else {
            console.info("2D TEST");
            this._test = new MaxObjects2DTest(this._canvas, Config.particles.twoD);
        }

        document.body.appendChild(this._canvas);

        this._pageVisibilityListener = this._onPageVisibility.bind(this);
        document.addEventListener('visibilitychange', this._pageVisibilityListener);
        if(document.__isHidden === true) this.pause();
    }

    /**
     * @param {Number | undefined} duration
     */
    start(duration = Config.duration) {
        console.log('START Counting Max Drawing Objects');
        this._test.run(duration)
          .then((data)=>this.emit(MaxObjectsBenchmark.EVENTS.FINISH, data));
    }

    pause() {
        if(this.isPaused) return;

        this.isPaused = true;
        this._test.pause();

        console.info('# PAUSE Counting Max Drawing Objects');
    }

    resume() {
        if(!this.isPaused) return;
        this.isPaused = false;

        this._test.resume();

        console.info('# RESUME Counting Max Drawing Objects');
    }

    _onPageVisibility() {
        if (document.visibilityState === 'hidden') {
            this.pause();
        } else if(document.visibilityState === 'visible'){
            this.resume();
        }
    }

    _isWebGLSupported() {
        let contextOptions = { stencil: true, failIfMajorPerformanceCaveat: true };
        try {
            if (!window.WebGLRenderingContext) return false;

            let canvas = document.createElement('canvas');
            let gl = canvas.getContext('webgl', contextOptions) || canvas.getContext('experimental-webgl', contextOptions);

            var success = !!(gl && gl.getContextAttributes().stencil);
            if (gl) {
                var loseContext = gl.getExtension('WEBGL_lose_context');
                if(loseContext) loseContext.loseContext();
            }

            gl = null;
            return success;
        } catch (e) {
            return false;
        }
    }
}

module.exports = MaxObjectsBenchmark;