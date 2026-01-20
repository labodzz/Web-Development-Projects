const Sequelize = require("sequelize");
const seq = require("../database");

const Delta = seq.define("delta", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  scenarioId: { type: Sequelize.INTEGER, allowNull: false },
  type: { type: Sequelize.STRING, allowNull: false },
  lineId: { type: Sequelize.INTEGER, allowNull: true },
  nextLineId: { type: Sequelize.INTEGER, allowNull: true },
  content: { type: Sequelize.TEXT, allowNull: true },
  oldName: { type: Sequelize.STRING, allowNull: true },
  newName: { type: Sequelize.STRING, allowNull: true },
  timestamp: { type: Sequelize.INTEGER, allowNull: false },
});

module.exports = Delta;
