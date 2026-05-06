 const accessKey = 'hupA83b6cwiissjLLJNE0zCq_BSYiiBgVix0-WQ80Bw';

    const gallery = document.getElementById('gallery');
    const loader = document.getElementById('loader');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    let page = 1;
    let perPage = 15;
    let currentQuery = '';
    let isLoading = false;
    let totalPages = Infinity;

    // Build and append a styled card for a single Unsplash image object
    function appendImageCard(img) {
      const card = document.createElement('div');
      card.className = 'image-card';

      const wrap = document.createElement('div');
      wrap.className = 'image-wrap';

      const image = document.createElement('img');
      // use regular/small url for layout, unsplash provides multiple sizes
      image.src = img.urls.regular || img.urls.small;
      image.alt = img.alt_description || (img.description || 'Unsplash image');

      wrap.appendChild(image);

      const meta = document.createElement('div');
      meta.className = 'meta-row';

      const credit = document.createElement('div');
      credit.className = 'credit';
      const userName = img.user && img.user.name ? img.user.name : 'Unknown';
      const userLink = img.user && img.user.links && img.user.links.html ? img.user.links.html : '#';
      credit.innerHTML = `Photo by <a href="${userLink}" target="_blank" rel="noopener noreferrer">${userName}</a>`;

      // Create download anchor using Unsplash download link (recommended)
       
      // use links.download (Unsplash expects you to hit this URL to register a download)
      
      const dl = document.createElement("button");
      dl.className = "download-btn";
      dl.title = "Download image";
      dl.textContent = "⬇";

// Download handler
dl.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    //  Get the official download URL (registers the download)
    const track = await fetch(`${img.links.download_location}?client_id=${accessKey}`);
    const trackData = await track.json();

    // Fetch the actual image file
    const imageResponse = await fetch(trackData.url);
    const blob = await imageResponse.blob();

    // Create a temporary <a> to trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${img.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Sorry, this image could not be downloaded.");
  }
});

      meta.appendChild(credit);
      meta.appendChild(dl);

      card.appendChild(wrap);
      card.appendChild(meta);

      gallery.appendChild(card);
    }

    // fetch from Unsplash. If query is empty -> random photos, else search endpoint.
    async function loadImages(){
      if(isLoading) return;
      if(page > totalPages) return;
      isLoading = true;
      loader.style.display = 'block';

      // choose endpoint
      let endpoint;
      if(currentQuery && currentQuery.length){
        endpoint = `https://api.unsplash.com/search/photos?page=${page}&per_page=${perPage}&query=${encodeURIComponent(currentQuery)}&client_id=${accessKey}`;
      } else {
        // random photos endpoint
        endpoint = `https://api.unsplash.com/photos/random?count=${perPage}&client_id=${accessKey}`;
      }

      try {
        const res = await fetch(endpoint);
        if(!res.ok){
          // helpful console message for debugging
          console.error('Unsplash fetch failed:', res.status, res.statusText);
          loader.textContent = `Error: ${res.status} ${res.statusText}`;
          isLoading = false;
          return;
        }

        const data = await res.json();
        let images = [];
        if(currentQuery && currentQuery.length){
          images = data.results || [];
          // track total pages so infinite stops appropriately
          totalPages = data.total_pages || totalPages;
        } else {
          images = Array.isArray(data) ? data : [];
        }

        if(images.length === 0 && page === 1){
          loader.textContent = 'No images found.';
        } else {
          // append cards
          images.forEach(img => appendImageCard(img));
          loader.style.display = 'none';
        }
        isLoading = false;
      } catch (err){
        console.error('Fetch error:', err);
        loader.textContent = 'Network error while loading images.';
        isLoading = false;
      }
    }

    // infinite scroll
    window.addEventListener('scroll', () => {
      if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 900){
        // For random endpoint we don't use page, so incrementing page still triggers more random calls
        page++;
        loadImages();
      }
    });

    // search handling
    function doSearch(){
      currentQuery = searchInput.value.trim();
      page = 1;
      totalPages = Infinity;
      gallery.innerHTML = ''; // clear existing
      loader.textContent = 'Searching...';
      loadImages();
    }

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') { e.preventDefault(); doSearch(); }
    });

    // initial load
    loadImages();

    const navLinks = document.querySelectorAll('.nav-links a');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const query = link.dataset.query;

    // highlight active link
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    // update search
    currentQuery = query;
    searchInput.value = query; // show in search box
    page = 1;
    totalPages = Infinity;
    gallery.innerHTML = '';
    loader.textContent = `Loading ${query} images...`;
    loadImages();
  });
});
