let EditorTeksta = function (divReferenca) {
  if (!(divReferenca instanceof HTMLDivElement)) {
    throw new Error("Pogresan tip elementa!");
  }

  if (divReferenca.getAttribute("contenteditable") !== "true") {
    throw new Error("Neispravan DIV, ne posjeduje contenteditable atribut!");
  }

  let div = divReferenca;

  let dajBrojRijeci = function () {
    let tekst = div.textContent.trim();

    if (tekst.length === 0) return 0;

    const jeBroj = (rijec) => /^\d+$/.test(rijec);

    let rijeci = tekst
      .split(/[\s.,]+/)
      .filter((rijec) => rijec.length > 0 && !jeBroj(rijec));

    const znakovi = [];
    const boldZastavice = [];
    const italicZastavice = [];

    const obilazak = (cvor, jeBold, jeItalic) => {
      if (cvor.nodeType === Node.TEXT_NODE) {
        const tekstCvora = cvor.textContent || "";
        for (let i = 0; i < tekstCvora.length; i++) {
          znakovi.push(tekstCvora[i]);
          boldZastavice.push(jeBold);
          italicZastavice.push(jeItalic);
        }
      } else if (cvor.nodeType === Node.ELEMENT_NODE) {
        const oznaka = cvor.tagName ? cvor.tagName.toLowerCase() : "";
        const sljedeciBold = jeBold || oznaka === "b" || oznaka === "strong";
        const sljedeciItalic = jeItalic || oznaka === "i" || oznaka === "em";
        cvor.childNodes.forEach((dijete) =>
          obilazak(dijete, sljedeciBold, sljedeciItalic)
        );
      }
    };

    obilazak(div, false, false);

    const jeSeparator = (znak) => /\s|[.,!?;:()\[\]{}"'»«]/.test(znak);

    let brojBoldRijeci = 0;
    let brojItalicRijeci = 0;
    let trenutnaRijec = "";
    let trenutnaBold = true;
    let trenutnaItalic = true;

    const obradiRijec = () => {
      if (!trenutnaRijec.length || jeBroj(trenutnaRijec)) {
        trenutnaRijec = "";
        trenutnaBold = true;
        trenutnaItalic = true;
        return;
      }
      if (trenutnaBold) brojBoldRijeci++;
      if (trenutnaItalic) brojItalicRijeci++;
      trenutnaRijec = "";
      trenutnaBold = true;
      trenutnaItalic = true;
    };

    for (let i = 0; i < znakovi.length; i++) {
      if (jeSeparator(znakovi[i])) {
        obradiRijec();
      } else {
        trenutnaRijec += znakovi[i];
        trenutnaBold = trenutnaBold && boldZastavice[i];
        trenutnaItalic = trenutnaItalic && italicZastavice[i];
      }
    }

    obradiRijec();

    return {
      ukupnorijeci: rijeci.length,
      boldirane: brojBoldRijeci,
      italic: brojItalicRijeci,
    };
  };
  return {
    dajBrojRijeci: dajBrojRijeci,
  };
};
export default EditorTeksta;
