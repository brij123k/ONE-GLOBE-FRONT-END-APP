import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Brain,
  Eye,
  Zap,
  Sparkles,
  TrendingUp,
  Target,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Save,
  Play,
  Filter,
  Rocket,
  Stars,
  Award,
  Trophy,
  RulerIcon,
  Search,
  FileEdit,
  Image as ImageIcon,
  Camera,
  Type,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  AlertCircle,
  Hash,
  FileText,
  Tag,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";
import { useToast } from "@/components/ui/use-toast";

interface ImageData {
  _id: string;
  shopId: string;
  productId: string;
  imageId: string;
  imageUrl: string;
  altText: string;
  imageName: string;
  productTitle: string;
  variantId?: string;
  variantTitle?: string;
  inventoryItemId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductGroup {
  productId: string;
  productTitle: string;
  images: ImageData[];
}

interface AINameOptimizationResponse {
  applied?: boolean;
  productId: string;
  imageId: string;
  oldName: string;
  newName: string;
  result?: {
    message: string;
    updatedCount: number;
    results: Array<{
      imageId: string;
      status: string;
    }>;
  };
}

interface NameOptimizationUpdate {
  productId: string;
  imageId: string;
  imageUrl: string;
  oldName: string;
  newName: string;
}

interface NameOptimizationUpdates {
  updates: NameOptimizationUpdate[];
}

interface UpdateResponse {
  message: string;
  updatedCount: number;
  results: Array<{
    imageId: string;
    status: string;
  }>;
}

export default function ImageNameOptimization() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<ImageData[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Selection state
  const [selectedImages, setSelectedImages] = useState<Record<string, boolean>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  
  // Panel state
  const [activeProduct, setActiveProduct] = useState<ProductGroup | null>(null);
  
  // Modal states
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  
  // Optimization results
  const [optimizationResults, setOptimizationResults] = useState<Record<string, AINameOptimizationResponse>>({});
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  
  // Classic Rules State for Name Optimization
  const [classicRules, setClassicRules] = useState({
    useProductTitle: true,
    includeVariant: true,
    separator: "hyphen", // hyphen, underscore, none
    case: "lowercase", // lowercase, uppercase, title
    maxLength: 60,
    removeSpecialChars: true,
    format: "seo-friendly", // seo-friendly, descriptive, minimal
  });

  // Stats
  const [stats, setStats] = useState({
    totalImages: 0,
    imagesWithGoodName: 0,
    genericNames: 0,
    averageLength: 0,
    seoScore: 0,
    improvement: 0,
    keywordInclusion: 0,
    variantImages: 0,
    namesOptimized: 0,
  });

  useEffect(() => {
    fetchStoredImages();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, filterStatus, productGroups]);

  useEffect(() => {
    calculateStats();
  }, [images, optimizationResults]);

  const fetchStoredImages = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredImageNameProduct);
      const imagesData: ImageData[] = response || [];
      setImages(imagesData);
      
      // Group images by product
      const groups: Record<string, ProductGroup> = {};
      imagesData.forEach(image => {
        if (!groups[image.productId]) {
          groups[image.productId] = {
            productId: image.productId,
            productTitle: image.productTitle,
            images: []
          };
        }
        groups[image.productId].images.push(image);
      });
      
      const groupedProducts = Object.values(groups);
      setProductGroups(groupedProducts);
      setFilteredGroups(groupedProducts);
      
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...productGroups];
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(group => 
        group.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.productId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(group => {
        const optimizedCount = group.images.filter(img => 
          optimizationResults[img.imageId]?.newName || !isGenericName(img.imageName)
        ).length;
        const totalImages = group.images.length;
        
        if (filterStatus === 'done') return optimizedCount === totalImages && optimizedCount > 0;
        if (filterStatus === 'pending') return optimizedCount === 0;
        if (filterStatus === 'partial') return optimizedCount > 0 && optimizedCount < totalImages;
        return true;
      });
    }
    
    setFilteredGroups(filtered);
  };

  const isGenericName = (name: string): boolean => {
    const genericPatterns = [
      /^img_\d+/i,
      /^image_\d+/i,
      /^photo_\d+/i,
      /^pic_\d+/i,
      /^\d+$/,
      /^dsc_\d+/i,
      /^img-\d+/i,
      /^image-\d+/i,
    ];
    return genericPatterns.some(pattern => pattern.test(name));
  };

  const calculateStats = () => {
    let totalImages = images.length;
    let imagesWithGoodName = 0;
    let genericNames = 0;
    let totalLength = 0;
    let variantImages = 0;
    let namesOptimized = 0;

    images.forEach(image => {
      if (image.variantId) variantImages++;
      
      const currentName = optimizationResults[image.imageId]?.newName || image.imageName || '';
      totalLength += currentName.length;
      
      if (optimizationResults[image.imageId]?.newName) {
        namesOptimized++;
      }
      
      if (!isGenericName(currentName)) {
        imagesWithGoodName++;
      } else {
        genericNames++;
      }
    });

    const avgLength = totalImages > 0 ? Math.round(totalLength / totalImages) : 0;
    
    setStats(prev => ({
      ...prev,
      totalImages,
      imagesWithGoodName,
      genericNames,
      averageLength: avgLength,
      variantImages,
      namesOptimized,
      seoScore: calculateSeoScore(imagesWithGoodName, totalImages, avgLength),
      keywordInclusion: calculateKeywordInclusion(),
    }));
  };

  const calculateSeoScore = (goodNames: number, totalImages: number, avgLength: number): number => {
    if (totalImages === 0) return 0;
    
    let score = 0;
    
    // Score for having SEO-friendly names
    score += (goodNames / totalImages) * 50;
    
    // Length score (optimal: 30-60 characters for file names)
    if (avgLength >= 30 && avgLength <= 60) {
      score += 30;
    } else if (avgLength > 0) {
      score += 15;
    }
    
    // Keyword inclusion
    score += (stats.keywordInclusion / 100) * 20;
    
    return Math.min(100, Math.round(score));
  };

  const calculateKeywordInclusion = (): number => {
    if (images.length === 0) return 0;
    
    let included = 0;
    
    images.forEach(image => {
      const name = optimizationResults[image.imageId]?.newName || image.imageName || '';
      if (image.productTitle && name) {
        const titleWords = image.productTitle.toLowerCase().split(/\s+/).slice(0, 3);
        const containsKeyword = titleWords.some(word => 
          word.length > 3 && name.toLowerCase().includes(word.toLowerCase().replace(/\s+/g, '-'))
        );
        if (containsKeyword) included++;
      }
    });
    
    return Math.round((included / images.length) * 100);
  };

  const generateClassName = (image: ImageData): string => {
    const productTitle = image.productTitle || '';
    let name = '';
    
    // Start with product title if enabled
    if (classicRules.useProductTitle && productTitle) {
      name = productTitle.toLowerCase();
      
      // Add variant info if available and enabled
      if (classicRules.includeVariant && image.variantTitle) {
        name += `-${image.variantTitle.toLowerCase()}`;
      }
    }
    
    // Remove special characters if enabled
    if (classicRules.removeSpecialChars) {
      name = name.replace(/[^\w\s-]/g, ' ');
    }
    
    // Replace spaces with separator
    switch (classicRules.separator) {
      case 'hyphen':
        name = name.replace(/\s+/g, '-');
        break;
      case 'underscore':
        name = name.replace(/\s+/g, '_');
        break;
      case 'none':
        name = name.replace(/\s+/g, '');
        break;
    }
    
    // Apply case formatting
    switch (classicRules.case) {
      case 'lowercase':
        name = name.toLowerCase();
        break;
      case 'uppercase':
        name = name.toUpperCase();
        break;
      case 'title':
        name = name.split(/[-_]/).map(part => 
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(classicRules.separator === 'hyphen' ? '-' : '_');
        break;
    }
    
    // Remove any remaining special characters
    name = name.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Truncate to max length
    if (name.length > classicRules.maxLength) {
      name = name.substring(0, classicRules.maxLength).replace(/[-_]$/, '');
    }
    
    return name || 'image';
  };

  const handleCopyTitleToProduct = async (productGroup: ProductGroup) => {
    const updates: NameOptimizationUpdate[] = [];
    
    productGroup.images.forEach(image => {
      const newName = generateClassName(image);
      const currentName = optimizationResults[image.imageId]?.newName || image.imageName || '';
      if (newName && newName !== currentName) {
        updates.push({
          productId: image.productId,
          imageId: image.imageId,
          imageUrl: image.imageUrl,
          oldName: image.imageName || '',
          newName: newName
        });
      }
    });

    if (updates.length === 0) {
      toast({
        title: "No changes",
        description: "All images already have optimized names",
      });
      return;
    }

    await applyUpdates(updates);
  };

  const handleAIOptimization = async (applyNow: boolean = false) => {
    const selectedImageIds = Object.keys(selectedImages).filter(id => selectedImages[id]);
    const selectedImageData = images.filter(img => selectedImageIds.includes(img.imageId));
    
    if (selectedImageData.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to optimize",
        variant: "destructive",
      });
      return;
    }

    setShowAIOptionsModal(false);
    setShowProgressModal(true);
    
    setProgress({
      current: 0,
      total: selectedImageData.length,
      status: "Analyzing images with AI..."
    });

    const results: Record<string, AINameOptimizationResponse> = {};

    for (let i = 0; i < selectedImageData.length; i++) {
      const image = selectedImageData[i];
      
      setProgress({
        current: i + 1,
        total: selectedImageData.length,
        status: `Optimizing: ${image.productTitle} (${i + 1}/${selectedImageData.length})`
      });

      try {
        const payload = {
          productId: image.productId,
          imageId: image.imageId,
          apply: applyNow
        };
        
        const response = await postApi(
          ApiConfig.aiImageNameOptimization,
          payload
        );

        results[image.imageId] = response;
        
        // Update local state with the new name
        setOptimizationResults(prev => ({
          ...prev,
          [image.imageId]: response
        }));

      } catch (error) {
        console.error(`Error optimizing image ${image.imageId}:`, error);
        toast({
          title: "Error",
          description: `Failed to optimize ${image.productTitle}`,
          variant: "destructive",
        });
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setOptimizationResults(prev => ({ ...prev, ...results }));
    setShowProgressModal(false);

    if (applyNow) {
      // For direct apply, collect all updates and send in one batch
      const updates: NameOptimizationUpdate[] = [];
      
      Object.values(results).forEach(result => {
        if (result.newName && result.newName !== result.oldName) {
          const image = images.find(img => img.imageId === result.imageId);
          if (image) {
            updates.push({
              productId: result.productId,
              imageId: result.imageId,
              imageUrl: image.imageUrl,
              oldName: result.oldName,
              newName: result.newName
            });
          }
        }
      });

      if (updates.length > 0) {
        await applyUpdates(updates);
      } else {
        setShowSuccessModal(true);
      }
    } else {
      // Show preview with results
      calculateComparisonStats();
      setShowPreviewModal(true);
    }
  };

  const applyUpdates = async (updates: NameOptimizationUpdate[]) => {
    if (updates.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: updates.length,
      status: "Applying image names..."
    });

    try {
      // Send all updates in one batch request
      const payload: NameOptimizationUpdates = {
        updates: updates
      };
      
      const response = await postApi(
        ApiConfig.updateImageNameOptimization,
        payload
      );

      setProgress({
        current: response.updatedCount,
        total: updates.length,
        status: "completed"
      });

      toast({
        title: "Success",
        description: `Updated ${response.updatedCount} images successfully`,
      });

      // Update local state with applied changes
      updates.forEach(update => {
        setOptimizationResults(prev => ({
          ...prev,
          [update.imageId]: {
            ...prev[update.imageId],
            applied: true,
            newName: update.newName,
            oldName: update.oldName
          } as AINameOptimizationResponse
        }));
      });

      setShowSuccessModal(true);
      await fetchStoredImages(); // Refresh data
      
    } catch (error) {
      console.error('Error applying updates:', error);
      toast({
        title: "Error",
        description: "Failed to apply updates",
        variant: "destructive",
      });
    } finally {
      setShowProgressModal(false);
      setShowPreviewModal(false);
      setShowComparisonModal(false);
    }
  };

  const handleApplySelected = () => {
    const updates: NameOptimizationUpdate[] = [];
    
    Object.entries(optimizationResults).forEach(([imageId, result]) => {
      if (result.newName && result.newName !== result.oldName) {
        const image = images.find(img => img.imageId === imageId);
        if (image) {
          updates.push({
            productId: result.productId,
            imageId: result.imageId,
            imageUrl: image.imageUrl,
            oldName: result.oldName,
            newName: result.newName
          });
        }
      }
    });

    if (updates.length > 0) {
      applyUpdates(updates);
    } else {
      toast({
        title: "No changes",
        description: "No changes to apply",
      });
    }
  };

  const calculateComparisonStats = () => {
    let totalOldLength = 0;
    let totalNewLength = 0;
    let genericNames = 0;
    let totalImages = 0;
    let keywordInclusion = 0;

    Object.values(optimizationResults).forEach(result => {
      totalImages++;
      totalOldLength += result.oldName.length;
      totalNewLength += result.newName.length;
      
      if (isGenericName(result.oldName)) genericNames++;
      
      // Check keyword inclusion
      const image = images.find(img => img.imageId === result.imageId);
      if (image?.productTitle && result.newName) {
        const titleWords = image.productTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 3);
        if (titleWords.some(word => result.newName.toLowerCase().includes(word.toLowerCase().replace(/\s+/g, '-')))) {
          keywordInclusion++;
        }
      }
    });

    const avgNewLength = totalNewLength / totalImages;
    const avgOldLength = totalOldLength / totalImages;
    
    const improvement = Math.round(((avgNewLength - avgOldLength) / (avgOldLength || 1)) * 100);
    const seoScore = Math.min(100, Math.round((avgNewLength / 45) * 100));

    setStats(prev => ({
      ...prev,
      totalImages,
      imagesWithGoodName: totalImages - genericNames,
      genericNames,
      averageLength: Math.round(avgNewLength),
      seoScore,
      improvement,
      keywordInclusion: Math.round((keywordInclusion / totalImages) * 100)
    }));
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  };

  const toggleProductSelection = (productId: string) => {
    const group = productGroups.find(g => g.productId === productId);
    if (!group) return;
    
    const allSelected = group.images.every(img => selectedImages[img.imageId]);
    
    const newSelections = { ...selectedImages };
    group.images.forEach(img => {
      newSelections[img.imageId] = !allSelected;
    });
    
    setSelectedImages(newSelections);
  };

  const toggleAllSelection = () => {
    const allSelected = images.length > 0 && images.every(img => selectedImages[img.imageId]);
    
    const newSelections: Record<string, boolean> = {};
    images.forEach(img => {
      newSelections[img.imageId] = !allSelected;
    });
    
    setSelectedImages(newSelections);
  };

  const getSelectedCount = (): number => {
    return Object.values(selectedImages).filter(v => v).length;
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const getProductStatus = (group: ProductGroup): { type: string; label: string; count: string } => {
    const totalImages = group.images.length;
    const optimizedCount = group.images.filter(img => 
      optimizationResults[img.imageId]?.newName || !isGenericName(img.imageName)
    ).length;
    
    if (optimizedCount === totalImages && totalImages > 0) {
      return { type: 'done', label: 'All optimized', count: `${optimizedCount}/${totalImages}` };
    } else if (optimizedCount > 0) {
      return { type: 'partial', label: 'Partial', count: `${optimizedCount}/${totalImages}` };
    } else {
      return { type: 'pending', label: 'Generic names', count: '' };
    }
  };

  const formatFileName = (name: string): string => {
    if (!name) return 'No name';
    if (name.length > 30) {
      return name.substring(0, 27) + '...';
    }
    return name;
  };

  if (loading) {
    return (
      <AppLayout title="Image Name Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading products for image name optimization...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Image Name Optimization">
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  <Rocket className="w-3 h-3 mr-1" /> SEO NAMING
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Optimize Image File Names for SEO
                </span>
              </h1>
              <p className="text-gray-600 mb-4">
                Replace generic image names (IMG_1234.jpg) with SEO-friendly, descriptive file names. 
                Proper image naming can improve search rankings and image discovery.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1">
                  <Search className="w-3 h-3" /> SEO Names
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" /> Better Ranking
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" /> Quick Setup
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Brain className="w-3 h-3" /> AI-Powered
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
                <Button variant="outline" className="gap-2" onClick={() => setShowProductsModal(true)}>
                  <Eye className="w-4 h-4" />
                  {productGroups.length} Products
                </Button>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Products for Image Name Optimization</DialogTitle>
                    <DialogDescription>
                      {stats.totalImages} images across {productGroups.length} products
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {productGroups.map((group) => (
                      <div key={group.productId} className="p-4 border rounded-lg">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleProductExpansion(group.productId)}
                        >
                          <div className="flex items-center gap-3">
                            {group.images[0] && (
                              <img
                                src={group.images[0].imageUrl}
                                alt={group.productTitle}
                                className="w-12 h-12 rounded-lg object-cover border"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{group.productTitle}</p>
                              <p className="text-xs text-gray-500">
                                {group.images.length} images • {
                                  group.images.filter(img => !isGenericName(img.imageName)).length
                                } with good names
                                {group.images.some(img => img.variantId) && ' • Has variants'}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            {expandedProducts[group.productId] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        {expandedProducts[group.productId] && (
                          <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {group.images.map((image, idx) => (
                                <div key={image.imageId} className="space-y-2">
                                  <img
                                    src={image.imageUrl}
                                    alt={image.altText || group.productTitle}
                                    className="w-full h-20 rounded-lg object-cover border"
                                  />
                                  <div className="text-xs">
                                    <p className="font-medium">Image {idx + 1}</p>
                                    {image.variantTitle && (
                                      <p className="text-xs text-purple-600">Variant: {image.variantTitle}</p>
                                    )}
                                    <p className="text-gray-500 truncate" title={image.imageName}>
                                      {formatFileName(image.imageName)}
                                    </p>
                                    {isGenericName(image.imageName) && (
                                      <Badge variant="outline" className="text-[10px] mt-1 bg-amber-50">
                                        Generic
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={() => setShowAIOptionsModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
                disabled={getSelectedCount() === 0}
              >
                <Brain className="w-4 h-4" />
                Start AI Optimization ({getSelectedCount()})
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-500" />
                Total Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalImages}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Across {productGroups.length} products
              </div>
              <Progress 
                value={(stats.imagesWithGoodName / stats.totalImages) * 100 || 0} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Generic Names
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.genericNames}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Need optimization
              </div>
              <Progress 
                value={((stats.totalImages - stats.genericNames) / stats.totalImages) * 100 || 0} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                SEO Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.seoScore}%
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {stats.seoScore > 80 ? "Excellent" : stats.seoScore > 60 ? "Good" : "Needs work"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.genericNames} generic names
              </div>
              <Progress 
                value={stats.seoScore} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Optimization Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.namesOptimized}
                <span className="text-sm font-normal text-gray-500 ml-1">optimized</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((stats.namesOptimized / stats.totalImages) * 100) || 0}% complete
              </div>
              <div className="flex items-center mt-2">
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-gray-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selection Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={images.length > 0 && images.every(img => selectedImages[img.imageId])}
              onCheckedChange={toggleAllSelection}
            />
            <span className="text-sm font-medium">Select All</span>
          </div>
          <div className="w-px h-6 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{getSelectedCount()} images selected</span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const selectedGroups = productGroups.filter(group => 
                  group.images.some(img => selectedImages[img.imageId])
                );
                if (selectedGroups.length > 0) {
                  handleCopyTitleToProduct(selectedGroups[0]);
                }
              }}
              disabled={getSelectedCount() === 0}
            >
              <Copy className="w-4 h-4 mr-2" />
              Apply Title to Selected
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Classic Name Optimization */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  Classic Name Optimization
                  <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                    SIMPLE & EFFECTIVE
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Create SEO-friendly file names using product information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name Components */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Use Product Title</Label>
                      <p className="text-sm text-gray-500">Include product title in file name</p>
                    </div>
                    <Switch
                      checked={classicRules.useProductTitle}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        useProductTitle: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Include Variant Info</Label>
                      <p className="text-sm text-gray-500">Add variant details to file name</p>
                    </div>
                    <Switch
                      checked={classicRules.includeVariant}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        includeVariant: checked
                      })}
                    />
                  </div>
                </div>

                {/* Separator & Case */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Word Separator</Label>
                    <Select
                      value={classicRules.separator}
                      onValueChange={(value) => setClassicRules({
                        ...classicRules,
                        separator: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select separator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hyphen">Hyphen (-)</SelectItem>
                        <SelectItem value="underscore">Underscore (_)</SelectItem>
                        <SelectItem value="none">No separator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Text Case</Label>
                    <Select
                      value={classicRules.case}
                      onValueChange={(value) => setClassicRules({
                        ...classicRules,
                        case: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select case" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lowercase">Lowercase</SelectItem>
                        <SelectItem value="uppercase">Uppercase</SelectItem>
                        <SelectItem value="title">Title Case</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Max Length (characters)</Label>
                    <Input
                      type="number"
                      value={classicRules.maxLength}
                      onChange={(e) => setClassicRules({
                        ...classicRules,
                        maxLength: parseInt(e.target.value) || 60
                      })}
                      min="10"
                      max="100"
                    />
                    <p className="text-xs text-gray-500">Recommended: 30-60 characters for SEO</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={classicRules.removeSpecialChars}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        removeSpecialChars: checked
                      })}
                    />
                    <Label className="text-sm">Remove special characters</Label>
                  </div>
                </div>

                {/* Preview Example */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Preview Example:</h4>
                  {images.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={images[0].imageUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-lg object-cover border"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{images[0].productTitle}</p>
                          {images[0].variantTitle && (
                            <p className="text-xs text-purple-600">Variant: {images[0].variantTitle}</p>
                          )}
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500">
                              Current: <span className="font-mono">{images[0].imageName}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              New: <span className="font-mono text-blue-600">{generateClassName(images[0])}.jpg</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      const selectedImageIds = Object.keys(selectedImages).filter(id => selectedImages[id]);
                      const selectedImageData = images.filter(img => selectedImageIds.includes(img.imageId));
                      if (selectedImageData.length > 0) {
                        const updates: NameOptimizationUpdate[] = selectedImageData.map(img => ({
                          productId: img.productId,
                          imageId: img.imageId,
                          imageUrl: img.imageUrl,
                          oldName: img.imageName || '',
                          newName: generateClassName(img)
                        }));
                        applyUpdates(updates);
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
                    disabled={getSelectedCount() === 0}
                  >
                    <Copy className="w-4 h-4" />
                    Apply to Selected
                  </Button>
                  <Button
                    onClick={() => {
                      const updates: NameOptimizationUpdate[] = images.map(img => ({
                        productId: img.productId,
                        imageId: img.imageId,
                        imageUrl: img.imageUrl,
                        oldName: img.imageName || '',
                        newName: generateClassName(img)
                      }));
                      applyUpdates(updates);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Apply to All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Product List Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Products & Images</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="done">Fully Optimized</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="pending">Generic Names</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredGroups.map((group) => {
                    const status = getProductStatus(group);
                    const allSelected = group.images.every(img => selectedImages[img.imageId]);
                    
                    return (
                      <div
                        key={group.productId}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          activeProduct?.productId === group.productId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveProduct(group)}
                      >
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => toggleProductSelection(group.productId)}
                            />
                          </div>
                          <div className="w-10 h-10 bg-gray-100 rounded-lg border flex items-center justify-center text-xl flex-shrink-0">
                            {group.images[0]?.imageUrl ? (
                              <img
                                src={group.images[0].imageUrl}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{group.productTitle}</p>
                              {group.images.some(img => img.variantId) && (
                                <Badge variant="outline" className="text-xs">Has Variants</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {group.images.length} images • {
                                group.images.filter(img => !isGenericName(img.imageName)).length
                              } with good names
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              status.type === 'done'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : status.type === 'partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                              {status.type === 'done' && <CheckCircle className="w-3 h-3" />}
                              {status.type === 'partial' && <Clock className="w-3 h-3" />}
                              {status.type === 'pending' && <AlertCircle className="w-3 h-3" />}
                              {status.count || status.label}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveProduct(group);
                                handleCopyTitleToProduct(group);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Optimization & Panel */}
          <div className="space-y-6">
            {/* AI Optimization Card */}
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Powered Name Optimization
                  <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    RECOMMENDED
                  </Badge>
                </CardTitle>
                <CardDescription>
                  AI analyzes images and creates SEO-friendly, descriptive file names
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Why AI Name Optimization?</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ Creates descriptive, keyword-rich names</li>
                        <li>✓ Follows SEO best practices</li>
                        <li>✓ Replaces generic IMG_1234 names</li>
                        <li>✓ Improves image search ranking</li>
                        <li>✓ Consistent naming convention</li>
                        <li>✓ Includes product context</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowAIOptionsModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                  disabled={getSelectedCount() === 0}
                >
                  <Brain className="w-4 h-4" />
                  Start AI Optimization ({getSelectedCount()})
                </Button>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p className="font-medium mb-1">What AI creates:</p>
                  <ul className="space-y-1">
                    <li>• product-name-with-keywords.jpg</li>
                    <li>• brand-product-variant-color.jpg</li>
                    <li>• descriptive-seo-friendly-name.jpg</li>
                    <li>• category-product-detail-view.jpg</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Active Product Panel */}
            {activeProduct && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Selected Product</span>
                    <Badge variant="outline">{activeProduct.images.length} images</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg border flex-shrink-0 overflow-hidden">
                      {activeProduct.images[0]?.imageUrl && (
                        <img
                          src={activeProduct.images[0].imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activeProduct.productTitle}</p>
                      <p className="text-xs text-gray-500 truncate">{activeProduct.productId}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activeProduct.images.map((image, idx) => {
                    const result = optimizationResults[image.imageId];
                    const currentName = result?.newName || image.imageName || '';
                    const isGeneric = isGenericName(currentName);
                    
                    return (
                      <div key={image.imageId} className="flex items-start gap-2 p-2 border rounded-lg hover:bg-gray-50">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedImages[image.imageId] || false}
                            onCheckedChange={() => toggleImageSelection(image.imageId)}
                          />
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                          <img
                            src={image.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium">Image {idx + 1}</p>
                            {image.variantTitle && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {image.variantTitle}
                              </Badge>
                            )}
                            {isGeneric && !result && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50">
                                Generic
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate" title={currentName}>
                            {formatFileName(currentName)}
                          </p>
                          {result && (
                            <p className="text-[10px] text-green-600 mt-1">
                              Optimized: {result.newName.length} chars
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const updates: NameOptimizationUpdate[] = [{
                              productId: image.productId,
                              imageId: image.imageId,
                              imageUrl: image.imageUrl,
                              oldName: image.imageName || '',
                              newName: generateClassName(image)
                            }];
                            applyUpdates(updates);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Best Practices */}
            <Card className="border-emerald-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Image Name Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use hyphens between words (not underscores)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Include primary keywords naturally</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Keep under 60 characters</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Avoid generic names (IMG_1234.jpg)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Use lowercase letters</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Be descriptive and accurate</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Options Modal */}
        <Dialog open={showAIOptionsModal} onOpenChange={setShowAIOptionsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                AI Name Optimization Options
              </DialogTitle>
              <DialogDescription>
                Choose how you want to apply AI optimization to {getSelectedCount()} selected images
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview First
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  See all AI-generated file names before applying them to your images
                </p>
                <Button
                  onClick={() => handleAIOptimization(false)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                >
                  <Play className="w-4 h-4" />
                  Optimize & Preview
                </Button>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Apply Directly
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  AI will analyze images and immediately apply optimized file names
                </p>
                <Button
                  onClick={() => handleAIOptimization(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Optimize & Apply Now
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAIOptionsModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Progress Modal */}
        <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                Optimizing Image Names
              </DialogTitle>
              <DialogDescription>
                Please wait while we process your images...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Progress 
                value={(progress.current / progress.total) * 100} 
                className="h-2"
              />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {progress.status}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {progress.current} of {progress.total} images processed
                </p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Image Name Optimization Preview
              </DialogTitle>
              <DialogDescription>
                Review the optimized file names before applying them to your images
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {Object.values(optimizationResults).map((result) => {
                const image = images.find(img => img.imageId === result.imageId);
                if (!image) return null;
                
                return (
                  <div key={result.imageId} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <img
                        src={image.imageUrl}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover border"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{image.productTitle}</h4>
                          {image.variantTitle && (
                            <Badge variant="outline">{image.variantTitle}</Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-gray-500">Current Name</Label>
                            <p className="text-sm text-gray-700 font-mono">{result.oldName || '(Empty)'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">New Name</Label>
                            <p className="text-sm font-medium text-blue-600 font-mono">{result.newName}.jpg</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {result.newName.length} characters
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPreviewModal(false);
                  calculateComparisonStats();
                  setShowComparisonModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                See Improvements & Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Comparison Modal */}
        <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-500" />
                Name Optimization Results
              </DialogTitle>
              <DialogDescription>
                Here's how much better your image file names will perform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-center text-gray-900">
                      {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-1">SEO Improvement</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-center text-gray-900">
                      {stats.imagesWithGoodName}/{stats.totalImages}
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-1">Optimized Names</p>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Text */}
              <div className="text-center">
                <p className="text-gray-700">
                  <span className="font-semibold">{stats.genericNames} generic names optimized</span> 
                  {" "}with SEO-friendly, descriptive file names.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Expected image search ranking improvement: <span className="font-medium text-green-600">Up to 35%</span>
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  What you're getting:
                </h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>✓ Better image search rankings</li>
                  <li>✓ Descriptive, keyword-rich file names</li>
                  <li>✓ Consistent naming convention</li>
                  <li>✓ Optimized name length (30-60 chars)</li>
                  <li>✓ Relevant keyword inclusion</li>
                  <li>✓ Professional image library structure</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowComparisonModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplySelected}
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
                Success!
              </DialogTitle>
              <DialogDescription>
                Your image file names have been optimized successfully
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Optimization Complete!
                </h3>
                <p className="text-gray-600">
                  {progress.current} of {progress.total} images were successfully updated with optimized names.
                </p>
                {progress.total - progress.current > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    {progress.total - progress.current} images failed to update
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Pro Tip:</span> Optimized file names help search engines understand your images better. Check your image search traffic in Google Search Console over the next few weeks to see the improvement.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  fetchStoredImages();
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Optimize More Images
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}