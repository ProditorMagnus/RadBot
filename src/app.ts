import { Client, Message, TextChannel } from 'discord.js';
import { Config, PingConfig, ShieldConfig, SiegeConfig } from './Config';
import { SiegeSchedule } from './SiegeSchedule';
import { PollController } from './PollController';
import { CommandHandler, DatabaseCommand, NextLairCommand, NextShieldCommand } from './CommandHandler';
import { Utils } from './Utils';
require('dotenv').config();

export const client = new Client({
  partials: ['MESSAGE', 'REACTION', 'CHANNEL'],
});
const ws = {
  setNextLairAlert: undefined,
  setNextDraadorPoll: undefined
}
const config = {
  prefix: process.env.PREFIX || "<",
  debugChannel: process.env.DEBUG_CHANNEL || "829794369888059395",
  pollChannel: process.env.POLL_CHANNEL || "856267796504772649",
  adminUser: process.env.ADMIN_USER || "175293761323008000",

  lair: {
    fight: {
      enabled: true,
      advanceWarningTime: (parseInt(process.env.LAIR_ADVANCE_WARNING_TIME) || 5) * Utils.minuteMs,
      pingRole: process.env.LAIR_PING_ROLE || "903673094336573482",
      pingMessage: process.env.LAIR_PING_MESSAGE || "Time for lair!",
      outputChannel: process.env.LAIR_PING_CHANNEL || "872554300394586143",
      cleanConfig: {
        enabled: true,
        delayMs: Utils.hourMs,
      },
    },

    camp: {
      enabled: true,
      advanceWarningTime: (parseInt(process.env.LAIR_ADVANCE_WARNING_TIME) || 5) * Utils.minuteMs,
      pingMessage: process.env.LAIR_CAMP_PING_MESSAGE || "Heroes to camp!",
      pingRole: process.env.LAIR_CAMP_PING_ROLE || "955588022282358865",
      outputChannel: process.env.LAIR_PING_CHANNEL || "872554300394586143",
      cleanConfig: {
        enabled: true,
        delayMs: Utils.hourMs,
      },
    }
  },

  siege: [
    {
      serverOffset: 3,
      enabled: true,
      advanceWarningTime: (parseInt(process.env.ADVANCE_WARNING_TIME) || 2) * Utils.minuteMs,
      pingRole: process.env.PING_ROLE || "830168692373192745",
      pingMessage: process.env.PING_MESSAGE || "Time to siege!",
      outputChannel: process.env.OUTPUT_CHANNEL || "717578823255720036",
      cleanConfig: {
        enabled: true,
        delayMs: Utils.hourMs,
      },
    },
    {
      serverOffset: 0,
      enabled: false,
      advanceWarningTime: (parseInt(process.env.ADVANCE_WARNING_TIME) || 2) * Utils.minuteMs,
      pingRole: "0",
      pingMessage: "Time to siege on s1!",
      outputChannel: "983187637802262568",
      cleanConfig: {
        enabled: true,
        delayMs: Utils.hourMs,
      },
    },
    {
      serverOffset: 1,
      enabled: false,
      advanceWarningTime: (parseInt(process.env.ADVANCE_WARNING_TIME) || 2) * Utils.minuteMs,
      pingRole: "0",
      pingMessage: "Time to siege on s2!",
      outputChannel: "983187637802262568",
      cleanConfig: {
        enabled: true,
        delayMs: Utils.hourMs,
      },
    },
    {
      serverOffset: 3,
      enabled: true,
      advanceWarningTime: 5 * Utils.minuteMs,
      pingRole: "1038799565492596756",
      pingMessage: "Time to siege!",
      outputChannel: "1038023007475605554", // SalVaTion
      cleanConfig: {
        enabled: true,
        delayMs: Utils.hourMs,
      },
    },
  ],

  shield: {
    enabled: true,
    advanceWarningTime: 10 * Utils.minuteMs,
    pingRole: "965703720321032283",
    pingMessage: "Prepare for league!",
    outputChannel: "776411815499792384",
    cleanConfig: {
      enabled: true,
      delayMs: 10 * Utils.minuteMs,
    },
    lastMomentWarning: {
      enabled: true,
      advanceWarningTime: 10 * Utils.secondMs,
      pingRole: "965703720321032283",
      pingMessage: "Shield time incoming soon!",
      outputChannel: "776411815499792384",
      cleanConfig: {
        enabled: true,
        delayMs: 10 * Utils.minuteMs,
      },
    }
  },

  db: {
    enabled: true,
    guild: "829794369888059392",
    channel: "892148021758935111"
  },

  siegeStatus: {
    enabled: true,
    channelId: "983187637802262568",
    messageId: "1007684995994898432"
  }
} as Config;
const pollController = new PollController(config);
const commandHandler = new CommandHandler(config);

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
  setSiegeAlerts();
  setShieldAlert(config.shield)
  if (config.lair.fight.enabled) {
    ws.setNextLairAlert = function () {
      const timeToNextMoment = NextLairCommand.getTimeToNextLairMoment() - config.lair.fight.advanceWarningTime;
      setTimeout(function () {
        sendPingMessage(config.lair.fight);
        setTimeout(function () { ws.setNextLairAlert(); }, Utils.dayMs);
      }, timeToNextMoment);
    }
    if (config.lair.camp.enabled) {
      const timeToNextCampMoment = NextLairCommand.getTimeToNextLairCampMoment() - config.lair.camp.advanceWarningTime;
      setTimeout(function () {
        sendPingMessage(config.lair.camp);
      }, timeToNextCampMoment);
    }
    ws.setNextLairAlert();
  }
  ws.setNextDraadorPoll = function () {
    const nextWeekStart = new Date().setUTCHours(0, 0, 0, 0)
      + ((7 - new Date().getUTCDay()) % 7 + 1) * Utils.hourMs * 24;
    const timeToNextPoll = nextWeekStart
      - new Date().getTime();
    setTimeout(function () {
      pollController.doPoll(client.channels.cache.get(config.pollChannel) as TextChannel, "poll 6 How many draadors you found on the week " + new Date(nextWeekStart).toDateString() + " - " + new Date(nextWeekStart + 6 * 24 * Utils.hourMs).toDateString());
      setTimeout(function(){ws.setNextDraadorPoll();}, Utils.dayMs);
    }, timeToNextPoll);
  }
  ws.setNextDraadorPoll();
  if (config.siegeStatus.enabled) {
    DatabaseCommand.publishSiegeStatus(config.siegeStatus.channelId, config.siegeStatus.messageId);
  }
  sendDebugMessage("Bot is online");
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
  if (message.startsWith("poll")) {
    pollController.doPoll(msg.channel, message);
  }
  if (msg.author.id !== config.adminUser) {
    return;
  }

  if (message.startsWith("set")) {
    const parts = message.split(" ");
    if (message.startsWith("set prefix")) {
      config.prefix = (parts[2]) || "";
    } else if (message.startsWith("set str ")) {
      // consider accepting #channel and @role inputs
      config[parts[2]] = parts.slice(3).join(" ");
    } else if (message.startsWith("set int ")) {
      config[parts[2]] = parseInt(parts.slice(3).join(" "));
    } else if (message.startsWith("set float ")) {
      config[parts[2]] = parseFloat(parts.slice(3).join(" "));
    } else if (message.startsWith("set eval ")) {
      eval("config." + parts.slice(2).join(" "))
    } else {
      msg.channel.send("set prefix <prefix>|str/int/float <key> <value>]|eval ");
    }

    msg.channel.send(JSON.stringify(config));
  }
});

function setShieldAlert(shieldConfig: ShieldConfig) {
  const timeToNextMoment = NextShieldCommand.getTimeToNextShieldMoment();
  if (shieldConfig.enabled && timeToNextMoment - shieldConfig.advanceWarningTime > 0) {
    setTimeout(function () {
      sendPingMessage(shieldConfig);
      setTimeout(function () {
        setShieldAlert(shieldConfig);
      }, timeToNextMoment + Utils.hourMs);
    }, timeToNextMoment - shieldConfig.advanceWarningTime);
  }
  if (shieldConfig.lastMomentWarning.enabled && timeToNextMoment - shieldConfig.lastMomentWarning.advanceWarningTime > 0) {
    setTimeout(function () {
      sendPingMessage(shieldConfig.lastMomentWarning);
    }, timeToNextMoment - shieldConfig.lastMomentWarning.advanceWarningTime);
  }
}

function setSiegeAlert(siege: SiegeConfig) {
  if (!siege.enabled) return;
  const schedule = new SiegeSchedule(siege);
  const startingTime = new Date(new Date().getTime() + Utils.minuteMs + siege.advanceWarningTime);
  const timeToNextMoment = SiegeSchedule.calculateTimetoNextMoment(startingTime, schedule.getNextSiegeMoments(startingTime));
  setTimeout(function () {
    sendPingMessage(siege);
    setSiegeAlert(siege);
  }, timeToNextMoment - siege.advanceWarningTime);
}

function setSiegeAlerts() {
  config.siege.forEach(setSiegeAlert);
}

function sendPingMessage(pingConfig: PingConfig) {
  if (!pingConfig.enabled) return;
  let promise: Promise<Message> = (client.channels.cache.get(pingConfig.outputChannel) as TextChannel).send("<@&" + pingConfig.pingRole + "> " + pingConfig.pingMessage);
  if (pingConfig.cleanConfig && pingConfig.cleanConfig.enabled) {
    promise.then(msg => {
      setTimeout(() => msg.delete()
        .catch(e => sendDebugMessage(e.message + " when deleting ping message")),
        pingConfig.cleanConfig.delayMs);
    }).catch(e => sendDebugMessage(e.message + " when sending ping message"));
  }
}

function sendDebugMessage(message: string) {
  console.log("DEBUG", message);
  message = "" + message;
  //(client.channels.cache.get(config.debugChannel) as TextChannel).send(message);
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
    if (err) sendDebugMessage(err);
  };
}

process
  .on('SIGTERM', shutdown('SIGTERM'))
  .on('SIGINT', shutdown('SIGINT'))
  .on('uncaughtException', reportError('uncaughtException'));
