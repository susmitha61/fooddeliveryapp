'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppSelector } from '@/store';
import {
  useGetMyRestaurantsQuery,
  useGetRestaurantsQuery,
  useGetFullMenuQuery,
  useFilterMenuItemsQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useToggleMenuItemAvailableMutation,
  useToggleMenuItemSpecialMutation,
} from '@/store/api/restaurantApi';
import {
  Plus, Trash2, Edit2, X, Save, ChevronDown, ChevronRight,
  Utensils, Tag, Star, Leaf, Flame, Image as ImageIcon,
  FolderPlus, Upload, ShieldAlert, Store, Check, Layers
} from 'lucide-react';
import { DishRatingBadge } from '@/components/ui/DishRatingBadge';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { ManagerStoreSwitcher } from '@/components/manager/ManagerStoreSwitcher';
import { LoadingSpinner } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const MEAL_TYPES_OPTS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS', 'ALL_DAY'];

interface ItemForm {
  name: string; description: string; price: string;
  imageUrl: string; categoryId: string; mealType: string;
  isVegetarian: boolean; isVegan: boolean; isSpicy: boolean;
  isBestSeller: boolean; isTodaysSpecial: boolean; isAvailable: boolean;
  preparationTimeMinutes: string; calories: string; allergenInfo: string;
}

const EMPTY_ITEM: ItemForm = {
  name: '', description: '', price: '', imageUrl: '',
  categoryId: '', mealType: 'ALL_DAY',
  isVegetarian: false, isVegan: false, isSpicy: false,
  isBestSeller: false, isTodaysSpecial: false, isAvailable: true,
  preparationTimeMinutes: '', calories: '', allergenInfo: '',
};

function MenuItemForm({
  restaurantId, categories, initialData, defaultCategoryId, onSave, onCancel, isLoading,
}: {
  restaurantId: string; categories: any[];
  initialData?: any; defaultCategoryId?: string; onSave: (data: any) => void;
  onCancel: () => void; isLoading: boolean;
}) {
  const [form, setForm] = useState<ItemForm>(() => {
    if (!initialData) return { ...EMPTY_ITEM, categoryId: defaultCategoryId || '' };
    return {
      name: initialData.name || '',
      description: initialData.description || '',
      price: String(initialData.price ?? ''),
      imageUrl: initialData.imageUrl || '',
      categoryId: initialData.categoryId || defaultCategoryId || '',
      mealType: initialData.mealType || 'ALL_DAY',
      isVegetarian: initialData.isVegetarian || initialData.isVeg || false,
      isVegan: initialData.isVegan || false,
      isSpicy: initialData.isSpicy || false,
      isBestSeller: initialData.isBestSeller || false,
      isTodaysSpecial: initialData.isTodaysSpecial || false,
      isAvailable: initialData.isAvailable !== false && initialData.available !== false,
      preparationTimeMinutes: String(initialData.preparationTimeMinutes ?? ''),
      calories: String(initialData.calories ?? ''),
      allergenInfo: initialData.allergenInfo || '',
    };
  });

  const set = (k: keyof ItemForm, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid price'); return; }
    if (!form.categoryId) {
      if (categories.length === 0) {
        toast.error('Please create at least one category before adding items so diners can review them.');
      } else {
        toast.error('Please select a category for this menu item.');
      }
      return;
    }
    onSave({
      name: form.name.trim(),
      description: form.description || undefined,
      price,
      imageUrl: form.imageUrl || undefined,
      categoryId: form.categoryId || undefined,
      mealType: form.mealType,
      isVegetarian: form.isVegetarian,
      isVegan: form.isVegan,
      isSpicy: form.isSpicy,
      isBestSeller: form.isBestSeller,
      isTodaysSpecial: form.isTodaysSpecial,
      isAvailable: form.isAvailable,
      preparationTimeMinutes: form.preparationTimeMinutes ? parseInt(form.preparationTimeMinutes) : undefined,
      calories: form.calories ? parseInt(form.calories) : undefined,
      allergenInfo: form.allergenInfo || undefined,
    });
  };

  const inputCls = "w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors placeholder:text-[var(--text-muted)]";
  const labelCls = "block text-xs font-semibold text-[var(--text-secondary)] mb-1";
  const Toggle = ({ val, onToggle, label }: { val: boolean; onToggle: () => void; label: string }) => (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onToggle}
        className={`relative w-10 h-5 rounded-full transition-colors ${val ? 'bg-[var(--primary-color)]' : 'bg-[var(--border-color)]'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Item Name *</label>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Deluxe Burger" required minLength={2} maxLength={200} />
        </div>
        <div>
          <label className={labelCls}>Price (₹) *</label>
          <input type="number" min="0.01" step="0.01" className={inputCls} value={form.price}
            onChange={e => set('price', e.target.value)} placeholder="149.00" required />
        </div>
        <div>
          <label className={labelCls}>Category *</label>
          <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required>
            <option value="">-- Select Category --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {categories.length === 0 && (
            <p className="text-[11px] text-amber-400 mt-1">
              ⚠️ No categories created yet. Create a category first so diners can review dishes.
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>Meal Type</label>
          <select className={inputCls} value={form.mealType} onChange={e => set('mealType', e.target.value)}>
            {MEAL_TYPES_OPTS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Prep Time (mins)</label>
          <input type="number" min="1" className={inputCls} value={form.preparationTimeMinutes}
            onChange={e => set('preparationTimeMinutes', e.target.value)} placeholder="15" />
        </div>
        <div>
          <label className={labelCls}>Calories</label>
          <input type="number" min="0" className={inputCls} value={form.calories}
            onChange={e => set('calories', e.target.value)} placeholder="350" />
        </div>
        <div>
          <label className={labelCls}>Allergen Information</label>
          <input className={inputCls} value={form.allergenInfo}
            onChange={e => set('allergenInfo', e.target.value)} placeholder="e.g. Contains Dairy, Gluten" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Description</label>
          <textarea className={inputCls} rows={2} value={form.description}
            onChange={e => set('description', e.target.value)} placeholder="Brief description of the dish..." />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Image URL</label>
          <input className={inputCls} value={form.imageUrl}
            onChange={e => set('imageUrl', e.target.value)} placeholder="https://images.unsplash.com/..." />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              className="mt-2 h-20 w-28 object-cover rounded-lg border border-[var(--border-color)]" />
          )}
        </div>

        {/* Toggles */}
        <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[var(--background-color)] rounded-xl border border-[var(--border-color)]">
          <Toggle val={form.isVegetarian} onToggle={() => set('isVegetarian', !form.isVegetarian)} label="Vegetarian" />
          <Toggle val={form.isVegan} onToggle={() => set('isVegan', !form.isVegan)} label="Vegan" />
          <Toggle val={form.isSpicy} onToggle={() => set('isSpicy', !form.isSpicy)} label="Spicy" />
          <Toggle val={form.isBestSeller} onToggle={() => set('isBestSeller', !form.isBestSeller)} label="Best Seller" />
          <Toggle val={form.isTodaysSpecial} onToggle={() => set('isTodaysSpecial', !form.isTodaysSpecial)} label="Today's Special" />
          <Toggle val={form.isAvailable} onToggle={() => set('isAvailable', !form.isAvailable)} label="Available Now" />
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel}
          className="px-5 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-sm font-semibold rounded-xl hover:border-[var(--primary-color)] transition-all flex items-center gap-1.5">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="submit" disabled={isLoading}
          className="px-5 py-2 bg-[var(--primary-color)] text-white text-sm font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-60 hover:bg-[var(--primary-hover)] transition-all">
          <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : initialData ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

export default function ManagerMenuPage() {
  const { user } = useAppSelector(s => s.auth);
  const isManager = user?.role === 'MANAGER';

  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['__all__', '__uncategorized__']));
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [targetCategoryForNewItem, setTargetCategoryForNewItem] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  const { data: myRestsRes, isLoading: myRestsLoading, refetch: refetchMyRests } = useGetMyRestaurantsQuery(undefined, { skip: !isManager });
  const { data: allRestsRes } = useGetRestaurantsQuery({ page: 0, size: 100 }, { skip: isManager });

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const myRestaurants: any[] = extractArray(myRestsRes);
  const allRestaurants: any[] = extractArray(allRestsRes);

  const restaurants: any[] = isManager ? myRestaurants : allRestaurants;
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  useEffect(() => {
    if (restaurants.length > 0) {
      if (!selectedRestaurantId || !restaurants.some(r => r.id === selectedRestaurantId)) {
        setSelectedRestaurantId(restaurants[0].id);
      }
    } else {
      setSelectedRestaurantId('');
    }
  }, [restaurants, selectedRestaurantId]);

  const { data: menuRes, isLoading: menuLoading, refetch: refetchMenu } = useGetFullMenuQuery(selectedRestaurantId, {
    skip: !selectedRestaurantId,
    pollingInterval: 3000,
  });

  const menuData = menuRes?.data;
  const categories: any[] = menuData?.categories || [];

  const { data: allItemsRes, refetch: refetchAllItems } = useFilterMenuItemsQuery({ restaurantId: selectedRestaurantId }, {
    skip: !selectedRestaurantId,
    pollingInterval: 3000,
  });

  const [customItems, setCustomItems] = useState<any[]>([]);

  useEffect(() => {
    setShowAddItem(false);
    setEditingItem(null);
    setTargetCategoryForNewItem('');
    setCustomItems([]);
  }, [selectedRestaurantId]);

  useEffect(() => {
    if (!menuData && !allItemsRes) return;

    const itemsFromCats = categories.flatMap(c => (c.items || []).map((item: any) => ({
      ...item,
      categoryId: item.categoryId || c.id,
      categoryName: c.name,
      isVegetarian: item.isVegetarian ?? item.isVeg ?? false,
      isAvailable: item.isAvailable !== false && item.available !== false,
    })));

    const topLevelItems = (menuData?.items || (menuData as any)?.menuItems || []).map((i: any) => ({
      ...i,
      isVegetarian: i.isVegetarian ?? i.isVeg ?? false,
      isAvailable: itemIsAvail(i),
    }));

    function itemIsAvail(i: any) {
      return i.isAvailable !== false && i.available !== false;
    }

    const fromFilterItems = (Array.isArray(allItemsRes?.data) ? allItemsRes.data : ((allItemsRes?.data as any)?.content || [])).map((i: any) => ({
      ...i,
      isVegetarian: i.isVegetarian ?? i.isVeg ?? false,
      isAvailable: itemIsAvail(i),
    }));

    const combined = [...itemsFromCats, ...topLevelItems, ...fromFilterItems];

    setCustomItems(prev => {
      const map = new Map<string, any>();
      combined.forEach(i => { if (i.id) map.set(i.id, i); });
      prev.forEach(i => {
        if (i.id && (i.restaurantId === selectedRestaurantId || !i.restaurantId)) {
          if (!map.has(i.id)) map.set(i.id, i);
        }
      });
      return Array.from(map.values());
    });

    const catIds = categories.map(c => c.id).concat(['__uncategorized__']);
    setExpandedCategories(new Set(catIds));
  }, [categories, menuData, allItemsRes, selectedRestaurantId]);

  const [createCategory, { isLoading: creatingCat }] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createItem, { isLoading: creatingItem }] = useCreateMenuItemMutation();
  const [updateItem, { isLoading: updatingItem }] = useUpdateMenuItemMutation();
  const [deleteItem] = useDeleteMenuItemMutation();
  const [toggleAvail] = useToggleMenuItemAvailableMutation();
  const [toggleSpecial] = useToggleMenuItemSpecialMutation();

  const toggleCat = (id: string) => {
    setExpandedCategories(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const expandAll = () => {
    const ids = categories.map(c => c.id).concat(['__uncategorized__']);
    setExpandedCategories(new Set(ids));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createCategory({ restaurantId: selectedRestaurantId, name: newCategoryName.trim(), description: newCategoryDesc || undefined }).unwrap();
      toast.success(`Category "${newCategoryName}" created`);
      setNewCategoryName(''); setNewCategoryDesc(''); setShowAddCategory(false);
      refetchMenu();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (catId: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await deleteCategory({ restaurantId: selectedRestaurantId, catId }).unwrap();
      toast.success(`Category "${name}" deleted`);
      refetchMenu();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete category');
    }
  };

  const handleSaveItem = async (formData: any) => {
    try {
      if (editingItem) {
        const res = await updateItem({ itemId: editingItem.id, body: formData }).unwrap();
        const updated = res?.data || res;
        if (updated && (updated.id || editingItem.id)) {
          const itemToUpdate = {
            ...editingItem,
            ...updated,
            id: updated.id || editingItem.id,
            categoryId: updated.categoryId || formData.categoryId || editingItem.categoryId,
            isVegetarian: (updated as any).isVegetarian ?? (updated as any).vegetarian ?? formData.isVegetarian,
            isAvailable: updated.isAvailable ?? formData.isAvailable,
          };
          setCustomItems(prev => prev.map(i => i.id === itemToUpdate.id ? itemToUpdate : i));
        }
        toast.success('Menu item updated by Manager!');
        setEditingItem(null);
        setTargetCategoryForNewItem('');
        refetchMenu();
        refetchAllItems();
      } else {
        const res = await createItem({ restaurantId: selectedRestaurantId, body: formData }).unwrap();
        const newItem = res?.data || res;
        if (newItem && (newItem.id || (newItem as any).name)) {
          const itemToAdd = {
            ...newItem,
            id: newItem.id || `temp-${Date.now()}`,
            name: newItem.name || formData.name,
            price: newItem.price || formData.price,
            categoryId: newItem.categoryId || formData.categoryId || undefined,
            isVegetarian: (newItem as any).isVegetarian ?? (newItem as any).vegetarian ?? formData.isVegetarian,
            isAvailable: (newItem as any).isAvailable ?? formData.isAvailable,
            isTodaysSpecial: (newItem as any).isTodaysSpecial ?? formData.isTodaysSpecial,
            restaurantId: selectedRestaurantId,
          };
          setCustomItems(prev => {
            const exists = prev.some(i => i.id === itemToAdd.id);
            if (exists) return prev.map(i => i.id === itemToAdd.id ? { ...i, ...itemToAdd } : i);
            return [...prev, itemToAdd];
          });
        }
        toast.success('Menu item added by Manager!');
        setShowAddItem(false);
        setTargetCategoryForNewItem('');
        refetchMenu();
        refetchAllItems();
      }
    } catch (err: any) {
      const errs = err?.data?.data;
      if (errs && typeof errs === 'object') {
        toast.error(Object.values(errs)[0] as string);
      } else {
        toast.error(err?.data?.message || 'Failed to save item');
      }
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteItem(itemId).unwrap();
      setCustomItems(prev => prev.filter(i => i.id !== itemId));
      toast.success(`"${name}" deleted by Manager`);
      refetchMenu();
      refetchAllItems();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleToggleAvail = async (itemId: string) => {
    try {
      await toggleAvail(itemId).unwrap();
      setCustomItems(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i));
      toast.success('Availability toggled');
      refetchMenu();
      refetchAllItems();
    } catch {
      toast.error('Failed to toggle availability');
    }
  };

  const handleToggleSpecial = async (itemId: string) => {
    try {
      await toggleSpecial(itemId).unwrap();
      setCustomItems(prev => prev.map(i => i.id === itemId ? { ...i, isTodaysSpecial: !i.isTodaysSpecial } : i));
      toast.success("Today's special toggled");
      refetchMenu();
      refetchAllItems();
    } catch {
      toast.error("Failed to toggle special");
    }
  };

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
  const uncategorizedItems = customItems.filter(i => !i.categoryId || !categories.some(c => c.id === i.categoryId));

  if (isManager && myRestsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-[var(--text-secondary)] font-semibold">Verifying store associations...</p>
      </div>
    );
  }

  if (isManager && !hasAssociatedRestaurant) {
    return <ManagerUnassignedScreen onRefresh={refetchMyRests} pageTitle="Menu Management" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Menu Operations"
        description="Manage categories, add menu items, update prices, and control store availability."
        actions={
          selectedRestaurantId && !showAddItem && !editingItem ? (
            <button
              onClick={() => {
                setTargetCategoryForNewItem('');
                setShowAddItem(true);
              }}
              className="px-4 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:bg-[var(--primary-hover)] transition-all"
            >
              <Plus className="w-4 h-4" /> Add Menu Item
            </button>
          ) : null
        }
      />

                {/* Store Switcher for Assigned Stores */}
                {restaurants.length > 0 && (
                  <ManagerStoreSwitcher
                    restaurants={restaurants}
                    selectedRestaurantId={selectedRestaurantId}
                    onSelectRestaurantId={(id) => {
                      setSelectedRestaurantId(id);
                      setShowAddItem(false);
                      setEditingItem(null);
                    }}
                  />
                )}

                {/* Selected Restaurant Info */}
                {selectedRestaurant && (
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl mb-5 flex items-center gap-3">
                    {selectedRestaurant.imageUrl && (
                      <img src={selectedRestaurant.imageUrl} alt={selectedRestaurant.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[var(--border-color)]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-outfit font-bold">{selectedRestaurant.name}</h2>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {selectedRestaurant.cuisineType} • {customItems.length} item(s) across {categories.length} categories
                      </p>
                    </div>
                  </div>
                )}

                {/* Add/Edit Item Form */}
                {(showAddItem || editingItem) && selectedRestaurantId && (
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 mb-6">
                    <h3 className="font-outfit font-bold text-lg mb-5">
                      {editingItem ? `Edit Item: ${editingItem.name}` : 'Add New Menu Item'}
                    </h3>
                    <MenuItemForm
                      restaurantId={selectedRestaurantId}
                      categories={categories}
                      initialData={editingItem}
                      defaultCategoryId={targetCategoryForNewItem}
                      onSave={handleSaveItem}
                      onCancel={() => { setShowAddItem(false); setEditingItem(null); setTargetCategoryForNewItem(''); }}
                      isLoading={creatingItem || updatingItem}
                    />
                  </div>
                )}

                {/* Category Creation Bar & Controls */}
                {selectedRestaurantId && !showAddItem && !editingItem && (
                  <div className="mb-5">
                    {showAddCategory ? (
                      <form onSubmit={handleAddCategory}
                        className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col sm:flex-row gap-3 mb-3">
                        <input
                          className="flex-1 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                          value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                          placeholder="Category name (e.g. Starters, Main Course)" required autoFocus />
                        <input
                          className="flex-1 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                          value={newCategoryDesc} onChange={e => setNewCategoryDesc(e.target.value)}
                          placeholder="Description (optional)" />
                        <button type="submit" disabled={creatingCat}
                          className="px-4 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-60">
                          <Save className="w-3.5 h-3.5" /> {creatingCat ? 'Saving...' : 'Save Category'}
                        </button>
                        <button type="button" onClick={() => setShowAddCategory(false)}
                          className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-semibold rounded-xl">
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <button onClick={() => setShowAddCategory(true)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-color)] border border-dashed border-[var(--border-color)] text-xs font-bold rounded-xl hover:border-[var(--primary-color)] transition-all shadow-xs">
                          <FolderPlus className="w-4 h-4 text-[var(--primary-color)]" />
                          <span>Create New Menu Category</span>
                        </button>

                        {(categories.length > 0 || uncategorizedItems.length > 0) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={expandAll}
                              className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl transition-all"
                            >
                              Expand All
                            </button>
                            <button
                              onClick={collapseAll}
                              className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl transition-all"
                            >
                              Collapse All
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible Categories & Items */}
                {selectedRestaurantId && !showAddItem && !editingItem && (
                  <div className="space-y-4">
                    {categories.length === 0 && uncategorizedItems.length === 0 ? (
                      <div className="text-center py-16 bg-[var(--surface-color)] border border-dashed border-[var(--border-color)] rounded-3xl space-y-3">
                        <Utensils className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-2" />
                        <h3 className="font-outfit font-bold text-lg">No Categories or Menu Items Yet</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Create your first category or add menu items to get started.</p>
                      </div>
                    ) : (
                      <>
                        {categories.map(cat => {
                          const catItems = customItems.filter(i => i.categoryId === cat.id);
                          const isExpanded = expandedCategories.has(cat.id);
                          return (
                            <div key={cat.id} className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
                              {/* Accordion Header */}
                              <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--background-color)]/80 transition-colors select-none"
                                onClick={() => toggleCat(cat.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-1 text-[var(--primary-color)]">
                                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />}
                                  </div>
                                  <Tag className="w-4 h-4 text-[var(--primary-color)]" />
                                  <div>
                                    <span className="font-outfit font-extrabold text-base">{cat.name}</span>
                                    {cat.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{cat.description}</p>}
                                  </div>
                                  <span className="text-xs font-bold text-[var(--primary-color)] bg-[var(--primary-color)]/10 px-2.5 py-0.5 rounded-full border border-[var(--primary-color)]/20">
                                    {catItems.length} item(s)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setTargetCategoryForNewItem(cat.id);
                                      setShowAddItem(true);
                                    }}
                                    className="px-3 py-1.5 bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/20 hover:bg-[var(--primary-color)] hover:text-white text-[var(--primary-color)] text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Item</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                    className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                                    title="Delete category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Accordion Collapsible Content */}
                              {isExpanded && (
                                <div className="divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]">
                                  {catItems.length === 0 ? (
                                    <div className="p-5 text-center bg-[var(--background-color)]/40">
                                      <p className="text-xs text-[var(--text-muted)] italic mb-2">No menu items added under category &quot;{cat.name}&quot; yet.</p>
                                      <button
                                        onClick={() => {
                                          setTargetCategoryForNewItem(cat.id);
                                          setShowAddItem(true);
                                        }}
                                        className="px-3.5 py-1.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-xs"
                                      >
                                        + Add First Item to {cat.name}
                                      </button>
                                    </div>
                                  ) : (
                                    catItems.map((item: any) => (
                                      <ItemRow key={item.id} item={item}
                                        onEdit={() => setEditingItem(item)}
                                        onDelete={() => handleDeleteItem(item.id, item.name)}
                                        onToggleAvail={() => handleToggleAvail(item.id)}
                                        onToggleSpecial={() => handleToggleSpecial(item.id)}
                                      />
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Uncategorized Section */}
                        {uncategorizedItems.length > 0 && (
                          <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
                            <div
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--background-color)]/80 transition-colors select-none"
                              onClick={() => toggleCat('__uncategorized__')}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-1 text-[var(--primary-color)]">
                                  {expandedCategories.has('__uncategorized__') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />}
                                </div>
                                <Layers className="w-4 h-4 text-amber-400" />
                                <div>
                                  <span className="font-outfit font-extrabold text-base">Uncategorized Items</span>
                                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Items without assigned category</p>
                                </div>
                                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                  {uncategorizedItems.length} item(s)
                                </span>
                              </div>
                            </div>

                            {expandedCategories.has('__uncategorized__') && (
                              <div className="divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]">
                                {uncategorizedItems.map((item: any) => (
                                  <ItemRow key={item.id} item={item}
                                    onEdit={() => setEditingItem(item)}
                                    onDelete={() => handleDeleteItem(item.id, item.name)}
                                    onToggleAvail={() => handleToggleAvail(item.id)}
                                    onToggleSpecial={() => handleToggleSpecial(item.id)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
    </div>
  );
}

function ItemRow({ item, onEdit, onDelete, onToggleAvail, onToggleSpecial }: {
  item: any; onEdit: () => void; onDelete: () => void;
  onToggleAvail: () => void; onToggleSpecial: () => void;
}) {
  return (
    <div className="p-4 hover:bg-[var(--background-color)] transition-colors">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex gap-3 items-start flex-1 min-w-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--background-color)] border border-[var(--border-color)] shrink-0">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm">{item.name}</span>
              {item.isVegetarian && <span title="Veg"><Leaf className="w-3.5 h-3.5 text-emerald-400" /></span>}
              {item.isSpicy && <span title="Spicy"><Flame className="w-3.5 h-3.5 text-rose-400" /></span>}
              {item.isBestSeller && <span title="Best Seller"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /></span>}
              {item.isTodaysSpecial && <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">TODAY&apos;S SPECIAL</span>}
            </div>
            {item.description && <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">{item.description}</p>}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="text-sm font-bold text-[var(--primary-color)]">₹{Number(item.price ?? 0).toFixed(2)}</span>
              <DishRatingBadge menuItemId={item.id} initialRating={item.rating} initialCount={item.totalRatings} size="xs" />
              {item.mealType && <span className="text-[10px] text-[var(--text-muted)]">({item.mealType})</span>}
              {item.calories && <span className="text-[10px] text-[var(--text-muted)]">{item.calories} kcal</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button onClick={onToggleAvail}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
              item.isAvailable ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </button>
          <button onClick={onToggleSpecial}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
              item.isTodaysSpecial ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' : 'bg-[var(--background-color)] border-[var(--border-color)] text-[var(--text-muted)]'
            }`}>
            ★ Special
          </button>
          <button onClick={onEdit}
            className="p-1.5 rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:border-[var(--primary-color)] transition-all">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
