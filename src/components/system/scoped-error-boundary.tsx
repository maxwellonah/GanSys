"use client";

import { Component, type ReactNode } from "react";

import { ErrorState } from "@/components/system/error-state";

type Props = {
  title: string;
  message: string;
  badge?: string;
  tone?: "danger" | "warning" | "neutral";
  hint?: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ScopedErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          fillViewport={false}
          badge={this.props.badge ?? "Section unavailable"}
          tone={this.props.tone ?? "warning"}
          title={this.props.title}
          message={this.props.message}
          detail={this.state.error?.message}
          hint={this.props.hint}
          onRetry={this.reset}
          retryLabel="Reload section"
        />
      );
    }

    return this.props.children;
  }
}
