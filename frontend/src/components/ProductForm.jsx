import { useState } from 'react';
import { ApiError } from '../api/productApi';


export default function ProductForm({ title, initialValues, submitLabel, onSubmit, onCancel }) {
    const [values, setValues] = useState({
        name: initialValues.name ?? '',
        description: initialValues.description ?? '',
        price: initialValues.price ?? '',
    });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => ({ ...previous, [name]: undefined }));
    };


    const validate = () => {
        const found = {};
        if (values.name.trim() === '') found.name = 'Name must not be blank';
        if (String(values.price).trim() === '') found.price = 'Price is required';
        else if (Number(values.price) < 0) found.price = 'Price must not be negative';
        return found;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        const clientErrors = validate();
        setErrors(clientErrors);
        if (Object.keys(clientErrors).length > 0) return;

        setSubmitting(true);
        try {
            await onSubmit({
                name: values.name.trim(),
                description: values.description.trim(),
                price: Number(values.price),
            });
        } catch (err) {
            if (err instanceof ApiError) {
                setErrors(err.fieldErrors);
                setFormError(err.message);
            } else {
                setFormError('Cannot reach the server. Is the backend running on port 8080?');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="form-panel" onSubmit={handleSubmit} noValidate>
            <h2>{title}</h2>

            <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" value={values.name} onChange={handleChange} />
                {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="field">
                <label htmlFor="description">Description</label>
                <input id="description" name="description" value={values.description} onChange={handleChange} />
                {errors.description && <span className="field-error">{errors.description}</span>}
            </div>

            <div className="field">
                <label htmlFor="price">Price</label>
                <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={values.price}
                    onChange={handleChange}
                />
                {errors.price && <span className="field-error">{errors.price}</span>}
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <div className="form-actions">
                <button type="submit" className="primary" disabled={submitting}>
                    {submitting ? 'Saving...' : submitLabel}
                </button>
                <button type="button" onClick={onCancel} disabled={submitting}>
                    Cancel
                </button>
            </div>
        </form>
    );
}
