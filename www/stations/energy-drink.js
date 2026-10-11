// stations/energy-drink.js — white energy drink in the employee break room.

Game.addStation({
  name: "Break Room Fridge",
  role: "Employee drinks",
  position: { x: 116, y: 21 },
  marker: "whiteMonster",
  action: "energyDrink",

  conversation: [
    { who: "Break Room Fridge", text: "Cold white Monster. Employee fuel!" },
    { who: "Preston", text: "Perfect. I needed some energy." },
  ],

  afterwards: "Monster mode! Preston gets bulky and moves 3× faster for 30 seconds.",
  boostSeconds: 30,
});
