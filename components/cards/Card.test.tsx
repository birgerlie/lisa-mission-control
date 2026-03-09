import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardTitle } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders as a div element', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toBeInTheDocument();
  });

  it('applies hover effect when hover prop is true', () => {
    const { container } = render(<Card hover>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('hover');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content area</CardContent>);
    expect(screen.getByText('Content area')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders children as h3', () => {
    render(<CardTitle>Card Title</CardTitle>);
    const title = screen.getByText('Card Title');
    expect(title.tagName.toLowerCase()).toBe('h3');
  });

  it('applies title styling', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title).toHaveClass('text-lg', 'font-semibold');
  });
});
