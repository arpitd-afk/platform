"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Calendar, Clock, ChevronLeft, Share2, Facebook, Twitter, Link2, ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";

const posts = {
  "top-chess-opening-strategies": {
    title: "Top 5 Chess Opening Strategies for Beginners",
    category: "Training",
    date: "Dec 15, 2024",
    readTime: "5 min",
    image: "/images/blog1.png",
    author: "Grandmaster Vishy",
    excerpt: "Starting strong is key in chess. These openings are battle-tested and perfect for students learning the game.",
    content: `
      <p>The opening is perhaps the most critical stage of the game. It sets the tone for the entire encounter and can often determine the final outcome before the middlegame even begins. For beginners, the goal is simple: control the center, develop your pieces, and ensure king safety.</p>
      
      <h2>1. The Italian Game</h2>
      <p>The Italian Game starts with 1.e4 e5 2.Nf3 Nc6 3.Bc4. It's one of the oldest openings and perfectly illustrates opening principles. It aims to control the center immediately and prepares to castle early.</p>
      
      <h2>2. The Ruy Lopez</h2>
      <p>Named after a 16th-century Spanish priest, the Ruy Lopez is a classic. 1.e4 e5 2.Nf3 Nc6 3.Bb5. It puts immediate pressure on the knight defending the e5 square.</p>
      
      <h2>3. The Queen's Gambit</h2>
      <p>For those who prefer 1.d4, the Queen's Gambit (1.d4 d5 2.c4) is the most popular choice. While it's called a gambit, White isn't actually losing a pawn for long, as they can usually regain it with superior control.</p>
      
      <blockquote>
        "The opening is the most important part of the game because if you don't get out of the opening well, you don't get to play the rest of the game."
      </blockquote>
      
      <p>Mastering these will give any beginner a solid foundation. Remember, don't just memorize moves — understand the ideas behind them!</p>
    `,
  },
  "how-to-run-swiss-tournament": {
    title: "How to Run a Swiss Tournament at Your Academy",
    category: "Tournaments",
    date: "Dec 8, 2024",
    readTime: "7 min",
    image: "/images/blog2.png",
    author: "Arbiter Vikram",
    excerpt: "Step-by-step guide to organizing, pairing, and managing a Swiss format tournament using ChessAcademy Pro.",
    content: `
      <p>Running a tournament can be overwhelming. Between pairings, scorecards, and time controls, there's a lot to manage. The Swiss System is the most popular format for chess tournaments because it allows a large number of players to compete without elimination.</p>
      
      <h2>Preparation</h2>
      <p>Ensure all players are registered and their ELO ratings are up to date. This is crucial for fair first-round pairings.</p>
      
      <h2>The Pairing Engine</h2>
      <p>Using ChessAcademy Pro, the pairings are handled automatically. The engine ensures that players with similar scores are matched against each other, while also balancing color allocations (White vs Black).</p>
      
      <p>Happy pairing!</p>
    `,
  },
};

const recentPosts = [
  { slug: "parent-engagement-chess", title: "Why Parent Engagement Matters", date: "Nov 28" },
  { slug: "using-analytics-to-improve", title: "Using Analytics for Growth", date: "Nov 20" },
  { slug: "live-classroom-best-practices", title: "Top 10 Classroom Practices", date: "Nov 10" },
];

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = posts[slug as keyof typeof posts] || posts["top-chess-opening-strategies"];

  return (
    <div className="bg-surface-50 min-h-screen">
      {/* Article Hero */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-32 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-surface-400 font-black text-xs uppercase tracking-widest hover:text-gold transition-colors">
            <ChevronLeft size={16} /> Back to Blog
          </Link>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="bg-gold-dim text-gold text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-gold-light/10">Read Mode</span>
              <span className="text-surface-300">•</span>
              <span className="text-xs font-black text-surface-400 uppercase tracking-[0.2em]">{post.category}</span>
            </div>
            <h1 className="font-display text-4xl lg:text-7xl font-extrabold tracking-tight text-surface-900 leading-[1.1]">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-8 pt-4 text-xs font-black text-surface-400 uppercase tracking-widest">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gold-dim border border-gold/10 flex items-center justify-center text-gold font-bold">V</div>
                 <span>By {post.author}</span>
              </div>
              <div className="flex items-center gap-2"><Calendar size={16} className="text-gold" /> {post.date}</div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-gold" /> {post.readTime} read</div>
            </div>
          </div>

          <div className="aspect-[21/9] relative rounded-[3rem] overflow-hidden border border-surface-200 shadow-premium p-2 bg-white/50 backdrop-blur">
             <Image src={post.image} alt={post.title} fill className="object-cover rounded-[2.5rem]" priority />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 pb-24 lg:pb-48">
        <div className="grid lg:grid-cols-[1fr_320px] gap-20 items-start">
          {/* Article Body */}
          <article className="prose prose-lg lg:prose-xl max-w-none prose-headings:font-display prose-headings:font-extrabold prose-headings:text-surface-900 prose-p:text-surface-500 prose-p:font-medium prose-p:leading-relaxed prose-blockquote:border-gold prose-blockquote:bg-gold-dim prose-blockquote:rounded-2xl prose-blockquote:p-6 prose-blockquote:not-italic prose-blockquote:font-display prose-blockquote:text-lg lg:prose-blockquote:text-2xl prose-blockquote:text-surface-900">
             <div dangerouslySetInnerHTML={{ __html: post.content }} />
             
             {/* Tags & Share */}
             <div className="mt-20 pt-10 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-3">
                   <span className="text-xs font-black text-surface-400 uppercase tracking-widest">Share this:</span>
                   <div className="flex items-center gap-2">
                      <button className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors text-surface-500"><Twitter size={18} /></button>
                      <button className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors text-surface-500"><Facebook size={18} /></button>
                      <button className="w-10 h-10 rounded-xl bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors text-surface-500"><Link2 size={18} /></button>
                   </div>
                </div>
                <button className="flex items-center gap-3 bg-white border border-surface-200 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-surface-900 hover:shadow-premium transition-all">
                   <Share2 size={16} /> Open Share Menu
                </button>
             </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-12 sticky top-32">
             {/* Newsletter */}
             <div className="bg-surface-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold opacity-10 blur-3xl" />
                <Mail size={32} className="text-gold mb-6" />
                <h4 className="text-xl font-bold mb-4 tracking-tight">Stay ahead of the game</h4>
                <p className="text-surface-400 text-sm font-medium mb-8 leading-relaxed">Weekly insights delivered straight to your inbox.</p>
                <div className="space-y-4">
                   <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors font-bold" placeholder="your@email.com" />
                   <button className="btn-primary w-full py-3.5 font-black text-xs uppercase tracking-widest">Subscribe</button>
                </div>
             </div>

             {/* Recent Posts */}
             <div className="space-y-6">
                <h4 className="text-lg font-black tracking-tight text-surface-900">More Insights</h4>
                <div className="space-y-4">
                   {recentPosts.map(rp => (
                     <Link key={rp.slug} href={`/blog/${rp.slug}`} className="block group">
                        <div className="p-5 rounded-2xl bg-white border border-surface-200 hover:border-gold/30 hover:shadow-premium transition-all">
                           <div className="text-[10px] font-black text-gold uppercase tracking-widest mb-2">{rp.date}</div>
                           <h5 className="font-bold text-surface-900 group-hover:text-gold transition-colors leading-tight line-clamp-2">{rp.title}</h5>
                           <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-surface-400 group-hover:gap-3 transition-all">
                              Read Story <ArrowRight size={12} />
                           </div>
                        </div>
                     </Link>
                   ))}
                </div>
             </div>
          </aside>
        </div>
      </section>

      {/* Recommended CTA */}
      <section className="bg-white border-t border-surface-200 py-32 px-6">
         <div className="max-w-4xl mx-auto text-center space-y-10">
            <h2 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900">Level up your coaching.</h2>
            <p className="text-surface-500 text-xl font-medium">Join 500+ academies scaling with the professional system.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link href="/onboarding" className="btn-primary px-12 py-5 text-lg font-black shadow-2xl shadow-gold/30 w-full sm:w-auto">Start Free Trial</Link>
               <Link href="/contact" className="btn-secondary px-12 py-5 text-lg font-black w-full sm:w-auto">Talk to Sales</Link>
            </div>
         </div>
      </section>
    </div>
  );
}
