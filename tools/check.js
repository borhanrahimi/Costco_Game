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
// Deli and Meat stay closed; Bakery, Dairy and Produce are accessible.
assert(reached.has('20,66'), 'Chicken-room connecting door must provide access to Meat');
for(const [name,x,y] of [['Dairy',9,37],['Produce',40,82],['Bakery',20,81],['Deli',20,50],['Rotisserie',21,57]])
  assert(reached.has(x+','+y), `Unreachable cooler: ${name}`);
for(let y=43;y<=73;y++)
  assert(reached.has('31,'+y), `Blocked back-department customer aisle at ${y}`);
for(let x=4;x<=15;x++){
  for(const y of [41,42,43])assert.equal(map.tiles[y][x], 'S', 'Dairy / Deli divider wastes floor space');
  assert.equal(map.tiles[44][x], 'Z', 'Dairy and Deli must share one wall');
}
for(let x=4;x<=27;x++){
  for(const y of [56,57,58]){
    if(x===17)assert.equal(map.tiles[y][x], 'h');
    else assert.notEqual(map.tiles[y][x], 'Z', 'Deli / Meat divider wastes floor space');
  }
  assert.equal(map.tiles[59][x], x>=26||x===6||x===7?'M':x>=17?'h':'Z', 'Deli and Meat must share one wall with connecting doors');
}
for(let y=60;y<=73;y++)assert.equal(map.tiles[y][28], y>=72?'M':'j', 'Meat frontage must end with an east-side door near Bakery');
assert.equal(map.tiles[74][28], 'M', 'Wall block beside the east Meat door must leave its opening visible');
for(let x=4;x<=27;x++){
  for(const y of [71,72,73])assert.equal(map.tiles[y][x], '.', 'Meat / Bakery divider wastes floor space');
  assert.equal(map.tiles[74][x], 'Z', 'Meat and Bakery must share one wall');
}

for(let x=3;x<=46;x++)assert.equal(map.tiles[87][x], 'W', 'South exterior must use the normal khaki wall');
// Produce cannot lead around the shelf end into the strip behind Bakery.
for(let x=3;x<=28;x++)assert(!reached.has(x+',86'), 'Produce allows walking behind bakery shelves');
assert(reached.has('30,86'), 'Closing Bakery must preserve Produce access');
for(const type of ['bakeryFascia']){
  const fixture=map.props.find(p=>p.type===type);
  assert.equal(fixture.rotation,-90, 'Bakery frontage must face the east member aisle');
  assert(fixture.x>=27, 'Bakery frontage is hidden away from member aisle');
}
for(let y=36;y<=58;y++)assert.equal(map.tiles[y][17], y===51||y===52?'M':y>=54?'h':'Z', 'Deli must occupy the marked bay beside Dairy');
for(let x=18;x<=27;x++)assert.equal(map.tiles[44][x], '.', 'Crossed-out Deli divider must be removed');
assert(reached.has('23,38'), 'Deli entrance must connect to its north bay');
for(const y of [...Array.from({length:14},(_,i)=>36+i),52,53]){
  assert.equal(map.tiles[y][28],'j','Deli window / case must form one column');
  assert.notEqual(map.tiles[y][27],'N','Separate inner case must be removed');
}
assert(map.props.some(p=>p.type==='whiteStaffDoor'&&p.x===28&&p.y===50&&p.rotation===-90),'Deli entrance needs a white member-facing door');

const rotisserieSign=map.props.find(p=>p.type==='rotisserieFascia');
assert.equal(rotisserieSign.x,28,'Rotisserie sign must be mounted on the frontage wall');
assert.equal(rotisserieSign.rotation,-90);
assert(reached.has('30,56'),'Rotisserie frontage must have a clear member approach');

for(let x=18;x<=27;x++)assert.equal(map.tiles[54][x], x===25||x===26?'M':'h', 'Rotisserie must form the marked small Deli room');

// Bakery stock is visible over a low, solid counter rather than a white wall.
for(let x=4;x<=27;x++)assert.equal(map.tiles[85][x], 'G', 'Bakery south frontage must be low pastry displays');
// Produce's south face uses low fresh-produce bins, with walkable gaps.
for(let x=29;x<=45;x++)assert.notEqual(map.tiles[85][x], 'Z', 'Produce south wall hides stock');
for(const x of [30,33,37,41])assert(reached.has(x+',85'), 'Produce bins block a south approach');
for(let y=75;y<=78;y++){
  assert(reached.has('29,'+y), 'Bakery display must face an accessible member aisle');
  assert.equal(map.tiles[y][28], 'G', 'Bakery display frontage must remain visible and solid');
}


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
  if(n.name==='Carlos')assert(n.madT>0,'Carlos must get angry as soon as conversation starts');
  for(let i=0;i<n.lines.length*2;i++) debug.talk();
  assert(element('dialog').hidden,`Cannot close conversation with ${n.name}`);
  if(n.name==='Amanda'){
    assert.equal(debug.thought,"TORTA!",'Amanda conversation must trigger first thought');
    debug.step(4.1);
    assert.equal(debug.thought,"Idk how I did TORTA!",'Follow-up must appear after TORTA');
  }
  element('keepBtn').onclick();
}
// Erik uses his callout pool in direct conversations, with his photo visible.
const supervisor=debug.people.find(n=>n.name==='Erik');
debug.teleport(Math.floor(supervisor.px/32)-1,Math.floor(supervisor.py/32));
let previousQuote=supervisor.lines[0].text;
for(let visit=0;visit<3;visit++){
  debug.talk();
  assert(supervisor.callouts.includes(supervisor.lines[0].text),'Erik must quote his callout pool to Preston');
  assert.notEqual(supervisor.lines[0].text,previousQuote,'Erik should vary his direct replies');
  assert.equal(element('dPortrait').hidden,false,'Erik portrait must appear with random dialogue');
  previousQuote=supervisor.lines[0].text;
  debug.talk();debug.talk();element('keepBtn').onclick();
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
// Omar runs both directions beside the registers and stops for conversation.
const omar=Game.debug.people.find(n=>n.name==='Omar');
assert(omar && omar.look.heightScale<.7,'Omar must be visibly short');
Game.debug.teleport(90,60);
const omarStartY=omar.py, directions=new Set();
const carlos=Game.debug.people.find(n=>n.name==='Carlos'),borhan=Game.debug.people.find(n=>n.name==='Borhan');
const banterSeen=new Set();let cashiersMoved=false, reachedBack=false, returnedToRegisters=false;
assert.equal(omar.look.vest,"#d8352a",'Omar needs his Costco vest');
Game.debug.step(1);
assert.equal(omar.py,omarStartY,'Omar needs a pause before running');
for(let i=0;i<1000;i++){
  Game.debug.step(.02);directions.add(omar.dir);
  for(const cashier of [carlos,borhan]){
    if(cashier.bubble){
      banterSeen.add(cashier.bubble);
      assert(carlos.madT>0,'Carlos must stay angry throughout the cashier conversation');
    }
    assert(!Game.debug.blocked(cashier.px,cashier.py,cashier),'Cashier walked into a fixture or person');
  }
  if(Math.abs(omar.py-190)<1)reachedBack=true;
  if(reachedBack && Math.abs(omar.py-omarStartY)<1)returnedToRegisters=true;
  if(carlos.py!==carlos.hy && borhan.py!==borhan.hy)cashiersMoved=true;
  assert(omar.py>=(5+1)*32-2 && omar.py<=(35+1)*32-2,'Omar left his store route');
  assert(!Game.debug.blocked(omar.px,omar.py,omar),'Omar ran into a fixture');
}
assert(directions.has('up')&&directions.has('down'),'Omar must run back and forth');
assert(reachedBack && returnedToRegisters,'Omar must dash to the back and return');
assert(cashiersMoved,'Carlos and Borhan must walk toward each other');
assert(banterSeen.has(carlos.banter.line)&&banterSeen.has(carlos.banter.reply),'Both cashiers need their ambient lines');
Game.debug.player.x=omar.px-30;Game.debug.player.y=omar.py;
const stoppedY=omar.py;Game.debug.step(.02);
assert.equal(omar.py,stoppedY,'Omar must stop near Preston');
assert.equal(omar.lines[0].text,"What's up kid?");
assert.equal(omar.lines[1].text,"Whats up mihito?");
// Erik calls out without interaction, uses the configured pool, and avoids repeats.
const erik=Game.debug.people.find(n=>n.name==='Erik');
Game.debug.teleport(90,60);
erik.calloutTime=0;erik.calloutWait=0;Game.debug.step(.02);
assert(erik.callouts.includes(erik.bubble),'Erik needs a random ambient quote');
assert(!erik.moving,'Erik must pause to deliver his callout');
const firstCallout=erik.bubble;
Game.debug.step(4.1);assert.equal(erik.bubble,null,'Erik callout must clear');
erik.calloutWait=0;Game.debug.step(.02);
assert.notEqual(erik.bubble,firstCallout,'Erik must not repeat a callout immediately');
// Omar's call is local to the front, never audible from elsewhere.
const originalMigMig=sandbox.Sound.migMig;let migCalls=0;
sandbox.Sound.migMig=()=>migCalls++;
function startOmarDash(){
  omar.px=omar.hx;omar.py=omar.hy;omar.dashRoute=null;omar.patrolIndex=1;omar.patrolWait=0;
  Game.debug.step(.02);
}
Game.debug.teleport(94,35);startOmarDash();
assert.equal(migCalls,1,'Omar call must be audible at the front');
Game.debug.teleport(70,5);startOmarDash();
assert.equal(migCalls,1,'Omar call must be silent away from the front');
Game.debug.teleport(94,35);
omar.px=74.5*32;omar.py=6*32-2;omar.dashRoute=null;omar.patrolIndex=0;omar.patrolWait=0;
Game.debug.step(.02);
assert.equal(migCalls,1,'Back-of-store departure must be silent at the front');
sandbox.Sound.migMig=originalMigMig;
// Entering the stock cooler triggers a complaint; leaving clears the cold state.
Game.debug.teleport(7,58);Game.debug.step(.02);
assert(Game.debug.cold, 'Preston must feel cold in the stock cooler');
assert(Game.debug.thought && element('toast').textContent.includes(Game.debug.thought), 'Cooler entry needs a visible cold complaint');
Game.debug.step(5);Game.debug.step(20);
assert(Game.debug.thought, 'Staying in the cooler needs another complaint');
Game.debug.teleport(10,60);Game.debug.step(.02);
assert(!Game.debug.cold, 'Preston must warm up after leaving the cooler');
assert.equal(Game.debug.thought,null,'Cold complaint must clear after leaving');
let actions=0;Input.onAction=()=>actions++;
listeners.keydown.forEach(fn=>fn({code:'Space',repeat:true,target:{tagName:'DIV'},preventDefault(){}}));
assert.equal(actions,0,'Held action repeats');
console.log(`PASS: ${scripts.length} scripts; ${width}×${map.tiles.length} map; ${map.props.length} fixtures; assets, spawns, doors, reachability, dialogue, forklift exit, saving, input.`);
