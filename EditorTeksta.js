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

    return rijeci.length;
  };
  return {
    dajBrojRijeci: dajBrojRijeci,
  };
};
export default EditorTeksta;
