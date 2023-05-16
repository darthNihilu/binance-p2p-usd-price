import {DataTypes, Sequelize} from "sequelize";

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite',
});

export const Stages = {
    enterLowestPrice: 'enterLowestPrice',
    enterHighestPrice: 'enterHighestPrice'
}

export const TelegramUserSessions = sequelize.define('UserStages', {
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    stage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lowestPrice: {
        type: DataTypes.STRING,
    },
    highestPrice: {
        type: DataTypes.STRING,
    },
});

export const initialize_models = async () => {
    await TelegramUserSessions.sync();
}
