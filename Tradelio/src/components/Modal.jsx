import { X } from 'lucide-react';

function Modal({ isOpen, onClose, children, maxWidth = "max-w-md" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`bg-zinc-900 border border-zinc-800 p-6 rounded-lg w-full ${maxWidth} max-h-[90vh] overflow-y-auto overflow-x-hidden relative`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl transition"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;