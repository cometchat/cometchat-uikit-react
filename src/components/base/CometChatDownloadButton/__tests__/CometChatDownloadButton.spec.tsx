import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CometChatDownloadButton } from '../CometChatDownloadButton';

vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

vi.mock('../../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

vi.mock('../../../../utils/downloadWithProgress', () => ({
  downloadWithProgress: vi.fn(() => Promise.resolve()),
}));

describe('CometChatDownloadButton', () => {
  it('renders a download button in idle state', () => {
    render(<CometChatDownloadButton url="https://example.com/file.pdf" fileName="file.pdf" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('download button has aria-label with file name', () => {
    render(<CometChatDownloadButton url="https://example.com/doc.pdf" fileName="doc.pdf" />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatDownloadButton
        url="https://example.com/f.pdf"
        fileName="f.pdf"
        className="custom"
      />
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('always has base class', () => {
    const { container } = render(
      <CometChatDownloadButton url="https://example.com/f.pdf" fileName="f.pdf" />
    );
    expect(container.firstChild).toHaveClass('cometchat-download-button');
  });

  it('triggers download on button click', async () => {
    const { downloadWithProgress } = await import('../../../../utils/downloadWithProgress');
    render(<CometChatDownloadButton url="https://example.com/f.pdf" fileName="f.pdf" />);
    fireEvent.click(screen.getByRole('button'));
    expect(downloadWithProgress).toHaveBeenCalled();
  });
});
