'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VenueTimeSlot } from '@/types/database'
import { useBookingStore } from '@/stores/booking-store'

interface AvailabilitySlot extends VenueTimeSlot {
  isAvailable: boolean
  reservationId?: string
}

export function useVenueAvailability(venueId: string, date: string) {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setAvailableSlots } = useBookingStore()
  const supabase = createClient()

  useEffect(() => {
    if (!venueId || !date) {
      setAvailability([])
      setLoading(false)
      return
    }

    const fetchAvailability = async () => {
      try {
        setLoading(true)

        // Get all time slots for the venue
        const { data: timeSlots, error: slotsError } = await supabase
          .from('venue_time_slots')
          .select('*')
          .eq('venue_id', venueId)
          .eq('is_active', true)
          .order('start_time')

        if (slotsError) throw slotsError

        // Get existing reservations for the date
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .eq('venue_id', venueId)
          .eq('reservation_date', date)
          .in('status', ['confirmed', 'pending'])

        if (reservationsError) throw reservationsError

        // Check availability for each time slot
        const availabilityData: AvailabilitySlot[] = (timeSlots || []).map(slot => {
          const conflictingReservation = reservations?.find(reservation => {
            const slotStart = new Date(`${date}T${slot.start_time}`)
            const slotEnd = new Date(`${date}T${slot.end_time}`)
            const reservationStart = new Date(`${reservation.reservation_date}T${reservation.start_time}`)
            const reservationEnd = new Date(`${reservation.reservation_date}T${reservation.end_time}`)

            // Check for time overlap
            return (
              (slotStart >= reservationStart && slotStart < reservationEnd) ||
              (slotEnd > reservationStart && slotEnd <= reservationEnd) ||
              (slotStart <= reservationStart && slotEnd >= reservationEnd)
            )
          })

          return {
            ...slot,
            isAvailable: !conflictingReservation,
            reservationId: conflictingReservation?.id,
          }
        })

        setAvailability(availabilityData)
        setAvailableSlots(availabilityData.filter(slot => slot.isAvailable))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()

    // Set up real-time subscription for reservations
    const channel = supabase
      .channel(`venue-${venueId}-${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `venue_id=eq.${venueId}`,
        },
        () => {
          // Refetch availability when reservations change
          fetchAvailability()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [venueId, date, supabase, setAvailableSlots])

  return { availability, loading, error }
}