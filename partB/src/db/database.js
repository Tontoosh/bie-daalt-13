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

async function initSchema() {
  const conn = await getPool().getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        email         VARCHAR(255)  NOT NULL,
        username      VARCHAR(100)  NOT NULL,
        password_hash VARCHAR(255)  NOT NULL,
        created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email    (email),
        UNIQUE KEY uq_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
        user_id     INT UNSIGNED,
        title       VARCHAR(500)  NOT NULL,
        description TEXT,
        status      ENUM('todo','in-progress','done')    NOT NULL DEFAULT 'todo',
        priority    ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
        due_date    DATETIME,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_tasks_status     (status),
        INDEX idx_tasks_priority   (priority),
        INDEX idx_tasks_due_date   (due_date),
        INDEX idx_tasks_created_at (created_at),
        INDEX idx_tasks_user_id    (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS labels (
        id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name  VARCHAR(100) NOT NULL,
        color VARCHAR(20)  NOT NULL DEFAULT '#6366f1',
        PRIMARY KEY (id),
        UNIQUE KEY uq_labels_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS task_labels (
        task_id  INT UNSIGNED NOT NULL,
        label_id INT UNSIGNED NOT NULL,
        PRIMARY KEY (task_id, label_id),
        CONSTRAINT fk_tl_task  FOREIGN KEY (task_id)  REFERENCES tasks(id)  ON DELETE CASCADE,
        CONSTRAINT fk_tl_label FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE,
        INDEX idx_tl_label_id (label_id)
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
