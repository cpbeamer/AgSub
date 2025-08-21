'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const stats = {
    totalOpportunity: 45600,
    activePrograms: 4,
    pendingApplications: 2,
    upcomingPayments: 12500,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'application',
      title: 'EQIP Application Submitted',
      date: '2025-01-15',
      status: 'success',
    },
    {
      id: 2,
      type: 'compliance',
      title: 'Cover Crop Verification',
      date: '2025-01-14',
      status: 'warning',
    },
    {
      id: 3,
      type: 'payment',
      title: 'CSP Payment Received',
      date: '2025-01-10',
      amount: 2500,
      status: 'success',
    },
  ];

  const upcomingDeadlines = [
    {
      id: 1,
      program: 'EQIP 2025',
      deadline: '2025-02-15',
      action: 'Submit Final Report',
    },
    {
      id: 2,
      program: 'CSP',
      deadline: '2025-03-01',
      action: 'Annual Compliance Review',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your subsidy overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Opportunity
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalOpportunity)}
            </div>
            <p className="text-xs text-muted-foreground">
              +20% from last year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Programs
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePrograms}</div>
            <p className="text-xs text-muted-foreground">
              2 applications pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Applications
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              Review required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Payments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.upcomingPayments)}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest program activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(activity.date)}
                      {activity.amount && ` • ${formatCurrency(activity.amount)}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Don't miss these important dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="space-y-1">
                  <p className="text-sm font-medium">{deadline.program}</p>
                  <p className="text-xs text-muted-foreground">
                    {deadline.action}
                  </p>
                  <p className="text-xs font-medium text-destructive">
                    Due: {formatDate(deadline.deadline)}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/dashboard/applications">
              <Button className="w-full mt-4" variant="outline">
                View All Applications
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Program Opportunities</CardTitle>
          <CardDescription>
            Based on your farm profile, you may qualify for these programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">
                  Conservation Reserve Program (CRP)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Estimated payment: {formatCurrency(8500)}/year
                </p>
              </div>
              <Link href="/dashboard/programs">
                <Button>Learn More</Button>
              </Link>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">
                  Environmental Quality Incentives Program (EQIP)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Estimated payment: {formatCurrency(5200)}/year
                </p>
              </div>
              <Link href="/dashboard/programs">
                <Button>Learn More</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}