"use client";

import { useState } from "react";

type Product = {
  product_url?: string;
  shop_id?: number;
  item_id?: number;
  title?: string | null;
  price?: number | null;
  currency?: string | null;
  image?: string | null;
  shop_name?: string | null;
  shop_location?: string | null;
};

const marketplaces = [
  {
    name: "Shopee",
    status: "Đang hoạt động",
    active: true,
  },
  {
    name: "TikTok Shop",
    status: "Sắp hỗ trợ",
    active: false,
  },
  {
    name: "Lazada",
    status: "Sắp hỗ trợ",
    active: false,
  },
];

function formatVnd(value?: number | null) {
  if (typeof value !== "number") return "Chưa có giá";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [productUrl, setProductUrl] = useState("");
  const [address, setAddress] = useState("");

  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  async function handleSearch() {
    if (!productUrl.trim()) {
      setNotice("Vui lòng dán link sản phẩm.");
      return;
    }

    if (!address.trim()) {
      setNotice("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }

    setLoading(true);
    setNotice("Đang nhận diện sản phẩm và đọc dữ liệu Shopee...");
    setProduct(null);

    try {
      const response = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productUrl,
          address,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.message || "Không thể đọc sản phẩm.");
      }

      setProduct(data.product);
      setNotice("Đã nhận diện sản phẩm thành công.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tìm sản phẩm."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight text-orange-500">
              SALE HUNTER
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Tìm giá thực trả tốt nhất
            </div>
          </div>

          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm">
            Tài khoản
          </button>
        </header>

        <section className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">
                Săn sale thông minh
              </span>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                Dán một link.
                <br />
                Tìm giá tốt nhất trên từng sàn.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Sale Hunter nhận diện sản phẩm, tính phí giao hàng và tổng hợp
                ưu đãi hợp lệ để tìm những nơi bán tốt nhất trên Shopee,
                TikTok Shop và Lazada.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Link sản phẩm
                  </label>

                  <input
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="Dán link Shopee, TikTok Shop hoặc Lazada"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Địa chỉ giao hàng
                  </label>

                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ví dụ: Phường Hiệp Bình, TP.HCM"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Sau này địa chỉ này sẽ dùng để tính phí ship và freeship.
                  </p>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-base font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "ĐANG KIỂM TRA..." : "TÌM GIÁ TỐT NHẤT"}
                </button>

                {notice && (
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                    {notice}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {product && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-black">Sản phẩm bạn đang tìm</h2>

              <p className="mt-1 text-sm text-slate-500">
                Sale Hunter đã nhận diện sản phẩm gốc từ link bạn gửi.
              </p>
            </div>

            <div className="grid gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-[180px_1fr] md:p-6">
              <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title || "Shopee product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Không có ảnh
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                  SHOPEE
                </div>

                <h3 className="text-xl font-black leading-8">
                  {product.title || "Không có tên sản phẩm"}
                </h3>

                <div className="mt-4 text-3xl font-black text-orange-500">
                  {formatVnd(product.price)}
                </div>

                <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-500">Shop</div>
                    <div className="mt-1 font-bold">
                      {product.shop_name || "Chưa xác định"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-500">Vị trí shop</div>
                    <div className="mt-1 font-bold">
                      {product.shop_location || "Chưa xác định"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-black">Kết quả theo nền tảng</h2>

            <p className="mt-1 text-sm text-slate-500">
              Mỗi sàn sẽ có bảng xếp hạng riêng. Mặc định Top 3.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {marketplaces.map((marketplace) => (
              <div
                key={marketplace.name}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-black">{marketplace.name}</h3>

                  <span
                    className={
                      marketplace.active
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                        : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
                    }
                  >
                    {marketplace.status}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {[1, 2, 3].map((rank) => (
                    <div
                      key={rank}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <span className="text-sm font-bold text-slate-500">
                        #{rank}
                      </span>

                      <span className="text-sm text-slate-400">
                        Chưa có kết quả
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
