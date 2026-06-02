/**
 * js/render.js
 * Responsibility: Renders the requirements table and the stakeholder table
 * plus the 2×2 influence/interest grid. No DOM dependencies except containers
 * passed in as arguments.
 */

const PRIORITY_BADGE = {
  must:   { label: 'Must Have',   cls: 'badge-must' },
  should: { label: 'Should Have', cls: 'badge-should' },
  could:  { label: 'Could Have',  cls: 'badge-could' }
};

const LEVEL_CLS = {
  high:   'level-high',
  medium: 'level-medium',
  low:    'level-low'
};

const ACTION_LABEL = {
  manage_closely:  'Manage Closely',
  keep_informed:   'Keep Informed',
  keep_satisfied:  'Keep Satisfied',
  monitor:         'Monitor'
};

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderRequirements(requirements, containerEl) {
  if (!requirements || requirements.length === 0) {
    containerEl.innerHTML = '<p class="empty-state">No requirements data available.</p>';
    return;
  }

  // Update count heading if it exists
  const countEl = document.getElementById('requirements-count');
  if (countEl) countEl.textContent = `${requirements.length} requirements identified`;

  const table = document.createElement('table');
  table.className = 'data-table requirements-table';
  table.setAttribute('id', 'requirements-table-el');

  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>Priority</th>
        <th>Category</th>
        <th>Requirement</th>
        <th>Notes</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  requirements.forEach((req, i) => {
    const badge = PRIORITY_BADGE[req.priority] || PRIORITY_BADGE.could;
    const priorityEmoji = req.priority === 'must' ? '🔴' : req.priority === 'should' ? '🟡' : '🟢';

    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'row-even' : 'row-odd';
    tr.innerHTML = `
      <td class="req-id"><code>${escapeHTML(req.id)}</code></td>
      <td><span class="badge ${badge.cls}">${priorityEmoji} ${escapeHTML(badge.label)}</span></td>
      <td><span class="category-tag">${escapeHTML(req.category)}</span></td>
      <td class="req-text">${escapeHTML(req.requirement)}</td>
      <td class="req-notes">${escapeHTML(req.notes || '—')}</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  containerEl.innerHTML = '';
  containerEl.appendChild(table);
}

function renderStakeholders(stakeholders, containerEl, gridEl) {
  if (!stakeholders || stakeholders.length === 0) {
    containerEl.innerHTML = '<p class="empty-state">No stakeholder data available.</p>';
    if (gridEl) gridEl.innerHTML = '';
    return;
  }

  // Update count heading if it exists
  const countEl = document.getElementById('stakeholders-count');
  if (countEl) countEl.textContent = `${stakeholders.length} stakeholders identified`;

  // --- Stakeholder table ---
  const table = document.createElement('table');
  table.className = 'data-table stakeholders-table';
  table.setAttribute('id', 'stakeholders-table-el');

  table.innerHTML = `
    <thead>
      <tr>
        <th>Stakeholder</th>
        <th>Role</th>
        <th>Interest</th>
        <th>Influence</th>
        <th>Impact</th>
        <th>Action</th>
      </tr>
    </thead>
  `;

  const tbody = document.createElement('tbody');

  stakeholders.forEach((s, i) => {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'row-even' : 'row-odd';
    tr.innerHTML = `
      <td class="stakeholder-name"><strong>${escapeHTML(s.name)}</strong></td>
      <td>${escapeHTML(s.role)}</td>
      <td><span class="level-pill ${LEVEL_CLS[s.interest] || ''}">${escapeHTML(s.interest)}</span></td>
      <td><span class="level-pill ${LEVEL_CLS[s.influence] || ''}">${escapeHTML(s.influence)}</span></td>
      <td class="impact-text">${escapeHTML(s.impact)}</td>
      <td><span class="action-badge action-${(s.action || '').replace(/_/g, '-')}">${escapeHTML(ACTION_LABEL[s.action] || s.action)}</span></td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  containerEl.innerHTML = '';
  containerEl.appendChild(table);

  // --- 2×2 Grid ---
  if (!gridEl) return;
  renderStakeholderGrid(stakeholders, gridEl);
}

function renderStakeholderGrid(stakeholders, gridEl) {
  gridEl.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'stakeholder-grid';

  const quadrants = [
    { id: 'q-hh', influence: 'high',   interest: 'high',   label: 'Manage Closely',  cls: 'q-manage-closely',  desc: 'High Influence · High Interest' },
    { id: 'q-hl', influence: 'high',   interest: 'low',    label: 'Keep Satisfied',  cls: 'q-keep-satisfied',  desc: 'High Influence · Low Interest' },
    { id: 'q-lh', influence: 'low',    interest: 'high',   label: 'Keep Informed',   cls: 'q-keep-informed',   desc: 'Low Influence · High Interest' },
    { id: 'q-ll', influence: 'low',    interest: 'low',    label: 'Monitor',          cls: 'q-monitor',         desc: 'Low Influence · Low Interest' }
  ];

  // Grid axis labels
  const axisTop = document.createElement('div');
  axisTop.className = 'grid-axis grid-axis-top';
  axisTop.innerHTML = `
    <span class="axis-label">← Low Interest · High Interest →</span>
  `;
  gridEl.appendChild(axisTop);

  const gridWrap = document.createElement('div');
  gridWrap.className = 'grid-wrap';

  const axisSide = document.createElement('div');
  axisSide.className = 'grid-axis grid-axis-side';
  axisSide.innerHTML = `<span class="axis-label axis-rotated">↑ Influence ↓</span>`;
  gridWrap.appendChild(axisSide);

  quadrants.forEach(q => {
    const cell = document.createElement('div');
    cell.className = `grid-quadrant ${q.cls}`;
    cell.id = q.id;

    const qlabel = document.createElement('div');
    qlabel.className = 'quadrant-label';
    qlabel.innerHTML = `<strong>${q.label}</strong><small>${q.desc}</small>`;
    cell.appendChild(qlabel);

    const dots = document.createElement('div');
    dots.className = 'quadrant-dots';

    stakeholders
      .filter(s => s.influence === q.influence && s.interest === q.interest)
      .forEach(s => {
        const dot = document.createElement('div');
        dot.className = 'stakeholder-dot';
        dot.setAttribute('title', `${s.name} — ${s.role}`);
        dot.setAttribute('aria-label', `${s.name}, ${s.role}`);

        const initials = s.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        dot.textContent = initials;

        const tooltip = document.createElement('span');
        tooltip.className = 'dot-tooltip';
        tooltip.textContent = `${s.name}\n${s.role}`;
        dot.appendChild(tooltip);

        dots.appendChild(dot);
      });

    cell.appendChild(dots);
    grid.appendChild(cell);
  });

  gridWrap.appendChild(grid);
  gridEl.appendChild(gridWrap);
}
