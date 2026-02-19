'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, Loader2, ChevronDown, ChevronUp, Brain, Users, User, Briefcase, PartyPopper, Heart } from 'lucide-react'
import { useCreateSchedule } from '@/hooks/use-api'
import { useUser } from '@/contexts/user-context'
import { toast } from 'sonner'
import { CandidatesBoard } from '@/components/smart-schedule/candidates-board'
import type { ScheduleResponse } from '@/types/scheduling'

interface FormData {
  title: string
  category: string
  date: string
  time: string
  duration: string
  description: string
  participants: string
  showAnalysis: boolean
}

interface QuickScheduleFormProps {
  formData: FormData
  setFormData: (data: FormData) => void
}

export function QuickScheduleForm({ formData, setFormData }: QuickScheduleFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<ScheduleResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const showAnalysis = formData.showAnalysis

  const setShowAnalysis = (value: boolean) => {
    setFormData({ ...formData, showAnalysis: value })
  }

  const createSchedule = useCreateSchedule()
  const { user } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!user?.id) {
        toast.error('User not loaded yet. Please try again.')
        return
      }

      // If "Show Analysis" is checked, fetch multiple candidates
      if (showAnalysis) {
        setIsAnalyzing(true)
        
        const participantEmails = formData.participants
          ? formData.participants.split(',').map(email => email.trim()).filter(email => email.length > 0)
          : []

        // Calculate date range (use provided date or today + 14 days)
        const startDate = formData.date ? new Date(formData.date) : new Date()
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 14)

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
              start: startDate.toISOString(),
              end: endDate.toISOString(),
            },
            preferred_time: formData.time || undefined,
            constraints: {
              max_candidates: 10,
            },
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to analyze schedule')
        }

        const data: ScheduleResponse = await response.json()
        
        if (data.success && data.candidates.length > 0) {
          setAnalysisResults(data)
          toast.success(`Found ${data.candidates.length} meeting time options`)
        } else {
          toast.error('No candidates found. Try adjusting your constraints.')
        }
        setIsAnalyzing(false)
        return
      }

      // Otherwise, do quick scheduling (original behavior)
      await createSchedule.mutateAsync({
        userId: user.id,
        title: formData.title,
        description: formData.description,
        duration: parseInt(formData.duration),
        category: formData.category,
        preferredDate: formData.date,
        preferredTime: formData.time,
        priority: 'medium',
        flexibility: 'flexible',
      })

      setSubmitted(true)
      toast.success('Event created successfully!')
      
      setTimeout(() => {
        setSubmitted(false)
        setFormData({
          title: '',
          category: 'meeting',
          date: '',
          time: '',
          duration: '30',
          description: '',
          participants: '',
          showAnalysis: false,
        })
        setShowAdvanced(false)
        setShowAnalysis(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('Failed to create event. Please try again.')
      setIsAnalyzing(false)
    }
  }

  // If analysis results are shown, display the candidates board
  if (analysisResults) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => {
            setAnalysisResults(null)
          }}
        >
          ← Back to Form
        </Button>
        <CandidatesBoard 
          results={analysisResults} 
          onReset={() => {
            setAnalysisResults(null)
          }}
        />
      </div>
    )
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto rounded-2xl">
        <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Event Created Successfully!</h3>
          <p className="text-muted-foreground">Your event has been added to your calendar.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl rounded-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl sm:text-3xl">Quick Schedule</CardTitle>
        <CardDescription className="text-base">Create a new event in just 30 seconds</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Team meeting, Conference, etc."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger id="category" className="h-auto">
                <div className="flex items-center gap-3 py-1">
                  {formData.category === 'meeting' && (
                    <>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium">Meeting</span>
                    </>
                  )}
                  {formData.category === 'personal' && (
                    <>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                        <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium">Personal</span>
                    </>
                  )}
                  {formData.category === 'work' && (
                    <>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-600/20">
                        <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="font-medium">Work</span>
                    </>
                  )}
                  {formData.category === 'social' && (
                    <>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                        <PartyPopper className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="font-medium">Social</span>
                    </>
                  )}
                  {formData.category === 'health' && (
                    <>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20">
                        <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="font-medium">Health</span>
                    </>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">
                  <div className="flex items-center gap-3 py-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium">Meeting</span>
                  </div>
                </SelectItem>
                <SelectItem value="personal">
                  <div className="flex items-center gap-3 py-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium">Personal</span>
                  </div>
                </SelectItem>
                <SelectItem value="work">
                  <div className="flex items-center gap-3 py-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500/20 to-gray-600/20">
                      <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="font-medium">Work</span>
                  </div>
                </SelectItem>
                <SelectItem value="social">
                  <div className="flex items-center gap-3 py-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
                      <PartyPopper className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="font-medium">Social</span>
                  </div>
                </SelectItem>
                <SelectItem value="health">
                  <div className="flex items-center gap-3 py-1">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20">
                      <Heart className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-medium">Health</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time {showAnalysis && '(optional)'}</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required={!showAnalysis}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={formData.duration} onValueChange={(v) => setFormData({ ...formData, duration: v })}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI Analysis Toggle - Prominent placement */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <Checkbox
              id="show-analysis"
              checked={showAnalysis}
              onCheckedChange={(checked) => {
                setShowAnalysis(checked as boolean)
                if (checked) setShowAdvanced(true) // Auto-expand advanced when analysis is enabled
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <label
                htmlFor="show-analysis"
                className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <Brain className="h-4 w-4 text-primary" />
                Show AI Analysis Before Creating
              </label>
              <p className="text-xs text-muted-foreground mt-1.5">
                Compare multiple time options with detailed AI scoring, reasoning, and conflict analysis
              </p>
            </div>
          </div>

          {/* Collapsible Advanced Options */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 w-full"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Advanced Options
              {showAnalysis && !showAdvanced && (
                <span className="text-xs text-primary ml-auto">Recommended for AI analysis</span>
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-4 pl-6 border-l-2 border-muted">
                {/* Participants Field */}
                <div className="space-y-2">
                  <Label htmlFor="participants">
                    Participant Emails (comma-separated)
                  </Label>
                  <Input
                    id="participants"
                    placeholder="alice@example.com, bob@example.com"
                    value={formData.participants}
                    onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for personal events. Required for meaningful AI analysis.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add notes or details about this event"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold"
            disabled={createSchedule.isPending || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Options...
              </>
            ) : createSchedule.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : showAnalysis ? (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Find & Analyze Options
              </>
            ) : (
              'Create Event'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
