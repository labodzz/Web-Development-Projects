import EditorTeksta from "./EditorTeksta.js";

// Dohvat div-a
let div = document.getElementById("editor");
let editor = EditorTeksta(div);

window.addEventListener("DOMContentLoaded", () => {
  let div = document.getElementById("editor");
  let btn = document.getElementById("brojRijeciBtn");

  let editor = EditorTeksta(div);

  let ispisiBrojRijeci = function () {
    let brojRijeci = editor.dajBrojRijeci();
    alert("Ukupno riječi: " + brojRijeci.ukupnorijeci);
    alert("Boldirane riječi: " + brojRijeci.boldirane);
    alert("Italic riječi: " + brojRijeci.italic);
  };

  let scenarijUloge = function (uloga) {
    let scenarij = editor.scenarijUloge(uloga);
    console.log("Scenarij za ulogu " + uloga + ":");
    for (let i = 0; i < scenarij.length; i++) {
      console.log(
        "Scena: " +
          scenarij[i].scena +
          ", Redni broj: " +
          scenarij[i].pozicijaUTekstu +
          ", Uloga: " +
          scenarij[i].trenutni.uloga +
          ", Replika: " +
          scenarij[i].trenutni.replika +
          ", Prethodni: " +
          (scenarij[i].trenutni.prethodni
            ? scenarij[i].trenutni.prethodni.uloga +
              " - " +
              scenarij[i].trenutni.prethodni.replika
            : "Nema prethodnog") +
          ", Sljedeći: " +
          (scenarij[i].trenutni.sljedeci
            ? scenarij[i].trenutni.sljedeci.uloga +
              " - " +
              scenarij[i].trenutni.sljedeci.replika
            : "Nema sljedećeg")
      );
    }
  };

  btn.addEventListener("click", () => {
    scenarijUloge("LAMIJA");
  });
});
