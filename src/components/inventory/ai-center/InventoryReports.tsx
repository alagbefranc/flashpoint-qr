'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart, FileDown, RefreshCcw, BarChart3, FileText, Calendar, Sparkles } from 'lucide-react';
// Removed Firestore imports
// Removed db import
import { getAuth } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface InventoryReportsProps {
  restaurant: any;
}

interface Report {
  id: string;
  title: string;
  description: string;
  type: 'summary' | 'trend' | 'forecast' | 'audit';
  category: string;
  generatedAt: Date;
  insights: string[];
  aiEnhanced?: boolean;
}

// We no longer need to define the FirestoreInventoryItem interface

// We no longer need to define the InventoryData interface as we're not fetching it directly

export default function InventoryReports({ restaurant }: InventoryReportsProps) {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const { toast } = useToast();

  // Fetch inventory data for reports
  useEffect(() => {
    const fetchReportData = async () => {
      if (!restaurant?.id) return;
      
      setLoading(true);
      try {
        // Simulate reports (in a real implementation, these would be stored in Firestore)
        const mockReports: Report[] = [
          {
            id: '1',
            title: 'Monthly Inventory Summary',
            description: 'Overview of current stock levels, value, and turnover',
            type: 'summary',
            category: 'inventory',
            generatedAt: new Date(),
            insights: [
              'Total inventory value: $12,450',
              'Highest value items: Proteins (32%)',
              'Lowest turnover: Dry goods (12 days)',
              'Stock discrepancies identified in 3 items'
            ]
          },
          {
            id: '2',
            title: 'Quarterly Usage Trends',
            description: 'Analysis of inventory consumption patterns over the last 3 months',
            type: 'trend',
            category: 'usage',
            generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            insights: [
              'Seasonal produce usage increased by 18%',
              'Alcohol consumption decreased by 5%',
              'Protein costs rose by 7% while usage remained stable',
              'Weekday vs weekend usage patterns identified'
            ]
          },
          {
            id: '3',
            title: 'Waste Report',
            description: 'Analysis of food waste by category and cause',
            type: 'audit',
            category: 'waste',
            generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            insights: [
              'Total waste cost: $1,250 (4.2% of food cost)',
              'Main waste causes: Overproduction (42%), Spoilage (28%)',
              'Highest waste items: Fresh produce and prepared sauces',
              'Waste reduced by 0.8% compared to previous month'
            ]
          },
          {
            id: '4',
            title: 'Six-Month Forecast',
            description: 'Projected inventory needs based on historical data',
            type: 'forecast',
            category: 'planning',
            generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            insights: [
              'Projected 8% increase in overall inventory needs',
              'Seasonal adjustments recommended for summer months',
              'Potential savings of $850/month through supplier consolidation',
              'Suggested par level adjustments for 12 items'
            ]
          }
        ];
        
        setReports(mockReports);
        setSelectedReport(mockReports[0]);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "Error",
          description: "Failed to load report data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [restaurant?.id, toast]);
  
  // Generate a new report using AI
  const generateReport = async (reportType: string) => {
    setGeneratingReport(true);
    const auth = getAuth();
    
    try {
      // Get current user's ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const idToken = await user.getIdToken();
      
      // Call our secure API endpoint - the server will fetch inventory data itself
      const response = await fetch('/api/ai/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          requestType: 'inventory-reports',
          reportType: reportType // e.g., 'summary', 'trend', 'forecast', 'audit'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }
      
      // Process the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response');
      }
      
      let aiResponse = '';
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode and append the chunk
        const chunk = new TextDecoder().decode(value);
        aiResponse += chunk;
      }
      
      // Process AI response into a report
      const newReport = createReportFromAIResponse(aiResponse, reportType);
      
      // Add the new report to the list
      setReports(prevReports => [newReport, ...prevReports]);
      setSelectedReport(newReport);
      
      toast({
        title: "Report Generated",
        description: `New ${reportType} report has been created with AI insights`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Could not create the requested report",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(false);
    }
  };
  
  // Create a report from AI response
  const createReportFromAIResponse = (aiResponse: string, reportType: string): Report => {
    // Extract insights from AI response
    const insightsRegex = /insights?:?[\s\n]*([\s\S]+?)(?=\n\n|$)/i;
    const insightsMatch = aiResponse.match(insightsRegex);
    
    let insights: string[] = [];
    
    if (insightsMatch && insightsMatch[1]) {
      // Try to parse bullet points or numbered list
      const bulletPoints = insightsMatch[1].split(/\n\s*[-•*]\s*/).filter(Boolean);
      if (bulletPoints.length > 1) {
        insights = bulletPoints;
      } else {
        // Try numbered list
        const numberedPoints = insightsMatch[1].split(/\n\s*\d+\.?\s*/).filter(Boolean);
        if (numberedPoints.length > 1) {
          insights = numberedPoints;
        } else {
          // If no clear list format, just split by newlines
          insights = insightsMatch[1].split(/\n+/).filter(Boolean);
        }
      }
    }
    
    if (insights.length === 0) {
      // If no insights were extracted, use the whole response
      insights = [
        "AI analysis complete. View details in the report.",
        aiResponse.substring(0, 200) + (aiResponse.length > 200 ? '...' : '')
      ];
    }
    
    // Generate a title based on report type
    let title = '';
    let description = '';
    let category = '';
    
    switch(reportType) {
      case 'summary':
        title = 'AI-Enhanced Inventory Summary';
        description = 'Current stock levels, value, and key metrics';
        category = 'inventory';
        break;
      case 'trend':
        title = 'Usage Trend Analysis';
        description = 'Analysis of inventory usage patterns over time';
        category = 'analysis';
        break;
      case 'forecast':
        title = 'Inventory Forecast';
        description = 'Predictions for future inventory needs';
        category = 'forecasting';
        break;
      case 'audit':
        title = 'Inventory Audit Report';
        description = 'Review of discrepancies and potential issues';
        category = 'audit';
        break;
      default:
        title = 'Inventory Report';
        description = 'AI-generated inventory analysis';
        category = 'inventory';
    }
    
    return {
      id: `ai-${Date.now()}`,
      title,
      description,
      type: reportType as 'summary' | 'trend' | 'forecast' | 'audit',
      category,
      generatedAt: new Date(),
      insights,
      aiEnhanced: true
    };
  };
  
  // Export a report
  const exportReport = (format: 'csv' | 'pdf') => {
    toast({
      title: "Export Started",
      description: `Exporting report as ${format.toUpperCase()}`,
    });
    
    // In a real implementation, this would trigger a download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Report has been exported as ${format.toUpperCase()}`,
      });
    }, 1500);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  const reportTypeIcon = (type: string) => {
    switch (type) {
      case 'summary': return <BarChart3 className="h-4 w-4" />;
      case 'trend': return <BarChart className="h-4 w-4" />;
      case 'forecast': return <Calendar className="h-4 w-4" />;
      case 'audit': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Inventory Reports</h2>
          <p className="text-sm text-muted-foreground">
            Generate insights and analysis about your inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => generateReport('custom')}
            disabled={loading || generatingReport}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            {generatingReport ? "Generating..." : "New Report"}
          </Button>
        </div>
      </div>
      
      {/* Report tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Available Reports</TabsTrigger>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-[50px] w-full" />
              <Skeleton className="h-[250px] w-full" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No reports available</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Generate your first inventory report to get insights about your stock levels, usage patterns, and more.
              </p>
              <Button className="mt-4" onClick={() => setActiveTab('generate')}>Generate Report</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 border rounded-md p-4">
                  <h3 className="text-sm font-medium mb-3">Report List</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {reports.map((report) => (
                      <div key={report.id} className="mb-2 last:mb-0">
                        <Button 
                          variant={selectedReport?.id === report.id ? "secondary" : "ghost"}
                          className="w-full justify-start h-auto py-2 px-2"
                          onClick={() => setSelectedReport(report)}
                        >
                          <div className="text-left flex items-center gap-2">
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {report.title}
                                {report.aiEnhanced && <Sparkles className="h-3 w-3 text-primary" />}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(report.generatedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedReport ? (
                  <div className="col-span-2">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{selectedReport.title}</CardTitle>
                            <CardDescription>
                              {selectedReport.description}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => exportReport('csv')}
                            >
                              <FileDown className="h-4 w-4" />
                              CSV
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => exportReport('pdf')}
                            >
                              <FileDown className="h-4 w-4" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Key Insights</h3>
                            <ul className="space-y-2">
                              {selectedReport.insights.map((insight, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium mb-2">Visualization</h3>
                            <div className="bg-muted/50 rounded-md h-[200px] flex items-center justify-center">
                              <p className="text-muted-foreground">Chart visualization would appear here</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="col-span-2 flex items-center justify-center border rounded-md p-8">
                    <div className="text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Select a report to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Select a report type to generate inventory insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Inventory Summary',
                    description: 'Current stock levels, value, and turnover analysis',
                    type: 'summary'
                  },
                  {
                    title: 'Usage Trends',
                    description: 'Consumption patterns over time by category',
                    type: 'trend'
                  },
                  {
                    title: 'Waste Analysis',
                    description: 'Detailed breakdown of waste by cause and item',
                    type: 'audit'
                  },
                  {
                    title: 'Purchasing Forecast',
                    description: 'Projected ordering needs based on historical data',
                    type: 'forecast'
                  }
                ].map((reportType, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mx-auto mb-2">
                        {reportTypeIcon(reportType.type)}
                      </div>
                      <CardTitle className="text-center text-base">{reportType.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-sm text-muted-foreground">
                      {reportType.description}
                    </CardContent>
                    <CardFooter className="flex justify-center pt-0">
                      <Button 
                        size="sm" 
                        onClick={() => generateReport(reportType.type)}
                        disabled={generatingReport}
                      >
                        Generate
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
