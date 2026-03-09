import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('renders mission control header', () => {
    render(<Sidebar />);
    expect(screen.getByText('Mission Control')).toBeInTheDocument();
    expect(screen.getByText('Lisa AI Assistant')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar />);
    
    const navItems = ['Dashboard', 'Tasks', 'Calendar', 'Agents', 'Memory', 'Documents', 'Team'];
    navItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('renders user footer with Lisa', () => {
    render(<Sidebar />);
    expect(screen.getByText('Lisa')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('marks current page as active', () => {
    mockUsePathname.mockReturnValue('/tasks');
    render(<Sidebar />);
    
    const tasksLink = screen.getByText('Tasks').closest('a');
    expect(tasksLink).toHaveClass('bg-[#5e6ad2]', 'text-white');
  });
});
