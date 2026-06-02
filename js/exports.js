/**
 * js/exports.js
 * Responsibility: Handles downloading the SVG diagram and CSV table data.
 * No DOM dependencies except the elements passed in as arguments.
 */

function downloadSVG(svgEl, filename) {
  if (!svgEl) {
    console.warn('downloadSVG: no SVG element provided.');
    return;
  }

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgEl);

  // Ensure proper XML declaration and namespace
  if (!svgString.startsWith('<?xml')) {
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
  }

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename || 'process-map.svg');
}

function downloadCSV(tableEl, filename) {
  if (!tableEl) {
    console.warn('downloadCSV: no table element provided.');
    return;
  }

  const rows = tableEl.querySelectorAll('tr');
  const csvLines = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll('th, td');
    const values = Array.from(cells).map(cell => {
      // Get clean text content, stripping inner HTML tags
      let text = cell.innerText || cell.textContent || '';
      text = text.replace(/\s+/g, ' ').trim();
      // Wrap in quotes if the value contains commas, quotes, or newlines
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        text = '"' + text.replace(/"/g, '""') + '"';
      }
      return text;
    });
    csvLines.push(values.join(','));
  });

  const csvString = csvLines.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename || 'data.csv');
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay to ensure the download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
