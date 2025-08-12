'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Reservation } from '@/types/database'
import { useBookingStore } from '@/stores/booking-store'

export function useRealtimeBookings(venueId?: string) {
  const [bookings, setBookings] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setReservations } = useBookingStore()
  const supabase = createClient()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from('reservations')
          .select(`
            *,
            venues:venue_id(*),
            profiles:user_id(*)
          `)
          .order('created_at', { ascending: false })

        if (venueId) {
          query = query.eq('venue_id', venueId)
        }

        const { data, error } = await query

        if (error) throw error

        setBookings(data || [])
        setReservations(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()

    // Set up real-time subscription
    const channel = supabase
      .channel('reservations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: venueId ? `venue_id=eq.${venueId}` : undefined,
        },
        (payload) => {
          console.log('Real-time update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setBookings(prev => [payload.new as Reservation, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setBookings(prev => 
              prev.map(booking => 
                booking.id === payload.new.id ? payload.new as Reservation : booking
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setBookings(prev => 
              prev.filter(booking => booking.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [venueId, supabase, setReservations])

  return { bookings, loading, error, refetch: () => window.location.reload() }
}