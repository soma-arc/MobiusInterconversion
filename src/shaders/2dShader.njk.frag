#version 300 es

precision mediump float;

uniform sampler2D u_accTexture;
uniform vec2 u_resolution;
// [translateX, translateY, scale]
uniform vec3 u_geometry;
uniform int u_maxIISIterations;

{% for n in range(0, numParabolicTransformation) %}
uniform float u_parabolic{{ n }}[33];
{% endfor %}

out vec4 outColor;

const vec3 BLACK = vec3(0);
const vec3 WHITE = vec3(1);
const vec3 RED = vec3(0.8, 0, 0);
const vec3 GREEN = vec3(0, 0.8, 0);
const vec3 BLUE = vec3(0, 0, 0.8);

vec2 compProd(const vec2 a, const vec2 b){
    return vec2(a.x * b.x - a.y * b.y,
                a.x * b.y + a.y * b.x);
}

vec2 compQuot(const vec2 a, const vec2 b){
    float denom = dot(b, b);
    return vec2((a.x * b.x + a.y * b.y) / denom,
                (a.y * b.x - a.x * b.y) / denom);
}

// mobius is SL(2, C), 2x2 complex number matrix
// c is CP1
vec2 applyMobiusArray(const vec2 a, const vec2 b, const vec2 c, const vec2 d,
                      const vec2 p){
    vec2 nume = compProd(a, p) + b;
    vec2 denom = compProd(c, p) + d;
    return compQuot(nume, denom);
}


// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 rand2n(const vec2 co, const float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
    seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

vec2 circleInvert(const vec2 pos, const vec4 circle){
    vec2 p = pos - circle.xy;
    float d = length(p);
    return (p * circle.w)/(d * d) + circle.xy;
}

const int MAX_ITERATIONS = 200;
float IIS(vec2 pos) {
    float invNum = 0.;
    bool inFund = true;
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        if(i > u_maxIISIterations) break;
        inFund = true;

        vec2 p;
        vec2 t;
        float translateDist;
        vec2 normal;
        float d;
        {% for n in range(0, numParabolicTransformation) %}
        pos = applyMobiusArray(vec2(u_parabolic{{ n }}[15], u_parabolic{{ n }}[16]),
                               vec2(u_parabolic{{ n }}[17], u_parabolic{{ n }}[18]),
                               vec2(u_parabolic{{ n }}[19], u_parabolic{{ n }}[20]),
                               vec2(u_parabolic{{ n }}[21], u_parabolic{{ n }}[22]),
                               pos);
        t = vec2(u_parabolic{{ n }}[23], u_parabolic{{ n }}[24]);
        translateDist = length(t);
        normal = normalize(t);
        d = dot(normal, pos);
        if(d < 0. || translateDist < d){
            //            invNum += abs(floor(d / translateDist));
            pos = pos - normal * (d - mod(d, translateDist));
            inFund = false;
        }
        pos = applyMobiusArray(vec2(u_parabolic{{ n }}[25], u_parabolic{{ n }}[26]),
                               vec2(u_parabolic{{ n }}[27], u_parabolic{{ n }}[28]),
                               vec2(u_parabolic{{ n }}[29], u_parabolic{{ n }}[30]),
                               vec2(u_parabolic{{ n }}[31], u_parabolic{{ n }}[32]),
                               pos);
        {% endfor %}

        float r = 0.5;
        vec4 c = vec4(1., .5, r, r * r);
        if(distance(pos, c.xy) < c.z) {
            pos = circleInvert(pos, c);
            invNum++;
            inFund = false;
        }

        if (inFund) break;
    }

    return invNum;
}

vec3 hsv2rgb(vec3 c){
    const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 blendCol(vec4 srcC, vec4 outC){
	srcC.rgb *= srcC.a;
	return outC + srcC * (1.0 - outC.a);
}

bool renderGenerator(vec2 pos, out vec4 color) {
    vec3 nFact;
    vec4 genCol;
    {% for n in range(0, numParabolicTransformation) %}
    nFact = vec3(0.1 * float({{ n }}));
    genCol = vec4(0);
    for(int i = 2 ; i >= 0 ; i--) {
        vec3 col = (i == 0) ? RED : BLUE;
        col = (i == 1) ? GREEN : col;
        if(u_parabolic{{ n }}[i * 5] == 0.) { // isHalfPlane?
            // Circle
            vec3 c = vec3(u_parabolic{{ n }}[i * 5 + 1],
                          u_parabolic{{ n }}[i * 5 + 2],
                          u_parabolic{{ n }}[i * 5 + 3]);
            if(distance(pos, c.xy) < c.z) {
                genCol = vec4(col, 0.5);
                break;
            }
        } else {
            // HalfPlane
            vec4 c = vec4(u_parabolic{{ n }}[i * 5 + 1],
                          u_parabolic{{ n }}[i * 5 + 2],
                          u_parabolic{{ n }}[i * 5 + 3],
                          u_parabolic{{ n }}[i * 5 + 4]);
            if(dot(pos - c.xy, c.zw) < 0.) {
                genCol = vec4(col, 0.5);
                break;
            }
        }
    }
    color = blendCol(genCol, color);
    {% endfor %}
    return true;
}

const float MAX_SAMPLES = 10.;
void main() {
    vec3 sum = vec3(0);
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    for(float i = 0.; i < MAX_SAMPLES; i++){
        vec2 position = ((gl_FragCoord.xy + rand2n(gl_FragCoord.xy, i)) / u_resolution.yy ) - vec2(ratio, 0.5);
        position = position * u_geometry.z;
        position += u_geometry.xy;

        vec4 col = vec4(0);
        bool isRendered = renderGenerator(position, col);
        //        if(isRendered) {
            //sum += col.rgb;
            //            continue;
            //        }
        float loopNum = IIS(position);
        if(loopNum > 0.){
            vec3 hsv = vec3(0. + 0.01 * (loopNum -1.), 1.0, 1.0);
            sum += blendCol(col, vec4(hsv2rgb(hsv), 0.75)).rgb;
        } else {
            sum += col.rgb;
        }
    }
    vec3 texCol = texture(u_accTexture, gl_FragCoord.xy / u_resolution).rgb;
    outColor = vec4(sum / MAX_SAMPLES, 1);
}
