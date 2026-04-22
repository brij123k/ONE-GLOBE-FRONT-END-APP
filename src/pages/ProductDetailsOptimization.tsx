import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Award,
  Brain,
  CheckCircle,
  ChevronLeft,
  FileText,
  Globe,
  Image,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface DetailImage {
  imageId: string;
  imageUrl: string;
  imageName?: string;
  altText?: string;
}

interface DetailProduct {
  _id: string;
  productId: string;
  productImage?: string;
  title?: string;
  description?: string;
  descriptionHtml?: string;
  metaTitle?: string;
  metaDescription?: string;
  handle?: string;
  images?: DetailImage[];
  optimized?: boolean;
}

interface OptimizedImage {
  imageId: string;
  imageUrl: string;
  oldAlt?: string;
  newAlt?: string;
  oldName?: string;
  newName?: string;
}

interface DetailValues {
  title?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  handle?: string;
  imageAlt?: string;
  imageName?: string;
}

interface DetailOptimizationResult {
  productId: string;
  imageAnalyzed?: boolean;
  oldValues: DetailValues;
  newValues: DetailValues;
  images: OptimizedImage[];
}

interface SaveResult {
  productId: string;
  title: string;
  ok: boolean;
  message: string;
  productUpdated?: boolean;
  imageResults?: { imageId: string; status: string; errors?: string[] }[];
}

interface ScopeChoice {
  image: boolean;
  title: boolean;
  description: boolean;
}

type Mode = "preview" | "apply";

const formulas: Array<{
  id: string;
  name: string;
  description: string;
  scope: ScopeChoice;
  icon: JSX.Element;
}> = [
    {
    id: "image_seo",
    name: "Image SEO",
    description: "Analyze product images and improve alt text plus image filenames.",
    scope: { image: true, title: false, description: false },
    icon: <Image className="w-4 h-4 text-blue-700" />,
  },
  {
    id: "content",
    name: "Title + Description",
    description: "Use product copy to improve searchable titles, descriptions, meta title, and meta description.",
    scope: { image: false, title: true, description: true },
    icon: <FileText className="w-4 h-4 text-blue-700" />,
  },
  {
    id: "complete",
    name: "Complete Product SEO",
    description: "Optimize title, description, meta fields, handle, image alt text, and image name.",
    scope: { image: true, title: true, description: true },
    icon: <Sparkles className="w-4 h-4 text-blue-700" />,
  },
];

const getPlainDescription = (product: DetailProduct) =>
  product.descriptionHtml || product.description || "";

const compactText = (value = "", max = 180) => {
  const text = value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const getPrimaryImage = (product: DetailProduct) => product.images?.[0];

const buildSavePayload = (result: DetailOptimizationResult) => ({
  productId: result.productId,
  oldTitle: result.oldValues.title || "",
  newTitle: result.newValues.title || result.oldValues.title || "",
  oldDescription: result.oldValues.description || "",
  newDescription: result.newValues.description || result.oldValues.description || "",
  oldMetaTitle: result.oldValues.metaTitle || "",
  newMetaTitle: result.newValues.metaTitle || result.oldValues.metaTitle || "",
  oldMetaDescription: result.oldValues.metaDescription || "",
  newMetaDescription: result.newValues.metaDescription || result.oldValues.metaDescription || "",
  oldHandle: result.oldValues.handle || "",
  newHandle: result.newValues.handle || result.oldValues.handle || "",
  images: result.images || [],
});

export default function ProductDetailsOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<DetailProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormulaId, setSelectedFormulaId] = useState("image_seo");
  const [scope, setScope] = useState<ScopeChoice>({ image: true, title: false, description: false });
  const [results, setResults] = useState<DetailOptimizationResult[]>([]);
  const [saveResults, setSaveResults] = useState<SaveResult[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showSaveSummaryModal, setShowSaveSummaryModal] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [mode, setMode] = useState<Mode>("preview");

  const selectedFormula = useMemo(
    () => formulas.find((formula) => formula.id === selectedFormulaId) || formulas[0],
    [selectedFormulaId],
  );

  const optimizedCount = products.filter((product) => product.optimized).length;
  const changedProducts = results.filter((result) => hasAnyChange(result)).length;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.detailProducts);
      setProducts(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch detail products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const selectFormula = (formulaId: string) => {
    const formula = formulas.find((item) => item.id === formulaId) || formulas[0];
    setSelectedFormulaId(formula.id);
    setScope(formula.scope);
  };

  const runOptimization = async (apply: boolean) => {
    if (!products.length) return;

    setMode(apply ? "apply" : "preview");
    setResults([]);
    setSaveResults([]);
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Starting product detail optimization..." });

    const nextResults: DetailOptimizationResult[] = [];

    for (let index = 0; index < products.length; index += 1) {
      const product = products[index];
      const primaryImage = getPrimaryImage(product);
      setProgress({
        current: index + 1,
        total: products.length,
        status: `Optimizing ${product.title || "product"}...`,
      });

      try {
        const response = await postApi(ApiConfig.detailOptimize, {
          productId: product.productId,
          imageId: primaryImage?.imageId || "",
          image: scope.image,
          title: scope.title,
          description: scope.description,
          apply,
        });

        nextResults.push(normalizeOptimizationResult(response, product));
      } catch (error) {
        console.error("Detail optimization failed:", error);
        nextResults.push(fallbackResult(product));
      }
    }

    setResults(nextResults);
    setShowProgressModal(false);
    setShowComparisonModal(true);
  };

  const savePreviewResults = async () => {
    if (!results.length) return;

    setShowComparisonModal(false);
    setShowProgressModal(true);
    setProgress({ current: 0, total: results.length, status: "Saving optimized product details..." });

    const nextSaveResults: SaveResult[] = [];

    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      const product = products.find((item) => item.productId === result.productId);
      setProgress({
        current: index + 1,
        total: results.length,
        status: `Saving ${product?.title || result.productId}...`,
      });

      try {
        const response = await postApi(ApiConfig.detailSave, buildSavePayload(result));
        nextSaveResults.push({
          productId: result.productId,
          title: product?.title || result.newValues.title || result.oldValues.title || "Product",
          ok: Boolean(response?.productUpdated || response?.message),
          message: response?.message || "Detail optimization saved to Shopify",
          productUpdated: response?.productUpdated,
          imageResults: response?.imageResults || [],
        });
      } catch (error) {
        console.error("Detail save failed:", error);
        nextSaveResults.push({
          productId: result.productId,
          title: product?.title || result.oldValues.title || "Product",
          ok: false,
          message: "Failed to save product detail optimization",
          imageResults: [],
        });
      }
    }

    setSaveResults(nextSaveResults);
    setShowProgressModal(false);
    setShowSaveSummaryModal(true);
    fetchProducts();
  };

  if (loading) {
    return (
      <AppLayout title="Detail Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Detail Optimization">
      <div className="p-5 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/products?service=detail")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-700 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Bulk product detail SEO</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">Optimize Product Details</h1>
            <p className="text-xs text-gray-500">Generate title, description, meta, handle, image alt, and image name improvements.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-800 text-white px-4 py-1.5 rounded-full text-[12.5px] font-bold shadow-md shadow-blue-900/25">
            <Package className="w-3.5 h-3.5" /> {products.length} Products
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Products Loaded" value={products.length} sub="From /api/detail/products" />
          <StatCard label="Already Optimized" value={optimizedCount} sub="Marked by backend" />
          <StatCard label="Images Found" value={products.reduce((sum, product) => sum + (product.images?.length || 0), 0)} sub="Available for image SEO" />
          <StatCard label="Pending Results" value={changedProducts} sub="Changed in latest run" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4 items-start">
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b-[1.5px] border-gray-200">
              <h2 className="text-[14px] font-extrabold text-gray-900">Optimization Formula</h2>
              <p className="text-[11.5px] text-gray-500 mt-1">Choose what the AI should optimize for each product.</p>
            </div>

            <div className="p-4 space-y-3">
              {formulas.map((formula) => {
                const isActive = selectedFormulaId === formula.id;
                return (
                  <button
                    key={formula.id}
                    onClick={() => selectFormula(formula.id)}
                    className={`w-full text-left border-[1.5px] rounded-xl p-4 transition-all ${
                      isActive ? "border-blue-700 bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">{formula.icon}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-gray-900">{formula.name}</p>
                          {isActive && <CheckCircle className="w-4 h-4 text-blue-700" />}
                        </div>
                        <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed">{formula.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-4 pb-4 space-y-3">
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Payload switches</p>
              <ToggleRow label="Analyze image" checked={scope.image} onChange={(value) => setScope((prev) => ({ ...prev, image: value }))} />
              <ToggleRow label="Optimize title/meta/handle" checked={scope.title} onChange={(value) => setScope((prev) => ({ ...prev, title: value }))} />
              <ToggleRow label="Optimize description" checked={scope.description} onChange={(value) => setScope((prev) => ({ ...prev, description: value }))} />
            </div>

            <div className="p-4 border-t-[1.5px] border-gray-200 bg-gray-50 space-y-2">
              <Button onClick={() => runOptimization(false)} disabled={!scope.image && !scope.title && !scope.description || !products.length} className="w-full bg-blue-600 hover:bg-blue-800 gap-2">
                <Play className="w-4 h-4" /> Optimize & Preview
              </Button>
              <Button onClick={() => runOptimization(true)} disabled={!scope.image && !scope.title && !scope.description || !products.length} className="w-full bg-purple-600 hover:bg-purple-700 gap-2">
                <Zap className="w-4 h-4" /> Optimize & Apply
              </Button>
            </div>
          </div>

          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b-[1.5px] border-gray-200 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-extrabold text-gray-900">Products</h2>
                <p className="text-[11.5px] text-gray-500">All records returned by the detail products API.</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchProducts} className="gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[13px] font-semibold text-gray-400">No product details found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {products.map((product) => {
                  const primaryImage = getPrimaryImage(product);
                  return (
                    <div key={product.productId} className="grid grid-cols-[52px_1fr_auto] gap-3 p-3 items-center hover:bg-gray-50 transition-colors">
                      <img
                        src={product.productImage || primaryImage?.imageUrl || "/placeholder.svg"}
                        alt={primaryImage?.altText || product.title || "product"}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate">{product.title || "Untitled product"}</p>
                          {product.optimized && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Optimized</Badge>}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{compactText(getPlainDescription(product), 120) || "No description"}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10.5px] text-gray-400">
                          <span>{product.images?.length || 0} images</span>
                          <span>Handle: {product.handle || "not set"}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => runSingleProduct(product)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-800 text-white text-[11.5px] font-bold transition-all"
                      >
                        <Wand2 className="w-3 h-3" /> Preview
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> Working through products
            </DialogTitle>
            <DialogDescription>{selectedFormula.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Progress value={progress.total ? (progress.current / progress.total) * 100 : 0} className="h-2" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{progress.status}</p>
              <p className="text-xs text-gray-500 mt-1">{progress.current} of {progress.total} processed</p>
            </div>
            <div className="flex justify-center">
              <Brain className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
        <DialogContent className="max-w-6xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" /> Product Detail Comparison
            </DialogTitle>
            <DialogDescription>
              {mode === "apply"
                ? "Products were optimized with apply: true. Review the before and after values below."
                : "Review every optimized product before saving the changes to Shopify."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3">
            <MiniMetric label="Products optimized" value={results.length} />
            <MiniMetric label="Products changed" value={changedProducts} />
            <MiniMetric label="Images analyzed" value={results.filter((result) => result.imageAnalyzed).length} />
          </div>

          <div className="space-y-4">
            {results.map((result, index) => {
              const product = products.find((item) => item.productId === result.productId);
              return (
                <div key={`${result.productId}-${index}`} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                    <img
                      src={product?.productImage || result.images?.[0]?.imageUrl || "/placeholder.svg"}
                      alt={product?.title || result.newValues.title || "product"}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-extrabold text-gray-900 truncate">{product?.title || result.oldValues.title || result.productId}</p>
                      <p className="text-[11px] text-gray-500 truncate">{result.productId}</p>
                    </div>
                    <Badge className={hasAnyChange(result) ? "ml-auto bg-green-100 text-green-700 hover:bg-green-100" : "ml-auto bg-gray-100 text-gray-600 hover:bg-gray-100"}>
                      {hasAnyChange(result) ? "Changed" : "No change"}
                    </Badge>
                  </div>

                  <div className="p-4 space-y-3">
                    <CompareRow label="Title" oldValue={result.oldValues.title} newValue={result.newValues.title} />
                    <CompareRow label="Description" oldValue={result.oldValues.description} newValue={result.newValues.description} multiline />
                    <CompareRow label="Meta Title" oldValue={result.oldValues.metaTitle} newValue={result.newValues.metaTitle} />
                    <CompareRow label="Meta Description" oldValue={result.oldValues.metaDescription} newValue={result.newValues.metaDescription} multiline />
                    <CompareRow label="Handle" oldValue={result.oldValues.handle} newValue={result.newValues.handle} />
                    <CompareRow label="Image Alt" oldValue={result.oldValues.imageAlt} newValue={result.newValues.imageAlt} />
                    <CompareRow label="Image Name" oldValue={result.oldValues.imageName} newValue={result.newValues.imageName} />

                    {result.images?.length > 0 && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                        <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-2">Image changes</p>
                        <div className="space-y-2">
                          {result.images.map((image) => (
                            <div key={image.imageId} className="grid grid-cols-[44px_1fr] gap-3 items-center">
                              <img src={image.imageUrl || "/placeholder.svg"} alt={image.newAlt || image.oldAlt || "product image"} className="w-11 h-11 rounded-lg object-cover border border-blue-100" />
                              <div className="grid md:grid-cols-2 gap-2 text-[11.5px]">
                                <p><span className="font-bold text-gray-700">Alt:</span> {image.oldAlt || "Empty"} {"->"} {image.newAlt || "Empty"}</p>
                                <p><span className="font-bold text-gray-700">Name:</span> {image.oldName || "Empty"} {"->"} {image.newName || "Empty"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sticky bottom-0 bg-white pt-3">
            <Button variant="outline" onClick={() => setShowComparisonModal(false)}>Close</Button>
            {mode === "preview" && (
              <Button onClick={savePreviewResults} className="bg-green-600 hover:bg-green-700 gap-2">
                <Save className="w-4 h-4" /> Save All to Shopify
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveSummaryModal} onOpenChange={setShowSaveSummaryModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" /> Save Summary
            </DialogTitle>
            <DialogDescription>Shopify update results for the optimized product details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            {saveResults.map((result) => (
              <div key={result.productId} className="border rounded-lg p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${result.ok ? "bg-green-100" : "bg-red-100"}`}>
                  {result.ok ? <CheckCircle className="w-4 h-4 text-green-700" /> : <RefreshCw className="w-4 h-4 text-red-700" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{result.title}</p>
                  <p className="text-[11.5px] text-gray-500">{result.message}</p>
                  {result.imageResults?.length ? (
                    <p className="text-[10.5px] text-gray-400 mt-1">{result.imageResults.length} image update results returned</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSaveSummaryModal(false)} className="bg-blue-600 hover:bg-blue-800">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );

  async function runSingleProduct(product: DetailProduct) {
    setMode("preview");
    setResults([]);
    setShowProgressModal(true);
    setProgress({ current: 1, total: 1, status: `Optimizing ${product.title || "product"}...` });

    try {
      const primaryImage = getPrimaryImage(product);
      const response = await postApi(ApiConfig.detailOptimize, {
        productId: product.productId,
        imageId: primaryImage?.imageId || "",
        image: scope.image,
        title: scope.title,
        description: scope.description,
        apply: false,
      });
      setResults([normalizeOptimizationResult(response, product)]);
    } catch (error) {
      console.error("Single detail optimization failed:", error);
      setResults([fallbackResult(product)]);
    } finally {
      setShowProgressModal(false);
      setShowComparisonModal(true);
    }
  }
}

function normalizeOptimizationResult(response: any, product: DetailProduct): DetailOptimizationResult {
  const primaryImage = getPrimaryImage(product);
  const oldValues = response?.oldValues || {};
  const newValues = response?.newValues || {};

  return {
    productId: response?.productId || product.productId,
    imageAnalyzed: Boolean(response?.imageAnalyzed),
    oldValues: {
      title: oldValues.title ?? product.title ?? "",
      description: oldValues.description ?? product.descriptionHtml ?? product.description ?? "",
      metaTitle: oldValues.metaTitle ?? product.metaTitle ?? "",
      metaDescription: oldValues.metaDescription ?? product.metaDescription ?? "",
      handle: oldValues.handle ?? product.handle ?? "",
      imageAlt: oldValues.imageAlt ?? primaryImage?.altText ?? "",
      imageName: oldValues.imageName ?? primaryImage?.imageName ?? "",
    },
    newValues: {
      title: newValues.title ?? oldValues.title ?? product.title ?? "",
      description: newValues.description ?? oldValues.description ?? product.descriptionHtml ?? product.description ?? "",
      metaTitle: newValues.metaTitle ?? oldValues.metaTitle ?? product.metaTitle ?? "",
      metaDescription: newValues.metaDescription ?? oldValues.metaDescription ?? product.metaDescription ?? "",
      handle: newValues.handle ?? oldValues.handle ?? product.handle ?? "",
      imageAlt: newValues.imageAlt ?? oldValues.imageAlt ?? primaryImage?.altText ?? "",
      imageName: newValues.imageName ?? oldValues.imageName ?? primaryImage?.imageName ?? "",
    },
    images: Array.isArray(response?.images) ? response.images : [],
  };
}

function fallbackResult(product: DetailProduct): DetailOptimizationResult {
  const primaryImage = getPrimaryImage(product);
  return {
    productId: product.productId,
    imageAnalyzed: false,
    oldValues: {
      title: product.title || "",
      description: product.descriptionHtml || product.description || "",
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
      handle: product.handle || "",
      imageAlt: primaryImage?.altText || "",
      imageName: primaryImage?.imageName || "",
    },
    newValues: {
      title: product.title || "",
      description: product.descriptionHtml || product.description || "",
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
      handle: product.handle || "",
      imageAlt: primaryImage?.altText || "",
      imageName: primaryImage?.imageName || "",
    },
    images: primaryImage
      ? [{
          imageId: primaryImage.imageId,
          imageUrl: primaryImage.imageUrl,
          oldAlt: primaryImage.altText || "",
          newAlt: primaryImage.altText || "",
          oldName: primaryImage.imageName || "",
          newName: primaryImage.imageName || "",
        }]
      : [],
  };
}

function hasAnyChange(result: DetailOptimizationResult) {
  const fields: Array<keyof DetailValues> = ["title", "description", "metaTitle", "metaDescription", "handle", "imageAlt", "imageName"];
  return fields.some((field) => (result.oldValues[field] || "") !== (result.newValues[field] || ""))
    || result.images.some((image) => (image.oldAlt || "") !== (image.newAlt || "") || (image.oldName || "") !== (image.newName || ""));
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-xl p-3 text-center bg-gray-50">
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-[11.5px] text-gray-500">{label}</p>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-[13px] font-semibold text-gray-800">{label}</span>
      <button onClick={() => onChange(!checked)} className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
        <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-[3px]"}`} />
      </button>
    </div>
  );
}

function CompareRow({ label, oldValue = "", newValue = "", multiline = false }: { label: string; oldValue?: string; newValue?: string; multiline?: boolean }) {
  const changed = oldValue !== newValue;
  return (
    <div className="grid grid-cols-1 md:grid-cols-[130px_1fr_1fr] gap-2 items-start">
      <div className="flex items-center gap-2 pt-2">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        {changed && <span className="w-2 h-2 rounded-full bg-green-500" />}
      </div>
      <ValueBox title="Old" value={oldValue} multiline={multiline} muted />
      <ValueBox title="New" value={newValue} multiline={multiline} />
    </div>
  );
}

function ValueBox({ title, value, multiline = false, muted = false }: { title: string; value?: string; multiline?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${muted ? "bg-gray-50 border-gray-200" : "bg-green-50/50 border-green-200"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${muted ? "text-gray-400" : "text-green-700"}`}>{title}</p>
      <p className={`text-[12px] leading-relaxed ${multiline ? "max-h-24 overflow-y-auto" : ""} ${muted ? "text-gray-600" : "text-gray-900 font-medium"}`}>
        {compactText(value || "Empty", multiline ? 600 : 180)}
      </p>
    </div>
  );
}
