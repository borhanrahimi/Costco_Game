// maps/warehouse.js — Costco warehouse layout (follows design/warehouse-map.drawio.png)
// PERSONALIZE IT:
//   1. Change W and H to resize the whole map.
//   2. Move/add departments in the clearly named sections below.
//   3. Use fill(x, y, width, height, "R") for a block or
//      hline/vline for a shelf. Tile letters are listed in README.md.
//   4. Move a person in their file under www/characters/.
// Coordinates start at x:0, y:0 in the top-left. Each tile is one square.
//
// How a real Costco is laid out (and how this map copies it):
//   - Back wall: bakery, meat, dairy cooler and deli, with production rooms behind.
//   - Sides: long runs of tall orange pallet racking (dry grocery, paper, freezers).
//   - Middle: "treasure hunt" tables — seasonal, clothing, coolers, candy.
//   - Wide "racetrack" main walkways connect everything.
//   - Front: TVs right by the entrance, then checkouts, membership, food court,
//     pharmacy / optical / hearing aids, and the tire center outside.

(() => {
  // Costco #693 — Sonterra Park, 1201 N Loop 1604 E, San Antonio.
  // Trimmed to the occupied footprint: no department is moved or removed.
  const W = 94, H = 135;
  const map = Array.from({ length: H }, () => Array(W).fill("~"));
  const fill = (x, y, w, h, tile = ".") => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx >= 0 && yy >= 0 && xx < W && yy < H) map[yy][xx] = tile;
    }
  };
  const hline = (x, y, w, tile) => fill(x, y, w, 1, tile);
  const vline = (x, y, h, tile) => fill(x, y, 1, h, tile);
  const room = (x, y, w, h, floor = ".") => {
    fill(x, y, w, h, floor);
    hline(x, y, w, "W"); hline(x, y + h - 1, w, "W");
    vline(x, y, h, "W"); vline(x + w - 1, y, h, "W");
  };

  // ------------------------------------------------------------ BUILDING
  // L-shaped box: the back-left corner is cut out (truck yard), like the drawing.
  fill(3, 20, 90, 102, "W"); fill(22, 1, 71, 20, "W");     // outer walls
  fill(4, 21, 88, 100, "."); fill(23, 2, 69, 19, ".");     // sales floor

  // ------------------------------------------------------------ RECEIVING / LOADING DOCK
  room(22, 1, 42, 15, "X");
  for (const x of [26, 32, 38, 44, 50, 56]) hline(x, 1, 2, "D");   // dock doors
  fill(63, 9, 1, 4, "X");                                       // to the sales floor
  fill(30, 15, 4, 1, "X");                                      // to the back hallway
  fill(23, 3, 2, 10, "R");                                      // overstock racking
  for (const [x, y] of [[28, 4], [31, 4], [28, 8], [31, 8], [52, 4], [55, 4], [58, 4], [52, 9], [55, 9]]) fill(x, y, 2, 2, "P");
  // Employee bathroom next to the dock: sink, divider and toilet stall.
  room(70, 4, 7, 6); fill(73, 9, 1, 1, ".");
  hline(71, 5, 2, "s"); vline(74, 5, 3, "p"); fill(75, 6, 1, 1, "t");
  // Returns / overstock racks in the top-right corner.
  hline(78, 13, 10, "R"); vline(78, 14, 5, "R"); vline(87, 14, 5, "R");
  hline(83, 18, 9, "R");
  // Bulk water + drinks on pallets, staged near the dock.
  for (const x of [68, 72]) for (const y of [13, 16]) fill(x, y, 3, 2, "P");

  // ------------------------------------------------------------ BACK WALL DEPARTMENTS
  // Back hallway behind bakery + meat (employees only).
  fill(23, 16, 22, 4, ".");

  // BAKERY: production room with ovens, then display tables on the floor.
  room(3, 20, 22, 11);
  hline(5, 22, 8, "O");                           // deck ovens
  hline(15, 22, 7, "R");                          // bread racks
  hline(6, 26, 5, "K"); hline(14, 26, 5, "K");    // prep tables
  fill(23, 20, 1, 1, ".");                        // door to the hallway
  fill(13, 30, 2, 1, ".");                        // door to the floor
  hline(5, 32, 7, "G"); hline(16, 32, 7, "G");    // muffins, croissants, pies

  // MEAT & SEAFOOD: cutting room, with the long open meat case in front.
  room(25, 20, 20, 11);
  hline(28, 24, 6, "K"); hline(36, 24, 6, "K");   // cutting tables
  hline(27, 21, 6, "F"); hline(37, 21, 6, "F");  // walk-in cooler doors
  fill(34, 20, 2, 1, ".");                        // door to the hallway
  hline(26, 31, 18, "N");

  // DAIRY & REFRIGERATED: a walk-in cold box (cold floor) with strip-curtain door.
  room(45, 16, 19, 12, "S");
  hline(46, 17, 17, "F");
  hline(48, 20, 13, "F"); hline(48, 23, 13, "F");
  fill(53, 27, 3, 1, "S");
  // DELI / ROTISSERIE: hot chicken and prepared foods along the cooler front.
  hline(46, 28, 7, "J"); hline(56, 28, 7, "J");

  // ------------------------------------------------------------ LEFT SIDE: PRODUCE + GROCERY
  // Walk-in produce cooler.
  room(4, 34, 11, 9, "S");
  vline(5, 35, 7, "A"); hline(6, 35, 7, "A");      // cold shelving walls
  fill(7, 37, 2, 2, "B"); fill(10, 37, 2, 2, "B");
  fill(7, 40, 2, 1, "B"); fill(10, 40, 2, 1, "B");
  fill(14, 37, 1, 3, "S");                        // strip-curtain door

  // Wall racking down the whole left side.
  fill(4, 44, 2, 64, "R");
  // Dry grocery: long double-deep racks, three squares between each.
  const groceryRows = [46, 51, 56, 61, 66, 71, 76, 81];
  for (const y of groceryRows) fill(8, y, 17, 2, "R");

  // ELECTRONICS: right inside the entrance, TV wall + demo tables.
  hline(9, 86, 16, "V");
  for (const x of [10, 14, 18, 22]) { fill(x, 89, 2, 2, "E"); fill(x, 93, 2, 2, "E"); }
  hline(10, 98, 6, "K");                          // jewelry case
  fill(19, 98, 5, 2, "L");                        // books + gift cards

  // ------------------------------------------------------------ CENTER: TREASURE HUNT
  // Open coffin coolers for meat + seafood.
  fill(31, 40, 2, 8, "f"); fill(40, 40, 2, 8, "f");
  // D19 endcap racks.
  for (const x of [51, 56, 61]) fill(x, 40, 2, 8, "R");

  // SEASONAL (fall): pallets of decor + pumpkin bins.
  for (const x of [30, 35, 40]) for (const y of [51, 55, 59]) fill(x, y, 3, 2, "P");
  fill(44, 52, 2, 2, "U"); fill(44, 58, 2, 2, "U");
  // SHOES, SOCKS + BEDDING.
  for (const x of [51, 56, 61]) for (const y of [51, 55, 59]) fill(x, y, 3, 2, "L");
  // CLOTHING (both sides of the center walkway).
  for (const x of [30, 35, 40, 51, 56, 61]) for (const y of [65, 69, 73, 77]) fill(x, y, 3, 2, "L");
  // SEASONAL (holiday): toys, trees and decor on pallets.
  for (const x of [30, 35, 40]) for (const y of [84, 88, 92, 96]) fill(x, y, 3, 2, "P");
  // CANDY + SNACKS.
  for (const y of [84, 88, 92, 96]) hline(51, y, 14, "Y");

  // Sample tables at the end of the racetrack aisles.
  fill(28, 63, 1, 1, "T"); fill(66, 63, 1, 1, "T");

  // ------------------------------------------------------------ RIGHT SIDE: PAPER, FREEZERS, GROCERY
  const rightRows = [22, 26, 30, 34, 38];               // paper towels, cleaning, water
  for (const y of rightRows) fill(71, y, 16, 2, "R");
  for (const y of [43, 49, 55]) fill(71, y, 16, 2, "F"); // freezers + fridge cases
  const lowerRows = [61, 65, 69, 73, 77, 81];          // canned goods, snacks, drinks
  for (const y of lowerRows) fill(71, y, 16, 2, "R");
  fill(90, 21, 2, 66, "R");                            // wall racking down the right side
  for (const y of [88, 91, 94, 97]) hline(71, y, 10, "R");   // health + beauty / vitamins

  // PHARMACY: counter window facing the floor, drug shelves behind.
  room(84, 87, 9, 13);
  vline(84, 90, 6, "K");
  vline(89, 89, 9, "R");
  // OPTICAL: red frame-display wall plus a white consultation island.
  hline(73, 101, 10, "I");
  hline(75, 104, 6, "I");
  // HEARING AIDS.
  room(84, 99, 9, 7);
  fill(84, 101, 1, 2, ".");
  hline(87, 101, 3, "K");
  fill(86, 99, 1, 1, ".");                             // pharmacy staff door
  hline(73, 107, 20, "W");                             // wall behind optical

  // ------------------------------------------------------------ FRONT END
  // Self checkout: two rows of three kiosks.
  for (const x of [26, 30, 34]) { fill(x, 106, 1, 1, "Q"); fill(x, 109, 1, 1, "Q"); }
  // Staffed registers: register 1 is the leftmost lane at x:38.
  const registers = [38, 42, 46, 50, 54, 58, 62, 66, 70];
  for (const x of registers) vline(x, 106, 5, "C");

  // ENTRANCE + EXIT in the bottom-left corner.
  fill(5, 121, 4, 1, "M");                           // entrance
  fill(10, 121, 4, 1, "M");                          // exit
  fill(4, 120, 10, 1, "M");                          // inside mat
  // MEMBERSHIP counter next to the doors.
  room(15, 114, 11, 8); hline(16, 114, 9, "K"); fill(25, 118, 1, 1, ".");
  // Food court seating.
  for (const x of [28, 31, 34]) { fill(x, 116, 2, 1, "T"); fill(x, 119, 2, 1, "T"); }
  // FOOD COURT: stainless kitchen behind a long white service counter.
  room(36, 114, 10, 8);
  hline(37, 114, 8, "H"); fill(36, 117, 1, 1, ".");   // kitchen door
  hline(38, 118, 6, "O");
  // MPU (member pick-up) counter.
  room(46, 115, 5, 7); hline(47, 115, 3, "K");
  // OFFICE.
  room(51, 115, 10, 7); fill(55, 115, 2, 1, "."); hline(53, 118, 3, "d");
  fill(50, 118, 2, 1, ".");                            // MPU back door
  // BREAK ROOM.
  room(61, 113, 16, 9); fill(64, 113, 2, 1, ".");
  for (const x of [64, 69]) fill(x, 116, 3, 1, "T");
  hline(62, 120, 5, "K"); fill(63, 120, 1, 1, "s");  // sink + cabinets
  hline(72, 120, 4, "F");                            // fridges + vending
  // RESTROOMS (men + women).
  room(77, 113, 16, 9); vline(84, 113, 9, "W");
  fill(79, 113, 2, 1, "."); fill(87, 113, 2, 1, ".");
  // Sink counters along the back and individual privacy stalls.
  hline(78, 120, 5, "s"); hline(86, 120, 5, "s");
  vline(79, 115, 3, "p"); vline(82, 115, 3, "p");
  vline(87, 115, 3, "p"); vline(90, 115, 3, "p");
  fill(80, 117, 1, 1, "t"); fill(83, 117, 1, 1, "t");
  fill(88, 117, 1, 1, "t"); fill(91, 117, 1, 1, "t");

  // ------------------------------------------------------------ OUTSIDE
  // TIRE CENTER: attached to the front, bay doors open to the lot.
  room(24, 121, 37, 12, "X");
  vline(43, 121, 12, "W"); fill(43, 127, 1, 2, "X");
  fill(27, 121, 1, 1, "X");                            // door from the store
  fill(28, 132, 4, 1, "X"); fill(35, 132, 4, 1, "X");   // tire bays
  fill(48, 132, 4, 1, "X");                            // tire shop door
  // Tire storage uses dedicated rack props rather than grocery shelves.
  hline(46, 124, 8, "K");                              // tire shop service desk
  fill(54, 127, 5, 2, "R");

  Game.setMap({
    name: "Costco #693 — Sonterra Park",
    tiles: map.map(row => row.join("")),
    start: { x: 46, y: 9, facing: "left" },
    props: [
      { type: "forklift", x: 42, y: 7 },
      { type: "canopy", x: 4, y: 122, solid: false },
      ...[4, 16, 22].map(x => ({ type: "stoneColumn", x, y:122 })),
      ...[4, 15, 19, 23].map(x => ({ type: "bollard", x, y:123 })),
      ...[123,126,129].flatMap(y => [26,40].map(x => ({ type:"tireRack", x, y }))),
      // Steel columns along the main walkways.
      ...[40, 60, 80, 96].map(y => ({ type: "column", x: 26, y })),
      ...[30, 50, 70, 90].map(y => ({ type: "column", x: 69, y })),
      // Red-handled carts in the lot by the doors.
      { type: "cartCorral", x: 3, y: 124 },
      { type: "cartCorral", x: 64, y: 125 },
      { type: "cartCorral", x: 78, y: 125 },
    ],
    signs: [
      { text: "RECEIVING", x: 43, y: 2.5, kind: "room" },
      { text: "RESTROOM", x: 73.5, y: 3.6, kind: "room" },
      { text: "RETURNS", x: 83, y: 12.2, kind: "room" },
      { text: "WATER + DRINKS", x: 71.5, y: 11.6, kind: "dept" },
      { text: "CAKES   KIRKLAND BAKERY   COOKIES", x: 14, y: 19.6, kind: "bakery" },
      { text: "KIRKLAND SIGNATURE  MEAT", x: 35, y: 19.6, kind: "meat" },
      { text: "DAIRY", x: 54, y: 15.6, kind: "dept" },
      { text: "KIRKLAND SIGNATURE  ROTISSERIE", x: 54.5, y: 29.9, kind: "deli" },
      { text: "PRODUCE", x: 9.5, y: 33.6, kind: "produce" },
      { text: "SEAFOOD", x: 37, y: 38.6, kind: "dept" },
      ...[51, 56, 61].map(x => ({ text: "D19", x: x + 1, y: 38.7, kind: "aisle" })),
      { text: "GROCERY", x: 16.5, y: 44.4, kind: "dept" },
      ...groceryRows.map((y, i) => ({ text: String(201 + i * 2), x: 16.5, y: y - .3, kind: "aisle" })),
      { text: "PAPER + CLEANING", x: 79, y: 20.6, kind: "dept" },
      ...rightRows.concat(lowerRows).map((y, i) => ({ text: String(301 + i * 2), x: 79, y: y - .3, kind: "aisle" })),
      { text: "FREEZERS", x: 79, y: 41.6, kind: "dept" },
      { text: "FRIDGE", x: 79, y: 53.6, kind: "dept" },
      { text: "HEALTH + BEAUTY", x: 76, y: 86.6, kind: "dept" },
      { text: "SEASONAL", x: 37, y: 49.5, kind: "dept" },
      { text: "SHOES  SOCKS  BEDDING", x: 57.5, y: 49.5, kind: "dept" },
      { text: "CLOTHING", x: 37, y: 63.6, kind: "dept" },
      { text: "CLOTHING", x: 57.5, y: 63.6, kind: "dept" },
      { text: "HOLIDAY", x: 37, y: 82.6, kind: "dept" },
      { text: "CANDY", x: 58, y: 82.6, kind: "dept" },
      { text: "SAMPLES", x: 28.5, y: 62, kind: "dept" },
      { text: "SAMPLES", x: 66.5, y: 62, kind: "dept" },
      { text: "ELECTRONICS", x: 16.5, y: 84.6, kind: "dept" },
      { text: "JEWELRY", x: 13, y: 96.8, kind: "dept" },
      { text: "PHARMACY", x: 88, y: 86, kind: "dept" },
      { text: "CONTACT LENSES   OPTICAL   SUNGLASSES", x: 78, y: 99.6, kind: "optical" },
      { text: "HEARING AIDS", x: 88, y: 99.2, kind: "dept" },
      { text: "SELF CHECK-OUT", x: 30, y: 103.6, kind: "selfCheckout" },
      ...registers.map((x, i) => ({ text: String(i + 1), x: x + .5, y: 105, kind: "lane" })),
      { text: "MEMBERSHIP", x: 20.5, y: 113, kind: "dept" },
      { text: "FOOD COURT", x: 41, y: 111.6, kind: "dept" },
      { text: "HOT DOG + SODA|$1.50", x: 41, y: 113.2, kind: "menu" },
      { text: "MPU", x: 48.5, y: 114, kind: "dept" },
      { text: "OFFICE", x: 56, y: 114, kind: "room" },
      { text: "BREAK ROOM", x: 69, y: 112, kind: "room" },
      { text: "MEN", x: 80.5, y: 112, kind: "room" },
      { text: "WOMEN", x: 88.5, y: 112, kind: "room" },
      { text: "ENTRANCE", x: 7, y: 122.6, kind: "door" },
      { text: "EXIT", x: 12, y: 123.4, kind: "door" },
      { text: "COSTCO WHOLESALE", x: 77, y: 122.2, kind: "brand" },
      { text: "TIRE CENTER", x: 33.5, y: 133.6, kind: "tire" },
      { text: "TIRE SHOP", x: 52, y: 133.6, kind: "tire" },
    ],
    floorLines: [
      { x: 23, y: 13.6, length: 40 },     // dock safety line
      { x: 61, y: 124.5, length: 32 },
    ],
  });
})();
