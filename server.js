let express = require("express");
let app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let fs = require("fs");
let path = require("path");

app.post("/api/scenarios", (req, res) => {
  let scenario = req.body;
  let naslov = scenario.title || "Neimenovani scenarij";

  fs.readFile(
    path.join(__dirname, "scenarij.json"),
    "utf8",
    (err, fileData) => {
      if (err) {
        return res.status(500).send("Greška pri čitanju fajla");
      }

      let objects = [];
      if (fileData && fileData.trim().length > 0) {
        try {
          objects = JSON.parse(fileData);
          if (!Array.isArray(objects)) objects = [];
        } catch (_) {
          objects = [];
        }
      }

      const lastId =
        objects.length > 0 ? objects[objects.length - 1].id || 0 : 0;

      const data = {
        id: lastId + 1,
        title: naslov,
        content: { lineId: 1, text: "", nextLineId: null },
      };

      objects.push(data);

      fs.writeFile(
        path.join(__dirname, "scenarij.json"),
        JSON.stringify(objects, null, 2),
        (err) => {
          if (err) return res.status(500).send("Error saving scenario");
          res.status(201).json(data);
        }
      );
    }
  );
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
  if (userId === undefined || userId === null || `${userId}`.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nedostaje userId u tijelu zahtjeva." });
  }

  const locksPath = path.join(__dirname, "locks.json");
  const scenariosPath = path.join(__dirname, "scenarij.json");

  fs.readFile(scenariosPath, "utf8", (sErr, sData) => {
    if (sErr) {
      if (sErr.code === "ENOENT") {
        return res.status(404).json({ message: "Nema scenarija." });
      }
      return res.status(500).json({ message: "Greška pri čitanju scenarija." });
    }

    let scenariji = [];
    try {
      scenariji = JSON.parse(sData);
      if (!Array.isArray(scenariji)) scenariji = [];
    } catch (_) {
      scenariji = [];
    }

    const scenario = scenariji.find((s) => s.id === scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: "Scenarij nije pronađen." });
    }
    if (!scenario.content || scenario.content.lineId !== lineId) {
      return res
        .status(404)
        .json({ message: "Linija nije pronađena u scenariju." });
    }

    fs.readFile(locksPath, "utf8", (lErr, lData) => {
      let locks = [];
      if (lErr) {
        if (lErr.code !== "ENOENT") {
          return res
            .status(500)
            .json({ message: "Greška pri čitanju lock fajla." });
        }
      } else {
        try {
          locks = JSON.parse(lData);
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
        return fs.writeFile(
          locksPath,
          JSON.stringify(locks, null, 2),
          "utf8",
          (wErr) => {
            if (wErr) {
              return res
                .status(500)
                .json({ message: "Greška pri zapisivanju lock fajla." });
            }
          }
        );
      }

      locks = locks.filter((lk) => `${lk.userId}` !== `${userId}`);
      locks.push({ scenarioId, lineId, userId });

      fs.writeFile(
        locksPath,
        JSON.stringify(locks, null, 2),
        "utf8",
        (wErr) => {
          if (wErr) {
            return res
              .status(500)
              .json({ message: "Greška pri zapisivanju lock fajla." });
          }
          return res
            .status(200)
            .json({ message: "Linija je uspješno zaključana." });
        }
      );
    });
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
