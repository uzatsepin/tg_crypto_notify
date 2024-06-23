import { supabase } from "../supabase/index.js";

async function getUniqueCoinNames() {
	try {
		const { data, error } = await supabase
			.from('user_coins')
			.select('coin_id (*)');

		if (error) {
			throw error;
		}

		return Array.from(new Set(data.map(item => item.coin_id.coin_value)));
	} catch (error) {
		console.error('Error fetching unique coin names:', error);
		throw error;
	}
}

export { getUniqueCoinNames }
