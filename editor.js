import EditorTeksta from "EditorTeksta.js";

// Dohvat div-a
let div = document.getElementsByClassName("sadrzaj");
let editor = EditorTeksta(div);

let btn = document.getElementById("brojRijeciBtn");
btn.addEventListener("click", () => {
  alert("Broj riječi: " + editor.dajBrojRijeci());
});
