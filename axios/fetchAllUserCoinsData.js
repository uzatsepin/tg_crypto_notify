import { getUniqueCoinNames } from "../helpers/getUniqueCoinNames.js";
import { getCoinData } from "./getCoinData.js";
import { updateCoinData } from "../helpers/updateCoinData.js";

async function fetchAllCoinData() {
	const coinNames = await getUniqueCoinNames();
	console.log(coinNames);
	const limitPerMinute = 5;
	let currentIndex = 0;

	const fetchAndUpdate = async (coinId) => {
		try {
			const data = await getCoinData(coinId);
			await updateCoinData(data);
			console.log(`updated – ${coinId}`);
		} catch (error) {
			console.error(`Failed to fetch data for ${coinId}:`, error);
		}
	};

	const promises = [];
	const interval = setInterval(async () => {
		if (currentIndex >= coinNames.length) {
			clearInterval(interval);
			return;
		}

		const coinId = coinNames[currentIndex];
		currentIndex++;
		promises.push(fetchAndUpdate(coinId));
	}, (60 / limitPerMinute) * 1000);

	await new Promise(resolve => setTimeout(resolve, Math.ceil(coinNames.length / limitPerMinute) * 60 * 1000));

	await Promise.all(promises);
}

export { fetchAllCoinData }
