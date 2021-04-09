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
  outputChannel: "829794369888059395",
  pingRole: "829802122362224680",
  adminUser: "175293761323008000",
  pingMessage: "Time to siege!"
}

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
  ws.setNextSiegeAlert = function (startingTime) {
    const timeToNextMoment = calculateTimetoNextMoment(startingTime, getNextSiegeMoments(startingTime));
    sendDebugMessage("Hours to next alert: " + timeToNextMoment / hourMs);
    ws.currentTimeout = setTimeout(function () {
      sendPingMessage();
      ws.setNextSiegeAlert(new Date(startingTime.getTime() + hourMs));
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

    if (message.startsWith("set server")) {
      config.serverOffset = parseInt(message.split(" ")[2]) - 1 || 0;
      clearTimeout(ws.currentTimeout);
      ws.setNextSiegeAlert(new Date());
    } else if (message.startsWith("set warning")) {
      config.advanceWarningTime = parseInt(message.split(" ")[2]) * minuteMs || 0;
      clearTimeout(ws.currentTimeout);
      ws.setNextSiegeAlert(new Date());
    } else if (message.startsWith("set prefix")) {
      config.prefix = (message.split(" ")[2]) || "";
    } else {
      msg.channel.send("set [server <serverNumber>|warning <minutes>|prefix <prefix>]");
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
    siegeMoments.pop();
  }
  siegeMoments.push(new Date(siegeMoments[0] + dayMs).getTime());
  siegeMoments.push(new Date(siegeMoments[1] + dayMs).getTime());
  siegeMoments.push(new Date(siegeMoments[2] + dayMs).getTime());
  return siegeMoments;
}

function calculateTimetoNextMoment(startingTime, availableMoments) {
  let timeToNextMoment = dayMs;
  availableMoments.forEach(moment => {
    if (moment > startingTime) { // TODO consider case when difference is less than advanceWarningTime
      var d = new Date().getTime();
      const timeToMoment = (-d + moment);
      if (timeToMoment > config.advanceWarningTime) {
        timeToNextMoment = Math.min(timeToMoment, timeToNextMoment)
      }
    }
  });
  return timeToNextMoment - config.advanceWarningTime;
}

function sendPingMessage() {
  client.channels.cache.get(config.outputChannel).send("<@&" + config.pingRole + "> " + config.pingMessage);
}

function sendDebugMessage(message) {
  console.log(message);
  client.channels.cache.get(config.outputChannel).send(message);
}
