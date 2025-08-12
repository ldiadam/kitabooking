import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, MapPin, DollarSign, TrendingUp, Users, Star } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: string
  membership_type?: string
  membership_expires_at?: string
}

interface DashboardStats {
  totalReservations: number
  upcomingReservations: number
  totalSpent: number
  favoriteVenue?: string
}

interface RecentReservation {
  id: string
  venue_name: string
  venue_type: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  total_price: number
}

async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return profile
}

async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient()
  
  // Get total reservations
  const { count: totalReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  // Get upcoming reservations
  const { count: upcomingReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('reservation_date', new Date().toISOString().split('T')[0])
    .in('status', ['pending', 'confirmed'])
  
  // Get total spent from completed payments
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, reservation:reservations!inner(user_id)')
    .eq('payment_status', 'completed')
    .eq('reservation.user_id', userId)
  
  const totalSpent = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
  
  // Get favorite venue (most booked)
  const { data: venueStats } = await supabase
    .from('reservations')
    .select('venue_id, venues(name)')
    .eq('user_id', userId)
  
  const venueCounts = venueStats?.reduce((acc: Record<string, { name: string; count: number }>, reservation) => {
    const venueId = reservation.venue_id
    const venueName = (reservation.venues as any)?.name || 'Unknown'
    
    if (!acc[venueId]) {
      acc[venueId] = { name: venueName, count: 0 }
    }
    acc[venueId].count++
    
    return acc
  }, {})
  
  const favoriteVenue = venueCounts ? 
    Object.values(venueCounts).sort((a, b) => b.count - a.count)[0]?.name : undefined
  
  return {
    totalReservations: totalReservations || 0,
    upcomingReservations: upcomingReservations || 0,
    totalSpent,
    favoriteVenue
  }
}

async function getRecentReservations(userId: string): Promise<RecentReservation[]> {
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
      venue:venues(
        name,
        venue_type:venue_types(
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching recent reservations:', error)
    return []
  }
  
  return data?.map(reservation => ({
    id: reservation.id,
    venue_name: (reservation.venue as any)?.name || 'Unknown',
    venue_type: (reservation.venue as any)?.venue_type?.name || 'Unknown',
    reservation_date: reservation.reservation_date,
    start_time: reservation.start_time,
    end_time: reservation.end_time,
    status: reservation.status,
    total_price: reservation.total_price
  })) || []
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
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

function RecentReservationCard({ reservation }: { reservation: RecentReservation }) {
  const reservationDate = new Date(reservation.reservation_date)
  const isUpcoming = reservationDate >= new Date()
  
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium">{reservation.venue_name}</h4>
            <p className="text-sm text-muted-foreground">{reservation.venue_type}</p>
          </div>
          <Badge className={getStatusColor(reservation.status)}>
            {reservation.status}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{reservationDate.toLocaleDateString()}</span>
            {isUpcoming && (
              <Badge variant="outline" className="text-xs">Upcoming</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.start_time} - {reservation.end_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>Rp {reservation.total_price.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function DashboardContent() {
  const profile = await getUserProfile()
  
  if (!profile) {
    redirect('/login')
  }
  
  const [stats, recentReservations] = await Promise.all([
    getDashboardStats(profile.id),
    getRecentReservations(profile.id)
  ])
  
  const membershipActive = profile.membership_expires_at && 
    new Date(profile.membership_expires_at) > new Date()
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
          <AvatarFallback className="text-lg">
            {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {profile.full_name}!
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{profile.role}</Badge>
            {membershipActive && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                {profile.membership_type} Member
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/venues">Book Venue</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile">Edit Profile</Link>
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Bookings"
          value={stats.totalReservations}
          description="All time reservations"
          icon={Calendar}
        />
        <StatsCard
          title="Upcoming Bookings"
          value={stats.upcomingReservations}
          description="Confirmed reservations"
          icon={Clock}
        />
        <StatsCard
          title="Total Spent"
          value={`Rp ${stats.totalSpent.toLocaleString()}`}
          description="Lifetime spending"
          icon={DollarSign}
        />
        <StatsCard
          title="Favorite Venue"
          value={stats.favoriteVenue || 'None yet'}
          description="Most booked venue"
          icon={Star}
        />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reservations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Reservations
            </CardTitle>
            <CardDescription>
              Your latest venue bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReservations.length > 0 ? (
              <>
                {recentReservations.map((reservation) => (
                  <RecentReservationCard key={reservation.id} reservation={reservation} />
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile?tab=reservations">View All Reservations</Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reservations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by booking your first venue!
                </p>
                <Button asChild>
                  <Link href="/venues">Browse Venues</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button className="justify-start" asChild>
                <Link href="/venues">
                  <MapPin className="h-4 w-4 mr-2" />
                  Browse Venues
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/events">
                  <Users className="h-4 w-4 mr-2" />
                  View Events
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/gallery">
                  <Star className="h-4 w-4 mr-2" />
                  Photo Gallery
                </Link>
              </Button>
              
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/profile">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Profile
                </Link>
              </Button>
            </div>
            
            {membershipActive && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-1">
                  {profile.membership_type} Member Benefits
                </h4>
                <p className="text-sm text-green-600">
                  Enjoy exclusive discounts and priority booking!
                </p>
                <p className="text-xs text-green-500 mt-1">
                  Expires: {new Date(profile.membership_expires_at!).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Dashboard - Orange Sport Center',
  description: 'Your personal dashboard for managing bookings and account information.',
}