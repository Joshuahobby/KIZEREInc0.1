import React from "react";
import { useDashboard } from "@/context/dashboard-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Square, RefreshCcw, Save, XCircle, Settings as SettingsIcon } from "lucide-react";

/**
 * Dashboard settings panel component
 * Uses the dashboard context to manage user preferences
 */
export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, updateDashboardConfig, resetDashboard } = useDashboard();
  const { dashboardConfig } = state;

  // Handle refresh interval change
  const handleRefreshIntervalChange = (value: number[]) => {
    updateDashboardConfig({ dataRefreshInterval: value[0] });
  };

  // Handle layout change
  const handleLayoutChange = (value: string) => {
    updateDashboardConfig({ layout: value as 'default' | 'compact' | 'expanded' });
  };

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    updateDashboardConfig({ defaultDateRange: value as 'day' | 'week' | 'month' | 'year' });
  };

  // Handle visible sections toggle
  const toggleSection = (section: string) => {
    const newVisibleSections = [...dashboardConfig.visibleSections];
    if (newVisibleSections.includes(section)) {
      // Remove section if already visible
      const index = newVisibleSections.indexOf(section);
      newVisibleSections.splice(index, 1);
    } else {
      // Add section if not visible
      newVisibleSections.push(section);
    }
    updateDashboardConfig({ visibleSections: newVisibleSections });
  };

  // Handle reset to defaults
  const handleReset = () => {
    resetDashboard();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Dashboard Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="layout">Layout & Sections</TabsTrigger>
            <TabsTrigger value="data">Data & Performance</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <p className="text-sm text-muted-foreground">Show welcome message on dashboard</p>
                </div>
                <Switch
                  id="welcome-message"
                  checked={dashboardConfig.showWelcomeMessage}
                  onCheckedChange={(checked) => updateDashboardConfig({ showWelcomeMessage: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-range">Default Date Range</Label>
                <Select 
                  value={dashboardConfig.defaultDateRange} 
                  onValueChange={handleDateRangeChange}
                >
                  <SelectTrigger id="date-range">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-view">Compact View</Label>
                  <p className="text-sm text-muted-foreground">Use more condensed UI elements</p>
                </div>
                <Switch
                  id="compact-view"
                  checked={dashboardConfig.compactView}
                  onCheckedChange={(checked) => updateDashboardConfig({ compactView: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Layout & Sections Settings */}
          <TabsContent value="layout">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="layout">Dashboard Layout</Label>
                <Select 
                  value={dashboardConfig.layout} 
                  onValueChange={handleLayoutChange}
                >
                  <SelectTrigger id="layout">
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="expanded">Expanded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visible Sections</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['metrics', 'charts', 'activity', 'system'].map((section) => (
                    <Button
                      key={section}
                      variant="outline"
                      className="justify-start"
                      onClick={() => toggleSection(section)}
                    >
                      {dashboardConfig.visibleSections.includes(section) ? (
                        <CheckboxCheckedIcon className="mr-2 h-4 w-4" />
                      ) : (
                        <CheckboxUncheckedIcon className="mr-2 h-4 w-4" />
                      )}
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Favorite Cards</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['users', 'items', 'reports', 'revenue'].map((card) => (
                    <Button
                      key={card}
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        const newFavorites = [...dashboardConfig.favoriteCards];
                        if (newFavorites.includes(card)) {
                          const index = newFavorites.indexOf(card);
                          newFavorites.splice(index, 1);
                        } else {
                          newFavorites.push(card);
                        }
                        updateDashboardConfig({ favoriteCards: newFavorites });
                      }}
                    >
                      {dashboardConfig.favoriteCards.includes(card) ? (
                        <CheckboxCheckedIcon className="mr-2 h-4 w-4" />
                      ) : (
                        <CheckboxUncheckedIcon className="mr-2 h-4 w-4" />
                      )}
                      {card.charAt(0).toUpperCase() + card.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Data & Performance Settings */}
          <TabsContent value="data">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="refresh-interval">Data Refresh Interval</Label>
                  <span className="text-sm font-medium">
                    {dashboardConfig.dataRefreshInterval} seconds
                  </span>
                </div>
                <Slider
                  id="refresh-interval"
                  min={15}
                  max={300}
                  step={15}
                  value={[dashboardConfig.dataRefreshInterval]}
                  onValueChange={handleRefreshIntervalChange}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={onClose}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Settings toggle button component
 * Shows/hides the settings panel
 */
export function SettingsToggle() {
  const [open, setOpen] = React.useState(false);
  
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="rounded-full"
        title="Dashboard Settings"
      >
        <SettingsIcon className="h-5 w-5" />
      </Button>
      <SettingsPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}