'use strict';

const mysql = require('mysql2/promise');
const config = require('../config');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(config.db);
  }
  return pool;
}

// ─────────────────────────────────────────────────────────────────────────────
// Each CREATE TABLE is a separate execute() call.
// multipleStatements is intentionally OFF — SQL injection protection.
// Table order: parents first, children after (FK dependency order).
// ─────────────────────────────────────────────────────────────────────────────
async function initSchema() {
  const conn = await getPool().getConnection();
  try {

    // ── 1. USERS ──────────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        email         VARCHAR(255)  NOT NULL,
        username      VARCHAR(100)  NOT NULL,
        password_hash VARCHAR(255)  NOT NULL,
        avatar_url    VARCHAR(500),
        is_active     TINYINT(1)    NOT NULL DEFAULT 1,
        created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email    (email),
        UNIQUE KEY uq_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 2. REFRESH TOKENS (JWT) ───────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED  NOT NULL,
        token_hash  VARCHAR(255)  NOT NULL,
        expires_at  DATETIME      NOT NULL,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_token_hash (token_hash),
        CONSTRAINT fk_rt_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_rt_user_id   (user_id),
        INDEX idx_rt_expires   (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 3. USER SETTINGS ──────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id        INT UNSIGNED  NOT NULL,
        theme          ENUM('light','dark','system') NOT NULL DEFAULT 'system',
        language       VARCHAR(10)   NOT NULL DEFAULT 'en',
        timezone       VARCHAR(60)   NOT NULL DEFAULT 'UTC',
        week_starts_on TINYINT(1)    NOT NULL DEFAULT 1,
        notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
        updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id),
        CONSTRAINT fk_us_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 4. PROJECTS ───────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        owner_id     INT UNSIGNED,
        name         VARCHAR(200)  NOT NULL,
        description  TEXT,
        color        VARCHAR(20)   NOT NULL DEFAULT '#6366f1',
        is_archived  TINYINT(1)    NOT NULL DEFAULT 0,
        created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_proj_owner FOREIGN KEY (owner_id)
          REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_proj_owner    (owner_id),
        INDEX idx_proj_archived (is_archived)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 5. PROJECT MEMBERS ────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id  INT UNSIGNED  NOT NULL,
        user_id     INT UNSIGNED  NOT NULL,
        role        ENUM('owner','editor','viewer') NOT NULL DEFAULT 'viewer',
        joined_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (project_id, user_id),
        CONSTRAINT fk_pm_project FOREIGN KEY (project_id)
          REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_pm_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_pm_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 6. LABELS (user-scoped) ───────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS labels (
        id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id    INT UNSIGNED,
        name       VARCHAR(100)  NOT NULL,
        color      VARCHAR(20)   NOT NULL DEFAULT '#6366f1',
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_lbl_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_label_user_name (user_id, name),
        INDEX idx_lbl_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 7. TASKS ──────────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        project_id      INT UNSIGNED,
        assignee_id     INT UNSIGNED,
        created_by      INT UNSIGNED,
        parent_task_id  INT UNSIGNED,
        title           VARCHAR(500)  NOT NULL,
        description     TEXT,
        status     ENUM('todo','in-progress','in-review','done','cancelled')
                        NOT NULL DEFAULT 'todo',
        priority   ENUM('low','medium','high','urgent')
                        NOT NULL DEFAULT 'medium',
        due_date        DATETIME,
        position        INT UNSIGNED  NOT NULL DEFAULT 0,
        created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_task_project  FOREIGN KEY (project_id)
          REFERENCES projects(id) ON DELETE SET NULL,
        CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_id)
          REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_task_creator  FOREIGN KEY (created_by)
          REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_task_parent   FOREIGN KEY (parent_task_id)
          REFERENCES tasks(id) ON DELETE SET NULL,
        INDEX idx_task_project   (project_id),
        INDEX idx_task_assignee  (assignee_id),
        INDEX idx_task_status    (status),
        INDEX idx_task_priority  (priority),
        INDEX idx_task_due_date  (due_date),
        INDEX idx_task_parent    (parent_task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 8. TASK LABELS ────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS task_labels (
        task_id  INT UNSIGNED NOT NULL,
        label_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (task_id, label_id),
        CONSTRAINT fk_tl_task  FOREIGN KEY (task_id)
          REFERENCES tasks(id)  ON DELETE CASCADE,
        CONSTRAINT fk_tl_label FOREIGN KEY (label_id)
          REFERENCES labels(id) ON DELETE CASCADE,
        INDEX idx_tl_label (label_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 9. TASK COMMENTS ──────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        task_id    INT UNSIGNED  NOT NULL,
        user_id    INT UNSIGNED,
        body       TEXT          NOT NULL,
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_tc_task FOREIGN KEY (task_id)
          REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_tc_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_tc_task (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 10. TASK ATTACHMENTS ──────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        task_id     INT UNSIGNED  NOT NULL,
        user_id     INT UNSIGNED,
        file_name   VARCHAR(255)  NOT NULL,
        file_url    VARCHAR(500)  NOT NULL,
        file_size   INT UNSIGNED  NOT NULL DEFAULT 0,
        mime_type   VARCHAR(100),
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_ta_task FOREIGN KEY (task_id)
          REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_ta_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_ta_task (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 11. NOTES (Notion-style rich text) ───────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED,
        project_id  INT UNSIGNED,
        title       VARCHAR(300)  NOT NULL,
        body        LONGTEXT,
        is_pinned   TINYINT(1)    NOT NULL DEFAULT 0,
        is_archived TINYINT(1)    NOT NULL DEFAULT 0,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_note_user    FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_note_project FOREIGN KEY (project_id)
          REFERENCES projects(id) ON DELETE SET NULL,
        INDEX idx_note_user     (user_id),
        INDEX idx_note_project  (project_id),
        INDEX idx_note_pinned   (user_id, is_pinned),
        FULLTEXT KEY ft_note_search (title, body)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 12. NOTE LABELS ───────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS note_labels (
        note_id  INT UNSIGNED NOT NULL,
        label_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (note_id, label_id),
        CONSTRAINT fk_nl_note  FOREIGN KEY (note_id)
          REFERENCES notes(id)  ON DELETE CASCADE,
        CONSTRAINT fk_nl_label FOREIGN KEY (label_id)
          REFERENCES labels(id) ON DELETE CASCADE,
        INDEX idx_nl_label (label_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 13. CALENDAR EVENTS ───────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id          INT UNSIGNED,
        title            VARCHAR(300)  NOT NULL,
        description      TEXT,
        start_at         DATETIME      NOT NULL,
        end_at           DATETIME      NOT NULL,
        is_all_day       TINYINT(1)    NOT NULL DEFAULT 0,
        recurrence_rule  VARCHAR(200),
        location         VARCHAR(300),
        color            VARCHAR(20)   NOT NULL DEFAULT '#6366f1',
        is_cancelled     TINYINT(1)    NOT NULL DEFAULT 0,
        created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_ce_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_ce_user     (user_id),
        INDEX idx_ce_start    (start_at),
        INDEX idx_ce_end      (end_at),
        INDEX idx_ce_range    (user_id, start_at, end_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 14. EVENT ATTENDEES ───────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        event_id   INT UNSIGNED  NOT NULL,
        user_id    INT UNSIGNED  NOT NULL,
        status     ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
        PRIMARY KEY (event_id, user_id),
        CONSTRAINT fk_ea_event FOREIGN KEY (event_id)
          REFERENCES calendar_events(id) ON DELETE CASCADE,
        CONSTRAINT fk_ea_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_ea_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 15. EVENT ↔ TASK LINKS ────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS event_tasks (
        event_id INT UNSIGNED NOT NULL,
        task_id  INT UNSIGNED NOT NULL,
        PRIMARY KEY (event_id, task_id),
        CONSTRAINT fk_et_event FOREIGN KEY (event_id)
          REFERENCES calendar_events(id) ON DELETE CASCADE,
        CONSTRAINT fk_et_task FOREIGN KEY (task_id)
          REFERENCES tasks(id) ON DELETE CASCADE,
        INDEX idx_et_task (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 16. REMINDERS ─────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS reminders (
        id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id    INT UNSIGNED  NOT NULL,
        task_id    INT UNSIGNED,
        event_id   INT UNSIGNED,
        remind_at  DATETIME      NOT NULL,
        is_sent    TINYINT(1)    NOT NULL DEFAULT 0,
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_rem_user  FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_rem_task  FOREIGN KEY (task_id)
          REFERENCES tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_rem_event FOREIGN KEY (event_id)
          REFERENCES calendar_events(id) ON DELETE CASCADE,
        INDEX idx_rem_user_time (user_id, remind_at, is_sent)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 17. NOTIFICATIONS ─────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED  NOT NULL,
        type        VARCHAR(50)   NOT NULL,
        title       VARCHAR(200)  NOT NULL,
        body        TEXT,
        is_read     TINYINT(1)    NOT NULL DEFAULT 0,
        ref_type    VARCHAR(50),
        ref_id      INT UNSIGNED,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notif_user_read (user_id, is_read),
        INDEX idx_notif_created   (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 18. HABITS ────────────────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS habits (
        id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id      INT UNSIGNED  NOT NULL,
        name         VARCHAR(200)  NOT NULL,
        description  TEXT,
        color        VARCHAR(20)   NOT NULL DEFAULT '#6366f1',
        icon         VARCHAR(50),
        frequency    ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
        target_count TINYINT UNSIGNED NOT NULL DEFAULT 1,
        is_archived  TINYINT(1)    NOT NULL DEFAULT 0,
        created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_hab_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_hab_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 19. HABIT LOGS (daily check-in) ──────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        habit_id   INT UNSIGNED  NOT NULL,
        user_id    INT UNSIGNED  NOT NULL,
        logged_on  DATE          NOT NULL,
        count      TINYINT UNSIGNED NOT NULL DEFAULT 1,
        note       VARCHAR(300),
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_hl_habit FOREIGN KEY (habit_id)
          REFERENCES habits(id) ON DELETE CASCADE,
        CONSTRAINT fk_hl_user  FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_hl_habit_date (habit_id, logged_on),
        INDEX idx_hl_user_date (user_id, logged_on)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 20. TIME ENTRIES (time tracking per task) ─────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        task_id     INT UNSIGNED,
        user_id     INT UNSIGNED  NOT NULL,
        description VARCHAR(300),
        started_at  DATETIME      NOT NULL,
        ended_at    DATETIME,
        duration_s  INT UNSIGNED  AS (
          TIMESTAMPDIFF(SECOND, started_at, ended_at)
        ) STORED,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_te_task FOREIGN KEY (task_id)
          REFERENCES tasks(id) ON DELETE SET NULL,
        CONSTRAINT fk_te_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_te_task    (task_id),
        INDEX idx_te_user    (user_id),
        INDEX idx_te_started (user_id, started_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 21. GOALS (OKR-style) ─────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS goals (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED  NOT NULL,
        title       VARCHAR(300)  NOT NULL,
        description TEXT,
        status      ENUM('active','completed','abandoned') NOT NULL DEFAULT 'active',
        target_date DATE,
        progress    TINYINT UNSIGNED NOT NULL DEFAULT 0,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_goal_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_goal_user   (user_id),
        INDEX idx_goal_status (user_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 22. GOAL MILESTONES ───────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS goal_milestones (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        goal_id     INT UNSIGNED  NOT NULL,
        title       VARCHAR(300)  NOT NULL,
        is_done     TINYINT(1)    NOT NULL DEFAULT 0,
        due_date    DATE,
        position    INT UNSIGNED  NOT NULL DEFAULT 0,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_gm_goal FOREIGN KEY (goal_id)
          REFERENCES goals(id) ON DELETE CASCADE,
        INDEX idx_gm_goal (goal_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 23. GOAL ↔ TASK LINKS ─────────────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS goal_tasks (
        goal_id INT UNSIGNED NOT NULL,
        task_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (goal_id, task_id),
        CONSTRAINT fk_gt_goal FOREIGN KEY (goal_id)
          REFERENCES goals(id) ON DELETE CASCADE,
        CONSTRAINT fk_gt_task FOREIGN KEY (task_id)
          REFERENCES tasks(id) ON DELETE CASCADE,
        INDEX idx_gt_task (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 24. FOCUS SESSIONS (Pomodoro) ─────────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id      INT UNSIGNED  NOT NULL,
        task_id      INT UNSIGNED,
        type         ENUM('focus','short_break','long_break') NOT NULL DEFAULT 'focus',
        duration_min TINYINT UNSIGNED NOT NULL DEFAULT 25,
        started_at   DATETIME      NOT NULL,
        ended_at     DATETIME,
        was_completed TINYINT(1)   NOT NULL DEFAULT 0,
        created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_fs_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_fs_task FOREIGN KEY (task_id)
          REFERENCES tasks(id) ON DELETE SET NULL,
        INDEX idx_fs_user    (user_id),
        INDEX idx_fs_started (user_id, started_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 25. ACTIVITY LOGS (audit trail) ──────────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED,
        action      VARCHAR(100)  NOT NULL,
        entity_type VARCHAR(50)   NOT NULL,
        entity_id   INT UNSIGNED  NOT NULL,
        meta        JSON,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_al_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_al_user        (user_id),
        INDEX idx_al_entity      (entity_type, entity_id),
        INDEX idx_al_created     (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 26. USER INTEGRATIONS (Google Cal, Slack, etc.) ───────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS user_integrations (
        id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id       INT UNSIGNED  NOT NULL,
        provider      VARCHAR(50)   NOT NULL,
        access_token  TEXT,
        refresh_token TEXT,
        expires_at    DATETIME,
        meta          JSON,
        created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_ui_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_ui_user_provider (user_id, provider),
        INDEX idx_ui_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── 27. PINNED ITEMS (any resource type) ─────────────────────────────────
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS pinned_items (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED  NOT NULL,
        entity_type ENUM('task','note','event','goal','project') NOT NULL,
        entity_id   INT UNSIGNED  NOT NULL,
        position    INT UNSIGNED  NOT NULL DEFAULT 0,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_pi_user FOREIGN KEY (user_id)
          REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uq_pi_item (user_id, entity_type, entity_id),
        INDEX idx_pi_user (user_id, position)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

  } finally {
    conn.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, initSchema, closePool };
