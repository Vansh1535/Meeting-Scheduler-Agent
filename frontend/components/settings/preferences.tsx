'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { CheckCircle } from 'lucide-react'
import { usePreferences, useUpdatePreferences } from '@/hooks/use-api'
import { Skeleton } from '@/components/ui/skeleton'

export function PreferencesForm() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    notifications: true,
    emailReminders: true,
    darkMode: 'system',
    workHoursStart: '09:00',
    workHoursEnd: '17:00',
    weekStartDay: 'monday',
  })

  const { data: preferences, isLoading } = usePreferences()
  const updatePreferences = useUpdatePreferences()

  useEffect(() => {
    if (preferences) {
      setSettings({
        notifications: preferences.notifications ?? true,
        emailReminders: preferences.emailReminders ?? true,
        darkMode: preferences.darkMode ?? 'system',
        workHoursStart: preferences.workHoursStart ?? '09:00',
        workHoursEnd: preferences.workHoursEnd ?? '17:00',
        weekStartDay: preferences.weekStartDay ?? 'monday',
      })
    }
  }, [preferences])

  const handleSave = async () => {
    await updatePreferences.mutateAsync(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-3">
            <Label htmlFor="theme">Theme</Label>
            <Select value={settings.darkMode} onValueChange={(v) => setSettings({ ...settings, darkMode: v })}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Week Start Day */}
          <div className="space-y-3">
            <Label htmlFor="week-start">Week Starts On</Label>
            <Select value={settings.weekStartDay} onValueChange={(v) => setSettings({ ...settings, weekStartDay: v })}>
              <SelectTrigger id="week-start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Work Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Work Hours</CardTitle>
          <CardDescription>Set your typical working hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work-start">Start Time</Label>
              <Input
                id="work-start"
                type="time"
                value={settings.workHoursStart}
                onChange={(e) => setSettings({ ...settings, workHoursStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-end">End Time</Label>
              <Input
                id="work-end"
                type="time"
                value={settings.workHoursEnd}
                onChange={(e) => setSettings({ ...settings, workHoursEnd: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Control how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notifications for upcoming events</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(v) => setSettings({ ...settings, notifications: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive email reminders 24 hours before events</p>
            </div>
            <Switch
              checked={settings.emailReminders}
              onCheckedChange={(v) => setSettings({ ...settings, emailReminders: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-4">
        <Button onClick={handleSave} className="gap-2">
          {saved && <CheckCircle className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
