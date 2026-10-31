import path from "node:path";
import { expect, test } from "@playwright/test";

// Locators use roles and labels: Next keeps recently visited pages in the DOM (hidden),
// and getByRole/getByLabel skip hidden elements.

test("import a file, cut a turf, assign it, canvass it, see it on the dashboard", async ({ page }) => {
  // Import 5 voters in a new precinct; one is 17 and gets rejected.
  await page.goto("/voters/import");
  await page.getByLabel("Voter file (CSV)").setInputFiles(path.join(import.meta.dirname, "fixtures", "new-precinct.csv"));
  await page.getByRole("button", { name: "Import" }).click();
  const report = page.getByRole("status");
  await expect(report).toContainText("Imported 4 new and updated 0 existing voters. Skipped 1 row.");
  await expect(report).toContainText("Line 6: age must be at least 18");

  // Add a volunteer.
  await page.goto("/volunteers");
  await page.getByLabel("Name").fill("Robin Test");
  await page.getByRole("button", { name: "Add volunteer" }).click();
  await expect(page.getByRole("link", { name: "Robin Test" })).toBeVisible();

  // Build a segment: the count updates as soon as the precinct is checked.
  await page.goto("/lists/new");
  await page.getByRole("checkbox", { name: "P-99" }).check();
  const matches = page.getByRole("region", { name: "Matching voters" });
  await expect(matches).toContainText("4 voters match");
  await page.getByLabel("List name").fill("E2E turf");
  await page.getByRole("button", { name: "Create list" }).click();

  // The turf is in walk order: Aspen Ct first, then Birch St by house number.
  await expect(page.getByRole("heading", { name: "E2E turf" })).toBeVisible();
  const rows = page.getByRole("table", { name: "Voters on this list" }).getByRole("row");
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(1)).toContainText("Cara Nguyen");
  await expect(rows.nth(2)).toContainText("Ben Okafor");
  await expect(rows.nth(3)).toContainText("Dev Patel");
  await expect(rows.nth(4)).toContainText("Ana Lopez");

  // The canvass view needs a volunteer.
  await expect(page.getByRole("link", { name: "Open canvass view" })).toHaveCount(0);
  await page.getByLabel("Volunteer for E2E turf").selectOption({ label: "Robin Test" });
  await page.getByRole("button", { name: "Assign" }).click();
  await expect(page.getByLabel("Volunteer for E2E turf")).toHaveValue(/\d+/);
  await page.getByRole("link", { name: "Open canvass view" }).click();

  // One voter at a time, one tap each.
  const card = page.getByRole("form", { name: "Log contact with Cara Nguyen" });
  await expect(card).toContainText("Door 1 of 4");
  await card.getByLabel(/Notes/).fill("Wants a yard sign");
  await card.getByRole("button", { name: "Reached, 1 Strong support" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved for Cara Nguyen: Reached, strong support.");

  const ben = page.getByRole("form", { name: "Log contact with Ben Okafor" });
  await expect(ben.getByLabel(/Notes/)).toHaveValue("");
  await ben.getByRole("button", { name: "Not home" }).click();
  await expect(page.getByRole("form", { name: "Log contact with Dev Patel" })).toBeVisible();
  await expect(page.getByText("2 of 4 attempted")).toBeVisible();

  // Skipping moves on without logging anything.
  await page.getByRole("link", { name: "Skip for now" }).click();
  await expect(page.getByRole("form", { name: "Log contact with Ana Lopez" })).toBeVisible();

  // The list shows both outcomes.
  await page.goto(page.url().replace(/\/canvass.*$/, ""));
  await expect(rows.nth(1)).toContainText("Reached");
  await expect(rows.nth(1)).toContainText("1 · Strong support");
  await expect(rows.nth(1)).toContainText("Note: Wants a yard sign");
  await expect(rows.nth(2)).toContainText("Not home");

  // The dashboard counts both attempts.
  await page.getByRole("link", { name: "Dashboard" }).click();
  const precinct = page.getByRole("table", { name: "By precinct", exact: true }).getByRole("row").filter({ hasText: "P-99" });
  await expect(precinct.getByRole("cell")).toHaveText(["P-99", "4", "50%", "2", "1", "50%", "1"]);
  const list = page.getByRole("table", { name: "By list", exact: true }).getByRole("row").filter({ hasText: "E2E turf" });
  await expect(list.getByRole("cell").nth(1)).toHaveText("2 / 4");
  await expect(list.getByRole("cell").nth(2)).toHaveText("50%");
});

test("the voter table searches, filters and sorts", async ({ page }) => {
  await page.goto("/voters");
  const table = page.getByRole("table", { name: "Voters", exact: true });
  await expect(table.getByRole("row")).toHaveCount(26);

  await page.getByRole("searchbox", { name: "Search voters" }).fill("RV000001");
  await expect(table.getByRole("row")).toHaveCount(2);
  await expect(page).toHaveURL(/q=RV000001/);

  await page.getByRole("button", { name: "Clear" }).click();
  await page.getByLabel("Precinct").selectOption("P-03");
  await expect(page).toHaveURL(/precinct=P-03/);

  await table.getByRole("link", { name: "Age" }).click();
  await expect(page).toHaveURL(/sort=age&dir=asc/);
  await expect(table.getByRole("columnheader", { name: "Age" })).toHaveAttribute("aria-sort", "ascending");
  const ages = await table.getByRole("row").locator("td:nth-child(4)").allTextContents();
  expect(ages.map(Number)).toEqual([...ages.map(Number)].sort((a, b) => a - b));
});

test("the intro page leads into the demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Cut turf, log every door");

  await page.getByRole("link", { name: "Open the demo" }).first().click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
});

test("on a phone, the menu opens full height and nothing scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of ["/", "/dashboard", "/voters", "/lists/new"]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), url).toBeLessThanOrEqual(390);
  }

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Lists", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Lists", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
});

test("the list builder explains a bad range instead of guessing", async ({ page }) => {
  await page.goto("/lists/new");
  await page.getByLabel("Minimum support score").fill("80");
  await page.getByLabel("Maximum support score").fill("20");

  // Next adds its own empty role="alert" (the route announcer), so match on the text.
  await expect(page.getByRole("alert").filter({ hasText: "Minimum score is above maximum score" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create list" })).toHaveCount(0);
});
