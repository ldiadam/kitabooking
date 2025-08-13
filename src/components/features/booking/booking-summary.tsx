'use client'

import { useBookingStore } from '@/stores/booking-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
//import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText,
  CreditCard,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

export default function BookingSummary() {
  const { 
    selectedVenue, 
    selectedDate, 
    selectedTimeSlot, 
    notes, 
    totalPrice,
    duration 
  } = useBookingStore()

  if (!selectedVenue || !selectedDate || !selectedTimeSlot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select venue and time to see booking summary</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const venue = selectedVenue
  const date = selectedDate
  const startTime = selectedTimeSlot.start_time
  const endTime = selectedTimeSlot.end_time
  
  // Use duration from store (already calculated)
  // Use totalPrice from store (already calculated)
  const tax = totalPrice * 0.1 // 10% tax
  const finalPrice = totalPrice + tax
  const hourlyRate = duration > 0 ? totalPrice / duration : 0

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Venue Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{venue.name}</h3>
              <p className="text-sm text-gray-600">Orange Sport Center</p>
              {venue.description && (
                <p className="text-xs text-gray-500 mt-1">{venue.description}</p>
              )}
            </div>
          </div>
          
          {venue.facilities && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Facilities: {venue.facilities}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Booking Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Booking Details</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="text-sm text-gray-600">
                  {format(new Date(date), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">
                  {startTime} - {endTime}
                </div>
                <div className="text-sm text-gray-600">
                  Duration: {duration} hour{duration !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Additional Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {notes}
              </p>
            </div>
          </>
        )}

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Price Breakdown
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base price ({duration}h × {formatCurrency(hourlyRate)})</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Tax (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Booking Policies */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Booking Policies</h4>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Free cancellation up to 24 hours before booking</span>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Instant confirmation upon payment</span>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Equipment rental available on-site</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📞 +62 123 456 7890</p>
            <p>📧 info@orangesportcenter.com</p>
            <p className="text-xs mt-2">Available 24/7 for support</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}