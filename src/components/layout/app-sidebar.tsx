import { Link, useLocation } from "react-router-dom";
import {
  ChevronDownIcon,
  CreditCardIcon,
  HomeIcon,
  InboxIcon,
  PackageIcon,
  PlusIcon,
  SettingsIcon,
  ShoppingBagIcon,
  TagsIcon,
  WarehouseIcon,
} from "lucide-react";
import { LoomMark } from "@/components/brand/loom-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useTenant } from "@/app/tenant-context";
import { useDashboard, useInbox } from "@/lib/api/hooks";
import { isSection, tenantPath } from "@/lib/paths";

export function AppSidebar() {
  const { tenant } = useTenant();
  const { pathname } = useLocation();
  const dashboard = useDashboard(tenant.id, "today");
  const inbox = useInbox(tenant.id);
  const setup = dashboard.data?.setup ?? { completed: 2, total: 8 };
  const unread = inbox.data?.unreadCount ?? 0;
  const home = tenantPath(tenant.slug);
  const products = tenantPath(tenant.slug, "products");
  const settings = tenantPath(tenant.slug, "settings");

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="gap-3 p-3">
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LoomMark />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-base font-semibold">Loom</p>
            <p className="truncate text-xs text-muted-foreground">
              Setup {setup.completed} of {setup.total} tasks
            </p>
          </div>
        </div>
        <Progress value={(setup.completed / setup.total) * 100} aria-label="Sample setup progress" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button className="w-full justify-between" />}
          >
            <PlusIcon data-icon="inline-start" />
            Quick actions
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to={tenantPath(tenant.slug, "products/new")} />}>
                New product
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to={tenantPath(tenant.slug, "inventory")} />}>
                Inventory
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to={settings} />}>
                Store settings
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to={tenantPath(tenant.slug, "settings/payments")} />}>
                Accept payments
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to={home} />}
                isActive={isSection(pathname, home, true)}
                size="lg"
              >
                <HomeIcon />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to={tenantPath(tenant.slug, "orders")} />}
                isActive={isSection(pathname, tenantPath(tenant.slug, "orders"))}
                size="lg"
              >
                <ShoppingBagIcon />
                <span>Orders</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to={products} />}
                isActive={isSection(pathname, products)}
                size="lg"
              >
                <PackageIcon />
                <span>Products</span>
              </SidebarMenuButton>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    render={<Link to={tenantPath(tenant.slug, "inventory")} />}
                    isActive={isSection(pathname, tenantPath(tenant.slug, "inventory"))}
                    className="h-11"
                  >
                    <WarehouseIcon />
                    <span>Inventory</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    render={<Link to={tenantPath(tenant.slug, "categories")} />}
                    isActive={isSection(pathname, tenantPath(tenant.slug, "categories"))}
                    className="h-11"
                  >
                    <TagsIcon />
                    <span>Categories</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link to={tenantPath(tenant.slug, "inbox")} />}
                isActive={isSection(pathname, tenantPath(tenant.slug, "inbox"))}
                size="lg"
              >
                <InboxIcon />
                <span>Inbox</span>
                {unread > 0 ? (
                  <Badge className="ml-auto" aria-label={`${unread} unread`}>
                    {unread}
                  </Badge>
                ) : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-2 p-3">
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to={settings} />} isActive={isSection(pathname, settings)} size="lg">
              <SettingsIcon />
              <span>Settings</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  render={<Link to={settings} />}
                  isActive={pathname === settings}
                  className="h-11"
                >
                  <SettingsIcon />
                  <span>Store settings</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  render={<Link to={tenantPath(tenant.slug, "settings/payments")} />}
                  isActive={isSection(pathname, tenantPath(tenant.slug, "settings/payments"))}
                  className="h-11"
                >
                  <CreditCardIcon />
                  <span>Accept payments</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm">
          <span className="size-2 rounded-full bg-positive" aria-hidden="true" />
          <span className="text-muted-foreground">Sample catalog</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
