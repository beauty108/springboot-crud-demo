// All calls to the Spring Boot backend live in this file.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
    constructor(message, { status, fieldErrors = {} } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

async function toApiError(response) {
    let message = `Request failed (status ${response.status})`;
    let fieldErrors = {};
    try {
        const body = await response.json();
        if (body.errors) {
            fieldErrors = body.errors;
            message = 'Please fix the errors below.';
        } else if (body.message) {
            message = body.message;
        }
    } catch {

    }
    return new ApiError(message, { status: response.status, fieldErrors });
}


export async function fetchProducts({ page, size, sortBy, direction }) {
    const params = new URLSearchParams({ page, size, sortBy, direction });
    const response = await fetch(`${API_URL}/api/products?${params}`);
    if (!response.ok) throw await toApiError(response);

    const products = await response.json();
    return {
        products,
        totalCount: Number(response.headers.get('X-Total-Count') ?? products.length),
        totalPages: Number(response.headers.get('X-Total-Pages') ?? 1),
    };
}


export async function createProduct(product) {
    const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    if (!response.ok) throw await toApiError(response);
    return response.json();
}


export async function updateProduct(id, product) {
    const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    });
    if (!response.ok) throw await toApiError(response);
    return response.json();
}
