import { describe, it, expect, vi, afterEach } from "vitest";
import dns from "node:dns";
import { ensureUsableDnsServers } from "./dnsFallback.js";

afterEach(() => vi.restoreAllMocks());

describe("ensureUsableDnsServers", () => {
  it("adds public resolvers when only loopback is configured", () => {
    vi.spyOn(dns, "getServers").mockReturnValue(["127.0.0.1"]);
    const setServers = vi.spyOn(dns, "setServers").mockImplementation(() => {});

    expect(ensureUsableDnsServers()).toBe(true);
    expect(setServers).toHaveBeenCalledWith(["1.1.1.1", "8.8.8.8"]);
  });

  it("is a no-op when a real resolver is already configured", () => {
    vi.spyOn(dns, "getServers").mockReturnValue(["192.168.1.1"]);
    const setServers = vi.spyOn(dns, "setServers").mockImplementation(() => {});

    expect(ensureUsableDnsServers()).toBe(false);
    expect(setServers).not.toHaveBeenCalled();
  });

  it("keeps any non-loopback entries and appends the public ones", () => {
    vi.spyOn(dns, "getServers").mockReturnValue(["127.0.0.1", "::1"]);
    const setServers = vi.spyOn(dns, "setServers").mockImplementation(() => {});

    ensureUsableDnsServers();
    expect(setServers).toHaveBeenCalledWith(["1.1.1.1", "8.8.8.8"]);
  });
});
