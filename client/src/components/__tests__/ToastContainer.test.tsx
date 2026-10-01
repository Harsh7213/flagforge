import { describe, it, expect, vi } from 'vitest';
import { screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import ToastContainer from '../ToastContainer';
import { addToast } from '../../store/slices/uiSlice';

describe('ToastContainer', () => {
  // ─── Empty state ────────────────────────────────────────────────────────────
  it('should render nothing when there are no toasts', () => {
    const { container } = renderWithProviders(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────
  it('should render a success toast with the correct message', () => {
    const { store } = renderWithProviders(<ToastContainer />);
    act(() => {
      store.dispatch(addToast({ type: 'success', message: 'Flag updated!' }));
    });
    expect(screen.getByText('Flag updated!')).toBeInTheDocument();
  });

  it('should render an error toast with the correct message', () => {
    const { store } = renderWithProviders(<ToastContainer />);
    act(() => {
      store.dispatch(addToast({ type: 'error', message: 'Something went wrong' }));
    });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render an info toast with the correct message', () => {
    const { store } = renderWithProviders(<ToastContainer />);
    act(() => {
      store.dispatch(addToast({ type: 'info', message: 'Just an FYI' }));
    });
    expect(screen.getByText('Just an FYI')).toBeInTheDocument();
  });

  it('should render multiple toasts at the same time', () => {
    const { store } = renderWithProviders(<ToastContainer />);
    act(() => {
      store.dispatch(addToast({ type: 'success', message: 'First' }));
      store.dispatch(addToast({ type: 'error', message: 'Second' }));
    });
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  // ─── Manual dismiss ─────────────────────────────────────────────────────────
  it('should dismiss a toast when the close button is clicked', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ToastContainer />);
    act(() => {
      store.dispatch(addToast({ type: 'success', message: 'Close me!' }));
    });

    const closeBtn = screen.getByLabelText('Close notification');
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Close me!')).not.toBeInTheDocument();
    });
  });

  // ─── Auto-dismiss ───────────────────────────────────────────────────────────
  it('should auto-dismiss the toast after 3 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { store } = renderWithProviders(<ToastContainer />);
    act(() => {
      store.dispatch(addToast({ type: 'info', message: 'Auto dismiss me' }));
    });

    expect(screen.getByText('Auto dismiss me')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(screen.queryByText('Auto dismiss me')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
