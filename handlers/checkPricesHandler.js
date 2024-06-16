import { Composer, InlineKeyboard } from "grammy"
import { getCoinData } from "../axios/getCoinData.js"
import { getColumnName } from "../helpers/index.js"
import { mainKeyboard } from "../keyboards/index.js"
import { supabase } from "../supabase/index.js"
import { addCoinHandler } from "./addCoinHandler.js"

export const checkPricesHandler = new Composer();

checkPricesHandler.callbackQuery('cur_price', async (ctx) => {
	const {data:usersCoins} = await supabase.from("user_coins").select(`*, coin_id (*)`).eq("tg_id", ctx.from.id);

	if (!usersCoins || usersCoins.length === 0) {
		await ctx.editMessageText("Вы не отслеживаете ни одной монеты.", {
			reply_markup: mainKeyboard,
			parse_mode: "HTML"
		});
		return;
	}


	const coinsKeyboard =  usersCoins.map((coin) => {
		return [coin.coin_id.coin_name, `price_${coin.coin_id.coin_value}`]
	});

	const buttonRow = coinsKeyboard.map(([label,data]) => InlineKeyboard.text(label, data))

	const keyboard = InlineKeyboard.from([buttonRow])

	await ctx.editMessageText('По какой валюте необходимо узнать цену? 👇', {
		reply_markup: keyboard,
	})
});

addCoinHandler.callbackQuery(/price_/, async (ctx) => {

	const data = ctx.callbackQuery.data;
	const coinValue = data.replace("price_", "");

	const {data: userCurrencyDb} = await supabase.from("tg_users").select("currency").eq("tg_id", ctx.from.id);

	const userCurrency = userCurrencyDb[0].currency;

	const priceField = getColumnName(userCurrency);

	await ctx.editMessageText('Получаем данные о монете...');

	try {
		const coinData = await getCoinData(coinValue, userCurrency);
		await supabase.from("coins").update({
			icon: coinData.icon,
			rank: coinData.rank,
			[priceField]: coinData.price,
			priceChange1h: coinData.priceChange1h,
			priceChange1d: coinData.priceChange1d,
			priceChange1w: coinData.priceChange1w,
		}).eq("coin_value", coinData.id)

		await ctx.editMessageText(`Данные по валюте <b>${coinData.name}</b>: \n\n🌏 Мировой рейтинг – <b>${coinData.rank}</b>\n\n🤑 Цена в ${userCurrency} – <b>${coinData.price.toFixed(4)}</b>\n📈 Изменения цены за <i>час</i> – <b>${coinData.priceChange1h}%</b>\n📈 Изменения цены за <i>день</i> – <b>${coinData.priceChange1d}</b>\n📈 Изменения цены за <i>неделю</i>– <b>${coinData.priceChange1w}</b>`, {
			reply_markup: mainKeyboard,
			parse_mode: 'HTML'
		})
	} catch (error) {
		console.log(error);
		await ctx.editMessageText('Произошла ошибка при получении данных о монете.', {
			reply_markup: mainKeyboard
		});
	}

});