import {useMemo, useState, type FormEvent} from 'react';
import {ArrowDown, ArrowUp, Check, Eye, EyeOff, Pencil, Plus, Trash2, X} from 'lucide-react';
import {createCategory, deleteCategory, updateCategory} from '../../lib/menuApi';
import type {Category, Product} from '../../types/menu';
import {ConfirmDialog} from '../common/ConfirmDialog';

interface CategoriesSectionProps {
  categories: Category[];
  products: Product[];
  loading: boolean;
  onCategoriesChange: (next: Category[]) => void;
}

export function CategoriesSection({
  categories,
  products,
  loading,
  onCategoriesChange,
}: CategoriesSectionProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{type: 'success' | 'error'; message: string} | null>(
    null
  );

  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.display_order - b.display_order);
  }, [categories]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setFeedback({type: 'error', message: 'Category name cannot be empty.'});
      return;
    }

    setCreating(true);
    setFeedback(null);
    try {
      const nextOrder =
        sortedCategories.length > 0
          ? Math.max(...sortedCategories.map((c) => c.display_order)) + 1
          : 1;
      const created = await createCategory({
        name: trimmed,
        display_order: nextOrder,
        is_active: true,
      });
      onCategoriesChange([...categories, created]);
      setNewCategoryName('');
      setFeedback({type: 'success', message: `Category "${created.name}" created.`});
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to create category.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setFeedback(null);
  };

  const handleSaveEdit = async (category: Category) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setFeedback({type: 'error', message: 'Category name cannot be empty.'});
      return;
    }

    setSavingEdit(true);
    setFeedback(null);
    try {
      const updated = await updateCategory(category.id, {name: trimmed});
      onCategoriesChange(categories.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
      setFeedback({type: 'success', message: `Category renamed to "${updated.name}".`});
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to rename category.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    setBusyId(category.id);
    setFeedback(null);
    try {
      const updated = await updateCategory(category.id, {is_active: !category.is_active});
      onCategoriesChange(categories.map((c) => (c.id === updated.id ? updated : c)));
      setFeedback({
        type: 'success',
        message: updated.is_active
          ? `"${updated.name}" is now active.`
          : `"${updated.name}" is now hidden from the public menu.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update category visibility.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const current = sortedCategories[index];
    const neighbor = sortedCategories[targetIndex];

    setBusyId(current.id);
    setFeedback(null);

    try {
      // Ensure distinct order values when swapping
      const currentOrder = neighbor.display_order === current.display_order
        ? (direction === 'up' ? index : index + 2)
        : neighbor.display_order;
      const neighborOrder = neighbor.display_order === current.display_order
        ? index + 1
        : current.display_order;

      const [updatedCurrent, updatedNeighbor] = await Promise.all([
        updateCategory(current.id, {display_order: currentOrder}),
        updateCategory(neighbor.id, {display_order: neighborOrder}),
      ]);

      onCategoriesChange(
        categories.map((c) => {
          if (c.id === updatedCurrent.id) return updatedCurrent;
          if (c.id === updatedNeighbor.id) return updatedNeighbor;
          return c;
        })
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to reorder categories.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    setFeedback(null);
    try {
      await deleteCategory(categoryToDelete.id);
      onCategoriesChange(categories.filter((c) => c.id !== categoryToDelete.id));
      setFeedback({
        type: 'success',
        message: `Category "${categoryToDelete.name}" deleted.`,
      });
      setCategoryToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete category.',
      });
      setCategoryToDelete(null);
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

      {/* Add Category Form */}
      <form
        onSubmit={handleCreate}
        className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-end gap-3"
      >
        <div className="flex-1">
          <label htmlFor="new-category-name" className="block text-sm font-medium text-stone-800 mb-1.5">
            New Category Name
          </label>
          <input
            id="new-category-name"
            type="text"
            maxLength={100}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={creating}
            placeholder="Enter category name"
            className="w-full h-10 px-3.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="h-10 px-4 inline-flex items-center justify-center gap-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{creating ? 'Adding...' : 'Add Category'}</span>
        </button>
      </form>

      {/* Categories List */}
      {loading ? (
        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4 flex items-center justify-between">
              <div className="h-4 w-36 bg-stone-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-stone-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : sortedCategories.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
          <h2 className="text-base font-semibold text-stone-900">No categories created yet</h2>
          <p className="mt-1.5 text-sm text-stone-500 max-w-md mx-auto">
            Add your menu sections above. Only categories that contain active products appear on
            the public customer menu.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-xs font-medium text-stone-500">
                  <th className="py-3 px-4 w-24">Order</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4 text-right">Products</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {sortedCategories.map((category, index) => {
                  const count = productCounts.get(category.id) ?? 0;
                  const isEditing = editingId === category.id;
                  const isBusy = busyId === category.id;

                  return (
                    <tr key={category.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0 || isBusy}
                            aria-label={`Move ${category.name} up`}
                            className="p-1.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === sortedCategories.length - 1 || isBusy}
                            aria-label={`Move ${category.name} down`}
                            className="p-1.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              disabled={savingEdit}
                              className="h-9 px-2.5 text-sm border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-900 flex-1"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(category)}
                              disabled={savingEdit}
                              aria-label="Save category name"
                              className="p-2 rounded-md bg-stone-900 text-white hover:bg-stone-800"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={savingEdit}
                              aria-label="Cancel editing"
                              className="p-2 rounded-md border border-stone-200 text-stone-600 hover:bg-stone-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-medium text-stone-900">{category.name}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums text-stone-600">
                        {count}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium ${
                            category.is_active ? 'text-emerald-700' : 'text-stone-500'
                          }`}
                        >
                          {category.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(category)}
                            disabled={isBusy}
                            title={category.is_active ? 'Hide category' : 'Show category'}
                            aria-label={
                              category.is_active
                                ? `Hide ${category.name}`
                                : `Show ${category.name}`
                            }
                            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-40"
                          >
                            {category.is_active ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(category)}
                            title="Rename category"
                            aria-label={`Rename ${category.name}`}
                            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(category)}
                            title="Delete category"
                            aria-label={`Delete ${category.name}`}
                            className="p-2 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50"
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

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Delete Category"
        description={
          categoryToDelete && (productCounts.get(categoryToDelete.id) ?? 0) > 0
            ? `"${categoryToDelete.name}" currently contains ${productCounts.get(categoryToDelete.id)} product(s). Reassign or delete those products before deleting this category.`
            : categoryToDelete
              ? `Are you sure you want to permanently delete "${categoryToDelete.name}"?`
              : ''
        }
        confirmLabel="Delete Category"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
