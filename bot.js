import { Bot } from 'grammy';
import dotenv from 'dotenv';
import {mainKeyboard} from "./keyboards/index.js";
import { addCoinHandler} from "./handlers/addCoinHandler.js";
import { hydrate } from "@grammyjs/hydrate";
import {supabase} from "./supabase/index.js";
import {watchCoinHandler} from "./handlers/watchCoinHandler.js";
import {currencyHandler} from "./handlers/currencyHandler.js";
import {checkPricesHandler} from "./handlers/checkPricesHandler.js";
import {deleteWatchHandler} from "./handlers/deleteWatchHandler.js";
import cron from "node-cron";
import {getCoinData} from "./axios/getCoinData.js";

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN);

bot.use(addCoinHandler)
bot.use(watchCoinHandler)
bot.use(currencyHandler)
bot.use(checkPricesHandler)
bot.use(deleteWatchHandler)
bot.use(hydrate())

const cache = new Map();

async function getCachedCoinData(coinValue) {
    if (cache.has(coinValue)) {
        return cache.get(coinValue);
    }

    const coinData = await getCoinData(coinValue);
    cache.set(coinValue, coinData);

    // Удаление из кэша через 10 минут
    setTimeout(() => cache.delete(coinValue), 600000);

    return coinData;
}


bot.command('start', async (ctx) => {
    try {

        let {data: tgUser} = await supabase.from('tg_users').select('*').eq('tg_id', (String(ctx.from.id)))

        if(!tgUser.length) {

            await supabase.from('tg_users').insert({
                tg_id: String(ctx.from.id),
                is_bot: ctx.from.is_bot,
                first_name: ctx.from.first_name,
                username: ctx.from.username,
                language_code: ctx.from.language_code,
                is_premium: ctx.from.is_premium,
            });

            await ctx.reply(`Приветствую в нашем телеграмм боте, <b>${ctx.from.first_name}</b>.\n\nТут ты можешь добавить монеты для отслеживания.`, {
                reply_markup: mainKeyboard,
                parse_mode: "HTML"
            })

        } else {
            await ctx.reply(`Рады видеть вас снова, <b>${ctx.from.first_name}</b>.\n\nМожете воспользоваться клавиатурой для выбора необходимого действия.`, {
                reply_markup: mainKeyboard,
                parse_mode: "HTML"
            })
        }

    } catch (error) {
        console.log(error);
    }
});

async function checkCoinPrices() {
    console.log('Schedule started');
    try {
        const { data: userCoins, error: userCoinsError } = await supabase
            .from('user_coins')
            .select('tg_id, coin_id (coin_value, price_usd)');

        if (userCoinsError) {
            throw new Error('Error fetching user coins data');
        }

        if (!userCoins || userCoins.length === 0) return;

        // Собираем все уникальные значения coin_value
        const coinValues = [...new Set(userCoins.map(userCoin => userCoin.coin_id.coin_value))];

        // Получаем данные о всех монетах параллельно
        const coinDataMap = {};
        await Promise.all(coinValues.map(async (coinValue) => {
            const coinData = await getCachedCoinData(coinValue);
            console.log(`Retrieved data for ${coinValue}:`, coinData); // Логирование данных

            if (coinData && typeof coinData.price === 'number') { // Проверка структуры данных
                coinDataMap[coinValue] = coinData;
            } else {
                console.error(`Invalid data for coin: ${coinValue}`, coinData);
            }
        }));

        // Обработка изменений цен и отправка уведомлений
        const tasks = userCoins.map(async userCoin => {
            const { tg_id, coin_id } = userCoin;
            const currentPrice = coin_id.price_usd;
            const coinData = coinDataMap[coin_id.coin_value];

            if (!coinData || typeof coinData.price !== 'number') { // Проверка структуры данных
                console.error(`No price data for coin: ${coin_id.coin_value}`);
                return;
            }

            const newPrice = coinData.price; // Проверка структуры данных

            if (currentPrice === null || currentPrice === 0) {
                console.log(`First time tracking price for coin ${coin_id.coin_value}. Setting initial price.`);
                await supabase
                    .from('user_coins')
                    .update({ price_usd: newPrice })
                    .eq('tg_id', tg_id)
                    .eq('coin_id', coin_id.coin_id);
                return;
            }

            const priceChange = ((newPrice - currentPrice) / currentPrice) * 100;

            if (Math.abs(priceChange) > 5) { // Уведомление при изменении цены более чем на 5%
                await supabase
                    .from('user_coins')
                    .update({ price_usd: newPrice })
                    .eq('tg_id', tg_id)
                    .eq('coin_id', coin_id.coin_id);

                await bot.telegram.sendMessage(tg_id, `Цена монеты ${coin_id.coin_value} изменилась на ${priceChange.toFixed(2)}%. Новая цена: $${newPrice.toFixed(3)}`);
            }
        });

        await Promise.all(tasks);
    } catch (error) {
        console.error('Error checking coin prices:', error);
    }
}

bot.on("message", async (ctx) => {
    await checkCoinPrices()
})

cron.schedule('*/20 * * * *', checkCoinPrices);

bot.catch((err) => console.error(err));

bot.start();
