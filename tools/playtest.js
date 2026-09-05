#!/usr/bin/env node
// Automated full playthrough in the headless engine: new game -> starter -> Route 1 -> Verdant -> Route 2 -> Violet -> gym -> party.
// Usage: node tools/playtest.js [--verbose]
const B = require('./bot');
const { W, G, DATA, log, vlog, fail, top, P, settle, goTo, faceAndPress, findObj, findEnt, talkTo, exitVia, enterDoor, leaveInterior, healAtCenter, buyAtMart, party, setRescueBudget, stepDir, travelTo } = B;
// ---------- playthrough ----------
log('== title / new game');
B.newGame();
if (G.map.id !== 'player_house_2f') fail('intro did not end in bedroom (' + (G.map && G.map.id) + ')');
log('name', G.state.name, 'rival', G.state.rival, 'map', G.map.id);
log('== house');
goTo(7, 1); settle(); if (G.map.id !== 'player_house_1f') fail('stairs warp failed');
leaveInterior(); if (G.map.id !== 'pallet') fail('house exit failed');
log('== professor');
const trig = findObj(o => o.type === 'trigger' && o.script === 'prof_stop'); goTo(trig.x, trig.y); settle();
if (G.map.id !== 'lab') fail('prof cutscene did not lead to lab (' + G.map.id + ')');
// the starters are ball items on the table now, and OAT has already walked you over
const basket = findObj(o => o.script === 'pick_starter');
goTo(basket.x, basket.y + 1); settle(); faceAndPress(basket.x, basket.y); settle();
log('starter:', party(), 'flags', Object.keys(G.state.flags).join(','), 'money', G.state.money);
if (!G.state.party.length) fail('no starter received');
leaveInterior(); if (G.map.id !== 'pallet') fail('lab exit failed');
log('== route 1');
exitVia('north'); if (G.map.id !== 'route1') fail('did not reach route1'); else {
  setRescueBudget(3);
  for (const id of ['r1_bbqdad', 'r1_grandpa']) { const e = findEnt(id); if (e && !G.state.defeated[id]) { talkTo(e); travelTo('route1'); } }
  log('route1 trainers:', Object.keys(G.state.defeated).join(','), party());
  exitVia('north'); if (G.map.id !== 'verdant') fail('did not reach verdant from route1');
}
log('after route1:', party(), 'money', G.state.money, 'beans', G.state.beans, 'converted', G.state.converted, 'era', G.era);
if (G.map.id === 'verdant') {
  log('== verdant');
  healAtCenter('verdant'); buyAtMart('verdant', 'OATS'); buyAtMart('verdant', 'NOOCH');
  for (const t of ['vikram', 'gabriele']) { const e = findEnt(t); if (e) talkTo(e); else fail('team member ' + t + ' not on verdant'); }
  exitVia('north'); if (G.map.id !== 'route2') fail('did not reach route2');
}
if (G.map.id === 'route2') {
  log('== route 2');
  let cowTries = 0;
  while (!G.flag('cow_gone') && cowTries++ < 3) { travelTo('route2'); const cow = findEnt('sleeping_cow'); if (!cow) { fail('no sleeping cow'); break; } setRescueBudget(1); talkTo(cow); if (G.map.id !== 'route2') { log('whiteout on route2, healing and returning'); } }
  log('cow gone:', G.flag('cow_gone'), party());
  setRescueBudget(2);
  let vTries = 0; while (G.map.id !== 'violet' && vTries++ < 3) { travelTo('route2'); exitVia('north'); }
  if (G.map.id !== 'violet') fail('did not reach violet');
  log('after route2:', party(), 'rival2', G.flag('rival2'), 'converted', G.state.converted, 'era', G.era);
}
if (G.map.id === 'violet') {
  log('== violet city');
  healAtCenter('violet'); buyAtMart('violet', 'SUPER NOOCH'); buyAtMart('violet', 'SEEDS'); buyAtMart('violet', 'SEEDS');
  const statue = findObj(o => o.type === 'interact' && o.script === 'pigeon_statue'); if (statue) { setRescueBudget(1); goTo(statue.x, statue.y, { stopAdjacent: true }); faceAndPress(statue.x, statue.y); log('pigeon:', G.flag('pigeon_done'), party()); } else fail('no pigeon statue');
  // hall locked
  const hallDoor = findObj(o => o.type === 'warp' && o.map === 'violet_hall'); if (hallDoor) { goTo(hallDoor.x, hallDoor.y + 2); stepDir('up'); settle(); if (G.map.id === 'violet_hall') fail('hall should be locked before the badge'); else if (P().y !== hallDoor.y + 2) fail('hall_door lock did not push the player back (at ' + P().x + ',' + P().y + ')'); else vlog('hall locked as expected'); } else fail('no hall door');
  healAtCenter('violet');
  let gymTries = 0;
  while (!G.flag('badge') && gymTries++ < 8) {
    healAtCenter('violet'); travelTo('violet'); if (!enterDoor('violet_gym')) break;
    const order = ['gym_cheese', 'gym_sci', 'gym_leader'];
    let fought = false;
    for (const id of order) {
      if (G.state.defeated[id]) continue;
      const e = findEnt(id); if (!e) { fail('missing gym npc ' + id); break; }
      talkTo(e); fought = true;
      if (G.map.id !== 'violet_gym') { log('lost a gym fight (whiteout) at', id, party()); break; }
      const lead = G.state.party[0]; if (lead && lead.hp < lead.maxHp * 0.6 && !G.flag('badge')) { log('healing between gym fights after', id); leaveInterior(); break; }
    }
    if (!fought) break;
  }
  log('badge:', G.flag('badge'), 'party', party(), 'converted', G.state.converted, 'gym tries', gymTries);
  if (G.map.id === 'violet_gym') leaveInterior();
  if (G.flag('badge')) { const hd = findObj(o => o.type === 'warp' && o.map === 'violet_hall'); goTo(hd.x, hd.y); settle(); if (G.map.id !== 'violet_hall') fail('could not enter hall with badge'); else { const tr = findObj(o => o.type === 'trigger' && o.script === 'party_enter'); goTo(tr.x, tr.y); settle(); log('party_done:', G.flag('party_done')); if (!G.flag('party_done')) fail('party scene did not run'); for (const t of ['kate', 'david']) { const e = findEnt(t); if (e) talkTo(e); else fail('missing ' + t + ' at party'); } } }
}
log('== summary');
log('party:', party()); log('beans', G.state.beans + '/' + DATA.TOTAL_BEANS, 'money', G.state.money, 'converted', G.state.converted, 'badges', G.state.badges.join(','), 'dex seen', Object.keys(G.state.dex.seen).length, 'rescued', Object.keys(G.state.dex.rescued).length, 'playFrames', G.state.playFrames);
if (W.__errors.length) { fail('console errors: ' + W.__errors.slice(0, 5).join(' | ')); }
const warns = W.__warnings.filter(w => !/missing sprite/.test(w)); if (warns.length) log('warnings:', warns.slice(0, 10).join(' | '));
log(process.exitCode ? 'PLAYTEST: FAILED' : 'PLAYTEST: OK');
