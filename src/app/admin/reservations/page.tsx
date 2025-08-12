import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Search, 
  Filter, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  MapPin,
  DollarSign,
  Phone,
  Mail
} from 'lucide-react'
import Link from 'next/link'

interface Reservation {
  id: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  total_price: number
  discount_percent: number
  customer_name: string
  customer_phone: string
  customer_email: string
  notes?: string
  created_at: string
  user: {
    full_name: string
    email: string
  }
  venue: {
    name: string
    venue_type: {
      name: string
    }
  }
  payment?: {
    payment_status: string
    payment_method: string
    amount: number
  }
}

interface ReservationStats {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  totalRevenue: number
}

async function checkAdminAccess() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (error || !profile || !['admin', 'superadmin'].includes(profile.role)) {
    redirect('/dashboard')
  }
  
  return profile
}

async function getReservations(status?: string): Promise<Reservation[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('reservations')
    .select(`
      id,
      reservation_date,
      start_time,
      end_time,
      status,
      total_price,
      discount_percent,
      customer_name,
      customer_phone,
      customer_email,
      notes,
      created_at,
      user:profiles(
        full_name,
        email
      ),
      venue:venues(
        name,
        venue_type:venue_types(
          name
        )
      ),
      payment:payments(
        payment_status,
        payment_method,
        amount
      )
    `)
    .order('created_at', { ascending: false })
  
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching reservations:', error)
    return []
  }
  
  return data?.map(reservation => ({
    ...reservation,
    user: reservation.user as any,
    venue: reservation.venue as any,
    payment: Array.isArray(reservation.payment) ? reservation.payment[0] : reservation.payment
  })) || []
}

async function getReservationStats(): Promise<ReservationStats> {
  const supabase = await createClient()
  
  // Get total reservations
  const { count: total } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
  
  // Get reservations by status
  const { count: pending } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  
  const { count: confirmed } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
  
  const { count: completed } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
  
  const { count: cancelled } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')
  
  // Get total revenue from completed payments
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('payment_status', 'completed')
  
  const totalRevenue = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
  
  return {
    total: total || 0,
    pending: pending || 0,
    confirmed: confirmed || 0,
    completed: completed || 0,
    cancelled: cancelled || 0,
    totalRevenue
  }
}

function ReservationsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

function StatsCard({ title, value, description, icon: Icon, color = 'default' }: {
  title: string
  value: string | number
  description?: string
  icon: any
  color?: 'default' | 'green' | 'yellow' | 'red' | 'blue'
}) {
  const colorClasses = {
    default: 'text-muted-foreground',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600'
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const reservationDate = new Date(reservation.reservation_date)
  const isUpcoming = reservationDate >= new Date() && ['pending', 'confirmed'].includes(reservation.status)
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(reservation.status)}
            <div>
              <CardTitle className="text-lg">{reservation.venue.name}</CardTitle>
              <CardDescription>{reservation.venue.venue_type.name}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(reservation.status)}>
              {reservation.status}
            </Badge>
            {isUpcoming && (
              <Badge variant="outline" className="ml-2 text-xs">
                Upcoming
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{reservation.customer_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{reservation.customer_phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{reservation.customer_email}</span>
          </div>
        </div>
        
        {/* Booking Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{reservationDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.start_time} - {reservation.end_time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Rp {reservation.total_price.toLocaleString()}</span>
            {reservation.discount_percent > 0 && (
              <Badge variant="outline" className="text-xs">
                {reservation.discount_percent}% off
              </Badge>
            )}
          </div>
        </div>
        
        {/* Payment Status */}
        {reservation.payment && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment:</span>
              <Badge variant={reservation.payment.payment_status === 'completed' ? 'default' : 'outline'}>
                {reservation.payment.payment_status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Method:</span>
              <span>{reservation.payment.payment_method}</span>
            </div>
          </div>
        )}
        
        {/* Notes */}
        {reservation.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Notes:</strong> {reservation.notes}
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {reservation.status === 'pending' && (
            <>
              <Button size="sm" className="flex-1">
                Confirm
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Cancel
              </Button>
            </>
          )}
          {reservation.status === 'confirmed' && (
            <>
              <Button size="sm" className="flex-1">
                Complete
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Cancel
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" className="px-3">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

async function ReservationsContent() {
  await checkAdminAccess()
  
  const [stats, allReservations, pendingReservations, confirmedReservations] = await Promise.all([
    getReservationStats(),
    getReservations('all'),
    getReservations('pending'),
    getReservations('confirmed')
  ])
  
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservation Management</h1>
          <p className="text-muted-foreground">
            Manage customer bookings and reservations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="Total Reservations"
          value={stats.total}
          description="All time bookings"
          icon={Calendar}
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          description="Awaiting confirmation"
          icon={AlertCircle}
          color="yellow"
        />
        <StatsCard
          title="Confirmed"
          value={stats.confirmed}
          description="Active bookings"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          description="Finished sessions"
          icon={CheckCircle}
          color="blue"
        />
        <StatsCard
          title="Total Revenue"
          value={`Rp ${stats.totalRevenue.toLocaleString()}`}
          description="From completed bookings"
          icon={DollarSign}
          color="green"
        />
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, venue, or booking ID..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          Date Range
        </Button>
        <Button variant="outline">
          Venue
        </Button>
        <Button variant="outline">
          Status
        </Button>
      </div>
      
      {/* Reservations Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({stats.confirmed})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">All Reservations</h2>
            {allReservations.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {allReservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reservations found</h3>
                  <p className="text-muted-foreground">
                    Reservations will appear here once customers start booking.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Pending Reservations</h2>
            {pendingReservations.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendingReservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending reservations</h3>
                  <p className="text-muted-foreground">
                    All reservations have been processed.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="confirmed">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Confirmed Reservations</h2>
            {confirmedReservations.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {confirmedReservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No confirmed reservations</h3>
                  <p className="text-muted-foreground">
                    Confirmed reservations will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Completed Reservations</h2>
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Completed reservations</h3>
                <p className="text-muted-foreground">
                  Historical completed bookings will be shown here.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AdminReservationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<ReservationsSkeleton />}>
        <ReservationsContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Reservation Management - Orange Sport Center',
  description: 'Manage customer reservations and bookings.',
}