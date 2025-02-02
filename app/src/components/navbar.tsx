import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React from 'react';

const AnimatedBanner = () => (
  <div className="banner-container">
    <div className="banner-content">
      <div className="animated-text">
        <span className="text-sunset">$SPERG</span>: 0.0037
      </div>
    </div>
  </div>
);

export const Navbar: React.FC<{}> = () => {
  return (
    <div className="flex flex-col border-b border-b-sunset/50">
      <div className="drawer z-10">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Navbar */}
          <div className="navbar w-full">
            <div className="flex-none lg:hidden">
              <label
                htmlFor="my-drawer-3"
                aria-label="open sidebar"
                className="btn btn-square btn-ghost"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-6 w-6 stroke-current text-sunset"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </label>
            </div>
            <div className="text-xl mx-2 flex-1 px-2 text-right md:text-left">
              BloomSplerg
            </div>
            <div className="hidden flex-none lg:block">
              <ul className="menu menu-horizontal items-center">
                {/* Navbar menu content here */}
                <li className="text-lg">
                  <a>orders</a>
                </li>
                <li className="text-lg">
                  <a>terminal</a>
                </li>
                <li className="text-lg">
                  <a>rpc</a>
                </li>
                <li className="text-lg">
                  <WalletMultiButton />
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="drawer-side">
          <label
            htmlFor="my-drawer-3"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <ul className="menu bg-base-200 min-h-full w-80 p-4">
            {/* Sidebar content here */}
            <li className="py-2 text-lg">
              <a>orders</a>
            </li>
            <li className="py-2 text-lg">
              <a>terminal</a>
            </li>
            <li className="py-2 text-lg">
              <a>rpc</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Banner space - you can replace this div with your banner component */}
      <AnimatedBanner />
    </div>
  );
};
