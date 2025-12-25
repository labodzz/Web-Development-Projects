const PoziviAjax = (function () {
  return {
    postScenario: function (title, callback) {
      const ajax = new XMLHttpRequest();
      ajax.open("POST", "/api/scenarios", true);
      ajax.setRequestHeader("Content-Type", "application/json");

      ajax.onreadystatechange = function () {
        if (ajax.readyState === 4) {
          let response = null;

          try {
            response = JSON.parse(ajax.responseText);
          } catch (e) {
            response = null;
          }

          callback(ajax.status, response);
        }
      };

      ajax.send(JSON.stringify({ title: title }));
    },
    lockLine: function (scenarioId, lineId, userId, callback) {
      let ajax = new XMLHttpRequest();
      ajax.open(
        "POST",
        `/api/scenarios/${scenarioId}/lines/${lineId}/lock`,
        true
      );
      ajax.setRequestHeader("Content-Type", "application/json");
      ajax.onreadystatechange = function () {
        if (ajax.readyState === 4) {
          let response = null;
          try {
            response = JSON.parse(ajax.responseText);
          } catch (e) {
            response = null;
          }
          callback(ajax.status, response);
        }
      };
      ajax.send(JSON.stringify({ userId: userId }));
    },
    updateLine: function (scenarioId, lineId, userId, newText, callback) {
      /* ... */
    },
    lockCharacter: function (scenarioId, characterName, userId, callback) {
      /* ... */
    },
    updateCharacter: function (scenarioId, userId, oldName, newName, callback) {
      /* ... */
    },
    getDeltas: function (scenarioId, since, callback) {
      /* ... */
    },
    getScenario: function (scenarioId, callback) {
      /* ... */
    },
  };
})();
