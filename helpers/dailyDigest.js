import { supabase } from "../supabase/index.js";
import bot from "../bot.js";
import moment from "moment";
import { getColumnName, getSymbolForCurrency } from "./index.js";
import { mainKeyboard } from "../keyboards/index.js";

async function dailyDigest() {
	console.log('Daily Digest started');

	const currentDateWithOffset = moment().utcOffset(+3);
	const formattedDate = currentDateWithOffset.format('YYYY-MM-DD');

	try {
		const { data: userCoins, error: userCoinsError } = await supabase
			.from('user_coins')
			.select('tg_id (*), coin_id (*)');

		if (userCoinsError) {
			throw new Error('Error fetching user coins data');
		}

		if (!userCoins || userCoins.length === 0) {
			console.log('No user coins found');
			return;
		}

		const userCoinsMap = userCoins.reduce((acc, { tg_id, coin_id }) => {
			if (!acc[tg_id.tg_id]) {
				acc[tg_id.tg_id] = { user: tg_id, coins: [] };
			}
			acc[tg_id.tg_id].coins.push(coin_id);
			return acc;
		}, {});

		for (const [tgId, { user, coins }] of Object.entries(userCoinsMap)) {
			const digestMessage = coins.map(coin_id => {
				const priceField = getColumnName(user.currency);
				if (!priceField) return '';

				const price = coin_id[`price_${priceField}`];

				return `\n<b>🪙 ${coin_id.coin_name}</b>\n💵️ Цена: <b>${price !== null ? price : '🤷‍♂️'}${getSymbolForCurrency(priceField.toUpperCase())}</b>\n💸 Изменение цены за 24 часа 👉 <b>${coin_id.price_change_percentage_24h.toFixed(2)}%</b>`;
			}).join('\n');

			try {
				await bot.api.sendMessage(user.tg_id, `📝 Дайджест по вашим валютам на: <b>${formattedDate}</b> 👇\n${digestMessage}`, {
					reply_markup: mainKeyboard,
					parse_mode: "HTML"
				});
			} catch (sendError) {
				if (sendError.response && sendError.response.statusCode === 403) {
					console.log(`User ${user.tg_id} has blocked the bot or not subscribed.`);
				} else {
					console.log(`Failed to send message to user ${user.tg_id}:`, sendError);
				}
			}
		}

	} catch (e) {
		console.log(e);
	}
}

export { dailyDigest };
