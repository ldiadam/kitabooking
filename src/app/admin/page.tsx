import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  MapPin, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalRevenue: number
  monthlyRevenue: number
  totalReservations: number
  activeVenues: number
  totalUsers: number
  pendingReservations: number
}

interface RecentReservation {
  id: string
  user_name: string
  venue_name: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  total_price: number
  created_at: string
}

interface VenueStats {
  id: string
  name: string
  total_bookings: number
  total_revenue: number
  utilization_rate: number
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

async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()
  
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  
  // Get total revenue from completed payments
  const { data: totalRevenueData } = await supabase
    .from('payments')
    .select('amount')
    .eq('payment_status', 'completed')
  
  const totalRevenue = totalRevenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0
  
  // Get monthly revenue
  const { data: monthlyRevenueData } = await supabase
    .from('payments')
    .select('amount')
    .eq('payment_status', 'completed')
    .gte('created_at', firstDayOfMonth.toISOString())
  
  const monthlyRevenue = monthlyRevenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0
  
  // Get total reservations
  const { count: totalReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
  
  // Get active venues
  const { count: activeVenues } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  // Get total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  // Get pending reservations
  const { count: pendingReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  
  return {
    totalRevenue,
    monthlyRevenue,
    totalReservations: totalReservations || 0,
    activeVenues: activeVenues || 0,
    totalUsers: totalUsers || 0,
    pendingReservations: pendingReservations || 0
  }
}

async function getRecentReservations(): Promise<RecentReservation[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_date,
      start_time,
      end_time,
      status,
      total_price,
      created_at,
      user:profiles(
        full_name
      ),
      venue:venues(
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error fetching recent reservations:', error)
    return []
  }
  
  return data?.map(reservation => ({
    id: reservation.id,
    user_name: (reservation.user as any)?.full_name || 'Unknown',
    venue_name: (reservation.venue as any)?.name || 'Unknown',
    reservation_date: reservation.reservation_date,
    start_time: reservation.start_time,
    end_time: reservation.end_time,
    status: reservation.status,
    total_price: reservation.total_price,
    created_at: reservation.created_at
  })) || []
}

async function getVenueStats(): Promise<VenueStats[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('venues')
    .select(`
      id,
      name,
      reservations(
        id,
        total_price,
        status
      )
    `)
    .eq('is_active', true)
  
  if (error) {
    console.error('Error fetching venue stats:', error)
    return []
  }
  
  return data?.map(venue => {
    const reservations = venue.reservations || []
    const totalBookings = reservations.length
    const totalRevenue = reservations
      .filter((r: any) => r.status === 'completed')
      .reduce((sum: number, r: any) => sum + r.total_price, 0)
    
    // Simple utilization calculation (can be improved with actual time slots)
    const utilizationRate = Math.min(totalBookings * 5, 100) // Rough estimate
    
    return {
      id: venue.id,
      name: venue.name,
      total_bookings: totalBookings,
      total_revenue: totalRevenue,
      utilization_rate: utilizationRate
    }
  }) || []
}

function AdminSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-8 w-64" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

function StatsCard({ title, value, description, icon: Icon, trend }: {
  title: string
  value: string | number
  description?: string
  icon: any
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
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

function ReservationRow({ reservation }: { reservation: RecentReservation }) {
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
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
      <div className="flex items-center gap-4">
        {getStatusIcon(reservation.status)}
        <div>
          <p className="font-medium">{reservation.user_name}</p>
          <p className="text-sm text-muted-foreground">{reservation.venue_name}</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium">
          {new Date(reservation.reservation_date).toLocaleDateString()}
        </p>
        <p className="text-sm text-muted-foreground">
          {reservation.start_time} - {reservation.end_time}
        </p>
      </div>
      
      <div className="text-right">
        <p className="font-medium">Rp {reservation.total_price.toLocaleString()}</p>
        <Badge className={getStatusColor(reservation.status)}>
          {reservation.status}
        </Badge>
      </div>
    </div>
  )
}

function VenueStatsRow({ venue }: { venue: VenueStats }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="font-medium">{venue.name}</p>
        <p className="text-sm text-muted-foreground">
          {venue.total_bookings} bookings
        </p>
      </div>
      
      <div className="text-right">
        <p className="font-medium">Rp {venue.total_revenue.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">
          {venue.utilization_rate}% utilization
        </p>
      </div>
    </div>
  )
}

async function AdminContent() {
  await checkAdminAccess()
  
  const [stats, recentReservations, venueStats] = await Promise.all([
    getAdminStats(),
    getRecentReservations(),
    getVenueStats()
  ])
  
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your sport center operations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/venues">Manage Venues</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/reservations">View Reservations</Link>
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`Rp ${stats.totalRevenue.toLocaleString()}`}
          description="All time earnings"
          icon={DollarSign}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`Rp ${stats.monthlyRevenue.toLocaleString()}`}
          description="This month"
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Bookings"
          value={stats.totalReservations}
          description="All reservations"
          icon={Calendar}
        />
        <StatsCard
          title="Active Venues"
          value={stats.activeVenues}
          description="Available for booking"
          icon={MapPin}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered customers"
          icon={Users}
        />
        <StatsCard
          title="Pending Bookings"
          value={stats.pendingReservations}
          description="Awaiting confirmation"
          icon={Clock}
        />
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="reservations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reservations">Recent Reservations</TabsTrigger>
          <TabsTrigger value="venues">Venue Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reservations</CardTitle>
              <CardDescription>
                Latest booking activities and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentReservations.length > 0 ? (
                <div className="space-y-4">
                  {recentReservations.map((reservation) => (
                    <ReservationRow key={reservation.id} reservation={reservation} />
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/admin/reservations">View All Reservations</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reservations yet</h3>
                  <p className="text-muted-foreground">
                    Reservations will appear here once customers start booking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <CardTitle>Venue Performance</CardTitle>
              <CardDescription>
                Revenue and utilization statistics for each venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {venueStats.length > 0 ? (
                <div className="space-y-4">
                  {venueStats.map((venue) => (
                    <VenueStatsRow key={venue.id} venue={venue} />
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/admin/venues">Manage Venues</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No venues found</h3>
                  <p className="text-muted-foreground mb-4">
                    Add venues to start accepting bookings.
                  </p>
                  <Button asChild>
                    <Link href="/admin/venues/new">Add First Venue</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>
                  Monthly revenue comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Revenue analytics will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Booking Patterns</CardTitle>
                <CardDescription>
                  Peak hours and popular venues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Booking analytics will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Admin Dashboard - Orange Sport Center',
  description: 'Administrative dashboard for managing venues, reservations, and analytics.',
}