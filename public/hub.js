const grid = document.getElementById('grid');
const tagsEl = document.getElementById('tags');
const search = document.getElementById('q');
const empty = document.getElementById('empty');
const note = document.getElementById('status-note');

let games = [];
let state = new Map();
let activeTag = '';

const el = (tag, props = {}, ...kids) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...kids);
  return node;
};

function card(game) {
  const s = state.get(game.slug);
  const dot = el('span', { className: 'dot' });
  dot.dataset.state = s ? (s.up ? 'up' : 'down') : 'unknown';
  dot.title = s ? (s.up ? 'Online' : 'Not responding') : 'Status unknown';
  const link = el('a', { className: 'hub-card', href: game.url, rel: 'noopener' },
    el('h2', {}, game.name),
    el('p', {}, game.tagline),
    el('footer', {}, el('span', { className: 'host' }, dot, new URL(game.url).host), el('span', { className: 'play' }, 'Play →')));
  link.setAttribute('aria-label', `Play ${game.name}`);
  const kids = [link];
  if (/^\d{17,20}$/.test(game.discordAppId ?? '')) {
    // Guild install: anyone with Manage Server can add the game to their own server (it only requests the slash-command scope).
    const add = el('a', { className: 'hub-add', rel: 'noopener', target: '_blank', href: `https://discord.com/oauth2/authorize?client_id=${game.discordAppId}&scope=applications.commands&integration_type=0` }, 'Add to a Discord server');
    add.setAttribute('aria-label', `Add ${game.name} to a Discord server`);
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

try {
  games = (await getJson('/api/games')).games;
  renderTags();
  render();
  loadStatus();
} catch {
  grid.replaceChildren(el('li', { className: 'hub-empty' }, 'Could not load the game list. Refresh to try again.'));
  note.textContent = '';
}
