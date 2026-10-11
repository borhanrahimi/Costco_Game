// tiles.js — draws the store: floors, racks full of products, coolers, registers…
// The game uses a 3/4 view: things stand up off the floor, so you see their top AND their front.
// Every map letter has a floor look or an object look (with a height in pixels).

window.Tiles = (() => {
  const TS = Game.TS;   // 32 pixels per square

  // Dedicated fixtures: s sink, t toilet, d desk, p stall partition, f open cooler.
  const SOLID = new Set(["W","R","P","C","K","I","J","A","F","T","V","D","B","O","E","U","Q","L","Y","~","N","G","H"]);

  const LEGEND = {
    ".": "floor",            "S": "cold floor (cooler)", "M": "door mat",
    "X": "dock / shop floor","~": "outside (parking lot)","W": "wall",
    "R": "racking with products", "P": "pallet display", "C": "register",
    "Q": "self checkout",    "K": "counter",             "F": "cooler / freezer case",
    "O": "oven / rotisserie","T": "table",               "V": "TV wall",
    "E": "electronics table","B": "produce bin",         "U": "pumpkin bin",
    "L": "clothing table",   "Y": "candy shelf",         "D": "door",
    "N": "meat case",        "G": "bakery table",        "H": "food court counter",
    "I": "optical display",   "J": "deli rotisserie",    "A": "produce cooler wall",
  };

  // How tall each object stands (pixels). Floors are 0.
  const HEIGHT = { R:56, F:40, K:22, I:42, J:48, A:46, C:18, Q:34, P:26, L:14, Y:40, B:14, U:18, E:16, V:46, O:36, T:12, W:46, D:46, N:46, G:24, H:24 };
  Object.assign(HEIGHT, { s:24, t:18, d:22, p:30, f:20 });
  Object.assign(LEGEND, { s:"sink and mirror", t:"toilet", d:"office desk", p:"stall partition", f:"open refrigerated case" });
  LEGEND.a = "main entrance / exit aisle";
  LEGEND.r = "continuous merchandise shelving";
  SOLID.add("r");
  // Collision-only diagonal wall; the connected facade supplies its artwork.
  SOLID.add("w");
  SOLID.add("q");SOLID.add("e");
  LEGEND.q="self checkout";LEGEND.e="major appliances";
  for (const c of ["s", "t", "d", "p", "f"]) SOLID.add(c);

  // repeatable "random" number 0..1 from any whole number (so the store looks the same every time)
  function hash(n){
    n = Math.round(n) | 0;
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  const pick = (arr, seed) => arr[Math.floor(hash(seed) * arr.length) % arr.length];

  // ---------- small color helpers ----------
  function shade(hex, f){
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f < 1){ r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
    return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }

  function canvas(w, h, fn){
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); fn(g, (x,y,ww,hh,col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); });
    return c;
  }

  // =========================================================== PRODUCTS
  // Each draws stock into a box on a shelf (x, y, w, h). seed varies the colors.
  const PRODUCTS = {
    water(R, x, y, w, h, s){        // cases of bottled water
      R(x, y, w, h, "#9fd3ee");
      for (let yy = y + 2; yy < y + h - 1; yy += 6) for (let xx = x + 1; xx < x + w - 1; xx += 3){ R(xx, yy, 2, 5, "#5fb3df"); R(xx, yy, 2, 1, "#2a6f97"); }
      R(x, y, w, 1, "rgba(255,255,255,.7)");
      for (let yy = y + 5; yy < y + h; yy += 6) R(x, yy, w, 1, "#2a6f97");
    },
    paper(R, x, y, w, h, s){        // paper towels / toilet paper bundles
      R(x, y, w, h, "#f4f6f8");
      for (let xx = x + 1; xx < x + w - 2; xx += 5){ R(xx, y + 1, 4, h - 2, "#ffffff"); R(xx + 3, y + 1, 1, h - 2, "#d9dde3"); }
      R(x, y + Math.floor(h / 2) - 2, w, 4, pick(["#2c5ea8", "#3a8a4a", "#c0392b"], s));
      R(x + 3, y + Math.floor(h / 2) - 1, 6, 2, "#ffffff");
    },
    cereal(R, x, y, w, h, s){       // tall boxes
      const cols = ["#e8c341", "#c0392b", "#2c5ea8", "#e2742c", "#6a4c93", "#3a8a4a"];
      for (let xx = x; xx < x + w; xx += 6){
        const c = pick(cols, s + xx);
        R(xx, y + 1, 5, h - 1, c); R(xx, y + 1, 5, 1, shade(c, 1.4)); R(xx + 1, y + 4, 3, 3, "#ffffff"); R(xx + 4, y + 1, 1, h - 1, shade(c, .7));
      }
    },
    detergent(R, x, y, w, h, s){    // jugs
      const c = pick(["#e2742c", "#2c5ea8", "#3a8a4a"], s);
      R(x, y + h - 3, w, 3, shade(c, .6));
      for (let xx = x + 1; xx < x + w - 4; xx += 7){
        R(xx, y + 4, 6, h - 5, c); R(xx + 1, y + 2, 3, 2, "#f4f4f4"); R(xx, y + 4, 1, h - 5, shade(c, 1.35)); R(xx + 2, y + 8, 3, 4, "#ffffff");
      }
    },
    cans(R, x, y, w, h, s){         // canned food trays
      const top = pick(["#c0392b", "#3a8a4a", "#e8c341", "#d9dde3"], s);
      R(x, y, w, h, "#8a8f99");
      for (let yy = y + 1; yy < y + h - 3; yy += 6) for (let xx = x + 1; xx < x + w - 1; xx += 4){
        R(xx, yy, 3, 5, "#b8bec8"); R(xx, yy + 1, 3, 2, top); R(xx, yy, 3, 1, "#e6e9ed");
      }
      R(x, y + h - 2, w, 2, "#6a4a2a");
    },
    chips(R, x, y, w, h, s){        // snack bags
      const cols = ["#e8c341", "#c0392b", "#2c5ea8", "#e2742c", "#3a8a4a", "#7a3b6e"];
      for (let xx = x; xx < x + w; xx += 5){
        const c = pick(cols, s + xx * 3);
        R(xx, y + 2, 5, h - 2, c); R(xx + 1, y + 1, 3, 1, c); R(xx + 1, y + 5, 3, 3, shade(c, 1.5)); R(xx + 4, y + 2, 1, h - 2, shade(c, .7));
      }
    },
    coffee(R, x, y, w, h, s){       // big coffee tubs
      for (let xx = x + 1; xx < x + w - 5; xx += 8){
        R(xx, y + 3, 7, h - 3, "#b3261e"); R(xx, y + 2, 7, 2, "#e8c341"); R(xx + 1, y + 7, 5, 3, "#f4e7c8"); R(xx + 6, y + 3, 1, h - 3, "#7d1a14");
      }
    },
    wine(R, x, y, w, h, s){         // bottles
      R(x, y + h - 2, w, 2, "#5a3a22");
      for (let xx = x + 1; xx < x + w - 1; xx += 3){
        const c = hash(s + xx) > .5 ? "#24502c" : "#5a1e2a";
        R(xx, y + 5, 2, h - 7, c); R(xx, y + 1, 1, 4, c); R(xx, y + 9, 2, 3, "#e6dcc4");
      }
    },
    petfood(R, x, y, w, h, s){      // big bags
      const band = pick(["#c0392b", "#2c5ea8", "#3a8a4a"], s);
      for (let xx = x; xx < x + w; xx += 11){
        R(xx, y + 1, 10, h - 1, "#d9b77a"); R(xx, y + 4, 10, 4, band); R(xx + 2, y + 10, 5, 4, "#b98d4e"); R(xx + 9, y + 1, 1, h - 1, "#a5824a");
      }
    },
    tvs(R, x, y, w, h, s){          // TV boxes
      R(x, y, w, h, "#16171c");
      for (let xx = x + 1; xx < x + w - 2; xx += 16){
        R(xx, y + 2, 14, h - 3, "#22252b");
        R(xx + 1, y + 4, 12, h - 8, pick(["#2a6f97", "#2b8a74", "#6a4c93", "#c46b4a"], s + xx));
        R(xx + 1, y + 4, 12, 2, "rgba(255,255,255,.3)");
      }
    },
    cartons(R, x, y, w, h, s){      // plain brown cases with labels
      for (let xx = x; xx < x + w; xx += 8){
        const c = pick(["#b08454", "#9a6f45", "#c9a26e"], s + xx);
        R(xx, y + 1, 8, h - 1, c); R(xx, y + 1, 8, 1, shade(c, 1.3)); R(xx + 7, y + 1, 1, h - 1, shade(c, .7));
        R(xx + 2, y + 4, 4, 3, "#f4f1e8"); R(xx + 3, y + 5, 2, 1, "#555");
      }
    },
    diapers(R, x, y, w, h, s){      // big soft packs
      for (let xx = x; xx < x + w; xx += 10){
        R(xx, y + 1, 9, h - 1, "#e6eef8"); R(xx, y + 1, 9, 5, "#8ab4e0"); R(xx + 2, y + 8, 5, 4, "#f2c94c"); R(xx + 8, y + 1, 1, h - 1, "#b4c8de");
      }
    },
  };
  const PRODUCT_NAMES = Object.keys(PRODUCTS);

  // =========================================================== FLOORS
  const floorCache = new Map();
  function floor(c, tx, ty){
    const v = Math.floor(hash(tx * 73 + ty * 151) * 4);
    const joint = (tx % 4 === 0 ? 1 : 0) + (ty % 4 === 0 ? 2 : 0);
    const stripe = c === "~" ? (tx % 3 === 0 ? 1 : 0) : 0;
    const key = c + v + joint + stripe;
    if (floorCache.has(key)) return floorCache.get(key);
    const img = canvas(TS, TS, (g, R) => {
      const seed = v * 977 + joint;
      if (c === "~"){              // parking lot
        R(0, 0, TS, TS, "#2e3035");
        for (let i = 0; i < 10; i++) R(Math.floor(hash(seed + i) * 31), Math.floor(hash(seed + i + 50) * 31), 1, 1, "#383b41");
        if (stripe) R(0, 0, 2, TS, "#d9d6cf");
        return;
      }
      if (c === "M"){              // rubber mat
        R(0, 0, TS, TS, "#2f3238");
        for (let y = 2; y < TS; y += 4) R(0, y, TS, 1, "#24262b");
        R(0, 0, TS, 1, "#3d4148");
        return;
      }
      const base = c === "a" ? "#d8d4ca" : c === "S" ? "#bccad0" : c === "X" ? "#a39f97" : "#cdc9c1";
      R(0, 0, TS, TS, base);
      // polished-concrete mottling
      for (let i = 0; i < 14; i++){
        const px = Math.floor(hash(seed + i * 3) * 31), py = Math.floor(hash(seed + i * 7 + 1) * 31);
        R(px, py, 2, 1, i % 2 ? shade(base, .96) : shade(base, 1.04));
      }
      if (v === 0) R(4, 6, 10, 3, shade(base, 1.03));            // soft sheen
      if (v === 3) R(18, 20, 7, 1, shade(base, .93));            // little scuff
      // Long, soft reflections from the dense rows of ceiling fixtures.
      if (c === "." && v === 1){ R(13, 4, 5, 14, "rgba(255,255,246,.18)"); R(14, 6, 3, 9, "rgba(255,255,255,.22)"); }
      if (joint & 1) R(0, 0, 1, TS, shade(base, .9));           // saw-cut joints
      if (joint & 2) R(0, 0, TS, 1, shade(base, .9));
      if (c === "X" && (tx + ty) % 9 === 0) R(8, 14, 14, 2, "#8f8b83");
    });
    floorCache.set(key, img);
    return img;
  }

  // =========================================================== OBJECTS
  // For object tiles we draw a TOP (32x32, shifted up by the height) and,
  // on the bottom row of an object, a FRONT face (32 x height).
  const objCache = new Map();
  const at = (grid, x, y) => (grid[y] && grid[y][x]) || "~";

  function productFor(tx, ty, level){
    const bay = Math.floor(tx / 3);
    return PRODUCT_NAMES[Math.floor(hash(bay * 31 + ty * 17 + level * 101) * PRODUCT_NAMES.length) % PRODUCT_NAMES.length];
  }

  function rackFront(p1, p2, upL, upR, seed){
    const key = "Rf" + p1 + p2 + upL + upR + seed;
    if (objCache.has(key)) return objCache.get(key);
    const H = HEIGHT.R;
    const img = canvas(TS, H, (g, R) => {
      R(0, 0, TS, H, "#262a32");                                   // dark inside of the rack
      PRODUCTS[p2](R, 0, 7, TS, 17, seed * 3 + 7);                  // upper shelf
      R(0, 24, TS, 4, "#e2742c"); R(0, 24, TS, 1, "#f5a05c"); R(0, 27, TS, 1, "#a5521c");   // orange beam
      PRODUCTS[p1](R, 0, 29, TS, 21, seed * 5 + 3);                 // floor-level pallet of stock
      R(0, 50, TS, 4, "#a37a4c"); R(0, 51, TS, 1, "#7d5a34"); R(4, 52, 5, 2, "#3a2a1a"); R(20, 52, 5, 2, "#3a2a1a");   // pallet
      R(0, 54, TS, 2, "#1e2026");
      R(0, 2, TS, 4, "#e2742c"); R(0, 2, TS, 1, "#f5a05c"); R(0, 5, TS, 1, "#a5521c");      // top beam
      R(0, 0, TS, 2, "#3a3f48");
      for (let i = 0; i < 2; i++){                                  // shrink-wrap shine
        const sx = Math.floor(hash(seed + i * 9) * 26);
        R(sx, 30 + i * 8, 4, 1, "rgba(255,255,255,.35)");
      }
      if (upL){ R(0, 0, 3, H, "#39766e"); R(0, 0, 1, H, "#5d9b89"); for (let y = 3; y < H; y += 5) R(1, y, 1, 2, "#234d45"); }
      if (upR){ R(29, 0, 3, H, "#39766e"); R(29, 0, 1, H, "#5d9b89"); for (let y = 3; y < H; y += 5) R(30, y, 1, 2, "#234d45"); }
    });
    objCache.set(key, img);
    return img;
  }

  function rackTop(edgeT, edgeB, upL, upR, seed){
    const key = "Rt" + edgeT + edgeB + upL + upR + (seed % 6);
    if (objCache.has(key)) return objCache.get(key);
    const img = canvas(TS, TS, (g, R) => {
      R(0, 0, TS, TS, "#2a2f38");
      // overstock cartons seen from above
      const s = seed % 6;
      const boxes = s < 2 ? [[1,1,14,14],[17,1,14,14],[1,17,14,14],[17,17,14,14]] : s < 4 ? [[1,1,30,14],[1,17,14,14],[17,17,14,14]] : [[1,1,14,30],[17,1,14,14],[17,17,14,14]];
      boxes.forEach(([x, y, w, h], i) => {
        const c = pick(["#b08454", "#9a6f45", "#c9a26e", "#d9c6a0"], seed + i * 13);
        R(x, y, w, h, c); R(x, y, w, 1, shade(c, 1.25)); R(x + w - 1, y, 1, h, shade(c, .75)); R(x, y + h - 1, w, 1, shade(c, .75));
        if (w > h) R(x, y + Math.floor(h / 2) - 1, w, 2, "#e0cfa3"); else R(x + Math.floor(w / 2) - 1, y, 2, h, "#e0cfa3");
        if (hash(seed + i) > .6) R(x + 2, y + 2, 4, 3, "#f4f1e8");
      });
      if (hash(seed + 77) > .55){ R(2, 3, 12, 1, "rgba(255,255,255,.4)"); R(19, 22, 9, 1, "rgba(255,255,255,.35)"); }
      if (edgeT){ R(0, 0, TS, 2, "#e2742c"); R(0, 0, TS, 1, "#f5a05c"); }
      if (edgeB){ R(0, 30, TS, 2, "#e2742c"); }
      if (upL){ R(0, 0, 3, 3, "#39766e"); R(0, 29, 3, 3, "#39766e"); }
      if (upR){ R(29, 0, 3, 3, "#39766e"); R(29, 29, 3, 3, "#39766e"); }
    });
    objCache.set(key, img);
    return img;
  }

  function simpleObj(c, part, variant, edgeFlags){
    const key = c + part + variant + edgeFlags;
    if (objCache.has(key)) return objCache.get(key);
    const H = HEIGHT[c] || 0;
    const isTop = part === "top";
    const img = canvas(TS, isTop ? TS : H, (g, R) => {
      const v = variant;
      switch (c){
        case "W":
          if (isTop){
            // Unbroken cap: individual tiles no longer read as separate blocks.
            const cap=g.createLinearGradient(0,0,0,TS);
            cap.addColorStop(0,"#dfd2ba");cap.addColorStop(1,"#cbb89c");
            g.fillStyle=cap;g.fillRect(0,0,TS,TS);
          }
          else {
            const face=g.createLinearGradient(0,0,0,H);
            face.addColorStop(0,"#d8c7aa");face.addColorStop(1,"#b3a085");
            g.fillStyle=face;g.fillRect(0,0,TS,H);
            for(let y=9;y<H;y+=10) R(0,y,TS,.5,"rgba(246,236,215,.25)");
            R(0,0,TS,2,"#b23b3e");R(0,28,TS,4,"#8b725b");
          }
          break;
        case "D":
          if (isTop){ R(0, 0, TS, TS, "#3b3f47"); }
          else {
            R(0, 0, TS, H, "#4a505c"); R(2, 4, 28, H - 6, "#8fb6c9"); R(2, 4, 28, 6, "#b9d5e2");
            R(15, 4, 2, H - 6, "#4a505c"); R(6, 14, 3, 1, "rgba(255,255,255,.6)"); R(20, 22, 4, 1, "rgba(255,255,255,.5)");
          }
          break;
        case "F": {
          if (isTop){
            // chest cooler seen from above: white rim, glass lids, product inside
            R(0, 0, TS, TS, "#e9edf0"); R(0, 0, TS, 1, "#ffffff");
            R(2, 2, 28, 28, "#7fb8d0");
            const it2 = ["#c0392b", "#f2c94c", "#f6f6f3", "#e59a9a", "#3a8a4a", "#2c5ea8", "#e2742c", "#b08454"];
            for (let y = 3; y < 29; y += 6) for (let x = 3; x < 29; x += 7){ const c3 = pick(it2, v * 17 + x * 3 + y * 11); R(x, y, 6, 5, c3); R(x, y, 6, 1, shade(c3, 1.3)); }
            R(2, 15, 28, 2, "#d6dde2"); R(3, 3, 12, 1, "rgba(255,255,255,.6)"); R(18, 19, 8, 1, "rgba(255,255,255,.5)");
          }
          else {
            R(0, 0, TS, H, "#e9edf0"); R(0, 0, TS, 4, "#2c5ea8"); R(0, 1, TS, 1, "#9fd1ff");
            R(1, 5, 30, 30, "#a9d8ec");
            const items = ["#c0392b", "#f2c94c", "#f6f6f3", "#e59a9a", "#3a8a4a", "#2c5ea8", "#e2742c"];
            for (let y = 7; y < 34; y += 9){ R(1, y + 7, 30, 1, "#d6e2e8"); for (let x = 2; x < 30; x += 4) R(x, y, 3, 6, pick(items, v * 31 + x * 7 + y)); }
            R(1, 5, 30, 2, "rgba(255,255,255,.55)"); R(15, 5, 2, 30, "#d6dde2"); R(13, 14, 1, 8, "#8a939c"); R(18, 14, 1, 8, "#8a939c");
            R(0, 35, TS, 5, "#4a505c");
          }
          break;
        }
        case "s":
          if (isTop){
            R(0, 0, TS, TS, "#e2e5e5"); R(5, 9, 22, 17, "#ffffff");
            R(8, 12, 16, 11, "#aabfc6"); R(11, 14, 10, 7, "#d0e0e3");
            R(14, 4, 4, 9, "#788990"); R(12, 4, 8, 3, "#c9d4d7");
          } else {
            R(0, 0, TS, H, "#d9dedf"); R(2, 2, 28, 12, "#a8c4ce");
            R(4, 4, 24, 2, "#edf5f7"); R(0, 16, TS, 4, "#f5f6f5");
            R(2, 20, 28, 4, "#87959b");
          }
          break;
        case "t":
          if (isTop){
            R(7, 2, 18, 8, "#f7f7f3"); R(8, 3, 16, 2, "#ffffff");
            R(6, 12, 20, 15, "#f7f7f3"); R(9, 14, 14, 10, "#899ba2");
            R(11, 16, 10, 6, "#c4d8de"); R(10, 27, 12, 3, "#d7dddd");
          } else { R(8, 0, 16, 7, "#f7f7f3"); R(10, 7, 12, 9, "#e5e8e6"); R(8, 16, 16, 2, "#b5bfc1"); }
          break;
        case "p":
          if (isTop){ R(14, 0, 4, TS, "#b7c3c7"); R(14, 0, 1, TS, "#edf0f0"); }
          else { R(14, 0, 4, H - 4, "#aebdc1"); R(14, H - 4, 2, 4, "#65747b"); }
          break;
        case "d":
          if (isTop){
            R(0, 0, TS, TS, "#b69b76"); R(0, 0, TS, 2, "#d4bc98");
            R(7, 3, 18, 12, "#262c32"); R(9, 5, 14, 8, "#75aebf");
            R(8, 19, 16, 5, "#e3e6e6"); R(26, 19, 3, 4, "#303940");
            R(2, 21, 4, 7, "#f7f3e8");
          } else { R(0, 0, TS, 3, "#b69b76"); R(2, 3, 3, H - 3, "#616971"); R(25, 3, 5, H - 3, "#80888d"); }
          break;
        case "f":
          if (isTop){
            R(0, 0, TS, TS, "#c2ccd0"); R(0, 0, TS, 3, "#f4f7f6");
            R(3, 4, 26, 25, "#718b95");
            for (let y = 5; y < 27; y += 7) for (let x = 4; x < 28; x += 8){
              R(x, y, 7, 6, "#eef0e8"); R(x + 1, y + 1, 5, 3, pick(["#d79b7d", "#b24f46", "#e5bb65", "#73965d"], v + x + y));
            }
          } else { R(0, 0, TS, H, "#d0d7da"); R(0, 0, TS, 3, "#f4f6f5"); R(0, 4, TS, 3, "#c52929"); R(0, H - 4, TS, 4, "#657178"); }
          break;
        case "K":
          if (isTop){ R(0, 0, TS, TS, "#dfe3e8"); R(0, 0, TS, 2, "#f1f3f5"); for (let i = 0; i < 6; i++) R(Math.floor(hash(v + i) * 30), Math.floor(hash(v + i + 9) * 30), 2, 1, "#cfd4da"); }
          else { R(0, 0, TS, H, "#b9bfc7"); R(0, 0, TS, 3, "#e8ebee"); R(0, 3, TS, 1, "#8f95a0"); R(15, 4, 1, H - 8, "#9aa1ab"); R(0, H - 4, TS, 4, "#3a3f48"); }
          break;
        case "I":   // Costco Optical: red wall, illuminated frame board and white counter
          if (isTop){
            R(0, 0, TS, TS, "#f5f5f2"); R(0, 0, TS, 3, "#ffffff");
            R(2, 5, 28, 22, "#e7e8e5");
            // Glasses laid out on the white display surface.
            for (let y = 7; y < 25; y += 6) for (let x = 4; x < 27; x += 8){
              R(x, y, 5, 2, "#34383d"); R(x + 1, y + 1, 1, 1, "#dce7ec"); R(x + 3, y + 1, 1, 1, "#dce7ec");
            }
            R(11, 3, 10, 7, "#22262a"); R(12, 4, 8, 5, "#75b7d0");
          } else {
            // Red branded upper wall and bright frame display below.
            R(0, 0, TS, H, "#f3f3ef"); R(0, 0, TS, 9, "#d51f2a");
            R(2, 2, 28, 2, "#ffffff");
            R(2, 11, 28, 24, "#ffffff"); R(2, 11, 28, 2, "#ecece8");
            for (let y = 15; y < 33; y += 5) for (let x = 4; x < 28; x += 7){
              const fc = (x + y + v) % 3 === 0 ? "#b3261e" : "#252a2f";
              R(x, y, 5, 2, fc); R(x + 1, y + 1, 1, 1, "#d8e5e8"); R(x + 3, y + 1, 1, 1, "#d8e5e8");
            }
            R(0, 35, TS, 4, "#d51f2a"); R(0, H - 3, TS, 3, "#aeb4b9");
          }
          break;
        case "J":   // Kirkland rotisserie hot-chicken case
          if (isTop){
            R(0, 0, TS, TS, "#8d9398"); R(0, 0, TS, 3, "#d6dadd");
            R(2, 4, 28, 25, "#4a3b2b"); R(3, 5, 26, 23, "#f0b34f");
            // Packaged chickens beneath the glass.
            for (let y = 7; y < 27; y += 9) for (let x = 4; x < 28; x += 8){
              R(x, y, 7, 7, "#18191b"); R(x + 1, y + 1, 5, 4, "#9c552b");
              R(x + 2, y + 1, 3, 2, "#d88a45"); R(x + 1, y + 5, 5, 1, "#c52b22");
            }
            R(2, 4, 28, 2, "rgba(255,255,255,.65)");
          } else {
            R(0, 0, TS, H, "#70777d"); R(0, 0, TS, 5, "#b8bec2");
            // Alternating red hot-food placards across the canopy.
            R(2, 6, 28, 8, v % 2 ? "#c92822" : "#f2f0e9");
            R(5, 9, 22, 2, v % 2 ? "#ffffff" : "#282c30");
            R(1, 16, 30, 27, "#33271e"); R(2, 17, 28, 25, "#e6a13c");
            R(2, 17, 28, 3, "#ffd57a");
            for (let x = 3; x < 29; x += 7){
              R(x, 24, 6, 13, "#151719"); R(x + 1, 25, 4, 7, "#a95b2d");
              R(x + 2, 25, 2, 4, "#e49a50"); R(x + 1, 34, 4, 2, "#c92822");
            }
            R(0, 42, TS, 4, "#858b90"); R(0, H - 3, TS, 3, "#44494d");
          }
          break;
        case "A":   // white produce-cooler portal wall and stocked cold shelving
          if (isTop){
            R(0, 0, TS, TS, "#f1f2ef"); R(0, 0, TS, 3, "#ffffff");
            R(5, 4, 22, 25, "#606970");
            for (let y = 6; y < 28; y += 7){ R(6, y, 20, 5, pick(["#55a052", "#d39b35", "#b84838", "#6a88ae"], v + y)); R(6, y + 5, 20, 1, "#c7cbcc"); }
          } else {
            R(0, 0, TS, H, "#f4f5f2"); R(0, 0, TS, 3, "#ffffff");
            R(5, 6, 24, 34, "#4f575d");
            for (let y = 8; y < 38; y += 8){
              R(6, y, 22, 6, pick(["#5aa35a", "#d8a33c", "#bf5041", "#6f91b8"], v + y));
              R(6, y + 6, 22, 2, "#d1d5d6");
            }
            R(2, 18, 4, 25, "#b3261e"); R(1, 18, 6, 4, "#d4473d");
            R(0, H - 4, TS, 4, "#7b8287");
          }
          break;
        case "C":
          if (isTop){
            // Costco-style long black belt in a broad gray metal checkout deck.
            R(0, 0, TS, TS, "#777e86"); R(0, 0, TS, 2, "#b8bec4");
            R(5, 0, 21, TS, "#181b1f"); R(7, 1, 17, TS - 2, "#292d32");
            for (let y = 3; y < TS; y += 6) R(7, y, 17, 1, "#363b41");
            R(4, 0, 2, TS, "#aeb4ba"); R(25, 0, 2, TS, "#555c64");
            if (edgeFlags & 1){
              // Scanner, customer display, card reader and red lane accent.
              R(2, 2, 8, 11, "#3c4248"); R(3, 3, 6, 5, "#72c9d2");
              R(27, 3, 4, 10, "#24282d"); R(27, 4, 3, 5, "#8fd7df");
              R(0, 15, 5, 12, "#a9251c"); R(1, 16, 3, 10, "#d84637");
            }
          } else {
            // Open industrial base with bulk cases stored below, as in the photo.
            R(0, 0, TS, H, "#555c64"); R(0, 0, TS, 3, "#aeb4ba");
            R(3, 4, 26, H - 7, "#20242a");
            R(5, 7, 10, 7, "#2c5ea8"); R(16, 7, 11, 7, "#244b80");
            R(6, 8, 8, 2, "#e8e9e7"); R(18, 8, 7, 2, "#e8e9e7");
            R(0, H - 3, TS, 3, "#34393f");
            R(2, H - 4, 3, 4, "#1a1d20"); R(27, H - 4, 3, 4, "#1a1d20");
          }
          break;
        case "Q":
          if (isTop){
            // Wide stainless bagging deck around the dark kiosk body.
            R(0, 0, TS, TS, "#373c41");
            R(1, 3, 9, 25, "#aeb5ba"); R(2, 4, 7, 23, "#d5d9dc");
            R(22, 5, 9, 20, "#aeb5ba"); R(23, 6, 7, 18, "#d5d9dc");
            R(10, 2, 12, 28, "#25292d");
            R(12, 16, 8, 8, "#0d1012"); R(13, 18, 6, 4, "#e52d25");
            R(14, 18, 4, 1, "#ff8a7f");
          }
          else {
            // Tall dark-gray Costco kiosk with angled screen and payment terminal.
            R(3, 7, 26, H - 7, "#3f4449"); R(3, 7, 26, 3, "#686e74");
            R(7, 0, 18, 15, "#171a1d"); R(8, 1, 16, 12, "#b9d8cc");
            R(10, 3, 12, 7, "#d9eee5");
            // Pixel OPEN indicator.
            R(11, 5, 2, 3, "#4b9c72"); R(14, 5, 1, 3, "#4b9c72");
            R(16, 5, 2, 3, "#4b9c72"); R(19, 5, 2, 3, "#4b9c72");
            R(23, 5, 5, 9, "#202429"); R(24, 6, 3, 4, "#648aa0");
            R(11, 17, 10, 8, "#111416"); R(12, 19, 8, 4, "#d92d25");
            R(13, 19, 6, 1, "#ff9188");
            R(3, H - 5, 26, 5, "#292d31");
            // Small cardboard case and black trash bin beside the station.
            R(0, H - 10, 7, 10, "#a77a49"); R(1, H - 8, 5, 2, "#e3d0ad");
            R(27, H - 11, 5, 11, "#17191c"); R(26, H - 12, 7, 2, "#2b2f33");
          }
          break;
        case "P": {
          const prod = PRODUCT_NAMES[v % PRODUCT_NAMES.length];
          if (isTop){ const c2 = pick(["#3f7fbf", "#d9534f", "#f0ad4e", "#5cb85c", "#ece6da", "#7a5ca8", "#b08454"], v); R(1, 1, 30, 30, c2); R(1, 1, 30, 2, shade(c2, 1.3)); R(15, 1, 2, 30, shade(c2, .8)); R(3, 6, 10, 1, "rgba(255,255,255,.45)"); }
          else { PRODUCTS[prod](R, 1, 0, 30, H - 5, v * 7); R(0, H - 5, TS, 5, "#a37a4c"); R(0, H - 4, TS, 1, "#7d5a34"); R(5, H - 3, 5, 2, "#3a2a1a"); R(21, H - 3, 5, 2, "#3a2a1a"); R(4, 3, 6, 1, "rgba(255,255,255,.5)"); }
          break;
        }
        case "L":
          if (isTop){
            R(0, 0, TS, TS, "#3a3f48"); R(1, 1, 30, 30, "#6b5a48");
            const cl = ["#3f5f8a", "#c0392b", "#2b8a74", "#e8c341", "#ece6da", "#6a4c93", "#2d3447", "#d9a0b0"];
            for (let x = 2; x < 30; x += 7) for (let y = 2; y < 30; y += 9){ const c2 = pick(cl, v * 13 + x + y * 5); R(x, y, 6, 8, c2); R(x, y + 3, 6, 1, shade(c2, .8)); R(x, y, 6, 1, shade(c2, 1.3)); }
          } else { R(0, 0, TS, H, "#2c2f36"); R(0, 0, TS, 2, "#4a4036"); R(2, H - 3, 2, 3, "#1a1b1f"); R(28, H - 3, 2, 3, "#1a1b1f"); }
          break;
        case "Y":
          if (isTop){ R(0, 0, TS, TS, "#5a2e52"); R(0, 0, TS, 2, "#e2742c"); }
          else { R(0, 0, TS, H, "#3a1f36"); PRODUCTS.chips(R, 1, 2, 30, 16, v * 3 + 1); R(0, 18, TS, 2, "#e2742c"); PRODUCTS.chips(R, 1, 21, 30, 15, v * 5 + 2); R(0, H - 4, TS, 4, "#1e1020"); }
          break;
        case "B":
          if (isTop){
            R(0, 0, TS, TS, "#7a4e2a"); R(2, 2, 28, 28, "#5a3820");
            const col = pick(["#5cb85c", "#d9534f", "#f2c94c", "#f08a32", "#8e44ad", "#a3c94a"], v);
            for (let x = 3; x < 28; x += 5) for (let y = 3; y < 28; y += 5){ R(x, y, 4, 4, col); R(x, y, 2, 1, shade(col, 1.5)); R(x + 3, y + 3, 1, 1, shade(col, .6)); }
          } else { R(0, 0, TS, H, "#8a5a32"); for (let y = 2; y < H; y += 4) R(0, y, TS, 1, "#6b4426"); R(10, 3, 12, 6, "#f4f1e8"); R(12, 5, 8, 1, "#c0392b"); }
          break;
        case "U":
          if (isTop){
            R(0, 0, TS, TS, "#7a4e2a"); R(2, 2, 28, 28, "#5a3820");
            [[3, 3], [16, 4], [5, 16], [17, 17]].forEach(([a, b]) => { R(a, b + 1, 11, 9, "#e86f1c"); R(a + 1, b, 9, 11, "#e86f1c"); R(a + 5, b + 1, 1, 9, "#b8510f"); R(a + 2, b + 2, 2, 2, "#ff9a4a"); R(a + 5, b - 1, 2, 2, "#3d6b2e"); });
          } else { R(0, 0, TS, H, "#c46b2a"); R(0, 0, TS, 2, "#e08a4a"); R(0, 8, TS, 3, "#2d2a26"); R(0, H - 3, TS, 3, "#7a3e14"); }
          break;
        case "E":
          if (isTop){ R(0, 0, TS, TS, "#6b717d"); R(0, 0, TS, 2, "#858b97"); R(3, 5, 12, 9, "#1d1f24"); R(4, 6, 10, 7, "#5fa8d3"); R(3, 14, 12, 3, "#b9bfc7"); R(18, 6, 10, 14, "#1d1f24"); R(19, 7, 8, 12, "#7cc0e8"); R(5, 21, 8, 6, "#d9dde3"); }
          else { R(0, 0, TS, H, "#4a505c"); R(0, 0, TS, 2, "#858b97"); R(0, H - 3, TS, 3, "#22252b"); }
          break;
        case "V":
          if (isTop){ R(0, 0, TS, TS, "#16171c"); }
          else {
            R(0, 0, TS, H, "#16171c");
            const sc = pick(["#2a6f97", "#2b8a74", "#6a4c93", "#c46b4a", "#3f7fbf"], v);
            R(2, 4, 28, 18, "#0b0c0e"); R(3, 5, 26, 16, sc); R(3, 15, 26, 6, shade(sc, .7)); R(3, 5, 26, 3, shade(sc, 1.4));
            R(2, 25, 28, 16, "#0b0c0e"); R(3, 26, 26, 14, pick(["#e2742c", "#3a8a4a", "#2c5ea8", "#c0392b"], v + 3)); R(3, 26, 26, 3, "rgba(255,255,255,.3)");
          }
          break;
        case "O":
          if (isTop){ R(0, 0, TS, TS, "#9aa1ab"); R(0, 0, TS, 2, "#c3c8cf"); R(4, 10, 24, 12, "#7d848f"); }
          else {
            R(0, 0, TS, H, "#8f95a0"); R(0, 0, TS, 2, "#c3c8cf"); R(3, 5, 26, 20, "#2a1a10"); R(4, 6, 24, 18, "#f08a32"); R(4, 6, 24, 4, "#ffc46b");
            for (let x = 6; x < 26; x += 7){ R(x, 12, 5, 4, "#b4652a"); R(x + 1, 12, 3, 1, "#e0a060"); }
            R(0, H - 5, TS, 5, "#3a3f48");
          }
          break;
        case "N":   // open meat case: packages of steaks, chicken, ground beef
          if (isTop){
            R(0, 0, TS, TS, "#e9edf0"); R(2, 2, 28, 28, "#cfd8de");
            const meat = ["#c0392b", "#d9534f", "#e59a9a", "#b8442a", "#f0c4b0", "#a8322a"];
            for (let y = 3; y < 29; y += 7) for (let x = 3; x < 29; x += 9){
              const m2 = pick(meat, v * 13 + x * 5 + y * 3);
              R(x, y, 8, 6, "#f4f6f8"); R(x + 1, y + 1, 6, 4, m2); R(x + 1, y + 1, 6, 1, shade(m2, 1.3)); R(x + 5, y + 4, 3, 2, "#f2c94c");
            }
          } else {
            // Red wall band and windows into the stainless butcher prep room.
            R(0, 0, TS, H, "#e9ecec"); R(0, 0, TS, 8, "#c82027");
            R(1, 10, 30, 16, "#5d676c"); R(3, 12, 26, 12, "#aebdc0");
            R(4, 13, 11, 10, "#849499"); R(17, 13, 11, 10, "#849499");
            R(15, 11, 2, 14, "#d7dcdd");
            // Prep racks and small butcher silhouettes visible through glass.
            for (let x = 5; x < 28; x += 6){ R(x, 16, 4, 1, "#dce2e3"); R(x, 20, 4, 1, "#dce2e3"); }
            if (v % 3 === 0){ R(20, 14, 3, 5, "#ecebea"); R(20, 13, 3, 2, "#c8322b"); }
            // Long refrigerated meat case with red trim and packaged cuts.
            R(0, 27, TS, 3, "#b8bec1"); R(0, 30, TS, 11, "#d3e0e2");
            R(1, 31, 30, 8, "#9fb3b6");
            for (let x = 2; x < 29; x += 7){ R(x, 32, 6, 5, "#f2f3ef"); R(x + 1, 33, 4, 3, pick(["#b83232", "#d45a58", "#9f292a"], v + x)); }
            R(0, 39, TS, 3, "#c82027"); R(0, H - 4, TS, 4, "#555b60");
          }
          break;
        case "G":   // bakery table: muffins, croissants, bread, pies
          if (isTop){
            R(0, 0, TS, TS, "#5a4436"); R(1, 1, 30, 30, "#8a6a4a");
            const kind = v % 4;
            for (let y = 2; y < 30; y += 9) for (let x = 2; x < 30; x += 10){
              R(x, y, 9, 8, "rgba(255,255,255,.55)");                     // clear clamshell
              if (kind === 0){ R(x + 1, y + 1, 3, 3, "#6b3a1e"); R(x + 5, y + 1, 3, 3, "#c9883e"); R(x + 1, y + 4, 3, 3, "#c9883e"); R(x + 5, y + 4, 3, 3, "#6b3a1e"); }
              else if (kind === 1){ R(x + 1, y + 2, 7, 4, "#d9a04a"); R(x + 2, y + 2, 1, 4, "#b8782a"); R(x + 5, y + 2, 1, 4, "#b8782a"); }
              else if (kind === 2){ R(x + 1, y + 1, 7, 6, "#c98d4e"); R(x + 2, y + 2, 5, 4, "#a0522d"); R(x + 3, y + 3, 3, 1, "#f2c94c"); }
              else { R(x + 1, y + 2, 7, 5, "#e6c08a"); R(x + 1, y + 2, 7, 1, "#c9883e"); R(x + 3, y + 3, 1, 3, "#b8782a"); R(x + 6, y + 3, 1, 3, "#b8782a"); }
              R(x, y, 9, 1, "rgba(255,255,255,.8)");
            }
          } else {
            // Costco's orange beam / green upright bakery worktables with cartons below.
            R(0, 0, TS, 4, "#e76d22"); R(0, 4, TS, 3, "#9a4617");
            R(2, 7, 4, H - 7, "#2f8076"); R(26, 7, 4, H - 7, "#2f8076");
            R(6, 10, 20, 10, "#a87c4e"); R(7, 11, 8, 8, "#c89b68"); R(16, 11, 9, 8, "#b98550");
            R(0, H - 4, TS, 4, "#e76d22");
          }
          break;
        case "H":   // Costco food court: stainless equipment on a long white counter
          if (isTop){
            R(0, 0, TS, TS, "#c3c8cf"); R(0, 0, TS, 2, "#e6e9ed");
            const part = v % 3;
            if (part === 0){       // hot dog roller grill
              R(2, 4, 28, 22, "#3a3f48"); R(3, 5, 26, 20, "#5a606b");
              for (let y = 6; y < 24; y += 4){ R(4, y, 24, 1, "#8f95a0"); R(5 + (y % 8), y - 1, 9, 3, "#b8442a"); R(16 + (y % 6), y - 1, 9, 3, "#c65a3a"); R(6 + (y % 8), y - 1, 6, 1, "#e07a5a"); }
            } else if (part === 1){ // soda fountain + cups
              R(3, 3, 26, 14, "#2c2f36"); R(5, 5, 6, 9, "#c0392b"); R(13, 5, 6, 9, "#2c5ea8"); R(21, 5, 6, 9, "#3a8a4a");
              for (let x = 4; x < 28; x += 7){ R(x, 20, 5, 6, "#f4f4f2"); R(x, 21, 5, 1, "#c0392b"); }
            } else {               // register + napkins
              R(4, 4, 12, 10, "#2c2f36"); R(5, 5, 10, 6, "#5fd0c2"); R(20, 6, 8, 8, "#f4f4f2"); R(20, 18, 8, 6, "#e8c341"); R(22, 20, 4, 2, "#c0392b");
            }
          } else {
            // Bright white service face and stainless ledge from the reference.
            R(0, 0, TS, H, "#eef1f2"); R(0, 0, TS, 4, "#ffffff");
            R(0, 4, TS, 3, "#aeb5bb"); R(0, 7, TS, 1, "#717980");
            R(0, 9, TS, H - 13, "#e4e8ea");
            R(2, 11, TS - 4, 2, "rgba(255,255,255,.8)");
            R(0, H - 4, TS, 4, "#9a7758"); R(0, H - 4, TS, 1, "#c5a486");
          }
          break;
        case "T":
          if (isTop){ R(0, 0, TS, TS, "#cdc9c1"); R(2, 4, 28, 22, "#c0392b"); R(2, 4, 28, 3, "#e0574a"); R(4, 27, 8, 4, "#4a505c"); R(20, 27, 8, 4, "#4a505c"); }
          else { R(2, 0, 28, H, "#8e271d"); R(4, H - 4, 3, 4, "#2c2f36"); R(25, H - 4, 3, 4, "#2c2f36"); }
          break;
      }
    });
    objCache.set(key, img);
    return img;
  }

  // Returns how to draw object tile (tx,ty): { top, front, H } (front only on bottom row)
  function object(c, tx, ty, grid){
    const H = HEIGHT[c] || 0;
    const below = at(grid, tx, ty + 1), above = at(grid, tx, ty - 1);
    const left = at(grid, tx - 1, ty), right = at(grid, tx + 1, ty);
    const bottom = below !== c;
    const v = Math.floor(hash(tx * 131 + ty * 71) * 997);
    if (c === "R"){
      const upL = left !== "R" || tx % 3 === 0, upR = right !== "R";
      const seed = Math.floor(tx / 3) * 7 + ty * 13;
      return {
        H,
        top: rackTop(above !== "R", below !== "R", upL, upR, Math.floor(hash(tx * 17 + ty * 29) * 997)),
        front: bottom ? rackFront(productFor(tx, ty, 0), productFor(tx, ty, 1), upL, upR, seed % 9) : null,
      };
    }
    const variant = c === "P" ? Math.floor(hash(Math.floor(tx / 2) * 19 + Math.floor(ty / 2) * 23) * 997) % 12
                  : c === "H" ? tx % 3
                  : c === "B" || c === "L" ? Math.floor(hash(Math.floor(tx / 2) * 7 + Math.floor(ty / 2) * 5) * 997) % 12
                  : v % 8;
    const flags = c === "C" ? (above !== "C" ? 1 : 0) : 0;
    return { H, top: simpleObj(c, "top", variant, flags), front: bottom ? simpleObj(c, "front", variant, flags) : null };
  }

  // ---------- big props (forklift) ----------
  const PROPS = { forklift: { w: 2, h: 3 }, column: { w: 1, h: 1 }, cartCorral: { w: 8, h: 2 } };
  Object.assign(PROPS, { stoneColumn: { w:1, h:1 }, bollard: { w:1, h:1 }, canopy: { w:18, h:1 }, tireRack: { w:2, h:2 } });
  PROPS.entranceFacade = { w:34, h:1 };
  PROPS.foodCourtFront = { w:14, h:2 };
  PROPS.foodCourtWest = { w:5, h:8 };
  PROPS.membershipCounter = { w:12, h:1 };
  PROPS.checkoutLane = { w:6, h:1 };
  PROPS.merchandiseRun = { w:13, h:20 };
  PROPS.cornerVestibule = { w:10, h:8 };
  PROPS.basketStack = { w:2, h:2 };
  PROPS.selfCheckout = { w:2, h:1 };
  PROPS.majorAppliance = { w:2, h:2 };
  Object.assign(PROPS,{tvDisplay:{w:3,h:1},tvShelf:{w:6,h:1},washerDisplay:{w:2,h:2},jewelryCounter:{w:6,h:1},employeeLocker:{w:1,h:1},opticalCounter:{w:4,h:1},opticalDisplay:{w:1,h:1},hearingDesk:{w:3,h:1},hearingDisplay:{w:1,h:1},foodKioskBank:{w:6,h:1},foodCourtTable:{w:3,h:2}});
  Object.assign(PROPS, { cornerDoor: { w:1, h:1 }, cornerWall: { w:1, h:1 } });
  Object.assign(PROPS, { cornerEntrance: { w:1, h:1 }, cornerExit: { w:1, h:1 } });
  const propCache = new Map();
  function propImage(type, rotation = 0){
    if(rotation === -90){
      const key=type+":north-up";
      if(propCache.has(key)) return propCache.get(key);
      const original=propImage(type);
      if(!original) return null;
      const rotated=canvas(original.height,original.width,g=>{
        g.translate(0,original.width); g.rotate(-Math.PI/2); g.drawImage(original,0,0);
      });
      propCache.set(key,rotated); return rotated;
    }
    if (propCache.has(type)) return propCache.get(type);
    let img = null;
    if(type === "tvShelf"){
      img=canvas(192,96,(g,R)=>{
        R(4,88,184,6,"rgba(0,0,0,.2)");
        // Long horizontal orange warehouse shelf with four televisions.
        R(3,67,186,7,"#d56522");R(3,67,186,2,"#f39a45");
        R(8,74,6,16,"#bd4b18");R(178,74,6,16,"#bd4b18");
        const screens=[{x:7,w:30,h:42},{x:40,w:48,h:55},{x:91,w:35,h:46},{x:129,w:56,h:52}];
        for(const tv of screens){
          const top=64-tv.h;R(tv.x,top,tv.w,tv.h,"#26323c");R(tv.x+3,top+3,tv.w-6,tv.h-8,"#4d91a8");
          const sky=g.createLinearGradient(0,top+4,0,60);sky.addColorStop(0,"#62aac2");sky.addColorStop(1,"#d0e8dc");
          g.fillStyle=sky;g.fillRect(tv.x+4,top+4,tv.w-8,tv.h-10);
          g.fillStyle="#719b83";g.beginPath();g.moveTo(tv.x+4,top+tv.h-6);g.lineTo(tv.x+tv.w*.35,top+tv.h*.55);g.lineTo(tv.x+tv.w*.6,top+tv.h-12);g.lineTo(tv.x+tv.w-4,top+tv.h*.62);g.lineTo(tv.x+tv.w-4,top+tv.h-6);g.fill();
          R(tv.x+Math.floor(tv.w/2)-2,64,4,5,"#414b52");R(tv.x+Math.floor(tv.w/2)-8,68,16,3,"#535e64");
        }
        R(3,74,186,4,"#65736f");
      });
    }
    if(type === "foodKioskBank"){
      img=canvas(192,82,(g,R)=>{
        R(4,76,184,5,"rgba(0,0,0,.2)");R(5,72,182,7,"#69757a");
        R(4,34,184,5,"#59646a");
        for(let i=0;i<6;i++){
          const x=i*32;
          R(x+8,34,17,40,"#3d474d");R(x+5,4,23,34,"#20292e");
          R(x+8,7,17,26,"#dcecea");R(x+10,9,13,5,"#c52b32");
          R(x+11,11,11,1,"#ffffff");R(x+10,17,6,6,"#d8a24c");
          R(x+18,17,5,6,"#ca4a37");R(x+10,27,13,3,"#315b91");
        }
      });
    }
    if(type === "foodCourtTable"){
      img=canvas(96,78,(g,R)=>{
        R(8,70,80,6,"rgba(0,0,0,.18)");
        R(23,29,50,27,"#e8e7e1");R(25,30,46,4,"#ffffff");
        R(29,56,6,14,"#707a7e");R(61,56,6,14,"#707a7e");
        // Exactly four single-person red chairs: north, south, west and east.
        R(38,13,20,11,"#c72c31");R(41,24,14,5,"#7a2025");
        R(38,61,20,10,"#c72c31");R(41,56,14,5,"#7a2025");
        R(7,36,13,20,"#c72c31");R(76,36,13,20,"#c72c31");
        R(39,38,18,8,"#f4f1e8");R(43,40,10,2,"#315b91");
      });
    }
    if(type === "hearingDisplay"){
      img=canvas(32,38,(g,R)=>{
        R(3,33,27,4,"rgba(0,0,0,.18)");R(3,20,27,14,"#8d9698");
        R(5,12,23,11,"#dcebea");R(7,14,19,7,"#f5f3e9");
        R(4,10,25,4,"#a9c4c7");R(8,16,5,3,"#59666b");
        R(19,15,4,5,"#59666b");R(10,17,10,1,"#315c94");R(6,24,21,2,"#c32930");
      });
    }
    if(type === "hearingDesk"){
      img=canvas(96,58,(g,R)=>{
        R(4,51,88,5,"rgba(0,0,0,.18)");
        // Compact red consultation counter with a checkout terminal.
        R(5,31,86,9,"#b51e29");R(5,31,86,3,"#e33b42");
        R(10,40,7,13,"#75151d");R(79,40,7,13,"#75151d");
        R(58,12,27,19,"#30383d");R(61,15,21,13,"#9fc0c5");
        R(68,31,5,6,"#596267");R(62,36,17,3,"#4a5358");
        R(17,26,24,4,"#f3f1e8");R(20,27,11,1,"#315c94");
        R(34,27,5,1,"#c32930");
        R(35,43,26,6,"#687378");R(39,49,18,7,"#4f595d");
      });
    }
    if(type === "opticalDisplay"){
      img=canvas(32,38,(g,R)=>{
        R(3,33,27,4,"rgba(0,0,0,.18)");R(3,20,27,14,"#b51e29");
        R(5,12,23,11,"#dcebea");R(7,14,19,7,"#f5f3e9");
        R(4,10,25,4,"#a9c4c7");R(6,11,21,1,"#ffffff");
        for(const x of [9,19]){g.strokeStyle="#3b4449";g.lineWidth=1;g.strokeRect(x-3,16,6,3);}
        R(12,17,4,1,"#3b4449");R(6,24,21,2,"#e33b42");
      });
    }
    if(type === "opticalCounter"){
      img=canvas(128,50,(g,R)=>{
        R(3,43,122,5,"rgba(0,0,0,.2)");
        R(2,17,124,27,"#a71924");R(2,17,124,4,"#e33b42");
        R(7,22,114,17,"#c82932");R(7,39,114,4,"#78131b");
        R(9,12,110,7,"#f1f1ec");R(9,12,110,2,"#ffffff");
        R(82,4,27,10,"#30383d");R(85,6,21,6,"#8fb5be");
        R(91,14,4,5,"#596267");R(18,26,39,7,"#f5f2e8");
        R(21,28,16,2,"#2d5a91");R(40,28,14,2,"#ffffff");
      });
    }
    if(type === "employeeLocker"){
      img=canvas(32,54,(g,R)=>{
        // One compact square gray locker; map placement forms the full row.
        R(3,49,27,4,"rgba(0,0,0,.18)");R(3,19,27,31,"#81898c");
        R(5,21,23,27,"#aeb4b4");R(5,21,23,3,"#c7ccca");
        R(10,27,13,1,"#747d80");R(10,30,13,1,"#747d80");
        R(23,35,2,6,"#60696c");R(24,36,1,2,"#e1e3df");
      });
    }
    if(["tvDisplay","washerDisplay","jewelryCounter"].includes(type)){
      const w=type==="tvDisplay"?96:type==="washerDisplay"?64:192;
      img=canvas(w,88,g=>{
        const round=(x,y,ww,h,r,c)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,ww,h,r);g.fill();};
        const steel=g.createLinearGradient(0,0,w,0);steel.addColorStop(0,"#869295");steel.addColorStop(.4,"#edf0e8");steel.addColorStop(1,"#a0acae");
        round(3,79,w-6,7,3,"rgba(0,0,0,.18)");
        if(type==="tvDisplay"){
          round(5,58,86,23,4,steel);round(41,40,14,23,3,"#333e47");round(28,58,40,4,2,"#303a42");
          round(2,3,92,51,5,"#27333f");
          const sky=g.createLinearGradient(0,6,0,50);sky.addColorStop(0,"#438ba7");sky.addColorStop(1,"#c0e4da");round(6,7,84,43,2,sky);
          g.fillStyle="#67988b";g.beginPath();g.moveTo(6,50);g.lineTo(31,24);g.lineTo(52,43);g.lineTo(71,30);g.lineTo(90,50);g.fill();
          g.fillStyle="#eff1c3";g.beginPath();g.arc(72,18,6,0,Math.PI*2);g.fill();
        }else if(type==="washerDisplay"){
          round(7,13,50,68,6,"#d9dfdc");round(9,15,46,62,4,"#f2f3ed");round(10,16,44,13,3,steel);
          g.fillStyle="#6e858b";g.beginPath();g.arc(20,22,4,0,Math.PI*2);g.fill();round(33,19,15,5,1,"#3c606a");
          for(const [r,c] of [[18,"#a1b0b2"],[15,"#536d7c"],[12,"#8faeb9"]]){g.fillStyle=c;g.beginPath();g.arc(32,52,r,0,Math.PI*2);g.fill();}
          g.strokeStyle="rgba(255,255,255,.65)";g.lineWidth=2;g.beginPath();g.arc(32,52,11,3.5,5.5);g.stroke();
        }else{
          round(3,47,186,34,5,"#eee5d1");round(5,18,182,34,4,"#b5d0d2");round(8,21,176,27,2,"#e0eeea");
          for(let x=14;x<182;x+=29){round(x,26,22,17,3,"#f7f3e8");g.strokeStyle="#bb9953";g.lineWidth=1.5;g.beginPath();g.ellipse(x+11,34,6,4,0,0,Math.PI*2);g.stroke();}
          round(3,47,186,4,2,steel);for(const x of [64,128])round(x,19,2,60,1,"#a5b8b6");
          round(8,72,176,3,1,"#c4b89e");
        }
      });
    }
    if(type === "selfCheckout" || type === "majorAppliance"){
      img=canvas(64,type==="selfCheckout"?100:104,g=>{
        const round=(x,y,w,h,r,color)=>{g.fillStyle=color;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
        const metal=g.createLinearGradient(0,0,64,0);metal.addColorStop(0,"#747f85");metal.addColorStop(.35,"#d3d9d8");metal.addColorStop(.7,"#a2adae");metal.addColorStop(1,"#67747b");
        if(type==="selfCheckout"){
          round(3,90,58,8,4,"rgba(0,0,0,.2)");
          round(8,49,43,44,6,"#4f5b61");round(10,52,38,38,4,"#606e74");
          round(4,43,52,14,5,metal);round(10,46,24,7,3,"#303e44");
          round(15,48,14,2,1,"#de4b4f");
          round(23,18,6,27,2,"#7e8b8e");
          round(8,6,39,29,5,"#26343d");round(11,9,33,22,3,"#cae6db");
          g.font="italic 10px Arial";g.textAlign="center";g.fillStyle="#43846b";g.fillText("Open",27,24);
          round(46,26,13,20,3,"#293a44");round(48,29,9,7,2,"#93b9c6");
          for(let y=39;y<44;y+=2)round(49,y,7,1,.5,"#d5dbd5");
          round(48,64,14,5,2,metal);round(14,74,23,2,1,"#36444b");
        }else{
          round(3,94,58,7,3,"rgba(0,0,0,.18)");
          round(5,9,27,87,4,metal);round(7,11,23,23,2,"#dce0db");
          round(8,37,21,55,2,"#bdc8c7");round(26,42,2,21,1,"#f3f4ed");round(26,17,2,11,1,"#f3f4ed");
          round(35,49,26,47,4,"#eceee8");round(38,52,20,7,2,"#c5ccca");
          g.fillStyle="#687c85";g.beginPath();g.arc(48,76,10,0,Math.PI*2);g.fill();
          g.fillStyle="#a4c2cb";g.beginPath();g.arc(48,76,7,0,Math.PI*2);g.fill();
          round(39,53,4,4,2,"#798b90");round(49,54,7,2,1,"#637f83");
        }
      });
    }
    if(type === "cornerVestibule"){
      img=canvas(288,352,(g)=>{
        // One uninterrupted diagonal frontage, rather than rotated tile sprites.
        const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
        // Endpoints meet the east and south wall caps exactly. Vertical scale
        // matches the surrounding low cutaway walls, not a towering billboard.
        g.save();g.transform(1,-1,0,.4,0,352);
        const wall=g.createLinearGradient(0,-135,0,0);
        wall.addColorStop(0,"#dfcfb3");wall.addColorStop(.6,"#bdaa8d");wall.addColorStop(1,"#8b8272");
        rect(0,-135,256,135,wall);
        g.strokeStyle="rgba(246,236,215,.28)";g.lineWidth=.6;
        for(let y=-130;y<0;y+=10){
          g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke();
          for(let x=(Math.round(y/10)%2)*12;x<256;x+=24){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+10);g.stroke();}
        }
        rect(0,-36,256,8,"#8b725b");rect(0,-22,256,22,"#656a64");
        for(const [x,label] of [[35,"ENTRANCE"],[153,"EXIT"]]){
          rect(x-3,-84,68,84,"#c1c2b7");
          const recess=g.createLinearGradient(x,-80,x+62,0);
          recess.addColorStop(0,"#111b20");recess.addColorStop(1,"#35423b");
          rect(x,-80,62,80,recess);
          for(let y=-80;y<-68;y+=2) rect(x,y,62,1,"#858f89");
          for(let i=0;i<5;i++){
            rect(x+10+i*3,-61+i*9,3,1.6,"#f9f3d6");
            rect(x+49-i*3,-61+i*9,3,1.6,"#f9f3d6");
          }
          rect(x,-4,62,4,"#a2a497");
          rect(x+8,-100,46,12,"#f8f3e5");
          g.textAlign="center";g.font="bold 8px Arial";g.fillStyle="#a82b31";g.fillText(label,x+31,-91);
        }
        rect(110,-76,30,40,"#eeeade");
        g.font="bold 4px Arial";g.fillStyle="#5a5b52";g.fillText("MEMBERS ONLY",125,-68);
        for(let y=-63;y<-42;y+=4) rect(115,y,20,1,"#a3a397");
        // White ribbed upper signboard spans BOTH doorways.
        const panel=g.createLinearGradient(0,-215,0,-135);
        panel.addColorStop(0,"#fffef5");panel.addColorStop(1,"#d3d8cf");
        rect(0,-215,256,80,panel);
        for(let x=4;x<256;x+=7) rect(x,-215,.6,80,"rgba(80,93,86,.2)");
        g.font="bold italic 31px Arial";g.fillStyle="#cd3038";g.fillText("COSTCO",128,-178);
        g.font="bold italic 14px Arial";g.fillStyle="#2a548c";g.fillText("WHOLESALE",142,-155);
        for(let y=-165;y<-152;y+=4) rect(45,y,33,2,"#2a548c");
        // Continuous canopy edge and slim supporting stone piers.
        rect(0,-137,256,5,"#a53439");rect(0,-132,256,6,"#645f51");
        for(const x of [4,241]){
          rect(x,-135,11,135,"#d2c2a5");rect(x+9,-135,3,135,"#a99b81");
          for(let y=-130;y<0;y+=13) rect(x,y,11,.7,"#e6d9bf");
          rect(x-2,-5,16,5,"#a8a99d");
        }
        for(const x of [22,130,226]){
          rect(x,-126,9,2,"#f9f5d9");
          const glow=g.createLinearGradient(0,-124,0,-96);glow.addColorStop(0,"rgba(255,246,202,.17)");glow.addColorStop(1,"rgba(255,246,202,0)");rect(x-5,-124,19,28,glow);
        }
        g.restore();
      });
    }
    if (type === "merchandiseRun"){
      img=canvas(416,680,(g)=>{
        // A single connected fixture, sheared to follow the corner approach.
        g.translate(4,40); g.transform(1,0,.55,1,0,0);
        const box=(x,y,w,h,r,c)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
        box(4,3,35,636,5,"rgba(0,0,0,.18)");
        const steel=g.createLinearGradient(0,0,32,0);
        steel.addColorStop(0,"#66746e");steel.addColorStop(.3,"#b0b9ad");steel.addColorStop(1,"#3d4945");
        box(0,0,32,636,4,steel);
        box(3,3,26,630,3,"#333c39");
        const colors=["#e8dfc6","#b74534","#356d8c","#e4be53","#6b9250","#f1eee0"];
        for(let bay=0;bay<10;bay++){
          for(let shelf=0;shelf<2;shelf++) for(let item=0;item<4;item++){
            const y=bay*63+5+item*14;
            const x=4+shelf*13;
            box(x,y,11,12,2,colors[(bay+shelf+item)%colors.length]);
            box(x+2,y+3,7,3,1,"rgba(255,255,255,.65)");
          }
          box(0,bay*63,32,3,1,"#418579");
          box(1,bay*63+2,2,3,1,"#8ab2a1");
        }
        for(const x of [0,15,29]){
          const beam=g.createLinearGradient(x,0,x+3,0);
          beam.addColorStop(0,"#f6a453");beam.addColorStop(1,"#c85820");
          box(x,0,3,636,1.5,beam);
        }
        box(0,633,32,3,1,"#418579");
      });
    }
    if (type === "checkoutLane"){
      img=canvas(192,76,(g,R)=>{
        const rounded=(x,y,w,h,r,col)=>{g.fillStyle=col;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
        rounded(4,62,184,10,5,"rgba(0,0,0,.23)");
        rounded(8,35,174,30,7,"#434c53");
        R(16,45,158,15,"#242b30");
        for(const x of [20,51,82]){R(x,48,25,12,"#28578e");R(x+3,50,19,3,"#cbdce3");}
        R(16,60,7,9,"#22282c");R(165,60,7,9,"#22282c");
        const steel=g.createLinearGradient(0,19,0,44);
        steel.addColorStop(0,"#eff2ef");steel.addColorStop(.45,"#aab5ba");steel.addColorStop(1,"#68767e");
        rounded(3,19,185,26,10,steel);
        rounded(9,23,113,17,7,"#171e22");
        R(15,25,100,1,"#424c51");
        for(let x=24;x<116;x+=12) R(x,27,1,10,"#2e383e");
        // Scanner window and rounded packing shelf at the cashier end.
        rounded(125,23,23,17,3,"#283137");R(128,26,17,10,"#742b30");R(130,29,13,2,"#f25c51");
        rounded(151,23,31,16,5,"#d4dddf");
        R(140,6,4,18,"#58646c");
        rounded(127,0,31,18,3,"#232b31");R(130,3,25,11,"#80b9c6");R(132,5,12,2,"#cee7e9");
        rounded(166,7,16,17,3,"#222c32");R(169,9,10,6,"#89a5b6");
        R(171,17,2,2,"#55ad77");R(175,17,2,2,"#ce6456");
        R(6,39,180,3,"#ae2830");
      });
    } else if (type === "foodCourtWest"){
      // Rotate the complete counter artwork clockwise: its service edge faces left.
      const original=propImage("foodCourtFront");
      img=canvas(160,256,(g) => {
        g.translate(140,0); g.rotate(Math.PI/2); g.drawImage(original,0,0,256,140);
      });
    } else if (type === "forklift"){
      img = canvas(64, 120, (g, R) => {
        // drawn in 3/4 view, facing up; image bottom sits on the prop's bottom edge
        R(6, 104, 54, 10, "rgba(0,0,0,.2)");
        R(12, 0, 7, 44, "#7d838f"); R(44, 0, 7, 44, "#7d838f"); R(12, 0, 7, 2, "#b9bfc7"); R(44, 0, 7, 2, "#b9bfc7");      // forks
        R(6, 30, 52, 10, "#3a3f48"); R(6, 30, 52, 2, "#59606d"); R(10, 4, 4, 30, "#3a3f48"); R(50, 4, 4, 30, "#3a3f48"); // mast
        R(4, 40, 56, 62, "#f2b33d"); R(4, 40, 56, 5, "#ffd27a"); R(4, 95, 56, 7, "#c68a1f");                              // body
        R(10, 48, 44, 34, "#22252b"); R(14, 52, 36, 26, "#30343c"); R(22, 60, 20, 16, "#16171c"); R(24, 62, 16, 4, "#3a3f48"); // cage + seat
        R(10, 48, 4, 34, "#3a3f48"); R(50, 48, 4, 34, "#3a3f48");
        R(8, 84, 48, 12, "#d39a2a"); R(28, 42, 8, 3, "#ff6a3a");
        R(0, 44, 6, 16, "#111"); R(58, 44, 6, 16, "#111"); R(0, 82, 6, 16, "#111"); R(58, 82, 6, 16, "#111");             // wheels
        R(4, 102, 56, 12, "#c68a1f"); R(4, 112, 56, 2, "#7a5410");                                                         // front face
      });
    } else if (type === "column"){
      img = canvas(32, 104, (g, R) => {
        R(8, 98, 18, 4, "rgba(0,0,0,.16)");
        R(11, 16, 12, 82, "#e9edef"); R(11, 16, 3, 82, "#ffffff"); R(21, 16, 2, 82, "#bcc4c8");
        R(8, 12, 18, 6, "#f4f6f7"); R(10, 18, 14, 3, "#cbd1d4");
        // Bright hanging warehouse lamp.
        R(5, 5, 24, 8, "#f5f2df"); R(8, 2, 18, 5, "#ffffff"); R(11, 0, 12, 3, "#b8c0c4");
        R(2, 13, 28, 2, "rgba(255,255,230,.28)");
      });
    } else if (type === "membershipCounter"){
      img = canvas(384, 120, (g, R) => {
        // White partition behind the desk, as in the membership reference.
        R(0,0,384,84,"#e8e9e4"); R(0,0,384,3,"#cbbd9b");
        for(let x=4;x<384;x+=48) R(x,4,1,77,"#d5d9d5");
        // Large red wall board, with small membership-card panels.
        R(96,6,192,40,"#bd1830"); R(96,6,192,3,"#e3414b");
        g.textAlign="center"; g.textBaseline="middle";
        g.font="bold 21px Arial, sans-serif"; g.fillStyle="#ffffff"; g.fillText("MEMBERSHIP",192,19);
        for(let x=111;x<280;x+=41){
          R(x,31,32,10,x%2?"#f8f6e9":"#30343b");
          R(x+3,33,16,2,"#c32930"); R(x+3,37,25,1,"#64788e");
        }
        // Multiple terminals, receipt printers and card readers.
        for(const x of [30,108,204,294]){
          R(x,64,24,17,"#272e33"); R(x+2,66,20,11,"#7f9da6");
          R(x+10,80,4,6,"#555f65"); R(x+5,85,15,2,"#343d43");
          R(x+28,78,11,9,"#424a4e"); R(x+30,76,7,4,"#f9f8ef");
        }
        // White wraparound desk, red countertop edge and horizontal gray bands.
        R(0,87,384,5,"#c12835"); R(0,92,384,28,"#f5f5ef");
        R(0,100,384,4,"#adb5b6"); R(0,113,384,4,"#a2abad");
        for(let x=0;x<384;x+=64) R(x,92,1,28,"#d0d5d2");
        R(0,118,384,2,"#737f82");
        R(0,92,4,28,"#d6dcd9"); R(380,92,4,28,"#b6c0be");
      });
    } else if (["cornerDoor","cornerWall","cornerEntrance","cornerExit"].includes(type)){
      img = canvas(32, 144, (g, R) => {
        // Narrow modules follow the diagonal corner instead of a flat facade.
        const metal=g.createLinearGradient(0,0,32,0);
        metal.addColorStop(0,"#bfc4c0"); metal.addColorStop(.4,"#f7f6ef"); metal.addColorStop(1,"#d6d9d4");
        g.fillStyle=metal; g.fillRect(0,0,32,76);
        for(let x=2;x<32;x+=6){ R(x,0,1,76,"#bec3c1"); R(x+1,0,1,76,"#ffffff"); }
        // Covered vestibule: red steel truss, shaded soffit and a downlight.
        R(0,64,32,2,"#b72e36");R(0,76,32,3,"#a62831");
        g.strokeStyle="#c84349";g.lineWidth=2;g.beginPath();g.moveTo(0,76);g.lineTo(16,65);g.lineTo(32,76);g.stroke();
        R(0,79,32,6,"#746957");
        R(12,80,8,2,"#f9f4da");
        if(type !== "cornerWall"){
          const recess=g.createLinearGradient(0,85,0,144);
          recess.addColorStop(0,"#10191d"); recess.addColorStop(1,"#414b47");
          g.fillStyle=recess; g.fillRect(0,85,32,59); R(0,86,32,4,"#858880");
          R(1,91,2,53,"#a0a49e"); R(29,91,2,53,"#7f8783");
          // Rolled-up overhead shutter, deep interior and receding ceiling lights.
          for(let y=86;y<94;y+=2) R(3,y,26,1,"#b4b7b0");
          for(let i=0;i<4;i++){
            R(8+i*2,99+i*7,3,1,"#f7f2d9");
            R(22-i*2,99+i*7,3,1,"#f7f2d9");
          }
          R(5,100,1,33,"rgba(219,236,230,.17)");
          R(7,105,20,1,"rgba(208,218,206,.14)");
          // Deep doorway shadow and threshold, while the ground tile stays walkable.
          R(3,138,26,6,"#414644");
          if(type === "cornerEntrance" || type === "cornerExit"){
            R(1,77,30,8,"#faf4e7");
            g.textAlign="center";g.textBaseline="middle";
            g.font="bold 5px Arial";g.fillStyle="#a9232c";
            g.fillText(type === "cornerEntrance" ? "ENTRANCE" : "EXIT",16,81);
          }
        } else {
          R(0,85,32,59,"#c8b294");
          for(let y=88;y<144;y+=10) for(let x=0;x<32;x+=16){ R(x,y,15,9,"#d1bfa3"); R(x,y,15,1,"#e0d0b6"); }
          R(0,114,32,7,"#84654b");
          R(0,127,32,17,"#666b68");
          // Membership-hours notice mounted on masonry between the doorways.
          R(5,96,22,28,"#f6f1e6");R(6,97,20,2,"#a93437");
          g.textAlign="center";g.font="bold 3px Arial";g.fillStyle="#515954";
          g.fillText("MEMBERS ONLY",16,103);
          for(let y=106;y<120;y+=3) R(8,y,16,1,"#9b9d92");
        }
        // Red canopy framing and small downlight.
        R(0,80,32,3,"#c3353c"); R(12,85,8,3,"#f8f3d9");
        R(0,88,32,8,"rgba(0,0,0,.15)");
      });
    } else if (type === "foodCourtFront"){
      img = canvas(448, 140, (g, R) => {
        R(0,0,448,140,"#e8e8e1"); R(0,0,448,4,"#ffffff");
        // Continuous red-bordered photographic-style menu panels.
        const names=["PIZZA","CHICKEN BAKE","SANDWICH","HOT DOG + SODA","SALAD","DRINKS"];
        const prices=["1.99","3.99","6.99","1.50","6.99","SODA"];
        g.textAlign="center"; g.textBaseline="middle";
        for(let i=0;i<6;i++){
          const x=4+i*73;
          R(x,6,70,64,"#ae302b"); R(x+2,8,66,60,"#faf9f1");
          R(x+4,10,62,33,"#63472f");
          R(x+11,19,48,16,"#d9a35d"); R(x+15,23,40,7,i===3?"#a43827":"#ae6b34");
          if(i===0){ for(let k=0;k<5;k++) R(x+16+k*8,22+(k%2)*5,4,4,"#ba3228"); }
          if(i===3){ R(x+5,13,9,25,"#285493"); R(x+6,15,7,3,"#f5f5f0"); }
          R(x+17,11,37,6,"#242527");
          g.font="bold 5px Arial"; g.fillStyle="#ffffff"; g.fillText("KIRKLAND",x+35,14);
          g.font="bold 6px Arial"; g.fillStyle="#24282d"; g.fillText(names[i],x+35,48);
          g.font="bold 14px Arial"; g.fillStyle="#244979"; g.fillText(prices[i],x+35,60);
        }
        // Service windows, stainless kitchen and pickup ledge.
        for(const x of [6,106,206]){
          R(x,76,90,38,"#929a98"); R(x+4,78,82,30,"#3c4443");
          for(let y=83;y<108;y+=8) R(x+8,y,72,2,"#aeb8b7");
          R(x+10,92,24,7,"#c89151"); R(x+42,92,24,7,"#c89151");
        }
        R(169,73,90,12,"#ffffff"); g.font="bold 7px Arial"; g.fillStyle="#a82d28"; g.fillText("ORDER PICK-UP",214,79);
        // Soda dispensers at the right end.
        R(321,77,119,38,"#232b31");
        for(let x=326;x<435;x+=18){ R(x,80,13,15,"#28568d"); R(x+2,84,9,3,"#ffffff"); R(x+4,97,5,8,"#afb8bd"); }
        R(0,114,448,6,"#c3cbcd"); R(0,114,448,2,"#ffffff");
        R(0,120,448,16,"#f3f3ed"); R(0,136,448,4,"#9c8c75");
        R(0,128,448,2,"#d4d8d6");
      });
    } else if (type === "entranceFacade"){
      img = canvas(1088, 160, (g, R) => {
        // Tan block masonry with the brown horizontal band in the reference.
        R(0,0,1088,160,"#c5b397");
        for(let y=0;y<160;y+=12) for(let x=(y/12%2)*16;x<1088;x+=32){
          R(x,y,31,11,pick(["#c7b69d","#d3c1a6","#beac91"],x+y));
          R(x,y,31,1,"#e0d0b7");
        }
        R(0,116,1088,8,"#82644a"); R(0,0,1088,5,"#c32b32");
        // Deep shaded door recesses: five tiles wide and aligned with map openings.
        for(const x of [224,704]){
          R(x,104,160,56,"#24282a"); R(x+3,107,154,4,"#777b78");
          R(x+3,112,5,48,"#9b9f9c"); R(x+152,112,5,48,"#9b9f9c");
        }
        // Ribbed white central facade panel above the door openings.
        R(192,0,704,99,"#eceeeb");
        for(let x=196;x<896;x+=12){ R(x,2,1,93,"#bfc4c2"); R(x+2,2,1,93,"#ffffff"); }
        R(192,96,704,6,"#74756d");
        g.textAlign="center"; g.textBaseline="middle";
        g.font="bold italic 48px Arial, sans-serif"; g.fillStyle="#cc2830"; g.fillText("COSTCO",544,38);
        g.font="bold italic 22px Arial, sans-serif"; g.fillStyle="#28528c"; g.fillText("WHOLESALE",565,73);
        for(let y=65;y<79;y+=5) R(407,y,52,3,"#28528c");
        // Small red-on-white signs fixed above the entrance and exit.
        g.font="bold 12px Arial, sans-serif";
        for(const [label,x] of [["ENTRANCE",304],["EXIT",784]]){
          R(x-45,91,90,15,"#eee7d8"); g.fillStyle="#a9242c"; g.fillText(label,x,99);
        }
        R(475,110,86,41,"#ece8dd");
        g.font="bold 8px Arial, sans-serif"; g.fillStyle="#354044";
        g.fillText("MEMBERS ONLY",518,120); g.fillText("WAREHOUSE HOURS",518,132);
        R(485,140,66,2,"#a5a399");
      });
    } else if (type === "stoneColumn"){
      img = canvas(32, 112, (g, R) => {
        R(2, 102, 28, 8, "rgba(0,0,0,.2)"); R(4, 4, 24, 100, "#b8a185");
        for(let y=8;y<100;y+=12) for(let x=4;x<28;x+=12){
          R(x,y,11,10,pick(["#c8b49a","#ddcbb2","#b9a58b"],x+y));
          R(x,y,11,2,"#e7d8c2");
        }
        R(2,0,28,7,"#e3d0b5"); R(2,100,28,5,"#a18d73");
        // Fine limestone grain, mortar and a sunlit face with a shaded return.
        for(let i=0;i<220;i++){
          R(5+Math.floor(hash(i*13)*22),8+Math.floor(hash(i*17)*89),1,1,i%2?"rgba(255,250,230,.23)":"rgba(85,65,43,.12)");
        }
        R(4,7,2,93,"rgba(255,248,220,.4)"); R(24,7,4,93,"rgba(80,57,34,.24)");
        R(9,27,14,7,"#554c40"); R(10,28,12,4,"#c8c5ab");
      });
    } else if (type === "bollard"){
      img = canvas(32, 44, (g, R) => {
        R(9,37,18,5,"rgba(0,0,0,.2)"); R(11,6,10,33,"#bd202a");
        R(13,3,6,5,"#d63840"); R(12,7,3,29,"#ed5961"); R(19,8,2,29,"#8f1520");
      });
    } else if (type === "canopy"){
      img = canvas(576, 100, (g, R) => {
        R(0,28,576,44,"#d8d4c9"); R(0,28,576,5,"#f6f2e8");
        for(let x=0;x<576;x+=32) R(x,34,1,36,"#b4b2aa");
        R(0,72,576,6,"#a5252c"); R(0,78,576,4,"#762129");
        // Red triangular steel braces under the canopy edge.
        for(let x=0;x<576;x+=96){
          R(x,82,96,4,"#bf3540");
          for(let i=0;i<44;i+=4){ R(x+i,82-i/2,5,3,"#bd303a"); R(x+88-i,82-i/2,5,3,"#bd303a"); }
        }
      });
    } else if (type === "tireRack"){
      img = canvas(64, 104, (g, R) => {
        R(1,8,4,94,"#39766e"); R(59,8,4,94,"#39766e");
        for(const y of [14,48,82]){
          for(const x of [9,32]){
            R(x,y,20,28,"#171b1e"); R(x+3,y+2,14,24,"#30363b"); R(x+7,y+6,6,16,"#111416");
            for(let yy=y+3;yy<y+26;yy+=5) R(x+1,yy,2,2,"#4d555b");
          }
          R(0,y+28,64,4,"#e77b2b");
        }
      });
    } else if (type === "basketStack"){
      img=canvas(64,80,g=>{
        const rounded=(x,y,w,h,r,c)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
        rounded(6,68,52,8,4,"rgba(0,0,0,.18)");
        for(let i=5;i>=0;i--){
          const y=14+i*8;
          rounded(9,y,46,25,5,"#ae2c35");
          rounded(7,y,50,5,2,"#e45a5d");
          for(let x=15;x<51;x+=7) rounded(x,y+8,3,12,1,"#78252d");
        }
        g.strokeStyle="#4e585b";g.lineWidth=3;g.beginPath();g.roundRect(14,4,36,20,6);g.stroke();
      });
    } else if (type === "cartCorral"){
      img = canvas(256, 92, (g, R) => {
        R(5, 82, 246, 6, "rgba(0,0,0,.16)");
        // Galvanized rails surrounding tightly nested Costco carts.
        R(2, 10, 4, 72, "#aeb8bd"); R(250, 10, 4, 72, "#aeb8bd");
        R(2, 10, 252, 3, "#e5eaec");
        for (let x = 8; x < 246; x += 17){
          R(x, 20, 15, 42, "#69747a"); R(x + 2, 23, 11, 2, "#c5ced2");
          for (let y = 28; y < 58; y += 7) R(x + 2, y, 11, 1, "#aeb8bd");
          R(x, 17, 15, 5, "#c5272f"); R(x + 2, 18, 11, 2, "#ee4950");
          R(x + 1, 62, 2, 14, "#778187"); R(x + 12, 62, 2, 14, "#778187");
          R(x - 1, 75, 5, 5, "#23272a"); R(x + 11, 75, 5, 5, "#23272a");
        }
      });
    }
    propCache.set(type, img);
    return img;
  }

  // Colors for the small overview map.
  const MINI = { "~":"#2e3035", ".":"#cdc9c1", S:"#bccad0", M:"#2f3238", X:"#a39f97", W:"#4a505c", R:"#2f5687", P:"#b08454",
    C:"#22252b", Q:"#5fd0c2", K:"#b9bfc7", I:"#d51f2a", J:"#e6a13c", A:"#f4f5f2", F:"#9fd1e6", O:"#f08a32", T:"#c0392b", V:"#16171c", E:"#6b717d", B:"#5cb85c",
    U:"#e86f1c", D:"#8fb6c9", L:"#d6aabe", Y:"#e650a0", N:"#d9534f", G:"#c9883e", H:"#b3261e" };
  Object.assign(MINI, { s:"#d0e0e3", t:"#ffffff", d:"#b69b76", p:"#aebdc1", f:"#c2ccd0" });
  MINI.a = "#d8d4ca";
  MINI.q="#83b9aa";MINI.e="#a9bdc4";

  return { SOLID, LEGEND, HEIGHT, PROPS, hash, shade, floor, object, propImage, MINI };
})();
