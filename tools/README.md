# Licznik tokenów

`policz-tokeny.py` sumuje zużycie tokenów ze wszystkich lokalnych sesji AI na
komputerze, na którym go uruchomisz. Nie wysyła niczego na zewnątrz — czyta
tylko pliki na dysku i wypisuje wynik na ekran.

```bash
python3 tools/policz-tokeny.py
```

Czyta cztery źródła (każde narzędzie trzyma sesje gdzie indziej):

| narzędzie | katalog |
|---|---|
| Claude Code w terminalu | `~/.claude/projects` |
| Claude Desktop, tryb agentowy | `~/Library/Application Support/Claude/local-agent-mode-sessions` |
| Codex | `~/.codex/sessions` |
| Kimi CLI | `~/.kimi-code` |

Brakujący katalog jest po prostu pomijany, więc skrypt zadziała też tam, gdzie
używasz tylko jednego narzędzia.

**Po co:** liczby w sekcji „Rachunek tokenów" pochodzą z jednego komputera.
Uruchom to na pozostałych i dodaj wyniki — dopiero suma zbliża się do prawdy.
Zapisuje też `tokens_all.json` obok skryptu, gdyby przydały się dane surowe.

**Czego nie policzy nikt:** rozmów na claude.ai (są wyłącznie po stronie
serwera) i transkryptów, które Claude Code już skasował.

---

# Spalanie i ekstrapolacja

`spalanie.py` odpowiada na inne pytanie: **ile schodziło na jeden dzień pracy**
i ile z tego wynika dla okresu, z którego transkryptów już nie ma.

```bash
python3 tools/spalanie.py
```

Wypisuje trzy rzeczy:

1. **Rozbicie na miesiące** wraz z liczbą dni, w których faktycznie coś się
   działo. To ten drugi wskaźnik jest ciekawy — liczba dni pracy prawie się nie
   zmienia, rośnie tylko apetyt maszyny na dzień.
2. **Szacunek dla miesięcy bez transkryptów** — dni robocze (z dni z commitem,
   przeskalowanych współczynnikiem zmierzonym tam, gdzie znamy oba) razy
   spalanie z danej epoki narzędzi.
3. **Widełki całości** w trzech wariantach, z wyraźnym podziałem na to, co
   zmierzone, i to, co doszacowane.

**Założenia siedzą w stałej `EPOKI`** na górze pliku i są celowo wystawione na
wierzch: to nie jest pomiar, tylko rachunek oparty na tym, czym się wtedy
pracowało. Zmień liczby, uruchom ponownie, zobacz, jak bardzo wynik od nich
zależy — a potem sam oceń, czy wierzysz w wynik.

**Dlaczego wynik nie zgadza się co do grosza ze stroną:** strona pokazuje
migawkę z konkretnego dnia, a skrypt liczy stan na teraz. Każda kolejna sesja
podbija sumę — łącznie z tą, w której akurat uruchamiasz ten skrypt.
