const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Bot commands
bot.command('start', (ctx) => {
  ctx.reply('Welcome to the Pediatric Book Bot!');
});

// Webhook handler
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(200).json({ message: 'Webhook is active' });
      return;
    }

    await bot.handleUpdate(req.body);
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

