// App.tsx — Root application component with React Router and TanStack Query setup.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { AgentsPage } from './pages/AgentsPage';
import { ToolsPage } from './pages/ToolsPage';
import { CrewPage } from './pages/CrewPage';
import { LangChainPage } from './pages/LangChainPage';
import { LlamaIndexPage } from './pages/LlamaIndexPage';
import { RAGPage } from './pages/RAGPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { TimelinePage } from './pages/TimelinePage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

// Create a TanStack Query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data stays fresh for 30s
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/crew" element={<CrewPage />} />
            <Route path="/langchain" element={<LangChainPage />} />
            <Route path="/llamaindex" element={<LlamaIndexPage />} />
            <Route path="/rag" element={<RAGPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
