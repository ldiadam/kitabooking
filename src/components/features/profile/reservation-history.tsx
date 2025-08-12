'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Clock, MapPin, DollarSign, Eye, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface Reservation {
  id: string
  reservation_code: string
  user_id: string | null
  venue_id: string | null
  reservation_date: string
  start_time: string
  end_time: string
  duration: number
  base_price: number | null
  discount_amount: number
  total_price: number | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_status: string
  payment_method: string | null
  notes: string | null
  created_at: string
  updated_at: string
  venue: {
    id: string
    name: string
    venue_type: {
      name: string
    }
  }
}

interface ReservationHistoryProps {
  userId: string
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const [isCancelling, setIsCancelling] = useState(false)
  const supabase = createClientComponentClient()
  
  const reservationDate = new Date(reservation.reservation_date)
  const canCancel = reservation.status === 'pending' || reservation.status === 'confirmed'
  const isPast = reservationDate < new Date()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const handleCancel = async () => {
    if (!canCancel || isPast) return
    
    setIsCancelling(true)
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.id)
      
      if (error) throw error
      
      // Refresh the page to show updated status
      window.location.reload()
    } catch (err) {
      console.error('Error cancelling reservation:', err)
      alert('Failed to cancel reservation. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{reservation.venue.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {reservation.venue.venue_type.name}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(reservation.status)}>
            {reservation.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{reservationDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.start_time} - {reservation.end_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>Rp {((reservation.total_price || 0) - reservation.discount_amount).toLocaleString()}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Booked: {new Date(reservation.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Reservation Details</DialogTitle>
                <DialogDescription>
                  Complete information about your booking
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Venue Information</h4>
                  <p className="text-sm">{reservation.venue.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {reservation.venue.venue_type.name}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Booking Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{reservationDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{reservation.start_time} - {reservation.end_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Payment Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>Rp {(reservation.total_price || 0).toLocaleString()}</span>
                    </div>
                    {reservation.discount_amount && reservation.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-Rp {reservation.discount_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Final Price:</span>
                      <span>Rp {((reservation.total_price || 0) - reservation.discount_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {reservation.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {reservation.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {canCancel && !isPast && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              <X className="h-4 w-4 mr-1" />
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ReservationSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ReservationHistory({ userId }: ReservationHistoryProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    async function fetchReservations() {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            venue:venues(
              id,
              name,
              venue_type:venue_types(
                name
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setReservations(data || [])
      } catch (err) {
        console.error('Error fetching reservations:', err)
        setError('Failed to load reservation history')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchReservations()
  }, [userId, supabase])
  
  if (isLoading) {
    return <ReservationSkeleton />
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  if (reservations.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No reservations yet</h3>
        <p className="text-muted-foreground mb-4">
          You havent made any venue reservations yet.
        </p>
        <Button asChild>
          <a href="/venues">Browse Venues</a>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <ReservationCard key={reservation.id} reservation={reservation} />
      ))}
    </div>
  )
}