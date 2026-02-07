import { useState } from 'react';
import { useUserStore } from './store';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Register } from './pages/Register';
import { Matching } from './pages/Matching';
import { Chat } from './pages/Chat';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const { id, status } = useUserStore();
  const [started, setStarted] = useState(false);

  // Routing Logic
  let Component;
  if (!started && !id) {
    Component = <Landing onStart={() => setStarted(true)} />;
  } else if (!id) {
    Component = <Register />;
  } else if (status === 'matching') {
    Component = <Matching />;
  } else if (status === 'matched') {
    Component = <Chat />;
  } else {
    // Default fallback (idle state)
    Component = <Matching />;
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={status || (started ? 'register' : 'landing')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {Component}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
