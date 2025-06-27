import { fetchCategories } from "../../utils/helper.js";

export async function renderHomeCategories(
  containerSelector: string
): Promise<void> {
  const container = $(containerSelector);
  const icons: Record<string, string> = {
    Comedy: "./assets/images/comedy.png",
    Kids: "./assets/images/kids.png",
    Music: "./assets/images/music.png",
    Workshops: "./assets/images/workshops.png",
    Performance: "./assets/images/performance.png",
    Sports: "./assets/images/sports.png",
  };

  try {
    const categories = await fetchCategories();

    const html = categories
      .map(
        (category, index) => `
      <div 
        class="cursor-pointer flex flex-col items-center justify-center p-4 border border-purple-300 rounded-md bg-white home-category" 
        data-category="${category.name}" 
        data-index="${index}"
      >
        <img src="${
          icons[category.name] || "./assets/images/default.png"
        }" alt="${category.name}" class="w-14 h-14 mb-2" />
        <span class="text-md">${category.name}</span>
      </div>
    `
      )
      .join("");

    container.html(html);

    // this click event triggers after the category section rendered and when the user clicks on any category he/she redirects to the events page withe the selected category
    $(".home-category").on("click", function () {
      const category = $(this).data("category");
      if (category) {
        sessionStorage.setItem("selectedCategory", JSON.stringify(category));
        window.location.href = "/events";
      }
    });
  } catch (error) {
    console.error(error);
  }
}
