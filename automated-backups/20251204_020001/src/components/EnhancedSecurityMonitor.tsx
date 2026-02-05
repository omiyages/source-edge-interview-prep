
// ABOUTME: Enhanced security monitoring component with real-time alerts
// ABOUTME: Provides comprehensive security event monitoring and alerting

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Eye, Trash2, RefreshCw } from 'lucide-react';
import { securityLogger } from '@/utils/securityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const EnhancedSecurityMonitor: React.FC = () => {
  const [events, setEvents] = useState(securityLogger.getRecentEvents(50));
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(securityLogger.getRecentEvents(50));
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Monitor for critical events and show alerts
    const criticalEvents = events.filter(event => 
      event.severity === 'critical' && 
      event.timestamp > new Date(Date.now() - 10000) // Last 10 seconds
    );

    criticalEvents.forEach(event => {
      toast({
        title: "Critical Security Alert",
        description: event.details,
        variant: "destructive",
      });
    });
  }, [events, toast]);

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Admin privileges required to view security monitoring.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.severity === filter
  );

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const handleClearEvents = () => {
    securityLogger.clearEvents();
    setEvents([]);
    toast({
      title: "Security Events Cleared",
      description: "All security events have been cleared from the log.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Enhanced Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-sm text-gray-600">Critical Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{highCount}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{events.length}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <Button
                onClick={() => setEvents(securityLogger.getRecentEvents(50))}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All Events
            </Button>
            <Button
              onClick={() => setFilter('critical')}
              variant={filter === 'critical' ? 'default' : 'outline'}
              size="sm"
            >
              Critical
            </Button>
            <Button
              onClick={() => setFilter('high')}
              variant={filter === 'high' ? 'default' : 'outline'}
              size="sm"
            >
              High Priority
            </Button>
            <Button
              onClick={handleClearEvents}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No security events found
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={`text-white ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-medium">{event.type.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-gray-600">{event.details}</div>
                      {event.metadata && (
                        <div className="text-xs text-gray-500 mt-1">
                          {JSON.stringify(event.metadata)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{event.timestamp.toLocaleTimeString()}</div>
                    <div>{event.timestamp.toLocaleDateString()}</div>
                    {event.userId && (
                      <div className="text-xs">User: {event.userId.slice(0, 8)}...</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {criticalCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Security Alert:</strong> {criticalCount} critical security events detected. 
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
