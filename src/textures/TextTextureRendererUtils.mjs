/**
 * Returns CSS font setting string for use in canvas context.
 *
 * @private
 * @param {string | string[]} fontFace
 * @param {string} fontStyle
 * @param {number} fontSize
 * @param {number} precision
 * @param {string} defaultFontFace
 * @returns {string}
 */
export function getFontSetting(fontFace, fontStyle, fontSize, precision, defaultFontFace) {
    let ff = fontFace;

    if (!Array.isArray(ff)) {
        ff = [ff];
    }

    let ffs = [];
    for (let i = 0, n = ff.length; i < n; i++) {
        let curFf = ff[i];
        // Replace the default font face `null` with the actual default font face set
        // on the stage.
        if (curFf === null) {
            curFf = defaultFontFace;
        }
        if (curFf === "serif" || curFf === "sans-serif") {
            ffs.push(curFf);
        } else {
            ffs.push(`"${curFf}"`);
        }
    }

    return `${fontStyle} ${fontSize * precision}px ${ffs.join(",")}`
}

/**
 * Returns true if the given character is a zero-width space.
 *
 * @param {string} space
 * @returns {boolean}
 */
export function isZeroWidthSpace(space) {
    return space === '' || space === '\u200B';
}

/**
 * Returns true if the given character is a zero-width space or a regular space.
 *
 * @param {string} space
 * @returns {boolean}
 */
export function isSpace(space) {
    return isZeroWidthSpace(space) || space === ' ';
}

/**
 * Converts a string into an array of tokens and the words between them.
 *
 * @param {RegExp} tokenRegex
 * @param {string} text
 * @returns {string[]}
 */
export function tokenizeString(tokenRegex, text) {
    const delimeters = text.match(tokenRegex) || [];
    const words = text.split(tokenRegex) || [];

    let final = [];
    for (let i = 0; i < words.length; i++) {
        final.push(words[i], delimeters[i])
    }
    final.pop()
    return final.filter((word) => word != '');
}

/**
 * Measure the width of a string accounting for letter spacing.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {string} word
 * @param {number} space
 * @returns
 */
export function measureText(context, word, space = 0) {
    if (!space) {
        return context.measureText(word).width;
    }
    return word.split('').reduce((acc, char) => {
        // Zero-width spaces should not include letter spacing.
        // And since we know the width of a zero-width space is 0, we can skip
        // measuring it.
        if (isZeroWidthSpace(char)) {
            return acc;
        }
        return acc + context.measureText(char).width + space;
    }, 0);
}

/**
 * Applies newlines to a string to have it optimally fit into the horizontal
 * bounds set by the Text object's wordWrapWidth property.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {string} text
 * @param {number} wordWrapWidth
 * @param {number} letterSpacing
 * @param {number} indent
 * @returns
 */
export function wrapText(context, text, wordWrapWidth, letterSpacing, indent) {
    // Greedy wrapping algorithm that will wrap words as the line grows longer.
    // than its horizontal bounds.
    const spaceRegex = / |\u200B/g;
    let lines = text.split(/\r?\n/g);
    let allLines = [];
    let realNewlines = [];
    for (let i = 0; i < lines.length; i++) {
        let resultLines = [];
        let result = '';
        let spaceLeft = wordWrapWidth - indent;
        let words = lines[i].split(spaceRegex);
        let spaces = lines[i].match(spaceRegex) || [];
        for (let j = 0; j < words.length; j++) {
            const space = spaces[j - 1] || '';
            const word = words[j];
            const wordWidth = measureText(context, word, letterSpacing);
            const wordWidthWithSpace = wordWidth + measureText(context, space, letterSpacing);
            if (j === 0 || wordWidthWithSpace > spaceLeft) {
                // Skip printing the newline if it's the first word of the line that is.
                // greater than the word wrap width.
                if (j > 0) {
                    resultLines.push(result);
                    result = '';
                }
                result += word;
                spaceLeft = wordWrapWidth - wordWidth - (j === 0 ? indent : 0);
            }
            else {
                spaceLeft -= wordWidthWithSpace;
                result += space + word;
            }
        }

        resultLines.push(result);
        result = '';

        allLines = allLines.concat(resultLines);

        if (i < lines.length - 1) {
            realNewlines.push(allLines.length);
        }
    }

    return {l: allLines, n: realNewlines};
}
