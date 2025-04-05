import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/20 px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">AI-Powered</span>{" "}
                Conversations
              </h1>
              <p className="text-lg text-neutral-700 md:pr-10">
                Customize your AI chatbots to help with coding, writing, research, and more. 
                Upload files and get intelligent responses powered by the latest AI models.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="shadow-md"
                  onClick={() => setLocation('/app')}
                >
                  Start Chatting
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setLocation('/features')}
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex-1 mt-10 md:mt-0">
              <div className="bg-white rounded-xl shadow-xl p-6 border border-neutral-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium flex-shrink-0">
                    A
                  </div>
                  <div className="bg-neutral-100 rounded-lg p-3 flex-1">
                    <p className="text-sm text-neutral-900">
                      Hello! I'm your AI assistant. How can I help you today?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4 justify-end">
                  <div className="bg-primary text-white rounded-lg p-3 flex-1">
                    <p className="text-sm">
                      Can you help me optimize this React code snippet?
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-neutral-300 flex items-center justify-center text-white font-medium flex-shrink-0">
                    U
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium flex-shrink-0">
                    A
                  </div>
                  <div className="bg-neutral-100 rounded-lg p-3 flex-1">
                    <p className="text-sm text-neutral-900">
                      Of course! Let me analyze your code and suggest optimizations...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-16 container mx-auto max-w-5xl px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            title="File Upload" 
            description="Upload code, text, PDFs, and more for analysis and contextual conversations."
            icon={<DocumentIcon />}
          />
          <FeatureCard 
            title="Custom Bots" 
            description="Create specialized bots for different tasks with customizable parameters."
            icon={<BotIcon />}
          />
          <FeatureCard 
            title="Real-time Streaming" 
            description="Watch responses appear in real-time for a more interactive experience."
            icon={<StreamIcon />}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-neutral-100 py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-neutral-500 text-sm">
              © {new Date().getFullYear()} AI Chat Assistant. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-neutral-500 hover:text-primary text-sm">Terms</a>
              <a href="#" className="text-neutral-500 hover:text-primary text-sm">Privacy</a>
              <a href="#" className="text-neutral-500 hover:text-primary text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature card component
function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  );
}

// Icons
function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  );
}

function BotIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  );
}

function StreamIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      <polyline points="13 2 13 9 20 9"/>
      <path d="M7 12h10"/>
      <path d="M7 16h10"/>
    </svg>
  );
}