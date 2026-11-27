// The Hush online (only in the published copy; tools/build_site.py adds it to index.html with window.HUSH_BUILD).
// • Offline play and automatic updates through the service worker (sw.js): the first visit stores the game; after that it opens
//   without the internet, and each new version downloads in the background (only the files that changed).
// • When a new version is ready, a little card offers "Restart now" (it saves first) or "Later" (it's there the next time you open the
//   game). After an update, the title screen says which version you're on.
// • The version in the title screen's corner, and a request that the browser keep the saves (navigator.storage.persist).
(() => {
  const B = window.HUSH_BUILD || {}, VER = B.version || '';
  const $ = id => document.getElementById(id);
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* */ } } };

  // ------------------------------------------------------------ the look (the game's paper and ink)
  const css = document.createElement('style');
  css.textContent = `
    #hush-upd { position: fixed; left: 14px; bottom: 56px; z-index: 99999; max-width: 330px; background: #fffaf0; color: #2b2235; border: 2.5px solid #2b2235;
      border-radius: 14px; box-shadow: 0 4px 0 rgba(43,34,53,.25); padding: 10px 12px; font: 600 13px "Segoe UI", system-ui, sans-serif; }
    #hush-upd b { display: block; font-size: 14px; margin-bottom: 2px; }
    #hush-upd .row { display: flex; gap: 8px; margin-top: 8px; }
    #hush-upd button { font: 800 13px "Segoe UI", system-ui, sans-serif; border: 2.5px solid #2b2235; border-radius: 10px; padding: 4px 12px; cursor: pointer; background: #fffaf0; color: #2b2235; }
    #hush-upd button.go { background: #21a493; color: #fff; }
    #hush-upd button:hover, #hush-upd button:focus { outline: none; box-shadow: 0 0 0 3px #21a493; }
    #hush-ver { margin-left: auto; opacity: .75; font-weight: 700; }
    #hush-note { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 99999; background: #fffaf0; color: #2b2235; border: 2.5px solid #2b2235;
      border-radius: 12px; padding: 6px 14px; font: 700 13px "Segoe UI", system-ui, sans-serif; box-shadow: 0 4px 0 rgba(43,34,53,.25); transition: opacity .5s; }`;
  document.head.appendChild(css);

  // On a Mac the game's Windows fonts aren't there: stand-ins that look alike (DIN for Bahnschrift, Helvetica Neue for Segoe UI,
  // Apple Symbols for Segoe UI Symbol). A name the Mac doesn't have just falls through to the next font in each list, as before.
  if (/Mac|iPhone|iPad|iPod/.test(navigator.platform || '') || /Mac OS X/.test(navigator.userAgent || '')) {
    const mac = document.createElement('style');
    mac.textContent = `
      @font-face { font-family: "Bahnschrift"; src: local("DINAlternate-Bold"), local("DIN Alternate Bold"), local("DIN Alternate"); font-weight: 100 1000; }
      @font-face { font-family: "Segoe UI"; src: local("HelveticaNeue"), local("Helvetica Neue"); font-weight: 100 450; }
      @font-face { font-family: "Segoe UI"; src: local("HelveticaNeue-Medium"), local("Helvetica Neue Medium"); font-weight: 451 650; }
      @font-face { font-family: "Segoe UI"; src: local("HelveticaNeue-Bold"), local("Helvetica Neue Bold"); font-weight: 651 1000; }
      @font-face { font-family: "Segoe UI Symbol"; src: local("AppleSymbols"), local("Apple Symbols"); }`;
    document.head.appendChild(mac);
  }

  function note(text, secs = 5) {
    let el = $('hush-note'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'hush-note'; el.textContent = text; document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, secs * 1000);
  }
  // the version in the title screen's footer (shown for as long as the title is up)
  function showVersion() {
    if (!VER) return;
    const tick = () => { const f = document.querySelector('#title .tl-foot'); if (f && !$('hush-ver')) { const s = document.createElement('span'); s.id = 'hush-ver'; s.textContent = 'v' + VER; f.appendChild(s); } };
    tick(); setInterval(tick, 2000);
  }
  // just updated? say so once
  function greet() {
    const seen = LS.get('hush.version');
    if (VER && seen && seen !== VER) note(`✨ The Hush is up to date: version ${VER}`, 6);
    if (VER) LS.set('hush.version', VER);
  }

  // ------------------------------------------------------------ "a new version is ready"
  let reg = null, shown = false, asked = false, reloading = false;
  function offer(w) {
    if (shown || !w) return; shown = true;
    const el = document.createElement('div'); el.id = 'hush-upd';
    el.innerHTML = '<b>✨ A new version of The Hush is ready</b>It has the latest fixes and additions. Restarting saves your game first.'
      + '<div class="row"><button class="go" data-a="now">Restart now</button><button data-a="later">Later</button></div>';
    el.addEventListener('click', ev => {
      const a = ev.target && ev.target.dataset && ev.target.dataset.a; if (!a) return;
      ev.stopPropagation();
      if (a === 'later') { el.remove(); note('It will be there the next time you open The Hush.', 4); return; }
      try { if (!document.body.classList.contains('on-title') && window.UI && UI.onSaveNow) UI.onSaveNow(); } catch (e) { /* (the game saves itself often anyway) */ }
      asked = true; el.querySelector('b').textContent = 'Restarting…';
      setTimeout(() => { try { (reg && reg.waiting ? reg.waiting : w).postMessage('hush:skip'); } catch (e) { location.reload(); } }, 400);
      setTimeout(() => { if (!reloading) location.reload(); }, 6000);      // (if the switch never comes, reload anyway)
    });
    // (keys pressed on the card shouldn't move the game)
    el.addEventListener('keydown', ev => ev.stopPropagation());
    document.body.appendChild(el);
  }
  function watch(r) {
    reg = r;
    if (r.waiting && navigator.serviceWorker.controller) offer(r.waiting);
    r.addEventListener('updatefound', () => {
      const w = r.installing; if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state !== 'installed') return;
        if (navigator.serviceWorker.controller) offer(w);              // an update, waiting for a restart
        else note('✔ The Hush is saved on this computer: it now opens without the internet too.', 6);
      });
    });
    // look for a new version every 15 minutes while playing, and when the window comes back after a while
    let last = Date.now();
    const check = () => { last = Date.now(); r.update().catch(() => { /* offline: fine */ }); };
    setInterval(check, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - last > 5 * 60 * 1000) check(); });
  }
  function start() {
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
    // (only the window that pressed "Restart now" reloads; the first install's takeover changes nothing on screen)
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (asked && !reloading) { reloading = true; location.reload(); } });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(watch).catch(e => console.warn('[the hush] offline mode is off:', e));
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* */ }
  }

  showVersion(); greet();
  // (after the game is up: the first visit's downloads go to the game first)
  if (document.readyState === 'complete') setTimeout(start, 4000);
  else window.addEventListener('load', () => setTimeout(start, 4000));
})();
