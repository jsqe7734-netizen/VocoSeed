import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import SearchPage from './pages/SearchPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import GeneratePage from './pages/GeneratePage';
import Onboarding from './components/Onboarding';
import { useState } from 'react';

function App() {
  const [showOnboarding] = useState(() => {
    const hasCompletedOnboarding = localStorage.getItem('vocoseed_onboarding_complete');
    return !hasCompletedOnboarding;
  });

  const handleOnboardingComplete = () => {
    // This is handled by the Onboarding component setting localStorage
  };

  return (
    <BrowserRouter>
      <AppProvider>
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/generate" element={<GeneratePage />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
