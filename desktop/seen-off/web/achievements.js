/* Seen Off - achievements hook (stub).
 * Steamworks is out of scope for now. Game code calls SeenOffAchievements.unlock(id);
 * today that records the unlock in localStorage and fires a 'seenoff:achievement' event.
 * Later, swap the body of `backend` for a Tauri command that calls Steamworks
 * (e.g. steamworks-rs: client.user_stats().achievement(id).set(); store_stats()).
 * IDs below should match the API names you create in the Steamworks partner site.
 */
(function(){
  'use strict';
  var KEY='so-ach-v1';
  var LIST={
    FIRST_BLOOD:   'Seen something off: win your first fight',
    FIRST_FAMILIAR:'A cat has noticed you: pick your first familiar',
    PIER_SOUTH:    'South Pier, seen off',
    PIER_CENTRAL:  'Central Pier, seen off',
    PIER_NORTH:    'North Pier, seen off',
    RUN_WON:       'A whole day out, seen off',
    ENCORE_1:      'Win a run on Encore 1 or higher',
    ENCORE_5:      'Win a run on Encore 5',
    PROPER_JOB:    'Proper job! Play 5 cards in one turn',
    SCENES:        'SCENES! Play 10 cards in one turn',
    FIRST_POSTCARD:'Wish you were here: your first postcard',
    FIRST_STICK:   'Pull your first stick of rock'
  };
  var got={};try{got=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}
  function backend(id){
    /* Steam hook goes here, e.g.:
       if(window.__TAURI__) window.__TAURI__.core.invoke('steam_unlock',{id:id}); */
  }
  function unlock(id){
    if(!LIST[id]||got[id])return false;
    got[id]=Date.now();
    try{localStorage.setItem(KEY,JSON.stringify(got));}catch(e){}
    try{backend(id);}catch(e){}
    try{window.dispatchEvent(new CustomEvent('seenoff:achievement',{detail:{id:id,name:LIST[id]}}));}catch(e){}
    return true;
  }
  window.SeenOffAchievements={unlock:unlock,list:function(){return LIST;},unlocked:function(){return Object.assign({},got);},
    reset:function(){got={};try{localStorage.removeItem(KEY);}catch(e){}}};
})();
