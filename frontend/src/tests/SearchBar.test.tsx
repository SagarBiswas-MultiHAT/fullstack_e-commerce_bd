import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/SearchBar';
import { apiGet } from '@/lib/api';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/lib/api', () => ({
  apiGet: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;

const searchPayload = {
  items: [
    {
      id: 'product-1',
      title: 'Pixel 9 Pro',
      slug: 'pixel-9-pro',
      description: 'Test phone',
      price: '130000',
      discountPrice: null,
      stock: 8,
      images: ['/images/pixel.jpg'],
      isActive: true,
      categoryId: 'cat-1',
      category: {
        id: 'cat-1',
        name: 'Phones',
        slug: 'phones',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 4.8,
    },
  ],
  pagination: {
    page: 1,
    limit: 5,
    total: 1,
    totalPages: 1,
  },
  query: 'pixel',
};

describe('SearchBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    pushMock.mockReset();
    apiGetMock.mockReset();
    apiGetMock.mockResolvedValue(searchPayload);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders input', () => {
    render(<SearchBar />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('shows dropdown results after typing with 200ms debounce', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchBar />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pixel');

    await act(async () => {
      jest.advanceTimersByTime(220);
    });

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith('/store/search', {
        q: 'pixel',
        page: 1,
        limit: 5,
      });
    });

    expect(screen.getByText('Pixel 9 Pro')).toBeInTheDocument();
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchBar />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pixel');

    await act(async () => {
      jest.advanceTimersByTime(220);
    });

    await screen.findByText('Pixel 9 Pro');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByText('Pixel 9 Pro')).not.toBeInTheDocument();
  });

  it('navigates to product page when Enter is pressed on active result', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchBar />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pixel');

    await act(async () => {
      jest.advanceTimersByTime(220);
    });

    await screen.findByText('Pixel 9 Pro');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(pushMock).toHaveBeenCalledWith('/products/pixel-9-pro');
  });
});
