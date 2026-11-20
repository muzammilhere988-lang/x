import {useMemo, useState} from 'react';
import {Eye, EyeOff, Pencil, Plus, Search, Trash2} from 'lucide-react';
import {deleteProduct, updateProduct} from '../../lib/menuApi';
import {deleteMenuImage} from '../../lib/storage';
import type {Category, Product} from '../../types/menu';
import {formatPrice} from '../../utils/formatters';
import {ConfirmDialog} from '../common/ConfirmDialog';
import {MenuImage} from '../common/MenuImage';
import {ProductFormModal} from './ProductFormModal';

interface ProductsSectionProps {
  products: Product[];
  categories: Category[];
  currencySymbol: string;
  loading: boolean;
  onProductsChange: (next: Product[]) => void;
  onGoToCategories: () => void;
}

export function ProductsSection({
  products,
  categories,
  currencySymbol,
  loading,
  onProductsChange,
  onGoToCategories,
}: ProductsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{type: 'success' | 'error'; message: string} | null>(
    null
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
      const isPubliclyVisible = p.is_active && p.is_available;
      if (statusFilter === 'visible' && !isPubliclyVisible) return false;
      if (statusFilter === 'hidden' && isPubliclyVisible) return false;
      return true;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaved = (saved: Product, mode: 'created' | 'updated') => {
    if (mode === 'created') {
      onProductsChange([saved, ...products]);
      setFeedback({type: 'success', message: `"${saved.name}" added to your menu.`});
    } else {
      onProductsChange(products.map((p) => (p.id === saved.id ? saved : p)));
      setFeedback({type: 'success', message: `"${saved.name}" updated.`});
    }
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleToggleVisibility = async (product: Product) => {
    setTogglingId(product.id);
    setFeedback(null);
    try {
      const updated = await updateProduct(product.id, {is_active: !product.is_active});
      onProductsChange(products.map((p) => (p.id === updated.id ? updated : p)));
      setFeedback({
        type: 'success',
        message: updated.is_active
          ? `"${updated.name}" is now visible on the public menu.`
          : `"${updated.name}" is now hidden from the public menu.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update product visibility.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    setFeedback(null);
    try {
      await deleteProduct(productToDelete.id);
      await deleteMenuImage(productToDelete.image_path);
      onProductsChange(products.filter((p) => p.id !== productToDelete.id));
      setFeedback({
        type: 'success',
        message: `"${productToDelete.name}" permanently deleted.`,
      });
      setProductToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete product.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between gap-4 ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="h-10 px-3 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <div className="flex items-center p-1 bg-stone-100 rounded-lg">
            {(['all', 'visible', 'hidden'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-10 px-4 inline-flex items-center justify-center gap-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {[1, 2, 3].map((row) => (
            <div key={row} className="p-4 flex items-center gap-4">
              <div className="w-16 h-12 rounded bg-stone-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-stone-100 rounded animate-pulse" />
                <div className="h-3 w-24 bg-stone-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
          <h2 className="text-base font-semibold text-stone-900">No products added yet</h2>
          <p className="mt-1.5 text-sm text-stone-500 max-w-md mx-auto">
            {categories.length === 0
              ? 'Create your first category, then add products with real photographs and prices.'
              : 'Add your first product with a photograph, price, and category to publish it to your menu.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {categories.length === 0 ? (
              <button
                type="button"
                onClick={onGoToCategories}
                className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800"
              >
                Create First Category
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800"
              >
                Add First Product
              </button>
            )}
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
          <p className="text-sm text-stone-600">No products match your current search or filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-xs font-medium text-stone-500">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {filteredProducts.map((product) => {
                  const category = categoryMap.get(product.category_id);
                  const categoryHidden = category ? !category.is_active : false;
                  const statusLabel = !product.is_active
                    ? 'Hidden'
                    : !product.is_available
                      ? 'Sold Out'
                      : categoryHidden
                        ? 'Category Hidden'
                        : 'Visible';

                  return (
                    <tr key={product.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3.5 min-w-[200px]">
                          <MenuImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-14 h-11 rounded-md shrink-0 border border-stone-200"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-stone-900 truncate max-w-[240px]">
                              {product.name}
                            </p>
                            {product.admin_notes ? (
                              <p className="text-xs text-stone-500 truncate max-w-[240px]">
                                {product.admin_notes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                        {category?.name ?? 'Uncategorized'}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-stone-900 tabular-nums whitespace-nowrap">
                        {formatPrice(product.price, currencySymbol)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium ${
                            statusLabel === 'Visible'
                              ? 'text-emerald-700'
                              : statusLabel === 'Sold Out'
                                ? 'text-amber-700'
                                : 'text-stone-500'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(product)}
                            disabled={togglingId === product.id}
                            title={product.is_active ? 'Hide product' : 'Show product'}
                            aria-label={
                              product.is_active
                                ? `Hide ${product.name}`
                                : `Show ${product.name}`
                            }
                            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-40"
                          >
                            {product.is_active ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            title="Edit product"
                            aria-label={`Edit ${product.name}`}
                            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            title="Delete product"
                            aria-label={`Delete ${product.name}`}
                            className="p-2 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        editingProduct={editingProduct}
        categories={categories}
        currencySymbol={currencySymbol}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSaved={handleSaved}
        onGoToCategories={onGoToCategories}
      />

      <ConfirmDialog
        open={Boolean(productToDelete)}
        title="Delete Product"
        description={
          productToDelete
            ? `Are you sure you want to permanently delete "${productToDelete.name}"? Its uploaded photograph will also be removed from storage.`
            : ''
        }
        confirmLabel="Delete Product"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
