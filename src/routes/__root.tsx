import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
//import { ModeToggle } from "@/components/shared/ModeToggle";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ClerkAndThemeProvider } from "../main";
import { NotFound } from "@/components/shared/NotFound";
import { useEffect } from "react";
import { useAuthProtection } from "@/utils/authUtils";

export const Route = createRootRoute({
  component: LandingRoot,
  notFoundComponent: NotFound,
});

function LandingRoot() {
  const { location } = useRouterState();
  
  // Explicitly scroll to top on route change
  useEffect(() => {
    // Try targeting documentElement and window, ensuring instant scroll
    document.documentElement.scrollTo({ top: 0, behavior: 'instant' }); 
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <ClerkAndThemeProvider>
      <AuthProtector />
      <div className={`min-h-screen`}>
        {/* Simple floating header - Conditionally rendered */}

        
        <main>
          <Outlet />
        </main>
        
        {/* Footer - Conditionally rendered */}
        {/* <TanStackRouterDevtools /> */}
      </div>
    </ClerkAndThemeProvider>
  );
}

// Separate component to use the auth hook inside the Clerk context
function AuthProtector() {
  useAuthProtection();
  return null;
} 