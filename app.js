const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client({
  partials: ['MESSAGE', 'REACTION', 'CHANNEL'],
});
const minuteMs = 1000 * 60;
const hourMs = minuteMs * 60;
const dayMs = hourMs * 24;
const ws = {
  currentTimeout: undefined,
}
const config = {
  advanceWarningTime: 2 * minuteMs,
  serverOffset: 3,
  prefix: "<",
  debugChannel: "829794369888059395",
  outputChannel: "829794369888059395",
  pingRole: "829802122362224680",
  adminUser: "175293761323008000",
  pingMessage: "Time to siege!",
  logLevel: "i",
}

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
  ws.setNextSiegeAlert = function (startingTime) {
    const timeToNextMoment = calculateTimetoNextMoment(startingTime, getNextSiegeMoments(startingTime));
    sendInfoMessage("Hours to next alert: " + timeToNextMoment / hourMs);
    ws.currentTimeout = setTimeout(function () {
      sendPingMessage();
      ws.setNextSiegeAlert(new Date(Math.max(new Date().getTime(), startingTime) + hourMs));
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

  if (message.startsWith("get")) {
    msg.channel.send(JSON.stringify(config));
  }
  if (message.startsWith("set")) {
    const parts = message.split(" ");
    if (message.startsWith("set server")) {
      config.serverOffset = parseInt(parts[2]) - 1 || 0;
      clearTimeout(ws.currentTimeout);
      ws.setNextSiegeAlert(new Date());
    } else if (message.startsWith("set warning")) {
      config.advanceWarningTime = parseInt(parts[2]) * minuteMs || 0;
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

function getNextSiegeMoments(startingTime) {
  let siegeMoments = [
    new Date(startingTime).setUTCHours(config.serverOffset, 0, 0, 0),
    new Date(startingTime).setUTCHours(config.serverOffset + 5, 0, 0, 0),
    new Date(startingTime).setUTCHours(config.serverOffset + 10, 0, 0, 0),
    new Date(startingTime).setUTCHours(config.serverOffset + 15, 0, 0, 0),
    new Date(startingTime).setUTCHours(config.serverOffset + 20, 0, 0, 0),
  ];
  if (startingTime.getUTCDay() === 7) {
    // no last siege on sunday
    siegeMoments.splice(4, 1);
    sendDebugMessage("Removed last sunday siege");
  }
  siegeMoments.push(new Date(siegeMoments[0] + dayMs).getTime());
  siegeMoments.push(new Date(siegeMoments[1] + dayMs).getTime());
  siegeMoments.push(new Date(siegeMoments[2] + dayMs).getTime());
  // remove those before starting time
  let i = 0;
  while (i < siegeMoments.length) {
    let moment = siegeMoments[i];
    if (moment <= startingTime) {
      sendDebugMessage("Removing " + displayDate(siegeMoments.splice(i, 1)[0]) + " since it is not after " + displayDate(startingTime));
    } else {
      sendDebugMessage("Accepting " + displayDate(siegeMoments[i]) + " since it is after " + displayDate(startingTime))
      i++;
    }
  }
  return siegeMoments;
}

function calculateTimetoNextMoment(startingTime, availableMoments) {
  let timeToNextMoment = dayMs;
  availableMoments.forEach(moment => {
    if (moment > startingTime) { // TODO consider case when difference is less than advanceWarningTime
      const d = new Date().getTime();
      const timeToMoment = (-d + moment);
      timeToNextMoment = Math.min(timeToMoment, timeToNextMoment)
      sendDebugMessage("OK moment " + displayDate(moment));
    } else {
      sendDebugMessage("Unsuitable moment " + displayDate(moment) + " before " + displayDate(startingTime));
    }
  });
  if (timeToNextMoment === dayMs) {
    sendDebugMessage("Failed to find next moment!");
  }
  return timeToNextMoment - config.advanceWarningTime;
}

function sendPingMessage() {
  client.channels.cache.get(config.outputChannel).send("<@&" + config.pingRole + "> " + config.pingMessage);
}

function sendDebugMessage(message) {
  console.log("DEBUG", message);
  if (config.logLevel.indexOf("d") >= 0) {
    client.channels.cache.get(config.debugChannel).send(message);
  }
}

function sendInfoMessage(message) {
  console.log("INFO", message);
  if (config.logLevel.indexOf("i") >= 0) {
    client.channels.cache.get(config.outputChannel).send(message);
  }
}

function displayDate(number) {
  return new Date(number).toString();
}
