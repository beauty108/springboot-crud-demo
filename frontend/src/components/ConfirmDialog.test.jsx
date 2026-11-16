import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

function renderDialog(props = {}) {
    const onConfirm = props.onConfirm ?? vi.fn().mockResolvedValue(undefined);
    const onCancel = props.onCancel ?? vi.fn();
    const { container } = render(
        <ConfirmDialog
            title="Delete product?"
            message='Are you sure you want to delete "Laptop"?'
            confirmLabel="Delete"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
    return { onConfirm, onCancel, container, user: userEvent.setup() };
}

describe('ConfirmDialog', () => {
    it('shows the title and message', () => {
        renderDialog();

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete product?')).toBeInTheDocument();
        expect(screen.getByText(/delete "Laptop"/)).toBeInTheDocument();
    });

    it('focuses Cancel first so Enter does not delete by accident', () => {
        renderDialog();

        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });

    it('calls onConfirm when the confirm button is clicked', async () => {
        const { onConfirm, onCancel, user } = renderDialog();

        await user.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onConfirm).toHaveBeenCalled();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel on Cancel, Escape and a click on the backdrop', async () => {
        const { onCancel, onConfirm, container, user } = renderDialog();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        await user.keyboard('{Escape}');
        await user.click(container.querySelector('.dialog-backdrop'));

        expect(onCancel).toHaveBeenCalledTimes(3);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('does not close when clicking inside the dialog box', async () => {
        const { onCancel, user } = renderDialog();

        await user.click(screen.getByRole('dialog'));

        expect(onCancel).not.toHaveBeenCalled();
    });

    it('shows the error and stays open when onConfirm fails', async () => {
        const onConfirm = vi.fn().mockRejectedValue(new Error('Something went wrong'));
        const { user } = renderDialog({ onConfirm });

        await user.click(screen.getByRole('button', { name: 'Delete' }));

        expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    });
});
