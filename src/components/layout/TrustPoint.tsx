export default function TrustPoint() {
    return(
        <section className="max-w-[1400px] mx-auto w-[80%] border-b border-gray-100 ">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
                <div className="flex flex-col items-center text-center p-4">
                    <span className="material-symbols-outlined text-4xl text-primary mb-4">verified</span>
                    <h4 className="font-headlline-md text-lg mb-1 ">Chính hãng 100%</h4>
                    <p className="text-sm text-secondary">Cam kết nguồn gốc rõ ràng</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                    <span className="material-symbols-outlined text-4xl text-primary mb-4">security</span>
                    <h4 className="font-headline-md text-lg mb-1">Bảo hành uy tín</h4>
                    <p className="text-sm text-secondary">Hỗ trợ kỹ thuật 24/7</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                    <span className="material-symbols-outlined text-4xl text-primary mb-4">local_shipping</span>
                    <h4 className="font-headline-md text-lg mb-1">Giao hàng nhanh</h4>
                    <p className="text-sm text-secondary">Giao hàng tận nơi trong ngày</p>
                </div>
                <div className="flex flex-col items-center text-center p-4">
                    <span className="material-symbols-outlined text-4xl text-primary mb-4">sell</span>
                    <h4 className="font-headline-md text-lg mb-1">Giá cạnh tranh</h4>
                    <p className="text-sm text-secondary">Giá tốt nhất thị trường</p>
                </div>
            </div>
        </section>
    );
}