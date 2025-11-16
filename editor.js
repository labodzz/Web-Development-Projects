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
  btn.addEventListener("click", () => {
    editor.pogresnaUloga();
  });
});
