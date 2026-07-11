import { createHashRouter, Navigate } from 'react-router-dom'
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
      { index: true, element: <Navigate to="/profile" replace /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'variants', element: <VariantsPage /> },
      { path: 'variant/:id', element: <VariantEditorPage /> },
      { path: '*', element: <Navigate to="/profile" replace /> },
    ],
  },
])
