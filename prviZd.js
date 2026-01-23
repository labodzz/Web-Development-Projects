const express = require("express");
const { Op } = require("sequelize");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const seq = require("./database");
const { Scenario, Line, Delta, Checkpoint } = require(".");

const lineLocksByKey = new Map();
const lineLockByUser = new Map();
const characterLocksByKey = new Map();

app.post("/api/scenarios", async (req, res) => {
  let naslov =
    req.body.title && req.body.title.trim()
      ? req.body.title
      : "Neimenovani scenarij";

  try {
    const scenario = await Scenario.create({ title: naslov });

    await Line.create({
      lineId: 1,
      text: "",
      nextLineId: null,
      scenarioId: scenario.id,
    });

    const newScenario = {
      id: scenario.id,
      title: scenario.title,
      content: [{ lineId: 1, nextLineId: null, text: "" }],
    };

    res.status(200).json(newScenario);
  } catch (err) {
    res.status(500).json({ message: "Greška pri kreiranju scenarija." });
  }
});

app.post("/api/scenarios/:scenarioId/lines/:lineId/lock", async (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const lineId = Number(req.params.lineId);
  const userId = req.body.userId;
  const uid = String(userId);

  if (!Number.isInteger(scenarioId) || !Number.isInteger(lineId)) {
    return res
      .status(400)
      .json({ message: "Neispravan scenarioId ili lineId." });
  }
  if (!userId || uid.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nedostaje userId u tijelu zahtjeva." });
  }

  try {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const line = await Line.findOne({
      where: { scenarioId, lineId },
    });
    if (!line) {
      return res.status(404).json({ message: "Linija ne postoji!" });
    }

    const lockKey = `${scenarioId}:${lineId}`;
    const existingUser = lineLocksByKey.get(lockKey);
    if (existingUser && existingUser !== uid) {
      return res.status(409).json({ message: "Linija je vec zakljucana!" });
    }

    if (existingUser && existingUser === uid) {
      return res
        .status(200)
        .json({ message: "Linija je uspjesno zakljucana!" });
    }

    const previous = lineLockByUser.get(uid);
    if (previous) {
      const prevKey = `${previous.scenarioId}:${previous.lineId}`;
      const prevUser = lineLocksByKey.get(prevKey);
      if (prevUser === uid) {
        lineLocksByKey.delete(prevKey);
      }
    }

    lineLocksByKey.set(lockKey, uid);
    lineLockByUser.set(uid, { scenarioId, lineId });
    return res.status(200).json({ message: "Linija je uspjesno zakljucana!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Greška pri zaključavanju linije." });
  }
});

app.put("/api/scenarios/:scenarioId/lines/:lineId", async (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const lineId = Number(req.params.lineId);
  const userId = req.body.userId;
  const uid = String(userId);
  const newTextArr = req.body.newText;

  if (!Number.isInteger(scenarioId) || !Number.isInteger(lineId)) {
    return res
      .status(400)
      .json({ message: "Neispravan scenarioId ili lineId." });
  }
  if (!userId || uid.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nedostaje userId u tijelu zahtjeva." });
  }
  if (!Array.isArray(newTextArr) || newTextArr.length === 0) {
    return res
      .status(400)
      .json({ message: "Niz new_text ne smije biti prazan!" });
  }

  try {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const allLines = await Line.findAll({
      where: { scenarioId },
      order: [["lineId", "ASC"]],
    });

    const currentLine = allLines.find((l) => l.lineId === lineId);
    if (!currentLine) {
      return res.status(404).json({ message: "Linija ne postoji!" });
    }

    const lockKey = `${scenarioId}:${lineId}`;
    const lockedBy = lineLocksByKey.get(lockKey);
    if (!lockedBy) {
      return res.status(409).json({ message: "Linija nije zakljucana!" });
    }
    if (lockedBy !== uid) {
      return res.status(409).json({ message: "Linija je vec zakljucana!" });
    }

    const wrapText = (text) => {
      const str = typeof text === "string" ? text : String(text ?? "");
      const words = str.trim().length ? str.trim().split(/\s+/) : [];
      if (words.length === 0) return [""];
      const chunks = [];
      for (let i = 0; i < words.length; i += 20) {
        chunks.push(words.slice(i, i + 20).join(" "));
      }
      return chunks;
    };

    const originalNext = currentLine.nextLineId ?? null;
    const maxLineId = allLines.reduce(
      (max, l) => (l.lineId > max ? l.lineId : max),
      0,
    );
    let nextId = maxLineId + 1;

    const resultingChunks = [];
    newTextArr.forEach((t) => {
      const chunks = wrapText(t);
      resultingChunks.push(...chunks);
    });

    const newText = resultingChunks[0] ?? "";

    const extraChunks = resultingChunks.slice(1);
    const newLines = extraChunks.map((txt) => ({
      lineId: nextId++,
      nextLineId: null,
      text: txt,
    }));

    if (newLines.length > 0) {
      currentLine.nextLineId = newLines[0].lineId;
      for (let i = 0; i < newLines.length; i++) {
        newLines[i].nextLineId =
          i === newLines.length - 1 ? originalNext : newLines[i + 1].lineId;
      }
    } else {
      currentLine.nextLineId = originalNext;
    }

    currentLine.text = newText;
    await currentLine.save();

    for (const nl of newLines) {
      await Line.create({
        lineId: nl.lineId,
        text: nl.text,
        nextLineId: nl.nextLineId,
        scenarioId,
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    await Delta.create({
      scenarioId,
      type: "line_update",
      lineId: currentLine.lineId,
      nextLineId: currentLine.nextLineId ?? null,
      content: currentLine.text,
      timestamp,
    });

    for (const nl of newLines) {
      await Delta.create({
        scenarioId,
        type: "line_update",
        lineId: nl.lineId,
        nextLineId: nl.nextLineId ?? null,
        content: nl.text,
        timestamp,
      });
    }

    const current = lineLockByUser.get(uid);
    if (
      current &&
      current.scenarioId === scenarioId &&
      current.lineId === lineId
    ) {
      lineLockByUser.delete(uid);
    }
    const stillLockedBy = lineLocksByKey.get(lockKey);
    if (stillLockedBy === uid) {
      lineLocksByKey.delete(lockKey);
    }

    return res.status(200).json({ message: "Linija je uspjesno azurirana!" });
  } catch (err) {
    return res.status(500).json({ message: "Greška pri ažuriranju linije." });
  }
});

app.post("/api/scenarios/:scenarioId/characters/lock", async (req, res) => {
  let scenarioId = Number(req.params.scenarioId);
  let userId = req.body.userId;
  let characterName = req.body.characterName;
  const uid = String(userId);
  if (!Number.isInteger(scenarioId)) {
    return res.status(400).json({ message: "Neispravan scenarioId." });
  }
  if (!userId || uid.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nedostaje userId u tijelu zahtjeva." });
  }
  if (!characterName || `${characterName}`.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nedostaje characterName u tijelu zahtjeva." });
  }

  try {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const key = `${scenarioId}:${String(characterName)}`;
    if (characterLocksByKey.has(key)) {
      return res
        .status(409)
        .json({ message: "Konflikt! Ime lika je vec zakljucano!" });
    }

    characterLocksByKey.set(key, uid);
    return res
      .status(200)
      .json({ message: "Ime lika je uspjesno zakljucano!" });
  } catch (err) {
    return res.status(500).json({ message: "Greška pri zaključavanju lika." });
  }
});

app.post("/api/scenarios/:scenarioId/characters/update", async (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const userId = req.body.userId;
  const oldName = req.body.oldName;
  const newName = req.body.newName;
  const uid = String(userId);

  if (!Number.isInteger(scenarioId)) {
    return res.status(400).json({ message: "Neispravan scenarioId." });
  }
  if (!userId || uid.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nedostaje userId u tijelu zahtjeva." });
  }
  if (
    !oldName ||
    `${oldName}`.trim() === "" ||
    !newName ||
    `${newName}`.trim() === ""
  ) {
    return res
      .status(400)
      .json({ message: "Nedostaju oldName ili newName u tijelu zahtjeva." });
  }

  try {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const charKey = `${scenarioId}:${oldName}`;
    const lockedBy = characterLocksByKey.get(charKey);
    if (!lockedBy) {
      return res.status(409).json({ message: "Ime lika nije zakljucano!" });
    }
    if (lockedBy !== uid) {
      return res.status(409).json({ message: "Ime lika je vec zakljucano!" });
    }

    const allLines = await Line.findAll({
      where: { scenarioId },
    });

    for (const line of allLines) {
      const before = line.text;
      if (typeof before !== "string") continue;
      if (before.includes(oldName)) {
        const after = before.split(oldName).join(newName);
        if (after !== before) {
          line.text = after;
          await line.save();
        }
      }
    }

    const timestamp = Math.floor(Date.now() / 1000);
    await Delta.create({
      scenarioId,
      type: "char_rename",
      oldName,
      newName,
      timestamp,
    });

    const still = characterLocksByKey.get(charKey);
    if (still === uid) {
      characterLocksByKey.delete(charKey);
    }

    return res
      .status(200)
      .json({ message: "Ime lika je uspjesno promijenjeno!" });
  } catch (err) {
    return res.status(500).json({ message: "Greška pri ažuriranju lika." });
  }
});

app.get("/api/scenarios/:scenarioId", async (req, res) => {
  let scenarioId = Number(req.params.scenarioId);

  try {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const lines = await Line.findAll({
      where: { scenarioId },
      attributes: ["lineId", "nextLineId", "text"],
    });

    const content = lines.map((l) => ({
      lineId: l.lineId,
      nextLineId: l.nextLineId,
      text: l.text || "",
    }));

    const lineMap = new Map();
    for (const line of content) {
      lineMap.set(line.lineId, line);
    }

    const orderedContent = [];
    let currentLine = lineMap.get(1);
    while (currentLine) {
      orderedContent.push(currentLine);
      if (currentLine.nextLineId === null) break;
      currentLine = lineMap.get(currentLine.nextLineId);
      if (!currentLine) break;
    }

    for (const line of content) {
      if (!orderedContent.find((l) => l.lineId === line.lineId)) {
        orderedContent.push(line);
      }
    }

    res.status(200).json({
      id: scenario.id,
      title: scenario.title,
      content: orderedContent,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Greška pri dohvaćanju scenarija." });
  }
});

seq.sync({ force: true }).then(() => {
  console.log("Tabele su kreirane!");
  app.listen(3000, () => {
    console.log("Server radi na portu 3000");
  });
});

app.get("/api/scenarios/:scenarioId/deltas", async (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const sinceParam = req.query.since;
  const since = Number(sinceParam);

  if (!Number.isInteger(scenarioId)) {
    return res.status(400).json({ message: "Neispravan scenarioId." });
  }
  const sinceTs = Number.isFinite(since) ? since : 0;

  try {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const deltasRaw = await Delta.findAll({
      where: {
        scenarioId,
        timestamp: { [Op.gt]: sinceTs },
      },
      order: [["timestamp", "ASC"]],
    });

    const allLines = await Line.findAll({
      where: { scenarioId },
    });
    const lineMap = new Map();
    for (const l of allLines) {
      lineMap.set(l.lineId, l);
    }

    const result = [];
    for (const entry of deltasRaw) {
      if (entry.type === "line_update" || entry.type === "update") {
        let nextLineId = entry.nextLineId ?? null;
        const lineObj = lineMap.get(entry.lineId);
        if (lineObj) nextLineId = lineObj.nextLineId ?? null;

        result.push({
          type: "line_update",
          lineId: entry.lineId,
          nextLineId,
          content:
            typeof entry.content === "string"
              ? entry.content
              : String(entry.content ?? ""),
          timestamp: entry.timestamp,
        });
      } else if (
        entry.type === "char_rename" ||
        entry.type === "character_rename"
      ) {
        result.push({
          type: "char_rename",
          oldName: entry.oldName,
          newName: entry.newName,
          timestamp: entry.timestamp,
        });
      }
    }

    return res.status(200).json({ deltas: result });
  } catch (err) {
    return res.status(500).json({ message: "Greška pri dohvaćanju delti." });
  }
});

app.post("/api/scenarios/:scenarioId/checkpoint", async (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const userId = req.body.userId;

  if (!Number.isInteger(scenarioId)) {
    return res.status(400).json({ message: "Neispravan scenarioId." });
  }

  try {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    await Checkpoint.create({
      scenarioId,
      timestamp,
    });
    return res.status(200).json({ message: "Checkpoint je uspjesno kreiran!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Greška pri kreiranju checkpointa." });
  }
});

app.get("/api/scenarios/:scenarioId/checkpoints", async (req, res) => {
  const scenarioId = Number(req.params.scenarioId);

  if (!Number.isInteger(scenarioId)) {
    return res.status(400).json({ message: "Neispravan scenarioId." });
  }

  try {
    const scenario = await Scenario.findByPk(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenario ne postoji!" });
    }

    const checkpoints = await Checkpoint.findAll({
      where: { scenarioId },
      attributes: ["id", "timestamp"],
    });
    return res.status(200).json(checkpoints);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Greška pri dohvaćanju checkpointa." });
  }
});

app.get(
  "/api/scenarios/:scenarioId/restore/:checkpointId",
  async (req, res) => {
    const scenarioId = Number(req.params.scenarioId);
    const checkpointId = Number(req.params.checkpointId);

    if (!Number.isInteger(scenarioId)) {
      return res.status(400).json({ message: "Neispravan scenarioId." });
    }
    if (!Number.isInteger(checkpointId)) {
      return res.status(400).json({ message: "Neispravan checkpointId." });
    }

    try {
      const scenario = await Scenario.findByPk(scenarioId);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario ne postoji!" });
      }

      const checkpoint = await Checkpoint.findOne({
        where: { id: checkpointId, scenarioId },
      });

      if (!checkpoint) {
        return res.status(404).json({ message: "Checkpoint ne postoji!" });
      }

      const checkpointTimestamp = checkpoint.timestamp;

      const restoredScenario = {
        id: scenarioId,
        title: scenario.title || "Neimenovani scenarij",
        content: [{ lineId: 1, nextLineId: null, text: "" }],
      };

      const deltasRaw = await Delta.findAll({
        where: {
          scenarioId,
          timestamp: { [Op.lte]: checkpointTimestamp },
        },
        order: [["timestamp", "ASC"]],
      });

      for (const delta of deltasRaw) {
        if (delta.type === "line_update" || delta.type === "update") {
          const lineId = delta.lineId;
          const content =
            typeof delta.content === "string"
              ? delta.content
              : String(delta.content ?? "");
          const nextLineId = delta.nextLineId ?? null;

          const existingIndex = restoredScenario.content.findIndex(
            (l) => l.lineId === lineId,
          );
          if (existingIndex !== -1) {
            restoredScenario.content[existingIndex].text = content;
            restoredScenario.content[existingIndex].nextLineId = nextLineId;
          } else {
            restoredScenario.content.push({
              lineId,
              nextLineId,
              text: content,
            });
          }
        } else if (
          delta.type === "char_rename" ||
          delta.type === "character_rename"
        ) {
          const oldName = delta.oldName;
          const newName = delta.newName;
          for (const line of restoredScenario.content) {
            if (typeof line.text === "string" && line.text.includes(oldName)) {
              line.text = line.text.split(oldName).join(newName);
            }
          }
        }
      }

      const orderedContent = [];
      const lineMap = new Map();
      for (const line of restoredScenario.content) {
        lineMap.set(line.lineId, line);
      }

      let currentLine = lineMap.get(1);
      while (currentLine) {
        orderedContent.push(currentLine);
        if (currentLine.nextLineId === null) break;
        currentLine = lineMap.get(currentLine.nextLineId);
        if (!currentLine) break;
      }

      for (const line of restoredScenario.content) {
        if (!orderedContent.find((l) => l.lineId === line.lineId)) {
          orderedContent.push(line);
        }
      }

      restoredScenario.content = orderedContent;

      return res.status(200).json(restoredScenario);
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Greška pri restauriranju checkpointa." });
    }
  },
);
