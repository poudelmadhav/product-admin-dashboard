import LoginForm from "./LoginForm";

export default function AuthGate({ authLoading, user, title, children }) {
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-slate-500">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginForm title={title} />;

  return children;
}
