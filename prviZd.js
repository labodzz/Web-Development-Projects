const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const fs = require("fs");
const path = require("path");

const scenariosDir = path.join(__dirname, "data", "scenarios");

const lineLocksByKey = new Map();
const lineLockByUser = new Map();
const characterLocksByKey = new Map();

if (!fs.existsSync(scenariosDir))
  fs.mkdirSync(scenariosDir, { recursive: true });

app.post("/api/scenarios", (req, res) => {
  let naslov =
    req.body.title && req.body.title.trim()
      ? req.body.title
      : "Neimenovani scenarij";

  const files = fs.readdirSync(scenariosDir);
  let maxId = 0;
  files.forEach((file) => {
    const match = file.match(/scenario-(\d+)\.json/);
    if (match) {
      const id = parseInt(match[1]);
      if (id > maxId) maxId = id;
    }
  });
  const newId = maxId + 1;

  const newScenario = {
    id: newId,
    title: naslov,
    content: [{ lineId: 1, nextLineId: null, text: "" }],
  };

  const filePath = path.join(scenariosDir, `scenario-${newId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(newScenario, null, 2));

  res.status(200).json(newScenario);
});

app.post("/api/scenarios/:scenarioId/lines/:lineId/lock", (req, res) => {
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

  const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);
  if (!fs.existsSync(scenarioPath)) {
    return res.status(404).json({ message: "Scenario ne postoji!" });
  }

  const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
  const line = scenarioData.content.find((l) => l.lineId === lineId);
  if (!line) {
    return res.status(404).json({ message: "Linija ne postoji!" });
  }

  const lockKey = `${scenarioId}:${lineId}`;
  const existingUser = lineLocksByKey.get(lockKey);
  if (existingUser && existingUser !== uid) {
    return res.status(409).json({ message: "Linija je vec zakljucana!" });
  }

  if (existingUser && existingUser === uid) {
    return res.status(200).json({ message: "Linija je uspjesno zakljucana!" });
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
});

app.put("/api/scenarios/:scenarioId/lines/:lineId", (req, res) => {
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

  const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);
  if (!fs.existsSync(scenarioPath)) {
    return res.status(404).json({ message: "Scenario ne postoji!" });
  }

  const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
  if (!scenarioData || !Array.isArray(scenarioData.content)) {
    return res.status(404).json({ message: "Scenario ne postoji!" });
  }

  const currentIndex = scenarioData.content.findIndex(
    (l) => l.lineId === lineId
  );
  if (currentIndex === -1) {
    return res.status(404).json({ message: "Linija ne postoji!" });
  }

  const currentLine = scenarioData.content[currentIndex];

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
  const maxLineId = scenarioData.content.reduce(
    (max, l) => (l.lineId > max ? l.lineId : max),
    0
  );
  let nextId = maxLineId + 1;

  const resultingChunks = [];
  newTextArr.forEach((t) => {
    const chunks = wrapText(t);
    resultingChunks.push(...chunks);
  });

  const oldText = currentLine.text;
  currentLine.text = resultingChunks[0] ?? "";

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

  if (newLines.length > 0) {
    scenarioData.content.splice(currentIndex + 1, 0, ...newLines);
  }

  fs.writeFileSync(scenarioPath, JSON.stringify(scenarioData, null, 2));

  const deltasPath = path.join(__dirname, "data", "deltas.json");
  let deltas = [];
  if (fs.existsSync(deltasPath)) {
    try {
      const raw = fs.readFileSync(deltasPath, "utf8");
      deltas = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(deltas)) deltas = [];
    } catch (_) {
      deltas = [];
    }
  }

  const timestamp = Math.floor(Date.now() / 1000);

  deltas.push({
    scenarioId,
    type: "line_update",
    lineId: currentLine.lineId,
    nextLineId: currentLine.nextLineId ?? null,
    content: currentLine.text,
    timestamp,
  });

  for (const nl of newLines) {
    deltas.push({
      scenarioId,
      type: "line_update",
      lineId: nl.lineId,
      nextLineId: nl.nextLineId ?? null,
      content: nl.text,
      timestamp,
    });
  }
  fs.writeFileSync(deltasPath, JSON.stringify(deltas, null, 2));

  // Unlock (RAM)
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
});

app.post("/api/scenarios/:scenarioId/characters/lock", (req, res) => {
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

  if (!fs.existsSync(path.join(scenariosDir, `scenario-${scenarioId}.json`))) {
    return res.status(404).json({ message: "Scenario ne postoji!" });
  }

  const key = `${scenarioId}:${String(characterName)}`;
  if (characterLocksByKey.has(key)) {
    return res
      .status(409)
      .json({ message: "Konflikt! Ime lika je vec zakljucano!" });
  }

  characterLocksByKey.set(key, uid);
  return res.status(200).json({ message: "Ime lika je uspjesno zakljucano!" });
});

app.post("/api/scenarios/:scenarioId/characters/update", (req, res) => {
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

  const scenarioPath = path.join(
    __dirname,
    "data",
    "scenarios",
    `scenario-${scenarioId}.json`
  );
  if (!fs.existsSync(scenarioPath)) {
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

  let scenarioObj;
  try {
    scenarioObj = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
  } catch (e) {
    return res.status(500).json({ message: "Greška pri čitanju datoteke." });
  }
  if (!scenarioObj || !Array.isArray(scenarioObj.content)) {
    return res.status(404).json({ message: "Scenario ne postoji!" });
  }

  for (let i = 0; i < scenarioObj.content.length; i++) {
    const line = scenarioObj.content[i];
    const before = line.text;
    if (typeof before !== "string") continue;
    if (before.includes(oldName)) {
      const after = before.split(oldName).join(newName);
      if (after !== before) {
        line.text = after;
      }
    }
  }

  try {
    fs.writeFileSync(scenarioPath, JSON.stringify(scenarioObj, null, 2));
  } catch (e) {
    return res.status(500).json({ message: "Greška pri pisanju datoteke." });
  }

  const deltasPath = path.join(__dirname, "data", "deltas.json");
  let deltas = [];
  if (fs.existsSync(deltasPath)) {
    try {
      const raw = fs.readFileSync(deltasPath, "utf8");
      deltas = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(deltas)) deltas = [];
    } catch (_) {
      deltas = [];
    }
  }
  deltas.push({
    scenarioId,
    type: "char_rename",
    oldName,
    newName,
    timestamp: Math.floor(Date.now() / 1000),
  });
  try {
    fs.writeFileSync(deltasPath, JSON.stringify(deltas, null, 2));
  } catch (e) {}

  const still = characterLocksByKey.get(charKey);
  if (still === uid) {
    characterLocksByKey.delete(charKey);
  }

  return res
    .status(200)
    .json({ message: "Ime lika je uspjesno promijenjeno!" });
});

app.get("/api/scenarios/:scenarioId", (req, res) => {
  let scenarioId = Number(req.params.scenarioId);
  let filePath = path.join(
    __dirname,
    "data",
    "scenarios",
    `scenario-${scenarioId}.json`
  );
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Scenario ne postoji!" });
  }
  let objects = [];
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Greška pri čitanju datoteke." });
    }

    if (data) {
      try {
        objects = JSON.parse(data);
      } catch (e) {
        return res
          .status(500)
          .json({ message: "Greška pri parsiranju JSON-a." });
      }
    }
    res.status(200).json(objects);
  });
});

app.listen(3000, () => {
  console.log("Server radi na portu 3000");
});

app.get("/api/scenarios/:scenarioId/deltas", (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const sinceParam = req.query.since;
  const since = Number(sinceParam);

  if (!Number.isInteger(scenarioId)) {
    return res.status(400).json({ message: "Neispravan scenarioId." });
  }
  const sinceTs = Number.isFinite(since) ? since : 0;

  const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);
  if (!fs.existsSync(scenarioPath)) {
    return res.status(404).json({ message: "Scenario ne postoji!" });
  }

  const deltasPath = path.join(__dirname, "data", "deltas.json");
  let deltasRaw = [];
  if (fs.existsSync(deltasPath)) {
    try {
      const raw = fs.readFileSync(deltasPath, "utf8");
      deltasRaw = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(deltasRaw)) deltasRaw = [];
    } catch (_) {
      deltasRaw = [];
    }
  }

  let scenarioObj = null;
  try {
    scenarioObj = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
  } catch (_) {
    scenarioObj = null;
  }

  const result = [];
  for (const entry of deltasRaw) {
    if (entry.scenarioId !== scenarioId) continue;
    if (!(typeof entry.timestamp === "number" && entry.timestamp > sinceTs))
      continue;

    if (entry.type === "line_update" || entry.type === "update") {
      if (typeof entry.lineId === "number" && "content" in entry) {
        let nextLineId = entry.nextLineId ?? null;
        if (scenarioObj && Array.isArray(scenarioObj.content)) {
          const lineObj = scenarioObj.content.find(
            (l) => l.lineId === entry.lineId
          );
          if (lineObj) nextLineId = lineObj.nextLineId ?? null;
        }
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
        continue;
      }

      const changed = Array.isArray(entry.newLines) ? entry.newLines : [];
      for (const ln of changed) {
        let nextLineId = null;
        if (scenarioObj && Array.isArray(scenarioObj.content)) {
          const lineObj = scenarioObj.content.find(
            (l) => l.lineId === ln.lineId
          );
          if (lineObj) nextLineId = lineObj.nextLineId ?? null;
        }
        result.push({
          type: "line_update",
          lineId: ln.lineId,
          nextLineId,
          content:
            typeof ln.text === "string" ? ln.text : String(ln.text ?? ""),
          timestamp: entry.timestamp,
        });
      }
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

  result.sort((a, b) => a.timestamp - b.timestamp);
  return res.status(200).json({ deltas: result });
});
