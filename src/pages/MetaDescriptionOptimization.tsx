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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
    Plus,
    Filter,
    Crown,
    Rocket,
    Stars,
    Award,
    Trophy,
    RulerIcon,
    Gem,
    Tag,
    FileText,
    Search,
    Globe,
    MessageSquare,
    FileEdit,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Product {
    _id: string;
    productId: string;
    title: string;
    description: string;
    metaDescription: string;
    productImage: string;
    handle: string;
    status: string;
}

interface OptimizationResult {
    productId: string;
    oldMetaDescription: string;
    newMetaDescription: string;
    characterCount: number;
    image?: string;
}

export default function MetaDescriptionOptimization() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
    const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
    const [stats, setStats] = useState({
        averageLength: 0,
        seoScore: 0,
        improvement: 0,
        emptyDescriptions: 0,
        keywordInclusion: 0,
    });

    // Classic Rules State
    const [classicRules, setClassicRules] = useState({
        copyDescriptionToMeta: false,
        useFirstParagraph: false,
        prefix: { enabled: false, value: "" },
        suffix: { enabled: false, value: "" },
        findReplace: { enabled: false, find: "", replace: "" },
        findRemove: { enabled: false, value: "" },
        truncate: { enabled: false, maxLength: 160, preserveWords: true },
        includeKeywords: { enabled: false, keywords: "" },
        callToAction: { enabled: false, text: "Shop now!" },
    });

    useEffect(() => {
        fetchStoredProducts();
    }, []);

    const fetchStoredProducts = async () => {
        try {
            setLoading(true);
            const response = await getApi(ApiConfig.getStoredMetaDecProduct);
            const productsData = response || [];
            setProducts(productsData);

            // Calculate initial stats
            if (productsData.length > 0) {
                const avgLength = Math.round(
                    productsData.reduce((sum: number, p: Product) => sum + (p.metaDescription?.length || 0), 0) / productsData.length
                );
                const emptyDescriptions = productsData.filter(p => !p.metaDescription || p.metaDescription.trim() === '').length;

                setStats(prev => ({
                    ...prev,
                    averageLength: avgLength,
                    emptyDescriptions: emptyDescriptions,
                    seoScore: calculateSeoScore(productsData),
                    keywordInclusion: calculateKeywordInclusion(productsData),
                }));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSeoScore = (products: Product[]): number => {
        if (products.length === 0) return 0;

        let score = 0;
        products.forEach(product => {
            const metaDescription = product.metaDescription || '';
            const description = product.description || '';

            // Score based on length (optimal: 150-160 characters)
            if (metaDescription.length >= 150 && metaDescription.length <= 160) score += 30;
            else if (metaDescription.length >= 120 && metaDescription.length <= 180) score += 20;
            else score += 10;

            // Score for having meta description
            if (metaDescription.trim()) score += 30;

            // Score for including keywords
            if (product.title) {
                const titleWords = product.title.toLowerCase().split(/\s+/).slice(0, 3);
                const containsKeyword = titleWords.some(word =>
                    word.length > 3 && metaDescription.toLowerCase().includes(word)
                );
                if (containsKeyword) score += 20;
            }

            // Score for call to action
            const ctas = ['shop', 'buy', 'learn', 'discover', 'explore', 'get', 'try', 'order'];
            const hasCTA = ctas.some(cta => metaDescription.toLowerCase().includes(cta));
            if (hasCTA) score += 20;
        });

        return Math.round(score / products.length);
    };

    const calculateKeywordInclusion = (products: Product[]): number => {
        if (products.length === 0) return 0;

        let included = 0;
        products.forEach(product => {
            const metaDescription = product.metaDescription || '';
            const title = product.title || '';

            if (title && metaDescription) {
                const titleWords = title.toLowerCase().split(/\s+/).slice(0, 3);
                const containsKeyword = titleWords.some(word =>
                    word.length > 3 && metaDescription.toLowerCase().includes(word)
                );
                if (containsKeyword) included++;
            }
        });

        return Math.round((included / products.length) * 100);
    };

    const extractFirstParagraph = (html: string): string => {
        if (!html) return '';

        // Remove HTML tags and decode HTML entities
        const plainText = html
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
            .replace(/&nbsp;/g, ' ')  // Replace non-breaking spaces
            .replace(/&amp;/g, '&')   // Decode ampersand
            .replace(/&lt;/g, '<')    // Decode less than
            .replace(/&gt;/g, '>')    // Decode greater than
            .replace(/&quot;/g, '"')  // Decode quotes
            .replace(/&#39;/g, "'")   // Decode apostrophe
            .trim();

        if (!plainText) return '';

        // Find the first period, exclamation point, or question mark within 160 characters
        // Start looking after at least 80 characters to get a meaningful sentence
        const minLength = Math.min(80, plainText.length);
        let endIndex = -1;

        // Look for sentence endings
        for (let i = minLength; i < Math.min(plainText.length, 160); i++) {
            if (plainText[i] === '.' || plainText[i] === '!' || plainText[i] === '?') {
                // Check if it's not part of an abbreviation (like "Mr." or "Dr.")
                const prevChars = plainText.substring(Math.max(0, i - 3), i).toLowerCase();
                if (!prevChars.endsWith('mr') &&
                    !prevChars.endsWith('dr') &&
                    !prevChars.endsWith('mrs') &&
                    !prevChars.endsWith('ms') &&
                    !prevChars.endsWith('jr') &&
                    !prevChars.endsWith('sr') &&
                    !prevChars.endsWith('st') &&
                    !prevChars.endsWith('co') &&
                    !prevChars.endsWith('inc') &&
                    !prevChars.endsWith('ltd') &&
                    !prevChars.endsWith('etc')) {
                    endIndex = i;
                    break;
                }
            }
        }

        if (endIndex > -1) {
            // Found a sentence ending within 160 chars
            return plainText.substring(0, endIndex + 1).trim();
        }

        // No sentence ending found within 160 chars, try to find a natural break
        // Look for the last comma, semicolon, or dash before 160 chars
        let breakIndex = -1;
        for (let i = Math.min(plainText.length, 160) - 1; i >= 100; i--) {
            if (plainText[i] === ',' || plainText[i] === ';' || plainText[i] === '-' || plainText[i] === ':') {
                breakIndex = i;
                break;
            }
        }

        if (breakIndex > -1) {
            // Found a natural break point
            return plainText.substring(0, breakIndex).trim();
        }

        // No natural break found, find the last space before 160 chars
        const truncated = plainText.substring(0, Math.min(plainText.length, 160));
        const lastSpace = truncated.lastIndexOf(' ');

        if (lastSpace > 100) {
            // Found a word boundary after reasonable length
            return truncated.substring(0, lastSpace).trim();
        }

        // Fallback: take first 160 chars and ensure it ends with ...
        const result = plainText.substring(0, Math.min(plainText.length, 160)).trim();

        // Don't add ... if it already ends with punctuation
        if (result.endsWith('.') || result.endsWith('!') || result.endsWith('?') || result.endsWith('...')) {
            return result;
        }

        // Ensure we don't exceed 160 characters with the ellipsis
        if (result.length > 157) {
            return result.substring(0, 157);
        }

        return result;
    };

    const handleClassicOptimization = async (previewMode = true) => {
        if (products.length === 0) return;

        setShowProgressModal(true);
        setProgress({
            current: 0,
            total: products.length,
            status: "Applying classic optimization rules..."
        });

        const results: OptimizationResult[] = [];

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            let newMetaDescription = product.metaDescription || '';

            // Copy description to meta description if enabled
            if (classicRules.copyDescriptionToMeta) {
                newMetaDescription = product.description ? extractFirstParagraph(product.description) : '';
            }

            // Use first paragraph if enabled
            if (classicRules.useFirstParagraph && product.description) {
                newMetaDescription = extractFirstParagraph(product.description);
            }

            // Apply prefix
            if (classicRules.prefix.enabled && classicRules.prefix.value) {
                newMetaDescription = `${classicRules.prefix.value} ${newMetaDescription}`;
            }

            // Apply suffix
            if (classicRules.suffix.enabled && classicRules.suffix.value) {
                newMetaDescription = `${newMetaDescription} ${classicRules.suffix.value}`;
            }

            // Apply find & replace
            if (classicRules.findReplace.enabled && classicRules.findReplace.find) {
                const regex = new RegExp(classicRules.findReplace.find, 'gi');
                newMetaDescription = newMetaDescription.replace(regex, classicRules.findReplace.replace);
            }

            // Apply find & remove
            if (classicRules.findRemove.enabled && classicRules.findRemove.value) {
                const regex = new RegExp(classicRules.findRemove.value, 'gi');
                newMetaDescription = newMetaDescription.replace(regex, '');
            }

            // Include keywords
            if (classicRules.includeKeywords.enabled && classicRules.includeKeywords.keywords) {
                const keywords = classicRules.includeKeywords.keywords.split(',').map(k => k.trim()).filter(k => k);
                if (keywords.length > 0) {
                    newMetaDescription = `${newMetaDescription} ${keywords.join(', ')}`;
                }
            }

            // Add call to action
            if (classicRules.callToAction.enabled && classicRules.callToAction.text) {
                newMetaDescription = `${newMetaDescription} ${classicRules.callToAction.text}`;
            }

            // Apply truncation
            if (classicRules.truncate.enabled && newMetaDescription.length > classicRules.truncate.maxLength) {
                if (classicRules.truncate.preserveWords) {
                    // Find last space before limit
                    const truncated = newMetaDescription.substring(0, classicRules.truncate.maxLength);
                    const lastSpace = truncated.lastIndexOf(' ');
                    newMetaDescription = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
                } else {
                    newMetaDescription = newMetaDescription.substring(0, classicRules.truncate.maxLength);
                }
            }

            // Clean up extra spaces
            newMetaDescription = newMetaDescription.replace(/\s+/g, ' ').trim();

            results.push({
                productId: product.productId,
                oldMetaDescription: product.metaDescription || '(Empty)',
                newMetaDescription,
                characterCount: newMetaDescription.length,
                image: product.productImage
            });

            setProgress({
                current: i + 1,
                total: products.length,
                status: `Processing: ${product.title}`
            });
        }

        setOptimizationResults(results);
        setShowProgressModal(false);

        if (previewMode) {
            calculateComparisonStats(results);
            setShowPreviewModal(true);
        } else {
            await applyMetaDescriptionOptimizations(results);
        }
    };

    const handleAIOptimization = async (applyNow = false) => {
        if (products.length === 0) return;

        setShowProgressModal(true);
        setProgress({
            current: 0,
            total: products.length,
            status: "Starting AI optimization..."
        });

        const results: OptimizationResult[] = [];

        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            setProgress({
                current: i + 1,
                total: products.length,
                status: `Optimizing: ${product.title}`
            });

            try {
                const payload = {
                    productId: product.productId,
                    productDescription: product.description || product.title,
                    apply: applyNow
                };

                const response = await postApi(ApiConfig.aiMetadescriptionOptimization, payload);

                if (applyNow && response.applied) {
                    // Direct apply mode
                    results.push({
                        productId: product.productId,
                        oldMetaDescription: response.oldMetaDescription || '(Empty)',
                        newMetaDescription: response.newMetaDescription,
                        characterCount: response.characterCount || 0,
                        image: product.productImage
                    });
                } else if (!applyNow && response.newMetaDescription) {
                    // Preview mode
                    results.push({
                        productId: product.productId,
                        oldMetaDescription: response.oldMetaDescription || '(Empty)',
                        newMetaDescription: response.newMetaDescription,
                        characterCount: response.characterCount || response.newMetaDescription.length,
                        image: product.productImage
                    });
                }

                // Add small delay between requests
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error) {
                console.error(`Error optimizing ${product.title}:`, error);
                results.push({
                    productId: product.productId,
                    oldMetaDescription: product.metaDescription || '(Empty)',
                    newMetaDescription: product.metaDescription || '(Empty)',
                    characterCount: (product.metaDescription || '').length,
                    image: product.productImage
                });
            }
        }

        setOptimizationResults(results);
        setShowProgressModal(false);

        if (applyNow) {
            // Show direct success modal
            const successful = results.filter(r => r.newMetaDescription !== r.oldMetaDescription).length;
            setProgress({
                current: successful,
                total: products.length,
                status: "completed"
            });
            setShowSuccessModal(true);
        } else {
            // Show preview modal
            calculateComparisonStats(results);
            setShowPreviewModal(true);
        }
    };

    const applyMetaDescriptionOptimizations = async (results: OptimizationResult[]) => {
        setShowProgressModal(true);
        setProgress({
            current: 0,
            total: results.length,
            status: "Applying optimizations to Shopify..."
        });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < results.length; i++) {
            const result = results[i];

            if (result.oldMetaDescription !== result.newMetaDescription) {
                try {
                    await postApi(ApiConfig.updateMetaDescriptionOptimization, {
                        productId: result.productId,
                        oldMetaDescription: result.oldMetaDescription,
                        newMetaDescription: result.newMetaDescription
                    });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to update ${result.productId}:`, error);
                    failCount++;
                }
            }

            setProgress({
                current: i + 1,
                total: results.length,
                status: `Updating: ${result.productId}`
            });
        }

        setShowProgressModal(false);
        setShowComparisonModal(false);

        setProgress({
            current: successCount,
            total: results.length,
            status: "completed"
        });
        setShowSuccessModal(true);
    };

    const calculateComparisonStats = (results: OptimizationResult[]) => {
        if (results.length === 0) return;

        const avgOldLength = results.reduce((sum, r) => sum + (r.oldMetaDescription === '(Empty)' ? 0 : r.oldMetaDescription.length), 0) / results.length;
        const avgNewLength = results.reduce((sum, r) => sum + r.newMetaDescription.length, 0) / results.length;

        const improvement = Math.round(((avgNewLength - avgOldLength) / (avgOldLength || 1)) * 100);
        const seoScore = Math.min(100, Math.round((avgNewLength / 160) * 100));

        // Calculate keyword inclusion
        const keywordInclusion = results.filter(r => {
            // Simple keyword check - if meta description contains important words from product title
            const titleWords = products.find(p => p.productId === r.productId)?.title?.toLowerCase().split(/\s+/) || [];
            const importantWords = titleWords.filter(w => w.length > 3).slice(0, 3);
            return importantWords.some(word => r.newMetaDescription.toLowerCase().includes(word));
        }).length;

        setStats({
            averageLength: Math.round(avgNewLength),
            seoScore,
            improvement,
            emptyDescriptions: results.filter(r => r.oldMetaDescription === '(Empty)').length,
            keywordInclusion: Math.round((keywordInclusion / results.length) * 100)
        });
    };

    if (loading) {
        return (
            <AppLayout title="Meta Description Optimization">
                <div className="p-6 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <MessageSquare className="w-12 h-12 animate-pulse text-indigo-500 mx-auto mb-4" />
                        <p className="text-gray-600">Loading products for meta description optimization...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Meta Description Optimization">
            <div className="p-6 space-y-6">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 animate-fade-in">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                                    <MessageSquare className="w-6 h-6 text-white" />
                                </div>
                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                                    <Rocket className="w-3 h-3 mr-1" /> CONVERSION FOCUSED
                                </Badge>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                    Craft Compelling Meta Descriptions
                                </span>
                            </h1>
                            <p className="text-gray-600 mb-4">
                                Create persuasive meta descriptions that entice clicks and improve search engine click-through rates.
                                Well-crafted meta descriptions can boost CTR by up to 35%.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="outline" className="gap-1">
                                    <MessageSquare className="w-3 h-3" /> Click Magnet
                                </Badge>
                                <Badge variant="outline" className="gap-1">
                                    <TrendingUp className="w-3 h-3" /> Higher CTR
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
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Eye className="w-4 h-4" />
                                        {products.length} Products
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Products for Meta Description Optimization</DialogTitle>
                                        <DialogDescription>
                                            {products.length} products that need meta description optimization
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
                                        {products.map((product) => (
                                            <div key={product.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <img
                                                    src={product.productImage}
                                                    alt={product.title}
                                                    className="w-12 h-12 rounded-lg object-cover border"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        Meta Desc: {product.metaDescription ? `${product.metaDescription.substring(0, 50)}...` : 'Not set'}
                                                    </p>
                                                </div>
                                                {!product.metaDescription || product.metaDescription.trim() === '' ? (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Empty
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">
                                                        {product.metaDescription.length} chars
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Button
                                onClick={() => setShowAIOptionsModal(true)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
                            >
                                <Brain className="w-4 h-4" />
                                Start AI Optimization
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-white to-indigo-50 border-indigo-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <RulerIcon className="w-4 h-4 text-indigo-500" />
                                Current Avg. Length
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {stats.averageLength}
                                <span className="text-sm font-normal text-gray-500 ml-1">chars</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {stats.averageLength < 150 ? "Too short" :
                                    stats.averageLength > 160 ? "May get truncated" : "Optimal"}
                            </div>
                            <Progress
                                value={Math.min(100, (stats.averageLength / 160) * 100)}
                                className="mt-2 h-1"
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-amber-500" />
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
                                {stats.emptyDescriptions} empty
                            </div>
                            <Progress
                                value={stats.seoScore}
                                className="mt-2 h-1"
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Search className="w-4 h-4 text-green-500" />
                                Keyword Inclusion
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                {stats.keywordInclusion}%
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Includes product keywords
                            </div>
                            <Progress
                                value={stats.keywordInclusion}
                                className="mt-2 h-1"
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-pink-50 border-pink-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-purple-500" />
                                CTR Boost
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900">
                                Up to 35%
                                <span className="text-sm font-normal text-gray-500 ml-1">increase</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                More compelling descriptions
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

                    {/* <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Time Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {products.length * 3} min
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Per product manually
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-600">AI works instantly</span>
              </div>
            </CardContent>
          </Card> */}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Classic Optimization */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-indigo-100">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileEdit className="w-5 h-5 text-indigo-600" />
                                    Classic Meta Description Optimization
                                    <Badge className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                                        PRECISE CONTROL
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Apply rules to create compelling meta descriptions for all products
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Copy Options */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-base font-medium">Use Product Description</Label>
                                            <p className="text-sm text-gray-500">
                                                Extract content from your product descriptions
                                            </p>
                                        </div>
                                        <Switch
                                            checked={classicRules.copyDescriptionToMeta}
                                            onCheckedChange={(checked) => setClassicRules({
                                                ...classicRules,
                                                copyDescriptionToMeta: checked,
                                                useFirstParagraph: checked ? classicRules.useFirstParagraph : false
                                            })}
                                        />
                                    </div>

                                    {/* {classicRules.copyDescriptionToMeta && (
                                        <div className="flex items-center space-x-2 ml-6">
                                            <Switch
                                                checked={classicRules.useFirstParagraph}
                                                onCheckedChange={(checked) => setClassicRules({
                                                    ...classicRules,
                                                    useFirstParagraph: checked
                                                })}
                                            />
                                            <Label className="text-sm">Use only first paragraph (recommended)</Label>
                                        </div>
                                    )} */}
                                </div>

                                {/* Prefix & Suffix */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">Add Prefix</Label>
                                            <Switch
                                                checked={classicRules.prefix.enabled}
                                                onCheckedChange={(checked) => setClassicRules({
                                                    ...classicRules,
                                                    prefix: { ...classicRules.prefix, enabled: checked }
                                                })}
                                            />
                                        </div>
                                        {classicRules.prefix.enabled && (
                                            <Input
                                                value={classicRules.prefix.value}
                                                onChange={(e) => setClassicRules({
                                                    ...classicRules,
                                                    prefix: { ...classicRules.prefix, value: e.target.value }
                                                })}
                                                placeholder="e.g., Discover, Explore, Buy"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">Add Suffix</Label>
                                            <Switch
                                                checked={classicRules.suffix.enabled}
                                                onCheckedChange={(checked) => setClassicRules({
                                                    ...classicRules,
                                                    suffix: { ...classicRules.suffix, enabled: checked }
                                                })}
                                            />
                                        </div>
                                        {classicRules.suffix.enabled && (
                                            <Input
                                                value={classicRules.suffix.value}
                                                onChange={(e) => setClassicRules({
                                                    ...classicRules,
                                                    suffix: { ...classicRules.suffix, value: e.target.value }
                                                })}
                                                placeholder="e.g., Free shipping available."
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Find & Replace */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Find & Replace Text</Label>
                                        <Switch
                                            checked={classicRules.findReplace.enabled}
                                            onCheckedChange={(checked) => setClassicRules({
                                                ...classicRules,
                                                findReplace: { ...classicRules.findReplace, enabled: checked }
                                            })}
                                        />
                                    </div>
                                    {classicRules.findReplace.enabled && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Input
                                                    value={classicRules.findReplace.find}
                                                    onChange={(e) => setClassicRules({
                                                        ...classicRules,
                                                        findReplace: { ...classicRules.findReplace, find: e.target.value }
                                                    })}
                                                    placeholder="Find text"
                                                />
                                            </div>
                                            <div>
                                                <Input
                                                    value={classicRules.findReplace.replace}
                                                    onChange={(e) => setClassicRules({
                                                        ...classicRules,
                                                        findReplace: { ...classicRules.findReplace, replace: e.target.value }
                                                    })}
                                                    placeholder="Replace with"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Find & Remove */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Find & Remove Text</Label>
                                        <Switch
                                            checked={classicRules.findRemove.enabled}
                                            onCheckedChange={(checked) => setClassicRules({
                                                ...classicRules,
                                                findRemove: { ...classicRules.findRemove, enabled: checked }
                                            })}
                                        />
                                    </div>
                                    {classicRules.findRemove.enabled && (
                                        <Input
                                            value={classicRules.findRemove.value}
                                            onChange={(e) => setClassicRules({
                                                ...classicRules,
                                                findRemove: { ...classicRules.findRemove, value: e.target.value }
                                            })}
                                            placeholder="Text to remove"
                                        />
                                    )}
                                </div>

                                {/* Include Keywords */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm">Include Keywords</Label>
                                            <p className="text-xs text-gray-500">Separate with commas</p>
                                        </div>
                                        <Switch
                                            checked={classicRules.includeKeywords.enabled}
                                            onCheckedChange={(checked) => setClassicRules({
                                                ...classicRules,
                                                includeKeywords: { ...classicRules.includeKeywords, enabled: checked }
                                            })}
                                        />
                                    </div>
                                    {classicRules.includeKeywords.enabled && (
                                        <Textarea
                                            value={classicRules.includeKeywords.keywords}
                                            onChange={(e) => setClassicRules({
                                                ...classicRules,
                                                includeKeywords: { ...classicRules.includeKeywords, keywords: e.target.value }
                                            })}
                                            placeholder="e.g., premium quality, eco-friendly, handmade"
                                            rows={2}
                                        />
                                    )}
                                </div>

                                {/* Call to Action */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Add Call to Action</Label>
                                        <Switch
                                            checked={classicRules.callToAction.enabled}
                                            onCheckedChange={(checked) => setClassicRules({
                                                ...classicRules,
                                                callToAction: { ...classicRules.callToAction, enabled: checked }
                                            })}
                                        />
                                    </div>
                                    {classicRules.callToAction.enabled && (
                                        <div className="flex gap-2">
                                            <Input
                                                value={classicRules.callToAction.text}
                                                onChange={(e) => setClassicRules({
                                                    ...classicRules,
                                                    callToAction: { ...classicRules.callToAction, text: e.target.value }
                                                })}
                                                placeholder="Call to action text"
                                            />
                                            <Select
                                                value={classicRules.callToAction.text}
                                                onValueChange={(value) => setClassicRules({
                                                    ...classicRules,
                                                    callToAction: { ...classicRules.callToAction, text: value }
                                                })}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select CTA" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Shop now!">Shop now!</SelectItem>
                                                    <SelectItem value="Buy today!">Buy today!</SelectItem>
                                                    <SelectItem value="Learn more.">Learn more.</SelectItem>
                                                    <SelectItem value="Discover now.">Discover now.</SelectItem>
                                                    <SelectItem value="Order today!">Order today!</SelectItem>
                                                    <SelectItem value="Try it now!">Try it now!</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Truncate */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm">Truncate Long Descriptions</Label>
                                            <p className="text-xs text-gray-500">Recommended max: 160 characters</p>
                                        </div>
                                        <Switch
                                            checked={classicRules.truncate.enabled}
                                            onCheckedChange={(checked) => setClassicRules({
                                                ...classicRules,
                                                truncate: { ...classicRules.truncate, enabled: checked }
                                            })}
                                        />
                                    </div>
                                    {classicRules.truncate.enabled && (
                                        <div className="space-y-3">
                                            <div>
                                                <Label>Maximum Length (characters)</Label>
                                                <Input
                                                    type="number"
                                                    value={classicRules.truncate.maxLength}
                                                    onChange={(e) => setClassicRules({
                                                        ...classicRules,
                                                        truncate: { ...classicRules.truncate, maxLength: parseInt(e.target.value) || 160 }
                                                    })}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={classicRules.truncate.preserveWords}
                                                    onCheckedChange={(checked) => setClassicRules({
                                                        ...classicRules,
                                                        truncate: { ...classicRules.truncate, preserveWords: checked }
                                                    })}
                                                />
                                                <Label className="text-sm">Preserve word boundaries (don't cut words)</Label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() => handleClassicOptimization(true)}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview Changes
                                    </Button>
                                    <Button
                                        onClick={() => handleClassicOptimization(false)}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Apply Directly
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - AI Optimization */}
                    <div className="space-y-6">
                        <Card className="border-purple-100">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-600" />
                                    AI-Powered Optimization
                                    <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-rose-500 text-white">
                                        RECOMMENDED
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Let AI craft persuasive, click-worthy meta descriptions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-1">Why AI Optimization?</h4>
                                            <ul className="text-sm text-gray-600 space-y-1">
                                                <li>✓ Persuasive and compelling</li>
                                                <li>✓ Includes primary keywords</li>
                                                <li>✓ Optimal length (150-160 chars)</li>
                                                <li>✓ Strong call to action</li>
                                                <li>✓ Unique for each product</li>
                                                <li>✓ SEO-optimized structure</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setShowAIOptionsModal(true)}
                                    className="w-full bg-gradient-to-r from-purple-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 gap-2"
                                >
                                    <Brain className="w-4 h-4" />
                                    Start AI Optimization
                                </Button>

                                <div className="text-xs text-gray-500 pt-2 border-t">
                                    <p className="font-medium mb-1">What AI creates:</p>
                                    <ul className="space-y-1">
                                        <li>• Compelling product summaries</li>
                                        <li>• Keyword-rich descriptions</li>
                                        <li>• Strong calls to action</li>
                                        <li>• Benefit-focused language</li>
                                        <li>• Perfect length for SEO</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Best Practices */}
                        <Card className="border-blue-100">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Target className="w-4 h-4 text-blue-500" />
                                    Best Practices
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Keep between 150-160 characters</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Include primary keywords naturally</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Write compelling calls to action</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Highlight unique benefits</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Make each description unique</span>
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
                                AI Optimization Options
                            </DialogTitle>
                            <DialogDescription>
                                Choose how you want to apply AI optimization
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Preview First
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                    See all AI-generated meta descriptions before applying them to your store
                                </p>
                                <Button
                                    onClick={() => {
                                        setShowAIOptionsModal(false);
                                        handleAIOptimization(false);
                                    }}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
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
                                    AI will optimize and immediately apply the best meta descriptions to your Shopify store
                                </p>
                                <Button
                                    onClick={() => {
                                        setShowAIOptionsModal(false);
                                        handleAIOptimization(true);
                                    }}
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
                                <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                                Optimizing Meta Descriptions
                            </DialogTitle>
                            <DialogDescription>
                                Please wait while we process your products...
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
                                    {progress.current} of {progress.total} products processed
                                </p>
                            </div>
                            <div className="flex justify-center">
                                <Brain className="w-12 h-12 text-indigo-500 animate-pulse" />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Preview Modal */}
                <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                Meta Description Optimization Preview
                            </DialogTitle>
                            <DialogDescription>
                                Review the optimized meta descriptions before applying them to your store
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {optimizationResults.map((result, index) => (
                                <div key={result.productId} className="p-4 border rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={result.image}
                                            alt={result.oldMetaDescription}
                                            className="w-16 h-16 rounded-lg object-cover border"
                                        />
                                        <div className="flex-1">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-gray-500 mb-1">Original Meta Description</Label>
                                                    <p className="text-sm text-gray-700">{result.oldMetaDescription || '(Empty)'}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {result.oldMetaDescription === '(Empty)' ? '0' : result.oldMetaDescription.length} chars
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-500 mb-1">Optimized Meta Description</Label>
                                                    <p className="text-sm font-medium text-gray-900">{result.newMetaDescription}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{result.newMetaDescription.length} chars</p>
                                                </div>
                                            </div>
                                            {result.oldMetaDescription !== result.newMetaDescription && (
                                                <div className="mt-3">
                                                    <Badge variant={result.newMetaDescription.length > (result.oldMetaDescription === '(Empty)' ? 0 : result.oldMetaDescription.length) ? "success" : "secondary"} className="text-xs">
                                                        {result.oldMetaDescription === '(Empty)' ? 'Added' : 'Improved'}
                                                    </Badge>
                                                    <span className="text-xs text-gray-600 ml-2">
                                                        {Math.abs(result.newMetaDescription.length - (result.oldMetaDescription === '(Empty)' ? 0 : result.oldMetaDescription.length))} characters {result.newMetaDescription.length > (result.oldMetaDescription === '(Empty)' ? 0 : result.oldMetaDescription.length) ? 'added' : 'removed'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                    calculateComparisonStats(optimizationResults);
                                    setShowComparisonModal(true);
                                }}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
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
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Optimization Results
                            </DialogTitle>
                            <DialogDescription>
                                Here's how much better your meta descriptions will perform
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
                                            {stats.averageLength}
                                        </div>
                                        <p className="text-sm text-center text-gray-600 mt-1">Avg. Character Length</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Comparison Text */}
                            <div className="text-center">
                                <p className="text-gray-700">
                                    <span className="font-semibold">Your new meta descriptions are {Math.abs(stats.improvement)}% better</span>
                                    {" "}optimized for search engines.
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Expected click-through rate increase: <span className="font-medium text-green-600">Up to 35%</span>
                                </p>
                            </div>

                            {/* Benefits */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    What you're getting:
                                </h4>
                                <ul className="space-y-1 text-sm text-green-700">
                                    <li>✓ SEO-optimized for better rankings</li>
                                    <li>✓ Higher click-through rates from search</li>
                                    <li>✓ Perfect length (150-160 characters)</li>
                                    <li>✓ Includes primary keywords naturally</li>
                                    <li>✓ Compelling calls to action</li>
                                    <li>✓ Unique for each product page</li>
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
                                onClick={() => applyMetaDescriptionOptimizations(optimizationResults)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
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
                                Your meta descriptions have been optimized successfully
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
                                    {progress.current} of {progress.total} meta descriptions were successfully updated.
                                </p>
                                {progress.total - progress.current > 0 && (
                                    <p className="text-sm text-amber-600 mt-2">
                                        {progress.total - progress.current} meta descriptions failed to update
                                    </p>
                                )}
                            </div>

                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Pro Tip:</span> Monitor your search traffic in Google Analytics over the next 14-28 days. You should see improved click-through rates from search results as users respond to your compelling new meta descriptions.
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
                                    fetchStoredProducts();
                                }}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                            >
                                Optimize More Products
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}