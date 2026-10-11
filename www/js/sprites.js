// sprites.js — draws the people (with real faces), name tags, signs and the angry steam.
// Each person is 24 x 48 pixels, built from the "look" in their character file.
// Look options: hair, skin, shirt, vest, pants, shoes, cap, tie, apron, stripes,
//               bald, curly, longHair, glasses, beard, badge, eyes (eye color), lips

window.Sprites = (() => {
  const TS = Game.TS;
  const W = 24, H = 48;              // sprite size; feet are at (12, 46)
  const shade = (c, f) => Tiles.shade(c, f);
  // brighten a color while keeping its hue (good for hair highlights)
  const mul = (hex, f) => { const n = parseInt(hex.slice(1), 16); return "#" + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.min(255, Math.round(v * f + 6)).toString(16).padStart(2, "0")).join(""); };
  const cache = new Map();

  function build(dir, frame, L){
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    const flip = dir === "left", side = dir === "left" || dir === "right";
    const r = (x, y, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(flip ? W - x - w : x, y, w, h); };

    const skin = L.skin, skinD = shade(skin, .82), skinDD = shade(skin, .68), skinL = shade(skin, 1.12);
    const hair = L.bald ? skin : L.hair, hairD = shade(hair, .6), hairL = mul(hair, 1.55);
    const shirt = L.shirt, shirtD = shade(shirt, .82), shirtL = shade(shirt, 1.12);
    const top = L.vest || shirt, topD = shade(top, .8);
    const pants = L.pants, pantsD = shade(pants, .75);
    const shoe = L.shoes || "#1c1d22", outline = "#1b1b1f";
    const eye = L.eyes || "#3a2a1e", lip = L.lips || shade(skin, .62);
    const sw = frame === 1 ? 1 : frame === 3 ? -1 : 0;

    // shadow
    g.fillStyle = "rgba(20,22,28,.25)"; g.fillRect(6, 44, 12, 3); g.fillRect(4, 45, 16, 1);

    if (!side){
      const front = dir === "down";
      // ---------- legs + shoes
      const lu = sw > 0 ? 1 : 0, ru = sw < 0 ? 1 : 0;
      r(7, 33, 5, 9 - lu, pants); r(13, 33, 5, 9 - ru, pants);
      r(11, 33, 1, 8, pantsD); r(17, 33, 1, 9 - ru, pantsD);
      r(6, 42 - lu, 6, 3, shoe); r(13, 42 - ru, 6, 3, shoe);
      if (front){ r(7, 42 - lu, 3, 1, "#3a3c44"); r(14, 42 - ru, 3, 1, "#3a3c44"); }
      // ---------- arms (behind torso edges)
      r(2, 20 + sw, 3, 10, top); r(2, 20 + sw, 1, 10, shade(top, .85)); r(2, 30 + sw, 3, 3, skin); r(2, 32 + sw, 3, 1, skinD);
      r(19, 20 - sw, 3, 10, top); r(21, 20 - sw, 1, 10, topD); r(19, 30 - sw, 3, 3, skin); r(19, 32 - sw, 3, 1, skinD);
      // ---------- torso
      r(4, 20, 16, 13, shirt); r(5, 19, 14, 1, shirt);
      r(18, 20, 2, 13, shirtD);
      if (L.stripes){ [6, 9, 15, 18].forEach(x => r(x, 20, 1, 13, L.stripes)); }
      r(4, 31, 16, 2, pantsD);                       // belt line
      if (front){
        r(10, 19, 4, 1, skin); r(11, 20, 2, 1, skin);   // neck opening
        if (!L.vest && !L.apron){
          r(8, 19, 2, 3, shirtL); r(14, 19, 2, 3, shirtL);   // collar
          r(12, 21, 1, 10, shirtD); r(12, 23, 1, 1, "#f4f1e8"); r(12, 27, 1, 1, "#f4f1e8");   // buttons
        }
        if (L.tie){ r(11, 20, 2, 2, L.tie); r(11, 22, 2, 8, L.tie); r(12, 22, 1, 8, shade(L.tie, .75)); }
        if (L.apron){ r(7, 22, 10, 10, L.apron); r(7, 22, 10, 1, shade(L.apron, .85)); r(6, 19, 1, 4, L.apron); r(17, 19, 1, 4, L.apron); }
        if (L.vest){
          r(4, 20, 6, 13, L.vest); r(14, 20, 6, 13, L.vest); r(5, 19, 4, 1, L.vest); r(15, 19, 4, 1, L.vest);
          r(9, 21, 1, 12, topD); r(14, 21, 1, 12, topD); r(18, 20, 2, 13, topD);
        }
        if (L.badge !== false && (L.badge || L.vest)){
          // name badge: white card, red + blue stripes up top, name line, on a clip
          r(15, 21, 1, 2, "#8a8f99");
          r(13, 23, 6, 5, "#f6f1e3"); r(13, 23, 6, 1, "#c0392b"); r(13, 24, 6, 1, "#2c5ea8");
          r(14, 26, 4, 1, "#3a3c44"); r(18, 23, 1, 5, "#d6d0c2");
        }
      } else {
        if (L.vest){ r(4, 20, 16, 13, L.vest); r(18, 20, 2, 13, topD); r(9, 19, 6, 2, shirtL); }
        else r(8, 19, 8, 2, shirtL);
      }
      // ---------- neck
      r(10, 16, 4, 3, skinD);
      // ---------- head
      r(6, 5, 12, 1, skin); r(5, 6, 14, 10, skin); r(6, 16, 12, 1, skin); r(8, 17, 8, 1, skinD);
      r(17, 6, 2, 10, skinD); r(6, 16, 12, 1, skinD);
      r(4, 9, 1, 4, skin); r(19, 9, 1, 4, skin); r(4, 10, 1, 2, skinDD); r(19, 10, 1, 2, skinDD);   // ears
      if (front){
        // eyes
        r(7, 10, 3, 2, "#f4f2ee"); r(14, 10, 3, 2, "#f4f2ee");
        r(8, 10, 2, 2, eye); r(14, 10, 2, 2, eye); r(8, 10, 1, 1, shade(eye, .5)); r(15, 10, 1, 1, shade(eye, .5));
        r(7, 12, 3, 1, skinD); r(14, 12, 3, 1, skinD);                     // under-eye
        // eyebrows
        r(7, 8, 3, 1, hairD); r(14, 8, 3, 1, hairD); r(6, 9, 1, 1, hairD); r(17, 9, 1, 1, hairD);
        // nose
        r(12, 11, 1, 2, skinD); r(11, 13, 2, 1, skinDD); r(13, 13, 1, 1, skinD);
        // cheeks + mouth
        r(6, 13, 2, 1, "rgba(220,110,100,.28)"); r(16, 13, 2, 1, "rgba(220,110,100,.28)");
        r(10, 15, 4, 1, lip); r(9, 14, 1, 1, skinD); r(14, 14, 1, 1, skinD); r(10, 16, 4, 1, skinL);
        if (L.glasses){
          const f = L.glasses === true ? "#1b1b1f" : L.glasses;
          r(6, 9, 5, 1, f); r(6, 12, 5, 1, f); r(6, 9, 1, 4, f); r(10, 9, 1, 4, f);
          r(13, 9, 5, 1, f); r(13, 12, 5, 1, f); r(13, 9, 1, 4, f); r(17, 9, 1, 4, f);
          r(11, 10, 2, 1, f); r(5, 10, 1, 1, f); r(18, 10, 1, 1, f);
          r(7, 10, 1, 1, "rgba(255,255,255,.55)"); r(14, 10, 1, 1, "rgba(255,255,255,.55)");
        }
        if (L.beard){
          r(5, 12, 1, 4, hair); r(18, 12, 1, 4, hair); r(6, 14, 3, 3, hair); r(15, 14, 3, 3, hair); r(8, 16, 8, 2, hair);
          r(10, 14, 4, 1, hair); r(10, 15, 4, 1, lip);
        }
      }
      // ---------- hair
      if (!L.bald){
        if (front){
          r(5, 2, 14, 4, hair); r(6, 1, 12, 1, hair); r(4, 4, 2, 7, hair); r(18, 4, 2, 7, hair);
          r(6, 6, 4, 1, hair); r(14, 6, 4, 1, hair); r(9, 6, 2, 1, hairD);
          r(8, 2, 5, 1, hairL); r(15, 3, 2, 1, hairL); r(5, 5, 1, 2, hairD); r(18, 5, 1, 2, hairD);
        } else {
          r(5, 2, 14, 14, hair); r(6, 1, 12, 1, hair); r(4, 4, 1, 9, hair); r(19, 4, 1, 9, hair);
          r(9, 15, 6, 2, skinD); r(8, 3, 6, 1, hairL); r(17, 4, 2, 10, hairD);
        }
        if (L.curly){
          [[6,0],[9,-0],[12,0],[15,0],[4,2],[18,2],[3,4],[20,4],[3,7],[20,7]].forEach(([x,y]) => r(x, Math.max(0,y), 2, 2, hair));
          [[7,1],[11,1],[14,2],[6,4],[10,3],[16,4]].forEach(([x,y]) => r(x, y, 1, 1, hairL));
          [[8,4],[12,3],[17,3],[5,3]].forEach(([x,y]) => r(x, y, 1, 1, hairD));
          if (front){ r(7, 6, 2, 2, hair); r(11, 6, 2, 1, hair); r(15, 6, 2, 2, hair); r(8, 7, 1, 1, hairD); }
          else { r(3, 9, 2, 5, hair); r(19, 9, 2, 5, hair); r(6, 15, 3, 2, hair); r(15, 15, 3, 2, hair); }
        }
        if (L.longHair){
          r(3, 6, 2, 16, hair); r(19, 6, 2, 16, hair); r(4, 20, 2, 3, hairD); r(18, 20, 2, 3, hairD);
          if (!front) r(5, 14, 14, 8, hair);
        }
      } else {
        r(8, 6, 3, 1, skinL); r(5, 5, 1, 3, skinD);
      }
      if (L.cap){ r(5, 1, 14, 5, L.cap); r(5, 1, 14, 1, shade(L.cap, 1.3)); if (front){ r(4, 6, 16, 2, shade(L.cap, .75)); } }
    } else {
      // =================== SIDE VIEW (facing right; left is mirrored) ===================
      // legs
      r(10 + sw, 33, 4, 9, pantsD); r(11 - sw, 33, 4, 9, pants);
      r(10 + sw, 42, 6, 3, shoe); r(11 - sw, 42, 6, 3, shoe); r(13 - sw, 42, 3, 1, "#3a3c44");
      // torso
      r(8, 20, 9, 13, shirt); r(9, 19, 7, 1, shirt); r(8, 20, 1, 13, shirtD);
      if (L.stripes){ [10, 13, 16].forEach(x => r(x, 20, 1, 13, L.stripes)); }
      if (L.vest){ r(8, 20, 7, 13, L.vest); r(8, 20, 1, 13, topD); }
      if (L.apron) r(15, 22, 2, 10, L.apron);
      if (L.tie) r(16, 21, 1, 7, L.tie);
      if (L.badge && !L.vest) r(15, 24, 2, 3, "#f6f1e3");
      if (L.vest) r(14, 24, 2, 2, "#f6f1e3");
      r(8, 31, 9, 2, pantsD);
      r(15, 19, 2, 2, shirtL);                                           // collar
      // arm
      r(11 + sw * 2, 21, 4, 9, top); r(11 + sw * 2, 21, 1, 9, topD); r(11 + sw * 2, 30, 4, 3, skin);
      // neck + head
      r(11, 16, 4, 3, skinD);
      r(8, 5, 11, 1, skin); r(7, 6, 12, 10, skin); r(8, 16, 10, 1, skin); r(10, 17, 7, 1, skinD);
      r(19, 11, 1, 2, skin); r(19, 13, 1, 1, skinD);                    // nose
      r(11, 9, 2, 4, skinD); r(12, 10, 1, 2, skinDD);                   // ear
      r(15, 10, 2, 2, "#f4f2ee"); r(16, 10, 1, 2, eye);                 // eye
      r(15, 8, 3, 1, hairD);                                             // eyebrow
      r(16, 15, 2, 1, lip); r(15, 14, 1, 1, skinD);
      r(17, 13, 1, 1, "rgba(220,110,100,.25)");
      if (L.glasses){ const f = L.glasses === true ? "#1b1b1f" : L.glasses; r(14, 9, 4, 1, f); r(14, 12, 4, 1, f); r(14, 9, 1, 4, f); r(17, 9, 1, 4, f); r(12, 10, 2, 1, f); }
      if (L.beard){ r(10, 13, 8, 4, hair); r(16, 15, 2, 1, lip); }
      if (!L.bald){
        r(7, 2, 11, 4, hair); r(8, 1, 9, 1, hair); r(6, 4, 5, 11, hair); r(7, 6, 3, 1, hairD); r(16, 6, 3, 1, hair);
        r(9, 2, 5, 1, hairL); r(6, 12, 2, 3, hairD);
        if (L.curly){
          [[7,0],[11,0],[15,0],[5,2],[18,3],[4,5],[4,9],[5,13],[18,6]].forEach(([x,y]) => r(x, y, 2, 2, hair));
          [[9,1],[13,1],[6,7],[16,2]].forEach(([x,y]) => r(x, y, 1, 1, hairL));
          r(16, 6, 3, 2, hair);
        }
        if (L.longHair){ r(5, 6, 5, 16, hair); r(5, 20, 4, 2, hairD); }
      } else { r(9, 6, 3, 1, skinL); }
      if (L.cap){ r(7, 1, 12, 5, L.cap); r(17, 5, 5, 2, shade(L.cap, .75)); }
    }
    return c;
  }

  // fx, fy = the spot between their feet. dir = "up" | "down" | "left" | "right". frame 0-3 = walk cycle.
  function person(g, fx, fy, dir, frame, L){
    const key = dir + frame + JSON.stringify(L);
    let img = cache.get(key);
    if (!img){ img = build(dir, frame, L); cache.set(key, img); }
    g.drawImage(img, Math.round(fx) - 12, Math.round(fy) - 46);
  }

  function nameTag(g, text, x, y, color = "#d8352a"){
    g.font = '16px "Silkscreen", monospace'; g.textAlign = "center"; g.textBaseline = "middle";
    const w = Math.ceil(g.measureText(text).width) + 12, h = 20;
    const bx = Math.round(x - w/2), by = Math.round(y - h/2);
    g.fillStyle = "#16171c"; g.fillRect(bx - 2, by - 2, w + 4, h + 4);
    g.fillStyle = color; g.fillRect(bx, by, w, h);
    g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(bx, by, w, 2);
    g.fillStyle = "#ffffff"; g.fillText(text, Math.round(x), by + h/2 + 1);
  }

  function steam(g, x, y, t){
    x = Math.round(x); y = Math.round(y);
    for (let i = 0; i < 2; i++){
      const side = i === 0 ? -1 : 1, ph = (t * 1.6 + i * .5) % 1;
      const sx = x + side * (12 + Math.round(ph * 8)), sy = y - 44 - Math.round(ph * 18);
      g.globalAlpha = 1 - ph;
      g.fillStyle = "#f3f3f3"; g.fillRect(sx - 4, sy - 2, 8, 6); g.fillRect(sx - 2, sy - 4, 4, 10);
      g.globalAlpha = 1;
    }
    g.fillStyle = "#d8352a";
    const ax = x + 12, ay = y - 46;
    [[0,0,2,4],[6,0,2,4],[0,6,2,4],[6,6,2,4],[-2,2,4,2],[6,2,4,2],[-2,6,4,2],[6,6,4,2]].forEach(([a,b,w,h]) => g.fillRect(ax + a, ay + b, w, h));
  }

  // A little hot dog (used on the menu board, over the counter, and in the HUD)
  function hotdog(g, x, y, s = 2){
    const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a*s, y + b*s, w*s, h*s); };
    R(0, 2, 14, 4, "#e2b46a"); R(1, 1, 12, 1, "#f0c884"); R(0, 5, 14, 1, "#b88a44");     // bun
    R(-1, 2, 16, 2, "#c4422f"); R(-1, 2, 16, 1, "#e0634f");                               // sausage
    R(2, 2, 2, 1, "#f2d24a"); R(6, 3, 2, 1, "#f2d24a"); R(10, 2, 2, 1, "#f2d24a");       // mustard
  }

  // The famous food court menu board: "HOT DOG + SODA|$1.50" (| starts the second line)
  function menuBoard(g, text, cx, cy){
    const [l1, l2] = text.split("|");
    const w = 330, h = 82, x = Math.round(cx*TS - w/2), y = Math.round(cy*TS - h/2);
    g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x + 4, y + 6, w, h);
    g.fillStyle = "#8a5d39"; g.fillRect(x - 4, y - 4, w + 8, h + 8);
    g.fillStyle = "#f6f4ee"; g.fillRect(x, y, w, h);
    // Individual red-bordered menu panels: pizza, bakes, sandwich, combo, drinks.
    const panels = [0, 49, 98, 147, 245, 287, 330];
    for (let i = 0; i < panels.length - 1; i++){
      const px = x + panels[i], pw = panels[i + 1] - panels[i];
      g.fillStyle = "#a91f18"; g.fillRect(px, y, pw, 3); g.fillRect(px, y, 2, h); g.fillRect(px + pw - 2, y, 2, h); g.fillRect(px, y + h - 3, pw, 3);
      g.fillStyle = i % 2 ? "#8d5d3b" : "#6f432c"; g.fillRect(px + 4, y + 5, pw - 8, 38);
      g.fillStyle = "#f4d089"; g.fillRect(px + 9, y + 13, pw - 18, 16);
      g.fillStyle = "#ffffff"; g.fillRect(px + 4, y + 46, pw - 8, 30);
      g.fillStyle = "#284a78"; g.fillRect(px + 8, y + 52, pw - 16, 3);
    }
    // The famous oversized center hot dog combo panel.
    g.fillStyle = "#ffffff"; g.fillRect(x + 151, y + 4, 90, 72);
    g.fillStyle = "#a91f18"; g.fillRect(x + 147, y, 98, 3); g.fillRect(x + 147, y, 3, h); g.fillRect(x + 242, y, 3, h); g.fillRect(x + 147, y + h - 3, 98, 3);
    hotdog(g, x + 157, y + 10, 4);
    g.textBaseline = "middle"; g.textAlign = "center";
    g.font = '8px "Silkscreen", monospace'; g.fillStyle = "#20242a"; g.fillText(l1 || "HOT DOG + SODA", x + 196, y + 50);
    g.font = 'bold 24px "Silkscreen", monospace'; g.fillStyle = "#244b80"; g.fillText(l2 || "$1.50", x + 196, y + 66);
    g.font = '7px "Silkscreen", monospace'; g.fillStyle = "#ffffff";
    g.fillText("KIRKLAND", x + 24, y + 10); g.fillText("KIRKLAND", x + 73, y + 10); g.fillText("KIRKLAND", x + 122, y + 10); g.fillText("KIRKLAND", x + 266, y + 10); g.fillText("KIRKLAND", x + 308, y + 10);
  }

  // Hanging signs from the map file. `brand` draws the familiar warehouse wordmark.
  function sign(g, text, cx, cy, kind = "dept"){
    if (kind === "menu") return menuBoard(g, text, cx, cy);
    if (kind === "brand"){
      const x=Math.round(cx*TS-96), y=Math.round(cy*TS-36);
      g.fillStyle="rgba(25,29,27,.25)"; g.fillRect(x+4,y+5,192,72);
      g.fillStyle="#f1f1ec"; g.fillRect(x,y,192,72);
      for(let xx=x+3;xx<x+192;xx+=8){
        g.fillStyle="#c7ccc7"; g.fillRect(xx,y,1,72);
        g.fillStyle="#ffffff"; g.fillRect(xx+1,y,1,72);
      }
      g.textAlign="center"; g.textBaseline="middle";
      g.font="bold italic 34px Arial, sans-serif"; g.fillStyle="#c92530"; g.fillText("COSTCO",x+96,y+27);
      g.font="bold italic 15px Arial, sans-serif"; g.fillStyle="#27538c"; g.fillText("WHOLESALE",x+110,y+51);
      for(let yy=y+44;yy<y+57;yy+=5) g.fillRect(x+20,yy,32,3);
      return;
    }
    if (kind === "entrance"){
      g.font='bold 12px Arial, sans-serif'; g.textBaseline="middle"; g.textAlign="center";
      const w=g.measureText(text).width+12, x=cx*TS-w/2, y=cy*TS-8;
      g.fillStyle="#eae5d7"; g.fillRect(x,y,w,16);
      g.fillStyle="#a82a30"; g.fillText(text,cx*TS,y+8);
      return;
    }
    g.font = kind === "brand" ? 'bold italic 22px "Silkscreen", monospace' : '16px "Silkscreen", monospace';
    g.textBaseline = "middle"; g.textAlign = "center";
    const w = Math.ceil(g.measureText(text).width) + (kind === "aisle" || kind === "lane" ? 10 : 16), h = 22;
    const x = Math.round(cx*TS - w/2), y = Math.round(cy*TS - h/2);
    const bg = { brand:"#f5f4ef", dept:"#c0392b", bakery:"#c82027", produce:"#c82027", optical:"#d51f2a", deli:"#f4f3ee", meat:"#f4f3ee", selfCheckout:"#c52327", aisle:"#2c5ea8", lane:"#b3261e", door:"#1f6b3a", tire:"#c82027", room:"#4a505c" }[kind] || "#c0392b";
    g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(x + 3, y + 5, w, h);
    g.fillStyle = "#16171c"; g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(x, y, w, 2);
    g.fillStyle = kind === "brand" ? "#d52b1e" : (kind === "deli" || kind === "meat") ? "#292d31" : "#ffffff";
    g.fillText(text, x + w/2, y + h/2 + 1);
    if (kind === "meat"){
      // Blue/red USDA-style shields flanking the department name.
      g.fillStyle = "#244b80"; g.fillRect(x + 4, y + 4, 8, 14); g.fillRect(x + w - 12, y + 4, 8, 14);
      g.fillStyle = "#c82027"; g.fillRect(x + 4, y + 9, 8, 4); g.fillRect(x + w - 12, y + 9, 8, 4);
    }
    if (kind === "selfCheckout"){
      // Small payment badges under the wording, like the hanging Costco sign.
      for (let i = 0; i < 4; i++){
        g.fillStyle = i % 2 ? "#ffffff" : "#244b80";
        g.fillRect(x + w/2 - 22 + i*12, y + h - 5, 9, 3);
      }
    }
    if (kind === "brand"){
      g.fillStyle = "#1769aa";
      g.fillRect(x + 8, y + h - 4, w - 16, 2);
    }
  }

  return { person, nameTag, steam, sign, hotdog, W, H };
})();
