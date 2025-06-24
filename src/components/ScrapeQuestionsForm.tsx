
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe } from "lucide-react";

interface ScrapeQuestionsFormProps {
  onSuccess: () => void;
}

export const ScrapeQuestionsForm = ({ onSuccess }: ScrapeQuestionsFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    source_website: "glassdoor"
  });
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url.trim()) {
      toast({
        title: "Missing URL",
        description: "Please provide a URL to scrape questions from.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/scrape-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape questions');
      }

      toast({
        title: "Questions scraped successfully!",
        description: result.message,
      });

      // Reset form
      setFormData({
        url: "",
        source_website: "glassdoor"
      });

      onSuccess();
    } catch (error) {
      console.error('Error scraping questions:', error);
      toast({
        title: "Error scraping questions",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Scrape Interview Questions</h3>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="url" className="text-sm font-medium">
            URL to Scrape *
          </Label>
          <Input
            id="url"
            type="url"
            placeholder="https://www.glassdoor.com/Interview/..."
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            className="mt-1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a URL from Glassdoor, LeetCode, or other interview sites
          </p>
        </div>

        <div>
          <Label className="text-sm font-medium">Source Website</Label>
          <Select value={formData.source_website} onValueChange={(value) => handleChange('source_website', value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="glassdoor">Glassdoor</SelectItem>
              <SelectItem value="leetcode">LeetCode</SelectItem>
              <SelectItem value="blind">Blind</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4 mr-2" />
              Scrape Questions
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-gray-500 bg-amber-50 p-3 rounded-md">
        <strong>Note:</strong> Web scraping should be done responsibly and in accordance with the website's terms of service. 
        This feature is for educational purposes and should be used sparingly.
      </div>
    </form>
  );
};
