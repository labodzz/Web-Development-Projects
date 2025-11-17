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

  let dajUloge = function () {
    const rijeci = div.innerText.split(/\n/);

    let uloge = [];

    for (let i = 0; i < rijeci.length; i++) {
      if (
        i != rijeci.length - 1 &&
        rijeci[i + 1].toUpperCase() != rijeci[i + 1] &&
        rijeci[i + 1] != " " &&
        rijeci[i + 1].length > 0
      ) {
        uloge.push(rijeci[i]);
      }
    }

    uloge = uloge.filter((uloga) => /^[A-Z ]+$/.test(uloga));
    let rezultat = [...new Set(uloge)];

    return rezultat;
  };

  let pogresnaUloga = function () {
    const rijeci = div.innerText.split(/\n/);

    let uloge = [];

    for (let i = 0; i < rijeci.length; i++) {
      if (
        i != rijeci.length - 1 &&
        rijeci[i + 1].toUpperCase() != rijeci[i + 1] &&
        rijeci[i + 1] != " " &&
        rijeci[i + 1].length > 0
      ) {
        uloge.push(rijeci[i]);
      }
    }
    uloge = uloge.filter((uloga) => /^[A-Z ]+$/.test(uloga));

    let prviPar = 0;
    let drugiPar = 0;
    let pogresnaUloga = [];

    for (let i = 0; i < uloge.length; i++) {
      for (let k = i + 1; k < uloge.length; k++) {
        let brojac1 = 0;
        let brojac2 = 0;
        for (let j = 0; j < uloge[i].length && j < uloge[k].length; j++) {
          if (uloge[i].length === uloge[k].length && uloge[i].length <= 5) {
            if (uloge[i][j] !== uloge[k][j]) {
              brojac1++;
            }
          } else {
            if (uloge[i][j] !== uloge[k][j]) {
              brojac2++;
            }
          }
        }
        if (brojac1 === 1 || brojac2 === 1 || brojac2 === 2) {
          prviPar = uloge.filter((x) => x === uloge[i]).length;
          drugiPar = uloge.filter((x) => x === uloge[k]).length;
          if (prviPar >= 4 && prviPar - drugiPar >= 3) {
            pogresnaUloga.push(uloge[k]);
          } else if (drugiPar >= 4 && drugiPar - prviPar >= 3) {
            pogresnaUloga.push(uloge[i]);
          }
        }
      }
    }

    let pogresan = [...new Set(pogresnaUloga)];
    console.log(pogresan);
    return pogresan;
  };

  function brojLinijaTeksta(uloga) {
    const rijeci = div.innerText.split(/\n/);
    let broj = 0;

    for (let i = 0; i < rijeci.length; i++) {
      if (rijeci[i].trim() === uloga) {
        for (let j = i + 1; j < rijeci.length; j++) {
          const linija = rijeci[j].trim();
          if (linija === "" || linija.toUpperCase() === linija) break;
          broj++;
        }
      }
    }

    return broj;
  }

  function formatirajTekst(komanda) {
    const dozvoljeneKomande = ["bold", "italic", "underline"];
    if (!dozvoljeneKomande.includes(komanda)) return false;

    const sel = window.getSelection();
    if (!sel.rangeCount) return false;

    const range = sel.getRangeAt(0);

    if (!div.contains(range.commonAncestorContainer)) return false;

    if (sel.isCollapsed) return false;

    let tag;
    switch (komanda) {
      case "bold":
        tag = "b";
        break;
      case "italic":
        tag = "i";
        break;
      case "underline":
        tag = "u";
        break;
    }

    const wrapper = document.createElement(tag);
    wrapper.appendChild(range.extractContents());

    if (
      wrapper.childNodes.length === 1 &&
      wrapper.firstChild.nodeName.toLowerCase() === tag
    ) {
      range.insertNode(wrapper.firstChild);
    } else {
      range.insertNode(wrapper);
    }

    sel.removeAllRanges();
    const noviRange = document.createRange();
    noviRange.selectNodeContents(wrapper);
    sel.addRange(noviRange);

    return true;
  }

  return {
    dajBrojRijeci: dajBrojRijeci,
    dajUloge: dajUloge,
    pogresnaUloga: pogresnaUloga,
    brojLinijaTeksta: brojLinijaTeksta,
    formatirajTekst: formatirajTekst,
  };
};

export default EditorTeksta;
