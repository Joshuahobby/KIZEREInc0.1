import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemRegistrationPage from '../item-registration';
import { AuthProvider } from '@/hooks/use-auth';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock dependencies
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', role: 'user' },
    isLoading: false,
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('wouter', () => ({
  useLocation: () => [vi.fn(), vi.fn()],
  useRoute: () => [false, null],
  Link: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>,
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider defaultLanguage="en">
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

describe('ItemRegistrationPage', () => {
  it('renders the registration form', async () => {
    render(<ItemRegistrationPage />, { wrapper: AllProviders });

    // Check for the heading text that appears on step 1
    // The locale key 'registration.main_details' is used
    expect(await screen.findByText(/Item Details/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    render(<ItemRegistrationPage />, { wrapper: AllProviders });

    // Wait for form to render — Review buttons should be disabled when name is empty
    const reviewButtons = await screen.findAllByText(/Review/i);

    reviewButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });
});
