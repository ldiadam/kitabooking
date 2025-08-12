import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageIcon, Calendar, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

interface Album {
  id: string
  title: string
  description?: string
  cover_image_url?: string
  album_type: 'venue' | 'event' | 'facility' | 'general'
  is_featured: boolean
  created_at: string
  photos: AlbumPhoto[]
}

interface AlbumPhoto {
  id: string
  album_id: string
  image_url: string
  caption?: string
  sort_order: number
  created_at: string
}

async function getAlbums(): Promise<Album[]> {
  const supabase = await createClient()
  
  const { data: albums, error } = await supabase
    .from('albums')
    .select(`
      *,
      photos:album_photos(
        id,
        album_id,
        image_url,
        caption,
        sort_order,
        created_at
      )
    `)
    .order('created_at', { ascending: false })
    .order('sort_order', { foreignTable: 'album_photos', ascending: true })
  
  if (error) {
    console.error('Error fetching albums:', error)
    return []
  }
  
  return albums || []
}

function AlbumCard({ album }: { album: Album }) {
  const photoCount = album.photos?.length || 0
  const coverImage = album.cover_image_url || album.photos?.[0]?.image_url
  
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="aspect-square relative overflow-hidden bg-muted">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={album.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {album.is_featured && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Featured
            </Badge>
          </div>
        )}
        
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/50 text-white">
            {photoCount} photos
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-1">{album.title}</h3>
            <Badge variant="outline" className="ml-2 text-xs">
              {album.album_type}
            </Badge>
          </div>
          
          {album.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {album.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(album.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FilteredAlbums({ albums, filter }: { albums: Album[], filter: string }) {
  const filteredAlbums = filter === 'all' 
    ? albums 
    : albums.filter(album => album.album_type === filter)
  
  if (filteredAlbums.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No albums found</h3>
        <p className="text-muted-foreground">
          {filter === 'all' 
            ? 'No albums have been created yet.' 
            : `No ${filter} albums found.`
          }
        </p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredAlbums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  )
}

async function GalleryContent() {
  const albums = await getAlbums()
  
  const featuredAlbums = albums.filter(album => album.is_featured)
  const albumCounts = {
    all: albums.length,
    venue: albums.filter(a => a.album_type === 'venue').length,
    event: albums.filter(a => a.album_type === 'event').length,
    facility: albums.filter(a => a.album_type === 'facility').length,
    general: albums.filter(a => a.album_type === 'general').length,
  }
  
  return (
    <div className="space-y-8">
      {/* Featured Albums */}
      {featuredAlbums.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Featured Albums</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAlbums.slice(0, 3).map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}
      
      {/* All Albums with Filters */}
      <section>
        <h2 className="text-2xl font-bold mb-6">All Albums</h2>
        
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({albumCounts.all})
            </TabsTrigger>
            <TabsTrigger value="venue" className="text-xs sm:text-sm">
              Venues ({albumCounts.venue})
            </TabsTrigger>
            <TabsTrigger value="event" className="text-xs sm:text-sm">
              Events ({albumCounts.event})
            </TabsTrigger>
            <TabsTrigger value="facility" className="text-xs sm:text-sm">
              Facilities ({albumCounts.facility})
            </TabsTrigger>
            <TabsTrigger value="general" className="text-xs sm:text-sm">
              General ({albumCounts.general})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <FilteredAlbums albums={albums} filter="all" />
          </TabsContent>
          
          <TabsContent value="venue">
            <FilteredAlbums albums={albums} filter="venue" />
          </TabsContent>
          
          <TabsContent value="event">
            <FilteredAlbums albums={albums} filter="event" />
          </TabsContent>
          
          <TabsContent value="facility">
            <FilteredAlbums albums={albums} filter="facility" />
          </TabsContent>
          
          <TabsContent value="general">
            <FilteredAlbums albums={albums} filter="general" />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

export default function GalleryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Photo Gallery</h1>
        <p className="text-muted-foreground">
          Explore our facilities, events, and memorable moments at Orange Sport Center.
        </p>
      </div>
      
      <Suspense fallback={<GallerySkeleton />}>
        <GalleryContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Photo Gallery - Orange Sport Center',
  description: 'Explore our facilities, events, and memorable moments at Orange Sport Center through our photo gallery.',
}