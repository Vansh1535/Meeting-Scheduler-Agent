'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/user-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search, Calendar as CalendarIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ScheduleResponse } from '@/types/scheduling'

interface SmartScheduleFormProps {
  onAnalyze: (data: ScheduleResponse) => void
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void
}

export function SmartScheduleForm({ onAnalyze, isAnalyzing, setIsAnalyzing }: SmartScheduleFormProps) {
  const { user } = useUser()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    title: '',
    participants: '',
    duration: '60',
    startDate: '',
    endDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.participants || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsAnalyzing(true)

    try {
      const participantEmails = formData.participants
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          duration_minutes: parseInt(formData.duration),
          participant_emails: participantEmails,
          date_range: {
            start: new Date(formData.startDate).toISOString(),
            end: new Date(formData.endDate).toISOString(),
          },
          constraints: {
            max_candidates: 10, // Return top 10 for detailed analysis
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze schedule')
      }

      const data: ScheduleResponse = await response.json()
      
      if (data.success && data.candidates.length > 0) {
        onAnalyze(data)
        toast({
          title: 'Analysis complete',
          description: `Found ${data.candidates.length} meeting time options`,
        })
      } else {
        toast({
          title: 'No candidates found',
          description: 'Try adjusting your date range or constraints',
          variant: 'destructive',
        })
        setIsAnalyzing(false)
      }
    } catch (error) {
      console.error('Error analyzing schedule:', error)
      toast({
        title: 'Analysis failed',
        description: 'Please try again or contact support',
        variant: 'destructive',
      })
      setIsAnalyzing(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Find & Analyze Meeting Times
        </CardTitle>
        <CardDescription>
          Enter meeting details to see detailed AI analysis of top time slots
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Team Planning Session"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isAnalyzing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Participant Emails * (comma-separated)</Label>
            <Input
              id="participants"
              placeholder="alice@example.com, bob@example.com"
              value={formData.participants}
              onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
              disabled={isAnalyzing}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                disabled={isAnalyzing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              disabled={isAnalyzing}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing options...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Find & Analyze
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
