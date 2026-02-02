import { X, Shield, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LegalModal({ isOpen, onClose, type = 'privacy' }) {
    if (!isOpen) return null;

    const content = {
        privacy: {
            title: "Privacy Policy",
            icon: <Shield className="w-6 h-6 text-emerald-400" />,
            text: (
                <div className="space-y-4 text-slate-300">
                    <p><strong>1. Data Collection</strong><br />As this is an academic project, we do not collect any real personal data. Any data entered is for demonstration purposes only.</p>
                    <p><strong>2. Usage</strong><br />The platform simulates cloud storage behaviors. No files are actually permanently stored on a cloud infrastructure beyond the scope of this demo.</p>
                    <p><strong>3. Security</strong><br />While we implement zero-knowledge encryption principles, please do not upload sensitive real-world documents.</p>
                </div>
            )
        },
        terms: {
            title: "Terms of Service",
            icon: <FileText className="w-6 h-6 text-indigo-400" />,
            text: (
                <div className="space-y-4 text-slate-300">
                    <p><strong>1. Acceptance</strong><br />By using FirestoreX, you acknowledge this is a Capstone project prototype.</p>
                    <p><strong>2. Limitations</strong><br />Service availability is not guaranteed. Features may be reset at any time.</p>
                    <p><strong>3. Academic Integrity</strong><br />This project represents original work submitted for academic credit.</p>
                </div>
            )
        }
    };

    const { title, icon, text } = content[type];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-[#151621] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            {icon}
                        </div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>

                    <div className="prose prose-invert prose-sm max-w-none">
                        {text}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
