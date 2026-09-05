# The 151 sanctuary creatures

Original creature art for HACKTIVISTS: Violet Version. Nothing here is traced or
copied from any existing game.

    creatures/1.png .. 151.png          front sprites (what you see across the field)
    creatures/back/1.png .. 151.png     back sprites (your own creature, seen from behind)
    creatures/manifest.json             number, name, evolution line, stage, body plan, palette
    creatures/ROSTER.md                 the same list as a readable table
    creatures/_sheet_front.png          every front sprite on one sheet
    creatures/_sheet_back.png           every back sprite on one sheet

Every sprite is 48x48 with a transparent background, drawn on a common ground
line so a creature stands correctly wherever it is placed. That is the same size
the game already uses for `front_*` and `back_*`, so these drop straight in.

## Evolution lines

Numbering follows the families, so a line is always consecutive:

* 1-60     twenty three-stage lines (1-3 is BUNNIP, HOPPARD, LOPALOPE)
* 61-130   thirty-five two-stage lines
* 131-151  twenty-one that do not evolve, including PIGEONIS, MOOCHU and BEANWISE

Members of a line share a body plan, silhouette and palette family, and grow in
size and detail with each stage, so the relationship reads at a glance.

## Redrawing them

`tools/make_creatures.py` builds every sprite from a body plan plus features
(ears, tails, horns, wings, patterns). To change a creature, edit its line in the
`FAMILIES` table and run:

    python3 tools/make_creatures.py            # all 151, front and back
    python3 tools/make_creatures.py --only 1-3 # just one family

To replace any of them with hand-drawn art, save a 48x48 PNG over the numbered
file. Nothing else depends on how the file was made.
