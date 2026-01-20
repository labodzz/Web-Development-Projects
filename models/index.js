const Scenario = require("./scenario");
const Line = require("./line");
const Delta = require("./delta");
const Checkpoint = require("./checkpoint");

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
