export function ControlBtn({ icon, label, onClick, disabled, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
        disabled
          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
          : active
            ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg'
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
