const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fs = require("fs");
const path = require("path");

const scenariosDir = path.join(__dirname, "data", "scenarios");
const locksPath = path.join(__dirname, "data", "locks.json");

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

  res.status(201).json(newScenario);
});

app.post("/api/scenarios/:scenarioId/lines/:lineId/lock", (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const lineId = Number(req.params.lineId);
  const userId = req.body.userId;

  if (!Number.isInteger(scenarioId) || !Number.isInteger(lineId)) {
    return res
      .status(400)
      .json({ message: "Neispravan scenarioId ili lineId." });
  }
  if (!userId || `${userId}`.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nedostaje userId u tijelu zahtjeva." });
  }

  const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);
  if (!fs.existsSync(scenarioPath)) {
    return res.status(404).json({ message: "Scenarij nije pronađen." });
  }

  const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
  const line = scenarioData.content.find((l) => l.lineId === lineId);
  if (!line) {
    return res
      .status(404)
      .json({ message: "Linija nije pronađena u scenariju." });
  }

  let locks = [];
  if (fs.existsSync(locksPath)) {
    try {
      locks = JSON.parse(fs.readFileSync(locksPath, "utf8"));
      if (!Array.isArray(locks)) locks = [];
    } catch (_) {
      locks = [];
    }
  }

  const existing = locks.find(
    (lk) => lk.scenarioId === scenarioId && lk.lineId === lineId
  );

  if (existing && `${existing.userId}` !== `${userId}`) {
    return res
      .status(409)
      .json({ message: "Linija je već zaključana od drugog korisnika." });
  }

  if (existing && `${existing.userId}` === `${userId}`) {
    locks = locks.filter(
      (lk) =>
        !(
          lk.scenarioId === scenarioId &&
          lk.lineId === lineId &&
          `${lk.userId}` === `${userId}`
        )
    );
  } else {
    locks = locks.filter((lk) => `${lk.userId}` !== `${userId}`);
    locks.push({ scenarioId, lineId, userId });
  }

  fs.writeFileSync(locksPath, JSON.stringify(locks, null, 2));
  return res.status(200).json({ message: "Linija je uspješno zaključana." });
});

app.put("/api/scenarios/:scenarioId/lines/:lineId", (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const lineId = Number(req.params.lineId);
  const userId = req.body.userId;
  const newTextArr = req.body.newText;

  if (!Number.isInteger(scenarioId) || !Number.isInteger(lineId)) {
    return res
      .status(400)
      .json({ message: "Neispravan scenarioId ili lineId." });
  }
  if (!userId || `${userId}`.trim() === "") {
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

  // Locks validation
  let locks = [];
  if (fs.existsSync(locksPath)) {
    try {
      locks = JSON.parse(fs.readFileSync(locksPath, "utf8"));
      if (!Array.isArray(locks)) locks = [];
    } catch (_) {
      locks = [];
    }
  }

  const lockEntry = locks.find(
    (lk) => lk.scenarioId === scenarioId && lk.lineId === lineId
  );

  if (!lockEntry) {
    return res.status(409).json({ message: "Linija nije zakljucana!" });
  }
  if (`${lockEntry.userId}` !== `${userId}`) {
    return res.status(409).json({ message: "Linija je vec zakljucana!" });
  }

  // Helper to wrap text into chunks of 20 words
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

  const deltaEntry = {
    scenarioId,
    lineId,
    userId,
    timestamp: Math.floor(Date.now() / 1000),
    type: "line_update",
    oldText,
    newLines: [
      { lineId, text: currentLine.text },
      ...newLines.map((nl) => ({ lineId: nl.lineId, text: nl.text })),
    ],
  };
  deltas.push(deltaEntry);
  fs.writeFileSync(deltasPath, JSON.stringify(deltas, null, 2));

  locks = locks.filter(
    (lk) =>
      !(
        lk.scenarioId === scenarioId &&
        lk.lineId === lineId &&
        `${lk.userId}` === `${userId}`
      )
  );
  fs.writeFileSync(locksPath, JSON.stringify(locks, null, 2));

  return res.status(200).json({ message: "Linija je uspjesno azurirana!" });
});

app.post("/api/scenarios/:scenarioId/characters/lock", (req, res) => {
  let scenarioId = Number(req.params.scenarioId);
  let userId = req.body.userId;
  let characterName = req.body.characterName;
  let pathFile = path.join(__dirname, "data", "locks.json");
  let locks = [];

  fs.readFile(pathFile, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Greška pri čitanju datoteke." });
    }
    if (data) {
      try {
        locks = JSON.parse(data);
        if (!Array.isArray(locks)) locks = [];
      } catch (_) {
        locks = [];
      }
    }
    if (
      fs.existsSync(
        path.join(__dirname, "data", "scenarios", `scenario-${scenarioId}.json`)
      ) === false
    ) {
      return res.status(404).json({ message: "Scenarij ne postoji!" });
    }

    const existingLock = locks.find(
      (lock) =>
        lock.scenarioId === scenarioId && lock.characterName === characterName
    );

    if (existingLock) {
      return res
        .status(409)
        .json({ message: "Konflikt! Ime lika je vec zakljucano!" });
    }

    locks.push({ scenarioId, userId, characterName });
    fs.writeFile(pathFile, JSON.stringify(locks, null, 2), (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Greška pri pisanju datoteke." });
      }
      return res
        .status(200)
        .json({ message: "Ime lika je uspjesno zakljucano!" });
    });
  });
});

app.post("/api/scenarios/:scenarioId/characters/update", (req, res) => {
  const scenarioId = Number(req.params.scenarioId);
  const userId = req.body.userId;
  const oldName = req.body.oldName;
  const newName = req.body.newName;

  if (!Number.isInteger(scenarioId)) {
    return res.status(400).json({ message: "Neispravan scenarioId." });
  }
  if (!userId || `${userId}`.trim() === "") {
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

  const upperRegex = /^[A-ZČĆŽŠĐ]+$/;
  if (!upperRegex.test(oldName) || !upperRegex.test(newName)) {
    return res
      .status(400)
      .json({ message: "Ime lika mora biti velikim slovima!" });
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

  const locksFile = path.join(__dirname, "data", "locks.json");
  let locks = [];
  if (fs.existsSync(locksFile)) {
    try {
      const raw = fs.readFileSync(locksFile, "utf8");
      locks = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(locks)) locks = [];
    } catch (_) {
      locks = [];
    }
  }
  const charLock = locks.find(
    (lk) => lk.scenarioId === scenarioId && lk.characterName === oldName
  );
  if (!charLock) {
    return res.status(409).json({ message: "Ime lika nije zakljucano!" });
  }
  if (`${charLock.userId}` !== `${userId}`) {
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

  let changedLines = [];
  for (let i = 0; i < scenarioObj.content.length; i++) {
    const line = scenarioObj.content[i];
    const before = line.text;
    if (typeof before !== "string") continue;
    if (before.includes(oldName)) {
      const after = before.split(oldName).join(newName);
      if (after !== before) {
        line.text = after;
        changedLines.push({
          lineId: line.lineId,
          oldText: before,
          newText: after,
        });
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
    userId,
    timestamp: Math.floor(Date.now() / 1000),
    type: "char_rename",
    oldName,
    newName,
    changedLines,
  });
  try {
    fs.writeFileSync(deltasPath, JSON.stringify(deltas, null, 2));
  } catch (e) {}

  try {
    locks = locks.filter(
      (lk) =>
        !(
          lk.scenarioId === scenarioId &&
          lk.characterName === oldName &&
          `${lk.userId}` === `${userId}`
        )
    );
    fs.writeFileSync(locksFile, JSON.stringify(locks, null, 2));
  } catch (_) {}

  return res.status(200).json({ message: "Ime lika je uspjesno azurirano!" });
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
    res.send(objects);
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

  const scenarioPath = path.join(scenariosDir, `scenario-${scenarioId}.json`);
  let scenarioObj = null;
  if (fs.existsSync(scenarioPath)) {
    try {
      scenarioObj = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
    } catch (_) {
      scenarioObj = null;
    }
  }

  const result = [];
  for (const entry of deltasRaw) {
    if (entry.scenarioId !== scenarioId) continue;
    if (!(typeof entry.timestamp === "number" && entry.timestamp > sinceTs))
      continue;

    if (entry.type === "line_update" || entry.type === "update") {
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
          content: ln.text,
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
