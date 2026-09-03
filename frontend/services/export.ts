import { UserRecord } from '../types/index.ts';

/**
 * Escapes HTML entities to prevent malformed tags in reports
 */
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Exports user list to a CSV spreadsheet
 */
export function exportToCSV(
  categoryName: string,
  users: UserRecord[],
  unfollowedSet?: Set<string>,
  notFoundSet?: Set<string>,
  falsePositiveSet?: Set<string>
): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const rows = ['username,profile_url,status'];
  for (const u of users) {
    const isUnfollowed = unfollowedSet ? unfollowedSet.has(u.username.toLowerCase()) : false;
    const isNotFound = notFoundSet ? notFoundSet.has(u.username.toLowerCase()) : false;
    const isFalsePositive = falsePositiveSet ? falsePositiveSet.has(u.username.toLowerCase()) : false;
    let status = 'following';
    if (isUnfollowed) status = 'unfollowed';
    else if (isNotFound) status = 'not_found';
    else if (isFalsePositive) status = 'false_positive';
    rows.push(`"${u.username.replace(/"/g, '""')}","${u.profile_url.replace(/"/g, '""')}","${status}"`);
  }
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `instagram_${categoryName}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports user list to a self-contained, interactive HTML report with Resend styling
 */
export function exportToHTML(
  categoryName: string,
  categoryLabel: string,
  users: UserRecord[],
  sessionLabel?: string,
  baselineSessionLabel?: string,
  unfollowedSet?: Set<string>,
  notFoundSet?: Set<string>,
  falsePositiveSet?: Set<string>
): void {
  const dateFormatted = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const fileDateStr = new Date().toISOString().slice(0, 10);

  const safeCategory = escapeHtml(categoryLabel);
  const safeSession = sessionLabel ? escapeHtml(sessionLabel) : 'Current Session';
  const safeBaseline = baselineSessionLabel ? escapeHtml(baselineSessionLabel) : 'N/A';

  const rowsHtml = users
    .map((user, idx) => {
      const uSafe = escapeHtml(user.username);
      const urlSafe = escapeHtml(user.profile_url);
      const isUnfollowed = unfollowedSet ? unfollowedSet.has(user.username.toLowerCase()) : false;
      const isNotFound = notFoundSet ? notFoundSet.has(user.username.toLowerCase()) : false;
      const isFalsePositive = falsePositiveSet ? falsePositiveSet.has(user.username.toLowerCase()) : false;

      let statusTag = '';
      if (isUnfollowed) {
        statusTag = `<span style="display:inline-flex;align-items:center;padding:2px 6px;font-size:10px;font-weight:600;text-transform:uppercase;color:#f87171;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);border-radius:4px;margin-left:6px;letter-spacing:0.05em;">unfollowed</span>`;
      } else if (isNotFound) {
        statusTag = `<span style="display:inline-flex;align-items:center;padding:2px 6px;font-size:10px;font-weight:600;text-transform:uppercase;color:#fbbf24;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:4px;margin-left:6px;letter-spacing:0.05em;">not found</span>`;
      } else if (isFalsePositive) {
        statusTag = `<span style="display:inline-flex;align-items:center;padding:2px 6px;font-size:10px;font-weight:600;text-transform:uppercase;color:#38bdf8;background:rgba(14,165,233,0.15);border:1px solid rgba(14,165,233,0.3);border-radius:4px;margin-left:6px;letter-spacing:0.05em;">false positive</span>`;
      }

      let rowBgStyle = '';
      if (isUnfollowed) rowBgStyle = 'style="background:rgba(239,68,68,0.03);"';
      else if (isNotFound) rowBgStyle = 'style="background:rgba(245,158,11,0.03);"';
      else if (isFalsePositive) rowBgStyle = 'style="background:rgba(14,165,233,0.03);"';

      const picUrl = user.profile_pic_url
        ? escapeHtml(user.profile_pic_url)
        : `https://unavatar.io/instagram/${uSafe}`;
      const fallbackUrl = `https://ui-avatars.com/api/?name=${uSafe}&background=18181b&color=e4e4e7&bold=true`;

      return `
      <tr class="user-row ${isUnfollowed ? 'unfollowed-row' : ''} ${isNotFound ? 'not-found-row' : ''} ${isFalsePositive ? 'false-positive-row' : ''}" data-username="${uSafe.toLowerCase()}" ${rowBgStyle}>
        <td class="col-num">${idx + 1}</td>
        <td>
          <a href="${urlSafe}" target="_blank" rel="noopener noreferrer" class="user-link">
            <div class="user-cell">
              <img src="${picUrl}" alt="${uSafe}" class="user-avatar-img" onerror="this.onerror=null;this.src='${fallbackUrl}';" />
              <div class="user-meta">
                <div style="display:flex;align-items:center;">
                  <span class="user-handle">@${uSafe}</span>
                  ${statusTag}
                </div>
                <span class="user-sub">instagram.com/${uSafe}</span>
              </div>
            </div>
          </a>
        </td>
        <td class="col-url">
          <a href="${urlSafe}" target="_blank" rel="noopener noreferrer" class="link-url">
            <img src="${picUrl}" alt="${uSafe}" class="inline-avatar-img" onerror="this.onerror=null;this.src='${fallbackUrl}';" />
            <span>${urlSafe}</span>
          </a>
        </td>
        <td class="col-action">
          <div class="btn-group">
            <button type="button" class="btn-sm" onclick="copyText('@${uSafe}', this)">Copy</button>
            <a href="${urlSafe}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-primary">
              <img src="${picUrl}" alt="${uSafe}" class="btn-avatar-img" onerror="this.onerror=null;this.src='${fallbackUrl}';" />
              <span>Visit ↗</span>
            </a>
          </div>
        </td>
      </tr>`;
    })
    .join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeCategory} - Instagram Insights Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #000000;
      --card-bg: #09090b;
      --card-subtle: #121215;
      --border: #27272a;
      --border-subtle: #1c1c1f;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --text-dim: #71717a;
      --white: #ffffff;
      --primary: #ffffff;
      --primary-text: #000000;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.5;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
    }
    .header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .brand-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      background: var(--card-subtle);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 6px;
    }
    .report-date {
      font-size: 12px;
      color: var(--text-dim);
    }
    .title-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .title-row h1 {
      font-size: 24px;
      font-weight: 600;
      color: var(--white);
      letter-spacing: -0.02em;
    }
    .count-badge {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
    }
    .meta-row {
      display: flex;
      gap: 20px;
      margin-top: 12px;
      font-size: 12px;
      color: var(--text-dim);
      flex-wrap: wrap;
    }
    .meta-item strong {
      color: var(--text-muted);
      font-weight: 500;
    }
    .toolbar {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .search-wrap {
      flex: 1;
      min-width: 220px;
      max-width: 400px;
      position: relative;
    }
    .search-input {
      width: 100%;
      background: var(--card-subtle);
      border: 1px solid var(--border);
      color: var(--white);
      font-size: 13px;
      padding: 8px 12px;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus {
      border-color: var(--text-muted);
    }
    .search-input::placeholder {
      color: var(--text-dim);
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      font-size: 12px;
      font-weight: 500;
      border-radius: 7px;
      padding: 7px 14px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn-secondary {
      background: var(--card-subtle);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-secondary:hover {
      background: #1e1e24;
      border-color: #3f3f46;
      color: var(--white);
    }
    .btn-primary {
      background: var(--primary);
      border: 1px solid var(--primary);
      color: var(--primary-text);
    }
    .btn-primary:hover {
      background: #e4e4e7;
    }
    .btn-sm {
      font-size: 11px;
      font-weight: 500;
      background: var(--card-subtle);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s;
    }
    .btn-sm:hover {
      color: var(--white);
      border-color: #3f3f46;
      background: #1e1e24;
    }
    .btn-sm.btn-primary {
      background: var(--white);
      color: #000;
      border-color: var(--white);
    }
    .btn-sm.btn-primary:hover {
      background: #e4e4e7;
    }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    th {
      background: var(--card-subtle);
      color: var(--text-dim);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 18px;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 12px 18px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text);
      vertical-align: middle;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr.user-row:hover td {
      background: #0d0d10;
    }
    .col-num {
      width: 44px;
      color: var(--text-dim);
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
    }
    .user-link {
      text-decoration: none;
      color: inherit;
    }
    .user-link:hover .user-handle {
      text-decoration: underline;
      color: var(--white);
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-avatar-img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid var(--border);
      flex-shrink: 0;
    }
    .inline-avatar-img {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid var(--border);
      flex-shrink: 0;
    }
    .btn-avatar-img {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
    }
    .user-handle {
      font-weight: 500;
      color: var(--white);
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }
    .user-sub {
      font-size: 11px;
      color: var(--text-dim);
    }
    .col-url {
      color: var(--text-muted);
      max-width: 260px;
    }
    .link-url {
      color: var(--text-muted);
      text-decoration: none;
      word-break: break-all;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .link-url:hover {
      color: var(--white);
      text-decoration: underline;
    }
    .col-action {
      text-align: right;
      width: 140px;
    }
    .btn-group {
      display: inline-flex;
      gap: 6px;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: var(--text-dim);
    }
    .empty-state {
      padding: 48px;
      text-align: center;
      color: var(--text-muted);
      display: none;
    }
    @media (max-width: 640px) {
      .col-url { display: none; }
      body { padding: 16px 8px; }
      .header { padding: 16px; }
      th, td { padding: 10px 12px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <span class="brand-tag">Instagram Follower Insights</span>
        <span class="report-date">Generated ${dateFormatted}</span>
      </div>
      <div class="title-row">
        <h1>${safeCategory}</h1>
        <span class="count-badge" id="visibleCount">${users.length} accounts</span>
      </div>
      <div class="meta-row">
        <span class="meta-item">Active Export: <strong>${safeSession}</strong></span>
        ${baselineSessionLabel ? `<span class="meta-item">Baseline: <strong>${safeBaseline}</strong></span>` : ''}
        <span class="meta-item">Total in Category: <strong>${users.length}</strong></span>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-wrap">
        <input
          type="text"
          id="reportSearch"
          class="search-input"
          placeholder="Filter usernames in report..."
          oninput="filterReport()"
        />
      </div>
      <div class="toolbar-actions">
        <button type="button" class="btn btn-secondary" onclick="copyAllUsernames()">
          Copy All Handles
        </button>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th>Account</th>
            <th class="col-url">Profile Link</th>
            <th class="col-action">Action</th>
          </tr>
        </thead>
        <tbody id="reportTableBody">
          ${rowsHtml}
        </tbody>
      </table>
      <div id="emptyNotice" class="empty-state">
        No accounts match your filter query.
      </div>
    </div>

    <div class="footer">
      Generated by Instagram Follower Insights &bull; Self-contained offline report
    </div>
  </div>

  <script>
    function filterReport() {
      const q = document.getElementById('reportSearch').value.toLowerCase().trim();
      const rows = document.querySelectorAll('.user-row');
      let visible = 0;
      rows.forEach(row => {
        const username = row.getAttribute('data-username') || '';
        if (!q || username.includes(q)) {
          row.style.display = '';
          visible++;
        } else {
          row.style.display = 'none';
        }
      });
      document.getElementById('visibleCount').innerText = visible + ' accounts';
      document.getElementById('emptyNotice').style.display = visible === 0 ? 'block' : 'none';
    }

    function copyText(text, btn) {
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerText;
        btn.innerText = 'Copied!';
        btn.style.color = '#ffffff';
        setTimeout(() => {
          btn.innerText = original;
          btn.style.color = '';
        }, 1500);
      });
    }

    function copyAllUsernames() {
      const rows = document.querySelectorAll('.user-row');
      const handles = [];
      rows.forEach(row => {
        if (row.style.display !== 'none') {
          const u = row.getAttribute('data-username');
          if (u) handles.push('@' + u);
        }
      });
      navigator.clipboard.writeText(handles.join('\\n')).then(() => {
        alert('Copied ' + handles.length + ' handles to clipboard!');
      });
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `instagram_${categoryName}_report_${fileDateStr}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
