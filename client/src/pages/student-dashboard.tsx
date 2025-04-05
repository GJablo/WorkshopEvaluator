import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Workshop } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";

type WorkshopWithStats = Workshop & {
  votingStats: {
    total: number;
    approved: number;
    declined: number;
  }
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: workshops, isLoading } = useQuery<WorkshopWithStats[]>({
    queryKey: ["/api/workshops"],
    select: (data) => data.filter(w => w.status === "pending"),
  });

  const voteMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      await apiRequest("POST", `/api/workshops/${id}/vote`, { approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops"] });
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
        <h1 className="text-3xl font-bold mb-6">Workshop Approval Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Review and vote on pending workshops. Your feedback helps lecturers make informed decisions.
        </p>

        <div className="space-y-6">
          {workshops?.map((workshop) => {
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
                  <p className="mb-6">{workshop.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
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

                  <div className="flex gap-4 justify-end">
                    <Button
                      onClick={() => voteMutation.mutate({ id: workshop.id, approved: true })}
                      disabled={voteMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve Workshop
                    </Button>
                    <Button
                      onClick={() => voteMutation.mutate({ id: workshop.id, approved: false })}
                      disabled={voteMutation.isPending}
                      variant="destructive"
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Decline Workshop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {workshops?.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No pending workshops to review at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
