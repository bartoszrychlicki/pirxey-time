"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider } from "@/lib/auth/auth-context";
import { PermissionProvider } from "@/lib/rbac/rbac-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { seedIfEmpty } from "@/lib/seed";
import { getUserFromSession } from "@/lib/auth/mock-auth";

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await seedIfEmpty();
      const user = getUserFromSession();
      if (!user) {
        router.replace("/login");
        return;
      }
      setReady(true);
    };
    init();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Ladowanie...</div>
      </div>
    );
  }

  return (
    <PermissionProvider>
      <TooltipProvider delayDuration={300}>
        <AppShell>{children}</AppShell>
      </TooltipProvider>
    </PermissionProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardGuard>{children}</DashboardGuard>
    </AuthProvider>
  );
}
