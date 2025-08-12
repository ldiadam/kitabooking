import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard, 
  FileText,
  Eye,
  Download,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  venue: Database['public']['Tables']['venues']['Row'] & {
    venue_type: Database['public']['Tables']['venue_types']['Row']
  }
}

async function getUserReservations(): Promise<Reservation[]> {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      venue:venues(
        *,
        venue_type:venue_types(
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching reservations:', error)
    return []
  }
  
  return data as Reservation[]
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const reservationDate = new Date(reservation.reservation_date)
  const createdAt = new Date(reservation.created_at)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{reservation.venue.name}</CardTitle>
            <p className="text-sm text-gray-500">
              {reservation.venue.venue_type.name} • {reservation.reservation_code}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(reservation.status)}>
              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
            </Badge>
            <Badge className={getPaymentStatusColor(reservation.payment_status)}>
              {reservation.payment_status.charAt(0).toUpperCase() + reservation.payment_status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">
                  {format(reservationDate, 'EEEE, MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm">
                  {reservation.start_time} - {reservation.end_time}
                </p>
                <p className="text-xs text-gray-500">
                  Duration: {reservation.duration} hour{reservation.duration !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">
                  {formatCurrency(reservation.total_price || 0)}
                </p>
                {reservation.discount_amount > 0 && (
                  <p className="text-xs text-green-600">
                    Discount: -{formatCurrency(reservation.discount_amount)}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {reservation.customer_name && (
              <div>
                <p className="text-xs text-gray-500">Customer Name</p>
                <p className="text-sm">{reservation.customer_name}</p>
              </div>
            )}
            
            {reservation.customer_phone && (
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm">{reservation.customer_phone}</p>
              </div>
            )}
            
            {reservation.notes && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm">{reservation.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Booked on {format(createdAt, 'MMM d, yyyy \\at h:mm a')}
          </p>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/booking/confirmation/${reservation.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Link>
            </Button>
            {reservation.status === 'confirmed' && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Receipt
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReservationsLoading() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex gap-3">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function ReservationsContent() {
  const reservations = await getUserReservations()
  
  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No reservations yet
        </h3>
        <p className="text-gray-600 mb-6">
          You haven't made any bookings yet. Start by exploring our venues!
        </p>
        <Button asChild>
          <Link href="/venues">
            Browse Venues
          </Link>
        </Button>
      </div>
    )
  }
  
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length
  const pendingCount = reservations.filter(r => r.status === 'pending').length
  const totalSpent = reservations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + (r.total_price || 0), 0)
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reservations.length}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
              <p className="text-sm text-gray-600">Confirmed</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Reservations List */}
      <div className="space-y-4">
        {reservations.map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} />
        ))}
      </div>
    </div>
  )
}

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">
                View and manage your venue reservations
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button asChild>
                <Link href="/booking">
                  Make New Booking
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <Suspense fallback={<ReservationsLoading />}>
          <ReservationsContent />
        </Suspense>
      </div>
    </div>
  )
}