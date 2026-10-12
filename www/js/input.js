// input.js — keyboard on a computer, joystick + TALK button on a phone.
// game.js fills in the onAction / onMap / onStart handlers.

window.Input = (() => {
  const $ = id => document.getElementById(id);
  const keys = { up:false, down:false, left:false, right:false };
  const stick = { id:null, ox:0, oy:0, dx:0, dy:0 };
  const api = { keys, stick, onAction(){}, onMap(){}, onStart(){}, isPlaying: () => false, isTalking: () => false, reset };

  const keyMap = { ArrowUp:"up", KeyW:"up", ArrowDown:"down", KeyS:"down", ArrowLeft:"left", KeyA:"left", ArrowRight:"right", KeyD:"right" };

  addEventListener("keydown", e => {
    if (!api.isPlaying() && e.target.tagName === "BUTTON") return;   // let Enter/Space press menu buttons
    if (e.code === "KeyM"){ if (!e.repeat) api.onMap(); return; }
    if (["Space","KeyE","Enter"].includes(e.code)){ e.preventDefault(); Sound.unlock(); if (!e.repeat) api.onAction(); return; }
    const k = keyMap[e.code]; if (k){ e.preventDefault(); keys[k] = true; }
  });
  addEventListener("keyup", e => { const k = keyMap[e.code]; if (k) keys[k] = false; });

  // Joystick: touch anywhere and drag.
  const stickEl = $("stick"), knobEl = $("knob");
  $("touch").addEventListener("pointerdown", e => {
    Sound.unlock();
    if (!api.isPlaying()) return;
    if (api.isTalking()){ api.onAction(); return; }
    if (stick.id !== null) return;
    stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY; stick.dx = stick.dy = 0;
    $("touch").setPointerCapture(e.pointerId);
    const r = $("stage").getBoundingClientRect();
    stickEl.style.left = (e.clientX - r.left) + "px"; stickEl.style.top = (e.clientY - r.top) + "px";
    knobEl.style.transform = "translate(0,0)"; stickEl.hidden = false;
  });
  addEventListener("pointermove", e => {
    if (e.pointerId !== stick.id) return;
    let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy;
    const d = Math.hypot(dx, dy), max = 40;
    if (d > max){ dx = dx/d*max; dy = dy/d*max; }
    stick.dx = dx/max; stick.dy = dy/max;
    knobEl.style.transform = `translate(${dx}px,${dy}px)`;
  });
  const endStick = e => { if (e.pointerId === stick.id){ stick.id = null; stick.dx = stick.dy = 0; stickEl.hidden = true; } };
  addEventListener("pointerup", endStick);
  addEventListener("pointercancel", endStick);

  $("talkBtn").addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); Sound.unlock(); api.onAction(); });
  $("dialog").addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); api.onAction(); });

  // Stop iPhone zoom / scroll gestures from moving the page.
  document.addEventListener("gesturestart", e => e.preventDefault());
  document.addEventListener("touchmove", e => e.preventDefault(), { passive:false });

  function reset(){
    stick.id = null; stick.dx = stick.dy = 0; stickEl.hidden = true;
    for (const k in keys) keys[k] = false;
  }

  return api;
})();
