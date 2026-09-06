// Team members from Vegan Hacktivists and Violet Studios as NPCs. Maps place them with { type:'npc', team:'kate', x, y, ... }.
(function () {
  const T = window.TEAM = {};
  const mk = (id, name, sprite, pal, dialog, extra) => { T[id] = Object.assign({ id: 'team_' + id, name, sprite, pal, dialog, move: 'wander', range: 2 }, extra || {}); };
  // Each colour carries its Game Boy shade (:0-:3) as well as its RGB. Without it the engine
  // falls back to the base sprite's shade, so every recoloured NPC came out identical in era 0.
  // The spread is what tells them apart in Pallet Town, where there is no colour to go on.
  const P = { purple: '#8a5cd6:1', green: '#48a860:2', teal: '#40a8a0:3', pink: '#e070a0:3', blue: '#5878e0:1',
    yellow: '#e8c040:3', red: '#d04848:1', orange: '#e88840:2', dark: '#303040:0', brown: '#8a5a30:1',
    black: '#202020:0', blond: '#e0c060:3' };

  // ---- Vegan Hacktivists
  mk('david', 'DAVID', 'hoodie', { t: P.purple, h: P.brown }, G => [
    'DAVID: I founded VEGAN HACKTIVISTS in 2019 with one laptop and too much coffee.',
    'DAVID: Then I hired someone better to run it. Best decision I ever made. Happy birthday, ' + G.state.name + '!',
    'DAVID: Also I play the handpan now. Everyone is very supportive. Allegedly.']);
  mk('michael', 'MICHAEL', 'man', { t: P.blue, h: P.brown }, ['MICHAEL: Strategic Initiatives Lead. That means I make spreadsheets that make things happen.', 'MICHAEL: Initiative for today: cake.']);
  mk('gabriele', 'GABRIELĖ', 'woman', { t: P.teal, h: P.dark }, ['GABRIELĖ: Communications Director. I write the words. All of them. Even these.', 'GABRIELĖ: Fuzzy caterpillars are the best animal. I said what I said.', 'GABRIELĖ: Burning out is not a productivity strategy. Go drink a matcha.']);
  mk('vikram', 'VIKRAM', 'man', { t: P.black, h: P.black, p: '#404040' }, ['VIKRAM: Product Design Director. I make sure everything we build is useful, usable, and kind.', 'VIKRAM: My dog BELLA reviewed this game. Two paws up.', 'VIKRAM: Tonight: a punk show. Tomorrow: the opera. Balance.']);
  mk('kate', 'KATE', 'woman', { t: P.purple, h: P.blond }, ['KATE: Creative Director at VIOLET STUDIOS! I designed the logo. I designed ALL the logos.', 'KATE: Board game night is Tuesday. Bring snacks. Winning is optional. Snacks are not.']);
  mk('tobias', 'TOBIAS', 'hoodie', { t: P.green, h: P.blond }, ['TOBIAS: Senior Developer. I fixed a bug in this town this morning. You\'re welcome.', 'TOBIAS: Grüße aus Deutschland! Vegan currywurst is real and it is glorious.']);
  mk('jeremy', 'JÉRÉMY', 'hoodie', { t: P.red, h: P.dark }, ['JÉRÉMY: Senior Developer, straight from PARIS. My chinchilla GRIBOUILLE says bonjour.', 'JÉRÉMY: Tofu, broccoli, rice. Lazy dinner, happy developer.']);
  mk('steven', 'STEVEN', 'man', { t: P.teal, h: P.brown }, ['STEVEN: AI Program Director. The AI wanted to write this line. I did not let it.', 'STEVEN: ...okay, it wrote the second line. It says hello.']);
  mk('richie', 'RICHIE', 'man', { t: P.orange, h: P.dark }, ['RICHIE: AI Impact Director. I measure impact.', 'RICHIE: This game\'s measured impact: one (1) very happy Executive Director.']);
  mk('mike', 'MIKE', 'man', { t: P.red, h: P.blond }, ['MIKE: AI Implementation Specialist, from CANADA. Sorry.', 'MIKE: If it breaks, it\'s a feature. If it works, it\'s AI.']);
  mk('aaron', 'AARON', 'man', { t: P.green, h: P.red }, ['AARON: AI Impact Director, from IRELAND. Yes, the stout is vegan now. You\'re welcome.', 'AARON: Impact so far today: rescued a DUCK. Named it Impact.']);
  mk('ximena', 'XIMENA', 'woman', { t: P.pink, h: P.black }, ['XIMENA: Community Management! I keep the DISCORD kind and the memes fresh.', 'XIMENA: ¡Feliz cumpleaños! There is a channel just for cake photos now.']);

  // ---- Violet Studios
  mk('elizabeth', 'ELIZABETH', 'woman', { t: P.green, h: P.brown }, ['ELIZABETH: Website Designer at VIOLET STUDIOS. I spend weekends with sanctuary animals.', 'ELIZABETH: This town is basically my ideal weekend. Woodland walks and goats.']);
  mk('thomas', 'THOMAS', 'man', { t: P.purple, h: P.dark }, ['THOMAS: Motion Designer & Illustrator. I make things wiggle for a living.', 'THOMAS: Everything here should be wiggling. Budget cuts. Also: martial arts at 7, restaurants at 9.']);
  mk('luuly', 'LUULY', 'woman', { t: P.yellow, h: P.black }, ['LUULY: Brand Designer & Strategist. I recreate restaurant dishes at home. Better. Usually.', 'LUULY: I\'m learning the kalimba. It\'s like a tiny piano for your thumbs.']);
  mk('lucas', 'LUCAS', 'hoodie', { t: P.orange, h: P.dark }, ['LUCAS: Graphic Designer. I do embroidery. Yes, this is a pixel bunny stitched on my hoodie.', 'LUCAS: Video games, books, films, drawing... and this game, which is somehow all four.']);
  mk('chloe', 'CHLOË', 'woman', { t: P.blue, h: P.blond }, ['CHLOË: Communications & Brand Strategy Director. Brand strategy for today: BIRTHDAY.', 'CHLOË: WINNIE the dog and MELON the cat send birthday licks. I\'m learning piano to write them a song.']);
  mk('dee', 'DEE', 'woman', { t: P.teal, h: P.red }, ['DEE: Project Manager & Designer. The project today is joy. It\'s on schedule.', 'DEE: BRUNO the dog is the real project manager. Board games later?']);

  // ---- Advisors (party guests)
  mk('jennifer', 'JENNIFER', 'woman', { t: P.red, h: P.brown }, ['JENNIFER: Advisor at VIOLET STUDIOS. My advice? Make it pop!']);
  mk('lauren', 'LAUREN', 'woman', { t: P.green, h: P.blond }, ['LAUREN: Advisor. I advise on philanthropy. Today I advise on party hats.']);
  mk('casey', 'CASEY', 'woman', { t: P.yellow, h: P.dark }, G => ['CASEY: Communications strategist. Strategy: tell ' + G.state.name + ' they\'re great. Repeat.']);

  // ---- Flavor NPCs that reference James
  mk('berliner', 'TOURIST', 'girl', { t: P.yellow, h: P.red }, ['TOURIST: I\'m visiting from BERLIN! The vegan food there is the best in the world.', 'TOURIST: Don\'t tell LONDON I said that. LONDON is also great. Ugh, they\'re both great.'], { sprite: 'girl' });
  mk('cinephile', 'CINEPHILE', 'man', { t: P.black, h: P.black }, ['NICK: Have you seen KATE? She yelled "DESIGN THIS" and I haven\'t seen her for 3 days since.']);
  mk('swimmer', 'SWIMMER', 'boy', { t: P.blue, h: P.blond }, ['SWIMMER: I swim every morning. Rain or shine. Duck or no duck.']);
  mk('pigeonfan', 'PIGEON FAN', 'oldman', {}, ['PIGEON FAN: Pigeons are underrated. Iridescent. Loyal. They find their way home from anywhere.', 'PIGEON FAN: There is a legendary one in this city. Bring SEEDS.']);
})();
