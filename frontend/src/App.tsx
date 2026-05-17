import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import DictionaryPage from './pages/DictionaryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { TopNavbar, BottomNavbar } from './components/Navbar';

function App() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      {/* TopAppBar */}
      <TopNavbar />

      {/* Main Content Area */}
      <main className="flex-grow pb-xl md:pb-lg flex flex-col items-center w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <BottomNavbar />

      {/* Footer */}
      <footer className="bg-surface-container-high py-lg border-t border-outline-variant flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop gap-md w-full mt-auto mb-[64px] md:mb-0">
        <div className="font-title-md text-title-md font-bold text-primary">
            Sambung Kata
        </div>
        <div className="flex flex-wrap justify-center gap-md font-body-md text-body-md">
          <a className="text-on-surface-variant hover:text-secondary transition-colors" href="#">Grammar Guide</a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors" href="#">Vocabulary Tips</a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors" href="#">School Portal</a>
          <a className="text-on-surface-variant hover:text-secondary transition-colors" href="#">Privacy Policy</a>
        </div>
        <div className="text-on-surface-variant font-body-md text-body-md">
            © {new Date().getFullYear()} Sambung Kata Educational. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;
