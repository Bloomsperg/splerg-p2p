import React from 'react';
import { useRoutes, NavLink, useLocation } from 'react-router-dom';
import { routes, navItems } from '../routes';

export const Dashboard: React.FC<{}> = () => {
  const element = useRoutes(routes);
  const location = useLocation();
  const showTabs = !location.pathname.includes('/modify');

  return (
    <div className="flex flex-1 flex-col h-full w-full justify-between">
      {element}
      {showTabs && (
        <nav className="tabs tabs-lift tabs-lg justify-end border-t border-t-sunset/50 bg-base-200">
          {navItems.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `tab tab-lg ${isActive ? 'tab-active text-sunset' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
};
