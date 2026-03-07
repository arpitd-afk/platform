import Link from 'next/link'

const posts = [
  { slug: 'top-chess-opening-strategies', title: 'Top 5 Chess Opening Strategies for Beginners', category: 'Training', date: 'Dec 15, 2024', readTime: '5 min', excerpt: 'Starting strong is key in chess. These openings are battle-tested and perfect for students learning the game.', color: 'var(--amber)' },
  { slug: 'how-to-run-swiss-tournament', title: 'How to Run a Swiss Tournament at Your Academy', category: 'Tournaments', date: 'Dec 8, 2024', readTime: '7 min', excerpt: 'Step-by-step guide to organizing, pairing, and managing a Swiss format tournament using ChessAcademy Pro.', color: '#60A5FA' },
  { slug: 'parent-engagement-chess', title: 'Why Parent Engagement Matters in Chess Education', category: 'Academy Tips', date: 'Nov 28, 2024', readTime: '4 min', excerpt: 'Academies that keep parents informed see 40% better student retention. Here is how to do it right.', color: '#4ADE80' },
  { slug: 'using-analytics-to-improve', title: 'Using Analytics to Identify Student Weaknesses', category: 'Analytics', date: 'Nov 20, 2024', readTime: '6 min', excerpt: 'Data from thousands of games shows that most students struggle in the endgame. Here is how to spot and fix it.', color: '#A78BFA' },
  { slug: 'live-classroom-best-practices', title: '10 Best Practices for Online Chess Classrooms', category: 'Teaching', date: 'Nov 10, 2024', readTime: '8 min', excerpt: 'From board annotations to hand-raising protocols — make your virtual classes as engaging as in-person ones.', color: '#F472B6' },
  { slug: 'academy-scaling-tips', title: 'How to Scale Your Chess Academy from 20 to 200 Students', category: 'Academy Tips', date: 'Oct 30, 2024', readTime: '10 min', excerpt: 'The coaches and systems you need to go from a small local academy to a large regional chess institution.', color: 'var(--amber)' },
]

const categories = ['All', 'Training', 'Tournaments', 'Academy Tips', 'Analytics', 'Teaching']

export default function BlogPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="font-display text-5xl font-bold mb-4">Blog & Resources</h1>
        <p className="text-[var(--text-mid)] text-lg">Tips, guides, and insights for chess academy owners and coaches</p>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-10 flex-wrap justify-center">
        {categories.map(c => (
          <button key={c} className={`px-4 py-1.5 rounded-full text-sm transition-all ${c === 'All' ? 'bg-[var(--amber)] text-[var(--bg)] font-semibold' : 'bg-[var(--bg-subtle)] text-[var(--text-mid)] hover:bg-[var(--bg-hover)]'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Featured post */}
      <div className="card p-8 mb-8 border-[var(--amber)]/20 hover:border-[var(--amber)]/40 transition-all cursor-pointer">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-gold text-xs">Featured</span>
              <span className="badge-gray text-xs">{posts[0].category}</span>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3">{posts[0].title}</h2>
            <p className="text-[var(--text-mid)] text-sm mb-6">{posts[0].excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>{posts[0].date}</span>
              <span>{posts[0].readTime} read</span>
            </div>
          </div>
          <div className="bg-[var(--amber)]/5 border border-[var(--amber)]/10 rounded-2xl h-48 flex items-center justify-center text-6xl">
            ♛
          </div>
        </div>
      </div>

      {/* Post grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {posts.slice(1).map(post => (
          <div key={post.slug} className="card-hover p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge text-xs" style={{ background: `${post.color}15`, color: post.color }}>{post.category}</span>
            </div>
            <h3 className="font-semibold text-base mb-2 leading-snug">{post.title}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">{post.excerpt}</p>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{post.date}</span>
              <span>{post.readTime} read</span>
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <div className="mt-20 card p-10 text-center border-[var(--amber)]/20">
        <h2 className="font-display text-3xl font-bold mb-3">Get tips in your inbox</h2>
        <p className="text-[var(--text-mid)] text-sm mb-6">Weekly chess academy insights for coaches and academy owners</p>
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <input className="input flex-1" placeholder="your@email.com" type="email" />
          <button className="btn-primary whitespace-nowrap">Subscribe</button>
        </div>
      </div>
    </main>
  )
}
