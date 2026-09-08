// React Bits — Ballpit (JS variant), adapted to a self-registering ES module.
// Component inspired by Kevin Levron: https://x.com/soju22/status/1858925191671271801
// Source: https://reactbits.dev/backgrounds/ballpit
// Changes from upstream: no JSX (uses React.createElement from window.React),
// a local Timer to avoid version-dependent three exports, and it assigns
// window.Ballpit instead of exporting a default.
import {
  Vector3 as a,
  MeshPhysicalMaterial as c,
  InstancedMesh as d,
  AmbientLight as f,
  SphereGeometry as g,
  ShaderChunk as h,
  Scene as i,
  Color as l,
  Object3D as m,
  SRGBColorSpace as n,
  MathUtils as o,
  PMREMGenerator as p,
  Vector2 as r,
  WebGLRenderer as s,
  PerspectiveCamera as t,
  PointLight as u,
  ACESFilmicToneMapping as v,
  Plane as w,
  Raycaster as y
} from 'three';
import { RoomEnvironment as z } from 'three/examples/jsm/environments/RoomEnvironment.js';

class LocalTimer {
  constructor() { this._prev = performance.now() / 1000; this._delta = 0; }
  reset() { this._prev = performance.now() / 1000; this._delta = 0; }
  update() {
    const now = performance.now() / 1000;
    this._delta = Math.min(now - this._prev, 0.1);
    this._prev = now;
  }
  getDelta() { return this._delta; }
  dispose() {}
}

class x {
  #e;
  canvas;
  camera;
  cameraMinAspect;
  cameraMaxAspect;
  cameraFov;
  maxPixelRatio;
  minPixelRatio;
  scene;
  renderer;
  #t;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.#i;
  onBeforeRender = () => {};
  onAfterRender = () => {};
  onAfterResize = () => {};
  #s = false;
  #n = false;
  #boundResize = this.#f.bind(this);
  #boundVisibilityChange = this.#v.bind(this);
  isDisposed = false;
  #o;
  #r;
  #a;
  #c = new LocalTimer();
  #h = { elapsed: 0, delta: 0 };
  #l;
  constructor(e) {
    this.#e = { ...e };
    this.#m();
    this.#d();
    this.#p();
    this.resize();
    this.#g();
  }
  #m() { this.camera = new t(); this.cameraFov = this.camera.fov; }
  #d() { this.scene = new i(); }
  #p() {
    if (this.#e.canvas) this.canvas = this.#e.canvas;
    else if (this.#e.id) this.canvas = document.getElementById(this.#e.id);
    else console.error('Three: Missing canvas or id parameter');
    this.canvas.style.display = 'block';
    const e = { canvas: this.canvas, powerPreference: 'high-performance', ...(this.#e.rendererOptions ?? {}) };
    this.renderer = new s(e);
    this.renderer.outputColorSpace = n;
  }
  #g() {
    if (!(this.#e.size instanceof Object)) {
      window.addEventListener('resize', this.#boundResize);
      if (this.#e.size === 'parent' && this.canvas.parentNode) {
        this.#r = new ResizeObserver(this.#boundResize);
        this.#r.observe(this.canvas.parentNode);
      }
    }
    this.#o = new IntersectionObserver(this.#u.bind(this), { root: null, rootMargin: '0px', threshold: 0 });
    this.#o.observe(this.canvas);
    document.addEventListener('visibilitychange', this.#boundVisibilityChange);
  }
  #y() {
    window.removeEventListener('resize', this.#boundResize);
    this.#r?.disconnect();
    this.#o?.disconnect();
    document.removeEventListener('visibilitychange', this.#boundVisibilityChange);
  }
  #u(e) { this.#s = e[0].isIntersecting; this.#s ? this.#w() : this.#z(); }
  #v() { if (this.#s) { document.hidden ? this.#z() : this.#w(); } }
  #f() { if (this.#a) clearTimeout(this.#a); this.#a = setTimeout(this.resize.bind(this), 100); }
  resize() {
    let e, t2;
    if (this.#e.size instanceof Object) { e = this.#e.size.width; t2 = this.#e.size.height; }
    else if (this.#e.size === 'parent' && this.canvas.parentNode) { e = this.canvas.parentNode.offsetWidth; t2 = this.canvas.parentNode.offsetHeight; }
    else { e = window.innerWidth; t2 = window.innerHeight; }
    this.size.width = e; this.size.height = t2; this.size.ratio = e / t2;
    this.#x(); this.#b(); this.onAfterResize(this.size);
  }
  #x() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) this.#A(this.cameraMinAspect);
      else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) this.#A(this.cameraMaxAspect);
      else this.camera.fov = this.cameraFov;
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }
  #A(e) {
    const t2 = Math.tan(o.degToRad(this.cameraFov / 2)) / (this.camera.aspect / e);
    this.camera.fov = 2 * o.radToDeg(Math.atan(t2));
  }
  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const e = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(e / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    } else if (this.camera.isOrthographicCamera) {
      this.size.wHeight = this.camera.top - this.camera.bottom;
      this.size.wWidth = this.camera.right - this.camera.left;
    }
  }
  #b() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.#t?.setSize(this.size.width, this.size.height);
    let e = window.devicePixelRatio;
    if (this.maxPixelRatio && e > this.maxPixelRatio) e = this.maxPixelRatio;
    else if (this.minPixelRatio && e < this.minPixelRatio) e = this.minPixelRatio;
    this.renderer.setPixelRatio(e);
    this.size.pixelRatio = e;
  }
  get postprocessing() { return this.#t; }
  set postprocessing(e) { this.#t = e; this.render = e.render.bind(e); }
  #w() {
    if (this.#n) return;
    const animate = () => {
      this.#l = requestAnimationFrame(animate);
      this.#c.update();
      this.#h.delta = this.#c.getDelta();
      this.#h.elapsed += this.#h.delta;
      this.onBeforeRender(this.#h);
      this.render();
      this.onAfterRender(this.#h);
    };
    this.#n = true;
    this.#c.reset();
    animate();
  }
  #z() { if (this.#n) { cancelAnimationFrame(this.#l); this.#n = false; } }
  // Public wrappers (addition to upstream) so an owner can stop the rAF loop
  // when the canvas is hidden behind other content rather than off-screen.
  startLoop() { if (this.#s) this.#w(); }
  stopLoop() { this.#z(); }
  #i() { this.renderer.render(this.scene, this.camera); }
  clear() {
    this.scene.traverse(e => {
      if (e.isMesh && typeof e.material === 'object' && e.material !== null) {
        Object.keys(e.material).forEach(t2 => {
          const i2 = e.material[t2];
          if (i2 !== null && typeof i2 === 'object' && typeof i2.dispose === 'function') i2.dispose();
        });
        e.material.dispose();
        e.geometry.dispose();
      }
    });
    this.scene.clear();
  }
  dispose() {
    this.#y(); this.#z(); this.#c.dispose(); this.clear();
    this.#t?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.isDisposed = true;
  }
}

const b = new Map(), A = new r();
let R = false;
function S(e) {
  const t2 = {
    position: new r(), nPosition: new r(), hover: false, touching: false,
    onEnter() {}, onMove() {}, onClick() {}, onLeave() {}, ...e
  };
  (function (el, cfg) {
    if (!b.has(el)) {
      b.set(el, cfg);
      if (!R) {
        document.body.addEventListener('pointermove', M);
        document.body.addEventListener('pointerleave', L);
        document.body.addEventListener('click', C);
        document.body.addEventListener('touchstart', TouchStart, { passive: false });
        document.body.addEventListener('touchmove', TouchMove, { passive: false });
        document.body.addEventListener('touchend', TouchEnd, { passive: false });
        document.body.addEventListener('touchcancel', TouchEnd, { passive: false });
        R = true;
      }
    }
  })(e.domElement, t2);
  t2.dispose = () => {
    b.delete(e.domElement);
    if (b.size === 0) {
      document.body.removeEventListener('pointermove', M);
      document.body.removeEventListener('pointerleave', L);
      document.body.removeEventListener('click', C);
      document.body.removeEventListener('touchstart', TouchStart);
      document.body.removeEventListener('touchmove', TouchMove);
      document.body.removeEventListener('touchend', TouchEnd);
      document.body.removeEventListener('touchcancel', TouchEnd);
      R = false;
    }
  };
  return t2;
}
function M(e) { A.x = e.clientX; A.y = e.clientY; processInteraction(); }
function processInteraction() {
  for (const [elem, t2] of b) {
    const i2 = elem.getBoundingClientRect();
    if (D(i2)) {
      P(t2, i2);
      if (!t2.hover) { t2.hover = true; t2.onEnter(t2); }
      t2.onMove(t2);
    } else if (t2.hover && !t2.touching) { t2.hover = false; t2.onLeave(t2); }
  }
}
function C(e) {
  A.x = e.clientX; A.y = e.clientY;
  for (const [elem, t2] of b) {
    const i2 = elem.getBoundingClientRect();
    P(t2, i2);
    if (D(i2)) t2.onClick(t2);
  }
}
function L() { for (const t2 of b.values()) { if (t2.hover) { t2.hover = false; t2.onLeave(t2); } } }
function TouchStart(e) {
  if (e.touches.length > 0) {
    A.x = e.touches[0].clientX; A.y = e.touches[0].clientY;
    for (const [elem, t2] of b) {
      const rect = elem.getBoundingClientRect();
      if (D(rect)) {
        t2.touching = true; P(t2, rect);
        if (!t2.hover) { t2.hover = true; t2.onEnter(t2); }
        t2.onMove(t2);
      }
    }
  }
}
function TouchMove(e) {
  if (e.touches.length > 0) {
    A.x = e.touches[0].clientX; A.y = e.touches[0].clientY;
    for (const [elem, t2] of b) {
      const rect = elem.getBoundingClientRect();
      P(t2, rect);
      if (D(rect)) {
        if (!t2.hover) { t2.hover = true; t2.touching = true; t2.onEnter(t2); }
        t2.onMove(t2);
      } else if (t2.hover && t2.touching) t2.onMove(t2);
    }
  }
}
function TouchEnd() {
  for (const [, t2] of b) {
    if (t2.touching) { t2.touching = false; if (t2.hover) { t2.hover = false; t2.onLeave(t2); } }
  }
}
function P(e, t2) {
  const { position: i2, nPosition: s2 } = e;
  i2.x = A.x - t2.left; i2.y = A.y - t2.top;
  s2.x = (i2.x / t2.width) * 2 - 1;
  s2.y = (-i2.y / t2.height) * 2 + 1;
}
function D(e) {
  const { x: t2, y: i2 } = A;
  const { left: s2, top: n2, width: o2, height: r2 } = e;
  return t2 >= s2 && t2 <= s2 + o2 && i2 >= n2 && i2 <= n2 + r2;
}

const { randFloat: k, randFloatSpread: E } = o;
const F = new a(), I = new a(), O = new a(), V = new a(), B = new a(),
  N = new a(), _ = new a(), j = new a(), H = new a(), T = new a();

class W {
  #grid = new Map();
  #cellSize = 1;
  #buildGrid() {
    const { config: e, positionData: t2, sizeData: i2 } = this;
    let maxR = 0;
    for (let k = 0; k < e.count; k++) if (i2[k] > maxR) maxR = i2[k];
    this.#cellSize = Math.max(maxR * 2, 0.001);
    const g2 = this.#grid;
    g2.clear();
    for (let k = 0; k < e.count; k++) {
      const b2 = 3 * k;
      const key = `${Math.floor(t2[b2] / this.#cellSize)},${Math.floor(t2[b2 + 1] / this.#cellSize)},${Math.floor(t2[b2 + 2] / this.#cellSize)}`;
      const arr = g2.get(key);
      if (arr) arr.push(k); else g2.set(key, [k]);
    }
  }
  constructor(e) {
    this.config = e;
    this.positionData = new Float32Array(3 * e.count).fill(0);
    this.velocityData = new Float32Array(3 * e.count).fill(0);
    this.sizeData = new Float32Array(e.count).fill(1);
    this.center = new a();
    this.#R();
    this.setSizes();
  }
  #R() {
    const { config: e, positionData: t2 } = this;
    this.center.toArray(t2, 0);
    for (let i2 = 1; i2 < e.count; i2++) {
      const s2 = 3 * i2;
      t2[s2] = E(2 * e.maxX);
      t2[s2 + 1] = E(2 * e.maxY);
      t2[s2 + 2] = E(2 * e.maxZ);
    }
  }
  setSizes() {
    const { config: e, sizeData: t2 } = this;
    t2[0] = e.size0;
    for (let i2 = 1; i2 < e.count; i2++) t2[i2] = k(e.minSize, e.maxSize);
  }
  update(e) {
    const { config: t2, center: i2, positionData: s2, sizeData: n2, velocityData: o2 } = this;
    let r2 = 0;
    if (t2.controlSphere0) {
      r2 = 1;
      F.fromArray(s2, 0);
      F.lerp(i2, 0.1).toArray(s2, 0);
      V.set(0, 0, 0).toArray(o2, 0);
    }
    for (let idx = r2; idx < t2.count; idx++) {
      const base = 3 * idx;
      I.fromArray(s2, base);
      B.fromArray(o2, base);
      B.y -= e.delta * t2.gravity * n2[idx];
      B.multiplyScalar(t2.friction);
      B.clampLength(0, t2.maxVelocity);
      I.add(B);
      I.toArray(s2, base);
      B.toArray(o2, base);
    }
    // Uniform-grid broadphase (addition to upstream): the original loop was
    // O(n²) over every pair, which cost ~51k iterations/frame at count 320.
    this.#buildGrid();
    const gridMap = this.#grid, gCell = this.#cellSize;
    for (let idx = r2; idx < t2.count; idx++) {
      const base = 3 * idx;
      I.fromArray(s2, base);
      B.fromArray(o2, base);
      const radius = n2[idx];
      const cx = Math.floor(I.x / gCell), cy = Math.floor(I.y / gCell), cz = Math.floor(I.z / gCell);
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) for (let oz = -1; oz <= 1; oz++) {
        const bucket = gridMap.get(`${cx + ox},${cy + oy},${cz + oz}`);
        if (!bucket) continue;
        for (let bi = 0; bi < bucket.length; bi++) {
          const jdx = bucket[bi];
          if (jdx <= idx) continue;
          const otherBase = 3 * jdx;
          O.fromArray(s2, otherBase);
          N.fromArray(o2, otherBase);
          const otherRadius = n2[jdx];
          _.copy(O).sub(I);
          const dist = _.length();
          const sumRadius = radius + otherRadius;
          if (dist < sumRadius) {
            const overlap = sumRadius - dist;
            j.copy(_).normalize().multiplyScalar(0.5 * overlap);
            H.copy(j).multiplyScalar(Math.max(B.length(), 1));
            T.copy(j).multiplyScalar(Math.max(N.length(), 1));
            I.sub(j); B.sub(H);
            I.toArray(s2, base); B.toArray(o2, base);
            O.add(j); N.add(T);
            O.toArray(s2, otherBase); N.toArray(o2, otherBase);
          }
        }
      }
      if (t2.controlSphere0) {
        _.copy(F).sub(I);
        const dist = _.length();
        const sumRadius0 = radius + n2[0];
        if (dist < sumRadius0) {
          const diff = sumRadius0 - dist;
          j.copy(_.normalize()).multiplyScalar(diff);
          H.copy(j).multiplyScalar(Math.max(B.length(), 2));
          I.sub(j); B.sub(H);
        }
      }
      if (Math.abs(I.x) + radius > t2.maxX) {
        I.x = Math.sign(I.x) * (t2.maxX - radius);
        B.x = -B.x * t2.wallBounce;
      }
      if (t2.gravity === 0) {
        if (Math.abs(I.y) + radius > t2.maxY) {
          I.y = Math.sign(I.y) * (t2.maxY - radius);
          B.y = -B.y * t2.wallBounce;
        }
      } else if (I.y - radius < -t2.maxY) {
        I.y = -t2.maxY + radius;
        B.y = -B.y * t2.wallBounce;
      }
      const maxBoundary = Math.max(t2.maxZ, t2.maxSize);
      if (Math.abs(I.z) + radius > maxBoundary) {
        I.z = Math.sign(I.z) * (t2.maxZ - radius);
        B.z = -B.z * t2.wallBounce;
      }
      I.toArray(s2, base);
      B.toArray(o2, base);
    }
  }
}

class Y extends c {
  constructor(e) {
    super(e);
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 }
    };
    this.defines.USE_UV = '';
    this.onBeforeCompile = e2 => {
      Object.assign(e2.uniforms, this.uniforms);
      e2.fragmentShader =
        '\n        uniform float thicknessPower;\n        uniform float thicknessScale;\n        uniform float thicknessDistortion;\n        uniform float thicknessAmbient;\n        uniform float thicknessAttenuation;\n      ' +
        e2.fragmentShader;
      e2.fragmentShader = e2.fragmentShader.replace(
        'void main() {',
        '\n        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {\n          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));\n          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;\n          #ifdef USE_COLOR\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;\n          #else\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;\n          #endif\n          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;\n        }\n\n        void main() {\n      '
      );
      const t2 = h.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        '\n          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);\n        '
      );
      e2.fragmentShader = e2.fragmentShader.replace('#include <lights_fragment_begin>', t2);
      if (this.onBeforeCompile2) this.onBeforeCompile2(e2);
    };
  }
}

const X = {
  count: 200,
  colors: [0, 0, 0],
  ambientColor: 16777215,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: { metalness: 0.5, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 },
  minSize: 0.5,
  maxSize: 1,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: true
};

const U = new m();

class Z extends d {
  constructor(e, t2 = {}) {
    const i2 = { ...X, ...t2 };
    const s2 = new z();
    const n2 = new p(e, 0.04).fromScene(s2).texture;
    const o2 = new g();
    const r2 = new Y({ envMap: n2, ...i2.materialParams });
    r2.envMapRotation.x = -Math.PI / 2;
    super(o2, r2, i2.count);
    this.config = i2;
    this.physics = new W(i2);
    this.#S();
    this.setColors(i2.colors);
  }
  #S() {
    this.ambientLight = new f(this.config.ambientColor, this.config.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new u(this.config.colors[0], this.config.lightIntensity);
    this.add(this.light);
  }
  setColors(e) {
    if (Array.isArray(e) && e.length > 1) {
      const t2 = (function (cols) {
        let arr, objs;
        function setColors(c2) { arr = c2; objs = []; arr.forEach(col => { objs.push(new l(col)); }); }
        setColors(cols);
        return {
          setColors,
          getColorAt: function (ratio, out = new l()) {
            const scaled = Math.max(0, Math.min(1, ratio)) * (arr.length - 1);
            const idx = Math.floor(scaled);
            const start = objs[idx];
            if (idx >= arr.length - 1) return start.clone();
            const alpha = scaled - idx;
            const end = objs[idx + 1];
            out.r = start.r + alpha * (end.r - start.r);
            out.g = start.g + alpha * (end.g - start.g);
            out.b = start.b + alpha * (end.b - start.b);
            return out;
          }
        };
      })(e);
      for (let idx = 0; idx < this.count; idx++) {
        this.setColorAt(idx, t2.getColorAt(idx / this.count));
        if (idx === 0) this.light.color.copy(t2.getColorAt(idx / this.count));
      }
      this.instanceColor.needsUpdate = true;
    }
  }
  update(e) {
    this.physics.update(e);
    for (let idx = 0; idx < this.count; idx++) {
      U.position.fromArray(this.physics.positionData, 3 * idx);
      if (idx === 0 && this.config.followCursor === false) U.scale.setScalar(0);
      else U.scale.setScalar(this.physics.sizeData[idx]);
      U.updateMatrix();
      this.setMatrixAt(idx, U.matrix);
      if (idx === 0) this.light.position.copy(U.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createBallpit(e, t2 = {}) {
  const i2 = new x({ canvas: e, size: 'parent', rendererOptions: { antialias: true, alpha: true } });
  let s2;
  i2.renderer.toneMapping = v;
  i2.camera.position.set(0, 0, 20);
  i2.camera.lookAt(0, 0, 0);
  i2.cameraMaxAspect = 1.5;
  i2.resize();
  initialize(t2);
  const n2 = new y();
  const o2 = new w(new a(0, 0, 1), 0);
  const r2 = new a();
  let c2 = false;

  e.style.touchAction = 'none';
  e.style.userSelect = 'none';
  e.style.webkitUserSelect = 'none';

  const h2 = S({
    domElement: e,
    onMove() {
      n2.setFromCamera(h2.nPosition, i2.camera);
      i2.camera.getWorldDirection(o2.normal);
      n2.ray.intersectPlane(o2, r2);
      s2.physics.center.copy(r2);
      s2.config.controlSphere0 = true;
    },
    onLeave() { s2.config.controlSphere0 = false; }
  });
  function initialize(cfg) {
    if (s2) { i2.clear(); i2.scene.remove(s2); }
    s2 = new Z(i2.renderer, cfg);
    i2.scene.add(s2);
  }
  i2.onBeforeRender = e2 => { if (!c2) s2.update(e2); };
  i2.onAfterResize = e2 => { s2.config.maxX = e2.wWidth / 2; s2.config.maxY = e2.wHeight / 2; };
  return {
    three: i2,
    get spheres() { return s2; },
    setCount(n3) { initialize({ ...s2.config, count: n3 }); },
    updateConfig(newProps) {
      if (newProps.count !== undefined && newProps.count !== s2.config.count) {
        initialize({ ...s2.config, ...newProps });
      } else {
        Object.assign(s2.config, newProps);
        if (newProps.colors) s2.setColors(s2.config.colors);
        if (newProps.minSize !== undefined || newProps.maxSize !== undefined || newProps.size0 !== undefined) {
          s2.physics.setSizes();
        }
      }
    },
    togglePause() { c2 = !c2; },
    setPaused(v) {
      c2 = !!v;
      if (c2) i2.stopLoop(); else i2.startLoop();
    },
    dispose() { h2.dispose(); i2.dispose(); }
  };
}

const React = window.React;

function Ballpit({ className = '', followCursor = true, pauseWhenHidden, ...props }) {
  const canvasRef = React.useRef(null);
  const instanceRef = React.useRef(null);
  const firstRender = React.useRef(true);
  const pausedRef = React.useRef(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    instanceRef.current = createBallpit(canvas, { followCursor, ...props });
    return () => {
      if (instanceRef.current) { instanceRef.current.dispose(); instanceRef.current = null; }
    };
  }, []);

  React.useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (instanceRef.current) instanceRef.current.updateConfig({ followCursor, ...props });
  }, [props, followCursor]);

  // A sticky hero keeps its canvas permanently intersecting the viewport, which
  // defeats the internal IntersectionObserver. Pause explicitly instead.
  React.useEffect(() => {
    const want = !!pauseWhenHidden;
    const inst = instanceRef.current;
    if (!inst) return;
    if (want !== pausedRef.current) { inst.setPaused(want); pausedRef.current = want; }
  }, [pauseWhenHidden]);

  return React.createElement('canvas', {
    className,
    ref: canvasRef,
    style: { width: '100%', height: '100%', display: 'block' }
  });
}

window.Ballpit = Ballpit;

// Addition (not upstream): expose the plain-JS factory directly so this
// component can be driven without a React runtime. `Ballpit()` above is a
// thin React wrapper around this same function.
window.createBallpit = createBallpit;
