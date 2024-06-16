import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.API_KEY_COIN_STAT) {
	throw new Error('API_KEY_COIN_STAT is not defined in the environment variables.');
}

const axiosInstance = axios.create({
	baseURL: 'https://openapiv1.coinstats.app',
	headers: {
		accept: 'application/json',
		'X-API-KEY': process.env.API_KEY_COIN_STAT
	}
});

export default axiosInstance;
