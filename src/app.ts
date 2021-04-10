import { Client, TextChannel } from 'discord.js';
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
  advanceWarningTime: 2 * Utils.minuteMs,
  serverOffset: 3,
  prefix: "<",
  debugChannel: "829794369888059395",
  outputChannel: "829794369888059395",
  pingRole: "829802122362224680",
  adminUser: "175293761323008000",
  pingMessage: "Time to siege!",
  logLevel: "i",
} as Config;
const siegeSchedule = new SiegeSchedule(config);

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
  ws.setNextSiegeAlert = function (startingTime) {
    const timeToNextMoment = siegeSchedule.calculateTimetoNextMoment(startingTime, siegeSchedule.getNextSiegeMoments(startingTime));
    sendInfoMessage("Hours to next alert: " + timeToNextMoment / Utils.hourMs);
    ws.currentTimeout = setTimeout(function () {
      sendPingMessage();
      ws.setNextSiegeAlert(new Date(Math.max(new Date().getTime(), startingTime) + Utils.hourMs));
    }, timeToNextMoment)
  }
  ws.setNextSiegeAlert(new Date())
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
      config[parts[2]] = parts.slice(3).join(" ");
    } else {
      msg.channel.send("set [server <serverNumber>|warning <minutes>|prefix <prefix>|str <key> <value>]");
    }

    msg.channel.send(JSON.stringify(config));
  }
});

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
