// game.js — runs the game: loads the map and characters, moves Preston,
// handles conversations, draws everything, and shows the menus.
// To change the store or the people, edit maps/ and characters/ instead.

(() => {
  const TS = Game.TS, VH = 360, SPEED = 200, TALK_RANGE = 56;
  // Foreshorten floor depth for a shallower three-quarter presentation.
  const DEPTH = .8, WORLD_VH = VH / DEPTH;
  const $ = id => document.getElementById(id);
  const canvas = $("game"), ctx = canvas.getContext("2d");
  let VW = 600;

  // ---------------------------------------------------------------- map
  const M = Game.map;
  if (!M) throw new Error("No map loaded. Check that maps/warehouse.js is listed in index.html.");
  const MW = Math.max(...M.tiles.map(r => r.length)), MH = M.tiles.length;
  const grid = M.tiles.map((row, i) => {
    if (row.length !== MW) console.warn(`Map row ${i} is ${row.length} squares wide, expected ${MW}. Filling the gap with wall.`);
    return row.padEnd(MW, "W").split("");
  });
  // Props (like the forklift) block the squares they cover.
  const props = (M.props || []).map(p => {
    const size=Tiles.PROPS[p.type] || { w:1,h:1 };
    return {...p,size:p.rotation === -90 ? {w:size.h,h:size.w}:size};
  });
  const propSolid = new Set();
  props.filter(p => p.solid !== false).forEach(p => { for (let y = 0; y < p.size.h; y++) for (let x = 0; x < p.size.w; x++) propSolid.add((p.x + x) + "," + (p.y + y)); });
  const isSolid = (tx, ty) => tx < 0 || ty < 0 || tx >= MW || ty >= MH || Tiles.SOLID.has(grid[ty][tx]) || propSolid.has(tx + "," + ty);
  const isObject = c => Tiles.HEIGHT[c] > 0;

  // ---------------------------------------------------------------- people
  const P = Game.player || { name: "Preston", look: Outfit.forklift, voice: { pitch: 300 } };
  const playerLook = { ...Outfit.forklift, ...P.look };
  const SAVE_KEY = "prestons-shift-save-v1";

  function loadProgress(){
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      return saved && saved.version === 1 ? saved : null;
    } catch (e) {
      console.warn("Couldn't load shift progress:", e);
      return null;
    }
  }

  function saveProgress(){
    if (!player || !npcs || state === "title") return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        version: 1,
        player: { x: player.x, y: player.y, dir: player.dir },
        talked: npcs.filter(n => n.talked).map(n => n.name),
        driving: driving ? vehicles.indexOf(driving) : null,
        vehicles: vehicles.map(v => ({ x: v.px, y: v.py, dir: v.dir })),
        hotdogs,
        doneShown,
      }));
    } catch (e) {
      console.warn("Couldn't save shift progress:", e);
    }
  }

  // Turn whatever is in a character file into a list of { who, text, sound } lines.
  function readConversation(c){
    const raw = c.conversation || (c.line ? [c.line] : ["..."]);
    return raw.map(l => typeof l === "string" ? { who: c.name, text: l } : { who: l.who || c.name, text: l.text || "", sound: l.sound });
  }

  let player, npcs, stations, state = "title", talkedCount = 0, doneShown = false, hotdogs = 0, boostT = 0, boostKind = null;
  // Preston's random thoughts: a bubble over his head every so often.
  const THOUGHT_SHOW = 4, thoughtGap = () => 8 + Math.random() * 10;
  let thought = null, thoughtT = 5, lastThought = -1;
  let cold = false, coldTime = 0;
  let banterPhase="waiting", banterTime=4;
  const coldThoughts = [
    "it's cold NIGGA!!!",
  ];
  // Vehicles Preston can drive. While driving, the forklift rides on the player.
  const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
  let vehicles = [], driving = null, reversing = false, beepT = 0;
  const cam = { x: 0, y: 0 };

  function resetGame(saved = null){
    cold = false; coldTime = 0;banterPhase="waiting";banterTime=4;
    const st = M.start || { x: 2, y: 2, facing: "down" };
    player = { x: (st.x + .5) * TS, y: (st.y + 1) * TS - 2, dir: st.facing || "up", anim: 0, moving: false };
    npcs = Game.characters.map((c, i) => {
      const pos = c.position || { x: 2, y: 2 };
      if (isSolid(pos.x, pos.y)) console.warn(`${c.name} is standing inside something solid at x:${pos.x}, y:${pos.y}. Move them to a floor square.`);
      const px = (pos.x + .5) * TS, py = (pos.y + 1) * TS - 2;
      return {
        id: i, name: c.name, role: c.role || "", look: { ...Outfit.staff, ...(c.look || {}) }, portrait: c.portrait || null,
        since: c.employeeSince || null,
        nameTag: c.nameTag !== false, angry: !!c.angry, wander: !!c.wander, voice: c.voice || {},
        dashSeconds: c.dashSeconds || 0, dashRoute: null, dashBubbleT: 0, patrol: c.patrol || null, patrolIndex: 1, patrolPause: c.patrolPause || 0, patrolWait: c.patrolPause || 0, banter: c.banter || null, bubble: null, walkSpeed: c.walkSpeed || 56,
        randomCalloutConversation: !!c.randomCalloutConversation,
        callouts: c.callouts || null, calloutWait: 5+Math.random()*5,
        calloutTime: 0, lastCallout: -1,
        interactionRange: c.interactionRange || TALK_RANGE,
        lines: readConversation(c),
        px, py, hx: px, hy: py, dir: pos.facing || "down",
        talked: false, anim: 0, moving: false, wt: 1 + Math.random() * 3, wdx: 0, wdy: 0, madT: 0,
      };
    });
    stations = Game.stations.map((st, i) => {
      const pos = st.position || { x: 2, y: 2 };
      return { ...st, id: 100 + i, isStation: true, role: st.role || "", lines: readConversation(st),
               px: (pos.x + .5) * TS, py: (pos.y + 1) * TS, portrait: st.portrait || null, look: {} };
    });
    hotdogs = 0; boostT = 0; boostKind = null; $("dogStat").hidden = true;
    thought = null; thoughtT = 5;
    vehicles = Game.vehicles.map(v => {
      const pos = v.position || { x: 2, y: 2 };
      return { ...v, px: (pos.x + .5) * TS, py: (pos.y + 1) * TS - 2, dir: pos.facing || "up" };
    });
    driving = null; reversing = false;
    talkedCount = 0; doneShown = false; talk.who = null;
    if (saved){
      // Restore parking positions before validating Preston's saved position.
      if (Array.isArray(saved.vehicles)) vehicles.forEach((v, i) => {
        const pos = saved.vehicles[i];
        if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !OPPOSITE[pos.dir]) return;
        const previous = { px: v.px, py: v.py, dir: v.dir };
        v.px = pos.x; v.py = pos.y; v.dir = pos.dir;
        if (blocked(v.px, v.py, v)) Object.assign(v, previous);
      });
      if (Number.isInteger(saved.driving) && vehicles[saved.driving]){
        driving = vehicles[saved.driving];
        player.dir = driving.dir;
      }
      const sx = Number(saved.player?.x), sy = Number(saved.player?.y);
      if (Number.isFinite(sx) && Number.isFinite(sy) && !blocked(sx, sy, player)){
        player.x = sx; player.y = sy;
      } else driving = null;
      if (["up", "down", "left", "right"].includes(saved.player?.dir)) player.dir = saved.player.dir;
      const talked = new Set(Array.isArray(saved.talked) ? saved.talked : []);
      npcs.forEach(n => n.talked = talked.has(n.name));
      talkedCount = npcs.filter(n => n.talked).length;
      hotdogs = Number.isFinite(saved.hotdogs) ? Math.max(0, Math.floor(saved.hotdogs)) : 0;
      doneShown = !!saved.doneShown;
      $("dogs").textContent = hotdogs;
      $("dogStat").hidden = hotdogs === 0;
    }
    cam.x = player.x - VW/2; cam.y = player.y - WORLD_VH/2;
    updateHud();
  }

  // ---------------------------------------------------------------- collision
  const HB = 9;   // half the width of someone's feet
  // Ground footprint follows the body, wheels and forks, excluding roof height.
  function footprint(x, y, self){
    const vehicle = (self === player && driving) || vehicles.includes(self);
    if (!vehicle) return { l:x-HB, r:x+HB, t:y-12, b:y };
    const dir = self.dir;
    if (dir === "right") return { l:x-28, r:x+48, t:y-34, b:y+4 };
    if (dir === "left") return { l:x-48, r:x+28, t:y-34, b:y+4 };
    return { l:x-26, r:x+26, t:y-(dir === "up" ? 50 : 34), b:y+(dir === "down" ? 18 : 4) };
  }
  function blocked(x, y, self){
    const box = footprint(x, y, self);
    const { l, r, t, b } = box;
    for (let ty = Math.floor(t/TS); ty <= Math.floor((b - .01)/TS); ty++)
      for (let tx = Math.floor(l/TS); tx <= Math.floor((r - .01)/TS); tx++)
        if (isSolid(tx, ty)) return true;
    const others = [...npcs.filter(n => n !== self), ...vehicles.filter(v => v !== self && v !== driving)];
    if (self !== player && self !== driving) others.push(player);
    for (const o of others){
      const ob = footprint(o === player ? o.x : o.px, o === player ? o.y : o.py, o);
      if (l < ob.r && r > ob.l && t < ob.b && b > ob.t) return true;
    }
    return false;
  }
  const getX = e => e === player ? e.x : e.px, getY = e => e === player ? e.y : e.py;
  function moveEntity(e, vx, vy, dt){
    const kx = e === player ? "x" : "px", ky = e === player ? "y" : "py";
    // Substeps prevent boosted movement from crossing narrow collision footprints.
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(vx*dt), Math.abs(vy*dt)) / 4));
    for (let i=0; i<steps; i++){
      const nx = e[kx] + vx*dt/steps; if (!blocked(nx, e[ky], e)) e[kx] = nx; else if (e !== player) return false;
      const ny = e[ky] + vy*dt/steps; if (!blocked(e[kx], ny, e)) e[ky] = ny; else if (e !== player) return false;
    }
    return true;
  }
  function faceToward(e, tx, ty){
    const dx = tx - getX(e), dy = ty - getY(e);
    e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  }

  // ---------------------------------------------------------------- conversations
  const talk = { who: null, idx: 0, typed: 0, fromFile: false };
  const curLine = () => talk.who.lines[talk.idx];

  function nearestNpc(){
    let best = null, bd = Infinity;
    if (driving) return null;
    for (const n of [...npcs, ...stations]){
      const d = Math.hypot(n.px - player.x, n.py - player.y);
      if (d < (n.interactionRange || TALK_RANGE) && d < bd){ bd = d; best = n; }
    }
    return best;
  }

  function showLine(){
    if(talk.who.angry)talk.who.madT=2;
    const line = curLine(), isPlayer = line.who === P.name;
    $("dName").textContent = line.who;
    $("dName").classList.toggle("player", isPlayer);
    $("dRole").textContent = line.who === talk.who.name ? talk.who.role : "";
    const pic = isPlayer ? P.portrait : (line.who === talk.who.name ? talk.who.portrait : null);
    // employees' names show as a name badge
    const speakerLook = isPlayer ? playerLook : (line.who === talk.who.name ? talk.who.look : {});
    const since = isPlayer ? P.employeeSince : (line.who === talk.who.name ? talk.who.since : null);
    $("dName").classList.toggle("badge", !!speakerLook.badge);
    $("dSince").textContent = speakerLook.badge && since ? `SINCE ${since}` : "";
    if (isPlayer) $("dRole").textContent = P.role || "";
    const img = $("dPortrait");
    if (pic){ img.src = pic; img.alt = line.who; img.hidden = false; } else img.hidden = true;
    $("dLine").textContent = "";
    talk.typed = 0;
    Sound.stopFile();
    talk.fromFile = !!(line.sound && Sound.playFile(line.sound));
  }

  function action(){
    if (state !== "play") return;
    if (talk.who){
      if (talk.typed < curLine().text.length){ talk.typed = curLine().text.length; return; }
      if (talk.idx < talk.who.lines.length - 1){ talk.idx++; showLine(); Sound.nextLine(); return; }
      closeTalk(); return;
    }
    if (driving){ hopOff(); return; }
    const n = nearestNpc(), v = nearestVehicle();
    if (v && (!n || Math.hypot(v.px - player.x, v.py - player.y) < Math.hypot(n.px - player.x, n.py - player.y))){ hopOn(v); return; }
    if (!n) return;
    if(n.randomCalloutConversation && n.callouts?.length){
      let index=Math.floor(Math.random()*n.callouts.length);
      if(index===n.lastCallout && n.callouts.length>1)index=(index+1)%n.callouts.length;
      n.lastCallout=index;n.lines=[{who:n.name,text:n.callouts[index]}];
      n.bubble=null;n.calloutTime=0;n.calloutWait=8+Math.random()*8;
    }
    talk.who = n; talk.idx = 0;
    faceToward(n, player.x, player.y);
    faceToward(player, n.px, n.py);
    n.moving = false;
    Input.reset();
    showLine();
    $("dialog").hidden = false; $("keyhint").hidden = true;
    Sound.talkStart();
    if (!n.talked && !n.isStation){ n.talked = true; talkedCount++; updateHud(); }
    saveProgress();
  }

  function nearestVehicle(){
    if (driving) return null;
    let best = null, bd = TALK_RANGE + 8;
    for (const v of vehicles){ const d = Math.hypot(v.px - player.x, v.py - player.y); if (d < bd){ bd = d; best = v; } }
    return best;
  }
  function hopOn(v){
    if (blocked(v.px, v.py, v)){ toast("The forklift needs clear space before boarding."); return; }
    Input.reset();
    driving = v; reversing = false;
    player.x = v.px; player.y = v.py; player.dir = v.dir;
    toast(`${P.name} hops on the ${v.name.toLowerCase()}. Press E / TALK again to hop off.`);
  }
  function hopOff(){
    const v = driving;
    // Step off to the side if there's room, otherwise out the back or front.
    const box = footprint(player.x, player.y, player);
    const spots = [[box.l-player.x-HB-2,0], [box.r-player.x+HB+2,0], [0,box.b-player.y+14], [0,box.t-player.y-2]];
    v.px = player.x; v.py = player.y; v.dir = player.dir;
    driving = null;
    const spot = spots.find(([dx, dy]) => !blocked(player.x + dx, player.y + dy, player));
    if (!spot){ driving = v; toast("No room to hop off here!"); return; }
    player.x += spot[0]; player.y += spot[1];
    reversing = false;
    Input.reset();
    saveProgress();
  }

  let toastTimer = null;
  function toast(msg){
    const el = $("toast"); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 3500);
  }

  function closeTalk(){
    $("dialog").hidden = true;
    const who = talk.who;
    talk.who = null;
    if (who && who.isStation && who.action === "hotdog"){
      hotdogs++;
      $("dogs").textContent = hotdogs; $("dogStat").hidden = false;
      boostT = who.boostSeconds || 15; boostKind = "hotdog";
      Sound.beep(523, 0.08); setTimeout(() => Sound.beep(659, 0.08), 90); setTimeout(() => Sound.beep(784, 0.12), 180);
      toast(`${hotdogs === 1 ? "Hot dog" : hotdogs + " hot dogs"} for $${(who.price || 1.5).toFixed(2)}! ${who.afterwards || ""}`);
    }
    if (who && who.isStation && who.action === "energyDrink"){
      boostT = who.boostSeconds || 30; boostKind = "energy";
      Sound.beep(659, 0.08); setTimeout(() => Sound.beep(784, 0.08), 90); setTimeout(() => Sound.beep(988, 0.14), 180);
      toast(who.afterwards || "Energy boost!");
    }
    Sound.stopFile();
    setState("play");
    if (talkedCount === npcs.length && npcs.length && !doneShown){
      doneShown = true;
      $("doneText").textContent = `All ${npcs.length} people on shift got a hello from ${P.name}. You can keep walking around.`;
      setState("done");
    }
    saveProgress();
  }

  // Route each dash through open floor so even a one-second run respects walls.
  function dashRoute(n,target){
    const sx=Math.floor(n.px/TS),sy=Math.floor((n.py-2)/TS);
    const queue=[[sx,sy]],previous=new Map([[sx+","+sy,null]]);
    for(let i=0;i<queue.length;i++){
      const [x,y]=queue[i];
      if(x===target.x && y===target.y){
        const route=[];let key=x+","+y;
        while(previous.get(key)!==null){
          const [rx,ry]=key.split(",").map(Number);route.push({x:(rx+.5)*TS,y:(ry+1)*TS-2});key=previous.get(key);
        }
        return route.reverse();
      }
      for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
        const nx=x+dx,ny=y+dy,key=nx+","+ny;
        if(nx<0||ny<0||nx>=MW||ny>=MH||previous.has(key)||blocked((nx+.5)*TS,(ny+1)*TS-2,n))continue;
        previous.set(key,x+","+y);queue.push([nx,ny]);
      }
    }
    return null;
  }

  function updateDash(n,dt){
    n.dashBubbleT=Math.max(0,n.dashBubbleT-dt);
    n.bubble=n.dashBubbleT>0?"Mig mig!":null;
    n.moving=false;
    if(n.patrolWait>0){n.patrolWait=Math.max(0,n.patrolWait-dt);return;}
    if(!n.dashRoute){
      n.dashRoute=dashRoute(n,n.patrol[n.patrolIndex]);
      if(!n.dashRoute || !n.dashRoute.length){n.dashRoute=null;n.patrolWait=1;return;}
      n.dashSpeed=n.dashRoute.length*TS/n.dashSeconds;
      n.dashBubbleT=.8;n.bubble="Mig mig!";
      const front=M.frontSoundArea;
      const inFront=(x,y)=>front && x>=front.x*TS && x<(front.x+front.w)*TS &&
        y>=front.y*TS && y<(front.y+front.h)*TS;
      if(inFront(player.x,player.y) && inFront(n.px,n.py))Sound.migMig();
    }
    let budget=n.dashSpeed*dt;
    while(budget>0 && n.dashRoute.length){
      const target=n.dashRoute[0],dx=target.x-n.px,dy=target.y-n.py,d=Math.hypot(dx,dy);
      if(d<.01){n.dashRoute.shift();continue;}
      const travel=Math.min(budget,d),bx=n.px,by=n.py;
      n.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
      const moved=moveEntity(n,dx/d*travel/dt,dy/d*travel/dt,dt);
      const actual=Math.hypot(n.px-bx,n.py-by);n.anim+=actual;n.moving ||= actual>0;budget-=travel;
      if(!moved){n.dashRoute=null;n.patrolWait=.5;return;}
      if(travel>=d)n.dashRoute.shift();
    }
    if(!n.dashRoute.length){n.dashRoute=null;n.patrolIndex=(n.patrolIndex+1)%n.patrol.length;n.patrolWait=n.patrolPause;n.moving=false;}
  }

  // Cashiers meet in the gap between their registers, trade lines, then return.
  function updateBanter(dt){
    const a=npcs.find(n=>n.banter), b=a && npcs.find(n=>n.name===a.banter.partner);
    if(!a || !b)return;
    a.banterActor=b.banterActor=true;
    a.moving=b.moving=false;a.bubble=b.bubble=null;
    if(talk.who===a || talk.who===b)return;
    const walkTo=(n,x,y)=>{
      const dx=x-n.px,dy=y-n.py,d=Math.hypot(dx,dy);
      if(d<1)return true;
      n.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
      const bx=n.px,by=n.py,s=Math.min(48,d/dt);
      moveEntity(n,dx/d*s,dy/d*s,dt);
      n.anim+=Math.hypot(n.px-bx,n.py-by);n.moving=n.px!==bx||n.py!==by;
      return Math.hypot(x-n.px,y-n.py)<1;
    };
    if(banterPhase==="waiting"){
      banterTime-=dt;if(banterTime<=0)banterPhase="approach";
    }else if(banterPhase==="approach"){
      const x=(a.hx+b.hx)/2,y=(a.hy+b.hy)/2;
      const arrivedA=walkTo(a,x,y+13),arrivedB=walkTo(b,x,y-13);
      if(arrivedA && arrivedB){banterPhase="speaking";banterTime=0;}
    }else if(banterPhase==="speaking"){
      faceToward(a,b.px,b.py);faceToward(b,a.px,a.py);
      banterTime+=dt;
      if(banterTime<3)a.bubble=a.banter.line;
      else if(banterTime<6)b.bubble=a.banter.reply;
      else banterPhase="returning";
    }else{
      const arrivedA=walkTo(a,a.hx,a.hy),arrivedB=walkTo(b,b.hx,b.hy);
      if(arrivedA && arrivedB){banterPhase="waiting";banterTime=12;}
    }
  }

  // ---------------------------------------------------------------- update
  function step(dt){
    const k = Input.keys, st = Input.stick;
    let mx = (k.right?1:0) - (k.left?1:0), my = (k.down?1:0) - (k.up?1:0);
    if (st.id !== null && Math.hypot(st.dx, st.dy) > 0.18){ mx = st.dx; my = st.dy; }
    if (talk.who) mx = my = 0;
    const m = Math.hypot(mx, my);
    if (m > 1){ mx /= m; my /= m; }
    player.moving = m > 0.05;
    if (player.moving){
      const dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? "right" : "left") : (my > 0 ? "down" : "up");
      // On the forklift, pushing opposite the forks backs it up instead of turning around.
      reversing = !!driving && dir === OPPOSITE[player.dir];
      if (!reversing){
        const oldDir = player.dir;
        player.dir = dir;
        if (driving && blocked(player.x, player.y, player)) player.dir = oldDir;
      }
      const bx = player.x, by = player.y;
      const boost = boostT > 0 ? (boostKind === "energy" ? 3 : 1.6) : 1;
      const spd = SPEED * boost * (driving ? (driving.speed || 1.5) * (reversing ? .6 : 1) : 1);
      moveEntity(player, mx*spd, my*spd, dt);
      player.anim += Math.hypot(player.x - bx, player.y - by);
    }

    const wasCold = cold;
    cold = (M.coldRooms || []).some(room =>
      player.x >= room.x*TS && player.x < (room.x+room.w)*TS &&
      player.y-2 >= room.y*TS && player.y-2 < (room.y+room.h)*TS);
    coldTime = cold ? coldTime + dt : 0;
    if(cold !== wasCold){
      thought = cold ? coldThoughts[0] : null;
      thoughtT = cold ? THOUGHT_SHOW : thoughtGap();
      if(cold && !talk.who) toast(`${P.name}: "${coldThoughts[0]}"`);
    }
    const thoughts = cold ? coldThoughts : (P.thoughts || []);
    if (talk.who) thought = null;
    else if (thoughts.length && (thoughtT -= dt) <= 0){
      if (thought){ thought = null; thoughtT = thoughtGap(); }
      else {
        let i = Math.floor(Math.random() * thoughts.length);
        if (thoughts.length > 1 && i === lastThought) i = (i + 1) % thoughts.length;
        lastThought = i; thought = thoughts[i]; thoughtT = THOUGHT_SHOW;
      }
    }
    if (driving){
      driving.px = player.x; driving.py = player.y; driving.dir = player.dir;
      if (player.moving){ if ((beepT -= dt) <= 0){ Sound.backupBeep(); beepT = .5; } }
      else beepT = 0;
    }
    if (boostT > 0){ boostT -= dt; if (boostT <= 0){ boostT = 0; boostKind = null; } }
    updateBanter(dt);
    for (const n of npcs){
      if(n.angry){
        const conversing=n===talk.who || (talk.who && curLine().who===n.name) ||
          (n.banterActor && banterPhase==="speaking");
        n.madT=conversing?2:Math.max(0,n.madT-dt);
      }
      if(n.banterActor)continue;
      if(n.callouts && n.callouts.length){
        if(talk.who){
          n.bubble=null;n.calloutTime=0;
        }else if(n.calloutTime>0){
          n.calloutTime=Math.max(0,n.calloutTime-dt);
          if(n.calloutTime===0)n.bubble=null;
        }else if((n.calloutWait-=dt)<=0){
          let index=Math.floor(Math.random()*n.callouts.length);
          if(index===n.lastCallout && n.callouts.length>1)index=(index+1)%n.callouts.length;
          n.lastCallout=index;n.bubble=n.callouts[index];n.calloutTime=4;
          n.calloutWait=8+Math.random()*8;
          if(Math.hypot(n.px-player.x,n.py-player.y)<600)Sound.voice(n.voice);
        }
        if(n.calloutTime>0){n.moving=false;continue;}
      }
      if (!n.wander || n === talk.who){ n.moving = false; continue; }
      if (Math.hypot(n.px - player.x, n.py - player.y) < 52){ n.moving = false; faceToward(n, player.x, player.y); continue; }
      if(n.dashSeconds){updateDash(n,dt);continue;}
      if(n.patrol && n.patrol.length>1){
        if(n.patrolWait>0){n.patrolWait=Math.max(0,n.patrolWait-dt);n.moving=false;continue;}
        const target=n.patrol[n.patrolIndex];
        const dx=(target.x+.5)*TS-n.px, dy=(target.y+1)*TS-2-n.py;
        const distance=Math.hypot(dx,dy);
        if(distance<2){n.patrolIndex=(n.patrolIndex+1)%n.patrol.length;n.moving=false;n.patrolWait=n.patrolPause;continue;}
        n.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
        const bx=n.px, by=n.py, speed=Math.min(n.walkSpeed,distance/dt);
        const moved=moveEntity(n,dx/distance*speed,dy/distance*speed,dt);
        n.anim+=Math.hypot(n.px-bx,n.py-by);n.moving=n.px!==bx||n.py!==by;
        if(!moved)n.patrolIndex=(n.patrolIndex+1)%n.patrol.length;
        continue;
      }
      n.wt -= dt;
      if (n.wt <= 0){
        if (n.moving || Math.random() < .4){ n.moving = false; n.wt = 1.5 + Math.random()*2.5; }
        else {
          const ax = n.hx - n.px, ay = n.hy - n.py;
          const dirs = Math.hypot(ax, ay) > 56
            ? [Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? "right" : "left") : (ay > 0 ? "down" : "up")]
            : ["up","down","left","right"];
          n.dir = dirs[Math.floor(Math.random()*dirs.length)];
          n.wdx = n.dir === "right" ? 1 : n.dir === "left" ? -1 : 0;
          n.wdy = n.dir === "down" ? 1 : n.dir === "up" ? -1 : 0;
          n.moving = true; n.wt = .5 + Math.random()*1.2;
        }
      }
      if (n.moving){
        const bx = n.px, by = n.py;
        if (!moveEntity(n, n.wdx*n.walkSpeed, n.wdy*n.walkSpeed, dt)){ n.moving = false; n.wt = 1; }
        n.anim += Math.hypot(n.px - bx, n.py - by);
      }
    }

    // typewriter + voice blips
    if (talk.who){
      const text = curLine().text;
      if (talk.typed < text.length){
        const before = Math.floor(talk.typed);
        talk.typed = Math.min(text.length, talk.typed + dt * 48);
        const now = Math.floor(talk.typed);
        if (now !== before){
          $("dLine").textContent = text.slice(0, now);
          if (!talk.fromFile && now % 3 === 0){
            const who = curLine().who;
            const speaker = who === P.name ? P : who === talk.who.name ? talk.who : (npcs.find(n => n.name === who) || talk.who);
            Sound.voice(speaker.voice);
          }
        }
      } else $("dLine").textContent = text;
    }

    // camera (lifts up during a conversation so the box doesn't cover anyone)
    const lift = talk.who ? 110 : 0;
    const tx = Math.max(0, Math.min(MW*TS - VW, player.x - VW/2));
    const ty = Math.max(0, Math.min(MH*TS - WORLD_VH + lift, player.y - 24 - WORLD_VH/2 + lift));
    cam.x += (tx - cam.x) * Math.min(1, dt*8);
    cam.y += (ty - cam.y) * Math.min(1, dt*8);

    const nearbyNpc = nearestNpc(), nearbyVehicle = nearestVehicle();
    const enter = nearbyVehicle && (!nearbyNpc || Math.hypot(nearbyVehicle.px-player.x, nearbyVehicle.py-player.y) < Math.hypot(nearbyNpc.px-player.x, nearbyNpc.py-player.y));
    const available = !!(talk.who || driving || nearbyNpc || nearbyVehicle);
    const label = talk.who ? "NEXT" : driving ? "EXIT" : enter ? "ENTER" : "TALK";
    $("talkBtn").textContent = label;
    $("talkBtn").setAttribute("aria-label", label);
    $("talkBtn").classList.toggle("ready", available);
  }

  // ---------------------------------------------------------------- draw
  // The store is drawn back-to-front: floor first, then every object and person
  // sorted by how far down the screen their feet/base are. That's what lets
  // Preston walk behind a rack and be hidden by it.
  const MAX_H = 64;
  function render(t){
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    ctx.fillStyle = "#0c0d11"; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.scale(1, DEPTH); ctx.translate(-cx, -cy);

    const x0 = Math.max(0, Math.floor(cx / TS)), x1 = Math.min(MW - 1, Math.floor((cx + VW) / TS));
    const y0 = Math.max(0, Math.floor(cy / TS)), y1 = Math.min(MH - 1, Math.floor((cy + WORLD_VH + MAX_H) / TS));

    // 1) floors (objects sit on concrete)
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++){
      const c = grid[ty][tx];
      ctx.drawImage(Tiles.floor(isObject(c) ? "." : c, tx, ty), tx*TS, ty*TS);
    }
    // soft shadows on the floor in front of objects
    // Angled entrance canopy casts a graduated shadow onto its outside apron.
    for(const p of props.filter(p => p.type === "cornerDoor" || p.type === "cornerWall")){
      for(let strip=0;strip<5;strip++){
        ctx.fillStyle=`rgba(31,28,23,${.12-strip*.02})`;
        ctx.fillRect(p.x*TS-6,(p.y+1)*TS+strip*5,TS+6,5);
      }
    }
    ctx.fillStyle = "rgba(20,22,28,.16)";
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++){
      const c = grid[ty][tx];
      if (isObject(c) && ty + 1 < MH && !isObject(grid[ty + 1][tx])) ctx.fillRect(tx*TS, (ty + 1)*TS, TS, 6);
    }
    ctx.fillStyle = "#e8c341";
    (M.floorLines || []).forEach(l => ctx.fillRect(Math.round(l.x*TS), Math.round(l.y*TS), Math.round(l.length*TS), 3));

    // 2) collect everything that stands up, then draw in order
    const list = [];
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++){
      const c = grid[ty][tx];
      if (!isObject(c)) continue;
      list.push({ k: (ty + 1)*TS, tx, ty, c });
    }
    for (const p of props){
      const bx = p.x*TS, by = (p.y + p.size.h)*TS;
      const propHeight = Tiles.propImage(p.type, p.rotation)?.height || 140;
      if (bx > cx + VW || bx + p.size.w*TS < cx || by < cy || by - propHeight > cy + WORLD_VH) continue;
      list.push({ k: by, prop: p });
    }
    for (const n of npcs) list.push({ k: n.py, npc: n });
    for (const v of vehicles) if (v !== driving) list.push({ k: v.py, veh: v });
    list.push({ k: player.y, pl: true });
    list.sort((a, b) => a.k - b.k || (a.npc || a.pl ? 1 : 0) - (b.npc || b.pl ? 1 : 0));

    for (const it of list){
      if (it.c){
        const o = Tiles.object(it.c, it.tx, it.ty, grid);
        const x = it.tx*TS, y = it.ty*TS;
        ctx.drawImage(o.top, x, y - o.H);
        if (o.front) ctx.drawImage(o.front, x, y + TS - o.H);
      } else if (it.prop){
        const img = Tiles.propImage(it.prop.type, it.prop.rotation);
        if (img) ctx.drawImage(img, it.prop.x*TS, (it.prop.y + it.prop.size.h)*TS - img.height);
        // A staffed service window reveals the employee behind an opaque facade.
        // Clip to its glass opening so the counter still hides the lower body.
        if (img && it.prop.staff && it.prop.staffWindow){
          const n = npcs.find(n => n.name === it.prop.staff), w = it.prop.staffWindow;
          if (n){
            ctx.save(); ctx.beginPath();
            ctx.rect(it.prop.x*TS+w.x, (it.prop.y+it.prop.size.h)*TS-img.height+w.y, w.w, w.h);
            ctx.clip(); Sprites.person(ctx, n.px, n.py+8, n.dir, 0, n.look); ctx.restore();
          }
        }
      } else if (it.npc){
        const e = it.npc, f = e.moving ? Math.floor(e.anim/10) % 4 : 0;
        if (e.angry && e.madT > 0){
          Sprites.person(ctx, e.px + Math.round(Math.sin(t*60)*2), e.py, e.dir, f, { ...e.look, skin: "#e0453a" });
          Sprites.steam(ctx, e.px, e.py, t);
        } else {
          const speaking=e.look.commandGesture && (e===talk.who || e.calloutTime>0);
          const sway=speaking?Math.sin(t*7)*1.2:0;
          const pose=speaking && e.look.theatricalBoss?Math.floor(t*2)%3:0;
          const look=speaking?{...e.look,gesturing:true,bossPose:pose}:e.look;
          const bob=speaking && e.look.theatricalBoss?(pose===2?-1:0):0;
          Sprites.person(ctx,e.px+sway,e.py+bob,e.dir,f,look);
        }
      } else if (it.veh){
        Sprites.forklift(ctx, it.veh.px, it.veh.py, it.veh.dir, "back");
        Sprites.forklift(ctx, it.veh.px, it.veh.py, it.veh.dir, "front");
      } else drawPlayer(t);
    }

    // 3) Preston shows through anything in front of him (faint outline)
    ctx.globalAlpha = .35;
    drawPlayer(t);
    ctx.globalAlpha = 1;

    // 4) hanging signs, talk markers and name tags on top
    (M.signs || []).forEach(sg => {
      const sx = sg.x*TS, sy = sg.y*TS;
      if (sx > cx - 200 && sx < cx + VW + 200 && sy > cy - 40 && sy < cy + WORLD_VH + 40) Sprites.sign(ctx, sg.text, sg.x, sg.y, sg.kind);
    });
    const near = state === "play" && !talk.who ? nearestNpc() : null;
    for (const st of stations){
      const x = Math.round(st.px), y = Math.round(st.py) - 92 + Math.round(Math.sin(t*3) * 3);
      if (st.marker === "hotdog"){
        ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(x - 15, y + 16, 30, 3);
        Sprites.hotdog(ctx, x - 14, y - 6, 2);
      }
      if (st.marker === "whiteMonster") Sprites.energyDrink(ctx, x - 8, y - 13, 2);
      if (st === near){
        ctx.fillStyle = "#16171c"; ctx.fillRect(x - 14, y - 30, 28, 18);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 12, y - 28, 24, 14);
        ctx.fillStyle = "#16171c"; ctx.fillRect(x - 8, y - 22, 4, 4); ctx.fillRect(x - 2, y - 22, 4, 4); ctx.fillRect(x + 4, y - 22, 4, 4);
      }
    }
    for (const n of npcs){
      const x = Math.round(n.px), y = Math.round(n.py) - 54;
      if (n === near){
        ctx.fillStyle = "#16171c"; ctx.fillRect(x - 14, y - 12, 28, 18);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 12, y - 10, 24, 14); ctx.fillRect(x - 4, y + 4, 6, 4);
        ctx.fillStyle = "#16171c"; ctx.fillRect(x - 8, y - 4, 4, 4); ctx.fillRect(x - 2, y - 4, 4, 4); ctx.fillRect(x + 4, y - 4, 4, 4);
      } else if (!n.talked){
        const bob = Math.round(Math.sin(t*4 + n.id) * 3);
        ctx.fillStyle = "#16171c"; ctx.fillRect(x - 4, y - 10 + bob, 9, 18);
        ctx.fillStyle = "#f2b33d"; ctx.fillRect(x - 2, y - 8 + bob, 5, 8); ctx.fillRect(x - 2, y + 2 + bob, 5, 4);
      }
      if (n.nameTag) Sprites.nameTag(ctx, n.name.toUpperCase(), x, y - 26*(n.look.heightScale || 1));
      if(n.bubble)Sprites.thought(ctx,n.bubble,x,y-38);
    }
    const nearV = state === "play" && !talk.who ? nearestVehicle() : null;
    if (nearV && !nearestNpc()) Sprites.nameTag(ctx, "HOP ON", Math.round(nearV.px), Math.round(nearV.py) - 86, "#c68a1f");
    if (thought) Sprites.thought(ctx, thought, Math.round(player.x), Math.round(player.y) - (driving ? 72 : 54));
    ctx.restore();
  }

  function drawPlayer(t){
    const look = boostKind === "energy" && boostT > 0 ? { ...playerLook, bulky: true } : playerLook;
    if (!driving){
      const shiver = cold ? Math.sin(coldTime*35)*.9 : 0;
      Sprites.person(ctx, player.x+shiver, player.y, player.dir, player.moving ? Math.floor(player.anim/10) % 4 : 0, look);
      if(cold){
        // A little puff of breath fades as it drifts away from his face.
        const phase = (coldTime % 2.4)/2.4;
        ctx.save();ctx.globalAlpha = (1-phase)*.65;
        ctx.fillStyle="#e2f6ff";ctx.beginPath();
        ctx.ellipse(player.x+6+phase*12,player.y-36-phase*9,2+phase*6,1+phase*3,0,0,Math.PI*2);ctx.fill();ctx.restore();
      }
      return;
    }
    // Forklift, seated Preston, then the front of the forklift with its flashing light.
    const x = Math.round(player.x), y = Math.round(player.y);
    const side = player.dir === "right" ? -3 : player.dir === "left" ? 3 : 0;
    Sprites.forklift(ctx, x, y, player.dir, "back");
    Sprites.person(ctx, x + side, y - 8, player.dir, 0, look);
    Sprites.forklift(ctx, x, y, player.dir, "front", Math.floor(t * 4) % 2 === 0);
  }

  // ---------------------------------------------------------------- full map screen
  const MINI = 4;   // pixels per square on the overview map
  const miniBase = document.createElement("canvas");
  function buildMini(){
    miniBase.width = MW*MINI; miniBase.height = MH*MINI;
    const g = miniBase.getContext("2d");
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++){
      g.fillStyle = Tiles.MINI[grid[ty][tx]] || "#cdc9c1"; g.fillRect(tx*MINI, ty*MINI, MINI, MINI);
    }
    props.forEach(p => {
      g.fillStyle = p.type === "employeeLocker" ? "#8d9598" : p.type === "refrigeratedShelf" ? "#246bdf" : p.type === "groceryShelf" ? "#ff920d" : "#f2b33d";
      g.fillRect(p.x*MINI, p.y*MINI, p.size.w*MINI, p.size.h*MINI);
    });
  }
  function drawMini(){
    const c = $("mini"), g = c.getContext("2d");
    const r = $("stage").getBoundingClientRect();
    const k = Math.min(Math.min(r.width - 40, 900) / miniBase.width, (r.height - 130) / miniBase.height);
    c.width = miniBase.width; c.height = miniBase.height;
    c.style.width = Math.floor(miniBase.width * k) + "px"; c.style.height = Math.floor(miniBase.height * k) + "px";
    g.drawImage(miniBase, 0, 0);
    const u = 1 / k, s = MINI / TS;
    const dot = (x, y, col, rad) => { g.fillStyle = "#0c0d11"; g.beginPath(); g.arc(x*s, y*s, rad + 2*u, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x*s, y*s, rad, 0, 7); g.fill(); };
    npcs.forEach(n => dot(n.px, n.py - 16, n.talked ? "#7d8494" : "#f2b33d", Math.max(4, 4*u)));
    stations.forEach(st => dot(st.px, st.py - 16, "#c0392b", Math.max(4, 4*u)));
    dot(player.x, player.y - 16, "#ff4b3a", Math.max(5, 6*u));
    // Show the actual parked / driven location, including restored saves.
    vehicles.forEach(v => {
      dot(v.px, v.py, "#55d5ed", Math.max(5, 6*u));
      g.font = `bold ${Math.max(10, 11*u)}px Arial, sans-serif`;
      g.textAlign = "right"; g.textBaseline = "bottom";
      const label = "FORKLIFT", x = v.px*s - 9*u, y = v.py*s - 7*u;
      const w = g.measureText(label).width;
      g.fillStyle = "#172831"; g.fillRect(x-w-3*u, y-13*u, w+6*u, 15*u);
      g.fillStyle = "#83e7f5"; g.fillText(label, x, y);
    });
  }
  function toggleMap(){
    if (state === "play" && !talk.who){ drawMini(); setState("map"); }
    else if (state === "map") setState("play");
  }

  // ---------------------------------------------------------------- screens
  function updateHud(){ $("count").textContent = npcs && npcs.length ? `Talked to ${talkedCount}/${npcs.length}` : "Entrance & Exit"; }
  function setState(s){
    state = s;
    $("titleScreen").hidden = s !== "title";
    $("mapScreen").hidden = s !== "map";
    $("doneScreen").hidden = s !== "done";
    $("hud").hidden = s === "title";
    const touch = matchMedia("(pointer: coarse)").matches;
    $("talkBtn").hidden = !(touch && s === "play" && (npcs.length || stations.length || vehicles.length));
    $("keyhint").hidden = !(!touch && s === "play" && !talk.who);
    if (s !== "play") Input.reset();
  }
  function start(){ Sound.unlock(); setState("play"); saveProgress(); requestWake(); }

  $("startBtn").onclick = start;
  $("mapBtn").onclick = toggleMap;
  $("closeMap").onclick = () => setState("play");
  $("keepBtn").onclick = () => setState("play");
  Input.onAction = () => { if (state === "title") start(); else action(); };
  Input.onMap = toggleMap;
  Input.isPlaying = () => state === "play" || state === "title";
  Input.isTalking = () => !!talk.who;

  let wake = null;
  async function requestWake(){ try { if ("wakeLock" in navigator && !wake){ wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => wake = null); } } catch(e){} }

  // ---------------------------------------------------------------- sizing
  function resize(){
    const r = $("stage").getBoundingClientRect();
    VW = Math.max(280, Math.min(640, Math.round(VH * r.width / Math.max(1, r.height))));
    const resolution = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(VW * resolution); canvas.height = Math.round(VH * resolution);
    ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
    const scale = Math.min(r.width / VW, r.height / VH);
    canvas.style.width = Math.floor(VW * scale) + "px";
    canvas.style.height = Math.floor(VH * scale) + "px";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if (state === "map") drawMini();
  }
  addEventListener("resize", resize);
  addEventListener("orientationchange", () => setTimeout(resize, 200));
  addEventListener("blur", () => Input.reset());
  addEventListener("pagehide", saveProgress);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden"){ Input.reset(); saveProgress(); } });

  // ---------------------------------------------------------------- loop
  let last = performance.now(), acc = 0;
  const DT = 1/120;
  let lastSave = performance.now();
  function loop(now){
    const frame = Math.min(0.05, (now - last) / 1000); last = now;
    if (state === "play"){
      acc += frame; while (acc >= DT){ step(DT); acc -= DT; }
      if (now - lastSave >= 1000){ saveProgress(); lastSave = now; }
    } else acc = 0;
    render(now / 1000);
    requestAnimationFrame(loop);
  }

  if (P.portrait){ const tp = $("titlePortrait"); tp.src = P.portraitLarge || P.portrait; tp.hidden = false; }
  resize();
  const savedProgress = loadProgress();
  resetGame(savedProgress);
  if (savedProgress) $("startBtn").textContent = "Continue shift";
  buildMini();
  setState("title");
  requestAnimationFrame(loop);

  // Handy for testing in the browser console: Game.debug.teleport(20, 10)
  Game.debug = {
    teleport(x, y){ player.x = (x + .5) * TS; player.y = (y + 1) * TS - 2; cam.x = player.x - VW/2; cam.y = player.y - WORLD_VH/2; },
    where(){ return { x: Math.floor(player.x / TS), y: Math.floor((player.y - 2) / TS) }; },
    step, get cold(){ return cold; }, get thought(){ return thought; },
    blocked, footprint, move: moveEntity, get vehicles(){ return vehicles; }, get driving(){ return driving; },
    get people(){ return npcs; }, get player(){ return player; }, get hotdogs(){ return hotdogs; }, talk: () => action(),
  };
})();
