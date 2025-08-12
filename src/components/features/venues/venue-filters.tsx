'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Search, Filter } from 'lucide-react'
import type { Database } from '@/types/database'

type VenueType = Database['public']['Tables']['venue_types']['Row']

interface VenueFiltersProps {
  venueTypes: VenueType[]
  currentFilters: {
    type: string
    search: string
    sort: string
  }
}

export default function VenueFilters({ venueTypes, currentFilters }: VenueFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')

  const updateFilters = useCallback((newFilters: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`/venues?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = () => {
    updateFilters({ search: searchValue })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setSearchValue('')
    router.push('/venues')
  }

  const removeFilter = (filterKey: string) => {
    if (filterKey === 'search') {
      setSearchValue('')
    }
    updateFilters({ [filterKey]: undefined })
  }

  const activeFiltersCount = Object.values(currentFilters).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Venues</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            placeholder="Search by name or description..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleSearch} size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Venue Type Filter */}
      <div className="space-y-2">
        <Label>Venue Type</Label>
        <Select
          value={currentFilters.type || 'all'}
          onValueChange={(value) => updateFilters({ type: value === 'all' ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All venue types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All venue types</SelectItem>
            {venueTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={currentFilters.sort || 'newest'}
          onValueChange={(value) => updateFilters({ sort: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="price_low">Price (Low to High)</SelectItem>
            <SelectItem value="price_high">Price (High to Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Active Filters ({activeFiltersCount})
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentFilters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {currentFilters.search}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => removeFilter('search')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {currentFilters.type && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {venueTypes.find(t => t.id === currentFilters.type)?.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => removeFilter('type')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {currentFilters.sort && currentFilters.sort !== 'newest' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Sort: {{
                  name: 'Name (A-Z)',
                  price_low: 'Price (Low to High)',
                  price_high: 'Price (High to Low)'
                }[currentFilters.sort]}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => removeFilter('sort')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}