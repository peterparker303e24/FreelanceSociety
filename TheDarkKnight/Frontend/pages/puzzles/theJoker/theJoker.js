// Begin once the dom has loaded
document.addEventListener('DOMContentLoaded', () => {

    // Images and element related to the webpage
    const image1 = document.querySelector('.image-1');
    const image2 = document.querySelector('.image-2');
    const image3 = document.querySelector('.image-3');
    const image4 = document.querySelector('.image-4');
    const element1 = document.querySelector('.element-1');

    // Currently selected draggable image
    let current = null;

    // Start dragging image2 when selected
    image2.addEventListener('pointerdown', e => {
        e.preventDefault();
        current = image2;
        current.setPointerCapture(e.pointerId);
        const rect = current.getBoundingClientRect();
        elStartLeft = rect.left + window.scrollX;
        elStartTop = rect.top + window.scrollY;
        current.style.userSelect = 'none';
    });

    // Stop dragging image2 when deselected
    image2.addEventListener('pointerup', e => {
        if (!current) return;
        current.releasePointerCapture(e.pointerId);
        current.style.userSelect = '';
        current = null;
    });
    image2.addEventListener('pointercancel', () => {
        if (current) {
            current.style.userSelect = '';
            current = null;
        }
    });

    // Start dragging image3 when selected
    image3.addEventListener('pointerdown', e => {
        e.preventDefault();
        current = image3;
        current.setPointerCapture(e.pointerId);
        const rect = current.getBoundingClientRect();
        elStartLeft = rect.left + window.scrollX;
        elStartTop = rect.top + window.scrollY;
        current.style.userSelect = 'none';
    });

    // Stop dragging image3 when deselected
    image3.addEventListener('pointerup', e => {
        if (!current) return;
        current.releasePointerCapture(e.pointerId);
        current.style.userSelect = '';
        current = null;
    });
    image3.addEventListener('pointercancel', () => {
        if (current) {
            current.style.userSelect = '';
            current = null;
        }
    });

    // Move the selected draggable image
    document.addEventListener('pointermove', e => {
        if (!current) return;
        const rect = current.getBoundingClientRect();
        const halfW = Math.round(rect.width / 2);
        const halfH = Math.round(rect.height / 2);
        const x = Math.round(e.pageX - halfW);
        const y = Math.round(e.pageY - halfH);
        current.style.left = x + 'px';
        current.style.top = y + 'px';
    }, { passive: false });

    // When clue 1 is completed as determined by function1, then show the image
    // and reveal the image configurations
    function1(image3, (value, reset) => {
        const { x, y, width, isCorrect } = createOffsettedRandomDeterministic(
            value.toString(),
            873244444,
            {
                x: 7643841,
                y: 3472748,
                width: 1512513
            }
        );
        if (isCorrect) {
            reset();
            image4.style.left = x + 'px'
            image4.style.top = y + 'px'
            image4.style.width = width + 'px';
            image4.style.display = 'block';
        }
    });

    // When clue 2 is completed as determined by function2, then show the image
    // and element and reveal the image and element configurations
    function2(image2, (value, reset) => {
        const {
            x: x1,
            y: y1,
            width: width1,
            isCorrect: isCorrect
        } = createOffsettedRandomDeterministic(
            value.toString(),
            2293824412,
            {
                x: 4890369,
                y: 8927722,
                width: 8975209
            }
        );
        const {
            x: x2,
            y: y2,
            width: width2,
            height: height2
        } = createOffsettedRandomDeterministic(
            value.toString() + "2",
            3912512234,
            {
                x: 5578366,
                y: 3737092,
                width: 1698570,
                height: 3524667
            }
        );
        if (isCorrect) {
            reset();
            image1.style.left = x1 + 'px'
            image1.style.top = y1 + 'px'
            image1.style.width = width1 + 'px';
            image1.style.display = 'block';
            element1.style.left = x2 + 'px'
            element1.style.top = y2 + 'px'
            element1.style.borderBottom = `${width2}px solid #fff`;
            element1.style.borderLeft = `${height2}px solid transparent`;
            element1.style.display = 'block';
        }
    });
});

/**
 * Pseduo random hash function
 * @param {String} str String input for hash function
 * @returns {Number} Random hash number value
 */
function fnv1a32(str) {
    let h = 0x811c9dc5 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
}

/**
 * Hash the given key and compare with the expected hash result, and if they
 * match then return the rect configurations key
 * @param {String} key Key used for deterministic seed
 * @param {Number} expectedHashResult Expected hash result from seed if key is
 * correct
 * @param {Object} offset Offset, which when combined with a correct key,
 * produces the predetermined rectangular configurations
 * @returns 
 */
function createOffsettedRandomDeterministic(
    key,
    expectedHashResult,
    offset = {}
) {

    // Given offset object
    const o = {
        x: Number(offset.x) || 0,
        y: Number(offset.y) || 0,
        width: Number(offset.width) || 0,
        height: Number(offset.height) || 0,
    };

    // xorshift32 PRNG returning 32-bit unsigned ints
    function xorshift32(seed) {
        let s = seed >>> 0;
        return () => {
            s ^= s << 13;
            s >>>= 0;
            s ^= s >>> 17;
            s >>>= 0;
            s ^= s << 5;
            s >>>= 0;
            return s >>> 0;
        };
    }

    // Generate function given the key hash result to get a function that
    // deterministically generates a random 32-bit number
    const hashResult = fnv1a32(String(key));
    const rand32 = xorshift32(hashResult);

    // Produce large deterministic values in range [1e6, 1e7)
    function randLarge() {
        const r = rand32() / 0xFFFFFFFF;
        return Math.floor(1e6 + r * 9e6);
    }

    // Deterministically generate random rect configurations
    const base = {
        x: randLarge(),
        y: randLarge(),
        width: randLarge(),
        height: randLarge(),
    };

    // If the hash result of the key is correct, then use the offset to
    // calculate the actual rect configurations in relation to the predetermined
    // random rect configurations
    if (hashResult === expectedHashResult) {
        return {
            x: base.x - o.x,
            y: base.y - o.y,
            width: base.width - o.width,
            height: base.height - o.height,
            isCorrect: hashResult === expectedHashResult
        }

        // If the hash result of the key is incorrect, discard the random rect
        // configurations and return the result as incorrect
    } else {
        return {
            isCorrect: false
        };
    }
}

/**
 * Secret function 1 - Analyzing the code might help, but solving this clue is
 * easier through the webpage
 * @param {Element} el Target element
 * @param {Function} callback Callback function 
 * @param {Object} param2 Hyperparameters
 * @returns {Function} Reset element event listeners
 */
function function1(el, callback, {
    s: s = 1000,
    m: m = 8000
} = {}) {
    let h = [];
    let i = null;

    function l() {
        try {
            if (pointerId !== null) el.releasePointerCapture(pointerId);
        }
        catch { }
        pointerId = null;
        history = [];
        el.removeEventListener('pointerdown', g);
        el.removeEventListener('pointermove', j);
    }

    function p(t, x, y) {
        h.push({ t, x, y });
        const c = t - s;
        while (h.length && h[0].t < c) h.shift();

        const e = b();
        const a = e >= m ? 1 : 0;
        callback(a, l);
    }

    function b() {
        let d = 0;
        for (let i = 1; i < h.length; i++) {
            const a = h[i - 1], b = h[i];
            const dt = (b.t - a.t) / 1000; if (dt <= 0) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            const f = Math.hypot(dx, dy) / dt;
            if (f > d) d = f;
        }
        return d;
    }

    function g(e) {
        e.preventDefault();
        i = e.pointerId;
        h = [];
        p(e.timeStamp, e.pageX, e.pageY);
        el.setPointerCapture(i);
    }

    function j(e) {
        if (i !== e.pointerId) return;
        p(e.timeStamp, e.pageX, e.pageY);
    }

    el.addEventListener('pointerdown', g);
    el.addEventListener('pointermove', j);

    return () => {
        el.removeEventListener('pointerdown', g);
        el.removeEventListener('pointermove', j);
    };
}

/**
 * Secret function 2 - Analyzing the code might help, but solving this clue is
 * easier through the webpage
 * @param {Element} el Target element
 * @param {Function} callback Called function
 * @param {Object} param2 Hyperparameters
 */
function function2(el, callback, {
    b: b = { w: 372, x: 392, y: 1183, z: 1203 }
} = {}) {

    const q = b.w + b.x;
    const r = b.y + b.z;

    const a = (c, d) => {
        return c >= b.w && c <= b.x && d >= b.y && d <= b.z ? q : r;
    }

    function f(g) {
        const r = g.getBoundingClientRect();
        return {
            w: Math.round(r.left + window.scrollX),
            y: Math.round(r.top + window.scrollY)
        };
    }

    function i() {
        const pos = f(el);
        callback(a(pos.w, pos.y), h);
    }

    el.addEventListener('pointermove', i);

    function h() {
        el.removeEventListener('pointermove', i);
    }

    return h;
}
