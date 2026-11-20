import {useEffect, useRef, useState, type ChangeEvent, type FormEvent} from 'react';
import {Upload, X} from 'lucide-react';
import {createProduct, updateProduct} from '../../lib/menuApi';
import {deleteMenuImage, uploadMenuImage, validateImageFile} from '../../lib/storage';
import type {Category, Product} from '../../types/menu';
import {validateMonetaryPrice} from '../../utils/formatters';

interface ProductFormModalProps {
  open: boolean;
  editingProduct: Product | null;
  categories: Category[];
  currencySymbol: string;
  onClose: () => void;
  onSaved: (product: Product, mode: 'created' | 'updated') => void;
  onGoToCategories: () => void;
}

export function ProductFormModal({
  open,
  editingProduct,
  categories,
  currencySymbol,
  onClose,
  onSaved,
  onGoToCategories,
}: ProductFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    if (editingProduct) {
      setName(editingProduct.name);
      setPriceInput(String(editingProduct.price));
      setCategoryId(editingProduct.category_id);
      setIsActive(editingProduct.is_active);
      setIsAvailable(editingProduct.is_available);
      setAdminNotes(editingProduct.admin_notes ?? '');
      setPreviewUrl(editingProduct.image_url);
    } else {
      setName('');
      setPriceInput('');
      setCategoryId(categories[0]?.id ?? '');
      setIsActive(true);
      setIsAvailable(true);
      setAdminNotes('');
      setPreviewUrl('');
    }

    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStage('');
    setError('');
  }, [open, editingProduct, categories]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.error || 'Invalid image file.');
      return;
    }

    setError('');
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Product name is required.');
      return;
    }

    const priceValidation = validateMonetaryPrice(priceInput);
    if (!priceValidation.valid) {
      setError(priceValidation.error || 'Invalid price.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    if (!editingProduct && !selectedFile) {
      setError('Please upload a food photograph for this product.');
      return;
    }

    setSubmitting(true);
    let newlyUploadedPath: string | null = null;

    try {
      let imagePath = editingProduct?.image_path ?? '';
      let imageUrl = editingProduct?.image_url ?? '';

      if (selectedFile) {
        const uploaded = await uploadMenuImage(selectedFile, 'products', (pct, stage) => {
          setUploadProgress(pct);
          setUploadStage(stage);
        });
        imagePath = uploaded.path;
        imageUrl = uploaded.publicUrl;
        newlyUploadedPath = uploaded.path;
      }

      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, {
          name: trimmedName,
          price: priceValidation.value,
          category_id: categoryId,
          is_active: isActive,
          is_available: isAvailable,
          admin_notes: adminNotes,
          image_path: imagePath,
          image_url: imageUrl,
        });

        // Clean up previous storage object after DB update succeeds
        if (newlyUploadedPath && editingProduct.image_path && editingProduct.image_path !== newlyUploadedPath) {
          await deleteMenuImage(editingProduct.image_path);
        }

        onSaved(updated, 'updated');
      } else {
        const created = await createProduct({
          name: trimmedName,
          price: priceValidation.value,
          category_id: categoryId,
          is_active: isActive,
          is_available: isAvailable,
          admin_notes: adminNotes || null,
          image_path: imagePath,
          image_url: imageUrl,
        });

        onSaved(created, 'created');
      }
    } catch (err) {
      // Roll back newly uploaded file if DB insert/update failed
      if (newlyUploadedPath) {
        await deleteMenuImage(newlyUploadedPath);
      }
      setError(err instanceof Error ? err.message : 'Unable to save product.');
      setUploadProgress(0);
      setUploadStage('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-stone-200 rounded-xl shadow-xl my-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 id="product-modal-title" className="text-base font-semibold text-stone-900">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close product form"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          ) : null}

          {categories.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">No categories available yet.</p>
              <p className="mt-1 text-xs text-amber-800">
                Create at least one category before adding products.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToCategories();
                }}
                className="mt-3 px-3.5 py-1.5 text-xs font-medium bg-amber-900 text-white rounded-md hover:bg-amber-800"
              >
                Create a Category
              </button>
            </div>
          ) : null}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1.5">
              Product Photograph {editingProduct ? '(Optional to replace)' : '*'}
            </label>

            <div className="flex items-start gap-4">
              <div className="w-28 h-24 rounded-lg border border-stone-200 bg-stone-50 overflow-hidden shrink-0 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="w-5 h-5 text-stone-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={submitting}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  {previewUrl ? 'Replace Photograph' : 'Upload Photograph'}
                </button>
                <p className="mt-1.5 text-xs text-stone-500">
                  JPG, PNG, or WebP up to 5 MB. Automatically optimized for mobile speed.
                </p>
                {submitting && uploadProgress > 0 ? (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
                      <span>{uploadStage}</span>
                      <span className="tabular-nums">{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-900 transition-all duration-200"
                        style={{width: `${uploadProgress}%`}}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-stone-800 mb-1.5">
              Product Name *
            </label>
            <input
              id="product-name"
              type="text"
              required
              maxLength={140}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="Enter dish or item name"
              className="w-full h-11 px-3.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="product-price"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                Price ({currencySymbol}) *
              </label>
              <input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                disabled={submitting}
                placeholder="0.00"
                className="w-full h-11 px-3.5 text-sm tabular-nums border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div>
              <label
                htmlFor="product-category"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                Category *
              </label>
              <select
                id="product-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting || categories.length === 0}
                className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                      {!cat.is_active ? ' (Hidden category)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Visibility & Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <label className="flex items-start gap-3 p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={submitting}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <span>
                <span className="block text-sm font-medium text-stone-900">Visible on Menu</span>
                <span className="block text-xs text-stone-500">
                  Uncheck to hide from customers
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                disabled={submitting}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
              />
              <span>
                <span className="block text-sm font-medium text-stone-900">Available Today</span>
                <span className="block text-xs text-stone-500">
                  Uncheck if temporarily sold out
                </span>
              </span>
            </label>
          </div>

          {/* Private Admin Notes */}
          <div>
            <label htmlFor="admin-notes" className="block text-sm font-medium text-stone-800 mb-1.5">
              Admin Reference Note (Private)
            </label>
            <textarea
              id="admin-notes"
              rows={2}
              maxLength={500}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={submitting}
              placeholder="Optional internal note (never displayed on the customer menu)"
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || categories.length === 0}
              className="px-5 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : editingProduct
                  ? 'Save Changes'
                  : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
