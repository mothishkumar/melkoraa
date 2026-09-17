import { Outlet } from "react-router-dom";

import { BrandMark } from "@/components/layout/brand-mark";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-off-white">
      <header className="px-4 py-8 md:px-8">
        <BrandMark />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-16 md:px-8">
        <Outlet />
      </div>
    </div>
  );
}
