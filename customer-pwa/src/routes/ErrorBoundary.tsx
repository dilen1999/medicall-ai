import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("Unhandled application error", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center dark:bg-slate-950">
          <AlertTriangle className="h-12 w-12 text-danger" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-ink dark:text-slate-100">Something went wrong</h1>
          <p className="max-w-sm text-sm text-ink-muted">
            An unexpected error occurred. Please try reloading the page. If this keeps happening, contact support.
          </p>
          <AppButton onClick={this.handleReload}>Reload MediCall Care</AppButton>
        </div>
      );
    }

    return this.props.children;
  }
}
