import { useEffect, useState } from 'react';
import {
    ApiError,
    createProduct,
    deleteProduct,
    fetchProducts,
    updateProduct,
} from '../api/productApi';
import ConfirmDialog from './ConfirmDialog';
import ProductForm from './ProductForm';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function ProductList() {
    // What the user chose
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sortBy, setSortBy] = useState('id');
    const [direction, setDirection] = useState('asc');
    const [reload, setReload] = useState(0);


    const [editing, setEditing] = useState(null);

    const [deleting, setDeleting] = useState(null);
    const [notice, setNotice] = useState('');


    const [result, setResult] = useState({ key: null, data: null, error: null });

    const requestKey = `${page}|${size}|${sortBy}|${direction}|${reload}`;
    const loading = result.key !== requestKey;

    useEffect(() => {
        let cancelled = false;

        fetchProducts({ page, size, sortBy, direction })
            .then((data) => {
                if (!cancelled) setResult({ key: requestKey, data, error: null });
            })
            .catch((err) => {
                if (cancelled) return;
                const message =
                    err instanceof TypeError
                        ? 'Cannot reach the server. Is the backend running on port 8080?'
                        : err.message;
                setResult({ key: requestKey, data: null, error: message });
            });

        return () => {
            cancelled = true;
        };
    }, [requestKey, page, size, sortBy, direction]);

    const changeSortBy = (value) => { setSortBy(value); setPage(0); };
    const changeDirection = (value) => { setDirection(value); setPage(0); };
    const changeSize = (value) => { setSize(Number(value)); setPage(0); };

    const openCreateForm = () => { setNotice(''); setEditing({ mode: 'create' }); };
    const openEditForm = (product) => { setNotice(''); setEditing({ mode: 'edit', product }); };
    const closeForm = () => setEditing(null);

    const openDeleteDialog = (product) => { setNotice(''); setDeleting(product); };
    const closeDeleteDialog = () => setDeleting(null);

    const handleSave = async (values) => {
        if (editing.mode === 'create') {
            await createProduct(values);
            setSortBy('id');
            setDirection('desc');
            setPage(0);
            setNotice('Product created.');
        } else {
            await updateProduct(editing.product.id, values);
            setNotice(`Product ${editing.product.id} updated.`);
        }
        setEditing(null);
        setReload((n) => n + 1); // refetch the list
    };

    const handleConfirmDelete = async () => {
        const product = deleting;
        try {
            await deleteProduct(product.id);
            setNotice(`Product ${product.id} deleted.`);
        } catch (err) {

            if (err instanceof ApiError && err.status === 404) {
                setNotice(`Product ${product.id} was already deleted.`);
            } else {
                throw err;
            }
        }

        setDeleting(null);


        if (editing?.mode === 'edit' && editing.product.id === product.id) {
            setEditing(null);
        }


        if (result.data && result.data.products.length === 1 && page > 0) {
            setPage(page - 1);
        } else {
            setReload((n) => n + 1);
        }
    };

    const { data, error } = result;

    return (
        <section>
            {notice && <p className="notice">{notice}</p>}

            {editing && (
                <ProductForm

                    key={editing.mode === 'edit' ? editing.product.id : 'new'}
                    title={editing.mode === 'create' ? 'Add product' : `Edit product ${editing.product.id}`}
                    initialValues={editing.mode === 'edit' ? editing.product : {}}
                    submitLabel={editing.mode === 'create' ? 'Create' : 'Save changes'}
                    onSubmit={handleSave}
                    onCancel={closeForm}
                />
            )}

            {deleting && (
                <ConfirmDialog
                    title="Delete product?"
                    message={`Are you sure you want to delete "${deleting.name}" (ID ${deleting.id})? This cannot be undone.`}
                    confirmLabel="Delete"
                    onConfirm={handleConfirmDelete}
                    onCancel={closeDeleteDialog}
                />
            )}

            <div className="toolbar">
                <label>
                    Sort by
                    <select value={sortBy} onChange={(e) => changeSortBy(e.target.value)}>
                        <option value="id">ID</option>
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                    </select>
                </label>
                <label>
                    Order
                    <select value={direction} onChange={(e) => changeDirection(e.target.value)}>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </label>
                <label>
                    Per page
                    <select value={size} onChange={(e) => changeSize(e.target.value)}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                    </select>
                </label>
                <button className="primary push-right" onClick={openCreateForm} disabled={editing !== null}>
                    + Add product
                </button>
            </div>

            {loading && <p className="message">Loading products...</p>}

            {!loading && error && (
                <div className="message error">
                    <p>{error}</p>
                    <button onClick={() => setReload((n) => n + 1)}>Retry</button>
                </div>
            )}

            {!loading && !error && data.products.length === 0 && (
                <p className="message">No products found.</p>
            )}

            {!loading && !error && data.products.length > 0 && (
                <>
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th className="number">Price</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.products.map((product) => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>{product.name}</td>
                                <td>{product.description}</td>
                                <td className="number">{currency.format(product.price)}</td>
                                <td>
                                    <div className="row-actions">
                                        <button onClick={() => openEditForm(product)}>Edit</button>
                                        <button className="danger" onClick={() => openDeleteDialog(product)}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <div className="pagination">
                        <button onClick={() => setPage(page - 1)} disabled={page === 0}>
                            Previous
                        </button>
                        <span>
              Page {page + 1} of {Math.max(data.totalPages, 1)} ({data.totalCount} products)
            </span>
                        <button onClick={() => setPage(page + 1)} disabled={page + 1 >= data.totalPages}>
                            Next
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
