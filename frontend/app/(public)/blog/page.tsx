import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ChevronRight, Mail, Search } from 'lucide-react'

const posts = [
  { 
    slug: 'top-chess-opening-strategies', 
    title: 'Top 5 Chess Opening Strategies for Beginners', 
    category: 'Training', 
    date: 'Dec 15, 2024', 
    readTime: '5 min', 
    excerpt: 'Starting strong is key in chess. These openings are battle-tested and perfect for students learning the game.', 
    color: 'var(--amber)',
    image: '/images/blog1.png'
  },
  { 
    slug: 'how-to-run-swiss-tournament', 
    title: 'How to Run a Swiss Tournament at Your Academy', 
    category: 'Tournaments', 
    date: 'Dec 8, 2024', 
    readTime: '7 min', 
    excerpt: 'Step-by-step guide to organizing, pairing, and managing a Swiss format tournament using ChessAcademy Pro.', 
    color: '#60A5FA',
    image: '/images/blog2.png'
  },
  { 
    slug: 'parent-engagement-chess', 
    title: 'Why Parent Engagement Matters in Chess Education', 
    category: 'Academy Tips', 
    date: 'Nov 28, 2024', 
    readTime: '4 min', 
    excerpt: 'Academies that keep parents informed see 40% better student retention. Here is how to do it right.', 
    color: '#F472B6',
    image: '/images/parent_mockup.png'
  },
  { 
    slug: 'using-analytics-to-improve', 
    title: 'Using Analytics to Identify Student Weaknesses', 
    category: 'Analytics', 
    date: 'Nov 20, 2024', 
    readTime: '6 min', 
    excerpt: 'Data from thousands of games shows that most students struggle in the endgame. Here is how to spot and fix it.', 
    color: '#A78BFA',
    image: '/images/analytics_mockup.png'
  },
  { 
    slug: 'live-classroom-best-practices', 
    title: '10 Best Practices for Online Chess Classrooms', 
    category: 'Teaching', 
    date: 'Nov 10, 2024', 
    readTime: '8 min', 
    excerpt: 'From board annotations to hand-raising protocols — make your virtual classes as engaging as in-person ones.', 
    color: '#10B981',
    image: '/images/classroom_mockup.png'
  },
  { 
    slug: 'academy-scaling-tips', 
    title: 'How to Scale Your Chess Academy from 20 to 200 Students', 
    category: 'Academy Tips', 
    date: 'Oct 30, 2024', 
    readTime: '10 min', 
    excerpt: 'The coaches and systems you need to go from a small local academy to a large regional chess institution.', 
    color: 'var(--amber)',
    image: '/images/hero_chess.png'
  },
]

const categories = ['All', 'Training', 'Tournaments', 'Academy Tips', 'Analytics', 'Teaching']

export default function BlogPage() {
  return (
    <div className="bg-surface-50 min-h-screen">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-12 lg:pt-24 lg:pb-16 text-center">
        <h1 className="font-display text-4xl lg:text-6xl font-black mb-8 tracking-tight text-surface-900 leading-[1.1]">Academy <span className="text-gold-gradient">Insights</span></h1>
        <p className="text-surface-500 text-lg lg:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Expert strategies, technical guides, and growth tips for 
          professional chess coaching institutions.
        </p>
      </section>

      {/* Category filter & Search */}
      <div className="max-w-7xl mx-auto px-6 mb-16 lg:mb-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-4 rounded-[2.5rem] border border-surface-200 shadow-sm">
           <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full lg:w-auto px-2">
              {categories.map(c => (
                <button key={c} className={`px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${c === 'All' ? 'bg-gold text-white shadow-lg shadow-gold/20' : 'bg-transparent text-surface-400 hover:text-surface-900 hover:bg-surface-50'}`}>
                  {c}
                </button>
              ))}
           </div>
           <div className="relative w-full lg:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
              <input type="text" placeholder="Search articles..." className="w-full bg-surface-50 border-surface-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-gold transition-colors" />
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24 lg:pb-48">
        {/* Featured post */}
        <Link href={`/blog/${posts[0].slug}`} className="block group mb-16">
          <div className="bg-white rounded-[3.5rem] border border-surface-200 overflow-hidden shadow-sm group-hover:shadow-premium transition-all duration-500">
            <div className="grid lg:grid-cols-2">
              <div className="aspect-[16/10] lg:aspect-auto relative overflow-hidden p-4">
                 <Image src={posts[0].image} alt={posts[0].title} fill className="object-cover rounded-[2.5rem] group-hover:scale-105 transition-transform duration-1000" />
              </div>
              <div className="p-10 lg:p-20 flex flex-col justify-center space-y-8">
                <div className="flex items-center gap-3">
                  <span className="bg-gold-dim text-gold text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-gold-light/10">Top Story</span>
                  <span className="text-surface-300">•</span>
                  <span className="text-xs font-black text-surface-400 uppercase tracking-[0.2em]">{posts[0].category}</span>
                </div>
                <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-surface-900 group-hover:text-gold transition-colors leading-[1.1]">{posts[0].title}</h2>
                <p className="text-surface-500 text-lg font-medium leading-relaxed">{posts[0].excerpt}</p>
                <div className="flex items-center gap-8 pt-6 text-xs font-black text-surface-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-gold" /> {posts[0].date}</div>
                  <div className="flex items-center gap-2"><Clock size={16} className="text-gold" /> {posts[0].readTime} read</div>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Post grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.slice(1).map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col">
              <div className="bg-white rounded-[3rem] border border-surface-200 overflow-hidden shadow-sm group-hover:shadow-premium transition-all duration-500 flex flex-col h-full p-3">
                <div className="aspect-[16/10] relative overflow-hidden rounded-[2.25rem] mb-6">
                   <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                </div>
                <div className="px-6 pb-6 flex flex-col flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border" style={{ background: `${post.color}15`, color: post.color, borderColor: `${post.color}20` }}>{post.category}</span>
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-surface-900 group-hover:text-gold transition-colors leading-snug">{post.title}</h3>
                  <p className="text-surface-500 text-sm font-bold leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                  <div className="pt-6 border-t border-surface-100 flex items-center justify-between text-[10px] font-black text-surface-400 uppercase tracking-widest mt-auto">
                    <span>{post.date}</span>
                    <span className="flex items-center gap-2 group-hover:text-gold transition-all">Read Story <ChevronRight size={14} /></span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <section className="max-w-7xl mx-auto px-6 mb-20 lg:mb-32">
        <div className="bg-surface-900 rounded-[3rem] p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gold opacity-10 blur-[150px]" />
           <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur shadow-premium transition-transform hover:rotate-6">
                 <Mail className="text-gold" size={40} />
              </div>
              <h2 className="text-white text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight">Master your craft.</h2>
              <p className="text-surface-400 text-lg lg:text-xl font-medium">Weekly insights on coaching, tournament management, and scaling your institution.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-10">
                <input className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-8 py-6 text-white text-lg placeholder:text-surface-600 focus:outline-none focus:border-gold transition-all shadow-inner font-bold" placeholder="Enter your email..." type="email" />
                <button className="btn-primary whitespace-nowrap px-16 py-6 text-xl font-black w-full sm:w-auto shadow-2xl shadow-gold/20">Subscribe</button>
              </div>
              <p className="text-[10px] text-surface-500 font-black uppercase tracking-[0.3em] pt-6">Zero spam. Pure chess excellence.</p>
           </div>
        </div>
      </section>
    </div>
  )
}
