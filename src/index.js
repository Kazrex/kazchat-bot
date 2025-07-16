const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');
const startCommand = require('./commands/start');
const askCommand = require('./commands/ask');
const safeboxCommand = require('./commands/safebox');
const langCommand = require('./commands/lang');
const infoCommand = require('./commands/info');
const feedbackCommand = require('./commands/feedback');
const resetCommand = require('./commands/reset');

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Командаларды тіркеу
bot.start(startCommand);
bot.command('ask', askCommand);
bot.command('safebox', safeboxCommand);
bot.command('lang', langCommand);
bot.command('info', infoCommand);
bot.command('feedback', feedbackCommand);
bot.command('reset', resetCommand);

bot.launch().then(() => {
  console.log('Bot is running...');
});