import { parseArgs } from "./utils.mjs"


import {
    cmd_display_shape,
    cmd_any_shape,
    cmd_add_color,
    cmd_all_colors,
    cmd_all_shapes,
} from "./cmd_shapes.mjs";



let cmd_halt = {
	id: 'shapebot',
	type: 'always',
	fn(message, data) {
		if (
			!message.content.match(/shapebot|!s\b/i) &&
			message.guild.id != '728969392569712670' &&
			message.channel.name != 'shapebot'
		) {
			return 'halt';
		}
		if (message.author.bot) {
			return 'halt';
		}
	},
}

let cmd_help = {
	id: 'help',
	type: 'if',
	condition(s) {
		return s.match(/shapebot/i) && s.match(/help/i)
	},
	fn(message) {
		message.channel.send(`
			**# Help:**
			   - \`ShApCoDe\` - display shape with code
			   - \`ShOr: T: CODE:\` - display multiple shapes using shorter codes
			   - \`all_shapes\` - display all shapes
			   - \`all_colors\` - display all colors
			   - \`add_color( cssColor [, code] )\` - add color
			   - \`try_shape( svgPath )\` - add shape
			`.trim().replace(/\n\t*/g, '\n'))
	}

}


export let commands = {};




export let cmd_list = [
	cmd_halt,
    cmd_all_colors,
    cmd_all_shapes,
	cmd_display_shape,
	cmd_help,
	cmd_add_color,
	cmd_any_shape,
];



function runCommand(cmd, message, data) {
	if (cmd.type == 'fn') {
		let { s, args } = parseArgs(data.s, cmd.fname);
		if (!args) {
			return;
		}
		console.log(`running ${cmd.id} with args [${args}]...`)
		data.s = s;
		return cmd.fn(message, data, args)
	}
	if (cmd.type == 'match') {
		let m = data.s.match(cmd.fname)
		if (!m) {
			return;
		}
		console.log(`running ${cmd.id}...`)
		data.s = data.s.replace(cmd.fname, '')
		return cmd.fn(message, data, m[0])
	}
	if (cmd.type == 'always') {
		console.log(`running ${cmd.id}...`)
		return cmd.fn(message, data)
	}
	if (cmd.type == 'if') {
		let v = cmd.condition(data.s)
		if (!v) return;
		console.log(`running ${cmd.id}...`)
		return cmd.fn(message, data, v)
	}

	throw 'TODO';
}

export function onMessage(message) {
	console.log(message.content)
	let data = { message, s: message.cleanContent, value: null, cmd: null, };
	for (let cmd of cmd_list) {
		let value = runCommand(cmd, message, data);
		if (value) {
			data.value = value;
			data.cmd = cmd.id;
			if (value == 'halt') return;
		}
	}
}

console.log(commands);

export default commands;
