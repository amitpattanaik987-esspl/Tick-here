import { fetchCategories } from "../../utils/helper.js";

export async function renderTagCategories(
  selector: string,
  onRendered?: () => void
): Promise<void> {
  try {
    const categories = await fetchCategories();

    if (categories) {
      const container = $(selector);

      container.empty();

      const html = [
        `<div class="category-active category-filter rounded-full border border-[#0a0418] px-4 py-2 uppercase cursor-pointer bg-white text-[#45006e] bg-clip-text" data-category="All">All</div>`,
        ...categories.map(
          (cat) => `
            <div class="category-filter rounded-full border border-[#0a0418] px-4 py-2 uppercase cursor-pointer bg-white text-[#45006e] bg-clip-text" data-category="${cat.name}">
              ${cat.name}
            </div>`
        ),
      ].join("");

      container.html(html);

      if (onRendered) onRendered(); // trigger once rendering done
    }
  } catch (error) {
    console.error(error);
  }
}
