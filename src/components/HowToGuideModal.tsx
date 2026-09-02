import React from 'react';
import { X, CheckCircle2, Download, ExternalLink, ShieldCheck } from 'lucide-react';

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
      desc: 'In the Instagram app or website, navigate to Settings > Accounts Center > Your information and permissions.',
      link: 'https://accountscenter.instagram.com/info_and_permissions/',
    },
    {
      num: '02',
      title: 'Request Data Download',
      desc: 'Select "Download your information", then click "Request a download". Pick your Instagram profile.',
    },
    {
      num: '03',
      title: 'Select Followers & Following',
      desc: 'Choose "Select types of information" and select ONLY "Followers and following" for a quick, lightweight export.',
    },
    {
      num: '04',
      title: 'Choose JSON Format (Crucial!)',
      desc: 'Set Date range to "All time", and set Format to "JSON" (do NOT select HTML). Submit request.',
    },
    {
      num: '05',
      title: 'Upload to Follower Insights',
      desc: 'Once Meta emails you the download link, download the ZIP archive. You can drag and drop the ZIP directly here, or extract followers_1.json and following.json.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                How to Get Your Instagram Export
              </h2>
              <p className="text-xs text-slate-500">
                Official, 100% safe method directly from Instagram
              </p>
            </div>
          </div>
          <button
            id="close-guide-modal"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Privacy First:</span> You never enter your Instagram
              password or API credentials. All data is processed using official Meta data exports.
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center justify-between">
                    <span>{step.title}</span>
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:text-rose-700 text-xs font-medium inline-flex items-center gap-1"
                      >
                        Accounts Center <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            id="got-it-guide-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
