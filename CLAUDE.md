# Hux repository rules

## Write all text in Simplified Technical English

All text that you write for this project obeys ASD-STE100 Simplified Technical English (STE). This includes documents, notes, checklists, plan data, page text, commit messages, session records and replies about Hux. The standard is in [docs/writing-standard.md](docs/writing-standard.md). The skill is in [tools/ste/SKILL.md](tools/ste/SKILL.md). Read the skill before you write.

The primary rules:

- Maximum 20 words in a procedural sentence. Maximum 25 words in a descriptive sentence. Maximum six sentences in a paragraph.
- Active voice. Imperative in procedures. Only "can", "must" and "will" as helping verbs.
- No "-ing" verb forms, no "has/have/had" with a participle, no contractions, no semicolons.
- One name for one item. The names are in the table in `docs/writing-standard.md`.
- Keep all numbers, dates, part numbers, links and quotations accurate. Do not change what a sentence says to make it shorter.

## Run the gate before you finish

```sh
python3 tools/ste/check_repo.py
```

The gate must report zero errors. `npm run test:site` in `tools/living-drawings` also runs the gate. Do not add exclusions to the gate to make text pass. Rewrite the text.

The gate does not check `docs/archive/`, `docs/research/` or the V0-GENESIS pages. These are historical records. Do not rewrite them. Label them as historical when you link to them.

## Other project rules

- Plans and checklists are not test results. Record a physical result only with its measured evidence and a dated session record.
- Keep `tools/living-drawings/plan-data.json` in the same change as the source document that it summarizes. Refer to [docs/site-maintenance.md](docs/site-maintenance.md).
- Record paid orders in `docs/purchases.md`. Regenerate the budget with `python3 tools/v1-proof/review.py --write`.
- Record each work session in `NOTES.md` with the date.
