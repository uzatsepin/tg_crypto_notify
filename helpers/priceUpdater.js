import { supabase } from "../supabase/index.js";
import { getCachedCoinData } from './priceChecker.js';
import bot from "../bot.js";
import moment from 'moment';

async function updateCoinPrices() {
	console.log('Updating coin prices');
	try {
		const { data: coins, error: coinsError } = await supabase.from('coins').select('coin_value, price_usd');
		if (coinsError) {
			throw new Error('Error fetching coins data');
		}

		const coinValues = coins.map(coin => coin.coin_value);

		const coinDataMap = {};
		await Promise.all(coinValues.map(async (coinValue) => {
			const coinData = await getCachedCoinData(coinValue);
			console.log(`Retrieved data for ${coinValue}:`, coinData);

			if (coinData && typeof coinData.price === 'number') {
				coinDataMap[coinValue] = coinData;
			} else {
				console.error(`Invalid data for coin: ${coinValue}`, coinData);
			}
		}));

		const now = new Date().toISOString();

		for (const coin of coins) {
			const coinData = coinDataMap[coin.coin_value];
			if (coinData && typeof coinData.price === 'number') {
				await supabase
					.from('coins')
					.update({ price_usd: coinData.price, last_checked: now })
					.eq('coin_value', coin.coin_value);
			}
		}

		await bot.api.sendMessage('138387567', `✅ Произошло обновление цен в базе. Время: ${moment(now).format('YYYY-MM-DD HH:mm:ss')}`);
	} catch (error) {
		console.error('Error updating coin prices:', error);
	}
}

export { updateCoinPrices };
