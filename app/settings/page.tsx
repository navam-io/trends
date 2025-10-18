'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/lib/ui/button';
import { Textarea } from '@/lib/ui/textarea';
import { Label } from '@/lib/ui/label';
import { Switch } from '@/lib/ui/switch';
import { Slider } from '@/lib/ui/slider';
import { Badge } from '@/lib/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/ui/tabs';
import { Alert, AlertDescription } from '@/lib/ui/alert';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Lock,
  Edit3,
  ArrowLeft,
  Zap,
  Eye,
  Copy,
  Play,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { TrendPromptSettings, DEFAULT_TREND_SETTINGS, SettingsState } from '@/features/trends/types/settings';
import { buildTrendGenerationPrompt } from '@/features/trends/utils/settings-loader';
import { trpc } from '@/lib/trpc/client';
import { CONFIG_CONSTANTS } from '@/lib/config/constants';

interface TestTrend {
  title: string;
  summary: string;
  category: string;
  impact_score: number;
  source: string;
  source_url?: string;
}

const SETTINGS_STORAGE_KEY = 'trenddit_prompt_settings';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<TrendPromptSettings>(DEFAULT_TREND_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentModel, setCurrentModel] = useState(CONFIG_CONSTANTS.ai.defaultModel);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState<'system' | 'user' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResult, setTestResult] = useState<{
    trends?: TestTrend[];
    error?: string;
    timestamp?: Date;
  } | null>(null);
  const [trendCount, setTrendCount] = useState(20);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings: SettingsState = JSON.parse(stored);
        setSettings(parsedSettings.prompts);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
  }, []);

  // Load current model from config
  useEffect(() => {
    // For client-side, we use the constants which should match config.yml
    setCurrentModel(CONFIG_CONSTANTS.ai.defaultModel);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      const settingsState: SettingsState = {
        prompts: settings,
        lastUpdated: new Date().toISOString(),
        version: 1
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
      
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_TREND_SETTINGS);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const updateUserPrompt = (field: keyof typeof settings.userPrompt, value: string) => {
    setSettings(prev => ({
      ...prev,
      userPrompt: {
        ...prev.userPrompt,
        [field]: value
      }
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const updateUrlVerification = (field: keyof typeof settings.urlVerification, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      urlVerification: {
        ...prev.urlVerification,
        [field]: value
      }
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const updateModelSettings = (field: keyof typeof settings.modelSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      modelSettings: {
        ...prev.modelSettings,
        [field]: value
      }
    }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleCopy = async (content: string, type: 'system' | 'user') => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const generatePreviewPrompts = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Use the system prompt from shared constants (synced with config.yml)
    const systemMessage = CONFIG_CONSTANTS.ai.systemPrompt;
    
    const userPrompt = buildTrendGenerationPrompt(
      settings,
      currentMonth,
      20,
      5, // trendsPerCategory
      undefined // no company profile for preview
    );

    return { systemMessage, userPrompt };
  };

  const testGenerationMutation = trpc.trends.testGeneration.useMutation();

  const handleTestGeneration = async () => {
    setIsGenerating(true);
    setTestResult(null);

    try {
      const result = await testGenerationMutation.mutateAsync({
        settings,
        trendCount
      });

      setTestResult({
        trends: result.trends,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Test generation failed:', error);
      
      let errorMessage = 'Failed to generate test trends. Please try again.';
      
      // Extract error message from tRPC error
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }

      setTestResult({
        error: errorMessage,
        timestamp: new Date()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <Settings className="h-6 w-6 text-indigo-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Trend Generation Settings
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Configure how AI trends are generated and verified
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Save Status */}
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Settings saved!</span>
                  </div>
                )}
                
                {hasChanges && !saveSuccess && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                    <Zap className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}

                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                
                <Button 
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Tabs defaultValue="prompts" className="w-full">
            <div className="border-b border-gray-200 bg-gray-50">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger 
                  value="prompts" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-white px-8 py-4"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Prompt Configuration
                </TabsTrigger>
                <TabsTrigger 
                  value="urls" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-white px-8 py-4"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  URL Verification
                </TabsTrigger>
                <TabsTrigger 
                  value="model" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-white px-8 py-4"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Model Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="preview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-white px-8 py-4"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Prompt Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="test" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-white px-8 py-4"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Test Generation
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-8">
              <TabsContent value="prompts" className="space-y-8 mt-0">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Configure how trends are generated. Only user-editable sections can be modified - system-controlled parts ensure app stability.
                  </AlertDescription>
                </Alert>

                {/* User-Editable Prompts */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <Edit3 className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-900">User-Editable Prompts</h2>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      Customizable
                    </Badge>
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="trendFocus" className="text-base font-medium text-gray-900">
                          Trend Focus & Priorities
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Define what types of trends to prioritize and their characteristics
                        </p>
                        <Textarea
                          id="trendFocus"
                          value={settings.userPrompt.trendFocus}
                          onChange={(e) => updateUserPrompt('trendFocus', e.target.value)}
                          className="min-h-[120px]"
                          placeholder="Define what types of trends to prioritize..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="industryContext" className="text-base font-medium text-gray-900">
                          Industry Context & Target Audience
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Specify target industries, business contexts, and audience characteristics
                        </p>
                        <Textarea
                          id="industryContext"
                          value={settings.userPrompt.industryContext}
                          onChange={(e) => updateUserPrompt('industryContext', e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Describe target industries and business contexts..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="timeframeContext" className="text-base font-medium text-gray-900">
                          Timeframe & Currency Requirements
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Define how current and specific trends should be, including data requirements
                        </p>
                        <Textarea
                          id="timeframeContext"
                          value={settings.userPrompt.timeframeContext}
                          onChange={(e) => updateUserPrompt('timeframeContext', e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Specify how current and specific trends should be..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="sourcePreferences" className="text-base font-medium text-gray-900">
                          Source Preferences & Quality Requirements
                        </Label>
                        <p className="text-sm text-gray-600 mb-3">
                          Specify preferred sources, URL requirements, and quality standards
                        </p>
                        <Textarea
                          id="sourcePreferences"
                          value={settings.userPrompt.sourcePreferences}
                          onChange={(e) => updateUserPrompt('sourcePreferences', e.target.value)}
                          className="min-h-[100px]"
                          placeholder="Define preferred sources and URL requirements..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System-Controlled Prompts (Read-Only) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-900">System-Controlled Prompts</h2>
                    <Badge variant="outline" className="text-gray-600 border-gray-200">
                      Protected
                    </Badge>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      These sections are controlled by the application to ensure proper functionality and cannot be modified.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div>
                      <Label className="text-base font-medium text-gray-700">Response Format</Label>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{settings.systemPrompt.responseFormat}</p>
                    </div>
                    <div>
                      <Label className="text-base font-medium text-gray-700">Validation Rules</Label>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{settings.systemPrompt.validationRules}</p>
                    </div>
                    <div>
                      <Label className="text-base font-medium text-gray-700">Category Requirements</Label>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{settings.systemPrompt.categoryRequirements}</p>
                    </div>
                    <div>
                      <Label className="text-base font-medium text-gray-700">URL Validation Rules</Label>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{settings.systemPrompt.urlValidationRules}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="urls" className="space-y-8 mt-0">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    URL verification helps ensure source links point to real articles, not fake/generated URLs.
                  </AlertDescription>
                </Alert>

                <div className="space-y-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-gray-900">Enable URL Verification</Label>
                        <p className="text-sm text-gray-600">
                          Verify that source URLs are real and accessible before displaying them to users
                        </p>
                      </div>
                      <Switch
                        checked={settings.urlVerification.enabled}
                        onCheckedChange={(checked) => updateUrlVerification('enabled', checked)}
                      />
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium text-gray-900 mb-3 block">
                          Verification Timeout: {settings.urlVerification.timeout}ms
                        </Label>
                        <Slider
                          value={[settings.urlVerification.timeout]}
                          onValueChange={([value]) => updateUrlVerification('timeout', value)}
                          max={15000}
                          min={1000}
                          step={500}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Maximum time to wait when checking if URLs are accessible (1-15 seconds)
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="space-y-2">
                          <Label className="text-base font-medium text-gray-900">Fallback to Generated URLs</Label>
                          <p className="text-sm text-gray-600">
                            If real URLs fail verification, use generated placeholder URLs instead of showing no link
                          </p>
                        </div>
                        <Switch
                          checked={settings.urlVerification.fallbackToGenerated}
                          onCheckedChange={(checked) => updateUrlVerification('fallbackToGenerated', checked)}
                        />
                      </div>

                      {!settings.urlVerification.fallbackToGenerated && (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Recommended:</strong> Disabled fallback means only verified real URLs will be shown, 
                            preventing users from clicking on fake/generated links.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="model" className="space-y-8 mt-0">
                <div className="space-y-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="space-y-8">
                      <div>
                        <Label className="text-base font-medium text-gray-900 mb-3 block">
                          Temperature: {settings.modelSettings.temperature}
                        </Label>
                        <Slider
                          value={[settings.modelSettings.temperature]}
                          onValueChange={([value]) => updateModelSettings('temperature', value)}
                          max={1}
                          min={0}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Controls creativity vs focus. Higher values (0.8-1.0) make output more creative and varied, 
                          lower values (0.1-0.3) make it more focused and deterministic.
                        </p>
                      </div>

                      <div className="pt-6 border-t border-gray-200">
                        <Label className="text-base font-medium text-gray-900 mb-3 block">
                          Max Tokens: {settings.modelSettings.maxTokens}
                        </Label>
                        <Slider
                          value={[settings.modelSettings.maxTokens]}
                          onValueChange={([value]) => updateModelSettings('maxTokens', value)}
                          max={4000}
                          min={1000}
                          step={100}
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Maximum number of tokens (words/pieces) in the AI response. Higher values allow for more detailed trends but cost more.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Model:</strong> Currently using {currentModel} for optimal cost/performance balance. 
                      Model selection may become configurable in future versions.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-8 mt-0">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertDescription>
                    This shows the actual prompts sent to the AI model, combining your customizations with system-controlled sections.
                  </AlertDescription>
                </Alert>

                {(() => {
                  const { systemMessage, userPrompt } = generatePreviewPrompts();
                  return (
                    <div className="space-y-6">
                      {/* System Message Preview */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <h3 className="text-lg font-semibold text-gray-900">System Message</h3>
                              <Badge variant="outline" className="text-gray-600 border-gray-200">
                                AI Role Definition
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(systemMessage, 'system')}
                              className="flex items-center gap-2"
                            >
                              {copySuccess === 'system' ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="p-6">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border overflow-x-auto">
                            {systemMessage}
                          </pre>
                        </div>
                      </div>

                      {/* User Prompt Preview */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                              <h3 className="text-lg font-semibold text-gray-900">User Prompt</h3>
                              <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                                Complete Instructions
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(userPrompt, 'user')}
                              className="flex items-center gap-2"
                            >
                              {copySuccess === 'user' ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="p-6">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border overflow-x-auto max-h-96 overflow-y-auto">
                            {userPrompt}
                          </pre>
                        </div>
                      </div>

                      {/* Model Configuration Summary */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Settings className="h-5 w-5 text-gray-600" />
                          Model Configuration
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="text-gray-600 mb-1">Model</div>
                            <div className="font-medium">{currentModel}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="text-gray-600 mb-1">Temperature</div>
                            <div className="font-medium">{settings.modelSettings.temperature}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="text-gray-600 mb-1">Max Tokens</div>
                            <div className="font-medium">{settings.modelSettings.maxTokens.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <div className="text-gray-600 mb-1">Response Format</div>
                            <div className="font-medium">JSON Object</div>
                          </div>
                        </div>
                      </div>

                      {/* Help Section */}
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>How to use this preview:</strong> The system message defines the AI&apos;s role, while the user prompt contains your 
                          custom settings plus system requirements. Any changes you make in other tabs will be reflected here immediately. 
                          Use the copy buttons to export these prompts for testing in other AI tools.
                        </AlertDescription>
                      </Alert>
                    </div>
                  );
                })()}
              </TabsContent>

              <TabsContent value="test" className="space-y-8 mt-0">
                <Alert>
                  <Play className="h-4 w-4" />
                  <AlertDescription>
                    Test your current prompt settings by generating actual trends. This uses your OpenAI API key and will consume tokens.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  {/* Test Generation Controls */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Play className="h-5 w-5 text-indigo-600" />
                          Generate Test Trends
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Click to generate {trendCount} trends using your current settings
                        </p>
                      </div>
                      <Button
                        onClick={handleTestGeneration}
                        disabled={isGenerating}
                        className="min-w-[140px] flex items-center gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Generate Trends
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Trend Count Configuration */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-900 mb-3 block">
                            Number of Trends to Generate: {trendCount}
                          </Label>
                          <div className="px-3">
                            <Slider
                              value={[trendCount]}
                              onValueChange={([value]) => setTrendCount(value)}
                              max={20}
                              min={5}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>5</span>
                              <span>10</span>
                              <span>15</span>
                              <span>20</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Current Settings Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="text-sm font-medium text-gray-900 mb-2">Current Test Configuration:</div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="text-gray-600">Trends:</span>
                          <div className="font-medium">{trendCount}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Model:</span>
                          <div className="font-medium">{currentModel}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Temperature:</span>
                          <div className="font-medium">{settings.modelSettings.temperature}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Max Tokens:</span>
                          <div className="font-medium">{settings.modelSettings.maxTokens.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">URL Verification:</span>
                          <div className="font-medium">{settings.urlVerification.enabled ? 'Enabled' : 'Disabled'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Results */}
                  {testResult && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {testResult.error ? (
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            ) : (
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">
                              {testResult.error ? 'Generation Failed' : 'Test Results'}
                            </h3>
                            {testResult.timestamp && (
                              <Badge variant="outline" className="text-gray-600 border-gray-200">
                                {testResult.timestamp.toLocaleTimeString()}
                              </Badge>
                            )}
                          </div>
                          {testResult.trends && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {testResult.trends.length} trends generated
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-6">
                        {testResult.error ? (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-red-800">
                              {testResult.error}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-4">
                            {testResult.trends?.map((trend, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className="font-semibold text-gray-900 leading-tight">
                                    {trend.title}
                                  </h4>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge className={`text-xs ${
                                      trend.category === 'consumer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                      trend.category === 'competition' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                      trend.category === 'economy' ? 'bg-green-100 text-green-800 border-green-200' :
                                      trend.category === 'regulation' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                      'bg-gray-100 text-gray-800 border-gray-200'
                                    }`}>
                                      {trend.category}
                                    </Badge>
                                    <div className="text-xs text-gray-600">
                                      Impact: {trend.impact_score}/10
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {trend.summary}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>Source: {trend.source}</span>
                                  {trend.source_url && (
                                    <a 
                                      href={trend.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      View Article
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {testResult.trends && testResult.trends.length > 0 && (
                              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-900">
                                    Generation Successful!
                                  </span>
                                </div>
                                <p className="text-sm text-green-800">
                                  Your prompt settings generated {testResult.trends.length} trends successfully. 
                                  If you&apos;re satisfied with these results, your settings are working well.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Help Section */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Testing tips:</strong> This test uses the same logic as the main trend generation. 
                      If you encounter errors, check your OpenAI API key configuration or adjust your prompt settings. 
                      Rate limits may apply based on your OpenAI plan.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}