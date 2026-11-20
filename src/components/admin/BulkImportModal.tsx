import {useMemo, useState, type FormEvent} from 'react';
import {ListPlus, X} from 'lucide-react';
import {createCategory, createProduct} from '../../lib/menuApi';
import type {Category, Product} from '../../types/menu';

interface ParsedImportItem {
  categoryName: string;
  name: string;
  price: number;
}

function parseMenuText(raw: string): {items: ParsedImportItem[]; categoryNames: string[]} {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentCategory = 'General';
  const items: ParsedImportItem[] = [];
  const categorySet = new Set<string>();

  for (const line of lines) {
    // Explicit category heading syntax like "# Wraps" or "Wraps:"
    if (line.startsWith('#') || line.endsWith(':')) {
      const cleaned = line.replace(/^#+\s*/, '').replace(/:$/, '').trim();
      if (cleaned) {
        currentCategory = cleaned;
      }
      continue;
    }

    // Match trailing price separated by '-', '|', ':', or whitespace (e.g. "Broasted Chicken Wrap - 140" or "Subha 130")
    const match = line.match(/^(.+?)(?:\s*[-|:]\s*|\s+)₹?\s*(\d+(?:\.\d{1,2})?)$/);
    if (match) {
      const itemName = match[1].trim();
      const price = Number.parseFloat(match[2]);
      if (itemName && Number.isFinite(price) && price >= 0) {
        categorySet.add(currentCategory);
        items.push({
          categoryName: currentCategory,
          name: itemName,
          price,
        });
        continue;
      }
    }

    // Otherwise treat non-priced line as a category heading
    currentCategory = line;
  }

  return {items, categoryNames: Array.from(categorySet)};
}

interface BulkImportModalProps {
  open: boolean;
  existingCategories: Category[];
  existingProducts: Product[];
  currencySymbol: string;
  onClose: () => void;
  onImported: (result: {
    addedCategories: Category[];
    addedProducts: Product[];
    skippedCount: number;
  }) => void;
}

export function BulkImportModal({
  open,
  existingCategories,
  existingProducts,
  currencySymbol,
  onClose,
  onImported,
}: BulkImportModalProps) {
  const [rawText, setRawText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');

  const parsed = useMemo(() => parseMenuText(rawText), [rawText]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (parsed.items.length === 0) {
      setError('No valid items found. Enter a category line followed by "Item Name - Price" lines.');
      return;
    }

    setSubmitting(true);
    try {
      const categoryByLowerName = new Map<string, Category>();
      for (const cat of existingCategories) {
        categoryByLowerName.set(cat.name.trim().toLowerCase(), cat);
      }

      const addedCategories: Category[] = [];
      let nextOrder = existingCategories.reduce((max, c) => Math.max(max, c.display_order), 0) + 1;

      for (const catName of parsed.categoryNames) {
        const key = catName.trim().toLowerCase();
        if (!categoryByLowerName.has(key)) {
          setProgressText(`Creating category "${catName}"...`);
          const createdCat = await createCategory({
            name: catName,
            display_order: nextOrder++,
            is_active: true,
          });
          categoryByLowerName.set(key, createdCat);
          addedCategories.push(createdCat);
        }
      }

      const existingKeys = new Set(
        existingProducts.map((p) => `${p.category_id}::${p.name.trim().toLowerCase()}`)
      );

      const addedProducts: Product[] = [];
      let skippedCount = 0;

      for (let i = 0; i < parsed.items.length; i++) {
        const item = parsed.items[i];
        const category = categoryByLowerName.get(item.categoryName.trim().toLowerCase());
        if (!category) continue;

        const dedupKey = `${category.id}::${item.name.trim().toLowerCase()}`;
        if (existingKeys.has(dedupKey)) {
          skippedCount++;
          continue;
        }

        setProgressText(`Adding item ${i + 1} of ${parsed.items.length}: ${item.name}...`);
        const created = await createProduct({
          name: item.name,
          admin_notes: null,
          image_path: 'no-image',
          image_url: 'no-image',
          price: item.price,
          category_id: category.id,
          is_active: true,
          is_available: true,
        });
        existingKeys.add(dedupKey);
        addedProducts.push(created);
      }

      setRawText('');
      setProgressText('');
      onImported({addedCategories, addedProducts, skippedCount});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import menu items.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-import-title"
    >
      <div className="w-full max-w-xl bg-white border border-stone-200 rounded-xl shadow-xl my-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListPlus className="w-4 h-4 text-stone-700" />
            <h2 id="bulk-import-title" className="text-base font-semibold text-stone-900">
              Bulk Import Menu Items
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            aria-label="Close bulk import modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          ) : null}

          <div className="text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-1">
            <p className="font-medium text-stone-800">Paste your categories and items below:</p>
            <p className="font-mono text-[11px] text-stone-600">
              Wraps:<br />
              Broasted Chicken Wrap - 140<br />
              Paneer Wrap - 140
            </p>
          </div>

          <div>
            <label htmlFor="bulk-menu-text" className="block text-sm font-medium text-stone-800 mb-1.5">
              Menu List
            </label>
            <textarea
              id="bulk-menu-text"
              rows={9}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={submitting}
              placeholder={'Platter:\nVeg Momos - 120\nChicken Wings - 180'}
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-stone-600">
            <span>
              Detected: <strong>{parsed.categoryNames.length}</strong> categories,{' '}
              <strong>{parsed.items.length}</strong> items ({currencySymbol})
            </span>
            {progressText ? <span className="text-stone-800 font-medium">{progressText}</span> : null}
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
              disabled={submitting || parsed.items.length === 0}
              className="px-5 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 disabled:opacity-50"
            >
              {submitting ? 'Importing...' : `Import ${parsed.items.length} Items`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
