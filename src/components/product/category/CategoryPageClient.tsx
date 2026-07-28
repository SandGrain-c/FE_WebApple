"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import CategoryBreadcrumb from "./CategoryBreadcrumb";
import CategoryHeader from "./CategoryHeader";
import ProductFilterSidebar, { type ProductFilters } from "./ProductFilterSidebar";
import CategorySortBar, { type ProductSortValue } from "./CategorySortBar";
import CategoryProductGrid from "./CategoryProductGrid";
import CategoryPagination from "./CategoryPagination";
import ActiveFilterChips, { type RemoveFilterPayload } from "./ActiveFilterChips";

import { getProducts } from "@/services/product.service";
import type { ProductCardItem, ProductPagination } from "@/types/product.type";

type CategoryPageClientProps = {
  categorySlug: string;
};

type SearchParamsLike = {
  get: (name: string) => string | null;
};

type CategoryInfo = {
  slug: string;
  name: string;
  description: string;
};

const PRODUCTS_PER_PAGE = 8;

const categoryInfoMap: Record<string, CategoryInfo> = {
  iphone: {
    slug: "iphone",
    name: "iPhone",
    description: "Khám phá các dòng iPhone chính hãng, đa dạng màu sắc và dung lượng.",
  },
  ipad: {
    slug: "ipad",
    name: "iPad",
    description: "Các mẫu iPad phù hợp cho học tập, làm việc và giải trí.",
  },
  macbook: {
    slug: "macbook",
    name: "MacBook",
    description: "MacBook chính hãng với hiệu năng mạnh mẽ cho học tập và công việc.",
  },
  "apple-watch": {
    slug: "apple-watch",
    name: "Apple Watch",
    description: "Apple Watch chính hãng, hỗ trợ theo dõi sức khỏe và luyện tập.",
  },
  "airpods": {
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
  capacities: [],
  colors: [],
  stockStatus: "all",
};

const allowedPriceRanges = ["all", "under-15", "15-25", "over-25", "custom"];

const allowedSortValues: ProductSortValue[] = [
  "default",
  "price-asc",
  "price-desc",
  "best-selling",
  "newest",
];

function parseNumberParam(value: string | null): number | "" {
  if (!value) return "";

  const numberValue = Number(value);

  if (Number.isNaN(numberValue) || numberValue < 0) {
    return "";
  }

  return numberValue;
}

function parseArrayParam(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFiltersFromSearchParams(
  searchParams: SearchParamsLike,
): ProductFilters {
  const priceRangeParam = searchParams.get("priceRange") ?? "all";
  const stockStatusParam = searchParams.get("stockStatus") ?? "all";

  const priceRange = allowedPriceRanges.includes(priceRangeParam)
    ? priceRangeParam
    : "all";

  const stockStatus =
    stockStatusParam === "in-stock" || stockStatusParam === "out-of-stock"
      ? stockStatusParam
      : "all";

  const minPrice = parseNumberParam(searchParams.get("minPrice"));
  const maxPrice = parseNumberParam(searchParams.get("maxPrice"));

  return {
    priceRange,
    minPrice,
    maxPrice,
    capacities: parseArrayParam(searchParams.get("capacities")),
    colors: parseArrayParam(searchParams.get("colors")),
    stockStatus,
  };
}

function parseSortFromSearchParams(
  searchParams: SearchParamsLike,
): ProductSortValue {
  const sortParam = searchParams.get("sort") as ProductSortValue | null;

  if (sortParam && allowedSortValues.includes(sortParam)) {
    return sortParam;
  }

  return "default";
}

function parsePageFromSearchParams(searchParams: SearchParamsLike): number {
  const pageParam = Number(searchParams.get("page"));

  if (Number.isNaN(pageParam) || pageParam < 1) {
    return 1;
  }

  return pageParam;
}

function appendArrayParam(
  params: URLSearchParams,
  key: string,
  value: string[],
) {
  if (value.length > 0) {
    params.set(key, value.join(","));
  }
}

function buildCategorySearchParams(
  filters: ProductFilters,
  sortValue: ProductSortValue,
  page: number,
) {
  const params = new URLSearchParams();

  if (filters.priceRange !== "all") {
    params.set("priceRange", filters.priceRange);
  }

  if (filters.minPrice !== "") {
    params.set("minPrice", String(filters.minPrice));
  }

  if (filters.maxPrice !== "") {
    params.set("maxPrice", String(filters.maxPrice));
  }

  appendArrayParam(params, "capacities", filters.capacities);
  appendArrayParam(params, "colors", filters.colors);

  if (filters.stockStatus !== "all") {
    params.set("stockStatus", filters.stockStatus);
  }

  if (sortValue !== "default") {
    params.set("sort", sortValue);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params;
}

function getPriceParams(filters: ProductFilters) {
  if (filters.priceRange === "custom") {
    return {
      minPrice: filters.minPrice === "" ? undefined : filters.minPrice,
      maxPrice: filters.maxPrice === "" ? undefined : filters.maxPrice,
    };
  }

  if (filters.priceRange === "under-15") {
    return {
      minPrice: undefined,
      maxPrice: 15_000_000,
    };
  }

  if (filters.priceRange === "15-25") {
    return {
      minPrice: 15_000_000,
      maxPrice: 25_000_000,
    };
  }

  if (filters.priceRange === "over-25") {
    return {
      minPrice: 25_000_000,
      maxPrice: undefined,
    };
  }

  return {
    minPrice: undefined,
    maxPrice: undefined,
  };
}

function mapSortToApiSort(sortValue: ProductSortValue) {
  switch (sortValue) {
    case "price-asc":
      return "price_asc";

    case "price-desc":
      return "price_desc";

    case "newest":
      return "newest";

    case "best-selling":
      return "best_selling";

    case "default":
    default:
      return "newest";
  }
}

export default function CategoryPageClient({
  categorySlug,
}: CategoryPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const productListTopRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState<ProductFilters>(() =>
    parseFiltersFromSearchParams(searchParams),
  );

  const [sortValue, setSortValue] = useState<ProductSortValue>(() =>
    parseSortFromSearchParams(searchParams),
  );

  const [currentPage, setCurrentPage] = useState(() =>
    parsePageFromSearchParams(searchParams),
  );

  const [products, setProducts] = useState<ProductCardItem[]>([]);

  const [pagination, setPagination] = useState<ProductPagination>({
    page: 1,
    limit: PRODUCTS_PER_PAGE,
    totalItems: 0,
    totalPages: 1,
  });

  const [capacityOptions, setCapacityOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const category: CategoryInfo = categoryInfoMap[categorySlug] ?? {
    slug: categorySlug,
    name: "Danh mục",
    description: "Danh sách sản phẩm Apple chính hãng.",
  };

  const scrollToProductListTop = useCallback(() => {
    requestAnimationFrame(() => {
      productListTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const syncUrl = useCallback(
    (
      nextFilters: ProductFilters,
      nextSortValue: ProductSortValue,
      nextPage: number,
    ) => {
      const params = buildCategorySearchParams(
        nextFilters,
        nextSortValue,
        nextPage,
      );

      const queryString = params.toString();

      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  useEffect(() => {
    setFilters(parseFiltersFromSearchParams(searchParams));
    setSortValue(parseSortFromSearchParams(searchParams));
    setCurrentPage(parsePageFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const priceParams = getPriceParams(filters);

        const data = await getProducts({
          category: categorySlug,

          // BE hiện tại đang nhận 1 color/capacity.
          // FE của bạn đang lưu dạng mảng, nên tạm thời lấy phần tử đầu tiên.
          color: filters.colors[0],
          capacity: filters.capacities[0],

          minPrice: priceParams.minPrice,
          maxPrice: priceParams.maxPrice,
          sort: mapSortToApiSort(sortValue),
          page: currentPage,
          limit: PRODUCTS_PER_PAGE,
        });

        setProducts(data.items);
        setPagination(data.pagination);

        setCapacityOptions(data.filters.capacities);
        setColorOptions(data.filters.colors);
      } catch (error) {
        console.error("Lỗi lấy sản phẩm danh mục:", error);
        setErrorMessage("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
        setProducts([]);
        setPagination({
          page: 1,
          limit: PRODUCTS_PER_PAGE,
          totalItems: 0,
          totalPages: 1,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug, filters, sortValue, currentPage]);

  const visibleProducts = useMemo(() => {
    if (filters.stockStatus === "all") {
      return products;
    }

    return products.filter(
      (product) => product.stockStatus === filters.stockStatus,
    );
  }, [products, filters.stockStatus]);

  const handleFilterChange = (nextFilters: ProductFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
    syncUrl(nextFilters, sortValue, 1);
    scrollToProductListTop();
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
    syncUrl(defaultFilters, sortValue, 1);
    scrollToProductListTop();
  };

  const handleRemoveFilter = (payload: RemoveFilterPayload) => {
    let nextFilters: ProductFilters = filters;

    if (payload.type === "price") {
      nextFilters = {
        ...filters,
        priceRange: "all",
        minPrice: "",
        maxPrice: "",
      };
    }

    if (payload.type === "capacity") {
      nextFilters = {
        ...filters,
        capacities: filters.capacities.filter(
          (capacity) => capacity !== payload.value,
        ),
      };
    }

    if (payload.type === "color") {
      nextFilters = {
        ...filters,
        colors: filters.colors.filter((color) => color !== payload.value),
      };
    }

    if (payload.type === "stockStatus") {
      nextFilters = {
        ...filters,
        stockStatus: "all",
      };
    }

    setFilters(nextFilters);
    setCurrentPage(1);
    syncUrl(nextFilters, sortValue, 1);
    scrollToProductListTop();
  };

  const handleSortChange = (nextSortValue: ProductSortValue) => {
    setSortValue(nextSortValue);
    setCurrentPage(1);
    syncUrl(filters, nextSortValue, 1);
    scrollToProductListTop();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    syncUrl(filters, sortValue, page);
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
            filters={filters}
            capacityOptions={capacityOptions}
            colorOptions={colorOptions}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        <section className="min-w-0">
          <div ref={productListTopRef} />

          <CategorySortBar
            totalProducts={pagination.totalItems}
            sortValue={sortValue}
            onSortChange={handleSortChange}
            onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
          />

          <ActiveFilterChips
            filters={filters}
            totalProducts={pagination.totalItems}
            categoryName={category.name}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearFilters}
          />

          {isLoading && (
            <div className="rounded-xl border border-outline-variant bg-surface p-8 text-center text-body-md text-on-surface-variant">
              Đang tải sản phẩm...
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-xl border border-error/30 bg-error/5 p-8 text-center text-body-md text-error">
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && (
            <CategoryProductGrid products={visibleProducts} />
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
              filters={filters}
              capacityOptions={capacityOptions}
              colorOptions={colorOptions}
              onChange={(nextFilters) => {
                handleFilterChange(nextFilters);
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