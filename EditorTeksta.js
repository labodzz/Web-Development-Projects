let EditorTeksta = function (divReferenca) {
  if (!(divReferenca instanceof HTMLDivElement)) {
    throw new Error("Pogresan tip elementa!");
  }

  if (divReferenca.getAttribute("contenteditable") !== "true") {
    throw new Error("Neispravan DIV, ne posjeduje contenteditable atribut!");
  }

  let div = divReferenca;

  function getCleanText(el) {
    let html = el.innerHTML;

    html = html.replace(/<\/?(div|p)[^>]*>/gi, "\n");

    html = html.replace(/<br\s*\/?>/gi, "\n");

    const tmp = document.createElement("div");
    tmp.innerHTML = html;

    let text = tmp.textContent || "";

    text = text
      .replace(/\u00A0/g, " ")
      .replace(/\u202F/g, " ")
      .replace(/\u2007/g, " ")
      .replace(/\u200B/g, "")
      .replace(/\uFEFF/g, "");

    const linije = text.split("\n");
    const ocisceneLinije = linije
      .map((linija) => linija.replace(/[ ]{2,}/g, " ").trim())
      .filter((linija) => linija.length > 0);

    return ocisceneLinije.join("\n");
  }

  let dajBrojRijeci = function () {
    let text = getCleanText(div);

    if (!text.trim()) return 0;

    const tokens =
      text.match(/[A-Za-zÀ-ž0-9]+(?:[-'\/][A-Za-zÀ-ž0-9]+)*/g) || [];

    const rijeci = tokens.filter((t) => /[A-Za-zÀ-ž]/.test(t));

    const znakovi = [];
    const boldZastavice = [];
    const italicZastavice = [];
    const jeBroj = (rijec) => /^\d+$/.test(rijec);

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

    console.log(rijeci);

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

    console.log(rezultat);

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

        let duza = Math.max(uloge[i].length, uloge[k].length);

        for (let j = 0; j < duza; j++) {
          let a = uloge[i][j] || "";
          let b = uloge[k][j] || "";

          if (uloge[i].length === uloge[k].length && uloge[i].length <= 5) {
            if (a !== b) brojac1++;
          } else {
            if (a !== b) brojac2++;
          }
        }

        let slicni = brojac1 === 1 || brojac2 === 1 || brojac2 === 2;
        if (!slicni) continue;

        let prviPar = uloge.filter((x) => x === uloge[i]).length;
        let drugiPar = uloge.filter((x) => x === uloge[k]).length;

        if (prviPar >= 4 && prviPar - drugiPar >= 3) {
          pogresnaUloga.push(uloge[k]);
        } else if (drugiPar >= 4 && drugiPar - prviPar >= 3) {
          pogresnaUloga.push(uloge[i]);
        }
      }
    }

    let pogresan = [...new Set(pogresnaUloga)];

    return pogresan;
  };

  function brojLinijaTeksta(uloga) {
    const tekst = getCleanText(div);
    const rijeci = tekst
      .split(/\n/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);
    uloga = uloga.toUpperCase();
    let broj = 0;

    for (let i = 0; i < rijeci.length; i++) {
      if (rijeci[i] === uloga) {
        for (let j = i + 1; j < rijeci.length; j++) {
          const linija = rijeci[j];

          if (linija === "" || linija.toUpperCase() === linija) break;

          if (!/^\(.*\)$/.test(linija)) {
            broj++;
          }
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

    const parent = range.commonAncestorContainer;
    const parentElement =
      parent.nodeType === Node.TEXT_NODE ? parent.parentElement : parent;

    if (
      parentElement &&
      parentElement.tagName &&
      parentElement.tagName.toLowerCase() === tag &&
      range.startContainer === range.endContainer
    ) {
      const selectedText = range.toString();
      const fullText = parentElement.textContent;

      if (selectedText === fullText) {
        const textNode = document.createTextNode(fullText);
        parentElement.parentNode.replaceChild(textNode, parentElement);

        sel.removeAllRanges();
        const noviRange = document.createRange();
        noviRange.selectNodeContents(textNode);
        sel.addRange(noviRange);
        return true;
      }

      const beforeText = fullText.substring(0, range.startOffset);
      const afterText = fullText.substring(range.endOffset);

      const fragment = document.createDocumentFragment();

      if (beforeText) {
        const beforeElement = document.createElement(tag);
        beforeElement.textContent = beforeText;
        fragment.appendChild(beforeElement);
      }

      fragment.appendChild(document.createTextNode(selectedText));

      if (afterText) {
        const afterElement = document.createElement(tag);
        afterElement.textContent = afterText;
        fragment.appendChild(afterElement);
      }

      parentElement.parentNode.replaceChild(fragment, parentElement);
      return true;
    }

    const extractedContent = range.extractContents();

    const wrapper = document.createElement(tag);
    let shouldUnformat = false;

    if (
      extractedContent.childNodes.length === 1 &&
      extractedContent.firstChild.nodeType === Node.ELEMENT_NODE &&
      extractedContent.firstChild.tagName.toLowerCase() === tag
    ) {
      shouldUnformat = true;
    }

    if (shouldUnformat) {
      range.insertNode(document.createTextNode(extractedContent.textContent));
    } else {
      wrapper.appendChild(extractedContent);
      range.insertNode(wrapper);
    }

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
            },
            prethodni: { uloga: prethodna.uloga, replika: rezPr.replika },
            sljedeci: { uloga: sljedeca.uloga, replika: rezSlj.replika },
          });
        }
      }
      index++;
    }

    return povratna;
  };

  let grupisiUloge = function () {
    let tekst = div.innerText.split(/\n/);
    let grupe = [];
    let i = 0;
    let scena = null;
    let segmentBroj = 0;

    while (i < tekst.length) {
      let linija = tekst[i];

      if (daLiJeNaslov(linija)) {
        scena = linija;
        segmentBroj = 0;
        i++;
        continue;
      }

      if (
        scena &&
        dajUloge().includes(linija) &&
        vratiRepliku(div, linija, i, 0).replika.length > 0
      ) {
        segmentBroj++;
        let ulogeSegmenta = [];
        let krajSegmenta = false;

        while (i < tekst.length && !krajSegmenta) {
          let trenutna = tekst[i].trim();

          if (trenutna === "") {
            i++;
            continue;
          }

          if (
            daLiJeNaslov(trenutna) ||
            dajUloge().includes(trenutna) === false
          ) {
            krajSegmenta = true;
            continue;
          }

          if (dajUloge().includes(trenutna)) {
            let replikaObj = vratiRepliku(div, trenutna, i, 0);
            if (replikaObj.replika.length > 0) {
              if (!ulogeSegmenta.includes(trenutna)) {
                ulogeSegmenta.push(trenutna);
              }
              i = replikaObj.ind;
              continue;
            }
          }

          i++;
        }

        if (ulogeSegmenta.length > 0) {
          grupe.push({
            scena: scena,
            segment: segmentBroj,
            uloge: ulogeSegmenta,
          });
        }
      } else {
        i++;
      }
    }

    console.log(grupe);

    return grupe;
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
    grupisiUloge: grupisiUloge,
  };
};

export default EditorTeksta;
