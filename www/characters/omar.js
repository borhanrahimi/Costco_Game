// Omar runs quick errands beside the register bank.
Game.addCharacter({
  name: "Omar",
  role: "Front-end assistant",
  position: { x: 97, y: 35, facing: "down" },
  look: {
    ...Outfit.staff,
    hair: "#29221e", skin: "#bd855f",
    shirt: "#ecebe6", vest: "#d8352a", pants: "#2d3447",
    shoes: "#71513a", badge: true,
    heightScale: .62, widthScale: .85,
    neckerchief: "#edbd4f",
  },
  voice: { pitch: 490, wave: "triangle" },
  conversation: [
    { who: "Preston", text: "What's up kid?" },
    { who: "Omar", text: "Whats up mihito?" },
  ],
  nameTag: true,
  wander: true,
  patrol: [{x:97,y:35},{x:74,y:5}],
  dashSeconds: 1,
  walkSpeed: 155,
  patrolPause: 4,
});
