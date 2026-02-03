-- Phase 5.1: Database Performance Indexes
-- Run this migration to add performance-critical indexes
-- Reports table indexes
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type_status ON reports(type, status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_expiration_date ON reports(expiration_date);
CREATE INDEX IF NOT EXISTS idx_reports_reported_at ON reports(reported_at);
-- Full-text search index for title and description
-- Note: Requires pg_trgm extension for similarity search
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_reports_title_trgm ON reports USING gin (title gin_trgm_ops);
-- Claims table indexes  
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_report_id ON claims(report_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_user_report ON claims(user_id, report_id);
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
-- Items table indexes
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_unique_identifier ON items(unique_identifier);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_ref);
-- User activity logs indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_timestamp ON user_activity_logs(timestamp);
-- Admin action logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_target_user_id ON admin_action_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_timestamp ON admin_action_logs(timestamp);