// characters/borhan.js — Borhan (Cashier, register 3)
// Matched to his portrait: thick curly black hair, black glasses,
// moustache and light stubble, plus his employee name badge.

Game.addCharacter({
  name: "Borhan",
  role: "Cashier",
  employeeSince: 2021,
  portrait: "characters/portraits/borhan-64.png",
  portraitLarge: "characters/portraits/borhan-128.png",
  // Stand beyond Register 3's scanner end, clear of the conveyor artwork.
  position: { x: 99, y: 39, facing: "left" },

  look: {
    ...Outfit.staff,
    hair: Colors.hair[3],
    skin: "#e2a071",
    curly: true,
    glasses: true,
    moustache: true,
    stubble: true,
    badge: true,
  },

  voice: { pitch: 520, wave: "square" },

  conversation: [
    { who: "Preston", text: "Bald dude!!" },
    { who: "Borhan", text: "TORTA LOVER!!" },
    { who: "Preston", text: "I love Tortas! I can eat torta everyday! " },
    { who: "Borhan", text: "Yeah! I can tell! I can smell fish and torta around the warhouse!" },
    { who: "Preston", text: "THIS NIGGA!" },
  ],

  nameTag: true,
  wander: false,
  angry: false,
});
