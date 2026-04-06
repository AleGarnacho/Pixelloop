const images = ["img1.jpg", "img2.jpg", "img3.jpg", "img4.jpg", "img5.jpg"];

const collage = document.getElementById("collage");

images.forEach((src) => {
  const img = document.createElement("img");
  img.src = src;

  // posisi random
  img.style.top = Math.random() * 100 + "%";
  img.style.left = Math.random() * 100 + "%";

  // rotate random
  img.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;

  collage.appendChild(img);
});
