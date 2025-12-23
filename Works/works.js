let allProjects = [];
let currentProjectId = null;

const prevBtn = document.getElementById('slide-prev');
const nextBtn = document.getElementById('slide-next');

function renderProject(project) {
    // 1. Title: "Title (date)"
    const titleEl = document.getElementById('project-title');
    titleEl.textContent = `${project.title} (${project.date})`;

    // 2. Slideshow images
    const track = document.getElementById('slides-track');
    track.innerHTML = '';

    project.images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;                       // e.g. "Proscenium/Picture1.jpg"
        img.alt = project.title;
        track.appendChild(img);
    });

    // 3. Description paragraphs
    const textEl = document.getElementById('project-text');
    textEl.innerHTML = '';

    project.description.forEach(par => {
        const p = document.createElement('p');
        p.textContent = par;
        textEl.appendChild(p);
    });

    // 4. Initialise slideshow (no auto-slide yet, just layout + dots)
    initSlideshow(project.images.length);

}

let slideshowTimer = null;

function initSlideshow() {
    const track = document.getElementById('slides-track');
    const slides = Array.from(track.children);
    const dotsContainer = document.getElementById('slideshow-dots');
    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');


    const total = slides.length;      // 4
    const states = total;             // 4 states
    let state = 0;

    // Ensure flex basis is 50%
    slides.forEach(slide => {
        slide.style.flex = '0 0 50%';
    });

    // Measure slide width + gap in pixels
    const firstSlide = slides[0];
    const slideWidth = firstSlide.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
    const step = slideWidth + gap;    // how far we move for one state

    // ----- dots -----
    dotsContainer.innerHTML = '';
    const dots = [];
    for (let i = 0; i < states; i++) {
        const dot = document.createElement('span');
        dot.className = 'slideshow-dot' + (i === 0 ? ' is-active' : '');
        dotsContainer.appendChild(dot);
        dots.push(dot);
    }

    function setActiveDot(i) {
        dots.forEach((dot, idx) => {
            dot.classList.toggle('is-active', idx === i);
        });
    }

    function goToState(i) {
        if (i >= states) i = 0;
        state = i;

        const leftIndex = state;              // 0,1,2,3
        const offsetPx = -(leftIndex * step); // 0, -step, -2*step, -3*step
        track.style.transform = `translateX(${offsetPx}px)`;
        setActiveDot(state);
    }

    // clear old timer
    if (slideshowTimer !== null) {
        clearInterval(slideshowTimer);
        slideshowTimer = null;
    }

    // auto-advance
    slideshowTimer = setInterval(() => {
        goToState(state + 1);
    }, 5000);

    // clicking dots: jump + stop auto
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            if (slideshowTimer !== null) {
                clearInterval(slideshowTimer);
                slideshowTimer = null;
            }
            goToState(i);
        });
    });
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (slideshowTimer !== null) {
                clearInterval(slideshowTimer);
                slideshowTimer = null;
            }
            const nextState = state === 0 ? states - 1 : state - 1;
            goToState(nextState);
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            if (slideshowTimer !== null) {
                clearInterval(slideshowTimer);
                slideshowTimer = null;
            }
            goToState(state + 1);
        };
    }
    goToState(0);
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

        // fade back in
        requestAnimationFrame(() => {
            details.classList.remove('is-fading');
        });
    }, 250); // same as CSS transition duration
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
            setCurrentProject(project.id);
        });

        menu.appendChild(link);
    });

    setCurrentProject(initialProject.id);
}

document.addEventListener('DOMContentLoaded', loadProjects);