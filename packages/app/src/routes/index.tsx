// src/routes/index.tsx
import { Navigate, RouteObject } from 'react-router-dom';
import { TradesView } from '../views/trades';
import { UserView } from '../views/user';
import { HomeIcon } from '../components/ui/icons';
import { Swap } from '../views/swap';
import { ModifyView } from '../views/modify';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/swap" replace />,
  },
  {
    path: '/trades',
    element: <TradesView />,
    handle: {
      label: 'trade',
    },
  },
  {
    path: '/swap',
    element: <Swap />,
    handle: {
      label: 'swap',
    },
  },
  {
    path: '/requests',
    element: <UserView />,
    handle: {
      label: <HomeIcon />,
    },
  },
  {
    path: '/modify/:orderId',
    element: <ModifyView />,
    handle: {
      label: null,
    },
  },
];

export const navItems = routes
  .filter((route) => route.handle?.label)
  .map((route) => ({
    path: route.path!,
    label: route.handle?.label,
  }));
