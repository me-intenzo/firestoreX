import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContextMenu({
    x,
    y,
    onClose,
    actions = []
}) {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [onClose]);

    // Adjust position to keep menu within viewport
    const style = {
        top: y,
        left: x,
    };

    // Simple adjustment logic (can be improved)
    if (typeof window !== 'undefined') {
        if (x + 200 > window.innerWidth) style.left = x - 200;
        if (y + 200 > window.innerHeight) style.top = y - 200;
    }

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="fixed z-50 min-w-[180px] bg-[#151621] border border-[#25263a] rounded-xl shadow-2xl py-1.5 overflow-hidden"
                style={style}
                onContextMenu={(e) => e.preventDefault()}
            >
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            action.onClick();
                            onClose();
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[#25263a] transition-colors
              ${action.variant === 'danger' ? 'text-red-400 hover:text-red-300' : 'text-slate-300 hover:text-white'}
            `}
                    >
                        {action.icon && <span className="opacity-70">{action.icon}</span>}
                        {action.label}
                    </button>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}
