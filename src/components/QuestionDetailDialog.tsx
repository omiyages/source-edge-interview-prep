import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  Bookmark,
} from "lucide-react";
import type { InterviewQuestion, WinningAnswerFramework } from "@/services/questionsService";
import { getOrGeneratePreparationNotes, getOrGenerateQuestionCoaching } from "@/services/questionsService";
import { useQuestionBookmark } from "@/hooks/useQuestionBookmark";
import { useAuth } from "@/hooks/useAuth";

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
   showEditButton?: boolean;
   onEditQuestion?: (question: InterviewQuestion) => void;
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
  showEditButton,
  onEditQuestion,
}: QuestionDetailDialogProps) {
  const [prepNotes, setPrepNotes] = useState<string[]>([]);
  const [prepNotesLoading, setPrepNotesLoading] = useState(false);
  const [interviewerIntent, setInterviewerIntent] = useState<string[]>([]);
  const [winningFramework, setWinningFramework] = useState<WinningAnswerFramework | null>(null);
  const [coachingLoading, setCoachingLoading] = useState(false);
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, isToggling: isBookmarkToggling } = useQuestionBookmark(question?.id || '');

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

  useEffect(() => {
    if (!open || !question) {
      setInterviewerIntent([]);
      setWinningFramework(null);
      setCoachingLoading(false);
      return;
    }
    const hasIntent = Array.isArray(question.interviewer_intent) && question.interviewer_intent.length > 0;
    const hasFramework = question.winning_answer_framework && typeof question.winning_answer_framework === "object";
    if (hasIntent && hasFramework) {
      setInterviewerIntent(question.interviewer_intent);
      setWinningFramework(question.winning_answer_framework as WinningAnswerFramework);
      setCoachingLoading(false);
      return;
    }
    setCoachingLoading(true);
    getOrGenerateQuestionCoaching(question.id)
      .then(({ interviewer_intent, winning_answer_framework }) => {
        setInterviewerIntent(interviewer_intent);
        setWinningFramework(winning_answer_framework);
      })
      .catch(() => {
        setInterviewerIntent([]);
        setWinningFramework(null);
      })
      .finally(() => setCoachingLoading(false));
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
      <DialogContent className="max-w-6xl w-[95vw] max-h-[96vh] overflow-hidden flex flex-col p-0 gap-0 rounded-xl border-0 shadow-xl top-[2vh] tranneutral-y-0 sm:top-[50%] sm:tranneutral-y-[-50%]">
        <DialogHeader className="px-6 pt-6 pb-4 text-left space-y-0 border-b border-border/50">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Question Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-0">
            {/* Left: Question content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {question.company.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300">
                    <User className="h-3.5 w-3.5" />
                    {question.role.toUpperCase()}
                  </span>
                </div>
                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleBookmark()}
                  disabled={isBookmarkToggling || !user}
                  className={`flex items-center gap-1.5 ${
                    isBookmarked 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : ""
                  }`}
                  title={user ? (isBookmarked ? "Remove from saved" : "Save question") : "Sign in to save"}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? "Saved" : "Save"}
                </Button>
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

              {/* Interviewer's Intent */}
              {coachingLoading ? (
                <p className="text-sm text-muted-foreground">Loading coaching…</p>
              ) : interviewerIntent.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                    The interviewer&apos;s intent
                  </p>
                  <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-neutral-300">
                      {interviewerIntent.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {/* Winning Answer Framework (STAR) */}
              {!coachingLoading && winningFramework && (
                <div>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                    Winning answer framework
                  </p>
                  <div className="space-y-4 rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                    <div className="flex gap-2">
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" aria-hidden />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Situation</p>
                        <p className="mt-1 text-sm text-neutral-300">{winningFramework.situation || "—"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" aria-hidden />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Task</p>
                        <p className="mt-1 text-sm text-neutral-300">{winningFramework.task || "—"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" aria-hidden />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Action</p>
                        {winningFramework.action?.length ? (
                          <ul className="mt-1 list-disc list-inside space-y-1 text-sm text-neutral-300">
                            {winningFramework.action.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-sm text-neutral-300">—</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" aria-hidden />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Result</p>
                        <p className="mt-1 text-sm text-neutral-300">{winningFramework.result || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showEditButton && onEditQuestion && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onEditQuestion(question)}
                    className="inline-flex items-center rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Edit Question
                  </button>
                </div>
              )}
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
          <span className="text-sm text-neutral-400">
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
