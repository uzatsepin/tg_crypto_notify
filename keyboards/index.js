import { InlineKeyboard } from "grammy"

export const mainKeyboard = new InlineKeyboard().
		text('📋 Мой список', 'watch_list').
		text('➕ Добавить валюту', 'add_watch').row().
		text('➖ Удалить валюту', 'remove_watch').
		text('📊 Текущие цены', 'cur_price').row().
		text('💲 Валюта', 'currency').row()