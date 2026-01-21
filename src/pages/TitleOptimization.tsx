import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  RulerIcon,
  Target,
  BarChart3,
  Copy,
  Brain,
  Eye,
  Plus,
  Sparkles,
} from "lucide-react";

const aiPrompts = [
  { title: "SEO-Friendly Title", prompt: "Generate an SEO-optimized product title that includes the main keyword naturally while maintaining readability and appeal." },
  { title: "High-CTR Title", prompt: "Create a compelling product title designed to maximize click-through rates with power words and urgency." },
  { title: "Brand Voice Title", prompt: "Rewrite the product title to match our brand's professional yet approachable tone while highlighting key features." },
  { title: "Marketplace Optimized", prompt: "Optimize the title for marketplace search algorithms, front-loading important keywords and specifications." },
  { title: "Short & Punchy", prompt: "Create a concise, impactful title under 50 characters that captures the product's essence." },
  { title: "Feature-Focused", prompt: "Generate a title that emphasizes the product's top 2-3 features and benefits." },
  { title: "Benefit-Driven", prompt: "Create a title that leads with the primary customer benefit rather than just features." },
  { title: "Comparison Title", prompt: "Generate a title that positions the product favorably against competitors." },
  { title: "Seasonal Title", prompt: "Adapt the title for seasonal relevance and trending searches." },
  { title: "A/B Test Variant", prompt: "Create an alternative title variation for A/B testing with a different structure." },
];

const selectedProducts = [
  { id: "1", title: "Premium Wireless Headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop" },
  { id: "2", title: "Organic Cotton T-Shirt", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop" },
  { id: "5", title: "Bluetooth Smart Watch", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop" },
];

export default function TitleOptimization() {
  const [searchParams] = useSearchParams();
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);

  return (
    <AppLayout title="Title Optimization">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Title Optimization</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Optimize product titles with AI-powered suggestions
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
            icon={RulerIcon}
            title="Title Length"
            value={72}
            suffix="/100"
            description="Optimal range: 50-80 chars"
            variant="success"
          />
          <AnalyticsCard
            icon={Target}
            title="Keyword Relevance"
            value={85}
            description="High keyword match"
            variant="success"
          />
          <AnalyticsCard
            icon={BarChart3}
            title="SEO Score"
            value={68}
            description="Good, room to improve"
            variant="warning"
          />
          <AnalyticsCard
            icon={Copy}
            title="Duplicate Words"
            value={2}
            maxValue={10}
            suffix=""
            description="2 duplicate words found"
            variant="warning"
          />
          <AnalyticsCard
            icon={Brain}
            title="AI Confidence"
            value={94}
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
            <ClassicRulesPanel type="title" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
