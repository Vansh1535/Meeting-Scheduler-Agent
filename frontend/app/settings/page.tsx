import { PreferencesForm } from '@/components/settings/preferences'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account settings</p>
      </div>
      <PreferencesForm />
    </div>
  )
}
