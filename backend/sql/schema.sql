-- =====================================================================
-- 药膳智养 · 慢性病食疗管理平台 —— MySQL 8 建表脚本
-- 执行：mysql -u root -p < schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS shiliao DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE shiliao;

DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
  id          VARCHAR(32)  NOT NULL COMMENT '主键',
  role_key    VARCHAR(32)  NOT NULL COMMENT '角色标识 admin/doctor/user',
  name        VARCHAR(64)  NOT NULL COMMENT '角色名称',
  description VARCHAR(255) COMMENT '角色描述',
  permissions VARCHAR(1024) COMMENT '逗号分隔的权限码',
  builtin     TINYINT(1)   DEFAULT 1 COMMENT '是否内置',
  created_at  DATETIME     COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_role_key (role_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色';

DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
  id           VARCHAR(32)  NOT NULL COMMENT '主键',
  username     VARCHAR(64)  NOT NULL COMMENT '登录账号',
  password     VARCHAR(255) NOT NULL COMMENT 'BCrypt 密码',
  name         VARCHAR(64)  NOT NULL COMMENT '姓名',
  phone        VARCHAR(20)  COMMENT '手机号',
  email        VARCHAR(128) COMMENT '邮箱',
  gender       VARCHAR(8)   COMMENT '性别',
  age          INT          COMMENT '年龄',
  constitution VARCHAR(16)  COMMENT '中医体质',
  chronic_tags VARCHAR(255) COMMENT '慢病标签，逗号分隔',
  role_key     VARCHAR(32)  NOT NULL DEFAULT 'user' COMMENT '角色',
  status       VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT 'active/pending/disabled',
  avatar_color VARCHAR(16)  COMMENT '头像颜色',
  created_at   DATETIME     COMMENT '注册时间',
  last_login_at DATETIME    COMMENT '最后登录时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username),
  KEY idx_role_key (role_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='平台用户';

DROP TABLE IF EXISTS ingredient;
CREATE TABLE ingredient (
  id         VARCHAR(32)  NOT NULL COMMENT '主键',
  name       VARCHAR(64)  NOT NULL COMMENT '食材名称',
  category   VARCHAR(32)  COMMENT '分类',
  nature     VARCHAR(8)   COMMENT '四气：寒/凉/平/温/热',
  flavor     VARCHAR(64)  COMMENT '五味，逗号分隔',
  meridian   VARCHAR(64)  COMMENT '归经',
  efficacy   VARCHAR(255) COMMENT '功效',
  calorie    INT          COMMENT '热量 kcal/100g',
  unit       VARCHAR(8)   COMMENT '计量单位',
  stock      INT          DEFAULT 0 COMMENT '库存',
  status     VARCHAR(16)  DEFAULT 'available' COMMENT 'available/low/off',
  updated_at DATETIME     COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='药食同源食材';

DROP TABLE IF EXISTS recipe;
CREATE TABLE recipe (
  id                  VARCHAR(32)  NOT NULL COMMENT '主键',
  name                VARCHAR(128) NOT NULL COMMENT '食谱名称',
  category            VARCHAR(32)  COMMENT '类型',
  suited_constitution VARCHAR(255) COMMENT '适用体质，逗号分隔',
  suited_chronic      VARCHAR(255) COMMENT '适用慢病，逗号分隔',
  ingredients         TEXT         COMMENT '食材配比 JSON',
  effect              VARCHAR(255) COMMENT '功效',
  calories            INT          COMMENT '每份热量',
  cook_time           INT          COMMENT '烹饪分钟',
  status              VARCHAR(16)  DEFAULT 'published' COMMENT 'published/draft/offline',
  cover               VARCHAR(255) COMMENT '封面渐变样式',
  views               INT          DEFAULT 0 COMMENT '浏览量',
  favorites           INT          DEFAULT 0 COMMENT '收藏量',
  updated_at          DATETIME     COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='药膳食谱';

DROP TABLE IF EXISTS meal_record;
CREATE TABLE meal_record (
  id           VARCHAR(32)  NOT NULL,
  customer     VARCHAR(64)  NOT NULL COMMENT '用户',
  recipe_name  VARCHAR(128) COMMENT '食谱',
  meal_type    VARCHAR(16)  COMMENT '餐次',
  portion      INT          COMMENT '份数',
  calories     INT          COMMENT '热量',
  score        INT          COMMENT '评分 1-5',
  note         VARCHAR(255) COMMENT '备注',
  created_at   DATETIME     COMMENT '记录时间',
  PRIMARY KEY (id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用餐记录';

DROP TABLE IF EXISTS health_profile;
CREATE TABLE health_profile (
  user_id    VARCHAR(32) NOT NULL COMMENT '用户ID',
  customer   VARCHAR(64) COMMENT '用户姓名',
  height     DOUBLE      COMMENT '身高 cm',
  weight     DOUBLE      COMMENT '体重 kg',
  blood_sugar DOUBLE     COMMENT '血糖 mmol/L',
  uric_acid  INT         COMMENT '尿酸 μmol/L',
  systolic   INT         COMMENT '收缩压',
  diastolic  INT         COMMENT '舒张压',
  updated_at DATETIME    COMMENT '更新时间',
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康档案';

DROP TABLE IF EXISTS chronic_plan;
CREATE TABLE chronic_plan (
  plan_key    VARCHAR(32)  NOT NULL COMMENT '慢病标识',
  name        VARCHAR(64)  NOT NULL,
  icon        VARCHAR(16),
  color       VARCHAR(16),
  summary     VARCHAR(255) COMMENT '方案概述',
  principles  TEXT         COMMENT '食疗原则，换行分隔',
  recommended VARCHAR(255) COMMENT '推荐食材，逗号分隔',
  avoid       VARCHAR(255) COMMENT '忌口，逗号分隔',
  users       INT          DEFAULT 0 COMMENT '在管人数',
  updated_at  DATETIME,
  PRIMARY KEY (plan_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='慢病食疗方案';

DROP TABLE IF EXISTS audit_log;
CREATE TABLE audit_log (
  id         VARCHAR(32)  NOT NULL,
  operator   VARCHAR(64)  COMMENT '操作人',
  action     VARCHAR(16)  COMMENT 'create/update/delete/login/export',
  target     VARCHAR(128) COMMENT '操作对象',
  detail     VARCHAR(512) COMMENT '详情',
  ip         VARCHAR(64)  COMMENT 'IP',
  result     VARCHAR(16)  COMMENT 'success/fail',
  created_at DATETIME     COMMENT '时间',
  PRIMARY KEY (id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志';
