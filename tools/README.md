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
