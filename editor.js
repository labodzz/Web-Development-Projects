import EditorTeksta from "./EditorTeksta.js";

// Dohvat div-a
let div = document.querySelector(".naslov");
let editor = EditorTeksta(div);

window.addEventListener("DOMContentLoaded", () => {
  let div = document.querySelector(".naslov");
  let btn = document.getElementByClassName("dugme1");

  let editor = EditorTeksta(div);
  let rez = {};

  btn.addEventListener("click", () => {
    rez = editor.dajBrojRijeci();
  });

  document.querySelector(
    ".rezultati"
  ).innerText = `Broj riječi: ${rez.brojRijeci}, Broj znakova: ${rez.brojZnakova}`;
});
