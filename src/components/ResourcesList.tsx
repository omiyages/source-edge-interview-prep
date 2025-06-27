
import { ResourceCard } from "@/components/ResourceCard";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  category: string;
  created_at: string;
}

interface ResourcesListProps {
  resources: Resource[];
  isAdmin: boolean;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: string) => void;
}

export const ResourcesList = ({ resources, isAdmin, onEdit, onDelete }: ResourcesListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          onEdit={isAdmin ? onEdit : undefined}
          onDelete={isAdmin ? onDelete : undefined}
        />
      ))}
    </div>
  );
};
