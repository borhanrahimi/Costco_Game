// Amanda works Membership. Appearance can be refined from a photo later.
Game.addCharacter({
  name: "Amanda",
  role: "Membership",
  // Stand on the visible aisle side of the wide Membership counter artwork.
  position: { x: 113, y: 70, facing: "left" },
  look: {
    ...Outfit.staff,
    hair: "#493025", skin: "#dca485",
    longHair: true,
    shirt: "#eee8df", badge: true,
    heightScale: .78, widthScale: 1.3,
  },
  voice: { pitch: 430, wave: "triangle" },
  afterConversationThought: ["TORTA!", "Idk how I did TORTA!"],
  interactionRange: 110,
  conversation: [
    { who: "Amanda", text: "Oh. You. Is your membership expired, or are you just checking on me?" },
    { who: "Preston", text: "I work here, Amanda. I was literally walking past." },
    { who: "Amanda", text: "Right. You always were good at walking away." },
    { who: "Preston", text: "...We're doing this next to the membership printer?" },
    { who: "Amanda", text: "Relax. It handles rejection better than you do." },
    { who: "Preston", text: "Okay. Hope your shift goes good." },
    { who: "Amanda", text: "It was going great about thirty seconds ago." },
    { who: "Preston", text: "Cool. Very normal conversation. I'm leaving now." },
    { who: "Amanda", text: "And yet you'll find a reason to walk past again." },
  ],
  calloutRange: 140,
  callouts: [
    "Oh, great. My favorite awkward coworker.",
    "Just keep walking, Preston. We're both good at that.",
    "It's a membership desk, not a second-chance desk.",
    "You can stop pretending you didn't see me.",
  ],
  nameTag: true,
  wander: false,
});
