// Mama King is Preston's mom, visiting as a shopping member.
(() => {
  const conversations = [
    [
      {who:"Mama King",text:"Preston! Did you eat something besides a hot dog today?"},
      {who:"Preston",text:"I had two hot dogs. That's variety."},
      {who:"Mama King",text:"I'm buying you vegetables. This isn't a negotiation."},
      {who:"Preston",text:"Mom, please. My coworkers can hear you."},
    ],
    [
      {who:"Mama King",text:"There's my baby! Come give your mom a hug."},
      {who:"Preston",text:"Mom! I'm at work. I drive heavy machinery."},
      {who:"Mama King",text:"And I still have pictures of you in dinosaur pajamas."},
      {who:"Preston",text:"Okay, okay. One hug. No pictures."},
    ],
    [
      {who:"Mama King",text:"I only came in for milk. Why is my cart already full?"},
      {who:"Preston",text:"You passed the samples, didn't you?"},
      {who:"Mama King",text:"The nice lady gave me a little cheese. I had to buy the whole tray."},
      {who:"Preston",text:"That's how they get you, Mama King."},
    ],
  ];
  Game.addCharacter({
    name:"Mama King",role:"Member / Preston's mom",
    position:{x:62,y:60,facing:"down"},
    look:{...Outfit.member,hair:"#bda17c",skin:"#f1cbb3",shirt:"#8a4fb0",pants:"#34465c",longHair:true,friendlySmile:true,badge:false},
    voice:{pitch:540,wave:"sine"},
    conversation:conversations[0],conversationVariants:conversations,
    nameTag:true,wander:true,
    patrol:[{x:62,y:60},{x:66,y:60}],patrolPause:7,walkSpeed:34,
  });
})();
