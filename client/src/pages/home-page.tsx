import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Workshop } from "@shared/schema";
import WorkshopCard from "@/components/workshop-card";
import CreateWorkshopDialog from "@/components/create-workshop-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, Loader2 } from "lucide-react";

type WorkshopWithStats = Workshop & {
  votingStats: {
    total: number;
    approved: number;
    declined: number;
  }
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { data: workshops, isLoading } = useQuery<WorkshopWithStats[]>({ 
    queryKey: ["/api/workshops"]
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workshop Feedback Platform</h1>
          <p className="text-muted-foreground">
            Welcome, {user?.username} ({user?.role})
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === "lecturer" && (
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          )}
          {user?.role === "student" && (
            <Link href="/student-dashboard">
              <Button variant="outline">Review Workshops</Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={() => logoutMutation.mutate()}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Available Workshops</h2>
          {user?.role === "lecturer" && <CreateWorkshopDialog />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops?.map((workshop) => (
            <WorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>
      </main>
    </div>
  );
}