import { describe, expect, it, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { renderWithProviders } from "@/test/testUtils";
import { useAuthStore } from "@/stores/authStore";

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<p>Login page</p>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Route>
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, redirectPath: null });
  });

  it("redirects an unauthenticated customer to the login page", () => {
    renderWithProviders(<TestApp />, ["/dashboard"]);
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard page")).not.toBeInTheDocument();
  });

  it("renders the protected page for an authenticated customer", () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderWithProviders(<TestApp />, ["/dashboard"]);
    expect(screen.getByText("Dashboard page")).toBeInTheDocument();
  });
});
