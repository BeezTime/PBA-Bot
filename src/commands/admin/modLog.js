module.exports = {
	process: async message => {
		if(!message.args[0]) {
			return `__**Valid mod log settings**__:\n${Object.keys(settings).join(", ")}` +
				`\n\nRun \`modlog <setting>\` to get more info on a specific setting`;
		} else if(!settings[message.args[0]]) {
			return `Invalid mog log setting!`;
		} else if(!message.args[1]) {
			let setting = settings[message.args[0]];
			setting.name = message.args[0];

			const guild = message.channel.guild;
			let currentValue = (
				await r.table("settings").filter({ name: `modLog.${setting.name}`, guildID: guild.id }).run()
			)[0];

			return `__**Setting**__: ${message.args[0]}\n` +
				`Description: ${setting.description}\n` +
				`Accepted Values: \`${setting.label || `<${setting.arg}>`}|reset\`\n` +
				`Current Value: \`${currentValue ? currentValue.value : "no value"}\``;
		} else {
			let setting = settings[message.args[0]], reset = false;
			setting.name = message.args[0];

			if(message.args[1] === "reset") {
				reset = true;
			} else {
				try {
					var resolvedInput = bot.utils.resolver[setting.arg](message, message.args[1]);
				} catch(err) {
					return err.message;
				}

				if(setting.arg === "text" && setting.label && !~setting.label.split("|").indexOf(message.args[1])) {
					return `Invalid option! Options are: ${setting.label.split("|").join(", ")}`;
				}
			}

			const guild = message.channel.guild;
			let currentValue = (
				await r.table("settings").filter({ name: `modLog.${setting.name}`, guildID: guild.id }).run()
			)[0];

			if(!currentValue && reset) {
				return `I can't reset \`${setting.name}\` because it is not yet set`;
			} else if(reset) {
				await r.table("settings").delete(currentValue.id);
				return `Reset setting \`${setting.name}\``;
			}

			let insertData = {
				name: `modLog.${setting.name}`,
				guildID: guild.id
			};

			if(setting.name === "channel") {
				insertData.value = resolvedInput.id;
				if(currentValue) await r.table("settings").get(currentValue.id).update({ value: insertData.value });
				else await r.table("settings").insert(insertData);
				return `Set \`${setting.name}\` to ${resolvedInput.mention}`;
			} else if(setting.name === "style") {
				insertData.value = resolvedInput;
				if(currentValue) await r.table("settings").get(currentValue.id).update({ value: insertData.value });
				else await r.table("settings").insert(insertData);
				return `Set \`${setting.name}\` to ${resolvedInput}`;
			} else if(setting.name === "track") {
				let addedRole = true;
				if(!currentValue) {
					insertData.value = [resolvedInput.id];
					await r.table("settings").insert(insertData);
				} else {
					let alreadyTracked = currentValue.value.indexOf(resolvedInput.id);
					if(~alreadyTracked) {
						currentValue.value.splice(alreadyTracked, 1);
						addedRole = false;
					} else {
						currentValue.value.push(resolvedInput.id);
					}

					await r.table("settings").get(currentValue.id).update({ value: currentValue.value });
				}

				return addedRole ?
					`Added \`${resolvedInput.name}\` to tracked roles` :
					`Removed \`${resolvedInput.name}\` from tracked roles`;
			} else {
				return "This setting is not yet supported";
			}
		}
	},
	guildOnly: true,
	description: "Edit various mod log options",
	args: [{
		type: "text",
		label: "option",
		optional: true
	}, {
		type: "text",
		label: "value",
		optional: true
	}]
};

let settings = {
	channel: {
		arg: "textChannel",
		description: "Set the mod log channel to log moderator actions"
	},
	style: {
		arg: "text",
		description: "Change the message style (default text)",
		label: "text|embed"
	},
	track: {
		arg: "role",
		description: "Toggle a roles to make mod log entries for (on role add/remove)"
	}
};