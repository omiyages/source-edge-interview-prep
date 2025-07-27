
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { GoogleSheetsIntegrationDialog } from './GoogleSheetsIntegrationDialog';
import { GoogleSheetsIntegrationCard } from './GoogleSheetsIntegrationCard';
import { useGoogleSheetsIntegrations } from '@/hooks/useGoogleSheetsIntegration';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const GoogleSheetsIntegrationSection: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { data: integrations, isLoading, error } = useGoogleSheetsIntegrations();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load Google Sheets integrations: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Google Sheets Integration
            </CardTitle>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {integrations && integrations.length > 0 ? (
            <div className="grid gap-4">
              {integrations.map((integration) => (
                <GoogleSheetsIntegrationCard
                  key={integration.id}
                  integration={integration}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Google Sheets Connected</h3>
              <p className="text-muted-foreground mb-4">
                Connect your Google Sheets to import candidates automatically
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Connect First Sheet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <GoogleSheetsIntegrationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
};
