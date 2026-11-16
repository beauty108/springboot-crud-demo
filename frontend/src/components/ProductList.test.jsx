import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductList from './ProductList';
import {
    ApiError,
    createProduct,
    deleteProduct,
    fetchProducts,
    updateProduct,
} from '../api/productApi';

vi.mock('../api/productApi', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        fetchProducts: vi.fn(),
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        deleteProduct: vi.fn(),
    };
});

const products = [
    { id: 1, name: 'Laptop', description: 'Fast', price: 999.99 },
    { id: 2, name: 'Mouse', description: 'Wireless', price: 19.99 },
];

// Finds the table row that contains the given product name
const rowFor = (name) => screen.getByText(name).closest('tr');

describe('ProductList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchProducts.mockResolvedValue({ products, totalCount: 2, totalPages: 1 });
    });



    it('shows loading first, then the products', async () => {
        render(<ProductList />);

        expect(screen.getByText('Loading products...')).toBeInTheDocument();
        expect(await screen.findByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('Mouse')).toBeInTheDocument();
        expect(screen.getByText('$999.99')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 1 (2 products)')).toBeInTheDocument();
    });

    it('asks the API for the first page with default sorting', async () => {
        render(<ProductList />);
        await screen.findByText('Laptop');

        expect(fetchProducts).toHaveBeenCalledWith({ page: 0, size: 10, sortBy: 'id', direction: 'asc' });
    });

    it('shows "No products found." when the list is empty', async () => {
        fetchProducts.mockResolvedValue({ products: [], totalCount: 0, totalPages: 0 });
        render(<ProductList />);

        expect(await screen.findByText('No products found.')).toBeInTheDocument();
    });

    it('shows an error with Retry when the server is down, and recovers', async () => {
        fetchProducts.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        const user = userEvent.setup();
        render(<ProductList />);

        expect(await screen.findByText(/Cannot reach the server/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Retry' }));

        expect(await screen.findByText('Laptop')).toBeInTheDocument();
    });



    it('loads the next page when Next is clicked', async () => {
        fetchProducts.mockResolvedValue({ products, totalCount: 25, totalPages: 3 });
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');

        expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Next' }));

        await waitFor(() =>
            expect(fetchProducts).toHaveBeenLastCalledWith({ page: 1, size: 10, sortBy: 'id', direction: 'asc' })
        );
    });

    it('changing the sort goes back to the first page', async () => {
        fetchProducts.mockResolvedValue({ products, totalCount: 25, totalPages: 3 });
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');

        await user.click(screen.getByRole('button', { name: 'Next' }));
        await screen.findByText('Laptop');
        await user.selectOptions(screen.getByLabelText(/sort by/i), 'price');

        await waitFor(() =>
            expect(fetchProducts).toHaveBeenLastCalledWith({ page: 0, size: 10, sortBy: 'price', direction: 'asc' })
        );
    });



    it('creates a product and shows it newest-first', async () => {
        createProduct.mockResolvedValue({ id: 3, name: 'Keyboard', description: '', price: 49.5 });
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');

        await user.click(screen.getByRole('button', { name: '+ Add product' }));
        await user.type(screen.getByLabelText('Name'), 'Keyboard');
        await user.type(screen.getByLabelText('Price'), '49.5');
        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(createProduct).toHaveBeenCalledWith({ name: 'Keyboard', description: '', price: 49.5 });
        expect(await screen.findByText('Product created.')).toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Add product' })).not.toBeInTheDocument();
        await waitFor(() =>
            expect(fetchProducts).toHaveBeenLastCalledWith({ page: 0, size: 10, sortBy: 'id', direction: 'desc' })
        );
    });



    it('edits a product using the pre-filled form', async () => {
        updateProduct.mockResolvedValue({ id: 1, name: 'Gaming Laptop', description: 'Fast', price: 999.99 });
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');

        await user.click(within(rowFor('Laptop')).getByRole('button', { name: 'Edit' }));

        expect(screen.getByRole('heading', { name: 'Edit product 1' })).toBeInTheDocument();
        const nameInput = screen.getByLabelText('Name');
        expect(nameInput).toHaveValue('Laptop');

        await user.clear(nameInput);
        await user.type(nameInput, 'Gaming Laptop');
        await user.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(updateProduct).toHaveBeenCalledWith(1, { name: 'Gaming Laptop', description: 'Fast', price: 999.99 });
        expect(await screen.findByText('Product 1 updated.')).toBeInTheDocument();
    });



    it('asks for confirmation and does nothing on Cancel', async () => {
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');

        await user.click(within(rowFor('Laptop')).getByRole('button', { name: 'Delete' }));
        expect(screen.getByRole('dialog')).toHaveTextContent('"Laptop" (ID 1)');

        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(deleteProduct).not.toHaveBeenCalled();
    });

    it('deletes after confirmation and refreshes the list', async () => {
        deleteProduct.mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');
        const callsBefore = fetchProducts.mock.calls.length;

        await user.click(within(rowFor('Laptop')).getByRole('button', { name: 'Delete' }));
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

        expect(deleteProduct).toHaveBeenCalledWith(1);
        expect(await screen.findByText('Product 1 deleted.')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(fetchProducts.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it('treats "already deleted" (404) as done, not as an error', async () => {
        deleteProduct.mockRejectedValue(new ApiError('Product not found with id 1', { status: 404 }));
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');

        await user.click(within(rowFor('Laptop')).getByRole('button', { name: 'Delete' }));
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

        expect(await screen.findByText('Product 1 was already deleted.')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('keeps the dialog open with a message when the server is down', async () => {
        deleteProduct.mockRejectedValue(new TypeError('Failed to fetch'));
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');

        await user.click(within(rowFor('Laptop')).getByRole('button', { name: 'Delete' }));
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

        expect(await within(screen.getByRole('dialog')).findByText(/Cannot reach the server/)).toBeInTheDocument();
    });

    it('goes back a page after deleting the only item on the last page', async () => {

        fetchProducts.mockImplementation(({ page }) =>
            Promise.resolve(
                page === 0
                    ? { products, totalCount: 3, totalPages: 2 }
                    : { products: [{ id: 3, name: 'Keyboard', description: '', price: 49.5 }], totalCount: 3, totalPages: 2 }
            )
        );
        deleteProduct.mockResolvedValue(undefined);
        const user = userEvent.setup();
        render(<ProductList />);
        await screen.findByText('Laptop');

        await user.click(screen.getByRole('button', { name: 'Next' }));
        await screen.findByText('Keyboard');
        await user.click(within(rowFor('Keyboard')).getByRole('button', { name: 'Delete' }));
        await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

        await waitFor(() =>
            expect(fetchProducts).toHaveBeenLastCalledWith({ page: 0, size: 10, sortBy: 'id', direction: 'asc' })
        );
    });
});
