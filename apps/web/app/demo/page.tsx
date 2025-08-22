'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart3, FileCheck, Globe, MapPin, Tractor, TrendingUp } from 'lucide-react';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('eligibility');

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              See AgSub in Action
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore how AgSub helps farmers maximize their subsidy income
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="eligibility">Eligibility Check</TabsTrigger>
              <TabsTrigger value="monitoring">Compliance</TabsTrigger>
              <TabsTrigger value="tracking">Payment Tracking</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="eligibility" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Program Eligibility Scanner
                  </CardTitle>
                  <CardDescription>
                    Our AI automatically matches your farm profile with all available USDA programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Demo Farm Profile</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Location: Iowa</div>
                        <div>Size: 500 acres</div>
                        <div>Primary Crop: Corn</div>
                        <div>Secondary: Soybeans</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">Eligible Programs Found:</h3>
                      <div className="space-y-2">
                        {[
                          { name: 'EQIP - Environmental Quality Incentives', amount: '$15,000/year', match: '95%' },
                          { name: 'CSP - Conservation Stewardship Program', amount: '$40,000/year', match: '88%' },
                          { name: 'CRP - Conservation Reserve Program', amount: '$180/acre', match: '82%' },
                          { name: 'ARC-CO - Agriculture Risk Coverage', amount: '$25,000/year', match: '75%' }
                        ].map((program, i) => (
                          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{program.name}</div>
                              <div className="text-sm text-muted-foreground">Est. Payment: {program.amount}</div>
                            </div>
                            <div className="text-sm font-medium text-green-600">
                              {program.match} Match
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Satellite Compliance Monitoring
                  </CardTitle>
                  <CardDescription>
                    Real-time satellite imagery validates your conservation practices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Latest Compliance Check</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Cover Crop Status</div>
                          <div className="text-lg font-medium text-green-600">✓ Verified</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Buffer Strips</div>
                          <div className="text-lg font-medium text-green-600">✓ Compliant</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Tillage Practice</div>
                          <div className="text-lg font-medium text-green-600">✓ No-Till Confirmed</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Wetland Areas</div>
                          <div className="text-lg font-medium text-green-600">✓ Protected</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <MapPin className="h-8 w-8 text-primary mb-2" />
                        <h4 className="font-medium mb-1">Field Map View</h4>
                        <p className="text-sm text-muted-foreground">
                          Interactive satellite imagery with practice overlays
                        </p>
                      </div>
                      <div className="border rounded-lg p-4">
                        <TrendingUp className="h-8 w-8 text-primary mb-2" />
                        <h4 className="font-medium mb-1">Historical Timeline</h4>
                        <p className="text-sm text-muted-foreground">
                          12-month compliance history with evidence archive
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Payment Dashboard
                  </CardTitle>
                  <CardDescription>
                    Track all your subsidy payments and upcoming deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-2xl font-bold">$82,500</div>
                        <div className="text-sm text-muted-foreground">Total Received (2024)</div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-2xl font-bold">$45,000</div>
                        <div className="text-sm text-muted-foreground">Pending Payments</div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-2xl font-bold">3</div>
                        <div className="text-sm text-muted-foreground">Upcoming Deadlines</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">Recent & Upcoming Payments</h3>
                      <div className="space-y-2">
                        {[
                          { program: 'EQIP Payment', date: 'Mar 15, 2025', amount: '$3,750', status: 'pending' },
                          { program: 'CSP Annual', date: 'Feb 28, 2025', amount: '$10,000', status: 'pending' },
                          { program: 'CRP Rental', date: 'Jan 31, 2025', amount: '$4,500', status: 'paid' },
                          { program: 'ARC-CO Payment', date: 'Dec 15, 2024', amount: '$6,250', status: 'paid' }
                        ].map((payment, i) => (
                          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{payment.program}</div>
                              <div className="text-sm text-muted-foreground">{payment.date}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="font-medium">{payment.amount}</div>
                              <div className={`text-sm px-2 py-1 rounded ${
                                payment.status === 'paid' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {payment.status === 'paid' ? 'Paid' : 'Pending'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Analytics
                  </CardTitle>
                  <CardDescription>
                    Insights to maximize your subsidy income
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Income Growth</h3>
                        <div className="text-3xl font-bold text-green-600">+35%</div>
                        <div className="text-sm text-muted-foreground">
                          Year-over-year subsidy increase
                        </div>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Optimization Score</h3>
                        <div className="text-3xl font-bold">92/100</div>
                        <div className="text-sm text-muted-foreground">
                          Program utilization efficiency
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold">Recommendations</h3>
                      <div className="space-y-2">
                        <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                          <div className="font-medium text-blue-900">Add 50 acres to CRP</div>
                          <div className="text-sm text-blue-700">
                            Could increase annual income by $9,000 with marginal land
                          </div>
                        </div>
                        <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                          <div className="font-medium text-blue-900">Implement prescribed grazing</div>
                          <div className="text-sm text-blue-700">
                            Qualify for additional $5,000 in CSP enhancements
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-12 text-center">
            <div className="bg-primary/10 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">
                Ready to maximize your agricultural subsidies?
              </h2>
              <p className="text-muted-foreground mb-6">
                Start your free trial today and see immediate results
              </p>
              <Link href="/register">
                <Button size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}