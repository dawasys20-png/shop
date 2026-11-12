"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "../lib/api";
import { formatPrice } from "../lib/currency";
import {
  orderStatusLabels,
  orderStatuses,
  type Order,
  type OrderStatus,
} from "../lib/orders";
import {
  getProductVariants,
  getVariantImages,
  getStartingPrice,
  getStartingVariant,
  type Product,
  type ProductVariant,
} from "../lib/products";
import { useCart } from "./cart-context";
import { useCatalog } from "./catalog-context";

type AdminTab = "overview" | "products" | "orders";

type ProductDraft = Pick<Product, "id" | "name" | "brand" | "category"> & {
  variants: ProductVariant[];
};

type OrderLineDraft = {
  key: string;
  productId: string;
  variantId: string;
  quantity: number;
};

/* ------------------------------------------------------------------ */
/* Shared styles                                                       */
/* ------------------------------------------------------------------ */

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#355342]";

const fieldLabel = "grid min-w-0 gap-2 text-[13px] font-semibold text-[#233b30]";

const inputClass =
  "min-h-11 w-full min-w-0 rounded-xl border border-[#dfe4d8] bg-white px-3.5 py-2.5 text-sm font-normal text-[#233b30] outline-none transition-[border-color,box-shadow] placeholder:text-[#9aa297] focus:border-[#64806a] focus:shadow-[0_0_0_3px_rgba(100,128,106,0.15)]";

const textareaClass = `${inputClass} min-h-[88px] resize-y py-3 leading-6`;

const primaryButton = `inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#355342] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#233b30] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const secondaryButton = `inline-flex min-h-10 items-center justify-center rounded-full border border-[#dfe4d8] bg-white px-4 text-[13px] font-medium text-[#355342] transition-colors hover:border-[#9db0a0] hover:bg-[#f3f5ef] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const dangerButton = `inline-flex min-h-10 items-center justify-center rounded-full border border-[#efd5d1] bg-white px-4 text-[13px] font-medium text-[#a13832] transition-colors hover:border-[#dba9a3] hover:bg-[#fff7f6] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

const linkButton = `w-fit border-0 bg-transparent p-0 text-[13px] font-semibold text-[#355342] underline-offset-4 hover:underline ${focusRing}`;

const editorCard =
  "mb-8 mt-2 grid gap-6 rounded-3xl border border-[#e3e7dd] bg-[#fafaf8] p-[clamp(20px,4vw,34px)] max-[480px]:p-5";

const tableWrap =
  "w-full overflow-x-auto rounded-2xl border border-[#e3e7dd] bg-white";

const th = "bg-[#f6f8f3] px-5 py-3.5 text-left text-xs font-medium text-[#6f7a70]";
const td = "border-t border-[#eef0ea] px-5 py-4 align-middle text-[13px] text-[#4d5a50]";

const noticeTone = {
  info: "border-[#ecdcae] bg-[#fbf7ea] text-[#5c5130]",
  success: "border-[#d5e0d6] bg-[#edf1eb] text-[#2e5b3e]",
  error: "border-[#f0d3cf] bg-[#fbefed] text-[#9a443e]",
} as const;

const statusTone: Record<string, string> = {
  received: "bg-[#edf1eb] text-[#355342]",
  processing: "bg-[#fbf3dc] text-[#7a5d12]",
  shipped: "bg-[#e6f1f0] text-[#2f615b]",
  complete: "bg-[#dff0e3] text-[#2e6a43]",
  cancelled: "bg-[#fbefed] text-[#9a443e]",
};

function Notice({
  tone,
  role,
  children,
}: {
  tone: keyof typeof noticeTone;
  role?: "alert" | "status";
  children: ReactNode;
}) {
  return (
    <p
      className={`m-0 mb-4 rounded-2xl border px-5 py-4 text-[13px] leading-6 ${noticeTone[tone]}`}
      role={role}
    >
      {children}
    </p>
  );
}

function StatusPill({ status }: { status: OrderStatus | undefined }) {
  const value = status ?? "received";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        statusTone[value] ?? "bg-[#edf1eb] text-[#355342]"
      }`}
    >
      {orderStatusLabels[value]}
    </span>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`${fieldLabel} ${full ? "col-span-full" : ""}`}>
      {label}
      {children}
    </label>
  );
}

function EditorHeading({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="m-0 text-[clamp(24px,3vw,30px)] font-medium tracking-[-0.02em] text-[#233b30]">
        {title}
      </h2>
      {meta && <span className="text-xs text-[#858b81]">{meta}</span>}
    </div>
  );
}

function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h2 className="m-0 text-[clamp(24px,3vw,30px)] font-medium tracking-[-0.02em] text-[#233b30]">
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createOrderLine(productId: string, variantId = ""): OrderLineDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    productId,
    variantId,
    quantity: 1,
  };
}

function formatOrderDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-UG", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

/* ------------------------------------------------------------------ */
/* Product editor                                                      */
/* ------------------------------------------------------------------ */

function ProductEditor({
  products,
  product,
  onSave,
  onCancel,
}: {
  products: Product[];
  product?: Product;
  onSave: (value: Product) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ProductDraft>(() =>
    product
      ? {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          variants: getProductVariants(product),
        }
      : {
          id: "",
          name: "",
          brand: "Form & Function",
          category: "",
          variants: [{
            id: "option-1",
            form: "",
            potency: "Not specified",
            packageQuantity: "",
            portionSize: "",
            totalServings: "",
            price: 0,
            detail: "",
            rating: null,
            tag: "",
            type: "",
            images: [],
            alt: "",
            description: "",
            benefits: [],
            ingredients: "",
            howToUse: "",
            warnings: "",
            supplementInformation: "",
            tone: "",
            specifications: [],
          }],
        },
  );
  const [error, setError] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  function update<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateVariant<K extends keyof ProductVariant>(
    index: number,
    field: K,
    value: ProductVariant[K],
  ) {
    setDraft((current) => ({
      ...current,
      variants: (current.variants ?? []).map((variant, variantIndex) =>
        variantIndex === index
          ? { ...variant, [field]: value }
          : variant,
      ),
    }));
  }

  function addVariant(form = "") {
    setDraft((current) => ({
      ...current,
      variants: [
        ...(current.variants ?? []),
        {
          id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          form,
          potency: "Not specified",
          packageQuantity: "",
          portionSize: "",
          totalServings: "",
          bestBefore: "",
          price: 0,
          detail: "",
          rating: null,
          tag: "",
          type: "",
          images: [],
          alt: "",
          description: "",
          benefits: [],
          ingredients: "",
          howToUse: "",
          warnings: "",
          supplementInformation: "",
          tone: "",
          specifications: [],
        },
      ],
    }));
  }

  async function sendImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const { images } = await apiRequest<{
      images: NonNullable<ProductVariant["images"]>;
    }>(
      "/uploads/images",
      { method: "POST", body: formData },
    );
    return images;
  }

  async function uploadVariantImages(variantId: string, files: FileList | null) {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    const variant = (draft.variants ?? []).find((item) => item.id === variantId);
    if (!variant) return;
    if (selectedFiles.some((file) => file.size > 8 * 1024 * 1024)) {
      setError("Each image must be 8 MB or smaller.");
      return;
    }
    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      setError("Choose image files only.");
      return;
    }
    if ((variant.images?.length ?? 0) + selectedFiles.length > 12) {
      setError("A purchase option can have up to 12 images.");
      return;
    }

    setError(null);
    setIsUploadingImages(true);
    try {
      const images = await sendImages(selectedFiles);
      setDraft((current) => ({
        ...current,
        variants: (current.variants ?? []).map((item) =>
          item.id === variantId
            ? { ...item, images: [...(item.images ?? []), ...images] }
            : item,
        ),
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Images could not be uploaded.",
      );
    } finally {
      setIsUploadingImages(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploadingImages) {
      setError("Wait for image uploads to finish before saving.");
      return;
    }
    const id = product?.id ?? slugify(draft.name);
    if (!id) {
      setError("Enter a product name that can be used to create its product link.");
      return;
    }
    if (!product && products.some((item) => item.id === id)) {
      setError("A product with this name already exists. Choose a different name.");
      return;
    }

    const variants = (draft.variants ?? []).map((variant) => ({
      ...variant,
      form: variant.form.trim(),
      potency: variant.potency.trim(),
      packageQuantity: variant.packageQuantity.trim(),
      portionSize: variant.portionSize?.trim() || undefined,
      totalServings: variant.totalServings?.trim() || undefined,
      bestBefore: variant.bestBefore?.trim() || undefined,
      detail: variant.detail?.trim() || undefined,
      tag: variant.tag?.trim() || undefined,
      type: variant.type?.trim() || undefined,
      alt: variant.alt?.trim() || undefined,
      description: variant.description?.trim() || undefined,
      benefits: variant.benefits?.map((benefit) => benefit.trim()).filter(Boolean) ?? [],
      ingredients: variant.ingredients?.trim() || undefined,
      howToUse: variant.howToUse?.trim() || undefined,
      warnings: variant.warnings?.trim() || undefined,
      supplementInformation: variant.supplementInformation?.trim() || undefined,
      tone: variant.tone?.trim() || undefined,
      specifications: (variant.specifications ?? [])
        .map(({ key, value }) => ({ key: key.trim(), value: value.trim() }))
        .filter(({ key, value }) => key || value),
    }));
    if (
      variants.length === 0 ||
      variants.some(
        ({ form, potency, packageQuantity, price }) =>
          !form ||
          !potency ||
          !packageQuantity ||
          !Number.isFinite(price) ||
          price < 0,
      )
    ) {
      setError("Add at least one complete purchase option with a valid price.");
      return;
    }
    if (new Set(variants.map(({ id: variantId }) => variantId)).size !== variants.length) {
      setError("Each purchase option must have a unique ID.");
      return;
    }
    if (variants.some(({ images: variantImages }) => !variantImages?.length)) {
      setError("Upload at least one image for every purchase option.");
      return;
    }
    if (
      variants.some(({ specifications }) =>
        (specifications ?? []).some(({ key, value }) => !key || !value),
      )
    ) {
      setError("Complete both the name and value for each specification.");
      return;
    }
    if (
      variants.some(
        ({ specifications }) =>
          (specifications?.length ?? 0) > 30 ||
          new Set(
            (specifications ?? []).map(({ key }) => key.toLowerCase()),
          ).size !== (specifications?.length ?? 0),
      )
    ) {
      setError("Each option can have up to 30 specifications with unique names.");
      return;
    }

    try {
      await onSave({
        id,
        name: draft.name.trim(),
        brand: draft.brand.trim(),
        category: draft.category,
        variants,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The product could not be saved.",
      );
    }
  }

  const variantList = draft.variants ?? [];
  const variantGroups = variantList.reduce<
    { key: string; form: string; options: { variant: ProductVariant; index: number }[] }[]
  >((groups, variant, index) => {
    const form = variant.form.trim();
    const key = form ? `form:${form.toLowerCase()}` : `unassigned:${variant.id}`;
    let group = groups.find((candidate) => candidate.key === key);
    if (!group) {
      group = { key, form: variant.form, options: [] };
      groups.push(group);
    }
    group.options.push({ variant, index });
    return groups;
  }, []);

  return (
    <form className={editorCard} onSubmit={submit}>
      <EditorHeading
        title={product ? "Edit product" : "Add a product"}
        meta={product ? `/${product.id}` : undefined}
      />

      <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <Field label="Product name">
          <input
            className={inputClass}
            required
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </Field>
        <Field label="Category">
          <input
            className={inputClass}
            value={draft.category}
            onChange={(event) => update("category", event.target.value)}
            required
            maxLength={100}
            placeholder="Enter a category"
          />
        </Field>
        <Field label="Brand">
          <input
            className={inputClass}
            required
            value={draft.brand}
            onChange={(event) => update("brand", event.target.value)}
          />
        </Field>
      </div>

      <section className="border-t border-[#e3e7dd] pt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="m-0 text-lg font-medium text-[#233b30]">
              Product forms and combinations
            </h3>
            <p className="mb-0 mt-1 text-[13px] text-[#6f7a70]">
              Group combinations by product form. Each potency and package combination keeps its own price and details.
            </p>
          </div>
          <button
            className={secondaryButton}
            type="button"
            onClick={() => addVariant()}
          >
            Add product form
          </button>
        </div>

        <div className="grid gap-4">
          {variantGroups.map((group) => (
            <section
              className="grid gap-4 rounded-2xl border border-[#d6dfd3] bg-[#f7f8f4] p-4"
              key={group.key}
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Field label="Product form">
                  <input
                    className={inputClass}
                    required
                    value={group.form}
                    onChange={(event) => {
                      const optionIds = new Set(
                        group.options.map(({ variant }) => variant.id),
                      );
                      setDraft((current) => ({
                        ...current,
                        variants: (current.variants ?? []).map((variant) =>
                          optionIds.has(variant.id)
                            ? { ...variant, form: event.target.value }
                            : variant,
                        ),
                      }));
                    }}
                    placeholder="e.g. Capsules"
                  />
                </Field>
                <button
                  className={secondaryButton}
                  type="button"
                  onClick={() => addVariant(group.form)}
                >
                  Add potency / package combination
                </button>
              </div>
              <div className="grid gap-4">
          {group.options.map(({ variant, index }, combinationIndex) => (
            <fieldset
              className="m-0 grid grid-cols-4 gap-4 rounded-2xl border border-[#e3e7dd] bg-white p-5 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1"
              key={variant.id}
            >
              <legend className="px-2 text-[13px] font-semibold text-[#355342]">
                Combination {combinationIndex + 1}
              </legend>
              <Field label="Potency">
                <input
                  className={inputClass}
                  required
                  value={variant.potency}
                  onChange={(event) => updateVariant(index, "potency", event.target.value)}
                  placeholder="Label value or Not specified"
                />
              </Field>
              <Field label="Package quantity">
                <input
                  className={inputClass}
                  required
                  value={variant.packageQuantity}
                  onChange={(event) =>
                    updateVariant(index, "packageQuantity", event.target.value)
                  }
                  placeholder="e.g. 60 capsules"
                />
              </Field>
              <Field label="Portion size">
                <input
                  className={inputClass}
                  maxLength={100}
                  value={variant.portionSize ?? ""}
                  onChange={(event) =>
                    updateVariant(index, "portionSize", event.target.value)
                  }
                  placeholder="e.g. 2 capsules"
                />
              </Field>
              <Field label="Total servings">
                <input
                  className={inputClass}
                  maxLength={100}
                  value={variant.totalServings ?? ""}
                  onChange={(event) =>
                    updateVariant(index, "totalServings", event.target.value)
                  }
                  placeholder="e.g. 30 servings"
                />
              </Field>
              <Field label="Best before / expiry date">
                <input
                  className={inputClass}
                  type="date"
                  value={variant.bestBefore ?? ""}
                  onChange={(event) =>
                    updateVariant(index, "bestBefore", event.target.value || undefined)
                  }
                />
              </Field>
              <Field label="Price (UGX)">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={variant.price}
                  onChange={(event) =>
                    updateVariant(index, "price", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="Product type">
                <input
                  className={inputClass}
                  value={variant.type ?? ""}
                  onChange={(event) => updateVariant(index, "type", event.target.value)}
                />
              </Field>
              <Field label="Product badge">
                <input
                  className={inputClass}
                  value={variant.tag ?? ""}
                  onChange={(event) => updateVariant(index, "tag", event.target.value)}
                  placeholder="Optional, e.g. Best seller"
                />
              </Field>
              <Field label="Image tone class">
                <input
                  className={inputClass}
                  value={variant.tone ?? ""}
                  onChange={(event) => updateVariant(index, "tone", event.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Demo rating (0–5)">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={variant.rating ?? ""}
                  onChange={(event) =>
                    updateVariant(
                      index,
                      "rating",
                      event.target.value === "" ? null : Number(event.target.value),
                    )
                  }
                />
              </Field>
              <Field label="Short details" full>
                <input
                  className={inputClass}
                  value={variant.detail ?? ""}
                  onChange={(event) => updateVariant(index, "detail", event.target.value)}
                  placeholder="Optional card subtitle"
                />
              </Field>
              <Field label="Description" full>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={variant.description ?? ""}
                  onChange={(event) =>
                    updateVariant(index, "description", event.target.value)
                  }
                />
              </Field>
              <Field label="Benefits (one per line)" full>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={(variant.benefits ?? []).join("\n")}
                  onChange={(event) =>
                    updateVariant(
                      index,
                      "benefits",
                      event.target.value.split("\n").map((benefit) => benefit.trim()).filter(Boolean),
                    )
                  }
                />
              </Field>
              <Field label="Ingredients" full>
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={variant.ingredients ?? ""}
                  onChange={(event) =>
                    updateVariant(index, "ingredients", event.target.value)
                  }
                />
              </Field>
              <Field label="How to use" full>
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={variant.howToUse ?? ""}
                  onChange={(event) =>
                    updateVariant(index, "howToUse", event.target.value)
                  }
                />
              </Field>
              <Field label="Warnings" full>
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={variant.warnings ?? ""}
                  onChange={(event) =>
                    updateVariant(index, "warnings", event.target.value)
                  }
                />
              </Field>
              <Field label="Supplement information" full>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={variant.supplementInformation ?? ""}
                  onChange={(event) =>
                    updateVariant(index, "supplementInformation", event.target.value)
                  }
                />
              </Field>
              <Field label="Image description" full>
                <input
                  className={inputClass}
                  value={variant.alt ?? ""}
                  onChange={(event) => updateVariant(index, "alt", event.target.value)}
                />
              </Field>
              <div className="col-span-full grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="m-0 text-sm font-semibold text-[#233b30]">
                      Specifications for this option
                    </h4>
                    <p className="mb-0 mt-1 text-xs font-normal text-[#858b81]">
                      Add custom name/value facts shown on this variant only.
                    </p>
                  </div>
                  <button
                    className={secondaryButton}
                    type="button"
                    disabled={(variant.specifications?.length ?? 0) >= 30}
                    onClick={() =>
                      updateVariant(index, "specifications", [
                        ...(variant.specifications ?? []),
                        { key: "", value: "" },
                      ])
                    }
                  >
                    Add specification
                  </button>
                </div>
                {(variant.specifications ?? []).map((specification, specificationIndex) => (
                  <div
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] items-end gap-3 max-[600px]:grid-cols-1"
                    key={`${variant.id}-spec-${specificationIndex}`}
                  >
                    <Field label="Name">
                      <input
                        className={inputClass}
                        maxLength={100}
                        value={specification.key}
                        onChange={(event) =>
                          updateVariant(index, "specifications", (variant.specifications ?? []).map(
                            (item, itemIndex) =>
                              itemIndex === specificationIndex
                                ? { ...item, key: event.target.value }
                                : item,
                          ))
                        }
                        placeholder="e.g. Serving size"
                      />
                    </Field>
                    <Field label="Value">
                      <input
                        className={inputClass}
                        maxLength={1000}
                        value={specification.value}
                        onChange={(event) =>
                          updateVariant(index, "specifications", (variant.specifications ?? []).map(
                            (item, itemIndex) =>
                              itemIndex === specificationIndex
                                ? { ...item, value: event.target.value }
                                : item,
                          ))
                        }
                        placeholder="e.g. 2 capsules"
                      />
                    </Field>
                    <button
                      className={dangerButton}
                      type="button"
                      onClick={() =>
                        updateVariant(
                          index,
                          "specifications",
                          (variant.specifications ?? []).filter(
                            (_, itemIndex) => itemIndex !== specificationIndex,
                          ),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                    </div>
              <div className={`${fieldLabel} col-span-full`}>
                <span>Images for this option (up to 12)</span>
                <input
                  className={inputClass}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  aria-label={`Upload images for option ${index + 1}`}
                  multiple
                  disabled={isUploadingImages || (variant.images?.length ?? 0) >= 12}
                  onChange={(event) => {
                    void uploadVariantImages(variant.id, event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
                <span className="text-xs font-normal text-[#858b81]">
                  These images are shown when this form, potency, and package are selected.
                </span>
                {!!variant.images?.length && (
                  <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-5">
                    {variant.images.map((image, imageIndex) => (
                      <li
                        className="relative overflow-hidden rounded-xl border border-[#dfe4d8]"
                        key={image.publicId ?? image.url}
                      >
                        <Image
                          className="h-24 w-full object-cover"
                          src={image.url}
                          alt={`${variant.form || "Option"} image ${imageIndex + 1}`}
                          width={180}
                          height={96}
                          unoptimized
                        />
                        {imageIndex === 0 && (
                          <span className="absolute left-1 top-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-medium text-[#355342]">
                            Main
                          </span>
                        )}
                        <button
                          className="absolute right-1 top-1 rounded-full bg-white px-2 py-1 text-[10px] font-medium text-[#9a443e] shadow"
                          type="button"
                          onClick={() =>
                            updateVariant(
                              index,
                              "images",
                              variant.images?.filter((item) => item.url !== image.url) ?? [],
                            )
                          }
                          aria-label={`Remove option image ${imageIndex + 1}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="col-span-full flex items-center justify-between gap-3 max-[480px]:flex-wrap">
                <span className="text-xs text-[#858b81]">Option ID: {variant.id}</span>
                <button
                  className={dangerButton}
                  type="button"
                  disabled={variantList.length === 1}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      variants: (current.variants ?? []).filter(
                        (_, variantIndex) => variantIndex !== index,
                      ),
                    }))
                  }
                >
                  Remove option
                </button>
              </div>
            </fieldset>
          ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {error && <Notice tone="error" role="alert">{error}</Notice>}

      <div className="flex flex-wrap items-center gap-3">
        <button className={primaryButton} type="submit">
          {product ? "Save product" : "Add product"}
        </button>
        <button className={secondaryButton} type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Order editor                                                        */
/* ------------------------------------------------------------------ */

function OrderEditor({
  order,
  products,
  onSave,
  onCancel,
}: {
  order: Order | null;
  products: Product[];
  onSave: (value: Order) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [contact, setContact] = useState(
    order?.contact ?? { name: "", email: "", phone: "", address: "", city: "" },
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "received");
  const [lines, setLines] = useState<OrderLineDraft[]>(() =>
    order?.items.length
      ? order.items.map((item) => {
          const itemProduct = products.find(({ id }) => id === item.id);
          return createOrderLine(
            item.id,
            item.variantId ?? (itemProduct ? getStartingVariant(itemProduct).id : ""),
          );
        })
      : [createOrderLine(
          products[0]?.id ?? "",
          products[0] ? getStartingVariant(products[0]).id : "",
        )],
  );
  const [error, setError] = useState<string | null>(null);

  function updateContact(field: keyof typeof contact, value: string) {
    setContact((current) => ({ ...current, [field]: value }));
  }

  function updateProductLine(key: string, productId: string) {
    const product = products.find(({ id }) => id === productId);
    setLines((current) =>
      current.map((line) =>
        line.key === key
          ? {
              ...line,
              productId,
              variantId: product ? getStartingVariant(product).id : "",
            }
          : line,
      ),
    );
  }

  function updateLine(key: string, field: "variantId" | "quantity", value: string) {
    setLines((current) =>
      current.map((line) =>
        line.key === key
          ? {
              ...line,
              [field]: field === "quantity" ? Number(value) : value,
            }
          : line,
      ),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const items = lines.map((line) => {
        const product = products.find(({ id }) => id === line.productId);
        if (!product) {
          throw new Error("Choose an available product for every order line.");
        }
        const variant = getProductVariants(product).find(
          ({ id }) => id === line.variantId,
        );
        if (!variant) {
          throw new Error("Choose an available purchase option for every order line.");
        }
        if (!Number.isInteger(line.quantity) || line.quantity < 1) {
          throw new Error("Each order quantity must be a whole number above zero.");
        }
        return {
          id: product.id,
          name: product.name,
          detail: variant.detail ?? "",
          image: getVariantImages(product, variant)[0]?.url ?? "",
          images: getVariantImages(product, variant),
          alt: variant.alt ?? "",
          price: variant.price,
          quantity: line.quantity,
          variantId: variant.id,
          variantForm: variant.form,
          variantPotency: variant.potency,
          variantPackageQuantity: variant.packageQuantity,
        };
      });
      if (items.length === 0) throw new Error("Add at least one product to the order.");

      const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
      const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 5;
      await onSave({
        id:
          order?.id ??
          `FF-ADMIN-${Date.now().toString(36).toUpperCase()}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`,
        createdAt: order?.createdAt ?? new Date().toISOString(),
        status,
        contact,
        items,
        subtotal,
        shipping,
        total: subtotal + shipping,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "The order could not be saved.",
      );
    }
  }

  const subtotal = lines.reduce((total, line) => {
    const product = products.find(({ id }) => id === line.productId);
    const variant = product
      ? getProductVariants(product).find(({ id }) => id === line.variantId)
      : undefined;
    return total + (variant?.price ?? 0) * (line.quantity || 0);
  }, 0);

  return (
    <form className={editorCard} onSubmit={submit}>
      <EditorHeading
        title={order ? `Edit ${order.id}` : "Add an order"}
        meta={order ? formatOrderDate(order.createdAt) : undefined}
      />

      <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
        <Field label="Customer name">
          <input
            className={inputClass}
            required
            autoComplete="name"
            value={contact.name}
            onChange={(event) => updateContact("name", event.target.value)}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            required
            autoComplete="email"
            value={contact.email}
            onChange={(event) => updateContact("email", event.target.value)}
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputClass}
            required
            autoComplete="tel"
            value={contact.phone}
            onChange={(event) => updateContact("phone", event.target.value)}
          />
        </Field>
        <Field label="City">
          <input
            className={inputClass}
            required
            autoComplete="address-level2"
            value={contact.city}
            onChange={(event) => updateContact("city", event.target.value)}
          />
        </Field>
        <Field label="Delivery address" full>
          <input
            className={inputClass}
            required
            autoComplete="street-address"
            value={contact.address}
            onChange={(event) => updateContact("address", event.target.value)}
          />
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
          >
            {orderStatuses.map((value) => (
              <option key={value} value={value}>{orderStatusLabels[value]}</option>
            ))}
          </select>
        </Field>
      </div>

      <section className="border-t border-[#e3e7dd] pt-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="m-0 text-lg font-medium text-[#233b30]">Order items</h3>
          <button
            className={secondaryButton}
            type="button"
            disabled={products.length === 0}
            onClick={() =>
              setLines((current) => [
                ...current,
                createOrderLine(
                  products[0]?.id ?? "",
                  products[0] ? getStartingVariant(products[0]).id : "",
                ),
              ])
            }
          >
            Add item
          </button>
        </div>

        <div className="grid gap-4">
          {lines.map((line) => {
            const selectedProduct = products.find(({ id }) => id === line.productId);
            const purchaseOptions = selectedProduct
              ? getProductVariants(selectedProduct)
              : [];
            return (
              <div
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_110px_auto] items-end gap-4 rounded-2xl border border-[#e3e7dd] bg-white p-4 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1"
                key={line.key}
              >
                <Field label="Product">
                  <select
                    className={inputClass}
                    required
                    value={line.productId}
                    onChange={(event) => updateProductLine(line.key, event.target.value)}
                  >
                    <option value="">Select a product</option>
                    {line.productId && !products.some(({ id }) => id === line.productId) && (
                      <option value={line.productId}>Unavailable product — replace it</option>
                    )}
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {formatPrice(getStartingPrice(product))}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Purchase option">
                  <select
                    className={inputClass}
                    required
                    value={line.variantId}
                    onChange={(event) => updateLine(line.key, "variantId", event.target.value)}
                  >
                    {purchaseOptions.map((variant) => (
                      <option value={variant.id} key={variant.id}>
                        {variant.form} · {variant.potency} · {variant.packageQuantity} · {formatPrice(variant.price)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Quantity">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={line.quantity}
                    onChange={(event) => updateLine(line.key, "quantity", event.target.value)}
                  />
                </Field>
                <button
                  className={`${dangerButton} max-[900px]:col-span-full max-[900px]:justify-self-start`}
                  type="button"
                  aria-label="Remove item"
                  disabled={lines.length === 1}
                  onClick={() =>
                    setLines((current) => current.filter(({ key }) => key !== line.key))
                  }
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <p className="mb-1 mt-6 flex justify-between border-t border-[#e3e7dd] pt-4 text-sm text-[#6f7a70]">
          Estimated subtotal
          <strong className="text-base text-[#233b30]">{formatPrice(subtotal)}</strong>
        </p>
        <p className="mb-0 mt-2 text-xs leading-5 text-[#858b81]">
          Line item details use the current catalog price. Delivery is recalculated when saved.
        </p>
      </section>

      {error && <Notice tone="error" role="alert">{error}</Notice>}

      <div className="flex flex-wrap items-center gap-3">
        <button className={primaryButton} type="submit" disabled={products.length === 0}>
          {order ? "Save order" : "Create order"}
        </button>
        <button className={secondaryButton} type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  footer,
}: {
  label: string;
  value: string | number;
  footer: ReactNode;
}) {
  return (
    <article className="grid min-h-[150px] min-w-0 content-between gap-4 rounded-3xl border border-[#e3e7dd] bg-white p-6 max-[600px]:min-h-[130px] max-[600px]:p-5">
      <div>
        <p className="m-0 text-[13px] text-[#6f7a70]">{label}</p>
        <p className="mb-0 mt-2 text-[clamp(28px,3vw,38px)] font-semibold leading-none tracking-tight text-[#233b30]">
          {value}
        </p>
      </div>
      <div className="text-xs text-[#858b81]">{footer}</div>
    </article>
  );
}

function AdminOverview({
  products,
  orders,
  onSelect,
}: {
  products: Product[];
  orders: Order[];
  onSelect: (tab: AdminTab) => void;
}) {
  const activeOrders = orders.filter(
    ({ status }) => status === "received" || status === "processing",
  ).length;
  const demoOrderValue = orders.reduce((total, order) => total + order.total, 0);

  return (
    <section role="tabpanel">
      <div className="mb-6 grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
        <MetricCard
          label="Products"
          value={products.length}
          footer={
            <button className={linkButton} type="button" onClick={() => onSelect("products")}>
              Manage catalog →
            </button>
          }
        />
        <MetricCard
          label="Orders"
          value={orders.length}
          footer={
            <button className={linkButton} type="button" onClick={() => onSelect("orders")}>
              View all orders →
            </button>
          }
        />
        <MetricCard
          label="Needs attention"
          value={activeOrders}
          footer="Received or processing"
        />
        <MetricCard
          label="Order value"
          value={formatPrice(demoOrderValue)}
          footer="No payment processor connected"
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(250px,0.8fr)] gap-4 max-[900px]:grid-cols-1">
        <section className="min-w-0 rounded-3xl border border-[#e3e7dd] bg-white p-6 max-[600px]:p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="m-0 text-xl font-medium tracking-[-0.01em] text-[#233b30]">
              Recent orders
            </h2>
            <button className={linkButton} type="button" onClick={() => onSelect("orders")}>
              All orders →
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="m-0 rounded-2xl bg-[#f3f5ef] px-5 py-8 text-center text-sm text-[#6f7a70]">
              New orders will appear here.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {orders.slice(0, 5).map((order) => (
                <li
                  className="flex items-center justify-between gap-4 border-t border-[#eef0ea] py-4 first:border-t-0 first:pt-1 max-[600px]:items-start"
                  key={order.id}
                >
                  <div className="grid min-w-0 gap-1">
                    <strong className="text-[13px] font-semibold text-[#233b30]">
                      {order.contact.name || "Unnamed customer"}
                    </strong>
                    <span className="truncate text-xs text-[#858b81]">
                      {order.id} · {formatOrderDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="grid shrink-0 justify-items-end gap-1.5">
                    <strong className="text-[13px] font-semibold text-[#233b30]">
                      {formatPrice(order.total)}
                    </strong>
                    <StatusPill status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-3 rounded-3xl bg-[#f3f5ef] p-6 max-[600px]:p-5">
          <h2 className="m-0 mb-2 text-xl font-medium tracking-[-0.01em] text-[#233b30]">
            What would you like to do?
          </h2>
          <button
            className={`flex min-h-12 items-center justify-between rounded-full bg-white px-5 text-sm font-medium text-[#233b30] transition-colors hover:bg-[#edf1eb] ${focusRing}`}
            type="button"
            onClick={() => onSelect("products")}
          >
            Manage products <span aria-hidden="true">→</span>
          </button>
          <button
            className={`flex min-h-12 items-center justify-between rounded-full bg-white px-5 text-sm font-medium text-[#233b30] transition-colors hover:bg-[#edf1eb] ${focusRing}`}
            type="button"
            onClick={() => onSelect("orders")}
          >
            Update order statuses <span aria-hidden="true">→</span>
          </button>
        </aside>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export function AdminDashboard() {
  const {
    products,
    ready: productsReady,
    loadError,
    saveProduct,
    deleteProduct,
  } = useCatalog();
  const {
    orders,
    ordersReady,
    saveOrder,
    updateOrderStatus,
    deleteOrder,
    refreshOrders,
  } = useCart();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [access, setAccess] = useState<"checking" | "allowed" | "error">("checking");
  const [accessError, setAccessError] = useState("");
  const [tab, setTab] = useState<AdminTab>("overview");
  const [productForm, setProductForm] = useState<"closed" | "new">("closed");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<{ user: { role: string } | null }>("/auth/me")
      .then(({ user }) => {
        if (!active) return;
        if (user?.role !== "admin") {
          router.replace("/admin/login");
          return;
        }
        void refreshOrders()
          .then(() => {
            if (active) setAccess("allowed");
          })
          .catch((error: unknown) => {
            if (!active) return;
            setAccessError(
              error instanceof Error
                ? error.message
                : "Administrator orders could not be loaded.",
            );
            setAccess("error");
          });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAccessError(
          error instanceof Error ? error.message : "Administrator access could not be checked.",
        );
        setAccess("error");
      });
    return () => {
      active = false;
    };
  }, [refreshOrders, router]);

  async function saveCatalogProduct(product: Product) {
    await saveProduct(product);
    setProductForm("closed");
    setEditingProduct(null);
    setActionError(null);
    setNotice(`${product.name} saved to the store catalog.`);
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Delete ${product.name} from the store catalog?`)) return;
    try {
      await deleteProduct(product.id);
      setNotice(`${product.name} deleted.`);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The product could not be deleted.");
    }
  }

  async function saveCatalogOrder(order: Order) {
    await saveOrder(order);
    setOrderForm(false);
    setEditingOrder(null);
    setActionError(null);
    setNotice(`Order ${order.id} saved.`);
  }

  async function changeOrderStatus(order: Order, status: OrderStatus) {
    setUpdatingOrderId(order.id);
    setNotice(null);
    setActionError(null);
    try {
      await updateOrderStatus(order.id, status);
      setNotice(`Order ${order.id} updated to ${orderStatusLabels[status]}.`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "The order status could not be updated.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function removeOrder(order: Order) {
    if (!window.confirm(`Delete order ${order.id}?`)) return;
    try {
      await deleteOrder(order.id);
      setNotice(`Order ${order.id} deleted.`);
      setActionError(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The order could not be deleted.");
    }
  }

  async function signOut() {
    setIsSigningOut(true);
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
      router.replace("/admin/login");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not sign out.",
      );
      setIsSigningOut(false);
    }
  }

  function selectTab(nextTab: AdminTab) {
    setTab(nextTab);
    setNotice(null);
    setActionError(null);
  }

  const ready = productsReady && ordersReady;

  if (access === "checking") {
    return (
      <main className="mx-auto min-h-[60vh] w-[min(100%_-_56px,_1180px)] py-16 text-center">
        <p role="status">Checking administrator access…</p>
      </main>
    );
  }

  if (access === "error") {
    return (
      <main className="mx-auto min-h-[60vh] w-[min(100%_-_56px,_1180px)] py-16">
        <Notice tone="error" role="alert">{accessError}</Notice>
        <Link className={linkButton} href="/admin/login">Go to administrator sign in</Link>
      </main>
    );
  }

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products", count: products.length },
    { id: "orders", label: "Orders", count: orders.length },
  ];

  return (
    <main className="mx-auto min-h-[70vh] w-[min(100%_-_56px,_1320px)] pb-24 pt-6 text-[#1f2a24] max-[700px]:w-[calc(100%_-_32px)] max-[700px]:pb-16">
      <nav
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#858b81]"
        aria-label="Breadcrumb"
      >
        <Link className="transition-colors hover:text-[#355342]" href="/">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-[#355342]" aria-current="page">
        Admin dashboard
        </span>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-[#e3e7dd] pb-8">
        <div>
          <h1 className="m-0 text-[clamp(32px,4vw,44px)] font-medium leading-[1.1] tracking-[-0.025em] text-[#233b30]">
            Admin dashboard
          </h1>
          <p className="mb-0 mt-2 text-[15px] text-[#6f7a70]">
            Manage the store catalog and customer orders.
          </p>
        </div>
        <Link
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-[#dfe4d8] bg-white px-5 text-[13px] font-medium text-[#355342] transition-colors hover:border-[#9db0a0] hover:bg-[#f3f5ef] ${focusRing}`}
          href="/shop"
        >
          View storefront <span aria-hidden="true">→</span>
        </Link>
        <button
          className={secondaryButton}
          type="button"
          disabled={isSigningOut}
          onClick={signOut}
        >
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </header>

      {loadError && <Notice tone="error" role="alert">{loadError}</Notice>}
      {notice && <Notice tone="success" role="status">{notice}</Notice>}
      {actionError && <Notice tone="error" role="alert">{actionError}</Notice>}

      <div
        className="mb-8 mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#f3f5ef] p-1"
        role="tablist"
        aria-label="Admin data"
      >
        {tabs.map(({ id, label, count }) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors ${focusRing} ${
                selected
                  ? "bg-[#355342] text-white"
                  : "text-[#6f7a70] hover:text-[#233b30]"
              }`}
            >
              {label}
              {count !== undefined && (
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] ${
                    selected ? "bg-white/20 text-white" : "bg-white text-[#355342]"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!ready ? (
        <p className="py-12 text-[15px] text-[#6f7a70]" role="status">
          Loading store data…
        </p>
      ) : tab === "overview" ? (
        <AdminOverview products={products} orders={orders} onSelect={selectTab} />
      ) : tab === "products" ? (
        <section role="tabpanel">
          <SectionHeading
            title={`${products.length} ${products.length === 1 ? "product" : "products"}`}
            action={
              productForm === "closed" && !editingProduct ? (
                <button
                  className={primaryButton}
                  type="button"
                  onClick={() => {
                    setProductForm("new");
                    setNotice(null);
                  }}
                >
                  Add product
                </button>
              ) : undefined
            }
          />

          {(productForm === "new" || editingProduct) && (
            <ProductEditor
              key={editingProduct?.id ?? "new-product"}
              products={products}
              product={editingProduct ?? undefined}
              onSave={saveCatalogProduct}
              onCancel={() => {
                setProductForm("closed");
                setEditingProduct(null);
              }}
            />
          )}

          <div className={tableWrap}>
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Category</th>
                  <th className={th}>Price</th>
                  <th className={th} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const variant = getStartingVariant(product);
                  return (
                  <tr className="transition-colors hover:bg-[#fafaf8]" key={product.id}>
                    <td className={td}>
                      <div className="flex min-w-[220px] items-center gap-4">
                        <Image
                          className="h-[60px] w-[52px] flex-none rounded-xl bg-[#f2f3ee] object-cover"
                          src={getVariantImages(product, variant)[0]?.url ?? ""}
                          alt=""
                          width={52}
                          height={60}
                          unoptimized
                        />
                        <span className="grid gap-1">
                          <strong className="text-sm font-semibold text-[#233b30]">
                            {product.name}
                          </strong>
                          <small className="text-xs text-[#858b81]">
                            {variant.detail ?? `${variant.form} · ${variant.packageQuantity}`}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td className={td}>
                      <span className="inline-flex rounded-full bg-[#f3f5ef] px-3 py-1 text-xs text-[#536157]">
                        {product.category}
                      </span>
                    </td>
                    <td className={`${td} font-semibold text-[#233b30]`}>
                      {formatPrice(variant.price)}
                    </td>
                    <td className={td}>
                      <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                        <button
                          className={secondaryButton}
                          type="button"
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm("closed");
                            setNotice(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className={dangerButton}
                          type="button"
                          onClick={() => removeProduct(product)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <p className="m-0 border-t border-[#eef0ea] px-5 py-10 text-center text-sm text-[#6f7a70]">
                No products yet. Add one to start your catalog.
              </p>
            )}
          </div>
        </section>
      ) : (
        <section role="tabpanel">
          <SectionHeading
            title={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
            action={
              !orderForm && !editingOrder ? (
                <button
                  className={primaryButton}
                  type="button"
                  onClick={() => {
                    setOrderForm(true);
                    setNotice(null);
                  }}
                >
                  Add order
                </button>
              ) : undefined
            }
          />

          {(orderForm || editingOrder) && (
            <OrderEditor
              key={editingOrder?.id ?? "new-order"}
              order={editingOrder}
              products={products}
              onSave={saveCatalogOrder}
              onCancel={() => {
                setOrderForm(false);
                setEditingOrder(null);
              }}
            />
          )}

          <div className={tableWrap}>
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className={th}>Order</th>
                  <th className={th}>Customer</th>
                  <th className={th}>Status</th>
                  <th className={th}>Total</th>
                  <th className={th} aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <Fragment key={order.id}>
                    <tr className="transition-colors hover:bg-[#fafaf8]">
                      <td className={td}>
                        <strong className="block text-sm font-semibold text-[#233b30]">
                          {order.id}
                        </strong>
                        <small className="mt-1 block text-xs text-[#858b81]">
                          {formatOrderDate(order.createdAt)}
                        </small>
                      </td>
                      <td className={td}>
                        <strong className="block text-sm font-semibold text-[#233b30]">
                          {order.contact.name}
                        </strong>
                        <small className="mt-1 block text-xs text-[#858b81]">
                          {order.contact.email}
                        </small>
                      </td>
                      <td className={td}>
                        <div className="grid justify-items-start gap-2">
                          <StatusPill status={order.status} />
                          <label className="sr-only" htmlFor={`order-status-${order.id}`}>
                            Update status for order {order.id}
                          </label>
                          <select
                            id={`order-status-${order.id}`}
                            className="min-h-10 rounded-xl border border-[#dfe4d8] bg-white px-3 text-xs text-[#355342] outline-none focus:border-[#64806a] focus:ring-2 focus:ring-[#64806a]/20"
                            value={order.status ?? "received"}
                            disabled={updatingOrderId !== null}
                            onChange={(event) => {
                              const status = orderStatuses.find(
                                (candidate) => candidate === event.currentTarget.value,
                              );
                              if (status) void changeOrderStatus(order, status);
                            }}
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {orderStatusLabels[status]}
                              </option>
                            ))}
                          </select>
                          {updatingOrderId === order.id && (
                            <span className="text-xs text-[#6f7a70]" role="status">
                              Saving status…
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`${td} font-semibold text-[#233b30]`}>
                        {formatPrice(order.total)}
                      </td>
                      <td className={td}>
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <button
                            className={secondaryButton}
                            type="button"
                            aria-expanded={expandedOrderId === order.id}
                            onClick={() =>
                              setExpandedOrderId((current) =>
                                current === order.id ? null : order.id,
                              )
                            }
                          >
                            {expandedOrderId === order.id ? "Hide details" : "View details"}
                          </button>
                          <button
                            className={secondaryButton}
                            type="button"
                            onClick={() => {
                              setEditingOrder(order);
                              setOrderForm(false);
                              setNotice(null);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className={dangerButton}
                            type="button"
                            onClick={() => removeOrder(order)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr>
                        <td className={`${td} bg-[#fafaf8]`} colSpan={5}>
                          <div className="grid gap-6 md:grid-cols-2">
                            <section>
                              <h3 className="mb-2 mt-0 text-sm font-semibold text-[#233b30]">
                                Customer and delivery
                              </h3>
                              <address className="grid gap-1 text-[13px] not-italic leading-5 text-[#536157]">
                                <span>{order.contact.name}</span>
                                <span>{order.contact.email}</span>
                                <span>{order.contact.phone}</span>
                                <span>{order.contact.address}</span>
                                <span>{order.contact.city}</span>
                              </address>
                            </section>
                            <section>
                              <h3 className="mb-2 mt-0 text-sm font-semibold text-[#233b30]">
                                Items
                              </h3>
                              <ul className="m-0 grid list-none gap-2 p-0 text-[13px] text-[#536157]">
                                {order.items.map((item, index) => (
                                  <li
                                    className="flex flex-wrap justify-between gap-x-4 gap-y-1"
                                    key={`${item.id}-${item.variantId ?? ""}-${index}`}
                                  >
                                    <span>
                                      {item.name}
                                      {item.variantForm
                                        ? ` · ${item.variantForm} · ${item.variantPotency ?? ""} · ${item.variantPackageQuantity ?? ""}`
                                        : ""}
                                      {" · "}Qty {item.quantity}
                                    </span>
                                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-3 grid gap-1 border-t border-[#e3e7dd] pt-3 text-[13px] text-[#536157]">
                                <p className="m-0 flex justify-between gap-4">
                                  <span>Subtotal</span>
                                  <strong>{formatPrice(order.subtotal)}</strong>
                                </p>
                                <p className="m-0 flex justify-between gap-4">
                                  <span>Delivery</span>
                                  <strong>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</strong>
                                </p>
                                <p className="m-0 flex justify-between gap-4 font-semibold text-[#233b30]">
                                  <span>Total</span>
                                  <strong>{formatPrice(order.total)}</strong>
                                </p>
                              </div>
                            </section>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <p className="m-0 border-t border-[#eef0ea] px-5 py-10 text-center text-sm text-[#6f7a70]">
                No orders yet.
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}