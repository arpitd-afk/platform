'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, Menu, X, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <div className="bg-surface-50 min-h-screen flex flex-col">
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-surface-200/50 backdrop-blur-xl py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-10 h-10 group-hover:scale-110 transition-transform duration-500">
              <Image 
                src="/images/logo.svg" 
                alt="Chess Academy Pro Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-tight text-surface-900 leading-none">
                Chess Academy Pro
              </span>
              <span className="text-[8px] font-black text-gold uppercase tracking-[0.2em] mt-1">Master System</span>
            </div>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10 text-xs font-black uppercase tracking-[0.2em] text-surface-500">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-gold transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block btn-ghost text-[10px] font-black uppercase tracking-widest px-5 py-2">
              Login
            </Link>
            <Link href="/onboarding" className="btn-primary text-[10px] font-black uppercase tracking-widest px-5 py-2 shadow-xl shadow-gold/10">
              Free Trial
            </Link>
            
            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-100 text-surface-900"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white border-b border-surface-200 shadow-2xl p-6 lg:hidden"
            >
              <div className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between text-lg font-black text-surface-900 group"
                  >
                    {item.name}
                    <ArrowRight size={18} className="text-surface-200 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
                <div className="pt-6 border-t border-surface-100 flex flex-col gap-4">
                   <Link href="/login" onClick={() => setIsOpen(false)} className="btn-secondary w-full py-4 text-center font-black uppercase tracking-widest text-xs">Login</Link>
                   <Link href="/onboarding" onClick={() => setIsOpen(false)} className="btn-primary w-full py-4 text-center font-black uppercase tracking-widest text-xs">Start Free Trial</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-surface-200 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                   <Image src="/images/logo.svg" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-display font-black text-xl tracking-tight text-surface-900">
                  Chess Academy Pro
                </span>
              </div>
              <p className="text-surface-500 max-w-xs text-base font-medium leading-relaxed">
                The most advanced platform for professional chess academies, schools, and federations worldwide.
              </p>
            </div>
            
            {[
              { title: 'Platform', links: [['Features', '/features'], ['Pricing', '/pricing'], ['Play Chess', '/game']] },
              { title: 'Company', links: [['Blog', '/blog'], ['Contact', '/contact'], ['About Us', '/about']] },
              { title: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-8 text-surface-400">{col.title}</h4>
                <ul className="space-y-5">
                   {col.links.map(([label, href]) => (
                     <li key={label}>
                       <Link href={href} className="text-surface-600 hover:text-gold font-bold transition-colors">{label}</Link>
                     </li>
                   ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left">
            <p className="text-sm text-surface-400 font-bold">
              © 2025 Chess Academy Pro · Engineered for Excellence
            </p>
            <div className="flex items-center gap-8">
               {/* Social links placeholder */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
