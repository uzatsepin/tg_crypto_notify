import { hydrate } from "@grammyjs/hydrate"
import dotenv from 'dotenv'
import { Bot, session } from 'grammy'
import cron from "node-cron"
import { addCoinHandler } from "./handlers/addCoinHandler.js"
import { checkPricesHandler } from "./handlers/checkPricesHandler.js"
import { currencyHandler } from "./handlers/currencyHandler.js"
import { deleteWatchHandler } from "./handlers/deleteWatchHandler.js"
import { watchCoinHandler } from "./handlers/watchCoinHandler.js"
import { mainKeyboard } from "./keyboards/index.js"
import { supabase } from "./supabase/index.js"
import { getPercentFromUser, profileHandler } from "./handlers/profileHandler.js";
import { conversations, createConversation } from "@grammyjs/conversations";
import { homeHandler } from "./handlers/homeHandler.js";
import { trendsHandler } from "./handlers/trendingHandler.js";
import { updateCoinPrices } from "./helpers/updateCoinPrices.js";
import { dailyDigest } from "./helpers/dailyDigest.js";

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(addCoinHandler)
bot.use(watchCoinHandler)
bot.use(currencyHandler)
bot.use(checkPricesHandler)
bot.use(deleteWatchHandler)
bot.use(homeHandler)
bot.use(session({
	initial() {
		return {};
	},
}));
bot.use(conversations())
bot.use(hydrate())
bot.use(createConversation(getPercentFromUser))
bot.use(profileHandler)
bot.use(trendsHandler)

bot.command('start', async (ctx) => {
	try {

		let {data: tgUser} = await supabase.from('tg_users').select('*').eq('tg_id', (String(ctx.from.id)))

		if (!tgUser.length) {

			await supabase.from('tg_users').insert({
				tg_id: String(ctx.from.id),
				is_bot: ctx.from.is_bot,
				first_name: ctx.from.first_name,
				username: ctx.from.username,
				language_code: ctx.from.language_code,
				is_premium: ctx.from.is_premium,
			});

			await ctx.reply(`Приветствую в нашем телеграмм боте, <b>${ctx.from.first_name}</b>.\n\nТут ты можешь добавить монеты для отслеживания. Когда монета изменится более чем на 5% (изначальное значение, которое можно изменить в профиле) от текущей цене, то мы тебя уведомим. \n\nПроверка цены происходит 1 раз в 30 минут для экономии запросов по API.`, {
				reply_markup: mainKeyboard,
				parse_mode: "HTML"
			})

			await bot.api.sendMessage('138387567', `✅ Авторизирован новый пользователь. ${ctx.from.first_name}`);

		} else {
			await ctx.reply(`Рады видеть вас снова, <b>${ctx.from.first_name}</b>.\n\nМожете воспользоваться клавиатурой для выбора необходимого действия. \n\n<i>Проверка цены происходит 1 раз в 30 минут для экономии запросов по API.</i>`, {
				reply_markup: mainKeyboard,
				parse_mode: "HTML"
			})
		}

	} catch (error) {
		console.log(error);
	}
});

cron.schedule('1 8 * * *', async () => {
	console.log('Запуск updateCoinPrices() в 10:01');
	await updateCoinPrices();
});

cron.schedule('10 8 * * *', async () => {
	console.log('Запуск dailyDigest() в 10:10');
	await dailyDigest();
});

bot.catch((err) => console.error(err));

bot.start();

export default bot;
