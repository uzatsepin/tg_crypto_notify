import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.API_KEY_COIN_STAT) {
	throw new Error('API_KEY_COIN_STAT is not defined in the environment variables.');
}

const axiosInstance = axios.create({
	baseURL: 'https://api.coingecko.com/api/v3/',
	method: 'GET',
	headers: {
		accept: 'application/json',
		'x-cg-demo-api-key': 'CG-44n14TDCKJf1Uu8uZqMK18Ed'
	}
});

export default axiosInstance;
