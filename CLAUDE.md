# Hux project guide

## Text standard

Use Simplified Technical English (STE) for active project text and replies about Hux. Read [tools/ste/SKILL.md](tools/ste/SKILL.md) for its rules. Use the project names in [docs/writing-standard.md](docs/writing-standard.md). Keep numbers, dates, part numbers, links and quotations accurate.

Run the text gate after a text change:

```sh
python3 tools/ste/check_repo.py
```

Correct errors in the text. Keep the gate coverage intact. `npm run test:site` in `tools/living-drawings` also runs this gate. The gate can check structural rules, but cannot prove full compliance with STE.

`docs/archive/`, `docs/research/` and V0-GENESIS pages are historical records. Keep them intact and identify their historical status in links.

## Evidence and records

- Record a physical result with measured evidence and a dated session record. Plans and checklists describe intended work.
- Update `tools/living-drawings/plan-data.json` with changes to the source document that it summarizes. Read [docs/site-maintenance.md](docs/site-maintenance.md) for site work.
- Record paid orders in `docs/purchases.md`. Regenerate the budget with `python3 tools/v1-proof/review.py --write` after purchase changes.
- Add a dated work-session record to `NOTES.md` for Hux engineering work.
