
import { supabase } from "@/integrations/supabase/client";

export interface LinkedInProfileData {
  name: string;
  company: string;
  experience: number;
  skills: string[];
  pastCompanies: string[];
  note: string;
}

export const scrapeLinkedInProfile = async (linkedinUrl: string): Promise<LinkedInProfileData | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-linkedin', {
      body: { url: linkedinUrl }
    });

    if (error) {
      console.error('LinkedIn scraping error:', error);
      throw new Error('Failed to scrape LinkedIn profile');
    }

    return data as LinkedInProfileData;
  } catch (error) {
    console.error('Error calling LinkedIn scraper:', error);
    throw error;
  }
};
