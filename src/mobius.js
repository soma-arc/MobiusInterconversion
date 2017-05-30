import assert from 'power-assert';
import Complex from '../lib/GeometryUtils/src/complex.js';
import SL2C from '../lib/GeometryUtils/src/sl2c.js';

/**
 * Compute one of the fixed point (-)
 * @param {SL2C} m
 * @returns {Complex}
 */
export function FixPlus (m) {
    assert.ok(m instanceof SL2C);
    const four = new Complex(4, 0);
    const tr = m.trace();
    const nume = m.a.sub(m.d).add(Complex.sqrt(tr.mult(tr).sub(four)));
    return nume.div(m.c.scale(2));
}

/**
 * Compute one of the fixed point (+)
 * @param {SL2C} m
 * @returns {Complex} the fixed point
 */
export function FixMinus (m) {
    assert.ok(m instanceof SL2C);
    const four = new Complex(4, 0);
    const tr = m.trace();
    const nume = m.a.sub(m.d).sub(Complex.sqrt(tr.mult(tr).sub(four)));
    return nume.div(m.c.scale(2));
}

/**
 * Compute SL2C matrix that sends the two fixed points to zero and infinity
 * @param {Complex} fixMinus
 * @param {Complex} fixPlus
 * @returns {SL2C}
 */
function MobiusZeroInf (fixMinus, fixPlus) {
    return new SL2C(Complex.ONE, fixMinus.scale(-1),
                    Complex.ONE, fixPlus.scale(-1));
}

/**
 * Compute SL2C matrix that sends the fix point to infinity
 * @param {Complex} fix
 * @returns {SL2C}
 */
function MobiusFixInf (fix) {
    return new SL2C(Complex.ZERO, Complex.ONE,
                    Complex.ONE, fix.scale(-1));
}

class ParabolicTransformation {
    /**
     * constructor
     * @param {SL2C} m
     */
    constructor (m) {
        this.sl2c = m;
        if (m.c.isZero()) {
            this.translation = m.b;
        } else {
            const fm = FixMinus(m);
            let s = MobiusFixInf(fm);
            this.t = s.mult(m).mult(s.inverse());
            this.t = this.t.scale(Complex.ONE.div(this.t.determinant()))
            this.s = s;
            this.translation = this.t.b;
            console.log(this.t);
            console.log(`the fixed point: (${fm.re}, ${fm.im})`)
            console.log(`translation: (${this.translation.re}, ${this.translation.im})`);
        }
    }
}

class EllipticTransformation {
    constructor (m) {
        this.sl2c = m;
        const tr = m.trace();
        this.k = tr.mult(tr).scale(0.5).sub(Complex.ONE);
    }
}

class LoxodromicTransformation {
    constructor (m) {
        this.sl2c = m;
        const tr = m.trace();
        this.k = tr.mult(tr).scale(0.5).sub(Complex.ONE);
    }
}

class HyperbolicTransformation {
    constructor (m) {
        this.sl2c = m;
        const tr = m.trace();
        this.k = tr.mult(tr).scale(0.5).sub(Complex.ONE);
    }
}

export function Classify (m) {
    // c z^2 + (d - a) z - b = 0
    // D = (d - a)^2 + 4 b c
    const da = m.d.sub(m.a);
    const D = da.mult(da).add(m.b.mult(m.c).scale(4))
    if (m.c.isZero() || D.isZero()) {
        // when c is zero, the fixed point is infinity
        // for the other case, we compute the fixed point
        // using FixPlus or FixMinus functions.
        console.log('parabolic');
        return new ParabolicTransformation(m);
    } else {
        // The two fixed poins can be computed using FixPlus
        // and FixMinus functions.
        const tr = m.trace();
        // delta^2 = k
        // delta^2 - (a + d)^2 delta + 1 = 0
        const k = tr.mult(tr).scale(0.5).sub(Complex.ONE);
        if (k.length() - 1 < 0.000001) {
            console.log('elliptic');
            return new EllipticTransformation(m);
        } else {
            if (k.isReal()) {
                console.log('hyperbolic');
                return new HyperbolicTransformation(m);
            } else {
                console.log('loxodromic');
                return new LoxodromicTransformation(m);
            }
        }
    }
}
