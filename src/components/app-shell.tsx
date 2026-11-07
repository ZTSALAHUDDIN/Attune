import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { BookOpen, ChartNoAxesColumn, Layers, LayoutDashboard, LogOut, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearning } from '@/lib/learning';
import { supabase } from '@/integrations/supabase/client';
import type { ReactNode } from 'react';

const nav = [
  { to: '/dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/study' as const, label: 'Study', icon: BookOpen },
  { to: '/review' as const, label: 'Review', icon: Layers },
  { to: '/history' as const, label: 'History', icon: ChartNoAxesColumn },
  { to: '/settings' as const, label: 'Settings', icon: Settings },
];
export function Brand() { return <span className="inline-flex items-center gap-2.5 font-display text-lg font-extrabold text-foreground"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles size={19} strokeWidth={2.2}/></span> attune<span className="text-primary">.</span></span>; }
export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useLearning();
  const navigate = useNavigate();
  const path = useRouterState({ select: s => s.location.pathname });
  return <div className="min-h-screen bg-background md:flex">
    <aside className="hidden w-61 shrink-0 flex-col border-r bg-sidebar px-4 py-7 md:flex md:sticky md:top-0 md:h-screen">
      <Link to="/dashboard" className="px-4"><Brand /></Link>
      <div className="mt-14 px-4 text-[11px] font-bold uppercase text-muted-foreground">Workspace</div>
      <nav className="mt-4 grid gap-1">{nav.map(item => <Link key={item.to} to={item.to} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${path === item.to ? 'bg-sidebar-accent text-sidebar-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><item.icon size={18}/>{item.label}</Link>)}</nav>
      <div className="mt-auto border-t pt-5"><div className="flex items-center gap-3 px-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-primary">{user?.email?.[0]?.toUpperCase() ?? 'S'}</span><span className="min-w-0 flex-1 truncate text-xs font-medium">{user?.email}</span><Button variant="ghost" size="icon" aria-label="Log out" title="Log out" onClick={async () => { await supabase.auth.signOut(); navigate({ to: '/' }); }}><LogOut size={16}/></Button></div></div>
    </aside>
    <div className="min-w-0 flex-1 pb-18 md:pb-0"><header className="flex items-center justify-between border-b bg-card px-5 py-4 md:hidden"><Link to="/dashboard"><Brand /></Link><span className="text-xs text-muted-foreground">Your study space</span></header><main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-10 md:py-10">{children}</main></div>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card px-2 pb-[env(safe-area-inset-bottom)] md:hidden">{nav.map(item => <Link key={item.to} to={item.to} className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] ${path === item.to ? 'text-primary' : 'text-muted-foreground'}`}><item.icon size={19}/>{item.label}</Link>)}</nav>
  </div>;
}
export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div>{eyebrow && <p className="mb-2 text-xs font-bold uppercase text-primary">{eyebrow}</p>}<h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h1>{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}</div>{action}</div>; }
export function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail?: string; icon: typeof BookOpen }) { return <div className="rounded-lg border bg-card p-5 surface-shadow"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon size={18} className="text-primary"/></div><div className="mt-5 font-display text-3xl font-bold">{value}</div>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>; }
