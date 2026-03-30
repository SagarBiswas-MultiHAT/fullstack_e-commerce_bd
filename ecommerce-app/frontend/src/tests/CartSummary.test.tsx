import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartSummary } from '@/components/CartSummary';
import { apiPost } from '@/lib/api';
import type { CartItem } from '@/context/cart.context';

jest.mock('@/lib/api', () => ({
  apiPost: jest.fn(),
}));

const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

const cartItems: CartItem[] = [
  {
    productId: 'p1',
    slug: 'wireless-earbuds',
    title: 'Wireless Earbuds',
    image: '/images/earbuds.jpg',
    price: 1000,
    discountPrice: 800,
    quantity: 2,
    stock: 10,
  },
];

describe('CartSummary', () => {
  beforeEach(() => {
    apiPostMock.mockReset();
  });

  it('calculates subtotal correctly from items', () => {
    render(<CartSummary items={cartItems} />);

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText(/2,000/)).toBeInTheDocument();

    const total = screen.getByTestId('cart-summary-total');
    expect(total).toHaveTextContent(/BDT\s*1,720/);
  });

  it('applies valid coupon and shows discounted total', async () => {
    apiPostMock.mockResolvedValue({
      valid: true,
      code: 'SAVE200',
      type: 'fixed',
      value: 200,
      discountAmount: 200,
      expiresAt: null,
      usage: {
        usedCount: 0,
        usageLimit: null,
      },
    });

    const user = userEvent.setup();
    render(<CartSummary items={cartItems} />);

    await user.type(screen.getByLabelText(/coupon code/i), 'SAVE200');
    await user.click(screen.getByRole('button', { name: /validate/i }));

    await waitFor(() => {
      expect(screen.getByText(/Coupon applied:/i)).toBeInTheDocument();
    });

    const total = screen.getByTestId('cart-summary-total');
    expect(total).toHaveTextContent(/BDT\s*1,520/);
  });

  it('shows error message for invalid coupon', async () => {
    apiPostMock.mockRejectedValue(new Error('Coupon is invalid'));

    const user = userEvent.setup();
    render(<CartSummary items={cartItems} />);

    await user.type(screen.getByLabelText(/coupon code/i), 'BADCODE');
    await user.click(screen.getByRole('button', { name: /validate/i }));

    await waitFor(() => {
      expect(screen.getByText('Coupon is invalid')).toBeInTheDocument();
    });
  });
});
