const superagent = require("superagent");
const ytdlcore = Promise.promisifyAll(require("ytdl-core"));

module.exports = async data => {
	let service = "search";
	for(let key in resolvers) {
		if(resolvers[key].regex && resolvers[key].regex.test(data)) {
			service = key;
			break;
		}
	}

	return resolvers[service](data);
};

const soundcloudClientID = "2t9loNQH90kzJcsFCODdigxfp325aq4z";
module.exports.extract = async song => {
	if(song.service === "youtube") {
		try {
			var info = await ytdlcore.getInfoAsync(`https://youtube.com/watch?v=${song.id}`);
		} catch(err) {
			return `ERROR: \`${err.message}\``;
		}

		let formats = info.formats, format, opus = false;
		for(let i of formats) if(~["249", "250", "251"].indexOf(i.itag)) format = i.url;
		if(format) opus = true;
		if(!format) {
			for(let i of formats) {
				if((i.container === "mp4" && i.audioEncoding) || (i.container === "webm" && i.audioEncoding)) format = i.url;
			}
			if(!format) for(let i of formats) if(i.audioEncoding) format = i.url;
		}
		if(!format) return "NO_VALID_FORMATS";

		song.opus = opus;
		song.stream = format;
		return song;
	} else if(song.service === "soundcloud") {
		song.stream = (await superagent.get(`https://api.soundcloud.com/i1/tracks/${song.id}/` +
			`streams?client_id=${soundcloudClientID}`)).body.http_mp3_128_url || "NO_VALID_FORMATS";
		return song;
	} else {
		return "NO_VALID_FORMATS";
	}
};

const resolvers = {};
// youtube playlist must come first to test the regex, because videos may capture playlists
["twitch", "search", "soundcloud", "youtubePlaylist", "youtube", "https"].forEach(provider => {
	resolvers[provider] = require(`../audioResolvers/${provider}.js`);
});
