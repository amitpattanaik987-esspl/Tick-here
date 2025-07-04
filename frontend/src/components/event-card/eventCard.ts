export async function createEventCard(
  event: any,
  status: string
): Promise<string> {
  const res = await fetch("/components/event-card/index.html");
  let template = await res.text();

  const date = new Date(event.start_datetime);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  const imagePath = event.thumbnail.startsWith("http")
    ? event.thumbnail
    : `http://127.0.0.1:8000/storage/${event.thumbnail}`;

  return template
    .replace(/{{EVENT_ID}}/g, event.id) // Inject ID for click handling
    .replace(/{{EVENT_STATUS}}/g, status)
    .replace(/{{THUMBNAIL}}/g, imagePath || "./assets/images/event.jpg")
    .replace(/{{TITLE}}/g, event.title)
    .replace(/{{CATEGORY}}/g, event.category)
    .replace(/{{PRICE}}/g, event.lowest_price)
    .replace(/{{DAY}}/g, day.toString())
    .replace(/{{MONTH}}/g, month);
}
