// Nick works Membership; his cowboy boots are his signature detail.
Game.addCharacter({
  name: "Nick",
  role: "Membership",
  portrait: "characters/portraits/nick-64.png",
  portraitLarge: "characters/portraits/nick-128.png",
  // Visible aisle side of the desk, several steps south of Amanda.
  position: { x: 113, y: 74, facing: "left" },
  look: {
    ...Outfit.staff,
    hair: "#171716",
    beard: true,
    thickBrows: true,
    skin: "#c59473",
    shirt: "#dedcc3",
    pants: "#25272b",
    collared: false,
    shoes: "#945d32",
    cowboyBoots: true,
    badge: true,
  },
  voice: { pitch: 330, wave: "triangle" },
  conversation: [
    { who: "Preston", text: "Did you  lift today? " },
    {
      who: "Nick",
      text: "Yes, Bitsh!!!!",
    },
    { who: "Preston", text: "How much you lift ? " },
    { who: "Nick", text: "95Lb incline chest! " },
    { who: "Preston", text: "That's my Nigga" },
  ],
  nameTag: true,
  wander: false,
  interactionRange: 110,
});
