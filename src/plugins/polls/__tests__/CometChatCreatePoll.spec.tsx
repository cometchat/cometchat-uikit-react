import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatCreatePoll } from '../CometChatCreatePoll';

describe('CometChatCreatePoll', () => {
  it('renders the dialog with title', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Poll')).toBeInTheDocument();
  });

  it('renders question input and 2 default option inputs', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    expect(screen.getByPlaceholderText('Ask a question')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Answer').length).toBe(2);
  });

  it('create button is disabled initially', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    expect(screen.getByText('Create')).toBeDisabled();
  });

  it('create button enables when question and 2 options filled', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Ask a question'), { target: { value: 'Q?' } });
    const opts = screen.getAllByPlaceholderText('Answer');
    fireEvent.change(opts[0], { target: { value: 'A' } });
    fireEvent.change(opts[1], { target: { value: 'B' } });
    expect(screen.getByText('Create')).toBeEnabled();
  });

  it('can add an option', () => {
    render(<CometChatCreatePoll onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Add another answer/));
    expect(screen.getAllByPlaceholderText('Answer').length).toBe(3);
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<CometChatCreatePoll onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders custom title', () => {
    render(<CometChatCreatePoll title="My Survey" onClose={() => {}} />);
    expect(screen.getByText('My Survey')).toBeInTheDocument();
  });

  it('respects defaultAnswers prop', () => {
    render(<CometChatCreatePoll defaultAnswers={4} onClose={() => {}} />);
    expect(screen.getAllByPlaceholderText('Answer').length).toBe(4);
  });
});
