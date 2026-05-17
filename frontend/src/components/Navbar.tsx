import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const desktopNavInactive = "text-on-surface-variant font-title-md text-title-md hover:bg-surface-container-low transition-colors px-2 py-1 rounded-lg";
const desktopNavActive = "text-primary font-bold border-b-2 border-primary font-title-md text-title-md hover:bg-surface-container-low transition-colors px-2 py-1";

const mobileNavInactive = "flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:text-primary transition-colors";
const mobileNavActive = "flex flex-col items-center justify-center bg-secondary-container text-on-secondary-container rounded-full px-4 py-1 hover:text-primary transition-colors scale-90 duration-200";

export function TopNavbar() {
  const { user, profile } = useAuth();

  return (
    <header className="bg-surface shadow-sm docked full-width top-0 z-50">
      {/* 
        Container spans 100% width with w-full, removing tight max-w restrictions,
        pushing the brand strictly to the far left and the nav items/profile to the far right.
      */}
      <div className="flex justify-between items-center px-4 md:px-8 py-base w-full">
        <Link to="/" className="brand-title-interactive shrink-0">
          SAMBUNGKATA
        </Link>

        {/* Extreme Right: Group of Navigation & Profile Picture */}
        <div className="flex items-center gap-lg">
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex gap-md items-center mr-sm">
            <NavLink to="/" className={({ isActive }) => isActive ? desktopNavActive : desktopNavInactive}>Home</NavLink>
            <NavLink to="/game" className={({ isActive }) => isActive ? desktopNavActive : desktopNavInactive}>Play</NavLink>
            <NavLink to="/dictionary" className={({ isActive }) => isActive ? desktopNavActive : desktopNavInactive}>Dictionary</NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => isActive ? desktopNavActive : desktopNavInactive}>Leaderboard</NavLink>
          </nav>

          {/* Profile Picture Link */}
          <div className="flex items-center text-primary border-l border-outline-variant/60 pl-md md:pl-lg">
            <Link
              to={user ? "/profile" : "/auth"}
              aria-label="Account"
              className="hover:bg-surface-container-low p-1.5 rounded-full transition-colors flex items-center justify-center shrink-0"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-[32px] h-[32px] rounded-full object-cover shadow-sm border border-primary/20 hover:scale-105 transition-transform"
                />
              ) : (
                <span className="material-symbols-outlined text-[28px]">account_circle</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function BottomNavbar() {
  const { profile } = useAuth();

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
      <NavLink to="/profile" className={({ isActive }) => isActive ? mobileNavActive : mobileNavInactive}>
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="w-md h-md rounded-full object-cover shadow-sm border border-primary/20"
          />
        ) : (
          <span className="material-symbols-outlined">account_circle</span>
        )}
        <span className="font-label-sm text-label-sm mt-1">Profile</span>
      </NavLink>
    </nav>
  );
}
