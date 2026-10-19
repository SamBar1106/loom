import { useState } from "react";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInbox, useMarkThread } from "@/lib/api/hooks";
import { formatRelative } from "@/lib/format";
import { usePageTitle } from "@/pages/use-page-title";

export function InboxPage() {
  const { tenant } = useTenant();
  const inbox = useInbox(tenant.id);
  const mark = useMarkThread(tenant.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  usePageTitle("Inbox");

  const selected = inbox.data?.data.find((thread) => thread.id === selectedId) ?? inbox.data?.data[0];

  return (
    <div className="flex flex-col gap-4" data-page="inbox">
      <div className="flex items-center gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Inbox</h1>
        {inbox.data ? <Badge variant="secondary">{inbox.data.unreadCount} unread</Badge> : null}
      </div>
      {inbox.isLoading ? <PageSkeleton /> : null}
      {inbox.error ? <QueryError error={inbox.error} /> : null}
      {inbox.data ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            {inbox.data.data.map((thread) => (
              <Button
                key={thread.id}
                variant={thread.id === selected?.id ? "secondary" : "outline"}
                className="h-auto min-h-11 w-full justify-start px-3 py-2 text-left"
                onClick={() => {
                  setSelectedId(thread.id);
                  if (thread.unread) mark.mutate({ threadId: thread.id, unread: false });
                }}
              >
                <span className="flex min-w-0 flex-col items-start gap-0.5">
                  <span className="truncate font-medium">{thread.subject}</span>
                  <span className="truncate text-xs text-muted-foreground">{thread.fromName}</span>
                </span>
                {thread.unread ? <Badge className="ml-auto">New</Badge> : null}
              </Button>
            ))}
          </div>
          {selected ? (
            <Card>
              <CardHeader>
                <CardTitle>{selected.subject}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selected.fromName} · {formatRelative(selected.receivedAt)}
                </p>
              </CardHeader>
              <CardContent>
                <p>{selected.preview}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
