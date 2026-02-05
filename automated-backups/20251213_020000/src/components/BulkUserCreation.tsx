import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Users, UserPlus, SkipForward } from 'lucide-react';
import { DatabaseUserService } from '@/services/databaseUserService';

interface BulkUserResult {
  name: string;
  email: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

interface BulkUserCreationProps {
  onClose: () => void;
}

export const BulkUserCreation: React.FC<BulkUserCreationProps> = ({ onClose }) => {
  const [namesText, setNamesText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<BulkUserResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // Handle bulk user creation
  const handleBulkCreate = async () => {
    if (!namesText.trim()) {
      return;
    }

    setIsCreating(true);
    setResults([]);
    setShowResults(false);

    const names = DatabaseUserService.parseNames(namesText);
    const results = await DatabaseUserService.createBulkUsers(names);

    setResults(results);
    setShowResults(true);
    setIsCreating(false);
  };

  // Handle cleanup of empty users
  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const { cleaned, errors } = await DatabaseUserService.cleanupEmptyUsers();
      if (errors.length > 0) {
        console.error('Cleanup errors:', errors);
      }
      alert(`Cleaned up ${cleaned} empty user profiles. ${errors.length > 0 ? `Errors: ${errors.join(', ')}` : ''}`);
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed. Check console for details.');
    } finally {
      setIsCleaning(false);
    }
  };

  const stats = DatabaseUserService.getStats(results);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk User Creation
          </CardTitle>
                  <CardDescription>
                    Create multiple users at once by pasting a list of full names. Each line will be treated as a separate user.
                    Users will be created through Supabase Auth with the standard email format and default password.
                  </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showResults ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="names">Full Names (one per line)</Label>
                  <Textarea
                    id="names"
                    placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson&#10;Alice Brown"
                    value={namesText}
                    onChange={(e) => setNamesText(e.target.value)}
                    className="min-h-[200px] mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Each line will create a user with email: fullname@source-edge.com and password: SourceEdge2025!
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Example Format:</h4>
                  <pre className="text-sm text-blue-800">
{`John Doe
Jane Smith
Bob Johnson
Alice Brown`}
                  </pre>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleCleanup} 
                  disabled={isCleaning || isCreating}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  {isCleaning ? 'Cleaning...' : 'Clean Empty Users'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose} disabled={isCreating || isCleaning}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBulkCreate}
                    disabled={!namesText.trim() || isCreating || isCleaning}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {isCreating ? 'Creating Users...' : 'Create Users'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Creation Results</h3>
                  <Badge variant="outline">{stats.total} total</Badge>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                    <div className="text-sm text-green-700">Created</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <SkipForward className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{stats.skipped}</div>
                    <div className="text-sm text-yellow-700">Skipped</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                </div>

                {/* Results List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {result.status === 'skipped' && <SkipForward className="h-5 w-5 text-yellow-600" />}
                        {result.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                        <div>
                          <div className="font-medium">{result.name}</div>
                          <div className="text-sm text-muted-foreground">{result.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={result.status === 'success' ? 'default' : result.status === 'skipped' ? 'secondary' : 'destructive'}
                        >
                          {result.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{result.message}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {stats.skipped > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {stats.skipped} user(s) were skipped because they already exist. 
                      Check the results above to see which users were skipped.
                    </AlertDescription>
                  </Alert>
                )}

                {stats.errors > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {stats.errors} user(s) failed to create. Check the error messages above for details.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setShowResults(false);
                  setResults([]);
                  setNamesText('');
                }}>
                  Create More Users
                </Button>
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
