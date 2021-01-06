import { parseArgs } from "./utils.mjs"


import {
	cmd_display_shape,
	cmd_any_shape,
	cmd_add_color,
	cmd_remove_color,
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
		if (message.guild.name == "shapez.io") {
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
	cmd_remove_color,
	cmd_any_shape,
];



function runCommand(cmd, message, data) {
	if (cmd.type == 'fn') {
		let { s, args } = parseArgs(data.s, cmd.fname);
		if (!args) {
			return 'nop';
		}
		console.log(`running ${cmd.id} with args [${args}]...`)
		data.s = s;
		return cmd.fn(message, data, args)
	}
	if (cmd.type == 'match') {
		let m = data.s.match(cmd.fname)
		if (!m) {
			return 'nop';
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
		if (!v) return 'nop';
		console.log(`running ${cmd.id}...`)
		return cmd.fn(message, data, v)
	}

	throw 'TODO';
}

export function onMessage(message) {
	console.log(message.content)
	let data = { message, s: message.cleanContent, value: null, cmd: null, };
	for (let cmd of cmd_list) {
		let maxRepeat = cmd.repeat || 1;
		for (let i = 0; i < maxRepeat; i++) {
			let value;
			try {
				value = runCommand(cmd, message, data);
			} catch (err) {
				if (message.content.includes('im out')) {
					return;
				}
				let add = '';
				if (message.content.includes('RUNTIME ERROR')) {
					add = `

...
fuck it, im out
`
				}
				message.channel.send(`
__***RUNTIME ERROR***__
\`\`\`
${ err.toString().replace(/``/g, "` `").replace(/</g, "< ")}
${ err.message.replace(/``/g, "` `").replace(/</g, "< ")}
\`\`\`
${add}`)
				return;
			}

			if (value == 'nop') {
				break;
			}
			if (value) {
				data.value = value;
				data.cmd = cmd.id;
				if (value == 'halt') return;
			}
		}
	}
}

console.log(commands);

export default commands;



onMessage({
	content: `
add_color(orange,o)
add_color(pink,i)
add_color(teal,t)
add_color(#7d4406,n)
add_color(#b3ff66,l)
add_color(#66ffb3,s)
add_color(#000000,0)
add_color(#0000FF,1)
add_color(#00FF00,2)
Add_color(#00FFFF,3)
Add_color(#FF0000,4)
Add_color(#FF00FF,5)
Add_color(#FFFF00,6)
Add_color(#FFFFFF,7)
Add_color(#808080,8)
Add_color(#9966CC,a)
`, get cleanContent() { return this.content },
	channel: { send() { } },
})