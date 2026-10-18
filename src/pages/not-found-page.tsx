import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export function NotFoundPage() {
  return (
    <Empty className="min-h-80">
      <EmptyHeader>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>That Loom admin page is not part of this sample.</EmptyDescription>
      </EmptyHeader>
      <Button render={<Link to="/t/daykodee" />} nativeButton={false}>
        Back to Daykodee
      </Button>
    </Empty>
  );
}
