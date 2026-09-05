#!/usr/bin/env python3
"""Rename the 151 creatures to their real-world animals, in the generated files.

    python3 tools/rename_creatures.py

Why post-process instead of renaming in make_creatures.py and re-exporting: that
generator salts every creature's stats off its name (`jitter(c['name'], k)`), so a
re-export under new names would silently rebalance the whole roster. This rewrites
only the names, keyed by dex number, and leaves stats, moves and evolutions alone.
RE-RUN THIS after any `python3 tools/export_creatures.py`, or the names revert.

Duplicate animals are numbered: the first FOX stays FOX, the rest become FOX 2,
FOX 3... Each creature also gets a `key` -- the display name with the spaces and
hyphens stripped (FOX2, SEALION) -- which is what DATA.SPECIES is keyed by and what
sprite names are built from, since 'front_fox 2' would be a poor sprite id.
"""
import io, json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
JS = os.path.join(ROOT, '..', 'js')

ANIMALS = """Toad Toad Toad Salamander Chameleon Dragon Turtle Turtle Turtle Caterpillar
Pupa Butterfly Centipede Pupa Wasp Sparrow Osprey Eagle Rat Muskrat
Sparrow Heron Rattlesnake Cobra Pika Jerboa Pangolin Pangolin Rabbit Rabbit
Rhinoceros Rabbit Rhinoceros Rhinoceros Jerboa Jerboa Fox Fox Pufferfish Rabbit
Bat Bat Radish Flower Flower Cicada Cicada Mite Moth Mole
Moles Cat Cougar Duck Platypus Macaque Baboon Dog Mastiff Tadpole
Tadpole Frog Fox Fox Fox Lizard Lizard Gorilla Plant Plant
Plant Jellyfish Jellyfish Rock Rock Tortoise Pony Horse Hippopotamus Hippopotamus
Magnet Magnets Duck Ostrich Ostrich Seal Dugong Sludge Sludge Clam
Oyster Ghost Ghost Shadow Earthworm Tapir Tapir Crab Crab Ball
Ball Seeds Tree Dinosaur Dinosaur Humanoid Humanoid Skink Pollutant Pollutant
Rhinoceros Rhinoceros Axolotl Vines Kangaroo Seahorse Seadragon Goldfish Goldfish Starfish
Starfish Mime Mantis Humanoid Primate Bird Beetle Bull Carp Dragon
Plesiosaur Amoeba Fox Sea-lion Fox Fox Bird Ammonite Ammonite Crab
Scorpion Pterodactyl Bear Bird Hummingbird Phoenix Serpent Serpent Dragon Feline
Embryo""".split()
assert len(ANIMALS) == 151, len(ANIMALS)


# Dex entries rewritten to describe the real animal each creature now is.
ENTRIES = {1: 'Small, damp and unbothered. Blinks at you slowly, which is toad for hello.', 2: 'Grown heavy and content. Prefers a cool stone and a long think.', 3: 'An old toad the size of a bread loaf. Has opinions about rain, all of them good.', 4: 'Keeps to the damp dark under logs. Its skin is cool to the touch, always.', 5: 'Changes colour with its mood. Currently: pleased, with a hint of hungry.', 6: 'Enormous wings, gentle landing. Would rather sunbathe than settle anything.', 7: 'Paddles in circles for the joy of it, then naps on the bank with its legs out.', 8: 'Shell scuffed from a life of bumping into things cheerfully.', 9: 'Older than the pond. Moves at the pace of someone who has already won.', 10: 'Eats a leaf a day, then another. Holds your finger with all of its feet.', 11: 'Hangs quietly from a twig, getting on with something enormous inside.', 12: 'Wings like stained glass. Lands on the calmest person in the room.', 13: 'So many legs, all in agreement. Would rather be under something.', 14: 'Still, patient and slightly warm. Do not shake it; it is busy.', 15: 'A fierce reputation and mild manners. Only ever wants the fallen pear.', 16: 'Small, brown and everywhere. Will follow a crumb across a whole town.', 17: 'Hovers, then folds. Shakes the water off and looks very pleased with itself.', 18: 'Rides warm air for hours without a single wingbeat. Enormous and unhurried.', 19: 'Clever, clean and endlessly curious. Learns your pockets before your name.', 20: 'Builds a lodge of reeds and keeps it tidy. Swims with its nose held high.', 21: 'Bold well beyond its size. Has never once backed down from a bigger bird.', 22: 'Stands in the shallows doing nothing, beautifully, for hours at a time.', 23: 'Warns you long before it worries. Would much rather you both moved along.', 24: 'Rises to look you in the eye, mostly to check whether you are a friend.', 25: 'A round-eared handful of the high rocks. Stacks tiny haystacks for winter.', 26: 'All ears and hind legs. Crosses the sand in enormous silent hops.', 27: 'Armoured in overlapping scales. Curls into a pinecone when it needs a moment.', 28: 'Young and softly plated. Digs for ants with comically oversized claws.', 29: 'Thumps a hind foot when pleased, which is often.', 30: 'Big, calm and slow to startle. Leans its whole weight on friends it trusts.', 31: 'A grey tank with terrible eyesight and an excellent nose.', 32: 'Its ears turn like dishes to find the softest voice in the room.', 33: 'Two tonnes of armour plating, entirely devoted to eating grass.', 34: 'Knee-high and already sure of itself. Charges at leaves for practice.', 35: 'Sleeps through the heat and dances through the night. Weighs almost nothing.', 36: 'Balances on two toes and vanishes in a blink. Blame the moonlight.', 37: 'A kit with paws too big for it. Pounces on grass, catches nothing, tries again.', 38: 'Trots the hedgerows at dusk with the confidence of a far larger animal.', 39: 'Puffs up when startled, then looks embarrassed about it for a good while.', 40: 'Its nose never stops. Hears a lettuce leaf lifted three rooms away.', 41: 'Hangs upside down and grooms itself like a cat. Eats its weight in insects.', 42: 'Sees the dark by singing at it. Nightly, quietly, usefully.', 43: 'Mostly underground and quite pleased about it. Leaves waving like a flag.', 44: 'Follows the sun all day, then sighs and starts again at dawn.', 45: 'Opens at dusk and scents the whole meadow. The bees queue politely.', 46: 'Spent years underground for two loud weeks above it. Worth it, apparently.', 47: 'Sings from the highest branch. You will hear it long before you find it.', 48: 'Smaller than a full stop and busier than anything else in the garden.', 49: 'Dusty, soft, and hopeless about lamps. Sleeps on tree bark all day.', 50: 'Velvet coat, spade hands, and no interest whatsoever in the sky.', 51: 'Three tunnels, three opinions. They rarely agree on the route.', 52: 'Decides you are furniture, then decides you are family. No middle step.', 53: 'Enormous paws and a silent walk. Purrs like distant thunder.', 54: 'Formally dressed for every occasion, including swimming.', 55: 'A beak, a tail and a coat, assembled by committee. Swims beautifully.', 56: 'Washes its food in the stream first. Has firm views on queue etiquette.', 57: 'Loud, clever and family-minded. Grooms its friends for hours.', 58: 'Certain that you are the best thing that has ever happened. Correct.', 59: 'Enormous, slow and soft. Leans on you until you agree to sit down.', 60: 'All head and tail, going somewhere in a hurry. Nowhere in particular.', 61: 'Has just grown its back legs and cannot stop looking at them.', 62: 'Sits like a wet cushion, then leaps further than anyone expects.', 63: 'Curls up nose to tail by the fire. Will not be moved and will not apologise.', 64: 'Elegant, aloof, and secretly desperate to be told it is beautiful.', 65: 'Trots home along the same hedge every night, at the same unhurried pace.', 66: 'Basks on a warm stone until it is exactly the right temperature. No sooner.', 67: 'Runs across the water when startled, which is often, and very funny.', 68: 'Enormous, thoughtful and gentle. Spends the whole afternoon eating leaves.', 69: 'Grows towards whoever waters it, and considers that a friendship.', 70: 'Taller than you now. Rustles hello whenever you walk past.', 71: 'Two leaves and boundless ambition.', 72: 'Drifts wherever the water is going. Glows faintly when it is content.', 73: 'No brain, no bones, no worries. Pulses along quite happily.', 74: 'Warm on one side from the sun. Has been here longer than the town has.', 75: 'Small, round and stubborn. Rolls downhill with great commitment.', 76: 'Carries its house and its schedule. Both are extremely unhurried.', 77: 'Shaggy, short-legged, and full of opinions about gates.', 78: 'Gallops for the pleasure of it, then comes back for an apple.', 79: 'Spends the day submerged with only its ears showing. Yawns enormously.', 80: 'Two tonnes of river. Surprisingly quick when there is fruit involved.', 81: 'Attracted to everything metal, including your belt buckle. Sorry.', 82: 'Three of them stuck together, going wherever the strongest one goes.', 83: 'Dabbles bottom-up in the shallows and surfaces looking very pleased.', 84: 'Runs faster than a horse on two enormous legs. Eyes bigger than its brain.', 85: 'Fluffy, leggy, and already far too fast to catch.', 86: 'A sleek torpedo in the water and a sack of warm sand on the beach.', 87: 'Grazes sea grass all day. The gentlest thing in the entire ocean.', 88: 'Cheerful pond scum with a personality. Wash your hands afterwards.', 89: 'Bubbles softly and follows you at a respectful, sticky distance.', 90: 'Shuts when startled. Opens again once it has thought things over.', 91: 'Turns an irritation into a pearl, which is a lesson if you want one.', 92: 'Not frightening once you know it. Mostly it just wants company.', 93: 'Drifts through walls, apologising. It cannot help it.', 94: 'Yours, but longer, and it moves a half-second late.', 95: 'Turns the whole garden over a mouthful at a time. Never asks for thanks.', 96: 'A nose like a small trunk, used almost entirely for finding fruit.', 97: 'Striped like sunlight through leaves. Loses the stripes, keeps the nose.', 98: 'Walks sideways with total conviction. Waves one claw at everything.', 99: 'Borrows an empty shell and redecorates. Moves house constantly.', 100: 'Perfectly round and pleased about it. Rolls towards company.', 101: 'Bounces once, twice, and then somewhere nobody expected.', 102: "A rattling handful of next year's meadow.", 103: 'Small enough to carry and patient enough to outlive you.', 104: 'Assembled from very old bones and very new enthusiasm.', 105: 'Stomps everywhere. Has not yet grown into its own feet.', 106: 'Stands upright, waves back, and refuses to explain itself.', 107: 'Copies whatever you do, one beat behind, extremely pleased with itself.', 108: 'Smooth as a wet pebble. Drops its tail when nervous and grows another.', 109: 'Made of everything we threw away. Wants to be cleaned up and cuddled.', 110: 'A cloud with a conscience. Getting better, slowly, with help.', 111: 'Grey, wrinkled and armoured. Naps standing up in the shade.', 112: 'A horn like a lighthouse and the temperament of a sofa.', 113: 'Permanently smiling and permanently a baby. Regrows whatever it misplaces.', 114: 'Grows across the path overnight, politely, and waits to be stepped over.', 115: 'Carries the little one everywhere. Boxes only with cushions.', 116: 'Holds a weed with its tail so it does not drift off in its sleep.', 117: 'Dressed as seaweed and fooling absolutely everybody.', 118: 'Remembers a great deal more than anyone gives it credit for.', 119: 'Trails fins like party streamers. Swims as though being watched. It is.', 120: 'Five arms and no hurry. Regrows any it loses and thinks nothing of it.', 121: 'A small wet star. Holds on to the rock, and to you.', 122: 'Builds a wall out of nothing and then leans on it convincingly.', 123: 'Folds its arms like it is waiting for an apology.', 124: 'Very tall, very calm, and always seems to know exactly what time it is.', 125: 'Swings in, takes the fruit, swings out again. No hard feelings.', 126: 'Sings the dawn in whether or not anybody is listening.', 127: 'Armoured, iridescent, and able to lift a hundred times its own weight.', 128: 'Enormous and gentle. Naps through most disagreements.', 129: 'Flops about dramatically. Grows into something magnificent, eventually.', 130: 'Long as a river and twice as patient. Coils around the ones it loves.', 131: 'A neck like a periscope and flippers like oars. Older than the coastline.', 132: 'One cell and infinite shapes. Becomes whatever the room happens to need.', 133: 'A kit that has not decided what it will be yet. Everything is still open.', 134: 'Barks, claps and balances things, entirely on its own terms.', 135: 'Crackles with static when stroked. Best admired from just out of reach.', 136: 'Fur like river water. Sleeps in the shallows with one ear listening.', 137: 'Made of maths and good intentions. Sings in beeps.', 138: 'A spiral shell from an older ocean. Still faintly smells of it.', 139: 'Coiled tight and armoured. Has waited a very long time to be found.', 140: 'Ancient, plated and unbothered. Scuttles exactly as it always has.', 141: 'Glows faintly under moonlight. Far shyer than the stories suggest.', 142: 'Leathery wings and a rattling call. Older than every bird here.', 143: 'Sleeps through most of the winter and all of the afternoon.', 144: 'Trails frost from its wings. The air goes quiet when it passes.', 145: 'Wings too fast to see and a heart too fast to count. Lives on flowers.', 146: 'Warm to stand near. Starts over as often as it needs to.', 147: 'Small, blue and endlessly long. Loops itself into knots for fun.', 148: 'Coils through the clouds. Sheds its skin and leaves it draped on the hills.', 149: 'Enormous, orange and oddly polite. Announces itself before landing.', 150: 'Watches from somewhere you cannot see, and decides you are alright.', 151: 'Barely here yet. Curls up in a cupped hand and dreams enormously.'}

assert len(ENTRIES) == 151


def build_names():
    """dex number -> (key, display). Repeats get ' 2', ' 3', ... appended."""
    out, seen = {}, {}
    for i, plain in enumerate(ANIMALS, start=1):
        p = plain.upper()
        seen[p] = seen.get(p, 0) + 1
        display = p if seen[p] == 1 else f'{p} {seen[p]}'
        out[i] = (re.sub(r'[^A-Z0-9]', '', display), display)
    return out


def main():
    names = build_names()

    # ---- creatures_data.js: one JSON object per line
    path = os.path.join(JS, 'creatures_data.js')
    src = io.open(path, encoding='utf-8').read()
    entries, prefix = [], []
    for line in src.split('\n'):
        st = line.strip().rstrip(',')
        if st.startswith('{') and st.endswith('}'):
            entries.append(json.loads(st))
        elif not entries:
            prefix.append(line)
    if len(entries) != 151:
        sys.exit(f'expected 151 creatures, parsed {len(entries)}')

    old_to_key = {}
    for c in entries:
        key, display = names[c['num']]
        old_to_key[c['name']] = key
        old_to_key[key] = key            # so re-running on already-renamed data works
        if c.get('key'):
            old_to_key[c['key']] = key
    dupes = len(ANIMALS) - len(set(ANIMALS))

    out = []
    for c in entries:
        key, display = names[c['num']]
        rebuilt = {'num': c['num'], 'key': key, 'name': display}
        for k, v in c.items():
            if k in ('num', 'name', 'key'):
                continue
            if k == 'entry':
                v = ENTRIES[c['num']]
            if k == 'evolve' and v:
                v = dict(v, to=old_to_key[v['to']])
            rebuilt[k] = v
        out.append(rebuilt)

    header = ['// Species table for the 151 creatures. Generated by tools/export_creatures.py,',
              '// then renamed to real animals by tools/rename_creatures.py (RE-RUN THAT after any re-export).',
              '// `key` is the id everything references (and how sprites are named); `name` is what players see.',
              'window.CREATURES = [']
    body = ['  ' + json.dumps(e, separators=(',', ':')) + ',' for e in out]
    io.open(path, 'w', encoding='utf-8').write('\n'.join(header + body + ['];']) + '\n')

    # ---- creatures_art.js: sprite ids are built from the name, so rename those too
    apath = os.path.join(JS, 'creatures_art.js')
    art = io.open(apath, encoding='utf-8').read()
    renamed = 0
    for old, key in sorted(old_to_key.items(), key=lambda kv: -len(kv[0])):
        o, n = old.lower(), key.lower()
        art, a = re.subn(r'"(front|back)_%s"' % re.escape(o), lambda m: '"%s_%s"' % (m.group(1), n), art)
        art, b = re.subn(r'"ow_%s_([a-z0-9_]+)"' % re.escape(o), lambda m: '"ow_%s_%s"' % (n, m.group(1)), art)
        renamed += a + b
    # The legacy ALIAS block mapped old map sprite ids (ow_duck, ow_bunny...) onto species.
    # Those species names are gone, and some alias ids now collide with real species
    # (duck, rabbit), where it would overwrite the new art. Drop it; the hand-drawn
    # animal sprites in js/sprites_animals_*.js are the correct fallback.
    art = re.sub(r'\n *// the maps were written against the old animal names.*?\n( *\}\n)(?=\}\)\(\);)',
                 '\n', art, flags=re.S)
    io.open(apath, 'w', encoding='utf-8').write(art)

    print(f'renamed {len(entries)} creatures ({dupes} duplicate names numbered), {renamed} sprite ids')
    print('rewrote 151 dex entries to match the real animals')
    ex = [f'#{n} {names[n][1]}' for n in (1, 37, 38, 54, 63, 128, 151)]
    print('examples:', ', '.join(ex))


if __name__ == '__main__':
    main()
