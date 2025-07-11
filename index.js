require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

bot.start((ctx) => {
  ctx.reply(
    `Сәлем, ${ctx.from.first_name}! 👋\n\nМен KazChat ботымын — сұрақтарыңа жауап беретін жасанды интеллект көмекшісімін.\n\n/start - Бастау\n/ask - Сұрақ қою\n/help - Қолдану нұсқаулығы`
  );
});

bot.help((ctx) => {
  ctx.reply(
    `📌 Қолдану нұсқаулығы:\n\n/ask - KazChat ЖИ-ге сұрақ қою\n/info - Жоба туралы\n/safebox - Құжат модулі\n/feedback - Пікір қалдыру`
  );
});

bot.command('info', (ctx) => {
  ctx.reply(
    `ℹ️ KazChat — Kazrex жүйесінің ЖИ негізіндегі Telegram көмекшісі.\nОл қазақ тілінде сөйлеп, кеңес беруге, сұрақтарға жауап беруге бейімделген.`
  );
});

bot.command('myid', (ctx) => {
  ctx.reply(`🆔 Сіздің Telegram ID: ${ctx.from.id}`);
});

bot.command('ask', async (ctx) => {
  ctx.reply('🧠 Сұрағыңызды жазыңыз. Мен тыңдап тұрмын...');

  bot.on('text', async (ctx) => {
    const userInput = ctx.message.text;
    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Сен KazChat деген қазақ тілді ЖИ көмекшісісің. Қазақша, нақты, сыпайы жауап бер.'
            },
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

      const botReply = res.data.choices[0].message.content;
      ctx.reply(botReply);
    } catch (err) {
      ctx.reply('Қате кетті. GPT қызметі қазір қолжетімсіз немесе сұраныс шектен асты.');
    }
  });
});

// 🔐 SafeBox модулі
bot.command('safebox', async (ctx) => {
  ctx.reply('📎 Құжатыңызды жіберіңіз (PDF немесе сурет түрінде). Қауіпсіз түрде сақталады.');
});

bot.on(['document', 'photo'], async (ctx) => {
  const userId = ctx.from.id.toString();
  const userDir = path.join(__dirname, 'safebox', userId);

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  if (ctx.message.document) {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    const link = await ctx.telegram.getFileLink(fileId);

    const response = await axios.get(link.href, { responseType: 'stream' });
    const filePath = path.join(userDir, fileName);
    response.data.pipe(fs.createWriteStream(filePath));

    ctx.reply('✅ Құжатыңыз SafeBox ішіне сақталды.');
  } else if (ctx.message.photo) {
    const photos = ctx.message.photo;
    const fileId = photos[photos.length - 1].file_id;
    const link = await ctx.telegram.getFileLink(fileId);
    const filePath = path.join(userDir, `photo_${Date.now()}.jpg`);

    const response = await axios.get(link.href, { responseType: 'stream' });
    response.data.pipe(fs.createWriteStream(filePath));

    ctx.reply('✅ Сурет SafeBox ішіне сақталды.');
  }
});

bot.launch();
console.log('🤖 KazChat бот іске қосылды!');
