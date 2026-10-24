// characters/carlos.js — Carlos (Cashier, register 4)
// Matched to his photo: medium-length wavy dark brown hair, big smile.
// Short fuse: turns red and steams as soon as you talk to him.

Game.addCharacter({
  name: "Carlos",
  role: "Cashier",
  employeeSince: 2021,
  portrait: "characters/portraits/carlos-64.png",
  portraitLarge: "characters/portraits/carlos-128.png",
  // Register 4, right next to Borhan, same spot past the scanner end.
  position: { x: 99, y: 41, facing: "left" },

  look: {
    ...Outfit.staff,
    hair: Colors.hair[0],
    skin: "#c98b62",
    longHair: true,
    badge: true,
  },

  voice: { pitch: 440, wave: "sawtooth" },

  conversation: [
    { who: "Preston", text: "Yo Carlos!" },
    { who: "Carlos", text: "STFU BITCH." },
    { who: "Preston", text: "Damn bro, I just said hi..." },
    { who: "Carlos", text: "You are pissing me off!" },
  ],

  nameTag: true,
  wander: false,
  banter: {
    partner: "Borhan",
    line: "Bald ass Nigga!",
    reply: "Short ass Nigga!",
    angry: true,
  },
  angry: true,
});
