import Logo from '../common/Logo.jsx'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-20 mt-24 relative z-10">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="text-[13.5px] text-slate-500 mt-3.5 max-w-[300px] leading-relaxed">
              The collaborative study platform for the modern student. Learn together, anywhere.
            </p>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-100 mb-4">Product</h4>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">Features</a>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">Pricing</a>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">Changelog</a>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-100 mb-4">Company</h4>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">About</a>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">Blog</a>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">Contact</a>
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-100 mb-4">Legal</h4>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">Privacy</a>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">Terms</a>
            <a href="#" className="block text-[13.5px] text-slate-500 hover:text-slate-100 py-1 transition">Security</a>
          </div>
        </div>
        <div className="flex justify-between items-center pt-7 border-t border-white/[0.06] flex-wrap gap-3">
          <p className="text-xs text-slate-500">© 2026 StudySync. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-slate-500 hover:text-slate-100 transition">Twitter</a>
            <a href="#" className="text-xs text-slate-500 hover:text-slate-100 transition">GitHub</a>
            <a href="#" className="text-xs text-slate-500 hover:text-slate-100 transition">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  )
}