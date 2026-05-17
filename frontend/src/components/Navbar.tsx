import { Link, NavLink } from 'react-router-dom';

const desktopNavInactive = "text-on-surface-variant font-title-md text-title-md hover:bg-surface-container-low transition-colors px-2 py-1 rounded-lg";
const desktopNavActive = "text-primary font-bold border-b-2 border-primary font-title-md text-title-md hover:bg-surface-container-low transition-colors px-2 py-1";

const mobileNavInactive = "flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:text-primary transition-colors";
const mobileNavActive = "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 hover:text-primary transition-colors scale-90 duration-200";

export function TopNavbar() {
  return (
    <header className="bg-surface shadow-sm docked full-width top-0 z-50">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-base w-full max-w-max-width-content mx-auto">
        <Link to="/" className="font-headline-lg text-headline-lg font-bold text-primary">
          Sambung Kata
        </Link>
        <nav className="hidden md:flex gap-md items-center">
          <NavLink to="/" className={({ isActive }) => isActive ? desktopNavActive : desktopNavInactive}>Home</NavLink>
          <NavLink to="/game" className={({ isActive }) => isActive ? desktopNavActive : desktopNavInactive}>Play</NavLink>
          <NavLink to="/dictionary" className={({ isActive }) => isActive ? desktopNavActive : desktopNavInactive}>Dictionary</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => isActive ? desktopNavActive : desktopNavInactive}>Leaderboard</NavLink>
        </nav>
        <div className="flex items-center text-primary">
          <button aria-label="Account" className="hover:bg-surface-container-low p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[24px]">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNavbar() {
  return (
    <nav className="md:hidden bg-surface-container shadow-[0_-4px_6px_-1px_rgba(37,99,235,0.08)] docked full-width bottom-0 rounded-t-xl fixed left-0 w-full z-50 flex justify-around items-center h-xl px-sm">
      <NavLink to="/" className={({ isActive }) => isActive ? mobileNavActive : mobileNavInactive}>
        <span className="material-symbols-outlined">home</span>
        <span className="font-label-sm text-label-sm mt-1">Home</span>
      </NavLink>
      <NavLink to="/game" className={({ isActive }) => isActive ? mobileNavActive : mobileNavInactive}>
        <span className="material-symbols-outlined">videogame_asset</span>
        <span className="font-label-sm text-label-sm mt-1">Play</span>
      </NavLink>
      <NavLink to="/dictionary" className={({ isActive }) => isActive ? mobileNavActive : mobileNavInactive}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
        <span className="font-label-sm text-label-sm mt-1">Dictionary</span>
      </NavLink>
      <NavLink to="/leaderboard" className={({ isActive }) => isActive ? mobileNavActive : mobileNavInactive}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>leaderboard</span>
        <span className="font-label-sm text-label-sm mt-1">Leaderboard</span>
      </NavLink>
    </nav>
  );
}
