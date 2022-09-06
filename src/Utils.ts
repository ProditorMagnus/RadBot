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

        if (hours > 0) {
            return hours + "h " + minutes + "m";
        } else {
            let seconds = Math.floor((ms / Utils.secondMs) % 60);
            return minutes + "m " + seconds + "s";
        }
    }

    static formatDiscordTimestamp(ms: number) {
        return "<t:" + Math.floor(ms / 1000) + ":R>";
    }
}
