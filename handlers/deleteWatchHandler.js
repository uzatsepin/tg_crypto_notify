import { supabase } from "../supabase/index.js";
import { Composer, InlineKeyboard } from "grammy";
import { mainKeyboard } from "../keyboards/index.js";

export const deleteWatchHandler = new Composer();

deleteWatchHandler.callbackQuery('remove_watch', async (ctx) => {
	const {data: usersCoins} = await supabase.from("user_coins").select(`*, coin_id (*)`).eq("tg_id", ctx.from.id);

	if (!usersCoins || usersCoins.length === 0) {
		await ctx.editMessageText("Вы не отслеживаете ни одной монеты.", {
			reply_markup: mainKeyboard,
			parse_mode: "HTML"
		});
		return;
	}

	const coinsKeyboard = usersCoins.map((coin) => {
		return [coin.coin_id.coin_name, `remove_${coin.coin_id.coin_value}`];
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

	await ctx.editMessageText('Какую валюту вы хотите удалить из отслеживания? 👇', {
		reply_markup: keyboard,
	})
});

deleteWatchHandler.callbackQuery(/remove_/, async (ctx) => {
	console.log('we are here')
	const data = ctx.callbackQuery.data;
	const coinValue = data.replace("remove_", "");

	// Получаем coin_id по значению валюты
	const {data: coinData, error: coinError} = await supabase
		.from("coins")
		.select("coin_id")
		.eq("coin_value", coinValue)

	if (coinError || !coinData) {
		await ctx.editMessageText("Ошибка при получении данных о монете.", {
			reply_markup: mainKeyboard
		});
		return;
	}

	const coinId = coinData[0].coin_id;


	// Удаляем валюту из отслеживания
	const {error: deleteError} = await supabase
		.from("user_coins")
		.delete()
		.eq("tg_id", ctx.from.id)
		.eq("coin_id", coinId);

	if (deleteError) {
		await ctx.editMessageText("Ошибка при удалении валюты из отслеживания.", {
			reply_markup: mainKeyboard
		});
	} else {
		await ctx.editMessageText(`Валюта успешно удалена из отслеживания.\n\nМожете добавить другую монету`, {
			reply_markup: mainKeyboard
		});
	}
});
