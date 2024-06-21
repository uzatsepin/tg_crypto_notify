import axios from './index.js';


export async function getCoinData(coinId) {
	try {
		const { data } = await axios.get(`/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
		return data;
	} catch (error) {
		console.error('Error fetching coin data:', error);
		throw error;
	}
}
