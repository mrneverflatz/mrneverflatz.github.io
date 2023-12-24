const swiper = new Swiper(".swiper", {
  // Optional parameters
  //   direction: "vertical",
  loop: true,
  //   centeredSlidesBounds: true,
  //   centeredSlides: true,
  centerInsufficientSlides: true,

  slidesPerView: 4,
  spaceBetween: 40,

  //   // If we need pagination
  //   pagination: {
  //     el: ".swiper-pagination",
  //   },

  //   // Navigation arrows
  //   navigation: {
  //     nextEl: ".swiper-button-next",
  //     prevEl: ".swiper-button-prev",
  //   },

  //   // And if we need scrollbar
  //   scrollbar: {
  //     el: ".swiper-scrollbar",
  //   },
});

const el = document.querySelector("header.main-header");
const observer = new IntersectionObserver(
  ([e]) => {
    e.target.classList.toggle("scrolled", e.intersectionRatio < 1);
  },
  { threshold: [1] }
);
observer.observe(el);
