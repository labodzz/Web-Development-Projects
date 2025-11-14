import EditorTeksta from "./EditorTeksta.js";

// Dohvat div-a
let div = document.getElementById("editor");
let editor = EditorTeksta(div);

window.addEventListener("DOMContentLoaded", () => {
  let div = document.getElementById("editor");
  let btn = document.getElementById("brojRijeciBtn");

  let editor = EditorTeksta(div);

  btn.addEventListener("click", () => {
    alert("Broj riječi: " + editor.dajBrojRijeci());
  });
});
