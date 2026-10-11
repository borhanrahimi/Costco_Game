// characters/mama-king.js — Mama King (Member)
// Look is a placeholder until we match it to a photo.

Game.addCharacter({
  name: "Mama King",
  role: "Member",
  position: { x: 27, y: 64, facing: "right" },   // at the sample table

  look: { ...Outfit.member, hair: Colors.hair[6], skin: Colors.skin[4], shirt: "#8a4fb0", pants: "#2d3447", longHair: true },

  voice: { pitch: 620, wave: "sine" },

  conversation: [
    { who: "Mama King", text: "Nigga! " },
  ],

  nameTag: true,
  wander: true,
  angry: false,
});
