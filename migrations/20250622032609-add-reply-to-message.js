"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Messages", "replyToMessageId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Messages",
        key: "id",
      },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Messages", "replyToMessageId");
  },
};
