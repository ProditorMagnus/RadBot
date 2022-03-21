import { Channel, DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { Config } from "./Config";
import { SiegeSchedule } from "./SiegeSchedule";
import { Utils } from "./Utils";

export class CommandHandler {
    private config: Config;
    public commands: { [key: string]: BaseCommand };

    constructor(config: Config) {
        this.config = config;
        this.commands = {
            "help": new HelpCommand(this),
            "ping": new PingCommand(),
            "siege": new NextSiegeCommand(this.config),
            "lair": new NextLairCommand()
        }
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

class HelpCommand implements BaseCommand {
    commands: { [key: string]: BaseCommand };
    siegeSchedule: SiegeSchedule;
    commandHandler: CommandHandler;
    constructor(commandHandler: CommandHandler) {
        this.commandHandler = commandHandler;
    }

    help = "Tells you about commands";
    args = new RegExp("help ([a-z]+)");
    public action(msg: Message, message: String) {
        if (!this.commands) this.commands = this.commandHandler.commands;
        const match: RegExpMatchArray = message.match(this.args);
        if (match && this.commands[match[1]]) {
            msg.channel.send("Command " + match[1] + ": " + this.commands[match[1]].help);
        } else {
            msg.channel.send("List of commands: " + Object.keys(this.commands));
        }
    }
};

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
        const emote = "⏱️";
        msg.react(emote);
        setTimeout(function () {
            msg.channel.send("<@" + msg.member.id + "> " + reason);
            const reactions = msg.reactions.cache.get(emote);
            if (reactions) {
                reactions.users.remove();
            }
        }, time);
        console.log("CommandHandler", "Will ping in " + time);
    }
};

class NextSiegeCommand implements BaseCommand {
    config: Config;
    siegeSchedule: SiegeSchedule;
    constructor(config: Config) {
        this.config = config;
        this.siegeSchedule = new SiegeSchedule(config);
    }

    help = "Tells you when is next siege";
    args = new RegExp("");
    public action(msg: Message, message: String) {
        const nextMoment = this.siegeSchedule.getNextSiegeMoments(new Date())[0];
        const timeToNextMoment = nextMoment.getTime() - new Date().getTime();
        msg.channel.send("Next siege: " + Utils.displayDate(nextMoment) + ". " + "Hours left: " + timeToNextMoment / Utils.hourMs);
    }
};

export class NextLairCommand implements BaseCommand {
    help = "Tells you when is next lair";
    args = new RegExp("");
    public action(msg: Message, message: String) {
        const timeToNextMoment = NextLairCommand.getTimeToNextLairMoment();
        // wednesday 18gmt
        // saturday 14gmt
        msg.channel.send("Next lair starts in: " + timeToNextMoment / Utils.hourMs + " hours");
    }

    public static getTimeToNextLairMoment() {
        let lair1 = new Date();
        let lair2 = new Date();
        while (lair1.getUTCDay() != 3) {
            lair1 = new Date(lair1.getTime() + Utils.dayMs);
        }
        while (lair2.getUTCDay() != 6) {
            lair2 = new Date(lair2.getTime() + Utils.dayMs);
        }
        lair1.setUTCHours(18, 0, 0, 0);
        lair2.setUTCHours(14, 0, 0, 0);
        let moments = [lair1, lair2, new Date(lair1.getTime() + 7 * Utils.dayMs)];

        const timeToNextMoment = SiegeSchedule.calculateTimetoNextMoment(new Date(), moments);
        return timeToNextMoment;
    }

    public static getTimeToNextLairCampMoment(){
        let lair1 = new Date();
        let lair2 = new Date();
        while (lair1.getUTCDay() != 2) {
            lair1 = new Date(lair1.getTime() + Utils.dayMs);
        }
        while (lair2.getUTCDay() != 5) {
            lair2 = new Date(lair2.getTime() + Utils.dayMs);
        }
        lair1.setUTCHours(23, 0, 0, 0);
        lair2.setUTCHours(23, 0, 0, 0);
        let moments = [lair1, lair2, new Date(lair1.getTime() + 7 * Utils.dayMs)];

        const timeToNextMoment = SiegeSchedule.calculateTimetoNextMoment(new Date(), moments);
        return timeToNextMoment;
    }
};
