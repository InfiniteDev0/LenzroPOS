# Lenzro POS — Improvising Log

`ROADMAP.md` is the stable plan — phases, schema, "done when" criteria. It doesn't get rewritten for every judgment call made during actual implementation. This file is where those calls get recorded instead: skipped items, simplifications, gotchas that are easy to get wrong, or a decision made on the fly that wasn't explicitly spelled out in the roadmap.

## How to use this
When Claude Code (or you) has to make a call that isn't explicitly covered by the roadmap — skips something, simplifies something, picks between two reasonable options, or there's a detail worth flagging so it's not rebuilt wrong later — log it here: what happened, why, and whether it needs revisiting.

---

## Log

### Phase 7 — POS devices, PINs & shifts (build note, ahead of implementation)
**Device activation is one-time; PIN login is everything after.**
A POS device is activated exactly once, by signing into `apps/pos` with a real email/password login (the owner's account). Once that device is activated, that login is never asked for again on it — every session after that starts directly at "pick employee → enter PIN," not a login screen. This is the actual mechanism, not a fallback or a simplification — worth stating plainly here so Claude Code doesn't build a "log in every time" flow by default and someone has to catch it later.
