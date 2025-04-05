import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workshop } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";

interface WorkshopCardProps {
  workshop: Workshop & {
    votingStats?: {
      total: number;
      approved: number;
      declined: number;
    };
  };
}

export default function WorkshopCard({ workshop }: WorkshopCardProps) {
  // Safely format the date
  const formattedDate = (() => {
    try {
      // Parse the date directly since it's already a Date object from the database
      return format(new Date(workshop.date), "PPP 'at' pp");
    } catch (e) {
      console.error("Date parsing error:", e);
      return "Invalid date";
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{workshop.title}</CardTitle>
        <div className="text-sm text-muted-foreground">{formattedDate}</div>
      </CardHeader>
      <CardContent>
        <p className="text-sm line-clamp-3 mb-4">{workshop.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-medium ${
                workshop.status === "approved"
                  ? "text-green-600"
                  : workshop.status === "rejected"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {workshop.status}
            </span>
            {workshop.votingStats && (
              <span className="text-sm text-muted-foreground">
                ({workshop.votingStats.approved} approved,{" "}
                {workshop.votingStats.declined} declined)
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
