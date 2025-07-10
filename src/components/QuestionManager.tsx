
import { useQuestionManager } from "@/hooks/useQuestionManager";
import { QuestionFilters } from "./QuestionFilters";
import { QuestionManagerHeader } from "./QuestionManagerHeader";
import { QuestionManagerContent } from "./QuestionManagerContent";
import { QuestionManagerActions } from "./QuestionManagerActions";

interface QuestionManagerProps {
  stageId: string;
  onSuccess: () => void;
}

export const QuestionManager = ({ stageId, onSuccess }: QuestionManagerProps) => {
  const {
    searchTerm,
    setSearchTerm,
    selectedQuestions,
    isSaving,
    filters,
    filteredQuestions,
    isLoadingQuestions,
    isLoadingCurrent,
    toggleQuestion,
    handleFilterChange,
    clearFilters,
    handleSave,
    getUniqueValues
  } = useQuestionManager(stageId);

  if (isLoadingQuestions || isLoadingCurrent) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuestionManagerHeader selectedCount={selectedQuestions.size} />

      <QuestionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        getUniqueValues={getUniqueValues}
      />

      <QuestionManagerContent
        questions={filteredQuestions}
        selectedQuestions={selectedQuestions}
        onToggleQuestion={toggleQuestion}
        isLoading={isLoadingQuestions}
      />

      <QuestionManagerActions
        onSave={() => handleSave(onSuccess)}
        isSaving={isSaving}
      />
    </div>
  );
};
