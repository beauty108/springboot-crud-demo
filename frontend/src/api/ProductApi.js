const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export async function fetchProducts({ page, size, sortBy, direction }) {
    const params = new URLSearchParams({ page, size, sortBy, direction });
    const response = await fetch(`${API_URL}/api/products?${params}`);

    if (!response.ok) {

        let message = `Request failed (status ${response.status})`;
        try {
            const body = await response.json();
            if (body.message) message = body.message;
        } catch {

        }
        throw new Error(message);
    }

    const products = await response.json();
    return {
        products,
        totalCount: Number(response.headers.get('X-Total-Count') ?? products.length),
        totalPages: Number(response.headers.get('X-Total-Pages') ?? 1),
    };
}
