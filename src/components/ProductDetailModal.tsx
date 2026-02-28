import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Calendar, Tag, Building, Package, DollarSign, Layers } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import contentRender from "@/components/contentRender";
interface Product {
  id: string;
  title: string;
  handle: string;
  status: string;
  vendor: string;
  productType: string;
  tags: string[];
  description: string;
  descriptionHtml:any;
  featuredMedia?: {
    preview: {
      image: {
        url: string;
      };
    };
  };
  seo?:{
    title?:string;
    description?:string;
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

export function ProductDetailModal({ product, isOpen, onClose, service }: ProductDetailModalProps) {
  if (!product) return null;

  const imageUrl = product.featuredMedia?.preview?.image?.url ||
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop';
  
  const variant = product.variants.edges[0]?.node;
  const sku = variant?.sku || 'No SKU';

  // Function to render content based on service type
  const renderServiceContent = () => {
    switch (service) {
      case 'title':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Current Title</h3>
            <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
              <p className="text-lg font-semibold text-[#1a1917]">{product.title}</p>
            </div>
          </div>
        );

      case 'description':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#6b6862]">Current Description</h3>
            {/* <div 
              className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db] prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: product.descriptionHtml || '<p class="text-[#9e9b95] italic">No description available</p>' 
              }}
            /> */}
            {contentRender({ content: product.descriptionHtml })}
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
        {product.seo.title?.length || 0}/70 characters
      </span>
    </div>
    
    <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
      <p className="text-[#1a1917] break-words">
        {product.seo.title || 'No meta title available'}
      </p>
    </div>

    {/* Character count warning */}
    {(product.seo.title?.length || 0) > 70 && (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-amber-600 font-bold">⚠️</span>
          <div>
            <p className="text-xs font-medium text-amber-800">
              Meta title exceeds recommended limit
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Your meta title is {(product.seo.title?.length || 0) - 70} characters over the optimal 70 character limit. 
              Search engines may truncate longer titles in search results.
            </p>
          </div>
        </div>
      </div>
    )}

    {(product.seo.title?.length || 0) < 30 && (product.seo.title?.length || 0) > 0 && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">ℹ️</span>
          <div>
            <p className="text-xs font-medium text-blue-800">
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
          {product.seo.title || 'Product Title'}
        </p>
        <p className="text-[#006621] text-sm font-sans mt-1">
          {window.location.origin}/products/{product.handle}
        </p>
        <p className="text-[#545454] text-sm font-sans mt-1 line-clamp-2">
          {product.seo.description?.substring(0, 160) || 'Product description will appear here...'}
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
        {(product.seo.description?.length || 0)}/160 characters
      </span>
    </div>
    
    <div className="p-4 bg-[#f5f4f1] rounded-lg border border-[#e2e0db]">
      <p className="text-[#1a1917] break-words">
        {product.seo.description || 'No meta description available'}
      </p>
    </div>

    {/* Character count warning */}
    {(product.seo.description?.length || 0) > 160 && (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-amber-600 font-bold">⚠️</span>
          <div>
            <p className="text-xs font-medium text-amber-800">
              Meta description exceeds recommended limit
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Your meta description is {(product.seo.description?.length || 0) - 160} characters over the optimal 160 character limit. 
              Search engines may truncate longer descriptions in search results.
            </p>
            {/* <Button 
              variant="link" 
              className="text-xs text-amber-700 underline p-0 h-auto mt-2"
              onClick={() => {
                // You can add optimization logic here
                console.log('Optimize description');
              }}
            >
              Optimize to 160 characters →
            </Button> */}
          </div>
        </div>
      </div>
    )}

    {(product.seo.description?.length || 0) < 120 && (product.seo.description?.length || 0) > 0 && (
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
          {product.seo.title || 'Product Title'}
        </p>
        <p className="text-[#006621] text-sm font-sans mt-1">
          {window.location.origin}/products/{product.handle}
        </p>
        <p className="text-[#545454] text-sm font-sans mt-1 line-clamp-2">
          {product.seo.description?.substring(0, 160) || 'Product description will appear here...'}
          {(product.seo.description?.length || 0) > 160 ? '...' : ''}
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