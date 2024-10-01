import { configAPI } from './config.js';

fetch(`${configAPI.frontendAPI}/layout/header.html`)
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-container').innerHTML = data;

        const baseURL = configAPI.frontendAPI;

        const logolinks = document.querySelectorAll('#header-container #header-link');
        logolinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http')) {
            link.setAttribute('href', baseURL + href);
        }
        });

        const links = document.querySelectorAll('#header-container .nav-link');
        links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http')) {
            link.setAttribute('href', baseURL + href);
        }
        });

        const btnLinks = document.querySelectorAll('#header-container .btn');
        btnLinks.forEach(btn => {
        const href = btn.getAttribute('href');
        if (href && !href.startsWith('http')) {
            btn.setAttribute('href', baseURL + href);
        }
        });

        const images = document.querySelectorAll('#header-container a img');
        images.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http')) {
            img.setAttribute('src', baseURL + src);
        }
        });
        
        // Phát ra sự kiện khi header đã được load xong
        document.dispatchEvent(new Event('headerLoaded'));
    })
.catch(error => {
console.error('Error loading header:', error);
});
