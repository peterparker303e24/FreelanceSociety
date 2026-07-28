// Begin once the dom has loaded
document.addEventListener('DOMContentLoaded', () => {

    // Images and element related to the webpage
    const image1 = document.querySelector('.image-1');
    const element1 = document.querySelector('.element-1');
    const element2 = document.querySelector('.element-2');
    const element3 = document.querySelector('.element-3');
    const element4 = document.querySelector('.element-4');
    const element5 = document.querySelector('.element-5');
    const textbox1 = document.querySelector('.textbox-1');
    const TEXTBOX_TEXT =
        "You and I are not so different, Batman. Two sides of the same coin. I "
        + "chose chaos and you chose rules. Both free to choose, when our face "
        + "is concealed from the light or burned from it.";
    textbox1.querySelector('i').textContent = TEXTBOX_TEXT;

    // Currently selected draggable image
    let current = null;

    // Start dragging image1 when selected
    image1.addEventListener('pointerdown', e => {
        e.preventDefault();
        current = image1;
        image1.classList.add("spotlight");
        element1.style.display = 'none';
        element2.style.display = 'none';
        element3.style.display = 'none';
        element4.style.display = 'none';
        element5.style.display = 'none';
        current.setPointerCapture(e.pointerId);
        const rect = current.getBoundingClientRect();
        current.style.userSelect = 'none';
    });

    // Stop dragging image1 when deselected
    image1.addEventListener('pointerup', e => {
        if (!current) return;
        current.releasePointerCapture(e.pointerId);
        current.style.userSelect = '';
        current = null;
    });
    image1.addEventListener('pointercancel', () => {
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
        const viewportWidthX = (x / window.innerWidth) * 100;
        const y = Math.round(e.pageY - halfH) + document.body.scrollTop;
        const viewportWidthY = (y / window.innerWidth) * 100;
        current.style.left = viewportWidthX + 'vw';
        current.style.top = viewportWidthY + 'vw';

        // When the clue is completed as determined by function1, then reveal
        // the text and configurations, else hide the text
        function1(image1, (value, reset) => {
            const {
                x,
                y,
                width,
                text,
                isCorrect
            } = createOffsettedRandomDeterministic(
                value.toString(),
                95087617,
                {
                    x: 4285854,
                    y: 6822747,
                    width: 6305029,
                    bitString:
                        '10010100111110001110110010110000' + 
                        '01101111000000001001010011011100' + 
                        '11101110010001010000101111110110' + 
                        '00101100101101101110101100110100' + 
                        '10010110000101011100110101111100' + 
                        '11011000100001101011111100100111' + 
                        '10111010000101011100111001101101' + 
                        '11100100001110100100000010100001' + 
                        '00000010001011011010001000010000' + 
                        '01011001100011001111011101001100' + 
                        '00111001000100111101010100110011' + 
                        '10110101010011101100011001101111' + 
                        '00010111101011001010001111101110' + 
                        '10011101001100010110111110010011' + 
                        '10100110100110101011000001010001' + 
                        '00111101110000100001000100101001' + 
                        '01111101111000010011100011101011' + 
                        '11011010101000010110001100010000' + 
                        '10111111110111110001111000100110' + 
                        '11111111011101011010011110001000' + 
                        '01100001001100011101100110000110' + 
                        '01110001001011001011000100100101' + 
                        '10011011001111111100000100110011' + 
                        '11001100011011111110100111011100' + 
                        '00011000000000111100101010100111' + 
                        '11001011101100011111100100111010' + 
                        '00010000110101000010100001110000' + 
                        '10101001010011001000011100100111' + 
                        '01000010110011011111110101010111' + 
                        '01111101011011111011101111010101' + 
                        '11110111001101101010101010101010' + 
                        '00111011011000011110001110101101' + 
                        '01001010000101111101011011000100' + 
                        '00011101111000000001010010000000' + 
                        '01101101011011111000100010011000' + 
                        '00101011110101000100110100110111' + 
                        '10101000011010100001010001001110' + 
                        '11100110000111111011010101101011' + 
                        '00110010000001110001110100110111' + 
                        '10101100001001110011110101100101' + 
                        '01001110110011100100101000010010' + 
                        '01010010110111101011110101001010' + 
                        '01000111111111101000101001101001' + 
                        '01011000001110000111001010110100' + 
                        '11110011011010101010011101100100' + 
                        '10000001000011000001001010110111' + 
                        '00100101001001000100001010011001' + 
                        '00101100111000100100100100101100' + 
                        '10001110001111010100101010001110' + 
                        '01100001100011001110000000011111' + 
                        '10001101100000100010110110010010' + 
                        '11101101010001111101010010111011' + 
                        '01001110000011011100011110110000' + 
                        '00011111011000011111000011010100'
                }
            );
            if (isCorrect) {
                reset();
                textbox1.style.left = x + 'vw'
                textbox1.style.top = y + 'vw'
                textbox1.style.width = width + 'vw';
                textbox1.querySelector('i').textContent = text;
            } else {
                textbox1.style.left = '3vw'
                textbox1.style.top = '60vw'
                textbox1.style.width = '18vw';
                textbox1.querySelector('i').textContent = TEXTBOX_TEXT;
            }
        });
    }, { passive: false });
});

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
        bitString: offset.bitString || '00000000'
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

    // Generate a random bitstring with the given number of bytes
    function randBitString(numberOfBytes) {
        let bitString = '';
        for (let i = 0; i < Math.floor((numberOfBytes - 1) / 4) + 1; i++) {
            bitString += rand32()
                .toString(2)
                .padStart(32, '0');
        }
        switch (numberOfBytes % 4) {
            case 0:
                return bitString;
            case 1:
                return bitString.substring(24);
            case 2:
                return bitString.substring(16);
            case 3:
                return bitString.substring(8);
        }
    }

    // Deterministically generate random rect configurations
    const base = {
        x: randLarge(),
        y: randLarge(),
        width: randLarge(),
        height: randLarge(),
        bitString: randBitString(o.bitString.length / 8)
    };

    // If the hash result of the key is correct, then use the offset to
    // calculate the actual rect configurations and text in relation to the
    // predetermined configurations
    if (hashResult === expectedHashResult) {
        return {
            x: base.x - o.x,
            y: base.y - o.y,
            width: base.width - o.width,
            height: base.height - o.height,
            text: binaryToText(xorBitStrings(base.bitString, o.bitString)),
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
 * Convert a binary string to a text string
 * @param {String} s Binary string with length of multiple 8
 * @returns {String} Text string of the given bytes
 */
function binaryToText(s) {
    return s.match(/.{1,8}/g)
        .map(byte => String.fromCharCode(parseInt(byte, 2)))
        .join('');
}

/**
 * Convert a string of bits to an array of integers
 * @param {String} bitString String of bits
 * @returns {Uint8Array} Array of integers of the given bitstring
 */
function bitsToBytes(bitString) {
    const length = bitString.length / 8;
    const byteArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        const start = i * 8;
        const byteString = bitString.slice(start, start + 8);
        byteArray[i] = parseInt(byteString, 2);
    }
    return byteArray;
}

/**
 * Take the XOR of given integer array elements
 * @param {Int8Array} a Integer array
 * @param {Int8Array} b Integer array
 * @returns {Int8Array} Array of XORed integers
 */
function xorBytes(a, b) {
    const length = Math.max(a.length, b.length);
    const byteArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        byteArray[i] = (a[i] || 0) ^ (b[i] || 0)
    };
    return byteArray;
}

/**
 * Convert array of integers to a string of bits
 * @param {Int8Array} bytes Array of integers
 * @returns {String} Bit string
 */
function bytesToBits(bytes) {
  let bitString = '';
  for (let i = 0; i < bytes.length; i++) {
    bitString += bytes[i].toString(2).padStart(8, '0');
  }
  return bitString;
}

/**
 * XOR two strings of bits
 * @param {String} bs1 Bit string
 * @param {String} bs2 Bit string
 * @returns {String} XORed bit string
 */
function xorBitStrings(bs1, bs2) {
  const a = bitsToBytes(bs1);
  const b = bitsToBytes(bs2);
  return bytesToBits(xorBytes(a, b));
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
    b: b = { w: -235, x: -155, y: -175, z: -95 }
} = {}) {

    const q = b.w + b.x;
    const r = b.y + b.z;

    const a = (c, d) => {
        return c >= b.w && c <= b.x && d >= b.y && d <= b.z ? q : r;
    }

    function f(g) {
        const r = g.getBoundingClientRect();
        return {
            w: Math.round(r.left * 100 / window.innerWidth),
            y: Math.round(
                (r.top + document.body.scrollTop) * 100 / window.innerWidth
            )
        };
    }

    function i() {
        const k = f(el);
        callback(a(k.w, k.y), h);
    }

    el.addEventListener('pointermove', i);

    function h() {
        el.removeEventListener('pointermove', i);
    }

    return h;
}
