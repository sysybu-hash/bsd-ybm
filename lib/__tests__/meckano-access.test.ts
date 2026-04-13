import {
  MECKANO_SUBSCRIBER_EMAIL,
  isMeckanoSubscriberEmail,
  normalizeMeckanoEmail,
} from "@/lib/meckano-access";

describe("meckano-access", () => {
  test("normalizes emails before comparison", () => {
    expect(normalizeMeckanoEmail("  JBUILDGCA@GMAIL.COM ")).toBe(MECKANO_SUBSCRIBER_EMAIL);
  });

  test("accepts the configured subscriber email regardless of casing", () => {
    expect(isMeckanoSubscriberEmail("JBUILDGCA@GMAIL.COM")).toBe(true);
    expect(isMeckanoSubscriberEmail("jbuildgca@gmail.com")).toBe(true);
  });

  test("rejects other emails", () => {
    expect(isMeckanoSubscriberEmail("someone@example.com")).toBe(false);
    expect(isMeckanoSubscriberEmail(null)).toBe(false);
  });
});
