
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ColumnMappingPreviewProps {
  sampleData: string[][];
  columnMappings: Record<string, string>;
  className?: string;
}

export const ColumnMappingPreview: React.FC<ColumnMappingPreviewProps> = ({
  sampleData,
  columnMappings,
  className = "",
}) => {
  if (!sampleData || sampleData.length === 0) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No sample data available. Please check your Google Sheets connection.
        </AlertDescription>
      </Alert>
    );
  }

  const headers = sampleData[0] || [];
  const rows = sampleData.slice(1, 4); // Show first 3 rows as preview
  
  // Check if we have a name mapping (required)
  const hasNameMapping = Object.values(columnMappings).includes('full_name');
  
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Preview Column Mapping
            {hasNameMapping ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasNameMapping && (
            <Alert className="mb-4" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> No "Full Name" mapping found. Candidates without names will be skipped during import.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Column Mappings:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {headers.map((header, index) => {
                  const mapping = columnMappings[header];
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="font-mono text-sm">{header}</span>
                      <span>→</span>
                      {mapping ? (
                        <Badge variant={mapping === 'full_name' ? 'default' : 'secondary'}>
                          {mapping}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not mapped</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Sample Data Preview:</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 text-sm">
                  <thead>
                    <tr className="bg-muted">
                      {headers.map((header, index) => (
                        <th key={index} className="border border-gray-200 p-2 text-left">
                          <div className="space-y-1">
                            <div className="font-mono text-xs">{header}</div>
                            {columnMappings[header] && (
                              <Badge variant="outline" className="text-xs">
                                {columnMappings[header]}
                              </Badge>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {headers.map((header, colIndex) => {
                          const cellValue = row[colIndex] || '';
                          const mapping = columnMappings[header];
                          const isNameColumn = mapping === 'full_name';
                          const isEmpty = !cellValue || cellValue.trim() === '';
                          
                          return (
                            <td 
                              key={colIndex} 
                              className={`border border-gray-200 p-2 ${
                                isNameColumn && isEmpty ? 'bg-red-50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[150px]">
                                  {cellValue || (
                                    <span className="text-gray-400 italic">empty</span>
                                  )}
                                </span>
                                {isNameColumn && isEmpty && (
                                  <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Note:</strong> Rows with empty "Full Name" fields will be skipped during import.
                {rows.length > 0 && (
                  <span> Showing {rows.length} sample rows from your sheet.</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
