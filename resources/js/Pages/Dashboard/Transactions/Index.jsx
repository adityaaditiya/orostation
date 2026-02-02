import React, {
    useEffect,
    useMemo,
    useState,
    useCallback,
    useRef,
} from "react";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import toast from "react-hot-toast";
import POSLayout from "@/Layouts/POSLayout";
import ProductGrid from "@/Components/POS/ProductGrid";
import CartPanel from "@/Components/POS/CartPanel";
import PaymentPanel from "@/Components/POS/PaymentPanel";
import CustomerSelect from "@/Components/POS/CustomerSelect";
import NumpadModal from "@/Components/POS/NumpadModal";
import HeldTransactions, {
    HoldButton,
} from "@/Components/POS/HeldTransactions";
import useBarcodeScanner from "@/Hooks/useBarcodeScanner";
import { getProductImageUrl } from "@/Utils/imageUrl";
import {
    IconUser,
    IconShoppingCart,
    IconReceipt,
    IconKeyboard,
    IconBarcode,
    IconTrash,
    IconCash,
    IconCreditCard,
} from "@tabler/icons-react";

const formatPrice = (value = 0) =>
    value.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    });

export default function Index({
    carts = [],
    carts_total = 0,
    heldCarts = [],
    customers = [],
    products = [],
    categories = [],
    paymentGateways = [],
    defaultPaymentGateway = "cash",
}) {
    const { auth, errors } = usePage().props;

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [addingProductId, setAddingProductId] = useState(null);
    const [removingItemId, setRemovingItemId] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [discountInput, setDiscountInput] = useState("");
    const [cashInput, setCashInput] = useState("");
    const [paymentMethod, setPaymentMethod] = useState(
        defaultPaymentGateway ?? "cash"
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mobileView, setMobileView] = useState("products"); // 'products' | 'cart'
    const [numpadOpen, setNumpadOpen] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Ref for search input to enable keyboard focus
    const searchInputRef = useRef(null);

    // Set default payment method
    useEffect(() => {
        setPaymentMethod(defaultPaymentGateway ?? "cash");
    }, [defaultPaymentGateway]);

    // Barcode scanner integration
    const handleBarcodeScan = useCallback(
        (barcode) => {
            const product = products.find(
                (p) => p.barcode?.toLowerCase() === barcode.toLowerCase()
            );

            if (product) {
                if (product.stock > 0) {
                    handleAddToCart(product);
                    toast.success(`${product.title} ditambahkan (barcode)`);
                } else {
                    toast.error(`${product.title} stok habis`);
                }
            } else {
                toast.error(`Produk tidak ditemukan: ${barcode}`);
            }
        },
        [products]
    );

    const { isScanning } = useBarcodeScanner(handleBarcodeScan, {
        enabled: true,
        minLength: 3,
    });

    // Calculations
    const discount = useMemo(
        () => Math.max(0, Number(discountInput) || 0),
        [discountInput]
    );
    const subtotal = useMemo(() => carts_total ?? 0, [carts_total]);
    const payable = useMemo(
        () => Math.max(subtotal - discount, 0),
        [subtotal, discount]
    );
    const isCashPayment = paymentMethod === "cash";
    const cash = useMemo(
        () => (isCashPayment ? Math.max(0, Number(cashInput) || 0) : payable),
        [cashInput, isCashPayment, payable]
    );
    const cartCount = useMemo(
        () => carts.reduce((total, item) => total + Number(item.qty), 0),
        [carts]
    );

    // Payment options
    const paymentOptions = useMemo(() => {
        const options = Array.isArray(paymentGateways)
            ? paymentGateways.filter(
                  (gateway) =>
                      gateway?.value && gateway.value.toLowerCase() !== "cash"
              )
            : [];

        return [
            {
                value: "cash",
                label: "Tunai",
                description: "Pembayaran tunai langsung di kasir.",
            },
            ...options,
        ];
    }, [paymentGateways]);

    // Auto-set cash input for non-cash payment
    useEffect(() => {
        if (!isCashPayment && payable >= 0) {
            setCashInput(String(payable));
        }
    }, [isCashPayment, payable]);

    // Handle add product to cart
    const handleAddToCart = async (product) => {
        if (!product?.id) return;

        setAddingProductId(product.id);

        router.post(
            route("transactions.addToCart"),
            {
                product_id: product.id,
                sell_price: product.sell_price,
                qty: 1,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`${product.title} ditambahkan`);
                    setAddingProductId(null);
                },
                onError: () => {
                    toast.error("Gagal menambahkan produk");
                    setAddingProductId(null);
                },
            }
        );
    };

    // Handle update cart quantity
    const [updatingCartId, setUpdatingCartId] = useState(null);

    const handleUpdateQty = (cartId, newQty) => {
        if (newQty < 1) return;
        setUpdatingCartId(cartId);

        router.patch(
            route("transactions.updateCart", cartId),
            { qty: newQty },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setUpdatingCartId(null);
                },
                onError: (errors) => {
                    toast.error(errors?.message || "Gagal update quantity");
                    setUpdatingCartId(null);
                },
            }
        );
    };

    // Handle numpad confirm for cash input
    const handleNumpadConfirm = useCallback((value) => {
        setCashInput(String(value));
    }, []);

    // Handle hold transaction
    const [isHolding, setIsHolding] = useState(false);

    const handleHoldCart = async (label = null) => {
        if (carts.length === 0) {
            toast.error("Keranjang kosong");
            return;
        }

        setIsHolding(true);

        router.post(
            route("transactions.hold"),
            { label },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Transaksi ditahan");
                    setIsHolding(false);
                },
                onError: (errors) => {
                    toast.error(errors?.message || "Gagal menahan transaksi");
                    setIsHolding(false);
                },
            }
        );
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
                return;

            switch (e.key) {
                case "/":
                case "F5":
                    e.preventDefault();
                    // Focus search input
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                    break;
                case "F1":
                    e.preventDefault();
                    setNumpadOpen(true);
                    break;
                case "F2":
                    e.preventDefault();
                    if (carts.length > 0 && selectedCustomer)
                        handleSubmitTransaction();
                    break;
                case "F3":
                    e.preventDefault();
                    setMobileView(
                        mobileView === "products" ? "cart" : "products"
                    );
                    break;
                case "F4":
                    e.preventDefault();
                    setShowShortcuts(!showShortcuts);
                    break;
                case "Escape":
                    setNumpadOpen(false);
                    setShowShortcuts(false);
                    setSearchQuery("");
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [carts, selectedCustomer, mobileView, showShortcuts]);

    // Handle remove from cart
    const handleRemoveFromCart = (cartId) => {
        setRemovingItemId(cartId);

        router.delete(route("transactions.destroyCart", cartId), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Item dihapus dari keranjang");
                setRemovingItemId(null);
            },
            onError: () => {
                toast.error("Gagal menghapus item");
                setRemovingItemId(null);
            },
        });
    };

    // Handle submit transaction
    const handleSubmitTransaction = () => {
        if (carts.length === 0) {
            toast.error("Keranjang masih kosong");
            return;
        }

        if (!selectedCustomer?.id) {
            toast.error("Pilih pelanggan terlebih dahulu");
            return;
        }

        if (isCashPayment && cash < payable) {
            toast.error("Jumlah pembayaran kurang dari total");
            return;
        }

        setIsSubmitting(true);

        router.post(
            route("transactions.store"),
            {
                customer_id: selectedCustomer.id,
                discount,
                grand_total: payable,
                cash: isCashPayment ? cash : payable,
                change: isCashPayment ? Math.max(cash - payable, 0) : 0,
                payment_gateway: isCashPayment ? null : paymentMethod,
            },
            {
                onSuccess: () => {
                    setDiscountInput("");
                    setCashInput("");
                    setSelectedCustomer(null);
                    setPaymentMethod(defaultPaymentGateway ?? "cash");
                    setIsSubmitting(false);
                    toast.success("Transaksi berhasil!");
                },
                onError: () => {
                    setIsSubmitting(false);
                    toast.error("Gagal menyimpan transaksi");
                },
            }
        );
    };

    // Filter products including out of stock
    const allProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCategory =
                !selectedCategory || product.category_id === selectedCategory;
            const matchesSearch =
                !searchQuery ||
                product.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                product.barcode
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, selectedCategory, searchQuery]);

    return (
        <>
            <Head title="Transaksi" />

            <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
                {/* Mobile Tab Switcher */}
                <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button
                        onClick={() => setMobileView("products")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            mobileView === "products"
                                ? "text-primary-600 border-b-2 border-primary-500"
                                : "text-slate-500"
                        }`}
                    >
                        <IconShoppingCart size={18} />
                        <span>Produk</span>
                    </button>
                    <button
                        onClick={() => setMobileView("cart")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                            mobileView === "cart"
                                ? "text-primary-600 border-b-2 border-primary-500"
                                : "text-slate-500"
                        }`}
                    >
                        <IconReceipt size={18} />
                        <span>Keranjang</span>
                        {cartCount > 0 && (
                            <span className="absolute top-2 right-1/4 w-5 h-5 flex items-center justify-center text-xs font-bold bg-primary-500 text-white rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Left Panel - Products */}
                <div
                    className={`flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden ${
                        mobileView !== "products"
                            ? "hidden lg:flex lg:flex-col"
                            : "flex flex-col"
                    }`}
                >
                    <ProductGrid
                        products={allProducts}
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        isSearching={isSearching}
                        onAddToCart={handleAddToCart}
                        addingProductId={addingProductId}
                        searchInputRef={searchInputRef}
                    />
                </div>

                {/* Right Panel - Cart & Payment */}
                <div
                    className={`w-full lg:w-[420px] xl:w-[480px] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 ${
                        mobileView !== "cart" ? "hidden lg:flex" : "flex"
                    }`}
                    style={{ height: "calc(100vh - 4rem)" }}
                >
                    {/* Customer Select - Fixed */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                        <CustomerSelect
                            customers={customers}
                            selected={selectedCustomer}
                            onSelect={setSelectedCustomer}
                            placeholder="Pilih pelanggan..."
                            error={errors?.customer_id}
                            label="Pelanggan"
                        />
                    </div>

                    {/* Held Transactions - Show if any */}
                    {heldCarts.length > 0 && (
                        <HeldTransactions
                            heldCarts={heldCarts}
                            hasActiveCart={carts.length > 0}
                        />
                    )}

                    {/* Cart Items - Scrollable */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {/* Hold Button - at top of cart section */}
                        {carts.length > 0 && (
                            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                                <HoldButton
                                    hasItems={carts.length > 0}
                                    onHold={handleHoldCart}
                                    isHolding={isHolding}
                                />
                            </div>
                        )}

                        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <IconShoppingCart size={16} />
                                    Keranjang
                                </h3>
                                {carts.length > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-full">
                                        {cartCount} item
                                    </span>
                                )}
                            </div>

                            {carts.length > 0 ? (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {carts.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                                {item.product?.image ? (
                                                    <img
                                                        src={getProductImageUrl(
                                                            item.product.image
                                                        )}
                                                        alt={item.product.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <IconShoppingCart
                                                            size={14}
                                                            className="text-slate-400"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                                    {item.product?.title ||
                                                        "Produk"}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatPrice(
                                                        item.product
                                                            ?.sell_price || 0
                                                    )}{" "}
                                                    × {item.qty}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        handleUpdateQty(
                                                            item.id,
                                                            Math.max(
                                                                1,
                                                                item.qty - 1
                                                            )
                                                        )
                                                    }
                                                    disabled={item.qty <= 1}
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 disabled:opacity-50 text-xs"
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center text-xs font-medium">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleUpdateQty(
                                                            item.id,
                                                            item.qty + 1
                                                        )
                                                    }
                                                    className="w-6 h-6 rounded flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 text-xs"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleRemoveFromCart(
                                                            item.id
                                                        )
                                                    }
                                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/50 ml-1"
                                                >
                                                    <IconTrash size={12} />
                                                </button>
                                            </div>
                                            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 w-16 text-right">
                                                {formatPrice(item.price)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <IconShoppingCart
                                        size={32}
                                        className="mx-auto text-slate-300 dark:text-slate-600 mb-2"
                                    />
                                    <p className="text-sm text-slate-400">
                                        Keranjang kosong
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Payment Details - Scrollable */}
                        <div className="p-3 space-y-4">
                            {/* Payment Method Selection */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Metode Pembayaran
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {paymentOptions.map((method) => (
                                        <button
                                            key={method.value}
                                            onClick={() =>
                                                setPaymentMethod(method.value)
                                            }
                                            className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                                                paymentMethod === method.value
                                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
                                                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                            }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    paymentMethod ===
                                                    method.value
                                                        ? "bg-primary-500 text-white"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                                }`}
                                            >
                                                {method.value === "cash" ? (
                                                    <IconCash size={16} />
                                                ) : (
                                                    <IconCreditCard size={16} />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p
                                                    className={`text-sm font-semibold ${
                                                        paymentMethod ===
                                                        method.value
                                                            ? "text-primary-700 dark:text-primary-300"
                                                            : "text-slate-700 dark:text-slate-300"
                                                    }`}
                                                >
                                                    {method.label}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Amounts - Only for cash */}
                            {paymentMethod === "cash" && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                        Nominal Cepat
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[10000, 20000, 50000, 100000].map(
                                            (amt) => (
                                                <button
                                                    key={amt}
                                                    onClick={() =>
                                                        setCashInput(
                                                            String(amt)
                                                        )
                                                    }
                                                    className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                                                        Number(cashInput) ===
                                                        amt
                                                            ? "bg-primary-500 text-white"
                                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {formatPrice(amt)}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Discount Input */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    Diskon (Rp)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                        Rp
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={discountInput}
                                        onChange={(e) =>
                                            setDiscountInput(
                                                e.target.value.replace(
                                                    /[^\d]/g,
                                                    ""
                                                )
                                            )
                                        }
                                        placeholder="0"
                                        className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Cash Input - Only for cash */}
                            {paymentMethod === "cash" && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                        Jumlah Bayar (Rp)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                            Rp
                                        </span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={cashInput}
                                            onChange={(e) =>
                                                setCashInput(
                                                    e.target.value.replace(
                                                        /[^\d]/g,
                                                        ""
                                                    )
                                                )
                                            }
                                            placeholder="0"
                                            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary & Submit - Fixed at bottom */}
                    <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3">
                        {/* Summary Row */}
                        <div className="flex justify-between items-center mb-2 text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-medium">
                                {formatPrice(subtotal)}
                            </span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-slate-500">Diskon</span>
                                <span className="text-danger-500">
                                    -{formatPrice(discount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-slate-800 dark:text-white">
                                Total
                            </span>
                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                {formatPrice(payable)}
                            </span>
                        </div>

                        {paymentMethod === "cash" &&
                            cash >= payable &&
                            payable > 0 && (
                                <div className="flex justify-between items-center mb-3 p-2 rounded-lg bg-success-50 dark:bg-success-950/30">
                                    <span className="text-sm text-success-700 dark:text-success-400">
                                        Kembalian
                                    </span>
                                    <span className="font-bold text-success-600">
                                        {formatPrice(cash - payable)}
                                    </span>
                                </div>
                            )}

                        {/* Submit Button - Always visible */}
                        <button
                            onClick={handleSubmitTransaction}
                            disabled={
                                !carts.length ||
                                !selectedCustomer ||
                                (paymentMethod === "cash" && cash < payable) ||
                                isSubmitting
                            }
                            className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                carts.length &&
                                selectedCustomer &&
                                (paymentMethod !== "cash" || cash >= payable)
                                    ? "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/30"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            }`}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconReceipt size={18} />
                                    <span>
                                        {!carts.length
                                            ? "Keranjang Kosong"
                                            : !selectedCustomer
                                            ? "Pilih Pelanggan"
                                            : paymentMethod === "cash" &&
                                              cash < payable
                                            ? `Kurang ${formatPrice(
                                                  payable - cash
                                              )}`
                                            : "Selesaikan Transaksi"}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Numpad Modal */}
            <NumpadModal
                isOpen={numpadOpen}
                onClose={() => setNumpadOpen(false)}
                onConfirm={handleNumpadConfirm}
                title="Jumlah Bayar"
                initialValue={Number(cashInput) || 0}
                isCurrency={true}
            />

            {/* Keyboard Shortcuts Help */}
            {showShortcuts && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60"
                        onClick={() => setShowShortcuts(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <IconKeyboard size={24} />
                            Keyboard Shortcuts
                        </h3>
                        <div className="space-y-3">
                            {[
                                ["F1", "Buka Numpad"],
                                ["F2", "Selesaikan Transaksi"],
                                ["F3", "Toggle Produk/Keranjang"],
                                ["F4", "Tampilkan Bantuan"],
                                ["Esc", "Tutup Modal"],
                            ].map(([key, desc]) => (
                                <div
                                    key={key}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {desc}
                                    </span>
                                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {key}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowShortcuts(false)}
                            className="mt-6 w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <POSLayout children={page} />;
