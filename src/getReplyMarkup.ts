import {initialize_models, TelegramUserSessions} from "./models";
import {formatDollarAmount} from "./utils";

initialize_models()

const default_reply_markup = {
    keyboard: [
        [
            {
                text: 'Обновить',
            },
        ],
        [
            {
                text: 'Установить верхнюю границу 📈'
            },
        ],
        [
            {
                text: 'Установить нижнюю границу 📉'
            }
        ]
    ],
    resize_keyboard: true
}

export const getReplyMarkup = async (chatId: number) => {
    const user = await TelegramUserSessions.findOne({
        where: {
            userId: chatId
        }
    }) as any;

    if (!user) return default_reply_markup

    const {lowestPrice, highestPrice} = user


    return {
        keyboard: [
            [
                {
                    text: 'Обновить',
                },
            ],
            [
                {
                    text: `Установить верхнюю границу ${highestPrice ? `(${formatDollarAmount(highestPrice)}) ` : ''}📈`
                },
            ],
            [
                {
                    text: `Установить нижнюю границу ${lowestPrice ? `(${formatDollarAmount(lowestPrice)}) ` : ''}📉`
                }
            ]
        ],
        resize_keyboard: true
    }
}
