export type ShopSetupId = "name" | "product" | "stripe" | "link";

export type ShopSetupFacts = {
  storeName: string;
  productCount: number;
  stripeAccountId: string | null;
  publicProductCount: number;
};

export type ShopSetupStep = {
  id: ShopSetupId;
  label: string;
  done: boolean;
};

const labels: Record<ShopSetupId, string> = {
  name: "Name your shop",
  product: "Add first product",
  stripe: "Connect Stripe payments",
  link: "View your public shop link",
};

function stripeConnected(accountId: string | null): boolean {
  return (accountId ?? "").trim().length > 0;
}

export function shopSetupSteps(facts: ShopSetupFacts): ShopSetupStep[] {
  const done: Record<ShopSetupId, boolean> = {
    name: facts.storeName.trim().length > 0,
    product: facts.productCount > 0,
    stripe: stripeConnected(facts.stripeAccountId),
    link: facts.publicProductCount > 0,
  };
  const ids: ShopSetupId[] = ["name", "product", "stripe", "link"];
  return ids.map((id) => ({ id, label: labels[id], done: done[id] }));
}

export function shopSetupProgress(steps: ShopSetupStep[]): { completed: number; total: number } {
  return {
    completed: steps.filter((step) => step.done).length,
    total: steps.length,
  };
}

const DISMISS_KEY = "loom.onboarding.dismissed";

function readDismissedIds(storage: Storage): string[] {
  const raw = storage.getItem(DISMISS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function isShopSetupDismissed(tenantId: string, storage: Storage): boolean {
  return readDismissedIds(storage).includes(tenantId);
}

export function dismissShopSetup(tenantId: string, storage: Storage): void {
  const ids = readDismissedIds(storage);
  if (ids.includes(tenantId)) return;
  storage.setItem(DISMISS_KEY, JSON.stringify([...ids, tenantId]));
}
