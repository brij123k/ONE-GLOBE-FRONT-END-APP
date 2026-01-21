import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Eye, Wand2 } from "lucide-react";

interface RuleState {
  enabled: boolean;
  value: string;
}

interface ClassicRulesPanelProps {
  type: "title" | "description";
  onPreview?: () => void;
  onApply?: () => void;
}

export function ClassicRulesPanel({ type, onPreview, onApply }: ClassicRulesPanelProps) {
  const [charLimitMin, setCharLimitMin] = useState<RuleState>({ enabled: true, value: "30" });
  const [charLimitMax, setCharLimitMax] = useState<RuleState>({ enabled: true, value: "70" });
  const [wordLimit, setWordLimit] = useState<RuleState>({ enabled: false, value: "10" });
  const [prefix, setPrefix] = useState<RuleState>({ enabled: false, value: "" });
  const [suffix, setSuffix] = useState<RuleState>({ enabled: false, value: "" });
  const [removeWords, setRemoveWords] = useState<RuleState>({ enabled: false, value: "" });
  const [findReplace, setFindReplace] = useState({ enabled: false, find: "", replace: "" });

  // Description-specific
  const [paragraphLength, setParagraphLength] = useState<RuleState>({ enabled: false, value: "3" });
  const [bulletPoints, setBulletPoints] = useState<RuleState>({ enabled: false, value: "true" });
  const [tone, setTone] = useState<RuleState>({ enabled: false, value: "professional" });
  const [keywordDensity, setKeywordDensity] = useState<RuleState>({ enabled: false, value: "2" });

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Wand2 className="w-4 h-4 text-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Classic Rules</h3>
      </div>

      <div className="space-y-4">
        {type === "title" ? (
          <>
            {/* Character Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Character Limit</Label>
                <Switch
                  checked={charLimitMin.enabled}
                  onCheckedChange={(checked) => {
                    setCharLimitMin({ ...charLimitMin, enabled: checked });
                    setCharLimitMax({ ...charLimitMax, enabled: checked });
                  }}
                />
              </div>
              {charLimitMin.enabled && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      value={charLimitMin.value}
                      onChange={(e) => setCharLimitMin({ ...charLimitMin, value: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      value={charLimitMax.value}
                      onChange={(e) => setCharLimitMax({ ...charLimitMax, value: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Word Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Word Limit</Label>
                <Switch
                  checked={wordLimit.enabled}
                  onCheckedChange={(checked) => setWordLimit({ ...wordLimit, enabled: checked })}
                />
              </div>
              {wordLimit.enabled && (
                <Input
                  type="number"
                  value={wordLimit.value}
                  onChange={(e) => setWordLimit({ ...wordLimit, value: e.target.value })}
                  placeholder="Max words"
                />
              )}
            </div>

            <Separator />

            {/* Prefix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Add Prefix</Label>
                <Switch
                  checked={prefix.enabled}
                  onCheckedChange={(checked) => setPrefix({ ...prefix, enabled: checked })}
                />
              </div>
              {prefix.enabled && (
                <Input
                  value={prefix.value}
                  onChange={(e) => setPrefix({ ...prefix, value: e.target.value })}
                  placeholder="e.g., [NEW] or Sale -"
                />
              )}
            </div>

            <Separator />

            {/* Suffix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Add Suffix</Label>
                <Switch
                  checked={suffix.enabled}
                  onCheckedChange={(checked) => setSuffix({ ...suffix, enabled: checked })}
                />
              </div>
              {suffix.enabled && (
                <Input
                  value={suffix.value}
                  onChange={(e) => setSuffix({ ...suffix, value: e.target.value })}
                  placeholder="e.g., - Free Shipping"
                />
              )}
            </div>

            <Separator />

            {/* Remove Words */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Remove Words</Label>
                <Switch
                  checked={removeWords.enabled}
                  onCheckedChange={(checked) => setRemoveWords({ ...removeWords, enabled: checked })}
                />
              </div>
              {removeWords.enabled && (
                <Textarea
                  value={removeWords.value}
                  onChange={(e) => setRemoveWords({ ...removeWords, value: e.target.value })}
                  placeholder="Enter words to remove, separated by commas"
                  className="resize-none"
                  rows={2}
                />
              )}
            </div>

            <Separator />

            {/* Find & Replace */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Find & Replace</Label>
                <Switch
                  checked={findReplace.enabled}
                  onCheckedChange={(checked) => setFindReplace({ ...findReplace, enabled: checked })}
                />
              </div>
              {findReplace.enabled && (
                <div className="space-y-2">
                  <Input
                    value={findReplace.find}
                    onChange={(e) => setFindReplace({ ...findReplace, find: e.target.value })}
                    placeholder="Find..."
                  />
                  <Input
                    value={findReplace.replace}
                    onChange={(e) => setFindReplace({ ...findReplace, replace: e.target.value })}
                    placeholder="Replace with..."
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Paragraph Length */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Paragraph Length</Label>
                <Switch
                  checked={paragraphLength.enabled}
                  onCheckedChange={(checked) => setParagraphLength({ ...paragraphLength, enabled: checked })}
                />
              </div>
              {paragraphLength.enabled && (
                <Input
                  type="number"
                  value={paragraphLength.value}
                  onChange={(e) => setParagraphLength({ ...paragraphLength, value: e.target.value })}
                  placeholder="Sentences per paragraph"
                />
              )}
            </div>

            <Separator />

            {/* Bullet Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Format as Bullet Points</Label>
                <Switch
                  checked={bulletPoints.enabled}
                  onCheckedChange={(checked) => setBulletPoints({ ...bulletPoints, enabled: checked })}
                />
              </div>
            </div>

            <Separator />

            {/* Tone Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tone</Label>
                <Switch
                  checked={tone.enabled}
                  onCheckedChange={(checked) => setTone({ ...tone, enabled: checked })}
                />
              </div>
              {tone.enabled && (
                <select
                  value={tone.value}
                  onChange={(e) => setTone({ ...tone, value: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="salesy">Salesy</option>
                </select>
              )}
            </div>

            <Separator />

            {/* Keyword Density */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Keyword Density</Label>
                <Switch
                  checked={keywordDensity.enabled}
                  onCheckedChange={(checked) => setKeywordDensity({ ...keywordDensity, enabled: checked })}
                />
              </div>
              {keywordDensity.enabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={keywordDensity.value}
                    onChange={(e) => setKeywordDensity({ ...keywordDensity, value: e.target.value })}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 space-y-2">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onPreview}
        >
          <Eye className="w-4 h-4" />
          Preview Changes
        </Button>
        <Button
          className="w-full bg-gradient-ai hover:opacity-90 text-primary-foreground gap-2"
          onClick={onApply}
        >
          <Wand2 className="w-4 h-4" />
          Apply to All Selected
        </Button>
      </div>
    </div>
  );
}
