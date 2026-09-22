import { createHashRouter, Navigate, redirect } from 'react-router-dom'
import { startPath } from './store/useStartPage'
import { Layout } from './components/Layout'
import { ProfilePage } from './pages/ProfilePage'
import { VariantsPage } from './pages/VariantsPage'
import { VariantEditorPage } from './pages/VariantEditorPage'

// HashRouter keeps deep links working when the app is opened from the
// filesystem or served statically without server-side routing config.
export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // `/` goes wherever the start-page setting points. A loader, not a
      // component, so it is re-evaluated on every visit rather than once.
      { index: true, loader: () => redirect(startPath()) },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'variants', element: <VariantsPage /> },
      { path: 'variant/:id', element: <VariantEditorPage /> },
      // A path that matches nothing always lands on the profile, whatever the
      // start-page setting says - a bad URL should not be able to bounce.
      { path: '*', element: <Navigate to="/profile" replace /> },
    ],
  },
])
