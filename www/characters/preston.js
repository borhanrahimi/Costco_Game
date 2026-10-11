// characters/preston.js — THE MAIN CHARACTER (the one you control)
// Matched to his photo: curly brown hair, round black glasses,
// pink striped button-up shirt and his name badge.

Game.setPlayer({
  name: "Preston",
  role: "Forklift driver",
  employeeSince: 2023,       // shows on his name badge in conversations

  // His face, made from his photo. Shows next to his lines in conversations
  // and on the title screen. (64 x 64 and 128 x 128 pixel art)
  portrait: "characters/portraits/preston-64.png",
  portraitLarge: "characters/portraits/preston-128.png",

  // His little walking sprite in the store.
  look: {
    hair:    "#4a3020",
    skin:    "#e4b598",
    shirt:   "#e2aa9c",     // pink button-up
    stripes: "#f4dcd4",     // white stripes on the shirt
    vest:    null,
    pants:   "#2d3447",
    curly:   true,
    glasses: true,
    badge:   true,
  },

  // His voice when he talks in a conversation.
  voice: { pitch: 300, wave: "square" },
});
