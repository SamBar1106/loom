import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BellIcon, CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/app/tenant-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useDashboard, useInbox } from "@/lib/api/hooks";
import { formatRelative } from "@/lib/format";
import { tenantPath } from "@/lib/paths";

export function TopBar() {
  const { tenant, tenants, user } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }
  const inbox = useInbox(tenant.id);
  const dashboard = useDashboard(tenant.id, "today");

  function switchTenant(slug: string) {
    if (slug === tenant.slug) return;
    const rest = location.pathname.replace(`/t/${tenant.slug}`, "");
    const parts = rest.split("/").filter(Boolean);
    const section = parts[0] ?? "";
    let next = tenantPath(slug, section);
    if (section === "products" && parts.length > 1) next = tenantPath(slug, "products");
    if (section === "settings" && parts[1] === "payments") next = tenantPath(slug, "settings/payments");
    navigate(next);
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    const target = trimmed
      ? `${tenantPath(tenant.slug, "products")}?q=${encodeURIComponent(trimmed)}`
      : tenantPath(tenant.slug, "products");
    navigate(target);
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b bg-card px-3 md:gap-3 md:px-4">
      <SidebarTrigger className="size-11 md:hidden" size="icon" />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="max-w-56 justify-between px-3" />
          }
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
            {tenant.initials}
          </span>
          <span className="truncate">{tenant.name}</span>
          <ChevronDownIcon data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {tenants.map((item) => (
              <DropdownMenuItem key={item.id} onClick={() => switchTenant(item.slug)}>
                <span className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-medium">
                  {item.initials}
                </span>
                <span className="flex-1">{item.name}</span>
                {item.id === tenant.id ? <CheckIcon /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <form onSubmit={onSearch} className="mx-auto hidden min-w-0 flex-1 md:block md:max-w-xl">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search products, orders, and customers"
            placeholder="Search products, orders, and customers"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
      </form>
      <div className="ml-auto flex items-center gap-1">
        <Popover>
          <PopoverTrigger
            render={<Button variant="ghost" size="icon" aria-label="Notifications" />}
          >
            <BellIcon />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <PopoverTitle>Sample notifications</PopoverTitle>
            <div className="mt-3 flex flex-col gap-3">
              {(dashboard.data?.activity ?? []).slice(0, 3).map((item) => (
                <div key={item.id} className="flex flex-col gap-0.5">
                  <p className="text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(item.occurredAt)}</p>
                </div>
              ))}
              {inbox.data && inbox.data.unreadCount > 0 ? (
                <Button variant="outline" render={<Link to={tenantPath(tenant.slug, "inbox")} />} nativeButton={false}>
                  Open inbox
                </Button>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="px-2" />}
          >
            <Avatar className="size-8">
              <AvatarFallback>{user.avatarInitials}</AvatarFallback>
            </Avatar>
            <span className="hidden lg:inline">{user.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="block text-foreground">{user.name}</span>
                <span className="block font-normal text-muted-foreground">{user.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => toast("This sample session stays signed in.")}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
