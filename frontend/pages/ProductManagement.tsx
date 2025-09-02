"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Image as ImageIcon,
  ArrowLeft,
  Check,
  Search,
  Eye,
  Package,
  AlertTriangle,
  Loader2,
  Upload,
  RefreshCw,
  Grid3X3,
  List,
  TrendingUp
} from "lucide-react";
import { Product, Category } from "@/utils/types";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryId: string;
  tags: string;
  images: string[];
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    tags: "",
    images: [],
  });

  // Filtered products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);

    try {
      // Validate files
      const invalidFiles = acceptedFiles.filter(file => 
        file.size > 5 * 1024 * 1024 || !file.type.startsWith('image/')
      );
      
      if (invalidFiles.length > 0) {
        toast.error(`${invalidFiles.length} file(s) rejected. Max size: 5MB, Images only.`);
      }

      const validFiles = acceptedFiles.filter(file => 
        file.size <= 5 * 1024 * 1024 && file.type.startsWith('image/')
      );

      if (validFiles.length === 0) return;

      // Get signature from backend
      const signResponse = await fetch(`${API_BASE_URL}/api/cloudinary/sign`);
      if (!signResponse.ok) throw new Error("Failed to get signature");

      const { timestamp, signature, api_key } = await signResponse.json();

      // Upload files
      const uploadPromises = validFiles.map(async (file) => {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("upload_preset", "product_images");
        formDataUpload.append("api_key", api_key);
        formDataUpload.append("timestamp", timestamp);
        formDataUpload.append("signature", signature);

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/kkk-cloudinary523/image/upload`,
          { method: "POST", body: formDataUpload }
        );

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error?.message || "Upload failed");
        }

        return (await uploadResponse.json()).secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success(`${urls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
    disabled: isUploading,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/categories`),
      ]);

      if (!productsRes.ok || !categoriesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData.products || []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      if (categories.length > 0 && !editingId && !formData.categoryId) {
        setFormData(prev => ({
          ...prev,
          categoryId: categories[0].id,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData(true);
    toast.success('Products refreshed');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRemoveImage = async (index: number) => {
    const url = formData.images[index];

    try {
      await fetch(`${API_BASE_URL}/api/cloudinary/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });
    } catch (error) {
      console.error("Failed to remove image from cloudinary:", error);
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      tags: "",
      images: [],
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required");
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error("Valid stock quantity is required");
      return false;
    }
    if (!formData.categoryId) {
      toast.error("Category is required");
      return false;
    }
    if (formData.images.length === 0) {
      toast.error("At least one product image is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No auth token found");
      return;
    }

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
      };

      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      const newProduct = await response.json();
      setProducts(prev => [newProduct, ...prev]);
      resetForm();
      setIsAdding(false);
      toast.success("Product added successfully");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      categoryId: product.categoryId || (categories.length > 0 ? categories[0].id : ""),
      tags: product.tags.join(", "),
      images: product.images,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No auth token found");
      return;
    }

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
      };

      const response = await fetch(`${API_BASE_URL}/api/products/${editingId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }

      const updatedProduct = await response.json();
      setProducts(prev =>
        prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      setEditingId(null);
      resetForm();
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update product");
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to delete products");
      setIsDeleting(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Delete failed (${response.status})`);
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error instanceof Error ? error.message : "Unexpected delete error");
    } finally {
      setIsDeleting(null);
      setDeleteConfirmId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center space-x-4">
          {isAdding || editingId ? (
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                resetForm();
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Products
            </button>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1">Manage your product inventory</p>
            </div>
          )}
        </div>

        {!isAdding && !editingId && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {!isAdding && !editingId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Total Products', 
              value: products.length, 
              icon: Package, 
              color: 'text-blue-600 bg-blue-50',
              change: '+12%'
            },
            { 
              label: 'In Stock', 
              value: products.filter(p => p.stock > 0).length, 
              icon: Check, 
              color: 'text-green-600 bg-green-50',
              change: '+5%'
            },
            { 
              label: 'Low Stock', 
              value: products.filter(p => p.stock > 0 && p.stock <= 10).length, 
              icon: AlertTriangle, 
              color: 'text-yellow-600 bg-yellow-50',
              change: '-3%'
            },
            { 
              label: 'Out of Stock', 
              value: products.filter(p => p.stock === 0).length, 
              icon: X, 
              color: 'text-red-600 bg-red-50',
              change: '-8%'
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">{stat.change}</span>
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
      )}

      {/* Add/Edit Product Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            {editingId ? "Edit Product" : "Add New Product"}
          </h3>
          
          <form onSubmit={editingId ? handleUpdate : handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                    placeholder="Describe your product..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none"
                    required
                  >
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    ) : (
                      <option value="">Loading categories...</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    placeholder="handmade, wooden, artisan"
                  />
                </div>
              </div>

              {/* Right Column - Images */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Images * (Max 5MB each)
                  </label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragActive
                        ? "border-primary bg-primary/10"
                        : "border-gray-300 hover:border-gray-400"
                    } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input {...getInputProps()} />
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 text-primary mb-4 animate-spin" />
                        <p className="text-lg font-medium text-gray-700">Uploading images...</p>
                        <p className="text-sm text-gray-500">Please wait</p>
                      </div>
                    ) : isDragActive ? (
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="h-12 w-12 text-primary mb-4" />
                        <p className="text-lg font-medium text-primary">Drop the files here</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Upload Product Images
                        </p>
                        <p className="text-sm text-gray-500 mb-1">
                          Drag & drop images here, or click to select files
                        </p>
                        <p className="text-xs text-gray-400">
                          Supports JPEG, PNG, WEBP • Max 5MB per image
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                          <Image
                            src={image}
                            alt={`Product ${index + 1}`}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-product.png";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={editingId ? cancelEdit : () => setIsAdding(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-semibold shadow-lg disabled:opacity-70"
                disabled={isUploading}
              >
                {editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      {!isAdding && !editingId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {/* List Header with Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">
                Products ({filteredProducts.length})
              </h2>
              
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors w-64"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* Clear Filters */}
                {(searchTerm || filterCategory) && (
                  <button
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-red-600 px-2 py-1"
                    title="Clear filters"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Products Content */}
          <div className="p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                {products.length === 0 ? (
                  <>
                    <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-600 mb-6">Add your first product to get started</p>
                    <button
                      onClick={() => setIsAdding(true)}
                      className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
                    >
                      Add Product
                    </button>
                  </>
                ) : (
                  <>
                    <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-6">No products match your search criteria</p>
                    <button
                      onClick={clearFilters}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <ProductGridCard
                    key={product.id}
                    product={product}
                    categories={categories}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    deleteConfirmId={deleteConfirmId}
                    isDeleting={isDeleting}
                    onConfirmDelete={handleDelete}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Product', 'Category', 'Price', 'Stock', 'Actions'].map(header => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        categories={categories}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteConfirmId(id)}
                        deleteConfirmId={deleteConfirmId}
                        isDeleting={isDeleting}
                        onConfirmDelete={handleDelete}
                        onCancelDelete={() => setDeleteConfirmId(null)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this product? This will permanently remove it from your inventory.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting === deleteConfirmId}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isDeleting === deleteConfirmId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Product Grid Card Component
const ProductGridCard = ({ 
  product, 
  categories, 
  onEdit, 
  onDelete, 
  deleteConfirmId, 
  isDeleting, 
  onConfirmDelete, 
  onCancelDelete 
}: {
  product: Product;
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  deleteConfirmId: string | null;
  isDeleting: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 group">
    <div className="relative aspect-square bg-gray-100">
      {product.images[0] ? (
        <Image
          src={product.images[0] || '/placeholder-product.png'}
          alt={product.name}
          width={300}
          height={300}
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-16 w-16 text-gray-400" />
        </div>
      )}
      
      {/* Stock Badge */}
      <div className="absolute top-3 left-3">
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          product.stock > 10
            ? "bg-green-100 text-green-800"
            : product.stock > 0
            ? "bg-yellow-100 text-yellow-800"
            : "bg-red-100 text-red-800"
        }`}>
          {product.stock} in stock
        </span>
      </div>
    </div>
    
    <div className="p-4">
      <div className="mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600">
          {categories.find(c => c.id === product.categoryId)?.name || "Uncategorized"}
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary">
          ₹{product.price.toLocaleString()}
        </span>
        
        <div className="flex items-center gap-1">
          {deleteConfirmId === product.id ? (
            <>
              <button
                onClick={() => onConfirmDelete(product.id)}
                disabled={isDeleting === product.id}
                className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Confirm Delete"
              >
                {isDeleting === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={onCancelDelete}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/products/${product.id}`}
                className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="View product"
              >
                <Eye className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onEdit(product)}
                className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Product Table Row Component
const ProductTableRow = ({ 
  product, 
  categories, 
  onEdit, 
  onDelete, 
  deleteConfirmId, 
  isDeleting, 
  onConfirmDelete, 
  onCancelDelete 
}: {
  product: Product;
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  deleteConfirmId: string | null;
  isDeleting: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-12 w-12">
          {product.images[0] ? (
            <div className="relative h-12 w-12 rounded-xl overflow-hidden">
              <Image
                src={product.images[0] || '/placeholder-product.png'}
                alt={product.name}
                width={300}
                height={300}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-gray-200 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="text-sm font-semibold text-gray-900 line-clamp-1">
            {product.name}
          </div>
          <div className="text-sm text-gray-500 line-clamp-1">
            {product.description && product.description.length > 60
              ? `${product.description.slice(0, 60)}...`
              : product.description || 'No description'
            }
          </div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
      {categories.find(c => c.id === product.categoryId)?.name || "Uncategorized"}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
      ₹{product.price.toLocaleString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
        product.stock > 10
          ? "bg-green-100 text-green-800"
          : product.stock > 0
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-800"
      }`}>
        {product.stock} in stock
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      <div className="flex items-center gap-2">
        {deleteConfirmId === product.id ? (
          <>
            <button
              onClick={() => onConfirmDelete(product.id)}
              disabled={isDeleting === product.id}
              className="text-white bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
              title="Confirm Delete"
            >
              {isDeleting === product.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onCancelDelete}
              className="text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Link
              href={`/products/${product.id}`}
              className="text-gray-600 hover:text-primary p-2 rounded-lg hover:bg-primary/10 transition-colors"
              title="View product"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <button
              onClick={() => onEdit(product)}
              className="text-gray-600 hover:text-primary p-2 rounded-lg hover:bg-primary/10 transition-colors"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
);
