import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";
import { format } from "date-fns";

interface RevertItem {
  _id: string;
  shopId: string;
  productId: string;
  oldTitle?: string;
  newTitle?: string;
  oldDescription?: string;
  newDescription?: string;
  oldMetaTitle?: string;
  newMetaTitle?: string;
  oldMetaDescription?: string;
  newMetaDescription?: string;
  oldMetaHandle?: string;
  newMetaHandle?: string;
  oldAlt?:string;
  newAlt?:string;
  oldName?:string;
  newName?:string;
  oldPrice?: number;
  newPrice?: number;
  oldSku?: string;
  newSku?: string;
  oldProductType?: string;
  newProductType?: string;
  oldVendor?: string;
  newVendor?: string;
  oldTags?: string[];
  newTags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface RevertOptimizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  productIds?: string[];
  filters?: any;
  onRevertComplete?: () => void;
}

export function RevertOptimizationsModal({
  isOpen,
  onClose,
  serviceName,
  productIds,
  filters,
  onRevertComplete
}: RevertOptimizationsModalProps) {
  const [loading, setLoading] = useState(false);
  const [revertData, setRevertData] = useState<RevertItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch revert data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRevertData();
    }
  }, [isOpen, serviceName, productIds, filters]);

  const fetchRevertData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload: any = {
        serviceName,
        filters
      };
      
      if (productIds && productIds.length > 0) {
        payload.productIds = productIds;
      }
      
      if (filters && Object.keys(filters).length > 0) {
        payload.filters = filters;
      }
      console.log(filters)
      const response = await postApi(ApiConfig.getRevertOptimizations, payload);
      setRevertData(response || []);
      
      // Auto-select all items by default
      if (response && response.length > 0) {
        setSelectedItems(response.map((item: RevertItem) => item._id));
      }
    } catch (error) {
      console.error('Error fetching revert data:', error);
      setError('Failed to fetch previous optimizations');
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = () => {
    if (selectedItems.length === revertData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(revertData.map(item => item._id));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleRevert = async () => {
    try {
      setReverting(true);
      setError(null);

      setLoading(true);
      setError(null);
      
      const payload: any = {
        serviceName,
        filters
      };
      
      if (productIds && productIds.length > 0) {
        payload.productIds = productIds;
      }
      
      if (filters && Object.keys(filters).length > 0) {
        payload.filters = filters;
      }

      await postApi(ApiConfig.saveRevertOptimizations, payload);
      
      onRevertComplete?.();
      onClose();
    } catch (error) {
      console.error('Error reverting optimizations:', error);
      setError('Failed to revert optimizations');
    } finally {
      setReverting(false);
    }
  };

  const getOldValue = (item: RevertItem, service: string) => {
    switch(service) {
      case 'title': return item.oldTitle;
      case 'description': return item.oldDescription;
      case 'metaTitle': return item.oldMetaTitle;
      case 'metaDescription': return item.oldMetaDescription;
      case 'handle': return item.oldMetaHandle;
      case 'imageALT': return item.oldAlt;
      case 'imageName': return item.oldName;
      case 'pricing': return item.oldPrice;
      case 'sku': return item.oldSku;
      case 'productType': return item.oldProductType;
      case 'vendor': return item.oldVendor;
      case 'tag': return item.oldTags;
      default: return null;
    }
  };

  const getNewValue = (item: RevertItem, service: string) => {
    switch(service) {
      case 'title': return item.newTitle;
      case 'description': return item.newDescription;
      case 'metaTitle': return item.newMetaTitle;
      case 'metaDescription': return item.newMetaDescription;
      case 'handle': return item.newMetaHandle;
      case 'imageALT': return item.newAlt;
      case 'imageName': return item.newName;
      case 'pricing': return item.newPrice;
      case 'sku': return item.newSku;
      case 'productType': return item.newProductType;
      case 'vendor': return item.newVendor;
      case 'tag': return item.newTags;
      default: return null;
    }
  };

  const getFieldName = (service: string) => {
    const fieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      metaTitle: 'metaTitle',
      metaDescription: 'metaDescription',
      handle: 'handle',
      pricing: 'price',
      sku: 'sku',
      productType: 'productType',
      vendor: 'vendor',
      tag: 'tags'
    };
    return fieldMap[service] || service;
  };

  const formatValue = (value: any, service: string) => {
    if (service === 'pricing' && typeof value === 'number') {
      return `$${value.toFixed(2)}`;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || 'N/A';
  };

  const getServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      metaTitle: 'Meta Title',
      metaDescription: 'Meta Description',
      handle: 'Handle',
      imageALT: 'Image ALT',
      imageName: 'Image Name',
      pricing: 'Price',
      sku: 'SKU',
      productType: 'Product Type',
      vendor: 'Vendor',
      tag: 'Tags'
    };
    return labels[service] || service;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#95BF46] flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Revert Last Optimizations - {getServiceLabel(serviceName)}
          </DialogTitle>
          <DialogDescription>
            Select previous optimizations to revert back to original values
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#95BF46] mb-4" />
            <p className="text-[#6b6862]">Loading previous optimizations...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRevertData} variant="outline">
              Try Again
            </Button>
          </div>
        ) : revertData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-[#95BF46] mb-4" />
            <p className="text-[#1a1917] font-medium mb-2">No previous optimizations found</p>
            <p className="text-[#6b6862] text-sm text-center max-w-md">
              No revert history available for the selected products with the current filters
            </p>
          </div>
        ) : (
          <>
            {/* Selection Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
              </div>
              <span className="text-xs text-[#9e9b95]">
                Last updated: {format(new Date(revertData[0]?.updatedAt), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>

            {/* Items List */}
            <div className="overflow-y-auto flex-1 border border-[#e2e0db] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[#f5f4f1] sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9e9b95] uppercase tracking-wider">
                      Product ID
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9e9b95] uppercase tracking-wider">
                      Old Value
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9e9b95] uppercase tracking-wider">
                      New Value
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#9e9b95] uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e0db]">
                  {revertData.map((item) => (
                    <tr 
                      key={item._id}
                      className="hover:bg-[#f5f4f1] transition-colors cursor-pointer"
                      onClick={() => toggleItem(item._id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#6b6862]">
                        {item.productId.split('/').pop()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1a1917] max-w-xs" title={getOldValue(item, serviceName) || ''}>
                          {formatValue(getOldValue(item, serviceName), serviceName)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#95BF46] max-w-xs" title={getNewValue(item, serviceName) || ''}>
                          {formatValue(getNewValue(item, serviceName), serviceName)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#9e9b95] text-xs">
                        {format(new Date(item.createdAt), 'MM/dd/yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={reverting}
                className="border-[#e2e0db]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevert}
                disabled={selectedItems.length === 0 || reverting}
                className="bg-[#95BF46] hover:bg-[#4f38d4] text-white"
              >
                {reverting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reverting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Revert Selected ({selectedItems.length})
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}