const PASSWORD = "kalai";
const STORAGE_KEY = "tailor-designs";
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80";

const defaultDesigns = [
  {
    id: crypto.randomUUID(),
    name: "Classic Silk",
    category: "normal",
    price: 1200,
    images: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=70",
    ],
    notes: "Standard blouse with clean lining and back hook closure.",
  },
  {
    id: crypto.randomUUID(),
    name: "Lotus Handwork",
    category: "design",
    price: 2650,
    images: [
      "Images/design/WhatsApp Image 2025-11-27 at 16.32.45_13458625.jpg",
      "Images/design/WhatsApp Image 2025-11-27 at 16.31.14_bc21ce90.jpg",
    ],
    notes: "Raised hand embroidery with silk threads and mirror beads.",
  },
  {
    id: crypto.randomUUID(),
    name: "Heritage Zardosi",
    category: "embroidering",
    price: 3400,
    images: ["Images/embroidering/WhatsApp Image 2025-11-27 at 16.32.16_d5065281.jpg"],
    notes: "Full sleeve blouse with zari tubes and pearl finishing.",
  },
].map(normalizeDesign);

const catalogGrid = document.getElementById("catalog-grid");
const template = document.getElementById("card-template");
const totalCount = document.getElementById("total-count");
const totalValue = document.getElementById("total-value");
const menuButtons = document.querySelectorAll(".menu__btn");

const adminBadge = document.getElementById("admin-badge");
const loginForm = document.getElementById("login-form");
const passwordInput = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const designForm = document.getElementById("design-form");

const modal = document.getElementById("image-modal");
const modalImage = document.getElementById("modal-image");
const modalTitle = document.getElementById("modal-title");
const modalClose = document.getElementById("modal-close");
const modalPrev = document.getElementById("modal-prev");
const modalNext = document.getElementById("modal-next");
const modalThumbs = document.getElementById("modal-thumbs");

let designs = loadDesigns();
let activeCategory = "all";
let isAdmin = false;
let modalImages = [];
let modalIndex = 0;
let modalDesignName = "";

render();
setupMenu();
setupAdmin();
setupModal();

function loadDesigns() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.map(normalizeDesign);
    } catch (err) {
      console.warn("Failed to parse saved designs. Resetting.", err);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDesigns));
  return structuredClone(defaultDesigns);
}

function saveDesigns() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
}

function render() {
  catalogGrid.innerHTML = "";
  const filtered =
    activeCategory === "all"
      ? designs
      : designs.filter((d) => d.category === activeCategory);

  filtered.forEach((design) => {
    const card = template.content.cloneNode(true);
    const img = card.querySelector("img");
    const zoomBtn = card.querySelector(".card__zoom");
    const removeBtn = card.querySelector(".card__remove");
    const thumbsWrap = card.querySelector(".card__thumbs");

    img.src = design.images[0] || PLACEHOLDER_IMAGE;
    img.alt = design.name;
    card.querySelector(".card__category").textContent =
      prettyName(design.category);
    card.querySelector(".card__title").textContent = design.name;
    card.querySelector(".card__notes").textContent = design.notes;
    card.querySelector(".card__price").textContent = `₹${design.price.toLocaleString()}`;

    zoomBtn.addEventListener("click", () => openModal(design));

    if (design.images.length > 1) {
      thumbsWrap.classList.remove("hidden");
      design.images.slice(0, 4).forEach((thumbSrc, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const thumbImg = document.createElement("img");
        thumbImg.src = thumbSrc;
        thumbImg.alt = `${design.name} preview ${index + 1}`;
        btn.appendChild(thumbImg);
        btn.addEventListener("click", () => openModal(design, index));
        thumbsWrap.appendChild(btn);
      });
    }

    if (isAdmin) {
      removeBtn.classList.remove("hidden");
      removeBtn.addEventListener("click", () => removeDesign(design.id));
    }

    catalogGrid.appendChild(card);
  });

  const stats = designs.reduce(
    (acc, d) => {
      acc.value += Number(d.price) || 0;
      return acc;
    },
    { value: 0 }
  );

  totalCount.textContent = `${designs.length} designs in studio`;
  totalValue.textContent = `₹${stats.value.toLocaleString()} combined price`;
}

function setupMenu() {
  menuButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      menuButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      render();
    })
  );
  menuButtons[0].classList.add("active");
}

function setupAdmin() {
  loginBtn.addEventListener("click", () => {
    if (passwordInput.value === PASSWORD) {
      toggleAdmin(true);
    } else {
      alert("Incorrect password.");
    }
  });

  logoutBtn.addEventListener("click", () => toggleAdmin(false));

  designForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const imageInput = document.getElementById("design-images").value;
    const images = imageInput
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean);

    const payload = {
      id: crypto.randomUUID(),
      name: document.getElementById("design-name").value.trim(),
      category: document.getElementById("design-category").value,
      price: Number(document.getElementById("design-price").value),
      images,
      notes: document.getElementById("design-notes").value.trim(),
    };

    if (!payload.name || !payload.category || !payload.images.length) {
      alert("All fields are required. Add at least one image.");
      return;
    }

    designs.unshift(normalizeDesign(payload));
    saveDesigns();
    render();
    designForm.reset();
  });
}

function toggleAdmin(state) {
  isAdmin = state;
  loginForm.classList.toggle("hidden", state);
  adminBadge.classList.toggle("hidden", !state);
  designForm.classList.toggle("hidden", !state);
  if (!state) {
    passwordInput.value = "";
  }
  render();
}

function removeDesign(id) {
  const confirmation = confirm("Remove this design from the catalog?");
  if (!confirmation) return;
  designs = designs.filter((design) => design.id !== id);
  saveDesigns();
  render();
}

function setupModal() {
  modalClose.addEventListener("click", closeModal);
  modalPrev.addEventListener("click", () => stepModal(-1));
  modalNext.addEventListener("click", () => stepModal(1));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (modal.classList.contains("hidden")) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "ArrowRight") stepModal(1);
    if (event.key === "ArrowLeft") stepModal(-1);
  });
}

function openModal(design, startIndex = 0) {
  modalDesignName = design.name;
  modalImages = design.images.length ? [...design.images] : [PLACEHOLDER_IMAGE];
  modalIndex = Math.min(Math.max(startIndex, 0), modalImages.length - 1);
  updateModalImage();
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function stepModal(direction) {
  if (modalImages.length <= 1) return;
  modalIndex = (modalIndex + direction + modalImages.length) % modalImages.length;
  updateModalImage();
}

function updateModalImage() {
  modalImage.src = modalImages[modalIndex];
  modalTitle.textContent = `${modalDesignName} (${modalIndex + 1}/${modalImages.length})`;
  modalPrev.disabled = modalImages.length <= 1;
  modalNext.disabled = modalImages.length <= 1;
  renderModalThumbs();
}

function renderModalThumbs() {
  if (modalImages.length <= 1) {
    modalThumbs.classList.add("hidden");
    modalThumbs.innerHTML = "";
    return;
  }
  modalThumbs.classList.remove("hidden");
  modalThumbs.innerHTML = "";
  modalImages.forEach((src, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal__thumb" + (index === modalIndex ? " is-active" : "");
    const thumbImg = document.createElement("img");
    thumbImg.src = src;
    thumbImg.alt = `${modalDesignName} view ${index + 1}`;
    button.appendChild(thumbImg);
    button.addEventListener("click", () => {
      modalIndex = index;
      updateModalImage();
    });
    modalThumbs.appendChild(button);
  });
}

function closeModal() {
  modal.classList.add("hidden");
  modalImage.src = "";
  modalTitle.textContent = "";
  modalThumbs.innerHTML = "";
  document.body.classList.remove("modal-open");
}

function prettyName(category) {
  return {
    normal: "Normal Blouse",
    design: "Design Blouse",
    embroidering: "Embroidering",
  }[category];
}

function normalizeDesign(raw) {
  const images = Array.isArray(raw.images)
    ? raw.images
    : raw.image
    ? [raw.image]
    : [];
  const cleanedImages = images
    .map((url) => (typeof url === "string" ? url.trim() : ""))
    .filter(Boolean);

  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? "Untitled Design",
    category: raw.category ?? "normal",
    price: Number(raw.price) || 0,
    images: cleanedImages.length ? cleanedImages : [PLACEHOLDER_IMAGE],
    notes: raw.notes ?? "",
  };
}

