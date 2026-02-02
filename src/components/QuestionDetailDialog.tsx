import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import {
  Building2,
  User,
  Hash,
  ClipboardList,
  Lightbulb,
  Info,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { InterviewQuestion } from "@/services/questionsService";
import { getOrGeneratePreparationNotes } from "@/services/questionsService";

interface QuestionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: InterviewQuestion | null;
  currentDisplayNumber: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}

const PREP_NOTE_ICONS = [Lightbulb, Info, CheckCircle];

export function QuestionDetailDialog({
  open,
  onOpenChange,
  question,
  currentDisplayNumber,
  totalCount,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: QuestionDetailDialogProps) {
  const [prepNotes, setPrepNotes] = useState<string[]>([]);
  const [prepNotesLoading, setPrepNotesLoading] = useState(false);

  useEffect(() => {
    if (!open || !question) {
      setPrepNotes([]);
      setPrepNotesLoading(false);
      return;
    }
    const existing = question.preparation_notes;
    if (Array.isArray(existing) && existing.length > 0) {
      setPrepNotes(existing);
      setPrepNotesLoading(false);
      return;
    }
    setPrepNotesLoading(true);
    getOrGeneratePreparationNotes(question.id)
      .then((notes) => {
        setPrepNotes(notes);
      })
      .catch(() => {
        setPrepNotes([]);
      })
      .finally(() => {
        setPrepNotesLoading(false);
      });
  }, [open, question?.id]);

  // Keyboard: Left/Right arrows move to previous/next question
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input") || target.closest("textarea") || target.closest("[contenteditable]")) return;
      if (e.key === "ArrowLeft" && canPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && canNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, canPrev, canNext, onPrev, onNext]);

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 rounded-xl border-0 shadow-xl">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border/50 flex items-center justify-between space-y-0">
          <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">
            Question Details
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-0">
            {/* Left: Question content */}
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {question.company.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <User className="h-3.5 w-3.5" />
                  {question.role.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                QUESTION #{currentDisplayNumber}
              </p>
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {question.question}
              </h2>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Question details
                </p>
                {question.additional_context ? (
                  <div className="text-sm text-foreground prose prose-sm max-w-none">
                    <RichTextDisplay
                      content={question.additional_context}
                      className="break-words"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No additional details provided.
                  </p>
                )}
              </div>
            </div>

            {/* Right: Sidebar */}
            <div className="lg:border-l border-border/50 bg-muted/30 p-6 space-y-6">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  Category
                </p>
                <p className="text-sm font-medium text-foreground">
                  {question.category || "—"}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Interview stage
                </p>
                <p className="text-sm font-medium text-foreground">
                  {question.interview_stage || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Preparation notes
                </p>
                <div className="space-y-2">
                  {prepNotesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading preparation notes…</p>
                  ) : prepNotes.length > 0 ? (
                    prepNotes.map((text, i) => {
                      const Icon = PREP_NOTE_ICONS[i % PREP_NOTE_ICONS.length];
                      return (
                        <div
                          key={i}
                          className="flex gap-2 rounded-lg border border-border/80 bg-background p-3 text-sm text-foreground shadow-sm"
                        >
                          <Icon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{text}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No preparation notes available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - no rounded corners so dialog's overflow-hidden clips it and no white sliver at corners */}
        <footer className="flex items-center justify-between px-6 py-4 bg-black text-white mt-auto flex-shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={!canPrev}
            className="inline-flex items-center gap-1 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-gray-300">
            Question {currentDisplayNumber} / {totalCount}
          </span>
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="inline-flex items-center gap-1 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
