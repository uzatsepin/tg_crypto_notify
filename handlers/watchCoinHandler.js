import {Composer} from "grammy";
import {supabase} from "../supabase/index.js";
import {mainKeyboard} from "../keyboards/index.js";

export const watchCoinHandler = new Composer();

watchCoinHandler.callbackQuery("watch_list", async (ctx) => {
	const { data: coins } = await supabase.from("user_coins").select(`
        tg_id,
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

	const coinInfo = coins.map(({ coin_id }) => {
		const lastPrice = coin_id.price_usd !== null ? coin_id.price_usd.toFixed(3) : "Не получено";
		const priceChange1h = coin_id.priceChange1h !== null ? coin_id.priceChange1h.toFixed(2) : "Не получено";
		return `${coin_id.coin_name} – последняя цена: ${lastPrice !== null ? "" : "$"}${lastPrice}, изменения за час: ${priceChange1h}${priceChange1h !== null ? "" : '%'} `;
	}).join('\n👉 ');

	await ctx.editMessageText(`Вы отслеживаете такие монеты: \n\n👉 ${coinInfo}`, {
		reply_markup: mainKeyboard,
		parse_mode: "HTML"
	});
});
