import {fetchPrice, formatDollarAmount} from "./utils";
import {TelegramUserSessions} from "./models";
import {bot} from "./index";
import {getReplyMarkup} from "./getReplyMarkup";
const cron = require('node-cron');

export const cron_task = cron.schedule('*/15 * * * * *', async () => {
    const fetchedPriceResult = await fetchPrice()

    if (fetchedPriceResult instanceof Error) {
        console.log(fetchedPriceResult.message)
        return
    }
    const price = fetchedPriceResult?.price

    const floatPrice = parseFloat(price)

    const users = await TelegramUserSessions.findAll()

    for (const user of users as any) {
        if (user.lowestPrice && price < user?.lowestPrice) {
            try {
                user.lowestPrice = null;
                await user.save();
                const reply_markup = await getReplyMarkup(user.userId)
                await bot.sendMessage(user.userId, `Курс преодолел нижнюю границу: *${formatDollarAmount(price)}$*!`, {
                    parse_mode: 'Markdown',
                    reply_markup: reply_markup
                });
            }
            catch (e) {
                console.log(e)
            }
        }
        if (user.highestPrice && price > user?.highestPrice) {
            try {
                user.highestPrice = null;
                await user.save();
                const reply_markup = await getReplyMarkup(user.userId)
                await bot.sendMessage(user.userId, `Курс преодолел верхнюю границу: *${formatDollarAmount(price)}$*!`, {
                    parse_mode: 'Markdown',
                    reply_markup: reply_markup
                });
            }
            catch (e) {
                console.log(e)
            }
        }
    }
});
