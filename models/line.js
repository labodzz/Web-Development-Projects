const Sequelize = require("sequelize");
const seq = require("../database");

const Line = seq.define("line", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  lineId: { type: Sequelize.INTEGER, allowNull: false },
  text: { type: Sequelize.TEXT, allowNull: true },
  nextLineId: { type: Sequelize.INTEGER, allowNull: true },
  scenarioId: { type: Sequelize.INTEGER, allowNull: false },
});

module.exports = Line;