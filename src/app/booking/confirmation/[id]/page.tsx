import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CreditCard, 
  FileText,
  Download,
  Share2
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Reservation = Database['public']['Tables']['reservations']['Row'] & {
  venue: Database['public']['Tables']['venues']['Row'] & {
    venue_types: Database['public']['Tables']['venue_types']['Row']
  }
  user: Database['public']['Tables']['profiles']['Row']
}

interface BookingConfirmationPageProps {
  params: {
    id: string
  }
}

async function getReservation(id: string): Promise<Reservation | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      venue:venues(
        *,
        venue_types(
          name
        )
      ),
      user:profiles(
        full_name,
        phone
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as Reservation
}

function ReservationDetails({ reservation }: { reservation: Reservation }) {
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
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
          <p className="text-gray-600 mt-2">
            Your reservation has been successfully created. Here are your booking details:
          </p>
        </div>
      </div>
      
      {/* Reservation Details Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Reservation Details</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Booking ID: {reservation.reservation_code}
              </p>
            </div>
            <Badge className={getStatusColor(reservation.status)}>
              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Venue Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold">{reservation.venue.name}</h3>
                  <p className="text-sm text-gray-600">
                    {reservation.venue.venue_types.name}
                  </p>

                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-medium">Date</h4>
                  <p className="text-sm text-gray-600">
                    {format(reservationDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-medium">Time</h4>
                  <p className="text-sm text-gray-600">
                    {reservation.start_time} - {reservation.end_time}
                  </p>
                  <p className="text-xs text-gray-500">
                    Duration: {reservation.duration} hour{reservation.duration !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Customer Information */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-medium">Customer</h4>
                  <p className="text-sm text-gray-600">
                    {reservation.customer_name || reservation.user?.full_name}
                  </p>
                  {reservation.customer_email && (
                    <p className="text-sm text-gray-500">
                      {reservation.customer_email}
                    </p>
                  )}
                  {(reservation.customer_phone || reservation.user?.phone) && (
                    <p className="text-sm text-gray-500">
                      {reservation.customer_phone || reservation.user?.phone}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-medium">Pricing</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price:</span>
                      <span>{formatCurrency(reservation.base_price)}</span>
                    </div>
                    {reservation.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(reservation.discount_amount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(reservation.total_price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {reservation.notes && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <h4 className="font-medium">Notes</h4>
                <p className="text-sm text-gray-600">
                  {reservation.notes}
                </p>
              </div>
            </div>
          )}
          
          {/* Booking Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Booking Information</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Booked on:</span>
                <p>{format(createdAt, 'MMM d, yyyy \\at h:mm a')}</p>
              </div>
              <div>
                <span className="text-gray-600">Reservation Code:</span>
                <p className="font-mono">{reservation.reservation_code}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Important Information */}
      <Alert>
        <AlertDescription>
          <strong>Important:</strong> Please arrive 15 minutes before your scheduled time. 
          Bring a valid ID and this confirmation for check-in. 
          For any changes or cancellations, contact us at least 24 hours in advance.
        </AlertDescription>
      </Alert>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Receipt
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share Booking
        </Button>
        <Link href="/booking">
          <Button className="w-full sm:w-auto">
            Make Another Booking
          </Button>
        </Link>
      </div>
      
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Contact Us</h4>
              <p className="text-gray-600">Phone: +62 123 456 7890</p>
              <p className="text-gray-600">Email: info@orangesportcenter.com</p>
              <p className="text-gray-600">WhatsApp: +62 123 456 7890</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Operating Hours</h4>
              <p className="text-gray-600">Monday - Friday: 6:00 AM - 11:00 PM</p>
              <p className="text-gray-600">Saturday - Sunday: 6:00 AM - 12:00 AM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function BookingConfirmationPage({ params }: BookingConfirmationPageProps) {
  const { id } = await params
  const reservation = await getReservation(id)
  
  if (!reservation) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSkeleton />}>
        <ReservationDetails reservation={reservation} />
      </Suspense>
    </div>
  )
}