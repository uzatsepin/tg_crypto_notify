import {Composer, InlineKeyboard} from "grammy";
import {mainKeyboard} from "../keyboards/index.js";
import {supabase} from "../supabase/index.js";

export const addCoinHandler = new Composer();

addCoinHandler.callbackQuery("add_watch", async (ctx) => {
	const userId = ctx.from.id;

	const { data: coins, error: coinsError } = await supabase.from("coins").select("*");
	if (coinsError) {
		console.error('Error fetching coins:', coinsError);
		await ctx.reply('Произошла ошибка при получении списка монет.');
		return;
	}

	const { data: userCoins, error: userCoinsError } = await supabase
		.from("user_coins")
		.select("coin_id")
		.eq("tg_id", userId);
	if (userCoinsError) {
		console.error('Error fetching user coins:', userCoinsError);
		await ctx.reply('Произошла ошибка при получении ваших монет.');
		return;
	}

	const userCoinIds = userCoins.map(userCoin => userCoin.coin_id);

	const coinsKeyboard = coins.map((coin) => {
		const label = userCoinIds.includes(coin.coin_id) ? `✅ ${coin.coin_name}` : coin.coin_name;
		return { text: label, callback_data: `coin_${coin.coin_value}` };
	});

	const keyboard = new InlineKeyboard();

	for (let i = 0; i < coinsKeyboard.length; i += 2) {
		if (i + 1 < coinsKeyboard.length) {
			keyboard.text(coinsKeyboard[i].text, coinsKeyboard[i].callback_data)
				.text(coinsKeyboard[i + 1].text, coinsKeyboard[i + 1].callback_data);
		} else {
			keyboard.text(coinsKeyboard[i].text, coinsKeyboard[i].callback_data);
		}
		keyboard.row();
	}

	await ctx.reply('Укажите, какую монету вы хотите добавить для отслеживания: 👇', {
		reply_markup: keyboard.text("🏠 Домой", "home")
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
		await ctx.reply("Ошибка при проверке данных.", {
			reply_markup: mainKeyboard
		});
		return;
	}

	if (userCoins.length > 0) {
		await ctx.reply(`🙅‍♂️ Вы уже добавили эту монету.`, {
			reply_markup: mainKeyboard
		});
	} else {
		const { error: insertError } = await supabase
			.from("user_coins")
			.insert([{ tg_id: ctx.from.id, coin_id: coinId }]);

		if (insertError) {
			await ctx.reply("☹️ Ошибка при добавлении монеты.", {
				reply_markup: mainKeyboard
			});
		} else {
			await ctx.reply(`🫡 Теперь вы следите за монетой: <b>${coinValue}</b>`, {
				reply_markup: mainKeyboard,
				parse_mode: "HTML"
			});
		}
	}
});
