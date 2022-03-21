import { Client, Message, TextChannel } from 'discord.js';
import { Config } from './Config';
import { SiegeSchedule } from './SiegeSchedule';
import { PollController } from './PollController';
import { CommandHandler, NextLairCommand } from './CommandHandler';
import { Utils } from './Utils';
require('dotenv').config();

const client = new Client({
  partials: ['MESSAGE', 'REACTION', 'CHANNEL'],
});
const ws = {
  currentTimeout: undefined,
  setNextSiegeAlert: undefined,
  setNextLairAlert: undefined,
  setNextDraadorPoll: undefined
}
const config = {
  advanceWarningTime: (parseInt(process.env.ADVANCE_WARNING_TIME) || 2) * Utils.minuteMs,
  serverOffset: parseInt(process.env.SERVER_OFFSET) || 3,
  prefix: process.env.PREFIX || "<",
  debugChannel: process.env.DEBUG_CHANNEL || "829794369888059395",
  outputChannel: process.env.OUTPUT_CHANNEL || "829794369888059395",
  pollChannel: process.env.POLL_CHANNEL || "856267796504772649",
  pingRole: process.env.PING_ROLE || "829802122362224680",
  adminUser: process.env.ADMIN_USER || "175293761323008000",
  pingMessage: process.env.PING_MESSAGE || "Time to siege!",
  lair: {
    enabled: !!process.env.ENABLE_LAIR_PING,
    pingMessage: process.env.LAIR_PING_MESSAGE || "Time for lair!",
    pingRole: process.env.LAIR_PING_ROLE || "903673094336573482",
    campMessage: process.env.LAIR_CAMP_PING_MESSAGE || "Heroes to camp!",
    campPingRole: process.env.LAIR_CAMP_PING_ROLE || "955588022282358865",
    outputChannel: process.env.LAIR_PING_CHANNEL || "872554300394586143",
    advanceWarningTime: (parseInt(process.env.LAIR_ADVANCE_WARNING_TIME) || 5) * Utils.minuteMs,
  },
  logLevel: process.env.LOG_LEVEL || "di",
} as Config;
const siegeSchedule = new SiegeSchedule(config);
const pollController = new PollController(config);
const commandHandler = new CommandHandler(config);

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
  ws.setNextSiegeAlert = function (startingTime: Date) {
    const timeToNextMoment = SiegeSchedule.calculateTimetoNextMoment(startingTime, siegeSchedule.getNextSiegeMoments(startingTime)) - config.advanceWarningTime;
    sendDebugMessage("Hours to next siege alert: " + timeToNextMoment / Utils.hourMs);
    ws.currentTimeout = setTimeout(function () {
      sendPingMessage();
      ws.setNextSiegeAlert(new Date(Math.max(new Date().getTime(), startingTime.getTime()) + Utils.hourMs));
    }, timeToNextMoment)
  }
  ws.setNextSiegeAlert(new Date());
  if (config.lair.enabled) {
    ws.setNextLairAlert = function () {
      const timeToNextMoment = NextLairCommand.getTimeToNextLairMoment() - config.lair.advanceWarningTime;
      sendDebugMessage("Hours to next lair alert: " + timeToNextMoment / Utils.hourMs);
      setTimeout(function () {
        sendLairPingMessage();
      }, timeToNextMoment);

      const timeToNextCampMoment = NextLairCommand.getTimeToNextLairCampMoment() - config.lair.advanceWarningTime;
      setTimeout(function () {
        (client.channels.cache.get(config.lair.outputChannel) as TextChannel).send("<@&" + config.lair.campPingRole + "> " + config.lair.campMessage);
      }, timeToNextCampMoment);
    }
    ws.setNextLairAlert();
  }
  ws.setNextDraadorPoll = function () {
    const nextWeekStart = new Date().setUTCHours(0, 0, 0, 0)
      + ((7 - new Date().getUTCDay()) % 7 + 1) * Utils.hourMs * 24;
    const timeToNextPoll = nextWeekStart
      - new Date().getTime();
    sendDebugMessage("Time to next poll: " + timeToNextPoll + " -> " + timeToNextPoll / Utils.hourMs + " hours");
    setTimeout(function () {
      pollController.doPoll(client.channels.cache.get(config.pollChannel) as TextChannel, "poll 6 How many draadors you found on the week " + new Date(nextWeekStart).toDateString() + " - " + new Date(nextWeekStart + 6 * 24 * Utils.hourMs).toDateString());
    }, timeToNextPoll);
  }
  ws.setNextDraadorPoll();
})

client.on('message', (msg) => {
  if (!msg.guild) return;
  if (!msg.content.startsWith(config.prefix)) {
    return;
  }
  let message = msg.content.slice(config.prefix.length);
  if (commandHandler.handlePublicMessage(msg, message)) {
    return;
  }
  if (msg.author.id !== config.adminUser) {
    return;
  }


  if (message.startsWith("poll")) {
    pollController.doPoll(msg.channel, message);
  }
  if (message.startsWith("set")) {
    const parts = message.split(" ");
    if (message.startsWith("set server")) {
      config.serverOffset = parseInt(parts[2]) - 1 || 0;
      clearTimeout(ws.currentTimeout);
      ws.setNextSiegeAlert(new Date());
    } else if (message.startsWith("set warning")) {
      config.advanceWarningTime = parseInt(parts[2]) * Utils.minuteMs || 0;
      clearTimeout(ws.currentTimeout);
      ws.setNextSiegeAlert(new Date());
    } else if (message.startsWith("set prefix")) {
      config.prefix = (parts[2]) || "";
    } else if (message.startsWith("set str ")) {
      // consider accepting #channel and @role inputs
      config[parts[2]] = parts.slice(3).join(" ");
    } else {
      msg.channel.send("set [server <serverNumber>|warning <minutes>|prefix <prefix>|str <key> <value>]");
    }

    msg.channel.send(JSON.stringify(config));
  }
});

function sendLairPingMessage() {
  (client.channels.cache.get(config.lair.outputChannel) as TextChannel).send("<@&" + config.lair.pingRole + "> " + config.lair.pingMessage);
}

function sendPingMessage() {
  (client.channels.cache.get(config.outputChannel) as TextChannel).send("<@&" + config.pingRole + "> " + config.pingMessage);
}

function sendDebugMessage(message: string) {
  console.log("DEBUG", message);
  if (config.logLevel.indexOf("d") >= 0) {
    (client.channels.cache.get(config.debugChannel) as TextChannel).send(message);
  }
}

function sendInfoMessage(message: string) {
  console.log("INFO", message);
  if (config.logLevel.indexOf("i") >= 0) {
    (client.channels.cache.get(config.debugChannel) as TextChannel).send(message);
  }
}

function shutdown(signal) {
  return (err) => {
    sendDebugMessage(`${signal}...`);
    if (err) sendDebugMessage(err.stack || err);
    setTimeout(() => {
      sendDebugMessage('...waited 5s, exiting.');
      process.exit(err ? 1 : 0);
    }, 5000).unref();
  };
}

function reportError(signal) {
  return (err) => {
    if (err) sendInfoMessage(err.stack || err);
  };
}

process
  .on('SIGTERM', shutdown('SIGTERM'))
  .on('SIGINT', shutdown('SIGINT'))
  .on('uncaughtException', reportError('uncaughtException'));
