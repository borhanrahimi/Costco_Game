// characters/borhan.js — Borhan (Cashier, lane 1)
// Look is a placeholder until we match it to a photo.

Game.addCharacter({
  name: "Borhan",
  role: "Cashier, lane 1",
  employeeSince: 2021,
  // Register 1 is the first checkout at x:38. Borhan stands at its cashier side.
  position: { x: 37, y: 108, facing: "right" },

  look: { ...Outfit.staff, hair: Colors.hair[3], skin: Colors.skin[3], bald: true },

  voice: { pitch: 520, wave: "square" },

  conversation: [
    { who: "Preston", text: "Bald dude!!" },
    { who: "Borhan", text: "TORTA LOVER!!" },
  ],

  nameTag: true,
  wander: false,
  angry: false,
});
