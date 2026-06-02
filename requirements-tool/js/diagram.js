/**
 * js/diagram.js
 * Responsibility: Generates and injects an inline SVG process map into a
 * given container element. Supports start, end, process, and decision step
 * types laid out in horizontal swimlanes. No DOM dependencies except the
 * container passed in.
 */

const STEP_W = 120;
const STEP_H = 50;
const STEP_GAP = 160;
const LANE_H = 110;
const LANE_LABEL_W = 90;
const TOP_PAD = 20;
const SIDE_PAD = 20;

const COLORS = {
  start: '#1D9E75',
  end: '#E24B4A',
  process: '#1A5CFF',
  decision: '#BA7517',
  arrow: '#0D0D0D',
  laneLabel: '#6B6B6B',
  connLabel: '#6B6B6B',
  laneAlt: '#F3F2EE',
  laneBase: '#FFFFFF',
  laneBorder: '#E2E0DB'
};

function svgEl(tag, attrs = {}, text = '') {
  const NS = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  return el;
}

function wrapText(text, maxChars = 14) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function calcPositions(steps, swimlanes) {
  const positions = {};
  steps.forEach((step, i) => {
    const laneIdx = swimlanes.indexOf(step.role);
    const safeIdx = laneIdx >= 0 ? laneIdx : 0;
    const x = LANE_LABEL_W + SIDE_PAD + i * STEP_GAP + STEP_W / 2;
    const y = TOP_PAD + safeIdx * LANE_H + LANE_H / 2;
    positions[step.id] = { x, y, laneIdx: safeIdx };
  });
  return positions;
}

function edgePoint(pos, type, direction) {
  // direction: 'right' | 'left' | 'top' | 'bottom'
  const hw = type === 'decision' ? 50 : STEP_W / 2;
  const hh = type === 'decision' ? 30 : STEP_H / 2;
  const r = type === 'start' || type === 'end' ? 20 : 0;

  if (type === 'start' || type === 'end') {
    const radius = 20;
    if (direction === 'right') return { x: pos.x + radius, y: pos.y };
    if (direction === 'left') return { x: pos.x - radius, y: pos.y };
    if (direction === 'top') return { x: pos.x, y: pos.y - radius };
    return { x: pos.x, y: pos.y + radius };
  }

  if (direction === 'right') return { x: pos.x + hw, y: pos.y };
  if (direction === 'left') return { x: pos.x - hw, y: pos.y };
  if (direction === 'top') return { x: pos.x, y: pos.y - hh };
  return { x: pos.x, y: pos.y + hh };
}

function drawArrow(svg, x1, y1, x2, y2, label, markerId) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Slight curve for same-lane connections
  const sameLane = Math.abs(dy) < 10;
  let d;
  if (sameLane) {
    const cy = y1 - 18;
    d = `M ${x1} ${y1} Q ${mx} ${cy} ${x2} ${y2}`;
  } else {
    d = `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  const path = svgEl('path', {
    d,
    stroke: COLORS.arrow,
    'stroke-width': '1.5',
    fill: 'none',
    'marker-end': `url(#${markerId})`
  });
  svg.appendChild(path);

  if (label) {
    const lx = sameLane ? mx : mx + 4;
    const ly = sameLane ? y1 - 24 : (y1 + y2) / 2 - 6;
    const text = svgEl('text', {
      x: lx,
      y: ly,
      'font-size': '10',
      fill: COLORS.connLabel,
      'text-anchor': 'middle',
      'font-family': 'DM Sans, sans-serif'
    }, label);
    svg.appendChild(text);
  }
}

function renderDiagram(processData, containerEl) {
  containerEl.innerHTML = '';

  if (!processData || !processData.steps || processData.steps.length === 0) {
    containerEl.innerHTML = '<p style="color:var(--muted);padding:2rem;text-align:center;">No process data available.</p>';
    return;
  }

  const { steps, swimlanes, connections = [] } = processData;
  const numLanes = swimlanes.length;
  const numSteps = steps.length;

  const totalW = LANE_LABEL_W + SIDE_PAD * 2 + numSteps * STEP_GAP + 20;
  const totalH = TOP_PAD * 2 + numLanes * LANE_H;

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);
  svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';

  // Arrowhead marker
  const defs = svgEl('defs');
  const marker = svgEl('marker', {
    id: 'arrowhead',
    markerWidth: '10',
    markerHeight: '7',
    refX: '9',
    refY: '3.5',
    orient: 'auto'
  });
  const poly = svgEl('polygon', {
    points: '0 0, 10 3.5, 0 7',
    fill: COLORS.arrow
  });
  marker.appendChild(poly);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Swimlane backgrounds
  swimlanes.forEach((lane, i) => {
    const laneY = TOP_PAD + i * LANE_H;
    const bg = svgEl('rect', {
      x: 0,
      y: laneY,
      width: totalW,
      height: LANE_H,
      fill: i % 2 === 0 ? COLORS.laneAlt : COLORS.laneBase,
      stroke: COLORS.laneBorder,
      'stroke-width': '1'
    });
    svg.appendChild(bg);

    // Lane label background strip
    const labelBg = svgEl('rect', {
      x: 0,
      y: laneY,
      width: LANE_LABEL_W,
      height: LANE_H,
      fill: i % 2 === 0 ? '#E8EEFF' : '#F3F2EE',
      stroke: COLORS.laneBorder,
      'stroke-width': '1'
    });
    svg.appendChild(labelBg);

    // Lane label text (rotated)
    const labelText = svgEl('text', {
      x: LANE_LABEL_W / 2,
      y: laneY + LANE_H / 2,
      'font-size': '11',
      fill: COLORS.laneLabel,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      'font-family': 'DM Sans, sans-serif',
      'font-weight': '600',
      transform: `rotate(-90, ${LANE_LABEL_W / 2}, ${laneY + LANE_H / 2})`
    }, lane);
    svg.appendChild(labelText);
  });

  const positions = calcPositions(steps, swimlanes);
  const stepMap = {};
  steps.forEach(s => { stepMap[s.id] = s; });

  // Connections (draw before steps so shapes sit on top)
  connections.forEach(conn => {
    const fromStep = stepMap[conn.from];
    const toStep = stepMap[conn.to];
    if (!fromStep || !toStep) return;

    const fp = positions[conn.from];
    const tp = positions[conn.to];
    if (!fp || !tp) return;

    // Determine exit/entry directions
    const goingRight = tp.x > fp.x;
    const goingLeft = tp.x < fp.x;
    const goingDown = tp.y > fp.y && Math.abs(tp.y - fp.y) > 10;

    let x1, y1, x2, y2;
    if (goingLeft) {
      // Loop-back: go down then left
      x1 = fp.x;
      y1 = fp.y + (fromStep.type === 'decision' ? 30 : STEP_H / 2);
      x2 = tp.x;
      y2 = tp.y + (toStep.type === 'decision' ? 30 : STEP_H / 2);

      const loopY = Math.max(fp.y, tp.y) + LANE_H * 0.6;
      const d = `M ${x1} ${y1} L ${x1} ${loopY} L ${x2} ${loopY} L ${x2} ${y2}`;
      const path = svgEl('path', {
        d,
        stroke: COLORS.arrow,
        'stroke-width': '1.5',
        fill: 'none',
        'stroke-dasharray': '5,3',
        'marker-end': 'url(#arrowhead)'
      });
      svg.appendChild(path);

      if (conn.label) {
        const lx = (x1 + x2) / 2;
        const ly = loopY + 12;
        const lbl = svgEl('text', {
          x: lx, y: ly,
          'font-size': '10',
          fill: COLORS.connLabel,
          'text-anchor': 'middle',
          'font-family': 'DM Sans, sans-serif'
        }, conn.label);
        svg.appendChild(lbl);
      }
      return;
    }

    if (goingDown) {
      x1 = edgePoint(fp, fromStep.type, 'bottom').x;
      y1 = edgePoint(fp, fromStep.type, 'bottom').y;
      x2 = edgePoint(tp, toStep.type, 'top').x;
      y2 = edgePoint(tp, toStep.type, 'top').y;
    } else {
      x1 = edgePoint(fp, fromStep.type, 'right').x;
      y1 = edgePoint(fp, fromStep.type, 'right').y;
      x2 = edgePoint(tp, toStep.type, 'left').x;
      y2 = edgePoint(tp, toStep.type, 'left').y;
    }

    drawArrow(svg, x1, y1, x2, y2, conn.label || '', 'arrowhead');
  });

  // Step shapes
  steps.forEach(step => {
    const pos = positions[step.id];
    if (!pos) return;

    const g = svgEl('g');
    g.style.cursor = 'default';

    const lines = wrapText(step.label, 14);
    const lineH = 14;
    const textStartY = pos.y - ((lines.length - 1) * lineH) / 2;

    if (step.type === 'start' || step.type === 'end') {
      const r = 22;
      const circle = svgEl('circle', {
        cx: pos.x,
        cy: pos.y,
        r,
        fill: step.type === 'start' ? COLORS.start : 'none',
        stroke: COLORS.end,
        'stroke-width': step.type === 'end' ? '3' : '0'
      });
      if (step.type === 'end') circle.setAttribute('fill', COLORS.end);
      g.appendChild(circle);

      lines.forEach((line, li) => {
        const t = svgEl('text', {
          x: pos.x,
          y: textStartY + li * lineH + 4,
          'font-size': '9',
          fill: '#FFFFFF',
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'font-family': 'DM Sans, sans-serif',
          'font-weight': '600'
        }, line);
        g.appendChild(t);
      });

    } else if (step.type === 'decision') {
      const hw = 52;
      const hh = 30;
      const points = `${pos.x},${pos.y - hh} ${pos.x + hw},${pos.y} ${pos.x},${pos.y + hh} ${pos.x - hw},${pos.y}`;
      const diamond = svgEl('polygon', {
        points,
        fill: COLORS.decision,
        rx: 0
      });
      g.appendChild(diamond);

      lines.forEach((line, li) => {
        const t = svgEl('text', {
          x: pos.x,
          y: textStartY + li * lineH + 3,
          'font-size': '9',
          fill: '#FFFFFF',
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'font-family': 'DM Sans, sans-serif',
          'font-weight': '600'
        }, line);
        g.appendChild(t);
      });

    } else {
      // Process step: rounded rectangle
      const rect = svgEl('rect', {
        x: pos.x - STEP_W / 2,
        y: pos.y - STEP_H / 2,
        width: STEP_W,
        height: STEP_H,
        rx: '8',
        ry: '8',
        fill: COLORS.process
      });
      g.appendChild(rect);

      lines.forEach((line, li) => {
        const t = svgEl('text', {
          x: pos.x,
          y: textStartY + li * lineH + 3,
          'font-size': '10',
          fill: '#FFFFFF',
          'text-anchor': 'middle',
          'dominant-baseline': 'middle',
          'font-family': 'DM Sans, sans-serif',
          'font-weight': '600'
        }, line);
        g.appendChild(t);
      });
    }

    // Tooltip via <title>
    const title = svgEl('title', {}, step.description || step.label);
    g.appendChild(title);
    svg.appendChild(g);
  });

  containerEl.appendChild(svg);
}
