// Yacht Dice Deluxe - service worker. After the first visit the game opens and plays offline
// (AI and same-device matches; online matches still need the network).
// deploy.sh stamps VERSION and fills ASSETS with every sound / sprite / avatar file.
const VERSION = 'adc0056-20261123115703';
const CACHE = 'yacht-' + VERSION;
const CORE = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './CREDITS.md'];
const ASSETS = ["./av/bear.png","./av/buffalo.png","./av/chick.png","./av/chicken.png","./av/cow.png","./av/crocodile.png","./av/dog.png","./av/duck.png","./av/elephant.png","./av/frog.png","./av/giraffe.png","./av/goat.png","./av/gorilla.png","./av/hippo.png","./av/horse.png","./av/monkey.png","./av/moose.png","./av/narwhal.png","./av/owl.png","./av/panda.png","./av/parrot.png","./av/penguin.png","./av/pig.png","./av/rabbit.png","./av/rhino.png","./av/sloth.png","./av/snake.png","./av/walrus.png","./av/whale.png","./av/zebra.png","./fx/burst.png","./fx/dust.png","./fx/ember.png","./fx/flare.png","./fx/glow.png","./fx/impact.png","./fx/kaboom.png","./fx/lightning.png","./fx/magic.png","./fx/ring.png","./fx/ring_soft.png","./fx/slash.png","./fx/smoke.png","./fx/spark.png","./fx/star.png","./fx/twirl.png","./sfx/badge-1.mp3","./sfx/bonus-1.mp3","./sfx/boom-1.mp3","./sfx/boom-2.mp3","./sfx/cardflip-1.mp3","./sfx/cardflip-2.mp3","./sfx/cards-1.mp3","./sfx/cards-2.mp3","./sfx/chat-1.mp3","./sfx/chime-1.mp3","./sfx/chips-1.mp3","./sfx/chips-2.mp3","./sfx/clack-1.mp3","./sfx/clack-2.mp3","./sfx/clack-3.mp3","./sfx/clack-4.mp3","./sfx/clack-5.mp3","./sfx/clack-6.mp3","./sfx/clock-1.mp3","./sfx/coins-1.mp3","./sfx/coins-2.mp3","./sfx/combo-1.mp3","./sfx/curse-1.mp3","./sfx/deal-1.mp3","./sfx/deal-2.mp3","./sfx/deal-3.mp3","./sfx/fail-1.mp3","./sfx/fail-2.mp3","./sfx/fire-1.mp3","./sfx/flip-1.mp3","./sfx/flip-2.mp3","./sfx/hold-1.mp3","./sfx/horn-1.mp3","./sfx/joker-1.mp3","./sfx/land-1.mp3","./sfx/land-2.mp3","./sfx/lock-1.mp3","./sfx/lock-2.mp3","./sfx/magic-1.mp3","./sfx/petal-1.mp3","./sfx/pick-1.mp3","./sfx/powerup-1.mp3","./sfx/powerup-2.mp3","./sfx/prophecy-1.mp3","./sfx/reroll-1.mp3","./sfx/reroll-2.mp3","./sfx/rewind-1.mp3","./sfx/roll-1.mp3","./sfx/roll-2.mp3","./sfx/roll-3.mp3","./sfx/score_big-1.mp3","./sfx/score_big-2.mp3","./sfx/score_small-1.mp3","./sfx/score_small-2.mp3","./sfx/score_zero-1.mp3","./sfx/scribble-1.mp3","./sfx/scribble-2.mp3","./sfx/shatter-1.mp3","./sfx/shatter-2.mp3","./sfx/slam-1.mp3","./sfx/slam-2.mp3","./sfx/slam-3.mp3","./sfx/sparkle-1.mp3","./sfx/spotlight-1.mp3","./sfx/squeeze-1.mp3","./sfx/stamp-1.mp3","./sfx/stamp-2.mp3","./sfx/straight-1.mp3","./sfx/swap-1.mp3","./sfx/thud-1.mp3","./sfx/thud-2.mp3","./sfx/tick-1.mp3","./sfx/tick-2.mp3","./sfx/tier1-1.mp3","./sfx/tier2-1.mp3","./sfx/tier3-1.mp3","./sfx/trophy-1.mp3","./sfx/turn-1.mp3","./sfx/unhold-1.mp3","./sfx/win-1.mp3","./sfx/wobble-1.mp3","./sfx/yacht-1.mp3","./sfx/zap-1.mp3"];
// third-party files the game needs to start (versioned URLs, so they never change)
const CDN = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js',
  'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js',
  'https://cdn.jsdelivr.net/npm/wawa-vfx-vanilla@1.2.10/dist/index.es.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js',
  'https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Bungee&family=IBM+Plex+Sans+KR:wght@500;600;700&display=swap'
];
const IMMUTABLE = /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|fonts\.gstatic\.com|www\.gstatic\.com\/firebasejs)\//;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.concat(ASSETS));
    // best effort: a CDN hiccup must not block installing the game itself
    await Promise.allSettled(CDN.map((u) => c.add(new Request(u, { mode: 'cors', credentials: 'omit' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    // carry the fonts / CDN files over from the previous version instead of downloading them again
    const old = keys.filter((k) => k.startsWith('yacht-') && k !== CACHE);
    const cur = await caches.open(CACHE);
    for (const k of old) {
      const oc = await caches.open(k);
      for (const req of await oc.keys()) {
        if (IMMUTABLE.test(req.url) && !(await cur.match(req))) { const r = await oc.match(req); if (r) await cur.put(req, r); }
      }
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // the page: fresh when online (so a new deploy shows up right away), the cached copy when offline
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res && res.ok && url.origin === self.location.origin) c.put('./index.html', res.clone());
        return res;
      } catch (err) {
        return (await c.match('./index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }
  const same = url.origin === self.location.origin;
  const fontsCss = url.hostname === 'fonts.googleapis.com';
  if (!same && !fontsCss && !IMMUTABLE.test(req.url)) return; // Firebase / PeerJS signalling: network only
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: same });
    if (hit) {
      if (fontsCss) fetch(req).then((r) => { if (r && r.ok) c.put(req, r); }).catch(() => {});
      return hit;
    }
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});
