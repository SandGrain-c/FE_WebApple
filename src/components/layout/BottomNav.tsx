export default function BottomNav(){
    return(
        <nav className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg fixed bottom-0 w-full rounded-t-2xl md:hidden border-t border-gray-100 dark:border-zinc-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
            <div className="flex justify-around items-center h-20 pb-safe px-4">
                <a href="#" className="text-[#E60026] dark:text-[#FF1A3D] flex flex-col items-center gap-1 tap-highlight-transparent">
                        <span className="material-symbols-outlined" style={{fontVariationSettings: `'FILL' 1`}}>home</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest">Trang chủ</span>
                </a>

                 <a href="#" className="text-gray-400 dark:text-zinc-500 flex flex-col items-center gap-1 hover:text-black dark:hover:text-white tap-highlight-transparent">
                        <span className="material-symbols-outlined">grid_view</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest">Danh mục</span>
                </a>
                <a href="#" className="text-gray-400 dark:text-zinc-500 flex flex-col items-center gap-1 hover:text-black dark:hover:text-white tap-highlight-transparent">
                        <span className="material-symbols-outlined">search</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest">Tìm kiếm</span>
                </a>
                <a href="#" className="text-gray-400 dark:text-zinc-500 flex flex-col items-center gap-1 hover:text-black dark:hover:text-white tap-highlight-transparent">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest">Giỏ hàng</span>
                </a>
                <a href="#" className="text-gray-400 dark:text-zinc-500 flex flex-col items-center gap-1 hover:text-black dark:hover:text-white tap-highlight-transparent">
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium uppercase tracking-widest">Tài khoản</span>
                </a>

                
            </div>
        </nav>
    );
}

