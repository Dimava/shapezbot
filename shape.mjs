import { enumSubShape, enumShortcodeToSubShape, allShapeData, noSuchShape } from "./shapes/shapes.mjs"
import { enumShortcodeToColor, enumColorToShortcode, enumColors, enumColorsToHexCode, allColorData } from "./shapes/colors.mjs"


export { allShapeData, initShapes } from "./shapes/shapes.mjs"
export { allColorData, initColors } from "./shapes/colors.mjs"
export { registerCustomColor, customColors } from "./shapes/custom/colors.mjs"
export { registerCustomShape, customShapes } from "./shapes/custom/shapes.mjs"

const themes = {
    dark: {
        "items": {
            "outline": "#111418",
            "outlineWidth": 0.75,
            "circleBackground": "rgba(20, 30, 40, 0.3)"
        }
    },
    light: {
        "items": {
            "outline": "#55575a",
            "outlineWidth": 0.75,
            "circleBackground": "rgba(40, 50, 65, 0.1)"
        }
    },
}

export let THEME = themes.light;


const arrayQuadrantIndexToOffset = [
    {x: 1, y: -1}, // tr
    {x: 1, y: 1}, // br
    {x: -1, y: 1}, // bl
    {x: -1, y: -1}, // tl
];


function beginCircle(ctx, x, y, r) {
    if (r < 0.05) {
        ctx.beginPath();
        ctx.rect(x, y, 1, 1);
        return;
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2.0 * Math.PI);
};

/////////////////////////////////////////////////////

function radians(degrees) {
    return (degrees * Math.PI) / 180.0;
}

/**
 * Generates the definition from the given short key
 */
function fromShortKey(key) {
    const sourceLayers = key.replace(/\s/g, '').split(":").filter(Boolean).map(parseShortKey);

    if (checkImpossible(sourceLayers.join(':'))) {
        showError(new Error(checkImpossible(sourceLayers.join(':'))));
    }

    if (sourceLayers.length > 4) {
        showError(new Error("Only 4 layers allowed"));
    }

    for (let i = 0; i < sourceLayers.length; ++i) {
        if (checkUnknown(sourceLayers[i])) {
            showError(new Error(checkUnknown(sourceLayers[i])));
        }
    }

    return formLayers(sourceLayers);

}

function formLayers(keys) {
    let layers = [];
    for (let i = 0; i < keys.length; ++i) {
        let text = keys[i];

        const quads = [null, null, null, null];
        for (let quad = 0; quad < 4; ++quad) {
            const shapeText = text[quad * 2 + 0];
            const subShape = enumShortcodeToSubShape[shapeText] || shapeText;
            const color = enumShortcodeToColor[text[quad * 2 + 1]] || enumColors.uncolored;
            quads[quad] = {
                subShape,
                color,
            };
        }
        layers.push(quads);
    }
    return layers;
}

function textToHTML(text) {
    return text;
}



/**
 * Parse short key into a full one
 * @param {string} key
 * @returns {string}
 */
function parseShortKey(key, layer) {
    const emptyLayer = '--'.repeat(4);
    const clr = (A, c) => A == '-' ? '-' : !c || c == '-' ? enumColorToShortcode[allShapeData[enumShortcodeToSubShape[A]]?.spawnColor] || 'u' : c;

    const escKey = `<code>${textToHTML(key)}</code>`;

    if (!key) {
        return emptyLayer;
    }

    if (key.match(/[^A-Za-z:\-]/)) {
        let match = key.match(/[^A-Za-z:\-]/);
        showError(new Error(`key ${escKey} has invalid symbol: <code>${textToHTML(match[0])}</code>`));
    }

    if (key.length == 8) {
        if (!key.match(/^([A-Z\-][a-z\-]){4}$/)) {
            showError(new Error(`key ${escKey} is invalid`));
        }
        return key;
    }

    if (key.length == 1) {
        if (key == '-') {
            return emptyLayer;
        }
        // A -> AuAuAuAu
        if (key.match(/^[A-Z]$/)) {
            return `${key}${clr(key)}`.repeat(4);
        }
        showError(new Error(`key ${escKey} is invalid`));
    }

    if (key.length == 2) {
        // AB -> AuBuAuBu
        if (key.match(/^[A-Z\-]{2}$/)) {
            return `${key[0]}${clr(key[0])}${key[1]}${clr(key[1])}`.repeat(2);
        }
        // Ac -> AcAcAcAc
        if (key.match(/^[A-Z\-][a-z\-]$/)) {
            return `${key[0]}${clr(key[0], key[1])}`.repeat(4);
        }
        showError(new Error(`key ${escKey} is invalid`));
    }

    if (key.length == 4) {
        // ABCD -> AuBuCuDu
        if (key.match(/^[A-Z\-]{4}$/)) {
            return `${key[0]}${clr(key[0])}${key[1]}${clr(key[1])}${key[2]}${clr(key[2])}${key[3]}${clr(key[3])}`;
        }
        // AcBd -> AcBdAcBd
        if (key.match(/^([A-Z\-][a-z\-]){2}$/)) {
            return `${key[0]}${clr(key[0], key[1])}${key[2]}${clr(key[2], key[3])}`.repeat(2);
        }
        // 1010 -> 1r0-1r0-
        if (key.match(/^(\d){4}$/)) {
            let nsp = 'SCSCW'.repeat(20)
            let ncl = '--'+'rgbcmyw'.repeat(20)
            let lcl = 'rgbwm'+'rgbcmyw'.repeat(20)
            return key.split('').map(e=>  e=='0'?'--':e=='1'?nsp[layer]+lcl[layer]:nsp[layer]+ncl[e]  ).join('');
        }
        showError(new Error(`key ${escKey} is invalid`));
    }

    showError(new Error(`key ${escKey} has invalid length`));
    return key;
}

/**
 * Check if the shape is impossible and why
 * @param {string} key
 * @returns {string | void}
 */
function checkImpossible(key) {
    let layers = key.split(':');
    const emptyLayer = '--'.repeat(4);
    while (layers[layers.length - 1] == emptyLayer) {
        layers.pop();
    }
    if (layers.length > 4) {
        return `Impossible to stack ${layers.length} layers, max is 4`;
    }
    if (layers.includes(emptyLayer)) {
        return `Impossible to create empty layer #${layers.indexOf(emptyLayer)}`;
    }
    let forms = layers.map(l => {
        return 0b1000 * (l[0] != '-') + 0b0100 * (l[2] != '-') + 0b0010 * (l[4] != '-') + 0b0001 * (l[6] != '-');
    });
    // first, pop layers that can be layered:
    while (forms.length >= 2) {
        if ((forms[forms.length - 1] & forms[forms.length - 2])) {
            forms.pop();
        } else {
            break;
        }
    }
    if (forms.length < 2) {
        return;
    }

    function rotateForm(form) {
        return (form >> 1) + 0b1000 * (form & 0b0001);
    }
    let highestReached = 0;
    for (let j = 0; j < 4; j++) {
        console.log(j, forms.map(e => e.toString(2)));
        // second, check if half has no empty layers and other half is dropped
        let hasNoEmpty = true;
        let l1, l2;
        for (l1 = 1; l1 < forms.length; l1++) {
            if ((forms[l1] & 0b0011) && !(forms[l1 - 1] & 0b0011)) {
                hasNoEmpty = false;
                break;
            }
        }
        let isDropped = true;
        for (l2 = 1; l2 < forms.length; l2++) {
            if ((forms[l2] & 0b1100) & ~(forms[l2 - 1] & 0b1100)) {
                isDropped = false;
                break;
            }
        }
        if (hasNoEmpty && isDropped) {
            console.log('can split in rotation', j);
            break;
        }
        highestReached = Math.max(highestReached, Math.min(l1, l2) - 1);
        forms = forms.map(rotateForm);
        if (j == 3) {
            return `Impossible to create layer ${highestReached}`;
        }
    }
}

/**
 * Check if the key contains uncnown colors and shapes
 * @param {string} key
 * @returns {string | void}
 */
function checkUnknown(key) {
    let badShapes = new Set();
    let badColors = new Set();
    for (let c of key) {
        if (c.match(/[A-Z]/)) {
            if (!enumShortcodeToSubShape[c]) {
                badShapes.add(c);
            }
        }
        if (c.match(/[a-z]/)) {
            if (!enumShortcodeToColor[c]) {
                badColors.add(c);
            }
        }
    }
    const badShapeStr = `Unkown shape${badShapes.size > 1 ? 's' : ''}: <code>${Array.from(badShapes).join(' ')}</code>`;
    const badColorStr = `Unkown color${badShapes.size > 1 ? 's' : ''}: <code>${Array.from(badColors).join(' ')}</code>`;

    if (badShapes.size && badColors.size) {
        return badShapeStr + '<br>' + badColorStr;
    }
    if (badShapes.size) {
        return badShapeStr;
    }
    if (badColors.size) {
        return badColorStr;
    }
}

function getLayerScale(layerIndex) {
    return 0.9 * Math.pow(0.9 - 0.22, layerIndex);
    return Math.max(0.1, 0.9 - layerIndex * 0.22);
}

function getLayerLineWidth(layerIndex) {
    return Math.pow(0.8, layerIndex);
}

function internalGenerateShapeBuffer(layers, canvas, context, w, h, dpi=1) {
	context.save();
	context.translate((w * dpi) / 2, (h * dpi) / 2);
	context.scale((dpi * w) / 23, (dpi * h) / 23);

	context.fillStyle = "#e9ecf7";

	const quadrantSize = 10;
	const quadrantHalfSize = quadrantSize / 2;

	context.fillStyle = "rgba(40, 50, 65, 0.1)";
	beginCircle(context, 0, 0, quadrantSize * 1.15);
	context.fill();

	for (let layerIndex = 0; layerIndex < layers.length; ++layerIndex) {
		
        const quadrants = layers[layerIndex];

        let quads =
            quadrants.map((e, i) => ({e, i}))
            .filter(e=>e.e)
            .map(e=>({...e.e, quadrantIndex: e.i}))
            .sort((a, b) => (allShapeData[a.subShape] || noSuchShape(a.subShape)).layer - (allShapeData[b.subShape] || noSuchShape(b.subShape)).layer);


		const layerScale = Math.max(0.1, 0.9 - layerIndex * 0.22);

		for (let quad of quads) {
			if (!quad) {
				continue;
			}
			const {subShape, color, quadrantIndex} = quad;
			if (subShape == '-') {
			    continue;
			}

			const quadrantPos = arrayQuadrantIndexToOffset[quadrantIndex];
			const centerQuadrantX = quadrantPos.x * quadrantHalfSize;
			const centerQuadrantY = quadrantPos.y * quadrantHalfSize;

			const rotation = radians(quadrantIndex * 90);

			context.save();
			context.translate(centerQuadrantX, centerQuadrantY);
			context.rotate(rotation);

			context.fillStyle = enumColorsToHexCode[color];
			context.strokeStyle = THEME.items.outline;
			context.lineWidth = THEME.items.outlineWidth * Math.pow(0.8, layerIndex);

			const insetPadding = 0.0;

			const dims = quadrantSize * layerScale;
			const innerDims = insetPadding - quadrantHalfSize;
			let began = null;

			function begin(args = {}) {
				context.save();
				context.translate(innerDims, -innerDims);
				context.scale(dims, -dims);
				context.lineWidth = THEME.items.outlineWidth * Math.pow(0.8, layerIndex) / dims / (args.size || 1);
				if (args.size) {
					context.scale(args.size, args.size);
				}
				if (args.path) {
					context.beginPath();
				}
				if (args.zero) {
					context.moveTo(0, 0);
				}
				began = args;
// 				console.log({w:context.lineWidth})
			}
			function end() {
				if (!began) {
					return;
				}
				if (began.path) {
					context.closePath();
				}
				context.restore();
			}

			let shape = allShapeData[subShape] || noSuchShape(subShape);
			if (shape.draw) {
				if (typeof shape.draw == 'string') {
					let draw = shape.draw;
					let scale = parseFloat(draw);
					if (scale) {
						draw = draw.replace(scale, '')
						scale = 1 / scale;
					} else {
						scale = 1;
					}
					begin({size:scale});
					let p = new Path2D(draw);
					context.fill(p);
					context.stroke(p);
					end();
				} else {
					shape.draw({
						dims,
						innerDims,
						layer: layerIndex,
						quad: quadrantIndex,
						context,
						color,
						begin,
					});
					end();
					context.fill();
					context.stroke();
				}
			}


			context.restore();
		}
	}
	context.restore();
}

/////////////////////////////////////////////////////

let errs = [];
function showError(msg) {
    if (!msg) {
        return errs = [];
    }
    errs.push(msg);
    return errs;
}

export function drawShape(key, canvas, context, size) {
    showError(null);
    let parsed = null;
    try {
        parsed = fromShortKey(key);
    } catch (err) {
        console.error(err)
        return showError(err);
    }
    internalGenerateShapeBuffer(parsed, canvas, context, size, size, 1);

    return errs.length ? errs : undefined;
}

import { ShapestItem } from "./shapest_item.mjs"


export function drawShapest(key, canvas, context, size) {
    if (!ShapestItem.isValidShortKey(key)) return drawShape(key, canvas, context, size);

    new ShapestItem(key).drawFullSizeOnCanvas(context, size);

    return undefined;
}