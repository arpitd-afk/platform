import Link from 'next/link'
import { Monitor, Users, Trophy, BarChart3, Shield, Puzzle, GraduationCap, MessageSquare } from 'lucide-react'

const features = [
  {
    icon: Monitor, color: 'var(--amber)', title: 'Live Chess Classrooms',
    desc: 'Coach-controlled shared board with real-time arrow annotations, student hand-raising, and live chat. Every move is synced instantly for all participants.',
    points: ['Shared board with coach control', 'Live arrow & highlight annotations', 'Student raise-hand system', 'Save lesson as PGN'],
  },
  {
    icon: Trophy, color: '#60A5FA', title: 'Tournament System',
    desc: 'Host Swiss, Round Robin, and Knockout tournaments with auto-pairing, live standings, and ELO rating updates after every game.',
    points: ['Swiss, Round Robin, Knockout formats', 'Automatic pairing engine', 'Live standings & leaderboards', 'ELO rating integration'],
  },
  {
    icon: BarChart3, color: '#4ADE80', title: 'Deep Analytics',
    desc: 'Track every student\'s rating progression, accuracy scores, mistake patterns, and attendance. Academy admins get full performance dashboards.',
    points: ['Rating progression charts', 'Accuracy & mistake tracking', 'Attendance reports', 'Coach performance metrics'],
  },
  {
    icon: Puzzle, color: '#A78BFA', title: 'Puzzle Trainer',
    desc: 'Thousands of puzzles organized by theme and difficulty. Students solve daily puzzles and track their puzzle rating separately from game rating.',
    points: ['Themed puzzle sets', 'Daily puzzle challenges', 'Puzzle rating system', 'Mistake review mode'],
  },
  {
    icon: GraduationCap, color: '#F472B6', title: 'Assignments & Homework',
    desc: 'Coaches assign PGN-based homework with due dates. Students submit solutions, coaches grade them and leave comments — all in one place.',
    points: ['PGN assignment uploads', 'Due date management', 'Student submission tracking', 'Grading & feedback system'],
  },
  {
    icon: Users, color: 'var(--amber)', title: 'Parent Dashboard',
    desc: 'Parents get their own login to track attendance, monitor homework completion, view progress charts, and follow their child\'s rating growth.',
    points: ['Real-time attendance tracking', 'Homework completion view', 'Progress & rating charts', 'Coach feedback visibility'],
  },
  {
    icon: Shield, color: '#60A5FA', title: 'Anti-Cheat System',
    desc: 'Automated engine-move detection flags suspicious games for coach review. Keep your tournaments and rated games fair for everyone.',
    points: ['Automated move analysis', 'Suspicious game flagging', 'Admin review workflow', 'Tournament game monitoring'],
  },
  {
    icon: MessageSquare, color: '#4ADE80', title: 'Integrated Messaging',
    desc: 'Students, coaches, and parents can message each other directly within the platform. No need for external WhatsApp groups.',
    points: ['Student-coach direct messages', 'Coach-parent communication', 'Real-time delivery', 'Notification badges'],
  },
]

export default function FeaturesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <h1 className="font-display text-5xl lg:text-6xl font-bold mb-6">
          Every tool your academy needs.<br />
          <span className="text-gold-gradient">All in one platform.</span>
        </h1>
        <p className="text-[var(--text-mid)] text-lg max-w-2xl mx-auto mb-8">
          From live classrooms to tournament hosting, from parent dashboards to anti-cheat — ChessAcademy Pro covers every aspect of running a professional chess academy.
        </p>
        <Link href="/register" className="btn-primary text-base px-8 py-3">Start Free 14-Day Trial</Link>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f) => (
            <div key={f.title} className="card p-8 hover:border-[var(--border)] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}15` }}>
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold mb-2">{f.title}</h3>
                  <p className="text-[var(--text-mid)] text-sm mb-4 leading-relaxed">{f.desc}</p>
                  <ul className="space-y-1.5">
                    {f.points.map(p => (
                      <li key={p} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: f.color }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)] py-24 text-center px-6">
        <h2 className="font-display text-4xl font-bold mb-4">Ready to transform your academy?</h2>
        <p className="text-[var(--text-mid)] mb-8">Join 500+ academies already using ChessAcademy Pro</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="btn-primary text-sm px-8 py-3">Start Free Trial</Link>
          <Link href="/contact" className="btn-secondary text-sm px-8 py-3">Talk to Sales</Link>
        </div>
      </section>
    </main>
  )
}
