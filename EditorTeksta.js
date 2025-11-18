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

  let scenarijUloge = function (uloga) {
    let povratna = [];
    uloga = uloga.toUpperCase();
    let tekst = div.innerText.split(/\n/);
    if (!dajUloge().includes(uloga)) return [];
    let index = 0;
    let prethodni = {};

    for (let i = 0; i < tekst.length; i++) {
      if (tekst[i] === uloga && dajUloge().includes(tekst[i])) {
        index = i;
        break;
      }
    }

    let pozivanje = 0;
    let scena = "";
    let trenutni = {};
    let brojevi = brojReplike(uloga, div);
    let rezultat = { replika: "", ind: 0, pozivanje: 0 };
    while (index < tekst.length) {
      if (tekst[index] === uloga) {
        let prethodna = { uloga: "", ind: 0 };
        prethodna = prethodnaUloga(uloga, index);
        let rezPr = { replika: "", uloga: "" };
        let sljedeca = { uloga: "", ind: 0 };
        sljedeca = sljedecaUloga(uloga, index);
        let rezSlj = { replika: "", uloga: "" };
        if (sljedeca !== "") {
          rezSlj = vratiRepliku(div, sljedeca.uloga, sljedeca.ind, pozivanje);
        }
        if (prethodna !== "") {
          rezPr = vratiRepliku(div, prethodna.uloga, prethodna.ind, pozivanje);
        }
        let pomocni = vratiRepliku(div, uloga, index, pozivanje);

        if (pomocni.replika.length > 0) {
          let rezultat = pomocni;
          pozivanje = rezultat.pozivanje;
          index = rezultat.ind;
          scena = naslovScena(div, index);

          povratna.push({
            scena: scena,
            pozicijaUTekstu: brojevi[pozivanje - 1],
            trenutni: {
              uloga: uloga,
              replika: rezultat.replika,
              prethodni: { uloga: prethodna.uloga, replika: rezPr.replika },
              sljedeci: { uloga: sljedeca.uloga, replika: rezSlj.replika },
            },
          });
        }
      }
      index++;
    }

    return povratna;
  };

  let naslovScena = function (div, index) {
    let tekst = div.innerText.split(/\n/);
    let naslov = "";

    for (let i = index; i >= 0; i--) {
      if (daLiJeNaslov(tekst[i])) {
        naslov = tekst[i];
        return naslov;
      }
    }
    return naslov;
  };

  let daLiJeNaslov = function (linija) {
    return /^(INT\.|EXT\.)\s+[A-Z0-9\s]+-\s+(DAY|NIGHT|AFTERNOON|MORNING|EVENING)$/.test(
      linija
    );
  };

  let brojReplike = function (uloga, div) {
    let tekst = div.innerText.split(/\n/);
    let redniBrojevi = [];
    let broj = 0;

    for (let i = 0; i < tekst.length; i++) {
      if (dajUloge().includes(tekst[i])) {
        let replikaObj = vratiRepliku(div, tekst[i], i, 0);
        if (replikaObj.replika.length > 0) {
          broj++;
          if (tekst[i] === uloga) {
            redniBrojevi.push(broj);
          }
        }
      }
    }

    return redniBrojevi;
  };

  let vratiRepliku = function (div, uloga, index, pozivanje) {
    let tekst = div.innerText.split(/\n/);
    let replika = "";
    let i = index;
    let ind = 0;
    pozivanje = pozivanje + 1;

    while (
      tekst[i] != "" &&
      !daLiJeNaslov(tekst[i]) &&
      ((dajUloge().includes(tekst[i]) && tekst[i] === uloga) ||
        !dajUloge().includes(tekst[i])) &&
      i < tekst.length
    ) {
      if (!dajUloge().includes(tekst[i]) && !/^\(.*\)$/.test(tekst[i])) {
        replika += tekst[i] + " ";
      }
      i++;
    }
    ind = i;

    return { replika: replika.trim(), ind: ind, pozivanje: pozivanje };
  };

  let prethodnaUloga = function (uloga, index) {
    let tekst = div.innerText.split(/\n/);

    for (let i = index - 1; i >= 0; i--) {
      if (dajUloge().includes(tekst[i]) && tekst[i] !== uloga) {
        return { uloga: tekst[i], ind: i };
      } else if (dajUloge().includes(tekst[i]) && tekst[i] === uloga) return "";
    }

    return "";
  };

  let sljedecaUloga = function (uloga, index) {
    let tekst = div.innerText.split(/\n/);

    for (let i = index + 1; i < tekst.length; i++) {
      if (dajUloge().includes(tekst[i]) && tekst[i] !== uloga) {
        return { uloga: tekst[i], ind: i };
      } else if (dajUloge().includes(tekst[i]) && tekst[i] === uloga) return "";
    }

    return "";
  };

  return {
    dajBrojRijeci: dajBrojRijeci,
    dajUloge: dajUloge,
    pogresnaUloga: pogresnaUloga,
    brojLinijaTeksta: brojLinijaTeksta,
    formatirajTekst: formatirajTekst,
    scenarijUloge: scenarijUloge,
  };
};

export default EditorTeksta;
