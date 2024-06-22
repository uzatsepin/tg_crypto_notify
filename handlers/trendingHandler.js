import { Composer } from "grammy";
import { getCoinsTrends } from "../axios/getCoinsTrends.js";
import { formatNumber, getSymbolForCurrency } from "../helpers/index.js";
import { mainKeyboard } from "../keyboards/index.js";

export const trendsHandler = new Composer();

trendsHandler.callbackQuery('trends', async (ctx) => {
	const { coins } = await getCoinsTrends();
	const coinsTrend = coins.map(el => el.item)

	const trendsMessage = coinsTrend.map(item => {
		const coinName = item.name;
		const coinMarketCapRank = item.market_cap_rank;
		const coinChangePricePersentage = item.data.price_change_percentage_24h.usd.toFixed(2)
		const coinTotalVolume = item.data.total_volume;
		const coinPrice = item.data.price.toFixed(7)

		return `\n🪙 Название монеты: <b>${coinName}</b>\n📈 Рейтинг в CoinMarketCap: <b>${coinMarketCapRank}</b>\n🚀 Рост за 24 часа: <b>${coinChangePricePersentage}%</b>\n💰 Капитализация: <b>${coinTotalVolume}</b>\n💵 Цена в USD: <b>${coinPrice}</b>`
	}).join('\n');

	await ctx.reply(`<b>Вот список трендовых монет на сегодня:</b> 👇 \n ${trendsMessage}`, {
		reply_markup: mainKeyboard,
		parse_mode: "HTML"
	})


})
