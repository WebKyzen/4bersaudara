// Data Produk Katalog & Toko beserta Varian Rasa
const products = [
    {
        id: 1,
        name: "Keripik Pisang Renyah",
        price: 15000,
        stock: 45,
        image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&auto=format&fit=crop&q=80",
        description: "Pisang kepok pilihan irisan tipis renyah.",
        variants: ["Asin", "Manis"],
        isCatalogOnly: false
    },
    {
        id: 2,
        name: "Keripik Singkong Pedas",
        price: 12000,
        stock: 30,
        image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&auto=format&fit=crop&q=80",
        description: "Singkong renyah dengan bumbu pilihan.",
        variants: ["Amis Lada", "Original"],
        isCatalogOnly: false
    },
    {
        id: 3,
        name: "Kembang Goreng Traditional",
        price: 18000,
        stock: 0,
        image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=80",
        description: "Kue kembang goyang renyah manis gurih.",
        variants: [],
        isCatalogOnly: true
    }
];

// Data Ulasan Pembeli
let reviews = [
    {
        name: "Rina S.",
        stars: 5,
        comment: "Keripik pisang rasa Manis renyah banget! Pengiriman cepat."
    }
];

let selectedStarInput = 5;
let activeProductForVariant = null;
let cart = [];
let leafletMap = null;
let leafletMarker = null;

document.addEventListener("DOMContentLoaded", () => {
    renderProducts();
    initBannerSlider();
    renderReviews();
    updateCartUI();
    setRatingInput(5);
});

function setTheme(themeName) {
    document.body.className = `bg-slate-50 text-slate-800 font-['Plus_Jakarta_Sans'] pb-20 md:pb-10 theme-${themeName}`;
}

function renderProducts() {
    const grid = document.getElementById("productGrid");
    grid.innerHTML = "";

    products.forEach(p => {
        const formatPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.price);
        
        const card = document.createElement("div");
        card.className = "bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all";

        let buttonHtml = '';
        if (p.isCatalogOnly) {
            buttonHtml = `
                <button disabled class="w-full bg-slate-100 text-slate-400 font-bold text-[10px] py-1.5 rounded-lg cursor-not-allowed">
                    <i class="fa-solid fa-eye mr-1"></i> Khusus Katalog
                </button>
            `;
        } else {
            buttonHtml = `
                <button onclick="promptVariant(${p.id})" class="w-full bg-theme text-white font-bold text-[11px] py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm">
                    <i class="fa-solid fa-plus text-[9px]"></i> Keranjang
                </button>
            `;
        }

        const variantBadge = p.variants.length > 0 
            ? `<div class="text-[9px] font-semibold text-slate-500">Rasa: ${p.variants.join(', ')}</div>` 
            : '';

        card.innerHTML = `
            <div>
                <div class="relative h-28 sm:h-36 overflow-hidden bg-slate-100">
                    <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">
                    ${p.isCatalogOnly ? `<span class="absolute top-1.5 left-1.5 bg-amber-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded shadow">DISPLAY KATALOG</span>` : `<span class="absolute top-1.5 left-1.5 bg-slate-900/80 text-white font-bold text-[8px] px-1.5 py-0.5 rounded shadow">Stok: ${p.stock}</span>`}
                </div>
                <div class="p-2 space-y-1">
                    <h4 class="font-bold text-xs text-slate-800 line-clamp-1">${p.name}</h4>
                    ${variantBadge}
                    <div class="font-extrabold text-xs text-theme pt-0.5">${formatPrice}</div>
                </div>
            </div>
            <div class="p-2 pt-0">
                ${buttonHtml}
            </div>
        `;
        grid.appendChild(card);
    });
}

function promptVariant(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.isCatalogOnly) return;

    activeProductForVariant = product;
    const modal = document.getElementById("variantModal");
    const container = document.getElementById("variantOptionsContainer");
    const title = document.getElementById("variantModalTitle");

    title.innerText = `Pilih Rasa: ${product.name}`;
    container.innerHTML = "";

    if (product.variants.length > 0) {
        product.variants.forEach((v, idx) => {
            const label = document.createElement("label");
            label.className = "flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-slate-400 transition-all text-xs font-bold text-slate-800";
            label.innerHTML = `
                <span>${v}</span>
                <input type="radio" name="productVariant" value="${v}" ${idx === 0 ? 'checked' : ''} class="accent-emerald-600">
            `;
            container.appendChild(label);
        });
    } else {
        container.innerHTML = `<div class="text-xs text-slate-500 italic">Produk ini tidak memiliki varian rasa khusus.</div>`;
    }

    modal.classList.remove("hidden");
}

function closeVariantModal() {
    document.getElementById("variantModal").classList.add("hidden");
    activeProductForVariant = null;
}

function confirmVariantAddToCart() {
    if (!activeProductForVariant) return;

    let selectedVariant = "";
    const radio = document.querySelector('input[name="productVariant"]:checked');
    if (radio) {
        selectedVariant = radio.value;
    }

    addToCart(activeProductForVariant.id, selectedVariant);
    closeVariantModal();
}

function addToCart(productId, variant = "") {
    const product = products.find(p => p.id === productId);
    if (!product || product.isCatalogOnly) return;

    const cartKey = `${productId}-${variant}`;
    const existing = cart.find(item => item.cartKey === cartKey);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            cartKey: cartKey,
            id: product.id,
            name: product.name,
            variant: variant,
            price: product.price,
            image: product.image,
            qty: 1
        });
    }

    updateCartUI();
}

function updateQty(cartKey, delta) {
    const item = cart.find(i => i.cartKey === cartKey);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.cartKey !== cartKey);
    }
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById("cartBadge");
    const floatingTotal = document.getElementById("floatingTotal");
    const modalTotal = document.getElementById("modalTotal");
    const cartItemsList = document.getElementById("cartItemsList");

    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPrice);

    badge.innerText = totalItems;
    floatingTotal.innerText = formattedTotal;
    modalTotal.innerText = formattedTotal;

    if (cart.length === 0) {
        cartItemsList.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs italic">Keranjang belanja masih kosong.</div>`;
    } else {
        cartItemsList.innerHTML = cart.map(item => `
            <div class="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div class="flex items-center gap-2">
                    <img src="${item.image}" class="w-10 h-10 object-cover rounded-md">
                    <div>
                        <div class="font-bold text-slate-800 text-[11px]">${item.name}</div>
                        ${item.variant ? `<span class="bg-amber-100 text-amber-800 font-extrabold text-[9px] px-1.5 py-0.2 rounded">Rasa: ${item.variant}</span>` : ''}
                        <div class="text-[10px] text-theme font-semibold mt-0.5">Rp ${item.price.toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="updateQty('${item.cartKey}', -1)" class="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">-</button>
                    <span class="font-bold text-xs w-4 text-center">${item.qty}</span>
                    <button onclick="updateQty('${item.cartKey}', 1)" class="w-5 h-5 rounded bg-theme text-white font-bold flex items-center justify-center text-xs">+</button>
                </div>
            </div>
        `).join('');
    }
}

function renderReviews() {
    const slider = document.getElementById("ratingSlider");
    const avgScoreDisplay = document.getElementById("avgScoreDisplay");
    const totalReviewsCount = document.getElementById("totalReviewsCount");

    if (reviews.length === 0) {
        slider.innerHTML = `<div class="min-w-full text-center py-3 text-slate-400 text-xs italic">Belum ada ulasan. Jadilah pembeli pertama yang memberikan rating!</div>`;
        avgScoreDisplay.innerText = "0.0 / 5.0";
        totalReviewsCount.innerText = "(0 Ulasan)";
        return;
    }

    const sumStars = reviews.reduce((acc, curr) => acc + curr.stars, 0);
    const avgScore = (sumStars / reviews.length).toFixed(1);

    avgScoreDisplay.innerText = `${avgScore} / 5.0`;
    totalReviewsCount.innerText = `(${reviews.length} Ulasan)`;

    slider.innerHTML = reviews.map(r => {
        const starIcons = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
        return `
            <div class="min-w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-[11px] text-slate-800">${r.name}</span>
                    <div class="text-[10px] text-amber-400 tracking-widest">${starIcons}</div>
                </div>
                <p class="text-[10px] text-slate-600 italic">"${r.comment}"</p>
            </div>
        `;
    }).join('');
}

function setRatingInput(stars) {
    selectedStarInput = stars;
    const icons = document.querySelectorAll("#starInputGroup i");
    icons.forEach((icon, idx) => {
        if (idx < stars) {
            icon.classList.remove("opacity-40");
            icon.classList.add("opacity-100");
        } else {
            icon.classList.remove("opacity-100");
            icon.classList.add("opacity-40");
        }
    });
}

function submitReview() {
    const nameInput = document.getElementById("reviewerName").value.trim();
    const commentInput = document.getElementById("reviewerComment").value.trim();

    if (!nameInput || !commentInput) {
        alert("Mohon isi Nama dan Komentar ulasan Anda.");
        return;
    }

    reviews.unshift({
        name: nameInput,
        stars: selectedStarInput,
        comment: commentInput
    });

    document.getElementById("reviewerName").value = "";
    document.getElementById("reviewerComment").value = "";

    renderReviews();
    alert("Terima kasih! Ulasan Anda telah ditambahkan dan rating telah dihitung ulang secara otomatis.");
}

function toggleCartModal() {
    const modal = document.getElementById("cartModal");
    modal.classList.toggle("hidden");

    if (!modal.classList.contains("hidden")) {
        const isDelivery = document.querySelector('input[name="orderType"]:checked').value === 'delivery';
        if (isDelivery && !leafletMap) {
            setTimeout(initMap, 200);
        }
    }
}

function toggleOrderType(type) {
    const deliveryFields = document.getElementById("deliveryFields");
    const labelPickup = document.getElementById("labelPickup");
    const labelDelivery = document.getElementById("labelDelivery");

    if (type === 'delivery') {
        deliveryFields.classList.remove("hidden");
        labelDelivery.classList.add("active-type");
        labelPickup.classList.remove("active-type");

        if (!leafletMap) {
            setTimeout(initMap, 200);
        }
    } else {
        deliveryFields.classList.add("hidden");
        labelPickup.classList.add("active-type");
        labelDelivery.classList.remove("active-type");
    }
}

function initMap() {
    const defaultLat = -6.200000;
    const defaultLng = 106.816666;

    leafletMap = L.map('map').setView([defaultLat, defaultLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(leafletMap);

    leafletMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(leafletMap);

    document.getElementById("custLat").value = defaultLat;
    document.getElementById("custLng").value = defaultLng;

    leafletMarker.on('dragend', function(e) {
        const position = leafletMarker.getLatLng();
        document.getElementById("custLat").value = position.lat;
        document.getElementById("custLng").value = position.lng;
        document.getElementById("locationStatus").innerText = `Titik terpilih: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
    });

    leafletMap.on('click', function(e) {
        leafletMarker.setLatLng(e.latlng);
        document.getElementById("custLat").value = e.latlng.lat;
        document.getElementById("custLng").value = e.latlng.lng;
        document.getElementById("locationStatus").innerText = `Titik terpilih: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
    });
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            if (leafletMap && leafletMarker) {
                leafletMap.setView([lat, lng], 16);
                leafletMarker.setLatLng([lat, lng]);
                document.getElementById("custLat").value = lat;
                document.getElementById("custLng").value = lng;
                document.getElementById("locationStatus").innerText = `📍 Lokasi GPS Ditemukan!`;
            }
        }, () => {
            alert("Gagal mengakses lokasi GPS Anda. Silakan pilih lokasi manual di peta.");
        });
    } else {
        alert("Browser Anda tidak mendukung Geolocation.");
    }
}

function processCheckout() {
    if (cart.length === 0) {
        alert("Keranjang Anda masih kosong!");
        return;
    }

    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const orderType = document.querySelector('input[name="orderType"]:checked').value;

    if (!name || !phone) {
        alert("Mohon isi Nama Pemesan dan Nomor WhatsApp Anda.");
        return;
    }

    let deliveryDetailText = "";
    if (orderType === "delivery") {
        const address = document.getElementById("custAddress").value.trim();
        const landmark = document.getElementById("custLandmark").value.trim();
        const lat = document.getElementById("custLat").value;
        const lng = document.getElementById("custLng").value;

        if (!address || !landmark) {
            alert("Mohon isi Alamat Lengkap dan Patokan Lokasi untuk pengiriman.");
            return;
        }

        const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
        deliveryDetailText = `\n📍 *LOKASI PENGIRIMAN:*\n• Alamat: ${address}\n• Patokan: ${landmark}\n• Pin Maps: ${mapUrl}\n`;
    } else {
        deliveryDetailText = `\n🏪 *METODE:* AMBIL DI TOKO (PICK UP)\n`;
    }

    const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPrice);

    let itemsText = cart.map((i, idx) => {
        const variantText = i.variant ? ` [Rasa: ${i.variant}]` : '';
        return `${idx + 1}. ${i.name}${variantText} (${i.qty}x) = Rp ${(i.price * i.qty).toLocaleString('id-ID')}`;
    }).join('\n');

    const waText = `🧾 *STRUK NOTA PESANAN - CEMILAN NUSANTARA*
----------------------------------------
👤 *NAMA:* ${name}
📱 *NO WA:* ${phone}
${deliveryDetailText}
📦 *DAFTAR PESANAN:*
${itemsText}

💰 *TOTAL HARGA:* ${formattedTotal}
----------------------------------------
💳 *METODE PEMBAYARAN:* QRIS / DANA DIRECT
⚠️ *STATUS:* MENUNGGU KONFIRMASI TRANSFER
*(Wajib melampirkan bukti transfer di chat ini agar pesanan segera diproses)*`;

    const encodedWaText = encodeURIComponent(waText);
    const waNumber = "6281234567890";
    window.open(`https://wa.me/${waNumber}?text=${encodedWaText}`, '_blank');
}

function initBannerSlider() {
    let index = 0;
    const carousel = document.getElementById("bannerCarousel");
    const dots = document.querySelectorAll("#bannerDots span");

    setInterval(() => {
        index = (index + 1) % 2;
        carousel.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => {
            dot.style.opacity = i === index ? "1" : "0.4";
        });
    }, 4000);
}