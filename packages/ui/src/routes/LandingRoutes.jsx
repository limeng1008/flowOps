import { lazy } from 'react'

import Loadable from '@/ui-component/loading/Loadable'

// Public marketing landing page (no auth, no layout wrapper)
const LandingPage = Loadable(lazy(() => import('@/views/landing')))

// ==============================|| LANDING ROUTING ||============================== //

const LandingRoutes = {
    path: '/welcome',
    element: <LandingPage />
}

export default LandingRoutes
