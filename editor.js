const editorFactory = window.EditorTeksta;
if (typeof editorFactory !== "function") {
  throw new Error("EditorTeksta nije dostupan na window objektu.");
}

let div = document.querySelector(".sadrzaj");
let editor = editorFactory(div);
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
  rezultat.innerHTML = `
    <div class="result-item">
      <div><span class="result-label">📊 Ukupno riječi:</span><span class="result-value">${rez.ukupno}</span></div>
      <div><span class="result-label">🔤 Boldirane riječi:</span><span class="result-value">${rez.boldiranih}</span></div>
      <div><span class="result-label">📝 Italic riječi:</span><span class="result-value">${rez.italic}</span></div>
    </div>
  `;
});

let rezl = [];

let btn2 = document.querySelector(".dugme2");
btn2.addEventListener("click", () => {
  rezl = editor.dajUloge();
  const ulogeList = rezl.map((u) => `<div>• ${u}</div>`).join("");
  rezultat.innerHTML = `
    <div class="result-item">
      <div class="result-label">👥 Pronađene uloge (${rezl.length}):</div>
      <div style="margin-top: 8px;">${
        ulogeList || "<em>Nema pronađenih uloga</em>"
      }</div>
    </div>
  `;
});

let rez2 = [];
let btn3 = document.querySelector(".dugme3");
btn3.addEventListener("click", () => {
  rez2 = editor.pogresnaUloga();
  const pogresneList = rez2
    .map((u) => `<div style="color: #dc2626;">⚠️ ${u}</div>`)
    .join("");
  rezultat.innerHTML = `
    <div class="result-item">
      <div class="result-label">🔍 Potencijalno pogrešne uloge:</div>
      <div style="margin-top: 8px;">${
        pogresneList ||
        '<em style="color: #16a34a;">✓ Nema detektovanih grešaka</em>'
      }</div>
    </div>
  `;
});

let btn4 = document.querySelector(".dugme4");

btn4.addEventListener("click", () => {
  let uloga = document.querySelector(".unosLinije").value;
  if (!uloga.trim()) {
    rezultat.innerHTML =
      '<div class="result-item" style="border-left-color: #dc2626;"><em>⚠️ Molimo unesite ime uloge</em></div>';
    return;
  }
  let rez3 = editor.brojLinijaTeksta(uloga);
  rezultat.innerHTML = `
    <div class="result-item">
      <div class="result-label">👤 Uloga:</span><span class="result-value">${uloga.toUpperCase()}</span></div>
      <div><span class="result-label">📄 Broj linija teksta:</span><span class="result-value">${rez3}</span></div>
    </div>
  `;
});

let rezz = {};

let btn5 = document.querySelector(".dugme5");

btn5.addEventListener("click", () => {
  let uloga = document.querySelector(".unosScenarij").value;
  if (!uloga.trim()) {
    rezultat.innerHTML =
      '<div class="result-item" style="border-left-color: #dc2626;"><em>⚠️ Molimo unesite ime uloge</em></div>';
    return;
  }
  rezz = editor.scenarijUloge(uloga);

  if (rezz.length === 0) {
    rezultat.innerHTML = `<div class="result-item" style="border-left-color: #dc2626;"><em>⚠️ Uloga "${uloga.toUpperCase()}" nije pronađena</em></div>`;
    return;
  }

  let tekst = `<div class="result-label" style="margin-bottom: 12px;">🎬 Scenarij uloge: ${uloga.toUpperCase()} (${
    rezz.length
  } replika)</div>`;
  tekst += rezz
    .map((obj, idx) => {
      const preth = obj.prethodni
        ? `${obj.prethodni.uloga}: "${obj.prethodni.replika.substring(0, 50)}${
            obj.prethodni.replika.length > 50 ? "..." : ""
          }"`
        : "<em>—</em>";
      const slj = obj.sljedeci
        ? `${obj.sljedeci.uloga}: "${obj.sljedeci.replika.substring(0, 50)}${
            obj.sljedeci.replika.length > 50 ? "..." : ""
          }"`
        : "<em>—</em>";
      return `
        <div class="result-item" style="margin-bottom: 10px;">
          <div style="font-weight: 600; color: #5b3fff; margin-bottom: 6px;">Replika #${
            idx + 1
          }</div>
          <div><span class="result-label">📍 Scena:</span> ${obj.scena}</div>
          <div><span class="result-label">📊 Pozicija:</span> ${
            obj.pozicijaUTekstu
          }</div>
          <div style="margin-top: 6px;"><span class="result-label">💬 Trenutni:</span> "${
            obj.trenutni.replika
          }"</div>
          <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">
            <div>⬆️ Prethodni: ${preth}</div>
            <div>⬇️ Sljedeći: ${slj}</div>
          </div>
        </div>
      `;
    })
    .join("");

  rezultat.innerHTML = tekst;
});

let rez4 = [];
let btn6 = document.querySelector(".dugme6");
btn6.addEventListener("click", () => {
  rez4 = editor.grupisiUloge();

  if (rez4.length === 0) {
    rezultat.innerHTML =
      '<div class="result-item"><em>Nema pronađenih grupa</em></div>';
    return;
  }

  let tekst = `<div class="result-label" style="margin-bottom: 12px;">🎭 Grupisane uloge (${rez4.length} grupa)</div>`;
  tekst += rez4
    .map((obj, idx) => {
      const ulogeList = obj.uloge
        .map(
          (u) =>
            `<span style="background: #e0e7ff; padding: 2px 8px; border-radius: 4px; margin-right: 4px; display: inline-block; margin-bottom: 4px;">${u}</span>`
        )
        .join("");
      return `
        <div class="result-item" style="margin-bottom: 10px;">
          <div style="font-weight: 600; color: #5b3fff; margin-bottom: 4px;">Grupa #${
            idx + 1
          }</div>
          <div><span class="result-label">📍 Scena:</span> ${obj.scena}</div>
          <div><span class="result-label">🔢 Segment:</span> ${
            obj.segment
          }</div>
          <div style="margin-top: 6px;"><span class="result-label">👥 Uloge (${
            obj.uloge.length
          }):</span></div>
          <div style="margin-top: 4px;">${ulogeList}</div>
        </div>
      `;
    })
    .join("");
  rezultat.innerHTML = tekst;
});
