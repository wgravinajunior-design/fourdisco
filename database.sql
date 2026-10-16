-- ================================================================
-- FOURDISCO - Sistema de Gestão de Portaria, Check-in & Eventos
-- Banco de Dados: MySQL 8.0+
-- ================================================================

CREATE DATABASE IF NOT EXISTS `fourdisco` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fourdisco`;

-- 1. Tabela de Operadores e Administradores
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('operator', 'admin') NOT NULL DEFAULT 'operator',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de Festas / Eventos
CREATE TABLE IF NOT EXISTS `parties` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `date` DATE NOT NULL,
  `description` TEXT,
  `theme_color` VARCHAR(30) DEFAULT '#8b5cf6',
  `banner_url` TEXT,
  `max_capacity` INT DEFAULT 500,
  `status` ENUM('scheduled', 'active', 'finished') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_party_date` (`date`),
  INDEX `idx_party_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de Clientes / Cadastros de Pessoas
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `document` VARCHAR(30) NOT NULL UNIQUE,
  `document_type` ENUM('CPF', 'RG', 'CNH', 'PASSAPORTE', 'OUTRO') DEFAULT 'CPF',
  `birth_date` DATE NULL,
  `gender` VARCHAR(20) NULL,
  `phone` VARCHAR(30) NULL,
  `email` VARCHAR(100) NULL,
  `photo_url` LONGTEXT NULL,
  `document_photo_url` LONGTEXT NULL,
  `notes` TEXT NULL,
  `is_vip` BOOLEAN DEFAULT FALSE,
  `total_visits` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_client_doc` (`document`),
  INDEX `idx_client_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Blacklist (Lista Negra por período ou indeterminado)
CREATE TABLE IF NOT EXISTS `blacklist` (
  `id` VARCHAR(50) PRIMARY KEY,
  `client_id` VARCHAR(50) NULL,
  `document` VARCHAR(30) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `photo_url` LONGTEXT NULL,
  `reason` TEXT NOT NULL,
  `ban_type` ENUM('indefinite', 'period') NOT NULL DEFAULT 'indefinite',
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `added_by` VARCHAR(100) NOT NULL DEFAULT 'Administrador',
  `status` ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_blacklist_doc` (`document`),
  INDEX `idx_blacklist_status` (`status`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabela de Check-ins & Check-outs
CREATE TABLE IF NOT EXISTS `checkins` (
  `id` VARCHAR(50) PRIMARY KEY,
  `party_id` VARCHAR(50) NOT NULL,
  `client_id` VARCHAR(50) NOT NULL,
  `client_name` VARCHAR(150) NOT NULL,
  `client_document` VARCHAR(30) NOT NULL,
  `client_photo` LONGTEXT NULL,
  `document_photo` LONGTEXT NULL,
  `checkin_time` DATETIME NOT NULL,
  `checkout_time` DATETIME NULL,
  `status` ENUM('inside', 'checked_out') NOT NULL DEFAULT 'inside',
  `operator_name` VARCHAR(100) NOT NULL DEFAULT 'Portaria',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_checkin_party` (`party_id`),
  INDEX `idx_checkin_doc` (`client_document`),
  INDEX `idx_checkin_status` (`status`),
  FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- DADOS BÁSICOS DE ACESSO INICIAL
-- ================================================================

-- Usuário padrão do sistema
INSERT INTO `users` (`username`, `password`, `name`, `role`) VALUES
('GOUP', 'GOUP226457', 'Administrador FourDisco', 'admin')
ON DUPLICATE KEY UPDATE `password`=VALUES(`password`), `name`=VALUES(`name`), `role`=VALUES(`role`);


