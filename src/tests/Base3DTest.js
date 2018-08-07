const Renderable3D = require('../renderable/Renderable3D');

// TODO literals not compatible with IE
const vertex = `
    attribute vec2 aVertexPosition;

    void main() {
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    }
`;

const fragment = `
    #ifdef GL_ES
        precision highp float;
    #endif

    uniform vec4 uColor;

    void main() {
        gl_FragColor = uColor;
    }
`;

class Base3DTest {

    _objs = [];

    _gl = null;

    _frames = 0;

    _paused = false;

    _finished = false;

    canvas = null;

    shaderProgram = null;

    constructor(canvas, config) {
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

        for (let i = 0; i < this._config.particles3d; i++) {
            this._objs.push(new Renderable3D(canvas.width, canvas.height, this._gl));
        }

        this._gl.useProgram(this.shaderProgram);

        this.shaderProgram.uColor = this._gl.getUniformLocation(this.shaderProgram, "uColor");
        const colors = this._config.debug ? [0.0, 0.3, 0.3, 0.5] : [0.0, 0.0, 0.0, 0.0];
        this._gl.uniform4fv(this.shaderProgram.uColor, colors);
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
        this._gl.viewport(0, 0, this._gl.viewportWidth, this._gl.viewportHeight);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    }

    _render(resolve) {
        if(this._finished) return resolve(this._frames)
        if(this._paused) return this._render(resolve);

        this._clear();
        this._objs.forEach((obj) => {
            obj.move(this.canvas.width, this.canvas.height);
            obj.draw(this._gl, this.shaderProgram);
        });
        this._frames++;

        window.requestAnimationFrame(()=> this._render(resolve));
    }
}

module.exports = Base3DTest;