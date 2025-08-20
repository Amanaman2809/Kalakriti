"use client";
import { useEffect, useState, useCallback } from "react";
import { Category } from "@/utils/types";
import { toast } from "react-hot-toast";
import { Plus, Upload, Loader2 } from "lucide-react"; // Import Lucide icons
import Link from "next/link";

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const url = process.env.NEXT_PUBLIC_API_BASE_URL;

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
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
      toast.success("Category deleted");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${url}/api/admin/category/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Category updated");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${url}/api/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
          { method: "POST", body: formData },
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
    [url],
  );

  const createCategory = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (!imageFile) {
      toast.error("Image is required");
      return;
    }

    const imageUrl = await uploadImageToCloudinary(imageFile);
    if (!imageUrl) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${url}/api/admin/categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Creation failed");

      toast.success("Category created successfully");
      setName("");
      setImageFile(null);
      setPreviewImage(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ... (keep your existing updateCategory and deleteCategory functions)

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Categories</h1>
      </div>

      {/* Add Category Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Add New Category
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Image Upload */}
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            <div className="relative group">
              <div
                className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center ${previewImage ? "" : "bg-gray-50"} overflow-hidden`}
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Click to upload image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="w-full md:w-2/3 space-y-4">
            <div>
              <label
                htmlFor="category-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category Name
              </label>
              <input
                id="category-name"
                type="text"
                placeholder="Enter category name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

            <button
              onClick={createCategory}
              disabled={isUploading || !name || !imageFile}
              className={`flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 rounded-md font-medium text-white ${
                isUploading || !name || !imageFile
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-dark"
              } transition-colors`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
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
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-6 text-gray-700">
          Your Categories ({categories.length})
        </h2>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No categories found. Create your first category above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end p-4">
                    <Link
                      href={`/category/${category.id}`}
                      className="text-white font-bold text-lg px-2 py-1 rounded"
                      style={{
                        textShadow: "1px 1px 3px rgba(0, 0, 0, 0.9)",
                      }}
                    >
                      {category.name}
                    </Link>
                  </div>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <button
                    onClick={() =>
                      updateCategory(category.id, {
                        name:
                          prompt("Enter new name:", category.name) ||
                          category.name,
                      })
                    }
                    className="text-sm font-semibold text-primary hover:underline hover:cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="text-sm font-semibold text-red-500 hover:underline hover:cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
