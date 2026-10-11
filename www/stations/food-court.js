// stations/food-court.js — THE FAMOUS $1.50 HOT DOG
// A station is something Preston can walk up to and use (no person needed).
// Walk up to the food court counter and tap TALK to buy a hot dog + soda.
// Each hot dog gets added to the counter at the top and gives Preston
// a short speed boost.

Game.addStation({
  name: "Food Court",
  position: { x: 113, y: 50 },      // north-up plan: pickup on the east-side food court
  marker: "hotdog",                 // little hot dog floating over the counter
  action: "hotdog",                 // what happens after the conversation
  price: 1.50,

  conversation: [
    { who: "Food Court", text: "Hot dog and a soda, $1.50. Same price since 1985!" },
    { who: "Preston",    text: "One hot dog combo, please!" },
    { who: "Food Court", text: "Here you go. Ketchup and mustard are on the side." },
  ],

  // Shown after Preston eats it.
  afterwards: "Hot dog power! Preston walks faster for 15 seconds.",
  boostSeconds: 15,
});
