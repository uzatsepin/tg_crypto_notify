import { supabase } from "../supabase/index.js";

async function updateCoinData(coinData) {
	try {
		const { data, error } = await supabase
			.from('coins')
			.update({
				icon: coinData.image ? coinData.image.small : null,
				rank: coinData.market_data ? coinData.market_data.rank : null,
				price_uah: coinData.market_data ? coinData.market_data.current_price.uah : null,
				price_usd: coinData.market_data ? coinData.market_data.current_price.usd : null,
				price_eur: coinData.market_data ? coinData.market_data.current_price.eur : null,
				last_checked: new Date().toISOString(),
				high_24h: coinData.market_data ? coinData.market_data.high_24h.usd : null,
				low_24h: coinData.market_data ? coinData.market_data.low_24h.usd : null,
				price_change_percentage_24h: coinData.market_data ? coinData.market_data.price_change_percentage_24h : null,
				price_change_percentage_7d: coinData.market_data ? coinData.market_data.price_change_percentage_7d : null,
				price_change_percentage_14d: coinData.market_data ? coinData.market_data.price_change_percentage_14d : null
			})
			.eq('coin_value', coinData.id);

		if (error) {
			throw error;
		}

		return data;
	} catch (error) {
		console.error('Error updating coin data in Supabase:', error);
		throw error;
	}
}

export { updateCoinData }
