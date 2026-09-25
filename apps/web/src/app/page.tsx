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
  category_id?: number | null;
  global_category_id?: unknown;
};

type MatchCandidate = {
  item_id: number;
  shop_id: number;
  title: string;
  shop_name?: string | null;
  price?: number | null;
  image?: string | null;
  product_url?: string;
  final_score: number;
  status: "confirmed" | "possible";
  source_model?: string | null;
  candidate_model?: string | null;
  model_match?: boolean | null;
  image_similarity?: number | null;
};

type MatchSummary = {
  queries?: string[];
  pages?: number[];
  collected?: number;
  unique_candidates?: number;
  category_matched?: number;
  text_checked?: number;
  image_checked?: number;
  confirmed?: number;
  possible?: number;
  rejected?: number;
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

function MatchCard({
  candidate,
}: {
  candidate: MatchCandidate;
}) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="aspect-square overflow-hidden bg-slate-100">
        {candidate.image ? (
          <img
            src={candidate.image}
            alt={candidate.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Không có ảnh
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className={
              candidate.status === "confirmed"
                ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700"
                : "rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700"
            }
          >
            {candidate.status === "confirmed"
              ? "ĐÃ XÁC NHẬN"
              : "CẦN KIỂM TRA"}
          </span>

          <span className="text-xs font-bold text-slate-500">
            Match {candidate.final_score}/100
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-12 text-sm font-bold leading-6">
          {candidate.title}
        </h3>

        <div className="mt-3 text-xl font-black text-orange-500">
          {formatVnd(candidate.price)}
        </div>

        <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs">
          <div className="font-bold text-slate-700">
            {candidate.shop_name || "Chưa xác định shop"}
          </div>

          {typeof candidate.image_similarity === "number" && (
            <div className="mt-1 text-slate-500">
              Độ giống ảnh:{" "}
              {Math.round(candidate.image_similarity * 100)}%
            </div>
          )}
        </div>

        {candidate.product_url && (
          <a
            href={candidate.product_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block rounded-xl bg-slate-900 px-3 py-2.5 text-center text-xs font-black text-white"
          >
            Xem trên Shopee
          </a>
        )}
      </div>
    </article>
  );
}
export default function Home() {
  const [productUrl, setProductUrl] = useState("");
  const [address, setAddress] = useState("");

  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const [matchSummary, setMatchSummary] =
    useState<MatchSummary | null>(null);

  const [confirmed, setConfirmed] =
    useState<MatchCandidate[]>([]);

  const [possible, setPossible] =
    useState<MatchCandidate[]>([]);

  const [matchComplete, setMatchComplete] =
    useState(false);

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
    setNotice("Đang nhận diện sản phẩm...");
    setProduct(null);
    setMatchSummary(null);
    setConfirmed([]);
    setPossible([]);
    setMatchComplete(false);

    try {
      const productResponse = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productUrl,
          address,
        }),
      });

      const productData = await productResponse.json();

      if (!productResponse.ok || !productData.ok) {
        throw new Error(
          productData?.message || "Không thể đọc sản phẩm."
        );
      }

      const sourceProduct = productData.product as Product;

      setProduct(sourceProduct);

      if (!sourceProduct?.title || !sourceProduct?.image) {
        throw new Error(
          "Sản phẩm chưa đủ dữ liệu để đối chiếu."
        );
      }

      setNotice(
        "Đã nhận diện sản phẩm. Đang quét Shopee và đối chiếu sản phẩm..."
      );

      const matchResponse = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceProduct: {
            title: sourceProduct.title,
            shop_name: sourceProduct.shop_name,
            image: sourceProduct.image,
            category_id: sourceProduct.category_id,
            global_category_id:
              sourceProduct.global_category_id,
          },
        }),
      });

      const matchData = await matchResponse.json();

      if (!matchResponse.ok || !matchData.ok) {
        throw new Error(
          matchData?.message ||
            "Không thể hoàn tất đối chiếu sản phẩm."
        );
      }

      const confirmedResults =
        Array.isArray(matchData.confirmed)
          ? matchData.confirmed
          : [];

      const possibleResults =
        Array.isArray(matchData.possible)
          ? matchData.possible
          : [];

      setMatchSummary(matchData.summary || null);
      setConfirmed(confirmedResults);
      setPossible(possibleResults);
      setMatchComplete(true);

      if (confirmedResults.length > 0) {
        setNotice(
          `Đã xác nhận ${confirmedResults.length} sản phẩm cùng mẫu.`
        );
      } else if (possibleResults.length > 0) {
        setNotice(
          `Có ${possibleResults.length} sản phẩm cần kiểm tra thêm.`
        );
      } else {
        setNotice(
          "Chưa tìm thấy shop khác được xác nhận bán cùng sản phẩm."
        );
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi đối chiếu sản phẩm."
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
                Sale Hunter nhận diện sản phẩm, tìm các nơi đang bán cùng
                sản phẩm và chuẩn bị dữ liệu để so sánh giá thực trả.
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
                  {loading ? "ĐANG QUÉT & ĐỐI CHIẾU..." : "TÌM GIÁ TỐT NHẤT"}
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
              <h2 className="text-2xl font-black">
                Sản phẩm bạn đang tìm
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sản phẩm gốc được nhận diện từ link bạn gửi.
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
                    <div className="text-xs text-slate-500">
                      Shop
                    </div>
                    <div className="mt-1 font-bold">
                      {product.shop_name || "Chưa xác định"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-500">
                      Vị trí shop
                    </div>
                    <div className="mt-1 font-bold">
                      {product.shop_location || "Chưa xác định"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {matchComplete && (
          <section className="mt-8">
            <div className="mb-5">
              <div className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                PRODUCT MATCHING
              </div>

              <h2 className="text-2xl font-black">
                Kết quả đối chiếu sản phẩm
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Sale Hunter đã quét nhiều kết quả, lọc theo danh mục,
                đối chiếu model, tiêu đề và hình ảnh trước khi giữ lại
                sản phẩm có khả năng thực sự cùng mẫu.
              </p>
            </div>

            {matchSummary && (
              <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">
                    Đã quét
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {matchSummary.unique_candidates ?? 0}
                  </div>
                  <div className="text-xs text-slate-400">
                    sản phẩm không trùng
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">
                    Cùng danh mục
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {matchSummary.category_matched ?? 0}
                  </div>
                  <div className="text-xs text-slate-400">
                    ứng viên được giữ lại
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">
                    Kiểm tra ảnh
                  </div>
                  <div className="mt-1 text-2xl font-black">
                    {matchSummary.image_checked ?? 0}
                  </div>
                  <div className="text-xs text-slate-400">
                    ứng viên tiềm năng nhất
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">
                    Kết quả giữ lại
                  </div>
                  <div className="mt-1 text-2xl font-black text-orange-500">
                    {(matchSummary.confirmed ?? 0) +
                      (matchSummary.possible ?? 0)}
                  </div>
                  <div className="text-xs text-slate-400">
                    confirmed + possible
                  </div>
                </div>
              </div>
            )}

            {confirmed.length === 0 &&
            possible.length === 0 ? (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xl">
                    ✓
                  </div>

                  <div>
                    <h3 className="font-black">
                      Chưa tìm thấy shop khác được xác nhận bán cùng sản phẩm
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                      Sale Hunter không dùng sản phẩm khác model để tạo
                      kết quả giá rẻ giả. Khi chưa đủ bằng chứng là cùng
                      sản phẩm, kết quả sẽ bị loại.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {confirmed.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-black">
                      Đã xác nhận cùng sản phẩm
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {confirmed.map((candidate) => (
                        <MatchCard
                          key={`${candidate.shop_id}-${candidate.item_id}`}
                          candidate={candidate}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {possible.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-lg font-black">
                      Có khả năng cùng sản phẩm
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {possible.map((candidate) => (
                        <MatchCard
                          key={`${candidate.shop_id}-${candidate.item_id}`}
                          candidate={candidate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-black">
              Kết quả theo nền tảng
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Bảng Top 3 chỉ được kích hoạt sau khi Product Matching và
              Deal Engine hoàn thành.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {marketplaces.map((marketplace) => (
              <div
                key={marketplace.name}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-black">
                    {marketplace.name}
                  </h3>

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
                        Chờ Product Matching
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




