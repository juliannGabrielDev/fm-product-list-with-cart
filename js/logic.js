const productContainer = document.getElementById("main");
const productCardTemplate = document.getElementById("product-card-template");
const cartItemTemplate = document.getElementById("cart-item-template");
const modalProductTemplate = document.getElementById("modal-product-template");

const cartList = document.getElementById("cart-list");
const cartEmptyDiv = document.getElementById("cart-empty");
const cartWithProductsDiv = document.getElementById("cart-with-products");
const cartQuantity = document.getElementById("cart-quantity");
const cartTotalPrice = document.getElementById("cart-total-price");
const cartConfirmBtn = document.getElementById("cart-confirm-btn");

const confirmationModal = document.getElementById("confirmation-modal");
const modalProductList = document.getElementById("modal-product-list");
const modalOrderBtn = document.getElementById("modal-order-btn");
const modalTotalPrice = document.getElementById("modal-total-price");

const MIN_QUANTITY = 0;
const MAX_QUANTITY = 10;

let productData = [];
let cart = [];
let confModalData = [];

/* === START === */
async function fetchProductData() {
	try {
		const response = await fetch("./data/data.json");
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const data = await response.json();

		initData(data);
	} catch (error) {
		console.log(`Error loading product data: ${error}`);
		// displayErrorMessageToUser("Unable to load product data. Please try again later.");
	}
}
fetchProductData();

function initData(data) {
	if (!Array.isArray(data) || data.some((product) => !product.name || !product.price || !product.image || !product.category)) {
		throw new Error("Invalid product data");
	}

	productData = data;

	updateProductCards(productData);
	updateCart();
}

/* === GENERATE FUNCTIONS === */
function updateProductCards(productData) {
	const fragment = document.createDocumentFragment();

	productData.forEach((product) => {
		const productName = product.name || "Unknown Product";
		const productPrice = product.price !== undefined ? formatPrice(product.price) : "N/A";
		const productCategory = product.category || "Unknown Category";


		// Clone the template content for each product
		const templateContent = productCardTemplate.content.cloneNode(true);

		const card = templateContent.querySelector(".product-card");

		card.dataset.productName = productName;

		const productImg = card.querySelector(".product-img");
		productImg.src = getImageSrc(product);
		productImg.alt = productName;

		card.querySelector(".product-category").textContent = productCategory;
		card.querySelector(".product-name").textContent = productName;
		card.querySelector(".product-price").textContent = productPrice;

		const button = card.querySelector(".product-cart-btn");
		const addToCartDiv = card.querySelector(".add-to-cart");
		const quantityControls = card.querySelector(".quantity-controls");
		const quantitySpan = card.querySelector(".product-quantity");
		const incrementBtn = card.querySelector(".product-increment-btn");
		const decrementBtn = card.querySelector(".product-decrement-btn");

		button.addEventListener("click", () => {
			showControlsUI(quantityControls, addToCartDiv, productImg);

			let quantity = parseInt(quantitySpan.dataset.quantity);
			if (quantity === MIN_QUANTITY) {
				incrementQuantity(quantitySpan, quantity);
				addToCart(product);
			}
		});
		incrementBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			let quantity = parseInt(quantitySpan.dataset.quantity);
			incrementQuantity(quantitySpan, quantity);
			addToCart(product);
		});
		decrementBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			let quantity = parseInt(quantitySpan.dataset.quantity);
			decrementQuantity(
				quantityControls,
				addToCartDiv,
				productImg,
				quantitySpan,
				quantity
			);
			reduceFromCart(product);
		});
		fragment.appendChild(card);
	});
	productContainer.appendChild(fragment);
}
function updateCart() {
	cartList.innerHTML = "";

	if (cart.length === 0) {
		cartEmptyDiv.style.display = "block";
		cartWithProductsDiv.style.display = "none";
	} else {
		cartEmptyDiv.style.display = "none";
		cartWithProductsDiv.style.display = "block";
	}

	cartQuantity.textContent = getProductQuantity();
	cartTotalPrice.textContent = formatPrice(getTotalPrice());

	if (cart.length > 0) {
		const fragment = document.createDocumentFragment();

		cart.forEach((item) => {
			const templateContent = cartItemTemplate.content.cloneNode(true);
			const cartItem = templateContent.querySelector(".cart-item");

			cartItem.querySelector(".cart-item-title").textContent = item.name;
			cartItem.querySelector(".cart-item-quantity-value").textContent = item.quantity;
			cartItem.querySelector(".cart-item-price").textContent = formatPrice(item.price);

			const removeItemBtn = cartItem.querySelector(".remove-item-btn");

			removeItemBtn.addEventListener("click", () => {
				removeFromCart(item.name);
			});

			fragment.appendChild(cartItem);
		});
		cartList.appendChild(fragment);
	}
}

/* === AUXILIARY FUNCTIONS  === */
function formatPrice(price) {
	return Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(price);
}
function getImageSrc(product) {
	const isDesktop = window.matchMedia("(min-width: 1280px)").matches;
	const isTablet = window.matchMedia(
		"(min-width: 768px) and (max-width: 1279px)"
	).matches;

	if (isDesktop) {
		return product.image.desktop;
	} else if (isTablet) {
		return product.image.tablet;
	} else {
		return product.image.mobile;
	}
}
function getProductQuantity() {
	return cart.reduce((total, item) => {
		return total + item.quantity;
	}, 0);
}
function getTotalPrice() {
	return cart.reduce((total, item) => {
		return total + item.price * item.quantity;
	}, 0);
}

/* === CART FUNCTIONS === */
function addToCart(product) {
	const existingItem = cart.find((item) => item.name === product.name);

	if (existingItem) {
		existingItem.quantity++;
	} else {
		const productInfoForCart = {
			name: product.name,
			price: product.price,
			image: product.image.thumbnail,
			quantity: 1,
		};

		cart.push(productInfoForCart);
	}
	updateCart();
}
function reduceFromCart(product) {
	const itemIndex = cart.findIndex((item) => item.name === product.name);

	if (itemIndex !== -1) {
		let existingItem = cart[itemIndex];

		if (existingItem.quantity > 1) {
			existingItem.quantity--;
		} else {
			cart.splice(itemIndex, 1);
		}
	} else {
		console.log("Item not found in the cart.");
	}

	updateCart();
}
function removeFromCart(productName) {
	const itemIndex = cart.findIndex((cartItem) => cartItem.name === productName);

	if (itemIndex !== -1) {
		cart.splice(itemIndex, 1);

		const productCardElement = productContainer.querySelector(
			`[data-product-name="${productName}"]`
		);
		if (productCardElement) {
			const quantitySpan =
				productCardElement.querySelector(".product-quantity");
			const quantityControls =
				productCardElement.querySelector(".quantity-controls");
			const addToCartDiv = productCardElement.querySelector(".add-to-cart");
			const productImg = productCardElement.querySelector(".product-img");

			updateQuantityLabel(quantitySpan, MIN_QUANTITY);
			hideControlsUI(quantityControls, addToCartDiv, productImg);
		} else {
			console.warn(
				`Product card element not found for product: ${productName}`
			);
		}
	} else {
		console.warn(`Item ${productName} not found in the cart.`);
	}

	updateCart();
}

/* === PRODUCT CARD FUNCTIONS === */
function showControlsUI(controlsUI, addToCartUI, productImg) {
	controlsUI.style.display = "flex";
	addToCartUI.style.display = "none";
	productImg.style.borderColor = "var(--orange)";
}
function hideControlsUI(controlsUI, addToCartUI, productImg) {
	controlsUI.style.display = "none";
	addToCartUI.style.display = "flex";
	productImg.style.borderColor = "transparent";
}
function updateQuantityLabel(label, quantity) {
	label.textContent = quantity;
	label.dataset.quantity = quantity;
}
function incrementQuantity(label, quantity) {
	if (quantity < MAX_QUANTITY) {
		quantity++;
	}
	updateQuantityLabel(label, quantity);
}
function decrementQuantity(
	controlsUI,
	addToCartUI,
	productImg,
	label,
	quantity
) {
	if (quantity > MIN_QUANTITY) {
		quantity--;
	}
	if (quantity === MIN_QUANTITY) {
		hideControlsUI(controlsUI, addToCartUI, productImg);
	}
	updateQuantityLabel(label, quantity);
}

/* === MODAL === */
function updateModalUI() {
    modalProductList.innerHTML = "";

	modalTotalPrice.textContent = formatPrice(getTotalPrice());

    if (cart.length > 0) {
		confModalData = cart;

		const fragment = document.createDocumentFragment();

		confModalData.forEach((item) => {
			const templateContent = modalProductTemplate.content.cloneNode(true);
			const modalProduct = templateContent.querySelector(".modal-product");

			const modalProductImg = modalProduct.querySelector(".modal-product-image");
			modalProductImg.src = item.image;
			modalProductImg.alt = item.name;
			modalProduct.querySelector(".modal-product-title").textContent = item.name;
			modalProduct.querySelector(".modal-product-quantity-value").textContent = item.quantity;
			modalProduct.querySelector(".modal-product-price").textContent = formatPrice(item.price);


			fragment.appendChild(modalProduct);
		});
		modalProductList.appendChild(fragment);
	}
}
cartConfirmBtn.addEventListener("click", () => {
	confirmationModal.style.display = "block";

    updateModalUI();
});
modalOrderBtn.addEventListener("click", () => {
	confirmationModal.style.display = "none";

    cart = [];
    updateCart();

    const productCards = productContainer.querySelectorAll("article[data-product-name]");

    productCards.forEach(card => {
        const quantitySpan = card.querySelector(".product-quantity");
        const quantityControls = card.querySelector(".quantity-controls");
        const addToCartDiv = card.querySelector(".add-to-cart");
        const productImg = card.querySelector(".product-img");

        updateQuantityLabel(quantitySpan, MIN_QUANTITY);
        hideControlsUI(quantityControls, addToCartDiv, productImg);
	}
	);
});
window.addEventListener("click", (e) => {
	if (e.target === confirmationModal) {
		confirmationModal.style.display = "none";
	}
});
