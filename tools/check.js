// Dependency-free checks against the same scripts and definitions as index.html.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const www = path.join(__dirname, '../www');
const html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const listeners = {}, elements = new Map(), saved = new Map();
const context2d = new Proxy({}, { get: (o, k) => o[k] || (() => k === 'measureText' ? {width:20} : k.startsWith('create') ? {addColorStop(){}} : undefined), set: (o,k,v) => (o[k]=v,true) });
function element(id){
  if (!elements.has(id)) elements.set(id, {tagName:'DIV', style:{}, hidden:false, textContent:'', classList:{toggle(){}}, setAttribute(){}, setPointerCapture(){}, addEventListener(type, fn){ (listeners[id+':'+type] ||= []).push(fn); }, getContext:()=>context2d, getBoundingClientRect:()=>({width:1000,height:700,left:0,top:0})});
  return elements.get(id);
}
const sandbox = {console, Math, Set, Map, performance:{now:()=>0}, navigator:{}, matchMedia:()=>({matches:true}), requestAnimationFrame(){}, setTimeout:()=>0, clearTimeout(){}, localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)}, document:{getElementById:element,createElement:()=>element('canvas'+elements.size),addEventListener(type,fn){(listeners['document:'+type] ||= []).push(fn);}}, addEventListener(type,fn){(listeners[type] ||= []).push(fn);}};
sandbox.window=sandbox;
vm.createContext(sandbox);
assert.equal(scripts[0], 'js/core.js');
assert.equal(scripts.at(-1), 'js/game.js');
for (const src of scripts){
  assert(fs.existsSync(path.join(www,src)), `Missing script ${src}`);
  new vm.Script(fs.readFileSync(path.join(www,src),'utf8'), {filename:src}).runInContext(sandbox);
}
const {Game, Tiles, Input} = sandbox;
const map=Game.map, width=map.tiles[0].length;
assert(map.tiles.every(row=>row.length===width), 'Map rows differ');
for (const row of map.tiles) for (const tile of row) assert(tile in Tiles.LEGEND, `Unknown tile ${tile}`);
const occupied=new Map();
// Preserve the approved exterior placement, but fail on new fixture overlaps.
const knownOverlaps = new Set(['114,88:bollard:cartCorral']);
for (const prop of map.props){
  assert(prop.type in Tiles.PROPS, `Unknown fixture ${prop.type}`);
  assert(Tiles.propImage(prop.type, prop.rotation), `Missing fixture artwork ${prop.type}`);
  const size=Tiles.PROPS[prop.type], w=prop.rotation===-90?size.h:size.w, h=prop.rotation===-90?size.w:size.h;
  assert(prop.x>=0 && prop.y>=0 && prop.x+w<=width && prop.y+h<=map.tiles.length, `Out of bounds ${prop.type}`);
  if(prop.solid===false) continue;
  for(let y=prop.y;y<prop.y+h;y++) for(let x=prop.x;x<prop.x+w;x++){
    const key=x+','+y;
    if(occupied.has(key)){
      assert(knownOverlaps.has(`${key}:${occupied.get(key)}:${prop.type}`), `New fixture overlap at ${key}`);
      console.warn(`REVIEW: solid fixtures overlap at ${key}: ${occupied.get(key)} / ${prop.type}`);
    }
    assert(!Tiles.SOLID.has(map.tiles[y][x]), `Fixture overlaps solid tile: ${prop.type} ${key}`);
    occupied.set(key,prop.type);
  }
}
for(const person of [Game.player,...Game.characters]) for(const key of ['portrait','portraitLarge']) if(person[key]) assert(fs.existsSync(path.join(www,person[key])), `Missing portrait ${person[key]}`);
for(const person of [...Game.characters,...Game.stations]) for(const line of person.conversation||[]) if(line.sound) assert(fs.existsSync(path.join(www,line.sound)),`Missing sound ${line.sound}`);
const debug=Game.debug;
assert(!debug.blocked(debug.player.x,debug.player.y,debug.player),'Invalid player spawn');
for(const n of debug.people) assert(!debug.blocked(n.px,n.py,n),`Invalid employee spawn ${n.name}`);
for(const v of debug.vehicles) assert(!debug.blocked(v.px,v.py,v),`Invalid vehicle spawn ${v.name}`);
// Flood fill the approved layout; stations may occupy solid counters, so check approach range.
const start=[map.start.x,map.start.y], reached=new Set([start.join(',')]), queue=[start];
for(let i=0;i<queue.length;i++) for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const [x,y]=[queue[i][0]+dx,queue[i][1]+dy], key=x+','+y;
  if(x<0||y<0||x>=width||y>=map.tiles.length||reached.has(key)||Tiles.SOLID.has(map.tiles[y][x])||occupied.has(key)) continue;
  reached.add(key);queue.push([x,y]);
}
// Pharmacy is intentionally closed; Hearing's west entrance stays usable.
assert(!reached.has('95,5'), 'Closed pharmacy interior is reachable');
assert(reached.has('98,14'), 'Pharmacy wall blocks Hearing entrance');
for(const c of Game.characters){
  const direct=reached.has(c.position.x+','+c.position.y);
  const acrossCounter=c.interactionRange && queue.some(([x,y])=>Math.hypot((x-c.position.x)*32,(y-c.position.y)*32)<c.interactionRange);
  assert(direct || acrossCounter,`Unreachable employee ${c.name}`);
}
for(const s of Game.stations) assert(queue.some(([x,y])=>Math.hypot((x-s.position.x)*32,(y-s.position.y)*32-2)<56),`Unreachable station ${s.name}`);
for(let y=0;y<map.tiles.length;y++) for(let x=0;x<width;x++) if(map.tiles[y][x]==='M') assert(reached.has(x+','+y),`Blocked doorway ${x},${y}`);
// Start and complete every existing employee conversation without editing dialogue.
element('startBtn').onclick();
for(const n of debug.people){
  debug.teleport(Math.floor(n.px/32)-1,Math.floor(n.py/32));
  debug.talk(); assert(!element('dialog').hidden,`Cannot talk to ${n.name}`);
  for(let i=0;i<n.lines.length*2;i++) debug.talk();
  assert(element('dialog').hidden,`Cannot close conversation with ${n.name}`);
  element('keepBtn').onclick();
}
const v=debug.vehicles[0];
debug.teleport(Math.floor(v.px/32),Math.floor(v.py/32)+1);
debug.talk();assert.equal(debug.driving,v,'Cannot board forklift');
// The forks and wheels must collide, including when reversing and moving fast.
const oldX=debug.player.x, oldY=debug.player.y;
assert(debug.blocked(102*32, 25*32, debug.player),'Forklift passes through checkout wall');
assert(debug.blocked(debug.people[0].px, debug.people[0].py, debug.player),'Forklift passes through employee');
debug.player.dir='right';
assert.equal(debug.footprint(oldX,oldY,debug.player).r-oldX,48,'Forks missing from footprint');
debug.player.x=95*32;debug.player.y=25*32;
debug.move(debug.player,900,0,1);
assert(debug.player.x<98*32,'Fast movement crosses optical counter or wall');
debug.player.x=oldX;debug.player.y=oldY;debug.player.dir='up';
// Simulate parking elsewhere before exit: vehicle coordinates used to remain stale.
debug.player.x=60*32;debug.player.y=60*32;
debug.talk();assert.equal(debug.driving,null,'Cannot exit forklift');
assert(!debug.blocked(debug.player.x,debug.player.y,debug.player),'Exit overlaps forklift');
assert(saved.size>0,'No progress saved');
const parkedX=v.px, parkedY=v.py;
new vm.Script(fs.readFileSync(path.join(www,'js/game.js'),'utf8')).runInContext(sandbox);
assert.equal(Game.debug.vehicles[0].px,parkedX,'Vehicle parking x not restored');
assert.equal(Game.debug.vehicles[0].py,parkedY,'Vehicle parking y not restored');
element('startBtn').onclick();
Game.debug.player.x=parkedX;Game.debug.player.y=parkedY+32;
Game.debug.talk();assert(Game.debug.driving,'Cannot board restored forklift');
// Fill every dismount candidate with employees and ensure Preston stays aboard.
const rider=Game.debug.player, box=Game.debug.footprint(rider.x,rider.y,rider);
const candidates=[[box.l-11,rider.y],[box.r+11,rider.y],[rider.x,box.b+14],[rider.x,box.t-2]];
const originalPeople=Game.debug.people.slice();
Game.debug.people.push(...candidates.map(([px,py])=>({px,py,dir:'down'})));
Game.debug.talk();assert(Game.debug.driving,'Exited into a blocked location');
Game.debug.people.splice(originalPeople.length);
listeners.pagehide.forEach(fn=>fn());
new vm.Script(fs.readFileSync(path.join(www,'js/game.js'),'utf8')).runInContext(sandbox);
assert(Game.debug.driving,'Driving state not restored');
assert(!Game.debug.blocked(Game.debug.player.x,Game.debug.player.y,Game.debug.player),'Restored rider is blocked');
Input.keys.up=true; listeners.blur.forEach(fn=>fn());assert.equal(Input.keys.up,false,'Blur leaves movement active');
let actions=0;Input.onAction=()=>actions++;
listeners.keydown.forEach(fn=>fn({code:'Space',repeat:true,target:{tagName:'DIV'},preventDefault(){}}));
assert.equal(actions,0,'Held action repeats');
console.log(`PASS: ${scripts.length} scripts; ${width}×${map.tiles.length} map; ${map.props.length} fixtures; assets, spawns, doors, reachability, dialogue, forklift exit, saving, input.`);
