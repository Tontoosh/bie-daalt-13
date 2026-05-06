'use strict';

const API = '';
const state = {
  calendarDate: new Date(),
  activeTimerId: null,
  timerStartedAt: null,
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

function dateValue(value) {
  return value ? new Date(value).toLocaleDateString() : '';
}

function dateTimeValue(value) {
  return value ? new Date(value).toLocaleString() : '';
}

function toMysqlDateTime(value) {
  return value ? value.replace('T', ' ') + ':00' : null;
}

function emptyHtml(message) {
  return `<p class="empty-state">${esc(message)}</p>`;
}

function confirmDelete(message) {
  return window.confirm(message);
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

function showSection(name) {
  const sections = ['tasks', 'projects', 'notes', 'calendar', 'habits', 'goals', 'time', 'labels', 'notifications', 'settings'];
  sections.forEach(section => {
    const el = document.getElementById(`section-${section}`);
    if (el) el.style.display = section === name ? '' : 'none';
  });

  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick')?.includes(`'${name}'`) ?? false);
  });

  const loaders = {
    tasks: loadTasks,
    projects: loadProjects,
    notes: loadNotes,
    calendar: loadCalendar,
    habits: loadHabits,
    goals: loadGoals,
    time: loadTimeEntries,
    labels: loadLabels,
    notifications: loadNotifications,
    settings: loadSettings,
  };
  loaders[name]?.();
}

function openModal(id) {
  if (id === 'task-modal') return openTaskModal();
  if (id === 'label-modal') return openLabelModal();

  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

async function loadTasks() {
  const params = new URLSearchParams();
  const status = document.getElementById('filter-status')?.value;
  const priority = document.getElementById('filter-priority')?.value;
  const search = document.getElementById('filter-search')?.value;

  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);
  if (search) params.set('search', search);

  const tasks = await apiFetch('/api/tasks?' + params.toString()).catch(() => []);
  const tbody = document.getElementById('task-list');
  if (!tbody) return;

  tbody.innerHTML = tasks.length
    ? tasks.map(t => `
      <tr>
        <td>${esc(t.title)}</td>
        <td><span class="badge status-${esc(t.status)}">${esc(t.status)}</span></td>
        <td><span class="badge priority-${esc(t.priority)}">${esc(t.priority)}</span></td>
        <td>${dateValue(t.due_date)}</td>
        <td>
          <button class="btn-sm" onclick="editTask(${t.id})">Edit</button>
          <button class="btn-sm btn-del" onclick="deleteTask(${t.id})">Delete</button>
        </td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="table-empty">No tasks yet</td></tr>';
}

function openTaskModal(task) {
  document.getElementById('task-id').value = task?.id || '';
  document.getElementById('task-title').value = task?.title || '';
  document.getElementById('task-desc').value = task?.description || '';
  document.getElementById('task-status').value = task?.status || 'todo';
  document.getElementById('task-priority').value = task?.priority || 'medium';
  document.getElementById('task-due').value = task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '';
  document.getElementById('task-modal-title').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('task-modal').style.display = 'flex';
}

async function editTask(id) {
  const task = await apiFetch(`/api/tasks/${id}`).catch(() => null);
  if (task) openTaskModal(task);
}

async function saveTask(e) {
  e.preventDefault();
  const id = document.getElementById('task-id').value;
  const body = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-desc').value || null,
    status: document.getElementById('task-status').value,
    priority: document.getElementById('task-priority').value,
    due_date: toMysqlDateTime(document.getElementById('task-due').value),
  };

  try {
    await apiFetch(id ? `/api/tasks/${id}` : '/api/tasks', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(body),
    });
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

async function loadProjects() {
  const projects = await apiFetch(`/api/projects?user_id=${userId()}`).catch(() => []);
  const el = document.getElementById('project-list');
  el.innerHTML = projects.length
    ? projects.map(p => cardHtml(p.name, p.description, p.color, `deleteProject(${p.id})`)).join('')
    : emptyHtml('No projects yet');
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
  } catch (err) {
    showError(err);
  }
}

async function deleteProject(id) {
  if (!confirmDelete('Delete this project?')) return;
  await apiFetch(`/api/projects/${id}`, { method: 'DELETE' }).catch(showError);
  loadProjects();
}

async function loadNotes() {
  const params = new URLSearchParams({ user_id: userId(), archived: '0' });
  const search = document.getElementById('note-search')?.value;
  if (search) params.set('search', search);

  const notes = await apiFetch('/api/notes?' + params.toString()).catch(() => []);
  const el = document.getElementById('note-list');
  el.innerHTML = notes.length
    ? notes.map(n => cardHtml(n.title, n.body, n.is_pinned ? '#f59e0b' : '#6366f1', `deleteNote(${n.id})`)).join('')
    : emptyHtml('No notes yet');
}

async function saveNote(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/notes', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId(),
        title: document.getElementById('note-title').value,
        body: document.getElementById('note-body').value || null,
        isPinned: document.getElementById('note-pinned').checked,
      }),
    });
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

async function loadCalendar() {
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  const params = new URLSearchParams({
    user_id: userId(),
    from: start.toISOString().slice(0, 19).replace('T', ' '),
    to: end.toISOString().slice(0, 19).replace('T', ' '),
  });
  const events = await apiFetch('/api/calendar?' + params.toString()).catch(() => []);
  const title = document.getElementById('cal-title');
  const grid = document.getElementById('cal-grid');
  const list = document.getElementById('event-list-day');

  title.textContent = state.calendarDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  grid.innerHTML = '';

  for (let day = 1; day <= end.getDate(); day++) {
    const dayEvents = events.filter(ev => new Date(ev.start_at).getDate() === day);
    const cell = document.createElement('button');
    cell.className = 'cal-cell';
    cell.innerHTML = `<strong>${day}</strong><span>${dayEvents.length ? `${dayEvents.length} event` : ''}</span>`;
    cell.onclick = () => {
      list.innerHTML = dayEvents.length
        ? dayEvents.map(ev => rowCard(ev.title, dateTimeValue(ev.start_at), `deleteEvent(${ev.id})`)).join('')
        : emptyHtml('No events that day');
    };
    grid.appendChild(cell);
  }

  list.innerHTML = events.length
    ? events.slice(0, 5).map(ev => rowCard(ev.title, dateTimeValue(ev.start_at), `deleteEvent(${ev.id})`)).join('')
    : emptyHtml('No events this month');
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
  el.innerHTML = habits.length
    ? habits.map(h => cardHtml(h.name, `${h.frequency} - target ${h.target_count}`, h.color, `deleteHabit(${h.id})`, `logHabit(${h.id})`)).join('')
    : emptyHtml('No habits yet');
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
  el.innerHTML = goals.length
    ? goals.map(g => cardHtml(g.title, `${g.progress}% - ${g.status}`, '#10b981', `deleteGoal(${g.id})`)).join('')
    : emptyHtml('No goals yet');
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

async function loadTimeEntries() {
  const entries = await apiFetch(`/api/time?user_id=${userId()}`).catch(() => []);
  const tbody = document.getElementById('time-list');
  tbody.innerHTML = entries.length
    ? entries.map(te => `
      <tr>
        <td>${esc(te.task_title || 'General')}</td>
        <td>${esc(te.description || '')}</td>
        <td>${dateTimeValue(te.started_at)}</td>
        <td>${formatSeconds(te.duration_s)}</td>
        <td><button class="btn-sm btn-del" onclick="deleteTimeEntry(${te.id})">Delete</button></td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="table-empty">No time entries yet</td></tr>';
}

async function saveTimeEntry(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/time', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId(),
        description: document.getElementById('te-desc').value || null,
        startedAt: toMysqlDateTime(document.getElementById('te-start').value),
        endedAt: toMysqlDateTime(document.getElementById('te-end').value),
      }),
    });
    e.target.reset();
    closeModal('time-modal');
    loadTimeEntries();
  } catch (err) {
    showError(err);
  }
}

async function toggleTimer() {
  const btn = document.getElementById('timer-btn');
  if (!state.activeTimerId) {
    const entry = await apiFetch('/api/time/start', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId(), description: 'Timer session' }),
    }).catch(err => {
      showError(err);
      return null;
    });
    if (!entry) return;
    state.activeTimerId = entry.id;
    state.timerStartedAt = new Date(entry.started_at || Date.now());
    btn.textContent = 'Stop';
  } else {
    await apiFetch(`/api/time/${state.activeTimerId}/stop`, { method: 'PATCH' }).catch(showError);
    state.activeTimerId = null;
    state.timerStartedAt = null;
    btn.textContent = 'Start';
    document.getElementById('timer-display').textContent = '00:00:00';
    loadTimeEntries();
  }
}

async function deleteTimeEntry(id) {
  if (!confirmDelete('Delete this time entry?')) return;
  await apiFetch(`/api/time/${id}`, { method: 'DELETE' }).catch(showError);
  loadTimeEntries();
}

async function loadNotifications() {
  const list = await apiFetch(`/api/notifications?user_id=${userId()}`).catch(() => []);
  const count = await apiFetch(`/api/notifications/count?user_id=${userId()}`).catch(() => ({ count: 0 }));
  const badge = document.getElementById('notif-badge');
  const el = document.getElementById('notif-list');
  if (badge) badge.textContent = count.count ? String(count.count) : '';
  el.innerHTML = list.length
    ? list.map(n => rowCard(n.title, n.body || n.type, `markRead(${n.id})`)).join('')
    : emptyHtml('No notifications');
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
  const elapsed = Math.floor((Date.now() - state.timerStartedAt.getTime()) / 1000);
  document.getElementById('timer-display').textContent = new Date(elapsed * 1000).toISOString().slice(11, 19);
}, 1000);

document.querySelectorAll?.('.modal')?.forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });
});

(function init() {
  const isDash = location.pathname.endsWith('dashboard.html');
  const user = getUser();

  if (isDash && !user) {
    location.href = 'index.html';
    return;
  }
  if (!isDash && user) {
    location.href = 'dashboard.html';
    return;
  }
  if (!isDash) return;

  document.getElementById('sidebar-user').textContent = user.username || user.email;
  loadTasks();
  loadNotifications();
})();
