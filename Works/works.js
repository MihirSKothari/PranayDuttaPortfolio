let allProjects;
let currentProjectId = null;

let modalImageIndex = 0;
let modalWorkList = [];
let modalInstList = [];
let modalScopeList = [];
let modalScopeIndex = 0;

let slideshowTimer = null;


function toggleLeftPanel() {
    const hamburgerBtn = document.getElementById('hamburger-toggle');
    const leftPanel = document.querySelector('.works-left');
    const leftBg = document.querySelector('.left-panel-bg');
    if (!hamburgerBtn || !leftPanel) return;

    leftPanel.classList.toggle('closed');
    hamburgerBtn.classList.toggle('open');

    if (leftBg) leftBg.classList.toggle('is-visible', !leftPanel.classList.contains('closed'));
}


const prevBtn = document.getElementById('slide-prev');
const nextBtn = document.getElementById('slide-next');
const hamburgerBtn = document.getElementById('hamburger-toggle');
const leftPanel = document.querySelector('.works-left');


function renderProject(project) {
    // 1) Title
    const titleEl = document.getElementById("project-title");
    titleEl.textContent = `${project.title} (${project.date})`;

    // 2) Slideshow track
    const track = document.getElementById("slides-track");
    track.innerHTML = "";

    // 3) Grids
    const workGrid = document.getElementById("project-grid-images");
    if (workGrid) workGrid.innerHTML = "";

    const instSection = document.getElementById("installation-img-grid");
    const instSeparator = document.getElementById("installation-separator");
    const instGrid = document.getElementById("installation-grid-images");
    const rawInst = project.installation_images ?? [];
    const hasInst =
        Array.isArray(rawInst) &&
        rawInst.length > 0 &&
        !(rawInst.length === 1 && String(rawInst[0]).trim().toUpperCase() === "NA");

    if (!hasInst) {
        if (instGrid) instGrid.innerHTML = "";
        if (instSection) instSection.hidden = true;
        if (instSeparator) instSeparator.hidden = true;
    } else {
        if (instSection) instSection.hidden = false;
        if (instSeparator) instSeparator.hidden = false;
        // continue with your existing instList creation + population
    }

    if (instGrid) instGrid.innerHTML = "";

    // 4) Build a single modal list (sequential)
    const workList = (project.work_images ?? []).map(x => ({ kind: "work", ...x }));
    const instList = (project.installation_images ?? []).map(x => ({ kind: "installation", ...x }));

    modalWorkList = workList;
    modalInstList = instList;

    modalImageList = [...workList, ...instList];

    // Helper to attach click -> openImageModal(modalIndex)
    const wireModal = (imgEl, modalIndex) => {
        imgEl.dataset.modalIndex = String(modalIndex);

        imgEl.draggable = false;
        imgEl.addEventListener("dragstart", (e) => e.preventDefault());

        imgEl.addEventListener("click", () => {
            if (window.__slideshowSuppressClick) return;
            openImageModal(modalIndex);
        });
    };


    // 5) Render slideshow from work images only (like you had)
    workList.forEach((item, i) => {
        const slideImg = document.createElement("img");
        slideImg.src = item.src;
        slideImg.alt = item.title ?? project.title;
        wireModal(slideImg, i);            // modal index == work index
        track.appendChild(slideImg);
    });

    // 6) Render work grid (same indices as workList)
    if (workGrid) {
        workList.forEach((item, i) => {
            const img = document.createElement("img");
            img.src = item.src;
            img.alt = item.title ?? project.title;
            wireModal(img, i);
            workGrid.appendChild(img);
        });
    }

    // 7) Render installation grid (indices offset by workList.length)
    if (instGrid) {
        instList.forEach((item, j) => {
            const modalIndex = workList.length + j;
            const img = document.createElement("img");
            img.src = item.src;
            img.alt = item.label ?? project.title;
            wireModal(img, modalIndex);
            instGrid.appendChild(img);
        });
    }

    // 8) Description
    const textEl = document.getElementById("project-text");
    textEl.innerHTML = "";
    (project.description ?? []).forEach(par => {
        const p = document.createElement("p");
        p.textContent = par;
        textEl.appendChild(p);
    });

    // 9)
    const videoSection = document.getElementById("video-inlay");
    const iframe = document.getElementById("project-video-iframe");
    const embedUrl = toYouTubeEmbedUrl(project.video_link);
    if (videoSection && iframe && embedUrl) {
        iframe.src = embedUrl;
        videoSection.hidden = false;
    } else if (videoSection && iframe) {
        iframe.src = "";
        videoSection.hidden = true;
    }

    // 10) Slideshow dots count (work images)
    initSlideshow(workList.length);
}

// Renders image + caption for a given index (wrap-safe)
function showModalImageAt(index) {
    const total = modalScopeList.length;
    if (!total) return;

    modalScopeIndex = (index + total) % total;
    const item = modalScopeList[modalScopeIndex];

    const imgEl = document.getElementById("image-modal_img");
    const captionEl = document.getElementById("image-modal_caption");

    imgEl.src = item.src;

    if (item.kind === "work") {
        captionEl.innerHTML = [item.title, item.medium, item.size, item.year].filter(Boolean).join("<br>");
    } else {
        captionEl.innerHTML = item.label; // or put extra installation fields here later
    }
    const modal = document.getElementById("image-modal");
    modal.classList.toggle("is-installation", item.kind === "installation");
}

// Opens the modal at a given index
function openImageModal(globalIndex) {
    const modal = document.getElementById("image-modal");
    const clicked = modalImageList[globalIndex];

    if (!clicked) return;

    if (clicked.kind === "work") {
        modalScopeList = modalWorkList;
        modalScopeIndex = globalIndex; // same index within work list
    } else {
        modalScopeList = modalInstList;
        modalScopeIndex = globalIndex - modalWorkList.length; // translate to inst index
    }

    modal.classList.add("is-open");
    showModalImageAt(modalScopeIndex);
}


function showPrevModalImage() { showModalImageAt(modalScopeIndex - 1); }

function showNextModalImage() { showModalImageAt(modalScopeIndex + 1); }

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    const imgEl = document.getElementById('image-modal_img');

    modal.classList.remove('is-open');
    imgEl.src = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('image-modal');
    const closeBtn = document.querySelector('.image-modal_close');
    const backdrop = document.querySelector('.image-modal_backdrop');
    const leftArrow = document.querySelector('.modal-arrow-left');
    const rightArrow = document.querySelector('.modal-arrow-right');

    if (closeBtn) closeBtn.addEventListener('click', closeImageModal);
    if (backdrop) backdrop.addEventListener('click', closeImageModal);
    if (leftArrow) leftArrow.addEventListener('click', showPrevModalImage);
    if (rightArrow) rightArrow.addEventListener('click', showNextModalImage);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeImageModal();
        if (e.key === 'ArrowLeft') showPrevModalImage();
        if (e.key === 'ArrowRight') showNextModalImage();
    });
    const hamburgerBtn = document.getElementById('hamburger-toggle');
    const leftPanel = document.querySelector('.works-left');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleLeftPanel);
    }
    document.addEventListener('click', (e) => {
        if (hamburgerBtn && leftPanel && !leftPanel.contains(e.target) && !hamburgerBtn.contains(e.target) && !leftPanel.classList.contains('closed')) {
            toggleLeftPanel();
        }
    });
});


function initSlideshow(totalImages) {
    const track = document.getElementById('slides-track');
    const slides = Array.from(track.children);      // image1..imageN
    const dotsContainer = document.getElementById('slideshow-dots');
    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');

    const gap = parseFloat(getComputedStyle(track).gap) || 32;  // px gap from CSS
    const states = totalImages;                                  // one state per image

    let current = 0;                                             // 0..N‑1 (image1 at 0)
    let offsets = [];                                            // offsets[i] for image i
    let dots = [];

    // ----- measure slide widths and build offsets -----
    function measure() {
        const widths = slides.map(slide => slide.getBoundingClientRect().width);
        offsets = [];
        let acc = 0;
        widths.forEach((w, i) => {
            offsets[i] = acc;               // x-position where image i starts
            acc += w + gap;
        });
    }

    function goToState(i) {
        // wrap index 0..N-1
        current = (i + states) % states;
        const offsetPx = -offsets[current];
        track.style.transform = `translateX(${offsetPx}px)`;
        setActiveDot(current);
    }

    // Dragging slideshow
    const viewport = track.parentElement; // .slideshow-container

    // Ensure it exists once (safe even if re-run)
    window.__slideshowSuppressClick = window.__slideshowSuppressClick ?? false;

    let isDown = false;
    let isDragging = false;
    let startX = 0;
    let startTranslate = 0;
    let activePointerId = null;
    let prevTransition = "";

    const DRAG_THRESHOLD = 10;

    function getCurrentTranslatePx() {
        const t = getComputedStyle(track).transform;
        if (!t || t === "none") return 0;
        return new DOMMatrixReadOnly(t).m41;
    }

    function setTranslatePx(x) {
        track.style.transform = `translateX(${x}px)`;
    }

    // Uses your existing offsets[] + goToState()
    function snapToNearest(x) {
        // x is the translateX value (negative means moved left)
        // Find nearest state by comparing -x to offsets[]
        const pos = -x;

        let best = 0;
        let bestDist = Infinity;

        for (let i = 0; i < offsets.length; i++) {
            const d = Math.abs(offsets[i] - pos);
            if (d < bestDist) {
                bestDist = d;
                best = i;
            }
        }

        goToState(best);
    }

    viewport.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;

        isDown = true;
        isDragging = false;

        // Clear any leftover suppression from a previous gesture.
        // (Still only *sets true* after a real drag begins.)
        window.__slideshowSuppressClick = false;

        activePointerId = e.pointerId;
        startX = e.clientX;
        startTranslate = getCurrentTranslatePx();
    });

    viewport.addEventListener(
        "pointermove",
        (e) => {
            if (!isDown || e.pointerId !== activePointerId) return;

            const dx = e.clientX - startX;

            // Promote to "dragging" only after threshold
            if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD) {
                isDragging = true;

                // Suppress click ONLY after successful drag trigger
                window.__slideshowSuppressClick = true;

                // Make drag feel direct (no easing while moving)
                prevTransition = track.style.transition;
                track.style.transition = "none";

                viewport.classList.add("is-dragging");

                // Capture only now so taps still behave like clicks
                viewport.setPointerCapture(activePointerId);

                if (slideshowTimer) {
                    clearInterval(slideshowTimer);
                    slideshowTimer = null;
                }
            }

            if (!isDragging) return;

            e.preventDefault();
            setTranslatePx(startTranslate + dx);
        },
        { passive: false }
    );

    function end(e) {
        if (!isDown || e.pointerId !== activePointerId) return;

        isDown = false;

        if (isDragging) {
            const dx = e.clientX - startX;
            snapToNearest(startTranslate + dx);

            viewport.classList.remove("is-dragging");
            track.style.transition = prevTransition || "";

            try {
                viewport.releasePointerCapture(activePointerId);
            } catch (_) { }

            // Only reset suppression if a drag happened
            setTimeout(() => {
                window.__slideshowSuppressClick = false;
            }, 50);
        }

        activePointerId = null;
        isDragging = false;
    }

    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);



    // ----- dots -----
    function buildDots() {
        dotsContainer.innerHTML = '';
        dots = [];
        for (let i = 0; i < states; i++) {
            const dot = document.createElement('span');
            dot.className = 'slideshow-dot' + (i === 0 ? ' is-active' : '');
            dotsContainer.appendChild(dot);
            dots.push(dot);
        }
    }

    function setActiveDot(i) {
        dots.forEach((dot, idx) => {
            dot.classList.toggle('is-active', idx === i);
        });
    }

    // ----- controls + auto-advance -----
    function setup() {
        measure();
        buildDots();
        goToState(0);                      // image1 at position1

        if (slideshowTimer) {
            clearInterval(slideshowTimer);
            slideshowTimer = null;
        }
        slideshowTimer = setInterval(() => {
            goToState(current + 1);          // next image as position1
        }, 5000);

        dots.forEach((dot, i) => {
            dot.onclick = () => {
                if (slideshowTimer) {
                    clearInterval(slideshowTimer);
                    slideshowTimer = null;
                }
                goToState(i);
            };
        });

        if (prevBtn) {
            prevBtn.onclick = () => {
                if (slideshowTimer) {
                    clearInterval(slideshowTimer);
                    slideshowTimer = null;
                }
                goToState(current - 1);
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                if (slideshowTimer) {
                    clearInterval(slideshowTimer);
                    slideshowTimer = null;
                }
                goToState(current + 1);
            };
        }
    }

    // ----- wait for images to load, then measure+setup -----
    let loaded = 0;
    slides.forEach(img => {
        if (img.complete) {
            loaded++;
            if (loaded === slides.length) setup();
        } else {
            img.onload = () => {
                loaded++;
                if (loaded === slides.length) setup();
            };
        }
    });
    if (loaded === slides.length) setup();
}


function setCurrentProject(id) {
    const project = allProjects.find(p => p.id === id);
    if (!project) return;

    const details = document.querySelector('.project-details');

    // start fade out
    details.classList.add('is-fading');

    // wait for fade-out, then swap content and fade back in
    setTimeout(() => {
        currentProjectId = id;
        renderProject(project);   // updates title, slideshow, text

        // update active class on links
        const links = document.querySelectorAll('.project-link');
        links.forEach(link => {
            const thisId = new URLSearchParams(link.href.split('?')[1]).get('id');
            link.classList.toggle('is-active', thisId === id);
        });

        // update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('id', id);
        window.history.pushState({}, '', url);
        updateProjectNavButtons() 
        // fade back in
        requestAnimationFrame(() => {
            details.classList.remove('is-fading');
        });
    }, 250); // same as CSS transition duration
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateProjectNavButtons() 
}


async function loadProjects() {
    const response = await fetch('projects.json');
    const projects = await response.json();

    allProjects = projects;

    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');
    const initialProject = projects.find(p => p.id === idFromUrl) || projects[0];

    const menu = document.getElementById('project-menu');
    menu.innerHTML = '';

    projects.forEach(project => {
        const link = document.createElement('a');
        link.href = `?id=${project.id}`;
        link.textContent = project.title;
        link.className = 'project-link';

        link.addEventListener('click', (event) => {
            event.preventDefault();
            closeLeftPanel();
            setCurrentProject(project.id);
        });

        menu.appendChild(link);
    });

    setCurrentProject(initialProject.id);
}

// Project navigation buttons at bottom
document.addEventListener("DOMContentLoaded", () => {
    const prevBtn = document.getElementById("project-prev-project");
    const nextBtn = document.getElementById("project-next-project");

    if (prevBtn) prevBtn.addEventListener("click", () => goToAdjacentProject(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => goToAdjacentProject(1));
});

function goToAdjacentProject(delta) {
    if (!Array.isArray(allProjects) || !allProjects.length || !currentProjectId) return;

    const idx = allProjects.findIndex(p => p.id === currentProjectId);
    if (idx === -1) return;

    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= allProjects.length) return; // no wrap

    closeLeftPanel?.(); // optional; keeps UI consistent
    setCurrentProject(allProjects[nextIdx].id);
}

function updateProjectNavButtons() {
    const prevBtn = document.getElementById("project-prev-project");
    const nextBtn = document.getElementById("project-next-project");
    if (!prevBtn || !nextBtn) return;

    if (!Array.isArray(allProjects) || !allProjects.length || !currentProjectId) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    const idx = allProjects.findIndex(p => p.id === currentProjectId);
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx === -1 || idx >= allProjects.length - 1;
}

function toYouTubeEmbedUrl(url) {
    if (!url) return null;

    // Accept array or string
    if (Array.isArray(url)) url = url[0];
    if (typeof url !== "string") return null;

    // Extract video id from common YouTube URL forms
    const m =
        url.match(/youtu\.be\/([^?&#/]+)/) ||
        url.match(/[?&]v=([^?&#/]+)/) ||
        url.match(/youtube\.com\/embed\/([^?&#/]+)/) ||
        url.match(/youtube\.com\/shorts\/([^?&#/]+)/);

    const id = m?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
}

function closeLeftPanel() {
    const hamburgerBtn = document.getElementById('hamburger-toggle');
    const leftPanel = document.querySelector('.works-left');
    const leftBg = document.querySelector('.left-panel-bg');
    if (!hamburgerBtn || !leftPanel) return;

    leftPanel.classList.add('closed');        // force closed
    hamburgerBtn.classList.remove('open');    // force hamburger reset
    if (leftBg) leftBg.classList.remove('is-visible');
}



document.addEventListener('DOMContentLoaded', loadProjects);