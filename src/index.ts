import TelegramBot, {CallbackQuery, Message} from "node-telegram-bot-api";
import {createUserIfNotExists, fetchPrice, formatDollarAmount, getRubPriceBinanceP2P} from "./utils";
import {initialize_models, Stages, TelegramUserSessions} from "./models";
import {cron_task} from "./cron";
import {getReplyMarkup} from "./getReplyMarkup";

require('dotenv').config();

const token = process.env.API_TOKEN as string;

export const bot = new TelegramBot(token, {polling: true});

initialize_models()
cron_task.start()

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const reply_markup = await getReplyMarkup(chatId)

    bot.sendMessage(chatId, "Пользуйся на здоровье!", {reply_markup: reply_markup});
});

bot.on('message', async (msg: Message) => {
    const chatId = msg.chat.id;

    const fetchedPriceResult = await fetchPrice()

    if (fetchedPriceResult instanceof Error) {
        bot.sendMessage(chatId, `Упс, у нас ошибочка :( \n\n${fetchedPriceResult.message}`)
        return
    }
    const price = fetchedPriceResult?.price
    const floatPrice = parseFloat(price)

    if (msg.text?.toLowerCase() === 'обновить') {
        const p2pPriceResult = await getRubPriceBinanceP2P()

        if (p2pPriceResult instanceof Error) {
            bot.sendMessage(chatId, `Упс, у нас ошибочка :( \n\n${p2pPriceResult.message}`)
            return
        }
        const reply_markup = await getReplyMarkup(chatId)

        bot.sendMessage(chatId, `Курс доллара по P2P Binance: *${p2pPriceResult}₽*\n\nКурс BTC-USDT: *${formatDollarAmount(floatPrice)}*`, {
            parse_mode: 'Markdown',
            reply_markup: reply_markup
        });
    } else {
        const user = await createUserIfNotExists(chatId)
        const userStage = user?.stage
        const message = msg.text as any

        const messageAsFloat = parseFloat(message)

        if (userStage === Stages.enterLowestPrice) {
            if (isNaN(messageAsFloat))
                bot.sendMessage(chatId, "Введите число!", {reply_markup: undefined});
            else if (messageAsFloat > floatPrice) {
                bot.sendMessage(chatId, "Нижняя граница не может быть больше текущей цены!", {reply_markup: undefined});
            } else {
                user.stage = null
                user.lowestPrice = messageAsFloat
                await user.save();
                const reply_markup = await getReplyMarkup(chatId)
                bot.sendMessage(chatId, "Обновил нижнюю границу!", {reply_markup: reply_markup});
            }
        } else if (userStage === Stages.enterHighestPrice) {
            if (isNaN(messageAsFloat)) {
                bot.sendMessage(chatId, "Введите число!", {reply_markup: undefined});
            } else if (messageAsFloat < floatPrice) {
                bot.sendMessage(chatId, "Верхняя граница не может быть меньше текущей цены!", {reply_markup: undefined });
            } else {
                user.stage = null
                user.highestPrice = messageAsFloat
                await user.save();
                const reply_markup = await getReplyMarkup(chatId)
                bot.sendMessage(chatId, "Обновил верхнюю границу!", {reply_markup: reply_markup});
            }
        } else if (msg?.text?.toLowerCase().includes('установить нижнюю границу')) {
            bot.sendMessage(chatId, "Введите нижнюю границу", {reply_markup: undefined});
            user.stage = Stages.enterLowestPrice
            await user.save();
        } else if (msg?.text?.toLowerCase().includes('установить верхнюю границу')) {
            bot.sendMessage(chatId, "Введите верхнюю границу", {reply_markup: undefined});
            user.stage = Stages.enterHighestPrice
            await user.save();
        }
    }
});

