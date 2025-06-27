export function loadFooter(): void {
  const footerContainer = document.getElementById("footer");

  fetch("/components/footer/index.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch footer");
      }
      return response.text();
    })
    .then((html) => {
      if (footerContainer) {
        footerContainer.innerHTML = html;
      }
    })
    .catch((error) => {
      console.error("Error loading footer:", error);
    });
}
