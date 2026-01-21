import { useState } from "react";
import { Edit3, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AIPromptCardProps {
  title: string;
  prompt: string;
  onSave?: (prompt: string) => void;
}

export function AIPromptCard({ title, prompt: initialPrompt, onSave }: AIPromptCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [editedPrompt, setEditedPrompt] = useState(initialPrompt);

  const handleSave = () => {
    setPrompt(editedPrompt);
    setIsEditing(false);
    onSave?.(editedPrompt);
  };

  const handleCancel = () => {
    setEditedPrompt(prompt);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 transition-smooth",
        isEditing && "ring-2 ring-primary/20 border-primary"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-ai flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <h4 className="font-medium text-sm text-foreground">{title}</h4>
        </div>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
              onClick={handleSave}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      {isEditing ? (
        <Textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          className="min-h-[80px] text-sm resize-none"
          autoFocus
        />
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">{prompt}</p>
      )}
    </div>
  );
}
