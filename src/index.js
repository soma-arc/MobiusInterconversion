import SL2C from '../lib/GeometryUtils/src/sl2c.js';
import Complex from '../lib/GeometryUtils/src/complex.js';
import { Classify } from './mobius.js';
import Canvas2D from './canvas2d.js';
import Scene from './scene.js';

window.addEventListener('load', () => {
    const m = new SL2C(Complex.ONE, Complex.ZERO,
                       new Complex(0, -2), Complex.ONE);
    Classify(m);
    const m2 = new SL2C(new Complex(1, -1), Complex.ONE,
                        Complex.ONE, new Complex(1, 1));
    Classify(m2);

    const scene = new Scene();
    const canvas2d = new Canvas2D('canvas', scene);
    canvas2d.render();
});
