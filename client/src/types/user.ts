export type UserRole = 'Admin' | 'Agent' | 'Subscriber';

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  // Additional fields specific to UI needs
  [key: string]: any;
}

export interface UserPermission {
  id: string;
  name: string;
  description: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  dashboardLayout: string;
  dashboardStyle: 'standard' | 'classic' | 'command_center';
  currency: string;
  timezone: string;
  // Additional preferences
  [key: string]: any;
}