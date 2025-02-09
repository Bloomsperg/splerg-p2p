import React from 'react';

// const AnimatedBanner = () => (
//   <div className="banner-container">
//     <div className="banner-content">
//       <div className="animated-text">
//         <span className="text-sunset">$SPERG</span>: 0.0037
//       </div>
//     </div>
//   </div>
// );

export const Navbar: React.FC<{}> = () => {
  return (
    <div className="flex flex-col border-b border-b-sunset/50">
      <div className="drawer z-10">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <div className="navbar w-full">
            <div className="text-xl mx-2 flex-1 px-2 text-right md:text-left">
              BloomSplerg
            </div>
          </div>
        </div>
      </div>

      {/* Banner space - you can replace this div with your banner component */}
      {/* <AnimatedBanner /> */}
    </div>
  );
};
