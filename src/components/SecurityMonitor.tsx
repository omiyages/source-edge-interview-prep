
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Info, Trash2 } from "lucide-react";
import { securityLogger } from "@/utils/securityLogger";
import { useToast } from "@/hooks/use-toast";

interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit_exceeded' | 'invalid_input' | 'admin_action';
  userId?: string;
  details: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

export const SecurityMonitor = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filter, setFilter] = useState<SecurityEvent['type'] | 'all'>('all');
  const { toast } = useToast();

  useEffect(() => {
    // Load initial events
    loadEvents();
    
    // Set up polling for new events
    const interval = setInterval(loadEvents, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [filter]);

  const loadEvents = () => {
    const recentEvents = filter === 'all' 
      ? securityLogger.getRecentEvents(100)
      : securityLogger.getEventsByType(filter);
    
    setEvents(recentEvents);
  };

  const clearEvents = () => {
    securityLogger.clearEvents();
    setEvents([]);
    toast({
      title: "Security events cleared",
      description: "All security events have been cleared from local storage.",
    });
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'auth_failure':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'rate_limit_exceeded':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'invalid_input':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'admin_action':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventColor = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'auth_failure':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'rate_limit_exceeded':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'invalid_input':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'admin_action':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatEventType = (type: SecurityEvent['type']) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Monitor ({events.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearEvents}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Events
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {(['all', 'auth_failure', 'rate_limit_exceeded', 'invalid_input', 'admin_action'] as const).map((type) => (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? 'All Events' : formatEventType(type)}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No security events</h3>
            <p className="text-gray-500">Security events will appear here when they occur.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                {getEventIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${getEventColor(event.type)}`}>
                      {formatEventType(event.type)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{event.details}</p>
                  {event.userId && (
                    <p className="text-xs text-gray-500">User: {event.userId}</p>
                  )}
                  {event.userAgent && (
                    <p className="text-xs text-gray-500 truncate">
                      User Agent: {event.userAgent}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
