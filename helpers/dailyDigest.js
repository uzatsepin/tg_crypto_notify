import moment from "moment";
import bot from "../bot.js";
import { mainKeyboard } from "../keyboards/index.js";
import { supabase } from "../supabase/index.js";
import { getColumnName, getSymbolForCurrency } from "./index.js";

async function dailyDigest() {
	console.log('Daily Digest started');

	const currentDateWithOffset = moment().utcOffset(+3);
	const formattedDate = currentDateWithOffset.format('YYYY-MM-DD HH:mm:ss');

	console.log(formattedDate)

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

		let successCount = 0;
		let blockedUsers = [];

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
				successCount++;
			} catch (sendError) {
				if (sendError && sendError.error_code === 400) {
					blockedUsers.push(user);
					// await bot.api.sendMessage('138387567', `Пользователь ${user.tg_id} – ${user.username} заблокировал бота или не подписан на него.`);
				} else {
					console.log(`Failed to send message to user ${user.tg_id}:`, sendError);
					// await bot.api.sendMessage('138387567', `Ошибка отправки сообщения пользователю ${user.tg_id} – ${user.username}, ${sendError}`);
				}
			}
		}

		const resultMessage = `Сообщение успешно отправлено ${successCount} пользователям. ${blockedUsers.length} пользователей заблокировали бота или не подписаны на него.`;

		const { error: insertError } = await supabase
			.from('daily_digest_log')
			.insert([{
				date: formattedDate,
				message: resultMessage,
				sent_count: successCount,
				not_sent_count: blockedUsers.length
			}]);

		if (insertError) {
			throw new Error('Error inserting daily digest log');
		}

		await bot.api.sendMessage('138387567', resultMessage)

	} catch (e) {
		console.log(e);
	}
}



export { dailyDigest };
