"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit, X, Image as ImageIcon, ArrowLeft, Check } from "lucide-react";
import { Product, Category } from "@/utils/types";
import { useDropzone } from "react-dropzone";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
        categoryId: "",
        tags: "",
        images: [] as string[],
    });


    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsUploading(true);

        try {
            // 1. Get signature from backend
            const signResponse = await fetch(`${API_BASE_URL}/api/cloudinary/sign`);
            if (!signResponse.ok) throw new Error("Failed to get signature");

            const { timestamp, signature, api_key, cloud_name } = await signResponse.json();

            // 2. Upload files
            const uploadPromises = acceptedFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'product_images');
                formData.append('api_key', api_key);
                formData.append('timestamp', timestamp);
                formData.append('signature', signature);

                const uploadResponse = await fetch(
                    `https://api.cloudinary.com/v1_1/kkk-cloudinary523/image/upload`,
                    { method: 'POST', body: formData }
                );

                if (!uploadResponse.ok) {
                    const error = await uploadResponse.json();
                    throw new Error(error.error?.message || 'Upload failed');
                }

                return (await uploadResponse.json()).secure_url;
            });

            const urls = await Promise.all(uploadPromises);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));

        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        multiple: true,
        disabled: isUploading
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
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

                if (categories.length > 0 && !editingId) {
                    setFormData(prev => ({
                        ...prev,
                        categoryId: categories[0].id,
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categories, editingId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveImage = async (index: number) => {
        const url = formData.images[index];

        await fetch(`${API_BASE_URL}/api/cloudinary/remove`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: url }),
        });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("No auth token found");
        }

        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                tags: formData.tags.split(",").map(tag => tag.trim()),
            };
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) throw new Error("Failed to add product");

            const newProduct = await response.json();
            setProducts(prev => [newProduct, ...prev]);
            resetForm();
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding product:", error);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            description: product.description,
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
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("No auth token found");
        }
        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                tags: formData.tags.split(",").map(tag => tag.trim()),
            };

            const response = await fetch(`${API_BASE_URL}/api/products/${editingId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) throw new Error("Failed to update product");

            const updatedProduct = await response.json();
            setProducts(prev => prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
            setEditingId(null);
            resetForm();
        } catch (error) {
            console.error("Error updating product:", error);
        }
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("No auth token found");
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (!response.ok) throw new Error("Failed to delete product");

            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
        } finally {
            setIsDeleting(null);
            setDeleteConfirmId(null);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        resetForm();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    {isAdding || editingId ? (
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setEditingId(null);
                                resetForm();
                            }}
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-5 w-5 mr-1" />
                            Back to Products
                        </button>
                    ) : (
                        <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
                    )}
                </div>

                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center space-x-2 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add New Product</span>
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingId ? "Edit Product" : "Add New Product"}
                    </h3>
                    <form onSubmit={editingId ? handleUpdate : handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock
                                        </label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            min="0"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="tag1, tag2, tag3"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Images
                                    </label>
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'
                                            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input {...getInputProps()} />
                                        {isUploading ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-primary mb-2 animate-pulse" />
                                                <p className="text-sm text-gray-600">Uploading...</p>
                                            </div>
                                        ) : isDragActive ? (
                                            <div className="flex flex-col items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-primary mb-2" />
                                                <p className="text-primary">Drop the files here</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-600">
                                                    Drag & drop images here, or click to select files
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Supports JPEG, PNG, WEBP
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {formData.images.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                                                <img
                                                    src={image}
                                                    alt={`Product ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/placeholder-product.png";
                                                    }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={editingId ? cancelEdit : () => setIsAdding(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                                disabled={isUploading}
                            >
                                {editingId ? "Update Product" : "Add Product"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isAdding && !editingId && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                            No products found
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(product => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {product.images[0] ? (
                                                            <img
                                                                className="h-10 w-10 rounded-md object-cover"
                                                                src={product.images[0]}
                                                                alt={product.name}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "/placeholder-product.png";
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                                                <ImageIcon className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 line-clamp-1">
                                                            {(product.description ?? "").length > 80
                                                                ? `${product.description.slice(0, 80)}.....`
                                                                : product.description}

                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.category?.name || "Uncategorized"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ${product.price.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 text-xs rounded-full font-medium ${product.stock > 10
                                                        ? "bg-green-100 text-green-800"
                                                        : product.stock > 0
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {product.stock} in stock
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    {deleteConfirmId === product.id ? (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleDelete(product.id)}
                                                                className="text-white bg-red-600 hover:bg-red-700 p-1 rounded-md"
                                                                title="Confirm Delete"
                                                                disabled={isDeleting === product.id}
                                                            >
                                                                {isDeleting === product.id ? (
                                                                    <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                                                                ) : (
                                                                    <Check className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(null)}
                                                                className="text-gray-600 hover:bg-gray-100 p-1 rounded-md"
                                                                title="Cancel"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirmId(product.id)}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}