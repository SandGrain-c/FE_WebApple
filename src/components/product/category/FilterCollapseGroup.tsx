"use client";

import { useState, type ReactNode } from "react";

// Component để hiển thị một nhóm bộ lọc có thể thu gọn, giúp người dùng dễ dàng quản lý không gian giao diện khi có nhiều bộ lọc khác nhau, cho phép họ mở rộng hoặc thu gọn từng nhóm bộ lọc theo nhu cầu
type FilterCollapseGroupProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Component để hiển thị một nhóm bộ lọc có thể thu gọn, giúp người dùng dễ dàng quản lý không gian giao diện khi có nhiều bộ lọc khác nhau, cho phép họ mở rộng hoặc thu gọn từng nhóm bộ lọc theo nhu cầu
export default function FilterCollapseGroup({
  title,
  defaultOpen = true,
  children,
}: FilterCollapseGroupProps) { // Sử dụng hook useState để quản lý trạng thái mở/đóng của nhóm bộ lọc, với giá trị mặc định được xác định bởi prop defaultOpen, giúp người dùng có thể tùy chỉnh trạng thái ban đầu của nhóm bộ lọc khi trang được tải
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-surface-container-high py-4 first:pt-0 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h3 className="text-body-md font-bold text-on-surface">{title}</h3>

        <span className="text-xl font-bold text-on-surface">
          {open ? "⌃" : "⌄"}
        </span>
      </button>

      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}