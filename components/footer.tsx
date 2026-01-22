import Link from "next/link";
import { Flower2, Github, Twitter, Instagram, Mail, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-10 w-full py-12 px-6 border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-950/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Brand Column */}
          <div className="flex flex-col gap-4 col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
                <Flower2 className="h-5 w-5 text-white" />
              </div>
              <span className="tracking-tight text-stone-900 dark:text-stone-50">
                SadhnaTrk
              </span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              Elevate your daily spiritual practice with conscious tracking, shloka memorization, and mindful reflection.
            </p>
          </div>

          {/* Practice (Tracker Data) */}
          <div>
            <h4 className="font-semibold mb-4 text-stone-900 dark:text-stone-100 italic">Practice</h4>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <li><Link href="/sadhak" className="hover:text-orange-600 transition-colors">Your Sadhana</Link></li>
              <li><Link href="/books" className="hover:text-orange-600 transition-colors">Book Tracker</Link></li>
              <li><Link href="/challenges" className="hover:text-orange-600 transition-colors">Shloka Learning</Link></li>
              <li><Link href="/mentors" className="hover:text-orange-600 transition-colors">Find a Mentor</Link></li>
            </ul>
          </div>

          {/* Social & Explore (Sections Data) */}
          <div>
            <h4 className="font-semibold mb-4 text-stone-900 dark:text-stone-100 italic">Explore</h4>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
              <li><Link href="/#sadhana-motivation" className="hover:text-orange-600 transition-colors">Japa Motivation</Link></li>
              <li><Link href="/friends" className="hover:text-orange-600 transition-colors">Friends</Link></li>
              <li><Link href="/chats" className="hover:text-orange-600 transition-colors">Chats</Link></li>
              <li><Link href="/#about-app" className="hover:text-orange-600 transition-colors">About SadhnaTrk</Link></li>
            </ul>
          </div>

          {/* Stay Connected */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold text-stone-900 dark:text-stone-100 italic">Stay Connected</h4>
            <div className="flex gap-4 text-stone-500 dark:text-stone-400">
              <Twitter className="h-5 w-5 hover:text-orange-500 cursor-pointer transition-transform hover:scale-110" />
              <Instagram className="h-5 w-5 hover:text-orange-500 cursor-pointer transition-transform hover:scale-110" />
              <Github className="h-5 w-5 hover:text-orange-500 cursor-pointer transition-transform hover:scale-110" />
              <Mail className="h-5 w-5 hover:text-orange-500 cursor-pointer transition-transform hover:scale-110" />
            </div>
            <div className="mt-2 p-3 bg-stone-100 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
              <p className="text-[10px] font-bold uppercase tracking-tighter text-stone-400">Mentor Portal</p>
              <Link href="/mentor/groups" className="text-xs font-semibold flex items-center gap-1 mt-1 text-primary hover:underline">
                Manage Groups <ExternalLink size={10} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500 uppercase tracking-widest font-medium">
          <p>© {new Date().getFullYear()} SadhnaTrk. Made for Devotees.</p>
          <div className="flex gap-6">
            <span className="hover:text-orange-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-orange-600 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}