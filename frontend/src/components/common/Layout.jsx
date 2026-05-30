import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto min-h-[calc(100vh-60px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
