import { expect, test } from "@playwright/test";

// This suite places a real cash-on-delivery order, so it only runs when you
// point it at a store that is safe to write to: a local dev server against a
// test Supabase project, or a staging deployment.
//
//   E2E_BASE_URL=http://localhost:3000 npm run test:e2e
//
// The unit tests in tests/unit need no environment at all.
test.skip(
  !process.env.E2E_BASE_URL,
  "Set E2E_BASE_URL to run the browser checkout against a seeded store.",
);

test.describe("guest checkout", () => {
  test("a guest can go from the catalog to a placed order", async ({ page }) => {
    await page.goto("/products");

    // The catalog has to have something sellable for this flow to mean anything.
    const addButton = page
      .getByRole("button", { name: "Add", exact: true })
      .first();
    test.skip((await addButton.count()) === 0, "The catalog has no products.");

    await expect(addButton).toBeEnabled();
    await addButton.click();

    await page.goto("/cart");
    await page.getByRole("link", { name: "Proceed to Checkout" }).click();

    await expect(page).toHaveURL(/\/checkout$/);

    const deliverySelect = page.getByRole("combobox");
    // Checkout preselects the first delivery zone, so the form is ready to send
    // unless the store has no active zone at all.
    test.skip(
      await deliverySelect.isDisabled(),
      "The store has no active delivery zone.",
    );

    await page.getByLabel("Full name").fill("Playwright Tester");
    await page.getByLabel("Phone").fill("01712345678");
    await page.getByLabel("Email (optional)").fill("playwright@example.com");
    await page.getByLabel("City (optional)").fill("Dhaka");
    await page
      .getByLabel("Delivery address")
      .fill("House 12, Road 4, Banani, Dhaka 1213");
    await page.getByLabel("Notes (optional)").fill("Automated test order");

    const placeOrder = page.getByRole("button", { name: /Place Order/ });
    await expect(placeOrder).toBeEnabled();
    await placeOrder.click();

    await page.waitForURL(/\/order-success\?/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Order Successful" }),
    ).toBeVisible();

    // The order comes back with its id and a total, which is what the customer
    // needs in order to track it.
    await expect(page.getByText("Order ID")).toBeVisible();
    await expect(page.getByText("Total")).toBeVisible();

    // The cart is emptied once the order is placed.
    await page.goto("/cart");
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });
});

test.describe("order tracking", () => {
  test("an unknown reference is refused without revealing anything", async ({
    page,
  }) => {
    await page.goto("/track");

    await page.getByLabel("Order ID").fill("00000000-0000-0000-0000-000000000000");
    await page.getByLabel("Phone number").fill("01712345678");
    await page.getByRole("button", { name: "Track order" }).click();

    // The lookup needs both the id and the phone, so a wrong pair says nothing
    // about whether the order exists.
    await expect(
      page.getByText("No order matches that order ID and phone number."),
    ).toBeVisible({ timeout: 15_000 });
  });
});
