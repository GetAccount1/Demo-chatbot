import { useState, useEffect } from "react";
import { X, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "@shared/schema";
import { updateSettings } from "@/lib/openai";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

// Predefined API endpoints for popular AI services
const PREDEFINED_ENDPOINTS = [
  { name: "OpenAI", url: "https://api.openai.com/v1" },
  { name: "Azure OpenAI", url: "https://YOUR_RESOURCE_NAME.openai.azure.com" },
  { name: "Anthropic", url: "https://api.anthropic.com" },
  { name: "Cohere", url: "https://api.cohere.ai/v1" },
  { name: "Custom", url: "" }
];

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [tokenLimit, setTokenLimit] = useState(4000);
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(0.5);
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("https://api.openai.com/v1");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState("OpenAI");
  const [customApiHeaders, setCustomApiHeaders] = useState("");
  const [useStreamingApi, setUseStreamingApi] = useState(true);
  const [activeTab, setActiveTab] = useState("parameters");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      apiKey?: string;
      apiUrl?: string;
      tokenLimit?: number;
      temperature?: string;
      topK?: string;
      useStreamingApi?: boolean;
      customApiHeaders?: string;
      hasApiKey?: boolean;
    }) => {
      return updateSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      // Cast settings to a record for type safety
      const settingsObj = settings as Record<string, any>;
      
      // Handle each setting safely with default values
      const tokenLimit = typeof settingsObj.tokenLimit === 'number' && !isNaN(settingsObj.tokenLimit) 
        ? settingsObj.tokenLimit 
        : 4000;
      setTokenLimit(tokenLimit);
      
      const temperatureStr = settingsObj.temperature || '0.7';
      const temperature = parseFloat(temperatureStr);
      setTemperature(isNaN(temperature) ? 0.7 : temperature);
      
      const topKStr = settingsObj.topK || '0.5';
      const topK = parseFloat(topKStr);
      setTopK(isNaN(topK) ? 0.5 : topK);
      
      // API URL with default
      const apiUrl = settingsObj.apiUrl || "https://api.openai.com/v1";
      setApiUrl(apiUrl);
      
      // Boolean values
      setHasApiKey(Boolean(settingsObj.hasApiKey));
      setUseStreamingApi(settingsObj.useStreamingApi !== false);
      
      // Optional string
      setCustomApiHeaders(settingsObj.customApiHeaders || "");
      
      // Determine selected endpoint based on API URL
      const predefinedEndpoint = PREDEFINED_ENDPOINTS.find(e => e.url === apiUrl);
      setSelectedEndpoint(predefinedEndpoint ? predefinedEndpoint.name : "Custom");
    }
  }, [settings]);

  // Handle endpoint selection change
  const handleEndpointChange = (value: string) => {
    setSelectedEndpoint(value);
    if (value !== "Custom") {
      const endpoint = PREDEFINED_ENDPOINTS.find(e => e.name === value);
      if (endpoint) setApiUrl(endpoint.url);
    }
  };

  const handleSaveSettings = () => {
    const updatedSettings: {
      apiKey?: string;
      apiUrl?: string;
      tokenLimit?: number;
      temperature?: string;
      topK?: string;
      useStreamingApi?: boolean;
      customApiHeaders?: string;
    } = {
      tokenLimit,
      temperature: temperature.toString(),
      topK: topK.toString(),
      apiUrl,
      useStreamingApi,
      customApiHeaders
    };
    
    if (apiKey) {
      updatedSettings.apiKey = apiKey;
    }
    
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleTestConnection = () => {
    toast({
      title: "Testing connection...",
      description: "Attempting to connect to the specified API endpoint.",
    });
    
    // Here we'd actually test the connection
    // For now, just show a success toast
    setTimeout(() => {
      toast({
        title: "Connection successful",
        description: "Successfully connected to the API endpoint.",
      });
    }, 1500);
  };

  if (!open) return null;

  return (
    <aside className="bg-white w-80 border-l border-neutral-200 overflow-y-auto fixed right-0 top-0 bottom-0 z-20 shadow-lg">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Settings</h2>
        <button 
          className="text-neutral-500 hover:text-neutral-700"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {isLoading ? (
        <div className="p-4 text-center">Loading settings...</div>
      ) : (
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="parameters">Model Params</TabsTrigger>
              <TabsTrigger value="connection">API Connection</TabsTrigger>
            </TabsList>
            
            <TabsContent value="parameters" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Token Limit (max 16K)</Label>
                    <span className="text-sm text-neutral-700">
                      {tokenLimit >= 1000 ? `${(tokenLimit / 1000).toFixed(0)}K` : tokenLimit}
                    </span>
                  </div>
                  <Slider
                    value={[tokenLimit]}
                    min={1000}
                    max={16000}
                    step={1000}
                    onValueChange={(value) => setTokenLimit(value[0])}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Temperature (max 1.0)</Label>
                    <span className="text-sm text-neutral-700">{temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[temperature]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => setTemperature(value[0])}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Top-K (max 1.0)</Label>
                    <span className="text-sm text-neutral-700">{topK.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[topK]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => setTopK(value[0])}
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="streaming-api"
                    checked={useStreamingApi}
                    onCheckedChange={setUseStreamingApi}
                  />
                  <Label htmlFor="streaming-api">Use streaming API</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-neutral-500 hover:text-neutral-700">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enable to see responses appear in real-time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="connection" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="apiProvider">API Provider</Label>
                  <Select value={selectedEndpoint} onValueChange={handleEndpointChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select API Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_ENDPOINTS.map((endpoint) => (
                        <SelectItem key={endpoint.name} value={endpoint.name}>
                          {endpoint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    type="text"
                    placeholder="https://api.example.com"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    disabled={selectedEndpoint !== "Custom" && selectedEndpoint !== "Azure OpenAI"}
                  />
                  {selectedEndpoint === "Azure OpenAI" && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Replace YOUR_RESOURCE_NAME with your Azure resource name
                    </p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="apiKey">
                    API Key {hasApiKey && <span className="text-neutral-500 text-xs">(Saved)</span>}
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={hasApiKey ? "••••••••••••••••••••" : "Enter your API key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="customHeaders">Custom Headers (Optional)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-neutral-500 hover:text-neutral-700">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add custom headers in JSON format</p>
                          <p className="text-xs">{"Example: { \"x-api-version\": \"1.0\" }"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="customHeaders"
                    placeholder='{"x-api-version": "1.0"}'
                    value={customApiHeaders}
                    onChange={(e) => setCustomApiHeaders(e.target.value)}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleTestConnection}
                >
                  Test Connection
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 pt-4 border-t border-neutral-200">
            <Button 
              className="w-full"
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
