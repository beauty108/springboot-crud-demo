import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createProduct, deleteProduct, fetchProducts, updateProduct } from './productApi';

function jsonResponse(body, status = 200, headers = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    });
}

describe('productApi', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetchProducts sends paging params and reads totals from headers', async () => {
        fetch.mockResolvedValue(
            jsonResponse([{ id: 1, name: 'Laptop' }], 200, { 'X-Total-Count': '25', 'X-Total-Pages': '3' })
        );

        const result = await fetchProducts({ page: 1, size: 10, sortBy: 'price', direction: 'desc' });

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/products?page=1&size=10&sortBy=price&direction=desc'
        );
        expect(result.products).toEqual([{ id: 1, name: 'Laptop' }]);
        expect(result.totalCount).toBe(25);
        expect(result.totalPages).toBe(3);
    });

    it('fetchProducts throws ApiError with the backend message on 400', async () => {
        fetch.mockResolvedValue(jsonResponse({ status: 400, message: 'sortBy must be one of: id, name, price' }, 400));

        await expect(
            fetchProducts({ page: 0, size: 10, sortBy: 'password', direction: 'asc' })
        ).rejects.toMatchObject({
            name: 'ApiError',
            status: 400,
            message: 'sortBy must be one of: id, name, price',
        });
    });

    it('createProduct POSTs JSON and returns the saved product', async () => {
        fetch.mockResolvedValue(jsonResponse({ id: 7, name: 'Mouse', description: '', price: 19.99 }, 201));

        const saved = await createProduct({ name: 'Mouse', description: '', price: 19.99 });

        expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Mouse', description: '', price: 19.99 }),
        });
        expect(saved.id).toBe(7);
    });

    it('createProduct turns validation errors into fieldErrors', async () => {
        fetch.mockResolvedValue(
            jsonResponse({ status: 400, error: 'Validation failed', errors: { name: 'Name must not be blank' } }, 400)
        );

        const error = await createProduct({ name: '', price: 1 }).catch((e) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(400);
        expect(error.fieldErrors).toEqual({ name: 'Name must not be blank' });
        expect(error.message).toBe('Please fix the errors below.');
    });

    it('updateProduct PUTs to the product URL', async () => {
        fetch.mockResolvedValue(jsonResponse({ id: 3, name: 'New', price: 5 }));

        await updateProduct(3, { name: 'New', description: '', price: 5 });

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/products/3',
            expect.objectContaining({ method: 'PUT' })
        );
    });

    it('deleteProduct succeeds on 204 and throws ApiError on 404', async () => {
        fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
        await expect(deleteProduct(1)).resolves.toBeUndefined();

        fetch.mockResolvedValueOnce(jsonResponse({ status: 404, message: 'Product not found with id 99' }, 404));
        await expect(deleteProduct(99)).rejects.toMatchObject({ status: 404, message: 'Product not found with id 99' });
    });

    it('uses a default message when the error body is not JSON', async () => {
        fetch.mockResolvedValue(new Response('Internal error', { status: 500 }));

        await expect(deleteProduct(1)).rejects.toMatchObject({ status: 500, message: 'Request failed (status 500)' });
    });
});
