-- MONARCH CODEX Hostinger/MySQL migration schema
-- Generated from the live Supabase public schema on 2026-09-28.
-- This creates the application database structure only. Supabase Auth/storage/RLS/functions are replaced by the Hostinger backend.
-- Existing Supabase data is NOT copied by this file.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS monarch_codex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monarch_codex;

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` LONGTEXT,
  `role` VARCHAR(64) NOT NULL DEFAULT 'member',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `academy_courses` (
  `id` CHAR(36) NOT NULL,
  `lesson_id` CHAR(36) NOT NULL,
  `title` LONGTEXT NOT NULL,
  `description` LONGTEXT,
  `youtube_video_id` LONGTEXT NOT NULL,
  `position` INT NOT NULL,
  `status` LONGTEXT NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `academy_lessons` (
  `id` CHAR(36) NOT NULL,
  `title` LONGTEXT NOT NULL,
  `description` LONGTEXT,
  `position` INT NOT NULL,
  `status` LONGTEXT NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `academy_progress` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `course_id` CHAR(36) NOT NULL,
  `status` LONGTEXT NOT NULL DEFAULT 'not_started',
  `started_at` TIMESTAMP,
  `completed_at` TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `academy_settings` (
  `id` TINYINT(1) NOT NULL DEFAULT 1,
  `academy_price` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `currency` LONGTEXT NOT NULL DEFAULT 'USD',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `youtube_channel_id` LONGTEXT,
  `youtube_channel_url` LONGTEXT,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `academy_subscriptions` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `status` LONGTEXT NOT NULL DEFAULT 'pending',
  `admin_reason` LONGTEXT,
  `approved_at` TIMESTAMP,
  `rejected_at` TIMESTAMP,
  `reviewed_by` CHAR(36),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fee` DECIMAL(30,10) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `capital_adjustments` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `adjustment_type` LONGTEXT NOT NULL DEFAULT 'amount',
  `percentage` DECIMAL(30,10),
  `amount` DECIMAL(30,10) NOT NULL,
  `reason` LONGTEXT NOT NULL,
  `created_by` CHAR(36),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `earnings` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `investment_id` BIGINT,
  `amount` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `description` LONGTEXT,
  `status` LONGTEXT NOT NULL DEFAULT 'confirmed',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` LONGTEXT NOT NULL DEFAULT 'profit',
  `source_investment_id` CHAR(36),
  `profit_month` DATE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` CHAR(36) NOT NULL,
  `recipient` LONGTEXT NOT NULL,
  `subject` LONGTEXT NOT NULL,
  `body` LONGTEXT NOT NULL,
  `status` LONGTEXT DEFAULT 'pending_manual',
  `error_message` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `sent_at` TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `investments` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36),
  `package_name` LONGTEXT NOT NULL,
  `amount` DECIMAL(30,10) NOT NULL,
  `payment_method` LONGTEXT NOT NULL,
  `receipt_url` LONGTEXT,
  `status` LONGTEXT DEFAULT 'pending',
  `approved_at` TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `method` LONGTEXT,
  `note` LONGTEXT,
  `fee` DECIMAL(30,10),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `kyc_verifications` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36),
  `field_name` LONGTEXT,
  `status` LONGTEXT,
  `reason` LONGTEXT,
  `verified_by` CHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_deliveries` (
  `id` CHAR(36) NOT NULL,
  `event_id` CHAR(36),
  `channel` LONGTEXT NOT NULL,
  `recipient` LONGTEXT,
  `status` LONGTEXT NOT NULL DEFAULT 'pending',
  `provider_message_id` LONGTEXT,
  `error_message` LONGTEXT,
  `attempts` INT NOT NULL DEFAULT 0,
  `sent_at` TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_events` (
  `id` CHAR(36) NOT NULL,
  `event_key` LONGTEXT NOT NULL,
  `event_type` LONGTEXT NOT NULL,
  `payload` JSON NOT NULL DEFAULT '{}',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` BIGINT NOT NULL,
  `channel` LONGTEXT NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `recipient` LONGTEXT,
  `event_types` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `title` LONGTEXT NOT NULL,
  `message` LONGTEXT NOT NULL,
  `type` LONGTEXT NOT NULL DEFAULT 'info',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `online_cooperative_accounts` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `package` LONGTEXT,
  `external_account_reference` LONGTEXT,
  `initial_contribution` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `target_amount` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `current_earnings` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `direct_referral_earnings` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `placement_earnings` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `network_earnings` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `status` LONGTEXT NOT NULL DEFAULT 'pending_setup',
  `admin_note` LONGTEXT,
  `visible_to_member` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `online_cooperative_allocations` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `investment_id` CHAR(36) NOT NULL,
  `allocated_amount` DECIMAL(30,10) NOT NULL DEFAULT 10,
  `status` LONGTEXT NOT NULL DEFAULT 'allocated',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reversed_at` TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `online_cooperative_audit_logs` (
  `id` CHAR(36) NOT NULL,
  `account_id` CHAR(36),
  `target_user_id` CHAR(36) NOT NULL,
  `actor_user_id` CHAR(36) NOT NULL,
  `action` LONGTEXT NOT NULL,
  `changes` JSON NOT NULL DEFAULT '{}',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `packages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` LONGTEXT NOT NULL,
  `amount` DECIMAL(30,10) NOT NULL,
  `profit_percent` DECIMAL(30,10) DEFAULT 10,
  `active` TINYINT(1) DEFAULT 1,
  `description` LONGTEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_destinations` (
  `id` CHAR(36) NOT NULL,
  `type` LONGTEXT NOT NULL,
  `label` LONGTEXT NOT NULL,
  `bank_name` LONGTEXT,
  `account_name` LONGTEXT,
  `account_number` LONGTEXT,
  `wallet_address` LONGTEXT,
  `chain` LONGTEXT,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` LONGTEXT,
  `payment_type` LONGTEXT,
  `bank_name` LONGTEXT,
  `account_name` LONGTEXT,
  `account_number` LONGTEXT,
  `crypto_name` LONGTEXT,
  `crypto_network` LONGTEXT,
  `wallet_address` LONGTEXT,
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `accepted_currency` LONGTEXT,
  `payment_instructions` LONGTEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `investment_id` BIGINT NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `uid` LONGTEXT NOT NULL,
  `amount` DECIMAL(30,10) NOT NULL,
  `payment_method` LONGTEXT NOT NULL,
  `file_name` LONGTEXT NOT NULL,
  `file_path` LONGTEXT NOT NULL,
  `file_type` LONGTEXT,
  `file_size` BIGINT,
  `verification_status` LONGTEXT NOT NULL DEFAULT 'pending',
  `admin_note` LONGTEXT,
  `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) NOT NULL,
  `full_name` LONGTEXT NOT NULL,
  `display_username` LONGTEXT,
  `username_last_changed` TIMESTAMP,
  `phone` LONGTEXT NOT NULL,
  `country` LONGTEXT,
  `state` LONGTEXT,
  `city` LONGTEXT,
  `address` LONGTEXT,
  `nin_number` LONGTEXT,
  `nin_front_url` LONGTEXT,
  `nin_back_url` LONGTEXT,
  `selfie_url` LONGTEXT,
  `uid` LONGTEXT NOT NULL,
  `role` LONGTEXT DEFAULT 'member',
  `status` LONGTEXT DEFAULT 'pending_kyc',
  `kyc_status` LONGTEXT DEFAULT 'pending',
  `kyc_rejection_reason` JSON DEFAULT '{}',
  `balance` DECIMAL(30,10) DEFAULT 0,
  `total_invested` DECIMAL(30,10) DEFAULT 0,
  `total_earnings` DECIMAL(30,10) DEFAULT 0,
  `referral_code` LONGTEXT,
  `referred_by` CHAR(36),
  `withdrawal_account_name` LONGTEXT,
  `withdrawal_account_number` LONGTEXT,
  `withdrawal_bank` LONGTEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `avatar_url` LONGTEXT,
  `kyc_document_url` LONGTEXT,
  `gender` LONGTEXT,
  `email` LONGTEXT,
  `phone_country_code` LONGTEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `referral_bonus_ledger` (
  `id` CHAR(36) NOT NULL,
  `referrer_id` CHAR(36) NOT NULL,
  `referred_user_id` CHAR(36) NOT NULL,
  `investment_id` CHAR(36) NOT NULL,
  `bonus_type` LONGTEXT NOT NULL,
  `month_number` INT NOT NULL DEFAULT 0,
  `amount` DECIMAL(30,10) NOT NULL,
  `source_earning_id` CHAR(36),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `referrals` (
  `id` CHAR(36) NOT NULL,
  `referrer_id` CHAR(36) NOT NULL,
  `referred_user_id` CHAR(36) NOT NULL,
  `referral_code` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_content` (
  `id` TINYINT(1) NOT NULL DEFAULT 1,
  `homepage_title` LONGTEXT NOT NULL DEFAULT 'MONARCH CODEX',
  `homepage_intro` LONGTEXT NOT NULL DEFAULT 'Updates, events and official channels from the MONARCH CODEX team.',
  `events` JSON NOT NULL DEFAULT '[]',
  `socials` JSON NOT NULL DEFAULT '[]',
  `contacts` JSON NOT NULL DEFAULT '[]',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `support_title` LONGTEXT DEFAULT 'WE''RE HERE TO HELP.',
  `support_intro` LONGTEXT DEFAULT 'Reach MONARCH CODEX through the official support channels below.',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sovereign_desk_audit_logs` (
  `id` CHAR(36) NOT NULL,
  `actor_user_id` CHAR(36) NOT NULL,
  `action` LONGTEXT NOT NULL,
  `target_user_id` CHAR(36),
  `entity_type` LONGTEXT,
  `entity_id` CHAR(36),
  `amount` DECIMAL(30,10),
  `metadata` JSON NOT NULL DEFAULT '{}',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sovereign_desk_permissions` (
  `user_id` CHAR(36) NOT NULL,
  `permission` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_access` (
  `id` CHAR(36) NOT NULL,
  `telegram_user_id` BIGINT NOT NULL,
  `telegram_chat_id` BIGINT NOT NULL,
  `access_status` LONGTEXT NOT NULL DEFAULT 'pending',
  `access_reason` LONGTEXT,
  `approved_at` TIMESTAMP,
  `removed_at` TIMESTAMP,
  `expires_at` TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_account_links` (
  `id` CHAR(36) NOT NULL,
  `telegram_user_id` BIGINT NOT NULL,
  `website_user_id` CHAR(36) NOT NULL,
  `linked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unlinked_at` TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_chat_assignments` (
  `id` CHAR(36) NOT NULL,
  `telegram_chat_id` BIGINT NOT NULL,
  `operator_user_id` CHAR(36) NOT NULL,
  `assigned_by` CHAR(36) NOT NULL,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_chats` (
  `id` CHAR(36) NOT NULL,
  `telegram_chat_id` BIGINT NOT NULL,
  `chat_type` LONGTEXT,
  `title` LONGTEXT,
  `username` LONGTEXT,
  `purpose` LONGTEXT NOT NULL DEFAULT 'general',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_join_requests` (
  `id` CHAR(36) NOT NULL,
  `telegram_user_id` BIGINT NOT NULL,
  `telegram_chat_id` BIGINT NOT NULL,
  `requested_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `decision` LONGTEXT NOT NULL DEFAULT 'pending',
  `decided_at` TIMESTAMP,
  `decided_by` CHAR(36),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_logs` (
  `id` CHAR(36) NOT NULL,
  `event_type` LONGTEXT NOT NULL,
  `telegram_user_id` BIGINT,
  `telegram_chat_id` BIGINT,
  `telegram_message_id` BIGINT,
  `payload` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_members` (
  `id` CHAR(36) NOT NULL,
  `telegram_user_id` BIGINT NOT NULL,
  `telegram_username` LONGTEXT,
  `first_name` LONGTEXT,
  `last_name` LONGTEXT,
  `language_code` LONGTEXT,
  `is_bot` TINYINT(1) NOT NULL DEFAULT 0,
  `telegram_status` LONGTEXT NOT NULL DEFAULT 'unknown',
  `last_seen_at` TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_operator_limits` (
  `user_id` CHAR(36) NOT NULL,
  `max_managed_chats` INT NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_settings` (
  `id` TINYINT(1) NOT NULL DEFAULT 1,
  `signal_distribution_paused` TINYINT(1) NOT NULL DEFAULT 0,
  `auto_access_paused` TINYINT(1) NOT NULL DEFAULT 0,
  `auto_approval_paused` TINYINT(1) NOT NULL DEFAULT 0,
  `signal_tag` LONGTEXT NOT NULL DEFAULT '/SIGNAL',
  `signal_subscription_price` DECIMAL(30,10) NOT NULL DEFAULT 30,
  `signal_subscription_currency` LONGTEXT NOT NULL DEFAULT 'USD',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_signal_events` (
  `id` CHAR(36) NOT NULL,
  `signal_id` CHAR(36) NOT NULL,
  `event_type` LONGTEXT NOT NULL,
  `note` LONGTEXT,
  `created_by` CHAR(36),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `telegram_signals` (
  `id` CHAR(36) NOT NULL,
  `source_chat_id` BIGINT,
  `source_message_id` BIGINT,
  `signal_code` LONGTEXT,
  `symbol` LONGTEXT,
  `market` LONGTEXT,
  `direction` LONGTEXT,
  `entry` LONGTEXT,
  `stop_loss` LONGTEXT,
  `take_profit_1` LONGTEXT,
  `take_profit_2` LONGTEXT,
  `take_profit_3` LONGTEXT,
  `raw_text` LONGTEXT,
  `status` LONGTEXT NOT NULL DEFAULT 'pending',
  `published_at` TIMESTAMP,
  `closed_at` TIMESTAMP,
  `closed_result` LONGTEXT,
  `created_by` CHAR(36),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `testimonies` (
  `id` CHAR(36) NOT NULL,
  `name` LONGTEXT NOT NULL,
  `role` LONGTEXT,
  `message` LONGTEXT NOT NULL,
  `image_url` LONGTEXT,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transaction_fee_settings` (
  `transaction_type` VARCHAR(255) NOT NULL,
  `fee_type` LONGTEXT NOT NULL,
  `fee_value` DECIMAL(30,10) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36),
  `type` LONGTEXT,
  `amount` DECIMAL(30,10) NOT NULL,
  `display_amount` LONGTEXT,
  `description` LONGTEXT,
  `created_by` CHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wallet_funding_requests` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `amount` DECIMAL(30,10) NOT NULL,
  `fee` DECIMAL(30,10) NOT NULL DEFAULT 2,
  `total` DECIMAL(30,10) NOT NULL,
  `payment_method` LONGTEXT NOT NULL,
  `receipt_url` LONGTEXT,
  `note` LONGTEXT,
  `status` LONGTEXT NOT NULL DEFAULT 'pending',
  `admin_note` LONGTEXT,
  `reviewed_by` CHAR(36),
  `reviewed_at` TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_currency` LONGTEXT,
  `payment_amount` DECIMAL(30,10),
  `payment_fee` DECIMAL(30,10),
  `payment_total` DECIMAL(30,10),
  `payment_detail_id` INT,
  `receiving_account_snapshot` JSON,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `direction` LONGTEXT NOT NULL,
  `amount` DECIMAL(30,10) NOT NULL,
  `fee` DECIMAL(30,10) NOT NULL DEFAULT 0,
  `balance_before` DECIMAL(30,10) NOT NULL,
  `balance_after` DECIMAL(30,10) NOT NULL,
  `source_type` LONGTEXT NOT NULL,
  `reference_id` LONGTEXT,
  `description` LONGTEXT,
  `created_by` CHAR(36),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36),
  `amount` DECIMAL(30,10) NOT NULL,
  `account_name` LONGTEXT NOT NULL,
  `account_number` LONGTEXT NOT NULL,
  `bank_name` LONGTEXT NOT NULL,
  `status` LONGTEXT DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `source_type` LONGTEXT NOT NULL DEFAULT 'earnings',
  `fee` DECIMAL(30,10),
  `details` LONGTEXT,
  `method` LONGTEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS=1;

-- IMPORTANT: Foreign keys are intentionally added by the application migration layer after data import.
-- This avoids ordering failures while importing existing production records.
