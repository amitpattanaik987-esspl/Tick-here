export async function createEventCard(event: any): Promise<string> {
  const res = await fetch("/components/event-card/index.html");
  let template = await res.text();

  const date = new Date(event.start_datetime);
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });

  return template
    .replace(/{{EVENT_ID}}/g, event.id) // Inject ID for click handling
    .replace(/{{THUMBNAIL}}/g, event.thumbnail || "./assets/images/event.jpg")
    .replace(/{{TITLE}}/g, event.title)
    .replace(/{{CATEGORY}}/g, event.category)
    .replace(/{{PRICE}}/g, event.lowest_price)
    .replace(/{{DAY}}/g, day.toString())
    .replace(/{{MONTH}}/g, month);
}
