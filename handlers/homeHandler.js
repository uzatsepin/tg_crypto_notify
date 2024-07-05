import {Composer} from "grammy";
import {mainKeyboard} from "../keyboards/index.js";

export const homeHandler = new Composer();

homeHandler.callbackQuery("home", async (ctx) => {
	await ctx.reply(`<b>${ctx.from.first_name}</b>, ты вернулся на главную страницу.\n\nВыбери необходимое действие 👇`, {
		reply_markup: mainKeyboard,
		parse_mode: "HTML"
	})
})
