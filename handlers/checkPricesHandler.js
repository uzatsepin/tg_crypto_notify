import { Composer, InlineKeyboard } from "grammy";
import { getCoinData } from "../axios/getCoinData.js";
import { getColumnName, getSymbolForCurrency } from "../helpers/index.js";
import { mainKeyboard } from "../keyboards/index.js";
import { supabase } from "../supabase/index.js";
import { addCoinHandler } from "./addCoinHandler.js";

export const checkPricesHandler = new Composer();

checkPricesHandler.callbackQuery("cur_price", async (ctx) => {
	const {data: usersCoins} = await supabase.from("user_coins").select(`*, coin_id (*)`).eq("tg_id", ctx.from.id);

	if (!usersCoins || usersCoins.length === 0) {
		await ctx.editMessageText("Вы не отслеживаете ни одной монеты.", {
			reply_markup: mainKeyboard, parse_mode: "HTML",
		});
		return;
	}

	const coinsKeyboard = usersCoins.map((coin) => {
		return [coin.coin_id.coin_name, `price_${coin.coin_id.coin_value}`];
	});
	const buttonRow = coinsKeyboard.map(([label, data]) => InlineKeyboard.text(label, data));
	const rows = [];
	for (let i = 0; i < buttonRow.length; i += 2) {
		if (i + 1 < buttonRow.length) {
			rows.push([buttonRow[i], buttonRow[i + 1]]);
		} else {
			rows.push([buttonRow[i]]);
		}
	}
	rows.push([InlineKeyboard.text('🏠 Домой', 'home')]);
	const keyboard = InlineKeyboard.from(rows);
	await ctx.editMessageText("По какой валюте необходимо узнать цену? 👇", {
		reply_markup: keyboard,
	});
});

addCoinHandler.callbackQuery(/price_/, async (ctx) => {
	const data = ctx.callbackQuery.data;
	const coinValue = data.replace("price_", "");
	const {data: userCurrencyDb} = await supabase.from("tg_users").select("currency").eq("tg_id", ctx.from.id);
	const userCurrency = userCurrencyDb[0].currency;
	const priceField = getColumnName(userCurrency);
	await ctx.editMessageText("Получаем данные о монете...");

	try {
		const coinData = await getCoinData(coinValue);

		await supabase
			.from("coins")
			.update({
				icon: coinData.image.small,
				rank: coinData.market_cap_rank,
				price_uah: coinData.market_data.current_price.uah,
				price_usd: coinData.market_data.current_price.usd,
				price_eur: coinData.market_data.current_price.eur,
				high_24h: coinData.market_data.high_24h[priceField],
				low_24h: coinData.market_data.low_24h[priceField],
				price_change_percentage_24h: coinData.market_data.price_change_percentage_24h,
				price_change_percentage_7d: coinData.market_data.price_change_percentage_7d,
				price_change_percentage_14d: coinData.market_data.price_change_percentage_14d,
			})
			.eq("coin_value", coinData.id);

		await ctx.editMessageText(`Данные по валюте 👉 <b>${coinData.name}</b>:\n\n🌏 Мировой рейтинг 👉 <b>${coinData.market_cap_rank}</b>\n🤑 Цена в ${userCurrency} 👉 <b>${coinData.market_data.current_price[priceField]}${getSymbolForCurrency(userCurrency)}</b>\n🔥 Самая высокая цена за <i>час</i> 👉 <b>${coinData.market_data.high_24h[priceField].toFixed(3)}${getSymbolForCurrency(userCurrency)}</b>\n❄️Самая низкая цена за <i>день</i> 👉 <b>${coinData.market_data.low_24h[priceField].toFixed(3)}${getSymbolForCurrency(userCurrency)}</b>\n🌞 Изменения цены за <i>день</i> 👉 <b>${coinData.market_data.price_change_percentage_24h.toFixed(2)}%</b>\n📆 Изменения цены за <i>7 дней</i> 👉 <b>${coinData.market_data.price_change_percentage_7d.toFixed(2)}%</b>\n% Изменение цены за <i>14 дней</i> 👉 <b>${coinData.market_data.price_change_percentage_14d.toFixed(2)}%</b>`, {
			reply_markup: mainKeyboard, parse_mode: "HTML",
		},);
	} catch (error) {
		console.log(error);
		await ctx.editMessageText("Произошла ошибка при получении данных о монете.", {
			reply_markup: mainKeyboard,
		});
	}
});
