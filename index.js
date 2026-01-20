const Scenario = require("./models/scenario");
const Line = require("./models/line");
const Delta = require("./models/delta");
const Checkpoint = require("./models/checkpoint");

Scenario.hasMany(Line, {
  foreignKey: "scenarioId",
  sourceKey: "id",
});
Line.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  targetKey: "id",
});

Scenario.hasMany(Delta, {
  foreignKey: "scenarioId",
  sourceKey: "id",
});
Delta.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  targetKey: "id",
});

Scenario.hasMany(Checkpoint, {
  foreignKey: "scenarioId",
  sourceKey: "id",
});
Checkpoint.belongsTo(Scenario, {
  foreignKey: "scenarioId",
  targetKey: "id",
});

module.exports = { Scenario, Line, Delta, Checkpoint };
