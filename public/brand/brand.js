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
  /* Focus goes back to the menu button that opened the sheet, not to whatever had focus before (Safari does not
     focus a tapped button, so that can be a control far down the page), and never scrolls: the button sits in the
     sticky header. lastFocus covers a sheet closed because the header became wide and the button is hidden. */
  const target = button && button.getClientRects().length > 0 ? button : lastFocus;
  target?.focus({ preventScroll: true });
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

/* ---- Keyboard focus below the sticky header ------------------------------
   brand.css gives everything focusable in .jv-main a scroll-margin-top, which covers every focus the browser
   scrolls to. A control already inside the viewport but under the header is not scrolled at all, so keyboard
   focus could rest behind the header (WCAG 2.2 SC 2.4.11). Nudge the page just far enough. Pointer focus, the
   header, the sheet, the skip link, dialogs, fixed layers and layers stuck to the top never move it (scrolling
   cannot move those); a panel stuck to the bottom still scrolls with the page here, so it is not skipped. */
const stickyHeader = document.querySelector('.jv-header');
document.addEventListener('focusin', (event) => {
  const el = event.target;
  if (!stickyHeader || !(el instanceof Element) || !el.matches(':focus-visible')) return;
  if (el.closest('.jv-header,#jv-sheet,.jv-skip,dialog')) return;
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.position === 'fixed' || (style.position === 'sticky' && style.top !== 'auto')) return;
  }
  const clear = stickyHeader.getBoundingClientRect().bottom + 8;
  const box = el.getBoundingClientRect();
  if (box.height > 0 && box.top < clear && box.bottom > 0) window.scrollBy(0, box.top - clear);
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
