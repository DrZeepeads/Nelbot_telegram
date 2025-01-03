require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const fuzzysort = require('fuzzysort');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Initialize Telegraf bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Bot commands and logic
bot.start((ctx) => {
  ctx.reply('Welcome to the Pediatric Book Bot! Type /help to see available commands.');
});

bot.help((ctx) => {
  ctx.reply(
    'Available commands:\n' +
    '/book <title> - Search for a book by title\n' +
    '/author <name> - Search for books by author\n' +
    '/random - Get a random book recommendation'
  );
});

bot.command('book', async (ctx) => {
  const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (!query) {
    return ctx.reply('Please provide a book title after the command.');
  }
  await searchBooks(ctx, 'title', query);
});

bot.command('author', async (ctx) => {
  const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
  if (!query) {
    return ctx.reply('Please provide an author name after the command.');
  }
  await searchBooks(ctx, 'author', query);
});

bot.command('random', async (ctx) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('random()')
      .limit(1)
      .single();

    if (error) throw error;

    if (data) {
      await sendBookInfo(ctx, data);
    } else {
      ctx.reply('No books found in the database.');
    }
  } catch (error) {
    console.error('Error fetching random book:', error);
    ctx.reply('An error occurred while fetching a random book.');
  }
});

async function searchBooks(ctx, field, query) {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*');

    if (error) throw error;

    if (data && data.length > 0) {
      const results = fuzzysort.go(query, data, { key: field });
      if (results.length > 0) {
        const topResults = results.slice(0, 5);
        for (const result of topResults) {
          await sendBookInfo(ctx, result.obj);
        }
        if (results.length > 5) {
          ctx.reply(`Showing top 5 results out of ${results.length}. Please refine your search for more specific results.`);
        }
      } else {
        ctx.reply(`No books found matching "${query}".`);
      }
    } else {
      ctx.reply('No books found in the database.');
    }
  } catch (error) {
    console.error(`Error searching for ${field}:`, error);
    ctx.reply(`An error occurred while searching for books by ${field}.`);
  }
}

async function sendBookInfo(ctx, book) {
  const message = 
    `📚 *${book.title}*\n` +
    `👤 Author: ${book.author}\n` +
    `📖 Description: ${book.description}\n` +
    `🔢 ISBN: ${book.isbn || 'N/A'}\n` +
    `📅 Published: ${book.publication_year || 'N/A'}`;
  
  await ctx.replyWithMarkdown(message);
}

// Export the bot for use in the webhook handler
module.exports = bot;

