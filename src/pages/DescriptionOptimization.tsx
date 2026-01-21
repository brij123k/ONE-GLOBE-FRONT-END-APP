import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AnalyticsCard } from "@/components/optimization/AnalyticsCard";
import { AIPromptCard } from "@/components/optimization/AIPromptCard";
import { ClassicRulesPanel } from "@/components/optimization/ClassicRulesPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Target,
  BarChart3,
  MessageSquare,
  Brain,
  Eye,
  Plus,
  Sparkles,
} from "lucide-react";

const aiPrompts = [
  { title: "SEO Description", prompt: "Generate an SEO-optimized product description with naturally integrated keywords and clear value propositions." },
  { title: "Conversion Focused", prompt: "Create a compelling description designed to maximize conversions with persuasive language and clear CTAs." },
  { title: "Feature Highlights", prompt: "Write a description that clearly presents product features in an easy-to-scan format with bullet points." },
  { title: "Storytelling", prompt: "Craft an engaging narrative description that connects emotionally with the target customer." },
  { title: "Technical Specs", prompt: "Generate a detailed technical description with specifications formatted for easy reading." },
  { title: "Benefits First", prompt: "Create a customer-centric description leading with benefits before features." },
  { title: "Comparison Ready", prompt: "Write a description that positions the product favorably against alternatives." },
  { title: "Mobile Optimized", prompt: "Generate a concise description optimized for mobile viewing with short paragraphs." },
  { title: "Q&A Format", prompt: "Create a description in FAQ format addressing common customer questions." },
  { title: "Social Proof", prompt: "Write a description incorporating social proof elements and trust signals." },
];

const selectedProducts = [
  { id: "1", title: "Premium Wireless Headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop" },
  { id: "2", title: "Organic Cotton T-Shirt", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop" },
];

export default function DescriptionOptimization() {
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);

  return (
    <AppLayout title="Description Optimization">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Description Optimization</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Create compelling product descriptions with AI assistance
            </p>
          </div>
          <Dialog open={isProductsModalOpen} onOpenChange={setIsProductsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Eye className="w-4 h-4" />
                View Selected Products ({selectedProducts.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Selected Products</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <span className="text-sm font-medium text-foreground">{product.title}</span>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <AnalyticsCard
            icon={FileText}
            title="Word Count"
            value={156}
            maxValue={300}
            suffix="/300"
            description="Target: 150-300 words"
            variant="success"
          />
          <AnalyticsCard
            icon={Target}
            title="Keyword Density"
            value={2.4}
            maxValue={5}
            suffix="%"
            description="Optimal: 1-3%"
            variant="success"
          />
          <AnalyticsCard
            icon={BarChart3}
            title="Readability"
            value={78}
            description="Easy to read"
            variant="success"
          />
          <AnalyticsCard
            icon={MessageSquare}
            title="Engagement Score"
            value={65}
            description="Good engagement potential"
            variant="warning"
          />
          <AnalyticsCard
            icon={Brain}
            title="AI Confidence"
            value={91}
            description="High optimization confidence"
            variant="success"
          />
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {/* Left Column - AI Prompts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Optimization Prompts
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Custom Prompt
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Custom Prompt</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Prompt Name</label>
                      <input
                        type="text"
                        className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
                        placeholder="Enter prompt name..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Prompt Content</label>
                      <textarea
                        className="w-full mt-1 p-3 rounded-md border border-input bg-background text-sm resize-none"
                        rows={4}
                        placeholder="Enter your custom AI prompt..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button className="bg-gradient-ai text-primary-foreground">Save Prompt</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiPrompts.map((prompt, index) => (
                <AIPromptCard
                  key={index}
                  title={prompt.title}
                  prompt={prompt.prompt}
                />
              ))}
            </div>
          </div>

          {/* Right Column - Classic Rules */}
          <div className="lg:sticky lg:top-6 h-fit">
            <ClassicRulesPanel type="description" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
