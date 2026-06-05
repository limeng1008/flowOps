import { lazy } from 'react'

import Loadable from '@/ui-component/loading/Loadable'
import MinimalLayout from '@/layout/MinimalLayout'

// Public website pages (no auth, no console layout)
const PublicSite = Loadable(lazy(() => import('@/views/publicSite')))

// ==============================|| LANDING ROUTING ||============================== //

const LandingRoutes = {
    path: '/',
    element: <MinimalLayout />,
    children: [
        {
            index: true,
            element: <PublicSite page='home' />
        },
        {
            path: 'welcome',
            element: <PublicSite page='home' />
        },
        {
            path: 'docs',
            element: <PublicSite page='docs' />
        },
        {
            path: 'help',
            element: <PublicSite page='help' />
        }
    ]
}

export default LandingRoutes
