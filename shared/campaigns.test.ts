import { describe, expect, it } from "vitest";
import {
  canApplyToCampaign,
  canReviewApplication,
  canReviewDelivery,
  canSubmitDelivery,
  canTransitionCampaignStatus,
  getCampaignPublishIssues,
  validateSampleAddress,
} from "./campaigns";

describe("campaign status transitions", () => {
  it("allows draft → published → closed", () => {
    expect(canTransitionCampaignStatus("draft", "published")).toBe(true);
    expect(canTransitionCampaignStatus("published", "closed")).toBe(true);
    expect(canTransitionCampaignStatus("closed", "published")).toBe(false);
  });
});

describe("canApplyToCampaign", () => {
  const open = new Date("2026-01-01T00:00:00Z");
  const close = new Date("2026-01-31T23:59:59Z");

  it("rejects draft and closed", () => {
    expect(canApplyToCampaign({ status: "draft", applicationOpensAt: open, applicationClosesAt: close }).ok).toBe(
      false
    );
    expect(canApplyToCampaign({ status: "closed", applicationOpensAt: open, applicationClosesAt: close }).ok).toBe(
      false
    );
  });

  it("respects application window", () => {
    expect(
      canApplyToCampaign({
        status: "published",
        applicationOpensAt: open,
        applicationClosesAt: close,
        now: new Date("2026-01-15T12:00:00Z"),
      }).ok
    ).toBe(true);
    expect(
      canApplyToCampaign({
        status: "published",
        applicationOpensAt: open,
        applicationClosesAt: close,
        now: new Date("2025-12-01T12:00:00Z"),
      }).ok
    ).toBe(false);
    expect(
      canApplyToCampaign({
        status: "published",
        applicationOpensAt: open,
        applicationClosesAt: close,
        now: new Date("2026-02-01T12:00:00Z"),
      }).ok
    ).toBe(false);
  });
});

describe("publish issues", () => {
  it("requires core fields", () => {
    const issues = getCampaignPublishIssues({});
    expect(issues.length).toBeGreaterThan(3);
  });

  it("validates date order", () => {
    const issues = getCampaignPublishIssues({
      title: "Campanha",
      briefing: "Brief",
      brandId: 1,
      productIds: [1],
      applicationOpensAt: "2026-02-01T00:00:00Z",
      applicationClosesAt: "2026-01-01T00:00:00Z",
      deliveryDeadline: "2026-03-01T00:00:00Z",
    });
    expect(issues.some(i => i.includes("fim das candidaturas"))).toBe(true);
  });
});

describe("deliveries and reviews", () => {
  it("only approved participants can deliver", () => {
    expect(
      canSubmitDelivery({
        campaignStatus: "published",
        applicationStatus: "pending",
        latestDeliveryStatus: null,
      }).ok
    ).toBe(false);
    expect(
      canSubmitDelivery({
        campaignStatus: "published",
        applicationStatus: "approved",
        latestDeliveryStatus: null,
      }).ok
    ).toBe(true);
    expect(
      canSubmitDelivery({
        campaignStatus: "published",
        applicationStatus: "approved",
        latestDeliveryStatus: "submitted",
      }).ok
    ).toBe(false);
    expect(
      canSubmitDelivery({
        campaignStatus: "closed",
        applicationStatus: "approved",
        latestDeliveryStatus: "changes_requested",
      }).ok
    ).toBe(true);
  });

  it("reviews only from pending/submitted", () => {
    expect(canReviewApplication("pending", "approved")).toBe(true);
    expect(canReviewApplication("approved", "rejected")).toBe(false);
    expect(canReviewDelivery("submitted", "changes_requested")).toBe(true);
    expect(canReviewDelivery("approved", "submitted")).toBe(false);
  });
});

describe("sample address", () => {
  it("requires fields when present", () => {
    expect(validateSampleAddress(null).length).toBeGreaterThan(0);
    expect(
      validateSampleAddress({
        fullName: "Ana",
        phone: "11999999999",
        street: "Rua A",
        number: "10",
        neighborhood: "Centro",
        city: "SP",
        state: "SP",
        zip: "01000-000",
      })
    ).toEqual([]);
  });
});
