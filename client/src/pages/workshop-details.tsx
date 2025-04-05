import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Workshop } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

type WorkshopWithStats = Workshop & {
  votingStats: {
    total: number;
    approved: number;
    declined: number;
  }
};

export default function WorkshopDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: workshop, isLoading } = useQuery<WorkshopWithStats>({
    queryKey: ["/api/workshops", id],
  });

  const voteMutation = useMutation({
    mutationFn: async (approved: boolean) => {
      await apiRequest("POST", `/api/workshops/${id}/vote`, { approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops", id] });
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

  if (!workshop) return null;

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{workshop.title}</CardTitle>
            <div className="text-muted-foreground">
              {formattedDate}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{workshop.description}</p>
            <div className="flex items-center gap-2 mb-6">
              <span className="font-semibold">Status:</span>
              <span className={`capitalize ${
                workshop.status === "approved" ? "text-green-600" :
                workshop.status === "rejected" ? "text-red-600" :
                "text-yellow-600"
              }`}>
                {workshop.status}
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Student Votes</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {workshop.votingStats.approved}
                      </div>
                      <div className="text-sm text-muted-foreground">Approved</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {workshop.votingStats.declined}
                      </div>
                      <div className="text-sm text-muted-foreground">Declined</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {user?.role === "student" && workshop.status === "pending" && (
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => voteMutation.mutate(true)}
                    disabled={voteMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve Workshop
                  </Button>
                  <Button
                    onClick={() => voteMutation.mutate(false)}
                    disabled={voteMutation.isPending}
                    variant="destructive"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Decline Workshop
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}