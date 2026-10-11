---
name: simplified-technical-english
description: Write, revise, and check technical text in ASD-STE100 Simplified Technical English when the user requests STE or a project explicitly adopts it. Use for controlled-language procedures and descriptions, not ordinary technical conversation without that requirement.
license: MIT for the text of this skill. The word list in references/word-list.md comes from the ASD-STE100 dictionary, which is the property of ASD. Refer to NOTICE.md.
metadata:
  source-specification: ASD-STE100 Issue 7 (2017-01-25)
---

# Simplified Technical English

This skill uses ASD-STE100 Issue 7 (2017).
It is a local rules summary, not an official ASD document.
The source version is in `UPSTREAM_COMMIT`.
Refer to `NOTICE.md` for license details.

Apply STE to the text in scope for the user or project.
Keep code, identifiers, commands, paths, official names and quotations exact.
A user request for another style takes precedence.

## Procedure

1. Classify the text as procedural or descriptive.
2. Use the rules below and the project terminology.
3. Read the relevant references when you need more detail.
4. Check the text with the supplied script.
5. Correct structural errors and review word meanings manually.

## Core rules

- Use a maximum of 20 words in a procedural sentence and 25 in a descriptive sentence.
- Use a maximum of six sentences per paragraph, with one topic.
- Use active voice and imperative commands in procedures.
- Keep one instruction per sentence, except simultaneous actions.
- Put a comma between a condition and its command.
- Keep articles, subjects, verbs and the conjunction “that” when the sentence needs them.
- Use infinitive, imperative, simple present, simple past, “will” future, or a past participle as an adjective.
- Use “can”, “must” and “will” as auxiliary verbs.
- Use full forms instead of contractions, and separate sentences instead of semicolons.
- Use approved words with their specified parts of speech and meanings, or exact technical names and verbs.
- Use one name for each item and American English spelling.
- Limit noun clusters to three words. Use prepositions for longer groups.
- Keep quantities, names and actions specific. Preserve the source meaning and all technical data.

Use the references for “-ing” forms, participles, word exceptions and approved alternatives.
For safety text, use WARNING for injury risk and CAUTION for damage risk.
State the action or condition, then the risk.

## Check

From the skill directory:

```sh
python3 scripts/ste_check.py --mode <procedural|descriptive> <file>
```

In Hux, use `python3 tools/ste/check_repo.py` from the repository root.
The checker detects structural issues but cannot prove full STE compliance or correct word meanings.
Review those meanings against the dictionary.

## References

- [references/writing-rules.md](references/writing-rules.md): the full rules and exceptions. Read for a document rewrite or an unclear rule.
- [references/word-list.md](references/word-list.md): approved words, parts of speech and forms.
- [references/substitutions.md](references/substitutions.md): common alternatives and technical term categories.
- [examples/before-after.md](examples/before-after.md): examples.

The official specification is available from https://www.asd-ste100.org.
Later issues can differ from this vendored edition.
