import axios from './index.js';


export async function getCoinsTrends() {
	try {
		const { data } = await axios.get(`/search/trending`);
		return data;
	} catch (error) {
		console.error('Error fetching coin data:', error);
		throw error;
	}
}
