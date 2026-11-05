import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight,
  MousePointerClick,
  Code
} from 'lucide-react';
import { downloadXmlFile } from '../utils/xmlGenerator';

export default function TestLinkTransferModal({
  isOpen,
  onClose,
  xmlFileName,
  combinedXml
}) {
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const testLinkUrl = 'https://testing.creditq.co.in/index.php';

  // Bookmarklet / Auto-Clicker script for TestLink
  const autoClickerScript = `javascript:(function(){
  console.log('[TestLink Auto-Navigator] Initiating auto-clicks with 3s delay...');

  function findInFrames(selector) {
    var el = document.querySelector(selector);
    if (el) return el;
    for (var i = 0; i < window.frames.length; i++) {
      try {
        var doc = window.frames[i].document;
        if (doc) {
          var found = doc.querySelector(selector);
          if (found) return found;
        }
      } catch(e) {}
    }
    return null;
  }

  // Step 1: Click Test Specification
  var testSpecImg = findInFrames("img[src*='chart_organisation.png'], img[title*='Test Specification'], a[title*='Test Specification']");
  if (testSpecImg) {
    (testSpecImg.closest('a') || testSpecImg).click();
    console.log('[TestLink Auto-Navigator] Clicked Step 1: Test Specification');
  } else {
    console.warn('[TestLink Auto-Navigator] Test Specification icon not found. Looking in frames...');
  }

  // Step 2: Delay of 3 seconds, then click Actions / Cog icon
  setTimeout(function() {
    var cogImg = findInFrames("img[src*='cog.png'], img[title*='Actions'], [onclick*='tproject_control_panel']");
    if (cogImg) {
      cogImg.click();
      console.log('[TestLink Auto-Navigator] Clicked Step 2: Settings Cog (Actions)');
    } else {
      console.warn('[TestLink Auto-Navigator] Cog/Actions icon not found. Retrying in workframe...');
    }
  }, 3000);
})();`;

  useEffect(() => {
    let timer;
    if (isOpen && isSimulating) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        setStep(3); // Cog clicked
        setIsSimulating(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isOpen, isSimulating, countdown]);

  if (!isOpen) return null;

  const handleStartTransfer = () => {
    // 1. Download or copy XML
    if (combinedXml) {
      downloadXmlFile(combinedXml, xmlFileName || 'testlink_cases.xml');
    }

    // 2. Open TestLink in new window
    window.open(testLinkUrl, '_blank', 'noopener,noreferrer');

    // 3. Start auto-step sequence
    setStep(2);
    setCountdown(3);
    setIsSimulating(true);
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(autoClickerScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyXml = async () => {
    try {
      await navigator.clipboard.writeText(combinedXml);
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Transfer to TestLink
              </h3>
              <p className="text-xs text-blue-200">
                Automated redirection and TestLink navigation workflow
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">

          {/* Target URL Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Target Platform</span>
              <div className="font-mono text-xs font-bold text-blue-700 truncate max-w-md mt-0.5">
                {testLinkUrl}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartTransfer}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all shrink-0 active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch TestLink &amp; Transfer</span>
            </button>
          </div>

          {/* Automated Visual Flow: 3 Seconds Delay Between Clicks */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white shadow-2xs">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Automation Sequence (Auto-click with 3s delay)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              
              {/* Step 1: Click Test Specification */}
              <div className={`p-3.5 rounded-xl border text-center transition-all ${
                step >= 1 
                  ? 'border-blue-300 bg-blue-50/60 shadow-2xs' 
                  : 'border-slate-200 bg-slate-50 opacity-60'
              }`}>
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    <img 
                      src="https://testing.creditq.co.in/gui/themes/default/images/chart_organisation.png" 
                      alt="Test Specification" 
                      title="Test Specification"
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        // Fallback icon if network image blocked
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-800">
                  1. Test Specification
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  chart_organisation.png
                </div>
                {step >= 2 && (
                  <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Clicked
                  </div>
                )}
              </div>

              {/* Delay Indicator: 3 Seconds */}
              <div className="text-center p-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>3s Delay</span>
                </div>
                {isSimulating && (
                  <div className="text-[11px] font-mono text-amber-700 font-bold mt-1">
                    Next click in: {countdown}s
                  </div>
                )}
              </div>

              {/* Step 2: Click Actions Cog */}
              <div className={`p-3.5 rounded-xl border text-center transition-all ${
                step >= 3 
                  ? 'border-emerald-300 bg-emerald-50/60 shadow-2xs' 
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    <img 
                      src="https://testing.creditq.co.in/gui/themes/default/images/cog.png" 
                      alt="Actions" 
                      title="Actions"
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-800">
                  2. Actions Settings Cog
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  cog.png
                </div>
                {step >= 3 && (
                  <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Panel Opened
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 1-Click Browser Auto-Clicker Bookmarklet / Console Tool */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-blue-600" />
                Auto-Clicker Shortcut for TestLink
              </span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                {copiedScript ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedScript ? 'Copied Script!' : 'Copy Script'}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Due to browser cross-domain security (Same-Origin Policy), clicking within an external website requires either opening it or running this 1-click script in the TestLink tab:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Drag to bookmarks bar */}
              <a
                href={autoClickerScript}
                onClick={(e) => e.preventDefault()}
                title="Drag to your Bookmarks Bar"
                className="cursor-grab active:cursor-grabbing inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 shadow-2xs"
              >
                <Code className="w-3.5 h-3.5" />
                ★ Drag to Bookmarks: TestLink Auto-Clicker
              </a>

              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
              >
                Copy Console Code
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            XML File: <strong className="text-slate-700">{xmlFileName}</strong> is ready for import
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyXml}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copiedXml ? 'XML Copied!' : 'Copy XML'}
            </button>

            <button
              type="button"
              onClick={handleStartTransfer}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch &amp; Transfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

