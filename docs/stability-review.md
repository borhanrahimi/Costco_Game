# Version 0.1 stability review

## Architecture and scope

The shared `Game` object registers one map, Preston, employees, stations and vehicles. `tiles.js` caches procedural floor/object/fixture canvases; `sprites.js` draws people, signs and the directional forklift. `input.js` owns keyboard and pointer input. `game.js` owns the fixed-step loop, depth-sorted rendering, camera, collision, dialogue, menus and localStorage saves. Definitions load before the runtime in `index.html`. No dependencies or native changes were added.

The active warehouse is **136 × 90**, with a temporary simplified editing pass at the end of `warehouse.js`. Earlier generation code is deliberately cleared by that pass. No department, fixture, doorway, wall or spawn coordinate was moved or restored. Existing conversations, portraits and outfits remain intact. Existing hot dog and energy drink behavior is preserved.

## Changes

- Forklift ground collision now includes directional wheels/body/forks instead of a 30 × 12 foot box. Turns require clearance. Movement uses short collision steps, including when boosted.
- Exiting checks against the current parked vehicle, with candidate positions beyond its footprint. Fully obstructed exits keep Preston aboard.
- Version-1 saves now also retain vehicle parking positions and whether Preston is driving. Older saves still load; invalid coordinates are rejected. Non-finite hot dog counts are ignored.
- Action keys ignore keyboard repeat. Dialogue opening, vehicle transitions, focus loss and app hiding reset movement input. The joystick captures its pointer.
- The touch action button indicates NEXT, ENTER or EXIT as applicable and remains available in vehicle-only maps.
- TV displays and employee lockers now block movement; their former `solid:false` settings had no underlying solid tiles.
- Narrow-screen dialogue uses smaller portraits and more text width; the MAP button has a 44px minimum height. Overlay padding respects top/bottom safe areas. Orientation stays unrestricted.
- Removed Google Fonts requests; existing local system font fallbacks work offline. Capacitor configuration is unchanged.

## Map status and reference review

Implemented sections retained: southeast entrance/exit frontage, membership, food court counter/kiosks/seating, MPU, office, break room, restrooms, tire annex, checkout/self-checkout, optical/hearing, TV/washer/jewelry displays, locker row and the south rack run. Their presence and approach connectivity are checked; visual accuracy is **not** certified as complete.

`design/warehouse-map.drawio.png` is explicitly an editable sample map. It supports broad department relationships, but does not confirm exact north-up positions or detailed fixtures in the current editing view. No detailed fixture photos or markup resolving those positions are available here. Receiving, production departments, produce, grocery/freezers, clothing, seasonal and pharmacy remain cleared or incomplete pending reference confirmation. Do not remove the simplified pass to restore them automatically.

Review items:

- Existing bollard/cart-corral footprint overlap at `(114,88)`. Kept in place to preserve approved coordinates. The test explicitly allows this one overlap with a warning and rejects new solid-prop overlaps.
- `characters/mama-king.js` is retained but not registered in `index.html`. Confirm whether and where she should appear before enabling her.
- Rotated fixture art (notably the hearing desk) rotates image height as well as floor depth. Inspect its visual projection against its declared footprint before changing artwork or dimensions.
- Preston's thoughts and Borhan's/Mama King's dialogue contain racial slurs; Carlos's dialogue contains profanity. Text is unchanged. Review suitability separately before any distribution submission.

## Validation

Run `npm test` for dependency-free Node VM checks loading the actual browser scripts in HTML order. Checks cover rectangular rows, known tiles/fixtures, fixture artwork generation, bounds, solid fixture overlaps, portrait/sound assets, spawn footprints, tile-level flood-fill reachability, marked doorways and station approaches, complete employee conversation advancement/closure, vehicle boarding/exiting, fully blocked exit rejection, high-speed collision, walls/employees, vehicle save/reload including driving, focus reset and repeated action keys.

The VM uses DOM/canvas stubs: it does **not** verify rendered pixels, browser event delivery, camera feel, sound playback or actual multitouch. Reachability is tile-based for walking and does not prove forklift access through every aisle. `npm run bundle` checks the shareable HTML build; `git diff --check` checks patch whitespace.

Manual browser checklist:

1. Open `www/index.html`, clock in, walk all retained departments and both exterior doors. Inspect wall seams, rotated fixtures, seating, conveyors and self-checkout at desktop and narrow portrait/landscape sizes.
2. Approach Borhan and Carlos; use Space/E and TALK, reveal/advance every line, close and walk again. Confirm faces, portraits, full text and sounds.
3. Board the forklift, turn near obstacles, reverse, drive past employees and park near walls. Try blocked exits and verify the camera and ENTER/EXIT prompts. Reload while walking and driving.
4. Hold movement, switch apps/tabs, return and verify no unintended motion. Use joystick and action button simultaneously on a touch device. Check safe-area padding and readable long dialogue.
5. Disable networking and verify startup, portraits and saved progress. Local system fonts will differ from the former web fonts.

No real browser automation or iPhone hardware verification was available during this pass. Native iOS setup and App Store release were not attempted.

## Run and iPhone follow-up

Open `www/index.html` directly, or run `python3 -m http.server 8080 --directory www` and visit `http://localhost:8080`. Use WASD/arrows, Space/E to interact, and M for the map. Run `npm run bundle` to regenerate `dist/prestons-shift.html` after edits.

After browser/manual checks pass, follow the existing README Capacitor setup, sync `www` with `npm run ios:sync`, and run via Xcode on an iPhone. Verify WKWebView persistence across app restarts, multitouch, audio unlock, notch/home-indicator safe areas, offline operation and both orientations. Capacitor packages are not currently declared; installing them and generating native projects is deferred until browser acceptance.

## Subsequent iOS setup

Capacitor dependencies and the native Xcode project have since been added. The unsigned iPhone build passed; follow [iPhone testing](iphone-testing.md) for signing and device acceptance. This supersedes the deferred setup status above.
