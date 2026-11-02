import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  deleteCategory,
  listCategories,
  saveCategory,
  type Category,
} from "@/functions/categories";

/** Add, rename and delete the bilingual news categories. */
export function CategoryManager() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const remove = useMutation({
    mutationFn: (id: number) => deleteCategory({ data: { id } }),
    onSuccess: refresh,
  });

  const rows = query.data ?? [];
  return (
    <div className="grid gap-3">
      {query.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-admin-dim" />
      ) : rows.length === 0 && editing !== "new" ? (
        <p className="text-sm text-admin-dim">
          Chưa có danh mục nào. Gợi ý: Giá thị trường, Mùa vụ, Sản phẩm, Tin công ty.
        </p>
      ) : null}
      <ul className="grid gap-2">
        {rows.map((c) =>
          editing === c.id ? (
            <li key={c.id}>
              <CategoryForm category={c} onDone={() => (setEditing(null), void refresh())} />
            </li>
          ) : (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-admin-line px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-admin-ink">
                  {c.name_vi} <span className="font-normal text-admin-dim">/ {c.name_en}</span>
                </p>
                <p className="text-xs text-admin-dim">
                  /news?category={c.slug} · {c.posts} bài đã đăng
                </p>
              </div>
              <button
                type="button"
                className="admin-icon-btn h-8 w-8"
                aria-label={`Sửa ${c.name_vi}`}
                onClick={() => setEditing(c.id)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="admin-icon-btn h-8 w-8 text-[#b42318]"
                aria-label={`Xóa ${c.name_vi}`}
                onClick={() =>
                  window.confirm(
                    `Xóa danh mục "${c.name_vi}"? Các bài trong danh mục sẽ thành chưa phân loại.`,
                  ) && remove.mutate(c.id)
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ),
        )}
      </ul>
      {editing === "new" ? (
        <CategoryForm onDone={() => (setEditing(null), void refresh())} />
      ) : (
        <button
          type="button"
          className="admin-btn admin-btn-secondary justify-self-start"
          onClick={() => setEditing("new")}
        >
          <Plus className="h-4 w-4" /> Thêm danh mục
        </button>
      )}
    </div>
  );
}

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const [form, setForm] = useState({
    name_vi: category?.name_vi ?? "",
    name_en: category?.name_en ?? "",
  });
  const save = useMutation({
    mutationFn: () => saveCategory({ data: { ...(category ? { id: category.id } : {}), ...form } }),
    onSuccess: onDone,
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.name_vi.trim() && form.name_en.trim()) save.mutate();
  };
  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-lg border border-admin-blue bg-admin-blue-soft/40 p-3 sm:grid-cols-[1fr_1fr_auto]"
    >
      <input
        autoFocus
        className="admin-input"
        placeholder="Tên tiếng Việt"
        aria-label="Tên tiếng Việt"
        value={form.name_vi}
        onChange={(e) => setForm({ ...form, name_vi: e.target.value })}
      />
      <input
        className="admin-input"
        placeholder="English name"
        aria-label="Tên tiếng Anh"
        value={form.name_en}
        onChange={(e) => setForm({ ...form, name_en: e.target.value })}
      />
      <div className="flex gap-1">
        <button
          type="submit"
          className="admin-btn admin-btn-primary px-3"
          disabled={save.isPending}
          aria-label="Lưu danh mục"
        >
          {save.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary px-3"
          onClick={onDone}
          aria-label="Hủy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
