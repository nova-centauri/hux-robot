# Writing standard: Simplified Technical English

All active text in this project obeys ASD-STE100 Simplified Technical English (STE). This rule applies to the Markdown documents, the plan data, the page text of the website, the notes and the session records. The rule started on 2026-10-04. The source of the rules is the [simplified-technical-english skill](https://github.com/0xpili/simplified-technical-english), vendored in `tools/ste/` in this repository.

## Why

STE makes text short, clear and easy to check. A reader who does not know the project can understand each sentence one time. Test records, budgets and checklists must not have two meanings. STE also makes the text easy to translate and easy for a tool to check.

## The rules in short

The full rules are in `tools/ste/references/writing-rules.md` ([upstream copy](https://github.com/0xpili/simplified-technical-english/blob/main/references/writing-rules.md)). The primary rules are these:

- Procedural sentences have maximum 20 words. Descriptive sentences have maximum 25 words.
- A paragraph has maximum six sentences and one topic.
- Use the active voice. In procedures, use the imperative: "Set the switch to ON."
- Use only "can", "must" and "will" as helping verbs. Do not use "should", "would", "may", "might" or "shall".
- Do not use the "-ing" form of a verb. Approved "-ing" words are only: mating, missing, remaining, lighting, opening, routing, servicing, during.
- Do not use "has", "have" or "had" with a past participle. Write "the motor arrived", not "the motor has arrived".
- Do not use contractions. Do not use semicolons. Write two sentences.
- Write one instruction in each sentence. Put a comma after a condition: "If the light comes on, stop the motor."
- Use one name for one item in the full text. Refer to the names below.
- Use words from the approved list in `tools/ste/references/word-list.md`, technical names and technical verbs. Frequent replacements are in `tools/ste/references/substitutions.md` ([upstream copy](https://github.com/0xpili/simplified-technical-english/blob/main/references/substitutions.md)).

## Project names

Rule 1.8 says: use the official names of the project. These are the official names. Do not change between names for one item.

| Item | Name to use |
| --- | --- |
| The current build | V1-PROOF |
| The archived planning model | V0-GENESIS (the file paths keep `stair-v1`) |
| The robot | Hux |
| Raspberry Pi Pico 2 | Pico 2 |
| SparkFun LSM6DSO Qwiic | LSM6DSO IMU |
| Waveshare ST3215 12 V | ST3215 servo |
| Pololu 4752 | Pololu 4752 gearmotor |
| Pololu 4035 DRV8874 carrier | DRV8874 driver |
| The two wheel actuators | wheel gearmotors |
| The two leg actuators | leg servos |
| The person who builds Hux | the user |
| Interactive pages in `tools/living-drawings` | living drawings |

Add a row when a new part gets a name. The name in the first document is the name for all documents.

## What the gate checks

The command `python3 tools/ste/check_repo.py` is the STE gate. `npm run test:site` in `tools/living-drawings` runs the gate. The site build fails when the gate finds an error. The gate checks:

- All Markdown files, except the trees in the list below.
- The text fields of `plan-data.json` and `mechanical-tests-data.json` for V1-PROOF.
- The visible text of the V1-PROOF pages in `tools/living-drawings`.
- The text constants in `build_site.py`.

The gate does not check these trees. They are historical records or upstream text:

- `docs/archive/` (the V0-GENESIS planning archive)
- `docs/research/` (the dated research notes)
- `tools/ste/` (the skill text and the word list)
- The V0-GENESIS pages, listed in `ARCHIVE_PAGES` in `build_site.py`

The gate finds the structural errors: sentence length, paragraph length, passive voice, helping verbs, "-ing" forms, contractions and semicolons. The gate cannot know if a word has its approved meaning. Run `python3 tools/ste/check_repo.py --vocab` to list the words that are not in the approved list. Each of these words must be a technical name or a technical verb. The gate does not check the text in JavaScript files.

## How to write a new document

1. Classify each part: a procedure tells the reader to do something, a description gives information. Do not mix the two in one paragraph.
2. Write the text. Keep all the numbers, dates, part numbers and links accurate.
3. Run `python3 tools/ste/check_repo.py <file>`.
4. Correct each error. Run the gate again. Stop only when the gate reports zero errors.
5. Run `python3 tools/ste/check_repo.py --warnings <file>` and remove the "-ing" verb forms that are not technical names.

Headings, table cells, code, identifiers, quoted text and URLs are not controlled text (rule 8.6). Keep a quotation from the user in quotation marks, as the user wrote it.

## Safety text

Use "WARNING" for a risk of injury to persons. Use "CAUTION" for a risk of damage to parts. Start with a command, then give the risk. Example: "CAUTION: Disconnect the battery before you connect the driver. A reversed supply can cause damage to the driver."

## Source and license

The rules summary, the examples and the check tool are from the skill repository, under the MIT license. The word list is from the ASD-STE100 dictionary, Issue 7 (2017), the property of ASD. Refer to `tools/ste/NOTICE.md` ([upstream copy](https://github.com/0xpili/simplified-technical-english/blob/main/NOTICE.md)). The vendored commit is in `tools/ste/UPSTREAM_COMMIT`. The official specification is free of charge at https://www.asd-ste100.org.
