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