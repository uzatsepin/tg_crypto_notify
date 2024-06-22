import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.API_COIN_GEKO) {
    throw new Error("API is not defined in the environment variables.");
}

const axiosInstance = axios.create({
    baseURL: process.env.API_URL_COIN_KEGO,
    method: "GET",
    headers: {
        accept: "application/json",
        "x-cg-demo-api-key": process.env.API_COIN_GEKO,
    },
});

export default axiosInstance;
