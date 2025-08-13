'use client'

import { ReactNode, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Calendar, Home, Image, LogOut, Settings, User, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, profile, signOut } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    signOut()
    router.push('/login')
  }

  const isAdmin = profile?.user_type === 'admin' || profile?.user_type === 'superadmin'

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/booking', label: 'Booking', icon: Calendar },
    { href: '/venues', label: 'Venues' },
    { href: '/events', label: 'Events' },
    { href: '/gallery', label: 'Gallery', icon: Image },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OSC</span>
              </div>
              <span className="font-bold text-lg sm:text-xl hidden sm:block">Orange Sport Center</span>
              <span className="font-bold text-lg sm:hidden">OSC</span>
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink asChild>
                        <Link href={item.href} className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                          {Icon && <Icon className="w-4 h-4 mr-2" />}
                          {item.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                })}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Mobile & Desktop User Menu */}
            <div className="flex items-center space-x-2">
              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* Mobile Menu Header */}
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">OSC</span>
                        </div>
                        <span className="font-bold text-lg">Orange Sport Center</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="flex-1 py-4">
                      <div className="space-y-2">
                        {navigationItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              {Icon && <Icon className="w-5 h-5" />}
                              <span>{item.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </nav>

                    {/* Mobile User Section */}
                    <div className="border-t pt-4">
                      {user ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3 px-3 py-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={profile?.full_name || ''} />
                              <AvatarFallback>
                                {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <p className="text-sm font-medium">
                                {profile?.full_name || 'User'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          
                          {isAdmin && (
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Settings className="w-5 h-5" />
                              <span>Admin Dashboard</span>
                            </Link>
                          )}
                          
                          <Link
                            href="/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <User className="w-5 h-5" />
                            <span>Profile</span>
                          </Link>
                          
                          <Link
                            href="/bookings"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <Calendar className="w-5 h-5" />
                            <span>My Bookings</span>
                          </Link>
                          
                          <button
                            onClick={() => {
                              handleSignOut()
                              setIsMobileMenuOpen(false)
                            }}
                            className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left"
                          >
                            <LogOut className="w-5 h-5" />
                            <span>Log out</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button variant="ghost" asChild className="w-full justify-start">
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                              Login
                            </Link>
                          </Button>
                          <Button asChild className="w-full">
                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                              Register
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={profile?.full_name || ''} />
                        <AvatarFallback>
                          {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">
                        <Calendar className="mr-2 h-4 w-4" />
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden lg:flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OSC</span>
                </div>
                <span className="font-bold text-lg">Orange Sport Center</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Modern sports venue booking system for all your recreational needs.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/booking" className="text-muted-foreground hover:text-foreground transition-colors">Book Now</Link></li>
                <li><Link href="/venues" className="text-muted-foreground hover:text-foreground transition-colors">Our Venues</Link></li>
                <li><Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">Events</Link></li>
                <li><Link href="/gallery" className="text-muted-foreground hover:text-foreground transition-colors">Gallery</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-start space-x-2">
                  <span>📍</span>
                  <span>Your Address Here</span>
                </p>
                <p className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>+62 123 456 7890</span>
                </p>
                <p className="flex items-center space-x-2">
                  <span>✉️</span>
                  <span className="break-all">info@orangesportcenter.com</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Orange Sport Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}