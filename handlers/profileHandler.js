import {Composer, InlineKeyboard} from "grammy";
import {supabase} from "../supabase/index.js";
import percentNotify from "../helpers/percentNotify.js";
import {mainKeyboard} from "../keyboards/index.js";

export const profileHandler = new Composer();

profileHandler.callbackQuery('profile', async (ctx) => {

	const userPercent = await percentNotify(ctx.from.id)


	const keyboard = new InlineKeyboard().
		text('💲 Валюта', 'currency').
		text(`🔢 % оповещения (${userPercent}%)`, 'percent').row().
		text('🏠 Домой', 'home')

	await ctx.reply(`${ctx.from.first_name}, ты зашел в режим настроек. \n\n⚙️ Выбери что ты хотел бы настроить`, {
		reply_markup: keyboard,
		parse_mode: "HTML"
	});
})


export async function getPercentFromUser(conversation, ctx) {

	const tgId = await ctx.update.callback_query.from.id;
	const percentFromDb = await percentNotify(ctx.from.id)

	await ctx.reply(`Укажи при каком % (проценте) измененения цены тебе должно приходить уведомление?\n\nСейчас установлено по умолчанию – ${percentFromDb}`)
	const newPercent = await conversation.form.number();

	try {
		await supabase.from("tg_users").update({percent_notify: newPercent}).eq("tg_id", tgId)
		await ctx.reply(`Успешно указано новое значение % оповещения об изменении цены. \n\nТеперь, если цена монет изменится более чем на <b>${newPercent}%</b>, вам придет уведомление.`, {
			reply_markup: mainKeyboard,
			parse_mode: 'HTML'
		})

	} catch (e) {
		console.error(`Произошла ошибка при изменении % оповещения в базе данных.`)
	}
}


profileHandler.callbackQuery('percent', async (ctx) => {
	await ctx.conversation.enter("getPercentFromUser")
})


