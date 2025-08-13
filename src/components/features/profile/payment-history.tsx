'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, DollarSign, Receipt, Download, CreditCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
//import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Payment {
  id: string
  reservation_id?: string
  amount: number
  payment_method: 'cash' | 'bank_transfer' | 'e_wallet' | 'credit_card'
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_date: string
  notes?: string
  created_at: string
  reservation?: {
    id: string
    reservation_date: string
    start_time: string
    end_time: string
    venue: {
      name: string
    }
  }
}
/*
interface FinancialTransaction {
  id: string
  transaction_type: 'income' | 'expense'
  amount: number
  description: string
  transaction_date: string
  payment_method?: string
  created_at: string
}
*/
interface PaymentHistoryProps {
  userId: string
}

function PaymentCard({ payment }: { payment: Payment }) {
  const paymentDate = new Date(payment.transaction_date)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="h-4 w-4" />
      case 'bank_transfer': return <Receipt className="h-4 w-4" />
      case 'e_wallet': return <DollarSign className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }
  
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'credit_card': return 'Credit Card'
      case 'bank_transfer': return 'Bank Transfer'
      case 'e_wallet': return 'E-Wallet'
      case 'cash': return 'Cash'
      default: return method
    }
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {getMethodIcon(payment.payment_method)}
              Rp {payment.amount.toLocaleString()}
            </CardTitle>
            <CardDescription>
              {payment.reservation ? (
                `${payment.reservation.venue.name} - ${new Date(payment.reservation.reservation_date).toLocaleDateString()}`
              ) : (
                'General Payment'
              )}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(payment.payment_status)}>
            {payment.payment_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{paymentDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Method:</span>
            <span>{formatPaymentMethod(payment.payment_method)}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Receipt className="h-4 w-4 mr-1" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogDescription>
                  Complete payment information
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Payment Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">Rp {payment.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span>{formatPaymentMethod(payment.payment_method)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className={getStatusColor(payment.payment_status)}>
                        {payment.payment_status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{paymentDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {payment.reservation && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Reservation Details</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Venue:</span>
                          <span>{payment.reservation.venue.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{new Date(payment.reservation.reservation_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{payment.reservation.start_time} - {payment.reservation.end_time}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {payment.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">
                        {payment.notes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {payment.payment_status === 'completed' && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Receipt
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PaymentSummary({ payments }: { payments: Payment[] }) {
  const totalPaid = payments
    .filter(p => p.payment_status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const totalPending = payments
    .filter(p => p.payment_status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const totalRefunded = payments
    .filter(p => p.payment_status === 'refunded')
    .reduce((sum, p) => sum + p.amount, 0)
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-600">Total Paid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {totalPaid.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {totalPending.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-600">Refunded</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {totalRefunded.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentHistory({ userId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  
  useEffect(() => {
    async function fetchPayments() {
      try {
        // First, get user's reservations to find related payments
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('id')
          .eq('user_id', userId)
        
        if (reservationsError) throw reservationsError
        
        const reservationIds = reservations?.map(r => r.id) || []
        
        // Then get payments for those reservations
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            reservation:reservations(
              id,
              reservation_date,
              start_time,
              end_time,
              venue:venues(
                name
              )
            )
          `)
          .in('reservation_id', reservationIds)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setPayments(data || [])
      } catch (err) {
        console.error('Error fetching payments:', err)
        setError('Failed to load payment history')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchPayments()
  }, [userId, supabase])
  
  if (isLoading) {
    return <PaymentSkeleton />
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No payment history</h3>
        <p className="text-muted-foreground mb-4">
          You have not made any payments yet.
        </p>
        <Button asChild>
          <a href="/venues">Make a Booking</a>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <PaymentSummary payments={payments} />
      
      <div className="space-y-4">
        {payments.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  )
}