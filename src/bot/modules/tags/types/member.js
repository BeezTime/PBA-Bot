module.exports = {
	name: "Member",
	description: "A Discord Member",
	examples: [`set {_member} to member from event-message`],
	run: (options, member) => ({
		type: "member",
		value: member
	})
};
