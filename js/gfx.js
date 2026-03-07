export class GFX {
	constructor() {
		this.container = document.getElementById('bg');

		this.canvas = document.createElement('canvas');
		this.container.appendChild(this.canvas);

		this.gl = this.canvas.getContext('webgl', { antialias: false });

		this.scale = 3;

		this.resize();
		window.addEventListener('resize', () => this.resize());

		this.init();
	}

	resize() {
		this.width = Math.floor(window.innerWidth / this.scale);
		this.height = Math.floor(window.innerHeight / this.scale);

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	init() {
		const gl = this.gl;

		const vs = `
attribute vec2 p;
varying vec2 uv;
void main(){
uv=(p+1.0)*0.5;
gl_Position=vec4(p,0.0,1.0);
}
`;

		const fsStep = `
precision mediump float;

uniform sampler2D tex;
uniform vec2 res;

varying vec2 uv;

float c(vec2 o){
return texture2D(tex,uv+o/res).r;
}

void main(){

float n=0.0;

n+=c(vec2(-1.0,-1.0));
n+=c(vec2(0.0,-1.0));
n+=c(vec2(1.0,-1.0));

n+=c(vec2(-1.0,0.0));
n+=c(vec2(1.0,0.0));

n+=c(vec2(-1.0,1.0));
n+=c(vec2(0.0,1.0));
n+=c(vec2(1.0,1.0));

float v=texture2D(tex,uv).r;

float next=v;

if(v>0.5){
if(n<2.0||n>3.0) next=0.0;
else next=1.0;
}else{
if(n==3.0) next=1.0;
}

gl_FragColor=vec4(next,next,next,1.0);
}
`;

		const fsDraw = `
precision mediump float;

uniform sampler2D tex;
varying vec2 uv;

void main(){

float v=texture2D(tex,uv).r;

vec3 col=mix(
vec3(0.12,0.14,0.15),
vec3(0.66,0.75,0.63),
v
);

gl_FragColor=vec4(col,1.0);

}
`;

		this.stepProg = this.program(vs, fsStep);
		this.drawProg = this.program(vs, fsDraw);

		this.quad();

		this.texA = this.texture();
		this.texB = this.texture();

		this.fbA = this.framebuffer(this.texA);
		this.fbB = this.framebuffer(this.texB);

		this.seed();

		this.loop();
	}

	program(vsSrc, fsSrc) {
		const gl = this.gl;

		const vs = this.shader(gl.VERTEX_SHADER, vsSrc);
		const fs = this.shader(gl.FRAGMENT_SHADER, fsSrc);

		const p = gl.createProgram();

		gl.attachShader(p, vs);
		gl.attachShader(p, fs);

		gl.bindAttribLocation(p, 0, 'p');

		gl.linkProgram(p);

		return p;
	}

	shader(type, src) {
		const gl = this.gl;

		const s = gl.createShader(type);

		gl.shaderSource(s, src);
		gl.compileShader(s);

		return s;
	}

	quad() {
		const gl = this.gl;

		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);

		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
			gl.STATIC_DRAW
		);

		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
	}

	texture() {
		const gl = this.gl;

		const tex = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, tex);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			this.width,
			this.height,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null
		);

		return tex;
	}

	framebuffer(tex) {
		const gl = this.gl;

		const fb = gl.createFramebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

		return fb;
	}

	seed() {
		const gl = this.gl;

		const data = new Uint8Array(this.width * this.height * 4);

		for (let i = 0; i < data.length; i += 4) {
			const v = Math.random() > 0.88 ? 255 : 0;

			data[i] = v;
			data[i + 1] = v;
			data[i + 2] = v;
			data[i + 3] = 255;
		}

		gl.bindTexture(gl.TEXTURE_2D, this.texA);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			this.width,
			this.height,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			data
		);
	}

	step(src, fb) {
		const gl = this.gl;

		gl.useProgram(this.stepProg);

		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

		gl.viewport(0, 0, this.width, this.height);

		gl.bindTexture(gl.TEXTURE_2D, src);

		gl.uniform2f(gl.getUniformLocation(this.stepProg, 'res'), this.width, this.height);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	draw(tex) {
		const gl = this.gl;

		gl.useProgram(this.drawProg);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		gl.bindTexture(gl.TEXTURE_2D, tex);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	loop() {
		this.step(this.texA, this.fbB);
		this.draw(this.texB);

		let t = this.texA;
		this.texA = this.texB;
		this.texB = t;

		let f = this.fbA;
		this.fbA = this.fbB;
		this.fbB = f;

		requestAnimationFrame(() => this.loop());
	}
}
