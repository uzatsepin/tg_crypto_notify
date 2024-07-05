import {Composer, InlineKeyboard} from "grammy";
import {addCoinHandler} from "./addCoinHandler.js";
import {supabase} from "../supabase/index.js";
import {mainKeyboard} from "../keyboards/index.js";

export const currencyHandler = new Composer();

currencyHandler.callbackQuery('currency', async (ctx) => {
	const currency = [
		['USD', 'currency_USD', '💲'],
		['EUR', 'currency_EUR', '💶'],
		['UAH', 'currency_UAH', '₴'],
	]

	try {
		const { data: userCurrencyData } = await supabase.from("tg_users").select("currency").eq("tg_id", ctx.from.id);
		const userCurrency = userCurrencyData[0].currency;

		const coinsKeyboard = currency.map(([label, data, emoji]) => {
			const labelWithEmoji = userCurrency === label ? `🟢 ${label}` : label;
			return { text: labelWithEmoji, callback_data: data };
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

		await ctx.reply(`Сейчас выбранная вами валюта – <b>🟢 ${userCurrency}</b>, она установлена по умолчанию. \n\nВыберите валюту: 👇`, {
			reply_markup: keyboard,
			parse_mode: 'HTML'
		});
	} catch (e) {
		console.log(e);
	}
});

addCoinHandler.callbackQuery(/currency_/, async (ctx) => {
	const data = ctx.callbackQuery.data;
	const currencyValue = data.replace("currency_", "");

	try {
		await supabase.from("tg_users").update({currency: currencyValue}).eq("tg_id", ctx.from.id);

		await ctx.reply(`Валюта успешно изменена на <b>${currencyValue}</b>`, {
			reply_markup: mainKeyboard,
			parse_mode: 'HTML'
		})
	} catch (e) {
		console.log(e);
	}
});
