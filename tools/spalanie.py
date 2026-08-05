#!/usr/bin/env python3
"""Spalanie tokenów: rozbicie na miesiące + ekstrapolacja na cały okres subskrypcji.

Uzupełnia `policz-tokeny.py`, który podaje jedną sumę. Tutaj chodzi o dwie rzeczy:

  1. ILE NA DZIEŃ PRACY — bo to ten wskaźnik urósł, nie liczba dni.
  2. ILE PRZEZ CAŁY CZAS — transkrypty pamiętają ostatnie miesiące, subskrypcja
     chodzi znacznie dłużej. Resztę da się oszacować, ale trzeba powiedzieć jak.

Nic nie wysyła na zewnątrz. Czyta pliki na dysku i wypisuje wynik na ekran.

    python3 tools/spalanie.py

ZAŁOŻENIA MODELU są niżej w sekcji EPOKI — zmień je i uruchom ponownie, żeby
zobaczyć, jak bardzo wynik od nich zależy. To nie jest pomiar, tylko rachunek
oparty na tym, czym się wtedy pracowało.
"""
import json, os, glob, collections, datetime, sys

HOME = os.path.expanduser("~")
DESK = f"{HOME}/Library/Application Support/Claude"

SRC = {
    "cli":     (f"{HOME}/.claude/projects", "**/*.jsonl", "anthropic"),
    "desktop": (f"{DESK}/local-agent-mode-sessions", "**/*.jsonl", "anthropic"),
    "codex":   (f"{HOME}/.codex/sessions", "**/*.jsonl", "codex"),
    "kimi":    (f"{HOME}/.kimi-code", "**/*.jsonl", "kimi"),
}
# Każde narzędzie trzyma czas gdzie indziej; gdy nie ma żadnego — mtime pliku.
TS_FIELDS = ("timestamp", "_audit_timestamp", "created_at", "createdAt", "ts")

# ── EPOKI: ile tokenów schodziło na jeden dzień pracy ────────────────────────
# Miesiące bez transkryptów szacujemy jako: dni robocze × spalanie z epoki.
# Widełki biorą się z tego, CZYM się wtedy pracowało — czat zjada rząd wielkości
# mniej niż pętla agentowa z subagentami, bo nie przemiela w kółko całego repo.
EPOKI = [
    # (od, do, opis, dni/mies. gdy brak śladu, mln na dzień: ostrożnie, centralnie, śmiało)
    ("2024-07", "2025-02", "czat na claude.ai, jeszcze bez budowania",  8, (1.0,  3.0,  6.0)),
    ("2025-03", "2025-06", "pierwsze repozytoria: czat + Cursor",       6, (3.0,  6.0, 12.0)),
    ("2025-07", "2025-12", "pierwszy token w Claude Code",              6, (8.0, 18.0, 30.0)),
]
# Dni z commitem wg GitHub API — jedyny ślad aktywności sprzed transkryptów.
DNI_Z_COMMITEM = {
    "2025-01": 1, "2025-03": 11, "2025-04": 11, "2025-05": 3, "2025-07": 17,
    "2025-08": 14, "2025-09": 2, "2025-11": 1, "2025-12": 1,
}
# Czego nie policzy żaden lokalny skrypt (mld tokenów: ostrożnie / centralnie / śmiało).
POZA_ZASIEGIEM = {
    "Rozmowy na claude.ai":  (1.0, 3.0, 7.5),   # istnieją wyłącznie po stronie serwera
    "Inne komputery":        (0.3, 0.8, 2.0),   # poprzedni sprzęt
}


def miesiac_z(rec, zapas):
    for f in TS_FIELDS:
        v = rec.get(f)
        if isinstance(v, str) and len(v) >= 10 and v[:2] == "20":
            return v[:7], v[:10]
    return zapas


def zejdz(o, out):
    if isinstance(o, dict):
        if isinstance(o.get("usage"), dict):
            out.append(o["usage"])
        for v in o.values():
            zejdz(v, out)
    elif isinstance(o, list):
        for v in o:
            zejdz(v, out)


def zmierz():
    per_mies = collections.Counter()
    dni = collections.defaultdict(set)
    widziane = set()

    def dodaj(m, d, n):
        per_mies[m] += n
        if d:
            dni[m].add(d)

    for src, (base, pat, kind) in SRC.items():
        if not os.path.isdir(base):
            print(f"— pomijam {src}: brak katalogu", file=sys.stderr)
            continue
        for f in glob.glob(os.path.join(base, pat), recursive=True):
            mt = datetime.datetime.fromtimestamp(os.path.getmtime(f))
            zapas = (mt.strftime("%Y-%m"), mt.strftime("%Y-%m-%d"))
            try:
                with open(f, encoding="utf-8", errors="replace") as fh:
                    if kind == "codex":
                        ost, ost_m = None, zapas
                        for line in fh:
                            if '"total_token_usage"' not in line:
                                continue
                            try: rec = json.loads(line)
                            except Exception: continue
                            found = []
                            def dig(o):
                                if isinstance(o, dict):
                                    if isinstance(o.get("total_token_usage"), dict):
                                        found.append(o["total_token_usage"])
                                    for v in o.values(): dig(v)
                                elif isinstance(o, list):
                                    for v in o: dig(v)
                            dig(rec)
                            if found:
                                ost, ost_m = found[-1], miesiac_z(rec, zapas)
                        if ost:   # licznik kumulatywny → liczy się tylko ostatni stan
                            dodaj(ost_m[0], ost_m[1],
                                  ost.get("input_tokens", 0) + ost.get("output_tokens", 0))
                        continue

                    for line in fh:
                        if '"usage"' not in line:
                            continue
                        try: rec = json.loads(line)
                        except Exception: continue
                        m, d = miesiac_z(rec, zapas)

                        if kind == "kimi":
                            found = []; zejdz(rec, found)
                            for u in found:
                                if not any(k in u for k in ("output", "inputOther")):
                                    continue
                                dodaj(m, d, sum(u.get(k, 0) or 0 for k in
                                      ("inputOther", "output", "inputCacheCreation", "inputCacheRead")))
                            continue

                        msg = rec.get("message") or {}
                        u = msg.get("usage") or rec.get("usage")
                        if not isinstance(u, dict):
                            continue
                        mid = msg.get("id") or rec.get("uuid")
                        if mid:
                            if mid in widziane: continue
                            widziane.add(mid)
                        dodaj(m, d, sum(u.get(k, 0) or 0 for k in
                              ("input_tokens", "output_tokens",
                               "cache_creation_input_tokens", "cache_read_input_tokens")))
            except Exception:
                pass
    return per_mies, {m: len(v) for m, v in dni.items()}


def mies_od(a, b):
    y, m = map(int, a.split("-")); Y, M = map(int, b.split("-"))
    while (y, m) <= (Y, M):
        yield f"{y:04d}-{m:02d}"
        m += 1
        if m == 13: y, m = y + 1, 1


def fm(n):
    if n >= 1e9: return f"{n/1e9:.2f} mld"
    if n >= 1e6: return f"{n/1e6:.0f} mln"
    return f"{n/1e3:.0f} tys."


def main():
    per_mies, dni = zmierz()
    if not per_mies:
        print("Nie znalazłem żadnych transkryptów — nie ma czego liczyć.", file=sys.stderr)
        return 1

    print("── ZMIERZONE: miesiąc po miesiącu ──────────────────────────────────")
    print(f"{'miesiąc':10}{'tokeny':>12}{'dni':>6}{'na dzień':>12}")
    for m in sorted(per_mies):
        d = dni.get(m, 0) or 1
        print(f"{m:10}{fm(per_mies[m]):>12}{dni.get(m,0):>6}{fm(per_mies[m]/d):>12}"
              f"   {'█' * min(28, int(per_mies[m] / 3e8))}")
    zmierzone = sum(per_mies.values())
    dni_razem = sum(dni.values())
    print(f"{'RAZEM':10}{fm(zmierzone):>12}{dni_razem:>6}"
          f"{fm(zmierzone/max(dni_razem,1)):>12}")

    # Ile dni pracy przypada na jeden dzień z commitem — kalibracja na zmierzonym okresie.
    dni_commit_2026 = 66
    skala = dni_razem / dni_commit_2026

    print("\n── SZACUNEK: okres bez transkryptów ────────────────────────────────")
    print(f"(dni pracy = dni z commitem × {skala:.2f}, bo tyle wyszło tam, gdzie znamy oba)")
    est = {"lo": 0.0, "mid": 0.0, "hi": 0.0}
    for a, b, opis, dflt, (lo, mid, hi) in EPOKI:
        suma = {"lo": 0.0, "mid": 0.0, "hi": 0.0}
        for m in mies_od(a, b):
            if m in per_mies:           # nie zgaduj tam, gdzie masz pomiar
                continue
            d = round(DNI_Z_COMMITEM[m] * skala) if m in DNI_Z_COMMITEM else dflt
            for k, r in (("lo", lo), ("mid", mid), ("hi", hi)):
                suma[k] += d * r * 1e6
        for k in est: est[k] += suma[k]
        print(f"  {a} – {b}  {mid:>5.0f} mln/dzień   {opis}")
        print(f"                 → {fm(suma['lo'])} / {fm(suma['mid'])} / {fm(suma['hi'])}")

    print("\n── POZA ZASIĘGIEM SKRYPTU ──────────────────────────────────────────")
    poza = {"lo": 0.0, "mid": 0.0, "hi": 0.0}
    for nazwa, (lo, mid, hi) in POZA_ZASIEGIEM.items():
        for k, v in (("lo", lo), ("mid", mid), ("hi", hi)):
            poza[k] += v * 1e9
        print(f"  {nazwa:24} {lo:.2f} / {mid:.2f} / {hi:.2f} mld")

    print("\n── RAZEM ───────────────────────────────────────────────────────────")
    print(f"  zmierzone (twarde)      {fm(zmierzone):>12}")
    for k, etykieta in (("lo", "OSTROŻNIE"), ("mid", "CENTRALNIE"), ("hi", "ŚMIAŁO")):
        print(f"  {etykieta:12} {fm(zmierzone + est[k] + poza[k]):>18}"
              f"   (w tym szacunku: {fm(est[k] + poza[k])})")
    print(f"\n  Udział pomiaru w wersji centralnej: "
          f"{zmierzone/(zmierzone+est['mid']+poza['mid'])*100:.0f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
