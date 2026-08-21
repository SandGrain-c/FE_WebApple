import Link from "next/link";

export default function Footer(){
    return(
        <footer className="bg-[#F5F5F7] dark:bg-zinc-900 w-[80%] mx-auto mt-20 border-t border-gray-200 dark:border-zinc-800">
            <div className="max-w-[1400px] w-[80%] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 ">
                <div>
                    <span className="text-lg font-bold text-black dark:text-white block mb-6">Đức Bách Hoá</span>
                    <p className="text-sm font-normal leading-relaxed text-gray-500 dark:text-zinc-400 mb-6">Chuyên cung cấp các sản phẩm Apple chính hãng với giá tốt nhất thị trường và dịch vụ bảo hành chuyên nghiệp</p>
                    <div className="flex gap-4">
                        <span className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-[#E60026]">social_leaderboard</span>
                        <span className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-[#E60026]">share</span>
                        <span className="material-symbols-outlined text-gray-400 cursor-pointer hover:text-[#E60026]">movie</span>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-black dark:text-white mb-6 uppercase text-xs tracking-widest">Sản phẩm</h4>
                    <ul className="space-y-3">
                        <li><a className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" href="#">iPhone</a></li>
                        <li><a className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" href="#">iPad</a></li>
                        <li><a className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" href="#">Mac</a></li>
                        <li><a className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" href="#">Phụ kiện</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-black dark:text-white mb-6 uppercase text-xs tracking-widest">Chính sách</h4>
                    <ul className="space-y-3">
                        <li><Link className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" href="/bao-hanh-chinh-hang">Chính sách bảo hành</Link></li>
                        <li><a className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" href="#">Giao hàng</a></li>
                        <li><a className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" href="#">Đổi trả hàng</a></li>
                        <li><a className="text-sm text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors" href="#">Bảo mật thông tin</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-black dark:text-white mb-6 uppercase text-xs tracking-widest">Liên hệ</h4>
                    <ul className="space-y-3">
                        <li className="text-sm text-gray-500 dark:text-zinc-400">Hotline: 1900 1234</li>
                        <li className="text-sm text-gray-500 dark:text-zinc-400">Email: hotro@ducbachhoa.vn</li>
                        <li className="text-sm text-gray-500 dark:text-zinc-400">209 Hồ Tùng Mậu, Phường Cầu Diễn, Hà Nội</li>
                    </ul>
                </div>
                <div className="max-w-[1200px] mx-auto px-8 py-8 border-t border-gray-200 dark:border-zinc-800">
                    <p className="text-sm text-gray-400 dark:text-zinc-500 text-center">© 2024 Đức Bách Hoá. Premium E-commerce. Crafted for Excellence.</p>
                </div> 
            </div>
        </footer>
    );
}
