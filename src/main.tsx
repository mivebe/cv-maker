import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { watchSystemAppearance } from './store/useAppearance'
import { useAi } from './store/useAi'
import { completeOpenRouterConnect } from './lib/ai/openrouterAuth'
import './index.css'

watchSystemAppearance()

// Coming back from OpenRouter's Connect page: trade the code for a key and
// reopen the assistant where the visitor left it.
completeOpenRouterConnect()
  .then((key) => {
    if (!key) return
    useAi.getState().connect('openrouter', key)
    useAi.getState().setOpen(true)
  })
  .catch((err: Error) => {
    useAi.getState().setSetupError(err.message)
    useAi.getState().setOpen(true)
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
