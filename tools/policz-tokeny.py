#!/usr/bin/env python3
"""Policz tokeny ze WSZYSTKICH lokalnych źródeł, nie tylko z ~/.claude/projects."""
import json, os, glob, collections, sys

HOME = os.path.expanduser("~")
DESK = f"{HOME}/Library/Application Support/Claude"

SRC = {
    "Claude Code (CLI)":        (f"{HOME}/.claude/projects", "**/*.jsonl", "anthropic"),
    "Claude Desktop — agent":   (f"{DESK}/local-agent-mode-sessions", "**/*.jsonl", "anthropic"),
    "Claude Desktop — Code":    (f"{DESK}/claude-code-sessions", "**/*.json", "anthropic"),
    "Codex (GPT-5.5)":          (f"{HOME}/.codex/sessions", "**/*.jsonl", "codex"),
    "Kimi CLI":                 (f"{HOME}/.kimi-code", "**/*.jsonl", "kimi"),
}

seen = set()
per_src = collections.defaultdict(collections.Counter)
per_model = collections.Counter()
per_month = collections.defaultdict(collections.Counter)


def walk(obj, found):
    """Znajdź obiekty usage zagnieżdżone dowolnie głęboko."""
    if isinstance(obj, dict):
        if "usage" in obj and isinstance(obj["usage"], dict):
            found.append((obj["usage"], obj.get("model") or obj.get("id")))
        for v in obj.values():
            walk(v, found)
    elif isinstance(obj, list):
        for v in obj:
            walk(v, found)


for name, (base, pat, kind) in SRC.items():
    if not os.path.isdir(base):
        print(f"— pomijam {name}: brak katalogu", file=sys.stderr)
        continue
    c = per_src[name]
    for f in glob.glob(os.path.join(base, pat), recursive=True):
        c["files"] += 1
        try:
            with open(f, encoding="utf-8", errors="replace") as fh:
                if kind == "codex":
                    last = None
                    for line in fh:
                        if '"total_token_usage"' not in line:
                            continue
                        try: rec = json.loads(line)
                        except Exception: continue
                        found = []
                        def dig(o):
                            if isinstance(o, dict):
                                if "total_token_usage" in o and isinstance(o["total_token_usage"], dict):
                                    found.append(o["total_token_usage"])
                                for v in o.values(): dig(v)
                            elif isinstance(o, list):
                                for v in o: dig(v)
                        dig(rec)
                        if found: last = found[-1]
                    if last:                       # licznik kumulatywny → ostatni
                        c["input"] += last.get("input_tokens", 0) - last.get("cached_input_tokens", 0)
                        c["cache_read"] += last.get("cached_input_tokens", 0)
                        c["output"] += last.get("output_tokens", 0)
                        c["msgs"] += 1
                    continue

                content = fh.read()
                if pat.endswith(".json"):
                    try: recs = [json.loads(content)]
                    except Exception: continue
                else:
                    recs = []
                    for line in content.splitlines():
                        line = line.strip()
                        if not line or '"usage"' not in line: continue
                        try: recs.append(json.loads(line))
                        except Exception: pass

                for rec in recs:
                    if kind == "kimi":
                        found = []
                        walk(rec, found)
                        for u, _ in found:
                            key = (name, id(u), u.get("output"), u.get("inputCacheRead"))
                            if key in seen: continue
                            seen.add(key)
                            c["input"] += u.get("inputOther", 0) or 0
                            c["output"] += u.get("output", 0) or 0
                            c["cache_read"] += u.get("inputCacheRead", 0) or 0
                            c["cache_create"] += u.get("inputCacheCreation", 0) or 0
                            c["msgs"] += 1
                        continue

                    msg = rec.get("message") or {}
                    u = msg.get("usage") or rec.get("usage")
                    if not isinstance(u, dict):
                        found = []
                        walk(rec, found)
                        if not found: continue
                        u = found[0][0]
                    mid = msg.get("id") or rec.get("uuid") or rec.get("id")
                    if mid:
                        if mid in seen: continue
                        seen.add(mid)
                    c["input"] += u.get("input_tokens", 0) or 0
                    c["output"] += u.get("output_tokens", 0) or 0
                    c["cache_create"] += u.get("cache_creation_input_tokens", 0) or 0
                    c["cache_read"] += u.get("cache_read_input_tokens", 0) or 0
                    c["msgs"] += 1
                    m = msg.get("model")
                    if m:
                        per_model[m] += sum(u.get(k, 0) or 0 for k in
                            ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"))
                    ts = rec.get("timestamp") or ""
                    if len(ts) >= 7 and ts[:2] == "20":
                        pm = per_month[ts[:7]]
                        for k, kk in (("input","input_tokens"),("output","output_tokens"),
                                      ("cache_create","cache_creation_input_tokens"),("cache_read","cache_read_input_tokens")):
                            pm[k] += u.get(kk, 0) or 0
        except Exception:
            pass


def fm(n):
    if n >= 1e9: return f"{n/1e9:.2f} mld"
    if n >= 1e6: return f"{n/1e6:.1f} mln"
    if n >= 1e3: return f"{n/1e3:.0f} tys."
    return str(n)

tot = collections.Counter()
print(f"{'źródło':28}{'pliki':>7}{'wiad.':>8}{'output':>11}{'RAZEM':>12}")
print("─" * 66)
for name, c in per_src.items():
    s = c["input"] + c["output"] + c["cache_create"] + c["cache_read"]
    tot.update(c)
    print(f"{name:28}{c['files']:>7}{c['msgs']:>8}{fm(c['output']):>11}{fm(s):>12}")
grand = tot["input"] + tot["output"] + tot["cache_create"] + tot["cache_read"]
print("─" * 66)
print(f"{'RAZEM':28}{tot['files']:>7}{tot['msgs']:>8}{fm(tot['output']):>11}{fm(grand):>12}")
print(f"\ndokładnie: {grand:,} tokenów · output {tot['output']:,}")
print(f"odczyty cache: {tot['cache_read']:,} ({tot['cache_read']/grand*100:.1f}%)")
print("\n── MIESIĄCE ──")
for m in sorted(per_month):
    c = per_month[m]
    print(f"  {m}  {fm(c['input']+c['output']+c['cache_create']+c['cache_read']):>10}")
print("\n── MODELE ──")
for m, s in per_model.most_common(10):
    print(f"  {fm(s):>10}  {m}")

json.dump({"per_src": {k: dict(v) for k, v in per_src.items()}, "total": dict(tot),
           "grand": grand, "per_month": {k: dict(v) for k, v in per_month.items()},
           "per_model": dict(per_model)},
          open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "tokens_all.json"), "w"), indent=1)
