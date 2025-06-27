
import { useState, useEffect } from 'react';
import { fetchResources, Resource } from '@/services/resourcesService';

export const useResources = (shouldFetch: boolean = true) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shouldFetch) return;

    const loadResources = async () => {
      try {
        setLoading(true);
        const data = await fetchResources(10);
        setResources(data);
      } catch (error) {
        console.error('❌ Error loading resources:', error);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [shouldFetch]);

  return { resources, loading };
};
