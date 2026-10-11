// core.js — the shared "Game" object that the map and character files plug into.
// Map files call Game.setMap(...), Preston's file calls Game.setPlayer(...),
// and every other character file calls Game.addCharacter(...).

window.Game = {
  TS: 32,              // size of one map square in pixels (drawn at double detail)
  map: null,
  player: null,
  characters: [],
  stations: [],
  vehicles: [],

  setMap(def)       { this.map = def; },
  setPlayer(def)    { this.player = def; },
  addCharacter(def) {
    if (!def || !def.name) { console.warn("A character file is missing a name:", def); return; }
    this.characters.push(def);
  },
  // Things you can walk up to and use, like the food court counter (see stations/).
  addStation(def)   { this.stations.push(def); },
  // Things Preston can hop on and drive, like the forklift (see vehicles/).
  addVehicle(def)   { this.vehicles.push(def); },
};

// Colors you can use in a look. Index 0 is the first one.
window.Colors = {
  skin: ["#f1c7a3", "#d9a27a", "#c98d63", "#b97a52", "#8a5536", "#5e3a24"],
  hair: ["#2a1b12", "#5b3a22", "#c9a25a", "#161616", "#8a4b2a", "#a5a5a5", "#d8d0c0"],
};

// Starting outfits. In a character file use:  look: { ...Outfit.staff, skin: Colors.skin[3] }
// Then change any part you want.
// Every employee outfit comes with a name badge (badge: true). Members don't have one.
window.Outfit = {
  staff:      { hair: "#2a1b12", skin: "#d9a27a", shirt: "#ecebe6", vest: "#d8352a", pants: "#2d3447", badge: true },
  supervisor: { hair: "#2a1b12", skin: "#d9a27a", shirt: "#2f4f8a", vest: "#d8352a", pants: "#2d3447", badge: true },
  manager:    { hair: "#2a1b12", skin: "#d9a27a", shirt: "#f4f4f2", vest: null, tie: "#2c4a7a", pants: "#2d3447", badge: true },
  forklift:   { hair: "#2a1b12", skin: "#d9a27a", shirt: "#ecebe6", vest: "#c6e03a", pants: "#2d3447", badge: true },
  kitchen:    { hair: "#2a1b12", skin: "#d9a27a", shirt: "#f6f6f3", vest: null, apron: "#dcdcd6", cap: "#f6f6f3", pants: "#2d3447", badge: true },
  pharmacy:   { hair: "#2a1b12", skin: "#d9a27a", shirt: "#f6f6f3", vest: null, pants: "#4a4f5c", badge: true },
  member:     { hair: "#2a1b12", skin: "#d9a27a", shirt: "#5e8f5a", vest: null, pants: "#3f5f8a", badge: false },
};
