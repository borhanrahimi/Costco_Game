# Preston's Shift

A top-down pixel game where Preston, a forklift driver, walks the whole warehouse and talks to everyone on shift. Built with plain HTML, CSS and JavaScript so it runs in a browser, on an iPhone home screen, or as a real iOS app.

## Play it on your computer

Open `www/index.html` in Chrome or Safari (double-click it). Arrow keys or WASD to walk, Space to talk, M for the map.

After you change a file, save it and refresh the browser.

## Project layout

```
prestons-shift/
├── www/                      ← everything the game needs
│   ├── index.html            ← the page; lists every file the game loads
│   ├── css/style.css         ← buttons, dialogue box, menus
│   ├── maps/warehouse.js     ← THE STORE LAYOUT (a grid of letters)
│   ├── characters/           ← ONE FILE PER PERSON
│   │   ├── preston.js        ← the main character (you control him)
│   │   ├── borhan.js, mama-king.js
│   │   ├── portraits/        ← 64x64 / 128x128 pixel-art faces
│   │   └── _template.js      ← copy this to make a new character
│   ├── stations/             ← things Preston can use (food-court.js = the $1.50 hot dog)
│   ├── sounds/               ← optional recorded voice clips
│   └── js/                   ← the game engine (you rarely need to touch it)
│       ├── core.js           ← shared Game object, outfits, colors
│       ├── tiles.js          ← how each map letter is drawn
│       ├── sprites.js        ← how people, name tags and signs are drawn
│       ├── sound.js          ← voice blips and sound files
│       ├── input.js          ← keyboard, joystick, TALK button
│       └── game.js           ← movement, conversations, camera, menus
├── design/                   ← your map drawing and reference photos
├── tools/bundle.js           ← packs the game into one shareable file
├── tools/make-portrait.py    ← turns a photo into a pixel-art face
├── capacitor.config.json     ← settings for the iOS app
└── package.json
```

## Add a new character

1. Copy `www/characters/_template.js` and rename it, for example `jose.js`.
2. Change the name, role, position, look, voice and conversation.
3. In `www/index.html`, add a line with the other characters:
   ```html
   <script src="characters/jose.js"></script>
   ```
4. Save and refresh.

### Moving someone

Change `position: { x, y, facing }` in their file. The map file has the column and row numbers printed along the edges so you can count squares. They must stand on a floor square (`.`, `S` or `M`). If they're inside a wall or shelf, the browser console (right-click → Inspect → Console) prints a warning with their name.

Tip: walk Preston to a spot, open the console and type `Game.debug.where()` to get that square's x and y.

### Conversations

Each item is one tap. `who` is whoever says it:

```js
conversation: [
  { who: "Preston", text: "Bald dude!!" },
  { who: "Borhan",  text: "TORTA LOVER!!" },
],
```

Add `sound: "sounds/clip.m4a"` to a line to play a real recording instead of beeps. See `www/sounds/README.md`.

### Looks

Characters are 24 x 48 pixel sprites with full faces (eyes, eyebrows, nose, mouth, ears) drawn from their look. Start from an outfit in `js/core.js` (`Outfit.staff`, `Outfit.supervisor`, `Outfit.manager`, `Outfit.forklift`, `Outfit.kitchen`, `Outfit.pharmacy`, `Outfit.member`) and override parts: `hair`, `skin`, `shirt`, `vest`, `pants`, `cap`, `tie`, plus `bald`, `curly`, `longHair`, `glasses`, `beard`, `badge` set to `true`, `stripes` (a color for shirt stripes) and `eyes` (eye color).

### Special effects

- `nameTag: true`: name floats over their head
- `wander: true`: they stroll around a little
- `angry: true`: they turn red and steam while talking

## Name badges

Every employee outfit (`Outfit.staff`, `supervisor`, `manager`, `forklift`, `kitchen`, `pharmacy`) wears a name badge on their chest, and their name shows as a badge in conversations. Add `employeeSince: 2023` to a character file to print "SINCE 2023" on it. Members (`Outfit.member`) don't get one.

## The $1.50 hot dog

`www/stations/food-court.js` is the food court counter. Walk up to it and tap TALK to buy a hot dog + soda. Each one adds to the hot dog counter at the top of the screen and gives Preston a 15-second speed boost. You can change the lines, price and boost in that file. Stations work like characters without a body: copy the file to make another one (and add it to `index.html`).

## Faces (portraits)

Each character can have a pixel-art face that shows next to their lines. Make one from a photo:

```bash
pip3 install pillow
python3 tools/make-portrait.py design/borhan-photo.jpg borhan --crop LEFT,TOP,SIZE
```

`--crop` is a square around the head in the photo's pixels. It writes `www/characters/portraits/borhan-64.png` and `borhan-128.png`. Then add to `borhan.js`:

```js
portrait: "characters/portraits/borhan-64.png",
```

Preston's was made with `--crop 150,799,879` from `design/preston-photo.jpg`. A plain light background behind the person works best.

## Edit the map

The game is drawn in a 3/4 view: racks, coolers and counters stand up off the floor, and Preston can walk behind them. Racks fill themselves with different products bay by bay (water, paper towels, cereal, detergent, cans, snacks, coffee, wine, pet food, TVs, cases, diapers). All of that art lives in `www/js/tiles.js`.

The active map is a **136-by-90-tile temporary simplified editing view**, with the entrance at the southeast and services on the east wall. Earlier full-warehouse generation remains in the file but is deliberately cleared in many areas. Preston starts near the southeast entrance. Preserve the final editing pass and approved positions when adding details; do not restore the full warehouse blindly. See [the stability review](docs/stability-review.md) for implemented sections, reference gaps and manual checks.

Open `www/maps/warehouse.js`. Each letter is one square:

| Letter | Meaning | Letter | Meaning |
|---|---|---|---|
| `.` | floor | `W` | wall |
| `R` | racking with products | `P` | pallet display |
| `C` | register | `Q` | self checkout |
| `K` | counter | `F` | cooler case |
| `O` | oven / rotisserie | `T` | food court table |
| `V` | TV wall | `E` | electronics table |
| `B` | produce bin | `U` | pumpkin bin |
| `D` | door | `S` | cold floor |
| `M` | door mat | `X` | dock / shop floor |
| `L` | clothing table | `Y` | candy shelf |
| `N` | meat case | `G` | bakery table |
| `H` | food court counter | | |
| `I` | optical display | | |
| `J` | deli rotisserie | | |
| `A` | produce cooler wall | | |
| `~` | outside the building | | |

Keep every row the same length. The map can be any size. Signs, Preston's starting spot, props (the forklift) and the yellow floor lines are listed under the grid.

### Quick personalization

The compact map is generated with simple drawing helpers near the top of `www/maps/warehouse.js`:

```js
fill(20, 20, 8, 3, "R");  // x, y, width, height, tile
hline(20, 25, 12, "F");   // a horizontal freezer run
vline(40, 20, 10, "R");   // a vertical merchandise aisle
```

To move an employee, open their file in `www/characters/` and edit `position`. For example, Borhan stands beside cashier lane 1:

```js
position: { x: 26, y: 54, facing: "right" }
```

Floor tiles (`.`) are walkable. Shelves, registers, counters, walls, and product displays are solid, so put employees on a `.` next to their workstation—not directly inside its tile. After editing, refresh the browser and run `node tools/bundle.js` if you also want to update the shareable file in `dist/`.

## Put it on an iPhone

### Option A — Home-screen app (free, easiest)

1. Push this project to a public GitHub repo.
2. Repo **Settings → Pages** → Source: *Deploy from a branch*, Branch: `main`, folder: `/ (root)`. Save.
3. Your game is at `https://YOUR-USERNAME.github.io/prestons-shift/www/`.
4. On the iPhone, open that link in **Safari** → **Share** → **Add to Home Screen**.

It opens full-screen with its own icon. Every time you push changes, the game updates.

### Option B — Real iOS app (Xcode, on your Mac)

You need Xcode (Mac App Store) and Node.js (nodejs.org).

```bash
cd prestons-shift
npm install @capacitor/core @capacitor/ios
npm install -D @capacitor/cli
npm run ios:add      # creates the ios/ folder (first time only)
npm run ios:open     # opens the project in Xcode
```

In Xcode: select the **App** project → **Signing & Capabilities** → choose your Apple ID team. Plug in your iPhone, turn on **Developer Mode** on the phone (Settings → Privacy & Security), pick the phone at the top of Xcode and press **▶ Run**.

After you change game files, run `npm run ios:sync` and press Run again.

With a free Apple ID the app works for 7 days before it needs reinstalling. To put it on Preston's phone for good you need the Apple Developer Program ($99/year) and TestFlight.

## Share as one file

```bash
node tools/bundle.js
```

That writes `dist/prestons-shift.html`, the whole game in one file you can send to anyone.

## Validate changes

Run `npm test` for map, asset, collision, dialogue, vehicle and saving checks. These use lightweight browser stubs; real browser and iPhone visual/touch testing is still required. See [the review and test checklist](docs/stability-review.md).
