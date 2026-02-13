import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  DollarSign,
  Percent,
  Eye,
  Save,
  RefreshCw,
  CheckCircle,
  Target,
  Award,
  Sparkles,
  ShoppingBag,
  Layers,
  Dice1,
  Calculator,
  Rocket,
  Shield,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Variant {
  variantId: string;
  title: string;
  sku: string | null;
  image: string | null;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  inventoryQuantity: number;
  _id: string;
}

interface Product {
  _id: string;
  shopId: string;
  productId: string;
  title: string;
  variants: Variant[];
  productImage: string;
  createdAt: string;
  updatedAt: string;
}

interface CalculatedVariant {
  variantId: string;
  title: string;
  image: string | null;
  costPrice: number;
  price: number;
  compareAtPrice: number;
  profit: number;
}

interface CalculationResult {
  productId: string;
  title: string;
  minProfit: number;
  discount: number;
  variants: CalculatedVariant[];
}

export default function PriceOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalVariants: 0,
    productsWithCost: 0,
  });

  // Profit configuration
  const [profitMode, setProfitMode] = useState<'fixed' | 'range'>('fixed');
  const [fixedProfit, setFixedProfit] = useState<number>(20);
  const [minProfit, setMinProfit] = useState<number>(15);
  const [maxProfit, setMaxProfit] = useState<number>(30);

  // Discount configuration
  const [enableDiscount, setEnableDiscount] = useState<boolean>(false);
  const [discountMode, setDiscountMode] = useState<'fixed' | 'range'>('fixed');
  const [fixedDiscount, setFixedDiscount] = useState<number>(20);
  const [minDiscount, setMinDiscount] = useState<number>(10);
  const [maxDiscount, setMaxDiscount] = useState<number>(30);

  // Global even-only setting
  const [evenOnly, setEvenOnly] = useState<boolean>(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStorePriceProduct);
      const productsData = response || [];
      setProducts(productsData);

      // Calculate stats
      if (productsData.length > 0) {
        const totalVariants = productsData.reduce((acc, p) => acc + p.variants.length, 0);
        const productsWithCost = productsData.filter(p =>
          p.variants.some(v => v.costPrice > 0)
        ).length;

        setStats({
          totalProducts: productsData.length,
          totalVariants,
          productsWithCost,
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Random number generators
  const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const getRandomEvenInt = (min: number, max: number): number => {
    let num = getRandomInt(min, max);
    if (num % 2 !== 0) {
      if (num + 1 <= max) return num + 1;
      if (num - 1 >= min) return num - 1;
    }
    return num;
  };

  // Generate profit value for a product
  const generateProfit = (): number => {
    if (profitMode === 'fixed') {
      return fixedProfit;
    } else {
      return evenOnly ? getRandomEvenInt(minProfit, maxProfit) : getRandomInt(minProfit, maxProfit);
    }
  };

  // Generate discount value for a product (if enabled)
  const generateDiscount = (): number | undefined => {
    if (!enableDiscount) return undefined;
    if (discountMode === 'fixed') {
      return fixedDiscount;
    } else {
      return evenOnly ? getRandomEvenInt(minDiscount, maxDiscount) : getRandomInt(minDiscount, maxDiscount);
    }
  };

  // Preview: calculate prices
  const handlePreview = async () => {
    if (products.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "Calculating optimal prices..."
    });

    const results: CalculationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const profit = generateProfit();
      const discount = generateDiscount() ?? 0;

      setProgress({
        current: i + 1,
        total: products.length,
        status: `Calculating for: ${product.title.substring(0, 30)}...`
      });

      try {
        const payload = {
          productId: product.productId,
          minProfit: profit,
          discount: discount,
        };

        const response = await postApi(ApiConfig.priceCalulation, payload);
        results.push(response);

        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error calculating for ${product.title}:`, error);
      }
    }

    setCalculationResults(results);
    setShowProgressModal(false);
    setShowPreviewModal(true);
  };

  // Apply directly: calculate then apply
  const handleApplyDirectly = async () => {
    if (products.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "Calculating and applying prices..."
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const profit = generateProfit();
      const discount = generateDiscount() ?? 0;

      setProgress({
        current: i + 1,
        total: products.length,
        status: `Processing: ${product.title.substring(0, 30)}...`
      });

      try {
        // Calculate
        const calcPayload = {
          productId: product.productId,
          minProfit: profit,
          discount: discount,
        };
        const calcResponse = await postApi(ApiConfig.priceCalulation, calcPayload);

        // Apply
        const applyPayload = {
          productId: product.productId,
          minProfit: profit,
          discount: discount,
          variants: calcResponse.variants.map((v: CalculatedVariant) => ({
            variantId: v.variantId,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
          })),
        };
        await postApi(ApiConfig.priceApply, applyPayload);
        successCount++;
      } catch (error) {
        console.error(`Failed for ${product.title}:`, error);
        failCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setShowProgressModal(false);
    setProgress({
      current: successCount,
      total: products.length,
      status: "completed"
    });
    setShowSuccessModal(true);
    await fetchProducts();
  };

  // Apply from preview
  const applyCalculatedPrices = async () => {
    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: calculationResults.length,
      status: "Saving optimized prices to Shopify..."
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < calculationResults.length; i++) {
      const result = calculationResults[i];

      setProgress({
        current: i + 1,
        total: calculationResults.length,
        status: `Applying: ${result.title.substring(0, 30)}...`
      });

      try {
        const applyPayload = {
          productId: result.productId,
          minProfit: result.minProfit,
          discount: result.discount,
          variants: result.variants.map(v => ({
            variantId: v.variantId,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
          })),
        };
        await postApi(ApiConfig.priceApply, applyPayload);
        successCount++;
      } catch (error) {
        console.error(`Failed to apply for ${result.productId}:`, error);
        failCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setShowProgressModal(false);
    setShowPreviewModal(false);
    setProgress({
      current: successCount,
      total: calculationResults.length,
      status: "completed"
    });
    setShowSuccessModal(true);
    await fetchProducts();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (loading) {
    return (
      <AppLayout title="Price Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Calculator className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading products for price optimization...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Price Optimization">
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Rocket className="w-3 h-3 mr-1" /> PROFIT‑DRIVEN PRICING
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                  Optimize Prices Based on Profit Margin
                </span>
              </h1>
              <p className="text-gray-600 mb-4">
                Set your desired profit (fixed or random range) and optionally add a discount.
                We'll calculate new prices and compare‑at prices automatically.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="w-3 h-3" /> Profit‑based
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Percent className="w-3 h-3" /> Discount ready
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Layers className="w-3 h-3" /> Variant‑level
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View Products ({products.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Products Ready for Price Optimization</DialogTitle>
                    <DialogDescription>
                      {stats.productsWithCost} products have cost price information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
                    {products.slice(0, 10).map((product) => (
                      <div key={product._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={product.productImage}
                          alt={product.title}
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                          <p className="text-xs text-gray-500">
                            {product.variants.length} variants ·
                            {product.variants.some(v => v.costPrice > 0) ? (
                              <span className="text-green-600"> cost available</span>
                            ) : (
                              <span className="text-amber-600"> missing cost</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    {products.length > 10 && (
                      <p className="text-xs text-center text-gray-500">
                        +{products.length - 10} more products
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-green-500" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalProducts}</div>
              <p className="text-xs text-gray-500 mt-1">Ready for optimization</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                Total Variants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalVariants}</div>
              <p className="text-xs text-gray-500 mt-1">Individual SKUs to update</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                Products with Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.productsWithCost}</div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.productsWithCost / stats.totalProducts) * 100)}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Controls */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-500" />
              Pricing Parameters
            </CardTitle>
            <CardDescription>Configure profit and discount settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Profit Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Profit Configuration</Label>
              <Tabs value={profitMode} onValueChange={(v) => setProfitMode(v as 'fixed' | 'range')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fixed" className="gap-2">
                    <DollarSign className="w-4 h-4" /> Fixed Amount
                  </TabsTrigger>
                  <TabsTrigger value="range" className="gap-2">
                    <Dice1 className="w-4 h-4" /> Random Range
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="fixed" className="pt-4">
                  <div className="max-w-xs">
                    <Label htmlFor="fixedProfit">Profit Amount ($)</Label>
                    <Input
                      id="fixedProfit"
                      type="number"
                      min={0}
                      step={0.01}
                      value={fixedProfit}
                      onChange={(e) => setFixedProfit(parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="range" className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div>
                      <Label htmlFor="minProfit">Min Profit ($)</Label>
                      <Input
                        id="minProfit"
                        type="number"
                        min={0}
                        step={0.01}
                        value={minProfit}
                        onChange={(e) => setMinProfit(parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxProfit">Max Profit ($)</Label>
                      <Input
                        id="maxProfit"
                        type="number"
                        min={0}
                        step={0.01}
                        value={maxProfit}
                        onChange={(e) => setMaxProfit(parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Discount Section */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Discount Configuration</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-discount"
                    checked={enableDiscount}
                    onCheckedChange={setEnableDiscount}
                  />
                  <Label htmlFor="enable-discount" className="text-sm cursor-pointer">
                    {enableDiscount ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              </div>

              {enableDiscount && (
                <>
                  <Tabs value={discountMode} onValueChange={(v) => setDiscountMode(v as 'fixed' | 'range')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="fixed" className="gap-2">
                        <Percent className="w-4 h-4" /> Fixed Discount
                      </TabsTrigger>
                      <TabsTrigger value="range" className="gap-2">
                        <Dice1 className="w-4 h-4" /> Random Range
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="fixed" className="pt-4">
                      <div className="max-w-xs">
                        <Label htmlFor="fixedDiscount">Discount (%)</Label>
                        <Input
                          id="fixedDiscount"
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={fixedDiscount}
                          onChange={(e) => setFixedDiscount(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="range" className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div>
                          <Label htmlFor="minDiscount">Min Discount (%)</Label>
                          <Input
                            id="minDiscount"
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={minDiscount}
                            onChange={(e) => setMinDiscount(parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxDiscount">Max Discount (%)</Label>
                          <Input
                            id="maxDiscount"
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={maxDiscount}
                            onChange={(e) => setMaxDiscount(parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>

            {/* Global Even Only */}
            <div className="flex items-center space-x-2 border-t pt-4">
              <Checkbox
                id="evenOnly"
                checked={evenOnly}
                onCheckedChange={(checked) => setEvenOnly(checked as boolean)}
              />
              <label
                htmlFor="evenOnly"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Only generate even numbers for random ranges (psychological pricing)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handlePreview}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 h-12"
              >
                <Eye className="w-5 h-5" />
                Preview Changes
              </Button>
              <Button
                onClick={handleApplyDirectly}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2 h-12"
              >
                <Save className="w-5 h-5" />
                Apply Directly
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products List Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Products to Optimize</CardTitle>
            <CardDescription>Showing {products.length} products with their current price ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {products.map((product) => {
                const minPrice = Math.min(...product.variants.map(v => v.price));
                const maxPrice = Math.max(...product.variants.map(v => v.price));
                const hasCost = product.variants.some(v => v.costPrice > 0);
                return (
                  <div key={product._id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                    <img src={product.productImage} alt={product.title} className="w-16 h-16 rounded-lg object-cover border" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-gray-600">{product.variants.length} variants</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          Price: {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
                        </span>
                        {hasCost && (
                          <>
                            <span className="text-gray-400">•</span>
                            <Badge variant="success" className="text-xs">Cost known</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Progress Modal */}
        <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                {progress.status}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{progress.status}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {progress.current} of {progress.total} products processed
                </p>
              </div>
              <div className="flex justify-center">
                <Calculator className="w-12 h-12 text-blue-500 animate-pulse" />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Price Optimization Preview
              </DialogTitle>
              <DialogDescription>
                Review the calculated prices for each variant before applying.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-8">
              {calculationResults.map((result) => {
                const product = products.find(p => p.productId === result.productId);
                return (
                  <div key={result.productId} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={product?.productImage || ''}
                        alt={result.title}
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{result.title}</h3>
                        <p className="text-sm text-gray-600">
                          Profit: ${result.minProfit} · Discount: {result.discount}%
                        </p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variant</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Old Price</TableHead>
                          <TableHead>New Price</TableHead>
                          <TableHead>Compare At</TableHead>
                          <TableHead>Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.variants.map((variant) => {
                          const original = product?.variants.find(v => v.variantId === variant.variantId);
                          return (
                            <TableRow key={variant.variantId}>
                              <TableCell className="font-medium">{variant.title}</TableCell>
                              <TableCell>{formatCurrency(variant.costPrice)}</TableCell>
                              <TableCell>{formatCurrency(original?.price || 0)}</TableCell>
                              <TableCell className="text-green-600 font-medium">{formatCurrency(variant.price)}</TableCell>
                              <TableCell>
                                {variant.compareAtPrice > 0 ? formatCurrency(variant.compareAtPrice) : '-'}
                              </TableCell>
                              <TableCell>{formatCurrency(variant.profit)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
            <DialogFooter className="gap-2 sticky bottom-0 bg-white pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={applyCalculatedPrices}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
              >
                <Save className="w-4 h-4" />
                Apply All Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-500" />
                Price Update Complete!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Successfully Updated!</h3>
                <p className="text-gray-600">
                  {progress.current} of {progress.total} products had their prices updated.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-semibold">Note:</span> If a compare‑at price was set, the product will appear on sale in your store.
                  </span>
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                Go to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  fetchProducts();
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                Optimize More
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}