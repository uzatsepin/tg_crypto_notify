import { fetchAllCoinData } from "../axios/fetchAllUserCoinsData.js";
import bot from "../bot.js";
import moment from "moment";

async function updateCoinPrices() {
	const now = new Date().toISOString();
	fetchAllCoinData()
		.then(() => {
			bot.api.sendMessage('138387567', `✅ Произошло обновление цен в базе. Время: ${moment(now).format('YYYY-MM-DD HH:mm:ss')}`);
		})
		.catch(err => {
			bot.api.sendMessage('138387567', `❌ Ошибка обновления цен в базе. ${err}`);
		});
}

export { updateCoinPrices }
