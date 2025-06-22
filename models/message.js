// models/message.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      // Optionally define self-association if you want to include replied message content
      Message.belongsTo(models.Message, {
        foreignKey: "replyToMessageId",
        as: "repliedMessage",
      });
    }
  }
  Message.init(
    {
      userId: DataTypes.STRING,
      name: DataTypes.STRING,
      profileImageUrl: DataTypes.STRING,
      message: DataTypes.TEXT,
      timestamp: DataTypes.DATE,
      replyToMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Message",
    }
  );
  return Message;
};
