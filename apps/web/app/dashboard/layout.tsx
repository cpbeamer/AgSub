import Link from 'next/link';
import { 
  BarChart3, 
  FileText, 
  Home, 
  Landmark, 
  Map, 
  Satellite, 
  Settings, 
  Tractor,
  Users,
  DollarSign,
  ClipboardCheck
} from 'lucide-react';

const sidebarItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/farms', label: 'Farm Profile', icon: Map },
  { href: '/dashboard/programs', label: 'Programs', icon: Landmark },
  { href: '/dashboard/applications', label: 'Applications', icon: FileText },
  { href: '/dashboard/compliance', label: 'Compliance', icon: Satellite },
  { href: '/dashboard/payments', label: 'Payments', icon: DollarSign },
  { href: '/dashboard/audit', label: 'Audit Log', icon: ClipboardCheck },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r bg-card">
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Tractor className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">AgSub</span>
          </Link>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}