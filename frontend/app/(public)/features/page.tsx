import Link from 'next/link'
import Image from 'next/image'
import { Monitor, Users, Trophy, BarChart3, Shield, Puzzle, GraduationCap, CheckCircle2 } from 'lucide-react'

const mainFeatures = [
  {
    title: 'Live Chess Classrooms',
    desc: 'The heart of your academy. A shared board that works perfectly on any device, syncing every move and annotation instantly.',
    image: '/images/classroom_mockup.png',
    color: 'var(--amber)',
    points: ['Real-time arrow & highlight annotations', 'Coach-student board control switching', 'One-click PGN lesson saving', 'Built-in video and voice integration support'],
    icon: Monitor
  },
  {
    title: 'Advanced Tournament System',
    desc: 'Run professional events with ease. From local club matches to national championships, our system handles it all.',
    image: '/images/tournament_mockup.png',
    color: '#60A5FA',
    points: ['Swiss, Round Robin, and K.O. formats', 'Instant ELO rating updates after games', 'Live spectator walls and leaderboards', 'Automatic pairing for subsequent rounds'],
    icon: Trophy
  },
  {
    title: 'Parent & Student Portals',
    desc: 'Keep everyone in the loop. Parents can track progress without disturbing coaches, and students have a dedicated hub for all their activities.',
    image: '/images/parent_mockup.png',
    color: '#F472B6',
    points: ['Real-time attendance & homework tracking', 'Progress charts and performance analytics', 'Direct student-coach private messaging', 'Customizable student profiles and badges'],
    icon: Users
  }
]

const gridFeatures = [
  {
    icon: BarChart3, color: '#4ADE80', title: 'Deep Analytics',
    desc: 'Track rating progression, accuracy scores, and mistake patterns automatically.',
  },
  {
    icon: Puzzle, color: '#A78BFA', title: 'Themed Puzzle Sets',
    desc: 'Thousands of puzzles organized by theme and difficulty level.',
  },
  {
    icon: GraduationCap, color: '#F472B6', title: 'PGN Homework',
    desc: 'Assign and grade PGN-based homework with ease.',
  },
  {
    icon: Shield, color: '#60A5FA', title: 'Anti-Cheat Pro',
    desc: 'Automated engine detection to keep your events fair.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="bg-surface-50">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-32 px-6 text-center">
        <div className="absolute top-0 left-0 w-full h-full bg-gold-gradient opacity-5 -z-10" />
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-5xl lg:text-6xl font-black mb-8 tracking-tight text-surface-900 leading-[1.1]">
            Everything you need to<br />
            <span className="text-gold-gradient">scale your academy.</span>
          </h1>
          <p className="text-surface-500 text-lg lg:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            Stop juggling between multiple apps. Get live classrooms, tournaments, 
            analytics, and messaging in one unified professional platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding" className="btn-primary text-lg px-12 py-5 w-full sm:w-auto shadow-2xl shadow-gold/20 font-black">Start Free Trial</Link>
            <Link href="/pricing" className="btn-secondary text-lg px-12 py-5 w-full sm:w-auto font-black">View Pricing</Link>
          </div>
        </div>
      </section>

      {/* Main Features Detail */}
      <section className="max-w-7xl mx-auto px-6 py-20 lg:py-24 space-y-24 lg:space-y-32">
        {mainFeatures.map((f, idx) => (
          <div key={f.title} className={`flex flex-col lg:items-center gap-16 lg:gap-24 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
            <div className="flex-1 space-y-8">
              <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-premium bg-white border border-surface-100">
                <f.icon size={32} style={{ color: f.color }} />
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-surface-900 leading-[1.1]">{f.title}</h2>
              <p className="text-surface-500 text-xl font-medium leading-relaxed">{f.desc}</p>
              <ul className="grid sm:grid-cols-1 gap-4">
                {f.points.map(p => (
                  <li key={p} className="flex items-center gap-4 text-surface-600 font-bold">
                    <CheckCircle2 size={24} className="text-gold flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 rounded-[3rem] border border-surface-200 shadow-premium overflow-hidden bg-white hover:border-gold/30 transition-colors group p-2">
              <Image src={f.image} alt={f.title} width={1000} height={600} className="w-full h-auto rounded-[2.5rem] group-hover:scale-[1.02] transition-transform duration-700" />
            </div>
          </div>
        ))}
      </section>

      {/* Grid Features */}
       <section className="bg-white border-y border-surface-200 py-20 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <p className="text-surface-500 text-xl font-medium max-w-2xl mx-auto">Every detail is meticulously crafted to empower your coaching workflow.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {gridFeatures.map((f) => (
              <div key={f.title} className="bg-surface-50 p-10 rounded-[2.5rem] border border-surface-100 hover:border-gold/30 hover:shadow-premium transition-all group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-white shadow-sm group-hover:scale-110 transition-transform" style={{ background: `${f.color}15` }}>
                  <f.icon size={26} style={{ color: f.color }} />
                </div>
                <h3 className="text-xl font-black mb-4 text-surface-900">{f.title}</h3>
                <p className="text-surface-500 text-sm font-bold leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-24 px-6">
        <div className="max-w-7xl mx-auto bg-surface-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold opacity-10 blur-[150px]" />
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold opacity-10 blur-[150px]" />
           <h2 className="text-white text-3xl lg:text-5xl font-extrabold mb-10 tracking-tight leading-[1.1]">Ready to transform your academy?</h2>
           <p className="text-surface-400 text-lg lg:text-xl mb-14 max-w-2xl mx-auto font-medium">Join the next generation of chess educational institutions.</p>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/onboarding" className="btn-primary px-16 py-6 text-xl font-black shadow-2xl shadow-gold/30 w-full sm:w-auto">Get Started Now</Link>
              <Link href="/contact" className="btn-secondary border-surface-700 text-white hover:bg-surface-800 px-16 py-6 text-xl font-black w-full sm:w-auto">Talk to Sales</Link>
           </div>
        </div>
      </section>
    </div>
  )
}
