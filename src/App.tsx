import React, { useState, useEffect } from 'react';
import Whiteboard from './components/Whiteboard';
import { Settings, Play, Copy, Check } from 'lucide-react';

export default function App() {
  const [platformInfo, setPlatformInfo] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Tool Config State
  const [loginUrl, setLoginUrl] = useState('https://benqldb.h5p.com/lti/login');
  const [targetUrl, setTargetUrl] = useState('https://benqldb.h5p.com/lti/launch');
  const [clientId, setClientId] = useState('12345');
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    fetch('/api/platform-info')
      .then(res => res.json())
      .then(data => setPlatformInfo(data))
      .catch(console.error);
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowIframe(false);
    setTimeout(() => {
      setShowIframe(true);
    }, 100);
  };

  useEffect(() => {
    if (showIframe) {
      setTimeout(() => {
        const form = document.getElementById('initiate-form') as HTMLFormElement;
        if (form) form.submit();
      }, 100);
    }
  }, [showIframe]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Settings size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-slate-800">Mock LTI Platform</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">LTI 1.3 Advantage Simulator</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
        
        {/* Left Column: Platform Config & Whiteboard */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Platform Info Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Platform Configuration</h2>
            <p className="text-xs text-slate-600 mb-4">
              Register this platform in your LTI Tool (e.g., LTI Reference Implementation) using the endpoints below.
            </p>
            
            {platformInfo ? (
              <div className="space-y-4">
                {[
                  { label: 'Issuer', value: platformInfo.issuer, key: 'iss' },
                  { label: 'OIDC Auth URL', value: platformInfo.authUrl, key: 'auth' },
                  { label: 'JWKS URL', value: platformInfo.jwksUrl, key: 'jwks' },
                  { label: 'OAuth2 Token URL', value: platformInfo.tokenUrl, key: 'token' },
                  { label: 'Deployment ID', value: 'deployment-1', key: 'deploy' },
                ].map((item) => (
                  <div key={item.key} className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                      <code className="text-xs text-slate-600 flex-1 truncate font-mono">{item.value}</code>
                      <button 
                        onClick={() => copyToClipboard(item.value, item.key)}
                        className="text-slate-400 hover:text-indigo-600 transition"
                        title="Copy to clipboard"
                      >
                        {copiedKey === item.key ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="animate-pulse flex flex-col gap-4">
                <div className="h-10 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
              </div>
            )}
          </div>

          {/* Native App UI (Whiteboard) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 min-h-[300px] flex flex-col">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Native Application</h2>
              <p className="text-xs text-slate-500">The core mock application acting as the platform.</p>
            </div>
            <div className="flex-1 bg-white relative">
              <Whiteboard />
            </div>
          </div>

        </div>

        {/* Right Column: Tool Launcher & iFrame */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Launch LTI Tool</h2>
            
            <form onSubmit={handleLaunch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">OIDC Login Initiation URL</label>
                  <input 
                    type="url" 
                    required
                    value={loginUrl}
                    onChange={e => setLoginUrl(e.target.value)}
                    placeholder="https://tool.com/login"
                    className="bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Target Link URI (Launch URL)</label>
                  <input 
                    type="url" 
                    required
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="https://tool.com/launch"
                    className="bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Client ID</label>
                <input 
                  type="text" 
                  required
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="e.g. 12345"
                  className="bg-white border border-slate-200 rounded px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-6 rounded text-xs shadow-sm transition flex items-center gap-2"
                >
                  <Play size={16} fill="currentColor" />
                  Perform LTI Launch
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[500px]">
             <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tool iFrame</h2>
                  <p className="text-xs text-slate-500">The launched tool will render below</p>
                </div>
                {showIframe && (
                   <span className="flex h-2 w-2 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                   </span>
                )}
             </div>
             <div className="flex-1 bg-slate-100 p-2 relative">
                {showIframe ? (
                  <iframe 
                    name="lti-tool-frame"
                    className="w-full h-full bg-white border border-slate-200 rounded shadow-sm"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    allow="microphone; camera; display-capture"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-3">
                     <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-white">
                       <Play size={24} className="text-slate-300" />
                     </div>
                     <p className="text-xs font-medium text-slate-500">Enter configuration and click Launch</p>
                  </div>
                )}
                
                {/* Hidden form to submit to our backend initiate endpoint targeting the iframe */}
                {showIframe && (
                  <form 
                    id="initiate-form"
                    method="POST" 
                    action="/api/lti/initiate" 
                    target="lti-tool-frame"
                    className="hidden"
                  >
                    <input type="hidden" name="login_initiation_url" value={loginUrl} />
                    <input type="hidden" name="target_link_uri" value={targetUrl} />
                    <input type="hidden" name="client_id" value={clientId} />
                  </form>
                )}
                
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
