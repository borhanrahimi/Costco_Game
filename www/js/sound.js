// sound.js — little "voice" blips while someone talks, plus optional real sound files.
// A character's voice in their file: voice: { pitch: 520, wave: "square" }
//   pitch: higher number = higher voice (try 200 to 900)
//   wave:  "square" (buzzy), "triangle" (soft), "sawtooth" (harsh), "sine" (smooth)
// A line can also play a recorded clip: { who: "Borhan", text: "...", sound: "sounds/borhan-torta.m4a" }

window.Sound = (() => {
  let actx = null;
  let clip = null;

  function unlock(){
    if (!actx){ try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
    if (actx && actx.state === "suspended") actx.resume();
  }

  function beep(freq, dur = 0.05, type = "square", vol = 0.03){
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur);
  }

  // One blip of a character's voice (called while the text types out).
  function voice(v = {}){
    const pitch = v.pitch || 440;
    beep(pitch * (0.9 + Math.random() * 0.2), 0.03, v.wave || "square", 0.018);
  }

  // Play a recorded file like "sounds/borhan-torta.m4a". Returns true if it started.
  function playFile(src){
    try {
      if (clip){ clip.pause(); clip = null; }
      clip = new Audio(src);
      clip.play().catch(() => console.warn("Couldn't play sound file:", src));
      return true;
    } catch(e){ return false; }
  }

  function stopFile(){ if (clip){ clip.pause(); clip = null; } }

  // Electric forklift: just the beep-beep while it moves.
  const backupBeep    = () => beep(1050, .22, "square", .02);

  const talkStart = () => { beep(660, 0.06); setTimeout(() => beep(880, 0.06), 60); };
  const nextLine  = () => beep(780, 0.05);

  return { unlock, beep, voice, playFile, stopFile, talkStart, nextLine, backupBeep };
})();
