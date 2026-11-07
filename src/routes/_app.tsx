import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router';
import { AppShell } from '@/components/app-shell';
import { useLearning } from '@/lib/learning';
export const Route = createFileRoute('/_app')({ component: Layout });
function Layout() { const { user, loading } = useLearning(); if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Opening your study space…</div>; if (!user) return <Navigate to="/auth" search={{ mode: 'login' }} />; return <AppShell><Outlet /></AppShell>; }
