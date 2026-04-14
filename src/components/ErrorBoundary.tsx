import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-12 text-center space-y-8 border border-slate-100">
            <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-100">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Уучлаарай, алдаа гарлаа</h1>
              <p className="text-slate-500 font-medium leading-relaxed">
                Программд гэнэтийн алдаа гарлаа. Бид үүнийг тэмдэглэж авсан бөгөөд удахгүй засах болно.
              </p>
              {this.state.error && (
                <div className="p-4 bg-slate-50 rounded-2xl text-left overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Алдааны мэдээлэл</p>
                  <code className="text-xs text-red-400 font-mono break-all line-clamp-3">
                    {this.state.error.message}
                  </code>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-[#0052FF] text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Дахин ачаалах</span>
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                <span>Нүүр хуудас руу</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
