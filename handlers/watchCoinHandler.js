import { Composer } from "grammy"
import {formatNumber, getColumnName, getSymbolForCurrency} from "../helpers/index.js"
import { mainKeyboard } from "../keyboards/index.js"
import { supabase } from "../supabase/index.js"

export const watchCoinHandler = new Composer();

watchCoinHandler.callbackQuery("watch_list", async (ctx) => {
	const { data: coins } = await supabase.from("user_coins").select(`
        tg_id (*),
        coin_id (*)
    `).eq('tg_id', ctx.from.id);


	if (!coins || coins.length === 0) {
		await ctx.editMessageText("Вы не отслеживаете ни одной монеты.", {
			reply_markup: mainKeyboard,
			parse_mode: "HTML"
		});
		return;
	}

	const coinInfo = coins.map(({ coin_id, tg_id }) => {
		const lastPrice = coin_id.price_uah !== null ? coin_id.price_uah.toFixed(3) : "🤷‍♂️";
		const high_24h = coin_id.high_24h !== null ? coin_id.high_24h.toFixed(2) : "🤷‍♂️";
		const low_24h = coin_id.low_24h !== null ? coin_id.low_24h.toFixed(2) : "🤷‍♂️";
		const price_change_percentage_24h = coin_id.price_change_percentage_24h !== null ? coin_id.price_change_percentage_24h.toFixed(2) : "🤷‍♂️";
		const price_change_percentage_7d = coin_id.price_change_percentage_7d !== null ? coin_id.price_change_percentage_7d.toFixed(2) : "🤷‍♂️";
		const price_change_percentage_14d = coin_id.price_change_percentage_7d !== null ? coin_id.price_change_percentage_7d.toFixed(2) : "🤷‍♂️";
		return `\n<b>${coin_id.coin_name}</b> – последняя цена: ${formatNumber(lastPrice)}${lastPrice === null ? "" : ` ${getSymbolForCurrency(tg_id.currency)}`}\n\n⬆️ цена за день : ${high_24h} \n⬇️ цена за день: ${low_24h}\n 📝 Изменения за день: ${price_change_percentage_24h}%\n📆Изменения за 7 дней: ${price_change_percentage_7d}%\n💸Изменения за 14 дней: ${price_change_percentage_14d}`;
	}).join('\n ');

	await ctx.editMessageText(`<b>Вы отслеживаете такие монеты:</b> \n  ${coinInfo}\n`, {
		reply_markup: mainKeyboard,
		parse_mode: "HTML"
	});
});
