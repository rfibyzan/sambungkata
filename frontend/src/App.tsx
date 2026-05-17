import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import DictionaryPage from './pages/DictionaryPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import { TopNavbar, BottomNavbar } from './components/Navbar';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import InteractiveBackground from './components/InteractiveBackground';
function App() {
  return (
    <AuthProvider>
      <div className="text-on-background min-h-screen flex flex-col font-body-md relative">
        {/* Interactive Floating Letter Background */}
        <InteractiveBackground />

        {/* TopAppBar */}
        <TopNavbar />

        {/* Main Content Area */}
        <main className="grow w-full min-h-[calc(100vh-128px)] md:min-h-[calc(100vh-64px)] flex flex-col items-center">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

        {/* BottomNavBar (Mobile Only) */}
        <BottomNavbar />

        {/* Footer */}
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
