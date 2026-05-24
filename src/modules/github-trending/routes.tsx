import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/protected-route';
import { MainLayout } from '@/components/layout';
import { TrendingPage } from './components/TrendingPage';
import { ProjectDetail } from './components/ProjectDetail';
import { CollectedProjects } from './components/CollectedProjects';
import { Settings } from './components/Settings';

export const routes = (
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<MainLayout />}>
      <Route path="github-trending" element={<TrendingPage />} />
      <Route path="github-trending/collected" element={<CollectedProjects />} />
      <Route path="github-trending/settings" element={<Settings />} />
      {/* :id must be last to avoid matching fixed paths */}
      <Route path="github-trending/:id" element={<ProjectDetail />} />
    </Route>
  </Route>
);
