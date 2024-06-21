// priceChecker.js
import { supabase } from "../supabase/index.js";
import bot from '../bot.js';
import { getCoinData } from "../axios/getCoinData.js";

const cache = new Map();

async function getCachedCoinData(coinValue) {
	if (cache.has(coinValue)) {
		return cache.get(coinValue);
	}

	const coinData = await getCoinData(coinValue);
	cache.set(coinValue, coinData);

	setTimeout(() => cache.delete(coinValue), 600000);

	return coinData;
}

async function checkCoinPrices() {
	console.log('Started checked coin prices');
	try {
		const { data: userCoins, error: userCoinsError } = await supabase
			.from('user_coins')
			.select('tg_id, coin_id (coin_value), last_notified');

		if (userCoinsError) {
			throw new Error('Error fetching user coins data');
		}

		if (!userCoins || userCoins.length === 0) {
			console.log('No user coins found');
			return;
		}

		console.log('User coins data:', userCoins);

		const coinValues = [...new Set(userCoins.map(userCoin => userCoin.coin_id.coin_value))];

		const coinDataMap = {};
		await Promise.all(coinValues.map(async (coinValue) => {
			const coinData = await supabase
				.from('coins')
				.select('price_usd')
				.eq('coin_value', coinValue)
				.single();

			if (coinData.data && typeof coinData.data.price_usd === 'number') {
				coinDataMap[coinValue] = coinData.data.price_usd;
			} else {
				console.error(`Invalid data for coin: ${coinValue}`, coinData);
			}
		}));

		const now = new Date();
		const notificationsMap = new Map();

		await Promise.all(userCoins.map(async userCoin => {
			const { tg_id, coin_id, last_notified } = userCoin;
			const oldPrice = coinDataMap[coin_id.coin_value];
			const coinData = await getCachedCoinData(coin_id.coin_value);

			if (!coinData || typeof coinData.price !== 'number') {
				console.error(`No price data for coin: ${coin_id.coin_value}`);
				return;
			}

			const newPrice = coinData.price;
			const lastNotified = last_notified ? new Date(last_notified) : null;

			const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;
			console.log(`Price change for ${coin_id.coin_value}: ${priceChange}%`);

			if (Math.abs(priceChange) > 5 && (!lastNotified || (now - lastNotified) > 60 * 60 * 1000)) {
				if (!notificationsMap.has(tg_id)) {
					notificationsMap.set(tg_id, []);
				}
				notificationsMap.get(tg_id).push(`Цена монеты ${coin_id.coin_value} изменилась на ${priceChange.toFixed(2)}%. Новая цена: ${newPrice.toFixed(5)} $`);

				await supabase
					.from('user_coins')
					.update({ last_notified: now.toISOString() })
					.eq('tg_id', tg_id)
					.eq('coin_id', coin_id.coin_value);
			} else {
				console.log(`No significant price change for coin ${coin_id.coin_value}`);
			}
		}));

		for (const [tg_id, messages] of notificationsMap) {
			await bot.api.sendMessage(tg_id, messages.join('\n'));
		}
	} catch (error) {
		console.error('Error checking coin prices:', error);
	}
}

export { checkCoinPrices, getCachedCoinData };
