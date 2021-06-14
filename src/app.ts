import { Client, Message, TextChannel } from 'discord.js';
import { Config } from './Config';
import { SiegeSchedule } from './SiegeSchedule';
import { Utils } from './Utils';
require('dotenv').config();

const client = new Client({
  partials: ['MESSAGE', 'REACTION', 'CHANNEL'],
});
const ws = {
  currentTimeout: undefined,
  setNextSiegeAlert: undefined
}
const config = {
  advanceWarningTime: (parseInt(process.env.ADVANCE_WARNING_TIME) || 2) * Utils.minuteMs,
  serverOffset: parseInt(process.env.SERVER_OFFSET) || 3,
  prefix: process.env.PREFIX || "<",
  debugChannel: process.env.DEBUG_CHANNEL || "829794369888059395",
  outputChannel: process.env.OUTPUT_CHANNEL || "829794369888059395",
  pingRole: process.env.PING_ROLE || "829802122362224680",
  adminUser: process.env.ADMIN_USER || "175293761323008000",
  pingMessage: process.env.PING_MESSAGE || "Time to siege!",
  logLevel: process.env.LOG_LEVEL || "di",
} as Config;
const siegeSchedule = new SiegeSchedule(config);

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
  ws.setNextSiegeAlert = function (startingTime: Date) {
    const timeToNextMoment = siegeSchedule.calculateTimetoNextMoment(startingTime, siegeSchedule.getNextSiegeMoments(startingTime));
    sendDebugMessage("Hours to next alert: " + timeToNextMoment / Utils.hourMs);
    ws.currentTimeout = setTimeout(function () {
      sendPingMessage();
      ws.setNextSiegeAlert(new Date(Math.max(new Date().getTime(), startingTime.getTime()) + Utils.hourMs));
    }, timeToNextMoment)
  }
  ws.setNextSiegeAlert(new Date());
})

client.on('message', (msg) => {
  if (!msg.guild) return;
  if (!msg.content.startsWith(config.prefix)) {
    return;
  }
  let message = msg.content.slice(config.prefix.length);
  if (msg.author.id !== config.adminUser) {
    return;
  }

  if (message.startsWith("next")) {
    msg.channel.send("Next siege: " + Utils.displayDate(siegeSchedule.getNextSiegeMoments(new Date())[0]));
  }
  if (message.startsWith("poll")) {
    doPoll(msg, message);
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

// Example: poll 3 pick your number 1-3
async function doPoll(msg: Message, message: String) {
  let defEmojiList = [
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
  const parts = message.split(" ");
  const optionCount = parseInt(parts[1]);
  const pollMessage = parts.slice(2).join(" ");
  const poll = await msg.channel.send(pollMessage);
  for (let i = 0; i < optionCount; i++) {
    const emote = defEmojiList[i];
    poll.react(emote);
  }
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
    (client.channels.cache.get(config.outputChannel) as TextChannel).send(message);
  }
}
