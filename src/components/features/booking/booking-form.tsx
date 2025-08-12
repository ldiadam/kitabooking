'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { useBookingStore } from '@/stores/booking-store'
import { bookingSchema, type BookingFormData } from '@/lib/validations/booking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react'
import { format, addDays, isBefore, startOfDay, isToday } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'
import type { User } from '@supabase/supabase-js'

type Venue = Database['public']['Tables']['venues']['Row'] & {
  venue_types: Database['public']['Tables']['venue_types']['Row']
}

type TimeSlot = Database['public']['Tables']['venue_time_slots']['Row']

interface BookingFormProps {
  venues: Venue[]
  selectedVenue: Venue | null
  initialDate?: string
  initialTime?: string
  user: User
}

export default function BookingForm({ 
  venues, 
  selectedVenue, 
  initialDate, 
  initialTime,
  user 
}: BookingFormProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [reservations, setReservations] = useState<{start_time: string, end_time: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { setSelectedVenue, setSelectedDate, setNotes, clearBooking } = useBookingStore()

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      venueId: selectedVenue?.id || '',
      date: initialDate || format(new Date(), 'yyyy-MM-dd'),
      startTime: initialTime || '',
      endTime: '',
      notes: '',
    },
  })

  const watchedVenueId = form.watch('venueId')
  const watchedDate = form.watch('date')
  const watchedStartTime = form.watch('startTime')

  const fetchTimeSlots = useCallback(async () => {
    setLoading(true)
    try {
      const { data: slots, error: slotsError } = await supabase
        .from('venue_time_slots')
        .select('*')
        .eq('venue_id', watchedVenueId)
        .order('start_time')

      if (slotsError) {
        console.error('Error fetching time slots:', slotsError)
        return
      }

      setTimeSlots(slots || [])

      // Fetch existing reservations for the date
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('venue_id', watchedVenueId)
        .eq('reservation_date', watchedDate)
        .in('status', ['confirmed', 'pending'])

      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError)
        return
      }

      // Store reservations in state for use in getEndTimeOptions
      setReservations(reservations || [])

      // Calculate available slots by checking for time conflicts
      const available = (slots || []).filter(slot => {
        const slotStart = slot.start_time
        const slotEnd = slot.end_time
        
        // Check if this slot conflicts with any existing reservation
        const hasConflict = (reservations || []).some(reservation => {
          const resStart = reservation.start_time
          const resEnd = reservation.end_time
          
          // Check for overlap: slot starts before reservation ends AND slot ends after reservation starts
          return slotStart < resEnd && slotEnd > resStart
        })
        
        return !hasConflict
      }).map(slot => slot.start_time)
      
      setAvailableSlots(available)
    } catch (error) {
      console.error('Error fetching time slots:', error)
    } finally {
      setLoading(false)
    }
  }, [watchedVenueId, watchedDate, supabase])

  // Fetch time slots when venue or date changes
  useEffect(() => {
    if (watchedVenueId && watchedDate) {
      fetchTimeSlots()
    }
  }, [watchedVenueId, watchedDate, fetchTimeSlots])

  // Update booking store when form values change
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.venueId && values.date) {
        const venue = venues.find(v => v.id === values.venueId)
        if (venue) {
          setSelectedVenue(venue)
          setSelectedDate(values.date)
          setNotes(values.notes || '')
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, venues, setSelectedVenue, setSelectedDate, setNotes])

  const getEndTimeOptions = (startTime: string) => {
    if (!startTime) return []
    
    const startSlot = timeSlots.find(slot => slot.start_time === startTime)
    if (!startSlot) return []
    
    const startIndex = timeSlots.findIndex(slot => slot.start_time === startTime)
    const availableEndSlots = []
    
    // Add consecutive available slots, ensuring minimum 1-hour duration
    for (let i = startIndex; i < timeSlots.length; i++) {
      const slot = timeSlots[i]
      const potentialEndTime = slot.end_time
      
      // Calculate duration from start time to this slot's end time
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(`2000-01-01T${potentialEndTime}`)
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      
      // Skip if duration is less than 1 hour
      if (durationHours < 1) {
        continue
      }
      
      // Check if any slot in this time range conflicts with existing reservations
      const wouldConflict = timeSlots.slice(startIndex, i + 1).some(checkSlot => {
        return reservations.some(reservation => {
          const resStart = reservation.start_time
          const resEnd = reservation.end_time
          const slotStart = checkSlot.start_time
          const slotEnd = checkSlot.end_time
          
          // Check for overlap
          return slotStart < resEnd && slotEnd > resStart
        })
      })
      
      if (!wouldConflict) {
        availableEndSlots.push(potentialEndTime)
      } else {
        // Stop if we hit a conflict
        break
      }
    }
    
    return availableEndSlots
  }

  const calculatePrice = () => {
    const { venueId, startTime, endTime, date } = form.getValues()
    if (!venueId || !startTime || !endTime || !date) return 0
    
    const venue = venues.find(v => v.id === venueId)
    if (!venue) return 0
    
    const startSlot = timeSlots.find(slot => slot.start_time === startTime)
    if (!startSlot) return 0
    
    // Calculate duration in hours
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    
    // Check if it's weekend (Saturday = 6, Sunday = 0)
    const selectedDate = new Date(date)
    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6
    
    // Get base price from venue (weekend or weekday)
    const basePrice = isWeekend && venue.weekend_price 
      ? venue.weekend_price 
      : venue.base_price
    
    // Apply time slot multiplier
    const pricePerHour = basePrice * (isWeekend ? (startSlot.price_weekend || 1) : (startSlot.price_weekday || 1))
    return Math.round(pricePerHour * duration)
  }

  const onSubmit = async (data: BookingFormData) => {
    setSubmitting(true)
    setError(null)
    
    try {
      const venue = venues.find(v => v.id === data.venueId)
      if (!venue) {
        setError('Selected venue not found')
        return
      }
      
      // Find the venue time slot for the selected start time
      const selectedTimeSlot = timeSlots.find(slot => slot.start_time === data.startTime)
      if (!selectedTimeSlot) {
        setError('Selected time slot not found')
        return
      }
      
      // Calculate duration in hours
      const start = new Date(`2000-01-01T${data.startTime}`)
      const end = new Date(`2000-01-01T${data.endTime}`)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      
      const { data: reservation, error: reservationError } = await supabase
        .rpc('create_reservation', {
          p_user_id: user.id,
          p_venue_id: data.venueId,
          p_venue_time_slot_id: selectedTimeSlot.id,
          p_reservation_date: data.date,
          p_start_time: data.startTime,
          p_end_time: data.endTime,
          p_duration_hours: duration,
          p_discount_percentage: 0,
          p_notes: data.notes || null
        })
      
      if (reservationError) {
        setError(reservationError.message)
        return
      }
      
      // Clear booking store and redirect to confirmation
      clearBooking()
      router.push(`/booking/confirmation/${reservation}`)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Booking error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedVenueData = venues.find(v => v.id === watchedVenueId)
  const totalPrice = calculatePrice()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book Your Venue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Venue Selection */}
            <FormField
              control={form.control}
              name="venueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Venue</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          <div className="flex items-center gap-2">
                            <span>{venue.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {venue.venue_types.name}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Venue Info */}
            {selectedVenueData && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{selectedVenueData.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>Orange Sport Center</span>
                      </div>
                    </div>
                  </div>
                  <Badge>{selectedVenueData.venue_types.name}</Badge>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Date</FormLabel>
                  <FormControl>
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, 'yyyy-MM-dd'))
                        }
                      }}
                      disabled={(date) => isBefore(date, startOfDay(new Date()))}
                      className="rounded-md border"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection */}
            {watchedVenueId && watchedDate && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue('endTime', '') // Reset end time
                        }} 
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loading ? (
                            <div className="p-2 text-center">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            </div>
                          ) : (
                            availableSlots.map((time) => {
                              const slot = timeSlots.find(s => s.start_time === time)
                              return (
                                <SelectItem key={time} value={time}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{time}</span>
                                    {slot && (() => {
                                      const venue = venues.find(v => v.id === watchedVenueId)
                                      if (!venue) return null
                                      const selectedDate = new Date(watchedDate)
                                      const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                                      const basePrice = isWeekend && venue.weekend_price ? venue.weekend_price : venue.base_price
                                      const hourlyRate = basePrice * (isWeekend ? (slot.price_weekend || 1) : (slot.price_weekday || 1))
                                      return (
                                        <span className="text-xs text-gray-500 ml-2">
                                          {formatCurrency(hourlyRate)}/hr
                                        </span>
                                      )
                                    })()}
                                  </div>
                                </SelectItem>
                              )
                            })
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!watchedStartTime}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getEndTimeOptions(watchedStartTime).map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requests or notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Summary */}
            {totalPrice > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Total Price:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Price includes all applicable fees
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={submitting || totalPrice === 0}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Processing...' : 'Book Now'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}