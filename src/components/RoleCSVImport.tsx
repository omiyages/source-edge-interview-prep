import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkCreateRoles } from '@/services/rolesService';
import type { RoleFormData, WorkingStyle, JapaneseLevel } from '@/types/role';
import { Upload, Download, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const REQUIRED_HEADERS = ['job_title', 'company', 'location', 'working_style'];
const ALL_HEADERS = [
  'job_title',
  'role_type',
  'company',
  'location',
  'working_style',
  'japanese_level',
  'division',
  'job_description',
  'requirements',
  'nice_to_haves',
  'benefits',
];
const VALID_WORKING_STYLES: WorkingStyle[] = ['Hybrid', 'Remote', 'Onsite'];
const VALID_JAPANESE_LEVELS: JapaneseLevel[] = ['None', 'Conversational', 'Business', 'Native'];

interface ParsedRow {
  data: RoleFormData;
  errors: string[];
  rowNum: number;
}

export const RoleCSVImport: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (roles: RoleFormData[]) => {
      const createdBy = profile?.email || user?.email || 'admin';
      return bulkCreateRoles(roles, createdBy);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${result.count} role${result.count !== 1 ? 's' : ''}. AI summaries are being generated.`,
      });
      resetState();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import roles.',
        variant: 'destructive',
      });
    },
  });

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setShowPreview(false);
    const input = document.getElementById('role-csv-file') as HTMLInputElement;
    if (input) input.value = '';
  };

  const parseCSV = (csvText: string): ParsedRow[] => {
    const lines = csvText.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Parse header row — handle quoted values
    const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

    // Validate required headers exist
    const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      toast({
        title: 'Invalid CSV Headers',
        description: `Missing required columns: ${missingHeaders.join(', ')}`,
        variant: 'destructive',
      });
      return [];
    }

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const errors: string[] = [];
      const obj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        obj[header] = (values[idx] || '').trim();
      });

      // Validate required fields
      if (!obj.job_title) errors.push('Missing job_title');
      if (!obj.company) errors.push('Missing company');
      if (!obj.location) errors.push('Missing location');

      // Validate working_style
      const ws = obj.working_style || '';
      const normalizedWs =
        VALID_WORKING_STYLES.find((v) => v.toLowerCase() === ws.toLowerCase()) || null;
      if (!normalizedWs) {
        errors.push(`Invalid working_style "${ws}" (must be Hybrid, Remote, or Onsite)`);
      }

      const japaneseLevel = obj.japanese_level || 'None';
      const normalizedJapanese =
        VALID_JAPANESE_LEVELS.find((v) => v.toLowerCase() === japaneseLevel.toLowerCase()) || null;
      if (!normalizedJapanese) {
        errors.push(`Invalid japanese_level "${japaneseLevel}" (must be None, Conversational, Business, or Native)`);
      }

      rows.push({
        rowNum: i + 1,
        errors,
        data: {
          job_title: obj.job_title || '',
          role_type: obj.role_type || '',
          company: obj.company || '',
          location: obj.location || '',
          working_style: normalizedWs || 'Onsite',
          japanese_level: normalizedJapanese || 'None',
          division: obj.division || '',
          job_description: obj.job_description || '',
          requirements: obj.requirements || '',
          nice_to_haves: obj.nice_to_haves || '',
          benefits: obj.benefits || '',
          status: 'active',
        },
      });
    }

    return rows;
  };

  // Proper CSV line parser that handles quoted values with commas inside
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setParsedRows([]);
      setShowPreview(false);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select a valid CSV file.',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast({
          title: 'No Data',
          description: 'No valid rows found in the CSV file.',
          variant: 'destructive',
        });
        return;
      }
      setParsedRows(rows);
      setShowPreview(true);
    } catch {
      toast({
        title: 'Parse Error',
        description: 'Failed to parse CSV file.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = () => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      toast({
        title: 'No Valid Rows',
        description: 'All rows have validation errors. Please fix the CSV and try again.',
        variant: 'destructive',
      });
      return;
    }
    importMutation.mutate(validRows.map((r) => r.data));
  };

  const downloadTemplate = () => {
    const csvContent = `job_title,role_type,company,location,working_style,japanese_level,division,job_description,requirements,nice_to_haves,benefits
"Software Engineer","Backend Engineer","Google","Tokyo, Japan","Hybrid","Business","Engineering","Build scalable distributed systems...","3+ years of experience in Go or Java, Strong CS fundamentals","Experience with Kubernetes, Open source contributions","Health insurance, Stock options, Remote flexibility"
"Product Manager","Product Manager","Meta","Menlo Park, CA","Onsite","None","Product","Lead product strategy for social features...","5+ years PM experience, Data-driven decision making","MBA preferred, Experience with A/B testing","Competitive salary, RSUs, Free meals"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roles_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter((r) => r.errors.length === 0).length;
  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length;

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="role-csv-file">Upload CSV File</Label>
        <Input
          id="role-csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={importMutation.isPending}
        />
        <p className="text-sm text-muted-foreground">
          Required columns: <span className="font-medium">job_title, company, location, working_style</span>.
          Optional: role_type, japanese_level, division, job_description, requirements, nice_to_haves, benefits.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handlePreview} disabled={!file || importMutation.isPending} variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
        {showPreview && validCount > 0 && (
          <Button onClick={handleImport} disabled={importMutation.isPending}>
            {importMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {validCount} Role{validCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Preview Table */}
      {showPreview && parsedRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {validCount} valid
            </Badge>
            {errorCount > 0 && (
              <Badge variant="destructive">
                {errorCount} with errors
              </Badge>
            )}
          </div>

          <div className="rounded-md border max-h-80 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Role Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Working Style</TableHead>
                  <TableHead>Japanese</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.map((row) => (
                  <TableRow
                    key={row.rowNum}
                    className={row.errors.length > 0 ? 'bg-red-50' : ''}
                  >
                    <TableCell className="font-mono text-xs">{row.rowNum}</TableCell>
                    <TableCell className="font-medium">{row.data.job_title || '—'}</TableCell>
                    <TableCell>{row.data.role_type || '—'}</TableCell>
                    <TableCell>{row.data.company || '—'}</TableCell>
                    <TableCell>{row.data.location || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.data.working_style}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.data.japanese_level}</Badge>
                    </TableCell>
                    <TableCell>{row.data.division || '—'}</TableCell>
                    <TableCell>
                      {row.errors.length > 0 ? (
                        <span className="text-xs text-red-600">{row.errors.join('; ')}</span>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          Ready
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
