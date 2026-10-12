// Step 2: entrance, exit and food court. Previous full layout: warehouse.previous.js.
(() => {
  const width = 90, height = 30;
  const tiles = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      // Five-sided footprint: rectangular warehouse with a diagonal SW frontage.
      if (x < 2 || x > 87 || y < 2 || y > 22 || y - x > 13) return "X";
      if (x === 2 || x === 87 || y === 2 || y === 22 || y - x === 13) return "W";
      return ".";
    }));
  // Both doors open on the clipped southwest corner, facing southwest.
  for(const x of [3,4,5,7,8,9]) tiles[x+13][x]="M";
  // South wall: exit → Membership → Tire Center → Food Court → MPU → Office.
  for(let x=12;x<=23;x++) tiles[21][x]="K";
  // Tire Center is just a signed doorway for now; structure comes later.
  for(let x=26;x<=28;x++) tiles[22][x]="M";
  // Quarter-turn: long counter runs north/south, service side faces west to exit.
  for(let y=14;y<=21;y++) for(let x=39;x<=43;x++) tiles[y][x]="K";
  // Nine two-tile tables between the Tire Center entrance and food court.
  // Two-tile gaps separate tables; the doorway approach at x:26–28 stays clear.
  for(const y of [11,15,19]) for(const x of [29,33,36]){
    tiles[y][x]="T"; tiles[y][x+1]="T";
  }
  // MPU is a compact three-tile pickup counter immediately after food court.
  for(let x=45;x<=47;x++) tiles[19][x]="K";
  tiles[21][46]="P";
  // Office with a north-facing doorway and usable aisle around the desks.
  for(let y=17;y<=21;y++){ tiles[y][49]="W"; tiles[y][59]="W"; }
  for(let x=49;x<=59;x++) tiles[17][x]="W";
  tiles[17][53]="M"; tiles[17][54]="M";
  for(const x of [51,56]) tiles[20][x]="d";
  // Compact south-wall rooms, entered from the main aisle on the north.
  const addRoom = (left, right, door) => {
    for(let y=15;y<=21;y++){ tiles[y][left]="W"; tiles[y][right]="W"; }
    for(let x=left;x<=right;x++) tiles[15][x]="W";
    tiles[15][door]="M"; tiles[15][door+1]="M";
  };
  // Break room immediately after the office: tables, kitchenette, fridge.
  addRoom(60,70,64);
  for(const x of [62,66]){ tiles[18][x]="T"; tiles[18][x+1]="T"; }
  for(let x=61;x<=65;x++) tiles[21][x]="K";
  tiles[21][62]="s"; tiles[21][68]="F";
  // Men's and women's restrooms: individual entrances, sink banks and stalls.
  for(const [left,right,door] of [[71,78,73],[79,86,81]]){
    addRoom(left,right,door);
    tiles[17][left+1]="s"; tiles[17][left+2]="s";
    for(const x of [left+3,left+6]){
      tiles[20][x]="t";
      tiles[19][x-1]="p"; tiles[20][x-1]="p";
    }
  }
  const layout = {
    name: "South Side — Services & Staff Rooms",
    tiles: tiles.map(row => row.join("")),
    start: { x: 3, y: 20, facing: "up" },
    props: [
      { type: "foodCourtWest", x: 39, y: 14, solid: false },
      { type: "membershipCounter", x: 12, y: 21, solid: false },
      // Facade modules trace the approved southwest diagonal.
      ...[2,3,4,5,6,7,8,9].map(x => ({
        type: x===4 ? "cornerEntrance" : x===8 ? "cornerExit" : [3,5,7,9].includes(x) ? "cornerDoor" : "cornerWall",
        x, y: x+13, solid: false,
      })),
      { type: "stoneColumn", x: 2, y: 15 },
      { type: "stoneColumn", x: 6, y: 19 },
      { type: "stoneColumn", x: 10, y: 22 },
      { type: "bollard", x: 1, y: 18 },
      { type: "bollard", x: 5, y: 22 },
      { type: "bollard", x: 10, y: 25 },
      { type: "cartCorral", x: 14, y: 25 },
    ],
    signs: [
      { text: "ENTRANCE", x: 4.5, y: 15.7, kind: "entrance" },
      { text: "EXIT", x: 8.5, y: 19.7, kind: "entrance" },
      // Logo is mounted over the doorway pair on the diagonal frontage.
      { text: "COSTCO WHOLESALE", x: 6, y: 14.6, kind: "brand" },
      { text: "TIRE CENTER", x: 27.5, y: 21.2, kind: "tire" },
      { text: "FOOD COURT", x: 41.5, y: 12.8, kind: "dept" },
      { text: "MPU", x: 46.5, y: 18, kind: "dept" },
      { text: "OFFICE", x: 54, y: 16, kind: "room" },
      { text: "BREAK ROOM", x: 65, y: 14, kind: "room" },
      { text: "MEN", x: 74.5, y: 14, kind: "room" },
      { text: "WOMEN", x: 82.5, y: 14, kind: "room" },
    ],
    floorLines: [ { x: 12, y: 28, length: 18 } ],
  };
  // Match the supplied north-up plan: rotate the existing services a quarter
  // turn counterclockwise, putting the clipped entrance at the southeast.
  // The sales floor extends westward to the plan's broad footprint, and a
  // little extra lot on the east leaves room for the tire center annex.
  const westExtension = 96, eastExtension = 10;
  const oriented = Array.from({length: width}, () => Array(height + westExtension + eastExtension).fill("X"));
  for(let y=0;y<height;y++) for(let x=0;x<width;x++)
    oriented[width-1-x][y+westExtension]=tiles[y][x];
  for(let y=2;y<=87;y++) for(let x=2;x<=westExtension+2;x++)
    oriented[y][x]=(x===2||y===2||y===87)?"W":".";

  // North-up helpers. Everything below follows Costco #693's posted floor plan
  // (design/: 1201 N Loop 1604 E): receiving in the northwest, production rooms
  // down the west wall, aisles in three bands, checkouts beside the exit.
  const fill = (x, y, w, h, t = ".") => {
    for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++)
      if(oriented[yy] && xx>=0 && xx<oriented[yy].length) oriented[yy][xx]=t;
  };
  const hline = (x, y, w, t) => fill(x, y, w, 1, t);
  const vline = (x, y, h, t) => fill(x, y, 1, h, t);
  const room = (x, y, w, h, floor = ".") => {
    fill(x, y, w, h, floor);
    hline(x, y, w, "W"); hline(x, y+h-1, w, "W");
    vline(x, y, h, "W"); vline(x+w-1, y, h, "W");
  };

  // ------------------------------------------------------------ TRUCK WELLS
  // The plan's southwest corner is outside: a sunken truck court with dock doors.
  fill(0, 60, 20, 30, "X");
  hline(2, 59, 19, "W"); vline(20, 59, 29, "W");
  for(const y of [63,68,73,78,83]) vline(20, y, 2, "D");

  // ------------------------------------------------------------ RECEIVING
  room(2, 2, 15, 33, "X");
  for(const y of [5,10,15,20,25]) vline(2, y, 2, "D");     // west dock doors
  for(const x of [5,10]) hline(x, 2, 2, "D");              // north dock doors
  fill(16, 9, 1, 4, "X");                                  // forklift doorway to the floor
  fill(16, 27, 1, 2, "X");
  for(const [x,y] of [[4,4],[7,4],[4,8],[7,8],[4,17],[4,21],[7,21]]) fill(x, y, 2, 2, "P");
  fill(11, 16, 2, 16, "R"); fill(14, 16, 2, 16, "R");      // overstock racking

  // ------------------------------------------------------------ BACK ROOMS
  // Battery room (forklifts on charge) and hazmat / maintenance storage.
  room(2, 34, 15, 26, "X");
  hline(2, 46, 15, "W");
  fill(8, 34, 2, 1, "X");                                  // from receiving
  fill(16, 40, 1, 2, "X"); fill(16, 52, 1, 2, "X");        // to the back corridor
  vline(3, 36, 9, "K");                                    // battery chargers
  vline(3, 48, 10, "R"); hline(7, 57, 7, "K");             // hazmat shelves, workbench

  // ------------------------------------------------------------ NORTH BAND
  hline(18, 3, 14, "R"); hline(57, 3, 43, "R");            // wall racking
  // Paper + cleaning in long racks beside receiving.
  for(const x of [19,23,27]) fill(x, 6, 2, 26, "R");
  // Freezer runs (the plan's three hatched cooler blocks, each two-sided).
  for(const x of [33,36,42,45,51,54]) fill(x, 8, 2, 22, "F");
  // Water + drinks staged on pallets along the cross aisle.
  for(const x of [33,37,41,45,49,53]) fill(x, 31, 3, 2, "P");
  // Dry grocery aisles.
  const northRacks = [59,64,69,74,79,84,89,94];
  for(const x of northRacks) fill(x, 7, 2, 25, "R");

  // ------------------------------------------------------------ WEST PRODUCTION
  // Bakery, meat and deli rooms, display cases set into their sales-floor walls.
  room(20, 37, 13, 16);
  vline(21, 39, 12, "O");                                  // deck ovens
  vline(24, 39, 5, "R"); vline(24, 46, 5, "R");            // bread racks
  fill(27, 40, 2, 9, "K");                                 // prep table
  fill(20, 44, 1, 2, ".");                                 // corridor door
  fill(32, 41, 1, 2, ".");                                 // door to the floor
  for(const y of [38,42,46,50]) fill(34, y, 2, 2, "G");   // muffins, pies, croissants
  room(20, 52, 13, 19);
  vline(21, 60, 9, "F");                                   // walk-in cooler doors
  for(const y of [55,60,65]) fill(25, y, 4, 2, "K");      // cutting tables
  fill(20, 55, 1, 2, ".");
  vline(32, 54, 15, "N");                                  // open meat case
  fill(35, 54, 2, 14, "f");                                // seafood coffin coolers
  room(20, 70, 13, 18);
  vline(21, 72, 13, "O");                                  // rotisserie ovens
  fill(25, 74, 3, 8, "K");
  fill(23, 70, 2, 1, ".");                                 // through the meat room
  vline(32, 72, 13, "J");                                  // hot chicken case

  // ------------------------------------------------------------ MIDDLE BAND
  for(const y of [45,49,53]) fill(39, y, 4, 2, "L");      // books + cards
  for(const x of [47,51]) fill(x, 38, 2, 18, "R");         // housewares
  for(const x of [56,60,64]) for(const y of [38,42,46,50,54]) fill(x, y, 2, 2, "P");
  for(const x of [56,60,64]) fill(x, 54, 2, 2, "U");       // pumpkin bins
  // Clothing tables staggered on the diagonal, like the plan's angled tables.
  for(let i=0;i<5;i++) for(let j=0;j<3;j++) fill(70+j*5+(i%2)*2, 38+i*4, 2, 2, "L");
  // Electronics and Major Appliances are on the shopper's left entering NW.
  hline(89,77,10,"V");
  for(const x of [89,94]) for(const y of [80,83]) fill(x,y,3,2,"E");
  for(const x of [100,104]) for(const y of [80,83]) fill(x,y,2,2,"e");
  hline(87, 51, 6, "K"); fill(95, 51, 5, 2, "L");          // jewelry, gift cards
  // Sample tables strung along the cross aisle.
  for(const x of [48,62,76,90]) hline(x, 59, 2, "T");

  // ------------------------------------------------------------ SOUTH BAND
  room(36, 63, 10, 25, "S");                               // walk-in produce cooler
  fill(40, 63, 2, 1, "S"); fill(45, 74, 1, 3, "S");        // strip-curtain doors
  vline(37, 65, 20, "A");
  for(const x of [39,42]) for(const y of [66,70,74,78,82]) fill(x, y, 2, 2, "B");
  const southRacks = [48,52,56,60,64];
  for(const x of southRacks) fill(x, 65, 2, 20, "R");
  for(const x of [68,72]) fill(x, 65, 2, 16, "Y");         // candy + snacks
  hline(68, 85, 7, "I");                                   // optical frame wall
  for(const x of [77,81]) fill(x, 65, 2, 9, "R");          // health + beauty
  room(76, 77, 12, 11);                                    // pharmacy
  hline(78, 77, 8, "K"); fill(76, 81, 1, 2, ".");
  hline(77, 85, 8, "R");                                   // drug shelves
  // Register 1 faces the office (east wall, y:30–40). Number toward food court.
  const lanes = [34,36,38,40,42,44,46,48,50];
  // Complete rounded conveyor props replace the repeated square register tiles.
  // Self checkout directly continues the register bank: no separate cross-aisle.
  for(const x of [100,103]) for(const y of [52,54,56]) fill(x, y, 2, 1, "q");
  // One continuous diagonal merchandise run. Invisible collision follows its
  // footprint; a single smooth fixture replaces separate square rack tiles.
  for(let y=59;y<=78;y++){
    const x=99+Math.floor((y-59)*.55);
    if(oriented[y]?.[x]===".") oriented[y][x]="r";
  }

  // ------------------------------------------------------------ TIRE CENTER
  // Annex on the east wall behind the existing tire center doorway.
  hline(118, 34, 13, "W"); hline(118, 66, 13, "W"); vline(130, 34, 33, "W");
  for(const y of [40,47,54]) vline(130, y, 3, "M");        // service bays
  hline(120, 58, 6, "K");                                  // service desk

  layout.name = "Costco #693 — North-Up Floor Plan";
  // Keep the east exterior wall visible behind the membership counter artwork.
  vline(118,67,12,"W");
  for(let y=66;y<=77;y++){
    if(oriented[y][117]==="K") oriented[y][117]=".";
    oriented[y][114]="K";
  }
  for(let y=80;y<=87;y++){
    const x=198-y;
    if(oriented[y][x]==="W") oriented[y][x]="w";
  }
  layout.tiles = oriented.map(row => row.join(""));
  layout.start = {x:116,y:86,facing:"up"};
  layout.props = layout.props.filter(p => !["cornerDoor","cornerWall","cornerEntrance","cornerExit","stoneColumn","cartCorral"].includes(p.type)).map(p => {
    const size=Tiles.PROPS[p.type];
    return {...p,x:p.type==="membershipCounter"?114:p.y+westExtension,y:width-p.x-size.w,rotation:-90};
  });
  layout.props.push(
    {type:"cornerVestibule",x:111,y:80,solid:false},
    // Carts sit outside the diagonal doors, leaving the approach open.
    {type:"cartCorral",x:113,y:88},
    {type:"cartCorral",x:122,y:79,rotation:-90},
    {type:"basketStack",x:124,y:87},
    {type:"merchandiseRun",x:99,y:59,solid:false},
    ...lanes.map(y => ({type:"checkoutLane",x:100,y})),
    ...[100,103].flatMap(x=>[52,54,56].map(y=>({type:"selfCheckout",x,y,solid:false}))),
    ...[100,104].flatMap(x=>[80,83].map(y=>({type:"majorAppliance",x,y,solid:false}))),
    { type: "forklift", x: 8, y: 12 },
    { type: "forklift", x: 6, y: 37 },
    { type: "forklift", x: 10, y: 37 },
    ...[[120,36],[123,36],[126,36],[127,60],[127,63]].map(([x,y]) => ({ type: "tireRack", x, y })),
  );
  layout.signs = layout.signs.filter(s => !["ENTRANCE","EXIT","COSTCO WHOLESALE"].includes(s.text)).map(s => ({...s,x:s.y+westExtension,y:width-s.x}));
  layout.signs.push(
    {text:"MEMBERSHIP",x:115,y:65.5,kind:"dept"},
    {text:"NORTH ↑",x:60,y:1.2,kind:"room"},
    {text:"RECEIVING",x:9,y:2.6,kind:"room"},
    {text:"BATTERY ROOM",x:9,y:34.6,kind:"room"},
    {text:"HAZMAT",x:9,y:46.6,kind:"room"},
    {text:"TRUCK DOCK",x:10,y:61,kind:"room"},
    {text:"PAPER + CLEANING",x:25,y:4.8,kind:"dept"},
    {text:"FREEZERS",x:44,y:6.6,kind:"dept"},
    {text:"WATER + DRINKS",x:44,y:30.4,kind:"dept"},
    {text:"GROCERY",x:78,y:5.4,kind:"dept"},
    ...northRacks.map((x,i) => ({text:String(101+i*2),x:x+1,y:6.6,kind:"aisle"})),
    {text:"CAKES   KIRKLAND BAKERY   COOKIES",x:26.5,y:36.6,kind:"bakery"},
    {text:"KIRKLAND SIGNATURE  MEAT",x:26.5,y:51.6,kind:"meat"},
    {text:"SEAFOOD",x:36,y:53.4,kind:"dept"},
    {text:"KIRKLAND SIGNATURE  ROTISSERIE",x:26.5,y:69.6,kind:"deli"},
    {text:"BOOKS",x:41,y:44,kind:"dept"},
    {text:"HOUSEWARES",x:50,y:37.4,kind:"dept"},
    {text:"SEASONAL",x:61,y:37.4,kind:"dept"},
    {text:"CLOTHING",x:78,y:37.4,kind:"dept"},
    {text:"ELECTRONICS",x:93.5,y:76,kind:"dept"},
    {text:"MAJOR APPLIANCES",x:103,y:78,kind:"dept"},
    {text:"JEWELRY",x:90,y:50.4,kind:"dept"},
    {text:"SAMPLES",x:62,y:58.4,kind:"dept"},
    {text:"PRODUCE",x:41,y:62.6,kind:"produce"},
    {text:"GROCERY",x:57,y:63.6,kind:"dept"},
    ...southRacks.map((x,i) => ({text:String(201+i*2),x:x+1,y:64.6,kind:"aisle"})),
    {text:"CANDY",x:71,y:63.6,kind:"dept"},
    {text:"HEALTH + BEAUTY",x:81,y:63.6,kind:"dept"},
    {text:"PHARMACY",x:82,y:76.4,kind:"dept"},
    {text:"CONTACT LENSES   OPTICAL",x:71.5,y:84.2,kind:"optical"},
    // Centered immediately above the two self-checkout banks.
    {text:"SELF CHECKOUT",x:102.5,y:50.5,kind:"selfCheckout"},
    ...lanes.map((y,i) => ({text:String(i+1),x:100.5,y:y-.2,kind:"lane"})),
    {text:"TIRE SHOP",x:124,y:33.6,kind:"tire"},
  );
  layout.floorLines = [
    {x:3,y:14.6,length:13},                                // dock safety line
    ...[44,51].map(y => ({x:120,y:y+.5,length:10})),      // tire bay dividers
  ];
  // Temporary simplified editing view: preserve the footprint and the exact
  // service/check-out positions, clearing unrelated merchandise and rooms.
  const existing=layout.tiles.map(row=>row.split(""));
  // Keep the full east-wall service run: women's room, men's room, break room,
  // office, food court and membership.
  const retainedService=(x,y)=>x>=107&&x<=118&&y>=3&&y<=79;
  const retainedTire=(x,y)=>x>=118&&x<=130&&y>=34&&y<=66;
  const retainedMajor=(x,y)=>x>=100&&x<=107&&y>=80&&y<=84;
  layout.tiles=existing.map((row,y)=>row.map((c,x)=>{
    if(["X","~","w","r","q"].includes(c))return c;
    if(retainedService(x,y)||retainedTire(x,y)||retainedMajor(x,y))return c;
    const exterior=[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>
      [undefined,"X","~"].includes(existing[y+dy]?.[x+dx]));
    if((c==="W"||c==="D")&&exterior)return "W";
    if(c==="M"&&x>=111&&y>=79)return c;
    return ".";
  }).join(""));
  // Entrance-left display zone; keep the diagonal approach entirely open.
  const simplified=layout.tiles.map(row=>row.split(""));
  for(let y=77;y<=85;y++)for(let x=100;x<=107;x++)
    if(["V","e"].includes(simplified[y][x]))simplified[y][x]=".";
  const fixture=(x,y,w,h)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)simplified[yy][xx]="e";};
  for(const x of [102,106])fixture(x,85,3,1);
  for(const x of [93,96,99])fixture(x,84,2,2);
  fixture(90,79,6,1);
  // Long orange warehouse aisle continues horizontally west from the washer
  // section to the interior end wall, with one tile of transition space.
  for(let x=21;x<=91;x++)if(simplified[86][x]===".")simplified[86][x]="R";
  // Checkout boundary shown by the red markup. It stops three tiles before
  // Register 1 so employees and members can walk through the opening.
  for(let y=3;y<=30;y++)simplified[y][102]="W";
  // Departments on the shopper side of the wall. Optical is the larger lower
  // bay; Hearing is the smaller bay directly above it.
  // Optical frame shelving runs vertically against the checkout wall. The red
  // counter connects at the upper end, making the opposite-facing L layout.
  for(let y=21;y<=27;y++)simplified[y][101]="I";
  for(let x=98;x<=101;x++)simplified[20][x]="K";
  // Hearing mirrors Optical's open rectangular layout at a smaller scale.
  for(let y=11;y<=13;y++)simplified[y][98]="K";
  // Enclose Pharmacy for now: north and checkout walls form the back/right,
  // and a west wall joins the closed frontage to Hearing's upper boundary.
  for(let y=3;y<=9;y++)simplified[y][89]="W";
  for(const x of [90,91])simplified[9][x]="W";
  simplified[10][98]="W";
  // Replace the scattered food-court table tiles with organized seating props.
  for(let y=52;y<=60;y++)for(let x=107;x<=117;x++)if(simplified[y][x]==="T")simplified[y][x]=".";
  // Join the straight run to the office frontage beside Register 1.
  for(let x=111;x<=113;x++)simplified[33][x]="W";
  layout.tiles=simplified.map(row=>row.join(""));
  layout.props=layout.props.filter(p=>!["forklift","majorAppliance"].includes(p.type));
  layout.props.push(
    // Pharmacy follows Hearing northward, running horizontally along the wall.
    // Closed frontage touches Hearing; no player entrance is open for now.
    ...[90,93,96,99].map(x=>({type:"pharmacyShelf",x,y:3})),
    ...[92,97].map(x=>({type:"pharmacyCounter",x,y:9})),
    ...[82,86].map(x=>({type:"tvDisplay",x,y:83})),
    ...[68,71,74,77,80].map(y=>({type:"tvShelf",x:82,y})),
    ...[93,96,99].map(x=>({type:"washerDisplay",x,y:84,solid:false})),
    {type:"jewelryCounter",x:90,y:79,solid:false},
    {type:"foodKioskBank",x:111,y:51},
    ...[53,57].flatMap(y=>[107,112].map(x=>({type:"foodCourtTable",x,y}))),
    {type:"opticalCounter",x:98,y:20,solid:false},
    {type:"hearingDesk",x:98,y:11,rotation:-90,solid:false},
    ...[99,100,101].map(x=>({type:"hearingDisplay",x,y:10})),
    ...[15,16].map(y=>({type:"hearingDisplay",x:98,y})),
    ...[11,12,13,14,15,16].map(y=>({type:"hearingDisplay",x:101,y})),
    ...[98,99,100,101].map(x=>({type:"hearingDisplay",x,y:17})),
    // Low eyeglass displays complete the rectangular Optical footprint. The
    // missing left-side case at y:25 is the customer entrance.
    ...[21,22,23,24,26,27].map(y=>({type:"opticalDisplay",x:98,y})),
    ...[98,99,100,101].map(x=>({type:"opticalDisplay",x,y:28})),
    // Simple square gray employee lockers continue in one line to the end.
    ...Array.from({length:28},(_,i)=>({type:"employeeLocker",x:103,y:3+i})),
  );
  const keptSigns=new Set(["MEMBERSHIP","TIRE CENTER","TIRE SHOP","FOOD COURT","MPU","OFFICE","BREAK ROOM","MEN","WOMEN","MAJOR APPLIANCES","SELF CHECKOUT","NORTH ↑"]);
  layout.signs=layout.signs.filter(s=>keptSigns.has(s.text)||s.kind==="lane");
  const foodCourtSign=layout.signs.find(s=>s.text==="FOOD COURT");
  if(foodCourtSign){foodCourtSign.x=114;foodCourtSign.y=45.5;}
  layout.signs=layout.signs.filter(s=>s.text!=="MAJOR APPLIANCES");
  layout.signs.push(
    {text:"PHARMACY",x:95,y:6.5,kind:"dept"},
    {text:"HEARING",x:99.5,y:9,kind:"dept"},
    {text:"OPTICAL",x:99.5,y:19,kind:"optical"},
    {text:"TVs",x:85,y:66.5,kind:"dept"},
    {text:"WASHERS",x:97,y:82.5,kind:"dept"},
    {text:"JEWELRY",x:93,y:77.5,kind:"dept"},
  );
  layout.floorLines=layout.floorLines.filter(line=>line.x>=120);
  Game.setMap(layout);
})();
