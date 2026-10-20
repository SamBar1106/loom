import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export function NotFoundPage() {
  const { tenantSlug } = useParams();
  return (
    <Empty className="min-h-80">
      <EmptyHeader>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>That Loom admin page does not exist.</EmptyDescription>
      </EmptyHeader>
      <Button render={<Link to={tenantSlug ? `/t/${tenantSlug}` : "/"} />} nativeButton={false}>
        Back to dashboard
      </Button>
    </Empty>
  );
}
