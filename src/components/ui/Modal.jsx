import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ 
  isOpen = false,
  onClose,
  children,
  title,
  ...props 
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        {...props}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && <h2 className="modal-title">{title}</h2>}
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}