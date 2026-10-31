import { describe, expect, it } from "vitest";
import { contactSchema, parseCanvassChoice } from "./contacts";

describe("parseCanvassChoice", () => {
  it.each([
    ["reached:1", { outcome: "reached", support: 1 }],
    ["reached:5", { outcome: "reached", support: 5 }],
    ["reached", { outcome: "reached" }],
    ["not_home", { outcome: "not_home" }],
    ["moved", { outcome: "moved" }],
    ["wrong_number", { outcome: "wrong_number" }],
  ])("reads %s", (choice, expected) => {
    expect(parseCanvassChoice(choice)).toEqual(expected);
  });

  it.each(["reached:6", "reached:0", "not_home:2", "maybe", "", null, 3])("rejects %s", (choice) => {
    expect(parseCanvassChoice(choice)).toBeNull();
  });
});

describe("contactSchema", () => {
  it("allows a support ID only with a conversation", () => {
    expect(contactSchema.safeParse({ listId: 1, voterId: 2, outcome: "reached", support: "2" }).success).toBe(true);
    expect(contactSchema.safeParse({ listId: 1, voterId: 2, outcome: "not_home", support: "2" }).success).toBe(false);
  });

  it("treats blank support and notes from a form as missing", () => {
    expect(contactSchema.parse({ listId: "1", voterId: "2", outcome: "not_home", support: "", notes: "" })).toEqual({
      listId: 1,
      voterId: 2,
      outcome: "not_home",
    });
  });
});
