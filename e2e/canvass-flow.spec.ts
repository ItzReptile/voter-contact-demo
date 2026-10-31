import path from "node:path";
import { expect, test } from "@playwright/test";

// Locators use roles and labels: Next keeps recently visited pages in the DOM (hidden),
// and getByRole/getByLabel skip hidden elements.

test("import a file, cut a turf, assign it, log contacts, see them on the dashboard", async ({ page }) => {
  // Import 5 voters in a new precinct; one is 17 and gets rejected.
  await page.goto("/voters");
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

  // Segment: door knocking in P-99.
  await page.goto("/lists/new");
  await page.getByRole("checkbox", { name: "P-99" }).check();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByRole("heading", { name: "4 voters match" })).toBeVisible();
  await page.getByLabel("List name").fill("E2E turf");
  await page.getByRole("button", { name: "Create list" }).click();

  // The turf is in walk order: Aspen Ct first, then Birch St by house number.
  await expect(page.getByRole("heading", { name: "E2E turf" })).toBeVisible();
  const voters = page.getByRole("list", { name: "Voters on this list" }).getByRole("listitem");
  await expect(voters).toHaveCount(4);
  await expect(voters.nth(0)).toContainText("Cara Nguyen");
  await expect(voters.nth(1)).toContainText("Ben Okafor");
  await expect(voters.nth(2)).toContainText("Dev Patel");
  await expect(voters.nth(3)).toContainText("Ana Lopez");

  // Contacts can't be logged until the list has a volunteer.
  const cara = page.getByRole("form", { name: "Log contact with Cara Nguyen" });
  await expect(cara.getByRole("button", { name: "Save" })).toBeDisabled();
  await page.getByLabel("Volunteer for E2E turf").selectOption({ label: "Robin Test" });
  await page.getByRole("button", { name: "Assign" }).click();
  await expect(page.getByLabel("Volunteer for E2E turf")).toHaveValue(/\d+/);
  await expect(cara.getByRole("button", { name: "Save" })).toBeEnabled();

  // A conversation with a support ID and a note.
  await cara.getByLabel("Outcome").selectOption("reached");
  await cara.getByLabel("Support").selectOption("1");
  await cara.getByLabel("Notes").fill("Wants a yard sign");
  await cara.getByRole("button", { name: "Save" }).click();
  await expect(voters.nth(0)).toContainText("Reached · 1 Strong support · 1 attempt");
  await expect(voters.nth(0)).toContainText("Wants a yard sign");
  await expect(cara.getByLabel("Outcome")).toHaveValue("");

  // A not-home: no support ID allowed.
  const ben = page.getByRole("form", { name: "Log contact with Ben Okafor" });
  await ben.getByLabel("Outcome").selectOption("not_home");
  await expect(ben.getByLabel("Support")).toBeDisabled();
  await ben.getByRole("button", { name: "Save" }).click();
  await expect(voters.nth(1)).toContainText("Not home / no answer");

  // "Not yet reached" hides Cara but keeps Ben for another knock.
  await page.getByRole("link", { name: "Not yet reached" }).click();
  await expect(voters).toHaveCount(3);
  await expect(voters.nth(0)).toContainText("Ben Okafor");

  // The dashboard counts both attempts.
  await page.getByRole("link", { name: "Dashboard" }).click();
  const precinct = page.getByRole("table", { name: "By precinct" }).getByRole("row").filter({ hasText: "P-99" });
  await expect(precinct.getByRole("cell")).toHaveText(["P-99", "4", "50%", "2", "1", "50%", "1"]);
  const list = page.getByRole("table", { name: "By list" }).getByRole("row").filter({ hasText: "E2E turf" });
  await expect(list.getByRole("cell")).toHaveText(["E2E turf", "Door knocking", "Robin Test", "2 / 4", "2", "1", "50%"]);
});

test("the segment builder explains a bad range instead of guessing", async ({ page }) => {
  await page.goto("/lists/new");
  await page.getByLabel("Minimum support score").fill("80");
  await page.getByLabel("Maximum support score").fill("20");
  await page.getByRole("button", { name: "Preview" }).click();

  // Next adds its own empty role="alert" (the route announcer), so match on the text.
  await expect(page.getByRole("alert").filter({ hasText: "Minimum score is above maximum score" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create list" })).toHaveCount(0);
});
