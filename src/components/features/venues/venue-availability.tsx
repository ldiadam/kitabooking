'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import { CalendarDays, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/types/database'

type TimeSlot = Database['public']['Tables']['venue_time_slots']['Row']
type Reservation = Database['public']['Tables']['reservations']['Row']

// Accept venue with facilities as string array (transformed venue)
interface VenueAvailabilityProps {
  venueId: string
  venue?: {
    id: string
    name: string
    venue_type_id: string | null
    image_url: string | null
    description: string | null
    base_price: number
    weekend_price: number | null
    facilities: string[]
    rules: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
}

interface AvailabilitySlot extends TimeSlot {
  isAvailable: boolean
  reservationId?: string
}

export default function VenueAvailability({ venueId, venue }: VenueAvailabilityProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [timeSlots, setTimeSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAvailability()
  }, [venueId, selectedDate])

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      // Fetch time slots for the venue
      const { data: slots, error: slotsError } = await supabase
        .from('venue_time_slots')
        .select('*')
        .eq('venue_id', venueId)
        .order('start_time')

      if (slotsError) {
        console.error('Error fetching time slots:', slotsError)
        return
      }

      // Fetch reservations for the selected date
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .eq('venue_id', venueId)
        .eq('reservation_date', dateStr)
        .in('status', ['confirmed', 'pending'])

      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError)
        return
      }

      // Combine slots with availability info
      const availabilitySlots: AvailabilitySlot[] = (slots || []).map(slot => {
        const reservation = (reservations || []).find(r => 
          r.start_time === slot.start_time && r.end_time === slot.end_time
        )
        
        return {
          ...slot,
          isAvailable: !reservation,
          reservationId: reservation?.id
        }
      })

      setTimeSlots(availabilitySlots)
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSlotStatus = (slot: AvailabilitySlot) => {
    if (isBefore(selectedDate, startOfDay(new Date())) && !isToday(selectedDate)) {
      return 'past'
    }
    return slot.isAvailable ? 'available' : 'booked'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'booked':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'past':
        return 'bg-gray-100 text-gray-500 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4" />
      case 'booked':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const availableCount = timeSlots.filter(slot => slot.isAvailable).length
  const totalCount = timeSlots.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Date</label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            disabled={(date) => isBefore(date, startOfDay(new Date()))}
            className="rounded-md border"
          />
        </div>

        {/* Selected Date Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>
            {isToday(selectedDate) && (
              <Badge variant="outline" className="text-xs">
                Today
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {availableCount} of {totalCount} slots available
          </div>
        </div>

        {/* Time Slots */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Available Time Slots</label>
          
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No time slots available for this venue</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeSlots.map((slot) => {
                const status = getSlotStatus(slot)
                // Calculate price with proper venue base price and weekend logic
                const currentDate = new Date(selectedDate)
                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
                
                // Get base price from venue (weekend or weekday)
                const basePrice = venue && isWeekend && venue.weekend_price 
                  ? venue.weekend_price 
                  : venue?.base_price || 0
                
                const price = Math.round(basePrice * (isWeekend ? (slot.price_weekend || 1) : (slot.price_weekday || 1)))
                
                return (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      getStatusColor(status)
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <div>
                          <div className="font-medium">
                            {slot.start_time} - {slot.end_time}
                          </div>
                          <div className="text-sm opacity-75">
                            {formatCurrency(price)}
                            {isWeekend ? (
                              slot.price_weekend !== 1 && (
                                <span className="ml-1">
                                  ({slot.price_weekend}x rate)
                                </span>
                              )
                            ) : (
                              slot.price_weekday !== 1 && (
                                <span className="ml-1">
                                  ({slot.price_weekday}x rate)
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(status)}`}
                        >
                          {status === 'available' && 'Available'}
                          {status === 'booked' && 'Booked'}
                          {status === 'past' && 'Past'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {availableCount > 0 && (
          <div className="pt-4 border-t">
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                const params = new URLSearchParams({
                  venue: venueId,
                  date: format(selectedDate, 'yyyy-MM-dd')
                })
                window.location.href = `/booking?${params.toString()}`
              }}
            >
              Book for {format(selectedDate, 'MMM d')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}