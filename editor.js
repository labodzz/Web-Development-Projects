import EditorTeksta from "/EditorTeksta.js";

let div = document.querySelector(".sadrzaj");
let editor = EditorTeksta(div);
let rezultat = document.querySelector(".rezultati");
let rez = {};

let btnBold = document.querySelector(".btnBold");
btnBold.addEventListener("click", () => {
  editor.formatirajTekst("bold");
});

let btnItalic = document.querySelector(".btnItalic");
btnItalic.addEventListener("click", () => {
  editor.formatirajTekst("italic");
});

let btnUnderline = document.querySelector(".btnUnderline");
btnUnderline.addEventListener("click", () => {
  editor.formatirajTekst("underline");
});

let btn = document.querySelector(".dugme1");
btn.addEventListener("click", () => {
  rez = editor.dajBrojRijeci();
  rezultat.textContent =
    "Broj riječi: " +
    rez.ukupnorijeci +
    " Boldirane riječi: " +
    rez.boldirane +
    " Italic riječi: " +
    rez.italic +
    " ";
});

let rezl = [];

let btn2 = document.querySelector(".dugme2");
btn2.addEventListener("click", () => {
  rezl = editor.dajUloge();
  rezultat.textContent = "Uloge: " + rezl.join(", ");
});

let rez2 = [];
let btn3 = document.querySelector(".dugme3");
btn3.addEventListener("click", () => {
  rez2 = editor.pogresnaUloga();
  rezultat.textContent = "Istaknute pogrešne uloge: " + rez2.join(", ");
});

let btn4 = document.querySelector(".dugme4");

btn4.addEventListener("click", () => {
  let uloga = document.querySelector(".unosLinije").value;
  let rez3 = editor.brojLinijaTeksta(uloga);
  rezultat.textContent = "Broj linija: " + rez3;
});

let rezz = {};

let btn5 = document.querySelector(".dugme5");

btn5.addEventListener("click", () => {
  let uloga = document.querySelector(".unosScenarij").value;
  rezz = editor.scenarijUloge(uloga);

  let tekst = rezz
    .map((obj) => {
      return `
      Scena: ${obj.scena}, 
      Pozicija: ${obj.pozicijaUTekstu}, 
      Trenutni: ${obj.trenutni.uloga} - ${obj.trenutni.replika}, 
      Prethodni: ${obj.prethodni.uloga} - ${obj.prethodni.replika}, 
      Sljedeći: ${obj.sljedeci.uloga} - ${obj.sljedeci.replika}
    `;
    })
    .join("\n");

  rezultat.textContent = tekst;
});

let rez4 = [];
let btn6 = document.querySelector(".dugme6");
btn6.addEventListener("click", () => {
  rez4 = editor.grupisiUloge();
  let tekst = rez4
    .map((obj) => {
      return `
      Scena: ${obj.scena}, 
      Segment ${obj.segment}, 
      Uloge: ${obj.uloge.join(", ")}, 
    `;
    })
    .join("\n");
  rezultat.textContent = tekst;
});
