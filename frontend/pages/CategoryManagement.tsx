"use client";
import { useEffect, useState, useCallback } from "react";
import { Category } from "@/utils/types";
import { toast } from "react-hot-toast";
import {
  Plus,
  Upload,
  Loader2,
  Search,
  RefreshCw,
  Grid3X3,
  List,
  X,
  Save,
  AlertTriangle,
  Package,
  Edit2,
  Trash2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface EditingCategory {
  id: string;
  name: string;
  image: string;
  newImageFile?: File;
  previewImage?: string;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const url = process.env.NEXT_PUBLIC_API_BASE_URL;

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Fixed handleImageChange - Properly extract single file from FileList
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0]; // Extract first file from FileList
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    if (isEditing && editingCategory) {
      setEditingCategory({
        ...editingCategory,
        newImageFile: file,
        previewImage: URL.createObjectURL(file)
      });
    } else {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // ✅ Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      if (editingCategory?.previewImage) {
        URL.revokeObjectURL(editingCategory.previewImage);
      }
    };
  }, [previewImage, editingCategory]);

  const fetchCategories = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${url}/api/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleRefresh = () => {
    fetchCategories(true);
    toast.success('Categories refreshed');
  };

  const uploadImageToCloudinary = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const signResponse = await fetch(`${url}/api/cloudinary/sign`);
        if (!signResponse.ok)
          throw new Error("Failed to get Cloudinary signature");

        const { timestamp, signature, api_key } = await signResponse.json();

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "product_images");
        formData.append("api_key", api_key);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/kkk-cloudinary523/image/upload`,
          { method: "POST", body: formData }
        );

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error?.message || "Upload failed");
        }

        const result = await uploadResponse.json();
        return result.secure_url;
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Image upload failed");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [url]
  );

  const createCategory = async () => {
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!imageFile) {
      toast.error("Category image is required");
      return;
    }

    const imageUrl = await uploadImageToCloudinary(imageFile);
    if (!imageUrl) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${url}/api/admin/categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), image: imageUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Creation failed");

      toast.success("Category created successfully");
      setName("");
      setImageFile(null);
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      setPreviewImage(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateCategory = async (category: EditingCategory) => {
    if (!category.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      let imageUrl = category.image;

      if (category.newImageFile) {
        const uploadedUrl = await uploadImageToCloudinary(category.newImageFile);
        if (!uploadedUrl) return;
        imageUrl = uploadedUrl;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${url}/api/admin/category/${category.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: category.name.trim(), image: imageUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      toast.success("Category updated successfully");
      if (editingCategory?.previewImage) {
        URL.revokeObjectURL(editingCategory.previewImage);
      }
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${url}/api/admin/category/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Deletion failed");
      }

      toast.success("Category deleted successfully");
      setShowDeleteModal(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      image: category.image!
    });
  };

  const cancelEditing = () => {
    if (editingCategory?.previewImage) {
      URL.revokeObjectURL(editingCategory.previewImage);
    }
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">Organize your products with categories</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Categories', value: categories.length, icon: Package, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Categories', value: categories.length, icon: Package, color: 'text-green-600 bg-green-50' },
          { label: 'Filtered Results', value: filteredCategories.length, icon: Search, color: 'text-purple-600 bg-purple-50' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Category Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Category</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Category Image
            </label>
            <div className="relative group">
              <div className={`w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 hover:border-primary ${previewImage ? 'border-solid border-gray-200' : 'bg-gray-50'} overflow-hidden`}>
                {previewImage ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={previewImage}
                      alt="Preview"
                      fill
                      className="object-cover rounded-2xl"
                    />
                    <button
                      onClick={() => {
                        if (previewImage) {
                          URL.revokeObjectURL(previewImage);
                        }
                        setPreviewImage(null);
                        setImageFile(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Upload Category Image</p>
                    <p className="text-sm text-gray-500 mb-1">PNG, JPG, WebP up to 5MB</p>
                    <p className="text-xs text-gray-400">Recommended: 400x400px</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label htmlFor="category-name" className="block text-sm font-semibold text-gray-700 mb-3">
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                placeholder="Enter category name (e.g., Electronics, Clothing)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">{name.length}/50 characters</p>
            </div>

            <button
              onClick={createCategory}
              disabled={isUploading || !name.trim() || !imageFile}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-200 ${isUploading || !name.trim() || !imageFile
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 hover:shadow-lg"
                }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Category...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Category
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        {/* List Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              Your Categories ({filteredCategories.length})
            </h2>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors w-64"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Content */}
        <div className="p-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              {categories.length === 0 ? (
                <>
                  <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories yet</h3>
                  <p className="text-gray-600 mb-6">Create your first category to get started organizing your products</p>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 mb-6">No categories match your search term &quot;{searchTerm}&quot;</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Clear search
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={startEditing}
                      onDelete={(id: string) => setShowDeleteModal(id)}
                      isEditing={editingCategory?.id === category.id}
                      editingCategory={editingCategory}
                      onSaveEdit={updateCategory}
                      onCancelEdit={cancelEditing}
                      onImageChange={handleImageChange}
                      onEditChange={setEditingCategory}
                      isUploading={isUploading}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCategories.map((category) => (
                    <CategoryListItem
                      key={category.id}
                      category={category}
                      onEdit={startEditing}
                      onDelete={(id: string) => setShowDeleteModal(id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this category? All products in this category will be uncategorized.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCategory(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Category Card Component
const CategoryCard = ({
  category,
  onEdit,
  onDelete,
  isEditing,
  editingCategory,
  onSaveEdit,
  onCancelEdit,
  onImageChange,
  onEditChange,
  isUploading
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  editingCategory: EditingCategory | null;
  onSaveEdit: (category: EditingCategory) => void;
  onCancelEdit: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => void;
  onEditChange: (category: EditingCategory) => void;
  isUploading: boolean;
}) => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 group">
    <div className="relative aspect-square bg-gray-100">
      {isEditing && editingCategory ? (
        <div className="relative w-full h-full">
          <Image
            src={editingCategory.previewImage || editingCategory.image}
            alt={editingCategory.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <label className="cursor-pointer bg-white text-primary px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4 inline mr-2" />
              Change Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onImageChange(e, true)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      ) : (
        <Image
            src={category.image || "/placeholder.png"}
          alt={category.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
        />
      )}
    </div>

    <div className="p-4">
      {isEditing && editingCategory ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editingCategory.name}
            onChange={(e) => onEditChange({ ...editingCategory, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            placeholder="Category name"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onSaveEdit(editingCategory)}
              disabled={isUploading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          <div className="flex items-center justify-between">
            <Link
              href={`/category/${category.id}`}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View Products
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(category)}
                className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Edit category"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(category.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

// ✅ Category List Item Component
const CategoryListItem = ({
  category,
  onEdit,
  onDelete
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) => (
  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl hover:shadow-md transition-all duration-200">
    <div className="w-16 h-16 relative">
      <Image
        src={category.image!}
        alt={category.name}
        fill
        className="object-cover rounded-xl"
      />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900">{category.name}</h3>
      <p className="text-sm text-gray-600">Category ID: {category.id.slice(0, 8)}</p>
    </div>
    <div className="flex items-center gap-2">
      <Link
        href={`/category/${category.id}`}
        className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
      >
        <Eye className="w-4 h-4" />
        View
      </Link>
      <button
        onClick={() => onEdit(category)}
        className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
      >
        <Edit2 className="w-4 h-4" />
        Edit
      </button>
      <button
        onClick={() => onDelete(category.id)}
        className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  </div>
);
