import {Composer, InlineKeyboard} from "grammy";
import {mainKeyboard} from "../keyboards/index.js";
import {supabase} from "../supabase/index.js";

export const addCoinHandler = new Composer();


addCoinHandler.callbackQuery("add_watch", async (ctx) => {
	const { data: coins } = await supabase.from("coins").select("*");

	const coinsKeyboard = coins.map((coin) => {
		return [coin.coin_name, `coin_${coin.coin_value}`];
	});

	const rows = [];
	for (let i = 0; i < coinsKeyboard.length; i += 2) {
		rows.push(
			coinsKeyboard.slice(i, i + 2).map(([label, data]) => InlineKeyboard.text(label, data))
		);
	}

	const keyboard = InlineKeyboard.from(rows);

	await ctx.editMessageText('Укажите, какую монету вы хотите добавить для отслеживания: 👇', {
		reply_markup: keyboard,
	});
});


addCoinHandler.callbackQuery(/coin_/, async (ctx) => {

	const data = ctx.callbackQuery.data;
	const coinValue = data.replace("coin_", "");

	const { data: coinData, error: coinError } = await supabase
		.from("coins")
		.select("coin_id")
		.eq("coin_value", coinValue)
		.single();

	if (coinError || !coinData) {
		await ctx.reply("Ошибка при получении данных о монете.");
		return;
	}

	const coinId = coinData.coin_id;

	const { data: userCoins, error: userCoinsError } = await supabase
		.from("user_coins")
		.select("*")
		.eq("tg_id", ctx.from.id)
		.eq("coin_id", coinId);

	if (userCoinsError) {
		await ctx.editMessageText("Ошибка при проверке данных.", {
			reply_markup: mainKeyboard
		});
		return;
	}

	if (userCoins.length > 0) {
		await ctx.editMessageText(`🙅‍♂️ Вы уже добавили эту монету.`, {
			reply_markup: mainKeyboard
		});
	} else {
		const { error: insertError } = await supabase
			.from("user_coins")
			.insert([{ tg_id: ctx.from.id, coin_id: coinId }]);

		if (insertError) {
			await ctx.editMessageText("☹️ Ошибка при добавлении монеты.", {
				reply_markup: mainKeyboard
			});
		} else {
			await ctx.editMessageText(`🫡 Теперь вы следите за монетой: <b>${coinValue}</b>`, {
				reply_markup: mainKeyboard,
				parse_mode: "HTML"
			});
		}
	}
});
