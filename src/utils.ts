import fetch from "node-fetch";
import {Stages, TelegramUserSessions} from "./models";

export class FetchingPriceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FetchingPriceError";
    }
}

export const fetchPrice = async () => {
    try {
        const result = await fetch('https://api1.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
        return await result.json()
    }
    catch (e: any) {
        return new FetchingPriceError(e.toString())
    }
}

export async function getRubPriceBinanceP2P() {
    const data = {
        "asset": "USDT",
        "fiat": "RUB",
        "page": 1,
        "publisherType": "merchant",
        "rows": 10,
        "payTypes": [
            "TinkoffNew"
        ],
        "tradeType": "SELL"
    };

    try {
        const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json();
        const parsedData = responseData.data;
        const filteredData = parsedData.filter((item: any) => parseFloat(item['adv']['minSingleTransAmount']) < 90000 && parseFloat(item['adv']['dynamicMaxSingleTransAmount']) >= 90000);
        return filteredData[0]['adv']['price'];
    } catch (e: any) {
        console.log('Exception', e)
        return new Error(e?.toString())
    }
}

export const createUserIfNotExists = async (chatId: number) => {
    const user = await TelegramUserSessions.findOne({
        where: {
            userId: chatId
        }
    }) as any;

    // Проверяем существует ли пользователь в базе, если нет, то создаем и задаем вопрос
    if(!user)
    {
        await TelegramUserSessions.create({
            userId: chatId,
        })
        return await TelegramUserSessions.findOne({
            where: {
                userId: chatId
            }
        }) as any;
    }
    return user;
}

export const formatNumber = (value: number, toFixedAmount = 2): string => {
    if (value === 0) return '0'
    if (parseFloat(value.toFixed(toFixedAmount)) === 0)
        return formatNumber(value, toFixedAmount + 1)
    return value.toFixed(toFixedAmount + 1)
}

function addCommas(nStr: string) {
    return nStr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function nFormatter(num: number, digits = 2) {
    const lookup = [
        { value: 1, symbol: '' },
        // { value: 1e3, symbol: 'K' },
        { value: 1e6, symbol: 'M' },
        { value: 1e9, symbol: 'G' },
        { value: 1e12, symbol: 'T' },
        { value: 1e15, symbol: 'P' },
        { value: 1e18, symbol: 'E' }
    ]
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
    const item = lookup
        .slice()
        .reverse()
        .find(function (item) {
            return num >= item.value
        })
    // if (item && item.symbol === 'K') return num.toFixed(digits)
    return item
        ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol
        : '0'
}

export const formatDollarAmount = (num: number, digits = 2): string => {
    const number = typeof num === 'string' ? parseFloat(num) : num
    if (number > 1000)
        return `${addCommas(
            nFormatter(parseFloat(formatNumber(number, digits - 1)))
        )}$`
    if (number > 0) return `${formatNumber(number, digits - 1)}$`
    return `${number}$`
}
