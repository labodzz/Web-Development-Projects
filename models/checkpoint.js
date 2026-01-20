const Sequelize = require("sequelize");
const seq = require("../database");

const Checkpoint = seq.define("checkpoint", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  scenarioId: { type: Sequelize.INTEGER, allowNull: false },
  timestamp: { type: Sequelize.INTEGER, allowNull: false },
});

module.exports = Checkpoint;
