'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useCreateSchedule } from '@/hooks/use-api'
import { useUser } from '@/contexts/user-context'
import { toast } from 'sonner'

export function QuickScheduleForm() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'meeting',
    date: '',
    time: '',
    duration: '30',
    description: '',
  })

  const createSchedule = useCreateSchedule()
  const { user } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!user?.id) {
        toast.error('User not loaded yet. Please try again.')
        return
      }

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
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('Failed to create event. Please try again.')
    }
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
    <Card className="w-full max-w-2xl mx-auto rounded-2xl">
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
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="health">Health</SelectItem>
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
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes or details about this event"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-24"
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold"
            disabled={createSchedule.isPending}
          >
            {createSchedule.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {createSchedule.isPending ? 'Creating...' : 'Create Event'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
