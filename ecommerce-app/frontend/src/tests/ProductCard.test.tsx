import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/types';

const addItemMock = jest.fn();

jest.mock('@/context/cart.context', () => ({
  useCart: () => ({
    addItem: addItemMock,
  }),
}));

const baseProduct: Product = {
  id: 'product-1',
  title: 'Noise Cancelling Headphones',
  slug: 'noise-cancelling-headphones',
  description: 'Premium over-ear headphones',
  price: '12000',
  discountPrice: null,
  stock: 12,
  images: ['/images/test-product.jpg'],
  isActive: true,
  categoryId: 'category-1',
  category: {
    id: 'category-1',
    name: 'Audio',
    slug: 'audio',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  reviews: [],
};

describe('ProductCard', () => {
  beforeEach(() => {
    addItemMock.mockReset();
  });

  it('renders product title, price, and image', () => {
    render(<ProductCard product={baseProduct} />);

    expect(screen.getByText('Noise Cancelling Headphones')).toBeInTheDocument();
    expect(screen.getByText(/12,000/)).toBeInTheDocument();
    expect(screen.getByAltText('Noise Cancelling Headphones')).toBeInTheDocument();
  });

  it('shows discount badge when discountPrice is set', () => {
    render(
      <ProductCard
        product={{
          ...baseProduct,
          discountPrice: '9000',
        }}
      />,
    );

    expect(screen.getByText(/% OFF/i)).toBeInTheDocument();
  });

  it('wishlist heart button toggles on click', async () => {
    const user = userEvent.setup();
    render(<ProductCard product={baseProduct} />);

    const wishlistButton = screen.getByRole('button', {
      name: /toggle wishlist/i,
    });

    expect(wishlistButton.className).not.toContain('bg-danger');

    await user.click(wishlistButton);
    expect(wishlistButton.className).toContain('bg-danger');

    await user.click(wishlistButton);
    expect(wishlistButton.className).not.toContain('bg-danger');
  });
});
