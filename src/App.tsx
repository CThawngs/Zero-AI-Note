import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { SetPasswordModal } from './components/common/SetPasswordModal';
import { LoginScreen } from './components/screens/LoginScreen';
import { ChatScreen } from './components/screens/ChatScreen';
import { LibraryScreen } from './components/screens/LibraryScreen';
import { NoteDetailScreen } from './components/screens/NoteDetailScreen';
import { FilesScreen } from './components/screens/FilesScreen';
import { TemplatesScreen } from './components/screens/TemplatesScreen';
import { ArchivesScreen } from './components/screens/ArchivesScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { PricingScreen } from './components/screens/PricingScreen';
import { AdminCouponScreen } from './components/screens/AdminCouponScreen';

const MainApp: React.FC = () => {
  const { currentScreen } = useApp();

  // If on login screen
  if (currentScreen === 'login') {
    return (
      <div className="h-screen w-screen font-sans antialiased overflow-hidden select-none transition-colors duration-250 bg-app-theme text-theme-primary">
        <LoginScreen />
        <ToastContainer />
      </div>
    );
  }

  // If on dedicated Admin portal
  if (currentScreen === 'admin-coupons') {
    return (
      <div className="h-screen w-screen font-sans antialiased flex flex-col overflow-hidden transition-colors duration-250 bg-app-theme text-theme-primary">
        <AdminCouponScreen />
        <ToastContainer />
      </div>
    );
  }

  // Standard Application Layout with Sleek Interface
  return (
    <div className="h-screen w-screen font-sans antialiased flex overflow-hidden transition-colors duration-250 bg-app-theme text-theme-primary">
      {/* Sidebar (Desktop + Mobile drawer handled internally) */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden transition-colors duration-250 bg-app-theme">
        {/* Global Header */}
        <Header />

        {/* Dynamic Screen View with smooth crossfade transition */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex-1 flex flex-col h-full min-w-0 overflow-hidden"
            >
              {currentScreen === 'chat' && <ChatScreen />}
              {currentScreen === 'library' && <LibraryScreen />}
              {currentScreen === 'note-detail' && <NoteDetailScreen />}
              {currentScreen === 'files' && <FilesScreen />}
              {currentScreen === 'templates' && <TemplatesScreen />}
              {currentScreen === 'archives' && <ArchivesScreen />}
              {currentScreen === 'settings' && <SettingsScreen />}
              {currentScreen === 'pricing' && <PricingScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Forced Password Setup Modal for Google accounts */}
      <SetPasswordModal />
    </div>
  );
};

export function App() {
  return <MainApp />;
}

export default App;
