import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFeedbackSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StarRating from "./star-rating";

interface FeedbackFormProps {
  workshopId: number;
}

export default function FeedbackForm({ workshopId }: FeedbackFormProps) {
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      rating: 0,
      comment: "",
    },
    resolver: zodResolver(insertFeedbackSchema),
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      await apiRequest("POST", `/api/workshops/${workshopId}/feedback`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshops", workshopId, "feedback"] });
      form.reset();
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => feedbackMutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <StarRating
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={feedbackMutation.isPending}>
          Submit Feedback
        </Button>
      </form>
    </Form>
  );
}
