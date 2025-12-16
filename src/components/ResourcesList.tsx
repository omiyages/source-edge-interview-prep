
import { useState, useMemo } from "react";
import { OptimizedResourcesList } from "./OptimizedResourcesList";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

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
  loading?: boolean;
}

const ITEMS_PER_PAGE = 12;

export const ResourcesList = ({ resources, isAdmin, onEdit, onDelete, loading = false }: ResourcesListProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(resources.length / ITEMS_PER_PAGE);
  }, [resources.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <OptimizedResourcesList
        resources={resources}
        loading={loading}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {!loading && resources.length > ITEMS_PER_PAGE && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1;
                // Show ellipsis if there are more pages
                if (totalPages > 5 && pageNumber === 5 && currentPage < totalPages - 1) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink className="cursor-default">
                        ...
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className={`cursor-pointer ${
                        currentPage === pageNumber 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : ""
                      }`}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
