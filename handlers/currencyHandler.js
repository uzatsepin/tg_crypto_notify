import {Composer, InlineKeyboard} from "grammy";
import {addCoinHandler} from "./addCoinHandler.js";
import {supabase} from "../supabase/index.js";
import {mainKeyboard} from "../keyboards/index.js";

export const currencyHandler = new Composer();

currencyHandler.callbackQuery('currency', async (ctx) => {
	const currency = [
		['USD', `currency_USD`],
		['EUR', 'currency_EUR'],
		['UAH', 'currency_UAH'],
	]

	const buttonRow = currency.map(([label,data]) => InlineKeyboard.text(label, data))
	const keyboard = InlineKeyboard.from([buttonRow])

	try {

		const {data: currency} = await supabase.from("tg_users").select("currency").eq("tg_id", ctx.from.id);

		await ctx.editMessageText(`Сейчас выбарнная вами валюта – <b>💲${currency[0].currency}</b>, она установлена по умолчанию. \n\nВыберите валюту: 👇`, {
			reply_markup: keyboard,
			parse_mode: 'HTML'
		})

	} catch (e) {
		console.log(e);
	}


})

addCoinHandler.callbackQuery(/currency_/, async (ctx) => {
	const data = ctx.callbackQuery.data;
	const currencyValue = data.replace("currency_", "");

	try {
		await supabase.from("tg_users").update({currency: currencyValue}).eq("tg_id", ctx.from.id);

		await ctx.editMessageText(`Валюта успешно изменена на <b>${currencyValue}</b>`, {
			reply_markup: mainKeyboard,
			parse_mode: 'HTML'
		})
	} catch (e) {
		console.log(e);
	}
});
