// stations/food-court.js — THE FAMOUS $1.50 HOT DOG
// A station is something Preston can walk up to and use (no person needed).
// Walk up to the food court counter and tap TALK to buy a hot dog + soda.
// Each hot dog gets added to the counter at the top and gives Preston
// a short speed boost.

Game.addStation({
  name: "Food Court Kiosk",
  position: { x: 113, y: 51 },      // center of the connected six-kiosk station
  marker: "hotdog",                 // ordering marker above the kiosk
  action: "hotdog",                 // what happens after the conversation
  price: 1.50,

  conversation: [
    { who: "Food Court Kiosk", text: "Hot dog and a soda, $1.50. Tap to add it to your order." },
    { who: "Preston",    text: "One hot dog combo, please!" },
    { who: "Food Court Kiosk", text: "Order placed! Pick it up at the counter." },
  ],

  // Shown after Preston eats it.
  afterwards: "Hot dog power! Preston walks faster for 15 seconds.",
  boostSeconds: 15,
});
