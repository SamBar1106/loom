import { useState } from "react";
import { Link } from "react-router-dom";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventory, useUpdateInventory } from "@/lib/api/hooks";
import type { InventoryStatus } from "@/lib/api/types";
import { inventoryLabel } from "@/lib/inventory";
import { tenantPath } from "@/lib/paths";
import { usePageTitle } from "@/pages/use-page-title";

function stockVariant(status: InventoryStatus): "positive" | "warning" | "destructive" {
  switch (status) {
    case "in_stock":
      return "positive";
    case "low_stock":
      return "warning";
    case "out_of_stock":
      return "destructive";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function InventoryPage() {
  const { tenant } = useTenant();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | InventoryStatus>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const inventory = useInventory(tenant.id, {
    q,
    inventoryStatus: status === "all" ? "" : status,
    page: 1,
    pageSize: 50,
  });
  const update = useUpdateInventory(tenant.id);
  usePageTitle("Inventory");

  return (
    <div className="flex flex-col gap-4" data-page="inventory">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Inventory</h1>
        <p className="text-muted-foreground">On-hand counts for this tenant. Reserved units stay unchanged.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <InputGroup className="sm:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search inventory"
            placeholder="Search by product or SKU"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </InputGroup>
        <Select
          value={status}
          onValueChange={(value) => {
            if (value === "all" || value === "in_stock" || value === "low_stock" || value === "out_of_stock") {
              setStatus(value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Inventory status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="in_stock">In stock</SelectItem>
              <SelectItem value="low_stock">Low stock</SelectItem>
              <SelectItem value="out_of_stock">Out of stock</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {inventory.isLoading ? <PageSkeleton /> : null}
      {inventory.error ? <QueryError error={inventory.error} /> : null}
      {inventory.data ? (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>On hand</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.data.data.map((item) => {
                const draft = drafts[item.variantId] ?? String(item.onHand);
                const changed = draft !== String(item.onHand);
                return (
                  <TableRow key={item.variantId}>
                    <TableCell>
                      <Link className="font-medium" to={tenantPath(tenant.slug, `products/${item.productId}`)}>
                        {item.productTitle}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
                    </TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>
                      <Input
                        aria-label={`On hand for ${item.productTitle} ${item.variantTitle}`}
                        className="w-24"
                        inputMode="numeric"
                        value={draft}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [item.variantId]: event.target.value }))
                        }
                      />
                    </TableCell>
                    <TableCell>{item.reserved}</TableCell>
                    <TableCell>
                      <Badge variant={stockVariant(item.status)}>{inventoryLabel(item.status, item.available)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        disabled={!changed || update.isPending}
                        onClick={() => {
                          const onHand = Number(draft);
                          if (!Number.isInteger(onHand) || onHand < 0) {
                            toast.error("On hand must be a whole number.");
                            return;
                          }
                          update.mutate(
                            { variantId: item.variantId, body: { onHand } },
                            {
                              onSuccess: () => {
                                toast.success("Inventory updated.");
                                setDrafts((current) => {
                                  const next = { ...current };
                                  delete next[item.variantId];
                                  return next;
                                });
                              },
                            },
                          );
                        }}
                      >
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
