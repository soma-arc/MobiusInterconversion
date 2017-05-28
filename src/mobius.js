import assert from 'power-assert';
import Complex from '../lib/GeometryUtils/src/complex.js';
import SL2C from '../lib/GeometryUtils/src/sl2c.js';

export function FixPlus (m) {
    assert.ok(m instanceof SL2C);
    const four = new Complex(4, 0);
    const tr = m.trace();
    const nume = m.a.sub(m.d).add(Complex.sqrt(tr.mult(tr).sub(four)));
    return nume.div(m.c.scale(2));
}

export function FixMinus (m) {
    assert.ok(m instanceof SL2C);
    const four = new Complex(4, 0);
    const tr = m.trace();
    const nume = m.a.sub(m.d).sub(Complex.sqrt(tr.mult(tr).sub(four)));
    return nume.div(m.c.scale(2));
}

export function Classify (m) {
    // c z^2 + (d - a) z - b = 0
    // D = (d - a)^2 + 4 b c
    const da = m.d.sub(m.a);
    const D = da.mult(da).add(m.b.mult(m.c).scele(4))
    if (m.c.isZero() || D.isZero()) {
        // when c is zero, the fixed point is infinity
        // for the other case, we compute the fixed point
        // using FixPlus or FixMinus functions.
        console.log('parabolic');
    } else {
        // The two fixed poins can be computed using FixPlus
        // and FixMinus functions.
        const tr = m.trace();
        // delta^2 = k
        // delta^2 - (a + d)^2 delta + 1 = 0
        const k = tr.mult(tr).scale(0.5).sub(Complex.ONE);
        if (k.length() - 1 < 0.000001) {
            console.log('elliptic');
        } else {
            console.log('loxodromic');
        }
    }
}
