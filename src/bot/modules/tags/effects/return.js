module.exports = {
	name: "Return message",
	description: "Return the final message to be sent",
	examples: [`return "hello!"`],
	patterns: [`return [message] [content] %any%`],
	run: async (options, text) => {
		try {
			await options.__message.channel.createMessage(text.toString());
			options.end = true;
		} catch(err) {
			throw new options.TagError("Error sending content: too long, or no content?");
		}
	}
};
