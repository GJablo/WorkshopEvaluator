import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Workshop } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

type WorkshopWithStats = Workshop & {
  votingStats: {
    total: number;
    approved: number;
    declined: number;
  }
};

export default function LecturerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: workshops, isLoading } = useQuery<WorkshopWithStats[]>({
    queryKey: ["/api/workshops"],
    select: (data) => data.filter(w => w.lecturerId === user?.id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Workshop["status"] }) => {
      await apiRequest("PATCH", `/api/workshops/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({
        title: "Success",
        description: "Workshop status updated",
      });
    },
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Lecturer Dashboard</h1>

        <div className="space-y-4">
          {workshops?.map((workshop) => {
            // Safely format the date
            const formattedDate = (() => {
              try {
                return format(new Date(workshop.date), "PPP 'at' pp");
              } catch (e) {
                console.error("Date parsing error:", e);
                return "Invalid date";
              }
            })();

            return (
              <Card key={workshop.id}>
                <CardHeader>
                  <CardTitle>{workshop.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {formattedDate}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{workshop.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {workshop.votingStats.approved}
                          </div>
                          <div className="text-sm text-muted-foreground">Students Approved</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {workshop.votingStats.declined}
                          </div>
                          <div className="text-sm text-muted-foreground">Students Declined</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${
                      workshop.status === "approved" ? "text-green-600" :
                      workshop.status === "rejected" ? "text-red-600" :
                      "text-yellow-600"
                    }`}>
                      Status: {workshop.status}
                    </span>
                    {workshop.status === "pending" && (
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ 
                            id: workshop.id, 
                            status: "approved" 
                          })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ 
                            id: workshop.id, 
                            status: "rejected" 
                          })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}