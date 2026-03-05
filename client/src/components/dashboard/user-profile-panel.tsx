import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User } from "@shared/schema";
import {
  User as UserIcon,
  Settings,
  ShieldCheck,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";

interface UserProfilePanelProps {
  user: Omit<User, 'password'>;
  variant?: 'default' | 'compact';
}

/**
 * User Profile Panel Component
 * 
 * Displays user information, profile completeness, account status,
 * and quick access to user-related settings and actions.
 */
export const UserProfilePanel: React.FC<UserProfilePanelProps> = ({
  user,
  variant = 'default'
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [, navigate] = useLocation();

  // Calculate profile completeness percentage
  const calculateProfileCompleteness = (): number => {
    let completedFields = 0;
    let totalFields = 5; // username, email, fullName, phoneNumber, avatarUrl

    if (user.username) completedFields++;
    if (user.email) completedFields++;
    if (user.fullName) completedFields++;
    if (user.phoneNumber) completedFields++;
    if (user.avatarUrl) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const profileCompleteness = calculateProfileCompleteness();

  // Get profile completeness level and corresponding color
  const getCompletenessLevel = (percentage: number): { level: string; color: string } => {
    if (percentage >= 80) return { level: 'Excellent', color: 'text-green-500' };
    if (percentage >= 60) return { level: 'Good', color: 'text-blue-500' };
    if (percentage >= 40) return { level: 'Fair', color: 'text-amber-500' };
    return { level: 'Incomplete', color: 'text-red-500' };
  };

  const completenessInfo = getCompletenessLevel(profileCompleteness);

  // Get avatar fallback text from user's name
  const getAvatarText = (name: string): string => {
    if (!name) return 'U';

    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`;
    }

    return name.substring(0, 2).toUpperCase();
  };

  // Render account status badge
  const renderAccountStatus = () => {
    const isAdmin = user.role === 'Admin';
    const isAgent = user.role === 'Agent';

    if (isAdmin) {
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Administrator
        </Badge>
      );
    }

    if (isAgent) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Agent
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Active Subscriber
      </Badge>
    );
  };

  // Handle profile setup button click
  const handleCompleteProfile = () => {
    navigate('/settings/profile');
  };

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className={variant === 'compact' ? 'pb-2' : ''}>
        <CardTitle className="text-lg font-display flex items-center">
          <UserIcon className="h-5 w-5 mr-2 text-[#00BFFF]" />
          User Profile
        </CardTitle>
        {variant !== 'compact' && (
          <CardDescription>
            Manage your account and settings
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={variant === 'compact' ? 'pt-0' : ''}>
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <Avatar className={variant === 'compact' ? 'h-16 w-16' : 'h-24 w-24'}>
              <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName || user.username} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getAvatarText(user.fullName || user.username)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Information */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold">{user.fullName || user.username}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2">{renderAccountStatus()}</div>

            {/* Profile Completeness */}
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Profile Completeness</span>
                <span className={`text-sm font-medium ${completenessInfo.color}`}>
                  {completenessInfo.level}
                </span>
              </div>
              <Progress value={profileCompleteness} className="h-2 mt-1" />
              {profileCompleteness < 100 && (
                <Button
                  variant="link"
                  className="text-xs mt-1 h-auto p-0"
                  onClick={handleCompleteProfile}
                >
                  Complete your profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {variant !== 'compact' && (
          <>
            {/* Action Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-6"
            >
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-4 mt-4">
                  {/* Account Details */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Account Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Username</span>
                        <span>{user.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Role</span>
                        <span>{user.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined</span>
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Account Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Email verified</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {user.phoneNumber ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>Phone number verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <span>Phone number not added</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Last login: Today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => navigate('/settings/profile')}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => navigate('/settings/security')}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Security Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => navigate('/settings/notifications')}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notification Preferences
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => navigate('/settings/payment')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Methods
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="subscription">
                <div className="space-y-4 mt-4">
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <h4 className="text-sm font-medium mb-1">Current Plan</h4>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Standard Subscriber</p>
                        <p className="text-sm text-muted-foreground">RWF 5,000 / year</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Renews on January 15, 2026</p>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline">
                        Upgrade Plan
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Plan Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Register up to 50 items
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Unlimited lost/found reports
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Email notifications
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        Basic support
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/help')}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help Center
              </Button>
            </div>
          </>
        )}

        {variant === 'compact' && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings/profile')}>
              <UserIcon className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};