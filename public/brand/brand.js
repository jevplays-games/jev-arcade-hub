/* jevplay.games shared header behaviour. Zero dependencies, no build step.
   Wires the overflow sheet: open/close, scrim, Escape, focus into the sheet,
   focus return, and a focus trap while open; points the brand link at the hub.
   Games import this once; everything else is CSS. The hub repo owns this file:
   change it there and copy it to every game byte for byte. */

const sheet = document.getElementById('jv-sheet');
const scrim = document.getElementById('jv-scrim');
const button = document.getElementById('jv-menu');
let lastFocus = null;

function focusables() {
  return sheet ? [...sheet.querySelectorAll('button,a[href],select,input,[tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && el.getClientRects().length > 0) : [];
}

export function closeSheet() {
  if (!sheet || !sheet.classList.contains('is-open')) return;
  sheet.classList.remove('is-open');
  scrim?.classList.remove('is-open');
  button?.setAttribute('aria-expanded', 'false');
  lastFocus?.focus();
  lastFocus = null;
}

export function openSheet() {
  if (!sheet) return;
  lastFocus = document.activeElement;
  sheet.classList.add('is-open');
  scrim?.classList.add('is-open');
  button?.setAttribute('aria-expanded', 'true');
  /* brand.css makes the open sheet visible at once; a sheet with nothing focusable takes focus itself. */
  const first = focusables()[0];
  if (first) first.focus();
  else { sheet.setAttribute('tabindex', '-1'); sheet.focus(); }
}

button?.addEventListener('click', () => {
  sheet?.classList.contains('is-open') ? closeSheet() : openSheet();
});
scrim?.addEventListener('click', closeSheet);

/* Any action inside the sheet dismisses it, so a tap never leaves it covering the board. */
sheet?.addEventListener('click', (event) => {
  if (event.target.closest('.jv-sheet-item')) closeSheet();
});

document.addEventListener('keydown', (event) => {
  if (!sheet?.classList.contains('is-open')) return;
  if (event.key === 'Escape') { event.preventDefault(); closeSheet(); return; }
  if (event.key !== 'Tab') return;
  const items = focusables();
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

/* ---- Desktop relocation -------------------------------------------------
   #jv-controls holds the nav tabs and account controls. It is authored inside
   #jv-sheet; above 900px it MOVES into the header, before the menu button.

   A move, not a clone: ids stay unique and listeners stay attached, because
   they are bound to the nodes rather than to their position in the tree.

   Why JS: .jv-header has backdrop-filter, so it is the containing block for
   any fixed-position descendant, and the sheet must be fixed on mobile. No CSS
   property can relocate a child of a sibling into the header. Moving the node
   makes it a static flex child, so nothing is fixed and nothing needs a
   hand-guessed offset. */
const controls = document.getElementById('jv-controls');
const header = document.querySelector('.jv-header');
const wide = matchMedia('(min-width:900px)');

function placeControls() {
  if (!controls || !header || !sheet) return;
  if (wide.matches) {
    if (controls.parentElement !== header) header.insertBefore(controls, button);
    /* Not a dialog when its contents render inline in the header. */
    sheet.removeAttribute('role');
    sheet.removeAttribute('aria-modal');
    closeSheet();
  } else {
    if (controls.parentElement !== sheet) sheet.appendChild(controls);
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
  }
}

wide.addEventListener('change', placeControls);
placeControls();

/* ---- Brand link ----------------------------------------------------------
   "jevplay.games home" goes to the hub, not to the game's own root. Inside a
   Discord Activity (a frame) the link is left alone: Discord blocks top-level
   navigation to other origins, so the game's root is the only home there. */
export const HUB_URL = 'https://jevplay.games/';
const brand = document.querySelector('.jv-brand');
if (brand && window.top === window.self) brand.setAttribute('href', HUB_URL);
