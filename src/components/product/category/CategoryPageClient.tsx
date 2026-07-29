"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import ActiveFilterChips, {
  type RemoveFilterPayload,
} from "./ActiveFilterChips";
import CategoryBreadcrumb from "./CategoryBreadcrumb";
import CategoryHeader from "./CategoryHeader";
import CategoryPagination from "./CategoryPagination";
import CategoryProductGrid from "./CategoryProductGrid";
import CategorySortBar from "./CategorySortBar";
import ProductFilterSidebar, {
  type PriceRangeValue,
  type ProductFilters,
} from "./ProductFilterSidebar";

import { getProducts } from "@/services/product.service";
import type {
  ProductCardItem,
  ProductCatalogSort,
  ProductPagination,
} from "@/types/product.type";

type CategoryPageClientProps = {
  categorySlug: string;
};

type CategoryInfo = {
  slug: string;
  name: string;
  description: string;
};

type CatalogUrlState = {
  search: string;
  filters: ProductFilters;
  sort: ProductCatalogSort;
  page: number;
};

const PRODUCTS_PER_PAGE = 8;

const categoryInfoMap: Record<string, CategoryInfo> = {
  iphone: {
    slug: "iphone",
    name: "iPhone",
    description:
      "Khám phá các dòng iPhone chính hãng, đa dạng màu sắc và dung lượng.",
  },
  ipad: {
    slug: "ipad",
    name: "iPad",
    description: "Các mẫu iPad phù hợp cho học tập, làm việc và giải trí.",
  },
  macbook: {
    slug: "macbook",
    name: "MacBook",
    description:
      "MacBook chính hãng với hiệu năng mạnh mẽ cho học tập và công việc.",
  },
  "apple-watch": {
    slug: "apple-watch",
    name: "Apple Watch",
    description:
      "Apple Watch chính hãng, hỗ trợ theo dõi sức khỏe và luyện tập.",
  },
  airpods: {
    slug: "airpods",
    name: "AirPods",
    description: "Tai nghe AirPods chính hãng, âm thanh chất lượng cao.",
  },
  "am-thanh": {
    slug: "am-thanh",
    name: "Âm thanh",
    description: "Các sản phẩm âm thanh Apple chính hãng.",
  },
  "phu-kien": {
    slug: "phu-kien",
    name: "Phụ kiện",
    description: "Phụ kiện Apple chính hãng cho iPhone, iPad, MacBook.",
  },
};

const defaultFilters: ProductFilters = {
  priceRange: "all",
  minPrice: "",
  maxPrice: "",
  capacity: "",
  color: "",
  ram: "",
};

const productCatalogSorts: ProductCatalogSort[] = [
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
  "best_selling",
];

function parseTextParam(value: string | null) {
  return value?.trim() ?? "";
}

function parsePriceParam(value: string | null): number | "" {
  if (!value?.trim()) return "";

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return "";
  }

  return parsedValue;
}

function getPriceRange(
  minPrice: number | "",
  maxPrice: number | "",
): PriceRangeValue {
  if (minPrice === "" && maxPrice === "") return "all";
  if (minPrice === "" && maxPrice === 15_000_000) return "under-15";
  if (minPrice === 15_000_000 && maxPrice === 25_000_000) return "15-25";
  if (minPrice === 25_000_000 && maxPrice === "") return "over-25";

  return "custom";
}

function parseSortParam(value: string | null): ProductCatalogSort {
  const normalizedValue = value?.trim();
  const matchedSort = productCatalogSorts.find(
    (sortValue) => sortValue === normalizedValue,
  );

  return matchedSort ?? "newest";
}

function parsePageParam(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return 1;

  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : 1;
}

function parseCatalogUrlState(searchParams: URLSearchParams): CatalogUrlState {
  const minPrice = parsePriceParam(searchParams.get("minPrice"));
  const maxPrice = parsePriceParam(searchParams.get("maxPrice"));

  return {
    search: parseTextParam(searchParams.get("search")),
    filters: {
      priceRange: getPriceRange(minPrice, maxPrice),
      minPrice,
      maxPrice,
      color: parseTextParam(searchParams.get("color")),
      capacity: parseTextParam(searchParams.get("capacity")),
      ram: parseTextParam(searchParams.get("ram")),
    },
    sort: parseSortParam(searchParams.get("sort")),
    page: parsePageParam(searchParams.get("page")),
  };
}

function appendTextParam(
  params: URLSearchParams,
  key: string,
  value: string,
) {
  const normalizedValue = value.trim();

  if (normalizedValue) {
    params.set(key, normalizedValue);
  }
}

function buildCategorySearchParams(state: CatalogUrlState) {
  const params = new URLSearchParams();

  appendTextParam(params, "search", state.search);
  appendTextParam(params, "color", state.filters.color);
  appendTextParam(params, "capacity", state.filters.capacity);
  appendTextParam(params, "ram", state.filters.ram);

  if (state.filters.minPrice !== "") {
    params.set("minPrice", String(state.filters.minPrice));
  }

  if (state.filters.maxPrice !== "") {
    params.set("maxPrice", String(state.filters.maxPrice));
  }

  if (state.sort !== "newest") {
    params.set("sort", state.sort);
  }

  if (state.page > 1) {
    params.set("page", String(state.page));
  }

  return params;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function emptyPagination(page = 1): ProductPagination {
  return {
    page,
    limit: PRODUCTS_PER_PAGE,
    totalItems: 0,
    totalPages: 0,
  };
}

export default function CategoryPageClient({
  categorySlug,
}: CategoryPageClientProps) {
  const canonicalCategorySlug = categorySlug.trim().toLowerCase();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawQuery = searchParams.toString();
  const catalogState = useMemo(
    () => parseCatalogUrlState(new URLSearchParams(rawQuery)),
    [rawQuery],
  );

  const productListTopRef = useRef<HTMLDivElement | null>(null);

  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [pagination, setPagination] = useState<ProductPagination>(() =>
    emptyPagination(catalogState.page),
  );
  const [capacityOptions, setCapacityOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [ramOptions, setRamOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const category: CategoryInfo = categoryInfoMap[canonicalCategorySlug] ?? {
    slug: canonicalCategorySlug,
    name: "Danh mục",
    description: "Danh sách sản phẩm Apple chính hãng.",
  };

  const hasInvalidPriceRange =
    catalogState.filters.minPrice !== "" &&
    catalogState.filters.maxPrice !== "" &&
    catalogState.filters.minPrice > catalogState.filters.maxPrice;

  const scrollToProductListTop = useCallback(() => {
    requestAnimationFrame(() => {
      productListTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const navigateToState = useCallback(
    (nextState: CatalogUrlState, replace = false) => {
      const queryString = buildCategorySearchParams(nextState).toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;

      if (replace) {
        router.replace(href, { scroll: false });
        return;
      }

      router.push(href, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      await Promise.resolve();

      if (controller.signal.aborted) return;

      if (hasInvalidPriceRange) {
        setIsLoading(false);
        setProducts([]);
        setPagination(emptyPagination(catalogState.page));
        setErrorMessage(
          "Khoảng giá không hợp lệ. Giá tối thiểu không được lớn hơn giá tối đa.",
        );
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setProducts([]);
      setPagination(emptyPagination(catalogState.page));

      try {
        const data = await getProducts(
          {
            categorySlug: canonicalCategorySlug,
            search: catalogState.search,
            color: catalogState.filters.color,
            capacity: catalogState.filters.capacity,
            ram: catalogState.filters.ram,
            minPrice:
              catalogState.filters.minPrice === ""
                ? undefined
                : catalogState.filters.minPrice,
            maxPrice:
              catalogState.filters.maxPrice === ""
                ? undefined
                : catalogState.filters.maxPrice,
            sort: catalogState.sort,
            page: catalogState.page,
            limit: PRODUCTS_PER_PAGE,
          },
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        if (
          !data ||
          !Array.isArray(data.items) ||
          !data.pagination ||
          !Number.isSafeInteger(data.pagination.page) ||
          !Number.isSafeInteger(data.pagination.limit) ||
          !Number.isSafeInteger(data.pagination.totalItems) ||
          !Number.isSafeInteger(data.pagination.totalPages)
        ) {
          throw new Error("Phản hồi danh sách sản phẩm không hợp lệ");
        }

        if (
          data.pagination.totalPages > 0 &&
          catalogState.page > data.pagination.totalPages
        ) {
          navigateToState(
            { ...catalogState, page: data.pagination.totalPages },
            true,
          );
          return;
        }

        setProducts(data.items);
        setPagination(data.pagination);
        setCapacityOptions(
          Array.isArray(data.filters?.capacities)
            ? data.filters.capacities
            : [],
        );
        setColorOptions(
          Array.isArray(data.filters?.colors) ? data.filters.colors : [],
        );
        setRamOptions(
          Array.isArray(data.filters?.ramOptions)
            ? data.filters.ramOptions
            : [],
        );
      } catch (error) {
        if (isAbortError(error)) return;

        setErrorMessage(
          "Không thể tải danh sách sản phẩm. Vui lòng thử lại.",
        );
        setProducts([]);
        setPagination(emptyPagination(catalogState.page));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchProducts();

    return () => {
      controller.abort();
    };
  }, [
    catalogState,
    canonicalCategorySlug,
    hasInvalidPriceRange,
    navigateToState,
  ]);

  const handleFilterChange = (filters: ProductFilters) => {
    navigateToState({ ...catalogState, filters, page: 1 });
    scrollToProductListTop();
  };

  const handleClearFilters = () => {
    navigateToState({ ...catalogState, filters: defaultFilters, page: 1 });
    scrollToProductListTop();
  };

  const handleRemoveFilter = (payload: RemoveFilterPayload) => {
    const filters = { ...catalogState.filters };

    switch (payload.type) {
      case "price":
        filters.priceRange = "all";
        filters.minPrice = "";
        filters.maxPrice = "";
        break;

      case "capacity":
        filters.capacity = "";
        break;

      case "color":
        filters.color = "";
        break;

      case "ram":
        filters.ram = "";
        break;
    }

    navigateToState({ ...catalogState, filters, page: 1 });
    scrollToProductListTop();
  };

  const handleSortChange = (sort: ProductCatalogSort) => {
    navigateToState({ ...catalogState, sort, page: 1 });
    scrollToProductListTop();
  };

  const handlePageChange = (page: number) => {
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      pagination.totalPages < 1 ||
      page > pagination.totalPages
    ) {
      return;
    }

    navigateToState({ ...catalogState, page });
    scrollToProductListTop();
  };

  return (
    <main className="container mx-auto mt-8 w-[80%] px-0 md:px-5">
      <CategoryBreadcrumb categoryName={category.name} />

      <CategoryHeader
        name={category.name}
        description={category.description}
        totalProducts={pagination.totalItems}
      />

      <div className="grid gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden md:block">
          <ProductFilterSidebar
            filters={catalogState.filters}
            capacityOptions={capacityOptions}
            colorOptions={colorOptions}
            ramOptions={ramOptions}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        <section className="min-w-0">
          <div ref={productListTopRef} />

          <CategorySortBar
            totalProducts={pagination.totalItems}
            sortValue={catalogState.sort}
            onSortChange={handleSortChange}
            onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
          />

          <ActiveFilterChips
            filters={catalogState.filters}
            totalProducts={pagination.totalItems}
            categoryName={category.name}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearFilters}
          />

          {isLoading && (
            <CategoryProductGrid products={[]} isLoading />
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error/5 p-8 text-center text-body-md text-error">
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && (
            <CategoryProductGrid products={products} />
          )}

          {!isLoading && !errorMessage && (
            <CategoryPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </div>

      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/50 md:hidden">
          <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-xl bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-headline-md text-on-surface">Bộ lọc</h2>

              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="rounded-full border border-outline-variant px-4 py-2 text-label-md text-on-surface"
              >
                Đóng
              </button>
            </div>

            <ProductFilterSidebar
              filters={catalogState.filters}
              capacityOptions={capacityOptions}
              colorOptions={colorOptions}
              ramOptions={ramOptions}
              onChange={(filters) => {
                handleFilterChange(filters);
                setIsMobileFilterOpen(false);
              }}
              onClear={() => {
                handleClearFilters();
                setIsMobileFilterOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
