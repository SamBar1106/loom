import { useState } from "react";
import { toast } from "sonner";
import { useTenant } from "@/app/tenant-context";
import { PageSkeleton, QueryError } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/lib/api/hooks";
import { ApiError } from "@/lib/api/client";
import { usePageTitle } from "@/pages/use-page-title";

export function CategoriesPage() {
  const { tenant } = useTenant();
  const categories = useCategories(tenant.id);
  const create = useCreateCategory(tenant.id);
  const remove = useDeleteCategory(tenant.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  usePageTitle("Categories");

  return (
    <div className="flex flex-col gap-4" data-page="categories">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">Categories</h1>
          <p className="text-muted-foreground">Groups used by this tenant’s sample catalog.</p>
        </div>
        <Button
          onClick={() => {
            setName("");
            setError("");
            setOpen(true);
          }}
        >
          Add category
        </Button>
      </div>
      {categories.isLoading ? <PageSkeleton /> : null}
      {categories.error ? <QueryError error={categories.error} /> : null}
      {categories.data ? (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Products</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.data.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.productCount}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      disabled={remove.isPending}
                      onClick={() =>
                        remove.mutate(category.id, {
                          onSuccess: () => toast.success(`${category.name} removed.`),
                        })
                      }
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
            <DialogDescription>The category is stored for this tenant only.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="category-name">Name</FieldLabel>
              <Input
                id="category-name"
                value={name}
                aria-invalid={Boolean(error)}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={create.isPending}
              onClick={() => {
                create.mutate(
                  { name: name.trim() },
                  {
                    onSuccess: () => {
                      toast.success("Category added.");
                      setOpen(false);
                    },
                    onError: (mutationError) => {
                      setError(mutationError instanceof ApiError ? mutationError.message : "Could not add the category.");
                    },
                  },
                );
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
