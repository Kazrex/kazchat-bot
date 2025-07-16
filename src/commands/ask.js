module.exports = async (ctx) => {
  const question = ctx.message.text.split(' ').slice(1).join(' ');
  // ЖИ қызметіне сұрақ жіберу логикасы
  ctx.reply(`Сіздің сұрағыңыз: ${question}`);
};