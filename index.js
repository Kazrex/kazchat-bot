require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.BOT_TOKEN);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ⏮️ Reply-кнопкалар (бас мәзір)
const mainMenu = Markup.keyboard([
  ['💬 Сұрақ қою', '🔐 SafeBox'],
  ['🌐 Тілді өзгерту', 'ℹ️ Ақпарат'],
  ['📋 Көмек', '🆔 ID'],
  ['⛔️ Тоқтату']
]).resize();

// 🟢 Интро және басты мәзір
bot.start((ctx) => {
  ctx.reply(
    `🤖 Сәлем, ${ctx.from.first_name || 'құрметті қолданушы'}!

Мен — KazChat.
Сұрақтарыңа жауап берем, файлдарыңды сақтаймын, көмекші болам.

👇 Төмендегі мәзірден таңдаңыз:`,
    mainMenu
  );
});

// ℹ️ Ақпарат
bot.hears('ℹ️ Ақпарат', (ctx) => {
  ctx.reply('KazChat — жасанды интеллект көмегімен жұмыс істейтін Telegram бот.
Қазақ тілінде сөйлеп, кеңес береді, SafeBox арқылы құжаттарыңызды сақтайды.');
});

// 📋 Көмек
bot.hears('📋 Көмек', (ctx) => {
  ctx.reply('Командалар:

💬 Сұрақ қою — ЖИ-ге сұрақ қою
🔐 SafeBox — Құжатты сақтау
🌐 Тілді өзгерту
🆔 ID — Telegram ID
⛔️ Тоқтату — Боттан шығу');
});

// 🆔 Telegram ID
bot.hears('🆔 ID', (ctx) => {
  ctx.reply(`🆔 Сіздің Telegram ID: ${ctx.from.id}`);
});

// ⛔️ Тоқтату
bot.hears('⛔️ Тоқтату', (ctx) => {
  ctx.reply('Ботпен сөйлесу тоқтатылды. /start арқылы қайта бастауға болады.', Markup.removeKeyboard());
});

// 🌐 Тілді өзгерту (әзірге статика)
bot.hears('🌐 Тілді өзгерту', (ctx) => {
  ctx.reply('Тілді өзгерту функциясы дайындалып жатыр. Қазіргі тіл: Қазақша');
});

// 💬 Ask — ЖИ сұрақ қою
bot.hears('💬 Сұрақ қою', async (ctx) => {
  ctx.reply('🧠 Сұрағыңызды жазыңыз. Мен тыңдап тұрмын...', Markup.keyboard([['🔙 Артқа']]).resize());

  bot.on('text', async (ctx2) => {
    if (ctx2.message.text === '🔙 Артқа') {
      ctx2.reply('Басты мәзірге қайттыңыз.', mainMenu);
      return;
    }
    const userInput = ctx2.message.text;
    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Сен KazChat деген қазақ тілді ЖИ көмекшісісің. Қазақша, нақты, сыпайы жауап бер.' },
            { role: 'user', content: userInput }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const botReply = res.data.choices[0].message.content;
      ctx2.reply(botReply);
    } catch (err) {
      ctx2.reply('Қате кетті. GPT қызметі қазір қолжетімсіз немесе сұраныс шектен асты.');
    }
  });
});

// 🔐 SafeBox модулі
bot.hears('🔐 SafeBox', (ctx) => {
  ctx.reply('📎 Құжатыңызды жіберіңіз (PDF немесе сурет). Ол қауіпсіз сақталады.', Markup.keyboard([['🔙 Артқа']]).resize());
});

bot.on(['document', 'photo'], async (ctx) => {
  const userId = ctx.from.id.toString();
  const userDir = path.join(__dirname, 'safebox', userId);

  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

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
console.log('🤖 KazChat — кнопкалы нұсқа іске қосылды!');
