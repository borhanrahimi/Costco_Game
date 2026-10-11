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

  // Turn whatever is in a character file into a list of { who, text, sound } lines.
  function readConversation(c){
    const raw = c.conversation || (c.line ? [c.line] : ["..."]);
    return raw.map(l => typeof l === "string" ? { who: c.name, text: l } : { who: l.who || c.name, text: l.text || "", sound: l.sound });
  }

  let player, npcs, stations, state = "title", talkedCount = 0, doneShown = false, hotdogs = 0, boostT = 0;
  const cam = { x: 0, y: 0 };

  function resetGame(){
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
    hotdogs = 0; boostT = 0; $("dogStat").hidden = true;
    talkedCount = 0; doneShown = false; talk.who = null;
    cam.x = player.x - VW/2; cam.y = player.y - WORLD_VH/2;
    updateHud();
  }

  // ---------------------------------------------------------------- collision
  const HB = 9;   // half the width of someone's feet
  function blocked(x, y, self){
    const l = x - HB, r = x + HB, t = y - 12, b = y;
    for (let ty = Math.floor(t/TS); ty <= Math.floor((b - .01)/TS); ty++)
      for (let tx = Math.floor(l/TS); tx <= Math.floor((r - .01)/TS); tx++)
        if (isSolid(tx, ty)) return true;
    const others = self === player ? npcs : [{ px: player.x, py: player.y }, ...npcs.filter(n => n !== self)];
    for (const o of others) if (l < o.px + HB && r > o.px - HB && t < o.py && b > o.py - 12) return true;
    return false;
  }
  const getX = e => e === player ? e.x : e.px, getY = e => e === player ? e.y : e.py;
  function moveEntity(e, vx, vy, dt){
    const kx = e === player ? "x" : "px", ky = e === player ? "y" : "py";
    const nx = e[kx] + vx*dt; if (!blocked(nx, e[ky], e)) e[kx] = nx; else if (e !== player) return false;
    const ny = e[ky] + vy*dt; if (!blocked(e[kx], ny, e)) e[ky] = ny; else if (e !== player) return false;
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
    let best = null, bd = TALK_RANGE;
    for (const n of [...npcs, ...stations]){
      const d = Math.hypot(n.px - player.x, n.py - player.y);
      if (d < bd){ bd = d; best = n; }
    }
    return best;
  }

  function showLine(){
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
    const n = nearestNpc(); if (!n) return;
    talk.who = n; talk.idx = 0;
    faceToward(n, player.x, player.y);
    faceToward(player, n.px, n.py);
    n.moving = false;
    showLine();
    $("dialog").hidden = false; $("keyhint").hidden = true;
    Sound.talkStart();
    if (!n.talked && !n.isStation){ n.talked = true; talkedCount++; updateHud(); }
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
      boostT = who.boostSeconds || 15;
      Sound.beep(523, 0.08); setTimeout(() => Sound.beep(659, 0.08), 90); setTimeout(() => Sound.beep(784, 0.12), 180);
      toast(`${hotdogs === 1 ? "Hot dog" : hotdogs + " hot dogs"} for $${(who.price || 1.5).toFixed(2)}! ${who.afterwards || ""}`);
    }
    Sound.stopFile();
    setState("play");
    if (talkedCount === npcs.length && npcs.length && !doneShown){
      doneShown = true;
      $("doneText").textContent = `All ${npcs.length} people on shift got a hello from ${P.name}. You can keep walking around.`;
      setState("done");
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
      player.dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? "right" : "left") : (my > 0 ? "down" : "up");
      const bx = player.x, by = player.y;
      const spd = SPEED * (boostT > 0 ? 1.6 : 1);
      moveEntity(player, mx*spd, my*spd, dt);
      player.anim += Math.hypot(player.x - bx, player.y - by);
    }

    if (boostT > 0) boostT -= dt;
    for (const n of npcs){
      if (n.angry){ if (n === talk.who) n.madT = 2; else if (n.madT > 0) n.madT -= dt; }
      if (!n.wander || n === talk.who){ n.moving = false; continue; }
      if (Math.hypot(n.px - player.x, n.py - player.y) < 52){ n.moving = false; faceToward(n, player.x, player.y); continue; }
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
        if (!moveEntity(n, n.wdx*56, n.wdy*56, dt)){ n.moving = false; n.wt = 1; }
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

    $("talkBtn").classList.toggle("ready", !!(talk.who || nearestNpc()));
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
      } else if (it.npc){
        const e = it.npc, f = e.moving ? Math.floor(e.anim/10) % 4 : 0;
        if (e.angry && e.madT > 0){
          Sprites.person(ctx, e.px + Math.round(Math.sin(t*60)*2), e.py, e.dir, f, { ...e.look, skin: "#e0453a" });
          Sprites.steam(ctx, e.px, e.py, t);
        } else Sprites.person(ctx, e.px, e.py, e.dir, f, e.look);
      } else {
        Sprites.person(ctx, player.x, player.y, player.dir, player.moving ? Math.floor(player.anim/10) % 4 : 0, playerLook);
      }
    }

    // 3) Preston shows through anything in front of him (faint outline)
    ctx.globalAlpha = .35;
    Sprites.person(ctx, player.x, player.y, player.dir, player.moving ? Math.floor(player.anim/10) % 4 : 0, playerLook);
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
      if (n.nameTag) Sprites.nameTag(ctx, n.name.toUpperCase(), x, y - 26);
    }
    ctx.restore();
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
    props.forEach(p => { g.fillStyle = "#f2b33d"; g.fillRect(p.x*MINI, p.y*MINI, p.size.w*MINI, p.size.h*MINI); });
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
    $("talkBtn").hidden = !(touch && s === "play" && (npcs.length || stations.length));
    $("keyhint").hidden = !(!touch && s === "play" && !talk.who);
    if (s !== "play") Input.reset();
  }
  function start(){ Sound.unlock(); resetGame(); setState("play"); requestWake(); }

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

  // ---------------------------------------------------------------- loop
  let last = performance.now(), acc = 0;
  const DT = 1/120;
  function loop(now){
    const frame = Math.min(0.05, (now - last) / 1000); last = now;
    if (state === "play"){ acc += frame; while (acc >= DT){ step(DT); acc -= DT; } } else acc = 0;
    render(now / 1000);
    requestAnimationFrame(loop);
  }

  if (P.portrait){ const tp = $("titlePortrait"); tp.src = P.portraitLarge || P.portrait; tp.hidden = false; }
  resize();
  resetGame();
  buildMini();
  setState("title");
  requestAnimationFrame(loop);

  // Handy for testing in the browser console: Game.debug.teleport(20, 10)
  Game.debug = {
    teleport(x, y){ player.x = (x + .5) * TS; player.y = (y + 1) * TS - 2; cam.x = player.x - VW/2; cam.y = player.y - WORLD_VH/2; },
    where(){ return { x: Math.floor(player.x / TS), y: Math.floor((player.y - 2) / TS) }; },
    get people(){ return npcs; }, get player(){ return player; }, get hotdogs(){ return hotdogs; }, talk: () => action(),
  };
})();
