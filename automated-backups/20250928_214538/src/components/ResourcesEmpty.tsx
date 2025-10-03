
interface ResourcesEmptyProps {
  selectedCategory: string;
}

export const ResourcesEmpty = ({ selectedCategory }: ResourcesEmptyProps) => {
  return (
    <div className="text-center py-12">
      <p className="text-lg text-gray-600">
        {selectedCategory === "all" 
          ? "No resources available yet." 
          : `No resources found in the "${selectedCategory}" category.`
        }
      </p>
    </div>
  );
};
