const Sequelize = require("sequelize");
const seq = require("../database");

const Scenario = seq.define("scenario", {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: Sequelize.STRING, allowNull: false },
});

module.exports = Scenario;
