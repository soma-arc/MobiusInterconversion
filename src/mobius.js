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
 * Apply a mobius transformation to a given circle
 * @param {SL2C} m
 * @param {Circle} c
 * @returns {Circle}
 */
export function mobiusOnCircle (m, c) {
    const compR = new Complex(c.r, 0);
    const rSq = compR.sq();
    const z = c.center.sub(rSq.div(Complex.conjugate(m.d.div(m.c).add(c.center))));
    const newCenter = m.apply(z);
    const newR = Complex.abs(newCenter.sub(m.apply(c.center.add(compR))));
    return new Circle(newCenter, newR);
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

export class Circle {
    /**
     * constructor
     * @param {Complex} center
     * @param {number} r
     */
    constructor (center, r) {
        this.center = center;
        this.r = r;
    }

    /**
     * Apply inversion to a given point
     * @param {Complex} p
     */
    invertOnPoint (p) {
        const r2 = this.r * this.r;
        const d = p.sub(this.center);
        const lenSq = d.absSq();
        return d.scale(r2 / lenSq).add(this.center);
    }

    /**
     * Apply inversion to a given circle
     * @param {Circle} c
     * @returns {Circle}
     */
    invertOnCircle (c) {
        if (c instanceof HalfPlane) {
            const p1 = this.invertOnPoint(c.p);
            const p2 = this.invertOnPoint(c.p.add(c.boundaryDir.scale(-20)));
            const p3 = this.invertOnPoint(c.p.add(c.boundaryDir.scale(10)));
            return Circle.fromPoints(p1, p2, p3);
        }
        const coeffR = c.r * Math.sqrt(2) / 2;
        const p1 = this.invertOnPoint(c.center.add(new Complex(coeffR, coeffR)));
        const p2 = this.invertOnPoint(c.center.add(new Complex(-coeffR, -coeffR)));
        const p3 = this.invertOnPoint(c.center.add(new Complex(coeffR, -coeffR)));
        return Circle.fromPoints(p1, p2, p3);
    }

    /**
     * Compute a circle passing through three points
     * @param {Complex} a
     * @param {Complex} b
     * @param {Complex} c
     * @returns {Circle}
     */
    static fromPoints (a, b, c) {
        const lA = Complex.distance(b, c);
        const lB = Complex.distance(a, c);
        const lC = Complex.distance(a, b);
        const coefA = lA * lA * (lB * lB + lC * lC - lA * lA);
        const coefB = lB * lB * (lA * lA + lC * lC - lB * lB);
        const coefC = lC * lC * (lA * lA + lB * lB - lC * lC);
        const denom = coefA + coefB + coefC;
        const center = new Complex((coefA * a.re + coefB * b.re + coefC * c.re) / denom,
                                   (coefA * a.im + coefB * b.im + coefC * c.im) / denom);
        return new Circle(center, Complex.distance(center, a));
    }
}

export class HalfPlane extends Circle {
    /**
     * Half Plane
     *       ^ normal
     *       |
     * ------+-------
     * //////////////
     * @param {Complex} p reference point
     * @param {Complex} normal normal vector of this plane
     */
    constructor (p, normal) {
        super(Complex.INFINITY, Number.POSITIVE_INFINITY);

        this.p = p;
        this.normal = normal.scale(1 / normal.abs());
        // rotate normal vector by PI/2 radians
        this.boundaryDir = new Complex(-this.normal.im,
                                       this.normal.re);
    }

    /**
     * Apply inversion to a given point
     * @param {Complex} point
     */
    invertOnPoint (point) {
        let pos = point.sub(this.p);
        const dp = pos.re * this.normal.re + pos.im * this.normal.im; // dot product
        pos = pos.sub(this.normal.scale(2 * dp));
        return pos.add(this.p);
    }

    /**
     * Apply inversion to a given circle
     * @param {Circle} c
     * @returns {Circle}
     */
    invertOnCircle (c) {
        if (c instanceof HalfPlane) {
            return new HalfPlane(this.invertOnPoint(c.center),
                                 c.normal.scale(-1));
        }

        return new Circle(this.invertOnPoint(c.center), c.r);
    }

    /**
     * Apply mobius transformation to this half plane
     * @param {SL2C} m
     * @return {Circle}
     */
    applyMobius (m) {
        const mp1 = m.apply(this.p.add(this.boundaryDir.scale(2)));
        const mp2 = m.apply(this.p.add(this.boundaryDir.scale(-4)));
        const mp3 = m.apply(this.p.add(this.boundaryDir.scale(6)));
//        console.log(`points (${mp1.re}, ${mp1.im}), ` +
//                    `(${mp2.re}, ${mp2.im}), (${mp3.re}, ${mp3.im})`);

        let mv = mp1.sub(mp2);
        let halfPlane = false;
        if (mp1.isInfinity() || mp2.isInfinity() || mp3.isInfinity()) {
            // if one of the tranformed point is infinity
            halfPlane = true;
            const arr = [mp1, mp2, mp3].filter((elem) => { return !elem.isInfinity() });
            mv = arr[0].sub(arr[1]);
        } else if ((mv.im === 0 && mp3.im === 0) ||
                   (mv.re === 0 && mp3.re === 0) ||
                   Math.abs((mp3.re - mp1.re) * mv.im - mv.re * (mp3.im - mp1.im)) < 0.00000001) {
            // Three points are on a line.
            halfPlane = true;
        }

        if (halfPlane) {
            // half plane
            let np = m.apply(this.p);
            if (np.isInfinity()) np = mp1;
            const innerPoint = m.apply(this.p.add(this.normal.scale(-1)));

            const innerVec = innerPoint.sub(np).normalize();
            let nNormal = new Complex(-mv.im, mv.re).normalize();
            if (Complex.dot(innerVec, nNormal) > 0) nNormal = nNormal.scale(-1);
            return new HalfPlane(np, nNormal);
        } else {
            return Circle.fromPoints(mp1, mp2, mp3);
        }
    }
}

export class ParabolicTransformation {
    /**
     * constructor
     * @param {SL2C} m
     */
    constructor (m) {
        this.sl2c = m;
        if (m.c.isZero()) {
            this.translation = m.b;
        } else {
            this.fix = FixMinus(m);
            let s = MobiusFixInf(this.fix);
            const sInv = s.inverse();
            this.t = s.mult(m).mult(sInv);
            this.t = this.t.scale(Complex.ONE.div(this.t.determinant()))
            this.s = s;
            this.translation = this.t.b;
            console.log(this.t);
            console.log(`the fixed point: (${this.fix.re}, ${this.fix.im})`)
            console.log(`translation: (${this.translation.re}, ${this.translation.im})`);

            // One of the reference point of half planes is zero.
            this.hp1 = new HalfPlane(Complex.ZERO,
                                     this.translation);
            this.hp2 = new HalfPlane((this.translation.scale(0.5)),
                                     this.translation.scale(-1));
            console.log(this.hp1);
            console.log(this.hp2);
            const originalC1 = this.hp1.applyMobius(sInv);
            const originalC2 = this.hp2.applyMobius(sInv);

            if (originalC1.r < originalC2.r) {
                this.c1 = originalC1;
                this.c2 = originalC2;
            } else {
                this.c1 = originalC2;
                this.c2 = originalC1;
            }
            this.c1d = this.c2.invertOnCircle(this.c1);
            console.log('c1, c2, c1\'');
            console.log(this.c1);
            console.log(this.c2);
            console.log(this.c1d);
            console.log('------');
        }
    }

    setUniformLocation(gl, uniLocations, program, index) {
        uniLocations.push(gl.getUniformLocation(program, `u_parabolic${index}`));
    }

    setUniformValues(gl, uniLocation, uniIndex) {
        let uniI = uniIndex;
        // [[isHalfPlane(0 or 1), x, y, r, r * r],
        //  [isHalfPlane, px, py, normalx, normaly]]
        // [c1, c2, c1d]
        // translateX/2, translateY/2
        // SL2C[a, b, c, d]
        gl.uniform1fv(uniLocation[uniI++],
                      this.getUniformArray());
        return uniI;
    }

    getUniformArray() {
        let uni = [];
        const circles = [this.c1, this.c2, this.c1d];
        for (const c of circles) {
            if (c instanceof HalfPlane) {
                uni.push(1, c.p.re, c.p.im,
                         c.normal.re, this.c2.normal.im);
            } else {
                uni.push(0, c.center.re, c.center.im,
                         c.r, c.r * c.r);
            }
        }
        uni = uni.concat(this.s.linearArray,
                         this.translation.linearArray,
                         this.s.inverse().linearArray);
        return uni;
    }

    getClassName() {
        return 'ParabolicTransformation';
    }
}

class EllipticTransformation {
    constructor (m) {
        this.sl2c = m;
        const tr = m.trace();
        this.k = tr.mult(tr).scale(0.5).sub(Complex.ONE);

        this.fixPlus = FixPlus(this.sl2c);
        this.fixMinus = FixMinus(this.sl2c);
    }
}

class LoxodromicTransformation {
    constructor (m) {
        this.sl2c = m;
        const tr = m.trace();
        this.k = tr.mult(tr).scale(0.5).sub(Complex.ONE);

        this.fixPlus = FixPlus(this.sl2c);
        this.fixMinus = FixMinus(this.sl2c);
    }
}

class HyperbolicTransformation {
    constructor (m) {
        this.sl2c = m;
        const tr = m.trace();
        this.k = tr.mult(tr).scale(0.5).sub(Complex.ONE);

        this.fixPlus = FixPlus(this.sl2c);
        this.fixMinus = FixMinus(this.sl2c);
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
