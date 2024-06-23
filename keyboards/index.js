import { InlineKeyboard } from "grammy"

export const mainKeyboard = new InlineKeyboard().
		text('📋 Мой список', 'watch_list').
		text('📊 Текущие цены', 'cur_price').row().
		text('➕ Добавить валюту', 'add_watch').
		text('➖ Удалить валюту', 'remove_watch').row().
		text('📈 Тренды', 'trends')

