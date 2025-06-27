export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    India:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrIJbX-6MVfN4u1_xWs8A7eADfLg1lU9k7oA&s",
    USA: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwwxhCMpFSg4qToHq_HKLhhU6bo5f1JJPh8w&s",
    UK: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQN6NjUzMsxiPYELyWrKg17MA4eLo47fkkM2w&s",
    Canada:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdeETsRR_KlKSJIsXWFjDo5RJu0q7ajcb4mw&s",
    Australia:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQT_K0zXpTtFrzz1KPWuXpKaRj0nVBvC-ppw&s",
    UAE: "https://static.vecteezy.com/system/resources/thumbnails/001/416/661/small/uae-isolated-flag-vector.jpg",
    Japan:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdZUHw_lbYQKcGEJLkkrM7KkiBawky-bj7wA&s",
  };
  return flags[country] || "🏳️";
}

interface Category {
  id: number;
  name: string;
}

// fetch the category data from backend
export function fetchCategories(): Promise<Category[]> {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: "http://127.0.0.1:8000/api/categories",
      method: "GET",
      success: function (res: any) {
        resolve(res.data); // array of strings
      },
      error: function (err) {
        reject("Failed to fetch categories.");
      },
    });
  });
}
