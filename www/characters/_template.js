// characters/_template.js — COPY THIS FILE TO MAKE A NEW CHARACTER
//
// 1. Copy this file and rename it, e.g. characters/jose.js
// 2. Change everything below
// 3. Open www/index.html and add this line with the other characters:
//      <script src="characters/jose.js"></script>
// 4. Save and refresh the browser.
//
// This template file itself is NOT loaded by the game.

Game.addCharacter({
  name: "Jose",              // shown on the name tag and in the dialogue box
  role: "Cashier",           // shown next to their name when they talk
  employeeSince: 2024,       // shows on their name badge (leave out for members)

  // Where they stand. Use the numbers on the side of maps/warehouse.js to find a square.
  // It must be a floor square (.  S  M  X). facing: "up" | "down" | "left" | "right"
  position: { x: 51, y: 132, facing: "left" },

  // Optional face picture (64 x 64 pixel art) shown when they talk.
  // Make one from a photo with: python3 tools/make-portrait.py photo.jpg jose
  // portrait: "characters/portraits/jose-64.png",

  // What they look like. Start from an outfit and change what you want:
  //   Outfit.staff, Outfit.supervisor, Outfit.manager, Outfit.forklift,
  //   Outfit.kitchen, Outfit.pharmacy, Outfit.member
  look: {
    ...Outfit.staff,
    hair: Colors.hair[0],    // or any color like "#2a1b12"
    skin: Colors.skin[2],
    // bald: true,
    // longHair: true,
    // curly: true,
    // stripes: "#f4dcd4",     // stripes on the shirt
    // badge: true,            // name badge (shows when there's no vest)
    // glasses: true,
    // beard: true,
    // cap: "#24427a",
    // shirt: "#2f4f8a",
  },

  // Their voice blips. pitch 200 (deep) to 900 (high). wave: "square" | "triangle" | "sawtooth" | "sine"
  voice: { pitch: 480, wave: "triangle" },

  // What happens when Preston talks to them. Each line is one tap.
  // "who" is whoever says that line. Add sound: "sounds/file.m4a" to play a real recording.
  conversation: [
    { who: "Jose", text: "Hey Preston, what's up?" },
    // { who: "Preston", text: "Not much, just working." },
  ],

  nameTag: true,             // show their name over their head
  wander: false,             // true = they walk around a little
  angry: false,              // true = they turn red and steam while talking
});
