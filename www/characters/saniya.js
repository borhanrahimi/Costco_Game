// Saniya works behind the closed pharmacy counter.
// Appearance is a placeholder until a reference is provided.
Game.addCharacter({
  name: "Saniya",
  role: "Pharmacy",
  position: { x: 84, y: 8, facing: "down" },
  look: { ...Outfit.pharmacy, hair: Colors.hair[3], skin: Colors.skin[2], longHair: true },
  nameTag: true,
  wander: false,
  // No personal dialogue supplied yet; use the engine's "..." placeholder.
  interactionRange: 80,
});
