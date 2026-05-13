'use strict';

const API = '';
const state = {
  calendarDate: new Date(),
  activeTimerId: null,
  timerStartedAt: null,
  focusDurationSeconds: 25 * 60,
  focusDoneNotified: false,
};

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || res.statusText), { status: res.status });
  }

  if (res.status === 204) return null;
  return res.json();
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem('user');
}

function userId() {
  return getUser()?.id;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(str) {
  return esc(str).replace(/"/g, '&quot;');
}

function dateValue(value) {
  return value ? new Date(value).toLocaleDateString() : '';
}

function dateTimeValue(value) {
  return value ? new Date(value).toLocaleString() : '';
}

function toMysqlDateTime(value) {
  return value ? value.replace('T', ' ') + ':00' : null;
}

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateTimeLocalValue(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateInputValue(date)}T${hours}:${minutes}`;
}

function emptyHtml(message) {
  return `<p class="empty-state">${esc(message)}</p>`;
}

function confirmDelete(message) {
  if (!window.confirm(message)) return false;
  return window.confirm('Энэ үйлдлийг буцаах боломжгүй. Устгахдаа итгэлтэй байна уу?');
}

function showError(err) {
  window.alert(err.message || 'Request failed');
}

function showTab(tab) {
  const login = document.getElementById('login-form');
  const register = document.getElementById('register-form');
  if (!login || !register) return;

  login.style.display = tab === 'login' ? '' : 'none';
  register.style.display = tab === 'register' ? '' : 'none';
  document.querySelectorAll('.tab').forEach((el, i) => {
    el.classList.toggle('active', (i === 0) === (tab === 'login'));
  });
}

async function login(e) {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  try {
    const user = await apiFetch('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      }),
    });
    setUser(user);
    location.href = 'dashboard.html';
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function register(e) {
  e.preventDefault();
  const errEl = document.getElementById('register-error');
  errEl.textContent = '';

  try {
    const user = await apiFetch('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
      }),
    });
    setUser(user);
    location.href = 'dashboard.html';
  } catch (err) {
    errEl.textContent = err.message;
  }
}

function logout() {
  clearUser();
  location.href = 'index.html';
}

let _taskFilter = 'all';
let _labelFilter = null;

function showSection(name, taskFilter, labelId) {
  if (name === 'tasks' && taskFilter) _taskFilter = taskFilter;
  if (name === 'tasks' && labelId !== undefined) _labelFilter = labelId || null;
  else if (name !== 'tasks') _labelFilter = null;
  const sections = ['tasks','projects','notes','calendar','habits','goals','time','labels','notifications','settings','profile'];
  sections.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.style.display = s === name ? '' : 'none';
  });
  document.querySelectorAll('.nav-link').forEach(el => {
    const oc = el.getAttribute('onclick') || '';
    const match = name === 'tasks'
      ? oc.includes(`'tasks','${taskFilter || 'all'}'`) || (taskFilter === 'all' && oc === "showSection('tasks','all')")
      : oc.includes(`'${name}'`);
    el.classList.toggle('active', match);
  });
  if (name === 'tasks') {
    const titles = { all: 'All Tasks', today: 'Today', upcoming: 'Upcoming' };
    const t = document.getElementById('task-view-title');
    if (t) t.textContent = titles[_taskFilter] || 'Tasks';
  }
  if (name === 'tasks') highlightSidebarLabel(_labelFilter);
  const loaders = {
    tasks: loadTasks, projects: loadProjects, notes: loadNotes,
    calendar: loadCalendar, habits: loadHabits, goals: loadGoals,
    time: applyFocusSettings, labels: loadLabels,
    notifications: loadNotifications, settings: loadSettings,
    profile: loadProfile,
  };
  loaders[name]?.();
}

async function loadProfile() {
  const user = getUser();
  if (!user) return;
  const fresh = await apiFetch(`/api/users/${user.id}`).catch(() => user);
  const el = document.getElementById('profile-content');
  if (!el) return;
  el.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">${esc((fresh.username||'?').charAt(0).toUpperCase())}</div>
      <div class="profile-info">
        <div class="profile-name">${esc(fresh.username)}</div>
        <div class="profile-email">${esc(fresh.email)}</div>
      </div>
    </div>
    <div class="profile-fields">
      <div class="profile-field">
        <span class="profile-field-label">User ID</span>
        <span class="profile-field-value profile-id">#${fresh.id}</span>
      </div>
      <div class="profile-field">
        <span class="profile-field-label">Username</span>
        <span class="profile-field-value">${esc(fresh.username)}</span>
      </div>
      <div class="profile-field">
        <span class="profile-field-label">Email</span>
        <span class="profile-field-value">${esc(fresh.email)}</span>
      </div>
      <div class="profile-field">
        <span class="profile-field-label">Member since</span>
        <span class="profile-field-value">${dateValue(fresh.created_at)}</span>
      </div>
    </div>
    <form onsubmit="updateProfile(event)" style="margin-top:20px">
      <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-2);margin-bottom:5px">New Username</label>
      <input type="text" id="profile-username" value="${esc(fresh.username)}" style="max-width:320px">
      <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-2);margin-bottom:5px">New Email</label>
      <input type="email" id="profile-email" value="${esc(fresh.email)}" style="max-width:320px">
      <button type="submit" class="btn-new" style="margin-top:4px">Save Profile</button>
    </form>`;
}

async function updateProfile(e) {
  e.preventDefault();
  const user = getUser();
  try {
    const updated = await apiFetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        username: document.getElementById('profile-username').value,
        email:    document.getElementById('profile-email').value,
      }),
    });
    setUser({ ...user, ...updated });
    document.getElementById('sidebar-user').textContent = updated.username;
    const av = document.getElementById('user-avatar-char');
    if (av) av.textContent = updated.username.charAt(0).toUpperCase();
    loadProfile();
  } catch (err) { showError(err); }
}

function openModal(id) {
  if (id === 'task-modal') return openTaskModal();
  if (id === 'label-modal') return openLabelModal();
  if (id === 'note-modal') {
    document.getElementById('note-id').value = '';
    document.querySelector('#note-modal .modal-title').textContent = 'New Note';
    const deleteBtn = document.getElementById('note-delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'none';
  }
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

const PRIORITY_COLORS = { urgent: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };

function parseLabelChips(labelsRaw) {
  if (!labelsRaw) return '';
  return labelsRaw.split('|').map(part => {
    const [name, color] = part.split(':');
    if (!name) return '';
    const bg = color || '#6366f1';
    return `<span class="task-label-chip" style="--lc:${esc(bg)}">${esc(name)}</span>`;
  }).join('');
}

async function loadSidebarLabels() {
  const el = document.getElementById('sidebar-labels');
  if (!el) return;
  const labels = await apiFetch('/api/labels').catch(() => []);
  if (!labels.length) { el.innerHTML = ''; return; }
  el.innerHTML = labels.map(l => `
    <a class="nav-link nav-label-link" id="sidebar-label-${l.id}"
       href="dashboard.html?label=${l.id}">
      <span class="nav-label-dot" style="background:${esc(l.color)}"></span>
      ${esc(l.name)}
    </a>`).join('');
}

function filterByLabel(labelId, labelName) {
  _taskFilter = 'all';
  showSection('tasks', 'all', labelId);
  const t = document.getElementById('task-view-title');
  if (t) t.textContent = `# ${labelName}`;
}

function highlightSidebarLabel(labelId) {
  document.querySelectorAll('.nav-label-link').forEach(el => {
    el.classList.remove('active');
  });
  if (labelId) {
    document.getElementById(`sidebar-label-${labelId}`)?.classList.add('active');
  }
}

function getDueChip(due) {
  if (!due) return '';
  const d = new Date(due);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.floor((d - today) / 86400000);
  let cls = '', label = '';
  if (diff < 0)  { cls = 'overdue'; label = d.toLocaleDateString(); }
  else if (diff === 0) { cls = 'today'; label = 'Today'; }
  else if (diff === 1) { label = 'Tomorrow'; }
  else { label = d.toLocaleDateString(); }
  return `<span class="task-due-chip ${cls}">📅 ${label}</span>`;
}

async function loadTasks() {
  const params = new URLSearchParams();
  params.set('user_id', userId());
  const status   = document.getElementById('filter-status')?.value;
  const priority = document.getElementById('filter-priority')?.value;
  const owner    = document.getElementById('filter-owner')?.value;
  const search   = document.getElementById('filter-search')?.value;
  if (status)   params.set('status', status);
  if (priority) params.set('priority', priority);
  if (search)   params.set('search', search);
  if (_labelFilter) params.set('label_id', _labelFilter);

  let tasks = await apiFetch('/api/tasks?' + params.toString()).catch(() => []);

  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

  if (_taskFilter === 'today') {
    tasks = tasks.filter(t => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date); d.setHours(0,0,0,0);
      return d <= today;
    });
  } else if (_taskFilter === 'upcoming') {
    tasks = tasks.filter(t => {
      if (!t.due_date) return true;
      const d = new Date(t.due_date); d.setHours(0,0,0,0);
      return d >= today;
    });
  }
  if (owner === 'mine') {
    const currentUserId = Number(userId());
    tasks = tasks.filter(t => Number(t.assignee_id) === currentUserId || (!t.assignee_id && Number(t.created_by) === currentUserId));
  }
  tasks = tasks.filter(t => !t.parent_task_id);

  // Update today count badge
  const allTasks = await apiFetch(`/api/tasks?user_id=${userId()}`).catch(() => []);
  const todayCount = allTasks.filter(t => {
    if (t.parent_task_id || !t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
    const d = new Date(t.due_date); d.setHours(0,0,0,0);
    return d <= today;
  }).length;
  const badge = document.getElementById('today-count');
  if (badge) badge.textContent = todayCount || '';

  const el = document.getElementById('task-list');
  if (!el) return;

  if (!tasks.length) {
    el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 0;gap:10px;color:var(--text-3)">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M14 20l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span style="font-size:14px;font-weight:500">${_taskFilter === 'today' ? 'No tasks due today' : 'No tasks yet'}</span>
      <span style="font-size:12px">${_taskFilter === 'today' ? 'Enjoy your day!' : 'Click "+ Add task" to get started'}</span>
    </div>`;
    return;
  }

  el.innerHTML = tasks.map(t => {
    const isDone = t.status === 'done' || t.status === 'cancelled';
    const pipColor = PRIORITY_COLORS[t.priority] || 'var(--border-2)';
    const labelChips = parseLabelChips(t.labels_raw);
    return `
      <div class="task-row p-${t.priority}" onclick="openDetailPanel(${t.id})">
        <div class="task-check ${isDone ? 'done' : ''}"
          onclick="event.stopPropagation();toggleTaskDone(${t.id},'${t.status}')"></div>
        <div class="task-body">
          <div class="task-title-row">
            <div class="task-priority-pip" style="background:${pipColor}" title="${t.priority}"></div>
            <span class="task-name ${isDone ? 'done-text' : ''}">${esc(t.title)}</span>
            ${labelChips}
          </div>
          ${t.description ? `<div class="task-desc">${esc(t.description)}</div>` : ''}
          <div class="task-meta-row">
            ${getDueChip(t.due_date)}
            ${t.assignee_name ? `<span class="task-assignee-chip">
              <span class="task-mini-avatar">${t.assignee_name.charAt(0).toUpperCase()}</span>
              ${esc(t.assignee_name)}
            </span>` : ''}
            ${t.status !== 'todo' && !isDone ? `<span class="badge status-${t.status}">${t.status}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-sm btn-del" onclick="event.stopPropagation();deleteTask(${t.id})">✕</button>
        </div>
      </div>`;
  }).join('');
}

async function toggleTaskDone(id, currentStatus) {
  const newStatus = currentStatus === 'done' ? 'todo' : 'done';
  await apiFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) }).catch(showError);
  loadTasks();
}

// ─── DETAIL PANEL ──────────────────────────────────────────────────────────
let _detailTaskId = null;

async function openDetailPanel(taskId) {
  _detailTaskId = taskId;
  document.getElementById('task-detail-panel').classList.add('open');
  document.getElementById('panel-overlay').classList.add('open');

  const [task, labels, comments, projects, allLabels] = await Promise.all([
    apiFetch(`/api/tasks/${taskId}`),
    apiFetch(`/api/tasks/${taskId}/labels`).catch(() => []),
    apiFetch(`/api/tasks/${taskId}/comments`).catch(() => []),
    apiFetch(`/api/projects?user_id=${userId()}`).catch(() => []),
    apiFetch('/api/labels').catch(() => []),
  ]);

  const proj = projects.find(p => p.id === task.project_id);

  // Breadcrumb
  document.getElementById('detail-breadcrumb').innerHTML =
    `<span>My Tasks</span>${proj ? ` › <span>${esc(proj.name)}</span>` : ''}`;

  // Title
  document.getElementById('detail-title').value = task.title;

  // Complete button state
  updateCompleteBtn(task.status);

  // Priority chip
  document.getElementById('detail-priority').value = task.priority;
  updatePriorityChip();

  // Due chip
  setDetailDueInputs(task.due_date);
  updateDueChip(task.due_date);

  // Project chip
  document.getElementById('dm-chip-project').textContent = proj ? proj.name : 'No project';

  // Status
  document.getElementById('detail-status').value = task.status;

  // Assignee
  const assignSel = document.getElementById('detail-assignee');
  assignSel.innerHTML = '<option value="">Unassigned</option>';
  const allUsers = await apiFetch('/api/users/search?q=').catch(() => []);
  allUsers.forEach(u => {
    const o = document.createElement('option');
    o.value = u.id; o.textContent = u.username;
    if (Number(u.id) === Number(task.assignee_id)) o.selected = true;
    assignSel.appendChild(o);
  });

  // Created
  document.getElementById('detail-created').textContent = dateTimeValue(task.created_at);

  // Notes
  document.getElementById('detail-desc').value = task.description || '';

  // Labels
  const labelsEl = document.getElementById('detail-labels');
  labelsEl.innerHTML = labels.length
    ? labels.map(l =>
        `<span class="badge" style="background:${l.color}22;color:${l.color};border:1px solid ${l.color}44">${esc(l.name)}</span>`
      ).join('')
    : '<span style="font-size:12px;color:var(--text-3)">No labels assigned</span>';

  const assignedLabelIds = new Set(labels.map(l => l.id));
  const labelSelect = document.getElementById('detail-label-select');
  if (labelSelect) {
    const availableLabels = allLabels.filter(l => !assignedLabelIds.has(l.id));
    labelSelect.innerHTML = '<option value="">Add label</option>' +
      availableLabels.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    labelSelect.disabled = availableLabels.length === 0;
  }

  // Subtasks
  await loadSubtasks(taskId);

  // Comments
  renderComments(comments);

  // Avatar
  const user = getUser();
  const av = document.getElementById('detail-comment-avatar');
  if (av && user) av.textContent = (user.username || user.email).charAt(0).toUpperCase();

  // Delete
  document.getElementById('detail-delete-btn').onclick = async () => {
    if (!confirmDelete('Delete this task?')) return;
    await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' }).catch(showError);
    closeDetailPanel();
    loadTasks();
  };
}

function updateCompleteBtn(status) {
  const s = status || document.getElementById('detail-status')?.value;
  const btn = document.getElementById('detail-complete-btn');
  const icon = document.getElementById('detail-complete-icon');
  if (!btn) return;
  const done = s === 'done';
  btn.classList.toggle('done', done);
  if (icon) icon.textContent = done ? '✓' : '○';
  btn.querySelector('span:last-child') && (btn.lastChild.textContent = done ? ' Completed' : ' Mark complete');
}

function updatePriorityChip() {
  const val = document.getElementById('detail-priority')?.value;
  const wrap = document.getElementById('dm-chip-priority-wrap');
  const icon = document.getElementById('dm-chip-priority-icon');
  if (!wrap || !icon) return;
  const colors = { urgent: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };
  wrap.style.borderColor = colors[val] || 'var(--border)';
  wrap.style.color = colors[val] || 'var(--text-2)';
  icon.style.color = colors[val] || 'var(--text-3)';
}

function openPrioritySelect() {
  const select = document.getElementById('detail-priority');
  if (!select) return;
  if (select.showPicker) select.showPicker();
  else select.focus();
}

function updateDueChip(due) {
  const label = document.getElementById('dm-chip-due-label');
  const chip = document.querySelector('.dm-chip-due');
  if (!label || !chip) return;
  chip.classList.remove('has-date', 'overdue');
  if (!due) { label.textContent = 'Set due date'; return; }
  const d = new Date(due);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.floor((d - today) / 86400000);
  chip.classList.add(diff < 0 ? 'overdue' : 'has-date');
  label.textContent = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString();
}

function setDetailDueInputs(due) {
  const dateInput = document.getElementById('detail-due-date');
  const timeInput = document.getElementById('detail-due-time');
  if (!dateInput || !timeInput) return;
  if (!due) {
    dateInput.value = '';
    timeInput.value = '09:00';
    return;
  }
  const d = new Date(due);
  dateInput.value = dateInputValue(d);
  timeInput.value = d.toTimeString().slice(0, 5);
}

function toggleDueMenu(event) {
  event?.stopPropagation();
  document.getElementById('detail-due-menu')?.classList.toggle('open');
}

function closeDueMenu() {
  document.getElementById('detail-due-menu')?.classList.remove('open');
}

async function saveDueValue(value) {
  await saveDetailField('due_date', value ? toMysqlDateTime(value) : null);
  setDetailDueInputs(value);
  updateDueChip(value);
  closeDueMenu();
  loadTasks();
}

function setDetailDuePreset(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(9, 0, 0, 0);
  saveDueValue(dateTimeLocalValue(d));
}

function saveCustomDue() {
  const date = document.getElementById('detail-due-date')?.value;
  const time = document.getElementById('detail-due-time')?.value || '09:00';
  if (!date) return;
  saveDueValue(`${date}T${time}`);
}

function clearDetailDue() {
  saveDueValue(null);
}

async function toggleDetailDone() {
  if (!_detailTaskId) return;
  const sel = document.getElementById('detail-status');
  const newStatus = sel.value === 'done' ? 'todo' : 'done';
  sel.value = newStatus;
  await saveDetailField('status', newStatus);
  updateCompleteBtn(newStatus);
}

async function loadSubtasks(taskId) {
  const tasks = await apiFetch(`/api/tasks?user_id=${userId()}`).catch(() => []);
  const subtasks = tasks.filter(t => Number(t.parent_task_id) === Number(taskId));
  const done = subtasks.filter(t => t.status === 'done').length;
  const countEl = document.getElementById('dm-subtask-count');
  if (countEl) countEl.textContent = `${done}/${subtasks.length}`;
  const el = document.getElementById('detail-subtasks');
  if (!el) return;
  el.innerHTML = subtasks.map(t => `
    <div class="dm-subtask-row">
      <div class="task-check ${t.status === 'done' ? 'done' : ''}"
        onclick="toggleTaskDone(${t.id},'${t.status}');setTimeout(()=>loadSubtasks(${taskId}),400)"
        style="width:16px;height:16px"></div>
      <span class="dm-subtask-title ${t.status === 'done' ? 'done-text' : ''}">${esc(t.title)}</span>
    </div>`).join('');
}

async function addSubtask() {
  const input = document.getElementById('subtask-input');
  const title = input.value.trim();
  if (!title || !_detailTaskId) return;
  await apiFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, parent_task_id: _detailTaskId, created_by: userId() }),
  }).catch(showError);
  input.value = '';
  await loadSubtasks(_detailTaskId);
  loadTasks();
}

async function assignDetailLabel() {
  if (!_detailTaskId) return;
  const select = document.getElementById('detail-label-select');
  const labelId = Number(select?.value);
  if (!labelId) return;
  select.value = '';

  await apiFetch(`/api/tasks/${_detailTaskId}/labels`, {
    method: 'POST',
    body: JSON.stringify({ label_id: labelId }),
  }).catch(showError);

  await openDetailPanel(_detailTaskId);
  loadTasks();
  loadSidebarLabels();
}

function renderComments(comments) {
  const el = document.getElementById('detail-comments');
  if (!el) return;
  el.innerHTML = comments.length
    ? comments.map(c => `
        <div class="comment-item">
          <div class="comment-avatar">${(c.username || '?').charAt(0).toUpperCase()}</div>
          <div class="comment-body">
            <div class="comment-author">${esc(c.username || 'User')}</div>
            <div class="comment-text">${esc(c.body)}</div>
            <div class="comment-time">${dateTimeValue(c.created_at)}</div>
          </div>
        </div>`).join('')
    : '<p style="font-size:12px;color:var(--text-3);margin-bottom:10px">No comments yet</p>';
}

async function saveDetailField(field, value) {
  if (!_detailTaskId) return;
  const body = {};
  body[field] = value;
  await apiFetch(`/api/tasks/${_detailTaskId}`, { method: 'PATCH', body: JSON.stringify(body) }).catch(showError);
  loadTasks();
}

async function saveDetailFields() {
  if (!_detailTaskId) return;
  const body = {
    title:       document.getElementById('detail-title').value,
    description: document.getElementById('detail-desc').value || null,
  };
  await apiFetch(`/api/tasks/${_detailTaskId}`, { method: 'PATCH', body: JSON.stringify(body) }).catch(showError);
  loadTasks();
}

async function submitComment() {
  if (!_detailTaskId) return;
  const text = document.getElementById('detail-comment-text').value.trim();
  if (!text) return;
  await apiFetch(`/api/tasks/${_detailTaskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ userId: userId(), body: text }),
  }).catch(showError);
  document.getElementById('detail-comment-text').value = '';
  const comments = await apiFetch(`/api/tasks/${_detailTaskId}/comments`).catch(() => []);
  renderComments(comments);
}

function closeDetailPanel() {
  document.getElementById('task-detail-panel').classList.remove('open');
  document.getElementById('panel-overlay').classList.remove('open');
  _detailTaskId = null;
}

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon)  icon.textContent  = isLight ? '🌙' : '☀';
  if (label) label.textContent = isLight ? 'Dark mode' : 'Light mode';
}

(function applyTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light');
    const icon  = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon)  icon.textContent  = '🌙';
    if (label) label.textContent = 'Dark mode';
  }
})();

async function openTaskModal(task) {
  document.getElementById('task-id').value = task?.id || '';
  document.getElementById('task-title').value = task?.title || '';
  document.getElementById('task-desc').value = task?.description || '';
  document.getElementById('task-status').value = task?.status || 'todo';
  document.getElementById('task-priority').value = task?.priority || 'medium';
  document.getElementById('task-due').value = task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '';
  document.getElementById('task-modal-title').textContent = task ? 'Edit Task' : 'New Task';

  const projects = await apiFetch(`/api/projects?user_id=${userId()}`).catch(() => []);
  const projSel = document.getElementById('task-project');
  projSel.innerHTML = '<option value="">— No project —</option>' +
    projects.map(p => `<option value="${p.id}" ${task?.project_id === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

  projSel.onchange = () => populateAssigneeDropdown(Number(projSel.value), task?.assignee_id);
  await populateAssigneeDropdown(task?.project_id || Number(projSel.value), task?.assignee_id);

  const labelSel = document.getElementById('task-label');
  if (labelSel) {
    const [allLabels, taskLabels] = await Promise.all([
      apiFetch('/api/labels').catch(() => []),
      task?.id ? apiFetch(`/api/tasks/${task.id}/labels`).catch(() => []) : Promise.resolve([]),
    ]);
    const assignedIds = new Set(taskLabels.map(l => l.id));
    const availableLabels = allLabels.filter(l => !assignedIds.has(l.id));
    labelSel.innerHTML = '<option value="">— No label —</option>' +
      availableLabels.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('');
    labelSel.disabled = availableLabels.length === 0;
  }

  document.getElementById('task-modal').style.display = 'flex';
}

async function populateAssigneeDropdown(projectId, selectedId) {
  const sel = document.getElementById('task-assignee');
  sel.innerHTML = '<option value="">— Unassigned —</option>';
  const users = await apiFetch('/api/users/search?q=').catch(() => []);
  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.username;
    if (Number(u.id) === Number(selectedId)) opt.selected = true;
    sel.appendChild(opt);
  });
}

async function editTask(id) {
  const task = await apiFetch(`/api/tasks/${id}`).catch(() => null);
  if (task) openTaskModal(task);
}

async function saveTask(e) {
  e.preventDefault();
  const id = document.getElementById('task-id').value;
  const projId = Number(document.getElementById('task-project').value) || null;
  const assigneeId = Number(document.getElementById('task-assignee').value) || null;
  const labelId = Number(document.getElementById('task-label')?.value) || null;
  const body = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-desc').value || null,
    status: document.getElementById('task-status').value,
    priority: document.getElementById('task-priority').value,
    due_date: toMysqlDateTime(document.getElementById('task-due').value),
    project_id: projId,
    assignee_id: assigneeId,
    created_by: userId(),
  };

  try {
    const savedTask = await apiFetch(id ? `/api/tasks/${id}` : '/api/tasks', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(body),
    });
    if (labelId) {
      await apiFetch(`/api/tasks/${savedTask.id}/labels`, {
        method: 'POST',
        body: JSON.stringify({ label_id: labelId }),
      });
    }
    closeModal('task-modal');
    loadTasks();
  } catch (err) {
    showError(err);
  }
}

async function deleteTask(id) {
  if (!confirmDelete('Delete this task?')) return;
  await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(showError);
  loadTasks();
}

async function loadLabels() {
  const labels = await apiFetch('/api/labels').catch(() => []);
  const el = document.getElementById('label-list');
  if (!el) return;

  el.innerHTML = labels.length
    ? labels.map(l => `
      <div class="label-card">
        <span class="label-dot" style="background:${esc(l.color)}"></span>
        <span>${esc(l.name)}</span>
        <button class="btn-sm btn-del" onclick="deleteLabel(${l.id})">Delete</button>
      </div>`).join('')
    : emptyHtml('No labels yet');
}

function openLabelModal() {
  document.getElementById('label-name').value = '';
  document.getElementById('label-color').value = '#6366f1';
  document.getElementById('label-modal').style.display = 'flex';
}

async function saveLabel(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/labels', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('label-name').value,
        color: document.getElementById('label-color').value,
      }),
    });
    closeModal('label-modal');
    loadLabels();
  } catch (err) {
    showError(err);
  }
}

async function deleteLabel(id) {
  if (!confirmDelete('Delete this label?')) return;
  await apiFetch(`/api/labels/${id}`, { method: 'DELETE' }).catch(showError);
  loadLabels();
}

async function loadSidebarProjects() {
  const projects = await apiFetch(`/api/projects?user_id=${userId()}`).catch(() => []);
  const el = document.getElementById('sidebar-projects');
  if (!el) return;
  const currentId = new URLSearchParams(location.search).get('id');
  el.innerHTML = projects.map(p => `
    <a class="sidebar-proj-link nav-link${currentId == p.id ? ' active' : ''}" href="project-detail.html?id=${p.id}">
      <span class="proj-color-dot" style="background:${esc(p.color)}"></span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</span>
    </a>`).join('') || '<div style="padding:4px 10px;font-size:12px;color:var(--text-3)">No projects yet</div>';
}

async function loadProjects() {
  const projects = await apiFetch(`/api/projects?user_id=${userId()}`).catch(() => []);
  const el = document.getElementById('project-list');
  if (!el) return;
  el.innerHTML = projects.length
    ? projects.map(p => `
      <article class="item-card" style="cursor:pointer" onclick="location.href='project-detail.html?id=${p.id}'">
        <div class="item-card-accent" style="background:${esc(p.color || '#6366f1')}"></div>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description || '')}</p>
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="btn-sm btn-del" onclick="deleteProject(${p.id})">Delete</button>
        </div>
      </article>`).join('')
    : emptyHtml('No projects yet');
}

let _currentProjectId = null;

async function openProjectDetail(projectId, projectName) {
  _currentProjectId = projectId;
  document.getElementById('proj-detail-title').textContent = projectName;
  document.getElementById('project-detail-modal').style.display = 'flex';
  await Promise.all([loadProjectMembers(projectId), loadProjectTasks(projectId)]);
}

async function loadProjectMembers(projectId) {
  const members = await apiFetch(`/api/projects/${projectId}/members`).catch(() => []);
  const el = document.getElementById('proj-members-list');
  el.innerHTML = members.length
    ? members.map(m => `
      <div class="member-row">
        <div class="member-info">
          <div class="member-avatar">${m.username.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(m.username)}</div>
            <div style="font-size:11px;color:var(--text-3)">${esc(m.email)}</div>
          </div>
          <span class="role-badge role-${m.role}">${esc(m.role)}</span>
        </div>
        <button class="btn-sm btn-del" onclick="removeMember(${projectId},${m.id})">Remove</button>
      </div>`).join('')
    : '<p style="color:var(--text-3);font-size:13px;padding:8px 0">No members yet.</p>';
}

async function loadProjectTasks(projectId) {
  const tasks = await apiFetch(`/api/projects/${projectId}/tasks`).catch(() => []);
  const tbody = document.getElementById('proj-task-list');
  tbody.innerHTML = tasks.length
    ? tasks.map(t => `
      <tr>
        <td>${esc(t.title)}</td>
        <td>${t.assignee_name ? `<span class="member-chip">${esc(t.assignee_name)}</span>` : '<span style="color:#aaa">—</span>'}</td>
        <td><span class="badge priority-${esc(t.priority)}">${esc(t.priority)}</span></td>
        <td>${dateValue(t.due_date)}</td>
        <td><span class="badge status-${esc(t.status)}">${esc(t.status)}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="table-empty">No tasks assigned yet</td></tr>';
}

let _memberSearchTimeout = null;

function searchMember() {
  clearTimeout(_memberSearchTimeout);
  _memberSearchTimeout = setTimeout(async () => {
    const q = document.getElementById('member-search').value.trim();
    const el = document.getElementById('member-search-results');
    if (q.length < 2) { el.innerHTML = ''; return; }
    const users = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`).catch(() => []);
    el.innerHTML = users.length
      ? users.map(u => `
        <div class="search-result-item">
          <div class="member-info">
            <div class="member-avatar" style="width:26px;height:26px;font-size:11px;border-radius:6px">${u.username.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(u.username)}</div>
              <div style="font-size:11px;color:var(--text-3)">${esc(u.email)}</div>
            </div>
          </div>
          <button class="btn-sm btn-accent" onclick="addMemberToProject(${u.id},'${esc(u.username)}')">+ Add</button>
        </div>`).join('')
      : '<p style="color:var(--text-3);font-size:13px;padding:8px 0">No users found</p>';
  }, 300);
}

async function addMemberToProject(memberId, memberName) {
  if (!_currentProjectId) return;
  const role = document.getElementById('member-role').value;
  try {
    await apiFetch(`/api/projects/${_currentProjectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId: memberId, role }),
    });
    document.getElementById('member-search').value = '';
    document.getElementById('member-search-results').innerHTML = '';
    await loadProjectMembers(_currentProjectId);
    await loadProjectTasks(_currentProjectId);
  } catch (err) {
    showError(err);
  }
}

async function removeMember(projectId, memberId) {
  if (!confirmDelete(`Remove this member from the project?`)) return;
  await apiFetch(`/api/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }).catch(showError);
  await loadProjectMembers(projectId);
}

async function openAssignTaskModal() {
  if (!_currentProjectId) return;
  const members = await apiFetch(`/api/projects/${_currentProjectId}/members`).catch(() => []);
  const sel = document.getElementById('at-assignee');
  sel.innerHTML = '<option value="">— Unassigned —</option>' +
    members.map(m => `<option value="${m.id}">${esc(m.username)}</option>`).join('');
  document.getElementById('assign-task-modal').style.display = 'flex';
}

async function saveAssignedTask(e) {
  e.preventDefault();
  if (!_currentProjectId) return;
  try {
    await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('at-title').value,
        description: document.getElementById('at-desc').value || null,
        priority: document.getElementById('at-priority').value,
        due_date: toMysqlDateTime(document.getElementById('at-due').value),
        project_id: _currentProjectId,
        assignee_id: Number(document.getElementById('at-assignee').value) || null,
        created_by: userId(),
      }),
    });
    e.target.reset();
    closeModal('assign-task-modal');
    await loadProjectTasks(_currentProjectId);
  } catch (err) {
    showError(err);
  }
}

async function saveProject(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        ownerId: userId(),
        name: document.getElementById('proj-name').value,
        description: document.getElementById('proj-desc').value || null,
        color: document.getElementById('proj-color').value,
      }),
    });
    e.target.reset();
    closeModal('project-modal');
    loadProjects();
    loadSidebarProjects();
  } catch (err) {
    showError(err);
  }
}

async function deleteProject(id) {
  if (!confirmDelete('Delete this project?')) return;
  await apiFetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(showError);
  if (currentPage() === 'project-detail') location.href = 'projects.html';
  else loadProjects();
}

async function loadProjectDetailPage() {
  const id = Number(new URLSearchParams(location.search).get('id'));
  if (!id) { location.href = 'projects.html'; return; }

  const [project, members, tasks, allUsers] = await Promise.all([
    apiFetch(`/api/projects/${id}`).catch(() => null),
    apiFetch(`/api/projects/${id}/members`).catch(() => []),
    apiFetch(`/api/projects/${id}/tasks`).catch(() => []),
    apiFetch(`/api/users/search?q=`).catch(() => []),
  ]);
  if (!project) { location.href = 'projects.html'; return; }

  _currentProjectId = id;

  document.getElementById('pd-title').textContent = project.name;
  document.getElementById('pd-desc').textContent = project.description || '';
  document.getElementById('pd-color-dot').style.background = project.color || '#6366f1';
  document.title = `TaskFlow — ${project.name}`;

  const assigneeSel = document.getElementById('pd-new-assignee');
  if (assigneeSel) {
    assigneeSel.innerHTML = '<option value="">Unassigned</option>' +
      members.map(m => `<option value="${m.id}">${esc(m.username)}</option>`).join('');
  }

  renderPdMembers(members, id);
  renderPdTasks(tasks, members, id);
}

function renderPdMembers(members, projectId) {
  const el = document.getElementById('pd-members');
  if (!el) return;
  el.innerHTML = members.length
    ? members.map(m => `
      <div class="member-row">
        <div class="member-info">
          <div class="member-avatar">${m.username.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(m.username)}</div>
            <div style="font-size:11px;color:var(--text-3)">${esc(m.email)}</div>
          </div>
          <span class="role-badge role-${m.role}">${esc(m.role)}</span>
        </div>
        <button class="btn-sm btn-del" onclick="removePdMember(${projectId},${m.id})">Remove</button>
      </div>`).join('')
    : '<p style="color:var(--text-3);font-size:13px">No members yet.</p>';
}

function renderPdTasks(tasks, members, projectId) {
  const el = document.getElementById('pd-task-list');
  if (!el) return;
  const memberOpts = members.map(m => `<option value="${m.id}">${esc(m.username)}</option>`).join('');
  el.innerHTML = tasks.length
    ? tasks.map(t => `
      <div class="task-row p-${t.priority}" onclick="openDetailPanel(${t.id})" style="cursor:pointer">
        <div class="task-check ${t.status === 'done' ? 'done' : ''}" onclick="event.stopPropagation();toggleTaskDone(${t.id},'${t.status}');setTimeout(()=>loadProjectDetailPage(),400)"></div>
        <div class="task-body">
          <div class="task-title-row">
            <div class="task-priority-pip" style="background:${PRIORITY_COLORS[t.priority]||'var(--border-2)'}"></div>
            <span class="task-name ${t.status === 'done' ? 'done-text' : ''}">${esc(t.title)}</span>
          </div>
          <div class="task-meta-row">
            ${getDueChip(t.due_date)}
            <span class="badge status-${t.status}">${t.status}</span>
          </div>
        </div>
        <div class="task-actions" onclick="event.stopPropagation()">
          <select class="dm-field-select" style="font-size:11px;padding:2px 4px" onchange="reassignPdTask(${t.id},this.value)">
            <option value="">Unassigned</option>
            ${members.map(m => `<option value="${m.id}" ${m.id===t.assignee_id?'selected':''}>${esc(m.username)}</option>`).join('')}
          </select>
          <button class="btn-sm btn-del" onclick="deletePdTask(${t.id})">✕</button>
        </div>
      </div>`).join('')
    : `<div class="empty-state"><span class="empty-state-icon">✓</span>No tasks yet</div>`;
}

async function removePdMember(projectId, memberId) {
  if (!confirmDelete('Remove this member from the project?')) return;
  await apiFetch(`/api/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }).catch(showError);
  loadProjectDetailPage();
}

async function reassignPdTask(taskId, assigneeId) {
  await apiFetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ assignee_id: Number(assigneeId) || null }),
  }).catch(showError);
  loadProjectDetailPage();
}

async function deletePdTask(taskId) {
  if (!confirmDelete('Delete this task?')) return;
  await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' }).catch(showError);
  loadProjectDetailPage();
}

let _pdMemberSearchTimeout = null;
function searchPdMember() {
  clearTimeout(_pdMemberSearchTimeout);
  _pdMemberSearchTimeout = setTimeout(async () => {
    const q = document.getElementById('pd-member-search').value.trim();
    const el = document.getElementById('pd-member-results');
    if (q.length < 2) { el.innerHTML = ''; return; }
    const users = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`).catch(() => []);
    el.innerHTML = users.length
      ? users.map(u => `
        <div class="search-result-item">
          <div class="member-info">
            <div class="member-avatar" style="width:26px;height:26px;font-size:11px;border-radius:6px">${u.username.charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text)">${esc(u.username)}</div>
              <div style="font-size:11px;color:var(--text-3)">${esc(u.email)}</div>
            </div>
          </div>
          <button class="btn-sm btn-accent" onclick="addPdMember(${u.id})">+ Add</button>
        </div>`).join('')
      : '<p style="color:var(--text-3);font-size:13px;padding:8px 0">No users found</p>';
  }, 300);
}

async function addPdMember(memberId) {
  const role = document.getElementById('pd-member-role').value;
  await apiFetch(`/api/projects/${_currentProjectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId: memberId, role }),
  }).catch(showError);
  document.getElementById('pd-member-search').value = '';
  document.getElementById('pd-member-results').innerHTML = '';
  loadProjectDetailPage();
}

async function savePdTask(e) {
  e.preventDefault();
  const assigneeId = Number(document.getElementById('pd-new-assignee').value) || null;
  try {
    await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('pd-new-title').value,
        description: document.getElementById('pd-new-desc').value || null,
        priority: document.getElementById('pd-new-priority').value,
        due_date: toMysqlDateTime(document.getElementById('pd-new-due').value),
        project_id: _currentProjectId,
        assignee_id: assigneeId,
        created_by: userId(),
      }),
    });
    e.target.reset();
    loadProjectDetailPage();
  } catch (err) { showError(err); }
}

async function loadNotes() {
  const params = new URLSearchParams({ user_id: userId(), archived: '0' });
  const search = document.getElementById('note-search')?.value;
  if (search) params.set('search', search);

  const notes = await apiFetch('/api/notes?' + params.toString()).catch(() => []);
  const el = document.getElementById('note-list');
  el.innerHTML = notes.length
    ? notes.map(n => `
      <article class="item-card" style="cursor:pointer" onclick="openNoteEdit(${n.id})">
        <span class="label-dot" style="background:${n.is_pinned ? '#f59e0b' : '#6366f1'}"></span>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.body || '')}</p>
      </article>`).join('')
    : emptyHtml('No notes yet');
}

async function openNoteEdit(noteId) {
  const note = await apiFetch(`/api/notes/${noteId}`).catch(() => null);
  if (!note) return;
  document.getElementById('note-id').value = note.id;
  document.getElementById('note-title').value = note.title;
  document.getElementById('note-body').value = note.body || '';
  document.getElementById('note-pinned').checked = Boolean(note.is_pinned);
  document.querySelector('#note-modal .modal-title').textContent = 'Edit Note';
  document.getElementById('note-delete-btn').style.display = 'inline-flex';
  document.getElementById('note-modal').style.display = 'flex';
}

async function saveNote(e) {
  e.preventDefault();
  const id = document.getElementById('note-id').value;
  try {
    if (id) {
      await apiFetch(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: document.getElementById('note-title').value,
          body: document.getElementById('note-body').value || null,
          isPinned: document.getElementById('note-pinned').checked,
        }),
      });
    } else {
      await apiFetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId(),
          title: document.getElementById('note-title').value,
          body: document.getElementById('note-body').value || null,
          isPinned: document.getElementById('note-pinned').checked,
        }),
      });
    }
    e.target.reset();
    closeModal('note-modal');
    loadNotes();
  } catch (err) {
    showError(err);
  }
}

async function deleteNote(id) {
  if (!confirmDelete('Delete this note?')) return;
  await apiFetch(`/api/notes/${id}`, { method: 'DELETE' }).catch(showError);
  loadNotes();
}

async function deleteCurrentNote() {
  const id = document.getElementById('note-id')?.value;
  if (!id) return;
  await deleteNote(id);
  closeModal('note-modal');
}

async function loadCalendar() {
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  const params = new URLSearchParams({
    user_id: userId(),
    from: `${year}-${String(month+1).padStart(2,'0')}-01 00:00:00`,
    to:   `${year}-${String(month+1).padStart(2,'0')}-${String(totalDays).padStart(2,'0')} 23:59:59`,
  });
  const [events, allTasks] = await Promise.all([
    apiFetch('/api/calendar?' + params.toString()).catch(() => []),
    apiFetch(`/api/tasks?user_id=${userId()}`).catch(() => []),
  ]);

  const monthTasks = allTasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  document.getElementById('cal-title').textContent =
    firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('cal-grid');
  const list = document.getElementById('event-list-day');
  const today = new Date();
  grid.innerHTML = '';

  // Monday-first offset: Sun(0)→6, Mon(1)→0, Tue(2)→1 ...
  const offset = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < offset; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-cell cal-blank';
    grid.appendChild(blank);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dayEvents = events.filter(ev => new Date(ev.start_at).getDate() === day);
    const dayTasks  = monthTasks.filter(t => new Date(t.due_date).getDate() === day);
    const isToday = today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === day;

    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (isToday ? ' today' : '');
    const allItems = [...dayEvents.map(ev => ({ type: 'event', ev })), ...dayTasks.map(t => ({ type: 'task', t }))];
    cell.innerHTML = `
      <div class="cal-day-num">${day}</div>
      ${dayEvents.slice(0,2).map(ev =>
        `<span class="cal-event-dot" style="color:${esc(ev.color||'var(--cyan)')}">${esc(ev.title)}</span>`
      ).join('')}
      ${dayTasks.slice(0,2).map(t =>
        `<span class="cal-event-dot" style="color:var(--text-2);opacity:.8">✓ ${esc(t.title)}</span>`
      ).join('')}
      ${allItems.length > 4 ? `<span class="cal-event-dot" style="color:var(--text-3)">+${allItems.length-4} more</span>` : ''}`;
    cell.onclick = () => {
      document.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      list.innerHTML = '';
      if (dayEvents.length) {
        list.innerHTML += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin-bottom:8px">Events</div>`;
        list.innerHTML += dayEvents.map(ev => `
          <div class="row-card">
            <div>
              <strong>${esc(ev.title)}</strong>
              <p>${dateTimeValue(ev.start_at)}${ev.location ? ' · ' + esc(ev.location) : ''}</p>
            </div>
            <button class="btn-sm btn-del" onclick="deleteEvent(${ev.id})">Delete</button>
          </div>`).join('');
      }
      if (dayTasks.length) {
        list.innerHTML += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin:12px 0 8px">Tasks due ${dateStr}</div>`;
        list.innerHTML += dayTasks.map(t => `
          <div class="row-card">
            <div>
              <span class="badge priority-${esc(t.priority)}">${esc(t.priority)}</span>
              <strong style="margin-left:6px">${esc(t.title)}</strong>
              <p><span class="badge status-${esc(t.status)}">${esc(t.status)}</span></p>
            </div>
            <button class="btn-sm" onclick="openDetailPanel(${t.id})">Open</button>
          </div>`).join('');
      }
      if (!dayEvents.length && !dayTasks.length) {
        list.innerHTML = `<div class="empty-state" style="padding:16px"><span class="empty-state-icon">📅</span>No events or tasks on this day</div>`;
      }
    };
    grid.appendChild(cell);
  }

  list.innerHTML = (events.length || monthTasks.length)
    ? [...events.slice(0,3).map(ev => `
        <div class="row-card">
          <div><strong>${esc(ev.title)}</strong><p>${dateTimeValue(ev.start_at)}</p></div>
          <button class="btn-sm btn-del" onclick="deleteEvent(${ev.id})">Delete</button>
        </div>`),
       ...monthTasks.slice(0,3).map(t => `
        <div class="row-card">
          <div><strong>✓ ${esc(t.title)}</strong><p>${dateValue(t.due_date)} · <span class="badge status-${esc(t.status)}">${esc(t.status)}</span></p></div>
          <button class="btn-sm" onclick="openDetailPanel(${t.id})">Open</button>
        </div>`)].join('')
    : `<div class="empty-state" style="padding:16px"><span class="empty-state-icon">📅</span>No events this month</div>`;
}

function calPrev() {
  state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
  loadCalendar();
}

function calNext() {
  state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
  loadCalendar();
}

async function saveEvent(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/calendar', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId(),
        title: document.getElementById('event-title').value,
        startAt: toMysqlDateTime(document.getElementById('event-start').value),
        endAt: toMysqlDateTime(document.getElementById('event-end').value),
        location: document.getElementById('event-location').value || null,
        color: document.getElementById('event-color').value,
        isAllDay: document.getElementById('event-allday').checked,
      }),
    });
    e.target.reset();
    closeModal('event-modal');
    loadCalendar();
  } catch (err) {
    showError(err);
  }
}

async function deleteEvent(id) {
  if (!confirmDelete('Delete this event?')) return;
  await apiFetch(`/api/calendar/${id}`, { method: 'DELETE' }).catch(showError);
  loadCalendar();
}

async function loadHabits() {
  const habits = await apiFetch(`/api/habits?user_id=${userId()}`).catch(() => []);
  const el = document.getElementById('habit-list');
  if (!el) return;
  if (!habits.length) {
    el.innerHTML = `<div class="empty-state"><span class="empty-state-icon">◉</span>No habits yet</div>`;
    return;
  }
  const items = await Promise.all(habits.map(async h => {
    const s = await apiFetch(`/api/habits/${h.id}/streak`).catch(() => ({ streak: 0, todayCount: 0, frequency: h.frequency }));
    const unitLabel = { daily: 'day', weekly: 'week', monthly: 'month' }[s.frequency] || 'day';
    const periodLabel = { daily: 'Today', weekly: 'This week', monthly: 'This month' }[s.frequency] || 'Today';
    const streakZero = s.streak === 0;
    return `
      <article class="item-card" style="cursor:pointer" onclick="logHabit(${h.id})">
        <div class="item-card-accent" style="background:${esc(h.color)}"></div>
        <h3>${esc(h.name)}</h3>
        <p style="color:var(--text-3);font-size:12px">${esc(h.frequency)} · target ${h.target_count}×</p>
        <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="streak-badge" style="${streakZero ? 'opacity:.4' : ''}">
            🔥 ${s.streak} ${unitLabel} streak
          </span>
          <span style="font-size:12px;color:var(--text-3)">${periodLabel}: <strong>${s.todayCount}×</strong></span>
        </div>
        <div class="card-actions" style="margin-top:12px" onclick="event.stopPropagation()">
          <button class="btn-sm btn-del" onclick="deleteHabit(${h.id})">Delete</button>
        </div>
      </article>`;
  }));
  el.innerHTML = items.join('');
}

async function saveHabit(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/habits', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId(),
        name: document.getElementById('habit-name').value,
        frequency: document.getElementById('habit-freq').value,
        color: document.getElementById('habit-color').value,
      }),
    });
    e.target.reset();
    closeModal('habit-modal');
    loadHabits();
  } catch (err) {
    showError(err);
  }
}

async function logHabit(id) {
  await apiFetch(`/api/habits/${id}/log`, {
    method: 'POST',
    body: JSON.stringify({ userId: userId() }),
  }).catch(showError);
  loadHabits();
}

async function deleteHabit(id) {
  if (!confirmDelete('Delete this habit?')) return;
  await apiFetch(`/api/habits/${id}`, { method: 'DELETE' }).catch(showError);
  loadHabits();
}

async function loadGoals() {
  const goals = await apiFetch(`/api/goals?user_id=${userId()}`).catch(() => []);
  const el = document.getElementById('goal-list');
  if (!el) return;
  el.innerHTML = goals.length
    ? goals.map(g => `
      <article class="item-card" style="cursor:pointer" onclick="openGoalDetail(${g.id})">
        <div class="item-card-accent" style="background:${g.status === 'completed' ? 'var(--green)' : g.status === 'abandoned' ? 'var(--red)' : 'var(--accent)'}"></div>
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.description || '')}</p>
        <div class="progress-bar" style="margin-top:10px">
          <div class="progress-fill" style="width:${g.progress}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-3);margin-top:4px">
          <span>${g.progress}% complete</span>
          <span>${g.target_date ? dateValue(g.target_date) : 'No deadline'}</span>
        </div>
      </article>`).join('')
    : `<div class="empty-state"><span class="empty-state-icon">◎</span>No goals yet</div>`;
}

let _goalDetailId = null;

async function openGoalDetail(goalId) {
  _goalDetailId = goalId;
  const [goal, milestones, tasks, allTasks] = await Promise.all([
    apiFetch(`/api/goals/${goalId}`),
    apiFetch(`/api/goals/${goalId}/milestones`).catch(() => []),
    apiFetch(`/api/goals/${goalId}/tasks`).catch(() => []),
    apiFetch('/api/tasks').catch(() => []),
  ]);

  const modal = document.getElementById('goal-detail-modal');
  if (!modal) return;

  document.getElementById('gd-title').textContent = goal.title;
  document.getElementById('gd-desc').textContent = goal.description || '';
  document.getElementById('gd-status').value = goal.status;
  document.getElementById('gd-progress-val').textContent = goal.progress + '%';
  document.getElementById('gd-progress-range').value = goal.progress;

  const msEl = document.getElementById('gd-milestones');
  msEl.innerHTML = milestones.map(m => `
    <div class="dm-subtask-row">
      <div class="task-check ${m.is_done ? 'done' : ''}" style="width:16px;height:16px"
        onclick="toggleMilestone(${goal.id},${m.id},${m.is_done ? 0 : 1})"></div>
      <span class="dm-subtask-title ${m.is_done ? 'done-text' : ''}">${esc(m.title)}</span>
    </div>`).join('') || '<p style="font-size:12px;color:var(--text-3)">No milestones</p>';

  const linkedIds = new Set(tasks.map(t => t.id));
  const taskEl = document.getElementById('gd-tasks');
  taskEl.innerHTML = tasks.map(t => `
    <div class="dm-subtask-row">
      <div class="task-check ${t.status === 'done' ? 'done' : ''}" style="width:16px;height:16px"></div>
      <span class="dm-subtask-title ${t.status === 'done' ? 'done-text' : ''}" style="flex:1">${esc(t.title)}</span>
      <button class="btn-sm btn-del" style="font-size:10px;padding:2px 6px" onclick="unlinkGoalTask(${goal.id},${t.id})">−</button>
    </div>`).join('') || '<p style="font-size:12px;color:var(--text-3)">No linked tasks</p>';

  const addSel = document.getElementById('gd-task-add');
  addSel.innerHTML = '<option value="">— Link a task —</option>' +
    allTasks.filter(t => !linkedIds.has(t.id)).map(t =>
      `<option value="${t.id}">${esc(t.title)}</option>`).join('');

  modal.style.display = 'flex';
}

async function toggleMilestone(goalId, msId, isDone) {
  await apiFetch(`/api/goals/${goalId}/milestones/${msId}`, {
    method: 'PATCH', body: JSON.stringify({ isDone: Boolean(isDone) }),
  }).catch(showError);
  openGoalDetail(goalId);
}

async function linkGoalTask() {
  if (!_goalDetailId) return;
  const sel = document.getElementById('gd-task-add');
  const taskId = Number(sel.value);
  if (!taskId) return;
  await apiFetch(`/api/goals/${_goalDetailId}/tasks`, {
    method: 'POST', body: JSON.stringify({ taskId }),
  }).catch(showError);
  openGoalDetail(_goalDetailId);
}

async function unlinkGoalTask(goalId, taskId) {
  await apiFetch(`/api/goals/${goalId}/tasks/${taskId}`, { method: 'DELETE' }).catch(showError);
  openGoalDetail(goalId);
}

async function saveGoalProgress() {
  if (!_goalDetailId) return;
  const progress = Number(document.getElementById('gd-progress-range').value);
  await apiFetch(`/api/goals/${_goalDetailId}`, {
    method: 'PATCH', body: JSON.stringify({ progress }),
  }).catch(showError);
  document.getElementById('gd-progress-val').textContent = progress + '%';
  loadGoals();
}

async function recalcGoalProgress() {
  if (!_goalDetailId) return;
  const updated = await apiFetch(`/api/goals/${_goalDetailId}/recalc`, { method: 'POST' }).catch(showError);
  if (updated) openGoalDetail(_goalDetailId);
  loadGoals();
}

async function saveGoalStatus() {
  if (!_goalDetailId) return;
  const status = document.getElementById('gd-status').value;
  await apiFetch(`/api/goals/${_goalDetailId}`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  }).catch(showError);
  loadGoals();
}

async function addGoalMilestone() {
  if (!_goalDetailId) return;
  const input = document.getElementById('gd-ms-input');
  const title = input.value.trim();
  if (!title) return;
  await apiFetch(`/api/goals/${_goalDetailId}/milestones`, {
    method: 'POST', body: JSON.stringify({ title }),
  }).catch(showError);
  input.value = '';
  openGoalDetail(_goalDetailId);
}

async function saveGoal(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId(),
        title: document.getElementById('goal-title').value,
        description: document.getElementById('goal-desc').value || null,
        targetDate: document.getElementById('goal-date').value || null,
        progress: Number(document.getElementById('goal-progress').value) || 0,
      }),
    });
    e.target.reset();
    closeModal('goal-modal');
    loadGoals();
  } catch (err) {
    showError(err);
  }
}

async function deleteGoal(id) {
  if (!confirmDelete('Delete this goal?')) return;
  await apiFetch(`/api/goals/${id}`, { method: 'DELETE' }).catch(showError);
  loadGoals();
}

async function deleteCurrentGoal() {
  if (!_goalDetailId) return;
  await deleteGoal(_goalDetailId);
  _goalDetailId = null;
  closeModal('goal-detail-modal');
}

async function toggleTimer() {
  const btn = document.getElementById('timer-btn');
  if (btn.disabled) return;
  btn.disabled = true;

  try {
    if (!state.activeTimerId) {
      state.focusDoneNotified = false;
      const entry = await apiFetch('/api/time/start', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId(), description: 'Timer session' }),
      });
      state.activeTimerId = entry.id;
      state.timerStartedAt = new Date();
      btn.textContent = 'stop';
      btn.classList.add('running');
      renderFocusClock();
    } else {
      await apiFetch(`/api/time/${state.activeTimerId}/stop`, { method: 'PATCH' });
      state.activeTimerId = null;
      state.timerStartedAt = null;
      btn.textContent = 'start';
      btn.classList.remove('running');
      renderFocusClock();
    }
  } catch (err) {
    showError(err);
  } finally {
    btn.disabled = false;
  }
}

function focusStorageKey() {
  return `taskflow.focus.${userId() || 'guest'}`;
}

function getFocusSettings() {
  const defaults = {
    title: 'study with me',
    subtitle: 'TaskFlow focus room',
    motivationWords: 'Deep work\nStay with it\nOne session at a time',
    backgroundUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=80',
    youtubeUrl: '',
    discordUrl: '',
    discordWidgetUrl: '',
    quickNote: '',
  };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(focusStorageKey())) };
  } catch {
    return defaults;
  }
}

function saveFocusSettings() {
  const settings = {
    ...getFocusSettings(),
    title: document.getElementById('focus-title')?.value.trim() || 'study with me',
    subtitle: document.getElementById('focus-subtitle')?.value.trim() || 'TaskFlow focus room',
    motivationWords: document.getElementById('focus-motivation-words')?.value || '',
    backgroundUrl: document.getElementById('focus-bg-url')?.value.trim() || '',
    youtubeUrl: document.getElementById('focus-youtube-url')?.value.trim() || '',
    discordUrl: document.getElementById('focus-discord-url')?.value.trim() || '',
    discordWidgetUrl: document.getElementById('focus-discord-widget')?.value.trim() || '',
  };
  localStorage.setItem(focusStorageKey(), JSON.stringify(settings));
  applyFocusSettings();
}

function saveFocusQuickNote() {
  const settings = { ...getFocusSettings(), quickNote: document.getElementById('focus-quick-note')?.value || '' };
  localStorage.setItem(focusStorageKey(), JSON.stringify(settings));
}

function applyFocusSettings() {
  const scene = document.getElementById('focus-scene');
  if (!scene) return;
  const settings = getFocusSettings();
  const fallbackBg = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1800&q=80';
  scene.style.setProperty('--focus-bg', `url("${settings.backgroundUrl || fallbackBg}")`);

  const bgInput = document.getElementById('focus-bg-url');
  const titleInput = document.getElementById('focus-title');
  const subtitleInput = document.getElementById('focus-subtitle');
  const motivationInput = document.getElementById('focus-motivation-words');
  const ytInput = document.getElementById('focus-youtube-url');
  const discordInput = document.getElementById('focus-discord-url');
  const widgetInput = document.getElementById('focus-discord-widget');
  const noteInput = document.getElementById('focus-quick-note');
  if (titleInput) titleInput.value = settings.title;
  if (subtitleInput) subtitleInput.value = settings.subtitle;
  if (motivationInput) motivationInput.value = settings.motivationWords || '';
  if (bgInput) bgInput.value = settings.backgroundUrl;
  if (ytInput) ytInput.value = settings.youtubeUrl;
  if (discordInput) discordInput.value = settings.discordUrl;
  if (widgetInput) widgetInput.value = settings.discordWidgetUrl;
  if (noteInput) noteInput.value = settings.quickNote || '';

  applyYoutubePlayer(settings.youtubeUrl);
  applyDiscordPanel(settings);
  applyFocusBrand(settings);
  renderFocusClock();
}

function applyFocusBrand(settings) {
  const title = document.getElementById('focus-brand-main');
  const subtitle = document.getElementById('focus-brand-sub');
  if (!title || !subtitle) return;
  const words = (settings.motivationWords || '')
    .split('\n')
    .map(word => word.trim())
    .filter(Boolean);
  if (words.length) {
    const index = Math.floor(Date.now() / 60000) % words.length;
    title.textContent = words[index];
    subtitle.textContent = settings.subtitle || 'TaskFlow focus room';
    return;
  }
  title.textContent = settings.title || 'study with me';
  subtitle.textContent = settings.subtitle || 'TaskFlow focus room';
}

function applyYoutubePlayer(url) {
  const frame = document.getElementById('focus-youtube-frame');
  const empty = document.getElementById('focus-youtube-empty');
  if (!frame || !empty) return;
  const embed = toYoutubeEmbedUrl(url);
  frame.style.display = embed ? '' : 'none';
  empty.style.display = embed ? 'none' : '';
  if (embed && frame.src !== embed) frame.src = embed;
  if (!embed) frame.removeAttribute('src');
}

function toYoutubeEmbedUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    let id = '';
    if (parsed.hostname.includes('youtu.be')) id = parsed.pathname.slice(1);
    if (parsed.hostname.includes('youtube.com')) id = parsed.searchParams.get('v') || parsed.pathname.split('/').pop();
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=0&controls=1` : '';
  } catch {
    return '';
  }
}

function applyDiscordPanel(settings) {
  const hasDiscord = Boolean(settings.discordUrl || settings.discordWidgetUrl);
  const discordBtn = document.querySelector('[onclick="toggleFocusPanel(\'focus-discord-panel\')"]');
  const panel = document.getElementById('focus-discord-panel');
  const link = document.getElementById('focus-discord-link');
  const widgetWrap = document.getElementById('focus-discord-widget-wrap');
  if (discordBtn) discordBtn.style.display = hasDiscord ? '' : 'none';
  if (panel && !hasDiscord) panel.style.display = 'none';
  if (link) {
    link.style.display = settings.discordUrl ? '' : 'none';
    link.href = settings.discordUrl || '#';
  }
  if (!widgetWrap) return;
  if (settings.discordWidgetUrl) {
    widgetWrap.className = 'focus-widget-frame';
    widgetWrap.innerHTML = `<iframe title="Discord widget" src="${escAttr(settings.discordWidgetUrl)}" allowtransparency="true" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>`;
  } else {
    widgetWrap.className = 'focus-widget-empty';
    widgetWrap.textContent = 'Add a Discord widget URL in settings';
  }
}

function toggleFocusPanel(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? '' : 'none';
}

function setFocusMinutes(minutes) {
  const safeMinutes = Math.min(240, Math.max(1, Number(minutes) || 25));
  state.focusDurationSeconds = safeMinutes * 60;
  state.focusDoneNotified = false;
  if (!state.activeTimerId) renderFocusClock();
}

function beginTimerEdit() {
  if (state.activeTimerId) return;
  const display = document.getElementById('timer-display');
  if (!display) return;
  display.value = String(Math.round(state.focusDurationSeconds / 60));
  display.select();
}

function commitTimerEdit() {
  if (state.activeTimerId) return;
  const display = document.getElementById('timer-display');
  if (!display) return;
  const raw = display.value.trim();
  const minutes = raw.includes(':') ? Number(raw.split(':')[0]) : Number(raw);
  setFocusMinutes(minutes);
  renderFocusClock();
}

function handleTimerEditKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    event.currentTarget.blur();
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    renderFocusClock();
    event.currentTarget.blur();
  }
}

function resetFocusClock() {
  state.focusDoneNotified = false;
  if (!state.activeTimerId) {
    renderFocusClock();
    return;
  }
  state.timerStartedAt = new Date();
  renderFocusClock();
}

function renderFocusClock() {
  const display = document.getElementById('timer-display');
  if (!display) return;
  if (!state.timerStartedAt) {
    display.value = formatClock(state.focusDurationSeconds);
    return;
  }
  const elapsed = Math.floor((Date.now() - state.timerStartedAt.getTime()) / 1000);
  const remaining = Math.max(0, state.focusDurationSeconds - elapsed);
  display.value = formatClock(remaining);
  if (remaining === 0 && !state.focusDoneNotified) notifyFocusDone();
}

function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  if (safeSeconds < 3600) {
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return new Date(safeSeconds * 1000).toISOString().slice(11, 19);
}

function notifyFocusDone() {
  state.focusDoneNotified = true;
  playFocusAlarm();
  showFocusToast('Time is up. Take a break or start the next session.');
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Focus timer finished', { body: 'Time is up. Take a break or start the next session.' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') new Notification('Focus timer finished', { body: 'Time is up.' });
      });
    }
  }
}

function playFocusAlarm() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  [0, 0.18, 0.36].forEach(offset => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + offset);
    osc.stop(ctx.currentTime + offset + 0.16);
  });
}

function showFocusToast(message) {
  let toast = document.getElementById('focus-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'focus-toast';
    toast.className = 'focus-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showFocusToast._timer);
  showFocusToast._timer = window.setTimeout(() => toast.classList.remove('show'), 6000);
}

async function loadNotifications() {
  const list = await apiFetch(`/api/notifications?user_id=${userId()}`).catch(() => []);
  const count = await apiFetch(`/api/notifications/count?user_id=${userId()}`).catch(() => ({ count: 0 }));
  const badge = document.getElementById('notif-badge');
  const el = document.getElementById('notif-list');
  if (badge) badge.textContent = count.count ? String(count.count) : '';
  el.innerHTML = list.length
    ? list.map(n => `
      <div class="notif-item ${n.is_read ? '' : 'unread'}">
        ${!n.is_read ? '<div class="notif-dot"></div>' : '<div style="width:8px"></div>'}
        <div class="notif-content">
          <div class="notif-title">${esc(n.title)}</div>
          ${n.body ? `<div class="notif-body">${esc(n.body)}</div>` : ''}
          <div class="notif-time">${dateTimeValue(n.created_at)}</div>
        </div>
        ${!n.is_read ? `<button class="btn-sm" onclick="markRead(${n.id})">✓ Read</button>` : ''}
      </div>`).join('')
    : `<div class="empty-state"><span class="empty-state-icon">◯</span>No notifications</div>`;
}

async function markRead(id) {
  await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(showError);
  loadNotifications();
}

async function markAllRead() {
  await apiFetch('/api/notifications/read-all', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId() }),
  }).catch(showError);
  loadNotifications();
}

async function loadSettings() {
  const settings = await apiFetch(`/api/settings/${userId()}`).catch(() => null);
  if (!settings) return;
  document.getElementById('s-theme').value = settings.theme;
  document.getElementById('s-language').value = settings.language;
  document.getElementById('s-timezone').value = settings.timezone;
  document.getElementById('s-week').value = String(settings.week_starts_on);
  document.getElementById('s-notif').value = String(settings.notifications_enabled);
}

async function saveSettings(e) {
  e.preventDefault();
  try {
    await apiFetch(`/api/settings/${userId()}`, {
      method: 'PATCH',
      body: JSON.stringify({
        theme: document.getElementById('s-theme').value,
        language: document.getElementById('s-language').value,
        timezone: document.getElementById('s-timezone').value,
        weekStartsOn: Number(document.getElementById('s-week').value),
        notificationsEnabled: document.getElementById('s-notif').value === '1',
      }),
    });
  } catch (err) {
    showError(err);
  }
}

function cardHtml(title, body, color, deleteAction, secondaryAction) {
  return `
    <article class="item-card">
      <span class="label-dot" style="background:${esc(color || '#6366f1')}"></span>
      <h3>${esc(title)}</h3>
      <p>${esc(body || '')}</p>
      <div class="card-actions">
        ${secondaryAction ? `<button class="btn-sm" onclick="${secondaryAction}">Log</button>` : ''}
        <button class="btn-sm btn-del" onclick="${deleteAction}">Delete</button>
      </div>
    </article>`;
}

function rowCard(title, detail, action) {
  return `
    <div class="row-card">
      <div><strong>${esc(title)}</strong><p>${esc(detail || '')}</p></div>
      <button class="btn-sm" onclick="${action}">Done</button>
    </div>`;
}

function formatSeconds(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

setInterval(() => {
  if (!state.timerStartedAt) return;
  renderFocusClock();
}, 1000);

document.querySelectorAll?.('.modal')?.forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });
});

function currentPage() {
  const p = location.pathname;
  if (p.endsWith('calendar.html'))      return 'calendar';
  if (p.endsWith('notes.html'))         return 'notes';
  if (p.endsWith('habits.html'))        return 'habits';
  if (p.endsWith('goals.html'))         return 'goals';
  if (p.endsWith('time.html'))          return 'time';
  if (p.endsWith('labels.html'))        return 'labels';
  if (p.endsWith('notifications.html')) return 'notifications';
  if (p.endsWith('projects.html'))       return 'projects';
  if (p.endsWith('project-detail.html')) return 'project-detail';
  if (p.endsWith('settings.html'))      return 'settings';
  if (p.endsWith('profile.html'))       return 'profile';
  if (p.endsWith('dashboard.html') || p === '/' || p.endsWith('/')) return 'tasks';
  return null;
}

(function init() {
  const page = currentPage();
  const user = getUser();

  if (page !== null && !user) { location.href = 'index.html'; return; }
  if (page === null && user)  { location.href = 'dashboard.html'; return; }
  if (page === null) return;

  const name = user.username || user.email;
  const sidebarUser = document.getElementById('sidebar-user');
  if (sidebarUser) sidebarUser.textContent = name;
  const avatarEl = document.getElementById('user-avatar-char');
  if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  loadSidebarProjects();
  loadSidebarLabels();
  loadNotifications();

  const sp = new URLSearchParams(location.search);
  if (page === 'tasks') {
    _taskFilter = sp.get('filter') || 'all';
    _labelFilter = sp.get('label') ? Number(sp.get('label')) : null;
    if (_taskFilter !== 'all') {
      document.querySelectorAll('[data-page="tasks"]').forEach(el => el.classList.remove('active'));
      document.querySelectorAll(`.nav-link[href="dashboard.html?filter=${_taskFilter}"]`).forEach(el => el.classList.add('active'));
    }
    loadTasks();
  } else if (page === 'calendar')      loadCalendar();
  else if (page === 'notes')           loadNotes();
  else if (page === 'habits')          loadHabits();
  else if (page === 'goals')           loadGoals();
  else if (page === 'time')            applyFocusSettings();
  else if (page === 'labels')          loadLabels();
  else if (page === 'notifications')   loadNotifications();
  else if (page === 'projects')        loadProjects();
  else if (page === 'project-detail')  loadProjectDetailPage();
  else if (page === 'settings')        loadSettings();
  else if (page === 'profile')         loadProfile();
})();
