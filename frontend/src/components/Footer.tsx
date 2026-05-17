import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/60 w-full mt-auto mb-xl md:mb-0 pt-xl pb-lg transition-all duration-300">
      <div className="w-full px-4 md:px-8 mx-auto grid grid-cols-1 md:grid-cols-12 gap-xl">
        
        {/* Column 1: Brand Info & Badges */}
        <div className="md:col-span-5 flex flex-col gap-sm">
          <div className="font-headline-lg text-primary text-[24px] font-bold italic tracking-wider self-start shrink-0 select-none">
            SAMBUNGKATA
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Platform permainan sambung kata bahasa Indonesia berbasis KBBI yang seru, edukatif, dan kompetitif. Latih kelincahan berpikir, perluas kosakata Anda, dan bersainglah di papan peringkat global!
          </p>
          <div className="flex flex-wrap gap-sm items-center mt-xs">
            <span className="flex items-center gap-1.5 bg-primary/5 text-primary font-label-sm text-label-sm px-3 py-1.5 rounded-full border border-primary/10">
              <span className="material-symbols-outlined text-[16px] animate-pulse">verified</span>
              KBBI Terintegrasi
            </span>
            <span className="flex items-center gap-1.5 bg-tertiary/5 text-tertiary font-label-sm text-label-sm px-3 py-1.5 rounded-full border border-tertiary/10">
              <span className="material-symbols-outlined text-[16px]">school</span>
              Edukasi Indonesia
            </span>
          </div>
        </div>

        {/* Column 2: Navigation Links */}
        <div className="md:col-span-2 flex flex-col gap-sm">
          <h4 className="font-label-lg text-label-lg text-primary uppercase tracking-wider font-bold">Navigasi</h4>
          <ul className="flex flex-col gap-2 font-body-md text-body-md">
            <li>
              <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group">
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">home</span>
                Home
              </Link>
            </li>
            <li>
              <Link to="/game" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group">
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">videogame_asset</span>
                Play Game
              </Link>
            </li>
            <li>
              <Link to="/dictionary" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group">
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">menu_book</span>
                Dictionary
              </Link>
            </li>
            <li>
              <Link to="/leaderboard" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group">
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">leaderboard</span>
                Leaderboard
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Educational Resources */}
        <div className="md:col-span-3 flex flex-col gap-sm">
          <h4 className="font-label-lg text-label-lg text-primary uppercase tracking-wider font-bold">Sumber Daya</h4>
          <ul className="flex flex-col gap-2 font-body-md text-body-md">
            <li>
              <a href="#" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group">
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">library_books</span>
                Grammar Guide
              </a>
            </li>
            <li>
              <a href="#" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group">
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">tips_and_updates</span>
                Vocabulary Tips
              </a>
            </li>
            <li>
              <a href="#" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group">
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">corporate_fare</span>
                School Portal
              </a>
            </li>
            <li>
              <a href="#" className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 group">
                <span className="material-symbols-outlined text-[18px] text-outline-variant group-hover:text-primary transition-colors">verified_user</span>
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Contact & Socials */}
        <div className="md:col-span-2 flex flex-col gap-sm">
          <h4 className="font-label-lg text-label-lg text-primary uppercase tracking-wider font-bold">Kontak Kami</h4>
          <div className="flex flex-col gap-2 font-body-md text-body-md text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-outline-variant">mail</span>
              halo@sambungkata.id
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-outline-variant">location_on</span>
              Jakarta, Indonesia
            </span>
          </div>
          <div className="flex gap-xs mt-xs">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              className="bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface-variant w-10 h-10 rounded-xl border border-outline-variant/60 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="GitHub"
            >
              <span className="material-symbols-outlined text-[20px]">code</span>
            </a>
            <a 
              href="#" 
              className="bg-surface-container-low hover:bg-primary hover:text-on-primary text-on-surface-variant w-10 h-10 rounded-xl border border-outline-variant/60 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Instagram"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </a>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="w-full px-4 md:px-8 mx-auto mt-xl pt-lg border-t border-outline-variant/40 flex flex-col md:flex-row justify-between items-center gap-sm">
        <span className="font-body-sm text-body-sm text-on-surface-variant text-center md:text-left">
          © {new Date().getFullYear()} <strong>SAMBUNGKATA</strong>. Edukasi Bahasa & Sastra Indonesia.
        </span>
        <span className="font-label-sm text-label-sm text-outline flex items-center gap-1">
          Dibuat dengan <span className="text-error animate-pulse text-[14px]">♥</span> untuk Pendidikan Indonesia.
        </span>
      </div>
    </footer>
  );
}
