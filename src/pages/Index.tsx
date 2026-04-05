import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AuthLogo } from "@/components/AuthLogo";

export default function Index() {
  const { user, signOut } = useAuth();

  return (
    <div className="dark min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <AuthLogo />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center px-6 py-24">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome to Arcory Tax Intelligence
        </h2>
        <p className="mt-2 text-muted-foreground">
          Your financial management dashboard is ready.
        </p>
      </main>
    </div>
  );
}
