import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Calendar, Tag, Building, Package, DollarSign, Layers, CheckCircle, AlertCircle, Badge, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import contentRender from "@/components/contentRender";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Product {
  id: string;
  title: string;
  handle: string;
  status: string;
  vendor: string;
  productType: string;
  tags: string[];
  description: string;
  descriptionHtml: any;
  featuredMedia?: {
    preview: {
      image: {
        url: string;
      };
    };
  };
  seo?: {
    title?: string;
    description?: string;
  }
  priceRangeV2: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  totalInventory: number;
  variants: {
    edges: Array<{
      node: {
        sku: string | null;
      };
    }>;
  };
  category?: {
    id: string;
    name: string;
  };
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  service: string;
}

const serviceTitles: Record<string, string> = {
  title: "Title Optimization",
  description: "Description Optimization",
  metaTitle: "Meta SEO Optimization",
  metaDescription: "Meta SEO Optimization",
  handle: "Handle Optimization",
  pricing: "Price Optimization",
  imageALT: "Image ALT Optimization",
  image: "Image Optimization",
  keywords: "Keywords Optimization",
  sku: "SKU Optimization",
  productType: "Product Type Optimization",
  vendor: "Vendor Optimization",
  collection: "Collections Optimization",
  tag: "Tags Optimization",
  specification: "Specification Optimization",
  metafields: "Meta Fields Optimization",
};

const formatPrice = (amount: string, currencyCode: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
};

const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'draft': return 'bg-amber-100 text-amber-700';
    case 'archived': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// Helper function to get plain text length from HTML
const getDescriptionLength = (htmlContent: string) => {
  if (!htmlContent) return 0;
  // Remove HTML tags and count characters
  const plainText = htmlContent.replace(/<[^>]*>/g, '');
  return plainText.length;
};

export function ProductDetailModal({ product, isOpen, onClose, service }: ProductDetailModalProps) {
  const navigate = useNavigate();
  const [isOptimizing, setIsOptimizing] = useState(false);

  if (!product) return null;

  const imageUrl = product.featuredMedia?.preview?.image?.url ||
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop';

  const variant = product.variants.edges[0]?.node;
  const sku = variant?.sku || 'No SKU';

  const handleOptimizeNow = async () => {
    try {
      setIsOptimizing(true);
      
      const payload = {
        serviceName: service,
        productIds: [product.id]
      };

      await postApi(ApiConfig.storeProduct, payload);
      
      // Close the modal and navigate to optimization page
      onClose();
      navigate(`/${service}-optimization`);
      
    } catch (error) {
      console.error('Error storing product for optimization:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Function to render content based on service type
  const renderServiceContent = () => {
    switch (service) {
      case 'title':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#6b6862]">Current Title</h3>
              {product.title && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      product.title.length <= 70
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {product.title.length <= 70 ? (
                      <>✓ SEO Friendly</>
                    ) : (
                      <>⚠ Needs Optimization</>
                    )}
                  </Badge>
                </div>
              )}
            </div>

            <div className={cn(
              "p-4 rounded-lg border transition-colors",
              !product.title && "bg-[#f5f4f1] border-[#e2e0db]",
              product.title && product.title.length <= 50 && "bg-green-50/30 border-green-200",
              product.title && product.title.length > 50 && product.title.length <= 70 && "bg-blue-50/30 border-blue-200",
              product.title && product.title.length > 70 && "bg-amber-50/30 border-amber-300"
            )}>
              <p className="text-lg font-semibold text-[#1a1917] break-words mb-3">
                {product.title || "No title available"}
              </p>

              {product.title && (
                <>
                  {/* Character count progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6b6862]">Character count</span>
                      <span className={cn(
                        "font-medium",
                        product.title.length <= 70 ? "text-green-600" : "text-amber-600"
                      )}>
                        {product.title.length}/70
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#e2e0db] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          product.title.length <= 50 && "bg-green-500",
                          product.title.length > 50 && product.title.length <= 70 && "bg-blue-500",
                          product.title.length > 70 && "bg-amber-500"
                        )}
                        style={{ width: `${Math.min((product.title.length / 70) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* SEO Recommendations */}
                  <div className="mt-3 space-y-2">
                    {product.title.length > 70 ? (
                      <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-2 rounded text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Title is too long ({product.title.length - 70} characters over limit)</p>
                          <p className="text-amber-600 mt-0.5">Search engines may truncate titles after 70 characters. Consider shortening to improve visibility.</p>
                        </div>
                      </div>
                    ) : product.title.length < 30 ? (
                      <div className="flex items-start gap-2 text-blue-700 bg-blue-50 p-2 rounded text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Title is quite short</p>
                          <p className="text-blue-600 mt-0.5">Adding more relevant keywords could improve SEO performance.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-green-700 bg-green-50 p-2 rounded text-xs">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Good title length for SEO</p>
                          <p className="text-green-600 mt-0.5">Your title is optimized for search engines.</p>
                        </div>
                      </div>
                    )}

                    {/* Keyword suggestion (optional) */}
                    {product.title && product.title.split(' ').length < 3 && (
                      <div className="flex items-start gap-2 text-purple-700 bg-purple-50 p-2 rounded text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Consider adding more keywords</p>
                          <p className="text-purple-600 mt-0.5">Titles with 3-5 words typically perform better in search results.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'description':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#6b6862]">Current Description</h3>
              {product.descriptionHtml && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    getDescriptionLength(product.descriptionHtml) >= 300 && getDescriptionLength(product.descriptionHtml) <= 600 && "bg-green-50 text-green-700 border-green-200",
                    getDescriptionLength(product.descriptionHtml) > 600 && getDescriptionLength(product.descriptionHtml) <= 1000 && "bg-blue-50 text-blue-700 border-blue-200",
                    getDescriptionLength(product.descriptionHtml) > 1000 && "bg-amber-50 text-amber-700 border-amber-200",
                    getDescriptionLength(product.descriptionHtml) < 300 && getDescriptionLength(product.descriptionHtml) >= 200 && "bg-amber-50 text-amber-700 border-amber-200",
                    getDescriptionLength(product.descriptionHtml) < 200 && "bg-red-50 text-red-700 border-red-200"
                  )}
                >
                  {getDescriptionLength(product.descriptionHtml) < 200 ? (
                    <>⚠ Too Short</>
                  ) : getDescriptionLength(product.descriptionHtml) < 300 ? (
                    <>⚠ Needs More Content</>
                  ) : getDescriptionLength(product.descriptionHtml) <= 600 ? (
                    <>✓ SEO Optimized</>
                  ) : getDescriptionLength(product.descriptionHtml) <= 1000 ? (
                    <>✓ Good Length</>
                  ) : (
                    <>⚠ Very Long</>
                  )}
                </Badge>
              )}
            </div>

            <div className={cn(
              "p-4 rounded-lg border transition-colors",
              !product.descriptionHtml && "bg-[#f5f4f1] border-[#e2e0db]",
              product.descriptionHtml && getDescriptionLength(product.descriptionHtml) < 200 && "bg-red-50/30 border-red-200",
              product.descriptionHtml && getDescriptionLength(product.descriptionHtml) >= 200 && getDescriptionLength(product.descriptionHtml) < 300 && "bg-amber-50/30 border-amber-200",
              product.descriptionHtml && getDescriptionLength(product.descriptionHtml) >= 300 && getDescriptionLength(product.descriptionHtml) <= 600 && "bg-green-50/30 border-green-200",
              product.descriptionHtml && getDescriptionLength(product.descriptionHtml) > 600 && getDescriptionLength(product.descriptionHtml) <= 1000 && "bg-blue-50/30 border-blue-200",
              product.descriptionHtml && getDescriptionLength(product.descriptionHtml) > 1000 && "bg-amber-50/30 border-amber-300"
            )}>
              {contentRender({ content: product.descriptionHtml })}

              {product.descriptionHtml && (
                <>
                  {/* Character count progress bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6b6862]">Character count</span>
                      <span className={cn(
                        "font-medium",
                        getDescriptionLength(product.descriptionHtml) < 200 && "text-red-600",
                        getDescriptionLength(product.descriptionHtml) >= 200 && getDescriptionLength(product.descriptionHtml) < 300 && "text-amber-600",
                        getDescriptionLength(product.descriptionHtml) >= 300 && getDescriptionLength(product.descriptionHtml) <= 600 && "text-green-600",
                        getDescriptionLength(product.descriptionHtml) > 600 && getDescriptionLength(product.descriptionHtml) <= 1000 && "text-blue-600",
                        getDescriptionLength(product.descriptionHtml) > 1000 && "text-amber-600"
                      )}>
                        {getDescriptionLength(product.descriptionHtml)} characters
                      </span>
                    </div>

                    {/* Progress bar with multiple thresholds */}
                    <div className="relative w-full h-2 bg-[#e2e0db] rounded-full overflow-hidden">
                      {/* Minimum threshold marker (200) */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${(200 / 1000) * 100}%` }}
                      />
                      {/* Recommended start marker (300) */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10"
                        style={{ left: `${(300 / 1000) * 100}%` }}
                      />
                      {/* Recommended end marker (600) */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10"
                        style={{ left: `${(600 / 1000) * 100}%` }}
                      />
                      {/* Good to go marker (1000) */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                        style={{ left: `${(1000 / 1000) * 100}%` }}
                      />
                      {/* Progress fill */}
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          getDescriptionLength(product.descriptionHtml) < 200 && "bg-red-500",
                          getDescriptionLength(product.descriptionHtml) >= 200 && getDescriptionLength(product.descriptionHtml) < 300 && "bg-amber-500",
                          getDescriptionLength(product.descriptionHtml) >= 300 && getDescriptionLength(product.descriptionHtml) <= 600 && "bg-green-500",
                          getDescriptionLength(product.descriptionHtml) > 600 && getDescriptionLength(product.descriptionHtml) <= 1000 && "bg-blue-500",
                          getDescriptionLength(product.descriptionHtml) > 1000 && "bg-amber-500"
                        )}
                        style={{ width: `${Math.min((getDescriptionLength(product.descriptionHtml) / 1000) * 100, 100)}%` }}
                      />
                    </div>

                    {/* Threshold labels */}
                    <div className="flex justify-between text-[10px] text-[#6b6862] px-1">
                      <span>0</span>
                      <span className="text-red-500">200 (Min)</span>
                      <span className="text-green-500">300-600 (Best)</span>
                      <span className="text-blue-500">1000 (Good)</span>
                      <span>1500+</span>
                    </div>
                  </div>

                  {/* SEO Recommendations */}
                  <div className="mt-4 space-y-2">
                    {getDescriptionLength(product.descriptionHtml) < 200 && (
                      <div className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Description is too short ({200 - getDescriptionLength(product.descriptionHtml)} characters missing)</p>
                          <p className="text-red-600 text-sm">Minimum recommended length is 200 characters. Short descriptions may not provide enough information for search engines to properly index your product.</p>
                          <ul className="list-disc list-inside mt-2 text-xs text-red-600 space-y-1">
                            <li>Add key product features and benefits</li>
                            <li>Include relevant keywords naturally</li>
                            <li>Describe what makes your product unique</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {getDescriptionLength(product.descriptionHtml) >= 200 && getDescriptionLength(product.descriptionHtml) < 300 && (
                      <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Good start! Add a bit more content</p>
                          <p className="text-amber-600 text-sm">Your description meets the minimum requirement, but adding more detail could improve SEO performance.</p>
                          <p className="text-xs text-amber-600 mt-2">Aim for 300-600 characters for optimal search engine visibility.</p>
                        </div>
                      </div>
                    )}

                    {getDescriptionLength(product.descriptionHtml) >= 300 && getDescriptionLength(product.descriptionHtml) <= 600 && (
                      <div className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded text-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Excellent description length!</p>
                          <p className="text-green-600 text-sm">Your description is perfectly optimized for SEO. It provides enough detail for search engines while remaining concise for users.</p>
                          <ul className="list-disc list-inside mt-2 text-xs text-green-600">
                            <li>Great balance of keywords and readability</li>
                            <li>Ideal length for search engine crawlers</li>
                            <li>Likely to rank well in search results</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {getDescriptionLength(product.descriptionHtml) > 600 && getDescriptionLength(product.descriptionHtml) <= 1000 && (
                      <div className="flex items-start gap-2 text-blue-700 bg-blue-50 p-3 rounded text-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Comprehensive description</p>
                          <p className="text-blue-600 text-sm">Your description is thorough and detailed. This length works well for complex products.</p>
                          <p className="text-xs text-blue-600 mt-2">Consider breaking up text with bullet points or subheadings for better readability.</p>
                        </div>
                      </div>
                    )}

                    {getDescriptionLength(product.descriptionHtml) > 1000 && (
                      <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Very long description</p>
                          <p className="text-amber-600 text-sm">While detailed content is good, very long descriptions might:</p>
                          <ul className="list-disc list-inside mt-2 text-xs text-amber-600 space-y-1">
                            <li>Overwhelm users with too much information</li>
                            <li>Dilute important keywords</li>
                            <li>Cause mobile usability issues</li>
                          </ul>
                          <p className="text-xs text-amber-600 mt-2">Consider condensing or splitting into sections with tabs/accordions.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Word count and readability (optional) */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="bg-white">
                      ~{Math.round(getDescriptionLength(product.descriptionHtml) / 5)} words
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      ~{Math.ceil(getDescriptionLength(product.descriptionHtml) / 100)} paragraphs
                    </Badge>
                  </div>
                </>
              )}

              {!product.descriptionHtml && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded text-sm mt-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>No description available. Adding a description is highly recommended for SEO.</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'metaTitle':
      case 'metaDescription':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-[#1a1917]">
                {/* Meta Title Section */}
                {service === 'metaTitle' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[#6b6862]">Meta Title</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-[#6b6862]">
                        {product.seo?.title?.length || 0}/70 characters
                      </span>
                    </div>

                    <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
                      <p className="text-[#1a1917] break-words">
                        {product.seo?.title || 'No meta title available'}
                      </p>
                    </div>

                    {/* Character count warning */}
                    {(product.seo?.title?.length || 0) > 70 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">⚠️</span>
                          <div>
                            <p className="text-xs font-medium text-amber-800">
                              Meta title exceeds recommended limit
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              Your meta title is {(product.seo?.title?.length || 0) - 70} characters over the optimal 70 character limit.
                              Search engines may truncate longer titles in search results.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(product.seo?.title?.length || 0) < 30 && (product.seo?.title?.length || 0) > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600">ℹ️</span>
                          <div>
                            <p className="text-xs font-medium text-蓝色-800">
                              Meta title is shorter than recommended
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Consider adding more descriptive text to reach the optimal 50-60 character range.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SEO Preview */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs font-medium text-blue-800 mb-2">Google Search Preview:</p>
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-[#1a0dab] text-lg font-medium font-sans line-clamp-1">
                          {product.seo?.title || 'Product Title'}
                        </p>
                        <p className="text-[#006621] text-sm font-sans mt-1">
                          {window.location.origin}/products/{product.handle}
                        </p>
                        <p className="text-[#545454] text-sm font-sans mt-1 line-clamp-2">
                          {product.seo?.description?.substring(0, 160) || 'Product description will appear here...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Meta Description Section */}
                {service === 'metaDescription' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[#6b6862]">Meta Description</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-[#6b6862]">
                        {(product.seo?.description?.length || 0)}/160 characters
                      </span>
                    </div>

                    <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
                      <p className="text-[#1a1917] break-words">
                        {product.seo?.description || 'No meta description available'}
                      </p>
                    </div>

                    {/* Character count warning */}
                    {(product.seo?.description?.length || 0) > 160 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">⚠️</span>
                          <div>
                            <p className="text-xs font-medium text-amber-800">
                              Meta description exceeds recommended limit
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              Your meta description is {(product.seo?.description?.length || 0) - 160} characters over the optimal 160 character limit.
                              Search engines may truncate longer descriptions in search results.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(product.seo?.description?.length || 0) < 120 && (product.seo?.description?.length || 0) > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600">ℹ️</span>
                          <div>
                            <p className="text-xs font-medium text-blue-800">
                              Meta description is shorter than recommended
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Consider adding more details to reach the optimal 120-160 character range for better click-through rates.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SEO Preview */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs font-medium text-blue-800 mb-2">Google Search Preview:</p>
                      <div className="bg-white rounded-lg p-3 border border-blue-100">
                        <p className="text-[#1a0dab] text-lg font-medium font-sans line-clamp-1">
                          {product.seo?.title || 'Product Title'}
                        </p>
                        <p className="text-[#006621] text-sm font-sans mt-1">
                          {window.location.origin}/products/{product.handle}
                        </p>
                        <p className="text-[#545454] text-sm font-sans mt-1 line-clamp-2">
                          {product.seo?.description?.substring(0, 160) || 'Product description will appear here...'}
                          {(product.seo?.description?.length || 0) > 160 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <span className="font-semibold">SEO Preview:</span> This is how your product will appear in search results
              </p>
            </div>
          </div>
        );

      case 'handle':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Current Handle (URL)</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-lg font-mono text-[#1a1917]">{product.handle}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-700">
                The handle is used in your product URLs. A clean, descriptive handle helps with SEO.
              </p>
            </div>
          </div>
        );

        case 'imageALT':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Current ImageALT</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-lg font-mono text-[#1a1917]">{product.handle}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-700">
                The handle is used in your product URLs. A clean, descriptive handle helps with SEO.
              </p>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Current Price</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-2xl font-bold text-[#1a1917]">
                {formatPrice(product.priceRangeV2.minVariantPrice.amount, product.priceRangeV2.minVariantPrice.currencyCode)}
              </p>
            </div>
            {product.variants.edges.length > 1 && (
              <div className="text-sm text-[#6b6862]">
                <span className="font-medium">Note:</span> This product has {product.variants.edges.length} variants with different prices
              </div>
            )}
          </div>
        );

      case 'sku':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">SKU Information</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-lg font-mono text-[#1a1917]">{sku}</p>
            </div>
            {product.variants.edges.length > 1 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-[#6b6862] mb-2">All Variant SKUs</h4>
                <div className="space-y-2">
                  {product.variants.edges.map((edge, idx) => (
                    <div key={idx} className="p-2 bg-[#f5f4f1] rounded border border-[#e2e0db] text-sm">
                      {edge.node.sku || 'No SKU'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'productType':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Product Type</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-lg text-[#1a1917]">{product.productType || 'Not specified'}</p>
            </div>
          </div>
        );

      case 'vendor':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Vendor</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db] flex items-center gap-2">
              <Building className="w-5 h-5 text-[#6046ff]" />
              <p className="text-lg text-[#1a1917]">{product.vendor || 'Not specified'}</p>
            </div>
          </div>
        );

      case 'collection':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Collections</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              {product.category ? (
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#6046ff]" />
                  <span>{product.category.name}</span>
                </div>
              ) : (
                <p className="text-[#9e9b95] italic">Not in any collection</p>
              )}
            </div>
          </div>
        );

      case 'tag':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Tags</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              {product.tags && product.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white rounded-md text-xs text-[#6046ff] border border-[#e2e0db]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#9e9b95] italic">No tags</p>
              )}
            </div>
          </div>
        );

      case 'specification':
      case 'metafields':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Product Specifications</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-[#1a1917] mb-4">{product.description || 'No specifications available'}</p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#e2e0db]">
                <div>
                  <p className="text-xs text-[#6b6862]">Product Type</p>
                  <p className="text-sm font-medium">{product.productType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b6862]">Vendor</p>
                  <p className="text-sm font-medium">{product.vendor || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b6862]">SKU</p>
                  <p className="text-sm font-medium">{sku}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6b6862]">Inventory</p>
                  <p className="text-sm font-medium">{product.totalInventory}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Product Details</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-[#1a1917]">{product.description || 'No description available'}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-[#e2e0db] pb-4">
          <DialogTitle className="text-xl font-bold text-[#1a1917] flex items-center justify-between">
            <span>Product Details</span>
            <Button
              onClick={handleOptimizeNow}
              disabled={isOptimizing}
              className="bg-[#95BF46] hover:bg-[#c1f85b] text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Optimize {serviceTitles[service]}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Product Header with Image and Basic Info */}
          <div className="flex gap-6 mb-6 pb-6 border-b border-[#e2e0db]">
            <div className="flex-shrink-0">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-24 h-24 rounded-lg object-cover border border-[#e2e0db]"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#1a1917] mb-2">{product.title}</h2>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold",
                  getStatusBadgeClass(product.status)
                )}>
                  {product.status}
                </span>
                <span className="flex items-center gap-1 text-[#6b6862]">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatPrice(product.priceRangeV2.minVariantPrice.amount, product.priceRangeV2.minVariantPrice.currencyCode)}
                </span>
                <span className="flex items-center gap-1 text-[#6b6862]">
                  <Package className="w-3.5 h-3.5" />
                  {product.totalInventory} in stock
                </span>
              </div>
            </div>
          </div>

          {/* Service-specific content */}
          <div className="mt-4">
            {renderServiceContent()}
          </div>

          {/* Additional Information */}
          <div className="mt-6 pt-4 border-t border-[#e2e0db]">
            <h4 className="text-sm font-medium text-[#6b6862] mb-3">Additional Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-[#6046ff] mt-0.5" />
                <div>
                  <p className="text-xs text-[#6b6862]">Product Type</p>
                  <p className="text-sm font-medium">{product.productType || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-[#6046ff] mt-0.5" />
                <div>
                  <p className="text-xs text-[#6b6862]">Vendor</p>
                  <p className="text-sm font-medium">{product.vendor || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}