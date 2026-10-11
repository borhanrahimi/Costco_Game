# Sounds

Put recorded voice clips here (`.m4a` or `.mp3` work on iPhone).

Then point a conversation line at the file in that character's file:

```js
conversation: [
  { who: "Preston", text: "Bald dude!!",   sound: "sounds/preston-bald-dude.m4a" },
  { who: "Borhan",  text: "TORTA LOVER!!", sound: "sounds/borhan-torta-lover.m4a" },
],
```

Lines without a `sound` use that character's beep voice (`voice: { pitch, wave }`).

Tip: record on your iPhone with Voice Memos, share it to your Mac, and rename it with no spaces.
