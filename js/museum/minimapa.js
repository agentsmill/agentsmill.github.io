/* Plan w rogu: schemat budynku z tego samego planu (plan.js), strefy w
   kolorach, gość jako strzałka z kierunkiem patrzenia. Dotknięcie sali →
   szybka podróż (nawigacja.js). SVG zamiast płótna: ostre na każdym ekranie,
   a sale są prawdziwymi elementami z aria-label — da się do nich dojść
   klawiaturą (Tab, Enter). Tak samo cel „Kosmos” za ostatnią salą: klik, Enter
   albo Spacja prowadzą do portalu (naKosmos).

   Oś amfilady (+Z świata) biegnie w planie w prawo, a +X świata (lewa ręka
   idącego w głąb) — w górę: tak wygląda budynek z góry, gdy gość patrzy
   przed siebie. Stąd x_svg = z, y_svg = −x. */

const KOLOR = { palac: "#b8955a", biel: "#e8e6e0", noc: "#3a4b70", kino: "#6b3a3f", zabawy: "#f1c9a8" };
const NS = "http://www.w3.org/2000/svg";
const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);

function nazwa(s) {
  if (s.rodzaj === "epoka") return `${s.nr}${s.czesc ? ` (${s.czesc}/${s.czesci})` : ""} · ${s.nazwa}`;
  return t(`muz.sala.${s.id}`, s.nazwa);
}

export function initMinimapa({ plan, naSale, naKosmos = () => {} }) {
  const host = document.getElementById("minimapa");
  const svg = host.querySelector("svg");
  const przelacznik = host.querySelector(".mm-przelacz");
  const el = (tag, atr = {}, rodzic = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in atr) e.setAttribute(k, atr[k]);
    rodzic.appendChild(e);
    return e;
  };

  const xs = plan.sale.flatMap((s) => [s.x0, s.x1]), zs = plan.sale.flatMap((s) => [s.z0, s.z1]);
  const zap = 1.5;
  const minZ = Math.min(...zs) - zap, maxZ = Math.max(...zs) + zap + 2;
  const minY = -Math.max(...xs) - zap, maxY = -Math.min(...xs) + zap;
  svg.setAttribute("viewBox", `${minZ} ${minY} ${maxZ - minZ} ${maxY - minY}`);

  const prostokaty = new Map();
  for (const s of plan.sale) {
    const g = el("g", { class: "mm-sala", tabindex: "0", role: "button", "aria-label": nazwa(s), "data-id": s.id });
    el("title", {}, g).textContent = nazwa(s);
    prostokaty.set(s.id, el("rect", { x: s.z0 + 0.25, y: -s.x1 + 0.25, width: s.z1 - s.z0 - 0.5, height: s.x1 - s.x0 - 0.5, rx: 0.6, fill: KOLOR[s.styl] }, g));
    const jedz = () => naSale(s.id);
    g.addEventListener("click", jedz);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jedz(); } });
  }
  // drzwi: krótkie kreski w poprzek ściany; portal Kosmosu jako bursztynowa kropka
  for (const d of plan.drzwi) {
    if (d.portal) {
      el("circle", { cx: d.z + 1.2, cy: -d.x, r: 0.9, class: "mm-kosmos" });
      /* Cel „Kosmos”: przezroczysty prostokąt w marginesie za ostatnią salą, od portalu do prawej krawędzi
         planu, na pełną szerokość tej sali. Kropka sama ma kilka pikseli i nie łapie kliknięć, a cel jest
         elementem z aria-label — jak sale. Leży nad kropką, pod strzałką gościa. */
      const ostatnia = plan.sale.find((q) => q.id === d.a);
      const napis = t("muz.kosmos.szyld", "Kosmos →");
      const cel = el("rect", {
        x: d.z, y: -ostatnia.x1, width: maxZ - d.z, height: ostatnia.x1 - ostatnia.x0,
        class: "mm-kosmos-cel", tabindex: "0", role: "button", "aria-label": napis,
      });
      el("title", {}, cel).textContent = napis;
      cel.addEventListener("click", () => naKosmos());
      cel.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); naKosmos(); } });
      continue;
    }
    if (d.os === "z") el("line", { x1: d.z, y1: -d.x - d.szer / 2, x2: d.z, y2: -d.x + d.szer / 2, class: "mm-drzwi" });
    else el("line", { x1: d.z - d.szer / 2, y1: -d.x, x2: d.z + d.szer / 2, y2: -d.x, class: "mm-drzwi" });
  }
  const ja = el("g", { class: "mm-ja" });
  el("path", { d: "M2.2,0 L-1.4,1.5 L-0.7,0 L-1.4,-1.5 Z" }, ja);

  przelacznik?.addEventListener("click", () => {
    const otwarta = host.classList.toggle("otwarta");
    przelacznik.setAttribute("aria-expanded", String(otwarta));
  });

  let biezaca = null, ostatnio = "";
  return {
    sala(id) {
      if (biezaca) prostokaty.get(biezaca)?.classList.remove("biezaca");
      biezaca = id;
      prostokaty.get(id)?.classList.add("biezaca");
    },
    /* Pozycja (x, z) i kierunek patrzenia (fx, fz) w świecie. Zapis do DOM tylko
       przy widocznej zmianie — pętla woła to co klatkę. */
    aktualizuj(x, z, fx, fz) {
      const kat = (Math.atan2(-fx, fz) * 180) / Math.PI;
      const tr = `translate(${z.toFixed(2)} ${(-x).toFixed(2)}) rotate(${kat.toFixed(1)})`;
      if (tr !== ostatnio) { ja.setAttribute("transform", tr); ostatnio = tr; }
    },
  };
}
