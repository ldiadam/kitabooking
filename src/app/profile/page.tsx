import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Phone, MapPin, Calendar, CreditCard, History } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import ProfileForm from '@/components/features/profile/profile-form'
import ReservationHistory from '@/components/features/profile/reservation-history'
import PaymentHistory from '@/components/features/profile/payment-history'

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  address?: string
  date_of_birth?: string
  avatar_url?: string
  role: 'customer' | 'member' | 'staff' | 'admin' | 'superadmin'
  membership_type?: string
  membership_expires_at?: string
  created_at: string
  updated_at: string
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

function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

function ProfileHeader({ profile }: { profile: UserProfile }) {
  const membershipActive = profile.membership_expires_at && 
    new Date(profile.membership_expires_at) > new Date()
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
      <Avatar className="h-20 w-20">
        <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
        <AvatarFallback className="text-lg">
          {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <div className="flex gap-2">
            <Badge variant={profile.role === 'admin' || profile.role === 'superadmin' ? 'default' : 'secondary'}>
              {profile.role}
            </Badge>
            {membershipActive && (
              <Badge variant="outline" className="border-green-500 text-green-700">
                {profile.membership_type} Member
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{profile.email}</span>
        </div>
        
        {profile.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{profile.phone}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileStats({ profile }: { profile: UserProfile }) {
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })
  
  const membershipExpiry = profile.membership_expires_at 
    ? new Date(profile.membership_expires_at).toLocaleDateString()
    : null
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Member Since</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{memberSince}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Type</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{profile.role}</div>
          {profile.membership_type && (
            <p className="text-xs text-muted-foreground">
              {profile.membership_type} membership
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {membershipExpiry ? 'Membership Expires' : 'Status'}
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {membershipExpiry || 'Active'}
          </div>
          {membershipExpiry && (
            <p className="text-xs text-muted-foreground">
              {new Date(profile.membership_expires_at!) > new Date() 
                ? 'Active membership' 
                : 'Expired membership'
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function ProfileContent() {
  const profile = await getUserProfile()
  
  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
        <p className="text-muted-foreground">
          Unable to load your profile information.
        </p>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <ProfileHeader profile={profile} />
      <ProfileStats profile={profile} />
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reservations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Reservation History
              </CardTitle>
              <CardDescription>
                View and manage your venue reservations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReservationHistory userId={profile.id} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                View your payment transactions and receipts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentHistory userId={profile.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'My Profile - Orange Sport Center',
  description: 'Manage your profile, view reservation history, and update your account settings.',
}