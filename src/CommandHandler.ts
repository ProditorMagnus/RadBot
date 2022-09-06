import { Channel, DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { client } from "./app";
import { Config, DatabaseConfig, SiegeConfig } from "./Config";
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
            "siege": new NextSiegeCommand(this.config.siege[0]),
            "siege1": new NextSiegeCommand(this.config.siege[1]),
            "siege2": new NextSiegeCommand(this.config.siege[2]),
            "shield": new NextShieldCommand(),
            "lair": new NextLairCommand(),
            "db": new DatabaseCommand(this.config.db),
        }
    }

    public handlePublicMessage(msg: Message, message: String): boolean {
        try {
            const command = message.split(" ")[0];
            let handler = this.commands[command];
            if (handler) {
                if (!handler.adminOnly || msg.author.id === this.config.adminUser) {
                    handler.action(msg, message);
                } else {
                    msg.reply("You are not allowed to do this");
                }
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
    adminOnly: Boolean;
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

    adminOnly = false;
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
    adminOnly = false;
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
            if (msg.deleted) return;

            const reactions = msg.reactions.cache.get(emote);
            if (reactions) {
                reactions.users.remove();
            }
        }, time);
        console.log("CommandHandler", "Will ping in " + Utils.formatDuration(time));
    }
};

class NextSiegeCommand implements BaseCommand {
    adminOnly = false;
    config: SiegeConfig;
    siegeSchedule: SiegeSchedule;
    constructor(config: SiegeConfig) {
        this.config = config;
        this.siegeSchedule = new SiegeSchedule(config);
    }

    help = "Tells you when is next siege";
    args = new RegExp("");
    public action(msg: Message, message: String) {
        const nextMoment = this.siegeSchedule.getNextSiegeMoments(new Date())[0];
        const timeToNextMoment = nextMoment.getTime() - new Date().getTime();
        msg.channel.send("Next siege is in " + Utils.formatDuration(timeToNextMoment));
    }
};

export class NextLairCommand implements BaseCommand {
    adminOnly = false;
    help = "Tells you when is next lair";
    args = new RegExp("");
    public action(msg: Message, message: String) {
        const timeToNextMoment = NextLairCommand.getTimeToNextLairMoment();
        // wednesday 18gmt
        // saturday 14gmt
        msg.channel.send("Next lair starts in: " + Utils.formatDuration(timeToNextMoment));
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

    public static getTimeToNextLairCampMoment() {
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

export class NextShieldCommand implements BaseCommand {
    adminOnly = false;
    help = "Tells you when is next weekend league shield time";
    args = new RegExp("");
    public action(msg: Message, message: String) {
        const timeToNextMoment = NextShieldCommand.getTimeToNextShieldMoment();
        msg.channel.send("Next shield should be used in " + Utils.formatDuration(timeToNextMoment));
    }

    public static getTimeToNextShieldMoment() {
        let saturday = new Date();
        let sunday = new Date();
        while (saturday.getUTCDay() != 6) {
            saturday = new Date(saturday.getTime() + Utils.dayMs);
        }
        while (sunday.getUTCDay() % 7 != 0) {
            sunday = new Date(sunday.getTime() + Utils.dayMs);
        }
        saturday.setUTCHours(20, 0, 0, 0);
        sunday.setUTCHours(20, 0, 0, 0);
        let moments = [saturday, sunday, new Date(saturday.getTime() + 7 * Utils.dayMs)];

        const timeToNextMoment = SiegeSchedule.calculateTimetoNextMoment(new Date(), moments);
        return timeToNextMoment;
    }
};

export class DatabaseCommand implements BaseCommand {
    adminOnly = true;
    db: DatabaseConfig;
    constructor(db: DatabaseConfig) {
        this.db = db;
    }

    help = "Manage messages of database channel";
    args = new RegExp("db (.+)");
    public async action(msg: Message, message: String) {
        if (!this.db.enabled) return;
        let parts = message.split(" ");
        parts.shift();
        let action = parts.shift();
        let message_id = null;
        let message_channel: TextChannel = null;
        if (action.includes("rw")) {

            let channel: TextChannel = client.channels.cache.get(this.db.channel) as TextChannel;
            message_channel = channel;
            await channel.messages.fetch({ limit: 10 })
                .then(messages => {
                    let first = messages.filter(m => m.editable).first();
                    if (first) {
                        message_id = first.id;
                    }
                });
        }
        if (action.includes("r")) {
            // 0 5 10 15 20 = s1 s5 s9
            // 1 6 11 16 21 = s2 s6 s10
            // 2 7 12 17 22 = s3 s7 s11
            // 3 8 13 18 23 = s4 s8

            // TODO get rid of this command version
            let publishSiegeStatus = function () {
                let hour = new Date().getUTCHours();
                let isSunday = new Date().getDay() % 7 == 0;
                let output = DatabaseCommand.collectSiegeStatus(hour, isSunday);
                if (message_channel && message_id) {
                    message_channel.messages.fetch(message_id).then(m => m.edit(output.join("\n")));
                    let hourStart = new Date();
                    hourStart.setMinutes(0, 0, 0);
                    setTimeout(publishSiegeStatus, hourStart.getTime() + Utils.hourMs - new Date().getTime());
                    // msg.reply("Updated previous message and added new alert in " + (hourStart.getTime() + Utils.hourMs - new Date().getTime()) / Utils.hourMs + " hours");
                } else {
                    msg.reply(output.join("\n"));
                }
            };
            publishSiegeStatus();
        }
    }

    public static collectSiegeStatus(hour: number, isSunday: boolean) {
        // -9 filler to have 1-based index
        // -1 = no info
        // 0 = siege now
        // 1 = siege in 1h
        let siegeStatus: number[] = [-9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
        if (hour % 5 === 0) {
            siegeStatus[1] = 0;

            siegeStatus[2] = 1;
        }
        if (hour % 5 === 1) {
            siegeStatus[2] = 0;

            siegeStatus[7] = 1;
            siegeStatus[10] = 1;
        }
        if (hour % 5 === 2) {
            siegeStatus[7] = 0;
            siegeStatus[10] = 0;

            siegeStatus[4] = 1;
        }
        if (hour % 5 === 3) {
            siegeStatus[4] = 0;
        }
        if (hour % 5 === 4) {
            siegeStatus[1] = 1;
        }
        let output = [];
        for (let i = 1; i < siegeStatus.length; i++) {
            const status = siegeStatus[i];
            if (status == 0) {
                output.push("Server " + i + " siege: ongoing");
            }
            if (status == 1) {
                let hourStart = new Date();
                hourStart.setMinutes(0, 0, 0);
                output.push("Server " + i + " siege: upcoming <t:" + (hourStart.getTime() + Utils.hourMs) / 1000 + ":R>");
            }

        }
        if (hour >= 19 && isSunday) {
            if (hour == 23) {
                output = ["Server 1 siege: upcoming"];
            } else {
                output = ["Siege has ended"];
            }
        }
        output.push("Updated: " + new Date());
        return output;
    }

    public static publishSiegeStatus(channelId: string, messageId: string) {
        let main = function () {
            let messageChannel = client.channels.cache.get(channelId) as TextChannel;
            let hour = new Date().getUTCHours();
            let isSunday = new Date().getDay() % 7 == 0;
            let output = DatabaseCommand.collectSiegeStatus(hour, isSunday);

            // TODO error handling if message is not there
            messageChannel.messages.fetch(messageId).then(m => m.edit(output.join("\n")));
            let hourStart = new Date();
            hourStart.setMinutes(0, 0, 0);
            setTimeout(main, hourStart.getTime() + Utils.hourMs - new Date().getTime());
        }
        main();
    }
};
