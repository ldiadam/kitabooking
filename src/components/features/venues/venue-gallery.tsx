'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react'
import type { Database } from '@/types/database'

type Photo = Database['public']['Tables']['photos']['Row']

interface VenueGalleryProps {
  venueId: string
}

export default function VenueGallery({ venueId }: VenueGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPhotos()
  }, [venueId])

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          albums!inner (
            id,
            title,
            venue_id
          )
        `)
        .eq('albums.venue_id', venueId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching photos:', error)
        return
      }

      setPhotos(data || [])
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const openLightbox = (index: number) => {
    setSelectedPhoto(index)
    setIsDialogOpen(true)
  }

  const closeLightbox = () => {
    setIsDialogOpen(false)
    setSelectedPhoto(null)
  }

  const goToPrevious = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1)
    }
  }

  const goToNext = () => {
    if (selectedPhoto !== null && selectedPhoto < photos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeLightbox()
    } else if (e.key === 'ArrowLeft') {
      goToPrevious()
    } else if (e.key === 'ArrowRight') {
      goToNext()
    }
  }

  useEffect(() => {
    if (isDialogOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDialogOpen, selectedPhoto])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No photos available for this venue</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gallery ({photos.length} photos)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.slice(0, 8).map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={photo.image_url || '/placeholder-image.jpg'}
                  alt={photo.caption || `Venue photo ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              </div>
            ))}
            {photos.length > 8 && (
              <div
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-gray-100 flex items-center justify-center"
                onClick={() => openLightbox(8)}
              >
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">
                    +{photos.length - 8} more
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <DialogHeader className="absolute top-4 left-4 z-10">
            <DialogTitle className="text-white bg-black/50 px-3 py-1 rounded">
              {selectedPhoto !== null && photos[selectedPhoto]?.caption}
            </DialogTitle>
          </DialogHeader>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/70"
            onClick={closeLightbox}
          >
            <X className="h-4 w-4" />
          </Button>

          {selectedPhoto !== null && (
            <>
              <div className="relative w-full h-full">
                <Image
                  src={photos[selectedPhoto].image_url || '/placeholder-image.jpg'}
                  alt={photos[selectedPhoto].caption || `Photo ${selectedPhoto + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {/* Navigation */}
              {selectedPhoto > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}

              {selectedPhoto < photos.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}

              {/* Photo counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded text-sm">
                {selectedPhoto + 1} of {photos.length}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}