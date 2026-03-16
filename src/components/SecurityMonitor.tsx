
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Info, Trash2, Eye, Download } from "lucide-react";
import { securityLogger } from "@/utils/securityLogger";
import { useToast } from "@/hooks/use-toast";

interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit_exceeded' | 'invalid_input' | 'admin_action' | 'xss_attempt' | 'suspicious_activity';
  userId?: string;
  details: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export const SecurityMonitor = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [filter, setFilter] = useState<SecurityEvent['type'] | SecurityEvent['severity'] | 'all'>('all');
  const [filterType, setFilterType] = useState<'type' | 'severity'>('type');
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 30000);
    return () => clearInterval(interval);
  }, [filter, filterType]);

  const loadEvents = () => {
    let filteredEvents: SecurityEvent[];
    
    if (filter === 'all') {
      filteredEvents = securityLogger.getRecentEvents(100);
    } else if (filterType === 'type') {
      filteredEvents = securityLogger.getEventsByType(filter as SecurityEvent['type']);
    } else {
      filteredEvents = securityLogger.getEventsBySeverity(filter as SecurityEvent['severity']);
    }
    
    setEvents(filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const clearEvents = () => {
    securityLogger.clearEvents();
    setEvents([]);
    toast({
      title: "Security events cleared",
      description: "All security events have been cleared from local storage.",
    });
  };

  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-events-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'auth_failure':
      case 'xss_attempt':
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'rate_limit_exceeded':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'invalid_input':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'admin_action':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/40 text-red-400 border-red-800';
      case 'high':
        return 'bg-red-900/20 text-red-400 border-red-800';
      case 'medium':
        return 'bg-orange-900/20 text-orange-400 border-orange-800';
      case 'low':
        return 'bg-blue-900/20 text-blue-400 border-blue-800';
      default:
        return 'bg-neutral-800/50 text-neutral-300 border-neutral-700';
    }
  };

  const getTypeColor = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'auth_failure':
      case 'xss_attempt':
        return 'bg-red-900/20 text-red-400 border-red-800';
      case 'rate_limit_exceeded':
      case 'suspicious_activity':
        return 'bg-orange-900/20 text-orange-400 border-orange-800';
      case 'invalid_input':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-800';
      case 'admin_action':
        return 'bg-blue-900/20 text-blue-400 border-blue-800';
      default:
        return 'bg-neutral-800/50 text-neutral-300 border-neutral-700';
    }
  };

  const formatEventType = (type: SecurityEvent['type']) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCriticalEventsCount = () => {
    return events.filter(event => event.severity === 'critical').length;
  };

  const typeFilters = ['all', 'auth_failure', 'rate_limit_exceeded', 'invalid_input', 'admin_action', 'xss_attempt', 'suspicious_activity'] as const;
  const severityFilters = ['all', 'critical', 'high', 'medium', 'low'] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Monitor ({events.length})
            {getCriticalEventsCount() > 0 && (
              <Badge className="bg-red-900/40 text-red-400 border-red-800">
                {getCriticalEventsCount()} Critical
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportEvents}
              disabled={events.length === 0}
              className="text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
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
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant={filterType === 'type' ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilterType('type');
                setFilter('all');
              }}
            >
              Filter by Type
            </Button>
            <Button
              variant={filterType === 'severity' ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilterType('severity');
                setFilter('all');
              }}
            >
              Filter by Severity
            </Button>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {filterType === 'type' ? (
              typeFilters.map((type) => (
                <Button
                  key={type}
                  variant={filter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(type)}
                >
                  {type === 'all' ? 'All Types' : formatEventType(type)}
                </Button>
              ))
            ) : (
              severityFilters.map((severity) => (
                <Button
                  key={severity}
                  variant={filter === severity ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(severity)}
                  className={severity === 'critical' ? 'border-red-300 text-red-700' : ''}
                >
                  {severity === 'all' ? 'All Severities' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Button>
              ))
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-400 mb-2">No security events</h3>
            <p className="text-neutral-400">Security events will appear here when they occur.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  event.severity === 'critical' ? 'bg-red-900/20 border-red-800' :
                  event.severity === 'high' ? 'bg-orange-900/20 border-orange-800' :
                  'bg-neutral-800/50 border-neutral-700'
                }`}
              >
                {getEventIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className={`text-xs ${getTypeColor(event.type)}`}>
                      {formatEventType(event.type)}
                    </Badge>
                    <Badge className={`text-xs ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-neutral-400">
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-300 mb-1">{event.details}</p>
                  {event.userId && (
                    <p className="text-xs text-neutral-400">User: {event.userId}</p>
                  )}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <details className="text-xs text-neutral-400 mt-1">
                      <summary className="cursor-pointer hover:text-neutral-300">
                        <Eye className="w-3 h-3 inline mr-1" />
                        Additional Details
                      </summary>
                      <pre className="mt-1 p-2 bg-neutral-800 rounded text-xs overflow-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
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
