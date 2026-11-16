import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductForm from './ProductForm';
import { ApiError } from '../api/productApi';

function renderForm(props = {}) {
    const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
    const onCancel = props.onCancel ?? vi.fn();
    render(
        <ProductForm
            title="Add product"
            initialValues={{}}
            submitLabel="Create"
            {...props}
            onSubmit={onSubmit}
            onCancel={onCancel}
        />
    );
    return { onSubmit, onCancel, user: userEvent.setup() };
}

describe('ProductForm', () => {
    it('shows errors and does not submit when required fields are empty', async () => {
        const { onSubmit, user } = renderForm();

        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(screen.getByText('Name must not be blank')).toBeInTheDocument();
        expect(screen.getByText('Price is required')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('rejects a negative price', async () => {
        const { onSubmit, user } = renderForm();

        await user.type(screen.getByLabelText('Name'), 'Laptop');
        await user.type(screen.getByLabelText('Price'), '-5');
        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(screen.getByText('Price must not be negative')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits trimmed values with the price as a number', async () => {
        const { onSubmit, user } = renderForm();

        await user.type(screen.getByLabelText('Name'), '  Laptop  ');
        await user.type(screen.getByLabelText('Description'), 'Fast');
        await user.type(screen.getByLabelText('Price'), '999.99');
        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(onSubmit).toHaveBeenCalledWith({ name: 'Laptop', description: 'Fast', price: 999.99 });
    });

    it('clears a field error when the user types in that field', async () => {
        const { user } = renderForm();

        await user.click(screen.getByRole('button', { name: 'Create' }));
        expect(screen.getByText('Name must not be blank')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Name'), 'L');
        expect(screen.queryByText('Name must not be blank')).not.toBeInTheDocument();
    });

    it('shows backend validation messages under the matching field', async () => {
        const onSubmit = vi.fn().mockRejectedValue(
            new ApiError('Please fix the errors below.', { status: 400, fieldErrors: { name: 'Name is taken' } })
        );
        const { user } = renderForm({ onSubmit });

        await user.type(screen.getByLabelText('Name'), 'Laptop');
        await user.type(screen.getByLabelText('Price'), '10');
        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(await screen.findByText('Name is taken')).toBeInTheDocument();
        expect(screen.getByText('Please fix the errors below.')).toBeInTheDocument();
    });

    it('shows a server-unreachable message on network failure', async () => {
        const onSubmit = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        const { user } = renderForm({ onSubmit });

        await user.type(screen.getByLabelText('Name'), 'Laptop');
        await user.type(screen.getByLabelText('Price'), '10');
        await user.click(screen.getByRole('button', { name: 'Create' }));

        expect(await screen.findByText(/Cannot reach the server/)).toBeInTheDocument();
    });

    it('is pre-filled in edit mode', () => {
        renderForm({
            title: 'Edit product 1',
            submitLabel: 'Save changes',
            initialValues: { name: 'Laptop', description: 'Fast', price: 999.99 },
        });

        expect(screen.getByLabelText('Name')).toHaveValue('Laptop');
        expect(screen.getByLabelText('Description')).toHaveValue('Fast');
        expect(screen.getByLabelText('Price')).toHaveValue(999.99);
    });

    it('calls onCancel when Cancel is clicked', async () => {
        const { onCancel, onSubmit, user } = renderForm();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onCancel).toHaveBeenCalled();
        expect(onSubmit).not.toHaveBeenCalled();
    });
});
