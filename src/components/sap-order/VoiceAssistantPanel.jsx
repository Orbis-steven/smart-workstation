import { Mic, MicOff } from 'lucide-react';

export function VoiceAssistantPanel({
  theme,
  title,
  visionMode,
  voicePrompt,
  assistantTone,
  assistantStatus,
  assistantTranscript,
  isListening,
  onVisionModeChange,
  onVoicePromptChange,
  onVoiceButtonClick,
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h2>
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-gray-700 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-600 transition-colors">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={visionMode} onChange={(event) => onVisionModeChange(event.target.checked)} />
                <div className={`block w-14 h-8 rounded-full transition-colors ${visionMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${visionMode ? 'transform translate-x-6' : ''}`}></div>
              </div>
              <span className={`text-base font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>图像识别模式</span>
            </label>

            {visionMode && (
              <label className="flex items-center gap-3 cursor-pointer animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={voicePrompt} onChange={(event) => onVoicePromptChange(event.target.checked)} />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${voicePrompt ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${voicePrompt ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <span className={`text-base font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>语音提示</span>
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onVoiceButtonClick}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all shadow-sm ${
              isListening
                ? 'bg-red-500 border-red-500 text-white animate-pulse'
                : theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title={isListening ? '停止语音助手' : '启动语音助手'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className={`mt-3 rounded-xl border px-4 py-3 flex flex-col gap-1 transition-colors ${
        assistantTone === 'error'
          ? (theme === 'dark' ? 'bg-red-950/30 border-red-900 text-red-200' : 'bg-red-50 border-red-200 text-red-700')
          : assistantTone === 'warning'
            ? (theme === 'dark' ? 'bg-amber-950/20 border-amber-900 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800')
            : assistantTone === 'success'
              ? (theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
              : assistantTone === 'listening'
                ? (theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                : (theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-600')
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : assistantTone === 'success' ? 'bg-emerald-500' : assistantTone === 'warning' ? 'bg-amber-500' : assistantTone === 'error' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
          <span className="text-sm font-bold">语音小助手</span>
        </div>
        <div className="text-sm leading-6">{assistantStatus}</div>
        {assistantTranscript && (
          <div className={`text-xs font-mono break-all ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
            识别内容：{assistantTranscript}
          </div>
        )}
      </div>
    </>
  );
}
