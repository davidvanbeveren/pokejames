# Map brief — HACKTIVISTS: Violet Version

Read ART_SPEC.md (map file format) and js/tiles.js (tile ids + default legend chars). Preview/validate with:
`node tools/rendermap.js js/<file>.js` → tools/out/maps/<mapid>.png (yellow letters mark objects: N npc, W warp, S sign, I item, T trigger, X interact, E exit tiles).
Look at the PNG with the Read tool. Validation must be clean (except "unknown sprite" warnings for character sprites that are still being drawn).

## World layout & connections (exact — the engine relies on these)
Maps are stacked vertically: pallet (20x18) → route1 (20x36) → verdant (30x27) → route2 (20x40) → violet (40x36).
Edge exits: `{ edge:'north'|'south', from, to, map, offset }` — walking off that edge at column x in [from,to] lands at column x+offset on the target's opposite edge.

| map | size | era | south opening (x) | north opening (x) | exits |
|---|---|---|---|---|---|
| pallet | 20x18 | 0 | – | 10..11 | north→route1 offset 0 |
| route1 | 20x36 | 0 | 10..11 | 9..10 | south→pallet offset 0; north→verdant offset +6 |
| verdant | 30x27 | 1 | 15..16 | 14..15 | south→route1 offset -6; north→route2 offset -5 |
| route2 | 20x40 | 1 | 9..10 | 9..10 | south→verdant offset +5; north→violet offset +10 |
| violet | 40x36 | 2 | 19..20 | – | south→route2 offset -10 |

Opening tiles on the edge rows must be walkable (path or grass) and everything else on the edge rows must be trees/fences/water.
Outdoor maps: `border: 'tree'`. Interiors: `indoor: true, border: 'void'`, with a wall band ('w') on row 0 and the exit mat ('m') on the bottom row; a warp object on the mat returns outside to the tile just below the door, `dir:'down'`. Doors outside are 'D' tiles with a warp object `{ type:'warp', x, y, map:'<interior>', tx:<mat x>, ty:<mat y>, dir:'up' }`.

## Building recipes (16x16 blocks)
Small house (4 wide, 2 tall):        roof row `1223`   wall row `[XD]`   (door at column 2 of the house)
Tall building (6 wide, 3 tall):      `122223` / `455556` / `[XSDX]` where S is a sign tile: M mart, C center, A lab, G gym, V vh, U violet
Other roof colors: add legend entries, e.g. `'q':'roof_l:blue','w2'…` — legend keys must be single characters not already used. Available variants: red, blue, purple, green, pink, gray, yellow, brown, teal, orange. Suggested: houses red/brown/green, VEGAN MART blue, SANCTUARY CENTER pink, GYM gray, VIOLET STUDIOS purple, VH HQ green, VIOLET HALL yellow.
Note the default legend uses 'w' for interior wall, 'W' for exterior wall, 'X' window, 'D' door, '[' ']' wall edges.

## Object types
- npc: `{ type:'npc', id, x, y, sprite, pal?, dir, move:'static'|'look'|'wander'|'walk_h'|'walk_v', range?, dialog:[...] | (G)=>[...] , gift?:{item, qty, flag, lines, after}, trainer?:{class, name, level, sight, intro:[...], after:[...]}, if?/unless?:'flag' }`
  - team members: `{ type:'npc', team:'kate', x, y, dir, move:'wander' }` (sprite/dialog come from js/npcs.js: david, michael, gabriele, vikram, kate, tobias, jeremy, steven, richie, mike, aaron, ximena, elizabeth, thomas, luuly, lucas, chloe, dee, jennifer, lauren, casey, berliner, cinephile, swimmer, pigeonfan). Give each a unique `id` when placing the same team member on several maps.
  - animals as NPCs: `{ type:'npc', id, x, y, sprite:'ow_duck', animal:true, dir:'down', move:'wander', range:2, dialog:['QUACK!'] }` (overworld animal sprites: ow_bunny, ow_rabbit, ow_chick, ow_hen, ow_piglet, ow_pig, ow_calf, ow_cow, ow_lamb, ow_sheep, ow_kidgoat, ow_goat, ow_duckling, ow_duck, ow_gosling, ow_goose, ow_turkey, ow_pigeon)
  - character sprites: hero (player only), girl, boy, kid, man, woman, oldman, prof, mom, clerk, nurse, chef, hoodie. Recolor with pal: { t:'#hex' (shirt), h:'#hex' (hair), p:'#hex' (pants), a:'#hex' (accent) }.
  - skeptic trainers (they spot you within `sight` tiles in the direction they face): classes BBQ_DAD (sprite chef), GYM_BRO (man), CHEESE_LOVER (woman), GRANDPA (oldman), INFLUENCER (girl), SCIENTIST (prof), CHEF (chef, gym leader only). Levels: route1 4-5, route2 8-10, violet gym 11-14.
- sign: `{ type:'sign', x, y, text:['line one', 'line two'] }` on a sign tile 'S' (solid).
- item: `{ type:'item', id:'<unique>', x, y, item:'MOOCH'|'VEGAN BEANS'|'CARROT'|..., qty?, hidden?:true }` — visible items draw a pouch and are solid; hidden ones are found by pressing A while facing the tile (put them on grass/flower/path tiles or in front of solid tiles is NOT possible — the player must face the tile, so hidden items go on walkable tiles). Bean ids must be unique across the whole game (prefix with the map id).
- trigger: `{ type:'trigger', x, y, w, h, script:'name' }` runs when the player steps on it.
- interact: `{ type:'interact', x, y, text:[...] }` or `{ type:'interact', x, y, script:'name', ... }` for pressing A on a solid tile (bookshelves, statues, PCs...).
- encounters: `encounters: 'route1'` (or 'route2', 'violet_park') on maps with tall grass.

## Design rules (Gen 1 feel)
- Main path is 2 tiles wide; side paths 1 tile. Tall grass in irregular patches of 6-20 tiles that the path passes THROUGH (unavoidable at least once) plus optional patches.
- Ledges ('_') are one-way: you can hop DOWN (southward) over them but not climb up. Use rows of ledges with 1-2 tile gaps so northbound walkers detour while southbound walkers hop; never fully block the route.
- Trees ('T') as thick borders (2+ deep at the map edges) and as obstacles. Fences, rocks, flowers, bushes for decoration. Water ponds with 'water_edge' ('%') on the top row of a pond.
- Every route has 2-3 skeptic trainers standing beside the path facing it (sight 3-4), 2-3 friendly NPCs, 3-4 beans (mix visible/hidden), 2 useful items.
- Towns: buildings never touch; leave a 1-tile walkable ring; signs in front of important buildings; team members wander in plazas; at least one bench/flower area.
- Keep all rows exactly the map width. Use `'.'` (grass) generously.
