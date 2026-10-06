const grid = document.getElementById('grid');
const tagsEl = document.getElementById('tags');
const search = document.getElementById('q');
const empty = document.getElementById('empty');
const note = document.getElementById('status-note');

// Inside a Discord Activity (opened with frame_id) the iframe cannot navigate to other sites, so links open outside Discord.
const inActivity = new URLSearchParams(location.search).has('frame_id');
let sdk = null;
function openOutside(url) {
  return (event) => {
    if (!sdk) return;
    event.preventDefault();
    sdk.commands.openExternalLink({ url }).catch(() => {});
  };
}

let games = [];
let state = new Map();
let activeTag = '';

const el = (tag, props = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
};

const STATUS = { up: 'Online', down: 'Offline', unknown: 'Checking' };

function card(game) {
  const s = state.get(game.slug);
  const status = s ? (s.up ? 'up' : 'down') : 'unknown';
  const dot = el('span', { className: 'dot' });
  dot.dataset.state = status;
  const art = el('img', { className: 'hub-art', src: game.art ?? `/brand/games/${game.slug}.png`, alt: '', width: 160, height: 160, loading: 'lazy', decoding: 'async' });
  const tags = el('ul', { className: 'hub-chips' }, ...(game.tags ?? []).map((t) => el('li', {}, t)));
  const link = el('a', { className: 'hub-card', href: game.url, rel: 'noopener' },
    el('span', { className: 'hub-art-wrap' }, art),
    el('div', { className: 'hub-body' },
      el('h2', {}, game.name),
      el('p', {}, game.tagline),
      tags,
      el('div', { className: 'hub-foot-row' },
        el('span', { className: 'hub-status' }, dot, STATUS[status]),
        el('span', { className: 'play' }, 'Play →'))));
  link.dataset.game = game.slug;
  // CSP forbids style attributes in markup; the CSSOM is allowed.
  if (/^#[0-9a-f]{6}$/i.test(game.accent ?? '')) link.style.setProperty('--accent', game.accent);
  link.setAttribute('aria-label', `Play ${game.name}`);
  link.addEventListener('click', openOutside(game.url));
  const kids = [link];
  if (/^\d{17,20}$/.test(game.discordAppId ?? '')) {
    // Guild install: anyone with Manage Server can add the game to their own server (it only requests the slash-command scope).
    const add = el('a', { className: 'hub-add', rel: 'noopener', target: '_blank', href: `https://discord.com/oauth2/authorize?client_id=${game.discordAppId}&scope=applications.commands&integration_type=0` }, 'Add to a Discord server');
    add.setAttribute('aria-label', `Add ${game.name} to a Discord server`);
    add.addEventListener('click', openOutside(add.href));
    kids.push(add);
  }
  return el('li', { className: 'hub-item' }, ...kids);
}

function render() {
  const q = search.value.trim().toLowerCase();
  const shown = games.filter((g) =>
    (!activeTag || g.tags?.includes(activeTag)) &&
    (!q || `${g.name} ${g.tagline} ${g.tags?.join(' ') ?? ''}`.toLowerCase().includes(q)));
  grid.replaceChildren(...shown.map(card));
  empty.hidden = shown.length > 0;
}

function renderTags() {
  const tags = [...new Set(games.flatMap((g) => g.tags ?? []))].sort();
  const button = (label, value) => {
    const b = el('button', { type: 'button' }, label);
    b.setAttribute('aria-pressed', String(activeTag === value));
    b.addEventListener('click', () => {
      activeTag = value;
      for (const other of tagsEl.children) other.setAttribute('aria-pressed', String(other === b));
      render();
    });
    return b;
  };
  tagsEl.replaceChildren(button('All', ''), ...tags.map((t) => button(t, t)));
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function loadStatus() {
  try {
    const { games: results } = await getJson('/api/status');
    state = new Map(results.map((r) => [r.slug, r]));
    const up = results.filter((r) => r.up).length;
    note.textContent = `${up} of ${results.length} games online`;
    render();
  } catch {
    note.textContent = 'Status unavailable';
  }
}

search.addEventListener('input', render);

if (inActivity) {
  document.getElementById('activity-note').hidden = false;
  try {
    const { DiscordSDK } = await import('/vendor/discord-embedded-app-sdk.js');
    const { clientId } = await getJson('/api/activity/config');
    sdk = new DiscordSDK(clientId);
    await sdk.ready();
  } catch {
    // Without the SDK the page still lists the games; links just open normally.
    sdk = null;
  }
}

try {
  games = (await getJson('/api/games')).games;
  renderTags();
  render();
  loadStatus();
} catch {
  grid.replaceChildren(el('li', { className: 'hub-empty' }, 'Could not load the game list. Refresh to try again.'));
  note.textContent = '';
}
