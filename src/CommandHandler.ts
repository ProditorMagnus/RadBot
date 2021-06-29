import { Channel, DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { Config } from "./Config";
import { Utils } from "./Utils";

export class CommandHandler {
    private config: Config;

    private commands = {
        "ping": new PingCommand()
    }

    constructor(config: Config) {
        this.config = config;
    }

    public handlePublicMessage(msg: Message, message: String): boolean {
        try {
            const command = message.split(" ")[0];
            if (this.commands[command]) {
                this.commands[command].action(msg, message);
                return true;
            }
        } catch (error) {
            console.log("Error in CommandHandler", error);
            return false;
        }
        return false;
    }
}

interface BaseCommand {
    help: String;
    args: RegExp;
    action(msg: Message, message: String): void;
}

class PingCommand implements BaseCommand {
    help = "Causes bot to ping you after specified time. Usage: ping <time> <optional message>. Time is in minutes, but can be set in second and hours like 20s or 1h";
    args = new RegExp("(\\d+[sh]?) ?(.*)");
    public action(msg: Message, message: String) {
        const match: RegExpMatchArray = message.match(this.args);
        if (!match) {
            msg.channel.send("<@" + msg.member.id + "> " + "Unable to parse command arguments, expected " + this.args.source + ". " + this.help);
            return;
        }
        const timeWithUnit = match[1];
        let timeWithoutUnit = timeWithUnit;
        let unit = Utils.minuteMs;
        if (timeWithUnit.endsWith("s")) {
            unit = Utils.secondMs;
            timeWithoutUnit = timeWithUnit.substr(0, timeWithUnit.length - 1);
        } else if (timeWithUnit.endsWith("h")) {
            unit = Utils.hourMs;
            timeWithoutUnit = timeWithUnit.substr(0, timeWithUnit.length - 1);
        }
        const time = parseInt(timeWithoutUnit) * unit;
        const reason = match[2];
        setTimeout(function () {
            msg.channel.send("<@" + msg.member.id + "> " + reason);
        }, time);
        console.log("CommandHandler", "Will ping in " + time);
    }

};
