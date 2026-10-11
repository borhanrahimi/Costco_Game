// vehicles/forklift.js — Preston's forklift.
// Walk up to it and press E / Space / TALK to hop on, again to hop off.
// It's electric: no engine noise, just beep-beep while it moves, and the red
// light on the roof flashes while Preston is driving. Pressing the opposite
// way from where the forks point backs it up.

Game.addVehicle({
  name: "Forklift",
  // Where it's parked when the game starts. Needs open floor around it.
  position: { x: 110, y: 80, facing: "up" },
  speed: 1.5,          // times Preston's walking speed
});
