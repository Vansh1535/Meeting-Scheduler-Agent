import { AnalyticsCharts } from '@/components/analytics/charts'

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Performance insights from your last 30 days of scheduling</p>
      </div>
      <AnalyticsCharts />
    </div>
  )
}
