let EditorTeksta = function (divRef) {
  if (!(divRef instanceof HTMLDivElement)) {
    throw new Error("Pogresan tip elementa!");
  }

  if (divRef.getAttribute("contenteditable") !== "true") {
    throw new Error("Neispravan DIV, ne posjeduje contenteditable atribut!");
  }

  let div = divRef;

  let dajBrojRijeci = function () {
    let tekst = div.textContent.trim();

    if (tekst.length === 0) return 0;

    let rijeci = tekst.split(/[\s.,]+/).filter((rijec) => rijec.length > 0);

    let boldirane = div.querySelectorAll("b, strong");
    let italic = div.querySelectorAll("i, em");

    return {
      ukupnorijeci: rijeci.length,
      boldirane: boldirane.length,
      italic: italic.length,
    };
  };
  return {
    dajBrojRijeci: dajBrojRijeci,
  };
};
export default EditorTeksta;
