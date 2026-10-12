// Saniya works behind the closed pharmacy counter.
// Appearance is a placeholder until a reference is provided.
Game.addCharacter({
  name: "Saniya",
  role: "Pharmacy",
  employeeSince: 2024, // shows on here name badge
  position: { x: 84, y: 8, facing: "down" },
  look: {
    ...Outfit.pharmacy,
    hair: Colors.hair[3],
    skin: Colors.skin[2],
    longHair: true,
  },

  nameTag: true,
  wander: false,
  // No personal dialogue supplied yet; use the engine's "..." placeholder.
  interactionRange: 80,
  voice: { pitch: 520, wave: "square" },

  conversation: [
    { who: "Preston", text: "Hi Saniya" },
    { who: "Saniya", text: "Hi Preston" },
    { who: "Preston", text: "Have you seen JR?" },
    { who: "Saniya", text: "I think he's at back on merch!" },
    {who: "Preston", text: "Thank you Saniya"},
  ],
});
