import { Composer } from "grammy"
import { getColumnName, getSymbolForCurrency } from "../helpers/index.js"
import { mainKeyboard } from "../keyboards/index.js"
import { supabase } from "../supabase/index.js"

export const watchCoinHandler = new Composer();

watchCoinHandler.callbackQuery("watch_list", async (ctx) => {
	const { data: coins } = await supabase.from("user_coins").select(`
        tg_id (*),
        coin_id (
            coin_name,
            price_eur,
            price_uah,
            price_usd,
            coin_value,
            priceChange1d,
            priceChange1h,
            priceChange1w
        )
    `).eq('tg_id', ctx.from.id);


	if (!coins || coins.length === 0) {
		await ctx.editMessageText("Вы не отслеживаете ни одной монеты.", {
			reply_markup: mainKeyboard,
			parse_mode: "HTML"
		});
		return;
	}

	const coinInfo = coins.map(({ coin_id, tg_id }) => {
		// console.log(tg_id.currency);
		console.log(coin_id);
		const selectedCurrency = getColumnName(tg_id.currency);
		const lastPrice = coin_id[selectedCurrency] !== null ? coin_id[selectedCurrency].toFixed(3) : "Не получено";
		const priceChange1h = coin_id.priceChange1h !== null ? coin_id.priceChange1h.toFixed(2) : "Не получено";
		return `\n<b>${coin_id.coin_name}</b> – последняя цена: ${lastPrice}${lastPrice === null ? "" : getSymbolForCurrency(tg_id.currency)}, изменения за час: ${priceChange1h}${priceChange1h === null ? "" : "$"} `;
	}).join('\n👇 ');

	await ctx.editMessageText(`<b>Вы отслеживаете такие монеты:</b> \n\n👇  ${coinInfo}`, {
		reply_markup: mainKeyboard,
		parse_mode: "HTML"
	});
});
