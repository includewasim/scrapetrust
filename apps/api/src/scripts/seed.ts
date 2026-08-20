import { prisma } from "../lib/prisma.js";

async function main() {
  const collector = await prisma.collector.create({
    data: {
      bdCollectorId: "c_mszlws7j2aico0ee7j",
      name: "books-toscrape-mystery",
      sourceUrl: "https://books.toscrape.com/catalogue/category/books/mystery_3/index.html",
      platform: "custom",
      fieldSpec: {
        productId: "Unique product identifier from the URL slug",
        productName: "Book title",
        price: "Product price as a number",
        currency: "Currency code",
        inStock: "Whether the item is in stock, true or false",
      },
    },
  });
  console.log("Created collector:", collector.id, collector.bdCollectorId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
