import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db';
import { users, roles, userActivityLogs, adminActionLogs, verificationRequests, statusChanges, userWarnings } from '@shared/schema';
import { 
  accountStatuses, 
  verificationStatuses, 
  activityLevels,
  permissionTypes
} from '@shared/schema';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Starting database migration...');

  try {
    // Add status column to users table if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
          ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_status') THEN
          ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'pending';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'activity_level') THEN
          ALTER TABLE users ADD COLUMN activity_level TEXT DEFAULT 'medium';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
          ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
          ALTER TABLE users ADD COLUMN address TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
          ALTER TABLE users ADD COLUMN city TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
          ALTER TABLE users ADD COLUMN country TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'postal_code') THEN
          ALTER TABLE users ADD COLUMN postal_code TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
          ALTER TABLE users ADD COLUMN bio TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences') THEN
          ALTER TABLE users ADD COLUMN preferences JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'custom_permissions') THEN
          ALTER TABLE users ADD COLUMN custom_permissions JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'two_factor_enabled') THEN
          ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'recovery_email') THEN
          ALTER TABLE users ADD COLUMN recovery_email TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'admin_notes') THEN
          ALTER TABLE users ADD COLUMN admin_notes TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'warning_count') THEN
          ALTER TABLE users ADD COLUMN warning_count INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'suspension_history') THEN
          ALTER TABLE users ADD COLUMN suspension_history JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_documents') THEN
          ALTER TABLE users ADD COLUMN verification_documents JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
          ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        END IF;
      END $$;
    `);
    
    console.log('Updated users table with new columns');
    
    // Create new tables
    const tables = [
      {
        name: 'user_activity_logs',
        query: sql`
          CREATE TABLE IF NOT EXISTS user_activity_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            action TEXT NOT NULL,
            details JSONB,
            ip_address TEXT,
            user_agent TEXT,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `
      },
      {
        name: 'admin_action_logs',
        query: sql`
          CREATE TABLE IF NOT EXISTS admin_action_logs (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER NOT NULL REFERENCES users(id),
            target_user_id INTEGER REFERENCES users(id),
            action TEXT NOT NULL,
            previous_state JSONB,
            new_state JSONB,
            reason TEXT,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `
      },
      {
        name: 'roles',
        query: sql`
          CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_system BOOLEAN DEFAULT FALSE,
            permissions JSONB NOT NULL,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'verification_requests',
        query: sql`
          CREATE TABLE IF NOT EXISTS verification_requests (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            document_urls TEXT[],
            notes TEXT,
            reviewed_by INTEGER REFERENCES users(id),
            submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
            reviewed_at TIMESTAMP,
            expires_at TIMESTAMP
          )
        `
      },
      {
        name: 'status_changes',
        query: sql`
          CREATE TABLE IF NOT EXISTS status_changes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            reason TEXT,
            changed_by INTEGER REFERENCES users(id),
            expiration_date TIMESTAMP,
            notes TEXT,
            timestamp TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `
      },
      {
        name: 'user_warnings',
        query: sql`
          CREATE TABLE IF NOT EXISTS user_warnings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            warning_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            issued_by INTEGER REFERENCES users(id),
            acknowledged_at TIMESTAMP,
            issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMP
          )
        `
      }
    ];
    
    // Create each table if it doesn't exist
    for (const table of tables) {
      await db.execute(table.query);
      console.log(`Created or verified table: ${table.name}`);
    }
    
    // Create predefined roles if they don't exist
    const predefinedRoles = [
      {
        name: 'Super Admin',
        description: 'Has access to all system features and functionality',
        isSystem: true,
        permissions: permissionTypes
      },
      {
        name: 'Admin',
        description: 'Can manage users, items, and reports',
        isSystem: true,
        permissions: ['user_view', 'user_edit', 'item_view', 'item_edit', 'report_view', 'report_edit', 'dashboard_view']
      },
      {
        name: 'Moderator',
        description: 'Can review and manage reports',
        isSystem: true,
        permissions: ['user_view', 'report_view', 'report_edit', 'report_resolve']
      },
      {
        name: 'Agent',
        description: 'Can handle lost and found items',
        isSystem: true,
        permissions: ['item_view', 'item_edit', 'report_view', 'report_edit']
      },
      {
        name: 'Subscriber',
        description: 'Regular user with basic access',
        isSystem: true,
        permissions: ['item_view']
      }
    ];
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration().then(() => {
  console.log('Migration script finished');
  process.exit(0);
}).catch((err) => {
  console.error('Migration script failed:', err);
  process.exit(1);
});