import axios from './index.js';


export async function getCoinData(coinName, currency = 'USD') {
	try {
		const { data } = await axios.get(`/coins/${coinName}?currency=${currency}`);
		return data;
	} catch (error) {
		console.error('Error fetching coin data:', error);
		throw error;
	}
}
