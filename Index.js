require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Initialize Telegraf bot
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) => {
  ctx.reply('Hello! I am your pediatric book bot. Type /book <book_title> to get information.');
});

bot.command('book', async (ctx) => {
  const bookTitle = ctx.message.text.split(' ').slice(1).join(' ');

  if (!bookTitle) {
    ctx.reply('Please provide a book title after the command.');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('title', bookTitle);

    if (error) {
      throw error;
    }

    if (data.length > 0) {
      const bookInfo = data[0];
      const message = `Title: ${bookInfo.title}\nAuthor: ${bookInfo.author}\nDescription: ${bookInfo.description}`;
      ctx.reply(message);
    } else {
      ctx.reply('Book not found.');
    }
  } catch (error) {
    console.error(error);
    ctx.reply('An error occurred while fetching the book information.');
  }
});

bot.launch();
