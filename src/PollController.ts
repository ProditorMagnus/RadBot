import { Channel, DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { Config } from "./Config";
import { Utils } from "./Utils";

export class PollController {
    private config: Config;

    private static defEmojiList = [
        '\u0030\u20E3',
        '\u0031\u20E3',
        '\u0032\u20E3',
        '\u0033\u20E3',
        '\u0034\u20E3',
        '\u0035\u20E3',
        '\u0036\u20E3',
        '\u0037\u20E3',
        '\u0038\u20E3',
        '\u0039\u20E3',
        '\uD83D\uDD1F'
    ];

    constructor(config: Config) {
        this.config = config;
    }

    // Example: poll 3 pick your number 1-3
    public async doPoll(channel: TextChannel | DMChannel | NewsChannel, message: String) {
        const parts = message.split(" ");
        const optionCount = parseInt(parts[1]);
        const pollMessage = parts.slice(2).join(" ");
        const poll = await channel.send(pollMessage);
        for (let i = 0; i < optionCount; i++) {
            const emote = PollController.defEmojiList[i];
            poll.react(emote);
        }
    }
}
