import Link from 'next/link';

export default function Header() {
    const categories = [
        "Dịch vụ sửa chữa",
        "Bảo hành chính hãng",
        "Thu cũ đổi mới",
        "Trả góp 0%",
        "Lắp đặt tận nơi",
    ];

    const navItems = [
        "iPhone",
        "MacBook",
        "iPad",
        "Apple Watch",
        "Camera",
        "Âm thanh",
        "iMac",
        "Phụ kiện",
    ];

    return (
        <header className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">

            {/* Tầng trên: Logo + Search + Cart + User */}
            <div className="mx-auto flex h-16 w-[80%] max-w-[1400px] items-center gap-4">
                
                {/* Logo + Menu mobile */}
                <div className="flex shrink-0 items-center gap-2">
                    <button className="rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden">
                        <span className="material-symbols-outlined text-gray-600">menu</span>
                    </button>

                    <Link
                        href="/"
                        className="group flex shrink-0 items-center gap-2 transition-all duration-300 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[#FF1A3D] transition-transform duration-300 group-hover:rotate-12">
                            storefront
                        </span>

                        <span className="inline-block whitespace-nowrap text-lg font-bold tracking-tighter text-[#FF1A3D] transition-transform duration-300 ease-in-out group-hover:scale-110 active:scale-95 md:text-2xl">
                            Đức Bách Hoá
                        </span>
                    </Link>
                </div>

                {/* Search */}
                <div className="hidden flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2 transition-all md:flex lg:max-w-[560px]">
                    <span className="material-symbols-outlined text-sm text-gray-400">
                        search
                    </span>

                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        className="flex-1 border-none bg-transparent text-sm outline-none focus:ring-0"
                    />
                </div>

                {/* Đẩy icon sang phải */}
                <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-3">
                    {/* <button className="rounded-full p-2 text-gray-600 hover:bg-gray-100 md:hidden">
                        <span className="material-symbols-outlined">search</span>
                    </button> */}

                    <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF1A3D] text-[10px] text-white">
                            2
                        </span>
                    </button>

                    <button className="hidden rounded-full p-2 text-gray-600 hover:bg-gray-100 sm:flex">
                        <span className="material-symbols-outlined">person</span>
                    </button>
                </div>
            </div>

            {/* Tầng dưới: Danh mục + Navigation */}
            <div className="hidden border-t border-gray-100 md:block">
                <div className="mx-auto flex h-12 w-[80%] max-w-[1400px] items-center gap-8">
                    
                    {/* Category */}
                    <div className="group relative shrink-0">
                        <button className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-[#FF1A3D] hover:text-[#FF1A3D]">
                            <span className="material-symbols-outlined text-base">
                                category
                            </span>
                            <span>Danh mục</span>
                            <span className="material-symbols-outlined text-sm">
                                expand_more
                            </span>
                        </button>

                        {/* Dropdown */}
                        <div className="invisible absolute left-0 top-full z-50 mt-2 min-w-[230px] rounded-xl border border-gray-100 bg-white opacity-0 shadow-lg transition-all duration-150 ease-out group-hover:visible group-hover:opacity-100">
                            <div className="py-2">
                                {categories.map((cate) => (
                                    <button
                                        key={cate}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF1A3D]"
                                    >
                                        <span className="material-symbols-outlined text-base text-gray-400">
                                            chevron_right
                                        </span>
                                        <span>{cate}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex min-w-0 flex-1 items-center overflow-x-auto">
                        <div className="flex items-center gap-6 lg:gap-8">
                            {navItems.map((item) => (
                                <a
                                    key={item}
                                    href="#"
                                    className="whitespace-nowrap text-sm font-medium text-gray-600 transition-colors hover:text-[#FF1A3D]"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}