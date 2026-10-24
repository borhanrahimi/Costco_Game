// Erik supervises the front end with a bossy, theatrical delivery.
Game.addCharacter({
  name: "Erik",
  role: "Supervisor",
  portrait: "characters/portraits/erik-64.png",
  portraitLarge: "characters/portraits/erik-128.png",
  position: { x: 96, y: 51, facing: "up" },
  look: {
    ...Outfit.supervisor,
    hair: "#8a7057", skin: "#edb59d",
    sideSwept: true, friendlySmile: true, collared: true,
    shirt: "#58657b", badge: true,
    commandGesture: true,
    theatricalBoss: true,
  },
  voice: { pitch: 230, wave: "sawtooth" },
  randomCalloutConversation: true,
  conversation: [
    { who: "Erik", text: "Get back to work, kidss!" },
  ],
  // Short catchphrases documented in archived White House remarks.
  // https://trumpwhitehouse.archives.gov/briefings-statements/remarks-president-trump-american-veterans-amvets-75th-national-convention-louisville-ky/
  // https://www.govinfo.gov/content/pkg/DCPD-201900041/pdf/DCPD-201900041.pdf
  callouts: [
    "Get back to work, kidss!",
    "You're fired!",
    "Believe me.",
    "Make America great again!",
  ],
  nameTag: true,
  wander: true,
  patrol: [{x:96,y:51},{x:96,y:45}],
  patrolPause: 6,
  walkSpeed: 42,
});
