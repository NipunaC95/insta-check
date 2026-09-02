import React from 'react';
import { X, Download, ExternalLink, ShieldCheck, FileCheck } from 'lucide-react';

interface HowToGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToGuideModal: React.FC<HowToGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '01',
      title: 'Open Meta Accounts Center',
      desc: 'In the Instagram app or browser, navigate to Settings > Accounts Center > Your information and permissions.',
      link: 'https://accountscenter.instagram.com/info_and_permissions/',
    },
    {
      num: '02',
      title: 'Request Download',
      desc: 'Select "Download your information", then click "Request a download". Pick your Instagram account.',
    },
    {
      num: '03',
      title: 'Select Followers and Following',
      desc: 'Choose "Select types of information" and check ONLY "Followers and following" for an instant, lightweight export.',
    },
    {
      num: '04',
      title: 'Choose JSON or HTML Format',
      desc: 'Set Date range to "All time", and select either JSON (.json) or HTML (.html) format. Both formats are fully supported! Submit request.',
    },
    {
      num: '05',
      title: 'Upload to Follower Insights',
      desc: 'Once Meta notifies you the download is ready, save the ZIP archive. You can drag and drop the whole ZIP directly here, or extract followers_1 (json/html) and following (json/html).',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#0c0c0e] rounded-xl max-w-xl w-full shadow-2xl border border-zinc-800 overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                How to Export Your Instagram Data
              </h2>
              <p className="text-xs text-zinc-400">
                Official, 100% account-safe method directly from Instagram / Meta
              </p>
            </div>
          </div>
          <button
            id="close-guide-modal"
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80"
            >
              <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono font-medium flex items-center justify-center shrink-0 mt-0.5">
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-zinc-100">{step.title}</h3>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 hover:underline shrink-0"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-zinc-200">Private & Secure:</span> Your data is
              parsed locally on your container and is never shared, sent to third parties, or logged into external services.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-950/40 flex justify-end">
          <button
            id="close-guide-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-black bg-white hover:bg-zinc-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
