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
-- DADOS INICIAIS DE DEMONSTRAÇÃO (SEED)
-- ================================================================

-- Usuários padrões
INSERT INTO `users` (`username`, `password`, `name`, `role`) VALUES
('operador', '123456', 'Portaria Principal', 'operator'),
('admin', 'admin123', 'Gerência Geral', 'admin')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Festa de hoje (usando CURDATE())
INSERT INTO `parties` (`id`, `name`, `date`, `description`, `theme_color`, `max_capacity`, `status`) VALUES
('party-today-1', 'FourDisco Neon Glow - Sexta Premium', CURDATE(), 'Noite eletrônica especial com DJs internacionais e pista open air', '#8b5cf6', 600, 'active'),
('party-today-2', 'FourDisco Sunset Lounge', CURDATE(), 'Área VIP rooftop com sunset lounge e drinks exclusivos', '#ec4899', 250, 'active')
ON DUPLICATE KEY UPDATE `status`='active';

-- Clientes cadastrados para teste
INSERT INTO `clients` (`id`, `name`, `document`, `document_type`, `phone`, `email`, `is_vip`, `total_visits`) VALUES
('cli-1', 'Rodrigo Silva Alcantara', '123.456.789-00', 'CPF', '(11) 98765-4321', 'rodrigo@email.com', TRUE, 12),
('cli-2', 'Beatriz Ferreira Lima', '987.654.321-11', 'CPF', '(11) 97654-3210', 'beatriz@email.com', FALSE, 4),
('cli-3', 'Lucas Gabriel Oliveira', '456.789.012-33', 'CPF', '(21) 99887-1122', 'lucas@email.com', FALSE, 1),
('cli-4', 'Marcos Vinicius Santos (Bloqueado)', '111.222.333-44', 'CPF', '(11) 91122-3344', 'marcos@email.com', FALSE, 2)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Registro de Blacklist para teste (exemplo de indivíduo barrado)
INSERT INTO `blacklist` (`id`, `client_id`, `document`, `name`, `reason`, `ban_type`, `start_date`, `end_date`, `added_by`, `status`) VALUES
('bl-1', 'cli-4', '111.222.333-44', 'Marcos Vinicius Santos (Bloqueado)', 'Envolvimento em tumulto na pista de dança e desacato aos seguranças', 'indefinite', CURDATE(), NULL, 'Gerência de Segurança', 'active'),
('bl-2', NULL, '555.666.777-88', 'Fernando Souza Mendes', 'Tentativa de utilizar documento falso de terceiro', 'period', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Coordenação FourDisco', 'active')
ON DUPLICATE KEY UPDATE `reason`=VALUES(`reason`);
