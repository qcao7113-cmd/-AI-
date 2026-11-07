-- =====================================================================
-- H2（MySQL 兼容模式）建表脚本 —— 用于免安装 MySQL 的本地试跑
-- 启动：mvn spring-boot:run -Dspring-boot.run.profiles=h2
-- =====================================================================

DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
  id VARCHAR(32) PRIMARY KEY,
  role_key VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  description VARCHAR(255),
  permissions VARCHAR(1024),
  builtin BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
  id VARCHAR(32) PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(64) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(128),
  gender VARCHAR(8),
  age INT,
  constitution VARCHAR(16),
  chronic_tags VARCHAR(255),
  role_key VARCHAR(32) NOT NULL DEFAULT 'user',
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  avatar_color VARCHAR(16),
  created_at TIMESTAMP,
  last_login_at TIMESTAMP,
  CONSTRAINT uk_username UNIQUE (username)
);

DROP TABLE IF EXISTS ingredient;
CREATE TABLE ingredient (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  category VARCHAR(32),
  nature VARCHAR(8),
  flavor VARCHAR(64),
  meridian VARCHAR(64),
  efficacy VARCHAR(255),
  calorie INT,
  unit VARCHAR(8),
  stock INT DEFAULT 0,
  status VARCHAR(16) DEFAULT 'available',
  updated_at TIMESTAMP
);

DROP TABLE IF EXISTS recipe;
CREATE TABLE recipe (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(32),
  suited_constitution VARCHAR(255),
  suited_chronic VARCHAR(255),
  ingredients CLOB,
  effect VARCHAR(255),
  calories INT,
  cook_time INT,
  status VARCHAR(16) DEFAULT 'published',
  cover VARCHAR(255),
  views INT DEFAULT 0,
  favorites INT DEFAULT 0,
  updated_at TIMESTAMP
);

DROP TABLE IF EXISTS meal_record;
CREATE TABLE meal_record (
  id VARCHAR(32) PRIMARY KEY,
  customer VARCHAR(64) NOT NULL,
  recipe_name VARCHAR(128),
  meal_type VARCHAR(16),
  portion INT,
  calories INT,
  score INT,
  note VARCHAR(255),
  created_at TIMESTAMP
);

DROP TABLE IF EXISTS health_profile;
CREATE TABLE health_profile (
  user_id VARCHAR(32) PRIMARY KEY,
  customer VARCHAR(64),
  height DOUBLE,
  weight DOUBLE,
  blood_sugar DOUBLE,
  uric_acid INT,
  systolic INT,
  diastolic INT,
  updated_at TIMESTAMP
);

DROP TABLE IF EXISTS chronic_plan;
CREATE TABLE chronic_plan (
  plan_key VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  icon VARCHAR(16),
  color VARCHAR(16),
  summary VARCHAR(255),
  principles CLOB,
  recommended VARCHAR(255),
  avoid VARCHAR(255),
  users INT DEFAULT 0,
  updated_at TIMESTAMP
);

DROP TABLE IF EXISTS audit_log;
CREATE TABLE audit_log (
  id VARCHAR(32) PRIMARY KEY,
  operator VARCHAR(64),
  action VARCHAR(16),
  target VARCHAR(128),
  detail VARCHAR(512),
  ip VARCHAR(64),
  result VARCHAR(16),
  created_at TIMESTAMP
);
