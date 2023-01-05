import { DMChannel, NewsChannel, TextChannel } from "discord.js";

export abstract class Utils {
    static readonly secondMs = 1000;
    static readonly minuteMs = Utils.secondMs * 60;
    static readonly hourMs = Utils.minuteMs * 60;
    static readonly dayMs = Utils.hourMs * 24;

    static displayDate(ms: number | Date) {
        return new Date(ms).toString();
    }

    static formatDuration(ms: number) {
        let minutes = Math.floor((ms / Utils.minuteMs) % 60);
        let hours = Math.floor((ms / Utils.hourMs) % 24);
        let days = Math.floor(ms / Utils.dayMs);

        if (hours > 0 || days > 0) {
            if (days > 0) {
                return days + "d " + hours + "h " + minutes + "m";
            } else {
                return hours + "h " + minutes + "m";
            }
        } else {
            let seconds = Math.floor((ms / Utils.secondMs) % 60);
            return minutes + "m " + seconds + "s";
        }
    }

    static formatDiscordTimestamp(ms: number) {
        return "<t:" + Math.floor(ms / 1000) + ":R>";
    }

    static sendLongString(channel: TextChannel | DMChannel | NewsChannel, s: string) {
        for (let i = 0; i < s.length; i += 1999) {
            channel.send(s.substring(i, i + 1999));
        }
    }
}
