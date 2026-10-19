import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type {
  Category,
  CategoryWrite,
  DashboardOverview,
  DashboardRange,
  InboxList,
  InboxThread,
  InventoryItem,
  InventoryPatch,
  Order,
  Page,
  PaymentsSettings,
  Product,
  ProductListItem,
  ProductListQuery,
  ProductPatch,
  ProductVariant,
  ProductWrite,
  Session,
  StoreSettings,
  Tenant,
  VariantPatch,
} from "@/lib/api/types";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => apiRequest<Session>("/v1/auth/session"),
  });
}

export function useTenants() {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: () => apiRequest<{ data: Tenant[] }>("/v1/tenants"),
  });
}

export function useDashboard(tenantId: string, range: DashboardRange) {
  return useQuery({
    queryKey: ["dashboard", tenantId, range],
    queryFn: () =>
      apiRequest<DashboardOverview>("/v1/dashboard", {
        tenantId,
        query: { range },
      }),
  });
}

export function useProducts(tenantId: string, query: ProductListQuery) {
  return useQuery({
    queryKey: ["products", tenantId, query],
    queryFn: () =>
      apiRequest<Page<ProductListItem>>("/v1/products", {
        tenantId,
        query: { ...query },
      }),
  });
}

export function useProduct(tenantId: string, productId: string | undefined) {
  return useQuery({
    queryKey: ["product", tenantId, productId],
    enabled: Boolean(productId),
    queryFn: () => apiRequest<Product>(`/v1/products/${productId}`, { tenantId }),
  });
}

export function useCreateProduct(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductWrite) =>
      apiRequest<Product>("/v1/products", { method: "POST", tenantId, body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
    },
  });
}

export function useUpdateProduct(tenantId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductPatch) =>
      apiRequest<Product>(`/v1/products/${productId}`, { method: "PATCH", tenantId, body }),
    onSuccess: async (product) => {
      queryClient.setQueryData(["product", tenantId, productId], product);
      await queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
    },
  });
}

export function useUpdateVariant(tenantId: string, productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, body }: { variantId: string; body: VariantPatch }) =>
      apiRequest<ProductVariant>(`/v1/products/${productId}/variants/${variantId}`, {
        method: "PATCH",
        tenantId,
        body,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["product", tenantId, productId] });
      await queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
    },
  });
}

export function useDeleteProduct(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      apiRequest<void>(`/v1/products/${productId}`, { method: "DELETE", tenantId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["categories", tenantId] });
    },
  });
}

export function useInventory(tenantId: string, query: { q?: string; inventoryStatus?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["inventory", tenantId, query],
    queryFn: () =>
      apiRequest<Page<InventoryItem>>("/v1/inventory", { tenantId, query }),
  });
}

export function useUpdateInventory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, body }: { variantId: string; body: InventoryPatch }) =>
      apiRequest<InventoryItem>(`/v1/inventory/${variantId}`, { method: "PATCH", tenantId, body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
    },
  });
}

export function useCategories(tenantId: string) {
  return useQuery({
    queryKey: ["categories", tenantId],
    queryFn: () => apiRequest<{ data: Category[] }>("/v1/categories", { tenantId }),
  });
}

export function useCreateCategory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryWrite) =>
      apiRequest<Category>("/v1/categories", { method: "POST", tenantId, body }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories", tenantId] });
    },
  });
}

export function useDeleteCategory(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      apiRequest<void>(`/v1/categories/${categoryId}`, { method: "DELETE", tenantId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories", tenantId] });
      await queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
    },
  });
}

export function useOrders(tenantId: string, page = 1) {
  return useQuery({
    queryKey: ["orders", tenantId, page],
    queryFn: () =>
      apiRequest<Page<Order>>("/v1/orders", { tenantId, query: { page, pageSize: 10 } }),
  });
}

export function useInbox(tenantId: string) {
  return useQuery({
    queryKey: ["inbox", tenantId],
    queryFn: () => apiRequest<InboxList>("/v1/inbox", { tenantId }),
  });
}

export function useMarkThread(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, unread }: { threadId: string; unread: boolean }) =>
      apiRequest<InboxThread>(`/v1/inbox/${threadId}`, {
        method: "PATCH",
        tenantId,
        body: { unread },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inbox", tenantId] });
    },
  });
}

export function useStoreSettings(tenantId: string) {
  return useQuery({
    queryKey: ["store-settings", tenantId],
    queryFn: () => apiRequest<StoreSettings>("/v1/store-settings", { tenantId }),
  });
}

export function useUpdateStoreSettings(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<StoreSettings>) =>
      apiRequest<StoreSettings>("/v1/store-settings", { method: "PATCH", tenantId, body }),
    onSuccess: async (settings) => {
      queryClient.setQueryData(["store-settings", tenantId], settings);
      await queryClient.invalidateQueries({ queryKey: ["dashboard", tenantId] });
    },
  });
}

export function usePaymentsSettings(tenantId: string) {
  return useQuery({
    queryKey: ["payments-settings", tenantId],
    queryFn: () => apiRequest<PaymentsSettings>("/v1/payments-settings", { tenantId }),
  });
}

export function useUpdatePaymentsSettings(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<PaymentsSettings>) =>
      apiRequest<PaymentsSettings>("/v1/payments-settings", { method: "PATCH", tenantId, body }),
    onSuccess: (settings) => {
      queryClient.setQueryData(["payments-settings", tenantId], settings);
    },
  });
}
