require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

bot.start((ctx) => {
  ctx.reply(`Сәлем, ${ctx.from.first_name}! Мен KazChat ботымын. /ask деп сұрақ қой!`);
});

bot.command('ask', async (ctx) => {
  ctx.reply('Сұрағыңызды жазыңыз:');
  bot.on('text', async (ctx) => {
    const userInput = ctx.message.text;
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Сен KazChat көмекшісісің. Қазақша жауап бер.' },
          { role: 'user', content: userInput },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    ctx.reply(res.data.choices[0].message.content);
  });
});

bot.launch();
console.log('🤖 KazChat іске қосылды!');
