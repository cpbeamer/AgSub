import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart3, FileCheck, Globe, Shield, Tractor, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Tractor className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">AgSub</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4 text-center bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-5xl font-bold mb-6">
              Agricultural Subsidy & Program Enrollment Made Simple
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Help farmers enroll in USDA/NRCS programs, file forms automatically, 
              and stay compliant with satellite monitoring.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Maximize Subsidies
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <FileCheck className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Smart Program Matching</CardTitle>
                  <CardDescription>
                    AI-powered eligibility matching finds all programs you qualify for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Parse USDA notices automatically</li>
                    <li>• Match farm profile to programs</li>
                    <li>• Estimate payment amounts</li>
                    <li>• Ranked by profitability</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Globe className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Compliance Monitoring</CardTitle>
                  <CardDescription>
                    Satellite and drone imagery validates your practices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Automatic acreage verification</li>
                    <li>• Practice compliance tracking</li>
                    <li>• Variance detection alerts</li>
                    <li>• Evidence documentation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Payment Tracking</CardTitle>
                  <CardDescription>
                    Never miss a subsidy payment or deadline again
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Payment timeline dashboard</li>
                    <li>• Automatic form generation</li>
                    <li>• Submission tracking</li>
                    <li>• Audit trail exports</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Built for Modern Farming Operations
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Secure & Compliant</h3>
                  <p className="text-sm text-muted-foreground">
                    Bank-level encryption, role-based access control, and 
                    immutable audit logs ensure your data is protected.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <Users className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2">Multi-Tenant Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Perfect for consultants managing multiple farms or 
                    cooperatives with many members.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Maximize Your Agricultural Subsidies?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of farmers who have increased their subsidy income 
              by an average of 35% using AgSub.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Your Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 AgSub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}