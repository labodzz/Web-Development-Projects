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
      let ajax = new XMLHttpRequest();
      ajax.open("PUT", `/api/scenarios/${scenarioId}/lines/${lineId}`, true);
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
      const newTextArr = Array.isArray(newText) ? newText : [newText];
      ajax.send(JSON.stringify({ userId: userId, newText: newTextArr }));
    },
    lockCharacter: function (scenarioId, characterName, userId, callback) {
      let ajax = new XMLHttpRequest();
      ajax.open("POST", `/api/scenarios/${scenarioId}/characters/lock`, true);
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
      ajax.send(
        JSON.stringify({ userId: userId, characterName: characterName })
      );
    },
    updateCharacter: function (scenarioId, userId, oldName, newName, callback) {
      let ajax = new XMLHttpRequest();
      ajax.open("POST", `/api/scenarios/${scenarioId}/characters/update`, true);
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
      ajax.send(
        JSON.stringify({
          userId: userId,
          oldName: oldName,
          newName: newName,
        })
      );
    },
    getDeltas: function (scenarioId, since, callback) {
      let ajax = new XMLHttpRequest();
      ajax.open(
        "GET",
        `/api/scenarios/${scenarioId}/deltas?since=${since}`,
        true
      );
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
      ajax.send();
    },
    getScenario: function (scenarioId, callback) {
      let ajax = new XMLHttpRequest();
      ajax.open("GET", `/api/scenarios/${scenarioId}`, true);
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
      ajax.send();
    },
  };
})();
