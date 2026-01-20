const Sequelize = require("sequelize");

const seq = new Sequelize("wt26", "root", "password", {
  host: "localhost",
  dialect: "mysql",
});
module.exports = seq;
