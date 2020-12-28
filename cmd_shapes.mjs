import { Client, MessageAttachment } from 'discord.js';
import Canvas from 'canvas';

export * from "./shape.mjs";
import { allColorData, drawShape, drawShapest, customColors, customShapes, registerCustomColor, registerCustomShape, initColors, initShapes } from "./shape.mjs"
import { tryReplace, parseArgs } from "./utils.mjs";
import { shape4svg, shape6svg } from "./shapest_item.mjs";

function display_shape(message, data, args) {
    message.channel.send(imgShapeSingle(args[0] || "Cr", false, false))
}

export const cmd_display_shape = {
    type: 'fn',
    id: 'display_shape',
    fname: 'display_shape',
    fn: display_shape,
    main: true,
}

const rg_shape = /[^\s"]*[^\s"]:[^\s"]*|(?<=")(6[\w-]{12}|4[\w-]{8})(?=")|(([A-Z][a-z]|--){4})|\n/g

export const cmd_any_shape = {
    type: 'always',
    id: 'any_shape',
    main: true,
    fn(message, data) {
        if (data.s.includes('http')) return;

        let as_rows = tryReplace(data, /as_rows/i)
        let no_err = 1 || tryReplace(data, /no_err|!/i)
        let no_key = tryReplace(data, /no_key|!/i)
        let no_name = tryReplace(data, /no_name/i)

        let d = parseArgs(data.s, 'size')
        data.s = d.s
        let size = Math.round(d.args && +d.args[0] || 100)
        if (!(size >= 1)) size = 100;

        d = parseArgs(data.s, 'cols')
        data.s = d.s
        let colCount = Math.round(d.args && +d.args[0] || 10)
        if (!(colCount >= 1)) colCount = 10;

        let allShapesRaw = data.s.match(rg_shape)
        console.log({ s: data.s, allShapesRaw })
        if (!allShapesRaw || !allShapesRaw.find(e => e != '\n')) {
            return
        }
        allShapesRaw = allShapesRaw.map(e => e == '\n' ? e : e.trim()).map(e => e.slice(e.startsWith('"')))
        let row = []
        let grid = [row]
        let prev = '\n'
        let name = ''
        for (let shape of allShapesRaw) {
            if (row.length == colCount) {
				grid.push(row = [])
				prev = '\n'
            }
            if (shape == '\n') {
                if (prev != '\n' && as_rows) {
                    grid.push(row = [])
                }
            } else {
                if (shape.match(/^[a-z]\w*:$/)) {
                    d.s = d.s.replace(name, ' ')
					name = shape.slice(0, -1)
                    no_key = false
                    continue
                }
                row.push(name ? { shape, name, toString() { return this.name; } } : shape)
                name = ''
                d.s = d.s.replace(shape, ' ')
            }
            prev = shape
        }
        if (!row.length) {
            grid.pop()
        }
        console.log({ grid, no_key, no_err, as_rows, no_name })
        if (!grid.length) {
            return;
        }
        let count = Math.max(grid.length, ...grid.map(e => e.length))
        if (count * size > 4000) {
            size = Math.floor(4000 / count)
        }

        message.channel.send(imgShapeGrid(grid, size, { no_key, no_err, as_rows, no_name }))
    }
}





export default [cmd_display_shape];






function imgShapeSingle(key, typeKey, typeErr) {
    let cv = Canvas.createCanvas(100, typeKey ? 120 : 100)
    let ctx = cv.getContext('2d')

    ctx.save()
    let errs = drawShapest(key, cv, ctx, 100);
    ctx.restore()
    ctx.font = 'bold 16px "Courier New"'
    ctx.fillStyle = 'red'
    ctx.textAlign = 'start'
    ctx.textBaseline = 'top'
    if (errs && errs[0] && typeErr) {
        ctx.fillText(errs[0].message.replace(/<[^>]*>/g, ''), 0, 0, 100)
    }
    ctx.fillStyle = 'white'
    ctx.textAlign = 'end'
    ctx.textBaseline = 'bottom'
    if (typeKey)
        ctx.fillText(key, 100, 120, 100)

    console.log(key)
    return new MessageAttachment(cv.toBuffer(), `shape-${key}.png`)
}

function imgShapeGrid(grid, size, { no_key, no_err, as_rows, no_name }) {
    let keyH = no_key ? 0 : Math.ceil(size * 0.2)
    let cv = Canvas.createCanvas(size * Math.max(...grid.map(e => e.length)), (size + keyH) * grid.length)
    let ctx = cv.getContext('2d')

    let i = 0, j = 0;

    for (let row of grid) {
        for (let shape of row) {
            let key = ''
            if (typeof shape == 'string') {
                key = !no_key && shape
            } else {
                key = !no_name && shape.name || !no_key && shape.shape
                shape = shape.shape
            }

            ctx.save()
            ctx.translate(i * size, j * (size + keyH))
            ctx.save()
            let errs = drawShapest(shape, cv, ctx, size);
            ctx.restore()
            ctx.font = `bold ${0.8 * keyH}px "Courier New"`
            if (errs && errs[0] && !no_err) {
                ctx.fillStyle = 'red'
                ctx.textAlign = 'start'
                ctx.textBaseline = 'top'
                ctx.fillText(errs[0].message.replace(/<[^>]*>/g, ''), 0, 0, size)
            }
            if (key) {
                ctx.fillStyle = 'white'
                ctx.textAlign = 'end'
                ctx.textBaseline = 'bottom'
                ctx.fillText(key, size, size + keyH, size - 5)
            }

            ctx.restore()
            i++;
        }
        i = 0;
        j++;
    }
    return new MessageAttachment(cv.toBuffer(), `shape-${grid}.png`)
}



export const cmd_all_shapes = {
    type: 'match',
    id: 'all_shapes',
    fname: /all_shapes/i,
    fn: all_shapes,
    main: true,
}
function all_shapes(message, data, arg) {
    let all_shapes = ` ${Object.values(allShapeData).filter(e => e.code.match(/[A-Z]/)).map(e => e.code).join(': ')}: `
    data.s += all_shapes
}


export const cmd_all_colors = {
    type: 'match',
    id: 'all_colors',
    fname: /all_colors/i,
    fn: all_colors,
    main: true,
}
function all_colors(message, data, arg) {
    let all_colors = ` C${Object.values(allColorData).map(e => e.code == '-' ? '-C-C-C-' : e.code).join(': C')}: `
    data.s += all_colors
}




export const cmd_add_color = {
    type: 'fn',
    id: 'add_color',
    fname: 'add_color',
    fn: add_color,
    main: true,
    repeat: 30,
}
function add_color(message, data, args) {
    if (!args || !args.length) {
        message.channel.send('Invalid add_color form, use as  **add_color(`color` [, `symbol`] [, `name`] )**')
        return
    }
    let hex = args[0]
    let code = args[1] && args[1][0] || hex.split('').filter(e => e.match(/[a-z]/)).find(e => !Object.values(allColorData).find(cl => cl.code == e))
    if (!code) {
        message.channel.send('No free code available, use second argument')
        return
    }
    let id = hex + '/' + code

    let alike = Object.values(allColorData).find(e => e.code == code);
    if (alike) {
        if (!alike.id.includes('/')) {
            message.channel.send(`can't override builtin color \`${alike.id}\``)
            return 'halt'
        }
        delete allColorData[alike.id];
        if (customColors.includes(alike)) {
            customColors.splice(customColors.indexOf(alike), 1)
        };
    }

    registerCustomColor({ id, code, hex });
    initColors();
    message.channel.send(
        `Added new color: { id: \`${id}\`, code: \`${code}\`, hex: \`${hex}\` }`,
        imgShapeSingle(`C${code}`.repeat(4), true, false),
    );
    return
}

export const cmd_remove_color = {
    type: 'fn',
    id: 'remove_color',
    fname: 'remove_color',
    fn: remove_color,
    main: true,
    repeat: 30,
}
function remove_color(message, data, args) {
    if (!args || !args.length) {
        message.channel.send('Invalid remove_color form, use as  **remove_color(`symbol`)**')
        return
    }
    let code = args[0];
    let alike = Object.values(allColorData).find(e => e.code == code);
    if (alike) {
        if (!alike.id.includes('/')) {
            message.channel.send(`can't delete builtin color \`${alike.id}\``)
            return 'halt'
        }
        delete allColorData[alike.id];
        if (customColors.includes(alike)) {
            customColors.splice(customColors.indexOf(alike), 1)
        };
    } else {
        message.channel.send(`coror with code \`${code}\` not found\``);
        return 'halt'
    }
}

// function tryShape(text, message) {
//	 if (!text.includes('try_shape')) return text;
//	 let m = text.match(/try_shape\(\s*`([^`]+)`\s*(?:,|(?=\)))\s*(?:`([^`]+)`\s*(?:,|(?=\)))\s*)?\)/)
//	 if (!m) {
//		 message.channel.send('Invalid try_shape form, use as  *try_shape(`svg_path`, `?color_code`)* , with `code` style for arguments')
//		 return '';
//	 }
//	 text = text.slice(0, m.index) + text.slice(m.index + m[0].length)
//	 console.log(text, ...m)
//	 let svg = m[1];
//	 let color = m[2] || 'u';
//	 let draw = parseFloat(svg) ? svg.replace(parseFloat(svg), '') : svg
//	 if (!new Path2D(draw).ops_.length) {
//		  message.channel.send(`Colud not parse path`)
//		 return '';
//	 }
//	 if (customShapes.length > 20) {
//		 let del = customShapes.splice(6, 1)[0]
//		 delete allShapeData[del.id]
//	 }

//	 let code = 'A';
//	 while (Object.values(allShapeData).find(e=>e.code==code)) {
//		 code = String.fromCharCode(code.charCodeAt(0) + 1)
//	 }

//	 let Z = Object.values(allShapeData).find(e=>e.code==code);
//	 if (Z) {
//		 if (customShapes.includes(Z)) {
//			 customShapes.splice(customShapes.indexOf(Z), 1)
//		 }
//		 delete allShapeData[Z.id];
//	 }
//	 registerCustomShape({id:code, code:code, draw: svg, spawnColor: Object.values(allColorData).find(e=>e.code==color)?.id})
//	 initShapes();

//	 message.channel.send(
//		 `Shape: { draw: \`${svg}\` }`,
//		 attachShapeSingle(`${code}${color}`.repeat(4), true),
//	 );

//	 return text;
// }

export const cmd_add_shape = {
    type: 'fn',
    id: 'add_shape',
    fname: 'add_shape',
    fn: add_shape,
    main: true,
}
function add_shape(message, data, args) { }
// function addCustomShape(text, message) {
//	 if (!text.includes('add_shape')) return text;
//	 return text;
// //	 if (!message.content.includes('add_shape')) return false;

// //	 let m = message.console.match(/add_shape\(`()`\)/)
// }


export const cmd_clear_shapes = {
    type: 'fn',
    id: 'clear_shapes',
    fname: 'clear_shapes',
    fn: clear_shapes,
    main: true,
}
function clear_shapes(message, data, args) { }
// function clearShapes(text, message) {
// 	if (!text.includes('clear_shapes')) return text;
// 	text = text.replace(/clear_shapes/, '')
// 	customShapes.splice(6, 99);
// 	message.channel.send('Custom shapes were cleared');
// 	return text;
// }
